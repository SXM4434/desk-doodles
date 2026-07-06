// BUG C live verify — Native-solid rim vs SVG-port-solid rim, same drawn circle.
// Drives the REAL /canvas flow. A circle is the cleanest silhouette: any rim jag
// shows immediately. Captures Native front, SVG-port front, + SVG-port orbit.
// READ-ONLY product flow; small viewport for vision-overflow safety.
import { writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let chromium;
for (const p of ['/tmp/dd-pp/node_modules/playwright', '/Users/sebs/Desktop/Projects/portfolio/tools/lab-screenshots/node_modules/playwright']) {
  try { ({ chromium } = require(p)); break; } catch { /* next */ }
}
if (!chromium) { console.error('NO_PLAYWRIGHT'); process.exit(2); }

const URL = process.env.DD_URL ?? 'http://localhost:5182/canvas';
const OUT = '/tmp/dd-bugc';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 900, height: 700 }, deviceScaleFactor: 1 });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + String(e)));

try { await page.goto(URL, { waitUntil: 'networkidle', timeout: 15000 }); }
catch (e) { console.error('SERVER_DOWN', String(e)); await browser.close(); process.exit(3); }
await page.waitForTimeout(800);

const box = await page.evaluate(() => {
  const svgs = [...document.querySelectorAll('main svg')];
  const el = svgs[svgs.length - 1];
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.x, y: r.y, w: r.width, h: r.height };
});
if (!box) { console.error('NO_DRAW_SVG'); await browser.close(); process.exit(4); }

const P = (nx, ny) => ({ x: box.x + nx * box.w, y: box.y + ny * box.h });
async function stroke(pts) {
  const f = P(pts[0][0], pts[0][1]);
  await page.mouse.move(f.x, f.y);
  await page.mouse.down();
  for (let i = 1; i < pts.length; i++) {
    const q = P(pts[i][0], pts[i][1]);
    await page.mouse.move(q.x, q.y, { steps: 2 });
  }
  await page.mouse.up();
  await page.waitForTimeout(60);
}

// One clean closed circle — the canonical silhouette test.
const head = [];
for (let i = 0; i <= 40; i++) { const a = (i / 40) * Math.PI * 2; head.push([0.5 + 0.30 * Math.cos(a), 0.5 + 0.34 * Math.sin(a)]); }
await stroke(head);
await page.waitForTimeout(300);

const frame = await page.$('main');

// Flip to 3D, Solid geometry.
await page.evaluate(() => window.__ddSet?.setMode?.('3d')).catch((e) => errors.push('setMode: ' + e));
await page.evaluate(() => window.__ddSet?.setGeometryMode?.('solid')).catch((e) => errors.push('setGeo: ' + e));
await page.waitForTimeout(800);

// NATIVE first.
await page.evaluate(() => window.__ddSet?.setStyle3d?.('native')).catch((e) => errors.push('setStyle3d native: ' + e));
await page.waitForTimeout(1500);
await frame.screenshot({ path: `${OUT}/native-front.png` });
const recNative = await page.evaluate(() => window.__dd3d ?? null);

// SVG-PORT.
await page.evaluate(() => window.__ddSet?.setStyle3d?.('svg-port')).catch((e) => errors.push('setStyle3d svgport: ' + e));
await page.waitForTimeout(2600); // async texture build
await frame.screenshot({ path: `${OUT}/svgport-front.png` });
const recSvg = await page.evaluate(() => window.__dd3d ?? null);

// Orbit svg-port a touch so the rim catches grazing light (jag most visible).
const gl = await page.evaluate(() => {
  const c = document.querySelector('main canvas');
  if (!c) return null;
  const r = c.getBoundingClientRect();
  return { cx: r.x + r.width / 2, cy: r.y + r.height / 2 };
});
if (gl) {
  await page.mouse.move(gl.cx, gl.cy);
  await page.mouse.down();
  await page.mouse.move(gl.cx + 70, gl.cy + 20, { steps: 16 });
  await page.mouse.up();
  await page.waitForTimeout(500);
  await frame.screenshot({ path: `${OUT}/svgport-orbit.png` });
}

console.log('NATIVE __dd3d:', JSON.stringify(recNative));
console.log('SVGPORT __dd3d:', JSON.stringify(recSvg));
console.log('errors:', errors.length ? errors.slice(0, 8) : 'NONE');
await browser.close();
console.log(`wrote ${OUT}/{native-front,svgport-front,svgport-orbit}.png`);
