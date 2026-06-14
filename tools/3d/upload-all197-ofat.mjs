// upload-all197-ofat — the all-197 SVG-UPLOAD pipeline harness core.
//
// Sebs's law: the svg-upload OFAT must cover ALL 197 catalog objects (not 7), now
// that upload→3D is wired (commit 8b3dba3). For each object it extracts the
// rendered SVG from /audit, writes it to a temp .svg, uploads it through the REAL
// "Upload SVG" file input on /canvas, checks 2D, flips to 3D, sweeps geometry
// modes. Produces screenshots + a mechanical verdict row per object; the calling
// agent vision-reads paired-with-Clean for the dataset.
//
// Usage:
//   node tools/3d/upload-all197-ofat.mjs --port 5182 --objects macbook,monitor --out /tmp/dd-up
//   node tools/3d/upload-all197-ofat.mjs --port 53XX --chunk 0/4 --out /tmp/dd-up-c0   (all-197 chunk)
//
// LAWS: read-only product src; never /desk publish (uses /canvas + /audit only);
// deterministic.

import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

function arg(name, def) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : def;
}
const PORT = arg('port', '5182');
const OUT = arg('out', '/tmp/dd-up');
const OBJECTS = arg('objects', '');
const CHUNK = arg('chunk', '');
const BASE = `http://localhost:${PORT}`;
mkdirSync(OUT, { recursive: true });
const SVGDIR = `${OUT}/svg`; mkdirSync(SVGDIR, { recursive: true });

let chromium;
for (const p of ['/tmp/dd-pp/node_modules/playwright', '/Users/sebs/Desktop/Projects/portfolio/tools/lab-screenshots/node_modules/playwright']) {
  try { ({ chromium } = require(p)); break; } catch {}
}
if (!chromium) { console.log('NO_PLAYWRIGHT'); process.exit(2); }

const MODES = ['auto', 'rod', 'extrude', 'inflate', 'solid'];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1500, height: 950 }, deviceScaleFactor: 2 });
const errs = [];
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
page.on('pageerror', (e) => errs.push('PAGEERR ' + e.message));

// ── 1. Extract each object's rendered SVG markup + a Clean cell shot from /audit ──
try { await page.goto(`${BASE}/audit`, { waitUntil: 'networkidle', timeout: 12000 }); }
catch { console.log('SERVER_DOWN'); await browser.close(); process.exit(3); }
await page.waitForTimeout(1200);

let catalog = await page.evaluate(() => {
  const cells = [...document.querySelectorAll('article[data-shape-id]')];
  const out = [];
  for (const cell of cells) {
    const shape = cell.getAttribute('data-shape-id');
    const subjectId = cell.getAttribute('data-subject-id');
    const svg = cell.querySelector('svg');
    if (!svg) continue;
    // Serialize a clean standalone SVG: ensure xmlns + viewBox survive.
    const clone = svg.cloneNode(true);
    if (!clone.getAttribute('xmlns')) clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    out.push({ shape, subjectId, markup: clone.outerHTML });
  }
  return out;
});
console.log(`catalog: ${catalog.length} objects extracted from /audit`);

if (OBJECTS) {
  const want = new Set(OBJECTS.split(',').map((s) => s.trim()));
  catalog = catalog.filter((c) => want.has(c.shape));
} else if (CHUNK) {
  const [i, N] = CHUNK.split('/').map(Number);
  catalog = catalog.filter((_, idx) => idx % N === i);
}
console.log(`working set: ${catalog.length} objects`);

// Clean baselines (paired-with-Clean)
for (const obj of catalog) {
  try {
    const cell = page.locator(`article[data-shape-id="${obj.shape}"]`).first();
    if (await cell.count()) await cell.screenshot({ path: `${OUT}/${obj.shape}-clean.png` });
  } catch { /* skip */ }
}

async function clickByText(re) {
  const btns = await page.$$('button, [role="tab"], [role="option"]');
  for (const b of btns) { const t = (await b.innerText().catch(() => '')).trim(); if (re.test(t)) { await b.click().catch(() => {}); return t; } }
  return null;
}

// ── 2. Upload each object's SVG → 2D → 3D mode sweep ──
const findings = [];
for (const obj of catalog) {
  const svgPath = `${SVGDIR}/${obj.shape}.svg`;
  writeFileSync(svgPath, obj.markup);
  await page.goto(`${BASE}/canvas`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const errsBefore = errs.length;
  await clickByText(/^Upload SVG$/);
  await page.waitForTimeout(300);
  const fileInput = await page.$('input[type="file"]');
  if (!fileInput) { findings.push({ object: obj.shape, subjectId: obj.subjectId, stage: 'upload', toggle: '(baseline)', level: 'default', verdict: 'BREAK', note: 'no file input', screenshot: '' }); continue; }
  await fileInput.setInputFiles(svgPath);
  await page.waitForTimeout(800);
  await page.locator('main').screenshot({ path: `${OUT}/${obj.shape}-2d.png` });
  // 3D mode sweep
  await clickByText(/^3D$/);
  await page.waitForTimeout(1800);
  const modeResults = {};
  for (const m of MODES) {
    await page.evaluate((mode) => { const s = window.__ddSet; if (s && s.setGeometryMode) s.setGeometryMode(mode); }, m);
    await page.waitForTimeout(1300);
    await page.locator('main').screenshot({ path: `${OUT}/${obj.shape}-3d-${m}.png` });
    const has3d = await page.evaluate(() => !!document.querySelector('main canvas'));
    const gate = await page.evaluate(() => /Nothing to convert/i.test(document.body.innerText || ''));
    modeResults[m] = { has3d, gate };
  }
  const newErrs = errs.slice(errsBefore);
  const any3d = MODES.some((m) => modeResults[m].has3d && !modeResults[m].gate);
  findings.push({ object: obj.shape, subjectId: obj.subjectId, stage: '2d', toggle: '(baseline)', level: 'default', verdict: newErrs.length ? 'BREAK' : 'PASS', note: `uploaded; errs=${newErrs.length}`, screenshot: `${obj.shape}-2d.png` });
  for (const m of MODES) {
    const r = modeResults[m];
    findings.push({ object: obj.shape, subjectId: obj.subjectId, stage: '3d-convert', toggle: 'geometryMode', level: m, verdict: r.has3d && !r.gate ? 'PASS' : 'WEAK', note: r.gate ? 'convert gate (no geometry)' : '', screenshot: `${obj.shape}-3d-${m}.png` });
  }
  console.log(`${obj.shape}: any3d=${any3d} errs=${newErrs.length} → ${newErrs.length ? 'BREAK' : (any3d ? 'PASS' : 'WEAK')}`);
}

writeFileSync(`${OUT}/upload-findings.json`, JSON.stringify({ port: PORT, count: findings.length, findings }, null, 2));
await browser.close();
console.log(`\nDONE ${findings.length} rows → ${OUT}/upload-findings.json (+ per-object svg/clean/2d/3d PNGs)`);
