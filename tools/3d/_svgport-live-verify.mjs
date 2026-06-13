// LIVE end-to-end svg-port verify — drives the REAL /canvas product flow:
// draw a doodle through the actual pointer pipeline → flip to 3D → svg-port →
// capture front + orbit, paired with the 2D styled render (the vibe target).
// Tests the real wiring (DrawSurface → SvgStyleTransform.onRender →
// Stroke3DScene svgPort material) and surfaces any runtime error in the new
// code. READ-ONLY product flow; /canvas is the test surface (no live DB).
import { writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let chromium;
for (const p of ['/tmp/dd-pp/node_modules/playwright', '/Users/sebs/Desktop/Projects/portfolio/tools/lab-screenshots/node_modules/playwright']) {
  try { ({ chromium } = require(p)); break; } catch { /* next */ }
}
if (!chromium) { console.error('no playwright'); process.exit(2); }

const URL = process.env.DD_URL ?? 'http://localhost:5182/canvas';
const GEO = process.env.GEO ?? 'Solid';
const OUT = '/tmp/dd-svgport-after';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 2 });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + String(e)));

await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(800);

// Locate the pointer-capture draw svg (last svg in <main>) → its screen box.
const box = await page.evaluate(() => {
  const svgs = [...document.querySelectorAll('main svg')];
  const el = svgs[svgs.length - 1];
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.x, y: r.y, w: r.width, h: r.height };
});
if (!box) { console.error('no draw svg found'); await browser.close(); process.exit(3); }

// Draw a FACE in viewBox-relative coords (mapped into the box). Closed head +
// two eyes + a smile — multi-feature, the real "weird input" shape class.
const P = (nx, ny) => ({ x: box.x + nx * box.w, y: box.y + ny * box.h });
async function stroke(pts) {
  const f = P(pts[0][0], pts[0][1]);
  await page.mouse.move(f.x, f.y);
  await page.mouse.down();
  for (let i = 1; i < pts.length; i++) {
    const q = P(pts[i][0], pts[i][1]);
    await page.mouse.move(q.x, q.y, { steps: 3 });
  }
  await page.mouse.up();
  await page.waitForTimeout(80);
}
// head (closed circle, 24 segs)
const head = [];
for (let i = 0; i <= 24; i++) { const a = (i / 24) * Math.PI * 2; head.push([0.5 + 0.32 * Math.cos(a), 0.5 + 0.34 * Math.sin(a)]); }
await stroke(head);
// eyes
await stroke([[0.40, 0.42], [0.41, 0.46], [0.40, 0.50]]);
await stroke([[0.60, 0.42], [0.61, 0.46], [0.60, 0.50]]);
// smile
await stroke([[0.38, 0.62], [0.5, 0.72], [0.62, 0.62]]);
await page.waitForTimeout(300);

// Set the SVG style (the vibe target) via the dev hook, then screenshot 2D.
const SVG_STYLE = process.env.SVG_STYLE ?? 'bold-ink';
await page.evaluate((s) => window.__ddSet?.setSvgStyle?.(s), SVG_STYLE).catch((e) => errors.push('setSvgStyle: ' + e));
await page.waitForTimeout(400);
const frame = await page.$('main');
await frame.screenshot({ path: `${OUT}/2d-styled.png` });

// Flip to 3D svg-port + geometry via the dev hook (reliable; no dropdown clicks).
await page.evaluate(() => window.__ddSet?.setMode?.('3d')).catch((e) => errors.push('setMode: ' + e));
await page.evaluate(() => window.__ddSet?.setStyle3d?.('svg-port')).catch((e) => errors.push('setStyle3d: ' + e));
await page.evaluate((g) => window.__ddSet?.setGeometryMode?.(g), GEO.toLowerCase()).catch((e) => errors.push('setGeo: ' + e));
// Wait for the async svg-port texture (offscreen render → rasterize → upload).
await page.waitForTimeout(2400);

// Front capture.
await frame.screenshot({ path: `${OUT}/3d-svgport-front.png` });

// Orbit: drag across the GL canvas, then capture.
const gl = await page.evaluate(() => {
  const c = document.querySelector('main canvas');
  if (!c) return null;
  const r = c.getBoundingClientRect();
  return { cx: r.x + r.width / 2, cy: r.y + r.height / 2 };
});
if (gl) {
  await page.mouse.move(gl.cx, gl.cy);
  await page.mouse.down();
  await page.mouse.move(gl.cx + 85, gl.cy + 30, { steps: 18 });
  await page.mouse.up();
  await page.waitForTimeout(500);
  await frame.screenshot({ path: `${OUT}/3d-svgport-orbit.png` });
}

// Receipt: what the scene actually built.
const receipt = await page.evaluate(() => window.__dd3d ?? null);
console.log('__dd3d receipt:', JSON.stringify(receipt));
console.log('console errors:', errors.length ? errors.slice(0, 8) : 'NONE');
await browser.close();
console.log(`wrote ${OUT}/{2d-styled,3d-svgport-front,3d-svgport-orbit}.png`);
