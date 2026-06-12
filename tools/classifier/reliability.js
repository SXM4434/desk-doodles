#!/usr/bin/env node
// reliability.js — QW-5 confidence-calibration measurement (reliability table + ECE).
//
// Answers "does 0.7 confidence MEAN 70% correct?" — the prerequisite for
// T2-a Platt fitting (docs/design/smart-system-build-plan.md §2 06-12 slice;
// docs/research/24-research-classifier-improvements.md §7.1 QW-5).
//
// Method (Guo et al., *On Calibration of Modern Neural Networks*, ICML 2017,
// arXiv:1706.04599 — reliability diagrams + ECE):
//   1. Load the blessed golden baseline (audit-runs/golden-labels.v2.json) —
//      the ground-truth role per (svgHash, regionPath).
//   2. Re-run the classifier over the 197-shape catalog: drive
//      /audit?smartHachure=1 headless (same harness pattern as
//      golden-snapshot.js), pull window.__dd_decisionLog.get().
//      (Or skip the browser with --from <snapshot.json>.)
//   3. A fresh decision is CORRECT iff its role matches the golden role for
//      the same (svgHash, regionPath). Manual-override entries are excluded —
//      they are human labels at confidence 1.0, not classifier predictions.
//   4. Bin by capped confidence (equal-width bins over [0,1]); per bin print
//      count, accuracy, mean confidence, gap, mean rawScore, mean margin.
//   5. ECE = Σ_b (n_b/N) · |acc_b − meanConf_b|  (+ MCE = max_b of the same).
//
// Honest caveat (printed in the epilogue): golden v2 labels originated as
// classifier output blessed by Sebs's eyeball, so accuracy against v2 is
// upper-biased for unchanged code paths. The table still answers the QW-5
// question — whether the capped rule-sum tracks correctness as a probability
// — and any mismatch rows are real drift since the v2 capture. Per the build
// plan, T2-a additionally fits on the v1→v2 flip set for error examples.
//
// Offline tooling — node script, run manually. NOT part of the app bundle.
// (Date use is allowed here; the no-Date rule applies to render paths only.)
//
// Usage:
//   node tools/classifier/reliability.js
//   node tools/classifier/reliability.js --baseline audit-runs/golden-labels.v2.json
//   node tools/classifier/reliability.js --from audit-runs/some-candidate.json
//   node tools/classifier/reliability.js --bins 10 --url http://localhost:5182/audit?smartHachure=1
//   node tools/classifier/reliability.js --out audit-runs/reliability.v2.json --screenshot /tmp/audit.png

// ESM — repo package.json sets "type": "module"; playwright lives outside
// this package, so pull it via createRequire from its absolute path.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const DEFAULT_BASELINE = path.join(REPO_ROOT, 'audit-runs', 'golden-labels.v2.json');
const DEFAULT_URL = 'http://localhost:5182/audit?smartHachure=1';
const DEFAULT_BINS = 10;

// Same render-quiet protocol as golden-snapshot.js.
const POLL_MS = 500;
const STABLE_POLLS = 6;
const MAX_WAIT_MS = 120_000;

// ── defensive field accessors (QW-1 entry shape, tolerant of naming) ──────
const roleOf = (e) => e.winner ?? e.role ?? '(none)';
const confOf = (e) => {
  const c = e.cappedConfidence ?? e.confidence;
  return typeof c === 'number' ? c : null;
};
const rawOf = (e) => (typeof e.rawScore === 'number' ? e.rawScore : null);
const marginOf = (e) => (typeof e.margin === 'number' ? e.margin : null);
const entryKey = (e) => `${e.svgHash} ${e.regionPath}`;
const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

function parseArgs(argv) {
  const args = {
    baseline: DEFAULT_BASELINE,
    from: null,
    url: DEFAULT_URL,
    bins: DEFAULT_BINS,
    out: null,
    screenshot: null,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--baseline') args.baseline = path.resolve(argv[++i]);
    else if (a === '--from') args.from = path.resolve(argv[++i]);
    else if (a === '--url') args.url = argv[++i];
    else if (a === '--bins') args.bins = Number(argv[++i]);
    else if (a === '--out') args.out = path.resolve(argv[++i]);
    else if (a === '--screenshot') args.screenshot = path.resolve(argv[++i]);
    else {
      console.error(`Unknown arg: ${a}`);
      process.exit(2);
    }
  }
  if (!Number.isInteger(args.bins) || args.bins < 2 || args.bins > 100) {
    console.error(`--bins must be an integer in [2,100], got: ${args.bins}`);
    process.exit(2);
  }
  return args;
}

function loadGolden(file, label) {
  const json = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!Array.isArray(json.entries)) {
    console.error(`FATAL: ${file} has no "entries" array — not a golden snapshot file.`);
    process.exit(2);
  }
  const byKey = new Map();
  for (const e of json.entries) byKey.set(entryKey(e), e); // dedupe: last wins
  console.log(
    `${label}: ${file} (capturedAt ${json.capturedAt ?? '?'}, ${byKey.size} entries` +
      `${json.status ? `, status ${json.status}` : ''})`,
  );
  return { json, byKey };
}

/** Drive /audit headless and return deduped fresh decision-log entries. */
async function captureFreshDecisions(url, screenshotPath) {
  const { chromium } = require('/Users/sebs/Desktop/Projects/portfolio/tools/lab-screenshots/node_modules/playwright');
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    page.on('pageerror', (err) => console.error(`[pageerror] ${err.message}`));

    console.log(`→ ${url}`);
    await page.goto(url, { waitUntil: 'load', timeout: 60_000 });

    // 1. Audit grid present.
    await page.waitForSelector('article[data-shape-id]', { timeout: 60_000 });

    // 2. QW-1 decision-log API present.
    try {
      await page.waitForFunction(
        () => typeof window.__dd_decisionLog?.get === 'function',
        { timeout: 30_000 },
      );
    } catch {
      console.error(
        'FATAL: window.__dd_decisionLog.get() not found.\n' +
        'The QW-1 decision-log collector has not landed (or smartHachure=1 is off).',
      );
      process.exit(1);
    }

    // 3. Wait for the log to go quiet: entry count stable across consecutive polls.
    const deadline = Date.now() + MAX_WAIT_MS;
    let lastCount = -1;
    let stable = 0;
    while (stable < STABLE_POLLS) {
      if (Date.now() > deadline) {
        console.error(`FATAL: decision log never stabilized within ${MAX_WAIT_MS}ms (last count: ${lastCount}).`);
        process.exit(1);
      }
      const count = await page.evaluate(() => window.__dd_decisionLog.get().length);
      if (count > 0 && count === lastCount) stable += 1;
      else stable = 0;
      lastCount = count;
      await page.waitForTimeout(POLL_MS);
    }

    const shapeCount = await page.evaluate(
      () => document.querySelectorAll('article[data-shape-id]').length,
    );
    const rawEntries = await page.evaluate(() => window.__dd_decisionLog.get());
    console.log(`Render quiet: ${shapeCount} shape cells · ${rawEntries.length} raw log entries.`);
    if (shapeCount !== 197) {
      console.warn(`WARNING: expected 197 audit shapes, found ${shapeCount}. Measurement proceeds, but investigate.`);
    }

    if (screenshotPath) {
      fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
      await page.screenshot({ path: screenshotPath, fullPage: false });
      console.log(`Screenshot (visual receipt): ${screenshotPath}`);
    }

    // One row per (svgHash, regionPath): keep the LAST entry (latest decision
    // wins) — identical dedupe to golden-snapshot.js.
    const byKey = new Map();
    for (const e of rawEntries) byKey.set(entryKey(e), e);
    return byKey;
  } finally {
    await browser.close();
  }
}

function main_table(joined, bins) {
  // Equal-width bins over [0,1]; conf 1.0 lands in the top bin.
  const binOf = (c) => Math.min(bins - 1, Math.floor(c * bins));
  const stats = Array.from({ length: bins }, () => ({
    n: 0, correct: 0, sumConf: 0, sumRaw: 0, nRaw: 0, sumMargin: 0, nMargin: 0,
  }));

  for (const { conf, correct, raw, margin } of joined) {
    const b = stats[binOf(conf)];
    b.n += 1;
    b.correct += correct ? 1 : 0;
    b.sumConf += conf;
    if (raw !== null) { b.sumRaw += raw; b.nRaw += 1; }
    if (margin !== null) { b.sumMargin += margin; b.nMargin += 1; }
  }

  const N = joined.length;
  let ece = 0;
  let mce = 0;
  const rows = stats.map((b, i) => {
    const lo = i / bins;
    const hi = (i + 1) / bins;
    const range = `[${lo.toFixed(2)},${hi.toFixed(2)}${i === bins - 1 ? ']' : ')'}`;
    if (b.n === 0) {
      return { range, n: 0, acc: null, meanConf: null, gap: null, meanRaw: null, meanMargin: null };
    }
    const acc = b.correct / b.n;
    const meanConf = b.sumConf / b.n;
    const gap = acc - meanConf;
    ece += (b.n / N) * Math.abs(gap);
    mce = Math.max(mce, Math.abs(gap));
    return {
      range, n: b.n, acc, meanConf, gap,
      meanRaw: b.nRaw ? b.sumRaw / b.nRaw : null,
      meanMargin: b.nMargin ? b.sumMargin / b.nMargin : null,
    };
  });
  return { rows, ece, mce, N };
}

function main() {
  return run().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

async function run() {
  const args = parseArgs(process.argv);

  const golden = loadGolden(args.baseline, 'baseline ');

  let freshByKey;
  if (args.from) {
    const cand = loadGolden(args.from, 'candidate');
    freshByKey = cand.byKey;
  } else {
    freshByKey = await captureFreshDecisions(args.url, args.screenshot);
    console.log(`candidate: live re-run (${freshByKey.size} deduped entries)`);
  }
  console.log('');

  // ── join fresh decisions against golden ground truth ────────────────────
  const joined = [];
  const mismatches = [];
  let overridden = 0;
  let noConf = 0;
  let addedKeys = 0;
  for (const [key, e] of [...freshByKey.entries()].sort((a, b) => cmp(a[0], b[0]))) {
    const g = golden.byKey.get(key);
    if (!g) { addedKeys += 1; continue; } // not in golden — set drift, excluded
    if (e.classifiedBy === 'manual-override') { overridden += 1; continue; }
    const conf = confOf(e);
    if (conf === null) { noConf += 1; continue; }
    const correct = roleOf(e) === roleOf(g);
    if (!correct) mismatches.push({ key, fresh: e, golden: g });
    joined.push({ conf, correct, raw: rawOf(e), margin: marginOf(e) });
  }
  const missingKeys = [...golden.byKey.keys()].filter((k) => !freshByKey.has(k)).length;

  if (addedKeys + missingKeys > 0) {
    console.warn(
      `WARNING: entry-set drift vs baseline — ${missingKeys} golden entries missing from the run, ` +
      `${addedKeys} run entries absent from golden (excluded from bins). Run golden-diff for the per-item table.`,
    );
  }

  // Mismatch rows: real drift since the v2 capture — print EVERY one
  // (per feedback_no_sampled_verification_claims, no sampling).
  if (mismatches.length > 0) {
    console.log(`role mismatches vs golden (${mismatches.length}) — every row:`);
    for (const m of mismatches) {
      console.log(
        `  ${m.key}  golden=${roleOf(m.golden)}  fresh=${roleOf(m.fresh)}  conf=${confOf(m.fresh)?.toFixed(2)}`,
      );
    }
    console.log('');
  }

  // ── reliability table + ECE ──────────────────────────────────────────────
  const { rows, ece, mce, N } = main_table(joined, args.bins);
  const overallAcc = N ? joined.filter((j) => j.correct).length / N : 0;

  const pad = (s, n) => String(s).padStart(n);
  const fmt = (v, digits = 3) => (v === null ? '—'.padStart(5) : v.toFixed(digits));
  console.log(`reliability table (${args.bins} equal-width confidence bins, ${N} classifier decisions):`);
  console.log('');
  console.log(
    [
      'confidence bin', pad('n', 5), pad('accuracy', 9), pad('meanConf', 9),
      pad('gap', 7), pad('meanRaw', 8), pad('meanMargin', 11),
    ].join('  '),
  );
  console.log('-'.repeat(72));
  for (const r of rows) {
    console.log(
      [
        r.range.padEnd(14),
        pad(r.n, 5),
        pad(r.acc === null ? '—' : r.acc.toFixed(3), 9),
        pad(r.meanConf === null ? '—' : r.meanConf.toFixed(3), 9),
        pad(r.gap === null ? '—' : (r.gap >= 0 ? '+' : '') + r.gap.toFixed(3), 7),
        pad(r.meanRaw === null ? '—' : r.meanRaw.toFixed(2), 8),
        pad(r.meanMargin === null ? '—' : r.meanMargin.toFixed(2), 11),
      ].join('  '),
    );
  }
  console.log('');
  console.log(`decisions binned     : ${N} (excluded: ${overridden} manual-override · ${noConf} no-confidence · ${addedKeys} not-in-golden)`);
  console.log(`overall accuracy     : ${overallAcc.toFixed(4)}`);
  console.log(`ECE  Σ(n_b/N)·|gap_b|: ${ece.toFixed(4)}`);
  console.log(`MCE        max|gap_b|: ${mce.toFixed(4)}`);

  // The QW-5 question, answered directly from the bin containing 0.7.
  const probe = rows[Math.min(args.bins - 1, Math.floor(0.7 * args.bins))];
  console.log('');
  if (probe && probe.n > 0) {
    console.log(
      `"does 0.7 confidence mean 70% correct?" → bin ${probe.range}: n=${probe.n}, ` +
      `accuracy ${(probe.acc * 100).toFixed(1)}% vs stated ~${(probe.meanConf * 100).toFixed(1)}% ` +
      `(gap ${(probe.gap >= 0 ? '+' : '')}${(probe.gap * 100).toFixed(1)} pts).`,
    );
  } else {
    console.log(`"does 0.7 confidence mean 70% correct?" → no decisions land in the bin containing 0.7.`);
  }
  console.log(
    'Caveat: golden v2 labels are blessed classifier output, so accuracy here is upper-biased\n' +
    'for unchanged code; mismatch rows above are real drift. ECE >> 0 with high accuracy means the\n' +
    'capped rule-sum is NOT a probability — exactly what T2-a Platt scaling fixes (fit-platt.js, next).',
  );

  if (args.out) {
    const receipt = {
      measuredAt: new Date().toISOString(),
      baseline: args.baseline,
      candidate: args.from ?? 'live re-run',
      bins: args.bins,
      decisionsBinned: N,
      excluded: { manualOverride: overridden, noConfidence: noConf, notInGolden: addedKeys, missingFromRun: missingKeys },
      overallAccuracy: overallAcc,
      ece,
      mce,
      mismatches: mismatches.map((m) => ({ key: m.key, golden: roleOf(m.golden), fresh: roleOf(m.fresh) })),
      table: rows,
    };
    fs.mkdirSync(path.dirname(args.out), { recursive: true });
    fs.writeFileSync(args.out, JSON.stringify(receipt, null, 2) + '\n');
    console.log(`\n✓ Wrote reliability receipt → ${args.out}`);
  }
}

main();
