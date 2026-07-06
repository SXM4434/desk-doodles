// Modal-lens check of the flagged FORMs (rod/solid/inflate) — the desk-wall OFAT
// view is near-top-down + small, ambiguous for dimensionality. The user judges in
// the EDIT MODAL (orbit-framed, large). Open a mesh object's modal, set each
// geometry FORM × native style via the real dropdowns, screenshot the framed 3D
// well so we can judge whether rod/solid are dimensional or genuinely flat-black.
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = process.env.DD_OUT || '/tmp/ofat-modal-forms';
const TARGET = process.env.DD_TARGET || 'suzanne-0';
const URL = process.env.DD_URL || '/desk?test=suzanne';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
mkdirSync(OUT, { recursive: true });
const browser = await puppeteer.launch({ executablePath: CHROME, headless: false, args: ['--window-size=1500,1000'], defaultViewport: { width: 1500, height: 1000 } });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

const pickGeometry = async (option) => {
  const opened = await page.evaluate(() => {
    const dlg = document.querySelector('[role="dialog"]');
    const trigs = [...dlg.querySelectorAll('button[aria-haspopup="listbox"]')];
    // geometry trigger = the one whose text is a known form value
    const geo = trigs.find((b) => /ai mesh|auto|^rod|extrude|inflate|solid/i.test(b.textContent.trim()));
    if (!geo) return false; geo.click(); return true;
  });
  if (!opened) return false;
  await sleep(350);
  const picked = await page.evaluate((option) => {
    const opts = [...document.querySelectorAll('button[role="option"]')];
    const hit = opts.find((b) => b.textContent.trim().toLowerCase().startsWith(option.toLowerCase()));
    if (!hit) return false; hit.click(); return true;
  }, option);
  await sleep(2600);
  return picked;
};
// crop to the modal's 3D well (the card art area, left side of the dialog)
const clipWell = async () => {
  const b = await page.evaluate(() => {
    const dlg = document.querySelector('[role="dialog"]');
    const art = dlg && (dlg.querySelector('[data-dd-card-art]') || dlg.querySelector('canvas'));
    const r = (art || dlg).getBoundingClientRect();
    return { x: Math.max(0, r.x - 6), y: Math.max(0, r.y - 6), width: Math.min(560, r.width + 12), height: Math.min(560, r.height + 12) };
  });
  return b;
};
const report = { forms: {} };
try {
  await page.goto(`http://localhost:5182${URL}`, { waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForSelector('canvas', { timeout: 30000 });
  await sleep(7000);
  let opened = false;
  for (let a = 0; a < 3 && !opened; a++) {
    const box = await page.$eval(`[data-desk-obj-id="${TARGET}"]`, (e) => { const b = e.getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; });
    await page.mouse.move(box.x, box.y); await page.mouse.down(); await sleep(70); await page.mouse.up();
    await sleep(1300);
    opened = await page.evaluate(() => !!document.querySelector('[role="dialog"]'));
  }
  report.opened = opened;
  // ensure 3D
  await page.evaluate(() => { const dlg = document.querySelector('[role="dialog"]'); const p = [...dlg.querySelectorAll('button')].filter((b) => b.textContent.trim() === '3D'); if (p[0]) p[0].click(); });
  await sleep(1200);
  for (const form of ['Extrude', 'Inflate', 'Rod', 'Solid']) {
    const ok = await pickGeometry(form);
    const clip = await clipWell();
    await page.screenshot({ path: `${OUT}/${form.toLowerCase()}.png`, clip });
    report.forms[form] = { picked: ok };
  }
} catch (e) { report.fatal = String(e && e.stack ? e.stack : e); }
report.errors = errors;
console.log(JSON.stringify(report, null, 2));
await browser.close();
