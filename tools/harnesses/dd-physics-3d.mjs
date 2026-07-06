import puppeteer from 'puppeteer-core';
const CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
const b=await puppeteer.launch({executablePath:CHROME,headless:false,args:['--window-size=1600,1050'],defaultViewport:{width:1600,height:1050}});
const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message.slice(0,140)));
await p.goto('http://localhost:5182/desk?test=1',{waitUntil:'networkidle2',timeout:60000});await sleep(4500);
const clickText=(t)=>p.evaluate((tt)=>{const x=[...document.querySelectorAll('button')].find(y=>(y.textContent||'').trim()===tt);if(x){x.click();return true;}return false;},t);
// flip to 3D: Desk lens then 3D view
console.log('click Desk:',await clickText('Desk'));await sleep(800);
console.log('click 3D:',await clickText('3D'));await sleep(2500);
// did 3D forms render? count canvases + check object wrappers still positioned
const after3d=await p.evaluate(()=>({canvases:document.querySelectorAll('canvas').length,objs:document.querySelectorAll('[data-desk-obj-id]').length}));
console.log('after flip to 3D:',JSON.stringify(after3d));
await p.screenshot({path:'/tmp/dd-shots/physics3d.png'});
// fling an object (physics on → should fling, not orbit)
const objs=()=>p.evaluate(()=>[...document.querySelectorAll('[data-desk-obj-id]')].map((el,i)=>{const r=el.getBoundingClientRect();return{i,cx:Math.round(r.x+r.width/2),cy:Math.round(r.y+r.height/2)};}));
const A=(await objs())[0];
await p.mouse.move(A.cx,A.cy);await p.mouse.down();for(let k=1;k<=6;k++){await p.mouse.move(A.cx+200*k/6,A.cy+30*k/6,{steps:1});await sleep(10);}await p.mouse.up();await sleep(900);
const A2=(await objs())[0];
const moved=A2?Math.hypot(A2.cx-A.cx,A2.cy-A.cy):0;
console.log(`fling 3D object → moved ${moved.toFixed(0)}px → ${moved>10?'OK (3D form flings)':'did not move (still orbiting?)'}`);
await p.screenshot({path:'/tmp/dd-shots/physics3d-after.png'});
console.log('errors:',errs.filter(e=>!/Supabase|RPC|400|404|v5/i.test(e)).slice(0,4));
await b.close();
