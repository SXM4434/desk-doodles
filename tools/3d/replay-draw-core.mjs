// replay-draw-core — the all-197 "hand-draw every object" harness core.
//
// Sebs's law: the manual-draw OFAT must cover ALL 197 catalog objects, hand-drawn
// through the live tools (not the catalog re-render). Hand-authoring 197 unique
// gestures doesn't scale, so this extracts each object's outline geometry from
// /audit and REPLAYS it as jittered pointer gestures into the live /canvas draw
// surface — real pointer input + hand-wobble = a faithful hand-draw test. Then it
// checks 2D, converts to 3D, checks 3D. Produces screenshots + a mechanical
// verdict row per object; the calling agent vision-reads the contact sheets
// (paired-with-Clean) for the Vision/LLM dataset layer.
//
// Usage:
//   node tools/3d/replay-draw-core.mjs --port 5182 --objects macbook,sketchbook --out /tmp/dd-replay
//   node tools/3d/replay-draw-core.mjs --port 53XX --chunk 0/6 --out /tmp/dd-replay-c0   (all-197 chunk)
//
// LAWS: read-only product src; never publishes to /desk (uses /canvas + /audit);
// deterministic (seeded wobble per object index, no Math.random/Date).

import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

function arg(name, def) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : def;
}
const PORT = arg('port', '5182');
const OUT = arg('out', '/tmp/dd-replay');
const OBJECTS = arg('objects', '');
const CHUNK = arg('chunk', ''); // i/N
const BASE = `http://localhost:${PORT}`;
mkdirSync(OUT, { recursive: true });

let chromium;
for (const p of ['/tmp/dd-pp/node_modules/playwright', '/Users/sebs/Desktop/Projects/portfolio/tools/lab-screenshots/node_modules/playwright']) {
  try { ({ chromium } = require(p)); break; } catch {}
}
if (!chromium) { console.log('NO_PLAYWRIGHT'); process.exit(2); }

// Deterministic per-object PRNG (mulberry32) so wobble is reproducible.
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function strHash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1500, height: 950 }, deviceScaleFactor: 2 });
const errs = [];
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
page.on('pageerror', (e) => errs.push('PAGEERR ' + e.message));

// ── 1. Extract catalog geometry (normalized 0..1 polylines) from /audit ──
try { await page.goto(`${BASE}/audit`, { waitUntil: 'networkidle', timeout: 12000 }); }
catch { console.log('SERVER_DOWN'); await browser.close(); process.exit(3); }
await page.waitForTimeout(1200);

const catalog = await page.evaluate(() => {
  const cells = [...document.querySelectorAll('article[data-shape-id]')];
  const out = [];
  for (const cell of cells) {
    const shape = cell.getAttribute('data-shape-id');
    const subjectId = cell.getAttribute('data-subject-id');
    const svg = cell.querySelector('svg');
    if (!svg) continue;
    const vb = (svg.getAttribute('viewBox') || '').split(/[\s,]+/).map(Number);
    if (vb.length !== 4 || !(vb[2] > 0) || !(vb[3] > 0)) continue;
    const [vx, vy, vw, vh] = vb;
    // ASPECT-PRESERVING normalize: divide BOTH axes by the SAME factor (max side)
    // so a thin/tall object stays thin/tall. (The old per-axis /vw,/vh stretched
    // every non-square object to fill a square → thin pens drew as chunky boxes,
    // which looked like a "snap over-widening" bug but was this harness distorting
    // the aspect before snap ever ran.) content occupies [0,cw]×[0,ch], one == 1.
    const s = Math.max(vw, vh);
    const cw = vw / s, ch = vh / s;
    const els = [...svg.querySelectorAll('path, line, polyline, polygon, rect, circle, ellipse')];
    const polylines = [];
    for (const el of els) {
      let total = 0;
      try { total = el.getTotalLength(); } catch { continue; }
      if (!(total > 0.5)) continue;
      const n = Math.max(8, Math.min(Math.ceil(total / 3) + 1, 240));
      const pl = [];
      let ok = true;
      for (let i = 0; i < n; i++) {
        let pt;
        try { pt = el.getPointAtLength((total * i) / (n - 1)); } catch { ok = false; break; }
        const nx = (pt.x - vx) / s, ny = (pt.y - vy) / s; // aspect-preserved, in [0,cw]×[0,ch]
        if (!Number.isFinite(nx) || !Number.isFinite(ny)) { ok = false; break; }
        pl.push([nx, ny]);
      }
      if (ok && pl.length >= 2) polylines.push(pl);
    }
    if (polylines.length) out.push({ shape, subjectId, cw, ch, polylines });
  }
  return out;
});
console.log(`catalog: ${catalog.length} objects with geometry extracted from /audit`);

// pick the working set
let work = catalog;
if (OBJECTS) {
  const want = new Set(OBJECTS.split(',').map((s) => s.trim()));
  work = catalog.filter((c) => want.has(c.shape));
} else if (CHUNK) {
  const [i, N] = CHUNK.split('/').map(Number);
  work = catalog.filter((_, idx) => idx % N === i);
}
console.log(`working set: ${work.length} objects`);

const MODES = ['auto', 'rod', 'extrude', 'inflate', 'solid'];

/** Closed polylines (first≈last) get a centroid → a Fill tap target, so the FILL
 *  tool is exercised on every enclosed region (Sebs: use the real tools). */
function closedCentroids(polylines) {
  const out = [];
  for (const pl of polylines) {
    if (pl.length < 4) continue;
    const [fx, fy] = pl[0]; const [lx, ly] = pl[pl.length - 1];
    const closed = Math.hypot(fx - lx, fy - ly) < 0.06; // ~6% of box = closed
    if (!closed) continue;
    let cx = 0, cy = 0; for (const [x, y] of pl) { cx += x; cy += y; }
    out.push([cx / pl.length, cy / pl.length]);
  }
  return out;
}

// ── 2. Replay each object as wobbled pointer gestures on /canvas ──
async function drawSurfaceBox() {
  return await page.evaluate(() => {
    const s = [...document.querySelectorAll('main svg')];
    const el = s[s.length - 1];
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
}
async function clickByText(re) {
  const btns = await page.$$('button, [role="tab"], [role="option"]');
  for (const b of btns) { const t = (await b.innerText().catch(() => '')).trim(); if (re.test(t)) { await b.click().catch(() => {}); return t; } }
  return null;
}

const findings = [];
for (const obj of work) {
  await page.goto(`${BASE}/canvas`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  const box = await drawSurfaceBox();
  if (!box) { findings.push({ object: obj.shape, subjectId: obj.subjectId, stage: 'setup', verdict: 'BREAK', note: 'no draw surface' }); continue; }
  // ASPECT-PRESERVING fit: scale the object's content (cw×ch normalized) into the
  // padded draw region with ONE uniform px factor + center it — so a thin/tall
  // object draws thin/tall (no stretch). nx,ny are in [0,cw]×[0,ch].
  const pad = 0.12, span = 1 - 2 * pad;
  const cw = obj.cw ?? 1, ch = obj.ch ?? 1;
  const availW = span * box.w, availH = span * box.h;
  const px = Math.min(availW / cw, availH / ch); // px per normalized unit, uniform
  const drawW = cw * px, drawH = ch * px;
  const ox = box.x + (box.w - drawW) / 2; // center horizontally
  const oy = box.y + (box.h - drawH) / 2; // center vertically
  const rand = rng(strHash(obj.shape));
  const wob = 1.4; // px hand-wobble amplitude in screen space
  const errsBefore = errs.length;
  for (const pl of obj.polylines) {
    const pts = pl.map(([nx, ny]) => ({
      x: ox + nx * px + (rand() - 0.5) * 2 * wob,
      y: oy + ny * px + (rand() - 0.5) * 2 * wob,
    }));
    if (pts.length < 2) continue;
    await page.mouse.move(pts[0].x, pts[0].y);
    await page.mouse.down();
    for (let i = 1; i < pts.length; i++) await page.mouse.move(pts[i].x, pts[i].y, { steps: 2 });
    await page.mouse.up();
    await page.waitForTimeout(20);
  }
  await page.waitForTimeout(250);

  // ── REAL TOOL FLOW (Sebs: exercise every tool, not just ink) ──────────────
  const toolsUsed = ['ink'];
  // SNAP — clean up closed shapes (exercises the snap tool on every object).
  let snapFired = false;
  try {
    const snapBtn = await page.$('button[data-snap-pill="snap"]:not([disabled])');
    if (snapBtn) { await snapBtn.click(); await page.waitForTimeout(350); snapFired = true; toolsUsed.push('snap'); }
  } catch { /* snap unavailable for this object */ }
  // FILL — Shade register → Fill tool → a tone band → tap each enclosed region.
  let fillTaps = 0;
  const cents = closedCentroids(obj.polylines);
  if (cents.length) {
    try {
      // enter Shade register
      const shadeReg = await page.$$('button');
      for (const b of shadeReg) { const t = (await b.innerText().catch(() => '')).trim(); if (/^shade$/i.test(t)) { await b.click(); break; } }
      await page.waitForTimeout(250);
      // pick the Fill tool in the shade cluster
      const fillTool = await page.$('[data-shade-cluster] button[title*="Tap inside" i]')
        || await page.$('[data-shade-cluster] button[title*="Fill" i]');
      if (fillTool) { await fillTool.click(); await page.waitForTimeout(150); toolsUsed.push('fill'); }
      // a mid tone band
      const band = await page.$$('[aria-label="Tone band"] button');
      if (band[4]) { await band[4].click(); await page.waitForTimeout(120); }
      // tap each closed-region centroid (same aspect-preserving transform as the ink)
      for (const [nx, ny] of cents.slice(0, 6)) {
        const x = ox + nx * px;
        const y = oy + ny * px;
        await page.mouse.click(x, y);
        await page.waitForTimeout(180);
        fillTaps++;
      }
      // back to Ink so the next object's gestures draw, not shade
      const inkReg = await page.$$('button');
      for (const b of inkReg) { const t = (await b.innerText().catch(() => '')).trim(); if (/^ink$/i.test(t)) { await b.click(); break; } }
    } catch { /* fill flow unavailable */ }
  }

  await page.waitForTimeout(250);
  await page.locator('main').screenshot({ path: `${OUT}/${obj.shape}-2d.png` });
  // strokes present? Read the "DONE (N)" pill — the authoritative stroke-pool count.
  const strokeCount = await page.evaluate(() => {
    const btns = [...document.querySelectorAll('button')];
    for (const b of btns) { const m = (b.innerText || '').match(/DONE\s*\((\d+)\)/i); if (m) return Number(m[1]); }
    return 0;
  });
  // flip to 3D
  await clickByText(/^3D$/);
  await page.waitForTimeout(1800);
  // OFAT geometry-mode sweep via the DEV __ddSet seam (setGeometryMode) — one 3D
  // capture per mode so the calling agent vision-reads the full per-object matrix.
  const modeResults = {};
  for (const m of MODES) {
    const set = await page.evaluate((mode) => {
      const s = window.__ddSet; if (!s || !s.setGeometryMode) return false; s.setGeometryMode(mode); return true;
    }, m);
    await page.waitForTimeout(1400);
    await page.locator('main').screenshot({ path: `${OUT}/${obj.shape}-3d-${m}.png` });
    const has3d = await page.evaluate(() => !!document.querySelector('main canvas'));
    const gate = await page.evaluate(() => /Nothing to convert/i.test(document.body.innerText || ''));
    modeResults[m] = { set, has3d, gate };
  }
  const allModes3d = MODES.every((m) => modeResults[m].has3d && !modeResults[m].gate);
  const newErrs = errs.slice(errsBefore);
  const verdict = box && strokeCount > 0 && allModes3d && newErrs.length === 0 ? 'PASS'
    : (newErrs.length ? 'BREAK' : 'WEAK');
  // one row per (object × mode) in the ofat-manualdraw schema, plus draw + tool rows.
  const drawnVia = toolsUsed.join('+'); // ink / ink+snap / ink+snap+fill
  findings.push({ object: obj.shape, subjectId: obj.subjectId, cls: null, drawnVia, stage: '2d', mode: 'na', toggle: '(baseline)', level: 'default', verdict: strokeCount > 0 ? 'PASS' : 'BREAK', note: `${strokeCount} strokes / ${obj.polylines.length} polylines · tools=${drawnVia}`, screenshot: `${obj.shape}-2d.png` });
  if (snapFired) findings.push({ object: obj.shape, subjectId: obj.subjectId, cls: null, drawnVia, stage: '2d', mode: 'na', toggle: 'snap', level: 'applied', verdict: 'PASS', note: 'snap tool fired', screenshot: `${obj.shape}-2d.png` });
  if (cents.length) findings.push({ object: obj.shape, subjectId: obj.subjectId, cls: null, drawnVia, stage: '2d', mode: 'na', toggle: 'fill', level: 'applied', verdict: fillTaps > 0 ? 'PASS' : 'WEAK', note: `fill taps=${fillTaps}/${cents.length} closed regions`, screenshot: `${obj.shape}-2d.png` });
  for (const m of MODES) {
    const r = modeResults[m];
    findings.push({ object: obj.shape, subjectId: obj.subjectId, cls: null, drawnVia: 'replay-wobble', stage: 'convert', mode: m, toggle: 'geometryMode', level: m, verdict: r.has3d && !r.gate ? 'PASS' : 'WEAK', note: r.set ? '' : '__ddSet unavailable', screenshot: `${obj.shape}-3d-${m}.png` });
  }
  console.log(`${obj.shape}: strokes=${strokeCount} modes3d=${allModes3d} errs=${newErrs.length} → ${verdict}`);
}

writeFileSync(`${OUT}/replay-findings.json`, JSON.stringify({ port: PORT, count: findings.length, findings }, null, 2));
await browser.close();
const pass = findings.filter((f) => f.verdict === 'PASS').length;
console.log(`\nDONE ${pass}/${findings.length} PASS → ${OUT}/replay-findings.json (+ per-object 2d/3d PNGs)`);
