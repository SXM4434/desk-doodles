// CRITICAL verify (Sebs "none of the toggles work on the ai mesh"): every control
// in the restructured chrome must visibly move the MESH render. Opens a mesh
// object's modal, asserts the new structure (tag · "3D style" not "Surface" ·
// geometry has no "AI mesh"), then drives each toggle and pixel-diffs the 3D well
// vs the prior state. diff≈0 = the toggle did NOTHING (the bug); diff large = it
// drives the mesh.
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = process.env.DD_OUT || '/tmp/mesh-toggles';
const TARGET = process.env.DD_TARGET || 'suzanne-1';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
mkdirSync(OUT, { recursive: true });
const diff = (a, b) => { const n = Math.min(a.length, b.length); let s = 0; for (let i = 0; i < n; i++) s += Math.abs(a[i] - b[i]); return s / n; };

const browser = await puppeteer.launch({ executablePath: CHROME, headless: false, args: ['--window-size=1500,1000'], defaultViewport: { width: 1500, height: 1000 } });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(`[console] ${m.text()}`); });

let clip;
const shot = async (name) => { await sleep(2200); return page.screenshot({ clip, encoding: 'binary', path: `${OUT}/${name}.png` }); };
const pickStyle = async (cur, opt) => {
  await page.evaluate((cur) => { const d = document.querySelector('[role="dialog"]'); const t = [...d.querySelectorAll('button[aria-haspopup="listbox"]')].find((b) => b.textContent.toLowerCase().includes(cur.toLowerCase())); if (t) t.click(); }, cur);
  await sleep(300);
  return page.evaluate((opt) => { const o = [...document.querySelectorAll('button[role="option"]')].find((b) => b.textContent.trim().toLowerCase().startsWith(opt.toLowerCase())); if (o) { o.click(); return true; } return false; }, opt);
};
const clickPill = (label) => page.evaluate((label) => { const d = document.querySelector('[role="dialog"]'); const b = [...d.querySelectorAll('button')].find((x) => x.textContent.trim() === label); if (b) { b.click(); return true; } return false; }, label);

const report = { diffs: {} };
try {
  await page.goto('http://localhost:5182/desk?test=suzanne', { waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForSelector('canvas', { timeout: 30000 });
  await sleep(7000);
  let opened = false;
  for (let a = 0; a < 3 && !opened; a++) {
    const box = await page.$eval(`[data-desk-obj-id="${TARGET}"]`, (e) => { const b = e.getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; });
    await page.mouse.move(box.x, box.y); await page.mouse.down(); await sleep(70); await page.mouse.up();
    await sleep(1300);
    opened = await page.evaluate(() => !!document.querySelector('[role="dialog"]'));
  }
  await page.evaluate(() => { const d = document.querySelector('[role="dialog"]'); const p = [...d.querySelectorAll('button')].filter((b) => b.textContent.trim() === '3D'); if (p[0]) p[0].click(); });
  await sleep(1400);

  // structure assertions
  report.structure = await page.evaluate(() => {
    const d = document.querySelector('[role="dialog"]'); const txt = d.innerText;
    return { hasTag: /AI mesh/i.test(txt), has3dStyle: /3D STYLE/i.test(txt), hasSurfaceWord: /\bSURFACE\b/i.test(txt), triggers: [...d.querySelectorAll('button[aria-haspopup="listbox"]')].map((b) => b.textContent.trim().replace(/\s+/g, ' ')) };
  });
  // geometry options (no AI mesh)
  await page.evaluate(() => { const d = document.querySelector('[role="dialog"]'); const g = [...d.querySelectorAll('button[aria-haspopup="listbox"]')].find((b) => /auto|rod|extrude|inflate|solid/i.test(b.textContent)); if (g) g.click(); });
  await sleep(350);
  report.geometryOptions = await page.evaluate(() => [...document.querySelectorAll('button[role="option"]')].map((b) => b.textContent.trim().split('\n')[0]));
  await page.keyboard.press('Escape'); await sleep(300);

  // crop the 3D well
  clip = await page.evaluate(() => { const d = document.querySelector('[role="dialog"]'); const art = d.querySelector('[data-dd-card-art]') || d.querySelector('canvas'); const r = (art || d).getBoundingClientRect(); return { x: Math.max(0, Math.round(r.x)), y: Math.max(0, Math.round(r.y)), width: Math.round(Math.min(520, r.width)), height: Math.round(Math.min(520, r.height)) }; });

  // ensure Native + Material to start
  await pickStyle('Hatch', 'Native'); await pickStyle('SVG-port', 'Native'); await clickPill('Material');
  const baseA = await shot('00_native_material');
  const baseA2 = await shot('00b_native_material_again'); report.noiseFloor = diff(baseA, baseA2);

  // 3D STYLE: Native → Hatch → SVG-port
  await pickStyle('Native', 'Hatch'); const sHatch = await shot('01_hatch'); report.diffs.style_native_to_hatch = diff(baseA2, sHatch);
  await pickStyle('Hatch', 'SVG-port'); const sPort = await shot('02_svgport'); report.diffs.style_hatch_to_svgport = diff(sHatch, sPort);
  await pickStyle('SVG-port', 'Native'); const sNat = await shot('03_native'); report.diffs.style_svgport_to_native = diff(sPort, sNat);

  // FINISH: Material → Value → Photoreal
  await clickPill('Material'); const fMat = await shot('04_finish_material');
  await clickPill('Value'); const fVal = await shot('05_finish_value'); report.diffs.finish_material_to_value = diff(fMat, fVal);
  await clickPill('Photoreal'); const fPho = await shot('06_finish_photoreal'); report.diffs.finish_value_to_photoreal = diff(fVal, fPho);
  await clickPill('Material'); const fMat2 = await shot('07_finish_material2'); report.diffs.finish_photoreal_to_material = diff(fPho, fMat2);

  // MATERIAL PRESET (under Material finish): matte → glossy
  const presetSwapped = await pickStyle('Matte', 'Glossy');
  const pGlossy = await shot('08_preset_glossy'); report.diffs.preset_matte_to_glossy = diff(fMat2, pGlossy); report.presetSwapped = presetSwapped;
} catch (e) { report.fatal = String(e && e.stack ? e.stack : e); }
report.errors = errors;
console.log(JSON.stringify(report, null, 2));
await browser.close();
