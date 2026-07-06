// VISUAL verify the part editor on a FACE like Sebs's (head, eye, SMILE curve path,
// antenna dot+line, wrapped in a <g transform> — the cases the flat-shape test missed).
// For EVERY part: read its on-screen rect, click its center, and save a screenshot
// cropped to the editor canvas so the selection box vs the actual shape is visible.
// Also dumps how many parts svgToParts made + each tag/bbox. We READ every frame.
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
const fi = await p.$('input[type=file]'); if (fi) await fi.uploadFile('/tmp/dd-face-test.svg');
await sleep(2500);
await click(/^done$/); await sleep(1400);
await click(/place on desk/); await sleep(2500);
const boxes = await p.evaluate(() => [...document.querySelectorAll('div')].filter((d) => d.style.width === '180px' && d.style.height === '180px' && d.style.position === 'relative').map((d) => { const r = d.getBoundingClientRect(); return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) }; }));
for (const pt of boxes) { await p.mouse.click(pt.x, pt.y); await sleep(1300); const mine = await p.evaluate(() => [...document.querySelectorAll('button')].some((x) => (x.textContent || '').trim() === 'Delete')); if (mine) { const drew = await p.evaluate(() => { const x = [...document.querySelectorAll('button')].find((y) => /draw over|re-draw/i.test((y.textContent || '').trim())); if (x) { x.click(); return true; } return false; }); if (drew) break; } await p.evaluate(() => { const c = [...document.querySelectorAll('button')].find((x) => /^(close|back)$/i.test((x.textContent || '').trim())); if (c) c.click(); }); await sleep(400); }
await sleep(1800);

// the editor canvas (the big draw svg) — for cropping
const canvas = await p.evaluate(() => { const els = [...document.querySelectorAll('svg')].map((e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; }).filter((r) => r.w > 350 && r.h > 280); return els.sort((a, b2) => (b2.w * b2.h) - (a.w * a.h))[0] || null; });
const clip = canvas ? { x: Math.max(0, Math.round(canvas.x - 6)), y: Math.max(0, Math.round(canvas.y - 6)), width: Math.round(canvas.w + 12), height: Math.round(canvas.h + 12) } : undefined;

const parts = await p.evaluate(() => [...document.querySelectorAll('[data-part-id]')].map((el) => { const r = el.getBoundingClientRect(); return { id: el.getAttribute('data-part-id'), tag: el.tagName.toLowerCase(), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), cx: Math.round(r.x + r.width / 2), cy: Math.round(r.y + r.height / 2) }; }).filter((r) => r.w > 0 || r.h > 0));
console.log(`\nsvgToParts produced ${parts.length} parts (SVG has 5 shapes: head, eye, smile-path, antenna-dot, antenna-line):`);
for (const pt of parts) console.log(`  ${pt.id.padEnd(8)} <${pt.tag}>  screenRect=(${pt.x},${pt.y},${pt.w},${pt.h})  center=(${pt.cx},${pt.cy})`);
await p.screenshot({ path: '/tmp/dd-shots/vface-00-initial.png', clip });

// click each part center, screenshot
const selBox = () => p.evaluate(() => { const rs = [...document.querySelectorAll('svg rect')].filter((el) => { const da = el.getAttribute('stroke-dasharray') || ''; const fill = (el.getAttribute('fill') || '').toLowerCase(); const r = el.getBoundingClientRect(); return da && fill === 'none' && r.width > 14 && r.height > 14; }); if (!rs.length) return null; const r = rs[0].getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; });
let i = 1;
for (const pt of parts) {
  // click empty first to clear selection
  await p.mouse.click(clip.x + 12, clip.y + 12); await sleep(200);
  await p.mouse.click(pt.cx, pt.cy); await sleep(400);
  const sb = await selBox();
  const onShape = sb ? (Math.abs(sb.x - pt.x) <= 10 && Math.abs(sb.y - pt.y) <= 10) : false;
  console.log(`  click ${pt.id} <${pt.tag}> @(${pt.cx},${pt.cy}) → box=${sb ? `(${sb.x},${sb.y},${sb.w},${sb.h})` : 'NONE'}  onShape=${onShape}`);
  await p.screenshot({ path: `/tmp/dd-shots/vface-${String(i).padStart(2, '0')}-${pt.id}.png`, clip });
  i++;
}
// extra: click a point ON the smile arc's lowest point (not bbox center) — the curve itself
const smile = parts.find((x) => x.tag === 'path');
if (smile) {
  await p.mouse.click(clip.x + 12, clip.y + 12); await sleep(200);
  const onArc = { x: smile.cx, y: smile.y + smile.h - 4 }; // near the bottom of the smile curve
  await p.mouse.click(onArc.x, onArc.y); await sleep(400);
  const sb = await selBox();
  console.log(`  click ON smile arc bottom @(${onArc.x},${onArc.y}) → box=${sb ? `(${sb.x},${sb.y})` : 'NONE'}`);
  await p.screenshot({ path: `/tmp/dd-shots/vface-99-smilearc.png`, clip });
}
console.log('\npage errors:', errs.filter((e) => !/Supabase|RPC|400|404|v5/i.test(e)).slice(0, 5));
console.log('frames: /tmp/dd-shots/vface-*.png');
await b.close();
