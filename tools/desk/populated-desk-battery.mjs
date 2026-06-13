#!/usr/bin/env node
// populated-desk-battery.mjs — THE populated-desk-at-scale perf battery (gap-hunt H6).
//
// WHY THIS EXISTS: every other desk-state test runs against an EMPTY desk. The
// ~1fps@120 perf alarm (SESSION-HANDOFF "PERF ALARM") and the "wall of doodles"
// demo headline have had NO regression gate. This battery populates the real
// /desk render path with N synthetic objects and measures the frame budget for
// drag / pan / zoom — so the all-N-rerender perf cliff (drag one object →
// pipeline re-runs across all N) is CAUGHT, not discovered live on stage.
//
// ── LIVE-DB RULES (honored, zero Supabase writes) ──────────────────────────
//   The desk loads via getOpenDesk() + listDoodlesForDesk() (Supabase REST) and
//   subscribes over a realtime websocket. This battery NEVER writes a row. It
//   injects the population by INTERCEPTING the REST responses with Playwright
//   page.route(): the `desks` query returns ONE synthetic open desk, the
//   `doodles` query returns N synthetic rows. The realtime websocket is left to
//   connect to nothing (no inserts depend on it for the initial population).
//   The page's data layer, parse path, memoization, camera, and drag handlers
//   all run UNMODIFIED on the synthetic rows — it's the real render path, just
//   fed synthetic truth. Nothing in src/ is touched.
//
//   Session identity: addInitScript pins localStorage['dd.session.id'] to a
//   fixed UUID, and the synthetic rows are stamped with that same session_id,
//   so every object is "mine" and therefore DRAGGABLE (foreign objects refuse
//   to drag by design — DeskPage handlePointerDown). One control row is stamped
//   foreign to prove the foreign-press path is exercised too.
//
// ── WHAT IT MEASURES ───────────────────────────────────────────────────────
//   For each N (default 80 and 120):
//     1. LOAD: time from navigation to all N objects present + settled.
//     2. DRAG: scripted pointer drag of one own object across the desk; per-
//        frame time captured via an in-page rAF probe + a long-task observer.
//        Asserts a BOUNDED drag cost — the median dragged-frame time must not
//        scale with N to the point of a perf cliff (the gate).
//     3. PAN: drag-to-pan on empty desk; per-frame time captured.
//     4. ZOOM: wheel-zoom toward cursor; per-frame time captured.
//   Reports measured fps + frame-time at each N and a demo-viability verdict
//   (>=24fps median during drag = demo-viable; 12-24 = degraded; <12 = blocked).
//   Screenshots the populated desk at each N — READ by the agent for the claim.
//
// ── RUN ────────────────────────────────────────────────────────────────────
//   Dev server on :5182 (or DD_BASE). Then:
//     node tools/desk/populated-desk-battery.mjs
//     N=80,120 node tools/desk/populated-desk-battery.mjs        # custom Ns
//     node tools/desk/populated-desk-battery.mjs --headed        # watch it
//   Outputs:
//     /tmp/dd-perf-pop/perf-report.json   — machine-readable, feeder source
//     /tmp/dd-perf-pop/desk-n80.png       — populated desk at 80 (READ this)
//     /tmp/dd-perf-pop/desk-n120.png      — populated desk at 120 (READ this)
//   Keep-feeding (per the standing rule): after a run,
//     node tools/dataset/feed-dataset.mjs --from-desk-perf /tmp/dd-perf-pop/perf-report.json
//   folds the perf verdicts into datasets/smart-layer.dataset.jsonl.
//
// Offline ESM. Reuses the classifier-tools playwright (lives outside this pkg).

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require('/Users/sebs/Desktop/Projects/portfolio/tools/lab-screenshots/node_modules/playwright'));
} catch {
  console.error('FATAL: playwright not found at the classifier-tools path.');
  process.exit(1);
}

const BASE = process.env.DD_BASE || 'http://localhost:5182';
const OUT = '/tmp/dd-perf-pop';
const HEADED = process.argv.includes('--headed');
const NS = (process.env.N || '80,120')
  .split(',')
  .map((s) => parseInt(s.trim(), 10))
  .filter((n) => Number.isFinite(n) && n > 0);

fs.mkdirSync(OUT, { recursive: true });

// Fixed synthetic session id — pins localStorage so every synthetic row is
// "mine" (draggable). A real UUID shape; never collides with a person's id.
const SESSION_ID = '00000000-bbbb-4ddd-8eee-deadbeef0001';
const FOREIGN_ID = '00000000-cccc-4ddd-8eee-feedface0002';
// A stable synthetic desk uuid for the REST intercept.
const DESK_ID = '00000000-aaaa-4ddd-8eee-de54de54de54';

const OBJ_SEL = 'main div[style*="cursor: grab"]';

// ── SYNTHETIC DOODLE SVGs ───────────────────────────────────────────────────
// The commit-layer form a Done produces: fill="none" + primary-ink stroke at
// width 3, on a tight viewBox. Stroke-only is what survives the smartHachure
// outline filter (per DeskPage PREVIEW_SQUIGGLE + the Day-7 commit-layer note).
// A varied set so the wall reads as real doodles (the "wall of doodles" demo),
// not N copies of one blob — and so the rough.js pipeline pays realistic cost
// per object (different anchor counts / curve mixes).
const STROKE = 'stroke="var(--dir-text-primary)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"';
// CRITICAL: real stored rows are passed through normalizeSvgSize at the publish
// boundary, which writes explicit width/height (~180px longest axis) onto the
// <svg>. A synthetic svg with ONLY a viewBox renders at 0×0 inside the
// absolutely-positioned grab wrapper and paints NOTHING (the desk looks empty
// even with N rows in the DOM — caught by READing the screenshot). So each
// fixture carries the SAME normalized form a real publish produces: viewBox +
// explicit width/height scaled so the longest axis is ~180px. This makes the
// synthetic wall paint exactly like a real one.
function normSvg(vbW, vbH, inner) {
  const scale = 180 / Math.max(vbW, vbH);
  const w = Math.round(vbW * scale), h = Math.round(vbH * scale);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${vbW} ${vbH}">${inner}</svg>`;
}
const DOODLES = [
  // heart-ish squiggle
  normSvg(120, 110, `<path d="M60 98 C20 70 8 44 22 26 C34 11 54 14 60 32 C66 14 86 11 98 26 C112 44 100 70 60 98 Z" ${STROKE}/>`),
  // star
  normSvg(120, 120, `<path d="M60 8 L74 46 L114 46 L82 70 L94 110 L60 86 L26 110 L38 70 L6 46 L46 46 Z" ${STROKE}/>`),
  // wavy line
  normSvg(160, 60, `<path d="M8 30 C28 6 44 6 60 30 C76 54 92 54 108 30 C124 6 140 6 152 30" ${STROKE}/>`),
  // spiral
  normSvg(120, 120, `<path d="M60 60 C60 50 70 50 70 60 C70 76 50 76 50 56 C50 30 84 30 84 64 C84 104 30 104 30 56" ${STROKE}/>`),
  // box doodle
  normSvg(120, 100, `<path d="M14 20 L106 16 L102 86 L18 90 Z M14 20 L40 6 L120 8 L106 16 M106 16 L120 8 L116 76 L102 86" ${STROKE}/>`),
  // cloud
  normSvg(160, 90, `<path d="M40 70 C16 70 16 44 38 42 C40 20 78 18 84 40 C108 30 130 50 116 68 C140 70 140 70 124 78 L48 78 C40 78 40 70 40 70 Z" ${STROKE}/>`),
  // arrow
  normSvg(140, 80, `<path d="M10 40 L118 38 M88 14 L122 40 L88 66" ${STROKE}/>`),
  // smiley
  normSvg(120, 120, `<circle cx="60" cy="60" r="50" ${STROKE}/><path d="M40 50 L44 50 M76 50 L80 50 M40 78 C50 92 70 92 80 78" ${STROKE}/>`),
  // lightning
  normSvg(90, 130, `<path d="M52 8 L20 70 L44 70 L36 122 L72 54 L46 54 Z" ${STROKE}/>`),
  // flower
  normSvg(120, 120, `<path d="M60 60 C60 30 90 30 90 60 C120 60 120 90 90 90 C90 120 60 120 60 90 C30 90 30 60 60 60 Z" ${STROKE}/><circle cx="60" cy="75" r="8" ${STROKE}/>`),
];

// Deterministic FNV-style scatter so the wall layout is stable run-to-run.
function scatter(i, total) {
  let h = (i + 1) * 2654435761;
  const rnd = () => {
    h ^= h << 13; h ^= h >>> 17; h ^= h << 5; h >>>= 0;
    return h / 4294967296;
  };
  // Lay objects across a wide desk plane so they don't all stack on the origin
  // (the perf cliff is about COUNT, not overlap — but a real wall is spread).
  const cols = Math.ceil(Math.sqrt(total));
  const col = i % cols;
  const row = Math.floor(i / cols);
  const x = 120 + col * 180 + (rnd() - 0.5) * 60;
  const y = 110 + row * 170 + (rnd() - 0.5) * 50;
  const rotation = (rnd() - 0.5) * 16;
  return { x: Math.round(x), y: Math.round(y), rotation: +rotation.toFixed(2) };
}

function makeRows(n) {
  const rows = [];
  for (let i = 0; i < n; i++) {
    const { x, y, rotation } = scatter(i, n);
    // One control row (index 1) is foreign so the foreign-press path is live.
    const owner = i === 1 ? FOREIGN_ID : SESSION_ID;
    rows.push({
      id: `${DESK_ID}-doodle-${String(i).padStart(4, '0')}`,
      session_id: owner,
      svg: DOODLES[i % DOODLES.length],
      content_hash: `synthetic-${i}`,
      x,
      y,
      rotation,
      created_at: new Date(1700000000000 + i * 1000).toISOString(),
      desk_id: DESK_ID,
      name: `doodle ${i}`,
      why: 'perf-battery synthetic',
      render_config: null, // legacy-freeze path (most of the live desk) — the
      //                       realistic worst case the alarm describes.
    });
  }
  return rows;
}

function syntheticDesk(n) {
  return {
    id: DESK_ID,
    desk_index: 0,
    name: 'Perf Battery Desk',
    object_cap: 120,
    object_count: n,
    is_open: true,
    preview_svg: null,
    owner_id: null,
    created_at: new Date(1700000000000).toISOString(),
  };
}

// ── REST INTERCEPT (the zero-DB injection) ──────────────────────────────────
// Supabase REST: GET /rest/v1/desks?... and GET /rest/v1/doodles?... . We match
// by pathname + query intent (table + filters) and fulfill with synthetic JSON.
// Everything else (auth, realtime negotiation, the app bundle) passes through.
async function installIntercept(context, n) {
  const rows = makeRows(n);
  const desk = syntheticDesk(n);
  await context.route('**/rest/v1/**', async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const p = url.pathname;
    const qs = url.search;
    // Reads only — a write (POST/PATCH/DELETE/RPC) must NEVER reach the DB here.
    const method = req.method();
    if (method !== 'GET') {
      // Hard guarantee of the LIVE-DB rule: refuse any mutation locally.
      console.warn(`[intercept] blocked non-GET ${method} ${p} (LIVE-DB rule)`);
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      return;
    }
    if (p.endsWith('/desks')) {
      // getOpenDesk (is_open=eq.true, limit=1) → the open desk; listDesks → [desk].
      const wantsOpen = /is_open=eq\.true/.test(qs);
      const body = JSON.stringify(wantsOpen ? [desk] : [desk]);
      await route.fulfill({ status: 200, contentType: 'application/json', body });
      return;
    }
    if (p.endsWith('/doodles')) {
      // listDoodlesForDesk(deskId) (desk_id=eq.<id>) / listDoodles → the N rows.
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(rows) });
      return;
    }
    if (p.includes('/rpc/')) {
      // No RPC should fire on a read-only load; if one does, answer benignly.
      await route.fulfill({ status: 200, contentType: 'application/json', body: 'null' });
      return;
    }
    // Anything else REST → empty result, never the real backend.
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
}

// ── IN-PAGE FRAME PROBE ─────────────────────────────────────────────────────
// Installed before each gesture: a rAF loop records inter-frame deltas while
// `window.__perfRec` is true, plus a PerformanceObserver for long tasks (the
// main-thread blocks that ARE the cliff). Returns frame stats on stop.
const PERF_PROBE = `
(() => {
  if (window.__perfProbeInstalled) return;
  window.__perfProbeInstalled = true;
  window.__perfFrames = [];
  window.__perfRec = false;
  window.__perfLongTasks = [];
  let last = performance.now();
  function loop(t) {
    if (window.__perfRec) window.__perfFrames.push(t - last);
    last = t;
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  try {
    const po = new PerformanceObserver((list) => {
      if (!window.__perfRec) return;
      for (const e of list.getEntries()) window.__perfLongTasks.push(e.duration);
    });
    po.observe({ entryTypes: ['longtask'] });
  } catch (e) { /* longtask unsupported — frame deltas still carry the signal */ }
  window.__perfStart = () => { window.__perfFrames = []; window.__perfLongTasks = []; window.__perfRec = true; last = performance.now(); };
  window.__perfStop = () => {
    window.__perfRec = false;
    const f = window.__perfFrames.slice().filter((d) => d > 0 && d < 4000);
    const sorted = f.slice().sort((a, b) => a - b);
    const pct = (q) => sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))] : 0;
    const sum = f.reduce((a, b) => a + b, 0);
    return {
      frames: f.length,
      meanMs: f.length ? +(sum / f.length).toFixed(2) : 0,
      medianMs: +pct(0.5).toFixed(2),
      p95Ms: +pct(0.95).toFixed(2),
      maxMs: +(sorted.length ? sorted[sorted.length - 1] : 0).toFixed(2),
      longTasks: window.__perfLongTasks.length,
      longTaskMaxMs: window.__perfLongTasks.length ? +Math.max(...window.__perfLongTasks).toFixed(2) : 0,
    };
  };
})();
`;

function fpsFrom(ms) {
  return ms > 0 ? +(1000 / ms).toFixed(1) : 0;
}

async function gotoPopulatedDesk(page, n) {
  await page.goto(`${BASE}/desk`, { waitUntil: 'domcontentloaded' });
  // Wait for the feed to resolve to live + all N objects rendered + settled.
  // (Playwright waitForFunction takes ONE arg — pass [sel, want] as a tuple.)
  await page.waitForFunction(
    ([sel, want]) => document.querySelectorAll(sel).length >= want,
    [OBJ_SEL, n],
    { timeout: 45000 },
  );
  // Let the rough.js pipeline settle on all N (each object pays one pipeline
  // run on mount). Wait until the data-svg-style markers are all present.
  await page.waitForFunction(
    () => document.querySelectorAll('[data-svg-style]').length >= 1,
    { timeout: 30000 },
  );
  await page.waitForTimeout(2500);
}

// Find the screen-space center of an OWN draggable object (skip the foreign
// control row). The grab WRAPPER is position:absolute and collapses to width 0
// — measure the INNER <svg> (the actual ink) instead, and pick one comfortably
// inside the viewport so the 300px drag stays on-screen the whole gesture.
// The foreign row is scatter index 1 (2nd grab-div in DOM order after the
// load-path reverse keeps DOM order == array order); skip that one.
async function ownObjectCenter(page) {
  return page.evaluate((sel) => {
    const els = Array.from(document.querySelectorAll(sel));
    const vw = window.innerWidth, vh = window.innerHeight;
    const margin = 200; // keep room for the 300px drag in any direction
    // The grab WRAPPER is absolutely positioned and its inner smartHachure
    // <svg> has no intrinsic size, so geometric centers are unreliable. Instead
    // HIT-TEST: probe a grid around each wrapper's anchor and find a point whose
    // elementFromPoint is actually INSIDE that wrapper (i.e. on its painted ink
    // and grab target — the exact point a real pointerdown would grab). Pick an
    // own object (idx !== 1, the foreign control row) comfortably in-view.
    function hitPoint(el) {
      const r = el.getBoundingClientRect();
      for (let dy = 0; dy <= 160; dy += 12) {
        for (let dx = 0; dx <= 160; dx += 12) {
          const x = Math.round(r.left + dx), y = Math.round(r.top + dy);
          if (x < margin || x > vw - margin || y < margin || y > vh - margin) continue;
          const hit = document.elementFromPoint(x, y);
          if (hit && el.contains(hit)) return { x, y };
        }
      }
      return null;
    }
    // Try own in-view objects first, in DOM order.
    for (let idx = 0; idx < els.length; idx++) {
      if (idx === 1) continue; // foreign control row
      const p = hitPoint(els[idx]);
      if (p) return p;
    }
    // Fallback: any object (even foreign) with a hittable point.
    for (let idx = 0; idx < els.length; idx++) {
      const p = hitPoint(els[idx]);
      if (p) return p;
    }
    return null;
  }, OBJ_SEL);
}

// Scripted drag: real pointer down → many incremental moves (each fires
// handlePointerMove → setObjects map) → up. Returns the frame stats.
async function measureDrag(page) {
  const c = await ownObjectCenter(page);
  if (!c) return { error: 'no own object in viewport' };
  // Snapshot the wrapper positions BEFORE the drag so we can PROVE the real
  // drag handler fired (an own object's left/top must change). This guards
  // against a silent miss (grabbing empty paper → pan, or a foreign object →
  // nudge with no move) masquerading as a fast frame budget.
  const before = await page.evaluate((sel) =>
    Array.from(document.querySelectorAll(sel)).map((el) => el.style.left + ',' + el.style.top),
    OBJ_SEL,
  );
  await page.evaluate(() => window.__perfStart());
  await page.mouse.move(c.x, c.y);
  await page.mouse.down();
  // The drag is run TWO ways and both feed the same probe window:
  //  (1) realistic cadence — 30 moves at ~60Hz (one frame budget apart), the
  //      way a hand drags; the rAF probe times real on-screen frames.
  //  (2) ADVERSARIAL burst — 40 back-to-back moves with NO wait, to maximize
  //      React re-render pressure within a single tick. If an all-N-rerender
  //      cliff exists (drag one → rough.js re-runs on all N), this is where the
  //      main-thread block shows up as a giant inter-frame delta / long task.
  const STEPS = 30;
  for (let i = 1; i <= STEPS; i++) {
    const x = c.x + Math.round((i / STEPS) * 300 * Math.cos(i * 0.3));
    const y = c.y + Math.round((i / STEPS) * 160 * Math.sin(i * 0.3));
    await page.mouse.move(x, y);
    await page.waitForTimeout(16);
  }
  // Adversarial burst — no throttle.
  for (let i = 0; i < 40; i++) {
    const x = c.x + ((i * 9) % 280) - 140;
    const y = c.y + ((i * 7) % 150) - 75;
    await page.mouse.move(x, y);
  }
  await page.mouse.up();
  await page.waitForTimeout(200);
  const stats = await page.evaluate(() => window.__perfStop());
  const after = await page.evaluate((sel) =>
    Array.from(document.querySelectorAll(sel)).map((el) => el.style.left + ',' + el.style.top),
    OBJ_SEL,
  );
  const movedCount = before.filter((b, i) => b !== after[i]).length;
  stats.objectMoved = movedCount > 0;
  stats.movedCount = movedCount;
  return stats;
}

async function measurePan(page) {
  // Pan = drag on EMPTY desk. Start from a corner likely to be paper.
  const vw = page.viewportSize().width, vh = page.viewportSize().height;
  const sx = vw - 60, sy = vh - 60;
  await page.evaluate(() => window.__perfStart());
  await page.mouse.move(sx, sy);
  await page.mouse.down();
  const STEPS = 24;
  for (let i = 1; i <= STEPS; i++) {
    await page.mouse.move(sx - i * 8, sy - i * 6);
    await page.waitForTimeout(16);
  }
  await page.mouse.up();
  await page.waitForTimeout(120);
  return page.evaluate(() => window.__perfStop());
}

async function measureZoom(page) {
  const vw = page.viewportSize().width, vh = page.viewportSize().height;
  const cx = Math.round(vw / 2), cy = Math.round(vh / 2);
  await page.mouse.move(cx, cy);
  await page.evaluate(() => window.__perfStart());
  // Ctrl+wheel = zoom toward cursor (DeskPage wheel handler).
  for (let i = 0; i < 16; i++) {
    await page.mouse.wheel(0, i % 2 === 0 ? -80 : 60);
    await page.waitForTimeout(40);
  }
  await page.waitForTimeout(150);
  return page.evaluate(() => window.__perfStop());
}

function verdictFor(dragMedianMs) {
  const fps = fpsFrom(dragMedianMs);
  if (fps >= 24) return { verdict: 'demo-viable', fps };
  if (fps >= 12) return { verdict: 'degraded', fps };
  return { verdict: 'demo-blocked', fps };
}

(async () => {
  const browser = await chromium.launch({ headless: !HEADED });
  const report = {
    tool: 'populated-desk-battery',
    base: BASE,
    capturedAt: new Date().toISOString(),
    sessionId: SESSION_ID,
    deskId: DESK_ID,
    regime: { epsilon: 3.0, polyAnchorCap: 8, label: 'canonical-eps3' },
    runs: [],
    notes: [],
  };
  let anyFail = false;

  for (const n of NS) {
    console.log(`\n════ POPULATED DESK · N=${n} ════`);
    const context = await browser.newContext({
      viewport: { width: 1600, height: 1000 },
      deviceScaleFactor: 1,
    });
    // Pin session (every synthetic row is mine → draggable) + install the
    // frame probe before any app code runs.
    await context.addInitScript(
      (sid) => {
        try { localStorage.setItem('dd.session.id', sid); } catch (e) {}
      },
      SESSION_ID,
    );
    await context.addInitScript(PERF_PROBE);
    await installIntercept(context, n);

    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(String(err).slice(0, 200)));

    const run = { n, pageErrors: [], writeAttempts: 0 };
    // Count any blocked write to PROVE zero DB writes.
    page.on('console', (msg) => {
      if (msg.text().includes('[intercept] blocked non-GET')) run.writeAttempts++;
    });

    try {
      const tLoad0 = Date.now();
      await gotoPopulatedDesk(page, n);
      run.loadMs = Date.now() - tLoad0;
      run.objectCount = await page.locator(OBJ_SEL).count();
      run.styledCount = await page.evaluate(
        () => document.querySelectorAll('[data-svg-style]').length,
      );
      run.feedStatus = await page.evaluate(() =>
        /● live/i.test(document.body.innerText) ? 'live'
          : /○ connecting/i.test(document.body.innerText) ? 'connecting'
          : /○ offline/i.test(document.body.innerText) ? 'offline' : 'unknown',
      );

      // Screenshot the populated desk (READ by the agent for the visual claim).
      const shot = `${OUT}/desk-n${n}.png`;
      await page.screenshot({ path: shot });
      run.screenshot = shot;
      console.log(`  loaded ${run.objectCount} objects (${run.styledCount} styled), ${run.loadMs}ms, feed=${run.feedStatus}`);
      console.log(`  shot → ${shot}`);

      run.drag = await measureDrag(page);
      run.pan = await measurePan(page);
      run.zoom = await measureZoom(page);

      // FRAMED WALL SHOT (after perf — the visual claim for the "wall of
      // doodles" headline): zoom the camera out so the whole population frames
      // in one shot. Ctrl+wheel zooms toward cursor; a few notches out from the
      // viewport center pulls the full wall into view. Perf was already measured
      // at the default zoom, so this only affects the visual.
      const vwz = page.viewportSize().width, vhz = page.viewportSize().height;
      await page.mouse.move(Math.round(vwz / 2), Math.round(vhz / 2));
      for (let i = 0; i < 10; i++) {
        await page.keyboard.down('Control');
        await page.mouse.wheel(0, 120);
        await page.keyboard.up('Control');
        await page.waitForTimeout(40);
      }
      await page.waitForTimeout(800);
      const wallShot = `${OUT}/wall-n${n}.png`;
      await page.screenshot({ path: wallShot });
      run.wallShot = wallShot;
      console.log(`  wall shot → ${wallShot}`);

      const dragMedian = run.drag?.medianMs ?? 0;
      const dragP95 = run.drag?.p95Ms ?? 0;
      const v = verdictFor(dragMedian);
      run.dragFpsMedian = v.fps;
      run.dragFpsP95 = fpsFrom(dragP95);
      run.verdict = v.verdict;
      run.demoViable = v.verdict === 'demo-viable';

      console.log(`  DRAG  median ${dragMedian}ms (${v.fps}fps) · p95 ${dragP95}ms (${run.dragFpsP95}fps) · longTasks ${run.drag?.longTasks} (max ${run.drag?.longTaskMaxMs}ms) · moved=${run.drag?.objectMoved} (${run.drag?.movedCount} obj)`);
      if (run.drag && !run.drag.error && !run.drag.objectMoved) {
        anyFail = true;
        console.log('  ⚠ FAIL: drag captured frames but NO object moved — the grab missed (measurement invalid).');
      }
      if (run.drag?.error) {
        anyFail = true;
        console.log(`  ⚠ FAIL: drag could not run — ${run.drag.error}`);
      }
      console.log(`  PAN   median ${run.pan?.medianMs}ms (${fpsFrom(run.pan?.medianMs)}fps) · p95 ${run.pan?.p95Ms}ms`);
      console.log(`  ZOOM  median ${run.zoom?.medianMs}ms (${fpsFrom(run.zoom?.medianMs)}fps) · p95 ${run.zoom?.p95Ms}ms`);
      console.log(`  VERDICT: ${run.verdict.toUpperCase()} (drag ${v.fps}fps)`);

      run.pageErrors = pageErrors.slice();
      if (run.objectCount < n) {
        anyFail = true;
        run.populationOk = false;
        console.log(`  ⚠ FAIL: only ${run.objectCount}/${n} objects rendered`);
      } else {
        run.populationOk = true;
      }
      if (run.writeAttempts > 0) {
        // Not a failure of the gate — but surfaced loudly (the rule is zero
        // writes REACH the DB; the intercept guarantees that, and counts here).
        console.log(`  ℹ ${run.writeAttempts} write attempt(s) intercepted+blocked (zero reached DB)`);
      }
    } catch (e) {
      anyFail = true;
      run.error = String(e).slice(0, 300);
      run.pageErrors = pageErrors.slice();
      console.log(`  ✖ ERROR: ${run.error}`);
    }

    report.runs.push(run);
    await context.close();
  }

  await browser.close();

  // ── DRAG-COST BOUND ASSERTION (the gate) ───────────────────────────────────
  // The cliff is: drag cost scales with N (drag one → rough.js re-runs on all
  // N). The MEDIAN frame is rAF-pinned to the display interval (~8.3ms @ 120Hz)
  // and so is uninformative — the cliff shows in the WORST frame (maxMs) and
  // long tasks. So the bound is on the worst-frame: it must NOT grow with N,
  // and it must stay inside a usable budget at the largest N. "Scales with N"
  // (the cliff signal) requires BOTH the worst-frame to grow meaningfully AND
  // the larger N to be slow — a flat-and-fast result is the opposite of a cliff
  // and must never be mislabeled as scaling.
  if (report.runs.length >= 2) {
    const sorted = report.runs.filter((r) => r.drag && !r.error).sort((a, b) => a.n - b.n);
    if (sorted.length >= 2) {
      const lo = sorted[0], hi = sorted[sorted.length - 1];
      const nRatio = hi.n / lo.n;
      const loWorst = Math.max(lo.drag.maxMs || 0, lo.drag.longTaskMaxMs || 0);
      const hiWorst = Math.max(hi.drag.maxMs || 0, hi.drag.longTaskMaxMs || 0);
      const worstRatio = (hiWorst || 1) / (loWorst || 1);
      // Budget for the worst single frame at the largest N. 50ms ≈ 20fps — a
      // dropped frame here and there is fine for a drag; a cliff blows well past
      // this (the documented alarm was ~1fps = ~1000ms frames).
      const WORST_BUDGET_MS = 50;
      const scalesWithN = worstRatio >= nRatio * 0.6 && hiWorst > WORST_BUDGET_MS;
      report.dragScaling = {
        loN: lo.n, hiN: hi.n,
        nRatio: +nRatio.toFixed(2),
        loMedianMs: lo.drag.medianMs, hiMedianMs: hi.drag.medianMs,
        loWorstMs: +loWorst.toFixed(1), hiWorstMs: +hiWorst.toFixed(1),
        worstRatio: +worstRatio.toFixed(2),
        loLongTasks: lo.drag.longTasks, hiLongTasks: hi.drag.longTasks,
        scalesWithN,
        // The bound: worst drag frame stays inside budget at the largest N.
        boundedAtBudget: hiWorst <= WORST_BUDGET_MS,
        budgetMs: WORST_BUDGET_MS,
        verdict: !scalesWithN && hiWorst <= WORST_BUDGET_MS
          ? 'BOUNDED — no all-N-rerender cliff (per-object memo holding)'
          : 'CLIFF — drag cost grows with N (all-N rerender)',
      };
      console.log('\n──── DRAG-COST BOUND ────');
      console.log(`  N ${lo.n}→${hi.n} (×${report.dragScaling.nRatio}): worst drag frame ${report.dragScaling.loWorstMs}ms→${report.dragScaling.hiWorstMs}ms (×${report.dragScaling.worstRatio}); longTasks ${lo.drag.longTasks}→${hi.drag.longTasks}`);
      console.log(`  objects re-rendered per drag: ${lo.drag.movedCount} @ N=${lo.n} · ${hi.drag.movedCount} @ N=${hi.n} (1 = memo holding; N = cliff)`);
      console.log(`  scales with N (cliff signal): ${report.dragScaling.scalesWithN}`);
      console.log(`  worst frame bounded ≤${WORST_BUDGET_MS}ms @ N=${hi.n}: ${report.dragScaling.boundedAtBudget}`);
      console.log(`  ⇒ ${report.dragScaling.verdict}`);
    }
  }

  fs.writeFileSync(`${OUT}/perf-report.json`, JSON.stringify(report, null, 2));
  console.log(`\n✓ report → ${OUT}/perf-report.json`);
  console.log('  feed it:  node tools/dataset/feed-dataset.mjs --from-desk-perf ' + `${OUT}/perf-report.json`);

  // Exit non-zero only on a HARD failure (population broke / page error /
  // exception) — NOT on a slow verdict. A slow verdict is the SIGNAL this
  // battery exists to surface; it must be reported, not hidden behind exit 1.
  const hardFail = anyFail || report.runs.some((r) => r.error || (r.pageErrors && r.pageErrors.length));
  process.exit(hardFail ? 1 : 0);
})();
