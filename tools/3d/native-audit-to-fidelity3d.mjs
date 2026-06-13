// BRIDGE: catalog-visual-3d sweep reports → fidelity-3d record array that
// tools/dataset/feed-dataset.mjs --from-fidelity-3d can ingest.
//
// The catalog-visual-3d driver emits nested per-shape reports
//   { idx, shape, kind, clean:{blackish,...}, states:[{group,id,stats,flags}] }
// The dataset's fidelity3dRecordToExample() expects a FLAT record:
//   { name, ok|pass, reasons[], mode, vertexCount?, bbox? }
// One sweep cell (shape × 3D state) = one fidelity example. ok = no flags.
//
//   node tools/3d/native-audit-to-fidelity3d.mjs \
//     --in /tmp/dd-nat-s0 /tmp/dd-nat-s1 ... \
//     --out /tmp/dd-native-audit/fidelity3d-records.json
//
// READ-ONLY: reads sweep JSON, writes one records file. No src edits, no DB.
import { readFileSync, existsSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const argv = process.argv.slice(2);
const inDirs = [];
let outPath = '/tmp/dd-native-audit/fidelity3d-records.json';
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--out') outPath = argv[++i];
  else if (argv[i] === '--in') { while (argv[i + 1] && !argv[i + 1].startsWith('--')) inDirs.push(argv[++i]); }
  else inDirs.push(argv[i]);
}
if (inDirs.length === 0) { console.error('usage: --in <dir...> [--out file]'); process.exit(2); }

// Gather every reports*.json in the given dirs, dedupe by shape idx (prefer the
// record with MORE states — full over partial). Renders are deterministic so
// overlapping shards agree.
const byIdx = new Map();
for (const dir of inDirs) {
  if (!existsSync(dir)) { console.warn(`skip missing ${dir}`); continue; }
  const files = readdirSync(dir).filter((f) => /^reports\.shard\d+(\.partial)?\.json$/.test(f));
  for (const f of files) {
    let arr;
    try { arr = JSON.parse(readFileSync(join(dir, f), 'utf8')); } catch { continue; }
    for (const r of arr) {
      // MERGE states across reports with the same idx (native flat-slab AND
      // native-curved share idx but carry DISTINCT state ids — native-* vs nc-*).
      // Union by state id so neither group's cells are dropped. Renders are
      // deterministic so duplicate state ids agree; last wins (full over partial).
      const prev = byIdx.get(r.idx);
      if (!prev) {
        byIdx.set(r.idx, { ...r, _byState: new Map((r.states ?? []).map((s) => [s.id, s])) });
      } else {
        for (const s of r.states ?? []) prev._byState.set(s.id, s);
      }
    }
  }
}
const reports = [...byIdx.values()].map((r) => ({ ...r, states: [...r._byState.values()] })).sort((a, b) => a.idx - b.idx);
const totalStates = reports.reduce((n, r) => n + r.states.length, 0);
console.log(`gathered ${reports.length} shape reports (${totalStates} state cells) from ${inDirs.length} dir(s)`);

// Flatten: one fidelity record per (shape, state).
const records = [];
for (const r of reports) {
  for (const s of r.states ?? []) {
    const flags = s.flags ?? [];
    records.push({
      // name = the fidelity exampleId tail + the regionPath. Stable + unique:
      // shape disambiguates the 197 catalog forms; the state id carries the
      // material/geometry/angle. kind (trophy/pegboard) prefixes for clarity.
      name: `${r.kind}:${r.shape}:${s.id}`,
      ok: flags.length === 0,
      reasons: flags, // EMPTY/BLACK-BLOB/TAN/OVERFLOW/FLAT-NOSTRUCT
      mode: s.group, // native / native-curved / geomode / rod / ...
      // carry the pixel evidence as features (adapter keeps mode + bbox; the
      // extra stats survive as provenance on the record, harmless to the adapter)
      stats: s.stats,
      cleanDark: r.clean?.blackish ?? null,
      shape: r.shape,
      stateId: s.id,
    });
  }
}

const broke = records.filter((r) => !r.ok);
const out = { passed: records.length - broke.length, total: records.length, results: records };
writeFileSync(outPath, JSON.stringify(out, null, 2));
console.log(`wrote ${records.length} fidelity-3d records (${broke.length} broke / ${records.length - broke.length} ok) → ${outPath}`);

// summary by mode + reason
const byMode = {};
const byReason = {};
for (const r of records) {
  byMode[r.mode] = byMode[r.mode] ?? { ok: 0, broke: 0 };
  if (r.ok) byMode[r.mode].ok++; else byMode[r.mode].broke++;
  for (const f of r.reasons) byReason[f] = (byReason[f] ?? 0) + 1;
}
console.log('by mode:', JSON.stringify(byMode));
console.log('by reason:', JSON.stringify(byReason));
