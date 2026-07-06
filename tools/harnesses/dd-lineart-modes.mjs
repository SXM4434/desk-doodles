// Diagnose black-blob line-art: draw OPEN line-art strokes (a simple face), go 3D,
// and render geometryMode auto vs explicit extrude vs solid. If explicit Extrude/
// Solid fuse the line-art into a black slab while auto keeps it as rods, that's the bug.
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
function arc(r, a0, a1){const a=[];for(let d=a0;d<=a1;d+=10){const t=d*Math.PI/180;a.push([Math.round(cx+r*Math.cos(t)),Math.round(cy+r*Math.sin(t))]);}return a;}
// LINE-ART face: open face outline arc, two eye dashes, a smile arc — all OPEN strokes
await stroke(arc(120, -60, 240));                       // open face outline (gap at top)
await stroke([[cx-50,cy-30],[cx-30,cy-30]]);            // left eye (short line)
await stroke([[cx+30,cy-30],[cx+50,cy-30]]);            // right eye
await stroke(arc(60, 20, 160).map(([x,y])=>[x, y+10])); // smile arc (open)
await sleep(500);
const set=(fn,...a)=>p.evaluate((f,args)=>{const s=window.__ddSet;if(s&&s[f])s[f](...args);},fn,a);
await set('setMode','3d'); await sleep(1200);
await set('setStyle3d','native'); await sleep(1200); // native engine shows the geometry mode honestly
const cv = await p.evaluate(()=>{const c=document.querySelector('canvas');if(!c)return null;const r=c.getBoundingClientRect();return{x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)};});
async function orbit(dx,dy){if(!cv)return;await p.mouse.move(cv.x,cv.y);await p.mouse.down();await p.mouse.move(cv.x+dx,cv.y+dy,{steps:12});await p.mouse.up();await sleep(700);}
await orbit(50, 30);
for (const mode of ['auto', 'extrude', 'solid']) {
  await set('setGeometryMode', mode); await sleep(2400);
  await p.screenshot({ path: `/tmp/dd-shots/lineart-${mode}.png` });
  console.log('mode', mode, 'rendered');
}
console.log('errors', errs.slice(0,4));
await b.close();
