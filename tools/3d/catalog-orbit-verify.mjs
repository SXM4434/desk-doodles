// CATALOG ORBIT — turntable verify driver. Drives tools/3d/catalog-orbit.html
// headless through window.__orbit and renders, per proof object, an 8-angle
// TURNTABLE contact sheet (+ the product's resting ¾ frame + the true head-on
// frame) so the "exactly the Rock-3D look, just rotatable" bar can be checked
// by eye: front = the object's Rock-3D render · rotates cleanly · sides/back
// hand-drawn (not clay, not a flat wall).
//
//   npx vite build   --config tools/3d/vite.orbit.config.ts --outDir /tmp/dd-orbit-dist
//   npx vite preview --config tools/3d/vite.orbit.config.ts --outDir /tmp/dd-orbit-dist --port 4497
//   node tools/3d/catalog-orbit-verify.mjs
//
// Env: ORBIT_URL (default :4497) · OUT_DIR (default /tmp/dd-orbit) ·
//      OBJECTS="sketchbook,polaroid,…" · STYLE=svg-port|hatch|native ·
//      MODE=extrude|solid|… · DEPTH=0.48
//
// READ-ONLY: drives the tool page, never edits src.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let chromium;
for (const p of [
  '/tmp/dd-pp/node_modules/playwright',
  '/Users/sebs/Desktop/Projects/portfolio/tools/lab-screenshots/node_modules/playwright',
]) {
  try { ({ chromium } = require(p)); break; } catch { /* next */ }
}
if (!chromium) { console.error('FATAL: playwright not found'); process.exit(2); }

const BASE_URL = process.env.ORBIT_URL ?? 'http://localhost:4497/tools/3d/catalog-orbit.html';
const OUT_DIR = process.env.OUT_DIR ?? '/tmp/dd-orbit';
const STYLE = process.env.STYLE ?? 'svg-port';
const MODE = process.env.MODE ?? 'extrude';
const DEPTH = process.env.DEPTH ? parseFloat(process.env.DEPTH) : null;
// The 7 proof objects (task-locked): 5 catalog + glyphs A and R.
const TARGETS = (process.env.OBJECTS ??
  'sketchbook,polaroid,collectorTin,vhsClamshell,framedRacePhoto,A,R').split(',');

mkdirSync(join(OUT_DIR, 'cells'), { recursive: true });
mkdirSync(join(OUT_DIR, 'sheets'), { recursive: true });

// Product camera direction (Stroke3DScene FRAME_DIR = (0.5, 0.55, 1).normalize()):
// the resting ¾ view. Head-on = tumble the FORM to face that camera.
const CAM_AZ = Math.atan2(0.5, 1);                       // ≈ 0.4636 rad
const CAM_EL = -Math.atan2(0.55, Math.hypot(0.5, 1));    // ≈ −0.4574 rad (tip +z up to camera)
const STEPS = 8;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1000, height: 860 } });
const sheetPage = await browser.newPage({ viewport: { width: 1900, height: 1200 } });
const consoleErrors = [];
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 240)); });
page.on('pageerror', (e) => consoleErrors.push('PAGEERR ' + String(e).slice(0, 240)));

console.log('→', BASE_URL);
await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__orbitReady === true, { timeout: 60000 });
const shapes = await page.evaluate(() => window.__orbit.shapes);
console.log(`inventory: ${shapes.length} (197 catalog + ${shapes.filter((s) => s.kind === 'glyph').length} glyphs)`);

const frames = (n) => page.evaluate(
  (k) => new Promise((res) => {
    let i = 0;
    const tick = () => (++i >= k ? res(null) : requestAnimationFrame(tick));
    requestAnimationFrame(tick);
  }),
  n,
);

async function shot() {
  const dataUrl = await page.evaluate(() => window.__orbit.shot());
  if (!dataUrl) return null;
  return Buffer.from(dataUrl.split(',')[1], 'base64');
}

/** Wait until two consecutive shots are byte-identical (svg-port texture is
 *  async — pre-texture frames differ from the settled render). */
async function settle(maxMs = 9000) {
  const t0 = Date.now();
  let prev = await shot();
  while (Date.now() - t0 < maxMs) {
    await new Promise((r) => setTimeout(r, 350));
    await frames(3);
    const cur = await shot();
    if (prev && cur && prev.equals(cur)) return;
    prev = cur;
  }
}

async function makeSheet(title, rows, outPath) {
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const rowHtml = rows.map((r) => {
    const cells = r.cells.map((c) =>
      `<figure><img src="data:image/png;base64,${c.b64}"/><figcaption>${esc(c.cap)}</figcaption></figure>`,
    ).join('');
    return `<div class="row"><div class="rl">${esc(r.label)}</div><div class="cells">${cells}</div></div>`;
  }).join('');
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    body{margin:0;padding:14px;background:#fdfcf9;color:#3b362e;font:11px/1.3 monospace}
    h1{font-size:14px;margin:0 0 12px;border-bottom:2px solid #3b362e;padding-bottom:5px}
    .row{display:flex;align-items:flex-start;gap:8px;margin-bottom:10px;border-bottom:1px solid #e6e0d4;padding-bottom:8px}
    .rl{width:110px;flex:0 0 110px;font-weight:700;word-break:break-word}
    .cells{display:flex;flex-wrap:wrap;gap:6px}
    figure{margin:0;width:168px}
    figure img{display:block;width:168px;height:140px;border:1px solid #d8d2c6;background:#fff;object-fit:cover}
    figcaption{font-size:9px;padding:2px 0;color:#6f6a60}
  </style></head><body><h1>${esc(title)}</h1>${rowHtml}</body></html>`;
  await sheetPage.setContent(html, { waitUntil: 'networkidle' });
  const body = await sheetPage.$('body');
  await body.screenshot({ path: outPath });
}

// Apply the run config once.
const POLARITY = process.env.POLARITY ?? null; // pos | neg (default = app default)
await page.evaluate(
  ({ style, mode, depth, polarity }) => {
    const partial = { style3d: style, geometryMode: mode };
    if (depth != null) partial.depth = depth;
    if (polarity) {
      window.__svgPortPolarity = polarity;
      partial.polarity = polarity;
    }
    window.__orbit.set(partial);
  },
  { style: STYLE, mode: MODE, depth: DEPTH, polarity: POLARITY },
);

for (const target of TARGETS) {
  const idx = shapes.findIndex((s) => s.shape === target);
  if (idx < 0) { console.log(`✗ ${target}: not in inventory`); continue; }
  const info = await page.evaluate((i) => window.__orbit.pick(i), idx);
  console.log(`[${target}] strokes=${info.strokes} markup=${info.hasMarkup}`);
  // reset to rest, let the async svg-port texture land
  await page.evaluate(() => window.__orbit.tumble(0, 0));
  await new Promise((r) => setTimeout(r, 1200));
  await settle();

  const cells = [];
  // Cell 0 — the product's RESTING ¾ frame (what the desk/canvas shows).
  {
    const buf = await shot();
    writeFileSync(join(OUT_DIR, 'cells', `${target}-rest.png`), buf);
    cells.push({ b64: buf.toString('base64'), cap: 'REST — product ¾ (Rock-3D presentation)' });
  }
  // Cells 1..8 — level yaw turntable, head-on first (az compensates the camera).
  for (let k = 0; k < STEPS; k++) {
    const az = CAM_AZ + (k * 2 * Math.PI) / STEPS;
    await page.evaluate(({ az, el }) => window.__orbit.tumble(az, el), { az, el: CAM_EL });
    await frames(10);
    await new Promise((r) => setTimeout(r, 120));
    const buf = await shot();
    const deg = Math.round((k * 360) / STEPS);
    writeFileSync(join(OUT_DIR, 'cells', `${target}-t${String(deg).padStart(3, '0')}.png`), buf);
    cells.push({ b64: buf.toString('base64'), cap: k === 0 ? `${deg}° — HEAD-ON front` : `${deg}°` });
  }
  await page.evaluate(() => window.__orbit.tumble(0, 0));
  await makeSheet(
    `ORBIT TURNTABLE — ${target} · style=${STYLE} mode=${MODE}${DEPTH != null ? ` depth=${DEPTH}` : ''} (front + 45° steps + product rest)`,
    [{ label: target, cells }],
    join(OUT_DIR, 'sheets', `turntable-${target}.png`),
  );
  console.log(`  sheet → ${join(OUT_DIR, 'sheets', `turntable-${target}.png`)}`);
}

await browser.close();
if (consoleErrors.length) {
  console.log('console errors:', [...new Set(consoleErrors)].slice(0, 8));
} else {
  console.log('0 console errors');
}
console.log('out →', OUT_DIR);
