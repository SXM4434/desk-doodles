# Broken-Map STATUS — live re-diagnosis (2026-06-15, overnight)

Re-ran the live corpus sweep (`/tmp/dd-corpus-sweep.mjs`, 15 online-SVG fixtures through the real
/desk Upload-SVG flow) + captured actual renders of the ambiguous ones (`/tmp/dd-shots/fix-*.png`).
**Finding: most of FIX-SPECS-remaining.md is ALREADY FIXED in prior passes.** Only 2 things are
genuinely open — and both touch the LOCKED CATALOG, so they want Sebs's eye (not a blind overnight
change). Don't re-implement the done ones.

## ✅ ALREADY DONE (verified present in code — do NOT re-do)
- **U3 dots perf cap** — `renderRegion.ts:117` `MAX_DOTS=6000` gap-raise + the generated-path
  char backstop (`MAX_PATH_CHARS=300000`, generalized to all gap grammars). Sweep: no freeze
  (worst maxPath was public-domain-map-logo 214k, under the 300k cap).
- **D3 gap ladder** — `DrawSurface.tsx:442` extended to `[0.5,0.75,1,1.5,2,3,4.5,6]`.
- **3D-2 viewBox Infinity guards** — `poolCenter` finite-skip (`strokeTo3d.ts:471`) +
  `buildSvgPortTexture` finite/positive guard (`drawingTexture.ts:397`). (Only the cosmetic
  `Stroke3DScene` bb.min.y/max.y check extension is unticked — trivial, not causing errors.)
- **U1 `<g fill>`** — `renderRegion.ts:487` has the `case 'g'` (unions leaf geometry) +
  `signals.ts:58-68` walks ancestors for declared fill (the cat fix). Grouped uploads fill.
- **U5 url() pattern/gradient** — `index.ts:402-405` keeps source `url()` fills. color-square-
  pattern renders its colored dots (not blank); not perfect but not broken. LOW-priority edge case.

## 🔴 GENUINELY OPEN (proven broken by visual render)

### ✅ U4 (multi-subpath evenodd) — DONE + VERIFIED (2026-06-15 overnight)
Implemented in `renderRegion.ts`: `renderHachureFamily` now, when `fill-rule==='evenodd'`,
recomputes the true odd-parity region via **polygon-clipping XOR** of the sampled sub-path rings
(`evenOddRegionPath` — samples each sub-path off a LIVE-mounted full path via cumulative-length
boundaries, so relative `m` resolves correctly), then feeds rough.js clean L-only rings → correct
hole knockout. **VERIFIED:** with default-black temporarily on, `annulus-donut` renders a proper
hachured RING with the center HOLE KNOCKED OUT (was outline-only / would-flood). **CATALOG-SAFE by
construction:** 0 `evenodd` in the 197-catalog (`grep` confirmed) → the branch never runs on catalog
objects → no regression. tsc+build clean. (Did NOT add to the Make kit yet — local-canonical, ships
in the next Make batch; donut-evenodd is an edge case, not demo-critical.)

**STILL OPEN (separate evenodd sub-cases, lower priority):**
- **self-intersecting single-path evenodd** (e.g. `fillrule-evenodd-star` pentagram = ONE sub-path
  crossing itself, not multi-subpath) → U4 doesn't trigger (subs<2); renders a wrong triangle. Needs
  self-intersection resolution (polygon-clipping `union` on the single ring resolves it, but evenodd
  vs nonzero semantics differ — needs care).
- **solid-fill evenodd** (github when classified `solid` near-black → floods, U4 only covers the
  hachure family). The 'solid' render path would need the same region recompute.
- Both icon cases ALSO need default-black (deferred design call) to fill at all.

### U4 — evenodd compound paths render WRONG (the keystone) [original trace below]
Proof: `fillrule-evenodd-star` → renders a stray hachured **triangle fragment**, not a star
(`/tmp/dd-shots/fix-fillrule-evenodd-star.png`). `github-icon` → a **mangled black scribble**, not
the octocat (`fix-github-icon.png`). `annulus-donut` → concentric hexagon **outlines only, no
fill** (`fix-annulus-donut.png`). The smart pipeline returns the raw `d` and trusts rough.js to
clip; `fill-rule` is read by NOTHING (`renderRegion.ts:475-479`, grep-confirmed) → evenodd holes
flood / mis-render.
- **FIX (ready to execute, MED risk):** plumb `fill-rule` (`signals.ts` read `el.getAttribute
  ('fill-rule')` → `Signals` → `renderRegion`); in `renderRegion`, for multi-sub-path paths,
  compute the true region with **polygon-clipping@0.15.7** (installed) — parse sub-paths → sample to
  point rings → `difference(outer, holes)` for evenodd → feed the ring(s) to rough.js. 
- **GATE:** run `/tmp/dd-catalog-diff.mjs` (before/after via git stash) — the 197 catalog MUST
  render byte-identical (most are single-subpath, untouched). If it drifts, revert. THIS is why it
  wants a live session, not a blind overnight edit.

### default-black icons — DESIGN FORK (Sebs's call)
github / nintendo-switch / x-twitter / donut have NO explicit fill (SVG-default black) → guarded in
`signals.ts:51-56` → classified paper → no fill. Re-enabling default-black trust is a 1-line change
(the NOTE in signals.ts extractSignals) BUT it **shifted 13 locked-catalog objects** when tried in
R10 (why it was reverted). **Sequence: U4 FIRST (so knockouts render right), THEN re-enable default-
black, THEN show Sebs the catalog-diff for the 13-object shift before declaring done.** This is a
visual/design decision — bring it to Sebs.

## ◻ NOT YET RE-CHECKED THIS PASS (status unknown — verify before assuming open)
- D1/D2 nested-fill flood (drawing tools) · D4 snap seam · 3D-1 svg-port jagged rims. The spec has
  precise traces; re-verify current state (like above) before re-implementing — several specs were
  already silently fixed.

## Order to big-daddy (Sebs's, 2026-06-15)
1. ~~Personal space DB-on~~ — BLOCKED on Sebs's Supabase migrations (can't verify headless).
2. Drawing-tool features Phases 1-3 (`docs/FEATURES-UX-BUILD-SPEC.md`; §13 auto-apply/offer = open design call).
3. Broken-map fixes → **the only real opens are U4 + default-black (above)** + re-verify D1/D2/D4/3D-1.
4. Re-run per-stage OFATs → BIG-DADDY OFAT.

Reusable harnesses (all working): `/tmp/dd-corpus-sweep.mjs` (upload sweep), `/tmp/dd-fixshot.mjs`
(per-fixture render capture), `/tmp/dd-catalog-diff.mjs` (197-catalog before/after), `/tmp/dd-svg-render-check.mjs`.
