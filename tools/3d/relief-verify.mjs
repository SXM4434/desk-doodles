// RELIEF VERIFY driver — before/after board for the bas-relief face fix.
// Drives the (statically-built) catalog-visual-3d harness through window.__vis.
// For a FACE (eyes/nose/smile), a POSTER (framed multi-region), and a couple of
// catalog shapes, renders SOLID + EXTRUDE in:
//   LEGACY  — the old raised-tube face-ink overlay (state.legacyTubes=true)
//   RELIEF  — the new carved bas-relief bumpMap (the shipped path)
// at a 3/4 orbit, and composes a contact sheet. Read the sheet: the marks
// should read as carved INTO the form in RELIEF, not wires plopped on top.
//
//   node tools/3d/relief-verify.mjs            (expects preview on :4492)
//   VIS_URL=http://host/tools/3d/catalog-visual-3d.html node tools/3d/relief-verify.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
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

const BASE_URL = process.env.VIS_URL ?? 'http://localhost:4492/tools/3d/catalog-visual-3d.html';
const OUT_DIR = process.env.OUT_DIR ?? '/tmp/dd-relief';
mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(join(OUT_DIR, 'cells'), { recursive: true });

// ─── Custom fixtures in viewBox 800×600 (y-down) ────────────────────────────
// A FACE: round head + two eyes + nose + smile (the prompt's multi-feature
// drawing). Strokes are dense polylines (the relief raster strokes them).
function circle(cx, cy, r, n = 48) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * Math.PI * 2;
    pts.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]);
  }
  return pts;
}
function arc(cx, cy, r, a0, a1, n = 28) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = a0 + (a1 - a0) * (i / n);
    pts.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]);
  }
  return pts;
}
function rect(x, y, w, h) {
  return [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]];
}

const FACE = [
  circle(400, 300, 200),          // head (closed → the solid mass / extrude outline)
  circle(335, 250, 26),           // left eye
  circle(465, 250, 26),           // right eye
  [[400, 270], [385, 330], [415, 330]], // nose (open V)
  arc(400, 320, 95, Math.PI * 0.18, Math.PI * 0.82, 40), // smile
];

// A POSTER: outer frame + an inner panel + a couple of "text" bars + a glyph.
const POSTER = [
  rect(220, 120, 360, 360),       // outer frame (the silhouette)
  rect(260, 160, 280, 150),       // inner image panel
  rect(260, 350, 280, 22),        // headline bar
  rect(260, 392, 200, 16),        // subhead bar
  rect(260, 424, 240, 16),        // body bar
  circle(400, 235, 55, 40),       // a roundel glyph inside the panel
];

const ANGLE = { angleDeg: 35, elevDeg: 22 }; // 3/4 read

// ─── run ────────────────────────────────────────────────────────────────────
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 760, height: 460 } });
const sheetPage = await browser.newPage({ viewport: { width: 1500, height: 1400 } });
const consoleErrors = [];
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200)); });
page.on('pageerror', (e) => consoleErrors.push('PAGEERR ' + String(e).slice(0, 200)));

console.log('→', BASE_URL);
await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__visReady === true, { timeout: 60000 });
const count = await page.evaluate(() => window.__vis.count);
console.log('harness ready, catalog count =', count);

// Pick a couple of catalog shapes that have interior structure (multi-region).
const shapes = await page.evaluate(() => window.__vis.shapes.map((s, i) => ({ i, kind: s.kind, shape: s.shape, label: s.label })));
// Heuristic: a trophy/medal + a peg tool with interior detail.
const pickByName = (re) => shapes.find((s) => re.test(s.shape) || re.test(s.label ?? ''));
const catA = pickByName(/trophy|medal|award|cup/i) ?? shapes[0];
const catB = pickByName(/calculator|clock|camera|console|keyboard|phone|radio/i) ?? shapes[10];
console.log('catalog picks:', catA.shape, '/', catB.shape);

const MODES = ['solid', 'extrude'];

async function renderState(state) {
  const r = await page.evaluate((st) => window.__vis.render3d(st), state);
  return r;
}

async function setCustom(strokes) {
  await page.evaluate((s) => window.__vis.setStrokes(s), strokes);
}
async function setCatalog(idx) {
  await page.evaluate((i) => window.__vis.sample(i), idx);
}

const rows = [];

async function caseRow(label, setup) {
  await setup();
  for (const gm of MODES) {
    const legacy = await renderState({ geometryMode: gm, style3d: 'native', materialPreset: gm === 'solid' ? 'matteClay' : 'glossyPlastic', ...ANGLE, legacyTubes: true });
    const relief = await renderState({ geometryMode: gm, style3d: 'native', materialPreset: gm === 'solid' ? 'matteClay' : 'glossyPlastic', ...ANGLE, legacyTubes: false });
    const tag = `${label}-${gm}`;
    writeFileSync(join(OUT_DIR, 'cells', `${tag}-BEFORE.png`), Buffer.from(legacy.dataUrl.split(',')[1], 'base64'));
    writeFileSync(join(OUT_DIR, 'cells', `${tag}-AFTER.png`), Buffer.from(relief.dataUrl.split(',')[1], 'base64'));
    rows.push({
      label: `${label} · ${gm.toUpperCase()}`,
      cells: [
        { src: legacy.dataUrl.split(',')[1], cap: `BEFORE tubes  obj${legacy.stats.objFrac} spread${legacy.stats.spread} Δ${legacy.stats.delta}`, fail: false, tone: 'before' },
        { src: relief.dataUrl.split(',')[1], cap: `AFTER relief  obj${relief.stats.objFrac} spread${relief.stats.spread} Δ${relief.stats.delta}`, fail: false, tone: 'after' },
      ],
    });
    console.log(`[${tag}] before: obj=${legacy.stats.objFrac} spread=${legacy.stats.spread} lum=${legacy.stats.lum} Δ=${legacy.stats.delta} | after: obj=${relief.stats.objFrac} spread=${relief.stats.spread} lum=${relief.stats.lum} Δ=${relief.stats.delta}`);
  }
}

await caseRow('face', () => setCustom(FACE));
await caseRow('poster', () => setCustom(POSTER));
await caseRow(`cat-${catA.shape}`.slice(0, 24), () => setCatalog(catA.i));
await caseRow(`cat-${catB.shape}`.slice(0, 24), () => setCatalog(catB.i));

// ─── contact sheet ──────────────────────────────────────────────────────────
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const rowHtml = rows.map((r) => {
  const cells = r.cells.map((c) =>
    `<figure class="${c.tone}"><img src="data:image/png;base64,${c.src}"/><figcaption>${esc(c.cap)}</figcaption></figure>`,
  ).join('');
  return `<div class="row"><div class="rl">${esc(r.label)}</div><div class="cells">${cells}</div></div>`;
}).join('');
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  body{margin:0;padding:16px;background:#fdfcf9;color:#3b362e;font:12px/1.35 -apple-system,system-ui,monospace}
  h1{font-size:15px;margin:0 0 4px} .sub{color:#6f6a60;margin:0 0 14px;font-size:11px}
  .row{display:flex;align-items:flex-start;gap:10px;margin-bottom:12px;border-bottom:1px solid #e6e0d4;padding-bottom:10px}
  .rl{width:160px;flex:0 0 160px;font-weight:700;word-break:break-word}
  .cells{display:flex;gap:10px}
  figure{margin:0;width:260px}
  figure img{display:block;width:260px;height:260px;border:1px solid #d8d2c6;background:#fff;object-fit:contain;border-radius:6px}
  figure.before img{border-color:#c0392b}
  figure.after img{border-color:#2e7d4f;border-width:2px}
  figcaption{font-size:10px;padding:3px 0;color:#6f6a60}
  figure.before figcaption{color:#c0392b}
  figure.after figcaption{color:#2e7d4f;font-weight:700}
</style></head><body>
  <h1>Bas-relief face fix — BEFORE (raised ink tubes) vs AFTER (carved relief bumpMap)</h1>
  <p class="sub">Solid + Extrude · Native · 3/4 orbit (35°/22°). Read the AFTER column: marks should read as carved INTO the surface (light catches the groove), not as separate wires sitting on top.</p>
  ${rowHtml}
</body></html>`;
await sheetPage.setContent(html, { waitUntil: 'networkidle' });
const body = await sheetPage.$('body');
await body.screenshot({ path: join(OUT_DIR, 'board.png') });

await browser.close();

writeFileSync(join(OUT_DIR, 'summary.json'), JSON.stringify({
  rows: rows.map((r) => ({ label: r.label, before: r.cells[0].cap, after: r.cells[1].cap })),
  consoleErrors: [...new Set(consoleErrors)].slice(0, 20),
}, null, 2));

console.log('\nboard →', join(OUT_DIR, 'board.png'));
if (consoleErrors.length) console.log('console errors:', [...new Set(consoleErrors)].slice(0, 8));
else console.log('no console errors');
