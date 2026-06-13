// BUGFIX driver (2D render path) — focused before/after capture for the two
// sweep-found BAD renders, plus the 6-class regression ritual.
//
//   BUG1  fill-only shapes (poster rects: fill=STROKE token, NO stroke) render
//         BLANK under "Outline only" — there's no stroke to draw once the fill
//         is stripped. Cells: psPoster, pitchDeckCover, ppvPoster (blank) +
//         framedMoviePoster (near-blank).
//   BUG2  risograph at offsetDistance 6 + registrationError 1.5 + colorShift 1.0
//         floods light/mid-tone shapes to a near-black mass. Cells: bandPatch,
//         bandTshirt, conferenceLanyard.
//
// Drives the modext harness (window.__modext) — sets FULL modifier state + style
// + shape per cell, screenshots #modext-cell, pixel-analyzes paper vs ink + a
// near-black flood metric. Run BEFORE the fix (TAG=before) and AFTER (TAG=after);
// each writes shots + a results.json the agent diffs.
//
//   TAG=before MODEXT_URL=http://localhost:4481/tools/modext/modext.html \
//     node tools/modext/bugfix-driver.mjs
//   TAG=after  MODEXT_URL=http://localhost:4482/tools/modext/modext.html \
//     node tools/modext/bugfix-driver.mjs
//
// No new deps: PNG decode on node:zlib, playwright reused from the repo's path.
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

const TAG = process.env.TAG || 'run';
const BASE = process.env.MODEXT_URL || 'http://localhost:4481/tools/modext/modext.html';
const OUT = `/tmp/dd-bugfix/${TAG}`;
mkdirSync(join(OUT, 'shots'), { recursive: true });

// ─── PNG decode (8-bit, colorType 2/6, non-interlaced) ──────────────────────
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
      bitDepth = data.readUInt8(8); colorType = data.readUInt8(9);
    } else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    off += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const ch = colorType === 6 ? 4 : colorType === 2 ? 3 : 1;
  const stride = w * ch;
  const out = Buffer.alloc(stride * h);
  let pos = 0;
  const paeth = (a, b, c) => {
    const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
    return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
  };
  for (let y = 0; y < h; y++) {
    const ft = raw[pos++];
    for (let x = 0; x < stride; x++) {
      const v = raw[pos++];
      const a = x >= ch ? out[y * stride + x - ch] : 0;
      const b = y > 0 ? out[(y - 1) * stride + x] : 0;
      const c = x >= ch && y > 0 ? out[(y - 1) * stride + x - ch] : 0;
      let r;
      switch (ft) {
        case 0: r = v; break;
        case 1: r = v + a; break;
        case 2: r = v + b; break;
        case 3: r = v + ((a + b) >> 1); break;
        case 4: r = v + paeth(a, b, c); break;
        default: r = v;
      }
      out[y * stride + x] = r & 0xff;
    }
  }
  return { w, h, ch, data: out };
}

// Paper warm #FDFCF9. Count ink (Σ|chan−paper| over thresh) + dark pixels (luma
// < 70) + near-black flood metric. Ignore the 22px label band (×2 DPR = 44px).
const PAPER = [253, 252, 249];
const INK_DIST = 48;
const DARK_LUMA = 70;
function analyze(png) {
  const { w, h, ch, data } = png;
  let ink = 0, dark = 0, total = 0;
  const yStart = 0; // #modext-cell is captured directly (no label band in clip)
  for (let y = yStart; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * ch;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      total++;
      const dist = Math.abs(r - PAPER[0]) + Math.abs(g - PAPER[1]) + Math.abs(b - PAPER[2]);
      if (dist > INK_DIST) ink++;
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;
      if (luma < DARK_LUMA) dark++;
    }
  }
  return {
    inkFrac: +(ink / total).toFixed(5),
    darkFrac: +(dark / total).toFixed(5),
  };
}

// ─── DEFAULT modifier state (mirrors DEFAULT_MODIFIERS shape; full replace) ──
// The harness exposes setMods (partial), so we set only what each case needs and
// rely on the style preset for the rest. setStyle applies the preset implicitly?
// No — modext setStyle only flips the style id; presets are NOT auto-applied
// (that's the chrome's job). So for "default look" cells we setStyle then leave
// mods at DEFAULT (harness boots at DEFAULT_MODIFIERS). For BUG2 we push the
// extreme riso mods explicitly.

// Riso preset (so default riso cells read like the chrome default).
const RISO_PRESET = { offsetDistance: 4, offsetAngle: 45, registrationError: 0.5, colorShift: 0.7 };
// Riso CEILING (the bug repro).
const RISO_CEILING = { offsetDistance: 6, offsetAngle: 45, registrationError: 1.5, colorShift: 1.0 };

// ─── Cell plan ──────────────────────────────────────────────────────────────
// Each: { id, shape, style, mods? }  (mods = partial override on top of DEFAULT)
const CELLS = [];

// BUG1 repro — the 4 named posters under outline-only.
for (const shape of ['psPoster', 'pitchDeckCover', 'ppvPoster', 'framedMoviePoster']) {
  CELLS.push({ id: `bug1-${shape}-outline`, shape, style: 'outline-only' });
}

// BUG2 repro — the 3 named light/mid shapes at riso ceiling + their riso default.
for (const shape of ['bandPatch', 'bandTshirt', 'conferenceLanyard']) {
  CELLS.push({ id: `bug2-${shape}-riso-default`, shape, style: 'risograph', mods: RISO_PRESET });
  CELLS.push({ id: `bug2-${shape}-riso-ceiling`, shape, style: 'risograph', mods: RISO_CEILING });
}

// 6-class REGRESSION matrix. Classes:
//   poster(fill-only) · stroked · mid-tone-fill · multi-subpath · tiny · dense
const REG6 = {
  'poster': 'psPoster',
  'stroked': 'controllerShadowBox',
  'midfill': 'bandPatch',
  'multisub': 'stackedSketchbooks',
  'tiny': 'criterionSpine',
  'dense': 'zeldaMap',
};
// At default Rough hand-drawn + the two affected styles (outline-only, riso).
for (const [cls, shape] of Object.entries(REG6)) {
  CELLS.push({ id: `reg-${cls}-rough`, shape, style: 'rough-handdrawn' });
  CELLS.push({ id: `reg-${cls}-outline`, shape, style: 'outline-only' });
  CELLS.push({ id: `reg-${cls}-riso-default`, shape, style: 'risograph', mods: RISO_PRESET });
  CELLS.push({ id: `reg-${cls}-riso-ceiling`, shape, style: 'risograph', mods: RISO_CEILING });
}

async function run() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 2 });
  const consoleErrors = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => consoleErrors.push('PAGEERROR ' + e.message));

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__modext && window.__modext.ready, { timeout: 15000 });

  const results = [];
  for (const cell of CELLS) {
    const errBefore = consoleErrors.length;
    // Reset to DEFAULT, set shape, set style, then apply any extreme mods.
    await page.evaluate((c) => {
      window.__modext.reset();
      window.__modext.setShape(c.shape);
      window.__modext.setStyle(c.style);
      if (c.mods) window.__modext.setMods(c.mods);
    }, cell);
    // double rAF + settle for the SvgStyleTransform clone/transform effect.
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 120)))));
    const el = await page.$('#modext-cell');
    const buf = await el.screenshot();
    const file = join(OUT, 'shots', `${cell.id}.png`);
    writeFileSync(file, buf);
    const metrics = analyze(decodePng(buf));
    const cellErrors = consoleErrors.slice(errBefore);
    results.push({ ...cell, ...metrics, file, errors: cellErrors });
    const flag =
      metrics.inkFrac < 0.002 ? 'BLANK'
      : metrics.darkFrac > 0.9 ? 'FLOOD'
      : cellErrors.length ? 'CONSOLE'
      : 'ok';
    console.log(`${flag.padEnd(8)} ${cell.id.padEnd(36)} ink=${metrics.inkFrac} dark=${metrics.darkFrac}`);
  }

  writeFileSync(join(OUT, 'results.json'), JSON.stringify(results, null, 2));
  await browser.close();
  console.log(`\n[${TAG}] ${results.length} cells → ${OUT}`);
}

run().catch((e) => { console.error(e); process.exit(1); });
