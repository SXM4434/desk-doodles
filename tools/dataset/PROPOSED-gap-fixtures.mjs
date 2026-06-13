// PROPOSED-gap-fixtures.mjs — proposed stubs to close the SMART/ML DATA gaps.
//
// READ-ONLY ANALYSIS ARTIFACT (gap-hunt 2026-06-13). Nothing here is wired into
// the pipeline; each block is a concrete, ready-to-lift stub for a gap found in
// the dataset / feeder / collector chain that the existing audits
// (smart-system-gaps.md G-1..G-10, test-coverage-gap-map.md, ml/README) do NOT
// already close. Lift the relevant block into the named real file when building.
//
// The gaps these stubs target (see the gap-hunt structured report for the full
// {area, whatIsMissing, risk, howToClose}):
//   1. The live decision log + golden store only 3 of ~14 Signals → every
//      learned model is permanently capped at the 3-feature ceiling.
//   2. shadeFillLog ('shade-fill') + shapeSnapLog ('shape-snap') are LIVE
//      collectors with NO feeding adapter — their labels evaporate.
//   3. /tmp/dd-2d-sweep/results.json (2,167 rows) + /tmp/dd-gauntlet report
//      (90 rows) exist on disk and have NEVER been fed.
//   4. No harness auto-feeds (keep-feeding memory asks for it explicitly).
//   5. The dataset has no rule-vs-golden disagreement column (calibration fuel).
//   6. fidelity-2d adapter discards the rich features the sweep actually records
//      (inkFrac/darkFrac/edgeFrac/flags) and the expected-vs-actual role.

// ─────────────────────────────────────────────────────────────────────────────
// GAP 1 — FULL-SIGNALS SNAPSHOT on the live decision-log entry.
//
// WHERE: src/app/lib/smartHachure/index.ts (~line 333, the pushDecisionLogEntry
// call) currently copies darknessL/area/fillStyle off `signals`/`treatment`.
// The full Signals vector already exists at that call site as
// `classification.signalsSnapshot`. Add ONE field so the feeder can store the
// ~10 missing features (aspectRatio, zIndex, areaFractionOfParent,
// enclosesSiblingCount, containedInZIndex, isPartOfStripeCluster, tag, stroke,
// strokeWidthBin, hasDasharray, opacity, fillOpacity, perimeter).
//
//   // index.ts DecisionLogEntry type — add:
//   signals?: Signals;            // full snapshot for training (G-feature gap)
//   // index.ts push site — add:
//   signals: classification.signalsSnapshot,
//
// THEN extend the adapters (tools/dataset/dataset-lib.mjs) to fold every numeric
// /string Signals field through into `features` (they ALREADY have the
// "fold any extra signal fields through, never inventing absent ones" comment —
// this just makes the producer emit them):
export const FULL_SIGNAL_FEATURE_KEYS = [
  'darknessL', 'area', 'aspectRatio', 'perimeter',
  'zIndex', 'areaFractionOfParent', 'enclosesSiblingCount',
  'containedInZIndex', 'isPartOfStripeCluster',
  'strokeWidthBin', 'hasDasharray', 'tag', 'opacity', 'fillOpacity',
  // plus the treatment-side field already stored:
  'fillStyle',
];

/** Pull the full feature set off an entry that carries `signals` (no faking:
 *  absent fields stay absent). Drop-in for the `features` block in
 *  goldenEntryToExample / decisionLogEntryToExample. */
export function featuresFromSignals(entry) {
  const out = {};
  const s = entry.signals ?? entry; // golden inlines fields; live nests under .signals
  for (const k of FULL_SIGNAL_FEATURE_KEYS) {
    const v = s?.[k] ?? entry?.[k];
    if (v !== undefined && v !== null) out[k] = v;
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// GAP 2 — feeding adapters for the two un-adapted live collectors.
// These two entryTypes flow into window.__dd_decisionLog already; pullAudit just
// drops them on the floor (it only filters shading/conversion/conversion-correction).

/** shade-fill entry ('shade-fill') → 'treatment' (a commit) or 'correct-or-not'
 *  (a miss / cancel = the user telling us the extractor was wrong). The tone the
 *  user PAINTED is explicit darknessL — exactly the G-5 source-darkness signal
 *  the classifier can't see on stroke-only doodles. */
export function shadeFillEntryToExample(e, idx, CANONICAL_REGIME) {
  const isCorrection = e.outcome === 'miss' || e.outcome === 'cancelled' || e.outcome === 'lasso-after-miss';
  return {
    exampleId: `shade-fill:${e.svgHash ?? idx}:${e.regionPath ?? e.gesture}:${e.outcome}`,
    source: 'shade-fill',                 // ← NEW source; add to KNOWN_SOURCES
    labelKind: isCorrection ? 'correct-or-not' : 'treatment',
    label: String(e.band ?? e.gesture ?? e.outcome),
    confidence: isCorrection ? 1.0 : null,
    rawScore: null, margin: null, firedRules: [],
    classifiedBy: isCorrection ? 'manual-override' : 'rules',
    isGroundTruth: isCorrection,
    svgHash: e.svgHash ?? null,
    regionPath: e.regionPath ?? null,
    renderSurface: e.surface ?? null,
    features: { gesture: e.gesture, band: e.band, darknessSource: 'tone-brush' },
    regime: { ...CANONICAL_REGIME },
  };
}

/** shape-snap entry ('shape-snap') → 'correct-or-not'. evaluate/cycle/keep/revert
 *  is a pure preference signal: we offered a ranked candidate table, the user
 *  accepted / cycled / reverted. The candidate kinds + errors are the features. */
export function shapeSnapEntryToExample(e, idx, CANONICAL_REGIME) {
  const accepted = e.action && (e.outcome === 'evaluate' || e.outcome === 'keep');
  return {
    exampleId: `shape-snap:${e.svgHash ?? idx}:${e.outcome}:${e.standingKind ?? 'na'}`,
    source: 'shape-snap',                 // ← NEW source; add to KNOWN_SOURCES
    labelKind: 'correct-or-not',
    label: e.outcome === 'revert' ? 'rejected' : String(e.standingKind ?? e.action ?? 'kept'),
    confidence: 1.0,
    rawScore: null, margin: null, firedRules: [],
    classifiedBy: 'manual-override',
    isGroundTruth: e.outcome === 'keep' || e.outcome === 'revert', // a settled choice
    svgHash: e.svgHash ?? null,
    regionPath: null,
    renderSurface: e.surface ?? null,
    features: { action: e.action, candidates: e.candidates, standingKind: e.standingKind },
    regime: { ...CANONICAL_REGIME },
  };
}

// In feed-dataset.mjs::pullAudit, after the existing split, add:
//   const shadeFill = raw.filter((e) => e.entryType === 'shade-fill');
//   const shapeSnap = raw.filter((e) => e.entryType === 'shape-snap');
//   ...shadeFill.map((e,i)=>shadeFillEntryToExample(e,i,CANONICAL_REGIME)),
//   ...shapeSnap.map((e,i)=>shapeSnapEntryToExample(e,i,CANONICAL_REGIME)),
// and add --from-shade-fill / --from-shape-snap file-export pullers mirroring
// pullConversionExport for the offline path.

// ─────────────────────────────────────────────────────────────────────────────
// GAP 5 — rule-vs-golden disagreement column (calibration data).
// The dataset has NO column saying "the rule engine predicted X, the blessed
// golden says Y." That join is the single richest calibration signal (it tells
// you exactly which rules are miscalibrated). Compute it offline by joining the
// live audit-decisionlog pull against golden-labels.v2.json on (svgHash,
// regionPath) and stamping each row:
//
//   ruleRole:    <decisionLog role>
//   goldenRole:  <golden role>
//   agree:       ruleRole === goldenRole
//
// This needs NO new collector — both sides already exist. Add a
// `node tools/dataset/build-calibration-join.mjs` that emits a
// `datasets/smart-layer.calibration.jsonl` (or folds an `agree`/`goldenRole`
// pair into the audit-decisionlog examples' `features`). Without it, reliability
// can only measure confidence-vs-self (the reliability.js upper-bias caveat),
// never confidence-vs-truth on the regions where they disagree.

// ─────────────────────────────────────────────────────────────────────────────
// GAP 4 — auto-feed hook (keep-feeding memory: "bake the ingest call into the
// harness so it auto-feeds"). NO harness calls the feeder today. Proposed: a
// tiny re-exported helper every node harness can call in its finally block.
//
//   import { autoFeed } from '../dataset/auto-feed.mjs';
//   await autoFeed({ fidelity2d: '/tmp/dd-2d-sweep/results.json' });   // 2D sweep
//   await autoFeed({ fidelity3d: '/tmp/dd-gauntlet/gauntlet-report.json' }); // gauntlet
//
// where auto-feed.mjs just shells the existing feed-dataset.mjs with the right
// --from-* flag (so there's ONE feeder, no logic fork). Wire it into:
//   tools/2d/audit-style-sweep.mjs   (→ --from-fidelity-2d)
//   tools/3d/*gauntlet*.mjs          (→ --from-fidelity-3d)
//   tools/classifier/golden-snapshot.js (→ --from-audit, live decisionlog)
//   the comprehensive 197×toggle sweep harness (tasks #114) — its output is
//   premium negative-example data and currently evaporates.
