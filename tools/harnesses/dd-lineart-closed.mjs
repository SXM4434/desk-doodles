// Hunt the black-blob: cases most likely to FUSE line-art into a slab in explicit
// Extrude/Solid — (A) a single CLOSED circle outline (should stay a ring/shell,
// not a filled disc), (B) a dense scribble. Render each in extrude + solid.
import puppeteer from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: CHROME, headless: false, args: ['--window-size=1500,1000'], defaultViewport: { width: 1500, height: 1000 } });
const p = await b.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 100)));
async function run(label, drawFn) {
  await p.goto('http://localhost:5182/canvas', { waitUntil: 'networkidle2', timeout: 60000 });
  await sleep(3000);
  const box = await p.evaluate(() => { const el = document.querySelector('.dd-draw-surface, svg[role="img"], .dd-canvas, main') || document.body; const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  const cx = Math.round(box.x + box.w * 0.5), cy = Math.round(box.y + box.h * 0.5);
  const stroke = async (pts)=>{await p.mouse.move(pts[0][0],pts[0][1]);await p.mouse.down();for(const[x,y]of pts.slice(1)){await p.mouse.move(x,y);await sleep(7);}await p.mouse.up();await sleep(160);};
  await drawFn(cx, cy, stroke);
  await sleep(400);
  const set=(fn,...a)=>p.evaluate((f,args)=>{const s=window.__ddSet;if(s&&s[f])s[f](...args);},fn,a);
  await set('setMode','3d'); await sleep(1100);
  await set('setStyle3d','native'); await sleep(1100);
  const cv = await p.evaluate(()=>{const c=document.querySelector('canvas');if(!c)return null;const r=c.getBoundingClientRect();return{x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)};});
  if (cv){await p.mouse.move(cv.x,cv.y);await p.mouse.down();await p.mouse.move(cv.x+50,cv.y+30,{steps:12});await p.mouse.up();await sleep(700);}
  for (const mode of ['extrude','solid']) {
    await set('setGeometryMode', mode); await sleep(2300);
    await p.screenshot({ path: `/tmp/dd-shots/blob-${label}-${mode}.png`, clip: { x: 300, y: 230, width: 820, height: 600 } });
    console.log(label, mode, 'rendered');
  }
}
function circle(cx,cy,r){const a=[];for(let d=0;d<=360;d+=10){const t=d*Math.PI/180;a.push([Math.round(cx+r*Math.cos(t)),Math.round(cy+r*Math.sin(t))]);}return a;}
// A: one CLOSED circle outline
await run('closed', async (cx,cy,stroke)=>{ await stroke(circle(cx,cy,110)); });
// B: dense scribble (back-and-forth fill)
await run('scribble', async (cx,cy,stroke)=>{
  const pts=[]; for(let i=0;i<=24;i++){const x=cx-100+i*8; const y=cy + (i%2?60:-60); pts.push([x,y]);}
  await stroke(pts);
  await stroke(circle(cx,cy,110)); // outline around the scribble
});
console.log('errors', errs.slice(0,4));
await b.close();
