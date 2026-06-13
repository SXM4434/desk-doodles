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
 *  Tuned so the marks read as pressed-in ink under the studio key without the
 *  body looking noisy. Exported so the harness clone uses the SAME value. */
export const RELIEF_BUMP_SCALE = 0.9;
