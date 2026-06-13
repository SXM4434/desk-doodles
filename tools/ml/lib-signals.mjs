// tools/ml/lib-signals.mjs — SIGNALS-ONLY feature encoding for the honest,
// production-wireable smart-layer classifier.
//
// THE POINT (task): drop the leaky `fillStyle` feature (a treatment OUTPUT,
// unknown at classify-time) and encode ONLY the `Signals` members available
// BEFORE a treatment is chosen — exactly what signals.ts/extractSignals produces
// and what the production classifier reads. No post-classification feature can
// enter this vector by construction (the dataset stores fillStyle OUTSIDE
// `features`, and this encoder reads ONLY `features`).
//
// Reuses the proven SGD trainer + metrics + shape-grouped split from lib.mjs;
// this file only owns the NEW feature encoding. Pure functions, zero deps.

import { FILL_STYLES as _unused } from './lib.mjs'; // (kept import graph honest; not used here)
void _unused;

// ── categorical vocabularies (fixed → stable one-hot indices) ───────────────
export const STROKE_BINS = ['none', 'hairline', 'thin', 'medium', 'heavy'];
export const TAGS = ['rect', 'circle', 'ellipse', 'path', 'polygon', 'polyline', 'line', 'text', 'g', 'other'];

// The signals-only feature names, in vector order. EXCLUDES fillStyle entirely.
export const SIGNAL_FEATURE_NAMES = [
  // perceptual + geometric (continuous)
  'darknessL',
  'log1pArea',
  'aspectRatioClamped',
  'log1pPerimeter',
  'log1pBboxW',
  'log1pBboxH',
  // topological (continuous / binary)
  'zIndex',
  'areaFractionOfParent',
  'enclosesSiblingCount',
  'isContained',            // containedInZIndex !== null
  'isPartOfStripeCluster',
  'hasParent',
  // stylistic (binary)
  'hasStroke',
  'hasFill',
  'hasDasharray',
  'opacity',
  'fillOpacity',
  // categorical one-hots
  ...STROKE_BINS.map((b) => `strokeBin=${b}`),
  ...TAGS.map((t) => `tag=${t}`),
];

function num(v) { return typeof v === 'number' && Number.isFinite(v) ? v : 0; }
function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
function bool01(v) { return v ? 1 : 0; }

/** Encode ONE example's `features` object into the signals-only numeric vector.
 *  Reads ONLY `ex.features` — fillStyle lives OUTSIDE features, so it cannot
 *  leak here. */
export function rawSignalFeatures(ex) {
  const f = ex.features || {};
  const darkness = clamp01(num(f.darknessL));
  const logArea = Math.log1p(Math.max(0, num(f.area)));
  // aspectRatio is heavy-tailed (0 for zero-height lines, huge for wide bands);
  // clamp to a sane band so one outlier doesn't dominate standardization.
  const aspect = Math.max(0, Math.min(10, num(f.aspectRatio)));
  const logPerim = Math.log1p(Math.max(0, num(f.perimeter)));
  const logW = Math.log1p(Math.max(0, num(f.bboxW)));
  const logH = Math.log1p(Math.max(0, num(f.bboxH)));
  const z = num(f.zIndex);
  const areaFrac = clamp01(num(f.areaFractionOfParent));
  const encloses = num(f.enclosesSiblingCount);
  const isContained = bool01(f.containedInZIndex !== null && f.containedInZIndex !== undefined);
  const stripe = bool01(f.isPartOfStripeCluster);
  const hasParent = bool01(f.hasParent);
  const hasStroke = bool01(f.hasStroke);
  const hasFill = bool01(f.hasFill);
  const dash = bool01(f.hasDasharray);
  const opacity = clamp01(num(f.opacity));
  const fillOpacity = clamp01(num(f.fillOpacity));
  const strokeOneHot = STROKE_BINS.map((b) => (f.strokeWidthBin === b ? 1 : 0));
  const tagOneHot = TAGS.map((t) => (f.tag === t ? 1 : 0));
  return [
    darkness, logArea, aspect, logPerim, logW, logH,
    z, areaFrac, encloses, isContained, stripe, hasParent,
    hasStroke, hasFill, dash, opacity, fillOpacity,
    ...strokeOneHot, ...tagOneHot,
  ];
}

/** The fillStyle-INCLUSIVE ablation vector (for the honest "with vs without"
 *  comparison). Appends a fillStyle one-hot read from the provenance field
 *  `ex.fillStyleTreatment` (NOT from features). Used ONLY by the ablation in
 *  the report — never by the shippable model. */
export const FILL_STYLES_ABLATION = ['none', 'solid', 'hachure', 'cross-hatch', 'dots', 'zigzag', 'dashed', 'zigzag-line'];
export const SIGNAL_PLUS_FILLSTYLE_NAMES = [
  ...SIGNAL_FEATURE_NAMES,
  ...FILL_STYLES_ABLATION.map((s) => `LEAK_fill=${s}`),
];
export function rawSignalPlusFillStyleFeatures(ex) {
  const base = rawSignalFeatures(ex);
  const fs = ex.fillStyleTreatment ?? 'none';
  const fsOneHot = FILL_STYLES_ABLATION.map((s) => (fs === s ? 1 : 0));
  return [...base, ...fsOneHot];
}
