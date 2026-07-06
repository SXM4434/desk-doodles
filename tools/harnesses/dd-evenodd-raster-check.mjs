import puppeteer from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: CHROME, headless: false, defaultViewport: { width: 800, height: 600 } });
const p = await b.newPage();
await p.goto('http://localhost:5182/canvas', { waitUntil: 'networkidle2', timeout: 60000 });
await sleep(2500);
const R = 100, cx = 150, cy = 150;
const pts = [];
for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * (4 * Math.PI / 5); pts.push([+(cx + R * Math.cos(a)).toFixed(2), +(cy + R * Math.sin(a)).toFixed(2)]); }
const d = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ') + ' Z';
const out = await p.evaluate((d) => {
  const cv = document.createElement('canvas'); cv.width = 300; cv.height = 300;
  const c = cv.getContext('2d', { willReadFrequently: true });
  c.fillStyle = '#000'; c.fillRect(0, 0, 300, 300);
  c.fillStyle = '#fff';
  const p2 = new Path2D(d);
  c.fill(p2, 'evenodd');
  const center = c.getImageData(150, 150, 1, 1).data[0]; // R at the star center
  const arm = c.getImageData(150, 60, 1, 1).data[0];     // R inside the top arm
  // also nonzero for contrast
  const cv2 = document.createElement('canvas'); cv2.width = 300; cv2.height = 300;
  const c2 = cv2.getContext('2d', { willReadFrequently: true });
  c2.fillStyle = '#000'; c2.fillRect(0, 0, 300, 300); c2.fillStyle = '#fff';
  c2.fill(new Path2D(d), 'nonzero');
  const centerNZ = c2.getImageData(150, 150, 1, 1).data[0];
  return { evenoddCenter: center, evenoddArm: arm, nonzeroCenter: centerNZ };
}, d);
console.log('raster:', JSON.stringify(out));
console.log('evenodd center empty?', out.evenoddCenter < 50 ? 'YES (hole)' : 'NO (filled)');
await b.close();
