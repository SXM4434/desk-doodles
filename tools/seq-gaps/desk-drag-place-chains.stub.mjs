// PROPOSED STUB — desk drag/place/click CHAINS (HTML5 drag-and-drop + pointer).
// Gap: gapmap/interaction-probe opens the drawer but never DRAGS a card to the
// desk (DRAWER v2 item 2 — onDragStart on the card, onDrop on the desk;
// DeskPage.tsx ~1445 handleDeskDragOver/handleDeskDrop). The click-vs-drag
// boundary (clickSlop 5px mouse / 12px touch, DeskPage ~1565) and the
// micro-drag coord-restore (R1, ~1573) are source-verified only. None of the
// FAST-SUCCESSION chains (place then immediately drag the new copy; double-click
// an object) are exercised.
//
// Run: npm run build && npx vite preview --port 4434 &
//      node tools/seq-gaps/desk-drag-place-chains.stub.mjs
// STATUS: STUB. NOTE: drag-to-place writes a row (publish copy) — to stay
// write-safe, intercept the publish RPC and ASSERT THE CALL SHAPE, never let it
// reach the live DB (route-abort the RPC + read the optimistic add).
import { chromium } from 'playwright';
const BASE = process.env.DD_BASE || 'http://localhost:4434';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1700, height: 1000 } });
  await page.route('**/*', (r) => {
    const u = r.request().url();
    return (u.includes('supabase') || u.includes('/rest/v1') || u.includes('/realtime')) ? r.abort() : r.continue();
  });

  // ── SCENARIOS ──
  // P1  DRAWER DRAG-TO-PLACE: open drawer, dispatch HTML5 drag of a card
  //       (dataTransfer.setData DD_DOODLE_MIME), dragover desk, drop at (x,y) —
  //       assert dropEffect='copy', optimistic add at screenToDesk(drop), the
  //       lands-moment keyframe plays, publish RPC called with the drop coords.
  // P2  DROP OUTSIDE the desk (on header / panel) — assert no phantom object.
  // P3  DROP with a malformed/empty dataTransfer payload — assert graceful skip
  //       (handleDeskDrop getData returns '' → must not crash).
  // P4  PLACE-THEN-DRAG: after P1's drop, immediately pointer-drag the new copy
  //       — assert it's owned (draggable) the instant it lands, not after the
  //       insert resolves (dbId undefined window — does drag-persist no-op
  //       cleanly when dbId is still undefined?).
  // P5  CLICK-VS-DRAG boundary: pointer-down + move exactly 4px + up (mouse) →
  //       must OPEN (click); move 6px → must DRAG-persist. Assert the 5px line.
  // P6  MICRO-DRAG COORD RESTORE (R1): own object, down + 3px jitter + up →
  //       open surface, assert object x/y === pre-press (no DB drift).
  // P7  DOUBLE-CLICK an object — assert it opens the surface ONCE, second click
  //       doesn't stack a second surface (activeSurface single-slot).
  // P8  DRAG-DURING-REALTIME-ECHO: start dragging own object, fire a synthetic
  //       UPDATE echo for THAT object (don't-fight-the-hand) — assert the drag
  //       wins, the echo doesn't snap it back (Rock B proved once, not in a
  //       repeatable gate for the drag+drop-place combo).
  // P9  FOREIGN-DRAG: press someone-else's object + pull >5px → nudge-and-settle
  //       fires ONCE, object never moves; then pointer-up opens Sandbox.
  console.log('STUB desk-drag-place-chains — P1..P9 not yet asserted');
  await browser.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
