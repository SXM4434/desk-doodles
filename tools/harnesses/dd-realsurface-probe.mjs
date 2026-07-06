// GROUND-TRUTH probe (2026-06-24): the big-daddy harness drove /canvas (TEST
// surface). This drives the REAL /desk → "Add doodle" → DrawPanel → Upload SVG
// flow and checks whether the rough modifier controls (wobble/jaggedness/fillStyle)
// (a) MOUNT and (b) actually change the render on an uploaded SVG — to confirm
// whether the "/canvas svg-upload = 16 inert" finding was a test-surface artifact.
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SVG = '/tmp/bigdaddy/pokeball/svg-upload/_source.svg';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: CHROME, headless: false, args: ['--window-size=1500,1000'], defaultViewport: { width: 1500, height: 1000 } });
const p = await b.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 100)));
await p.goto('http://localhost:5182/desk', { waitUntil: 'networkidle2', timeout: 60000 });
await sleep(3500);
const clickText = (t) => p.evaluate((x) => { const el = [...document.querySelectorAll('button')].find((b) => (b.textContent || '').trim().toLowerCase() === x.toLowerCase()); if (el) { el.click(); return true; } return false; }, t);
const clickContains = (t) => p.evaluate((x) => { const el = [...document.querySelectorAll('button')].find((b) => (b.textContent || '').toLowerCase().includes(x.toLowerCase())); if (el) { el.click(); return true; } return false; }, t);

const log = {};
log.addDoodle = await clickText('Add doodle');
await sleep(1200);
// DrawPanel open? look for the "Upload SVG" input-mode pill
log.drawPanelOpen = await p.evaluate(() => [...document.querySelectorAll('button')].some((b) => /upload svg/i.test(b.textContent || '')));
log.uploadSvgClick = await clickContains('Upload SVG');
await sleep(700);
const fi = await p.$('input[type="file"]');
if (fi) { await fi.uploadFile(SVG); log.fileSet = true; } else { log.fileSet = false; }
await sleep(2000);
// switch to Rough hand-drawn style so the stroke modifiers mount (the two-tier baseline)
const dropOpen = await p.evaluate(() => { const t = [...document.querySelectorAll('*')].find((e) => /clean|rough|sketch|svg style/i.test(e.textContent || '') && e.getAttribute && (e.className || '').toString().includes('dropdown')); return !!t; });
// dump ALL control labels present in the draw popup (sliders + dropdowns + section labels)
const dumpControls = () => p.evaluate(() => {
  const txt = [...document.querySelectorAll('label, [class*=slider], [class*=Slider], [class*=dropdown], [role=option], button')]
    .map((e) => (e.textContent || '').trim()).filter(Boolean);
  const wants = ['wobble', 'jagged', 'pen tip', 'multi', 'fill style', 'hachure', 'fill density', 'fill opacity', 'ink', 'simplify', 'bowing', 'stroke width', 'curve', 'sketching', 'endpoint'];
  const found = {};
  for (const w of wants) found[w] = txt.some((t) => t.toLowerCase().includes(w));
  return { found, sampleLabels: [...new Set(txt)].filter((t) => t.length < 22).slice(0, 60) };
});
log.controlsAtUploadDefault = await dumpControls();
// try to select Rough hand-drawn (open any style dropdown trigger then pick rough)
await p.evaluate(() => { const tr = [...document.querySelectorAll('[class*=dropdown], button')].find((e) => /clean|svg style|style/i.test(e.textContent || '')); if (tr) tr.click(); });
await sleep(400);
await p.evaluate(() => { const o = [...document.querySelectorAll('[role=option], li, button')].find((e) => /rough/i.test(e.textContent || '')); if (o) o.click(); });
await sleep(1200);
log.controlsAfterRough = await dumpControls();
await p.screenshot({ path: '/tmp/dd-realsurface.png' });
writeFileSync('/tmp/dd-realsurface-probe.json', JSON.stringify(log, null, 2));
console.log(JSON.stringify(log, null, 2));
console.log('errors:', errs.slice(0, 3));
await b.close();
