import puppeteer from 'puppeteer-core';
const CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const b=await puppeteer.launch({executablePath:CHROME,headless:true});
const p=await b.newPage();
await p.goto('about:blank');
const FACE=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><circle cx="100" cy="100" r="82" fill="#ccc" stroke="#333" stroke-width="3"/><circle cx="72" cy="82" r="13" fill="#333"/><circle cx="128" cy="82" r="13" fill="#333"/><path d="M62 128 Q100 165 138 128" fill="none" stroke="#333" stroke-width="6"/></svg>`;
const out=await p.evaluate((FACE)=>{
  // --- svgToParts (inline, same logic) ---
  function bboxVB(el){const b=el.getBBox();const m=el.getCTM();const cs=[[b.x,b.y],[b.x+b.width,b.y],[b.x,b.y+b.height],[b.x+b.width,b.y+b.height]].map(([x,y])=>m?{x:m.a*x+m.c*y+m.e,y:m.b*x+m.d*y+m.f}:{x,y});const xs=cs.map(c=>c.x),ys=cs.map(c=>c.y);return{x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)};}
  const doc=new DOMParser().parseFromString(FACE,'image/svg+xml');
  const vb={x:0,y:0,w:200,h:200};
  const host1=document.createElement('div');host1.style.cssText='position:absolute;left:-99999px;top:-99999px;opacity:0';
  const mount=doc.documentElement.cloneNode(true);mount.setAttribute('width',vb.w);mount.setAttribute('height',vb.h);mount.setAttribute('viewBox','0 0 200 200');
  host1.appendChild(mount);document.body.appendChild(host1);
  const els=[...mount.querySelectorAll('circle,path')];
  const parts=els.map((el,i)=>{el.setAttribute('data-part-id','part-'+i);return{id:'part-'+i,tag:el.tagName,bbox:bboxVB(el)};});
  const inner=mount.innerHTML;
  document.body.removeChild(host1);
  // --- app-like render: outer svg 800x600 > nested svg(viewBox 0 0 200 200, xMidYMid meet) > g > parts ---
  const wrap=document.createElement('div');wrap.style.cssText='position:absolute;left:0;top:0;width:800px;height:600px';
  wrap.innerHTML=`<svg width="800" height="600" viewBox="0 0 800 600"><svg id="nested" x="0" y="0" width="800" height="600" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet"><g>${inner}</g></svg></svg>`;
  document.body.appendChild(wrap);
  const nested=document.getElementById('nested');
  // for the head circle (part-0): precomputed bbox vs LIVE bbox-in-nested-space
  const head=nested.querySelector('[data-part-id="part-0"]');
  const liveBB=head.getBBox();const liveM=head.getCTM();
  const liveCorner={x:liveM.a*liveBB.x+liveM.c*liveBB.y+liveM.e, y:liveM.b*liveBB.x+liveM.d*liveBB.y+liveM.f};
  // screen point at the head's visual center, then convert back via nested.getScreenCTM().inverse()
  const screenCTM=nested.getScreenCTM();
  const rect=head.getBoundingClientRect();
  const sx=rect.x+rect.width/2, sy=rect.y+rect.height/2;
  const inv=screenCTM.inverse();const vClick={x:inv.a*sx+inv.c*sy+inv.e, y:inv.b*sx+inv.d*sy+inv.f};
  document.body.removeChild(wrap);
  return {precomputedHeadBBox:parts[0].bbox, liveHeadTopLeft:liveCorner, clickCenterInVB:vClick, headBoundingRect:{x:rect.x,y:rect.y,w:rect.width,h:rect.height}};
},FACE);
console.log(JSON.stringify(out,null,2));
await b.close();
