// Diagnose how Clean renders TONAL regions (resolve the clean=hachure contradiction),
// then compare fillStyle:'solid'. Upload the tonal test SVG on /canvas, screenshot
// the Clean render, flip fillStyle to 'solid' via __ddSet, screenshot again.
import puppeteer from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: CHROME, headless: false, args: ['--window-size=1300,950'], defaultViewport: { width: 1300, height: 950 } });
const p = await b.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 110)));
await p.goto('http://localhost:5182/canvas', { waitUntil: 'networkidle2', timeout: 60000 });
await sleep(3500);
const clickByText = (re) => p.evaluate((r) => { const x = [...document.querySelectorAll('button')].find((e) => new RegExp(r, 'i').test((e.textContent || '').trim())); if (x) { x.click(); return (x.textContent || '').trim(); } return null; }, re.source);
console.log('upload svg:', await clickByText(/upload svg/)); await sleep(800);
const fi = await p.$('input[type=file]'); if (fi) { await fi.uploadFile('/tmp/dd-tonal-test.svg'); } await sleep(3000);
const surf = () => p.evaluate(() => { const s = [...document.querySelectorAll('svg')].map((e) => { const r = e.getBoundingClientRect(); return { e, r, a: r.width * r.height }; }).filter((o) => o.r.width > 180 && o.r.height > 120).sort((a, b) => b.a - a.a)[0]; return s ? { x: Math.round(s.r.x), y: Math.round(s.r.y), w: Math.round(s.r.width), h: Math.round(s.r.height), marks: s.e.querySelectorAll('path,line,rect,circle,ellipse').length } : null; });
const s1 = await surf();
console.log('Clean render:', JSON.stringify(s1));
if (s1) await p.screenshot({ path: '/tmp/dd-shots/tonal-clean.png', clip: { x: s1.x, y: s1.y, width: s1.w, height: Math.min(s1.h, 600) } });
// flip fillStyle to solid
await p.evaluate(() => { const s = window.__ddSet; if (s && s.setMod) s.setMod('fillStyle', 'solid'); }); await sleep(1800);
const s2 = await surf();
console.log('Solid render:', JSON.stringify(s2));
if (s2) await p.screenshot({ path: '/tmp/dd-shots/tonal-solid.png', clip: { x: s2.x, y: s2.y, width: s2.w, height: Math.min(s2.h, 600) } });
console.log('errors:', errs.filter((e) => !/Supabase|RPC|v5|fetch/i.test(e)).slice(0, 4));
await b.close();
