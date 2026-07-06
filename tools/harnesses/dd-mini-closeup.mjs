// Zoom WAY into one 3D object and capture its center, native + svg-port, to find
// the "mini version of the object on it in the middle" (Sebs: on the object, middle, always in 3D).
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
// zoom HARD onto the center object so ONE object fills the frame
await p.mouse.move(740, 470); await p.keyboard.down('Control');
for (let i = 0; i < 18; i++) { await p.mouse.wheel({ deltaY: -120 }); await sleep(50); }
await p.keyboard.up('Control'); await sleep(1200);
await p.screenshot({ path: '/tmp/dd-shots/closeup-native.png' });

await openTrigger('native'); await sleep(400); await pickOption('svg'); await sleep(2500);
await p.screenshot({ path: '/tmp/dd-shots/closeup-svgport.png' });
console.log('captured. errors', errs.slice(0, 4));
await b.close();
