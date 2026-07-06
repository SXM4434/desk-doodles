// LIVE verification of the FORM × SURFACE modal unification (Sebs 2026-06-27).
// Drives the REAL desk + edit modal (no headless isolated render): opens a mesh
// object's surface, asserts the UNIFIED control set (Geometry FORM dropdown w/
// 'AI mesh' + a Surface picker, NO old 'Look' dropdown), then exercises the
// axes — AI mesh form ↔ a stroke form (Extrude, rebuilt from the Quiver SVG) and
// the surfaces (Material / Greyscale / Hatch / Engraved). Screens each step.
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = process.env.DD_OUT || '/tmp/unify-modal';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({ executablePath: CHROME, headless: false, args: ['--window-size=1500,1000'], defaultViewport: { width: 1500, height: 1000 } });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') errors.push(`[console.error] ${m.text()}`); });

const shot = (n) => page.screenshot({ path: `${OUT}/${n}.png` });
const findOptionAndClick = async (label) => {
  // Click an open listbox option by its visible text.
  const ok = await page.evaluate((label) => {
    const opts = [...document.querySelectorAll('button[role="option"]')];
    const hit = opts.find((b) => b.textContent && b.textContent.trim().toLowerCase().startsWith(label.toLowerCase()));
    if (!hit) return false;
    hit.click();
    return true;
  }, label);
  return ok;
};
// Open the dropdown whose trigger currently reads `current`, then pick `option`.
const pickFromDropdown = async (current, option) => {
  const opened = await page.evaluate((current) => {
    const trigs = [...document.querySelectorAll('button[aria-haspopup="listbox"]')];
    const hit = trigs.find((b) => b.textContent && b.textContent.toLowerCase().includes(current.toLowerCase()));
    if (!hit) return false;
    hit.click();
    return true;
  }, current);
  if (!opened) return { opened: false, picked: false };
  await sleep(350);
  const picked = await findOptionAndClick(option);
  await sleep(900);
  return { opened, picked };
};

const report = { errors: [], steps: {} };
try {
  await page.goto('http://localhost:5182/desk?test=suzanne', { waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForSelector('canvas', { timeout: 30000 });
  await sleep(7000);
  await shot('00_desk');

  // Tap a mesh object to open its surface (pointerdown+up, no move = a tap).
  const box = await page.$eval('[data-desk-obj-id="suzanne-0"]', (e) => {
    const b = e.getBoundingClientRect();
    return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
  });
  await page.mouse.move(box.x, box.y);
  await page.mouse.down();
  await sleep(60);
  await page.mouse.up();
  await sleep(1400);
  await shot('01_modal_open');

  // Ensure 3D view (the unified 3D controls). Suzanne meshes open is3d=true, but
  // click the 3D mode pill if a 2D|3D pair is present and 2D is active.
  await page.evaluate(() => {
    const pills = [...document.querySelectorAll('button')].filter((b) => b.textContent && b.textContent.trim() === '3D');
    if (pills[0]) pills[0].click();
  });
  await sleep(1200);
  await shot('02_modal_3d');

  // ── ASSERT the unified control set ──
  const dom = await page.evaluate(() => {
    const txt = document.body.innerText;
    const trigs = [...document.querySelectorAll('button[aria-haspopup="listbox"]')].map((b) => b.textContent.trim().replace(/\s+/g, ' '));
    return {
      hasLook: /\bLook\b/.test(txt) && trigs.some((t) => /look/i.test(t)),
      hasSurfaceLabel: /Surface/.test(txt),
      hasGeometryWord: /Geometry|Form/.test(txt),
      triggers: trigs,
      bodyHasAiMesh: /AI mesh/i.test(txt),
    };
  });
  report.steps.assertUnified = dom;

  // ── FORM axis: AI mesh → Extrude (rebuild from Quiver SVG) ──
  report.steps.toExtrude = await pickFromDropdown('AI mesh', 'Extrude');
  await shot('03_form_extrude');
  // back to AI mesh
  report.steps.backToMesh = await pickFromDropdown('Extrude', 'AI mesh');
  await shot('04_form_aimesh');

  // ── SURFACE axis on the mesh: Material → Hatch → Engraved → Greyscale ──
  report.steps.toMaterial = await pickFromDropdown('greyscale', 'Material');
  await shot('05_surface_material');
  report.steps.toHatch = await pickFromDropdown('Material', 'Hatch');
  await shot('06_surface_hatch');
  report.steps.toEngraved = await pickFromDropdown('Hatch', 'Engraved');
  await shot('07_surface_engraved');
  report.steps.toGreyscale = await pickFromDropdown('Engraved', 'Greyscale');
  await shot('08_surface_greyscale');
} catch (e) {
  report.fatal = String(e && e.stack ? e.stack : e);
}
report.errors = errors;
console.log(JSON.stringify(report, null, 2));
await browser.close();
