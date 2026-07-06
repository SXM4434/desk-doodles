// Route-health break-hunt harness (isolated server :5251).
// For each of /, /canvas, /desk, /audit:
//  - capture console errors + pageerrors + failed/4xx requests
//  - measure DOM mount (#root children, svg/canvas/button counts)
//  - detect vite error overlay
//  - run DD-DIAG self-check (window.__dd_diag console output on /audit)
//  - screenshot full page
// Emits a JSON report to stdout + writes PNGs to /tmp/dd-route-health/.
import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let chromium;
for (const p of [
  '/tmp/dd-pp/node_modules/playwright',
  '/Users/sebs/Desktop/Projects/portfolio/tools/lab-screenshots/node_modules/playwright',
  '/opt/homebrew/lib/node_modules/playwright',
]) {
  try { ({ chromium } = require(p)); break; } catch { /* next */ }
}
if (!chromium) { console.error('no playwright'); process.exit(2); }

const BASE = 'http://127.0.0.1:5251';
const OUT = '/tmp/dd-route-health';
mkdirSync(OUT, { recursive: true });
const ROUTES = ['/', '/canvas', '/desk', '/audit'];
const slug = (r) => (r === '/' ? 'root' : r.replace(/\//g, '_').replace(/^_/, ''));

const browser = await chromium.launch();
const results = [];

for (const route of ROUTES) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();

  const consoleErrors = [];
  const consoleWarnings = [];
  const ddDiagLogs = [];
  const pageErrors = [];
  const failedRequests = [];
  const badResponses = [];

  page.on('console', (msg) => {
    const t = msg.type();
    let text;
    try { text = msg.text(); } catch { text = '<unreadable>'; }
    if (text.includes('[dd-diag]')) ddDiagLogs.push(text);
    if (t === 'error') consoleErrors.push(text);
    else if (t === 'warning') consoleWarnings.push(text);
  });
  page.on('pageerror', (err) => {
    pageErrors.push(String(err && err.stack ? err.stack : err));
  });
  page.on('requestfailed', (req) => {
    failedRequests.push({ url: req.url(), method: req.method(), failure: req.failure()?.errorText });
  });
  page.on('response', (res) => {
    const s = res.status();
    if (s >= 400) badResponses.push({ url: res.url(), status: s });
  });

  let navError = null;
  try {
    await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 30000 });
  } catch (e) {
    navError = String(e.message || e);
  }
  // settle for late async mounts (3D canvas, router, suspense)
  await page.waitForTimeout(2500);

  // DOM mount snapshot
  const dom = await page.evaluate(() => {
    const root = document.getElementById('root');
    const rootChildren = root ? root.children.length : -1;
    const rootHtmlLen = root ? root.innerHTML.length : -1;
    const bodyText = (document.body.innerText || '').trim();
    // vite error overlay is a custom element <vite-error-overlay>
    const overlayEl = document.querySelector('vite-error-overlay');
    let overlayText = null;
    if (overlayEl) {
      const m = overlayEl.shadowRoot && overlayEl.shadowRoot.querySelector('.message-body');
      overlayText = (m ? m.textContent : overlayEl.textContent || '').trim().slice(0, 600);
    }
    return {
      hasRoot: !!root,
      rootChildren,
      rootHtmlLen,
      svgCount: document.querySelectorAll('svg').length,
      canvasCount: document.querySelectorAll('canvas').length,
      buttonCount: document.querySelectorAll('button').length,
      anchorCount: document.querySelectorAll('a').length,
      bodyTextLen: bodyText.length,
      bodyTextSample: bodyText.slice(0, 160),
      viteOverlay: !!overlayEl,
      viteOverlayText: overlayText,
    };
  });

  const file = `${OUT}/${slug(route)}.png`;
  try {
    await page.screenshot({ path: file, fullPage: false });
  } catch (e) {
    // fall back to non-fullpage already; record
  }

  // blank-mount heuristic: root empty OR no visible text and no visual nodes
  const blankMount =
    !dom.hasRoot ||
    dom.rootChildren <= 0 ||
    dom.rootHtmlLen < 50 ||
    (dom.bodyTextLen < 3 && dom.svgCount === 0 && dom.canvasCount === 0 && dom.buttonCount === 0);

  results.push({
    route,
    screenshot: file,
    navError,
    blankMount,
    dom,
    consoleErrorCount: consoleErrors.length,
    consoleErrors,
    consoleWarningCount: consoleWarnings.length,
    consoleWarnings: consoleWarnings.slice(0, 8),
    pageErrorCount: pageErrors.length,
    pageErrors,
    failedRequestCount: failedRequests.length,
    failedRequests,
    badResponseCount: badResponses.length,
    badResponses,
    ddDiagLogCount: ddDiagLogs.length,
    ddDiagSample: ddDiagLogs.slice(0, 5),
  });

  await ctx.close();
}

await browser.close();
const report = { base: BASE, ts: new Date().toISOString(), results };
writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
