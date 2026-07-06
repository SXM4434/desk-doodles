// Identical throw on a THIN object (guitar) vs a ROUND/compact one (pokeball) on the
// test desk — slide distance + rotation should differ a LOT now.
import puppeteer from 'puppeteer-core';
const CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
const b=await puppeteer.launch({executablePath:CHROME,headless:false,args:['--window-size=1600,1050'],defaultViewport:{width:1600,height:1050}});
const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message.slice(0,140)));
await p.goto('http://localhost:5182/desk?test=1',{waitUntil:'networkidle2',timeout:60000});
await sleep(4500);
// read objects: center + rotation (from the OUTER wrapper transform)
const read=()=>p.evaluate(()=>{
  const inner=[...document.querySelectorAll('div')].filter(d=>d.style.width==='180px'&&d.style.height==='180px'&&d.style.position==='relative');
  return inner.map((d,i)=>{const w=d.parentElement;const r=d.getBoundingClientRect();let rot=0;const t=w&&w.style.transform||'';const m=t.match(/rotate\(([-\d.]+)deg\)/);if(m)rot=parseFloat(m[1]);return{i,cx:Math.round(r.x+r.width/2),cy:Math.round(r.y+r.height/2),rot};});
});
const list=await read();
// test-desk order: 0 pokeball(round), 1 gameboy, 2 shoe, 3 guitar(thin)
const fling=async(o)=>{await p.mouse.move(o.cx,o.cy);await p.mouse.down();for(let k=1;k<=6;k++){await p.mouse.move(o.cx+260*k/6,o.cy-40*k/6,{steps:1});await sleep(9);}await p.mouse.up();};
const test=async(idx,label)=>{
  const before=(await read()).find(o=>o.i===idx); if(!before){console.log(label,'not found');return;}
  await fling(before); await sleep(1500);
  const after=(await read()).find(o=>o.i===idx);
  const slide=after?Math.hypot(after.cx-before.cx,after.cy-before.cy):0;
  const spin=after?Math.abs(after.rot-before.rot):0;
  console.log(`${label.padEnd(20)} slide=${slide.toFixed(0)}px  spin=${spin.toFixed(0)}°`);
};
await test(0,'pokeball (round)');
await test(3,'guitar (thin)');
console.log('errors:',errs.slice(0,4));
await b.close();
