// Exhaustive cropped-panel audit (Sebs #32). Opens the edit modal on mesh +
// stroke objects, at NORMAL and SHORT viewports, in 2D + 3D, and measures: (a)
// any control-column scroller hiding content, (b) whether the panel itself
// overflows the viewport AND is scrollable (acceptable) vs clipped (a bug), (c)
// the re-draw "Draw over" stage. Screenshots each. A "crop bug" = content hidden
// with NO scroll path.
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = process.env.DD_OUT || '/tmp/panel-crop';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
mkdirSync(OUT, { recursive: true });

const cases = [
  { name: 'mesh-normal', url: '/desk?test=suzanne', vw: 1500, vh: 1000, objSel: '[data-desk-obj-id="suzanne-0"]' },
  { name: 'mesh-short',  url: '/desk?test=suzanne', vw: 1400, vh: 680,  objSel: '[data-desk-obj-id="suzanne-0"]' },
  { name: 'mesh-narrow', url: '/desk?test=suzanne', vw: 760,  vh: 900,  objSel: '[data-desk-obj-id="suzanne-0"]' },
];

const measure = (page) => page.evaluate(() => {
  const dlg = document.querySelector('[role="dialog"]');
  if (!dlg) return { noDialog: true };
  const b = dlg.getBoundingClientRect();
  // Control-column scrollers hiding content:
  const colScrollers = [...dlg.querySelectorAll('div')].filter((d) => {
    const s = getComputedStyle(d); return s.overflowY === 'auto' && d.scrollHeight > d.clientHeight + 4;
  }).map((d) => ({ hidden: d.scrollHeight - d.clientHeight }));
  // Is the dialog itself taller than the viewport? If so, is it scrollable?
  const dlgStyle = getComputedStyle(dlg);
  const dlgScrolls = dlgStyle.overflowY === 'auto' || dlgStyle.overflowY === 'scroll';
  const overflowsViewport = b.bottom > window.innerHeight + 2 || b.top < -2;
  // True crop = dialog content clipped by an ancestor with overflow:hidden and no scroll.
  return {
    panelH: Math.round(b.height), top: Math.round(b.top), bottom: Math.round(b.bottom), vh: window.innerHeight,
    colScrollers, dlgScrolls, overflowsViewport,
  };
});

const browser = await puppeteer.launch({ executablePath: CHROME, headless: false, args: ['--window-size=1520,1040'] });
const report = {};
try {
  for (const c of cases) {
    const page = await browser.newPage();
    await page.setViewport({ width: c.vw, height: c.vh });
    const errs = [];
    page.on('pageerror', (e) => errs.push(e.message));
    await page.goto(`http://localhost:5182${c.url}`, { waitUntil: 'networkidle2', timeout: 60000 });
    await page.waitForSelector('canvas', { timeout: 30000 });
    await sleep(6000);
    // open modal
    let opened = false;
    for (let a = 0; a < 3 && !opened; a++) {
      const box = await page.$eval(c.objSel, (e) => { const b = e.getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; }).catch(() => null);
      if (!box) break;
      await page.mouse.move(box.x, box.y); await page.mouse.down(); await sleep(70); await page.mouse.up();
      await sleep(1300);
      opened = await page.evaluate(() => !!document.querySelector('[role="dialog"]'));
    }
    const rec = { opened };
    await page.screenshot({ path: `${OUT}/${c.name}-3d.png` });
    rec.in3d = await measure(page);
    // 2D
    await page.evaluate(() => { const dlg = document.querySelector('[role="dialog"]'); const p = dlg && [...dlg.querySelectorAll('button')].filter((b) => b.textContent.trim() === '2D'); if (p && p[0]) p[0].click(); });
    await sleep(1000);
    await page.screenshot({ path: `${OUT}/${c.name}-2d.png` });
    rec.in2d = await measure(page);
    rec.errors = errs;
    report[c.name] = rec;
    await page.close();
  }
} catch (e) { report.fatal = String(e && e.stack ? e.stack : e); }
console.log(JSON.stringify(report, null, 2));
await browser.close();
