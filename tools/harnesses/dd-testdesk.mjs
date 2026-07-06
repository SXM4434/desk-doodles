import puppeteer from 'puppeteer-core';
const CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
const b=await puppeteer.launch({executablePath:CHROME,headless:false,args:['--window-size=1600,1050'],defaultViewport:{width:1600,height:1050}});
const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message.slice(0,140)));
await p.goto('http://localhost:5182/desk?test=1',{waitUntil:'networkidle2',timeout:60000});
await sleep(4500);
const objs=()=>p.evaluate(()=>[...document.querySelectorAll('div')].filter(d=>d.style.width==='180px'&&d.style.height==='180px'&&d.style.position==='relative').map((d,i)=>{const r=d.getBoundingClientRect();return{i,cx:Math.round(r.x+r.width/2),cy:Math.round(r.y+r.height/2)};}));
const list=await objs();
const phys=await p.evaluate(()=>{const x=[...document.querySelectorAll('button')].find(y=>/^physics/i.test((y.textContent||'').trim()));return x?x.textContent.trim():null;});
console.log('test-desk objects:',list.length,'(expect 6) | physics:',JSON.stringify(phys));
await p.screenshot({path:'/tmp/dd-shots/testdesk.png'});
// fling the first (round) one
if(list.length){const A=list[0];await p.mouse.move(A.cx,A.cy);await p.mouse.down();for(let k=1;k<=6;k++){await p.mouse.move(A.cx+200*k/6,A.cy+20*k/6,{steps:1});await sleep(10);}await p.mouse.up();const rel=(await objs())[A.i];await sleep(700);const rest=(await objs())[A.i];const slide=rel&&rest?Math.hypot(rest.cx-rel.cx,rest.cy-rel.cy):0;console.log('fling round → slide',slide.toFixed(0),'px →',slide>10?'draggable+sim OK':'no move');}
console.log('errors:',errs.filter(e=>!/Supabase|RPC|400|404|v5/i.test(e)).slice(0,4));
await b.close();
