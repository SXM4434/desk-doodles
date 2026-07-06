// realofat2d-lib — drive the REAL /desk → Add doodle → DrawPanel flow (NOT the
// /canvas test surface). Verified working: upload SVG → switch SVG style →
// expand collapsed modifier sections → set sliders/dropdowns → screenshot the
// live DrawPanel preview. Replaces the /canvas-coupled bigdaddy-lib for 2D.
import puppeteer from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

export async function launch() {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: false, args: ['--window-size=1600,1050'], defaultViewport: { width: 1600, height: 1050 } });
  const p = await b.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 120)));
  return { b, p, errs };
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function openDesk(p) {
  await p.goto('http://localhost:5182/desk', { waitUntil: 'networkidle2', timeout: 60000 });
  await sleep(3500);
}

// Add doodle → DrawPanel, choose Upload SVG, set the file. Returns true on success.
export async function openUpload(p, svgPath) {
  const add = await p.evaluate(() => { const el = [...document.querySelectorAll('button')].find((b) => (b.textContent || '').trim() === 'Add doodle'); if (el && !el.disabled) { el.click(); return true; } return false; });
  if (!add) return false;
  await sleep(1100);
  await p.evaluate(() => { const el = [...document.querySelectorAll('button')].find((b) => /^upload svg$/i.test((b.textContent || '').trim())); if (el) el.click(); });
  await sleep(600);
  const fi = await p.$('input[type="file"]'); if (!fi) return false;
  await fi.uploadFile(svgPath); await sleep(1900);
  return true;
}

// Open the SVG-style dropdown and pick a style by its TITLE (prefix match on the
// deepest leaf — options carry a title + description, so no length filter).
export async function setStyle(p, title) {
  await p.evaluate(() => { const t = [...document.querySelectorAll('.dd-dropdown-trigger')].find((e) => /clean|rough|sketch|bold|wet|stipple|charcoal|riso|outline|wireframe|newsprint/i.test((e.textContent || '').trim())); if (t) t.click(); });
  await sleep(450);
  const picked = await p.evaluate((ttl) => {
    const cands = [...document.querySelectorAll('[role=option],[class*=option],li,button,div')].filter((e) => new RegExp('^' + ttl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test((e.textContent || '').trim()));
    cands.sort((a, b) => a.querySelectorAll('*').length - b.querySelectorAll('*').length);
    if (cands[0]) { cands[0].click(); return true; } return false;
  }, title);
  await sleep(1200);
  return picked;
}

// Expand every collapsed section so the modifier sliders are in the DOM.
export async function expandAll(p) {
  const n = await p.evaluate(() => { let n = 0; for (const h of [...document.querySelectorAll('[aria-expanded="false"]')]) { try { h.click(); n++; } catch { /* */ } } return n; });
  await sleep(700); return n;
}

// Set a slider identified by a label regex (its enclosing block's text). Returns
// {ok, now} — reads the value back.
export async function setSlider(p, labelRe, value) {
  return await p.evaluate((re, val) => {
    const rx = new RegExp(re, 'i');
    const s = [...document.querySelectorAll('input.dd-range, input[type=range]')].find((s) => { let par = s.closest('div'); for (let i = 0; i < 5 && par; i++) { if (rx.test(par.textContent || '')) return true; par = par.parentElement; } return false; });
    if (!s) return { ok: false, now: null };
    const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    set.call(s, String(val)); s.dispatchEvent(new Event('input', { bubbles: true })); s.dispatchEvent(new Event('change', { bubbles: true }));
    return { ok: true, now: s.value };
  }, labelRe, value);
}

// Screenshot just the DrawPanel preview (the biggest svg/canvas in the popup).
export async function shotPreview(p, path) {
  const box = await p.evaluate(() => { const c = [...document.querySelectorAll('svg, canvas')].map((e) => { const r = e.getBoundingClientRect(); return { w: r.width, h: r.height, x: r.x, y: r.y }; }).filter((c) => c.w > 150 && c.h > 150).sort((a, b) => b.w * b.h - a.w * a.h)[0]; return c || null; });
  if (box) await p.screenshot({ path, clip: { x: Math.max(0, box.x), y: Math.max(0, box.y), width: Math.min(box.w, 1600 - box.x), height: Math.min(box.h, 1050 - box.y) } });
  else await p.screenshot({ path });
  return !!box;
}

export { sleep };
