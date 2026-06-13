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

// p-point STAR outline (alternating outer/inner radius), sampled along edges.
function star(cx, cy, rOut, rIn, points, perEdge, rot = -Math.PI / 2, jit = 0) {
  const tips = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? rOut : rIn;
    const a = rot + (i / (points * 2)) * TAU;
    tips.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  const out = [];
  const m = tips.length;
  for (let s = 0; s < m; s++) {
    const A = tips[s];
    const B = tips[(s + 1) % m];
    for (let t = 0; t < perEdge; t++) {
      const u = t / perEdge;
      const j = jit ? Math.sin((s * perEdge + t) * 1.9) * jit : 0;
      const nx = -(B[1] - A[1]);
      const ny = B[0] - A[0];
      const nl = Math.hypot(nx, ny) || 1;
      out.push([A[0] + (B[0] - A[0]) * u + (nx / nl) * j, A[1] + (B[1] - A[1]) * u + (ny / nl) * j]);
    }
  }
  out.push([...tips[0]]);
  return out;
}

// Sample a vertex chain (open) at perEdge points per edge.
function chain(verts, perEdge) {
  const out = [];
  for (let s = 0; s + 1 < verts.length; s++) {
    const A = verts[s];
    const B = verts[s + 1];
    for (let t = 0; t < perEdge; t++) {
      const u = t / perEdge;
      out.push([A[0] + (B[0] - A[0]) * u, A[1] + (B[1] - A[1]) * u]);
    }
  }
  out.push([...verts[verts.length - 1]]);
  return out;
}

// V-head ARROW: shaft tail→tip, then two barbs folding BACK off the shaft by
// `spreadDeg` (a real arrowhead ≈30-40°). Single-stroke chain tail→tip→barbA→barbB.
function arrowV(tail, tip, barbLen, spreadDeg, perEdge) {
  const rot = (vx, vy, a) => [vx * Math.cos(a) - vy * Math.sin(a), vx * Math.sin(a) + vy * Math.cos(a)];
  const dx = tip[0] - tail[0];
  const dy = tip[1] - tail[1];
  const dl = Math.hypot(dx, dy) || 1;
  const ux = dx / dl;
  const uy = dy / dl;
  const ang = (spreadDeg * Math.PI) / 180;
  const [b1x, b1y] = rot(-ux, -uy, ang);
  const [b2x, b2y] = rot(-ux, -uy, -ang);
  const barbA = [tip[0] + b1x * barbLen, tip[1] + b1y * barbLen];
  const barbB = [tip[0] + b2x * barbLen, tip[1] + b2y * barbLen];
  return chain([tail, tip, barbA, barbB], perEdge);
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
  // ─── Bug-1 regression: clean rect / triangle must beat generic polygon ──────
  {
    id: 11,
    name: 'wide-rect-not-polygon',
    action: 'snap',
    // Wide axis-aligned rect — used to read as Polygon (4); must snap Rectangle.
    build: () => poly([[40, 80], [320, 82], [318, 150], [42, 148]], 25, true, 1.2),
    golden: { accepted: true, best: 'rect', chipIncludes: ['rect', 'polygon', 'original'] },
  },
  {
    id: 12,
    name: 'rotated-rect-not-polygon',
    action: 'snap',
    // 45° diamond (rotated square) — regularization used to inflate + lose to
    // polygon; circular-mean axis + mean-projection extents fix it.
    build: () => poly([[150, 60], [260, 150], [150, 260], [40, 150]], 22, true, 0.7),
    golden: { accepted: true, best: 'rect', chipIncludes: ['rect', 'original'] },
  },
  // ─── Bug-2: STAR recognizer ─────────────────────────────────────────────────
  {
    id: 13,
    name: 'five-point-star',
    action: 'snap',
    build: () => star(200, 200, 100, 42, 5, 8, -Math.PI / 2, 0),
    golden: { accepted: true, best: 'star', chipIncludes: ['star', 'original'] },
  },
  {
    id: '13b',
    name: 'star-jittered',
    action: 'snap',
    build: () => star(200, 200, 100, 42, 5, 8, -Math.PI / 2, 2.5),
    golden: { accepted: true, best: 'star', chipIncludes: ['star', 'original'] },
  },
  {
    id: 14,
    name: 'convex-pentagon-not-star',
    action: 'snap',
    // A CONVEX pentagon has zero concave notches → must NOT read as star.
    build: () => poly([[200, 60], [330, 160], [280, 300], [120, 300], [70, 160]], 12, true, 1),
    golden: { accepted: true, chipExcludes: ['star'] },
  },
  // ─── Bug-2: ARROW recognizer (shaft + V head) ───────────────────────────────
  {
    id: 15,
    name: 'arrow-vhead',
    action: 'snap',
    build: () => arrowV([60, 200], [300, 200], 50, 35, 18),
    golden: { accepted: true, best: 'arrow', chipIncludes: ['arrow', 'original'] },
  },
  {
    id: '15b',
    name: 'arrow-diagonal',
    action: 'snap',
    build: () => arrowV([60, 260], [280, 80], 55, 35, 18),
    golden: { accepted: true, best: 'arrow', chipIncludes: ['arrow', 'original'] },
  },
  {
    id: 16,
    name: 'zigzag-not-arrow',
    action: 'snap',
    // 4-segment W — no dominant shaft → must NOT read as arrow.
    build: () => poly([[40, 200], [120, 80], [200, 200], [280, 80], [360, 200]], 14, false, 0),
    golden: { accepted: true, best: 'polyline', chipExcludes: ['arrow'] },
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
  if (g.chipExcludes) {
    for (const k of g.chipExcludes) if (chip.includes(k)) problems.push(`chip should EXCLUDE ${k}`);
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
