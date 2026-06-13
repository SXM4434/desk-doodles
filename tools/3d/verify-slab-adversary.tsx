// INDEPENDENT adversarial verifier harness — written by the verifier, NOT the
// fix author. Renders a TRUE RECTANGULAR SLAB (broad flat coplanar faces)
// through the EXACT product rig (StudioRig + createNativeMaterial +
// buildStrokeWithParams — all EXPORTED from Stroke3DScene). Distinct from
// slab-env-battery in fixture proportions, angle set (incl. a 5° grazing
// oblique below the fix author's 10° floor), and sampling (largest-flat-face
// isolation + per-channel worst warm bucket on the body).
//
// Deterministic: fixed fixtures + fixed angles, no randomness, no wall-clock.
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

const PAPER = '#FDFCF9';
const PAPER_RGB = [253, 252, 249] as const;
const SIZE = 480;

// ── MY OWN TRUE RECTANGULAR SLAB FIXTURE ────────────────────────────────────
// A literal axis-aligned rectangle. 4 corner anchors + close ⇒ ≤8 anchors ⇒
// polygonal intent ⇒ smoothClosedOutline returns it UNTOUCHED ⇒ extrude has a
// broad flat coplanar FRONT face (the worst case for a wide sheen lobe to
// mirror the warm env across). I use a WIDER, SHORTER rectangle than the fix
// author's (their 320×200; mine 380×150) so the front face is broader and the
// top face wider — maximizing the coplanar area that can catch a warm band.
const slabFixture: StrokeInputPoint[] = [
  [210, 230, 0.5],
  [590, 230, 0.5],
  [590, 380, 0.5],
  [210, 380, 0.5],
  [210, 230, 0.5],
];

const HATCH_INPUTS: HatchInputs = {
  hachureGap: 4,
  hachureAngle: -41,
  strokeWidth: 1.2,
  inkIntensity: 1.0,
};

// Slab params: max width + deep depth = biggest flat faces + tall walls.
function slabParams(): Mode3DParams {
  const d = DEFAULT_MODE3D_PARAMS;
  return {
    rod: { ...d.rod },
    extrude: { ...d.extrude, width: 1.0, depthMult: 4.0 },
    inflate: { ...d.inflate },
    solid: { ...d.solid },
  };
}

export type MatKind = MaterialPresetId | 'hatch' | 'svg-port';

interface CellState {
  mat: MatKind;
  elevDeg: number;
  azDeg: number;
}

const FRAME_K = 3.0;
const FRAME_MIN_RADIUS = 1.2;

interface Bounds {
  center: THREE.Vector3;
  radius: number;
}

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

let setCellExternal: ((s: CellState) => void) | null = null;

function VerifyApp() {
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
      <StudioRig />
      <CellMeshes state={cell} onBounds={setBounds} />
      <OrbitCamera elevDeg={cell.elevDeg} azDeg={cell.azDeg} bounds={bounds} />
    </Canvas>
  );
}

// ── MY OWN sampling — largest flat face isolation + worst warm bucket ────────
export interface VStats {
  n: number;
  // Median rgb of the LARGEST LIT FLAT FACE (dominant luminance plateau among
  // the brighter-than-median object pixels — the broad coplanar surface, not
  // the dark side and not specular pinpoints).
  face: { r: number; g: number; b: number };
  faceDelta: number; // face r − b
  faceLum: number;
  faceFrac: number; // fraction of object pixels in the dominant lit face
  // Worst warm bucket across the WHOLE body (lum < SPEC_CUT), any patch ≥ 3%.
  warmBucket: { r: number; g: number; b: number; delta: number; frac: number };
  bodyLum: number; // median luminance of the body (below specular cut)
  spread: number; // p90 − p10 lum (form gradient; anti flat-black-blob)
  // Distinctness signature components.
  specFrac: number; // fraction at/above specular cut
  p99: number;
}

function lumOf(r: number, g: number, b: number): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function median(xs: number[]): number {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

function sampleStats(canvas: HTMLCanvasElement): VStats {
  const w = canvas.width;
  const h = canvas.height;
  const c2 = document.createElement('canvas');
  c2.width = w;
  c2.height = h;
  const ctx = c2.getContext('2d')!;
  ctx.drawImage(canvas, 0, 0);
  const data = ctx.getImageData(0, 0, w, h).data;
  type PX = [number, number, number, number]; // r,g,b,lum
  const px: PX[] = [];
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (
      Math.abs(r - PAPER_RGB[0]) + Math.abs(g - PAPER_RGB[1]) + Math.abs(b - PAPER_RGB[2]) > 24
    ) {
      px.push([r, g, b, lumOf(r, g, b)]);
    }
  }
  const empty: VStats = {
    n: 0, face: { r: 0, g: 0, b: 0 }, faceDelta: 0, faceLum: 0, faceFrac: 0,
    warmBucket: { r: 0, g: 0, b: 0, delta: 0, frac: 0 },
    bodyLum: 0, spread: 0, specFrac: 0, p99: 0,
  };
  if (px.length < 50) return empty;

  px.sort((a, b) => a[3] - b[3]);
  const at = (q: number) => px[Math.min(px.length - 1, Math.floor(q * px.length))][3];
  const SPEC_CUT = 170;
  const bodyPx = px.filter((p) => p[3] < SPEC_CUT);

  // ── LARGEST LIT FLAT FACE: histogram the body luminance into 8-wide bins,
  // find the densest bin ABOVE the body median (the broad lit coplanar plateau,
  // not the dark side wall, not the few specular pinpoints). Then take the rgb
  // median over pixels within ±10 lum of that plateau center.
  const bodyMedLum = median(bodyPx.map((p) => p[3]));
  const litBody = bodyPx.filter((p) => p[3] >= bodyMedLum);
  const bins = new Map<number, number>();
  for (const p of litBody) {
    const k = Math.floor(p[3] / 8);
    bins.set(k, (bins.get(k) ?? 0) + 1);
  }
  let bestBin = -1;
  let bestCount = -1;
  for (const [k, cnt] of bins) {
    if (cnt > bestCount) { bestCount = cnt; bestBin = k; }
  }
  const plateauCenter = bestBin * 8 + 4;
  const facePx = litBody.filter((p) => Math.abs(p[3] - plateauCenter) <= 12);
  const faceR = median(facePx.map((p) => p[0]));
  const faceG = median(facePx.map((p) => p[1]));
  const faceB = median(facePx.map((p) => p[2]));

  // ── WORST WARM BUCKET across the body — 16-step rgb grid, any patch ≥ 3%.
  const buckets = new Map<string, { r: number; g: number; b: number; n: number }>();
  for (const p of bodyPx) {
    const key = `${p[0] >> 4}|${p[1] >> 4}|${p[2] >> 4}`;
    const e = buckets.get(key);
    if (e) { e.r += p[0]; e.g += p[1]; e.b += p[2]; e.n++; }
    else buckets.set(key, { r: p[0], g: p[1], b: p[2], n: 1 });
  }
  let worst = { r: 0, g: 0, b: 0, delta: 0, frac: 0 };
  for (const e of buckets.values()) {
    const cr = Math.round(e.r / e.n);
    const cg = Math.round(e.g / e.n);
    const cb = Math.round(e.b / e.n);
    const d = cr - cb;
    const frac = e.n / px.length;
    if (d > worst.delta && frac >= 0.03) {
      worst = { r: cr, g: cg, b: cb, delta: d, frac };
    }
  }

  return {
    n: px.length,
    face: { r: faceR, g: faceG, b: faceB },
    faceDelta: faceR - faceB,
    faceLum: Math.round(lumOf(faceR, faceG, faceB)),
    faceFrac: facePx.length / px.length,
    warmBucket: worst,
    bodyLum: Math.round(bodyMedLum),
    spread: Math.round(at(0.9) - at(0.1)),
    specFrac: (px.length - bodyPx.length) / px.length,
    p99: Math.round(at(0.99)),
  };
}

const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

declare global {
  interface Window {
    __vslabReady: boolean;
    __vslab: {
      renderCell: (
        mat: MatKind,
        elevDeg: number,
        azDeg: number,
      ) => Promise<{ dataUrl: string; stats: VStats }>;
    };
  }
}

window.__vslab = {
  async renderCell(mat, elevDeg, azDeg) {
    setCellExternal!({ mat, elevDeg, azDeg });
    for (let i = 0; i < 10; i++) await nextFrame();
    await new Promise((r) => setTimeout(r, 90));
    await nextFrame();
    const canvas = document.querySelector('#stage canvas') as HTMLCanvasElement;
    const stats = sampleStats(canvas);
    return { dataUrl: canvas.toDataURL('image/png'), stats };
  },
};

const root = document.getElementById('stage')!;
root.style.width = `${SIZE}px`;
root.style.height = `${SIZE}px`;
createRoot(root).render(<VerifyApp />);
window.__vslabReady = true;
