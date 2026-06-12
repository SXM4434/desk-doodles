// 3D audit-catalog sweep harness (see audit-sweep.html). Repo tool only —
// renders the REAL audit-catalog shapes (PinShape + PegToolShape, the same
// 197-shape inventory /audit uses) through the REAL Stroke3DScene component.
//
// Pipeline per shape:
//   1. render the shape's SVG into a hidden sampler div (real catalog code)
//   2. sample every SVGGeometryElement via getTotalLength/getPointAtLength
//      (mapped through getCTM so group/element transforms are honored)
//   3. fit the sampled point cloud into the scene's 800×600 viewBox
//   4. mount Stroke3DScene with the strokes + requested geometry mode
//   5. introspect: rebuild the same geometries via the strokeTo3d builders to
//      report build kinds (fallback detection) + scan for non-finite positions
//
// Deterministic: no randomness, no wall-clock-dependent sampling; the same
// shape + mode always produces the same strokes and the same scene.
import { useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { flushSync } from 'react-dom';
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

// ─── Inventory (same flatten the /audit page uses: dedupe by shape id) ──────

export interface SweepShape {
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

// ─── SVG → stroke sampling ──────────────────────────────────────────────────

const SCENE_VIEWBOX = { w: 800, h: 600 };
const FIT_MARGIN = 0.08; // fraction of the scene box left as breathing room
const SAMPLE_SPACING = 2.5; // svg user units between samples (pre-fit)
const MIN_SAMPLES = 8;
const MAX_SAMPLES = 160;
const MAX_STROKES = 60; // mirrors Stroke3DScene MAX_STROKES_3D

const samplerHost = document.getElementById('sampler')!;
let samplerRoot: Root | null = null;

function nextFrame(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

export interface SampleResult {
  strokes: StrokeInputPoint[][];
  sampledElements: number;
  skippedTextElements: number;
  skippedZeroLength: number;
}

/** Render one catalog shape off-screen and sample its geometry elements into
 *  stroke point arrays in the scene's 800×600 viewBox space. */
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
    const m = el.getCTM(); // element user space → svg viewBox space (honors transforms)
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

  // Primary-path ordering: longest geometry first, cap at the scene budget.
  rawStrokes.sort((a, b) => b.len - a.len);
  const kept = rawStrokes.slice(0, MAX_STROKES);

  // Fit the whole pool into the scene viewBox (uniform scale, centered).
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

  return {
    strokes,
    sampledElements: strokes.length,
    skippedTextElements,
    skippedZeroLength,
  };
}

// ─── Build introspection (fallback detection + NaN scan) ────────────────────

interface BuildIntrospection {
  /** Per-stroke `requested→actual` kinds (pool-level single entry for solid). */
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
      // A forced mode that builds as something else = honest degenerate
      // fallback (e.g. extrude on a near-collinear loop → rod). Auto's
      // requested kind is whatever the auto pick resolves to.
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

// ─── Scene mount (ONE persistent Canvas, props swapped per render) ──────────

interface SceneState {
  strokes: StrokeInputPoint[][];
  mode: GeometryModeSetting;
}

let setSceneState: ((s: SceneState | null) => void) | null = null;

function HarnessScene() {
  const [state, setState] = useState<SceneState | null>(null);
  setSceneState = setState;
  if (!state) return null;
  return (
    <Stroke3DScene
      strokes={state.strokes}
      geometryMode={state.mode}
      style={{ width: '100%', height: '100%' }}
    />
  );
}

const sceneRoot = createRoot(document.getElementById('scene')!);
sceneRoot.render(<HarnessScene />);
const labelEl = document.getElementById('label')!;

// ─── window API for the playwright driver ───────────────────────────────────

const prepared = new Map<number, SampleResult>();

declare global {
  interface Window {
    __sweepReady: boolean;
    __sweep: {
      shapes: SweepShape[];
      prepare: (index: number) => Promise<Omit<SampleResult, 'strokes'> & { strokeCount: number; pointCount: number }>;
      render: (index: number, mode: GeometryModeSetting) => Promise<BuildIntrospection & { strokeCount: number }>;
    };
  }
}

window.__sweep = {
  shapes: INVENTORY,

  async prepare(index: number) {
    const cell = INVENTORY[index];
    const result = await sampleShape(cell);
    prepared.set(index, result);
    return {
      sampledElements: result.sampledElements,
      skippedTextElements: result.skippedTextElements,
      skippedZeroLength: result.skippedZeroLength,
      strokeCount: result.strokes.length,
      pointCount: result.strokes.reduce((a, s) => a + s.length, 0),
    };
  },

  async render(index: number, mode: GeometryModeSetting) {
    const cell = INVENTORY[index];
    let sample = prepared.get(index);
    if (!sample) {
      sample = await sampleShape(cell);
      prepared.set(index, sample);
    }
    labelEl.textContent = `${cell.kind}/${cell.shape} · ${mode}`;
    setSceneState!({ strokes: sample.strokes, mode });
    // Settle: geometry memo + Environment/ContactShadows first-frame bakes.
    for (let i = 0; i < 6; i++) await nextFrame();
    await new Promise((r) => setTimeout(r, 120));
    await nextFrame();
    const intro = introspectBuilds(sample.strokes, mode);
    return { ...intro, strokeCount: sample.strokes.length };
  },
};
window.__sweepReady = true;
