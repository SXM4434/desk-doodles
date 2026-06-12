// Mark-intent 10-fixture battery — drives tools/3d/mark-intent-battery.html
// headless and gates on tools/3d/markintent-golden.json (the golden labels).
//
//   node tools/3d/mark-intent-battery.mjs        (dev server must be on :5182)
//
// Per fixture:
//   1. window.__battery.run(i) — REAL convertStrokePool (mode 'auto') +
//      three.js render of the resulting units
//   2. screenshot → /tmp/dd-mark-intent/NN-<name>.png  (READ these one by one)
//   3. unit summaries vs the golden matchers (treatment/intent/geometry/
//      closure/chip flags/bands/holes — exact counts)
//   4. receipts captured from window.__dd_conversionLog (the QW-1 collector —
//      counted, dumped to results.json; the training dataset starts here)
//
// Exit code 1 on ANY golden mismatch or console error. Repo tool only.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require(
  '/Users/sebs/Desktop/Projects/portfolio/tools/lab-screenshots/node_modules/playwright',
);

const HERE = dirname(fileURLToPath(import.meta.url));
const BASE_URL =
  process.env.BATTERY_URL ?? 'http://localhost:5182/tools/3d/mark-intent-battery.html';
const OUT_DIR = '/tmp/dd-mark-intent';

const golden = JSON.parse(readFileSync(join(HERE, 'markintent-golden.json'), 'utf8'));

// ─── Golden matcher evaluation ───────────────────────────────────────────────

function unitMatches(unit, m) {
  for (const k of ['treatment', 'intent', 'geometry', 'closure', 'treatedAsClosed', 'ambiguous']) {
    if (m[k] !== undefined && unit[k] !== m[k]) return false;
  }
  if (m.bandEquals !== undefined && unit.band !== m.bandEquals) return false;
  if (m.bandMin !== undefined && (unit.band === null || unit.band < m.bandMin)) return false;
  if (m.holesCutMin !== undefined && unit.holesCut < m.holesCutMin) return false;
  return true;
}

function evaluate(name, units) {
  const spec = golden.fixtures[name];
  if (!spec) return { pass: false, failures: [`no golden entry for '${name}'`] };
  const failures = [];
  if (spec.totalUnits !== undefined && units.length !== spec.totalUnits) {
    failures.push(`totalUnits ${units.length} ≠ ${spec.totalUnits}`);
  }
  if (spec.maxRodUnits !== undefined) {
    const rods = units.filter((u) => u.geometry === 'rod').length;
    if (rods > spec.maxRodUnits) failures.push(`rod units ${rods} > max ${spec.maxRodUnits}`);
  }
  for (const m of spec.matchers ?? []) {
    const hits = units.filter((u) => unitMatches(u, m)).length;
    if (hits !== m.count) {
      failures.push(`matcher ${JSON.stringify(m)} matched ${hits}, want ${m.count}`);
    }
  }
  return { pass: failures.length === 0, failures };
}

// ─── Main ────────────────────────────────────────────────────────────────────

mkdirSync(OUT_DIR, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 520, height: 520 } });
const consoleErrors = [];
page.on('console', (m) => {
  if (m.type() === 'error') consoleErrors.push(m.text());
});
page.on('pageerror', (e) => consoleErrors.push(String(e)));

await page.goto(BASE_URL, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__batteryReady === true, null, { timeout: 30000 });

const names = await page.evaluate(() => window.__battery.names);
console.log(`battery: ${names.length} fixtures`);

const capture = page.locator('#capture');
const records = [];
let failures = 0;

for (let i = 0; i < names.length; i++) {
  const errBase = consoleErrors.length;
  const out = await page.evaluate((idx) => window.__battery.run(idx), i);
  const shotName = `${String(i).padStart(2, '0')}-${out.name}.png`;
  await capture.screenshot({ path: join(OUT_DIR, shotName) });
  const verdict = evaluate(out.name, out.units);
  const errs = consoleErrors.slice(errBase);
  const receiptOk = Array.isArray(out.receipts) && out.receipts.length >= out.units.length;
  const pass = verdict.pass && errs.length === 0 && receiptOk;
  if (!pass) failures++;
  records.push({
    index: i,
    name: out.name,
    title: out.title,
    supplementary: out.supplementary,
    units: out.units,
    receipts: out.receipts,
    receiptCount: out.receipts.length,
    golden: verdict,
    consoleErrors: errs,
    shot: shotName,
    pass,
  });
  const unitsStr = out.units
    .map((u) => `${u.treatment}/${u.geometry}${u.treatedAsClosed ? '·CHIP' : ''}${u.band !== null ? `·b${u.band}` : ''}`)
    .join(' + ');
  console.log(
    `[${i}] ${out.name}: ${pass ? 'PASS' : 'FAIL'} — ${out.units.length} units (${unitsStr}) · ${out.receipts.length} receipts` +
      (verdict.failures.length ? `\n      ${verdict.failures.join('\n      ')}` : '') +
      (errs.length ? `\n      console: ${errs.join(' | ').slice(0, 200)}` : '') +
      (!receiptOk ? `\n      receipts ${out.receipts.length} < units ${out.units.length}` : ''),
  );
}

// ─── Table + JSON ────────────────────────────────────────────────────────────

const lines = [
  '# Mark-intent battery — per-fixture table',
  '',
  `Run: ${new Date().toISOString()} · ${records.length} fixtures (10 golden + supplementary)`,
  '',
  '| # | fixture | units (treatment/geometry) | chips | bands | receipts | golden |',
  '|---|---|---|---|---|---|---|',
];
for (const r of records) {
  const unitsStr = r.units.map((u) => `${u.treatment}/${u.geometry}`).join('<br>');
  const chips = r.units
    .map((u) => [u.treatedAsClosed ? 'treated-as-closed' : null, u.ambiguous ? 'marks-3way' : null].filter(Boolean).join('+'))
    .filter(Boolean)
    .join('<br>') || '—';
  const bands = r.units.map((u) => u.band).filter((b) => b !== null).join(', ') || '—';
  lines.push(
    `| ${r.index} | ${r.name}${r.supplementary ? ' (extra)' : ''} | ${unitsStr} | ${chips} | ${bands} | ${r.receiptCount} | ${r.pass ? 'PASS' : `FAIL: ${r.golden.failures.join('; ')}`} |`,
  );
}
lines.push('', `## Summary: ${records.length - failures}/${records.length} pass`);
writeFileSync(join(OUT_DIR, 'battery-table.md'), lines.join('\n'));
writeFileSync(join(OUT_DIR, 'results.json'), JSON.stringify(records, null, 2));

console.log(`\n${records.length - failures}/${records.length} fixtures pass`);
console.log(`shots: ${OUT_DIR}/  table: ${OUT_DIR}/battery-table.md`);
await browser.close();
process.exit(failures === 0 ? 0 : 1);
