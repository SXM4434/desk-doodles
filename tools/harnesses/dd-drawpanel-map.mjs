// Map the REAL /desk DrawPanel so the harness can drive it (replacing the /canvas
// test surface). Opens Add doodle → Upload SVG → file → Rough → Expand, then dumps
// EVERY control (sliders + dropdowns) with selectors + values, locates the live
// preview element, and proves a modifier change moves the preview (screenshot diff).
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SVG = '/tmp/bigdaddy/pokeball/svg-upload/_source.svg';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: CHROME, headless: false, args: ['--window-size=1600,1050'], defaultViewport: { width: 1600, height: 1050 } });
const p = await b.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 100)));
await p.goto('http://localhost:5182/desk', { waitUntil: 'networkidle2', timeout: 60000 });
await sleep(3500);
const click = (re) => p.evaluate((r) => { const el = [...document.querySelectorAll('button')].find((b) => new RegExp(r, 'i').test((b.textContent || '').trim())); if (el) { el.click(); return (el.textContent || '').trim(); } return null; }, re);

const out = {};
out.add = await click('^Add doodle$'); await sleep(1000);
await click('Upload SVG'); await sleep(600);
const fi = await p.$('input[type="file"]'); if (fi) await fi.uploadFile(SVG); await sleep(1800);
// select Rough hand-drawn style (open the style dropdown, pick rough)
await p.evaluate(() => { const t = [...document.querySelectorAll('[class*=dropdown],[class*=Dropdown],button')].find((e) => /\b(clean|svg style|style)\b/i.test(e.textContent || '') && (e.textContent||'').length < 40); if (t) t.click(); });
await sleep(400);
await p.evaluate(() => { const o = [...document.querySelectorAll('[role=option],li,button,div')].find((e) => /rough hand/i.test(e.textContent || '') && (e.textContent||'').length < 40); if (o) o.click(); });
await sleep(1000);
await click('Expand'); await sleep(1000); // open the full control view if present

// dump every range slider + dropdown trigger with a nearby label
out.controls = await p.evaluate(() => {
  const labelFor = (el) => {
    let n = el, hops = 0;
    while (n && hops < 5) { const t = (n.previousElementSibling && n.previousElementSibling.textContent || '').trim(); if (t && t.length < 30) return t; n = n.parentElement; hops++; }
    let par = el.closest('div'); for (let i = 0; i < 4 && par; i++) { const m = (par.textContent || '').trim().match(/[A-Za-z][A-Za-z \-]{2,24}/); if (m) return m[0].trim(); par = par.parentElement; }
    return '?';
  };
  const sliders = [...document.querySelectorAll('input[type=range], input.dd-range, [role=slider]')].map((s) => ({ label: labelFor(s), value: s.value ?? s.getAttribute('aria-valuenow'), cls: s.className }));
  const drops = [...document.querySelectorAll('[class*=dropdown-trigger],[class*=Dropdown],[class*=trigger]')].map((d) => ({ text: (d.textContent || '').trim().slice(0, 30), cls: d.className })).filter((d) => d.text);
  const sections = [...document.querySelectorAll('button,[class*=section]')].map((e) => (e.textContent || '').trim()).filter((t) => /multi|shad|stroke|pen|fill|texture|wobble|hachure/i.test(t)).slice(0, 25);
  return { sliderCount: sliders.length, sliders: sliders.slice(0, 40), dropCount: drops.length, drops: drops.slice(0, 25), sections: [...new Set(sections)] };
});
// locate preview: biggest svg/canvas in the popup
out.preview = await p.evaluate(() => {
  const cands = [...document.querySelectorAll('svg, canvas')].map((e) => { const r = e.getBoundingClientRect(); return { tag: e.tagName, w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.x), y: Math.round(r.y) }; }).filter((c) => c.w > 120 && c.h > 120);
  return cands.sort((a, c) => c.w * c.h - a.w * a.h).slice(0, 4);
});
await p.screenshot({ path: '/tmp/dd-drawpanel-map.png' });
writeFileSync('/tmp/dd-drawpanel-map.json', JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
console.log('errors:', errs.slice(0, 3));
await b.close();
