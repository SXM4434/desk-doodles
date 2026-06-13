// ─── toneMask — the shade register's per-cell BAND GRID ──────────────────────
// docs/design/shade-brush-behavior-spec.md §2-§4 (the C1/C2/C3 fix): during a
// draw session the shade register's source of truth is this per-cell band
// grid — NOT a list of swept-capsule patches. The brush stamps discs/capsules
// into the grid through the ratified marker-model rule table (§3, Sebs
// 2026-06-12); pen-lift extracts merged per-band island outlines through the
// SAME raster→contour machinery the 3D Solid pipeline uses (strokeTo3d.ts
// `rasterizePoolLoops` — marching squares with deterministic saddles +
// containment-depth parity + RDP + Chaikin). Mirrored here, not imported:
// strokeTo3d carries the `three` dependency and world-space types; this module
// stays a pure, dependency-free 2D library (same mirroring precedent as
// DrawPanel's StagedRenderScope).
//
// Everything in this file is DETERMINISTIC: same gesture sequence → same grid
// → same loops → byte-identical toneFills JSON (stable ordering, stable ids).
// That determinism is what makes the record cacheable downstream
// (conversion-semantics-addendum.md ch.2.2).

/** Bump when the grid/extraction algorithm changes — the golden-gate pattern
 *  applied to caches (addendum ch.2.2): conversion/render caches key on
 *  SHA-1(svg ∥ strokesJson ∥ toneFillsJson ∥ extractorVersion) — append THIS
 *  constant to that concatenation so a mask-algorithm change invalidates
 *  fleet-wide. (The ch.2.2 cache itself is the conversion rock's wiring; the
 *  constant lives here so the version travels with the algorithm.) */
export const TONE_MASK_VERSION = 1;

/** Grid cell size in draw-frame px (spec §2: 2px cells over 800×600 → 400×300,
 *  120K cells — trivially cheap). */
export const TONE_CELL_PX = 2;

/** Per-patch outline resolution cap — spec §2: 64 → 128 for MERGED regions
 *  (one merged island replaces many capsules; net JSON shrinks). */
export const TONE_MASK_MAX_PTS = 128;

/** Noise floor for extracted islands, in CELL² units (2 cells² = 8px² — keeps
 *  a minimum-radius dab, drops single-cell marching-squares specks). */
const MIN_ISLAND_AREA_CELLS = 2;

/** RDP epsilon in CELL units — the same simplify the Solid contours use
 *  (strokeTo3d SOLID_RDP_EPSILON_CELLS). */
const RDP_EPSILON_CELLS = 0.6;

// ─── Record shape ─────────────────────────────────────────────────────────────

/** One tone patch — `render_config.toneFills` entry (addendum ch.2.1: a
 *  SIBLING of strokes, band INDEX not raw alpha, never only-baked-into-svg).
 *  Schema is the round-7 record unchanged; `holes`/`src` are OPTIONAL,
 *  additive fields (older readers see `points` = the outer loop and a
 *  slightly over-covering patch — honest degradation, no break). */
export type ToneFill = {
  id: string;
  /** Outer outline polygon (closed), draw-frame viewBox coords. */
  points: [number, number][];
  /** COVERAGE_BANDS index 1–7. Band 0 (paper) is the ABSENCE of tone — it is
   *  the erase action, never a painted patch. */
  band: number;
  /** Interior hole loops (spec §2: emitted as separate subpaths in one
   *  <path> with fill-rule="evenodd", mirroring the extractor's outer/hole
   *  roles). Optional — most patches have none. */
  holes?: [number, number][][];
  /** Provenance — which input produced this patch (D-RF6, region-fill-spec):
   *  'brush' = the shade brush; 'fill' = extractor-backed region fill;
   *  'lasso' = the freehand loop tool. Optional; absent on legacy records.
   *  Island provenance is the MAJORITY cell vote at extraction (a fill the
   *  user then brushes over becomes brush-majority honestly). */
  src?: 'brush' | 'fill' | 'lasso';
  /** Gap-tolerance multiplier the fill was committed at (region-fill-spec
   *  D-RF6: recorded only when ≠ 1× and src is 'fill'). Training-ladder
   *  provenance — a few bytes, budget-guarded by capToneFills. */
  gapTol?: number;
};

/** Per-cell provenance codes for the sidecar src grid (rock F2). */
export const TONE_SRC_BRUSH = 0;
export const TONE_SRC_FILL = 1;
export const TONE_SRC_LASSO = 2;

// ─── The grid ─────────────────────────────────────────────────────────────────

export interface ToneMaskGrid {
  /** Cell band values 0–7 (0 = paper). Row-major, w×h. */
  bands: Uint8Array;
  /** Per-STROKE dirty bitset (spec §3: "same stroke" = cells already stamped
   *  since pen-down) — cleared by beginToneStroke. */
  dirty: Uint8Array;
  /** Per-cell provenance sidecar (rock F2, D-RF6): TONE_SRC_* code of the
   *  act that last WROTE the cell's band. Meaningful only where band > 0. */
  src: Uint8Array;
  /** Per-cell gap-tolerance sidecar: the fill's gapTol multiplier ×4 (the
   *  0.5×–3× ladder quantizes to integers 2..12). 0 = not a fill cell. */
  gapTolQ: Uint8Array;
  w: number;
  h: number;
}

export function createToneGrid(viewW: number, viewH: number): ToneMaskGrid {
  const w = Math.ceil(viewW / TONE_CELL_PX);
  const h = Math.ceil(viewH / TONE_CELL_PX);
  return {
    bands: new Uint8Array(w * h),
    dirty: new Uint8Array(w * h),
    src: new Uint8Array(w * h),
    gapTolQ: new Uint8Array(w * h),
    w,
    h,
  };
}

/** Pen-down: a new stroke begins — reset the within-stroke dirty bitset. */
export function beginToneStroke(grid: ToneMaskGrid): void {
  grid.dirty.fill(0);
}

/** Stamp one brush segment (capsule a→b, radius r, all in draw-frame px) into
 *  the grid. `band` 1–7 paints through the ratified marker table (§3); band 0
 *  is the ERASER — an unconditional paper stamp, ignoring what's there (§4).
 *
 *  The §3 table, applied per cell at stamp time (never average — every cell
 *  always carries a band the user's acts produced):
 *    onto paper (b=0)            → paint p
 *    same band, SAME stroke      → flat (dirty bitset skip)
 *    same band, NEW stroke (p=b) → darken one band: min(7, b+1)
 *    darker over lighter (p>b)   → replace with p
 *    lighter over darker (p<b)   → IGNORE (markers can't lighten; eraser's job)
 */
export function stampToneCapsule(
  grid: ToneMaskGrid,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  radius: number,
  band: number,
): void {
  const { bands, dirty, w, h } = grid;
  const r = Math.max(radius, TONE_CELL_PX / 2);
  const r2 = r * r;
  const minX = Math.min(ax, bx) - r;
  const maxX = Math.max(ax, bx) + r;
  const minY = Math.min(ay, by) - r;
  const maxY = Math.max(ay, by) + r;
  // Cell (col,row) center = ((col+0.5)·CELL, (row+0.5)·CELL). Clamped bbox
  // walk — off-canvas drag clamps to the frame, no wraparound.
  const c0 = Math.max(Math.floor(minX / TONE_CELL_PX - 0.5), 0);
  const c1 = Math.min(Math.ceil(maxX / TONE_CELL_PX - 0.5), w - 1);
  const row0 = Math.max(Math.floor(minY / TONE_CELL_PX - 0.5), 0);
  const row1 = Math.min(Math.ceil(maxY / TONE_CELL_PX - 0.5), h - 1);
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  for (let row = row0; row <= row1; row++) {
    const y = (row + 0.5) * TONE_CELL_PX;
    for (let col = c0; col <= c1; col++) {
      const x = (col + 0.5) * TONE_CELL_PX;
      let t = lenSq > 0 ? ((x - ax) * dx + (y - ay) * dy) / lenSq : 0;
      t = Math.min(Math.max(t, 0), 1);
      const ex = x - (ax + t * dx);
      const ey = y - (ay + t * dy);
      if (ex * ex + ey * ey > r2) continue;
      const idx = row * w + col;
      if (band === 0) {
        // Eraser: band-0 stamp, ignores band — lifts whatever is there (§4).
        bands[idx] = 0;
        grid.src[idx] = TONE_SRC_BRUSH; // paper carries no provenance
        grid.gapTolQ[idx] = 0;
        dirty[idx] = 1;
        continue;
      }
      if (dirty[idx]) continue; // flat within a stroke (§3 row 2)
      const b = bands[idx];
      // Provenance: a cell becomes brush-sourced only when the brush actually
      // WRITES it — the lighter-over-darker IGNORE leaves the standing
      // statement (and its fill/lasso provenance) untouched.
      if (b === 0) {
        bands[idx] = band;
        grid.src[idx] = TONE_SRC_BRUSH;
        grid.gapTolQ[idx] = 0;
      } else if (band === b) {
        bands[idx] = Math.min(7, b + 1);
        grid.src[idx] = TONE_SRC_BRUSH;
        grid.gapTolQ[idx] = 0;
      } else if (band > b) {
        bands[idx] = band;
        grid.src[idx] = TONE_SRC_BRUSH;
        grid.gapTolQ[idx] = 0;
      }
      // band < b → ignore (cell keeps b + its provenance)
      dirty[idx] = 1;
    }
  }
}

// ─── Rasterize stored patches back into the grid (Re-draw reload) ─────────────
// Spec §2: stored patches are already RESOLVED band statements — §3 rules
// apply only at brush time. Reload = ascending band order, darker wins
// (write, don't blend). Outer loops fill by NONZERO winding (matches the
// browser's default fill of legacy self-intersecting capsule sweeps); holes
// subtract.

/** Nonzero-winding x-spans of one loop at scanline y. Returns merged
 *  [x0, x1) spans, sorted. */
function loopSpansAtY(loop: [number, number][], y: number): Array<[number, number]> {
  const events: Array<[number, number]> = []; // [x, winding delta]
  for (let i = 0; i < loop.length; i++) {
    const [ax, ay] = loop[i];
    const [bx, by] = loop[(i + 1) % loop.length];
    if (ay <= y && by > y) events.push([ax + ((y - ay) / (by - ay)) * (bx - ax), 1]);
    else if (by <= y && ay > y) events.push([ax + ((y - ay) / (by - ay)) * (bx - ax), -1]);
  }
  events.sort((p, q) => p[0] - q[0]);
  const spans: Array<[number, number]> = [];
  let winding = 0;
  let start = 0;
  for (const [x, d] of events) {
    const was = winding;
    winding += d;
    if (was === 0 && winding !== 0) start = x;
    else if (was !== 0 && winding === 0) spans.push([start, x]);
  }
  return spans;
}

function xInSpans(x: number, spans: Array<[number, number]>): boolean {
  for (const [x0, x1] of spans) if (x >= x0 && x < x1) return true;
  return false;
}

/** Write stored tone patches into the grid. Ascending band order — darker
 *  wins by painting later; within a band, input order (stable). Provenance
 *  sidecars reload too (Re-draw round-trips src/gapTol). */
export function rasterizeToneFills(grid: ToneMaskGrid, fills: ToneFill[]): void {
  const sorted = [...fills].sort((a, b) => a.band - b.band);
  const { bands, w, h } = grid;
  for (const f of sorted) {
    if (f.band < 1 || f.band > 7 || f.points.length < 3) continue;
    const srcCode =
      f.src === 'fill' ? TONE_SRC_FILL : f.src === 'lasso' ? TONE_SRC_LASSO : TONE_SRC_BRUSH;
    const gapQ =
      f.src === 'fill' && f.gapTol ? Math.max(0, Math.min(255, Math.round(f.gapTol * 4))) : 0;
    // Row range from the outer loop's bbox.
    let minY = Infinity;
    let maxY = -Infinity;
    for (const [, y] of f.points) {
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    const row0 = Math.max(Math.floor(minY / TONE_CELL_PX - 0.5), 0);
    const row1 = Math.min(Math.ceil(maxY / TONE_CELL_PX - 0.5), h - 1);
    const holes = f.holes ?? [];
    for (let row = row0; row <= row1; row++) {
      const y = (row + 0.5) * TONE_CELL_PX;
      const outer = loopSpansAtY(f.points, y);
      if (outer.length === 0) continue;
      const holeSpans = holes.map((hl) => loopSpansAtY(hl, y));
      for (let col = 0; col < w; col++) {
        const x = (col + 0.5) * TONE_CELL_PX;
        if (!xInSpans(x, outer)) continue;
        let inHole = false;
        for (const hs of holeSpans) {
          if (xInSpans(x, hs)) {
            inHole = true;
            break;
          }
        }
        if (!inHole) {
          const idx = row * w + col;
          bands[idx] = f.band;
          grid.src[idx] = srcCode;
          grid.gapTolQ[idx] = gapQ;
        }
      }
    }
  }
}

// ─── Region-fill patch rasterization (rock F2 — region-fill-spec §4/§7) ───────
// A Fill/Lasso commit writes its patch INTO the band grid — the grid stays the
// ONE session truth, so eraser carve, brush composition and replace-on-refill
// all compose for free. Semantics per the spec table: re-fill of a region
// REPLACES its band (unconditional write — never average, never stack).
// Band 0 = the Fill-mode eraser (lift the region back to paper).

/** Rasterize one fill/lasso patch into the grid. `dilatePx` (Fill commits
 *  only) grows the patch outward so tone tucks under the VISIBLE ink edge:
 *  the extractor's enclosed-paper boundary sits inkRadius px inside the
 *  stroke centerline, but drawn ink is only ~3px wide — committing the raw
 *  outline would leave a paper ring between tone and line. Dilation by
 *  (inkRadius·gap − 1.5)px lands the tone edge at the visible ink edge; the
 *  overshoot is under ink (invisible) and bounded by the tolerance the user
 *  explicitly chose. Octagonal structuring element (alternating 8-/4-neighbor
 *  passes) — deterministic. */
export function rasterizeFillPatch(
  grid: ToneMaskGrid,
  points: [number, number][],
  holes: [number, number][][],
  band: number,
  src: 'fill' | 'lasso',
  opts: { gapTol?: number; dilatePx?: number } = {},
): void {
  if (points.length < 3) return;
  const { bands, w, h } = grid;
  const srcCode = src === 'lasso' ? TONE_SRC_LASSO : TONE_SRC_FILL;
  const gapQ =
    src === 'fill' && opts.gapTol ? Math.max(0, Math.min(255, Math.round(opts.gapTol * 4))) : 0;
  const dilate = Math.max(0, Math.round((opts.dilatePx ?? 0) / TONE_CELL_PX));

  // Window bbox (cells) — patch bbox + dilation margin, clamped to the grid.
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of points) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  const c0 = Math.max(Math.floor(minX / TONE_CELL_PX) - dilate - 1, 0);
  const c1 = Math.min(Math.ceil(maxX / TONE_CELL_PX) + dilate + 1, w - 1);
  const r0 = Math.max(Math.floor(minY / TONE_CELL_PX) - dilate - 1, 0);
  const r1 = Math.min(Math.ceil(maxY / TONE_CELL_PX) + dilate + 1, h - 1);
  const bw = c1 - c0 + 1;
  const bh = r1 - r0 + 1;
  if (bw <= 0 || bh <= 0) return;

  // 1 — rasterize the polygon (nonzero winding, holes subtract) into a window
  // mask. Nonzero matches the browser's fill of a self-crossing lasso loop.
  let mask = new Uint8Array(bw * bh);
  for (let row = r0; row <= r1; row++) {
    const y = (row + 0.5) * TONE_CELL_PX;
    const outer = loopSpansAtY(points, y);
    if (outer.length === 0) continue;
    const holeSpans = holes.map((hl) => loopSpansAtY(hl, y));
    for (let col = c0; col <= c1; col++) {
      const x = (col + 0.5) * TONE_CELL_PX;
      if (!xInSpans(x, outer)) continue;
      let inHole = false;
      for (const hs of holeSpans) {
        if (xInSpans(x, hs)) {
          inHole = true;
          break;
        }
      }
      if (!inHole) mask[(row - r0) * bw + (col - c0)] = 1;
    }
  }

  // 2 — dilate (alternating 8/4-neighbor ≈ octagonal ball), double-buffered.
  let buf = new Uint8Array(bw * bh);
  for (let pass = 0; pass < dilate; pass++) {
    const eight = pass % 2 === 0;
    buf.set(mask);
    for (let r = 0; r < bh; r++) {
      for (let c = 0; c < bw; c++) {
        if (mask[r * bw + c]) continue;
        const up = r > 0 && mask[(r - 1) * bw + c];
        const dn = r < bh - 1 && mask[(r + 1) * bw + c];
        const lf = c > 0 && mask[r * bw + c - 1];
        const rt = c < bw - 1 && mask[r * bw + c + 1];
        let on = up || dn || lf || rt;
        if (!on && eight) {
          on =
            (r > 0 && c > 0 && mask[(r - 1) * bw + c - 1]) ||
            (r > 0 && c < bw - 1 && mask[(r - 1) * bw + c + 1]) ||
            (r < bh - 1 && c > 0 && mask[(r + 1) * bw + c - 1]) ||
            (r < bh - 1 && c < bw - 1 && mask[(r + 1) * bw + c + 1]);
        }
        if (on) buf[r * bw + c] = 1;
      }
    }
    const t = mask;
    mask = buf;
    buf = t;
  }

  // 3 — write: unconditional REPLACE (spec §7 "re-fill same region → REPLACE
  // its band, don't stack"); band 0 lifts to paper.
  for (let r = 0; r < bh; r++) {
    for (let c = 0; c < bw; c++) {
      if (!mask[r * bw + c]) continue;
      const idx = (r + r0) * w + (c + c0);
      if (band === 0) {
        bands[idx] = 0;
        grid.src[idx] = TONE_SRC_BRUSH;
        grid.gapTolQ[idx] = 0;
      } else {
        bands[idx] = band;
        grid.src[idx] = srcCode;
        grid.gapTolQ[idx] = gapQ;
      }
    }
  }
}

// ─── Pen-lift extraction: grid → merged per-band island outlines ──────────────
// The pool-raster contour approach (strokeTo3d rasterizePoolLoops), per band:
// marching squares (deterministic saddles, degree-2 chaining — contours are
// non-self-intersecting BY CONSTRUCTION, the C3a kill) → area filter →
// containment-depth parity (even = island, odd = hole) → RDP + Chaikin →
// decimate to ≤ TONE_MASK_MAX_PTS → 0.1px rounding.

/** Marching squares over a padded binary mask → closed loops in padded-sample
 *  units. Mirror of strokeTo3d marchingSquaresLoops (same fixed saddle
 *  resolution, same chaining), sized for the tone grid. */
function marchingSquaresLoops(
  mask: Uint8Array,
  w: number,
  h: number,
): Array<Array<[number, number]>> {
  const STRIDE = 2048; // > 2·(tone grid w + padding); pid stays < 2^24
  const pid = (x2: number, y2: number) => x2 * STRIDE + y2;
  const adj = new Map<number, number[]>();
  const segList: Array<[number, number]> = [];
  const addSeg = (px2: number, py2: number, qx2: number, qy2: number) => {
    const p = pid(px2, py2);
    const q = pid(qx2, qy2);
    if (!adj.has(p)) adj.set(p, []);
    if (!adj.has(q)) adj.set(q, []);
    adj.get(p)!.push(q);
    adj.get(q)!.push(p);
    segList.push([p, q]);
  };

  for (let row = 0; row < h - 1; row++) {
    for (let col = 0; col < w - 1; col++) {
      const a = mask[row * w + col];
      const b = mask[row * w + col + 1];
      const c = mask[(row + 1) * w + col + 1];
      const d = mask[(row + 1) * w + col];
      const code = a | (b << 1) | (c << 2) | (d << 3);
      if (code === 0 || code === 15) continue;
      const bot: [number, number] = [col * 2 + 1, row * 2];
      const rgt: [number, number] = [col * 2 + 2, row * 2 + 1];
      const top: [number, number] = [col * 2 + 1, row * 2 + 2];
      const lft: [number, number] = [col * 2, row * 2 + 1];
      switch (code) {
        case 1: case 14: addSeg(...lft, ...bot); break;
        case 2: case 13: addSeg(...bot, ...rgt); break;
        case 3: case 12: addSeg(...lft, ...rgt); break;
        case 4: case 11: addSeg(...rgt, ...top); break;
        case 6: case 9: addSeg(...bot, ...top); break;
        case 7: case 8: addSeg(...lft, ...top); break;
        case 5: // saddle — fixed deterministic resolution
          addSeg(...lft, ...bot);
          addSeg(...rgt, ...top);
          break;
        case 10: // saddle — fixed deterministic resolution
          addSeg(...bot, ...rgt);
          addSeg(...top, ...lft);
          break;
      }
    }
  }

  const edgeKey = (p: number, q: number) => (p < q ? p * 16777216 + q : q * 16777216 + p);
  const visited = new Set<number>();
  const loops: Array<Array<[number, number]>> = [];
  for (const [p0, p1] of segList) {
    if (visited.has(edgeKey(p0, p1))) continue;
    const loop: number[] = [p0];
    let prev = p0;
    let curr = p1;
    visited.add(edgeKey(p0, p1));
    let guard = adj.size + 8;
    while (curr !== p0 && guard-- > 0) {
      loop.push(curr);
      const nbrs = adj.get(curr)!;
      const next = nbrs[0] === prev ? nbrs[1] : nbrs[0];
      if (next === undefined) break;
      visited.add(edgeKey(curr, next));
      prev = curr;
      curr = next;
    }
    if (curr !== p0 || loop.length < 3) continue;
    loops.push(loop.map((id) => [Math.floor(id / STRIDE) / 2, (id % STRIDE) / 2]));
  }
  return loops;
}

/** Shoelace area (absolute), any consistent units. */
function loopArea(loop: Array<[number, number]>): number {
  let area = 0;
  for (let i = 0; i < loop.length; i++) {
    const [ax, ay] = loop[i];
    const [bx, by] = loop[(i + 1) % loop.length];
    area += ax * by - bx * ay;
  }
  return Math.abs(area / 2);
}

/** Even-odd point-in-loop. */
function pointInLoop(x: number, y: number, loop: Array<[number, number]>): boolean {
  let inside = false;
  for (let i = 0; i < loop.length; i++) {
    const [ax, ay] = loop[i];
    const [bx, by] = loop[(i + 1) % loop.length];
    if (ay > y !== by > y && x < ax + ((y - ay) / (by - ay)) * (bx - ax)) inside = !inside;
  }
  return inside;
}

/** RDP polyline simplification on [x, y] pairs (mirror of strokeTo3d
 *  rdpPoints, 2-tuple specialization). */
function rdp(points: Array<[number, number]>, epsilon: number): Array<[number, number]> {
  if (points.length < 3) return points.slice();
  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;
  const stack: Array<[number, number]> = [[0, points.length - 1]];
  while (stack.length > 0) {
    const [i0, i1] = stack.pop()!;
    if (i1 - i0 < 2) continue;
    const [ax, ay] = points[i0];
    const [bx, by] = points[i1];
    const dx = bx - ax;
    const dy = by - ay;
    const len = Math.hypot(dx, dy);
    let maxDist = -1;
    let maxIdx = -1;
    for (let i = i0 + 1; i < i1; i++) {
      const [px, py] = points[i];
      const dist =
        len > 1e-12
          ? Math.abs(dy * px - dx * py + bx * ay - by * ax) / len
          : Math.hypot(px - ax, py - ay);
      if (dist > maxDist) {
        maxDist = dist;
        maxIdx = i;
      }
    }
    if (maxDist > epsilon) {
      keep[maxIdx] = 1;
      stack.push([i0, maxIdx], [maxIdx, i1]);
    }
  }
  const out: Array<[number, number]> = [];
  for (let i = 0; i < points.length; i++) if (keep[i]) out.push(points[i]);
  return out;
}

/** One Chaikin corner-cutting pass on a CLOSED loop (mirror of strokeTo3d
 *  chaikinClosed) — rounds the RDP corners so merged patches keep a soft
 *  region read instead of a low-poly facet read. */
function chaikinClosed(loop: Array<[number, number]>): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (let i = 0; i < loop.length; i++) {
    const [ax, ay] = loop[i];
    const [bx, by] = loop[(i + 1) % loop.length];
    out.push([ax * 0.75 + bx * 0.25, ay * 0.75 + by * 0.25]);
    out.push([ax * 0.25 + bx * 0.75, ay * 0.25 + by * 0.75]);
  }
  return out;
}

/** Simplify a raw marching-squares loop (padded-sample units) and map to
 *  draw-frame px, decimated + rounded for the record. */
function simplifyLoopToPx(loop: Array<[number, number]>): [number, number][] {
  const open = [...loop, loop[0]] as Array<[number, number]>;
  const simple = rdp(open, RDP_EPSILON_CELLS);
  simple.pop(); // re-open (closed implicitly)
  let rounded = simple.length >= 3 ? chaikinClosed(simple) : simple;
  while (rounded.length > TONE_MASK_MAX_PTS) {
    rounded = rounded.filter((_, i) => i % 2 === 0);
  }
  // Padded sample (i,j) ↔ cell (i−1, j−1) centered at ((i−1)+0.5)·CELL:
  // px = (coord − 0.5)·CELL. Rounded to 0.1px (compact + deterministic).
  return rounded.map(([x, y]) => [
    Math.round((x - 0.5) * TONE_CELL_PX * 10) / 10,
    Math.round((y - 0.5) * TONE_CELL_PX * 10) / 10,
  ]);
}

/** Label the connected islands of a padded binary mask (4-connectivity, BFS
 *  in raster-scan discovery order — deterministic) and accumulate per-label
 *  provenance votes from the sidecar grids. Returns the label map plus, per
 *  label, src-code counts and gapTolQ counts (rock F2 provenance). */
function labelIslands(
  mask: Uint8Array,
  pw: number,
  ph: number,
  grid: ToneMaskGrid,
): {
  labels: Int32Array;
  srcCounts: number[][];
  gapCounts: Array<Map<number, number>>;
} {
  const labels = new Int32Array(pw * ph).fill(-1);
  const srcCounts: number[][] = [];
  const gapCounts: Array<Map<number, number>> = [];
  const stack: number[] = [];
  const { w } = grid;
  for (let start = 0; start < mask.length; start++) {
    if (!mask[start] || labels[start] >= 0) continue;
    const label = srcCounts.length;
    srcCounts.push([0, 0, 0]);
    gapCounts.push(new Map());
    stack.length = 0;
    stack.push(start);
    labels[start] = label;
    while (stack.length > 0) {
      const j = stack.pop()!;
      // Vote: padded sample (i, jrow) ↔ grid cell (i−1, jrow−1).
      const col = (j % pw) - 1;
      const row = Math.floor(j / pw) - 1;
      const cellIdx = row * w + col;
      const code = grid.src[cellIdx] ?? 0;
      srcCounts[label][code <= 2 ? code : 0]++;
      const q = grid.gapTolQ[cellIdx] ?? 0;
      if (q > 0) gapCounts[label].set(q, (gapCounts[label].get(q) ?? 0) + 1);
      // 4-neighbors (fixed order — deterministic).
      const x = j % pw;
      const y = Math.floor(j / pw);
      if (x > 0 && mask[j - 1] && labels[j - 1] < 0) { labels[j - 1] = label; stack.push(j - 1); }
      if (x < pw - 1 && mask[j + 1] && labels[j + 1] < 0) { labels[j + 1] = label; stack.push(j + 1); }
      if (y > 0 && mask[j - pw] && labels[j - pw] < 0) { labels[j - pw] = label; stack.push(j - pw); }
      if (y < ph - 1 && mask[j + pw] && labels[j + pw] < 0) { labels[j + pw] = label; stack.push(j + pw); }
    }
  }
  return { labels, srcCounts, gapCounts };
}

/** The island label adjacent to a marching-squares loop's first point. Loop
 *  points are edge midpoints (one coord *.5) between a 1-sample and a
 *  0-sample — the 1-sample side names the island. -1 when unresolvable. */
function loopLabel(
  loop: Array<[number, number]>,
  labels: Int32Array,
  mask: Uint8Array,
  pw: number,
): number {
  const [x, y] = loop[0];
  const cands: Array<[number, number]> =
    x % 1 !== 0
      ? [
          [Math.floor(x), y],
          [Math.ceil(x), y],
        ]
      : [
          [x, Math.floor(y)],
          [x, Math.ceil(y)],
        ];
  for (const [cx, cy] of cands) {
    const idx = cy * pw + cx;
    if (mask[idx]) return labels[idx];
  }
  return -1;
}

/** Majority vote with deterministic tie-break (smaller key wins). */
function majoritySrc(counts: number[]): number {
  let best = 0;
  for (let code = 1; code < counts.length; code++) {
    if (counts[code] > counts[best]) best = code;
  }
  return best;
}

/** Extract the merged per-band islands from the grid → the toneFills record.
 *  Deterministic: bands ascend 1→7; islands in marching-squares discovery
 *  order (raster scan order); ids `t{band}-{k}`. Same scripted strokes →
 *  byte-identical JSON. Provenance (rock F2): each island carries the
 *  MAJORITY src of its cells ('brush'|'fill'|'lasso') + the majority gapTol
 *  for fill islands when ≠ 1× (D-RF6). */
export function extractToneFills(grid: ToneMaskGrid): ToneFill[] {
  const { bands, w, h } = grid;
  // Which bands are present (one scan, skips empty extraction passes).
  const present = new Uint8Array(8);
  for (let i = 0; i < bands.length; i++) present[bands[i]] = 1;

  const pw = w + 2;
  const ph = h + 2;
  const mask = new Uint8Array(pw * ph);
  const fills: ToneFill[] = [];

  for (let band = 1; band <= 7; band++) {
    if (!present[band]) continue;
    // Per-band EXACT-equality mask (disjoint regions — one region per area;
    // a darker blob inside a lighter field reads as the lighter island's
    // hole + its own island, never overlapping statements), padded by one
    // empty cell so every contour closes.
    mask.fill(0);
    for (let row = 0; row < h; row++) {
      for (let col = 0; col < w; col++) {
        if (bands[row * w + col] === band) mask[(row + 1) * pw + (col + 1)] = 1;
      }
    }
    const loops = marchingSquaresLoops(mask, pw, ph).filter(
      (l) => loopArea(l) >= MIN_ISLAND_AREA_CELLS,
    );
    if (loops.length === 0) continue;

    // Provenance labeling (rock F2): per-island src/gapTol majority votes.
    const { labels, srcCounts, gapCounts } = labelIslands(mask, pw, ph, grid);

    // Containment-depth parity: even = island outline, odd = hole.
    const depths = loops.map((loop, i) => {
      const [x, y] = loop[0];
      let d = 0;
      for (let j = 0; j < loops.length; j++) {
        if (j !== i && pointInLoop(x, y, loops[j])) d++;
      }
      return d;
    });

    const outerIdx: number[] = [];
    for (let i = 0; i < loops.length; i++) if (depths[i] % 2 === 0) outerIdx.push(i);

    let k = 0;
    for (const oi of outerIdx) {
      const points = simplifyLoopToPx(loops[oi]);
      if (points.length < 3) continue;
      // Holes of this island: odd-depth loops whose innermost containing
      // outer is THIS loop (smallest-area container at depth − 1 — the same
      // assignment rule buildSolidGeometry uses).
      const holes: [number, number][][] = [];
      for (let i = 0; i < loops.length; i++) {
        if (depths[i] % 2 !== 1) continue;
        const [x, y] = loops[i][0];
        let best = -1;
        let bestArea = Infinity;
        for (const oj of outerIdx) {
          if (depths[oj] !== depths[i] - 1) continue;
          if (pointInLoop(x, y, loops[oj])) {
            const a = loopArea(loops[oj]);
            if (a < bestArea) {
              bestArea = a;
              best = oj;
            }
          }
        }
        if (best !== oi) continue;
        const hole = simplifyLoopToPx(loops[i]);
        if (hole.length >= 3) holes.push(hole);
      }
      // Island provenance: majority cell vote (deterministic tie → brush).
      const label = loopLabel(loops[oi], labels, mask, pw);
      const code = label >= 0 ? majoritySrc(srcCounts[label]) : TONE_SRC_BRUSH;
      const src: ToneFill['src'] =
        code === TONE_SRC_FILL ? 'fill' : code === TONE_SRC_LASSO ? 'lasso' : 'brush';
      let gapTol: number | undefined;
      if (src === 'fill' && label >= 0) {
        let bestQ = 0;
        let bestN = 0;
        for (const [q, n] of gapCounts[label]) {
          if (n > bestN || (n === bestN && q < bestQ)) {
            bestQ = q;
            bestN = n;
          }
        }
        if (bestQ > 0 && bestQ !== 4) gapTol = bestQ / 4; // record only when ≠ 1×
      }
      fills.push({
        id: `t${band}-${k}`,
        band,
        points,
        ...(holes.length > 0 ? { holes } : {}),
        src,
        ...(gapTol !== undefined ? { gapTol } : {}),
      });
      k++;
    }
  }
  return fills;
}
