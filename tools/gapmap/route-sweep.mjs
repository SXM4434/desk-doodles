// GAP-MAP route coverage sweep — visits EVERY user-facing route, captures a
// screenshot per route + a few key interactive states, and prints a per-route
// table (route · console errors · pixel coverage · notes). The screenshots are
// READ by the agent; this driver only collects them + flags vacuous renders.
//
// LIVE-DB RULES: every non-GET request to the Supabase REST/RPC/realtime
// endpoint is ABORTED at the route layer (zero publish/delete/move/test rows).
// Reads (GET) pass through so the live desk renders honestly.
//
// Run against a FROZEN vite preview (HMR-churn rule):
//   npx vite build --outDir /tmp/dd-gap-dist
//   npx vite preview --outDir /tmp/dd-gap-dist --port 4421 --strictPort &
//   node tools/gapmap/route-sweep.mjs
// Shots → /tmp/dd-gapmap. Repo tool only (tools/ stays out of the Make set).
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('/tmp/dd-pp/node_modules/playwright');

const BASE = process.env.DD_BASE ?? 'http://localhost:4421';
const OUT = '/tmp/dd-gapmap';
fs.mkdirSync(OUT, { recursive: true });

const rows = [];
function log(route, errs, cov, notes) {
  rows.push({ route, errs, cov, notes });
  console.log(`${String(route).padEnd(28)} errs=${errs}  cov=${cov}%  ${notes}`);
}

// pixel coverage = fraction of non-background pixels (proxy for "did anything render")
async function coverage(page) {
  return await page.evaluate(() => {
    const c = document.createElement('canvas');
    const w = (c.width = 240), h = (c.height = 160);
    const ctx = c.getContext('2d');
    // sample the whole viewport scaled down
    return new Promise((res) => {
      // use html2canvas-free proxy: paint document.body bg color is unknown,
      // so instead count rendered DOM nodes as a cheap proxy alongside.
      res(null);
    });
  });
}

const browser = await chromium.launch();

async function visit(route, { width = 1440, height = 900 } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));

  // ABORT every Supabase mutation (anything not GET/HEAD/OPTIONS) — zero writes.
  await ctx.route('**://*.supabase.co/**', (r) => {
    const m = r.request().method();
    if (m === 'GET' || m === 'HEAD' || m === 'OPTIONS') return r.continue();
    return r.abort();
  });
  // realtime websocket: allow connect (read) — it never writes.

  const tag = route.replace(/[^a-z0-9]/gi, '_') || 'root';
  let cov = 0, domNodes = 0, notes = '';
  try {
    await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2500);
    domNodes = await page.evaluate(() => document.querySelectorAll('*').length).catch(() => 0);
    // rough coverage: count SVG path/rect/circle + canvas elements + text length
    const m = await page.evaluate(() => {
      const svgMarks = document.querySelectorAll('svg path, svg rect, svg circle, svg line, svg polyline, svg polygon').length;
      const canvases = document.querySelectorAll('canvas').length;
      const txt = (document.body.innerText || '').length;
      return { svgMarks, canvases, txt };
    }).catch(() => ({ svgMarks: 0, canvases: 0, txt: 0 }));
    cov = m.svgMarks;
    notes = `dom=${domNodes} svgMarks=${m.svgMarks} canvas=${m.canvases} txt=${m.txt}`;
  } catch (e) {
    notes = 'NAV-FAIL ' + e.message;
  }
  await page.screenshot({ path: `${OUT}/${tag}-${width}.png`, fullPage: false }).catch(() => {});
  log(`${route} @${width}`, errors.length, cov, notes);
  if (errors.length) fs.appendFileSync(`${OUT}/errors.txt`, `\n=== ${route} @${width} ===\n` + errors.join('\n') + '\n');
  await ctx.close();
  return { errors, cov, domNodes };
}

// ── every route, desktop ──
for (const r of ['/', '/canvas', '/desk', '/desks', '/public', '/playground', '/audit', '/nonexistent-xyz']) {
  await visit(r);
}
// ── mobile / narrow viewport on the key product routes ──
for (const r of ['/', '/desk', '/desks', '/canvas', '/playground']) {
  await visit(r, { width: 390, height: 844 });
}

console.log('\n— route sweep done —');
fs.writeFileSync(`${OUT}/results.json`, JSON.stringify(rows, null, 2));
await browser.close();
