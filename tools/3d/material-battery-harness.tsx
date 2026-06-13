// Material × orbit-angle battery harness (see material-battery.html). Repo
// tool only.
//
// THE POINT: render every Native material preset through the EXACT product
// rig — StudioRig (scene lights + the baked <Environment>, EXPORTED from
// Stroke3DScene) + createNativeMaterial (the product's material factory) +
// buildStrokeWithParams (the product's geometry path) — at controlled orbit
// angles, and pixel-sample the lit face. The ink-black policy (3d-mode-
// controls-spec RATIFIED COLOR POLICY) bans broad warm-tan area bands from
// env reflection at EVERY angle; specular pinpoints may be bright.
//
// Sampling model per cell:
//   object pixels  = pixels that differ from the uniform paper background
//   lit-face value = component-wise median of the p55–p92 luminance band
//                    (excludes the dark side AND the top ~8% specular
//                    pinpoints — the "broad band" is what's left)
//   gates          = lit r−b < 25 (warmth bound) · lit luminance < 128
//                    (below mid) · luminance spread p90−p10 ≥ floor (form
//                    gradient, anti flat-blob)
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
import { rodAdornmentSpecs } from '../../src/app/components/canvas3d/rodAdornments';
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
  SPHERE_SEGMENTS,
  poolCenter,
  type StrokeGeometryResult,
  type StrokeInputPoint,
} from '../../src/app/lib/geometry3d/strokeTo3d';

const PAPER = '#FDFCF9'; // theme.css --dir-bg (light direction) — product bg
const PAPER_RGB = [253, 252, 249] as const;
const SIZE = 420;

// ── Fixtures (tier2-board family — deterministic) ───────────────────────────

/** Closed squircle → Extrude slab. Width 1.0 / depth ×4 (real slider values)
 *  = big flat faces + tall walls — the WORST case for broad env bands. */
const shieldFixture: StrokeInputPoint[] = (() => {
  const pts: StrokeInputPoint[] = [];
  const n = 4;
  for (let i = 0; i <= 96; i++) {
    const t = (i / 96) * Math.PI * 2;
    const c = Math.cos(t);
    const s = Math.sin(t);
    pts.push([
      400 + 190 * Math.sign(c) * Math.pow(Math.abs(c), 2 / n),
      300 + 150 * Math.sign(s) * Math.pow(Math.abs(s), 2 / n),
      0.5,
    ]);
  }
  return pts;
})();

/** Spiky open stroke → Rod (board radius 0.096 so the tube reads at size). */
const rodFixture: StrokeInputPoint[] = [
  [260, 280, 0.5],
  [350, 262, 0.5],
  [322, 330, 0.5],
  [400, 295, 0.5],
  [480, 330, 0.5],
  [560, 295, 0.5],
];
const BOARD_ROD_RADIUS = 0.096;

/** Short open arc → Inflate capsule. */
const sCurveFixture: StrokeInputPoint[] = (() => {
  const pts: StrokeInputPoint[] = [];
  for (let i = 0; i <= 80; i++) {
    const t = i / 80;
    pts.push([290 + 220 * t, 320 - 90 * Math.sin(t * Math.PI), 0.5]);
  }
  return pts;
})();

const HATCH_INPUTS: HatchInputs = {
  hachureGap: 4,
  hachureAngle: -41,
  strokeWidth: 1.2,
  inkIntensity: 1.0,
};

// ── Cell state ───────────────────────────────────────────────────────────────

export type GeomKind = 'extrude' | 'rod' | 'inflate';
export type MatKind = MaterialPresetId | 'hatch' | 'svg-port';

interface CellState {
  geom: GeomKind;
  mat: MatKind;
  angleDeg: number;
}

function paramsFor(geom: GeomKind): Mode3DParams {
  const d = DEFAULT_MODE3D_PARAMS;
  return {
    rod: { ...d.rod, radius: geom === 'rod' ? BOARD_ROD_RADIUS : d.rod.radius },
    extrude: { ...d.extrude, width: 1.0, depthMult: 4.0 },
    inflate: { ...d.inflate },
    solid: { ...d.solid },
  };
}

function strokesFor(geom: GeomKind): StrokeInputPoint[][] {
  if (geom === 'extrude') return [shieldFixture];
  if (geom === 'rod') return [rodFixture];
  return [sCurveFixture];
}

// ── Camera: exact orbit angle around Y at fixed elevation ───────────────────

const FRAME_K = 3.0;
const FRAME_MIN_RADIUS = 1.2;
const ORBIT_ELEVATION = (22 * Math.PI) / 180;

function OrbitCamera({ angleDeg, bounds }: { angleDeg: number; bounds: Bounds | null }) {
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    if (!bounds) return;
    const th = (angleDeg * Math.PI) / 180;
    const dir = new THREE.Vector3(
      Math.sin(th) * Math.cos(ORBIT_ELEVATION),
      Math.sin(ORBIT_ELEVATION),
      Math.cos(th) * Math.cos(ORBIT_ELEVATION),
    );
    const radius = Math.max(bounds.radius, FRAME_MIN_RADIUS);
    camera.position.copy(bounds.center).addScaledVector(dir, radius * FRAME_K);
    camera.lookAt(bounds.center);
    camera.updateProjectionMatrix();
  }, [camera, angleDeg, bounds]);
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
    const strokes = strokesFor(state.geom);
    const center = poolCenter(strokes, DEFAULT_VIEWBOX);
    const p = paramsFor(state.geom);
    return strokes.map((s) =>
      buildStrokeWithParams(s, DEFAULT_VIEWBOX, center, state.geom, p),
    );
  }, [state.geom]);
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

  // Rod adornments through the product placement source (caps + joints share
  // the cell material exactly like the product scene).
  const capSphere = useMemo(() => new THREE.SphereGeometry(1, SPHERE_SEGMENTS, SPHERE_SEGMENTS), []);
  const capDisk = useMemo(() => new THREE.CylinderGeometry(1, 1, 1, 24), []);
  useEffect(
    () => () => {
      capSphere.dispose();
      capDisk.dispose();
    },
    [capSphere, capDisk],
  );
  const p = paramsFor(state.geom);
  const adornments = builds.map((b) =>
    b.kind === 'rod' ? rodAdornmentSpecs(b, p.rod.capStyle, p.rod.jointStyle, p.rod.caps) : [],
  );

  // SVG-port renders its ink edge register too (product parity).
  const edges = useMemo(
    () => (state.mat === 'svg-port' ? builds.map((b) => new THREE.EdgesGeometry(b.geometry, 30)) : []),
    [builds, state.mat],
  );
  useEffect(() => () => edges.forEach((e) => e.dispose()), [edges]);
  const edgeMaterial = useMemo(() => new THREE.LineBasicMaterial({ color: new THREE.Color(INK_3D_DEFAULT) }), []);

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
      if (b.kind === 'rod') {
        const pad = b.radius * 1.5;
        for (const q of b.capPositions.concat(b.jointPositions, b.endPositions)) {
          min.min(new THREE.Vector3(q.x - pad, q.y - pad, q.z - pad));
          max.max(new THREE.Vector3(q.x + pad, q.y + pad, q.z + pad));
        }
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
    </group>
  );
}

// ── App shell ────────────────────────────────────────────────────────────────

let setCellExternal: ((s: CellState) => void) | null = null;

function BatteryApp() {
  const [cell, setCell] = useState<CellState>({ geom: 'extrude', mat: 'ink', angleDeg: 0 });
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
      <OrbitCamera angleDeg={cell.angleDeg} bounds={bounds} />
    </Canvas>
  );
}

// ── Pixel sampling ───────────────────────────────────────────────────────────

export interface CellStats {
  n: number;
  lit: { r: number; g: number; b: number };
  delta: number;
  lum: number;
  spread: number;
  p99: number;
  /** Median luminance of the object BODY — pixels below the specular cut
   *  (lum < 170). Discriminates "bright highlight on a black object" (body
   *  dark) from "grey/tan object" (body mid) on thin geometry where the
   *  area-light highlight dominates the lit band (end-on rods). */
  body: number;
  /** Fraction of object pixels at/above the specular cut. */
  specFrac: number;
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
  if (px.length === 0) {
    return {
      n: 0, lit: { r: 0, g: 0, b: 0 }, delta: 0, lum: 0, spread: 0, p99: 0, body: 0, specFrac: 0,
    };
  }
  px.sort((a, b) => a[3] - b[3]);
  const at = (q: number) => px[Math.min(px.length - 1, Math.floor(q * px.length))][3];
  const band = px.slice(Math.floor(0.55 * px.length), Math.floor(0.92 * px.length));
  const litR = median(band.map((p) => p[0]));
  const litG = median(band.map((p) => p[1]));
  const litB = median(band.map((p) => p[2]));
  const SPEC_CUT = 170;
  const bodyPx = px.filter((p) => p[3] < SPEC_CUT);
  return {
    n: px.length,
    lit: { r: litR, g: litG, b: litB },
    delta: litR - litB,
    lum: Math.round(lumOf(litR, litG, litB)),
    spread: Math.round(at(0.9) - at(0.1)),
    p99: Math.round(at(0.99)),
    body: Math.round(median(bodyPx.length > 0 ? bodyPx.map((p) => p[3]) : px.map((p) => p[3]))),
    specFrac: (px.length - bodyPx.length) / px.length,
  };
}

// ── Window API for the playwright driver ────────────────────────────────────

const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

declare global {
  interface Window {
    __matReady: boolean;
    __mat: {
      renderCell: (geom: GeomKind, mat: MatKind, angleDeg: number) => Promise<{ dataUrl: string; stats: CellStats }>;
      appendFigure: (boardId: string, label: string, sub: string, dataUrl: string, fail: boolean) => void;
    };
  }
}

window.__mat = {
  async renderCell(geom, mat, angleDeg) {
    setCellExternal!({ geom, mat, angleDeg });
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

createRoot(document.getElementById('stage')!).render(<BatteryApp />);
window.__matReady = true;
