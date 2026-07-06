// TRIPLE-CHECK (Sebs 2026-06-20 "triple check + no lag"): all 11 svg styles on the
// DESK in 3D svg-port — for EACH: measure the restyle LAG (max frame gap) AND
// capture the render (distinctness). Then a toggle pass. No sampling — every style.
import puppeteer from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: CHROME, headless: false, args: ['--window-size=1500,1000'], defaultViewport: { width: 1500, height: 1000 } });
const p = await b.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 100)));
await p.goto('http://localhost:5182/desk?demo=1', { waitUntil: 'networkidle2', timeout: 60000 });
await sleep(4500);
async function clickText(t) { const h = await p.evaluateHandle((x) => [...document.querySelectorAll('button')].find((b) => (b.textContent || '').trim().toLowerCase() === x.toLowerCase()) || null, t); const el = h.asElement(); if (el) { await el.click(); return true; } return false; }
async function openTrigger(substr) { return await p.evaluate((x) => { const t = [...document.querySelectorAll('.dd-dropdown-trigger')].find((e) => (e.textContent || '').toLowerCase().includes(x.toLowerCase())); if (t) { t.click(); return (t.textContent || '').trim(); } return null; }, substr); }
async function pickOption(substr) { return await p.evaluate((x) => { const o = [...document.querySelectorAll('[role=option]')].find((e) => (e.textContent || '').toLowerCase().trim() === x.toLowerCase() || (e.textContent || '').toLowerCase().includes(x.toLowerCase())); if (o) { o.click(); return true; } return false; }, substr); }
async function maxFrameGap(ms) { return await p.evaluate((dur) => new Promise((res) => { let last = performance.now(); let max = 0; const t0 = last; function tick(now) { const d = now - last; if (d > max) max = d; last = now; if (now - t0 < dur) requestAnimationFrame(tick); else res(Math.round(max)); } requestAnimationFrame(tick); }), ms); }
async function resetZoom() { await p.keyboard.down('Control'); await p.keyboard.press('0'); await p.keyboard.up('Control'); await sleep(700); await p.mouse.move(740, 470); await p.keyboard.down('Control'); for (let i = 0; i < 8; i++) { await p.mouse.wheel({ deltaY: -120 }); await sleep(55); } await p.keyboard.up('Control'); await sleep(800); }

await clickText('Desk'); await sleep(600);
await clickText('3D'); await sleep(1800);
await openTrigger('native'); await sleep(400);
await pickOption('svg-port'); await sleep(2500);

const clip = { x: 0, y: 560, width: 1100, height: 440 };
const STYLES = ['Clean', 'Outline only', 'Wireframe', 'Rough hand', 'Sketchy', 'Charcoal', 'Wet ink', 'Risograph', 'Bold ink', 'Stipple', 'Newsprint'];
let prev = 'rough'; const lags = [];
for (const s of STYLES) {
  let opened = null;
  for (const lbl of [prev, 'clean', 'rough', 'bold', 'stipple', 'sketchy', 'wire', 'char', 'wet', 'riso', 'news', 'outline']) { opened = await openTrigger(lbl); if (opened && opened.toLowerCase() !== 'native' && !opened.toLowerCase().includes('svg-port') && !opened.toLowerCase().includes('matte') && !opened.toLowerCase().includes('auto')) break; opened = null; }
  await sleep(300);
  await pickOption(s);
  const gap = await maxFrameGap(2200);              // LAG of this restyle burst
  lags.push({ style: s, maxFrameGapMs: gap });
  await resetZoom();
  const safe = s.toLowerCase().replace(/\s+/g, '-');
  await p.screenshot({ path: `/tmp/dd-shots/tc-${safe}.png`, clip });
  prev = s.split(' ')[0];
  console.log(`${s}: maxFrameGap=${gap}ms`);
}
console.log('LAGS', JSON.stringify(lags));
console.log('worst frame gap (ms):', Math.max(...lags.map((l) => l.maxFrameGapMs)));
console.log('errors', errs.slice(0, 5));
await b.close();
