// PROPOSED STUB — Smart-pick chip lifecycle RACES (pick interacts with undo /
// manual override / re-upload / Reset / re-pick).
// Gap: rockA r7 task #48 tested the chip ONCE (one-shot, not re-runnable). The
// chip's state machine (DrawPanel SmartPickChip ~89; pick fires on UPLOAD only;
// undo exists ONLY while pick is untouched; any manual pen move DISMISSES with
// a quiet fade + logs 'overridden') has several SEQUENCE edges no battery walks:
//
// Run: npm run build && npx vite preview --port 4436 &
//      node tools/seq-gaps/smart-pick-chip-races.stub.mjs
// STATUS: STUB. The chip only appears on the UPLOAD path → drive Upload SVG
// with a fixture (test-fixtures/gradient-sampler.svg), route-aborting writes.
import { chromium } from 'playwright';
const BASE = process.env.DD_BASE || 'http://localhost:4436';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1700, height: 1000 } });
  await page.route('**/*', (r) => {
    const u = r.request().url();
    return (u.includes('supabase') || u.includes('/rest/v1') || u.includes('/realtime')) ? r.abort() : r.continue();
  });

  // ── SCENARIOS (assert against window.__dd_inputPickLog tuples) ──
  // C1  upload → chip appears → click UNDO → assert prior pen restored, chip
  //       gone, logged 'undo' (NOT 'overridden').
  // C2  upload → chip appears → move a slider → assert chip FADES (data-fading,
  //       pointer-events off), manual choice KEPT, logged 'overridden', undo gone.
  // C3  upload → chip → change Style dropdown → same as C2 (override via style).
  // C4  upload → chip → Reset → assert chip dismissed + logged.
  // C5  upload A → chip A → REPLACE with upload B → assert chip RE-DESCRIBES B
  //       (the old chip's claim must not survive a new file — it described A).
  // C6  upload → chip → REMOVE (strokes present path) → assert chip dismisses
  //       (its pick described the removed file — Rock A r7 #2 stranding fix).
  // C7  DOUBLE-PICK: upload A → upload B fast before chip settles → assert one
  //       coherent chip for B, no stacked/stale chip for A.
  // C8  upload → chip → undo → upload again → assert a FRESH pick+chip (the
  //       undo didn't poison the next pick's prior-snapshot).
  // C9  chip present + Sketch|Style flip — assert chip survives a render-axis
  //       flip (Style is not a "manual style change" that should dismiss it?)
  //       — pin the intended behavior (ambiguous today).
  console.log('STUB smart-pick-chip-races — C1..C9 not yet asserted');
  await browser.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
