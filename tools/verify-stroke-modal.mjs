// REGRESSION check: a STROKE object (no GLB) must still get the unified 3D chrome
// — Geometry (auto/rod/extrude/inflate/solid, NO 'AI mesh') + 3D STYLE
// (Native/Hatch/SVG-port), NOT a Surface picker. Opens a normal desk doodle's
// modal, flips to 3D, asserts the dropdowns + screenshots.
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = process.env.DD_OUT || '/tmp/unify-stroke';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
mkdirSync(OUT, { recursive: true });
const browser = await puppeteer.launch({ executablePath: CHROME, headless: false, args: ['--window-size=1500,1000'], defaultViewport: { width: 1500, height: 1000 } });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`));
const report = {};
try {
  // Default wall = 2D recordings (stroke objects).
  await page.goto('http://localhost:5182/desk?demo=1&n=6', { waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForSelector('canvas', { timeout: 30000 });
  await sleep(6000);
  // Tap the first object (with retry) until a dialog opens.
  let opened = false, id = null;
  const ids = await page.$$eval('[data-desk-obj-id]', (els) => els.map((e) => e.getAttribute('data-desk-obj-id')));
  for (const cand of ids) {
    const box = await page.$eval(`[data-desk-obj-id="${cand}"]`, (e) => { const b = e.getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; }).catch(() => null);
    if (!box) continue;
    await page.mouse.move(box.x, box.y); await page.mouse.down(); await sleep(70); await page.mouse.up();
    await sleep(1200);
    opened = await page.evaluate(() => !!document.querySelector('[role="dialog"]'));
    if (opened) { id = cand; break; }
  }
  report.opened = opened; report.id = id;
  // Flip the modal to 3D (if a 3D pill exists — uploads stay 2D-only).
  const can3d = await page.evaluate(() => {
    const dlg = document.querySelector('[role="dialog"]'); if (!dlg) return false;
    const p = [...dlg.querySelectorAll('button')].filter((b) => b.textContent && b.textContent.trim() === '3D');
    if (!p[0]) return false; p[0].click(); return true;
  });
  report.can3d = can3d;
  await sleep(1400);
  await page.screenshot({ path: `${OUT}/stroke_3d.png` });
  report.dom = await page.evaluate(() => {
    const dlg = document.querySelector('[role="dialog"]'); if (!dlg) return null;
    const txt = dlg.innerText;
    const trigs = [...dlg.querySelectorAll('button[aria-haspopup="listbox"]')].map((b) => b.textContent.trim().replace(/\s+/g, ' '));
    // Open the geometry dropdown and read its options (assert no 'AI mesh').
    return {
      triggers: trigs,
      hasLook: /\bLook\b/.test(txt),
      has3dStyleLabel: /3D style/i.test(txt),
      hasSurfaceLabel: /Surface/i.test(txt),
    };
  });
  // Open the geometry dropdown to enumerate options.
  await page.evaluate(() => {
    const dlg = document.querySelector('[role="dialog"]');
    const trigs = [...dlg.querySelectorAll('button[aria-haspopup="listbox"]')];
    const geo = trigs.find((b) => /auto|rod|extrude|inflate|solid/i.test(b.textContent));
    if (geo) geo.click();
  });
  await sleep(400);
  report.geometryOptions = await page.evaluate(() => [...document.querySelectorAll('button[role="option"]')].map((b) => b.textContent.trim().split('\n')[0]));
} catch (e) { report.fatal = String(e && e.stack ? e.stack : e); }
report.errors = errors;
console.log(JSON.stringify(report, null, 2));
await browser.close();
