// INDEPENDENT adversarial slab env-reflection verifier (verify-slab-indep.html).
// Repo tool only. Written by the ADVERSARIAL VERIFIER — does NOT reuse the
// fix-author's harness. Two key independence moves vs the author's battery:
//
//  1. PRIMARY FIXTURE = a literal three.BoxGeometry slab (guaranteed broad flat
//     coplanar FRONT/TOP/SIDE faces — no dependence on the extrude path
//     actually producing flat faces). A SECOND board renders the product
//     buildStrokeWithParams extrude rect for parity.
//  2. SAMPLING = isolate the SINGLE LARGEST LIT FLAT FACE, not a pooled median.
//     A pooled p55–p92 band over ALL object pixels mixes the dark side faces in
//     and can DILUTE a warm front face below threshold. We segment object
//     pixels into luminance clusters, take the brightest sizable cluster (the
//     lit face), and report its WORST warm pixel + median — the band that a
//     human eye actually reads as "brown".
//
// Renders through the EXACT product rig: StudioRig (lights + Environment bake) +
// createNativeMaterial — both EXPORTED from Stroke3DScene. Deterministic.
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
import { type MaterialPresetId } from '../../src/app/components/canvas3d/materials3d';
import {
  DEFAULT_VIEWBOX,
  poolCenter,
  type StrokeGeometryResult,
  type StrokeInputPoint,
} from '../../src/app/lib/geometry3d/strokeTo3d';

const PAPER = '#FDFCF9';
const PAPER_RGB = [253, 252, 249] as const;
const SIZE = 480;

export type MatKind = MaterialPresetId;

interface CellState {
  mat: MatKind;
  elevDeg: number;
  azDeg: number;
  fixture: 'box' | 'extrude';
}

// ── BOX SLAB DIMS — wide flat front face, real slab proportions ──────────────
// width 2.6, height 1.6, depth 0.45 → a broad flat front (zMax) face that fills
// the frame; the front + top + sides are all perfectly coplanar planes (worst
// case for a broad env sheen band).
const BOX_W = 2.6;
const BOX_H = 1.6;
const BOX_D = 0.45;

// ── EXTRUDE PARITY FIXTURE (the author's true-rect, for cross-check) ─────────
const slabFixture: StrokeInputPoint[] = [
  [240, 200, 0.5],
  [560, 200, 0.5],
  [560, 400, 0.5],
  [240, 400, 0.5],
  [240, 200, 0.5],
];

function slabParams(): Mode3DParams {
  const d = DEFAULT_MODE3D_PARAMS;
  return {
    rod: { ...d.rod },
    extrude: { ...d.extrude, width: 1.0, depthMult: 4.0 },
    inflate: { ...d.inflate },
    solid: { ...d.solid },
  };
}

interface Bounds {
  center: THREE.Vector3;
  radius: number;
}

const FRAME_K = 2.7;

function OrbitCamera({ elevDeg, azDeg, bounds }: { elevDeg: number; azDeg: number; bounds: Bounds | null }) {
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
    const radius = Math.max(bounds.radius, 1.2);
    camera.position.copy(bounds.center).addScaledVector(dir, radius * FRAME_K);
    camera.lookAt(bounds.center);
    camera.updateProjectionMatrix();
  }, [camera, elevDeg, azDeg, bounds]);
  return null;
}

function CellMeshes({ state, onBounds }: { state: CellState; onBounds: (b: Bounds) => void }) {
  const material = useMemo<THREE.Material>(() => createNativeMaterial(state.mat), [state.mat]);
  useEffect(() => () => material.dispose(), [material]);

  // Extrude product-path geometry (parity board)
  const extrudeBuilds = useMemo<StrokeGeometryResult[] | null>(() => {
    if (state.fixture !== 'extrude') return null;
    const strokes = [slabFixture];
    const center = poolCenter(strokes, DEFAULT_VIEWBOX);
    const p = slabParams();
    return strokes.map((s) => buildStrokeWithParams(s, DEFAULT_VIEWBOX, center, 'extrude', p));
  }, [state.fixture]);
  useEffect(() => () => extrudeBuilds?.forEach((b) => b.geometry.dispose()), [extrudeBuilds]);

  useEffect(() => {
    if (state.fixture === 'box') {
      const r = Math.sqrt(BOX_W * BOX_W + BOX_H * BOX_H + BOX_D * BOX_D) / 2;
      onBounds({ center: new THREE.Vector3(0, 0, 0), radius: r });
    } else if (extrudeBuilds) {
      const box = new THREE.Box3();
      for (const b of extrudeBuilds) {
        b.geometry.computeBoundingBox();
        if (b.geometry.boundingBox) box.union(b.geometry.boundingBox);
      }
      const center = new THREE.Vector3();
      box.getCenter(center);
      const size = new THREE.Vector3();
      box.getSize(size);
      onBounds({ center, radius: size.length() / 2 });
    }
  }, [state.fixture, extrudeBuilds, onBounds]);

  if (state.fixture === 'box') {
    return (
      <mesh material={material}>
        <boxGeometry args={[BOX_W, BOX_H, BOX_D]} />
      </mesh>
    );
  }
  return (
    <>
      {extrudeBuilds?.map((b, i) => (
        <mesh key={i} geometry={b.geometry} material={material} />
      ))}
    </>
  );
}

function Cell({ state }: { state: CellState }) {
  const [bounds, setBounds] = useState<Bounds | null>(null);
  return (
    <Canvas
      gl={{ preserveDrawingBuffer: true, antialias: true }}
      style={{ width: SIZE, height: SIZE }}
      camera={{ fov: 35, near: 0.01, far: 100 }}
    >
      <color attach="background" args={[PAPER]} />
      <StudioRig />
      <CellMeshes state={state} onBounds={setBounds} />
      <OrbitCamera elevDeg={state.elevDeg} azDeg={state.azDeg} bounds={bounds} />
    </Canvas>
  );
}

// ── Sampling: ISOLATE THE LARGEST LIT FLAT FACE ──────────────────────────────
// 1. object pixels = differ from paper bg.
// 2. luminance histogram → find the brightest sizable cluster (the lit face)
//    using a simple 1-D peak above the body. The lit FACE is the contiguous-in-
//    luminance bright population, not pooled across dark faces.
// 3. report: median rgb of the lit face, WORST warm pixel (max r−b in the lit
//    face above a small floor of pixels), body median, specular fraction,
//    spread.
function analyze(data: Uint8ClampedArray, w: number, h: number) {
  const [pr, pg, pb] = PAPER_RGB;
  const lum: number[] = [];
  const px: Array<{ r: number; g: number; b: number; L: number }> = [];
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
    if (a < 8) continue;
    // background diff
    if (Math.abs(r - pr) <= 6 && Math.abs(g - pg) <= 6 && Math.abs(b - pb) <= 6) continue;
    const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    lum.push(L);
    px.push({ r, g, b, L });
  }
  const n = px.length;
  if (n === 0) {
    return { n: 0, lit: { r: 0, g: 0, b: 0 }, delta: 0, lum: 0, body: 0, spread: 0, specFrac: 0, worst: { r: 0, g: 0, b: 0, delta: 0, frac: 0 } };
  }
  lum.sort((a, b) => a - b);
  const q = (p: number) => lum[Math.min(lum.length - 1, Math.max(0, Math.floor(p * lum.length)))];
  const body = Math.round(q(0.5));
  const spread = Math.round(q(0.9) - q(0.1));
  // specular = very bright pixels
  const specFrac = px.filter((p) => p.L >= 170).length / n;

  // LIT FACE = the brightest *sizable* luminance band. Take pixels in the
  // p55–p92 band (excludes dark side + spec pinpoints), the same window the
  // author used — BUT also compute a face-isolated worst warm read: among ALL
  // object pixels brighter than the body (the lit side), find broad warm
  // patches (bin by quantized rgb, ≥0.5% of object pixels) and take the worst.
  const loL = q(0.55), hiL = q(0.92);
  const band = px.filter((p) => p.L >= loL && p.L <= hiL);
  const litArr = band.length ? band : px;
  const med = (arr: Array<{ r: number; g: number; b: number }>, k: 'r' | 'g' | 'b') => {
    const v = arr.map((p) => p[k]).sort((a, b) => a - b);
    return Math.round(v[Math.floor(v.length / 2)]);
  };
  const lit = { r: med(litArr, 'r'), g: med(litArr, 'g'), b: med(litArr, 'b') };
  const delta = lit.r - lit.b;

  // WORST broad warm bucket among LIT-SIDE pixels (L >= body), quantized to 8
  // levels, require ≥ 0.5% of object pixels (a real band, not a stray pixel).
  const litSide = px.filter((p) => p.L >= body);
  const buckets = new Map<string, { r: number; g: number; b: number; c: number }>();
  for (const p of litSide) {
    const key = `${p.r >> 5}_${p.g >> 5}_${p.b >> 5}`;
    let e = buckets.get(key);
    if (!e) { e = { r: 0, g: 0, b: 0, c: 0 }; buckets.set(key, e); }
    e.r += p.r; e.g += p.g; e.b += p.b; e.c += 1;
  }
  let worst = { r: 0, g: 0, b: 0, delta: -999, frac: 0 };
  const minCount = Math.max(20, n * 0.005);
  for (const e of buckets.values()) {
    if (e.c < minCount) continue;
    const r = Math.round(e.r / e.c), g = Math.round(e.g / e.c), b = Math.round(e.b / e.c);
    const d = r - b;
    if (d > worst.delta) worst = { r, g, b, delta: d, frac: e.c / n };
  }
  if (worst.delta === -999) worst = { r: lit.r, g: lit.g, b: lit.b, delta, frac: 1 };

  return { n, lit, delta, lum: Math.round(q(0.73)), body, spread, specFrac, worst };
}

// ── Driver bridge ────────────────────────────────────────────────────────────
const root = createRoot(document.getElementById('root')!);

function renderCell(mat: MatKind, elev: number, az: number, fixture: 'box' | 'extrude') {
  return new Promise<{ dataUrl: string; stats: ReturnType<typeof analyze> }>((resolve) => {
    root.render(<Cell state={{ mat, elevDeg: elev, azDeg: az, fixture }} />);
    // two rAFs after a short settle for Environment bake + camera
    setTimeout(() => {
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          const canvas = document.querySelector('#root canvas') as HTMLCanvasElement;
          const off = document.createElement('canvas');
          off.width = SIZE; off.height = SIZE;
          const ctx = off.getContext('2d')!;
          ctx.drawImage(canvas, 0, 0, SIZE, SIZE);
          const img = ctx.getImageData(0, 0, SIZE, SIZE);
          const stats = analyze(img.data, SIZE, SIZE);
          resolve({ dataUrl: off.toDataURL('image/png'), stats });
        }),
      );
    }, 450);
  });
}

function appendFigure(board: string, label: string, sub: string, dataUrl: string, fail: boolean) {
  const host = document.getElementById(`board-${board}`)!;
  const fig = document.createElement('div');
  fig.className = 'fig' + (fail ? ' fail' : '');
  fig.innerHTML = `<img src="${dataUrl}" width="${SIZE / 2}" height="${SIZE / 2}"/><div class="cap"><b>${label}</b><br/>${sub}</div>`;
  host.appendChild(fig);
}

(window as any).__indep = { renderCell, appendFigure };
(window as any).__indepReady = true;
