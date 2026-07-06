// Phase-2 adversarial hunt: the DRAW→DONE→PLACE mint flow + interruptions.
// READ-ONLY (route-aborts every non-GET). Drives the DrawPanel popup: real
// strokes on DrawSurface, Done→name→Place (object must mint on desk), plus
// Cancel-with-strokes (Escape-arm), Back from naming, brush-over-fill,
// undo-via-Back→redraw, flip-mid-gesture, rapid open/cancel. Personal-space
// onboarding edge run separately via PERSONAL=1.
import { createRequire } from 'module';
import { mkdirSync, writeFileSync } from 'fs';
const require = createRequire(import.meta.url);
const { chromium } = require('/Users/sebs/Desktop/Projects/portfolio/tools/lab-screenshots/node_modules/playwright');

const BASE = process.env.BASE || 'http://localhost:5346';
const OUT = process.env.OUT || '/tmp/dd-cbhf-r3-draw';
const PERSONAL = process.env.PERSONAL === '1';
mkdirSync(OUT, { recursive: true });
const SHOT = (page, name) => page.screenshot({ path: `${OUT}/${name}.png` }).catch(() => {});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function syntheticDesk(n) {
  return { id: 'desk-synth-0', desk_index: 0, name: 'Hunt Desk', object_cap: 120, object_count: n, is_open: true, preview_svg: null, owner_id: null, created_at: new Date(1700000000000).toISOString() };
}
function makeRows(n) {
  const rows = [];
  const svg = '<svg width="180" height="180" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40" fill="none" stroke="black" stroke-width="3"/></svg>';
  for (let i = 0; i < n; i++) rows.push({ id: `dood-${i}`, desk_id: 'desk-synth-0', session_id: null, svg, content_hash: `h${i}`, x: 150 + (i % 3) * 220, y: 150 + Math.floor(i / 3) * 220, rotation: 0, name: `obj ${i}`, why: null, render_config: null, created_at: new Date(1700000000000 + i * 1000).toISOString() });
  return rows;
}
async function installIntercept(context, n) {
  const rows = makeRows(n);
  const desk = syntheticDesk(n);
  let blocked = 0;
  await context.route('**/rest/v1/**', async (route) => {
    const req = route.request(); const url = new URL(req.url()); const p = url.pathname;
    if (req.method() !== 'GET') { blocked++; await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }); return; }
    if (p.endsWith('/desks')) { await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([desk]) }); return; }
    if (p.endsWith('/doodles')) { await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(rows) }); return; }
    if (p.includes('/rpc/')) { await route.fulfill({ status: 200, contentType: 'application/json', body: 'null' }); return; }
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
  await context.route('**/realtime/v1/**', (route) => route.abort());
  return () => blocked;
}

const findings = [];
const flag = (sev, what, repro, shot) => { findings.push({ sev, what, repro, shot: shot || null }); console.log(`[${sev}] ${what} (shot=${shot || '-'})`); };

async function deskObjCount(page) {
  return await page.evaluate(() => {
    const main = document.querySelector('main'); if (!main) return -1;
    return Array.from(main.querySelectorAll('div')).filter((d) => { const cs = getComputedStyle(d); return cs.position === 'absolute' && (cs.cursor === 'grab' || cs.cursor === 'grabbing') && cs.touchAction === 'none'; }).length;
  });
}
// The draw surface = the <svg> in the popup whose cursor is crosshair (input=draw).
async function drawSurfaceBox(page) {
  return await page.evaluate(() => {
    const svgs = Array.from(document.querySelectorAll('[role="dialog"] svg'));
    for (const s of svgs) { const cs = getComputedStyle(s); const r = s.getBoundingClientRect(); if (r.width > 120 && r.height > 120) return { x: r.left, y: r.top, w: r.width, h: r.height, cursor: cs.cursor }; }
    return null;
  });
}
async function drawStroke(page, box, pts) {
  const px = (fx) => box.x + box.w * fx, py = (fy) => box.y + box.h * fy;
  await page.mouse.move(px(pts[0][0]), py(pts[0][1]));
  await page.mouse.down();
  for (let i = 1; i < pts.length; i++) await page.mouse.move(px(pts[i][0]), py(pts[i][1]), { steps: 4 });
  await page.mouse.up();
  await sleep(120);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 860 } });
  await context.addInitScript((p) => {
    try { localStorage.setItem('dd.session.id', 'HUNTER-SESSION-R3'); if (!p) localStorage.setItem('dd.onboarded', '1'); } catch {}
  }, PERSONAL);
  const getBlocked = await installIntercept(context, 4);
  const page = await context.newPage();
  const consoleErrors = [], pageErrors = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => pageErrors.push(String(e.message || e)));

  await page.goto(`${BASE}/desk`, { waitUntil: 'domcontentloaded' });
  await sleep(2500);
  await SHOT(page, '00-desk');

  // If personal-space onboarding is up, screenshot + try to dismiss/complete it.
  if (PERSONAL) {
    const onboard = await page.locator('text=/onboard|handle|welcome|choose|name yourself/i').count().catch(() => 0);
    await SHOT(page, '00b-onboard');
    console.log('PERSONAL mode: onboarding-ish text matches =', onboard);
  }

  const baseCount = await deskObjCount(page);
  console.log('desk objects at load:', baseCount);

  // ── A) FULL MINT: open → draw → Done → name → Place ─────────────────────────
  await page.locator('button:has-text("Add doodle")').click({ force: true });
  await sleep(500);
  let box = await drawSurfaceBox(page);
  await SHOT(page, '01-draw-open');
  if (!box) { flag('high', 'draw surface (crosshair svg) not found in popup', 'Add doodle → look for draw svg', '01-draw-open'); }
  else {
    console.log('draw surface box:', JSON.stringify(box));
    await drawStroke(page, box, [[0.2, 0.5], [0.35, 0.3], [0.5, 0.55], [0.65, 0.3], [0.8, 0.5]]);
    await SHOT(page, '02-stroke');
    // Done → naming stage
    const doneBtn = page.locator('[role="dialog"] button:has-text("Done")');
    const doneEnabled = await doneBtn.isEnabled().catch(() => false);
    if (!doneEnabled) flag('high', 'Done disabled after drawing a stroke (canDone gate stuck)', 'draw 1 stroke → Done disabled', '02-stroke');
    await doneBtn.click({ force: true }).catch(() => {});
    await sleep(400);
    await SHOT(page, '03-naming');
    const placeBtn = page.locator('[role="dialog"] button:has-text("Place on desk")');
    const hasPlace = await placeBtn.count();
    if (hasPlace === 0) flag('high', 'naming stage has no "Place on desk" button', 'Done → naming stage', '03-naming');
    else {
      // type a name then Place
      const nameInput = page.locator('[role="dialog"] input[placeholder="Name your doodle"]');
      if (await nameInput.count()) { await nameInput.fill('hunter-mint'); }
      await placeBtn.click({ force: true });
      await sleep(700);
      await SHOT(page, '04-after-place');
      const newCount = await deskObjCount(page);
      console.log('desk objects after Place:', newCount, '(was', baseCount, ')');
      if (newCount <= baseCount) flag('high', `Place did not mint a new desk object (count ${baseCount}→${newCount})`, 'draw→Done→name→Place; object count unchanged', '04-after-place');
      // popup should be closed
      const popupGone = (await page.locator('[role="dialog"]').count()) === 0;
      if (!popupGone) flag('med', 'draw popup did not close after Place', 'Place on desk → popup stays', '04-after-place');
    }
  }

  // ── B) CANCEL-WITH-STROKES: Escape-arm guard ────────────────────────────────
  await page.locator('button:has-text("Add doodle")').click({ force: true });
  await sleep(400);
  box = await drawSurfaceBox(page);
  if (box) {
    await drawStroke(page, box, [[0.3, 0.4], [0.7, 0.6]]);
    // single Escape should ARM (not close)
    await page.keyboard.press('Escape');
    await sleep(200);
    const stillOpen = (await page.locator('[role="dialog"]').count()) > 0;
    await SHOT(page, '05-escape-armed');
    if (!stillOpen) flag('med', 'single Escape with unsaved strokes closed popup (no discard guard)', 'draw → Escape once → popup closed', '05-escape-armed');
    // second Escape closes
    await page.keyboard.press('Escape');
    await sleep(300);
    const closed = (await page.locator('[role="dialog"]').count()) === 0;
    await SHOT(page, '06-escape-confirm');
    if (!closed) flag('low', 'double Escape did not close popup after arming', 'draw → Esc → Esc', '06-escape-confirm');
  }

  // ── C) BACK from naming preserves strokes (re-Done works) ───────────────────
  await page.locator('button:has-text("Add doodle")').click({ force: true });
  await sleep(400);
  box = await drawSurfaceBox(page);
  if (box) {
    await drawStroke(page, box, [[0.25, 0.5], [0.5, 0.25], [0.75, 0.5]]);
    await page.locator('[role="dialog"] button:has-text("Done")').click({ force: true }).catch(() => {});
    await sleep(300);
    const back = page.locator('[role="dialog"] button:has-text("Back")');
    if (await back.count()) {
      await back.click({ force: true });
      await sleep(300);
      await SHOT(page, '07-back-from-name');
      // Done should be available again (strokes intact)
      const doneAgain = page.locator('[role="dialog"] button:has-text("Done")');
      const ok = await doneAgain.isEnabled().catch(() => false);
      if (!ok) flag('med', 'Back from naming lost strokes (Done re-disabled)', 'draw→Done→Back→Done disabled', '07-back-from-name');
    } else flag('low', 'no Back button in naming stage', 'Done→naming', '07-back-from-name');
    // cancel out
    await page.locator('[role="dialog"] button:has-text("Cancel")').click({ force: true }).catch(() => {});
    await page.keyboard.press('Escape').catch(() => {});
    await sleep(300);
  }

  // ── D) FLIP-MID-GESTURE: start a stroke, switch input tab mid-draw ───────────
  await page.locator('button:has-text("Add doodle")').click({ force: true });
  await sleep(400);
  box = await drawSurfaceBox(page);
  if (box) {
    const px = (fx) => box.x + box.w * fx, py = (fy) => box.y + box.h * fy;
    await page.mouse.move(px(0.3), py(0.5));
    await page.mouse.down();
    await page.mouse.move(px(0.5), py(0.4), { steps: 3 });
    // mid-gesture: click an input tab (Upload SVG) WITHOUT releasing
    await page.locator('[role="dialog"] button:has-text("Upload SVG")').click({ force: true }).catch(() => {});
    await page.mouse.move(px(0.7), py(0.5), { steps: 3 });
    await page.mouse.up();
    await sleep(300);
    await SHOT(page, '08-flip-mid-gesture');
    const alive = (await page.locator('[role="dialog"]').count()) > 0 || (await page.locator('button:has-text("Add doodle")').count()) > 0;
    if (!alive) flag('high', 'popup/desk dead after flip-mid-gesture (draw + tab switch mid-stroke)', 'press-draw, switch to Upload SVG mid-stroke, release', '08-flip-mid-gesture');
    await page.keyboard.press('Escape').catch(() => {});
    await page.keyboard.press('Escape').catch(() => {});
    await sleep(300);
  }

  // ── E) RAPID open/cancel storm ───────────────────────────────────────────────
  for (let i = 0; i < 6; i++) {
    await page.locator('button:has-text("Add doodle")').click({ force: true }).catch(() => {});
    await sleep(120);
    await page.locator('[role="dialog"] button:has-text("Cancel")').click({ force: true }).catch(() => {});
    await sleep(120);
  }
  await SHOT(page, '09-rapid-open-cancel');
  const aliveEnd = await page.locator('button:has-text("Add doodle")').count();
  if (aliveEnd === 0) flag('high', 'desk dead after rapid open/cancel storm', 'Add doodle ↔ Cancel x6', '09-rapid-open-cancel');

  await sleep(300);
  await SHOT(page, '10-final');
  const blocked = getBlocked();
  console.log(`\n=== blocked non-GET writes: ${blocked} ===`);
  console.log(`=== console errors: ${consoleErrors.length} | page errors: ${pageErrors.length} ===`);
  writeFileSync(`${OUT}/result.json`, JSON.stringify({ base: BASE, personal: PERSONAL, blockedWrites: blocked, consoleErrors: [...new Set(consoleErrors)].slice(0, 40), pageErrors: [...new Set(pageErrors)].slice(0, 40), findings }, null, 2));
  console.log('wrote', `${OUT}/result.json`);
  await browser.close();
}
main().catch((e) => { console.error('HARNESS ERROR', e); process.exit(1); });
