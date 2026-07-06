// Headed-Chrome capture of the 2D→3D desk flip to SEE the flash. Run:
//   node /Users/sebs/Desktop/Projects/desk-doodles/dd-flip-capture.mjs
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';

const OUT = '/tmp/dd-flip';
mkdirSync(OUT, { recursive: true });
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: false,
  args: ['--window-size=1500,950'],
  defaultViewport: { width: 1500, height: 950 },
});
const page = await browser.newPage();
page.on('pageerror', (e) => console.log('PAGEERROR:', e.message));
page.on('console', (m) => { const t = m.text(); if (/error|warn|3d|webgl|context/i.test(t)) console.log('console:', t.slice(0, 140)); });

await page.goto('http://localhost:5182/desk?demo=1&n=20', { waitUntil: 'networkidle2', timeout: 60000 });
await new Promise((r) => setTimeout(r, 3500)); // 2D render settle
await page.screenshot({ path: `${OUT}/00-2d-before.png` });
console.log('captured 2D-before');

// ensure DESK lens (the whole-desk flip only works in DESK mode). Button text is "Desk".
const deskOn = await page.evaluate(() => {
  const desk = [...document.querySelectorAll('button[role=tab]')].find((b) => b.textContent.trim().toLowerCase() === 'desk');
  if (!desk) return 'no-desk-button';
  if (desk.getAttribute('aria-selected') !== 'true') desk.click();
  return desk.getAttribute('aria-selected');
});
console.log('DESK lens:', deskOn);
await new Promise((r) => setTimeout(r, 400));

// zoom IN a few clicks so objects spread to/past the edges (where popping shows)
for (let i = 0; i < 5; i++) {
  await page.evaluate(() => {
    const plus = [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === '+');
    if (plus) plus.click();
  });
  await new Promise((r) => setTimeout(r, 130));
}
await new Promise((r) => setTimeout(r, 700));
await page.screenshot({ path: `${OUT}/01-2d-zoomed.png` });
console.log('captured 2D-zoomed (edge objects present)');

// click the 3D tab
const clicked = await page.evaluate(() => {
  const tab = [...document.querySelectorAll('button[role=tab]')].find((b) => b.textContent.trim() === '3D');
  if (tab) { tab.click(); return true; }
  return false;
});
console.log('clicked 3D tab:', clicked);

// burst-capture the transition
const stamps = [0, 120, 250, 400, 600, 850, 1150, 1600, 2200, 3000];
let last = 0;
for (const t of stamps) {
  await new Promise((r) => setTimeout(r, t - last));
  last = t;
  await page.screenshot({ path: `${OUT}/flip-${String(t).padStart(4, '0')}ms.png` });
}
console.log('DONE — frames in', OUT);
await browser.close();
