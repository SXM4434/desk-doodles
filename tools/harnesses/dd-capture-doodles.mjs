// Capture his ACTUAL doodle data as the app loads desk=0 (network responses), find
// the strokeless rough "face" doodle, and dump its svgMarkup + render_config so I can
// reproduce + debug the part editor on his REAL data — not a stand-in.
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: CHROME, headless: true });
const p = await b.newPage();
const rows = [];
p.on('response', async (res) => {
  try {
    const ct = (res.headers()['content-type'] || '');
    if (!/json/.test(ct)) return;
    const txt = await res.text();
    if (!/svg|render_config|markup/i.test(txt)) return;
    let data; try { data = JSON.parse(txt); } catch { return; }
    const arr = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : [data]);
    for (const r of arr) if (r && typeof r === 'object') rows.push(r);
  } catch {}
});
await p.goto('http://localhost:5182/desk?desk=0', { waitUntil: 'networkidle2', timeout: 60000 });
await sleep(6000);
console.log('captured row objects:', rows.length);
// keep ones that look like doodles (have an svg somewhere)
const svgOf = (r) => {
  const cfg = r.render_config || r.renderConfig || {};
  const c = typeof cfg === 'string' ? (() => { try { return JSON.parse(cfg); } catch { return {}; } })() : cfg;
  return r.svg || r.markup || r.svgMarkup || c.svg || c.markup || c.svgMarkup || null;
};
const hasStrokes = (r) => {
  const cfg = r.render_config || r.renderConfig || {};
  const c = typeof cfg === 'string' ? (() => { try { return JSON.parse(cfg); } catch { return {}; } })() : cfg;
  return Array.isArray(c.strokes) && c.strokes.length > 0;
};
const doodles = rows.filter((r) => svgOf(r));
console.log('rows with an svg:', doodles.length);
let i = 0;
const summary = [];
for (const r of doodles) {
  const svg = svgOf(r);
  if (typeof svg !== 'string' || svg.length < 40) continue;
  const geom = (svg.match(/<(path|circle|rect|ellipse|polygon|polyline|line)\b/g) || []).length;
  const vb = (svg.match(/viewBox="[^"]*"/) || ['(none)'])[0];
  const name = r.name || r.title || '(untitled)';
  const strokes = hasStrokes(r);
  summary.push({ i, name, geom, vb, strokes, editor: strokes ? 'Re-draw(stroke)' : 'Draw over(part)', len: svg.length });
  writeFileSync(`/tmp/dd-doodle-${i}.svg`, /^\s*<svg/i.test(svg) ? svg : `<svg xmlns="http://www.w3.org/2000/svg">${svg}</svg>`);
  i++;
}
summary.sort((a, b2) => (a.strokes === b2.strokes ? 0 : a.strokes ? 1 : -1));
console.log('\nDOODLES (Draw-over = part editor = his broken case):');
for (const s of summary) console.log(`  [${s.i}] ${String(s.name).slice(0, 18).padEnd(18)} geom=${String(s.geom).padStart(3)} ${s.editor.padEnd(18)} ${s.vb}`);
const partOnes = summary.filter((s) => !s.strokes);
console.log(`\n${partOnes.length} doodles open in the PART editor (Draw over). Files: /tmp/dd-doodle-<i>.svg`);
await b.close();
