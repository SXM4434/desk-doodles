// CATALOG VISUAL 3D SWEEP harness (see catalog-visual-3d.html). Repo tool only
// — NOT in the Make drag-drop, NOT wired into the app. READ-ONLY diagnosis:
// imports + renders the EXACT product code, never edits src.
//
// THE POINT: the VISUAL 3D render sweep the geometry gauntlet deliberately
// deferred. For every one of the 197 audit catalog shapes (deduped exactly like
// /audit + catalog-geometry-sweep) this harness renders, reading PIXELS:
//   · CLEAN — the source SVG as drawn (PinShape/PegToolShape rasterized to a
//     canvas) = the faithful ground-truth render every 3D state is compared to.
//   · 3D NATIVE — all 6 material presets (ink/softGel/matteClay/glossyPlastic/
//     rubber/signal) at 2 orbit angles (confirm ink-black on flat slabs).
//   · 3D HATCH — grammar (hachure/cross-hatch/stipple/contour) × direction
//     (fixed/light) × gap/angle/strokeWidth/ink swept LOW/MID/HIGH.
//   · 3D SVG-PORT — the ported 2D treatment (EdgesGeometry ink outline).
//   · PER-MODE PROPERTY TOGGLES — rod (radius/caps/joint), extrude (width/
//     depth/bevel/wall), inflate (base/tip/pressure/puff), solid (ink/depth/
//     holes) each LOW/MID/HIGH.
//
// It mounts the EXACT product render path (StudioRig + createNativeMaterial +
// createHatchMaterial + buildStrokeWithParams + buildPoolSolidGeometry +
// updateHatchUniforms + rodAdornmentSpecs + EdgesGeometry outline + inverted-
// hull Native outline) — a faithful clone of Stroke3DScene's StrokeMeshes, with
// a deterministic framing camera + preserveDrawingBuffer so toDataURL works.
//
// Driven headless by tools/3d/catalog-visual-3d.mjs through window.__vis.
// Deterministic: fixed orbit angles, fixed slider levels, no randomness.

import { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  StudioRig,
  createNativeMaterial,
  buildStrokeWithParams,
} from '../../src/app/components/canvas3d/Stroke3DScene';
import {
  buildPoolSolidGeometry,
  poolCenter,
  type GeometryModeSetting,
  type StrokeGeometryResult,
  type StrokeInputPoint,
  type ViewBoxSize,
} from '../../src/app/lib/geometry3d/strokeTo3d';
import {
  DEFAULT_MODE3D_PARAMS,
  type Mode3DParams,
} from '../../src/app/components/canvas3d/modeParams';
import {
  INK_3D_DEFAULT,
  DEFAULT_NATIVE_PROPS_3D,
  MODE_MATERIAL_DEFAULTS_3D,
  type MaterialPresetId,
  type NativeProps3D,
} from '../../src/app/components/canvas3d/materials3d';
import {
  createHatchMaterial,
  updateHatchUniforms,
  updateHatchLightDir,
  type HatchInputs,
  type HatchGrammar,
  type HatchDirection,
} from '../../src/app/components/canvas3d/hatchMaterial';
import { rodAdornmentSpecs, type RodAdornmentSpec } from '../../src/app/components/canvas3d/rodAdornments';
import {
  buildDrawingReliefTexture,
  buildSvgPortTexture,
  applyPlanarReliefUVs,
  RELIEF_BUMP_SCALE,
  RELIEF_DISPLACEMENT_SCALE,
  type SvgPortTextureResult,
} from '../../src/app/components/canvas3d/drawingTexture';
// Subdivides the boundary-only Earcut cap so displacementMap has interior
// vertices to carve — EXACT product import (Stroke3DScene line 9).
import { TessellateModifier } from 'three/examples/jsm/modifiers/TessellateModifier.js';
import { PinShape } from '../../src/app/lib/items/PinShape';
import { PegToolShape } from '../../src/app/lib/items/PegToolShape';
// The REAL 2D style pipeline + its contexts — so svg-port renders the EXACT
// styled SvgStyleTransform output (project_f3_shading_port_to_3d), not the dead
// hatch-shader stopgap. The harness wraps the catalog shape in the providers,
// renders SvgStyleTransform, captures its onRender markup = the vibe target.
import { SvgStyleTransform } from '../../src/app/components/canvas/SvgStyleTransform';
import { F3RoughModifiersProvider } from '../../src/app/state/F3RoughModifiersContext';
import { F3SvgStyleProvider } from '../../src/app/state/F3SvgStyleContext';
import {
  F3_PEGBOARD_SUBJECTS,
  F3_TROPHY_WALL_SUBJECTS,
  type F3PegboardShapeId,
  type F3TrophyWallShapeId,
} from '../../src/app/lib/items/identitySet';

// ─── Inventory (EXACT 197 dedupe — same as /audit + catalog-geometry-sweep) ──

interface SweepShape {
  kind: 'trophy' | 'pegboard';
  shape: string;
  label: string;
  subjectId: string;
}

function flattenInventory(): SweepShape[] {
  const seenTrophy = new Set<string>();
  const seenPeg = new Set<string>();
  const out: SweepShape[] = [];
  for (const subj of F3_TROPHY_WALL_SUBJECTS) {
    for (const form of subj.forms) {
      if (seenTrophy.has(form.shape)) continue;
      seenTrophy.add(form.shape);
      out.push({ kind: 'trophy', shape: form.shape, label: form.label, subjectId: subj.id });
    }
  }
  for (const subj of F3_PEGBOARD_SUBJECTS) {
    for (const form of subj.forms) {
      if (seenPeg.has(form.shape)) continue;
      seenPeg.add(form.shape);
      out.push({ kind: 'pegboard', shape: form.shape, label: form.label, subjectId: subj.id });
    }
  }
  return out;
}

const INVENTORY = flattenInventory();

// ─── SVG → stroke sampling (verbatim from catalog-geometry-sweep) ────────────

const SCENE_VIEWBOX: ViewBoxSize = { w: 800, h: 600 };
const FIT_MARGIN = 0.08;
const SAMPLE_SPACING = 2.5;
const MIN_SAMPLES = 8;
const MAX_SAMPLES = 160;
const MAX_STROKES = 60; // mirrors Stroke3DScene MAX_STROKES_3D
const PAPER = '#FDFCF9';
const PAPER_RGB = [253, 252, 249] as const;

const samplerHost = document.getElementById('sampler')!;
const cleanBox = document.getElementById('cleanbox')!;
const statusEl = document.getElementById('status')!;
// Offscreen host for the SvgStyleTransform render (needs live DOM for getBBox/
// getComputedStyle — it CANNOT be renderToStaticMarkup). Hidden far offscreen
// like the sampler so it never paints over the GL stage.
const svgPortHost = (() => {
  let el = document.getElementById('svgport-host');
  if (!el) {
    el = document.createElement('div');
    el.id = 'svgport-host';
    el.style.cssText = 'position:fixed;right:-99999px;top:0;width:800px;height:600px;';
    document.body.appendChild(el);
  }
  return el;
})();
let samplerRoot: Root | null = null;
let cleanRoot: Root | null = null;
let svgPortRoot: Root | null = null;

function nextFrame(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

interface SampleResult {
  strokes: StrokeInputPoint[][];
  sampledElements: number;
  /** Serialized styled <svg> from the REAL SvgStyleTransform (default style =
   *  rough-handdrawn, the engine signature) — the svg-port markup the product
   *  rasterizes (project_f3_shading_port_to_3d). null on capture failure. */
  svgPortMarkup: string | null;
}

/** Mount the catalog shape inside the REAL F3 providers + SvgStyleTransform, let
 *  its onRender seam hand back the serialized styled <svg>. This is the same
 *  markup DeskDoodlesCanvas feeds the 3D scene — so the harness svg-port wears
 *  the EXACT 2D vibe, not a reimplementation. Resolves on the first onRender. */
function captureSvgPortMarkup(cell: SweepShape): Promise<string | null> {
  return new Promise((resolve) => {
    if (!svgPortRoot) svgPortRoot = createRoot(svgPortHost);
    let settled = false;
    const done = (m: string | null) => { if (!settled) { settled = true; resolve(m); } };
    // Safety timeout: if onRender never fires (style pass error), resolve null
    // so the sweep falls back to the plain lit body instead of hanging.
    const t = setTimeout(() => done(null), 1500);
    flushSync(() => {
      svgPortRoot!.render(
        <F3RoughModifiersProvider>
          <F3SvgStyleProvider>
            <SvgStyleTransform
              onRender={(s) => { clearTimeout(t); done(s); }}
            >
              {cell.kind === 'trophy' ? (
                <PinShape shape={cell.shape as F3TrophyWallShapeId} />
              ) : (
                <PegToolShape shape={cell.shape as F3PegboardShapeId} />
              )}
            </SvgStyleTransform>
          </F3SvgStyleProvider>
        </F3RoughModifiersProvider>,
      );
    });
  });
}

async function sampleShape(cell: SweepShape): Promise<SampleResult> {
  if (!samplerRoot) samplerRoot = createRoot(samplerHost);
  flushSync(() => {
    samplerRoot!.render(
      cell.kind === 'trophy' ? (
        <PinShape shape={cell.shape as F3TrophyWallShapeId} />
      ) : (
        <PegToolShape shape={cell.shape as F3PegboardShapeId} />
      ),
    );
  });
  await nextFrame();

  // Capture the styled svg-port markup in parallel (real SvgStyleTransform).
  const svgPortMarkup = await captureSvgPortMarkup(cell);

  const svg = samplerHost.querySelector('svg');
  if (!svg) return { strokes: [], sampledElements: 0, svgPortMarkup };

  const geomEls = Array.from(
    svg.querySelectorAll<SVGGeometryElement>('path, rect, circle, ellipse, line, polyline, polygon'),
  );

  const rawStrokes: Array<{ pts: Array<[number, number]>; len: number }> = [];
  for (const el of geomEls) {
    let len = 0;
    try {
      len = el.getTotalLength();
    } catch {
      continue;
    }
    if (!Number.isFinite(len) || len <= 0) continue;
    const m = el.getCTM();
    const n = Math.min(Math.max(Math.ceil(len / SAMPLE_SPACING), MIN_SAMPLES), MAX_SAMPLES);
    const pts: Array<[number, number]> = [];
    for (let i = 0; i <= n; i++) {
      const p = el.getPointAtLength((i / n) * len);
      if (m) {
        const t = new DOMPoint(p.x, p.y).matrixTransform(m);
        pts.push([t.x, t.y]);
      } else {
        pts.push([p.x, p.y]);
      }
    }
    rawStrokes.push({ pts, len });
  }

  rawStrokes.sort((a, b) => b.len - a.len);
  const kept = rawStrokes.slice(0, MAX_STROKES);

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const s of kept) {
    for (const [x, y] of s.pts) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (!Number.isFinite(minX) || maxX - minX < 1e-9 || maxY - minY < 1e-9) {
    return { strokes: [], sampledElements: 0, svgPortMarkup };
  }
  const spanX = maxX - minX;
  const spanY = maxY - minY;
  const scale = Math.min(
    (SCENE_VIEWBOX.w * (1 - 2 * FIT_MARGIN)) / spanX,
    (SCENE_VIEWBOX.h * (1 - 2 * FIT_MARGIN)) / spanY,
  );
  const offX = (SCENE_VIEWBOX.w - spanX * scale) / 2;
  const offY = (SCENE_VIEWBOX.h - spanY * scale) / 2;
  const strokes = kept.map((s) =>
    s.pts.map(([x, y]): StrokeInputPoint => [(x - minX) * scale + offX, (y - minY) * scale + offY]),
  );

  // CO-REGISTER the styled markup to the SAME 800×600 fit space the strokes
  // were placed in. The markup is in the catalog svg's NATURAL user-coords
  // (e.g. 0..100); the strokes (and thus the 3D geometry) live in the re-fit
  // 800×600 SCENE_VIEWBOX. buildSvgPortTexture maps world→viewBox assuming the
  // markup's viewBox === the stroke viewBox, so we re-root the markup: viewBox
  // 0 0 800 600 with the children wrapped in the exact fit transform
  // (x' = (x−minX)·scale + offX). Without this the ported render lands in the
  // wrong sub-rect and the carve reads as noise / blank.
  const fittedMarkup = svgPortMarkup
    ? refitMarkupToScene(svgPortMarkup, { minX, minY, scale, offX, offY })
    : null;

  return { strokes, sampledElements: strokes.length, svgPortMarkup: fittedMarkup };
}

/** Re-root a styled <svg> into the 800×600 SCENE_VIEWBOX, applying the SAME
 *  bbox-fit transform the strokes received so the ported texture co-registers
 *  with the 3D geometry. Pure string→string (DOM-parsed). */
function refitMarkupToScene(
  markup: string,
  fit: { minX: number; minY: number; scale: number; offX: number; offY: number },
): string | null {
  try {
    const doc = new DOMParser().parseFromString(markup, 'image/svg+xml');
    const svg = doc.documentElement as unknown as SVGSVGElement;
    if (!svg || svg.tagName.toLowerCase() !== 'svg') return markup;
    // Wrap all existing children in a <g> carrying the fit transform.
    const g = doc.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute(
      'transform',
      `translate(${fit.offX} ${fit.offY}) scale(${fit.scale}) translate(${-fit.minX} ${-fit.minY})`,
    );
    while (svg.firstChild) g.appendChild(svg.firstChild);
    svg.appendChild(g);
    svg.setAttribute('viewBox', `0 0 ${SCENE_VIEWBOX.w} ${SCENE_VIEWBOX.h}`);
    svg.setAttribute('width', String(SCENE_VIEWBOX.w));
    svg.setAttribute('height', String(SCENE_VIEWBOX.h));
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    return new XMLSerializer().serializeToString(svg);
  } catch {
    return markup;
  }
}

// ─── CLEAN ground-truth render (the source SVG as drawn) ─────────────────────
// The Clean style = "Source SVG as drawn. Crisp vectors." The window API's
// renderClean() rasterizes the captured currentCleanMarkup (the catalog
// component's own <svg> outerHTML) onto a paper canvas — this IS the faithful
// baseline every 3D state is compared against.

// ─── 3D render state vocabulary ──────────────────────────────────────────────

export interface VisState {
  geometryMode: GeometryModeSetting;
  style3d: 'native' | 'hatch' | 'svg-port';
  materialPreset?: MaterialPresetId;
  nativeProps?: Partial<NativeProps3D>;
  modeParams?: Mode3DParams;
  hatchInputs?: HatchInputs;
  hatchGrammar?: HatchGrammar;
  hatchDirection?: HatchDirection;
  /** svg-port ONLY: the serialized styled <svg> (real SvgStyleTransform output,
   *  re-fit to the 800×600 scene). Drives the carved relief — the form WEARS
   *  the 2D render (project_f3_shading_port_to_3d). Absent → plain lit body. */
  svgPortMarkup?: string;
  angleDeg: number;
  elevDeg: number;
  /** VERIFY-ONLY A/B flag (not a product code path): when true the Solid/Extrude
   *  body renders the OLD raised-tube face-ink overlay (the "lazy lines on top"
   *  stopgap) INSTEAD of the new carved bas-relief bumpMap — so a single dist
   *  produces the before/after board. Default false = the shipped relief. */
  legacyTubes?: boolean;
}

// ─── Framing camera ──────────────────────────────────────────────────────────

// Framing constants — kept distinct from the product's FRAME_K (the product
// uses a fixed FRAME_DIR 3/4; this harness orbits arbitrary angles). The
// FOV-aware fit logic below MIRRORS Stroke3DScene CameraFramer's RC-4(b) fix so
// the verification reflects the product behavior, not a more-forgiving tool.
const FRAME_K = 2.6;
const FRAME_MIN_RADIUS = 1.0;
const FRAME_FIT_MARGIN = 1.18;

interface Bounds {
  center: THREE.Vector3;
  radius: number;
  size: THREE.Vector3;
}

function OrbitCamera({ angleDeg, elevDeg, bounds }: { angleDeg: number; elevDeg: number; bounds: Bounds | null }) {
  const camera = useThree((s) => s.camera);
  const vp = useThree((s) => s.size);
  useEffect(() => {
    if (!bounds) return;
    const th = (angleDeg * Math.PI) / 180;
    const el = (elevDeg * Math.PI) / 180;
    const dir = new THREE.Vector3(
      Math.sin(th) * Math.cos(el),
      Math.sin(el),
      Math.cos(th) * Math.cos(el),
    );
    const radius = Math.max(bounds.radius, FRAME_MIN_RADIUS);
    let dist = radius * FRAME_K;
    const persp = camera as THREE.PerspectiveCamera;
    if (persp.isPerspectiveCamera) {
      const vFov = (persp.fov * Math.PI) / 180;
      const aspect = persp.aspect || (vp.height > 0 ? vp.width / vp.height : 1);
      const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
      const halfH = (bounds.size.y + bounds.size.z * 0.6) * 0.5 * FRAME_FIT_MARGIN;
      const halfW = (bounds.size.x + bounds.size.z * 0.6) * 0.5 * FRAME_FIT_MARGIN;
      dist = Math.max(dist, halfH / Math.tan(vFov / 2), halfW / Math.tan(hFov / 2));
    }
    camera.position.copy(bounds.center).addScaledVector(dir, dist);
    camera.lookAt(bounds.center);
    camera.updateProjectionMatrix();
  }, [camera, angleDeg, elevDeg, bounds, vp]);
  return null;
}

// ─── Hatch uniform + per-frame light sync (mirrors the product scene) ────────

function HatchSync({
  material,
  variant,
  inputs,
  grammar,
  direction,
}: {
  material: THREE.ShaderMaterial;
  variant: 'hatch' | 'svg-port';
  inputs: HatchInputs;
  grammar: HatchGrammar;
  direction: HatchDirection;
}) {
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    updateHatchUniforms(
      material,
      variant,
      { ...inputs, grammar, direction },
      INK_3D_DEFAULT,
      PAPER,
      gl.getPixelRatio(),
    );
  });
  useFrame(() => {
    updateHatchLightDir(material, camera.matrixWorldInverse);
  });
  return null;
}

// ─── Scene content — faithful clone of Stroke3DScene StrokeMeshes ────────────

const SPHERE_SEGMENTS = 14;

// Driver-observable readiness flag for the async svg-port texture: render3d
// polls this so it captures the carved cap, not the pre-texture plain body.
let svgPortReady = true;

/** Dispose the three svg-port channel textures (mirror Stroke3DScene's
 *  disposeSvgPortTex — three never auto-frees GPU textures on reassignment). */
function disposeSvgPortTexLocal(t: SvgPortTextureResult | null | undefined): void {
  if (!t) return;
  t.emissive.dispose();
  t.height.dispose();
  t.normal.dispose();
}

function VisMeshes({
  strokes,
  state,
  onBounds,
}: {
  strokes: StrokeInputPoint[][];
  state: VisState;
  onBounds: (b: Bounds | null) => void;
}) {
  const params = state.modeParams ?? DEFAULT_MODE3D_PARAMS;

  const builds = useMemo<StrokeGeometryResult[]>(() => {
    const pool = strokes.filter((s) => s.length > 0).slice(0, MAX_STROKES);
    if (pool.length === 0) return [];
    const center = poolCenter(pool, SCENE_VIEWBOX);
    if (state.geometryMode === 'solid') {
      return [
        buildPoolSolidGeometry(pool, {
          viewBox: SCENE_VIEWBOX,
          center,
          inkRadius: params.solid.inkRadius,
          depth: params.solid.depth,
          rodRadius: params.rod.radius,
          holes: params.solid.holes,
          edge: params.solid.edge,
        }),
      ];
    }
    return pool.map((points) =>
      buildStrokeWithParams(points, SCENE_VIEWBOX, center, state.geometryMode, params),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strokes, state.geometryMode, JSON.stringify(params)]);

  useEffect(() => () => { for (const b of builds) b.geometry.dispose(); }, [builds]);

  // Materials. nativeMat is ALWAYS built (EXACT product: svg-port + native both
  // use the lit native material as the BASE; svg-port overrides it with the
  // relief material once the texture lands, and falls BACK to it pre-texture /
  // on failure — never a null material). Hatch builds the parallel shader.
  const nativeProps: NativeProps3D = { ...DEFAULT_NATIVE_PROPS_3D, ...(state.nativeProps ?? {}) };
  const preset: MaterialPresetId = state.materialPreset ?? MODE_MATERIAL_DEFAULTS_3D[state.geometryMode];
  const nativeMat = useMemo(
    () => createNativeMaterial(preset, undefined, nativeProps),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [preset, JSON.stringify(state.nativeProps ?? {})],
  );
  useEffect(() => () => nativeMat?.dispose(), [nativeMat]);

  // HATCH style only — svg-port NO LONGER uses the parallel hatch shader (the
  // killed stopgap); it wears the REAL 2D render as a carved relief (below),
  // mirroring the product Stroke3DScene exactly.
  const hatchMat = useMemo(
    () => (state.style3d === 'hatch' ? createHatchMaterial('hatch') : null),
    [state.style3d],
  );
  useEffect(() => () => hatchMat?.dispose(), [hatchMat]);

  const material: THREE.Material = hatchMat ?? nativeMat;

  // BAS-RELIEF FACE (RC-2 fix) — PORT of Stroke3DScene StrokeMeshes. The pool-
  // raster Solid (and closed-loop Extrude) bury the interior hand into a
  // featureless slab; instead of floating ink TUBES on top we carve the drawing
  // INTO the front face as a bumpMap height field (white = surface, ink =
  // recessed grooves the light catches). Solid + Extrude, Native style only →
  // null otherwise (rod/inflate already ARE the strokes).
  const isNative = state.style3d === 'native';
  const reliefBody =
    !state.legacyTubes && (state.geometryMode === 'solid' || state.geometryMode === 'extrude');
  const relief = useMemo(() => {
    if (!isNative || !reliefBody || builds.length === 0) return null;
    const mass = builds[0];
    mass.geometry.computeBoundingBox();
    const bb = mass.geometry.boundingBox;
    if (!bb || !Number.isFinite(bb.min.x) || !Number.isFinite(bb.max.x)) return null;
    const pool = strokes.filter((s) => s.length > 0).slice(0, MAX_STROKES);
    if (pool.length === 0) return null;
    const built = buildDrawingReliefTexture(pool, SCENE_VIEWBOX, {
      minX: bb.min.x,
      maxX: bb.max.x,
      minY: bb.min.y,
      maxY: bb.max.y,
    });
    if (!built) return null;
    applyPlanarReliefUVs(mass.geometry, built.window);
    return built.texture;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [builds, state.geometryMode, isNative, reliefBody, JSON.stringify(params)]);
  useEffect(() => () => { if (relief) relief.dispose(); }, [relief]);
  const reliefMaterial = useMemo<THREE.Material | null>(() => {
    if (!relief || !(material instanceof THREE.MeshStandardMaterial)) return null;
    const m = material.clone();
    m.bumpMap = relief;
    m.bumpScale = RELIEF_BUMP_SCALE;
    m.needsUpdate = true;
    return m;
  }, [relief, material]);
  useEffect(() => () => { if (reliefMaterial) reliefMaterial.dispose(); }, [reliefMaterial]);
  // ── SVG-PORT: the form WEARS the REAL 2D render — EXACT product path
  // (Stroke3DScene StrokeMeshes). Rasterize the styled markup → emissive ink +
  // Sobel normal + displacement height, register to the front cap, render a
  // TESSELLATED cap so displacement carves real geometry. solid/extrude only.
  const isSvgPort = state.style3d === 'svg-port';
  const svgPortBody = isSvgPort && (state.geometryMode === 'solid' || state.geometryMode === 'extrude');
  const [svgPortTex, setSvgPortTex] = useState<SvgPortTextureResult | null>(null);
  const [svgPortGeom, setSvgPortGeom] = useState<THREE.BufferGeometry | null>(null);
  const svgPortGenRef = useRef(0);
  useEffect(() => {
    svgPortReady = false;
    if (!svgPortBody || !state.svgPortMarkup || builds.length === 0) {
      setSvgPortTex((prev) => { disposeSvgPortTexLocal(prev); return null; });
      setSvgPortGeom((prev) => { prev?.dispose(); return null; });
      svgPortReady = true; // nothing to wait for
      return;
    }
    const mass = builds[0];
    mass.geometry.computeBoundingBox();
    const bb = mass.geometry.boundingBox;
    if (!bb || !Number.isFinite(bb.min.x) || !Number.isFinite(bb.max.x)) {
      setSvgPortTex((prev) => { disposeSvgPortTexLocal(prev); return null; });
      setSvgPortGeom((prev) => { prev?.dispose(); return null; });
      svgPortReady = true;
      return;
    }
    const pool = strokes.filter((s) => s.length > 0).slice(0, MAX_STROKES);
    const myGen = ++svgPortGenRef.current;
    let cancelled = false;
    buildSvgPortTexture(
      state.svgPortMarkup,
      pool,
      SCENE_VIEWBOX,
      { minX: bb.min.x, maxX: bb.max.x, minY: bb.min.y, maxY: bb.max.y },
      { paperColor: PAPER },
    )
      .then((res) => {
        if (cancelled || myGen !== svgPortGenRef.current) { disposeSvgPortTexLocal(res); return; }
        if (!res) { svgPortReady = true; return; }
        let carved: THREE.BufferGeometry | null = null;
        try {
          const clone = mass.geometry.clone();
          carved = new TessellateModifier(0.04, 5).modify(clone); // matches product (deep-carve)
          clone.dispose();
          applyPlanarReliefUVs(carved, res.window);
          carved.computeVertexNormals();
        } catch {
          carved = null;
        }
        setSvgPortTex((prev) => { disposeSvgPortTexLocal(prev); return res; });
        setSvgPortGeom((prev) => { prev?.dispose(); return carved; });
        if (!carved) applyPlanarReliefUVs(mass.geometry, res.window);
        svgPortReady = true;
      })
      .catch(() => { svgPortReady = true; });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [svgPortBody, state.svgPortMarkup, builds, state.geometryMode, JSON.stringify(params)]);
  useEffect(() => () => { disposeSvgPortTexLocal(svgPortTex); }, [svgPortTex]);
  useEffect(() => () => { svgPortGeom?.dispose(); }, [svgPortGeom]);

  const svgPortMaterial = useMemo<THREE.Material | null>(() => {
    if (!svgPortTex) return null;
    const m = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: svgPortTex.emissive,
      normalMap: svgPortTex.normal,
      displacementMap: svgPortTex.height,
      displacementScale: RELIEF_DISPLACEMENT_SCALE,
      displacementBias: -RELIEF_DISPLACEMENT_SCALE,
      emissive: new THREE.Color(0xffffff),
      emissiveMap: svgPortTex.emissive,
      emissiveIntensity: 0.22, // matches product (deep-carve pass)
      roughness: 1.0,
      metalness: 0.0,
    });
    m.normalScale = new THREE.Vector2(1.6, -1.6); // matches product (deep-carve)
    m.needsUpdate = true;
    return m;
  }, [svgPortTex]);
  useEffect(() => () => { if (svgPortMaterial) svgPortMaterial.dispose(); }, [svgPortMaterial]);

  const bodyMaterial: THREE.Material =
    (svgPortBody && svgPortMaterial) ? svgPortMaterial : (reliefMaterial ?? material);

  // VERIFY-ONLY A/B: the OLD raised-tube face-ink overlay (the lazy "lines on
  // top" stopgap), reconstructed verbatim so the before/after board renders
  // from one dist. Gated entirely behind state.legacyTubes — never the product
  // path. Solid+Extrude only (the modes the relief now carves).
  const legacyTubes = useMemo<THREE.BufferGeometry[] | null>(() => {
    if (!state.legacyTubes) return null;
    if (!(state.geometryMode === 'solid' || state.geometryMode === 'extrude')) return null;
    if (builds.length === 0) return null;
    const mass = builds[0];
    mass.geometry.computeBoundingBox();
    const bb = mass.geometry.boundingBox;
    if (!bb || !Number.isFinite(bb.max.z)) return null;
    const pool = strokes.filter((s) => s.length > 0).slice(0, MAX_STROKES);
    if (pool.length === 0) return null;
    const center = poolCenter(pool, SCENE_VIEWBOX);
    const lift = bb.max.z + params.rod.radius * 0.5;
    const geoms: THREE.BufferGeometry[] = [];
    for (const points of pool) {
      const rod = buildStrokeWithParams(points, SCENE_VIEWBOX, center, 'rod', params);
      rod.geometry.translate(0, 0, lift);
      geoms.push(rod.geometry);
    }
    return geoms;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [builds, state.legacyTubes, state.geometryMode, JSON.stringify(params)]);
  useEffect(() => () => { if (legacyTubes) for (const g of legacyTubes) g.dispose(); }, [legacyTubes]);
  const legacyTubeMaterial = useMemo<THREE.MeshPhysicalMaterial | null>(
    () => (state.legacyTubes ? createNativeMaterial('glossyPlastic', INK_3D_DEFAULT) : null),
    [state.legacyTubes],
  );
  useEffect(() => () => legacyTubeMaterial?.dispose(), [legacyTubeMaterial]);

  // (svg-port NO LONGER draws an EdgesGeometry outline — the killed stopgap;
  // the carved relief IS the drawing now.)

  // Rod adornments (caps + joints).
  const capSphere = useMemo(() => new THREE.SphereGeometry(1, SPHERE_SEGMENTS, SPHERE_SEGMENTS), []);
  const capDisk = useMemo(() => new THREE.CylinderGeometry(1, 1, 1, 24), []);
  useEffect(() => () => { capSphere.dispose(); capDisk.dispose(); }, [capSphere, capDisk]);
  const adornments = useMemo<RodAdornmentSpec[][]>(
    () => builds.map((b) => (b.kind === 'rod' ? rodAdornmentSpecs(b, params.rod.capStyle, params.rod.jointStyle, params.rod.caps) : [])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [builds, params.rod.capStyle, params.rod.jointStyle, params.rod.caps],
  );

  // Bounds for framing.
  const bounds = useMemo<Bounds | null>(() => {
    const min = new THREE.Vector3(Infinity, Infinity, Infinity);
    const max = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
    for (const b of builds) {
      b.geometry.computeBoundingBox();
      const bb = b.geometry.boundingBox;
      if (bb && Number.isFinite(bb.min.x) && Number.isFinite(bb.max.x)) {
        min.min(bb.min);
        max.max(bb.max);
      }
      if (b.kind === 'rod') {
        const pad = b.radius * 1.5;
        for (const p of b.capPositions.concat(b.jointPositions, b.endPositions)) {
          min.min(new THREE.Vector3(p.x - pad, p.y - pad, p.z - pad));
          max.max(new THREE.Vector3(p.x + pad, p.y + pad, p.z + pad));
        }
      }
    }
    if (!Number.isFinite(min.x) || !Number.isFinite(max.x)) return null;
    const center = new THREE.Vector3().addVectors(min, max).multiplyScalar(0.5);
    const size = new THREE.Vector3().subVectors(max, min);
    const radius = size.length() / 2;
    return { center, radius, size };
  }, [builds]);

  useEffect(() => { onBounds(bounds); }, [bounds, onBounds]);

  // Native OUTLINE inverted hull.
  const outlineWidth = state.style3d === 'native' ? nativeProps.outline : 0;
  const outlinePush = outlineWidth > 0 && bounds ? outlineWidth * 0.04 * Math.max(bounds.radius, 0.5) : 0;
  const hullMaterial = useMemo<THREE.ShaderMaterial | null>(() => {
    if (outlinePush <= 0) return null;
    return new THREE.ShaderMaterial({
      uniforms: { u_push: { value: outlinePush }, u_ink: { value: new THREE.Color(INK_3D_DEFAULT) } },
      vertexShader: `uniform float u_push; void main(){ vec3 p = position + normal*u_push; gl_Position = projectionMatrix*modelViewMatrix*vec4(p,1.0);}`,
      fragmentShader: `uniform vec3 u_ink; void main(){ gl_FragColor = vec4(u_ink,1.0);}`,
      side: THREE.BackSide,
      depthWrite: false,
    });
  }, [outlinePush]);
  useEffect(() => () => hullMaterial?.dispose(), [hullMaterial]);

  return (
    <group>
      {hatchMat && (
        <HatchSync
          material={hatchMat}
          variant="hatch"
          inputs={state.hatchInputs ?? { hachureGap: 4, hachureAngle: -41, strokeWidth: 1.2, inkIntensity: 1.0 }}
          grammar={state.hatchGrammar ?? 'hachure'}
          direction={state.hatchDirection ?? 'fixed'}
        />
      )}
      {builds.map((b, i) => (
        <group key={i}>
          {hullMaterial && <mesh geometry={b.geometry} material={hullMaterial} />}
          {/* svg-port carves the TESSELLATED cap (svgPortGeom) on i=0; all
              other meshes (and pre-texture frame) use the plain mass. */}
          <mesh
            geometry={svgPortBody && i === 0 && svgPortGeom ? svgPortGeom : b.geometry}
            material={bodyMaterial}
          />
          {adornments[i]?.map((spec, j) => (
            <mesh
              key={`a${j}`}
              geometry={spec.shape === 'sphere' ? capSphere : capDisk}
              position={spec.position}
              scale={spec.scale}
              quaternion={spec.quaternion}
              material={material}
            />
          ))}
        </group>
      ))}
      {/* (RC-2 fix: carved bas-relief bumpMap on the body itself — applied above
          — replaces the old raised-tube face-ink overlay.) */}
      {/* VERIFY-ONLY A/B: the OLD raised-tube overlay, only when legacyTubes. */}
      {legacyTubes && legacyTubeMaterial && (
        <group>
          {legacyTubes.map((g, i) => (
            <mesh key={`legacytube${i}`} geometry={g} material={legacyTubeMaterial} />
          ))}
        </group>
      )}
    </group>
  );
}

// ─── App shell ────────────────────────────────────────────────────────────────

let setSceneExternal: ((s: { strokes: StrokeInputPoint[][]; state: VisState }) => void) | null = null;

function VisApp() {
  const [scene, setScene] = useState<{ strokes: StrokeInputPoint[][]; state: VisState }>({
    strokes: [],
    state: { geometryMode: 'auto', style3d: 'native', angleDeg: 0, elevDeg: 18 },
  });
  const [bounds, setBounds] = useState<Bounds | null>(null);
  setSceneExternal = setScene;
  return (
    <Canvas
      dpr={1}
      camera={{ position: [0, 1.5, 7], fov: 40 }}
      gl={{ antialias: true, preserveDrawingBuffer: true }}
      style={{ width: '100%', height: '100%' }}
    >
      <color attach="background" args={[PAPER]} />
      <StudioRig />
      {/* svg-port carve light — LOW grazing key + opposite low fill (EXACT
          product light, deep-carve pass). Only when svg-port; never perturbs
          the Native/Hatch groups. */}
      {scene.state.style3d === 'svg-port' && (
        <>
          <directionalLight position={[7, 1.3, 3.2]} intensity={1.7} color="#fff8ee" />
          <directionalLight position={[-5, 1.0, 2.6]} intensity={0.6} color="#eef2f8" />
        </>
      )}
      {/* Native bas-relief carve light — matches product (deep-carve pass). */}
      {scene.state.style3d === 'native' &&
        (scene.state.geometryMode === 'extrude' || scene.state.geometryMode === 'solid') && (
        <>
          <directionalLight position={[6.5, 1.4, 3.4]} intensity={1.5} color="#fff5e6" />
          <directionalLight position={[-5, 1.1, 2.4]} intensity={0.5} color="#eef2f8" />
        </>
      )}
      <VisMeshes strokes={scene.strokes} state={scene.state} onBounds={setBounds} />
      <OrbitCamera angleDeg={scene.state.angleDeg} elevDeg={scene.state.elevDeg} bounds={bounds} />
    </Canvas>
  );
}

// ─── Pixel measurement (for auto-flagging) ───────────────────────────────────

export interface VisStats {
  objFrac: number; // fraction of canvas px that are non-paper (object present)
  lit: { r: number; g: number; b: number }; // lit-face median (p55-p92)
  delta: number; // lit r-b (tan detector — ink-black must hold)
  lum: number; // lit-face luminance
  blackFrac: number; // fraction of OBJECT px that are near-black (lum<40)
  solidBlobScore: number; // blackFrac among object px — high = solid black blob
  spread: number; // p90-p10 luminance of object (structure present = high spread)
  bboxFill: number; // object px / bbox px (overflow / clipping read)
  overflowEdge: number; // fraction of object px touching the canvas border
}

function lumOf(r: number, g: number, b: number): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function median(xs: number[]): number {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

function sampleStats(canvas: HTMLCanvasElement): VisStats {
  const w = canvas.width;
  const h = canvas.height;
  const c2 = document.createElement('canvas');
  c2.width = w;
  c2.height = h;
  const ctx = c2.getContext('2d')!;
  ctx.drawImage(canvas, 0, 0);
  const data = ctx.getImageData(0, 0, w, h).data;

  const isObj = (i: number) =>
    Math.abs(data[i] - PAPER_RGB[0]) +
      Math.abs(data[i + 1] - PAPER_RGB[1]) +
      Math.abs(data[i + 2] - PAPER_RGB[2]) >
    24;

  let minY = h, maxY = 0, minX = w, maxX = 0;
  const lums: number[] = [];
  const rgbs: Array<[number, number, number, number]> = [];
  let black = 0;
  let edgeTouch = 0;
  let objCount = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (!isObj(i)) continue;
      objCount++;
      const l = lumOf(data[i], data[i + 1], data[i + 2]);
      lums.push(l);
      rgbs.push([data[i], data[i + 1], data[i + 2], l]);
      if (l < 40) black++;
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) edgeTouch++;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
    }
  }
  const total = w * h;
  if (objCount === 0) {
    return { objFrac: 0, lit: { r: 0, g: 0, b: 0 }, delta: 0, lum: 0, blackFrac: 0, solidBlobScore: 0, spread: 0, bboxFill: 0, overflowEdge: 0 };
  }
  const sorted = [...rgbs].sort((a, b) => a[3] - b[3]);
  const at = (q: number) => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))][3];
  const band = sorted.slice(Math.floor(0.55 * sorted.length), Math.floor(0.92 * sorted.length));
  const litR = median(band.map((p) => p[0]));
  const litG = median(band.map((p) => p[1]));
  const litB = median(band.map((p) => p[2]));
  const bboxArea = Math.max(1, (maxX - minX + 1) * (maxY - minY + 1));

  return {
    objFrac: +(objCount / total).toFixed(5),
    lit: { r: litR, g: litG, b: litB },
    delta: litR - litB,
    lum: Math.round(lumOf(litR, litG, litB)),
    blackFrac: +(black / objCount).toFixed(4),
    solidBlobScore: +(black / objCount).toFixed(4),
    spread: Math.round(at(0.9) - at(0.1)),
    bboxFill: +(objCount / bboxArea).toFixed(4),
    overflowEdge: +(edgeTouch / objCount).toFixed(4),
  };
}

// ─── window API for the driver ────────────────────────────────────────────────

declare global {
  interface Window {
    __visReady: boolean;
    __vis: {
      count: number;
      shapes: SweepShape[];
      sample: (index: number) => Promise<{ sampledElements: number; strokeCount: number }>;
      renderClean: (index: number) => Promise<{ ok: boolean }>;
      render3d: (state: VisState) => Promise<{ dataUrl: string; stats: VisStats }>;
      /** Verify-only: inject custom strokes (viewBox 800×600) as the current
       *  pool, so the bas-relief change can be exercised on a face / poster /
       *  multi-feature drawing through the EXACT product render path. */
      setStrokes: (strokes: StrokeInputPoint[][]) => void;
      /** Debug: return the svg-port channel textures as dataURLs for the current
       *  shape (emissive/height/normal) — inspect the carve without GL. */
      debugSvgPortTex: () => Promise<{ emissive: string; height: string; normal: string } | null>;
    };
  }
}

let currentStrokes: StrokeInputPoint[][] = [];
let currentSvgPortMarkup: string | null = null;

window.__vis = {
  count: INVENTORY.length,
  shapes: INVENTORY,

  async sample(index) {
    const cell = INVENTORY[index];
    statusEl.textContent = `visual ${index + 1}/${INVENTORY.length} — ${cell.kind}/${cell.shape}`;
    const r = await sampleShape(cell);
    currentStrokes = r.strokes;
    currentSvgPortMarkup = r.svgPortMarkup;
    return { sampledElements: r.sampledElements, strokeCount: r.strokes.length };
  },

  // Renders the CURRENT shape's Clean source SVG into the visible #cleanbox DOM
  // node (PinShape/PegToolShape = "Source SVG as drawn. Crisp vectors."). The
  // driver screenshots #cleanbox directly with Playwright (native browser
  // render — no canvas tainting, the faithful ground truth).
  async renderClean(index: number) {
    const cell = INVENTORY[index];
    if (!cleanRoot) cleanRoot = createRoot(cleanBox);
    flushSync(() => {
      cleanRoot!.render(
        <div style={{ width: 320, height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18, boxSizing: 'border-box' }}>
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {cell.kind === 'trophy' ? (
              <PinShape shape={cell.shape as F3TrophyWallShapeId} />
            ) : (
              <PegToolShape shape={cell.shape as F3PegboardShapeId} />
            )}
          </div>
        </div>,
      );
    });
    await nextFrame();
    await nextFrame();
    return { ok: true };
  },

  setStrokes(strokes: StrokeInputPoint[][]) {
    currentStrokes = strokes;
    statusEl.textContent = `custom strokes injected — ${strokes.length} stroke(s)`;
  },

  // DEBUG: directly build the svg-port channel textures for the current shape's
  // markup over a synthetic world bbox (the geometry bbox the cap would have),
  // and return emissive + height as dataURLs so the carve can be inspected
  // without the GL stage in the loop. Read-only diagnostic.
  async debugSvgPortTex() {
    const pool = currentStrokes.filter((s) => s.length > 0).slice(0, MAX_STROKES);
    if (pool.length === 0 || !currentSvgPortMarkup) return null;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const center = poolCenter(pool, SCENE_VIEWBOX);
    // Use the real geometry to get the front-cap bbox (extrude default).
    const builds = pool.map((points) =>
      buildStrokeWithParams(points, SCENE_VIEWBOX, center, 'extrude', DEFAULT_MODE3D_PARAMS),
    );
    for (const b of builds) {
      b.geometry.computeBoundingBox();
      const bb = b.geometry.boundingBox!;
      if (bb.min.x < minX) minX = bb.min.x;
      if (bb.min.y < minY) minY = bb.min.y;
      if (bb.max.x > maxX) maxX = bb.max.x;
      if (bb.max.y > maxY) maxY = bb.max.y;
    }
    for (const b of builds) b.geometry.dispose();
    const res = await buildSvgPortTexture(currentSvgPortMarkup, pool, SCENE_VIEWBOX, { minX, maxX, minY, maxY }, { paperColor: PAPER });
    if (!res) return null;
    const dump = (t: THREE.CanvasTexture) => (t.image as HTMLCanvasElement).toDataURL('image/png');
    const out = { emissive: dump(res.emissive), height: dump(res.height), normal: dump(res.normal) };
    disposeSvgPortTexLocal(res);
    return out;
  },

  async render3d(state) {
    // svg-port needs the styled markup (the real 2D render the form wears).
    const withMarkup: VisState =
      state.style3d === 'svg-port'
        ? { ...state, svgPortMarkup: currentSvgPortMarkup ?? undefined }
        : state;
    setSceneExternal!({ strokes: currentStrokes, state: withMarkup });
    // Settle: setScene → React render → VisMeshes build → onBounds → camera
    // effect → render. Needs ~3 frames min; 7 + a short tick is safe headroom
    // (ContactShadows omitted from this harness, so no bake wait needed).
    for (let i = 0; i < 7; i++) await nextFrame();
    await new Promise((r) => setTimeout(r, 30));
    await nextFrame();
    // svg-port builds its texture ASYNC (Image.decode + TessellateModifier);
    // poll the scene-published readiness flag so the capture isn't of the
    // pre-texture plain body. Falls through after a bounded wait.
    if (withMarkup.style3d === 'svg-port' && currentSvgPortMarkup) {
      const deadline = Date.now() + 4000;
      while (Date.now() < deadline && !svgPortReady) {
        await new Promise((r) => setTimeout(r, 40));
        await nextFrame();
      }
      // one more settle frame so the carved cap + material are on-screen
      for (let i = 0; i < 3; i++) await nextFrame();
    }
    const canvas = document.querySelector('#stage canvas') as HTMLCanvasElement;
    const stats = sampleStats(canvas);
    return { dataUrl: canvas.toDataURL('image/png'), stats };
  },
};

createRoot(document.getElementById('stage')!).render(<VisApp />);
window.__visReady = true;
statusEl.textContent = `catalog visual 3D harness ready — ${INVENTORY.length} shapes`;
