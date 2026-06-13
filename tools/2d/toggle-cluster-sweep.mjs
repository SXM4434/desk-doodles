// 2D audit-catalog TOGGLE-CLUSTER sweep — Cluster 4 (surface texture) +
// Cluster 5 (color/palette) + geometry sliders, COMPARED TO CLEAN.
//
//   SWEEP_URL=http://localhost:5294/tools/2d/toggle-cluster-sweep.html \
//     node tools/2d/toggle-cluster-sweep.mjs
//
// Renders the REAL /audit inventory (deduped 197 shapes: 93 Trophy Wall
// PinShape + 104 Pegboard PegToolShape) through the REAL SvgStyleTransform 2D
// path (smartHachure ON). For every (toggle, level) STATE the harness sets the
// correct HOST STYLE (the style whose chrome exposes that toggle) at its real
// preset baseline, then overlays the one toggle value. Each STATE renders all
// 197 cells. A CLEAN ground-truth pass runs first; every other cell is compared
// to its Clean twin.
//
// Auto-flags per cell:
//   BLANK    — almost no ink (inkFrac < 0.2%): nothing rendered.
//   FLOOD    — dark pixels (luma < 60) > 88% of the cell: solid-black flood
//              hiding structure (the flat-black read).
//   OVERFLOW — ink touches the cell edge ring above 2%: form spills past frame.
//   BROKEN   — NaN/Infinity in any rendered geometry coordinate (DOM scan).
//   LOST     — vs Clean: this cell's Clean twin had real ink (>1.5%) but here
//              ink collapsed to <30% of Clean's ink AND <0.8% absolute — the
//              shape DISSOLVED relative to Clean (charcoal-shreds class).
//   PAPERFLOOD — vs Clean: ink fraction JUMPED to >2.5x Clean AND covers >55%
//                of the cell with a near-uniform non-paper tone (palette
//                flooding the paper background).
//   CONSOLE  — console error / pageerror raised during this state pass.
//
// Outputs (all under /tmp/dd-2d-cluster/):
//   shots/<state>/<shape>.png       per-cell captures
//   mosaics/<state>.png             per-state contact-sheet mosaic (all 197)
//   results.json                    raw per-(shape,state) records
//   sweep-table.md                  flagged-cell table + per-state summary
//
// No new deps: PNG decode/encode on node:zlib.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import zlib from 'node:zlib';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const PW = process.env.PW_PATH ?? '/tmp/dd-pp/node_modules/playwright';
let chromium;
try {
  ({ chromium } = require(PW));
} catch {
  ({ chromium } = require('/Users/sebs/Desktop/Projects/portfolio/tools/lab-screenshots/node_modules/playwright'));
}

const BASE_URL = process.env.SWEEP_URL ?? 'http://localhost:5294/tools/2d/toggle-cluster-sweep.html';
const OUT_DIR = '/tmp/dd-2d-cluster';

// Optional: ONLY=clean,texture-heavy,... to run a subset.
const ONLY = process.env.ONLY ? new Set(process.env.ONLY.split(',')) : null;

const PAPER = [253, 252, 249];
const INK_DIST_THRESHOLD = 60;
const DARK_LUMA = 60;
const BLANK_INK_FRAC = 0.002;
const FLOOD_DARK_FRAC = 0.88;
const EDGE_RING = 3;
const OVERFLOW_RING_FRAC = 0.02;
// vs-Clean comparison thresholds
const LOST_REL_FRAC = 0.30; // ink collapsed below 30% of Clean's ink
const LOST_ABS_FRAC = 0.008; // and below 0.8% absolute
const CLEAN_HAS_INK = 0.015; // Clean twin must have had real ink to call LOST
const PAPERFLOOD_REL = 2.5; // ink jumped >2.5x Clean
const PAPERFLOOD_COVER = 0.55; // covers >55% with near-uniform non-paper tone

// ─── PNG decode (8-bit, color type 2/6, non-interlaced) ─────────────────────
function decodePng(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG');
  let off = 8, w = 0, h = 0, colorType = 0, bitDepth = 0;
  const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString('ascii', off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') {
      w = data.readUInt32BE(0); h = data.readUInt32BE(4);
      bitDepth = data[8]; colorType = data[9];
      if (data[12] !== 0) throw new Error('interlaced PNG unsupported');
      if (bitDepth !== 8 || (colorType !== 2 && colorType !== 6)) {
        throw new Error(`unsupported PNG bitDepth=${bitDepth} colorType=${colorType}`);
      }
    } else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    off += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const bpp = colorType === 6 ? 4 : 3;
  const stride = w * bpp;
  const out = Buffer.alloc(w * h * 4, 255);
  const prev = Buffer.alloc(stride);
  const curr = Buffer.alloc(stride);
  for (let y = 0; y < h; y++) {
    const filter = raw[y * (stride + 1)];
    raw.copy(curr, 0, y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? curr[x - bpp] : 0;
      const b = prev[x];
      const c = x >= bpp ? prev[x - bpp] : 0;
      let v = curr[x];
      switch (filter) {
        case 1: v = (v + a) & 0xff; break;
        case 2: v = (v + b) & 0xff; break;
        case 3: v = (v + ((a + b) >> 1)) & 0xff; break;
        case 4: {
          const p = a + b - c;
          const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
          v = (v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 0xff;
          break;
        }
      }
      curr[x] = v;
    }
    for (let x = 0; x < w; x++) {
      const s = x * bpp;
      const d = (y * w + x) * 4;
      out[d] = curr[s]; out[d + 1] = curr[s + 1]; out[d + 2] = curr[s + 2];
      out[d + 3] = bpp === 4 ? curr[s + 3] : 255;
    }
    curr.copy(prev);
  }
  return { width: w, height: h, rgba: out };
}

// ─── PNG encode (8-bit RGBA) ────────────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return ~c >>> 0;
}
function pngChunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}
function encodePng(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', zlib.deflateSync(raw, { level: 6 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// ─── Pixel metrics over the clipped cell (minus the guide border) ───────────
function analyze(img) {
  const { width, height, rgba } = img;
  const B = 2;
  let total = 0, ink = 0, dark = 0, edgeInk = 0, edgeTotal = 0;
  // dominant non-paper tone tracking (coarse 4-bit-per-channel histogram)
  const hist = new Map();
  for (let y = B; y < height - B; y++) {
    for (let x = B; x < width - B; x++) {
      const i = (y * width + x) * 4;
      const r = rgba[i], g = rgba[i + 1], b = rgba[i + 2];
      total++;
      const dist = Math.abs(r - PAPER[0]) + Math.abs(g - PAPER[1]) + Math.abs(b - PAPER[2]);
      const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      const isInk = dist > INK_DIST_THRESHOLD;
      if (isInk) {
        ink++;
        const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
        hist.set(key, (hist.get(key) ?? 0) + 1);
      }
      if (luma < DARK_LUMA) dark++;
      const inRing =
        y < B + EDGE_RING || y >= height - B - EDGE_RING ||
        x < B + EDGE_RING || x >= width - B - EDGE_RING;
      if (inRing) {
        edgeTotal++;
        if (isInk) edgeInk++;
      }
    }
  }
  // largest single quantized non-paper tone bucket as a fraction of total
  let domTone = 0;
  for (const v of hist.values()) if (v > domTone) domTone = v;
  return {
    inkFrac: ink / total,
    darkFrac: dark / total,
    edgeFrac: edgeTotal > 0 ? edgeInk / edgeTotal : 0,
    domToneFrac: domTone / total, // fraction of the cell that's one uniform non-paper tone
  };
}

// ─── The sweep matrix ────────────────────────────────────────────────────────
// Each STATE = { id, style, mods, cluster, toggle, level }.
// The harness builds the style's REAL preset baseline then overlays `mods`.
// Host style is the one whose MODIFIER_SETS_BY_STYLE exposes that toggle.
//
// LEVELS: low / mid / high (or extremes) per task. For enum toggles each enum
// value is its own state (these are "pickers" — every option must hold).
function buildStates() {
  const states = [];
  const add = (id, style, mods, cluster, toggle, level) =>
    states.push({ id, style, mods, cluster, toggle, level });

  // ── Ground truth ──
  add('clean', 'clean', {}, 'baseline', 'clean', 'baseline');

  // ── CLUSTER 4 — surface texture ──
  // texture (10 enum recipes) — universal; host on rough-handdrawn (exposes
  // `texture` + `textureIntensity`, smartHachure on, the canonical render).
  for (const tex of ['none', 'light', 'heavy', 'chalky', 'paper-tooth', 'ribbed', 'stipple', 'wet-ink', 'smudge', 'canvas']) {
    add(`tex-${tex}`, 'rough-handdrawn', { texture: tex, textureIntensity: 1.0 }, 'C4', 'texture', tex);
  }
  // textureIntensity 0 / 1.5 / 3 (MAX) on a visible texture (heavy).
  add('texInt-0', 'rough-handdrawn', { texture: 'heavy', textureIntensity: 0 }, 'C4', 'textureIntensity', 'low(0)');
  add('texInt-mid', 'rough-handdrawn', { texture: 'heavy', textureIntensity: 1.5 }, 'C4', 'textureIntensity', 'mid(1.5)');
  add('texInt-max', 'rough-handdrawn', { texture: 'heavy', textureIntensity: 3 }, 'C4', 'textureIntensity', 'MAX(3)');
  // textureIntensity MAX on the grainiest recipes — the documented "shreds
  // small shapes" risk lives at the texture ceiling.
  add('texInt-max-chalky', 'rough-handdrawn', { texture: 'chalky', textureIntensity: 3 }, 'C4', 'textureIntensity', 'MAX-chalky');
  add('texInt-max-canvas', 'rough-handdrawn', { texture: 'canvas', textureIntensity: 3 }, 'C4', 'textureIntensity', 'MAX-canvas');

  // charcoal grain / smudge / pressureVariance (charcoal host).
  add('grain-0', 'charcoal', { grainIntensity: 0 }, 'C4', 'grainIntensity', 'low(0)');
  add('grain-mid', 'charcoal', { grainIntensity: 1.25 }, 'C4', 'grainIntensity', 'mid(1.25)');
  add('grain-max', 'charcoal', { grainIntensity: 2.5 }, 'C4', 'grainIntensity', 'MAX(2.5)');
  add('smudge-0', 'charcoal', { smudgeAmount: 0 }, 'C4', 'smudgeAmount', 'low(0)');
  add('smudge-mid', 'charcoal', { smudgeAmount: 1 }, 'C4', 'smudgeAmount', 'mid(1)');
  add('smudge-max', 'charcoal', { smudgeAmount: 2 }, 'C4', 'smudgeAmount', 'MAX(2)');
  add('pressure-0', 'charcoal', { pressureVariance: 0 }, 'C4', 'pressureVariance', 'low(0)');
  add('pressure-mid', 'charcoal', { pressureVariance: 0.5 }, 'C4', 'pressureVariance', 'mid(0.5)');
  add('pressure-max', 'charcoal', { pressureVariance: 1 }, 'C4', 'pressureVariance', 'MAX(1)');
  // charcoal grain ceiling — the canonical "charcoal shreds small shapes".
  add('grain-max-pressuremax', 'charcoal', { grainIntensity: 2.5, smudgeAmount: 2, pressureVariance: 1 }, 'C4', 'charcoal-all-max', 'ALL-MAX');

  // wet-ink blur / bleed (wet-ink host).
  add('blur-0', 'wet-ink', { blurAmount: 0 }, 'C4', 'blurAmount', 'low(0)');
  add('blur-mid', 'wet-ink', { blurAmount: 0.75 }, 'C4', 'blurAmount', 'mid(0.75)');
  add('blur-max', 'wet-ink', { blurAmount: 1.5 }, 'C4', 'blurAmount', 'MAX(1.5)');
  add('bleed-0', 'wet-ink', { bleed: 0 }, 'C4', 'bleed', 'low(0)');
  add('bleed-mid', 'wet-ink', { bleed: 0.5 }, 'C4', 'bleed', 'mid(0.5)');
  add('bleed-max', 'wet-ink', { bleed: 1 }, 'C4', 'bleed', 'MAX(1)');
  add('wet-all-max', 'wet-ink', { blurAmount: 1.5, bleed: 1 }, 'C4', 'wet-all-max', 'ALL-MAX');

  // roughness == jaggedness (rough-handdrawn host) — the "roughness" the task
  // names is the jaggedness knob (the dead `roughness` field was deleted; rough.js
  // roughness is driven by jaggedness per modifierSpecs comment).
  add('jagged-0', 'rough-handdrawn', { jaggedness: 0 }, 'C4', 'jaggedness(roughness)', 'low(0)');
  add('jagged-mid', 'rough-handdrawn', { jaggedness: 1 }, 'C4', 'jaggedness(roughness)', 'mid(1)');
  add('jagged-max', 'rough-handdrawn', { jaggedness: 2 }, 'C4', 'jaggedness(roughness)', 'MAX(2)');

  // ── CLUSTER 5 — color / palette ──
  // strokePalette + fillPalette: each of the 10 modes. Host rough-handdrawn
  // (exposes both + has real fills via smartHachure to show fillPalette).
  const PALETTES = ['source', 'primary', 'body', 'body-soft', 'secondary', 'detail', 'accent', 'bg', 'neutral', 'inverted'];
  for (const p of PALETTES) {
    add(`strokePal-${p}`, 'rough-handdrawn', { strokePalette: p }, 'C5', 'strokePalette', p);
  }
  for (const p of PALETTES) {
    add(`fillPal-${p}`, 'rough-handdrawn', { fillPalette: p }, 'C5', 'fillPalette', p);
  }
  // inkIntensity low / mid / high (rough-handdrawn host).
  add('ink-low', 'rough-handdrawn', { inkIntensity: 0.1 }, 'C5', 'inkIntensity', 'low(0.1)');
  add('ink-mid', 'rough-handdrawn', { inkIntensity: 0.5 }, 'C5', 'inkIntensity', 'mid(0.5)');
  add('ink-high', 'rough-handdrawn', { inkIntensity: 1.0 }, 'C5', 'inkIntensity', 'high(1.0)');
  // inkIntensity 0 — the floor (does ink vanish entirely?).
  add('ink-zero', 'rough-handdrawn', { inkIntensity: 0 }, 'C5', 'inkIntensity', 'zero(0)');

  // ── GEOMETRY — simplify ──
  // simplification low / mid / high (rough-handdrawn host — runs the path RDP).
  add('simplify-low', 'rough-handdrawn', { simplification: 0 }, 'GEO', 'simplification', 'low(0)');
  add('simplify-mid', 'rough-handdrawn', { simplification: 1.0 }, 'GEO', 'simplification', 'mid(1.0)');
  add('simplify-high', 'rough-handdrawn', { simplification: 2.0 }, 'GEO', 'simplification', 'high(2.0)');

  return states;
}

const ALL_STATES = buildStates().filter((s) => !ONLY || ONLY.has(s.id) || s.id === 'clean');

// ─── Main ────────────────────────────────────────────────────────────────────
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1600, height: 1200 },
  deviceScaleFactor: 1,
});

let curConsole = [];
page.on('console', (m) => { if (m.type() === 'error') curConsole.push(m.text()); });
page.on('pageerror', (e) => curConsole.push(String(e)));

await page.goto(BASE_URL, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__sweepReady === true, null, { timeout: 30000 });

const inventory = await page.evaluate(() => window.__sweep.inventory);
console.log(`inventory: ${inventory.length} shapes · states: ${ALL_STATES.length}`);
if (inventory.length !== 197) {
  console.warn(`⚠ EXPECTED 197 shapes, got ${inventory.length} — reporting actual count.`);
}

mkdirSync(join(OUT_DIR, 'shots'), { recursive: true });
mkdirSync(join(OUT_DIR, 'mosaics'), { recursive: true });

async function scanNonFinite() {
  return page.evaluate(() => {
    const bad = {};
    const els = document.querySelectorAll('#grid [data-shape-id] svg *');
    for (const el of els) {
      const cell = el.closest('[data-shape-id]');
      const shape = cell?.getAttribute('data-shape-id') ?? '?';
      for (const attr of ['d', 'points', 'x', 'y', 'cx', 'cy', 'r', 'rx', 'ry', 'x1', 'y1', 'x2', 'y2', 'width', 'height', 'transform']) {
        const v = el.getAttribute(attr);
        if (!v) continue;
        if (/NaN|Infinity|undefined|null/i.test(v)) {
          (bad[shape] ??= []).push(`${attr}=${v.slice(0, 40)}`);
        }
      }
    }
    return bad;
  });
}

function cssEscape(s) { return s.replace(/["\\]/g, '\\$&'); }

function buildMosaic(state, cells) {
  if (!cells.length) return;
  const cw = cells[0].width, ch = cells[0].height;
  const COLS = 14;
  const rows = Math.ceil(cells.length / COLS);
  const G = 2;
  const W = COLS * (cw + G) + G;
  const H = rows * (ch + G) + G;
  const sheet = Buffer.alloc(W * H * 4, 255);
  cells.forEach((img, i) => {
    const col = i % COLS, row = Math.floor(i / COLS);
    const ox = G + col * (cw + G), oy = G + row * (ch + G);
    for (let y = 0; y < img.height; y++) {
      const src = y * img.width * 4;
      const dst = ((oy + y) * W + ox) * 4;
      img.rgba.copy(sheet, dst, src, src + img.width * 4);
    }
  });
  writeFileSync(join(OUT_DIR, 'mosaics', `${state}.png`), encodePng(W, H, sheet));
}

const records = [];
const cleanByShape = {}; // shape -> { inkFrac } from the clean pass

for (const st of ALL_STATES) {
  curConsole = [];
  await page.evaluate(({ style, mods }) => window.__sweep.setState(style, mods), { style: st.style, mods: st.mods });
  await page.waitForTimeout(140); // settle for filter-heavy states
  const nonFinite = await scanNonFinite();
  mkdirSync(join(OUT_DIR, 'shots', st.id), { recursive: true });

  const cells = [];
  let flaggedThisState = 0;
  for (const inv of inventory) {
    const loc = page.locator(`#grid [data-shape-id="${cssEscape(inv.shape)}"]`).first();
    let buf;
    try {
      buf = await loc.screenshot();
    } catch (e) {
      records.push({ state: st.id, ...st, ...inv, error: String(e), flags: ['CONSOLE'] });
      continue;
    }
    const img = decodePng(buf);
    const m = analyze(img);
    const flags = [];
    if (m.inkFrac < BLANK_INK_FRAC) flags.push('BLANK');
    if (m.darkFrac > FLOOD_DARK_FRAC) flags.push('FLOOD');
    if (m.edgeFrac > OVERFLOW_RING_FRAC) flags.push('OVERFLOW');
    if (nonFinite[inv.shape]) flags.push('BROKEN');

    // vs-Clean comparisons (skip for the clean pass itself)
    const clean = cleanByShape[inv.shape];
    if (st.id !== 'clean' && clean) {
      if (clean.inkFrac > CLEAN_HAS_INK &&
          m.inkFrac < clean.inkFrac * LOST_REL_FRAC &&
          m.inkFrac < LOST_ABS_FRAC) {
        flags.push('LOST');
      }
      if (clean.inkFrac > 0 &&
          m.inkFrac > clean.inkFrac * PAPERFLOOD_REL &&
          m.domToneFrac > PAPERFLOOD_COVER) {
        flags.push('PAPERFLOOD');
      }
    }

    if (flags.length) flaggedThisState++;
    records.push({
      state: st.id,
      cluster: st.cluster,
      style: st.style,
      toggle: st.toggle,
      level: st.level,
      kind: inv.kind,
      shape: inv.shape,
      label: inv.label,
      subjectName: inv.subjectName,
      inkFrac: +m.inkFrac.toFixed(4),
      darkFrac: +m.darkFrac.toFixed(4),
      edgeFrac: +m.edgeFrac.toFixed(4),
      domToneFrac: +m.domToneFrac.toFixed(4),
      cleanInk: clean ? +clean.inkFrac.toFixed(4) : null,
      nonFinite: nonFinite[inv.shape] ?? null,
      flags,
      shot: `shots/${st.id}/${inv.shape}.png`,
    });
    writeFileSync(join(OUT_DIR, 'shots', st.id, `${inv.shape}.png`), buf);
    cells.push(img);
    if (st.id === 'clean') cleanByShape[inv.shape] = { inkFrac: m.inkFrac };
  }
  buildMosaic(st.id, cells);
  const consoleErrs = curConsole.slice(0, 40);
  console.log(`[${st.id}] (${st.cluster} ${st.toggle}=${st.level}) ${cells.length} cells · flagged ${flaggedThisState}` +
    (consoleErrs.length ? ` · console errors ${consoleErrs.length}` : ''));
  if (consoleErrs.length) {
    records.push({ state: st.id, cluster: st.cluster, toggle: st.toggle, level: st.level, shape: '(state-pass)', label: 'console', flags: ['CONSOLE'], error: consoleErrs.join(' | ').slice(0, 400) });
  }
}

// ─── Table + JSON ────────────────────────────────────────────────────────────
const tested = records.filter((r) => r.shape !== '(state-pass)');
const flagged = tested.filter((r) => r.flags && r.flags.length);
const lines = [
  '# 2D audit-catalog TOGGLE-CLUSTER sweep — Cluster 4 + 5 + geometry, vs Clean',
  '',
  `Run: ${new Date().toISOString()}`,
  `Inventory: ${inventory.length} shapes × ${ALL_STATES.length} states = ${tested.length} cells rendered`,
  '',
  '## Per-state flag counts',
  '',
  '| state | cluster | toggle | level | cells | BLANK | FLOOD | OVERFLOW | BROKEN | LOST | PAPERFLOOD | CONSOLE |',
  '|---|---|---|---|---|---|---|---|---|---|---|---|',
];
for (const st of ALL_STATES) {
  const sc = tested.filter((r) => r.state === st.id);
  const cnt = (f) => sc.filter((r) => r.flags.includes(f)).length;
  const consoleHit = records.some((r) => r.state === st.id && r.shape === '(state-pass)');
  lines.push(`| ${st.id} | ${st.cluster} | ${st.toggle} | ${st.level} | ${sc.length} | ${cnt('BLANK')} | ${cnt('FLOOD')} | ${cnt('OVERFLOW')} | ${cnt('BROKEN')} | ${cnt('LOST')} | ${cnt('PAPERFLOOD')} | ${consoleHit ? 'yes' : '0'} |`);
}
lines.push('', '## Flagged cells', '');
if (!flagged.length) {
  lines.push('_None flagged._');
} else {
  lines.push('| state | cluster | toggle=level | shape (subject) | ink% | clean% | dark% | edge% | domTone% | flags |');
  lines.push('|---|---|---|---|---|---|---|---|---|---|');
  for (const r of flagged) {
    lines.push(`| ${r.state} | ${r.cluster} | ${r.toggle}=${r.level} | ${r.shape} (${r.subjectName ?? '?'}) | ${(r.inkFrac * 100).toFixed(1)} | ${r.cleanInk != null ? (r.cleanInk * 100).toFixed(1) : '-'} | ${(r.darkFrac * 100).toFixed(1)} | ${(r.edgeFrac * 100).toFixed(1)} | ${(r.domToneFrac * 100).toFixed(1)} | ${r.flags.join(' ')} |`);
  }
}
writeFileSync(join(OUT_DIR, 'sweep-table.md'), lines.join('\n'));
writeFileSync(join(OUT_DIR, 'results.json'), JSON.stringify(records, null, 2));

console.log(`\ncells: ${tested.length} · flagged: ${flagged.length}`);
console.log(`mosaics: ${ALL_STATES.length} → ${OUT_DIR}/mosaics/`);
console.log(`table: ${OUT_DIR}/sweep-table.md`);
await browser.close();
