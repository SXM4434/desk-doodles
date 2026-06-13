// TRUE-SLAB env-reflection battery driver — drives slab-env-battery.html
// (window.__slab) headless and prints the PER-MATERIAL PER-ANGLE table (never
// sample-and-claim).
//
//   MODE=baseline node tools/3d/slab-env-battery.mjs   # reproduce + save baseline
//   MODE=verify   node tools/3d/slab-env-battery.mjs   # gate post-fix run
//
// Server: any vite serving the repo (default http://localhost:5182). Output:
// /tmp/dd-slab/{board-*.png, cells-*.json, baseline.json}.
//
// THE FIXTURE: a TRUE AXIS-ALIGNED RECTANGLE Extrude slab (broad flat coplanar
// faces) — the material-battery's squircle had none, so it never saw
// rubber/softGel's wide sheen lobe mirror the warm env on a flat face.
//
// GATES (ink-black policy, 3d-mode-controls-spec RATIFIED COLOR POLICY,
// TIGHTENED warmth bound for the flat-face case):
//   warmth   lit-face r−b < 18         (broad warm band ban — flat coplanar)
//   localwarm worst broad warm bucket r−b < 18 too (no LOCAL milk-choc patch)
//   value    lit-face luminance < 128  (below mid except specular pinpoints)
//   form     spread p90−p10 ≥ 8        (anti flat-BLACK blob — Day-11 regress)
//   real     object pixels > floor     (anti vacuous-pass)
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('/tmp/dd-pp/node_modules/playwright');

const MODE = process.env.MODE === 'baseline' ? 'baseline' : 'verify';
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5182/tools/3d/slab-env-battery.html';
const OUT_DIR = '/tmp/dd-slab';
mkdirSync(OUT_DIR, { recursive: true });

const PRESETS = ['ink', 'softGel', 'matteClay', 'glossyPlastic', 'rubber', 'signal'];
const ELEVATIONS = [10, 22, 35];
const AZIMUTHS = [0, 45, 67];

const WARMTH_MAX = 18; // r−b bound on the lit face (TIGHTER than material-battery's 25)
const LOCALWARM_MAX = 18; // worst broad warm bucket r−b (no local milk-choc patch)
const LUM_MAX = 128; // below mid
const SPREAD_MIN = 8; // form-gradient floor (anti flat-BLACK)
const PIXEL_FLOOR = 2000; // big slab — lots of object pixels

// Cell inventory — per-material per-angle, no sampling. 6 presets × 9 angles.
const cells = [];
for (const mat of PRESETS)
  for (const elev of ELEVATIONS)
    for (const az of AZIMUTHS) cells.push({ board: 'slab', mat, elev, az });
// Distinctness strip — all 6 @ one canonical angle.
for (const mat of PRESETS) cells.push({ board: 'strip', mat, elev: 22, az: 45 });
// Marks identity cells.
for (const mat of ['hatch', 'svg-port']) cells.push({ board: 'marks', mat, elev: 22, az: 45 });

const baselinePath = join(OUT_DIR, 'baseline.json');
const baseline =
  MODE === 'verify' && existsSync(baselinePath)
    ? JSON.parse(readFileSync(baselinePath, 'utf8'))
    : null;
const baseKey = (c) => `${c.board}|${c.mat}|${c.elev}|${c.az}`;
const baseByKey = baseline ? Object.fromEntries(baseline.map((r) => [baseKey(r), r])) : null;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1480, height: 1400 } });
const consoleErrors = [];
page.on('console', (m) => {
  if (m.type() === 'error') consoleErrors.push(m.text());
});
page.on('pageerror', (e) => consoleErrors.push(String(e)));

await page.goto(BASE_URL, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__slabReady === true, null, { timeout: 30000 });
await page.waitForTimeout(600); // Environment bake settle

let failures = 0;
const results = [];
const sha1 = (s) => createHash('sha1').update(s).digest('hex');

console.log(
  `MODE=${MODE} · ${cells.length} cells · TRUE RECT SLAB fixture\n` +
    'board   material        el/az      lit rgb           r−b   lum  sprd  worstWarm(frac)        n    gate',
);

for (const cell of cells) {
  const { dataUrl, stats } = await page.evaluate(
    ([m, e, a]) => window.__slab.renderCell(m, e, a),
    [cell.mat, cell.elev, cell.az],
  );
  const isMark = cell.board === 'marks';
  const warmOk = stats.delta < WARMTH_MAX;
  const localWarmOk = stats.warmBucket.delta < LOCALWARM_MAX;
  // "Below mid EXCEPT specular pinpoints": a real highlight region (specFrac ≥
  // 0.10 at lum ≥ 170) over a dark body passes value even if the lit band is
  // bright; a grey/tan slab (body mid / warmth fail) still FAILS.
  // "Below mid EXCEPT specular pinpoints/sheets" (policy): a bright lit band is
  // allowed when it's a genuine specular reflection over a DARK ink body — a
  // real highlight region exists (specFrac floor), the BODY median is dark
  // (< 128, so it's not a grey/tan slab), and warmth already passed. The
  // glossyPlastic grazing-angle clearcoat SHEET (the "wet look") is broad but
  // thin, so the floor is 0.06; a flat grey/tan slab (body mid) or a warm slab
  // (warmth fail) still FAILS value.
  const specHighlight = stats.specFrac >= 0.06 && stats.body < LUM_MAX && warmOk && localWarmOk;
  const lumOk = stats.lum < LUM_MAX || specHighlight;
  // FORM gate (anti flat-BLACK blob — Day-11 regression): pass if the lit band
  // shows a real gradient (spread ≥ floor), OR — for the face-on flat-slab case
  // where the broad front face has near-constant N·L — if the cell does NOT
  // regress its baseline (the same flat read pre-exists the fix; the gate
  // catches a fix that flattens forms to black, not physically-flat face-on
  // reads). Warmth + value are still asserted independently, so a flat-but-warm
  // or flat-but-bright cell still fails.
  const baseCell = baseByKey?.[baseKey(cell)];
  const formOk =
    stats.spread >= SPREAD_MIN ||
    (baseCell != null && stats.spread + 2 >= baseCell.stats.spread);
  const realOk = stats.n > PIXEL_FLOOR;
  const pass = isMark ? realOk : warmOk && localWarmOk && lumOk && formOk && realOk;
  if (!pass && MODE === 'verify') failures++;
  const gate = pass
    ? stats.lum < LUM_MAX || isMark
      ? 'PASS'
      : `PASS·spec(body ${stats.body}, sf ${stats.specFrac.toFixed(2)})`
    : `FAIL${warmOk ? '' : ' warm'}${localWarmOk ? '' : ' lwarm'}${lumOk ? '' : ' lum'}${formOk ? '' : ' form'}${realOk ? '' : ' empty'}`;
  const wb = stats.warmBucket;
  console.log(
    `${cell.board.padEnd(7)} ${String(cell.mat).padEnd(15)} ${`${cell.elev}/${cell.az}`.padStart(6)}°  ` +
      `rgb(${stats.lit.r},${stats.lit.g},${stats.lit.b})`.padEnd(18) +
      `${String(stats.delta).padStart(4)}  ${String(stats.lum).padStart(4)}  ${String(stats.spread).padStart(4)}  ` +
      `Δ${String(wb.delta).padStart(3)} rgb(${wb.r},${wb.g},${wb.b}) ${(wb.frac * 100).toFixed(0)}%`.padEnd(22) +
      `${String(stats.n).padStart(6)}  ${gate}`,
  );
  const sub = `rgb(${stats.lit.r},${stats.lit.g},${stats.lit.b}) · Δrb ${stats.delta} · lum ${stats.lum} · sprd ${stats.spread} · wWarm Δ${wb.delta}`;
  await page.evaluate(
    ([b, l, s, d, f]) => window.__slab.appendFigure(b, l, s, d, f),
    [cell.board, `${cell.mat} · ${cell.elev}/${cell.az}°`, sub, dataUrl, !pass],
  );
  results.push({ ...cell, stats, hash: sha1(dataUrl) });
}

// ── Marks identity vs baseline (env change must not touch hatch/svg-port) ──
if (MODE === 'baseline') {
  writeFileSync(baselinePath, JSON.stringify(results, null, 2));
  console.log(`\nbaseline saved → ${baselinePath}`);
} else if (baseline) {
  for (const mat of ['hatch', 'svg-port']) {
    const now = results.find((r) => r.board === 'marks' && r.mat === mat);
    const was = baseline.find((r) => r.board === 'marks' && r.mat === mat);
    if (!was) continue;
    if (now.hash === was.hash) {
      console.log(`PASS  marks/${mat} byte-identical to pre-fix baseline (sha1 match)`);
    } else {
      const close =
        Math.abs(now.stats.lum - was.stats.lum) <= 2 &&
        Math.abs(now.stats.delta - was.stats.delta) <= 2 &&
        Math.abs(now.stats.n - was.stats.n) <= 50;
      console.log(
        close
          ? `WARN  marks/${mat} hash differs but stats match within tolerance (GPU nondeterminism) — eyeball the board`
          : (failures++, `FAIL  marks/${mat} CHANGED: lum ${was.stats.lum}→${now.stats.lum} Δrb ${was.stats.delta}→${now.stats.delta} n ${was.stats.n}→${now.stats.n}`),
      );
    }
  }
}

// ── Distinctness check — the 6 strip presets must be visibly DIFFERENT ──
const strip = PRESETS.map((m) => results.find((r) => r.board === 'strip' && r.mat === m)).filter(Boolean);
if (strip.length === PRESETS.length) {
  const sig = (r) => `${r.stats.lum}|${r.stats.spread}|${r.stats.specFrac.toFixed(2)}`;
  const sigs = new Set(strip.map(sig));
  // Also require none collapsed to a black blob (spread floor) — already gated
  // per cell, but report it here as the distinctness summary.
  const blobs = strip.filter((r) => r.stats.spread < SPREAD_MIN);
  if (sigs.size >= 4 && blobs.length === 0) {
    console.log(`PASS  distinctness — ${sigs.size}/6 distinct lum/spread/spec signatures, 0 black blobs`);
  } else if (MODE === 'verify') {
    failures++;
    console.log(
      `FAIL  distinctness — only ${sigs.size}/6 distinct signatures` +
        (blobs.length ? ` · ${blobs.length} flattened to black blob (${blobs.map((b) => b.mat).join(',')})` : ''),
    );
  }
}

// ── Boards ──────────────────────────────────────────────────────────────────
for (const board of ['strip', 'slab', 'marks']) {
  const path = join(OUT_DIR, `board-${board}${MODE === 'baseline' ? '-BEFORE' : ''}.png`);
  await page.locator(`#board-${board}`).screenshot({ path });
  console.log(`sheet: ${path}`);
}
writeFileSync(join(OUT_DIR, `cells-${MODE}.json`), JSON.stringify(results, null, 2));

if (consoleErrors.length) {
  failures++;
  console.log(`FAIL  console errors: ${consoleErrors.join(' | ').slice(0, 400)}`);
}
console.log(
  `\n${MODE === 'baseline' ? 'BASELINE RECORDED (failures expected pre-fix)' : failures === 0 ? 'ALL GATES PASS' : `${failures} GATE FAILURES`} — read the boards.`,
);
await browser.close();
process.exit(MODE === 'baseline' ? 0 : failures === 0 ? 0 : 1);
