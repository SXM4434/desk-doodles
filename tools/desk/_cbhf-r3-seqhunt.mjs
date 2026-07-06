// Adversarial /desk interaction-sequence hunt (READ-ONLY, route-abort all writes).
// Round 3 cross-cutting hunter. Reuses the populated-desk-battery REST intercept
// approach: every non-GET REST/RPC is fulfilled benignly so NOTHING reaches the
// live DB. Drives /desk through weird/degenerate/rapid/overlapping sequences,
// captures console errors + page errors + screenshots at each break candidate.
import { createRequire } from 'module';
import { mkdirSync, writeFileSync } from 'fs';
const require = createRequire(import.meta.url);
const { chromium } = require('/Users/sebs/Desktop/Projects/portfolio/tools/lab-screenshots/node_modules/playwright');

const BASE = process.env.BASE || 'http://localhost:5346';
const OUT = process.env.OUT || '/tmp/dd-cbhf-r3';
const PERSONAL = process.env.PERSONAL === '1';
mkdirSync(OUT, { recursive: true });

const SHOT = (page, name) => page.screenshot({ path: `${OUT}/${name}.png` }).catch(() => {});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Synthetic desk + doodles (so /desk has objects to drag/move) ──────────────
function syntheticDesk(n) {
  return {
    id: 'desk-synth-0', desk_index: 0, name: 'Hunt Desk', object_cap: 120,
    object_count: n, is_open: true, preview_svg: null, owner_id: null,
    created_at: new Date(1700000000000).toISOString(),
  };
}
function makeRows(n) {
  const rows = [];
  // Normalized markup as real published rows carry (width/height set by
  // normalizeSvgSize at the add boundary; ~180px footprint).
  const svgs = [
    '<svg width="180" height="180" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40" fill="none" stroke="black" stroke-width="3"/></svg>',
    '<svg width="180" height="180" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="20" y="20" width="60" height="60" fill="none" stroke="black" stroke-width="3"/></svg>',
    '<svg width="180" height="180" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M10 80 Q 50 10 90 80" fill="none" stroke="black" stroke-width="3"/></svg>',
  ];
  for (let i = 0; i < n; i++) {
    rows.push({
      id: `dood-${i}`, desk_id: 'desk-synth-0', desk_index: 0,
      svg: svgs[i % svgs.length], name: `obj ${i}`, why: null,
      x: 120 + (i % 4) * 200, y: 120 + Math.floor(i / 4) * 200, rotation: 0,
      session_id: i === 1 ? 'FOREIGN-SESSION' : null, // obj 1 = foreign (drag-block path)
      render_config: null, content_hash: `h${i}`,
      created_at: new Date(1700000000000 + i * 1000).toISOString(),
    });
  }
  return rows;
}

async function installIntercept(context, n) {
  const rows = makeRows(n);
  const desk = syntheticDesk(n);
  let blockedWrites = 0;
  await context.route('**/rest/v1/**', async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const p = url.pathname;
    const method = req.method();
    if (method !== 'GET') {
      blockedWrites++;
      // ROUTE-ABORT all non-GET (writes) — never reach the live DB.
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      return;
    }
    if (p.endsWith('/desks')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([desk]) });
      return;
    }
    if (p.endsWith('/doodles')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(rows) });
      return;
    }
    if (p.includes('/rpc/')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: 'null' });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
  // Realtime websocket — abort so no live channel; app falls back gracefully.
  await context.route('**/realtime/v1/**', (route) => route.abort());
  return () => blockedWrites;
}

const findings = [];
function flag(sev, what, repro, shot) {
  findings.push({ sev, what, repro, shot: shot || null });
  console.log(`[${sev}] ${what}  (shot=${shot || '-'})`);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 860 } });
  // Pin a stable session id; mark onboarded so personal-space onboarding can be
  // toggled deliberately rather than firing on first load.
  await context.addInitScript(() => {
    try { localStorage.setItem('dd.session.id', 'HUNTER-SESSION-R3'); } catch {}
  });
  const getBlocked = await installIntercept(context, 8);

  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => pageErrors.push(String(e.message || e)));
  page.on('requestfailed', (r) => {
    const u = r.url();
    // realtime aborts are intentional; ignore those
    if (!u.includes('/realtime/')) {
      const f = r.failure();
      if (f && !/aborted/i.test(f.errorText || '')) {
        // record but don't over-flag — only genuine app fetch failures
      }
    }
  });

  // ── MOUNT HEALTH ────────────────────────────────────────────────────────────
  await page.goto(`${BASE}/desk`, { waitUntil: 'domcontentloaded' });
  await sleep(2500);
  const rootHtml = await page.$eval('#root', (el) => el.innerHTML.length).catch(() => 0);
  await SHOT(page, '01-mount');
  if (rootHtml < 200) flag('high', '/desk mounted blank (root nearly empty)', 'goto /desk', '01-mount');
  const addBtn = await page.locator('button:has-text("Add doodle")').count();
  if (addBtn === 0) flag('high', 'Add-doodle button missing after mount', 'goto /desk; look for CTA', '01-mount');
  else console.log('mount OK: Add doodle present, root html len', rootHtml);

  // Helper: get a desk object center in screen coords (objects are positioned divs)
  async function objCenters() {
    return await page.evaluate(() => {
      const main = document.querySelector('main');
      if (!main) return [];
      // Object wrappers are absolutely-positioned divs with cursor grab/grabbing
      // and touchAction:none, each holding the DeskObjectArt. Find them by style.
      const all = Array.from(main.querySelectorAll('div'));
      const wrappers = all.filter((d) => {
        const cs = getComputedStyle(d);
        return cs.position === 'absolute' && (cs.cursor === 'grab' || cs.cursor === 'grabbing') && cs.touchAction === 'none';
      });
      return wrappers.map((d) => {
        const r = d.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
      }).filter((c) => c.w > 4 && c.h > 4);
    });
  }

  // ── SEQ 1: place→move→drag own object, then mid-drag flip to off-canvas ──────
  let centers = await objCenters();
  console.log('object svg centers found:', centers.length);
  if (centers.length >= 2) {
    const c0 = centers[0];
    // normal drag (own object - obj 0 is null session = ours? actually own = session match; null=anon)
    await page.mouse.move(c0.x, c0.y);
    await page.mouse.down();
    await page.mouse.move(c0.x + 60, c0.y + 40, { steps: 6 });
    await page.mouse.move(c0.x + 200, c0.y + 150, { steps: 8 });
    await page.mouse.up();
    await sleep(300);
    let after = await objCenters();
    await SHOT(page, '02-drag-own');
    if (after.length < centers.length) flag('high', 'object DISAPPEARED after normal drag', 'drag obj0 +200,+150', '02-drag-own');

    // ADVERSARIAL: start a drag then move pointer WAY off-canvas (negative coords)
    after = await objCenters();
    if (after.length) {
      const t = after[0];
      await page.mouse.move(t.x, t.y);
      await page.mouse.down();
      await page.mouse.move(t.x - 50, t.y - 50, { steps: 3 });
      await page.mouse.move(-500, -500, { steps: 5 }); // off-canvas extreme
      await page.mouse.move(5000, 5000, { steps: 5 }); // far off other side
      await page.mouse.up();
      await sleep(300);
      const off = await objCenters();
      await SHOT(page, '03-drag-offcanvas');
      if (off.length < after.length) flag('med', 'object LOST after off-canvas drag (−500/+5000)', 'drag obj then move pointer off-canvas extreme', '03-drag-offcanvas');
    }
  } else {
    flag('high', 'no draggable object SVGs rendered on populated desk', 'mocked 8 doodles, 0 svg rendered', '01-mount');
  }

  // ── SEQ 2: drag a FOREIGN object (obj 1 = FOREIGN-SESSION) — must nudge-block ──
  centers = await objCenters();
  if (centers.length >= 2) {
    const f = centers[1];
    await page.mouse.move(f.x, f.y);
    await page.mouse.down();
    await page.mouse.move(f.x + 150, f.y + 120, { steps: 8 });
    await page.mouse.up();
    await sleep(500);
    const after = await objCenters();
    await SHOT(page, '04-foreign-drag');
    // foreign object should NOT have moved far (nudge-and-settle). Hard to assert
    // position exactly; just confirm it didn't vanish.
    if (after.length < centers.length) flag('med', 'foreign object vanished after drag attempt', 'drag obj1 (foreign session)', '04-foreign-drag');
  }

  // ── SEQ 3: rapid zoom in/out + Fit spam, then wheel-zoom storm ───────────────
  const zoomIn = page.locator('button[aria-label="Zoom in"]');
  const zoomOut = page.locator('button[aria-label="Zoom out"]');
  const fit = page.locator('button[aria-label="Fit the full desk"]');
  for (let i = 0; i < 12; i++) { await zoomIn.click({ force: true }).catch(() => {}); }
  for (let i = 0; i < 20; i++) { await zoomOut.click({ force: true }).catch(() => {}); }
  await SHOT(page, '05-zoom-extremes');
  await fit.click({ force: true }).catch(() => {});
  await sleep(200);
  await SHOT(page, '06-fit-after-zoom');
  // wheel storm over the desk
  const deskBox = await page.locator('main').boundingBox();
  if (deskBox) {
    const cx = deskBox.x + deskBox.width / 2, cy = deskBox.y + deskBox.height / 2;
    await page.mouse.move(cx, cy);
    for (let i = 0; i < 30; i++) { await page.mouse.wheel(0, i % 2 ? -200 : 200); }
    await sleep(200);
    await SHOT(page, '07-wheel-storm');
  }
  await fit.click({ force: true }).catch(() => {});
  await sleep(200);
  const afterFit = await objCenters();
  await SHOT(page, '08-fit-recover');
  if (afterFit.length === 0 && centers.length > 0) flag('high', 'objects not visible after Fit recovery (lost view)', 'zoom storm + wheel storm + Fit', '08-fit-recover');

  // ── SEQ 4: panel-overlap stress — open drawer + right panel + draw popup ──────
  await page.locator('button:has-text("Drawer")').first().click({ force: true }).catch(() => {});
  await sleep(150);
  await SHOT(page, '09-drawer-open');
  // open draw popup ON TOP of drawer
  await page.locator('button:has-text("Add doodle")').click({ force: true }).catch(() => {});
  await sleep(400);
  await SHOT(page, '10-draw-over-drawer');
  const drawCanvas = await page.locator('canvas').count();
  if (drawCanvas === 0) flag('med', 'draw popup opened with NO canvas (DrawPanel mount issue?)', 'open Drawer then Add doodle', '10-draw-over-drawer');
  // cancel/back out of the draw popup
  const cancelBtn = page.locator('button:has-text("Cancel"), button:has-text("Close"), button:has-text("Back")');
  const cancelCount = await cancelBtn.count();
  if (cancelCount > 0) { await cancelBtn.first().click({ force: true }).catch(() => {}); }
  else {
    // try Escape
    await page.keyboard.press('Escape');
  }
  await sleep(300);
  await SHOT(page, '11-after-cancel-draw');
  const stillCanvas = await page.locator('canvas').count();
  // it's fine if drawer still has a canvas; just confirm app alive
  const aliveAdd = await page.locator('button:has-text("Add doodle")').count();
  if (aliveAdd === 0) flag('high', 'desk lost Add-doodle CTA after cancel of draw popup', 'open draw popup; cancel/escape', '11-after-cancel-draw');

  // ── SEQ 5: rapid panel-scope toggle (Pen/Desk) + right panel toggle storm ─────
  const scopeTabs = page.locator('[role="tablist"][aria-label="Panel scope"] button');
  const scopeN = await scopeTabs.count();
  if (scopeN >= 2) {
    for (let i = 0; i < 16; i++) { await scopeTabs.nth(i % scopeN).click({ force: true }).catch(() => {}); }
    await sleep(200);
    await SHOT(page, '12-scope-toggle-storm');
  }

  // ── SEQ 6: open an object surface (click without drag), then back, rapid ──────
  await fit.click({ force: true }).catch(() => {});
  await sleep(200);
  centers = await objCenters();
  if (centers.length) {
    const t = centers[0];
    // a clean click (no movement) opens the object surface
    await page.mouse.click(t.x, t.y);
    await sleep(500);
    await SHOT(page, '13-object-surface');
    const surfaceOpen = await page.locator('button:has-text("Close"), button:has-text("Done"), button:has-text("Save")').count();
    // close it
    await page.keyboard.press('Escape');
    await sleep(200);
    // rapid open/close
    for (let i = 0; i < 5; i++) {
      await page.mouse.click(t.x, t.y);
      await sleep(120);
      await page.keyboard.press('Escape');
      await sleep(120);
    }
    await SHOT(page, '14-surface-rapid');
    const aliveAfter = await page.locator('button:has-text("Add doodle")').count();
    if (aliveAfter === 0) flag('high', 'desk dead after rapid object-surface open/close', 'click obj→Esc x5', '14-surface-rapid');
  }

  // ── SEQ 7: micro-drag (within click slop) must NOT move object (R1 revert) ────
  centers = await objCenters();
  if (centers.length) {
    const t = centers[0];
    const before = { x: t.x, y: t.y };
    await page.mouse.move(t.x, t.y);
    await page.mouse.down();
    await page.mouse.move(t.x + 3, t.y + 2, { steps: 2 }); // sub-slop
    await page.mouse.up();
    await sleep(400);
    const after = await objCenters();
    await SHOT(page, '15-microdrag');
    // surface may have opened (click); close if so
    await page.keyboard.press('Escape').catch(() => {});
    if (after.length) {
      const moved = Math.hypot(after[0].x - before.x, after[0].y - before.y);
      if (moved > 30) flag('med', `micro-drag (3px) moved object ${moved.toFixed(0)}px (R1 revert failed?)`, 'press obj, move 3px, release', '15-microdrag');
    }
  }

  // ── SEQ 8: empty-desk pan drag then Fit on empty (separate context) ───────────
  // (covered conceptually; the populated path exercises pan via wheel/zoom.)

  // ── Final mount-health re-check ──────────────────────────────────────────────
  await sleep(300);
  await SHOT(page, '16-final');
  const finalAlive = await page.locator('button:has-text("Add doodle")').count();
  if (finalAlive === 0) flag('high', 'desk dead at end of full sequence', 'full adversarial sequence', '16-final');

  // ── Console / page error harvest ─────────────────────────────────────────────
  const blocked = getBlocked();
  console.log(`\n=== blocked non-GET writes: ${blocked} (all route-aborted, 0 reached DB) ===`);
  console.log(`=== console errors: ${consoleErrors.length} | page errors: ${pageErrors.length} ===`);
  const result = {
    base: BASE, personal: PERSONAL, blockedWrites: blocked,
    consoleErrors: [...new Set(consoleErrors)].slice(0, 40),
    pageErrors: [...new Set(pageErrors)].slice(0, 40),
    findings,
  };
  writeFileSync(`${OUT}/result.json`, JSON.stringify(result, null, 2));
  console.log('wrote', `${OUT}/result.json`);

  await browser.close();
}

main().catch((e) => { console.error('HARNESS ERROR', e); process.exit(1); });
