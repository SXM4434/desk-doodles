// Verify the "Relief depth" 3D-controls slider: default (0.25 deep), 0 (flat), 0.6 (bold).
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
await stroke(circle(150)); await stroke(circle(80)); await stroke([[cx-6,cy-6],[cx+6,cy-6],[cx+6,cy+6],[cx-6,cy+6],[cx-6,cy-6]]); await sleep(500);
const set=(fn,...a)=>p.evaluate((f,args)=>{const s=window.__ddSet;if(s&&s[f])s[f](...args);},fn,a);
await set('setMode','3d'); await sleep(1200); await set('setStyle3d','svg-port'); await sleep(2200);
const cv = await p.evaluate(()=>{const c=document.querySelector('canvas');if(!c)return null;const r=c.getBoundingClientRect();return{x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)};});
async function orbit(dx,dy){if(!cv)return;await p.mouse.move(cv.x,cv.y);await p.mouse.down();await p.mouse.move(cv.x+dx,cv.y+dy,{steps:12});await p.mouse.up();await sleep(800);}
// set the "Relief depth" range input (React-controlled)
async function setRelief(val){ const ok = await p.evaluate((v)=>{
  const inputs=[...document.querySelectorAll('input.dd-range')];
  const target=inputs.find((inp)=>{ let n=inp.closest('div'); for(let i=0;i<4&&n;i++){ if(/relief depth/i.test(n.textContent||''))return true; n=n.parentElement; } return false; });
  if(!target)return false;
  const setter=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;
  setter.call(target,String(v)); target.dispatchEvent(new Event('input',{bubbles:true})); target.dispatchEvent(new Event('change',{bubbles:true})); return true;
}, val); await sleep(2400); return ok; }

await orbit(70, 40);
await p.screenshot({ path: '/tmp/dd-shots/slider-default.png' });   // default 0.25
console.log('flat set:', await setRelief(0));
await p.screenshot({ path: '/tmp/dd-shots/slider-flat.png' });      // 0
console.log('bold set:', await setRelief(0.6));
await p.screenshot({ path: '/tmp/dd-shots/slider-bold.png' });      // 0.6
console.log('errors', errs.slice(0,4));
await b.close();
