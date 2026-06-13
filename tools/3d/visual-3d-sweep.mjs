// VISUAL 3D SWEEP — drives tools/3d/visual-3d-sweep.html headless.
//
//   node tools/3d/visual-3d-sweep.mjs                  (server on :5182)
//   SWEEP_URL=http://host/tools/3d/visual-3d-sweep.html node tools/3d/visual-3d-sweep.mjs
//   SHARD=0/4  → render shapes [0, 49); 1/4 → [49, 98); etc. (parallel shards)
//
// THE PIXELS LANE. Renders ALL 197 audit catalog shapes (PinShape +
// PegToolShape, deduped — the same inventory /audit + the geometry gauntlet
// use) through the REAL Stroke3DScene (production default props) in all 5
// geometry modes at 2 orbit azimuths each, plus the CLEAN SVG ground-truth in
// the same capture. Auto-flags the 3D scene region:
//   EMPTY    — ink coverage < 0.4% of the scene region (nothing rendered)
//   BLOB     — dark pixels (luma < 70) > 60% of the scene region (flat-black)
//   WALL     — ink coverage > 85% (form fills the camera, no edges/depth read)
//   NANS     — non-finite vertex positions in the rebuilt geometry
//   CONSOLE  — console errors / pageerrors during the render
//   FALLBACK — informational: forced mode degraded (honest degenerate path)
//
// Outputs (all under /tmp/dd-vsweep/ — sharded subdir if SHARD set):
//   shots/NNN-<shape>-<mode>-a<deg>.png   per-render captures (clean+3D stacked)
//   sheets/sheet-N.png                    contact sheets (clean+3D cells)
//   results.json                          raw per-render records
//   sweep-table.md                        per-shape×mode×angle table
//
// No new deps: PNG decode/encode on node:zlib.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import zlib from 'node:zlib';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let chromium;
for (const p of [
  '/tmp/dd-pp/node_modules/playwright',
  '/Users/sebs/Desktop/Projects/portfolio/tools/lab-screenshots/node_modules/playwright',
]) {
  try {
    ({ chromium } = require(p));
    break;
  } catch {
    /* try next */
  }
}
if (!chromium) {
  console.error('FATAL: playwright not found');
  process.exit(2);
}

const BASE_URL = process.env.SWEEP_URL ?? 'http://localhost:5182/tools/3d/visual-3d-sweep.html';
const SHARD = process.env.SHARD ?? null; // "i/n"
const OUT_DIR = SHARD ? `/tmp/dd-vsweep/shard-${SHARD.replace('/', '-')}` : '/tmp/dd-vsweep';
const MODES = ['auto', 'rod', 'extrude', 'inflate', 'solid'];
const AZIMUTHS = [0, 55]; // canonical 3/4 + a rotated 3/4 (second orbit angle)
const SHEET_ROWS = 5; // shapes per sheet (× MODES × AZIMUTHS cells per row group)

// Capture geometry (must match visual-3d-sweep.html):
//   label 22px · clean 150px · scene 320px → total capture height ~494px
const CLEAN_Y0 = 22, CLEAN_Y1 = 22 + 150;
const SCENE_Y0 = 22 + 150 + 2, SCENE_Y1 = 22 + 150 + 318; // inside scene border
const SCENE_X0 = 2, SCENE_X1 = 318;
const PAPER = [253, 252, 249];
const INK_DIST_THRESHOLD = 60;
const DARK_LUMA = 70;
const EMPTY_INK_FRAC = 0.004;
const BLOB_DARK_FRAC = 0.6;
const WALL_INK_FRAC = 0.85;

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

// ─── Pixel metrics over a y-band of the capture (scene region) ──────────────
function analyze(img, y0, y1) {
  const { width, rgba } = img;
  let total = 0, ink = 0, dark = 0;
  let lumaSum = 0, lumaSq = 0;
  for (let y = y0; y < y1; y++) {
    for (let x = SCENE_X0; x < SCENE_X1; x++) {
      const i = (y * width + x) * 4;
      const r = rgba[i], g = rgba[i + 1], b = rgba[i + 2];
      total++;
      const dist = Math.abs(r - PAPER[0]) + Math.abs(g - PAPER[1]) + Math.abs(b - PAPER[2]);
      const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      if (dist > INK_DIST_THRESHOLD) {
        ink++;
        lumaSum += luma;
        lumaSq += luma * luma;
      }
      if (luma < DARK_LUMA) dark++;
    }
  }
  const inkFrac = ink / total;
  const darkFrac = dark / total;
  const meanLuma = ink > 0 ? lumaSum / ink : 0;
  const lumaStd = ink > 0 ? Math.sqrt(Math.max(lumaSq / ink - meanLuma * meanLuma, 0)) : 0;
  return { inkFrac, darkFrac, meanLuma, lumaStd };
}

// ─── Main ────────────────────────────────────────────────────────────────────
mkdirSync(join(OUT_DIR, 'shots'), { recursive: true });
mkdirSync(join(OUT_DIR, 'sheets'), { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 360, height: 520 } });
const consoleErrors = [];
page.on('console', (m) => {
  if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200));
});
page.on('pageerror', (e) => consoleErrors.push('PAGEERR ' + String(e).slice(0, 200)));

console.log('→', BASE_URL);
await page.goto(BASE_URL, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__vsweepReady === true, null, { timeout: 60000 });

const shapes = await page.evaluate(() => window.__vsweep.shapes);
console.log(`inventory: ${shapes.length} shapes`);

let lo = 0, hi = shapes.length;
if (SHARD) {
  const [i, n] = SHARD.split('/').map(Number);
  const per = Math.ceil(shapes.length / n);
  lo = i * per;
  hi = Math.min(lo + per, shapes.length);
  console.log(`SHARD ${SHARD}: shapes [${lo}, ${hi})`);
}

const records = [];
const cells = [];
const capture = page.locator('#capture');

let done = 0;
const totalShapes = hi - lo;
for (let idx = lo; idx < hi; idx++) {
  const s = shapes[idx];
  const prep = await page.evaluate((i) => window.__vsweep.prepare(i), idx);
  done++;
  process.stdout.write(
    `[${done}/${totalShapes}] ${s.kind}/${s.shape} (${s.subjectId}) — ${prep.strokeCount} strokes`,
  );
  const badThisShape = [];
  for (const mode of MODES) {
    for (const az of AZIMUTHS) {
      const errBase = consoleErrors.length;
      let intro = null;
      let renderError = null;
      try {
        intro = await page.evaluate(([i, m, a]) => window.__vsweep.render(i, m, a), [idx, mode, az]);
      } catch (e) {
        renderError = String(e);
      }
      const shotName = `${String(idx).padStart(3, '0')}-${s.shape}-${mode}-a${az}.png`;
      const buf = await capture.screenshot({ path: join(OUT_DIR, 'shots', shotName) });
      const img = decodePng(buf);
      const m3d = analyze(img, SCENE_Y0, SCENE_Y1);
      const errs = consoleErrors.slice(errBase);
      const flags = [];
      if (m3d.inkFrac < EMPTY_INK_FRAC) flags.push('EMPTY');
      if (m3d.darkFrac > BLOB_DARK_FRAC) flags.push('BLOB');
      if (m3d.inkFrac > WALL_INK_FRAC) flags.push('WALL');
      if (intro?.nonFinite) flags.push('NANS');
      if (errs.length > 0 || renderError) flags.push('CONSOLE');
      if ((intro?.fallbacks ?? 0) > 0) flags.push(`FALLBACK×${intro.fallbacks}`);
      records.push({
        idx,
        kind: s.kind,
        shape: s.shape,
        subjectId: s.subjectId,
        label: s.label,
        mode,
        azimuth: az,
        strokes: prep.strokeCount,
        points: prep.pointCount,
        skippedText: prep.skippedTextElements,
        inkFrac: +m3d.inkFrac.toFixed(4),
        darkFrac: +m3d.darkFrac.toFixed(4),
        meanLuma: +m3d.meanLuma.toFixed(1),
        lumaStd: +m3d.lumaStd.toFixed(1),
        kinds: intro?.kinds ?? [],
        fallbacks: intro?.fallbacks ?? 0,
        errors: renderError ? [...errs, renderError] : errs,
        flags,
        shot: `shots/${shotName}`,
      });
      cells.push(img);
      const hard = flags.filter((f) => !f.startsWith('FALLBACK'));
      if (hard.length) badThisShape.push(`${mode}@${az}:${hard.join(',')}`);
    }
  }
  process.stdout.write(badThisShape.length ? `  ⚠ ${badThisShape.join(' ')}\n` : '  ok\n');
}

// ─── Contact sheets: SHEET_ROWS shapes per sheet, each shape = a row group of
//     (MODES × AZIMUTHS) capture cells (clean+3D stacked, so the eye compares
//     3D vs Clean within each cell AND scans the mode/angle progression). ─────
const cellW = cells[0]?.width ?? 320;
const cellH = cells[0]?.height ?? 494;
const PER_SHAPE = MODES.length * AZIMUTHS.length; // 10
const GUTTER = 4;
const COLS = PER_SHAPE; // one row group per shape, all its mode×angle cells
const perSheet = SHEET_ROWS * PER_SHAPE;
const sheetCount = Math.ceil(cells.length / perSheet);
for (let sh = 0; sh < sheetCount; sh++) {
  const slice = cells.slice(sh * perSheet, (sh + 1) * perSheet);
  const rows = Math.ceil(slice.length / COLS);
  const W = COLS * (cellW + GUTTER) + GUTTER;
  const H = rows * (cellH + GUTTER) + GUTTER;
  const sheet = Buffer.alloc(W * H * 4, 235);
  slice.forEach((img, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const ox = GUTTER + col * (cellW + GUTTER);
    const oy = GUTTER + row * (cellH + GUTTER);
    for (let y = 0; y < img.height; y++) {
      const src = y * img.width * 4;
      const dst = ((oy + y) * W + ox) * 4;
      img.rgba.copy(sheet, dst, src, src + img.width * 4);
    }
  });
  writeFileSync(join(OUT_DIR, 'sheets', `sheet-${String(sh + 1).padStart(2, '0')}.png`), encodePng(W, H, sheet));
}

// ─── Table + JSON ────────────────────────────────────────────────────────────
const lines = [
  '# Visual 3D sweep — per-shape × mode × angle (REAL Stroke3DScene, pixels)',
  '',
  `Run: ${new Date().toISOString()} · shard ${SHARD ?? 'full'} · ${totalShapes} shapes × ${MODES.length} modes × ${AZIMUTHS.length} angles = ${records.length} renders`,
  '',
  '| idx | kind/shape (subject) | mode | az | strokes | ink% | dark% | lumaσ | kinds | flags |',
  '|---|---|---|---|---|---|---|---|---|---|',
];
for (const r of records) {
  const kindsStr = r.kinds
    .map((k) => (k.requested === k.actual ? k.actual : `${k.requested}→${k.actual}`))
    .join(' ')
    .slice(0, 50);
  lines.push(
    `| ${r.idx} | ${r.kind}/${r.shape} (${r.subjectId}) | ${r.mode} | ${r.azimuth} | ${r.strokes} | ` +
      `${(r.inkFrac * 100).toFixed(1)} | ${(r.darkFrac * 100).toFixed(1)} | ${r.lumaStd} | ` +
      `${kindsStr} | ${r.flags.join(' ') || 'ok'} |`,
  );
}
const failing = records.filter((r) => r.flags.some((f) => !f.startsWith('FALLBACK')));
lines.push('', `## Summary`, '', `- renders: ${records.length}`, `- hard-flagged: ${failing.length}`);
for (const r of failing) {
  lines.push(
    `  - ${r.kind}/${r.shape} · ${r.mode}@${r.azimuth}: ${r.flags.join(' ')} (${r.errors.join('; ').slice(0, 160)})`,
  );
}
writeFileSync(join(OUT_DIR, 'sweep-table.md'), lines.join('\n'));
writeFileSync(join(OUT_DIR, 'results.json'), JSON.stringify(records, null, 2));

console.log(`\nrenders: ${records.length} · hard-flagged: ${failing.length}`);
console.log(`sheets: ${sheetCount} → ${OUT_DIR}/sheets/`);
console.log(`table: ${OUT_DIR}/sweep-table.md`);
await browser.close();
