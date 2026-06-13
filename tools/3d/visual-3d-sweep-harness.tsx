// VISUAL 3D SWEEP harness (see visual-3d-sweep.html). Repo tool only — NOT
// part of the Make drag-drop set and NOT wired into the app.
//
// THE VISUAL 3D RENDER SWEEP (the pixels lane). The headless geometry gauntlet
// (geometry-gauntlet.mjs / catalog-geometry-sweep) already proved geometry
// CORRECTNESS for all 197 × 5 modes. THIS harness judges PIXELS: it renders the
// REAL audit catalog (PinShape + PegToolShape, the EXACT deduped 197 /audit
// uses) through the REAL Stroke3DScene component (production default props:
// style3d='native', per-mode default materials) and screenshots the GL viewport
// at TWO orbit azimuths per geometry mode, so the playwright driver can read
// every cell with vision and compare it to the shape's CLEAN SVG ground-truth.
//
// Layout per capture (#capture):
//   ┌────────────┐
//   │   label    │  shape · mode · angle
//   ├────────────┤
//   │ clean svg  │  the catalog shape's OWN <svg> = Clean ground-truth
//   ├────────────┤
//   │  3D scene  │  Stroke3DScene render at the requested orbit azimuth
//   └────────────┘
//
// window API for the driver:
//   __vsweep.shapes                              the 197 inventory
//   __vsweep.prepare(i)                          sample + render clean svg, returns counts
//   __vsweep.render(i, mode, azimuthDeg)         mount scene + orbit, settle
//
// Deterministic: same shape+mode+azimuth → same strokes, same camera, same scene.

import { useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { flushSync } from 'react-dom';
import * as THREE from 'three';
import { Stroke3DScene } from '../../src/app/components/canvas3d';
import {
  buildPoolSolidGeometry,
  buildStrokeGeometry,
  pickGeometryMode,
  poolCenter,
  rdpPoints,
  type GeometryModeSetting,
  type StrokeInputPoint,
} from '../../src/app/lib/geometry3d/strokeTo3d';
import { PinShape } from '../../src/app/lib/items/PinShape';
import { PegToolShape } from '../../src/app/lib/items/PegToolShape';
import {
  F3_PEGBOARD_SUBJECTS,
  F3_TROPHY_WALL_SUBJECTS,
  type F3PegboardShapeId,
  type F3TrophyWallShapeId,
} from '../../src/app/lib/items/identitySet';

// ─── Inventory (same dedupe-by-shape-id flatten /audit + the geometry gauntlet
//     use — so this is the EXACT 197) ───────────────────────────────────────

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

// ─── SVG → stroke sampling (verbatim from the audit-sweep harness) ───────────

const SCENE_VIEWBOX = { w: 800, h: 600 };
const FIT_MARGIN = 0.08;
const SAMPLE_SPACING = 2.5;
const MIN_SAMPLES = 8;
const MAX_SAMPLES = 160;
const MAX_STROKES = 60; // mirrors Stroke3DScene MAX_STROKES_3D

const samplerHost = document.getElementById('sampler')!;
const cleanHost = document.getElementById('clean')!;
let samplerRoot: Root | null = null;
let cleanRoot: Root | null = null;

function nextFrame(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

interface SampleResult {
  strokes: StrokeInputPoint[][];
  sampledElements: number;
  skippedTextElements: number;
  skippedZeroLength: number;
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

  const svg = samplerHost.querySelector('svg');
  if (!svg) return { strokes: [], sampledElements: 0, skippedTextElements: 0, skippedZeroLength: 0 };

  const geomEls = Array.from(
    svg.querySelectorAll<SVGGeometryElement>('path, rect, circle, ellipse, line, polyline, polygon'),
  );
  const skippedTextElements = svg.querySelectorAll('text').length;

  const rawStrokes: Array<{ pts: Array<[number, number]>; len: number }> = [];
  let skippedZeroLength = 0;
  for (const el of geomEls) {
    let len = 0;
    try {
      len = el.getTotalLength();
    } catch {
      skippedZeroLength++;
      continue;
    }
    if (!Number.isFinite(len) || len <= 0) {
      skippedZeroLength++;
      continue;
    }
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
    return {
      strokes: [],
      sampledElements: 0,
      skippedTextElements,
      skippedZeroLength: skippedZeroLength + kept.length,
    };
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

  return { strokes, sampledElements: strokes.length, skippedTextElements, skippedZeroLength };
}

/** Render the catalog shape's OWN svg into the visible Clean cell (ground-truth
 *  2D). Scaled to fill the clean panel. */
function renderClean(cell: SweepShape): void {
  if (!cleanRoot) cleanRoot = createRoot(cleanHost);
  flushSync(() => {
    cleanRoot!.render(
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {cell.kind === 'trophy' ? (
          <PinShape shape={cell.shape as F3TrophyWallShapeId} />
        ) : (
          <PegToolShape shape={cell.shape as F3PegboardShapeId} />
        )}
      </div>,
    );
  });
}

// ─── Build introspection (fallback / NaN — for the table, not pixels) ────────

interface BuildIntrospection {
  kinds: Array<{ requested: string; actual: string }>;
  fallbacks: number;
  nonFinite: boolean;
}

function scanNonFinite(geometry: { getAttribute(name: string): { array: ArrayLike<number> } | null }): boolean {
  const pos = geometry.getAttribute('position');
  if (!pos) return true;
  const arr = pos.array;
  for (let i = 0; i < arr.length; i++) {
    if (!Number.isFinite(arr[i])) return true;
  }
  return false;
}

function introspectBuilds(strokes: StrokeInputPoint[][], mode: GeometryModeSetting): BuildIntrospection {
  const pool = strokes.filter((s) => s.length > 0).slice(0, MAX_STROKES);
  const center = poolCenter(pool, SCENE_VIEWBOX);
  const kinds: Array<{ requested: string; actual: string }> = [];
  let fallbacks = 0;
  let nonFinite = false;

  if (mode === 'solid') {
    const b = buildPoolSolidGeometry(pool, { viewBox: SCENE_VIEWBOX, center });
    kinds.push({ requested: 'solid', actual: b.kind });
    if (b.kind !== 'solid') fallbacks++;
    if (scanNonFinite(b.geometry)) nonFinite = true;
    b.geometry.dispose();
  } else {
    for (const points of pool) {
      const simplified = rdpPoints(points);
      const requested = mode === 'auto' ? pickGeometryMode(simplified) : mode;
      const b = buildStrokeGeometry(points, { viewBox: SCENE_VIEWBOX, mode, center });
      kinds.push({ requested, actual: b.kind });
      if (b.kind !== requested) fallbacks++;
      if (scanNonFinite(b.geometry)) nonFinite = true;
      b.geometry.dispose();
    }
  }
  return { kinds, fallbacks, nonFinite };
}

// ─── Orbit by simulating an OrbitControls DRAG on the GL canvas (read-only, no
//     edit to Stroke3DScene; exercises the EXACT user-facing orbit path). drei's
//     OrbitControls (makeDefault) listens to pointerdown/move/up on the canvas;
//     a horizontal drag of dx pixels rotates azimuth by 2π·dx/clientHeight rad
//     (Three's rotateLeft formula, rotateSpeed=1). So azimuthDeg maps to:
//        dx = azimuthDeg/360 · clientHeight
//     azimuthDeg=0 → no drag → the canonical CameraFramer 3/4 framing. ─────────

let lastFrameDir = 1; // alternate drag sign so successive same-key calls don't drift

function dragOrbit(azimuthDeg: number): boolean {
  if (azimuthDeg === 0) return true; // canonical framing, no drag needed
  const canvas = document.querySelector('#scene canvas') as HTMLCanvasElement | null;
  if (!canvas) return false;
  const rect = canvas.getBoundingClientRect();
  const h = canvas.clientHeight || rect.height || 320;
  // dx pixels for the requested azimuth. Drag horizontally from mid-canvas.
  const dx = Math.round((azimuthDeg / 360) * h) * lastFrameDir;
  const y = Math.round(rect.top + rect.height / 2);
  const x0 = Math.round(rect.left + rect.width / 2 - dx / 2);
  const x1 = x0 + dx;
  const opts = (cx: number): PointerEventInit => ({
    pointerId: 1,
    pointerType: 'mouse',
    button: 0,
    buttons: 1,
    clientX: cx,
    clientY: y,
    bubbles: true,
    cancelable: true,
  });
  canvas.dispatchEvent(new PointerEvent('pointerdown', opts(x0)));
  // a few intermediate moves so OrbitControls integrates the full delta
  const steps = 6;
  for (let i = 1; i <= steps; i++) {
    const cx = Math.round(x0 + ((x1 - x0) * i) / steps);
    window.dispatchEvent(new PointerEvent('pointermove', { ...opts(cx), buttons: 1 }));
    canvas.dispatchEvent(new PointerEvent('pointermove', { ...opts(cx), buttons: 1 }));
  }
  window.dispatchEvent(new PointerEvent('pointerup', { ...opts(x1), buttons: 0 }));
  canvas.dispatchEvent(new PointerEvent('pointerup', { ...opts(x1), buttons: 0 }));
  return true;
}

// expose for the driver / manual probing
(window as unknown as { __vsweepOrbit?: (deg: number) => boolean }).__vsweepOrbit = dragOrbit;

// ─── Scene mount (ONE persistent Stroke3DScene, props swapped per render) ────

interface SceneState {
  strokes: StrokeInputPoint[][];
  mode: GeometryModeSetting;
  key: number; // bump to force a fresh CameraFramer fit before orbiting
}

let setSceneState: ((s: SceneState | null) => void) | null = null;

function HarnessScene() {
  const [state, setState] = useState<SceneState | null>(null);
  setSceneState = setState;
  if (!state) return null;
  return (
    <Stroke3DScene
      key={state.key}
      strokes={state.strokes}
      geometryMode={state.mode}
      style={{ width: '100%', height: '100%' }}
    />
  );
}

const MODE_INDEX: Record<GeometryModeSetting, number> = {
  auto: 0,
  rod: 1,
  extrude: 2,
  inflate: 3,
  solid: 4,
};

const sceneRoot = createRoot(document.getElementById('scene')!);
sceneRoot.render(<HarnessScene />);
const labelEl = document.getElementById('label')!;

// ─── window API for the playwright driver ────────────────────────────────────

const prepared = new Map<number, SampleResult>();

declare global {
  interface Window {
    __vsweepReady: boolean;
    __vsweep: {
      shapes: SweepShape[];
      prepare: (index: number) => Promise<Omit<SampleResult, 'strokes'> & { strokeCount: number; pointCount: number }>;
      render: (
        index: number,
        mode: GeometryModeSetting,
        azimuthDeg: number,
      ) => Promise<BuildIntrospection & { strokeCount: number }>;
    };
  }
}

window.__vsweep = {
  shapes: INVENTORY,

  async prepare(index: number) {
    const cell = INVENTORY[index];
    const result = await sampleShape(cell);
    prepared.set(index, result);
    renderClean(cell);
    await nextFrame();
    return {
      sampledElements: result.sampledElements,
      skippedTextElements: result.skippedTextElements,
      skippedZeroLength: result.skippedZeroLength,
      strokeCount: result.strokes.length,
      pointCount: result.strokes.reduce((a, s) => a + s.length, 0),
    };
  },

  async render(index: number, mode: GeometryModeSetting, azimuthDeg: number) {
    const cell = INVENTORY[index];
    let sample = prepared.get(index);
    if (!sample) {
      sample = await sampleShape(cell);
      prepared.set(index, sample);
      renderClean(cell);
    }
    labelEl.textContent = `${cell.kind}/${cell.shape} · ${mode} · ${azimuthDeg}°`;
    // Fresh mount key per (shape,mode) so CameraFramer re-fits the new bounds;
    // keep the SAME key across azimuths of the same (shape,mode) so we orbit the
    // already-fit camera instead of refitting.
    const key = (index * 100 + MODE_INDEX[mode]) | 0;
    setSceneState!({ strokes: sample.strokes, mode, key });
    // Settle: geometry memo + Environment/ContactShadows first-frame bakes.
    for (let i = 0; i < 6; i++) await nextFrame();
    await new Promise((r) => setTimeout(r, 120));
    await nextFrame();
    // Now command the orbit azimuth by simulating the user drag on the GL
    // canvas. azimuth=0 leaves the canonical CameraFramer 3/4 framing untouched.
    dragOrbit(azimuthDeg);
    for (let i = 0; i < 6; i++) await nextFrame();
    await new Promise((r) => setTimeout(r, 100));
    await nextFrame();
    const intro = introspectBuilds(sample.strokes, mode);
    return { ...intro, strokeCount: sample.strokes.length };
  },
};

window.__vsweepReady = true;
