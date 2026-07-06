// Headed-Chrome verify for the svg-port desk pass (Sebs 2026-06-20):
//  (A) LAG — max frame gap (ms) during a whole-desk svg-port restyle (was the hitch)
//  (B) DIFFERENTIATION — per-style crops so the styles read distinct in 3D
// WebGL can't render headless → real Chrome (headless:false).
import puppeteer from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({
  executablePath: CHROME, headless: false,
  args: ['--window-size=1500,1000'], defaultViewport: { width: 1500, height: 1000 },
});
const p = await b.newPage();
const errs = [];
p.on('pageerror', (e) => errs.push(e.message.slice(0, 100)));
await p.goto('http://localhost:5182/desk?demo=1', { waitUntil: 'networkidle2', timeout: 60000 });
await sleep(4500);

async function clickText(t) {
  const h = await p.evaluateHandle(
    (x) => [...document.querySelectorAll('button')].find((b) => (b.textContent || '').trim().toLowerCase() === x.toLowerCase()) || null, t);
  const el = h.asElement(); if (el) { await el.click(); return true; } return false;
}
async function openTrigger(substr) {
  return await p.evaluate((x) => {
    const t = [...document.querySelectorAll('.dd-dropdown-trigger')].find((e) => (e.textContent || '').toLowerCase().includes(x.toLowerCase()));
    if (t) { t.click(); return (t.textContent || '').trim(); } return null;
  }, substr);
}
async function pickOption(substr) {
  return await p.evaluate((x) => {
    const o = [...document.querySelectorAll('[role=option]')].find((e) => (e.textContent || '').toLowerCase().includes(x.toLowerCase()));
    if (o) { o.click(); return true; } return false;
  }, substr);
}
// Max frame gap over `ms` — a blocking restyle shows up as a big gap.
async function measureMaxFrameGap(ms) {
  return await p.evaluate((dur) => new Promise((res) => {
    let last = performance.now(); let max = 0; const t0 = last;
    function tick(now) { const d = now - last; if (d > max) max = d; last = now; if (now - t0 < dur) requestAnimationFrame(tick); else res(Math.round(max)); }
    requestAnimationFrame(tick);
  }), ms);
}

await clickText('Desk'); await sleep(600);
await clickText('3D'); await sleep(1800);
// 3D STYLE dropdown → svg-port (trigger currently reads "Native")
await openTrigger('native'); await sleep(400);
console.log('svg-port picked:', await pickOption('svg')); await sleep(2800);

const clip = { x: 330, y: 80, width: 820, height: 820 };
const STYLES = ['clean', 'rough hand', 'bold ink', 'stipple'];
let prevTrigger = 'rough'; // SVG STYLE trigger label (demo seeds rough-ish); refind each round
const lags = [];
for (const style of STYLES) {
  // Find + open the SVG STYLE trigger (its label is the LAST picked style). Try a
  // few known labels so we always reopen the right dropdown.
  let opened = null;
  for (const lbl of [prevTrigger, 'clean', 'rough', 'bold', 'stipple', 'sketchy']) {
    opened = await openTrigger(lbl); if (opened) break;
  }
  await sleep(350);
  const picked = await pickOption(style);
  // Measure the lag of THIS restyle (the burst of carve rebuilds).
  const gap = await measureMaxFrameGap(2200);
  lags.push({ style, picked, maxFrameGapMs: gap });
  await sleep(900);
  const safe = style.replace(/\s+/g, '-');
  await p.screenshot({ path: `/tmp/dd-shots/svgport-${safe}.png`, clip });
  prevTrigger = style.split(' ')[0];
  console.log(`style=${style} picked=${picked} maxFrameGap=${gap}ms`);
}
console.log('LAGS', JSON.stringify(lags));
console.log('errors', errs.slice(0, 5));
await b.close();
