// LIVE check for BUG B — drives http://localhost:5182/canvas, draws a stroke,
// flips to 3D, sets geometryMode=inflate, and compares NATIVE vs SVG-PORT.
// Reads window.__dd3d (the scene's own build receipt: builds[].kind) and
// screenshots each. Proves on the REAL app that svg-port renders a `solid`
// mass under geometryMode=inflate (so the Inflate toggles cannot bite), while
// native renders genuine `inflate` geometry.
//
//   node tools/debug/geometry-toggle-live.mjs --port 5182
//
// Read-only: never publishes to /desk. Uses /canvas + the DEV __ddSet seam.

import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

function arg(name, def) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : def;
}
const PORT = arg('port', '5182');
const OUT = '/tmp/dd-bugB';
mkdirSync(OUT, { recursive: true });

let chromium;
for (const p of ['/tmp/dd-pp/node_modules/playwright']) {
  try { ({ chromium } = require(p)); break; } catch {}
}
if (!chromium) { console.log('NO_PLAYWRIGHT'); process.exit(2); }

const browser = await chromium.launch();
// Small viewport per the vision-overflow rule (one small image at a time).
const page = await browser.newPage({ viewport: { width: 900, height: 640 }, deviceScaleFactor: 1 });
const errs = [];
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
page.on('pageerror', (e) => errs.push('PAGEERR ' + e.message));

try { await page.goto(`http://localhost:${PORT}/canvas`, { waitUntil: 'networkidle', timeout: 15000 }); }
catch { console.log('SERVER_DOWN'); await browser.close(); process.exit(3); }
await page.waitForTimeout(800);

async function clickByText(re) {
  const btns = await page.$$('button');
  for (const b of btns) {
    const t = (await b.innerText().catch(() => '')).trim();
    if (re.test(t)) { await b.click().catch(() => {}); return t; }
  }
  return null;
}

// ── 1. Draw a clear OPEN curved stroke on the 2D draw surface ──────────────
const box = await page.evaluate(() => {
  const s = document.querySelector('main svg');
  if (!s) return null;
  const r = s.getBoundingClientRect();
  return { x: r.x, y: r.y, w: r.width, h: r.height };
});
if (!box) { console.log('NO_DRAW_SURFACE'); await browser.close(); process.exit(4); }

const pts = [];
for (let i = 0; i <= 40; i++) {
  const t = i / 40;
  pts.push({
    x: box.x + box.w * (0.2 + 0.6 * t),
    y: box.y + box.h * (0.5 + 0.22 * Math.sin(t * Math.PI * 2)),
  });
}
await page.mouse.move(pts[0].x, pts[0].y);
await page.mouse.down();
for (let i = 1; i < pts.length; i++) await page.mouse.move(pts[i].x, pts[i].y, { steps: 2 });
await page.mouse.up();
await page.waitForTimeout(500);

// ── 2. Flip to 3D ──────────────────────────────────────────────────────────
await clickByText(/^3D$/);
await page.waitForTimeout(1800);
const has3d = await page.evaluate(() => !!document.querySelector('main canvas'));
console.log(`3D canvas present: ${has3d}`);

async function setAndRead(style3d, geometryMode, tag) {
  const set = await page.evaluate(({ style3d, geometryMode }) => {
    const s = window.__ddSet;
    if (!s) return { ok: false, why: '__ddSet missing' };
    s.setStyle3d?.(style3d);
    s.setGeometryMode?.(geometryMode);
    return { ok: true };
  }, { style3d, geometryMode });
  await page.waitForTimeout(2000); // let svg-port offscreen render + carve land
  const dd3d = await page.evaluate(() => {
    const d = window.__dd3d;
    if (!d) return null;
    return { geometryMode: d.geometryMode, builds: d.builds, reliefBump: d.reliefBump };
  });
  await page.locator('main').screenshot({ path: `${OUT}/${tag}.png` });
  const kinds = dd3d?.builds?.map((b) => b.kind).join(',') ?? 'none';
  console.log(`  [${tag}] set=${set.ok} reportedMode=${dd3d?.geometryMode} builtKinds=[${kinds}]  → ${OUT}/${tag}.png`);
  return { kinds, dd3d };
}

console.log('\n── style3d=native, geometryMode=inflate ──');
const nativeInflate = await setAndRead('native', 'inflate', 'native-inflate');

console.log('── style3d=svg-port, geometryMode=inflate ──');
const svgportInflate = await setAndRead('svg-port', 'inflate', 'svgport-inflate');

console.log('── style3d=svg-port, geometryMode=rod (sanity: still solid?) ──');
const svgportRod = await setAndRead('svg-port', 'rod', 'svgport-rod');

console.log('\n── VERDICT (live) ──');
console.log(`  native+inflate  built kinds: [${nativeInflate.kinds}]  (expect 'inflate')`);
console.log(`  svg-port+inflate built kinds: [${svgportInflate.kinds}]  (expect 'solid' → Inflate params dropped)`);
console.log(`  svg-port+rod    built kinds: [${svgportRod.kinds}]  (expect 'solid' → mode ignored under svg-port)`);
console.log(`  console errors during run: ${errs.length}`);
if (errs.length) console.log('  ' + errs.slice(0, 4).join('\n  '));

await browser.close();
