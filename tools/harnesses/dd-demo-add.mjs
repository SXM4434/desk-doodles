import puppeteer from '/Users/sebs/Desktop/Projects/desk-doodles/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--no-sandbox', '--window-size=1500,950'],
  defaultViewport: { width: 1500, height: 950 },
});
const page = await browser.newPage();
const errs = [];
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
page.on('pageerror', (e) => errs.push('PAGEERR ' + e.message));

const clickByText = async (re) => page.evaluate((src) => {
  const rx = new RegExp(src, 'i');
  const el = [...document.querySelectorAll('button,a')].find((b) => rx.test((b.innerText||'').trim()));
  if (el) { el.click(); return (el.innerText||'').trim(); }
  return null;
}, re.source);

await page.goto('http://localhost:5182/desk?demo=1', { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise((r) => setTimeout(r, 3500));
const before = await page.evaluate(() => ({ url: location.href, n: (document.body.innerText.match(/Shared desk\s*\n\s*(\d+)/)||[])[1] }));
console.log('BEFORE', before);

console.log('ADD DOODLE ->', await clickByText(/add doodle/));
await new Promise((r) => setTimeout(r, 900));

// Draw a stroke on the largest svg inside the dialog (the DrawSurface capture surface).
const box = await page.evaluate(() => {
  const dlg = document.querySelector('[role="dialog"]') || document.body;
  const svgs = [...dlg.querySelectorAll('svg')].map((s) => { const r = s.getBoundingClientRect(); return { r, a: r.width*r.height }; }).filter(o=>o.a>40000);
  svgs.sort((a,b)=>b.a-a.a);
  if (!svgs[0]) return null;
  const r = svgs[0].r; return { x: r.x, y: r.y, w: r.width, h: r.height };
});
console.log('draw box', box);
if (box) {
  const cx = box.x + box.w/2, cy = box.y + box.h/2;
  await page.mouse.move(cx-60, cy-40); await page.mouse.down();
  for (let i=0;i<=12;i++){ await page.mouse.move(cx-60 + i*10, cy-40 + Math.sin(i/2)*30); await new Promise(r=>setTimeout(r,12)); }
  await page.mouse.up();
  await new Promise((r) => setTimeout(r, 500));
}
console.log('DONE ->', await clickByText(/^done$/));
await new Promise((r) => setTimeout(r, 900));
console.log('PLACE ->', await clickByText(/place on desk|place$/));
await new Promise((r) => setTimeout(r, 2500));

const after = await page.evaluate(() => ({ url: location.href, n: (document.body.innerText.match(/Shared desk\s*\n\s*(\d+)/)||[])[1], head: document.body.innerText.slice(0,80) }));
console.log('AFTER', after);
await page.screenshot({ path: '/tmp/dd-shots/demo-add-after.png' });
console.log('errors', errs.slice(0,6));
await browser.close();
