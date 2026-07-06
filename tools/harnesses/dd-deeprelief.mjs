// Verify + tune DEEP svg-port relief (Sebs picked it). Flag path: window.__sealedRelief
// CPU-displaces the welded front cap by the height field (real depth, no tear).
// Capture baseline (off) vs scale 0.2/0.35/0.5 — check depth, orientation (flipY), no tear.
import puppeteer from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: CHROME, headless: false, args: ['--window-size=1500,1000'], defaultViewport: { width: 1500, height: 1000 } });
const p = await b.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 100)));
await p.goto('http://localhost:5182/desk?demo=1', { waitUntil: 'networkidle2', timeout: 60000 });
await sleep(4500);
async function clickText(t){const h=await p.evaluateHandle((x)=>[...document.querySelectorAll('button')].find((b)=>(b.textContent||'').trim().toLowerCase()===x.toLowerCase())||null,t);const el=h.asElement();if(el){await el.click();return true;}return false;}
async function openTrigger(s){return await p.evaluate((x)=>{const t=[...document.querySelectorAll('.dd-dropdown-trigger')].find((e)=>(e.textContent||'').toLowerCase().includes(x.toLowerCase()));if(t){t.click();return(t.textContent||'').trim();}return null;},s);}
async function pickOption(s){return await p.evaluate((x)=>{const o=[...document.querySelectorAll('[role=option]')].find((e)=>(e.textContent||'').toLowerCase().includes(x.toLowerCase()));if(o){o.click();return true;}return false;},s);}
async function resetZoom(){await p.keyboard.down('Control');await p.keyboard.press('0');await p.keyboard.up('Control');await sleep(700);await p.mouse.move(740,470);await p.keyboard.down('Control');for(let i=0;i<8;i++){await p.mouse.wheel({deltaY:-120});await sleep(55);}await p.keyboard.up('Control');await sleep(900);}
async function setDeep(scale){await p.evaluate((s)=>{const w=window;if(s===null){w.__sealedRelief=0;}else{w.__sealedRelief=1;w.__sealedReliefTune={scale:s};}if(w.__sealedReliefApply)w.__sealedReliefApply();},scale);await sleep(2600);}

await clickText('Desk'); await sleep(600);
await clickText('3D'); await sleep(1800);
await openTrigger('native'); await sleep(400); await pickOption('svg'); await sleep(2500);
const clip = { x: 0, y: 560, width: 1100, height: 440 };

await resetZoom();
await p.screenshot({ path: '/tmp/dd-shots/deep-OFF.png', clip });
console.log('OFF captured');
for (const s of [0.2, 0.35, 0.5]) {
  await setDeep(s); await resetZoom();
  await p.screenshot({ path: `/tmp/dd-shots/deep-${String(s).replace('.', '')}.png`, clip });
  console.log('scale', s, 'captured');
}
console.log('errors', errs.slice(0, 5));
await b.close();
