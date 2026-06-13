// INDEPENDENT adversarial slab verifier driver. Drives verify-slab-indep.html
// headless, prints PER-MATERIAL PER-ANGLE table (never pooled/sampled-and-claim).
//
//   node tools/3d/verify-slab-indep.mjs
//
// Fixture: literal BoxGeometry slab (broad flat coplanar faces) + product
// extrude-rect parity board. Adversarial angles: LOW-elevation oblique (6/12°)
// + mids (22/35°) × azimuths that put the front flat face in the sheen lobe.
// GATES (ink-black policy, flat-face warmth bound):
//   warmth (lit median r−b)  < 18
//   localwarm (worst broad warm bucket r−b) < 18
//   value (lit lum)  < 128  (specular-sheet exemption: real highlight + dark body)
//   form (spread)    ≥ 8    (anti flat-black blob)
//   real (object px) > 3000
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('/tmp/dd-pp/node_modules/playwright');

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5182/tools/3d/verify-slab-indep.html';
const OUT_DIR = '/tmp/dd-indep';
mkdirSync(OUT_DIR, { recursive: true });

const PRESETS = ['ink', 'softGel', 'matteClay', 'glossyPlastic', 'rubber', 'signal'];
// adversarial angle grid — INCLUDES low-elevation oblique (6/12°)
const ANGLES = [
  [6, 0], [6, 35], [12, 0], [12, 55],
  [22, 0], [22, 45], [22, 67], [35, 45],
];

const WARMTH_MAX = 18;
const LOCALWARM_MAX = 18;
const LUM_MAX = 128;
const SPREAD_MIN = 8;
const PIXEL_FLOOR = 3000;

const cells = [];
for (const mat of PRESETS) for (const [e, a] of ANGLES) cells.push({ board: 'box', mat, elev: e, az: a });
// extrude parity — all 6 at the two worst-suspect angles
for (const mat of PRESETS) for (const [e, a] of [[6, 0], [22, 45]]) cells.push({ board: 'extrude', mat, elev: e, az: a });
// strip distinctness
for (const mat of PRESETS) cells.push({ board: 'strip', mat, elev: 22, az: 45, fixture: 'box' });

const fixtureOf = (c) => c.fixture ?? (c.board === 'extrude' ? 'extrude' : 'box');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1500, height: 1500 } });
const consoleErrors = [];
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', (e) => consoleErrors.push(String(e)));

await page.goto(BASE_URL, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__indepReady === true, null, { timeout: 30000 });
await page.waitForTimeout(700);

let failures = 0;
const results = [];
const sha1 = (s) => createHash('sha1').update(s).digest('hex');

console.log(
  `INDEP verifier · ${cells.length} cells · BOX slab (broad flat faces) + extrude parity\n` +
  'board   material        el/az      lit rgb           r−b   lum  body sprd  worstWarm Δ(rgb,frac)            n     gate',
);

for (const cell of cells) {
  const fx = fixtureOf(cell);
  const { dataUrl, stats } = await page.evaluate(
    ([m, e, a, f]) => window.__indep.renderCell(m, e, a, f),
    [cell.mat, cell.elev, cell.az, fx],
  );
  const warmOk = stats.delta < WARMTH_MAX;
  const localWarmOk = stats.worst.delta < LOCALWARM_MAX;
  const specHighlight = stats.specFrac >= 0.06 && stats.body < LUM_MAX && warmOk && localWarmOk;
  const lumOk = stats.lum < LUM_MAX || specHighlight;
  const formOk = stats.spread >= SPREAD_MIN;
  const realOk = stats.n > PIXEL_FLOOR;
  const pass = warmOk && localWarmOk && lumOk && formOk && realOk;
  if (!pass) failures++;
  const gate = pass
    ? (stats.lum < LUM_MAX ? 'PASS' : `PASS·spec(body ${stats.body},sf ${stats.specFrac.toFixed(2)})`)
    : `FAIL${warmOk ? '' : ' warm'}${localWarmOk ? '' : ' lwarm'}${lumOk ? '' : ' lum'}${formOk ? '' : ' form'}${realOk ? '' : ' empty'}`;
  const w = stats.worst;
  console.log(
    `${cell.board.padEnd(7)} ${String(cell.mat).padEnd(15)} ${`${cell.elev}/${cell.az}`.padStart(6)}°  ` +
    `rgb(${stats.lit.r},${stats.lit.g},${stats.lit.b})`.padEnd(18) +
    `${String(stats.delta).padStart(4)}  ${String(stats.lum).padStart(4)} ${String(stats.body).padStart(4)} ${String(stats.spread).padStart(4)}  ` +
    `Δ${String(w.delta).padStart(3)} rgb(${w.r},${w.g},${w.b}) ${(w.frac * 100).toFixed(0)}%`.padEnd(26) +
    `${String(stats.n).padStart(6)}  ${gate}`,
  );
  const sub = `rgb(${stats.lit.r},${stats.lit.g},${stats.lit.b}) Δrb ${stats.delta} lum ${stats.lum} body ${stats.body} sprd ${stats.spread} | wWarm Δ${w.delta}`;
  await page.evaluate(
    ([b, l, s, d, f]) => window.__indep.appendFigure(b, l, s, d, f),
    [cell.board, `${cell.mat} ${cell.elev}/${cell.az}°`, sub, dataUrl, !pass],
  );
  results.push({ ...cell, fx, stats, hash: sha1(dataUrl) });
}

// distinctness summary
const strip = PRESETS.map((m) => results.find((r) => r.board === 'strip' && r.mat === m)).filter(Boolean);
if (strip.length === PRESETS.length) {
  const sig = (r) => `${r.stats.lum}|${r.stats.spread}|${r.stats.specFrac.toFixed(2)}`;
  const sigs = new Set(strip.map(sig));
  const blobs = strip.filter((r) => r.stats.spread < SPREAD_MIN);
  if (sigs.size >= 4 && blobs.length === 0) console.log(`PASS  distinctness — ${sigs.size}/6 distinct signatures, 0 black blobs`);
  else { failures++; console.log(`FAIL  distinctness — ${sigs.size}/6 distinct, ${blobs.length} blobs (${blobs.map(b=>b.mat).join(',')})`); }
}

for (const board of ['box', 'extrude', 'strip']) {
  const path = join(OUT_DIR, `board-${board}.png`);
  await page.locator(`#board-${board}`).screenshot({ path });
  console.log(`sheet: ${path}`);
}
writeFileSync(join(OUT_DIR, 'cells.json'), JSON.stringify(results, null, 2));

if (consoleErrors.length) { failures++; console.log(`FAIL  console errors: ${consoleErrors.join(' | ').slice(0, 400)}`); }
console.log(`\n${failures === 0 ? 'ALL GATES PASS' : `${failures} GATE FAILURES`} — read the boards at ${OUT_DIR}.`);
await browser.close();
process.exit(failures === 0 ? 0 : 1);
