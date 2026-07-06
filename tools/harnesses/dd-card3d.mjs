import puppeteer from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: CHROME, headless: false, args: ['--window-size=1500,1000'], defaultViewport: { width: 1500, height: 1000 } });
const p = await b.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 100)));
await p.goto('http://localhost:5182/desk?demo=1', { waitUntil: 'networkidle2', timeout: 60000 });
await sleep(4500);
// find an object's screen center (a 180px box) and click it
const pt = await p.evaluate(() => {
  const box = [...document.querySelectorAll('div')].find((d) => d.style.width === '180px' && d.style.height === '180px' && d.style.position === 'relative');
  if (!box) return null; const r = box.getBoundingClientRect(); return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
});
console.log('object center:', JSON.stringify(pt));
if (pt) { await p.mouse.click(pt.x, pt.y); await sleep(1800); }
await p.screenshot({ path: '/tmp/dd-shots/card-open.png' });
// In the card, look for a 2D/3D toggle and click 3D
const flipped = await p.evaluate(() => { const btns = [...document.querySelectorAll('button')]; const t = btns.find((x) => (x.textContent || '').trim() === '3D'); if (t) { t.click(); return true; } return false; });
console.log('flipped 3D:', flipped); await sleep(2800);
await p.screenshot({ path: '/tmp/dd-shots/card-3d.png' });
console.log('errors', errs.slice(0, 4));
await b.close();
