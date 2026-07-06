// Feed the HONEST live-OFAT broken-map into a CLEAN dataset file (separate from
// the quarantined garbage). Honest labels (works/broken/partial vs Clean),
// screenshot-backed where available. Current-state (pre-fix) audit data — NOT
// trainable "correct treatment" (that comes from post-fix OFATs). Idempotent:
// rewrites datasets/smart-layer.clean.jsonl from the source result each run.
import { writeFileSync, readFileSync } from 'node:fs';

const SRC = process.argv[2]
  || '/private/tmp/claude-501/-Users-sebs/166ddaed-f4e6-429a-a87f-63a995593063/tasks/wg6jeydjx.output';
const OUT = new URL('../../datasets/smart-layer.clean.jsonl', import.meta.url).pathname;
const RUN = 'live-ofat-2026-06-14';

function findMaps(o) {
  if (Array.isArray(o)) { for (const v of o) { const r = findMaps(v); if (r) return r; } }
  else if (o && typeof o === 'object') {
    if (Array.isArray(o.maps)) return o.maps;
    for (const v of Object.values(o)) { const r = findMaps(v); if (r) return r; }
  }
  return null;
}
const labelOf = (s) => (s === 'works' ? 'ok' : s === 'broken' ? 'break' : s === 'partial' ? 'partial' : 'blocked');

const data = JSON.parse(readFileSync(SRC, 'utf8'));
const maps = findMaps(data) || [];
const rows = [];
let idx = 0;
for (const m of maps) {
  const stage = m.stage || 'unknown';
  for (const c of (m.cases || [])) {
    rows.push({
      exampleId: `${RUN}:${stage}:${c.input}:${c.factor}:${c.value}`,
      source: RUN, labelKind: 'fidelity', label: labelOf(c.status),
      confidence: null, rawScore: null, margin: null, firedRules: [],
      classifiedBy: 'live-ofat-vision', isGroundTruth: !!c.screenshot,
      svgHash: null, regionPath: c.input ?? null, renderSurface: `live-${stage}`,
      features: { stage, input: c.input, factor: c.factor, value: c.value, status: c.status, note: c.note ?? '', screenshot: c.screenshot ?? '' },
      regime: { label: 'live-ofat-prefix' }, ingestIndex: idx++,
    });
  }
  for (const b of (m.brokenClasses || [])) {
    rows.push({
      exampleId: `${RUN}:${stage}:BROKENCLASS:${(b.symptom || '').slice(0, 60)}`,
      source: RUN, labelKind: 'bug', label: 'break',
      confidence: null, rawScore: null, margin: null, firedRules: [],
      classifiedBy: 'live-ofat-vision', isGroundTruth: !!b.screenshot,
      svgHash: null, regionPath: null, renderSurface: `live-${stage}`,
      features: { stage, severity: b.severity, symptom: b.symptom, rootCauseGuess: b.rootCauseGuess ?? '', codeHint: b.codeHint ?? '', screenshot: b.screenshot ?? '' },
      regime: { label: 'live-ofat-prefix' }, ingestIndex: idx++,
    });
  }
}
writeFileSync(OUT, rows.map((r) => JSON.stringify(r)).join('\n') + '\n');
const byStatus = rows.reduce((a, r) => ((a[r.label] = (a[r.label] || 0) + 1), a), {});
const gt = rows.filter((r) => r.isGroundTruth).length;
console.log(`wrote ${rows.length} honest rows → ${OUT}`);
console.log(`  by label: ${JSON.stringify(byStatus)}`);
console.log(`  screenshot-backed (isGroundTruth): ${gt}/${rows.length}`);
console.log(`  stages: ${maps.map((m) => `${m.stage}(${(m.cases || []).length}c/${(m.brokenClasses || []).length}b)`).join(', ')}`);
