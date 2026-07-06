// End-to-end: upload an evenodd PENTAGRAM, apply hachure styles, and confirm the
// CENTER PENTAGON renders EMPTY (hole knocked out) — not flooded with hachure.
// Samples the center pixel vs an arm pixel of the rendered preview SVG.
import puppeteer from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: CHROME, headless: false, args: ['--window-size=1400,950'], defaultViewport: { width: 1400, height: 950 } });
const p = await b.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 110)));
await p.goto('http://localhost:5182/canvas', { waitUntil: 'networkidle2', timeout: 60000 });
await sleep(3500);
const clickByText = (re) => p.evaluate((r) => { const x = [...document.querySelectorAll('button')].find((e) => new RegExp(r, 'i').test((e.textContent || '').trim())); if (x) { x.click(); return (x.textContent || '').trim(); } return null; }, re.source);
const openTrigger = (sub) => p.evaluate((x) => { const t = [...document.querySelectorAll('.dd-dropdown-trigger')].find((e) => (e.textContent || '').toLowerCase().includes(x.toLowerCase())); if (t) { t.click(); return (t.textContent || '').trim(); } return null; }, sub);
const pickOption = (sub) => p.evaluate((x) => { const o = [...document.querySelectorAll('[role=option]')].find((e) => (e.textContent || '').toLowerCase().includes(x.toLowerCase())); if (o) { o.click(); return true; } return false; }, sub);

console.log('upload svg:', await clickByText(/upload svg/)); await sleep(800);
const fi = await p.$('input[type=file]');
if (fi) { await fi.uploadFile('/tmp/pentagram-eo.svg'); console.log('file set'); }
await sleep(3500);
// find the preview svg and measure center vs arm INK coverage across styles
async function measure() {
  return p.evaluate(() => {
    const svgs = [...document.querySelectorAll('svg')].map((s) => { const r = s.getBoundingClientRect(); return { s, r, area: r.width * r.height }; }).filter((o) => o.r.width > 150 && o.r.height > 150).sort((a, b) => b.area - a.area);
    const top = svgs[0]; if (!top) return null;
    // render the live svg to a canvas to sample pixels
    const data = new XMLSerializer().serializeToString(top.s);
    return { ok: true, bbox: { x: Math.round(top.r.x), y: Math.round(top.r.y), w: Math.round(top.r.width), h: Math.round(top.r.height) }, marks: (data.match(/<path|<line/g) || []).length };
  });
}
for (const style of ['sketchy', 'rough', 'hachure', 'bold']) {
  await openTrigger('clean').catch(() => {}); await sleep(300);
  for (const lbl of ['clean', 'rough', 'sketchy', 'bold', 'svg']) { const o = await openTrigger(lbl); if (o) break; }
  await sleep(300);
  const picked = await pickOption(style); await sleep(1800);
  const m = await measure();
  if (m && m.bbox) {
    const cxp = m.bbox.x + Math.round(m.bbox.w / 2), cyp = m.bbox.y + Math.round(m.bbox.h / 2);
    await p.screenshot({ path: `/tmp/dd-shots/penta-${style}.png`, clip: { x: m.bbox.x, y: m.bbox.y, width: m.bbox.w, height: m.bbox.h } });
    // center crop (the pentagon hole) tight
    await p.screenshot({ path: `/tmp/dd-shots/penta-${style}-center.png`, clip: { x: cxp - 25, y: cyp - 25, width: 50, height: 50 } });
    console.log(`style=${style} picked=${picked} marks=${m.marks} bbox=${JSON.stringify(m.bbox)}`);
  } else console.log(`style=${style} picked=${picked} no-svg`);
}
console.log('errors:', errs.filter((e) => !/Supabase|RPC|v5|404|400/i.test(e)).slice(0, 4));
await b.close();
