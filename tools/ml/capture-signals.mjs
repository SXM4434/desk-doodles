#!/usr/bin/env node
// tools/ml/capture-signals.mjs — drive the signal-capture harness headless and
// dump the FULL classify-time signal vector per (svgHash, regionPath).
//
// Output: tools/ml/captured-signals.json  (raw capture, pre-join)
//   { capturedAt, shapeCount, rowCount, rows: [ {svgHash, regionPath, shape,
//     subjectId, signals:{...full Signals...}, ruleRole, ... } ] }
//
// This is the "Re-pull from a headless /audit run capturing the FULL classify-
// time signal vector" step. It renders the EXACT /audit inventory through the
// EXACT production providers, and runs the PRODUCTION extractAllSignals +
// hashSvg + ruleEngineProvider verbatim (see signals-capture-harness.tsx).
//
// Usage (preview must be served — driver auto-builds + serves if --serve given):
//   node tools/ml/capture-signals.mjs --serve
//   node tools/ml/capture-signals.mjs --url http://localhost:4471/tools/ml/signals-capture.html
//
// Offline; zero DB. Date use allowed (offline tool, manifest stamp only).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { spawn, spawnSync } from 'node:child_process';

const require = createRequire(import.meta.url);
const { chromium } = require('/Users/sebs/Desktop/Projects/portfolio/tools/lab-screenshots/node_modules/playwright');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.join(__dirname, 'captured-signals.json');
const DIST = '/tmp/dd-ml-sig-dist';
const PORT = 4471;
const URL = `http://localhost:${PORT}/tools/ml/signals-capture.html`;

function parseArgs(argv) {
  const a = { serve: false, url: URL };
  for (let i = 2; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--serve') a.serve = true;
    else if (k === '--url') a.url = argv[++i];
    else if (k === '--out') { /* fixed */ argv[++i]; }
    else { console.error(`Unknown arg: ${k}`); process.exit(2); }
  }
  return a;
}

function buildHarness() {
  console.log('• building harness (isolated vite config)…');
  const r = spawnSync(
    'npx',
    ['vite', 'build', '--config', 'tools/ml/vite.signals.config.ts', '--outDir', DIST],
    { cwd: REPO_ROOT, stdio: 'inherit', env: process.env },
  );
  if (r.status !== 0) { console.error('FATAL: harness build failed.'); process.exit(1); }
}

function servePreview() {
  console.log(`• serving preview on :${PORT}…`);
  const p = spawn(
    'npx',
    ['vite', 'preview', '--config', 'tools/ml/vite.signals.config.ts', '--outDir', DIST, '--port', String(PORT), '--strictPort'],
    { cwd: REPO_ROOT, stdio: 'ignore', env: process.env, detached: false },
  );
  return p;
}

async function waitForServer(url, deadlineMs = 30_000) {
  const deadline = Date.now() + deadlineMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}

async function main() {
  const args = parseArgs(process.argv);
  let preview = null;
  if (args.serve) {
    buildHarness();
    preview = servePreview();
    const up = await waitForServer(args.url, 40_000);
    if (!up) { console.error('FATAL: preview server never came up.'); if (preview) preview.kill(); process.exit(1); }
  }

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1700, height: 2000 } });
    page.on('pageerror', (err) => console.error(`[pageerror] ${err.message}`));
    console.log(`→ ${args.url}`);
    await page.goto(args.url, { waitUntil: 'load', timeout: 60_000 });
    await page.waitForSelector('[data-shape-id]', { timeout: 60_000 });
    await page.waitForFunction(() => window.__ddSignalsReady === true && typeof window.__ddSignals?.capture === 'function', { timeout: 60_000 });
    // Let layout settle for getBBox correctness.
    await page.waitForTimeout(1200);

    const shapeCount = await page.evaluate(() => document.querySelectorAll('[data-shape-id]').length);
    const rows = await page.evaluate(() => window.__ddSignals.capture());
    console.log(`captured ${rows.length} region rows across ${shapeCount} shape cells.`);
    if (shapeCount !== 197) console.warn(`WARNING: expected 197 shapes, found ${shapeCount}.`);

    const out = {
      capturedAt: new Date().toISOString(),
      sourceUrl: args.url,
      shapeCount,
      rowCount: rows.length,
      note:
        'Full classify-time Signals vector per (svgHash, regionPath), captured via the ' +
        'production extractAllSignals + hashSvg + ruleEngineProvider (verbatim). No post-' +
        'classification feature (fillStyle treatment is NOT a Signals member). Join key = ' +
        '(svgHash, regionPath) to golden role labels.',
      rows,
    };
    fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');
    console.log(`✓ wrote ${rows.length} rows → ${path.relative(REPO_ROOT, OUT)}`);
  } finally {
    await browser.close();
    if (preview) { try { preview.kill('SIGTERM'); } catch { /* */ } }
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
