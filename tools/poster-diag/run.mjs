// Isolated diagnostic runner for the empty-poster bug.
// Loads /poster-diag in headless chromium, reads window.__dd_posterDiag (classify
// receipts) + window.__dd_posterRender (full-pipeline render receipts), prints a
// per-region + per-style table. NO live-DB writes (the diag fixtures are inline
// markup, never published).
const PW = process.env.DD_PW || '/Users/sebs/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.js';
const pw = await import(PW);
const chromium = pw.chromium ?? pw.default?.chromium;

const BASE = process.env.DD_BASE || 'http://localhost:5182';

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 3 });
const logs = [];
page.on('console', (m) => logs.push(m.text()));
page.on('pageerror', (e) => logs.push('PAGEERROR ' + e.message));

await page.goto(`${BASE}/poster-diag`, { waitUntil: 'networkidle' });
// Wait for the effect to finish (it sets data-diag-ready=1).
await page.waitForSelector('[data-diag-ready="1"]', { timeout: 20000 }).catch(() => {});
await page.waitForTimeout(500);

const classify = await page.evaluate(() => window.__dd_posterDiag || null);
const render = await page.evaluate(() => window.__dd_posterRender || null);

console.log('\n========== CLASSIFY RECEIPTS ==========\n');
if (!classify) {
  console.log('NO __dd_posterDiag — page errors:');
  console.log(logs.filter((l) => /error|ERROR/i.test(l)).join('\n'));
} else {
  for (const r of classify) {
    const firings = (r.allFirings || [])
      .map((f) => `${f.id}→${f.fired.role}(${f.fired.confidence})`)
      .join(', ');
    console.log(
      `[${r.fixture}] ${r.region} tag=${r.tag} z=${r.zIndex} ` +
        `dark=${r.darknessL} encl=${r.enclosesSiblingCount} ` +
        `areaFrac=${r.areaFractionOfParent} containedIn=${r.containedInZIndex} ` +
        `area=${r.area}\n` +
        `    fill=${r.fill}\n` +
        `    => ROLE=${r.role} conf=${r.confidence} fired=[${r.firedRules}]\n` +
        `    allRules: ${firings}`,
    );
  }
}

console.log('\n========== RENDER RECEIPTS (dark-role groups per style) ==========\n');
if (!render) {
  console.log('NO __dd_posterRender');
} else {
  for (const r of render) {
    console.log(
      `[${r.fixture}] ${r.style}: totalSmartGroups=${r.totalSmartGroups} ` +
        `darkRoleGroups=${r.darkRoleGroupCount} darkPaths=${r.darkPathCount}`,
    );
    for (const rc of r.receipts) {
      console.log(
        `    fillStyle=${rc.fillStyle} gap=${rc.gap} weight=${rc.weight} ` +
          `cov=${rc.coverage} band=${rc.band} opacity=${rc.opacity} innerPaths=${rc.innerPaths}`,
      );
    }
  }
}

console.log('\n========== PAGE CONSOLE (errors only) ==========');
console.log(logs.filter((l) => /error|warn/i.test(l)).slice(0, 30).join('\n'));

// Screenshot the visible render host (Clean | rough | bold | sketchy grid).
const out = process.env.DD_SHOT || '/tmp/dd-poster-diag/board.png';
await import('node:fs').then((fs) => fs.mkdirSync('/tmp/dd-poster-diag', { recursive: true }));
const hostEl = await page.$('[data-render-host]');
if (hostEl) {
  await hostEl.screenshot({ path: out });
  console.log('\nSCREENSHOT =>', out);
}
// Per-fixture row screenshots at 3x for legible reading.
const rows = await page.$$('[data-fx-row]');
for (const r of rows) {
  const id = await r.getAttribute('data-fx-row');
  await r.screenshot({ path: `/tmp/dd-poster-diag/row-${id}.png` });
}
console.log('Per-row shots in /tmp/dd-poster-diag/row-*.png');

await browser.close();
