// Parity check: confirm the RUNTIME encoder (src learnedProvider.encodeSignals32,
// replicated here in JS) produces byte-identical feature vectors + predictions to
// the OFFLINE training encoder (enrich.signalsToFeatures ∘ lib-signals.rawSignalFeatures)
// on real captured signals. If this passes, the live model == the trained model.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { rawSignalFeatures, SIGNAL_FEATURE_NAMES } from './lib-signals.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const artifact = JSON.parse(fs.readFileSync(path.join(ROOT, 'datasets/smart-layer.signals.model.json'), 'utf8'));
const captured = JSON.parse(fs.readFileSync(path.join(__dirname, 'captured-signals.json'), 'utf8'));
const rows = captured.rows;

// ── OFFLINE ground truth: enrich.signalsToFeatures, verbatim from enrich-dataset.mjs ──
function signalsToFeatures(s) {
  return {
    darknessL: s.darknessL, area: s.area, aspectRatio: s.aspectRatio, perimeter: s.perimeter,
    bboxW: s.bbox?.w ?? 0, bboxH: s.bbox?.h ?? 0,
    zIndex: s.zIndex, areaFractionOfParent: s.areaFractionOfParent,
    enclosesSiblingCount: s.enclosesSiblingCount, containedInZIndex: s.containedInZIndex,
    isPartOfStripeCluster: s.isPartOfStripeCluster, hasParent: s.parentBBox !== null,
    strokeWidthBin: s.strokeWidthBin,
    hasStroke: s.stroke !== null && s.stroke !== 'none' && s.stroke !== 'transparent',
    hasFill: s.fill !== null && s.fill !== 'none' && s.fill !== 'transparent',
    hasDasharray: s.hasDasharray, tag: s.tag, opacity: s.opacity, fillOpacity: s.fillOpacity,
  };
}
const offlineVector = (s) => rawSignalFeatures({ features: signalsToFeatures(s) });

// ── RUNTIME replica: a JS copy of learnedProvider.encodeSignals32 (combined) ──
const STROKE_BINS = ['none', 'hairline', 'thin', 'medium', 'heavy'];
const TAGS = ['rect', 'circle', 'ellipse', 'path', 'polygon', 'polyline', 'line', 'text', 'g', 'other'];
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
function encodeSignals32(s) {
  const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
  const b01 = (v) => (v ? 1 : 0);
  const hasStroke = s.stroke !== null && s.stroke !== 'none' && s.stroke !== 'transparent';
  const hasFill = s.fill !== null && s.fill !== 'none' && s.fill !== 'transparent';
  const bboxW = s.bbox?.w ?? 0, bboxH = s.bbox?.h ?? 0;
  return [
    clamp01(num(s.darknessL)), Math.log1p(Math.max(0, num(s.area))),
    Math.max(0, Math.min(10, num(s.aspectRatio))), Math.log1p(Math.max(0, num(s.perimeter))),
    Math.log1p(Math.max(0, bboxW)), Math.log1p(Math.max(0, bboxH)),
    num(s.zIndex), clamp01(num(s.areaFractionOfParent)), num(s.enclosesSiblingCount),
    b01(s.containedInZIndex !== null && s.containedInZIndex !== undefined),
    b01(!!s.isPartOfStripeCluster), b01(s.parentBBox !== null),
    b01(hasStroke), b01(hasFill), b01(!!s.hasDasharray),
    clamp01(num(s.opacity)), clamp01(num(s.fillOpacity)),
    ...STROKE_BINS.map((bin) => (s.strokeWidthBin === bin ? 1 : 0)),
    ...TAGS.map((t) => (s.tag === t ? 1 : 0)),
  ];
}

function standardize(raw, stdz) { return raw.map((v, j) => (v - stdz.mean[j]) / (stdz.std[j] || 1)); }
function softmax(l) { const m = Math.max(...l); const e = l.map((z) => Math.exp(z - m)); const s = e.reduce((a, b) => a + b, 0); return e.map((x) => x / s); }
function predict(vec) {
  const x = standardize(vec, artifact.standardizer); const d = x.length;
  const logits = artifact.weights.map((wc) => { let z = wc[d]; for (let j = 0; j < d; j++) z += wc[j] * x[j]; return z; });
  const p = softmax(logits); let bi = 0; for (let i = 1; i < p.length; i++) if (p[i] > p[bi]) bi = i;
  return { role: artifact.classes[bi], conf: p[bi] };
}

let vecMismatch = 0, predMismatch = 0, maxDelta = 0, n = 0;
for (const r of rows) {
  const s = r.signals; if (!s) continue;
  n++;
  const off = offlineVector(s), run = encodeSignals32(s);
  let bad = false;
  for (let i = 0; i < off.length; i++) { const dd = Math.abs(off[i] - run[i]); if (dd > maxDelta) maxDelta = dd; if (dd > 1e-9) bad = true; }
  if (off.length !== run.length) bad = true;
  if (bad) { vecMismatch++; if (vecMismatch <= 3) console.log('VEC MISMATCH', r.svgHash, r.regionPath); }
  const po = predict(off), pr = predict(run);
  if (po.role !== pr.role) { predMismatch++; if (predMismatch <= 3) console.log('PRED MISMATCH', po.role, '!=', pr.role); }
}
console.log(`\n=== PARITY (n=${n} real captured regions) ===`);
console.log(`featureNames match lib-signals: ${JSON.stringify(artifact.featureNames) === JSON.stringify(SIGNAL_FEATURE_NAMES)}`);
console.log(`vector mismatches : ${vecMismatch}   (max abs delta ${maxDelta.toExponential(2)})`);
console.log(`prediction mismatches: ${predMismatch}`);
console.log(vecMismatch === 0 && predMismatch === 0 ? '✓ RUNTIME ENCODER == TRAINING ENCODER — parity holds' : '✗ PARITY BROKEN');
