// Live verification of the rotate-handle redesign (Sebs 2026-06-27).
// Drives the REAL dev app at /desk?test=suzanne (headful Chrome → honest WebGL),
// asserting the agreed contract:
//   1. A clean rotate HANDLE appears on hover of a 3D object (no grip).
//   2. Dragging the handle ROTATES the 3D mesh (pixels change) and does NOT move
//      the object (its rect is unchanged).
//   3. Dragging the object BODY MOVES it (rect changes) — move not removed.
//   4. A tap on the body OPENS the card.
import puppeteer from 'puppeteer-core';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const URL = 'http://localhost:5182/desk?test=suzanne';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function rectCenter(r) { return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }
// Mean per-pixel abs difference between two equal-size PNG-ish raw buffers.
function bufDiff(a, b) {
  const n = Math.min(a.length, b.length);
  if (n === 0) return 0;
  let s = 0;
  for (let i = 0; i < n; i++) s += Math.abs(a[i] - b[i]);
  return s / n;
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: false,
  args: ['--window-size=1400,1000'],
  defaultViewport: { width: 1400, height: 1000 },
});
const page = await browser.newPage();
const log = [];
const fail = [];
page.on('console', (m) => { const t = m.text(); if (/error|warn/i.test(m.type())) log.push(`[console.${m.type()}] ${t}`); });
page.on('pageerror', (e) => fail.push(`[pageerror] ${e.message}`));

try {
  await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });
  // Wait for the desk + the shared 3D canvas + the Suzanne meshes to stream in.
  await page.waitForSelector('[data-desk-obj-id]', { timeout: 30000 });
  await page.waitForSelector('canvas', { timeout: 30000 });
  await sleep(7000); // GLB stream + first frames

  const ids = await page.$$eval('[data-desk-obj-id]', (els) => els.map((e) => e.getAttribute('data-desk-obj-id')));
  log.push(`objects on desk: ${ids.length} → ${ids.join(', ')}`);
  if (ids.length === 0) throw new Error('no desk objects rendered');

  // Use the FIRST suzanne object (turntable).
  const targetId = ids[0];
  const sel = `[data-desk-obj-id="${targetId}"]`;
  const rect0 = await page.$eval(sel, (el) => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; });
  log.push(`target ${targetId} rect: ${JSON.stringify(rect0)}`);
  const c0 = rectCenter(rect0);

  // DIAGNOSE render mode: a 3D object hosts the shared canvas viewport (no 2D
  // "3D MESH" placeholder text); a 2D fallback shows that placeholder → rotatable
  // would be false and no handle by design.
  const diag = await page.evaluate((s) => {
    const el = document.querySelector(s);
    return {
      canvasesOnPage: document.querySelectorAll('canvas').length,
      placeholderText: (el?.textContent || '').includes('3D MESH'),
      childCount: el ? el.children.length : -1,
    };
  }, sel);
  log.push(`render diag: ${JSON.stringify(diag)}`);

  // ── 1. HOVER → rotate handle appears (and is the clean glyph, not a grip) ──
  // Force a real boundary crossing: park OUTSIDE the object first, then glide in
  // (a single teleport to center doesn't always synthesize pointerenter via CDP).
  await page.mouse.move(c0.x - 240, c0.y, { steps: 2 });
  await sleep(120);
  await page.mouse.move(c0.x, c0.y, { steps: 18 });
  await sleep(500);
  const handleInfo = await page.$eval(sel, (el) => {
    const h = el.querySelector('[aria-label="Drag to rotate this doodle in 3D"]');
    if (!h) return null;
    const r = h.getBoundingClientRect();
    const hasRotateGlyph = !!h.querySelector('svg path');
    const hasOldGripChar = (el.textContent || '').includes('⠿');
    return { x: r.x, y: r.y, width: r.width, height: r.height, hasRotateGlyph, hasOldGripChar };
  });
  if (!handleInfo) fail.push('1. rotate handle did NOT appear on hover');
  else {
    log.push(`1. rotate handle visible ${JSON.stringify(handleInfo)}`);
    if (!handleInfo.hasRotateGlyph) fail.push('1b. handle has no SVG rotate glyph');
    if (handleInfo.hasOldGripChar) fail.push('1c. old braille grip ⠿ still present');
  }

  // ── 2. DRAG THE HANDLE → mesh rotates, object does NOT move ──
  // screenshot the object region before/after to detect rotation (pixels change).
  const clip = { x: Math.max(0, rect0.x), y: Math.max(0, rect0.y), width: rect0.width, height: rect0.height };
  const before = await page.screenshot({ clip, encoding: 'binary' });
  if (handleInfo) {
    const hc = rectCenter(handleInfo);
    await page.mouse.move(hc.x, hc.y, { steps: 3 });
    await page.mouse.down();
    for (let i = 1; i <= 10; i++) await page.mouse.move(hc.x + i * 12, hc.y, { steps: 2 }); // +120px az drag
    await sleep(300);
    await page.mouse.up();
    await sleep(600);
  }
  const after = await page.screenshot({ clip, encoding: 'binary' });
  const d = bufDiff(before, after);
  log.push(`2. handle-drag pixel diff = ${d.toFixed(2)} (PNG bytes; >0 ⇒ render changed)`);
  const rectAfterRotate = await page.$eval(sel, (el) => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y }; });
  const movedByRotate = Math.hypot(rectAfterRotate.x - rect0.x, rectAfterRotate.y - rect0.y);
  log.push(`2b. object moved during handle-drag = ${movedByRotate.toFixed(1)}px (want ≈0)`);
  if (d < 1) fail.push('2. handle-drag did NOT change the render (mesh may not be rotating)');
  if (movedByRotate > 6) fail.push(`2b. handle-drag MOVED the object ${movedByRotate.toFixed(1)}px (should rotate in place)`);

  // ── 3. DRAG THE BODY → object MOVES (move not removed) ──
  const rectBeforeMove = await page.$eval(sel, (el) => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; });
  const bc = rectCenter(rectBeforeMove);
  await page.mouse.move(bc.x, bc.y, { steps: 3 });
  await page.mouse.down();
  for (let i = 1; i <= 10; i++) await page.mouse.move(bc.x + i * 15, bc.y + i * 6, { steps: 2 }); // drag right+down
  await sleep(150);
  await page.mouse.up();
  await sleep(700);
  const rectAfterMove = await page.$eval(sel, (el) => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y }; });
  const moved = Math.hypot(rectAfterMove.x - rectBeforeMove.x, rectAfterMove.y - rectBeforeMove.y);
  log.push(`3. body-drag moved object = ${moved.toFixed(1)}px (want > 30)`);
  if (moved < 20) fail.push(`3. body-drag did NOT move the object (moved ${moved.toFixed(1)}px) — MOVE removed!`);

  // ── 4. TAP THE BODY → card opens ──
  const rectNow = await page.$eval(sel, (el) => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; });
  const tc = rectCenter(rectNow);
  await page.mouse.move(tc.x, tc.y, { steps: 2 });
  await page.mouse.down();
  await sleep(60);
  await page.mouse.up();
  await sleep(700);
  const surfaceOpen = await page.evaluate(() => {
    // The object surface modal — look for a dialog/overlay that appeared.
    const dlg = document.querySelector('[role="dialog"], [data-object-surface], [data-surface]');
    if (dlg) return true;
    // Fallback: a large fixed overlay covering most of the viewport.
    const fixed = [...document.querySelectorAll('div')].some((d) => {
      const s = getComputedStyle(d); const r = d.getBoundingClientRect();
      return s.position === 'fixed' && r.width > window.innerWidth * 0.5 && r.height > window.innerHeight * 0.5 && s.zIndex && Number(s.zIndex) > 10;
    });
    return fixed;
  });
  log.push(`4. tap opened a surface/card = ${surfaceOpen}`);
  if (!surfaceOpen) fail.push('4. tap on body did NOT open the card');

} catch (e) {
  fail.push(`EXCEPTION: ${e.message}`);
} finally {
  console.log('\n=== LOG ===');
  for (const l of log) console.log('  ' + l);
  console.log('\n=== RESULT ===');
  if (fail.length === 0) console.log('  ✅ ALL CHECKS PASSED');
  else { console.log('  ❌ FAILURES:'); for (const f of fail) console.log('   - ' + f); }
  await sleep(1200);
  await browser.close();
  process.exit(fail.length === 0 ? 0 : 1);
}
