// Inspect EXACTLY what the save serializes: after a parts-only MOVE, read the
// part-layer ([data-parts-group]) innerHTML — this is the literal body the save
// wraps as `<svg viewBox=...>${innerHTML}</svg>`. Assert: all 5 geometry elements
// present (lossless), and the moved part carries an upload-space transform (so the
// move actually persists into the saved markup). The viewBox floor (≥ original, never
// cropped) is code-guaranteed in the serialize effect; this confirms the geometry.
import puppeteer from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: CHROME, headless: false, args: ['--window-size=1500,1000'], defaultViewport: { width: 1500, height: 1000 } });
const p = await b.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 140)));
await p.goto('http://localhost:5182/desk?demo=1', { waitUntil: 'networkidle2', timeout: 60000 });
await sleep(4500);
const click = (re) => p.evaluate((r) => { const x = [...document.querySelectorAll('button')].find((y) => new RegExp(r, 'i').test((y.textContent || '').trim())); if (x) { x.click(); return true; } return false; }, re.source);
await click(/add doodle/); await sleep(1400);
await click(/upload svg/); await sleep(800);
const fi = await p.$('input[type=file]'); if (fi) await fi.uploadFile('/tmp/dd-parts-test.svg');
await sleep(2500);
await click(/^done$/); await sleep(1400);
await click(/place on desk/); await sleep(2500);
const boxes = await p.evaluate(() => [...document.querySelectorAll('div')].filter((d) => d.style.width === '180px' && d.style.height === '180px' && d.style.position === 'relative').map((d) => { const r = d.getBoundingClientRect(); return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) }; }));
for (const pt of boxes) { await p.mouse.click(pt.x, pt.y); await sleep(1300); const mine = await p.evaluate(() => [...document.querySelectorAll('button')].some((x) => (x.textContent || '').trim() === 'Delete')); if (mine) { const drew = await p.evaluate(() => { const x = [...document.querySelectorAll('button')].find((y) => /draw over|re-draw/i.test((y.textContent || '').trim())); if (x) { x.click(); return true; } return false; }); if (drew) break; } await p.evaluate(() => { const c = [...document.querySelectorAll('button')].find((x) => /^(close|back)$/i.test((x.textContent || '').trim())); if (c) c.click(); }); await sleep(400); }
await sleep(1600);

const before = await p.evaluate(() => { const g = document.querySelector('[data-parts-group]'); return g ? (g.innerHTML.match(/<(circle|rect|ellipse|polygon|polyline|line|path)\b/g) || []).length : -1; });
const parts = await p.evaluate(() => [...document.querySelectorAll('[data-part-id]')].map((el) => { const r = el.getBoundingClientRect(); return { id: el.getAttribute('data-part-id'), cx: r.x + r.width / 2, cy: r.y + r.height / 2, w: r.width, h: r.height }; }).filter((r) => r.w > 1));
console.log('geometry els in part-layer (pre-move):', before, '(expect 5)');
const small = [...parts].sort((a, b2) => (a.w * a.h) - (b2.w * b2.h))[0];
await p.mouse.click(small.cx, small.cy); await sleep(400);
await p.mouse.move(small.cx, small.cy); await p.mouse.down();
for (let i = 1; i <= 8; i++) { await p.mouse.move(small.cx + (140 * i) / 8, small.cy + (120 * i) / 8); await sleep(18); }
await p.mouse.up(); await sleep(500);

const post = await p.evaluate((movedId) => {
  const g = document.querySelector('[data-parts-group]');
  if (!g) return null;
  const html = g.innerHTML;
  const geom = (html.match(/<(circle|rect|ellipse|polygon|polyline|line|path)\b/g) || []).length;
  const movedEl = g.querySelector(`[data-part-id="${movedId}"]`);
  const movedXform = movedEl ? movedEl.getAttribute('transform') : null;
  // how many parts carry a transform (only the moved one should)
  const withXform = [...g.querySelectorAll('[data-part-id]')].filter((e) => e.getAttribute('transform')).length;
  return { geom, movedXform, withXform };
}, small.id);
console.log('\n── what the save serializes (part-layer innerHTML after move) ──');
if (post) {
  console.log(`  geometry elements: ${post.geom} → lossless: ${post.geom >= 5 ? 'OK' : 'OFF'}`);
  console.log(`  moved part (${small.id}) transform: ${post.movedXform || '(none)'} → ${post.movedXform ? 'OK (move persists)' : 'OFF'}`);
  console.log(`  parts carrying a transform: ${post.withXform} (expect 1 — only the moved one)`);
} else { console.log('  part-layer not found'); }
console.log('\npage errors:', errs.filter((e) => !/updateDoodleSvg|Supabase|RPC|400|404|v5/i.test(e)).slice(0, 5));
await b.close();
