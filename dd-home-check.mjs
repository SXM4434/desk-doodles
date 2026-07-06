import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:false, args:['--window-size=1500,950'], defaultViewport:{width:1500,height:950} });
const p = await b.newPage();
p.on('pageerror', e => console.log('HOME PAGEERROR:', e.message));
await p.goto('http://localhost:5182/', { waitUntil:'networkidle2', timeout:60000 });
await new Promise(r=>setTimeout(r,3500));
await p.screenshot({ path:'/tmp/dd-flip/home-check.png' });
console.log('home captured');
await b.close();
