// Functionally verify CIRCLE SNAP (Taubin fit): draw a ROUGH wobbly circle, click
// "Snap", confirm it becomes a clean circle. before/after screenshots. Feel is
// Sebs's; this proves the Taubin fit produces a clean snapped circle.
import puppeteer from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: CHROME, headless: false, args: ['--window-size=1300,950'], defaultViewport: { width: 1300, height: 950 } });
const p = await b.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 110)));
await p.goto('http://localhost:5182/canvas', { waitUntil: 'networkidle2', timeout: 60000 });
await sleep(3500);
const surf = await p.evaluate(() => { const el = document.querySelector('.dd-draw-surface, svg[role="img"], .dd-canvas, main') || document.body; const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
const cx = Math.round(surf.x + surf.w * 0.45), cy = Math.round(surf.y + surf.h * 0.45), R = 120;
// rough wobbly circle (radius noise + not quite closed)
await p.mouse.move(cx + R, cy); await p.mouse.down();
for (let d = 0; d <= 350; d += 10) { const t = d * Math.PI / 180; const rr = R + (d % 30 === 0 ? 14 : -8) * Math.sin(d / 17); await p.mouse.move(Math.round(cx + rr * Math.cos(t)), Math.round(cy + rr * Math.sin(t))); await sleep(6); }
await p.mouse.up(); await sleep(700);
const clip = { x: Math.round(surf.x), y: Math.round(surf.y), width: Math.round(surf.w * 0.7), height: Math.round(surf.h) };
await p.screenshot({ path: '/tmp/dd-shots/snap-before.png', clip });
// click Snap
const snapClicked = await p.evaluate(() => { const btn = [...document.querySelectorAll('button')].find((x) => (x.textContent || '').trim() === 'Snap'); if (btn && !btn.disabled) { btn.click(); return true; } return btn ? 'disabled' : 'not-found'; });
console.log('Snap clicked:', snapClicked);
await sleep(1500);
await p.screenshot({ path: '/tmp/dd-shots/snap-after.png', clip });
console.log('errors:', errs.filter((e) => !/Supabase|RPC|v5|fetch/i.test(e)).slice(0, 4));
await b.close();
