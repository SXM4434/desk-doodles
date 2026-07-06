// Deterministic per-style svg-port capture → one contact sheet so the per-style
// carve relief is directly comparable (Sebs 2026-06-20 "improve the differences").
// Same object, same framing each style (reset + identical zoom before every shot).
import puppeteer from 'puppeteer-core';
import { execFileSync } from 'node:child_process';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: CHROME, headless: false, args: ['--window-size=1500,1000'], defaultViewport: { width: 1500, height: 1000 } });
const p = await b.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 100)));
await p.goto('http://localhost:5182/desk?demo=1', { waitUntil: 'networkidle2', timeout: 60000 });
await sleep(4500);
async function clickText(t) { const h = await p.evaluateHandle((x) => [...document.querySelectorAll('button')].find((b) => (b.textContent || '').trim().toLowerCase() === x.toLowerCase()) || null, t); const el = h.asElement(); if (el) { await el.click(); return true; } return false; }
async function openTrigger(substr) { return await p.evaluate((x) => { const t = [...document.querySelectorAll('.dd-dropdown-trigger')].find((e) => (e.textContent || '').toLowerCase().includes(x.toLowerCase())); if (t) { t.click(); return (t.textContent || '').trim(); } return null; }, substr); }
async function pickOption(substr) { return await p.evaluate((x) => { const o = [...document.querySelectorAll('[role=option]')].find((e) => (e.textContent || '').toLowerCase().includes(x.toLowerCase())); if (o) { o.click(); return true; } return false; }, substr); }
async function resetAndZoom() {
  await p.keyboard.down('Control'); await p.keyboard.press('0'); await p.keyboard.up('Control'); await sleep(700);
  await p.mouse.move(740, 470); await p.keyboard.down('Control');
  for (let i = 0; i < 8; i++) { await p.mouse.wheel({ deltaY: -120 }); await sleep(55); }
  await p.keyboard.up('Control'); await sleep(900);
}

await clickText('Desk'); await sleep(600);
await clickText('3D'); await sleep(1800);
await openTrigger('native'); await sleep(400);
await pickOption('svg'); await sleep(2500);

const clip = { x: 0, y: 560, width: 1100, height: 440 };
const STYLES = ['clean', 'rough hand', 'bold ink', 'stipple'];
let prev = 'rough';
const files = [];
for (const style of STYLES) {
  let opened = null;
  for (const lbl of [prev, 'clean', 'rough', 'bold', 'stipple', 'sketchy']) { opened = await openTrigger(lbl); if (opened && opened.toLowerCase() !== 'native') break; opened = null; }
  await sleep(350);
  const picked = await pickOption(style); await sleep(2600);
  await resetAndZoom();
  const safe = style.replace(/\s+/g, '-'); const f = `/tmp/dd-shots/sht-${safe}.png`;
  await p.screenshot({ path: f, clip }); files.push(f);
  prev = style.split(' ')[0];
  console.log(`style=${style} picked=${picked}`);
}
console.log('errors', errs.slice(0, 5));
await b.close();
// Stack the 4 into one labelled contact sheet (ImageMagick if present).
try {
  execFileSync('magick', ['montage', ...files, '-tile', '1x4', '-geometry', '+4+4', '-title', 'svg-port per-style relief (clean/rough/bold-ink/stipple)', '/tmp/dd-shots/SVGPORT-STYLES-SHEET.png']);
  console.log('SHEET /tmp/dd-shots/SVGPORT-STYLES-SHEET.png');
} catch { try { execFileSync('montage', ['-tile', '1x4', '-geometry', '+4+4', ...files, '/tmp/dd-shots/SVGPORT-STYLES-SHEET.png']); console.log('SHEET (montage)'); } catch (e) { console.log('no montage:', String(e).slice(0, 60)); } }
