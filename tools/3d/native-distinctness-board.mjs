// NATIVE DISTINCTNESS BOARD — the single most important visual deliverable for
// the native material audit: the 6 materials side by side on the SAME shape, on
// BOTH flat-slab (extrude) AND curved (rod + inflate) geometry, at a fixed
// oblique orbit angle (the worst case for the warm-tan envmap band). Renders
// each cell through the REAL harness window API (Stroke3DScene exports) and
// tiles them into one PNG per shape so a human/vision can confirm at a glance:
//   · all 6 read ink-black (NO warm-tan)
//   · the 6 read DISTINCT (matte vs gloss vs gel vs signal)
//   · no flat-black blob, forms lit.
//
//   node tools/3d/native-distinctness-board.mjs            (uses :4499)
//   SHAPES=0,5,40,120 node tools/3d/native-distinctness-board.mjs
// READ-ONLY. Tools-only. No DB.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let chromium;
for (const p of ['/tmp/dd-pp/node_modules/playwright', '/Users/sebs/Desktop/Projects/portfolio/tools/lab-screenshots/node_modules/playwright']) {
  try { ({ chromium } = require(p)); break; } catch { /* next */ }
}
if (!chromium) { console.error('no playwright'); process.exit(2); }

const BASE_URL = process.env.VIS_URL ?? 'http://localhost:4499/tools/3d/catalog-visual-3d.html';
const OUT_DIR = process.env.OUT_DIR ?? '/tmp/dd-native-board';
mkdirSync(OUT_DIR, { recursive: true });

const PRESETS = ['ink', 'matteClay', 'glossyPlastic', 'signal', 'softGel', 'rubber'];
// oblique angle = the tan worst case (matches the FS-env regression site)
const A = { angleDeg: 315, elevDeg: 22 };
const GEOS = [
  { geo: 'extrude', label: 'SLAB' },
  { geo: 'rod', label: 'ROD(curved)' },
  { geo: 'inflate', label: 'GEL(curved)' },
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 760, height: 460 } });
const sheetPage = await browser.newPage({ viewport: { width: 1400, height: 1400 } });
const errs = [];
page.on('pageerror', (e) => errs.push(String(e).slice(0, 160)));
await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__visReady === true, { timeout: 60000 });
const shapes = await page.evaluate(() => window.__vis.shapes);

// Default representative set spanning categories: an open stroke, a closed solid,
// a thin frame, a tiny detail-heavy form, a curvy organic, a dense-tonal poster.
const SHAPE_IDS = (process.env.SHAPES ? process.env.SHAPES.split(',').map(Number) : [0, 8, 40, 60, 100, 150]);

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
async function makeSheet(title, rows, outPath) {
  const rowHtml = rows.map((r) => {
    const cells = r.cells.map((c) => `<figure class="${c.fail ? 'fail' : ''}"><img src="data:image/png;base64,${c.src}"/><figcaption>${esc(c.cap)}</figcaption></figure>`).join('');
    return `<div class="row"><div class="rl">${esc(r.label)}</div><div class="cells">${cells}</div></div>`;
  }).join('');
  const html = `<!doctype html><meta charset=utf-8><style>
    body{margin:0;padding:14px;background:#fdfcf9;color:#3b362e;font:11px/1.3 monospace}
    h1{font-size:14px;margin:0 0 12px;border-bottom:2px solid #3b362e;padding-bottom:5px}
    .row{display:flex;align-items:flex-start;gap:8px;margin-bottom:8px;border-bottom:1px solid #e6e0d4;padding-bottom:6px}
    .rl{width:96px;flex:0 0 96px;font-weight:700}
    .cells{display:flex;flex-wrap:wrap;gap:6px}
    figure{margin:0;width:140px}
    figure img{display:block;width:140px;height:140px;border:1px solid #d8d2c6;background:#fff;object-fit:contain}
    figure.fail img{border:3px solid #c0392b}
    figcaption{font-size:9px;padding:2px 0;color:#6f6a60}
  </style><h1>${esc(title)}</h1>${rowHtml}`;
  await sheetPage.setContent(html, { waitUntil: 'networkidle' });
  await (await sheetPage.$('body')).screenshot({ path: outPath });
}

const TAN = 25;
const summary = [];
for (const idx of SHAPE_IDS) {
  const cell = shapes[idx];
  await page.evaluate((i) => window.__vis.sample(i), idx);
  await page.evaluate((i) => window.__vis.renderClean(i), idx);
  const cleanBuf = await (await page.$('#cleanbox')).screenshot();
  const rows = [];
  for (const g of GEOS) {
    const cells = [];
    for (const preset of PRESETS) {
      const r = await page.evaluate((st) => window.__vis.render3d(st), {
        geometryMode: g.geo, style3d: 'native', materialPreset: preset, angleDeg: A.angleDeg, elevDeg: A.elevDeg,
      });
      const st = r.stats;
      const tan = st.objFrac > 0.02 && st.delta >= TAN;
      const blob = st.blackFrac > 0.85 && st.spread < 18 && st.objFrac > 0.01;
      const empty = st.objFrac < 0.004;
      const fail = tan || blob || empty;
      const flag = tan ? 'TAN' : blob ? 'BLOB' : empty ? 'EMPTY' : '';
      cells.push({ src: r.dataUrl.split(',')[1], cap: `${preset} Δ${st.delta} L${st.lum} blk${st.blackFrac} ${flag}`, fail });
      summary.push({ shape: cell.shape, geo: g.geo, preset, delta: st.delta, lum: st.lum, blackFrac: st.blackFrac, spread: st.spread, objFrac: st.objFrac, flag });
    }
    rows.push({ label: g.label, cells });
  }
  const out = join(OUT_DIR, `board-s${String(idx).padStart(3, '0')}-${cell.shape}.png`);
  await makeSheet(`NATIVE 6-MAT DISTINCTNESS @${A.angleDeg}° — ${cell.kind}/${cell.shape} (idx ${idx})  ·  Clean dark=${'see cleanbox'}`, rows, out);
  // also stash clean
  writeFileSync(join(OUT_DIR, `clean-s${String(idx).padStart(3, '0')}.png`), cleanBuf);
  console.log(`board → ${out}`);
}
await browser.close();
writeFileSync(join(OUT_DIR, 'summary.json'), JSON.stringify(summary, null, 2));
const tanN = summary.filter((s) => s.flag === 'TAN').length;
const blobN = summary.filter((s) => s.flag === 'BLOB').length;
const emptyN = summary.filter((s) => s.flag === 'EMPTY').length;
const maxD = Math.max(...summary.map((s) => s.delta));
console.log(`\ncells=${summary.length}  TAN=${tanN}  BLOB=${blobN}  EMPTY=${emptyN}  maxΔ=${maxD}`);
if (errs.length) console.log('pageerrors:', [...new Set(errs)].slice(0, 5));
console.log('boards →', OUT_DIR);
