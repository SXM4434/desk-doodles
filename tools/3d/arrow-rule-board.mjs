// ARROW RULE board driver — produces the side-by-side ruling shot + proves
// the live chip flip + the unified-receipts channel on a real scene mount.
//
//   node tools/3d/arrow-rule-board.mjs        (dev server must be on :5182)
//
// Output: /tmp/dd-arrow-rule/board.png (the Sebs ruling shot) +
//         board-after-chip-flip.png (pane A welded shut via its LIVE chip).
// Exits 1 on any assertion failure. Repo tool only.
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require(
  '/Users/sebs/Desktop/Projects/portfolio/tools/lab-screenshots/node_modules/playwright',
);

const BASE_URL = process.env.BOARD_URL ?? 'http://localhost:5182/tools/3d/arrow-rule-board.html';
const OUT_DIR = '/tmp/dd-arrow-rule';
mkdirSync(OUT_DIR, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1000, height: 620 } });
const consoleErrors = [];
page.on('console', (m) => {
  if (m.type() === 'error') consoleErrors.push(m.text());
});
page.on('pageerror', (e) => consoleErrors.push(String(e)));

await page.goto(BASE_URL, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__arrowBoardReady === true, null, { timeout: 30000 });
await page.waitForTimeout(900); // let both GL canvases paint

let failures = 0;
const fail = (m) => {
  failures++;
  console.log(`FAIL  ${m}`);
};
const pass = (m) => console.log(`PASS  ${m}`);

const dflt = await page.evaluate(() => window.__arrowBoard.default);
console.log(`TREATED_AS_CLOSED_DEFAULT = '${dflt}'`);

// ── Chip presence + copy per pane ───────────────────────────────────────────
const chipA = page.locator('#pane-rod [data-dd-chip="treat-as-closed"]');
const chipB = page.locator('#pane-solid [data-dd-chip="treat-as-closed"]');
if ((await chipA.count()) !== 1) fail('pane A chip missing');
else {
  const txt = await chipA.textContent();
  const res = await chipA.getAttribute('data-resolved');
  if (res === 'open' && /treat as closed\?/i.test(txt ?? '')) pass(`pane A chip: "${txt}" (resolved=open)`);
  else fail(`pane A chip wrong: "${txt}" resolved=${res}`);
}
if ((await chipB.count()) !== 1) fail('pane B chip missing');
else {
  const txt = await chipB.textContent();
  const res = await chipB.getAttribute('data-resolved');
  if (res === 'closed' && /treated as closed/i.test(txt ?? '')) pass(`pane B chip: "${txt}" (resolved=closed)`);
  else fail(`pane B chip wrong: "${txt}" resolved=${res}`);
}

// ── THE ruling shot ─────────────────────────────────────────────────────────
await page.screenshot({ path: join(OUT_DIR, 'board.png'), fullPage: true });
console.log(`shot: ${OUT_DIR}/board.png`);

// ── Live flip: click pane A's chip → weld → correction in the unified log ──
await chipA.click();
await page.waitForTimeout(700);
const afterFlip = await page.evaluate(() => {
  const chip = document.querySelector('#pane-rod [data-dd-chip="treat-as-closed"]');
  const unified = window.__dd_decisionLog?.get?.() ?? [];
  const alias = window.__dd_conversionLog?.get?.() ?? [];
  return {
    chipResolved: chip?.getAttribute('data-resolved') ?? null,
    chipText: chip?.textContent ?? null,
    corrections: unified.filter((e) => e.entryType === 'conversion-correction'),
    aliasCorrections: alias.filter((e) => e.entryType === 'conversion-correction'),
  };
});
if (afterFlip.chipResolved === 'closed') pass(`chip flip welded pane A (chip now: "${afterFlip.chipText}")`);
else fail(`chip flip did not weld: resolved=${afterFlip.chipResolved}`);
const corr = afterFlip.corrections[0];
if (corr && corr.from === false && corr.to === true && corr.defaultAtFlip === dflt) {
  pass(`correction logged in UNIFIED __dd_decisionLog: ${JSON.stringify(corr)}`);
} else {
  fail(`correction missing/wrong in unified log: ${JSON.stringify(afterFlip.corrections)}`);
}
if (afterFlip.aliasCorrections.length === afterFlip.corrections.length) {
  pass('__dd_conversionLog alias returns the same filtered view');
} else {
  fail('alias/unified mismatch');
}

await page.screenshot({ path: join(OUT_DIR, 'board-after-chip-flip.png'), fullPage: true });
console.log(`shot: ${OUT_DIR}/board-after-chip-flip.png`);

if (consoleErrors.length) fail(`console errors: ${consoleErrors.join(' | ').slice(0, 300)}`);
console.log(failures === 0 ? '\nALL ARROW-BOARD CHECKS PASS' : `\n${failures} FAILURES`);
await browser.close();
process.exit(failures === 0 ? 0 : 1);
