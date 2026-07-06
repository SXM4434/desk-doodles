# FIX-SPECS — remaining broken-map bugs (READ-ONLY trace)

Traced against current HEAD `ce30289`. **Apply in MAIN LOOP, live-verify on :5182** (worktree agents are on stale base `54ca22f` — half these files don't exist there). Excludes the two owned by other agents (2D shade-fill tone→fill-style; rose→3D bird's-nest).

**KEY ARCHITECTURE FACT (governs all 5 SVG-upload bugs):** Smart Hachure is DEFAULT-ON (`SvgStyleTransform.tsx:2778-2793`). For `rough-handdrawn · sketchy · bold-ink · stipple · wet-ink · charcoal`, the active render path is `renderSmartHachure` (`smartHachure/index.ts`), **NOT** `applyRoughTransform`/`transformElement` (those only run with `?smartHachure=0`). So the fill behavior the OFAT saw comes from `smartHachure/index.ts` + `renderRegion.ts` + `signals.ts`. `buildRoughOptionsForPath` (SvgStyleTransform.tsx:1304) is **dead code** (defined, never called) — ignore it.

---

## SVG-UPLOAD bugs

### BUG U1 — inherited `<g fill>` dropped → fill-style total no-op (HIGH)

**Root cause (two layers, both real):**
1. `smartHachure/index.ts:213` iterates only TOP-LEVEL children (`getRenderableChildren(svgRoot)`). An uploaded SVG that wraps geometry in `<g fill="#333"><path…/></g>` presents ONE top-level child: the `<g>`. The loop classifies the `<g>`, then calls `renderRegion(g, …)` → `extractRegionPath(g)` (`renderRegion.ts:351`) has no `case 'g'` → returns `null` → **zero fill marks**. The outline still renders (via `transformElement` recursing into children with fill stripped), so the upload shows outlines only — fill-style is a total no-op.
2. Even for a NON-`<g>` leaf whose fill sits on an ancestor `<g>`, `signals.ts:42` reads `el.getAttribute('fill')` (own attr only). The fallback `readComputedFill` (signals.ts:277-289) *would* resolve inherited fill via `getComputedStyle().fill` — but it rejects `rgb(0,0,0)` when `trustBlack=false` (line 284), and on a DETACHED clone (the FX host is offscreen) computed style may not resolve the `<g>` fill reliably. Result: `darknessL=0` → region classified `paper` → no marks.

**Exact change (smartHachure/index.ts, the dominant fix):** before the per-child loop, FLATTEN inherited paint. Add a pre-pass that, for each top-level `<g>`, recurses into its renderable leaf descendants and pushes the leaf's own `fill`/`stroke` resolved against ancestor `<g>` attrs (reuse the existing `resolveSourcePaint(el, root, prop)` already in `SvgStyleTransform.tsx:2650` — export it). Process the FLATTENED leaf list as the region set instead of the raw top-level children. Each leaf carries an explicit resolved `fill` attribute so `extractRegionPath` gets real geometry and `signals.ts` reads a real fill. Preserve `<g transform>` by composing it onto the leaf (or wrapping the per-leaf marks+outline in the source `<g>`'s transform, mirroring `transformElement` case 'g' at SvgStyleTransform.tsx:2073-2078).
- Minimal variant if full flatten is too big for the deadline: in `renderRegion.ts:extractRegionPath`, when `tag === 'g'`, return the union path of the group's renderable leaf geometry (so the `<g>` itself becomes one fillable region); AND in `signals.ts:extractSignals`, resolve inherited fill by walking `el.parentElement` up to root reading `fill` attrs (don't rely on getComputedStyle on detached clones).
- **Effort: L. Risk: MED** — touches the region-set contract; must not double-process leaves already counted. Verify against a `<g fill>` upload + the existing audit catalog (catalog items must render byte-identical — most are flat top-level children, untouched).

---

### BUG U2 — "Stipple" SVG-STYLE preset renders as diagonal HACHURE, not dots (HIGH)

**Root cause:** `techniqueMap.ts:347-351` correctly maps style='stipple' → `fillStyle:'dots'`. But `smartHachure/index.ts:311-313` computes `userPick = STYLE_OWNS_FILL_GRAMMAR.has('stipple') ? base : fullModifiers.fillStyle`. `stipple` is NOT in `STYLE_OWNS_FILL_GRAMMAR` (techniqueMap.ts:49-55) because its chrome DOES expose a `fillStyle` control (modifierSpecs.ts:102) — so `userPick = fullModifiers.fillStyle`. On STYLE-switch the chrome auto-applies the preset (`SmartHachureChrome.tsx:175`, `DrawPanel.tsx:1380`) which sets `fillStyle:'dots'`, so the preset path is OK. The break is on UPLOADS where the region is a `<g>` (see U1) — `renderRegion` returns `[]`, no dots, and the only fill the eye sees is the legacy fallback hachure. **U2 is a symptom of U1 on `<g>`-wrapped uploads PLUS a latent state-staleness hole.**

**Exact change:**
1. Fix U1 (gets dots flowing on `<g>` uploads).
2. Harden the latent hole: in `smartHachure/index.ts`, when the active STYLE has a canonical fill grammar (stipple→dots, newsprint→dots), the style's preset fillStyle should win over a stale `fullModifiers.fillStyle` if the user hasn't explicitly moved the fillStyle slider since the style switch. Simplest robust fix that respects `feedback_fillstyle_slider_must_switch_classifier_pick`: keep honoring the user pick, but ensure style-switch ALWAYS writes the preset fillStyle (it does today) — and add a guard so an upload arriving with default state (`fillStyle:'hachure'`) under style='stipple' falls back to the treatment's `baseTreatment.fillStyle` (='dots') rather than the stale default. I.e. treat `fullModifiers.fillStyle === STYLE_PRESETS.clean.fillStyle` (the untouched default 'hachure') as "no explicit pick" for stipple/newsprint.
- **Effort: S (after U1). Risk: LOW** — narrow, only affects stipple/newsprint with untouched fillStyle state.

---

### BUG U3 — rough.js "dots" on a large/dark region → ONE `<path>` ~19.7M chars (perf bomb) (MED)

**Root cause:** dots render via `renderRegion.ts:116 ctx.rc.path(pathD, {fillStyle:'dots'})`. rough.js's DotFiller emits a `fillSketch` op-set that the SVG renderer serializes as a SINGLE `<path>` (`node_modules/roughjs/bin/svg.js:53-59`, `fillSketch` → one `path` with all ellipse arcs). Dot count ≈ region_area / gap². On a large dark region the upper-darkness guard caps coverage (`renderRegion.ts:223 COVERAGE_LEGIBLE_DENSE_CAP=0.72`) and layers at 2, but `POLICY_GAP_FLOOR=1.5px` (line 201) over a big footprint still yields hundreds of thousands of dots × arc commands = ~19.7M chars. The element-count cap (svgUpload.ts) can't catch it (one element). No DOT-COUNT cap exists.

**Exact change (renderRegion.ts, in `resolveDensity`'s dots branch / `renderHachureFamily`):** before generating dots, estimate `dotCount ≈ (regionArea / gap²) · layers` and enforce a hard ceiling (e.g. `MAX_DOTS = 6000`). When the estimate exceeds it, raise `gap` to `sqrt(regionArea · layers / MAX_DOTS)` (so count lands at the ceiling) BEFORE calling `rc.path`. Compute `regionArea` from the region bbox (already have `el.getBBox()` via signals, or measure pathD bbox). This is a render-policy ceiling like the existing gap-floor/weight-ratio — coverage honestly saturates at the cap. Optionally pair with a future `<pattern>`-tile path for huge regions, but the gap-raise alone closes the freeze.
- **Effort: M. Risk: LOW-MED** — large dark regions will read slightly sparser at extreme scale (acceptable; the alternative is a freeze). Verify dot `<path>` length stays bounded on a 600×800 dark-fill upload.

---

### BUG U4 — evenodd DONUT loses its hole / floods solid under rough+stipple (MED)

**Root cause:** Two paths fail evenodd holes differently:
1. **smartHachure path (default):** `renderRegion.ts:409-413 extractRegionPath` for `case 'path'` returns the raw `d` and trusts rough.js to clip. rough.js's polygon hachure honors sub-path holes only with the correct fill-rule; the source `fill-rule="evenodd"` / `clip-rule` is NOT propagated to the rough.js fill options or to the generated marks, so a donut's inner sub-path doesn't knock out → flooded solid hatch. Also a solid `<circle>` re-renders via `extractRegionPath` case 'circle' (4-bezier approximation) which is fine, but the donut's two-ring path collapses.
2. **legacy `transformElement` path (`?smartHachure=0`):** the `<path>` branch (SvgStyleTransform.tsx:1751-1813) SPLITS sub-paths on every `M` command and renders each as an INDEPENDENT `renderHandFeelShape` call — so a donut's outer ring and inner hole become two SEPARATE filled loops; the hole becomes a second solid disc, destroying the knockout.

**Exact change:**
- smartHachure: in `renderRegion.ts`, carry the source `fill-rule` (default `nonzero`; read `el.getAttribute('fill-rule')`) onto the rough.js fill options AND ensure the clip path preserves multi-sub-path evenodd. Cleanest: use **polygon-clipping@0.15.7** to compute the true even-odd region (outer minus holes) from the parsed sub-paths, then hachure-clip to THAT. polygon-clipping's `difference` gives the ring; feed the ring polygon to rough.js.
- legacy: don't split donut sub-paths into independent solids — detect multi-sub-path closed `d` and treat inner sub-paths as holes (parity), not new outers. (Lower priority since smartHachure is default.)
- **Effort: M. Risk: MED** — sub-path parsing + polygon-clipping integration; verify donut keeps hole AND a plain solid circle is unaffected.
- **CONFIRMED + PAYOFF EXPANDED (R10, 2026-06-15):** trace verified — `extractRegionPath` (now `renderRegion.ts:475-479`) returns the raw `d` with a "trust the source path — rough.js handles the clipping" comment; `fill-rule` is read by NOTHING in the smart pipeline (grep: only `exportCard.ts` touches it; `signals.ts` never reads it). **github-icon is a second confirming case** beyond the donut: its octocat is an evenodd disc-with-cat-knockout → renders as a solid mangled blob (fills the cat, loses the hole). Repro pics: `/tmp/dd-shots/og-github.png` (correct) vs `github-filled.png` (broken). **U4 also GATES the default-black icon fill** (RUNNING-TODO "DEFAULT-BLACK icon fill", reverted R10): enabling default-black trust before U4 makes EVERY knockout logo (github/x-twitter/nintendo + the donut) fill wrong. **Sequence: ship U4 first, then 1-line re-enable default-black in `signals.ts` extractSignals (see the NOTE comment there).** Plumb `fill-rule` through: `signals.ts` read it → `Signals` → `Treatment` → `renderRegion` builds the polygon-clipping difference region.

---

### BUG U5 — pattern (`url(#pat)`) + gradient fills degrade to empty outline / flat under rough styles (LOW)

**Root cause:** `signals.ts:299-332 resolveUrlFillDarkness` maps `<pattern>` → darkness 0 (→ role `paper` → no marks → empty outline) and gradient → average-stop darkness (→ a flat uniform hachure, losing the gradient ramp). For patterns this is the documented edge-case policy (pass-through), but the visible result is a blank region because the source pattern fill is ALSO stripped by the outline fill-filter (index.ts:389-405).

**Exact change:** for `url(#…)` fills classified as non-hachurable (pattern), KEEP the source fill (add to the `keepsSourceFill` set logic at index.ts:387) so the original pattern/gradient renders beneath the hand-feel outline instead of going blank — same treatment paper knockouts already get. Gradients: optionally render a coarse N-band hachure that steps with the gradient, but minimum viable = preserve the source gradient fill under the outline.
- **Effort: S. Risk: LOW** — additive; only affects url() fills which currently blank out.

---

## DRAWING-TOOLS bugs (fill-region detection)

Shared substrate: `DrawSurface.tsx:470 extractFillRegions` → `strokeTo3d.ts:1784 extractPoolRegions` → `rasterizePoolLoops` (1542). The grid `cell = Math.max(spanX,spanY)/resolution` (line 1563) is sized by the WHOLE-drawing UNION bbox; `resolution` capped at `SOLID_MAX_GRID_RESOLUTION=200`; `SOLID_MIN_LOOP_AREA=2` cells² area filter (line 1587); `inkRadius = SOLID_INK_RADIUS(0.08)·gapMult` stamped per stroke.

### BUG D1 — concentric/nested: tapping inner region floods whole outer shape (MED)
### BUG D2 — tapping a small enclosed hole fills the PARENT body, not the inner region (MED)

**Root cause (shared):** the single union-bbox grid starves small/nested features of resolution. For a 200px-wide drawing the cell is ~1px, but the inner region of a concentric pair is a small fraction of the grid; combined with `inkRadius` capsule stamping, two close concentric rings stamp into ONE merged annulus → the inner paper loop is never extracted as a separate odd-depth loop → `innermostPaperRegionAt` (DrawSurface.tsx:632, which is itself CORRECT: max-depth, tie-break smaller area) only finds the outer paper → flood outer (D1). For a small hole, the inner odd-depth loop falls below `SOLID_MIN_LOOP_AREA` after the coarse cell quantization → dropped → only the parent survives → tap fills parent (D2).

**Exact change — the proven fix from the prompt, applied in `extractPoolRegions`/`extractFillRegions`:**
1. **Spatially-disjoint clustering (fixes separated-shape collapse + tightens nested grids):** before rasterizing, group strokes into connected components by bbox-overlap (grow each bbox by `inkRadius/WORLD_SCALE`, union-find on overlap). Run `rasterizePoolLoops` PER CLUSTER with the cluster's OWN bbox driving `cell` — so a small cluster gets fine cells (cell = clusterSpan/resolution, not drawingSpan/resolution). Merge the per-cluster region trees, re-running `containmentDepths` across all loops at the end so nested-but-not-disjoint cases still parity-correctly (concentric rings are ONE cluster but now at that cluster's tighter resolution). polygon-clipping@0.15.7 available for robust loop merge if needed.
2. **Local resolution lift for nested features:** when a cluster contains nested loops (any loop fully inside another), bump that cluster's `resolution` toward a higher cap (e.g. 400 for the 2D FILL lane only — `extractPoolRegions` already accepts `maxResolution`; DrawSurface.tsx:490 passes `SOLID_MAX_GRID_RESOLUTION`). Pass a higher `maxResolution` for fill so the inner ring/hole survives the `SOLID_MIN_LOOP_AREA` filter and stays a distinct odd-depth loop.
3. Optionally lower `SOLID_MIN_LOOP_AREA` for the FILL lane (it's tuned for 3D mesh density, not 2D fill targeting) so small holes aren't dropped.
- **Effort: L. Risk: MED** — clustering + per-cluster grids is a real refactor of the extractor's front half; keep `buildSolidGeometry` (3D) on its current single-grid path or share carefully (the 3D path is verified). Verify: concentric circles (tap inner → inner only), small hole inside a body (tap hole → hole only), AND a normal single shape + two separated shapes (no regression).

### BUG D3 — gap slider can't close a visibly-open gap (>~12°/70px) even at max (LOW)

**Root cause:** `DrawSurface.tsx:437 GAP_LADDER = [0.5, 0.75, 1, 1.5, 2, 3]`. Max `gapMult=3` → `inkRadius = 0.08·3 = 0.24` world = 24 viewBox px (WORLD_SCALE 0.01). The stamped ink half-width bridges gaps up to ~2·inkRadius ≈ 48px — below the 70px gap the user expects to close at max.

**Exact change:** extend the top of `GAP_LADDER` (e.g. `[0.5, 0.75, 1, 1.5, 2, 3, 4.5, 6]`) so max `gapMult≈6` → inkRadius ≈ 48px → bridges ~96px gaps. Update `gapIdxOf` (no change needed — it scans the ladder) and any UI tick count bound to the ladder length. Confirm the larger stamp doesn't over-weld unrelated nearby ink at high settings (the per-cluster clustering in D1/D2 mitigates this).
- **Effort: S. Risk: LOW-MED** — bigger max stamp can fuse close-but-distinct strokes at the top of the range; gate behind the user explicitly dialing max. Verify a 70px-gap open shape closes at the new max.

### BUG D4 — SNAP overshoot tail past closing vertex + snap-circle endpoint seam (LOW)

**Root cause (two sub-bugs):**
1. **Overshoot tail (n-gon weld):** `shapeFit.ts:1646 closedLoopVertices` collapses a doubled seam vertex only when `dist(first,last) < INTENT_RESAMPLE_SPACING_PX·2 = 8px` (markIntent.ts:45 → 4). When the user overshoots the start by >8px, the spurious near-start corner survives → a little tail past the closing vertex in the snapped polygon.
2. **Circle/closed seam:** `applyCandidate` (shapeFit.ts:2020-2064) seals closed loops by RETRACING leading points an overlap of `min(14, perim·0.05)` px (line 2054). On a large circle `perim·0.05` can be the visible seam-overlap that reads as a notch/bump where the perfect-freehand ribbon doubles back; on small shapes the 14px floor can overshoot. `circlePoints` (shapeFit.ts ~1417) itself is clean (n distinct points, no duplicate seam).

**Exact change:**
1. In `closedLoopVertices`, raise the seam-collapse tolerance to a fraction of `bboxDiag` (e.g. `max(8px, 0.04·bboxDiag)`) so a proportional overshoot near the start folds into the first vertex instead of surviving as a tail. Alternatively trim any trailing vertex whose projection lies PAST the first vertex along the closing edge.
2. In `applyCandidate` seam-seal, make the overlap a small FIXED arc fraction tuned to perfect-freehand's cap (e.g. `min(8, perim·0.02)`), and for circles specifically retrace by ANGLE (e.g. first ~6° of the ring) rather than raw px, so the seal overlaps the start arc cleanly without a doubled-back tail.
- **Effort: S. Risk: LOW** — isolated to shapeFit emit; verify a snapped circle, square, and triangle render sealed with no tail at both small and large scale.

---

## 3D bugs

### BUG 3D-1 — svg-port JAGGED RIMS: carve path bypasses corner-aware Chaikin (HIGH)

**Root cause:** The svg-port body silhouette is built by `buildPoolSolidGeometry` → `buildSolidGeometry` (strokeTo3d.ts:1606), whose `simplify` (line 1640-1652) DOES route through `smoothClosedLoopCornerAware` — so the cap RING is smoothed. The jagged rims are NOT the geometry ring; they're the **carve relief** read off the rasterized markup: `drawingTexture.ts:buildSvgPortTexture` rasterizes the styled `<svg>` to a height/normal field over a window registered to the cap. The relief silhouette and the smoothed geometry ring DON'T share a contour — the rasterized marks carry the marching-squares/RDP-coarse edges of the SOURCE markup (and the styled outline's own jitter), so at the rim the displacement/normal edges read as facets even though the mesh ring is smooth. The fix the handoff names: route the carve's silhouette/contour through the SAME `smoothClosedLoopCornerAware` the geometry ring uses.

**Exact change:** In the svg-port carve build, derive the carve-region silhouette from the SAME smoothed contour the cap geometry uses (`builds[0]` outer contour from `buildSolidGeometry`), not independently from the raster. Concretely: when masking/clamping the height field to the body silhouette in `buildSvgPortTexture` (or when generating the carve channel), clip to the smoothed outer loop (pass the smoothed world contour into `buildSvgPortTexture`, e.g. via `res.window` companion or a new `silhouette` param) so the carved relief's outer edge follows the Chaikin-smoothed ring. Ensure any contour the carve path extracts internally also calls `smoothClosedLoopCornerAware` (strokeTo3d.ts:1481) with the same `CONTOUR_SMOOTH_PASSES`/`CONTOUR_CORNER_PIN_RAD` as commit 186a1a4.
- **Effort: M. Risk: MED** — must keep the carve UV registration (`applyPlanarReliefUVs`, Stroke3DScene.tsx:845) aligned to the smoothed silhouette; mis-registration shifts the marks. Verify a drawn circle's svg-port rim reads smooth (no facets) and a square keeps sharp corners.

### BUG 3D-2 — `viewBox: "Infinity Infinity…"` console error on rose svg-port offscreen render (LOW)

**Root cause:** `drawingTexture.ts:433 svgEl.setAttribute('viewBox', `${vMinX} ${vMinY} ${vW} ${vH}`)`. These derive from `bbox` (the geometry world bbox) and `center = poolCenter(pool, viewBox)` (line 383). `poolCenter` (strokeTo3d.ts:459) only guards the EMPTY case (`!Number.isFinite(minX)`) — if a stroke contains an Infinity/NaN coordinate (a corrupt rose compound-path sample), `maxX` becomes Infinity → `(minX+maxX)/2 = Infinity` → `center.x = Infinity` → `vMinX/vMinY = Infinity` → the `viewBox="Infinity Infinity …"` attribute → browser parse error. The caller's guard (Stroke3DScene.tsx:812) only checks `bb.min.x`/`bb.max.x` finiteness, not `min.y/max.y` and not `center`.

**Exact change (defense in depth):**
1. `strokeTo3d.ts poolCenter`: skip non-finite points in the bbox scan (`if (!Number.isFinite(x) || !Number.isFinite(y)) continue;`) so a stray Infinity can't poison the center. (Note: the file already has a `pointFinite` guard concept at ~line 305 — reuse it.)
2. `drawingTexture.ts:buildSvgPortTexture`: after computing `vMinX/vMinY/vW/vH`, guard `if (![vMinX, vMinY, vW, vH].every(Number.isFinite) || !(vW > 0) || !(vH > 0)) return null;` BEFORE setAttribute — null = caller falls back to the plain lit body (the existing degenerate-bbox contract, lines 337-360).
3. `Stroke3DScene.tsx:812`: extend the finiteness check to `bb.min.y`/`bb.max.y` too.
- **Effort: S. Risk: LOW** — pure guards; no behavior change on valid input. Verify the rose svg-port no longer logs the viewBox error (the bird's-nest geometry itself is the other agent's bug; this just stops the NaN cascade).

---

## Summary table

| Bug | Sev | File(s) | Effort | Risk |
|-----|-----|---------|--------|------|
| U1 `<g fill>` dropped | HIGH | smartHachure/index.ts, renderRegion.ts, signals.ts (export resolveSourcePaint from SvgStyleTransform.tsx) | L | MED |
| U2 stipple→hachure | HIGH | smartHachure/index.ts (after U1) | S | LOW |
| U3 dots 19.7M-char path | MED | smartHachure/renderRegion.ts | M | LOW-MED |
| U4 evenodd donut | MED | renderRegion.ts (+ polygon-clipping); SvgStyleTransform.tsx path branch (legacy) | M | MED |
| U5 pattern/gradient blank | LOW | smartHachure/index.ts | S | LOW |
| D1 nested→flood outer | MED | strokeTo3d.ts extractPoolRegions, DrawSurface.tsx extractFillRegions | L | MED |
| D2 small hole→parent | MED | same as D1 | L | MED |
| D3 gap can't close 70px | LOW | DrawSurface.tsx GAP_LADDER | S | LOW-MED |
| D4 snap tail + circle seam | LOW | shapeFit.ts closedLoopVertices + applyCandidate | S | LOW |
| 3D-1 svg-port jagged rims | HIGH | drawingTexture.ts buildSvgPortTexture, Stroke3DScene.tsx | M | MED |
| 3D-2 viewBox Infinity | LOW | strokeTo3d.ts poolCenter, drawingTexture.ts, Stroke3DScene.tsx | S | LOW |

Available lever for U4 + D1/D2: **polygon-clipping@0.15.7** (installed).
