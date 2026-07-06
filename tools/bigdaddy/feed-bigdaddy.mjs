// feed-bigdaddy.mjs — ingest a LABELED big-daddy OFAT manifest into the CLEAN
// dataset (datasets/smart-layer.clean.jsonl), regime "bigdaddy-current".
//
// Sibling to tools/dataset/feed-live-ofat.mjs — same row schema so the two clean
// sources merge. HONEST live data only: a manifest row is ingested ONLY once its
// `status` has been filled by the vision-read pass (paired-with-Clean). Rows with
// blank status are skipped (not yet labeled). pixelChangedVsClean is carried as a
// cheap mechanical hint, never as the label.
//
// USAGE
//   # after the vision-read pass fills `status` on each row:
//   node tools/bigdaddy/feed-bigdaddy.mjs /tmp/bigdaddy/manifest-0of8.jsonl [--append]
//   node tools/bigdaddy/feed-bigdaddy.mjs '/tmp/bigdaddy/manifest-*.jsonl' --append   # merge shards
//
// By default REWRITES the bigdaddy-current rows in smart-layer.clean.jsonl
// (drops any prior bigdaddy-current rows, keeps other regimes) and adds the
// freshly-labeled ones. --append keeps everything and just adds (use for shards).

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, basename, join } from 'node:path';

const RUN = 'bigdaddy-2026-06-14';
const REGIME = 'bigdaddy-current';
const OUT = new URL('../../datasets/smart-layer.clean.jsonl', import.meta.url).pathname;

const args = process.argv.slice(2);
const APPEND = args.includes('--append');
const srcArg = args.find((a) => !a.startsWith('--')) || '/tmp/bigdaddy/manifest-all.jsonl';

// resolve a glob-ish source (supports manifest-*.jsonl) to a file list
function resolveSources(pat) {
  if (!pat.includes('*')) return [pat];
  const dir = dirname(pat); const base = basename(pat);
  const re = new RegExp('^' + base.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$');
  return readdirSync(dir).filter((f) => re.test(f)).map((f) => join(dir, f));
}

const labelOf = (s) => {
  const v = String(s || '').trim().toLowerCase();
  if (v === 'works' || v === 'ok' || v === 'pass') return 'ok';
  if (v === 'broken' || v === 'break' || v === 'fail') return 'break';
  if (v === 'partial' || v === 'weak') return 'partial';
  if (v === 'blocked') return 'blocked';
  return null; // unrecognized / blank → not labeled yet
};

const rows = [];
let idx = 0, total = 0, skippedBlank = 0;
for (const src of resolveSources(srcArg)) {
  if (!existsSync(src)) { console.log(`skip missing source: ${src}`); continue; }
  const lines = readFileSync(src, 'utf8').split('\n').filter(Boolean);
  for (const line of lines) {
    let m; try { m = JSON.parse(line); } catch { continue; }
    total++;
    const label = labelOf(m.status);
    if (!label) { skippedBlank++; continue; } // unlabeled → wait for vision pass
    rows.push({
      exampleId: `${RUN}:${m.source}:${m.object}:${m.factor}:${m.level ?? m.value}`,
      source: RUN, labelKind: 'fidelity', label,
      confidence: null, rawScore: null, margin: null, firedRules: [],
      classifiedBy: 'bigdaddy-ofat-vision', isGroundTruth: !!m.screenshot,
      svgHash: null, regionPath: m.object ?? null, renderSurface: `live-${m.source}`,
      features: {
        stage: m.source, object: m.object, factor: m.factor, value: m.level ?? m.value,
        setValue: m.setValue ?? null, applied: m.applied ?? null, status: m.status,
        pixelChangedVsClean: m.pixelChangedVsClean ?? null, note: m.note ?? '',
        screenshot: m.screenshot ?? '', contactSheet: m.contactSheet ?? '',
      },
      regime: { label: REGIME }, ingestIndex: idx++,
    });
  }
}

// merge into the clean dataset
let kept = [];
if (existsSync(OUT) && !APPEND) {
  kept = readFileSync(OUT, 'utf8').split('\n').filter(Boolean)
    .map((l) => { try { return JSON.parse(l); } catch { return null; } })
    .filter((r) => r && !(r.regime && r.regime.label === REGIME)); // drop prior bigdaddy-current
} else if (existsSync(OUT) && APPEND) {
  kept = readFileSync(OUT, 'utf8').split('\n').filter(Boolean)
    .map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
}
const merged = [...kept, ...rows];
writeFileSync(OUT, merged.map((r) => JSON.stringify(r)).join('\n') + (merged.length ? '\n' : ''));

const byLabel = rows.reduce((a, r) => ((a[r.label] = (a[r.label] || 0) + 1), a), {});
console.log(`big-daddy ingest → ${OUT}`);
console.log(`  manifest rows read: ${total} · labeled+ingested: ${rows.length} · skipped (blank status): ${skippedBlank}`);
console.log(`  by label: ${JSON.stringify(byLabel)}`);
console.log(`  total clean dataset rows now: ${merged.length} (kept other regimes: ${kept.length})`);
if (!rows.length) console.log('  NOTE: 0 labeled rows — run the vision-read pass to fill `status` first.');
