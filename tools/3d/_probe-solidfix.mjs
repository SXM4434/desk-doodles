// One-off probe: render a few detail-rich shapes in SOLID at FULL GL resolution
// (front + 3/4) so the RC-2 face-ink relief can be judged by eye, plus dump the
// __dd3d-style receipt (face-ink rod count) from the live object. Read-only.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let chromium;
for (const p of ['/tmp/dd-pp/node_modules/playwright', '/Users/sebs/Desktop/Projects/portfolio/tools/lab-screenshots/node_modules/playwright']) {
  try { ({ chromium } = require(p)); break; } catch { /* next */ }
}
if (!chromium) { console.error('no playwright'); process.exit(2); }
const PORT = process.env.PORT ?? '4495';
const URL = `http://localhost:${PORT}/tools/3d/catalog-visual-3d.html`;
const OUT = '/tmp/dd-solidfix-probe';
mkdirSync(OUT, { recursive: true });
const TARGETS = (process.env.TARGETS ?? 'powerGlove,dominoTiles,wrestlingBoot,wornFidgetCube,instaxCamera,guitarPedal').split(',');
const ANGLES = [{ tag: 'front', angleDeg: 0, elevDeg: 14 }, { tag: 'q35', angleDeg: 35, elevDeg: 22 }];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 900, height: 900 } });
await page.goto(URL, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__visReady === true, { timeout: 60000 });
const shapes = await page.evaluate(() => window.__vis.shapes);
for (const name of TARGETS) {
  const idx = shapes.findIndex((s) => s.shape === name);
  if (idx < 0) { console.log('MISS', name); continue; }
  await page.evaluate((i) => window.__vis.sample(i), idx);
  for (const a of ANGLES) {
    const r = await page.evaluate((st) => window.__vis.render3d(st), {
      geometryMode: 'solid', style3d: 'native', materialPreset: 'matteClay',
      angleDeg: a.angleDeg, elevDeg: a.elevDeg,
    });
    const png = Buffer.from(r.dataUrl.split(',')[1], 'base64');
    writeFileSync(join(OUT, `${name}-${a.tag}.png`), png);
    const receipt = await page.evaluate(() => window.__dd3d ?? null);
    console.log(`${name} ${a.tag}: ${png.length}b  faceInkRods=${receipt ? receipt.solidFaceInkRods : 'n/a'}  px=${r.stats?.objFrac?.toFixed?.(3) ?? '?'}`);
  }
}
await browser.close();
console.log('out →', OUT);
