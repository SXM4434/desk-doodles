import puppeteer from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: CHROME, headless: false, args: ['--window-size=1500,1000'], defaultViewport: { width: 1500, height: 1000 } });
const p = await b.newPage();
await p.goto('http://localhost:5182/desk?demo=1', { waitUntil: 'networkidle2', timeout: 60000 });
await sleep(4500);
const closePresent = () => p.evaluate(() => [...document.querySelectorAll('button')].some((x) => (x.textContent || '').trim() === 'Close'));
const boxes = await p.evaluate(() => [...document.querySelectorAll('div')].filter((d) => d.style.width === '180px' && d.style.height === '180px' && d.style.position === 'relative').slice(0, 8).map((d) => { const r = d.getBoundingClientRect(); return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) }; }));
let opened = false;
for (const pt of boxes) { await p.mouse.click(pt.x, pt.y); await sleep(1300); if (await closePresent()) { opened = true; break; } }
console.log('card opened (Close present):', opened);
const dbg = await p.evaluate(() => {
  const t = document.body.innerText;
  const phrase = ['Draw over', 'Re-draw', "can't re-edit", 'can’t re-edit', 'drawn before re-editing'].find((s) => t.includes(s)) || 'NONE';
  // test prepareBackdrop logic on the open object's markup if we can find an svg in the card
  return { phrase };
});
console.log('re-edit phrase shown:', dbg.phrase);
await b.close();
