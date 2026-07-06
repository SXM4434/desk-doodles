// A/B the CPU deep-relief displacement BLUR: same disc + deep relief, sharp (0.006)
// vs smoother (0.014, 0.022). Tests the hypothesis that the rim faceting/sawtooth
// is high-frequency height content the coarse cap can't resolve. Tight rim crops.
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
await set('setStyle3d','svg-port'); await sleep(1500);
const cv = await p.evaluate(()=>{const c=document.querySelector('canvas');if(!c)return null;const r=c.getBoundingClientRect();return{x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)};});
async function orbit(dx,dy){if(!cv)return;await p.mouse.move(cv.x,cv.y);await p.mouse.down();await p.mouse.move(cv.x+dx,cv.y+dy,{steps:12});await p.mouse.up();await sleep(800);}
await orbit(70, 40);
await p.evaluate(()=>{const w=window;w.__sealedRelief=1;w.__sealedReliefTune={scale:0.45};w.__svgPortRimFeather=1e-7;}); // feather OFF to isolate blur
const clip = { x: 500, y: 360, width: 460, height: 340 };
for (const blur of [0.006, 0.014, 0.022]) {
  await p.evaluate((bl)=>{window.__svgPortDispBlur=bl;if(window.__sealedReliefApply)window.__sealedReliefApply();}, blur);
  await sleep(2800);
  await p.screenshot({ path: `/tmp/dd-shots/dispblur-${String(blur).replace('.','')}.png`, clip });
  console.log('blur', blur, 'done');
}
console.log('errors', errs.slice(0,4));
await b.close();
