// Validate the desk physics engine + tuning (top-down, no gravity): overlapping
// bodies push apart, a fling slides then settles, a lone body never drifts.
import RAPIER from '@dimforge/rapier2d-compat';
await RAPIER.init();
const PX = 0.05;
const world = new RAPIER.World({ x: 0, y: 0 });
const add = (x, y, w = 180, h = 180) => {
  const bd = RAPIER.RigidBodyDesc.dynamic().setTranslation(x * PX, y * PX).setLinearDamping(3.2).setAngularDamping(4);
  const b = world.createRigidBody(bd);
  const cd = RAPIER.ColliderDesc.cuboid((w / 2) * PX, (h / 2) * PX).setRestitution(0.16).setFriction(0.9).setDensity(1);
  world.createCollider(cd, b);
  return b;
};
const px = (b) => ({ x: b.translation().x / PX, y: b.translation().y / PX, v: Math.hypot(b.linvel().x, b.linvel().y) / PX });

// 1) COLLISION — two boxes overlapping by 120px should shove apart to ≥180 gap.
const a = add(500, 500), b = add(560, 500);
for (let i = 0; i < 300; i++) world.step();
const A = px(a), B = px(b), gap = Math.abs(B.x - A.x);
console.log(`1) COLLISION  gap=${gap.toFixed(0)}px (need ≥~178)  settled v=${A.v.toFixed(1)}px/s  → ${gap >= 175 && A.v < 2 ? 'OK' : 'FAIL'}`);

// 2) DRIFT — a lone untouched body must stay put (no gravity).
const c = add(1200, 300);
const c0 = px(c);
for (let i = 0; i < 200; i++) world.step();
const c1 = px(c);
const drift = Math.hypot(c1.x - c0.x, c1.y - c0.y);
console.log(`2) NO-DRIFT  moved=${drift.toFixed(2)}px (need ~0)  → ${drift < 0.5 ? 'OK' : 'FAIL'}`);

// 3) FLING — a flung body slides a meaningful distance then comes to REST.
const d = add(200, 1200);
const d0 = px(d);
d.setLinvel({ x: 1500 * PX, y: 0 }, true); // ~1500 px/s fling
let frames = 0;
for (let i = 0; i < 600; i++) { world.step(); frames++; if (px(d).v < 2) break; }
const d1 = px(d);
const slid = Math.hypot(d1.x - d0.x, d1.y - d0.y);
console.log(`3) FLING  slid=${slid.toFixed(0)}px, rest after ${(frames / 60).toFixed(2)}s, final v=${d1.v.toFixed(1)}px/s  → ${slid > 150 && d1.v < 2 ? 'OK' : 'FAIL'}`);

// 4) GRAB→SHOVE — a kinematic body driven through a neighbour pushes it away.
const g = add(2000, 2000), n = add(2200, 2000); // 200px apart
g.setBodyType(RAPIER.RigidBodyType.KinematicPositionBased, true);
const n0 = px(n);
for (let i = 0; i < 60; i++) { g.setNextKinematicTranslation({ x: (2000 + i * 4) * PX, y: 2000 * PX }); world.step(); } // drive g right into n
const n1 = px(n);
console.log(`4) SHOVE  neighbour moved=${(n1.x - n0.x).toFixed(0)}px when grabbed body driven into it  → ${n1.x - n0.x > 30 ? 'OK' : 'FAIL'}`);

console.log('\nrapier2d-compat loaded + stepped cleanly in node.');
world.free();
