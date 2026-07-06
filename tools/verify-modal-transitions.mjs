// State-transition + Done check for the unified modal (Sebs about to test it).
// Opens a mesh object's modal and drives the FORM ↔ SURFACE controls through a
// realistic sequence, asserting the controls + render stay consistent (no stuck
// state) and Done closes without error.
//   1. open mesh → expect FORM=AI mesh, a Surface picker.
//   2. FORM → Extrude → expect the panel flips to "3D style" (stroke surface set).
//   3. Surface/style → Hatch, then SVG-port.
//   4. FORM → back to AI mesh → expect the Surface picker returns (mesh set).
//   5. Surface → Engraved.
//   6. Done → modal closes, no error.
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = process.env.DD_OUT || '/tmp/modal-transitions';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
mkdirSync(OUT, { recursive: true });
const browser = await puppeteer.launch({ executablePath: CHROME, headless: false, args: ['--window-size=1500,1000'], defaultViewport: { width: 1500, height: 1000 } });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(`[console] ${m.text()}`); });

const dlgText = () => page.evaluate(() => { const d = document.querySelector('[role="dialog"]'); return d ? d.innerText : null; });
const triggers = () => page.evaluate(() => { const d = document.querySelector('[role="dialog"]'); return d ? [...d.querySelectorAll('button[aria-haspopup="listbox"]')].map((b) => b.textContent.trim().replace(/\s+/g, ' ')) : []; });
const pick = async (currentText, optionText) => {
  const opened = await page.evaluate((currentText) => {
    const d = document.querySelector('[role="dialog"]'); if (!d) return false;
    const t = [...d.querySelectorAll('button[aria-haspopup="listbox"]')].find((b) => b.textContent.toLowerCase().includes(currentText.toLowerCase()));
    if (!t) return false; t.click(); return true;
  }, currentText);
  if (!opened) return false;
  await sleep(350);
  const picked = await page.evaluate((optionText) => {
    const o = [...document.querySelectorAll('button[role="option"]')].find((b) => b.textContent.trim().toLowerCase().startsWith(optionText.toLowerCase()));
    if (!o) return false; o.click(); return true;
  }, optionText);
  await sleep(2400);
  return picked;
};
const steps = {};
try {
  await page.goto('http://localhost:5182/desk?test=suzanne', { waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForSelector('canvas', { timeout: 30000 });
  await sleep(7000);
  let opened = false;
  for (let a = 0; a < 3 && !opened; a++) {
    const box = await page.$eval('[data-desk-obj-id="suzanne-1"]', (e) => { const b = e.getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; });
    await page.mouse.move(box.x, box.y); await page.mouse.down(); await sleep(70); await page.mouse.up();
    await sleep(1300);
    opened = await page.evaluate(() => !!document.querySelector('[role="dialog"]'));
  }
  await page.evaluate(() => { const d = document.querySelector('[role="dialog"]'); const p = [...d.querySelectorAll('button')].filter((b) => b.textContent.trim() === '3D'); if (p[0]) p[0].click(); });
  await sleep(1200);
  steps.open = { triggers: await triggers(), hasSurface: /Surface/.test(await dlgText()) };
  steps.toExtrude = { picked: await pick('AI mesh', 'Extrude') };
  steps.afterExtrude = { triggers: await triggers(), has3dStyle: /3D style/i.test(await dlgText()), hasSurface: /Surface/.test(await dlgText()) };
  steps.toHatch = { picked: await pick('Native', 'Hatch') };
  steps.toSvgPort = { picked: await pick('Hatch', 'SVG-port') };
  steps.backToMesh = { picked: await pick('Extrude', 'AI mesh') };
  steps.afterBack = { triggers: await triggers(), hasSurface: /Surface/.test(await dlgText()) };
  steps.toEngraved = { picked: await pick('greyscale', 'Engraved') };
  await page.screenshot({ path: `${OUT}/final.png` });
  // Done
  const doneClicked = await page.evaluate(() => {
    const d = document.querySelector('[role="dialog"]'); if (!d) return false;
    const b = [...d.querySelectorAll('button')].find((x) => /^(done|save)$/i.test(x.textContent.trim()));
    if (!b) return false; b.click(); return true;
  });
  await sleep(1500);
  steps.done = { clicked: doneClicked, modalClosed: await page.evaluate(() => !document.querySelector('[role="dialog"]')) };
} catch (e) { steps.fatal = String(e && e.stack ? e.stack : e); }
steps.errors = errors;
console.log(JSON.stringify(steps, null, 2));
await browser.close();
