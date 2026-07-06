// Verify the "100%" wiring: Outline (inverted hull) + the hatch micro-dials (the
// 2D Shading sliders → 3D hatch) now reach the mesh. Drives the real setters.
import puppeteer from 'puppeteer-core';
import { writeFileSync, mkdirSync } from 'node:fs';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = '/tmp/mesh-100'; mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const diff = (a, b) => { const n = Math.min(a.length, b.length); let s = 0; for (let i = 0; i < n; i++) s += Math.abs(a[i] - b[i]); return s / n; };
const browser = await puppeteer.launch({ executablePath: CHROME, headless: false, args: ['--window-size=1500,1000'], defaultViewport: { width: 1500, height: 1000 } });
const page = await browser.newPage();
const log = [], fail = []; page.on('pageerror', (e) => fail.push(`[pageerror] ${e.message}`));
try {
  await page.goto('http://localhost:5182/desk?test=suzanne', { waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForSelector('canvas', { timeout: 30000 }); await sleep(8000);
  const hooks = await page.evaluate(() => ({ c3d: typeof window.__dd_canvas3d?.setNativeProps === 'function', mods: typeof window.__dd_mods?.set === 'function' }));
  log.push(`hooks: ${JSON.stringify(hooks)}`);
  if (!hooks.c3d || !hooks.mods) throw new Error('dev hooks missing (__dd_canvas3d / __dd_mods)');
  const rects = await page.$$eval('[data-desk-obj-id]', (els) => els.map((e) => { const b = e.getBoundingClientRect(); return { x: b.x, y: b.y, r: b.right, btm: b.bottom }; }));
  const clip = { x: Math.max(0, Math.min(...rects.map((q) => q.x)) - 20), y: Math.max(0, Math.min(...rects.map((q) => q.y)) - 20) };
  clip.width = Math.min(1500, Math.max(...rects.map((q) => q.r)) + 20) - clip.x;
  clip.height = Math.min(1000, Math.max(...rects.map((q) => q.btm)) + 20) - clip.y;
  const shot = async (n) => { await sleep(2000); return page.screenshot({ clip, encoding: 'binary', path: `${OUT}/${n}.png` }); };

  // OUTLINE: native, outline 0 vs 1 → mesh differs (hull silhouette on the GLB)
  await page.evaluate(() => { window.__dd_canvas3d.setAiMeshMaterialMode('native'); window.__dd_canvas3d.setMaterialPreset('matteClay'); window.__dd_canvas3d.setNativeProps({ polish: 0.5, reflection: 0.5, sheen: 0.5, outline: 0 }); });
  const noOutline = await shot('native-outline0');
  await page.evaluate(() => window.__dd_canvas3d.setNativeProps({ outline: 1 }));
  const outline = await shot('native-outline1');
  const dO = diff(noOutline, outline);
  log.push(`OUTLINE 0→1 diff = ${dO.toFixed(2)} (want >0 → hull on the GLB)`);
  if (dO < 0.8) fail.push('OUTLINE does NOT reach the mesh (hull not wired)');

  // HATCH micro-dial: hatch + hachureGap 4 vs 20 → mesh differs (sliders feed the mesh)
  await page.evaluate(() => { window.__dd_canvas3d.setAiMeshMaterialMode('hatch'); window.__dd_canvas3d.setHatchGrammar('hachure'); window.__dd_mods.set('hachureGap', 4); });
  const gapSmall = await shot('hatch-gap4');
  await page.evaluate(() => window.__dd_mods.set('hachureGap', 20));
  const gapLarge = await shot('hatch-gap20');
  const dG = diff(gapSmall, gapLarge);
  log.push(`HATCH gap 4→20 diff = ${dG.toFixed(2)} (want >0 → shading slider feeds the mesh hatch)`);
  if (dG < 0.8) fail.push('HATCH micro-dial (gap) does NOT reach the mesh');

  await page.evaluate(() => { window.__dd_mods.set('hachureGap', 4); window.__dd_canvas3d.setAiMeshMaterialMode('greyscale'); });
} catch (e) { fail.push(`EXCEPTION: ${e.message}`); }
finally {
  console.log('\n=== LOG ==='); for (const l of log) console.log('  ' + l);
  console.log('\n=== RESULT ==='); console.log(fail.length ? '  ❌ ' + fail.join('\n  ❌ ') : `  ✅ outline + hatch micro-dials reach the mesh → ${OUT}`);
  await sleep(600); await browser.close(); process.exit(fail.length ? 1 : 0);
}
