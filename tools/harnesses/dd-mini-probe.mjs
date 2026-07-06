// Probe: in 3D, is the 2D layer (the suspected "mini behind each object") actually
// hidden? Dump each object box's children + computed opacity/display/size.
import puppeteer from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: CHROME, headless: false, args: ['--window-size=1500,1000'], defaultViewport: { width: 1500, height: 1000 } });
const p = await b.newPage();
await p.goto('http://localhost:5182/desk?demo=1', { waitUntil: 'networkidle2', timeout: 60000 });
await sleep(4500);
async function clickText(t) { const h = await p.evaluateHandle((x) => [...document.querySelectorAll('button')].find((b) => (b.textContent || '').trim().toLowerCase() === x.toLowerCase()) || null, t); const el = h.asElement(); if (el) { await el.click(); return true; } return false; }
await clickText('Desk'); await sleep(600);
await clickText('3D'); await sleep(2200);

const probe = await p.evaluate(() => {
  // The 3D object box is a 180x180 position:relative div containing a 2D layer
  // (opacity 0/1) + a 3D slot (display block/none). Find candidates by structure.
  const boxes = [...document.querySelectorAll('div')].filter((d) => {
    const s = d.style;
    return s.width === '180px' && s.height === '180px' && s.position === 'relative';
  });
  const report = boxes.slice(0, 4).map((box) => {
    const kids = [...box.children].map((c) => {
      const cs = getComputedStyle(c);
      const r = c.getBoundingClientRect();
      return { op: cs.opacity, disp: cs.display, vis: cs.visibility, w: Math.round(r.width), h: Math.round(r.height), hasCanvas: !!c.querySelector('canvas'), hasSvg: !!c.querySelector('svg'), nSvg: c.querySelectorAll('svg').length };
    });
    return kids;
  });
  return { count: boxes.length, report };
});
console.log('object boxes found:', probe.count);
console.log(JSON.stringify(probe.report, null, 1));
await b.close();
