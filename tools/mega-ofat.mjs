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
  // BASE / greyscale
  { g: 'base', name: 'greyscale-default', surface: 'greyscale', dark: 0.18, contrast: 1 },
  { g: 'base', name: 'greyscale-dark-low', surface: 'greyscale', dark: 0.10, contrast: 1 },
  { g: 'base', name: 'greyscale-dark-high', surface: 'greyscale', dark: 0.40, contrast: 1 },
  { g: 'base', name: 'greyscale-contrast-low', surface: 'greyscale', dark: 0.18, contrast: 0.6 },
  { g: 'base', name: 'greyscale-contrast-high', surface: 'greyscale', dark: 0.18, contrast: 1.6 },
  { g: 'base', name: 'pbr-photoreal', surface: 'og-pbr' },
  // NATIVE presets (neutral dials)
  ...['ink', 'softGel', 'matteClay', 'glossyPlastic', 'rubber', 'signal'].map((p) => ({ g: 'preset', name: `native-${p}`, surface: 'native', preset: p, nativeProps: N })),
  // NATIVE dials (matteClay)
  { g: 'dial', name: 'polish-0', surface: 'native', preset: 'matteClay', nativeProps: { ...N, polish: 0 } },
  { g: 'dial', name: 'polish-1', surface: 'native', preset: 'matteClay', nativeProps: { ...N, polish: 1 } },
  { g: 'dial', name: 'reflection-1', surface: 'native', preset: 'matteClay', nativeProps: { ...N, reflection: 1 } },
  { g: 'dial', name: 'sheen-1', surface: 'native', preset: 'matteClay', nativeProps: { ...N, sheen: 1 } },
  // NATIVE outline (matteClay) — NEW this build
  { g: 'outline', name: 'outline-33', surface: 'native', preset: 'matteClay', nativeProps: { ...N, outline: 0.33 } },
  { g: 'outline', name: 'outline-66', surface: 'native', preset: 'matteClay', nativeProps: { ...N, outline: 0.66 } },
  { g: 'outline', name: 'outline-100', surface: 'native', preset: 'matteClay', nativeProps: { ...N, outline: 1 } },
  { g: 'outline', name: 'glossy-outline-100', surface: 'native', preset: 'glossyPlastic', nativeProps: { ...N, outline: 1 } },
  // SUSPECTS (gloss)
  { g: 'suspect', name: 'glossy-polish1-refl1', surface: 'native', preset: 'glossyPlastic', nativeProps: { polish: 1, reflection: 1, sheen: 0.5, outline: 0 } },
  { g: 'suspect', name: 'ink-polish1', surface: 'native', preset: 'ink', nativeProps: { ...N, polish: 1 } },
  // HATCH grammar × direction
  ...['hachure', 'cross-hatch', 'stipple', 'contour'].flatMap((gr) => ['fixed', 'light'].map((d) => ({ g: 'hatch', name: `hatch-${gr}-${d}`, surface: 'hatch', grammar: gr, direction: d }))),
  // HATCH micro-dials (cross-hatch baseline) — NEW this build
  { g: 'micro', name: 'cross-gap-tight', surface: 'hatch', grammar: 'cross-hatch', mods: { hachureGap: 2 } },
  { g: 'micro', name: 'cross-gap-wide', surface: 'hatch', grammar: 'cross-hatch', mods: { hachureGap: 18 } },
  { g: 'micro', name: 'cross-width-thin', surface: 'hatch', grammar: 'cross-hatch', mods: { strokeWidth: 0.5 } },
  { g: 'micro', name: 'cross-width-thick', surface: 'hatch', grammar: 'cross-hatch', mods: { strokeWidth: 3 } },
  { g: 'micro', name: 'cross-angle-0', surface: 'hatch', grammar: 'cross-hatch', mods: { hachureAngle: 0 } },
  { g: 'micro', name: 'cross-intensity-low', surface: 'hatch', grammar: 'cross-hatch', mods: { inkIntensity: 0.45 } },
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
