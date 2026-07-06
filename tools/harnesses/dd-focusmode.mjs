// Verify FOCUS-MODE lift: tap a doodle, capture frames during the entrance (card
// should grow FROM the tapped spot to full center), then the settled state, then
// the exit (Escape → settle back). Confirms the card lifts in place + no errors.
import puppeteer from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: CHROME, headless: false, args: ['--window-size=1500,1000'], defaultViewport: { width: 1500, height: 1000 } });
const p = await b.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 110)));
await p.goto('http://localhost:5182/desk?demo=1', { waitUntil: 'networkidle2', timeout: 60000 });
await sleep(4500);
// find an object box near a CORNER so the lift-from-spot offset is obvious
const obj = await p.evaluate(() => { const boxes = [...document.querySelectorAll('div')].filter((d) => d.style.width === '180px' && d.style.height === '180px' && d.style.position === 'relative').map((d) => { const r = d.getBoundingClientRect(); return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) }; }); return boxes.sort((a, b) => (a.x + a.y) - (b.x + b.y))[0] || null; });
if (!obj) { console.log('no object'); await b.close(); process.exit(0); }
console.log('tapping object at', JSON.stringify(obj));
// tap (mousedown+up quickly = a click, opens the surface)
await p.mouse.move(obj.x, obj.y); await p.mouse.down(); await sleep(20); await p.mouse.up();
// capture entrance frames
await sleep(70);  await p.screenshot({ path: '/tmp/dd-shots/focus-1-early.png' });
await sleep(150); await p.screenshot({ path: '/tmp/dd-shots/focus-2-mid.png' });
await sleep(500); await p.screenshot({ path: '/tmp/dd-shots/focus-3-full.png' });
const open = await p.evaluate(() => [...document.querySelectorAll('button')].some((x) => /^(delete|close)$/i.test((x.textContent || '').trim())));
console.log('surface open (full):', open);
// exit — Escape → settle back
await p.keyboard.press('Escape');
await sleep(120); await p.screenshot({ path: '/tmp/dd-shots/focus-4-exit.png' });
await sleep(400);
const closed = await p.evaluate(() => ![...document.querySelectorAll('button')].some((x) => /^(delete|close)$/i.test((x.textContent || '').trim())));
console.log('closed after exit:', closed);
console.log('errors:', errs.filter((e) => !/Supabase|RPC|v5|fetch|404|400/i.test(e)).slice(0, 4));
await b.close();
