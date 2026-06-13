// Merge the main run [0,197) with helper tail runs into one canonical report +
// flag summary. The main covers all 197; helpers cover [110,154) and [154,197)
// and finish the tail sooner. Whichever has data for an index is used (renders
// are deterministic, so they agree). Prints the full flag table.
import { readFileSync, existsSync, writeFileSync } from 'node:fs';

const SOURCES = [
  '/tmp/dd-vis3d/reports.shard0.json',
  '/tmp/dd-vis3d/reports.shard0.partial.json',
  '/tmp/dd-vis3d-h1/reports.shard0.json',
  '/tmp/dd-vis3d-h1/reports.shard0.partial.json',
  '/tmp/dd-vis3d-h2/reports.shard0.json',
  '/tmp/dd-vis3d-h2/reports.shard0.partial.json',
  '/tmp/dd-vis3d-hA/reports.shard0.json',
  '/tmp/dd-vis3d-hA/reports.shard0.partial.json',
  '/tmp/dd-vis3d-hB/reports.shard0.json',
  '/tmp/dd-vis3d-hB/reports.shard0.partial.json',
  '/tmp/dd-vis3d-mine/reports.shard0.json',
  '/tmp/dd-vis3d-mine/reports.shard0.partial.json',
];

const byIdx = new Map();
for (const src of SOURCES) {
  if (!existsSync(src)) continue;
  let arr;
  try { arr = JSON.parse(readFileSync(src, 'utf8')); } catch { continue; }
  for (const r of arr) {
    // prefer a record that actually has states
    const prev = byIdx.get(r.idx);
    if (!prev || (r.states?.length ?? 0) >= (prev.states?.length ?? 0)) byIdx.set(r.idx, r);
  }
}

const all = [...byIdx.values()].sort((a, b) => a.idx - b.idx);
console.log(`merged coverage: ${all.length}/197 shapes`);
const missing = [];
for (let i = 0; i < 197; i++) if (!byIdx.has(i)) missing.push(i);
if (missing.length) console.log(`MISSING indices (${missing.length}): ${missing.join(',')}`);

// Flag tally by (group, toggle-family stripped of level), and full per-flag list.
const flagByState = {};
const flagByGroup = {};
const flagRows = [];
let totalFlags = 0;
for (const r of all) {
  for (const s of r.states ?? []) {
    if (!s.flags?.length) continue;
    totalFlags += s.flags.length;
    const fam = s.id.replace(/-(low|mid|high|front|q35|q315|on|off)$/,'').replace(/-(round|flat|ink-blob|blob|clean|sharp|soft|rounded|straight|drafted|balloon|cushion|bead|crisp|eased|fixed|light|hachure|cross-hatch|stipple|contour)$/,'');
    for (const f of s.flags) {
      flagByState[`${s.id}|${f}`] = (flagByState[`${s.id}|${f}`] ?? 0) + 1;
      flagByGroup[`${s.group}|${f}`] = (flagByGroup[`${s.group}|${f}`] ?? 0) + 1;
    }
    flagRows.push({ idx: r.idx, shape: r.shape, id: s.id, flags: s.flags, stats: s.stats, cleanDark: r.clean?.blackish });
  }
}

console.log(`\ntotal flags: ${totalFlags} across ${all.length} shapes`);
console.log('\n=== flags by GROUP ===');
for (const [k, n] of Object.entries(flagByGroup).sort((a, b) => b[1] - a[1])) console.log(`  ${k}: ${n}`);
console.log('\n=== flags by STATE (id|flag) ===');
for (const [k, n] of Object.entries(flagByState).sort((a, b) => b[1] - a[1])) console.log(`  ${k}: ${n}`);

// Ink-black (tan) audit across ALL merged Native cells.
let maxDelta = 0, maxCell = null, tanCount = 0;
const matMax = {};
for (const r of all) for (const s of r.states ?? []) {
  if (!s.id.startsWith('native-')) continue;
  const mat = s.id.split('-')[1];
  matMax[mat] = Math.max(matMax[mat] ?? 0, s.stats.delta);
  if (s.stats.delta > maxDelta) { maxDelta = s.stats.delta; maxCell = `${r.shape}/${s.id}`; }
  if (s.stats.delta >= 25 && s.stats.objFrac > 0.02) tanCount++;
}
console.log('\n=== INK-BLACK (tan) audit — Native lit-face Δr−b, all merged cells ===');
for (const [m, d] of Object.entries(matMax)) console.log(`  ${m}: max Δ=${d}`);
console.log(`  GLOBAL max Δ=${maxDelta} at ${maxCell}  ·  cells over tan threshold(25): ${tanCount}`);

writeFileSync('/tmp/dd-vis3d/MERGED-summary.json', JSON.stringify({ coverage: all.length, missing, totalFlags, flagByGroup, flagByState, matMax, maxDelta, maxCell, tanCount, flagRows }, null, 2));
console.log('\nmerged summary → /tmp/dd-vis3d/MERGED-summary.json');
