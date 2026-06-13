// ROLL-UP: read all native + native-curved shard reports, produce the material
// audit verdict — per-material stats, TAN census, blob census, distinctness
// matrix, per-symptom flag counts. READ-ONLY.
//   node tools/3d/native-audit-rollup.mjs --in <dir...>
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const dirs = process.argv.slice(2).filter((a) => a !== '--in');
const byKey = new Map(); // key = group+idx so native and native-curved coexist
for (const dir of dirs) {
  if (!existsSync(dir)) { console.warn('skip', dir); continue; }
  for (const f of readdirSync(dir).filter((x) => /^reports\.shard\d+(\.partial)?\.json$/.test(x))) {
    let arr; try { arr = JSON.parse(readFileSync(join(dir, f), 'utf8')); } catch { continue; }
    for (const r of arr) {
      const k = r.idx;
      const prev = byKey.get(k);
      if (!prev || (r.states?.length ?? 0) >= (prev.states?.length ?? 0)) byKey.set(k, r);
    }
  }
}
const reports = [...byKey.values()].sort((a, b) => a.idx - b.idx);
console.log(`coverage: ${reports.length} shapes`);
const missing = [];
for (let i = 0; i < 197; i++) if (!byKey.has(i)) missing.push(i);
if (missing.length) console.log(`MISSING (${missing.length}): ${missing.slice(0, 40).join(',')}${missing.length > 40 ? '…' : ''}`);

// Per material × geometry-family stats.
const cells = [];
for (const r of reports) for (const s of r.states ?? []) {
  // parse material from id: native-<mat>-<angle> OR nc-<geo>-<mat>-<angle>
  let mat = null, geo = null;
  let m = s.id.match(/^native-([a-zA-Z]+)-/);
  if (m) { mat = m[1]; geo = 'slab(extrude)'; }
  m = s.id.match(/^nc-(rod|inflate)-([a-zA-Z]+)-/);
  if (m) { geo = m[1]; mat = m[2]; }
  if (!mat) continue;
  cells.push({ shape: r.shape, kind: r.kind, mat, geo, id: s.id, stats: s.stats, flags: s.flags ?? [], cleanDark: r.clean?.blackish ?? 0 });
}
console.log(`material cells: ${cells.length}`);

const agg = {};
for (const c of cells) {
  const key = `${c.mat} · ${c.geo}`;
  agg[key] = agg[key] ?? { n: 0, deltaSum: 0, maxDelta: -99, maxDeltaCell: '', lumSum: 0, maxBlack: 0, tan: 0, blob: 0, empty: 0, overflow: 0 };
  const a = agg[key]; const st = c.stats;
  a.n++; a.deltaSum += st.delta; a.lumSum += st.lum; a.maxBlack = Math.max(a.maxBlack, st.blackFrac);
  if (st.delta > a.maxDelta) { a.maxDelta = st.delta; a.maxDeltaCell = c.shape + '/' + c.id; }
  for (const f of c.flags) { if (f === 'TAN') a.tan++; if (f === 'BLACK-BLOB') a.blob++; if (f === 'EMPTY') a.empty++; if (f === 'OVERFLOW') a.overflow++; }
}
console.log('\n=== PER MATERIAL × GEOMETRY ===');
console.log('  key'.padEnd(28) + 'n    avgΔ  maxΔ  avgLum  maxBlk  TAN  BLOB  EMPTY  OVF');
for (const [k, a] of Object.entries(agg).sort()) {
  console.log('  ' + k.padEnd(26) + String(a.n).padEnd(5) + (a.deltaSum / a.n).toFixed(1).padEnd(6) + String(a.maxDelta).padEnd(6) + (a.lumSum / a.n).toFixed(0).padEnd(8) + a.maxBlack.toFixed(2).padEnd(8) + String(a.tan).padEnd(5) + String(a.blob).padEnd(6) + String(a.empty).padEnd(7) + a.overflow);
}

// DISTINCTNESS: per geometry family, avg lum per material — are the 6 separated?
console.log('\n=== DISTINCTNESS (avg lit-face lum per material, per geometry) ===');
const geos = [...new Set(cells.map((c) => c.geo))];
const mats = ['ink', 'matteClay', 'glossyPlastic', 'signal', 'softGel', 'rubber'];
for (const g of geos) {
  const row = mats.map((mt) => {
    const cs = cells.filter((c) => c.geo === g && c.mat === mt);
    const avg = cs.length ? cs.reduce((s, c) => s + c.stats.lum, 0) / cs.length : NaN;
    return `${mt}=${isNaN(avg) ? '--' : avg.toFixed(0)}`;
  });
  // spread between brightest and darkest material = distinctness proxy
  const lums = mats.map((mt) => { const cs = cells.filter((c) => c.geo === g && c.mat === mt); return cs.length ? cs.reduce((s, c) => s + c.stats.lum, 0) / cs.length : null; }).filter((x) => x != null);
  const spread = lums.length ? Math.max(...lums) - Math.min(...lums) : 0;
  console.log(`  ${g.padEnd(14)} ${row.join('  ')}   [lum spread ${spread.toFixed(0)}]`);
}

// CENSUS
const tanAll = cells.filter((c) => c.flags.includes('TAN'));
const blobAll = cells.filter((c) => c.flags.includes('BLACK-BLOB'));
const emptyAll = cells.filter((c) => c.flags.includes('EMPTY'));
console.log('\n=== CENSUS ===');
console.log(`  TAN total: ${tanAll.length}`, tanAll.slice(0, 20).map((c) => c.shape + '/' + c.id + ' Δ' + c.stats.delta));
console.log(`  BLACK-BLOB total: ${blobAll.length}`, blobAll.slice(0, 20).map((c) => c.shape + '/' + c.id + ' blk' + c.stats.blackFrac));
console.log(`  EMPTY total: ${emptyAll.length}`, emptyAll.slice(0, 20).map((c) => c.shape + '/' + c.id));
console.log(`\n  GLOBAL max Δ across all material cells: ${Math.max(...cells.map((c) => c.stats.delta))}`);
