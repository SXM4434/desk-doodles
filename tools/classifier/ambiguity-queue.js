#!/usr/bin/env node
// ambiguity-queue.js — QW-4 uncertainty-sampling labeling queue.
//
// Loads a golden snapshot JSON, ranks entries by ASCENDING margin
// (best − second-best raw score; Settles 2009 §3.1 margin sampling — per
// 24-research §4, margin on raw uncapped sums is the robust choice today),
// and prints the top 20: the regions the classifier is least sure about.
// This is the labeling priority list — Sebs override-tags these in /audit,
// highest label-value per minute of his time (E-4 loop).
//
// Margin source, in preference order:
//   1. entry.margin              (QW-2 field)
//   2. computed from per-role raw sums (best − secondBest)
//   3. rawScore / confidence     (least-confidence fallback — flagged)
//
// Entries with classifiedBy === 'manual-override' are excluded: they are
// already labeled, querying them wastes oracle time.
//
// Usage:
//   node tools/classifier/ambiguity-queue.js audit-runs/golden-labels.v1.json
//   node tools/classifier/ambiguity-queue.js audit-runs/golden-labels.v1.json --top 20

// ESM — repo package.json sets "type": "module".
import fs from 'node:fs';

const roleOf = (e) => e.winner ?? e.role ?? '(none)';
const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

/** Per-role raw sums object, tolerant of QW-1 field naming. */
function sumsOf(e) {
  const s = e.rawSums ?? e.perRoleSums ?? e.roleSums ?? e.scores;
  return s && typeof s === 'object' ? s : null;
}

/** Returns { margin, source } — see header for preference order. */
function marginOf(e) {
  if (typeof e.margin === 'number') return { margin: e.margin, source: 'margin' };
  const sums = sumsOf(e);
  if (sums) {
    const values = Object.values(sums).filter((v) => typeof v === 'number').sort((a, b) => b - a);
    if (values.length >= 1) {
      return { margin: values[0] - (values[1] ?? 0), source: 'sums' };
    }
  }
  const fallback = e.rawScore ?? e.cappedConfidence ?? e.confidence;
  if (typeof fallback === 'number') return { margin: fallback, source: 'least-conf' };
  return { margin: null, source: 'none' };
}

function main() {
  const args = process.argv.slice(2);
  const file = args.find((a) => !a.startsWith('--'));
  const topIdx = args.indexOf('--top');
  const top = topIdx >= 0 ? Number(args[topIdx + 1]) : 20;
  if (!file || !Number.isFinite(top) || top < 1) {
    console.error('Usage: node tools/classifier/ambiguity-queue.js <golden.json> [--top 20]');
    process.exit(2);
  }

  const json = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!Array.isArray(json.entries)) {
    console.error(`FATAL: ${file} has no "entries" array — not a golden snapshot file.`);
    process.exit(2);
  }

  const overridden = json.entries.filter((e) => e.classifiedBy === 'manual-override').length;
  const candidates = json.entries
    .filter((e) => e.classifiedBy !== 'manual-override')
    .map((e) => ({ e, ...marginOf(e) }))
    .filter((r) => r.margin !== null);

  const noMargin = json.entries.length - overridden - candidates.length;

  // Ascending margin = most ambiguous first; deterministic tiebreak on key.
  candidates.sort(
    (a, b) =>
      a.margin - b.margin ||
      cmp(a.e.svgHash, b.e.svgHash) ||
      cmp(a.e.regionPath, b.e.regionPath),
  );

  const queue = candidates.slice(0, top);
  const sources = new Set(queue.map((r) => r.source));

  console.log(`source   : ${file} (capturedAt ${json.capturedAt ?? '?'})`);
  console.log(`entries  : ${json.entries.length} total · ${overridden} already overridden (excluded) · ${noMargin} without margin signal (excluded)`);
  console.log(`ranking  : ascending margin (${[...sources].join(', ') || 'n/a'})`);
  if (sources.has('least-conf')) {
    console.warn('WARNING: some rows fall back to least-confidence (no margin/sums field) — land QW-2 for true margins.');
  }
  console.log('');

  const pad = (s, n) => String(s).padEnd(n);
  console.log(
    [
      pad('#', 3),
      pad('svgHash', 14),
      pad('regionPath', 34),
      pad('role', 18),
      pad('margin', 7),
      'firedRules',
    ].join('  '),
  );
  console.log('-'.repeat(110));
  queue.forEach((r, i) => {
    console.log(
      [
        pad(i + 1, 3),
        pad(r.e.svgHash, 14),
        pad(r.e.regionPath, 34),
        pad(roleOf(r.e), 18),
        pad(r.margin.toFixed(3), 7),
        (r.e.firedRules ?? []).join(', ') || '(none)',
      ].join('  '),
    );
  });

  console.log('');
  console.log(`Next: open /audit?smartHachure=1, find these ${queue.length} regions, right-click → tag the correct role.`);
  console.log('Each tag = one labeled example for calibration (QW-5) + weight fitting (T2-b).');
}

main();
