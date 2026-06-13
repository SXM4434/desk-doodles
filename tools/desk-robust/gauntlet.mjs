// DeskPage robustness + craft gauntlet.
// Route-intercept the Supabase host to simulate offline / slow / hang / empty
// WITHOUT touching the live DB (NO live-DB writes — every Supabase request is
// intercepted). Screenshots are written to /tmp/dd-gauntlet/shots and READ by
// the agent afterward.
//
// Run: node /tmp/dd-gauntlet/gauntlet.mjs
import pw from '/Users/sebs/Desktop/Projects/portfolio/tools/lab-screenshots/node_modules/playwright/index.js';
const { chromium } = pw;
import { mkdirSync, writeFileSync } from 'fs';

const BASE = 'http://localhost:4477';
const SUPA = 'revoukwqlisqdjteortc.supabase.co';
const SHOTS = '/tmp/dd-gauntlet/shots';
mkdirSync(SHOTS, { recursive: true });

const log = [];
function note(scenario, detail) {
  log.push({ scenario, detail });
  console.log(`[${scenario}] ${detail}`);
}

// Helper: read the desk connection chip text + presence of Retry pill.
async function readDeskState(page) {
  const chip = await page
    .locator('span', { hasText: /Live|Connecting|Offline/ })
    .first()
    .textContent()
    .catch(() => null);
  const retryNow = await page
    .getByRole('button', { name: /Retry now/i })
    .count()
    .catch(() => 0);
  const offlineCopy = await page
    .getByText(/Couldn.t reach the desk/i)
    .count()
    .catch(() => 0);
  const emptyCopy = await page
    .getByText(/This desk is empty/i)
    .count()
    .catch(() => 0);
  return { chip: chip?.trim(), retryNow, offlineCopy, emptyCopy };
}

// ─── Route handlers (installed per-context) ─────────────────────────────────
// HANG: never fulfill → exercises the connection-timeout path (CONNECTING then
// the 8s deadline flips to Offline).
async function routeHang(page) {
  await page.route(`**://${SUPA}/**`, async () => {
    // intentionally never resolve — Playwright keeps the request pending,
    // mirroring a dead/slow backend that supabase-js would otherwise await
    // forever. The app's withTimeout() must rescue the UI.
  });
}
// ABORT: reject immediately → exercises the .catch() offline path fast.
async function routeAbort(page) {
  await page.route(`**://${SUPA}/**`, (route) => route.abort('failed'));
}
// EMPTY-CONNECTED: respond 200 with empty arrays for table reads + null for the
// desks single() so getOpenDesk()→null (flat fallback) and listDoodles()→[].
async function routeEmpty(page) {
  await page.route(`**://${SUPA}/rest/v1/**`, (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'content-range': '0-0/0' },
      body: '[]',
    });
  });
  // realtime websocket: just let it try/fail — not load-bearing for empty state.
  await page.route(`**://${SUPA}/realtime/**`, (route) => route.abort('failed'));
}

const browser = await chromium.launch();

// ── 1. OFFLINE/HANG on /desk — CONNECTING → timeout → Offline + Retry ───────
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await routeHang(page);
  await page.goto(`${BASE}/desk`, { waitUntil: 'domcontentloaded' });
  // Immediately capture the CONNECTING state (before the 8s deadline).
  await page.waitForTimeout(800);
  let s = await readDeskState(page);
  await page.screenshot({ path: `${SHOTS}/01a-desk-connecting.png` });
  note('desk-hang', `t=0.8s chip="${s.chip}" (expect Connecting)`);
  // Wait past the 8s load timeout — the UI must flip to Offline + Retry.
  await page.waitForTimeout(8500);
  s = await readDeskState(page);
  await page.screenshot({ path: `${SHOTS}/01b-desk-timeout-offline.png` });
  note(
    'desk-hang',
    `t=9.3s chip="${s.chip}" retryNow=${s.retryNow} offlineCopy=${s.offlineCopy} (expect Offline + Retry + honest copy)`,
  );
  await ctx.close();
}

// ── 2. OFFLINE (instant abort) on /desk — fast offline path ─────────────────
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await routeAbort(page);
  await page.goto(`${BASE}/desk`, { waitUntil: 'domcontentloaded' });
  // supabase-js retries network failures internally with backoff, so an aborted
  // request surfaces its rejection a few seconds in (not instantly). Wait for
  // the offline copy to appear (up to 12s) rather than a fixed short window.
  await page
    .getByText(/Couldn.t reach the desk/i)
    .waitFor({ timeout: 12000 })
    .catch(() => {});
  const s = await readDeskState(page);
  await page.screenshot({ path: `${SHOTS}/02-desk-abort-offline.png` });
  note(
    'desk-abort',
    `chip="${s.chip}" retryNow=${s.retryNow} offlineCopy=${s.offlineCopy} (expect Offline + Retry)`,
  );
  await ctx.close();
}

// ── 3. EMPTY-BUT-CONNECTED on /desk — warm first-time state ─────────────────
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await routeEmpty(page);
  await page.goto(`${BASE}/desk`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1800);
  const s = await readDeskState(page);
  await page.screenshot({ path: `${SHOTS}/03-desk-empty-connected.png` });
  note(
    'desk-empty',
    `chip="${s.chip}" emptyCopy=${s.emptyCopy} offlineCopy=${s.offlineCopy} (expect Live + warm empty copy, NO offline)`,
  );
  await ctx.close();
}

// ── 4. RAPID RETRY break test — hammer Retry while still offline ─────────────
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  let pageErr = null;
  page.on('pageerror', (e) => (pageErr = e.message));
  await routeAbort(page);
  await page.goto(`${BASE}/desk`, { waitUntil: 'domcontentloaded' });
  // Wait for the offline state to land before hammering Retry.
  await page
    .getByRole('button', { name: /Retry now/i })
    .waitFor({ timeout: 12000 })
    .catch(() => {});
  const retry = page.getByRole('button', { name: /Retry now/i });
  let clicks = 0;
  for (let i = 0; i < 6; i++) {
    if (await retry.count()) {
      await retry.first().click({ timeout: 1000 }).catch(() => {});
      clicks++;
    }
    await page.waitForTimeout(120);
  }
  await page.waitForTimeout(800);
  const s = await readDeskState(page);
  await page.screenshot({ path: `${SHOTS}/04-desk-rapid-retry.png` });
  note(
    'desk-rapid-retry',
    `clicks=${clicks} chip="${s.chip}" pageErr=${pageErr ?? 'none'} (expect stable Offline, no crash)`,
  );
  await ctx.close();
}

// ── 5. CONNECT-THEN-DROP break test — empty load OK, then realtime/link drop ─
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  let pageErr = null;
  page.on('pageerror', (e) => (pageErr = e.message));
  await routeEmpty(page);
  await page.goto(`${BASE}/desk`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  let s = await readDeskState(page);
  note('desk-connect-then-drop', `after connect chip="${s.chip}" (expect Live)`);
  // Now drop the link: flip the browser context offline (navigator.onLine=false
  // fires the 'offline' event the app listens for).
  await ctx.setOffline(true);
  await page.waitForTimeout(1200);
  s = await readDeskState(page);
  await page.screenshot({ path: `${SHOTS}/05-desk-connect-then-drop.png` });
  note(
    'desk-connect-then-drop',
    `after drop chip="${s.chip}" pageErr=${pageErr ?? 'none'} (expect Offline within ~2s, no crash)`,
  );
  await ctx.close();
}

// ── 6. RESIZE DURING LOAD break test — resize narrow while hanging ──────────
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  let pageErr = null;
  page.on('pageerror', (e) => (pageErr = e.message));
  await routeHang(page);
  await page.goto(`${BASE}/desk`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(400);
  await page.setViewportSize({ width: 640, height: 800 });
  await page.waitForTimeout(400);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.waitForTimeout(400);
  await page.setViewportSize({ width: 820, height: 800 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${SHOTS}/06-desk-resize-during-load.png` });
  note(
    'desk-resize-during-load',
    `pageErr=${pageErr ?? 'none'} (expect no crash, header reflows)`,
  );
  await ctx.close();
}

// ── 7. NARROW HEADER /desk at 820 + 640 (empty-connected so objects render) ──
for (const w of [820, 640]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 760 } });
  const page = await ctx.newPage();
  await routeEmpty(page);
  await page.goto(`${BASE}/desk`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1400);
  // Measure header overflow: scrollWidth vs clientWidth of the header element.
  const overflow = await page.evaluate(() => {
    const h = document.querySelector('header');
    if (!h) return { found: false };
    return {
      found: true,
      scrollW: h.scrollWidth,
      clientW: h.clientWidth,
      overflowing: h.scrollWidth > h.clientWidth + 1,
    };
  });
  await page.screenshot({ path: `${SHOTS}/07-desk-header-${w}.png`, fullPage: false });
  note(
    `desk-header-${w}`,
    `header scrollW=${overflow.scrollW} clientW=${overflow.clientW} OVERFLOW=${overflow.overflowing}`,
  );
  await ctx.close();
}

// ── 8. NARROW HEADER /playground at 820 + 640 (no DB needed) ────────────────
for (const w of [820, 640]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 760 } });
  const page = await ctx.newPage();
  await routeEmpty(page);
  await page.goto(`${BASE}/playground`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  const overflow = await page.evaluate(() => {
    const h = document.querySelector('header');
    if (!h) return { found: false };
    return {
      found: true,
      scrollW: h.scrollWidth,
      clientW: h.clientWidth,
      overflowing: h.scrollWidth > h.clientWidth + 1,
    };
  });
  await page.screenshot({ path: `${SHOTS}/08-playground-header-${w}.png` });
  note(
    `playground-header-${w}`,
    `header scrollW=${overflow.scrollW} clientW=${overflow.clientW} OVERFLOW=${overflow.overflowing}`,
  );
  await ctx.close();
}

// ── 9. /desks gallery: HANG → Loading → timeout error + Retry ───────────────
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await routeHang(page);
  await page.goto(`${BASE}/desks`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);
  let loading = await page.getByText(/Loading the wall/i).count();
  note('desks-hang', `t=0.8s loadingCopy=${loading} (expect Loading)`);
  await page.waitForTimeout(8500);
  const errCopy = await page.getByText(/Couldn.t reach the wall/i).count();
  const retry = await page.getByRole('button', { name: /^Retry$/i }).count();
  await page.screenshot({ path: `${SHOTS}/09-desks-timeout-error.png` });
  note(
    'desks-hang',
    `t=9.3s errCopy=${errCopy} retry=${retry} (expect honest error + Retry, NOT empty placeholder)`,
  );
  await ctx.close();
}

// ── 10. /desks gallery: EMPTY-CONNECTED → friendly empty placeholder ─────────
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await routeEmpty(page);
  await page.goto(`${BASE}/desks`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  const emptyCopy = await page.getByText(/No desks on the wall yet/i).count();
  const errCopy = await page.getByText(/Couldn.t reach the wall/i).count();
  await page.screenshot({ path: `${SHOTS}/10-desks-empty.png` });
  note(
    'desks-empty',
    `emptyCopy=${emptyCopy} errCopy=${errCopy} (expect empty placeholder, NO error)`,
  );
  await ctx.close();
}

// ── 11. WIDE header craft reference /desk at 1280 (empty-connected) ──────────
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await routeEmpty(page);
  await page.goto(`${BASE}/desk`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1400);
  await page.screenshot({ path: `${SHOTS}/11-desk-header-wide-1280.png` });
  // Crop the header band tightly for the craft eyeball.
  const h = page.locator('header').first();
  await h.screenshot({ path: `${SHOTS}/11b-desk-header-band.png` }).catch(() => {});
  note('desk-header-wide', 'captured 1280 wide header for craft eyeball');
  await ctx.close();
}

await browser.close();
writeFileSync(`${SHOTS}/../results.json`, JSON.stringify(log, null, 2));
console.log('\n=== GAUNTLET COMPLETE — results.json written ===');
