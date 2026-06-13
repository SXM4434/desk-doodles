// GAP-MAP conversion probe — actually drives the 2D→3D wedge with REAL
// PointerEvents (DrawSurface uses onPointerDown/Move/Up + setPointerCapture,
// which playwright mouse.* doesn't satisfy). Dispatches synthetic
// PointerEvents into the surface, then flips to 3D and reads the canvas.
// Observe-only: all Supabase mutations route-aborted. Screenshots READ.
//   node tools/gapmap/conversion-probe.mjs   (preview on :4421)
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('/tmp/dd-pp/node_modules/playwright');
const BASE = process.env.DD_BASE ?? 'http://localhost:4421';
const OUT = '/tmp/dd-gapmap';
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.route('**://*.supabase.co/**', (r) => {
  const m = r.request().method();
  if (m === 'GET' || m === 'HEAD' || m === 'OPTIONS') return r.continue();
  return r.abort();
});
const page = await ctx.newPage();
const errs = [];
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
page.on('pageerror', (e) => errs.push('PAGEERROR: ' + e.message));

await page.goto(BASE + '/canvas', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

// Dispatch real pointer events into the draw <svg>.
const result = await page.evaluate(() => {
  const svg = document.querySelector('main svg');
  if (!svg) return { ok: false, reason: 'no svg' };
  const r = svg.getBoundingClientRect();
  const pt = (fx, fy) => ({ x: r.left + r.width * fx, y: r.top + r.height * fy });
  const fire = (type, p) => {
    const ev = new PointerEvent(type, {
      pointerId: 1, pointerType: 'pen', isPrimary: true, pressure: 0.6,
      bubbles: true, cancelable: true, clientX: p.x, clientY: p.y,
    });
    svg.dispatchEvent(ev);
  };
  // a closed-ish triangle (should convert to extrude/solid)
  const path = [[0.3,0.3],[0.7,0.3],[0.5,0.7],[0.3,0.3]].map(([fx,fy]) => pt(fx,fy));
  fire('pointerdown', path[0]);
  for (let i = 1; i < path.length; i++) {
    for (let s = 0; s < 8; s++) {
      const a = path[i-1], b = path[i], t = s/8;
      fire('pointermove', { x: a.x+(b.x-a.x)*t, y: a.y+(b.y-a.y)*t });
    }
  }
  fire('pointerup', path[path.length-1]);
  return { ok: true };
});
await page.waitForTimeout(800);
await page.screenshot({ path: `${OUT}/conv-2d-stroke.png` });
console.log('dispatch:', JSON.stringify(result));

// flip to 3D
await page.getByText('3D', { exact: true }).first().click().catch(() => {});
await page.waitForTimeout(4000);
await page.screenshot({ path: `${OUT}/conv-3d-extrude.png` });
const canvases = await page.evaluate(() => document.querySelectorAll('canvas').length);
console.log('after flip canvases =', canvases, 'errs =', errs.length);

// try each geometry mode if a chrome dropdown exists
for (const mode of ['Rod', 'Inflate', 'Solid']) {
  try {
    const dd = page.locator('select, [role=combobox]').first();
    // chrome uses custom Dropdown; click the GEOMETRY MODE trigger then the option
    await page.getByText(/geometry mode/i).first().scrollIntoViewIfNeeded().catch(()=>{});
    const trigger = page.locator('text=Auto').first();
    await trigger.click({ timeout: 1500 }).catch(()=>{});
    await page.getByText(mode, { exact: true }).first().click({ timeout: 1500 }).catch(()=>{});
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `${OUT}/conv-3d-${mode.toLowerCase()}.png` });
  } catch (e) {}
}
if (errs.length) fs.appendFileSync(`${OUT}/errors.txt`, '\n=== conversion-probe ===\n' + errs.join('\n'));
console.log('— conversion probe done —');
await browser.close();
