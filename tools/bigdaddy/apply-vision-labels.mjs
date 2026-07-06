// apply-vision-labels.mjs — write the OFAT-3D vision-read verdicts into the
// big-daddy manifest rows' `status`, so feed-bigdaddy can ingest them.
//
// USAGE: node tools/bigdaddy/apply-vision-labels.mjs <vision-results.json> [manifestGlobDir]
//   vision-results.json = [{object, sheetLegible, factors:[{factor, verdict, effectLevels, note}]}, ...]
//   manifest dir defaults to /tmp/bigdaddy (patches manifest-*.jsonl in place)
//
// Maps each factor verdict onto ALL of that factor's L/M/H rows for that object.
// Baseline rows are left blank (not a factor test → feed-bigdaddy skips them).
// Carries the vision note + effectLevels onto each row for traceability.

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const resultsPath = process.argv[2];
const dir = process.argv[3] || '/tmp/bigdaddy';
if (!resultsPath || !existsSync(resultsPath)) { console.error('missing vision-results.json'); process.exit(1); }

const results = JSON.parse(readFileSync(resultsPath, 'utf8'));
// index: object -> factor -> {verdict, effectLevels, note}
const idx = new Map();
let illegible = 0;
for (const r of results) {
  if (!r || !r.object) continue;
  if (r.sheetLegible === false) illegible++;
  const fm = new Map();
  for (const f of (r.factors || [])) fm.set(f.factor, f);
  idx.set(r.object, fm);
}

const manifests = readdirSync(dir).filter((f) => /^manifest-.*\.jsonl$/.test(f)).map((f) => join(dir, f));
let patched = 0, rows = 0, noVerdict = 0;
for (const mf of manifests) {
  const lines = readFileSync(mf, 'utf8').split('\n').filter(Boolean);
  const out = [];
  for (const line of lines) {
    let m; try { m = JSON.parse(line); } catch { out.push(line); continue; }
    rows++;
    if (m.factor && m.factor !== 'baseline' && m.factor !== '(crash)' && m.factor !== 'draw-tools') {
      const fv = idx.get(m.object)?.get(m.factor);
      if (fv) {
        m.status = fv.verdict;            // works|partial|broken → feed-bigdaddy labelOf
        m.visionNote = fv.note || '';
        m.effectLevels = fv.effectLevels || '';
        patched++;
      } else { noVerdict++; }
    }
    out.push(JSON.stringify(m));
  }
  writeFileSync(mf, out.join('\n') + '\n');
}

const byVerdict = {};
for (const fm of idx.values()) for (const f of fm.values()) byVerdict[f.verdict] = (byVerdict[f.verdict] || 0) + 1;
console.log(`vision labels applied → ${manifests.length} manifest file(s)`);
console.log(`  objects labeled: ${idx.size} · illegible sheets: ${illegible}`);
console.log(`  manifest rows: ${rows} · factor-rows patched: ${patched} · factor-rows with NO verdict: ${noVerdict}`);
console.log(`  factor verdicts: ${JSON.stringify(byVerdict)}`);
