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

/** Rasterize one fill/lasso patch into the grid.
 *
 *  CLEAN-EDGE (2026-06-13, Sebs "fill must have a CLEAN EDGE — no sliver, no
 *  bleed, clean corners; ink is drawn ON TOP of tone"): when `inkCenterlines`
 *  (the raw gesture polylines of the bordering ink, SAME viewBox px as `points`)
 *  are supplied, the fill is grown up to the ink CENTERLINE instead of blindly
 *  dilated:
 *    1. region mask = the extractor's enclosed-paper loop (sits inkRadius·gap
 *       inside the centerline; sharp corners under crisp extraction);
 *    2. wall        = the centerlines stamped as a WATERTIGHT capsule barrier
 *       (the raw points are dense + connected, so the wall has no gaps and
 *       carries the drawing's true corners);
 *    3. interior    = cells the wall ENCLOSES (flood the window border through
 *       non-wall cells; unreached cells are interior up to the centerline);
 *    4. the patch   = (interior ∪ wall) 8-connected to the region seed.
 *  The tone reaches the ink CENTERLINE — covered by the ink-on-top (NO white
 *  sliver) and half-a-width inside the visible OUTER edge (NO bleed onto bare
 *  paper), with CLEAN corners (the centerline defines them). Independent of the
 *  Gap multiplier, so high Gap no longer rounds/insets the edge. The `dilatePx`
 *  octagon path below is the FALLBACK (Lasso, or a fill with no bordering ink).
 *
 *  `dilatePx` (fallback only): grows the patch outward so tone tucks under the
 *  visible ink edge via an octagonal structuring element (alternating
 *  8-/4-neighbor passes) — deterministic. */
export function rasterizeFillPatch(
  grid: ToneMaskGrid,
  points: [number, number][],
  holes: [number, number][][],
  band: number,
  src: 'fill' | 'lasso',
  opts: { gapTol?: number; dilatePx?: number; inkCenterlines?: [number, number][][] } = {},
): void {
  if (points.length < 3) return;
  const { bands, w, h } = grid;
  const srcCode = src === 'lasso' ? TONE_SRC_LASSO : TONE_SRC_FILL;
  const gapQ =
    src === 'fill' && opts.gapTol ? Math.max(0, Math.min(255, Math.round(opts.gapTol * 4))) : 0;
  const dilate = Math.max(0, Math.round((opts.dilatePx ?? 0) / TONE_CELL_PX));
  const inkLines =
    opts.inkCenterlines && opts.inkCenterlines.length > 0 ? opts.inkCenterlines : null;

  // Window bbox (cells) — patch bbox, grown to cover the bordering ink ribbon
  // (conform mode) or the dilation margin (fallback). +2-cell ring so the
  // ink-interior flood always has an empty border to start from.
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
  if (inkLines) {
    for (const line of inkLines) {
      for (const [x, y] of line) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  // Conform mode needs only a small ring margin (the centerline is already
  // inside the grown bbox); the fallback path keeps the dilation margin.
  const margin = inkLines ? 3 : dilate + 1;
  const c0 = Math.max(Math.floor(minX / TONE_CELL_PX) - margin, 0);
  const c1 = Math.min(Math.ceil(maxX / TONE_CELL_PX) + margin, w - 1);
  const r0 = Math.max(Math.floor(minY / TONE_CELL_PX) - margin, 0);
  const r1 = Math.min(Math.ceil(maxY / TONE_CELL_PX) + margin, h - 1);
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

  if (inkLines) {
    // 2-conform — grow the fill up to the ink CENTERLINE (CLEAN EDGE).
    //
    // (a) stamp the bordering centerlines as TWO capsule masks:
    //       · floodWall (radius 2 cells) — a WATERTIGHT barrier for the flood +
    //         carve (a 1-cell wall can have diagonal gaps on curves that an
    //         8-connected flood slips through — the donut-ring-eaten bug; 2
    //         cells closes them for 4- AND 8-connected floods);
    //       · fillWall  (radius 1 cell) — the tone's REACH: tone is grown to
    //         here = the centerline ± ~1 cell, half-a-width inside the visible
    //         OUTER edge. Both carry the drawing's true sharp corners (the raw
    //         gesture points are dense + connected).
    const floodWall = new Uint8Array(bw * bh);
    const fillWall = new Uint8Array(bw * bh);
    const stampWall = (maskArr: Uint8Array, rad: number) => {
      const rad2 = rad * rad;
      for (const line of inkLines) {
        for (let i = 0; i + 1 < line.length; i++) {
          const [ax, ay] = line[i];
          const [bx2, by2] = line[i + 1];
          const dx = bx2 - ax;
          const dy = by2 - ay;
          const lenSq = dx * dx + dy * dy;
          const wc0 = Math.max(Math.floor((Math.min(ax, bx2) - rad) / TONE_CELL_PX - 0.5), c0);
          const wc1 = Math.min(Math.ceil((Math.max(ax, bx2) + rad) / TONE_CELL_PX - 0.5), c1);
          const wr0 = Math.max(Math.floor((Math.min(ay, by2) - rad) / TONE_CELL_PX - 0.5), r0);
          const wr1 = Math.min(Math.ceil((Math.max(ay, by2) + rad) / TONE_CELL_PX - 0.5), r1);
          for (let row = wr0; row <= wr1; row++) {
            const y = (row + 0.5) * TONE_CELL_PX;
            for (let col = wc0; col <= wc1; col++) {
              const x = (col + 0.5) * TONE_CELL_PX;
              let t = lenSq > 0 ? ((x - ax) * dx + (y - ay) * dy) / lenSq : 0;
              t = t < 0 ? 0 : t > 1 ? 1 : t;
              const ex = x - (ax + t * dx);
              const ey = y - (ay + t * dy);
              if (ex * ex + ey * ey <= rad2) maskArr[(row - r0) * bw + (col - c0)] = 1;
            }
          }
        }
      }
    };
    stampWall(floodWall, 2 * TONE_CELL_PX);
    stampWall(fillWall, TONE_CELL_PX);
    // (b) flood the window border through NON-floodWall cells. Cells the flood
    //     does NOT reach are enclosed = interior. (Window has a ≥3-cell empty
    //     ring so the flood always seeds, even when ink hugs the bbox.)
    const outside = new Uint8Array(bw * bh);
    const stack: number[] = [];
    const pushOut = (i: number) => {
      if (!outside[i] && !floodWall[i]) {
        outside[i] = 1;
        stack.push(i);
      }
    };
    for (let c = 0; c < bw; c++) {
      pushOut(c);
      pushOut((bh - 1) * bw + c);
    }
    for (let r = 0; r < bh; r++) {
      pushOut(r * bw);
      pushOut(r * bw + bw - 1);
    }
    while (stack.length) {
      const i = stack.pop()!;
      const r = (i / bw) | 0;
      const c = i - r * bw;
      if (r > 0) pushOut(i - bw);
      if (r < bh - 1) pushOut(i + bw);
      if (c > 0) pushOut(i - 1);
      if (c < bw - 1) pushOut(i + 1);
    }
    // (c) fill the region's whole ENCLOSED component (everything !outside, which
    //     includes the floodWall's inner half — the interior tone reaches the
    //     ink), seeded from the region so only the tapped component fills.
    const out = new Uint8Array(bw * bh);
    const seed: number[] = [];
    const inComp = (i: number) => !outside[i] || fillWall[i];
    for (let i = 0; i < bw * bh; i++) {
      if (mask[i] && inComp(i)) {
        out[i] = 1;
        seed.push(i);
      }
    }
    while (seed.length) {
      const i = seed.pop()!;
      const r = (i / bw) | 0;
      const c = i - r * bw;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr;
          const nc = c + dc;
          if (nr < 0 || nr >= bh || nc < 0 || nc >= bw) continue;
          const j = nr * bw + nc;
          if (!out[j] && inComp(j)) {
            out[j] = 1;
            seed.push(j);
          }
        }
      }
    }
    // (d) shave the OUTER overshoot: drop floodWall cells that are NOT fillWall
    //     and touch the outside — the thick wall's outer ring sits PAST the
    //     visible edge, so removing it stops the tone exactly at fillWall
    //     (centerline ± 1 cell, under the ink) → no bleed. Interior floodWall
    //     cells (wrapped by fill, not touching outside) stay → no sliver.
    //     Iterate so the full ~1-cell ring peels (it can be 1-2 cells).
    let shaved = true;
    while (shaved) {
      shaved = false;
      for (let r = 0; r < bh; r++) {
        for (let c = 0; c < bw; c++) {
          const i = r * bw + c;
          if (!out[i] || fillWall[i] || !floodWall[i]) continue;
          const touchesOutside =
            (r > 0 && outside[i - bw]) ||
            (r < bh - 1 && outside[i + bw]) ||
            (c > 0 && outside[i - 1]) ||
            (c < bw - 1 && outside[i + 1]);
          if (touchesOutside) {
            out[i] = 0;
            outside[i] = 1; // becomes new exterior so the next ring can peel
            shaved = true;
          }
        }
      }
    }
    // (e) carve the holes back to PAPER, CONFORMED to the inner ink centerline:
    //     flood OUT from each hole's interior (the extractor hole polygon, inside
    //     the inner ink) through cells that are NOT floodWall. The watertight
    //     floodWall stops the carve at the inner centerline, so the carved paper
    //     reaches the inner ink centerline and the gray ring tucks cleanly UNDER
    //     the inner ink — no sliver on the hole edge (donut-hole mirror of the
    //     outer-edge fix; fillWall cells in the hole rim are still carved so the
    //     hole paper reaches the centerline). 4-connected to match the flood.
    if (holes.length) {
      // Stage 1 — flood the hole interior out through cells that are NOT
      // floodWall (watertight, so the carve can't leak into the ring through a
      // thin-wall gap). This reaches the floodWall's hole-side edge
      // (≈ inner centerline − 2 cells), leaving a 1-cell tone ring still inside
      // the hole between there and the inner ink.
      const carved = new Uint8Array(bw * bh);
      const carve: number[] = [];
      const tryCarve = (j: number) => {
        if (out[j] && !floodWall[j] && !carved[j]) {
          out[j] = 0;
          carved[j] = 1;
          carve.push(j);
        }
      };
      // Seed from each hole's CENTROID, NOT its whole span: the extractor's hole
      // outline can be the inner-ink BODY (its outer edge sits PAST the inner
      // centerline, on the ring side), so spanning it would seed the carve on
      // the ring side of the inner floodWall and eat the ring. The centroid is
      // always deep inside the hole; the floodWall-bounded flood then carves the
      // hole interior up to the inner centerline exactly.
      for (const hl of holes) {
        let sx = 0;
        let sy = 0;
        for (const [x, y] of hl) {
          sx += x;
          sy += y;
        }
        const cxp = sx / hl.length;
        const cyp = sy / hl.length;
        const col = Math.round(cxp / TONE_CELL_PX - 0.5);
        const row = Math.round(cyp / TONE_CELL_PX - 0.5);
        if (col >= c0 && col <= c1 && row >= r0 && row <= r1) {
          tryCarve((row - r0) * bw + (col - c0));
        }
      }
      while (carve.length) {
        const i = carve.pop()!;
        const r = (i / bw) | 0;
        const c = i - r * bw;
        if (r > 0) tryCarve(i - bw);
        if (r < bh - 1) tryCarve(i + bw);
        if (c > 0) tryCarve(i - 1);
        if (c < bw - 1) tryCarve(i + 1);
      }
      // Stage 2 — shave the floodWall's HOLE-side ring (floodWall cells that are
      // NOT fillWall and touch carved paper) so the hole paper reaches fillWall
      // (≈ inner centerline ± 1 cell). The remaining ring tone then stops where
      // the inner ink covers it → no tone bleeding into the hole, no sliver.
      // Iterate until no change (the ring is ≤1 cell thick → 1-2 passes).
      let changed = true;
      while (changed) {
        changed = false;
        for (let r = 0; r < bh; r++) {
          for (let c = 0; c < bw; c++) {
            const i = r * bw + c;
            if (!out[i] || fillWall[i] || !floodWall[i]) continue;
            const touchesCarved =
              (r > 0 && carved[i - bw]) ||
              (r < bh - 1 && carved[i + bw]) ||
              (c > 0 && carved[i - 1]) ||
              (c < bw - 1 && carved[i + 1]);
            if (touchesCarved) {
              out[i] = 0;
              carved[i] = 1;
              changed = true;
            }
          }
        }
      }
    }
    mask = out;
  } else {
    // 2-fallback — octagonal dilation (Lasso, or fill with no bordering ink).
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

// (Chaikin corner-cutting was removed from the tone extractor — see the C2
// conformance note on simplifyLoopToPx: flat tone patches keep crisp drawn
// corners; rounding turned brushed rectangles into blobs. The 3D Solid
// pipeline keeps its own chaikinClosed for the soft extruded-mass read.)

/** Simplify a raw marching-squares loop (padded-sample units) and map to
 *  draw-frame px, decimated + rounded for the record.
 *
 *  CONFORMANCE (the C2 blob fix): NO Chaikin pass. Chaikin's corner-cutting
 *  "slices off every corner" (Chaikin 1974) — applied here it turns a brushed
 *  RECTANGLE into a rounded octagon/blob, so the tone region stops conforming
 *  to the boundary the user actually painted. RDP already removes the marching-
 *  squares staircase while keeping crisp corners exactly where the mask has
 *  them; the 2px tone cells (TONE_CELL_PX) put residual stair steps well below
 *  the ~3px corner-cut target. Keeping crisp corners is the whole point of a
 *  region fill — a drawn rectangle must fill as a rectangle. (The Solid 3D
 *  pipeline keeps Chaikin on purpose — it wants the soft hand-drawn curve read
 *  on an extruded mass; flat tone patches want the crisp drawn edge.) */
function simplifyLoopToPx(loop: Array<[number, number]>): [number, number][] {
  const open = [...loop, loop[0]] as Array<[number, number]>;
  const simple = rdp(open, RDP_EPSILON_CELLS);
  simple.pop(); // re-open (closed implicitly)
  let rounded = simple;
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
    // Per-band SUPERSET (isoband / nested level-set) mask: cell is IN band N's
    // region when its value is >= N. This is the canonical marching-squares
    // "isoband" representation (Wikipedia: Marching squares — filled areas
    // between isolines / nested level sets): each darker level's region is
    // strictly CONTAINED by every lighter level's region.
    //
    // Why superset, not exact-equality (the C1 carve fix): the grid stores ONE
    // band per cell, so a darker stroke through a lighter patch OVERWRITES
    // those cells (stampToneCapsule §3 "darker over lighter → replace"). An
    // exact-equality mask for the lighter band would then see a darker-shaped
    // GAP cut through it — fragmenting the continuous lighter patch into
    // disconnected islands. The superset mask keeps the lighter band's region
    // WHOLE underneath the darker stroke; the darker band extracts as its own
    // (smaller, contained) region. The consumer paints ascending by band with
    // OPAQUE band greys (painter's algorithm — DrawSurface TONE_BAND_HEX +
    // sortedToneFills), so the darker region simply composites OVER the
    // unbroken lighter patch — it never carves. Genuine paper voids inside a
    // region (cells < N that are fully enclosed) still extract as holes via the
    // containment-depth parity below. Padded by one empty cell so every contour
    // closes.
    mask.fill(0);
    for (let row = 0; row < h; row++) {
      for (let col = 0; col < w; col++) {
        if (bands[row * w + col] >= band) mask[(row + 1) * pw + (col + 1)] = 1;
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
