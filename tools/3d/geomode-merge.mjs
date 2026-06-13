// Merge the 8 geomode index-shard outputs (/tmp/dd-geomode-s{0,25,...}) into one
// canonical report + flag table covering all 197 shapes × 10 geomode states.
// READ-ONLY repo tool. Renders are deterministic so shards never disagree.
import { readFileSync, existsSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const SHARD_STARTS = [];
for (let i = 0; i < 197; i += 25) SHARD_STARTS.push(i);

const byIdx = new Map();
let totalRenders = 0;
const consoleErrors = new Set();
for (const start of SHARD_STARTS) {
  const dir = `/tmp/dd-geomode-s${start}`;
  for (const f of ['reports.shard0.json', 'reports.shard0.partial.json']) {
    const src = join(dir, f);
    if (!existsSync(src)) continue;
    let arr;
    try { arr = JSON.parse(readFileSync(src, 'utf8')); } catch { continue; }
    for (const r of arr) {
      const prev = byIdx.get(r.idx);
      if (!prev || (r.states?.length ?? 0) >= (prev.states?.length ?? 0)) byIdx.set(r.idx, r);
    }
  }
  const sum = join(dir, 'summary.shard0.json');
  if (existsSync(sum)) {
    try { const s = JSON.parse(readFileSync(sum, 'utf8')); totalRenders += s.totalRenders ?? 0; for (const e of s.consoleErrors ?? []) consoleErrors.add(e); } catch {}
  }
}

const all = [...byIdx.values()].sort((a, b) => a.idx - b.idx);
const missing = [];
for (let i = 0; i < 197; i++) if (!byIdx.has(i)) missing.push(i);

const flagByState = {};
const flagByGroupFlag = {};
const flagRows = [];
let totalFlags = 0;
// Per-mode coverage tally — confirm all 5 modes rendered for all 197.
const modeCells = {};
for (const r of all) {
  for (const s of r.states ?? []) {
    const mode = s.id.replace('geomode-', '').replace(/-(q35|q315|front)$/, '');
    modeCells[mode] = (modeCells[mode] ?? 0) + 1;
    if (!s.flags?.length) continue;
    totalFlags += s.flags.length;
    for (const f of s.flags) {
      flagByState[`${s.id}|${f}`] = (flagByState[`${s.id}|${f}`] ?? 0) + 1;
      flagByGroupFlag[`${mode}|${f}`] = (flagByGroupFlag[`${mode}|${f}`] ?? 0) + 1;
    }
    flagRows.push({ idx: r.idx, kind: r.kind, shape: r.shape, id: s.id, flags: s.flags, stats: s.stats, cleanDark: r.clean?.blackish });
  }
}

console.log(`merged coverage: ${all.length}/197 shapes`);
if (missing.length) console.log(`MISSING (${missing.length}): ${missing.join(',')}`);
console.log(`total renders (from summaries): ${totalRenders}`);
console.log(`per-mode cells: ${JSON.stringify(modeCells)}`);
console.log(`total flags: ${totalFlags}`);
console.log('\n=== flags by MODE|FLAG ===');
for (const [k, n] of Object.entries(flagByGroupFlag).sort((a, b) => b[1] - a[1])) console.log(`  ${k}: ${n}`);
console.log('\n=== flags by STATE (id|flag) ===');
for (const [k, n] of Object.entries(flagByState).sort((a, b) => b[1] - a[1])) console.log(`  ${k}: ${n}`);
if (consoleErrors.size) { console.log('\n=== CONSOLE ERRORS ==='); for (const e of [...consoleErrors].slice(0, 20)) console.log('  ' + e); }

// Also surface the EMPTY-mode read per shape — the real "did this mode produce
// geometry?" question. objFrac near-zero in any mode = candidate empty.
const lowObj = [];
for (const r of all) for (const s of r.states ?? []) {
  if (s.stats.objFrac < 0.01) lowObj.push({ idx: r.idx, shape: r.shape, id: s.id, objFrac: s.stats.objFrac });
}
console.log(`\n=== low-objFrac cells (<0.01, possible empty geometry): ${lowObj.length} ===`);
for (const c of lowObj.slice(0, 40)) console.log(`  ${c.idx} ${c.shape} ${c.id} objFrac=${c.objFrac}`);

writeFileSync('/tmp/dd-geomode/MERGED-summary.json', JSON.stringify({
  coverage: all.length, missing, totalRenders, modeCells, totalFlags,
  flagByGroupFlag, flagByState, flagRows, lowObj,
  consoleErrors: [...consoleErrors].slice(0, 30),
}, null, 2));
console.log('\nmerged → /tmp/dd-geomode/MERGED-summary.json');
