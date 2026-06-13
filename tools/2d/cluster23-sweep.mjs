// Cluster 2 (pen tip) + Cluster 3 (shading/fill) TOGGLE sweep driver.
//
//   SWEEP_URL=http://localhost:5294/tools/2d/cluster23-sweep.html \
//     node tools/2d/cluster23-sweep.mjs
//
// Renders the REAL /audit inventory (197 shapes) through the REAL
// SvgStyleTransform 2D path (smartHachure ON) on base style 'rough-handdrawn'
// (where every Cluster 2/3 toggle is live), swept across:
//
//   CLUSTER 2 (pen tip register):
//     penTip            — plain ballpoint fineliner pencil-hb pencil-2b felt-tip chisel charcoal  (8 each = its own LOW/MID/HIGH-ish family)
//     texture           — none light heavy chalky paper-tooth ribbed stipple wet-ink smudge canvas (10)
//     textureIntensity  — LOW 0.0 / MID 1.0 / HIGH 3.0
//   CLUSTER 3 (shading / fill):
//     fillStyle         — hachure cross-hatch dots zigzag dashed solid none (7)
//     hachureGap        — LOW 1 / MID 6 / HIGH 12
//     hachureAngle      — sweep: -90 / -41 / 0 / 45 / 90
//     fillDensity       — LOW 0.0 / MID 0.6 / HIGH 1.2
//     fillOpacity       — LOW 0.0 / MID 0.5 / HIGH 1.0
//
// Plus a CLEAN baseline per shape (the ground truth). Each toggle state is the
// rough-handdrawn base with ONE axis overridden, so a flag is attributable to
// that one axis. fillStyle / hachureGap / hachureAngle / fillDensity sweeps fix
// fillStyle='hachure' (or the swept value) so the hachure-fill axes actually
// engage; the dark-blob bug lives here (dark regions rendering flat-black vs
// hand-drawn hatching), so FLOOD flags are compared against the CLEAN render of
// the same shape (only flag if Clean was NOT itself a solid fill).
//
// Auto-flags per cell:
//   BLANK       — inkFrac < 0.2%
//   FLOOD       — darkFrac > 90% (solid-black blob)
//   OVERFLOW    — ink in the edge ring > 2%
//   BROKEN      — NaN/Infinity in geometry (DOM scan)
//   CONSOLE     — console error during the state pass
//   LOST-VS-CLEAN — Clean had real ink (inkFrac > 1%) AND was not a near-solid
//                   fill (darkFrac < 70%), but this state went BLANK or FLOOD →
//                   the toggle LOST the shape relative to Clean.
//
// Outputs under /tmp/dd-c23-sweep/:
//   shots/<state>/<shape>.png       per-cell captures
//   mosaics/<state>.png             per-state contact sheet (all 197)
//   results.json                    raw per-(shape,state) records
//   sweep-table.md                  flagged-cell table + summary
//
// No new deps: PNG decode/encode on node:zlib. Built on tools/2d/audit-style-sweep.mjs.
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

const BASE_URL = process.env.SWEEP_URL ?? 'http://localhost:5294/tools/2d/cluster23-sweep.html';
const OUT_DIR = '/tmp/dd-c23-sweep';
// Optional ONLY=clean,penTip-* filter (substring match on state id) for re-runs.
const ONLY = (process.env.ONLY ?? '').split(',').map((s) => s.trim()).filter(Boolean);

// Pixel thresholds (same as audit-style-sweep.mjs).
const PAPER = [253, 252, 249];
const INK_DIST_THRESHOLD = 60;
const DARK_LUMA = 60;
const BLANK_INK_FRAC = 0.002;
const FLOOD_DARK_FRAC = 0.9;
const EDGE_RING = 3;
const OVERFLOW_RING_FRAC = 0.02;
// CLEAN-baseline gates for LOST-VS-CLEAN.
const CLEAN_HAS_INK = 0.01;     // Clean inkFrac above this = the shape really rendered
const CLEAN_NOT_SOLID = 0.70;   // Clean darkFrac below this = Clean was not itself a solid blob

// ─── PNG decode ──────────────────────────────────────────────────────────────
function decodePng(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG');
  let off = 8, w = 0, h = 0, colorType = 0, bitDepth = 0;
  const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString('ascii', off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') {
      w = data.readUInt32BE(0); h = data.readUInt32BE(4); bitDepth = data[8]; colorType = data[9];
      if (data[12] !== 0) throw new Error('interlaced PNG unsupported');
      if (bitDepth !== 8 || (colorType !== 2 && colorType !== 6)) throw new Error(`unsupported PNG bd=${bitDepth} ct=${colorType}`);
    } else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    off += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const bpp = colorType === 6 ? 4 : 3;
  const stride = w * bpp;
  const out = Buffer.alloc(w * h * 4, 255);
  const prev = Buffer.alloc(stride), curr = Buffer.alloc(stride);
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
        case 4: { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
          v = (v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 0xff; break; }
      }
      curr[x] = v;
    }
    for (let x = 0; x < w; x++) {
      const s = x * bpp, d = (y * w + x) * 4;
      out[d] = curr[s]; out[d + 1] = curr[s + 1]; out[d + 2] = curr[s + 2];
      out[d + 3] = bpp === 4 ? curr[s + 3] : 255;
    }
    curr.copy(prev);
  }
  return { width: w, height: h, rgba: out };
}

// ─── PNG encode ──────────────────────────────────────────────────────────────
const CRC_TABLE = (() => { const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c; } return t; })();
function crc32(buf) { let c = ~0; for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8); return ~c >>> 0; }
function pngChunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0); out.write(type, 4, 'ascii'); data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length); return out;
}
function encodePng(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 6;
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) { raw[y * (stride + 1)] = 0; rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride); }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr), pngChunk('IDAT', zlib.deflateSync(raw, { level: 6 })), pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// ─── Pixel metrics ───────────────────────────────────────────────────────────
function analyze(img) {
  const { width, height, rgba } = img;
  const B = 2;
  let total = 0, ink = 0, dark = 0, edgeInk = 0, edgeTotal = 0;
  for (let y = B; y < height - B; y++) {
    for (let x = B; x < width - B; x++) {
      const i = (y * width + x) * 4;
      const r = rgba[i], g = rgba[i + 1], b = rgba[i + 2];
      total++;
      const dist = Math.abs(r - PAPER[0]) + Math.abs(g - PAPER[1]) + Math.abs(b - PAPER[2]);
      const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      const isInk = dist > INK_DIST_THRESHOLD;
      if (isInk) ink++;
      if (luma < DARK_LUMA) dark++;
      const inRing = y < B + EDGE_RING || y >= height - B - EDGE_RING || x < B + EDGE_RING || x >= width - B - EDGE_RING;
      if (inRing) { edgeTotal++; if (isInk) edgeInk++; }
    }
  }
  return { inkFrac: ink / total, darkFrac: dark / total, edgeFrac: edgeTotal > 0 ? edgeInk / edgeTotal : 0 };
}

// ─── Sweep matrix ────────────────────────────────────────────────────────────
// Each entry: { id, svgStyle, override } — override is spread onto baseRough
// (or baseClean for the clean baseline). `cluster` tags the report sections.
function buildStates(baseRough) {
  const PEN_TIPS = ['plain', 'ballpoint', 'fineliner', 'pencil-hb', 'pencil-2b', 'felt-tip', 'chisel', 'charcoal'];
  const TEXTURES = ['none', 'light', 'heavy', 'chalky', 'paper-tooth', 'ribbed', 'stipple', 'wet-ink', 'smudge', 'canvas'];
  const FILL_STYLES = ['hachure', 'cross-hatch', 'dots', 'zigzag', 'dashed', 'solid', 'none', 'zigzag-line'];
  const states = [];

  // CLEAN baseline (ground truth)
  states.push({ id: 'clean', cluster: 'baseline', svgStyle: 'clean', useClean: true, override: {} });

  // ── CLUSTER 2: pen tip register ──
  // penTip — each of 8 presets (its own family; texture pinned to none so the
  // pen tip's own ink character is isolated).
  for (const t of PEN_TIPS) {
    states.push({ id: `c2-penTip-${t}`, cluster: 'C2 penTip', svgStyle: 'rough-handdrawn',
      override: { penTip: t, texture: 'none', textureIntensity: 1.0 } });
  }
  // texture — each of 10 recipes at MID intensity, penTip plain.
  for (const tx of TEXTURES) {
    states.push({ id: `c2-texture-${tx}`, cluster: 'C2 texture', svgStyle: 'rough-handdrawn',
      override: { texture: tx, textureIntensity: 1.0, penTip: 'plain' } });
  }
  // textureIntensity LOW/MID/HIGH on a representative texture (paper-tooth, the
  // rough-handdrawn default texture) so the slider extremes are swept.
  for (const [lvl, v] of [['low', 0.0], ['mid', 1.0], ['high', 3.0]]) {
    states.push({ id: `c2-textureIntensity-${lvl}`, cluster: 'C2 textureIntensity', svgStyle: 'rough-handdrawn',
      override: { texture: 'paper-tooth', textureIntensity: v, penTip: 'plain' } });
  }

  // ── CLUSTER 3: shading / fill ──
  // fillStyle — each of 8 (the dark-blob bug lives in solid + dense hachure).
  for (const fs of FILL_STYLES) {
    states.push({ id: `c3-fillStyle-${fs}`, cluster: 'C3 fillStyle', svgStyle: 'rough-handdrawn',
      override: { fillStyle: fs } });
  }
  // hachureGap LOW/MID/HIGH (fillStyle hachure so the gap engages).
  for (const [lvl, v] of [['low', 1], ['mid', 6], ['high', 12]]) {
    states.push({ id: `c3-hachureGap-${lvl}`, cluster: 'C3 hachureGap', svgStyle: 'rough-handdrawn',
      override: { fillStyle: 'hachure', hachureGap: v } });
  }
  // hachureAngle sweep (fillStyle hachure).
  for (const a of [-90, -41, 0, 45, 90]) {
    states.push({ id: `c3-hachureAngle-${a}`, cluster: 'C3 hachureAngle', svgStyle: 'rough-handdrawn',
      override: { fillStyle: 'hachure', hachureAngle: a } });
  }
  // fillDensity LOW/MID/HIGH (fillStyle hachure).
  for (const [lvl, v] of [['low', 0.0], ['mid', 0.6], ['high', 1.2]]) {
    states.push({ id: `c3-fillDensity-${lvl}`, cluster: 'C3 fillDensity', svgStyle: 'rough-handdrawn',
      override: { fillStyle: 'hachure', fillDensity: v } });
  }
  // fillOpacity LOW/MID/HIGH (fillStyle solid so opacity bites a real fill —
  // this is where the dark blob can flat-fill or vanish).
  for (const [lvl, v] of [['low', 0.0], ['mid', 0.5], ['high', 1.0]]) {
    states.push({ id: `c3-fillOpacity-${lvl}-solid`, cluster: 'C3 fillOpacity', svgStyle: 'rough-handdrawn',
      override: { fillStyle: 'solid', fillOpacity: v } });
  }
  // fillOpacity also on hachure (the hand-drawn shading register).
  for (const [lvl, v] of [['low', 0.0], ['mid', 0.5], ['high', 1.0]]) {
    states.push({ id: `c3-fillOpacity-${lvl}-hachure`, cluster: 'C3 fillOpacity', svgStyle: 'rough-handdrawn',
      override: { fillStyle: 'hachure', fillOpacity: v } });
  }

  return states.map((s) => ({
    ...s,
    mods: s.useClean ? undefined : { ...baseRough, ...s.override },
  }));
}

// ─── Main ────────────────────────────────────────────────────────────────────
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1200 }, deviceScaleFactor: 1 });

let curConsole = [];
page.on('console', (m) => { if (m.type() === 'error') curConsole.push(m.text()); });
page.on('pageerror', (e) => curConsole.push(String(e)));

await page.goto(BASE_URL, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__sweepReady === true, null, { timeout: 30000 });

const inventory = await page.evaluate(() => window.__sweep.inventory);
const baseRough = await page.evaluate(() => window.__sweep.baseRough);
const baseClean = await page.evaluate(() => window.__sweep.baseClean);
console.log(`inventory: ${inventory.length} shapes`);
if (inventory.length !== 197) console.warn(`⚠ EXPECTED 197 shapes, got ${inventory.length}`);

let STATES = buildStates(baseRough);
if (ONLY.length) STATES = STATES.filter((s) => ONLY.some((o) => s.id.includes(o)));
// Always keep clean first so the LOST-VS-CLEAN comparison has its baseline.
if (!STATES.some((s) => s.id === 'clean')) {
  STATES.unshift({ id: 'clean', cluster: 'baseline', svgStyle: 'clean', useClean: true, mods: undefined, override: {} });
}
console.log(`states: ${STATES.length}`);

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
        if (/NaN|Infinity|undefined|null/i.test(v)) (bad[shape] ??= []).push(`${attr}=${v.slice(0, 40)}`);
      }
    }
    return bad;
  });
}

function cssEscape(s) { return s.replace(/["\\]/g, '\\$&'); }

function buildMosaic(state, cells) {
  if (!cells.length) return;
  const cw = cells[0].width, ch = cells[0].height;
  const COLS = 14, rows = Math.ceil(cells.length / COLS), G = 2;
  const W = COLS * (cw + G) + G, H = rows * (ch + G) + G;
  const sheet = Buffer.alloc(W * H * 4, 255);
  cells.forEach((img, i) => {
    const col = i % COLS, row = Math.floor(i / COLS);
    const ox = G + col * (cw + G), oy = G + row * (ch + G);
    for (let y = 0; y < img.height; y++) {
      const src = y * img.width * 4, dst = ((oy + y) * W + ox) * 4;
      img.rgba.copy(sheet, dst, src, src + img.width * 4);
    }
  });
  writeFileSync(join(OUT_DIR, 'mosaics', `${state}.png`), encodePng(W, H, sheet));
}

const records = [];
const cleanMetrics = {}; // shape -> {inkFrac, darkFrac} from the clean pass

for (const st of STATES) {
  curConsole = [];
  if (st.useClean) {
    await page.evaluate((mods) => window.__sweep.setState('clean', mods), baseClean);
  } else {
    await page.evaluate(({ svgStyle, mods }) => window.__sweep.setState(svgStyle, mods), { svgStyle: st.svgStyle, mods: st.mods });
  }
  await page.waitForTimeout(140); // settle filter-heavy textures
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
      records.push({ state: st.id, cluster: st.cluster, ...inv, error: String(e), flags: ['CONSOLE'] });
      continue;
    }
    const img = decodePng(buf);
    const m = analyze(img);
    if (st.useClean) cleanMetrics[inv.shape] = { inkFrac: m.inkFrac, darkFrac: m.darkFrac };

    const flags = [];
    if (m.inkFrac < BLANK_INK_FRAC) flags.push('BLANK');
    if (m.darkFrac > FLOOD_DARK_FRAC) flags.push('FLOOD');
    if (m.edgeFrac > OVERFLOW_RING_FRAC) flags.push('OVERFLOW');
    if (nonFinite[inv.shape]) flags.push('BROKEN');

    // LOST-VS-CLEAN — only for non-clean states.
    let lostVsClean = false;
    if (!st.useClean) {
      const cm = cleanMetrics[inv.shape];
      if (cm && cm.inkFrac > CLEAN_HAS_INK && cm.darkFrac < CLEAN_NOT_SOLID) {
        if (m.inkFrac < BLANK_INK_FRAC || m.darkFrac > FLOOD_DARK_FRAC) {
          flags.push('LOST-VS-CLEAN');
          lostVsClean = true;
        }
      }
    }
    if (flags.length) flaggedThisState++;
    records.push({
      state: st.id, cluster: st.cluster, kind: inv.kind, shape: inv.shape, label: inv.label,
      subjectId: inv.subjectId, subjectName: inv.subjectName,
      inkFrac: +m.inkFrac.toFixed(4), darkFrac: +m.darkFrac.toFixed(4), edgeFrac: +m.edgeFrac.toFixed(4),
      cleanInk: cleanMetrics[inv.shape] ? +cleanMetrics[inv.shape].inkFrac.toFixed(4) : null,
      cleanDark: cleanMetrics[inv.shape] ? +cleanMetrics[inv.shape].darkFrac.toFixed(4) : null,
      nonFinite: nonFinite[inv.shape] ?? null, lostVsClean, flags,
      shot: `shots/${st.id}/${inv.shape}.png`,
    });
    writeFileSync(join(OUT_DIR, 'shots', st.id, `${inv.shape}.png`), buf);
    cells.push(img);
  }
  buildMosaic(st.id, cells);
  const consoleErrs = curConsole.slice(0, 40);
  console.log(`[${st.id}] ${cells.length} cells · flagged ${flaggedThisState}${consoleErrs.length ? ` · console ${consoleErrs.length}` : ''}`);
  if (consoleErrs.length) records.push({ state: st.id, cluster: st.cluster, shape: '(state-pass)', label: 'console', flags: ['CONSOLE'], error: consoleErrs.join(' | ').slice(0, 400) });
}

// ─── Table + JSON ────────────────────────────────────────────────────────────
const tested = records.filter((r) => r.shape !== '(state-pass)');
const flagged = tested.filter((r) => r.flags && r.flags.length);
const lines = [
  '# Cluster 2 (pen tip) + Cluster 3 (shading/fill) — per-(shape,state) flag table',
  '',
  `Run: ${new Date().toISOString()}`,
  `Inventory: ${inventory.length} shapes × ${STATES.length} states = ${tested.length} cells rendered`,
  '',
  '## Per-state flag counts',
  '',
  '| state | cluster | cells | BLANK | FLOOD | OVERFLOW | BROKEN | LOST-VS-CLEAN | CONSOLE |',
  '|---|---|---|---|---|---|---|---|---|',
];
for (const st of STATES) {
  const sc = tested.filter((r) => r.state === st.id);
  const cnt = (f) => sc.filter((r) => r.flags.includes(f)).length;
  const consoleHit = records.some((r) => r.state === st.id && r.shape === '(state-pass)');
  lines.push(`| ${st.id} | ${st.cluster} | ${sc.length} | ${cnt('BLANK')} | ${cnt('FLOOD')} | ${cnt('OVERFLOW')} | ${cnt('BROKEN')} | ${cnt('LOST-VS-CLEAN')} | ${consoleHit ? 'yes' : '0'} |`);
}
lines.push('', '## Flagged cells', '');
if (!flagged.length) lines.push('_None flagged._');
else {
  lines.push('| state | shape (subject) | ink% | dark% | edge% | cleanInk% | cleanDark% | flags |');
  lines.push('|---|---|---|---|---|---|---|---|');
  for (const r of flagged) {
    lines.push(`| ${r.state} | ${r.shape} (${r.subjectName ?? '?'}) | ${(r.inkFrac * 100).toFixed(1)} | ${(r.darkFrac * 100).toFixed(1)} | ${(r.edgeFrac * 100).toFixed(1)} | ${r.cleanInk != null ? (r.cleanInk * 100).toFixed(1) : '-'} | ${r.cleanDark != null ? (r.cleanDark * 100).toFixed(1) : '-'} | ${r.flags.join(' ')} |`);
  }
}
writeFileSync(join(OUT_DIR, 'sweep-table.md'), lines.join('\n'));
writeFileSync(join(OUT_DIR, 'results.json'), JSON.stringify(records, null, 2));

console.log(`\ncells: ${tested.length} · flagged: ${flagged.length}`);
console.log(`mosaics: ${STATES.length} → ${OUT_DIR}/mosaics/`);
console.log(`table: ${OUT_DIR}/sweep-table.md`);
await browser.close();
