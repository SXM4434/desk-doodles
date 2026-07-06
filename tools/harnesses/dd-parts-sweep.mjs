// Sweep the part editor over several of his REAL doodles (varied viewBoxes incl.
// negative origins). For each "Draw over" one: click each part, max |selBox-element| Δ.
import puppeteer from 'puppeteer-core';
const CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
const FILES=[0,1,6,8,23,33].map(i=>`/tmp/dd-doodle-${i}.svg`);
const b=await puppeteer.launch({executablePath:CHROME,headless:false,args:['--window-size=1600,1050'],defaultViewport:{width:1600,height:1050}});
const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message.slice(0,120)));
await p.goto('http://localhost:5182/desk?demo=1',{waitUntil:'networkidle2',timeout:60000});await sleep(4000);
const click=(re)=>p.evaluate(r=>{const x=[...document.querySelectorAll('button')].find(y=>new RegExp(r,'i').test((y.textContent||'').trim()));if(x){x.click();return(x.textContent||'').trim();}return null;},re.source);
const selRect=()=>p.evaluate(()=>{const rs=[...document.querySelectorAll('svg rect')].filter(el=>{const da=el.getAttribute('stroke-dasharray')||'';const fill=(el.getAttribute('fill')||'').toLowerCase();const r=el.getBoundingClientRect();return da&&fill==='none'&&r.width>8&&r.height>6;});if(!rs.length)return null;const r=rs[0].getBoundingClientRect();return{x:Math.round(r.x),y:Math.round(r.y)};});
for(const file of FILES){
  await click(/add doodle/);await sleep(1100);await click(/upload svg/);await sleep(600);
  const fi=await p.$('input[type=file]');if(fi)await fi.uploadFile(file);await sleep(2200);
  await click(/^done$/);await sleep(1100);await click(/place on desk/);await sleep(2200);
  // open the newest mine object
  const boxes=await p.evaluate(()=>[...document.querySelectorAll('div')].filter(d=>d.style.width==='180px'&&d.style.height==='180px'&&d.style.position==='relative').map(d=>{const r=d.getBoundingClientRect();return{x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)};}));
  let btn=null;
  for(const pt of boxes.reverse()){await p.mouse.click(pt.x,pt.y);await sleep(1000);const mine=await p.evaluate(()=>[...document.querySelectorAll('button')].some(x=>(x.textContent||'').trim()==='Delete'));if(mine){btn=await p.evaluate(()=>{const x=[...document.querySelectorAll('button')].find(y=>/draw over|re-draw/i.test((y.textContent||'').trim()));if(x){const t=(x.textContent||'').trim();x.click();return t;}return null;});if(btn)break;}await p.evaluate(()=>{const c=[...document.querySelectorAll('button')].find(x=>/^(close|back)$/i.test((x.textContent||'').trim()));if(c)c.click();});await sleep(400);}
  await sleep(1500);
  if(btn!=='Draw over'){console.log(`${file.split('/').pop().padEnd(16)} → "${btn}" (not part editor, skip)`);await p.evaluate(()=>{const c=[...document.querySelectorAll('button')].find(x=>/^(back|close)$/i.test((x.textContent||'').trim()));if(c)c.click();});await sleep(600);continue;}
  const ed=await p.evaluate(()=>{const els=[...document.querySelectorAll('svg')].map(e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height};}).filter(r=>r.w>350&&r.h>280);return els.sort((a,b2)=>(b2.w*b2.h)-(a.w*a.h))[0]||null;});
  const cl={x:Math.max(0,ed.x-6),y:Math.max(0,ed.y-6)};
  const parts=await p.evaluate(()=>{const seen=new Set();return [...document.querySelectorAll('[data-part-id]')].filter(el=>{const id=el.getAttribute('data-part-id');if(seen.has(id))return false;seen.add(id);return true;}).map(el=>{const r=el.getBoundingClientRect();return{id:el.getAttribute('data-part-id'),x:Math.round(r.x),y:Math.round(r.y),cx:Math.round(r.x+r.width/2),cy:Math.round(r.y+r.height/2),w:r.width,h:r.height};}).filter(r=>r.w>1&&r.h>1);});
  let maxD=0,hit=0;
  for(const q of parts){await p.mouse.click(cl.x+10,cl.y+10);await sleep(150);await p.mouse.click(q.cx,q.cy);await sleep(300);const cur=(await p.evaluate(()=>[...document.querySelectorAll('[data-part-id]')].map(el=>{const r=el.getBoundingClientRect();return{id:el.getAttribute('data-part-id'),x:Math.round(r.x),y:Math.round(r.y)};}))).find(z=>z.id===q.id);const sb=await selRect();if(sb&&cur){const d=Math.hypot(sb.x-cur.x,sb.y-cur.y);maxD=Math.max(maxD,d);if(d<14)hit++;}}
  console.log(`${file.split('/').pop().padEnd(16)} parts=${parts.length} aligned=${hit}/${parts.length} maxΔ=${maxD.toFixed(0)}px → ${maxD<14?'OK':'OFF'}`);
  await p.evaluate(()=>{const c=[...document.querySelectorAll('button')].find(x=>/^(back|close)$/i.test((x.textContent||'').trim()));if(c)c.click();});await sleep(700);
}
console.log('errors:',errs.filter(e=>!/Supabase|RPC|400|404|v5/i.test(e)).length);
await b.close();
