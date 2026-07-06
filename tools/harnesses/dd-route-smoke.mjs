import puppeteer from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: CHROME, headless: false, args: ['--window-size=1400,950'], defaultViewport: { width: 1400, height: 950 } });
async function check(url, ms){const p=await b.newPage();const errs=[];p.on('pageerror',(e)=>errs.push(e.message.slice(0,80)));p.on('console',(m)=>{if(m.type()==='error')errs.push('c:'+m.text().slice(0,70));});await p.goto(url,{waitUntil:'networkidle2',timeout:60000});await sleep(ms);const real=errs.filter((e)=>!/ResizeObserver|favicon|404|Download the React/.test(e));const title=await p.evaluate(()=>document.title||document.body.innerText.slice(0,30));console.log(url,'→ errors:',real.length,'| loaded:',JSON.stringify(title.slice(0,30)),real.slice(0,3));await p.close();}
await check('http://localhost:5182/',4000);
await check('http://localhost:5182/desk?demo=1',4500);
await check('http://localhost:5182/canvas',3500);
await check('http://localhost:5182/desks',3000);
await b.close();
