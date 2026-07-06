// Deep CSG verify: desk → svg-port → Clean → depth 0.5 → Sharp. Print all counters
// (manifold / csgApplied / csgDeepRegions) and zoom on a FILLED object to see crisp
// structural walls (the contour path) vs the old soft displacement.
import puppeteer from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: CHROME, headless: false, args: ['--window-size=1500,1000'], defaultViewport: { width: 1500, height: 1000 } });
const p = await b.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 120)));
await p.goto('http://localhost:5182/desk?demo=1', { waitUntil: 'networkidle2', timeout: 60000 });
await sleep(4500);
const clickText = async (t) => { const h = await p.evaluateHandle((x) => [...document.querySelectorAll('button')].find((b) => (b.textContent || '').trim().toLowerCase() === x.toLowerCase()) || null, t); const el = h.asElement(); if (el) { await el.click(); return true; } return false; };
const openTrigger = (s) => p.evaluate((x) => { const t = [...document.querySelectorAll('.dd-dropdown-trigger')].find((e) => (e.textContent || '').toLowerCase().includes(x.toLowerCase())); if (t) { t.click(); return (t.textContent || '').trim(); } return null; }, s);
const pickOption = (s) => p.evaluate((x) => { const o = [...document.querySelectorAll('[role=option]')].find((e) => (e.textContent || '').toLowerCase().includes(x.toLowerCase())); if (o) { o.click(); return true; } return false; }, s);
await clickText('Desk'); await sleep(600);
await clickText('3D'); await sleep(1800);
await openTrigger('native'); await sleep(400); await pickOption('svg'); await sleep(2500);
for (const lbl of ['rough', 'bold', 'stipple', 'sketchy', 'wire']) { const o = await openTrigger(lbl); if (o && !/native|svg-port|matte|auto/i.test(o)) break; }
await sleep(350); await pickOption('clean'); await sleep(2800);
// crank relief depth to 0.5
await p.evaluate(() => { const inputs = [...document.querySelectorAll('input.dd-range')]; const t = inputs.find((inp) => { let n = inp.closest('div'); for (let i = 0; i < 4 && n; i++) { if (/relief depth/i.test(n.textContent || '')) return true; n = n.parentElement; } return false; }); if (t) { const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; set.call(t, '0.5'); t.dispatchEvent(new Event('input', { bubbles: true })); } });
await sleep(2500);
await p.evaluate(() => { window.__csgApplied = 0; window.__csgDeepRegions = 0; });
const sharp = await p.evaluate(() => { const btn = [...document.querySelectorAll('button')].find((b) => (b.textContent || '').trim() === 'Sharp'); if (btn) { btn.click(); return true; } return false; });
console.log('Sharp:', sharp);
await sleep(7000); // manifold lazy-load + CSG across visible objects
const probe = await p.evaluate(() => ({ manifold: window.__manifoldLoaded, csgApplied: window.__csgApplied ?? 0, deepRegions: window.__csgDeepRegions ?? 0 }));
console.log('manifold:', JSON.stringify(probe.manifold), '| csgApplied:', probe.csgApplied, '| deepRegions:', probe.deepRegions);
// zoom into the desk center to read wall crispness
await p.mouse.move(740, 470); await p.keyboard.down('Control');
for (let i = 0; i < 7; i++) { await p.mouse.wheel({ deltaY: -120 }); await sleep(55); }
await p.keyboard.up('Control'); await sleep(1500);
await p.screenshot({ path: '/tmp/dd-shots/deepcsg-desk.png', clip: { x: 0, y: 520, width: 1120, height: 480 } });
console.log('errors:', errs.slice(0, 4));
await b.close();
