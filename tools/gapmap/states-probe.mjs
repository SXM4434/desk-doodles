// GAP-MAP states probe — upload-svg / upload-image stub / OFFLINE desk /
// empty-desk / smart-pick chip surfaces. All Supabase writes route-aborted;
// the OFFLINE case aborts reads too (simulates a dead backend → must show the
// honest offline state, not a crash). Screenshots READ.
//   node tools/gapmap/states-probe.mjs   (preview on :4421)
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('/tmp/dd-pp/node_modules/playwright');
const BASE = process.env.DD_BASE ?? 'http://localhost:4421';
const OUT = '/tmp/dd-gapmap';
const browser = await chromium.launch();

async function mk(opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  await ctx.route('**://*.supabase.co/**', (r) => {
    if (opts.offline) return r.abort(); // kill ALL backend traffic
    const m = r.request().method();
    if (m === 'GET' || m === 'HEAD' || m === 'OPTIONS') return r.continue();
    return r.abort();
  });
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('pageerror', (e) => errs.push('PAGEERROR: ' + e.message));
  return { ctx, page, errs };
}

// ── OFFLINE /desk (backend dead) ──
{
  const { ctx, page, errs } = await mk({ offline: true });
  await page.goto(BASE + '/desk', { waitUntil: 'domcontentloaded' }).catch(()=>{});
  await page.waitForTimeout(4000);
  await page.screenshot({ path: `${OUT}/state-desk-offline.png` });
  const txt = await page.evaluate(() => document.body.innerText.slice(0, 300)).catch(()=> '');
  console.log('OFFLINE /desk errs=', errs.length, '| text:', JSON.stringify(txt.replace(/\n/g,' ').slice(0,120)));
  await ctx.close();
}
// ── OFFLINE /desks gallery ──
{
  const { ctx, page, errs } = await mk({ offline: true });
  await page.goto(BASE + '/desks', { waitUntil: 'domcontentloaded' }).catch(()=>{});
  await page.waitForTimeout(3500);
  await page.screenshot({ path: `${OUT}/state-desks-offline.png` });
  const txt = await page.evaluate(() => document.body.innerText.slice(0, 200)).catch(()=> '');
  console.log('OFFLINE /desks errs=', errs.length, '| text:', JSON.stringify(txt.replace(/\n/g,' ').slice(0,120)));
  await ctx.close();
}
// ── upload-image stub on /canvas ──
{
  const { ctx, page, errs } = await mk();
  await page.goto(BASE + '/canvas', { waitUntil: 'networkidle' }).catch(()=>{});
  await page.waitForTimeout(1200);
  await page.getByText('Upload image', { exact: true }).first().click({ timeout: 3000 }).catch(()=>{});
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/state-upload-image-stub.png` });
  const txt = await page.evaluate(() => document.body.innerText).catch(()=> '');
  console.log('upload-image stub errs=', errs.length, '| has-hardpath-note:', /hard path|vision|autotrace|trace|stretch|not.*yet|S1/i.test(txt));
  await ctx.close();
}
// ── upload-svg picker on /canvas ──
{
  const { ctx, page, errs } = await mk();
  await page.goto(BASE + '/canvas', { waitUntil: 'networkidle' }).catch(()=>{});
  await page.waitForTimeout(1000);
  await page.getByText('Upload SVG', { exact: true }).first().click({ timeout: 3000 }).catch(()=>{});
  await page.waitForTimeout(600);
  // inject an SVG file via the hidden file input + change event
  const fileInputs = await page.locator('input[type=file]').count();
  await page.screenshot({ path: `${OUT}/state-upload-svg-picker.png` });
  console.log('upload-svg picker errs=', errs.length, '| file-inputs=', fileInputs);
  await ctx.close();
}
fs.appendFileSync(`${OUT}/errors.txt`, '');
console.log('— states probe done —');
await browser.close();
