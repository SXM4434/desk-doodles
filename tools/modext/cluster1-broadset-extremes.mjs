// CLUSTER 1 (path/motion) BROAD-SET EXTREMES — companion to cluster1-pathmotion-
// sweep.mjs. The main sweep covers all 197 shapes at LOW/MID/HIGH per toggle.
// This pass adds, on a GNARLY set spanning every catalog category (auto-derived
// from clean-render classification — multi-subpath / tiny / tall-thin / dense /
// pure-line / filled / dashed):
//   • the FULL discrete enumerations the brief names:
//       multiStroke: off/single/double/triple/quad/quint/six/heavy (all 8)
//       endpoint:    clean/protrude/long-overshoot/kink (all 4)
//       sketchingStyle: single-pass/loose-overlap/parallel-pass/cross-rotate (all 4)
//   • combo EXTREMES (the "living ecosystem" cells from doc 19 §D):
//       wobble2+jag2, heavy+cross-rotate, kink+loose-overlap+quad,
//       strokeFloor+wobble2, bowMax+curveDamp0
// All in rough-handdrawn vs the shape's clean baseline. Full shots saved for
// vision READ + side-by-side closeups for every flagged cell.
//
//   C1_URL=http://localhost:4490/tools/modext/modext.html \
//     node tools/modext/cluster1-broadset-extremes.mjs
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import zlib from 'node:zlib';

const require = createRequire('/Users/sebs/Desktop/Projects/desk-doodles/');
let chromium;
try { ({ chromium } = require('/tmp/dd-pp/node_modules/playwright')); }
catch { ({ chromium } = require('/Users/sebs/Desktop/Projects/portfolio/tools/lab-screenshots/node_modules/playwright')); }

const BASE = process.env.C1_URL || 'http://localhost:4490/tools/modext/modext.html';
const OUT = '/tmp/dd-c1-broad';
mkdirSync(join(OUT, 'shots'), { recursive: true });
mkdirSync(join(OUT, 'mosaics'), { recursive: true });
mkdirSync(join(OUT, 'closeups'), { recursive: true });

// ── PNG decode/encode (same as main sweep) ──
function decodePng(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG');
  let off = 8, w = 0, h = 0, colorType = 0; const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off); const type = buf.toString('ascii', off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); colorType = data.readUInt8(9); }
    else if (type === 'IDAT') idat.push(data); else if (type === 'IEND') break;
    off += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const ch = colorType === 6 ? 4 : colorType === 2 ? 3 : 1; const stride = w * ch; const out = Buffer.alloc(stride * h);
  let pos = 0; const paeth = (a, b, c) => { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); return pa <= pb && pa <= pc ? a : pb <= pc ? b : c; };
  for (let y = 0; y < h; y++) { const ft = raw[pos++]; for (let x = 0; x < stride; x++) { const v = raw[pos++]; const a = x >= ch ? out[y * stride + x - ch] : 0; const b = y > 0 ? out[(y - 1) * stride + x] : 0; const c = x >= ch && y > 0 ? out[(y - 1) * stride + x - ch] : 0; let r; switch (ft) { case 0: r = v; break; case 1: r = v + a; break; case 2: r = v + b; break; case 3: r = v + ((a + b) >> 1); break; case 4: r = v + paeth(a, b, c); break; default: r = v; } out[y * stride + x] = r & 0xff; } }
  const rgba = Buffer.alloc(w * h * 4, 255);
  for (let i = 0; i < w * h; i++) { rgba[i * 4] = out[i * ch]; rgba[i * 4 + 1] = out[i * ch + (ch > 1 ? 1 : 0)]; rgba[i * 4 + 2] = out[i * ch + (ch > 2 ? 2 : 0)]; rgba[i * 4 + 3] = ch === 4 ? out[i * ch + 3] : 255; }
  return { w, h, ch, data: out, rgba };
}
const CRC = (() => { const t = new Int32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c; } return t; })();
function crc32(b) { let c = ~0; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xff] ^ (c >>> 8); return ~c >>> 0; }
function pchunk(type, data) { const o = Buffer.alloc(12 + data.length); o.writeUInt32BE(data.length, 0); o.write(type, 4, 'ascii'); data.copy(o, 8); o.writeUInt32BE(crc32(o.subarray(4, 8 + data.length)), 8 + data.length); return o; }
function encodePng(w, h, rgba) { const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6; const stride = w * 4; const raw = Buffer.alloc((stride + 1) * h); for (let y = 0; y < h; y++) { raw[y * (stride + 1)] = 0; rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride); } return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), pchunk('IHDR', ihdr), pchunk('IDAT', zlib.deflateSync(raw, { level: 6 })), pchunk('IEND', Buffer.alloc(0))]); }

const PAPER = [253, 252, 249]; const INK_DIST = 48;
function analyze(png) {
  const { w, h, ch, data } = png; const yStart = 50, SIDE = 4;
  const x0 = SIDE, x1 = w - SIDE, y0 = yStart, y1 = h - SIDE; const total = (x1 - x0) * (y1 - y0);
  let ink = 0, dark = 0, edgeInk = 0, edgeTotal = 0; const RING = 4;
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const i = (y * w + x) * ch; const r = data[i], g = data[i + 1], b = data[i + 2];
    const dist = Math.abs(r - PAPER[0]) + Math.abs(g - PAPER[1]) + Math.abs(b - PAPER[2]); const isInk = dist > INK_DIST;
    if (isInk) ink++; const luma = 0.299 * r + 0.587 * g + 0.114 * b; if (luma < 70) dark++;
    const inRing = y < y0 + RING || y >= y1 - RING || x < x0 + RING || x >= x1 - RING; if (inRing) { edgeTotal++; if (isInk) edgeInk++; }
  }
  return { inkFrac: ink / total, darkFrac: dark / total, edgeFrac: edgeTotal ? edgeInk / edgeTotal : 0 };
}

const DEFAULT = {
  wobble: 0.4, jaggedness: 0, simplification: 1.0, bowing: 1.0, strokeWidth: 1.2, curveDamp: 0.3,
  hachureGap: 4, hachureAngle: -41, fillDensity: 0.7, inkIntensity: 1.0, fillOpacity: 1.0, blurAmount: 0.4,
  bleed: 0, dotSize: 1.0, dotSpacing: 4, dotScatter: 0.3, grainIntensity: 2.5, smudgeAmount: 0, pressureVariance: 0,
  offsetDistance: 2, offsetAngle: 45, colorShift: 0.7, risoSecondaryColor: 'accent', registrationError: 0,
  textureIntensity: 1.0, multiStroke: 'double', fillStyle: 'hachure', strokePalette: 'source', fillPalette: 'source',
  texture: 'none', dotPattern: 'staggered', endpointBehavior: 'clean', sketchingStyle: 'single-pass', penTip: 'plain',
};
async function setState(page, shape, style, mods) { await page.evaluate(({ shape, style, mods }) => { window.__modext.setShape(shape); window.__modext.setStyle(style); window.__modext.replaceMods(mods); }, { shape, style, mods }); await page.waitForTimeout(150); }
async function scanNaN(page) { return page.evaluate(() => { const cell = document.getElementById('modext-cell'); const out = []; for (const el of cell.querySelectorAll('path,line,polyline,polygon,rect,circle,ellipse,use')) for (const attr of ['d', 'points', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'x', 'y', 'width', 'height', 'transform']) { const v = el.getAttribute(attr); if (v && /(NaN|Infinity|undefined|null)/.test(v)) out.push(`${el.tagName}@${attr}=${v.slice(0, 40)}`); } return out; }); }

const HOST = 'rough-handdrawn';
const STATES = [
  // FULL multiStroke enumeration (the brief: single/double/triple/quad + ext)
  { key: 'ms_off',   mods: { multiStroke: 'off' } },
  { key: 'ms_single', mods: { multiStroke: 'single' } },
  { key: 'ms_double', mods: { multiStroke: 'double' } },
  { key: 'ms_triple', mods: { multiStroke: 'triple' } },
  { key: 'ms_quad',  mods: { multiStroke: 'quad' } },
  { key: 'ms_quint', mods: { multiStroke: 'quint' } },
  { key: 'ms_six',   mods: { multiStroke: 'six' } },
  { key: 'ms_heavy', mods: { multiStroke: 'heavy' } },
  // FULL endpoint enumeration
  { key: 'ep_clean',     mods: { endpointBehavior: 'clean' } },
  { key: 'ep_protrude',  mods: { endpointBehavior: 'protrude' } },
  { key: 'ep_overshoot', mods: { endpointBehavior: 'long-overshoot' } },
  { key: 'ep_kink',      mods: { endpointBehavior: 'kink' } },
  // FULL sketchingStyle enumeration (triple so layer transforms are visible)
  { key: 'sk_single',  mods: { sketchingStyle: 'single-pass', multiStroke: 'triple' } },
  { key: 'sk_loose',   mods: { sketchingStyle: 'loose-overlap', multiStroke: 'triple' } },
  { key: 'sk_parallel', mods: { sketchingStyle: 'parallel-pass', multiStroke: 'triple' } },
  { key: 'sk_crossrot', mods: { sketchingStyle: 'cross-rotate', multiStroke: 'triple' } },
  // COMBO extremes — the "living ecosystem" cells (doc 19 §D)
  { key: 'X_wob2_jag2',        mods: { wobble: 2.0, jaggedness: 2.0, multiStroke: 'double' } },
  { key: 'X_heavy_crossrot',   mods: { multiStroke: 'heavy', sketchingStyle: 'cross-rotate', wobble: 1.5 } },
  { key: 'X_kink_loose_quad',  mods: { endpointBehavior: 'kink', sketchingStyle: 'loose-overlap', multiStroke: 'quad', wobble: 1.0 } },
  { key: 'X_strokeFloor_wob2', mods: { strokeWidth: 0.5, wobble: 2.0, jaggedness: 2.0, multiStroke: 'triple' } },
  { key: 'X_bowMax_damp0',     mods: { bowing: 2.5, curveDamp: 0, wobble: 2.0, multiStroke: 'triple' } },
  { key: 'X_overshoot_heavy',  mods: { endpointBehavior: 'long-overshoot', multiStroke: 'heavy', wobble: 1.5 } },
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 420, height: 440 }, deviceScaleFactor: 2 });
const consoleErrors = [];
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', (e) => consoleErrors.push('PAGEERR: ' + e.message));
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__modext && window.__modext.ready, { timeout: 20000 });
const inventory = await page.evaluate(() => window.__modext.inventory);
console.log(`inventory: ${inventory.length}`);

// ── classify all shapes from clean render → derive gnarly set ──
console.log('classifying for gnarly set...');
const classify = [];
for (const cell of inventory) {
  await setState(page, cell.shape, 'clean', { ...DEFAULT });
  const m = await page.evaluate(() => {
    const root = document.getElementById('modext-cell'); const geom = root.querySelectorAll('path,line,polyline,polygon,rect,circle,ellipse');
    let subpaths = 0, hasFill = false, hasDash = false; const elCount = geom.length;
    for (const el of geom) { const d = el.getAttribute('d'); if (d) subpaths += (d.match(/[Mm]/g) || []).length; else subpaths += 1; const cs = getComputedStyle(el); const fill = el.getAttribute('fill') || cs.fill; if (fill && fill !== 'none' && fill !== 'transparent' && !/rgba\(0, 0, 0, 0\)/.test(fill)) hasFill = true; const da = el.getAttribute('stroke-dasharray') || cs.strokeDasharray; if (da && da !== 'none' && da !== '0') hasDash = true; }
    let asp = 1, areaFrac = 0; const outer = root.querySelector('div'); if (outer) { const r = outer.getBoundingClientRect(); if (r.height > 0) asp = r.width / r.height; areaFrac = (r.width * r.height) / (360 * 360); }
    return { subpaths, hasFill, hasDash, elCount, asp, areaFrac };
  });
  classify.push({ ...cell, ...m });
}
function pick(filter, n, taken) { const r = []; for (const c of classify) { if (r.length >= n) break; if (taken.has(c.shape)) continue; if (filter(c)) { r.push(c); taken.add(c.shape); } } return r; }
const taken = new Set();
const gnarly = [
  ...pick((c) => c.subpaths >= 8, 6, taken),           // multi-subpath / stacked
  ...pick((c) => c.asp < 0.45, 4, taken),              // tall-thin
  ...pick((c) => c.asp > 2.2, 3, taken),               // wide-thin
  ...pick((c) => c.elCount >= 12, 4, taken),           // dense-detail
  ...pick((c) => !c.hasFill && c.elCount <= 3, 4, taken), // pure-line
  ...pick((c) => c.hasFill, 5, taken),                 // filled-solid
  ...pick((c) => c.hasDash, 2, taken),                 // dashed
  ...pick((c) => c.areaFrac < 0.06, 4, taken),         // tiny
  ...pick(() => true, 3, taken),                       // misc filler
];
writeFileSync(join(OUT, 'gnarly.json'), JSON.stringify({ gnarly: gnarly.map((g) => ({ shape: g.shape, label: g.label, subpaths: g.subpaths, asp: +g.asp.toFixed(2), elCount: g.elCount, hasFill: g.hasFill, hasDash: g.hasDash, areaFrac: +g.areaFrac.toFixed(3) })) }, null, 2));
console.log(`gnarly set (${gnarly.length}):`, gnarly.map((g) => g.shape).join(', '));

// ── clean baseline per gnarly shape ──
const cleanByShape = {};
for (const g of gnarly) { await setState(page, g.shape, 'clean', { ...DEFAULT }); const buf = await page.locator('#modext-cell').screenshot(); const png = decodePng(buf); cleanByShape[g.shape] = { png, inkFrac: analyze(png).inkFrac, darkFrac: analyze(png).darkFrac }; }

// ── sweep states, build per-STATE mosaics over the gnarly set ──
const records = []; let flagN = 0;
for (const st of STATES) {
  mkdirSync(join(OUT, 'shots', st.key), { recursive: true });
  const cells = []; let flagThis = 0;
  for (const g of gnarly) {
    consoleErrors.length = 0;
    await setState(page, g.shape, HOST, { ...DEFAULT, ...st.mods });
    const nan = await scanNaN(page);
    const buf = await page.locator('#modext-cell').screenshot();
    const png = decodePng(buf); const a = analyze(png); const errs = consoleErrors.slice();
    const cleanInk = cleanByShape[g.shape].inkFrac; const cleanDark = cleanByShape[g.shape].darkFrac;
    const flags = [];
    if (a.inkFrac < 0.004 && cleanInk > 0.008) flags.push('EMPTY');
    else if (cleanInk > 0.01 && a.inkFrac < cleanInk * 0.25) flags.push('SHRUNK');
    if (a.darkFrac > 0.70 && cleanDark < 0.45) flags.push('FLOOD');
    if (a.edgeFrac > 0.04 && cleanInk > 0.005) flags.push('OVERFLOW');
    if (nan.length) flags.push('NAN:' + nan[0]);
    if (errs.length) flags.push('CONSOLE');
    writeFileSync(join(OUT, 'shots', st.key, `${g.shape}.png`), buf);
    if (flags.length) { flagN++; flagThis++; writeFileSync(join(OUT, 'closeups', `${g.shape}__${st.key}.png`), sideBySide(cleanByShape[g.shape].png, png)); }
    records.push({ key: st.key, shape: g.shape, label: g.label, cleanInk: +cleanInk.toFixed(4), inkFrac: +a.inkFrac.toFixed(4), darkFrac: +a.darkFrac.toFixed(4), edgeFrac: +a.edgeFrac.toFixed(4), nan: nan.length ? nan : null, flags });
    cells.push(png);
  }
  buildMosaic(st.key, cells, gnarly);
  console.log(`[${st.key}] ${cells.length} cells · flagged ${flagThis}`);
}

function buildMosaic(name, cells, inv) {
  if (!cells.length) return; const cw = cells[0].w, chh = cells[0].h; const COLS = 7; const rows = Math.ceil(cells.length / COLS); const G = 2;
  const W = COLS * (cw + G) + G; const H = rows * (chh + G) + G; const sheet = Buffer.alloc(W * H * 4, 245);
  cells.forEach((png, i) => { const col = i % COLS, row = Math.floor(i / COLS); const ox = G + col * (cw + G), oy = G + row * (chh + G); for (let y = 0; y < png.h; y++) { const src = y * png.w * 4; png.rgba.copy(sheet, ((oy + y) * W + ox) * 4, src, src + png.w * 4); } });
  writeFileSync(join(OUT, 'mosaics', `${name}.png`), encodePng(W, H, sheet));
}
function sideBySide(a, b) { const w = a.w + b.w + 6, h = Math.max(a.h, b.h); const sheet = Buffer.alloc(w * h * 4, 220); for (let y = 0; y < a.h; y++) { const src = y * a.w * 4; a.rgba.copy(sheet, (y * w) * 4, src, src + a.w * 4); } for (let y = 0; y < b.h; y++) { const src = y * b.w * 4; b.rgba.copy(sheet, (y * w + a.w + 6) * 4, src, src + b.w * 4); } return encodePng(w, h, sheet); }

// also a clean-baseline mosaic for the gnarly set
buildMosaic('_clean', gnarly.map((g) => cleanByShape[g.shape].png), gnarly);

const flagged = records.filter((r) => r.flags.length);
const lines = ['# Cluster 1 broad-set extremes — gnarly set × full enums + combo extremes', '', `Run: ${new Date().toISOString()}`, `Gnarly: ${gnarly.length} shapes · States: ${STATES.length} · Cells: ${records.length}`, '', '## Per-state flag counts', '', '| state | cells | EMPTY | SHRUNK | FLOOD | OVERFLOW | NAN | CONSOLE |', '|---|---|---|---|---|---|---|---|'];
for (const st of STATES) { const sc = records.filter((r) => r.key === st.key); const c = (f) => sc.filter((r) => r.flags.some((x) => x.startsWith(f))).length; lines.push(`| ${st.key} | ${sc.length} | ${c('EMPTY')} | ${c('SHRUNK')} | ${c('FLOOD')} | ${c('OVERFLOW')} | ${c('NAN')} | ${c('CONSOLE')} |`); }
lines.push('', '## Flagged cells', '');
if (!flagged.length) lines.push('_None flagged._'); else { lines.push('| state | shape | cleanInk% | ink% | dark% | edge% | flags |'); lines.push('|---|---|---|---|---|---|---|'); for (const r of flagged) lines.push(`| ${r.key} | ${r.shape} | ${(r.cleanInk * 100).toFixed(1)} | ${(r.inkFrac * 100).toFixed(1)} | ${(r.darkFrac * 100).toFixed(1)} | ${(r.edgeFrac * 100).toFixed(1)} | ${r.flags.join(' ')} |`); }
writeFileSync(join(OUT, 'table.md'), lines.join('\n'));
writeFileSync(join(OUT, 'results.json'), JSON.stringify(records, null, 2));
console.log(`\ncells: ${records.length} · flagged: ${flagged.length} · table: ${OUT}/table.md`);
await browser.close();
