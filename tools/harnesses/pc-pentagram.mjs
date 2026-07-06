import pc from 'polygon-clipping';
// A 5-point pentagram as ONE self-intersecting ring (star order: skip-one vertices).
const cx=0, cy=0, R=100;
const outer=[];
for(let i=0;i<5;i++){const a=-Math.PI/2 + i*(4*Math.PI/5); outer.push([+(cx+R*Math.cos(a)).toFixed(2), +(cy+R*Math.sin(a)).toFixed(2)]);}
outer.push(outer[0]);
console.log('ring:', JSON.stringify(outer));
// union of the single self-intersecting ring — does PC give even-odd (pentagon hole) or solid?
const u = pc.union([outer]);
console.log('union polys:', u.length, 'rings in poly0:', u[0]?.length);
// each poly = [outerRing, hole1, ...]; >1 ring => a hole exists (even-odd pentagon)
for(const poly of u){ console.log('  poly rings lengths:', poly.map(r=>r.length)); }
// also try xor of the ring with itself-empty (i.e. treat as evenodd self)
try { const x = pc.xor([outer]); console.log('xor polys:', x.length, 'rings:', x[0]?.map(r=>r.length)); } catch(e){ console.log('xor err', e.message); }
