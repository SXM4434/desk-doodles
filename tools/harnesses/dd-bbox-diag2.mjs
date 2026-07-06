import puppeteer from 'puppeteer-core';
const CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const b=await puppeteer.launch({executablePath:CHROME,headless:true});
const p=await b.newPage();await p.goto('about:blank');
const FACE=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><circle cx="100" cy="100" r="82" fill="#ccc" stroke="#333" stroke-width="3" data-part-id="part-0"/><circle cx="72" cy="82" r="13" fill="#333" data-part-id="part-1"/></svg>`;
const out=await p.evaluate((inner)=>{
  const wrap=document.createElement('div');wrap.style.cssText='position:absolute;left:0;top:0;width:800px;height:600px';
  wrap.innerHTML=`<svg width="800" height="600" viewBox="0 0 800 600"><svg id="nested" x="0" y="0" width="800" height="600" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet"><g>${inner}</g></svg></svg>`;
  document.body.appendChild(wrap);
  const nested=document.getElementById('nested');
  const clientToVB=(cx,cy)=>{const m=nested.getScreenCTM().inverse();return{x:m.a*cx+m.c*cy+m.e,y:m.b*cx+m.d*cy+m.f};};
  const head=nested.querySelector('[data-part-id="part-0"]');
  const r=head.getBoundingClientRect();
  const tl=clientToVB(r.left,r.top), br=clientToVB(r.right,r.bottom);
  const box={x:Math.min(tl.x,br.x),y:Math.min(tl.y,br.y),w:Math.abs(br.x-tl.x),h:Math.abs(br.y-tl.y)};
  // a click on the head's screen center → vb coords → inside box?
  const cx=r.x+r.width/2, cy=r.y+r.height/2; const v=clientToVB(cx,cy);
  const inside = v.x>=box.x && v.x<=box.x+box.w && v.y>=box.y && v.y<=box.y+box.h;
  document.body.removeChild(wrap);
  return {boundingClientRectBox:box, clickCenterVB:v, clickInsideBox:inside, expected:'~18,18,164,164'};
},FACE.match(/<circle[\s\S]*<\/svg>/)[0].replace('</svg>',''));
console.log(JSON.stringify(out,null,2));
await b.close();
