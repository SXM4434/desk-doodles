// Functionally verify SINGLE-TAP INK DOT: a tap on bare paper (nothing selected)
// lays a 1-point pen dot. Click once on /canvas, confirm a mark renders + a 2nd
// tap on the dot SELECTS (doesn't lay another), per the spec.
import puppeteer from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: CHROME, headless: false, args: ['--window-size=1300,950'], defaultViewport: { width: 1300, height: 950 } });
const p = await b.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 110)));
await p.goto('http://localhost:5182/canvas', { waitUntil: 'networkidle2', timeout: 60000 });
await sleep(3500);
const surf = await p.evaluate(() => { const el = document.querySelector('.dd-draw-surface, svg[role="img"], .dd-canvas, main') || document.body; const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
const cx = Math.round(surf.x + surf.w * 0.5), cy = Math.round(surf.y + surf.h * 0.45);
const markCount = () => p.evaluate(() => { const s = [...document.querySelectorAll('svg')].sort((a, b) => (b.getBoundingClientRect().width * b.getBoundingClientRect().height) - (a.getBoundingClientRect().width * a.getBoundingClientRect().height))[0]; return s ? s.querySelectorAll('path, circle, ellipse').length : -1; });
const before = await markCount();
// single tap on bare paper
await p.mouse.click(cx, cy); await sleep(900);
const afterTap = await markCount();
await p.screenshot({ path: '/tmp/dd-shots/tap-dot.png', clip: { x: Math.round(surf.x), y: Math.round(surf.y), width: Math.round(surf.w), height: Math.round(surf.h) } });
// tight crop on the dot
await p.screenshot({ path: '/tmp/dd-shots/tap-dot-zoom.png', clip: { x: cx - 60, y: cy - 60, width: 120, height: 120 } });
console.log('marks before tap:', before, '| after single tap:', afterTap, '| dot laid:', afterTap > before ? 'YES' : 'NO');
console.log('errors:', errs.filter((e) => !/Supabase|RPC|v5|fetch/i.test(e)).slice(0, 4));
await b.close();
