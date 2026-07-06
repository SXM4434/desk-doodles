// Verify the even-odd raster fallback on a PENTAGRAM (self-intersecting single
// subpath): window.__evenOddViaRaster(d) must return outer ring + 1 pentagon HOLE
// (>=2 M-subpaths), where the old code returned null (→ solid flood).
import puppeteer from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: CHROME, headless: false, args: ['--window-size=1200,900'], defaultViewport: { width: 1200, height: 900 } });
const p = await b.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 120)));
await p.goto('http://localhost:5182/canvas', { waitUntil: 'networkidle2', timeout: 60000 });
await sleep(3500);
// pentagram (star order, center 150,150, R 100) as ONE self-intersecting subpath
const R = 100, cx = 150, cy = 150;
const pts = [];
for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * (4 * Math.PI / 5); pts.push([+(cx + R * Math.cos(a)).toFixed(2), +(cy + R * Math.sin(a)).toFixed(2)]); }
const d = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ') + ' Z';
const res = await p.evaluate((d) => {
  const f = window.__evenOddViaRaster;
  if (!f) return { err: 'no-hook' };
  const out = f(d);
  if (!out) return { err: 'null', out };
  const subpaths = (out.match(/M/g) || []).length;
  return { subpaths, len: out.length, head: out.slice(0, 120) };
}, d);
console.log('pentagram d:', d);
console.log('evenOddViaRaster:', JSON.stringify(res));
console.log('PASS:', res.subpaths >= 2 ? 'YES — outer + hole' : 'NO');
console.log('errors:', errs.slice(0, 3));
await b.close();
