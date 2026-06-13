// Targeted diagnostic: does the SVG-PORT style render ported SURFACE marks, or
// only the edge outline? Renders, for a few representative shapes, three states
// at the same camera: native-ink (no marks, edge via inverted hull off),
// svg-port (edge + ported marks), and hatch (dense marks for contrast). Compares
// pixel stats (spread / blackFrac / objFrac). If svg-port spread ≈ native spread
// and ≪ hatch spread, the ported surface marks are NOT contributing — the face
// is blank and only the EdgesGeometry outline shows. READ-ONLY probe.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let chromium;
for (const p of ['/tmp/dd-pp/node_modules/playwright', '/Users/sebs/Desktop/Projects/portfolio/tools/lab-screenshots/node_modules/playwright']) {
  try { ({ chromium } = require(p)); break; } catch {}
}
const URL = process.env.VIS_URL ?? 'http://localhost:4493/tools/3d/catalog-visual-3d.html';
const A = { angleDeg: 35, elevDeg: 22 };
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 760, height: 460 } });
await page.goto(URL, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__visReady === true, { timeout: 60000 });
const shapes = await page.evaluate(() => window.__vis.shapes);
// pick a solid-block shape, a line-art shape, a curved shape
const wanted = ['guitarPedal', 'drumsticks', 'lacroixCan', 'topoChicoBottle', 'footAirlineLogo'];
const idxs = [];
for (const w of wanted) { const i = shapes.findIndex(s => s.shape === w); if (i >= 0) idxs.push(i); }
if (idxs.length === 0) idxs.push(0, 1, 2);
console.log('probing shapes:', idxs.map(i => shapes[i].shape).join(', '));
for (const i of idxs) {
  await page.evaluate((x) => window.__vis.sample(x), i);
  const native = await page.evaluate((st) => window.__vis.render3d(st), { geometryMode: 'extrude', style3d: 'native', materialPreset: 'ink', ...A });
  const svgport = await page.evaluate((st) => window.__vis.render3d(st), { geometryMode: 'extrude', style3d: 'svg-port', ...A });
  const hatch = await page.evaluate((st) => window.__vis.render3d(st), { geometryMode: 'extrude', style3d: 'hatch', hatchGrammar: 'hachure', hatchDirection: 'fixed', hatchInputs: { hachureGap: 4, hachureAngle: -41, strokeWidth: 1.2, inkIntensity: 1.0 }, ...A });
  const f = (s) => `obj=${s.objFrac} spread=${s.spread} blackFrac=${s.blackFrac} lit=(${s.lit.r},${s.lit.g},${s.lit.b}) lum=${s.lum}`;
  console.log(`\n=== ${shapes[i].shape} ===`);
  console.log('  native :', f(native.stats));
  console.log('  svgport:', f(svgport.stats));
  console.log('  hatch  :', f(hatch.stats));
  const markDelta = svgport.stats.spread - native.stats.spread;
  console.log(`  → svgport spread − native spread = ${markDelta}  (≈0 means face marks NOT contributing; large means marks present)`);
}
await browser.close();
