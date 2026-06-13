// Render tools/og/og-card.html → an exact 1200x630 PNG via playwright.
//
//   node tools/og/render.mjs [outPath]
//
// Default outPath = public/og-image.png. deviceScaleFactor:1 so the PNG is
// EXACTLY 1200x630 device pixels (OG spec). Waits on document.fonts.ready +
// a settle delay so Fraunces/Instrument Sans + the fractal-noise grain paint
// before capture. Shared playwright install (no local dep) — same resolver as
// tools/3d/audit-sweep.mjs.
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require(
  '/Users/sebs/Desktop/Projects/portfolio/tools/lab-screenshots/node_modules/playwright',
);

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, '../..');
const CARD = join(__dirname, 'og-card.html');
const OUT = process.argv[2] ? resolve(process.argv[2]) : join(REPO, 'public', 'og-image.png');

const W = 1200, H = 630;

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: W, height: H },
  deviceScaleFactor: 1,
});
const page = await ctx.newPage();

const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

await page.goto(pathToFileURL(CARD).href, { waitUntil: 'networkidle' });
// Fonts must be resolved or the wordmark falls back to serif/sans default.
await page.evaluate(() => document.fonts.ready);
// Settle: fractal-noise grain + webfont metrics.
await page.waitForTimeout(600);

const el = await page.$('.card');
const box = await el.boundingBox();
console.log('card box:', JSON.stringify(box));

await el.screenshot({ path: OUT });

await browser.close();

if (errors.length) {
  console.log('PAGE ERRORS:\n' + errors.join('\n'));
} else {
  console.log('no page errors');
}
console.log('wrote ' + OUT);
