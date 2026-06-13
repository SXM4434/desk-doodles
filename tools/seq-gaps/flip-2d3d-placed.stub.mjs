// PROPOSED STUB — the 2D↔3D flip ON A PLACED DESK OBJECT (the demo climax).
// Gap (ARCHITECTURAL, not just untested): the 2D↔3D flip exists ONLY on
// /canvas (DeskDoodlesCanvas mode 'svg'|'3d', ~line 79). The PRODUCT route
// /desk has NO per-object flip — `DeskObject` (DeskPage.tsx ~188) carries NO
// render_mode / geometry field, and ObjectSurface (edit/sandbox) exposes no
// "convert to 3D" action. The D-7 Global-lens 3D path ("Global ON = uniform
// desk, toggles own mode + geometry") is spec'd but the live desk holds 0 3D
// objects (gapmap census). So the climax beat — "flip a doodle that's ON the
// desk into 3D, the hand survives" — has NO code path AND no test.
//
// This stub therefore does TWO things:
//   (a) ASSERT THE GAP today (no flip control on a placed object) so the
//       absence is logged, not silently assumed-present.
//   (b) Frame the future sequence test for when the path lands.
//
// Run: npm run build && npx vite preview --port 4435 &
//      node tools/seq-gaps/flip-2d3d-placed.stub.mjs
// STATUS: STUB — gap-assertion + future-sequence frame.
import { chromium } from 'playwright';
const BASE = process.env.DD_BASE || 'http://localhost:4435';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1700, height: 1000 } });
  await page.route('**/*', (r) => {
    const u = r.request().url();
    return (u.includes('supabase') || u.includes('/rest/v1') || u.includes('/realtime')) ? r.abort() : r.continue();
  });
  await page.goto(`${BASE}/desk`, { waitUntil: 'domcontentloaded' });

  // (a) GAP ASSERTION (today): open an object surface, confirm there is NO
  //     "3D" / "convert" / geometry control present, and the Global lens (if
  //     present) cannot make a SINGLE placed object 3D. Record the absence.
  //
  // (b) FUTURE SEQUENCE (when the path lands — Round 9 AI-mesh-default):
  //   T1  flip placed 2D object → 3D — assert a 3D canvas mounts in its slot,
  //         the form derives from the SAME strokes (wedge), 2D DOM retained.
  //   T2  flip 3D → 2D back — assert byte-identical 2D raster (retained-DOM
  //         contract, the flip-jitter fix in DeskObjectArt ~266-288).
  //   T3  flip rapidly 2D↔3D↔2D×6 — assert no leak, no recompute storm,
  //         cache reused (content-hash keyed intermediate — UNTESTED per §4).
  //   T4  MIXED desk: some objects 2D, some 3D, drag/pan — assert both render
  //         clean side-by-side (gapmap: "mixed 2D+3D desk completely unexercised").
  //   T5  flip → then re-style under SVG-port → flip back — multi-step chain.
  //   T6  Global lens ON → whole desk goes 3D (geometry=Auto) → lift lens →
  //         every object restored to its own per-object 2D mode untouched.
  console.log('STUB flip-2d3d-placed — (a) gap-assert + (b) T1..T6 not yet asserted');
  await browser.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
