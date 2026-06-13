// 2D audit-catalog STYLE sweep — drives tools/2d/audit-style-sweep.html headless.
//
//   SWEEP_URL=http://localhost:5292/tools/2d/audit-style-sweep.html \
//     node tools/2d/audit-style-sweep.mjs
//
// Renders the REAL /audit inventory (deduped 197 shapes: 93 Trophy Wall
// PinShape + 104 Pegboard PegToolShape) through the REAL SvgStyleTransform 2D
// path (smartHachure ON) in EACH of the 11 F3 SVG styles (Clean, Outline only,
// Rough hand-drawn, Sketchy, Bold ink, Wet ink, Stipple, Charcoal, Risograph,
// Newsprint, Wireframe) — 197 × 11 = 2167 cells — and auto-flags:
//   BLANK    — almost no ink (inkFrac < 0.2%): nothing rendered
//   FLOOD    — dark pixels (luma < 60) > 90% of the cell: solid-black flood on
//              a shape that shouldn't be (the flat-black read)
//   OVERFLOW — ink touches the cell edge ring (form spills past the frame)
//   BROKEN   — NaN/Infinity in any rendered geometry coordinate (DOM scan)
//   CONSOLE  — console error / pageerror raised during this style pass
// Each cell is clipped by its data-shape-id box (deterministic 220px frame).
//
// Outputs (all under /tmp/dd-2d-sweep/):
//   shots/<style>/<shape>.png       per-cell captures
//   mosaics/<style>.png             per-style contact-sheet mosaic (all 197)
//   results.json                    raw per-(shape,style) records
//   sweep-table.md                  flagged-cell table + summary
//
// No new deps: PNG decode/encode on node:zlib. Twin of tools/3d/audit-sweep.mjs.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import zlib from 'node:zlib';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const PW =
  process.env.PW_PATH ??
  '/tmp/dd-pp/node_modules/playwright';
let chromium;
try {
  ({ chromium } = require(PW));
} catch {
  ({ chromium } = require(
    '/Users/sebs/Desktop/Projects/portfolio/tools/lab-screenshots/node_modules/playwright',
  ));
}

const BASE_URL =
  process.env.SWEEP_URL ?? 'http://localhost:5292/tools/2d/audit-style-sweep.html';
const OUT_DIR = '/tmp/dd-2d-sweep';

// Pixel thresholds.
const PAPER = [253, 252, 249]; // var(--dir-bg) light/w1
const INK_DIST_THRESHOLD = 60; // Σ|channel−paper| to count as ink
const DARK_LUMA = 60;
const BLANK_INK_FRAC = 0.002;
const FLOOD_DARK_FRAC = 0.9;
const EDGE_RING = 3; // px ring at the clip edge to test overflow
const OVERFLOW_RING_FRAC = 0.02; // ink in the edge ring above this = OVERFLOW

// ─── PNG decode (8-bit, color type 2/6, non-interlaced) ─────────────────────

function decodePng(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG');
  let off = 8;
  let w = 0, h = 0, colorType = 0, bitDepth = 0;
  const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString('ascii', off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') {
      w = data.readUInt32BE(0);
      h = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      if (data[12] !== 0) throw new Error('interlaced PNG unsupported');
      if (bitDepth !== 8 || (colorType !== 2 && colorType !== 6)) {
        throw new Error(`unsupported PNG bitDepth=${bitDepth} colorType=${colorType}`);
      }
    } else if (type === 'IDAT') {
      idat.push(data);
    } else if (type === 'IEND') break;
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
      out[d] = curr[s];
      out[d + 1] = curr[s + 1];
      out[d + 2] = curr[s + 2];
      out[d + 3] = bpp === 4 ? curr[s + 3] : 255;
    }
    curr.copy(prev);
  }
  return { width: w, height: h, rgba: out };
}

// ─── PNG encode (8-bit RGBA, filter 0) ───────────────────────────────────────

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
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
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

// ─── Pixel metrics over the whole clipped cell (minus the 1px guide border) ─

function analyze(img) {
  const { width, height, rgba } = img;
  const B = 2; // skip the 1px guide border + 1px safety
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
      // edge ring just inside the guide border
      const inRing =
        y < B + EDGE_RING || y >= height - B - EDGE_RING ||
        x < B + EDGE_RING || x >= width - B - EDGE_RING;
      if (inRing) {
        edgeTotal++;
        if (isInk) edgeInk++;
      }
    }
  }
  return {
    inkFrac: ink / total,
    darkFrac: dark / total,
    edgeFrac: edgeTotal > 0 ? edgeInk / edgeTotal : 0,
  };
}

// ─── Main ────────────────────────────────────────────────────────────────────

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1600, height: 1200 },
  deviceScaleFactor: 1,
});

// per-style console buckets
let curConsole = [];
page.on('console', (m) => {
  if (m.type() === 'error') curConsole.push(m.text());
});
page.on('pageerror', (e) => curConsole.push(String(e)));

await page.goto(BASE_URL, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__sweepReady === true, null, { timeout: 30000 });

const inventory = await page.evaluate(() => window.__sweep.inventory);
const styles = await page.evaluate(() => window.__sweep.styles);
console.log(`inventory: ${inventory.length} shapes · styles: ${styles.length}`);
if (inventory.length !== 197) {
  console.warn(`⚠ EXPECTED 197 shapes, got ${inventory.length} — reporting actual count.`);
}

mkdirSync(join(OUT_DIR, 'shots'), { recursive: true });
mkdirSync(join(OUT_DIR, 'mosaics'), { recursive: true });

// NaN/Infinity DOM scan: walk every rendered SVG geometry attribute for
// non-finite numbers (broken geometry). Runs once per style after the render.
async function scanNonFinite() {
  return page.evaluate(() => {
    const bad = {};
    const NUM = /-?\d*\.?\d+(?:e[-+]?\d+)?/gi;
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

const records = [];
const STYLE_ORDER = styles;

for (const style of STYLE_ORDER) {
  curConsole = [];
  await page.evaluate((s) => window.__sweep.setStyle(s), style);
  // small settle for filter-heavy styles (wet-ink/charcoal/risograph)
  await page.waitForTimeout(120);
  const nonFinite = await scanNonFinite();
  mkdirSync(join(OUT_DIR, 'shots', style), { recursive: true });

  const cells = []; // decoded for the mosaic, inventory order
  let flaggedThisStyle = 0;
  for (const inv of inventory) {
    const loc = page.locator(`#grid [data-shape-id="${cssEscape(inv.shape)}"]`).first();
    let buf;
    try {
      buf = await loc.screenshot();
    } catch (e) {
      records.push({ style, ...inv, error: String(e), flags: ['CONSOLE'] });
      continue;
    }
    const img = decodePng(buf);
    const m = analyze(img);
    const flags = [];
    if (m.inkFrac < BLANK_INK_FRAC) flags.push('BLANK');
    if (m.darkFrac > FLOOD_DARK_FRAC) flags.push('FLOOD');
    if (m.edgeFrac > OVERFLOW_RING_FRAC) flags.push('OVERFLOW');
    if (nonFinite[inv.shape]) flags.push('BROKEN');
    if (flags.length) flaggedThisStyle++;
    records.push({
      style,
      kind: inv.kind,
      shape: inv.shape,
      label: inv.label,
      subjectId: inv.subjectId,
      subjectName: inv.subjectName,
      inkFrac: +m.inkFrac.toFixed(4),
      darkFrac: +m.darkFrac.toFixed(4),
      edgeFrac: +m.edgeFrac.toFixed(4),
      nonFinite: nonFinite[inv.shape] ?? null,
      flags,
      shot: `shots/${style}/${inv.shape}.png`,
    });
    writeFileSync(join(OUT_DIR, 'shots', style, `${inv.shape}.png`), buf);
    cells.push(img);
  }
  // attach console flags raised during the whole style pass to a synthetic note
  const consoleErrs = curConsole.slice(0, 40);
  // build the mosaic for this style
  buildMosaic(style, cells, inventory);
  console.log(
    `[${style}] ${cells.length} cells · flagged ${flaggedThisStyle}` +
      (consoleErrs.length ? ` · console errors ${consoleErrs.length}` : ''),
  );
  if (consoleErrs.length) {
    records.push({ style, shape: '(style-pass)', label: 'console', flags: ['CONSOLE'], error: consoleErrs.join(' | ').slice(0, 400) });
  }
}

function cssEscape(s) {
  return s.replace(/["\\]/g, '\\$&');
}

function buildMosaic(style, cells, inv) {
  if (!cells.length) return;
  const cw = cells[0].width;
  const ch = cells[0].height;
  const COLS = 14;
  const rows = Math.ceil(cells.length / COLS);
  const G = 2;
  const W = COLS * (cw + G) + G;
  const H = rows * (ch + G) + G;
  const sheet = Buffer.alloc(W * H * 4, 255);
  cells.forEach((img, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const ox = G + col * (cw + G);
    const oy = G + row * (ch + G);
    for (let y = 0; y < img.height; y++) {
      const src = y * img.width * 4;
      const dst = ((oy + y) * W + ox) * 4;
      img.rgba.copy(sheet, dst, src, src + img.width * 4);
    }
  });
  writeFileSync(join(OUT_DIR, 'mosaics', `${style}.png`), encodePng(W, H, sheet));
}

// ─── Table + JSON ────────────────────────────────────────────────────────────

const tested = records.filter((r) => r.shape !== '(style-pass)');
const flagged = tested.filter((r) => r.flags && r.flags.length);
const lines = [
  '# 2D audit-catalog STYLE sweep — per-(shape,style) flag table',
  '',
  `Run: ${new Date().toISOString()}`,
  `Inventory: ${inventory.length} shapes × ${STYLE_ORDER.length} styles = ${tested.length} cells rendered`,
  `Styles: ${STYLE_ORDER.join(', ')}`,
  '',
  '## Per-style flag counts',
  '',
  '| style | cells | BLANK | FLOOD | OVERFLOW | BROKEN | CONSOLE |',
  '|---|---|---|---|---|---|---|',
];
for (const style of STYLE_ORDER) {
  const sc = tested.filter((r) => r.style === style);
  const cnt = (f) => sc.filter((r) => r.flags.includes(f)).length;
  const consoleHit = records.some((r) => r.style === style && r.shape === '(style-pass)');
  lines.push(
    `| ${style} | ${sc.length} | ${cnt('BLANK')} | ${cnt('FLOOD')} | ${cnt('OVERFLOW')} | ${cnt('BROKEN')} | ${consoleHit ? 'yes' : '0'} |`,
  );
}
lines.push('', '## Flagged cells', '');
if (!flagged.length) {
  lines.push('_None flagged._');
} else {
  lines.push('| style | shape (subject) | ink% | dark% | edge% | flags |');
  lines.push('|---|---|---|---|---|---|');
  for (const r of flagged) {
    lines.push(
      `| ${r.style} | ${r.shape} (${r.subjectName ?? '?'}) | ${(r.inkFrac * 100).toFixed(1)} | ${(r.darkFrac * 100).toFixed(1)} | ${(r.edgeFrac * 100).toFixed(1)} | ${r.flags.join(' ')} |`,
    );
  }
}
writeFileSync(join(OUT_DIR, 'sweep-table.md'), lines.join('\n'));
writeFileSync(join(OUT_DIR, 'results.json'), JSON.stringify(records, null, 2));

console.log(`\ncells: ${tested.length} · flagged: ${flagged.length}`);
console.log(`mosaics: ${STYLE_ORDER.length} → ${OUT_DIR}/mosaics/`);
console.log(`table: ${OUT_DIR}/sweep-table.md`);
await browser.close();
