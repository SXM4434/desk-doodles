// Verify TOP-DOWN desk physics on the LIVE desk with MINE objects (placed this
// session, so draggable). ON: a flung doodle keeps sliding after release then settles;
// dragging one into another knocks the other. Confirms grab→fling→sim→settle wiring.
import puppeteer from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: CHROME, headless: false, args: ['--window-size=1600,1050'], defaultViewport: { width: 1600, height: 1050 } });
const p = await b.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 140)));
await p.goto('http://localhost:5182/desk?demo=1', { waitUntil: 'networkidle2', timeout: 60000 });
await sleep(4000);
const click = (re) => p.evaluate((r) => { const x = [...document.querySelectorAll('button')].find((y) => new RegExp(r, 'i').test((y.textContent || '').trim())); if (x) { x.click(); return (x.textContent || '').trim(); } return null; }, re.source);
const placeUpload = async () => { await click(/add doodle/); await sleep(1200); await click(/upload svg/); await sleep(700); const fi = await p.$('input[type=file]'); if (fi) await fi.uploadFile('/tmp/dd-face-test.svg'); await sleep(2200); await click(/^done$/); await sleep(1200); await click(/place on desk/); await sleep(2200); };
await placeUpload();
await placeUpload();
const mineObjs = () => p.evaluate(() => [...document.querySelectorAll('div')].filter((d) => d.style.width === '180px' && d.style.height === '180px' && d.style.position === 'relative').map((d, i) => { const r = d.getBoundingClientRect(); return { i, cx: Math.round(r.x + r.width / 2), cy: Math.round(r.y + r.height / 2) }; }));

// turn physics ON
await click(/^physics/); await sleep(300);
const onText = await p.evaluate(() => { const x = [...document.querySelectorAll('button')].find((y) => /^physics/i.test((y.textContent || '').trim())); return x ? x.textContent.trim() : null; });
console.log('physics button now reads:', JSON.stringify(onText), onText && /on/i.test(onText) ? '(ON)' : '(?)');
await sleep(600);

let list = await mineObjs();
console.log('placed objects on desk:', list.length);
// pick the two most-recently-placed (mine) — usually the last two in DOM order
const A = list[list.length - 1];

// FLING test — drag fast then release; sample right after release + 700ms later.
await p.mouse.move(A.cx, A.cy); await p.mouse.down();
for (let k = 1; k <= 6; k++) { await p.mouse.move(A.cx + 240 * k / 6, A.cy - 30 * k / 6, { steps: 1 }); await sleep(9); }
await p.mouse.up();
const rel = (await mineObjs())[A.i];
await sleep(750);
const rest = (await mineObjs())[A.i];
const slide = rel && rest ? Math.hypot(rest.cx - rel.cx, rest.cy - rel.cy) : 0;
console.log(`FLING  at-release cx=${rel?.cx},cy=${rel?.cy} → +750ms cx=${rest?.cx},cy=${rest?.cy}  post-release slide=${slide.toFixed(0)}px  → ${slide > 12 ? 'OK (sim drove it after release)' : 'FAIL (no slide)'}`);

// COLLISION — drag one object THROUGH the other; the other should get knocked.
const pre = await mineObjs();
const mover = pre[pre.length - 1];
const target = pre[pre.length - 2];
const t0 = { cx: target.cx, cy: target.cy };
await p.mouse.move(mover.cx, mover.cy); await p.mouse.down();
for (let k = 1; k <= 12; k++) { const x = mover.cx + (target.cx - mover.cx) * k / 12; const y = mover.cy + (target.cy - mover.cy) * k / 12; await p.mouse.move(x, y, { steps: 1 }); await sleep(12); }
await p.mouse.up(); await sleep(800);
const tAfter = (await mineObjs())[target.i];
const knock = tAfter ? Math.hypot(tAfter.cx - t0.cx, tAfter.cy - t0.cy) : 0;
console.log(`COLLISION  drove object into neighbour → neighbour moved ${knock.toFixed(0)}px  → ${knock > 12 ? 'OK (real collision)' : 'FAIL (no knock)'}`);

await p.screenshot({ path: '/tmp/dd-shots/physics-live.png' });
console.log('\npage errors:', errs.filter((e) => !/Supabase|RPC|400|404|v5/i.test(e)).slice(0, 6));
await b.close();
