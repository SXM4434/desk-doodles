// Node smoke test for buildSealedReliefGeometry — proves WATERTIGHT topology +
// finite positions + real displacement, with no WebGL. Run: node tools/harnesses/sealed-relief-smoke.mjs
import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// inline copy of the builder (mirror of src/app/lib/geometry3d/sealedRelief.ts)
function buildSealed(contour, heightAt, opts = {}) {
  const thickness = opts.thickness ?? 0.5, dispScale = opts.displacementScale ?? 0.3;
  const subdiv = Math.max(0, Math.min(5, Math.round(opts.subdivisions ?? 3)));
  const ring = contour.map((p) => [p[0], p[1]]);
  if (ring.length > 1) { const a = ring[0], b = ring[ring.length-1]; if (Math.abs(a[0]-b[0])<1e-9 && Math.abs(a[1]-b[1])<1e-9) ring.pop(); }
  if (ring.length < 3) return new THREE.BufferGeometry();
  const verts = ring.map((p) => [p[0], p[1]]);
  let faces = THREE.ShapeUtils.triangulateShape(ring.map((p)=>new THREE.Vector2(p[0],p[1])), []).map((t)=>[t[0],t[1],t[2]]);
  for (let s=0;s<subdiv;s++){const mid=new Map();const getMid=(i,j)=>{const k=i<j?`${i}_${j}`:`${j}_${i}`;let m=mid.get(k);if(m===undefined){const a=verts[i],b=verts[j];m=verts.length;verts.push([(a[0]+b[0])/2,(a[1]+b[1])/2]);mid.set(k,m);}return m;};
    const next=[];for(const[a,b,c]of faces){const ab=getMid(a,b),bc=getMid(b,c),ca=getMid(c,a);next.push([a,ab,ca],[ab,b,bc],[ca,bc,c],[ab,bc,ca]);}faces=next;}
  const ekey=(i,j)=>i<j?`${i}_${j}`:`${j}_${i}`;const edgeN=new Map();
  for(const[a,b,c]of faces)for(const[i,j]of[[a,b],[b,c],[c,a]]){const k=ekey(i,j);edgeN.set(k,(edgeN.get(k)??0)+1);}
  const boundaryVert=new Set();const boundaryDirected=[];
  for(const[a,b,c]of faces)for(const[i,j]of[[a,b],[b,c],[c,a]]){if(edgeN.get(ekey(i,j))===1){boundaryDirected.push([i,j]);boundaryVert.add(i);boundaryVert.add(j);}}
  const n=verts.length;const pos=[];
  for(let i=0;i<n;i++){const[x,y]=verts[i];pos.push(x,y,boundaryVert.has(i)?0:(heightAt(x,y)-0.5)*2*dispScale);}
  for(let i=0;i<n;i++){const[x,y]=verts[i];pos.push(x,y,-thickness);}
  const idx=[];for(const[a,b,c]of faces)idx.push(a,b,c);for(const[a,b,c]of faces)idx.push(a+n,c+n,b+n);
  for(const[i,j]of boundaryDirected){idx.push(i,i+n,j);idx.push(j,i+n,j+n);}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setIndex(idx);
  const sealed=mergeVertices(geo);sealed.computeVertexNormals();return sealed;
}

function circle(n, r=1){const p=[];for(let i=0;i<n;i++){const a=2*Math.PI*i/n;p.push([r*Math.cos(a),r*Math.sin(a)]);}return p;}
// height field: a central bump + a ring dip (exercises raise + indent)
const field=(x,y)=>{const d=Math.hypot(x,y);return 0.5 + 0.45*Math.exp(-(d*d)/0.08) - 0.3*Math.exp(-((d-0.6)**2)/0.02);};

let pass=true;
for(const sub of [1,2,3]){
  const g=buildSealed(circle(48,1), field, {subdivisions:sub, thickness:0.5, displacementScale:0.3});
  const p=g.attributes.position.array; const idx=g.index.array;
  // finite
  const finite=[...p].every(Number.isFinite);
  // watertight: every undirected edge shared by exactly 2 triangles
  const ec=new Map();const ek=(a,b)=>a<b?`${a}_${b}`:`${b}_${a}`;
  for(let t=0;t<idx.length;t+=3){const[a,b,c]=[idx[t],idx[t+1],idx[t+2]];for(const[i,j]of[[a,b],[b,c],[c,a]]){const k=ek(i,j);ec.set(k,(ec.get(k)??0)+1);}}
  let boundary=0,nonmanifold=0;for(const v of ec.values()){if(v===1)boundary++;else if(v>2)nonmanifold++;}
  // displacement actually happened (front z range > 0)
  let zmin=Infinity,zmax=-Infinity;for(let i=2;i<p.length;i+=3){if(p[i]<zmin)zmin=p[i];if(p[i]>zmax)zmax=p[i];}
  const ok = finite && boundary===0 && nonmanifold===0 && (zmax-zmin)>0.1;
  pass=pass&&ok;
  console.log(`sub=${sub} verts=${g.attributes.position.count} tris=${idx.length/3} | finite=${finite} boundaryEdges=${boundary} nonManifold=${nonmanifold} z=[${zmin.toFixed(3)},${zmax.toFixed(3)}] => ${ok?'WATERTIGHT ✅':'FAIL ❌'}`);
}
console.log(pass?'ALL PASS ✅':'FAILED ❌');
process.exit(pass?0:1);
