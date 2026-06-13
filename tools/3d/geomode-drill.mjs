// GEOMODE DRILL — re-render specific (shapeIndex, mode) cells at LARGE size for
// close vision-reading of geometry fidelity vs the Clean source. Composes a
// per-shape strip: CLEAN | auto | rod | extrude | inflate | solid (one angle,
// big tiles) so the eye can judge "is this a faithful, recognizable solid?".
// READ-ONLY repo tool — drives the catalog-visual-3d harness window API.
//
//   IDXS=14,20,87 ANGLE=q35 node tools/3d/geomode-drill.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let chromium;
for (const p of ['/tmp/dd-pp/node_modules/playwright', '/Users/sebs/Desktop/Projects/portfolio/tools/lab-screenshots/node_modules/playwright']) {
  try { ({ chromium } = require(p)); break; } catch {}
}
const BASE_URL = process.env.VIS_URL ?? 'http://localhost:4495/tools/3d/catalog-visual-3d.html';
const OUT = process.env.OUT_DIR ?? '/tmp/dd-geomode/drill';
mkdirSync(OUT, { recursive: true });
const IDXS = (process.env.IDXS ?? '').split(',').map((s) => parseInt(s, 10)).filter((n) => Number.isFinite(n));
const ANGLE = process.env.ANGLE ?? 'q35';
const A = { q35: { angleDeg: 35, elevDeg: 22 }, q315: { angleDeg: 315, elevDeg: 22 }, front: { angleDeg: 0, elevDeg: 18 } }[ANGLE];
const MODES = ['auto', 'rod', 'extrude', 'inflate', 'solid'];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 760, height: 460 } });
const sheetPage = await browser.newPage({ viewport: { width: 1700, height: 1400 } });
await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__visReady === true, { timeout: 60000 });
const shapes = await page.evaluate(() => window.__vis.shapes);
const cleanBox = await page.$('#cleanbox');

const rows = [];
for (const idx of IDXS) {
  const cell = shapes[idx];
  if (!cell) continue;
  const sample = await page.evaluate((i) => window.__vis.sample(i), idx);
  await page.evaluate((i) => window.__vis.renderClean(i), idx);
  const cleanBuf = await cleanBox.screenshot();
  const cells = [{ src: cleanBuf.toString('base64'), cap: `CLEAN strokes=${sample.strokeCount}` }];
  for (const mode of MODES) {
    const r = await page.evaluate((st) => window.__vis.render3d(st), { geometryMode: mode, style3d: 'native', materialPreset: 'ink', angleDeg: A.angleDeg, elevDeg: A.elevDeg });
    cells.push({ src: r.dataUrl.split(',')[1], cap: `${mode} of${r.stats.objFrac} bf${r.stats.blackFrac} sp${r.stats.spread} Δ${r.stats.delta}` });
  }
  rows.push({ label: `${idx} ${cell.kind}/${cell.shape}`, cells });
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const rowHtml = rows.map((r) => {
  const cells = r.cells.map((c) => `<figure><img src="data:image/png;base64,${c.src}"/><figcaption>${esc(c.cap)}</figcaption></figure>`).join('');
  return `<div class="row"><div class="rl">${esc(r.label)}</div><div class="cells">${cells}</div></div>`;
}).join('');
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  body{margin:0;padding:14px;background:#fdfcf9;color:#3b362e;font:12px/1.3 monospace}
  h1{font-size:15px;margin:0 0 12px}
  .row{display:flex;align-items:flex-start;gap:10px;margin-bottom:14px;border-bottom:1px solid #e6e0d4;padding-bottom:10px}
  .rl{width:150px;flex:0 0 150px;font-weight:700;word-break:break-word}
  .cells{display:flex;flex-wrap:nowrap;gap:8px}
  figure{margin:0;width:230px}
  figure img{display:block;width:230px;height:230px;border:1px solid #d8d2c6;background:#fff;object-fit:contain}
  figcaption{font-size:10px;padding:3px 0;color:#6f6a60}
</style></head><body><h1>GEOMODE DRILL — ${esc(ANGLE)} — CLEAN | auto | rod | extrude | inflate | solid</h1>${rowHtml}</body></html>`;
await sheetPage.setContent(html, { waitUntil: 'networkidle' });
const fname = join(OUT, `drill-${ANGLE}-${IDXS.join('_')}.png`);
await (await sheetPage.$('body')).screenshot({ path: fname });
await browser.close();
console.log('drill →', fname);
