// Diagnose RC-2 "open-tangle buries interior": draw a DENSE open tangle (a messy
// continuous scribble that self-crosses many times) and render in auto + solid.
// If solid fuses it into a featureless mass that buries the interior lines, it's a
// real bug; if the interior survives, the per-stroke/loop guards already hold.
import puppeteer from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: CHROME, headless: false, args: ['--window-size=1500,1000'], defaultViewport: { width: 1500, height: 1000 } });
const p = await b.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 100)));
await p.goto('http://localhost:5182/canvas', { waitUntil: 'networkidle2', timeout: 60000 });
await sleep(3200);
const box = await p.evaluate(() => { const el = document.querySelector('.dd-draw-surface, svg[role="img"], .dd-canvas, main') || document.body; const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
const cx = Math.round(box.x + box.w * 0.5), cy = Math.round(box.y + box.h * 0.5);
const stroke = async (pts) => { await p.mouse.move(pts[0][0], pts[0][1]); await p.mouse.down(); for (const [x, y] of pts.slice(1)) { await p.mouse.move(x, y); await sleep(5); } await p.mouse.up(); await sleep(160); };
// one continuous self-crossing tangle (a spirograph-ish scribble ball)
const tangle = [];
for (let i = 0; i <= 220; i++) { const t = i * 0.32; const r = 40 + 50 * Math.sin(t * 0.7); tangle.push([Math.round(cx + r * Math.cos(t)), Math.round(cy + r * Math.sin(t * 1.3))]); }
await stroke(tangle);
await sleep(400);
const set = (fn, ...x) => p.evaluate((f, args) => { const s = window.__ddSet; if (s && s[f]) s[f](...args); }, fn, x);
await set('setMode', '3d'); await sleep(1200);
await set('setStyle3d', 'native'); await sleep(1200);
const cv = await p.evaluate(() => { const c = document.querySelector('canvas'); if (!c) return null; const r = c.getBoundingClientRect(); return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) }; });
if (cv) { await p.mouse.move(cv.x, cv.y); await p.mouse.down(); await p.mouse.move(cv.x + 45, cv.y + 28, { steps: 12 }); await p.mouse.up(); await sleep(700); }
for (const mode of ['auto', 'solid']) {
  await set('setGeometryMode', mode); await sleep(2400);
  await p.screenshot({ path: `/tmp/dd-shots/tangle-${mode}.png`, clip: { x: 320, y: 220, width: 780, height: 600 } });
  console.log('mode', mode, 'rendered');
}
console.log('errors', errs.slice(0, 3));
await b.close();
