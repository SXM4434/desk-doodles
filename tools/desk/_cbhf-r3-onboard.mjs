// Personal-space ONBOARDING edge hunt (READ-ONLY; route-aborts all non-GET).
// Run against a VITE_PERSONAL_SPACE=1 server. Edges:
//  - first-load onboarding appears (no dd.onboarded marker)
//  - Reroll spam, custom-handle degenerate inputs (empty / spaces / unicode / very long)
//  - Keep / Skip / custom settle paths
//  - dismiss via scrim, reopen via "Edit your handle", rapid reopen
//  - claimHandle is DB-write-gated OFF (isPersonalSpaceDbReady false) → no write reaches DB
import { createRequire } from 'module';
import { mkdirSync, writeFileSync } from 'fs';
const require = createRequire(import.meta.url);
const { chromium } = require('/Users/sebs/Desktop/Projects/portfolio/tools/lab-screenshots/node_modules/playwright');

const BASE = process.env.BASE || 'http://localhost:5348';
const OUT = process.env.OUT || '/tmp/dd-cbhf-r3-onboard';
mkdirSync(OUT, { recursive: true });
const SHOT = (page, n) => page.screenshot({ path: `${OUT}/${n}.png` }).catch(() => {});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function installIntercept(context) {
  const desk = { id: 'desk-synth-0', desk_index: 0, name: 'Hunt Desk', object_cap: 120, object_count: 0, is_open: true, preview_svg: null, owner_id: null, created_at: new Date(1700000000000).toISOString() };
  let blocked = 0;
  await context.route('**/rest/v1/**', async (route) => {
    const req = route.request(); const url = new URL(req.url()); const p = url.pathname;
    if (req.method() !== 'GET') { blocked++; await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }); return; }
    if (p.endsWith('/desks')) { await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([desk]) }); return; }
    if (p.endsWith('/doodles')) { await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }); return; }
    if (p.endsWith('/profiles')) { await route.fulfill({ status: 200, contentType: 'application/json', body: 'null' }); return; }
    if (p.includes('/rpc/')) { await route.fulfill({ status: 200, contentType: 'application/json', body: 'null' }); return; }
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
  await context.route('**/realtime/v1/**', (route) => route.abort());
  return () => blocked;
}

const findings = [];
const flag = (sev, what, repro, shot) => { findings.push({ sev, what, repro, shot: shot || null }); console.log(`[${sev}] ${what} (shot=${shot || '-'})`); };

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 860 } });
  // Fresh visitor: pin session, do NOT set dd.onboarded → onboarding must appear.
  await context.addInitScript(() => { try { localStorage.setItem('dd.session.id', 'ONBOARD-HUNTER-R3'); localStorage.removeItem('dd.onboarded'); } catch {} });
  const getBlocked = await installIntercept(context);
  const page = await context.newPage();
  const consoleErrors = [], pageErrors = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => pageErrors.push(String(e.message || e)));

  await page.goto(`${BASE}/desk`, { waitUntil: 'domcontentloaded' });
  await sleep(2500);
  await SHOT(page, '01-firstload');

  // The onboarding popup should be up. Detect by its copy.
  const meet = await page.locator('text=/Welcome to your desk/i').count();
  const keepBtn = page.locator('button:has-text("Keep it")');
  const rerollBtn = page.locator('button:has-text("Reroll")');
  const skipBtn = page.locator('button:has-text("Skip for now")');
  console.log('onboarding present (Welcome text):', meet, '| Keep btn:', await keepBtn.count(), '| Reroll:', await rerollBtn.count());
  if (meet === 0 && (await keepBtn.count()) === 0) flag('high', 'personal-space ON but onboarding did NOT appear on first load', 'VITE_PERSONAL_SPACE=1, no dd.onboarded, goto /desk', '01-firstload');

  // ── Reroll spam ─────────────────────────────────────────────────────────────
  for (let i = 0; i < 10; i++) { await rerollBtn.click({ force: true }).catch(() => {}); await sleep(40); }
  await SHOT(page, '02-reroll-spam');
  const stillUp = (await page.locator('text=/Welcome to your desk/i').count()) > 0;
  if (!stillUp) flag('med', 'onboarding closed/crashed during Reroll spam', 'Reroll x10', '02-reroll-spam');

  // ── Custom handle degenerate inputs ─────────────────────────────────────────
  // Open the custom step ("type your own")
  const typeOwn = page.locator('button:has-text("type your own"), button:has-text("Type your own")');
  if (await typeOwn.count()) { await typeOwn.first().click({ force: true }).catch(() => {}); await sleep(200); }
  const customInput = page.locator('#dd-handle-input');
  if (await customInput.count()) {
    const cases = ['', '   ', '!!!@#$%^&*', '🎨🦊✨', 'a'.repeat(120), '../../etc/passwd', '<script>alert(1)</script>'];
    for (const [i, c] of cases.entries()) {
      await customInput.fill(c).catch(() => {});
      await sleep(80);
      await SHOT(page, `03-custom-${i}`);
    }
    // try to settle the script-injection one via Enter
    await customInput.fill('<script>alert(1)</script>').catch(() => {});
    await page.keyboard.press('Enter').catch(() => {});
    await sleep(300);
    await SHOT(page, '04-custom-settle-attempt');
    if (pageErrors.length) flag('high', 'page error during custom-handle degenerate-input settle', 'inject <script>/unicode/long into handle, Enter', '04-custom-settle-attempt');
    // back to meet step if a Back exists
    const backToMeet = page.locator('[role="dialog"] button, .dialog button').filter({ hasText: /back|←/i });
    if (await backToMeet.count()) await backToMeet.first().click({ force: true }).catch(() => {});
    await sleep(200);
  } else {
    console.log('custom input not reachable (typeOwn maybe labeled differently)');
  }

  // ── Skip-for-now exit, then verify desk works + onboarding marker set ────────
  const skipNow = page.locator('button:has-text("Skip for now")');
  if (await skipNow.count()) { await skipNow.first().click({ force: true }).catch(() => {}); }
  else {
    // fall back to Keep it
    if (await keepBtn.count()) await keepBtn.first().click({ force: true }).catch(() => {});
  }
  await sleep(600);
  await SHOT(page, '05-after-skip');
  const onboardedFlag = await page.evaluate(() => { try { return localStorage.getItem('dd.onboarded'); } catch { return null; } });
  console.log('dd.onboarded after settle/skip:', onboardedFlag);
  const deskAlive = await page.locator('button:has-text("Add doodle")').count();
  if (deskAlive === 0) flag('high', 'desk not usable after onboarding skip/settle (no Add doodle)', 'onboard → Skip/Keep → desk', '05-after-skip');

  // ── Reopen via "Edit your handle" (header), rapid reopen ─────────────────────
  const editHandle = page.locator('button[title="Edit your handle"]');
  if (await editHandle.count()) {
    await editHandle.click({ force: true }).catch(() => {});
    await sleep(300);
    await SHOT(page, '06-reopen-onboard');
    const reopened = (await page.locator('text=/Welcome to your desk/i').count()) > 0;
    if (!reopened) flag('low', '"Edit your handle" did not reopen onboarding', 'click Edit your handle', '06-reopen-onboard');
    // dismiss via scrim click (PanelBoundary onDismiss) — click far corner
    await page.mouse.click(8, 8).catch(() => {});
    await sleep(200);
    // rapid reopen/dismiss
    for (let i = 0; i < 5; i++) {
      await editHandle.click({ force: true }).catch(() => {});
      await sleep(100);
      await page.keyboard.press('Escape').catch(() => {});
      await sleep(100);
    }
    await SHOT(page, '07-rapid-reopen');
  } else {
    console.log('Edit-your-handle button not found (handle not settled this session?)');
  }

  const finalAlive = await page.locator('button:has-text("Add doodle")').count();
  if (finalAlive === 0) flag('high', 'desk dead after onboarding reopen storm', 'edit-handle reopen x5', '07-rapid-reopen');

  await SHOT(page, '08-final');
  const blocked = getBlocked();
  console.log(`\n=== blocked non-GET writes: ${blocked} (claimHandle DB-gated OFF) ===`);
  console.log(`=== console errors: ${consoleErrors.length} | page errors: ${pageErrors.length} ===`);
  writeFileSync(`${OUT}/result.json`, JSON.stringify({ base: BASE, blockedWrites: blocked, consoleErrors: [...new Set(consoleErrors)].slice(0, 40), pageErrors: [...new Set(pageErrors)].slice(0, 40), findings }, null, 2));
  console.log('wrote', `${OUT}/result.json`);
  await browser.close();
}
main().catch((e) => { console.error('HARNESS ERROR', e); process.exit(1); });
