// bigdaddy-lib.mjs — live-app driver helpers for the BIG-DADDY OFAT harness.
//
// All helpers drive the REAL /canvas chrome on the running dev server (read-only
// product src; never publishes to /desk). Distilled from the proven drivers:
//   /tmp/ofat-2d/driver-lib.mjs · /tmp/ofat-3d/driver.mjs · tools/3d/replay-draw-core.mjs
//
// Contact sheets are composited IN-BROWSER (a canvas grid) because this box has
// no ImageMagick/sharp — and because one image per object-source keeps a later
// vision-read agent from holding hundreds of PNGs (a prior run crashed at 32MB).

import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

export let chromium;
for (const p of ['/tmp/dd-pp/node_modules/playwright',
  '/Users/sebs/Desktop/Projects/portfolio/tools/lab-screenshots/node_modules/playwright']) {
  try { ({ chromium } = require(p)); break; } catch { /* next */ }
}

export const BASE_FOR = (port) => `http://localhost:${port}`;

// ── catalog: pull every object's aspect-preserving polylines from /audit ──────
export async function loadCatalog(page, base) {
  await page.goto(`${base}/audit`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1200);
  return await page.evaluate(() => {
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
      const s = Math.max(vw, vh);
      const cw = vw / s, ch = vh / s; // aspect-preserved, one axis == 1
      const els = [...svg.querySelectorAll('path, line, polyline, polygon, rect, circle, ellipse')];
      const polylines = [];
      for (const el of els) {
        let total = 0; try { total = el.getTotalLength(); } catch { continue; }
        if (!(total > 0.5)) continue;
        const n = Math.max(8, Math.min(Math.ceil(total / 3) + 1, 240));
        const pl = []; let ok = true;
        for (let i = 0; i < n; i++) {
          let pt; try { pt = el.getPointAtLength((total * i) / (n - 1)); } catch { ok = false; break; }
          const nx = (pt.x - vx) / s, ny = (pt.y - vy) / s;
          if (!Number.isFinite(nx) || !Number.isFinite(ny)) { ok = false; break; }
          pl.push([nx, ny]);
        }
        if (ok && pl.length >= 2) polylines.push(pl);
      }
      // also serialize a standalone SVG so we can self-upload it (svg-upload source)
      const clone = svg.cloneNode(true);
      if (!clone.getAttribute('xmlns')) clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      if (polylines.length) out.push({ shape, subjectId, cw, ch, polylines, markup: clone.outerHTML });
    }
    return out;
  });
}

// deterministic per-object PRNG (mulberry32) — reproducible hand-wobble.
export function rng(seed) {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export function strHash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

export async function drawSurfaceBox(page) {
  return await page.evaluate(() => {
    const s = [...document.querySelectorAll('main svg')];
    const el = s[s.length - 1]; if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
}

// ── MANUAL DRAW: replay an object's polylines as wobbled pointer gestures ──────
// Then exercise the real tools (snap on closed shapes, fill on enclosed regions).
export async function manualDraw(page, obj) {
  const box = await drawSurfaceBox(page);
  if (!box) return { ok: false, strokes: 0, tools: [], reason: 'no-surface' };
  const pad = 0.12, span = 1 - 2 * pad;
  const cw = obj.cw ?? 1, ch = obj.ch ?? 1;
  const px = Math.min((span * box.w) / cw, (span * box.h) / ch);
  const drawW = cw * px, drawH = ch * px;
  const ox = box.x + (box.w - drawW) / 2, oy = box.y + (box.h - drawH) / 2;
  const rand = rng(strHash(obj.shape)); const wob = 1.4;
  for (const pl of obj.polylines) {
    const pts = pl.map(([nx, ny]) => ({ x: ox + nx * px + (rand() - 0.5) * 2 * wob, y: oy + ny * px + (rand() - 0.5) * 2 * wob }));
    if (pts.length < 2) continue;
    await page.mouse.move(pts[0].x, pts[0].y); await page.mouse.down();
    for (let i = 1; i < pts.length; i++) await page.mouse.move(pts[i].x, pts[i].y, { steps: 2 });
    await page.mouse.up(); await page.waitForTimeout(15);
  }
  await page.waitForTimeout(200);
  const tools = ['ink'];
  // SNAP
  try {
    const snapBtn = await page.$('button[data-snap-pill="snap"]:not([disabled])');
    if (snapBtn) { await snapBtn.click(); await page.waitForTimeout(300); tools.push('snap'); }
  } catch { /* no snap */ }
  // FILL on enclosed regions
  const cents = closedCentroids(obj.polylines);
  if (cents.length) {
    try {
      for (const b of await page.$$('button')) { const t = (await b.innerText().catch(() => '')).trim(); if (/^shade$/i.test(t)) { await b.click(); break; } }
      await page.waitForTimeout(220);
      const fillTool = await page.$('[data-shade-cluster] button[title*="Tap inside" i]') || await page.$('[data-shade-cluster] button[title*="Fill" i]');
      if (fillTool) { await fillTool.click(); await page.waitForTimeout(140); tools.push('fill'); }
      const band = await page.$$('[aria-label="Tone band"] button');
      if (band[4]) { await band[4].click(); await page.waitForTimeout(110); }
      for (const [nx, ny] of cents.slice(0, 6)) { await page.mouse.click(ox + nx * px, oy + ny * px); await page.waitForTimeout(160); }
      for (const b of await page.$$('button')) { const t = (await b.innerText().catch(() => '')).trim(); if (/^ink$/i.test(t)) { await b.click(); break; } }
    } catch { /* fill flow unavailable */ }
  }
  await page.waitForTimeout(150);
  const strokes = await strokeCount(page);
  return { ok: strokes > 0, strokes, tools, regions: cents.length };
}
function closedCentroids(polylines) {
  const out = [];
  for (const pl of polylines) {
    if (pl.length < 4) continue;
    const [fx, fy] = pl[0]; const [lx, ly] = pl[pl.length - 1];
    if (Math.hypot(fx - lx, fy - ly) >= 0.06) continue;
    let cx = 0, cy = 0; for (const [x, y] of pl) { cx += x; cy += y; }
    out.push([cx / pl.length, cy / pl.length]);
  }
  return out;
}

export async function strokeCount(page) {
  return await page.evaluate(() => {
    for (const b of [...document.querySelectorAll('button')]) { const m = (b.innerText || '').match(/DONE\s*\((\d+)\)/i); if (m) return Number(m[1]); }
    return 0;
  });
}
// click the real "DONE (N)" pill to COMMIT strokes through SvgStyleTransform
// (CRITICAL: toggles only apply to committed strokes).
export async function commitDone(page) {
  const did = await page.evaluate(() => { for (const b of [...document.querySelectorAll('button')]) if (/DONE\s*\(/i.test(b.innerText)) { b.click(); return true; } return false; });
  await page.waitForTimeout(600); return did;
}

export async function uploadSvgFile(page, filePath) {
  await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /^Upload SVG$/i.test(x.innerText.trim())); if (b) b.click(); });
  await page.waitForTimeout(400);
  const fileInput = await page.$('input[type="file"]');
  if (!fileInput) return false;
  await fileInput.setInputFiles(filePath);
  await page.waitForTimeout(1400);
  return true;
}

// expand a collapsed cluster so its controls mount.
// CRITICAL: skip aria-haspopup buttons — dropdown listbox TRIGGERS also carry
// aria-expanded=false, so a naive match clicks them OPEN (leaving a stuck-open
// listbox that breaks the next setDropdown). Only section collapsers (no haspopup)
// are real expanders.
export async function expandSection(page, headerText) {
  if (!headerText) return;
  await page.evaluate((h) => {
    for (const b of [...document.querySelectorAll('button[aria-expanded]')]) {
      if (b.getAttribute('aria-haspopup')) continue; // dropdown trigger, not a section
      if (b.innerText.toUpperCase().includes(h.toUpperCase())) { if (b.getAttribute('aria-expanded') === 'false') b.click(); return; }
    }
  }, headerText);
  await page.waitForTimeout(140);
}
export async function expandAll(page) {
  await page.evaluate(() => {
    for (const b of [...document.querySelectorAll('button[aria-expanded]')]) {
      if (b.getAttribute('aria-haspopup')) continue; // never click dropdown triggers
      if (b.getAttribute('aria-expanded') === 'false') b.click();
    }
  });
  await page.waitForTimeout(200);
}

// ── dropdown driver (match by label span; click option by exact text) ─────────
export async function setDropdown(page, labelText, optionText) {
  const ok = await page.evaluate((lbl) => {
    for (const sp of [...document.querySelectorAll('span')]) {
      if (sp.textContent.trim().toUpperCase() === lbl.toUpperCase()) {
        const root = sp.parentElement; const btn = root && root.querySelector('button[aria-haspopup="listbox"]');
        if (btn) { btn.click(); return true; }
      }
    } return false;
  }, labelText);
  if (!ok) return { ok: false, reason: 'label-not-found' };
  await page.waitForTimeout(130);
  const clicked = await page.evaluate((opt) => {
    const box = document.querySelector('[role="listbox"]'); if (!box) return false;
    const opts = [...box.querySelectorAll('button[role="option"]')];
    for (const o of opts) { const sp = o.querySelector('span > span'); const txt = (sp ? sp.textContent : o.textContent).trim(); if (txt === opt) { o.click(); return true; } }
    for (const o of opts) if (o.textContent.includes(opt)) { o.click(); return true; }
    return false;
  }, optionText);
  await page.waitForTimeout(240);
  return { ok: clicked, reason: clicked ? '' : 'option-not-found' };
}
export async function readDropdown(page, labelText) {
  return await page.evaluate((lbl) => {
    for (const sp of [...document.querySelectorAll('span')]) {
      if (sp.textContent.trim().toUpperCase() === lbl.toUpperCase()) {
        const root = sp.parentElement; const btn = root && root.querySelector('button[aria-haspopup="listbox"]');
        if (btn) return btn.innerText.trim().split('\n')[0];
      }
    } return null;
  }, labelText);
}

// ── slider driver (match input by its OWN label span; the naive global match
// hit min0/max2 ranges, so this scopes to the wrapper's first span). ──────────
export async function setSlider(page, labelText, value) {
  return await page.evaluate(({ lbl, val }) => {
    const want = lbl.trim().toLowerCase();
    for (const r of [...document.querySelectorAll('input[type="range"]')]) {
      const wrap = r.parentElement; if (!wrap) continue;
      const labelSpan = wrap.querySelector('span'); const txt = labelSpan ? labelSpan.textContent.trim().toLowerCase() : '';
      if (txt === want || txt.startsWith(want)) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(r, String(val)); r.dispatchEvent(new Event('input', { bubbles: true })); r.dispatchEvent(new Event('change', { bubbles: true }));
        return { ok: true, min: r.min, max: r.max, now: r.value };
      }
    } return { ok: false };
  }, { lbl: labelText, val: value });
}

// ── 3D seam drivers ───────────────────────────────────────────────────────────
export async function to3D(page) {
  await page.evaluate(() => { for (const x of [...document.querySelectorAll('button, [role="tab"]')]) if (x.innerText.trim() === '3D') { x.click(); return; } });
  await page.waitForTimeout(2000);
}
export async function setGeoMode(page, mode) {
  await page.evaluate((m) => { const s = window.__ddSet; if (s && s.setGeometryMode) s.setGeometryMode(m); }, mode);
  await page.waitForTimeout(1500);
}
export async function setStyle3d(page, label) {
  // dropdown by label is reliable; fall back to __ddSet.setStyle3d(slug)
  const r = await setDropdown(page, '3D style', label);
  if (!r.ok) { const slug = { Native: 'native', Hatch: 'hatch', 'SVG-port': 'svg-port' }[label] || label; await page.evaluate((v) => { const s = window.__ddSet; if (s && s.setStyle3d) s.setStyle3d(v); }, slug); }
  await page.waitForTimeout(1500);
}
export async function has3dCanvas(page) { return await page.evaluate(() => !!document.querySelector('main canvas')); }
export async function gateBlocked(page) { return await page.evaluate(() => /Nothing to convert/i.test(document.body.innerText || '')); }

// cheap mechanical "did anything change vs Clean" hint.
// For 3D (a <main canvas> present): an in-browser drawImage readback returns a
// BLANK identical buffer every mode (WebGL preserveDrawingBuffer=false clears it
// off-frame) — so we DON'T trust it; ofat3d uses canvasShotSig() (Playwright
// screenshot bytes, which DO differ per mode) instead. For 2D it hashes the
// richest render SVG (path geometry changes with every toggle).
export async function mainSig(page) {
  return await page.evaluate(async () => {
    const main = document.querySelector('main'); if (!main) return null;
    const c = document.querySelector('main canvas');
    if (c) {
      // unreliable readback — return a marker so callers know to use canvasShotSig.
      return { kind: 'canvas-unreliable', hash: null };
    }
    // SVG fallback: the /canvas draw surface is SVG-based (multiple SVGs in <main>;
    // the RENDER one is the SVG with the MOST path/shape children — the trailing
    // overlay SVGs are empty/0-path, so picking the last one missed every change).
    // Hash THAT svg's markup; SVG-style + slider toggles alter its path geometry.
    const svgs = [...main.querySelectorAll('svg')];
    if (!svgs.length) return { kind: 'none' };
    let svg = svgs[0], best = -1;
    for (const sv of svgs) { const n = sv.querySelectorAll('path, line, polyline, polygon, rect, circle, ellipse').length; if (n > best) { best = n; svg = sv; } }
    const s = svg.outerHTML; let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return { kind: 'svg', hash: (h >>> 0).toString(16), len: s.length, marks: best };
  });
}

export async function screenshotMain(page, path) {
  try { await page.locator('main').screenshot({ path }); return true; } catch { return false; }
}

// reliable 3D change-hint: Playwright composites the WebGL canvas at the right
// frame, so the PNG byte length differs per geometry/style/material (verified:
// rod/extrude/inflate/solid all yield distinct byte counts). Coarse but honest;
// the real label still comes from the vision pass.
export async function canvasShotSig(page) {
  try {
    const buf = await page.locator('main canvas').screenshot();
    let h = 2166136261; const step = Math.max(1, Math.floor(buf.length / 4096));
    for (let i = 0; i < buf.length; i += step) { h ^= buf[i]; h = Math.imul(h, 16777619); }
    return { kind: 'canvas-shot', hash: (h >>> 0).toString(16), bytes: buf.length };
  } catch { return { kind: 'canvas-shot', hash: null, bytes: 0 }; }
}

// ── CONTACT SHEET: composite labeled panels into ONE image, in-browser ────────
// panels: [{ file, label }]. Loads each PNG as a data URL, draws a labeled grid
// on a canvas, returns a PNG buffer. Vision-safe: one image per object-source.
export async function buildContactSheet(page, panels, outPath, { title = '', cols = 0, cellW = 360, cellH = 270 } = {}) {
  const imgs = [];
  for (const p of panels) {
    try { const b = readFileSync(p.file); imgs.push({ label: p.label, dataUrl: 'data:image/png;base64,' + b.toString('base64') }); }
    catch { imgs.push({ label: p.label + ' (missing)', dataUrl: null }); }
  }
  const png = await page.evaluate(async ({ imgs, title, cols, cellW, cellH }) => {
    const n = imgs.length;
    const C = cols || Math.ceil(Math.sqrt(n));
    const R = Math.ceil(n / C);
    const pad = 10, labelH = 22, titleH = title ? 30 : 0;
    const W = C * (cellW + pad) + pad;
    const H = titleH + R * (cellH + labelH + pad) + pad;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#f4f1ec'; ctx.fillRect(0, 0, W, H);
    if (title) { ctx.fillStyle = '#1a1a1a'; ctx.font = 'bold 18px sans-serif'; ctx.textBaseline = 'top'; ctx.fillText(title, pad, 6); }
    const load = (src) => new Promise((res) => { if (!src) return res(null); const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; });
    for (let i = 0; i < n; i++) {
      const r = Math.floor(i / C), c = i % C;
      const x = pad + c * (cellW + pad), y = titleH + pad + r * (cellH + labelH + pad);
      // label
      ctx.fillStyle = '#222'; ctx.font = '12px sans-serif'; ctx.textBaseline = 'top';
      ctx.fillText(imgs[i].label.slice(0, 60), x + 2, y);
      // image cell (contain-fit)
      const im = await load(imgs[i].dataUrl);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(x, y + labelH, cellW, cellH);
      ctx.strokeStyle = '#d8d2c8'; ctx.strokeRect(x + 0.5, y + labelH + 0.5, cellW, cellH);
      if (im) {
        const s = Math.min(cellW / im.width, cellH / im.height);
        const dw = im.width * s, dh = im.height * s;
        ctx.drawImage(im, x + (cellW - dw) / 2, y + labelH + (cellH - dh) / 2, dw, dh);
      } else {
        ctx.fillStyle = '#b00'; ctx.fillText('— no image —', x + 8, y + labelH + 8);
      }
    }
    return cv.toDataURL('image/png');
  }, { imgs, title, cols, cellW, cellH });
  const b64 = png.split(',')[1];
  const { writeFileSync } = await import('node:fs');
  writeFileSync(outPath, Buffer.from(b64, 'base64'));
  return outPath;
}
