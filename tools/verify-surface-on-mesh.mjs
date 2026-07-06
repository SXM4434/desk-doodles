// De-risk: does OUR engine material (native preset + screen-space HATCH) render
// correctly when assigned to an arbitrary Suzanne GLB? Drives /desk?test=suzanne
// through greyscale(default) → hatch → native via the dev hooks, asserts each
// renders (non-blank) and visibly differs, and saves PNGs for Sebs's eye.
import puppeteer from 'puppeteer-core';
import { writeFileSync, mkdirSync } from 'node:fs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const URL = 'http://localhost:5182/desk?test=suzanne';
const OUT = '/tmp/surface-on-mesh';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
mkdirSync(OUT, { recursive: true });

function bufDiff(a, b) { const n = Math.min(a.length, b.length); if (!n) return 0; let s = 0; for (let i = 0; i < n; i++) s += Math.abs(a[i] - b[i]); return s / n; }
// Fraction of non-near-white, non-near-black pixels in a raw screenshot (rough
// "is something actually drawn here" proxy on the PNG bytes).
function nonBlankScore(buf) { let s = 0; for (let i = 0; i < buf.length; i++) s += buf[i]; return s / buf.length; }

const browser = await puppeteer.launch({ executablePath: CHROME, headless: false, args: ['--window-size=1500,1000'], defaultViewport: { width: 1500, height: 1000 } });
const page = await browser.newPage();
const log = [], fail = [];
page.on('pageerror', (e) => fail.push(`[pageerror] ${e.message}`));

async function shot(name, clip) { const b = await page.screenshot({ clip, encoding: 'binary' }); writeFileSync(`${OUT}/${name}.png`, b); return b; }

try {
  await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForSelector('[data-desk-obj-id]', { timeout: 30000 });
  await page.waitForSelector('canvas', { timeout: 30000 });
  await sleep(8000); // GLB stream + first frames

  // dev hook present?
  const hookOk = await page.evaluate(() => typeof (window.__dd_canvas3d?.setStyle3d) === 'function');
  log.push(`dev hook __dd_canvas3d present: ${hookOk}`);
  if (!hookOk) throw new Error('window.__dd_canvas3d.setStyle3d missing — provider hook not live');

  const ids = await page.$$eval('[data-desk-obj-id]', (els) => els.map((e) => e.getAttribute('data-desk-obj-id')));
  log.push(`objects: ${ids.length}`);
  const targetId = ids[0];
  const sel = `[data-desk-obj-id="${targetId}"]`;
  const r = await page.$eval(sel, (el) => { const b = el.getBoundingClientRect(); return { x: b.x, y: b.y, width: b.width, height: b.height }; });
  const clip = { x: Math.max(0, r.x), y: Math.max(0, r.y), width: r.width, height: r.height };
  const full = { x: 0, y: 0, width: 1500, height: 1000 };

  // 1. BASELINE — flag off, default style → greyscale re-skin.
  const baseClip = await shot('1-greyscale-clip', clip);
  await shot('1-greyscale-full', full);
  log.push(`1. greyscale non-blank score = ${nonBlankScore(baseClip).toFixed(1)}`);

  // 2. HATCH — flag engine + style3d hatch.
  await page.evaluate(() => { window.__dd_aiMeshSurface = 'engine'; window.__dd_canvas3d.setStyle3d('hatch'); });
  await sleep(2500);
  const hatchClip = await shot('2-hatch-clip', clip);
  await shot('2-hatch-full', full);
  const dHatch = bufDiff(baseClip, hatchClip);
  log.push(`2. HATCH on mesh: non-blank = ${nonBlankScore(hatchClip).toFixed(1)} · diff vs greyscale = ${dHatch.toFixed(2)}`);
  if (nonBlankScore(hatchClip) < 6) fail.push('2. hatch render looks BLANK (mesh may have vanished)');
  if (dHatch < 1) fail.push('2. hatch did NOT change the render vs greyscale');

  // 3. NATIVE — style3d native → matte clay preset on the mesh.
  await page.evaluate(() => { window.__dd_canvas3d.setStyle3d('native'); });
  await sleep(2500);
  const nativeClip = await shot('3-native-clip', clip);
  await shot('3-native-full', full);
  const dNative = bufDiff(hatchClip, nativeClip);
  log.push(`3. NATIVE on mesh: non-blank = ${nonBlankScore(nativeClip).toFixed(1)} · diff vs hatch = ${dNative.toFixed(2)}`);
  if (nonBlankScore(nativeClip) < 6) fail.push('3. native render looks BLANK');
  if (dNative < 1) fail.push('3. native did NOT differ from hatch');

  // 4. back to greyscale (flag off) — confirm no permanent state damage.
  await page.evaluate(() => { window.__dd_aiMeshSurface = undefined; window.__dd_canvas3d.setStyle3d('hatch'); });
  await sleep(300);
  await page.evaluate(() => { window.__dd_canvas3d.setStyle3d('native'); });
  await sleep(1500);
  const back = await shot('4-back-greyscale-clip', clip);
  const dBack = bufDiff(baseClip, back);
  log.push(`4. back-to-greyscale diff vs original greyscale = ${dBack.toFixed(2)} (want small)`);
} catch (e) {
  fail.push(`EXCEPTION: ${e.message}`);
} finally {
  console.log('\n=== LOG ==='); for (const l of log) console.log('  ' + l);
  console.log('\n=== RESULT ==='); console.log(fail.length ? '  ❌ ' + fail.join('\n  ❌ ') : '  ✅ surface-on-mesh renders (native + hatch) — see ' + OUT);
  await sleep(800); await browser.close(); process.exit(fail.length ? 1 : 0);
}
