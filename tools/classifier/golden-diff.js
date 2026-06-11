#!/usr/bin/env node
// golden-diff.js — QW-3 regression gate over two golden snapshots.
//
// Loads two golden JSON files (baseline, candidate), compares EVERY entry —
// per feedback_no_sampled_verification_claims, the full per-item table is
// printed, never a sample — and reports:
//   · role flips                       → gate FAILURE (exit 1)
//   · entries missing from candidate   → gate FAILURE (exit 1; a vanished
//     region is a role flip to "nothing" — silent set drift defeats the gate)
//   · entries new in candidate         → gate FAILURE (exit 1; same logic)
//   · confidence deltas > 0.1          → flagged in table (not gating)
//
// Per 24-research §5 ML-Test-Score gate 1: "no unblessed role flips on the
// golden set per classifier change." Unblessed flips still demand explanation.
//
// Usage:
//   node tools/classifier/golden-diff.js <baseline.json> <candidate.json>

// ESM — repo package.json sets "type": "module".
import fs from 'node:fs';

const CONF_DELTA_THRESHOLD = 0.1;

// ── defensive field accessors (QW-1 entry shape, tolerant of naming) ──────
const roleOf = (e) => e.winner ?? e.role ?? '(none)';
const confOf = (e) => {
  const c = e.cappedConfidence ?? e.confidence;
  return typeof c === 'number' ? c : null;
};
const entryKey = (e) => `${e.svgHash} ${e.regionPath}`;
const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

function load(file) {
  const json = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!Array.isArray(json.entries)) {
    console.error(`FATAL: ${file} has no "entries" array — not a golden snapshot file.`);
    process.exit(2);
  }
  const byKey = new Map();
  for (const e of json.entries) byKey.set(entryKey(e), e); // dedupe: last wins
  return { json, byKey };
}

const fmtConf = (c) => (c === null ? '   —' : c.toFixed(2).padStart(4));
const pad = (s, n) => String(s).padEnd(n).slice(0, Math.max(n, String(s).length));

function main() {
  const [baseFile, candFile] = process.argv.slice(2);
  if (!baseFile || !candFile) {
    console.error('Usage: node tools/classifier/golden-diff.js <baseline.json> <candidate.json>');
    process.exit(2);
  }

  const base = load(baseFile);
  const cand = load(candFile);

  console.log(`baseline : ${baseFile} (capturedAt ${base.json.capturedAt ?? '?'}, ${base.byKey.size} entries)`);
  console.log(`candidate: ${candFile} (capturedAt ${cand.json.capturedAt ?? '?'}, ${cand.byKey.size} entries)`);
  console.log('');

  // Union of keys — EVERY entry from both sides is compared and printed.
  const allKeys = [...new Set([...base.byKey.keys(), ...cand.byKey.keys()])].sort(cmp);

  const rows = [];
  let flips = 0;
  let missing = 0;
  let added = 0;
  let confDeltas = 0;

  for (const key of allKeys) {
    const b = base.byKey.get(key);
    const c = cand.byKey.get(key);
    const [svgHash, regionPath] = [
      (b ?? c).svgHash,
      (b ?? c).regionPath,
    ];

    let status = 'ok';
    let dConf = null;
    if (b && !c) {
      status = 'MISSING';
      missing += 1;
    } else if (!b && c) {
      status = 'ADDED';
      added += 1;
    } else {
      if (roleOf(b) !== roleOf(c)) {
        status = 'FLIP';
        flips += 1;
      }
      const cb = confOf(b);
      const cc = confOf(c);
      if (cb !== null && cc !== null) {
        dConf = cc - cb;
        if (Math.abs(dConf) > CONF_DELTA_THRESHOLD) {
          confDeltas += 1;
          if (status === 'ok') status = 'Δconf';
        }
      }
    }

    rows.push({
      svgHash,
      regionPath,
      roleBase: b ? roleOf(b) : '—',
      roleCand: c ? roleOf(c) : '—',
      confBase: b ? confOf(b) : null,
      confCand: c ? confOf(c) : null,
      dConf,
      status,
    });
  }

  // Full per-item table — every compared entry, no sampling.
  const W = { hash: 14, path: 34, role: 18, conf: 5, d: 7, status: 8 };
  console.log(
    [
      pad('svgHash', W.hash),
      pad('regionPath', W.path),
      pad('role:base', W.role),
      pad('role:cand', W.role),
      pad('confB', W.conf),
      pad('confC', W.conf),
      pad('Δconf', W.d),
      'status',
    ].join('  '),
  );
  console.log('-'.repeat(W.hash + W.path + W.role * 2 + W.conf * 2 + W.d + W.status + 14));
  for (const r of rows) {
    console.log(
      [
        pad(r.svgHash, W.hash),
        pad(r.regionPath, W.path),
        pad(r.roleBase, W.role),
        pad(r.roleCand, W.role),
        fmtConf(r.confBase).padStart(W.conf),
        fmtConf(r.confCand).padStart(W.conf),
        (r.dConf === null ? '—' : (r.dConf >= 0 ? '+' : '') + r.dConf.toFixed(2)).padStart(W.d),
        r.status,
      ].join('  '),
    );
  }

  console.log('');
  console.log(`compared : ${allKeys.length} entries (union of both files)`);
  console.log(`flips    : ${flips}`);
  console.log(`missing  : ${missing} (in baseline, gone from candidate)`);
  console.log(`added    : ${added} (new in candidate, absent from baseline)`);
  console.log(`|Δconf| > ${CONF_DELTA_THRESHOLD}: ${confDeltas} (flagged, non-gating)`);

  if (flips + missing + added > 0) {
    console.error('\nGATE: FAIL — role flips / entry-set drift on the golden set. Explain or re-bless before shipping.');
    process.exit(1);
  }
  console.log('\nGATE: PASS — no role flips, entry set identical.');
}

main();
