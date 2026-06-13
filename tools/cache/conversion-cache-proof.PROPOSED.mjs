// ─── PROPOSED FIXTURE STUB (gap-hunt 2026-06-13) — NOT YET WIRED ─────────────
// THE CLAIM THIS DOES NOT YET COVER (because the feature is not built):
// CLAUDE.md headline — "Cached in Supabase backend so canvas mode-flip doesn't
// re-generate." VERIFIED ABSENT in src/: contentHash.ts only STAMPS a row's
// content_hash column; nothing READS it to short-circuit a re-conversion.
// convert.ts has NO cache layer. The only memoization is React useMemo inside
// Stroke3DScene (volatile — dies on reload, remount, or a different viewer).
// No OPFS, no IndexedDB, no caches.* anywhere (grep-confirmed).
//
// So there are TWO distinct gaps and this stub names both:
//
//   GAP-A (feature gap): the persistent conversion cache does not exist. A
//          mode-flip recomputes the geometry every time. For the curated demo
//          this is fine (small N, fast convert); the SUBMISSION TEXT claims a
//          cache that isn't there. Either build a thin OPFS/IndexedDB layer
//          keyed on contentHash(svg ∥ strokes ∥ mode ∥ REGION_EXTRACTOR_VERSION)
//          OR scrub the "cached so it doesn't re-generate" claim from CLAUDE.md
//          / README / submission copy (don't ship an unbacked claim).
//
//   GAP-B (test gap, conditional on GAP-A): IF a cache is built, this is the
//          harness that proves it. Today there is nothing to test.
//
// ── The assertions a real cache harness MUST make (once GAP-A is built) ───────
const REQUIRED_ASSERTIONS = [
  // 1. CACHE HIT IDENTITY: convert(strokes, mode) then re-flip → the second
  //    flip returns geometry byte-identical to the first AND does NOT call the
  //    builder (spy on convertStrokePool / buildExtrudeGeometry). A hit must be
  //    a hit, not a silent recompute that happens to match.
  'secondFlipIsCacheHit',
  'cacheHitGeometryByteIdentical',

  // 2. KEY CORRECTNESS — the cache must MISS when it should:
  //    - svg changed (re-draw)            → miss
  //    - strokes changed                  → miss
  //    - geometry mode changed (rod↔solid)→ miss
  //    - REGION_EXTRACTOR_VERSION bumped  → miss (the golden-gate-for-caches
  //      pattern strokeTo3d.ts:1506 promises but nothing enforces)
  'cacheMissOnSvgChange',
  'cacheMissOnModeChange',
  'cacheMissOnExtractorVersionBump',

  // 3. CROSS-SESSION / CROSS-RELOAD PERSISTENCE: the WHOLE point of "Supabase
  //    cached" is that flip is cheap for the NEXT viewer / after reload. A
  //    React useMemo fails this by construction. Assert a cached entry survives
  //    a simulated reload (re-open the OPFS/IDB handle, get the hit).
  'cacheSurvivesReload',

  // 4. CACHE/RECORD CONSISTENCY: a stale cache must never render a hand the
  //    record no longer holds. After updateDoodleSvg (re-draw), a flip must
  //    reflect the NEW svg, not the cached old geometry. (This is the
  //    failure mode the content_hash key is supposed to prevent — assert it.)
  'reDrawInvalidatesCache',
];

console.error(
  'PROPOSED STUB — not wired. The persistent conversion cache (CLAUDE.md headline) is NOT BUILT (GAP-A).\n' +
    'Either build it (OPFS/IndexedDB keyed on contentHash(svg∥strokes∥mode∥extractorVersion)) then wire these\n' +
    'assertions, OR remove the "cached so mode-flip does not re-generate" claim from the submission copy.\n' +
    `Assertions (once built): ${REQUIRED_ASSERTIONS.join(', ')}`,
);
process.exit(2); // stub
