// RC-4 FOCUSED REPRODUCTION/VERIFY driver — drives the existing read-only
// catalog-visual-3d.html harness (window.__vis) over a TARGETED shape set:
//   (a) Hatch hachureGap LOW(0.5)/MID(4)/HIGH(30) — confirm HIGH shows hatching
//       (not blank). Spread + objFrac measured; HIGH must keep ink structure.
//   (b) Rod radius LOW(0.01)/MID(0.032)/HIGH(0.128) on TALL/THIN shapes —
//       confirm LOW does not overflow/clip the canvas (overflowEdge low).
//
// Run twice: MODE=before (pre-fix repro) and MODE=after (post-fix verify).
// Boards: /tmp/dd-rc4/board-hatch-gap.png + /tmp/dd-rc4/board-rod-radius.png
// (Clean | LOW | MID | HIGH per shape) — READ them.
//
//   node tools/3d/rc4-repro.mjs            (assumes preview already serving VIS_URL)
//   VIS_URL=http://localhost:4490/tools/3d/catalog-visual-3d.html node tools/3d/rc4-repro.mjs
//   MODE=after VIS_URL=... node tools/3d/rc4-repro.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let chromium;
for (const p of [
  '/tmp/dd-pp/node_modules/playwright',
  '/Users/sebs/Desktop/Projects/portfolio/tools/lab-screenshots/node_modules/playwright',
]) { try { ({ chromium } = require(p)); break; } catch { /* next */ } }
if (!chromium) { console.error('FATAL: playwright not found'); process.exit(2); }

const BASE_URL = process.env.VIS_URL ?? 'http://localhost:4490/tools/3d/catalog-visual-3d.html';
const MODE = process.env.MODE ?? 'after';
const OUT_DIR = process.env.OUT_DIR ?? '/tmp/dd-rc4';
mkdirSync(OUT_DIR, { recursive: true });

// Shapes: tall/thin (rod overflow site) + a few medium/varied (hatch gap site).
const TALL_THIN = ['seltzerCan', 'co2Canister', 'boardingPassTW'];
const HATCH_SHAPES = ['seltzerCan', 'co2Canister', 'boardingPassTW', 'wrestlingFigure', 'easterEgg', 'flagPanel'];

const HATCH_GAP = { low: 0.5, mid: 4, high: 30 };
const ROD_RADIUS = { low: 0.01, mid: 0.032, high: 0.128 };
const BASE_HATCH = { hachureGap: 4, hachureAngle: -41, strokeWidth: 1.2, inkIntensity: 1.0 };
const DEF_ROD = { radius: 0.032, caps: true, capStyle: 'round', jointStyle: 'blob', jointSensitivityDeg: 40 };
const DEF_PARAMS = {
  rod: { ...DEF_ROD },
  extrude: { width: 0.5, depthMult: 1.0, bevelProfile: 'rounded', sideWall: 'straight' },
  inflate: { baseRadius: 0.22, tipRadius: 0.035, pressureInfluence: 0.35, puff: 0.5, profileFamily: 'balloon' },
  solid: { inkRadius: 0.08, depth: 0.48, holes: true, edge: 'eased' },
};

async function makeSheet(page, title, rows, outPath) {
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const rowHtml = rows.map((r) => {
    const cells = r.cells.map((c) =>
      `<figure class="${c.fail ? 'fail' : ''}"><img src="data:image/png;base64,${c.src}"/><figcaption>${esc(c.cap)}</figcaption></figure>`,
    ).join('');
    return `<div class="row"><div class="rl">${esc(r.label)}</div><div class="cells">${cells}</div></div>`;
  }).join('');
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    body{margin:0;padding:14px;background:#fdfcf9;color:#3b362e;font:11px/1.3 monospace}
    h1{font-size:14px;margin:0 0 12px;border-bottom:2px solid #3b362e;padding-bottom:5px}
    .row{display:flex;align-items:flex-start;gap:8px;margin-bottom:10px;border-bottom:1px solid #e6e0d4;padding-bottom:8px}
    .rl{width:150px;flex:0 0 150px;font-weight:700;word-break:break-word}
    .cells{display:flex;flex-wrap:wrap;gap:6px}
    figure{margin:0;width:170px}
    figure img{display:block;width:170px;height:170px;border:1px solid #d8d2c6;background:#fff;object-fit:contain}
    figure.fail img{border:3px solid #c0392b}
    figcaption{font-size:9px;padding:2px 0;color:#6f6a60}
    figure.fail figcaption{color:#c0392b;font-weight:700}
  </style></head><body><h1>${esc(title)}</h1>${rowHtml}</body></html>`;
  await page.setContent(html, { waitUntil: 'networkidle' });
  const body = await page.$('body');
  await body.screenshot({ path: outPath });
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 760, height: 460 } });
const sheetPage = await browser.newPage({ viewport: { width: 1100, height: 1400 } });
const errs = [];
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
page.on('pageerror', (e) => errs.push('PAGEERR ' + String(e).slice(0, 200)));

console.log(`MODE=${MODE} →`, BASE_URL);
await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__visReady === true, { timeout: 60000 });
const shapes = await page.evaluate(() => window.__vis.shapes);
const cleanBox = await page.$('#cleanbox');

function idxOf(shape) {
  const i = shapes.findIndex((s) => s.shape === shape);
  if (i < 0) { console.warn('⚠ shape not in inventory:', shape); }
  return i;
}

async function renderState(state) {
  const r = await page.evaluate((st) => window.__vis.render3d(st), state);
  return { png: Buffer.from(r.dataUrl.split(',')[1], 'base64'), stats: r.stats };
}
async function cleanFor(idx) {
  await page.evaluate((i) => window.__vis.sample(i), idx);
  await page.evaluate((i) => window.__vis.renderClean(i), idx);
  return await cleanBox.screenshot();
}

// ─── (a) HATCH GAP ──────────────────────────────────────────────────────────
console.log('\n── (a) Hatch hachureGap LOW/MID/HIGH (HIGH must show hatching) ──');
const hatchRows = [];
const hatchResults = [];
for (const shape of HATCH_SHAPES) {
  const idx = idxOf(shape);
  if (idx < 0) continue;
  const cleanBuf = await cleanFor(idx);
  const cells = [{ src: cleanBuf.toString('base64'), cap: 'CLEAN', fail: false }];
  const row = { shape, levels: {} };
  for (const lvl of ['low', 'mid', 'high']) {
    const { png, stats } = await renderState({
      geometryMode: 'extrude', style3d: 'hatch', hatchGrammar: 'hachure', hatchDirection: 'fixed',
      hatchInputs: { ...BASE_HATCH, hachureGap: HATCH_GAP[lvl] }, angleDeg: 0, elevDeg: 18,
    });
    // HIGH blank = hatching gone: objFrac present but spread near-0 and very few ink px.
    const blank = stats.objFrac > 0.02 && stats.spread < 12 && stats.blackFrac < 0.2;
    row.levels[lvl] = { objFrac: stats.objFrac, spread: stats.spread, blackFrac: stats.blackFrac, blank };
    cells.push({ src: png.toString('base64'), cap: `gap=${HATCH_GAP[lvl]} sp${stats.spread} bf${stats.blackFrac}${blank ? ' BLANK' : ''}`, fail: lvl === 'high' && blank });
    console.log(`  ${shape.padEnd(18)} gap ${lvl.padEnd(4)}=${String(HATCH_GAP[lvl]).padStart(4)}  objFrac=${stats.objFrac}  spread=${stats.spread}  blackFrac=${stats.blackFrac}${blank ? '  ← BLANK/FLAT' : ''}`);
  }
  hatchRows.push({ label: shape, cells });
  hatchResults.push(row);
}
await makeSheet(sheetPage, `RC-4(a) HATCH gap LOW/MID/HIGH [${MODE}] — HIGH must show hatching`, hatchRows, join(OUT_DIR, `board-hatch-gap-${MODE}.png`));

// ─── (b) ROD RADIUS on tall/thin (LOW must not overflow) ────────────────────
console.log('\n── (b) Rod radius LOW/MID/HIGH on tall/thin (LOW must not overflow) ──');
const rodRows = [];
const rodResults = [];
for (const shape of TALL_THIN) {
  const idx = idxOf(shape);
  if (idx < 0) continue;
  const cleanBuf = await cleanFor(idx);
  const cells = [{ src: cleanBuf.toString('base64'), cap: 'CLEAN', fail: false }];
  const row = { shape, levels: {} };
  for (const lvl of ['low', 'mid', 'high']) {
    const params = JSON.parse(JSON.stringify(DEF_PARAMS));
    params.rod.radius = ROD_RADIUS[lvl];
    const { png, stats } = await renderState({
      geometryMode: 'rod', style3d: 'native', materialPreset: 'ink', modeParams: params,
      angleDeg: 0, elevDeg: 18,
    });
    const overflow = stats.overflowEdge > 0.02;
    row.levels[lvl] = { objFrac: stats.objFrac, overflowEdge: stats.overflowEdge, bboxFill: stats.bboxFill, overflow };
    cells.push({ src: png.toString('base64'), cap: `r=${ROD_RADIUS[lvl]} edge${stats.overflowEdge}${overflow ? ' OVERFLOW' : ''}`, fail: overflow });
    console.log(`  ${shape.padEnd(18)} r ${lvl.padEnd(4)}=${String(ROD_RADIUS[lvl]).padStart(6)}  objFrac=${stats.objFrac}  overflowEdge=${stats.overflowEdge}${overflow ? '  ← OVERFLOW/CLIP' : ''}`);
  }
  rodRows.push({ label: shape, cells });
  rodResults.push(row);
}
await makeSheet(sheetPage, `RC-4(b) ROD radius LOW/MID/HIGH on TALL/THIN [${MODE}] — LOW must not overflow`, rodRows, join(OUT_DIR, `board-rod-radius-${MODE}.png`));

await browser.close();
writeFileSync(join(OUT_DIR, `results-${MODE}.json`), JSON.stringify({ mode: MODE, hatch: hatchResults, rod: rodResults, errs: [...new Set(errs)].slice(0, 20) }, null, 2));

console.log('\n── SUMMARY [%s] ──', MODE);
const hatchBlankHigh = hatchResults.filter((r) => r.levels.high?.blank).map((r) => r.shape);
const rodOverflowLow = rodResults.filter((r) => r.levels.low?.overflow).map((r) => r.shape);
console.log('hatch HIGH blank:', hatchBlankHigh.length ? hatchBlankHigh.join(', ') : 'NONE ✓');
console.log('rod LOW overflow:', rodOverflowLow.length ? rodOverflowLow.join(', ') : 'NONE ✓');
if (errs.length) console.log('console errors:', [...new Set(errs)].slice(0, 6));
console.log('boards →', OUT_DIR);
