// Step 0 — manifold-3d Make-safety SPIKE: lazy-load the WASM, do a trivial CSG
// subtract (box − cylinder), assert the result is a real watertight manifold.
// If this works in Node + a real browser, manifold is viable; the Make-iframe
// cold-load test is Sebs's deploy (the only risk I can't cover).
const t0 = Date.now();
const Module = (await import('manifold-3d')).default;
const wasm = await Module();
wasm.setup();
const { Manifold } = wasm;
const box = Manifold.cube([2, 2, 1], true);          // a slab
const hole = Manifold.cylinder(2, 0.5, 0.5, 48, true); // a screen-recess tool
const cut = Manifold.difference(box, hole);           // sheer-walled recess
const mesh = cut.getMesh();
const props = { verts: mesh.numVert, tris: mesh.numTri, genus: cut.genus(), volume: cut.volume().toFixed(3), surfaceArea: cut.surfaceArea().toFixed(3) };
// a clean box−cylinder difference is a single watertight solid: genus 0, >0 verts/tris.
const ok = mesh.numVert > 0 && mesh.numTri > 0 && Number.isFinite(cut.volume()) && props.genus === 0;
console.log('manifold CSG subtract →', JSON.stringify(props));
console.log('watertight single solid:', ok, '| load+csg', Date.now() - t0, 'ms');
box.delete(); hole.delete(); cut.delete();
process.exit(ok ? 0 : 1);
