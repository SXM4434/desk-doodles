// OFAT-3D render: the demo desk in svg-port 3D, Clean baseline + each one-factor
// cell (style sweep, relief depth L/M/H, walls smooth/sharp), at a readable zoom so
// a vision pass can judge per-object fidelity vs Clean. Saves a manifest of cells.
import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync } from 'node:fs';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = '/tmp/dd-ofat3d';
mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: CHROME, headless: false, args: ['--window-size=1500,1000'], defaultViewport: { width: 1500, height: 1000 } });
const p = await b.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 100)));
await p.goto('http://localhost:5182/desk?demo=1', { waitUntil: 'networkidle2', timeout: 60000 });
await sleep(4500);
const clickText = async (t) => { const h = await p.evaluateHandle((x) => [...document.querySelectorAll('button')].find((b) => (b.textContent || '').trim().toLowerCase() === x.toLowerCase()) || null, t); const el = h.asElement(); if (el) { await el.click(); return true; } return false; };
const openTrigger = (s) => p.evaluate((x) => { const t = [...document.querySelectorAll('.dd-dropdown-trigger')].find((e) => (e.textContent || '').toLowerCase().includes(x.toLowerCase())); if (t) { t.click(); return (t.textContent || '').trim(); } return null; }, s);
const pickOption = (s) => p.evaluate((x) => { const o = [...document.querySelectorAll('[role=option]')].find((e) => (e.textContent || '').toLowerCase().includes(x.toLowerCase())); if (o) { o.click(); return true; } return false; }, s);
const clickPill = (label) => p.evaluate((x) => { const btn = [...document.querySelectorAll('button')].find((b) => (b.textContent || '').trim() === x); if (btn) { btn.click(); return true; } return false; }, label);
const readStyleVal = () => p.evaluate(() => { const t = [...document.querySelectorAll('.dd-dropdown-trigger')].find((e) => /clean|rough|bold|sketch|stipple|news|outline|wire|charcoal|wet|riso/i.test(e.textContent || '')); return t ? (t.textContent || '').trim().toLowerCase() : null; });
// VERIFY-AND-RETRY: the old setStyle silently failed for bold (rendered byte-
// identical to Clean) — read the dropdown back after picking + retry up to 3x.
const setStyle = async (s) => {
  for (let attempt = 0; attempt < 3; attempt++) {
    for (const lbl of ['clean', 'rough', 'bold', 'stipple', 'sketch', 'wire', 'charcoal', 'news', 'outline']) { const o = await openTrigger(lbl); if (o && !/native|svg-port|matte|auto/i.test(o)) break; }
    await sleep(350); await pickOption(s); await sleep(2600);
    const cur = await readStyleVal();
    if (cur && cur.includes(s.toLowerCase())) return cur; // confirmed applied
    await sleep(400);
  }
  console.log('!! setStyle FAILED to confirm:', s);
  return null;
};
const setReliefDepth = (v) => p.evaluate((val) => { const inputs = [...document.querySelectorAll('input.dd-range')]; const t = inputs.find((inp) => { let n = inp.closest('div'); for (let i = 0; i < 4 && n; i++) { if (/relief depth/i.test(n.textContent || '')) return true; n = n.parentElement; } return false; }); if (t) { const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; set.call(t, String(val)); t.dispatchEvent(new Event('input', { bubbles: true })); } }, v);

await clickText('Desk'); await sleep(600);
await clickText('3D'); await sleep(1800);
await openTrigger('native'); await sleep(400); await pickOption('svg-port'); await sleep(2500);
// zoom to a readable level on the desk center
await p.mouse.move(740, 470); await p.keyboard.down('Control');
for (let i = 0; i < 9; i++) { await p.mouse.wheel({ deltaY: -120 }); await sleep(55); }
await p.keyboard.up('Control'); await sleep(1200);
const clip = { x: 0, y: 380, width: 1130, height: 600 };

const cells = [];
async function shot(id, factor, value) { await p.screenshot({ path: `${OUT}/${id}.png`, clip }); cells.push({ id, factor, value, file: `${OUT}/${id}.png` }); console.log('cell', id); }

// Clean baseline (svg-port, Clean style, default relief)
await setStyle('clean'); await setReliefDepth(0.25); await sleep(1500);
await shot('clean', 'baseline', 'clean');
// STYLE sweep (one factor: SVG style)
for (const s of ['rough', 'bold', 'sketch', 'stipple', 'news']) { await setStyle(s); await shot(`style-${s}`, 'svgStyle', s); }
// relief depth L/M/H (hold Clean)
await setStyle('clean'); await sleep(1200);
for (const [lvl, v] of [['L', 0.1], ['M', 0.3], ['H', 0.55]]) { await setReliefDepth(v); await sleep(2200); await shot(`relief-${lvl}`, 'reliefDepth', `${lvl}:${v}`); }
// walls smooth vs sharp (at relief 0.45)
await setReliefDepth(0.45); await sleep(2000);
await clickPill('Smooth'); await sleep(2500); await shot('walls-smooth', 'walls', 'smooth');
await clickPill('Sharp'); await sleep(6500); await shot('walls-sharp', 'walls', 'sharp');

writeFileSync(`${OUT}/cells.json`, JSON.stringify({ stage: '3d-svgport-desk', clean: 'clean', cells }, null, 2));
console.log('CELLS:', cells.length, '| errors:', errs.filter((e) => !/Supabase|RPC|v5|fetch/i.test(e)).slice(0, 3));
await b.close();
