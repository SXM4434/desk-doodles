// Verify ICON SVG upload (a <symbol> library + <use> instance) renders the
// shape, not blank. Uploads /tmp/dd-icon-test.svg, traces, screenshots the
// preview, and reports how many real path/shape nodes the sanitized markup has.
import puppeteer from 'puppeteer-core';
import fs from 'fs';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
fs.mkdirSync('/tmp/dd-shots', { recursive: true });
const b = await puppeteer.launch({ executablePath: CHROME, headless: false, args: ['--window-size=1500,1000'], defaultViewport: { width: 1500, height: 1000 } });
const p = await b.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 120)));
await p.goto('http://localhost:5182/desk?demo=1', { waitUntil: 'networkidle2', timeout: 60000 });
await sleep(4500);
const clickByText = (re) => p.evaluate((r) => { const b = [...document.querySelectorAll('button')].find((x) => new RegExp(r, 'i').test((x.textContent || '').trim())); if (b) { b.click(); return (b.textContent || '').trim(); } return null; }, re.source);

console.log('add doodle:', await clickByText(/add doodle/)); await sleep(1500);
console.log('upload-svg mode:', await clickByText(/upload svg/)); await sleep(800);
const fileInput = await p.$('input[type=file]');
if (fileInput) { await fileInput.uploadFile('/tmp/dd-icon-test.svg'); console.log('file set'); }
await sleep(3500); // trace/sanitize

// Inspect the live preview: count real geometry nodes + measure ink coverage.
const probe = await p.evaluate(() => {
  // find the biggest svg in the upload modal preview area
  const svgs = [...document.querySelectorAll('svg')].map((s) => { const r = s.getBoundingClientRect(); return { s, area: r.width * r.height, w: r.width, h: r.height }; }).filter((o) => o.w > 120 && o.h > 120).sort((a, b) => b.area - a.area);
  const top = svgs[0]?.s;
  if (!top) return { found: false };
  const paths = top.querySelectorAll('path, polygon, polyline, circle, rect, ellipse, line').length;
  const uses = top.querySelectorAll('use').length;
  const html = top.outerHTML;
  return { found: true, paths, uses, htmlLen: html.length, hasStarPath: /M12 2l3 7/.test(html) || /path/i.test(html), snippet: html.slice(0, 260) };
});
console.log('preview probe:', JSON.stringify(probe, null, 1));
await p.screenshot({ path: '/tmp/dd-shots/icon-1-loaded.png' });
console.log('done:', await clickByText(/^done$/)); await sleep(1500);
console.log('place:', await clickByText(/place on desk/)); await sleep(2500);
await p.screenshot({ path: '/tmp/dd-shots/icon-2-placed.png' });
console.log('errors:', errs.filter((e) => !/updateDoodleSvg|Supabase|v5|RPC|400|404/i.test(e)).slice(0, 4));
await b.close();
