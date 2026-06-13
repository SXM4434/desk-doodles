// Rock F1 — BEFORE baselines for the shade-brush band-mask rebuild.
// READ-ONLY + write-proof: every non-GET request to supabase is ABORTED at the
// route layer, so even an accidental Place cannot write. Never clicks Place.
//
// Captures the as-built (pre-fix) behavior:
//   b1  repro (a): one-pen-down cross-hatch scribble → lumpy worm + overlap darkening
//   b2  repro (a2): 6 separate passes same band → overlap rectangles + patch count
//   b3  repro (b): re-stroke same band same spot → interior-invisible no-op
//   b4  repro (c): ink square + shade scribble inside → Style flip shards/caps
//        (rough-handdrawn, bold-ink, stipple)
//   b5  opacity baseline: raw Sketch tone at 0.55 (the SB-3 before shot)
import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire(import.meta.url);
const { chromium } = require('/Users/sebs/Desktop/Projects/portfolio/tools/lab-screenshots/node_modules/playwright');

const OUT = '/tmp/dd-rockf1/before';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1700, height: 1000 } });
// WRITE-PROOF WALL: abort every non-GET supabase request.
let blocked = 0;
await page.route(/supabase\.co/, (route) => {
  if (route.request().method() === 'GET') return route.continue();
  blocked++;
  console.log('[BLOCKED supabase write]', route.request().method(), route.request().url().slice(0, 110));
  return route.abort();
});
page.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 300)));

await page.goto('http://localhost:5182/desk', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2500);
await page.getByText('Add doodle', { exact: true }).click();
await page.waitForSelector('[role="dialog"][aria-label="Draw a doodle"]');
await page.waitForTimeout(400);

const dlg = page.locator('[role="dialog"][aria-label="Draw a doodle"]');
const canvas = dlg.locator('svg[viewBox="0 0 800 600"]').last();
const box = await canvas.boundingBox();
const fx = (u, v) => [box.x + box.width * u, box.y + box.height * v];

async function brushPath(pts) {
  await page.mouse.move(pts[0][0], pts[0][1]);
  await page.mouse.down();
  for (const [x, y] of pts.slice(1)) await page.mouse.move(x, y, { steps: 4 });
  await page.mouse.up();
  await page.waitForTimeout(120);
}
const shadePill = dlg.locator('button', { hasText: 'Shade' }).first();
const inkPill = dlg.locator('button', { hasText: 'Ink' }).first();
const sketchPill = dlg.locator('button', { hasText: 'Sketch' }).first();
const stylePill = dlg.locator('button', { hasText: 'Style' }).first();

// ── b1: ONE pen-down cross-hatch scribble (horizontal sweeps then vertical) ──
await shadePill.click();
await page.waitForTimeout(150);
const xhatch = [];
for (let i = 0; i <= 5; i++) xhatch.push(fx(i % 2 === 0 ? 0.15 : 0.4, 0.15 + i * 0.045));
for (let i = 0; i <= 5; i++) xhatch.push(fx(0.15 + i * 0.05, i % 2 === 0 ? 0.38 : 0.14));
await brushPath(xhatch);
await page.screenshot({ path: `${OUT}/b1-one-stroke-crosshatch.png` });

// ── b2: six separate passes over one area, same band ──
for (let i = 0; i < 6; i++) {
  await brushPath([fx(0.55, 0.16 + (i % 3) * 0.045), fx(0.85, 0.16 + (i % 3) * 0.045)]);
}
const patchCount = await page.evaluate(() => {
  const d = document.querySelector('[role="dialog"]');
  let n = 0;
  for (const g of d.querySelectorAll('svg g[opacity]')) n += g.querySelectorAll('path').length;
  return n;
});
console.log('BEFORE b2: tone <path> count after 1 scribble + 6 passes =', patchCount);
await page.screenshot({ path: `${OUT}/b2-six-passes.png` });

// ── b3: re-stroke the same spot, same band — pixel diff ──
const pre = await canvas.screenshot();
await brushPath([fx(0.55, 0.16), fx(0.85, 0.16)]);
const post = await canvas.screenshot();
fs.writeFileSync(`${OUT}/b3-restroke-after.png`, post);
console.log('BEFORE b3: re-stroke same band changed pixels?', !pre.equals(post));

// ── b5: opacity baseline shot (raw Sketch tone, current 0.55) ──
const op = await page.evaluate(() => {
  const d = document.querySelector('[role="dialog"]');
  const g = d.querySelector('svg g[opacity]');
  return g ? g.getAttribute('opacity') : null;
});
console.log('BEFORE b5: raw tone group opacity =', op);
await canvas.screenshot({ path: `${OUT}/b5-raw-tone-opacity-055.png` });

// ── b4: repro (c) — ink square, shade scribble inside, Style flips ──
// Clear-by-reopen: Esc arms, Esc closes; reopen fresh popup.
await page.keyboard.press('Escape');
await page.waitForTimeout(150);
await page.keyboard.press('Escape');
await page.waitForTimeout(400);
await page.getByText('Add doodle', { exact: true }).click();
await page.waitForSelector('[role="dialog"][aria-label="Draw a doodle"]');
await page.waitForTimeout(300);

const dlg2 = page.locator('[role="dialog"][aria-label="Draw a doodle"]');
const canvas2 = dlg2.locator('svg[viewBox="0 0 800 600"]').last();
const box2 = await canvas2.boundingBox();
const f2 = (u, v) => [box2.x + box2.width * u, box2.y + box2.height * v];

// ink square
await brushPath([f2(0.3, 0.25), f2(0.7, 0.25), f2(0.7, 0.75), f2(0.3, 0.75), f2(0.3, 0.25)]);
// shade scribble inside (hairpin zigzag — the self-intersection generator)
await dlg2.locator('button', { hasText: 'Shade' }).first().click();
await page.waitForTimeout(150);
const inner = [];
for (let i = 0; i <= 7; i++) inner.push(f2(i % 2 === 0 ? 0.36 : 0.64, 0.32 + i * 0.055));
await brushPath(inner);
await page.screenshot({ path: `${OUT}/b4-sketch-ink-square-shaded.png` });

// Style flip per style — drive the pen column's Style dropdown.
async function pickStyle(label) {
  const trigger = dlg2.locator('button[aria-haspopup="listbox"]').first();
  await trigger.click();
  await page.waitForTimeout(200);
  await page.locator('[role="option"]', { hasText: label }).first().click();
  await page.waitForTimeout(1800);
}
await dlg2.locator('button', { hasText: 'Style' }).first().click();
await page.waitForTimeout(2000);
for (const [id, label] of [
  ['rough-handdrawn', 'Rough hand-drawn'],
  ['bold-ink', 'Bold ink'],
  ['stipple', 'Stipple'],
]) {
  await pickStyle(label);
  await canvas2.screenshot({ path: `${OUT}/b4-styled-${id}.png` });
}

console.log('blocked write attempts:', blocked);
await browser.close();
console.log('BEFORE DONE — shots in', OUT);
