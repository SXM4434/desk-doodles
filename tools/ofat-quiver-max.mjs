// MAX OFAT on the REAL Quiver-SVG AI-mesh object (Sebs "ofat to the max, visual
// check"). Drives the edit modal through the FULL geometry × style matrix on the
// /desk?test=quiver gameboy (real DB Quiver trace + real Trellis GLB), screenshots
// the orbit-framed 3D well (the true lens) per combo for vision-agent judging.
//   Auto (= the mesh): Native·Material / Native·Value / Native·Photoreal / Hatch / Engraved
//   Extrude·Inflate·Rod·Solid (= rebuilt from the Quiver SVG): Native / Hatch / SVG-port
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = process.env.DD_OUT || '/tmp/quiver-max';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
mkdirSync(OUT, { recursive: true });
const browser = await puppeteer.launch({ executablePath: CHROME, headless: false, args: ['--window-size=1500,1000'], defaultViewport: { width: 1500, height: 1000 } });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(`[console] ${m.text()}`); });

let clip;
const shot = async (name) => { await sleep(2400); await page.screenshot({ clip, path: `${OUT}/${name}.png` }); };
const pickDropdown = async (curIncludes, optStarts) => {
  const opened = await page.evaluate((c) => { const d = document.querySelector('[role="dialog"]'); const t = [...d.querySelectorAll('button[aria-haspopup="listbox"]')].find((b) => b.textContent.toLowerCase().includes(c.toLowerCase())); if (t) { t.click(); return true; } return false; }, curIncludes);
  if (!opened) return false;
  await sleep(320);
  return page.evaluate((o) => { const x = [...document.querySelectorAll('button[role="option"]')].find((b) => b.textContent.trim().toLowerCase().startsWith(o.toLowerCase())); if (x) { x.click(); return true; } return false; }, optStarts);
};
const clickPill = (label) => page.evaluate((label) => { const d = document.querySelector('[role="dialog"]'); const b = [...d.querySelectorAll('button')].find((x) => x.textContent.trim() === label); if (b) { b.click(); return true; } return false; }, label);
// geometry trigger reads one of the mode words; style trigger reads Native/Hatch/SVG-port
const setGeometry = (opt) => pickDropdown('auto', opt).then(async (ok) => ok || pickDropdown('rod', opt).then(o2 => o2 || pickDropdown('extrude', opt).then(o3 => o3 || pickDropdown('inflate', opt).then(o4 => o4 || pickDropdown('solid', opt)))));
const setStyle = async (opt) => (await pickDropdown('native', opt)) || (await pickDropdown('hatch', opt)) || (await pickDropdown('svg-port', opt));

const report = { combos: [] };
try {
  await page.goto('http://localhost:5182/desk?test=quiver', { waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForSelector('canvas', { timeout: 30000 });
  await sleep(7000);
  let opened = false;
  for (let a = 0; a < 3 && !opened; a++) {
    const box = await page.$eval('[data-desk-obj-id="quiver-0"]', (e) => { const b = e.getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; });
    await page.mouse.move(box.x, box.y); await page.mouse.down(); await sleep(70); await page.mouse.up();
    await sleep(1300);
    opened = await page.evaluate(() => !!document.querySelector('[role="dialog"]'));
  }
  await page.evaluate(() => { const d = document.querySelector('[role="dialog"]'); const p = [...d.querySelectorAll('button')].filter((b) => b.textContent.trim() === '3D'); if (p[0]) p[0].click(); });
  await sleep(1400);
  clip = await page.evaluate(() => { const d = document.querySelector('[role="dialog"]'); const art = d.querySelector('[data-dd-card-art]') || d.querySelector('canvas'); const r = (art || d).getBoundingClientRect(); return { x: Math.max(0, Math.round(r.x)), y: Math.max(0, Math.round(r.y)), width: Math.round(Math.min(520, r.width)), height: Math.round(Math.min(520, r.height)) }; });

  // ── Auto = the mesh: the surface set ──
  await setGeometry('Auto'); await sleep(800);
  await setStyle('Native'); await clickPill('Material'); await shot('00_mesh_native_material'); report.combos.push('00_mesh_native_material');
  await clickPill('Value'); await shot('01_mesh_native_value'); report.combos.push('01_mesh_native_value');
  await clickPill('Photoreal'); await shot('02_mesh_native_photoreal'); report.combos.push('02_mesh_native_photoreal');
  await clickPill('Material');
  await setStyle('Hatch'); await shot('03_mesh_hatch'); report.combos.push('03_mesh_hatch');
  await setStyle('SVG-port'); await shot('04_mesh_engraved'); report.combos.push('04_mesh_engraved');

  // ── stroke forms from the Quiver SVG × each style ──
  const forms = ['Extrude', 'Inflate', 'Rod', 'Solid'];
  let i = 5;
  for (const f of forms) {
    await setStyle('Native'); // reset style so the geometry trigger is findable
    await setGeometry(f); await sleep(900);
    for (const s of ['Native', 'Hatch', 'SVG-port']) {
      await setStyle(s);
      const n = String(i).padStart(2, '0');
      const name = `${n}_${f.toLowerCase()}_${s.toLowerCase().replace('-', '')}`;
      await shot(name); report.combos.push(name); i++;
    }
  }
} catch (e) { report.fatal = String(e && e.stack ? e.stack : e); }
report.errors = errors;
console.log(JSON.stringify(report, null, 2));
await browser.close();
