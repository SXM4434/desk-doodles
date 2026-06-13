// Fill clean-edge diagnostic (wf_b690f923-0dc-2). Drives the REAL production
// fill path via /fill-diag: seeds a closed square + closed blob, switches the
// Shade register to Fill, taps inside each, optionally hits Full fill, then
// SCREENSHOTS and ANALYZES the boundary for (a) bleed past the outer ink edge,
// (b) a white sliver between the fill and the ink, (c) corner notches.
//
// Usage: node tools/2d/_fill-edge-diag.mjs <port> <outDir> <label> [fullfill]
import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let chromium;
for (const p of ['/tmp/dd-pp/node_modules/playwright', '/Users/sebs/Desktop/Projects/portfolio/tools/lab-screenshots/node_modules/playwright']) {
  try { ({ chromium } = require(p)); break; } catch { /* next */ }
}
if (!chromium) { console.error('no playwright'); process.exit(2); }

const PORT = process.argv[2] || '5267';
const OUT = process.argv[3] || '/tmp/dd-fill-diag';
const LABEL = process.argv[4] || 'run';
const FULLFILL = process.argv[5] === 'fullfill';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 900, height: 720 }, deviceScaleFactor: 1 });
const errs = [];
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
page.on('pageerror', (e) => errs.push('PAGEERR ' + e.message));

await page.goto(`http://localhost:${PORT}/fill-diag`, { waitUntil: 'networkidle' });
await page.waitForSelector('[data-diag-frame]');
await page.waitForTimeout(400);

// Ensure Fill tool is selected (harness defaults to it, but be explicit).
const fillBtn = await page.$('[data-shade-tool="fill"]');
if (fillBtn) await fillBtn.click();
await page.waitForTimeout(150);

if (FULLFILL) {
  // The UI "Full fill" pill bumps gap to the top tick (the production path).
  const ff = await page.$('[data-tone-fullfill]');
  if (ff) await ff.click();
  await page.waitForTimeout(150);
}

// Frame box in page coords (the 800x600 surface).
const frame = await page.$('[data-diag-frame]');
const box = await frame.boundingBox();
const toPage = (vx, vy) => ({ x: box.x + vx, y: box.y + vy }); // 1:1 viewBox→px

// TAP inside the square (center ~240,240) and the blob (center ~590,300).
for (const [vx, vy] of [[240, 240], [590, 300]]) {
  const p = toPage(vx, vy);
  await page.mouse.move(p.x, p.y);
  await page.mouse.down();
  await page.waitForTimeout(60);
  await page.mouse.up();
  await page.waitForTimeout(250);
}
await page.waitForTimeout(400);

const toneCount = await page.$eval('[data-diag-tone-count]', (el) => el.textContent);
const gapTxt = await page.$eval('[data-diag-gap]', (el) => el.textContent);

const shotPath = `${OUT}/fill-${LABEL}.png`;
await frame.screenshot({ path: shotPath });

await browser.close();
writeFileSync(`${OUT}/meta-${LABEL}.json`, JSON.stringify({ LABEL, FULLFILL, toneCount, gapTxt, errs }, null, 2));
console.log(JSON.stringify({ shot: shotPath, toneCount, gapTxt, errs }, null, 2));
