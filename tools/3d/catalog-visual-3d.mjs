// CATALOG VISUAL 3D SWEEP driver — drives tools/3d/catalog-visual-3d.html
// headless through window.__vis. The VISUAL 3D render sweep deferred by the
// geometry gauntlet: ALL 197 audit catalog shapes vs the Clean SVG ground
// truth, across 3D STYLE (Native 6 mats · Hatch grammar×dir×slider LMH ·
// SVG-port) + per-mode property toggles (rod/extrude/inflate/solid) LMH.
//
//   node tools/3d/catalog-visual-3d.mjs                     (vite on :4488)
//   VIS_URL=http://host/tools/3d/catalog-visual-3d.html node tools/3d/catalog-visual-3d.mjs
//   SHARD=0 SHARDS=4 node tools/3d/catalog-visual-3d.mjs   (parallel shard)
//   GROUP=native|hatch|svgport|rod|extrude|inflate|solid    (one group only)
//
// Per shape (all 197 — never sample-and-claim): renders Clean + every 3D state,
// saves each PNG, computes pixel stats, auto-flags. Then composes per-group
// contact sheets (Clean | states tiled) and a flag-only "drill" sheet.
//
// AUTO-FLAGS (vs Clean — a flag = a cell to drill, not an automatic verdict):
//   EMPTY        — non-empty shape produced ~no object pixels in a form mode
//   BLACK-BLOB   — blackFrac high AND spread low AND Clean is NOT itself dark
//                  (flat black hiding structure; if Clean is dark too → not a bug)
//   TAN          — Native lit-face r−b ≥ 25 on a slab (ink-black policy break)
//   OVERFLOW     — object pixels touch the canvas border (clipped/too big)
//   FLAT-NOSTRUCT— hatch/svg-port with near-zero ink spread (lines vanished)
//
// READ-ONLY: the harness imports src, never edits it. Repo tool only.
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let chromium;
for (const p of [
  '/tmp/dd-pp/node_modules/playwright',
  '/Users/sebs/Desktop/Projects/portfolio/tools/lab-screenshots/node_modules/playwright',
]) {
  try { ({ chromium } = require(p)); break; } catch { /* next */ }
}
if (!chromium) { console.error('FATAL: playwright not found'); process.exit(2); }

const BASE_URL = process.env.VIS_URL ?? 'http://localhost:4488/tools/3d/catalog-visual-3d.html';
const OUT_DIR = process.env.OUT_DIR ?? '/tmp/dd-vis3d';
const SHARD = parseInt(process.env.SHARD ?? '0', 10);
const SHARDS = parseInt(process.env.SHARDS ?? '1', 10);
const ONLY_GROUP = process.env.GROUP ?? null;
const LIMIT = process.env.LIMIT ? parseInt(process.env.LIMIT, 10) : null; // debug: first N shapes
mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(join(OUT_DIR, 'cells'), { recursive: true });
mkdirSync(join(OUT_DIR, 'sheets'), { recursive: true });

// ─── State matrix (one-factor-at-a-time, full L/M/H per toggle) ──────────────
// Ranges are the modeParams.ts spec mins/maxs (LOW=min, HIGH=max, MID=default
// or midpoint). Hatch slider ranges per the 2D Shading cluster the hatch reads.

const ANGLES = [
  { tag: 'front', angleDeg: 0, elevDeg: 18 },
  { tag: 'q35', angleDeg: 35, elevDeg: 22 },
  { tag: 'q315', angleDeg: 315, elevDeg: 22 },
];
const A0 = ANGLES[0];
const NATIVE_PRESETS = ['ink', 'softGel', 'matteClay', 'glossyPlastic', 'rubber', 'signal'];
const HATCH_GRAMMARS = ['hachure', 'cross-hatch', 'stipple', 'contour'];
const HATCH_DIRS = ['fixed', 'light'];
// Hatch slider LMH (2D Shading cluster: gap 0.5–30 default 4 · angle −90..90
// default −41 · strokeWidth ~0.3–4 default 1.2 · ink 0–2 default 1).
const HATCH_GAP = { low: 0.5, mid: 4, high: 30 };
const HATCH_ANGLE = { low: -90, mid: -41, high: 90 };
const HATCH_SW = { low: 0.3, mid: 1.2, high: 4 };
const HATCH_INK = { low: 0.2, mid: 1.0, high: 2.0 };
const BASE_HATCH = { hachureGap: 4, hachureAngle: -41, strokeWidth: 1.2, inkIntensity: 1.0 };

// modeParams.ts spec ranges.
const ROD_RADIUS = { low: 0.01, mid: 0.032, high: 0.128 };
const ROD_JOINTSENS = { low: 20, mid: 40, high: 70 };
const ROD_CAPS = ['round', 'flat', 'ink-blob'];
const ROD_JOINTS = ['blob', 'clean'];
const EXT_WIDTH = { low: 0, mid: 0.5, high: 1 };
const EXT_DEPTH = { low: 0.1, mid: 1.0, high: 4.0 };
const EXT_BEVEL = ['sharp', 'soft', 'rounded'];
const EXT_WALL = ['straight', 'drafted'];
const INF_BASE = { low: 0.06, mid: 0.22, high: 0.45 };
const INF_TIP = { low: 0.01, mid: 0.035, high: 0.15 };
const INF_PRESS = { low: 0, mid: 0.35, high: 1 };
const INF_PUFF = { low: 0, mid: 0.5, high: 1 };
const INF_PROFILE = ['balloon', 'cushion', 'bead'];
const SOL_INK = { low: 0.03, mid: 0.08, high: 0.2 };
const SOL_DEPTH = { low: 0.05, mid: 0.48, high: 1.35 };
const SOL_HOLES = [true, false];
const SOL_EDGE = ['crisp', 'eased'];

const DEFAULTS = {
  rod: { radius: 0.032, caps: true, capStyle: 'round', jointStyle: 'blob', jointSensitivityDeg: 40 },
  extrude: { width: 0.5, depthMult: 1.0, bevelProfile: 'rounded', sideWall: 'straight' },
  inflate: { baseRadius: 0.22, tipRadius: 0.035, pressureInfluence: 0.35, puff: 0.5, profileFamily: 'balloon' },
  solid: { inkRadius: 0.08, depth: 0.48, holes: true, edge: 'eased' },
};
const dp = () => JSON.parse(JSON.stringify(DEFAULTS));

// Geometry-mode sweep ANGLES — ≥2 orbit angles per the task (front-ish + 3/4).
const GEOMODE_ANGLES = [ANGLES[1], ANGLES[2]]; // q35 + q315 (two distinct 3/4 reads)
const GEOMETRY_MODES = ['auto', 'rod', 'extrude', 'inflate', 'solid'];

/** Build the full per-shape state list. Each entry: {group, id, state}. */
function buildStates() {
  const out = [];
  const push = (group, id, state) => out.push({ group, id, state });

  // ── GEOMODE — THE GEOMETRY-MODE AUDIT (this run's primary scope) ──────────
  // Every shape × each geometry mode (auto/rod/extrude/inflate/solid) at the
  // DEFAULT 3D style (native ink) × 2 orbit angles. modeParams = DEFAULT_*
  // (the harness fills DEFAULT_MODE3D_PARAMS when modeParams is omitted — the
  // VisMeshes default). This is the clean "is this mode a faithful, recognizable
  // solid of the source shape?" comparison, distinct from the per-property
  // toggle groups below (which vary one dial at a time).
  for (const gm of GEOMETRY_MODES) {
    for (const a of GEOMODE_ANGLES) {
      push('geomode', `geomode-${gm}-${a.tag}`, {
        geometryMode: gm, style3d: 'native', materialPreset: 'ink',
        angleDeg: a.angleDeg, elevDeg: a.elevDeg,
      });
    }
  }

  // ── NATIVE — 6 materials × 3 angles (ink-black on flat slabs at angles) ──
  for (const preset of NATIVE_PRESETS) {
    for (const a of ANGLES) {
      push('native', `native-${preset}-${a.tag}`, {
        geometryMode: 'extrude', style3d: 'native', materialPreset: preset,
        angleDeg: a.angleDeg, elevDeg: a.elevDeg,
      });
    }
  }

  // ── NATIVE-CURVED — 6 materials on CURVED geometry (rod tube + inflate gel) ──
  // The flat-slab native group above proves ink-black holds on planar faces at
  // oblique angles (the FS-env tan regression site). This group proves the same
  // 6 materials stay ink-black + read DISTINCT on CURVED surfaces — where
  // specular/clearcoat sweeps the envmap most, the worst case for the tan band.
  // rod (TubeGeometry) + inflate (swept-capsule gel) × 2 angles each.
  for (const preset of NATIVE_PRESETS) {
    for (const a of [ANGLES[0], ANGLES[1]]) {
      push('native-curved', `nc-rod-${preset}-${a.tag}`, {
        geometryMode: 'rod', style3d: 'native', materialPreset: preset,
        angleDeg: a.angleDeg, elevDeg: a.elevDeg,
      });
    }
    for (const a of [ANGLES[0], ANGLES[2]]) {
      push('native-curved', `nc-inflate-${preset}-${a.tag}`, {
        geometryMode: 'inflate', style3d: 'native', materialPreset: preset,
        angleDeg: a.angleDeg, elevDeg: a.elevDeg,
      });
    }
  }

  // ── HATCH — grammar×direction (default sliders) + each slider LMH ──
  for (const g of HATCH_GRAMMARS) {
    for (const d of HATCH_DIRS) {
      push('hatch', `hatch-${g}-${d}`, {
        geometryMode: 'extrude', style3d: 'hatch', hatchGrammar: g, hatchDirection: d,
        hatchInputs: { ...BASE_HATCH }, angleDeg: A0.angleDeg, elevDeg: A0.elevDeg,
      });
    }
  }
  const hatchSlider = (key, vals, label) => {
    for (const lvl of ['low', 'mid', 'high']) {
      push('hatch', `hatch-${label}-${lvl}`, {
        geometryMode: 'extrude', style3d: 'hatch', hatchGrammar: 'hachure', hatchDirection: 'fixed',
        hatchInputs: { ...BASE_HATCH, [key]: vals[lvl] }, angleDeg: A0.angleDeg, elevDeg: A0.elevDeg,
      });
    }
  };
  hatchSlider('hachureGap', HATCH_GAP, 'gap');
  hatchSlider('hachureAngle', HATCH_ANGLE, 'angle');
  hatchSlider('strokeWidth', HATCH_SW, 'sw');
  hatchSlider('inkIntensity', HATCH_INK, 'ink');

  // ── SVG-PORT — 3 angles ──
  for (const a of ANGLES) {
    push('svgport', `svgport-${a.tag}`, {
      geometryMode: 'extrude', style3d: 'svg-port', angleDeg: a.angleDeg, elevDeg: a.elevDeg,
    });
  }

  // ── ROD property toggles (native ink) ──
  const rodBase = (extra) => {
    const p = dp(); Object.assign(p.rod, extra);
    return { geometryMode: 'rod', style3d: 'native', materialPreset: 'ink', modeParams: p, angleDeg: A0.angleDeg, elevDeg: A0.elevDeg };
  };
  for (const lvl of ['low', 'mid', 'high']) push('rod', `rod-radius-${lvl}`, rodBase({ radius: ROD_RADIUS[lvl] }));
  push('rod', 'rod-caps-on', rodBase({ caps: true }));
  push('rod', 'rod-caps-off', rodBase({ caps: false }));
  for (const c of ROD_CAPS) push('rod', `rod-cap-${c}`, rodBase({ capStyle: c }));
  for (const j of ROD_JOINTS) push('rod', `rod-joint-${j}`, rodBase({ jointStyle: j }));
  for (const lvl of ['low', 'mid', 'high']) push('rod', `rod-jointsens-${lvl}`, rodBase({ jointSensitivityDeg: ROD_JOINTSENS[lvl] }));

  // ── EXTRUDE property toggles ──
  const extBase = (extra) => {
    const p = dp(); Object.assign(p.extrude, extra);
    return { geometryMode: 'extrude', style3d: 'native', materialPreset: 'glossyPlastic', modeParams: p, angleDeg: ANGLES[1].angleDeg, elevDeg: ANGLES[1].elevDeg };
  };
  for (const lvl of ['low', 'mid', 'high']) push('extrude', `extrude-width-${lvl}`, extBase({ width: EXT_WIDTH[lvl] }));
  for (const lvl of ['low', 'mid', 'high']) push('extrude', `extrude-depth-${lvl}`, extBase({ depthMult: EXT_DEPTH[lvl] }));
  for (const b of EXT_BEVEL) push('extrude', `extrude-bevel-${b}`, extBase({ bevelProfile: b }));
  for (const w of EXT_WALL) push('extrude', `extrude-wall-${w}`, extBase({ sideWall: w }));

  // ── INFLATE property toggles ──
  const infBase = (extra) => {
    const p = dp(); Object.assign(p.inflate, extra);
    return { geometryMode: 'inflate', style3d: 'native', materialPreset: 'softGel', modeParams: p, angleDeg: A0.angleDeg, elevDeg: A0.elevDeg };
  };
  for (const lvl of ['low', 'mid', 'high']) push('inflate', `inflate-base-${lvl}`, infBase({ baseRadius: INF_BASE[lvl] }));
  for (const lvl of ['low', 'mid', 'high']) push('inflate', `inflate-tip-${lvl}`, infBase({ tipRadius: INF_TIP[lvl] }));
  for (const lvl of ['low', 'mid', 'high']) push('inflate', `inflate-press-${lvl}`, infBase({ pressureInfluence: INF_PRESS[lvl] }));
  for (const lvl of ['low', 'mid', 'high']) push('inflate', `inflate-puff-${lvl}`, infBase({ puff: INF_PUFF[lvl] }));
  for (const pf of INF_PROFILE) push('inflate', `inflate-profile-${pf}`, infBase({ profileFamily: pf }));

  // ── SOLID property toggles ──
  const solBase = (extra) => {
    const p = dp(); Object.assign(p.solid, extra);
    return { geometryMode: 'solid', style3d: 'native', materialPreset: 'matteClay', modeParams: p, angleDeg: ANGLES[1].angleDeg, elevDeg: ANGLES[1].elevDeg };
  };
  for (const lvl of ['low', 'mid', 'high']) push('solid', `solid-ink-${lvl}`, solBase({ inkRadius: SOL_INK[lvl] }));
  for (const lvl of ['low', 'mid', 'high']) push('solid', `solid-depth-${lvl}`, solBase({ depth: SOL_DEPTH[lvl] }));
  for (const h of SOL_HOLES) push('solid', `solid-holes-${h ? 'on' : 'off'}`, solBase({ holes: h }));
  for (const e of SOL_EDGE) push('solid', `solid-edge-${e}`, solBase({ edge: e }));

  return out;
}

const STATES_ALL = buildStates();
const STATES = ONLY_GROUP ? STATES_ALL.filter((s) => s.group === ONLY_GROUP) : STATES_ALL;
console.log(`state matrix: ${STATES_ALL.length} states/shape` + (ONLY_GROUP ? ` (group=${ONLY_GROUP}: ${STATES.length})` : ''));

// ─── flag logic ───────────────────────────────────────────────────────────────
function flagCell(group, st, clean) {
  const flags = [];
  // Clean darkness: if Clean is itself a dark solid, a dark 3D slab is faithful.
  const cleanDark = clean.blackish > 0.5; // >50% of clean box is dark ink
  const formMode = ['extrude', 'rod', 'inflate', 'solid'].includes(st.geometryMode);

  if (clean.hasInk && st.objFrac < 0.004) flags.push('EMPTY');
  if (st.overflowEdge > 0.02) flags.push('OVERFLOW');

  if (group === 'native' || group === 'native-curved' || group === 'rod' || group === 'extrude' || group === 'inflate' || group === 'solid' || group === 'geomode') {
    // BLACK-BLOB: flat black hiding structure, and Clean is NOT itself dark.
    if (st.blackFrac > 0.85 && st.spread < 18 && !cleanDark && st.objFrac > 0.01) flags.push('BLACK-BLOB');
    // TAN: ink-black policy — lit-face must stay neutral on lit forms.
    if (st.objFrac > 0.02 && st.delta >= 25) flags.push('TAN');
  }
  if (group === 'hatch' || group === 'svgport') {
    // Hatch/svg-port should show ink structure (lines). Near-zero spread = lines gone.
    if (st.objFrac > 0.02 && st.spread < 12 && st.blackFrac < 0.2) flags.push('FLAT-NOSTRUCT');
  }
  void formMode;
  return flags;
}

// ─── montage (HTML grid screenshotted by Playwright) ──────────────────────────
async function makeSheet(page, title, rows, outPath) {
  // rows: [{ label, cells: [{ src(base64 png), cap, fail }] }]
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const rowHtml = rows.map((r) => {
    const cells = r.cells.map((c) =>
      `<figure class="${c.fail ? 'fail' : ''}"><img src="data:image/png;base64,${c.src}"/><figcaption>${esc(c.cap)}</figcaption></figure>`,
    ).join('');
    return `<div class="row"><div class="rl">${esc(r.label)}</div><div class="cells">${cells}</div></div>`;
  }).join('');
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    body{margin:0;padding:14px;background:#fdfcf9;color:#3b362e;font:11px/1.3 monospace}
    h1{font-size:14px;margin:0 0 12px;border-bottom:2px solid #3b362e;padding-bottom:5px}
    .row{display:flex;align-items:flex-start;gap:8px;margin-bottom:10px;border-bottom:1px solid #e6e0d4;padding-bottom:8px}
    .rl{width:130px;flex:0 0 130px;font-weight:700;word-break:break-word}
    .cells{display:flex;flex-wrap:wrap;gap:6px}
    figure{margin:0;width:128px}
    figure img{display:block;width:128px;height:128px;border:1px solid #d8d2c6;background:#fff;object-fit:contain}
    figure.fail img{border:3px solid #c0392b}
    figcaption{font-size:9px;padding:2px 0;color:#6f6a60}
    figure.fail figcaption{color:#c0392b;font-weight:700}
  </style></head><body><h1>${esc(title)}</h1>${rowHtml}</body></html>`;
  await page.setContent(html, { waitUntil: 'networkidle' });
  const body = await page.$('body');
  await body.screenshot({ path: outPath });
}

// ─── run ────────────────────────────────────────────────────────────────────
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 760, height: 460 } });
const sheetPage = await browser.newPage({ viewport: { width: 1400, height: 1200 } });
const consoleErrors = [];
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200)); });
page.on('pageerror', (e) => consoleErrors.push('PAGEERR ' + String(e).slice(0, 200)));

console.log('→', BASE_URL);
await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__visReady === true, { timeout: 60000 });
const count = await page.evaluate(() => window.__vis.count);
if (count !== 197) console.warn(`⚠ EXPECTED 197 shapes, got ${count}`);

const shapes = await page.evaluate(() => window.__vis.shapes);
const MIN_INDEX = process.env.MIN_INDEX ? parseInt(process.env.MIN_INDEX, 10) : 0;
const MAX_INDEX = process.env.MAX_INDEX ? parseInt(process.env.MAX_INDEX, 10) : shapes.length;
let indices = shapes.map((_, i) => i).filter((i) => i % SHARDS === SHARD && i >= MIN_INDEX && i < MAX_INDEX);
if (LIMIT) indices = indices.slice(0, LIMIT);
console.log(`shard ${SHARD}/${SHARDS}: ${indices.length} shapes × ${STATES.length} states = ${indices.length * STATES.length} renders\n`);

const cleanBox = await page.$('#cleanbox');
const reports = [];
let totalFlags = 0;
const flagCounts = {};

for (const idx of indices) {
  const cell = shapes[idx];
  const sample = await page.evaluate((i) => window.__vis.sample(i), idx);
  await page.evaluate((i) => window.__vis.renderClean(i), idx);
  const cleanBuf = await cleanBox.screenshot();
  const clean = analyzeBufLuma(cleanBuf);
  writeFileSync(join(OUT_DIR, 'cells', `s${String(idx).padStart(3, '0')}-clean.png`), cleanBuf);

  const stateReports = [];
  for (const { group, id, state } of STATES) {
    const r = await page.evaluate((st) => window.__vis.render3d(st), state);
    const png = Buffer.from(r.dataUrl.split(',')[1], 'base64');
    const flags = flagCell(group, r.stats, clean);
    if (flags.length) {
      writeFileSync(join(OUT_DIR, 'cells', `s${String(idx).padStart(3, '0')}-${id}.png`), png);
    }
    for (const f of flags) flagCounts[f] = (flagCounts[f] ?? 0) + 1;
    totalFlags += flags.length;
    stateReports.push({ group, id, stats: r.stats, flags, b64: png.toString('base64') });
  }

  reports.push({
    idx, kind: cell.kind, shape: cell.shape, label: cell.label,
    sampledElements: sample.sampledElements, strokeCount: sample.strokeCount,
    clean: { blackish: clean.blackish, hasInk: clean.hasInk, b64: cleanBuf.toString('base64') },
    states: stateReports.map((s) => ({ group: s.group, id: s.id, stats: s.stats, flags: s.flags })),
  });

  const flaggedHere = stateReports.filter((s) => s.flags.length);
  console.log(`[${String(idx + 1).padStart(3)}/${count}] ${cell.kind}/${cell.shape} strokes=${sample.strokeCount} cleanDark=${clean.blackish.toFixed(2)} flags=${flaggedHere.length}${flaggedHere.length ? ' :: ' + flaggedHere.map((s) => s.id + '[' + s.flags.join(',') + ']').slice(0, 6).join(' ') : ''}`);

  // keep the b64 around for sheet building, attach to the just-pushed report
  reports[reports.length - 1]._cells = stateReports;

  // Incremental flush every 15 shapes so a kill mid-run keeps partial progress.
  if (reports.length % 15 === 0) {
    writeFileSync(join(OUT_DIR, `reports.shard${SHARD}.partial.json`), JSON.stringify(reports.map((r) => ({ ...r, _cells: undefined })), null, 2));
  }
}

// ─── write raw reports (strip b64 from the persisted json) ──────────────────
writeFileSync(join(OUT_DIR, `reports.shard${SHARD}.json`), JSON.stringify(reports.map((r) => ({ ...r, _cells: undefined })), null, 2));

// ─── build contact sheets ──────────────────────────────────────────────────
// One sheet per (group, shard-chunk): rows = shapes, cells = Clean + states.
const GROUPS = ONLY_GROUP ? [ONLY_GROUP] : ['geomode', 'native', 'native-curved', 'hatch', 'svgport', 'rod', 'extrude', 'inflate', 'solid'];
const CHUNK = 14; // shapes per sheet (keeps sheets readable)
for (const group of GROUPS) {
  for (let c = 0; c < reports.length; c += CHUNK) {
    const chunk = reports.slice(c, c + CHUNK);
    const rows = chunk.map((rep) => {
      const cells = [{ src: rep.clean.b64, cap: `CLEAN (dk ${rep.clean.blackish.toFixed(2)})`, fail: false }];
      for (const sc of rep._cells.filter((s) => s.group === group)) {
        cells.push({ src: sc.b64, cap: `${sc.id.replace(group + '-', '')} ${sc.flags.join(',')}`, fail: sc.flags.length > 0 });
      }
      return { label: `${rep.idx} ${rep.shape}`, cells };
    });
    const sheetName = `sheet-${group}-shard${SHARD}-c${String(c).padStart(3, '0')}.png`;
    await makeSheet(sheetPage, `3D ${group.toUpperCase()} vs Clean — shapes ${chunk[0].idx}–${chunk[chunk.length - 1].idx} (shard ${SHARD})`, rows, join(OUT_DIR, 'sheets', sheetName));
  }
  console.log(`sheets[${group}] written`);
}

// ─── drill sheet: every flagged cell only (Clean + the flagged state) ───────
const drillRows = [];
for (const rep of reports) {
  for (const sc of rep._cells) {
    if (!sc.flags.length) continue;
    drillRows.push({
      label: `${rep.idx} ${rep.shape}`,
      cells: [
        { src: rep.clean.b64, cap: `CLEAN dk${rep.clean.blackish.toFixed(2)}`, fail: false },
        { src: sc.b64, cap: `${sc.id} [${sc.flags.join(',')}]`, fail: true },
      ],
    });
  }
}
for (let i = 0; i < drillRows.length; i += 28) {
  await makeSheet(sheetPage, `FLAGGED DRILL — shard ${SHARD} (${i + 1}–${Math.min(i + 28, drillRows.length)} of ${drillRows.length})`, drillRows.slice(i, i + 28), join(OUT_DIR, 'sheets', `drill-shard${SHARD}-${String(i).padStart(4, '0')}.png`));
}

await browser.close();

writeFileSync(join(OUT_DIR, `summary.shard${SHARD}.json`), JSON.stringify({ shard: SHARD, shapes: indices.length, statesPerShape: STATES.length, totalRenders: indices.length * STATES.length, totalFlags, flagCounts, consoleErrors: [...new Set(consoleErrors)].slice(0, 30) }, null, 2));

console.log('\n── shard', SHARD, 'done ──');
console.log('flag counts:', JSON.stringify(flagCounts));
console.log('total flags:', totalFlags, 'across', indices.length, 'shapes');
console.log('drill rows:', drillRows.length);
if (consoleErrors.length) console.log('console errors:', [...new Set(consoleErrors)].slice(0, 6));
console.log('out →', OUT_DIR);

// ─── PNG luma analyzer (zlib inflate, no deps) ──────────────────────────────
import { inflateSync } from 'node:zlib';
function analyzeBufLuma(buf) {
  try {
    // parse PNG: signature(8) then chunks. Collect IHDR + IDAT.
    let pos = 8;
    let width = 0, height = 0, bitDepth = 0, colorType = 0;
    const idat = [];
    while (pos < buf.length) {
      const len = buf.readUInt32BE(pos); const type = buf.toString('ascii', pos + 4, pos + 8);
      const data = buf.subarray(pos + 8, pos + 8 + len);
      if (type === 'IHDR') { width = data.readUInt32BE(0); height = data.readUInt32BE(4); bitDepth = data[8]; colorType = data[9]; }
      else if (type === 'IDAT') idat.push(data);
      else if (type === 'IEND') break;
      pos += 12 + len;
    }
    if (colorType !== 6 && colorType !== 2) return { hasInk: true, blackish: 0 }; // only RGBA/RGB
    const channels = colorType === 6 ? 4 : 3;
    if (bitDepth !== 8) return { hasInk: true, blackish: 0 };
    const raw = inflateSync(Buffer.concat(idat));
    const stride = width * channels;
    let dark = 0, ink = 0, total = 0;
    let prev = Buffer.alloc(stride);
    let off = 0;
    const cur = Buffer.alloc(stride);
    for (let y = 0; y < height; y++) {
      const ft = raw[off++];
      for (let x = 0; x < stride; x++) {
        const rawByte = raw[off + x];
        const a = x >= channels ? cur[x - channels] : 0;
        const b = prev[x];
        const c = x >= channels ? prev[x - channels] : 0;
        let v;
        switch (ft) {
          case 0: v = rawByte; break;
          case 1: v = rawByte + a; break;
          case 2: v = rawByte + b; break;
          case 3: v = rawByte + ((a + b) >> 1); break;
          case 4: { const p = a + b - c; const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); const pr = pa <= pb && pa <= pc ? a : pb <= pc ? b : c; v = rawByte + pr; break; }
          default: v = rawByte;
        }
        cur[x] = v & 0xff;
      }
      off += stride;
      for (let x = 0; x + channels - 1 < stride; x += channels) {
        const r = cur[x], g = cur[x + 1], bl = cur[x + 2];
        const lum = 0.2126 * r + 0.7152 * g + 0.0722 * bl;
        // paper is ~#fdfcf9; ink = non-paper
        const isInk = Math.abs(r - 253) + Math.abs(g - 252) + Math.abs(bl - 249) > 30;
        total++;
        if (isInk) { ink++; if (lum < 60) dark++; }
      }
      prev.set(cur);
    }
    // blackish = fraction of Clean's OWN INK that is dark (NOT of the whole
    // frame) — so a small solid-black source shape reads as dark-source, and a
    // 3D black slab of it is a faithful transform, not a BLACK-BLOB bug.
    return { hasInk: ink / total > 0.005, blackish: ink > 0 ? dark / ink : 0, inkFrac: ink / total };
  } catch {
    return { hasInk: true, blackish: 0 };
  }
}
