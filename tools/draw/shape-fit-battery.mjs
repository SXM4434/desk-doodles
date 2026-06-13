// ─── shape-fit-battery — Rock F3 PURE-engine golden battery ──────────────────
// The engine (src/app/lib/draw/shapeFit.ts) is node-runnable by design, so this
// battery imports it DIRECTLY (no browser, no vite) and gates the 10 spec
// fixtures against golden expectations. Node v25 strips the TS types natively.
//
//   node tools/draw/shape-fit-battery.mjs           run + gate (exit 1 on fail)
//   node tools/draw/shape-fit-battery.mjs --verbose  full per-fixture dump
//
// Each fixture asserts: accepted flag, refusal reason (when refused), the best
// candidate kind, the ranked chip order, and (where load-bearing) the weld /
// circle-vs-ellipse ranking. Per-item table printed; exit 1 on ANY mismatch.
import { fitStroke, applyCandidate } from '../../src/app/lib/draw/shapeFit.ts';
import { closureStateOf } from '../../src/app/lib/geometry3d/strokeTo3d.ts';

const VERBOSE = process.argv.includes('--verbose');

// ─── Fixture builders (deterministic — no Math.random, pure geometry) ────────
const TAU = Math.PI * 2;

function arc(cx, cy, r, a0, a1, n, jitterAmp = 0, jitterFreq = 5) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = a0 + (a1 - a0) * t;
    const rr = r + (jitterAmp ? Math.sin(a * jitterFreq) * jitterAmp : 0);
    out.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]);
  }
  return out;
}

function poly(corners, perEdge, closeIt, wobble = 0) {
  const out = [];
  const m = corners.length;
  const segs = closeIt ? m : m - 1;
  for (let s = 0; s < segs; s++) {
    const a = corners[s];
    const b = corners[(s + 1) % m];
    for (let t = 0; t < perEdge; t++) {
      const u = t / perEdge;
      // Deterministic "wobble" via a sin of the running index (no randomness).
      const w = wobble ? Math.sin((s * perEdge + t) * 1.7) * wobble : 0;
      const nx = -(b[1] - a[1]);
      const ny = b[0] - a[0];
      const nl = Math.hypot(nx, ny) || 1;
      out.push([a[0] + (b[0] - a[0]) * u + (nx / nl) * w, a[1] + (b[1] - a[1]) * u + (ny / nl) * w]);
    }
  }
  if (closeIt) out.push([...corners[0]]);
  return out;
}

// Circle whose LAST point lands `gapPx` short of the first (controls closure).
function nearClosedCircle(cx, cy, r, n, gapPx) {
  const total = TAU - gapPx / r;
  return arc(cx, cy, r, 0, total, n);
}

const FIXTURES = [
  {
    id: 1,
    name: 'wobbly-circle',
    action: 'snap',
    build: () => arc(200, 200, 80, 0, TAU, 60, 4, 5),
    golden: { accepted: true, best: 'circle', chip: ['circle', 'ellipse', 'original'] },
  },
  {
    id: 2,
    name: 'quick-rect',
    action: 'snap',
    build: () => poly([[50, 50], [250, 52], [248, 160], [48, 158]], 11, true, 1.5),
    golden: { accepted: true, best: 'rect', chipIncludes: ['rect', 'original'] },
  },
  {
    id: 3,
    name: 'triangle',
    action: 'snap',
    build: () => poly([[150, 40], [260, 220], [40, 220]], 13, true, 0),
    golden: { accepted: true, best: 'triangle', chipIncludes: ['triangle', 'original'] },
  },
  {
    id: 4,
    name: 'straight-ish-line',
    action: 'snap',
    build: () => {
      const out = [];
      for (let t = 0; t <= 40; t++) out.push([40 + t * 5, 120 + Math.sin(t / 4) * 2]);
      return out;
    },
    golden: { accepted: true, best: 'line', chipIncludes: ['line', 'original'] },
  },
  {
    id: 5,
    name: 'polyline-straighten',
    action: 'straighten',
    build: () => poly([[40, 200], [120, 60], [200, 200], [280, 60]], 13, false, 0),
    golden: { accepted: true, best: 'polyline', chipIncludes: ['polyline', 'original'] },
  },
  {
    id: 6,
    name: 'open-arc-refused',
    action: 'snap',
    build: () => arc(200, 200, 90, 0, Math.PI, 30, 0),
    golden: { accepted: false, reason: 'no-candidate-below-threshold' },
  },
  {
    id: 7,
    name: 'scribble-refused',
    action: 'snap',
    build: () => {
      const out = [];
      for (let i = 0; i < 80; i++) out.push([100 + Math.sin(i * 0.9) * 60 + i * 1.5, 150 + Math.cos(i * 1.3) * 40]);
      return out;
    },
    golden: { accepted: false, reason: 'scribble-energy' },
  },
  {
    id: 8,
    name: 'near-circle-vs-ellipse-rank',
    action: 'snap',
    build: () => arc(200, 200, 82, 0, TAU, 60, 0).map(([x, y]) => [x, 200 + (y - 200) * (78 / 82)]),
    golden: { accepted: true, best: 'circle', chip: ['circle', 'ellipse', 'original'] },
  },
  {
    id: '8b',
    name: 'deliberate-oval',
    action: 'snap',
    build: () => arc(200, 200, 120, 0, TAU, 60, 0).map(([x, y]) => [x, 200 + (y - 200) * (66 / 120)]),
    golden: { accepted: true, best: 'ellipse', chipFirstNot: 'circle' },
  },
  {
    id: 9,
    name: 'tiny-refused',
    action: 'snap',
    build: () => [[100, 100], [108, 101], [112, 108], [103, 110], [100, 102]],
    golden: { accepted: false, reason: 'below-dot-floor' },
  },
  {
    id: 10,
    name: 'treated-as-closed-weld',
    action: 'snap',
    build: () => nearClosedCircle(200, 200, 80, 60, 16),
    golden: { accepted: true, best: 'circle', closure: 'treated-as-closed', weld: true },
  },
];

// ─── Run + gate ──────────────────────────────────────────────────────────────
let failures = 0;
const rows = [];

for (const f of FIXTURES) {
  const pts = f.build();
  const res = fitStroke(pts, f.action);
  const best = res.candidates[0]?.kind ?? '-';
  const chip = res.candidates.map((c) => c.kind);
  const g = f.golden;
  const problems = [];

  if (g.accepted !== res.accepted) problems.push(`accepted ${res.accepted}≠${g.accepted}`);
  if (g.reason && res.refusedReason !== g.reason) problems.push(`reason ${res.refusedReason}≠${g.reason}`);
  if (g.best && res.accepted && best !== g.best) problems.push(`best ${best}≠${g.best}`);
  if (g.chip) {
    if (JSON.stringify(chip) !== JSON.stringify(g.chip)) problems.push(`chip [${chip}]≠[${g.chip}]`);
  }
  if (g.chipIncludes) {
    for (const k of g.chipIncludes) if (!chip.includes(k)) problems.push(`chip missing ${k}`);
  }
  if (g.chipFirstNot && chip[0] === g.chipFirstNot) problems.push(`chip[0] should NOT be ${g.chipFirstNot}`);
  if (g.closure) {
    const cs = closureStateOf(pts);
    if (cs !== g.closure) problems.push(`closure ${cs}≠${g.closure}`);
  }
  if (g.weld && res.accepted) {
    const applied = applyCandidate(res.candidates[0], pts);
    const fst = applied[0];
    const lst = applied[applied.length - 1];
    const exactly = fst[0] === lst[0] && fst[1] === lst[1];
    if (!exactly) problems.push('NOT welded exactly closed');
  }

  const ok = problems.length === 0;
  if (!ok) failures++;
  rows.push({
    id: f.id,
    name: f.name,
    action: f.action,
    accepted: res.accepted,
    best: res.accepted ? best : `REFUSE(${res.refusedReason})`,
    chip: chip.join('>'),
    corners: res.diag.cornerCount,
    status: ok ? 'PASS' : 'FAIL: ' + problems.join('; '),
  });

  if (VERBOSE) {
    console.log(`\n#${f.id} ${f.name} [${f.action}]`);
    console.log('  diag:', JSON.stringify(res.diag));
    console.log('  candidates:', res.candidates.map((c) => `${c.kind}(${c.normErr.toFixed(4)})`).join(' > '));
  }
}

// Per-item table (never sample-and-claim — every fixture shown).
console.log('\n┌─ shape-fit pure-engine battery ─────────────────────────────────────');
for (const r of rows) {
  const mark = r.status.startsWith('PASS') ? '✓' : '✗';
  console.log(
    `│ ${mark} #${String(r.id).padEnd(3)} ${r.name.padEnd(28)} ${r.action.padEnd(10)} ` +
      `best=${String(r.best).padEnd(24)} corners=${r.corners}`,
  );
  console.log(`│      chip: ${r.chip}`);
  if (!r.status.startsWith('PASS')) console.log(`│      ${r.status}`);
}
console.log('└─────────────────────────────────────────────────────────────────────');
console.log(`\n${rows.length - failures}/${rows.length} PASS`);

process.exit(failures > 0 ? 1 : 0);
