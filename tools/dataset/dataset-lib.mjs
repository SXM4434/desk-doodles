// dataset-lib.mjs — the persistent-dataset core (append / dedupe / regime-stamp).
//
// THE plumbing for "make sure we are feeding into it": the smart-layer
// collectors (window.__dd_decisionLog, __dd_inputPickLog, conversion receipts,
// the fidelity catalog) are write-only RAM side channels — this module is where
// they land permanently, as a growing JSONL labeled dataset under datasets/.
//
// Per docs/knowledge/15 (the receipts ledger), 04 (don't-fake-it), 05 (edge
// S11: every sample records its geometry regime / epsilon — regimes never mix
// silently).
//
// HARD RULES honored here:
//   · No live-DB writes. Pure local file I/O.
//   · No clock reads inside the LIBRARY. The monotonic `ingestIndex` orders
//     examples without time; a wall-clock timestamp, if ever wanted, is passed
//     in by the caller (--captured-at) and only lands in the manifest, never as
//     ordering. (Offline node tooling; this matches the no-Date render-path rule.)
//   · Dedupe is real: same observation re-fed UPDATES in place by `exampleId`,
//     never duplicates. ingestIndex high-water only goes up.
//   · A source that can't state its regime is stamped {epsilon:null,
//     label:'unknown'} and counted separately — NEVER folded in as canonical.
//
// Offline ESM (repo package.json "type":"module").

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(__dirname, '..', '..');
export const DATASET_DIR = path.join(REPO_ROOT, 'datasets');
export const DATASET_JSONL = path.join(DATASET_DIR, 'smart-layer.dataset.jsonl');
export const MANIFEST_JSON = path.join(DATASET_DIR, 'smart-layer.manifest.json');

export const SCHEMA_VERSION = 1;

// The canonical geometry regime: the 197-shape /audit catalog + golden 1,394
// were ALL captured here. Source of truth: SvgStyleTransform.tsx:1731
// (RDP_EPSILON = 3.0) + :1791 (POLY_ANCHOR_CAP = 8). Edge S11.
export const CANONICAL_REGIME = Object.freeze({
  epsilon: 3.0,
  polyAnchorCap: 8,
  label: 'canonical-eps3',
});

export const UNKNOWN_REGIME = Object.freeze({
  epsilon: null,
  polyAnchorCap: null,
  label: 'unknown',
});

export const KNOWN_SOURCES = new Set([
  'golden',
  'audit-decisionlog',
  'conversion',
  'conversion-correction',
  'input-pick',
  'fidelity-2d',
  'fidelity-3d',
  // The two collectors that were emitting labels into __dd_decisionLog with no
  // adapter to land them — their labels were evaporating (gap-hunt H9):
  'shade-fill', // src/app/lib/shadeFillLog.ts  (entryType 'shade-fill')
  'shape-snap', // src/app/lib/shapeSnapLog.ts  (entryType 'shape-snap')
]);

const KNOWN_LABEL_KINDS = new Set(['role', 'correct-or-not', 'treatment', 'fidelity']);

// ─── LOAD ───────────────────────────────────────────────────────────────────

/** Load the dataset as a Map keyed by exampleId (empty if file absent). */
export function loadDataset() {
  const byId = new Map();
  if (!fs.existsSync(DATASET_JSONL)) return byId;
  const text = fs.readFileSync(DATASET_JSONL, 'utf8');
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    let row;
    try {
      row = JSON.parse(trimmed);
    } catch {
      // A corrupt line is skipped loudly rather than silently dropped — the
      // caller's count diff will reveal it.
      console.warn(`[dataset-lib] skipped unparseable JSONL line (${trimmed.slice(0, 60)}…)`);
      continue;
    }
    if (row && typeof row.exampleId === 'string') byId.set(row.exampleId, row);
  }
  return byId;
}

/** Current high-water ingestIndex (−1 if empty) — monotonic, time-free. */
export function highWaterIndex(byId) {
  let hi = -1;
  for (const row of byId.values()) {
    if (typeof row.ingestIndex === 'number' && row.ingestIndex > hi) hi = row.ingestIndex;
  }
  return hi;
}

// ─── VALIDATE ─────────────────────────────────────────────────────────────────

/** Throw on a malformed example — the schema is the contract; bad rows never
 *  enter the set. */
function validateExample(ex) {
  if (typeof ex.exampleId !== 'string' || !ex.exampleId) throw new Error('example missing exampleId');
  if (!KNOWN_SOURCES.has(ex.source)) throw new Error(`unknown source: ${ex.source}`);
  if (!KNOWN_LABEL_KINDS.has(ex.labelKind)) throw new Error(`unknown labelKind: ${ex.labelKind}`);
  if (typeof ex.label !== 'string') throw new Error(`example ${ex.exampleId} missing string label`);
  if (!ex.regime || !('epsilon' in ex.regime) || typeof ex.regime.label !== 'string') {
    throw new Error(`example ${ex.exampleId} missing S11 regime {epsilon,label}`);
  }
}

// ─── UPSERT + WRITE ───────────────────────────────────────────────────────────

/**
 * Fold a batch of new examples into the dataset Map.
 *
 * Dedupe semantics: keyed by `exampleId`. A returning observation UPDATES the
 * stored row in place (latest feed wins on mutable fields) but PRESERVES the
 * original `ingestIndex` (first-seen ordering is stable). Genuinely new
 * examples receive the next monotonic ingestIndex.
 *
 * @returns {{added:number, updated:number, byId:Map}}
 */
export function upsertExamples(byId, examples) {
  let nextIndex = highWaterIndex(byId) + 1;
  let added = 0;
  let updated = 0;
  for (const raw of examples) {
    validateExample(raw);
    const existing = byId.get(raw.exampleId);
    if (existing) {
      // preserve first-seen ingestIndex; update everything else.
      byId.set(raw.exampleId, { ...raw, ingestIndex: existing.ingestIndex });
      updated += 1;
    } else {
      byId.set(raw.exampleId, { ...raw, ingestIndex: nextIndex++ });
      added += 1;
    }
  }
  return { added, updated, byId };
}

/** Serialize the dataset to JSONL, sorted by ingestIndex (deterministic). */
export function writeDataset(byId) {
  fs.mkdirSync(DATASET_DIR, { recursive: true });
  const rows = [...byId.values()].sort((a, b) => a.ingestIndex - b.ingestIndex);
  const text = rows.map((r) => JSON.stringify(r)).join('\n') + (rows.length ? '\n' : '');
  fs.writeFileSync(DATASET_JSONL, text);
  return rows.length;
}

/** Recompute + write the manifest sidecar (accounting only — not examples). */
export function writeManifest(byId, { capturedAt = null, lastFeedSources = [] } = {}) {
  const rows = [...byId.values()];
  const bySource = {};
  const byLabelKind = {};
  const byRegime = {};
  const bySurface = {};
  let groundTruth = 0;
  for (const r of rows) {
    bySource[r.source] = (bySource[r.source] || 0) + 1;
    byLabelKind[r.labelKind] = (byLabelKind[r.labelKind] || 0) + 1;
    const rk = r.regime?.label ?? 'unknown';
    byRegime[rk] = (byRegime[rk] || 0) + 1;
    const surf = r.renderSurface ?? 'null';
    bySurface[surf] = (bySurface[surf] || 0) + 1;
    if (r.isGroundTruth) groundTruth += 1;
  }
  const manifest = {
    schemaVersion: SCHEMA_VERSION,
    dataset: path.relative(REPO_ROOT, DATASET_JSONL),
    dedupeKey: 'exampleId',
    exampleCount: rows.length,
    highWaterIngestIndex: highWaterIndex(byId),
    groundTruthCount: groundTruth,
    countsBySource: bySource,
    countsByLabelKind: byLabelKind,
    // S11 ledger — if more than 'canonical-eps3' appears here, regimes are
    // mixed and any cross-regime training is an explicit decision, not an
    // accident.
    countsByRegime: byRegime,
    // G-10 ledger — 'null' here = honestly unwired surfaces; export must triage.
    countsByRenderSurface: bySurface,
    lastFeedSources,
    // capturedAt is PASSED IN (the library never reads the clock); null is honest.
    lastFeedCapturedAt: capturedAt,
  };
  fs.mkdirSync(DATASET_DIR, { recursive: true });
  fs.writeFileSync(MANIFEST_JSON, JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}

// ─── ADAPTERS: collector row → dataset example ────────────────────────────────
// Each adapter maps ONE feeding source's native row into the canonical example
// schema. Missing features are left ABSENT (never faked). Regime is stamped per
// what the source can honestly claim.

/** Golden snapshot entry → 'role' example. The seed (the blessed 1,394).
 *  Golden was captured at the canonical regime; labels are human-blessed →
 *  isGroundTruth true. */
export function goldenEntryToExample(e) {
  const features = {};
  if (typeof e.darknessL === 'number') features.darknessL = e.darknessL;
  if (typeof e.area === 'number') features.area = e.area;
  if (e.fillStyle !== undefined) features.fillStyle = e.fillStyle;
  return {
    exampleId: `golden:${e.svgHash}:${e.regionPath}`,
    source: 'golden',
    labelKind: 'role',
    label: e.role,
    confidence: typeof e.confidence === 'number' ? e.confidence : null,
    rawScore: typeof e.rawScore === 'number' ? e.rawScore : null,
    margin: typeof e.margin === 'number' ? e.margin : null,
    firedRules: Array.isArray(e.firedRules) ? e.firedRules : [],
    classifiedBy: e.classifiedBy ?? 'rules',
    isGroundTruth: true, // blessed by Sebs's eyeball (golden v2)
    svgHash: e.svgHash,
    regionPath: e.regionPath,
    // golden snapshot predates the G-10 surface field on entries → honestly
    // 'audit' (it IS the /audit render), recorded explicitly not guessed.
    renderSurface: e.surface ?? 'audit',
    features,
    regime: { ...CANONICAL_REGIME },
  };
}

/** Live /audit decision-log entry → 'role' example (fresh rule-engine output,
 *  NOT ground truth — it's a prediction). Captured at canonical regime on the
 *  /audit page. */
export function decisionLogEntryToExample(e) {
  const features = {};
  if (typeof e.darknessL === 'number') features.darknessL = e.darknessL;
  if (typeof e.area === 'number') features.area = e.area;
  if (e.fillStyle !== undefined) features.fillStyle = e.fillStyle;
  // Live entries may carry the richer Signals snapshot in future — fold any
  // extra numeric/string signal fields through, never inventing absent ones.
  return {
    exampleId: `audit-decisionlog:${e.svgHash}:${e.regionPath}`,
    source: 'audit-decisionlog',
    labelKind: 'role',
    label: e.role,
    confidence: typeof e.confidence === 'number' ? e.confidence : null,
    rawScore: typeof e.rawScore === 'number' ? e.rawScore : null,
    margin: typeof e.margin === 'number' ? e.margin : null,
    firedRules: Array.isArray(e.firedRules) ? e.firedRules : [],
    classifiedBy: e.classifiedBy ?? 'rules',
    isGroundTruth: e.classifiedBy === 'manual-override', // overrides ARE truth
    svgHash: e.svgHash,
    regionPath: e.regionPath,
    renderSurface: e.surface ?? 'audit',
    features,
    regime: { ...CANONICAL_REGIME },
  };
}

/** Conversion receipt → 'treatment' example. The 3D conversion brain's pick.
 *  Conversion runs at the canonical RDP epsilon (strokeTo3d RDP_EPSILON matches
 *  the 2D canonical per its own comment). */
export function conversionReceiptToExample(e) {
  const features = {};
  if (typeof e.band === 'number') features.band = e.band;
  if (e.closure !== undefined && e.closure !== null) features.closure = e.closure;
  if (e.intent !== undefined && e.intent !== null) features.intent = e.intent;
  if (typeof e.holesCut === 'number') features.holesCut = e.holesCut;
  const key = e.svgHash ? `${e.svgHash}:${e.unitId}` : `${e.unitId}:${e.mode}`;
  return {
    exampleId: `conversion:${key}`,
    source: 'conversion',
    labelKind: 'treatment',
    label: e.geometry ?? e.directive ?? e.treatment ?? 'none',
    confidence: typeof e.rawScore === 'number' ? e.rawScore : null,
    rawScore: typeof e.rawScore === 'number' ? e.rawScore : null,
    margin: typeof e.margin === 'number' ? e.margin : null,
    firedRules: Array.isArray(e.firedRules) ? e.firedRules : [],
    classifiedBy: 'rules',
    isGroundTruth: false,
    svgHash: e.svgHash ?? null,
    regionPath: e.unitId ?? null,
    renderSurface: e.renderSurface ?? null, // honestly null when unwired (G-10)
    features,
    regime: { ...CANONICAL_REGIME },
  };
}

/** Conversion-correction (chip flip) → 'correct-or-not' GROUND-TRUTH example.
 *  "system chose X, user flipped to Y" — the highest-value preference label. */
export function conversionCorrectionToExample(e) {
  return {
    exampleId: `conversion-correction:${e.strokeSignature}`,
    source: 'conversion-correction',
    labelKind: 'correct-or-not',
    // label = the human's resolved answer (treated-as-closed yes/no)
    label: e.to ? 'treated-as-closed' : 'open-rod',
    confidence: 1.0,
    rawScore: null,
    margin: null,
    firedRules: [],
    classifiedBy: 'manual-override',
    isGroundTruth: true,
    svgHash: null,
    regionPath: e.strokeSignature ?? null,
    renderSurface: e.renderSurface ?? null,
    features: { from: e.from, to: e.to, defaultAtFlip: e.defaultAtFlip, mode: e.mode },
    regime: { ...CANONICAL_REGIME },
  };
}

/** input-pick log entry (smartPick) → 'treatment' example (pick) or
 *  'correct-or-not' (override/undo = the user rejecting the pick). */
export function inputPickEntryToExample(e, idx) {
  const isCorrection = e.kind === 'overridden' || e.kind === 'undo';
  return {
    exampleId: `input-pick:${e.axis ?? 'axis'}:${e.svgHash ?? idx}:${e.kind ?? 'pick'}`,
    source: 'input-pick',
    labelKind: isCorrection ? 'correct-or-not' : 'treatment',
    label: String(e.value ?? e.picked ?? e.kind ?? 'pick'),
    confidence: typeof e.confidence === 'number' ? e.confidence : null,
    rawScore: null,
    margin: typeof e.margin === 'number' ? e.margin : null,
    firedRules: [],
    classifiedBy: isCorrection ? 'manual-override' : 'rules',
    isGroundTruth: isCorrection,
    svgHash: e.svgHash ?? null,
    regionPath: e.axis ?? null,
    renderSurface: e.surface ?? null,
    features: { axis: e.axis, kind: e.kind },
    regime: { ...CANONICAL_REGIME },
  };
}

/** 2D fidelity-catalog record (audit style sweep results.json) → 'fidelity'
 *  example: "shape X under style Y rendered ok/partial/no-op/broke". The
 *  breakage curriculum (dataset stream 2). These rows do NOT carry an epsilon
 *  unless the sweep recorded one → stamp canonical only when the sweep declares
 *  it, else 'unknown' + manifest flag. */
export function fidelity2dRecordToExample(r) {
  const verdict = normalizeVerdict(r);
  const regime = typeof r.epsilon === 'number'
    ? { epsilon: r.epsilon, polyAnchorCap: r.polyAnchorCap ?? null, label: `eps${r.epsilon}` }
    : { ...UNKNOWN_REGIME }; // sweep didn't record ε → honest unknown (S11)
  return {
    exampleId: `fidelity-2d:${r.shape ?? r.shapeId}:${r.style ?? r.styleId}`,
    source: 'fidelity-2d',
    labelKind: 'fidelity',
    label: verdict,
    confidence: null,
    rawScore: null,
    margin: null,
    firedRules: [],
    classifiedBy: 'rules',
    isGroundTruth: false, // sweep verdict is mechanical (hash diff), not human
    svgHash: r.svgHash ?? null,
    regionPath: r.shape ?? r.shapeId ?? null,
    renderSurface: 'audit',
    features: { style: r.style ?? r.styleId, shape: r.shape ?? r.shapeId },
    regime,
  };
}

/** 3D fidelity (geometry-gauntlet report) → 'fidelity' example: geometry
 *  correctness verdict (ok / NaN / degenerate-bbox / threw). */
export function fidelity3dRecordToExample(r, idx) {
  const ok = r.ok ?? r.pass ?? (Array.isArray(r.reasons) && r.reasons.length === 0);
  return {
    exampleId: `fidelity-3d:${r.name ?? r.id ?? idx}`,
    source: 'fidelity-3d',
    labelKind: 'fidelity',
    label: ok ? 'ok' : 'broke',
    confidence: null,
    rawScore: null,
    margin: null,
    firedRules: Array.isArray(r.reasons) ? r.reasons : [],
    classifiedBy: 'rules',
    isGroundTruth: false,
    svgHash: null,
    regionPath: r.name ?? r.id ?? String(idx),
    renderSurface: null,
    features: {
      vertexCount: r.vertexCount ?? null,
      mode: r.mode ?? null,
      bbox: r.bbox ?? null,
    },
    // gauntlet runs the conversion engine at its canonical RDP epsilon.
    regime: { ...CANONICAL_REGIME },
  };
}

/** shade-fill log entry (the 'shade-fill' decision-log surface, rock F2) → a
 *  'treatment' example when the act committed a band (the user choosing a tone
 *  level onto a region) or a 'correct-or-not' GROUND-TRUTH example when the act
 *  was a miss / cancel (the extractor-miss + lasso-after-miss labels — the
 *  user's correction of where fill SHOULD have landed). The collector runs on
 *  the draw surface under the canonical RDP extractor (it records
 *  `extractorVersion`); stamp canonical, but honestly stamp UNKNOWN if a future
 *  entry ever omits it.
 *
 *  Entries carry no svgHash (the drawn pool isn't a catalog shape); the exampleId
 *  keys on the act's stable signature (tool · gesture · band · outcome · index),
 *  so a re-fed export updates in place rather than duplicating. */
export function shadeFillEntryToExample(e, idx) {
  const isMiss = e.outcome === 'miss' || e.outcome === 'lasso-after-miss';
  const isCancel = e.outcome === 'cancelled';
  const isCorrection = isMiss || isCancel;
  // The committed band IS the label for a treatment; for a correction the label
  // is the outcome itself (what went wrong / was abandoned).
  const label = isCorrection
    ? String(e.outcome ?? 'cancelled')
    : (e.erase ? 'erase' : `band-${e.band ?? 0}`);
  // extractorVersion is the only regime signal the collector carries; the act
  // ran at the canonical RDP extractor. If a future entry omits it, stay honest.
  const regime = typeof e.extractorVersion === 'number'
    ? { ...CANONICAL_REGIME, extractorVersion: e.extractorVersion }
    : { ...UNKNOWN_REGIME };
  return {
    exampleId: `shade-fill:${e.tool ?? 'fill'}:${e.gesture ?? 'tap'}:${e.band ?? 0}:${e.outcome ?? 'committed'}:${idx}`,
    source: 'shade-fill',
    labelKind: isCorrection ? 'correct-or-not' : 'treatment',
    label,
    confidence: null,
    rawScore: null,
    margin: null,
    firedRules: [],
    // a miss / lasso-after-miss is the user telling us the extractor was wrong →
    // ground-truth correction. A clean commit is the user's pick, not truth.
    classifiedBy: isCorrection ? 'manual-override' : 'rules',
    isGroundTruth: isMiss,
    svgHash: null,
    regionPath: e.tool ?? null,
    renderSurface: e.surface ?? 'shade-fill',
    features: {
      tool: e.tool ?? null,
      gesture: e.gesture ?? null,
      band: typeof e.band === 'number' ? e.band : null,
      erase: e.erase ?? null,
      gapTol: typeof e.gapTol === 'number' ? e.gapTol : null,
      regionDepth: e.regionDepth ?? null,
      regionAreaWorld: e.regionAreaWorld ?? null,
      outcome: e.outcome ?? null,
      regionCount: typeof e.regionCount === 'number' ? e.regionCount : null,
    },
    regime,
  };
}

/** shape-snap log entry (the 'shape-snap' decision-log surface, rock F3) → the
 *  snap/straighten training tuple. evaluate = the offered pick ('treatment');
 *  cycle / keep / revert are the user RESOLVING the offer → 'correct-or-not'
 *  ground truth (keep = accepted the snap, revert = rejected it, cycle = moved
 *  to a different candidate). The full ranked candidate table + ambiguity margin
 *  ride in features (the richest preference signal). Drawn strokes run under the
 *  canonical extractor → canonical regime. */
export function shapeSnapEntryToExample(e, idx) {
  const isResolution = e.outcome === 'keep' || e.outcome === 'revert' || e.outcome === 'cycle';
  return {
    // strokeId links a cycle/keep/revert back to its originating evaluate; the
    // outcome makes each act in that chain a distinct example.
    exampleId: `shape-snap:${e.strokeId ?? idx}:${e.outcome ?? 'evaluate'}`,
    source: 'shape-snap',
    labelKind: isResolution ? 'correct-or-not' : 'treatment',
    // label = the shape the user is sitting on after the act (the resolved pick).
    label: String(e.chosen ?? (e.accepted ? 'accepted' : 'refused')),
    confidence: null,
    rawScore: null,
    margin: typeof e.margin === 'number' ? e.margin : null,
    firedRules: [],
    classifiedBy: isResolution ? 'manual-override' : 'rules',
    // keep = the user blessed the snap; revert = the user blessed 'original'.
    // Both are ground-truth preference. cycle is a mid-flight move, not final.
    isGroundTruth: e.outcome === 'keep' || e.outcome === 'revert',
    svgHash: null,
    regionPath: e.strokeId ?? null,
    renderSurface: e.surface ?? 'shape-snap',
    features: {
      action: e.action ?? null,
      outcome: e.outcome ?? null,
      accepted: e.accepted ?? null,
      refusedReason: e.refusedReason ?? null,
      chosen: e.chosen ?? null,
      // the full ranked candidate table — the spec's training pair.
      candidates: Array.isArray(e.candidates) ? e.candidates : [],
    },
    regime: { ...CANONICAL_REGIME },
  };
}

function normalizeVerdict(r) {
  if (typeof r.verdict === 'string') {
    const v = r.verdict.toLowerCase();
    if (v.includes('no-op') || v === 'noop') return 'no-op';
    if (v.includes('partial')) return 'partial';
    if (v.includes('broke') || v.includes('fail')) return 'broke';
    if (v.includes('ok') || v.includes('pass')) return 'ok';
  }
  // Some sweep schemas store distinct-DOM counts (n distinct over m values).
  // n<=1 across a modifier = NO-OP; otherwise treat as ok unless flagged.
  if (typeof r.distinct === 'number' && typeof r.total === 'number') {
    if (r.distinct <= 1) return 'no-op';
    if (r.distinct < r.total) return 'partial';
    return 'ok';
  }
  return 'ok';
}
