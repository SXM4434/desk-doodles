// run-bigdaddy.mjs — the BIG-DADDY OFAT harness.
//
// Runs the FULL USER FLOW on the LIVE app: per catalog object, per SOURCE, render
// the Clean baseline + OFAT every toggle at LOW/MID/HIGH (hold all others at Clean),
// in 2D AND 3D, plus SVG-upload and online-SVG sources. One vision-safe CONTACT
// SHEET per object-source + a per-panel findings manifest (status left blank for a
// later vision-read pass to fill by comparing each panel to its Clean).
//
// SOURCES
//   2d-draw     : manual-draw the object's polylines via the real tools, OFAT 2D toggles
//   svg-upload  : self-upload the object's own /audit SVG, OFAT 2D toggles
//   online-svg  : upload an external test-fixtures/*.svg, OFAT 2D toggles (run once, --with-fixtures)
//   3d          : convert the manual-drawn object to 3D, OFAT 3D toggles
//
// USAGE
//   node tools/bigdaddy/run-bigdaddy.mjs --chunk 0/8                 # one of 8 parallel shards
//   node tools/bigdaddy/run-bigdaddy.mjs --objects macbook,polaroid  # explicit set (test)
//   flags: --port 5182 --out /tmp/bigdaddy --sources 2d-draw,svg-upload,3d --with-fixtures
//
// LAWS: read-only product src (writes only /tmp/bigdaddy + tools/bigdaddy); never
// /desk publish (uses /canvas + /audit); idempotent per object (skips if its
// manifest + contact sheets already exist unless --force); deterministic wobble.

import { mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync } from 'node:fs';
import { FACTORS_2D, FACTORS_3D, TALLY } from './factors.mjs';
import {
  chromium, BASE_FOR, loadCatalog, manualDraw, commitDone, uploadSvgFile,
  expandAll, expandSection, setDropdown, readDropdown, setSlider,
  to3D, setGeoMode, setStyle3d, has3dCanvas, gateBlocked, mainSig, canvasShotSig,
  screenshotMain, buildContactSheet,
} from './bigdaddy-lib.mjs';

function arg(name, def) { const i = process.argv.indexOf(`--${name}`); return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : def; }
function flag(name) { return process.argv.includes(`--${name}`); }

const PORT = arg('port', '5182');
const OUT = arg('out', '/tmp/bigdaddy');
const OBJECTS = arg('objects', '');
const CHUNK = arg('chunk', '');
const SOURCES = (arg('sources', '2d-draw,svg-upload,3d')).split(',').map((s) => s.trim()).filter(Boolean);
const WITH_FIXTURES = flag('with-fixtures'); // also run online-svg source (heavy; run on chunk 0)
const FORCE = flag('force');
const BASE = BASE_FOR(PORT);
const REGIME = 'bigdaddy-current';
const FIXTURE_DIR = '/Users/sebs/Desktop/Projects/desk-doodles/test-fixtures';
mkdirSync(OUT, { recursive: true });

if (!chromium) { console.log('NO_PLAYWRIGHT'); process.exit(2); }

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1500, height: 950 }, deviceScaleFactor: 2 });
const allErrs = [];
page.on('console', (m) => { if (m.type() === 'error') allErrs.push(m.text().slice(0, 200)); });
page.on('pageerror', (e) => allErrs.push('PAGEERR ' + e.message.slice(0, 200)));

// ── 1. load full catalog from /audit ──
let catalog;
try { catalog = await loadCatalog(page, BASE); }
catch (e) { console.log('SERVER_DOWN', e.message); await browser.close(); process.exit(3); }
console.log(`catalog: ${catalog.length} objects from /audit`);

let work = catalog;
if (OBJECTS) { const want = new Set(OBJECTS.split(',').map((s) => s.trim())); work = catalog.filter((c) => want.has(c.shape)); }
else if (CHUNK) { const [i, N] = CHUNK.split('/').map(Number); work = catalog.filter((_, idx) => idx % N === i); }
console.log(`working set: ${work.length} objects · sources=[${SOURCES.join(', ')}]${WITH_FIXTURES ? ' +online-svg' : ''}`);

const manifestPath = `${OUT}/manifest-${CHUNK ? CHUNK.replace('/', 'of') : (OBJECTS ? 'objects' : 'all')}.jsonl`;
// Idempotent manifest: load any prior rows, drop rows for the object-sources we're
// (re)processing THIS run, then merge fresh ones. A skip-only re-run thus preserves
// the existing manifest instead of clobbering it with an empty file.
let priorRows = [];
if (existsSync(manifestPath)) {
  priorRows = readFileSync(manifestPath, 'utf8').split('\n').filter(Boolean)
    .map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
}
const manifestRows = [];
const touchedKeys = new Set(); // `${object}::${source}` produced this run
function emit(row) { manifestRows.push(row); if (row.object && row.source) touchedKeys.add(`${row.object}::${row.source}`); }
function flushManifest() {
  // keep prior rows whose object-source we did NOT touch this run; add fresh ones
  const kept = priorRows.filter((r) => !touchedKeys.has(`${r.object}::${r.source}`));
  const merged = [...kept, ...manifestRows];
  writeFileSync(manifestPath, merged.map((r) => JSON.stringify(r)).join('\n') + (merged.length ? '\n' : ''));
}

// online-svg fixtures (run once across the whole catalog dimension is overkill;
// we attach them as extra "objects" only on chunk-0 / when --with-fixtures).
const onlineFixtures = WITH_FIXTURES
  ? readdirSync(FIXTURE_DIR).filter((f) => f.endsWith('.svg')).map((f) => ({ name: f.replace(/\.svg$/, ''), path: `${FIXTURE_DIR}/${f}` }))
  : [];

// ════════════════════════════════════════════════════════════════════════════
// Reset to Clean baseline (Clean SVG style + all chrome defaults). The Clean
// preset IS the held baseline for OFAT; each factor changes exactly ONE control.
// ════════════════════════════════════════════════════════════════════════════
// set the SVG-style preset that holds the OFAT baseline (Clean or Rough hand-drawn),
// then expand the control clusters so every toggle mounts. When entering a rough
// baseline, hit RESET-TO-PRESET so the rough defaults are a known held state.
async function setBaseStyle(stylePreset) {
  await setDropdown(page, 'SVG style', stylePreset);
  await page.waitForTimeout(400);
  if (stylePreset !== 'Clean') {
    await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /RESET TO/i.test(x.innerText)); if (b) b.click(); });
    await page.waitForTimeout(400);
  }
  await expandAll(page);
}

// run the 2D OFAT for whatever input is currently drawn/uploaded & committed.
// Two-tier baseline (probed live): style/palette/texture controls exist under
// Clean; pen/multi-stroke/shading controls only mount under Rough hand-drawn —
// so each factor is run on ITS required baseStyle, holding that baseline and
// flipping exactly ONE control. The Clean screenshot is the comparison reference
// for the vision pass; for rough-baseline factors a rough-baseline panel is also
// captured so the diff is honest (Clean ref + rough ref + the L/M/H change).
async function ofat2d(object, source, dir) {
  const panels = [];
  // CLEAN reference panel (always)
  await setDropdown(page, 'SVG style', 'Clean'); await page.waitForTimeout(400);
  const cleanShot = `${dir}/clean.png`;
  await screenshotMain(page, cleanShot);
  const cleanSig = await mainSig(page);
  panels.push({ file: cleanShot, label: 'CLEAN (ref)' });
  emit(rowFor(object, source, 'baseline', 'clean', cleanShot, dir, null));

  // group factors by their required baseline style, run each group together so we
  // set the baseline once and revert to IT (not Clean) between factors.
  const groups = new Map();
  for (const f of FACTORS_2D) { const k = f.baseStyle || 'Clean'; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(f); }

  for (const [baseStyle, fs] of groups) {
    await setBaseStyle(baseStyle);
    const baseSig = await mainSig(page);
    if (baseStyle !== 'Clean') {
      const baseShot = `${dir}/_base-${baseStyle.replace(/\W+/g, '')}.png`;
      await screenshotMain(page, baseShot);
      panels.push({ file: baseShot, label: `BASE: ${baseStyle}` });
      emit(rowFor(object, source, 'baseline', baseStyle, baseShot, dir, changed(baseSig, cleanSig)));
    }
    for (const f of fs) {
      if (f.section) await expandSection(page, f.section);
      for (const [level, value] of f.levels) {
        let setOk = true; let applied = '';
        if (f.kind === 'dropdown') { const r = await setDropdown(page, f.label, value); setOk = r.ok; applied = await readDropdown(page, f.label); }
        else if (f.kind === 'slider') { const r = await setSlider(page, f.label, value); setOk = r.ok; applied = r.ok ? r.now : ''; }
        await page.waitForTimeout(340);
        const shot = `${dir}/${f.id}-${level}.png`;
        await screenshotMain(page, shot);
        const sig = await mainSig(page);
        panels.push({ file: shot, label: `${f.id} @${level}=${value}` });
        // pixelChanged hint compares to the group baseline (the held state we flipped from)
        emit(rowFor(object, source, f.id, level, shot, dir, changed(sig, baseSig), { value, setOk, applied, baseStyle }));
        // REVERT just this factor back to the group baseline (re-set the baseStyle
        // wholesale — cheapest reliable revert — then re-expand for the next).
        await setBaseStyle(baseStyle);
        if (f.section) await expandSection(page, f.section);
      }
    }
  }
  return { panels, cleanSig };
}

// run the 3D OFAT for the currently-converted object (must already be in 3D view).
// 3D change-hint uses canvasShotSig (Playwright screenshot bytes) — the in-browser
// canvas readback is blank/identical every mode (WebGL preserveDrawingBuffer=false).
// FULL 3D baseline reset — the held OFAT state. style3d=Native + geoMode=auto +
// material=Matte Clay (matteClay = MODE_MATERIAL_DEFAULTS_3D.auto) + the native
// sliders at their DEFAULT_NATIVE_PROPS_3D values (polish/reflection/sheen 0.5,
// outline 0). Native style FIRST so the material dropdown + native sliders mount
// before we set them. Used for BOTH the clean baseline and the per-factor revert.
async function reset3dToBaseline() {
  await setStyle3d(page, 'Native');
  await setGeoMode(page, 'auto');
  await page.waitForTimeout(250); // let the native controls mount
  await setDropdown(page, 'Material', 'Matte Clay');
  await setSlider(page, 'Polish', 0.5);
  await setSlider(page, 'Reflection', 0.5);
  await setSlider(page, 'Sheen', 0.5);
  await setSlider(page, 'Outline', 0);
  await page.waitForTimeout(250);
}

async function ofat3d(object, source, dir) {
  const panels = [];
  // CLEAN 3D baseline: Native style + Auto geometry + default material/sliders.
  await reset3dToBaseline();
  const cleanShot = `${dir}/clean.png`;
  await screenshotMain(page, cleanShot);
  const cleanSig = await canvasShotSig(page);
  panels.push({ file: cleanShot, label: 'CLEAN (auto+Native)' });
  emit(rowFor(object, source, 'baseline', 'clean', cleanShot, dir, null));

  for (const f of FACTORS_3D) {
    for (const [level, value] of f.levels) {
      let setOk = true; let applied = '';
      if (f.kind === 'mode3d') { await setGeoMode(page, value); setOk = true; applied = value; }
      else if (f.kind === 'style3d') { await setStyle3d(page, value); setOk = true; applied = value; }
      else if (f.kind === 'dropdown3d') { const r = await setDropdown(page, f.label, value); setOk = r.ok; applied = await readDropdown(page, f.label); await page.waitForTimeout(900); }
      else if (f.kind === 'slider') { const r = await setSlider(page, f.label, value); setOk = r.ok; applied = r.ok ? r.now : ''; await page.waitForTimeout(700); }
      const shot = `${dir}/${f.id}-${level}.png`;
      await screenshotMain(page, shot);
      const sig = await canvasShotSig(page);
      panels.push({ file: shot, label: `${f.id} @${level}=${value}` });
      emit(rowFor(object, source, f.id, level, shot, dir, changed(sig, cleanSig), { value, setOk, applied }));
      // REVERT: FULL reset of ALL 3D controls before the next factor. The old
      // revert only reset style3d + geoMode, so material/polish/reflection/sheen/
      // outline LEAKED their last value into every subsequent factor — broke OFAT
      // isolation (the finish-toggle staircase of byte-identical cross-factor
      // frames: material-H==polish-M==…). 2026-06-23.
      await reset3dToBaseline();
    }
  }
  return { panels, cleanSig };
}

function changed(sig, cleanSig) {
  if (!sig || !cleanSig) return null;
  if (sig.hash && cleanSig.hash) return sig.hash !== cleanSig.hash;
  return null;
}
function rowFor(object, source, factor, value, screenshot, dir, pixelChanged, extra = {}) {
  return {
    object, source, factor, value, // value = L/M/H level (or 'clean'/baseStyle name)
    level: value, setValue: extra.value ?? null, applied: extra.applied ?? null, setOk: extra.setOk ?? null,
    baseStyle: extra.baseStyle ?? null,
    screenshot, contactSheet: `${dir}/_contact.png`,
    status: '', // filled later by vision-read pass (paired-with-Clean)
    pixelChangedVsClean: pixelChanged,
    regime: REGIME, port: Number(PORT), ts: new Date().toISOString(),
  };
}

// ── per-object-source idempotency ──
function srcDir(object, source) { return `${OUT}/${object}/${source}`; }
function alreadyDone(object, source) {
  const d = srcDir(object, source);
  return !FORCE && existsSync(`${d}/_contact.png`) && existsSync(`${d}/clean.png`);
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN LOOP
// ════════════════════════════════════════════════════════════════════════════
let nObj = 0;
for (const obj of work) {
  nObj++;
  const objLabel = `[${nObj}/${work.length}] ${obj.shape}`;

  // ── SOURCE: 2d-draw (manual draw via the real tools) ──
  if (SOURCES.includes('2d-draw')) {
    const source = '2d-draw'; const dir = srcDir(obj.shape, source);
    if (alreadyDone(obj.shape, source)) { console.log(`${objLabel} ${source}: skip (done)`); }
    else {
      mkdirSync(dir, { recursive: true });
      try {
        await page.goto(`${BASE}/canvas`, { waitUntil: 'networkidle' }); await page.waitForTimeout(500);
        const draw = await manualDraw(page, obj);
        emit({ object: obj.shape, source, factor: 'draw-tools', value: 'live-verify', level: 'na', screenshot: `${dir}/clean.png`, contactSheet: `${dir}/_contact.png`, status: '', note: `strokes=${draw.strokes} tools=${draw.tools.join('+')} regions=${draw.regions}`, regime: REGIME, port: Number(PORT), ts: new Date().toISOString() });
        await commitDone(page);
        const { panels } = await ofat2d(obj.shape, source, dir);
        await buildContactSheet(page, panels, `${dir}/_contact.png`, { title: `${obj.shape} · 2d-draw · Clean + 2D toggles @L/M/H` });
        flushManifest();
        console.log(`${objLabel} ${source}: drawn(${draw.strokes}) → ${panels.length} panels`);
      } catch (e) { console.log(`${objLabel} ${source} ERR`, e.message.slice(0, 120)); emit({ object: obj.shape, source, factor: '(crash)', value: e.message.slice(0, 120), status: 'broken', regime: REGIME, ts: new Date().toISOString() }); flushManifest(); }
    }
  }

  // ── SOURCE: svg-upload (self-upload the object's own /audit SVG) ──
  if (SOURCES.includes('svg-upload')) {
    const source = 'svg-upload'; const dir = srcDir(obj.shape, source);
    if (alreadyDone(obj.shape, source)) { console.log(`${objLabel} ${source}: skip (done)`); }
    else {
      mkdirSync(dir, { recursive: true });
      try {
        const svgPath = `${dir}/_source.svg`; writeFileSync(svgPath, obj.markup);
        await page.goto(`${BASE}/canvas`, { waitUntil: 'networkidle' }); await page.waitForTimeout(500);
        const up = await uploadSvgFile(page, svgPath);
        if (!up) throw new Error('no file input');
        const { panels } = await ofat2d(obj.shape, source, dir);
        await buildContactSheet(page, panels, `${dir}/_contact.png`, { title: `${obj.shape} · svg-upload · Clean + 2D toggles @L/M/H` });
        flushManifest();
        console.log(`${objLabel} ${source}: uploaded → ${panels.length} panels`);
      } catch (e) { console.log(`${objLabel} ${source} ERR`, e.message.slice(0, 120)); emit({ object: obj.shape, source, factor: '(crash)', value: e.message.slice(0, 120), status: 'broken', regime: REGIME, ts: new Date().toISOString() }); flushManifest(); }
    }
  }

  // ── SOURCE: 3d (convert the manual-drawn object, OFAT 3D toggles) ──
  if (SOURCES.includes('3d')) {
    const source = '3d'; const dir = srcDir(obj.shape, source);
    if (alreadyDone(obj.shape, source)) { console.log(`${objLabel} ${source}: skip (done)`); }
    else {
      mkdirSync(dir, { recursive: true });
      try {
        await page.goto(`${BASE}/canvas`, { waitUntil: 'networkidle' }); await page.waitForTimeout(500);
        const draw = await manualDraw(page, obj);
        await commitDone(page);
        await to3D(page);
        const has3d = await has3dCanvas(page); const gate = await gateBlocked(page);
        if (!has3d || gate) {
          await screenshotMain(page, `${dir}/clean.png`);
          emit({ object: obj.shape, source, factor: '2d→3d-convert', value: 'auto', level: 'na', screenshot: `${dir}/clean.png`, contactSheet: `${dir}/_contact.png`, status: 'broken', note: `gate=${gate} has3d=${has3d} strokes=${draw.strokes}`, regime: REGIME, port: Number(PORT), ts: new Date().toISOString() });
          await buildContactSheet(page, [{ file: `${dir}/clean.png`, label: 'convert FAILED (no 3D / gate)' }], `${dir}/_contact.png`, { title: `${obj.shape} · 3d · CONVERT BLOCKED` });
          console.log(`${objLabel} ${source}: convert blocked (gate=${gate} has3d=${has3d})`);
        } else {
          const { panels } = await ofat3d(obj.shape, source, dir);
          await buildContactSheet(page, panels, `${dir}/_contact.png`, { title: `${obj.shape} · 3d · Clean + 3D toggles @L/M/H` });
          console.log(`${objLabel} ${source}: 3D ok → ${panels.length} panels`);
        }
        flushManifest();
      } catch (e) { console.log(`${objLabel} ${source} ERR`, e.message.slice(0, 120)); emit({ object: obj.shape, source, factor: '(crash)', value: e.message.slice(0, 120), status: 'broken', regime: REGIME, ts: new Date().toISOString() }); flushManifest(); }
    }
  }
}

// ── online-svg source (external fixtures), only when --with-fixtures ──
for (const fx of onlineFixtures) {
  const object = `fixture:${fx.name}`; const source = 'online-svg'; const dir = srcDir(object, source);
  if (alreadyDone(object, source)) { console.log(`online-svg ${fx.name}: skip (done)`); continue; }
  mkdirSync(dir, { recursive: true });
  try {
    await page.goto(`${BASE}/canvas`, { waitUntil: 'networkidle' }); await page.waitForTimeout(500);
    const up = await uploadSvgFile(page, fx.path);
    if (!up) throw new Error('no file input');
    const { panels } = await ofat2d(object, source, dir);
    await buildContactSheet(page, panels, `${dir}/_contact.png`, { title: `${fx.name} · online-svg · Clean + 2D toggles @L/M/H` });
    // also a 3D pass on the fixture
    const dir3 = srcDir(object, '3d'); mkdirSync(dir3, { recursive: true });
    await to3D(page);
    if (await has3dCanvas(page) && !(await gateBlocked(page))) {
      const r3 = await ofat3d(object, '3d', dir3);
      await buildContactSheet(page, r3.panels, `${dir3}/_contact.png`, { title: `${fx.name} · online-svg→3d · Clean + 3D toggles @L/M/H` });
    }
    flushManifest();
    console.log(`online-svg ${fx.name}: uploaded → ${panels.length} 2D panels`);
  } catch (e) { console.log(`online-svg ${fx.name} ERR`, e.message.slice(0, 120)); emit({ object, source, factor: '(crash)', value: e.message.slice(0, 120), status: 'broken', regime: REGIME, ts: new Date().toISOString() }); flushManifest(); }
}

flushManifest();
await browser.close();

const panelRows = manifestRows.filter((r) => r.screenshot && r.factor !== 'draw-tools' && r.factor !== '(crash)');
const totalInFile = priorRows.filter((r) => !touchedKeys.has(`${r.object}::${r.source}`)).length + manifestRows.length;
console.log('\n════════ BIG-DADDY DONE ════════');
console.log(`objects: ${work.length} · sources: ${SOURCES.join(',')}${WITH_FIXTURES ? '+online-svg' : ''}`);
console.log(`new rows this run: ${manifestRows.length} (panels: ${panelRows.length}) · total in manifest: ${totalInFile} → ${manifestPath}`);
console.log(`2D factors: ${TALLY.factors2d} (×3 L/M/H = ${TALLY.factors2d * 3} per 2D source) · 3D factors: ${TALLY.factors3d} (×3 = ${TALLY.factors3d * 3} per 3D source)`);
console.log(`console errs during run: ${allErrs.length}`);
if (allErrs.length) console.log('  first errs:', JSON.stringify(allErrs.slice(0, 5)));
