// Open an object's card and capture its LARGE 3D view (reliable, no desk-zoom) to
// finally SEE the "mini version on the object in the middle".
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

// Tap an object (opens its card). Try clicking where an object sits (center band).
await p.mouse.click(720, 470); await sleep(1500);
await p.screenshot({ path: '/tmp/dd-shots/modal-2d.png' });
// Toggle to 3D in the card (button labelled "3D"). Then capture.
console.log('3D toggle:', await clickText('3D')); await sleep(2500);
await p.screenshot({ path: '/tmp/dd-shots/modal-3d.png' });
// switch the card's 3D style to svg-port if there's a trigger
const opened = await p.evaluate(() => { const t = [...document.querySelectorAll('.dd-dropdown-trigger')].find((e) => /native|matte|solid/i.test(e.textContent || '')); if (t) { t.click(); return true; } return false; });
if (opened) { await sleep(400); await p.evaluate(() => { const o = [...document.querySelectorAll('[role=option]')].find((e) => /svg/i.test(e.textContent || '')); if (o) o.click(); }); await sleep(2500); await p.screenshot({ path: '/tmp/dd-shots/modal-3d-svgport.png' }); }
console.log('errors', errs.slice(0, 4));
await b.close();
