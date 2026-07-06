import puppeteer from 'puppeteer-core';
const CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
const b=await puppeteer.launch({executablePath:CHROME,headless:false,args:['--window-size=1600,1050'],defaultViewport:{width:1600,height:1050}});
const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message.slice(0,140)));
await p.goto('http://localhost:5182/desk?test=1',{waitUntil:'networkidle2',timeout:60000});await sleep(4500);
const objs=()=>p.evaluate(()=>[...document.querySelectorAll('div')].filter(d=>d.style.width==='180px'&&d.style.height==='180px'&&d.style.position==='relative').map((d,i)=>{const r=d.getBoundingClientRect();return{i,cx:Math.round(r.x+r.width/2),cy:Math.round(r.y+r.height/2)};}));
const before=(await objs()).map(o=>({i:o.i,cx:o.cx,cy:o.cy}));
const click=(re)=>p.evaluate(r=>{const x=[...document.querySelectorAll('button')].find(y=>new RegExp(r,'i').test((y.textContent||'').trim()));if(x){x.click();return true;}return false;},re.source);
await click(/add doodle/);await sleep(1100);await click(/upload svg/);await sleep(600);const fi=await p.$('input[type=file]');if(fi)await fi.uploadFile('/tmp/dd-face-test.svg');await sleep(2000);await click(/^done$/);await sleep(1100);await click(/place on desk/);await sleep(1800);
const after=await objs();let moved=0;for(const a of after){const b0=before.find(n=>n.i===a.i);if(b0&&Math.hypot(a.cx-b0.cx,a.cy-b0.cy)>6)moved++;}
console.log(`added a doodle while physics ON → ${moved} existing object(s) got nudged by its plop → ${moved>0?'OK (plop-in lively)':'no nudge (may have landed clear)'}`);
console.log('errors:',errs.filter(e=>!/Supabase|RPC|400|404|v5/i.test(e)).length);
await b.close();
