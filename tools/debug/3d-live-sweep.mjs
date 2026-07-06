// 3d-live-sweep — diagnostic only (read-only product src). Drives the LIVE /canvas:
// draws a doodle, flips to 3D, exercises every 3D control, screenshots each step.
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let chromium;
for (const p of ['/tmp/dd-pp/node_modules/playwright']) { try { ({ chromium } = require(p)); break; } catch {} }
if (!chromium) { console.log('NO_PLAYWRIGHT'); process.exit(2); }
const BASE='http://localhost:5182';
const OUT='/tmp/dd-3dsweep'; mkdirSync(OUT,{recursive:true});
const browser = await chromium.launch();
const page = await browser.newPage({ viewport:{width:1400,height:900}, deviceScaleFactor:1 });
const errs=[]; page.on('console',m=>{if(m.type()==='error')errs.push(m.text());}); page.on('pageerror',e=>errs.push('PAGEERR '+e.message));
const log=(...a)=>console.log(...a);

await page.goto(`${BASE}/canvas`, {waitUntil:'networkidle', timeout:15000});
await page.waitForTimeout(800);

// ---- draw surface box ----
async function drawBox(){ return await page.evaluate(()=>{ const s=[...document.querySelectorAll('main svg')]; const el=s[s.length-1]; if(!el)return null; const r=el.getBoundingClientRect(); return {x:r.x,y:r.y,w:r.width,h:r.height}; }); }
const box = await drawBox();
log('drawBox', JSON.stringify(box));

// ---- draw a HOUSE: closed body + triangle roof + door (closed region for fill) ----
function stroke(pts){ return pts; }
const X=v=>box.x+box.w*v, Y=v=>box.y+box.h*v;
const houseBody=[[.30,.40],[.70,.40],[.70,.80],[.30,.80],[.30,.40]];
const roof=[[.25,.40],[.50,.18],[.75,.40]];
const door=[[.46,.80],[.46,.60],[.56,.60],[.56,.80]];
async function drawPoly(poly){
  const pts=poly.map(([u,v])=>({x:X(u),y:Y(v)}));
  await page.mouse.move(pts[0].x,pts[0].y); await page.mouse.down();
  for(let i=1;i<pts.length;i++){ await page.mouse.move(pts[i].x,pts[i].y,{steps:6}); }
  await page.mouse.up(); await page.waitForTimeout(60);
}
for(const p of [houseBody,roof,door]) await drawPoly(p);
await page.waitForTimeout(400);

const strokeCount = await page.evaluate(()=>{ for(const b of document.querySelectorAll('button')){const m=(b.innerText||'').match(/DONE\s*\((\d+)\)/i); if(m)return Number(m[1]);} return -1; });
log('strokeCount(DONE pill)=', strokeCount);
await page.locator('main').screenshot({path:`${OUT}/01-2d-house.png`});

// helper: click a button by exact-ish text
async function clickText(re){ const bs=await page.$$('button,[role="tab"],[role="option"],[role="radio"]'); for(const b of bs){ const t=(await b.innerText().catch(()=>'')).trim(); if(re.test(t)){ await b.click().catch(()=>{}); return t; } } return null; }

// ---- flip to 3D ----
await clickText(/^3D$/);
await page.waitForTimeout(2000);
const gate = await page.evaluate(()=>/Nothing to convert/i.test(document.body.innerText||''));
const has3d = await page.evaluate(()=>!!document.querySelector('main canvas'));
log('after flip: has3d=',has3d,' gate=',gate);
await page.locator('main').screenshot({path:`${OUT}/02-3d-flip-default.png`});

// ---- discover 3D CONTROLS panel DOM (now in 3D mode) ----
const ctrl = await page.evaluate(()=>{
  const out={buttons:[],selects:[],sliders:[],bodyText:''};
  for (const b of document.querySelectorAll('button,[role="tab"],[role="option"],[role="radio"]')) { const t=(b.innerText||'').trim(); if(t&&t.length<60) out.buttons.push({t,pressed:b.getAttribute('aria-pressed'),dis:b.disabled}); }
  for (const s of document.querySelectorAll('select')) out.selects.push({label:s.getAttribute('aria-label')||s.previousElementSibling?.innerText||'?', value:s.value, opts:[...s.options].map(o=>o.value)});
  for (const s of document.querySelectorAll('input[type="range"]')) { const lbl=s.closest('label')?.innerText||s.getAttribute('aria-label')||s.previousElementSibling?.innerText||'?'; out.sliders.push({label:(lbl||'').replace(/\s+/g,' ').slice(0,40),min:s.min,max:s.max,value:s.value}); }
  return out;
});
log('=== 3D CONTROLS selects ===', JSON.stringify(ctrl.selects,null,1));
log('=== 3D CONTROLS sliders ===', JSON.stringify(ctrl.sliders,null,1));
log('=== 3D buttons sample ===', JSON.stringify(ctrl.buttons.map(b=>b.t).filter(t=>/style|hatch|svg|native|inflate|rod|extrude|solid|balloon|cushion|bead|profile|geometry/i.test(t))));

await browser.close();
log('errs:', errs.length); for(const e of errs.slice(0,6)) log('  ',e.slice(0,140));
