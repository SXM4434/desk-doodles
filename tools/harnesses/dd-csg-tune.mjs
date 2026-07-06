// Tune view: clean primitive objects in svg-port 3D at high depth — V1 (Smooth)
// vs V2 (Sharp/CSG), zoomed, to eyeball wall crispness + check no punch-through.
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
async function setRange(label,v){await p.evaluate((lab,val)=>{const inputs=[...document.querySelectorAll('input.dd-range')];const t=inputs.find((inp)=>{let n=inp.closest('div');for(let i=0;i<4&&n;i++){if(new RegExp(lab,'i').test(n.textContent||''))return true;n=n.parentElement;}return false;});if(t){const set=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;set.call(t,String(val));t.dispatchEvent(new Event('input',{bubbles:true}));}},label,v);await sleep(2400);}
async function clickPill(label){return await p.evaluate((l)=>{const btn=[...document.querySelectorAll('button')].find((b)=>(b.textContent||'').trim()===l);if(btn){btn.click();return true;}return false;},label);}
async function resetZoom(){await p.keyboard.down('Control');await p.keyboard.press('0');await p.keyboard.up('Control');await sleep(700);await p.mouse.move(740,470);await p.keyboard.down('Control');for(let i=0;i<9;i++){await p.mouse.wheel({deltaY:-120});await sleep(55);}await p.keyboard.up('Control');await sleep(900);}

await clickText('Desk'); await sleep(600);
await clickText('3D'); await sleep(1800);
await openTrigger('native'); await sleep(400); await pickOption('svg'); await sleep(2300);
// clean style → primitives survive → CSG features
for (const lbl of ['rough','bold','stipple','sketchy','wire','char','wet','riso','news','outline']) { const o = await openTrigger(lbl); if (o && !/native|svg-port|matte|auto/i.test(o)) break; }
await sleep(350); await pickOption('clean'); await sleep(2500);
await setRange('relief depth', 0.6);
const clip = { x: 0, y: 560, width: 1100, height: 440 };
await resetZoom();
await p.screenshot({ path: '/tmp/dd-shots/tune-smooth.png', clip });   // V1
console.log('sharp:', await clickPill('Sharp'));
await sleep(6000);
const probe = await p.evaluate(()=>({ loaded: window.__manifoldLoaded, applied: window.__csgApplied ?? 0 }));
await resetZoom();
await p.screenshot({ path: '/tmp/dd-shots/tune-sharp.png', clip });    // V2 CSG
console.log('manifold:', JSON.stringify(probe.loaded), 'csgApplied:', probe.applied, 'errors:', errs.slice(0,4));
await b.close();
