// Build a RELIABLE real-/desk-DrawPanel driver, verified step-by-step with a
// screenshot per step. Goal: upload SVG → switch to Rough → expand the collapsed
// modifier sections → confirm a modifier (e.g. wobble) is reachable AND moves the
// render. This replaces the /canvas test-surface path.
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SVG = '/tmp/bigdaddy/pokeball/svg-upload/_source.svg';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: CHROME, headless: false, args: ['--window-size=1600,1050'], defaultViewport: { width: 1600, height: 1050 } });
const p = await b.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 100)));
const log = {};
const shot = (n) => p.screenshot({ path: `/tmp/dd-dp-${n}.png` });

await p.goto('http://localhost:5182/desk', { waitUntil: 'networkidle2', timeout: 60000 });
await sleep(3500);
// 1) Add doodle → DrawPanel
log.add = await p.evaluate(() => { const el = [...document.querySelectorAll('button')].find((b) => (b.textContent || '').trim() === 'Add doodle'); if (el) { el.click(); return true; } return false; });
await sleep(1200); await shot('1-add');
// 2) Upload SVG mode + set file
log.uploadMode = await p.evaluate(() => { const el = [...document.querySelectorAll('button')].find((b) => /^upload svg$/i.test((b.textContent || '').trim())); if (el) { el.click(); return true; } return false; });
await sleep(600);
const fi = await p.$('input[type="file"]'); log.fileSet = !!fi; if (fi) await fi.uploadFile(SVG);
await sleep(1800); await shot('2-uploaded');
// 3) open the SVG STYLE dropdown (trigger currently reads 'Clean') and pick Rough
log.styleTriggerText = await p.evaluate(() => { const t = [...document.querySelectorAll('.dd-dropdown-trigger')].find((e) => /\bclean\b/i.test((e.textContent || '').trim())); if (t) { t.click(); return (t.textContent || '').trim(); } return null; });
await sleep(500); await shot('3-styleopen');
log.pickedRough = await p.evaluate(() => {
  // options carry a title + description; match the LEAF whose first text line is the title.
  const cands = [...document.querySelectorAll('[role=option],[class*=option],li,button,div')]
    .filter((e) => /^rough hand-?drawn/i.test((e.textContent || '').trim()));
  // pick the deepest (fewest descendant elements) so we click the option, not a wrapper
  cands.sort((a, b) => a.querySelectorAll('*').length - b.querySelectorAll('*').length);
  const o = cands[0];
  if (o) { o.click(); return (o.textContent || '').trim().slice(0, 40); }
  return null;
});
await sleep(1400); await shot('4-rough');
// 4) expand every collapsed section (aria-expanded=false headers)
log.expanded = await p.evaluate(() => { let n = 0; for (const h of [...document.querySelectorAll('[aria-expanded="false"]')]) { h.click(); n++; } return n; });
await sleep(900); await shot('5-expanded');
// 5) dump reachable sliders + dropdowns now
log.controls = await p.evaluate(() => {
  const sliders = [...document.querySelectorAll('input.dd-range, input[type=range]')].map((s) => { let lbl = '?'; let par = s.closest('div'); for (let i = 0; i < 5 && par; i++) { const m = (par.textContent || '').match(/[A-Z][a-z]+(?:[ -][A-Za-z]+){0,2}/); if (m) { lbl = m[0]; break; } par = par.parentElement; } return { label: lbl, value: s.value }; });
  const drops = [...document.querySelectorAll('.dd-dropdown-trigger')].map((d) => (d.textContent || '').trim().slice(0, 24));
  return { sliderCount: sliders.length, sliders, drops };
});
// 6) PROVE a modifier moves the render: find a 'wobble'-ish slider, screenshot, bump it, screenshot, diff
log.wobbleTest = await p.evaluate(() => {
  const find = (re) => [...document.querySelectorAll('input.dd-range')].find((s) => { let par = s.closest('div'); for (let i = 0; i < 5 && par; i++) { if (new RegExp(re, 'i').test(par.textContent || '')) return true; par = par.parentElement; } return false; });
  const s = find('wobble') || find('jagged') || find('hachure');
  if (!s) return 'no-modifier-slider-found';
  const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  set.call(s, s.max || '1'); s.dispatchEvent(new Event('input', { bubbles: true })); s.dispatchEvent(new Event('change', { bubbles: true }));
  return 'set ' + (s.getAttribute('aria-label') || 'modifier') + ' to ' + s.value;
});
await sleep(1200); await shot('6-modifier-bumped');
writeFileSync('/tmp/dd-dp-drive.json', JSON.stringify(log, null, 2));
console.log(JSON.stringify(log, null, 2));
console.log('errors:', errs.slice(0, 3));
await b.close();
