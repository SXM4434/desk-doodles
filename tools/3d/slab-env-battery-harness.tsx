// TRUE-SLAB env-reflection battery harness (see slab-env-battery.html). Repo
// tool only.
//
// THE FIXTURE FIX (2026-06-13): the material-battery used a SQUIRCLE
// (superellipse n=4) — rounded corners, no broad flat coplanar faces. This
// harness uses a TRUE AXIS-ALIGNED RECTANGLE (4-anchor closed loop → polygonal
// intent → straight edges, sharp corners → buildExtrudeGeometry produces broad
// flat FRONT / TOP / SIDE coplanar faces). On a flat coplanar face, rubber's +
// softGel's WIDE sheen lobe broadly MIRRORS the warm <Environment> KEY + FILL
// panels — the milk-chocolate band the squircle's curvature hid.
//
// SWEEP: ALL 6 presets × 9 angles (elevations 10/22/35° × azimuths 0/45/67°) +
// a distinctness strip + hatch/svg-port identity cells. Renders through the
// EXACT product rig: StudioRig (lights + Environment bake) + createNativeMaterial
// + buildStrokeWithParams — all EXPORTED from Stroke3DScene.
//
// Sampling model per cell (same as material-battery, so gates are comparable):
//   object pixels  = pixels differing from the uniform paper background
//   lit-face value = component-wise median of the p55–p92 luminance band
//                    (excludes the dark side AND the top ~8% specular pinpoints)
//   gates          = lit r−b < 18 (TIGHTER warmth bound for the flat-face case)
//                    · lit luminance < 128 · spread (form gradient)
//
// Deterministic: fixed fixtures, fixed angles, no randomness, no wall-clock.
import { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  StudioRig,
  buildStrokeWithParams,
  createNativeMaterial,
} from '../../src/app/components/canvas3d/Stroke3DScene';
import {
  DEFAULT_MODE3D_PARAMS,
  type Mode3DParams,
} from '../../src/app/components/canvas3d/modeParams';
import {
  INK_3D_DEFAULT,
  type MaterialPresetId,
} from '../../src/app/components/canvas3d/materials3d';
import {
  createHatchMaterial,
  updateHatchUniforms,
  type HatchInputs,
} from '../../src/app/components/canvas3d/hatchMaterial';
import {
  DEFAULT_VIEWBOX,
  poolCenter,
  type StrokeGeometryResult,
  type StrokeInputPoint,
} from '../../src/app/lib/geometry3d/strokeTo3d';

const PAPER = '#FDFCF9'; // theme.css --dir-bg (light direction) — product bg
const PAPER_RGB = [253, 252, 249] as const;
const SIZE = 460;

// ── THE TRUE RECTANGULAR SLAB FIXTURE ───────────────────────────────────────
// A literal axis-aligned rectangle: 4 corner anchors, closed. ≤8 anchors ⇒
// polygonal intent ⇒ smoothClosedOutline leaves it UNTOUCHED ⇒ the extrude has
// broad flat coplanar FRONT (zMax), TOP, BOTTOM and SIDE faces — the exact
// geometry the squircle never had. Centered in the 800×600 viewBox; wide enough
// that the front face fills a big share of the frame at every orbit angle.
const slabFixture: StrokeInputPoint[] = [
  [240, 200, 0.5],
  [560, 200, 0.5],
  [560, 400, 0.5],
  [240, 400, 0.5],
  [240, 200, 0.5], // explicit close (dedupeClosedLoop drops the dup)
];

const HATCH_INPUTS: HatchInputs = {
  hachureGap: 4,
  hachureAngle: -41,
  strokeWidth: 1.2,
  inkIntensity: 1.0,
};

// ── Cell state ───────────────────────────────────────────────────────────────

export type MatKind = MaterialPresetId | 'hatch' | 'svg-port';

interface CellState {
  mat: MatKind;
  elevDeg: number;
  azDeg: number;
}

/** Slab params — width 1.0 + depth ×4 = big flat faces + tall walls (the worst
 *  case for a broad env band). Real slider-equivalent values. */
function slabParams(): Mode3DParams {
  const d = DEFAULT_MODE3D_PARAMS;
  return {
    rod: { ...d.rod },
    extrude: { ...d.extrude, width: 1.0, depthMult: 4.0 },
    inflate: { ...d.inflate },
    solid: { ...d.solid },
  };
}

// ── Camera: explicit elevation × azimuth orbit ──────────────────────────────

const FRAME_K = 3.0;
const FRAME_MIN_RADIUS = 1.2;

function OrbitCamera({
  elevDeg,
  azDeg,
  bounds,
}: {
  elevDeg: number;
  azDeg: number;
  bounds: Bounds | null;
}) {
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    if (!bounds) return;
    const el = (elevDeg * Math.PI) / 180;
    const az = (azDeg * Math.PI) / 180;
    const dir = new THREE.Vector3(
      Math.sin(az) * Math.cos(el),
      Math.sin(el),
      Math.cos(az) * Math.cos(el),
    );
    const radius = Math.max(bounds.radius, FRAME_MIN_RADIUS);
    camera.position.copy(bounds.center).addScaledVector(dir, radius * FRAME_K);
    camera.lookAt(bounds.center);
    camera.updateProjectionMatrix();
  }, [camera, elevDeg, azDeg, bounds]);
  return null;
}

interface Bounds {
  center: THREE.Vector3;
  radius: number;
}

// ── Scene content for one cell ───────────────────────────────────────────────

function CellMeshes({ state, onBounds }: { state: CellState; onBounds: (b: Bounds) => void }) {
  const gl = useThree((s) => s.gl);

  const builds = useMemo<StrokeGeometryResult[]>(() => {
    const strokes = [slabFixture];
    const center = poolCenter(strokes, DEFAULT_VIEWBOX);
    const p = slabParams();
    return strokes.map((s) => buildStrokeWithParams(s, DEFAULT_VIEWBOX, center, 'extrude', p));
  }, []);
  useEffect(() => () => builds.forEach((b) => b.geometry.dispose()), [builds]);

  const material = useMemo<THREE.Material>(() => {
    if (state.mat === 'hatch' || state.mat === 'svg-port') {
      const m = createHatchMaterial(state.mat);
      updateHatchUniforms(m, state.mat, HATCH_INPUTS, INK_3D_DEFAULT, PAPER, gl.getPixelRatio());
      return m;
    }
    return createNativeMaterial(state.mat);
  }, [state.mat, gl]);
  useEffect(() => () => material.dispose(), [material]);

  // SVG-port renders its ink edge register too (product parity).
  const edges = useMemo(
    () =>
      state.mat === 'svg-port'
        ? builds.map((b) => new THREE.EdgesGeometry(b.geometry, 30))
        : [],
    [builds, state.mat],
  );
  useEffect(() => () => edges.forEach((e) => e.dispose()), [edges]);
  const edgeMaterial = useMemo(
    () => new THREE.LineBasicMaterial({ color: new THREE.Color(INK_3D_DEFAULT) }),
    [],
  );

  useEffect(() => {
    const min = new THREE.Vector3(Infinity, Infinity, Infinity);
    const max = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
    for (const b of builds) {
      b.geometry.computeBoundingBox();
      const bb = b.geometry.boundingBox;
      if (bb && Number.isFinite(bb.min.x) && Number.isFinite(bb.max.x)) {
        min.min(bb.min);
        max.max(bb.max);
      }
    }
    const center = new THREE.Vector3().addVectors(min, max).multiplyScalar(0.5);
    const radius = new THREE.Vector3().subVectors(max, min).length() / 2;
    onBounds({ center, radius });
  }, [builds, onBounds]);

  return (
    <group>
      {builds.map((b, i) => (
        <group key={i}>
          <mesh geometry={b.geometry} material={material} />
          {state.mat === 'svg-port' && edges[i] && (
            <lineSegments geometry={edges[i]} material={edgeMaterial} />
          )}
        </group>
      ))}
    </group>
  );
}

// ── App shell ────────────────────────────────────────────────────────────────

let setCellExternal: ((s: CellState) => void) | null = null;

function BatteryApp() {
  const [cell, setCell] = useState<CellState>({ mat: 'ink', elevDeg: 22, azDeg: 0 });
  const [bounds, setBounds] = useState<Bounds | null>(null);
  setCellExternal = setCell;
  return (
    <Canvas
      dpr={1}
      camera={{ position: [0, 1.5, 7], fov: 40 }}
      gl={{ antialias: true, preserveDrawingBuffer: true }}
      style={{ width: '100%', height: '100%' }}
    >
      <color attach="background" args={[PAPER]} />
      {/* THE rig under test — the product's exported StudioRig, Environment
          bake included. */}
      <StudioRig />
      <CellMeshes state={cell} onBounds={setBounds} />
      <OrbitCamera elevDeg={cell.elevDeg} azDeg={cell.azDeg} bounds={bounds} />
    </Canvas>
  );
}

// ── Pixel sampling (identical model to material-battery) ─────────────────────

export interface CellStats {
  n: number;
  lit: { r: number; g: number; b: number };
  delta: number;
  lum: number;
  spread: number;
  p99: number;
  /** Median luminance of the object BODY — pixels below the specular cut. */
  body: number;
  /** Fraction of object pixels at/above the specular cut. */
  specFrac: number;
  /** WORST local warm bucket: scan object pixels in a coarse rgb-grid, find the
   *  bucket with the most pixels among warm (r−b ≥ 18) buckets, report its
   *  center + count fraction. Catches a LOCAL warm patch a global median hides
   *  (the prompt's "local warm buckets Δ30 rgb(118,104,87)" failure shape). */
  warmBucket: { r: number; g: number; b: number; delta: number; frac: number };
}

function lumOf(r: number, g: number, b: number): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  return s.length === 0 ? 0 : s[Math.floor(s.length / 2)];
}

function sampleStats(canvas: HTMLCanvasElement): CellStats {
  const w = canvas.width;
  const h = canvas.height;
  const c2 = document.createElement('canvas');
  c2.width = w;
  c2.height = h;
  const ctx = c2.getContext('2d')!;
  ctx.drawImage(canvas, 0, 0);
  const data = ctx.getImageData(0, 0, w, h).data;
  const px: Array<[number, number, number, number]> = [];
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (
      Math.abs(r - PAPER_RGB[0]) + Math.abs(g - PAPER_RGB[1]) + Math.abs(b - PAPER_RGB[2]) >
      24
    ) {
      px.push([r, g, b, lumOf(r, g, b)]);
    }
  }
  const empty: CellStats = {
    n: 0, lit: { r: 0, g: 0, b: 0 }, delta: 0, lum: 0, spread: 0, p99: 0, body: 0, specFrac: 0,
    warmBucket: { r: 0, g: 0, b: 0, delta: 0, frac: 0 },
  };
  if (px.length === 0) return empty;
  px.sort((a, b) => a[3] - b[3]);
  const at = (q: number) => px[Math.min(px.length - 1, Math.floor(q * px.length))][3];
  const band = px.slice(Math.floor(0.55 * px.length), Math.floor(0.92 * px.length));
  const litR = median(band.map((p) => p[0]));
  const litG = median(band.map((p) => p[1]));
  const litB = median(band.map((p) => p[2]));
  const SPEC_CUT = 170;
  const bodyPx = px.filter((p) => p[3] < SPEC_CUT);

  // ── Local worst warm bucket — 16-step rgb grid over object pixels.
  const buckets = new Map<string, { r: number; g: number; b: number; n: number }>();
  for (const p of px) {
    const key = `${p[0] >> 4}|${p[1] >> 4}|${p[2] >> 4}`;
    const e = buckets.get(key);
    if (e) {
      e.r += p[0]; e.g += p[1]; e.b += p[2]; e.n++;
    } else {
      buckets.set(key, { r: p[0], g: p[1], b: p[2], n: 1 });
    }
  }
  let worst = { r: 0, g: 0, b: 0, delta: 0, frac: 0 };
  for (const e of buckets.values()) {
    const cr = Math.round(e.r / e.n);
    const cg = Math.round(e.g / e.n);
    const cb = Math.round(e.b / e.n);
    const d = cr - cb;
    const frac = e.n / px.length;
    // Only consider buckets that are an appreciable broad patch (≥4%) AND not
    // a bright specular pinpoint (body of the slab, lum < SPEC_CUT) — a broad
    // warm patch on the dark body is exactly the milk-chocolate band.
    if (d > worst.delta && frac >= 0.04 && lumOf(cr, cg, cb) < SPEC_CUT) {
      worst = { r: cr, g: cg, b: cb, delta: d, frac };
    }
  }

  return {
    n: px.length,
    lit: { r: litR, g: litG, b: litB },
    delta: litR - litB,
    lum: Math.round(lumOf(litR, litG, litB)),
    spread: Math.round(at(0.9) - at(0.1)),
    p99: Math.round(at(0.99)),
    body: Math.round(median(bodyPx.length > 0 ? bodyPx.map((p) => p[3]) : px.map((p) => p[3]))),
    specFrac: (px.length - bodyPx.length) / px.length,
    warmBucket: worst,
  };
}

// ── Window API for the playwright driver ────────────────────────────────────

const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

declare global {
  interface Window {
    __slabReady: boolean;
    __slab: {
      renderCell: (
        mat: MatKind,
        elevDeg: number,
        azDeg: number,
      ) => Promise<{ dataUrl: string; stats: CellStats }>;
      appendFigure: (boardId: string, label: string, sub: string, dataUrl: string, fail: boolean) => void;
    };
  }
}

window.__slab = {
  async renderCell(mat, elevDeg, azDeg) {
    setCellExternal!({ mat, elevDeg, azDeg });
    // Settle: geometry/material memo swap + camera effect + a few frames.
    for (let i = 0; i < 8; i++) await nextFrame();
    await new Promise((r) => setTimeout(r, 80));
    await nextFrame();
    const canvas = document.querySelector('#stage canvas') as HTMLCanvasElement;
    const stats = sampleStats(canvas);
    return { dataUrl: canvas.toDataURL('image/png'), stats };
  },
  appendFigure(boardId, label, sub, dataUrl, fail) {
    const grid = document.querySelector(`#board-${boardId} .grid`)!;
    const fig = document.createElement('figure');
    const img = document.createElement('img');
    img.src = dataUrl;
    const cap = document.createElement('figcaption');
    cap.textContent = label;
    const small = document.createElement('small');
    small.textContent = sub;
    if (fail) small.className = 'fail';
    cap.appendChild(small);
    fig.appendChild(img);
    fig.appendChild(cap);
    grid.appendChild(fig);
  },
};

const root = document.getElementById('stage')!;
root.style.width = `${SIZE}px`;
root.style.height = `${SIZE}px`;
createRoot(root).render(<BatteryApp />);
window.__slabReady = true;
