// Rock F2 — region-fill battery (Fill | Lasso inside the Shade register).
// READ-ONLY + write-proof: every non-GET supabase request is ABORTED at the
// route layer; Place is never clicked. Runs against a FROZEN vite preview
// (HMR-churn rule — other rocks edit this tree live):
//   npm run build && npx vite preview --port 4413 &
//   node tools/rockf2/battery.mjs
// Shots → /tmp/dd-rockf2. Exits 1 on any FAIL.
import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire(import.meta.url);
const { chromium } = require('/Users/sebs/Desktop/Projects/portfolio/tools/lab-screenshots/node_modules/playwright');

const BASE = process.env.DD_BASE ?? 'http://localhost:4413';
const OUT = '/tmp/dd-rockf2';
fs.mkdirSync(OUT, { recursive: true });

const results = [];
function check(name, pass, detail = '') {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1700, height: 1000 } });
let blocked = 0;
await page.route(/supabase\.co/, (route) => {
  if (route.request().method() === 'GET') return route.continue();
  blocked++;
  console.log('[BLOCKED supabase write]', route.request().method());
  return route.abort();
});
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(String(e).slice(0, 300)));

await page.goto(`${BASE}/desk`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2500);

// ── helpers ──────────────────────────────────────────────────────────────────
let dlg, M;
const P = (vx, vy) => [M.a * vx + M.c * vy + M.e, M.b * vx + M.d * vy + M.f];

/** Re-read the capture svg's CTM. MUST run before every gesture: the Shade
 *  tool cluster (and its wrap) resizes the canvas pane mid-session — a CTM
 *  cached at popup-open lands taps ~45 viewBox px off (the D1/H3 first-run
 *  failures were exactly this harness staleness, confirmed by screenshot). */
async function refreshM() {
  M = await page.evaluate(() => {
    const svgs = [...document.querySelectorAll('[role="dialog"] svg')].filter(
      (s) => s.getAttribute('viewBox') === '0 0 800 600',
    );
    const m = svgs[svgs.length - 1].getScreenCTM();
    return { a: m.a, b: m.b, c: m.c, d: m.d, e: m.e, f: m.f };
  });
}
async function openPopup() {
  await page.getByText('Add doodle', { exact: true }).click();
  await page.waitForSelector('[role="dialog"][aria-label="Draw a doodle"]');
  await page.waitForTimeout(350);
  dlg = page.locator('[role="dialog"][aria-label="Draw a doodle"]');
  await refreshM();
}
async function closePopup() {
  for (let i = 0; i < 4; i++) {
    if (!(await dlg.count())) break;
    await page.keyboard.press('Escape');
    await page.waitForTimeout(160);
  }
  await page.waitForTimeout(250);
}
async function canvasShot(name) {
  const svgs = dlg.locator('svg[viewBox="0 0 800 600"]');
  await svgs.last().screenshot({ path: `${OUT}/${name}.png` });
}
/** Draw a stroke through viewBox points (ink or shade depending on register).
 *  steps=12 keeps scripted input dense enough that perfect-freehand's
 *  streamline lag doesn't cut corners in the RENDERED polygon (the record +
 *  extraction always use the raw points — diag 2026-06-12 confirmed sparse
 *  steps only distort the visual, never the captured geometry). */
async function drawVb(pts, steps = 12) {
  await refreshM();
  const [sx, sy] = P(pts[0][0], pts[0][1]);
  await page.mouse.move(sx, sy);
  await page.mouse.down();
  for (const [vx, vy] of pts.slice(1)) {
    const [x, y] = P(vx, vy);
    await page.mouse.move(x, y, { steps });
  }
  await page.mouse.up();
  await page.waitForTimeout(140);
}
/** Circle (viewBox px) with an exact boundary gap (px) at angle 0 (right). */
function circleGapPts(cx, cy, r, gapPx) {
  const pts = [];
  const half = gapPx > 0 ? Math.asin(Math.min(1, gapPx / (2 * r))) : 0;
  const a0 = half;
  const a1 = Math.PI * 2 - half;
  const n = 40;
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  if (gapPx === 0) pts.push([cx + r * Math.cos(a0), cy + r * Math.sin(a0)]);
  return pts;
}
async function clickShade() { await dlg.locator('button', { hasText: 'Shade' }).first().click(); await page.waitForTimeout(120); }
async function clickInk() { await dlg.locator('button', { hasText: 'Ink' }).first().click(); await page.waitForTimeout(120); }
async function pickTool(t) { await dlg.locator(`[data-shade-tool="${t}"]`).click(); await page.waitForTimeout(120); }
async function pickBand(b) { await dlg.locator(`[data-tone-swatch="${b}"]`).click(); await page.waitForTimeout(100); }
async function toggleErase() { await dlg.locator('[data-tone-erase]').click(); await page.waitForTimeout(100); }
async function setGapIdx(idx) {
  await page.evaluate((v) => {
    const el = document.querySelector('[role="dialog"] input[aria-label="Gap tolerance"]');
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    set.call(el, String(v));
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, idx);
  await page.waitForTimeout(120);
}
async function setRadius(px) {
  await page.evaluate((v) => {
    const el = document.querySelector('[role="dialog"] input[aria-label="Brush radius"]');
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    set.call(el, String(v));
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, px);
  await page.waitForTimeout(100);
}
async function tapVb(vx, vy) {
  await refreshM();
  const [x, y] = P(vx, vy);
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.up();
  await page.waitForTimeout(220);
}
const fills = () => page.evaluate(() => window.__dd_toneFills ?? []);
const fillLog = () => page.evaluate(() => window.__dd_shadeFillLog.get());
const lastLog = async () => {
  const l = await fillLog();
  return l[l.length - 1] ?? null;
};
const bbox = (pts) => {
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
};

// ════════════════════════════════════════════════════════════════════════════
// A — THE GAP SWEEP (headline): circles with boundary gaps 0/2/5/10/20/40 px
// at DEFAULT tolerance (1× = 8px ink radius → gaps ≤ ~16px close free).
// ════════════════════════════════════════════════════════════════════════════
const gapTable = [];
for (const [gap, expectFill] of [[0, true], [2, true], [5, true], [10, true], [20, false], [40, false]]) {
  await openPopup();
  await drawVb(circleGapPts(400, 300, 140, gap));
  await clickShade();
  await pickTool('fill');
  await tapVb(400, 300);
  const f = await fills();
  const log = await lastLog();
  const filled = f.length > 0;
  const outcome = log?.outcome ?? 'none';
  gapTable.push({ gap, expectFill, filled, outcome });
  check(
    `A gap=${gap}px @1× → ${expectFill ? 'FILL' : 'MISS'}`,
    filled === expectFill && outcome === (expectFill ? 'committed' : 'miss'),
    `patches=${f.length} outcome=${outcome}`,
  );
  await canvasShot(`A-gap-${gap}`);
  await closePopup();
}
console.log('\nGAP SWEEP TABLE');
for (const r of gapTable) {
  console.log(`  gap ${String(r.gap).padStart(2)}px  expect=${r.expectFill ? 'fill' : 'miss'}  got=${r.filled ? 'fill' : 'miss'}  outcome=${r.outcome}`);
}

// ════════════════════════════════════════════════════════════════════════════
// B — 20px gap MUST fill after a scrub to ~2× (live preview mid-scrub)
// ════════════════════════════════════════════════════════════════════════════
await openPopup();
await drawVb(circleGapPts(400, 300, 140, 20));
await clickShade();
await pickTool('fill');
// press-hold to arm the scrub (350ms, still)
{
  await refreshM();
  const [sx, sy] = P(400, 300);
  await page.mouse.move(sx, sy);
  await page.mouse.down();
  await page.waitForTimeout(450); // scrub arms
  // walk +2 ladder steps (1× → 2×): 2 × 56 viewBox px to the right
  const [mx, my] = P(400 + 60, 300);
  await page.mouse.move(mx, my, { steps: 4 });
  await page.waitForTimeout(250);
  const [m2x, m2y] = P(400 + 116, 300);
  await page.mouse.move(m2x, m2y, { steps: 4 });
  await page.waitForTimeout(350);
  const midScrub = await page.evaluate(() => ({
    preview: !!document.querySelector('[role="dialog"] [data-fill-preview]'),
    label: document.querySelector('[role="dialog"] [data-gap-scrub]')?.textContent ?? null,
    slider: document.querySelector('[role="dialog"] input[aria-label="Gap tolerance"]')?.value ?? null,
  }));
  await canvasShot('B-mid-scrub-live-preview');
  check(
    'B1 mid-scrub: LIVE region preview + Gap readout + slider follows',
    midScrub.preview && midScrub.label === 'Gap 2×' && midScrub.slider === '4',
    JSON.stringify(midScrub),
  );
  await page.mouse.up();
  await page.waitForTimeout(250);
}
{
  const f = await fills();
  const log = await lastLog();
  const patch = f[0];
  check(
    'B2 release commits the 20px-gap fill at 2× (gesture=scrub)',
    f.length > 0 && log?.outcome === 'committed' && log?.gesture === 'scrub' && log?.gapTol === 2,
    `patches=${f.length} log=${JSON.stringify(log)}`,
  );
  check(
    'B3 ToneFill record carries src:"fill" + gapTol provenance (≠1×)',
    patch?.src === 'fill' && patch?.gapTol === 2,
    `src=${patch?.src} gapTol=${patch?.gapTol}`,
  );
  const slider = await page.evaluate(
    () => document.querySelector('[role="dialog"] input[aria-label="Gap tolerance"]')?.value,
  );
  check('B4 scrubbed Gap persists after release (remembered threshold)', slider === '4', `slider=${slider}`);
  await canvasShot('B-after-scrub-commit');
}
await closePopup();

// ════════════════════════════════════════════════════════════════════════════
// C — ANTI-FIXTURE: C-shape + U-shape must NOT fill even at MAX gap (3×)
// ════════════════════════════════════════════════════════════════════════════
await openPopup();
{
  // C-shape: arc from 60° to 300° (mouth chord ≈ 208px ≫ 48px max closure)
  const pts = [];
  for (let i = 0; i <= 30; i++) {
    const a = (Math.PI / 3) + ((Math.PI * 4) / 3) * (i / 30);
    pts.push([400 + 120 * Math.cos(a), 300 + 120 * Math.sin(a)]);
  }
  await drawVb(pts);
  await clickShade();
  await pickTool('fill');
  await setGapIdx(5); // 3× — MAX
  await tapVb(400, 300);
  const f = await fills();
  const log = await lastLog();
  check('C1 ANTI-FIXTURE: C-shape never fills, even at 3×', f.length === 0 && log?.outcome === 'miss', `patches=${f.length} outcome=${log?.outcome}`);
  await canvasShot('C1-cshape-max-gap-miss');
}
await closePopup();
await openPopup();
{
  // U-shape: 3 sides of a rect, open top 200px wide
  await drawVb([[300, 180], [300, 420], [500, 420], [500, 180]]);
  await clickShade();
  await pickTool('fill');
  await setGapIdx(5);
  await tapVb(400, 320);
  const f = await fills();
  const log = await lastLog();
  check('C2 ANTI-FIXTURE: U-shape never fills, even at 3×', f.length === 0 && log?.outcome === 'miss', `patches=${f.length} outcome=${log?.outcome}`);
  await canvasShot('C2-ushape-max-gap-miss');
}
await closePopup();

// ════════════════════════════════════════════════════════════════════════════
// D — DONUT: tap ring fills ring only (hole stays paper); tap hole fills hole
// ════════════════════════════════════════════════════════════════════════════
await openPopup();
await drawVb(circleGapPts(400, 300, 150, 0));
await drawVb(circleGapPts(400, 300, 70, 0));
await clickShade();
await pickTool('fill');
await pickBand(3);
await tapVb(400, 300 - 110); // between the circles → the ring
{
  const f = await fills();
  const ring = f[0];
  const hasHole = (ring?.holes ?? []).length > 0;
  // The hole must cover the donut's center (paper preserved there).
  const holeCoversCenter = hasHole && bbox(ring.holes[0]).x0 < 400 && bbox(ring.holes[0]).x1 > 400;
  const log = await lastLog();
  check(
    'D1 donut: tap ring → ring fills WITH a hole over the center (depth logged)',
    f.length === 1 && hasHole && holeCoversCenter && log?.regionDepth === 1,
    `patches=${f.length} holes=${ring?.holes?.length} depth=${log?.regionDepth}`,
  );
  await canvasShot('D1-donut-ring-filled');
}
await pickBand(6);
await tapVb(400, 300); // the hole — a legitimate target (D-RF4)
{
  const f = await fills();
  const hole = f.find((p) => p.band === 6);
  const hb = hole ? bbox(hole.points) : null;
  const log = await lastLog();
  check(
    'D2 donut: tap hole → hole fills only (innermost wins, depth 3)',
    !!hole && hb.x1 - hb.x0 < 170 && log?.regionDepth === 3,
    `holePatch=${!!hole} span=${hb ? Math.round(hb.x1 - hb.x0) : '-'} depth=${log?.regionDepth}`,
  );
  await canvasShot('D2-donut-hole-filled');
}
await closePopup();

// ════════════════════════════════════════════════════════════════════════════
// E — TWO REGIONS SHARING A WALL: tap each side, no bleed
// ════════════════════════════════════════════════════════════════════════════
await openPopup();
await drawVb([[250, 180], [550, 180], [550, 420], [250, 420], [250, 180]]); // rect
await drawVb([[400, 180], [400, 420]]); // dividing wall
await clickShade();
await pickTool('fill');
await pickBand(2);
await tapVb(320, 300); // left cell
await pickBand(5);
await tapVb(480, 300); // right cell
{
  const f = await fills();
  const left = f.find((p) => p.band === 2);
  const right = f.find((p) => p.band === 5);
  const lb = left ? bbox(left.points) : null;
  const rb = right ? bbox(right.points) : null;
  check(
    'E1 shared wall: both sides fill, no bleed across the wall (x=400)',
    !!left && !!right && lb.x1 <= 404 && rb.x0 >= 396,
    `left.x1=${lb ? Math.round(lb.x1) : '-'} right.x0=${rb ? Math.round(rb.x0) : '-'}`,
  );
  await canvasShot('E1-shared-wall-no-bleed');
}
await closePopup();

// ════════════════════════════════════════════════════════════════════════════
// F — TINY REGION under the extractor's noise floor → honest miss
// ════════════════════════════════════════════════════════════════════════════
await openPopup();
await drawVb([[200, 150], [620, 150], [620, 480], [200, 480], [200, 150]]); // big rect (sets the cell size)
await drawVb(circleGapPts(680, 100, 9, 0)); // tiny circle, hole < noise floor
await clickShade();
await pickTool('fill');
await tapVb(680, 100);
{
  const f = await fills();
  const log = await lastLog();
  check('F1 tiny region under SOLID_MIN_LOOP_AREA → honest miss', f.length === 0 && log?.outcome === 'miss', `patches=${f.length} outcome=${log?.outcome}`);
}
await closePopup();

// ════════════════════════════════════════════════════════════════════════════
// G — WEIRD INK: spiral · gap-at-sharp-corner · self-intersecting loop
// ════════════════════════════════════════════════════════════════════════════
await openPopup();
{
  const pts = [];
  for (let i = 0; i <= 90; i++) {
    const a = (i / 90) * Math.PI * 5; // 2.5 turns
    const r = 20 + (130 * i) / 90;
    pts.push([400 + r * Math.cos(a), 300 + r * Math.sin(a)]);
  }
  await drawVb(pts, 1);
  await clickShade();
  await pickTool('fill');
  await tapVb(400, 300);
  const log = await lastLog();
  check(
    'G1 spiral: no crash, honest logged outcome',
    pageErrors.length === 0 && (log?.outcome === 'committed' || log?.outcome === 'miss'),
    `outcome=${log?.outcome} errors=${pageErrors.length}`,
  );
  await canvasShot('G1-spiral');
}
await closePopup();
await openPopup();
{
  // triangle with a 20px gap AT the apex (sharp corner)
  await drawVb([[400 - 8, 188], [290, 400], [510, 400], [400 + 12, 195]]);
  await clickShade();
  await pickTool('fill');
  await tapVb(400, 340);
  const missF = await fills();
  const missLog = await lastLog();
  await setGapIdx(4); // 2×
  await tapVb(400, 340);
  const f = await fills();
  const log = await lastLog();
  check(
    'G2 gap-at-sharp-corner: miss at 1×, fills at 2× via the Gap slider',
    missF.length === 0 && missLog?.outcome === 'miss' && f.length > 0 && log?.outcome === 'committed',
    `@1x=${missLog?.outcome} @2x=${log?.outcome}`,
  );
  await canvasShot('G2-sharp-corner-gap-filled-2x');
}
await closePopup();
await openPopup();
{
  // self-intersecting figure-8 drawn as ONE stroke
  const pts = [];
  for (let i = 0; i <= 60; i++) {
    const t = (i / 60) * Math.PI * 2;
    pts.push([400 + 150 * Math.sin(t), 300 + 90 * Math.sin(2 * t)]);
  }
  pts.push(pts[0]);
  await drawVb(pts, 1);
  await clickShade();
  await pickTool('fill');
  await tapVb(330, 300); // left lobe
  const f = await fills();
  const log = await lastLog();
  const fb = f[0] ? bbox(f[0].points) : null;
  check(
    'G3 self-intersecting loop: no crash, lobe-local honest outcome',
    pageErrors.length === 0 && ((f.length > 0 && fb.x1 < 420) || log?.outcome === 'miss'),
    `outcome=${log?.outcome} lobe.x1=${fb ? Math.round(fb.x1) : '-'}`,
  );
  await canvasShot('G3-figure8-left-lobe');
}
await closePopup();

// ════════════════════════════════════════════════════════════════════════════
// H — COMPOSE: ink-over · refill-replace · eraser carve · erase-fill · lasso
// ════════════════════════════════════════════════════════════════════════════
await openPopup();
await drawVb(circleGapPts(400, 300, 130, 0));
await clickShade();
await pickTool('fill');
await pickBand(2);
await tapVb(400, 300);
await pickBand(6);
await tapVb(400, 300); // re-fill same region, darker band
{
  const f = await fills();
  const b2 = f.filter((p) => p.band === 2).length;
  const b6 = f.filter((p) => p.band === 6).length;
  check('H1 re-fill REPLACES the band (no band-2 remnant, one band-6 patch)', b2 === 0 && b6 === 1, `b2=${b2} b6=${b6} total=${f.length}`);
}
await clickInk();
await drawVb([[270, 300], [530, 300]]); // ink over the fill
{
  const rawOrder = await page.evaluate(() => {
    const svgs = [...document.querySelectorAll('[role="dialog"] svg')];
    const toneIdx = svgs.findIndex((s) => s.querySelector('g[opacity]'));
    const inkIdx = svgs.findIndex((s) =>
      [...s.querySelectorAll('path')].some(
        (p) => p.getAttribute('fill') && p.getAttribute('fill') !== 'none' && !p.closest('g[opacity]'),
      ),
    );
    return { toneIdx, inkIdx };
  });
  check('H2 fill then ink over: tone stays UNDER ink (document order)', rawOrder.toneIdx >= 0 && rawOrder.inkIdx > rawOrder.toneIdx, JSON.stringify(rawOrder));
  await canvasShot('H2-ink-over-fill');
}
await clickShade();
await pickTool('brush');
await toggleErase();
await setRadius(14);
await drawVb([[400, 180], [400, 430]]); // brush-eraser carve through the fill
{
  const f = await fills();
  const split = f.filter((p) => p.band === 6).length >= 2 || f.some((p) => (p.holes ?? []).length > 0);
  check('H3 brush eraser partial-carves the filled region (F1 grid composes)', split, `band6patches=${f.filter((p) => p.band === 6).length}`);
  await canvasShot('H3-eraser-carve');
}
await toggleErase();
await closePopup();
// erase-fill: tap a filled region with Fill+Erase lifts it
await openPopup();
await drawVb(circleGapPts(400, 300, 120, 0));
await clickShade();
await pickTool('fill');
await pickBand(4);
await tapVb(400, 300);
const beforeErase = (await fills()).length;
await toggleErase();
await tapVb(400, 300);
{
  const f = await fills();
  check('H4 Fill+Erase: tap lifts the region back to paper', beforeErase === 1 && f.length === 0, `before=${beforeErase} after=${f.length}`);
}
await toggleErase();
await closePopup();
// lasso on open canvas + self-crossing + 3px degenerate
await openPopup();
await drawVb([[200, 200], [600, 220]]); // some open ink (no enclosure)
await clickShade();
await pickTool('lasso');
await pickBand(5);
await drawVb([[300, 320], [480, 300], [520, 420], [320, 440], [290, 360]], 2);
{
  const f = await fills();
  const log = await lastLog();
  check('H5 lasso: loop auto-closes → ToneFill with src:"lasso"', f.length === 1 && f[0].src === 'lasso' && log?.tool === 'lasso' && log?.outcome === 'committed', `src=${f[0]?.src} outcome=${log?.outcome}`);
  await canvasShot('H5-lasso-patch');
}
await closePopup();

// ════════════════════════════════════════════════════════════════════════════
// I — HIGHLIGHT-SCRUB: drag over a region commits it by majority containment
// ════════════════════════════════════════════════════════════════════════════
await openPopup();
await drawVb(circleGapPts(330, 300, 110, 0));
await drawVb(circleGapPts(560, 300, 90, 0));
await clickShade();
await pickTool('fill');
await pickBand(4);
// scribble INSIDE the left circle (move starts immediately → highlight mode)
await drawVb([[290, 270], [370, 280], [300, 320], [370, 330], [310, 350]], 3);
{
  const f = await fills();
  const log = await lastLog();
  const fb = f[0] ? bbox(f[0].points) : null;
  check(
    'I1 highlight-drag selects the majority region (left circle only)',
    f.length === 1 && log?.gesture === 'highlight' && log?.outcome === 'committed' && fb.x1 < 470,
    `patches=${f.length} gesture=${log?.gesture} x1=${fb ? Math.round(fb.x1) : '-'}`,
  );
  await canvasShot('I1-highlight-commit');
}
await closePopup();

// ════════════════════════════════════════════════════════════════════════════
// J — STYLE FLIP with fills present: all 8 styles; filled ≡ brushed band 5
// ════════════════════════════════════════════════════════════════════════════
async function pickStyle(label) {
  const trigger = dlg.locator('button[aria-haspopup="listbox"]').first();
  await trigger.click();
  await page.waitForTimeout(250);
  await page.locator('[role="option"]', { hasText: label }).first().click();
  await page.waitForTimeout(1600);
}
await openPopup();
await drawVb(circleGapPts(400, 300, 130, 0));
await clickShade();
await pickTool('fill');
await pickBand(5);
await tapVb(400, 300);
await dlg.locator('button', { hasText: 'Style' }).first().click();
await page.waitForTimeout(1800);
const styles = [
  ['rough-handdrawn', 'Rough hand-drawn'],
  ['sketchy', 'Sketchy'],
  ['bold-ink', 'Bold ink'],
  ['wet-ink', 'Wet ink'],
  ['stipple', 'Stipple'],
  ['charcoal', 'Charcoal'],
  ['risograph', 'Risograph'],
  ['newsprint', 'Newsprint'],
];
for (const [id, label] of styles) {
  await pickStyle(label);
  await canvasShot(`J-filled-${id}`);
}
check('J1 all 8 styles flip with a FILLED band present (no pageerror)', pageErrors.length === 0, pageErrors.join(' | ').slice(0, 200));
await closePopup();
// the brushed twin (same circle, interior brushed at band 5)
await openPopup();
await drawVb(circleGapPts(400, 300, 130, 0));
await clickShade();
await pickTool('brush');
await pickBand(5);
await setRadius(48);
for (let row = 210; row <= 390; row += 40) {
  await drawVb([[310, row], [490, row]]);
}
await dlg.locator('button', { hasText: 'Style' }).first().click();
await page.waitForTimeout(1800);
await pickStyle('Rough hand-drawn');
await canvasShot('J2-brushed-band5-roughhanddrawn');
check('J2 brushed-band-5 twin rendered (visual pair vs J-filled-rough-handdrawn)', pageErrors.length === 0);
await closePopup();

// ════════════════════════════════════════════════════════════════════════════
// K — BUDGET: heavy fill session stays under the 24KB toneFills budget
// ════════════════════════════════════════════════════════════════════════════
await openPopup();
await drawVb([[250, 180], [550, 180], [550, 420], [250, 420], [250, 180]]);
await drawVb([[400, 180], [400, 420]]);
await drawVb([[250, 300], [550, 300]]);
await clickShade();
await pickTool('fill');
const cells = [[320, 240, 1], [470, 240, 3], [320, 360, 5], [470, 360, 7]];
for (const [x, y, b] of cells) {
  await pickBand(b);
  await tapVb(x, y);
}
await pickTool('lasso');
await pickBand(2);
await drawVb([[260, 440], [540, 450], [520, 520], [280, 530], [255, 470]], 2);
{
  const json = await page.evaluate(() => JSON.stringify(window.__dd_toneFills ?? []));
  check('K1 budget: 4 fills + 1 lasso stay under 24KB', json.length <= 24000, `bytes=${json.length}`);
  console.log(`[budget] toneFills JSON bytes after heavy session: ${json.length}`);
  await canvasShot('K1-heavy-session');
}
await closePopup();

// ════════════════════════════════════════════════════════════════════════════
// L — BREAK-ON-PURPOSE
// ════════════════════════════════════════════════════════════════════════════
await openPopup();
await drawVb(circleGapPts(400, 300, 100, 0));
await clickShade();
await pickTool('fill');
// L1 tap outside everything
await tapVb(120, 520);
{
  const log = await lastLog();
  const caption = await dlg.locator('span[role="status"]').first().textContent().catch(() => null);
  check('L1 tap outside everything → honest miss + caption', log?.outcome === 'miss' && (caption ?? '').includes('no closed region'), `outcome=${log?.outcome} caption=${caption}`);
  await page.screenshot({ path: `${OUT}/L1-miss-caption.png` });
}
// L2 tap exactly ON the ink line
await tapVb(400 + 100, 300);
{
  const log = await lastLog();
  const f = await fills();
  check('L2 tap exactly ON an ink line → miss (no stray under-ink blob)', log?.outcome === 'miss' && f.length === 0, `outcome=${log?.outcome} patches=${f.length}`);
}
// L3 scrub then Escape: no commit, gap restored
{
  await refreshM();
  const [sx, sy] = P(400, 300);
  await page.mouse.move(sx, sy);
  await page.mouse.down();
  await page.waitForTimeout(450);
  const [mx, my] = P(516, 300);
  await page.mouse.move(mx, my, { steps: 4 });
  await page.waitForTimeout(250);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(150);
  await page.mouse.up();
  await page.waitForTimeout(200);
  const f = await fills();
  const log = await lastLog();
  const slider = await page.evaluate(
    () => document.querySelector('[role="dialog"] input[aria-label="Gap tolerance"]')?.value,
  );
  const open = await dlg.count();
  check(
    'L3 scrub then Escape: cancelled, no commit, Gap restored, popup open',
    f.length === 0 && log?.outcome === 'cancelled' && slider === '2' && open > 0,
    `patches=${f.length} outcome=${log?.outcome} slider=${slider} open=${open}`,
  );
}
// L4 lasso that self-crosses + 3px lasso
await pickTool('lasso');
await drawVb([[300, 380], [480, 460], [300, 460], [480, 380], [310, 385]], 2); // bowtie
{
  const f = await fills();
  check('L4a self-crossing lasso: commits honestly, no crash', f.length >= 1 && pageErrors.length === 0, `patches=${f.length}`);
}
await drawVb([[600, 500], [602, 501], [601, 502]], 1); // ~3px lasso
{
  const log = await lastLog();
  check('L4b 3px lasso → honest miss ("too small")', log?.outcome === 'miss' && log?.tool === 'lasso', `outcome=${log?.outcome}`);
}
// L5 rapid pill cycling, then brush still works
for (const t of ['brush', 'fill', 'lasso', 'fill', 'brush', 'lasso', 'brush']) await pickTool(t);
await pickBand(3);
const beforeCycle = (await fills()).length;
await drawVb([[600, 250], [680, 250]]);
{
  const f = await fills();
  check('L5 rapid Brush/Fill/Lasso cycling → no errors, brush still works', f.length > beforeCycle && pageErrors.length === 0, `before=${beforeCycle} after=${f.length}`);
}
// L6 fill during the naming stage (overlay must block the canvas)
await dlg.locator('footer button', { hasText: 'Done' }).click();
await page.waitForTimeout(1200);
{
  const logBefore = (await fillLog()).length;
  await tapVb(400, 300); // lands on the naming overlay, not the canvas
  const logAfter = (await fillLog()).length;
  const naming = await dlg.locator('text=Name your doodle').count();
  check('L6 fill during naming stage: overlay blocks, zero new acts', naming > 0 && logAfter === logBefore && pageErrors.length === 0, `naming=${naming} log ${logBefore}→${logAfter}`);
  await page.keyboard.press('Escape'); // back to compose
  await page.waitForTimeout(200);
}
await closePopup();
// L7 fill with zero ink on canvas
await openPopup();
await clickShade();
await pickTool('fill');
await tapVb(400, 300);
{
  const log = await lastLog();
  const f = await fills();
  check('L7 fill with zero ink → honest miss', log?.outcome === 'miss' && f.length === 0 && log?.regionCount === 0, `outcome=${log?.outcome} regions=${log?.regionCount}`);
}
await closePopup();

// ════════════════════════════════════════════════════════════════════════════
// M — UNIFIED LOG + determinism
// ════════════════════════════════════════════════════════════════════════════
{
  const unified = await page.evaluate(() => {
    const all = window.__dd_decisionLog.get();
    return {
      total: all.length,
      shadeFill: all.filter((e) => e.entryType === 'shade-fill').length,
      sample: all.find((e) => e.entryType === 'shade-fill'),
    };
  });
  check(
    'M1 shade-fill entries ride the unified __dd_decisionLog',
    unified.shadeFill > 0 && unified.sample?.surface === 'shade-fill' && typeof unified.sample?.extractorVersion === 'number',
    `shadeFill=${unified.shadeFill} of ${unified.total}`,
  );
}
async function scriptedFillSession() {
  await openPopup();
  await drawVb(circleGapPts(400, 300, 120, 0));
  await clickShade();
  await pickTool('fill');
  await pickBand(4);
  await tapVb(400, 300);
  const json = await page.evaluate(() => JSON.stringify(window.__dd_toneFills ?? []));
  await closePopup();
  return json;
}
const m1 = await scriptedFillSession();
const m2 = await scriptedFillSession();
check('M2 determinism: same scripted fill twice → byte-identical record', m1 === m2, `len ${m1.length} vs ${m2.length}`);

// ════════════════════════════════════════════════════════════════════════════
// N — LASSO CLOSING CHORD (Sebs-ratified: live dashed pointer→start chord while
// dragging, auto-close never a surprise) + near-straight degenerate miss.
// ════════════════════════════════════════════════════════════════════════════
await openPopup();
await clickShade();
await pickTool('lasso');
await pickBand(4);
{
  // Drag a partial loop and HOLD (no release) — assert the live chord + start
  // marker + wash are all present, and the chord runs pointer→start.
  await refreshM();
  const path = [[300, 250], [480, 250], [500, 400]];
  const [sx, sy] = P(path[0][0], path[0][1]);
  await page.mouse.move(sx, sy);
  await page.mouse.down();
  for (const [vx, vy] of path.slice(1)) {
    const [x, y] = P(vx, vy);
    await page.mouse.move(x, y, { steps: 6 });
  }
  await page.waitForTimeout(120);
  const chord = await page.evaluate(() => {
    const c = document.querySelector('[role="dialog"] [data-lasso-chord]');
    const start = document.querySelector('[role="dialog"] [data-lasso-start]');
    const trail = document.querySelector('[role="dialog"] [data-lasso-trail]');
    const wash = document.querySelector('[role="dialog"] [data-lasso-wash]');
    if (!c) return { present: false };
    return {
      present: true,
      dashed: !!c.getAttribute('stroke-dasharray'),
      x1: +c.getAttribute('x1'), y1: +c.getAttribute('y1'),
      x2: +c.getAttribute('x2'), y2: +c.getAttribute('y2'),
      hasStart: !!start, hasTrail: !!trail, hasWash: !!wash,
    };
  });
  await canvasShot('N1-lasso-chord-mid-drag');
  // The chord attributes are in VIEWBOX coords (the SVG's own space): one end
  // = the LIVE pointer (last pt ≈ 500,400), the other = the START (≈ 300,250).
  // perfect-freehand streamlines, so the live pointer lands a little inside the
  // last scripted point — allow a generous tolerance on the pointer end.
  const near = (a, b, tol) => Math.abs(a - b) < tol;
  const startOk = (x, y) => near(x, 300, 30) && near(y, 250, 30);
  const ptrOk = (x, y) => near(x, 500, 60) && near(y, 400, 60);
  check(
    'N1 lasso mid-drag: LIVE dashed chord pointer→start + start marker + wash',
    chord.present && chord.dashed && chord.hasStart && chord.hasTrail && chord.hasWash &&
      ((ptrOk(chord.x1, chord.y1) && startOk(chord.x2, chord.y2)) ||
       (ptrOk(chord.x2, chord.y2) && startOk(chord.x1, chord.y1))),
    JSON.stringify(chord),
  );
  await page.mouse.up();
  await page.waitForTimeout(180);
  // On release the loop committed exactly as the chord previewed (straight
  // chord 500,400→300,250 included): the patch's bbox must reach the start x.
  const f = await fills();
  const fb = f[0] ? bbox(f[0].points) : null;
  check(
    'N2 open lasso released → region includes the straight chord (closes to start)',
    f.length === 1 && f[0].src === 'lasso' && fb && fb.x0 <= 320 && fb.x1 >= 480,
    `patches=${f.length} bbox=${fb ? `${Math.round(fb.x0)}..${Math.round(fb.x1)}` : '-'}`,
  );
  await canvasShot('N2-lasso-committed-with-chord');
}
await closePopup();
// near-straight LONG drag (length but ~zero area) → honest miss, zero patches
await openPopup();
await clickShade();
await pickTool('lasso');
{
  // 320px-long drag with ~3px wobble — a sliver, not a loop.
  await drawVb([[260, 300], [340, 297], [420, 303], [500, 299], [580, 301]], 2);
  const f = await fills();
  const log = await lastLog();
  check(
    'N3 near-straight long drag → honest miss, ZERO patches (degenerate)',
    f.length === 0 && log?.outcome === 'miss' && log?.tool === 'lasso',
    `patches=${f.length} outcome=${log?.outcome}`,
  );
  await canvasShot('N3-near-straight-miss');
}
await closePopup();
// self-crossing lasso — SCREENSHOT READ (existing L4a only asserted no-crash)
await openPopup();
await clickShade();
await pickTool('lasso');
await pickBand(5);
{
  await drawVb([[300, 280], [480, 460], [300, 460], [480, 280], [310, 285]], 2); // bowtie
  const f = await fills();
  check('N4 self-crossing lasso commits a patch (no crash)', f.length >= 1 && pageErrors.length === 0, `patches=${f.length}`);
  await canvasShot('N4-self-crossing-lasso');
}
await closePopup();

// ════════════════════════════════════════════════════════════════════════════
// O — FILL THEN DONE: the filled band survives into the staged record (naming
// stage carries toneFills via the sourceConfig channel). NO publish — Place is
// never clicked; route-layer blocks any write regardless.
// ════════════════════════════════════════════════════════════════════════════
await openPopup();
await drawVb(circleGapPts(400, 300, 130, 0));
await clickShade();
await pickTool('fill');
await pickBand(5);
await tapVb(400, 300);
const fillsBeforeDone = (await fills()).length;
await dlg.locator('footer button', { hasText: 'Done' }).click();
await page.waitForTimeout(1000);
{
  const naming = await dlg.locator('text=Name your doodle').count();
  // The live tone record (window mirror, set by DrawSurface) still carries the
  // filled patch in the naming stage — nothing was lost crossing Done.
  const stagedTone = await page.evaluate(() => (window.__dd_toneFills ?? []).length);
  check(
    'O1 fill then Done: enters naming stage, filled band survives the record',
    naming > 0 && fillsBeforeDone === 1 && stagedTone === 1 && pageErrors.length === 0,
    `naming=${naming} before=${fillsBeforeDone} stagedTone=${stagedTone}`,
  );
  await page.screenshot({ path: `${OUT}/O1-fill-then-done-naming.png` });
}
await closePopup();

// ════════════════════════════════════════════════════════════════════════════
console.log('\nblocked supabase write attempts:', blocked);
console.log('pageerrors:', pageErrors.length ? pageErrors : 'none');
const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} PASS`);
if (failed.length) for (const f of failed) console.log('FAILED:', f.name, '—', f.detail);
await browser.close();
process.exit(failed.length > 0 ? 1 : 0);
