// ROCK B RESILIENCE BATTERY — panel boundaries · degrade-to-raw · realtime
// delete/move · wireframe removal. Run with the dev server on :5182:
//   node tools/rockb/resilience-battery.mjs
//
// LIVE-DB RULES honored:
//   - Phases 0–D NEVER write to the DB. Realtime delete/move handler proof is
//     UNIT-STYLE: synthetic postgres_changes payloads fired through the SAME
//     channel binding callbacks the socket would invoke (the page's local
//     state mutates; a reload restores DB truth — asserted).
//   - Phase E is the ONE sanctioned self-owned UI row: context A publishes
//     via the real Add-doodle flow, drags it (UI), deletes it (UI Delete
//     pill); context B watches the row arrive/move/vanish over TRUE realtime.
//
// Screenshots land in /tmp/dd-rockb/ — every one is READ by the agent.

import { createRequire } from 'node:module';
import fs from 'node:fs';

const require = createRequire(import.meta.url);
const { chromium } = require('/Users/sebs/Desktop/Projects/portfolio/tools/lab-screenshots/node_modules/playwright');

const BASE = process.env.DD_BASE || 'http://localhost:5182';
const OUT = '/tmp/dd-rockb';
fs.mkdirSync(OUT, { recursive: true });

const results = [];
function record(id, desc, pass, note = '') {
  results.push({ id, desc, pass, note });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${id}  ${desc}${note ? ` — ${note}` : ''}`);
}

const OBJ_SEL = 'main div[style*="cursor: grab"]';

function watchPage(page, tag) {
  const log = { degradeWarns: 0, boundaryWarns: 0, pageErrors: [], consoleErrors: [] };
  page.on('console', (msg) => {
    const t = msg.text();
    if (t.includes('style engine threw')) log.degradeWarns++;
    if (t.includes('[PanelBoundary:')) log.boundaryWarns++;
    if (msg.type() === 'error') log.consoleErrors.push(t.slice(0, 160));
  });
  page.on('pageerror', (err) => log.pageErrors.push(String(err).slice(0, 160)));
  page._ddlog = log;
  page._ddtag = tag;
  return log;
}

async function gotoDesk(page) {
  await page.goto(`${BASE}/desk`, { waitUntil: 'networkidle' });
  // wait for the feed: either Live chip or objects present
  await page.waitForFunction(
    () => /● live|○ (connecting|offline)/i.test(document.body.innerText),
    { timeout: 20000 },
  );
  await page.waitForTimeout(1500); // let the rough.js pipeline settle
}

async function objCount(page) {
  return page.locator(OBJ_SEL).count();
}

/** Fire a synthetic postgres_changes payload through the live channel
 *  binding callbacks (the exact closures publish.ts registered). */
async function fireSynthetic(page, eventType, payloadPartial) {
  return page.evaluate(
    async ({ eventType, payloadPartial }) => {
      const m = await import('/src/app/lib/supabase.ts');
      const chans = m.supabase.getChannels();
      const fired = [];
      for (const ch of chans) {
        const bindings = (ch.bindings && ch.bindings.postgres_changes) || [];
        for (const b of bindings) {
          const ev = String((b.filter && b.filter.event) || '').toUpperCase();
          if (ev === eventType) {
            b.callback({
              schema: 'public',
              table: 'doodles',
              commit_timestamp: new Date().toISOString(),
              errors: null,
              eventType,
              new: {},
              old: {},
              ...payloadPartial,
            });
            fired.push(`${ch.topic}:${ev}`);
          }
        }
      }
      return fired;
    },
    { eventType, payloadPartial },
  );
}

/** Read one real row of the currently-viewed desk (read-only). */
async function pickRealRow(page) {
  return page.evaluate(async () => {
    const m = await import('/src/app/lib/publish.ts');
    const desk = await m.getOpenDesk();
    const rows = desk ? await m.listDoodlesForDesk(desk.id) : await m.listDoodles();
    return { deskId: desk ? desk.id : null, rows: rows.slice(0, 8) };
  });
}

async function wrapperAt(page, x) {
  return page.evaluate((x) => {
    const els = Array.from(document.querySelectorAll('main div[style*="cursor: grab"]'));
    const hit = els.find((el) => el.style.left === `${x}px`);
    if (!hit) return null;
    const styleEl = hit.querySelector('[data-svg-style]');
    return {
      left: hit.style.left,
      top: hit.style.top,
      svgStyle: styleEl ? styleEl.getAttribute('data-svg-style') : null,
      hasSvg: !!hit.querySelector('svg'),
    };
  }, x);
}

const ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null;
const runPhase = (k) => !ONLY || ONLY.includes(k);

(async () => {
  const browser = await chromium.launch();

  // ════ PHASE 0 — BASELINE ══════════════════════════════════════════════════
  let baselineCount;
  {
    const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
    const page = await ctx.newPage();
    const log = watchPage(page, 'baseline');
    await gotoDesk(page);
    baselineCount = await objCount(page);
    await page.screenshot({ path: `${OUT}/00-baseline.png` });
    record('0.1', 'baseline /desk loads with objects', baselineCount > 0, `${baselineCount} objects`);
    record('0.2', 'baseline: zero degrade warns, zero page errors',
      log.degradeWarns === 0 && log.pageErrors.length === 0,
      `degradeWarns=${log.degradeWarns} pageErrors=${log.pageErrors.length}`);
    await ctx.close();
  }

  // ════ PHASE A — PANEL DEATHS (desk must survive) ══════════════════════════
  // A1 drawer
  if (runPhase('A')) {
    const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
    const page = await ctx.newPage();
    watchPage(page, 'a1');
    await page.addInitScript(() => {
      localStorage.setItem('dd.panel.desk.drawer', '1');
      window.__dd_crashPanel = 'drawer';
    });
    await gotoDesk(page);
    const fb = await page.getByText('This panel hit a snag').count();
    const alive = await objCount(page);
    await page.screenshot({ path: `${OUT}/01-drawer-dead.png` });
    record('A1.1', 'drawer crash → fallback shown, desk survives',
      fb >= 1 && alive === baselineCount, `fallback=${fb} objects=${alive}/${baselineCount}`);
    // retry path
    await page.evaluate(() => { window.__dd_crashPanel = undefined; });
    await page.getByRole('button', { name: /reload panel/i }).click();
    await page.waitForTimeout(1200);
    const fbGone = await page.getByText('This panel hit a snag').count();
    await page.screenshot({ path: `${OUT}/02-drawer-retried.png` });
    record('A1.2', 'drawer Reload panel → panel restored', fbGone === 0, '');
    await ctx.close();
  }

  // A2 pen panel
  if (runPhase('A')) {
    const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
    const page = await ctx.newPage();
    watchPage(page, 'a2');
    await page.addInitScript(() => { window.__dd_crashPanel = 'pen-panel'; });
    await gotoDesk(page);
    const fb = await page.getByText('This panel hit a snag').count();
    const alive = await objCount(page);
    await page.screenshot({ path: `${OUT}/03-pen-dead.png` });
    record('A2.1', 'pen-panel crash → fallback shown, desk survives',
      fb >= 1 && alive === baselineCount, `fallback=${fb} objects=${alive}/${baselineCount}`);
    await page.evaluate(() => { window.__dd_crashPanel = undefined; });
    await page.getByRole('button', { name: /reload panel/i }).click();
    await page.waitForTimeout(1500);
    const preview = await page.getByText('Preview', { exact: true }).count();
    await page.screenshot({ path: `${OUT}/04-pen-retried.png` });
    record('A2.2', 'pen-panel Reload → preview squiggle + chrome back', preview >= 1, '');
    await ctx.close();
  }

  // A3 draw popup (Close pill + reopen + Reload pill)
  if (runPhase('A')) {
    const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
    const page = await ctx.newPage();
    watchPage(page, 'a3');
    await page.addInitScript(() => { window.__dd_crashPanel = 'draw-popup'; });
    await gotoDesk(page);
    await page.getByRole('button', { name: /add doodle/i }).click();
    await page.waitForTimeout(600);
    const fb = await page.getByText('This panel hit a snag').count();
    const alive = await objCount(page);
    await page.screenshot({ path: `${OUT}/05-popup-dead.png` });
    record('A3.1', 'draw-popup crash → centered fallback, desk survives',
      fb >= 1 && alive === baselineCount, `fallback=${fb} objects=${alive}/${baselineCount}`);
    // Close pill dismisses
    await page.getByRole('button', { name: /^close$/i }).click();
    await page.waitForTimeout(400);
    const closed = await page.getByText('This panel hit a snag').count();
    record('A3.2', 'draw-popup fallback Close → dismissed', closed === 0, '');
    // crash again, then Reload pill remounts a real draw session
    await page.getByRole('button', { name: /add doodle/i }).click();
    await page.waitForTimeout(400);
    await page.evaluate(() => { window.__dd_crashPanel = undefined; });
    await page.getByRole('button', { name: /reload panel/i }).click();
    await page.waitForTimeout(800);
    const dialog = await page.getByRole('dialog', { name: 'Draw a doodle' }).count();
    await page.screenshot({ path: `${OUT}/06-popup-retried.png` });
    record('A3.3', 'draw-popup Reload panel → real draw dialog mounts', dialog === 1, '');
    await ctx.close();
  }

  // A4 object surface (sandbox on a foreign object — read-only)
  if (runPhase('A')) {
    const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
    const page = await ctx.newPage();
    watchPage(page, 'a4');
    await page.addInitScript(() => { window.__dd_crashPanel = 'object-surface'; });
    await gotoDesk(page);
    await page.locator(OBJ_SEL).first().click({ force: true });
    await page.waitForTimeout(600);
    const fb = await page.getByText('This panel hit a snag').count();
    const alive = await objCount(page);
    await page.screenshot({ path: `${OUT}/07-surface-dead.png` });
    record('A4.1', 'object-surface crash → fallback, desk survives',
      fb >= 1 && alive === baselineCount, `fallback=${fb} objects=${alive}/${baselineCount}`);
    await page.getByRole('button', { name: /^close$/i }).click();
    await page.waitForTimeout(300);
    record('A4.2', 'object-surface fallback Close → dismissed',
      (await page.getByText('This panel hit a snag').count()) === 0, '');
    await ctx.close();
  }

  // ════ PHASE B — STYLE-ENGINE DEGRADE-TO-RAW ═══════════════════════════════
  if (runPhase('B')) {
    const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
    const page = await ctx.newPage();
    const log = watchPage(page, 'b1');
    // Monkeypatch IN THE TEST PAGE (not in src): SVGSVGElement cloneNode
    // throws → the style engine's clone pass fails for every transform run.
    await page.addInitScript(() => {
      // SURGICAL: only the style engine clones a CONNECTED <svg> living in
      // the LIVE document (cloneSvg reads the mounted clean container).
      // DOMPurify / DOMParser work in detached documents and pass through —
      // the data path (sanitize/normalize) must stay healthy so the desk
      // LOADS and only the TRANSFORM pass throws.
      const orig = Node.prototype.cloneNode;
      Node.prototype.cloneNode = function (deep) {
        if (
          typeof SVGSVGElement !== 'undefined' &&
          this instanceof SVGSVGElement &&
          this.isConnected &&
          this.ownerDocument === document
        ) {
          throw new Error('[battery] forced style-engine failure (cloneNode)');
        }
        return orig.call(this, deep);
      };
    });
    await gotoDesk(page);
    const alive = await objCount(page);
    const vis = await page.evaluate(() => {
      // every object wrapper must still contain a VISIBLE svg (the raw source)
      const els = Array.from(document.querySelectorAll('main div[style*="cursor: grab"]'));
      let rawVisible = 0;
      for (const el of els) {
        const styled = el.querySelector('[data-svg-style]');
        if (!styled) continue;
        const divs = Array.from(styled.children).filter((c) => c.tagName === 'DIV');
        const cleanShown = divs[0] && getComputedStyle(divs[0]).display !== 'none' && divs[0].querySelector('svg');
        const fxShown = divs[1] && getComputedStyle(divs[1]).display !== 'none' && divs[1].querySelector('svg');
        if (cleanShown && !fxShown) rawVisible++;
      }
      return { total: els.length, rawVisible };
    });
    await page.screenshot({ path: `${OUT}/08-degrade-raw.png` });
    record('B1.1', 'engine throw → desk survives, raw source visible per object',
      alive === baselineCount && vis.rawVisible === vis.total && vis.total > 0,
      `objects=${alive}/${baselineCount} rawVisible=${vis.rawVisible}/${vis.total}`);
    record('B1.2', 'degrade console.warn fired (≥1), page never crashed',
      log.degradeWarns >= 1 && log.pageErrors.length === 0,
      `degradeWarns=${log.degradeWarns} pageErrors=${log.pageErrors.length}`);
    record('B1.3', 'warn-once per instance (warns ≤ transform instances)',
      log.degradeWarns <= vis.total + 2, // objects + preview squiggle + slack
      `warns=${log.degradeWarns} instances≈${vis.total + 1}`);
    await ctx.close();

    // control: no patch → styled renders return, zero degrade warns
    const ctx2 = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
    const page2 = await ctx2.newPage();
    const log2 = watchPage(page2, 'b2');
    await gotoDesk(page2);
    const styled = await page2.evaluate(() => {
      const els = Array.from(document.querySelectorAll('main div[style*="cursor: grab"]'));
      let fxVisible = 0;
      for (const el of els) {
        const styledEl = el.querySelector('[data-svg-style]');
        if (!styledEl) continue;
        const divs = Array.from(styledEl.children).filter((c) => c.tagName === 'DIV');
        if (divs[1] && getComputedStyle(divs[1]).display !== 'none' && divs[1].querySelector('svg')) fxVisible++;
      }
      return { total: els.length, fxVisible };
    });
    await page2.screenshot({ path: `${OUT}/09-degrade-control.png` });
    record('B2.1', 'control (no patch): styled fx render back, zero warns',
      styled.fxVisible === styled.total && log2.degradeWarns === 0,
      `fxVisible=${styled.fxVisible}/${styled.total} warns=${log2.degradeWarns}`);
    await ctx2.close();
  }

  // ════ PHASE C — REALTIME HANDLERS (synthetic payloads, ZERO DB writes) ════
  if (runPhase('C')) {
    const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
    const page = await ctx.newPage();
    watchPage(page, 'c');
    await gotoDesk(page);
    const { rows } = await pickRealRow(page);
    const target = rows.find((r) => true);
    if (!target) {
      record('C0', 'a real row exists to probe', false, 'no rows on the open desk');
    } else {
      const before = await wrapperAt(page, target.x);
      record('C0', 'target row is rendered on the desk', !!before, `row ${target.id.slice(0, 8)} at left=${target.x}px`);

      // C1 — UPDATE moves the object locally
      const fired = await fireSynthetic(page, 'UPDATE', {
        new: { ...target, x: target.x + 137, y: target.y + 61, name: 'rt-moved' },
        old: { id: target.id },
      });
      await page.waitForTimeout(600);
      const moved = await wrapperAt(page, target.x + 137);
      const oldGone = await wrapperAt(page, target.x);
      await page.screenshot({ path: `${OUT}/10-rt-update-moved.png` });
      record('C1', 'synthetic UPDATE → object moves (+137,+61), old spot empty',
        fired.length >= 1 && !!moved && !oldGone,
        `fired=[${fired.join(',')}] newSpot=${!!moved} oldSpot=${!!oldGone}`);

      // C2 — DELETE removes the object locally
      const firedDel = await fireSynthetic(page, 'DELETE', { old: { id: target.id } });
      await page.waitForTimeout(600);
      const afterDel = await objCount(page);
      const movedGone = await wrapperAt(page, target.x + 137);
      await page.screenshot({ path: `${OUT}/11-rt-delete.png` });
      record('C2', 'synthetic DELETE → object removed from desk',
        firedDel.length >= 1 && afterDel === baselineCount - 1 && !movedGone,
        `fired=[${firedDel.join(',')}] count=${afterDel}/${baselineCount - 1}`);

      // C3 — reload restores DB truth (proves the synthetics never wrote)
      await gotoDesk(page);
      const restored = await objCount(page);
      record('C3', 'reload restores DB truth (no DB writes happened)',
        restored === baselineCount, `count=${restored}/${baselineCount}`);
    }

    // C4 — persisted-style round-trip via synthetic INSERT (+ control).
    // ROCK Y UPDATE 2026-06-12 (Sebs "build it fr real" — overrides the Rock B
    // stub removal): wireframe is BACK in F3_SVG_STYLES as a real schematic
    // register, so persisted 'wireframe' configs now parse AS wireframe and
    // render through applyWireframeSchematic — no more fallback. C4.1 flipped
    // accordingly.
    const synthSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><circle cx="50" cy="50" r="40" fill="none" stroke="#1a1a1a" stroke-width="3"/></svg>';
    const mkRow = (id, x, cfg) => ({
      id, session_id: 'synthetic-foreign-session', svg: synthSvg,
      content_hash: 'synthetic', x, y: 120, rotation: 0,
      created_at: new Date().toISOString(), desk_id: null,
      name: 'synthetic', why: null, render_config: cfg,
    });
    await fireSynthetic(page, 'INSERT', {
      new: mkRow('aaaaaaaa-0000-0000-0000-00000000wire', 4242, { svgStyle: 'wireframe', modifiers: { wobble: 1.5 } }),
    });
    await fireSynthetic(page, 'INSERT', {
      new: mkRow('bbbbbbbb-0000-0000-0000-0000000sketch', 4444, { svgStyle: 'sketchy', modifiers: { wobble: 1.5 } }),
    });
    await page.waitForTimeout(900);
    const wireObj = await wrapperAt(page, 4242);
    const sketchObj = await wrapperAt(page, 4444);
    record('C4.1', 'persisted wireframe config pins the REAL wireframe register (Rock Y)',
      !!wireObj && wireObj.svgStyle === 'wireframe',
      `data-svg-style=${wireObj && wireObj.svgStyle}`);
    record('C4.2', 'control: valid sketchy config DOES pin its style (assertion not vacuous)',
      !!sketchObj && sketchObj.svgStyle === 'sketchy',
      `data-svg-style=${sketchObj && sketchObj.svgStyle}`);
    await gotoDesk(page); // discard local synthetics
    record('C4.3', 'synthetic inserts were local-only (reload back to baseline)',
      (await objCount(page)) === baselineCount, '');
    await ctx.close();
  }

  // ════ PHASE D — STYLE DROPDOWN INVENTORY (Rock Y: Wireframe is BACK) ═════
  if (runPhase('D')) {
    const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
    const page = await ctx.newPage();
    watchPage(page, 'd');
    await gotoDesk(page);
    // the style dropdown trigger shows the current style label
    await page.getByRole('button', { name: /^rough hand-drawn$/i }).first().click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${OUT}/13-style-dropdown.png` });
    const body = await page.evaluate(() => document.body.innerText);
    // Rock Y 2026-06-12: Wireframe rebuilt for real — it must be PRESENT now,
    // with the honest schematic detail line. 11 styles total.
    const hasWire = /Wireframe/i.test(body);
    const hasHonestDetail = /Uniform hairline schematic — contours only/i.test(body);
    const optionCount = await page.evaluate(() =>
      ['Clean', 'Outline only', 'Rough hand-drawn', 'Sketchy', 'Bold ink', 'Wet ink', 'Stipple', 'Charcoal', 'Risograph', 'Newsprint', 'Wireframe']
        .filter((l) => document.body.innerText.includes(l)).length);
    record('D1', 'style dropdown: 11 styles present incl. real Wireframe + honest detail',
      hasWire && hasHonestDetail && optionCount === 11, `wireframe=${hasWire} detail=${hasHonestDetail} count=${optionCount}/11`);
    await ctx.close();
  }

  // ════ PHASE E — TRUE TWO-CONTEXT REALTIME (the ONE sanctioned UI row) ═════
  if (runPhase('E')) {
    const ctxA = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
    const ctxB = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
    const A = await ctxA.newPage();
    const B = await ctxB.newPage();
    watchPage(A, 'A');
    watchPage(B, 'B');
    await gotoDesk(B); // B subscribes FIRST
    const bStart = await objCount(B);
    await gotoDesk(A);

    // A draws + publishes ONE row via the real UI flow
    await A.getByRole('button', { name: /add doodle/i }).click();
    const dialog = A.getByRole('dialog', { name: 'Draw a doodle' });
    await dialog.waitFor();
    const box = await dialog.boundingBox();
    // draw a stroke across the canvas area (left ~55% of the dialog)
    const sx = box.x + box.width * 0.22, sy = box.y + box.height * 0.45;
    await A.mouse.move(sx, sy);
    await A.mouse.down();
    for (let i = 1; i <= 12; i++) {
      await A.mouse.move(sx + i * 14, sy + Math.sin(i / 2) * 36, { steps: 2 });
    }
    await A.mouse.up();
    await A.waitForTimeout(400);
    await A.getByRole('button', { name: /^done$/i }).click();
    await A.waitForTimeout(500);
    await A.getByLabel('Doodle name').fill('rock-b realtime probe');
    await A.screenshot({ path: `${OUT}/14-A-naming.png` });
    await A.getByRole('button', { name: /place on desk/i }).click();

    // resolve the published row (poll A's own index)
    let row = null;
    for (let i = 0; i < 20 && !row; i++) {
      await A.waitForTimeout(500);
      row = await A.evaluate(async () => {
        const m = await import('/src/app/lib/publish.ts');
        const mine = await m.listMyDoodles(5);
        return mine.find((r) => r.name === 'rock-b realtime probe') ?? null;
      });
    }
    record('E1', 'context A published its one sanctioned row (UI flow)', !!row,
      row ? `row ${row.id.slice(0, 8)} at (${row.x}, ${row.y})` : 'publish never resolved');

    if (row) {
      // B sees the INSERT live
      let bSaw = null;
      for (let i = 0; i < 20 && !bSaw; i++) {
        await B.waitForTimeout(500);
        bSaw = await wrapperAt(B, row.x);
      }
      await B.screenshot({ path: `${OUT}/15-B-insert-arrived.png` });
      record('E2', 'context B received the INSERT live', !!bSaw, bSaw ? `at left=${row.x}px` : 'timed out');

      // A drags its own object +160,+90 (UI drag → drag-end persists)
      const aWrap = A.locator(`main div[style*="left: ${row.x}px"]`).first();
      const ab = await aWrap.boundingBox();
      await A.mouse.move(ab.x + ab.width / 2, ab.y + ab.height / 2);
      await A.mouse.down();
      await A.mouse.move(ab.x + ab.width / 2 + 160, ab.y + ab.height / 2 + 90, { steps: 8 });

      // …and WHILE the hand is still down, fire a synthetic UPDATE in A for
      // this row with wild coords — the don't-fight-the-hand guard must skip it
      const fightFired = await fireSynthetic(A, 'UPDATE', {
        new: { ...row, x: 9999, y: 9999 },
        old: { id: row.id },
      });
      await A.waitForTimeout(400);
      const yanked = await wrapperAt(A, 9999);
      record('E3', 'don’t-fight-the-hand: mid-drag UPDATE for the dragged object is ignored',
        fightFired.length >= 1 && !yanked, `fired=[${fightFired.join(',')}] yankedTo9999=${!!yanked}`);

      await A.mouse.up();
      await A.waitForTimeout(800);
      const aPos = await A.evaluate(async () => {
        const m = await import('/src/app/lib/publish.ts');
        const mine = await m.listMyDoodles(5);
        const r = mine.find((x) => x.name === 'rock-b realtime probe');
        return r ? { x: r.x, y: r.y } : null;
      });
      record('E4', 'A drag-end persisted new position to the row', !!aPos && aPos.x !== row.x,
        aPos ? `row now (${aPos.x.toFixed(1)}, ${aPos.y.toFixed(1)})` : 'row read failed');

      // B sees the MOVE live (UPDATE sub)
      let bMoved = null;
      for (let i = 0; i < 24 && !bMoved; i++) {
        await B.waitForTimeout(500);
        bMoved = aPos ? await wrapperAt(B, aPos.x) : null;
      }
      await B.screenshot({ path: `${OUT}/16-B-move-arrived.png` });
      record('E5', 'context B received the MOVE live (realtime UPDATE)', !!bMoved,
        bMoved ? `B wrapper at left=${aPos.x}px` : 'timed out (10s)');

      // A deletes via UI: click object → Edit surface → Delete
      const aWrap2 = A.locator(`main div[style*="left: ${aPos.x}px"]`).first();
      await aWrap2.click({ force: true });
      await A.waitForTimeout(800);
      await A.getByRole('button', { name: /^delete$/i }).click();
      await A.waitForTimeout(800);
      await A.screenshot({ path: `${OUT}/17-A-deleted.png` });

      // B sees the DELETE live
      let bGone = false;
      for (let i = 0; i < 24 && !bGone; i++) {
        await B.waitForTimeout(500);
        bGone = !(await wrapperAt(B, aPos.x));
      }
      await B.screenshot({ path: `${OUT}/18-B-delete-arrived.png` });
      record('E6', 'context B received the DELETE live (realtime DELETE)', bGone, '');

      // final truth: the row is really gone from the DB; B is back to start
      const remaining = await A.evaluate(async () => {
        const m = await import('/src/app/lib/publish.ts');
        const mine = await m.listMyDoodles(10);
        return mine.filter((r) => r.name === 'rock-b realtime probe').length;
      });
      const bEnd = await objCount(B);
      record('E7', 'sanctioned row UI-deleted from the DB; B back to its starting count',
        remaining === 0 && bEnd === bStart, `remaining=${remaining} B=${bEnd}/${bStart}`);
    }
    await ctxA.close();
    await ctxB.close();
  }

  await browser.close();

  // ── summary table ──
  console.log('\n── ROCK B BATTERY ──────────────────────────────────────────');
  for (const r of results) console.log(`${r.pass ? '✓' : '✗'} ${r.id.padEnd(5)} ${r.desc}${r.note ? ` — ${r.note}` : ''}`);
  const fails = results.filter((r) => !r.pass);
  console.log(`\n${results.length - fails.length}/${results.length} passed`);
  fs.writeFileSync(`${OUT}/results.json`, JSON.stringify(results, null, 2));
  process.exit(fails.length ? 1 : 0);
})().catch((err) => {
  console.error('BATTERY CRASHED:', err);
  process.exit(2);
});
