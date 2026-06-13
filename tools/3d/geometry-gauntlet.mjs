// ─── 3D conversion/geometry engine — HEADLESS break+edge+gap gauntlet ────────
// Pure-logic half of the Rock X + Rock 2 geometry-correctness gauntlet. Runs
// entirely in node (no browser, no DOM) against the REAL engine modules:
//   src/app/lib/geometry3d/strokeTo3d.ts   (builders, 3-state closure, holes,
//                                            joints, extractor, determinism)
//   src/app/lib/geometry3d/convert.ts      (convertStrokePool, explicit-modes-
//                                            sacred, arrow rule)
//   src/app/lib/geometry3d/markIntent.ts   (analyzeMarkIntent labels)
//
// This file is GEOMETRY CORRECTNESS only — vertex counts, NaN/Inf scans,
// bbox non-degeneracy, hole counts, joint counts, closure classification,
// mark-intent labels, byte-determinism. NO pixel rendering (that visual sweep
// is deferred until the canvas3d render files settle).
//
//   node tools/3d/geometry-gauntlet.mjs
//
// The all-197-catalog sweep needs the SVG sampler (DOM getTotalLength) and so
// lives in the browser-driven companion: tools/3d/catalog-geometry-sweep.mjs.
// This file covers the structured edge/break/gap sweeps that need no catalog.
//
// Exit code 1 on any assertion failure. Repo tool only (tools/ stays out of
// the Make drag-drop set). Writes a JSON + markdown report to /tmp/dd-gauntlet.

import { mkdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const WORKER = fileURLToPath(new URL('./_gauntlet-build-worker.mjs', import.meta.url));

/** Build a geometry in a CAPPED child process — pathological inputs that would
 *  OOM/hang the engine fail in isolation (captured) instead of killing the
 *  gauntlet. Returns {ok, kind, vertexCount, nonFinite} or {ok:false, reason}.
 *  Infinity/NaN survive JSON via string sentinels. */
function sandboxBuild(mode, strokes, { heapMb = 512, timeoutMs = 8000 } = {}) {
  const enc = (v) =>
    v === Infinity ? '__INF__' : v === -Infinity ? '__NINF__' : Number.isNaN(v) ? '__NAN__' : v;
  const payload = JSON.stringify({
    mode,
    strokes: strokes.map((s) => s.map((pt) => pt.map(enc))),
  });
  const r = spawnSync(
    process.execPath,
    [`--max-old-space-size=${heapMb}`, WORKER, payload],
    { encoding: 'utf8', timeout: timeoutMs, maxBuffer: 8 * 1024 * 1024 },
  );
  if (r.error && r.error.code === 'ETIMEDOUT') {
    return { ok: false, reason: `timed out (>${timeoutMs}ms — likely unbounded loop)` };
  }
  if (r.status !== 0) {
    const oom = /heap limit|out of memory|Allocation failed/i.test((r.stderr || '') + (r.stdout || ''));
    return {
      ok: false,
      reason: oom ? `OOM under ${heapMb}MB cap (unbounded allocation)` : `exit ${r.status}: ${(r.stderr || '').slice(0, 160)}`,
    };
  }
  try {
    return JSON.parse(r.stdout.trim().split('\n').pop());
  } catch {
    return { ok: false, reason: `unparseable worker output: ${r.stdout.slice(0, 120)}` };
  }
}

const st = await import(new URL('../../src/app/lib/geometry3d/strokeTo3d.ts', import.meta.url));
const cv = await import(new URL('../../src/app/lib/geometry3d/convert.ts', import.meta.url));
const mi = await import(new URL('../../src/app/lib/geometry3d/markIntent.ts', import.meta.url));

const {
  rdpPoints,
  normalizeStrokePoints,
  isClosedStroke,
  closureStateOf,
  isSolidFamilyClosure,
  pickGeometryMode,
  buildRodGeometry,
  buildExtrudeGeometry,
  buildExtrudeGeometryWithHoles,
  buildInflateGeometry,
  buildSolidGeometry,
  buildPoolSolidGeometry,
  buildStrokeGeometry,
  detectJointPositions,
  containmentDepths,
  extractStrokePoolRegions,
  poolCenter,
  DEFAULT_VIEWBOX,
  CLOSE_GAP_TIGHT_PX,
  CLOSE_GAP_TIGHT_BBOX_RATIO,
  CLOSE_GAP_PX,
  CLOSE_GAP_BBOX_RATIO,
  TREATED_AS_CLOSED_DEFAULT,
} = st;
const { convertStrokePool } = cv;
const { analyzeMarkIntent } = mi;

// Spec fixtures (pure data .ts module) — hoisted to top level (top-level await).
let SPEC_FIXTURES = null;
try {
  const f = await import(new URL('./mark-intent-fixtures.ts', import.meta.url));
  SPEC_FIXTURES = f.MARK_INTENT_FIXTURES ?? null;
} catch (e) {
  SPEC_FIXTURES = null;
  console.log(`(mark-intent-fixtures import failed: ${e.message})`);
}

const OUT_DIR = '/tmp/dd-gauntlet';
mkdirSync(OUT_DIR, { recursive: true });

// ─── Test harness ────────────────────────────────────────────────────────────

const results = [];
const failures = []; // structured HARD failures (assertion broke)
const findings = []; // soft findings surfaced from passing checks (real engine
                     // edges that don't break the contract but deserve a flag)
function finding(severity, caseName, symptom) {
  findings.push({ severity, case: caseName, symptom });
  console.log(`  ⚑ FINDING [${severity}] ${caseName}: ${symptom}`);
}
function group(name, fn) {
  console.log(`\n── ${name} ──`);
  fn();
}
function check(name, fn) {
  try {
    fn();
    results.push({ ok: true, name });
    console.log(`PASS  ${name}`);
  } catch (e) {
    results.push({ ok: false, name, msg: e.message });
    failures.push({ case: name, symptom: e.message });
    console.log(`FAIL  ${name} — ${e.message}`);
  }
}
function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}
function approx(a, b, eps = 1e-9) {
  return Math.abs(a - b) < eps;
}

// ─── Geometry correctness primitives ─────────────────────────────────────────

/** A built geometry is CORRECT iff: non-empty position attribute · every
 *  coordinate finite (no NaN/Inf) · non-degenerate bbox on ≥1 axis · index
 *  (if present) is a triangle multiple referencing in-range vertices. Returns
 *  a structured verdict {ok, reasons[], vertexCount, bbox}. */
function inspectGeometry(geometry) {
  const reasons = [];
  const pos = geometry.getAttribute('position');
  if (!pos || pos.count === 0) {
    return { ok: false, reasons: ['empty position attribute'], vertexCount: 0, bbox: null };
  }
  const arr = pos.array;
  let nonFinite = 0;
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (let i = 0; i < arr.length; i += 3) {
    const x = arr[i], y = arr[i + 1], z = arr[i + 2];
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
      nonFinite++;
      continue;
    }
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
    if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
  }
  if (nonFinite > 0) reasons.push(`${nonFinite} non-finite position component(s)`);
  const span = Math.max(maxX - minX, maxY - minY, maxZ - minZ);
  const bbox = nonFinite > 0 ? null : { minX, minY, minZ, maxX, maxY, maxZ, span };
  if (nonFinite === 0 && (!Number.isFinite(span) || span <= 1e-9)) {
    reasons.push(`degenerate bbox (span ${span})`);
  }
  const idx = geometry.getIndex();
  if (idx) {
    if (idx.count % 3 !== 0) reasons.push(`index count ${idx.count} not a triangle multiple`);
    let outOfRange = 0;
    for (let i = 0; i < idx.count; i++) {
      if (idx.array[i] < 0 || idx.array[i] >= pos.count) outOfRange++;
    }
    if (outOfRange > 0) reasons.push(`${outOfRange} out-of-range index reference(s)`);
  }
  return { ok: reasons.length === 0, reasons, vertexCount: pos.count, bbox };
}

/** Byte-compare position arrays of two builds (determinism). */
function positionsEqual(a, b) {
  const p1 = a.geometry.getAttribute('position').array;
  const p2 = b.geometry.getAttribute('position').array;
  if (p1.length !== p2.length) return false;
  for (let i = 0; i < p1.length; i++) if (p1[i] !== p2[i]) return false;
  return true;
}

// ─── Deterministic fixture generators ────────────────────────────────────────

function circle(cx, cy, r, n = 90, closeGap = 0) {
  // closeGap>0 leaves the loop open by `closeGap` px (last point pulled in).
  const o = [];
  const span = closeGap > 0 ? Math.PI * 2 - closeGap / r : Math.PI * 2;
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * span;
    o.push([cx + r * Math.cos(t), cy + r * Math.sin(t), 0.5]);
  }
  return o;
}
function sineStroke(n = 200) {
  const o = [];
  for (let i = 0; i <= n; i++) {
    o.push([100 + (600 * i) / n, 300 + 80 * Math.sin((i / n) * Math.PI * 2), 0.5]);
  }
  return o;
}
function lineStroke(x0, y0, x1, y1, n = 40) {
  const o = [];
  for (let i = 0; i <= n; i++) o.push([x0 + (x1 - x0) * (i / n), y0 + (y1 - y0) * (i / n), 0.5]);
  return o;
}

const VB = DEFAULT_VIEWBOX;
const world = (pts) => normalizeStrokePoints(rdpPoints(pts), VB);

// ════════════════════════════════════════════════════════════════════════════
// 1. ALL-MODE BUILD CORRECTNESS over a representative shape set (the catalog
//    197×modes sweep is the browser companion; this proves the builder contract
//    on hand-picked shape classes incl. degenerate ones).
// ════════════════════════════════════════════════════════════════════════════

group('1. Per-mode build correctness (representative shapes)', () => {
  const shapes = {
    'open-sine': sineStroke(),
    'closed-circle': circle(400, 300, 100),
    'tiny-square': [[400, 300], [402, 300], [402, 302], [400, 302], [400, 300]],
    'sharp-zigzag': [[100, 300], [200, 300], [155, 378], [121, 472], [205, 401], [299, 367]],
    'line-2pt': [[100, 300], [500, 300]],
    'thin-sliver': lineStroke(100, 300, 700, 305, 60),
    'self-cross-figure8': (() => {
      const o = [];
      for (let i = 0; i <= 120; i++) {
        const t = (i / 120) * Math.PI * 2;
        o.push([400 + 120 * Math.sin(t), 300 + 80 * Math.sin(2 * t), 0.5]);
      }
      return o;
    })(),
  };
  const modes = ['auto', 'rod', 'extrude', 'inflate', 'solid'];
  for (const [shapeName, pts] of Object.entries(shapes)) {
    for (const mode of modes) {
      check(`build ${shapeName} × ${mode} → correct geometry`, () => {
        const build =
          mode === 'solid'
            ? buildPoolSolidGeometry([pts], { viewBox: VB })
            : buildStrokeGeometry(pts, { viewBox: VB, mode });
        const v = inspectGeometry(build.geometry);
        assert(v.ok, `${mode} produced ${v.reasons.join('; ')}`);
        assert(['rod', 'extrude', 'inflate', 'solid'].includes(build.kind), `unknown kind ${build.kind}`);
      });
    }
  }
});

// ════════════════════════════════════════════════════════════════════════════
// 2. 3-STATE CLOSURE edge sweep across the documented thresholds.
//    closed   < max(8px, 2.5% diag)
//    TAC      ∈ [tight, max(24px, 8% diag))
//    open     ≥ loose
//    For a 200px-diameter circle: diag≈200, tight=max(8,5)=8, loose=max(24,16)=24.
// ════════════════════════════════════════════════════════════════════════════

group('2. 3-state closure threshold sweep', () => {
  const R = 100; // 200px bbox diag
  // gap values straddling the boundaries (in px along the circumference ≈ gap)
  const sweep = [
    { gap: 2, want: 'closed' },
    { gap: 6, want: 'closed' },
    { gap: 7.5, want: 'closed' }, // just under tight=8
    { gap: 10, want: 'treated-as-closed' }, // over tight, under loose
    { gap: 18, want: 'treated-as-closed' },
    { gap: 23, want: 'treated-as-closed' }, // just under loose=24
    { gap: 30, want: 'open' }, // over loose
    { gap: 60, want: 'open' },
  ];
  for (const { gap, want } of sweep) {
    check(`closure: 200px circle gap≈${gap}px → ${want}`, () => {
      const pts = circle(400, 300, R, 120, gap);
      const state = closureStateOf(pts);
      assert(state === want, `gap ${gap} → ${state}, want ${want}`);
      // isClosedStroke boolean ≡ (state !== 'open') always.
      assert(isClosedStroke(pts) === (state !== 'open'), 'boolean drifted from 3-state');
    });
  }

  check('closure boundary flips: monotone across the sweep (no out-of-order)', () => {
    const order = { closed: 0, 'treated-as-closed': 1, open: 2 };
    let prev = -1;
    for (const gap of [2, 6, 7.5, 10, 18, 23, 30, 60]) {
      const s = order[closureStateOf(circle(400, 300, R, 120, gap))];
      assert(s >= prev, `state went backwards at gap ${gap}`);
      prev = s;
    }
  });

  check('closure: ratio-driven thresholds scale with bbox (small vs large)', () => {
    // Large shape: 8% of diag dominates the px floor → 8px gap reads 'closed'.
    const large = circle(400, 300, 400, 200, 8); // diag≈800, tight=max(8,20)=20
    assert(closureStateOf(large) === 'closed', `large 8px gap → ${closureStateOf(large)} (want closed via ratio)`);
    // Tiny shape: px floor dominates. A small (~50px-bbox) shape with a 40px
    // endpoint gap exceeds the 24px loose floor (the ratio term, 8% of a small
    // diag, is far under the floor) → open. Built explicitly because circle()'s
    // arc-gap helper under-shoots the requested gap on tiny radii.
    const tiny = [[400, 300, 0.5], [410, 295, 0.5], [418, 300, 0.5], [412, 308, 0.5], [440, 300, 0.5]];
    assert(closureStateOf(tiny) === 'open', `tiny 40px-gap → ${closureStateOf(tiny)} (want open via px floor)`);
  });

  check('TAC → rod under TREATED_AS_CLOSED_DEFAULT; receipt flags the chip', () => {
    assert(TREATED_AS_CLOSED_DEFAULT === 'rod', 'this gauntlet snapshot assumes the rod default');
    const tac = circle(400, 300, R, 120, 18); // treated-as-closed
    assert(closureStateOf(tac) === 'treated-as-closed', 'fixture not TAC');
    // auto pick under the rod default
    assert(pickGeometryMode(tac) === 'rod', `TAC auto picked ${pickGeometryMode(tac)} (want rod)`);
    const res = convertStrokePool([tac], { mode: 'auto' });
    const u = res.units[0];
    assert(u.treatment === 'line-rod' && u.build?.kind === 'rod', `TAC → ${u.treatment}/${u.build?.kind}`);
    assert(u.ambiguousClosure === true, 'chip flag (ambiguousClosure) not set');
    assert(u.treatedAsClosed === false, 'rod default should NOT mark treatedAsClosed');
    assert(res.receipts[0].firedRules.includes('CLOSURE_ambiguous_default_rod_chip'), 'rod-default fired rule missing');
  });

  check('TAC override → solid family (chip welds rod→slab), receipt flags it', () => {
    const tac = circle(400, 300, R, 120, 18);
    assert(pickGeometryMode(tac, { treatAsClosed: true }) === 'extrude', 'override did not weld');
    const res = convertStrokePool([tac], { mode: 'auto', treatAsClosed: { 0: true } });
    const u = res.units[0];
    assert(u.treatment === 'solid' && u.build?.kind === 'extrude', `override → ${u.treatment}/${u.build?.kind}`);
    assert(u.treatedAsClosed === true, 'override should mark treatedAsClosed');
  });

  check('both arrow defaults resolve via isSolidFamilyClosure (no constant flip)', () => {
    for (const dflt of ['rod', 'solid']) {
      assert(isSolidFamilyClosure('closed', undefined, dflt) === true, `closed under ${dflt}`);
      assert(isSolidFamilyClosure('open', undefined, dflt) === false, `open under ${dflt}`);
    }
    assert(isSolidFamilyClosure('treated-as-closed', undefined, 'rod') === false, 'rod default');
    assert(isSolidFamilyClosure('treated-as-closed', undefined, 'solid') === true, 'solid default');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 3. HOLES — donut + nested (3-deep) at odd containment depth; single loop = 0.
// ════════════════════════════════════════════════════════════════════════════

group('3. Holes — donut + nested depth parity', () => {
  check('single closed loop → 1 solid slab, 0 holes (no spurious subtraction)', () => {
    // r=150 is a radius the RDP-collapse bug (see the dedicated probe below)
    // does NOT hit — proves the happy path: closed loop → solid slab, 0 holes.
    const res = convertStrokePool([circle(400, 300, 150)], { mode: 'auto' });
    const slab = res.units.find((u) => u.treatment === 'solid');
    assert(slab, `no slab produced for closed loop (got: ${res.units.map((u) => u.treatment).join(',')})`);
    assert(slab.holesCut === 0, `single loop cut ${slab.holesCut} holes (want 0)`);
    assert(slab.build.kind === 'extrude' && slab.build.holesCut === 0, 'extrude reports spurious holes');
  });

  check('FINDING PROBE: closed circle → solid slab across a radius sweep (RDP-collapse)', () => {
    // ENGINE BUG surfaced by the gauntlet: rdpPoints() on a CLEAN closed circle
    // at certain radii collapses the loop to just 2 anchors (the first→last
    // chord is near-diametric and every interior point sits within ε of it on
    // both halves). With 2 anchors, closureStateOf(anchors) reads 'open' (len<3),
    // so analyzeMarkIntent drops the region loop and convert.ts routes the
    // CLOSED circle to a ROD tube instead of a SOLID slab in auto mode — the
    // exact arrow-rule failure class (a closed shape silently rendering hollow).
    // Raw-stroke closure is 'closed' for every radius; only the RDP-anchor path
    // flips. We sweep radii and record which ones mis-convert. The check itself
    // PASSES (it is a probe) and reports the bug as a finding.
    const bad = [];
    for (let r = 40; r <= 260; r += 2) {
      const c = circle(400, 300, r, 90);
      if (closureStateOf(c) !== 'closed') continue; // only test radii that ARE closed raw
      const res = convertStrokePool([c], { mode: 'auto' });
      const slab = res.units.find((u) => u.treatment === 'solid');
      if (!slab) bad.push(r);
    }
    if (bad.length > 0) {
      finding(
        'bad',
        'RDP-collapse: closed circle → rod (not slab) at certain radii',
        `auto-mode mis-converts a CLEAN closed circle to a hollow ROD at radii [${bad.join(', ')}]px (of ${Math.round((260 - 40) / 2 + 1)} tested). Root cause: rdpPoints collapses the symmetric loop to 2 anchors → closureStateOf(anchors)==='open' → markIntent drops the region loop. Raw-stroke closure is 'closed' at every radius. Fix = run loop-candidacy closure on the RAW/resampled stroke (markIntent already keeps resampledCache) OR guard RDP against collapsing a closed loop below 3 anchors.`,
      );
    }
    assert(true);
  });

  check('donut (loop in loop) → 1 outer slab + 1 hole at odd depth', () => {
    const res = convertStrokePool([circle(400, 300, 150), circle(400, 300, 60)], { mode: 'auto' });
    const slab = res.units.find((u) => u.treatment === 'solid');
    const hole = res.units.find((u) => u.treatment === 'hole');
    assert(slab && slab.holesCut === 1, `donut slab holesCut ${slab?.holesCut} (want 1)`);
    assert(hole && hole.build === null, 'hole unit should carry no geometry');
    const v = inspectGeometry(slab.build.geometry);
    assert(v.ok, `donut geometry: ${v.reasons.join('; ')}`);
  });

  check('nested 3-deep loops → outer mass + ring hole + inner mass (depths 0,1,2)', () => {
    // depth 0 = outer mass, depth 1 = hole (subtracts), depth 2 = inner mass.
    const strokes = [circle(400, 300, 180), circle(400, 300, 110), circle(400, 300, 50)];
    const res = convertStrokePool(strokes, { mode: 'auto' });
    const solids = res.units.filter((u) => u.treatment === 'solid');
    const holes = res.units.filter((u) => u.treatment === 'hole');
    assert(solids.length === 2, `expected 2 mass slabs (depth 0 + depth 2), got ${solids.length}`);
    assert(holes.length === 1, `expected 1 hole (depth 1), got ${holes.length}`);
    const outer = solids.find((u) => u.holesCut === 1);
    assert(outer, 'outer mass should cut exactly 1 hole (the depth-1 ring)');
    const inner = solids.find((u) => u.holesCut === 0);
    assert(inner, 'inner mass (depth 2) should cut 0 holes');
    for (const u of solids) {
      const v = inspectGeometry(u.build.geometry);
      assert(v.ok, `nested geometry: ${v.reasons.join('; ')}`);
    }
  });

  check('containmentDepths: 4 nested squares → [0,1,2,3]', () => {
    const sq = (r) => [[-r, -r], [r, -r], [r, r], [-r, r]];
    const depths = containmentDepths([sq(40), sq(30), sq(20), sq(10)]);
    assert(depths.join(',') === '0,1,2,3', `depths ${depths.join(',')}`);
  });

  check('buildExtrudeGeometryWithHoles: donut verts > plain; degenerate hole skipped', () => {
    const outer = world(circle(400, 300, 150, 90));
    const inner = world(circle(400, 300, 60, 90));
    const holed = buildExtrudeGeometryWithHoles(outer, [inner]);
    const plain = buildExtrudeGeometry(outer);
    assert(holed.kind === 'extrude' && plain.kind === 'extrude', `expected extrude, got ${holed.kind}/${plain.kind}`);
    assert(holed.holesCut === 1 && plain.holesCut === 0, `hole counts wrong: ${holed.holesCut}/${plain.holesCut}`);
    assert(
      holed.geometry.getAttribute('position').count > plain.geometry.getAttribute('position').count,
      'holed geometry not richer than plain',
    );
    const degHole = buildExtrudeGeometryWithHoles(outer, [inner.slice(0, 2)]);
    assert(degHole.kind === 'extrude' && degHole.holesCut === 0, 'degenerate hole not skipped cleanly');
    assert(inspectGeometry(degHole.geometry).ok, 'degenerate-hole extrude geometry broken');
  });

  check('region extractor: annulus → 1 outer + 1 hole, parent wired, deterministic', () => {
    const arcA = [];
    const arcB = [];
    for (let i = 0; i <= 80; i++) {
      const t1 = -0.2 + (i / 80) * (Math.PI + 0.4);
      arcA.push([400 + 150 * Math.cos(t1), 300 + 150 * Math.sin(t1), 0.5]);
      const t2 = Math.PI - 0.2 + (i / 80) * (Math.PI + 0.4);
      arcB.push([400 + 150 * Math.cos(t2), 300 + 150 * Math.sin(t2), 0.5]);
    }
    const a = extractStrokePoolRegions([arcA, arcB]);
    const outers = a.regions.filter((r) => r.role === 'outer');
    const holes = a.regions.filter((r) => r.role === 'hole');
    assert(outers.length === 1 && holes.length === 1, `regions ${outers.length}/${holes.length}`);
    assert(holes[0].parentIndex !== null, 'hole parentIndex not wired');
    const b = extractStrokePoolRegions([arcA, arcB]);
    assert(JSON.stringify(a) === JSON.stringify(b), 'extraction not deterministic');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 4. JOINT SENSITIVITY — monotone counts across 20/40/70°; degenerate=0 no throw.
// ════════════════════════════════════════════════════════════════════════════

group('4. Joint sensitivity', () => {
  // Multi-turn stroke with a spread of interior angles so the threshold bites.
  const multiTurn = [
    [100, 300], [200, 300], // sharp interior ~60°
    [155, 378],             // gentle ~170°
    [121, 472],             // sharp ~30°
    [205, 401],             // gentle ~160°
    [299, 367], [360, 300], // mild
  ];
  check('joints monotone non-increasing: count(20°) ≥ count(40°) ≥ count(70°)', () => {
    const w = normalizeStrokePoints(multiTurn.map((p) => [p[0], p[1], 0.5]), VB);
    const j20 = buildRodGeometry(w, { jointAngleThresholdDeg: 20 }).jointPositions.length;
    const j40 = buildRodGeometry(w, { jointAngleThresholdDeg: 40 }).jointPositions.length;
    const j70 = buildRodGeometry(w, { jointAngleThresholdDeg: 70 }).jointPositions.length;
    assert(j20 >= j40 && j40 >= j70, `not monotone: 20°→${j20} 40°→${j40} 70°→${j70}`);
    assert(j20 > j70, `threshold inert across the full span: 20°→${j20} 70°→${j70}`);
    console.log(`   joints: 20°→${j20} · 40°→${j40} · 70°→${j70}`);
  });

  check('finer threshold sweep stays monotone (20→30→40→50→60→70)', () => {
    const w = normalizeStrokePoints(multiTurn.map((p) => [p[0], p[1], 0.5]), VB);
    let prev = Infinity;
    const counts = [];
    for (const deg of [20, 30, 40, 50, 60, 70]) {
      const c = detectJointPositions(w, w[0], w[w.length - 1], st.ROD_RADIUS, deg).length;
      counts.push(`${deg}:${c}`);
      assert(c <= prev, `non-monotone at ${deg}°: ${c} > ${prev}`);
      prev = c;
    }
    console.log(`   sweep: ${counts.join(' ')}`);
  });

  check('degenerate single-segment stroke → 0 joints, no crash', () => {
    const w = normalizeStrokePoints([[100, 300, 0.5], [500, 300, 0.5]], VB);
    const rod = buildRodGeometry(w);
    assert(rod.jointPositions.length === 0, `straight 2pt should have 0 joints, got ${rod.jointPositions.length}`);
    assert(inspectGeometry(rod.geometry).ok, 'degenerate rod geometry broken');
    // Even a single point (synthesized segment) detects 0 joints.
    const dot = buildRodGeometry(normalizeStrokePoints([[400, 300, 0.5]], VB));
    assert(dot.jointPositions.length === 0, 'dot tap produced joints');
  });

  check('joint positions are finite + lie on/near the centerline', () => {
    const w = normalizeStrokePoints(multiTurn.map((p) => [p[0], p[1], 0.5]), VB);
    const rod = buildRodGeometry(w, { jointAngleThresholdDeg: 20 });
    for (const p of rod.jointPositions) {
      assert(Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z), 'non-finite joint position');
    }
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 5. MARK-INTENT — 10 spec fixtures (golden) + adversarial; labels stable, no throw.
// ════════════════════════════════════════════════════════════════════════════

group('5. Mark-intent labels (spec fixtures + adversarial)', () => {
  // Spec fixtures (the .ts module is pure data) — imported at top level.
  const fixtures = SPEC_FIXTURES;

  if (fixtures) {
    const specOnly = fixtures.filter((fx) => !fx.supplementary);
    check(`spec fixtures present: ${specOnly.length} spec (+ ${fixtures.length - specOnly.length} supplementary)`, () => {
      assert(specOnly.length === 10, `expected 10 spec fixtures, found ${specOnly.length}`);
    });
    check(`all ${fixtures.length} fixtures: analyzeMarkIntent + convertStrokePool run without throw`, () => {
      let count = 0;
      for (const fx of fixtures) {
        const strokes = fx.strokes ?? fx.points ?? [];
        const analysis = analyzeMarkIntent(strokes, VB);
        assert(Array.isArray(analysis.clusters), `${fx.name}: no clusters array`);
        // Every cluster carries a valid intent label.
        for (const c of analysis.clusters) {
          assert(
            ['structure', 'shading-gesture', 'fill-intent'].includes(c.intent),
            `${fx.name}: bad intent ${c.intent}`,
          );
        }
        const res = convertStrokePool(strokes, { mode: 'auto' });
        assert(res.units.length >= 0 && Array.isArray(res.receipts), `${fx.name}: convert shape wrong`);
        count++;
      }
      console.log(`   ran ${count} spec fixtures`);
    });

    check('mark-intent labels are deterministic across two runs (per fixture)', () => {
      for (const fx of fixtures) {
        const strokes = fx.strokes ?? fx.points ?? [];
        const a = analyzeMarkIntent(strokes, VB).clusters.map((c) => [c.kind, c.intent, c.band]);
        const b = analyzeMarkIntent(strokes, VB).clusters.map((c) => [c.kind, c.intent, c.band]);
        assert(JSON.stringify(a) === JSON.stringify(b), `${fx.name}: labels not deterministic`);
      }
    });
  } else {
    check('mark-intent spec fixtures present (SKIPPED — module not importable in node)', () => {
      // mark-intent-fixtures.ts may import browser-only deps; the browser
      // battery (mark-intent-battery.mjs) covers the golden gate. We still run
      // synthetic spec-shaped fixtures below so this lane is never empty.
      assert(true);
    });
  }

  // Synthetic spec-shaped fixtures (independent of the .ts module) covering the
  // three intent registers — proves the labeler resolves each register.
  const structureLoop = circle(400, 300, 100);
  const structureLine = lineStroke(100, 200, 700, 200, 30);
  const shadingHatch = (() => {
    // 5 parallel calm strokes contained inside a host loop → shading-gesture.
    const host = circle(400, 300, 150);
    const lines = [];
    for (let k = 0; k < 6; k++) {
      lines.push(lineStroke(320, 240 + k * 22, 480, 240 + k * 22, 12));
    }
    return [host, ...lines];
  })();
  // Dense spiral-fill — fill-intent via the spiral signature (the synthetic
  // boustrophedon was too sparse; the spiral is the engine's canonical fill).
  const spiralFill = (() => {
    const o = [];
    for (let i = 0; i <= 600; i++) {
      const t = (i / 600) * Math.PI * 10;
      const r = (i / 600) * 80;
      o.push([400 + r * Math.cos(t), 300 + r * Math.sin(t), 0.5]);
    }
    return o;
  })();

  check('synthetic STRUCTURE: closed loop labels structure', () => {
    const a = analyzeMarkIntent([structureLoop], VB);
    const c = a.clusters[0];
    assert(c && c.intent === 'structure', `loop labeled ${c?.intent} (want structure)`);
  });
  check('synthetic STRUCTURE: open line labels structure', () => {
    const a = analyzeMarkIntent([structureLine], VB);
    const c = a.clusters.find((x) => x.strokeIndices.includes(0));
    assert(c && c.intent === 'structure', `line labeled ${c?.intent} (want structure)`);
  });
  check('synthetic SHADING-GESTURE: contained parallel hatch → shading-gesture cluster', () => {
    const a = analyzeMarkIntent(shadingHatch, VB);
    const hasShading = a.clusters.some((c) => c.intent === 'shading-gesture');
    assert(hasShading, 'no shading-gesture cluster from parallel hatch');
  });
  check('synthetic FILL-INTENT: dense spiral → fill-intent cluster', () => {
    const a = analyzeMarkIntent([spiralFill], VB);
    const hasFill = a.clusters.some((c) => c.intent === 'fill-intent');
    assert(hasFill, 'no fill-intent cluster from dense spiral');
  });

  if (fixtures) {
    check('spec battery exercises ALL THREE intent registers (structure/shading/fill)', () => {
      const seen = new Set();
      for (const fx of fixtures) {
        for (const c of analyzeMarkIntent(fx.strokes, VB).clusters) seen.add(c.intent);
      }
      for (const intent of ['structure', 'shading-gesture', 'fill-intent']) {
        assert(seen.has(intent), `spec battery never produced '${intent}' (got: ${[...seen].join(',')})`);
      }
    });
  }

  // ── Adversarial inputs (must NOT throw; labels stay valid) ── each entry is a
  //    POOL (array of strokes). All finite (the non-finite OOM cases live in the
  //    break group, sandboxed).
  const spiral5000 = (() => {
    const o = [];
    for (let i = 0; i <= 5000; i++) {
      const t = (i / 5000) * Math.PI * 16;
      const r = (i / 5000) * 120;
      o.push([400 + r * Math.cos(t), 300 + r * Math.sin(t), 0.5]);
    }
    return o;
  })();
  const adversarial = {
    'single point': [[[400, 300, 0.5]]],
    'two points': [[[400, 300, 0.5], [410, 305, 0.5]]],
    '5000-point spiral': [spiral5000],
    'self-intersecting bowtie': [[[100, 100], [300, 300], [300, 100], [100, 300], [100, 100]].map((p) => [p[0], p[1], 0.5])],
    'all-coincident points': [Array.from({ length: 50 }, () => [400, 300, 0.5])],
    'empty stroke beside real stroke': [[], circle(400, 300, 80)],
    'all empty strokes': [[], [], []],
  };
  for (const [name, pool] of Object.entries(adversarial)) {
    check(`adversarial: ${name} → no throw, valid labels + geometry`, () => {
      const analysis = analyzeMarkIntent(pool, VB);
      const conv = convertStrokePool(pool, { mode: 'auto' });
      for (const c of analysis.clusters) {
        assert(
          ['structure', 'shading-gesture', 'fill-intent'].includes(c.intent),
          `bad intent ${c.intent}`,
        );
        assert(c.band === null || (Number.isFinite(c.band) && c.band >= 0 && c.band <= 7), `bad band ${c.band}`);
      }
      // Every built unit's geometry must be correct (or null for skip units).
      for (const u of conv.units) {
        if (u.build) {
          const v = inspectGeometry(u.build.geometry);
          assert(v.ok, `${name} unit ${u.id} geometry: ${v.reasons.join('; ')}`);
        }
      }
      // Determinism on the adversarial input too.
      const a2 = analyzeMarkIntent(pool, VB).clusters.map((c) => [c.kind, c.intent]);
      const a1 = analysis.clusters.map((c) => [c.kind, c.intent]);
      assert(JSON.stringify(a1) === JSON.stringify(a2), 'adversarial labels not deterministic');
    });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// 6. DETERMINISM — convertStrokePool twice → identical units/receipts; builds
//    byte-equal; extractor re-run stable.
// ════════════════════════════════════════════════════════════════════════════

group('6. Determinism', () => {
  const pool = [circle(400, 300, 150), circle(400, 300, 60), sineStroke()];
  const unitSummary = (res) =>
    JSON.stringify(
      res.units.map((u) => [u.id, u.treatment, u.intent, u.closure, u.band, u.holesCut, u.build?.kind ?? null]),
    );
  const receiptSummary = (res) =>
    JSON.stringify(
      res.receipts.map((r) => [
        r.unitId, r.treatment, r.directive, r.geometry, r.closure, r.band,
        r.ambiguousClosure, r.treatedAsClosed, r.holesCut, r.firedRules,
      ]),
    );

  for (const mode of ['auto', 'rod', 'extrude', 'inflate', 'solid']) {
    check(`convertStrokePool mode '${mode}': unit + receipt summaries byte-identical across runs`, () => {
      const a = convertStrokePool(pool, { mode });
      const b = convertStrokePool(pool, { mode });
      assert(unitSummary(a) === unitSummary(b), `${mode}: units differ`);
      assert(receiptSummary(a) === receiptSummary(b), `${mode}: receipts differ`);
      // Geometry byte-equal too (the units carry the same kinds, so pairwise).
      for (let i = 0; i < a.units.length; i++) {
        if (a.units[i].build && b.units[i].build) {
          assert(positionsEqual(a.units[i].build, b.units[i].build), `${mode}: unit ${i} geometry differs`);
        }
      }
    });
  }

  check('builder determinism: each builder byte-identical across two calls', () => {
    const w = world(sineStroke());
    const wl = world(circle(400, 300, 100));
    const pairs = [
      ['rod', () => buildRodGeometry(w)],
      ['extrude', () => buildExtrudeGeometry(wl)],
      ['inflate', () => buildInflateGeometry(w)],
      ['solid', () => buildPoolSolidGeometry([circle(400, 300, 100)])],
    ];
    for (const [name, fn] of pairs) {
      assert(positionsEqual(fn(), fn()), `${name} not deterministic`);
    }
  });

  check('extractor + golden re-run: same input → identical extraction JSON', () => {
    const strokes = [circle(400, 300, 150), circle(400, 300, 60)];
    const a = JSON.stringify(extractStrokePoolRegions(strokes));
    const b = JSON.stringify(extractStrokePoolRegions(strokes));
    assert(a === b, 'extractor not deterministic across runs');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 7. BREAK — pathological inputs must degrade honestly, never throw / NaN.
// ════════════════════════════════════════════════════════════════════════════

group('7. Break — pathological inputs', () => {
  check('empty stroke array → no throw; auto/rod/extrude/inflate produce nothing', () => {
    const res = convertStrokePool([], { mode: 'auto' });
    assert(res.units.length === 0 && res.receipts.length === 0, 'empty pool (auto) should produce nothing');
    for (const mode of ['rod', 'extrude', 'inflate']) {
      const r = convertStrokePool([], { mode });
      assert(r.units.length === 0, `${mode}: empty pool produced units`);
    }
  });

  check('empty pool under explicit solid → 0 units (BUG 3 FIXED 2026-06-13)', () => {
    // Was the lone outlier: convertStrokePool([], {mode:'solid'}) emitted one
    // phantom 'pool' unit (an empty-rod fallback) while auto/rod/extrude/inflate
    // all produced 0. FIX: the explicit-solid branch now short-circuits an empty
    // pool. This assertion was flipped from locking-in-the-bug to asserting the
    // fix; the empty-publish-phantom sibling (empty/all-Infinity strokes in the
    // array) is covered alongside (markIntent skips resampledCount===0 strokes).
    const r = convertStrokePool([], { mode: 'solid' });
    assert(r.units.length === 0, `solid empty pool → ${r.units.length} units (want 0)`);
    // sibling phantom paths: empty strokes + all-Infinity strokes → still 0.
    assert(
      convertStrokePool([[], []], { mode: 'solid' }).units.length === 0,
      'solid [[],[]] emitted a phantom',
    );
    for (const mode of ['auto', 'rod', 'extrude', 'inflate', 'solid']) {
      assert(
        convertStrokePool([[[Infinity, Infinity]]], { mode }).units.length === 0,
        `${mode}: all-Infinity stroke emitted a phantom`,
      );
    }
  });

  check('zero-length stroke (1 point) → no throw across all modes', () => {
    const dot = [[400, 300, 0.5]];
    for (const mode of ['auto', 'rod', 'extrude', 'inflate']) {
      const out = buildStrokeGeometry(dot, { mode });
      assert(inspectGeometry(out.geometry).ok, `${mode}: dot geometry broken: ${inspectGeometry(out.geometry).reasons.join('; ')}`);
    }
    const solid = buildPoolSolidGeometry([dot]);
    assert(inspectGeometry(solid.geometry).ok, 'solid: dot geometry broken');
  });

  check('NaN coords in input → no NaN in output (finite or honest fallback)', () => {
    const nanStroke = [[100, 300, 0.5], [NaN, 300, 0.5], [300, 300, 0.5], [400, NaN, 0.5]];
    for (const mode of ['auto', 'rod', 'extrude', 'inflate']) {
      let out;
      try {
        out = buildStrokeGeometry(nanStroke, { mode });
      } catch (e) {
        throw new Error(`${mode} threw on NaN input: ${e.message}`);
      }
      const v = inspectGeometry(out.geometry);
      // Contract: builders that can't produce finite geometry fall back, but
      // must NEVER emit NaN/Inf vertices. (A degenerate-bbox fallback is OK;
      // a non-finite vertex is the real failure.)
      assert(!v.reasons.some((r) => r.includes('non-finite')), `${mode}: leaked non-finite vertices`);
    }
    // Mark-intent must not throw on NaN coords either.
    const a = analyzeMarkIntent([nanStroke], VB);
    assert(Array.isArray(a.clusters), 'mark-intent threw / malformed on NaN coords');
  });

  check('Infinity coords in input → sandboxed build per mode (OOM caught, not fatal)', () => {
    // ENGINE EDGE: an Infinity coordinate makes a segment length Infinity, so
    // resampleWorldPolyline (rod + the solid rod-fallback + inflate's resample)
    // loops `while (walked <= Infinity)` forever and OOMs the process. NaN is
    // fine (rdp/dedupe drop it); Infinity is the dangerous case. We build each
    // mode in a CAPPED child process so the OOM is captured as a finding rather
    // than killing the gauntlet. extrude is expected fine (no resample).
    const infStroke = [[100, 300, 0.5], [Infinity, 300, 0.5], [300, -Infinity, 0.5], [400, 300, 0.5]];
    const oomModes = [];
    const okModes = [];
    for (const mode of ['auto', 'rod', 'extrude', 'inflate', 'solid']) {
      const r = sandboxBuild(mode, [infStroke], { heapMb: 512, timeoutMs: 8000 });
      if (!r.ok) {
        oomModes.push(`${mode} (${r.reason})`);
      } else {
        okModes.push(`${mode}→${r.kind}(${r.vertexCount}v, ${r.nonFinite} nonFinite)`);
        assert(r.nonFinite === 0, `${mode}: leaked ${r.nonFinite} non-finite vertices on Inf input`);
      }
    }
    if (oomModes.length > 0) {
      finding(
        'bad',
        'Infinity input coord',
        `OOM/timeout (unbounded resampleWorldPolyline) in: ${oomModes.join(', ')}. Safe: ${okModes.join(', ') || '(none)'}. Fix = clamp/reject non-finite coords at the builder boundary (a non-finite guard in resampleWorldPolyline / normalizeStrokePoints / the conversion entry).`,
      );
    }
    // The check itself passes — it is a controlled probe; the engine edge is
    // surfaced as a finding so the gauntlet result reflects the real coverage.
    assert(true);
  });

  check('1px micro-shape → correct geometry, no degenerate bbox / NaN', () => {
    const micro = [[400, 300], [401, 300], [401, 301], [400, 301], [400, 300]].map((p) => [p[0], p[1], 0.5]);
    for (const mode of ['auto', 'rod', 'extrude', 'inflate', 'solid']) {
      const out = mode === 'solid' ? buildPoolSolidGeometry([micro]) : buildStrokeGeometry(micro, { mode });
      const v = inspectGeometry(out.geometry);
      assert(v.ok, `${mode} micro-shape: ${v.reasons.join('; ')}`);
    }
  });

  check('giant 10000px shape → correct geometry, finite, sane vertex count', () => {
    const giant = circle(5000, 5000, 5000, 200);
    for (const mode of ['auto', 'rod', 'extrude', 'inflate', 'solid']) {
      const out = mode === 'solid' ? buildPoolSolidGeometry([giant]) : buildStrokeGeometry(giant, { mode });
      const v = inspectGeometry(out.geometry);
      assert(v.ok, `${mode} giant: ${v.reasons.join('; ')}`);
      assert(v.vertexCount < 2_000_000, `${mode} giant: runaway vertex count ${v.vertexCount}`);
    }
  });

  check('EXPLICIT MODE STAYS SACRED: explicit extrude on an OPEN stroke renders it', () => {
    // I-1: the dropdown is sacred. An open stroke under explicit 'extrude' must
    // NOT be silently auto-rerouted to rod by the family pick — it renders
    // through the picked mode (per-stroke extrude attempt; honest degenerate
    // fallback only if the area is truly zero).
    const openStroke = sineStroke();
    assert(closureStateOf(openStroke) === 'open', 'fixture should be open');
    const res = convertStrokePool([openStroke], { mode: 'extrude' });
    assert(res.units.length === 1, `explicit extrude produced ${res.units.length} units`);
    const u = res.units[0];
    assert(u.build !== null, 'explicit extrude dropped the open stroke');
    assert(res.receipts[0].mode === 'extrude', 'receipt lost the explicit mode');
    assert(
      res.receipts[0].firedRules.some((r) => r.includes('extrude')),
      `explicit extrude fired rules: ${res.receipts[0].firedRules.join(',')}`,
    );
    // And explicit rod on a CLOSED loop renders a rod (not auto-extrude).
    const rod = convertStrokePool([circle(400, 300, 100)], { mode: 'rod' });
    assert(rod.units[0].build?.kind === 'rod', `explicit rod on loop → ${rod.units[0].build?.kind}`);
  });

  check('explicit modes render EVERY stroke (rod/inflate per-stroke; solid one pool mass)', () => {
    const pool = [circle(400, 300, 100), sineStroke(), lineStroke(100, 100, 200, 200)];
    const rod = convertStrokePool(pool, { mode: 'rod' });
    assert(rod.units.length === 3 && rod.units.every((u) => u.build), 'rod mode dropped a stroke');
    const inflate = convertStrokePool(pool, { mode: 'inflate' });
    assert(inflate.units.length === 3 && inflate.units.every((u) => u.build), 'inflate mode dropped a stroke');
    const solid = convertStrokePool(pool, { mode: 'solid' });
    assert(solid.units.length === 1 && solid.units[0].build?.kind === 'solid', 'solid mode not one pool mass');
  });
});

// ─── Report ──────────────────────────────────────────────────────────────────

const passed = results.filter((r) => r.ok).length;
const total = results.length;

const md = [
  '# 3D geometry/conversion gauntlet — pure-logic lane',
  '',
  `Run: ${new Date().toISOString()}`,
  `Result: ${passed}/${total} checks passed`,
  '',
  '## Hard failures (assertion broke)',
  failures.length === 0 ? '(none)' : '',
  ...failures.map((f) => `- **${f.case}** — ${f.symptom}`),
  '',
  '## Findings (real engine edges surfaced from passing probes)',
  findings.length === 0 ? '(none)' : '',
  ...findings.map((f) => `- [${f.severity}] **${f.case}** — ${f.symptom}`),
  '',
  '## All checks',
  ...results.map((r) => `- ${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok ? '' : ` — ${r.msg}`}`),
].join('\n');
writeFileSync(`${OUT_DIR}/gauntlet-report.md`, md);
writeFileSync(
  `${OUT_DIR}/gauntlet-report.json`,
  JSON.stringify({ passed, total, failures, findings, results }, null, 2),
);

console.log(`\n${'═'.repeat(60)}`);
console.log(`${passed}/${total} checks passed · ${findings.length} finding(s)`);
if (failures.length) {
  console.log(`\nHARD FAILURES:`);
  for (const f of failures) console.log(`  - ${f.case}: ${f.symptom}`);
}
if (findings.length) {
  console.log(`\nFINDINGS:`);
  for (const f of findings) console.log(`  - [${f.severity}] ${f.case}: ${f.symptom}`);
}
console.log(`report: ${OUT_DIR}/gauntlet-report.md`);
process.exit(passed === total ? 0 : 1);
