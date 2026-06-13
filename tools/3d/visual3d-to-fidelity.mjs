// visual3d-to-fidelity.mjs — READ-ONLY adapter (tools-only, never edits src).
//
// Converts catalog-visual-3d reports (reports.shard*.json — one record per shape
// with a `states[]` array of {group, id, stats, flags}) into the fidelity-3d
// record shape the dataset feeder's fidelity3dRecordToExample() expects:
//   { name: "<shape>:<stateId>", ok: bool, reasons: [<flag>...],
//     mode: <group>, vertexCount: null, bbox: <stats.bboxFill> }
// One record per (shape × state) cell. ok = no auto-flags fired; broke = flagged.
// The flag IS the breakage reason (EMPTY/BLACK-BLOB/TAN/OVERFLOW/FLAT-NOSTRUCT).
//
// This is THE fidelity-3d ingest path for the 3D audit: every audited 3D cell
// becomes one labeled example (ok/broke) in datasets/smart-layer.dataset.jsonl
// via:  node tools/dataset/feed-dataset.mjs --from-fidelity-3d <out.json>
//
// Usage:
//   node tools/3d/visual3d-to-fidelity.mjs <report.json> [report2.json ...] [--out <path>]
// Merges multiple shard/helper reports (last write per shape×state wins; renders
// are deterministic so they agree). Default out: /tmp/dd-vis3d/fidelity-3d.json
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const argv = process.argv.slice(2);
let outPath = '/tmp/dd-vis3d/fidelity-3d.json';
const sources = [];
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--out') outPath = argv[++i];
  else sources.push(argv[i]);
}
if (sources.length === 0) {
  console.error('usage: node tools/3d/visual3d-to-fidelity.mjs <report.json> [more...] [--out path]');
  process.exit(2);
}

// shape×state → record (dedupe; prefer a flagged/decided cell over an absent one;
// later sources overwrite earlier for the same key).
const byKey = new Map();
let shapesSeen = new Set();
let cellsTotal = 0;

for (const src of sources) {
  if (!existsSync(src)) { console.warn(`  skip (missing): ${src}`); continue; }
  let arr;
  try { arr = JSON.parse(readFileSync(src, 'utf8')); } catch (e) { console.warn(`  skip (parse): ${src} — ${e.message}`); continue; }
  if (!Array.isArray(arr)) { console.warn(`  skip (not array): ${src}`); continue; }
  for (const rep of arr) {
    if (!rep || !Array.isArray(rep.states)) continue;
    shapesSeen.add(rep.shape ?? rep.idx);
    for (const st of rep.states) {
      const key = `${rep.shape ?? rep.idx}:${st.id}`;
      const flags = Array.isArray(st.flags) ? st.flags : [];
      const ok = flags.length === 0;
      byKey.set(key, {
        name: key,
        ok,
        reasons: flags,
        mode: st.group ?? null,
        // carry a couple of measured features for the dataset's features block
        vertexCount: null,
        bbox: st.stats?.bboxFill ?? null,
        // extra context (ignored by adapter's known fields, but kept for audit)
        cleanDark: rep.clean?.blackish ?? rep.cleanDark ?? null,
        objFrac: st.stats?.objFrac ?? null,
        delta: st.stats?.delta ?? null,
        spread: st.stats?.spread ?? null,
      });
      cellsTotal++;
    }
  }
}

const records = [...byKey.values()];
const broke = records.filter((r) => !r.ok);
const ok = records.length - broke.length;

// reason tally
const reasonTally = {};
const modeTally = {};
for (const r of broke) {
  for (const reason of r.reasons) reasonTally[reason] = (reasonTally[reason] ?? 0) + 1;
  modeTally[r.mode] = (modeTally[r.mode] ?? 0) + 1;
}

writeFileSync(outPath, JSON.stringify(records, null, 2));
console.log(`shapes covered: ${shapesSeen.size}`);
console.log(`cells (deduped shape×state): ${records.length}  (raw scanned ${cellsTotal})`);
console.log(`  ok:    ${ok}`);
console.log(`  broke: ${broke.length}`);
console.log(`  reasons: ${JSON.stringify(reasonTally)}`);
console.log(`  broke by mode: ${JSON.stringify(modeTally)}`);
console.log(`→ ${outPath}`);
