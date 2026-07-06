import puppeteer from '/Users/sebs/Desktop/Projects/desk-doodles/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--window-size=1400,950'],
  defaultViewport: { width: 1400, height: 950 },
});
const page = await browser.newPage();
const errs = [];
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
page.on('pageerror', (e) => errs.push('PAGEERR ' + e.message));

await page.goto('http://localhost:5182/desks', { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise((r) => setTimeout(r, 3000));
await page.screenshot({ path: '/tmp/dd-shots/gallery-demo.png' });
const galleryText = await page.evaluate(() => (document.body.innerText || '').slice(0, 220));
console.log('GALLERY text:', JSON.stringify(galleryText));

// Click the demo card → should land on /desk?demo=1
const clicked = await page.evaluate(() => {
  const btns = [...document.querySelectorAll('button')];
  const card = btns.find((b) => /Showcase Wall/i.test(b.innerText || ''));
  if (card) { card.click(); return true; }
  return false;
});
console.log('clicked demo card:', clicked);
await new Promise((r) => setTimeout(r, 3500));
console.log('URL after click:', page.url());
const deskText = await page.evaluate(() => (document.body.innerText || '').slice(0, 120));
console.log('DESK text:', JSON.stringify(deskText));
await page.screenshot({ path: '/tmp/dd-shots/gallery-to-desk.png' });
console.log('errors:', errs.slice(0, 6));
await browser.close();
