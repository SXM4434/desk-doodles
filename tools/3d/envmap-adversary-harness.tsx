// Envmap ADVERSARY harness (see envmap-adversary.html). Repo tool only.
//
// INDEPENDENT VERIFIER for the be7aac7 env re-registration fix. This is NOT
// the fixer's material-battery re-run: two previous "all black PASS" claims
// on this exact gate fell to angle/pool sampling, so this harness attacks the
// two hiding places directly:
//
//   1. ANGLE: the battery orbits azimuth ONLY at a fixed 22° elevation. The
//      product's OrbitControls (Stroke3DScene L768) has NO polar clamp — the
//      user can view from grazing-low, from BELOW (bottom face mirrors the
//      warm fill Lightformer at [1,-2.5,2]), and from top-down (top face
//      mirrors the env upper hemisphere). Camera here = azimuth × ELEVATION
//      × distance, with deliberately adversarial elevations and off-grid
//      azimuths between the battery's 45° steps.
//   2. POOL: a whole-object median washes out a localized tan band. Stats
//      here add a spatially-LOCAL warm detector: 30px grid buckets over the
//      object mask; any bucket (≥300 object px, mean lum ≥ 40) with mean
//      r−b ≥ 25 is a warm BAND no pooled median can hide.
//
// Plus an anti-vacuous self-check: render glossyPlastic with the full
// StudioRig vs a rig WITHOUT the Environment bake. If the two are ~identical
// the env never loaded and every warmth PASS is vacuous → hard fail. The
// same toggle proves hatch/svg-port env-INdependence (ShaderMaterial,
// hatchMaterial.ts L221 — never samples scene.environment): full-vs-noenv
// must be ~identical for marks, strongly different for glossy.
//
// Renders through the EXACT product rig: StudioRig + createNativeMaterial +
// buildStrokeWithParams (exported from Stroke3DScene). Fixtures are this
// verifier's own (rounded-rect slab / W-zigzag rod / arc inflate) — NOT the
// battery's squircle, so a fixture-tuned pass cannot carry over.
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

// ── This verifier's OWN fixtures (deterministic, not the battery's) ─────────

/** Closed rounded-rect → Extrude slab (width 1.0 / depth ×4 real slider
 *  values): big flat faces, long straight walls — maximal broad-mirror area. */
const slabFixture: StrokeInputPoint[] = (() => {
  const pts: StrokeInputPoint[] = [];
  const cx = 400;
  const cy = 300;
  const hw = 210;
  const hh = 140;
  const r = 60;
  // Trace rounded rect: 4 corners as quarter arcs, edges as line samples.
  const corners = [
    [cx + hw - r, cy - hh + r, -Math.PI / 2],
    [cx + hw - r, cy + hh - r, 0],
    [cx - hw + r, cy + hh - r, Math.PI / 2],
    [cx - hw + r, cy - hh + r, Math.PI],
  ] as const;
  for (const [ax, ay, a0] of corners) {
    for (let i = 0; i <= 12; i++) {
      const a = a0 + (i / 12) * (Math.PI / 2);
      pts.push([ax + r * Math.cos(a), ay + r * Math.sin(a), 0.5]);
    }
  }
  pts.push(pts[0]);
  return pts;
})();

/** Open W-zigzag → Rod (board-scale radius so the tube reads at cell size). */
const zigzagFixture: StrokeInputPoint[] = [
  [250, 250, 0.5],
  [330, 345, 0.5],
  [410, 255, 0.5],
  [490, 345, 0.5],
  [570, 250, 0.5],
];
const ROD_RADIUS = 0.096;

/** Open arc → Inflate capsule. */
const arcFixture: StrokeInputPoint[] = (() => {
  const pts: StrokeInputPoint[] = [];
  for (let i = 0; i <= 72; i++) {
    const t = i / 72;
    pts.push([280 + 240 * t, 330 - 100 * Math.sin(t * Math.PI), 0.5]);
  }
  return pts;
})();

const HATCH_INPUTS: HatchInputs = {
  hachureGap: 4,
  hachureAngle: -41,
  strokeWidth: 1.2,
  inkIntensity: 1.0,
};

export type GeomKind = 'extrude' | 'rod' | 'inflate';
export type MatKind = MaterialPresetId | 'hatch' | 'svg-port';
export type RigKind = 'full' | 'noenv';

interface CellState {
  geom: GeomKind;
  mat: MatKind;
  az: number; // azimuth degrees
  el: number; // ELEVATION degrees (negative = from below; battery never moved this)
  k: number; // distance factor (frame radius multiplier)
  rig: RigKind;
}

function paramsFor(geom: GeomKind): Mode3DParams {
  const d = DEFAULT_MODE3D_PARAMS;
  return {
    rod: { ...d.rod, radius: geom === 'rod' ? ROD_RADIUS : d.rod.radius },
    extrude: { ...d.extrude, width: 1.0, depthMult: 4.0 },
    inflate: { ...d.inflate },
    solid: { ...d.solid },
  };
}

function strokesFor(geom: GeomKind): StrokeInputPoint[][] {
  if (geom === 'extrude') return [slabFixture];
  if (geom === 'rod') return [zigzagFixture];
  return [arcFixture];
}

// ── Camera: azimuth × elevation × distance ──────────────────────────────────

const FRAME_MIN_RADIUS = 1.2;

interface Bounds {
  center: THREE.Vector3;
  radius: number;
}

function AdversaryCamera({ az, el, k, bounds }: { az: number; el: number; k: number; bounds: Bounds | null }) {
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    if (!bounds) return;
    const a = (az * Math.PI) / 180;
    const e = (el * Math.PI) / 180;
    const dir = new THREE.Vector3(
      Math.sin(a) * Math.cos(e),
      Math.sin(e),
      Math.cos(a) * Math.cos(e),
    );
    const radius = Math.max(bounds.radius, FRAME_MIN_RADIUS);
    camera.position.copy(bounds.center).addScaledVector(dir, radius * k);
    camera.lookAt(bounds.center);
    camera.updateProjectionMatrix();
  }, [camera, az, el, k, bounds]);
  return null;
}

// ── Scene content for one cell (product geometry + material paths) ──────────

function CellMeshes({ state, onBounds }: { state: CellState; onBounds: (b: Bounds) => void }) {
  const gl = useThree((s) => s.gl);

  const builds = useMemo<StrokeGeometryResult[]>(() => {
    const strokes = strokesFor(state.geom);
    const center = poolCenter(strokes, DEFAULT_VIEWBOX);
    const p = paramsFor(state.geom);
    return strokes.map((s) => buildStrokeWithParams(s, DEFAULT_VIEWBOX, center, state.geom, p));
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

  const edges = useMemo(
    () => (state.mat === 'svg-port' ? builds.map((b) => new THREE.EdgesGeometry(b.geometry, 30)) : []),
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

/** The product scene lights WITHOUT the Environment bake — only used by the
 *  anti-vacuous self-check (glossy must change a lot; marks must not). Kept
 *  in lockstep with StudioRig's scene lights by reading the same component
 *  is impossible without a prop, so these five lights are restated verbatim;
 *  drift here only weakens the SELF-CHECK, never the product gates. */
function NoEnvRig() {
  return (
    <>
      <ambientLight intensity={0.25} />
      <hemisphereLight args={['#fff7e8', '#cdbfa6', 0.55]} />
      <directionalLight position={[5, 8, 5]} intensity={1.45} color="#fff3e0" />
      <directionalLight position={[-4, 2, -2]} intensity={0.5} color="#e3eaf2" />
      <directionalLight position={[0, -3, -5]} intensity={0.3} />
      <pointLight position={[4, 5, 6.5]} intensity={75} decay={2} color="#fff6e6" />
    </>
  );
}

// ── App shell ────────────────────────────────────────────────────────────────

let setCellExternal: ((s: CellState) => void) | null = null;

function AdversaryApp() {
  const [cell, setCell] = useState<CellState>({
    geom: 'extrude',
    mat: 'ink',
    az: 0,
    el: 22,
    k: 3.0,
    rig: 'full',
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
      {cell.rig === 'full' ? <StudioRig /> : <NoEnvRig />}
      <CellMeshes state={cell} onBounds={setBounds} />
      <AdversaryCamera az={cell.az} el={cell.el} k={cell.k} bounds={bounds} />
    </Canvas>
  );
}

// ── Pixel measurement (this verifier's own — NOT the battery's) ─────────────

export interface WarmBucket {
  d: number; // mean r−b of the worst qualifying bucket
  lum: number;
  n: number;
  rgb: [number, number, number];
  x: number; // bucket grid coords (30px cells)
  y: number;
}

export interface AdvStats {
  n: number;
  lit: { r: number; g: number; b: number }; // p55–p92 lum-band median (battery-comparable)
  delta: number; // lit r−b
  lum: number;
  mean: { r: number; g: number; b: number }; // plain mean over ALL object px
  meanDelta: number;
  spread: number; // p90−p10 luminance
  p99: number;
  body: number; // median lum of px below the specular cut (170)
  specFrac: number;
  /** Worst LOCAL warm bucket (30px grid, ≥300 object px, mean lum ≥ 40) —
   *  the detector pooled medians cannot wash out. null = no qualifying bucket. */
  worstWarm: WarmBucket | null;
  warmBucketCount: number; // qualifying buckets with mean r−b ≥ 25
}

function lumOf(r: number, g: number, b: number): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  return s.length === 0 ? 0 : s[Math.floor(s.length / 2)];
}

const BUCKET = 30;
const BUCKET_MIN_PX = 300;
const BUCKET_MIN_LUM = 40;

function sampleStats(canvas: HTMLCanvasElement): AdvStats {
  const w = canvas.width;
  const h = canvas.height;
  const c2 = document.createElement('canvas');
  c2.width = w;
  c2.height = h;
  const ctx = c2.getContext('2d')!;
  ctx.drawImage(canvas, 0, 0);
  const data = ctx.getImageData(0, 0, w, h).data;
  const px: Array<[number, number, number, number]> = [];
  const gw = Math.ceil(w / BUCKET);
  const gh = Math.ceil(h / BUCKET);
  const bSum = new Float64Array(gw * gh * 4); // r,g,b,count per bucket
  let sr = 0;
  let sg = 0;
  let sb = 0;
  for (let yy = 0; yy < h; yy++) {
    for (let xx = 0; xx < w; xx++) {
      const i = (yy * w + xx) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (
        Math.abs(r - PAPER_RGB[0]) + Math.abs(g - PAPER_RGB[1]) + Math.abs(b - PAPER_RGB[2]) >
        24
      ) {
        px.push([r, g, b, lumOf(r, g, b)]);
        sr += r;
        sg += g;
        sb += b;
        const bi = (Math.floor(yy / BUCKET) * gw + Math.floor(xx / BUCKET)) * 4;
        bSum[bi] += r;
        bSum[bi + 1] += g;
        bSum[bi + 2] += b;
        bSum[bi + 3] += 1;
      }
    }
  }
  if (px.length === 0) {
    return {
      n: 0,
      lit: { r: 0, g: 0, b: 0 },
      delta: 0,
      lum: 0,
      mean: { r: 0, g: 0, b: 0 },
      meanDelta: 0,
      spread: 0,
      p99: 0,
      body: 0,
      specFrac: 0,
      worstWarm: null,
      warmBucketCount: 0,
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
  let worstWarm: WarmBucket | null = null;
  let warmBucketCount = 0;
  for (let by = 0; by < gh; by++) {
    for (let bx = 0; bx < gw; bx++) {
      const bi = (by * gw + bx) * 4;
      const cnt = bSum[bi + 3];
      if (cnt < BUCKET_MIN_PX) continue;
      const mr = bSum[bi] / cnt;
      const mg = bSum[bi + 1] / cnt;
      const mb = bSum[bi + 2] / cnt;
      const ml = lumOf(mr, mg, mb);
      if (ml < BUCKET_MIN_LUM) continue;
      const d = mr - mb;
      if (d >= 25) warmBucketCount++;
      if (!worstWarm || d > worstWarm.d) {
        worstWarm = {
          d: Math.round(d),
          lum: Math.round(ml),
          n: cnt,
          rgb: [Math.round(mr), Math.round(mg), Math.round(mb)],
          x: bx,
          y: by,
        };
      }
    }
  }
  return {
    n: px.length,
    lit: { r: litR, g: litG, b: litB },
    delta: litR - litB,
    lum: Math.round(lumOf(litR, litG, litB)),
    mean: { r: Math.round(sr / px.length), g: Math.round(sg / px.length), b: Math.round(sb / px.length) },
    meanDelta: Math.round((sr - sb) / px.length),
    spread: Math.round(at(0.9) - at(0.1)),
    p99: Math.round(at(0.99)),
    body: Math.round(median(bodyPx.length > 0 ? bodyPx.map((p) => p[3]) : px.map((p) => p[3]))),
    specFrac: (px.length - bodyPx.length) / px.length,
    worstWarm,
    warmBucketCount,
  };
}

/** Pixel-diff two same-size dataURL renders (for the rig A/B self-checks). */
async function diffDataUrls(a: string, b: string): Promise<{ diffPx: number; maxCh: number }> {
  const load = (src: string) =>
    new Promise<HTMLImageElement>((res, rej) => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = rej;
      img.src = src;
    });
  const [ia, ib] = await Promise.all([load(a), load(b)]);
  const w = ia.width;
  const h = ia.height;
  const get = (img: HTMLImageElement) => {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const cx = c.getContext('2d')!;
    cx.drawImage(img, 0, 0);
    return cx.getImageData(0, 0, w, h).data;
  };
  const da = get(ia);
  const db = get(ib);
  let diffPx = 0;
  let maxCh = 0;
  for (let i = 0; i < da.length; i += 4) {
    const d = Math.max(
      Math.abs(da[i] - db[i]),
      Math.abs(da[i + 1] - db[i + 1]),
      Math.abs(da[i + 2] - db[i + 2]),
    );
    if (d > 2) diffPx++;
    if (d > maxCh) maxCh = d;
  }
  return { diffPx, maxCh };
}

// ── Window API for the playwright driver ────────────────────────────────────

const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

declare global {
  interface Window {
    __advReady: boolean;
    __adv: {
      renderCell: (
        geom: GeomKind,
        mat: MatKind,
        az: number,
        el: number,
        k: number,
        rig: RigKind,
      ) => Promise<{ dataUrl: string; stats: AdvStats }>;
      diff: (a: string, b: string) => Promise<{ diffPx: number; maxCh: number }>;
      appendFigure: (boardId: string, label: string, sub: string, dataUrl: string, fail: boolean) => void;
    };
  }
}

window.__adv = {
  async renderCell(geom, mat, az, el, k, rig) {
    setCellExternal!({ geom, mat, az, el, k, rig });
    for (let i = 0; i < 8; i++) await nextFrame();
    await new Promise((r) => setTimeout(r, 90));
    await nextFrame();
    const canvas = document.querySelector('#stage canvas') as HTMLCanvasElement;
    const stats = sampleStats(canvas);
    return { dataUrl: canvas.toDataURL('image/png'), stats };
  },
  diff: diffDataUrls,
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

createRoot(document.getElementById('stage')!).render(<AdversaryApp />);
window.__advReady = true;
