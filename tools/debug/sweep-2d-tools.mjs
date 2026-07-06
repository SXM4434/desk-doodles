// READ-ONLY live sweep of /canvas 2D draw tools. Writes screenshots to /tmp/dd-2dsweep.
// Reuses the replay mechanism (pointer gestures into the live draw SVG) from
// tools/3d/replay-draw-core.mjs but drives REAL tool clicks and captures the
// live app per feature. NO src edits. NO /desk publish.
//
// Usage: node tools/debug/sweep-2d-tools.mjs --port 5182 --only ink,snap,...
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

function arg(n, d){ const i=process.argv.indexOf(`--${n}`); return i>=0&&process.argv[i+1]?process.argv[i+1]:d; }
const PORT = arg('port','5182');
const ONLY = (arg('only','')||'').split(',').map(s=>s.trim()).filter(Boolean);
const OUT = '/tmp/dd-2dsweep';
const BASE = `http://localhost:${PORT}`;
mkdirSync(OUT, { recursive: true });

let chromium;
for (const p of ['/tmp/dd-pp/node_modules/playwright']) { try { ({chromium}=require(p)); break; } catch {} }
if (!chromium) { console.log('NO_PLAYWRIGHT'); process.exit(2); }

const browser = await chromium.launch();
const page = await browser.newPage({ viewport:{ width:1400, height:900 }, deviceScaleFactor:1 });
const errs = [];
page.on('console', m => { if (m.type()==='error') errs.push(m.text()); });
page.on('pageerror', e => errs.push('PAGEERR '+e.message));

const log = (...a)=>console.log(...a);

async function fresh(){
  await page.goto(`${BASE}/canvas`, { waitUntil:'networkidle' });
  await page.waitForTimeout(600);
}
async function box(){
  return await page.evaluate(()=>{ const s=[...document.querySelectorAll('main svg')]; const el=s[s.length-1]; if(!el) return null; const r=el.getBoundingClientRect(); return {x:r.x,y:r.y,w:r.width,h:r.height}; });
}
async function clickText(re, exact=false){
  const btns = await page.$$('button, [role="tab"], [role="option"]');
  for (const b of btns){ const t=(await b.innerText().catch(()=>'')).trim(); if (exact ? t.toLowerCase()===re.toLowerCase() : new RegExp(re,'i').test(t)){ await b.click().catch(()=>{}); return t; } }
  return null;
}
async function clickTitle(sub){
  const b = await page.$(`button[title*="${sub}" i]:not([disabled])`);
  if (b){ await b.click().catch(()=>{}); return true; }
  return false;
}
async function strokeCount(){
  return await page.evaluate(()=>{ const btns=[...document.querySelectorAll('button')]; for(const b of btns){ const m=(b.innerText||'').match(/DONE\s*\((\d+)\)/i); if(m) return Number(m[1]); } return null; });
}
async function shot(name){ await page.locator('main').screenshot({ path:`${OUT}/${name}.png` }); return `${OUT}/${name}.png`; }

// polyline helpers in screen coords
function jitterStroke(b, ptsNorm, wob=2){
  return ptsNorm.map(([nx,ny])=>({ x: b.x + b.w*nx + (Math.sin(nx*53.7+ny*11.3)*wob), y: b.y + b.h*ny + (Math.cos(nx*17.1+ny*41.9)*wob) }));
}
async function drawStroke(pts){
  if (pts.length<2) return;
  await page.mouse.move(pts[0].x, pts[0].y);
  await page.mouse.down();
  for (let i=1;i<pts.length;i++) await page.mouse.move(pts[i].x, pts[i].y, { steps:2 });
  await page.mouse.up();
  await page.waitForTimeout(40);
}
function circleNorm(cx,cy,r,wob=0.02,n=40){
  const out=[]; for(let i=0;i<=n;i++){ const a=(i/n)*Math.PI*2; const rr=r+(i%3===0?wob:-wob); out.push([cx+Math.cos(a)*rr*1.2, cy+Math.sin(a)*rr]); } return out;
}
function polyNorm(cx,cy,r,sides,wob=0.015){
  const out=[]; for(let i=0;i<=sides;i++){ const a=(i/sides)*Math.PI*2 - Math.PI/2; const rr=r+((i%2)?wob:-wob); out.push([cx+Math.cos(a)*rr*1.2, cy+Math.sin(a)*rr]); } return out;
}

const results = {};
function record(k, v){ results[k]=v; log(`[${k}]`, JSON.stringify(v)); }
const want = k => ONLY.length===0 || ONLY.includes(k);

// ── INK: single + multiple strokes ──
if (want('ink')){
  await fresh(); const b=await box();
  await clickText('^INK$');
  await drawStroke(jitterStroke(b, [[0.2,0.3],[0.45,0.32],[0.7,0.28]]));
  const sc1 = await strokeCount();
  const p1 = await shot('ink-single');
  // add two more strokes
  await drawStroke(jitterStroke(b, [[0.25,0.5],[0.5,0.55],[0.72,0.5]]));
  await drawStroke(jitterStroke(b, [[0.35,0.65],[0.5,0.72],[0.62,0.65]]));
  const sc3 = await strokeCount();
  const p3 = await shot('ink-multi');
  record('ink', { strokesAfterSingle: sc1, strokesAfterMulti: sc3, shotSingle:p1, shotMulti:p3, errs: errs.slice() });
}

// ── SNAP: wobbly circle → snap, check close/gap ──
if (want('snap')){
  await fresh(); const b=await box(); errs.length=0;
  await clickText('^INK$');
  await drawStroke(jitterStroke(b, circleNorm(0.5,0.5,0.22,0.03), 3));
  const before = await strokeCount();
  const pBefore = await shot('snap-before');
  const snapEnabled = await page.evaluate(()=>{ const b=document.querySelector('button[data-snap-pill="snap"]'); return b? !b.disabled : null; });
  let fired=false;
  const sb = await page.$('button[data-snap-pill="snap"]:not([disabled])');
  if (sb){ await sb.click(); await page.waitForTimeout(500); fired=true; }
  const after = await strokeCount();
  const pAfter = await shot('snap-after');
  // measure gap of the rendered snapped path endpoints
  const geom = await page.evaluate(()=>{
    const s=[...document.querySelectorAll('main svg')]; const svg=s[s.length-1]; if(!svg) return null;
    const paths=[...svg.querySelectorAll('path')];
    let best=null;
    for(const p of paths){ let L=0; try{L=p.getTotalLength();}catch{continue;} if(L<10) continue; const a=p.getPointAtLength(0), z=p.getPointAtLength(L); const gap=Math.hypot(a.x-z.x,a.y-z.y); if(!best||L>best.L) best={L,gap}; }
    return best;
  });
  record('snap', { snapEnabled, fired, strokesBefore:before, strokesAfter:after, longestPath:geom, shotBefore:pBefore, shotAfter:pAfter, errs:errs.slice() });
}

// ── STRAIGHTEN: wobbly near-straight line → straighten ──
if (want('straighten')){
  await fresh(); const b=await box(); errs.length=0;
  await clickText('^INK$');
  await drawStroke(jitterStroke(b, [[0.18,0.35],[0.35,0.42],[0.52,0.38],[0.7,0.46],[0.82,0.4]], 4));
  const pBefore = await shot('straighten-before');
  const enabled = await page.evaluate(()=>{ const b=document.querySelector('button[data-snap-pill="straighten"]'); return b? !b.disabled : null; });
  let fired=false;
  const sb = await page.$('button[data-snap-pill="straighten"]:not([disabled])');
  if (sb){ await sb.click(); await page.waitForTimeout(500); fired=true; }
  const pAfter = await shot('straighten-after');
  record('straighten', { enabled, fired, shotBefore:pBefore, shotAfter:pAfter, errs:errs.slice() });
}

// ── SHADE: BRUSH tone ──
if (want('brush')){
  await fresh(); const b=await box(); errs.length=0;
  await clickText('^INK$');
  // draw a box to shade inside
  await drawStroke(jitterStroke(b, polyNorm(0.5,0.5,0.25,4,0.005), 2));
  await clickText('^SHADE$');
  await page.waitForTimeout(300);
  await clickTitle('Brush soft tone');
  // pick a mid-dark band
  const band = await page.$$('[aria-label="Tone band"] button');
  if (band[3]) await band[3].click();
  await page.waitForTimeout(150);
  // brush strokes inside
  await drawStroke(jitterStroke(b, [[0.4,0.45],[0.55,0.48],[0.6,0.55]], 1));
  await drawStroke(jitterStroke(b, [[0.42,0.55],[0.55,0.58]], 1));
  await page.waitForTimeout(200);
  const p = await shot('shade-brush');
  record('brush', { shot:p, errs:errs.slice() });
}

// ── SHADE: FILL single shape ──
if (want('fill-single')){
  await fresh(); const b=await box(); errs.length=0;
  await clickText('^INK$');
  await drawStroke(jitterStroke(b, polyNorm(0.5,0.5,0.25,4,0.004), 2));
  // snap to close cleanly
  const sb = await page.$('button[data-snap-pill="snap"]:not([disabled])'); if (sb){ await sb.click(); await page.waitForTimeout(400); }
  await clickText('^SHADE$'); await page.waitForTimeout(250);
  await clickTitle('Tap inside a region');
  const band = await page.$$('[aria-label="Tone band"] button'); if (band[4]) await band[4].click(); await page.waitForTimeout(150);
  await page.mouse.click(b.x+b.w*0.5, b.y+b.h*0.5);
  await page.waitForTimeout(400);
  const p = await shot('fill-single');
  record('fill-single', { shot:p, errs:errs.slice() });
}

// ── SHADE: FILL multiple shapes (the known-broken case) ──
if (want('fill-multi')){
  await fresh(); const b=await box(); errs.length=0;
  await clickText('^INK$');
  // two separated boxes
  await drawStroke(jitterStroke(b, polyNorm(0.3,0.45,0.15,4,0.004), 2));
  await drawStroke(jitterStroke(b, polyNorm(0.7,0.55,0.15,4,0.004), 2));
  const sb = await page.$('button[data-snap-pill="snap"]:not([disabled])'); if (sb){ await sb.click(); await page.waitForTimeout(400); }
  await clickText('^SHADE$'); await page.waitForTimeout(250);
  await clickTitle('Tap inside a region');
  const band = await page.$$('[aria-label="Tone band"] button'); if (band[4]) await band[4].click(); await page.waitForTimeout(150);
  await page.mouse.click(b.x+b.w*0.3, b.y+b.h*0.45); await page.waitForTimeout(350);
  const pMid = await shot('fill-multi-first');
  await page.mouse.click(b.x+b.w*0.7, b.y+b.h*0.55); await page.waitForTimeout(350);
  const p = await shot('fill-multi-both');
  record('fill-multi', { shotFirst:pMid, shotBoth:p, errs:errs.slice() });
}

// ── FULL FILL pill ──
if (want('fullfill')){
  await fresh(); const b=await box(); errs.length=0;
  await clickText('^INK$');
  await drawStroke(jitterStroke(b, polyNorm(0.5,0.5,0.25,4,0.004), 2));
  const sb = await page.$('button[data-snap-pill="snap"]:not([disabled])'); if (sb){ await sb.click(); await page.waitForTimeout(400); }
  await clickText('^SHADE$'); await page.waitForTimeout(250);
  await clickTitle('Tap inside a region');
  const band = await page.$$('[aria-label="Tone band"] button'); if (band[4]) await band[4].click(); await page.waitForTimeout(150);
  await page.mouse.click(b.x+b.w*0.5, b.y+b.h*0.5); await page.waitForTimeout(350);
  const pTucked = await shot('fullfill-before');
  // the Full fill pill
  const present = await page.evaluate(()=>!!document.querySelector('[data-tone-fullfill]'));
  let pressed=null;
  const ff = await page.$('[data-tone-fullfill]');
  if (ff){ await ff.click(); await page.waitForTimeout(150);
    // re-tap to apply flush fill
    await page.mouse.click(b.x+b.w*0.5, b.y+b.h*0.5); await page.waitForTimeout(350);
    pressed = await page.evaluate(()=>{ const e=document.querySelector('[data-tone-fullfill]'); return e? e.getAttribute('aria-pressed') : null; });
  }
  const pFlush = await shot('fullfill-after');
  record('fullfill', { present, pressedAfter:pressed, shotBefore:pTucked, shotAfter:pFlush, errs:errs.slice() });
}

// ── ERASE ──
if (want('erase')){
  await fresh(); const b=await box(); errs.length=0;
  await clickText('^INK$');
  await drawStroke(jitterStroke(b, polyNorm(0.5,0.5,0.25,4,0.004), 2));
  await clickText('^SHADE$'); await page.waitForTimeout(250);
  await clickTitle('Brush soft tone');
  const band = await page.$$('[aria-label="Tone band"] button'); if (band[4]) await band[4].click(); await page.waitForTimeout(150);
  await drawStroke(jitterStroke(b, [[0.4,0.45],[0.6,0.5],[0.55,0.6]],1));
  await page.waitForTimeout(150);
  const pToned = await shot('erase-before');
  // ERASE = paper band 0
  const erasePresent = await clickTitle('Paper (band 0)');
  await drawStroke(jitterStroke(b, [[0.42,0.46],[0.58,0.5]],1));
  await page.waitForTimeout(200);
  const pErased = await shot('erase-after');
  record('erase', { erasePresent, shotBefore:pToned, shotAfter:pErased, errs:errs.slice() });
}

// ── LASSO ──
if (want('lasso')){
  await fresh(); const b=await box(); errs.length=0;
  await clickText('^INK$');
  await drawStroke(jitterStroke(b, polyNorm(0.5,0.5,0.28,4,0.004), 2));
  await clickText('^SHADE$'); await page.waitForTimeout(250);
  await clickTitle('Draw a loop');
  const band = await page.$$('[aria-label="Tone band"] button'); if (band[4]) await band[4].click(); await page.waitForTimeout(150);
  // draw a lasso loop inside the box
  await drawStroke(jitterStroke(b, circleNorm(0.5,0.5,0.12,0.005,28), 1));
  await page.waitForTimeout(300);
  const p = await shot('lasso-after');
  record('lasso', { shot:p, errs:errs.slice() });
}

const tc = errs.length;
console.log('\n=== RESULTS ===');
console.log(JSON.stringify(results, null, 1));
console.log('total console errs across run:', tc);
await browser.close();
