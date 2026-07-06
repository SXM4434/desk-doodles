import puppeteer from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const b = await puppeteer.launch({ executablePath: CHROME, headless: false, args: ['--window-size=1500,1000'], defaultViewport: { width: 1500, height: 1000 } });
const p = await b.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 80)));
await p.goto('http://localhost:5182/desk?demo=1', { waitUntil: 'networkidle2', timeout: 60000 });
await new Promise((r) => setTimeout(r, 4000));
async function clickText(t) { const h = await p.evaluateHandle((x) => [...document.querySelectorAll('button')].find((b) => (b.textContent || '').trim().toLowerCase() === x.toLowerCase()) || null, t); const el = h.asElement(); if (el) { await el.click(); return true; } return false; }
async function clickTriggerWithText(txt) { return await p.evaluate((x) => { const t = [...document.querySelectorAll('.dd-dropdown-trigger')].find((e) => (e.textContent || '').toLowerCase().includes(x.toLowerCase())); if (t) { t.click(); return true; } return false; }, txt); }
async function pickOption(txt) { return await p.evaluate((x) => { const o = [...document.querySelectorAll('[role=option]')].find((e) => (e.textContent || '').toLowerCase().includes(x.toLowerCase())); if (o) { o.click(); return true; } return false; }, txt); }

await clickText('Desk'); await new Promise((r) => setTimeout(r, 600));
await clickText('3D'); await new Promise((r) => setTimeout(r, 1500));
await clickTriggerWithText('Native') || await clickTriggerWithText('SVG'); // open 3D STYLE
await new Promise((r) => setTimeout(r, 400));
console.log('svg-port:', await pickOption('svg'));
await new Promise((r) => setTimeout(r, 2500));
// Fit/zoom to a few objects: just capture a crop of the desk middle
const clip = { x: 360, y: 90, width: 760, height: 760 };
await p.screenshot({ path: '/tmp/dd-sp-rough.png', clip });
console.log('captured ROUGH');
// change SVG STYLE: trigger currently "Rough hand-drawn"
console.log('open SVG STYLE:', await clickTriggerWithText('Rough hand'));
await new Promise((r) => setTimeout(r, 400));
console.log('pick Stipple:', await pickOption('stipple'));
await new Promise((r) => setTimeout(r, 3500));
await p.screenshot({ path: '/tmp/dd-sp-stipple.png', clip });
console.log('captured STIPPLE. errors:', errs.slice(0, 3));
await b.close();
