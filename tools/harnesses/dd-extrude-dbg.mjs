import puppeteer from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: CHROME, headless: false, args: ['--window-size=1500,1000'], defaultViewport: { width: 1500, height: 1000 } });
const p = await b.newPage();
await p.goto('http://localhost:5182/canvas', { waitUntil: 'networkidle2', timeout: 60000 });
await sleep(3200);
const box = await p.evaluate(() => { const el = document.querySelector('.dd-draw-surface, svg[role="img"], .dd-canvas, main') || document.body; const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
const cx = Math.round(box.x + box.w * 0.5), cy = Math.round(box.y + box.h * 0.5);
const stroke = async (pts) => { await p.mouse.move(pts[0][0], pts[0][1]); await p.mouse.down(); for (const [x, y] of pts.slice(1)) { await p.mouse.move(x, y); await sleep(7); } await p.mouse.up(); await sleep(140); };
const ring = []; for (let d = 0; d <= 360; d += 14) { const t = d * Math.PI / 180; ring.push([Math.round(cx + 45 * Math.cos(t)), Math.round(cy + 45 * Math.sin(t))]); }
await stroke(ring);
for (let i = 0; i < 8; i++) { const t = i * Math.PI / 4; await stroke([[Math.round(cx + 60 * Math.cos(t)), Math.round(cy + 60 * Math.sin(t))], [Math.round(cx + 110 * Math.cos(t)), Math.round(cy + 110 * Math.sin(t))]]); }
await sleep(400);
const set = (fn, ...x) => p.evaluate((f, args) => { const s = window.__ddSet; if (s && s[f]) s[f](...args); }, fn, x);
await set('setMode', '3d'); await sleep(1100);
await set('setStyle3d', 'native'); await sleep(1100);
await p.evaluate(() => { window.__extrudeDbg = []; });
await set('setGeometryMode', 'extrude'); await sleep(2200);
const dbg = await p.evaluate(() => window.__extrudeDbg || []);
console.log('extrude per-stroke:', JSON.stringify(dbg));
await b.close();
