// HATCH close-up A/B: zoom HARD on the demo center (the hatched object) under
// walls-sharp deep CSG, capture flatten OFF (bug) vs ON (fix) at high zoom so the
// per-region depth reads. Confirms (1) hatch panel no longer buries into a dark
// recessed pit, (2) any genuine solid recess still carves.
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = '/tmp/dd-hatch-ab';
mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: CHROME, headless: false, args: ['--window-size=1500,1000'], defaultViewport: { width: 1500, height: 1000 } });
const p = await b.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 120)));
await p.goto('http://localhost:5182/desk?demo=1', { waitUntil: 'networkidle2', timeout: 60000 });
await sleep(4500);
const clickText = async (t) => { const h = await p.evaluateHandle((x) => [...document.querySelectorAll('button')].find((b) => (b.textContent || '').trim().toLowerCase() === x.toLowerCase()) || null, t); const el = h.asElement(); if (el) { await el.click(); return true; } return false; };
const openTrigger = (s) => p.evaluate((x) => { const t = [...document.querySelectorAll('.dd-dropdown-trigger')].find((e) => (e.textContent || '').toLowerCase().includes(x.toLowerCase())); if (t) { t.click(); return (t.textContent || '').trim(); } return null; }, s);
const pickOption = (s) => p.evaluate((x) => { const o = [...document.querySelectorAll('[role=option]')].find((e) => (e.textContent || '').toLowerCase().includes(x.toLowerCase())); if (o) { o.click(); return true; } return false; }, s);
const setRelief = (v) => p.evaluate((val) => { const inputs = [...document.querySelectorAll('input.dd-range')]; const t = inputs.find((inp) => { let n = inp.closest('div'); for (let i = 0; i < 4 && n; i++) { if (/relief depth/i.test(n.textContent || '')) return true; n = n.parentElement; } return false; }); if (t) { const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; set.call(t, String(val)); t.dispatchEvent(new Event('input', { bubbles: true })); } }, v);
const clickPill = (label) => p.evaluate((x) => { const btn = [...document.querySelectorAll('button')].find((b) => (b.textContent || '').trim() === x); if (btn) { btn.click(); return true; } return false; }, label);

await clickText('Desk'); await sleep(600);
await clickText('3D'); await sleep(1800);
await openTrigger('native'); await sleep(400); await pickOption('svg-port'); await sleep(2500);
await setRelief(0.5); await sleep(1500);
// hard zoom centered on the hatched middle object
await p.mouse.move(640, 470); await p.keyboard.down('Control');
for (let i = 0; i < 13; i++) { await p.mouse.wheel({ deltaY: -120 }); await sleep(55); }
await p.keyboard.up('Control'); await sleep(1200);
const clip = { x: 200, y: 250, width: 900, height: 700 };

async function capture(tag, flattenVal) {
  await p.evaluate((v) => { window.__svgPortTextureFlatten = v; }, flattenVal);
  await setRelief(0.0); await sleep(700);
  await setRelief(0.5); await sleep(2200);
  await clickPill('Sharp'); await sleep(7000);
  await p.screenshot({ path: `${OUT}/closeup-${tag}.png`, clip });
  console.log('closeup', tag, 'flatten', flattenVal);
}
await capture('off', 0);
await capture('on', 1);
console.log('errors:', errs.filter((e) => !/Supabase|RPC|v5|fetch/i.test(e)).slice(0, 3));
await b.close();
