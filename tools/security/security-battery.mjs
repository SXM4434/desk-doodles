// ─── SVG sanitization security battery — playwright driver ──────────────────
// Builds the isolated harness, serves it via `vite preview` (no HMR churn), drives
// it in real Chromium, reads window.__dd_secResults, screenshots the report, and
// emits the per-item table. Exits 1 on ANY failure (a surviving payload = finding).
//
//   node tools/security/security-battery.mjs
//
// Flags / env:
//   DD_SEC_PORT     preview port (default 4471 — unique, off the dev-server map)
//   DD_SEC_OUTDIR   isolated dist dir (default /tmp/dd-sec-dist)
//   DD_SEC_SHOTS    screenshot dir   (default /tmp/dd-sec)
//   DD_SEC_KEEP=1   keep the preview server up after the run (debug)
//
// Repo-side tool only — tools/ never ships in the Make drag-drop.

import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

// Playwright isn't a desk-doodles dep (it'd bloat the Make-importable surface).
// Reuse the portfolio lab-screenshots install — same pattern as tools/3d/*.mjs.
// Override with DD_PLAYWRIGHT if the shared install ever moves.
const require = createRequire(import.meta.url);
const { chromium } = require(
  process.env.DD_PLAYWRIGHT ||
    '/Users/sebs/Desktop/Projects/portfolio/tools/lab-screenshots/node_modules/playwright',
);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '../..');
const CONFIG = path.join(__dirname, 'vite.security.config.ts');

const PORT = Number(process.env.DD_SEC_PORT || 4471);
const OUTDIR = process.env.DD_SEC_OUTDIR || '/tmp/dd-sec-dist';
const SHOTS = process.env.DD_SEC_SHOTS || '/tmp/dd-sec';
const KEEP = process.env.DD_SEC_KEEP === '1';

mkdirSync(SHOTS, { recursive: true });

function sh(cmd, args, opts = {}) {
  return spawnSync(cmd, args, { cwd: REPO, stdio: 'inherit', ...opts });
}

async function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      // Any HTTP response (incl. 404 for '/') means the server is listening.
      // The real page lives at a nested path, so don't gate on res.ok.
      await fetch(url);
      return true;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`preview server never came up at ${url}`);
}

// ── 1. Isolated build (own outDir, no HMR) ──────────────────────────────────
console.log(`\n[build] vite build → ${OUTDIR}`);
const build = sh('npx', ['vite', 'build', '--config', CONFIG], {
  env: { ...process.env, DD_SEC_OUTDIR: OUTDIR },
});
if (build.status !== 0) {
  console.error('[build] FAILED — aborting');
  process.exit(1);
}

// ── 2. vite preview on a unique port ────────────────────────────────────────
console.log(`[preview] vite preview :${PORT}`);
const preview = spawn(
  'npx',
  ['vite', 'preview', '--config', CONFIG, '--port', String(PORT), '--strictPort'],
  { cwd: REPO, stdio: 'inherit', env: { ...process.env, DD_SEC_OUTDIR: OUTDIR } },
);

let exitCode = 1;
const cleanup = () => {
  if (!KEEP) {
    try { preview.kill('SIGTERM'); } catch { /* noop */ }
  }
};
process.on('exit', cleanup);

try {
  const base = `http://localhost:${PORT}`;
  // The harness is built from repo root, so the served path mirrors the html location.
  const pageUrl = `${base}/tools/security/security-battery.html`;
  await waitForServer(base + '/', 30000);

  // ── 3. Drive in real Chromium ────────────────────────────────────────────
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 1400 } });

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  const pageErrors = [];
  page.on('pageerror', (err) => pageErrors.push(err.message));
  // Block all outbound network so XXE/style-beacon/external-use vectors can't
  // actually exfiltrate during the run (and to surface attempts as blocked).
  const blockedRequests = [];
  await page.route('**/*', (route) => {
    const url = route.request().url();
    if (url.startsWith('http://localhost') || url.startsWith(`http://127.0.0.1`)) {
      return route.continue();
    }
    blockedRequests.push(url);
    return route.abort();
  });

  await page.goto(pageUrl, { waitUntil: 'load' });

  // Wait for the battery to finish (window.__dd_secDone).
  await page.waitForFunction(() => window.__dd_secDone === true, { timeout: 60000 });

  const results = await page.evaluate(() => window.__dd_secResults || []);

  // Full-report screenshot.
  await page.screenshot({ path: path.join(SHOTS, 'report.png'), fullPage: true });

  // Per-row screenshots for the failures (and a couple representative passes) so
  // the table claims are visually backed.
  for (const r of results) {
    const row = page.locator(`tr[data-id="${r.id}"]`);
    if ((await row.count()) > 0) {
      try {
        await row.screenshot({ path: path.join(SHOTS, `row-${r.id}.png`) });
      } catch { /* row may be offscreen edge case */ }
    }
  }

  await browser.close();

  // ── 4. Per-item table to stdout ──────────────────────────────────────────
  const pad = (s, n) => String(s).padEnd(n).slice(0, n);
  console.log('\n' + '='.repeat(120));
  console.log('SVG SANITIZATION SECURITY BATTERY — per-item results');
  console.log('='.repeat(120));
  console.log(
    pad('id', 24) + pad('expected', 22) + pad('exec', 7) + pad('fileGate', 11) + pad('result', 56),
  );
  console.log('-'.repeat(120));
  let fails = 0;
  for (const r of results) {
    if (!r.pass) fails++;
    console.log(
      pad(r.id, 24) +
        pad(r.expected, 22) +
        pad(r.executed ? 'FIRED' : 'no', 7) +
        pad(r.fileGate || 'n/a', 11) +
        pad((r.pass ? 'PASS' : 'FAIL') + ' — ' + r.reason, 56),
    );
  }
  console.log('-'.repeat(120));
  const passCount = results.length - fails;
  console.log(`TOTAL: ${results.length}  PASS: ${passCount}  FAIL: ${fails}`);
  if (blockedRequests.length) {
    console.log(`\n[net] ${blockedRequests.length} outbound request(s) BLOCKED (attempted beacons/XXE):`);
    [...new Set(blockedRequests)].forEach((u) => console.log('   blocked → ' + u));
  } else {
    console.log('\n[net] zero outbound requests attempted — no beacon/XXE fetch reached the network');
  }
  if (pageErrors.length) console.log('\n[pageerror] ' + pageErrors.join(' | '));
  console.log('='.repeat(120));

  // Machine-readable artifact for the report consumer.
  writeFileSync(
    path.join(SHOTS, 'results.json'),
    JSON.stringify(
      { results, blockedRequests: [...new Set(blockedRequests)], pageErrors, consoleErrors },
      null,
      2,
    ),
  );
  console.log(`\nscreenshots + results.json → ${SHOTS}`);

  exitCode = fails === 0 ? 0 : 1;
} catch (err) {
  console.error('[driver] error:', err);
  exitCode = 1;
} finally {
  cleanup();
}

// Best-effort: leave the isolated dist around for inspection unless it's /tmp churn.
if (!KEEP && OUTDIR.startsWith('/tmp/')) {
  try { rmSync(OUTDIR, { recursive: true, force: true }); } catch { /* noop */ }
}

process.exit(exitCode);
