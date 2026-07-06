// Verify the drag-follower dim: open the drawer, dispatch a real dragstart on a
// card, and confirm the SOURCE CARD dims (opacity → ~0.4) while only the doodle
// floats (setDragImage of the art). Native DnD is hard to drive in puppeteer, so
// we fire the event + read the resulting opacity (the mechanism).
import puppeteer from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: CHROME, headless: false, args: ['--window-size=1500,1000'], defaultViewport: { width: 1500, height: 1000 } });
const p = await b.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 110)));
await p.goto('http://localhost:5182/desk?demo=1', { waitUntil: 'networkidle2', timeout: 60000 });
await sleep(4500);
// open the DRAWER panel
const opened = await p.evaluate(() => { const t = [...document.querySelectorAll('button, [role=button], .dd-dropdown-trigger')].find((e) => /drawer/i.test((e.textContent || '').trim())); if (t) { t.click(); return (t.textContent || '').trim(); } return null; });
console.log('drawer toggle:', JSON.stringify(opened)); await sleep(1500);
const res = await p.evaluate(async () => {
  const card = document.querySelector('[data-dd-drawer-card], .dd-drawer-card');
  if (!card) return { err: 'no-drawer-card' };
  const before = getComputedStyle(card).opacity;
  const dt = new DataTransfer();
  card.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer: dt }));
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  await new Promise((r) => setTimeout(r, 220));
  const during = getComputedStyle(card).opacity;
  card.dispatchEvent(new DragEvent('dragend', { bubbles: true, cancelable: true, dataTransfer: dt }));
  await new Promise((r) => setTimeout(r, 220));
  const after = getComputedStyle(card).opacity;
  return { before, during, after };
});
console.log('opacity before/during/after drag:', JSON.stringify(res));
if (res.during) console.log('DIM OK:', parseFloat(res.during) < 0.6 && parseFloat(res.after) > 0.9 ? 'YES (card dims on drag, restores on end)' : 'CHECK');
console.log('errors:', errs.filter((e) => !/Supabase|RPC|v5|fetch|404|400/i.test(e)).slice(0, 4));
await b.close();
