// One-off Clean-paired verification montage for the R8 2D-systemic fix landing.
// Reads the freshly-swept cells in /tmp/dd-2d-sweep/shots/<style>/ for an
// EXPLICIT shape list (the 4 fixed objects + the named regression controls) so
// I read ONLY the post-fix renders, paired with Clean (green border = ground
// truth). Per feedback_verify_paired_with_clean_per_object — no lone mosaics.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let chromium;
for (const p of ['/tmp/dd-pp/node_modules/playwright', '/Users/sebs/Desktop/Projects/portfolio/tools/lab-screenshots/node_modules/playwright']) {
  try { ({ chromium } = require(p)); break; } catch { /* next */ }
}
if (!chromium) { console.error('no playwright'); process.exit(2); }

const SHOTS = '/tmp/dd-2d-sweep/shots';
const OUT = '/tmp/dd-2d-verify';
mkdirSync(OUT, { recursive: true });
const STYLES = ['clean', 'rough-handdrawn', 'sketchy', 'bold-ink', 'wet-ink', 'charcoal', 'stipple', 'risograph', 'newsprint', 'outline-only', 'wireframe'];
// Grouped by the fix each tests.
const GROUPS = [
  { tag: 'A-multigroup-FIXED', shapes: ['dominoTiles', 'lacroixRack'] },
  { tag: 'A-regression-controls', shapes: ['stackedSketchbooks', 'maracasGuacharaca', 'carryOnBackpack', 'looseCartridge'] },
  { tag: 'BD-riso-FIXED', shapes: ['collectorTin', 'boxedGameCartridge'] },
  { tag: 'BD-regression-controls', shapes: ['ampCombo', 'cardBinder', 'framedMoviePoster', 'ps1JewelCase'] },
  { tag: 'C-darkregion-confirm', shapes: ['flagPanel', 'psPoster', 'pitchDeckCover', 'ppvPoster'] },
];
const TILE = 150;
const b64 = (f) => existsSync(f) ? readFileSync(f).toString('base64') : null;
function rowHtml(shape) {
  const cells = STYLES.map((st) => {
    const src = b64(join(SHOTS, st, `${shape}.png`));
    return src
      ? `<figure class="${st === 'clean' ? 'clean' : ''}"><img src="data:image/png;base64,${src}"/><figcaption>${st}</figcaption></figure>`
      : `<figure class="miss"><div class="x">∅</div><figcaption>${st}</figcaption></figure>`;
  }).join('');
  return `<div class="row"><div class="rl">${shape}</div><div class="cells">${cells}</div></div>`;
}
const css = `body{margin:0;padding:14px;background:#fff;font:12px/1.3 monospace;color:#222}
  .gh{font-weight:700;margin:14px 0 6px;font-size:14px;color:#7a1fa2}
  .row{display:flex;align-items:flex-start;gap:8px;margin-bottom:10px;border-bottom:1px solid #e2e2e2;padding-bottom:8px}
  .rl{width:130px;flex:0 0 130px;font-weight:700;word-break:break-word}
  .cells{display:flex;gap:5px}
  figure{margin:0;width:${TILE}px}
  figure img{display:block;width:${TILE}px;height:${TILE}px;border:1px solid #ccc;background:#fff;object-fit:contain}
  figure.clean img{border:3px solid #1a7f37}
  figcaption{font-size:10px;padding:2px 0;text-align:center;color:#666}
  figure.clean figcaption{color:#1a7f37;font-weight:700}
  .x{width:${TILE}px;height:${TILE}px;display:flex;align-items:center;justify-content:center;color:#c00;border:1px dashed #c00}`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: STYLES.length * (TILE + 5) + 160, height: 1600 }, deviceScaleFactor: 1 });
let n = 0;
for (const g of GROUPS) {
  const html = `<!doctype html><meta charset="utf-8"><style>${css}</style><body><div class="gh">${g.tag}</div>${g.shapes.map(rowHtml).join('')}</body>`;
  await page.setContent(html, { waitUntil: 'networkidle' });
  const body = await page.$('body');
  const out = join(OUT, `verify-${g.tag}.png`);
  await body.screenshot({ path: out });
  console.log(`wrote ${out}`);
  n++;
}
await browser.close();
console.log(`wrote ${n} sheets → ${OUT}`);
