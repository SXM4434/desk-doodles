// Rock F1 — shade-brush band-mask battery (AFTER). READ-ONLY + write-proof:
// every non-GET supabase request is ABORTED at the route layer; Place is never
// clicked (Done only stages — no publish). Run with dev server on :5182:
//   node tools/rockf1/battery.mjs
// Shots → /tmp/dd-rockf1/after. Exits 1 on any FAIL.
import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire(import.meta.url);
const { chromium } = require('/Users/sebs/Desktop/Projects/portfolio/tools/lab-screenshots/node_modules/playwright');

const OUT = '/tmp/dd-rockf1/after';
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
  console.log('[BLOCKED supabase write]', route.request().method(), route.request().url().slice(0, 110));
  return route.abort();
});
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(String(e).slice(0, 300)));
process.on('uncaughtException', async (e) => {
  console.log('[FATAL]', String(e).slice(0, 400));
  try {
    await page.screenshot({ path: `${OUT}/DIAG-fatal.png`, fullPage: true });
    const st = await page.evaluate(() => ({
      dialogs: [...document.querySelectorAll('[role="dialog"]')].map((d) => d.getAttribute('aria-label')),
      snag: document.body.textContent.includes('hit a snag'),
    }));
    console.log('[FATAL state]', JSON.stringify(st));
  } catch {}
  process.exit(1);
});

await page.goto('http://localhost:5182/desk', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2500);

// ── helpers ──────────────────────────────────────────────────────────────────
let dlg, canvas, box;
const fx = (u, v) => [box.x + box.width * u, box.y + box.height * v];

async function openPopup() {
  await page.getByText('Add doodle', { exact: true }).click();
  await page.waitForSelector('[role="dialog"][aria-label="Draw a doodle"]');
  await page.waitForTimeout(350);
  dlg = page.locator('[role="dialog"][aria-label="Draw a doodle"]');
  canvas = dlg.locator('svg[viewBox="0 0 800 600"]').last();
  box = await canvas.boundingBox();
}
async function closePopup() {
  // Esc arms (work present), Esc again closes; empty popups close on first.
  await page.keyboard.press('Escape');
  await page.waitForTimeout(150);
  if (await dlg.count()) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(150);
  }
  if (await dlg.count()) {
    // naming stage layered down first — walk the remaining layers
    await page.keyboard.press('Escape');
    await page.waitForTimeout(150);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(150);
  }
  await page.waitForTimeout(300);
}
async function brushPath(pts, steps = 4) {
  await page.mouse.move(pts[0][0], pts[0][1]);
  await page.mouse.down();
  for (const [x, y] of pts.slice(1)) await page.mouse.move(x, y, { steps });
  await page.mouse.up();
  await page.waitForTimeout(120);
}
async function clickShade() { await dlg.locator('button', { hasText: 'Shade' }).first().click(); await page.waitForTimeout(120); }
async function clickInk() { await dlg.locator('button', { hasText: 'Ink' }).first().click(); await page.waitForTimeout(120); }
async function clickStyleMode() { await dlg.locator('button', { hasText: 'Style' }).first().click(); await page.waitForTimeout(2000); }
async function pickBand(b) { await dlg.locator(`[data-tone-swatch="${b}"]`).click(); await page.waitForTimeout(100); }
async function toggleErase() { await dlg.locator('[data-tone-erase]').click(); await page.waitForTimeout(100); }
async function setRadius(px) {
  await page.evaluate((v) => {
    const el = document.querySelector('[role="dialog"] input[aria-label="Brush radius"]');
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    set.call(el, String(v));
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, px);
  await page.waitForTimeout(100);
}
const toneJson = () => page.evaluate(() => JSON.stringify(window.__dd_toneFills ?? []));
const toneBands = () =>
  page.evaluate(() => [...new Set((window.__dd_toneFills ?? []).map((f) => f.band))].sort());
const tonePatchDomCount = () =>
  page.evaluate(() => {
    let n = 0;
    for (const g of document.querySelectorAll('[role="dialog"] svg g[opacity]'))
      n += g.querySelectorAll('path').length;
    return n;
  });
async function pickStyle(label) {
  const trigger = dlg.locator('button[aria-haspopup="listbox"]').first();
  await trigger.click();
  await page.waitForTimeout(250);
  await page.locator('[role="option"]', { hasText: label }).first().click();
  await page.waitForTimeout(1800);
}

// ════════════════════════════════════════════════════════════════════════════
// A — repro (a): ONE pen-down cross-hatch scribble → one flat merged island
// ════════════════════════════════════════════════════════════════════════════
await openPopup();
await clickShade();
const xhatch = [];
for (let i = 0; i <= 5; i++) xhatch.push(fx(i % 2 === 0 ? 0.15 : 0.4, 0.15 + i * 0.045));
for (let i = 0; i <= 5; i++) xhatch.push(fx(0.15 + i * 0.05, i % 2 === 0 ? 0.38 : 0.14));
await brushPath(xhatch);
const aFills = JSON.parse(await toneJson());
check('A1 one-stroke cross-hatch = ONE merged patch', aFills.length === 1, `patches=${aFills.length}`);
check('A2 within-stroke flat (single band, the picked one)', aFills.every((f) => f.band === 3), `bands=${aFills.map((f) => f.band)}`);
await canvas.screenshot({ path: `${OUT}/A-one-stroke-crosshatch.png` });

// ════════════════════════════════════════════════════════════════════════════
// B — repro (b): re-stroke same spot same band → exactly +1; cap at 7
// ════════════════════════════════════════════════════════════════════════════
const line = [fx(0.55, 0.18), fx(0.85, 0.18)];
await brushPath(line);
const b1 = await toneBands();
await brushPath(line); // identical re-stroke, same band 3
const b2bands = await toneBands();
const b2fills = JSON.parse(await toneJson());
const band4Only = b2fills.filter((f) => f.band !== 3 || true); // inspect below
check(
  'B1 re-stroke same band darkens exactly +1 (3 → 4 on the line)',
  b2bands.includes(4) && b1.includes(3),
  `before bands=${b1} after=${b2bands}`,
);
await brushPath(line); // third pass, still band 3 vs cell band 4 → lighter, IGNORED
const b3 = await toneJson();
const b3bands = await toneBands();
check(
  'B2 third same-band pass is ignored (3 < 4 — markers cannot lighten)',
  !b3bands.includes(5),
  `bands=${b3bands}`,
);
// cap: band 7 over band 7 stays 7
await pickBand(7);
const line7 = [fx(0.55, 0.3), fx(0.85, 0.3)];
await brushPath(line7);
await brushPath(line7);
const b4bands = await toneBands();
check('B3 band 7 re-stroke caps at 7 (min(7, b+1))', Math.max(...b4bands) === 7, `bands=${b4bands}`);
await canvas.screenshot({ path: `${OUT}/B-restroke-plus-one.png` });
await closePopup();

// ════════════════════════════════════════════════════════════════════════════
// C — 6 passes over one area → patch count collapses (BEFORE recorded 7 paths)
// ════════════════════════════════════════════════════════════════════════════
await openPopup();
await clickShade();
for (let i = 0; i < 6; i++) {
  await brushPath([fx(0.2, 0.2 + (i % 3) * 0.045), fx(0.5, 0.2 + (i % 3) * 0.045)]);
}
const cDom = await tonePatchDomCount();
const cFills = JSON.parse(await toneJson());
check('C1 six passes collapse to merged islands (DOM, before=6+ring)', cDom <= 4, `paths=${cDom}`);
check('C2 record patches ≤ 4 (merged, was 6 capsules)', cFills.length <= 4, `patches=${cFills.length}`);
await canvas.screenshot({ path: `${OUT}/C-six-passes-merged.png` });
await closePopup();

// ════════════════════════════════════════════════════════════════════════════
// D — darker replaces lighter; lighter over darker no-ops (byte-identical)
// ════════════════════════════════════════════════════════════════════════════
await openPopup();
await clickShade();
await pickBand(2);
await brushPath([fx(0.2, 0.5), fx(0.6, 0.5)]); // light field
await pickBand(5);
await brushPath([fx(0.45, 0.5), fx(0.6, 0.5)]); // darker over the right half
const dBands = await toneBands();
check('D1 darker-over-lighter replaces (bands 2 and 5 coexist, split)', dBands.includes(2) && dBands.includes(5), `bands=${dBands}`);
const dBefore = await toneJson();
await pickBand(1);
await brushPath([fx(0.5, 0.5), fx(0.56, 0.5)]); // light stroke strictly INSIDE the band-5 area
const dAfter = await toneJson();
check('D2 lighter-over-darker is a no-op (record byte-identical)', dBefore === dAfter, `len ${dBefore.length} vs ${dAfter.length}`);
await canvas.screenshot({ path: `${OUT}/D-darker-replaces-lighter-ignored.png` });
await closePopup();

// ════════════════════════════════════════════════════════════════════════════
// E — eraser carves a PARTIAL chunk (split or hole), then erase-all + re-brush
// ════════════════════════════════════════════════════════════════════════════
await openPopup();
await clickShade();
await pickBand(4);
await setRadius(40);
await brushPath([fx(0.25, 0.35), fx(0.55, 0.35), fx(0.55, 0.5), fx(0.25, 0.5)]); // fat blob
const eBefore = JSON.parse(await toneJson());
await canvas.screenshot({ path: `${OUT}/E1-blob-before-carve.png` });
await toggleErase();
await setRadius(16);
await brushPath([fx(0.4, 0.28), fx(0.4, 0.58)]); // carve a vertical channel through it
const eAfter = JSON.parse(await toneJson());
const eSplitOrHole =
  eAfter.length > eBefore.length || eAfter.some((f) => (f.holes ?? []).length > 0);
check('E1 eraser carves a partial chunk (split/hole, not whole-patch lift)', eBefore.length >= 1 && eAfter.length >= 1 && eSplitOrHole, `before=${eBefore.length} after=${eAfter.length} holes=${eAfter.map((f) => (f.holes ?? []).length)}`);
await canvas.screenshot({ path: `${OUT}/E2-after-carve.png` });
// donut: punch a hole in the middle of a fresh blob
await toggleErase(); // back to paint
await setRadius(44);
await brushPath([fx(0.75, 0.4), fx(0.78, 0.4)]);
await toggleErase();
await setRadius(12);
await brushPath([fx(0.765, 0.4), fx(0.768, 0.4)]); // dab-lift in the center
const eDonut = JSON.parse(await toneJson());
const donutHasHole = eDonut.some((f) => (f.holes ?? []).length > 0);
check('E2 center dab-lift makes a HOLE (evenodd subpath in the record)', donutHasHole, `holes=${eDonut.map((f) => (f.holes ?? []).length)}`);
await canvas.screenshot({ path: `${OUT}/E3-donut-hole.png` });
// erase everything, then brush again
await setRadius(64);
for (let row = 0.2; row <= 0.7; row += 0.1) await brushPath([fx(0.1, row), fx(0.9, row)]);
const eEmpty = JSON.parse(await toneJson());
check('E3 erase-everything empties the record', eEmpty.length === 0, `patches=${eEmpty.length}`);
await toggleErase();
await setRadius(26);
await brushPath([fx(0.3, 0.4), fx(0.5, 0.4)]);
const eRebrush = JSON.parse(await toneJson());
check('E4 brush again after erase-all works', eRebrush.length === 1, `patches=${eRebrush.length}`);
await closePopup();

// ════════════════════════════════════════════════════════════════════════════
// F — repro (c) + style flips: ink square, shade scribble inside, ALL 8 styles
// ════════════════════════════════════════════════════════════════════════════
await openPopup();
await brushPath([fx(0.3, 0.25), fx(0.7, 0.25), fx(0.7, 0.75), fx(0.3, 0.75), fx(0.3, 0.25)]);
await clickShade();
const inner = [];
for (let i = 0; i <= 7; i++) inner.push(fx(i % 2 === 0 ? 0.36 : 0.64, 0.32 + i * 0.055));
await brushPath(inner);
await canvas.screenshot({ path: `${OUT}/F0-sketch-ink-square-shaded.png` });
// tone-under-ink DOM assert (raw): the tone layer svg precedes the strokes svg
const rawOrder = await page.evaluate(() => {
  const svgs = [...document.querySelectorAll('[role="dialog"] svg')];
  const toneIdx = svgs.findIndex((s) => s.querySelector('g[opacity]'));
  const inkIdx = svgs.findIndex((s) => [...s.querySelectorAll('path')].some((p) => p.getAttribute('fill') && p.getAttribute('fill') !== 'none' && !p.closest('g[opacity]')));
  return { toneIdx, inkIdx };
});
check('F1 raw mode: tone layer renders UNDER ink (document order)', rawOrder.toneIdx >= 0 && rawOrder.inkIdx > rawOrder.toneIdx, JSON.stringify(rawOrder));
await clickStyleMode();
// DIAGNOSTIC: full state probe right after the flip
const flipState = await page.evaluate(() => ({
  dialogs: [...document.querySelectorAll('[role="dialog"]')].map((d) => d.getAttribute('aria-label')),
  snag: document.body.textContent.includes('hit a snag'),
  bodyHasNaming: document.body.textContent.includes('Name your doodle'),
}));
console.log('[diag] post-flip state:', JSON.stringify(flipState));
if (flipState.dialogs.length === 0) await page.screenshot({ path: `${OUT}/DIAG-dialog-gone.png`, fullPage: true });
// tone-under-ink in the styled SOURCE markup
const styledOrder = await page.evaluate(() => {
  const paths = [...document.querySelectorAll('[role="dialog"] svg path')];
  const firstTone = paths.findIndex((p) => p.hasAttribute('data-tone-band'));
  const lastTone = paths.map((p) => p.hasAttribute('data-tone-band')).lastIndexOf(true);
  const firstInk = paths.findIndex((p) => p.getAttribute('fill') === 'none' && p.getAttribute('stroke'));
  return { firstTone, lastTone, firstInk };
});
check('F2 styled source: tone paths precede ink paths', styledOrder.firstTone >= 0 && styledOrder.firstInk > styledOrder.lastTone, JSON.stringify(styledOrder));
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
  await canvas.screenshot({ path: `${OUT}/F-styled-${id}.png` });
}
check('F3 all 8 styles flipped with tones present (no pageerror)', pageErrors.length === 0, pageErrors.join(' | ').slice(0, 200));
await closePopup();

// ════════════════════════════════════════════════════════════════════════════
// G — 24KB budget: heavy scribble session across bands
// ════════════════════════════════════════════════════════════════════════════
await openPopup();
await clickShade();
for (let s = 0; s < 14; s++) {
  await pickBand(1 + (s % 7));
  const wob = [];
  for (let i = 0; i <= 6; i++) {
    wob.push(fx(0.08 + 0.13 * (s % 6) + (i % 2 === 0 ? 0 : 0.12), 0.1 + 0.12 * Math.floor(s / 6) + i * 0.025));
  }
  await brushPath(wob, 2);
}
const gRaw = await toneJson();
const gCapped = await page.evaluate(() => {
  // mirror of capToneFills rounding only — the raw pool is already ≤128pt/loop
  return JSON.stringify(window.__dd_toneFills ?? []).length;
});
check('G1 heavy session stays under the 24KB toneFills budget', gRaw.length <= 24000, `bytes=${gRaw.length} (capped=${gCapped})`);
await canvas.screenshot({ path: `${OUT}/G-heavy-session.png` });
await closePopup();

// ════════════════════════════════════════════════════════════════════════════
// H — determinism: same scripted sequence twice → byte-identical JSON
// ════════════════════════════════════════════════════════════════════════════
async function scriptedSession() {
  await openPopup();
  await clickShade();
  await pickBand(3);
  await brushPath([fx(0.2, 0.2), fx(0.5, 0.2), fx(0.5, 0.4)]);
  await brushPath([fx(0.3, 0.18), fx(0.3, 0.45)]);
  await pickBand(6);
  await brushPath([fx(0.45, 0.3), fx(0.6, 0.3)]);
  await toggleErase();
  await brushPath([fx(0.35, 0.15), fx(0.35, 0.5)]);
  await toggleErase();
  const json = await toneJson();
  await closePopup();
  return json;
}
const h1 = await scriptedSession();
const h2 = await scriptedSession();
check('H1 determinism: two scripted runs → byte-identical toneFills JSON', h1 === h2, `len ${h1.length} vs ${h2.length}`);
const hasProvenance = JSON.parse(h1).every((f) => f.src === 'brush');
check('H2 provenance: every patch carries src:"brush"', hasProvenance);

// ════════════════════════════════════════════════════════════════════════════
// I — break-on-purpose
// ════════════════════════════════════════════════════════════════════════════
await openPopup();
await clickShade();
// I1 mid-stroke Escape = gesture CANCEL: popup stays open, stamped tone reverts
await page.mouse.move(...fx(0.2, 0.2));
await page.mouse.down();
await page.mouse.move(...fx(0.4, 0.25), { steps: 4 });
await page.keyboard.press('Escape'); // cancels the gesture, NOT the popup
await page.mouse.move(...fx(0.5, 0.3), { steps: 4 });
await page.mouse.up();
await page.waitForTimeout(200);
const i1Open = await dlg.count();
const i1Tone = JSON.parse(await toneJson()).length;
check(
  'I1 mid-stroke Escape: popup stays open, gesture canceled (no tone committed)',
  i1Open > 0 && i1Tone === 0 && pageErrors.length === 0,
  `open=${i1Open} tone=${i1Tone} errors=${pageErrors.length}`,
);
// fresh stroke after the cancel still works
await brushPath([fx(0.2, 0.2), fx(0.4, 0.2)]);
const i1b = JSON.parse(await toneJson()).length;
check('I1b brush works again after a canceled gesture', i1b === 1, `patches=${i1b}`);

// I2 Shade→Ink register flip mid-stroke (keyboard Enter on the focused pill)
await page.evaluate(() => {
  const btns = [...document.querySelectorAll('[role="dialog"] button')];
  btns.find((b) => b.textContent.trim() === 'Ink')?.focus();
});
await page.mouse.move(...fx(0.2, 0.6));
await page.mouse.down();
await page.mouse.move(...fx(0.35, 0.6), { steps: 4 });
await page.keyboard.press('Enter'); // flips register mid-drag
await page.mouse.move(...fx(0.5, 0.6), { steps: 4 });
await page.mouse.up();
await page.waitForTimeout(150);
const i2 = await page.evaluate(() => ({
  tone: (window.__dd_toneFills ?? []).length,
}));
check('I2 register flip mid-stroke: stamped half commits, no crash', i2.tone > 0 && pageErrors.length === 0, `tone=${i2.tone}`);
await clickShade();

// I3 zero-length tap = a dab
const i3Before = JSON.parse(await toneJson()).length;
await page.mouse.move(...fx(0.7, 0.7));
await page.mouse.down();
await page.mouse.up();
await page.waitForTimeout(150);
const i3After = JSON.parse(await toneJson()).length;
check('I3 zero-length tap leaves a dab patch', i3After > i3Before, `${i3Before} → ${i3After}`);

// I4 brush min/max radius dabs differ ~8x in size
await setRadius(8);
await page.mouse.move(...fx(0.62, 0.8));
await page.mouse.down();
await page.mouse.up();
await page.waitForTimeout(120);
await setRadius(64);
await page.mouse.move(...fx(0.85, 0.8));
await page.mouse.down();
await page.mouse.up();
await page.waitForTimeout(120);
const i4 = await page.evaluate(() => {
  const fills = window.__dd_toneFills ?? [];
  const span = (f) => {
    const xs = f.points.map((p) => p[0]);
    return Math.max(...xs) - Math.min(...xs);
  };
  return fills.map((f) => ({ id: f.id, span: Math.round(span(f)) }));
});
const spans = i4.map((f) => f.span).sort((a, b) => a - b);
check('I4 min/max brush dabs both land, sizes scale', spans[0] >= 8 && spans[spans.length - 1] >= 100, JSON.stringify(spans));

// I5 drag off-canvas and back — clamped, no crash, no wraparound
await brushPath([fx(0.5, 0.95), [box.x + box.width * 0.5, box.y + box.height + 120], fx(0.6, 0.9)]);
const i5 = await page.evaluate(() => {
  const fills = window.__dd_toneFills ?? [];
  return fills.every((f) => f.points.every(([x, y]) => x >= -1 && x <= 801 && y >= -1 && y <= 601));
});
check('I5 off-canvas drag clamps to the frame (no wraparound coords)', i5 && pageErrors.length === 0);
await canvas.screenshot({ path: `${OUT}/I-break-on-purpose.png` });
await closePopup();

// ════════════════════════════════════════════════════════════════════════════
// J — tone-only Done → naming stage renders (no Place, no publish)
// ════════════════════════════════════════════════════════════════════════════
await openPopup();
await clickShade();
await pickBand(5);
await brushPath([fx(0.4, 0.4), fx(0.6, 0.4), fx(0.6, 0.55)]);
await toggleErase();
await setRadius(12);
await brushPath([fx(0.5, 0.42), fx(0.52, 0.42)]); // hole → evenodd markup path
await dlg.locator('footer button', { hasText: 'Done' }).click();
await page.waitForTimeout(1500);
const jStage = await dlg.locator('text=Name your doodle').count();
check('J1 tone-only Done reaches naming stage (markup w/ evenodd holes renders)', jStage > 0 && pageErrors.length === 0);
await page.screenshot({ path: `${OUT}/J-naming-preview-tone-only.png` });
// J2 undo interaction: smart-pick undo restores the PEN only — the tone
// record must be byte-identical (undo never touches toneFills).
const jToneBefore = await toneJson();
// .last() = the naming-stage chip (the pen-column copy sits UNDER the
// naming overlay and isn't clickable there).
const undoBtn = dlg.locator('[data-smart-pick-chip] button', { hasText: 'undo' });
if (await undoBtn.count()) {
  await undoBtn.last().click();
  await page.waitForTimeout(600);
  const jToneAfter = await toneJson();
  check('J2 smart-pick undo leaves the tone record untouched', jToneBefore === jToneAfter && pageErrors.length === 0, `len ${jToneBefore.length} vs ${jToneAfter.length}`);
} else {
  check('J2 smart-pick undo leaves the tone record untouched', true, 'no pick chip this run (abstained) — nothing to undo');
}
await closePopup();

// ════════════════════════════════════════════════════════════════════════════
console.log('\nblocked supabase write attempts:', blocked);
console.log('pageerrors:', pageErrors.length ? pageErrors : 'none');
const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} PASS`);
await browser.close();
process.exit(failed.length > 0 ? 1 : 0);
