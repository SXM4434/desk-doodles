// ROCK Y — existing-style regression capture (run BEFORE and AFTER the
// wireframe build; pixel-diff the two dirs with diff-dirs.mjs).
//
//   node tools/rocky/capture-existing.mjs baseline   → /tmp/dd-rocky/baseline
//   node tools/rocky/capture-existing.mjs after      → /tmp/dd-rocky/after
//
// Captures (all DETERMINISTIC: fixed viewport, fixed stroke coords, seeded
// engine randomness):
//   - /audit: 6 representative cells × {rough-handdrawn, clean, outline-only}
//   - /canvas: deterministic drawn doodle × {rough-handdrawn, outline-only}
//   - /canvas: rose upload × rough-handdrawn
// LIVE-DB: none of these routes write (or even read) the DB.

import { createRequire } from 'node:module';
import fs from 'node:fs';

const require = createRequire(import.meta.url);
const { chromium } = require('/Users/sebs/Desktop/Projects/portfolio/tools/lab-screenshots/node_modules/playwright');

const MODE = process.argv[2] || 'baseline';
// HMR-churn rule: another rock edits this tree live — capture from a vite
// preview build (DD_BASE=http://localhost:4399) for stable screenshots.
const BASE = process.env.DD_BASE || 'http://localhost:5182';
const OUT = `/tmp/dd-rocky/${MODE}`;
fs.mkdirSync(OUT, { recursive: true });

const ROSE = '/Users/sebs/Downloads/rose_line_art_cropped.svg';

// 6 representative shape classes (picked spread across the 197 grid by index;
// ids resolved at runtime so the pick is stable across runs).
const CELL_INDICES = [0, 33, 66, 99, 132, 165];

async function settle(page, ms = 1800) { await page.waitForTimeout(ms); }

async function pickStyle(page, label) {
  // Style dropdown trigger shows the current style label.
  const trigger = page.getByRole('button', { name: new RegExp(`^(Clean|Outline only|Rough hand-drawn|Sketchy|Bold ink|Wet ink|Stipple|Charcoal|Risograph|Newsprint|Wireframe)$`, 'i') }).first();
  await trigger.click();
  await page.waitForTimeout(300);
  await page.getByRole('option', { name: new RegExp(`^${label}$`, 'i') }).first().click()
    .catch(async () => {
      // Dropdown options may not carry option role — fall back to text click.
      await page.getByText(label, { exact: true }).last().click();
    });
  await settle(page);
}

async function drawDeterministicDoodle(page) {
  const svg = page.locator('main svg').first();
  const box = await svg.boundingBox();
  const px = (rx, ry) => [box.x + box.width * rx, box.y + box.height * ry];
  // Stroke 1 — open zigzag line.
  const path1 = [[0.15, 0.7], [0.25, 0.3], [0.35, 0.65], [0.45, 0.28], [0.55, 0.6]];
  // Stroke 2 — closed-ish blob (heartish loop).
  const path2 = [[0.68, 0.35], [0.78, 0.25], [0.86, 0.4], [0.78, 0.62], [0.7, 0.5], [0.68, 0.36]];
  for (const pts of [path1, path2]) {
    const [sx, sy] = px(pts[0][0], pts[0][1]);
    await page.mouse.move(sx, sy);
    await page.mouse.down();
    for (const [rx, ry] of pts.slice(1)) {
      const [x, y] = px(rx, ry);
      // interpolate for dense capture
      await page.mouse.move(x, y, { steps: 8 });
    }
    await page.mouse.up();
    await page.waitForTimeout(150);
  }
  await page.getByRole('button', { name: /^Done/ }).click();
  await settle(page);
}

const run = async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('PAGEERROR:', String(e).slice(0, 200)));

  // ── /audit cells × 3 styles ──────────────────────────────────────────────
  await page.goto(`${BASE}/audit`, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-shape-id]');
  await settle(page, 2500);
  const ids = await page.$$eval('[data-shape-id]', (els) => els.map((e) => e.getAttribute('data-shape-id')));
  const cellIds = CELL_INDICES.map((i) => ids[i]).filter(Boolean);
  fs.writeFileSync(`${OUT}/cell-ids.json`, JSON.stringify(cellIds));
  for (const style of ['Rough hand-drawn', 'Clean', 'Outline only']) {
    if (style !== 'Rough hand-drawn') await pickStyle(page, style);
    await settle(page, 1200);
    for (const id of cellIds) {
      const cell = page.locator(`[data-shape-id="${id}"]`);
      await cell.scrollIntoViewIfNeeded();
      await page.waitForTimeout(120);
      await cell.screenshot({ path: `${OUT}/audit-${style.replace(/\s+/g, '')}-${id}.png` });
    }
  }

  // ── /canvas drawn doodle × 2 styles ──────────────────────────────────────
  await page.goto(`${BASE}/canvas`, { waitUntil: 'networkidle' });
  await settle(page);
  await drawDeterministicDoodle(page);
  const frame = page.locator('main > div').first();
  await frame.screenshot({ path: `${OUT}/canvas-drawn-RoughHand.png` });
  await pickStyle(page, 'Outline only');
  await frame.screenshot({ path: `${OUT}/canvas-drawn-OutlineOnly.png` });

  // ── /canvas rose upload at rough-handdrawn ───────────────────────────────
  await page.goto(`${BASE}/canvas`, { waitUntil: 'networkidle' });
  await settle(page);
  await page.getByRole('button', { name: 'Upload SVG' }).click();
  await page.waitForTimeout(300);
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(ROSE);
  await settle(page, 2500);
  await frame.screenshot({ path: `${OUT}/canvas-rose-RoughHand.png` });

  await browser.close();
  console.log(`captured → ${OUT}`);
};

run().catch((e) => { console.error(e); process.exit(1); });
