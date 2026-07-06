// DIAGNOSE newsprint svg-port: dump the ACTUAL rasterized svg + emissive channel
// so we see WHY the dots don't carve (mask broken? dots sub-pixel?). Compares to
// stipple (which works). Real Chrome (WebGL + canvas rasterization).
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: CHROME, headless: false, args: ['--window-size=1500,1000'], defaultViewport: { width: 1500, height: 1000 } });
const p = await b.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 100)));
await p.goto('http://localhost:5182/canvas', { waitUntil: 'networkidle2', timeout: 60000 });
await sleep(3500);
const box = await p.evaluate(() => { const el = document.querySelector('.dd-draw-surface, svg[role="img"], .dd-canvas, main') || document.body; const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
const cx = Math.round(box.x + box.w * 0.5), cy = Math.round(box.y + box.h * 0.5);
async function stroke(pts) { await p.mouse.move(pts[0][0], pts[0][1]); await p.mouse.down(); for (const [x, y] of pts.slice(1)) { await p.mouse.move(x, y); await sleep(8); } await p.mouse.up(); await sleep(150); }
// Draw a CLOSED filled blob (so there's a region a dot-fill can populate).
const R = Math.min(box.w, box.h) * 0.22; const loop = [];
for (let a = 0; a <= 360; a += 10) { const r = (a * Math.PI) / 180; loop.push([Math.round(cx + R * Math.cos(r)), Math.round(cy + R * Math.sin(r))]); }
await stroke(loop); await sleep(400);
const set = (fn, ...a) => p.evaluate((f, args) => { const s = window.__ddSet; if (s && s[f]) s[f](...args); }, fn, a);
await p.evaluate(() => { window.__svgPortDebug = true; });
await set('setMode', '3d'); await sleep(1000);
await set('setStyle3d', 'svg-port'); await sleep(1500);

async function dump(style) {
  await set('setSvgStyle', style); await sleep(2600);
  const d = await p.evaluate(() => window.__svgPortDebugURLs || null);
  if (!d) { console.log(style, 'NO DEBUG DUMP'); return; }
  // serialized svg (the exact thing rasterized) + emissive png
  const svg = decodeURIComponent(d.serialized || '');
  writeFileSync(`/tmp/dd-shots/diag-${style}.svg`, svg);
  if (d.emissive) writeFileSync(`/tmp/dd-shots/diag-${style}-emissive.png`, Buffer.from(d.emissive.split(',')[1], 'base64'));
  // quick structural facts
  const facts = {
    hasMask: /mask\s*=/.test(svg), hasDefsMask: /<mask\b/.test(svg), hasPattern: /<pattern\b/.test(svg),
    maskRef: (svg.match(/mask="url\(#([^)]+)\)"/) || [])[1] || null,
    dotCircles: (svg.match(/<circle\b/g) || []).length, len: svg.length,
  };
  console.log(style, JSON.stringify(facts));
}
await dump('stipple');
await dump('newsprint');
console.log('errors', errs.slice(0, 4));
await b.close();
