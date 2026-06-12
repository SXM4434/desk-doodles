// Mark-intent battery harness (see mark-intent-battery.html). Repo tool only —
// renders the 10-fixture battery (+ the supplementary donut) through the REAL
// Phase D2 conversion pipeline (convertStrokePool, mode 'auto') so every
// screenshot shows what the conversion semantics actually build:
//   - structure loops → extrude slabs (donut-parity holes cut)
//   - open structure  → rods (+ cap/joint spheres, riding contained ink)
//   - shading-gesture → NO geometry (the absence is the pass)
//   - fill-intent     → one clean solid mass per cluster
//
// Plain imperative three.js (no R3F): the harness needs determinism + a
// window API, not the app component. Material/light values are copied from
// src/app/components/canvas3d/Stroke3DScene.tsx (the product rig) minus the
// drei <Environment> bake — directional/hemisphere lighting carries the form
// read the battery needs. Deterministic: no randomness, no wall-clock.
import * as THREE from 'three';
import { MARK_INTENT_FIXTURES } from './mark-intent-fixtures';
import { convertStrokePool, type ConversionUnit } from '../../src/app/lib/geometry3d/convert';
import { SPHERE_SEGMENTS } from '../../src/app/lib/geometry3d/strokeTo3d';
import { clearConversionLog, getConversionLog } from '../../src/app/lib/smart/conversionMap';

const SIZE = 420;
const PAPER = '#FDFCF9';
// Stroke3DScene INK_SOFT_FALLBACK + MATERIAL_PARAMS (copied, tool-side).
const INK = '#5A5043';

const sceneEl = document.getElementById('scene')!;
const labelEl = document.getElementById('label')!;

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(SIZE, SIZE);
sceneEl.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(PAPER);

// Studio rig — Stroke3DScene values verbatim (minus Environment).
scene.add(new THREE.AmbientLight(0xffffff, 0.25));
scene.add(new THREE.HemisphereLight('#fff7e8', '#cdbfa6', 0.55));
const key = new THREE.DirectionalLight('#fff3e0', 1.45);
key.position.set(5, 8, 5);
scene.add(key);
const fill = new THREE.DirectionalLight('#e3eaf2', 0.5);
fill.position.set(-4, 2, -2);
scene.add(fill);
const rim = new THREE.DirectionalLight(0xffffff, 0.3);
rim.position.set(0, -3, -5);
scene.add(rim);
const point = new THREE.PointLight('#fff6e6', 75, 0, 2);
point.position.set(4, 5, 6.5);
scene.add(point);

const material = new THREE.MeshPhysicalMaterial({
  color: new THREE.Color(INK),
  roughness: 0.48,
  metalness: 0,
  clearcoat: 0.6,
  clearcoatRoughness: 0.22,
  reflectivity: 0.5,
  sheen: 0.35,
  sheenRoughness: 0.6,
  sheenColor: new THREE.Color('#d8c9ae'),
});

const camera = new THREE.PerspectiveCamera(40, 1, 0.05, 100);
// Content-fit framing — Stroke3DScene CameraFramer constants.
const FRAME_K = 3.0;
const FRAME_DIR = new THREE.Vector3(0.5, 0.55, 1).normalize();
const FRAME_MIN_RADIUS = 1.2;

const capSphere = new THREE.SphereGeometry(1, SPHERE_SEGMENTS, SPHERE_SEGMENTS);
const group = new THREE.Group();
scene.add(group);

let liveGeometries: THREE.BufferGeometry[] = [];

interface UnitSummary {
  id: string;
  strokeIndices: number[];
  treatment: string;
  intent: string | null;
  geometry: string;
  closure: string | null;
  band: number | null;
  treatedAsClosed: boolean;
  ambiguous: boolean;
  holesCut: number;
}

function summarize(u: ConversionUnit): UnitSummary {
  return {
    id: u.id,
    strokeIndices: u.strokeIndices,
    treatment: u.treatment,
    intent: u.intent,
    geometry: u.build ? u.build.kind : 'none',
    closure: u.closure,
    band: u.band,
    treatedAsClosed: u.treatedAsClosed,
    ambiguous: u.ambiguous,
    holesCut: u.holesCut,
  };
}

function mountUnits(units: ConversionUnit[]): void {
  group.clear();
  for (const g of liveGeometries) g.dispose();
  liveGeometries = [];

  const min = new THREE.Vector3(Infinity, Infinity, Infinity);
  const max = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
  for (const u of units) {
    if (!u.build) continue;
    const b = u.build;
    liveGeometries.push(b.geometry);
    group.add(new THREE.Mesh(b.geometry, material));
    b.geometry.computeBoundingBox();
    const bb = b.geometry.boundingBox;
    if (bb && Number.isFinite(bb.min.x) && Number.isFinite(bb.max.x)) {
      min.min(bb.min);
      max.max(bb.max);
    }
    if (b.kind === 'rod') {
      for (const p of b.capPositions.concat(b.jointPositions)) {
        const m = new THREE.Mesh(capSphere, material);
        m.position.copy(p);
        m.scale.setScalar(b.radius);
        group.add(m);
        min.min(new THREE.Vector3(p.x - b.radius, p.y - b.radius, p.z - b.radius));
        max.max(new THREE.Vector3(p.x + b.radius, p.y + b.radius, p.z + b.radius));
      }
    }
  }

  if (Number.isFinite(min.x) && Number.isFinite(max.x)) {
    const center = new THREE.Vector3().addVectors(min, max).multiplyScalar(0.5);
    const radius = Math.max(new THREE.Vector3().subVectors(max, min).length() / 2, FRAME_MIN_RADIUS);
    camera.position.copy(center).addScaledVector(FRAME_DIR, radius * FRAME_K);
    camera.lookAt(center);
  } else {
    camera.position.set(0, 1.5, 7);
    camera.lookAt(0, 0, 0);
  }
}

declare global {
  interface Window {
    __batteryReady: boolean;
    __battery: {
      names: string[];
      run: (index: number) => {
        name: string;
        title: string;
        supplementary: boolean;
        units: UnitSummary[];
        receipts: unknown[];
      };
    };
  }
}

window.__battery = {
  names: MARK_INTENT_FIXTURES.map((f) => f.name),
  run(index: number) {
    const fixture = MARK_INTENT_FIXTURES[index];
    clearConversionLog();
    const result = convertStrokePool(fixture.strokes, { mode: 'auto' });
    mountUnits(result.units);
    renderer.render(scene, camera);
    labelEl.textContent = `${fixture.title} · ${result.units.length} units`;
    return {
      name: fixture.name,
      title: fixture.title,
      supplementary: fixture.supplementary ?? false,
      units: result.units.map(summarize),
      // Receipts come from THE collector (window.__dd_conversionLog path) so
      // the battery proves the QW-1 pattern end-to-end, not just the return.
      receipts: getConversionLog() as unknown[],
    };
  },
};
window.__batteryReady = true;
