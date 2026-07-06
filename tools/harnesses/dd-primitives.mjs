import puppeteer from 'puppeteer-core';
const CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
const b=await puppeteer.launch({executablePath:CHROME,headless:false,args:['--window-size=1600,1050'],defaultViewport:{width:1600,height:1050}});
const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message.slice(0,140)));
await p.goto('http://localhost:5182/desk?demo=1',{waitUntil:'networkidle2',timeout:60000});await sleep(4000);
const clickText=(re)=>p.evaluate(r=>{const x=[...document.querySelectorAll('button')].find(y=>new RegExp(r,'i').test((y.textContent||'').trim()));if(x){x.click();return(x.textContent||'').trim();}return null;},re.source);
console.log('add doodle:',await clickText(/add doodle/));await sleep(1500);
// open shapes popover
console.log('shapes:',await clickText(/shapes/i));await sleep(700);
// list shape options in the popover
const shapes=await p.evaluate(()=>[...document.querySelectorAll('button')].map(x=>(x.getAttribute('aria-label')||x.getAttribute('title')||x.textContent||'').trim()).filter(t=>/rectangle|circle|triangle|rounded|diamond|heart|star|pentagon|hexagon/i.test(t)));
console.log('shape options visible:',JSON.stringify([...new Set(shapes)].slice(0,20)));
const hasBasics=['rectangle','circle','triangle','rounded'].filter(s=>shapes.some(t=>new RegExp(s,'i').test(t)));
console.log('basics present:',hasBasics.join(', ')||'NONE');
// arm Circle
const armed=await p.evaluate(()=>{const x=[...document.querySelectorAll('button')].find(y=>/circle/i.test((y.getAttribute('aria-label')||y.getAttribute('title')||y.textContent||'').trim()));if(x){x.click();return true;}return false;});
console.log('armed circle:',armed);await sleep(500);
// find draw canvas + drag a bbox to insert
const surf=await p.evaluate(()=>{const els=[...document.querySelectorAll('svg')].map(e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height};}).filter(r=>r.w>350&&r.h>280);return els.sort((a,b2)=>(b2.w*b2.h)-(a.w*a.h))[0]||null;});
const cx=surf.x+surf.w/2,cy=surf.y+surf.h/2;
const before=await p.evaluate(()=>{const s=[...document.querySelectorAll('svg')].filter(e=>e.getBoundingClientRect().width>350)[0];return s?s.querySelectorAll('path').length:0;});
await p.mouse.move(cx-90,cy-90);await p.mouse.down();for(let k=1;k<=8;k++){await p.mouse.move(cx-90+180*k/8,cy-90+180*k/8,{steps:1});await sleep(20);}await p.mouse.up();await sleep(600);
const after=await p.evaluate(()=>{const s=[...document.querySelectorAll('svg')].filter(e=>e.getBoundingClientRect().width>350)[0];return s?s.querySelectorAll('path').length:0;});
console.log(`insert circle: paths ${before}→${after} → ${after>before?'OK (shape inserted)':'no insert'}`);
await p.screenshot({path:'/tmp/dd-shots/primitives.png'});
console.log('errors:',errs.filter(e=>!/Supabase|RPC|400|404|v5/i.test(e)).slice(0,4));
await b.close();
