// BEFORE-baseline capture for the svg-port 3D rebuild. Renders the CURRENT
// (broken) svg-port on the real Stroke3DScene path for a representative set,
// PAIRED with each object's 2D Clean (green = ground truth) + its 2D hand-drawn
// styles (the VIBE TARGET svg-port must retain). This is the "before" half of
// the before/after Sebs wants, and confirms the diagnosis with real renders.
// Per feedback_verify_paired_with_clean_per_object — paired, per object.
// READ-ONLY: drives the harness window.__vis; no src edits, no live DB.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let chromium;
for (const p of ['/tmp/dd-pp/node_modules/playwright', '/Users/sebs/Desktop/Projects/portfolio/tools/lab-screenshots/node_modules/playwright']) {
  try { ({ chromium } = require(p)); break; } catch { /* next */ }
}
if (!chromium) { console.error('no playwright'); process.exit(2); }

const URL = process.env.VIS_URL ?? 'http://localhost:4488/tools/3d/catalog-visual-3d.html';
const SHOTS2D = '/tmp/dd-2d-sweep/shots';
const OUT = '/tmp/dd-svgport-baseline';
mkdirSync(join(OUT, 'cells'), { recursive: true });
// Representative objects (present in the catalog): slab/poster, line-art, dense
// fill, logo, multi-feature. svg-port reads most on extrude (slab front face).
const WANT = ['guitarPedal', 'drumsticks', 'lacroixCan', 'psPoster', 'collectorTin', 'footAirlineLogo'];
const A_FRONT = { angleDeg: 0, elevDeg: 18 };
const A_Q35 = { angleDeg: 35, elevDeg: 22 };

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 900, height: 560 } });
await page.goto(URL, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__visReady === true, { timeout: 60000 });
const cleanBox = await page.$('#cleanbox');
const shapes = await page.evaluate(() => window.__vis.shapes);

const rows = [];
for (const name of WANT) {
  const idx = shapes.findIndex((s) => s.shape === name);
  if (idx < 0) { console.log(`SKIP ${name} (not found)`); continue; }
  await page.evaluate((i) => window.__vis.sample(i), idx);
  // 3D states: svg-port extrude front + q35, plus native extrude front for context.
  const cap = async (st, tag) => {
    const r = await page.evaluate((s) => window.__vis.render3d(s), st);
    const png = Buffer.from(r.dataUrl.split(',')[1], 'base64');
    writeFileSync(join(OUT, 'cells', `${name}-${tag}.png`), png);
    return { b64: r.dataUrl.split(',')[1], stats: r.stats };
  };
  const svgportF = await cap({ geometryMode: 'extrude', style3d: 'svg-port', ...A_FRONT }, 'svgport-front');
  const svgportQ = await cap({ geometryMode: 'extrude', style3d: 'svg-port', ...A_Q35 }, 'svgport-q35');
  const nativeF = await cap({ geometryMode: 'extrude', style3d: 'native', materialPreset: 'ink', ...A_FRONT }, 'native-front');
  console.log(`${name}: svgport spread=${svgportF.stats.spread} blackFrac=${svgportF.stats.blackFrac} | native spread=${nativeF.stats.spread}`);
  rows.push({ name, svgportF: svgportF.b64, svgportQ: svgportQ.b64, nativeF: nativeF.b64 });
}
await browser.close();

// Build the paired montage: per object row = [2D clean | 2D rough-handdrawn |
// 2D bold-ink | 3D svg-port front | 3D svg-port q35 | 3D native extrude].
const b64f = (f) => existsSync(f) ? readFileSync(f).toString('base64') : null;
const TILE = 170;
function cell(src, cap, cls = '') {
  return src
    ? `<figure class="${cls}"><img src="data:image/png;base64,${src}"/><figcaption>${cap}</figcaption></figure>`
    : `<figure class="miss"><div class="x">∅</div><figcaption>${cap}</figcaption></figure>`;
}
const rowHtml = (r) => {
  const cells = [
    cell(b64f(join(SHOTS2D, 'clean', `${r.name}.png`)), '2D clean', 'clean'),
    cell(b64f(join(SHOTS2D, 'rough-handdrawn', `${r.name}.png`)), '2D rough-handdrawn', 'vibe'),
    cell(b64f(join(SHOTS2D, 'bold-ink', `${r.name}.png`)), '2D bold-ink', 'vibe'),
    cell(r.svgportF, '3D svg-port front', 'd3'),
    cell(r.svgportQ, '3D svg-port q35', 'd3'),
    cell(r.nativeF, '3D native extrude', ''),
  ].join('');
  return `<div class="row"><div class="rl">${r.name}</div><div class="cells">${cells}</div></div>`;
};
const css = `body{margin:0;padding:14px;background:#fff;font:12px/1.3 monospace;color:#222}
  .hd{font-weight:700;margin-bottom:8px;font-size:14px;color:#b21f1f}
  .row{display:flex;align-items:flex-start;gap:8px;margin-bottom:10px;border-bottom:1px solid #e2e2e2;padding-bottom:8px}
  .rl{width:120px;flex:0 0 120px;font-weight:700;word-break:break-word}
  .cells{display:flex;gap:6px}
  figure{margin:0;width:${TILE}px}
  figure img{display:block;width:${TILE}px;height:${TILE}px;border:1px solid #ccc;background:#fff;object-fit:contain}
  figure.clean img{border:3px solid #1a7f37}
  figure.vibe img{border:2px solid #2b6cb0}
  figure.d3 img{border:2px solid #b21f1f}
  figcaption{font-size:10px;padding:2px 0;text-align:center;color:#666}
  figure.clean figcaption{color:#1a7f37;font-weight:700}
  figure.vibe figcaption{color:#2b6cb0;font-weight:700}
  figure.d3 figcaption{color:#b21f1f;font-weight:700}
  .x{width:${TILE}px;height:${TILE}px;display:flex;align-items:center;justify-content:center;color:#c00;border:1px dashed #c00}`;
const page2 = await (await chromium.launch()).newPage({ viewport: { width: 6 * (TILE + 8) + 140, height: 1400 }, deviceScaleFactor: 1 });
const html = `<!doctype html><meta charset="utf-8"><style>${css}</style><body><div class="hd">SVG-PORT 3D — BEFORE baseline · green=2D clean (truth) · blue=2D vibe target · red=current 3D svg-port</div>${rows.map(rowHtml).join('')}</body>`;
await page2.setContent(html, { waitUntil: 'networkidle' });
const body = await page2.$('body');
await body.screenshot({ path: join(OUT, 'svgport-before-paired.png') });
await page2.context().browser().close();
console.log(`wrote ${join(OUT, 'svgport-before-paired.png')}`);
