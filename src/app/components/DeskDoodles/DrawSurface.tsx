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
  type ToneMaskGrid,
  type ToneFill,
} from '../../lib/toneMask';

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
  /** THE SHADE REGISTER (round 7, tone-fill brush): when `active`, the
   *  pointer brushes TONE instead of ink — soft band-grey regions in the
   *  discrete coverage.ts 8-band ladder, stored as ToneFill records (the
   *  explicit shading register — mark-intent D2-F: always beats inference).
   *  `erase` flips the brush into a patch-lifter (band 0 = paper = absence).
   *  Tool state is owned by the host's chrome (DrawPanel's Ink|Shade pills +
   *  band cluster); /canvas leaves this unset — zero behavior change. */
  shade?: { active: boolean; band: number; radius: number; erase: boolean } | null;
  /** Preload tone patches (Re-draw: the object's recorded tone comes back
   *  editable, sibling of initialStrokes — addendum ch.2 lifecycle). */
  initialToneFills?: ToneFill[];
  /** Live mirror of the tone-patch pool — same contract as onStrokesChange
   *  (stable callback, fired from an effect). The host stages
   *  render_config.toneFills from this at Done. */
  onToneFillsChange?: (toneFills: ToneFill[]) => void;
}) {
  // PREVIEW strokes — gestures the user has finished pen-up on but hasn't
  // committed yet. While in this state they render as raw perfect-freehand
  // polygons so the user sees their drawing AS DRAWN, not pre-styled.
  const [strokes, setStrokes] = useState<Stroke[]>(() =>
    (initialStrokes ?? []).map((points, i) => ({ id: `loaded-${i}`, points })),
  );
  // CURRENT stroke — the one being actively dragged.
  const [current, setCurrent] = useState<Stroke | null>(null);
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
  // (caught by the rock-F1 break battery).
  const toneSnapshotRef = useRef<Uint8Array | null>(null);
  // Pointer position while the shade register is active — drives the honest
  // brush-footprint ring (the radius is in viewBox units, so a CSS cursor
  // could not show the true footprint).
  const [hoverPt, setHoverPt] = useState<[number, number] | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Mirror the preview pool out to an optional host (DrawPanel).
  useEffect(() => {
    onStrokesChange?.(strokes);
  }, [strokes, onStrokesChange]);

  // Mirror the tone pool out too — same stable-callback contract.
  useEffect(() => {
    onToneFillsChange?.(toneFills);
  }, [toneFills, onToneFillsChange]);

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
      // SIZE NORMALIZATION at the upload boundary — an <svg> with a viewBox
      // but no width/height renders 0×0 when injected (found 2026-06-11 via
      // fixture diagnostic: rose worked only because it carried explicit
      // attrs). Force the root svg to fill its frame; the viewBox letterboxes
      // content. Desk-object normalization (~180px, normalizeSvgSize) stays
      // at the desk-canvas boundary per the locked auto-resize decision.
      const markup = result.markup.replace(
        /<svg\b([^>]*)>/i,
        (_m, attrs: string) => {
          // No viewBox? Derive one from the source width/height BEFORE
          // stripping them — otherwise forcing 100% leaves raw pixel coords
          // with no mapping and big files overflow the frame (rose bug,
          // Sebs 2026-06-12: "this still not resizing stuff").
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
            .replace(/\sheight="[^"]*"/i, '');
          return `<svg${cleaned}${viewBox} width="100%" height="100%">`;
        },
      );
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
  // paused) — same gating as ink, different tool in the hand.
  const shadeActive = !!shade?.active && !styled && input === 'draw' && mode !== '3d';

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

  // ESCAPE = CANCEL THE IN-PROGRESS GESTURE (capture phase, ahead of the host
  // popup's layered-Escape handler — rock-F1 break battery caught the popup
  // closing mid-first-stroke and eating the gesture, because the host's guard
  // sees only COMMITTED strokes/tone). Mid-stroke Escape aborts just the
  // stroke: ink discards the in-progress points; tone restores the pre-stroke
  // grid snapshot (erase included — true cancel). The gesture is the topmost
  // "layer", so stopPropagation keeps every other Escape layer untouched;
  // with the pen up this listener isn't even mounted.
  const gestureActive = current !== null || toneBrush !== null;
  useEffect(() => {
    if (!gestureActive) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      setCurrent(null);
      if (toneGestureRef.current) {
        const grid = toneGridRef.current;
        if (grid && toneSnapshotRef.current) grid.bands.set(toneSnapshotRef.current);
        toneGestureRef.current = false;
        setToneBrush(null);
        lastTonePtRef.current = null;
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [gestureActive]);

  function handlePointerDown(e: React.PointerEvent) {
    // Style mode pauses drawing — flip back to Draw to keep sketching.
    if (styled) return;
    if (input !== 'draw' || mode === '3d') return;
    (e.currentTarget as SVGElement).setPointerCapture(e.pointerId);
    if (shadeActive) {
      const [x, y] = eventToSvgPoint(e);
      beginToneStroke(toneGridRef.current!); // new stroke — reset the §3 dirty bitset
      toneSnapshotRef.current = toneGridRef.current!.bands.slice(); // Escape = cancel
      toneGestureRef.current = true;
      lastTonePtRef.current = null;
      stampSegment([x, y]); // a tap is a dab (paint) / a dab-lift (erase)
      setToneBrush([[x, y]]);
      return;
    }
    setCurrent({ id: `s-${Date.now()}`, points: [eventToSvgPoint(e)] });
  }

  function handlePointerMove(e: React.PointerEvent) {
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
    setCurrent((s) => (s ? { ...s, points: [...s.points, eventToSvgPoint(e)] } : null));
  }

  function handlePointerUp() {
    if (toneBrush) {
      commitToneStroke();
      return;
    }
    if (!current || current.points.length < 2) { setCurrent(null); return; }
    setStrokes((prev) => [...prev, current]);
    setCurrent(null);
  }

  function handlePointerLeave() {
    setHoverPt(null);
    handlePointerUp();
  }

  function clearAll() {
    setStrokes([]);
    setCurrent(null);
    setToneFills([]);
    setToneBrush(null);
    lastTonePtRef.current = null;
    toneGridRef.current?.bands.fill(0); // the grid IS the tone truth — clear it too
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
          this layer — the patches ride the styled markup instead. */}
      {!styled && toneFills.length > 0 && (
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
          raw as perfect-freehand polygons so user sees what they drew, unstyled. */}
      {!committed && !styled && strokes.length > 0 && (
        <svg
          viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
          width="100%"
          height="100%"
          xmlns="http://www.w3.org/2000/svg"
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
          aria-hidden
        >
          {strokes.map((stroke) => (
            <path
              key={stroke.id}
              d={strokeToPolygonPath(stroke.points)}
              fill="var(--dir-text-primary)"
              stroke="none"
            />
          ))}
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
          cursor: shadeActive ? 'none' : input === 'draw' ? 'crosshair' : 'default',
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
            shows a dashed accent lifter. */}
        {shadeActive && hoverPt && (
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

export type ShadeToolState = {
  /** COVERAGE_BANDS index 1–7 (paint band). */
  band: number;
  /** Brush radius, draw-frame viewBox px. */
  radius: number;
  /** Erase mode — the band-0 stamp: a per-cell partial carve out of whatever
   *  tone is there (band 0 = paper = absence). */
  erase: boolean;
};

export const SHADE_TOOL_DEFAULT: ShadeToolState = { band: 3, radius: 26, erase: false };

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
        minWidth: 0,
        opacity: disabled ? 0.45 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
      }}
    >
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
      {/* Brush size — viewBox px, 29 ticks (8–64 step 2). */}
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
    </div>
  );
}
