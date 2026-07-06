// ─── BUG B repro: do the 3D GEOMETRY (Inflate) toggles change the mesh? ──────
// Replicates the EXACT routing in Stroke3DScene.tsx StrokeMeshes `builds`
// useMemo (lines 617-652):
//
//   if (geometryMode === 'solid' || isSvgPort)  → buildPoolSolidGeometry(...)
//   else                                        → buildStrokeWithParams(...)
//
// buildStrokeWithParams (Stroke3DScene line 408) consumes the FULL Inflate
// param set (profileFamily/baseRadius/tipRadius/pressureInfluence/puff).
// buildPoolSolidGeometry (strokeTo3d line 1715) consumes ONLY
// solid.inkRadius / solid.depth / rod.radius / solid.holes / solid.edge —
// the Inflate params are NEVER passed in.
//
// So the hypothesis: under style3d='svg-port', geometryMode='inflate', the
// Inflate toggles are INERT (geometry hash invariant). Under 'native'/'hatch'
// they vary. This script hashes vertex positions per param value to prove it.
//
//   node tools/debug/geometry-toggle-repro.mjs
//
// Pure node — strokeTo3d + modeParams are three/JS only (no DOM by contract).
// We import buildStrokeWithParams from the REAL scene module by re-implementing
// its tiny body here against the real builders (the scene file imports R3F/DOM
// at module top, so we can't import it in node — but buildStrokeWithParams is
// pure geometry; we mirror it byte-for-byte and assert against the same consts).

import { createHash } from 'node:crypto';

const geo = await import(new URL('../../src/app/lib/geometry3d/strokeTo3d.ts', import.meta.url));
const mp = await import(new URL('../../src/app/components/canvas3d/modeParams.ts', import.meta.url));
const THREE = await import('three');

const {
  rdpPoints,
  normalizeStrokePoints,
  resolveGeometryMode,
  buildInflateGeometry,
  buildExtrudeGeometry,
  buildRodGeometry,
  buildPoolSolidGeometry,
  extractPressures,
  isClosedStroke,
  isSolidFamilyClosure,
  closureStateOf,
  poolCenter,
  WORLD_SCALE,
  DEFAULT_VIEWBOX,
} = geo;
const {
  DEFAULT_MODE3D_PARAMS,
  INFLATE_PROFILE_FAMILY_PRESETS,
  extrudeEffectiveDepth,
  extrudeBevelAutoDisabled,
  inflatePuffAspectZ,
} = mp;

// ── Mirror of Stroke3DScene.buildStrokeWithParams (lines 408-470) ────────────
// Byte-for-byte the same calls. This is the per-stroke path used for
// native/hatch in every non-solid geometryMode.
function buildStrokeWithParams(points, viewBox, center, setting, p, treatAsClosed) {
  const simplified = rdpPoints(points);
  const mode = resolveGeometryMode(setting, simplified, { treatAsClosed });
  const world = normalizeStrokePoints(simplified, viewBox, WORLD_SCALE, center);

  if (mode === 'extrude') {
    const depth = extrudeEffectiveDepth(p.extrude.width, p.extrude.depthMult);
    const profile = extrudeBevelAutoDisabled(p.extrude.width) ? 'sharp' : p.extrude.bevelProfile;
    return buildExtrudeGeometry(world, {
      depth,
      rodRadius: p.rod.radius,
      bevelProfile: profile,
      sideWall: p.extrude.sideWall,
    });
  }

  if (mode === 'inflate') {
    const family = INFLATE_PROFILE_FAMILY_PRESETS[p.inflate.profileFamily];
    const result = buildInflateGeometry(world, {
      baseRadius: p.inflate.baseRadius,
      tipRadius: p.inflate.tipRadius,
      pressures: extractPressures(simplified),
      pressureInfluence: p.inflate.pressureInfluence,
      profileExp: family.profileExp,
      rodRadius: p.rod.radius,
    });
    if (result.kind === 'inflate') {
      const aspectZ = inflatePuffAspectZ(p.inflate.puff) * family.aspectScale;
      if (Math.abs(aspectZ - 1) > 1e-3) {
        result.geometry.applyMatrix4(new THREE.Matrix4().makeScale(1, 1, aspectZ));
      }
    }
    return result;
  }

  const closeRing =
    setting === 'auto'
      ? isSolidFamilyClosure(closureStateOf(simplified), treatAsClosed)
      : isClosedStroke(simplified);
  return buildRodGeometry(world, {
    radius: p.rod.radius,
    closed: closeRing,
    jointAngleThresholdDeg: p.rod.jointSensitivityDeg,
  });
}

// ── Mirror of Stroke3DScene.StrokeMeshes `builds` routing (lines 611-652) ────
// THE bug-bearing branch: isSvgPort forces buildPoolSolidGeometry regardless
// of geometryMode (so Inflate params never reach a builder).
function buildPool(strokes, viewBox, geometryMode, isSvgPort, p) {
  const pool = strokes.filter((s) => s.length > 0);
  const center = poolCenter(pool, viewBox);
  if (geometryMode === 'solid' || isSvgPort) {
    return [
      buildPoolSolidGeometry(pool, {
        viewBox,
        center,
        inkRadius: p.solid.inkRadius,
        depth: p.solid.depth,
        rodRadius: p.rod.radius,
        holes: p.solid.holes,
        edge: p.solid.edge,
      }),
    ];
  }
  return pool.map((points) => buildStrokeWithParams(points, viewBox, center, geometryMode, p));
}

function hashBuilds(builds) {
  const h = createHash('sha1');
  for (const b of builds) {
    const pos = b.geometry.getAttribute('position').array;
    // round to 1e-6 so float noise never masks a real change
    for (let i = 0; i < pos.length; i++) h.update(String(Math.round(pos[i] * 1e6)));
    h.update('|' + b.kind + '|' + pos.length + ';');
  }
  return h.digest('hex').slice(0, 12);
}

// ── Fixture: an OPEN sine stroke (auto→rod, but we force geometryMode) ───────
const sine = [];
for (let i = 0; i <= 200; i++) {
  sine.push([100 + (600 * i) / 200, 300 + 80 * Math.sin((i / 200) * Math.PI * 2), 0.5]);
}
const strokes = [sine];
const vb = DEFAULT_VIEWBOX;

// Deep clone the defaults so each variant is independent.
const clone = () => JSON.parse(JSON.stringify(DEFAULT_MODE3D_PARAMS));

// ── Param sweeps mirroring the chrome's Inflate sliders/pills ────────────────
const sweeps = {
  profileFamily: ['balloon', 'cushion', 'bead'],          // PROFILE pills
  baseRadius:    [0.06, 0.22, 0.45],                       // BASE RADIUS slider
  tipRadius:     [0.01, 0.035, 0.15],                      // TIP RADIUS slider
  pressureInfluence: [0, 0.35, 1],                         // PRESSURE slider
  puff:          [0, 0.5, 1],                              // PUFF slider
};

function runStyle(label, geometryMode, isSvgPort) {
  console.log(`\n=== style3d='${label}'  geometryMode='${geometryMode}'  isSvgPort=${isSvgPort} ===`);
  let anyInert = false;
  for (const [param, values] of Object.entries(sweeps)) {
    const hashes = values.map((v) => {
      const p = clone();
      p.inflate[param] = v;
      const builds = buildPool(strokes, vb, geometryMode, isSvgPort, p);
      const kind = builds.map((b) => b.kind).join(',');
      return { v, hash: hashBuilds(builds), kind };
    });
    const distinct = new Set(hashes.map((h) => h.hash)).size;
    const inert = distinct === 1;
    if (inert) anyInert = true;
    const kinds = Array.from(new Set(hashes.map((h) => h.kind))).join(' ');
    console.log(
      `  ${param.padEnd(18)} kind=[${kinds}]  ` +
        hashes.map((h) => `${String(h.v).padStart(5)}→${h.hash}`).join('  ') +
        `   ${inert ? '❌ INERT (param has NO effect)' : '✅ varies'}`,
    );
  }
  return anyInert;
}

console.log('BUG B — Inflate geometry-toggle effect, per 3D STYLE');
console.log('Fixture: 1 open sine stroke, geometryMode forced to inflate.');

// 1) NATIVE / HATCH path (per-stroke builder — should respond to every param)
const nativeInert = runStyle('native|hatch', 'inflate', false);

// 2) SVG-PORT path (forced pool-solid — hypothesis: every Inflate param inert)
const svgportInert = runStyle('svg-port', 'inflate', true);

// 3) Control: prove svg-port geometry DOES respond to its OWN (solid) params,
//    so the invariance above is real param-dropping, not a broken harness.
console.log(`\n=== CONTROL: svg-port responds to SOLID params (proves harness live) ===`);
for (const [param, values] of [['inkRadius', [0.03, 0.08, 0.2]], ['depth', [0.05, 0.48, 1.35]]]) {
  const hashes = values.map((v) => {
    const p = clone();
    p.solid[param] = v;
    return { v, hash: hashBuilds(buildPool(strokes, vb, 'inflate', true, p)) };
  });
  const distinct = new Set(hashes.map((h) => h.hash)).size;
  console.log(
    `  solid.${param.padEnd(12)} ` +
      hashes.map((h) => `${String(h.v).padStart(5)}→${h.hash}`).join('  ') +
      `   ${distinct === 1 ? '❌ inert' : '✅ varies (harness is live)'}`,
  );
}

console.log('\n── VERDICT ──');
console.log(
  `  native/hatch inflate toggles: ${nativeInert ? 'SOME INERT (deeper bug)' : 'ALL VARY (work)'}`,
);
console.log(
  `  svg-port inflate toggles:     ${svgportInert ? 'INERT (BUG CONFIRMED — svg-port drops Inflate params)' : 'vary'}`,
);
