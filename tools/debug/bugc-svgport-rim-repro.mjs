// ─── BUG C repro — svg-port jagged rim vs native-solid rim ───────────────────
// Pure-geometry node repro. Builds the SAME pool-solid mass that svg-port routes
// through (Stroke3DScene `builds` useMemo → buildPoolSolidGeometry), then mimics
// the svg-port-ONLY extra step (TessellateModifier(0.04,5) + applyPlanarReliefUVs
// + a displacementMap-style push) to see whether the RIM contour is:
//   (A) smooth & shared (Chaikin applied) — disproves the "bypass" hypothesis, or
//   (B) re-faceted by tessellation/displacement — the real jagged-rim mechanism.
//
//   node tools/debug/bugc-svgport-rim-repro.mjs
//
// Read-only on src/. three is pure JS; node ≥23.6 strips TS types.

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const THREE = await import(new URL('../../node_modules/three/build/three.module.js', import.meta.url));
// TessellateModifier lives in examples/jsm.
let TessellateModifier;
try {
  ({ TessellateModifier } = await import(new URL('../../node_modules/three/examples/jsm/modifiers/TessellateModifier.js', import.meta.url)));
} catch (e2) { console.log('NO_TESSELLATE_MODIFIER', e2.message); }

const mod = await import(new URL('../../src/app/lib/geometry3d/strokeTo3d.ts', import.meta.url));
const {
  buildPoolSolidGeometry,
  buildSolidGeometry,
  extractPoolRegions,
  normalizeStrokePoints,
  rdpPoints,
  isClosedStroke,
  DEFAULT_VIEWBOX,
  WORLD_SCALE,
  poolCenter,
} = mod;

const tex = await import(new URL('../../src/app/components/canvas3d/drawingTexture.ts', import.meta.url)).catch((e) => {
  console.log('drawingTexture import failed (DOM canvas dep) —', e.message);
  return null;
});

// ── A circle drawn as a polyline (the classic "14-gon facet" case) ──
function circle(cx, cy, r, n) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    pts.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]);
  }
  pts.push(pts[0].slice());
  return pts;
}

const vb = DEFAULT_VIEWBOX; // 800x600
const strokeCircle = circle(400, 300, 180, 48);
const pool = [strokeCircle];
const center = poolCenter(pool, vb);

// ── 1. The pool-solid mass (what BOTH native-solid and svg-port build) ──
const mass = buildPoolSolidGeometry(pool, {
  viewBox: vb,
  center,
  inkRadius: 0.08,
  depth: 0.5,
  rodRadius: 0.032,
  holes: true,
  edge: 'eased',
});
console.log('\n=== 1. POOL-SOLID MASS (shared by native-solid + svg-port) ===');
console.log('kind=', mass.kind, 'outerContours=', mass.outerContours, 'holes=', mass.holes);

// Front-cap rim contour: extract the boundary at the front z plane.
// ExtrudeGeometry front cap is at z = +depth/2 - depth/2 = 0 after translate; the
// silhouette ring is the set of UNIQUE (x,y) on the cap boundary. Easiest robust
// silhouette read: the simplified contour the builder used. Re-derive it through
// extractPoolRegions (same simplify path used inside buildSolidGeometry).
const worldStrokes = pool.map((s) =>
  normalizeStrokePoints(rdpPoints(s), vb, WORLD_SCALE, center),
);
const regions = extractPoolRegions(worldStrokes, { inkRadius: 0.08 });
const outer = regions.regions.find((r) => r.role === 'outer');
console.log('\n=== 2. SMOOTHED SILHOUETTE CONTOUR (the Chaikin output the cap uses) ===');
console.log('contour vertex count =', outer ? outer.outline.length : 'none');

function maxTurnDeg(loop) {
  let mx = 0;
  const n = loop.length;
  for (let i = 0; i < n; i++) {
    const [px, py] = loop[(i - 1 + n) % n];
    const [cx, cy] = loop[i];
    const [nx, ny] = loop[(i + 1) % n];
    const ax = cx - px, ay = cy - py, bx = nx - cx, by = ny - cy;
    const ma = Math.hypot(ax, ay), mb = Math.hypot(bx, by);
    if (ma < 1e-9 || mb < 1e-9) continue;
    const c = Math.min(1, Math.max(-1, (ax * bx + ay * by) / (ma * mb)));
    mx = Math.max(mx, (Math.acos(c) * 180) / Math.PI);
  }
  return mx;
}
if (outer) {
  console.log('max per-vertex turn on smoothed contour =', maxTurnDeg(outer.outline).toFixed(2), 'deg');
  console.log('(a raw 48-gon turns 7.5°/vtx; a 14-gon ~25.7°; smooth curve << that — facet read needs sharp turns)');
}

// ── 3. NATIVE path: the mass geometry is rendered AS-IS (front cap + bevel rim) ──
const posNative = mass.geometry.getAttribute('position');
console.log('\n=== 3. NATIVE-SOLID render geometry ===');
console.log('vertex count (no tessellation, no displacement) =', posNative.count);
console.log('NATIVE renders this mass verbatim → rim = the Chaikin-smoothed bevel ring.');

// ── 4. SVG-PORT path: clone → TessellateModifier(0.04,5) → planar UVs → displace ──
console.log('\n=== 4. SVG-PORT render geometry (the EXTRA carve step native skips) ===');
if (!TessellateModifier) {
  console.log('SKIP: TessellateModifier unavailable in node — code-trace only for step 4.');
} else {
  const clone = mass.geometry.clone();
  let carved;
  try {
    carved = new TessellateModifier(0.04, 5).modify(clone);
  } catch (e) {
    console.log('tessellate threw:', e.message);
  }
  if (carved) {
    const posCarved = carved.getAttribute('position');
    console.log('vertex count AFTER tessellation =', posCarved.count, '(was', posNative.count, ')');

    // World bbox window (svg-port uses geometry bbox; relief margin handled in texture).
    carved.computeBoundingBox();
    const bb = carved.boundingBox;
    const win = {
      minX: bb.min.x, minY: bb.min.y,
      spanX: bb.max.x - bb.min.x, spanY: bb.max.y - bb.min.y,
    };

    // Simulate the displacement the svg-port material applies:
    //   displacementMap height h(uv) in [0..1]; vertex moves along its NORMAL by
    //   scale*h + bias, with scale=RELIEF_DISPLACEMENT_SCALE(0.17), bias=-scale.
    //   => offset = scale*(h-1): white(paper,h=1)=0, black(ink,h=0)=-scale.
    // We don't have the real raster texture in node, so probe the GEOMETRIC fact:
    // WHICH vertices get a nonzero normal-direction displacement, and whether the
    // SILHOUETTE/RIM vertices (max |x| or |y|, i.e. on the boundary) are among the
    // displaced set with SIDEWAYS normals — that is what re-jags a smooth rim.
    carved.computeVertexNormals();
    const nrm = carved.getAttribute('normal');
    const SCALE = 0.17;

    // Identify rim vertices: those whose normal has a large XY component (side
    // walls / bevel), vs cap vertices (normal ≈ ±Z). Displacement along a
    // sideways normal MOVES THE SILHOUETTE in/out per-vertex → visible rim jag.
    let rimVerts = 0, capVerts = 0;
    let rimNearBoundary = 0;
    const boundR = 0.985; // within 1.5% of the bbox edge in x or y
    for (let i = 0; i < posCarved.count; i++) {
      const nx = nrm.getX(i), ny = nrm.getY(i), nz = nrm.getZ(i);
      const xyMag = Math.hypot(nx, ny);
      const isRim = xyMag > Math.abs(nz); // normal points more sideways than front/back
      if (isRim) rimVerts++; else capVerts++;
      const x = posCarved.getX(i), y = posCarved.getY(i);
      const ux = (x - win.minX) / win.spanX, uy = (y - win.minY) / win.spanY;
      const onBoundary = ux < (1 - boundR) || ux > boundR || uy < (1 - boundR) || uy > boundR;
      if (isRim && onBoundary) rimNearBoundary++;
    }
    console.log('cap-facing vertices (normal≈±Z) =', capVerts);
    console.log('RIM/side-wall vertices (normal sideways) =', rimVerts);
    console.log('RIM vertices near the silhouette boundary =', rimNearBoundary);
    console.log('\nKEY: the svg-port material applies displacementMap+normalMap to ALL of these');
    console.log('     (planar UVs cover every vertex). A height value at a RIM vertex pushes it');
    console.log('     along a SIDEWAYS normal → the silhouette moves per-vertex = re-jagged rim,');
    console.log('     EVEN THOUGH the underlying contour was Chaikin-smooth. displacementScale=' + SCALE);
    console.log('     world-units; the smoothed circle radius here ≈', (win.spanX/2).toFixed(3), 'world-units.');
    console.log('     ratio (max rim displacement / radius) ≈', (SCALE / (win.spanX/2) * 100).toFixed(1) + '%');
  }
}

console.log('\n=== RELIEF MARGIN CHECK (does the texture window protect the rim?) ===');
console.log('RELIEF_MARGIN =', tex?.RELIEF_MARGIN ?? '(see drawingTexture.ts: 0.06)');
console.log('The relief TEXTURE window is padded 6% so MARK ink sits inside. BUT the');
console.log('displacement is applied via applyPlanarReliefUVs over the geometry BBOX, and');
console.log('normalMap (normalScale 4.0) tilts EVERY cap+rim vertex normal regardless of margin.');
console.log('\nDONE');
