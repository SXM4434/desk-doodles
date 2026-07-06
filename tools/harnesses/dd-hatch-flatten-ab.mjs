// HATCH-BURIAL A/B (2026-06-23): same scene, walls-sharp deep CSG, two captures —
//   OFF  = window.__svgPortTextureFlatten = 0 (the bug: hatch buries as a recess)
//   ON   = default flatten (the fix: textured regions stay flat, hatch on normal map)
// Force a texture rebuild after each toggle by nudging the relief slider. The pixel
// diff between OFF and ON localizes EXACTLY where the flatten acts: hatch panels
// should change (rise out of the dark pit), solid dark regions (Game Boy screen)
// should stay IDENTICAL (= no regression). Also prints __csgDeepRegions for each.
import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';
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
// keep each object's own style (the demo wall already gives Game Boy rough-handdrawn etc.)
await setRelief(0.5); await sleep(2000);
// zoom to a readable level on the desk
await p.mouse.move(740, 470); await p.keyboard.down('Control');
for (let i = 0; i < 8; i++) { await p.mouse.wheel({ deltaY: -120 }); await sleep(55); }
await p.keyboard.up('Control'); await sleep(1200);
const clip = { x: 0, y: 360, width: 1200, height: 620 };

async function capture(tag, flattenVal) {
  await p.evaluate((v) => { window.__svgPortTextureFlatten = v; window.__csgApplied = 0; window.__csgDeepRegions = 0; }, flattenVal);
  // force texture rebuild by toggling relief (off→on) then re-applying Sharp walls
  await setRelief(0.0); await sleep(700);
  await setRelief(0.5); await sleep(2200);
  await clickPill('Sharp'); await sleep(7000); // manifold CSG across visible objects
  const probe = await p.evaluate(() => ({ manifold: !!window.__manifoldLoaded, deepRegions: window.__csgDeepRegions ?? 0, flatten: window.__svgPortTextureFlatten }));
  await p.screenshot({ path: `${OUT}/${tag}.png`, clip });
  console.log(`[${tag}] flatten=${probe.flatten} deepRegions=${probe.deepRegions} manifold=${probe.manifold}`);
  return probe;
}

const off = await capture('off-bug', 0);     // flatten disabled = the burial bug
const on = await capture('on-fix', 1);        // flatten enabled  = the fix

// pixel diff OFF vs ON: where the flatten changed the render
try {
  const aImg = sharp(`${OUT}/off-bug.png`).raw();
  const cImg = sharp(`${OUT}/on-fix.png`).raw();
  const [a, am] = await Promise.all([aImg.toBuffer({ resolveWithObject: true }).then((o) => o.data), aImg.metadata()]);
  const [c] = await Promise.all([cImg.toBuffer()]);
  const W = am.width, H = am.height, ch = am.channels;
  const out = Buffer.alloc(W * H * 4);
  let changed = 0; const total = W * H;
  for (let i = 0; i < total; i++) {
    const ia = i * ch, id = i * 4;
    const dr = Math.abs(a[ia] - c[ia]), dg = Math.abs(a[ia + 1] - c[ia + 1]), db = Math.abs(a[ia + 2] - c[ia + 2]);
    const d = (dr + dg + db) / 3;
    if (d > 14) { changed++; out[id] = 255; out[id + 1] = 0; out[id + 2] = 0; out[id + 3] = 255; }
    else { out[id] = a[ia]; out[id + 1] = a[ia + 1]; out[id + 2] = a[ia + 2]; out[id + 3] = 70; }
  }
  await sharp(out, { raw: { width: W, height: H, channels: 4 } }).png().toFile(`${OUT}/diff.png`);
  console.log(`DIFF: ${changed}/${total} px changed (${(100 * changed / total).toFixed(2)}%) → /tmp/dd-hatch-ab/diff.png`);
} catch (e) { console.log('diff failed:', e.message); }
console.log('deepRegions OFF→ON:', off.deepRegions, '→', on.deepRegions, '| errors:', errs.filter((e) => !/Supabase|RPC|v5|fetch/i.test(e)).slice(0, 3));
await b.close();
