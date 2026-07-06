// MEGA BIG-DADDY OFAT (Sebs 2026-06-27: "keep doing a few rounds of a mega big
// daddy ofat") — now that EVERY 3D control works on the mesh, sweep the full
// surface space one-factor-at-a-time on the live Suzanne meshes. Drives the REAL
// controls via __dd_canvas3d + __dd_mods (no dev flag). DD_CROP_TARGET=<id> tight-
// crops one mesh; DD_OUT=<dir>. Round set via DD_ROUND (default 1).
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const TARGET = process.env.DD_CROP_TARGET || '';
const OUT = process.env.DD_OUT || '/tmp/mega-ofat';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
mkdirSync(OUT, { recursive: true });
const DM = { hachureGap: 4, hachureAngle: -41, strokeWidth: 1.2, inkIntensity: 1.0 };
const N = { polish: 0.5, reflection: 0.5, sheen: 0.5, outline: 0 };

// surface ∈ greyscale | native | hatch | og-pbr. One factor varied per row.
const V = [
  { g: "final", name: "greyscale", surface: "greyscale", dark: 0.18, contrast: 1 },
  { g: "final", name: "matte-outline50", surface: "native", preset: "matteClay", nativeProps: { ...N, outline: 0.5 } },
  { g: "final", name: "contour", surface: "hatch", grammar: "contour" },
  { g: "final", name: "contour-outline50", surface: "hatch", grammar: "contour", nativeProps: { ...N, outline: 0.5 } },
  { g: "final", name: "crosshatch-tuned", surface: "hatch", grammar: "cross-hatch", mods: { hachureGap: 6, strokeWidth: 0.6 } },
  { g: "final", name: "crosshatch-outline50", surface: "hatch", grammar: "cross-hatch", mods: { hachureGap: 6, strokeWidth: 0.6 }, nativeProps: { ...N, outline: 0.5 } },
  { g: "final", name: "hachure-outline50", surface: "hatch", grammar: "hachure", nativeProps: { ...N, outline: 0.5 } },
];

const browser = await puppeteer.launch({ executablePath: CHROME, headless: false, args: ['--window-size=1500,1000'], defaultViewport: { width: 1500, height: 1000 } });
const page = await browser.newPage();
const log = [], fail = [];
page.on('pageerror', (e) => fail.push(`[pageerror] ${e.message}`));
try {
  await page.goto('http://localhost:5182/desk?test=suzanne', { waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForSelector('canvas', { timeout: 30000 });
  await sleep(8000);
  const ok = await page.evaluate(() => typeof window.__dd_canvas3d?.setAiMeshMaterialMode === 'function' && typeof window.__dd_mods?.set === 'function');
  if (!ok) throw new Error('dev hooks missing');
  const sel = TARGET ? `[data-desk-obj-id="${TARGET}"]` : '[data-desk-obj-id]';
  const rects = await page.$$eval(sel, (els) => els.map((e) => { const b = e.getBoundingClientRect(); return { x: b.x, y: b.y, r: b.right, btm: b.bottom }; }));
  const pad = TARGET ? 16 : 24;
  const clip = { x: Math.max(0, Math.min(...rects.map((q) => q.x)) - pad), y: Math.max(0, Math.min(...rects.map((q) => q.y)) - pad) };
  clip.width = Math.min(1500, Math.max(...rects.map((q) => q.r)) + pad) - clip.x;
  clip.height = Math.min(1000, Math.max(...rects.map((q) => q.btm)) + pad) - clip.y;

  const apply = (v) => page.evaluate((v, DM, N) => {
    const c = window.__dd_canvas3d, m = window.__dd_mods;
    c.setMaterialPreset(v.preset || 'matteClay');
    c.setNativeProps({ ...N, ...(v.nativeProps || {}) });
    c.setHatchGrammar(v.grammar || 'hachure');
    c.setHatchDirection(v.direction || 'fixed');
    c.setAiMeshDark(v.dark ?? 0.18);
    c.setAiMeshContrast(v.contrast ?? 1);
    m.set('hachureGap', v.mods?.hachureGap ?? DM.hachureGap);
    m.set('hachureAngle', v.mods?.hachureAngle ?? DM.hachureAngle);
    m.set('strokeWidth', v.mods?.strokeWidth ?? DM.strokeWidth);
    m.set('inkIntensity', v.mods?.inkIntensity ?? DM.inkIntensity);
    c.setAiMeshMaterialMode(v.surface);
  }, v, DM, N);

  let i = 0;
  for (const v of V) {
    await apply(v);
    await sleep(1500);
    const num = String(++i).padStart(2, '0');
    await page.screenshot({ clip, path: `${OUT}/${num}_${v.g}_${v.name}.png` });
  }
  await page.evaluate(() => { window.__dd_mods.reset(); window.__dd_canvas3d.setAiMeshMaterialMode('greyscale'); });
  log.push(`DONE ${V.length} variants${TARGET ? ' on ' + TARGET : ''} → ${OUT}`);
} catch (e) { fail.push(`EXCEPTION: ${e.message}`); }
finally {
  console.log(fail.length ? 'FAIL: ' + fail.join('; ') : log.join('\n'));
  await sleep(500); await browser.close(); process.exit(fail.length ? 1 : 0);
}
