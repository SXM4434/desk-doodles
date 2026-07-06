// RELIEF M-vs-H at FULL-res close-up (signal B from OFAT batch-1: "relief-H reads
// FLATTER than relief-M"). Both depth paths are provably monotonic in code, so this
// renders M(0.3) vs H(0.55) zoomed-in at BOTH wall modes (Smooth=CPU displacement,
// Sharp=CSG) to test whether H is genuinely flatter or it was a thumbnail artifact.
// Prints a luminance-stddev proxy for "how much carved relief" per capture (more
// carve = more light/shadow variance = higher stddev).
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';
import sharp from 'sharp';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = '/tmp/dd-relief-mh';
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
await setRelief(0.3); await sleep(1200);
// hard zoom on the desk; clip a single solid object band where recess depth reads
await p.mouse.move(700, 470); await p.keyboard.down('Control');
for (let i = 0; i < 10; i++) { await p.mouse.wheel({ deltaY: -120 }); await sleep(55); }
await p.keyboard.up('Control'); await sleep(1200);
const clip = { x: 150, y: 330, width: 950, height: 600 };

async function stddev(file) {
  const { data, info } = await sharp(file).greyscale().raw().toBuffer({ resolveWithObject: true });
  let sum = 0; for (let i = 0; i < data.length; i++) sum += data[i];
  const mean = sum / data.length;
  let v = 0; for (let i = 0; i < data.length; i++) { const d = data[i] - mean; v += d * d; }
  return Math.sqrt(v / data.length);
}
async function cap(tag, wall, depth) {
  await clickPill(wall); await sleep(wall === 'Sharp' ? 6500 : 2500);
  await setRelief(depth); await sleep(wall === 'Sharp' ? 6500 : 2800);
  const f = `${OUT}/${tag}.png`;
  await p.screenshot({ path: f, clip });
  const sd = await stddev(f);
  console.log(`${tag.padEnd(14)} wall=${wall.padEnd(6)} depth=${depth}  stddev=${sd.toFixed(2)}`);
  return sd;
}
// Smooth (CPU displacement) M vs H
const sm = await cap('smooth-M', 'Smooth', 0.3);
const sh = await cap('smooth-H', 'Smooth', 0.55);
// Sharp (CSG) M vs H
const cm = await cap('sharp-M', 'Sharp', 0.3);
const ch = await cap('sharp-H', 'Sharp', 0.55);
console.log('--- monotonic if H >= M ---');
console.log(`Smooth: M=${sm.toFixed(2)} H=${sh.toFixed(2)}  ${sh >= sm ? 'OK (H deeper/equal)' : 'INVERTED (H flatter!)'}`);
console.log(`Sharp:  M=${cm.toFixed(2)} H=${ch.toFixed(2)}  ${ch >= cm ? 'OK (H deeper/equal)' : 'INVERTED (H flatter!)'}`);
console.log('errors:', errs.filter((e) => !/Supabase|RPC|v5|fetch/i.test(e)).slice(0, 3));
await b.close();
