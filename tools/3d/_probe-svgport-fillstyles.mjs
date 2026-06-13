// SVG-PORT × fillStyle coverage probe (the catalog-visual-3d svgport group only
// tests the DEFAULT hachure grammar; the task wants the ported treatment across
// the key 2D fillStyles). For a representative shape set, render svg-port at each
// fillStyle the dd-svg-port shader supports (hachure/cross-hatch/dots/zigzag/
// dashed/zigzag-line/solid/none) at one 3/4 angle, save PNGs + stats, and tile a
// contact sheet so the ported marks can be vision-verified per fillStyle.
// READ-ONLY: own page on a running vite server; no src edits, no DB writes.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let chromium;
for (const p of ['/tmp/dd-pp/node_modules/playwright', '/Users/sebs/Desktop/Projects/portfolio/tools/lab-screenshots/node_modules/playwright']) {
  try { ({ chromium } = require(p)); break; } catch {}
}
const URL = process.env.VIS_URL ?? 'http://localhost:4493/tools/3d/catalog-visual-3d.html';
const OUT = process.env.OUT_DIR ?? '/tmp/dd-vis3d-full/svgport-fillstyles';
mkdirSync(join(OUT, 'cells'), { recursive: true });
const A = { angleDeg: 35, elevDeg: 22 };
const FILLSTYLES = ['hachure', 'cross-hatch', 'dots', 'zigzag', 'dashed', 'zigzag-line', 'solid', 'none'];
const BASE = { hachureGap: 4, hachureAngle: -41, strokeWidth: 1.2, inkIntensity: 1.0, fillOpacity: 1.0 };
// representative: solid block, line-art crossing, curved cylinder, multi-element, text-ish
const WANTED = ['guitarPedal', 'drumsticks', 'lacroixCan', 'fidgetCollectionTray', 'stampedPassport', 'foldedMap'];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 760, height: 460 } });
const sheetPage = await browser.newPage({ viewport: { width: 1400, height: 1400 } });
await page.goto(URL, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__visReady === true, { timeout: 60000 });
const shapes = await page.evaluate(() => window.__vis.shapes);
const idxs = [];
for (const w of WANTED) { const i = shapes.findIndex(s => s.shape === w); if (i >= 0) idxs.push(i); }
while (idxs.length < 4) idxs.push(idxs.length);

const rows = [];
const statsLog = [];
for (const i of idxs) {
  await page.evaluate((x) => window.__vis.sample(x), i);
  await page.evaluate((x) => window.__vis.renderClean(x), i);
  const cleanBuf = await (await page.$('#cleanbox')).screenshot();
  const cells = [{ src: cleanBuf.toString('base64'), cap: `CLEAN ${shapes[i].shape}`, fail: false }];
  for (const fs of FILLSTYLES) {
    const r = await page.evaluate((st) => window.__vis.render3d(st), {
      geometryMode: 'extrude', style3d: 'svg-port',
      hatchInputs: { ...BASE, fillStyle: fs }, ...A,
    });
    const png = Buffer.from(r.dataUrl.split(',')[1], 'base64');
    writeFileSync(join(OUT, 'cells', `${shapes[i].shape}-${fs}.png`), png);
    cells.push({ src: png.toString('base64'), cap: `${fs} sp${r.stats.spread} bk${r.stats.blackFrac}`, fail: false });
    statsLog.push({ shape: shapes[i].shape, fillStyle: fs, ...r.stats });
  }
  rows.push({ label: shapes[i].shape, cells });
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const rowHtml = rows.map((r) => {
  const cells = r.cells.map((c) => `<figure><img src="data:image/png;base64,${c.src}"/><figcaption>${esc(c.cap)}</figcaption></figure>`).join('');
  return `<div class="row"><div class="rl">${esc(r.label)}</div><div class="cells">${cells}</div></div>`;
}).join('');
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  body{margin:0;padding:14px;background:#fdfcf9;color:#3b362e;font:11px/1.3 monospace}
  h1{font-size:14px;margin:0 0 12px}
  .row{display:flex;gap:8px;margin-bottom:10px;border-bottom:1px solid #e6e0d4;padding-bottom:8px}
  .rl{width:130px;flex:0 0 130px;font-weight:700}
  .cells{display:flex;flex-wrap:wrap;gap:6px}
  figure{margin:0;width:128px}
  figure img{display:block;width:128px;height:128px;border:1px solid #d8d2c6;background:#fff;object-fit:contain}
  figcaption{font-size:9px;color:#6f6a60}
</style></head><body><h1>SVG-PORT × fillStyle — ported marks on 3D form (extrude, q35)</h1>${rowHtml}</body></html>`;
await sheetPage.setContent(html, { waitUntil: 'networkidle' });
await (await sheetPage.$('body')).screenshot({ path: join(OUT, 'sheet-svgport-fillstyles.png') });
writeFileSync(join(OUT, 'stats.json'), JSON.stringify(statsLog, null, 2));
await browser.close();
console.log('shapes:', idxs.map(i => shapes[i].shape).join(', '));
console.log('sheet →', join(OUT, 'sheet-svgport-fillstyles.png'));
// quick distinctness check: spread per fillStyle on the first shape
const first = statsLog.filter(s => s.shape === shapes[idxs[0]].shape);
console.log('\n' + shapes[idxs[0]].shape + ' per-fillStyle spread:');
for (const s of first) console.log(`  ${s.fillStyle.padEnd(12)} spread=${s.spread} blackFrac=${s.blackFrac} objFrac=${s.objFrac}`);
