// BIG-DADDY OFAT — the unified FORM × SURFACE control system (Sebs 2026-06-27,
// "go do a big daddy ofat on it all first then i test"). One-factor-at-a-time
// sweep of the new unified 3D controls, driven LIVE via the desk-wide
// Canvas3DChrome dev hooks (__dd_canvas3d) — the SAME controls + render path the
// edit modal uses. Two desks: meshes (test=suzanne) + closed-shape stroke
// objects (demo=rock). Each combo: apply FORM + SURFACE, screenshot the wall,
// capture console errors. Output → /tmp/ofat-fs/<desk>/<NN_form_surface>.png +
// manifest.json for the vision-agent judging pass.
import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync } from 'node:fs';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = process.env.DD_OUT || '/tmp/ofat-fs';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
mkdirSync(OUT, { recursive: true });

const MESH_STYLES = ['greyscale', 'native', 'hatch', 'svg-port', 'og-pbr'];
const STROKE_STYLES = ['native', 'hatch', 'svg-port'];

// FORM × SURFACE combos per desk. For the 'ai-mesh' FORM the SURFACE drives
// aiMeshMaterialMode (5 opts); for a stroke FORM it drives style3d (3 opts).
function meshCombos() {
  const out = [];
  for (const s of MESH_STYLES) out.push({ form: 'ai-mesh', surface: s });
  for (const f of ['extrude', 'inflate', 'rod', 'solid']) for (const s of STROKE_STYLES) out.push({ form: f, surface: s });
  return out;
}
function strokeCombos() {
  const out = [];
  for (const f of ['auto', 'extrude', 'inflate', 'rod', 'solid']) for (const s of STROKE_STYLES) out.push({ form: f, surface: s });
  return out;
}

const DESKS = [
  { key: 'mesh', url: '/desk?test=suzanne', combos: meshCombos() },
  { key: 'stroke', url: '/desk?demo=rock', combos: strokeCombos() },
];

const browser = await puppeteer.launch({ executablePath: CHROME, headless: false, args: ['--window-size=1500,1000'], defaultViewport: { width: 1500, height: 1000 } });
const manifest = { desks: {} };
try {
  for (const desk of DESKS) {
    mkdirSync(`${OUT}/${desk.key}`, { recursive: true });
    const page = await browser.newPage();
    const errsAll = [];
    page.on('pageerror', (e) => errsAll.push(`[pageerror] ${e.message}`));
    page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errsAll.push(`[console] ${m.text()}`); });
    await page.goto(`http://localhost:5182${desk.url}`, { waitUntil: 'networkidle2', timeout: 60000 });
    await page.waitForSelector('canvas', { timeout: 30000 });
    await sleep(8000);
    const hooksOk = await page.evaluate(() => typeof window.__dd_canvas3d?.setGeometryMode === 'function' && typeof window.__dd_canvas3d?.setStyle3d === 'function' && typeof window.__dd_canvas3d?.setAiMeshMaterialMode === 'function');
    if (!hooksOk) throw new Error(`${desk.key}: dev hooks missing`);

    // crop rect over the object wall
    const rects = await page.$$eval('[data-desk-obj-id]', (els) => els.map((e) => { const b = e.getBoundingClientRect(); return { x: b.x, y: b.y, r: b.right, btm: b.bottom }; }));
    const pad = 20;
    const clip = { x: Math.max(0, Math.min(...rects.map((q) => q.x)) - pad), y: Math.max(0, Math.min(...rects.map((q) => q.y)) - pad) };
    clip.width = Math.min(1500, Math.max(...rects.map((q) => q.r)) + pad) - clip.x;
    clip.height = Math.min(1000, Math.max(...rects.map((q) => q.btm)) + pad) - clip.y;

    const records = [];
    let i = 0;
    for (const c of desk.combos) {
      const before = errsAll.length;
      await page.evaluate((c) => {
        const h = window.__dd_canvas3d;
        h.setGeometryMode(c.form);
        if (c.form === 'ai-mesh') h.setAiMeshMaterialMode(c.surface);
        else h.setStyle3d(c.surface);
      }, c);
      await sleep(2600); // 3D rebuild + texture
      const n = String(i).padStart(2, '0');
      const file = `${desk.key}/${n}_${c.form}_${c.surface}.png`;
      await page.screenshot({ path: `${OUT}/${file}`, clip });
      records.push({ i, form: c.form, surface: c.surface, file, newErrors: errsAll.slice(before) });
      i++;
    }
    manifest.desks[desk.key] = { url: desk.url, combos: records, totalErrors: errsAll.length, errors: errsAll.slice(0, 20) };
    await page.close();
  }
} catch (e) { manifest.fatal = String(e && e.stack ? e.stack : e); }
writeFileSync(`${OUT}/manifest.json`, JSON.stringify(manifest, null, 2));
console.log(JSON.stringify({ mesh: manifest.desks.mesh?.combos?.length, stroke: manifest.desks.stroke?.combos?.length, meshErrs: manifest.desks.mesh?.totalErrors, strokeErrs: manifest.desks.stroke?.totalErrors, fatal: manifest.fatal }, null, 2));
await browser.close();
