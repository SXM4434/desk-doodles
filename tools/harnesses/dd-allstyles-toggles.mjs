// FULL svg-port 3D verify (Sebs 2026-06-20 "there's more than 4 + what about the
// toggles in each"): /canvas gives programmatic control via window.__ddSet.
//  (1) draw a shape (closed loop + interior marks → lines AND a fill region)
//  (2) flip to 3D svg-port
//  (3) sweep ALL 11 svg styles — confirm each carves a DISTINCT relief
//  (4) sweep the key TOGGLES on one style — confirm they translate to the 3D carve
// WebGL needs real Chrome (headless can't render it).
import puppeteer from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: CHROME, headless: false, args: ['--window-size=1500,1000'], defaultViewport: { width: 1500, height: 1000 } });
const p = await b.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 100)));
await p.goto('http://localhost:5182/canvas', { waitUntil: 'networkidle2', timeout: 60000 });
await sleep(3500);

// Find the draw surface (big svg/canvas area) center.
const box = await p.evaluate(() => {
  const el = document.querySelector('.dd-draw-surface, svg[role="img"], .dd-canvas, main') || document.body;
  const r = el.getBoundingClientRect();
  return { x: r.x, y: r.y, w: r.width, h: r.height };
});
const cx = Math.round(box.x + box.w * 0.5), cy = Math.round(box.y + box.h * 0.5);

// Draw a closed loop (circle) + 2 interior marks with real mouse (trusted events).
async function stroke(pts) {
  await p.mouse.move(pts[0][0], pts[0][1]); await p.mouse.down();
  for (const [x, y] of pts.slice(1)) { await p.mouse.move(x, y); await sleep(8); }
  await p.mouse.up(); await sleep(150);
}
const R = Math.min(box.w, box.h) * 0.20;
const loop = []; for (let a = 0; a <= 360; a += 12) { const r = (a * Math.PI) / 180; loop.push([Math.round(cx + R * Math.cos(r)), Math.round(cy + R * Math.sin(r))]); }
await stroke(loop);                                   // closed region (for fillStyle)
await stroke([[cx - 40, cy - 30], [cx - 20, cy - 30]]); // eye
await stroke([[cx + 20, cy - 30], [cx + 40, cy - 30]]); // eye
await stroke([[cx - 40, cy + 30], [cx, cy + 55], [cx + 40, cy + 30]]); // smile
await sleep(400);

const hasSeam = await p.evaluate(() => !!(window.__ddSet));
console.log('__ddSet present:', hasSeam);
const set = (fn, ...a) => p.evaluate((f, args) => { const s = window.__ddSet; if (s && s[f]) s[f](...args); return !!(s && s[f]); }, fn, a);
await set('setMode', '3d'); await sleep(1200);
await set('setStyle3d', 'svg-port'); await sleep(1800);

const clip = { x: Math.round(cx - 280), y: Math.round(cy - 250), width: 560, height: 500 };
const STYLES = ['clean', 'outline-only', 'wireframe', 'rough-handdrawn', 'sketchy', 'charcoal', 'wet-ink', 'risograph', 'bold-ink', 'stipple', 'newsprint'];
for (const s of STYLES) {
  await set('setSvgStyle', s); await sleep(2300);
  await p.screenshot({ path: `/tmp/dd-shots/all-${s}.png`, clip });
  console.log('style', s);
}

// TOGGLE sweep on rough-handdrawn — confirm modifiers translate to the 3D carve.
await set('setSvgStyle', 'rough-handdrawn'); await sleep(800);
const TOGS = [
  ['wobble-0', 'setMod', 'wobble', 0],
  ['wobble-2', 'setMod', 'wobble', 2],
  ['multi-single', 'setMod', 'multiStroke', 'single'],
  ['multi-heavy', 'setMod', 'multiStroke', 'heavy'],
  ['fill-solid', 'setMod', 'fillStyle', 'solid'],
  ['fill-dots', 'setMod', 'fillStyle', 'dots'],
  ['fill-hachure', 'setMod', 'fillStyle', 'hachure'],
  ['pen-charcoal', 'setMod', 'penTip', 'charcoal'],
  ['pen-plain', 'setMod', 'penTip', 'plain'],
];
for (const [name, fn, k, v] of TOGS) {
  await set(fn, k, v); await sleep(2200);
  await p.screenshot({ path: `/tmp/dd-shots/tog-${name}.png`, clip });
  console.log('toggle', name);
}
console.log('errors', errs.slice(0, 6));
await b.close();
