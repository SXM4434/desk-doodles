// _shapelib-contact.mjs — VISUAL verification of shapeLibrary.ts.
// Bundles the pure shapeLibrary, renders each shape through perfect-freehand's
// getStroke (the real draw primitive) into an SVG fill path, composites a
// labelled grid PNG, then I (the agent) READ the PNG and confirm every shape
// reads correctly. House law: never claim without a screenshot I read.
//
// Run:  node tools/2d/_shapelib-contact.mjs
// Out:  /tmp/dd-shapelib/contact.png

import { execFileSync } from 'node:child_process';
import { mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, '..', '..'); // worktree root
const OUT_DIR = '/tmp/dd-shapelib';
const BUNDLE = '/tmp/shapelib.mjs';

mkdirSync(OUT_DIR, { recursive: true });

// ── 1. Bundle the pure library via esbuild ───────────────────────────────────
const esbuild = resolve(REPO, 'node_modules/.bin/esbuild');
const srcTs = resolve(REPO, 'src/app/lib/draw/shapeLibrary.ts');
console.log('[bundle] esbuild', srcTs);
execFileSync(
  esbuild,
  [srcTs, '--bundle', '--format=esm', `--outfile=${BUNDLE}`],
  { stdio: 'inherit' },
);

// ── 2. Import the bundle + perfect-freehand ──────────────────────────────────
const { generateShape, SHAPE_LIBRARY } = await import(BUNDLE + `?t=${Date.now()}`);
const pf = await import(
  resolve(REPO, 'node_modules/perfect-freehand/dist/esm/index.mjs')
);
const getStroke = pf.getStroke;

const PF_OPTS = {
  size: 4,
  thinning: 0.5,
  smoothing: 0.5,
  streamline: 0.5,
  simulatePressure: true,
};

// ── 3. For each shape: generate (220×220 bbox), stroke → SVG fill path ────────
const BBOX = { x: 0, y: 0, w: 220, h: 220 };
const PAD = 20; // padding inside each cell so strokes don't clip

/** Convert a perfect-freehand outline (array of [x,y]) to an SVG path d-string. */
function strokeToPath(outline) {
  if (!outline || outline.length < 2) return '';
  const d = outline.reduce(
    (acc, [x, y], i) =>
      acc + (i === 0 ? `M ${x.toFixed(2)} ${y.toFixed(2)}` : ` L ${x.toFixed(2)} ${y.toFixed(2)}`),
    '',
  );
  return d + ' Z';
}

/** Raw skeleton polyline (the generator's outline itself) → SVG path for a
 *  thin stroke, so geometry bugs are separable from pen-taper artifacts. */
function skeletonPath(pts) {
  if (!pts || pts.length < 2) return '';
  const d = pts.reduce(
    (acc, [x, y], i) =>
      acc + (i === 0 ? `M ${x.toFixed(2)} ${y.toFixed(2)}` : ` L ${x.toFixed(2)} ${y.toFixed(2)}`),
    '',
  );
  return d + ' Z';
}

const cells = [];
for (const entry of SHAPE_LIBRARY) {
  const pts = generateShape(entry.kind, BBOX);
  if (!pts) {
    cells.push({ ...entry, ok: false, path: '', skel: '', n: 0, note: 'generateShape returned null' });
    continue;
  }
  // Shift into padded area; perfect-freehand wants [x,y] (or [x,y,pressure]).
  const input = pts.map(([x, y]) => [x + PAD, y + PAD]);
  // Close the loop for the stroke so it renders as a continuous outline,
  // mirroring applyCandidate's weld for closed candidates.
  const closed = [...input, input[0]];
  const outline = getStroke(closed, PF_OPTS);
  const path = strokeToPath(outline);
  cells.push({
    kind: entry.kind,
    label: entry.label,
    curved: entry.curved,
    ok: !!path,
    path,
    skel: skeletonPath(input),
    n: pts.length,
  });
}

// ── 4. Composite a labelled grid via playwright ──────────────────────────────
function findPlaywright() {
  const candidates = [
    '/tmp/dd-pp/node_modules/playwright',
    '/Users/sebs/Desktop/Projects/portfolio/tools/lab-screenshots/node_modules/playwright',
  ];
  for (const c of candidates) if (existsSync(c)) return c;
  throw new Error('playwright not found in known locations');
}
const pwPath = findPlaywright();
const { chromium } = require(pwPath);

const CELL = 260; // 220 shape + 2*20 pad
const COLS = 4;
const ROWS = Math.ceil(cells.length / COLS);
const LABEL_H = 34;
const GAP = 14;
const cellH = CELL + LABEL_H;

const cellSvgs = cells
  .map((c, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const x = GAP + col * (CELL + GAP);
    const y = GAP + row * (cellH + GAP);
    const tag = c.curved ? 'curve' : 'corners';
    return `
      <div class="cell" style="left:${x}px; top:${y}px; width:${CELL}px;">
        <svg width="${CELL}" height="${CELL}" viewBox="0 0 ${CELL} ${CELL}">
          <rect x="0.5" y="0.5" width="${CELL - 1}" height="${CELL - 1}" fill="#fbfbf7" stroke="#ddd"/>
          <path d="${c.skel}" fill="#e9444433" stroke="#d22" stroke-width="0.75"/>
          <path d="${c.path}" fill="#1a1a1a" fill-rule="nonzero"/>
        </svg>
        <div class="label">${c.label} <span class="meta">· ${c.kind} · ${c.n}pts · ${tag}</span></div>
      </div>`;
  })
  .join('\n');

const W = GAP + COLS * (CELL + GAP);
const H = GAP + ROWS * (cellH + GAP) + 40;

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  body { margin:0; background:#fff; font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; }
  .sheet { position:relative; width:${W}px; height:${H}px; }
  .title { position:absolute; left:${GAP}px; top:${H - 30}px; font-size:13px; color:#888; }
  .cell { position:absolute; }
  .label { text-align:center; font-size:14px; font-weight:600; color:#222; padding-top:6px; }
  .meta { font-weight:400; color:#999; font-size:11px; }
</style></head><body>
  <div class="sheet">
    ${cellSvgs}
    <div class="title">shapeLibrary.ts contact sheet — getStroke {size:4,thinning:.5,smoothing:.5,streamline:.5,simulatePressure:true} — 220×220 bbox — ${cells.length} shapes</div>
  </div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
await page.setContent(html, { waitUntil: 'networkidle' });
await page.waitForTimeout(300);
const outPng = resolve(OUT_DIR, 'contact.png');
await page.screenshot({ path: outPng, fullPage: true });
await browser.close();

console.log('\n[done] contact sheet →', outPng);
console.log('[shapes]');
for (const c of cells) {
  console.log(`  ${c.ok ? 'OK ' : 'XX '} ${c.kind.padEnd(16)} ${String(c.n).padStart(3)}pts  ${c.curved ? 'curve' : 'corners'}`);
}
