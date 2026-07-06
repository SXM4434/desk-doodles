// DD-DIAG self-check: confirm the /audit dd-diag console mechanism is live.
// The audit page sets window.__dd_diag=true in a mount effect; the
// SvgStyleTransform render path emits `[dd-diag] renderHandFeelShape ...`
// on every shape render WHEN that flag is true. Because the flag is set
// after first paint, logs appear on the NEXT render. We force a re-render
// by twisting a control (a <select> in the Controls panel) and assert the
// [dd-diag] lines fire.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let chromium;
for (const p of [
  '/tmp/dd-pp/node_modules/playwright',
  '/Users/sebs/Desktop/Projects/portfolio/tools/lab-screenshots/node_modules/playwright',
  '/opt/homebrew/lib/node_modules/playwright',
]) {
  try { ({ chromium } = require(p)); break; } catch { /* next */ }
}
if (!chromium) { console.error('no playwright'); process.exit(2); }

const BASE = 'http://127.0.0.1:5251';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

const ddLogs = [];
const errors = [];
page.on('console', (m) => {
  let t; try { t = m.text(); } catch { t = ''; }
  if (t.includes('[dd-diag]')) ddLogs.push(t);
  if (m.type() === 'error') errors.push(t);
});
page.on('pageerror', (e) => errors.push(String(e)));

await page.goto(BASE + '/audit', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(1500);

const flagSet = await page.evaluate(() => !!(window).__dd_diag);

// Force a re-render by twisting a controlled <input type="range"> slider in the
// Controls panel. The chrome uses a custom Dropdown (button+popover, no native
// <select>), so range inputs are the reliable React-controlled trigger. We set
// .value via the native setter + dispatch input+change so React's onChange fires.
const rangeCount = await page.evaluate(() => document.querySelectorAll('input[type=range]').length);
const sliderDriven = await page.evaluate(() => {
  const el = document.querySelector('input[type=range]');
  if (!el) return false;
  const proto = Object.getPrototypeOf(el);
  const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
  const min = parseFloat(el.min || '0');
  const max = parseFloat(el.max || '1');
  const cur = parseFloat(el.value);
  // pick a different in-range value
  const next = cur !== max ? max : min;
  setter.call(el, String(next));
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
});
await page.waitForTimeout(2500);

await browser.close();
console.log(JSON.stringify({
  flagSet,
  rangeCount,
  sliderDriven,
  ddDiagLogCount: ddLogs.length,
  ddDiagSample: ddLogs.slice(0, 3),
  errorCount: errors.length,
  errors: errors.slice(0, 5),
  PASS: flagSet === true && ddLogs.length > 0 && errors.length === 0,
}, null, 2));
