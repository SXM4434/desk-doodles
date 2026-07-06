// Clean live COLLISION check: 2 mine objects, physics ON, drag one SLOWLY straight
// into the other; the other must get pushed (solid hull colliders can't overlap).
import puppeteer from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: CHROME, headless: false, args: ['--window-size=1600,1050'], defaultViewport: { width: 1600, height: 1050 } });
const p = await b.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 140)));
await p.goto('http://localhost:5182/desk?demo=1', { waitUntil: 'networkidle2', timeout: 60000 });
await sleep(4000);
const click = (re) => p.evaluate((r) => { const x = [...document.querySelectorAll('button')].find((y) => new RegExp(r, 'i').test((y.textContent || '').trim())); if (x) { x.click(); return true; } return false; }, re.source);
const place = async () => { await click(/add doodle/); await sleep(1100); await click(/upload svg/); await sleep(600); const fi = await p.$('input[type=file]'); if (fi) await fi.uploadFile('/tmp/dd-face-test.svg'); await sleep(2000); await click(/^done$/); await sleep(1100); await click(/place on desk/); await sleep(2000); };
await place(); await place();
const objs = () => p.evaluate(() => [...document.querySelectorAll('div')].filter((d) => d.style.width === '180px' && d.style.height === '180px' && d.style.position === 'relative').map((d, i) => { const r = d.getBoundingClientRect(); return { i, cx: Math.round(r.x + r.width / 2), cy: Math.round(r.y + r.height / 2) }; }));
await click(/^physics/); await sleep(700);
const list = await objs();
// A = the LAST-placed object (mine → actually draggable); B = its nearest neighbour.
const A = list[list.length - 1];
let B = null;
for (const o of list) { if (o.i === A.i) continue; const d = Math.hypot(o.cx - A.cx, o.cy - A.cy); if (!B || d < B.d) B = { ...o, d }; }
console.log(`mover(mine) object[${A.i}] @(${A.cx},${A.cy}) → nearest object[${B.i}] @(${B.cx},${B.cy})  ${B.d.toFixed(0)}px apart`);
const b0 = { cx: B.cx, cy: B.cy };
// drag A slowly straight onto B's centre
await p.mouse.move(A.cx, A.cy); await p.mouse.down();
const STEPS = 24;
for (let k = 1; k <= STEPS; k++) { await p.mouse.move(A.cx + (B.cx - A.cx) * k / STEPS, A.cy + (B.cy - A.cy) * k / STEPS, { steps: 1 }); await sleep(22); }
await sleep(150);
const bMid = (await objs()).find((o) => o.i === B.i);
await p.mouse.up(); await sleep(700);
const knock = bMid ? Math.hypot(bMid.cx - b0.cx, bMid.cy - b0.cy) : 0;
console.log(`drove object[${A.i}] onto object[${B.i}] → it was pushed ${knock.toFixed(0)}px  → ${knock > 15 ? 'OK — REAL COLLISION' : 'no push'}`);
await p.screenshot({ path: '/tmp/dd-shots/physics-collide.png' });
console.log('page errors:', errs.filter((e) => !/Supabase|RPC|400|404|v5/i.test(e)).slice(0, 4));
await b.close();
