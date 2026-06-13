// Clean-PAIRED comparison sheets for ALL 197 objects, built from the per-cell
// shots the audit-style-sweep already wrote (/tmp/dd-2d-sweep/shots/<style>/).
// Each ROW = one object: CLEAN tile FIRST (green border = ground truth), then
// every style beside it, so a divergence from Clean (white region shaded, dark
// region dropped, blob, empty, garble) is visible per object. Chunked into
// readable sheets for parallel agent reading. This is the "look at the Clean avg
// per object" view ([[feedback-verify-paired-with-clean-per-object]]).
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let chromium;
for (const p of ['/tmp/dd-pp/node_modules/playwright', '/Users/sebs/Desktop/Projects/portfolio/tools/lab-screenshots/node_modules/playwright']) {
  try { ({ chromium } = require(p)); break; } catch { /* next */ }
}
if (!chromium) { console.error('no playwright'); process.exit(2); }

const SHOTS = '/tmp/dd-2d-sweep/shots';
const OUT = '/tmp/dd-clean-paired/sheets';
mkdirSync(OUT, { recursive: true });
// Clean FIRST (ground truth), then all hand-drawn / filter styles.
const STYLES = ['clean', 'rough-handdrawn', 'sketchy', 'bold-ink', 'wet-ink', 'charcoal', 'stipple', 'risograph', 'newsprint', 'outline-only', 'wireframe'];
const TILE = 150;
const PER_SHEET = 12; // objects (rows) per sheet

// All shapes = every clean shot.
const ALL = readdirSync(join(SHOTS, 'clean')).filter((f) => f.endsWith('.png')).map((f) => f.replace(/\.png$/, '')).sort();
console.log(`shapes: ${ALL.length}, styles: ${STYLES.length}, sheets: ${Math.ceil(ALL.length / PER_SHEET)}`);

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
  .row{display:flex;align-items:flex-start;gap:8px;margin-bottom:10px;border-bottom:1px solid #e2e2e2;padding-bottom:8px}
  .rl{width:130px;flex:0 0 130px;font-weight:700;word-break:break-word}
  .cells{display:flex;gap:5px}
  figure{margin:0;width:${TILE}px}
  figure img{display:block;width:${TILE}px;height:${TILE}px;border:1px solid #ccc;background:#fff;object-fit:contain;image-rendering:pixelated}
  figure.clean img{border:3px solid #1a7f37}
  figcaption{font-size:10px;padding:2px 0;text-align:center;color:#666}
  figure.clean figcaption{color:#1a7f37;font-weight:700}
  .x{width:${TILE}px;height:${TILE}px;display:flex;align-items:center;justify-content:center;color:#c00;border:1px dashed #c00}`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: STYLES.length * (TILE + 5) + 160, height: 1600 }, deviceScaleFactor: 1 });
let n = 0;
for (let c = 0; c < ALL.length; c += PER_SHEET) {
  const chunk = ALL.slice(c, c + PER_SHEET);
  const html = `<!doctype html><meta charset="utf-8"><style>${css}</style><body><div style="font-weight:700;margin-bottom:8px">CLEAN-PAIRED styles · objects ${c}–${c + chunk.length - 1}</div>${chunk.map(rowHtml).join('')}</body>`;
  await page.setContent(html, { waitUntil: 'networkidle' });
  const body = await page.$('body');
  const out = join(OUT, `style-sheet-${String(c).padStart(3, '0')}.png`);
  await body.screenshot({ path: out });
  n++;
}
await browser.close();
console.log(`wrote ${n} sheets → ${OUT}`);
