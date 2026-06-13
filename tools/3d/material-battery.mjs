// Material × orbit-angle battery driver — drives tools/3d/material-battery.html
// (window.__mat) headless and prints the PER-CELL table (never sample-and-claim;
// this exact gate fell to angle-sampling twice).
//
//   MODE=baseline node tools/3d/material-battery.mjs   # reproduce + save baseline
//   MODE=verify   node tools/3d/material-battery.mjs   # gate post-fix run
//
// Server: any vite serving the repo (default http://localhost:4407). Output:
// /tmp/dd-mat/{board-*.png, cells.json, baseline.json}.
//
// GATES (ink-black policy, 3d-mode-controls-spec RATIFIED COLOR POLICY):
//   warmth  lit-face r−b < 25      (broad warm-tan band ban)
//   value   lit-face luminance<128 (below mid except specular pinpoints)
//   form    spread p90−p10 ≥ 12    (anti flat-blob — the Day-11 regression)
//   real    object pixels > floor  (anti vacuous-pass)
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('/tmp/dd-pp/node_modules/playwright');

const MODE = process.env.MODE === 'baseline' ? 'baseline' : 'verify';
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:4407/tools/3d/material-battery.html';
const OUT_DIR = '/tmp/dd-mat';
mkdirSync(OUT_DIR, { recursive: true });

const PRESETS = ['ink', 'softGel', 'matteClay', 'glossyPlastic', 'rubber', 'signal'];
const ANGLES_8 = [0, 45, 90, 135, 180, 225, 270, 315];
const ANGLES_4 = [0, 90, 180, 270];
const WORST = ['glossyPlastic', 'signal'];

const WARMTH_MAX = 25; // r−b bound on the lit face
const LUM_MAX = 128; // below mid
const SPREAD_MIN = 12; // form-gradient floor
const PIXEL_FLOOR = { extrude: 2000, inflate: 2000, rod: 900 };

// Cell inventory — per-item, no sampling.
const cells = [];
for (const mat of PRESETS)
  for (const angle of ANGLES_8) cells.push({ board: 'extrude', geom: 'extrude', mat, angle });
for (const mat of WORST)
  for (const geom of ['rod', 'inflate'])
    for (const angle of ANGLES_4) cells.push({ board: 'rodinflate', geom, mat, angle });
for (const mat of PRESETS) cells.push({ board: 'strip', geom: 'extrude', mat, angle: 45 });
for (const mat of ['hatch', 'svg-port']) cells.push({ board: 'marks', geom: 'extrude', mat, angle: 45 });

// Baseline (pre-fix) stats — verify mode gates FORM against it: a cell passes
// form with spread ≥ SPREAD_MIN, OR by not regressing a baseline cell that was
// already below the floor (face-on flat slab reads on matte presets pre-exist
// the env fix; the gate catches REGRESSION, not pre-existing flatness).
const baselinePath = join(OUT_DIR, 'baseline.json');
const baseline = MODE === 'verify' && existsSync(baselinePath)
  ? JSON.parse(readFileSync(baselinePath, 'utf8'))
  : null;
const baseKey = (c) => `${c.board}|${c.mat}|${c.geom}|${c.angle}`;
const baseByKey = baseline ? Object.fromEntries(baseline.map((r) => [baseKey(r), r])) : null;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1480, height: 1200 } });
const consoleErrors = [];
page.on('console', (m) => {
  if (m.type() === 'error') consoleErrors.push(m.text());
});
page.on('pageerror', (e) => consoleErrors.push(String(e)));

await page.goto(BASE_URL, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__matReady === true, null, { timeout: 30000 });
// First-mount settle (Environment bake).
await page.waitForTimeout(600);

let failures = 0;
const results = [];
const sha1 = (s) => createHash('sha1').update(s).digest('hex');

console.log(
  `MODE=${MODE} · ${cells.length} cells\n` +
    'board       material        geom     ang   lit rgb           r−b   lum  sprd     n  gate',
);

for (const cell of cells) {
  const { dataUrl, stats } = await page.evaluate(
    ([g, m, a]) => window.__mat.renderCell(g, m, a),
    [cell.geom, cell.mat, cell.angle],
  );
  const isMark = cell.board === 'marks';
  const warmOk = stats.delta < WARMTH_MAX;
  // "Below mid EXCEPT specular pinpoints" (policy wording): on thin geometry
  // (end-on rods) the area-light highlight IS most of the lit band, so the
  // exemption is made concrete — a real highlight region exists (specFrac ≥
  // 0.10 at lum ≥ 170), the object BODY is dark (< 128), and warmth already
  // passed. A grey rod (body mid) or tan rod (warmth fail) still FAILS.
  const specHighlight = stats.specFrac >= 0.1 && stats.body < LUM_MAX && warmOk;
  const lumOk = stats.lum < LUM_MAX || specHighlight;
  const baseCell = baseByKey?.[baseKey(cell)];
  const formOk =
    stats.spread >= SPREAD_MIN ||
    (baseCell != null && stats.spread + 2 >= baseCell.stats.spread);
  const realOk = stats.n > (PIXEL_FLOOR[cell.geom] ?? 900);
  // Marks cells are gated on baseline identity (below), not on the ink gates
  // (hatch deliberately paints bright paper between hachure lines).
  const pass = isMark ? realOk : warmOk && lumOk && formOk && realOk;
  if (!pass && MODE === 'verify') failures++;
  const gate = pass
    ? stats.lum < LUM_MAX || isMark
      ? 'PASS'
      : `PASS·spec(body ${stats.body}, sf ${stats.specFrac.toFixed(2)})`
    : `FAIL${warmOk ? '' : ' warm'}${lumOk ? '' : ' lum'}${formOk ? '' : ' form'}${realOk ? '' : ' empty'}`;
  console.log(
    `${cell.board.padEnd(11)} ${String(cell.mat).padEnd(15)} ${cell.geom.padEnd(8)} ${String(cell.angle).padStart(3)}°  ` +
      `rgb(${stats.lit.r},${stats.lit.g},${stats.lit.b})`.padEnd(18) +
      `${String(stats.delta).padStart(4)}  ${String(stats.lum).padStart(4)}  ${String(stats.spread).padStart(4)}  ${String(stats.n).padStart(6)}  ${gate}`,
  );
  const sub = `rgb(${stats.lit.r},${stats.lit.g},${stats.lit.b}) · Δrb ${stats.delta} · lum ${stats.lum} · sprd ${stats.spread}`;
  await page.evaluate(
    ([b, l, s, d, f]) => window.__mat.appendFigure(b, l, s, d, f),
    [cell.board, `${cell.mat} · ${cell.geom} · ${cell.angle}°`, sub, dataUrl, !pass],
  );
  results.push({ ...cell, stats, hash: sha1(dataUrl) });
}

// ── Marks identity vs baseline (env change must not touch hatch/svg-port) ──
if (MODE === 'baseline') {
  writeFileSync(baselinePath, JSON.stringify(results, null, 2));
  console.log(`\nbaseline saved → ${baselinePath}`);
} else if (baseline) {
  for (const mat of ['hatch', 'svg-port']) {
    const now = results.find((r) => r.board === 'marks' && r.mat === mat);
    const was = baseline.find((r) => r.board === 'marks' && r.mat === mat);
    if (!was) continue;
    if (now.hash === was.hash) {
      console.log(`PASS  marks/${mat} byte-identical to pre-fix baseline (sha1 match)`);
    } else {
      const close =
        Math.abs(now.stats.lum - was.stats.lum) <= 2 &&
        Math.abs(now.stats.delta - was.stats.delta) <= 2 &&
        Math.abs(now.stats.n - was.stats.n) <= 50;
      if (close) {
        console.log(
          `WARN  marks/${mat} hash differs but stats match within tolerance (GPU nondeterminism) — eyeball the board`,
        );
      } else {
        failures++;
        console.log(
          `FAIL  marks/${mat} CHANGED: lum ${was.stats.lum}→${now.stats.lum} Δrb ${was.stats.delta}→${now.stats.delta} n ${was.stats.n}→${now.stats.n}`,
        );
      }
    }
  }
} else {
  console.log('NOTE  no baseline.json — marks identity check skipped');
}

// ── Boards ──────────────────────────────────────────────────────────────────
for (const board of ['strip', 'extrude', 'rodinflate', 'marks']) {
  const path = join(OUT_DIR, `board-${board}${MODE === 'baseline' ? '-BEFORE' : ''}.png`);
  await page.locator(`#board-${board}`).screenshot({ path });
  console.log(`sheet: ${path}`);
}
writeFileSync(join(OUT_DIR, `cells-${MODE}.json`), JSON.stringify(results, null, 2));

if (consoleErrors.length) {
  failures++;
  console.log(`FAIL  console errors: ${consoleErrors.join(' | ').slice(0, 400)}`);
}
console.log(
  `\n${MODE === 'baseline' ? 'BASELINE RECORDED (failures expected pre-fix)' : failures === 0 ? 'ALL GATES PASS' : `${failures} GATE FAILURES`} — read the boards.`,
);
await browser.close();
process.exit(MODE === 'baseline' ? 0 : failures === 0 ? 0 : 1);
