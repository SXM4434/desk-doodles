// 3D audit-catalog heavy sweep — drives tools/3d/audit-sweep.html headless.
//
//   node tools/3d/audit-sweep.mjs            (dev server must be on :5182)
//
// Samples representative shapes from the REAL audit catalog (one form per
// subject across BOTH inventories — Trophy Wall PinShape + Pegboard
// PegToolShape — then extra forms round-robin to reach the target), renders
// each through the REAL Stroke3DScene in all 5 geometry modes, and auto-flags:
//   EMPTY    — ink coverage < 0.4% of frame (nothing rendered)
//   BLOB     — dark pixels (luma < 70) > 60% of frame (the flat-black read)
//   WALL     — ink coverage > 85% of frame (form fills the camera — no edges)
//   NANS     — non-finite vertex positions in the built geometry
//   CONSOLE  — console errors / pageerrors during the render
//   FALLBACK — informational: forced mode degraded to rod (honest degenerate
//              path by design — counted, not failed)
//
// Outputs (all under /tmp/dd-3d-sweep/):
//   shots/NNN-<shape>-<mode>.png   per-render captures
//   sheets/sheet-N.png             full-res grid contact sheets (6 shapes × 5 modes)
//   results.json                   raw per-render records
//   sweep-table.md                 per-shape×mode table
//
// No new deps: PNG decode/encode implemented on node:zlib.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import zlib from 'node:zlib';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require(
  '/Users/sebs/Desktop/Projects/portfolio/tools/lab-screenshots/node_modules/playwright',
);

const BASE_URL = process.env.SWEEP_URL ?? 'http://localhost:5182/tools/3d/audit-sweep.html';
const OUT_DIR = '/tmp/dd-3d-sweep';
const MODES = ['auto', 'rod', 'extrude', 'inflate', 'solid'];
const TARGET_SHAPES = 48;
const SHEET_ROWS = 6;

// Capture geometry (must match audit-sweep.html): label 22px + scene 320px.
const SCENE_X0 = 2, SCENE_X1 = 318, SCENE_Y0 = 24, SCENE_Y1 = 340;
const PAPER = [253, 252, 249];
const INK_DIST_THRESHOLD = 60; // Σ|channel−paper| — forms + their shadows
const DARK_LUMA = 70;
const EMPTY_INK_FRAC = 0.004;
const BLOB_DARK_FRAC = 0.6;
/** Form fills nearly the whole frame → camera-fill "wall" read (caught by eye
 *  on sweep run 1: warm-graphite walls slipped past the dark-luma blob flag). */
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
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
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

// ─── Pixel metrics (scene region only — skips label bar + border) ───────────

function analyze(img) {
  const { width, rgba } = img;
  let total = 0, ink = 0, dark = 0;
  let lumaSum = 0, lumaSq = 0;
  for (let y = SCENE_Y0; y < SCENE_Y1; y++) {
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

// ─── Representative selection: every subject first, extra forms to target ───

function selectRepresentative(shapes, target) {
  const groups = new Map();
  shapes.forEach((s, i) => {
    const k = `${s.kind}:${s.subjectId}`;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(i);
  });
  const picks = [];
  for (const idxs of groups.values()) picks.push(idxs[0]);
  let round = 1;
  while (picks.length < target) {
    let added = false;
    for (const idxs of groups.values()) {
      if (picks.length >= target) break;
      if (idxs.length > round) {
        picks.push(idxs[round]);
        added = true;
      }
    }
    if (!added) break;
    round++;
  }
  return picks.sort((a, b) => a - b);
}

// ─── Main ────────────────────────────────────────────────────────────────────

mkdirSync(join(OUT_DIR, 'shots'), { recursive: true });
mkdirSync(join(OUT_DIR, 'sheets'), { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
const consoleErrors = [];
page.on('console', (m) => {
  if (m.type() === 'error') consoleErrors.push(m.text());
});
page.on('pageerror', (e) => consoleErrors.push(String(e)));

await page.goto(BASE_URL, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__sweepReady === true, null, { timeout: 30000 });

const shapes = await page.evaluate(() => window.__sweep.shapes);
console.log(`inventory: ${shapes.length} shapes`);
const picks = selectRepresentative(shapes, TARGET_SHAPES);
console.log(`selected: ${picks.length} representative shapes (one per subject + extras)`);

const records = [];
const cells = []; // decoded captures in sweep order, for the contact sheets
const capture = page.locator('#capture');

let shapeNo = 0;
for (const idx of picks) {
  const s = shapes[idx];
  const prep = await page.evaluate((i) => window.__sweep.prepare(i), idx);
  shapeNo++;
  process.stdout.write(
    `[${shapeNo}/${picks.length}] ${s.kind}/${s.shape} (${s.subjectId}) — ${prep.strokeCount} strokes`,
  );
  for (const mode of MODES) {
    const errBase = consoleErrors.length;
    let intro = null;
    let renderError = null;
    try {
      intro = await page.evaluate(
        ([i, m]) => window.__sweep.render(i, m),
        [idx, mode],
      );
    } catch (e) {
      renderError = String(e);
    }
    const shotName = `${String(shapeNo).padStart(3, '0')}-${s.shape}-${mode}.png`;
    const buf = await capture.screenshot({ path: join(OUT_DIR, 'shots', shotName) });
    const img = decodePng(buf);
    const m = analyze(img);
    const errs = consoleErrors.slice(errBase);
    const flags = [];
    if (m.inkFrac < EMPTY_INK_FRAC) flags.push('EMPTY');
    if (m.darkFrac > BLOB_DARK_FRAC) flags.push('BLOB');
    if (m.inkFrac > WALL_INK_FRAC) flags.push('WALL');
    if (intro?.nonFinite) flags.push('NANS');
    if (errs.length > 0 || renderError) flags.push('CONSOLE');
    if ((intro?.fallbacks ?? 0) > 0) flags.push(`FALLBACK×${intro.fallbacks}`);
    records.push({
      shapeNo,
      kind: s.kind,
      shape: s.shape,
      subjectId: s.subjectId,
      label: s.label,
      mode,
      strokes: prep.strokeCount,
      points: prep.pointCount,
      skippedText: prep.skippedTextElements,
      inkFrac: +m.inkFrac.toFixed(4),
      darkFrac: +m.darkFrac.toFixed(4),
      meanLuma: +m.meanLuma.toFixed(1),
      lumaStd: +m.lumaStd.toFixed(1),
      kinds: intro?.kinds ?? [],
      fallbacks: intro?.fallbacks ?? 0,
      errors: renderError ? [...errs, renderError] : errs,
      flags,
      shot: `shots/${shotName}`,
    });
    cells.push(img);
  }
  const last5 = records.slice(-5);
  const bad = last5.flatMap((r) => r.flags.filter((f) => !f.startsWith('FALLBACK')));
  process.stdout.write(bad.length ? `  ⚠ ${bad.join(',')}\n` : '  ok\n');
}

// ─── Contact sheets (full-res grid: SHEET_ROWS shapes × 5 modes) ─────────────

const cellW = cells[0]?.width ?? 320;
const cellH = cells[0]?.height ?? 342;
const GUTTER = 4;
const perSheet = SHEET_ROWS * MODES.length;
const sheetCount = Math.ceil(cells.length / perSheet);
for (let sh = 0; sh < sheetCount; sh++) {
  const slice = cells.slice(sh * perSheet, (sh + 1) * perSheet);
  const rows = Math.ceil(slice.length / MODES.length);
  const W = MODES.length * (cellW + GUTTER) + GUTTER;
  const H = rows * (cellH + GUTTER) + GUTTER;
  const sheet = Buffer.alloc(W * H * 4, 255);
  slice.forEach((img, i) => {
    const col = i % MODES.length;
    const row = Math.floor(i / MODES.length);
    const ox = GUTTER + col * (cellW + GUTTER);
    const oy = GUTTER + row * (cellH + GUTTER);
    for (let y = 0; y < img.height; y++) {
      const src = y * img.width * 4;
      const dst = ((oy + y) * W + ox) * 4;
      img.rgba.copy(sheet, dst, src, src + img.width * 4);
    }
  });
  writeFileSync(join(OUT_DIR, 'sheets', `sheet-${sh + 1}.png`), encodePng(W, H, sheet));
}

// ─── Table + JSON ────────────────────────────────────────────────────────────

const lines = [
  '# 3D audit-catalog sweep — per-shape × mode table',
  '',
  `Run: ${new Date().toISOString()} · ${picks.length} shapes × ${MODES.length} modes = ${records.length} renders`,
  '',
  '| # | kind/shape (subject) | mode | strokes | ink% | dark% | lumaσ | kinds | flags |',
  '|---|---|---|---|---|---|---|---|---|',
];
for (const r of records) {
  const kindsStr = r.kinds
    .map((k) => (k.requested === k.actual ? k.actual : `${k.requested}→${k.actual}`))
    .join(' ')
    .slice(0, 60);
  lines.push(
    `| ${r.shapeNo} | ${r.kind}/${r.shape} (${r.subjectId}) | ${r.mode} | ${r.strokes} | ` +
      `${(r.inkFrac * 100).toFixed(1)} | ${(r.darkFrac * 100).toFixed(1)} | ${r.lumaStd} | ` +
      `${kindsStr} | ${r.flags.join(' ') || 'ok'} |`,
  );
}
const failing = records.filter((r) => r.flags.some((f) => !f.startsWith('FALLBACK')));
lines.push('', `## Summary`, '', `- renders: ${records.length}`, `- hard-flagged: ${failing.length}`);
for (const r of failing) {
  lines.push(`  - ${r.kind}/${r.shape} · ${r.mode}: ${r.flags.join(' ')} (${r.errors.join('; ').slice(0, 200)})`);
}
writeFileSync(join(OUT_DIR, 'sweep-table.md'), lines.join('\n'));
writeFileSync(join(OUT_DIR, 'results.json'), JSON.stringify(records, null, 2));

console.log(`\nrenders: ${records.length} · hard-flagged: ${failing.length}`);
console.log(`sheets: ${sheetCount} → ${OUT_DIR}/sheets/`);
console.log(`table: ${OUT_DIR}/sweep-table.md`);
await browser.close();
