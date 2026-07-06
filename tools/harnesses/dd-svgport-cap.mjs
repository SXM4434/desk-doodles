import puppeteer from '/Users/sebs/Desktop/Projects/desk-doodles/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await puppeteer.launch({
  executablePath: CHROME, headless: false,
  args: ['--no-sandbox', '--window-size=1400,950', '--window-position=2400,2400'],
  defaultViewport: { width: 1400, height: 950 },
});
const page = await browser.newPage();
const errs = [];
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0,140)); });
page.on('pageerror', (e) => errs.push('PAGEERR ' + e.message.slice(0,140)));
const log = (...a) => console.log(...a);

await page.goto('http://localhost:5182/canvas', { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise(r => setTimeout(r, 2500));

const clickText = (re) => page.evaluate((src) => {
  const rx = new RegExp(src, 'i');
  const el = [...document.querySelectorAll('button,[role="button"]')].find(b => rx.test((b.textContent||'').trim()) && b.offsetParent !== null);
  if (el) { el.click(); return (el.textContent||'').trim().slice(0,30); }
  return null;
}, re.source);

// draw a closed circle
const box = await page.evaluate(() => {
  const s=[...document.querySelectorAll('svg')].map(x=>{const r=x.getBoundingClientRect();return{r,a:r.width*r.height};}).filter(o=>o.a>60000).sort((a,b)=>b.a-a.a)[0];
  return s ? {x:s.r.x,y:s.r.y,w:s.r.width,h:s.r.height} : null;
});
if (box){const cx=box.x+box.w/2,cy=box.y+box.h/2;await page.mouse.move(cx+70,cy);await page.mouse.down();for(let a=0;a<=360;a+=12){const r=a*Math.PI/180;await page.mouse.move(cx+70*Math.cos(r),cy+70*Math.sin(r));await new Promise(z=>setTimeout(z,7));}await page.mouse.up();await new Promise(r=>setTimeout(r,400));}
// shade a dark patch
log('Shade ->', await clickText(/^shade$/)); await new Promise(r=>setTimeout(r,300));
if (box){const cx=box.x+box.w/2,cy=box.y+box.h/2;await page.mouse.move(cx-15,cy-15);await page.mouse.down();for(let i=0;i<16;i++){await page.mouse.move(cx-15+i*2.5,cy-15+Math.sin(i)*6);await new Promise(z=>setTimeout(z,9));}await page.mouse.up();await new Promise(r=>setTimeout(r,400));}
// flip to 3D
log('3D ->', await clickText(/^3d$/)); await new Promise(r=>setTimeout(r,1200));

// open the 3D STYLE dropdown (trigger currently shows "Native") then pick SVG-port
const opened = await page.evaluate(() => {
  const trig = [...document.querySelectorAll('button[aria-haspopup="listbox"]')]
    .find(b => /native/i.test(b.textContent||''));
  if (trig){ trig.click(); return true; } return false;
});
log('opened 3D-style dropdown:', opened);
await new Promise(r=>setTimeout(r,500));
const picked = await page.evaluate(() => {
  const opt = [...document.querySelectorAll('[role="option"]')].find(o => /svg.?port/i.test(o.textContent||''));
  if (opt){ opt.click(); return (opt.textContent||'').trim().slice(0,40); } return null;
});
log('picked svg-port option:', picked);
await new Promise(r=>setTimeout(r,3500));

// PROBE the pipeline state
const probe = await page.evaluate(() => {
  // offscreen svg-port source div (aria-hidden absolute left:-99999)
  const offs = [...document.querySelectorAll('div[aria-hidden="true"]')].filter(d => d.querySelector('svg'));
  const offSvg = offs.map(d => (d.querySelector('svg')?.outerHTML||'').length);
  return {
    canvases: document.querySelectorAll('canvas').length,
    offscreenSvgLens: offSvg,
    bodyHas: /svg.?port/i.test(document.body.innerText) ? 'svgport-label-present' : 'no-label',
  };
});
log('probe:', JSON.stringify(probe));
await page.screenshot({ path: '/tmp/dd-shots/svgport-real.png' });
log('errors:', errs.slice(0,6));
await browser.close();
