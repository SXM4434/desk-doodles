// INDEPENDENT adversarial driver — drives verify-slab-adversary.html headless,
// sweeps all 6 native presets + hatch/svg-port across an adversarial angle set
// (incl. 5° grazing oblique, below the fix author's 10° floor), pixel-measures
// the largest lit flat face + worst warm bucket per cell, writes full-size PNGs
// + contact boards + a per-material per-angle table. NO live-DB anything.
//
// Run: node tools/3d/verify-slab-adversary.mjs   (vite dev must be on BASE)
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('/tmp/dd-pp/node_modules/playwright');

const BASE = process.env.DD_BASE || 'http://localhost:5182';
const OUT = '/tmp/dd-verify-slab';
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const NATIVE = ['ink', 'softGel', 'matteClay', 'glossyPlastic', 'rubber', 'signal'];
const MARKS = ['hatch', 'svg-port'];

// Adversarial angles: a 5° grazing oblique (BELOW the fix author's 10° floor)
// where a flat front face most directly faces a low warm panel, plus a spread
// of elevations × azimuths (more azimuths than theirs — 0/30/55/75).
const ELEVS = [5, 12, 22, 40];
const AZS = [0, 30, 55, 75];

// Gates (mine — TIGHTER than 25): a flat face mirroring a warm band fails.
const FACE_DELTA_MAX = 18;   // largest lit flat face r−b
const WARM_BUCKET_MAX = 18;  // worst broad warm patch on the body r−b
const FACE_LUM_MAX = 150;    // lit face must still read dark (ink-black)
const SPREAD_MIN = 4;        // anti flat-black-blob (some form gradient)
const MIN_PX = 2000;         // anti-vacuous (the slab must actually render)

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1100, height: 900 }, deviceScaleFactor: 1 });
page.on('console', (m) => { if (m.type() === 'error') console.log('  [page error]', m.text()); });
page.on('pageerror', (e) => console.log('  [pageerror]', e.message));

const url = `${BASE}/tools/3d/verify-slab-adversary.html`;
console.log('loading', url);
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__vslabReady === true, { timeout: 30000 });
await page.waitForFunction(() => !!window.__vslab, { timeout: 30000 });

function dataUrlToBuf(dataUrl) {
  return Buffer.from(dataUrl.split(',')[1], 'base64');
}

const results = [];
let failCount = 0;

// ── Native sweep — all 6 × all angles ───────────────────────────────────────
for (const mat of NATIVE) {
  for (const elev of ELEVS) {
    for (const az of AZS) {
      const { dataUrl, stats } = await page.evaluate(
        ([m, e, a]) => window.__vslab.renderCell(m, e, a),
        [mat, elev, az],
      );
      const fails = [];
      if (stats.n < MIN_PX) fails.push(`vacuous n=${stats.n}`);
      if (stats.faceDelta > FACE_DELTA_MAX) fails.push(`faceΔ=${stats.faceDelta.toFixed(0)}`);
      if (stats.warmBucket.delta > WARM_BUCKET_MAX)
        fails.push(`warmΔ=${stats.warmBucket.delta}@${(stats.warmBucket.frac * 100).toFixed(0)}%`);
      if (stats.faceLum > FACE_LUM_MAX) fails.push(`faceLum=${stats.faceLum}`);
      if (stats.spread < SPREAD_MIN) fails.push(`flat spread=${stats.spread}`);
      const pass = fails.length === 0;
      if (!pass) failCount++;
      const fname = `${mat}-e${elev}-a${az}.png`;
      writeFileSync(join(OUT, fname), dataUrlToBuf(dataUrl));
      results.push({ mat, elev, az, stats, pass, fails, fname });
      const tag = pass ? 'PASS' : `FAIL[${fails.join(',')}]`;
      console.log(
        `${mat.padEnd(14)} e${String(elev).padStart(2)} a${String(az).padStart(2)} | ` +
        `face rgb(${stats.face.r},${stats.face.g},${stats.face.b}) Δ${stats.faceDelta.toFixed(0)} ` +
        `lum${stats.faceLum} | warm rgb(${stats.warmBucket.r},${stats.warmBucket.g},${stats.warmBucket.b}) ` +
        `Δ${stats.warmBucket.delta}@${(stats.warmBucket.frac * 100).toFixed(0)}% | ` +
        `body${stats.bodyLum} spread${stats.spread} | ${tag}`,
      );
    }
  }
}

// ── Marks (hatch/svg-port) — should be env-blind; render at one angle ────────
console.log('\n--- marks (env-blind check) ---');
for (const mat of MARKS) {
  const { dataUrl, stats } = await page.evaluate(
    ([m]) => window.__vslab.renderCell(m, 22, 30),
    [mat],
  );
  writeFileSync(join(OUT, `${mat}-e22-a30.png`), dataUrlToBuf(dataUrl));
  console.log(`${mat.padEnd(14)} n=${stats.n} bodyLum=${stats.bodyLum} faceΔ=${stats.faceDelta.toFixed(0)}`);
}

// ── DISTINCTNESS: all 6 native @ one angle, compare signatures ───────────────
console.log('\n--- distinctness @ e22 a30 ---');
const sigs = [];
for (const mat of NATIVE) {
  const { stats } = await page.evaluate(([m]) => window.__vslab.renderCell(m, 22, 30), [mat]);
  sigs.push({ mat, faceLum: stats.faceLum, spread: stats.spread, specFrac: +(stats.specFrac * 100).toFixed(1), p99: stats.p99, bodyLum: stats.bodyLum });
  console.log(`${mat.padEnd(14)} faceLum${stats.faceLum} spread${stats.spread} spec${(stats.specFrac*100).toFixed(0)}% p99=${stats.p99} body${stats.bodyLum}`);
}
// Distinctness: each preset's (faceLum,spread,specFrac,p99) signature must
// differ from every other by a meaningful margin (avoid two identical reads /
// black blobs).
let distinctPairs = 0;
let collisions = [];
for (let i = 0; i < sigs.length; i++) {
  for (let j = i + 1; j < sigs.length; j++) {
    const a = sigs[i], b = sigs[j];
    const d = Math.abs(a.faceLum - b.faceLum) + Math.abs(a.spread - b.spread) +
      Math.abs(a.specFrac - b.specFrac) + Math.abs(a.p99 - b.p99) * 0.3;
    if (d >= 6) distinctPairs++;
    else collisions.push(`${a.mat}~${b.mat}(d=${d.toFixed(1)})`);
  }
}
const totalPairs = (sigs.length * (sigs.length - 1)) / 2;
// Black-blob check: a preset rendered as a flat black blob = faceLum<12 AND spread<3.
const blackBlobs = sigs.filter((s) => s.faceLum < 12 && s.spread < 3).map((s) => s.mat);

// ── Contact board (full sweep) ───────────────────────────────────────────────
function buildBoard(filePathPrefix) {
  const cell = (r) => {
    const cls = r.pass ? '' : ' fail';
    return `<figure class="${cls.trim()}"><img src="${r.fname}"><figcaption>${r.mat} e${r.elev} a${r.az}<small>face Δ${r.stats.faceDelta.toFixed(0)} lum${r.stats.faceLum} · warm Δ${r.stats.warmBucket.delta}@${(r.stats.warmBucket.frac*100).toFixed(0)}%${r.pass?'':' · '+r.fails.join(',')}</small></figcaption></figure>`;
  };
  const byMat = {};
  for (const r of results) (byMat[r.mat] ||= []).push(r);
  const sections = NATIVE.map((m) =>
    `<section><h2>${m}</h2><div class="grid">${byMat[m].map(cell).join('')}</div></section>`,
  ).join('');
  const html = `<!doctype html><html><head><meta charset=utf8><style>
    body{font:11px monospace;background:#fdfcf9;color:#3b362e;padding:14px}
    h2{text-transform:uppercase;letter-spacing:.06em;border-bottom:2px solid #3b362e;padding-bottom:3px}
    .grid{display:flex;flex-wrap:wrap;gap:6px}
    figure{margin:0;width:150px}figure img{width:150px;height:150px;display:block;border:1px solid #d8d2c6}
    figure.fail img{border:3px solid #b03434}
    figcaption{font-size:9px;font-weight:700}figcaption small{display:block;font-weight:400;color:#6f6a60}
    figure.fail figcaption small{color:#b03434}
  </style></head><body><h1 style="font-size:14px">Independent verifier — TRUE RECTANGULAR SLAB × 6 presets × adversarial angles</h1>${sections}</body></html>`;
  writeFileSync(`${filePathPrefix}.html`, html);
}
buildBoard(join(OUT, 'board'));

// ── Compact strip: one cell per preset @ the grazing 5° oblique (worst case) ──
const stripCells = NATIVE.map((m) => {
  const r = results.find((x) => x.mat === m && x.elev === 5 && x.az === 30);
  return r;
});

writeFileSync(join(OUT, 'summary.json'), JSON.stringify({
  results: results.map((r) => ({ mat: r.mat, elev: r.elev, az: r.az, ...r.stats, pass: r.pass, fails: r.fails })),
  sigs, distinctPairs, totalPairs, collisions, blackBlobs, failCount,
}, null, 2));

console.log('\n========================================');
console.log(`NATIVE GATES: ${results.length - failCount}/${results.length} PASS (${failCount} FAIL)`);
console.log(`DISTINCTNESS: ${distinctPairs}/${totalPairs} pairs distinct` + (collisions.length ? ` — collisions: ${collisions.join(', ')}` : ''));
console.log(`BLACK BLOBS: ${blackBlobs.length === 0 ? 'none' : blackBlobs.join(', ')}`);
console.log('grazing-5° strip:', stripCells.map((r) => `${r.mat}:faceΔ${r.stats.faceDelta.toFixed(0)}/lum${r.stats.faceLum}/warmΔ${r.stats.warmBucket.delta}`).join('  '));
console.log('boards + PNGs in', OUT);

await browser.close();
process.exit(failCount > 0 ? 1 : 0);
