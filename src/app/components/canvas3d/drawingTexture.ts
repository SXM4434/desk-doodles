// ─── drawingTexture — drawn marks → bas-relief height field (CanvasTexture) ──
// REPLACES the RC-2 "raised glossy-ink tubes on the front face" stopgap. That
// overlay read as separate wires plopped ON TOP of the slab; this makes the
// drawing PART of the surface — the marks are carved/engraved into the front
// face as relief that the studio lights catch (continuous surface, not separate
// geometry).
//
// TECHNIQUE — digital bas-relief / displacement-from-drawing:
//   1. Rasterize the stroke pool to an offscreen 2D canvas (white = flat
//      surface level; ink strokes = darker = recessed grooves).
//   2. Wrap it in a THREE.CanvasTexture.
//   3. The scene uses it as a MeshStandardMaterial/MeshPhysicalMaterial
//      `bumpMap` on the extruded/solid FRONT FACE. bumpMap perturbs the
//      surface normal from the texture's grayscale gradient WITHOUT moving
//      geometry — "black and white values map to the perceived depth in
//      relation to the lights; bump doesn't actually affect the geometry, only
//      the lighting" (three.js MeshStandardMaterial.bumpMap docs). So a soft-
//      edged dark groove reads as ink pressed INTO the matte clay: the light
//      rolls down the groove wall and the eye reads relief.
//   4. (Optional) the same texture can drive a light `displacementMap` when the
//      front face is tessellated enough; for the makeathon the front cap is a
//      single triangulated fan (ExtrudeGeometry steps:1), so REAL displacement
//      would only move the silhouette ring — bump-only is the achievable
//      premium result and is what the scene applies.
//
// INK-BLACK POLICY (materials3d D2-E, ratified): the relief is LIGHT-DRIVEN.
// The body stays the single warm-graphite ink at one value; the drawing reads
// purely through how light sits on the carved relief, never through any colour
// or value change. This file produces a GRAYSCALE height field only — it is
// never sampled as colour.
//
// CITATIONS (research trail, 2026-06-13):
//   · three.js MeshStandardMaterial.bumpMap / bumpScale / displacementMap docs
//     (github.com/mrdoob/three.js src/materials/MeshStandardMaterial.js).
//   · Canvas → bumpMap pipeline: josdirksen/learning-threejs ch.10
//     10-canvas-texture-bumpmap (CanvasTexture as a live bump source).
//   · Bas-relief = 2D image → compressed height field the light reveals
//     (Region-based bas-relief generation from a single image; Real-time
//     Generation of Digital Bas-Reliefs, CAD Journal 7(4) 2010).

import * as THREE from 'three';
import {
  WORLD_SCALE,
  poolCenter,
  type StrokeInputPoint,
  type ViewBoxSize,
} from '../../lib/geometry3d/strokeTo3d';

/** World-space planar window the relief texture is rasterized FOR. The scene
 *  rewrites the body's front-face UVs as a planar projection over this exact
 *  window so the texture aligns to the carved marks with no manual offset. */
export interface ReliefWindow {
  minX: number;
  minY: number;
  spanX: number;
  spanY: number;
}

export interface DrawingReliefResult {
  texture: THREE.CanvasTexture;
  window: ReliefWindow;
}

/** Offscreen raster resolution along the longest world axis. 1024 keeps fine
 *  multi-feature drawings (eyes/nose/smile) crisp without a heavy upload. */
const TEXTURE_LONG_EDGE = 1024;
/** Margin (fraction of the long span) of flat surface kept around the marks so
 *  the carving never runs off the slab edge and the silhouette ring (whose UVs
 *  land on this margin) samples pure white = flat. */
const RELIEF_MARGIN = 0.06;
/** Groove ink width in world units, slightly fatter than the 2D pen so the
 *  carved line reads at slab scale. */
const GROOVE_WORLD_WIDTH = 0.05;
/** Soft blur radius (fraction of long edge) — gives each groove a graded wall
 *  the light rolls across, so bump reads as a bevelled channel, not a 1px cliff
 *  (the gradient is what the normal-from-height step turns into shading). */
const GROOVE_BLUR_FRAC = 0.004;

/** Build the bas-relief height-field texture for a stroke pool, sized/placed to
 *  the geometry's WORLD-space front-face bounding box.
 *
 *  @param strokes  raw strokes in viewBox coords (same pool the geometry built
 *                  from) — y-down, [x,y] or [x,y,pressure].
 *  @param viewBox  source coordinate space.
 *  @param bbox     the body geometry's WORLD bounding box (min/max x/y). The
 *                  texture window is this bbox padded by RELIEF_MARGIN so the
 *                  carving sits inside the silhouette.
 *  Returns null for an empty pool / degenerate bbox (caller renders the plain
 *  body — byte-identical to no-relief).
 */
export function buildDrawingReliefTexture(
  strokes: StrokeInputPoint[][],
  viewBox: ViewBoxSize,
  bbox: { minX: number; maxX: number; minY: number; maxY: number },
): DrawingReliefResult | null {
  if (typeof document === 'undefined') return null; // SSR / non-DOM guard
  const pool = strokes.filter((s) => s.length > 0);
  if (pool.length === 0) return null;

  const rawSpanX = bbox.maxX - bbox.minX;
  const rawSpanY = bbox.maxY - bbox.minY;
  if (!(rawSpanX > 1e-6) || !(rawSpanY > 1e-6)) return null;

  // Pad the world window so the carving never touches the silhouette edge and
  // the side-wall UVs land on flat (white) margin.
  const longSpan = Math.max(rawSpanX, rawSpanY);
  const pad = longSpan * RELIEF_MARGIN;
  const win: ReliefWindow = {
    minX: bbox.minX - pad,
    minY: bbox.minY - pad,
    spanX: rawSpanX + pad * 2,
    spanY: rawSpanY + pad * 2,
  };

  // Canvas sized to the world window aspect, longest edge = TEXTURE_LONG_EDGE.
  const aspect = win.spanX / win.spanY;
  const longPx = TEXTURE_LONG_EDGE;
  const w = aspect >= 1 ? longPx : Math.max(8, Math.round(longPx * aspect));
  const h = aspect >= 1 ? Math.max(8, Math.round(longPx / aspect)) : longPx;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Flat surface level = WHITE (bumpMap: white = high / at-surface). Strokes are
  // carved BELOW it (darker = lower), so they read as engraved grooves.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);

  // World → canvas px. World y is up; canvas y is down → flip y so the relief
  // is not mirrored vs the drawing. The same center the geometry used keeps the
  // raster registered to the mass.
  const center = poolCenter(pool, viewBox);
  const sx = w / win.spanX;
  const sy = h / win.spanY;
  const toCanvas = (vx: number, vy: number): [number, number] => {
    // viewBox → world (matches normalizeStrokePoints exactly):
    const wx = (vx - center.x) * WORLD_SCALE;
    const wy = -(vy - center.y) * WORLD_SCALE;
    // world → canvas px (y flipped: world-up → canvas-down).
    const cx = (wx - win.minX) * sx;
    const cy = h - (wy - win.minY) * sy;
    return [cx, cy];
  };

  // Groove ink width in canvas px (world width × px-per-world). Carved channels
  // are drawn in BLACK so the height field bottoms out in the groove.
  const grooveWidthPx = Math.max(2, GROOVE_WORLD_WIDTH * ((sx + sy) / 2));
  ctx.strokeStyle = '#000000';
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.lineWidth = grooveWidthPx;

  for (const stroke of pool) {
    if (stroke.length === 1) {
      // Single-point stroke → a carved dot.
      const [cx, cy] = toCanvas(stroke[0][0], stroke[0][1]);
      ctx.beginPath();
      ctx.arc(cx, cy, grooveWidthPx / 2, 0, Math.PI * 2);
      ctx.fillStyle = '#000000';
      ctx.fill();
      continue;
    }
    ctx.beginPath();
    let started = false;
    for (const [vx, vy] of stroke) {
      if (!Number.isFinite(vx) || !Number.isFinite(vy)) continue;
      const [cx, cy] = toCanvas(vx, vy);
      if (!started) {
        ctx.moveTo(cx, cy);
        started = true;
      } else {
        ctx.lineTo(cx, cy);
      }
    }
    if (started) ctx.stroke();
  }

  // Soft the groove walls so bump reads as a bevelled channel (graded normal),
  // not a hard 1px cliff. CSS filter blur on a 2D context is supported in
  // browsers; guarded so a context without filter support still ships a crisp
  // (still valid) height field.
  try {
    if ('filter' in ctx) {
      const blurPx = Math.max(1, Math.round(longPx * GROOVE_BLUR_FRAC));
      const blurred = document.createElement('canvas');
      blurred.width = w;
      blurred.height = h;
      const bctx = blurred.getContext('2d');
      if (bctx) {
        (bctx as CanvasRenderingContext2D & { filter: string }).filter = `blur(${blurPx}px)`;
        bctx.drawImage(canvas, 0, 0);
        ctx.clearRect(0, 0, w, h);
        (ctx as CanvasRenderingContext2D & { filter: string }).filter = 'none';
        ctx.drawImage(blurred, 0, 0);
      }
    }
  } catch {
    // crisp height field is an acceptable fallback — no throw to the scene.
  }

  const texture = new THREE.CanvasTexture(canvas);
  // Height field, NOT colour — keep linear so the gradient the bump step reads
  // is the literal pixel value (no sRGB curve warping the slope).
  texture.colorSpace = THREE.NoColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 4;
  texture.needsUpdate = true;

  return { texture, window: win };
}

// ─── SVG-PORT — the real 2D styled render BECOMES the 3D surface ─────────────
// svg-port's contract (project_f3_shading_port_to_3d): port the ACTUAL
// SvgStyleTransform output onto the form — never a parallel shader (the killed
// hatchMaterial). Two hard parts (Sebs 2026-06-13): (1) feel FULLY 3D — the
// marks carved INTO the surface, wrapping on orbit; (2) RETAIN the 2D vibe —
// the hand-drawn hachure/ink, untouched by lighting.
//
// SHADING-INTERACTION (the crux Sebs flagged): the 2D shading is region-based
// source-darkness baked as CONTENT; the 3D rig adds a SECOND lambert tone →
// double-shading / wash-out. RESOLUTION: separate tone from dimensionality —
// the drawing rides EMISSIVE (unlit, value-exact, never re-shaded), while the
// carved RELIEF (displacement + Sobel normal) provides the 3D the light reveals.
// Head-on reads as the drawing; orbit reveals the carve = "became 3D, kept vibe."
//
// ONE raster, THREE registered channels (all over the SAME ReliefWindow so they
// co-locate via applyPlanarReliefUVs):
//   · emissiveMap  — the styled render (paper + ink), sRGB, the vibe.
//   · displacementMap — luminance of that render (paper bright = flat/high; ink
//     dark = recessed groove); real geometry on a tessellated cap.
//   · normalMap    — Sobel of the luminance; crisp groove walls so even head-on
//     the relief catches a hint of light without tessellation.

export interface SvgPortTextureResult {
  /** The styled 2D render (paper + ink), sRGB → emissiveMap. */
  emissive: THREE.CanvasTexture;
  /** Luminance height field (NoColorSpace) → displacementMap. */
  height: THREE.CanvasTexture;
  /** Sobel-derived tangent normal map (NoColorSpace) → normalMap. */
  normal: THREE.CanvasTexture;
  window: ReliefWindow;
}

/** Displacement depth (world units) for the carved svg-port relief — how far
 *  ink grooves sink below the paper surface. Pair with displacementBias =
 *  −RELIEF_DISPLACEMENT_SCALE so WHITE(paper)=at-surface, BLACK(ink)=recessed.
 *  Eyeball-tunable. 0.13→0.15 (craft pass 2): with the adaptive carve no longer
 *  flooding dense fills, a slightly deeper push reads as a real carved channel on
 *  orbit. 0.18 still tears THIN line-art on the single-step cap (faceting/dashing
 *  on hairlines), so the heavy lifting of the "engraved" READ rides the steep-
 *  wall normalMap (geometry-free, never tears); 0.15 is the deep-but-safe pair.
 *  Boldness variants: subtle 0.13 · medium 0.15 · bold 0.17. */
export const RELIEF_DISPLACEMENT_SCALE = 0.17;

// ── ADAPTIVE-CARVE constants (craft pass 2026-06-13) ────────────────────────
/** Min-filter half-width as a fraction of the long edge — the SPARSE-line
 *  fattener. 0.0045→0.006 (sparse-legibility pass 2026-06-13): a thin pen line
 *  on a near-white cap reads faint because the groove is too narrow to throw a
 *  shadow; a slightly wider fatten gives isolated hairlines a channel the rake
 *  catches, still below the dense-hachure spacing so it doesn't re-bridge fills. */
const GROOVE_FRAC = 0.007;
/** Neighborhood-luminance band that crossfades the carve from "fatten the
 *  groove" (open paper) to "keep the hachure grain, floor-lifted" (dense fill).
 *  Above DENSE_LO = sparse (full fatten); below DENSE_HI = dense (full grain).
 *  Tuned so a real hachure FILL (avg luminance ~0.4–0.6) lands inside the band. */
const DENSE_LO = 0.72;
const DENSE_HI = 0.42;
/** Darkest the carve may sink in a DENSE neighborhood (height 0=deepest…1=flat).
 *  A packed fill bottoms out at this dark-GREY value instead of pure black, so
 *  the displaced cap keeps a continuous wall the light rakes (texture), and the
 *  hachure stripe↔gap grain rides on top. The deep black is reserved for true
 *  isolated grooves where it reads as a crisp carved line, not a muddy pit.
 *  0.34→0.30 (sparse pass): a touch deeper so dense fills carve a little harder
 *  without flooding — verified still legible-not-black in the boldness board. */
const DENSE_FLOOR = 0.28;
/** Sobel normal z = 1/NORMAL_STRENGTH; LOWER = steeper groove walls = stronger
 *  carved read head-on. 0.85→0.6 (sparse pass): steeper walls so an isolated
 *  groove throws a bolder bright-edge/shadow-edge under the grazing key — the
 *  single biggest lever for "the marks read engraved head-on, not faint". */
const NORMAL_STRENGTH = 0.5;
/** Max bold-ink coverage — densest source ink lands at this grey, not pure ink,
 *  so emissive matches the floored carve (dark-grey, never flat black). 0.82→
 *  0.94 (sparse pass): the cap exists to stop a DENSE flood reading solid black;
 *  it was also needlessly weakening isolated marks. Raised here, and the SPARSE-
 *  INK-FLOOR below lifts isolated marks past it — dense stays grain, sparse goes
 *  near-ink. */
const BOLD_INK_MAX = 1.0;
/** SPARSE marks (low local density = isolated lines on open paper) get their ink
 *  coverage lifted to AT LEAST this, overriding BOLD_INK_MAX, so a thin face line
 *  reads as near-solid ink (the contrast that makes it legible) while a dense
 *  fill — where flooding-to-black is the risk — keeps the BOLD_INK_MAX cap and
 *  its stripe↔gap grain. This is the core sparse-faint fix: bold the lonely
 *  marks, cap the crowded ones. (0 = off → pure BOLD_INK_MAX everywhere.) */
const SPARSE_INK_FLOOR = 0.62;
/** Paper-substrate albedo dim (multiplies the paper fill of the emissive, NOT
 *  the ink). A near-white paper cap under the studio rig is GLOSSY-bright and
 *  washes shallow ink contrast (round-1 caveat). Dimming the paper to a warm
 *  mid-light grey restores the ink↔paper contrast frame so engraved marks pop —
 *  while the ink stays near-black, so the relief reads. 1 = no dim. */
const PAPER_DARKEN = 0.72;
/** AO / groove-shadow strength baked INTO the emissive. The carved relief has
 *  only a Sobel normal (no aoMap — that needs a 2nd UV channel we don't plumb);
 *  on a flat near-white cap the normal alone reads weak head-on. We darken the
 *  emissive in/around a groove proportional to how recessed it is, so every
 *  carved channel reads as a shadowed crevice even before the rake — the
 *  texture-space AO research lever. 0 = off. */
const AO_STRENGTH = 0.7;

/** Build the svg-port channel textures from the REAL styled SvgStyleTransform
 *  markup, registered to the geometry's world front-face window. ASYNC — the
 *  SVG is rasterized via an Image (decode()). Returns null on SSR / empty pool /
 *  degenerate bbox / load failure (caller falls back to the plain body).
 *
 *  @param svgString  serialized styled <svg> (SvgStyleTransform output) — MUST
 *                    be self-contained (no foreignObject / external http href)
 *                    or the canvas taints and the GL upload fails.
 *  @param strokes    the same pool the geometry built from (for poolCenter).
 *  @param viewBox    source coordinate space (matches the svg's viewBox).
 *  @param bbox       the body geometry's WORLD bounding box.
 *  @param opts.paperColor  resolved --dir-bg hex; filled under the marks so the
 *                    front reads as the drawing (paper + ink), not bare body.
 */
export async function buildSvgPortTexture(
  svgString: string,
  strokes: StrokeInputPoint[][],
  viewBox: ViewBoxSize,
  bbox: { minX: number; maxX: number; minY: number; maxY: number },
  opts?: { paperColor?: string },
): Promise<SvgPortTextureResult | null> {
  if (typeof document === 'undefined' || typeof Image === 'undefined') return null;
  const pool = strokes.filter((s) => s.length > 0);
  if (pool.length === 0 || !svgString) return null;

  // CALIBRATION-only tune (the catalog harness sets window.__svgPortCarveTune to
  // sweep the carve constants live without a rebuild; inert in the product where
  // the global is never set). Final values are the module constants above; the
  // lead applies those literals, not this hook.
  const ct =
    (typeof window !== 'undefined'
      ? (window as unknown as { __svgPortCarveTune?: Record<string, number> }).__svgPortCarveTune
      : undefined) ?? {};
  const denseFloor = ct.denseFloor ?? DENSE_FLOOR;
  const grooveFrac = ct.grooveFrac ?? GROOVE_FRAC;
  const boldMaxT = ct.boldMax ?? BOLD_INK_MAX;
  const normalStrengthT = ct.normalStrength ?? NORMAL_STRENGTH;
  // sparse-legibility levers (sparse pass 2026-06-13) — also tune-hook readable.
  const sparseInkFloorT = ct.sparseInkFloor ?? SPARSE_INK_FLOOR;
  const paperDarkenT = ct.paperDarken ?? PAPER_DARKEN;
  const aoStrengthT = ct.aoStrength ?? AO_STRENGTH;

  const rawSpanX = bbox.maxX - bbox.minX;
  const rawSpanY = bbox.maxY - bbox.minY;
  if (!(rawSpanX > 1e-6) || !(rawSpanY > 1e-6)) return null;

  // Same padded world window as the bas-relief raster (registration parity).
  const longSpan = Math.max(rawSpanX, rawSpanY);
  const pad = longSpan * RELIEF_MARGIN;
  const win: ReliefWindow = {
    minX: bbox.minX - pad,
    minY: bbox.minY - pad,
    spanX: rawSpanX + pad * 2,
    spanY: rawSpanY + pad * 2,
  };

  // Oversampled canvas (DPR-aware) so the vector marks stay crisp as a texture.
  const dpr = Math.min(typeof window === 'undefined' ? 1 : (window.devicePixelRatio || 1), 2);
  const aspect = win.spanX / win.spanY;
  const longPx = Math.round(TEXTURE_LONG_EDGE * dpr);
  const w = aspect >= 1 ? longPx : Math.max(8, Math.round(longPx * aspect));
  const h = aspect >= 1 ? Math.max(8, Math.round(longPx / aspect)) : longPx;

  // World window → SVG viewBox sub-rect (inverse of normalizeStrokePoints).
  // world x = (vx − center.x)·WORLD_SCALE ; world y = −(vy − center.y)·WORLD_SCALE
  // → vx = wx/WORLD_SCALE + center.x ; vy = center.y − wy/WORLD_SCALE. World y is
  // up, viewBox y is down, so the window's world-max-Y is the sub-rect's TOP.
  const center = poolCenter(pool, viewBox);
  const worldMaxY = win.minY + win.spanY;
  const vMinX = win.minX / WORLD_SCALE + center.x;
  const vMinY = center.y - worldMaxY / WORLD_SCALE;
  const vW = win.spanX / WORLD_SCALE;
  const vH = win.spanY / WORLD_SCALE;

  // Re-root the styled svg onto the sub-rect viewBox at the canvas pixel size.
  let doc: Document;
  try {
    doc = new DOMParser().parseFromString(svgString, 'image/svg+xml');
  } catch {
    return null;
  }
  const svgEl = doc.documentElement as unknown as SVGSVGElement;
  if (!svgEl || svgEl.tagName.toLowerCase() !== 'svg') return null;
  // Origin-clean guard: external refs / foreignObject taint the canvas → blank.
  if (svgEl.querySelector('foreignObject, image[href^="http"], image[*|href^="http"]')) {
    return null;
  }
  // CSS-VAR RESOLUTION (else the marks vanish → blank slab): the styled render
  // paints ink/paper with var(--dir-text-primary)/var(--dir-bg), which are
  // UNDEFINED in a detached SVG rasterized via a data-URL Image. Copy the page's
  // resolved --dir-* tokens (+ the wrapper's --f3-* vars) onto the svg root so
  // they cascade to every mark and var() resolves at raster time.
  // W1 fallbacks (verbatim src/styles/theme.css :root) — if the page's computed
  // --dir-* are EMPTY (cold mount / detached doc / a test harness with no
  // stylesheet), every styled mark paints with an unresolved var() and the
  // drawing VANISHES → a blank slab (the "svg-port reads faint/blank" class).
  // Seed each token with the real W1 value so the marks ALWAYS resolve to ink.
  const DIR_FALLBACK: Record<string, string> = {
    '--dir-text-primary': '#121110', '--dir-bg': '#FDFCF9',
    '--dir-text-secondary': '#5F5B54', '--dir-text-body': '#383632',
    '--dir-text-body-soft': '#797369', '--dir-accent': '#121110',
    '--dir-border': '#E3DFD4', '--dir-muted': '#EBE7DC', '--dir-detail': '#878075',
    '--dir-raised': '#F9F7F3', '--dir-recessed': '#F3F0E8',
    '--dir-link-color': '#121110', '--dir-chip-bg': 'transparent',
    '--dir-chip-border': '#E3DFD4',
  };
  {
    const rootStyle =
      typeof getComputedStyle !== 'undefined' ? getComputedStyle(document.documentElement) : null;
    let varStyle = '';
    for (const v of Object.keys(DIR_FALLBACK)) {
      const val = (rootStyle?.getPropertyValue(v).trim() || '') || DIR_FALLBACK[v];
      varStyle += `${v}:${val};`;
    }
    varStyle += '--f3-fill-opacity:1;--f3-stroke-width:1;';
    svgEl.setAttribute('style', `${varStyle}${svgEl.getAttribute('style') ?? ''}`);
  }
  svgEl.setAttribute('viewBox', `${vMinX} ${vMinY} ${vW} ${vH}`);
  svgEl.setAttribute('width', String(w));
  svgEl.setAttribute('height', String(h));
  svgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  const serialized = new XMLSerializer().serializeToString(svgEl);
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(serialized)}`;

  let img: HTMLImageElement;
  try {
    img = new Image();
    img.width = w;
    img.height = h;
    img.src = url;
    await img.decode();
  } catch {
    return null; // load/decode failure → caller renders plain body
  }

  // ── emissive: paper fill + the styled render = the drawing, value-exact ──
  const emCanvas = document.createElement('canvas');
  emCanvas.width = w;
  emCanvas.height = h;
  const emCtx = emCanvas.getContext('2d');
  if (!emCtx) return null;
  emCtx.fillStyle = opts?.paperColor ?? '#FDFCF9';
  emCtx.fillRect(0, 0, w, h);
  emCtx.drawImage(img, 0, 0, w, h);

  // ── height: luminance of the render (paper bright = flat; ink dark = groove) ──
  // Read once; build a grayscale ImageData and a Sobel normal in the same pass.
  let src: ImageData;
  try {
    src = emCtx.getImageData(0, 0, w, h); // throws if tainted (defensive)
  } catch {
    return null;
  }
  const lum = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const r = src.data[i * 4], g = src.data[i * 4 + 1], b = src.data[i * 4 + 2];
    lum[i] = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; // 0 ink … 1 paper
  }
  // ── CARVE channel — ADAPTIVE so DENSE fills read as carved TEXTURE, not a
  // flooded flat-black pit, while SPARSE thin lines still fatten into legible
  // grooves. (Craft pass 2026-06-13, Sebs: dense→"dark CARVED texture grooves
  // catching light, not flat black mud"; sparse→"crisp legible carved grooves".)
  //
  // ROOT BUG (texture-dump diagnosed): the old carve was a pure separable MIN-
  // filter over GROOVE_R. For sparse marks that helpfully fattens. But for dense
  // hachure (line spacing ≈ GROOVE_R) the min-filter floods every gap → the whole
  // region collapses to the single darkest value = a FLAT-bottomed pit. No height
  // variation → displacement makes a flat recessed slab, the Sobel normal is
  // uniform → the raking light catches nothing → flat black mud (pitchDeckCover
  // measured spread=4). The hachure gaps the eye reads as texture were erased.
  //
  // FIX — three pieces, all derived from the SAME source luminance:
  //   1. minF  = separable min-filter (the fattener) over GROOVE_R, but SMALLER
  //      now (0.008→0.0045) so it widens hairlines without bridging dense lines.
  //   2. density = local box-average of lum over a wider radius (0 = dark/dense
  //      neighborhood … 1 = paper). Tells dense regions apart from sparse marks.
  //   3. carve = the FATTENED groove in SPARSE areas, but in DENSE areas we keep
  //      the RAW per-pixel luminance (preserves the hachure stripe↔gap structure
  //      = the texture the light catches) AND lift it off the black floor by
  //      DENSE_FLOOR so a dense fill becomes dark-GREY carved texture, never pure
  //      black. The fatten→raw crossover is driven by `density`, so a hairline in
  //      open paper gets the full deep groove while a dense field keeps its grain.
  const GROOVE_R = Math.max(2, Math.round(longPx * grooveFrac));
  // Density radius — a few groove-widths so it averages OVER the hachure spacing
  // (reads "this neighborhood is a fill", not "this is one line").
  const DENS_R = Math.max(4, Math.round(longPx * 0.018));
  const carveAndDensity = (() => {
    // (1) separable min-filter → minF (the fattened-groove field).
    const tmp = new Float32Array(w * h);
    for (let y = 0; y < h; y++) {
      const row = y * w;
      for (let x = 0; x < w; x++) {
        let m = 1;
        for (let dx = -GROOVE_R; dx <= GROOVE_R; dx++) {
          const xx = x + dx < 0 ? 0 : x + dx >= w ? w - 1 : x + dx;
          const v = lum[row + xx];
          if (v < m) m = v;
        }
        tmp[row + x] = m;
      }
    }
    const minF = new Float32Array(w * h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let m = 1;
        for (let dy = -GROOVE_R; dy <= GROOVE_R; dy++) {
          const yy = y + dy < 0 ? 0 : y + dy >= h ? h - 1 : y + dy;
          const v = tmp[yy * w + x];
          if (v < m) m = v;
        }
        minF[y * w + x] = m;
      }
    }
    // (2) separable box-average of lum over DENS_R → density (running-sum, O(n)).
    const colAvg = new Float32Array(w * h);
    for (let x = 0; x < w; x++) {
      let acc = 0;
      const win = DENS_R * 2 + 1;
      for (let dy = -DENS_R; dy <= DENS_R; dy++) {
        const yy = dy < 0 ? 0 : dy >= h ? h - 1 : dy;
        acc += lum[yy * w + x];
      }
      colAvg[x] = acc / win;
      for (let y = 1; y < h; y++) {
        const add = (y + DENS_R < h ? y + DENS_R : h - 1) * w + x;
        const sub = (y - DENS_R - 1 >= 0 ? y - DENS_R - 1 : 0) * w + x;
        acc += lum[add] - lum[sub];
        colAvg[y * w + x] = acc / win;
      }
    }
    const density = new Float32Array(w * h);
    for (let y = 0; y < h; y++) {
      const row = y * w;
      let acc = 0;
      const win = DENS_R * 2 + 1;
      for (let dx = -DENS_R; dx <= DENS_R; dx++) {
        const xx = dx < 0 ? 0 : dx >= w ? w - 1 : dx;
        acc += colAvg[row + xx];
      }
      density[row] = acc / win;
      for (let x = 1; x < w; x++) {
        const add = row + (x + DENS_R < w ? x + DENS_R : w - 1);
        const sub = row + (x - DENS_R - 1 >= 0 ? x - DENS_R - 1 : 0);
        acc += colAvg[add] - colAvg[sub];
        density[row + x] = acc / win;
      }
    }
    // (3) combine. denseW: 0 in open paper (use the deep fattened groove) → 1 in a
    // dense fill (use the raw hachure grain, floor-lifted). Smoothstep over the
    // band [DENSE_LO, DENSE_HI] of neighborhood luminance.
    const out = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) {
      const d = density[i];
      let t = (DENSE_LO - d) / (DENSE_LO - DENSE_HI); // d<HI→1 (dense), d>LO→0
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      const denseW = t * t * (3 - 2 * t); // smoothstep
      // Dense path: raw luminance grain, lifted off the floor so the darkest a
      // packed fill can carve is DENSE_FLOOR (dark-grey, not 0=black). The
      // stripe↔gap variation rides on top → real catch-the-light texture.
      const denseCarve = denseFloor + lum[i] * (1 - denseFloor);
      // Sparse path: the deep fattened groove (hairlines read as bold channels).
      out[i] = minF[i] * (1 - denseW) + denseCarve * denseW;
    }
    // Return density too — the bold-ink pass uses it to lift ISOLATED marks past
    // the dense cap (SPARSE_INK_FLOOR) so sparse line-art reads near-ink.
    return { carve: out, density };
  })();
  const carve = carveAndDensity.carve;
  const density = carveAndDensity.density;

  // ── BOLD INK (2026-06-13, craft pass 2): thin pen lines anti-alias to faint
  // gray at texture scale → the drawing reads washed-out on the 3D form. We bold
  // up the ink — BUT driven by the PER-PIXEL source luminance (`lum`), NOT the
  // fattened `carve`. The old version painted solid ink wherever `carve` was dark;
  // since the min-filter flooded dense fills, that turned every dense hachure into
  // a solid black slab in the emissive (the muddy-black read). Using `lum` keeps
  // the hachure STRIPE↔GAP grain: dark ink pixels go bold, the paper gaps between
  // stay paper → a dense fill reads as crisp dark hatching, not a flat mass. We
  // also stop short of pure ink (BOLD_MAX) so the darkest fills stay dark-grey,
  // matching the floored carve, so emissive and relief tell the same story. ──
  const inkRgb = (() => {
    try {
      const c = document.createElement('canvas'); c.width = 1; c.height = 1;
      const x = c.getContext('2d'); if (!x) return { r: 42, g: 38, b: 34 };
      const css = (typeof getComputedStyle !== 'undefined'
        ? getComputedStyle(document.documentElement).getPropertyValue('--dir-text-primary').trim()
        : '') || '#2A2622';
      x.fillStyle = '#000'; x.fillStyle = css; x.fillRect(0, 0, 1, 1);
      const d = x.getImageData(0, 0, 1, 1).data;
      return { r: d[0], g: d[1], b: d[2] };
    } catch { return { r: 42, g: 38, b: 34 }; }
  })();
  // SPARSE-INK-FLOOR + PAPER-DARKEN + AO (sparse-legibility pass 2026-06-13).
  // The crux of "sparse line-art reads faint on a glossy white cap" is CONTRAST:
  //   · sparse ink was capped at BOLD_INK_MAX (an anti-flood device meant for
  //     DENSE fills) so isolated marks never reached deep ink → faint;
  //   · the near-white paper substrate, lit bright by the studio rig, washed out
  //     what little ink contrast remained (round-1 caveat: "glossy white cap");
  //   · the shallow carve had only a Sobel normal — weak head-on on a flat cap.
  // Fix, all per-pixel from the same source luminance + density + carve fields:
  //   1. SPARSE marks (high local density = open paper) get their bold cap lifted
  //      from BOLD_INK_MAX toward 1.0 (≥ SPARSE_INK_FLOOR coverage) so a lonely
  //      face line goes near-solid ink. DENSE fills keep BOLD_INK_MAX + grain.
  //   2. PAPER side (non-ink) is dimmed by PAPER_DARKEN so the substrate reads a
  //      warm mid-light grey, not glossy white — restoring the ink↔paper frame.
  //   3. AO: every pixel is darkened proportional to how RECESSED its carve is
  //      (groove shadow baked in), so each channel reads as a shadowed crevice
  //      even before the grazing rake — the texture-space AO research lever.
  const BOLD_MAX = boldMaxT; // dense-fill cap (densest crowded ink stays dark-grey)
  for (let i = 0; i < w * h; i++) {
    const o = i * 4;
    // (1) ink coverage from the SOURCE pixel (preserves gaps): 1 at an ink core
    // (lum≈0), 0 at paper (lum≥INK_EDGE). Per-pixel → dense hachure keeps grain.
    const INK_EDGE = 0.66;
    let covRaw = (INK_EDGE - lum[i]) / INK_EDGE;
    covRaw = covRaw < 0 ? 0 : covRaw > 1 ? 1 : covRaw;
    // sparseness: density 1 = open paper (isolated mark) → 0 = dense fill. The
    // bold cap for THIS pixel slides from BOLD_MAX (dense) up to max(BOLD_MAX,
    // SPARSE_INK_FLOOR-scaled-to-1) for an isolated mark, so sparse goes near-ink.
    const sparseness = density[i] < 0 ? 0 : density[i] > 1 ? 1 : density[i];
    const sparseCap = Math.max(BOLD_MAX, sparseInkFloorT + (1 - sparseInkFloorT) * sparseness);
    const cov = covRaw * sparseCap;
    if (cov > 0) {
      src.data[o]     = Math.round(src.data[o]     * (1 - cov) + inkRgb.r * cov);
      src.data[o + 1] = Math.round(src.data[o + 1] * (1 - cov) + inkRgb.g * cov);
      src.data[o + 2] = Math.round(src.data[o + 2] * (1 - cov) + inkRgb.b * cov);
    }
    // (2) PAPER-DARKEN — dim the paper substrate, but NOT the ink (covRaw gates
    // it). paperW = 1 on bare paper → 0 at an ink core, so ink stays deep and the
    // surrounding paper drops to a warm mid grey (contrast frame restored).
    const paperW = 1 - covRaw;
    const paperMul = 1 - (1 - paperDarkenT) * paperW;
    // (3) AO groove-shadow — darken by how recessed the carve is here (carve 1 =
    // flat surface → no AO; carve 0 = deepest groove → full AO). Applies to ink
    // AND the paper immediately around a groove, so the channel reads shadowed.
    const aoMul = 1 - aoStrengthT * (1 - carve[i]);
    const mul = paperMul * aoMul;
    if (mul < 1) {
      src.data[o]     = Math.round(src.data[o]     * mul);
      src.data[o + 1] = Math.round(src.data[o + 1] * mul);
      src.data[o + 2] = Math.round(src.data[o + 2] * mul);
    }
  }
  emCtx.putImageData(src, 0, 0); // emissive now carries the BOLD inked drawing

  const htCanvas = document.createElement('canvas');
  htCanvas.width = w;
  htCanvas.height = h;
  const htCtx = htCanvas.getContext('2d');
  if (!htCtx) return null;
  const htData = htCtx.createImageData(w, h);
  for (let i = 0; i < w * h; i++) {
    const v = Math.round(carve[i] * 255);
    htData.data[i * 4] = v; htData.data[i * 4 + 1] = v; htData.data[i * 4 + 2] = v; htData.data[i * 4 + 3] = 255;
  }
  htCtx.putImageData(htData, 0, 0);

  // ── normal: 3×3 Sobel over the CARVE field → tangent-space normal (RGB) ──
  // Groove walls (the fattened gradient) become surface tilt the key light rakes.
  // STEEPER walls 1.4→0.85 (deep-carve pass): lower nz tilts the groove-wall
  // normals harder away from the surface, so the raking key catches a bold
  // bright-edge / shadow-edge on every channel — the carve reads even head-on,
  // before any orbit. (Paired with the higher material normalScale below.)
  const normalStrength = normalStrengthT; // lower = steeper walls = stronger carved read (module const / tune)
  const nmCanvas = document.createElement('canvas');
  nmCanvas.width = w;
  nmCanvas.height = h;
  const nmCtx = nmCanvas.getContext('2d');
  if (!nmCtx) return null;
  const nmData = nmCtx.createImageData(w, h);
  const at = (x: number, y: number) => carve[Math.min(h - 1, Math.max(0, y)) * w + Math.min(w - 1, Math.max(0, x))];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const tl = at(x - 1, y - 1), t = at(x, y - 1), tr = at(x + 1, y - 1);
      const l = at(x - 1, y), r = at(x + 1, y);
      const bl = at(x - 1, y + 1), bb = at(x, y + 1), br = at(x + 1, y + 1);
      const dx = (tr + 2 * r + br) - (tl + 2 * l + bl);
      const dy = (bl + 2 * bb + br) - (tl + 2 * t + tr);
      // height ∝ luminance (paper high), so a groove (dark) dips → invert grad.
      let nx = -dx, ny = -dy, nz = 1 / normalStrength;
      const len = Math.hypot(nx, ny, nz) || 1;
      nx /= len; ny /= len; nz /= len;
      const i = (y * w + x) * 4;
      nmData.data[i] = Math.round((nx * 0.5 + 0.5) * 255);
      nmData.data[i + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      nmData.data[i + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      nmData.data[i + 3] = 255;
    }
  }
  nmCtx.putImageData(nmData, 0, 0);

  const mk = (canvas: HTMLCanvasElement, srgb: boolean): THREE.CanvasTexture => {
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.wrapS = THREE.ClampToEdgeWrapping;
    t.wrapT = THREE.ClampToEdgeWrapping;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.magFilter = THREE.LinearFilter;
    t.generateMipmaps = true;
    t.anisotropy = 8;
    t.needsUpdate = true;
    return t;
  };

  return {
    emissive: mk(emCanvas, true),
    height: mk(htCanvas, false),
    normal: mk(nmCanvas, false),
    window: win,
  };
}

/** Rewrite a body geometry's UV attribute as a PLANAR projection from world xy
 *  over the relief window, so the bas-relief texture aligns to the carved marks
 *  on the FRONT FACE with zero manual offset.
 *
 *  ExtrudeGeometry's default WorldUVGenerator emits front/back-face UVs as raw
 *  world (x,y) and side-wall UVs along the perimeter — neither maps to a 0..1
 *  drawing window. We overwrite ALL vertices with u=(x−minX)/spanX,
 *  v=(y−minY)/spanY: the front cap gets the registered drawing; the silhouette
 *  walls/back (whose xy sits on the mass boundary, inside the white margin)
 *  sample white = flat → relief appears only where the marks are. World y is
 *  up = texture v up, matching the y-flip baked into the raster.
 *
 *  Pure side-effect on the geometry's uv buffer; returns nothing. Idempotent
 *  for a given window (recomputes from position each call). */
export function applyPlanarReliefUVs(
  geometry: THREE.BufferGeometry,
  win: ReliefWindow,
): void {
  const pos = geometry.getAttribute('position');
  if (!pos) return;
  const count = pos.count;
  const uv = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    uv[i * 2] = (x - win.minX) / win.spanX;
    uv[i * 2 + 1] = (y - win.minY) / win.spanY;
  }
  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  (geometry.getAttribute('uv') as THREE.BufferAttribute).needsUpdate = true;
}

/** bumpScale for the relief — how hard the carved grooves catch the light.
 *  RAISED 0.9→2.2 (deep-carve pass, Sebs "native shouldn't bury the drawing in
 *  a featureless dark blob"): on the dark single-ink body the old 0.9 bump was
 *  near-invisible under the high studio key. A much stronger perturbation +
 *  the native grazing key (Stroke3DScene) make the carved drawing catch a bold
 *  highlight/shadow on every groove wall — the drawing READS on the slab, while
 *  the body stays one ink value (relief is light-driven, never colour). */
export const RELIEF_BUMP_SCALE = 2.2;
