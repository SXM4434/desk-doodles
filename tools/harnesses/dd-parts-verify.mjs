// VERIFY the rebuilt (frame-space) part editor on the LIVE /desk flow.
// Upload a 5-part SVG → place → open card → Draw over → in the editor:
//   A) SELECT each part by clicking its on-screen center; assert the selection
//      box (dashed rect) coincides with the clicked part element (the alignment
//      proof — "box lands ON the shape", not off somewhere else).
//   B) MOVE the selected part by a known screen delta; assert BOTH the part
//      element and the selection box shift by ~that delta and stay coincident.
//   C) RESIZE via the SE corner handle; assert the part grows and the box tracks.
// Everything compared in SCREEN pixels via getBoundingClientRect, so part and
// overlay are in one directly-comparable space.
import puppeteer from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: CHROME, headless: false, args: ['--window-size=1500,1000'], defaultViewport: { width: 1500, height: 1000 } });
const p = await b.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 140)));
await p.goto('http://localhost:5182/desk?demo=1', { waitUntil: 'networkidle2', timeout: 60000 });
await sleep(4500);
const clickByText = (re) => p.evaluate((r) => { const x = [...document.querySelectorAll('button')].find((y) => new RegExp(r, 'i').test((y.textContent || '').trim())); if (x) { x.click(); return (x.textContent || '').trim(); } return null; }, re.source);

console.log('add doodle:', await clickByText(/add doodle/)); await sleep(1400);
console.log('upload-svg mode:', await clickByText(/upload svg/)); await sleep(800);
const fileInput = await p.$('input[type=file]');
if (fileInput) { await fileInput.uploadFile('/tmp/dd-parts-test.svg'); console.log('file set'); }
await sleep(2500);
console.log('done:', await clickByText(/^done$/)); await sleep(1400);
console.log('place:', await clickByText(/place on desk/)); await sleep(2500);

// open the placed object's card
const boxes = await p.evaluate(() => [...document.querySelectorAll('div')].filter((d) => d.style.width === '180px' && d.style.height === '180px' && d.style.position === 'relative').map((d) => { const r = d.getBoundingClientRect(); return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) }; }));
let editOpen = false;
for (const pt of boxes) { await p.mouse.click(pt.x, pt.y); await sleep(1200); const hasEdit = await p.evaluate(() => [...document.querySelectorAll('button')].some((x) => (x.textContent || '').trim() === 'Delete')); if (hasEdit) { editOpen = true; break; } await p.evaluate(() => { const c = [...document.querySelectorAll('button')].find((x) => (x.textContent || '').trim() === 'Close'); if (c) c.click(); }); await sleep(400); }
console.log('edit card opened:', editOpen);
const reEdit = await p.evaluate(() => { const x = [...document.querySelectorAll('button')].find((y) => /draw over|re-draw/i.test((y.textContent || '').trim())); if (x) { x.click(); return (x.textContent || '').trim(); } return null; });
console.log('draw-over clicked:', JSON.stringify(reEdit)); await sleep(1800);

// ── helpers reading the editor DOM ────────────────────────────────────────────
const partRects = () => p.evaluate(() => [...document.querySelectorAll('[data-part-id]')].map((el) => { const r = el.getBoundingClientRect(); return { id: el.getAttribute('data-part-id'), x: r.x, y: r.y, w: r.width, h: r.height, cx: r.x + r.width / 2, cy: r.y + r.height / 2 }; }).filter((r) => r.w > 1 && r.h > 1));
// the dashed selection bbox: fill=none rect with a dasharray, big enough to be the
// box (not a 10px handle). Returns its screen rect (or null).
const selBox = () => p.evaluate(() => { const rs = [...document.querySelectorAll('svg rect')].filter((el) => { const da = el.getAttribute('stroke-dasharray') || ''; const fill = (el.getAttribute('fill') || '').toLowerCase(); const r = el.getBoundingClientRect(); return da && fill === 'none' && r.width > 14 && r.height > 14; }); if (!rs.length) return null; const r = rs[0].getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, cx: r.x + r.width / 2, cy: r.y + r.height / 2 }; });
// the 4 corner handles (rx=2 rects ~10px) — return SE-most for resize.
const handles = () => p.evaluate(() => [...document.querySelectorAll('svg rect')].filter((el) => el.getAttribute('rx') === '2' && el.getBoundingClientRect().width < 18 && el.getBoundingClientRect().width > 3).map((el) => { const r = el.getBoundingClientRect(); return { cx: r.x + r.width / 2, cy: r.y + r.height / 2 }; }));
const near = (a, b2, tol) => Math.abs(a - b2) <= tol;

const parts = await partRects();
console.log(`\nparts found in editor: ${parts.length} — ${parts.map((p) => p.id).join(', ')}`);
if (!parts.length) { console.log('NO PARTS — editor not in part mode. errors:', errs.slice(0, 5)); await b.close(); process.exit(1); }

const TOL = 8; // px — selection box vs shape coincidence tolerance
let passA = 0, total = parts.length;
const report = [];
// ── A) SELECT each part, assert box coincides ────────────────────────────────
for (const part of parts) {
  await p.mouse.click(part.cx, part.cy); await sleep(450);
  const sb = await selBox();
  const cur = (await partRects()).find((r) => r.id === part.id);
  if (!sb || !cur) { report.push(`  ${part.id.padEnd(8)} SELECT: no box/part (sb=${!!sb})`); continue; }
  const ok = near(sb.x, cur.x, TOL) && near(sb.y, cur.y, TOL) && near(sb.w, cur.w, TOL * 1.6) && near(sb.h, cur.h, TOL * 1.6);
  if (ok) passA++;
  report.push(`  ${part.id.padEnd(8)} SELECT box-vs-shape: ${ok ? 'OK' : 'OFF'}  shape=(${cur.x|0},${cur.y|0},${cur.w|0},${cur.h|0}) box=(${sb.x|0},${sb.y|0},${sb.w|0},${sb.h|0})`);
}
console.log('\n── A) SELECT — box lands on shape ──');
report.forEach((l) => console.log(l));
console.log(`  → ${passA}/${total} parts: selection box coincides with shape`);

// ── B) MOVE the smallest part by a known delta ───────────────────────────────
const small = [...parts].sort((a, b2) => (a.w * a.h) - (b2.w * b2.h))[0];
await p.mouse.click(small.cx, small.cy); await sleep(400); // select
const before = (await partRects()).find((r) => r.id === small.id);
const sbBefore = await selBox();
const DX = 90, DY = 60;
await p.mouse.move(small.cx, small.cy); await p.mouse.down();
for (let i = 1; i <= 8; i++) { await p.mouse.move(small.cx + (DX * i) / 8, small.cy + (DY * i) / 8); await sleep(18); }
await p.mouse.up(); await sleep(450);
const after = (await partRects()).find((r) => r.id === small.id);
const sbAfter = await selBox();
console.log('\n── B) MOVE — part + box track the cursor ──');
if (before && after && sbBefore && sbAfter) {
  const partDx = after.cx - before.cx, partDy = after.cy - before.cy;
  const boxDx = sbAfter.cx - sbBefore.cx, boxDy = sbAfter.cy - sbBefore.cy;
  const partMoved = near(partDx, DX, 14) && near(partDy, DY, 14);
  const boxMoved = near(boxDx, DX, 14) && near(boxDy, DY, 14);
  const coincide = near(sbAfter.x, after.x, TOL) && near(sbAfter.y, after.y, TOL);
  console.log(`  cursor delta=(${DX},${DY})  part moved=(${partDx|0},${partDy|0}) [${partMoved ? 'OK' : 'OFF'}]  box moved=(${boxDx|0},${boxDy|0}) [${boxMoved ? 'OK' : 'OFF'}]`);
  console.log(`  box still coincides with shape after move: ${coincide ? 'OK' : 'OFF'}`);
} else { console.log('  MOVE: missing reads', { before: !!before, after: !!after, sbBefore: !!sbBefore, sbAfter: !!sbAfter }); }

// ── C) RESIZE via SE handle ──────────────────────────────────────────────────
console.log('\n── C) RESIZE — SE handle, box tracks the shape ──');
const moved = (await partRects()).find((r) => r.id === small.id);
const hs = await handles();
if (moved && hs.length >= 1) {
  // SE handle = max(cx+cy)
  const se = hs.sort((a, b2) => (b2.cx + b2.cy) - (a.cx + a.cy))[0];
  const beforeR = moved;
  await p.mouse.move(se.cx, se.cy); await p.mouse.down();
  for (let i = 1; i <= 8; i++) { await p.mouse.move(se.cx + (50 * i) / 8, se.cy + (50 * i) / 8); await sleep(18); }
  await p.mouse.up(); await sleep(450);
  const afterR = (await partRects()).find((r) => r.id === small.id);
  const sbR = await selBox();
  if (afterR && sbR) {
    const grew = afterR.w > beforeR.w + 4 || afterR.h > beforeR.h + 4;
    const coincide = near(sbR.x, afterR.x, TOL) && near(sbR.y, afterR.y, TOL) && near(sbR.w, afterR.w, TOL * 1.6) && near(sbR.h, afterR.h, TOL * 1.6);
    console.log(`  shape ${beforeR.w|0}×${beforeR.h|0} → ${afterR.w|0}×${afterR.h|0}  grew=${grew ? 'OK' : 'OFF'}  box-tracks=${coincide ? 'OK' : 'OFF'}`);
  } else { console.log('  RESIZE: missing reads', { afterR: !!afterR, sbR: !!sbR }); }
} else { console.log('  RESIZE: no handles found (handles=', hs.length, ')'); }

await p.screenshot({ path: '/tmp/dd-shots/parts-verify.png' });
console.log('\npage errors:', errs.filter((e) => !/updateDoodleSvg|Supabase|RPC|400|404|v5/i.test(e)).slice(0, 5));
console.log('screenshot: /tmp/dd-shots/parts-verify.png');
await b.close();
