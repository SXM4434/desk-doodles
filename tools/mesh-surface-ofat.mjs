// BIG SURFACE OFAT on AI meshes (Sebs 2026-06-27: "some of it gets too fake…
// test every possible combo and values, basically a big fun OFAT").
// One-factor-at-a-time sweep of every surface treatment × value on the 5 Suzanne
// meshes (/desk?test=suzanne), each captured against the greyscale baseline.
// Drives the controls via the __dd_canvas3d dev hook + the __dd_aiMeshSurface flag.
import puppeteer from 'puppeteer-core';
import { writeFileSync, mkdirSync } from 'node:fs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const URL = 'http://localhost:5182/desk?test=suzanne';
// DD_CROP_TARGET=suzanne-2 → tight crop on ONE diagnostic mesh (big per-variant
// read for fakeness). Unset → wide bbox of all 5 meshes. DD_OUT overrides dir.
const TARGET = process.env.DD_CROP_TARGET || '';
const OUT = process.env.DD_OUT || '/tmp/mesh-ofat';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
mkdirSync(OUT, { recursive: true });

// ── THE OFAT MATRIX ─────────────────────────────────────────────────────────
// Each variant = a full control state (we reset every axis each time → no
// carryover). flag 'engine' = wear OUR native/hatch material; 'off' = greyscale/PBR.
const N = { polish: 0.5, reflection: 0.5, sheen: 0.5, outline: 0 }; // neutral dials
const V = [
  // — material treatment / base look —
  { g: 'base',    name: 'greyscale-default',  flag: 'off', materialMode: 'greyscale', dark: 0.18, contrast: 1 },
  { g: 'base',    name: 'greyscale-dark-low',  flag: 'off', materialMode: 'greyscale', dark: 0.10, contrast: 1 },
  { g: 'base',    name: 'greyscale-dark-high', flag: 'off', materialMode: 'greyscale', dark: 0.40, contrast: 1 },
  { g: 'base',    name: 'greyscale-contrast-low',  flag: 'off', materialMode: 'greyscale', dark: 0.18, contrast: 0.6 },
  { g: 'base',    name: 'greyscale-contrast-high', flag: 'off', materialMode: 'greyscale', dark: 0.18, contrast: 1.6 },
  { g: 'base',    name: 'pbr-photoreal',       flag: 'off', materialMode: 'og-pbr' },
  // — native presets (neutral dials) —
  { g: 'preset',  name: 'native-ink',           flag: 'engine', style3d: 'native', preset: 'ink',           nativeProps: N },
  { g: 'preset',  name: 'native-softGel',       flag: 'engine', style3d: 'native', preset: 'softGel',       nativeProps: N },
  { g: 'preset',  name: 'native-matteClay',     flag: 'engine', style3d: 'native', preset: 'matteClay',     nativeProps: N },
  { g: 'preset',  name: 'native-glossyPlastic', flag: 'engine', style3d: 'native', preset: 'glossyPlastic', nativeProps: N },
  { g: 'preset',  name: 'native-rubber',        flag: 'engine', style3d: 'native', preset: 'rubber',        nativeProps: N },
  { g: 'preset',  name: 'native-signal',        flag: 'engine', style3d: 'native', preset: 'signal',        nativeProps: N },
  // — native DIALS (one factor at a time, on matteClay baseline) —
  { g: 'dial',    name: 'polish-0',     flag: 'engine', style3d: 'native', preset: 'matteClay', nativeProps: { ...N, polish: 0 } },
  { g: 'dial',    name: 'polish-1',     flag: 'engine', style3d: 'native', preset: 'matteClay', nativeProps: { ...N, polish: 1 } },
  { g: 'dial',    name: 'reflection-0', flag: 'engine', style3d: 'native', preset: 'matteClay', nativeProps: { ...N, reflection: 0 } },
  { g: 'dial',    name: 'reflection-1', flag: 'engine', style3d: 'native', preset: 'matteClay', nativeProps: { ...N, reflection: 1 } },
  { g: 'dial',    name: 'sheen-0',      flag: 'engine', style3d: 'native', preset: 'matteClay', nativeProps: { ...N, sheen: 0 } },
  { g: 'dial',    name: 'sheen-1',      flag: 'engine', style3d: 'native', preset: 'matteClay', nativeProps: { ...N, sheen: 1 } },
  { g: 'dial',    name: 'outline-mid',  flag: 'engine', style3d: 'native', preset: 'matteClay', nativeProps: { ...N, outline: 2 } },
  { g: 'dial',    name: 'outline-high', flag: 'engine', style3d: 'native', preset: 'matteClay', nativeProps: { ...N, outline: 5 } },
  // — KNOWN FAKE-SUSPECTS (explicit glossy combos) —
  { g: 'suspect', name: 'glossy-polish1-refl1', flag: 'engine', style3d: 'native', preset: 'glossyPlastic', nativeProps: { polish: 1, reflection: 1, sheen: 0.5, outline: 0 } },
  { g: 'suspect', name: 'ink-polish1',          flag: 'engine', style3d: 'native', preset: 'ink',           nativeProps: { ...N, polish: 1 } },
  { g: 'suspect', name: 'signal-refl1',         flag: 'engine', style3d: 'native', preset: 'signal',        nativeProps: { ...N, reflection: 1 } },
  // — HATCH grammar × direction —
  { g: 'hatch',   name: 'hatch-hachure-fixed',    flag: 'engine', style3d: 'hatch', grammar: 'hachure',     direction: 'fixed' },
  { g: 'hatch',   name: 'hatch-hachure-light',    flag: 'engine', style3d: 'hatch', grammar: 'hachure',     direction: 'light' },
  { g: 'hatch',   name: 'hatch-crosshatch-fixed', flag: 'engine', style3d: 'hatch', grammar: 'cross-hatch', direction: 'fixed' },
  { g: 'hatch',   name: 'hatch-crosshatch-light', flag: 'engine', style3d: 'hatch', grammar: 'cross-hatch', direction: 'light' },
  { g: 'hatch',   name: 'hatch-stipple-fixed',    flag: 'engine', style3d: 'hatch', grammar: 'stipple',     direction: 'fixed' },
  { g: 'hatch',   name: 'hatch-stipple-light',    flag: 'engine', style3d: 'hatch', grammar: 'stipple',     direction: 'light' },
  { g: 'hatch',   name: 'hatch-contour-fixed',    flag: 'engine', style3d: 'hatch', grammar: 'contour',     direction: 'fixed' },
  { g: 'hatch',   name: 'hatch-contour-light',    flag: 'engine', style3d: 'hatch', grammar: 'contour',     direction: 'light' },
];

const browser = await puppeteer.launch({ executablePath: CHROME, headless: false, args: ['--window-size=1500,1000'], defaultViewport: { width: 1500, height: 1000 } });
const page = await browser.newPage();
const log = [], fail = [];
page.on('pageerror', (e) => fail.push(`[pageerror] ${e.message}`));

try {
  await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForSelector('[data-desk-obj-id]', { timeout: 30000 });
  await page.waitForSelector('canvas', { timeout: 30000 });
  await sleep(8000);
  const ok = await page.evaluate(() => typeof window.__dd_canvas3d?.setNativeProps === 'function');
  if (!ok) throw new Error('dev hook missing setters — rebuild not live');

  // Crop = bbox of all 5 meshes (or just the TARGET mesh if set) + padding.
  const sel = TARGET ? `[data-desk-obj-id="${TARGET}"]` : '[data-desk-obj-id]';
  const rects = await page.$$eval(sel, (els) => els.map((e) => { const b = e.getBoundingClientRect(); return { x: b.x, y: b.y, r: b.right, btm: b.bottom }; }));
  const pad = TARGET ? 16 : 24;
  const clip = {
    x: Math.max(0, Math.min(...rects.map((q) => q.x)) - pad),
    y: Math.max(0, Math.min(...rects.map((q) => q.y)) - pad),
    width: 0, height: 0,
  };
  clip.width = Math.min(1500, Math.max(...rects.map((q) => q.r)) + pad) - clip.x;
  clip.height = Math.min(1000, Math.max(...rects.map((q) => q.btm)) + pad) - clip.y;
  log.push(`crop ${JSON.stringify(clip)} over ${rects.length} meshes`);

  const apply = (v) => page.evaluate((v, N) => {
    const c = window.__dd_canvas3d;
    window.__dd_aiMeshSurface = v.flag === 'engine' ? 'engine' : undefined;
    c.setAiMeshMaterialMode(v.materialMode || 'greyscale');
    c.setAiMeshDark(v.dark ?? 0.18);
    c.setAiMeshContrast(v.contrast ?? 1);
    c.setMaterialPreset(v.preset || 'matteClay');
    c.setNativeProps({ ...N, ...(v.nativeProps || {}) });
    c.setHatchGrammar(v.grammar || 'hachure');
    c.setHatchDirection(v.direction || 'fixed');
    // toggle style to force a re-render that re-reads the flag, then land on target
    c.setStyle3d(v.style3d === 'hatch' ? 'native' : 'hatch');
    c.setStyle3d(v.style3d || 'native');
  }, v, N);

  let i = 0;
  for (const v of V) {
    await apply(v);
    await sleep(1600);
    const num = String(++i).padStart(2, '0');
    await page.screenshot({ clip, path: `${OUT}/${num}_${v.g}_${v.name}.png` });
    log.push(`captured ${num} ${v.g}/${v.name}`);
  }
  // reset clean
  await page.evaluate(() => { window.__dd_aiMeshSurface = undefined; window.__dd_canvas3d.setStyle3d('hatch'); window.__dd_canvas3d.setStyle3d('native'); window.__dd_canvas3d.setAiMeshMaterialMode('greyscale'); });
  log.push(`DONE — ${V.length} variants → ${OUT}`);
} catch (e) {
  fail.push(`EXCEPTION: ${e.message}`);
} finally {
  console.log('\n=== LOG ==='); for (const l of log) console.log('  ' + l);
  if (fail.length) { console.log('\n=== FAIL ==='); for (const f of fail) console.log('  ❌ ' + f); }
  await sleep(600); await browser.close(); process.exit(fail.length ? 1 : 0);
}
