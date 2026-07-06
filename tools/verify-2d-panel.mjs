// Live check of the modal control panel height (Sebs #30 "the property panel is
// cut off"). Opens a mesh object's modal, measures the control column's hidden
// overflow in 3D and 2D, and screenshots both. Post-fix the column should FILL
// the panel (much less hidden), not cram into the short card.
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = process.env.DD_OUT || '/tmp/unify-2d';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
mkdirSync(OUT, { recursive: true });
const browser = await puppeteer.launch({ executablePath: CHROME, headless: false, args: ['--window-size=1500,1000'], defaultViewport: { width: 1500, height: 1000 } });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`));
const report = {};
const measure = () => page.evaluate(() => {
  const dlg = document.querySelector('[role="dialog"]');
  if (!dlg) return null;
  const scrollers = [...dlg.querySelectorAll('div')].filter((d) => {
    const s = getComputedStyle(d); return s.overflowY === 'auto' && d.scrollHeight > d.clientHeight + 4;
  }).map((d) => ({ sh: d.scrollHeight, ch: d.clientHeight, hidden: d.scrollHeight - d.clientHeight }));
  const b = dlg.getBoundingClientRect();
  return { panelH: Math.round(b.height), scrollers };
});
try {
  await page.goto('http://localhost:5182/desk?test=suzanne', { waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForSelector('canvas', { timeout: 30000 });
  await sleep(6500);
  // Tap (with one retry) until the dialog opens.
  let opened = false;
  for (let attempt = 0; attempt < 3 && !opened; attempt++) {
    const box = await page.$eval('[data-desk-obj-id="suzanne-0"]', (e) => { const b = e.getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; });
    await page.mouse.move(box.x, box.y); await page.mouse.down(); await sleep(70); await page.mouse.up();
    await sleep(1300);
    opened = await page.evaluate(() => !!document.querySelector('[role="dialog"]'));
  }
  report.opened = opened;
  await page.screenshot({ path: `${OUT}/3d.png` });
  report.in3d = await measure();
  // Flip the MODAL to 2D.
  report.flip = await page.evaluate(() => {
    const dlg = document.querySelector('[role="dialog"]'); if (!dlg) return 'no-dialog';
    const p = [...dlg.querySelectorAll('button')].filter((b) => b.textContent && b.textContent.trim() === '2D');
    if (!p[0]) return 'no-pill'; p[0].click(); return 'ok';
  });
  await sleep(1100);
  await page.screenshot({ path: `${OUT}/2d.png` });
  report.in2d = await measure();
} catch (e) { report.fatal = String(e && e.stack ? e.stack : e); }
report.errors = errors;
console.log(JSON.stringify(report, null, 2));
await browser.close();
