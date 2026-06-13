import { useEffect, useRef, useState } from 'react';
import { getStroke } from 'perfect-freehand';
import { IS } from '../../lib/typography';
import { PILL, CTA } from '../../lib/chromeStyles';
import { SvgStyleTransform } from '../canvas/SvgStyleTransform';
import { prepareSvgUpload } from '../../lib/svgUpload';
import { COVERAGE_BANDS } from '../../lib/smart/coverage';
import {
  createToneGrid,
  beginToneStroke,
  stampToneCapsule,
  extractToneFills,
  rasterizeToneFills,
  rasterizeFillPatch,
  type ToneMaskGrid,
  type ToneFill,
} from '../../lib/toneMask';
import {
  extractPoolRegions,
  pointInLoop,
  poolCenter,
  normalizeStrokePoints,
  rdpPoints,
  strokesKey,
  RDP_EPSILON,
  WORLD_SCALE,
  SOLID_INK_RADIUS,
  SOLID_MAX_GRID_RESOLUTION,
  REGION_EXTRACTOR_VERSION,
  type StrokeInputPoint,
} from '../../lib/geometry3d/strokeTo3d';
import { pushShadeFillEntry, type ShadeFillGesture } from '../../lib/shadeFillLog';
import {
  fitStroke,
  applyCandidate as applyShapeCandidate,
  type ShapeCandidate,
  type ShapeFitResult,
  type SnapAction,
} from '../../lib/draw/shapeFit';

// ─── Shape Assist API (Rock F3) ──────────────────────────────────────────────
// SEBS'S LAW: freehand is the DEFAULT. Snap/Straighten are ACTION VERBS the
// host's chrome pills invoke on the LAST stroke ON DEMAND — never on pen-up,
// never auto. DrawSurface owns `strokes`, so it owns the apply; the host owns
// the chip (rendered by the pills, per the toggles-in-chrome rule). This API
// is the seam: the host fits + applies + cycles through it, never reaching into
// stroke state directly. `originalPoints` lets the host restore the drawn
// stroke (chip → Original) without DrawSurface keeping per-stroke undo memory.
export interface ShapeSnapApi {
  /** The stroke Snap/Straighten will target — the SELECTED stroke if the user
   *  tapped an earlier one, else the LAST committed stroke (spec §3 + round-8
   *  "select different part"). Null when none exists. The name stays `lastStroke`
   *  so the host's existing call site is unchanged; "target stroke" is the
   *  precise meaning now. */
  lastStroke: () => { id: string; points: StrokePoint[] } | null;
  /** Fit the TARGET stroke (selected, else last) under the given action — pure,
   *  no mutation. The host decides whether to apply (accept) or surface a
   *  refusal note. */
  fitLast: (action: SnapAction) => { strokeId: string; result: ShapeFitResult } | null;
  /** Replace a stroke's points with a candidate's clean geometry (Apply /
   *  chip cycle). Pass the chip's remembered ORIGINAL points for the candidate
   *  kind 'original' (restore). Stays a stroke — same id, renders in the pen. */
  applyToStroke: (strokeId: string, candidate: ShapeCandidate, originalPoints: StrokePoint[]) => void;
}

// ─── DrawSurface — pointer-event freehand capture + SvgStyleTransform render ──
// Extracted 2026-06-11 from DeskDoodlesCanvas.tsx (mechanical move, zero
// behavior change on /canvas). Hosted by BOTH the /canvas page and the
// DrawPanel popup in the real desk flow (/desk).

export type StrokePoint = [number, number, number]; // x, y, pressure
export type Stroke = { id: string; points: StrokePoint[] };

export type CanvasMode = 'svg' | '3d';
export type InputMode = 'draw' | 'upload-svg' | 'upload-image';

// The draw frame's coordinate space — every stroke is captured in these
// viewBox units (module-scope so the backdrop compose helpers below share
// the exact same space as the component's capture svg).
export const VIEWBOX_W = 800;
export const VIEWBOX_H = 600;

/** Fit a set of stored strokes into the draw frame (CASE-2 redraw bug). Strokes
 *  are captured in raw VIEWBOX_W×VIEWBOX_H space, but a doodle drawn small/offset
 *  (or spanning past the edges) reloads into the redraw canvas tiny/displaced or
 *  cut off — NOT matching the tight-bbox card view. Scale+center the gesture's
 *  bbox to fill the frame (minus pad), preserving aspect. The save path
 *  (strokesToObjectMarkup) re-derives a tight bbox at Done, so this only affects
 *  the editing view, never the persisted markup. Verified visually (small/offset
 *  + edge-spanning fixtures) before wiring. */
export function fitStrokesToFrame(
  strokes: StrokePoint[][],
  frameW = VIEWBOX_W,
  frameH = VIEWBOX_H,
  pad = 40,
): StrokePoint[][] {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const s of strokes) {
    for (const [x, y] of s) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  const sw = maxX - minX, sh = maxY - minY;
  if (!(sw > 0) && !(sh > 0)) return strokes; // single point / empty — leave as-is
  const availW = frameW - pad * 2, availH = frameH - pad * 2;
  const scale = Math.min(availW / (sw || 1), availH / (sh || 1));
  const offX = pad + (availW - sw * scale) / 2 - minX * scale;
  const offY = pad + (availH - sh * scale) / 2 - minY * scale;
  return strokes.map((s) =>
    s.map(([x, y, p]): StrokePoint => [x * scale + offX, y * scale + offY, p ?? 0.5]),
  );
}

export const STROKE_OPTS = {
  size: 4,
  thinning: 0.5,
  smoothing: 0.5,
  streamline: 0.5,
  easing: (t: number) => t,
  simulatePressure: true,
};

/** Convert raw stroke points to a perfect-freehand polygon d-string.
 *  Used for the FOREGROUND live-stroke and CLEAN-style background render —
 *  produces the variable-width inked-stroke look. */
export function strokeToPolygonPath(points: StrokePoint[]): string {
  if (points.length === 0) return '';
  const outline = getStroke(points, STROKE_OPTS);
  if (outline.length === 0) return '';
  return outline.reduce(
    (acc, [x, y], i) => acc + (i === 0 ? `M ${x.toFixed(2)} ${y.toFixed(2)}` : ` L ${x.toFixed(2)} ${y.toFixed(2)}`),
    '',
  ) + ' Z';
}

/** Convert raw stroke points to a stroke-only polyline d-string (no fill).
 *  Used for the BACKGROUND Smart-Hachure-styled render — Smart Hachure's
 *  outline pipeline filters out filled paths, so we feed it a stroke-only
 *  version of the user's gesture instead. Loses variable-width character
 *  but gains style-pipeline transformability (wobble / jaggedness / etc). */
/** Build the stroke-only SVG markup for ONE desk object — the polyline
 *  commit-layer form (fill="none" + stroke) that survives Smart Hachure,
 *  same shape as /canvas's committed layer (its outline pipeline drops
 *  filled paths). The viewBox is the tight bbox of the gesture (+pad) so
 *  normalizeSvgSize at the desk's add boundary scales the DOODLE to
 *  ~180px, not the whole 800×600 draw frame. */
export function strokesToObjectMarkup(strokes: Stroke[], toneFills: ToneFill[] = []): string {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const stroke of strokes) {
    for (const [x, y] of stroke.points) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  // Tone patches join the tight bbox — a brushed region can extend past the
  // ink, and clipping a band statement would silently rewrite it.
  for (const fill of toneFills) {
    for (const [x, y] of fill.points) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  const pad = 6; // breathing room for the 3px stroke + round caps
  const r = (v: number) => (Math.round(v * 100) / 100).toString();
  const vb = `${r(minX - pad)} ${r(minY - pad)} ${r(maxX - minX + pad * 2)} ${r(maxY - minY + pad * 2)}`;
  // Tone UNDER ink: patches first in document order, strokes paint on top.
  const tonePaths = toneFillsMarkup(toneFills);
  const paths = strokes
    .map(
      (stroke) =>
        `<path d="${strokeToPolylinePath(stroke.points)}" fill="none" stroke="var(--dir-text-primary)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`,
    )
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">${tonePaths}${paths}</svg>`;
}

/** Size-guard a stroke record (strokes-in-the-record contract): round coords,
 *  then halve point density until the JSON fits the row budget (~45KB). */
export function capStrokes(raw: Stroke[]): StrokePoint[][] {
  let pts: StrokePoint[][] = raw.map((st) =>
    st.points.map(([x, y, pr]) => [
      Math.round(x * 10) / 10,
      Math.round(y * 10) / 10,
      Math.round(pr * 100) / 100,
    ] as StrokePoint),
  );
  while (JSON.stringify(pts).length > 45000) {
    const before = JSON.stringify(pts).length;
    pts = pts.map((st) =>
      st.length > 8 ? st.filter((_, i) => i % 2 === 0 || i === st.length - 1) : st,
    );
    if (JSON.stringify(pts).length >= before) break;
  }
  return pts;
}

export function strokeToPolylinePath(points: StrokePoint[]): string {
  if (points.length === 0) return '';
  return points.reduce(
    (acc, [x, y], i) => acc + (i === 0 ? `M ${x.toFixed(2)} ${y.toFixed(2)}` : ` L ${x.toFixed(2)} ${y.toFixed(2)}`),
    '',
  );
}

/** Squared distance from point p to segment ab (viewBox px²). Used by the
 *  tap-to-select hit test (round-8 stroke selection). */
function distSqToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 > 0 ? ((px - ax) * dx + (py - ay) * dy) / len2 : 0;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return (px - cx) * (px - cx) + (py - cy) * (py - cy);
}

/** Nearest stroke to a tapped point within a hit radius (viewBox px) — the
 *  tap-to-select hit test (round-8 "select a different part"). Returns the
 *  stroke id, or null if the tap landed on bare paper. Ties break to the
 *  CLOSEST stroke (min distance), so overlapping strokes pick the one under
 *  the finger. */
export function strokeAtPoint(
  strokes: Stroke[],
  x: number,
  y: number,
  hitRadiusPx: number,
): string | null {
  const hit2 = hitRadiusPx * hitRadiusPx;
  let bestId: string | null = null;
  let bestD = Infinity;
  for (const s of strokes) {
    const pts = s.points;
    for (let i = 0; i + 1 < pts.length; i++) {
      const d = distSqToSegment(x, y, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
      if (d < bestD) {
        bestD = d;
        bestId = s.id;
      }
    }
    // A single-point stroke: distance to the point.
    if (pts.length === 1) {
      const d = (x - pts[0][0]) ** 2 + (y - pts[0][1]) ** 2;
      if (d < bestD) {
        bestD = d;
        bestId = s.id;
      }
    }
  }
  return bestD <= hit2 ? bestId : null;
}

// ─── TONE-FILL BRUSH (the SHADE register — round 7, band-mask rebuild R2) ─────
// The explicit shading input (mark-intent spec §4: "the tone-fill brush is the
// explicit register and ALWAYS beats inference" — D2-F). The user brushes TONE
// in the discrete 8-band ladder (`coverage.ts` COVERAGE_BANDS — one band table,
// every renderer). Storage per conversion-semantics-addendum ch.2.1:
// `render_config.toneFills: Array<{ id, points (brushed outline, viewBox
// coords), band }>` — a SIBLING of strokes, band INDEX not raw alpha, never
// only-baked-into-the-svg (the record keeps the tone editable; the svg is
// always regenerable from strokes + toneFills, same contract as strokes).
//
// SESSION-TIME SOURCE OF TRUTH (shade-brush-behavior-spec §2 — the C1/C2/C3
// fix): a per-cell BAND GRID in lib/toneMask.ts, not this patch list. The
// brush stamps the grid through the ratified marker-model table (§3); pen-lift
// extracts merged per-band island outlines (pool-raster contours, holes as
// evenodd subpaths) into this same record shape — fewer, bigger patches,
// non-self-intersecting by construction. The ToneFill type now lives with the
// grid (re-exported here so every existing importer keeps working).

export type { ToneFill } from '../../lib/toneMask';

/** sRGB transfer function (linear → gamma-encoded channel value 0..1). */
function srgbFromLinear(lin: number): number {
  return lin <= 0.0031308 ? 12.92 * lin : 1.055 * Math.pow(lin, 1 / 2.4) - 0.055;
}

/** Flat band-grey per COVERAGE_BANDS index — derived from the band table, not
 *  hardcoded, so a re-banding upstream re-derives the greys (one band table).
 *  Inverse of the signals-layer darkness read: smartHachure/signals.ts
 *  computes darknessL = 1 − OKLab L of the fill, and for pure greys OKLab
 *  L ≈ cbrt(linearRGB) (the LMS matrix rows each sum to ~1.0, so greys pass
 *  through unmixed). Solving for the band's darkness MIDPOINT:
 *  lin = (1 − dMid)³ → grey = srgbFromLinear(lin). Round-trip verified:
 *  every hex below re-quantizes to its own band via bandIndexForDarkness.
 *  Index 0 is null — paper is absence, the brush never paints it. */
export const TONE_BAND_HEX: readonly (string | null)[] = COVERAGE_BANDS.map((b, i) => {
  if (i === 0) return null; // paper = erase, never painted
  const dMid = (b.darknessMin + b.darknessMax) / 2;
  const lin = Math.pow(1 - dMid, 3);
  const g = Math.max(0, Math.min(255, Math.round(srgbFromLinear(lin) * 255)));
  const h = g.toString(16).padStart(2, '0');
  return `#${h}${h}${h}`;
});

// Brush sweep options — pressure-flat (a tone brush has no thinning; the
// radius slider IS the width), deterministic for the same input points.
const TONE_BRUSH_OPTS = {
  thinning: 0,
  smoothing: 0.5,
  streamline: 0.5,
  simulatePressure: false,
  easing: (t: number) => t,
};

// LIVE-PREVIEW outline resolution cap (the while-pen-down capsule sweep only —
// SB-6: committed patches come from the grid extraction in lib/toneMask,
// capped at TONE_MASK_MAX_PTS=128 there).
const TONE_OUTLINE_MAX_PTS = 64;
// Whole-record budget for render_config.toneFills (sibling of the ~45KB
// strokes budget — tone is the smaller passenger by design).
const TONE_FILLS_JSON_BUDGET = 24000;

/** Sweep a brush centerline into the patch's closed outline polygon —
 *  perfect-freehand with size = 2×radius (the capsule-swept "soft region").
 *  Decimated to ≤ TONE_OUTLINE_MAX_PTS and rounded to 0.1px so the stored
 *  geometry is compact and deterministic. */
export function toneOutline(centerline: [number, number][], radius: number): [number, number][] {
  if (centerline.length === 0) return [];
  const swept = getStroke(
    centerline.map(([x, y]) => [x, y, 0.5]),
    { ...TONE_BRUSH_OPTS, size: Math.max(2, radius * 2) },
  );
  let pts = swept.map(
    ([x, y]) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10] as [number, number],
  );
  while (pts.length > TONE_OUTLINE_MAX_PTS) {
    pts = pts.filter((_, i) => i % 2 === 0);
  }
  return pts;
}

/** Size-guard the toneFills record (mirror of capStrokes): round coords, then
 *  halve outline density (floor 12 pts — the patch must stay a region) until
 *  the JSON fits the budget. Never drops a patch — band statements are user
 *  data; only their outline resolution softens. Holes ride the same rounding
 *  + decimation (floor 8 — holes are smaller loops by nature); `src`
 *  provenance passes through untouched. */
export function capToneFills(raw: ToneFill[]): ToneFill[] {
  const round2 = (pts: [number, number][]) =>
    pts.map(([x, y]) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10] as [number, number]);
  let fills: ToneFill[] = raw.map((f) => ({
    id: f.id,
    band: f.band,
    points: round2(f.points),
    ...(f.holes && f.holes.length > 0 ? { holes: f.holes.map(round2) } : {}),
    ...(f.src ? { src: f.src } : {}),
  }));
  while (JSON.stringify(fills).length > TONE_FILLS_JSON_BUDGET) {
    const before = JSON.stringify(fills).length;
    const halve = (pts: [number, number][], floor: number) =>
      pts.length > floor ? pts.filter((_, i) => i % 2 === 0) : pts;
    fills = fills.map((f) => ({
      ...f,
      points: halve(f.points, 12),
      ...(f.holes ? { holes: f.holes.map((hl) => halve(hl, 8)) } : {}),
    }));
    if (JSON.stringify(fills).length >= before) break;
  }
  return fills;
}

/** Closed polygon d-string for one loop. */
function loopD(points: [number, number][]): string {
  return (
    points.reduce(
      (acc, [x, y], i) =>
        acc + (i === 0 ? `M ${x.toFixed(2)} ${y.toFixed(2)}` : ` L ${x.toFixed(2)} ${y.toFixed(2)}`),
      '',
    ) + ' Z'
  );
}

/** Patch d-string: outer outline + hole loops as separate subpaths — paired
 *  with fill-rule="evenodd" everywhere it renders (spec §2: holes mirror the
 *  extractor's outer/hole roles in ONE path). */
function tonePathD(points: [number, number][], holes?: [number, number][][]): string {
  let d = loopD(points);
  if (holes) for (const hl of holes) d += ` ${loopD(hl)}`;
  return d;
}

/** Stable paint order for patches: band ASCENDING (darker paints over
 *  lighter), creation order within a band (Array.sort is stable). Flat per
 *  band — overlap inside one band never compounds, so the render never mints
 *  a band the user didn't brush (addendum ch.2.3 "never average"). */
export function sortedToneFills(toneFills: ToneFill[]): ToneFill[] {
  return [...toneFills].sort((a, b) => a.band - b.band);
}

// ─── REGION FILL — extractor-backed Fill + freehand Lasso (rock F2) ──────────
// docs/design/region-fill-spec.md (D-RF1..D-RF7 ratified): three tools, one
// engine, one output type — everything commits as a ToneFill band patch into
// the SAME band grid the brush stamps (replace-on-refill, eraser carve and
// brush composition all compose for free; never average, never stack).
//
// THE TOPOLOGY CHOICE (spec §2/§6 made concrete): Fill runs the pool-raster
// extractor in INK-ONLY topology — `closedFlags` all false, NO closure-state
// scanline fill. Closure flags are the 3D conversion's MASS semantic (a
// near-closed stroke welds into a slab); the fill semantic is ENCLOSURE, and
// with ink-only rasterization the enclosed paper shows up as the odd-depth
// loops of the containment-parity tree while the ink-stamp radius stays the
// ONLY gap-closer — exactly "the ink radius IS the tolerance". Under closure
// flags the Gap slider would be a lie for single strokes (a 20px-gap circle
// scanline-fills at ANY tolerance) and a donut would collapse to a disc.
//
// Fill targets are the ODD-depth (paper) regions — D-RF4's "a hole is paper
// the user may want toned", generalized: in ink-only topology every enclosed
// paper area IS an odd-parity loop. Even-depth regions are ink bodies; a tap
// on one (tap exactly ON a line, tap on a dropped-tiny-region) is an honest
// miss, never an invisible under-ink patch.

/** Gap-tolerance ladder — multiplier on the extractor's ink-stamp radius
 *  (spec §6: 6 ticks per feedback_more_toggle_options_better; default 1× =
 *  SOLID_INK_RADIUS parity with the 3D conversion). */
export const GAP_LADDER: readonly number[] = [0.5, 0.75, 1, 1.5, 2, 3];

/** Nearest ladder index for a stored multiplier (slider round-trip). */
export function gapIdxOf(gap: number): number {
  let best = 2; // 1×
  let bestD = Infinity;
  for (let i = 0; i < GAP_LADDER.length; i++) {
    const d = Math.abs(GAP_LADDER[i] - gap);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}

/** One extractor region mapped into the draw frame (viewBox px) — the
 *  world→viewBox inverse adapter output (spec §2: "the inverse of
 *  normalizeStrokePoints applied to outline — a ~15-line adapter, not a new
 *  extractor"). */
export type FillRegion = {
  /** Closed outline, draw-frame viewBox px (RDP+Chaikin from the extractor). */
  outline: [number, number][];
  /** Containment depth — ink-only topology: even = ink body, odd = paper. */
  depth: number;
  role: 'outer' | 'hole';
  parentIndex: number | null;
  areaWorld: number;
};

/** Run the pool-raster extractor over the stroke pool at a gap multiplier and
 *  map the region tree back into viewBox px. Deterministic; cache by
 *  (strokesKey, gapIdx) — per ladder STEP, never per pointermove (spec §6). */
export function extractFillRegions(strokes: Stroke[], gapMult: number): FillRegion[] {
  const raw = strokes.map((s) => s.points).filter((s) => s.length > 0);
  if (raw.length === 0) return [];
  const viewBox = { w: VIEWBOX_W, h: VIEWBOX_H };
  const simplified = raw.map((s) => rdpPoints(s, RDP_EPSILON));
  const center = poolCenter(simplified, viewBox);
  const world = simplified.map((s) => normalizeStrokePoints(s, viewBox, WORLD_SCALE, center));
  const extraction = extractPoolRegions(world, {
    inkRadius: SOLID_INK_RADIUS * gapMult,
    // INK-ONLY TOPOLOGY (see the header comment): enclosure comes from the
    // stamped ink alone — the gap slider is the only thing that closes gaps.
    closedFlags: world.map(() => false),
    // FILL-CONFORM (2026-06-13): crisp = keep the drawn shape's SHARP corners
    // (no Chaikin rounding -> a rectangle fills as a rectangle, not a blob);
    // max resolution = the finest grid so the boundary staircases the least and
    // the fill hugs the drawn line (Sebs: "fill doesn't conform, edges dirty").
    crisp: true,
    // REVERTED 2026-06-13: a 420 grid broke region enclosure (partial fill /
    // white band — exceeded the grid budget). Back to the proven 200 cap; the
    // corner-notch gets a different fix (not via global resolution).
    resolution: SOLID_MAX_GRID_RESOLUTION,
  });
  // The world→viewBox inverse adapter: normalizeStrokePoints is
  //   wx = (x − cx)·s,  wy = −(y − cy)·s   →   x = wx/s + cx,  y = cy − wy/s.
  const toVb = ([wx, wy]: [number, number]): [number, number] => [
    Math.round((wx / WORLD_SCALE + center.x) * 10) / 10,
    Math.round((center.y - wy / WORLD_SCALE) * 10) / 10,
  ];
  return extraction.regions.map((r) => ({
    outline: r.outline.map(toVb),
    depth: r.depth,
    role: r.role,
    parentIndex: r.parentIndex,
    areaWorld: r.areaWorld,
  }));
}

/** Ink CENTERLINE polylines (raw stroke points, viewBox px) of the strokes
 *  whose bbox plausibly BORDERS a fill region — the clean-edge conform input.
 *
 *  The fill is grown up to the centerline (the raw gesture path the ink is
 *  drawn ON, half the ink width inside the visible OUTER edge): tone-at-
 *  centerline is always covered by the ink-on-top (NO white sliver) and always
 *  half-a-width inside the outer edge (NO bleed past the outline), and the
 *  centerline carries the drawing's true sharp corners.
 *
 *  The region outline sits ~inkRadius·gap px INSIDE the ink centerline, so a
 *  stroke borders the region if its bbox is within that inset of the region's
 *  bbox. Pre-filtering by bbox (not feeding ALL strokes) keeps the rasterizer
 *  window tight and prevents the fill from welding to unrelated far-away ink. */
function strokeCenterlinesNear(
  strokes: Stroke[],
  regionOutline: [number, number][],
  gapMult: number,
): [number, number][][] {
  if (regionOutline.length < 3) return [];
  let rMinX = Infinity;
  let rMinY = Infinity;
  let rMaxX = -Infinity;
  let rMaxY = -Infinity;
  for (const [x, y] of regionOutline) {
    if (x < rMinX) rMinX = x;
    if (x > rMaxX) rMaxX = x;
    if (y < rMinY) rMinY = y;
    if (y > rMaxY) rMaxY = y;
  }
  // The gap inset (viewBox px) the boundary is pushed inward, + ink half-width
  // + a couple of cells of slack so the bbox test never drops bordering ink.
  const margin = (SOLID_INK_RADIUS * gapMult) / WORLD_SCALE + 6;
  const lines: [number, number][][] = [];
  for (const s of strokes) {
    if (s.points.length < 2) continue;
    let sMinX = Infinity;
    let sMinY = Infinity;
    let sMaxX = -Infinity;
    let sMaxY = -Infinity;
    for (const [x, y] of s.points) {
      if (x < sMinX) sMinX = x;
      if (x > sMaxX) sMaxX = x;
      if (y < sMinY) sMinY = y;
      if (y > sMaxY) sMaxY = y;
    }
    // bbox-overlap with the region bbox grown by the inset margin.
    if (
      sMaxX < rMinX - margin ||
      sMinX > rMaxX + margin ||
      sMaxY < rMinY - margin ||
      sMinY > rMaxY + margin
    ) {
      continue;
    }
    lines.push(s.points.map(([x, y]) => [x, y] as [number, number]));
  }
  return lines;
}

/** Innermost PAPER region under a point — max containment depth wins, ties
 *  break to the smaller area (D-RF4: innermost wins; donut hole is a
 *  legitimate target). Returns the region index, or -1 (honest miss). */
export function innermostPaperRegionAt(x: number, y: number, regions: FillRegion[]): number {
  let best = -1;
  for (let i = 0; i < regions.length; i++) {
    const r = regions[i];
    if (r.depth % 2 !== 1) continue; // even = ink body, not a fill target
    if (r.outline.length < 3 || !pointInLoop(x, y, r.outline)) continue;
    if (
      best < 0 ||
      r.depth > regions[best].depth ||
      (r.depth === regions[best].depth && r.areaWorld < regions[best].areaWorld)
    ) {
      best = i;
    }
  }
  return best;
}

/** The even-depth islands sitting directly inside a paper region — the fill
 *  patch subtracts them so e.g. a donut-ring fill keeps the inner circle's
 *  ink AND its enclosed paper as paper (ring fills ring only). */
function fillChildrenOf(regions: FillRegion[], idx: number): [number, number][][] {
  const target = regions[idx];
  const holes: [number, number][][] = [];
  for (let j = 0; j < regions.length; j++) {
    const r = regions[j];
    if (j === idx || r.depth !== target.depth + 1 || r.outline.length < 1) continue;
    const [px, py] = r.outline[0];
    if (pointInLoop(px, py, target.outline)) holes.push(r.outline);
  }
  return holes;
}

/** Bounding-box extents of a point set (px): [width, height]. */
function bboxWHPx(pts: [number, number][]): [number, number] {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of pts) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  return [maxX - minX, maxY - minY];
}

/** Is a lasso loop degenerate — near-zero AREA (Sebs-ratified: short flicks
 *  AND near-straight drags miss honestly, commit NOTHING)?
 *
 *  The guard keys on BBOX EXTENTS, NOT signed shoelace area — a self-crossing
 *  loop (figure-8 / bowtie) has near-zero NET shoelace area (the lobes' winding
 *  cancels) yet fills a large area under the nonzero-winding rasterizer the
 *  commit uses. A shoelace floor would wrongly reject those legitimate loops
 *  (the L4a/N4 regression). Bbox extents don't cancel:
 *    - SHORT FLICK  → both dims tiny  → reject;
 *    - NEAR-STRAIGHT DRAG → one dim a sliver (min dim ≈ wobble width) → reject;
 *    - REAL LOOP / BOWTIE → both dims span the gesture → accept.
 *  A loop must span ≥ LASSO_MIN_DIM_PX in its SMALLER dimension and clear a
 *  bbox-area floor (a tiny square also misses). */
const LASSO_MIN_DIM_PX = 12;
const LASSO_MIN_BBOX_AREA_PX = 400;
function lassoDegenerate(pts: [number, number][]): boolean {
  if (pts.length < 3) return true;
  const [w, h] = bboxWHPx(pts);
  if (Math.min(w, h) < LASSO_MIN_DIM_PX) return true; // sliver in one axis
  return w * h < LASSO_MIN_BBOX_AREA_PX; // too small overall
}

/** Decimate + round a lasso loop for the record (≤ TONE_OUTLINE_MAX_PTS,
 *  0.1px — the same compaction brushed outlines get). */
function decimateLoop(pts: [number, number][]): [number, number][] {
  let out = pts.map(([x, y]) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10] as [number, number]);
  while (out.length > TONE_OUTLINE_MAX_PTS) {
    out = out.filter((_, i) => i % 2 === 0);
  }
  return out;
}

/** The Fill commit's outward dilation in px: how far the tone is pushed back
 *  OUT from the extractor boundary (which sits inkRadius·gap px inside the ink
 *  centerline) toward — and at full fill, past — the VISIBLE ink edge.
 *
 *  ROUND-8 (Sebs: "ability to fully fill" + the Gap slider was inert on closed
 *  shapes): the dilation now SCALES with the Gap multiplier, so the Gap slider
 *  is LIVE on a closed shape — low gap leaves a small inset paper ring, high
 *  gap fills flush to the ink edge. Previously the dilation reached the inner
 *  ink edge at every tick (gap only changed the gap-LEAP tolerance), so on an
 *  already-closed shape the slider did nothing visible. Now:
 *    · the extractor boundary is inkRadius·gap px inside the centerline;
 *    · dilation = that whole inset MINUS an inset-ring bias that SHRINKS as
 *      gap rises — at gap 1× the ring is ~1.5px (the original tucked look),
 *      at the top of the ladder the ring is 0 and the tone reaches the
 *      centerline (flush);
 *    · `full` (the explicit Full-fill option) overrides to push a small bias
 *      PAST the centerline so the tone always sits flush under the ink, no
 *      inset, regardless of gap.
 *  Clamped ≥ 0 (never a negative dilation = never pulled further inward). */
// Full-fill bias toward the ink's OUTER edge. Pen footprint is ~4px (half-width
// ~2). bias 0 stops at the centerline → thin white SLIVERS where the wobbly ink
// bows inward ("nope", Sebs). bias +2 reached the outer edge but BLED on the
// thinner/tapered stretches. +1 is the compromise: covers most inward wobble
// (fill tucks under the ink, which is drawn ON TOP) without spilling past on the
// thin stretches. Eyeball-tune with Sebs — variable-width ink means no single
// value is pixel-perfect; the ink-over-tone z-order hides the seam.
const FULL_FILL_EDGE_BIAS = 1;
function fillDilatePx(gapMult: number, full = false): number {
  const toCenterline = (SOLID_INK_RADIUS * gapMult) / WORLD_SCALE;
  if (full) return toCenterline + FULL_FILL_EDGE_BIAS;
  // Inset ring fades from ~1.5px at gap 1× to 0px by gap ~3× (ladder top) —
  // higher gap = flusher fill, making the slider visibly live on closed shapes.
  const insetRing = Math.max(0, 1.5 * (2 - gapMult));
  return Math.max(0, toCenterline - insetRing);
}

/** The honest-miss caption (spec §5.4 — never silent, never flood). */
export const FILL_MISS_NOTE = 'no closed region here — raise Gap, or use Lasso';

/** Markup for the patches as they enter the STYLE PIPELINE: flat solid
 *  band-grey fills, stroke="none" (mapPaletteColor passes 'none' through →
 *  the smartHachure outline pass renders invisibly; only fill MARKS show),
 *  each patch its own region. The pipeline's signals layer reads the grey →
 *  darknessL → the classifier's tonal roles → fillStyle marks at band
 *  density (coverage.ts math) — the I-2 wedge: brushed band 5 and inferred
 *  band 5 are indistinguishable downstream. `data-tone-band` tags the patch
 *  for downstream consumers (3D re-bind, audits) without re-deriving from
 *  the grey. */
function toneFillsMarkup(
  toneFills: ToneFill[],
  mapPt?: (pt: [number, number]) => [number, number],
): string {
  return sortedToneFills(toneFills)
    .map((f) => {
      const hex = TONE_BAND_HEX[f.band];
      if (!hex || f.points.length < 3) return '';
      const pts = mapPt ? f.points.map(mapPt) : f.points;
      const holes = mapPt ? f.holes?.map((hl) => hl.map(mapPt)) : f.holes;
      return `<path d="${tonePathD(pts, holes)}" fill="${hex}" fill-rule="evenodd" stroke="none" data-tone-band="${f.band}"/>`;
    })
    .join('');
}

// ─── UPLOAD BACKDROP (draw-over parity, ROUND 6) ──────────────────────────────
// An uploaded SVG becomes a BACKDROP layer inside the draw frame: it letterboxes
// into the same 800×600 viewBox space the strokes are captured in, so pen
// strokes land visually ON the upload. Done merges both into ONE object — by
// INVERSE-MAPPING the stroke points into the UPLOAD's local coordinate space
// and appending them flat (no <g transform>, no nested <svg>): the style
// pipeline's mark placement doesn't honor ancestor transforms yet (the
// deferred row-9 getCTM flatten, 18-scope-audit), verified live 2026-06-12 —
// a transform-wrapped merge rendered the upload tiny at raw local coords. The
// flat merge is exactly the input shape /canvas uploads already exercise.

export type BackdropFrame = {
  /** Inner markup of the upload's root <svg> (DOMPurify-sanitized upstream —
   *  prepareSvgUpload is the only producer of markup that reaches here). */
  inner: string;
  /** Root <svg> attributes minus sizing (width/height/viewBox/x/y), re-emitted
   *  on merged output so root-level fill/stroke/class context survives. */
  rootAttrs: string;
  vbX: number;
  vbY: number;
  vbW: number;
  vbH: number;
};

/** Normalize an uploaded root <svg> so it FITS the draw frame instead of
 *  overflowing/clipping (round-8, Sebs "uploaded SVG renders oversized/clipped
 *  on /canvas"). Root cause (diagnosed via Playwright box-measure on /canvas):
 *  the old transform set the svg width/height = 100%, but the SvgStyleTransform
 *  cleanRef wrapper has NO definite height, so `height:100%` doesn't resolve —
 *  the browser falls back to the viewBox aspect height at the resolved width
 *  (e.g. a 682×986 rose at 862px wide → 1246px tall inside a 648px frame =
 *  clipped). The fix:
 *    1. Derive a viewBox from width/height when the svg has none (so raw pixel
 *       coords map into a viewport — without this, forced 100% has no mapping).
 *    2. preserveAspectRatio="xMidYMid meet" — letterbox the viewBox into the
 *       viewport (the established fit-into-frame technique), so the whole
 *       drawing is visible, centered, never clipped.
 *    3. position:absolute; inset:0 inline style — the svg sizes against the
 *       nearest positioned ancestor (SvgStyleTransform's position:relative
 *       wrapper, which IS the frame box via its 100%×100% wrapperOverride),
 *       so height:100% finally resolves to the frame height. width/height 100%
 *       belt-and-suspenders for the absolute box.
 *  Desk-object normalization (~180px, normalizeSvgSize) still happens at the
 *  desk-canvas add boundary per the locked auto-resize decision — this is the
 *  in-frame PREVIEW fit only. */
export function fitUploadMarkup(rawMarkup: string): string {
  return rawMarkup.replace(/<svg\b([^>]*)>/i, (_m, attrs: string) => {
    let viewBox = '';
    if (!/viewBox=/i.test(attrs)) {
      const w = parseFloat((attrs.match(/\swidth="([\d.]+)/i) || [])[1] ?? '');
      const h = parseFloat((attrs.match(/\sheight="([\d.]+)/i) || [])[1] ?? '');
      if (Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0) {
        viewBox = ` viewBox="0 0 ${w} ${h}"`;
      }
    }
    const cleaned = attrs
      .replace(/\swidth="[^"]*"/i, '')
      .replace(/\sheight="[^"]*"/i, '')
      .replace(/\spreserveAspectRatio="[^"]*"/i, '')
      // Strip any inline width/height/position in an existing style attr so our
      // sizing wins (sanitized markup may carry a style attr).
      .replace(/\sstyle="[^"]*"/i, '');
    return (
      `<svg${cleaned}${viewBox} width="100%" height="100%"` +
      ` preserveAspectRatio="xMidYMid meet"` +
      ` style="position:absolute;inset:0;width:100%;height:100%">`
    );
  });
}

/** Parse sanitized upload markup into a BackdropFrame. Returns null when the
 *  svg has no usable size info (no viewBox AND no positive width/height) —
 *  the host falls back to a non-draw-over preview honestly. */
export function prepareBackdrop(markup: string): BackdropFrame | null {
  const doc = new DOMParser().parseFromString(markup, 'image/svg+xml');
  if (doc.querySelector('parsererror')) return null;
  const svg = doc.documentElement;
  if (svg.tagName.toLowerCase() !== 'svg') return null;
  let vbX = 0;
  let vbY = 0;
  let vbW = 0;
  let vbH = 0;
  const vb = svg.getAttribute('viewBox');
  if (vb) {
    const parts = vb.trim().split(/[\s,]+/).map(Number);
    if (parts.length === 4 && parts.every(Number.isFinite)) {
      [vbX, vbY, vbW, vbH] = parts;
    }
  }
  if (!(vbW > 0 && vbH > 0)) {
    // No viewBox — derive from width/height attrs (parseFloat drops "px").
    const w = parseFloat(svg.getAttribute('width') ?? '');
    const h = parseFloat(svg.getAttribute('height') ?? '');
    if (w > 0 && h > 0) {
      vbX = 0;
      vbY = 0;
      vbW = w;
      vbH = h;
    }
  }
  if (!(vbW > 0 && vbH > 0)) return null;
  let inner = '';
  const ser = new XMLSerializer();
  for (const child of Array.from(svg.childNodes)) inner += ser.serializeToString(child);
  let rootAttrs = '';
  for (const attr of Array.from(svg.attributes)) {
    const n = attr.name.toLowerCase();
    if (n === 'width' || n === 'height' || n === 'viewbox' || n === 'x' || n === 'y' || n === 'xmlns') continue;
    rootAttrs += ` ${attr.name}="${attr.value.replace(/"/g, '&quot;')}"`;
  }
  return { inner, rootAttrs, vbX, vbY, vbW, vbH };
}

/** Letterbox mapping of a backdrop into the 800×600 draw frame —
 *  preserveAspectRatio xMidYMid meet, expressed as translate+scale. */
function backdropMapping(f: BackdropFrame): { s: number; ox: number; oy: number } {
  const s = Math.min(VIEWBOX_W / f.vbW, VIEWBOX_H / f.vbH);
  const ox = (VIEWBOX_W - f.vbW * s) / 2 - f.vbX * s;
  const oy = (VIEWBOX_H - f.vbH * s) / 2 - f.vbY * s;
  return { s, ox, oy };
}

const rnd = (v: number) => (Math.round(v * 100) / 100).toString();

/** The backdrop's <g transform> wrap in frame space — shared by the raw
 *  Sketch layer and the merged Done markup so they are pixel-coherent. */
function backdropGroupMarkup(f: BackdropFrame): string {
  const { s, ox, oy } = backdropMapping(f);
  return `<g transform="translate(${rnd(ox)} ${rnd(oy)}) scale(${(Math.round(s * 10000) / 10000).toString()})">${f.inner}</g>`;
}

/** Full-frame display markup for the raw (Sketch-mode) backdrop layer. */
export function backdropDisplayMarkup(f: BackdropFrame): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEWBOX_W} ${VIEWBOX_H}" width="100%" height="100%">${backdropGroupMarkup(f)}</svg>`;
}

/** Merge the upload backdrop + drawn-over strokes into ONE svg — FLAT, in the
 *  UPLOAD's local coordinate space: the upload geometry rides untouched and
 *  the stroke points are inverse-mapped through the letterbox (frame→local),
 *  stroke-width scaled to keep the drawn visual weight. No transforms in the
 *  output, so the style pipeline treats it exactly like a plain upload.
 *  `tight: true` (the Done path) sets the viewBox to the union of the
 *  upload's viewBox and the mapped strokes' bbox so the desk's ~180px
 *  normalization scales the DOODLE. `tight: false` (the live Style-mode
 *  layer) sets the viewBox to the inverse-mapped FULL FRAME rect, so the
 *  styled render letterboxes pixel-coherently with the raw layers under it. */
export function composeBackdropAndStrokes(
  f: BackdropFrame,
  strokes: Stroke[],
  opts: { tight?: boolean; toneFills?: ToneFill[] } = {},
): string {
  const { s, ox, oy } = backdropMapping(f);
  const toLocal = ([x, y]: StrokePoint): [number, number] => [(x - ox) / s, (y - oy) / s];
  const toLocal2 = ([x, y]: [number, number]): [number, number] => [(x - ox) / s, (y - oy) / s];
  const toneFills = opts.toneFills ?? [];
  const localWidth = Math.max(0.05, Math.round((3 / s) * 100) / 100);
  // Tone patches ride the same inverse mapping as strokes (frame → upload-
  // local), painting OVER the upload but UNDER the drawn ink — shading the
  // picture, not erasing it. Fills need no width scaling.
  const tonePaths = toneFillsMarkup(toneFills, toLocal2);
  const paths = strokes
    .map((stroke) => {
      const d = stroke.points.reduce((acc, pt, i) => {
        const [lx, ly] = toLocal(pt);
        return acc + (i === 0 ? `M ${lx.toFixed(2)} ${ly.toFixed(2)}` : ` L ${lx.toFixed(2)} ${ly.toFixed(2)}`);
      }, '');
      return `<path d="${d}" fill="none" stroke="var(--dir-text-primary)" stroke-width="${localWidth}" stroke-linecap="round" stroke-linejoin="round"/>`;
    })
    .join('');
  let vb: string;
  if (opts.tight) {
    // Union of the upload's viewBox and the mapped strokes' + tone patches'
    // bbox (+pad).
    let minX = f.vbX;
    let minY = f.vbY;
    let maxX = f.vbX + f.vbW;
    let maxY = f.vbY + f.vbH;
    for (const stroke of strokes) {
      for (const pt of stroke.points) {
        const [lx, ly] = toLocal(pt);
        if (lx < minX) minX = lx;
        if (ly < minY) minY = ly;
        if (lx > maxX) maxX = lx;
        if (ly > maxY) maxY = ly;
      }
    }
    for (const fill of toneFills) {
      for (const pt of fill.points) {
        const [lx, ly] = toLocal2(pt);
        if (lx < minX) minX = lx;
        if (ly < minY) minY = ly;
        if (lx > maxX) maxX = lx;
        if (ly > maxY) maxY = ly;
      }
    }
    const pad = 6 / s;
    vb = `${rnd(minX - pad)} ${rnd(minY - pad)} ${rnd(maxX - minX + pad * 2)} ${rnd(maxY - minY + pad * 2)}`;
  } else {
    // The whole 800×600 frame, expressed in local units — same letterbox as
    // the raw Sketch layers (display parity), explicit 100% sizing for the
    // injected-markup render path.
    vb = `${rnd((0 - ox) / s)} ${rnd((0 - oy) / s)} ${rnd(VIEWBOX_W / s)} ${rnd(VIEWBOX_H / s)}`;
  }
  const sizing = opts.tight ? '' : ' width="100%" height="100%"';
  return `<svg xmlns="http://www.w3.org/2000/svg"${f.rootAttrs} viewBox="${vb}"${sizing}>${f.inner}${tonePaths}${paths}</svg>`;
}

// In-frame action pill — PILL at the smaller in-canvas scale, on paper so the
// buttons read over strokes. Shared by Edit / Clear / Replace.
const FRAME_PILL = {
  ...PILL,
  padding: '6px 12px',
  fontSize: 10,
  background: 'var(--dir-bg)',
};

// CTA mixes PILL's `border` shorthand with a `borderColor` longhand — React
// dev warns when such conflicting styles diff across renders (the Done↔Edit
// button swap reuses the same DOM node, so the diff is live here). Collapse
// to a single shorthand at this call site (chromeStyles is shared, owned
// elsewhere).
const { borderColor: _ctaBorderColor, ...CTA_REST } = CTA;
const CTA_PILL = { ...CTA_REST, border: `1px solid ${String(_ctaBorderColor)}` };

// Shared copy block for the honesty gates (3D mode + image upload) — an
// opaque cover over the live 2D surface so a not-yet-real mode never shows
// dead-looking controls. State underneath stays intact.
const GATE_STYLE = {
  position: 'absolute' as const,
  inset: 0,
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  background: 'var(--dir-bg)',
  fontFamily: IS,
  fontSize: 11,
  color: 'var(--dir-text-secondary)',
  letterSpacing: '0.04em',
  textAlign: 'center' as const,
};

export function DrawSurface({
  mode,
  input,
  onStrokesChange,
  hideActions,
  fill,
  styled,
  initialStrokes,
  backdrop,
  shade,
  initialToneFills,
  onToneFillsChange,
  onGapChange,
  onFillNote,
  onSnapApi,
}: {
  mode: CanvasMode;
  input: InputMode;
  /** Optional live mirror of the preview-stroke pool. Lets a host (DrawPanel)
   *  supply its own Done control and build the commit-layer markup itself.
   *  Pass a stable callback (a useState setter) — fired from an effect. */
  onStrokesChange?: (strokes: Stroke[]) => void;
  /** Hide the in-frame Done/Edit/Clear pills when the host supplies its own
   *  commit chrome (DrawPanel's Done/Cancel). /canvas leaves this unset. */
  hideActions?: boolean;
  /** Fill the parent box (popup mini-desk) instead of clamping to 4:3 —
   *  the inner SVG letterboxes via its viewBox either way. */
  fill?: boolean;
  /** DRAW | STYLE mode (Sebs 2026-06-12: "drawing shouldn't stop when pen
   *  lifts, but we can't play with toggles while it's raw — the user needs a
   *  way IN and OUT"). Controlled by the host's Draw|Style pill pair:
   *    · false/undefined (Draw): strokes stay RAW ink; pen-up changes
   *      nothing; keep sketching forever.
   *    · true (Style): drawing pauses (pointer ignored), the strokes render
   *      through the SAME SvgStyleTransform pipeline and re-style LIVE as
   *      the pen controls change. Flip back to keep drawing.
   *  /canvas leaves this unset — its Done/Edit commit flow is unchanged. */
  styled?: boolean;
  /** Preload the canvas with stored strokes (Re-draw: the object's recorded
   *  gesture comes back editable — the record keeps the hand). */
  initialStrokes?: StrokePoint[][];
  /** UPLOAD-AS-BACKDROP (draw-over parity, ROUND 6): the prepared upload
   *  letterboxes into the frame as the bottom layer; pen strokes draw on top.
   *  Sketch mode shows it raw; Style mode renders backdrop + strokes MERGED
   *  through ONE SvgStyleTransform (the same composed markup Done stages, so
   *  the live preview == the published object). Host (DrawPanel) owns the
   *  file pick; /canvas leaves this unset. */
  backdrop?: BackdropFrame | null;
  /** THE SHADE REGISTER (round 7, tone-fill brush · rock F2 region fill):
   *  when `active`, the pointer puts down TONE instead of ink. `tool` picks
   *  HOW (D-RF1 — the register answers "tone goes down", the tool answers
   *  how): 'brush' = the swept-capsule grid brush; 'fill' = extractor-backed
   *  region fill (tap/hover-preview/highlight-drag/gap-scrub); 'lasso' =
   *  freehand loop, auto-closed on release (D-RF7). `erase` flips every tool
   *  into a lifter (band 0 = paper = absence). `gap` = the Fill tool's
   *  gap-tolerance multiplier (GAP_LADDER). Tool state is owned by the
   *  host's chrome; /canvas leaves this unset — zero behavior change. */
  shade?: {
    active: boolean;
    tool: ShadeTool;
    band: number;
    radius: number;
    erase: boolean;
    gap: number;
    /** FULL FILL (round-8, Sebs "ability to fully fill"): when on, the Fill
     *  tool commits flush to the ink EDGE with NO inset gap — the dilation
     *  pushes the tone out under the visible ink so a closed shape reads as
     *  completely toned, edge to edge. Default (off) keeps the boundary tucked
     *  just inside the ink. Optional so hosts that don't forward it keep the
     *  original behavior. NOTE: the Gap ladder ALSO drives flushness (its top
     *  tick reaches the edge) so the Gap slider is live on closed shapes even
     *  when this isn't wired — full-fill is the explicit, always-flush escape
     *  hatch on top of that. */
    fullFill?: boolean;
  } | null;
  /** Fill-tool gap scrub → host slider sync (press-hold-drag walks the
   *  ladder LIVE; the chrome slider follows and the value persists — both
   *  controls, spec D-RF3). Fired once per ladder STEP, never per move. */
  onGapChange?: (gap: number) => void;
  /** Honest-miss channel: one-line notes for the host's caption slot (spec
   *  §5.4 — "no closed region here…"; never silent, never a stray blob). */
  onFillNote?: (note: string) => void;
  /** Preload tone patches (Re-draw: the object's recorded tone comes back
   *  editable, sibling of initialStrokes — addendum ch.2 lifecycle). */
  initialToneFills?: ToneFill[];
  /** Live mirror of the tone-patch pool — same contract as onStrokesChange
   *  (stable callback, fired from an effect). The host stages
   *  render_config.toneFills from this at Done. */
  onToneFillsChange?: (toneFills: ToneFill[]) => void;
  /** SHAPE ASSIST (Rock F3): hand the host an imperative API for the SNAP /
   *  STRAIGHTEN action pills (which live in the host's chrome, not the
   *  canvas). Fired once with a stable api object (the onStrokesChange idiom)
   *  so the host can fit/apply/cycle the last stroke on demand. /canvas leaves
   *  this unset — zero behavior change, freehand stays the only path. */
  onSnapApi?: (api: ShapeSnapApi) => void;
}) {
  // PREVIEW strokes — gestures the user has finished pen-up on but hasn't
  // committed yet. While in this state they render as raw perfect-freehand
  // polygons so the user sees their drawing AS DRAWN, not pre-styled.
  const [strokes, setStrokes] = useState<Stroke[]>(() =>
    (initialStrokes ?? []).map((points, i) => ({ id: `loaded-${i}`, points })),
  );
  // CURRENT stroke — the one being actively dragged.
  const [current, setCurrent] = useState<Stroke | null>(null);
  // SELECTED stroke (round-8, Sebs "select different part"): a TAP on an
  // earlier committed stroke (Ink register, no drag) selects it so Snap /
  // Straighten target THAT one instead of the latest. null = no selection →
  // the API falls back to the last stroke (the original behavior). Cleared
  // whenever a new stroke is drawn or the selected stroke disappears.
  const [selectedStrokeId, setSelectedStrokeId] = useState<string | null>(null);
  // COMMITTED — flip to true when user hits "Done." Only then do the
  // strokes flow through SvgStyleTransform / Smart Hachure. Until then
  // pen-up just adds another stroke to the preview pool. Sebs: "if I stop
  // drawing and lift it shouldn't auto-add the object until I choose to be done."
  const [committed, setCommitted] = useState(false);
  const [uploadedSvg, setUploadedSvg] = useState<{ name: string; markup: string } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  // TONE PATCHES — the shade register's pool (sibling of `strokes`). Display/
  // record mirror of the grid below; pen-lift extraction refreshes it whole.
  const [toneFills, setToneFills] = useState<ToneFill[]>(() =>
    (initialToneFills ?? []).map((f, i) => ({ ...f, id: f.id || `loaded-tone-${i}` })),
  );
  // THE BAND GRID — session-time source of truth for the shade register
  // (shade-brush spec §2). Lazily created on first render; Re-draw preloads
  // re-rasterize stored patches at their band (ascending, darker wins —
  // stored patches are already RESOLVED statements, §3 rules apply only at
  // brush time). Lives only as long as this surface — never stored.
  const toneGridRef = useRef<ToneMaskGrid | null>(null);
  if (toneGridRef.current === null) {
    toneGridRef.current = createToneGrid(VIEWBOX_W, VIEWBOX_H);
    if (initialToneFills && initialToneFills.length > 0) {
      rasterizeToneFills(toneGridRef.current, initialToneFills);
    }
  }
  // The brush centerline being actively dragged (shade register's `current`) —
  // drives the cheap while-pen-down preview overlay (SB-6); the grid carries
  // the truth in parallel.
  const [toneBrush, setToneBrush] = useState<[number, number][] | null>(null);
  // Last stamped centerline point — capsule segments connect consecutive
  // pointer events so fast drags leave no gaps in the grid.
  const lastTonePtRef = useRef<[number, number] | null>(null);
  // Pre-stroke band snapshot — Escape mid-gesture restores it (true gesture
  // CANCEL; a 120KB copy per pen-down is trivially cheap). Without this, a
  // mid-stroke Escape fell through to the host popup's close handler, which
  // saw empty strokes/tone state and silently ATE the in-progress gesture
  // (caught by the rock-F1 break battery). Rock F2: provenance sidecars ride
  // the snapshot too — a cancelled brush-over-fill must restore the fill's
  // src/gapTol, not leave brush provenance on reverted bands.
  const toneSnapshotRef = useRef<{
    bands: Uint8Array;
    src: Uint8Array;
    gapTolQ: Uint8Array;
  } | null>(null);
  // Pointer position while the shade register is active — drives the honest
  // brush-footprint ring (the radius is in viewBox units, so a CSS cursor
  // could not show the true footprint).
  const [hoverPt, setHoverPt] = useState<[number, number] | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ── REGION FILL state (rock F2) ────────────────────────────────────────────
  // Extraction cache: (strokesKey, gapIdx) → regions. Per ladder STEP, never
  // per pointermove (spec §6 cost rule); entries for stale stroke pools are
  // simply never hit (key mismatch) and the map is cleared on stroke edits.
  const regionCacheRef = useRef<Map<string, FillRegion[]>>(new Map());
  const strokesSig = strokesKey(strokes.map((s) => s.points));
  // The in-flight fill gesture — ref (handlers + Escape listener read it
  // without stale-closure risk); `fillGestureOn` mirrors "a fill gesture is
  // mid-flight" into state so the Escape listener mounts.
  const fillGesRef = useRef<{
    phase: 'pending' | 'scrub' | 'highlight';
    start: [number, number];
    baseGapIdx: number;
    lastIdx: number;
    timer: number;
  } | null>(null);
  const [fillGestureOn, setFillGestureOn] = useState(false);
  // Hover preview target (Fill mode, pen up): which region, at which step.
  const [fillHover, setFillHover] = useState<{ gapIdx: number; idx: number } | null>(null);
  // Live gap scrub (press-hold-drag): current step + the anchor the preview
  // re-resolves under as the ladder walks (watch the leak happen — §6).
  const [scrubState, setScrubState] = useState<{ idx: number; anchor: [number, number] } | null>(
    null,
  );
  // Highlight-drag trail (transient — never recorded as ink, spec §5.3).
  const [highlightPts, setHighlightPts] = useState<[number, number][] | null>(null);
  // Lasso trail (its own outline becomes the patch on release, D-RF7).
  const [lassoPts, setLassoPts] = useState<[number, number][] | null>(null);
  // The previous fill act missed — the next lasso commit is the spec §7
  // extractor-miss label ('lasso-after-miss').
  const lastMissRef = useRef(false);
  // Latest shade prop for the Escape listener (mounted per-gesture, so the
  // closure would otherwise hold a stale band/erase).
  const shadeRef = useRef(shade);
  shadeRef.current = shade;

  /** Regions at a ladder step — cached, deterministic, extraction only on a
   *  cache miss (entering Fill, a new step, or after stroke edits). */
  function regionsFor(gapIdx: number): FillRegion[] {
    const key = `${strokesSig}|${gapIdx}`;
    const cached = regionCacheRef.current.get(key);
    if (cached) return cached;
    if (regionCacheRef.current.size > 18) regionCacheRef.current.clear();
    const regions = extractFillRegions(strokes, GAP_LADDER[gapIdx]);
    regionCacheRef.current.set(key, regions);
    return regions;
  }

  const currentGapIdx = gapIdxOf(shade?.gap ?? 1);

  /** Decision-log every act (spec §7/§8 — the learned ladder's diet). */
  function logShadeFill(
    tool: 'fill' | 'lasso',
    gesture: ShadeFillGesture,
    gapMult: number,
    region: FillRegion | null,
    outcome: 'committed' | 'cancelled' | 'miss' | 'lasso-after-miss',
    regionCount: number,
  ) {
    pushShadeFillEntry({
      entryType: 'shade-fill',
      surface: 'shade-fill',
      tool,
      gesture,
      band: shadeRef.current?.erase ? 0 : shadeRef.current?.band ?? 3,
      erase: !!shadeRef.current?.erase,
      gapTol: gapMult,
      regionDepth: region ? region.depth : null,
      regionAreaWorld: region ? region.areaWorld : null,
      outcome,
      extractorVersion: REGION_EXTRACTOR_VERSION,
      regionCount,
    });
  }

  /** Commit one region as a ToneFill band patch: rasterize into the band
   *  grid (REPLACE semantics, src/gapTol provenance, dilation tucks tone
   *  under the visible ink) and re-extract the record. */
  function applyFillRegion(
    regions: FillRegion[],
    idx: number,
    gapMult: number,
    gesture: ShadeFillGesture,
  ) {
    const grid = toneGridRef.current;
    if (!grid) return;
    const r = regions[idx];
    const band = shadeRef.current?.erase ? 0 : shadeRef.current?.band ?? 3;
    // CLEAN EDGE (2026-06-13): hand the rasterizer the CENTERLINE polylines (raw
    // gesture paths) of the ink that BORDERS this region (bbox-overlap
    // pre-filter, + a generous margin = the gap inset so a far-inset boundary
    // still reaches its ink). The fill grows up to those centerlines — tone at
    // the centerline is covered by the ink-on-top (no white sliver) and sits
    // half-a-width inside the outer edge (no bleed), with the drawing's true
    // sharp corners. Independent of Gap (high Gap no longer rounds/insets it).
    const inkCenterlines = strokeCenterlinesNear(strokes, r.outline, gapMult);
    rasterizeFillPatch(grid, r.outline, fillChildrenOf(regions, idx), band, 'fill', {
      gapTol: gapMult,
      // Fallback only (no bordering ink): push the tone flush to (and under)
      // the visible ink edge via dilation — no inset gap.
      dilatePx: fillDilatePx(gapMult, !!shadeRef.current?.fullFill),
      inkCenterlines: inkCenterlines.length > 0 ? inkCenterlines : undefined,
    });
    setToneFills(extractToneFills(grid));
    lastMissRef.current = false;
    logShadeFill('fill', gesture, gapMult, r, 'committed', regions.length);
  }

  /** Tap/scrub-release commit at a point — innermost paper region wins;
   *  no region = honest miss (caption + log, never a stray blob). */
  function commitFillAt(pt: [number, number], gapIdx: number, gesture: ShadeFillGesture) {
    const regions = regionsFor(gapIdx);
    const hit = innermostPaperRegionAt(pt[0], pt[1], regions);
    if (hit < 0) {
      lastMissRef.current = true;
      logShadeFill('fill', gesture, GAP_LADDER[gapIdx], null, 'miss', regions.length);
      onFillNote?.(FILL_MISS_NOTE);
      return;
    }
    applyFillRegion(regions, hit, GAP_LADDER[gapIdx], gesture);
  }

  /** Highlight-drag release: every point votes for its innermost paper
   *  region; regions with ≥ 0.6 of the votes commit (LazyBrush's rule of
   *  majority, spec §5.3). None over the bar = honest miss. */
  function commitHighlight(pts: [number, number][] | null, gapIdx: number) {
    const regions = regionsFor(gapIdx);
    if (!pts || pts.length < 2) {
      lastMissRef.current = true;
      logShadeFill('fill', 'highlight', GAP_LADDER[gapIdx], null, 'miss', regions.length);
      onFillNote?.(FILL_MISS_NOTE);
      return;
    }
    const votes = new Map<number, number>();
    for (const [x, y] of pts) {
      const hit = innermostPaperRegionAt(x, y, regions);
      if (hit >= 0) votes.set(hit, (votes.get(hit) ?? 0) + 1);
    }
    const winners: number[] = [];
    for (const [idx, n] of votes) {
      if (n / pts.length >= 0.6) winners.push(idx);
    }
    winners.sort((a, b) => a - b); // deterministic commit order
    if (winners.length === 0) {
      lastMissRef.current = true;
      logShadeFill('fill', 'highlight', GAP_LADDER[gapIdx], null, 'miss', regions.length);
      onFillNote?.(FILL_MISS_NOTE);
      return;
    }
    for (const idx of winners) applyFillRegion(regions, idx, GAP_LADDER[gapIdx], 'highlight');
  }

  /** Lasso release: the loop auto-closes and ITS outline is the patch
   *  (D-RF7 — no extractor). Degenerate loops miss honestly. */
  function commitLasso(pts: [number, number][] | null) {
    const grid = toneGridRef.current;
    const gapMult = GAP_LADDER[currentGapIdx];
    if (!grid) return;
    const regionCount = regionsFor(currentGapIdx).length;
    if (!pts || lassoDegenerate(pts)) {
      lastMissRef.current = true;
      logShadeFill('lasso', 'lasso', gapMult, null, 'miss', regionCount);
      onFillNote?.('that lasso is too small — draw a bigger loop');
      return;
    }
    const band = shadeRef.current?.erase ? 0 : shadeRef.current?.band ?? 3;
    rasterizeFillPatch(grid, decimateLoop(pts), [], band, 'lasso', {});
    setToneFills(extractToneFills(grid));
    const outcome = lastMissRef.current ? 'lasso-after-miss' : 'committed';
    lastMissRef.current = false;
    logShadeFill('lasso', 'lasso', gapMult, null, outcome, regionCount);
  }

  /** Tear down any in-flight fill/lasso gesture (tool switches, Escape,
   *  rapid pill cycling — break-battery items). No commit. */
  function resetFillGesture() {
    const g = fillGesRef.current;
    if (g) window.clearTimeout(g.timer);
    fillGesRef.current = null;
    setFillGestureOn(false);
    setScrubState(null);
    setHighlightPts(null);
    setLassoPts(null);
    setFillHover(null);
  }

  // Mirror the preview pool out to an optional host (DrawPanel).
  useEffect(() => {
    onStrokesChange?.(strokes);
  }, [strokes, onStrokesChange]);

  // Mirror the tone pool out too — same stable-callback contract.
  useEffect(() => {
    onToneFillsChange?.(toneFills);
  }, [toneFills, onToneFillsChange]);

  // ── SHAPE ASSIST API (Rock F3) ──────────────────────────────────────────────
  // Latest strokes via ref so the API closure (installed once) never goes
  // stale. Snap/Straighten are EXPLICIT acts the host's pills invoke on the
  // last stroke — never on pen-up. fitLast is PURE (no mutation); applyToStroke
  // does the points-replace (stays a stroke, same id, renders in the pen).
  const strokesRef = useRef<Stroke[]>(strokes);
  strokesRef.current = strokes;
  // Selected stroke id via ref so the install-once API never reads a stale
  // selection (round-8 "select a different part").
  const selectedStrokeIdRef = useRef<string | null>(selectedStrokeId);
  selectedStrokeIdRef.current = selectedStrokeId;
  /** The stroke Snap/Straighten targets: the SELECTED stroke if one is set and
   *  still in the pool, else the LAST stroke (the original behavior). */
  const targetStroke = (): Stroke | null => {
    const pool = strokesRef.current;
    if (pool.length === 0) return null;
    const sel = selectedStrokeIdRef.current;
    if (sel) {
      const found = pool.find((s) => s.id === sel);
      if (found) return found;
    }
    return pool[pool.length - 1];
  };
  const snapApiRef = useRef<ShapeSnapApi | null>(null);
  if (snapApiRef.current === null) {
    snapApiRef.current = {
      lastStroke: () => {
        const t = targetStroke();
        return t ? { id: t.id, points: t.points } : null;
      },
      fitLast: (action) => {
        const t = targetStroke();
        if (!t) return null;
        if (t.points.length < 2) return null;
        const result = fitStroke(t.points as StrokeInputPoint[], action);
        return { strokeId: t.id, result };
      },
      applyToStroke: (strokeId, candidate, originalPoints) => {
        const next =
          candidate.kind === 'original'
            ? originalPoints
            : (applyShapeCandidate(candidate, originalPoints as StrokeInputPoint[]) as StrokePoint[]);
        setStrokes((prev) => prev.map((s) => (s.id === strokeId ? { ...s, points: next } : s)));
      },
    };
  }
  useEffect(() => {
    if (snapApiRef.current) onSnapApi?.(snapApiRef.current);
  }, [onSnapApi]);

  function handleFilePick() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // reset so same file can be re-uploaded
    if (!file) return;
    // Shared upload prep — type check + <svg> extraction + DOMPurify sanitize
    // (lib/svgUpload), the SAME sanitizer the desk feed uses. Replaces the old
    // inline regex strip (weaker: missed unquoted on* handlers, javascript:
    // hrefs, <foreignObject>, etc.). Returns ok+name+markup or ok:false+error.
    const result = await prepareSvgUpload(file);
    if (result.ok) {
      const markup = fitUploadMarkup(result.markup);
      setUploadedSvg({ name: result.name, markup });
      setUploadError(null);
    } else {
      setUploadError(result.error);
    }
  }

  function clearUpload() {
    setUploadedSvg(null);
    setUploadError(null);
  }

  // (Removed the smartHachure param-set + reload — engine defaults ON now;
  // the reload caused the white flash. ?smartHachure=0 opts out.)

  function eventToSvgPoint(e: React.PointerEvent): StrokePoint {
    const svg = svgRef.current;
    if (!svg) return [e.clientX, e.clientY, 0.5];
    // Map screen coords into SVG viewBox coords via the inverse screen CTM —
    // otherwise strokes drawn at e.g. (200, 100) land at tiny viewBox
    // coordinates when the canvas is rendered smaller than its 800×600 viewBox.
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) {
      const rect = svg.getBoundingClientRect();
      return [e.clientX - rect.left, e.clientY - rect.top, e.pressure || 0.5];
    }
    const svgPt = pt.matrixTransform(ctm.inverse());
    return [svgPt.x, svgPt.y, e.pressure || 0.5];
  }

  // The shade register owns the pointer when active (and drawing isn't
  // paused) — same gating as ink, different tool in the hand. The register
  // answers "tone goes down"; `tool` answers how (D-RF1).
  const shadeActive = !!shade?.active && !styled && input === 'draw' && mode !== '3d';
  const shadeToolKind: ShadeTool = shade?.tool ?? 'brush';
  const brushActive = shadeActive && shadeToolKind === 'brush';
  const fillActive = shadeActive && shadeToolKind === 'fill';
  const lassoActive = shadeActive && shadeToolKind === 'lasso';

  // Tool/register switches mid-gesture never strand a half-armed scrub or a
  // dangling lasso trail (rapid pill cycling — the break battery); stroke
  // edits invalidate the region cache wholesale.
  useEffect(() => {
    resetFillGesture();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shadeToolKind, shade?.erase, shadeActive, strokesSig]);

  // Entering Fill mode (or stroke edits while in it) pre-extracts the current
  // ladder step so the first hover answers instantly (spec §6: run on
  // entering Fill + debounced after stroke edits, NOT per pointermove).
  useEffect(() => {
    if (!fillActive) return;
    const t = window.setTimeout(() => regionsFor(currentGapIdx), 50);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fillActive, strokesSig, currentGapIdx]);

  /** Stamp one brush segment into the band grid — paint goes through the §3
   *  marker table; erase is the band-0 stamp (per-cell partial carve, §4 —
   *  the whole-patch lift this replaces couldn't carve). */
  function stampSegment(to: [number, number]) {
    const grid = toneGridRef.current;
    if (!grid || !shade) return;
    const from = lastTonePtRef.current ?? to;
    stampToneCapsule(grid, from[0], from[1], to[0], to[1], shade.radius, shade.erase ? 0 : shade.band);
    lastTonePtRef.current = to;
  }

  /** Pen-lift: the grid is the truth — extract merged per-band islands
   *  (pool-raster contours + holes) into the patch pool. Deterministic:
   *  same gestures → same grid → byte-identical record. */
  function commitToneStroke() {
    const grid = toneGridRef.current;
    if (grid) setToneFills(extractToneFills(grid));
    toneGestureRef.current = false;
    setToneBrush(null);
    lastTonePtRef.current = null;
  }

  // Whether a TONE gesture is mid-flight (pen down) — ref, not state, so the
  // Escape-cancel listener below never goes stale across pointermoves.
  const toneGestureRef = useRef(false);

  // TAP-TO-SELECT bookkeeping (round-8): the ink pointer-down's start point +
  // a moved flag. A pen-up that never moved past TAP_SLOP_PX is a TAP, not a
  // stroke — in the Ink register a tap on an earlier committed stroke SELECTS
  // it for Snap/Straighten (it stops being a rejected 1-point micro-stroke and
  // becomes a selection gesture). Refs so the move/up handlers read fresh
  // values without re-render churn.
  const inkDownPtRef = useRef<[number, number] | null>(null);
  const inkMovedRef = useRef(false);
  const TAP_SLOP_PX = 6;
  const SELECT_HIT_RADIUS_PX = 16;

  // ESCAPE = CANCEL THE IN-PROGRESS GESTURE (capture phase, ahead of the host
  // popup's layered-Escape handler — rock-F1 break battery caught the popup
  // closing mid-first-stroke and eating the gesture, because the host's guard
  // sees only COMMITTED strokes/tone). Mid-stroke Escape aborts just the
  // stroke: ink discards the in-progress points; tone restores the pre-stroke
  // grid snapshot (erase included — true cancel). The gesture is the topmost
  // "layer", so stopPropagation keeps every other Escape layer untouched;
  // with the pen up this listener isn't even mounted.
  const gestureActive =
    current !== null || toneBrush !== null || fillGestureOn || lassoPts !== null;
  useEffect(() => {
    if (!gestureActive) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      setCurrent(null);
      if (toneGestureRef.current) {
        const grid = toneGridRef.current;
        const snap = toneSnapshotRef.current;
        if (grid && snap) {
          grid.bands.set(snap.bands);
          grid.src.set(snap.src);
          grid.gapTolQ.set(snap.gapTolQ);
        }
        toneGestureRef.current = false;
        setToneBrush(null);
        lastTonePtRef.current = null;
      }
      // Fill/lasso gesture cancel (rock F2): no commit; a scrub restores the
      // pre-scrub Gap (true cancel — the persisted value is the one the user
      // RELEASED at, never the one they bailed on). Logged as 'cancelled'.
      const g = fillGesRef.current;
      if (g) {
        window.clearTimeout(g.timer);
        if (g.phase === 'scrub') onGapChange?.(GAP_LADDER[g.baseGapIdx]);
        logShadeFill(
          'fill',
          g.phase === 'scrub' ? 'scrub' : g.phase === 'highlight' ? 'highlight' : 'tap',
          GAP_LADDER[g.phase === 'scrub' ? g.lastIdx : g.baseGapIdx],
          null,
          'cancelled',
          regionCacheRef.current.get(`${strokesSig}|${g.lastIdx}`)?.length ?? 0,
        );
        fillGesRef.current = null;
        setFillGestureOn(false);
        setScrubState(null);
        setHighlightPts(null);
      } else if (lassoPts !== null) {
        logShadeFill('lasso', 'lasso', GAP_LADDER[currentGapIdx], null, 'cancelled', 0);
        setLassoPts(null);
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gestureActive]);

  function handlePointerDown(e: React.PointerEvent) {
    // Style mode pauses drawing — flip back to Draw to keep sketching.
    if (styled) return;
    if (input !== 'draw' || mode === '3d') return;
    (e.currentTarget as SVGElement).setPointerCapture(e.pointerId);
    if (fillActive) {
      // FILL — one pointer-down, three possible gestures (spec §5/§6):
      // release fast+still = TAP; move first = HIGHLIGHT scribble; hold
      // ~350ms still = the Gap SCRUB arms (horizontal drag walks the ladder
      // with a live re-extracted preview; release commits at that step).
      const [x, y] = eventToSvgPoint(e);
      const baseGapIdx = currentGapIdx;
      const timer = window.setTimeout(() => {
        const g = fillGesRef.current;
        if (g && g.phase === 'pending') {
          g.phase = 'scrub';
          setScrubState({ idx: g.baseGapIdx, anchor: g.start });
        }
      }, 350);
      fillGesRef.current = { phase: 'pending', start: [x, y], baseGapIdx, lastIdx: baseGapIdx, timer };
      setFillGestureOn(true);
      setFillHover(null);
      return;
    }
    if (lassoActive) {
      const [x, y] = eventToSvgPoint(e);
      setLassoPts([[x, y]]);
      return;
    }
    if (shadeActive) {
      const [x, y] = eventToSvgPoint(e);
      const grid = toneGridRef.current!;
      beginToneStroke(grid); // new stroke — reset the §3 dirty bitset
      toneSnapshotRef.current = {
        bands: grid.bands.slice(),
        src: grid.src.slice(),
        gapTolQ: grid.gapTolQ.slice(),
      }; // Escape = cancel (provenance rides the snapshot)
      toneGestureRef.current = true;
      lastTonePtRef.current = null;
      stampSegment([x, y]); // a tap is a dab (paint) / a dab-lift (erase)
      setToneBrush([[x, y]]);
      return;
    }
    // INK gesture begins — record the start for tap-vs-drag classification.
    const startPt = eventToSvgPoint(e);
    inkDownPtRef.current = [startPt[0], startPt[1]];
    inkMovedRef.current = false;
    setCurrent({ id: `s-${Date.now()}`, points: [startPt] });
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (fillActive) {
      const [x, y] = eventToSvgPoint(e);
      setHoverPt([x, y]);
      const g = fillGesRef.current;
      if (!g) {
        // HOVER PREVIEW (spec §5.1): the candidate region under the cursor,
        // translucent wash + dashed outline — no pointer-down, no commitment.
        // Regions come from the per-step cache; only pointInLoop runs here.
        const regions = regionsFor(currentGapIdx);
        const hit = innermostPaperRegionAt(x, y, regions);
        setFillHover((prev) => {
          if (hit < 0) return prev === null ? prev : null;
          if (prev && prev.gapIdx === currentGapIdx && prev.idx === hit) return prev;
          return { gapIdx: currentGapIdx, idx: hit };
        });
        return;
      }
      if (g.phase === 'pending') {
        if (Math.hypot(x - g.start[0], y - g.start[1]) > 8) {
          window.clearTimeout(g.timer);
          g.phase = 'highlight';
          setHighlightPts([g.start, [x, y]]);
        }
        return;
      }
      if (g.phase === 'scrub') {
        // Horizontal drag walks the ladder — one step per 56 viewBox px.
        // Re-extraction happens at most once per STEP (regionsFor cache).
        const idx = Math.max(
          0,
          Math.min(GAP_LADDER.length - 1, g.baseGapIdx + Math.round((x - g.start[0]) / 56)),
        );
        if (idx !== g.lastIdx) {
          g.lastIdx = idx;
          setScrubState({ idx, anchor: g.start });
          onGapChange?.(GAP_LADDER[idx]); // the chrome slider follows live
        }
        return;
      }
      // highlight
      setHighlightPts((p) => (p ? [...p, [x, y]] : [[x, y]]));
      return;
    }
    if (lassoActive) {
      const [x, y] = eventToSvgPoint(e);
      setHoverPt([x, y]);
      if (lassoPts) setLassoPts((p) => (p ? [...p, [x, y]] : p));
      return;
    }
    if (shadeActive) {
      const [x, y] = eventToSvgPoint(e);
      setHoverPt([x, y]);
      if (toneBrush) {
        stampSegment([x, y]);
        setToneBrush((b) => (b ? [...b, [x, y]] : b));
      }
      return;
    }
    if (!current) return;
    const pt = eventToSvgPoint(e);
    // Mark the gesture as a real drag once it travels past the tap slop — a
    // pen-up below that never set this is a TAP (select), not a stroke.
    const start = inkDownPtRef.current;
    if (start && Math.hypot(pt[0] - start[0], pt[1] - start[1]) > TAP_SLOP_PX) {
      inkMovedRef.current = true;
    }
    setCurrent((s) => (s ? { ...s, points: [...s.points, pt] } : null));
  }

  function handlePointerUp() {
    if (fillActive && fillGesRef.current) {
      const g = fillGesRef.current;
      window.clearTimeout(g.timer);
      fillGesRef.current = null;
      setFillGestureOn(false);
      if (g.phase === 'highlight') {
        commitHighlight(highlightPts, g.baseGapIdx);
        setHighlightPts(null);
      } else if (g.phase === 'scrub') {
        // Release commits at the scrubbed tolerance; the Gap value persists
        // (Procreate's remembered threshold, spec §6).
        commitFillAt(g.start, g.lastIdx, 'scrub');
        setScrubState(null);
      } else {
        commitFillAt(g.start, g.baseGapIdx, 'tap');
      }
      return;
    }
    if (lassoActive && lassoPts) {
      commitLasso(lassoPts);
      setLassoPts(null);
      return;
    }
    if (toneBrush) {
      commitToneStroke();
      return;
    }
    // TAP-TO-SELECT (round-8): a pen-up that never moved past the tap slop is a
    // TAP. If it landed on an earlier committed stroke, SELECT that stroke for
    // Snap/Straighten instead of committing a degenerate micro-stroke. A tap on
    // bare paper clears any selection (deselect). Only in the Ink register —
    // shade/fill/lasso have their own pointer-up paths above.
    if (current && !inkMovedRef.current) {
      const tap = current.points[0];
      const hitId = strokeAtPoint(strokes, tap[0], tap[1], SELECT_HIT_RADIUS_PX);
      setSelectedStrokeId(hitId); // hit → select; miss → deselect (null)
      setCurrent(null);
      inkDownPtRef.current = null;
      return;
    }
    if (!current || current.points.length < 2) { setCurrent(null); return; }
    // A genuine new stroke supersedes any selection (the latest stroke is the
    // implicit target again, matching the pre-round-8 behavior).
    setSelectedStrokeId(null);
    setStrokes((prev) => [...prev, current]);
    setCurrent(null);
    inkDownPtRef.current = null;
  }

  function handlePointerLeave() {
    setHoverPt(null);
    setFillHover(null);
    handlePointerUp();
  }

  function clearAll() {
    setStrokes([]);
    setCurrent(null);
    setSelectedStrokeId(null);
    setToneFills([]);
    setToneBrush(null);
    lastTonePtRef.current = null;
    const grid = toneGridRef.current;
    if (grid) {
      grid.bands.fill(0); // the grid IS the tone truth — clear it too
      grid.src.fill(0); // provenance sidecars follow the truth
      grid.gapTolQ.fill(0);
    }
    regionCacheRef.current.clear();
    resetFillGesture();
    setCommitted(false);
  }

  function commitDrawing() {
    if (strokes.length === 0) return;
    setCommitted(true);
  }

  function reopenForEdit() {
    setCommitted(false);
  }

  const allStrokes = current ? [...strokes, current] : strokes;
  const isUpload = input === 'upload-svg';

  // REGION-FILL preview resolution (render-time, cache-backed — extraction
  // never runs per pointermove, only on a cache miss at a new ladder step).
  // Scrub preview re-resolves the region under the press ANCHOR at the live
  // step — the user watches gaps close/regions merge as they drag (§6).
  let fillPreview: { outline: [number, number][]; holes: [number, number][][] } | null = null;
  if (fillActive) {
    if (scrubState) {
      const regions = regionsFor(scrubState.idx);
      const hit = innermostPaperRegionAt(scrubState.anchor[0], scrubState.anchor[1], regions);
      if (hit >= 0) {
        fillPreview = { outline: regions[hit].outline, holes: fillChildrenOf(regions, hit) };
      }
    } else if (fillHover) {
      const regions = regionsFor(fillHover.gapIdx);
      if (fillHover.idx < regions.length) {
        fillPreview = {
          outline: regions[fillHover.idx].outline,
          holes: fillChildrenOf(regions, fillHover.idx),
        };
      }
    }
  }

  return (
    <div
      style={{
        width: '100%',
        ...(fill
          ? { height: '100%' }
          : { maxWidth: 920, maxHeight: '100%', aspectRatio: `${VIEWBOX_W} / ${VIEWBOX_H}` }),
        position: 'relative',
        background: 'var(--dir-bg)',
        border: '1px solid var(--dir-border)',
        borderRadius: 6,
        overflow: 'hidden',
      }}
    >
      {/* Hidden file input — surfaces native file picker on click. */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".svg,image/svg+xml"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      {/* UPLOAD-SVG branch — when uploaded, render through SvgStyleTransform
          so the uploaded SVG picks up the active style/modifiers. */}
      {isUpload && uploadedSvg && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <SvgStyleTransform
            wrapperOverride={{ display: 'block', width: '100%', height: '100%' }}
          >
            <div
              style={{ width: '100%', height: '100%' }}
              dangerouslySetInnerHTML={{ __html: uploadedSvg.markup }}
            />
          </SvgStyleTransform>
        </div>
      )}
      {/* Layer 0 — UPLOAD BACKDROP, raw (Sketch mode). Letterboxed into the
          same 800×600 frame space the strokes live in, so draw-over lands
          where the eye says it does. Hidden in Style mode — the merged layer
          below renders backdrop + strokes together instead. */}
      {backdrop && !styled && (
        <div
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
          aria-hidden
          dangerouslySetInnerHTML={{ __html: backdropDisplayMarkup(backdrop) }}
        />
      )}
      {/* Layer 0t — TONE PATCHES, raw (Sketch mode): flat band-grey UNDER the
          ink strokes (round-7 contract), above any upload backdrop. One <g>
          per band at one opacity — overlap WITHIN a band composites solid-
          then-fades, so it never compounds into a band the user didn't brush
          (flat by construction; post-rebuild the extraction merges per-band
          islands so there's at most a handful of disjoint paths per band);
          bands ascend so darker paints over lighter. Opacity 0.9 (was 0.55 —
          WYSIWYG gap SB-3: the styled pipeline reads the FULL band grey, so
          the raw preview must stop lying ~half a ladder light; exact value is
          a Sebs eyeball). Holes render via evenodd subpaths. Style mode skips
          this layer — the patches ride the styled markup instead.
          CLEAN-EDGE (2026-06-13): when the sketch layer (1b) is active it
          RE-ASSERTS the tone over its paper halos (to kill the interior sliver),
          so this base layer would double-paint and darken it — skip here in that
          case (1b owns the tone then). This layer still carries the tone when
          there are no strokes / after commit. */}
      {!styled && toneFills.length > 0 && !(!committed && strokes.length > 0) && (
        <svg
          viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
          width="100%"
          height="100%"
          xmlns="http://www.w3.org/2000/svg"
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
          aria-hidden
        >
          {COVERAGE_BANDS.map((_, band) => {
            const hex = TONE_BAND_HEX[band];
            if (!hex) return null;
            const fills = toneFills.filter((f) => f.band === band && f.points.length >= 3);
            if (fills.length === 0) return null;
            return (
              <g key={band} opacity={0.9}>
                {fills.map((f) => (
                  <path
                    key={f.id}
                    d={tonePathD(f.points, f.holes)}
                    fill={hex}
                    fillRule="evenodd"
                    stroke="none"
                  />
                ))}
              </g>
            );
          })}
        </svg>
      )}
      {/* Layer 0s — UPLOAD BACKDROP + strokes, MERGED, in Style mode: ONE
          SvgStyleTransform over the SAME composed markup Done stages (full-
          frame viewBox so it letterboxes exactly like the raw layers). The
          live preview IS the published render — upload parity, ROUND 6. */}
      {backdrop && styled && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <SvgStyleTransform
            wrapperOverride={{ display: 'block', width: '100%', height: '100%' }}
          >
            <div
              style={{ width: '100%', height: '100%' }}
              aria-hidden
              dangerouslySetInnerHTML={{
                __html: composeBackdropAndStrokes(backdrop, strokes, {
                  tight: false,
                  toneFills,
                }),
              }}
            />
          </SvgStyleTransform>
        </div>
      )}
      {/* Layer 1a — when COMMITTED (or the host's Style mode is on), strokes
          AND tone patches flow through SvgStyleTransform so they pick up the
          active style and re-render live as the pen controls change. Tone
          patches enter FIRST (under ink) as flat solid band-greys — the
          pipeline's signals layer reads the grey as source darkness and the
          shading machinery converts it to fillStyle marks at band density
          (band → coverage.ts — the I-2 wedge). (With a backdrop the merged
          layer above already carries strokes + tone — skip.) */}
      {(committed || styled) && (strokes.length > 0 || toneFills.length > 0) && !backdrop && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <SvgStyleTransform
            wrapperOverride={{ display: 'block', width: '100%', height: '100%' }}
          >
            <svg
              viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
              width="100%"
              height="100%"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              {sortedToneFills(toneFills).map((f) => {
                const hex = TONE_BAND_HEX[f.band];
                if (!hex || f.points.length < 3) return null;
                return (
                  <path
                    key={f.id}
                    d={tonePathD(f.points, f.holes)}
                    fill={hex}
                    fillRule="evenodd"
                    stroke="none"
                    data-tone-band={f.band}
                  />
                );
              })}
              {strokes.map((stroke) => (
                <path
                  key={stroke.id}
                  d={strokeToPolylinePath(stroke.points)}
                  fill="none"
                  stroke="var(--dir-text-primary)"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}
            </svg>
          </SvgStyleTransform>
        </div>
      )}
      {/* Layer 1b — while NOT committed (and not live-styling), render strokes
          raw as perfect-freehand polygons so user sees what they drew, unstyled.
          INK READS ON TOP OF TONE (Sketch preview, round-8 fix): this layer is
          emitted AFTER Layer 0t so the DOM paint order already puts ink over
          tone — but the ink color (var(--dir-text-primary), near-black) and the
          darkest tone band (band 7, also near-black at 0.9 opacity) are the SAME
          value, so a dark band visually SWALLOWED the ink (the "tone over ink,
          inverted vs styled" report). The styled render never has this problem
          (tone becomes sparse marks, ink stays a distinct stroke on top). The
          fix mirrors that legibility: each ink polygon carries a thin
          paper-colored halo UNDERNEATH it (a slightly-wider paper stroke on the
          same path), so against ANY tone darkness the ink keeps a paper rim and
          reads clearly on top — no z-reorder needed, the order was already
          right. The halo only matters where ink crosses a dark band; on bare
          paper it's invisible (paper on paper). */}
      {!committed && !styled && strokes.length > 0 && (
        <svg
          viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
          width="100%"
          height="100%"
          xmlns="http://www.w3.org/2000/svg"
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
          aria-hidden
        >
          {/* CLEAN-EDGE z-order (2026-06-13): selection accents + paper halos
              FIRST, then the tone fill RE-ASSERTED over them, then the ink
              bodies LAST. The fill now tucks cleanly under the ink (the rasterizer
              conforms it to the ink centerline), so painting it over the halo
              removes the halo's interior paper SLIVER between fill and ink — the
              bug Sebs flagged — while the halo still does its job under the ink
              (and on bare-paper strokes, where there's no fill to re-assert).
              The polygon d-string is computed ONCE per stroke (halo + ink share
              it) — perfect-freehand isn't cheap. */}
          {(() => {
            const inkPaths = strokes.map((stroke) => ({
              id: stroke.id,
              d: strokeToPolygonPath(stroke.points),
              selD: stroke.id === selectedStrokeId ? strokeToPolylinePath(stroke.points) : null,
            }));
            return (
              <>
                {inkPaths.map((s) =>
                  s.selD ? (
                    <path
                      key={`sel-${s.id}`}
                      data-selected-stroke={s.id}
                      d={s.selD}
                      fill="none"
                      stroke="var(--dir-accent)"
                      strokeOpacity={0.5}
                      strokeWidth={10}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ) : null,
                )}
                {inkPaths.map((s) => (
                  <path
                    key={`halo-${s.id}`}
                    d={s.d}
                    fill="none"
                    stroke="var(--dir-bg)"
                    strokeWidth={3}
                    strokeLinejoin="round"
                  />
                ))}
                {/* Tone re-asserted over the halo (kills the interior sliver). */}
                {sortedToneFills(toneFills).map((f) => {
                  const hex = TONE_BAND_HEX[f.band];
                  if (!hex || f.points.length < 3) return null;
                  return (
                    <path
                      key={`tone-${f.id}`}
                      d={tonePathD(f.points, f.holes)}
                      fill={hex}
                      fillRule="evenodd"
                      stroke="none"
                      opacity={0.9}
                    />
                  );
                })}
                {inkPaths.map((s) => (
                  <path key={`ink-${s.id}`} d={s.d} fill="var(--dir-text-primary)" stroke="none" />
                ))}
              </>
            );
          })()}
        </svg>
      )}
      {/* Layer 2: live in-progress stroke / tone brush + pointer capture
          surface. In shade mode the native cursor hides — the in-svg
          footprint ring below is the honest cursor (radius lives in viewBox
          units; a CSS cursor can't show the true brushed size). */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
        width="100%"
        height="100%"
        style={{
          position: 'absolute',
          inset: 0,
          // Brush hides the native cursor (the footprint ring is the honest
          // cursor); Fill/Lasso keep the crosshair — their honest cursor is
          // the live region preview / loop trail itself.
          cursor: brushActive ? 'none' : input === 'draw' ? 'crosshair' : 'default',
          touchAction: 'none',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
      >
        {current && (
          <path
            d={strokeToPolygonPath(current.points)}
            fill="var(--dir-text-primary)"
            fillOpacity={0.9}
            stroke="none"
          />
        )}
        {/* Live tone sweep — the while-pen-down preview (SB-6: the cheap
            swept capsule; the grid is the truth in parallel and lands at
            pen-lift). Paint previews at the SAME 0.9 the committed raw layer
            uses; erase previews as a dashed accent sweep showing the carve
            footprint (the carve itself lands at pen-lift). */}
        {shadeActive && toneBrush && !shade?.erase && (
          <path
            d={tonePathD(toneOutline(toneBrush, shade?.radius ?? 24))}
            fill={TONE_BAND_HEX[shade?.band ?? 3] ?? '#888888'}
            fillOpacity={0.9}
            stroke="none"
          />
        )}
        {shadeActive && toneBrush && shade?.erase && (
          <path
            d={tonePathD(toneOutline(toneBrush, shade?.radius ?? 24))}
            fill="none"
            stroke="var(--dir-accent)"
            strokeWidth={1.25}
            strokeDasharray="5 4"
          />
        )}
        {/* Brush-footprint ring — paint mode shows the band grey; erase mode
            shows a dashed accent lifter. Brush tool only — Fill/Lasso have
            their own honest cursors below. */}
        {brushActive && hoverPt && (
          <circle
            cx={hoverPt[0]}
            cy={hoverPt[1]}
            r={shade?.radius ?? 24}
            fill={shade?.erase ? 'none' : TONE_BAND_HEX[shade?.band ?? 3] ?? '#888888'}
            fillOpacity={shade?.erase ? 0 : 0.18}
            stroke={shade?.erase ? 'var(--dir-accent)' : 'var(--dir-text-body-soft)'}
            strokeWidth={1.25}
            strokeDasharray={shade?.erase ? '5 4' : undefined}
            pointerEvents="none"
          />
        )}
        {/* FILL preview — the candidate region as a translucent band wash +
            dashed outline (spec §5.1, the honest-cursor idiom): hover shows
            it before any commitment; during a Gap scrub it re-extracts live
            per ladder step. Erase mode previews outline-only (a lifter takes
            tone away — washing it on would lie). Holes render via evenodd so
            a donut-ring preview shows the ring only. */}
        {fillPreview && (
          <path
            data-fill-preview
            d={tonePathD(fillPreview.outline, fillPreview.holes)}
            fill={shade?.erase ? 'none' : TONE_BAND_HEX[shade?.band ?? 3] ?? '#888888'}
            fillOpacity={shade?.erase ? 0 : 0.35}
            fillRule="evenodd"
            stroke={shade?.erase ? 'var(--dir-accent)' : 'var(--dir-text-secondary)'}
            strokeWidth={1.25}
            strokeDasharray="6 4"
            pointerEvents="none"
          />
        )}
        {/* Gap-scrub readout — the live multiplier above the press anchor
            (the Procreate threshold-bar moment, ours says the number). */}
        {scrubState && (
          <g data-gap-scrub pointerEvents="none">
            <text
              x={scrubState.anchor[0]}
              y={Math.max(18, scrubState.anchor[1] - 16)}
              textAnchor="middle"
              style={{
                fontFamily: IS,
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: '0.04em',
                fill: 'var(--dir-text-primary)',
              }}
            >
              Gap {GAP_LADDER[scrubState.idx]}×
            </text>
          </g>
        )}
        {/* Highlight-drag trail — transient accent scribble (never recorded
            as ink, spec §5.3); regions it majority-covers commit on release. */}
        {highlightPts && highlightPts.length > 1 && (
          <path
            data-fill-highlight
            d={strokeToPolylinePath(highlightPts.map(([x, y]) => [x, y, 0.5] as StrokePoint))}
            fill="none"
            stroke="var(--dir-accent)"
            strokeOpacity={0.45}
            strokeWidth={12}
            strokeLinecap="round"
            strokeLinejoin="round"
            pointerEvents="none"
          />
        )}
        {/* Lasso trail — the loop-in-progress (D-RF7). Three honest layers so
            auto-close is NEVER a surprise (Sebs-ratified):
              1. WASH — the area that WILL commit (drawn trail + the closing
                 chord, fill-only, Z-closed) so the user sees the captured area;
              2. TRAIL — the actually-drawn path, a SOLID accent line (no Z) —
                 this is the ink the pointer has laid down;
              3. CHORD — a distinct DASHED line from the live pointer back to
                 the START point, plus a start marker: the closing edge the
                 release will snap shut. Visually separate from the solid trail
                 so the user reads exactly where the loop will close.
            Erase mode drops the wash (a lifter takes tone away — washing it on
            would lie); the trail + chord stay so the loop is still legible. */}
        {lassoPts && lassoPts.length > 1 && (
          <g data-lasso pointerEvents="none">
            {!shade?.erase && (
              <path
                data-lasso-wash
                d={`${strokeToPolylinePath(lassoPts.map(([x, y]) => [x, y, 0.5] as StrokePoint))} Z`}
                fill={TONE_BAND_HEX[shade?.band ?? 3] ?? '#888888'}
                fillOpacity={0.18}
                stroke="none"
              />
            )}
            <path
              data-lasso-trail
              d={strokeToPolylinePath(lassoPts.map(([x, y]) => [x, y, 0.5] as StrokePoint))}
              fill="none"
              stroke="var(--dir-accent)"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Live closing chord: pointer → start. Dashed + lighter so it
                reads as "this snaps shut on release", distinct from the solid
                drawn trail. */}
            <line
              data-lasso-chord
              x1={lassoPts[lassoPts.length - 1][0]}
              y1={lassoPts[lassoPts.length - 1][1]}
              x2={lassoPts[0][0]}
              y2={lassoPts[0][1]}
              stroke="var(--dir-accent)"
              strokeOpacity={0.55}
              strokeWidth={1.25}
              strokeDasharray="5 4"
            />
            {/* Start marker — the anchor the chord closes onto. */}
            <circle
              data-lasso-start
              cx={lassoPts[0][0]}
              cy={lassoPts[0][1]}
              r={3.5}
              fill="var(--dir-bg)"
              stroke="var(--dir-accent)"
              strokeWidth={1.5}
            />
          </g>
        )}
      </svg>
      {/* Empty-state hint — DRAW mode: warm sentence-case invitation (was
          shouty uppercase; warmth pass 2026-06-11). UPLOAD-SVG mode: prompt
          to pick a file. Upload-image is covered by its honesty gate below. */}
      {((input === 'draw' && allStrokes.length === 0 && toneFills.length === 0 && !backdrop) ||
        (isUpload && !uploadedSvg)) && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: IS,
            fontSize: 13,
            color: 'var(--dir-text-body-soft)',
            gap: 12,
            pointerEvents: isUpload ? 'auto' : 'none',
          }}
        >
          {isUpload ? (
            <>
              <button
                onClick={handleFilePick}
                style={{
                  ...PILL,
                  padding: '10px 22px',
                  background: 'var(--dir-bg)',
                  // Heavier primary-ink border is the empty-state affordance —
                  // this is THE action in an otherwise blank frame. Full
                  // shorthand, never borderColor over PILL's shorthand
                  // (React dev warns on shorthand/longhand style conflicts).
                  border: '1px solid var(--dir-text-primary)',
                }}
              >
                Pick an .svg file
              </button>
              {uploadError && (
                <span style={{ color: 'var(--dir-accent)', fontSize: 11, textTransform: 'none' }}>
                  {uploadError}
                </span>
              )}
            </>
          ) : (
            <>Draw your doodle</>
          )}
        </div>
      )}
      {/* Draw-mode action buttons — Done commits to Smart Hachure, Clear resets,
          Reopen lets user keep drawing after a Done. Hidden when a host panel
          (DrawPanel) supplies its own Done/Cancel chrome. */}
      {!hideActions && !isUpload && strokes.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            display: 'flex',
            gap: 6,
            alignItems: 'center',
          }}
        >
          {!committed ? (
            <button
              onClick={commitDrawing}
              style={{
                ...CTA_PILL,
                padding: '6px 16px',
                fontSize: 10,
                letterSpacing: '0.06em',
              }}
            >
              Done ({strokes.length})
            </button>
          ) : (
            <button onClick={reopenForEdit} style={FRAME_PILL}>
              Edit
            </button>
          )}
          <button onClick={clearAll} style={FRAME_PILL}>
            Clear
          </button>
        </div>
      )}
      {isUpload && uploadedSvg && (
        <div
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            display: 'flex',
            gap: 6,
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontFamily: IS,
              color: 'var(--dir-text-body-soft)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              padding: '4px 10px',
              borderRadius: 999,
              background: 'var(--dir-raised)',
              border: '1px solid var(--dir-border)',
            }}
          >
            {uploadedSvg.name}
          </span>
          <button onClick={handleFilePick} style={FRAME_PILL}>
            Replace
          </button>
          <button onClick={clearUpload} style={FRAME_PILL}>
            Clear
          </button>
        </div>
      )}
      {/* IMAGE-UPLOAD HONESTY GATE — same treatment as the 3D gate: an opaque
          cover instead of a dead canvas (no file picker, no inert controls).
          The autotrace path (stretch S1) is what makes image→object real;
          until then SVG upload is the working route. State underneath stays
          intact; switching input restores it. */}
      {input === 'upload-image' && (
        <div style={GATE_STYLE}>
          <span style={{ fontWeight: 600, textTransform: 'uppercase' }}>
            Image upload is coming
          </span>
          <span>SVG upload works today — switch input to Upload SVG.</span>
        </div>
      )}
      {/* 3D HONESTY GATE — opaque placeholder covers the live 2D surface so the
          toggle doesn't lie. Strokes/upload state stay intact underneath; flipping
          back to 2D restores everything. Rendered LAST so it wins over the
          image-upload gate if both apply. */}
      {mode === '3d' && (
        <div style={GATE_STYLE}>
          <span style={{ fontWeight: 600, textTransform: 'uppercase' }}>3D mode is being wired</span>
          <span>Rod &amp; Extrude geometry built from your strokes — landing soon.</span>
        </div>
      )}
    </div>
  );
}

// ─── ToneShadeCluster — the shade register's tool chrome ─────────────────────
// Band picker (the FULL coverage.ts ladder: 7 paint swatches + Erase, which IS
// band 0/paper — absence of tone) + brush-size slider. Controlled component so
// any host owns the state: DrawPanel mounts it beside its Sketch|Style row;
// ObjectSurface's Re-draw mounts the same cluster when it wires tone editing
// (cross-rock contract — pairs with DrawSurface's shade/initialToneFills/
// onToneFillsChange props). Pill idioms per chromeStyles.

/** Which tool the Shade register wields (D-RF1: Fill/Lasso live INSIDE the
 *  register's tool row — the register answers "tone goes down", the tool
 *  answers how). */
export type ShadeTool = 'brush' | 'fill' | 'lasso';

export type ShadeToolState = {
  /** Brush | Fill | Lasso — the register's tool pills. */
  tool: ShadeTool;
  /** COVERAGE_BANDS index 1–7 (paint band) — shared by all three tools. */
  band: number;
  /** Brush radius, draw-frame viewBox px (Brush tool). */
  radius: number;
  /** Erase mode — shared by all three tools: brush carves per-cell; Fill
   *  lifts the tapped region; Lasso lifts its loop (band 0 = paper). */
  erase: boolean;
  /** Fill gap-tolerance multiplier (GAP_LADDER tick, persists per session —
   *  the Procreate remembered-threshold behavior, spec §6). ROUND-8: the Gap
   *  ladder now drives FILL FLUSHNESS too (low = tucked inset, top tick = flush
   *  to the ink edge = "fully fill"), so the slider is live on closed shapes
   *  and the Full-fill pill is just a one-tap jump to the top tick. */
  gap: number;
};

export const SHADE_TOOL_DEFAULT: ShadeToolState = {
  tool: 'brush',
  band: 3,
  radius: 26,
  erase: false,
  gap: 1,
};

export function ToneShadeCluster({
  value,
  onChange,
  disabled,
}: {
  value: ShadeToolState;
  onChange: (next: ShadeToolState) => void;
  disabled?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        rowGap: 6,
        flexWrap: 'wrap',
        minWidth: 0,
        opacity: disabled ? 0.45 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
      }}
    >
      {/* Tool pills — Brush | Fill | Lasso (D-RF1: tools INSIDE the Shade
          register; band swatches + Erase shared by all three). Same pill
          grammar as the Ink|Shade register pills. */}
      <div style={{ display: 'flex', gap: 6 }} role="radiogroup" aria-label="Shade tool">
        {(
          [
            ['brush', 'Brush', 'Brush soft tone regions freehand'],
            ['fill', 'Fill', 'Tap inside a region to fill it — hold & drag sideways to scrub Gap'],
            ['lasso', 'Lasso', 'Draw a loop — it closes on release and becomes the patch'],
          ] as [ShadeTool, string, string][]
        ).map(([tool, label, title]) => (
          <button
            key={tool}
            role="radio"
            aria-checked={value.tool === tool}
            data-shade-tool={tool}
            title={title}
            onClick={() => onChange({ ...value, tool })}
            style={{
              ...PILL,
              padding: '6px 14px',
              flexShrink: 0,
              background: value.tool === tool ? 'var(--dir-text-primary)' : 'var(--dir-bg)',
              color: value.tool === tool ? 'var(--dir-bg)' : 'var(--dir-text-primary)',
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <span
        aria-hidden
        style={{ width: 1, alignSelf: 'stretch', background: 'var(--dir-border)', flexShrink: 0 }}
      />
      {/* Band swatches — bands 1..7 of the one 8-band table, light → dark. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }} role="radiogroup" aria-label="Tone band">
        {COVERAGE_BANDS.map((b, band) => {
          const hex = TONE_BAND_HEX[band];
          if (!hex) return null; // band 0 = paper = the Erase pill
          const selected = !value.erase && value.band === band;
          return (
            <button
              key={band}
              role="radio"
              aria-checked={selected}
              data-tone-swatch={band}
              title={`${b.name} — band ${band} of 7`}
              onClick={() => onChange({ ...value, band, erase: false })}
              style={{
                width: 20,
                height: 20,
                borderRadius: 999,
                padding: 0,
                background: hex,
                cursor: 'pointer',
                border: '1px solid var(--dir-border)',
                boxShadow: selected
                  ? '0 0 0 2px var(--dir-bg), 0 0 0 4px var(--dir-accent)'
                  : 'none',
                flexShrink: 0,
              }}
            />
          );
        })}
      </div>
      <button
        onClick={() => onChange({ ...value, erase: !value.erase })}
        aria-pressed={value.erase}
        data-tone-erase
        title="Paper (band 0) — brush to carve tone away; lighten = erase, then re-brush lighter"
        style={{
          ...PILL,
          padding: '5px 12px',
          background: value.erase ? 'var(--dir-text-primary)' : 'var(--dir-bg)',
          color: value.erase ? 'var(--dir-bg)' : 'var(--dir-text-primary)',
          flexShrink: 0,
        }}
      >
        Erase
      </button>
      {/* Per-tool slider slot (spec §3: same slot, per-tool relabel) —
          Brush: radius (viewBox px, 29 ticks). Fill: the Gap tolerance
          ladder (6 ticks, multiplier on the extractor's ink-stamp radius).
          Lasso: no slider — the loop IS the patch. */}
      {value.tool === 'brush' && (
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            minWidth: 0,
            fontFamily: IS,
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--dir-text-secondary)',
            whiteSpace: 'nowrap',
          }}
          title="Brush radius — soft region size, in canvas units"
        >
          Brush
          <input
            type="range"
            className="dd-range"
            min={8}
            max={64}
            step={2}
            value={value.radius}
            onChange={(e) => onChange({ ...value, radius: Number(e.target.value) })}
            style={{ width: 90 }}
            aria-label="Brush radius"
          />
          <span style={{ color: 'var(--dir-text-body-soft)', fontVariantNumeric: 'tabular-nums' }}>
            {value.radius}px
          </span>
        </label>
      )}
      {value.tool === 'fill' && (
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            minWidth: 0,
            fontFamily: IS,
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--dir-text-secondary)',
            whiteSpace: 'nowrap',
          }}
          title="Gap tolerance — how big an ink gap the fill may leap (×0.5–×3 of the ink-stamp radius); press-hold-drag on the canvas scrubs it live"
        >
          Gap
          <input
            type="range"
            className="dd-range"
            min={0}
            max={GAP_LADDER.length - 1}
            step={1}
            value={gapIdxOf(value.gap)}
            onChange={(e) => onChange({ ...value, gap: GAP_LADDER[Number(e.target.value)] })}
            style={{ width: 90 }}
            aria-label="Gap tolerance"
          />
          <span style={{ color: 'var(--dir-text-body-soft)', fontVariantNumeric: 'tabular-nums' }}>
            {value.gap}×
          </span>
        </label>
      )}
      {/* FULL FILL (round-8, Sebs "ability to fully fill") — Fill tool only:
          one tap snaps the Gap to the top of the ladder, which fills flush to
          the ink edge with no inset gap (fillDilatePx: the inset ring → 0 at
          the ladder top). Lit when already at the flush tick. This is the
          explicit "fully fill" affordance riding the same Gap field the host
          already forwards — no stub control, no extra wiring. */}
      {value.tool === 'fill' && (
        <button
          onClick={() =>
            onChange({
              ...value,
              gap: value.gap >= GAP_LADDER[GAP_LADDER.length - 1] ? GAP_LADDER[2] : GAP_LADDER[GAP_LADDER.length - 1],
            })
          }
          aria-pressed={value.gap >= GAP_LADDER[GAP_LADDER.length - 1]}
          data-tone-fullfill
          title="Full fill — fill flush to the ink edge with no inset gap (tap again to return to a tucked-in fill)"
          style={{
            ...PILL,
            padding: '5px 12px',
            flexShrink: 0,
            background:
              value.gap >= GAP_LADDER[GAP_LADDER.length - 1]
                ? 'var(--dir-text-primary)'
                : 'var(--dir-bg)',
            color:
              value.gap >= GAP_LADDER[GAP_LADDER.length - 1] ? 'var(--dir-bg)' : 'var(--dir-text-primary)',
          }}
        >
          Full fill
        </button>
      )}
    </div>
  );
}
