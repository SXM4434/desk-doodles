// Zoom into ONE object on the svg-port desk and capture tight per-style crops so
// the per-style carve relief is actually readable (Sebs 2026-06-20 differentiation).
import puppeteer from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({
  executablePath: CHROME, headless: false,
  args: ['--window-size=1500,1000'], defaultViewport: { width: 1500, height: 1000 },
});
const p = await b.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 100)));
await p.goto('http://localhost:5182/desk?demo=1', { waitUntil: 'networkidle2', timeout: 60000 });
await sleep(4500);
async function clickText(t) {
  const h = await p.evaluateHandle((x) => [...document.querySelectorAll('button')].find((b) => (b.textContent || '').trim().toLowerCase() === x.toLowerCase()) || null, t);
  const el = h.asElement(); if (el) { await el.click(); return true; } return false;
}
async function openTrigger(substr) {
  return await p.evaluate((x) => { const t = [...document.querySelectorAll('.dd-dropdown-trigger')].find((e) => (e.textContent || '').toLowerCase().includes(x.toLowerCase())); if (t) { t.click(); return (t.textContent || '').trim(); } return null; }, substr);
}
async function pickOption(substr) {
  return await p.evaluate((x) => { const o = [...document.querySelectorAll('[role=option]')].find((e) => (e.textContent || '').toLowerCase().includes(x.toLowerCase())); if (o) { o.click(); return true; } return false; }, substr);
}

await clickText('Desk'); await sleep(600);
await clickText('3D'); await sleep(1800);
await openTrigger('native'); await sleep(400);
await pickOption('svg'); await sleep(2500);

// ZOOM IN on the desk center — app zooms on ctrl/meta+wheel toward the cursor.
// Hold Control (real modifier) so the native wheel listener sees e.ctrlKey.
const cx = 740, cy = 470;
await p.mouse.move(cx, cy);
await p.keyboard.down('Control');
for (let i = 0; i < 8; i++) { await p.mouse.wheel({ deltaY: -120 }); await sleep(55); }
await p.keyboard.up('Control');
await sleep(1500);

const clip = { x: 0, y: 560, width: 1100, height: 440 };
const STYLES = ['clean', 'rough hand', 'bold ink', 'stipple'];
let prev = 'rough';
for (const style of STYLES) {
  let opened = null;
  for (const lbl of [prev, 'clean', 'rough', 'bold', 'stipple', 'sketchy', 'svg']) { opened = await openTrigger(lbl); if (opened && opened.toLowerCase() !== 'native' && !opened.toLowerCase().includes('svg-port')) break; opened = null; }
  await sleep(350);
  const picked = await pickOption(style);
  await sleep(2600);
  const safe = style.replace(/\s+/g, '-');
  await p.screenshot({ path: `/tmp/dd-shots/spz-${safe}.png`, clip });
  prev = style.split(' ')[0];
  console.log(`zoom style=${style} picked=${picked}`);
}
console.log('errors', errs.slice(0, 5));
await b.close();
