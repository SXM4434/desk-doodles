// Smoke: homepage + a normal /desk load (no demo) — the svg-port build paths that
// pass NO styleId fall to the byte-identical DEFAULT carve profile, so these
// should be unaffected by the 2026-06-20 desk svg-port pass. Confirm 0 errors.
import puppeteer from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: CHROME, headless: false, args: ['--window-size=1400,950'], defaultViewport: { width: 1400, height: 950 } });
async function check(url, ms) {
  const p = await b.newPage(); const errs = [];
  p.on('pageerror', (e) => errs.push(e.message.slice(0, 90)));
  p.on('console', (m) => { if (m.type() === 'error') errs.push('console:' + m.text().slice(0, 80)); });
  await p.goto(url, { waitUntil: 'networkidle2', timeout: 60000 }); await sleep(ms);
  const real = errs.filter((e) => !/ResizeObserver|favicon|Download the React/.test(e));
  console.log(url, '→ errors:', real.length, real.slice(0, 4));
  await p.close();
}
await check('http://localhost:5182/', 4000);
await check('http://localhost:5182/desk', 4500);
await b.close();
