// GAP-MAP interaction probe — drives the high-risk INTERACTIVE surfaces the
// route sweep can't reach by URL alone: the create loop (draw→Done→name),
// the 2D↔3D flip on /canvas, the drawer, and the live-desk object census.
// Everything is observe-only: NO publish (Place/Done-to-desk never clicked on
// /desk), all Supabase mutations route-aborted. Screenshots are READ.
//
//   node tools/gapmap/interaction-probe.mjs   (preview on :4421)
// Shots → /tmp/dd-gapmap. Repo tool only.
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('/tmp/dd-pp/node_modules/playwright');

const BASE = process.env.DD_BASE ?? 'http://localhost:4421';
const OUT = '/tmp/dd-gapmap';
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();

async function newPage(width = 1440, height = 900) {
  const ctx = await browser.newContext({ viewport: { width, height } });
  const errs = [];
  await ctx.route('**://*.supabase.co/**', (r) => {
    const m = r.request().method();
    if (m === 'GET' || m === 'HEAD' || m === 'OPTIONS') return r.continue();
    return r.abort();
  });
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('pageerror', (e) => errs.push('PAGEERROR: ' + e.message));
  return { ctx, page, errs };
}

// freehand drag a stroke on a surface element
async function drawStroke(page, box, pts) {
  await page.mouse.move(box.x + pts[0][0], box.y + pts[0][1]);
  await page.mouse.down();
  for (const [x, y] of pts.slice(1)) { await page.mouse.move(box.x + x, box.y + y, { steps: 6 }); }
  await page.mouse.up();
  await page.waitForTimeout(400);
}

// ── PROBE 1: live desk object census (mode/type mix) ──
{
  const { ctx, page, errs } = await newPage();
  await page.goto(BASE + '/desk', { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(2500);
  const census = await page.evaluate(() => {
    // each desk object wraps an SvgStyleTransform render; canvas elements = 3D
    const canvases = document.querySelectorAll('canvas').length;
    const svgs = document.querySelectorAll('[data-desk-object], [data-object-id]').length;
    const allSvgWraps = document.querySelectorAll('main svg, [class*=desk] svg').length;
    return { canvases, svgs, allSvgWraps };
  }).catch((e) => ({ err: String(e) }));
  console.log('PROBE1 live-desk census:', JSON.stringify(census), 'errs=', errs.length);
  await ctx.close();
}

// ── PROBE 2: create loop — open DrawPanel, draw, reach naming card ──
{
  const { ctx, page, errs } = await newPage();
  await page.goto(BASE + '/desk', { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(2000);
  // click ADD DOODLE
  const add = await page.getByText(/add doodle/i).first();
  let opened = false;
  try { await add.click({ timeout: 5000 }); opened = true; } catch (e) {}
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/probe-drawpanel-open.png` });
  // find the draw surface (svg inside the popup) and draw a closed-ish shape
  let drew = false;
  try {
    const surf = await page.locator('svg').filter({ hasNot: page.locator('use') }).last();
    const box = await surf.boundingBox();
    if (box) {
      await drawStroke(page, box, [[120,120],[260,120],[260,240],[120,240],[120,122]]);
      drew = true;
    }
  } catch (e) {}
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/probe-drawpanel-drawn.png` });
  // try to click Done to reach naming card
  let doned = false;
  try { await page.getByRole('button', { name: /^done$/i }).first().click({ timeout: 3000 }); doned = true; } catch (e) {}
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${OUT}/probe-drawpanel-naming.png` });
  console.log(`PROBE2 create-loop: opened=${opened} drew=${drew} doned=${doned} errs=${errs.length}`);
  if (errs.length) fs.appendFileSync(`${OUT}/errors.txt`, '\n=== PROBE2 ===\n' + errs.join('\n'));
  await ctx.close();
}

// ── PROBE 3: 2D→3D flip on /canvas with a real drawn stroke ──
{
  const { ctx, page, errs } = await newPage();
  await page.goto(BASE + '/canvas', { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(1500);
  // draw on the 2D surface
  let drew = false;
  try {
    const surf = await page.locator('svg').last();
    const box = await surf.boundingBox();
    if (box) {
      await drawStroke(page, box, [[150,300],[300,150],[450,300],[300,450],[150,300]]);
      drew = true;
    }
  } catch (e) {}
  await page.screenshot({ path: `${OUT}/probe-canvas-2d-drawn.png` });
  // flip to 3D
  let flipped = false;
  try { await page.getByText('3D', { exact: true }).first().click({ timeout: 3000 }); flipped = true; } catch (e) {}
  await page.waitForTimeout(3500); // R3F lazy load + render
  await page.screenshot({ path: `${OUT}/probe-canvas-3d.png` });
  const has3d = await page.evaluate(() => document.querySelectorAll('canvas').length).catch(() => 0);
  console.log(`PROBE3 2d->3d flip: drew=${drew} flipped=${flipped} canvases=${has3d} errs=${errs.length}`);
  if (errs.length) fs.appendFileSync(`${OUT}/errors.txt`, '\n=== PROBE3 ===\n' + errs.join('\n'));
  await ctx.close();
}

// ── PROBE 4: drawer open ──
{
  const { ctx, page, errs } = await newPage();
  await page.goto(BASE + '/desk', { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(2000);
  let drawerOpen = false;
  try { await page.getByText(/drawer/i).first().click({ timeout: 3000 }); drawerOpen = true; } catch (e) {}
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${OUT}/probe-drawer.png` });
  console.log(`PROBE4 drawer: opened=${drawerOpen} errs=${errs.length}`);
  await ctx.close();
}

// ── PROBE 5: pan/zoom extremes on /desk ──
{
  const { ctx, page, errs } = await newPage();
  await page.goto(BASE + '/desk', { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(2000);
  // zoom in hard via wheel over the desk center
  await page.mouse.move(700, 450);
  for (let i = 0; i < 20; i++) { await page.mouse.wheel(0, -120); await page.waitForTimeout(30); }
  await page.screenshot({ path: `${OUT}/probe-desk-zoomin.png` });
  for (let i = 0; i < 40; i++) { await page.mouse.wheel(0, 120); await page.waitForTimeout(20); }
  await page.screenshot({ path: `${OUT}/probe-desk-zoomout.png` });
  console.log(`PROBE5 pan/zoom: errs=${errs.length}`);
  await ctx.close();
}

console.log('\n— interaction probe done —');
await browser.close();
