#!/usr/bin/env node
// feed-dataset.mjs — THE re-runnable feeder. Pulls the smart-layer collectors
// into the persistent dataset (datasets/smart-layer.dataset.jsonl).
//
// "make sure we are feeding into it": run this after any test / debug /
// conversion / audit session and the labeled dataset GROWS. Append + dedupe +
// regime-stamp (S11). No live-DB writes. No clock reads for ordering (the
// monotonic ingestIndex orders; --captured-at, if given, only stamps the
// manifest).
//
// Feeding sources (each --from-* is optional; combine freely):
//   --from-golden <path>        seed from a blessed golden snapshot
//                               (default audit-runs/golden-labels.v2.json).
//                               NO dev server needed — pure file read.
//   --from-audit                drive /audit?smartHachure=1 headless, pull
//                               window.__dd_decisionLog.get() (fresh rule-engine
//                               predictions). Needs dev server on :5182.
//   --from-conversion <path>    fold a saved __dd_decisionLog/__dd_conversionLog
//                               JSON export (conversion receipts + chip flips).
//   --from-input-pick <path>    fold a saved __dd_inputPickLog JSON export.
//   --from-fidelity-2d <path>   fold a 2D audit-style-sweep results.json
//                               (the breakage curriculum, stream 2).
//   --from-fidelity-3d <path>   fold a geometry-gauntlet gauntlet-report.json.
//   --from-ofat-2d <path>       fold a 2D OFAT live-findings.json (the
//                               TOGGLE-AWARE fidelity stream: one example per
//                               object×style×toggle×level cell — the toggle axis
//                               that the region-keyed fidelity-2d adapter was
//                               collapsing on dedupe).
//   --from-ofat-3d <path>       fold a 3D OFAT toggle-findings.json (one example
//                               per object×mode×toggle×level cell).
//   --ofat-2d-regime <r>        OPTIONAL S11 regime assertion for --from-ofat-2d.
//                               Pass 'canonical-eps3' ONLY when you KNOW the run
//                               is the canonical /audit catalog (ε=3.0). The
//                               findings file states no ε, so the default is the
//                               honest 'unknown' — never silently canonical.
//   --ofat-3d-regime <r>        same, for --from-ofat-3d.
//   --from-shade-fill <path>    fold a saved __dd_shadeFillLog JSON export
//                               (the 'shade-fill' tone-fill labels, rock F2).
//   --from-shape-snap <path>    fold a saved __dd_shapeSnapLog JSON export
//                               (the shape-snap evaluate/cycle/keep/revert
//                               training tuples, rock F3).
//   --from-desk-perf <path>     fold a populated-desk-battery perf-report.json
//                               (gap-hunt H6 — the interactivity-at-scale gate:
//                               one fidelity example per (N, gesture) + the
//                               cross-N drag-cost scaling bound).
//   --url <u>                   override the /audit URL for --from-audit.
//   --captured-at <ISO>         optional manifest timestamp (NOT read from clock).
//   --dry-run                   compute + print the diff, write NOTHING.
//
// Examples:
//   node tools/dataset/feed-dataset.mjs --from-golden audit-runs/golden-labels.v2.json
//   node tools/dataset/feed-dataset.mjs --from-audit
//   node tools/dataset/feed-dataset.mjs --from-golden audit-runs/golden-labels.v2.json --from-fidelity-3d /tmp/dd-gauntlet/gauntlet-report.json
//
// Offline ESM.

import fs from 'node:fs';
import path from 'node:path';
import {
  REPO_ROOT,
  DATASET_JSONL,
  MANIFEST_JSON,
  loadDataset,
  upsertExamples,
  writeDataset,
  writeManifest,
  goldenEntryToExample,
  decisionLogEntryToExample,
  conversionReceiptToExample,
  conversionCorrectionToExample,
  inputPickEntryToExample,
  fidelity2dRecordToExample,
  fidelity3dRecordToExample,
  ofat2dRecordToExample,
  ofat3dRecordToExample,
  ofatManualdrawRecordToExample,
  ofatUploadRecordToExample,
  shadeFillEntryToExample,
  shapeSnapEntryToExample,
  deskPerfReportToExamples,
} from './dataset-lib.mjs';

const DEFAULT_GOLDEN = path.join(REPO_ROOT, 'audit-runs', 'golden-labels.v2.json');
const DEFAULT_AUDIT_URL = 'http://localhost:5182/audit?smartHachure=1';

function parseArgs(argv) {
  const a = {
    fromGolden: null,
    fromAudit: false,
    fromConversion: null,
    fromInputPick: null,
    fromFidelity2d: null,
    fromFidelity3d: null,
    fromOfat2d: null,
    fromOfat3d: null,
    ofat2dRegime: null, // S11: only 'canonical-eps3' stamps canonical (opt-in)
    ofat3dRegime: null,
    fromShadeFill: null,
    fromShapeSnap: null,
    fromDeskPerf: null,
    url: DEFAULT_AUDIT_URL,
    capturedAt: null,
    dryRun: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--from-golden') a.fromGolden = argv[++i] ?? DEFAULT_GOLDEN;
    else if (k === '--from-audit') a.fromAudit = true;
    else if (k === '--from-conversion') a.fromConversion = argv[++i];
    else if (k === '--from-input-pick') a.fromInputPick = argv[++i];
    else if (k === '--from-fidelity-2d') a.fromFidelity2d = argv[++i];
    else if (k === '--from-fidelity-3d') a.fromFidelity3d = argv[++i];
    else if (k === '--from-ofat-2d') a.fromOfat2d = argv[++i];
    else if (k === '--from-ofat-3d') a.fromOfat3d = argv[++i];
    else if (k === '--from-ofat-manualdraw') a.fromOfatManualdraw = argv[++i];
    else if (k === '--from-ofat-upload') a.fromOfatUpload = argv[++i];
    else if (k === '--ofat-2d-regime') a.ofat2dRegime = argv[++i];
    else if (k === '--ofat-3d-regime') a.ofat3dRegime = argv[++i];
    else if (k === '--from-shade-fill') a.fromShadeFill = argv[++i];
    else if (k === '--from-shape-snap') a.fromShapeSnap = argv[++i];
    else if (k === '--from-desk-perf') a.fromDeskPerf = argv[++i];
    else if (k === '--url') a.url = argv[++i];
    else if (k === '--captured-at') a.capturedAt = argv[++i];
    else if (k === '--dry-run') a.dryRun = true;
    else {
      console.error(`Unknown arg: ${k}`);
      process.exit(2);
    }
  }
  // --from-golden with no path defaults to the blessed v2 seed.
  if (a.fromGolden === '') a.fromGolden = DEFAULT_GOLDEN;
  return a;
}

function readJson(p) {
  const abs = path.resolve(p);
  if (!fs.existsSync(abs)) {
    console.error(`FATAL: file not found: ${abs}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(abs, 'utf8'));
}

// ─── SOURCE PULLERS (each returns an array of canonical examples) ─────────────

function pullGolden(p) {
  const j = readJson(p);
  const entries = Array.isArray(j.entries) ? j.entries : [];
  console.log(`  golden: ${entries.length} entries from ${path.relative(REPO_ROOT, path.resolve(p))} (status: ${j.status ?? 'n/a'}, blessedBy: ${j.blessedBy ?? 'n/a'})`);
  return entries.map(goldenEntryToExample);
}

async function pullAudit(url) {
  // Reuse the same playwright the classifier tools use (lives outside this pkg).
  const { createRequire } = await import('node:module');
  const require = createRequire(import.meta.url);
  let chromium;
  try {
    ({ chromium } = require('/Users/sebs/Desktop/Projects/portfolio/tools/lab-screenshots/node_modules/playwright'));
  } catch {
    console.error('FATAL: playwright not found at the classifier-tools path. --from-audit needs it.');
    process.exit(1);
  }
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    page.on('pageerror', (err) => console.error(`[pageerror] ${err.message}`));
    console.log(`  audit: → ${url}`);
    await page.goto(url, { waitUntil: 'load', timeout: 60_000 });
    await page.waitForSelector('article[data-shape-id]', { timeout: 60_000 });
    await page.waitForFunction(
      () => typeof window.__dd_decisionLog?.get === 'function',
      { timeout: 30_000 },
    );
    // wait for the decision log to go quiet (entry count stable) — same idiom
    // as golden-snapshot.js.
    const POLL = 500, STABLE = 6, DEADLINE = Date.now() + 120_000;
    let last = -1, stable = 0;
    while (stable < STABLE) {
      if (Date.now() > DEADLINE) {
        console.error('FATAL: decision log never stabilized.');
        process.exit(1);
      }
      const n = await page.evaluate(() => window.__dd_decisionLog.get().length);
      if (n > 0 && n === last) stable += 1; else stable = 0;
      last = n;
      await page.waitForTimeout(POLL);
    }
    const raw = await page.evaluate(() => window.__dd_decisionLog.get());
    // The unified log carries shading + conversion + shade-fill + shape-snap
    // entries; split by entryType (shadeFillLog.ts / shapeSnapLog.ts wrap the
    // same window face, so their entries surface here too — without this split
    // their labels would evaporate, gap-hunt H9).
    const shading = raw.filter((e) => !e.entryType || e.entryType === 'shading');
    const conv = raw.filter((e) => e.entryType === 'conversion');
    const convCorr = raw.filter((e) => e.entryType === 'conversion-correction');
    const shadeFill = raw.filter((e) => e.entryType === 'shade-fill');
    const shapeSnap = raw.filter((e) => e.entryType === 'shape-snap');
    console.log(`  audit: ${raw.length} raw log entries (${shading.length} shading · ${conv.length} conversion · ${convCorr.length} corrections · ${shadeFill.length} shade-fill · ${shapeSnap.length} shape-snap)`);
    return [
      ...shading.map(decisionLogEntryToExample),
      ...conv.map(conversionReceiptToExample),
      ...convCorr.map(conversionCorrectionToExample),
      ...shadeFill.map((e, i) => shadeFillEntryToExample(e, i)),
      ...shapeSnap.map((e, i) => shapeSnapEntryToExample(e, i)),
    ];
  } finally {
    await browser.close();
  }
}

function pullConversionExport(p) {
  const j = readJson(p);
  // accept either {entries:[...]} or a raw array
  const rows = Array.isArray(j) ? j : (j.entries ?? j.log ?? []);
  const examples = [];
  for (const e of rows) {
    if (e.entryType === 'conversion-correction') examples.push(conversionCorrectionToExample(e));
    else if (e.entryType === 'conversion') examples.push(conversionReceiptToExample(e));
    else if (e.entryType === 'shading' || e.role) examples.push(decisionLogEntryToExample(e));
  }
  console.log(`  conversion-export: ${examples.length} examples from ${rows.length} rows`);
  return examples;
}

function pullInputPick(p) {
  const j = readJson(p);
  const rows = Array.isArray(j) ? j : (j.entries ?? j.log ?? []);
  console.log(`  input-pick: ${rows.length} rows`);
  return rows.map((e, i) => inputPickEntryToExample(e, i));
}

function pullFidelity2d(p) {
  const j = readJson(p);
  const rows = Array.isArray(j) ? j : (j.records ?? j.results ?? []);
  console.log(`  fidelity-2d: ${rows.length} records`);
  return rows.map(fidelity2dRecordToExample);
}

function pullFidelity3d(p) {
  const j = readJson(p);
  const rows = Array.isArray(j) ? j : (j.records ?? j.checks ?? j.results ?? []);
  console.log(`  fidelity-3d: ${rows.length} records`);
  return rows.map((r, i) => fidelity3dRecordToExample(r, i));
}

// OFAT (one-factor-at-a-time) findings → toggle-aware fidelity examples. The 2D
// file wraps its cells under `rows` (alongside `breaks`/`summary`); the 3D file
// is a raw array. Both: ONE example per OFAT cell, exampleId carries the full
// (object × … × toggle × level) coordinate so the toggle axis never collapses.
function resolveOfatRegimeFlag(flag) {
  if (flag == null) return { assertCanonical: false };
  const f = String(flag).toLowerCase();
  if (f === 'canonical-eps3' || f === 'canonical' || f === 'eps3') return { assertCanonical: true };
  if (f === 'unknown') return { assertCanonical: false };
  console.error(`Unknown --ofat-*-regime value: ${flag} (use 'canonical-eps3' or 'unknown')`);
  process.exit(2);
}

function pullOfat2d(p, regimeFlag) {
  const j = readJson(p);
  const rows = Array.isArray(j) ? j : (j.rows ?? j.cells ?? j.findings ?? j.results ?? []);
  const opts = resolveOfatRegimeFlag(regimeFlag);
  console.log(`  ofat-2d: ${rows.length} cells${opts.assertCanonical ? ' (regime asserted canonical-eps3)' : ' (regime: unknown — file states no ε, S11 honest default)'}`);
  return rows.map((r, i) => ofat2dRecordToExample(r, i, opts));
}

function pullOfat3d(p, regimeFlag) {
  const j = readJson(p);
  const rows = Array.isArray(j) ? j : (j.rows ?? j.cells ?? j.findings ?? j.results ?? []);
  const opts = resolveOfatRegimeFlag(regimeFlag);
  console.log(`  ofat-3d: ${rows.length} cells${opts.assertCanonical ? ' (regime asserted canonical-eps3)' : ' (regime: unknown — file states no ε, S11 honest default)'}`);
  return rows.map((r, i) => ofat3dRecordToExample(r, i, opts));
}

function pullOfatManualdraw(p, regimeFlag) {
  const j = readJson(p);
  const rows = Array.isArray(j) ? j : (j.rows ?? j.cells ?? j.findings ?? j.results ?? []);
  const opts = resolveOfatRegimeFlag(regimeFlag);
  console.log(`  ofat-manualdraw: ${rows.length} cells (real hand-drawn draw→2D→3D path, vision-read)`);
  return rows.map((r, i) => ofatManualdrawRecordToExample(r, i, opts));
}

function pullOfatUpload(p, regimeFlag) {
  const j = readJson(p);
  const rows = Array.isArray(j) ? j : (j.rows ?? j.cells ?? j.findings ?? j.results ?? []);
  const opts = resolveOfatRegimeFlag(regimeFlag);
  console.log(`  ofat-upload: ${rows.length} cells (real svg-upload pipeline, vision-read)`);
  return rows.map((r, i) => ofatUploadRecordToExample(r, i, opts));
}

// A __dd_shadeFillLog / __dd_shapeSnapLog export is a raw array (the get()
// snapshot), or wrapped {entries|log:[...]}. Both pullers tolerate either, and
// also a unified __dd_decisionLog export — they filter by entryType so a single
// dump of the whole log can be fed through either flag safely.
function pullShadeFill(p) {
  const j = readJson(p);
  let rows = Array.isArray(j) ? j : (j.entries ?? j.log ?? []);
  rows = rows.filter((e) => !e.entryType || e.entryType === 'shade-fill');
  console.log(`  shade-fill: ${rows.length} rows`);
  return rows.map((e, i) => shadeFillEntryToExample(e, i));
}

function pullShapeSnap(p) {
  const j = readJson(p);
  let rows = Array.isArray(j) ? j : (j.entries ?? j.log ?? []);
  rows = rows.filter((e) => !e.entryType || e.entryType === 'shape-snap');
  console.log(`  shape-snap: ${rows.length} rows`);
  return rows.map((e, i) => shapeSnapEntryToExample(e, i));
}

function pullDeskPerf(p) {
  const report = readJson(p);
  const examples = deskPerfReportToExamples(report);
  const ns = (report.runs ?? []).map((r) => r.n).join(',');
  console.log(`  desk-perf: ${examples.length} examples from runs [${ns}]` +
    (report.dragScaling ? ` (+ scaling bound: ${report.dragScaling.verdict ?? (report.dragScaling.scalesWithN ? 'CLIFF' : 'BOUNDED')})` : ''));
  return examples;
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv);

  const requested =
    !!args.fromGolden || args.fromAudit || !!args.fromConversion ||
    !!args.fromInputPick || !!args.fromFidelity2d || !!args.fromFidelity3d ||
    !!args.fromOfat2d || !!args.fromOfat3d ||
    !!args.fromOfatManualdraw || !!args.fromOfatUpload ||
    !!args.fromShadeFill || !!args.fromShapeSnap || !!args.fromDeskPerf;
  if (!requested) {
    console.error('No source flag given. See header for --from-* options.');
    console.error('Quick seed:  node tools/dataset/feed-dataset.mjs --from-golden audit-runs/golden-labels.v2.json');
    process.exit(2);
  }

  const byId = loadDataset();
  const before = byId.size;
  console.log(`Loaded ${before} existing examples from ${path.relative(REPO_ROOT, DATASET_JSONL)}`);

  const feedingSources = [];
  let batch = [];

  if (args.fromGolden) { batch = batch.concat(pullGolden(args.fromGolden)); feedingSources.push('golden'); }
  if (args.fromAudit) { batch = batch.concat(await pullAudit(args.url)); feedingSources.push('audit-decisionlog'); }
  if (args.fromConversion) { batch = batch.concat(pullConversionExport(args.fromConversion)); feedingSources.push('conversion'); }
  if (args.fromInputPick) { batch = batch.concat(pullInputPick(args.fromInputPick)); feedingSources.push('input-pick'); }
  if (args.fromFidelity2d) { batch = batch.concat(pullFidelity2d(args.fromFidelity2d)); feedingSources.push('fidelity-2d'); }
  if (args.fromFidelity3d) { batch = batch.concat(pullFidelity3d(args.fromFidelity3d)); feedingSources.push('fidelity-3d'); }
  if (args.fromOfat2d) { batch = batch.concat(pullOfat2d(args.fromOfat2d, args.ofat2dRegime)); feedingSources.push('ofat-2d'); }
  if (args.fromOfat3d) { batch = batch.concat(pullOfat3d(args.fromOfat3d, args.ofat3dRegime)); feedingSources.push('ofat-3d'); }
  if (args.fromOfatManualdraw) { batch = batch.concat(pullOfatManualdraw(args.fromOfatManualdraw, args.ofat3dRegime)); feedingSources.push('ofat-manualdraw'); }
  if (args.fromOfatUpload) { batch = batch.concat(pullOfatUpload(args.fromOfatUpload, args.ofat3dRegime)); feedingSources.push('ofat-upload'); }
  if (args.fromShadeFill) { batch = batch.concat(pullShadeFill(args.fromShadeFill)); feedingSources.push('shade-fill'); }
  if (args.fromShapeSnap) { batch = batch.concat(pullShapeSnap(args.fromShapeSnap)); feedingSources.push('shape-snap'); }
  if (args.fromDeskPerf) { batch = batch.concat(pullDeskPerf(args.fromDeskPerf)); feedingSources.push('desk-perf'); }

  const { added, updated } = upsertExamples(byId, batch);

  if (args.dryRun) {
    console.log(`\n[DRY RUN] would add ${added}, update ${updated}. Wrote nothing.`);
    console.log(`[DRY RUN] dataset would total ${byId.size} examples.`);
    return;
  }

  const total = writeDataset(byId);
  const manifest = writeManifest(byId, { capturedAt: args.capturedAt, lastFeedSources: feedingSources });

  console.log(`\n✓ Fed batch of ${batch.length} → added ${added}, updated ${updated} (dedupe: ${batch.length - added - updated} were no-change re-feeds).`);
  console.log(`✓ Dataset now ${total} examples → ${path.relative(REPO_ROOT, DATASET_JSONL)}`);
  console.log(`✓ Manifest → ${path.relative(REPO_ROOT, MANIFEST_JSON)}`);
  console.log(`  by source:  ${JSON.stringify(manifest.countsBySource)}`);
  console.log(`  by regime:  ${JSON.stringify(manifest.countsByRegime)}  (S11 — >1 key = mixed regimes, explicit decision needed)`);
  console.log(`  ground-truth (human-blessed): ${manifest.groundTruthCount}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
