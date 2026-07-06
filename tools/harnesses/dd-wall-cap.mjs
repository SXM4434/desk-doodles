import puppeteer from '/Users/sebs/Desktop/Projects/desk-doodles/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const URL = 'http://localhost:5182/desk?demo=1';

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--window-size=1600,1000'],
  defaultViewport: { width: 1600, height: 1000 },
});
const page = await browser.newPage();
const errs = [];
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
page.on('pageerror', (e) => errs.push('PAGEERR ' + e.message));
await page.goto(URL, { waitUntil: 'networkidle2', timeout: 30000 });
// give the demo seed (async offscreen renders) time to land + camera frame
await new Promise((r) => setTimeout(r, 3500));

const stats = await page.evaluate(() => {
  const cards = document.querySelectorAll('[data-object-card], [data-desk-object], svg');
  return {
    svgCount: document.querySelectorAll('svg').length,
    bodyText: (document.body.innerText || '').slice(0, 200),
  };
});
await page.screenshot({ path: '/tmp/dd-shots/wall-demo.png' });
console.log('svgCount', stats.svgCount);
console.log('bodyText:', JSON.stringify(stats.bodyText));
console.log('errors:', errs.slice(0, 8));
await browser.close();
