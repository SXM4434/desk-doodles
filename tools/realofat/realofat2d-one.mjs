// Single-object real-surface 2D OFAT validation: upload an object's SVG into the
// REAL /desk DrawPanel, switch to Rough, then OFAT each modifier at L/M/H against
// the Rough baseline, screenshotting the live preview. Reports per-factor pixel
// change — proving the modifiers MOVE the render (the /canvas "16 inert" was wrong).
import { launch, openDesk, openUpload, setStyle, expandAll, setSlider, shotPreview, sleep } from './realofat2d-lib.mjs';
import { mkdirSync } from 'node:fs';
import sharp from 'sharp';

const OBJ = process.argv[2] || 'pokeball';
const SVG = `/tmp/bigdaddy/${OBJ}/svg-upload/_source.svg`;
const OUT = `/tmp/realofat2d/${OBJ}`;
mkdirSync(OUT, { recursive: true });

// modifier → {re: slider-label regex, def: default(for revert), L,M,H}
const FACTORS = [
  { id: 'wobble', re: 'wobble', def: 0.4, L: 0, M: 1.5, H: 3 },
  { id: 'jaggedness', re: 'jagged', def: 0, L: 0, M: 1.5, H: 3 },
  { id: 'strokeWidth', re: 'stroke width', def: 1.2, L: 0.5, M: 2, H: 3.5 },
  { id: 'curve', re: 'curve', def: 0.3, L: 0, M: 0.5, H: 1 },
  { id: 'hachureGap', re: 'hachure gap', def: 4, L: 2, M: 8, H: 14 },
  { id: 'fillDensity', re: 'fill density', def: 0.7, L: 0.2, M: 0.6, H: 1 },
];

async function pctDiff(a, b) {
  const x = await sharp(a).resize(400, 400, { fit: 'fill' }).raw().toBuffer({ resolveWithObject: true });
  const y = await sharp(b).resize(400, 400, { fit: 'fill' }).raw().toBuffer();
  const { data: A, info } = x; const ch = info.channels; const tot = info.width * info.height; let d = 0;
  for (let i = 0; i < tot; i++) { const k = i * ch; if ((Math.abs(A[k] - y[k]) + Math.abs(A[k + 1] - y[k + 1]) + Math.abs(A[k + 2] - y[k + 2])) / 3 > 12) d++; }
  return (100 * d / tot);
}

const { b, p, errs } = await launch();
try {
  await openDesk(p);
  const up = await openUpload(p, SVG);
  if (!up) { console.log('UPLOAD FAILED'); await b.close(); process.exit(1); }
  const rough = await setStyle(p, 'Rough hand-drawn');
  console.log('rough selected:', rough);
  await expandAll(p);
  const base = `${OUT}/_rough-base.png`;
  await shotPreview(p, base);

  const results = [];
  for (const f of FACTORS) {
    const panelDiffs = {};
    for (const lvl of ['L', 'M', 'H']) {
      const r = await setSlider(p, f.re, f[lvl]); await sleep(700);
      const shot = `${OUT}/${f.id}-${lvl}.png`; await shotPreview(p, shot);
      panelDiffs[lvl] = { set: r.ok, now: r.now, diff: +(await pctDiff(base, shot)).toFixed(2) };
    }
    await setSlider(p, f.re, f.def); await sleep(500); // revert this factor
    const maxDiff = Math.max(...Object.values(panelDiffs).map((d) => d.diff));
    results.push({ factor: f.id, setOk: panelDiffs.L.set, maxDiff, panels: panelDiffs });
    console.log(`${f.id.padEnd(13)} setOk=${panelDiffs.L.set}  L=${panelDiffs.L.diff}%  M=${panelDiffs.M.diff}%  H=${panelDiffs.H.diff}%  ${maxDiff > 1 ? '✓ MOVES' : '— flat'}`);
  }
  console.log('\nSUMMARY:', results.filter((r) => r.maxDiff > 1).length, '/', results.length, 'modifiers move the render on the REAL surface');
  console.log('errors:', errs.slice(0, 3));
} finally { await b.close(); }
