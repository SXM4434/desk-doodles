// Verify the un-curation (Sebs "don't remove stuff, make it work"): the material
// PRESET and hatch GRAMMAR now actually drive the mesh — nothing forced/removed.
import puppeteer from 'puppeteer-core';
import { writeFileSync, mkdirSync } from 'node:fs';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = '/tmp/mesh-controls-work'; mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const diff = (a, b) => { const n = Math.min(a.length, b.length); let s = 0; for (let i = 0; i < n; i++) s += Math.abs(a[i] - b[i]); return s / n; };
const browser = await puppeteer.launch({ executablePath: CHROME, headless: false, args: ['--window-size=1500,1000'], defaultViewport: { width: 1500, height: 1000 } });
const page = await browser.newPage();
const log = [], fail = []; page.on('pageerror', (e) => fail.push(`[pageerror] ${e.message}`));
const clipOf = async () => { const r = await page.$$eval('[data-desk-obj-id]', (els) => els.map((e) => { const b = e.getBoundingClientRect(); return { x: b.x, y: b.y, r: b.right, btm: b.bottom }; })); const c = { x: Math.max(0, Math.min(...r.map((q) => q.x)) - 20), y: Math.max(0, Math.min(...r.map((q) => q.y)) - 20) }; c.width = Math.min(1500, Math.max(...r.map((q) => q.r)) + 20) - c.x; c.height = Math.min(1000, Math.max(...r.map((q) => q.btm)) + 20) - c.y; return c; };
try {
  await page.goto('http://localhost:5182/desk?test=suzanne', { waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForSelector('canvas', { timeout: 30000 }); await sleep(8000);
  const clip = await clipOf();
  const shot = async (name) => { await sleep(2000); const b = await page.screenshot({ clip, encoding: 'binary', path: `${OUT}/${name}.png` }); return b; };

  // NATIVE: matte vs glossy must differ (preset reaches the mesh; glossy reachable again)
  await page.evaluate(() => { window.__dd_canvas3d.setAiMeshMaterialMode('native'); window.__dd_canvas3d.setMaterialPreset('matteClay'); window.__dd_canvas3d.setNativeProps({ polish: 0.5, reflection: 0.5, sheen: 0.5, outline: 0 }); });
  const matte = await shot('native-matteClay');
  await page.evaluate(() => window.__dd_canvas3d.setMaterialPreset('glossyPlastic'));
  const glossy = await shot('native-glossyPlastic');
  const dPreset = diff(matte, glossy);
  log.push(`native preset matte→glossy diff = ${dPreset.toFixed(2)} (want >0 → preset drives the mesh)`);
  if (dPreset < 0.8) fail.push('material PRESET does NOT change the mesh (still forced/removed)');

  // HATCH: hachure vs stipple must differ (grammar reaches the mesh; not forced cross-hatch)
  await page.evaluate(() => { window.__dd_canvas3d.setAiMeshMaterialMode('hatch'); window.__dd_canvas3d.setHatchGrammar('hachure'); });
  const hach = await shot('hatch-hachure');
  await page.evaluate(() => window.__dd_canvas3d.setHatchGrammar('stipple'));
  const stip = await shot('hatch-stipple');
  const dGram = diff(hach, stip);
  log.push(`hatch grammar hachure→stipple diff = ${dGram.toFixed(2)} (want >0 → grammar drives the mesh)`);
  if (dGram < 0.8) fail.push('hatch GRAMMAR does NOT change the mesh (still forced cross-hatch)');

  await page.evaluate(() => window.__dd_canvas3d.setAiMeshMaterialMode('greyscale'));
} catch (e) { fail.push(`EXCEPTION: ${e.message}`); }
finally {
  console.log('\n=== LOG ==='); for (const l of log) console.log('  ' + l);
  console.log('\n=== RESULT ==='); console.log(fail.length ? '  ❌ ' + fail.join('\n  ❌ ') : `  ✅ presets + grammars drive the mesh — nothing removed → ${OUT}`);
  await sleep(600); await browser.close(); process.exit(fail.length ? 1 : 0);
}
