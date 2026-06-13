// ROCK Y — pixel-diff two screenshot dirs (existing-style regression gate).
//   node tools/rocky/diff-dirs.mjs /tmp/dd-rocky/baseline-preview /tmp/dd-rocky/after-preview
// No new deps: PNGs are decoded in a headless page via canvas + ImageData.
// Exit 1 if any pair differs beyond tolerance (0.10% of pixels — antialias dust).

import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('/Users/sebs/Desktop/Projects/portfolio/tools/lab-screenshots/node_modules/playwright');

const [dirA, dirB] = process.argv.slice(2);
const TOLERANCE = 0.001; // fraction of pixels allowed to differ (AA jitter)

const files = fs.readdirSync(dirA).filter((f) => f.endsWith('.png'));
const browser = await chromium.launch();
const page = await (await browser.newContext()).newPage();
await page.goto('about:blank');

let failures = 0;
const rows = [];
for (const f of files) {
  const pB = path.join(dirB, f);
  if (!fs.existsSync(pB)) { rows.push([f, 'MISSING in after', 'FAIL']); failures++; continue; }
  const a64 = fs.readFileSync(path.join(dirA, f)).toString('base64');
  const b64 = fs.readFileSync(pB).toString('base64');
  const res = await page.evaluate(async ({ a64, b64 }) => {
    const load = (b) => new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = rej;
      img.src = `data:image/png;base64,${b}`;
    });
    const [ia, ib] = await Promise.all([load(a64), load(b64)]);
    if (ia.width !== ib.width || ia.height !== ib.height) {
      return { sizeMismatch: `${ia.width}x${ia.height} vs ${ib.width}x${ib.height}` };
    }
    const cv = (img) => {
      const c = document.createElement('canvas');
      c.width = img.width; c.height = img.height;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0);
      return ctx.getImageData(0, 0, img.width, img.height).data;
    };
    const da = cv(ia); const db = cv(ib);
    let diff = 0;
    for (let i = 0; i < da.length; i += 4) {
      if (Math.abs(da[i] - db[i]) > 8 || Math.abs(da[i + 1] - db[i + 1]) > 8 || Math.abs(da[i + 2] - db[i + 2]) > 8) diff++;
    }
    return { diff, total: da.length / 4 };
  }, { a64, b64 });
  if (res.sizeMismatch) { rows.push([f, res.sizeMismatch, 'FAIL']); failures++; continue; }
  const frac = res.diff / res.total;
  const pass = frac <= TOLERANCE;
  if (!pass) failures++;
  rows.push([f, `${res.diff}/${res.total} px (${(frac * 100).toFixed(4)}%)`, pass ? 'PASS' : 'FAIL']);
}
for (const [f, note, verdict] of rows) console.log(`${verdict}  ${f}  ${note}`);
await browser.close();
process.exit(failures ? 1 : 0);
