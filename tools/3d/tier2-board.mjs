// Tier-2 family render-board driver — screenshots ONE CONTACT SHEET PER MODE
// from tools/3d/tier2-board.html (cells render through the REAL product build
// path — see tier2-board-harness.ts).
//
//   node tools/3d/tier2-board.mjs        (dev server must be on :5182)
//
// Output: /tmp/dd-tier2/board-{rod,extrude,inflate,solid}.png + cells.json.
// Exits 1 on console errors or family-proof failures (joint sensitivity must
// vary blob counts; Holes OFF must fill the donut). Repo tool only.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require(
  '/Users/sebs/Desktop/Projects/portfolio/tools/lab-screenshots/node_modules/playwright',
);

const BASE_URL = process.env.BOARD_URL ?? 'http://localhost:5182/tools/3d/tier2-board.html';
const OUT_DIR = '/tmp/dd-tier2';
mkdirSync(OUT_DIR, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1320, height: 1400 } });
const consoleErrors = [];
page.on('console', (m) => {
  if (m.type() === 'error') consoleErrors.push(m.text());
});
page.on('pageerror', (e) => consoleErrors.push(String(e)));

await page.goto(BASE_URL, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__tier2Ready === true, null, { timeout: 30000 });

const cells = await page.evaluate(() => window.__tier2.runAll());
console.log(`tier-2 board: ${cells.length} cells rendered`);

let failures = 0;
const fail = (msg) => {
  failures++;
  console.log(`FAIL  ${msg}`);
};

// ── Family proofs from the per-cell info (engine receipts, not pixels) ──────
const byLabel = Object.fromEntries(cells.map((c) => [c.label, c.info]));
const j20 = byLabel['Sensitivity 20°']?.joints;
const j70 = byLabel['Sensitivity 70°']?.joints;
if (!(j20 > j70)) fail(`joint sensitivity inert: 20°→${j20} vs 70°→${j70}`);
else console.log(`PASS  joint sensitivity drives the engine: 20°→${j20} blobs · 70°→${j70}`);
const clean = byLabel['Joint: Clean'];
if (clean?.adornments !== 2) fail(`Joint: Clean should leave only 2 cap adornments, got ${clean?.adornments}`);
else console.log('PASS  Joint: Clean removes blob spheres (2 cap adornments remain)');
const holesOn = byLabel['Edge: Eased · Holes ON'];
const holesOff = byLabel['Edge: Eased · Holes OFF'];
if (holesOn?.holes !== 1) fail(`Holes ON donut should keep 1 hole, got ${holesOn?.holes}`);
if (holesOff?.holes !== 0) fail(`Holes OFF donut should fill, got ${holesOff?.holes}`);
if (holesOn?.holes === 1 && holesOff?.holes === 0) console.log('PASS  Holes ON/OFF drives the engine (1 → 0 holes)');

// ── Contact sheets (one per mode) ───────────────────────────────────────────
for (const mode of ['rod', 'extrude', 'inflate', 'solid']) {
  const path = join(OUT_DIR, `board-${mode}.png`);
  await page.locator(`#board-${mode}`).screenshot({ path });
  console.log(`sheet: ${path}`);
}

writeFileSync(join(OUT_DIR, 'cells.json'), JSON.stringify(cells, null, 2));
if (consoleErrors.length) {
  fail(`console errors: ${consoleErrors.join(' | ').slice(0, 400)}`);
}
console.log(`\n${failures === 0 ? 'ALL PROOFS PASS' : `${failures} FAILURES`} — read the sheets one by one.`);
await browser.close();
process.exit(failures === 0 ? 0 : 1);
