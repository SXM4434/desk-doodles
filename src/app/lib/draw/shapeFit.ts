// ─── shapeFit — Shape Assist's recognition + snap engine (Rock F3) ───────────
// Implements docs/design/shape-assist-spec.md §2 (the engine). PURE and
// node-runnable like strokeTo3d.ts / geometry3d/markIntent.ts: no React, no
// DOM, no wall-clock, no randomness. The 2D draw pipeline file stays untouched.
//
// SEBS'S LAW (the spec's governing constraint): freehand is the DEFAULT. This
// module is a LIBRARY of pure functions that the SNAP / STRAIGHTEN action pills
// call ON DEMAND on the LAST stroke. It NEVER runs on pen-up, never auto-fires,
// never suggests. A user who never taps the pills never touches this code.
//
// Pipeline (every stage already exists somewhere in our stack — this module
// COMPOSES, it does not invent):
//   1. Resample the stroke arc-length at INTENT_RESAMPLE_SPACING_PX (the
//      $1-recognizer normalization move [Wobbrock '07] — same constant the
//      mark-intent brain uses, so a capStrokes-halved record fits identically).
//   2. Gate with mark-intent features (REUSE the constants, don't redefine):
//      scribble reversal/self-intersection energy → refuse (scribbles are tone
//      intent, not shapes); bboxDiag < dot floor → refuse (dot territory).
//   3. Corners: ShortStraw on the resampled points [Wolin '08], CROSS-CHECKED
//      against rdpPoints ε=3.0 anchors [strokeTo3d.ts] — a corner must appear
//      in both to count. Hybrid: ShortStraw finds corners RDP smears on slow
//      curves; RDP kills ShortStraw's false positives on noise.
//   4. Fit every eligible candidate {line, polyline, polygon, triangle, rect,
//      circle, ellipse} and score by normalized error (÷ bboxDiag).
//   5. Rank by score (error + complexity prior), accept only if best
//      normErr ≤ SNAP_MAX_NORM_ERR. Chip carries every candidate within 2×
//      threshold, ranked, plus 'original' always last.
//   6. Honest no-snap: below threshold for everything → refuse, full candidate
//      table returned for the log. Never force the least-bad fit.
//
// STRAIGHTEN = the same engine, candidate set restricted to {line, polyline,
// polygon}, no template regularization (drawn proportions kept). It almost
// never refuses — only corner count > STRAIGHTEN_MAX_CORNERS (a scribble).
//
// Closure weld (SA-G): snapping a treated-as-closed stroke to a CLOSED
// candidate emits an EXACTLY closed loop — the gap-weld is legitimate because
// snap is an explicit user act (unlike the silent inference the 3-state closure
// chip confesses). Open candidates never weld.

import {
  RDP_EPSILON,
  closureStateOf,
  rdpPoints,
  type ClosureState,
  type StrokeInputPoint,
} from '../geometry3d/strokeTo3d.ts';
import {
  INTENT_RESAMPLE_SPACING_PX,
  DOT_MAX_BBOX_DIAG,
  SCRIBBLE_REVERSAL_FREQ,
  SCRIBBLE_SELF_ISECT,
  REVERSAL_TURN_DEG,
} from '../geometry3d/markIntent.ts';

// ─── Calibration constants (provisional — SA-H, mirror of MI-F) ──────────────

/** Accept a snap only if the best candidate's normalized error (RMS deviation
 *  ÷ bbox diagonal) is at or below this. Was 3.5% (provisional) — far too tight:
 *  hand-drawn shapes routinely run 5–10% deviation, so Snap refused on real
 *  doodles and "kept points open / impossible to get a closed shape" (Sebs
 *  2026-06-13). 10% accepts genuine hand-drawn squares/circles/triangles into a
 *  clean CLOSED form while still rejecting scribbles; the chip still lists every
 *  candidate + 'original' so an over-eager snap is one tap to undo. */
export const SNAP_MAX_NORM_ERR = 0.10;
/** Chip carries every candidate within this multiple of the accept threshold,
 *  ranked. 'original' is always appended last regardless. */
export const CHIP_CANDIDATE_ERR_MULT = 2;
/** Below this bbox diagonal the stroke is a dot/tick — refuse (snap needs a
 *  shape). Mirrors the mark-intent dot floor + spec's 24px line. */
export const SNAP_MIN_BBOX_DIAG = 24;
/** Straighten refuses only above this corner count (that's a scribble, not a
 *  polyline anyone wants crisped). */
export const STRAIGHTEN_MAX_CORNERS = 24;
/** ShortStraw window half-width (chord over points i±W). [Wolin '08] uses 3. */
export const SHORTSTRAW_WINDOW = 3;
/** Straw-length minima below median × this are corner candidates. */
export const SHORTSTRAW_MEDIAN_FACTOR = 0.95;
/** A corner from ShortStraw counts only if an RDP anchor lies within this many
 *  resampled-point indices (the cross-check tolerance). */
export const CORNER_RDP_INDEX_TOL = 2;
/** Ellipse with bbox aspect at or below this cedes its rank to circle (a near-
 *  round stroke reads as a circle first; the chip cycles to ellipse). */
export const CIRCLE_PREFERENCE_ASPECT = 1.15;
/** circle/ellipse geometric corroboration: |turnSum| must be within this of
 *  2π (a closed round form turns once). [PaleoSketch corroboration move]. */
export const ROUND_TURNSUM_TOL = Math.PI * 0.9;
/** Complexity prior added to each candidate's error so the simpler read wins
 *  on ties (PaleoSketch ranking: line < circle < triangle < rect < ellipse <
 *  polygon < polyline). Tiny — only breaks near-ties. */
export const COMPLEXITY_PRIOR = 0.004;
/** Right-angle regularization: a rect candidate requires its 4 corner angles
 *  within this many degrees of 90°, else it loses to the generic polygon. */
export const RECT_ANGLE_TOL_DEG = 22;
/** Square chip variant offered when the rect's side ratio is within this. */
export const SQUARE_ASPECT_TOL = 1.18;
/** Equilateral-triangle chip variant offered when the side CV is below this. */
export const EQUILATERAL_CV_MAX = 0.14;
/** Collinear / turn-angle MERGE: after corner detection, a "corner" whose
 *  interior turn is below this many degrees is a false split on a straight run
 *  (the over-segmentation that made a clean rect read as Polygon (5/6) — bug 1).
 *  We fold it back into the edge. 18° is below a real polygon vertex's turn yet
 *  above hand-jitter on a straight edge. [PaleoSketch DCR / merge-collinear]. */
export const COLLINEAR_MERGE_TURN_DEG = 18;
/** Regularization PREFERENCE (PaleoSketch interpretation-priority): a rect or
 *  triangle that CLEARS its geometric gate is the higher-value read the user
 *  wants — it should beat the generic polygon even when the regularized fit's
 *  RMS error is marginally higher than the raw drawn-corner polygon's. We let
 *  the template win whenever its normErr ≤ polygon.normErr × this. */
export const TEMPLATE_OVER_POLYGON_ERR_MULT = 2.4;
/** STAR (regular {p/q}) recognition: a star alternates convex/concave vertices.
 *  A clean 5-point star has 10 corners; we accept this many ± the slop below.
 *  [Star-polygon turning-number theory]. */
export const STAR_MIN_POINTS = 5;
export const STAR_MAX_POINTS = 9;
/** Star concavity: the fraction of vertices that must be CONCAVE (turn sign
 *  opposite the loop's overall winding) to read as a star — a real star
 *  alternates, so ~half are concave. Floor a touch below 0.5 for slop. */
export const STAR_MIN_CONCAVE_FRAC = 0.34;
/** ARROW recognition (geometry-based shaft + V-head decomposition): an arrow is
 *  an OPEN corner-chain whose leading run is one dominant near-straight SHAFT and
 *  whose trailing 1-2 short segments fold back as the head. The total shaft
 *  length must be at least this multiple of the LONGEST single barb segment (so a
 *  zigzag of equal-length segments — no dominant shaft — is rejected). */
export const ARROW_SHAFT_HEAD_RATIO = 1.8;
/** The arrowhead barbs turn back toward the shaft by at least this many degrees
 *  from the shaft direction (a real arrowhead opens 20-70° off the shaft, so the
 *  barb–shaft angle is large). Floor that the head clearly diverges. */
export const ARROW_HEAD_MIN_TURN_DEG = 22;
/** Arrow needs at least this many corners total (shaft endpoints + 1-2 head
 *  vertices) and at most this many (more = it's a polyline, not an arrow). */
export const ARROW_MIN_CORNERS = 4;
export const ARROW_MAX_CORNERS = 6;

// ─── Types ───────────────────────────────────────────────────────────────────

export type FitPoint = [number, number];

export type ShapeKind =
  | 'line'
  | 'polyline'
  | 'polygon'
  | 'triangle'
  | 'rect'
  | 'star'
  | 'arrow'
  | 'circle'
  | 'ellipse'
  | 'original';

/** One fitted candidate: the clean geometry + how well it matched. */
export interface ShapeCandidate {
  kind: ShapeKind;
  /** The clean shape as a point list (closed candidates list their vertices;
   *  the caller closes the loop). 'original' carries the source points. */
  points: FitPoint[];
  /** RMS deviation of the source from the ideal, ÷ bboxDiag (0 = perfect). */
  normErr: number;
  /** score = (1 − normErr) − complexityPrior; higher is better. */
  score: number;
  /** Whether this candidate is a closed loop (circle/ellipse/triangle/rect/
   *  polygon) vs an open path (line/polyline). */
  closed: boolean;
  /** Human chip label ("Circle", "Square", "Original"). */
  label: string;
  /** Geometric-corroboration / regularization notes (for the log). */
  notes?: string;
}

export type SnapAction = 'snap' | 'straighten';

export interface ShapeFitResult {
  action: SnapAction;
  /** Did any candidate clear the threshold? (Straighten's polyline/line almost
   *  always does; a scribble refuses.) */
  accepted: boolean;
  /** Ranked candidates, best first, with 'original' ALWAYS last (so the chip
   *  can cycle back to the drawn stroke — Sebs's drew-a-triangle-but-wants-
   *  something-else case is first-class). Empty source → []. */
  candidates: ShapeCandidate[];
  /** Why a refusal happened (null when accepted). */
  refusedReason: string | null;
  /** Diagnostics for the decision log / battery. */
  diag: {
    closure: ClosureState;
    bboxDiag: number;
    resampledCount: number;
    cornerCount: number;
    reversalFreq: number;
    selfIsectDensity: number;
    turnSum: number;
    bboxAspect: number;
  };
}

// ─── Geometry helpers (pure, viewBox space) ──────────────────────────────────

function xy(p: StrokeInputPoint): FitPoint {
  return [p[0], p[1]];
}

/** Arc-length resample at `spacing` — identical algorithm to markIntent's so a
 *  capped record snaps the same as a live one (spec §2 honesty constraint). */
export function resampleArcLength(points: StrokeInputPoint[], spacing: number): FitPoint[] {
  if (points.length === 0) return [];
  const out: FitPoint[] = [xy(points[0])];
  if (points.length === 1) return out;
  let prev: FitPoint = out[0];
  let carry = 0;
  for (let i = 1; i < points.length; i++) {
    const curr: FitPoint = xy(points[i]);
    const segLen = Math.hypot(curr[0] - prev[0], curr[1] - prev[1]);
    if (segLen <= 1e-12) continue;
    let walked = spacing - carry;
    while (walked <= segLen) {
      const t = walked / segLen;
      out.push([prev[0] + (curr[0] - prev[0]) * t, prev[1] + (curr[1] - prev[1]) * t]);
      walked += spacing;
    }
    carry = segLen - (walked - spacing);
    prev = curr;
  }
  const last: FitPoint = xy(points[points.length - 1]);
  const tail = out[out.length - 1];
  if (Math.hypot(last[0] - tail[0], last[1] - tail[1]) > 1e-9) out.push(last);
  return out;
}

function bboxOf(pts: FitPoint[]): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of pts) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  return { minX, minY, maxX, maxY };
}

function bboxDiagOf(pts: FitPoint[]): number {
  if (pts.length === 0) return 0;
  const b = bboxOf(pts);
  return Math.hypot(b.maxX - b.minX, b.maxY - b.minY);
}

function polylineLength(pts: FitPoint[]): number {
  let len = 0;
  for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return len;
}

function dist(a: FitPoint, b: FitPoint): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

/** Perpendicular distance from p to the infinite line through a,b. */
function pointLineDist(p: FitPoint, a: FitPoint, b: FitPoint): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy);
  if (len < 1e-9) return dist(p, a);
  return Math.abs(dy * p[0] - dx * p[1] + b[0] * a[1] - b[1] * a[0]) / len;
}

/** Distance from p to the SEGMENT a–b (clamped projection). */
function pointSegDist(p: FitPoint, a: FitPoint, b: FitPoint): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;
  if (len2 < 1e-12) return dist(p, a);
  let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}

/** RMS over a per-point residual array, normalized by bboxDiag. */
function normRms(residuals: number[], bboxDiag: number): number {
  if (residuals.length === 0 || bboxDiag < 1e-9) return Infinity;
  const ss = residuals.reduce((a, r) => a + r * r, 0);
  return Math.sqrt(ss / residuals.length) / bboxDiag;
}

// ─── Per-stroke signal block (REUSING markIntent's feature math + constants) ──

interface SnapSignals {
  resampled: FitPoint[];
  anchors: FitPoint[]; // RDP ε=3.0
  bboxDiag: number;
  bboxAspect: number;
  arcLen: number;
  closure: ClosureState;
  reversalFreq: number; // per 100px (markIntent grammar)
  selfIsectDensity: number; // per 100px
  turnSum: number; // signed total turning
}

function segmentsCross(a1: FitPoint, a2: FitPoint, b1: FitPoint, b2: FitPoint): boolean {
  const d = (p: FitPoint, q: FitPoint, r: FitPoint) =>
    (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
  const d1 = d(b1, b2, a1);
  const d2 = d(b1, b2, a2);
  const d3 = d(a1, a2, b1);
  const d4 = d(a1, a2, b2);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

function selfIntersections(anchors: FitPoint[]): number {
  let count = 0;
  for (let i = 0; i + 1 < anchors.length; i++) {
    for (let j = i + 2; j + 1 < anchors.length; j++) {
      if (i === 0 && j + 2 === anchors.length) continue;
      if (segmentsCross(anchors[i], anchors[i + 1], anchors[j], anchors[j + 1])) count++;
    }
  }
  return count;
}

function computeSignals(raw: StrokeInputPoint[]): SnapSignals {
  const resampled = resampleArcLength(raw, INTENT_RESAMPLE_SPACING_PX);
  const anchors = rdpPoints(raw, RDP_EPSILON).map(xy);
  const arcLen = polylineLength(resampled);
  const bboxDiag = bboxDiagOf(resampled);
  const b = bboxOf(resampled);
  const bw = Math.max(b.maxX - b.minX, 1e-6);
  const bh = Math.max(b.maxY - b.minY, 1e-6);
  const bboxAspect = Math.max(bw, bh) / Math.min(bw, bh);
  const per100 = arcLen > 0 ? 100 / arcLen : 0;

  const reversalRad = (REVERSAL_TURN_DEG * Math.PI) / 180;
  const angleBetween = (ax: number, ay: number, bx: number, by: number) =>
    Math.atan2(Math.abs(ax * by - ay * bx), ax * bx + ay * by);
  let reversals = 0;
  let turnSum = 0;
  let suppressNextWindowed = false;
  for (let i = 1; i + 1 < resampled.length; i++) {
    const ax = resampled[i][0] - resampled[i - 1][0];
    const ay = resampled[i][1] - resampled[i - 1][1];
    const bx = resampled[i + 1][0] - resampled[i][0];
    const by = resampled[i + 1][1] - resampled[i][1];
    const turn = angleBetween(ax, ay, bx, by);
    let windowed = 0;
    if (i >= 2 && !suppressNextWindowed) {
      const px = resampled[i - 1][0] - resampled[i - 2][0];
      const py = resampled[i - 1][1] - resampled[i - 2][1];
      windowed = angleBetween(px, py, bx, by);
    }
    if (turn > reversalRad || windowed > reversalRad) {
      reversals++;
      suppressNextWindowed = true;
    } else {
      suppressNextWindowed = false;
    }
    const cross = ax * by - ay * bx;
    turnSum += Math.sign(cross) * turn;
  }

  const crossings = anchors.length >= 4 ? selfIntersections(anchors) : 0;

  return {
    resampled,
    anchors,
    bboxDiag,
    bboxAspect,
    arcLen,
    closure: closureStateOf(raw),
    reversalFreq: reversals * per100,
    selfIsectDensity: crossings * per100,
    turnSum,
  };
}

// ─── Corner detection: ShortStraw [Wolin '08] cross-checked with RDP ─────────

/** ShortStraw straw-length corner finder, cross-checked against rdpPoints
 *  anchors. Returns INDICES into the resampled polyline. For OPEN strokes the
 *  endpoints (0, n-1) always frame the chain. For CLOSED strokes the straw is
 *  computed CYCLICALLY (the seam often sits ON a corner — the bug that made the
 *  first rect/triangle fit collapse to 2-3 corners), and the endpoints fold
 *  into one corner. RDP contributes corners ShortStraw smears on slow curves;
 *  ShortStraw is gated by RDP corroboration so noise doesn't manufacture
 *  corners. Hybrid per spec §2.3. */
export function detectCorners(sig: SnapSignals): number[] {
  const pts = sig.resampled;
  const n = pts.length;
  if (n < 3) return n === 0 ? [] : [0, n - 1].filter((v, i, a) => a.indexOf(v) === i);
  const closed = sig.closure !== 'open';

  const W = SHORTSTRAW_WINDOW;
  // Straw = chord across ±W. Cyclic for closed loops so the seam corner is
  // seen; clamped (Infinity) at the ends for open strokes (endpoints frame
  // the chain explicitly below).
  const straw: number[] = new Array(n).fill(Infinity);
  if (closed) {
    for (let i = 0; i < n; i++) {
      straw[i] = dist(pts[(i - W + n) % n], pts[(i + W) % n]);
    }
  } else {
    for (let i = W; i < n - W; i++) straw[i] = dist(pts[i - W], pts[i + W]);
  }
  // Median of finite straws.
  const finite = straw.filter((s) => Number.isFinite(s)).sort((a, b) => a - b);
  const median = finite.length ? finite[Math.floor(finite.length / 2)] : 0;
  const threshold = median * SHORTSTRAW_MEDIAN_FACTOR;

  // Local minima below threshold are corner candidates (Wolin's localized
  // search: walk runs of consecutive sub-threshold straws, keep each run's
  // min). For closed loops the scan wraps once around.
  const shortStrawCorners: number[] = [];
  const scanN = closed ? n : n; // both walk [0,n); closed straws are finite everywhere
  let i = 0;
  while (i < scanN) {
    if (Number.isFinite(straw[i]) && straw[i] < threshold) {
      let localMin = i;
      let j = i;
      while (j < scanN && Number.isFinite(straw[j]) && straw[j] < threshold) {
        if (straw[j] < straw[localMin]) localMin = j;
        j++;
      }
      shortStrawCorners.push(localMin);
      i = j;
    } else {
      i++;
    }
  }

  // RDP anchor indices (nearest resampled-point index per anchor).
  const anchorIdx: number[] = [];
  for (const a of sig.anchors) {
    let best = -1;
    let bestD = Infinity;
    for (let k = 0; k < n; k++) {
      const d = dist(pts[k], a);
      if (d < bestD) {
        bestD = d;
        best = k;
      }
    }
    if (best >= 0) anchorIdx.push(best);
  }
  // For closed loops, RDP repeats the seam anchor at both 0 and n-1 — fold the
  // n-1 anchor onto 0 so the seam corner is counted once.
  const cyclicIdxClose = (a: number, b: number) => {
    if (!closed) return Math.abs(a - b);
    const d = Math.abs(a - b);
    return Math.min(d, n - d);
  };

  // Cross-check: a ShortStraw corner counts only if an RDP anchor is within
  // CORNER_RDP_INDEX_TOL indices (cyclic for closed loops); kills ShortStraw
  // false positives on noise.
  const corroborated = new Set<number>();
  for (const c of shortStrawCorners) {
    if (anchorIdx.some((a) => cyclicIdxClose(a, c) <= CORNER_RDP_INDEX_TOL)) corroborated.add(c);
  }
  // RDP interior anchors with a genuine turn the straw smeared. For closed
  // loops EVERY anchor is interior (cyclic turn); for open strokes skip the
  // endpoints (they frame the chain).
  for (const a of anchorIdx) {
    if (!closed && (a <= W || a >= n - W)) continue;
    const turn = interiorTurnDeg(pts, a, W, closed);
    if (turn > 30 && ![...corroborated].some((c) => cyclicIdxClose(c, a) <= CORNER_RDP_INDEX_TOL)) {
      corroborated.add(a);
    }
  }

  let corners = [...corroborated].sort((x, y) => x - y);
  // De-dup corners that resample within the window (one true corner), cyclic.
  const merged: number[] = [];
  for (const c of corners) {
    if (merged.length && cyclicIdxClose(c, merged[merged.length - 1]) <= W) continue;
    merged.push(c);
  }
  corners = merged;
  // COLLINEAR / NEAR-STRAIGHT MERGE (bug 1): a "corner" whose interior turn is
  // below COLLINEAR_MERGE_TURN_DEG is a false split on a straight edge — drop it
  // so a clean rect yields exactly 4 corners and a triangle 3 (was reading as
  // Polygon (5/6) when hand-jitter spawned a mid-edge corner). The turn is
  // measured against the ADJACENT corners (the actual edge directions), not a
  // fixed ±W window, so a corner mid-way down a long straight edge is correctly
  // seen as flat. Endpoints of open chains aren't in `corners` yet (added
  // below), so they're never merged. [PaleoSketch merge-collinear / DCR.]
  if (corners.length >= 3) {
    let changed = true;
    while (changed && corners.length >= 3) {
      changed = false;
      // For closed loops every corner has two neighbours (cyclic). For open
      // strokes the true endpoints aren't here yet, so the chain's first/last
      // detected corner only has one interior neighbour — skip those (we can't
      // judge their turn without the framing endpoints, and they're rarely
      // false splits). Walk and drop the flattest sub-threshold corner.
      let flattestIdx = -1;
      let flattestTurn = COLLINEAR_MERGE_TURN_DEG;
      const m = corners.length;
      for (let k = 0; k < m; k++) {
        const isEdgeOpen = !closed && (k === 0 || k === m - 1);
        if (isEdgeOpen) continue;
        const prev = closed ? corners[(k - 1 + m) % m] : corners[k - 1];
        const here = corners[k];
        const next = closed ? corners[(k + 1) % m] : corners[k + 1];
        const turn = cornerTurnDeg(pts, prev, here, next);
        if (turn < flattestTurn) {
          flattestTurn = turn;
          flattestIdx = k;
        }
      }
      if (flattestIdx >= 0) {
        corners.splice(flattestIdx, 1);
        changed = true;
      }
    }
  }
  // Closed: also fold a corner near the seam (index ~0 and ~n) into one.
  if (closed && corners.length >= 2) {
    const lo = corners[0];
    const hi = corners[corners.length - 1];
    if (n - hi + lo <= W) corners.pop();
  }
  // Endpoints frame the chain for OPEN strokes (after merge, so they aren't
  // de-duped away).
  if (!closed) {
    if (corners[0] !== 0) corners.unshift(0);
    if (corners[corners.length - 1] !== n - 1) corners.push(n - 1);
  }
  return corners;
}

/** Turn angle (deg) at corner index `here`, measured from the EDGE arriving
 *  from corner `prev` to the EDGE leaving toward corner `next`. Unlike
 *  interiorTurnDeg this uses the actual neighbouring CORNERS (the real edge
 *  directions), so a corner sitting mid-way along a long straight edge reads as
 *  flat (~0°) — that's what the collinear merge keys on. */
function cornerTurnDeg(pts: FitPoint[], prev: number, here: number, next: number): number {
  const a = pts[prev], b = pts[here], c = pts[next];
  const ax = b[0] - a[0], ay = b[1] - a[1];
  const bx = c[0] - b[0], by = c[1] - b[1];
  const ang = Math.atan2(Math.abs(ax * by - ay * bx), ax * bx + ay * by);
  return (ang * 180) / Math.PI;
}

function interiorTurnDeg(pts: FitPoint[], i: number, w: number, cyclic = false): number {
  const n = pts.length;
  const a = cyclic ? pts[(i - w + n) % n] : pts[Math.max(0, i - w)];
  const b = pts[i];
  const c = cyclic ? pts[(i + w) % n] : pts[Math.min(n - 1, i + w)];
  const ax = b[0] - a[0], ay = b[1] - a[1];
  const bx = c[0] - b[0], by = c[1] - b[1];
  const ang = Math.atan2(Math.abs(ax * by - ay * bx), ax * bx + ay * by);
  return (ang * 180) / Math.PI;
}

// ─── Candidate fits ──────────────────────────────────────────────────────────

/** Total-least-squares (PCA) line fit → residuals = perpendicular distance. */
function fitLine(sig: SnapSignals): ShapeCandidate {
  const pts = sig.resampled;
  const a = pts[0];
  const b = pts[pts.length - 1];
  // Endpoints define the line direction; PCA would be marginally tighter but
  // endpoints are what the user's gesture starts/ends at — and what a snapped
  // line should honor. Residual = perpendicular distance to that chord.
  const residuals = pts.map((p) => pointLineDist(p, a, b));
  const normErr = normRms(residuals, sig.bboxDiag);
  return {
    kind: 'line',
    points: [a, b],
    normErr,
    score: 1 - normErr,
    closed: false,
    label: 'Line',
  };
}

/** Corner-chain polyline (Straighten's open fit) — straight segments between
 *  detected corners; residual = each point's distance to its segment. */
function fitPolyline(sig: SnapSignals, corners: number[]): ShapeCandidate {
  const pts = sig.resampled;
  const vertices = corners.map((c) => pts[c]);
  if (vertices.length < 2) return fitLine(sig);
  const residuals: number[] = [];
  for (let s = 0; s + 1 < corners.length; s++) {
    const a = pts[corners[s]];
    const b = pts[corners[s + 1]];
    for (let k = corners[s]; k <= corners[s + 1]; k++) residuals.push(pointSegDist(pts[k], a, b));
  }
  const normErr = normRms(residuals, sig.bboxDiag);
  return {
    kind: 'polyline',
    points: vertices,
    normErr,
    score: 1 - normErr,
    closed: false,
    label: 'Polyline',
  };
}

/** Closed corner-chain polygon (Straighten closed) — residual measured to the
 *  closed loop's segments (last vertex → first). */
function fitPolygon(sig: SnapSignals, loopVerts: FitPoint[]): ShapeCandidate | null {
  if (loopVerts.length < 3) return null;
  const pts = sig.resampled;
  const residuals = pts.map((p) => pointToLoopDist(p, loopVerts));
  const normErr = normRms(residuals, sig.bboxDiag);
  return {
    kind: 'polygon',
    points: loopVerts,
    normErr,
    score: 1 - normErr,
    closed: true,
    label: `Polygon (${loopVerts.length})`,
  };
}

function pointToLoopDist(p: FitPoint, loop: FitPoint[]): number {
  let best = Infinity;
  for (let i = 0; i < loop.length; i++) {
    const d = pointSegDist(p, loop[i], loop[(i + 1) % loop.length]);
    if (d < best) best = d;
  }
  return best;
}

/** Triangle: exactly 3 corners. Chip variant: equilateral when sides are
 *  near-equal (the side CV gate). */
function fitTriangle(sig: SnapSignals, loopVerts: FitPoint[]): ShapeCandidate | null {
  if (loopVerts.length !== 3) return null;
  const base = fitPolygon(sig, loopVerts);
  if (!base) return null;
  const sides = [
    dist(loopVerts[0], loopVerts[1]),
    dist(loopVerts[1], loopVerts[2]),
    dist(loopVerts[2], loopVerts[0]),
  ];
  const mean = sides.reduce((a, b) => a + b, 0) / 3;
  const cv = Math.sqrt(sides.reduce((a, s) => a + (s - mean) ** 2, 0) / 3) / Math.max(mean, 1e-6);
  return {
    kind: 'triangle',
    points: loopVerts,
    normErr: base.normErr,
    score: 1 - base.normErr,
    closed: true,
    label: 'Triangle',
    notes: cv <= EQUILATERAL_CV_MAX ? 'equilateral-eligible' : undefined,
  };
}

/** Rect: exactly 4 corners regularized to two perpendicular directions
 *  [Pegasus-style constraint inference, Igarashi '97]. Residual measured to the
 *  regularized axis-fit. Loses to generic polygon when corners aren't square. */
function fitRect(sig: SnapSignals, loopVerts: FitPoint[]): ShapeCandidate | null {
  if (loopVerts.length !== 4) return null;
  // Check corner angles ≈ 90°.
  let maxDev = 0;
  for (let i = 0; i < 4; i++) {
    const prev = loopVerts[(i + 3) % 4];
    const curr = loopVerts[i];
    const next = loopVerts[(i + 1) % 4];
    const ax = prev[0] - curr[0], ay = prev[1] - curr[1];
    const bx = next[0] - curr[0], by = next[1] - curr[1];
    const ang = (Math.atan2(Math.abs(ax * by - ay * bx), ax * bx + ay * by) * 180) / Math.PI;
    maxDev = Math.max(maxDev, Math.abs(ang - 90));
  }
  if (maxDev > RECT_ANGLE_TOL_DEG) return null;
  // Regularize: principal axis from a CIRCULAR MEAN over ALL FOUR edge
  // directions mod 90° (was a fragile 2-edge fold that produced a badly tilted
  // axis on ROTATED rects — the diamond that read as Polygon (4), bug 1). Each
  // edge angle is taken mod 90° (a rect's four edges fall into two perpendicular
  // families = one axis mod 90°); to average angles on a circle without
  // wraparound we accumulate the DOUBLED-by-4 angle (period 90° → full 360°),
  // mean the unit vectors, then divide back by 4. [Constraint inference,
  // Igarashi '97; circular statistics.]
  const cx = loopVerts.reduce((a, p) => a + p[0], 0) / 4;
  const cy = loopVerts.reduce((a, p) => a + p[1], 0) / 4;
  let sumSin = 0, sumCos = 0;
  for (let i = 0; i < 4; i++) {
    const a = loopVerts[i];
    const b = loopVerts[(i + 1) % 4];
    const theta = Math.atan2(b[1] - a[1], b[0] - a[0]); // edge direction
    sumSin += Math.sin(4 * theta);
    sumCos += Math.cos(4 * theta);
  }
  const axis = Math.atan2(sumSin, sumCos) / 4; // principal axis mod 90°
  const ux = Math.cos(axis), uy = Math.sin(axis);
  const vx = -uy, vy = ux;
  // Half-extents = MEAN |projection| of the 4 corners onto each axis. For a true
  // rect every corner projects to exactly (±halfU, ±halfV), so the mean recovers
  // the half-extent exactly. (max over-inflated the rect on ROTATED inputs — a
  // 45° diamond's corners each project onto BOTH axes, so max grabbed a diagonal
  // and built a rect larger than the drawn shape — the residual blew up and the
  // template lost to polygon, bug 1.)
  let halfU = 0, halfV = 0;
  for (const p of loopVerts) {
    halfU += Math.abs((p[0] - cx) * ux + (p[1] - cy) * uy);
    halfV += Math.abs((p[0] - cx) * vx + (p[1] - cy) * vy);
  }
  halfU /= 4;
  halfV /= 4;
  const corners: FitPoint[] = [
    [cx + ux * halfU + vx * halfV, cy + uy * halfU + vy * halfV],
    [cx - ux * halfU + vx * halfV, cy - uy * halfU + vy * halfV],
    [cx - ux * halfU - vx * halfV, cy - uy * halfU - vy * halfV],
    [cx + ux * halfU - vx * halfV, cy + uy * halfU - vy * halfV],
  ];
  const residuals = sig.resampled.map((p) => pointToLoopDist(p, corners));
  const normErr = normRms(residuals, sig.bboxDiag);
  const ratio = Math.max(halfU, halfV) / Math.max(Math.min(halfU, halfV), 1e-6);
  return {
    kind: 'rect',
    points: corners,
    normErr,
    score: 1 - normErr,
    closed: true,
    label: 'Rectangle',
    notes: ratio <= SQUARE_ASPECT_TOL ? 'square-eligible' : undefined,
  };
}

/** STAR — a simple (non-self-intersecting) star OUTLINE is a concave 2p-gon
 *  whose vertices ALTERNATE convex tip / concave notch. That alternation is the
 *  robust discriminant — NOT total turning (a drawn star outline winds just once,
 *  |turnSum| ≈ 2π, same as any simple loop; the self-intersecting {p/q}
 *  turning-number only applies to a pentagram drawn as crossing lines, which our
 *  closure/corner pipeline never yields). We read the closed corner loop:
 *  require 2p corners (p = STAR_MIN_POINTS..STAR_MAX_POINTS), a near-even split
 *  of convex/concave vertices (≥ STAR_MIN_CONCAVE_FRAC concave), and a high
 *  sign-flip count around the loop (true alternation, not a lumpy blob). The
 *  concave vertices are the star's notches; a convex polygon has ZERO, cleanly
 *  separating star from triangle/rect/polygon. Residual = points-to-loop on the
 *  drawn vertices (no template regularization — drawn proportions kept; the
 *  chip's "Star" label is the win). [Star-polygon vertex theory; convex/concave
 *  vertex classification by cross-product sign.] */
function fitStar(sig: SnapSignals, loopVerts: FitPoint[]): ShapeCandidate | null {
  const m = loopVerts.length;
  // A p-point star outline has exactly 2p corners. Accept the even counts in
  // range (and 2p±1 slop in case the seam folds one corner).
  if (m < STAR_MIN_POINTS * 2 - 1 || m > STAR_MAX_POINTS * 2) return null;
  // Winding sign from total turning (the outline loops once — sign is stable).
  const winding = Math.sign(sig.turnSum) || 1;
  let concave = 0;
  let convex = 0;
  let signFlips = 0;
  let prevSign = 0;
  for (let i = 0; i < m; i++) {
    const a = loopVerts[(i - 1 + m) % m];
    const b = loopVerts[i];
    const c = loopVerts[(i + 1) % m];
    const ax = b[0] - a[0], ay = b[1] - a[1];
    const bx = c[0] - b[0], by = c[1] - b[1];
    const cross = ax * by - ay * bx;
    const s = Math.sign(cross);
    // A vertex turning OPPOSITE the overall winding is concave (a star's inner
    // notch); turning WITH the winding is a convex tip.
    if (s !== 0 && s !== winding) concave++;
    else if (s === winding) convex++;
    if (s !== 0) {
      if (prevSign !== 0 && s !== prevSign) signFlips++;
      prevSign = s;
    }
  }
  const concaveFrac = concave / m;
  // A star needs real notches AND real tips, in near-balance, and a high flip
  // count (true alternation). A convex polygon has concave = 0 → rejected here.
  if (concaveFrac < STAR_MIN_CONCAVE_FRAC) return null;
  if (convex < STAR_MIN_POINTS - 1) return null;
  // Alternation: ≥ (2p − 2) sign flips means the tip/notch pattern truly
  // alternates (a 5-point star has 10 vertices → 10 flips around the loop, 9 if
  // the seam doesn't flip). Floor at STAR_MIN_POINTS × 2 − 2.
  if (signFlips < STAR_MIN_POINTS * 2 - 2) return null;
  const base = fitPolygon(sig, loopVerts);
  if (!base) return null;
  const pointCount = Math.round(m / 2);
  return {
    kind: 'star',
    points: loopVerts,
    normErr: base.normErr,
    score: 1 - base.normErr,
    closed: true,
    label: 'Star',
    notes: `points=${pointCount} concave=${concave} convex=${convex} flips=${signFlips}`,
  };
}

/** ARROW — geometry-based shaft + V-head decomposition (the standard sketch-
 *  recognition arrow read). An arrow is an OPEN corner-chain: one DOMINANT shaft
 *  segment, then 1-2 short segments that fold back as the head. We test the
 *  trailing end (the natural draw order: shaft first, head last) AND the leading
 *  end (head-first draw), and keep whichever decomposes. The shaft must be
 *  ≥ ARROW_SHAFT_HEAD_RATIO × the mean head-segment length, and each head barb
 *  must diverge ≥ ARROW_HEAD_MIN_TURN_DEG from the shaft direction. The emitted
 *  geometry KEEPS the drawn shaft + barbs (no symmetric template — proportions
 *  honored, like polyline). */
function fitArrow(sig: SnapSignals, corners: number[]): ShapeCandidate | null {
  const m = corners.length;
  if (m < ARROW_MIN_CORNERS || m > ARROW_MAX_CORNERS) return null;
  const pts = sig.resampled;
  const verts = corners.map((c) => pts[c]);
  // Segment lengths + unit directions along the open chain.
  const segLen: number[] = [];
  const segDir: FitPoint[] = [];
  for (let i = 0; i + 1 < verts.length; i++) {
    const dx = verts[i + 1][0] - verts[i][0];
    const dy = verts[i + 1][1] - verts[i][1];
    const l = Math.hypot(dx, dy) || 1;
    segLen.push(l);
    segDir.push([dx / l, dy / l]);
  }
  const nSeg = segLen.length;
  if (nSeg < 3) return null;

  // Try both orientations: head at the END (shaft = leading segments) and head
  // at the START (shaft = trailing segments). Pick the better-scoring valid one.
  const tryDecomp = (headAtEnd: boolean): ShapeCandidate | null => {
    // Head = the last 2 segments (end) or first 2 (start). The barbs are the
    // head endpoints relative to the tip (shaft/head junction).
    const headSegIdx = headAtEnd ? [nSeg - 2, nSeg - 1] : [0, 1];
    const shaftSegIdx: number[] = [];
    for (let i = 0; i < nSeg; i++) if (!headSegIdx.includes(i)) shaftSegIdx.push(i);
    if (shaftSegIdx.length < 1) return null;

    // THE SHAFT IS ONE DOMINANT STRAIGHT RUN. (1) Its segments must be nearly
    // collinear — consecutive shaft directions agree within the merge tolerance
    // (a zigzag's "shaft" bends hard → rejected). (2) The total shaft length
    // must dominate the LONGEST single barb segment by ARROW_SHAFT_HEAD_RATIO
    // (a zigzag's segments are all ~equal → no dominance → rejected).
    for (let k = 1; k < shaftSegIdx.length; k++) {
      const a = segDir[shaftSegIdx[k - 1]];
      const b = segDir[shaftSegIdx[k]];
      const cos = a[0] * b[0] + a[1] * b[1];
      const turnDeg = (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI;
      if (turnDeg > COLLINEAR_MERGE_TURN_DEG * 1.6) return null; // shaft bends → not an arrow
    }
    const shaftLen = shaftSegIdx.reduce((a, i) => a + segLen[i], 0);
    const longestBarb = Math.max(...headSegIdx.map((i) => segLen[i]));
    if (longestBarb < 1e-6) return null;
    if (shaftLen < ARROW_SHAFT_HEAD_RATIO * longestBarb) return null;
    // Tip = shaft/head junction vertex; shaft direction = junction − shaft start.
    const tipIdx = headAtEnd ? nSeg - 2 : 2;
    const tip = verts[tipIdx];
    const shaftStart = headAtEnd ? verts[0] : verts[verts.length - 1];
    const sx = tip[0] - shaftStart[0], sy = tip[1] - shaftStart[1];
    const sl = Math.hypot(sx, sy) || 1;
    // Both head endpoints (the two barb tips) must fold BACK from the shaft.
    const barbEnds = headAtEnd ? [verts[nSeg - 1], verts[nSeg]] : [verts[1], verts[0]];
    let barbsOk = true;
    let minBarbTurn = Infinity;
    for (const end of barbEnds) {
      const bx = end[0] - tip[0], by = end[1] - tip[1];
      const bl = Math.hypot(bx, by) || 1;
      const cosA = (sx * bx + sy * by) / (sl * bl);
      const turnDeg = (Math.acos(Math.max(-1, Math.min(1, cosA))) * 180) / Math.PI;
      // The incoming shaft heads toward the tip; a real barb leaves the tip
      // folding back (the barb–shaft angle is large → foldDeg large). Both barbs
      // must fold, and they should sit on OPPOSITE sides (a V), which the
      // residual + the two-barb requirement together enforce.
      const foldDeg = 180 - turnDeg;
      if (foldDeg < ARROW_HEAD_MIN_TURN_DEG) barbsOk = false;
      minBarbTurn = Math.min(minBarbTurn, foldDeg);
    }
    if (!barbsOk) return null;
    // The two barbs must straddle the shaft (one each side) — a V-head, not two
    // barbs on the same side (which would be a hook/zigzag). Cross-products of
    // the shaft direction with each barb direction must have OPPOSITE signs.
    const cross = (ex: number, ey: number) => sx * ey - sy * ex;
    const b0 = barbEnds[0], b1 = barbEnds[1];
    const c0 = cross(b0[0] - tip[0], b0[1] - tip[1]);
    const c1 = cross(b1[0] - tip[0], b1[1] - tip[1]);
    if (Math.sign(c0) === Math.sign(c1)) return null;
    // Residual: points to the open shaft+head chain (kept geometry).
    const residuals: number[] = [];
    for (let s = 0; s + 1 < corners.length; s++) {
      const a = pts[corners[s]];
      const b = pts[corners[s + 1]];
      for (let k = corners[s]; k <= corners[s + 1]; k++) residuals.push(pointSegDist(pts[k], a, b));
    }
    const normErr = normRms(residuals, sig.bboxDiag);
    return {
      kind: 'arrow',
      points: verts,
      normErr,
      score: 1 - normErr,
      closed: false,
      label: 'Arrow',
      notes: `shaft/barb=${(shaftLen / longestBarb).toFixed(2)} barbTurn=${minBarbTurn.toFixed(0)}`,
    };
  };

  const end = tryDecomp(true);
  const start = tryDecomp(false);
  if (end && start) return end.normErr <= start.normErr ? end : start;
  return end || start;
}

/** Kåsa algebraic circle fit (linear LSQ) [Chernov/conicfit]. Residual = RMS
 *  radial deviation ÷ radius, then ÷ bboxDiag-normalized for ranking parity. */
function fitCircle(sig: SnapSignals): ShapeCandidate | null {
  const pts = sig.resampled;
  if (pts.length < 5) return null;
  // Kåsa: minimize Σ(x²+y² + Dx + Ey + F)². Solve the 3×3 normal equations.
  let Sx = 0, Sy = 0, Sxx = 0, Syy = 0, Sxy = 0, Sxz = 0, Syz = 0, Sz = 0;
  const n = pts.length;
  for (const [x, y] of pts) {
    const z = x * x + y * y;
    Sx += x; Sy += y; Sxx += x * x; Syy += y * y; Sxy += x * y;
    Sxz += x * z; Syz += y * z; Sz += z;
  }
  // Normal equations matrix [Sxx Sxy Sx; Sxy Syy Sy; Sx Sy n] · [D E F]ᵀ =
  // -[Sxz; Syz; Sz].
  const A = [
    [Sxx, Sxy, Sx],
    [Sxy, Syy, Sy],
    [Sx, Sy, n],
  ];
  const rhs = [-Sxz, -Syz, -Sz];
  const sol = solve3(A, rhs);
  if (!sol) return null;
  const [D, E, F] = sol;
  const cx = -D / 2;
  const cy = -E / 2;
  const r2 = cx * cx + cy * cy - F;
  if (!(r2 > 0)) return null;
  const r = Math.sqrt(r2);
  // Geometric corroboration [PaleoSketch]: a closed round form turns ≈ 2π.
  const turnOk = Math.abs(Math.abs(sig.turnSum) - 2 * Math.PI) < ROUND_TURNSUM_TOL;
  if (!turnOk) return null;
  const residuals = pts.map((p) => Math.abs(dist(p, [cx, cy]) - r));
  const normErr = normRms(residuals, sig.bboxDiag);
  // Emit the circle as a dense polygon (the caller renders it through the pen;
  // 48 segments stay Catmull-Rom-smooth downstream).
  const polyPts = circlePoints(cx, cy, r, r, 0, 48);
  return {
    kind: 'circle',
    points: polyPts,
    normErr,
    score: 1 - normErr,
    closed: true,
    label: 'Circle',
    notes: `r=${r.toFixed(1)}`,
  };
}

/** Direct least-squares ellipse fit [Fitzgibbon-Pilu-Fisher '99], simplified
 *  to the algebraic conic + an approximate radial residual. Cedes rank to
 *  circle when bbox aspect ≤ CIRCLE_PREFERENCE_ASPECT. */
function fitEllipse(sig: SnapSignals): ShapeCandidate | null {
  const pts = sig.resampled;
  if (pts.length < 6) return null;
  const turnOk = Math.abs(Math.abs(sig.turnSum) - 2 * Math.PI) < ROUND_TURNSUM_TOL;
  if (!turnOk) return null;
  const conic = fitConicEllipse(pts);
  if (!conic) return null;
  const { cx, cy, rx, ry, theta } = conic;
  if (!(rx > 0) || !(ry > 0)) return null;
  // Approximate radial residual: for each point, distance to the nearest point
  // on a 64-sample ellipse outline (cheap + robust vs the exact conic dist).
  const outline = circlePoints(cx, cy, rx, ry, theta, 64);
  const residuals = pts.map((p) => pointToLoopDist(p, outline));
  const normErr = normRms(residuals, sig.bboxDiag);
  return {
    kind: 'ellipse',
    points: circlePoints(cx, cy, rx, ry, theta, 64),
    normErr,
    score: 1 - normErr,
    closed: true,
    label: 'Ellipse',
    notes: `rx=${rx.toFixed(1)} ry=${ry.toFixed(1)}`,
  };
}

function circlePoints(cx: number, cy: number, rx: number, ry: number, theta: number, n: number): FitPoint[] {
  const out: FitPoint[] = [];
  const c = Math.cos(theta), s = Math.sin(theta);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 2 * Math.PI;
    const ex = rx * Math.cos(a);
    const ey = ry * Math.sin(a);
    out.push([cx + ex * c - ey * s, cy + ex * s + ey * c]);
  }
  return out;
}

// ─── Tiny linear algebra (pure, no deps) ─────────────────────────────────────

/** Gaussian elimination for a 3×3 system. Returns null when singular. */
function solve3(A: number[][], b: number[]): number[] | null {
  const m = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < 3; col++) {
    let piv = col;
    for (let r = col + 1; r < 3; r++) if (Math.abs(m[r][col]) > Math.abs(m[piv][col])) piv = r;
    if (Math.abs(m[piv][col]) < 1e-12) return null;
    [m[col], m[piv]] = [m[piv], m[col]];
    for (let r = 0; r < 3; r++) {
      if (r === col) continue;
      const f = m[r][col] / m[col][col];
      for (let c = col; c <= 3; c++) m[r][c] -= f * m[col][c];
    }
  }
  return [m[0][3] / m[0][0], m[1][3] / m[1][1], m[2][3] / m[2][2]];
}

/** Ellipse via second-moment (covariance) fit on the boundary points — a
 *  stable, dependency-free stand-in for the full Fitzgibbon generalized
 *  eigenproblem. Centroid + principal axes from the point covariance; radii
 *  scaled so the fit ellipse area ≈ the point cloud's spread (2× std along each
 *  axis). Good enough for snap (the residual gate rejects bad reads anyway). */
function fitConicEllipse(
  pts: FitPoint[],
): { cx: number; cy: number; rx: number; ry: number; theta: number } | null {
  const n = pts.length;
  let mx = 0, my = 0;
  for (const [x, y] of pts) { mx += x; my += y; }
  mx /= n; my /= n;
  let cxx = 0, cyy = 0, cxy = 0;
  for (const [x, y] of pts) {
    const dx = x - mx, dy = y - my;
    cxx += dx * dx; cyy += dy * dy; cxy += dx * dy;
  }
  cxx /= n; cyy /= n; cxy /= n;
  // Eigen-decomposition of the 2×2 symmetric covariance.
  const tr = cxx + cyy;
  const det = cxx * cyy - cxy * cxy;
  const disc = Math.sqrt(Math.max(0, (tr / 2) ** 2 - det));
  const l1 = tr / 2 + disc;
  const l2 = tr / 2 - disc;
  if (!(l1 > 0) || !(l2 > 0)) return null;
  const theta = Math.abs(cxy) < 1e-9 && cxx >= cyy ? 0 : Math.atan2(l1 - cxx, cxy);
  // Radii: project all points onto each principal axis, take max |projection|
  // (the actual extent the user drew, not a statistical estimate).
  const ux = Math.cos(theta), uy = Math.sin(theta);
  const vx = -uy, vy = ux;
  let rx = 0, ry = 0;
  for (const [x, y] of pts) {
    rx = Math.max(rx, Math.abs((x - mx) * ux + (y - my) * uy));
    ry = Math.max(ry, Math.abs((x - mx) * vx + (y - my) * vy));
  }
  return { cx: mx, cy: my, rx, ry, theta };
}

// ─── THE engine ──────────────────────────────────────────────────────────────

/** Build the loop vertices for a closed/treated-as-closed stroke's corner
 *  chain (drops the duplicate endpoint, since the loop closes implicitly). */
function closedLoopVertices(sig: SnapSignals, corners: number[]): FitPoint[] {
  const pts = sig.resampled;
  let idxs = corners.slice();
  // For a closed stroke the endpoints (0 and n-1) are nearly the same point —
  // collapse them so the loop doesn't carry a doubled vertex.
  if (idxs.length >= 2) {
    const first = pts[idxs[0]];
    const last = pts[idxs[idxs.length - 1]];
    if (dist(first, last) < INTENT_RESAMPLE_SPACING_PX * 2) idxs = idxs.slice(0, -1);
  }
  return idxs.map((c) => pts[c]);
}

/** Fit a stroke. `action` selects the candidate set:
 *   - 'snap'        all candidates (templates + corner chains)
 *   - 'straighten'  {line, polyline, polygon} only — no template regularization
 *  Returns a ranked candidate list ('original' always last) + accept/refuse. */
export function fitStroke(raw: StrokeInputPoint[], action: SnapAction = 'snap'): ShapeFitResult {
  const sig = computeSignals(raw);
  const baseDiag = {
    closure: sig.closure,
    bboxDiag: sig.bboxDiag,
    resampledCount: sig.resampled.length,
    cornerCount: 0,
    reversalFreq: sig.reversalFreq,
    selfIsectDensity: sig.selfIsectDensity,
    turnSum: sig.turnSum,
    bboxAspect: sig.bboxAspect,
  };

  const originalCandidate: ShapeCandidate = {
    kind: 'original',
    points: sig.resampled.length ? sig.resampled : raw.map(xy),
    normErr: 0,
    score: -1, // always ranks last among accepted; chip appends it explicitly
    closed: sig.closure !== 'open',
    label: 'Original',
  };

  // Degenerate / refusal gates (Sebs's law: never force a fit).
  if (raw.length < 2 || sig.resampled.length < 2) {
    return {
      action,
      accepted: false,
      candidates: [originalCandidate],
      refusedReason: 'too-few-points',
      diag: baseDiag,
    };
  }
  if (sig.bboxDiag < SNAP_MIN_BBOX_DIAG) {
    return {
      action,
      accepted: false,
      candidates: [originalCandidate],
      refusedReason: 'below-dot-floor',
      diag: baseDiag,
    };
  }

  const corners = detectCorners(sig);
  baseDiag.cornerCount = corners.length;

  // Scribble gate — REUSE markIntent's energy constants. A scribble is tone
  // intent, not a shape; Snap refuses. Straighten refuses only on corner-count
  // explosion (a genuine zigzag with few corners IS straightenable).
  const scribbleEnergy =
    sig.reversalFreq >= SCRIBBLE_REVERSAL_FREQ || sig.selfIsectDensity >= SCRIBBLE_SELF_ISECT;
  if (action === 'snap' && scribbleEnergy) {
    return {
      action,
      accepted: false,
      candidates: [originalCandidate],
      refusedReason: 'scribble-energy',
      diag: baseDiag,
    };
  }
  if (action === 'straighten' && (corners.length > STRAIGHTEN_MAX_CORNERS || scribbleEnergy)) {
    return {
      action,
      accepted: false,
      candidates: [originalCandidate],
      refusedReason: corners.length > STRAIGHTEN_MAX_CORNERS ? 'too-many-corners' : 'scribble-energy',
      diag: baseDiag,
    };
  }

  const open = sig.closure === 'open';
  const candidates: ShapeCandidate[] = [];

  if (action === 'straighten') {
    // Corner-chain fits only, drawn proportions kept.
    if (open) {
      candidates.push(fitLine(sig));
      candidates.push(fitPolyline(sig, corners));
    } else {
      const loop = closedLoopVertices(sig, corners);
      const poly = fitPolygon(sig, loop);
      if (poly) candidates.push(poly);
      // A closed stroke can still straighten to a line if it's actually flat
      // (a barely-closed scrawl) — but only offer it; the loop usually wins.
      candidates.push({ ...fitLine(sig), label: 'Line' });
    }
  } else {
    // Snap — the full template set per closure family.
    if (open) {
      candidates.push(fitLine(sig));
      candidates.push(fitPolyline(sig, corners));
      // Arrow = open shaft + V-head decomposition (more primitives — bug 2).
      const arrow = fitArrow(sig, corners);
      if (arrow) candidates.push(arrow);
    } else {
      const loop = closedLoopVertices(sig, corners);
      const tri = fitTriangle(sig, loop);
      const rect = fitRect(sig, loop);
      const star = fitStar(sig, loop); // closed alternating star (bug 2)
      const circle = fitCircle(sig);
      const ellipse = fitEllipse(sig);
      const poly = fitPolygon(sig, loop);
      if (circle) candidates.push(circle);
      if (ellipse) candidates.push(ellipse);
      if (star) candidates.push(star);
      if (tri) candidates.push(tri);
      if (rect) candidates.push(rect);
      if (poly) candidates.push(poly);
    }
  }

  // Complexity prior (PaleoSketch ranking) — added to error so the simpler
  // read wins on near-ties.
  const priorOf: Record<ShapeKind, number> = {
    line: 0,
    circle: 1,
    triangle: 2,
    rect: 3,
    ellipse: 4,
    arrow: 5,
    star: 6,
    polygon: 7,
    polyline: 8,
    original: 99,
  };
  for (const c of candidates) {
    const prior = priorOf[c.kind] * COMPLEXITY_PRIOR;
    c.score = 1 - c.normErr - prior;
  }

  // REGULARIZATION PREFERENCE (bug 1 / PaleoSketch interpretation-priority): a
  // rect / triangle / star that CLEARED its geometric gate is the higher-value
  // read the user wants — give it the win over the generic polygon whenever its
  // (regularized) normErr is within TEMPLATE_OVER_POLYGON_ERR_MULT of the
  // polygon's raw error. Without this, a clean WIDE or ROTATED rect read as
  // "Polygon (4)" because the forced-square regularization carries a hair more
  // RMS than the drawn-corner polygon. We nudge the template's score just above
  // the polygon's so it ranks first; the polygon stays in the chip to cycle to.
  const poly = candidates.find((c) => c.kind === 'polygon');
  if (poly) {
    for (const tplKind of ['rect', 'triangle', 'star'] as const) {
      const tpl = candidates.find((c) => c.kind === tplKind);
      if (tpl && tpl.normErr <= poly.normErr * TEMPLATE_OVER_POLYGON_ERR_MULT) {
        if (tpl.score <= poly.score) tpl.score = poly.score + COMPLEXITY_PRIOR;
      }
    }
  }

  // Circle-vs-ellipse preference: a near-round stroke ranks circle first; the
  // chip cycles to ellipse (SA-C). Nudge ellipse below circle when aspect ≤
  // CIRCLE_PREFERENCE_ASPECT and circle cleared threshold.
  const circ = candidates.find((c) => c.kind === 'circle');
  const ell = candidates.find((c) => c.kind === 'ellipse');
  if (circ && ell && sig.bboxAspect <= CIRCLE_PREFERENCE_ASPECT && circ.normErr <= SNAP_MAX_NORM_ERR) {
    if (ell.score >= circ.score) ell.score = circ.score - COMPLEXITY_PRIOR;
  }

  candidates.sort((a, b) => b.score - a.score);

  const best = candidates[0];
  const accepted = !!best && best.normErr <= SNAP_MAX_NORM_ERR;

  // Chip set: candidates within 2× the threshold, ranked, + original last.
  const chipCutoff = SNAP_MAX_NORM_ERR * CHIP_CANDIDATE_ERR_MULT;
  const chip = candidates.filter((c) => c.normErr <= chipCutoff);
  const ranked = (accepted ? chip : []).slice();
  ranked.push(originalCandidate);

  return {
    action,
    accepted,
    candidates: accepted ? ranked : [originalCandidate],
    refusedReason: accepted ? null : 'no-candidate-below-threshold',
    diag: baseDiag,
  };
}

// ─── Apply: candidate → the points that REPLACE stroke.points ────────────────

/** Emission spacing along the ideal outline (spec §4: "~8px spacing"). The raw
 *  perfect-freehand commit layer (Sketch mode) needs a CONTINUOUS point stream
 *  to build a clean outline — 3 sparse corners 100s of px apart break it into
 *  disconnected segments. The styled layer's RDP (ε=3.0) re-collapses straight
 *  runs back to the corner anchors, so the sharp-corner read is preserved.
 *  Both layers stay correct; only the raw layer needed the density. */
export const SNAP_EMIT_SPACING_PX = 8;

/** Walk the vertex chain (optionally closed) and sample at ~SNAP_EMIT_SPACING_PX
 *  so straight edges become a dense run of collinear points. Corners are always
 *  kept exactly (they're the vertices themselves). */
function densifyVertexChain(verts: FitPoint[], closeIt: boolean): FitPoint[] {
  if (verts.length < 2) return verts.slice();
  const out: FitPoint[] = [verts[0]];
  const segs = closeIt ? verts.length : verts.length - 1;
  for (let s = 0; s < segs; s++) {
    const a = verts[s];
    const b = verts[(s + 1) % verts.length];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const steps = Math.max(1, Math.round(len / SNAP_EMIT_SPACING_PX));
    for (let k = 1; k <= steps; k++) {
      const t = k / steps;
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    }
  }
  return out;
}

/** Emit the point list a chosen candidate writes back into stroke.points.
 *  Closed candidates WELD (the loop is exactly closed — SA-G, legitimate
 *  because snap is an explicit act) when the source was treated-as-closed or
 *  closed; open candidates never weld. Pressure: the mean of the original
 *  stroke's pressures (stays a stroke, renders in the pen — spec §4).
 *  Density: ALL candidates emit a ~8px-spaced continuous stream — circle/
 *  ellipse already do (their fit returns 48/64 outline points); corner chains
 *  (line/polyline/polygon/triangle/rect) get densified here so the raw
 *  perfect-freehand layer renders an unbroken shape (the U3 broken-triangle
 *  bug). RDP downstream re-finds the corners for the styled read. */
export function applyCandidate(
  candidate: ShapeCandidate,
  original: StrokeInputPoint[],
): StrokeInputPoint[] {
  const pressures = original.map((p) => (p.length > 2 ? (p as [number, number, number])[2] : 0.5));
  const meanP = pressures.length ? pressures.reduce((a, b) => a + b, 0) / pressures.length : 0.5;
  if (candidate.kind === 'original') {
    return original.slice();
  }
  // circle/ellipse fits are already dense outlines — emit verbatim (densifying
  // would just re-sample an already-fine curve). Corner chains densify.
  const isCurve = candidate.kind === 'circle' || candidate.kind === 'ellipse';
  const verts = isCurve
    ? candidate.points
    : densifyVertexChain(candidate.points, candidate.closed);
  const pts = verts.map((p): StrokeInputPoint => [p[0], p[1], meanP]);
  if (candidate.closed && pts.length >= 3) {
    // Weld: append the first vertex so the loop closes exactly.
    const first = pts[0];
    const last = pts[pts.length - 1];
    if (Math.hypot(first[0] - last[0], first[1] - last[1]) > 1e-6) {
      pts.push([first[0], first[1], meanP]);
    }
  }
  return pts;
}
