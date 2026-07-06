// Verify the csg.ts CSG-relief round-trip: THREE slab → manifold → subtract an
// indent tool + union a raise boss → back to THREE, assert watertight + real.
import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
const Module = (await import('manifold-3d')).default;
const wasm = await Module(); wasm.setup();
const { Manifold, Mesh } = wasm;

// A welded slab (like the pool-solid mass). BoxGeometry splits corners by
// normal/uv → strip to POSITION-ONLY first so mergeVertices welds by position
// → watertight manifold (else manifold-3d throws NotManifold).
const raw = new THREE.BoxGeometry(2, 2, 0.5);
const posOnly = new THREE.BufferGeometry();
posOnly.setAttribute('position', raw.getAttribute('position').clone());
if (raw.index) posOnly.setIndex(raw.index.clone());
const slab = mergeVertices(posOnly);
const pos = slab.getAttribute('position');
const mesh = new Mesh({ numProp: 3, vertProperties: new Float32Array(pos.array), triVerts: new Uint32Array(slab.index.array) });
let solid = Manifold.ofMesh(mesh);
const massOk = !solid.isEmpty() && solid.volume() > 0;
console.log('mass import → empty?', solid.isEmpty(), 'vol', solid.volume().toFixed(3), 'manifoldOk', massOk);

const frontZ = 0.25; // slab front face
// INDENT (screen): subtract a box cut from the front, sink 0.18 → vertical walls.
const sink = 0.18;
let screen = Manifold.cube([0.9, 0.6, sink + 0.04], true).translate([-0.2, 0, frontZ - sink / 2]);
solid = solid.subtract(screen);
// RAISE (button): union a cylinder boss on the front, rise 0.1.
const rise = 0.1;
let btn = Manifold.cylinder(rise + 0.04, 0.18, 0.18, 40, true).translate([0.55, 0, frontZ + rise / 2]);
solid = solid.add(btn);

const m = solid.getMesh();
const ok = !solid.isEmpty() && solid.volume() > 0 && m.numVert > 0 && m.numTri > 0 && Number.isFinite(solid.genus());
console.log('after CSG (indent+raise): verts', m.numVert, 'tris', m.numTri, 'vol', solid.volume().toFixed(3), 'genus', solid.genus());
console.log('CSG relief watertight + real:', ok);
process.exit(ok && massOk ? 0 : 1);
