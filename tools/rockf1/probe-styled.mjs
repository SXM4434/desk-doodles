// Quick diagnostic: what is the DOM state after flipping Style with tone present?
import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire(import.meta.url);
const { chromium } = require('/Users/sebs/Desktop/Projects/portfolio/tools/lab-screenshots/node_modules/playwright');
const OUT = '/tmp/dd-rockf1';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1700, height: 1000 } });
await page.route(/supabase\.co/, (route) =>
  route.request().method() === 'GET' ? route.continue() : route.abort(),
);
page.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 400)));
page.on('console', (m) => {
  if (m.type() === 'error') console.log('[console.error]', m.text().slice(0, 400));
  if (m.type() === 'warning' && /panel|boundary|snag/i.test(m.text())) console.log('[warn]', m.text().slice(0, 200));
});
await page.goto('http://localhost:5182/desk', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2500);
await page.getByText('Add doodle', { exact: true }).click();
await page.waitForSelector('[role="dialog"][aria-label="Draw a doodle"]');
await page.waitForTimeout(350);
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
await brushPath([fx(0.3, 0.25), fx(0.7, 0.25), fx(0.7, 0.75), fx(0.3, 0.75), fx(0.3, 0.25)]);
await dlg.locator('button', { hasText: 'Shade' }).first().click();
await page.waitForTimeout(150);
const inner = [];
for (let i = 0; i <= 7; i++) inner.push(fx(i % 2 === 0 ? 0.36 : 0.64, 0.32 + i * 0.055));
await brushPath(inner);
console.log('tone fills:', await page.evaluate(() => (window.__dd_toneFills ?? []).length));
await dlg.locator('button', { hasText: 'Style' }).first().click();
await page.waitForTimeout(2500);
const state = await page.evaluate(() => {
  const d = document.querySelector('[role="dialog"][aria-label="Draw a doodle"]');
  const anyDialog = [...document.querySelectorAll('[role="dialog"]')].map((x) => x.getAttribute('aria-label'));
  const snag = document.body.textContent.includes('hit a snag');
  let toneBandPaths = 0;
  let svgCount = 0;
  let listboxes = 0;
  if (d) {
    toneBandPaths = d.querySelectorAll('path[data-tone-band]').length;
    svgCount = d.querySelectorAll('svg').length;
    listboxes = d.querySelectorAll('button[aria-haspopup="listbox"]').length;
  }
  return { dialogPresent: !!d, anyDialog, snag, toneBandPaths, svgCount, listboxes };
});
console.log('styled DOM state:', JSON.stringify(state, null, 1));
await page.screenshot({ path: `${OUT}/probe-styled-fullpage.png` });
await browser.close();
