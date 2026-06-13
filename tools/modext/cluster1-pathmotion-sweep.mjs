// CLUSTER 1 (path / motion) 2D TOGGLE AUDIT — drives tools/modext/modext.html.
//
// Cluster 1 per docs/locked-refs/.../19-research-cross-axis-interconnection.md §E:
//   "Multi-Stroke" cluster — wobble · multiStroke(strokeCount) · strokeWidth ·
//   endpointBehavior · sketchingStyle  ("how much hand is in the stroke").
// The task brief's path/motion set also names jaggedness · bowing · curve(curveDamp)
//   — the geometry/motion siblings that ride the SAME path pipeline (I-12).
// => 8 toggles, each swept LOW / MID / HIGH, vs the CLEAN ground-truth render.
//
// Host style for every state = rough-handdrawn (the canonical style that exposes
// the full Cluster-1 modifier set per MODIFIER_SETS_BY_STYLE). Clean baseline is
// rendered in the 'clean' style with DEFAULT mods (faithful render of each shape).
//
// For EACH shape: render CLEAN baseline, then every Cluster-1 (toggle,level) state.
// Pixel-analyze each cell and flag vs the shape's CLEAN baseline:
//   EMPTY    — ink coverage collapses (< 0.4% ink) while clean had ink   → lost shape
//   FLOOD    — near-solid-black fill (dark > 70%) where clean wasn't      → blob
//   NAN      — non-finite coords in produced SVG (d= / points= / xy)      → broken geom
//   OVERFLOW — ink in the cell's edge ring (form spills past frame)
//   CONSOLE  — console error / pageerror during the render
//   SHRUNK   — ink collapses to < 25% of clean ink (recognizability risk, soft flag)
//
// Outputs under /tmp/dd-c1/:
//   shots/clean/<shape>.png                 clean baseline per shape
//   shots/<toggle>__<level>/<shape>.png     each swept state per shape
//   mosaics/clean.png                       baseline contact sheet (197)
//   mosaics/<toggle>__<level>.png           per-(toggle,level) contact sheet (197)
//   closeups/<shape>__<toggle>__<level>.png  Clean|state side-by-side for flagged
//   results.json   table.md   flag-summary.md
//
// Isolated preview (HMR-churn rule): vite preview of /tmp/modext-dist on a unique
// port, never the shared dev server.
//   C1_URL=http://localhost:4490/tools/modext/modext.html \
//     node tools/modext/cluster1-pathmotion-sweep.mjs
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import zlib from 'node:zlib';

const require = createRequire('/Users/sebs/Desktop/Projects/desk-doodles/');
let chromium;
try {
  ({ chromium } = require('/tmp/dd-pp/node_modules/playwright'));
} catch {
  ({ chromium } = require('/Users/sebs/Desktop/Projects/portfolio/tools/lab-screenshots/node_modules/playwright'));
}

const BASE = process.env.C1_URL || 'http://localhost:4490/tools/modext/modext.html';
const OUT = '/tmp/dd-c1';
const ONLY = process.env.ONLY ? new Set(process.env.ONLY.split(',')) : null; // limit shapes for smoke
mkdirSync(join(OUT, 'shots'), { recursive: true });
mkdirSync(join(OUT, 'mosaics'), { recursive: true });
mkdirSync(join(OUT, 'closeups'), { recursive: true });

// ─── PNG decode ──────────────────────────────────────────────────────────────
function decodePng(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG');
  let off = 8, w = 0, h = 0, colorType = 0, bitDepth = 0;
  const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString('ascii', off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); bitDepth = data.readUInt8(8); colorType = data.readUInt8(9); }
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    off += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const ch = colorType === 6 ? 4 : colorType === 2 ? 3 : 1;
  const stride = w * ch;
  const out = Buffer.alloc(stride * h);
  let pos = 0;
  const paeth = (a, b, c) => { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); return pa <= pb && pa <= pc ? a : pb <= pc ? b : c; };
  for (let y = 0; y < h; y++) {
    const ft = raw[pos++];
    for (let x = 0; x < stride; x++) {
      const v = raw[pos++];
      const a = x >= ch ? out[y * stride + x - ch] : 0;
      const b = y > 0 ? out[(y - 1) * stride + x] : 0;
      const c = x >= ch && y > 0 ? out[(y - 1) * stride + x - ch] : 0;
      let r;
      switch (ft) { case 0: r = v; break; case 1: r = v + a; break; case 2: r = v + b; break; case 3: r = v + ((a + b) >> 1); break; case 4: r = v + paeth(a, b, c); break; default: r = v; }
      out[y * stride + x] = r & 0xff;
    }
  }
  // expand to RGBA for mosaic compositing
  const rgba = Buffer.alloc(w * h * 4, 255);
  for (let i = 0; i < w * h; i++) {
    rgba[i * 4] = out[i * ch]; rgba[i * 4 + 1] = out[i * ch + (ch > 1 ? 1 : 0)]; rgba[i * 4 + 2] = out[i * ch + (ch > 2 ? 2 : 0)];
    rgba[i * 4 + 3] = ch === 4 ? out[i * ch + 3] : 255;
  }
  return { w, h, ch, data: out, rgba };
}

// ─── PNG encode (RGBA) ───────────────────────────────────────────────────────
const CRC = (() => { const t = new Int32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c; } return t; })();
function crc32(b) { let c = ~0; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xff] ^ (c >>> 8); return ~c >>> 0; }
function chunk(type, data) { const o = Buffer.alloc(12 + data.length); o.writeUInt32BE(data.length, 0); o.write(type, 4, 'ascii'); data.copy(o, 8); o.writeUInt32BE(crc32(o.subarray(4, 8 + data.length)), 8 + data.length); return o; }
function encodePng(w, h, rgba) {
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  const stride = w * 4; const raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (stride + 1)] = 0; rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride); }
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 6 })), chunk('IEND', Buffer.alloc(0))]);
}

// ─── Pixel metrics (warm paper #FDFCF9, skip 46px top label band) ────────────
const PAPER = [253, 252, 249];
const INK_DIST = 48;
function analyze(png) {
  const { w, h, ch, data } = png;
  // The harness cell carries a 22px label band (×2 DSR ≈ 44px) at top and a
  // 1px solid #d8d2c6 border on all four sides. INSET past both so the metrics
  // measure the SHAPE, not the chrome. yStart skips the label band + top border;
  // SIDE_INSET skips the left/right/bottom 1px border (×2 DSR + safety = 4px).
  const yStart = 50;
  const SIDE = 4;
  const x0 = SIDE, x1 = w - SIDE, y0 = yStart, y1 = h - SIDE;
  const total = (x1 - x0) * (y1 - y0);
  let ink = 0, dark = 0, edgeInk = 0, edgeTotal = 0;
  const RING = 4; // overflow ring sits JUST inside the inset frame
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * w + x) * ch;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const dist = Math.abs(r - PAPER[0]) + Math.abs(g - PAPER[1]) + Math.abs(b - PAPER[2]);
      const isInk = dist > INK_DIST;
      if (isInk) ink++;
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;
      if (luma < 70) dark++;
      const inRing = y < y0 + RING || y >= y1 - RING || x < x0 + RING || x >= x1 - RING;
      if (inRing) { edgeTotal++; if (isInk) edgeInk++; }
    }
  }
  return { inkFrac: ink / total, darkFrac: dark / total, edgeFrac: edgeTotal ? edgeInk / edgeTotal : 0 };
}

// ─── modext driver helpers ───────────────────────────────────────────────────
const DEFAULT = {
  wobble: 0.4, jaggedness: 0, simplification: 1.0, bowing: 1.0, strokeWidth: 1.2,
  curveDamp: 0.3, hachureGap: 4, hachureAngle: -41, fillDensity: 0.7, inkIntensity: 1.0,
  fillOpacity: 1.0, blurAmount: 0.4, bleed: 0, dotSize: 1.0, dotSpacing: 4, dotScatter: 0.3,
  grainIntensity: 2.5, smudgeAmount: 0, pressureVariance: 0, offsetDistance: 2, offsetAngle: 45,
  colorShift: 0.7, risoSecondaryColor: 'accent', registrationError: 0, textureIntensity: 1.0,
  multiStroke: 'double', fillStyle: 'hachure', strokePalette: 'source', fillPalette: 'source',
  texture: 'none', dotPattern: 'staggered', endpointBehavior: 'clean', sketchingStyle: 'single-pass',
  penTip: 'plain',
};

async function setState(page, shape, style, mods) {
  await page.evaluate(({ shape, style, mods }) => {
    window.__modext.setShape(shape);
    window.__modext.setStyle(style);
    window.__modext.replaceMods(mods);
  }, { shape, style, mods });
  await page.waitForTimeout(150);
}
async function scanNaN(page) {
  return page.evaluate(() => {
    const cell = document.getElementById('modext-cell');
    const out = [];
    const els = cell.querySelectorAll('path,line,polyline,polygon,rect,circle,ellipse,use');
    for (const el of els) {
      for (const attr of ['d', 'points', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'x', 'y', 'width', 'height', 'transform']) {
        const v = el.getAttribute(attr);
        if (v && /(NaN|Infinity|undefined|null)/.test(v)) out.push(`${el.tagName}@${attr}=${v.slice(0, 40)}`);
      }
    }
    return out;
  });
}

// ─── THE CLUSTER-1 (path/motion) STATE MATRIX — 8 toggles × LOW/MID/HIGH ─────
// Discrete toggles: LOW/MID/HIGH map to representative members (full set noted).
// Sliders: LOW/MID/HIGH = floor / mid / ceiling of the SLIDER_SPEC working zone.
const HOST = 'rough-handdrawn';
const STATES = [
  // multiStroke (strokeCount) — LOW single · MID double · HIGH quad (full set also
  // includes triple/quint/six/heavy — covered in the broad-set pass below)
  { toggle: 'multiStroke', level: 'LOW',  mods: { multiStroke: 'single' } },
  { toggle: 'multiStroke', level: 'MID',  mods: { multiStroke: 'double' } },
  { toggle: 'multiStroke', level: 'HIGH', mods: { multiStroke: 'quad' } },
  // endpointBehavior — clean / protrude / long-overshoot / kink. LOW clean (baseline),
  // MID protrude, HIGH long-overshoot; kink swept separately (it's a distinct family).
  { toggle: 'endpoint', level: 'LOW',  mods: { endpointBehavior: 'clean' } },
  { toggle: 'endpoint', level: 'MID',  mods: { endpointBehavior: 'protrude' } },
  { toggle: 'endpoint', level: 'HIGH', mods: { endpointBehavior: 'long-overshoot' } },
  { toggle: 'endpoint', level: 'KINK', mods: { endpointBehavior: 'kink' } },
  // sketchingStyle — single-pass / loose-overlap / parallel-pass / cross-rotate.
  // multiStroke must be > single for layer-transform styles to be visible → triple.
  { toggle: 'sketchingStyle', level: 'LOW',  mods: { sketchingStyle: 'single-pass', multiStroke: 'triple' } },
  { toggle: 'sketchingStyle', level: 'MID',  mods: { sketchingStyle: 'loose-overlap', multiStroke: 'triple' } },
  { toggle: 'sketchingStyle', level: 'HIGH', mods: { sketchingStyle: 'parallel-pass', multiStroke: 'triple' } },
  { toggle: 'sketchingStyle', level: 'XROT', mods: { sketchingStyle: 'cross-rotate', multiStroke: 'triple' } },
  // wobble — SLIDER_SPEC 0..2.0. LOW 0 · MID 1.0 · HIGH 2.0
  { toggle: 'wobble', level: 'LOW',  mods: { wobble: 0 } },
  { toggle: 'wobble', level: 'MID',  mods: { wobble: 1.0 } },
  { toggle: 'wobble', level: 'HIGH', mods: { wobble: 2.0 } },
  // jaggedness — SLIDER_SPEC 0..2.0. LOW 0 · MID 1.0 · HIGH 2.0
  { toggle: 'jaggedness', level: 'LOW',  mods: { jaggedness: 0 } },
  { toggle: 'jaggedness', level: 'MID',  mods: { jaggedness: 1.0 } },
  { toggle: 'jaggedness', level: 'HIGH', mods: { jaggedness: 2.0 } },
  // bowing — SLIDER_SPEC 0..2.5. LOW 0 · MID 1.25 · HIGH 2.5
  { toggle: 'bowing', level: 'LOW',  mods: { bowing: 0 } },
  { toggle: 'bowing', level: 'MID',  mods: { bowing: 1.25 } },
  { toggle: 'bowing', level: 'HIGH', mods: { bowing: 2.5 } },
  // strokeWidth — SLIDER_SPEC 0.5..3.0. LOW 0.5 (floor) · MID 1.75 · HIGH 3.0
  { toggle: 'strokeWidth', level: 'LOW',  mods: { strokeWidth: 0.5 } },
  { toggle: 'strokeWidth', level: 'MID',  mods: { strokeWidth: 1.75 } },
  { toggle: 'strokeWidth', level: 'HIGH', mods: { strokeWidth: 3.0 } },
  // curve (curveDamp) — SLIDER_SPEC 0..1.5. LOW 0 · MID 0.75 · HIGH 1.5
  // pair bowing up so curveDamp's damping is observable
  { toggle: 'curve', level: 'LOW',  mods: { curveDamp: 0, bowing: 2.0, wobble: 1.0 } },
  { toggle: 'curve', level: 'MID',  mods: { curveDamp: 0.75, bowing: 2.0, wobble: 1.0 } },
  { toggle: 'curve', level: 'HIGH', mods: { curveDamp: 1.5, bowing: 2.0, wobble: 1.0 } },
];

// ─── Run ─────────────────────────────────────────────────────────────────────
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 420, height: 440 }, deviceScaleFactor: 2 });
const consoleErrors = [];
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', (e) => consoleErrors.push('PAGEERR: ' + e.message));

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__modext && window.__modext.ready, { timeout: 20000 });
let inventory = await page.evaluate(() => window.__modext.inventory);
if (ONLY) inventory = inventory.filter((c) => ONLY.has(c.shape));
console.log(`inventory: ${inventory.length} shapes · states: ${STATES.length} (+ clean baseline)`);
if (!ONLY && inventory.length !== 197) console.warn(`⚠ EXPECTED 197, got ${inventory.length}`);

// state dirs
mkdirSync(join(OUT, 'shots', 'clean'), { recursive: true });
for (const s of STATES) mkdirSync(join(OUT, 'shots', `${s.toggle}__${s.level}`), { recursive: true });

const cleanByShape = {};   // shape -> { inkFrac, png }
const cleanCells = [];     // for mosaic, inventory order
const records = [];

// 1) CLEAN baseline pass
console.log('\n=== CLEAN baseline (ground truth) ===');
for (const cell of inventory) {
  await setState(page, cell.shape, 'clean', { ...DEFAULT });
  const buf = await page.locator('#modext-cell').screenshot();
  writeFileSync(join(OUT, 'shots', 'clean', `${cell.shape}.png`), buf);
  const png = decodePng(buf);
  const a = analyze(png);
  cleanByShape[cell.shape] = { inkFrac: a.inkFrac, darkFrac: a.darkFrac, png };
  cleanCells.push(png);
}
buildMosaic('clean', cleanCells, inventory);
console.log(`clean baseline: ${cleanCells.length} cells`);

// 2) Cluster-1 state passes
let flagN = 0;
const stateMosaics = {};
for (const st of STATES) {
  const key = `${st.toggle}__${st.level}`;
  const cells = [];
  let flaggedThis = 0;
  for (const cell of inventory) {
    consoleErrors.length = 0;
    await setState(page, cell.shape, HOST, { ...DEFAULT, ...st.mods });
    const nan = await scanNaN(page);
    const buf = await page.locator('#modext-cell').screenshot();
    const png = decodePng(buf);
    const a = analyze(png);
    const errs = consoleErrors.slice();
    const cleanInk = cleanByShape[cell.shape].inkFrac;
    const flags = [];
    if (a.inkFrac < 0.004 && cleanInk > 0.008) flags.push('EMPTY');
    else if (cleanInk > 0.01 && a.inkFrac < cleanInk * 0.25) flags.push('SHRUNK');
    if (a.darkFrac > 0.70 && cleanByShape[cell.shape].darkFrac < 0.45) flags.push('FLOOD');
    if (a.edgeFrac > 0.04 && cleanInk > 0.005) flags.push('OVERFLOW');
    if (nan.length) flags.push('NAN:' + nan[0]);
    if (errs.length) flags.push('CONSOLE');
    if (flags.length) {
      flaggedThis++; flagN++;
      writeFileSync(join(OUT, 'shots', key, `${cell.shape}.png`), buf);
      // side-by-side Clean | state closeup
      writeFileSync(join(OUT, 'closeups', `${cell.shape}__${key}.png`), sideBySide(cleanByShape[cell.shape].png, png));
    } else {
      writeFileSync(join(OUT, 'shots', key, `${cell.shape}.png`), buf);
    }
    records.push({
      toggle: st.toggle, level: st.level, key, shape: cell.shape, label: cell.label,
      cleanInk: +cleanInk.toFixed(4), inkFrac: +a.inkFrac.toFixed(4), darkFrac: +a.darkFrac.toFixed(4),
      edgeFrac: +a.edgeFrac.toFixed(4), nan: nan.length ? nan : null, flags,
    });
    cells.push(png);
  }
  buildMosaic(key, cells, inventory);
  stateMosaics[key] = true;
  console.log(`[${key}] ${cells.length} cells · flagged ${flaggedThis}`);
}

// ─── Mosaic builder ──────────────────────────────────────────────────────────
function buildMosaic(name, cells, inv) {
  if (!cells.length) return;
  const cw = cells[0].w, chh = cells[0].h;
  const COLS = 14;
  const rows = Math.ceil(cells.length / COLS);
  const G = 2;
  const W = COLS * (cw + G) + G;
  const H = rows * (chh + G) + G;
  const sheet = Buffer.alloc(W * H * 4, 245);
  cells.forEach((png, i) => {
    const col = i % COLS, row = Math.floor(i / COLS);
    const ox = G + col * (cw + G), oy = G + row * (chh + G);
    for (let y = 0; y < png.h; y++) {
      const src = y * png.w * 4;
      const dst = ((oy + y) * W + ox) * 4;
      png.rgba.copy(sheet, dst, src, src + png.w * 4);
    }
  });
  writeFileSync(join(OUT, 'mosaics', `${name}.png`), encodePng(W, H, sheet));
}
function sideBySide(a, b) {
  const w = a.w + b.w + 6, h = Math.max(a.h, b.h);
  const sheet = Buffer.alloc(w * h * 4, 220);
  for (let y = 0; y < a.h; y++) { const src = y * a.w * 4; a.rgba.copy(sheet, (y * w) * 4, src, src + a.w * 4); }
  for (let y = 0; y < b.h; y++) { const src = y * b.w * 4; b.rgba.copy(sheet, (y * w + a.w + 6) * 4, src, src + b.w * 4); }
  return encodePng(w, h, sheet);
}

// ─── Reports ─────────────────────────────────────────────────────────────────
const flagged = records.filter((r) => r.flags.length);
const lines = [
  '# Cluster 1 (path/motion) 2D toggle audit — per-(shape, toggle, level) flag table',
  '',
  `Run: ${new Date().toISOString()}`,
  `Inventory: ${inventory.length} shapes · States: ${STATES.length} (+clean) · Cells: ${records.length}`,
  `Host style: ${HOST} · Baseline: clean`,
  '',
  '## Per-(toggle,level) flag counts',
  '',
  '| toggle | level | cells | EMPTY | SHRUNK | FLOOD | OVERFLOW | NAN | CONSOLE |',
  '|---|---|---|---|---|---|---|---|---|',
];
for (const st of STATES) {
  const key = `${st.toggle}__${st.level}`;
  const sc = records.filter((r) => r.key === key);
  const c = (f) => sc.filter((r) => r.flags.some((x) => x.startsWith(f))).length;
  lines.push(`| ${st.toggle} | ${st.level} | ${sc.length} | ${c('EMPTY')} | ${c('SHRUNK')} | ${c('FLOOD')} | ${c('OVERFLOW')} | ${c('NAN')} | ${c('CONSOLE')} |`);
}
lines.push('', '## Flagged cells', '');
if (!flagged.length) lines.push('_None flagged._');
else {
  lines.push('| toggle | level | shape | cleanInk% | ink% | dark% | edge% | flags |');
  lines.push('|---|---|---|---|---|---|---|---|');
  for (const r of flagged) lines.push(`| ${r.toggle} | ${r.level} | ${r.shape} | ${(r.cleanInk * 100).toFixed(1)} | ${(r.inkFrac * 100).toFixed(1)} | ${(r.darkFrac * 100).toFixed(1)} | ${(r.edgeFrac * 100).toFixed(1)} | ${r.flags.join(' ')} |`);
}
writeFileSync(join(OUT, 'table.md'), lines.join('\n'));
writeFileSync(join(OUT, 'results.json'), JSON.stringify(records, null, 2));

// flag summary grouped by flag type
const summary = {};
for (const r of flagged) for (const f of r.flags) { const k = f.split(':')[0]; (summary[k] ??= []).push(`${r.shape}/${r.key}`); }
let st = '# Cluster 1 flag summary\n\n';
for (const [k, arr] of Object.entries(summary)) st += `## ${k} (${arr.length})\n${arr.join('\n')}\n\n`;
writeFileSync(join(OUT, 'flag-summary.md'), st);

console.log(`\ncells: ${records.length} · flagged: ${flagged.length}`);
console.log(`mosaics: ${Object.keys(stateMosaics).length + 1} → ${OUT}/mosaics/`);
console.log(`table: ${OUT}/table.md`);
await browser.close();
