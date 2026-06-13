// MODIFIER-EXTREME 2D break-hunt driver. Drives tools/modext/modext.html headless
// through window.__modext. Three phases:
//
//   PHASE 0  classify all 197 catalog shapes from their RAW (clean-style) render:
//            subpath count, bbox aspect, fill presence, dasharray, area frac.
//            → auto-derive the GNARLY set (multi-subpath / tiny / tall-thin /
//              dense / pure-line / filled / dashed) per the task brief.
//
//   PHASE 1  AUTO-FLAG SWEEP over ALL 197 shapes × a battery of extreme states.
//            Pixel-analyzes each render (paper vs ink) for:
//              VANISH  — ink coverage collapses vs the shape's clean baseline
//              FLOOD   — near-solid-black fill of the cell
//              NAN     — non-finite coords in the produced SVG (d= / points= / xy)
//              CONSOLE — console error / pageerror during the render
//            Writes results.json + a per-shape table. Flagged renders get a shot.
//
//   PHASE 2  CURATED deep-extreme combos on the gnarly set — full screenshots
//            saved for the agent to READ with vision (the load-bearing check).
//
// Isolated preview (HMR-churn rule): point at the /tmp/modext-dist preview.
//   MODE=preview node tools/modext/modext-sweep.mjs   (preview on :4471)
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import zlib from 'node:zlib';

const require = createRequire('/Users/sebs/Desktop/Projects/desk-doodles/');
const { chromium } = require('/Users/sebs/Desktop/Projects/portfolio/tools/lab-screenshots/node_modules/playwright');

const BASE = process.env.MODEXT_URL || 'http://localhost:4471/tools/modext/modext.html';
const OUT = '/tmp/dd-modext';
const PHASE = process.env.PHASE || 'all';
mkdirSync(join(OUT, 'shots'), { recursive: true });
mkdirSync(join(OUT, 'curated'), { recursive: true });

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

// Paper is warm #FDFCF9 ≈ (253,252,249). Count ink (Σ|chan−paper| over thresh)
// + dark pixels (luma < 70) + a near-black flood metric.
const PAPER = [253, 252, 249];
const INK_DIST = 48;
function analyze(png) {
  const { w, h, ch, data } = png;
  let ink = 0, dark = 0, total = w * h;
  // ignore the 22px label band at top (scaled by deviceScaleFactor 2 → 44px)
  const yStart = 46;
  total = w * (h - yStart);
  for (let y = yStart; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * ch;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const dist = Math.abs(r - PAPER[0]) + Math.abs(g - PAPER[1]) + Math.abs(b - PAPER[2]);
      if (dist > INK_DIST) ink++;
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;
      if (luma < 70) dark++;
    }
  }
  return { inkFrac: ink / total, darkFrac: dark / total };
}

// ─── Modifier state helpers ─────────────────────────────────────────────────
const FILL_STYLES = ['none', 'solid', 'hachure', 'cross-hatch', 'dots', 'zigzag', 'dashed', 'zigzag-line'];
const MULTI = ['off', 'single', 'double', 'triple', 'quad', 'quint', 'six', 'heavy'];
const SKETCH = ['single-pass', 'loose-overlap', 'parallel-pass', 'cross-rotate'];
const TEXTURES = ['none', 'light', 'heavy', 'chalky', 'paper-tooth', 'ribbed', 'stipple', 'wet-ink', 'smudge', 'canvas'];
const ROUGH_STYLES = ['rough-handdrawn', 'sketchy', 'bold-ink', 'stipple'];
const ALL_STYLES = ['clean', 'outline-only', 'rough-handdrawn', 'sketchy', 'bold-ink', 'wet-ink', 'stipple', 'charcoal', 'risograph', 'newsprint', 'wireframe'];

// DEFAULT_MODIFIERS verbatim (so replaceMods produces a known full state)
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
  await page.waitForTimeout(180);
}

// Scan the produced SVG markup for non-finite coordinate tokens.
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

async function shoot(page, file) {
  const cell = page.locator('#modext-cell');
  const buf = await cell.screenshot();
  writeFileSync(file, buf);
  return analyze(decodePng(buf));
}

// ─── Run ─────────────────────────────────────────────────────────────────────
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 420, height: 440 }, deviceScaleFactor: 2 });
const consoleErrors = [];
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', (e) => consoleErrors.push('PAGEERR: ' + e.message));

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__modext && window.__modext.ready, { timeout: 15000 });
const inventory = await page.evaluate(() => window.__modext.inventory);
console.log(`inventory: ${inventory.length} shapes`);

// ── PHASE 0: classify ──
console.log('\n=== PHASE 0: classify (clean render metrics) ===');
const classify = [];
for (const cell of inventory) {
  await setState(page, cell.shape, 'clean', { ...DEFAULT, wobble: 0, fillStyle: 'hachure' });
  const m = await page.evaluate(() => {
    const root = document.getElementById('modext-cell');
    const svgs = root.querySelectorAll('svg');
    let subpaths = 0, hasFill = false, hasDash = false, elCount = 0;
    const geom = root.querySelectorAll('path,line,polyline,polygon,rect,circle,ellipse');
    elCount = geom.length;
    for (const el of geom) {
      const d = el.getAttribute('d');
      if (d) subpaths += (d.match(/[Mm]/g) || []).length;
      else subpaths += 1;
      const cs = getComputedStyle(el);
      const fill = el.getAttribute('fill') || cs.fill;
      if (fill && fill !== 'none' && fill !== 'transparent' && !/rgba\(0, 0, 0, 0\)/.test(fill)) hasFill = true;
      const da = el.getAttribute('stroke-dasharray') || cs.strokeDasharray;
      if (da && da !== 'none' && da !== '0') hasDash = true;
    }
    // bbox of outer svg
    let asp = 1, areaFrac = 0;
    const outer = root.querySelector('div');
    if (outer) {
      const r = outer.getBoundingClientRect();
      if (r.height > 0) asp = r.width / r.height;
      areaFrac = (r.width * r.height) / (360 * 338);
    }
    return { subpaths, hasFill, hasDash, elCount, asp, areaFrac };
  });
  const baseShot = await page.evaluate(() => true);
  classify.push({ ...cell, ...m });
}

// Derive gnarly set by category
function pick(filter, n, taken) {
  const r = [];
  for (const c of classify) { if (r.length >= n) break; if (taken.has(c.shape)) continue; if (filter(c)) { r.push(c); taken.add(c.shape); } }
  return r;
}
const taken = new Set();
const gnarly = [
  ...pick((c) => c.subpaths >= 8, 5, taken),                          // multi-subpath / stacked
  ...pick((c) => c.asp < 0.45 || c.asp > 2.2, 4, taken),              // tall-thin / wide
  ...pick((c) => c.elCount >= 10, 3, taken),                          // dense-detail
  ...pick((c) => !c.hasFill && c.elCount <= 3, 3, taken),             // pure-line
  ...pick((c) => c.hasFill, 4, taken),                                // filled-solid
  ...pick((c) => c.hasDash, 2, taken),                                // dashed
  ...pick((c) => c.areaFrac < 0.15, 2, taken),                        // tiny
  ...pick(() => true, 2, taken),                                      // misc filler
];
writeFileSync(join(OUT, 'classify.json'), JSON.stringify({ classify, gnarly: gnarly.map((g) => g.shape) }, null, 2));
console.log('gnarly set:', gnarly.map((g) => g.shape).join(', '));

// ── baseline ink per shape (rough-handdrawn default) for VANISH detection ──
console.log('\n=== baseline ink (rough-handdrawn preset default) ===');
const baseInk = {};
for (const cell of inventory) {
  await setState(page, cell.shape, 'rough-handdrawn', { ...DEFAULT });
  const a = await shoot(page, join(OUT, 'shots', `base-${cell.shape}.png`));
  baseInk[cell.shape] = a.inkFrac;
}

// ── PHASE 1: auto-flag sweep over ALL 197 ──
console.log('\n=== PHASE 1: auto-flag sweep (ALL 197 × extreme battery) ===');
// Extreme battery states — each pushes one axis (or combo) to a floor/ceiling.
const battery = [
  { id: 'wobbleMax-jagMax', style: 'rough-handdrawn', mods: { wobble: 2.0, jaggedness: 2.0, multiStroke: 'double', fillStyle: 'hachure' } },
  { id: 'wobble0-jag0', style: 'rough-handdrawn', mods: { wobble: 0, jaggedness: 0 } },
  { id: 'strokeFloor', style: 'rough-handdrawn', mods: { strokeWidth: 0.5, wobble: 2.0, jaggedness: 2.0 } },
  { id: 'strokeMax', style: 'bold-ink', mods: { strokeWidth: 3.0, fillStyle: 'solid', fillDensity: 1.2 } },
  { id: 'bowMax-curveDamp0', style: 'rough-handdrawn', mods: { bowing: 2.5, curveDamp: 0, wobble: 2.0 } },
  { id: 'multiHeavy-crossRotate', style: 'rough-handdrawn', mods: { multiStroke: 'heavy', sketchingStyle: 'cross-rotate', wobble: 1.5 } },
  { id: 'fill-cross-dense', style: 'rough-handdrawn', mods: { fillStyle: 'cross-hatch', hachureGap: 1, fillDensity: 1.2 } },
  { id: 'fill-dots-dense', style: 'stipple', mods: { fillStyle: 'dots', hachureGap: 1, fillDensity: 1.2, dotSize: 6 } },
  { id: 'fill-dashed', style: 'rough-handdrawn', mods: { fillStyle: 'dashed', hachureGap: 1, fillDensity: 1.2 } },
  { id: 'fill-zigzag', style: 'rough-handdrawn', mods: { fillStyle: 'zigzag', hachureGap: 1, fillDensity: 1.2 } },
  { id: 'fill-solid-dark', style: 'rough-handdrawn', mods: { fillStyle: 'solid', fillDensity: 1.2, inkIntensity: 1.0 } },
  { id: 'hachureGapMin-angle90', style: 'rough-handdrawn', mods: { fillStyle: 'hachure', hachureGap: 1, hachureAngle: 90, fillDensity: 1.2 } },
  { id: 'textureMax-stipple', style: 'newsprint', mods: { texture: 'stipple', textureIntensity: 3.0, dotSize: 6 } },
  { id: 'charcoal-grainMax', style: 'charcoal', mods: { grainIntensity: 2.5, smudgeAmount: 2, textureIntensity: 3.0 } },
  { id: 'inkFloor', style: 'rough-handdrawn', mods: { inkIntensity: 0, fillOpacity: 0 } },
  { id: 'riso-offsetMax', style: 'risograph', mods: { offsetDistance: 6, registrationError: 1.5, colorShift: 1 } },
];
const sweepRows = [];
let flagN = 0;
for (const cell of inventory) {
  const row = { shape: cell.shape, label: cell.label, baseInk: baseInk[cell.shape], states: {} };
  for (const b of battery) {
    consoleErrors.length = 0;
    await setState(page, cell.shape, b.style, { ...DEFAULT, ...b.mods });
    const nan = await scanNaN(page);
    const cell2 = page.locator('#modext-cell');
    const buf = await cell2.screenshot();
    const a = analyze(decodePng(buf));
    const errs = consoleErrors.slice();
    // Flags
    const flags = [];
    const expectInk = !/inkFloor/.test(b.id); // inkFloor is SUPPOSED to vanish
    if (expectInk && a.inkFrac < 0.004 && baseInk[cell.shape] > 0.01) flags.push('VANISH');
    if (a.darkFrac > 0.62 && !/solid|fill-/.test(b.id)) flags.push('FLOOD');
    if (a.darkFrac > 0.80) flags.push('FLOOD-HARD');
    if (nan.length) flags.push('NAN:' + nan[0]);
    if (errs.length) flags.push('CONSOLE');
    row.states[b.id] = { inkFrac: +a.inkFrac.toFixed(4), darkFrac: +a.darkFrac.toFixed(4), flags };
    if (flags.length) {
      flagN++;
      writeFileSync(join(OUT, 'shots', `FLAG-${cell.shape}-${b.id}.png`), buf);
    }
  }
  sweepRows.push(row);
}
writeFileSync(join(OUT, 'phase1-results.json'), JSON.stringify(sweepRows, null, 2));
console.log(`PHASE 1 done — ${flagN} flagged renders saved (FLAG-*.png)`);

// summarize flags
const flagSummary = {};
for (const r of sweepRows) for (const [sid, s] of Object.entries(r.states)) for (const f of s.flags) {
  const key = f.split(':')[0]; flagSummary[key] = flagSummary[key] || []; flagSummary[key].push(`${r.shape}/${sid}`);
}
let summaryTxt = '# PHASE 1 flag summary\n\n';
for (const [k, arr] of Object.entries(flagSummary)) {
  summaryTxt += `## ${k} (${arr.length})\n` + arr.slice(0, 60).join('\n') + (arr.length > 60 ? `\n…+${arr.length - 60} more` : '') + '\n\n';
}
writeFileSync(join(OUT, 'flag-summary.md'), summaryTxt);
console.log(summaryTxt);

// ── PHASE 2: curated deep combos on gnarly set (full shots to READ) ──
console.log('\n=== PHASE 2: curated deep combos (screenshots for vision read) ===');
const combos = [
  { id: 'A_wobMax_jagMax', style: 'rough-handdrawn', mods: { wobble: 2.0, jaggedness: 2.0, multiStroke: 'double', strokeWidth: 0.5 } },
  { id: 'B_multiQuad_crossRot', style: 'rough-handdrawn', mods: { multiStroke: 'quad', sketchingStyle: 'cross-rotate', wobble: 1.0 } },
  { id: 'C_cross_gapMin', style: 'rough-handdrawn', mods: { fillStyle: 'cross-hatch', hachureGap: 1, fillDensity: 1.2, hachureAngle: 90 } },
  { id: 'D_dots_dense', style: 'stipple', mods: { fillStyle: 'dots', hachureGap: 1, fillDensity: 1.2, dotSize: 6, dotScatter: 1 } },
  { id: 'E_dashed_dense', style: 'rough-handdrawn', mods: { fillStyle: 'dashed', hachureGap: 1, fillDensity: 1.2 } },
  { id: 'F_solid_dark', style: 'rough-handdrawn', mods: { fillStyle: 'solid', fillDensity: 1.2 } },
  { id: 'G_bowMax_curveDamp0', style: 'rough-handdrawn', mods: { bowing: 2.5, curveDamp: 0, wobble: 2.0, multiStroke: 'triple' } },
  { id: 'H_charcoal_max', style: 'charcoal', mods: { grainIntensity: 2.5, smudgeAmount: 2, textureIntensity: 3.0, strokeWidth: 1.4 } },
  { id: 'I_riso_max', style: 'risograph', mods: { offsetDistance: 6, registrationError: 1.5, colorShift: 1 } },
  { id: 'J_wireframe', style: 'wireframe', mods: { strokeWidth: 0.75, simplification: 2.0 } },
];
const curatedIndex = [];
for (const g of gnarly) {
  for (const c of combos) {
    await setState(page, g.shape, c.style, { ...DEFAULT, ...c.mods });
    const nan = await scanNaN(page);
    const file = join(OUT, 'curated', `${g.shape}__${c.id}.png`);
    const a = await shoot(page, file);
    curatedIndex.push({ shape: g.shape, combo: c.id, inkFrac: +a.inkFrac.toFixed(4), darkFrac: +a.darkFrac.toFixed(4), nan });
  }
}
writeFileSync(join(OUT, 'curated-index.json'), JSON.stringify(curatedIndex, null, 2));
console.log(`PHASE 2 done — ${curatedIndex.length} curated shots in ${OUT}/curated/`);

await browser.close();
console.log('\nDONE. Outputs in', OUT);
