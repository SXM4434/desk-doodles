// Compose the mesh-surface OFAT captures into per-axis contact sheets (one PNG
// per group) so each can be judged in one read — greyscale-default is pinned
// first in every sheet as the paired baseline.
import puppeteer from 'puppeteer-core';
import { readdirSync, mkdirSync, readFileSync } from 'node:fs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SRC = process.env.DD_SRC || '/tmp/mesh-ofat';
const OUT = `${SRC}/sheets`;
mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const dataUri = (f) => 'data:image/png;base64,' + readFileSync(`${SRC}/${f}`).toString('base64');

const files = readdirSync(SRC).filter((f) => /^\d\d_.*\.png$/.test(f)).sort();
const baseline = files.find((f) => f.includes('greyscale-default'));
const groups = {};
for (const f of files) { const g = f.split('_')[1]; (groups[g] ||= []).push(f); }

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, defaultViewport: { width: 1600, height: 1200 } });
const page = await browser.newPage();

for (const [g, fs] of Object.entries(groups)) {
  // pin the baseline first in each non-base sheet for paired comparison (skip if
  // this round has no greyscale-default capture)
  const list = g === 'base' || !baseline ? fs : [baseline, ...fs];
  const cells = list.map((f) => {
    const label = f.replace(/^\d\d_/, '').replace('.png', '') + (f === baseline ? '  ◀ BASELINE' : '');
    return `<figure><img src="${dataUri(f)}"/><figcaption>${label}</figcaption></figure>`;
  }).join('');
  const html = `<!doctype html><html><head><style>
    body{margin:0;background:#efe9df;font-family:ui-monospace,Menlo,monospace}
    .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:14px}
    figure{margin:0;background:#fff;border:1px solid #ccc;border-radius:6px;overflow:hidden}
    img{width:100%;display:block}
    figcaption{font-size:14px;padding:6px 8px;color:#222;font-weight:700}
    h1{font:700 18px ui-monospace;padding:12px 14px 0;margin:0}
  </style></head><body><h1>SURFACE OFAT — group: ${g} (${fs.length})</h1><div class="grid">${cells}</div></body></html>`;
  await page.setContent(html, { waitUntil: 'domcontentloaded' });
  await page.evaluate(async () => { await Promise.all([...document.images].map((im) => im.complete ? 0 : new Promise((r) => { im.onload = im.onerror = r; }))); });
  await sleep(300);
  await page.screenshot({ path: `${OUT}/sheet_${g}.png`, fullPage: true });
  console.log(`sheet_${g}.png — ${list.length} cells`);
}
await browser.close();
