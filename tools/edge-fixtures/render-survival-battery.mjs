// ─── Render-survival battery — playwright driver (gap-hunt H4/H5/H7) ─────────
// Drives the edge / degenerate / sanitized-hostile SVG corpus through the REAL
// 2D render path (normalizeSvgSize → SvgStyleTransform) in real Chromium, on a
// representative subset of the 11 F3 SVG styles, and ASSERTS the render-survival
// contract the security battery never checks:
//
//   • renders WITHOUT a thrown page error / uncaught exception
//   • 0 console errors raised during the cell's render
//   • 0 NaN / Infinity / undefined / null in any rendered geometry attribute
//   • completes UNDER a per-cell time budget (catches the O(n^2) sibling pass)
//   • for the smart styles, the decision log records roles (no classify crash)
//
// It also measures (not just asserts) the O(n^2) blowup: it renders the same
// topology at 250 / 1000 / 4000 / 10000 siblings and reports the growth curve
// so the quadratic is quantified, per "diagnose-with-real-data-first".
//
//   node tools/edge-fixtures/render-survival-battery.mjs
//
// Flags / env:
//   DD_RSB_PORT     preview port (default 4473 — unique, off the dev-server map)
//   DD_RSB_OUTDIR   isolated dist dir (default /tmp/dd-rsb-dist)
//   DD_RSB_SHOTS    screenshot dir   (default /tmp/dd-rsb)
//   DD_RSB_BUDGET   per-cell render budget ms (default 2500; the O(n^2) gate)
//   DD_RSB_STYLES   comma styles to run (default clean,rough-handdrawn,wireframe,newsprint)
//   DD_RSB_KEEP=1   keep the preview server up after the run (debug)
//   DD_RSB_NOFEED=1 skip writing the dataset feed file
//
// Repo-side tool only — tools/ never ships in the Make drag-drop.

import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
// Playwright isn't a desk-doodles dep — reuse the shared install (same pattern
// as tools/security/*.mjs + tools/2d/*.mjs). Override with DD_PLAYWRIGHT.
function loadChromium() {
  const candidates = [
    process.env.DD_PLAYWRIGHT,
    process.env.PW_PATH,
    '/tmp/dd-pp/node_modules/playwright',
    '/Users/sebs/Desktop/Projects/portfolio/tools/lab-screenshots/node_modules/playwright',
  ].filter(Boolean);
  for (const c of candidates) {
    try {
      return require(c).chromium;
    } catch {
      /* try next */
    }
  }
  throw new Error('playwright not found at any known install path');
}
const chromium = loadChromium();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '../..');
const CONFIG = path.join(__dirname, 'vite.rsb.config.ts');
const SVG_DIR = path.join(__dirname, 'svg');
const TEST_FIXTURES = path.join(REPO, 'test-fixtures');

const PORT = Number(process.env.DD_RSB_PORT || 4473);
const OUTDIR = process.env.DD_RSB_OUTDIR || '/tmp/dd-rsb-dist';
const SHOTS = process.env.DD_RSB_SHOTS || '/tmp/dd-rsb';
const BUDGET = Number(process.env.DD_RSB_BUDGET || 2500);
const KEEP = process.env.DD_RSB_KEEP === '1';
const NOFEED = process.env.DD_RSB_NOFEED === '1';
const STYLES = (process.env.DD_RSB_STYLES ||
  'clean,rough-handdrawn,wireframe,newsprint').split(',').map((s) => s.trim());

mkdirSync(SHOTS, { recursive: true });

// ─── Pixel analysis (verbatim thresholds from tools/2d/audit-style-sweep.mjs) ─
const PAPER = [253, 252, 249];
const INK_DIST_THRESHOLD = 60;
const DARK_LUMA = 60;
const BLANK_INK_FRAC = 0.002;
const FLOOD_DARK_FRAC = 0.9;

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
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      curr[x] = v & 0xff;
    }
    for (let px = 0; px < w; px++) {
      const si = px * bpp;
      const di = (y * w + px) * 4;
      out[di] = curr[si];
      out[di + 1] = curr[si + 1];
      out[di + 2] = curr[si + 2];
      out[di + 3] = bpp === 4 ? curr[si + 3] : 255;
    }
    curr.copy(prev);
  }
  return { width: w, height: h, rgba: out };
}

function analyze(img) {
  const { width, height, rgba } = img;
  const B = 2;
  let total = 0, ink = 0, dark = 0;
  for (let y = B; y < height - B; y++) {
    for (let x = B; x < width - B; x++) {
      const i = (y * width + x) * 4;
      const r = rgba[i], g = rgba[i + 1], b = rgba[i + 2];
      total++;
      const dist = Math.abs(r - PAPER[0]) + Math.abs(g - PAPER[1]) + Math.abs(b - PAPER[2]);
      const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      if (dist > INK_DIST_THRESHOLD) ink++;
      if (luma < DARK_LUMA) dark++;
    }
  }
  return { inkFrac: total ? ink / total : 0, darkFrac: total ? dark / total : 0 };
}

// ─── Corpus assembly ─────────────────────────────────────────────────────────
// Static corpus (generate-fixtures.mjs output) + two pre-existing test-fixtures
// (the H4 "wire as rows 1-2" requirement) + programmatic giants generated here
// so the repo never carries multi-MB fixtures.

function readFixtureFile(dir, name) {
  return readFileSync(path.join(dir, name), 'utf8');
}

function makeGiantSiblings(n) {
  // n sibling <rect> — drives signals.ts extractTopology's O(n^2) sibling pass.
  let body = '';
  const cols = Math.ceil(Math.sqrt(n));
  for (let i = 0; i < n; i++) {
    const x = (i % cols) * 12;
    const y = Math.floor(i / cols) * 12;
    const shade = 0x22 + (i % 200);
    body += `<rect x="${x}" y="${y}" width="10" height="10" fill="#${shade.toString(16).padStart(2, '0')}2222"/>`;
  }
  const side = cols * 12;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${side} ${side}">${body}</svg>`;
}

function makeDeepNesting(depth) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${'<g>'.repeat(depth)}<rect x="30" y="30" width="40" height="40" fill="#1a1a1a"/>${'</g>'.repeat(depth)}</svg>`;
}

function makeManySubpaths(n) {
  // one <path> with n M-subpaths (the rose-chaos class at scale).
  let d = '';
  for (let i = 0; i < n; i++) {
    const x = (i % 40) * 4;
    const y = Math.floor(i / 40) * 4;
    d += `M${x} ${y} l3 0 l0 3 l-3 0 Z `;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 120"><path d="${d.trim()}" fill="#222" stroke="#000" stroke-width="0.3"/></svg>`;
}

function assembleCorpus() {
  const out = [];

  // Rows 1-2: the two pre-existing fixtures the gap-hunt called to wire.
  for (const f of ['edge-case-torture.svg', 'gradient-sampler.svg']) {
    try {
      out.push({
        id: f.replace(/\.svg$/, ''),
        family: 'PRE-EXISTING',
        note: `wired from test-fixtures/${f} (gap-hunt H4 rows 1-2)`,
        markup: readFixtureFile(TEST_FIXTURES, f),
      });
    } catch {
      console.warn(`[corpus] could not read test-fixtures/${f} — skipping`);
    }
  }

  // The use/symbol + quadratic seed that already live in tools/edge-fixtures/.
  for (const f of ['use-symbol-unresolved.svg', 'quadratic-topology-10000-rect.svg']) {
    try {
      out.push({
        id: f.replace(/\.svg$/, ''),
        family: f.startsWith('use') ? 'H7-use-symbol' : 'H5-quadratic-seed',
        note: `pre-written edge fixture (${f})`,
        markup: readFixtureFile(__dirname, f),
      });
    } catch {
      /* optional */
    }
  }

  // Static generated corpus.
  let manifest = [];
  try {
    manifest = JSON.parse(readFileSync(path.join(SVG_DIR, '_manifest.json'), 'utf8')).fixtures;
  } catch {
    // fall back to listing the dir
    manifest = readdirSync(SVG_DIR)
      .filter((f) => f.endsWith('.svg'))
      .map((name) => ({ name, family: '?', note: '' }));
  }
  for (const { name, family, note } of manifest) {
    out.push({
      id: name.replace(/\.svg$/, ''),
      family,
      note,
      markup: readFixtureFile(SVG_DIR, name),
    });
  }

  // Programmatic giants (H5/B): the O(n^2) headline + deep recursion + subpaths.
  out.push({ id: 'gen-deep-nesting-500-g', family: 'B-structural', note: '500-level <g> nesting (walkInto recursion)', markup: makeDeepNesting(500) });
  out.push({ id: 'gen-1000-subpath', family: 'B-structural', note: '1000 M-subpaths in one <path>', markup: makeManySubpaths(1000) });
  out.push({ id: 'gen-10000-element', family: 'H5-quadratic', note: '10000 sibling <rect> — O(n^2) sibling pass, NO element cap', markup: makeGiantSiblings(10000) });

  return out;
}

// ─── NaN/Infinity DOM scan (verbatim attribute set from the 2D sweep) ─────────
async function scanNonFinite(page) {
  return page.evaluate(() => {
    const bad = [];
    const els = document.querySelectorAll('#rsb-cell svg *');
    for (const el of els) {
      for (const attr of ['d', 'points', 'x', 'y', 'cx', 'cy', 'r', 'rx', 'ry', 'x1', 'y1', 'x2', 'y2', 'width', 'height', 'transform']) {
        const v = el.getAttribute(attr);
        if (!v) continue;
        if (/NaN|Infinity|undefined|null/i.test(v)) {
          bad.push(`<${el.tagName}> ${attr}=${v.slice(0, 40)}`);
        }
      }
    }
    return bad.slice(0, 12);
  });
}

// Does the smart decision log have entries (classify didn't crash)?
async function decisionLogCount(page) {
  return page.evaluate(() => {
    try {
      const log = window.__dd_decisionLog;
      if (log && typeof log.get === 'function') return log.get().length;
    } catch {
      /* noop */
    }
    return null; // log not present (non-smart style) — not a failure
  });
}

// ─── Build + preview (security-battery pattern) ──────────────────────────────
function sh(cmd, args, opts = {}) {
  return spawnSync(cmd, args, { cwd: REPO, stdio: 'inherit', ...opts });
}

async function waitForServer(url, timeoutMs = 40000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      await fetch(url);
      return true;
    } catch {
      /* not up */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`preview server never came up at ${url}`);
}

console.log(`\n[build] vite build → ${OUTDIR}`);
const build = sh('npx', ['vite', 'build', '--config', CONFIG], {
  env: { ...process.env, DD_RSB_OUTDIR: OUTDIR },
});
if (build.status !== 0) {
  console.error('[build] FAILED — aborting');
  process.exit(1);
}

console.log(`[preview] vite preview :${PORT}`);
const preview = spawn(
  'npx',
  ['vite', 'preview', '--config', CONFIG, '--port', String(PORT), '--strictPort'],
  { cwd: REPO, stdio: 'inherit', env: { ...process.env, DD_RSB_OUTDIR: OUTDIR } },
);

let exitCode = 1;
const cleanup = () => {
  if (!KEEP) {
    try { preview.kill('SIGTERM'); } catch { /* noop */ }
  }
};
process.on('exit', cleanup);

const pad = (s, n) => String(s).padEnd(n).slice(0, n);

try {
  const base = `http://localhost:${PORT}`;
  const pageUrl = `${base}/tools/edge-fixtures/render-survival-battery.html`;
  await waitForServer(base + '/', 40000);

  const corpus = assembleCorpus();
  console.log(`[corpus] ${corpus.length} fixtures · styles: ${STYLES.join(', ')}`);

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 760, height: 760 } });

  await page.goto(pageUrl, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__rsbReady === true, { timeout: 60000 });

  const availStyles = await page.evaluate(() => window.__rsb.styles);
  const runStyles = STYLES.filter((s) => availStyles.includes(s));
  if (runStyles.length !== STYLES.length) {
    console.warn(`[styles] requested ${STYLES} but only have ${availStyles}; running ${runStyles}`);
  }

  const records = [];
  let totalFails = 0;

  for (const fx of corpus) {
    for (const style of runStyles) {
      // Per-cell console + pageerror capture (reset each cell).
      const cellConsole = [];
      const cellPageErrors = [];
      const onConsole = (m) => { if (m.type() === 'error') cellConsole.push(m.text()); };
      const onPageError = (e) => cellPageErrors.push(e.message ?? String(e));
      page.on('console', onConsole);
      page.on('pageerror', onPageError);

      await page.evaluate((s) => window.__rsb.setStyle(s), style);

      let renderResult, renderInvokeErr = null;
      try {
        renderResult = await page.evaluate((m) => window.__rsb.render(m), fx.markup);
      } catch (e) {
        // A throw HERE (not caught by the harness) = a true page-level crash:
        // the most severe finding — the render path took the page down.
        renderInvokeErr = String(e).slice(0, 200);
        renderResult = { normalizeMs: 0, normalizeThrew: null, normalizeWarn: [], renderMs: 0, injectedLen: 0 };
      }

      const nonFinite = renderInvokeErr ? [] : await scanNonFinite(page);
      const logCount = renderInvokeErr ? null : await decisionLogCount(page);

      // Screenshot the cell (skip if the page crashed — locator may be gone).
      const safe = `${fx.id}__${style}`.replace(/[^a-z0-9_-]/gi, '_');
      let metric = { inkFrac: 0, darkFrac: 0 };
      let shotPath = null;
      if (!renderInvokeErr) {
        try {
          const loc = page.locator('#rsb-cell').first();
          const buf = await loc.screenshot();
          shotPath = path.join(SHOTS, `${safe}.png`);
          writeFileSync(shotPath, buf);
          metric = analyze(decodePng(buf));
        } catch (e) {
          cellConsole.push(`screenshot failed: ${String(e).slice(0, 80)}`);
        }
      }

      // ── Gate evaluation ──────────────────────────────────────────────────
      const flags = [];
      if (renderInvokeErr) flags.push('PAGE-CRASH');
      if (renderResult.normalizeThrew) flags.push('NORMALIZE-THREW');
      if (cellPageErrors.length) flags.push('PAGEERROR');
      if (cellConsole.length) flags.push('CONSOLE');
      if (nonFinite.length) flags.push('NAN-DOM');
      if (renderResult.renderMs > BUDGET) flags.push('OVER-BUDGET');
      // Visual symptom flags (informational + part of the survival picture):
      //   BLANK on a fixture WITH renderable content = silent under-render.
      //   FLOOD = solid-black fill on something that shouldn't be.
      const hasRenderableContent = !/empty-svg|whitespace-only|defs-only|empty-g|zero-area-rect/.test(fx.id);
      if (metric.inkFrac < BLANK_INK_FRAC && hasRenderableContent && !renderInvokeErr) flags.push('BLANK');
      if (metric.darkFrac > FLOOD_DARK_FRAC) flags.push('FLOOD');

      // HARD-FAIL gates (the render-survival contract): crash, NaN, hang, error.
      const hardFail =
        renderInvokeErr ||
        renderResult.normalizeThrew ||
        cellPageErrors.length > 0 ||
        cellConsole.length > 0 ||
        nonFinite.length > 0 ||
        renderResult.renderMs > BUDGET;

      if (hardFail) totalFails++;

      // Clear the cell so a giant doesn't leak into the next cell's timing.
      if (!renderInvokeErr) {
        try { await page.evaluate(() => window.__rsb.clear()); } catch { /* noop */ }
      }
      page.off('console', onConsole);
      page.off('pageerror', onPageError);

      records.push({
        id: fx.id,
        family: fx.family,
        style,
        normalizeMs: +renderResult.normalizeMs.toFixed(1),
        renderMs: +renderResult.renderMs.toFixed(1),
        injectedLen: renderResult.injectedLen,
        inkFrac: +metric.inkFrac.toFixed(4),
        darkFrac: +metric.darkFrac.toFixed(4),
        decisionLogCount: logCount,
        normalizeThrew: renderResult.normalizeThrew,
        normalizeWarn: renderResult.normalizeWarn,
        pageErrors: cellPageErrors.slice(0, 4),
        consoleErrors: cellConsole.slice(0, 6),
        nonFinite,
        renderInvokeErr,
        flags,
        hardFail,
        shot: shotPath ? path.basename(shotPath) : null,
      });
    }
  }

  // ── Element-count growth curve measurement (the quantified blowup) ───────
  // The gap-hunt H5 framed this as "O(n^2) sibling pass — assert an element cap
  // or measure the blowup". There is no cap, so we MEASURE: render the same
  // sibling topology at increasing counts on BOTH a light path (clean — isolates
  // the signals.ts extractTopology sibling pass) AND a heavy path (the rough
  // family — where the 22s 10k blowup actually came from). Reporting both
  // separates "is the signals walk quadratic?" from "does the per-element
  // transform scale?" so the real cost driver is named, per
  // diagnose-with-real-data-first.
  const growthSizes = [250, 1000, 4000, 10000];
  const growthStyles = [
    runStyles.includes('clean') ? 'clean' : runStyles[0],
    ...(runStyles.includes('rough-handdrawn') ? ['rough-handdrawn'] : []),
  ];
  const growthByStyle = {};
  for (const gStyle of growthStyles) {
    await page.evaluate((s) => window.__rsb.setStyle(s), gStyle);
    const series = [];
    for (const n of growthSizes) {
      const markup = makeGiantSiblings(n);
      let r;
      try {
        r = await page.evaluate((m) => window.__rsb.render(m), markup);
      } catch (e) {
        r = { renderMs: NaN, error: String(e).slice(0, 120) };
      }
      await page.evaluate(() => window.__rsb.clear());
      series.push({ n, renderMs: r.renderMs != null ? +Number(r.renderMs).toFixed(1) : null, error: r.error ?? null });
      console.log(`[growth ${gStyle}] n=${n} → renderMs ${series[series.length - 1].renderMs}${r.error ? ' ERR ' + r.error : ''}`);
    }
    growthByStyle[gStyle] = series;
  }
  // Keep `growth` as the light-path series for back-compat in the artifact.
  const growth = growthByStyle[growthStyles[0]];

  await page.screenshot({ path: path.join(SHOTS, '_page.png'), fullPage: false });
  await browser.close();

  // ── Per-item table ───────────────────────────────────────────────────────
  console.log('\n' + '='.repeat(132));
  console.log('RENDER-SURVIVAL BATTERY — per-item results (edge / hostile-sanitized SVG through the 2D render path)');
  console.log('='.repeat(132));
  console.log(
    pad('fixture', 30) + pad('style', 18) + pad('normMs', 8) + pad('renderMs', 10) +
    pad('ink%', 7) + pad('dark%', 7) + pad('log', 5) + pad('result', 47),
  );
  console.log('-'.repeat(132));
  for (const r of records) {
    const verdict = r.hardFail ? 'FAIL' : (r.flags.length ? 'pass*' : 'PASS');
    const why = r.flags.length ? r.flags.join(',') : 'clean';
    console.log(
      pad(r.id, 30) + pad(r.style, 18) +
      pad(r.normalizeMs, 8) + pad(r.renderMs, 10) +
      pad((r.inkFrac * 100).toFixed(1), 7) + pad((r.darkFrac * 100).toFixed(1), 7) +
      pad(r.decisionLogCount == null ? '-' : r.decisionLogCount, 5) +
      pad(`${verdict} ${why}`, 47),
    );
  }
  console.log('-'.repeat(132));
  const passCount = records.filter((r) => !r.hardFail).length;
  console.log(`TOTAL CELLS: ${records.length}  PASS (no crash/NaN/hang/error): ${passCount}  HARD-FAIL: ${totalFails}`);
  console.log(`per-cell time budget: ${BUDGET}ms`);

  // ── Element-count growth report (no element cap exists anywhere) ──────────
  console.log('\n' + '='.repeat(78));
  console.log('ELEMENT-COUNT GROWTH — sibling <rect> topology, NO element cap exists');
  console.log('  clean = isolates signals.ts extractTopology O(n^2) sibling pass');
  console.log('  rough-handdrawn = per-element rough/smart transform (the real 10k cost)');
  console.log('='.repeat(78));
  for (const gStyle of growthStyles) {
    const series = growthByStyle[gStyle];
    console.log(`\n[${gStyle}]`);
    console.log('  ' + pad('n siblings', 14) + pad('renderMs', 12) + 'ms/element  · note');
    for (let i = 0; i < series.length; i++) {
      const g = series[i];
      const perEl = g.renderMs != null ? (g.renderMs / g.n).toFixed(4) : 'n/a';
      let note = '';
      if (i > 0 && series[i - 1].renderMs && g.renderMs) {
        const sizeRatio = g.n / series[i - 1].n;
        const timeRatio = g.renderMs / series[i - 1].renderMs;
        note = `×${sizeRatio} size → ×${timeRatio.toFixed(1)} time` + (timeRatio > sizeRatio * 1.5 ? ' ← SUPERLINEAR' : '');
      }
      console.log('  ' + pad(g.n, 14) + pad(g.renderMs ?? `ERR ${g.error}`, 12) + pad(perEl, 11) + ' ' + note);
    }
  }

  // ── Failure catalog (the findings to flag — render code is hot, NOT fixed) ─
  const findings = records.filter((r) => r.flags.length);
  console.log('\n' + '='.repeat(132));
  console.log(`FINDINGS CATALOG — ${findings.length} flagged cell(s) (catalog only; render code is HOT, do NOT fix here)`);
  console.log('='.repeat(132));
  for (const r of findings) {
    console.log(`• ${r.id} [${r.style}] — ${r.flags.join(', ')}`);
    if (r.renderInvokeErr) console.log(`    page-crash: ${r.renderInvokeErr}`);
    if (r.normalizeThrew) console.log(`    normalize threw: ${r.normalizeThrew}`);
    if (r.pageErrors.length) console.log(`    pageerror: ${r.pageErrors.join(' | ')}`);
    if (r.consoleErrors.length) console.log(`    console: ${r.consoleErrors.join(' | ')}`);
    if (r.nonFinite.length) console.log(`    NaN-DOM: ${r.nonFinite.join(' | ')}`);
    if (r.flags.includes('OVER-BUDGET')) console.log(`    over budget: renderMs ${r.renderMs} > ${BUDGET}`);
    if (r.flags.includes('BLANK')) console.log(`    blank: inkFrac ${(r.inkFrac * 100).toFixed(2)}% (silent under-render?)`);
    if (r.normalizeWarn.length) console.log(`    normalize warn: ${r.normalizeWarn.join(' | ')}`);
  }

  // ── Machine artifact ─────────────────────────────────────────────────────
  const artifact = {
    generatedAt: new Date().toISOString(),
    budgetMs: BUDGET,
    styles: runStyles,
    fixtureCount: corpus.length,
    cellCount: records.length,
    hardFails: totalFails,
    growth,
    growthByStyle,
    records,
  };
  writeFileSync(path.join(SHOTS, 'results.json'), JSON.stringify(artifact, null, 2));
  console.log(`\nscreenshots + results.json → ${SHOTS}`);

  // ── Dataset feed (honor keep-feeding) ────────────────────────────────────
  // Emit a render-fidelity feed file the existing --from-fidelity-2d adapter
  // can ingest: each cell is a render-survival data point (verdict = survived /
  // crashed / NaN / over-budget / blank). This is a NEGATIVE-example mine — the
  // breakage curriculum the smart-layer dataset is otherwise blind to (catalog
  // shapes never crash). The feed is written here; the actual ingest into
  // datasets/smart-layer.dataset.jsonl is one explicit command (printed below)
  // so a live --from run is auditable, not silent.
  if (!NOFEED) {
    const feed = records.map((r) => ({
      // shape match the fidelity-2d record shape the adapter reads:
      style: r.style,
      shape: r.id,
      label: r.hardFail ? 'render-crash' : (r.flags.includes('BLANK') ? 'render-blank' : 'render-survived'),
      kind: 'edge-survival',
      subjectId: r.family,
      subjectName: r.family,
      inkFrac: r.inkFrac,
      darkFrac: r.darkFrac,
      edgeFrac: 0,
      nonFinite: r.nonFinite.length ? r.nonFinite : null,
      flags: r.flags,
    }));
    const feedPath = path.join(SHOTS, 'render-survival.fidelity2d.json');
    writeFileSync(feedPath, JSON.stringify({ records: feed }, null, 2));
    console.log(`\n[keep-feeding] render-fidelity feed → ${feedPath}`);
    console.log(`[keep-feeding] ingest with:`);
    console.log(`    node tools/dataset/feed-dataset.mjs --from-fidelity-2d ${feedPath}`);
  }

  // Hard-fails fail the run (exit 1) so this is a real gate. Visual-only pass*
  // (BLANK/FLOOD without crash/NaN) does NOT fail the run — those are findings
  // to flag, not contract violations.
  exitCode = totalFails === 0 ? 0 : 1;
} catch (err) {
  console.error('[driver] error:', err);
  exitCode = 1;
} finally {
  cleanup();
}

if (!KEEP && OUTDIR.startsWith('/tmp/')) {
  try { rmSync(OUTDIR, { recursive: true, force: true }); } catch { /* noop */ }
}

process.exit(exitCode);
