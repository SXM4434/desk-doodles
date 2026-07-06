import puppeteer from '/Users/sebs/Desktop/Projects/desk-doodles/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await puppeteer.launch({
  executablePath: CHROME, headless: false,
  args: ['--no-sandbox', '--window-size=1400,950', '--window-position=2400,2400'],
  defaultViewport: { width: 1400, height: 950 },
});
const page = await browser.newPage();
const errs=[]; page.on('pageerror',e=>errs.push(e.message.slice(0,120)));
const log=(...a)=>console.log(...a);
await page.goto('http://localhost:5182/canvas',{waitUntil:'networkidle2',timeout:30000});
await new Promise(r=>setTimeout(r,2500));
const clickText=(re)=>page.evaluate(src=>{const rx=new RegExp(src,'i');const el=[...document.querySelectorAll('button,[role="button"]')].find(b=>rx.test((b.textContent||'').trim())&&b.offsetParent!==null);if(el){el.click();return(el.textContent||'').trim().slice(0,24);}return null;},re.source);

// draw a curvy zigzag (open stroke → good inflate candidate)
const box=await page.evaluate(()=>{const s=[...document.querySelectorAll('svg')].map(x=>{const r=x.getBoundingClientRect();return{r,a:r.width*r.height};}).filter(o=>o.a>60000).sort((a,b)=>b.a-a.a)[0];return s?{x:s.r.x,y:s.r.y,w:s.r.width,h:s.r.height}:null;});
if(box){const x0=box.x+120,y0=box.y+box.h/2;await page.mouse.move(x0,y0);await page.mouse.down();for(let i=0;i<=24;i++){await page.mouse.move(x0+i*16,y0+Math.sin(i*0.9)*70);await new Promise(z=>setTimeout(z,9));}await page.mouse.up();await new Promise(r=>setTimeout(r,400));}
log('3D ->',await clickText(/^3d$/)); await new Promise(r=>setTimeout(r,1000));

// set Geometry Mode → Inflate (trigger shows "Auto")
await page.evaluate(()=>{const t=[...document.querySelectorAll('button[aria-haspopup="listbox"]')].find(b=>/^auto$/i.test((b.textContent||'').trim())||/auto/i.test(b.textContent||''));if(t)t.click();});
await new Promise(r=>setTimeout(r,400));
const gm=await page.evaluate(()=>{const o=[...document.querySelectorAll('[role="option"]')].find(o=>/inflate/i.test(o.textContent||''));if(o){o.click();return(o.textContent||'').slice(0,30);}return null;});
log('geometry → inflate:',gm); await new Promise(r=>setTimeout(r,2000));

// Pressure = the slider whose default is 0.35 (INFLATE_PRESSURE_INFLUENCE), index 6.
const setP=(v)=>page.evaluate((val)=>{
  const list=[...document.querySelectorAll('input[type=range]')];
  const pr=list[6]; if(!pr)return 'no-slider-6';
  const setter=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;
  setter.call(pr,String(val));
  pr.dispatchEvent(new Event('input',{bubbles:true}));
  pr.dispatchEvent(new Event('change',{bubbles:true}));
  return 'slider6='+pr.value;
},v);
log('low ->',await setP(0)); await new Promise(r=>setTimeout(r,1800));
await page.screenshot({path:'/tmp/dd-shots/inflate-p-low.png'});
log('high ->',await setP(1)); await new Promise(r=>setTimeout(r,1800));
await page.screenshot({path:'/tmp/dd-shots/inflate-p-high.png'});
log('errors:',errs.slice(0,5));
await browser.close();
