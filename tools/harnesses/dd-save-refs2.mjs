// Save-path regression (refs refactor): upload+place a MINE object, open its edit
// card, change SVG style, hit Done → confirm clean save (modal closes / local note;
// no JS errors). Exercises handleDone reading config from saveStateRef.
import puppeteer from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: CHROME, headless: false, args: ['--window-size=1500,1000'], defaultViewport: { width: 1500, height: 1000 } });
const p = await b.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 120)));
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
console.log('edit card (mine) opened:', opened);
if (opened) {
  const trig = await p.evaluate(() => { const t = [...document.querySelectorAll('.dd-dropdown-trigger')].find((e) => /clean|rough|sketch|bold/i.test(e.textContent || '')); if (t) { t.click(); return (t.textContent || '').trim(); } return null; });
  await sleep(500);
  const picked = await p.evaluate(() => { const o = [...document.querySelectorAll('[role=option]')].find((e) => /rough|sketch|bold/i.test(e.textContent || '')); if (o) { o.click(); return (o.textContent || '').trim(); } return null; });
  console.log('style trigger:', JSON.stringify(trig), 'picked:', JSON.stringify(picked)); await sleep(1200);
  const doneClicked = await p.evaluate(() => { const d = [...document.querySelectorAll('button')].find((x) => (x.textContent || '').trim() === 'Done'); if (d && !d.disabled) { d.click(); return true; } return false; });
  await sleep(2500);
  const stillOpen = await cardOpen();
  console.log('Done clicked:', doneClicked, '| card still open:', stillOpen);
  console.log('SAVE PATH OK:', doneClicked && !stillOpen ? 'YES (closed = persisted)' : (doneClicked ? 'note-shown (local save)' : 'NO'));
}
console.log('JS errors:', errs.filter((e) => !/Supabase|RPC|v5|updateDoodle|404|400|fetch/i.test(e)).slice(0, 4));
await b.close();
