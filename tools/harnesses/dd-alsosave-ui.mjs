// Verify the "Also save to: Drawer / Shelf" UI in the edit modal (forced via
// window.__forceAllowDrawer). Place a mine object, open edit, screenshot the modal,
// toggle the pills, confirm aria-pressed flips.
import puppeteer from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: CHROME, headless: false, args: ['--window-size=1500,1000'], defaultViewport: { width: 1500, height: 1000 } });
const p = await b.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 120)));
await p.evaluateOnNewDocument(() => { window.__forceAllowDrawer = true; });
await p.goto('http://localhost:5182/desk?demo=1', { waitUntil: 'networkidle2', timeout: 60000 });
await sleep(4500);
const clickByText = (re) => p.evaluate((r) => { const x = [...document.querySelectorAll('button')].find((e) => new RegExp(r, 'i').test((e.textContent || '').trim())); if (x) { x.click(); return (x.textContent || '').trim(); } return null; }, re.source);
console.log('add doodle:', await clickByText(/add doodle/)); await sleep(1400);
console.log('upload svg:', await clickByText(/upload svg/)); await sleep(800);
const fi = await p.$('input[type=file]'); if (fi) { await fi.uploadFile('/tmp/dd-icon-test.svg'); } await sleep(3200);
console.log('done(upload):', await clickByText(/^done$/)); await sleep(1400);
console.log('place:', await clickByText(/place on desk/)); await sleep(2500);
const cardOpen = () => p.evaluate(() => [...document.querySelectorAll('button')].some((x) => (x.textContent || '').trim() === 'Delete'));
const boxes = await p.evaluate(() => [...document.querySelectorAll('div')].filter((d) => d.style.width === '180px' && d.style.height === '180px' && d.style.position === 'relative').map((d) => { const r = d.getBoundingClientRect(); return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) }; }));
let opened = false;
for (const pt of boxes) { await p.mouse.click(pt.x, pt.y); await sleep(1300); if (await cardOpen()) { opened = true; break; } const c = await p.evaluate(() => { const x = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').trim() === 'Close'); if (x) { x.click(); return true; } return false; }); if (c) await sleep(400); }
console.log('edit card opened:', opened);
if (opened) {
  const present = await p.evaluate(() => document.body.innerText.includes('Also save to'));
  console.log('"Also save to" row present:', present);
  // toggle Drawer + read aria-pressed
  const before = await p.evaluate(() => { const d = [...document.querySelectorAll('button')].find((x) => (x.textContent || '').trim() === 'Drawer'); return d ? d.getAttribute('aria-pressed') : 'no-btn'; });
  await p.evaluate(() => { const d = [...document.querySelectorAll('button')].find((x) => (x.textContent || '').trim() === 'Drawer'); if (d) d.click(); });
  await sleep(400);
  const after = await p.evaluate(() => { const d = [...document.querySelectorAll('button')].find((x) => (x.textContent || '').trim() === 'Drawer'); return d ? d.getAttribute('aria-pressed') : 'no-btn'; });
  console.log('Drawer aria-pressed before:', before, '→ after click:', after);
  // screenshot the modal
  const card = await p.evaluate(() => { const els = [...document.querySelectorAll('div')].filter((d) => { const r = d.getBoundingClientRect(); return r.width > 380 && r.width < 760 && r.height > 360 && d.textContent.includes('Also save to'); }); const e = els[els.length - 1]; if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; });
  if (card) await p.screenshot({ path: '/tmp/dd-shots/alsosave-ui.png', clip: { x: Math.max(0, card.x), y: Math.max(0, card.y), width: card.w, height: card.h } });
  else await p.screenshot({ path: '/tmp/dd-shots/alsosave-ui.png' });
}
console.log('errors:', errs.filter((e) => !/Supabase|RPC|v5|404|400|fetch/i.test(e)).slice(0, 4));
await b.close();
