// Gap-cell battery harness (see gapcell-battery.html). Repo tool only.
//
// THE POINT: prove the two RATIFIED-SYMMETRY-LAW gap cells through the EXACT
// product code paths (createHatchMaterial + updateHatchUniforms with the new
// grammar/direction; createNativeMaterial with the new nativeProps; the
// inverted-hull outline material restated to match the scene; StudioRig incl.
// the Environment bake; buildStrokeWithParams geometry).
//
//   1. HATCH grammar × band — the 4 grammars (Hachure/Cross-hatch/Stipple/
//      Contour) at bands 2/4/6 on ONE form. The band darkness must be
//      consistent across grammars (one math, four renderers); the grammars
//      must look visibly distinct. A SPHERE fixture spans a smooth tone
//      gradient so every band is present at once; the driver measures ink
//      coverage inside three fixed band-windows (lit cap / equator / terminator)
//      → matched darkness across grammars per band, divergent mark shape.
//   2. DIRECTION mode — Fixed vs Light-following at 4 orbit angles. Under
//      Light-following the marks RE-ORIENT (mark angle changes with the
//      camera); under Fixed they stay put. The driver measures the dominant
//      mark orientation (FFT-free: directional gradient energy) per angle.
//   3. NATIVE dials — each of polish/reflection/sheen/outline at min & max on
//      a glossy slab: each must visibly change the surface (lit-face stats
//      move). PLUS the dangerous one: reflection MAX on a glossy slab at an
//      oblique angle must keep the tan DEAD (lit r−b < 25, ink-black holds).
//   4. DEFAULT identity — the default Native render (neutral dials) must be
//      byte-identical to a render with no nativeProps at all (the pre-law
//      path); the default Hatch (hachure/fixed) byte-identical to hatch with
//      no grammar/direction. Proven by sha1 in the driver.
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
  DEFAULT_NATIVE_PROPS_3D,
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
import {
  DEFAULT_VIEWBOX,
  poolCenter,
  type StrokeGeometryResult,
  type StrokeInputPoint,
} from '../../src/app/lib/geometry3d/strokeTo3d';

const PAPER = '#FDFCF9';
const PAPER_RGB = [253, 252, 249] as const;

// ── Fixtures ────────────────────────────────────────────────────────────────

/** Closed squircle → Extrude slab (glossy worst-case, same as material batt). */
const slabFixture: StrokeInputPoint[] = (() => {
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

const BASE_HATCH: HatchInputs = {
  hachureGap: 4,
  hachureAngle: -41,
  strokeWidth: 1.2,
  inkIntensity: 1.0,
};

// ── Cell state ───────────────────────────────────────────────────────────────

export type CellMat =
  | { kind: 'hatch'; grammar: HatchGrammar; direction: HatchDirection }
  | { kind: 'native'; preset: MaterialPresetId; native?: NativeProps3D };
/** A 'sphere' form gives the smooth tone gradient the grammar contact sheet
 *  needs; 'slab' is the glossy extrude worst-case for the native tan re-assert. */
export type CellForm = 'sphere' | 'slab';

interface CellState {
  form: CellForm;
  mat: CellMat;
  angleDeg: number;
  elevDeg: number;
}

function slabParams(): Mode3DParams {
  const d = DEFAULT_MODE3D_PARAMS;
  return {
    rod: { ...d.rod },
    extrude: { ...d.extrude, width: 1.0, depthMult: 4.0 },
    inflate: { ...d.inflate },
    solid: { ...d.solid },
  };
}

// ── Camera ───────────────────────────────────────────────────────────────────

const FRAME_K = 2.8;
const FRAME_MIN_RADIUS = 1.2;

interface Bounds {
  center: THREE.Vector3;
  radius: number;
}

function OrbitCamera({ angleDeg, elevDeg, bounds }: { angleDeg: number; elevDeg: number; bounds: Bounds | null }) {
  const camera = useThree((s) => s.camera);
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
    camera.position.copy(bounds.center).addScaledVector(dir, radius * FRAME_K);
    camera.lookAt(bounds.center);
    camera.updateProjectionMatrix();
  }, [camera, angleDeg, elevDeg, bounds]);
  return null;
}

// ── Hatch uniform + per-frame light sync (mirrors the product scene) ─────────

function HatchSync({
  material,
  grammar,
  direction,
}: {
  material: THREE.ShaderMaterial;
  grammar: HatchGrammar;
  direction: HatchDirection;
}) {
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    updateHatchUniforms(
      material,
      'hatch',
      { ...BASE_HATCH, grammar, direction },
      INK_3D_DEFAULT,
      PAPER,
      gl.getPixelRatio(),
    );
    updateHatchLightDir(material, camera.matrixWorldInverse);
  });
  return null;
}

// ── Inverted-hull outline material (restated to match Stroke3DScene) ─────────

function makeHullMaterial(push: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      u_push: { value: push },
      u_ink: { value: new THREE.Color(INK_3D_DEFAULT) },
    },
    vertexShader: `
      uniform float u_push;
      void main() {
        vec3 p = position + normal * u_push;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 u_ink;
      void main() { gl_FragColor = vec4(u_ink, 1.0); }
    `,
    side: THREE.BackSide,
    depthWrite: false,
  });
}

// ── Scene content ─────────────────────────────────────────────────────────────

function CellMeshes({ state, onBounds }: { state: CellState; onBounds: (b: Bounds) => void }) {
  const gl = useThree((s) => s.gl);

  // Geometry: sphere (built-in) or the product slab build.
  const geometry = useMemo<THREE.BufferGeometry>(() => {
    if (state.form === 'sphere') return new THREE.SphereGeometry(1, 96, 96);
    const center = poolCenter([slabFixture], DEFAULT_VIEWBOX);
    const build: StrokeGeometryResult = buildStrokeWithParams(
      slabFixture,
      DEFAULT_VIEWBOX,
      center,
      'extrude',
      slabParams(),
    );
    return build.geometry;
  }, [state.form]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  const hatchMat = useMemo(
    () => (state.mat.kind === 'hatch' ? createHatchMaterial('hatch') : null),
    [state.mat.kind],
  );
  useEffect(() => () => hatchMat?.dispose(), [hatchMat]);

  const nativeMat = useMemo(
    () =>
      state.mat.kind === 'native'
        ? createNativeMaterial(state.mat.preset, undefined, state.mat.native)
        : null,
    // re-instantiate whenever the native dials change
    [state.mat.kind, state.mat.kind === 'native' ? state.mat.preset : null, JSON.stringify(state.mat.kind === 'native' ? state.mat.native : null)],
  );
  useEffect(() => () => nativeMat?.dispose(), [nativeMat]);

  const material: THREE.Material = (hatchMat ?? nativeMat)!;

  // Native outline hull (only when native + outline > 0).
  const outline =
    state.mat.kind === 'native' ? (state.mat.native?.outline ?? 0) : 0;
  const hullMat = useMemo(() => {
    if (outline <= 0) return null;
    // bounds.radius for a unit sphere ≈ 1; for the slab ≈ build radius. Use a
    // post-bounds push in render; approximate here with the same 0.04 constant
    // × radius computed below.
    return makeHullMaterial(0); // push set after bounds via uniform update
  }, [outline]);
  useEffect(() => () => hullMat?.dispose(), [hullMat]);

  useEffect(() => {
    geometry.computeBoundingBox();
    const bb = geometry.boundingBox!;
    const center = new THREE.Vector3().addVectors(bb.min, bb.max).multiplyScalar(0.5);
    const radius = new THREE.Vector3().subVectors(bb.max, bb.min).length() / 2;
    if (hullMat) {
      (hullMat.uniforms.u_push.value as number) = outline * 0.04 * Math.max(radius, 0.5);
    }
    onBounds({ center, radius });
  }, [geometry, onBounds, hullMat, outline]);

  return (
    <group>
      {hatchMat && (
        <HatchSync
          material={hatchMat}
          grammar={state.mat.kind === 'hatch' ? state.mat.grammar : 'hachure'}
          direction={state.mat.kind === 'hatch' ? state.mat.direction : 'fixed'}
        />
      )}
      {hullMat && <mesh geometry={geometry} material={hullMat} />}
      <mesh geometry={geometry} material={material} />
    </group>
  );
}

// ── App shell ────────────────────────────────────────────────────────────────

let setCellExternal: ((s: CellState) => void) | null = null;

function BatteryApp() {
  const [cell, setCell] = useState<CellState>({
    form: 'sphere',
    mat: { kind: 'hatch', grammar: 'hachure', direction: 'fixed' },
    angleDeg: 0,
    elevDeg: 18,
  });
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
      <OrbitCamera angleDeg={cell.angleDeg} elevDeg={cell.elevDeg} bounds={bounds} />
    </Canvas>
  );
}

// ── Pixel measurement ─────────────────────────────────────────────────────────

export interface GapStats {
  n: number;
  /** Lit-face median rgb (p55–p92 luminance band) — native gates. */
  lit: { r: number; g: number; b: number };
  delta: number; // lit r−b
  lum: number;
  spread: number; // p90−p10 luminance
  /** Specular-zone luminance percentiles (where env reflection lives — the
   *  Reflection dial brightens THESE, not the diffuse body). */
  p95: number;
  p99: number;
  /** Fraction of object px brighter than 150 (specular highlight extent). */
  brightFrac: number;
  /** Ink coverage (fraction of object px that are ink-dark, lum<90) inside
   *  three vertical band windows of the object bbox (top=lit cap, mid=equator,
   *  low=terminator). Used to prove band darkness matches across grammars. */
  cov: { top: number; mid: number; low: number; all: number };
  /** Dominant mark orientation: ratio of horizontal vs vertical ink-edge
   *  energy on the object (atan2-binned). Used to detect re-orientation. */
  orient: number; // degrees, 0..180
}

function lumOf(r: number, g: number, b: number): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  return s.length === 0 ? 0 : s[Math.floor(s.length / 2)];
}

function sampleStats(canvas: HTMLCanvasElement): GapStats {
  const w = canvas.width;
  const h = canvas.height;
  const c2 = document.createElement('canvas');
  c2.width = w;
  c2.height = h;
  const ctx = c2.getContext('2d')!;
  ctx.drawImage(canvas, 0, 0);
  const data = ctx.getImageData(0, 0, w, h).data;

  // Object mask + bbox.
  const isObj = (i: number) =>
    Math.abs(data[i] - PAPER_RGB[0]) +
      Math.abs(data[i + 1] - PAPER_RGB[1]) +
      Math.abs(data[i + 2] - PAPER_RGB[2]) >
    24;
  let minY = h, maxY = 0, minX = w, maxX = 0;
  const px: Array<[number, number, number, number]> = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (!isObj(i)) continue;
      px.push([data[i], data[i + 1], data[i + 2], lumOf(data[i], data[i + 1], data[i + 2])]);
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
    }
  }
  if (px.length === 0) {
    return { n: 0, lit: { r: 0, g: 0, b: 0 }, delta: 0, lum: 0, spread: 0, p95: 0, p99: 0, brightFrac: 0, cov: { top: 0, mid: 0, low: 0, all: 0 }, orient: 0 };
  }
  const sorted = [...px].sort((a, b) => a[3] - b[3]);
  const at = (q: number) => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))][3];
  const band = sorted.slice(Math.floor(0.55 * sorted.length), Math.floor(0.92 * sorted.length));
  const litR = median(band.map((p) => p[0]));
  const litG = median(band.map((p) => p[1]));
  const litB = median(band.map((p) => p[2]));

  // Coverage in three vertical windows of the bbox.
  const bh = Math.max(1, maxY - minY);
  const INK_CUT = 90;
  const win = { top: [0, 0], mid: [0, 0], low: [0, 0] } as Record<string, [number, number]>;
  let inkAll = 0;
  for (let y = minY; y <= maxY; y++) {
    const frac = (y - minY) / bh;
    const key = frac < 0.33 ? 'top' : frac < 0.66 ? 'mid' : 'low';
    for (let x = minX; x <= maxX; x++) {
      const i = (y * w + x) * 4;
      if (!isObj(i)) continue;
      const l = lumOf(data[i], data[i + 1], data[i + 2]);
      win[key][1]++;
      if (l < INK_CUT) {
        win[key][0]++;
        inkAll++;
      }
    }
  }
  const cov = {
    top: win.top[1] ? win.top[0] / win.top[1] : 0,
    mid: win.mid[1] ? win.mid[0] / win.mid[1] : 0,
    low: win.low[1] ? win.low[0] / win.low[1] : 0,
    all: inkAll / px.length,
  };

  // Dominant mark orientation: accumulate ink-edge gradient direction over the
  // object equator band (where marks are clearest). gx/gy via simple finite
  // differences on luminance; bin atan2 into a single dominant angle (0..180).
  let sumSin2 = 0;
  let sumCos2 = 0;
  const yLo = Math.floor(minY + bh * 0.35);
  const yHi = Math.floor(minY + bh * 0.65);
  for (let y = yLo; y <= yHi; y++) {
    for (let x = minX + 1; x < maxX; x++) {
      const i = (y * w + x) * 4;
      if (!isObj(i)) continue;
      const lc = lumOf(data[i], data[i + 1], data[i + 2]);
      const lx = lumOf(data[i - 4], data[i - 3], data[i - 2]);
      const ly = lumOf(data[i - w * 4], data[i - w * 4 + 1], data[i - w * 4 + 2]);
      const gx = lc - lx;
      const gy = lc - ly;
      const mag = Math.hypot(gx, gy);
      if (mag < 16) continue;
      // double-angle to make orientation (not direction) the quantity
      const a = Math.atan2(gy, gx) * 2;
      sumSin2 += Math.sin(a) * mag;
      sumCos2 += Math.cos(a) * mag;
    }
  }
  const orient = ((Math.atan2(sumSin2, sumCos2) / 2) * 180) / Math.PI;

  let bright = 0;
  for (const p of px) if (p[3] > 150) bright++;

  return {
    n: px.length,
    lit: { r: litR, g: litG, b: litB },
    delta: litR - litB,
    lum: Math.round(lumOf(litR, litG, litB)),
    spread: Math.round(at(0.9) - at(0.1)),
    p95: Math.round(at(0.95)),
    p99: Math.round(at(0.99)),
    brightFrac: +(bright / px.length).toFixed(4),
    cov,
    orient: Math.round(((orient % 180) + 180) % 180),
  };
}

// ── Window API ────────────────────────────────────────────────────────────────

const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

declare global {
  interface Window {
    __gapReady: boolean;
    __gap: {
      renderCell: (state: CellState) => Promise<{ dataUrl: string; stats: GapStats }>;
      appendFigure: (boardId: string, label: string, sub: string, dataUrl: string, fail: boolean) => void;
    };
  }
}

window.__gap = {
  async renderCell(state) {
    setCellExternal!(state);
    for (let i = 0; i < 10; i++) await nextFrame();
    await new Promise((r) => setTimeout(r, 90));
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
window.__gapReady = true;
