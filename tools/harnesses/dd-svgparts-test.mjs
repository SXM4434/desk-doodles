// Validate the svgToParts approach on REAL catalog SVGs in a real browser:
// parts extract, fills PRESERVED (lossless), data-part-id added, bboxes sane.
// Runs the same DOM logic as src/app/lib/svgToParts.ts inline (module isn't
// bundled standalone) — same logic ⇒ validates the approach.
import puppeteer from 'puppeteer-core';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: CHROME, headless: true });
const p = await b.newPage();
await p.goto('about:blank');

const root = '/tmp/bigdaddy';
const all = readdirSync(root).filter((o) => existsSync(`${root}/${o}/svg-upload/_source.svg`));
// pick a spread + the messiest few (mechKeyboard etc.)
const pick = ['pokeball', 'gameBoy', 'mechKeyboard', 'komboloi', 'arepaPan', 'vinyl', 'macbook', 'dvdSpine'].filter((o) => all.includes(o));

const partsLogic = `
const GEOM='path, line, polyline, polygon, rect, circle, ellipse';
function readVB(svg){const vb=svg.getAttribute('viewBox');if(vb){const p=vb.trim().split(/[\\s,]+/).map(Number);if(p.length===4&&p.every(Number.isFinite)&&p[2]>0&&p[3]>0)return{x:p[0],y:p[1],w:p[2],h:p[3]};}const w=parseFloat(svg.getAttribute('width')||''),h=parseFloat(svg.getAttribute('height')||'');if(w>0&&h>0)return{x:0,y:0,w,h};return null;}
function bboxVB(el){let b;try{b=el.getBBox()}catch{return null}const m=el.getCTM();const cs=[[b.x,b.y],[b.x+b.width,b.y],[b.x,b.y+b.height],[b.x+b.width,b.y+b.height]].map(([x,y])=>m?{x:m.a*x+m.c*y+m.e,y:m.b*x+m.d*y+m.f}:{x,y});const xs=cs.map(c=>c.x),ys=cs.map(c=>c.y);return{x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)};}
function svgToParts(markup){
  const doc=new DOMParser().parseFromString(markup,'image/svg+xml');
  if(doc.querySelector('parsererror'))return null;
  const svg=doc.querySelector('svg'); if(!svg)return null;
  const vb=readVB(svg); if(!vb)return null;
  const host=document.createElement('div'); host.style.cssText='position:absolute;left:-99999px;top:-99999px;opacity:0';
  const m=doc.documentElement.cloneNode(true); m.setAttribute('width',vb.w); m.setAttribute('height',vb.h); m.setAttribute('viewBox',vb.x+' '+vb.y+' '+vb.w+' '+vb.h);
  host.appendChild(m); document.body.appendChild(host);
  const parts=[];
  try{
    const els=[...m.querySelectorAll(GEOM)];
    for(let i=0;i<els.length&&parts.length<60;i++){const el=els[i];const bb=bboxVB(el);if(!bb||(bb.w<0.01&&bb.h<0.01))continue;const id='part-'+i;el.setAttribute('data-part-id',id);let fill='',stroke='';try{const c=getComputedStyle(el);fill=c.fill;stroke=c.stroke}catch{}parts.push({id,tag:el.tagName.toLowerCase(),bbox:bb,fill,stroke});}
  }finally{document.body.removeChild(host)}
  return{parts,viewBox:vb,markup:new XMLSerializer().serializeToString(m)};
}
`;

const results = [];
for (const obj of pick) {
  const markup = readFileSync(`${root}/${obj}/svg-upload/_source.svg`, 'utf8');
  const origFills = [...new Set((markup.match(/fill="[^"]*"/g) || []).map((s) => s.slice(6, -1)))];
  const r = await p.evaluate((logic, mk, origFillsIn) => {
    eval(logic);
    const res = svgToParts(mk);
    if (!res) return { ok: false };
    const distinctFills = [...new Set(res.parts.map((p) => p.fill))];
    // lossless check: every original fill value still present in the output markup
    const lost = origFillsIn.filter((f) => f && f !== 'none' && !res.markup.includes('fill="' + f + '"') && !res.markup.includes(f));
    const allTagged = res.parts.every((p) => res.markup.includes('data-part-id="' + p.id + '"'));
    const saneBoxes = res.parts.every((p) => p.bbox.w >= 0 && p.bbox.h >= 0 && Number.isFinite(p.bbox.x));
    return { ok: true, n: res.parts.length, distinctFills, fillsLost: lost, allTagged, saneBoxes };
  }, partsLogic, markup, origFills);
  results.push({ obj, origFills: origFills.length, ...r });
  console.log(`${obj.padEnd(13)} parts=${r.n ?? '-'}  distinctFills=${(r.distinctFills || []).length}  fillsLost=${(r.fillsLost || []).length}  tagged=${r.allTagged}  boxesSane=${r.saneBoxes}`);
}
const anyLost = results.some((r) => (r.fillsLost || []).length > 0);
const allTagged = results.every((r) => r.allTagged);
console.log(`\nLOSSLESS: ${anyLost ? '✗ some fills lost' : '✓ no fills lost across all'}  |  all parts tagged: ${allTagged}`);
await b.close();
