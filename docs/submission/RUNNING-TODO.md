# RUNNING TODO — Desk Doodles (post-submission board)

**Reconciled 2026-06-19** against live code via a 6-agent verification sweep (each subsystem's bugs re-grepped at the cited `file:line`, not trusted from the stale index). The makeathon was **submitted** — so nothing is cut for time anymore; the deferred scope is back on (see the un-cut section + `POST-MAKEATHON-PLAN.md` for sequencing).

**Legend:** 🔴 open · 🟡 partial (works, incomplete) · 🧑‍💻 Sebs-side/external · 🎯 scope (feature, not a bug).
**Discipline:** no "fixed" without a live `:5182` before/after (`feedback_never_declare_fixed_without_regression_check`); use the `desk-doodles-bug-index` skill + `KNOWN-SOLUTIONS.md` before re-diagnosing. The pre-2026-06-19 history is in `RUNNING-TODO-ARCHIVE-pre-2026-06-19.md` + git.

---

## 🆕 2026-06-27 — FORM × SURFACE modal unification (the modal-rage fix) — live-verified, tsc+build GREEN
- 🟢 **DONE — one 3D control set for mesh + stroke.** `Canvas3DChrome` now serves both; killed the "Look" dropdown + mesh-only `AiMeshControlsEdit`. AI mesh = a FORM (`GeometryModeSetting += 'ai-mesh'`), shown in the geometry dropdown when a GLB exists, default for a mesh. Render gate (`Stroke3DScene` ~1740): GLB for geometry ∈ {ai-mesh, auto}; stroke-built form (from the Quiver SVG) for an explicit stroke mode. 3D STYLE is surface-aware: AI-mesh form → the merged "Surface" set (→ `aiMeshMaterialMode`), stroke form → Native/Hatch/SVG-port (→ `style3d`). Verified live `tools/verify-unify-modal.mjs` + `verify-stroke-modal.mjs` (stroke objects regression-clean, no AI-mesh leak). Full detail in SESSION-HANDOFF R38 + `docs/submission/AI-MESH-UNIFY-PLAN.md`.
- 🟢 **DONE — cut-off property panel.** The modal control column was capped to the short preview-card height (~311px crammed below the fold); now it FILLS the panel. Verified `tools/verify-2d-panel.mjs` (0 hidden overflow, 2D + 3D).
- 🔴🧑‍💻🎯 **Text → SVG pipeline (the LAST plan item).** No runtime text→SVG (Quiver is image→SVG only; no font/LLM deps). Real product fork (render the WORD as a drawn object [client-side, font-glyphs] vs prompt→AI-sketch [needs an LLM key + a Supabase edge function = Sebs deploy]). Research done; recommendation pending Sebs's ruling — see the message to Sebs.

---

## 🆕 2026-06-23 — HATCH-BURIAL fix: textured regions flatten in the structure field (tsc+build GREEN, live A/B verified)
Came out of OFAT batch-1: the "canary" hatch panel appeared to collapse under every depth factor. Root cause (diagnosed,
not guessed): a dense hatch region AVERAGES as dark in the blurred structure height field, so all three depth paths (GPU
displacement via `height`, CPU displacement via `structureHeight`, and the deep-CSG contour path via `extractReliefContours`)
read it as a recess and sink it. But hatch is **textured** (high local high-frequency energy) where a SOLID fill is uniform.
- **FIX** (`drawingTexture.ts`, `flattenTextured`): measure regional texture energy `|carve − carveDisp|`, box-blur it to a
  region scale (~0.035·longPx), and pull high-texture pixels toward **0.5 = FLAT** in the structure field (signed-field
  convention: 0.5 surface / 1.0 raised / 0.0 deep indent). Textured regions stop carving (their detail rides the NORMAL map
  as lit surface); SOLID dark regions (low texture) are untouched and still carve crisply. Applied to BOTH soft (`carveDispFlat`
  → `height`, GPU + CSG) and sharp (`carveDispSharpFlat` → `structureHeight`, CPU) fields → fixes all three paths at the source.
  FREE-ish (2 box blurs, O(w·h)). Tunable / disable via `window.__svgPortTextureFlatten = 0`.
- **VERIFIED (live A/B, walls-sharp deep CSG, demo wall):** `tools/harnesses/dd-hatch-flatten-ab.mjs` toggles the flatten and
  forces a rebuild. `__csgDeepRegions` **29 → 1** — 28 spurious textured-region CSG carves removed, the 1 survivor = a genuine
  low-texture solid. Pixel diff **1.21%** (localized to the textured panel + rims; solid interiors byte-stable). Game Boy SCREEN
  recess is a **primitive** carve (csg.ts:204-207), independent of the height field by construction → cannot regress; confirmed
  visually unchanged in the close-up A/B (`/tmp/dd-hatch-ab/crop-*.png`).
- **HONEST scope note:** the *mechanism* fix is real and worth keeping (texture belongs on the normal map, not geometry; 29→1
  regions is also much faster manifold). But the *visible* severity at FULL resolution is **modest** — the hatch already read via
  emissive+normal, so much of the OFAT's apparent "collapse" was the 512px-thumbnail artifact (same family as the bold false-alarm).
  No regression on solids/rims. Default ON. tsc + production build green.

---

## 🆕 2026-06-20 — svg-port desk RESTYLE: lag killed + per-style relief (tsc+build GREEN, live-verified headed Chrome)
Sebs: "make it work and improve the differences, get rid of lag" → then "there's more than 4, what about the toggles."
- **LAG FIXED** — a whole-desk svg-port restyle went from "lags like crazy" to **~40–50 ms max frame gap** (headed-Chrome
  measured, 0 page errors). Three levers, all in the svg-port BUILD path (3D-only, zero 2D/native risk):
  - **on-screen BUILD gate** — `inView` threaded DeskPage→DeskObjectView→DeskObjectArt→LiveObject3DSlot→Object3DView→
    Stroke3DContents→StrokeMeshes; the heavy carve build now runs only for objects near the viewport (0.3-vp buffer ≈
    the shared canvas's 25 % overhang) → ~20 rebuilds become ~4. Off-screen objects keep their warm texture, rebuild on
    scroll-in (Sebs's N64 model). `builtSigRef` also skips rebuilds when inputs are byte-identical (pan/hover re-renders).
  - **small thumbnail texture** — desk/drawer build at `longEdge:512` vs the modal's `1024·dpr` (~2048 on retina): a ~180 px
    well needs nowhere near that → 4–16× less pixel work per build (the dominant cost). Modal/preview keep full res.
  - threaded as one optional `svgPortBuild {inView,longEdge,styleId}` bundle (omitted ⇒ full res + always build, so modal/
    homepage/static previews are byte-identical — the DEFAULT carve profile equals the old constants by construction).
- **PER-STYLE RELIEF (the "differences")** — `STYLE_CARVE_PROFILE` in `drawingTexture.ts` gives each of the **11** svg styles
  its own carved surface (was: every style funnelled through ONE depth ramp → all read the same). 4 families:
  crisp-shallow V (clean/outline/wireframe) · deep-soft U (rough/sketchy/charcoal/wet-ink/risograph) · RAISED emboss
  (bold-ink, sign-flip) · round dimples (stipple/newsprint). Threaded styleId on desk (swept style), modal (surfStyle),
  /canvas (live svg style), drawer (saved style). Monochrome north-star held (value from relief + one light, never hue).
- **NEWSPRINT FIXED (the 11th style) — externally-referenced defs now inline.** Root cause (diagnosed, not guessed, via
  `window.__svgPortDebug` serialized-svg dump): newsprint's dots come from a `<mask>` + `<pattern>` that live in the shared
  `TextureFilterDefs` (App-root, mounted once), referenced by `url(#dd-newsprint-dot-mask)`. The svg-port build rasterized
  the object's markup STANDALONE → the mask def wasn't present → Chrome rendered it UNMASKED → solid form, no dots. Fix =
  `inlineExternalDefs()` in `drawingTexture.ts`: scans the styled markup for every `url(#id)`/`href="#id"`, pulls the def
  from the LIVE document RECURSIVELY (mask→pattern), and appends clones to the build svg's own `<defs>` → self-contained
  raster. Also hardens CHARCOAL/WET-INK feTurbulence/feGaussianBlur filters (same external-def class). treatMask clone
  strips the root mask/filter so the raise/indent geometry raster isn't dot-screened. No-op for styles that reference
  nothing external (clean/rough/…) → byte-identical there.
- **TRIPLE-CHECKED (headed Chrome, ALL 11 + toggles, no sampling):** every style reads DISTINCT — clean(crisp)/outline/
  wireframe(hairline) · rough/sketchy/charcoal(hatch+grain)/wet-ink(bleed)/risograph(offset) · bold-ink(raised emboss) ·
  stipple(bold pits) · **newsprint(fine halftone screen)**. Captures `/tmp/dd-shots/tc-*.png`. Toggles translate (wobble
  0/2, multiStroke single/heavy, fillStyle) `tog-*.png`. **LAG re-measured per-restyle: worst 42 ms, most 9–17 ms;
  newsprint 9 ms = the defs-inline adds ZERO penalty.** tsc + production build green. Clean(control) byte-identical.
- **2026-06-21 follow-ups (Sebs live):**
  - (a) **newsprint dots scaled up** for the relief — `scaleNewsprintDots()` enlarges the inlined dot TILE ×1.6 in the 3D
    build only (2D untouched) so the halftone reads punchier (`NEWSPRINT_3D_DOT_SCALE`, drawingTexture.ts).
  - (b) **relief depth scaled up for ALL styles** ("scale it up a little for everything") — `CARVE_DEPTH_BOOST` ×1.25 on
    every per-style engrave/deep + raise/indent, and `SVGPORT_DISPLACEMENT_SCALE` 0.06→0.09. Verified all 11 styles deeper/
    punchier, **no tearing** (incl. thin-line clean/wireframe), lag ≤50 ms.
  - (c) **MINI-VERSION-OF-THE-OBJECT BUG — FIXED (the real one).** Sebs: "the little mini version of the object on it in the
    middle, always in 3D." NOT the grip (that's RESTORED — I wrongly pulled it, put it back). ROOT CAUSE (diagnosed via the
    coord math, not guessed): the svg-port `detailLines` (the drawing drawn as light incised lines ON the form) sampled the
    styled markup in the markup's OWN viewBox units (~180) but `normalizeStrokePoints` scales by a CONSTANT world-scale per
    viewBox-unit using the ENGINE viewBox (~800) → the marks rendered at ~180/800 ≈ **0.22× scale, centered = a mini copy of
    the drawing on the middle of the form**. FIX (`Stroke3DScene.tsx` detailLines): for svg-port, fit the marks' bbox straight
    onto the FORM's xy bbox (the window the carve already registers to) so they wear the form FULL-SIZE; native path (raw
    strokes, already engine-space) unchanged. VERIFIED headed: before = a bright mini box on the middle controller's centre;
    after = gone, marks register full-size (`/tmp/dd-shots/BEFORE-bold-ink.png` vs `tc-bold-ink.png`). tsc+build green, lag
    ≤58 ms, 0 err. Make kit: Stroke3DScene.tsx synced.
- **Make kit synced** (`~/Desktop/dd-make-update/updates/`): drawingTexture.ts, Stroke3DScene.tsx, **MultiStroke3D.tsx (new)**,
  DeskObject3DMount.tsx, DeskPage.tsx, ObjectSurface.tsx, DeskDoodlesCanvas.tsx, DrawerPage.tsx.

---

## 🆕 2026-06-21 — DEEP 3D RELIEF shipped as a controls slider (the wedge climax; tsc+build GREEN, headed-verified)
Sebs picked "deep 3D relief" next → "depth slider defaulting to a sensible deep value." DONE.
- **Mechanism** (was flag-gated, now real): `displaceFrontCapByHeight` CPU-displaces the WELDED pool-mass front cap by the
  carve height field → REAL geometry depth (recesses sink, proud marks stand out) that catches light on orbit, with NO
  tearing (rim/skirt/back stay put; the GPU shallow `displacementMap` is dropped when deep is on so depth isn't doubled).
  Verified headed on /canvas orbit: 0.00 = flat · 0.60 = bold carved contour, clean silhouette, correct orientation (the
  flagged flipY risk is a non-issue — math + render confirm it follows the drawing).
- **Slider** "Relief depth" (0 → 0.6, default **0.25**) in the svg-port 3D controls (`Canvas3DChrome`). New
  `reliefDepth` in `Canvas3DContext`; threaded via the `svgPortBuild` bundle (folded in at `LiveObject3DSlot` + `Live3DMount`
  from `useCanvas3D`, and at `DeskDoodlesCanvas`), consumed in the build effect (CPU displace) + material (drop GPU disp);
  `builtSigRef` sig includes reliefDepth so the slider rebuilds live. Dev flag `__sealedRelief` still overrides for tuning.
- **VERIFIED:** slider drives depth live (`/tmp/dd-shots/slider-flat.png` 0 vs `slider-bold.png` 0.6); desk all-11 styles at
  the 0.25 default render clean, **no tearing**, lag worst 50 ms, 0 err. tsc+build green. Make kit: Canvas3DContext,
  Canvas3DChrome, Stroke3DScene, DeskObject3DMount, DeskDoodlesCanvas synced.
- **2026-06-21 cont. — CRISP HARD EDGES, "two versions" (Sebs: "wasm and make friendly version"):**
  - **Version 1 — MAKE-FRIENDLY crisp walls (DONE + verified, no WASM):** `buildSvgPortTexture` now builds a SECOND,
    sharper structure-height (`structHtCanvas`, box-blur R=longPx·0.006 vs the soft 0.018) returned as
    `SvgPortTextureResult.structureHeight`; the deep CPU displacement (`displaceFrontCapByHeight`) uses it + a finer cap
    tessellation (0.022 when reliefDepth>0) → STEEPER/crisper recess+standoff walls on the WELDED mass (can't tear).
    Verified `/tmp/dd-shots/bold-SOFT.png` (rounded ramps) vs `slider-bold.png` (steeper walls); lag 50 ms, 0 err.
    Make kit: drawingTexture.ts, Stroke3DScene.tsx synced.
  - **Version 2 — manifold-3d WASM CSG (DONE + browser-verified):** `manifold-3d ^3.5.1` (lazy WASM chunk, 541 KB wasm +
    42 KB js). `lib/geometry3d/csg.ts` = `loadManifold()` (lazy, cached, null on fail) + `applyCsgRelief(mass, features,
    {frontZ, depth})`: THREE→manifold (POSITION-ONLY weld — split normals/uv block the weld → NotManifold), subtract a tool
    per INDENT feature (sheer-walled recess) / union per RAISE (proud standoff), back to THREE. `drawingTexture` now returns
    `treatFeatures` (the treatMask rect/circle primitives in WORLD coords). Build effect runs CSG when `reliefCsg` +
    depth>0 + features, FALLS BACK to V1 on null. **"Walls: Smooth ↔ Sharp" toggle** in the svg-port controls (shows when
    depth>0). **VERIFIED in-browser** (`dd-csg-verify.mjs`): `__manifoldLoaded=true`, `__csgApplied=18`, 0 errors, objects
    render clean (no boolean holes). **KEY FIXES:** (a) Vite needed the wasm URL via `import wasm from
    'manifold-3d/manifold.wasm?url'` + `Module({locateFile})` — without it the browser fetched HTML→"expected magic word".
    (b) position-only weld. **SCOPING (honest):** CSG only fires on CLEAN-ish styles with PRIMITIVE rect/circle elements
    (Game Boy screen/buttons) — rough/styled convert primitives to paths → no features → V1; freehand doodles → no
    primitives → V1. So CSG is a niche crisp tier for primitive shapes; V1 is the universal crisp. ⚠️ **Make-iframe
    cold-load test is still Sebs's deploy.**
  - **CSG TUNE + npm (2026-06-21):** featureTool caps the INDENT sink to **0.7×slab thickness** (a deep screen always
    leaves a floor — no punch-through) + rise=depth·0.7 (proud standoffs). V1 vs V2 verified on clean catalog primitives at
    depth 0.6 (`/tmp/dd-shots/tune-{smooth,sharp}.png`): Smooth=soft dimples, **Sharp=real cylindrical button standoffs +
    sunk panels**, no artifacts, 0 err. **npm: NOW 0 VULNERABILITIES** — the 2 advisories were NOT manifold (it's clean):
    pre-existing **dompurify** (mod, fixed via `npm audit fix`) + **react-router** (high, bumped 7.13→**7.18.0**, routes
    re-smoked 0 err). ⚠️ **Make pnpm needs:** add `manifold-3d@^3.5.1`, bump `react-router`→^7.18.0. ⚠️ `npm install`/`audit
    fix` PRUNES `--no-save puppeteer-core` (reinstall after).
- **OTHER next tiers:** Step 5 port to NATIVE; then the 3D OFAT (Sebs: "leave OFAT for the end"). Taste calls open:
  per-style depth presets, V/U engrave wall, indent-vs-raise thresholds (`PHASE-2-DEEP-RELIEF-PLAN.md` §6).

---

## 🔴 OPEN BUGS (verified still broken)

### Robustness / crashes — ✅ PHASE 0 DONE (2026-06-19, tsc+build green)
- ✅ **contentHash insecure-context crash** — pure-JS SHA-1 fallback added (`contentHash.ts`, output verified byte-identical to Node crypto across edge cases).
- ✅ **O(n²) sibling pass** — `MAX_TOPOLOGY_SIBLINGS=1500` early-out in `signals.ts extractTopology`.
- ✅ **personalSpace READ helpers gated** — `listMyDesks/listMyDrawer/listShelfOf` (+ listMyShelf via delegation) early-return `[]` when `!isPersonalSpaceDbReady()`.
- ✅ **`<use>`/`<symbol>` instantiation** — `expandUseReferences()` in `svgUpload.ts` clones referenced geometry before sanitize; verified in real DOM (symbol+use, xlink, unresolvable-drop, no-use-untouched). **+ LIVE END-TO-END (2026-06-21, headed Chrome):** uploaded a `<symbol id=star>`+`<use xlink:href>` icon → renders a real filled star (uses:0, real path, non-blank), fit/centred by normalizer (symbol-viewBox scale is dropped but the viewBox-fit re-frames it, so no visual loss), survives Place-on-desk (`icon-1-loaded.png`, `icon-2-placed.png`). Harness `dd-icon-upload.mjs`.

### Fill / draw (the core wedge — arbitrary doodles)
- ✅ **Stipple = hachure on uploads — RECONCILED NON-BUG (2026-06-21, verified from code).** Stipple's chrome DOES expose a
  `fillStyle` control (`modifierSpecs.ts:102` — stipple's MODIFIER_SET includes `'fillStyle'`), so it's CORRECTLY absent
  from `STYLE_OWNS_FILL_GRAMMAR` (that set is for styles with NO fillStyle control). Picking stipple in the real UI applies
  its preset → `fillStyle:'dots'` → renders dots. The "hachure" only appears via the `__ddSet` test seam, which bypasses the
  preset-snap (the OFAT artifact R14 already flagged). Adding stipple to the set would BREAK the user's ability to pick a
  different fill = a regression. No fix needed; the open-bug entry was wrong.

### Drag / drop
- ✅ **Stale-drag closures** (Phase 0, 2026-06-19) — `handlePointerMove`/`handlePointerUp` now read `draggingIdRef`/`objectsRef` at event time + dropped from deps (stable handlers, no churn/stale-jump). ✅ FUNCTIONALLY VERIFIED (2026-06-21, `dd-drag`): grabbed an object by its grip, dragged a known delta → it TRACKED the cursor and LANDED at the drop point (43px miss = within snap+grip offset), no stale-jump/snap-back, 0 errors. ⚠️ Only the subjective drag *smoothness/feel* is left for Sebs.
- ✅ **Drag-follower — "doodle off a dimmed card" DONE (2026-06-23).** The TODO note was stale: the drag image was ALREADY only the doodle (`setDragImage([data-dd-card-art])` in BOTH `DrawerPanel` + `PersonalDrawer`), not the full card. The real gap was the **dimmed source card** — added: on dragstart (after the drag-image snapshot, via `requestAnimationFrame` so the floating doodle stays bright) the source card dims to `opacity 0.4` (`isDragging`/`draggingId` state), restored on dragend. So only the doodle floats off a greyed card. Native HTML5 DnD kept → the desk drop pipeline is untouched. tsc + build green. ⚠️ Visual verify is Sebs-side: the demo drawer is EMPTY (needs personal-space items / Supabase — same gate as D1 + the stash). NOTE: the float is the native drag-image SNAPSHOT (static), not a live pointer-tracking custom follower — if you want the premium live follower (styled, smoother), that's a bigger separate build (pointer-DnD or a portal follower positioned via dragover); flag it and I'll do it.

### Personal-space
- ✅ **Re-draw for uploaded Quiver SVGs — DONE + VERIFIED END-TO-END (2026-06-21, real upload, headed Chrome).** Proof
  (`dd-upload-drawover.mjs`): upload SVG → Place on desk → tap → edit card opens **mine** → **"Draw over"** button present →
  drew a stroke over it → Done enabled → saved; the drawn wave composites INSIDE the uploaded shape (`/tmp/dd-shots/up-4-
  after.png`), "Draw over" stays available after (repeatable), 0 errors. (Earlier "needs eyeball" caveat retired — fully
  driven now.) The
  edit modal now offers **"Draw over"** for any object with NO recorded strokes (uploads / legacy doodles), instead of the
  dead-end "drawn before re-editing existed". New `redrawBackdrop = storedStrokes ? null : prepareBackdrop(artMarkup)` →
  the current art rides BEHIND the redraw `DrawSurface` as a `backdrop` (the SAME create-flow draw-over primitives:
  `prepareBackdrop` + `composeBackdropAndStrokes` + `DrawSurface.backdrop`), you draw new ink/tone ON it, and Done
  `composeBackdropAndStrokes(... {tight,toneFills})` bakes it into the markup WITHOUT setting `render_config.strokes` (so
  it stays draw-over-able, repeatable). Button label "Draw over" / "Re-draw"; gate `redrawing && (storedStrokes ||
  redrawBackdrop)`. ⚠️ **Verify caveat:** the edit row is gated `isSandbox ? Close-only : Delete+Re-draw`, so demo-wall
  objects (sandbox, not mine) can't show it headless — confirmed the gate + that `prepareBackdrop` accepts valid markup, but
  the end-to-end UI (open a MINE upload → Draw over → draw → Done → saves) needs Sebs's eyes on a real upload. Make kit:
  ObjectSurface.tsx synced.

### Low-priority
- ✅ **`/playground` 3D toggle dead — HONESTY-GATED (2026-06-21).** `DeskDoodlesPlayground.tsx` had no `mode==='3d'` render branch (3D testing lives on /canvas), so the 3D pill just highlighted + mounted nothing (and the tooltip still said "lands Day 11"). The 3D pill is now `disabled` + dimmed with an honest tooltip ("3D testing lives on /canvas — this playground is 2D only"), matching the disabled Publish button beside it. tsc green. (Wiring 3D into a dead dev page = wasted effort; the gate is the right call.)

---

## 🟡 PARTIAL (works, incomplete)

### Smart toggle (R32 — the one-tap auto-style)
- ✅ **Draw-input OVER-ABSTAIN fixed — Smart now works on real freehand doodles (2026-06-26).** Tested Smart on actual hand-drawn doodles (not the 197 catalog — the wedge's REAL target per [generalizes_to_arbitrary_drawings]) via a draw-harness: a clean **face** and **house** ABSTAINED ("signals carry too little to move the pen"). Root cause: for `input==='draw'` only TWO style rules existed — `draw-dense-scribble` (≥10 regions) and `draw-bold-strokes` (1-4 long strokes). The fill rules need `filledCount` (drawn ink is stroke-only → 0) and `upload-linework` is gated `input==='upload-svg'`, so ordinary doodles (a few MODERATE strokes) matched nothing → abstain. FIX: added rule **`draw-linework`** → `sketchy` + `none` for real hand-drawn line art (`regionCount 2-9, inkPerDiag≥1.2, per-stroke ink<1.2`), mutually exclusive with the other two draw rules so the style vote never splits. Verified live (`/tmp/smart-freehand.cjs`, isolated page per doodle): face/house/tree → pick "hand-drawn line art" (sketchy); long scribble → bold-ink; **trivial 1-stroke squiggle still ABSTAINS** (honest-abstain preserved per the "keep abstain" call). Regression: catalog UPLOAD picks byte-identical (pokeball→rough/hachure, guitar→cross-hatch… — draw-gated rule doesn't touch upload). Screenshot `/tmp/smart-freehand/face-after-smart.png`: receipt "smart picked sketchy — hand-drawn line art · UNDO", dropdown=Sketchy. tsc+build green. ✅ **`sketchy`-vs-`rough-handdrawn` default RESOLVED (compared live, `/tmp/doodle-default/*`): Sketchy / Rough-hand-drawn / Bold-ink render VISUALLY IDENTICAL on a clean thin-line face** — the wobble/roughness deltas only surface on thicker strokes or fills, not plain line art. So the choice is moot for line drawings; kept `sketchy`. OBSERVATION (not a bug): Smart's pick on already-clean line art is coherent but visually subtle (a clean line drawing is already a good hand-drawn style — little to "improve" without inventing fills). If you ever want Smart on a plain doodle to be more visibly transformative, that's a taste call (e.g. bump strokeWidth/wobble) — flagged, not done.
- ✅ **Upload-input OVER-ABSTAIN fixed too (2026-06-26).** Pulled the REAL features for the 3 abstaining catalog uploads (`/tmp/smart-upload-features.cjs`) → two distinct gaps: (a) **shoe + macbook** = line art with one near-WHITE incidental fill (meanDarkness 0.08, darkFraction 0) — missed `upload-linework` only because filledCount≠0; (b) **gameBoy** = three MEDIUM-DARK fills (meanDarkness 0.69, darkFraction 0.67) — fell between `few-big-blacks` (needs ≥0.75) and `dark-fill-field` (needs ≥4 fills). FIX = two precise, mutually-exclusive rules: **`upload-light-linework`** (predominantly stroked + filledCount 1-2 + darkFraction 0 + meanDarkness≤0.3 → sketchy/none) and **`few-mid-dark-fills`** (filledCount 1-3 + darkFraction≥0.5 + meanDarkness 0.55-0.75 → rough-handdrawn/hachure). Verified ALL 6 catalog objects now pick, ZERO abstains: pokeball/vinyl→rough/hachure + guitar→rough/cross-hatch (the 3 that worked = BYTE-IDENTICAL, no regression), gameBoy→rough/hachure, shoe+macbook→sketchy/none (the 3 fixed). Renders confirmed (`/tmp/upload-fix/*`: shoe = clean sketchy line art; gameBoy already hand-drawn at baseline so the pick reinforces = minimal delta, correct). tsc+build green. NET: Smart now confidently styles real freehand doodles AND uploads; abstain reserved for genuinely-nothing input.
- ✅ **Generalization confirmed (11 varied freehand doodles, not overfit to the tuning sample).** face/house/tree/stick-figure/"hi"-letters → sketchy (line art); scribble/star/spiral → bold-ink (long confident gestures); dense-scribble → sketchy; **trivial squiggle + single straight line → honest abstain**. No over-fire (trivial cases still abstain), no under-fire (all real doodles pick). 0 errors. Smart robustness across draw+upload = DONE.
- ✅ **Abstain acknowledgment — DONE + clarified (2026-06-26, Sebs "keep abstain, just make it clear").** Smart correctly ABSTAINS on ambiguous/mechanical line-art (sweep: gameBoy/shoe/macbook abstain; pokeball/vinyl→hachure, guitar→cross-hatch) — honest by design (no confident svgStyle rule → pen left alone, 09-LOCKED-MODEL). FORK RESOLVED: Sebs chose keep honest-abstain (NOT always-pick-something), make the acknowledgment clearer. The silent-no-op (a tap that changed nothing read "broken") is fixed + made legible: `onSmart` returns `'applied'|'abstained'`; on abstain the shared `SurfaceControls` pill shows a **filled** chip **"✦ Smart · looked — nothing to change"** (warm-gray fill + dark readable text, held ~2s, then reverts) — honest (says it LOOKED and found nothing to change, NOT an endorsement of the current style) and unmistakable. Three distinct legible states: resting (outline) / applied "· on" (dark fill) / abstain (filled tint). Fixes BOTH surfaces from the one component (DrawPanel `stableSmartRun` + edit-modal `runSmartPick` both return the outcome). Verified live (`/tmp/verify-abstain-ack.cjs` + screenshots `/tmp/abstain-resting|flash|reverted.png`): gameBoy filled-chip ack→reverts after 2s, pokeball still "· on", 0 errors. CORE feature live-verified both surfaces (restyle, overridable I-1, 'pick'+'overridden' both feed `__dd_inputPickLog`).

### Fill / draw
- ✅ **Full-fill: Gap slider now tunes the flood** (Phase 1, 2026-06-19) — `floodFillAt` passes `gapClosePx: DEFAULT_GAP_CLOSE_PX * gapMult`, so None/Small/Med/Large scales the gap-close FLOOR. Default (gapMult=1) = old 6px = byte-identical (no regression on closed/nested fills); higher seals bigger gaps; multiscale still picks the largest bounded flood. ✅ FUNCTIONALLY VERIFIED (2026-06-21, esbuild fn-test of `fillRegionAtMultiScale`): a gapped ring SEALS into a bounded fill region (28–81px openings → sealed, bounded outline + 0 leak), and `gapClosePx` is wired into the ladder ceiling (`regionFill.ts:914-920`). NOTE the multiscale SHAPE-ceiling (`MULTISCALE_CEIL_FRAC·minBboxDim`) provides a smart floor that dominates for large shapes, so the SLIDER's visible leverage shows in the regime where a gap exceeds the shape-ceiling — best seen live (unit scale differs between the fn-test coords and the app's world coords). ⚠️ Sebs: the "crank gap → seals a bigger gap" visual + default-gap feel is the 10-sec live check.
- 🟡🔵 **Stipple-on-uploads** — DIAGNOSED (Phase 1): the chrome style-change DOES snap the preset (`applyStylePreset` sets `fillStyle:'dots'`), so a real user gets dots. The OFAT "renders hachure" flag is almost certainly the **dev-seam setting style without snapping** (no real chrome path). NOT patched — adding stipple to `STYLE_OWNS_FILL_GRAMMAR` would kill its legit fillStyle control. Needs a real chrome-driven live repro before any change.
- 🟡 **even-odd holes** — multi-subpath donut DONE (`evenOddRegionPath`). **PENTAGRAM (self-intersecting single subpath) → FIXED (2026-06-21):** the old `subs<2 → null` skip flooded it solid; polygon-clipping resolves a self-intersecting ring to NONZERO (verified, no hole). New fallback `evenOddViaRaster` rasterizes the path with the browser's OWN `fill('evenodd')` + a 1-cell dilation (seals the measure-zero pinch points at the inner vertices, else the center hole leaks to the outside) + the proven `traceToRings` marching-squares tracer → true outer + pentagon-hole rings. **Verified in the real browser** (`dd-evenodd-pentagram`: pentagram d → 2 subpaths = outer + hole; `dd-evenodd-raster-check`: canvas evenodd center=0/arm=255/nonzero-center=255). ⚠️ Verification level = FUNCTION-level in-browser + trivial unchanged integration (`if (eo) pathD = eo`, already exercised by donut/star); NOT driven through a full styled hachure render (the /canvas upload preview renders browser-native, not smart-hachured — that path runs in SvgStyleTransform under a hachure style). **github** (solid-fill nonzero-winding) stays in 🎯 post-submission (line below). → KS §1B (logo stress, not real doodles)
- ✅ **Circle snap fit** (Phase 1, 2026-06-19) — `fitCircle` now uses the **Taubin** algebraic fit (Chernov) instead of Kåsa: unbiased on partial/open arcs so the snapped circle no longer under-closes. Validated vs Kåsa on full+270°+200° arcs (matches/beats everywhere). ✅ FUNCTIONALLY VERIFIED LIVE (2026-06-21, `dd-snap-circle`): drew a rough wobbly circle on /canvas → clicked Snap → "SNAPPED TO CIRCLE", recognized as **Circle** (switcher), clean circle rendered, 0 errors (`snap-after.png`). ⚠️ Only the subjective snap *accuracy/feel* on his own hand-drawn circles is left for Sebs.
- ✅ **Single-tap Ink dot** (Phase 1, 2026-06-19) — a tap on bare paper with nothing selected lays a pen dot (1-point stroke). Tap-on-stroke still selects; paper-tap with a selection still deselects. ✅ FUNCTIONALLY VERIFIED LIVE (2026-06-21, `dd-tap-dot`): single tap on bare paper laid a clean pen dot (0→2 marks, `tap-dot-zoom.png`), 0 errors. ⚠️ Only the subjective dot *read/weight* is left for Sebs (easy revert if not).

### 3D / svg-port
- ✅ **svg-port jagged rims — FIXED + VERIFIED (2026-06-21, dd-disp-blur-ab + dd-deep-canvas + dd-svgport-zoom).** Diagnosed with real renders (NOT the source-guess): the mesh silhouette was ALREADY smoothed (`smoothClosedLoopCornerAware`); the real defect was the **CPU deep-relief displacement** faceting a SAWTOOTH CROWN at the rim — the SHARP displacement height field (`carveDispSharp`, blur 0.006) carried high-frequency content (chiefly the outermost ink stroke sitting on the silhouette) that the coarse tessellated cap couldn't resolve. Fix: blur the displacement field 0.006→**0.02** (`drawingTexture.ts`), smoothing the slopes so the cap resolves them as continuous geometry. FREE — `boxBlurField` is running-sum O(w·h), radius-independent. Verified: rim sawtooth gone at 0.25 + 0.45 depth, **feature relief still reads** (Game Boy buttons/dial/screen, Pokéball band — checked clean/rough/bold/stipple), inner panel + rings + center square intact. Dead-end noted: a geometric rim-feather (feather displacement at |nz|<0.5 wall verts) was built + A/B'd and **removed** — it showed zero visible improvement because TessellateModifier interpolates normals un-renormalized, making the wall-vert detection unreliable (99732 false "ring" verts). Crisp TRUE-vertical feature walls remain available via V2 CSG (`reliefCsg`). → KS §1E CLOSED
- ✅ **Line-art on explicit Extrude/Solid — RE-DIAGNOSED with real renders (2026-06-21, dd-lineart-many: a 9-stroke sun = ring + 8 rays).** The TODO premise was half-stale. Actual behavior: **Auto** ✅ (line-art bias `convert.ts:195` `autoLineArt = mode==='auto' && nonEmpty.length>=6` → per-stroke INFLATE → ring=torus, rays=clean capsules); **explicit Solid** ✅ now reads FINE (`buildPoolSolidGeometry` + holes → ring + rays survive as clean solid bars, NOT a blob — prior etch/cap fixes landed); **explicit Extrude** ❌ STILL BROKEN — the closed ring FILLS into a disc (slab) and the open rays SHATTER into spiky shards. So the remaining bug is **explicit Extrude on a many-stroke line drawing**, NOT Solid. Fix sits on the explicit-Extrude branch (`convert.ts` ~`mode==='extrude'`), which the code marks "**sacred — separate branches**" (`convert.ts:163`, Sebs video-confirmed explicit picks stay literal) → the fix DIRECTION is a design call (override explicit Extrude for line drawings vs honor-the-pick-but-fix-quality). **FIXED + VERIFIED (2026-06-21).** Root cause found via real renders (rod mode = clean, extrude = shards → NOT geometry): the rays ARE clean rods (`buildExtrudeGeometryWithHoles` open-stroke guard → `buildRodGeometry`, confirmed via per-stroke `__extrudeDbg`). The shards were a MATERIAL bug — `Stroke3DScene.tsx:1519` applied `bodyMaterial` (= the native bas-relief `reliefMaterial`, which carries a `displacementMap`+`bumpMap` on PLANAR whole-pool relief UVs) to EVERY build. Build[0] (the carved mass) is tessellated w/ matching relief UVs so it carves right; but builds[1..] (the per-stroke ROD rays) have their OWN rod UVs + no tessellation → the displacementMap shoved their verts to garbage = the feathered shards. Fix: `material={i === 0 ? bodyMaterial : material}` — the carve material is the MASS's alone; every other build wears the plain ink material (clean rods, identical to Rod mode). Sebs-confirmed intent ("do the rec + still show the strokes"): honor the Extrude pick, fix quality. Verified: sun (ring=carved disc + 8 clean rod spokes, no shards) AND a multi-stroke Game Boy in extrude (clean body + screen panel + 2 buttons). Regression: native SOLID Game Boy carve/etch still reads perfectly (solid/svg-port are single-build → `i===0` always → byte-identical); `tsc` green. → KS-P2 §2 CLOSED
- ✅ **RC-2 open-tangle — RE-VERIFIED, no longer buries interior (2026-06-21, dd-tangle: a dense self-crossing scribble ball).** The P1 audit flag predates the etch/bas-relief work. Real renders now: **Auto** → the whole scribble reads as one clean continuous 3D tube (every loop/crossing legible); **Solid** → a clean solid silhouette mass with the interior tangle surfaced as LIGHT etched/incised lines (NOT buried). Interior is legible in both. A dedicated whole-pool openness gate isn't needed for legibility; if a future doodle proves otherwise, reopen. → leftover P1 CLOSED
- ✅ **`webglcontextlost` listener — ALREADY WIRED + RECOVERY VERIFIED (index was STALE, 2026-06-21).** `attachContextLossHandlers(gl)` (`contextLoss.ts`: `preventDefault()` on lost → opts into restore; `gl.resetState()` on restored) is wired in `onCreated` of BOTH canvases — the shared desk canvas (`MultiStroke3D.tsx:165`) AND the single-object canvas (`Stroke3DScene.tsx:1886`). Verified RECOVERY (not just wiring) via `dd-ctxloss` (WEBGL_lose_context ext → loseContext()+restoreContext()): the `lost` event was `defaultPrevented:true`, and after restore the canvas repainted the drawing intact (nonblankFrac 1, meanL 247 — NOT the permanent-black failure). Complements the hard-throw `Canvas3DBoundary` (DeskObject3DMount) for the soft silent-loss case. → KS-P2 §5A CLOSED

### Image-upload / AI-mesh
- ✅ **hardMeshUrl re-persisted when generated IN the edit modal** (index was STALE — already fixed in code, verified 2026-06-21). `generateAiMesh` sets `setHardMeshUrl(mesh.glbUrl)` (`ObjectSurface.tsx:1300`); `handleDone` writes `config.hardMeshUrl = hardMeshUrl` (when set) and DELETES it when cleared (`:940-941`), plus `config.aiMesh` look (`:944`). `handleDone` is a fresh per-render closure so it reads the latest mesh url (no stale-closure gap on this path). A modal-generated mesh now reloads the cached GLB instead of regenerating.
- 🟡🧑‍💻 **Image-class fill policy — DECIDED + MECHANISM BUILT (Sebs 2026-06-21: "image-specific policy").** Image sources are a TONAL source, not line-art, so they shouldn't ride Clean's `fillStyle:'hachure'` grammar (→ busy cross-lines on photos). `acceptUploadMarkup` now, for `kind==='upload-image'` only, swaps the fill grammar to **`'solid'`** = opacity-only darkness fill (09-LOCKED-MODEL I-2 + 16-research-solid-tonal-density → flat posterized tonal read, never hachure); register stays Clean; line-art SVG uploads unchanged. Localized + reversible; tsc green. ⚠️ **VISUAL VERIFICATION IS INHERENTLY SEBS-SIDE:** the image trace runs through the `image-to-svg` Supabase EDGE FUNCTION (Quiver proxy) — can't trace a raster locally — so the flat-tone read on a REAL photo needs his deployed infra + a photo (couples with the DB/Supabase step). NOTE the unresolved subtlety: clean preset is `fillStyle:'hachure'` yet old comments claim "Clean renders flat" — the solid swap makes the tonal intent EXPLICIT regardless. Richer future option: route images through `smartPickFromMarkup` to also pick the register (not just force solid).

### Save / persistence
- ✅ **Async-save closure capture — DONE (2026-06-21).** Added `saveStateRef` (`ObjectSurface.tsx`), a per-render snapshot `{name, why, author, surfStyle, surfMods, view3d, hardMeshUrl, baseline}` (assigned every render, plain latest-value ref). `handleDone` + `handleRedrawDone` now build the persisted config from `saveStateRef.current` (a `const s = saveStateRef.current` at the top), not their own async closure → the write uses the latest values even if the handler closure is stale (config swap / async mesh-gen landing mid-edit). Behavior-preserving (the ref holds the same values as the closure at click time); closes the latent stale-config window architecturally on top of the existing `disabled={saving}` re-entry guard. Verified: `tsc` green + draw-over end-to-end (handleRedrawDone path: drew over an upload → Done → the wavy stroke composited INTO the shape + saved, `up-4-after.png`), 0 JS errors.

### Personal-space
- ✅ **Save-routing parity — DONE (2026-06-21).** Investigated both targets: **/canvas needs NOTHING** — its Publish button is intentionally DISABLED ("Publishing lives on /desk — this page is the test surface", `DeskDoodlesCanvas.tsx:541`), so there's no save flow to add parity to (TODO premise was wrong for /canvas). **Edit modal (ObjectSurface): BUILT** the same "Also save to: Drawer / Shelf" multi-select the DrawPanel place flow has — new `allowDrawer` prop (default false), gated from DeskPage to the OWNER-EDIT context only (`personalSpaceOn && desk?.owner_id && obj.ownerSession === getSessionId() && mode==='edit'` — off on public desks / sandbox / drawer-edit where a copy is redundant). Pills mirror DrawPanel's exactly (PILL style, aria-pressed, independent toggles). On Done, ticking Drawer/Shelf best-effort `stashToDrawer({svg: normalizeSvgSize(artMarkup,180), name, why, renderConfig})` + `shareToShelf` (independent of the dirty-check so a tick alone stashes; one-shot reset; never blocks the edit save). Verified: `tsc` green + UI renders cleanly in the edit-modal footer (forced-flag screenshot `alsosave-ui.png`, removed after). ⚠️ The actual STASH round-trips Supabase personal space (flag-gated `VITE_PERSONAL_SPACE` + the migrations) → final live stash test is Sebs-side (demo has no personal-space DB); wiring is a faithful copy of DrawPanel's proven path.

---

## 🧑‍💻 SEBS-SIDE / external (code done, needs you)
- 🧑‍💻 **Deploy the mesh-cache write** — `image-to-3d/index.ts` now `writeCache()`s after rehost + client sends `&contentHash=`, but it's INERT until `supabase functions deploy image-to-3d` + the `mesh_cache` table exist. Until then regens pay each time.
- 🧑‍💻 **`image-to-3d` / `image-to-svg` edge fns** deployed with `--no-verify-jwt` (publishable key ≠ JWT) — confirm both live.
- 🧑‍💻 **migration 0002** (claim-time handle uniqueness) — deploy for the hard uniqueness guarantee on warm handles.

---

## 🎯 POST-SUBMISSION SCOPE (un-cut — was deferred for the deadline)
Sequencing + detail in **`POST-MAKEATHON-PLAN.md`**.
- 🎯 **Full rebrand / own design language** (the big cut) — homepage entryways + remove @handle chip live inside this; full visual + motion system pass (`feedback_no_cheap_polish`, own language per `project_desk_doodles_own_design_language`).
- ✅ **Deep geometric svg-port 3D relief — DONE (2026-06-22, Sebs "crisp engrave everywhere").** Phase-2 steps 1-4 landed earlier; the last mile is now built: **`applyDeepCsgRelief`** (`geometry3d/csg.ts`) carves crisp manifold-CSG walls for BOTH primitive treatMask features AND a doodle's **structural tonal regions** — so a FREEHAND doodle gets sheer walls too, not just the soft displacement. Mechanism: read the SOFT height field (fine lines blurred out → STRUCTURE only, fine detail stays normal-map = the §2c split) → threshold recess/raise → `marchingSquaresLoops` contours (world XY, Y-flipped) → one `CrossSection.ofPolygons(EvenOdd).extrude` per polarity → ONE subtract + ONE union (fast, watertight). Verified: desk svg-port + Walls:Sharp → `manifoldLoaded`, `csgApplied:18`, **`csgDeepRegions:68`** (the new contour carve), clean render, crisp panels/buttons vs Smooth (`deepcsg-smooth.png` vs `deepcsg-sharp2.png`), tsc + full build green, no regression on the primitive path. Depth lives on the existing Relief-Depth slider (0→0.6, default 0.25) + Walls:Sharp. ⚠️ Sebs taste: dial the carve depth/boldness on the Game Boy. ⚠️ Known gap: CSG didn't fire on **/canvas** in test (the test surface) — drawn doodles get it once PLACED on the desk (the real surface); /canvas reliefCsg propagation is a separate follow-up. → `3D-SVGPORT-POSTMAKEATHON.md` / `PHASE-2-DEEP-RELIEF-PLAN.md`
- 🎯 **ML go-live** — train a real model on the audit/fidelity dataset (`datasets/smart-layer.dataset.jsonl`); no clock now (`feedback_actual_ml_not_fake`).
- 🎯 **Exhaustive big-daddy OFAT** — every object × every toggle × LOW/MID/HIGH × 2D+3D, paired-vs-Clean (`feedback_full_audit_standard`).
- 🎯 **Smart-layer completion** (the wedge "gets real" — pairs with ML in Phase 5): **Phase C full auto-pick** (the system picks the treatment per region end-to-end, not assisted) · **Phase D engine-routing** (2D→3D conversion routing — half-built) · **Phase F cross-axis cascade** (one change ripples coherently across render+3D+physics). Plus **ML go-live** (Phase 5). Today the "smart system" is a RULE ENGINE — these make it real (`feedback_actual_ml_not_fake`).
- 🎯 **Drawing-tool depth** (standing asks, said multiple times): **MORE primitives/shapes** (beyond the current freehand/rect/circle/triangle/diamond/star/heart) · **select + edit any PART of a drawing** (any region/stroke, not just last-drawn) · **FULL drawing tools on the 3D/`canvas` route** (brush·fill·snap·shade·primitives available there so you draw + test 2D AND 3D in one place) · **open-shape shading** (deferred refinement — shade a non-closed shape).
- 🎯 **Physics / living desk** (smart-layer **Phase E**, PLANNED — 0% wired) — `@react-three/cannon` + `cannon-es` are INSTALLED but never imported (0 refs in `src/`). Objects settle / collide / jiggle on the desk; the wedge extension = **SMART physics presets** (the system picks behavior per object — a ball bounces, paper flutters, a mug sits heavy). **cannon-es NOT Rapier** (Rapier's WASM races in Make's cold-load — locked, `project_desk_doodles_no_rapier_in_make`). Phase F = cross-axis cascade (planned).
- 🎯 **github nonzero-knockout + `<pattern>`/`<defs>`** SVG edge cases (logo stress fixtures, low pri).

---

## ✅ VERIFIED FIXED this sweep (do NOT re-touch — index was stale)
Camera/render **B1–B5** (inline `obj3d` + content-bbox pan clamp) · **3D hachureGap HIGH cap** (`HATCH_GAP_MAX_CSS_PX=22`) · **AI-mesh material-mode toggle** (built in Canvas3DChrome) · **SVG simplify-mode UI** (off/filled/line, both surfaces) · **side-panel populates** (PersonalDrawer in-panel) · **elongated-shift** (sourceIsPercent hosts) · **decision-log channels fed** (shade-fill + shape-snap in KNOWN_SOURCES) · **sourceImage→hard-path** · **pressure-Inflate** · **stroke-toggles→3D** · **2D/3D toggle persist** · **drawer save optimistic** · **local-3D + AI-mesh look persist** · **nested fill / clean edge / tonal-wash I-2** · **AI-mesh empty-well** · **past-desk gate** (is_open) · **global 2D/3D flip authoritative + AI-mesh→2D SVG** · **geometry sweep** · **buttery drawing** · **place-on-desk multi-save** · **3D-controls-switch in edit modal** (Canvas3DChrome).

> ⚠️ `ALL-BUGS-AND-FIXES.md` index statuses are STALE on ~10 rows (this board supersedes). Reconcile that doc opportunistically.
