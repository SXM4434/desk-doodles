// PROPOSED STUB — rapid Ink↔Shade↔Fill↔Lasso register/tool cycling +
// tool-switch-MID-gesture teardown.
// Gap: rockf1 (shade) and rockf2 (fill/lasso) each test ONE tool's gestures in
// isolation. NOTHING exercises switching tool/register WHILE a gesture is in
// flight, or hammering the register pills rapidly. DrawSurface has a
// `teardownGesture` (DrawSurface.tsx ~1019) for "tool switches, Escape" — but
// no battery proves a tool switch mid-scrub / mid-lasso / mid-tone actually
// fires it cleanly (in-flight timer cleared, refs nulled, no orphan preview).
//
// Run: npm run build && npx vite preview --port 4432 &
//      node tools/seq-gaps/cross-tool-cycling.stub.mjs
// STATUS: STUB.
import { chromium } from 'playwright';
const BASE = process.env.DD_BASE || 'http://localhost:4432';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1700, height: 1000 } });
  await page.route('**/*', (r) => {
    const u = r.request().url();
    return (u.includes('supabase') || u.includes('/rest/v1') || u.includes('/realtime')) ? r.abort() : r.continue();
  });
  await page.goto(`${BASE}/desk`, { waitUntil: 'domcontentloaded' });

  // ── SCENARIOS ──
  // X1  Ink → Shade → Ink → Shade × 8 rapid pill taps — assert state settles,
  //       no orphaned brush preview, toneGrid intact, strokes intact.
  // X2  Shade: Brush → Fill → Lasso → Brush rapid — assert each tool's
  //       in-flight refs cleared on switch (no stale scrub timer fires later).
  // X3  TOOL SWITCH MID-SCRUB: press-hold to arm Gap scrub (350ms), then while
  //       holding, switch Fill→Lasso pill — assert teardownGesture nulls the
  //       fillGesRef + clears timer + scrubState=null (no late setState warning,
  //       no committed fill at the abandoned tolerance).
  // X4  TOOL SWITCH MID-LASSO: start a lasso path, switch to Brush — assert no
  //       auto-close commit fires (the release handler is gone), lassoPts=null.
  // X5  TOOL SWITCH MID-TONE: start a tone brush stroke, flip register to Ink —
  //       assert tone stroke does NOT commit a half-stroke; grid consistent.
  // X6  REGISTER FLIP MID-INK: start an ink stroke, flip Ink→Shade — assert the
  //       in-progress `current` stroke is dropped (or committed?) consistently
  //       (UNDEFINED behavior today — handlePointerDown early-returns on the
  //       wrong register but the in-flight `current` from the prior register is
  //       never resolved; this is a real ambiguity worth pinning).
  // X7  Sketch|Style flip MID-anything — Style mode early-returns pointer; assert
  //       an in-flight gesture started in Sketch is torn down, not frozen.
  console.log('STUB cross-tool-cycling — X1..X7 not yet asserted');
  await browser.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
