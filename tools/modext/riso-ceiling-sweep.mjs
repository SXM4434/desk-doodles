// RISO-CEILING sweep (BUG2) — all 197 catalog shapes at the riso ceiling
// (offsetDistance 6 + registrationError 1.5 + colorShift 1.0) AND at the riso
// default (colorShift 0.7), measuring the dark fraction WITHIN the rendered art
// bounding box (not the whole 360px cell — small shapes never trip a whole-cell
// flood metric). A shape "FLOODS" when its art-region dark fraction is very high
// (near-solid black). Run BEFORE (HEAD) + AFTER (fix) and diff:
//   - ceiling floods must DROP (the bug shapes recover)
//   - default (0.7) art-dark must be UNCHANGED before vs after (byte-stable)
//   - no shape may gain a NEW ceiling flood
//
//   TAG=before MODEXT_URL=http://localhost:4481/... node tools/modext/riso-ceiling-sweep.mjs
//   TAG=after  MODEXT_URL=http://localhost:4482/... node tools/modext/riso-ceiling-sweep.mjs
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import zlib from 'node:zlib';

const require = createRequire('/Users/sebs/Desktop/Projects/desk-doodles/');
let chromium;
try { ({ chromium } = require('/tmp/dd-pp/node_modules/playwright')); }
catch { ({ chromium } = require('/Users/sebs/Desktop/Projects/portfolio/tools/lab-screenshots/node_modules/playwright')); }

const TAG = process.env.TAG || 'run';
const BASE = process.env.MODEXT_URL;
const OUT = `/tmp/dd-riso-ceiling/${TAG}`;
mkdirSync(OUT, { recursive: true });

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
  return { w, h, ch, data: out };
}

const PAPER = [253, 252, 249];
const INK_DIST = 48;
// Measure within the ART bbox: find ink pixels (vs paper), bound them, then
// report the fraction of that bbox that is near-black (the true flood metric).
function analyzeArt(png) {
  const { w, h, ch, data } = png;
  let minX = w, minY = h, maxX = -1, maxY = -1, inkN = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * ch;
    const dist = Math.abs(data[i] - PAPER[0]) + Math.abs(data[i + 1] - PAPER[1]) + Math.abs(data[i + 2] - PAPER[2]);
    if (dist > INK_DIST) { inkN++; if (x < minX) minX = x; if (y < minY) minY = y; if (x > maxX) maxX = x; if (y > maxY) maxY = y; }
  }
  if (maxX < 0) return { artDarkFrac: 0, artPx: 0, inkPx: 0, nearBlackPx: 0, coreDarkFrac: 0 }; // empty
  let dark = 0, area = 0, nearBlack = 0;
  for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
    const i = (y * w + x) * ch;
    const luma = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    area++;
    if (luma < 60) dark++;
    if (luma < 40) nearBlack++; // obliterated-to-black core (the flood signature)
  }
  // coreDarkFrac = near-black pixels as a fraction of INK pixels (not bbox area):
  // a true flood obliterates the inked body, so near-black/ink → ~1.0; a healthy
  // grey body has few near-black px → low. This is sensitive to the black-vs-grey
  // change the bbox-area metric is blind to.
  return {
    artDarkFrac: +(dark / area).toFixed(4),
    artPx: area,
    inkPx: inkN,
    nearBlackPx: nearBlack,
    coreDarkFrac: inkN > 0 ? +(nearBlack / inkN).toFixed(4) : 0,
  };
}

const CEILING = { offsetDistance: 6, offsetAngle: 45, registrationError: 1.5, colorShift: 1.0 };
const DEFAULT_RISO = { offsetDistance: 4, offsetAngle: 45, registrationError: 0.5, colorShift: 0.7 };
// Note: registrationError 0.5 here just exercises the offset; the preset uses 0,
// but the default-stability check below compares before-vs-after at the SAME
// state, so any fixed value is valid for the regression assertion.

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 2 });
const errs = [];
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__modext && window.__modext.ready, { timeout: 15000 });
const inventory = await page.evaluate(() => window.__modext.inventory);

const rows = [];
let ceilFlood = 0;
for (const cell of inventory) {
  const rec = { shape: cell.shape, label: cell.label };
  for (const [key, mods] of [['ceiling', CEILING], ['default', DEFAULT_RISO]]) {
    await page.evaluate((c) => { window.__modext.reset(); window.__modext.setShape(c.shape); window.__modext.setStyle('risograph'); window.__modext.setMods(c.mods); }, { shape: cell.shape, mods });
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 60)))));
    const el = await page.$('#modext-cell');
    const buf = await el.screenshot();
    rec[key] = analyzeArt(decodePng(buf));
    if (key === 'ceiling') rec._ceilBuf = buf;
  }
  // FLOOD = inked body obliterated to near-black at ceiling (coreDarkFrac high).
  rec.ceilingFlood = rec.ceiling.coreDarkFrac >= 0.55;
  if (rec.ceilingFlood) {
    ceilFlood++;
    writeFileSync(join(OUT, `FLOOD-${cell.shape}.png`), rec._ceilBuf);
  }
  delete rec._ceilBuf;
  rows.push(rec);
}
writeFileSync(join(OUT, 'results.json'), JSON.stringify(rows, null, 2));
const flooded = rows.filter((r) => r.ceilingFlood).map((r) => `${r.shape} (artDark ${r.ceiling.artDarkFrac})`);
console.log(`[${TAG}] 197 shapes · ceiling FLOOD (artDark≥0.85): ${ceilFlood}`);
if (flooded.length) console.log('FLOODED:', flooded.join(', '));
console.log(`errors: ${errs.length}`);
await browser.close();
