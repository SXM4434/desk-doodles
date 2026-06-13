// ─── PROPOSED FIXTURE STUB (gap-hunt 2026-06-13) — NOT YET WIRED ─────────────
// THE WEDGE PROOF the submission rests on: "the user's hand survives the
// round-trip." Today NO test asserts a real gesture survives
// draw → record(svg + render_config.strokes) → reopen → 3D conversion.
//
// This stub sketches the integration test. It is intentionally NOT runnable as
// shipped (the pure-fn imports are .tsx/.ts that need the project's esbuild
// loader — wire via tools/2d/vite.sweep.config.ts pattern or a tsx runner).
// It documents the EXACT assertions a real harness must make so the claim is
// provable, not asserted.
//
// Cross-system seam covered (all pure / node-runnable — no DOM, no DB):
//   DrawSurface.strokesToObjectMarkup  (gesture → record svg)
//   DrawSurface.capStrokes             (gesture → render_config.strokes)
//   geometry3d/convert.convertStrokePool (record strokes → 3D units)
//
// Why this is THE gap: test-coverage-gap-map flags "no harness can drive a
// real stroke" and treats the flip as untestable. But the SURVIVAL claim does
// not need the pointer pipeline — it needs the stroke ARRAY (which the record
// stores) to round-trip losslessly into geometry. That IS node-testable.

// ── Fixtures: canonical hand gestures (the demo's actual repertoire) ──────────
// A real harness should reuse tools/3d/mark-intent-fixtures.ts so the proof
// runs the SAME strokes the mark-intent battery blesses.
const GESTURES = {
  openSquiggle: [[[100, 100], [180, 140], [120, 220], [220, 240]]], // → rod, must survive open
  closedHeart: null, // pull from mark-intent-fixtures (heart) — closed → solid, silent
  twoArcArrow: null, // the arrow-rule ambiguous band — the chip path
  donut: null, // outer+inner loop — hole-parity must survive the round-trip
  multiStrokeFace: null, // 5 strokes — relative layout must survive normalize
};

// ── The assertions a real run MUST make (per gesture) ────────────────────────
const REQUIRED_ASSERTIONS = [
  // 1. STROKE FIDELITY: capStrokes(gesture) preserves topology — point count
  //    after decimation stays within tolerance, endpoints unmoved, stroke
  //    COUNT identical. (capStrokes halves density under the 45KB budget — the
  //    silent lossy step nothing tests; a heavy gesture could decimate the
  //    hand into a different shape and no gate would catch it.)
  'strokeCountPreserved',
  'endpointsWithinEpsilon',
  'noStrokeDroppedByCap',

  // 2. RECORD ROUND-TRIP: strokesToObjectMarkup(gesture) → parse viewBox →
  //    re-extract path d-strings → the polyline matches the input gesture
  //    (within rounding). This is the "reopen produces the same hand" claim —
  //    the re-draw flow (ObjectSurface) depends on render_config.strokes, but
  //    the SVG a viewer sees is built from strokesToObjectMarkup. If those two
  //    representations diverge, the desk shows one hand and re-draw edits a
  //    different one. UNTESTED today.
  'recordSvgMatchesGesture',
  'recordStrokesMatchGesture', // render_config.strokes === capStrokes(gesture)

  // 3. CONVERSION SURVIVAL: convertStrokePool(render_config.strokes, {mode:'auto'})
  //    yields units whose closure/intent matches the gesture's INTENT
  //    (openSquiggle→line-rod, closedHeart→solid, donut→solid+hole). Assert
  //    build geometry is finite + non-empty for every form unit. THIS is
  //    "the form is generated from the SAME hand the desk stores."
  'conversionUnitsNonEmpty',
  'conversionClosureMatchesIntent',
  'conversionGeometryFinite',

  // 4. DETERMINISM ACROSS THE SEAM: the WHOLE chain run twice (gesture →
  //    markup → strokes → convert) yields byte-identical geometry. The 3D
  //    catalog gauntlet proves convert() alone is deterministic; it never runs
  //    the markup→strokes hop in front of it. A non-determinism introduced by
  //    capStrokes or markup re-parse would pass the catalog gauntlet and fail
  //    here.
  'fullChainDeterministic',

  // 5. THE MISSING BACK-HALF (document, do not assert — not built):
  //    There is NO 3D→2D re-projection in src/ (verified: Stroke3DScene only
  //    forward-renders; svg-port = EdgesGeometry + hatch shader, the real
  //    SvgStyleTransform projection is post-makeathon). The wedge as WRITTEN
  //    ("3D form re-renders in marks of the same family") is a one-directional
  //    claim in code. Flag for Sebs: either (a) reframe the wedge as
  //    "the hand GENERATES the form" (true, provable by 1-4 above) or (b) the
  //    back-half is a real build slice, not a test gap.
  'BACK_HALF_NOT_BUILT_documented',
];

console.error(
  'PROPOSED STUB — not wired. See REQUIRED_ASSERTIONS for the hand-survives proof a real harness must make.\n' +
    'Wire via the tools/2d/vite.sweep.config.ts esbuild pattern (imports .tsx pure fns) or a tsx runner.\n' +
    `Gestures to cover: ${Object.keys(GESTURES).join(', ')}\n` +
    `Assertions: ${REQUIRED_ASSERTIONS.join(', ')}`,
);
process.exit(2); // 2 = "stub, not a pass and not a fail" — never green by accident
