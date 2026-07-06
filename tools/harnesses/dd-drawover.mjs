// Verify "Draw over" (re-draw over uploads/no-stroke objects) in the edit modal.
import puppeteer from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: CHROME, headless: false, args: ['--window-size=1500,1000'], defaultViewport: { width: 1500, height: 1000 } });
const p = await b.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 100)));
await p.goto('http://localhost:5182/desk?demo=1', { waitUntil: 'networkidle2', timeout: 60000 });
await sleep(4500);
const cardOpen = () => p.evaluate(() => [...document.querySelectorAll('button')].some((x) => (x.textContent || '').trim() === 'Delete'));
// click object boxes until a card opens (Delete button present)
const boxes = await p.evaluate(() => [...document.querySelectorAll('div')].filter((d) => d.style.width === '180px' && d.style.height === '180px' && d.style.position === 'relative').slice(0, 8).map((d) => { const r = d.getBoundingClientRect(); return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) }; }));
let opened = false;
for (const pt of boxes) { await p.mouse.click(pt.x, pt.y); await sleep(1400); if (await cardOpen()) { opened = true; break; } }
console.log('card opened:', opened);
const reEdit = await p.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /draw over|re-draw/i.test((x.textContent || '').trim())); return b ? (b.textContent || '').trim() : null; });
console.log('re-edit button:', JSON.stringify(reEdit));
if (reEdit) {
  await p.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /draw over|re-draw/i.test((x.textContent || '').trim())); b.click(); });
  await sleep(1800);
  await p.screenshot({ path: '/tmp/dd-shots/drawover-session.png' });
  // draw a stroke on the big draw surface
  const surf = await p.evaluate(() => { const els = [...document.querySelectorAll('svg, canvas')].map((e) => { const r = e.getBoundingClientRect(); return { w: r.width, h: r.height, cx: r.x + r.width / 2, cy: r.y + r.height / 2 }; }).filter((r) => r.w > 300 && r.h > 250); return els.sort((a, b) => (b.w * b.h) - (a.w * a.h))[0] || null; });
  if (surf) { await p.mouse.move(surf.cx - 70, surf.cy - 40); await p.mouse.down(); for (let i = 0; i <= 9; i++) { await p.mouse.move(surf.cx - 70 + i * 16, surf.cy - 40 + Math.sin(i / 1.5) * 35); await sleep(22); } await p.mouse.up(); await sleep(500); }
  const doneOk = await p.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => (x.textContent || '').trim() === 'Done'); return b ? !b.disabled : 'no-done'; });
  console.log('drew stroke → Done enabled:', doneOk);
  await p.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => (x.textContent || '').trim() === 'Done'); if (b && !b.disabled) b.click(); });
  await sleep(2000);
  await p.screenshot({ path: '/tmp/dd-shots/drawover-after.png' });
}
const real = errs.filter((e) => !/updateDoodleSvg|Supabase|fetch|network|v5|RPC/i.test(e));
console.log('errors:', real.slice(0, 4));
await b.close();
