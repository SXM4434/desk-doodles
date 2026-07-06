// Verify (Sebs "i click svg port and no toggles appear"): the mesh Engraved style
// now shows the 2D Restyle controls ("what's carved in") AND they drive the mesh
// engraving live. Open the Quiver gameboy mesh, set style SVG-port, assert the
// controls appear, then change the SVG style and pixel-diff the 3D well.
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = process.env.DD_OUT || '/tmp/engrave-toggles';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
mkdirSync(OUT, { recursive: true });
const diff = (a, b) => { const n = Math.min(a.length, b.length); let s = 0; for (let i = 0; i < n; i++) s += Math.abs(a[i] - b[i]); return s / n; };
const browser = await puppeteer.launch({ executablePath: CHROME, headless: false, args: ['--window-size=1500,1000'], defaultViewport: { width: 1500, height: 1000 } });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const pick = async (cur, opt) => { await page.evaluate((c) => { const d = document.querySelector('[role="dialog"]'); const t = [...d.querySelectorAll('button[aria-haspopup="listbox"]')].find((b) => b.textContent.toLowerCase().includes(c.toLowerCase())); if (t) t.click(); }, cur); await sleep(320); return page.evaluate((o) => { const x = [...document.querySelectorAll('button[role="option"]')].find((b) => b.textContent.trim().toLowerCase().startsWith(o.toLowerCase())); if (x) { x.click(); return true; } return false; }, opt); };
let clip;
const shot = async (n) => { await sleep(2400); return page.screenshot({ clip, encoding: 'binary', path: `${OUT}/${n}.png` }); };
const report = {};
try {
  await page.goto('http://localhost:5182/desk?test=quiver', { waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForSelector('canvas', { timeout: 30000 });
  await sleep(7000);
  let opened = false;
  for (let a = 0; a < 3 && !opened; a++) {
    const box = await page.$eval('[data-desk-obj-id="quiver-0"]', (e) => { const b = e.getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; });
    await page.mouse.move(box.x, box.y); await page.mouse.down(); await sleep(70); await page.mouse.up(); await sleep(1300);
    opened = await page.evaluate(() => !!document.querySelector('[role="dialog"]'));
  }
  await page.evaluate(() => { const d = document.querySelector('[role="dialog"]'); const p = [...d.querySelectorAll('button')].filter((b) => b.textContent.trim() === '3D'); if (p[0]) p[0].click(); });
  await sleep(1400);
  clip = await page.evaluate(() => { const d = document.querySelector('[role="dialog"]'); const art = d.querySelector('[data-dd-card-art]') || d.querySelector('canvas'); const r = (art || d).getBoundingClientRect(); return { x: Math.max(0, Math.round(r.x)), y: Math.max(0, Math.round(r.y)), width: Math.round(Math.min(520, r.width)), height: Math.round(Math.min(520, r.height)) }; });
  // set Engraved
  await pick('Native', 'SVG-port');
  await sleep(1200);
  report.beforeControls = await page.evaluate(() => { const d = document.querySelector('[role="dialog"]'); const txt = d.innerText; return { hasCarvedHeader: /what's carved in/i.test(txt), hasSvgStyleDropdown: [...d.querySelectorAll('button[aria-haspopup="listbox"]')].some((b) => /rough hand-drawn|clean|bold ink|charcoal/i.test(b.textContent)) }; });
  const sBefore = await shot('00_engraved_before');
  // change the engraved drawing's SVG style → should re-engrave the mesh
  const styled = await pick('Rough', 'Clean'); // try rough→clean; fallback any
  report.styleSwapped = styled || await pick('Clean', 'Bold');
  const sAfter = await shot('01_engraved_after');
  report.engraveDiff = diff(sBefore, sAfter);
} catch (e) { report.fatal = String(e && e.stack ? e.stack : e); }
report.errors = errors;
console.log(JSON.stringify(report, null, 2));
await browser.close();
