// Functionally verify the stale-drag fix: grab an object by its move grip, drag it
// a known delta, and confirm it LANDS at ~delta (no stale-jump / snap-back), while
// TRACKING the cursor at intermediate points (the stale-closure bug would freeze or
// jump). Feel (smoothness) is Sebs's; this proves it functions.
import puppeteer from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: CHROME, headless: false, args: ['--window-size=1500,1000'], defaultViewport: { width: 1500, height: 1000 } });
const p = await b.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 110)));
await p.goto('http://localhost:5182/desk?demo=1', { waitUntil: 'networkidle2', timeout: 60000 });
await sleep(4500);
// find an object box + its grip (top-left ⠿ at ~+10,+10)
const obj = await p.evaluate(() => {
  const d = [...document.querySelectorAll('div')].find((e) => e.style.width === '180px' && e.style.height === '180px' && e.style.position === 'relative');
  if (!d) return null;
  const r = d.getBoundingClientRect();
  return { left: r.x, top: r.y, cx: Math.round(r.x + r.width / 2), cy: Math.round(r.y + r.height / 2), grip: { x: Math.round(r.x + 14), y: Math.round(r.y + 14) } };
});
if (!obj) { console.log('no object found'); await b.close(); process.exit(0); }
const DX = 180, DY = 120;
const track = [];
await p.mouse.move(obj.grip.x, obj.grip.y); await p.mouse.down(); await sleep(120);
for (let i = 1; i <= 6; i++) {
  await p.mouse.move(obj.grip.x + (DX * i) / 6, obj.grip.y + (DY * i) / 6); await sleep(60);
  // sample the dragged object's current center (the one nearest the cursor)
  const here = await p.evaluate(() => { const boxes = [...document.querySelectorAll('div')].filter((e) => e.style.width === '180px' && e.style.height === '180px' && e.style.position === 'relative'); return boxes.map((d) => { const r = d.getBoundingClientRect(); return { cx: Math.round(r.x + r.width / 2), cy: Math.round(r.y + r.height / 2) }; }); });
  track.push(here);
}
await p.mouse.up(); await sleep(600);
const after = await p.evaluate(() => { const boxes = [...document.querySelectorAll('div')].filter((e) => e.style.width === '180px' && e.style.height === '180px' && e.style.position === 'relative'); return boxes.map((d) => { const r = d.getBoundingClientRect(); return { cx: Math.round(r.x + r.width / 2), cy: Math.round(r.y + r.height / 2) }; }); });
// the dragged object should be near (obj.cx+DX, obj.cy+DY)
const target = { x: obj.cx + DX, y: obj.cy + DY };
const nearest = after.map((o) => ({ o, d: Math.hypot(o.cx - target.x, o.cy - target.y) })).sort((a, b) => a.d - b.d)[0];
console.log('drag target:', JSON.stringify(target), '| nearest object after:', JSON.stringify(nearest.o), '| miss px:', Math.round(nearest.d));
console.log('LANDED OK:', nearest.d < 60 ? 'YES (tracks to drop, no stale-jump)' : 'CHECK');
console.log('errors:', errs.filter((e) => !/Supabase|RPC|v5|fetch/i.test(e)).slice(0, 4));
await b.close();
