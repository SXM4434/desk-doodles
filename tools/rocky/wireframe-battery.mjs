// ROCK Y — WIREFRAME SCHEMATIC BATTERY. Run against the vite preview build
// (HMR-churn rule; another rock edits this tree live):
//   npm run build && npx vite preview --port 4399 --strictPort &
//   node tools/rocky/wireframe-battery.mjs
//
// Coverage (every screenshot READ by the agent; structural asserts inline):
//   A  dropdown honesty — Wireframe present, detail line correct, 11 styles
//   B  rose line-art upload → wireframe (THE anti-fixture: the old stub drew
//      bounding boxes on exactly this art; assert ZERO bbox rects + path
//      geometry preserved + contour linework visible)
//   C  rose FILLED variant — fill paint removed, boundary register lines
//   D  strokes-over-upload merged markup — primary contours (full ink) vs
//      fill-boundary (pen-tip ribbon outline) coexist
//   E  drawn doodle → wireframe — uniform hairline, NO hand-feel (pixel-diff
//      vs rough-handdrawn of the same strokes must be LARGE), wobble state
//      carried from a rough style must not leak in
//   F  per-slider min/max — strokeWidth / Simplify / fillOpacity /
//      inkIntensity each visibly change the render (pixel-diff > 0)
//   G  chrome honesty — exactly the 4 declared controls render for wireframe
//      (no fake sliders)
//
// LIVE-DB: /canvas + /audit only — zero DB reads or writes.

import { createRequire } from 'node:module';
import fs from 'node:fs';

const require = createRequire(import.meta.url);
const { chromium } = require('/Users/sebs/Desktop/Projects/portfolio/tools/lab-screenshots/node_modules/playwright');

const BASE = process.env.DD_BASE || 'http://localhost:4399';
const OUT = '/tmp/dd-rocky/battery';
fs.mkdirSync(OUT, { recursive: true });

const ROSE = '/Users/sebs/Downloads/rose_line_art_cropped.svg';
const ROSE_FILLED = '/tmp/dd-rocky/fixtures/rose-filled.svg';
const ROSE_MERGED = '/tmp/dd-rocky/fixtures/rose-merged-strokes.svg';

const results = [];
function record(id, desc, pass, note = '') {
  results.push({ id, desc, pass, note });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${id}  ${desc}${note ? ` — ${note}` : ''}`);
}

async function settle(page, ms = 1500) { await page.waitForTimeout(ms); }

async function pickStyle(page, label) {
  const trigger = page.getByRole('button', { name: /^(Clean|Outline only|Rough hand-drawn|Sketchy|Bold ink|Wet ink|Stipple|Charcoal|Risograph|Newsprint|Wireframe)$/i }).first();
  await trigger.click();
  await page.waitForTimeout(300);
  await page.getByText(label, { exact: true }).last().click();
  await settle(page);
}

/** Set a chrome Slider by its label text through React's native value setter. */
async function setSlider(page, label, value) {
  await page.evaluate(({ label, value }) => {
    const spans = Array.from(document.querySelectorAll('span'));
    const lab = spans.find((s) => (s.textContent || '').trim().toUpperCase() === label.toUpperCase());
    if (!lab) throw new Error(`slider label not found: ${label}`);
    let row = lab.parentElement;
    let input = null;
    while (row && !input) { input = row.querySelector('input[type="range"]'); row = row.parentElement; }
    if (!input) throw new Error(`range input not found for: ${label}`);
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(input, String(value));
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, { label, value });
  await settle(page, 1000);
}

async function uploadFixture(page, file) {
  await page.goto(`${BASE}/canvas`, { waitUntil: 'networkidle' });
  await settle(page);
  await page.getByRole('button', { name: 'Upload SVG' }).click();
  await page.locator('input[type="file"]').setInputFiles(file);
  await settle(page, 2000);
}

function frameOf(page) { return page.locator('main > div').first(); }

/** Structural stats of the wireframe render. */
async function wireStats(page) {
  return page.evaluate(() => {
    const root = document.querySelector('[data-svg-style="wireframe"]');
    if (!root) return null;
    const tagged = Array.from(root.querySelectorAll('[data-f3-wireframe]'));
    const byReg = { contour: 0, boundary: 0, bbox: 0 };
    const bad = [];
    for (const el of tagged) {
      const reg = el.getAttribute('data-f3-wireframe');
      byReg[reg] = (byReg[reg] || 0) + 1;
      const st = el.style;
      if (st.fill !== 'none') bad.push(`paintedFill:${el.tagName}`);
      if (!st.stroke.includes('--dir-text-primary')) bad.push(`offInk:${el.tagName}:${st.stroke}`);
      if (el.getAttribute('vector-effect') !== 'non-scaling-stroke') bad.push(`scalingStroke:${el.tagName}`);
    }
    // any UNTAGGED renderable leaf still painting a fill? (excluding defs etc.)
    const widths = new Set(tagged.map((el) => el.style.strokeWidth));
    return {
      tagged: tagged.length,
      byReg,
      widths: Array.from(widths),
      bad: bad.slice(0, 6),
      paths: root.querySelectorAll('path').length,
      rects: root.querySelectorAll('rect').length,
    };
  });
}

async function pixelDiffShots(page, fileA, fileB) {
  const a64 = fs.readFileSync(fileA).toString('base64');
  const b64 = fs.readFileSync(fileB).toString('base64');
  const tab = await page.context().newPage();
  await tab.goto('about:blank');
  const res = await tab.evaluate(async ({ a64, b64 }) => {
    const load = (b) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = `data:image/png;base64,${b}`; });
    const [ia, ib] = await Promise.all([load(a64), load(b64)]);
    if (ia.width !== ib.width || ia.height !== ib.height) return { diff: -1, total: 0 };
    const px = (img) => { const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d'); x.drawImage(img, 0, 0); return x.getImageData(0, 0, img.width, img.height).data; };
    const da = px(ia); const db = px(ib);
    let diff = 0;
    for (let i = 0; i < da.length; i += 4) {
      if (Math.abs(da[i] - db[i]) > 8 || Math.abs(da[i + 1] - db[i + 1]) > 8 || Math.abs(da[i + 2] - db[i + 2]) > 8) diff++;
    }
    return { diff, total: da.length / 4 };
  }, { a64, b64 });
  await tab.close();
  return res;
}

const run = async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e).slice(0, 200)));
  page.on('console', (m) => { if (m.text().includes('style engine threw')) pageErrors.push(`DEGRADE: ${m.text().slice(0, 160)}`); });

  // ── A: dropdown honesty ──────────────────────────────────────────────────
  await page.goto(`${BASE}/canvas`, { waitUntil: 'networkidle' });
  await settle(page);
  await page.getByRole('button', { name: /^Rough hand-drawn$/i }).first().click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/A-dropdown.png` });
  const bodyText = await page.evaluate(() => document.body.innerText);
  record('A1', 'dropdown lists Wireframe', bodyText.includes('Wireframe'));
  record('A2', 'honest detail line present', /Uniform hairline schematic — contours only/i.test(bodyText));
  const styleCount = ['Clean', 'Outline only', 'Rough hand-drawn', 'Sketchy', 'Bold ink', 'Wet ink', 'Stipple', 'Charcoal', 'Risograph', 'Newsprint', 'Wireframe']
    .filter((l) => bodyText.includes(l)).length;
  record('A3', 'all 11 styles present', styleCount === 11, `${styleCount}/11`);
  await page.keyboard.press('Escape');

  // ── B: rose line-art — THE anti-fixture ─────────────────────────────────
  await uploadFixture(page, ROSE);
  await pickStyle(page, 'Wireframe');
  await frameOf(page).screenshot({ path: `${OUT}/B-rose-wireframe.png` });
  const bStats = await wireStats(page);
  record('B1', 'wireframe transform ran (tagged elements present)', !!bStats && bStats.tagged > 0, JSON.stringify(bStats?.byReg));
  record('B2', 'ANTI-FIXTURE: zero bounding-box rects', !!bStats && bStats.byReg.bbox === 0 && bStats.rects === 0, `rects=${bStats?.rects}`);
  record('B3', 'true geometry preserved (paths intact, fill->boundary register)', !!bStats && bStats.paths >= 1 && bStats.byReg.boundary > 0, `paths=${bStats?.paths}`);
  record('B4', 'ink/fill/non-scaling-stroke invariants', !!bStats && bStats.bad.length === 0, bStats?.bad.join(';') || 'clean');

  // ── C: rose FILLED variant ───────────────────────────────────────────────
  await uploadFixture(page, ROSE_FILLED);
  await frameOf(page).screenshot({ path: `${OUT}/C0-rose-filled-clean-ref.png` });
  await pickStyle(page, 'Wireframe');
  await frameOf(page).screenshot({ path: `${OUT}/C-rose-filled-wireframe.png` });
  const cStats = await wireStats(page);
  record('C1', 'filled variant: every painted fill became boundary linework', !!cStats && cStats.byReg.boundary >= 2 && cStats.bad.length === 0, JSON.stringify(cStats?.byReg));
  // colored ink must be GONE: sample the raster for the fill colors
  const colorCheck = await pixelDiffShots(page, `${OUT}/C0-rose-filled-clean-ref.png`, `${OUT}/C-rose-filled-wireframe.png`);
  record('C2', 'render differs massively from the filled clean source', colorCheck.diff / colorCheck.total > 0.02, `${(100 * colorCheck.diff / colorCheck.total).toFixed(2)}% px`);

  // ── D: strokes-over-upload merged markup ────────────────────────────────
  await uploadFixture(page, ROSE_MERGED);
  await pickStyle(page, 'Wireframe');
  await frameOf(page).screenshot({ path: `${OUT}/D-merged-wireframe.png` });
  const dStats = await wireStats(page);
  record('D1', 'merged: primary contours AND boundary lines coexist',
    !!dStats && dStats.byReg.contour >= 2 && dStats.byReg.boundary >= 1,
    JSON.stringify(dStats?.byReg));
  record('D2', 'merged: two weight registers live (contour vs boundary widths)',
    !!dStats && dStats.widths.length >= 2, `widths=${dStats?.widths.join(',')}`);

  // ── E: drawn doodle — no hand-feel ───────────────────────────────────────
  await page.goto(`${BASE}/canvas`, { waitUntil: 'networkidle' });
  await settle(page);
  // carry rough hand-feel state first: wobble up, THEN switch to wireframe —
  // leak check (suppression must be structural, not value-dependent)
  const svg = page.locator('main svg').first();
  const box = await svg.boundingBox();
  const px = (rx, ry) => [box.x + box.width * rx, box.y + box.height * ry];
  for (const pts of [
    [[0.15, 0.7], [0.25, 0.3], [0.35, 0.65], [0.45, 0.28], [0.55, 0.6]],
    [[0.68, 0.35], [0.78, 0.25], [0.86, 0.4], [0.78, 0.62], [0.7, 0.5], [0.68, 0.36]],
  ]) {
    const [sx, sy] = px(pts[0][0], pts[0][1]);
    await page.mouse.move(sx, sy); await page.mouse.down();
    for (const [rx, ry] of pts.slice(1)) { const [x, y] = px(rx, ry); await page.mouse.move(x, y, { steps: 8 }); }
    await page.mouse.up(); await page.waitForTimeout(120);
  }
  await page.getByRole('button', { name: /^Done/ }).click();
  await settle(page);
  await setSlider(page, 'Wobble', 2.0);
  await frameOf(page).screenshot({ path: `${OUT}/E0-drawn-rough-wobble2.png` });
  await pickStyle(page, 'Wireframe');
  await frameOf(page).screenshot({ path: `${OUT}/E-drawn-wireframe.png` });
  const eStats = await wireStats(page);
  record('E1', 'drawn strokes render as primary contours', !!eStats && eStats.byReg.contour >= 2 && eStats.byReg.bbox === 0, JSON.stringify(eStats?.byReg));
  const eDiff = await pixelDiffShots(page, `${OUT}/E0-drawn-rough-wobble2.png`, `${OUT}/E-drawn-wireframe.png`);
  record('E2', 'wireframe ≠ rough (hand-feel visibly gone)', eDiff.diff / eDiff.total > 0.002, `${(100 * eDiff.diff / eDiff.total).toFixed(3)}% px`);
  // single uniform width on a pure-stroke doodle
  record('E3', 'uniform weight on drawn art (one stroke-width)', !!eStats && eStats.widths.length === 1, `widths=${eStats?.widths.join(',')}`);

  // ── F: per-slider min/max ────────────────────────────────────────────────
  // Ink intensity + Fill opacity live in the "Color / palette" section,
  // defaultOpen={false} — expand it before driving them.
  async function expandColorSection() {
    const visible = await page.getByText('Ink intensity', { exact: true }).count();
    if (!visible) {
      await page.getByText('Color / palette', { exact: true }).first().click();
      await page.waitForTimeout(400);
    }
  }
  async function sliderCase(label, min, max, shotBase, threshold, restore) {
    await setSlider(page, label, min);
    await frameOf(page).screenshot({ path: `${OUT}/${shotBase}-min.png` });
    await setSlider(page, label, max);
    await frameOf(page).screenshot({ path: `${OUT}/${shotBase}-max.png` });
    const d = await pixelDiffShots(page, `${OUT}/${shotBase}-min.png`, `${OUT}/${shotBase}-max.png`);
    record(`F:${label}`, `${label} min→max changes the render`, d.diff > 0 && d.diff / d.total > threshold, `${(100 * d.diff / d.total).toFixed(4)}% px`);
    if (restore !== undefined) await setSlider(page, label, restore);
  }
  // Stroke width + Ink intensity on the drawn doodle (pure contours).
  await sliderCase('Stroke width', 0.5, 3.0, 'F-strokewidth', 0.0002, 0.75);
  await expandColorSection();
  await sliderCase('Ink intensity', 0.15, 1.0, 'F-ink', 0.0002, 1.0);
  // Simplify on the rose line-art — REAL traced geometry. (The drawn battery
  // doodle is straight segments + mouse-interpolated collinear points: RDP
  // removes collinear points at ANY ε, so min/max render identically there —
  // fixture artifact, not a dead slider.)
  await uploadFixture(page, ROSE);
  await pickStyle(page, 'Wireframe');
  await sliderCase('Simplify', 0, 2.0, 'F-simplify', 0.0002, 1.0);
  // Fill opacity on the filled rose (boundary register prominence).
  await uploadFixture(page, ROSE_FILLED);
  await pickStyle(page, 'Wireframe');
  await expandColorSection();
  await sliderCase('Fill opacity', 0.1, 1.0, 'F-fillopacity', 0.001, 1.0);

  // ── G: chrome honesty — exactly the declared controls ───────────────────
  // Slider labels render with CSS text-transform:uppercase and innerText
  // reflects it — compare case-insensitively. NOTE: "Multi-stroke" appears in
  // the page as a CLUSTER SECTION TITLE (it hosts Stroke width + Simplify),
  // so G2 is structural: count actual controls inside the chrome panel.
  const panelText = (await page.evaluate(() => document.body.innerText)).toUpperCase();
  const expected = ['Stroke width', 'Simplify', 'Fill opacity', 'Ink intensity'];
  const present = expected.filter((l) => panelText.includes(l.toUpperCase()));
  record('G1', 'all 4 honest controls render', present.length === 4, present.join(','));
  // Expand every COLLAPSED cluster (aria-expanded="false" headers only —
  // Section unmounts children when collapsed, and blind clicks would toggle
  // open sections shut, which is exactly what broke the first G2 run).
  await page.evaluate(() => {
    document.querySelectorAll('#canvas-right-panel button[aria-expanded="false"]')
      .forEach((b) => b.click());
  });
  await page.waitForTimeout(400);
  const controlCounts = await page.evaluate(() => {
    const panel = document.querySelector('#canvas-right-panel');
    if (!panel) return null;
    const ranges = panel.querySelectorAll('input[type="range"]').length;
    // Dropdown triggers = pill buttons rendered by the chrome Dropdown
    // (aria-haspopup) — wireframe must show ONLY the Style dropdown.
    const dropdowns = panel.querySelectorAll('button[aria-haspopup], [role="combobox"]').length;
    return { ranges, dropdowns };
  });
  record('G2', 'structurally exactly 4 sliders + only the Style dropdown (no ghost controls)',
    !!controlCounts && controlCounts.ranges === 4 && controlCounts.dropdowns <= 1,
    JSON.stringify(controlCounts));
  await page.screenshot({ path: `${OUT}/G-chrome-panel.png` });

  record('Z1', 'zero page errors / engine degrades across battery', pageErrors.length === 0, pageErrors.join(' | ') || 'clean');

  await browser.close();
  const fails = results.filter((r) => !r.pass);
  console.log(`\n${results.length - fails.length}/${results.length} PASS`);
  fs.writeFileSync(`${OUT}/results.json`, JSON.stringify(results, null, 2));
  process.exit(fails.length ? 1 : 0);
};

run().catch((e) => { console.error(e); process.exit(1); });
