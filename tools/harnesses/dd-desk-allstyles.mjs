// ALL 11 svg styles on the DESK (presets applied via the dropdown, on FILLED
// catalog objects) — the honest "more than 4" check (Sebs 2026-06-20). One zoom,
// no camera reset between shots → identical framing, so styles compare directly.
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

await clickText('Desk'); await sleep(600);
await clickText('3D'); await sleep(1800);
await openTrigger('native'); await sleep(400);
await pickOption('svg-port'); await sleep(2500);
async function resetAndZoom() {
  await p.keyboard.down('Control'); await p.keyboard.press('0'); await p.keyboard.up('Control'); await sleep(700);
  await p.mouse.move(740, 470); await p.keyboard.down('Control');
  for (let i = 0; i < 8; i++) { await p.mouse.wheel({ deltaY: -120 }); await sleep(55); }
  await p.keyboard.up('Control'); await sleep(900);
}

const clip = { x: 0, y: 560, width: 1100, height: 440 };
// label substrings as they appear in the SVG STYLE dropdown
const STYLES = ['Clean', 'Outline only', 'Wireframe', 'Rough hand', 'Sketchy', 'Charcoal', 'Wet ink', 'Risograph', 'Bold ink', 'Stipple', 'Newsprint'];
let prev = 'rough';
for (const s of STYLES) {
  let opened = null;
  for (const lbl of [prev, 'clean', 'rough', 'bold', 'stipple', 'sketchy', 'wire', 'char', 'wet', 'riso', 'news', 'outline']) {
    opened = await openTrigger(lbl); if (opened && opened.toLowerCase() !== 'native' && !opened.toLowerCase().includes('svg-port') && !opened.toLowerCase().includes('matte') && !opened.toLowerCase().includes('auto')) break; opened = null;
  }
  await sleep(350);
  const picked = await pickOption(s); await sleep(2300);
  await resetAndZoom();
  const safe = s.toLowerCase().replace(/\s+/g, '-');
  await p.screenshot({ path: `/tmp/dd-shots/desk-${safe}.png`, clip });
  prev = s.split(' ')[0];
  console.log('style', s, 'picked', picked);
}
console.log('errors', errs.slice(0, 5));
await b.close();
