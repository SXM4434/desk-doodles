#!/usr/bin/env node
// tools/ml/enrich-dataset.mjs — fold the FULL captured signal vector into the
// persistent dataset (datasets/smart-layer.dataset.jsonl), feeding it per
// feedback_keep_feeding_smart_ml.
//
// WHAT: joins tools/ml/captured-signals.json (full Signals per (svgHash,
// regionPath), captured via the production extractAllSignals — see
// capture-signals.mjs) onto the blessed golden role labels
// (audit-runs/golden-labels.v2.json), and UPSERTS the merged rows through the
// canonical dataset-lib (dedupe by exampleId = `golden:${svgHash}:${regionPath}`,
// preserves ingestIndex, S11 regime stamp). The existing 1,394 golden rows are
// UPDATED IN PLACE with the enriched `features` (the full classify-time vector),
// never duplicated.
//
// HONESTY (task: "drop the leaky fillStyle feature; use ONLY signals available
// at classify-time; do NOT sneak in any post-classification feature"):
//   - `features` now carries the FULL Signals members (geometric, topological,
//     stylistic, perceptual) — every field extractAllSignals produces.
//   - `fillStyle` (a treatment OUTPUT, downstream of classification) is recorded
//     ONLY as a labelled provenance field (`fillStyleTreatment`) OUTSIDE
//     `features`, so a trainer that reads `features` cannot leak it. The old
//     `features.fillStyle` is REMOVED from the enriched rows.
//   - `ruleRoleCurrent` records the CURRENT production rule engine's role on the
//     CURRENT signals (the honest baseline; differs from the golden label where
//     the wash-darkness fix changed the signal regime).
//
// No live-DB writes. No clock read for ordering. Date allowed for --captured-at.
//
// Usage:
//   node tools/ml/enrich-dataset.mjs                 # write
//   node tools/ml/enrich-dataset.mjs --dry-run       # diff only
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  REPO_ROOT,
  DATASET_JSONL,
  MANIFEST_JSON,
  CANONICAL_REGIME,
  loadDataset,
  upsertExamples,
  writeDataset,
  writeManifest,
} from '../dataset/dataset-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CAPTURED = path.join(__dirname, 'captured-signals.json');
const GOLDEN = path.join(REPO_ROOT, 'audit-runs', 'golden-labels.v2.json');

function parseArgs(argv) {
  const a = { dryRun: false, capturedAt: null };
  for (let i = 2; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--dry-run') a.dryRun = true;
    else if (k === '--captured-at') a.capturedAt = argv[++i];
    else { console.error(`Unknown arg: ${k}`); process.exit(2); }
  }
  return a;
}

function readJson(p) {
  if (!fs.existsSync(p)) { console.error(`FATAL: not found: ${p}`); process.exit(1); }
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

/** Flatten one full Signals value into the dataset `features` object.
 *  Excludes nothing from Signals; explicitly EXCLUDES any treatment/fillStyle
 *  (those are not Signals members). bbox/parentBBox are flattened to scalars so
 *  every feature is a plain number/string/bool the trainer can encode. */
function signalsToFeatures(s) {
  return {
    // Geometric
    darknessL: s.darknessL,
    area: s.area,
    aspectRatio: s.aspectRatio,
    perimeter: s.perimeter,
    bboxW: s.bbox?.w ?? 0,
    bboxH: s.bbox?.h ?? 0,
    // Topological
    zIndex: s.zIndex,
    areaFractionOfParent: s.areaFractionOfParent,
    enclosesSiblingCount: s.enclosesSiblingCount,
    containedInZIndex: s.containedInZIndex, // number|null (null = not contained)
    isPartOfStripeCluster: s.isPartOfStripeCluster,
    hasParent: s.parentBBox !== null,
    // Stylistic (categorical/boolean — encoded one-hot/binary by the trainer)
    strokeWidthBin: s.strokeWidthBin,            // 'none'|'hairline'|'thin'|'medium'|'heavy'
    hasStroke: s.stroke !== null && s.stroke !== 'none' && s.stroke !== 'transparent',
    hasFill: s.fill !== null && s.fill !== 'none' && s.fill !== 'transparent',
    hasDasharray: s.hasDasharray,
    tag: s.tag,                                  // 'rect'|'circle'|...|'other'
    opacity: s.opacity,
    fillOpacity: s.fillOpacity,
  };
}

async function main() {
  const args = parseArgs(process.argv);
  const cap = readJson(CAPTURED);
  const gold = readJson(GOLDEN);

  const capByKey = new Map(cap.rows.map((r) => [`${r.svgHash} ${r.regionPath}`, r]));
  const goldEntries = Array.isArray(gold.entries) ? gold.entries : [];
  console.log(`captured rows : ${cap.rows.length} (captured ${cap.capturedAt})`);
  console.log(`golden entries: ${goldEntries.length} (status ${gold.status}, blessedBy ${gold.blessedBy})`);

  let joined = 0;
  let missing = 0;
  const examples = [];
  for (const e of goldEntries) {
    const r = capByKey.get(`${e.svgHash} ${e.regionPath}`);
    if (!r) { missing += 1; continue; } // golden region not in capture — skip (don't fake features)
    joined += 1;
    examples.push({
      exampleId: `golden:${e.svgHash}:${e.regionPath}`,
      source: 'golden',
      labelKind: 'role',
      label: e.role, // blessed ground-truth role (the label we train toward)
      confidence: typeof e.confidence === 'number' ? e.confidence : null,
      rawScore: typeof e.rawScore === 'number' ? e.rawScore : null,
      margin: typeof e.margin === 'number' ? e.margin : null,
      firedRules: Array.isArray(e.firedRules) ? e.firedRules : [],
      classifiedBy: e.classifiedBy ?? 'rules',
      isGroundTruth: true,
      svgHash: e.svgHash,
      regionPath: e.regionPath,
      renderSurface: 'audit',
      // ── FULL classify-time signal vector (NO fillStyle treatment) ──
      features: signalsToFeatures(r.signals),
      // ── provenance (OUTSIDE features so the trainer can't leak it) ──
      fillStyleTreatment: e.fillStyle ?? null, // downstream treatment — NOT a feature
      ruleRoleCurrent: r.ruleRole ?? 'paper',  // current rule engine on current signals (baseline)
      ruleConfidenceCurrent: r.ruleConfidence,
      regime: { ...CANONICAL_REGIME },
    });
  }
  console.log(`joined: ${joined}  ·  golden regions missing from capture: ${missing}`);

  const byId = loadDataset();
  const before = byId.size;
  const { added, updated } = upsertExamples(byId, examples);

  if (args.dryRun) {
    console.log(`\n[DRY RUN] would add ${added}, update ${updated} (of ${before} existing). Wrote nothing.`);
    const sample = examples[0];
    console.log('[DRY RUN] enriched feature keys:', Object.keys(sample.features).join(', '));
    return;
  }

  const total = writeDataset(byId);
  const manifest = writeManifest(byId, {
    capturedAt: args.capturedAt ?? cap.capturedAt ?? null,
    lastFeedSources: ['golden-enriched-signals'],
  });
  console.log(`\n✓ Enriched ${examples.length} rows → added ${added}, updated ${updated}.`);
  console.log(`✓ Dataset now ${total} examples → ${path.relative(REPO_ROOT, DATASET_JSONL)}`);
  console.log(`✓ Manifest → ${path.relative(REPO_ROOT, MANIFEST_JSON)}`);
  console.log(`  feature vector: ${Object.keys(examples[0].features).length} fields (full Signals, no fillStyle treatment)`);
}

main().catch((err) => { console.error(err); process.exit(1); });
