// Verify the REAL surface control (dev flag removed): drive the actual
// aiMeshMaterialMode setter through the 4 OFAT surfaces and confirm each renders
// distinct + non-blank on the live Suzanne wall.
import puppeteer from 'puppeteer-core';
import { writeFileSync, mkdirSync } from 'node:fs';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = '/tmp/mesh-surfaces-final'; mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const score = (b) => { let s = 0; for (let i = 0; i < b.length; i++) s += b[i]; return s / b.length; };
const diff = (a, b) => { const n = Math.min(a.length, b.length); let s = 0; for (let i = 0; i < n; i++) s += Math.abs(a[i] - b[i]); return s / n; };

const browser = await puppeteer.launch({ executablePath: CHROME, headless: false, args: ['--window-size=1500,1000'], defaultViewport: { width: 1500, height: 1000 } });
const page = await browser.newPage();
const log = [], fail = []; page.on('pageerror', (e) => fail.push(`[pageerror] ${e.message}`));
try {
  await page.goto('http://localhost:5182/desk?test=suzanne', { waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForSelector('canvas', { timeout: 30000 });
  await sleep(8000);
  const hook = await page.evaluate(() => typeof window.__dd_canvas3d?.setAiMeshMaterialMode === 'function');
  if (!hook) throw new Error('setAiMeshMaterialMode hook missing');
  const rects = await page.$$eval('[data-desk-obj-id]', (els) => els.map((e) => { const b = e.getBoundingClientRect(); return { x: b.x, y: b.y, r: b.right, btm: b.bottom }; }));
  const clip = { x: Math.max(0, Math.min(...rects.map((q) => q.x)) - 24), y: Math.max(0, Math.min(...rects.map((q) => q.y)) - 24) };
  clip.width = Math.min(1500, Math.max(...rects.map((q) => q.r)) + 24) - clip.x;
  clip.height = Math.min(1000, Math.max(...rects.map((q) => q.btm)) + 24) - clip.y;

  const shots = {};
  for (const mode of ['greyscale', 'hatch', 'native', 'og-pbr']) {
    await page.evaluate((m) => window.__dd_canvas3d.setAiMeshMaterialMode(m), mode);
    await sleep(2200);
    const b = await page.screenshot({ clip, encoding: 'binary' });
    writeFileSync(`${OUT}/${mode}.png`, b);
    shots[mode] = b;
    log.push(`${mode}: non-blank ${score(b).toFixed(1)}`);
    if (score(b) < 6) fail.push(`${mode} render looks BLANK`);
  }
  // each surface must differ from greyscale (hatch/native/pbr change the look)
  for (const m of ['hatch', 'native', 'og-pbr']) {
    const d = diff(shots.greyscale, shots[m]);
    log.push(`diff ${m} vs greyscale = ${d.toFixed(2)}`);
    if (d < 1) fail.push(`${m} did NOT differ from greyscale (control not applying)`);
  }
  // reset
  await page.evaluate(() => window.__dd_canvas3d.setAiMeshMaterialMode('greyscale'));
} catch (e) { fail.push(`EXCEPTION: ${e.message}`); }
finally {
  console.log('\n=== LOG ==='); for (const l of log) console.log('  ' + l);
  console.log('\n=== RESULT ==='); console.log(fail.length ? '  ❌ ' + fail.join('\n  ❌ ') : `  ✅ all 4 surfaces render distinct via the REAL control → ${OUT}`);
  await sleep(600); await browser.close(); process.exit(fail.length ? 1 : 0);
}
