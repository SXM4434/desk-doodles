// HUNT the "little mini version of the object in the middle" (Sebs 2026-06-21).
// Flip the desk to 3D, zoom hard onto ONE object, capture native + svg-port, and
// dump candidate small/duplicate render elements + the 3D canvas count.
import puppeteer from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: CHROME, headless: false, args: ['--window-size=1500,1000'], defaultViewport: { width: 1500, height: 1000 } });
const p = await b.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 100)));
await p.goto('http://localhost:5182/desk?demo=1', { waitUntil: 'networkidle2', timeout: 60000 });
await sleep(4500);
async function clickText(t) { const h = await p.evaluateHandle((x) => [...document.querySelectorAll('button')].find((b) => (b.textContent || '').trim().toLowerCase() === x.toLowerCase()) || null, t); const el = h.asElement(); if (el) { await el.click(); return true; } return false; }
async function openTrigger(s) { return await p.evaluate((x) => { const t = [...document.querySelectorAll('.dd-dropdown-trigger')].find((e) => (e.textContent || '').toLowerCase().includes(x.toLowerCase())); if (t) { t.click(); return (t.textContent || '').trim(); } return null; }, s); }
async function pickOption(s) { return await p.evaluate((x) => { const o = [...document.querySelectorAll('[role=option]')].find((e) => (e.textContent || '').toLowerCase().includes(x.toLowerCase())); if (o) { o.click(); return true; } return false; }, s); }

await clickText('Desk'); await sleep(600);
await clickText('3D'); await sleep(2000);
// zoom hard onto one object
await p.mouse.move(740, 470); await p.keyboard.down('Control');
for (let i = 0; i < 14; i++) { await p.mouse.wheel({ deltaY: -120 }); await sleep(50); }
await p.keyboard.up('Control'); await sleep(1200);
await p.screenshot({ path: '/tmp/dd-shots/mini-native.png' });

// DOM dump: every element inside the desk with a render (svg/canvas/bg-image) and
// its size — flag small ones (a mini copy) and report the 3D canvas count.
const dump = await p.evaluate(() => {
  const desk = document.querySelector('.dd-desk') || document.body;
  const out = [];
  desk.querySelectorAll('svg, canvas').forEach((el) => {
    const r = el.getBoundingClientRect();
    out.push({ tag: el.tagName.toLowerCase(), w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.x), y: Math.round(r.y), cls: (el.getAttribute('class') || '').slice(0, 30) });
  });
  return { canvases: desk.querySelectorAll('canvas').length, svgs: desk.querySelectorAll('svg').length, els: out.slice(0, 40) };
});
console.log('3D canvases:', dump.canvases, ' SVGs:', dump.svgs);
console.log('render elements (small = mini suspect):');
for (const e of dump.els) console.log(`  ${e.tag} ${e.w}x${e.h} @(${e.x},${e.y}) ${e.cls}`);

// also try svg-port to see if the mini is style-dependent
await openTrigger('native'); await sleep(400); await pickOption('svg'); await sleep(2500);
await p.screenshot({ path: '/tmp/dd-shots/mini-svgport.png' });
console.log('errors', errs.slice(0, 4));
await b.close();
