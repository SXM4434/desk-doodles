// PROPOSED STUB — full creation loop AS ONE CHAIN (not single stages).
// Gap: test-coverage-gap-map §2 tests each STAGE in isolation (different
// one-shot rocks). No battery walks draw → toggle → Done → name → Back →
// re-draw → Done → reopen-Edit → Re-draw → save as a single state machine.
// The bugs live in the TRANSITIONS (does a Style-mode toggle survive Back to
// Draw? do strokes survive naming→Back→re-draw? does Re-draw on a placed
// object reload the SAME strokes editable?), which only a chain exercises.
//
// Run: npm run build && npx vite preview --port 4431 &
//      node tools/seq-gaps/create-loop-roundtrip.stub.mjs
// STATUS: STUB — scenario list + proven technique; assertions are TODO.
import { chromium } from 'playwright';
const BASE = process.env.DD_BASE || 'http://localhost:4431';
const DIALOG = '[role="dialog"][aria-label="Draw a doodle"]';

// Proven stroke driver (verbatim from shape-assist-ui-battery.mjs).
async function drawStroke(page, svg, pts) {
  const box = await svg.boundingBox();
  const map = ([vx, vy]) => [box.x + (vx / 800) * box.width, box.y + (vy / 600) * box.height];
  const [sx, sy] = map(pts[0]);
  await page.mouse.move(sx, sy); await page.mouse.down();
  for (const p of pts.slice(1)) { const [mx, my] = map(p); await page.mouse.move(mx, my, { steps: 2 }); }
  await page.mouse.up();
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1700, height: 1000 } });
  await page.route('**/*', (r) => {
    const u = r.request().url();
    return (u.includes('supabase') || u.includes('/rest/v1') || u.includes('/realtime')) ? r.abort() : r.continue();
  });
  await page.goto(`${BASE}/desk`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);

  // ── THE CHAIN (each step's success is a precondition for the next) ──
  // S1  open DrawPanel
  // S2  draw stroke A in Draw mode
  // S3  flip Sketch→Style — assert strokes re-render styled, NOT raw
  // S4  flip Style→Sketch back — assert strokes still present + drawable
  // S5  draw stroke B — assert it lands in Draw mode after a Style detour
  // S6  Done → naming stage — assert preview is STYLED (StagedRenderScope)
  // S7  Back → compose — assert BOTH strokes intact, style choice intact
  // S8  draw stroke C (re-draw before placing) — assert appends, no reset
  // S9  Done → naming → set name + why → (do NOT Place; live-DB rule)
  //       assert canDone gating, naming fields wired, size-cap measured
  // S10 [requires a placed owned object — see note] reopen Edit → Re-draw →
  //       assert storedStrokes load editable, redraw append, save round-trips
  //       (drive updateDoodleSvg via __dd intercept; assert NO live write)
  //
  // Cross-cutting asserts the single-stage rocks skip:
  //   · style choice persists across Sketch↔Style↔naming↔Back
  //   · stroke set is monotonic across the whole chain (never silently reset)
  //   · the Escape-armed footer state resets correctly after a Back (not stuck)
  console.log('STUB create-loop-roundtrip — scenario S1..S10 not yet asserted');
  await browser.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
