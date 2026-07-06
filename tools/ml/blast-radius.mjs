// Measure what "look at both" actually changes vs rules-only, across all captured
// regions. Replicates classifier.reconcileBoth on the real signals + rule roles.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const artifact = JSON.parse(fs.readFileSync(path.join(ROOT, 'datasets/smart-layer.signals.model.json'), 'utf8'));
const captured = JSON.parse(fs.readFileSync(path.join(__dirname, 'captured-signals.json'), 'utf8'));

const STROKE_BINS = ['none', 'hairline', 'thin', 'medium', 'heavy'];
const TAGS = ['rect', 'circle', 'ellipse', 'path', 'polygon', 'polyline', 'line', 'text', 'g', 'other'];
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const LEARNED_VOCAB = new Set(artifact.classes);
const OVERRIDE_CONF = 0.6;

function encode(s) {
  const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
  const b01 = (v) => (v ? 1 : 0);
  const hasStroke = s.stroke !== null && s.stroke !== 'none' && s.stroke !== 'transparent';
  const hasFill = s.fill !== null && s.fill !== 'none' && s.fill !== 'transparent';
  return [
    clamp01(num(s.darknessL)), Math.log1p(Math.max(0, num(s.area))), Math.max(0, Math.min(10, num(s.aspectRatio))),
    Math.log1p(Math.max(0, num(s.perimeter))), Math.log1p(Math.max(0, s.bbox?.w ?? 0)), Math.log1p(Math.max(0, s.bbox?.h ?? 0)),
    num(s.zIndex), clamp01(num(s.areaFractionOfParent)), num(s.enclosesSiblingCount),
    b01(s.containedInZIndex !== null && s.containedInZIndex !== undefined), b01(!!s.isPartOfStripeCluster), b01(s.parentBBox !== null),
    b01(hasStroke), b01(hasFill), b01(!!s.hasDasharray), clamp01(num(s.opacity)), clamp01(num(s.fillOpacity)),
    ...STROKE_BINS.map((b) => (s.strokeWidthBin === b ? 1 : 0)), ...TAGS.map((t) => (s.tag === t ? 1 : 0)),
  ];
}
function predict(s) {
  const x = encode(s).map((v, j) => (v - artifact.standardizer.mean[j]) / (artifact.standardizer.std[j] || 1));
  const d = x.length;
  const logits = artifact.weights.map((wc) => { let z = wc[d]; for (let j = 0; j < d; j++) z += wc[j] * x[j]; return z; });
  const m = Math.max(...logits); const e = logits.map((z) => Math.exp(z - m)); const sum = e.reduce((a, b) => a + b, 0);
  const p = e.map((x) => x / sum); let bi = 0; for (let i = 1; i < p.length; i++) if (p[i] > p[bi]) bi = i;
  return { role: artifact.classes[bi], conf: p[bi] };
}
function reconcile(ruleRole, ruleConf, learned) {
  if (ruleRole === learned.role) return { role: ruleRole, kind: 'agree' };
  if (LEARNED_VOCAB.has(ruleRole) && learned.conf >= OVERRIDE_CONF) return { role: learned.role, kind: 'override' };
  return { role: ruleRole, kind: 'keep' };
}

let agree = 0, override = 0, keep = 0, learnedAbstain = 0;
const changes = {}; // "ruleRole→learnedRole": count
for (const r of captured.rows) {
  const s = r.signals; if (!s) continue;
  const learned = predict(s);
  if (learned.conf < 0.5) { learnedAbstain++; keep++; continue; } // provider minConfidence
  const out = reconcile(r.ruleRole, r.ruleConfidence ?? 0, learned);
  if (out.kind === 'agree') agree++;
  else if (out.kind === 'override') { override++; const k = `${r.ruleRole} → ${learned.role}`; changes[k] = (changes[k] || 0) + 1; }
  else keep++;
}
const n = captured.rows.length;
console.log(`=== "LOOK AT BOTH" BLAST RADIUS (n=${n} regions) ===`);
console.log(`  agree (rules & model concur) : ${agree}  (${(100*agree/n).toFixed(1)}%)`);
console.log(`  model OVERRIDES rule         : ${override}  (${(100*override/n).toFixed(1)}%)`);
console.log(`  rule kept (out-of-vocab/low) : ${keep}  (${(100*keep/n).toFixed(1)}%)  [learned abstained on ${learnedAbstain}]`);
console.log(`\n  role changes where the model overrode (rule → model):`);
Object.entries(changes).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`    ${v.toString().padStart(4)}  ${k}`));
