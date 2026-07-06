// Verify V2 CSG fires in the BROWSER on catalog objects (which carry the rect/
// circle treatMask primitives). Toggle "Walls: Sharp" → manifold should load +
// applyCsgRelief should run (window.__manifoldLoaded / __csgApplied), 0 errors.
import puppeteer from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: CHROME, headless: false, args: ['--window-size=1500,1000'], defaultViewport: { width: 1500, height: 1000 } });
const p = await b.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 120)));
await p.goto('http://localhost:5182/desk?demo=1', { waitUntil: 'networkidle2', timeout: 60000 });
await sleep(4500);
async function clickText(t){const h=await p.evaluateHandle((x)=>[...document.querySelectorAll('button')].find((b)=>(b.textContent||'').trim().toLowerCase()===x.toLowerCase())||null,t);const el=h.asElement();if(el){await el.click();return true;}return false;}
async function openTrigger(s){return await p.evaluate((x)=>{const t=[...document.querySelectorAll('.dd-dropdown-trigger')].find((e)=>(e.textContent||'').toLowerCase().includes(x.toLowerCase()));if(t){t.click();return(t.textContent||'').trim();}return null;},s);}
async function pickOption(s){return await p.evaluate((x)=>{const o=[...document.querySelectorAll('[role=option]')].find((e)=>(e.textContent||'').toLowerCase().includes(x.toLowerCase()));if(o){o.click();return true;}return false;},s);}

await clickText('Desk'); await sleep(600);
await clickText('3D'); await sleep(1800);
await openTrigger('native'); await sleep(400); await pickOption('svg'); await sleep(2500);
// CSG features need PRIMITIVE rect/circle elements → only clean-ish styles preserve
// them (rough converts to paths). Set the SVG STYLE to Clean so catalog primitives
// (Game Boy screen/buttons) survive into the treatMask.
for (const lbl of ['rough','bold','stipple','sketchy','wire','char','wet','riso','news','outline']) { const o = await openTrigger(lbl); if (o && !/native|svg-port|matte|auto/i.test(o)) break; }
await sleep(350); await pickOption('clean'); await sleep(2800);
// crank depth up so deep relief (and thus the Walls toggle) is meaningful + visible
await p.evaluate(()=>{ const inputs=[...document.querySelectorAll('input.dd-range')]; const t=inputs.find((inp)=>{let n=inp.closest('div');for(let i=0;i<4&&n;i++){if(/relief depth/i.test(n.textContent||''))return true;n=n.parentElement;}return false;}); if(t){const set=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;set.call(t,'0.5');t.dispatchEvent(new Event('input',{bubbles:true}));} });
await sleep(2500);
// click the "Sharp" wall-style pill (CSG)
const sharp = await p.evaluate(()=>{ const btn=[...document.querySelectorAll('button')].find((b)=>(b.textContent||'').trim()==='Sharp'); if(btn){btn.click();return true;} return false; });
console.log('clicked Sharp pill:', sharp);
await sleep(6000); // manifold lazy-load + CSG across visible objects
const probe = await p.evaluate(()=>({ manifoldLoaded: window.__manifoldLoaded, csgApplied: window.__csgApplied ?? 0 }));
console.log('manifoldLoaded:', JSON.stringify(probe.manifoldLoaded), '| csgApplied:', probe.csgApplied);
await p.screenshot({ path: '/tmp/dd-shots/csg-desk.png', clip: { x: 0, y: 560, width: 1100, height: 440 } });
console.log('errors:', errs.slice(0, 5));
await b.close();
