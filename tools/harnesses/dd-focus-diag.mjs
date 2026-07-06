// DIAGNOSE the focus-mode "spotlight"/lift on a doodle tap. Click a desk object,
// then sample the focus panel's computed transform + opacity + the scrim opacity
// every frame for ~800ms, and screenshot the open sequence. Tells us: does the card
// start COLLAPSED and grow? does it grow FROM the tapped doodle (translate) or just
// zoom from center? is the scrim visible? — so we fix the real cause, not a guess.
import puppeteer from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: CHROME, headless: false, args: ['--window-size=1500,1000'], defaultViewport: { width: 1500, height: 1000 } });
const p = await b.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 140)));
await p.goto('http://localhost:5182/desk?demo=1', { waitUntil: 'networkidle2', timeout: 60000 });
await sleep(4500);

// find a desk object to tap (the 180px object boxes)
const boxes = await p.evaluate(() => [...document.querySelectorAll('div')].filter((d) => d.style.width === '180px' && d.style.height === '180px' && d.style.position === 'relative').map((d) => { const r = d.getBoundingClientRect(); return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) }; }));
console.log('desk object boxes:', boxes.length);
if (!boxes.length) { console.log('no desk objects to tap'); await b.close(); process.exit(1); }
const tap = boxes[Math.min(2, boxes.length - 1)];
console.log('tapping doodle at screen', tap);

// expose a sampler that finds the focus panel (the div whose transition uses the
// 0.46s expo-out cubic-bezier) + the scrim (fixed inset-0 with the dim background).
await p.exposeFunction('noop', () => {});
const startSampling = () => p.evaluate(() => {
  window.__focusSamples = [];
  const findPanel = () => [...document.querySelectorAll('div')].find((d) => /transform 0\.44s|cubic-bezier\(0\.33/.test(d.style.transition || '') || /transform 0\.4/.test(getComputedStyle(d).transition || ''));
  const findScrim = () => [...document.querySelectorAll('div')].find((d) => { const s = getComputedStyle(d); return s.position === 'fixed' && s.inset === '0px' && parseInt(s.zIndex) >= 300; });
  const t0 = performance.now();
  const tick = () => {
    const panel = findPanel(); const scrim = findScrim();
    if (panel) { const cs = getComputedStyle(panel); window.__focusSamples.push({ t: Math.round(performance.now() - t0), tf: cs.transform, op: cs.opacity, scrimOp: scrim ? getComputedStyle(scrim).opacity : null }); }
    if (performance.now() - t0 < 850) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
});

// click + immediately start sampling, capture a screenshot burst
await p.mouse.move(tap.x, tap.y); await p.mouse.down(); await sleep(20); await p.mouse.up();
await startSampling();
const shots = [];
for (const t of [0, 50, 110, 180, 280, 420, 650]) { await sleep(t === 0 ? 0 : 1); /* align */ }
// capture frames at intervals
const times = [30, 80, 140, 220, 320, 460, 700];
let prev = 0;
for (const t of times) { await sleep(t - prev); prev = t; await p.screenshot({ path: `/tmp/dd-shots/focus-${String(t).padStart(3, '0')}.png` }); }
await sleep(200);
const samples = await p.evaluate(() => window.__focusSamples || []);
console.log(`\nsamples: ${samples.length}`);
// decode scale from the matrix (first value) for a quick read
const scaleOf = (tf) => { if (!tf || tf === 'none') return 1; const m = tf.match(/matrix\(([^)]+)\)/); if (m) return +m[1].split(',')[0]; const m3 = tf.match(/matrix3d\(([^)]+)\)/); if (m3) return +m3[1].split(',')[0]; return null; };
const txOf = (tf) => { if (!tf || tf === 'none') return 0; const m = tf.match(/matrix\(([^)]+)\)/); if (m) return Math.round(+m[1].split(',')[4]); return 0; };
const rows = samples.filter((_, i) => i % 2 === 0).slice(0, 18);
console.log('  t(ms)  scale   txPx   cardOp  scrimOp');
for (const s of rows) console.log(`  ${String(s.t).padStart(4)}   ${String((scaleOf(s.tf) ?? 0).toFixed(3)).padStart(5)}  ${String(txOf(s.tf)).padStart(5)}   ${s.op.slice(0, 4).padStart(4)}    ${(s.scrimOp || '-').slice(0, 4)}`);
const scales = samples.map((s) => scaleOf(s.tf)).filter((v) => v != null);
const minScale = Math.min(...scales), maxScale = Math.max(...scales);
console.log(`\n  scale range: ${minScale.toFixed(3)} → ${maxScale.toFixed(3)}  (collapsed-start = ${minScale < 0.4 ? 'YES animates' : 'NO — starts large, no grow'})`);
const txs = samples.map((s) => txOf(s.tf));
console.log(`  translateX range: ${Math.min(...txs)} → ${Math.max(...txs)}  (origin offset = ${Math.max(...txs.map(Math.abs)) > 40 ? 'YES grows from doodle' : 'NO — from center'})`);
console.log('\npage errors:', errs.filter((e) => !/Supabase|RPC|400|404|v5/i.test(e)).slice(0, 5));
console.log('frames: /tmp/dd-shots/focus-*.png');
await b.close();
