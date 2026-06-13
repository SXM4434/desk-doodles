// ─── strokeTo3d smoke test (pure logic, node-run) ────────────────────────────
// Exercises the REAL src/app/lib/geometry3d/strokeTo3d.ts module — node ≥23.6
// strips TS types natively, and `three` is pure JS so the geometry builders
// run headless (no DOM in the lib, by contract).
//
//   node tools/3d/strokeTo3d-smoke.mjs
//
// Repo-side tool only — NOT part of the Make drag-drop set (tools/ stays out).

const mod = await import(new URL('../../src/app/lib/geometry3d/strokeTo3d.ts', import.meta.url));
const {
  rdpPoints,
  normalizeStrokePoints,
  isClosedStroke,
  isSolidFamilyClosure,
  closureStateOf,
  pickGeometryMode,
  resolveGeometryMode,
  buildRodGeometry,
  buildExtrudeGeometry,
  buildExtrudeGeometryWithHoles,
  buildInflateGeometry,
  buildSolidGeometry,
  buildPoolSolidGeometry,
  buildStrokeGeometry,
  containmentDepths,
  extractPoolRegions,
  extractStrokePoolRegions,
  extractPressures,
  poolCenter,
  strokesKey,
  strokeSignature,
  DEFAULT_VIEWBOX,
  REGION_EXTRACTOR_VERSION,
  TREATED_AS_CLOSED_DEFAULT,
} = mod;
const { convertStrokePool } = await import(
  new URL('../../src/app/lib/geometry3d/convert.ts', import.meta.url)
);

const results = [];
function check(name, fn) {
  try {
    fn();
    results.push({ ok: true, name });
  } catch (e) {
    results.push({ ok: false, name, msg: e.message });
  }
}
function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}
function approx(a, b, eps = 1e-9) {
  return Math.abs(a - b) < eps;
}

// ── Fixtures (all deterministic — fixed trig, no randomness) ────────────────

// Dense open sine stroke: 401 points across the canvas.
const sine = [];
for (let i = 0; i <= 400; i++) {
  sine.push([100 + (600 * i) / 400, 300 + 80 * Math.sin((i / 400) * Math.PI * 2), 0.5]);
}

// Closed loop: 120-point circle, last point ~5px from the first.
const loop = [];
for (let i = 0; i < 120; i++) {
  const t = (i / 120) * Math.PI * 2;
  loop.push([400 + 100 * Math.cos(t), 300 + 100 * Math.sin(t), 0.5]);
}

// Degenerate "closed" stroke: collinear, endpoints 5px apart (gap < 24).
const collinear = [
  [100, 300, 0.5],
  [200, 300, 0.5],
  [300, 300, 0.5],
  [105, 300, 0.5],
];

// AMBIGUOUS-band fixture (Sebs's arrow repro shape): gap 18px on a ~304px
// diagonal lands in [tight=8, loose≈24.3) → 'treated-as-closed'.
const arrowBand = (() => {
  const band = [];
  const arrowPts = [[200, 300], [400, 300], [400, 260], [480, 320], [400, 380], [400, 340], [200, 340], [202, 318]];
  for (let s = 0; s + 1 < arrowPts.length; s++) {
    const [ax, ay] = arrowPts[s];
    const [bx, by] = arrowPts[s + 1];
    for (let t = 0; t <= 19; t++) band.push([ax + ((bx - ax) * t) / 20, ay + ((by - ay) * t) / 20, 0.5]);
  }
  band.push([202, 318, 0.5]);
  return band;
})();

// Spiky polyline with MIXED interior angles for the joint-sensitivity option.
// The FS walk fires where the INTERIOR angle clears the threshold (deviation
// = π − angle(a,b) = the interior angle at the vertex), so the 20–70° slider
// discriminates near-hairpin spikes. Interior angles at the 4 interior
// vertices: [60°, ~170°, 30°, ~160°] → joints@20=4 > @40=3 > @70=2.
const zigzag = [
  [100, 300, 0.5],
  [200, 300, 0.5], // spike A — interior 60°
  [155, 378, 0.5], // gentle ~170° (fires at every threshold — constant)
  [121, 472, 0.5], // spike B — interior 30°
  [205, 401, 0.5], // gentle ~160° (constant)
  [299, 367, 0.5],
];

// ── 1. RDP reduces a dense sine ─────────────────────────────────────────────
check('rdp reduces dense sine (401 → few anchors, endpoints kept)', () => {
  const out = rdpPoints(sine);
  assert(out.length < sine.length / 4, `expected <${sine.length / 4} anchors, got ${out.length}`);
  assert(out.length >= 5, `expected ≥5 anchors, got ${out.length}`);
  assert(out[0] === sine[0] && out[out.length - 1] === sine[sine.length - 1], 'endpoints not preserved');
  console.log(`   rdp: ${sine.length} → ${out.length} anchors (ε=3.0)`);
});

check('rdp carries pressure through (tuple width preserved)', () => {
  const out = rdpPoints(sine);
  assert(out.every((p) => p.length === 3 && p[2] === 0.5), 'pressure index dropped');
});

// ── 2. Closure detection ────────────────────────────────────────────────────
check('isClosedStroke: circle loop → closed', () => {
  assert(isClosedStroke(loop) === true, 'loop should read closed');
});

check('isClosedStroke: open sine → open', () => {
  assert(isClosedStroke(sine) === false, 'sine should read open');
});

// ── 3. Auto mode pick ───────────────────────────────────────────────────────
check('pickGeometryMode: open → rod, closed → extrude', () => {
  assert(pickGeometryMode(sine) === 'rod', `sine picked ${pickGeometryMode(sine)}`);
  assert(pickGeometryMode(loop) === 'extrude', `loop picked ${pickGeometryMode(loop)}`);
});

check("resolveGeometryMode: 'auto' delegates, explicit wins", () => {
  assert(resolveGeometryMode('auto', loop) === 'extrude', 'auto should pick extrude for loop');
  assert(resolveGeometryMode('rod', loop) === 'rod', 'explicit rod must override');
});

// ── 4. Normalization (y-flip + centering + scale) ───────────────────────────
check('normalizeStrokePoints: y-flip, centering, 800px → 8 units', () => {
  const w = normalizeStrokePoints(
    [
      [400, 300, 0.5], // viewBox center → origin
      [400, 200, 0.5], // above center (y-down) → +y in world (y-up)
      [800, 300, 0.5], // right edge → +4 x
      [0, 300, 0.5], // left edge → −4 x
    ],
    DEFAULT_VIEWBOX,
  );
  assert(approx(w[0].x, 0) && approx(w[0].y, 0) && approx(w[0].z, 0), 'center not at origin');
  assert(approx(w[1].y, 1), `y-flip wrong: viewBox y=200 → world y=${w[1].y} (want +1)`);
  assert(approx(w[2].x, 4) && approx(w[3].x, -4), '800px span should map to 8 world units');
});

check('poolCenter: multi-stroke bbox center (preserves relative layout)', () => {
  const c = poolCenter([
    [
      [100, 100, 0.5],
      [200, 200, 0.5],
    ],
    [
      [300, 500, 0.5],
    ],
  ]);
  assert(approx(c.x, 200) && approx(c.y, 300), `pool center wrong: ${c.x},${c.y} (want 200,300)`);
});

// ── 5. Rod build ────────────────────────────────────────────────────────────
check('buildRodGeometry: tube + 2 endpoint caps, finite positions', () => {
  const world = normalizeStrokePoints(rdpPoints(sine), DEFAULT_VIEWBOX);
  const rod = buildRodGeometry(world);
  assert(rod.kind === 'rod', 'kind should be rod');
  const pos = rod.geometry.getAttribute('position');
  assert(pos && pos.count > 0, 'tube has no vertices');
  for (let i = 0; i < pos.array.length; i++) {
    assert(Number.isFinite(pos.array[i]), `non-finite position at ${i}`);
  }
  assert(rod.capPositions.length === 2, `open rod should have 2 caps, got ${rod.capPositions.length}`);
  console.log(`   rod: ${pos.count} vertices, radius ${rod.radius}, caps ${rod.capPositions.length}`);
});

check('buildRodGeometry: dot tap (1 point) does not throw', () => {
  const rod = buildRodGeometry(normalizeStrokePoints([[400, 300, 0.5]], DEFAULT_VIEWBOX));
  assert(rod.kind === 'rod' && rod.geometry.getAttribute('position').count > 0, 'degenerate rod empty');
});

// ── 6. Extrude build + fallbacks ────────────────────────────────────────────
check('buildExtrudeGeometry: closed loop → extrude', () => {
  const world = normalizeStrokePoints(rdpPoints(loop), DEFAULT_VIEWBOX);
  const out = buildExtrudeGeometry(world);
  assert(out.kind === 'extrude', `loop should extrude, got ${out.kind}`);
  const pos = out.geometry.getAttribute('position');
  assert(pos && pos.count > 0, 'extrude has no vertices');
  for (let i = 0; i < pos.array.length; i++) {
    assert(Number.isFinite(pos.array[i]), `non-finite position at ${i}`);
  }
  console.log(`   extrude: ${pos.count} vertices`);
});

check('buildExtrudeGeometry: collinear "closed" stroke falls back to rod (no throw)', () => {
  assert(isClosedStroke(collinear) === true, 'fixture should read closed (gap 5px < 24)');
  const world = normalizeStrokePoints(collinear, DEFAULT_VIEWBOX);
  const out = buildExtrudeGeometry(world);
  assert(out.kind === 'rod', `degenerate area should fall back to rod, got ${out.kind}`);
});

// ── 6b. Inflate-Lite build (swept variable-radius capsule) ──────────────────

/** Ring radius measured from raw POSITIONS (don't trust result metadata
 *  alone): ring center = vertex mean, radius = mean distance to center.
 *  The seam duplicate (j = radialSegments coincides with j = 0) is EXCLUDED —
 *  the remaining evenly-spaced ring vertices sum to the exact center. */
function measuredRingRadius(result, ringIndex) {
  const pos = result.geometry.getAttribute('position').array;
  const vpr = result.radialSegments + 1;
  const n = result.radialSegments; // exclude seam duplicate
  const start = ringIndex * vpr;
  let cx = 0;
  let cy = 0;
  let cz = 0;
  for (let j = 0; j < n; j++) {
    cx += pos[(start + j) * 3];
    cy += pos[(start + j) * 3 + 1];
    cz += pos[(start + j) * 3 + 2];
  }
  cx /= n;
  cy /= n;
  cz /= n;
  let r = 0;
  for (let j = 0; j < n; j++) {
    r += Math.hypot(pos[(start + j) * 3] - cx, pos[(start + j) * 3 + 1] - cy, pos[(start + j) * 3 + 2] - cz);
  }
  return r / n;
}

check('buildInflateGeometry: ring/vertex layout sane, all positions finite', () => {
  const world = normalizeStrokePoints(rdpPoints(sine), DEFAULT_VIEWBOX);
  const out = buildInflateGeometry(world);
  assert(out.kind === 'inflate', `expected inflate, got ${out.kind}`);
  const pos = out.geometry.getAttribute('position');
  const expected = out.rings * (out.radialSegments + 1) + 2; // side rings + 2 poles
  assert(pos.count === expected, `vertex count ${pos.count} ≠ rings·(radial+1)+2 = ${expected}`);
  assert(out.ringRadii.length === out.rings, 'ringRadii length ≠ rings');
  for (let i = 0; i < pos.array.length; i++) {
    assert(Number.isFinite(pos.array[i]), `non-finite position at ${i}`);
  }
  const nrm = out.geometry.getAttribute('normal');
  assert(nrm && nrm.count === pos.count, 'normal attribute missing/short');
  for (let i = 0; i < nrm.array.length; i++) {
    assert(Number.isFinite(nrm.array[i]), `non-finite normal at ${i}`);
  }
  assert(out.geometry.getIndex().count % 3 === 0, 'index count not a triangle multiple');
  console.log(`   inflate: ${out.rings} rings × ${out.radialSegments + 1} verts + 2 poles = ${pos.count} vertices`);
});

check('buildInflateGeometry: radius profile varies — middle ring > end rings', () => {
  const world = normalizeStrokePoints(rdpPoints(sine), DEFAULT_VIEWBOX);
  const out = buildInflateGeometry(world);
  const mid = measuredRingRadius(out, Math.floor(out.rings / 2));
  const first = measuredRingRadius(out, 0);
  const last = measuredRingRadius(out, out.rings - 1);
  assert(mid > first * 1.5 && mid > last * 1.5, `no capsule taper: ends ${first.toFixed(4)}/${last.toFixed(4)}, mid ${mid.toFixed(4)}`);
  // Measured geometry agrees with the reported ringRadii (cross-check).
  assert(approx(mid, out.ringRadii[Math.floor(out.rings / 2)], 1e-4), 'measured mid radius ≠ reported ringRadii');
  console.log(`   radii: end ${first.toFixed(4)} → mid ${mid.toFixed(4)} → end ${last.toFixed(4)} (world units)`);
});

check('buildInflateGeometry: pressure modulates radius (high > low at mid)', () => {
  const anchors = rdpPoints(sine);
  const world = normalizeStrokePoints(anchors, DEFAULT_VIEWBOX);
  const hi = buildInflateGeometry(world, { pressures: anchors.map(() => 1) });
  const lo = buildInflateGeometry(world, { pressures: anchors.map(() => 0) });
  const m = Math.floor(hi.rings / 2);
  assert(hi.ringRadii[m] > lo.ringRadii[m], `pressure inert: hi ${hi.ringRadii[m]} ≤ lo ${lo.ringRadii[m]}`);
});

check('extractPressures: channel pulled through, bare [x,y] → undefined', () => {
  const p = extractPressures([[0, 0, 0.9], [1, 1, 0.1]]);
  assert(p && p.length === 2 && approx(p[0], 0.9) && approx(p[1], 0.1), 'pressure channel mangled');
  assert(extractPressures([[0, 0], [1, 1]]) === undefined, 'bare points should yield undefined');
});

check('buildInflateGeometry: determinism — two builds byte-equal', () => {
  const world = normalizeStrokePoints(rdpPoints(sine), DEFAULT_VIEWBOX);
  const a = buildInflateGeometry(world);
  const b = buildInflateGeometry(world);
  for (const attr of ['position', 'normal', 'uv']) {
    const p1 = a.geometry.getAttribute(attr).array;
    const p2 = b.geometry.getAttribute(attr).array;
    assert(p1.length === p2.length, `${attr} lengths differ across runs`);
    for (let i = 0; i < p1.length; i++) {
      assert(p1[i] === p2[i], `${attr}[${i}] differs: ${p1[i]} vs ${p2[i]}`);
    }
  }
});

check('buildInflateGeometry: degenerate input (dot tap) falls back to rod', () => {
  const single = buildInflateGeometry(normalizeStrokePoints([[400, 300, 0.5]], DEFAULT_VIEWBOX));
  assert(single.kind === 'rod', `1-point input should fall back to rod, got ${single.kind}`);
  const empty = buildInflateGeometry([]);
  assert(empty.kind === 'rod', `empty input should fall back to rod, got ${empty.kind}`);
});

check("auto semantics untouched: pickGeometryMode never returns 'inflate'", () => {
  assert(pickGeometryMode(sine) !== 'inflate' && pickGeometryMode(loop) !== 'inflate', 'auto picked inflate');
  assert(resolveGeometryMode('auto', sine) === 'rod' && resolveGeometryMode('auto', loop) === 'extrude', 'auto resolution drifted');
  assert(resolveGeometryMode('inflate', sine) === 'inflate', 'explicit inflate must win');
});

check("buildStrokeGeometry mode:'inflate' → inflate (pipeline route)", () => {
  const out = buildStrokeGeometry(sine, { mode: 'inflate' });
  assert(out.kind === 'inflate', `pipeline picked ${out.kind}`);
});

// ── 6c. Solid build (pool raster → marching squares → extrude) ──────────────

check('buildPoolSolidGeometry: closed loop → solid disc (1 outer, 0 holes)', () => {
  const out = buildPoolSolidGeometry([loop]);
  assert(out.kind === 'solid', `expected solid, got ${out.kind}`);
  assert(out.outerContours === 1, `disc should have 1 outer contour, got ${out.outerContours}`);
  assert(out.holes === 0, `disc should have 0 holes, got ${out.holes}`);
  const pos = out.geometry.getAttribute('position');
  assert(pos && pos.count > 0, 'solid has no vertices');
  for (let i = 0; i < pos.array.length; i++) {
    assert(Number.isFinite(pos.array[i]), `non-finite position at ${i}`);
  }
  // Footprint sanity: the 100px-radius loop spans ~2 world units (+ink).
  out.geometry.computeBoundingBox();
  const bb = out.geometry.boundingBox;
  const spanX = bb.max.x - bb.min.x;
  assert(spanX > 1.8 && spanX < 2.6, `disc x-span ${spanX.toFixed(2)} outside 1.8–2.6`);
  console.log(`   solid disc: ${pos.count} vertices, x-span ${spanX.toFixed(2)}`);
});

check('buildPoolSolidGeometry: overlapping open strokes merge watertight (1 outer)', () => {
  // Two crossing open strokes — ink bodies overlap at the center.
  const strokeA = [];
  const strokeB = [];
  for (let i = 0; i <= 100; i++) {
    strokeA.push([300 + 2 * i, 250 + i, 0.5]);
    strokeB.push([300 + 2 * i, 350 - i, 0.5]);
  }
  const out = buildPoolSolidGeometry([strokeA, strokeB]);
  assert(out.kind === 'solid', `expected solid, got ${out.kind}`);
  assert(out.outerContours === 1, `crossing strokes should merge into 1 contour, got ${out.outerContours}`);
});

check('buildPoolSolidGeometry: open ring of arc strokes → annulus (1 outer, 1 hole)', () => {
  // Two open half-circle strokes whose ink bodies overlap at the seams,
  // enclosing an empty middle — the hole-classification path.
  const arcA = [];
  const arcB = [];
  for (let i = 0; i <= 80; i++) {
    const t1 = -0.2 + (i / 80) * (Math.PI + 0.4); // overshoot so ink overlaps
    arcA.push([400 + 150 * Math.cos(t1), 300 + 150 * Math.sin(t1), 0.5]);
    const t2 = Math.PI - 0.2 + (i / 80) * (Math.PI + 0.4);
    arcB.push([400 + 150 * Math.cos(t2), 300 + 150 * Math.sin(t2), 0.5]);
  }
  const out = buildPoolSolidGeometry([arcA, arcB]);
  assert(out.kind === 'solid', `expected solid, got ${out.kind}`);
  assert(out.outerContours === 1, `annulus should have 1 outer contour, got ${out.outerContours}`);
  assert(out.holes === 1, `annulus should have 1 hole, got ${out.holes}`);
  console.log(`   solid annulus: ${out.outerContours} outer + ${out.holes} hole`);
});

check('buildSolidGeometry: determinism — two builds byte-equal', () => {
  const a = buildPoolSolidGeometry([loop, sine]);
  const b = buildPoolSolidGeometry([loop, sine]);
  assert(a.kind === 'solid' && b.kind === 'solid', 'both builds should be solid');
  const p1 = a.geometry.getAttribute('position').array;
  const p2 = b.geometry.getAttribute('position').array;
  assert(p1.length === p2.length, 'vertex counts differ across runs');
  for (let i = 0; i < p1.length; i++) {
    assert(p1[i] === p2[i], `position[${i}] differs: ${p1[i]} vs ${p2[i]}`);
  }
});

check('buildSolidGeometry: degenerate input falls back to rod', () => {
  const empty = buildSolidGeometry([]);
  assert(empty.kind === 'rod', `empty pool should fall back to rod, got ${empty.kind}`);
});

check("buildStrokeGeometry mode:'solid' → single-stroke solid (API total)", () => {
  const out = buildStrokeGeometry(loop, { mode: 'solid' });
  assert(out.kind === 'solid', `pipeline picked ${out.kind}`);
  assert(resolveGeometryMode('auto', loop) === 'extrude', 'auto must still pick extrude, never solid');
});

// ── 6d. ROCK 2 — 3-state closure + parity holes + region extractor ──────────

check('closureStateOf: 3 states (closed / treated-as-closed / open), boolean unchanged', () => {
  // The 120-pt circle closes within ~5px → 'closed' (silent slab).
  assert(closureStateOf(loop) === 'closed', `loop → ${closureStateOf(loop)}`);
  // Sine endpoints are far apart → 'open'.
  assert(closureStateOf(sine) === 'open', `sine → ${closureStateOf(sine)}`);
  // Arrow-band fixture: gap 18px on a ~304px-diag shape ∈ [8, 24.3) → TAC.
  assert(closureStateOf(arrowBand) === 'treated-as-closed', `arrow band → ${closureStateOf(arrowBand)}`);
  // LOOSE-boolean law: isClosedStroke ≡ (state !== 'open') for every fixture
  // (the explicit-mode + raster reading — independent of the arrow rule).
  for (const pts of [loop, sine, arrowBand, collinear]) {
    assert(isClosedStroke(pts) === (closureStateOf(pts) !== 'open'), 'boolean drifted from 3-state');
  }
});

// ── 6e. ROCK X — arrow rule + engine options ────────────────────────────────

check('ARROW RULE: isSolidFamilyClosure truth table — both defaults, override wins', () => {
  // Unambiguous states ignore default AND override.
  for (const dflt of ['rod', 'solid']) {
    assert(isSolidFamilyClosure('closed', undefined, dflt) === true, `closed under ${dflt}`);
    assert(isSolidFamilyClosure('open', undefined, dflt) === false, `open under ${dflt}`);
    assert(isSolidFamilyClosure('closed', false, dflt) === true, 'closed never flips');
    assert(isSolidFamilyClosure('open', true, dflt) === false, 'open never flips');
  }
  // Ambiguous band: default decides…
  assert(isSolidFamilyClosure('treated-as-closed', undefined, 'rod') === false, 'rod default');
  assert(isSolidFamilyClosure('treated-as-closed', undefined, 'solid') === true, 'solid default');
  // …and the per-object chip override beats the default (one-line flip law).
  assert(isSolidFamilyClosure('treated-as-closed', true, 'rod') === true, 'override → closed');
  assert(isSolidFamilyClosure('treated-as-closed', false, 'solid') === false, 'override → open');
  console.log(`   TREATED_AS_CLOSED_DEFAULT = '${TREATED_AS_CLOSED_DEFAULT}' (pending Sebs ruling)`);
});

check('ARROW RULE: auto pick — arrow band → rod under rod default; chip override → extrude', () => {
  assert(TREATED_AS_CLOSED_DEFAULT === 'rod', 'this battery snapshot assumes the rod default');
  assert(pickGeometryMode(arrowBand) === 'rod', `arrow band picked ${pickGeometryMode(arrowBand)}`);
  assert(pickGeometryMode(arrowBand, { treatAsClosed: true }) === 'extrude', 'override should weld');
  assert(resolveGeometryMode('auto', arrowBand, { treatAsClosed: true }) === 'extrude', 'resolve passthrough');
  // Truly closed/open are untouched by the rule.
  assert(pickGeometryMode(loop) === 'extrude' && pickGeometryMode(sine) === 'rod', 'unambiguous drifted');
  // Auto-resolved ambiguous rod renders OPEN (the gap is the honest read).
  const rod = buildStrokeGeometry(arrowBand, { mode: 'auto' });
  assert(rod.kind === 'rod', `arrow auto build → ${rod.kind}`);
  assert(rod.capPositions.length === 2, 'ambiguous rod should keep open-end caps (not a welded ring)');
});

check('ENGINE OPTION: jointAngleThresholdDeg — joints@20 > joints@40 > joints@70 on spiky polyline', () => {
  const world = normalizeStrokePoints(zigzag, DEFAULT_VIEWBOX);
  const j20 = buildRodGeometry(world, { jointAngleThresholdDeg: 20 }).jointPositions.length;
  const j40 = buildRodGeometry(world).jointPositions.length; // default 40
  const j70 = buildRodGeometry(world, { jointAngleThresholdDeg: 70 }).jointPositions.length;
  assert(j20 > j40, `sensitivity inert at low end: ${j20} ≤ ${j40}`);
  assert(j40 > j70, `sensitivity inert at high end: ${j40} ≤ ${j70}`);
  console.log(`   joints: 20°→${j20} · 40°→${j40} · 70°→${j70}`);
});

check('ROD RESULT: endPositions/endDirections — 2 outward ends open, none closed', () => {
  const world = normalizeStrokePoints(rdpPoints(sine), DEFAULT_VIEWBOX);
  const open = buildRodGeometry(world);
  assert(open.endPositions.length === 2 && open.endDirections.length === 2, 'open rod ends missing');
  for (const d of open.endDirections) {
    assert(Math.abs(d.length() - 1) < 1e-6, 'end direction not unit length');
  }
  // Outward: start direction points AWAY from the second point.
  const toSecond = world[1].clone().sub(world[0]).normalize();
  assert(open.endDirections[0].dot(toSecond) < 0, 'start direction should point outward');
  const closed = buildRodGeometry(normalizeStrokePoints(rdpPoints(loop), DEFAULT_VIEWBOX), { closed: true });
  assert(closed.endPositions.length === 0 && closed.endDirections.length === 0, 'closed rod should have no ends');
});

check('TIER-2 EXTRUDE: bevel profiles distinct (sharp < soft < rounded verts); default = rounded byte-identical', () => {
  const world = normalizeStrokePoints(rdpPoints(loop), DEFAULT_VIEWBOX);
  const sharp = buildExtrudeGeometry(world, { bevelProfile: 'sharp' });
  const soft = buildExtrudeGeometry(world, { bevelProfile: 'soft' });
  const rounded = buildExtrudeGeometry(world, { bevelProfile: 'rounded' });
  const dflt = buildExtrudeGeometry(world);
  assert(sharp.kind === 'extrude' && soft.kind === 'extrude' && rounded.kind === 'extrude', 'profile broke extrude');
  const v = (g) => g.geometry.getAttribute('position').count;
  assert(v(sharp) < v(soft) && v(soft) < v(rounded), `verts not ordered: ${v(sharp)} / ${v(soft)} / ${v(rounded)}`);
  const p1 = rounded.geometry.getAttribute('position').array;
  const p2 = dflt.geometry.getAttribute('position').array;
  assert(p1.length === p2.length, 'default ≠ rounded (length)');
  for (let i = 0; i < p1.length; i++) assert(p1[i] === p2[i], `default ≠ rounded at ${i}`);
  console.log(`   bevel verts: sharp ${v(sharp)} · soft ${v(soft)} · rounded ${v(rounded)}`);
});

check('TIER-2 EXTRUDE: drafted side wall tapers the back face, front face keeps the silhouette', () => {
  const world = normalizeStrokePoints(rdpPoints(loop), DEFAULT_VIEWBOX);
  const straight = buildExtrudeGeometry(world, { bevelProfile: 'sharp' });
  const drafted = buildExtrudeGeometry(world, { bevelProfile: 'sharp', sideWall: 'drafted' });
  assert(drafted.kind === 'extrude', 'draft broke extrude');
  const spanAtZ = (g, pick) => {
    const pos = g.geometry.getAttribute('position');
    g.geometry.computeBoundingBox();
    const bb = g.geometry.boundingBox;
    const zTarget = pick === 'front' ? bb.max.z : bb.min.z;
    let minX = Infinity, maxX = -Infinity;
    for (let i = 0; i < pos.count; i++) {
      if (Math.abs(pos.array[i * 3 + 2] - zTarget) > 1e-4) continue;
      minX = Math.min(minX, pos.array[i * 3]);
      maxX = Math.max(maxX, pos.array[i * 3]);
    }
    return maxX - minX;
  };
  const frontS = spanAtZ(straight, 'front');
  const backS = spanAtZ(straight, 'back');
  const frontD = spanAtZ(drafted, 'front');
  const backD = spanAtZ(drafted, 'back');
  assert(approx(frontS, backS, 1e-6), 'straight walls should match front/back');
  assert(approx(frontD, frontS, 1e-6), 'drafted front face must keep the drawn silhouette');
  assert(backD < frontD * 0.9, `back face should taper: ${backD.toFixed(3)} vs front ${frontD.toFixed(3)}`);
  console.log(`   draft: front ${frontD.toFixed(3)} → back ${backD.toFixed(3)} (straight ${frontS.toFixed(3)}/${backS.toFixed(3)})`);
});

check('ENGINE OPTION: solid holes:false fills the annulus (donut → disc), holes:true keeps it', () => {
  const arcA = [];
  const arcB = [];
  for (let i = 0; i <= 80; i++) {
    const t1 = -0.2 + (i / 80) * (Math.PI + 0.4);
    arcA.push([400 + 150 * Math.cos(t1), 300 + 150 * Math.sin(t1), 0.5]);
    const t2 = Math.PI - 0.2 + (i / 80) * (Math.PI + 0.4);
    arcB.push([400 + 150 * Math.cos(t2), 300 + 150 * Math.sin(t2), 0.5]);
  }
  const withHoles = buildPoolSolidGeometry([arcA, arcB]); // default ON
  const filled = buildPoolSolidGeometry([arcA, arcB], { holes: false });
  assert(withHoles.kind === 'solid' && withHoles.holes === 1, `default should keep 1 hole, got ${withHoles.holes}`);
  assert(filled.kind === 'solid' && filled.holes === 0, `holes:false should fill, got ${filled.holes}`);
  assert(filled.outerContours === 1, 'filled silhouette should keep 1 outer');
  console.log(`   solid holes: ON → ${withHoles.holes} hole · OFF → ${filled.holes}`);
});

check("TIER-2 SOLID: edge 'crisp' drops the bevel band (fewer verts than 'eased')", () => {
  const crisp = buildPoolSolidGeometry([loop], { edge: 'crisp' });
  const eased = buildPoolSolidGeometry([loop]); // default eased
  assert(crisp.kind === 'solid' && eased.kind === 'solid', 'edge family broke solid');
  const v = (g) => g.geometry.getAttribute('position').count;
  assert(v(crisp) < v(eased), `crisp ${v(crisp)} should have fewer verts than eased ${v(eased)}`);
});

check('TIER-2 INFLATE: profileExp shapes the taper (bead narrower than balloon off-center)', () => {
  const world = normalizeStrokePoints(rdpPoints(sine), DEFAULT_VIEWBOX);
  const balloon = buildInflateGeometry(world, { profileExp: 0.8 });
  const bead = buildInflateGeometry(world, { profileExp: 1.7 });
  assert(balloon.kind === 'inflate' && bead.kind === 'inflate', 'profile family broke inflate');
  const q = Math.floor(balloon.rings / 4); // quarter-length ring
  const m = Math.floor(balloon.rings / 2);
  const ratioBalloon = balloon.ringRadii[q] / balloon.ringRadii[m];
  const ratioBead = bead.ringRadii[q] / bead.ringRadii[m];
  assert(ratioBead < ratioBalloon, `bead should taper harder: ${ratioBead.toFixed(3)} vs ${ratioBalloon.toFixed(3)}`);
  console.log(`   inflate quarter/mid ratio: balloon ${ratioBalloon.toFixed(3)} · bead ${ratioBead.toFixed(3)}`);
});

check('strokeSignature: stable, edit-sensitive, agrees with strokesKey', () => {
  const sig1 = strokeSignature(sine);
  const sig2 = strokeSignature(sine);
  assert(sig1 === sig2, 'signature not stable');
  const edited = [...sine.slice(0, -1), [700, 500, 0.5]];
  assert(strokeSignature(edited) !== sig1, 'signature not edit-sensitive');
  assert(strokesKey([sine, loop]) === `${strokeSignature(sine)}|${strokeSignature(loop)}`, 'key/signature drifted');
});

check('containmentDepths: 3 nested squares → [0, 1, 2]', () => {
  const sq = (c, r) => [
    [c - r, c - r], [c + r, c - r], [c + r, c + r], [c - r, c + r],
  ];
  const depths = containmentDepths([sq(0, 30), sq(0, 20), sq(0, 10)]);
  assert(depths.join(',') === '0,1,2', `depths ${depths.join(',')}`);
});

check('buildExtrudeGeometryWithHoles: donut loops → 1 slab with 1 hole (more verts than plain)', () => {
  const outer = normalizeStrokePoints(rdpPoints(loop), DEFAULT_VIEWBOX);
  const innerRaw = [];
  for (let i = 0; i < 60; i++) {
    const t = (i / 60) * Math.PI * 2;
    innerRaw.push([400 + 40 * Math.cos(t), 300 + 40 * Math.sin(t), 0.5]);
  }
  const inner = normalizeStrokePoints(rdpPoints(innerRaw), DEFAULT_VIEWBOX);
  const holed = buildExtrudeGeometryWithHoles(outer, [inner]);
  const plain = buildExtrudeGeometry(outer);
  assert(holed.kind === 'extrude' && plain.kind === 'extrude', 'both should extrude');
  assert(holed.holesCut === 1, `holesCut ${holed.holesCut} ≠ 1`);
  assert(plain.holesCut === 0, `plain holesCut ${plain.holesCut} ≠ 0`);
  const hv = holed.geometry.getAttribute('position').count;
  const pv = plain.geometry.getAttribute('position').count;
  assert(hv > pv, `holed verts ${hv} should exceed plain ${pv}`);
  // Degenerate hole skipped, never crash.
  const degHole = buildExtrudeGeometryWithHoles(outer, [inner.slice(0, 2)]);
  assert(degHole.kind === 'extrude' && degHole.holesCut === 0, 'degenerate hole should be skipped');
  console.log(`   extrude holes: plain ${pv} verts → holed ${hv} verts (1 hole)`);
});

check('extractPoolRegions: annulus strokes → outer + hole with parentIndex, deterministic', () => {
  const arcA = [];
  const arcB = [];
  for (let i = 0; i <= 80; i++) {
    const t1 = -0.2 + (i / 80) * (Math.PI + 0.4);
    arcA.push([400 + 150 * Math.cos(t1), 300 + 150 * Math.sin(t1), 0.5]);
    const t2 = Math.PI - 0.2 + (i / 80) * (Math.PI + 0.4);
    arcB.push([400 + 150 * Math.cos(t2), 300 + 150 * Math.sin(t2), 0.5]);
  }
  const a = extractStrokePoolRegions([arcA, arcB]);
  assert(a.extractorVersion === REGION_EXTRACTOR_VERSION, 'version missing');
  assert(a.closureStates.length === 2 && a.closureStates.every((c) => c === 'open'), 'arc closures wrong');
  const outers = a.regions.filter((r) => r.role === 'outer');
  const holes = a.regions.filter((r) => r.role === 'hole');
  assert(outers.length === 1 && holes.length === 1, `regions ${outers.length} outer / ${holes.length} hole`);
  assert(holes[0].parentIndex !== null && a.regions[holes[0].parentIndex].role === 'outer', 'hole parent wrong');
  assert(holes[0].areaWorld > 0 && outers[0].areaWorld > holes[0].areaWorld, 'areas inconsistent');
  // Determinism: byte-equal outlines across runs.
  const b = extractStrokePoolRegions([arcA, arcB]);
  assert(JSON.stringify(a) === JSON.stringify(b), 'extraction not deterministic');
  // Pure world-space entry agrees on counts.
  const world = [arcA, arcB].map((s) => normalizeStrokePoints(rdpPoints(s), DEFAULT_VIEWBOX));
  const w = extractPoolRegions(world, { closedFlags: [false, false] });
  assert(w.regions.length === a.regions.length, 'world-entry region count differs');
  console.log(`   regions: ${outers.length} outer + ${holes.length} hole (extractor v${a.extractorVersion})`);
});

check('convertStrokePool auto: donut → slab w/ hole + hole receipt; receipts complete', () => {
  const circ = (r) => {
    const o = [];
    for (let i = 0; i <= 90; i++) {
      const t = (i / 90) * Math.PI * 2;
      o.push([400 + r * Math.cos(t), 300 + r * Math.sin(t), 0.5]);
    }
    return o;
  };
  const res = convertStrokePool([circ(150), circ(60)], { mode: 'auto' });
  assert(res.units.length === 2, `units ${res.units.length} ≠ 2`);
  const slab = res.units.find((u) => u.treatment === 'solid');
  const hole = res.units.find((u) => u.treatment === 'hole');
  assert(slab && slab.build && slab.build.kind === 'extrude' && slab.holesCut === 1, 'slab w/ hole missing');
  assert(hole && hole.build === null, 'hole unit should carry no geometry');
  assert(res.receipts.length === res.units.length, 'one receipt per unit');
  for (const r of res.receipts) {
    assert(r.surface === 'conversion' && r.register === 'drawn' && r.mode === 'auto', 'receipt fields wrong');
    assert(Array.isArray(r.firedRules) && r.firedRules.length > 0, 'receipt missing firedRules');
  }
});

check('convertStrokePool: determinism — two runs produce identical unit summaries', () => {
  const strokes = [loop, sine];
  const s = (res) =>
    JSON.stringify(
      res.units.map((u) => [u.id, u.treatment, u.intent, u.closure, u.band, u.holesCut, u.build?.kind ?? null]),
    );
  assert(s(convertStrokePool(strokes, { mode: 'auto' })) === s(convertStrokePool(strokes, { mode: 'auto' })), 'auto not deterministic');
  assert(s(convertStrokePool(strokes, { mode: 'solid' })) === s(convertStrokePool(strokes, { mode: 'solid' })), 'solid not deterministic');
});

check('convertStrokePool ARROW RULE: arrow → rod+chip under default; treatAsClosed override → slab+chip', () => {
  const dflt = convertStrokePool([arrowBand], { mode: 'auto' });
  assert(dflt.units.length === 1, `units ${dflt.units.length} ≠ 1`);
  const u = dflt.units[0];
  assert(u.treatment === 'line-rod' && u.build?.kind === 'rod', `default → ${u.treatment}/${u.build?.kind}`);
  assert(u.ambiguousClosure === true && u.treatedAsClosed === false, 'chip flags wrong (rod variant)');
  assert(dflt.receipts[0].firedRules.includes('CLOSURE_ambiguous_default_rod_chip'), 'rod-default rule missing');
  const welded = convertStrokePool([arrowBand], { mode: 'auto', treatAsClosed: { 0: true } });
  const w = welded.units[0];
  assert(w.treatment === 'solid' && w.build?.kind === 'extrude', `override → ${w.treatment}/${w.build?.kind}`);
  assert(w.ambiguousClosure === true && w.treatedAsClosed === true, 'chip flags wrong (solid variant)');
  assert(welded.receipts[0].firedRules.includes('CLOSURE_ambiguous_user_closed_chip'), 'override rule missing');
  // Heart law: a truly closed loop stays a SILENT slab in both worlds.
  const heart = convertStrokePool([loop], { mode: 'auto' });
  assert(heart.units[0].treatment === 'solid' && heart.units[0].ambiguousClosure === false, 'closed loop drifted');
});

check('UNIFIED RECEIPTS: every receipt carries entryType/renderSurface; corrections type exists', () => {
  const res = convertStrokePool([arrowBand, sine], { mode: 'auto', renderSurface: 'audit' });
  for (const r of res.receipts) {
    assert(r.entryType === 'conversion', `entryType ${r.entryType}`);
    assert(r.renderSurface === 'audit', `renderSurface ${r.renderSurface}`);
    assert(typeof r.ambiguousClosure === 'boolean', 'ambiguousClosure missing');
  }
  const bare = convertStrokePool([sine], { mode: 'auto' });
  assert(bare.receipts[0].renderSurface === null, 'unwired host should log null, never guess');
});

check('convertStrokePool explicit modes: dropdown stays sacred (rod/solid render everything)', () => {
  const strokes = [loop, sine];
  const rod = convertStrokePool(strokes, { mode: 'rod' });
  assert(rod.units.length === 2 && rod.units.every((u) => u.build !== null), 'rod mode must render every stroke');
  const solid = convertStrokePool(strokes, { mode: 'solid' });
  assert(solid.units.length === 1 && solid.units[0].build?.kind === 'solid', 'solid mode = one pool mass');
});

// ── 7. Full pipeline ────────────────────────────────────────────────────────
check('buildStrokeGeometry auto: sine → rod, loop → extrude', () => {
  const a = buildStrokeGeometry(sine);
  const b = buildStrokeGeometry(loop);
  assert(a.kind === 'rod', `sine pipeline picked ${a.kind}`);
  assert(b.kind === 'extrude', `loop pipeline picked ${b.kind}`);
});

// ── 8. Determinism ──────────────────────────────────────────────────────────
check('determinism: identical input → byte-identical geometry', () => {
  const p1 = buildStrokeGeometry(sine).geometry.getAttribute('position').array;
  const p2 = buildStrokeGeometry(sine).geometry.getAttribute('position').array;
  assert(p1.length === p2.length, 'vertex counts differ across runs');
  for (let i = 0; i < p1.length; i++) {
    assert(p1[i] === p2[i], `position[${i}] differs: ${p1[i]} vs ${p2[i]}`);
  }
});

check('strokesKey: stable + sensitive to stroke edits', () => {
  const k1 = strokesKey([sine, loop]);
  const k2 = strokesKey([sine, loop]);
  const k3 = strokesKey([sine]);
  assert(k1 === k2, 'key not stable');
  assert(k1 !== k3, 'key not sensitive to pool changes');
});

// ── Report ──────────────────────────────────────────────────────────────────
let failed = 0;
for (const r of results) {
  if (r.ok) {
    console.log(`PASS  ${r.name}`);
  } else {
    failed++;
    console.log(`FAIL  ${r.name} — ${r.msg}`);
  }
}
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed === 0 ? 0 : 1);
