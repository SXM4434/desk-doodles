// CATALOG GEOMETRY SWEEP driver — drives tools/3d/catalog-geometry-sweep.html
// headless through window.__gauntlet. This is the BROWSER-DRIVEN companion the
// pure-node tools/3d/geometry-gauntlet.mjs references: the FULL-CATALOG
// GEOMETRY-CORRECTNESS pass — ALL 197 audit shapes × 5 geometry modes, run
// through the REAL engine, gated on geometry invariants ONLY. No pixels, no
// Stroke3DScene, no canvas3d render files (those are under active edit; the
// VISUAL 3D render sweep is deferred until they settle).
//
//   node tools/3d/catalog-geometry-sweep.mjs            (dev server on :5182)
//   GAUNTLET_URL=http://host/.../catalog-geometry-sweep.html node tools/3d/catalog-geometry-sweep.mjs
//
// Per shape (all 197 — never sample-and-claim): the harness runs the engine and
// returns vertex/triangle counts, holes, joints, closure classification,
// mark-intent labels, and determinism. The driver gates each shape×mode and
// writes the FULL per-shape×mode table.
//
// GATES (geometry correctness — a FAIL is a real engine bug, not a taste call):
//   NONFINITE    — any built geometry has a NaN/Infinity vertex            (hard)
//   NONDET       — building the same input twice differs byte-wise         (hard)
//   MI-NONDET    — convertStrokePool run twice gives a different label set  (hard)
//   ENGINE-ERR   — the engine threw on this shape                          (hard)
//   EMPTY-NONVAC — a NON-empty shape (strokes sampled) produced a build    (hard)
//                  with ZERO vertices in a form mode
//   (informational, NOT failures — recorded + summarized, never gate):
//   FALLBACK     — forced mode degraded (honest degenerate path by design)
//   NO-SAMPLE    — shape sampled to 0 strokes (text-only / zero-length art)
//   ZERO-HOLE    — a multi-closed-loop shape cut 0 holes (eyeball, not bug)
//
// Outputs (all under /tmp/dd-catalog-geom/):
//   reports.json            raw per-shape ShapeReport array (the dataset)
//   catalog-geom-table.md   per-shape × mode table + flag summary + closure/
//                           intent distributions
//
// Repo tool only — NOT part of the Make drag-drop set.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let chromium;
for (const p of [
  '/tmp/dd-pp/node_modules/playwright',
  '/Users/sebs/Desktop/Projects/portfolio/tools/lab-screenshots/node_modules/playwright',
]) {
  try {
    ({ chromium } = require(p));
    break;
  } catch {
    /* try next */
  }
}
if (!chromium) {
  console.error('FATAL: playwright not found in known node_modules paths');
  process.exit(2);
}

const BASE_URL =
  process.env.GAUNTLET_URL ?? 'http://localhost:5182/tools/3d/catalog-geometry-sweep.html';
const OUT_DIR = '/tmp/dd-catalog-geom';
mkdirSync(OUT_DIR, { recursive: true });

const MODES = ['auto', 'rod', 'extrude', 'inflate', 'solid'];
// Modes whose whole point is to produce a form: a non-empty shape that builds
// ZERO vertices in one of these is a real EMPTY-NONVAC bug.
const FORM_MODES = new Set(['rod', 'extrude', 'inflate', 'solid', 'auto']);
const HARD = ['NONFINITE', 'NONDET', 'MI-NONDET', 'ENGINE-ERR', 'EMPTY-NONVAC'];
const HARD_SET = new Set(HARD);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 600, height: 400 } });
const consoleErrors = [];
page.on('console', (m) => {
  if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200));
});
page.on('pageerror', (e) => consoleErrors.push('PAGEERR ' + String(e).slice(0, 200)));

console.log('→', BASE_URL);
await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__gauntletReady === true, { timeout: 60000 });
const count = await page.evaluate(() => window.__gauntlet.count);
console.log(`harness ready — ${count} shapes × ${MODES.length} modes\n`);
if (count !== 197) {
  console.warn(`⚠ EXPECTED 197 shapes, got ${count} — reporting actual count.`);
}

const reports = [];
let hardFails = 0;
const flagCounts = {
  NONFINITE: 0,
  NONDET: 0,
  'MI-NONDET': 0,
  'ENGINE-ERR': 0,
  'EMPTY-NONVAC': 0,
  FALLBACK: 0,
  'NO-SAMPLE': 0,
  'ZERO-HOLE': 0,
};
const closureTotals = { closed: 0, treatedAsClosed: 0, open: 0 };
const intentTotals = {};

for (let i = 0; i < count; i++) {
  const r = await page.evaluate((idx) => window.__gauntlet.run(idx), i);
  const flags = [];
  if (r.errors.length) {
    flags.push('ENGINE-ERR');
    flagCounts['ENGINE-ERR']++;
  }
  if (r.empty) {
    flags.push('NO-SAMPLE');
    flagCounts['NO-SAMPLE']++;
  }
  let nonFinite = false;
  let nonDet = false;
  let emptyNonVac = false;
  let fallback = false;
  for (const m of r.modes) {
    if (m.nonFinite) nonFinite = true;
    if (!m.deterministic) nonDet = true;
    if (m.fallbacks > 0) fallback = true;
    if (!r.empty && FORM_MODES.has(m.mode) && m.vertices === 0) emptyNonVac = true;
  }
  if (nonFinite) {
    flags.push('NONFINITE');
    flagCounts.NONFINITE++;
  }
  if (nonDet) {
    flags.push('NONDET');
    flagCounts.NONDET++;
  }
  if (!r.markIntent.deterministic && !r.empty) {
    flags.push('MI-NONDET');
    flagCounts['MI-NONDET']++;
  }
  if (emptyNonVac) {
    flags.push('EMPTY-NONVAC');
    flagCounts['EMPTY-NONVAC']++;
  }
  if (fallback) {
    flags.push('FALLBACK');
    flagCounts.FALLBACK++;
  }
  if (!r.empty && r.markIntent.holesCutTotal === 0 && r.closure.closed >= 2) {
    flags.push('ZERO-HOLE');
    flagCounts['ZERO-HOLE']++;
  }

  const hard = flags.filter((f) => HARD_SET.has(f));
  if (hard.length) hardFails++;

  closureTotals.closed += r.closure.closed;
  closureTotals.treatedAsClosed += r.closure.treatedAsClosed;
  closureTotals.open += r.closure.open;
  for (const [t, n] of Object.entries(r.markIntent.treatments)) {
    intentTotals[t] = (intentTotals[t] ?? 0) + n;
  }

  reports.push({ ...r, flags, hard });
  const tag = hard.length ? `❌ ${hard.join(',')}` : flags.length ? `· ${flags.join(',')}` : '✓';
  if (hard.length || i % 25 === 0) {
    console.log(
      `[${String(i + 1).padStart(3)}/${count}] ${r.kind}/${r.shape}  strokes=${r.strokeCount}  ${tag}`,
    );
  }
}

writeFileSync(join(OUT_DIR, 'reports.json'), JSON.stringify(reports, null, 2));

const lines = [];
lines.push('# Catalog geometry sweep — ALL 197 audit shapes × 5 modes (headless, no pixels)');
lines.push('');
lines.push(
  'Engine: strokeTo3d + convert + markIntent. NO Stroke3DScene / hatchMaterial / Canvas3DChrome / Canvas3DContext mounted; NO WebGL renderer; NO pixels read. Sampling pipeline = the EXACT getTotalLength/getCTM path the visual sweep uses.',
);
lines.push('');
lines.push(`Shapes: ${count}  ·  Hard-failing shapes: ${hardFails}`);
lines.push('');
lines.push('## Flag summary');
lines.push('');
lines.push('| flag | kind | shapes |');
lines.push('|---|---|---|');
for (const [f, n] of Object.entries(flagCounts)) {
  lines.push(`| ${f} | ${HARD_SET.has(f) ? 'HARD (bug)' : 'info'} | ${n} |`);
}
lines.push('');
lines.push('## Closure classification (per-stroke totals across the catalog)');
lines.push('');
lines.push(
  `closed: ${closureTotals.closed} · treated-as-closed: ${closureTotals.treatedAsClosed} · open: ${closureTotals.open}`,
);
lines.push('');
lines.push('## Mark-intent treatment distribution (auto pipeline, unit totals)');
lines.push('');
for (const [t, n] of Object.entries(intentTotals).sort((a, b) => b[1] - a[1])) {
  lines.push(`- ${t}: ${n}`);
}
lines.push('');
lines.push('## Per-shape × mode (v=vertices, tri=triangles, h=holes)');
lines.push('');
lines.push(
  '| # | kind/shape | strokes | closure c/t/o | intent units | arrowChips | holes | joints 20/40/70 | auto v/tri | rod v/tri | extrude v/tri/h | inflate v/tri | solid v/tri/h | det | flags |',
);
lines.push('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
const modeCell = (r, mode, withHoles = false) => {
  const m = r.modes.find((x) => x.mode === mode);
  if (!m) return '—';
  const base = `${m.vertices}/${m.triangles}`;
  return withHoles ? `${base}/${m.holes}` : base;
};
for (const r of reports) {
  const det = r.modes.every((m) => m.deterministic) && r.markIntent.deterministic ? 'Y' : 'N';
  const intentUnits = Object.values(r.markIntent.treatments).reduce((a, b) => a + b, 0);
  lines.push(
    `| ${r.index} | ${r.kind}/${r.shape} | ${r.strokeCount} | ${r.closure.closed}/${r.closure.treatedAsClosed}/${r.closure.open} | ${intentUnits} | ${r.markIntent.arrowChips} | ${r.markIntent.holesCutTotal} | ${r.jointProbe.jointsLow}/${r.jointProbe.jointsDefault}/${r.jointProbe.jointsHigh} | ${modeCell(r, 'auto')} | ${modeCell(r, 'rod')} | ${modeCell(r, 'extrude', true)} | ${modeCell(r, 'inflate')} | ${modeCell(r, 'solid', true)} | ${det} | ${r.flags.join(' ') || '✓'} |`,
  );
}
lines.push('');
if (consoleErrors.length) {
  lines.push('## Console / page errors during the run');
  lines.push('');
  for (const e of [...new Set(consoleErrors)].slice(0, 40)) lines.push('- ' + e);
}
writeFileSync(join(OUT_DIR, 'catalog-geom-table.md'), lines.join('\n'));

await browser.close();

console.log('');
console.log('flag counts:', JSON.stringify(flagCounts));
console.log('closure totals:', JSON.stringify(closureTotals));
console.log(`\nHARD-failing shapes: ${hardFails} / ${count}`);
console.log(`table → ${join(OUT_DIR, 'catalog-geom-table.md')}`);
console.log(`json  → ${join(OUT_DIR, 'reports.json')}`);
process.exit(hardFails > 0 ? 1 : 0);
