// Verify WebGL context-loss RECOVERY (not just that the handler is wired): draw a
// shape, go 3D, screenshot baseline, force loseContext() + restoreContext() via the
// WEBGL_lose_context extension, screenshot after, and confirm the object repaints
// (the canvas is NOT permanently black). Also asserts the 'lost' event was
// preventDefault()'d (the precondition for restoration).
import puppeteer from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: CHROME, headless: false, args: ['--window-size=1500,1000'], defaultViewport: { width: 1500, height: 1000 } });
const p = await b.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 100)));
await p.goto('http://localhost:5182/canvas', { waitUntil: 'networkidle2', timeout: 60000 });
await sleep(3200);
const box = await p.evaluate(() => { const el = document.querySelector('.dd-draw-surface, svg[role="img"], .dd-canvas, main') || document.body; const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
const cx = Math.round(box.x + box.w * 0.5), cy = Math.round(box.y + box.h * 0.5);
const stroke = async (pts) => { await p.mouse.move(pts[0][0], pts[0][1]); await p.mouse.down(); for (const [x, y] of pts.slice(1)) { await p.mouse.move(x, y); await sleep(7); } await p.mouse.up(); await sleep(160); };
const ring = []; for (let d = 0; d <= 360; d += 14) { const t = d * Math.PI / 180; ring.push([Math.round(cx + 90 * Math.cos(t)), Math.round(cy + 90 * Math.sin(t))]); }
await stroke(ring);
await sleep(400);
const set = (fn, ...x) => p.evaluate((f, args) => { const s = window.__ddSet; if (s && s[f]) s[f](...args); }, fn, x);
await set('setMode', '3d'); await sleep(1200);
await set('setStyle3d', 'native'); await sleep(1500);

// Helper: mean luminance of the canvas pixels (proxy for "something is drawn").
const canvasLuma = () => p.evaluate(() => {
  const c = document.querySelector('canvas'); if (!c) return null;
  const g = c.getContext('webgl2') || c.getContext('webgl');
  // read a downscaled snapshot via 2d copy (preserveDrawingBuffer may be off on /canvas single — use toDataURL fallback)
  const tmp = document.createElement('canvas'); tmp.width = 64; tmp.height = 64;
  const t = tmp.getContext('2d'); t.drawImage(c, 0, 0, 64, 64);
  const d = t.getImageData(0, 0, 64, 64).data; let sum = 0, nonblank = 0;
  for (let i = 0; i < d.length; i += 4) { const a = d[i + 3]; const l = (d[i] + d[i + 1] + d[i + 2]) / 3; sum += l; if (a > 8 && l > 6) nonblank++; }
  return { meanL: +(sum / (d.length / 4)).toFixed(1), nonblankFrac: +(nonblank / (d.length / 4)).toFixed(3) };
});
await p.screenshot({ path: '/tmp/dd-shots/ctx-1-before.png' });
const before = await canvasLuma();

// Force loss + restore via the extension, capture whether 'lost' was preventDefault()'d.
const ev = await p.evaluate(async () => {
  const c = document.querySelector('canvas'); if (!c) return { err: 'no-canvas' };
  const gl = c.getContext('webgl2') || c.getContext('webgl'); if (!gl) return { err: 'no-gl' };
  const ext = gl.getExtension('WEBGL_lose_context'); if (!ext) return { err: 'no-ext' };
  let defaulted = false;
  c.addEventListener('webglcontextlost', (e) => { defaulted = e.defaultPrevented; }, { once: true });
  ext.loseContext();
  await new Promise((r) => setTimeout(r, 400));
  // defaultPrevented reflects whether the app's listener called preventDefault()
  const lostDefaultPrevented = defaulted;
  ext.restoreContext();
  await new Promise((r) => setTimeout(r, 1200));
  return { lostDefaultPrevented };
});
await sleep(2000); // let the restored frameloop repaint
await p.screenshot({ path: '/tmp/dd-shots/ctx-2-after.png' });
const after = await canvasLuma();
console.log('event:', JSON.stringify(ev));
console.log('before:', JSON.stringify(before), 'after:', JSON.stringify(after));
console.log('errors:', errs.filter((e) => !/Supabase|RPC|v5|fetch/i.test(e)).slice(0, 4));
await b.close();
