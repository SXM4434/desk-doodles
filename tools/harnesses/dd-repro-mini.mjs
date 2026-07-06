// Reproduce the "mini on/behind each 3D object" with a REAL placed object (draw →
// Done → Place makes it "mine", the state demo objects lack). Then flip to 3D and
// capture + probe the object box children.
import puppeteer from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: CHROME, headless: false, args: ['--window-size=1500,1000'], defaultViewport: { width: 1500, height: 1000 } });
const p = await b.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 100)));
await p.goto('http://localhost:5182/desk?demo=1', { waitUntil: 'networkidle2', timeout: 60000 });
await sleep(4500);
async function clickText(t) { const h = await p.evaluateHandle((x) => [...document.querySelectorAll('button')].find((b) => (b.textContent || '').trim().toLowerCase() === x.toLowerCase()) || null, t); const el = h.asElement(); if (el) { await el.click(); return true; } return false; }
async function clickContains(t) { const h = await p.evaluateHandle((x) => [...document.querySelectorAll('button')].find((b) => (b.textContent || '').trim().toLowerCase().includes(x.toLowerCase())) || null, t); const el = h.asElement(); if (el) { await el.click(); return true; } return false; }

console.log('add doodle:', await clickContains('add doodle')); await sleep(1500);
// draw a closed circle in the panel center
const cx = 520, cy = 470, R = 120;
const pts = []; for (let a = 0; a <= 370; a += 12) { const r = (a * Math.PI) / 180; pts.push([Math.round(cx + R * Math.cos(r)), Math.round(cy + R * Math.sin(r))]); }
await p.mouse.move(pts[0][0], pts[0][1]); await p.mouse.down();
for (const [x, y] of pts.slice(1)) { await p.mouse.move(x, y); await sleep(10); }
await p.mouse.up(); await sleep(800);
console.log('done:', await clickText('Done')); await sleep(1200);
console.log('place:', await clickContains('Place')); await sleep(2500);

// flip to 3D
await clickText('Desk'); await sleep(500);
await clickText('3D'); await sleep(2200);
// zoom in
await p.mouse.move(740, 470); await p.keyboard.down('Control');
for (let i = 0; i < 8; i++) { await p.mouse.wheel({ deltaY: -120 }); await sleep(55); }
await p.keyboard.up('Control'); await sleep(1200);
await p.screenshot({ path: '/tmp/dd-shots/repro-mini.png' });

// probe object boxes (size 180, position relative) — children opacity/svg/canvas
const probe = await p.evaluate(() => {
  const boxes = [...document.querySelectorAll('div')].filter((d) => d.style.width === '180px' && d.style.height === '180px' && d.style.position === 'relative');
  return boxes.slice(0, 6).map((box) => [...box.children].map((c) => { const cs = getComputedStyle(c); const r = c.getBoundingClientRect(); return { op: cs.opacity, disp: cs.display, w: Math.round(r.width), h: Math.round(r.height), nSvg: c.querySelectorAll('svg').length }; }));
});
console.log('object boxes:', probe.length);
console.log(JSON.stringify(probe, null, 1));
console.log('errors', errs.slice(0, 4));
await b.close();
