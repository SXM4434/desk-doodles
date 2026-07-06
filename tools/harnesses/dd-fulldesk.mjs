import puppeteer from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: CHROME, headless: false, args: ['--window-size=1500,1000'], defaultViewport: { width: 1500, height: 1000 } });
const p = await b.newPage();
await p.goto('http://localhost:5182/desk?demo=1', { waitUntil: 'networkidle2', timeout: 60000 });
await sleep(4500);
async function clickText(t){const h=await p.evaluateHandle((x)=>[...document.querySelectorAll('button')].find((b)=>(b.textContent||'').trim().toLowerCase()===x.toLowerCase())||null,t);const el=h.asElement();if(el){await el.click();return true;}return false;}
await clickText('Desk'); await sleep(600);
await clickText('3D'); await sleep(2600);
await p.screenshot({ path: '/tmp/dd-shots/fulldesk-3d.png' });
console.log('captured full desk 3D');
await b.close();
