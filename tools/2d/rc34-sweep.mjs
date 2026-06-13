// RC-3 / RC-4 ink-visibility sweep — drives tools/2d/rc34-sweep.html headless.
//
//   SWEEP_URL=http://localhost:5377/tools/2d/rc34-sweep.html node tools/2d/rc34-sweep.mjs
//
// Renders the REAL /audit inventory (197 shapes) through the REAL
// SvgStyleTransform 2D path. For every case (Clean ref + each strokePalette mode
// + each inkIntensity level, in both CSS and JS routes) it screenshots all 197
// cells, computes inkFrac, and flags BLANK (inkFrac < 0.2%) — the exact
// "ink vanished" signal RC-3/RC-4 are about. Builds one mosaic per case.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import zlib from 'node:zlib';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const PW = process.env.PW_PATH ?? '/tmp/dd-pp/node_modules/playwright';
let chromium;
try { ({ chromium } = require(PW)); }
catch { ({ chromium } = require('/Users/sebs/Desktop/Projects/portfolio/tools/lab-screenshots/node_modules/playwright')); }

const BASE_URL = process.env.SWEEP_URL ?? 'http://localhost:5377/tools/2d/rc34-sweep.html';
const OUT_DIR = '/tmp/dd-rc34';

const PAPER = [253, 252, 249];
const INK_DIST_THRESHOLD = 60;
const DARK_LUMA = 60;
const BLANK_INK_FRAC = 0.002;

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
      if (data[12] !== 0) throw new Error('interlaced');
      if (bitDepth !== 8 || (colorType !== 2 && colorType !== 6)) throw new Error(`unsupported ${bitDepth}/${colorType}`);
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
      const a = x >= bpp ? curr[x - bpp] : 0, b = prev[x], c = x >= bpp ? prev[x - bpp] : 0;
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

const CRC_TABLE = (() => { const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c; }
  return t; })();
function crc32(buf) { let c = ~0; for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8); return ~c >>> 0; }
function pngChunk(type, data) { const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0); out.write(type, 4, 'ascii'); data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length); return out; }
function encodePng(width, height, rgba) {
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 6;
  const stride = width * 4; const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) { raw[y * (stride + 1)] = 0; rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride); }
  return Buffer.concat([Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]),
    pngChunk('IHDR', ihdr), pngChunk('IDAT', zlib.deflateSync(raw, { level: 6 })), pngChunk('IEND', Buffer.alloc(0))]);
}

function analyze(img) {
  const { width, height, rgba } = img; const B = 2;
  let total = 0, ink = 0, dark = 0;
  for (let y = B; y < height - B; y++) for (let x = B; x < width - B; x++) {
    const i = (y * width + x) * 4; const r = rgba[i], g = rgba[i+1], b = rgba[i+2]; total++;
    const dist = Math.abs(r-PAPER[0])+Math.abs(g-PAPER[1])+Math.abs(b-PAPER[2]);
    const luma = 0.2126*r+0.7152*g+0.0722*b; const isInk = dist > INK_DIST_THRESHOLD;
    if (isInk) ink++; if (luma < DARK_LUMA) dark++;
  }
  return { inkFrac: ink/total, darkFrac: dark/total };
}

function cssEscape(s) { return s.replace(/["\\]/g, '\\$&'); }
function buildMosaic(name, cells) {
  if (!cells.length) return;
  const cw = cells[0].width, ch = cells[0].height, COLS = 14;
  const rows = Math.ceil(cells.length / COLS), G = 2;
  const W = COLS*(cw+G)+G, H = rows*(ch+G)+G;
  const sheet = Buffer.alloc(W*H*4, 255);
  cells.forEach((img, i) => {
    const col = i % COLS, row = Math.floor(i / COLS), ox = G+col*(cw+G), oy = G+row*(ch+G);
    for (let y = 0; y < img.height; y++) { const src = y*img.width*4, dst = ((oy+y)*W+ox)*4; img.rgba.copy(sheet, dst, src, src+img.width*4); }
  });
  writeFileSync(join(OUT_DIR, 'mosaics', `${name}.png`), encodePng(W, H, sheet));
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1200 }, deviceScaleFactor: 1 });
let curConsole = [];
page.on('console', (m) => { if (m.type() === 'error') curConsole.push(m.text()); });
page.on('pageerror', (e) => curConsole.push(String(e)));

await page.goto(BASE_URL, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__sweepReady === true, null, { timeout: 30000 });

const inventory = await page.evaluate(() => window.__sweep.inventory);
const cases = await page.evaluate(() => window.__sweep.cases);
console.log(`inventory: ${inventory.length} shapes · cases: ${cases.length}`);
if (inventory.length !== 197) console.warn(`⚠ EXPECTED 197 shapes, got ${inventory.length}`);

mkdirSync(join(OUT_DIR, 'mosaics'), { recursive: true });
mkdirSync(join(OUT_DIR, 'blanks'), { recursive: true });

const records = [];
for (const c of cases) {
  curConsole = [];
  await page.evaluate((id) => window.__sweep.setCase(id), c.id);
  await page.waitForTimeout(120);
  const cells = [];
  let blanks = 0; const blankShapes = [];
  for (const inv of inventory) {
    const loc = page.locator(`#grid [data-shape-id="${cssEscape(inv.shape)}"]`).first();
    let buf;
    try { buf = await loc.screenshot(); }
    catch (e) { records.push({ case: c.id, shape: inv.shape, error: String(e) }); continue; }
    const img = decodePng(buf); const m = analyze(img);
    const blank = m.inkFrac < BLANK_INK_FRAC;
    if (blank) { blanks++; blankShapes.push(inv.shape);
      writeFileSync(join(OUT_DIR, 'blanks', `${c.id}__${inv.shape}.png`), buf); }
    records.push({ case: c.id, style: c.style, note: c.note, shape: inv.shape, subjectName: inv.subjectName,
      inkFrac: +m.inkFrac.toFixed(4), darkFrac: +m.darkFrac.toFixed(4), blank });
    cells.push(img);
  }
  buildMosaic(c.id, cells);
  const consoleErrs = curConsole.slice(0, 20);
  console.log(`[${c.id}] (${c.note}) BLANK ${blanks}/${inventory.length}${consoleErrs.length ? ` · console ${consoleErrs.length}` : ''}` +
    (blankShapes.length ? ` · ${blankShapes.slice(0,5).join(',')}${blankShapes.length>5?'…':''}` : ''));
  if (consoleErrs.length) records.push({ case: c.id, shape: '(case)', error: consoleErrs.join(' | ').slice(0,400) });
}

const tested = records.filter((r) => r.shape !== '(case)' && !r.error);
const lines = [
  '# RC-3 / RC-4 ink-visibility sweep — per-case BLANK counts', '',
  `Run: ${new Date().toISOString()}`,
  `Inventory: ${inventory.length} shapes × ${cases.length} cases = ${tested.length} cells`,
  '', '## Per-case BLANK counts (BLANK = inkFrac < 0.2% = ink vanished)', '',
  '| case | note | BLANK / total | mean ink% | mean dark% |',
  '|---|---|---|---|---|',
];
for (const c of cases) {
  const sc = tested.filter((r) => r.case === c.id);
  const blanks = sc.filter((r) => r.blank).length;
  const meanInk = sc.length ? (sc.reduce((a, r) => a + r.inkFrac, 0) / sc.length * 100).toFixed(2) : '?';
  const meanDark = sc.length ? (sc.reduce((a, r) => a + r.darkFrac, 0) / sc.length * 100).toFixed(2) : '?';
  lines.push(`| ${c.id} | ${c.note} | ${blanks} / ${sc.length} | ${meanInk} | ${meanDark} |`);
}
const totalBlank = tested.filter((r) => r.blank).length;
lines.push('', `## Total BLANK cells across all cases: ${totalBlank}`, '');
if (totalBlank) {
  lines.push('| case | shape (subject) | ink% | dark% |', '|---|---|---|---|');
  for (const r of tested.filter((r) => r.blank))
    lines.push(`| ${r.case} | ${r.shape} (${r.subjectName ?? '?'}) | ${(r.inkFrac*100).toFixed(2)} | ${(r.darkFrac*100).toFixed(2)} |`);
}
writeFileSync(join(OUT_DIR, 'rc34-table.md'), lines.join('\n'));
writeFileSync(join(OUT_DIR, 'results.json'), JSON.stringify(records, null, 2));
console.log(`\ncells: ${tested.length} · total BLANK: ${totalBlank}`);
console.log(`mosaics: ${cases.length} → ${OUT_DIR}/mosaics/`);
console.log(`table: ${OUT_DIR}/rc34-table.md`);
await browser.close();
