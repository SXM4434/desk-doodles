// CATALOG GEOMETRY SWEEP harness (see catalog-geometry-sweep.html). Repo tool
// only — NOT part of the Make drag-drop set and NOT wired into the app. This is
// the browser-driven companion the pure-node tools/3d/geometry-gauntlet.mjs
// references (the catalog half needs the SVG DOM sampler getTotalLength/getCTM).
//
// FULL-CATALOG GEOMETRY-CORRECTNESS pass over ALL 197 audit shapes × 5 modes.
// This is the headless GEOMETRY lane: it exercises the REAL strokeTo3d /
// convert / markIntent engine and introspects PURE GEOMETRY ONLY. It does NOT
// mount Stroke3DScene / hatchMaterial / Canvas3DChrome / Canvas3DContext, does
// NOT create a WebGL renderer, and reads NO pixels — those files are under
// active edit and the VISUAL 3D render sweep is deliberately deferred.
//
// Pipeline per shape (sampling = the SAME getTotalLength/getCTM path the
// visual audit-sweep harness uses, so the strokes are identical):
//   1. render the shape's SVG into a hidden sampler div (real catalog code)
//   2. sample every SVGGeometryElement via getTotalLength/getPointAtLength
//      (mapped through getCTM so group/element transforms are honored)
//   3. fit the sampled point cloud into the scene's 800×600 viewBox
//   4. run the engine and extract, per geometry mode:
//        · build kind (requested→actual fallback)
//        · vertex / triangle counts (BufferGeometry position/index)
//        · holes (Shape.holes via solid.holes / extrude.holesCut)
//        · joints (rod jointPositions count, via detectJointPositions)
//        · closure classification (closureStateOf per stroke)
//        · mark-intent labels (analyzeMarkIntent treatments)
//        · determinism (build TWICE → byte-identical position arrays)
//        · non-finite scan (NaN / Infinity in any vertex)
//
// Deterministic: no randomness, no wall-clock sampling. Driven headless by
// tools/3d/geometry-gauntlet.mjs through window.__gauntlet.

import { createRoot, type Root } from 'react-dom/client';
import { flushSync } from 'react-dom';
import {
  buildPoolSolidGeometry,
  buildStrokeGeometry,
  closureStateOf,
  pickGeometryMode,
  poolCenter,
  rdpPoints,
  type GeometryMode,
  type GeometryModeSetting,
  type StrokeGeometryResult, // used by positionsIdentical() param type
  type StrokeInputPoint,
} from '../../src/app/lib/geometry3d/strokeTo3d';
import { convertStrokePool } from '../../src/app/lib/geometry3d/convert';
import { analyzeMarkIntent } from '../../src/app/lib/geometry3d/markIntent';
import { PinShape } from '../../src/app/lib/items/PinShape';
import { PegToolShape } from '../../src/app/lib/items/PegToolShape';
import {
  F3_PEGBOARD_SUBJECTS,
  F3_TROPHY_WALL_SUBJECTS,
  type F3PegboardShapeId,
  type F3TrophyWallShapeId,
} from '../../src/app/lib/items/identitySet';

// ─── Inventory (same dedupe-by-shape-id flatten the /audit page + the visual
//     sweep harness use — so this is the EXACT 197) ──────────────────────────

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

// ─── SVG → stroke sampling (verbatim from the visual sweep harness) ──────────

const SCENE_VIEWBOX = { w: 800, h: 600 };
const FIT_MARGIN = 0.08;
const SAMPLE_SPACING = 2.5;
const MIN_SAMPLES = 8;
const MAX_SAMPLES = 160;
const MAX_STROKES = 60; // mirrors Stroke3DScene MAX_STROKES_3D

const samplerHost = document.getElementById('sampler')!;
const statusEl = document.getElementById('status')!;
let samplerRoot: Root | null = null;

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

// ─── Pure geometry introspection (NO render) ─────────────────────────────────

interface GeomStats {
  vertices: number; // position attribute length / 3
  triangles: number; // index length / 3 (or vertices/3 when non-indexed)
  nonFinite: boolean;
}

function statsOf(geometry: {
  getAttribute(name: string): { array: ArrayLike<number>; count: number } | null;
  getIndex(): { count: number } | null;
}): GeomStats {
  const pos = geometry.getAttribute('position');
  if (!pos) return { vertices: 0, triangles: 0, nonFinite: true };
  const arr = pos.array;
  let nonFinite = false;
  for (let i = 0; i < arr.length; i++) {
    if (!Number.isFinite(arr[i])) {
      nonFinite = true;
      break;
    }
  }
  const idx = geometry.getIndex();
  const triangles = idx ? Math.floor(idx.count / 3) : Math.floor(pos.count / 3);
  return { vertices: pos.count, triangles, nonFinite };
}

/** Byte-compare two position arrays for determinism. */
function positionsIdentical(a: StrokeGeometryResult, b: StrokeGeometryResult): boolean {
  const pa = a.geometry.getAttribute('position');
  const pb = b.geometry.getAttribute('position');
  if (!pa || !pb) return false;
  if (pa.array.length !== pb.array.length) return false;
  for (let i = 0; i < pa.array.length; i++) {
    if (pa.array[i] !== pb.array[i]) return false;
  }
  return true;
}

interface ModeRecord {
  mode: GeometryModeSetting;
  strokeCount: number;
  // build kinds (requested → actual)
  kinds: Array<{ requested: string; actual: string }>;
  fallbacks: number;
  // geometry stats (summed across the pool's built units)
  vertices: number;
  triangles: number;
  emptyBuilds: number; // strokes that produced 0 vertices
  nonFinite: boolean;
  // holes
  holes: number; // Shape.holes (solid.holes) + extrude.holesCut
  // joints (rod-family only)
  joints: number;
  // determinism: build pool twice, byte-compare every unit's positions
  deterministic: boolean;
}

const MODES: GeometryModeSetting[] = ['auto', 'rod', 'extrude', 'inflate', 'solid'];

function introspectMode(pool: StrokeInputPoint[][], mode: GeometryModeSetting): ModeRecord {
  const center = poolCenter(pool, SCENE_VIEWBOX);
  const kinds: Array<{ requested: string; actual: string }> = [];
  let fallbacks = 0;
  let vertices = 0;
  let triangles = 0;
  let emptyBuilds = 0;
  let nonFinite = false;
  let holes = 0;
  let joints = 0;
  let deterministic = true;

  if (mode === 'solid') {
    const b1 = buildPoolSolidGeometry(pool, { viewBox: SCENE_VIEWBOX, center });
    const b2 = buildPoolSolidGeometry(pool, { viewBox: SCENE_VIEWBOX, center });
    kinds.push({ requested: 'solid', actual: b1.kind });
    if (b1.kind !== 'solid') fallbacks++;
    const s = statsOf(b1.geometry);
    vertices += s.vertices;
    triangles += s.triangles;
    if (s.vertices === 0) emptyBuilds++;
    if (s.nonFinite) nonFinite = true;
    if (b1.kind === 'solid') holes += b1.holes;
    if (!positionsIdentical(b1, b2)) deterministic = false;
    b1.geometry.dispose();
    b2.geometry.dispose();
  } else {
    for (const points of pool) {
      const simplified = rdpPoints(points);
      const requested = mode === 'auto' ? pickGeometryMode(simplified) : (mode as GeometryMode);
      const b1 = buildStrokeGeometry(points, { viewBox: SCENE_VIEWBOX, mode, center });
      const b2 = buildStrokeGeometry(points, { viewBox: SCENE_VIEWBOX, mode, center });
      kinds.push({ requested, actual: b1.kind });
      if (b1.kind !== requested) fallbacks++;
      const s = statsOf(b1.geometry);
      vertices += s.vertices;
      triangles += s.triangles;
      if (s.vertices === 0) emptyBuilds++;
      if (s.nonFinite) nonFinite = true;
      if (b1.kind === 'rod') joints += b1.jointPositions.length;
      if (b1.kind === 'extrude') holes += b1.holesCut;
      if (b1.kind === 'solid') holes += b1.holes;
      if (!positionsIdentical(b1, b2)) deterministic = false;
      b1.geometry.dispose();
      b2.geometry.dispose();
    }
  }

  return {
    mode,
    strokeCount: pool.length,
    kinds,
    fallbacks,
    vertices,
    triangles,
    emptyBuilds,
    nonFinite,
    holes,
    joints,
    deterministic,
  };
}

// Joint cross-check: build the longest stroke as a rod at 3 joint-angle
// thresholds (the EXACT chrome path — buildStrokeGeometry mode:'rod' +
// jointAngleThresholdDeg, which runs detectJointPositions internally) and count
// the joint spheres. Proves the joint-sensitivity axis is real: lower angle =
// blobbier = more joints (Rock X invariant), held across the whole catalog.
function jointProbe(pool: StrokeInputPoint[][]): { jointsDefault: number; jointsLow: number; jointsHigh: number } {
  if (pool.length === 0) return { jointsDefault: 0, jointsLow: 0, jointsHigh: 0 };
  const longest = pool.reduce((a, b) => (b.length > a.length ? b : a), pool[0]);
  const center = poolCenter(pool, SCENE_VIEWBOX);
  const j = (deg: number) => {
    try {
      const b = buildStrokeGeometry(longest, {
        viewBox: SCENE_VIEWBOX,
        mode: 'rod',
        center,
        jointAngleThresholdDeg: deg,
      });
      const n = b.kind === 'rod' ? b.jointPositions.length : -1;
      b.geometry.dispose();
      return n;
    } catch {
      return -1;
    }
  };
  return { jointsDefault: j(40), jointsLow: j(20), jointsHigh: j(70) };
}

// ─── window API for the playwright driver ────────────────────────────────────

interface ShapeReport {
  index: number;
  kind: string;
  shape: string;
  label: string;
  // sampling
  sampledElements: number;
  skippedTextElements: number;
  skippedZeroLength: number;
  strokeCount: number;
  pointCount: number;
  empty: boolean; // no strokes sampled at all
  // closure classification (per-stroke, summed)
  closure: { closed: number; treatedAsClosed: number; open: number };
  // mark-intent labels (treatments from the auto pipeline)
  markIntent: {
    treatments: Record<string, number>; // treatment kind → unit count
    ambiguousUnits: number;
    arrowChips: number; // ambiguousClosure units (the arrow-rule chip)
    holesCutTotal: number;
    deterministic: boolean; // convertStrokePool run twice → identical unit summary
  };
  // per-mode geometry stats
  modes: ModeRecord[];
  // independent joint cross-check
  jointProbe: { jointsDefault: number; jointsLow: number; jointsHigh: number };
  // engine errors caught for this shape
  errors: string[];
}

function unitSummary(units: ReturnType<typeof convertStrokePool>['units']): string {
  return units
    .map(
      (u) =>
        `${u.treatment}|${u.intent ?? '-'}|${u.closure ?? '-'}|${u.build?.kind ?? 'none'}|b${u.band ?? '-'}|h${u.holesCut}|ac${u.ambiguousClosure ? 1 : 0}`,
    )
    .join(';');
}

declare global {
  interface Window {
    __gauntletReady: boolean;
    __gauntlet: {
      count: number;
      shapes: SweepShape[];
      run: (index: number) => Promise<ShapeReport>;
    };
  }
}

window.__gauntlet = {
  count: INVENTORY.length,
  shapes: INVENTORY,

  async run(index: number): Promise<ShapeReport> {
    const cell = INVENTORY[index];
    statusEl.textContent = `gauntlet ${index + 1}/${INVENTORY.length} — ${cell.kind}/${cell.shape}`;
    const errors: string[] = [];

    let sample: SampleResult;
    try {
      sample = await sampleShape(cell);
    } catch (e) {
      sample = { strokes: [], sampledElements: 0, skippedTextElements: 0, skippedZeroLength: 0 };
      errors.push(`sample: ${String(e).slice(0, 160)}`);
    }
    const pool = sample.strokes.filter((s) => s.length > 0).slice(0, MAX_STROKES);

    // Closure classification per stroke.
    const closure = { closed: 0, treatedAsClosed: 0, open: 0 };
    for (const s of pool) {
      try {
        const c = closureStateOf(s);
        if (c === 'closed') closure.closed++;
        else if (c === 'treated-as-closed') closure.treatedAsClosed++;
        else closure.open++;
      } catch (e) {
        errors.push(`closure: ${String(e).slice(0, 120)}`);
      }
    }

    // Mark-intent via the auto convert pipeline (engine-real, the wedge brain).
    const markIntent: ShapeReport['markIntent'] = {
      treatments: {},
      ambiguousUnits: 0,
      arrowChips: 0,
      holesCutTotal: 0,
      deterministic: true,
    };
    try {
      // analyzeMarkIntent on its own (exercises the label brain independently)
      analyzeMarkIntent(pool, SCENE_VIEWBOX);
      const r1 = convertStrokePool(pool, { mode: 'auto', viewBox: SCENE_VIEWBOX });
      const r2 = convertStrokePool(pool, { mode: 'auto', viewBox: SCENE_VIEWBOX });
      for (const u of r1.units) {
        markIntent.treatments[u.treatment] = (markIntent.treatments[u.treatment] ?? 0) + 1;
        if (u.ambiguous) markIntent.ambiguousUnits++;
        if (u.ambiguousClosure) markIntent.arrowChips++;
        markIntent.holesCutTotal += u.holesCut;
      }
      markIntent.deterministic = unitSummary(r1.units) === unitSummary(r2.units);
      // dispose built geometries from both runs
      for (const r of [r1, r2]) for (const u of r.units) u.build?.geometry.dispose();
    } catch (e) {
      errors.push(`markIntent: ${String(e).slice(0, 160)}`);
    }

    // Per-mode geometry introspection.
    const modes: ModeRecord[] = [];
    for (const mode of MODES) {
      try {
        modes.push(introspectMode(pool, mode));
      } catch (e) {
        errors.push(`mode ${mode}: ${String(e).slice(0, 160)}`);
        modes.push({
          mode,
          strokeCount: pool.length,
          kinds: [],
          fallbacks: 0,
          vertices: 0,
          triangles: 0,
          emptyBuilds: pool.length,
          nonFinite: true,
          holes: 0,
          joints: 0,
          deterministic: false,
        });
      }
    }

    let probe = { jointsDefault: 0, jointsLow: 0, jointsHigh: 0 };
    try {
      probe = jointProbe(pool);
    } catch (e) {
      errors.push(`jointProbe: ${String(e).slice(0, 120)}`);
    }

    return {
      index,
      kind: cell.kind,
      shape: cell.shape,
      label: cell.label,
      sampledElements: sample.sampledElements,
      skippedTextElements: sample.skippedTextElements,
      skippedZeroLength: sample.skippedZeroLength,
      strokeCount: pool.length,
      pointCount: pool.reduce((a, s) => a + s.length, 0),
      empty: pool.length === 0,
      closure,
      markIntent,
      modes,
      jointProbe: probe,
      errors,
    };
  },
};
window.__gauntletReady = true;
statusEl.textContent = `geometry gauntlet ready — ${INVENTORY.length} shapes × ${MODES.length} modes`;
