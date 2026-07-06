// In the STROKE editor (Re-draw, where DRAWN doodles live), draw a face, reopen, and
// test: is each stroke (head, eye, SMILE) selectable by clicking it? Screenshot each.
import puppeteer from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: CHROME, headless: false, args: ['--window-size=1600,1050'], defaultViewport: { width: 1600, height: 1050 } });
const p = await b.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 140)));
await p.goto('http://localhost:5182/desk?demo=1', { waitUntil: 'networkidle2', timeout: 60000 });
await sleep(4000);
const click = (re) => p.evaluate((r) => { const x = [...document.querySelectorAll('button')].find((y) => new RegExp(r, 'i').test((y.textContent || '').trim())); if (x) { x.click(); return (x.textContent || '').trim(); } return null; }, re.source);
await click(/add doodle/); await sleep(1500);
const surf = await p.evaluate(() => { const els = [...document.querySelectorAll('svg')].map((e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; }).filter((r) => r.w > 350 && r.h > 280); return els.sort((a, b2) => (b2.w * b2.h) - (a.w * a.h))[0] || null; });
const cx = surf.x + surf.w / 2, cy = surf.y + surf.h / 2;
const stroke = async (pts) => { await p.mouse.move(pts[0][0], pts[0][1]); await p.mouse.down(); for (let i = 1; i < pts.length; i++) { await p.mouse.move(pts[i][0], pts[i][1]); await sleep(8); } await p.mouse.up(); await sleep(250); };
const R = Math.min(surf.w, surf.h) * 0.28;
const headPts = []; for (let a = 0; a <= Math.PI * 2 + 0.2; a += 0.25) headPts.push([cx + R * Math.cos(a), cy + R * Math.sin(a)]); await stroke(headPts);
const eyePts = []; const er = R * 0.12, ecx = cx - R * 0.35, ecy = cy - R * 0.3; for (let a = 0; a <= Math.PI * 2 + 0.2; a += 0.5) eyePts.push([ecx + er * Math.cos(a), ecy + er * Math.sin(a)]); await stroke(eyePts);
const smilePts = []; for (let t = 0; t <= 1.001; t += 0.1) smilePts.push([cx - R * 0.5 + t * R, cy + R * 0.35 + Math.sin(t * Math.PI) * R * 0.28]); await stroke(smilePts);
await sleep(400);
await click(/^done$/); await sleep(1500);
await click(/place on desk/); await sleep(2500);
const boxes = await p.evaluate(() => [...document.querySelectorAll('div')].filter((d) => d.style.width === '180px' && d.style.height === '180px' && d.style.position === 'relative').map((d) => { const r = d.getBoundingClientRect(); return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) }; }));
for (const pt of boxes) { await p.mouse.click(pt.x, pt.y); await sleep(1200); const mine = await p.evaluate(() => [...document.querySelectorAll('button')].some((x) => (x.textContent || '').trim() === 'Delete')); if (mine) { const drew = await p.evaluate(() => { const x = [...document.querySelectorAll('button')].find((y) => /draw over|re-draw/i.test((y.textContent || '').trim())); if (x) { x.click(); return true; } return false; }); if (drew) break; } await p.evaluate(() => { const c = [...document.querySelectorAll('button')].find((x) => /^(close|back)$/i.test((x.textContent || '').trim())); if (c) c.click(); }); await sleep(400); }
await sleep(1600);

// editor svg + crop
const ed = await p.evaluate(() => { const els = [...document.querySelectorAll('svg')].map((e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, paths: e.querySelectorAll('path').length }; }).filter((r) => r.w > 350 && r.h > 280); return els.sort((a, b2) => (b2.w * b2.h) - (a.w * a.h))[0] || null; });
const clip = ed ? { x: Math.max(0, Math.round(ed.x - 6)), y: Math.max(0, Math.round(ed.y - 6)), width: Math.round(ed.w + 12), height: Math.round(ed.h + 12) } : undefined;
// rendered stroke paths + their screen bboxes (filled freehand ribbons)
const strokes = await p.evaluate((edBox) => {
  const svg = [...document.querySelectorAll('svg')].filter((e) => { const r = e.getBoundingClientRect(); return Math.abs(r.x - edBox.x) < 30 && r.width > 350; })[0];
  if (!svg) return [];
  return [...svg.querySelectorAll('path')].map((pa, i) => { const r = pa.getBoundingClientRect(); return { i, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), cx: Math.round(r.x + r.width / 2), cy: Math.round(r.y + r.height / 2) }; }).filter((r) => r.w > 4 && r.h > 1);
}, ed);
console.log(`\nrendered stroke paths in editor: ${strokes.length}`);
strokes.forEach((s) => console.log(`  path[${s.i}] bbox=(${s.x},${s.y},${s.w},${s.h})`));
// the smile = widest, in lower half, short height
const smile = [...strokes].filter((s) => s.cy > ed.y + ed.h * 0.5).sort((a, b2) => b2.w - a.w)[0] || strokes.sort((a, b2) => b2.w - a.w)[0];
const selRect = () => p.evaluate(() => { const rs = [...document.querySelectorAll('svg rect')].filter((el) => { const da = el.getAttribute('stroke-dasharray') || ''; const fill = (el.getAttribute('fill') || '').toLowerCase(); const r = el.getBoundingClientRect(); return da && fill === 'none' && r.width > 10 && r.height > 6; }); if (!rs.length) return null; const r = rs[0].getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; });
console.log('\n── clicking each stroke (tap-to-select) ──');
let idx = 1;
for (const s of strokes) {
  await p.mouse.click(clip.x + 10, clip.y + 10); await sleep(200); // clear
  await p.mouse.click(s.cx, s.cy); await sleep(400);
  const sb = await selRect();
  const isSmile = s === smile ? ' (SMILE)' : '';
  console.log(`  click path[${s.i}]${isSmile} @(${s.cx},${s.cy}) → selBox=${sb ? `(${sb.x},${sb.y},${sb.w},${sb.h})` : 'NONE — not selectable'}`);
  await p.screenshot({ path: `/tmp/dd-shots/sstroke-${String(idx).padStart(2, '0')}-path${s.i}.png`, clip });
  idx++;
}
console.log('\npage errors:', errs.filter((e) => !/Supabase|RPC|400|404|v5/i.test(e)).slice(0, 6));
console.log('frames: /tmp/dd-shots/sstroke-*.png');
await b.close();
