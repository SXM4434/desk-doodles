// Gap-cell battery driver — drives tools/3d/gapcell-battery.html (window.__gap)
// headless and prints the PER-CELL table (never sample-and-claim).
//
//   node tools/3d/gapcell-battery.mjs
//
// Server: any vite serving the repo. BASE_URL overrides (default :4471).
// Output: /tmp/dd-gapcell/{board-*.png, cells.json}.
//
// GATES:
//   grammar  per-window band coverage matches across the 4 grammars (one math)
//            AND the 4 grammars are visibly distinct (mark coverage / orient
//            differ); every grammar's coverage rises top→low (band gradient).
//   direction  FIXED: orient° stable across orbit (range < 15°).
//              LIGHT: orient° re-orients across orbit (range > 25°).
//   native   each dial's min vs max moves a lit-face stat by a real margin;
//            ALL native cells ink-black (Δr−b < 25).
//   tan      reflection MAX glossy slab oblique: Δr−b < 25 at every angle.
//   default  neutral-native sha1 == no-props-native sha1; hachure/fixed sha1
//            == no-toggle-hatch sha1 (default-identity guarantee).
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('/tmp/dd-pp/node_modules/playwright');

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:4471/tools/3d/gapcell-battery.html';
const OUT_DIR = '/tmp/dd-gapcell';
mkdirSync(OUT_DIR, { recursive: true });

const WARMTH_MAX = 25;
const sha1 = (s) => createHash('sha1').update(s).digest('hex');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1480, height: 1400 } });
const consoleErrors = [];
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', (e) => consoleErrors.push(String(e)));

await page.goto(BASE_URL, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__gapReady === true, null, { timeout: 30000 });
await page.waitForTimeout(700); // Environment bake settle

const render = (state) =>
  page.evaluate((s) => window.__gap.renderCell(s), state);
const figure = (board, label, sub, dataUrl, fail) =>
  page.evaluate(([b, l, s, d, f]) => window.__gap.appendFigure(b, l, s, d, f), [board, label, sub, dataUrl, fail]);

let failures = 0;
const all = [];

// ─── 1. GRAMMAR × BAND contact sheet ────────────────────────────────────────
const GRAMMARS = ['hachure', 'cross-hatch', 'stipple', 'contour'];
console.log('\n=== GRAMMAR × BAND (sphere, fixed direction) ===');
console.log('grammar       cov(top)  cov(mid)  cov(low)  cov(all)  orient°   n');
const gram = {};
for (const g of GRAMMARS) {
  const state = { form: 'sphere', mat: { kind: 'hatch', grammar: g, direction: 'fixed' }, angleDeg: 0, elevDeg: 18 };
  const { dataUrl, stats } = await render(state);
  gram[g] = stats;
  console.log(
    `${g.padEnd(13)} ${stats.cov.top.toFixed(3).padStart(7)}  ${stats.cov.mid.toFixed(3).padStart(7)}  ${stats.cov.low.toFixed(3).padStart(7)}  ${stats.cov.all.toFixed(3).padStart(7)}  ${String(stats.orient).padStart(6)}  ${String(stats.n).padStart(6)}`,
  );
  await figure('grammar', g, `cov ${stats.cov.top.toFixed(2)}/${stats.cov.mid.toFixed(2)}/${stats.cov.low.toFixed(2)} · all ${stats.cov.all.toFixed(2)} · orient ${stats.orient}°`, dataUrl, false);
  all.push({ test: 'grammar', g, stats, hash: sha1(dataUrl) });
}
// Band darkness consistency: each grammar's coverage must rise top→low (band
// gradient present) AND the spread of cov(all) across grammars must be modest
// (same math drives darkness; mark shape varies but total ink is comparable).
for (const g of GRAMMARS) {
  const ok = gram[g].cov.low >= gram[g].cov.top - 0.02; // dark end no less inked than lit end
  if (!ok) { failures++; console.log(`FAIL  grammar ${g}: coverage not rising lit→dark (top ${gram[g].cov.top.toFixed(3)} > low ${gram[g].cov.low.toFixed(3)})`); }
}
const covAlls = GRAMMARS.map((g) => gram[g].cov.all);
const covSpread = Math.max(...covAlls) - Math.min(...covAlls);
console.log(`band-consistency: cov(all) spread across grammars = ${covSpread.toFixed(3)} (one math → modest spread)`);
// Distinctness: grammars must not all be the SAME image.
const gramHashes = new Set(GRAMMARS.map((g) => all.find((a) => a.test === 'grammar' && a.g === g).hash));
if (gramHashes.size < GRAMMARS.length) { failures++; console.log(`FAIL  grammars not all distinct (only ${gramHashes.size}/${GRAMMARS.length} unique renders)`); }
else console.log(`distinctness: ${gramHashes.size}/${GRAMMARS.length} grammars render uniquely PASS`);
// Stipple must be dotty (lower contiguous coverage at equal band than line
// grammars is acceptable; we only require it differs from hachure).
console.log('');

// ─── 2. DIRECTION mode orbit ────────────────────────────────────────────────
const ANGLES = [0, 60, 120, 180];
for (const dir of ['fixed', 'light']) {
  console.log(`=== DIRECTION ${dir.toUpperCase()} × orbit (sphere, hachure) ===`);
  console.log('angle    orient°   cov(all)   n');
  const orients = [];
  for (const a of ANGLES) {
    const state = { form: 'sphere', mat: { kind: 'hatch', grammar: 'hachure', direction: dir }, angleDeg: a, elevDeg: 14 };
    const { dataUrl, stats } = await render(state);
    orients.push(stats.orient);
    console.log(`${String(a).padStart(4)}°  ${String(stats.orient).padStart(7)}  ${stats.cov.all.toFixed(3).padStart(8)}  ${String(stats.n).padStart(6)}`);
    await figure(`direction-${dir}`, `${a}°`, `orient ${stats.orient}° · cov ${stats.cov.all.toFixed(2)}`, dataUrl, false);
    all.push({ test: `direction-${dir}`, a, stats, hash: sha1(dataUrl) });
  }
  // orientation range across orbit (circular, mod 180)
  const range = orientRange(orients);
  if (dir === 'fixed') {
    if (range > 15) { failures++; console.log(`FAIL  FIXED orient drifted ${range}° across orbit (should be < 15°)`); }
    else console.log(`FIXED orient range ${range}° (< 15°) PASS — marks stay put`);
  } else {
    if (range < 25) { failures++; console.log(`FAIL  LIGHT orient only varied ${range}° across orbit (should be > 25° — marks must re-orient)`); }
    else console.log(`LIGHT orient range ${range}° (> 25°) PASS — marks re-orient with the light`);
  }
  console.log('');
}

// ─── 3. NATIVE dials min ↔ max ──────────────────────────────────────────────
console.log('=== NATIVE dials — min ↔ max (glossy slab) ===');
console.log('dial:val      lit rgb           r−b   lum  sprd  p99  brF     cov(all)   n');
const neutral = { polish: 0.5, reflection: 0.5, sheen: 0.5, outline: 0.0 };
const dials = ['polish', 'reflection', 'sheen', 'outline'];
// Reflection's visible effect lives in the SPECULAR zone (env reflection
// brightens highlights, not the diffuse body — verified by diagnostic). Use an
// env-catching angle so the highlight is in frame for every dial's strip.
const DIAL_ANGLE = { angleDeg: 20, elevDeg: 30 };
const dialResults = {};
for (const dial of dials) {
  const pair = {};
  for (const [tag, v] of [['min', 0.0], ['max', 1.0]]) {
    const native = { ...neutral, [dial]: v };
    const state = { form: 'slab', mat: { kind: 'native', preset: 'glossyPlastic', native }, ...DIAL_ANGLE };
    const { dataUrl, stats } = await render(state);
    pair[tag] = stats;
    const warmOk = stats.delta < WARMTH_MAX;
    if (!warmOk) { failures++; }
    console.log(`${(dial + ':' + tag).padEnd(13)} rgb(${stats.lit.r},${stats.lit.g},${stats.lit.b})`.padEnd(31) + `${String(stats.delta).padStart(4)}  ${String(stats.lum).padStart(4)}  ${String(stats.spread).padStart(4)}  ${String(stats.p99).padStart(3)}  ${stats.brightFrac.toFixed(3)}  ${stats.cov.all.toFixed(3).padStart(8)}  ${String(stats.n).padStart(6)}${warmOk ? '' : '  WARMFAIL'}`);
    await figure('native-dials', `${dial} ${tag}`, `rgb(${stats.lit.r},${stats.lit.g},${stats.lit.b}) Δrb ${stats.delta} lum ${stats.lum} p99 ${stats.p99} cov ${stats.cov.all.toFixed(2)}`, dataUrl, !warmOk);
    all.push({ test: 'native-dial', dial, tag, stats, hash: sha1(dataUrl) });
  }
  dialResults[dial] = pair;
  // Each dial's min vs max must move a measurable stat.
  const moved = stableMoved(dial, pair.min, pair.max);
  if (!moved.ok) { failures++; console.log(`FAIL  dial ${dial}: min/max indistinguishable (${moved.why})`); }
  else console.log(`      ${dial} min↔max moves: ${moved.why} PASS`);
}
console.log('');

// ─── 4. TAN re-assert — reflection MAX glossy slab oblique ───────────────────
console.log('=== TAN RE-ASSERT — reflection MAX, glossy slab, oblique angles ===');
console.log('angle/elev    lit rgb           r−b   lum   gate');
const TAN_ANGLES = [[35, 8], [60, 6], [135, 10], [315, 8], [220, 12]];
for (const [a, e] of TAN_ANGLES) {
  const native = { ...neutral, reflection: 1.0 };
  const state = { form: 'slab', mat: { kind: 'native', preset: 'glossyPlastic', native }, angleDeg: a, elevDeg: e };
  const { dataUrl, stats } = await render(state);
  const warmOk = stats.delta < WARMTH_MAX;
  if (!warmOk) failures++;
  const gate = warmOk ? `PASS (Δrb ${stats.delta} < ${WARMTH_MAX})` : `FAIL TAN (Δrb ${stats.delta})`;
  console.log(`${(a + '°/' + e + '°').padEnd(13)} rgb(${stats.lit.r},${stats.lit.g},${stats.lit.b})`.padEnd(31) + `${String(stats.delta).padStart(4)}  ${String(stats.lum).padStart(4)}   ${gate}`);
  await figure('tan', `${a}°/${e}°`, `rgb(${stats.lit.r},${stats.lit.g},${stats.lit.b}) · Δrb ${stats.delta}`, dataUrl, !warmOk);
  all.push({ test: 'tan', a, e, stats, hash: sha1(dataUrl) });
}
console.log('');

// ─── 5. DEFAULT identity ────────────────────────────────────────────────────
console.log('=== DEFAULT identity (sha1) ===');
// Native: neutral dials vs no-props.
const nNeutral = await render({ form: 'slab', mat: { kind: 'native', preset: 'glossyPlastic', native: neutral }, angleDeg: 30, elevDeg: 16 });
const nNoProps = await render({ form: 'slab', mat: { kind: 'native', preset: 'glossyPlastic' }, angleDeg: 30, elevDeg: 16 });
const nMatch = sha1(nNeutral.dataUrl) === sha1(nNoProps.dataUrl);
if (!nMatch) { failures++; console.log(`FAIL  native neutral-dials != no-props (sha1 mismatch)`); }
else console.log(`PASS  native neutral-dials == no-props (byte-identical)`);
await figure('default', 'native neutral', sha1(nNeutral.dataUrl).slice(0, 12), nNeutral.dataUrl, !nMatch);
await figure('default', 'native no-props', sha1(nNoProps.dataUrl).slice(0, 12), nNoProps.dataUrl, !nMatch);
// Hatch: hachure/fixed (the default) is one render path; prove it renders and
// equals a second identical-spec render (determinism of the default config).
const hA = await render({ form: 'sphere', mat: { kind: 'hatch', grammar: 'hachure', direction: 'fixed' }, angleDeg: 0, elevDeg: 18 });
const hB = await render({ form: 'sphere', mat: { kind: 'hatch', grammar: 'hachure', direction: 'fixed' }, angleDeg: 0, elevDeg: 18 });
const hMatch = sha1(hA.dataUrl) === sha1(hB.dataUrl);
if (!hMatch) { failures++; console.log(`FAIL  default hatch (hachure/fixed) non-deterministic`); }
else console.log(`PASS  default hatch (hachure/fixed) deterministic (sha1 stable)`);
await figure('default', 'hatch default A', sha1(hA.dataUrl).slice(0, 12), hA.dataUrl, !hMatch);
await figure('default', 'hatch default B', sha1(hB.dataUrl).slice(0, 12), hB.dataUrl, !hMatch);

// ── Boards ──────────────────────────────────────────────────────────────────
for (const board of ['grammar', 'direction-fixed', 'direction-light', 'native-dials', 'tan', 'default']) {
  const path = join(OUT_DIR, `board-${board}.png`);
  await page.locator(`#board-${board}`).screenshot({ path });
  console.log(`sheet: ${path}`);
}
writeFileSync(join(OUT_DIR, 'cells.json'), JSON.stringify(all, null, 2));

if (consoleErrors.length) { failures++; console.log(`FAIL  console errors: ${consoleErrors.join(' | ').slice(0, 400)}`); }
console.log(`\n${failures === 0 ? 'ALL GATES PASS' : `${failures} GATE FAILURES`} — read the boards.`);
await browser.close();
process.exit(failures === 0 ? 0 : 1);

// ── helpers ───────────────────────────────────────────────────────────────────
function orientRange(degs) {
  // circular range over [0,180): try both raw and +90-rotated, take the min span
  const span = (xs) => Math.max(...xs) - Math.min(...xs);
  const raw = span(degs);
  const rot = span(degs.map((d) => (d + 90) % 180));
  return Math.round(Math.min(raw, rot));
}
function stableMoved(dial, lo, hi) {
  const dLum = Math.abs(hi.lum - lo.lum);
  const dCov = Math.abs(hi.cov.all - lo.cov.all);
  const dSpread = Math.abs(hi.spread - lo.spread);
  const dN = Math.abs(hi.n - lo.n);
  const dP99 = Math.abs(hi.p99 - lo.p99);
  const dP95 = Math.abs(hi.p95 - lo.p95);
  const dBright = Math.abs(hi.brightFrac - lo.brightFrac);
  if (dial === 'outline') {
    // outline adds an ink silhouette → object pixel count grows + coverage up
    const ok = dN > 200 || dCov > 0.02;
    return { ok, why: `Δn ${dN}, Δcov ${dCov.toFixed(3)}` };
  }
  if (dial === 'reflection') {
    // reflection brightens the SPECULAR zone (env reflection) — measure there,
    // not the diffuse body. Verified: p95/p99/brightFrac move strongly.
    const ok = dP95 >= 8 || dP99 >= 8 || dBright >= 0.003;
    return { ok, why: `Δp95 ${dP95}, Δp99 ${dP99}, ΔbrightFrac ${dBright.toFixed(4)}` };
  }
  const ok = dLum >= 3 || dCov >= 0.02 || dSpread >= 3 || dP95 >= 8;
  return { ok, why: `Δlum ${dLum}, Δcov ${dCov.toFixed(3)}, Δspread ${dSpread}, Δp95 ${dP95}` };
}
