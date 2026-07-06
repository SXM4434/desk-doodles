import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
const CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const b=await puppeteer.launch({executablePath:CHROME,headless:false,args:['--window-size=1400,1000'],defaultViewport:{width:1400,height:1000}});
const p=await b.newPage();
await p.goto('http://localhost:5182/desk?test=suzanne',{waitUntil:'networkidle2',timeout:60000});
await p.waitForSelector('canvas',{timeout:30000}); await sleep(8000);
await p.evaluate(()=>window.__dd_canvas3d.setAiMeshMaterialMode('svg-port'));
await sleep(3000);
const dataUrl=await p.evaluate(()=>window.__dd_lastSvgTex||null);
if(dataUrl){ writeFileSync('/tmp/svgtex.png', Buffer.from(dataUrl.split(',')[1],'base64')); console.log('saved /tmp/svgtex.png'); }
else console.log('no texture dumped');
await b.close();
