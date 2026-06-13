// PROPOSED STUB — mid-action interrupts (Escape / scrim / panel-close / browser
// gestures) fired DURING a gesture, across every surface.
// Gap: DrawSurface mounts an Escape-cancel listener ONLY while a gesture is
// active (DrawSurface.tsx ~1216, `gestureActive`), and DrawPanel has a layered
// Escape (naming→Back, compose→arm-confirm). These two listeners INTERACT
// (capture-phase stopPropagation is supposed to keep them separate) but no
// battery fires Escape at the precise instant a gesture is live to prove the
// layering. The rockf1/f2 batteries press Escape only to CLOSE the panel
// between scenarios, never mid-stroke. Pan/drag interrupts on /desk also untested.
//
// Run: npm run build && npx vite preview --port 4433 &
//      node tools/seq-gaps/mid-action-interrupt.stub.mjs
// STATUS: STUB.
import { chromium } from 'playwright';
const BASE = process.env.DD_BASE || 'http://localhost:4433';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1700, height: 1000 } });
  await page.route('**/*', (r) => {
    const u = r.request().url();
    return (u.includes('supabase') || u.includes('/rest/v1') || u.includes('/realtime')) ? r.abort() : r.continue();
  });

  // ── SCENARIOS (drive pointer DOWN + a few MOVES, then Escape WITHOUT up) ──
  // I1  Escape mid-INK-stroke — assert `current` discarded, panel STAYS open
  //       (the capture-phase listener stopPropagation must beat DrawPanel's).
  // I2  Escape mid-TONE-stroke — assert grid restored to toneSnapshotRef
  //       (true cancel incl. erase), panel stays open.
  // I3  Escape mid-SCRUB — assert Gap restored to baseGapIdx (not the bailed
  //       value), logged 'cancelled', panel stays open.
  // I4  Escape mid-LASSO — assert no auto-close commit, logged 'cancelled'.
  // I5  Escape mid-HIGHLIGHT-fill — assert no region committed.
  // I6  DOUBLE Escape mid-stroke: 1st cancels gesture, 2nd should ARM the
  //       compose-close confirm (not close instantly) — assert the two layers
  //       hand off correctly (this is the exact bug the rock-F1 comment cites).
  // I7  SCRIM-CLICK mid-stroke — pointer-capture means the scrim shouldn't get
  //       the click; assert the stroke completes/cancels predictably, scrim
  //       doesn't arm-close underneath an active capture.
  // I8  Escape during NAMING stage — assert Back to compose, strokes intact
  //       (NOT a panel close; different layer than compose-Escape).
  // I9  /desk: Escape mid-DRAG of an own object — drag has setPointerCapture;
  //       assert no crash, drag resolves (Escape is not wired to drag — is that
  //       intended? pin the behavior).
  // I10 /desk: pointercancel mid-PAN (simulate via dispatching pointercancel) —
  //       handlePointerCancel must clear panDragRef + setPanning(false).
  // I11 BLUR mid-gesture (Alt-Tab / window blur) — does the gesture leak? No
  //       pointerup arrives; only handlePointerLeave covers SVG-leave, not blur.
  console.log('STUB mid-action-interrupt — I1..I11 not yet asserted');
  await browser.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
