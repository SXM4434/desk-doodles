// Probe the rim-feather: draw concentric circles → svg-port 3D → deep relief on,
// then read window.__rimFeatherDbg (ringCount/capCount/featheredCount/feather).
import puppeteer from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: CHROME, headless: false, args: ['--window-size=1500,1000'], defaultViewport: { width: 1500, height: 1000 } });
const p = await b.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 100)));
await p.goto('http://localhost:5182/canvas', { waitUntil: 'networkidle2', timeout: 60000 });
await sleep(3500);
const box = await p.evaluate(() => { const el = document.querySelector('.dd-draw-surface, svg[role="img"], .dd-canvas, main') || document.body; const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
const cx = Math.round(box.x + box.w * 0.5), cy = Math.round(box.y + box.h * 0.5);
async function stroke(pts){await p.mouse.move(pts[0][0],pts[0][1]);await p.mouse.down();for(const[x,y]of pts.slice(1)){await p.mouse.move(x,y);await sleep(8);}await p.mouse.up();await sleep(180);}
function circle(r){const a=[];for(let d=0;d<=372;d+=12){const t=d*Math.PI/180;a.push([Math.round(cx+r*Math.cos(t)),Math.round(cy+r*Math.sin(t))]);}return a;}
await stroke(circle(150));
await stroke(circle(80));
await stroke([[cx-6,cy-6],[cx+6,cy-6],[cx+6,cy+6],[cx-6,cy+6],[cx-6,cy-6]]);
await sleep(500);
const set=(fn,...a)=>p.evaluate((f,args)=>{const s=window.__ddSet;if(s&&s[f])s[f](...args);},fn,a);
await set('setMode','3d'); await sleep(1200);
await set('setStyle3d','svg-port'); await sleep(2000);
await p.evaluate(()=>{const w=window;w.__sealedRelief=1;w.__sealedReliefTune={scale:0.45};if(w.__sealedReliefApply)w.__sealedReliefApply();});
await sleep(2600);
const dbg = await p.evaluate(()=>window.__rimFeatherDbg||null);
console.log('rimFeatherDbg:', JSON.stringify(dbg));
console.log('errors', errs.slice(0,4));
await b.close();
