// Tier-2 family render-board harness (see tier2-board.html). Repo tool only.
//
// Every cell renders through the REAL product build path:
//   - buildStrokeWithParams (EXPORTED from Stroke3DScene — the exact function
//     /canvas 3D uses per stroke) for rod / extrude / inflate cells
//   - buildPoolSolidGeometry (the scene's solid branch, same options) for solid
//   - rodAdornmentSpecs (the scene's cap/joint placement source) for rod
//     sibling meshes
// so the contact sheets show exactly what the app shows. Rig/material values
// = mark-intent-battery-harness (the product rig minus the Environment bake).
// Deterministic: fixed fixtures, no randomness, no wall-clock.

import * as THREE from 'three';
import { buildStrokeWithParams } from '../../src/app/components/canvas3d/Stroke3DScene';
import { rodAdornmentSpecs } from '../../src/app/components/canvas3d/rodAdornments';
import {
  DEFAULT_MODE3D_PARAMS,
  type Mode3DParams,
} from '../../src/app/components/canvas3d/modeParams';
import {
  DEFAULT_VIEWBOX,
  SPHERE_SEGMENTS,
  buildPoolSolidGeometry,
  poolCenter,
  type StrokeGeometryResult,
  type StrokeInputPoint,
} from '../../src/app/lib/geometry3d/strokeTo3d';

const SIZE = 300;
const PAPER = '#FDFCF9';
const INK = '#2A2622'; // D2-E locked ink register (battery harness still carries the legacy tone)

// ── Fixtures (deterministic) ────────────────────────────────────────────────

/** Spiky open stroke — corners at mixed severities so cap ends AND joint
 *  creases both read. SHORT span + chunky board radius (0.096, a real slider
 *  value) so the cap/joint families are legible at contact-sheet size. */
const rodFixture: StrokeInputPoint[] = [
  [260, 280, 0.5],
  [350, 262, 0.5],
  [322, 330, 0.5], // sharp spike
  [400, 295, 0.5],
  [480, 330, 0.5], // gentle corner
  [560, 295, 0.5],
];
/** Board-only rod radius (slider range 0.01–0.128) — families must READ. */
const BOARD_ROD_RADIUS = 0.096;

/** Closed squircle (superellipse n=4) — straight-ish edges + rounded corners:
 *  the bevel band reads along the edges, the wall taper reads at the sides. */
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

/** Short open arc — the capsule bulge dominates, so the profile family's
 *  longitudinal taper (plateau vs point) and Z-aspect read directly. */
const sCurveFixture: StrokeInputPoint[] = (() => {
  const pts: StrokeInputPoint[] = [];
  for (let i = 0; i <= 80; i++) {
    const t = i / 80;
    pts.push([290 + 220 * t, 320 - 90 * Math.sin(t * Math.PI), 0.5]);
  }
  return pts;
})();

/** Donut ring for the Solid raster — two OPEN overshooting half-arcs whose
 *  ink bodies fuse into an annulus enclosing an empty middle (the raster's
 *  hole-classification path; the smoke suite's proven fixture family). Two
 *  CLOSED circles would scanline-fill both interiors → a disc with no hole
 *  to toggle (today's tuned Solid behavior — closed interiors are mass). */
const donutFixture: StrokeInputPoint[][] = (() => {
  const arcA: StrokeInputPoint[] = [];
  const arcB: StrokeInputPoint[] = [];
  for (let i = 0; i <= 80; i++) {
    const t1 = -0.2 + (i / 80) * (Math.PI + 0.4); // overshoot so ink overlaps
    arcA.push([400 + 150 * Math.cos(t1), 300 + 150 * Math.sin(t1), 0.5]);
    const t2 = Math.PI - 0.2 + (i / 80) * (Math.PI + 0.4);
    arcB.push([400 + 150 * Math.cos(t2), 300 + 150 * Math.sin(t2), 0.5]);
  }
  return [arcA, arcB];
})();

// ── Renderer + rig (mark-intent harness values — the product rig) ───────────

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(SIZE, SIZE);

const scene = new THREE.Scene();
scene.background = new THREE.Color(PAPER);
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
const FRAME_K = 3.0;
const FRAME_DIR = new THREE.Vector3(0.5, 0.55, 1).normalize();
/** Oblique view for slab cells — side walls + rim band must read. */
const FRAME_DIR_OBLIQUE = new THREE.Vector3(1.0, 0.65, 0.85).normalize();
const FRAME_MIN_RADIUS = 1.2;

const capSphere = new THREE.SphereGeometry(1, SPHERE_SEGMENTS, SPHERE_SEGMENTS);
const capDisk = new THREE.CylinderGeometry(1, 1, 1, 24);
const group = new THREE.Group();
scene.add(group);
let live: THREE.BufferGeometry[] = [];

type DeepPartialParams = {
  rod?: Partial<Mode3DParams['rod']>;
  extrude?: Partial<Mode3DParams['extrude']>;
  inflate?: Partial<Mode3DParams['inflate']>;
  solid?: Partial<Mode3DParams['solid']>;
};

function mergeParams(patch: DeepPartialParams): Mode3DParams {
  const d = DEFAULT_MODE3D_PARAMS;
  return {
    rod: { ...d.rod, ...patch.rod },
    extrude: { ...d.extrude, ...patch.extrude },
    inflate: { ...d.inflate, ...patch.inflate },
    solid: { ...d.solid, ...patch.solid },
  };
}

interface CellInfo {
  kind: string;
  joints?: number;
  caps?: number;
  adornments?: number;
  holes?: number;
  holesCut?: number;
  outerContours?: number;
  verts: number;
}

function frame(builds: StrokeGeometryResult[], dir: THREE.Vector3 = FRAME_DIR): void {
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
      for (const p of b.capPositions.concat(b.jointPositions, b.endPositions)) {
        min.min(new THREE.Vector3(p.x - pad, p.y - pad, p.z - pad));
        max.max(new THREE.Vector3(p.x + pad, p.y + pad, p.z + pad));
      }
    }
  }
  const center = new THREE.Vector3().addVectors(min, max).multiplyScalar(0.5);
  const radius = Math.max(new THREE.Vector3().subVectors(max, min).length() / 2, FRAME_MIN_RADIUS);
  camera.position.copy(center).addScaledVector(dir, radius * FRAME_K);
  camera.lookAt(center);
}

/** Render one cell: builds via the product path, mounts, frames, snapshots. */
function renderCell(
  mode: 'rod' | 'extrude' | 'inflate' | 'solid',
  strokes: StrokeInputPoint[][],
  patch: DeepPartialParams,
  view: 'default' | 'oblique' = 'default',
): { dataUrl: string; info: CellInfo } {
  group.clear();
  for (const g of live) g.dispose();
  live = [];

  const p = mergeParams(patch);
  const center = poolCenter(strokes, DEFAULT_VIEWBOX);
  const builds: StrokeGeometryResult[] = [];
  let adornCount = 0;

  if (mode === 'solid') {
    builds.push(
      buildPoolSolidGeometry(strokes, {
        viewBox: DEFAULT_VIEWBOX,
        center,
        inkRadius: p.solid.inkRadius,
        depth: p.solid.depth,
        rodRadius: p.rod.radius,
        holes: p.solid.holes,
        edge: p.solid.edge,
      }),
    );
  } else {
    for (const s of strokes) {
      builds.push(buildStrokeWithParams(s, DEFAULT_VIEWBOX, center, mode, p));
    }
  }

  for (const b of builds) {
    live.push(b.geometry);
    group.add(new THREE.Mesh(b.geometry, material));
    if (b.kind === 'rod') {
      const specs = rodAdornmentSpecs(b, p.rod.capStyle, p.rod.jointStyle, p.rod.caps);
      adornCount += specs.length;
      for (const spec of specs) {
        const m = new THREE.Mesh(spec.shape === 'sphere' ? capSphere : capDisk, material);
        m.position.copy(spec.position);
        m.scale.copy(spec.scale);
        m.quaternion.copy(spec.quaternion);
        group.add(m);
      }
    }
  }

  frame(builds, view === 'oblique' ? FRAME_DIR_OBLIQUE : FRAME_DIR);
  renderer.render(scene, camera);

  const b0 = builds[0];
  const info: CellInfo = {
    kind: b0.kind,
    verts: b0.geometry.getAttribute('position').count,
    adornments: adornCount,
  };
  if (b0.kind === 'rod') {
    info.joints = b0.jointPositions.length;
    info.caps = b0.capPositions.length;
  }
  if (b0.kind === 'solid') {
    info.holes = b0.holes;
    info.outerContours = b0.outerContours;
  }
  if (b0.kind === 'extrude') info.holesCut = b0.holesCut;
  return { dataUrl: renderer.domElement.toDataURL('image/png'), info };
}

// ── Cell inventory — one row per family axis, per mode ──────────────────────

interface CellSpec {
  mode: 'rod' | 'extrude' | 'inflate' | 'solid';
  label: string;
  sub: string;
  strokes: StrokeInputPoint[][];
  patch: DeepPartialParams;
  /** 'oblique' = side-on framing (slab cells — walls + rim must read). */
  view?: 'default' | 'oblique';
}

const CELLS: CellSpec[] = [
  // Rod — cap family (joint blob @40°)
  { mode: 'rod', label: 'Cap: Round', sub: 'today — FS inset sphere', strokes: [rodFixture], patch: { rod: { radius: BOARD_ROD_RADIUS, capStyle: 'round' } } },
  { mode: 'rod', label: 'Cap: Flat', sub: 'flush disk — chopped marker end', strokes: [rodFixture], patch: { rod: { radius: BOARD_ROD_RADIUS, capStyle: 'flat' } } },
  { mode: 'rod', label: 'Cap: Ink blob', sub: 'swollen tip bead — nib-rest pool', strokes: [rodFixture], patch: { rod: { radius: BOARD_ROD_RADIUS, capStyle: 'ink-blob' } } },
  // Rod — joint family (cap round)
  { mode: 'rod', label: 'Joint: Blob', sub: 'today — crease-filling spheres', strokes: [rodFixture], patch: { rod: { radius: BOARD_ROD_RADIUS, jointStyle: 'blob' } } },
  { mode: 'rod', label: 'Joint: Clean', sub: 'no spheres — mitered corner read', strokes: [rodFixture], patch: { rod: { radius: BOARD_ROD_RADIUS, jointStyle: 'clean' } } },
  // Rod — joint-sensitivity ENGINE proof (option drives strokeTo3d, no mirror)
  { mode: 'rod', label: 'Sensitivity 20°', sub: 'engine option — blobbiest', strokes: [rodFixture], patch: { rod: { radius: BOARD_ROD_RADIUS, jointSensitivityDeg: 20 } } },
  { mode: 'rod', label: 'Sensitivity 70°', sub: 'engine option — fewest blobs', strokes: [rodFixture], patch: { rod: { radius: BOARD_ROD_RADIUS, jointSensitivityDeg: 70 } } },

  // Extrude — bevel profile family (wall straight; width 1.0 / depth ×4 board
  // values — real slider settings, chunky enough for the rim/wall to read)
  { mode: 'extrude', label: 'Bevel: Sharp', sub: 'no bevel — die-cut edge', strokes: [shieldFixture], patch: { extrude: { bevelProfile: 'sharp', width: 1.0, depthMult: 4.0 } }, view: 'oblique' },
  { mode: 'extrude', label: 'Bevel: Soft', sub: 'single chamfer', strokes: [shieldFixture], patch: { extrude: { bevelProfile: 'soft', width: 1.0, depthMult: 4.0 } }, view: 'oblique' },
  { mode: 'extrude', label: 'Bevel: Rounded', sub: 'today — curved rim band', strokes: [shieldFixture], patch: { extrude: { bevelProfile: 'rounded', width: 1.0, depthMult: 4.0 } }, view: 'oblique' },
  // Extrude — side-wall family (bevel rounded)
  { mode: 'extrude', label: 'Wall: Straight', sub: 'today — vertical walls', strokes: [shieldFixture], patch: { extrude: { sideWall: 'straight', width: 1.0, depthMult: 4.0 } }, view: 'oblique' },
  { mode: 'extrude', label: 'Wall: Drafted', sub: 'back face tapers 18% — molded read', strokes: [shieldFixture], patch: { extrude: { sideWall: 'drafted', width: 1.0, depthMult: 4.0 } }, view: 'oblique' },

  // Inflate — profile family (puff 0.5, oblique so the Z-aspect reads)
  { mode: 'inflate', label: 'Profile: Balloon', sub: 'today — full round middle', strokes: [sCurveFixture], patch: { inflate: { profileFamily: 'balloon' } }, view: 'oblique' },
  { mode: 'inflate', label: 'Profile: Cushion', sub: 'pressed plateau — pillow read', strokes: [sCurveFixture], patch: { inflate: { profileFamily: 'cushion' } }, view: 'oblique' },
  { mode: 'inflate', label: 'Profile: Bead', sub: 'tight pointed bulb', strokes: [sCurveFixture], patch: { inflate: { profileFamily: 'bead' } }, view: 'oblique' },

  // Solid — edge family (holes ON) + the Holes ON/OFF engine proof
  { mode: 'solid', label: 'Edge: Eased · Holes ON', sub: 'today — rounded rim, donut keeps its hole', strokes: donutFixture, patch: { solid: { edge: 'eased', holes: true } } },
  { mode: 'solid', label: 'Edge: Crisp · Holes ON', sub: 'die-cut rim', strokes: donutFixture, patch: { solid: { edge: 'crisp', holes: true } } },
  { mode: 'solid', label: 'Edge: Eased · Holes OFF', sub: 'ENGINE proof — filled silhouette (disc)', strokes: donutFixture, patch: { solid: { edge: 'eased', holes: false } } },
  { mode: 'solid', label: 'Edge: Crisp · Holes OFF', sub: 'filled + die-cut', strokes: donutFixture, patch: { solid: { edge: 'crisp', holes: false } } },
];

// ── Page assembly + window API ──────────────────────────────────────────────

declare global {
  interface Window {
    __tier2Ready: boolean;
    __tier2: {
      cellCount: number;
      runAll: () => Array<{ mode: string; label: string; info: CellInfo }>;
    };
  }
}

window.__tier2 = {
  cellCount: CELLS.length,
  runAll() {
    const out: Array<{ mode: string; label: string; info: CellInfo }> = [];
    for (const cell of CELLS) {
      const { dataUrl, info } = renderCell(cell.mode, cell.strokes, cell.patch, cell.view);
      const grid = document.querySelector(`#board-${cell.mode} .grid`)!;
      const fig = document.createElement('figure');
      const img = document.createElement('img');
      img.src = dataUrl;
      const cap = document.createElement('figcaption');
      const sub = document.createElement('small');
      cap.textContent = cell.label;
      sub.textContent =
        cell.sub +
        (info.joints !== undefined ? ` · joints ${info.joints}` : '') +
        (info.holes !== undefined ? ` · holes ${info.holes}` : '');
      cap.appendChild(sub);
      fig.appendChild(img);
      fig.appendChild(cap);
      grid.appendChild(fig);
      out.push({ mode: cell.mode, label: cell.label, info });
    }
    return out;
  },
};
window.__tier2Ready = true;
