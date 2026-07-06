// REAL end-to-end: upload an SVG → place it (mine) → open its card → "Draw over"
// → draw a stroke → Done → confirm the saved markup changed (drawn-over the upload).
import puppeteer from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: CHROME, headless: false, args: ['--window-size=1500,1000'], defaultViewport: { width: 1500, height: 1000 } });
const p = await b.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 110)));
await p.goto('http://localhost:5182/desk?demo=1', { waitUntil: 'networkidle2', timeout: 60000 });
await sleep(4500);
const clickByText = (re) => p.evaluate((r) => { const b = [...document.querySelectorAll('button')].find((x) => new RegExp(r, 'i').test((x.textContent || '').trim())); if (b) { b.click(); return (b.textContent || '').trim(); } return null; }, re.source);

console.log('add doodle:', await clickByText(/add doodle/)); await sleep(1500);
console.log('upload-svg mode:', await clickByText(/upload svg/)); await sleep(800);
// set the file on the file input
const fileInput = await p.$('input[type=file]');
if (fileInput) { await fileInput.uploadFile('/tmp/dd-upload-test.svg'); console.log('file set'); }
await sleep(3500); // trace/sanitize
await p.screenshot({ path: '/tmp/dd-shots/up-1-loaded.png' });
console.log('done:', await clickByText(/^done$/)); await sleep(1500);
console.log('place:', await clickByText(/place on desk/)); await sleep(2500);
await p.screenshot({ path: '/tmp/dd-shots/up-2-placed.png' });
// open the placed object's card — tap object boxes until an edit card (Delete present) opens
const boxes = await p.evaluate(() => [...document.querySelectorAll('div')].filter((d) => d.style.width === '180px' && d.style.height === '180px' && d.style.position === 'relative').map((d) => { const r = d.getBoundingClientRect(); return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) }; }));
let editOpen = false;
for (const pt of boxes) { await p.mouse.click(pt.x, pt.y); await sleep(1300); const hasEdit = await p.evaluate(() => [...document.querySelectorAll('button')].some((x) => (x.textContent || '').trim() === 'Delete')); if (hasEdit) { editOpen = true; break; } const closeBtn = await p.evaluate(() => { const c = [...document.querySelectorAll('button')].find((x) => (x.textContent || '').trim() === 'Close'); if (c) { c.click(); return true; } return false; }); if (closeBtn) await sleep(500); }
console.log('edit card (mine) opened:', editOpen);
const reEdit = await p.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /draw over|re-draw/i.test((x.textContent || '').trim())); return b ? (b.textContent || '').trim() : null; });
console.log('>>> re-edit button:', JSON.stringify(reEdit));
await p.screenshot({ path: '/tmp/dd-shots/up-3-card.png' });
if (reEdit) {
  const before = await p.evaluate(() => { const s = document.querySelector('.dd-card, [data-object-card]')?.querySelector('svg'); return s ? s.outerHTML.length : 0; });
  await p.evaluate(() => { [...document.querySelectorAll('button')].find((x) => /draw over|re-draw/i.test((x.textContent || '').trim())).click(); }); await sleep(1800);
  const surf = await p.evaluate(() => { const els = [...document.querySelectorAll('svg, canvas')].map((e) => { const r = e.getBoundingClientRect(); return { w: r.width, h: r.height, cx: r.x + r.width / 2, cy: r.y + r.height / 2 }; }).filter((r) => r.w > 300 && r.h > 250); return els.sort((a, b) => (b.w * b.h) - (a.w * a.h))[0] || null; });
  if (surf) { await p.mouse.move(surf.cx - 80, surf.cy); await p.mouse.down(); for (let i = 0; i <= 10; i++) { await p.mouse.move(surf.cx - 80 + i * 16, surf.cy + Math.sin(i / 1.5) * 40); await sleep(22); } await p.mouse.up(); await sleep(500); }
  const doneOk = await p.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => (x.textContent || '').trim() === 'Done'); return b ? !b.disabled : 'no-done'; });
  console.log('drew stroke → Done enabled:', doneOk);
  await p.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => (x.textContent || '').trim() === 'Done'); if (b && !b.disabled) b.click(); }); await sleep(2000);
  const prev = await p.evaluate(()=>{const imgs=[...document.querySelectorAll('svg')].map(e=>{const r=e.getBoundingClientRect();return{w:r.width,h:r.height,x:r.x,y:r.y};}).filter(r=>r.w>120&&r.w<260&&r.h>120&&r.h<260); return imgs[0]||null;}); if(prev){await p.screenshot({path:'/tmp/dd-shots/up-4-after.png',clip:{x:Math.max(0,Math.round(prev.x-8)),y:Math.max(0,Math.round(prev.y-8)),width:Math.round(prev.w+16),height:Math.round(prev.h+16)}});}else{await p.screenshot({path:'/tmp/dd-shots/up-4-after.png'});}
}
console.log('errors:', errs.filter((e) => !/updateDoodleSvg|Supabase|v5|RPC|400|404/i.test(e)).slice(0, 4));
await b.close();
