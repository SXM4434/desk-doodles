# Exhaustive Breakage Catalog — Desk Doodles

**Date:** 2026-06-13
**Method:** Every one of the 197 deduped /audit catalog shapes (93 Trophy-Wall `PinShape` + 104 Pegboard `PegToolShape`) rendered through the REAL production pipelines — `SvgStyleTransform` (2D, smartHachure ON) and `Stroke3DScene` / `StudioRig` (3D) — at LOW / MID / HIGH for every toggle, sliders swept to extremes. Ground truth = each shape's **Clean** SVG render. Every contact-sheet mosaic READ with vision; every flagged cell DRILLED against its Clean render. Read-only diagnosis: no `src/` edits, harnesses under `tools/`, isolated `vite preview` on dedicated ports (never the shared `:5182` dev server), Playwright at `/tmp/dd-pp`.

**Cell math (rendered + analyzed):**

| Sweep | Cells | Harness |
|---|---|---|
| 2D Cluster-1 (path/motion) | 197 clean + 197×26 = 5,122 + 704 broad-extremes | `tools/modext/cluster1-pathmotion-sweep.mjs`, `cluster1-broadset-extremes.mjs` |
| 2D Cluster-2/3 (pen tip + shading/fill) | 197×47 = 9,259 | `tools/2d/cluster23-sweep.mjs` |
| 2D Cluster-4/5 (surface texture + color/palette + geo sliders) | 197×63 = 12,411 | `tools/2d/` (C4/C5 harness) |
| 2D style sweep (11 F3 styles) | 197×11 = 2,167 | `tools/2d/audit-style-sweep.mjs` |
| 2D toggle sweep (34 toggles × 3 levels) | 197×34×3 = 20,094 | `tools/2d/audit-toggle-sweep.mjs` |
| 3D geometry (5 modes × 2 orbits) | 197×10 = 1,970 | `tools/3d/visual-3d-sweep.mjs` |
| 3D style/material/per-mode toggle (90-state matrix) | 177×90 ≈ 15,930 (+177 clean) | `tools/3d/catalog-visual-3d.mjs` |

**Grand total: ~67,000+ rendered cells across 7 exhaustive sweeps. No sampling on the object set — all 197 rendered in every sweep except the 3D style/material matrix, which capped at 177 (20 head shapes deferred — GPU-saturation honest gap, see Coverage §).**

---

## 1. Per-cell breakage table

### 1A. 2D — SVG styles & toggles vs Clean

| Shape(s) | Toggle / Style + level | Symptom |
|---|---|---|
| **lacroixRack** | rough-handdrawn host — ALL Cluster-1 states (multiStroke L/M/H, wobble/jaggedness/bowing/curve/sketchingStyle/endpoint all levels). Worst at strokeWidth HIGH (3.0). | broken-geometry → **solid-black-blob** at strokeWidth HIGH |
| **ps5Controller** | rough-handdrawn host — ALL Cluster-1 states incl. calmest (wobble LOW); persists at curve/bowing HIGH | wrong-read |
| **worryStone** | rough-handdrawn — multiStroke LOW / strokeWidth LOW (thin single pass) | wrong-read |
| framedDribbble | fillStyle=solid AND hachure (default); fillDensity-high, hachureGap-low, hachureAngle any, fillOpacity-mid/high | solid-black-blob |
| perrierPoster | fillStyle=solid AND hachure (default) + all density/gap/angle | solid-black-blob |
| pitchDeckCover | fillStyle=solid AND hachure (default); white ION / YC W24 text overpainted | solid-black-blob |
| psPoster | fillStyle=solid AND hachure (default) + density/gap/angle | solid-black-blob |
| vinylLpSleeve | fillStyle=solid AND hachure (default); PUNK / SIDE A label + disc swallowed | solid-black-blob |
| boxedGameCartridge | fillStyle=solid AND hachure (default); NES / SUPER MARIO label swallowed | solid-black-blob |
| ppvPoster | fillStyle=solid AND hachure (default) + density/gap/angle | solid-black-blob |
| framedMoviePoster | fillStyle=solid AND hachure (default); FILM / A FILM BY text swallowed | solid-black-blob |
| ps1JewelCase | fillStyle=solid AND hachure (default); PlayStation header + spine ridges swallowed, FINAL FANTASY barely survives | solid-black-blob |
| framedRacePhoto | fillStyle=solid AND hachure (default); FINISH banner + runner figure swallowed | solid-black-blob |
| wrestlingCard | fillStyle=hachure (default) + solid; dark photo panel blobs (wrestler lost), frame/labels survive | unrecognizable-vs-clean |
| vhsClamshell | fillStyle=hachure (default) + solid; dark sub-region partially fills over inner detail | unrecognizable-vs-clean (borderline) |
| looseCartridge | fillStyle=hachure (default) + solid; dark label region overfills inner detail | unrecognizable-vs-clean (borderline) |
| collectorTin | fillStyle=hachure (default) + solid; dark lid/body region partially blobs | unrecognizable-vs-clean (borderline) |
| letterboxdCard | fillStyle=hachure (default) + solid; 4×2 dark film-grid cells blob; header/footer survive | unrecognizable-vs-clean (borderline) |
| flagPanel | fillStyle=hachure (default) + solid; dark panel region overfills | unrecognizable-vs-clean (borderline) |
| colombianFlagFolded | fillStyle=hachure (default) + solid; dark fold region partially overfills banding | unrecognizable-vs-clean (borderline) |
| **vinylLpSleeve, psPoster, boxedGameCartridge, framedMoviePoster, ppvPoster** + similar light-panel-with-label | **stipple** style at PRESET (fillStyle=dots, fillDensity=1.0, hachureGap=2.5) | solid-black-blob |
| **all 197 shapes** | **inkIntensity = 0** (slider floor) — wrapper opacity 0 | **empty** |
| framedMoviePoster, psPoster, ppvPoster, boardingPassTW (large pale-wash posters/passes) | inkIntensity = low (0.1) | wrong-read |
| **~118 stroke-only line-art shapes** (overEarHeadphones, monitor, macbook, mxMouse, usbCCable, controllers, pens, guitars, plants, keychains, rings, suitcase…) | **strokePalette = bg (and identically inverted)**, any level — both resolve to `var(--dir-bg)` paper, applied to STROKE ink, on paper direction | **empty** |
| ~78 partially-filled shapes (conferenceLanyard, monitor, loveLetter, nesController, ps5Controller, walkmanMixtape, lacroixRack, vhs, dualShockController) | strokePalette = bg / inverted — strokes vanish, only filled regions remain | wrong-read |
| 49 outline-dominant shapes (framedSketch, stackedSketchbooks, bandPatch, zeldaMap, raceMedal, friendshipBracelet, foldedMap, triangleRuler…) | strokePalette = inverted (and 'bg') | empty |
| wet-ink + charcoal styles (all 197) | PRESET — filter overlay only; these styles never enter `renderSmartHachure` (host gate admits only rough-handdrawn/sketchy/bold-ink/stipple), so techniqueMap's wet-ink/charcoal tonal-fill grammar is **DEAD**; output reads near-identical to Clean | unrecognizable-vs-clean (no transform) |

**Cluster-1 broad gnarly extremes (32 shapes × 22 states = 704 cells):** ZERO catastrophic flags. Only `ms_off` / `ms_single` SHRUNK (8 each = thin-render fill-loss) + 1 `ep_kink` SHRUNK.
**Cluster-2 (pen tip + texture + textureIntensity):** 100% clean — every pen tip and texture, incl. textureIntensity HIGH 3.0× on the heaviest displacement recipes (smudge/chalky/canvas), is a faithful recognizable transform of Clean. No shredding.

### 1B. 3D — geometry modes, styles, materials, per-mode toggles vs Clean

| Shape(s) | Mode / style / material + level | Symptom |
|---|---|---|
| **144 of 197 multi-stroke interior-detail shapes** (frames/grids/screens/faces/buttons/bands) | **solid-family geometry** (auto-when-closed→extrude, extrude, solid) at BOTH orbit angles — interior buried into a featureless dark slab | solid-black-blob / wrong-read (~864 cells) |
| processPrint | extrude @0° (also solid, auto, both angles) | solid-black-blob |
| framedSketch | extrude @0° (also solid, auto, both angles) | solid-black-blob |
| screenshotPrint | solid @0° (also extrude, auto, both angles) | wrong-read |
| stackedSketchbooks | extrude @55° (also solid, auto, both angles) | solid-black-blob |
| conferenceLanyard | solid @0° (also extrude, auto, both angles) | solid-black-blob |
| keyboard | extrude @0° (also solid, auto, both angles) | wrong-read |
| vinylLpSleeve | solid @0° (also extrude, auto, both angles) | solid-black-blob |
| trinitronTv | extrude @55° (also solid, auto, both angles) | wrong-read |
| camera | solid @0° (lens/dial buried; also extrude, auto) | wrong-read |
| ps1JewelCase | extrude @0° (15-stroke interior gone; also solid, auto) | solid-black-blob |
| strategyGuide | solid @55° (14-stroke cover/spine gone; also extrude, auto) | solid-black-blob |
| luchaMask | solid @0° (face features buried, head silhouette kept; also extrude, auto) | wrong-read |
| wrestlingFigure | extrude @0° (body detail buried; also solid, auto) | wrong-read |
| pikachuFace | solid @0° (eyes/cheeks buried, ears+head kept; also extrude, auto) | wrong-read |
| easterEgg | solid @0° (decorative bands buried; also extrude, auto) | wrong-read |
| vinylRecord | solid @0° (grooves buried, disc silhouette kept; also extrude, auto) | wrong-read |
| flagPanel | extrude @55° (13-stroke flag detail gone; also solid, auto) | solid-black-blob |
| mochilaWayuu | solid @0° (21-stroke woven pattern gone; also extrude, auto) | solid-black-blob |
| bobaCup | solid @0° (bubbles buried, cup silhouette kept; also extrude, auto) | wrong-read |
| **ALL 177 rendered shapes** | **Hatch style, hachureGap slider HIGH** (30px → ~60 device-px); tonal spread collapses to ~0 | **empty** |
| tangleToy + monkeyNoodle + sparse line-art | **Solid mode** (whole-drawing raster-fused into one watertight mass) LOW/MID/HIGH | solid-black-blob |
| sparse/thin/pale-Clean shapes (keychain, tangleToy, drumsticks) | Native style, **matteClay** material, all 3 angles (lit-face lum~25, tonal spread 1–17 = no shading relief) | solid-black-blob |
| tangleToy + bigSafetyPin-family + sparse-dot/open-bead pegboard line-art | 3D auto/solid/inflate w/ Native materials (esp. matteClay), front/q35/q315 | wrong-read |
| tall/thin shapes (seltzerCan, boardingPassTW, co2Canister) | **Rod geometry, radius slider LOW (0.01)** — thinnest tube touches/clips canvas border | overflow |
| any shape under **SVG-port on SMOOTH geometry (rod/inflate)** | EdgesGeometry@30° finds almost no creases on smooth tubes → near-empty ink edges (coverage caveat, not swept; svg-port tested on extrude) | empty |

**3D clean findings:** rod + inflate preserve interior detail faithfully across ALL 197. 31 silhouette-identity shapes (trophy/triangle/bottle/figure/mug) + 22 thin shapes read fine even in the solid family. INK-BLACK/TAN audit (3,186 Native cells): global max lit-face Δr−b = 16, ZERO over the 25 tan threshold — the `be7aac7` envmap fix HOLDS at full catalog scale. Geometry substrate confirmed clean (zero EMPTY/BLOB/NaN; only by-design extrude→rod fallback). Thin-stroke/no-fill line-art (monkeyNoodle etc.) flagged as Clean-render false positives — the 3D render itself is a good shaded form; the Clean ground-truth is near-blank at small box size.

### 1C. Code / wiring gaps (real engine code on no live render path)

| Item | Location | State |
|---|---|---|
| **learnedProvider DEAD** | `src/app/lib/smartHachure/learnedProvider.ts` — "first real trained smart-layer model" shipped, but default chain at `index.ts:194` is `[ruleEngineProvider]` ONLY. learnedProvider has ZERO consumers; the wiring its own comment references (`[ruleEngineProvider, learnedProvider]`) was never applied. Inert in production. | **verified — confirmed `index.ts:194` = `[ruleEngineProvider]`** |
| draw-panel input pipeline UNAUDITED | `DrawSurface.tsx` (strokesToObjectMarkup, toneFillsMarkup, extractFillRegions, shapeFit) — the freehand stroke→object render path. Catalog renders PRE-BUILT shapes, never this. Covered only by behavior batteries, not render-correctness over varied inputs. | gap |
| high-vertex / multi-subpath / huge / tiny / empty SVG inputs UNEXERCISED | RDP simplify only fires >15 vertices/subpath; NO catalog shape reaches it. Catalog lacks 100+ subpath chaos, degenerate empty SVGs, viewBox-only 0×0 uploads. Paths exist (sub-path splitter, RDP, normalizeSvgSize) but untested. | gap |
| upload-image STUB | DrawPanel 'upload-image' — honestly labeled stub ("Coming with autotrace"), no imagetracer dep, produces no object. UI option present, does nothing. | stub-as-real (honestly labeled) |
| smartPick / convertStrokePool ORPHANED | `smart/smartPick.ts` wired ONLY into DrawPanel, never desk/audit. `geometry3d/convert.ts` (D2 markIntent pipeline) has NO component consumer (only tool batteries). /canvas 3D uses Stroke3DScene+strokeTo3d directly. | gap |
| /public is a placeholder | `DeskDoodlesPublicCanvas.tsx` renders marketing copy + CTA to /desk only; no public-canvas implementation despite the route name. Real surface is /desk + /desks. | gap |
| WEAK-EFFECT toggles on catalog | LOW→HIGH pixel delta ~0 on all 197: simplification (0.00% — drawn-path only), risograph offsetAngle (0.00% — -180 vs 180 same direction), fillPalette (0.00% — little to recolor on outline shapes); <0.05%: dotSpacing, hachureAngle, pressureVariance, dotScatter, dotSize, grainIntensity, texture, textureIntensity, registrationError. Not dead — imperceptible at thumbnail scale; catalog under-exercises them. | coverage caveat |

---

## 2. De-duplicated ROOT-CAUSE list

Grouping cells that share one cause. **6 distinct root causes** account for nearly every catastrophic cell.

### RC-1 — Dark fill swallows interior detail (the "dark-blob routing" bug) — **P0, 2D**
**Cells:** all 2D solid-black-blob + most unrecognizable-vs-clean in §1A (~12 hard + 7 borderline shapes) — framedDribbble, perrierPoster, pitchDeckCover, psPoster, vinylLpSleeve, boxedGameCartridge, ppvPoster, framedMoviePoster, ps1JewelCase, framedRacePhoto, wrestlingCard, + the stipple-preset blobs.
**Cause:** when a region's source fill is dark, the hachure/solid fill grammar paints over interior structure (labels, text, sub-regions, photo figures) instead of letting it survive. Affects shapes that are "light panel WITH a darker labelled sub-region or photo." The classifier/fill router treats the whole panel as one fillable dark region. **Invisible to whole-cell pixel detectors** — affected ink is small vs the 220px cell (~10–15% darkFrac, far below the 90% FLOOD threshold); caught only by a within-footprint blob heuristic + vision drill. **The stipple-preset blobs are the same bug** surfacing through dots at fillDensity 1.0 / hachureGap 2.5.

### RC-2 — Solid-family 3D geometry buries multi-stroke interiors — **P1, 3D (likely by-design)**
**Cells:** 144 of 197 shapes × {auto-closed→extrude, extrude, solid} × 2 angles ≈ 864 cells (all §1B solid-family rows).
**Cause:** extrude/solid make a single solid form; the native glossy-dark-ink material gives no interior relief, so frames/grids/screens/faces collapse to a featureless slab. **rod + inflate preserve detail faithfully** across all 197 — so the fix surface is mode-selection / material, not topology. Likely BY-DESIGN (solid = solid form) but catalogued per the audit law since it loses the shape vs Clean. The 2D solid-blob shapes (RC-1) and the 3D solid-family shapes overlap heavily — same "interior detail lost to a dark mass" failure in two renderers.

### RC-3 — Palette override applied to ink resolves to paper → strokes vanish — **P0, 2D**
**Cells:** strokePalette = bg / inverted on ~118 stroke-only line-art (EMPTY) + ~78 partially-filled (wrong-read) + 49 outline-dominant (EMPTY). Effectively the entire catalog under two palette values.
**Cause:** `strokePalette = bg` and `inverted` both resolve to `var(--dir-bg)` (paper color) and that gets applied to the STROKE ink. On the default paper direction, paper-colored ink on paper = invisible. **This violates the locked rule `feedback_palette_overrides_ink_not_paper` — overrides must remap INK only, never `var(--dir-bg)`/none/transparent/null.** The bg/inverted modes should be excluded from stroke remapping (or remap to a contrasting ink), exactly as the memory entry prescribes.

### RC-4 — Slider floors zero the render — **P0, 2D**
**Cells:** inkIntensity = 0 → all 197 EMPTY (wrapper opacity 0). inkIntensity = 0.1 → 4 large pale poster/pass shapes wrong-read. Hatch hachureGap HIGH (30px) → all 177 3D EMPTY (tonal spread → 0). Rod radius LOW (0.01) → tall/thin shapes overflow/clip.
**Cause:** slider extremes have no usable floor/ceiling guard — the min value of inkIntensity and the max of hachureGap produce a blank or degenerate render. Geometry sliders (rod radius LOW) let bounds clip the canvas. Needs a non-zero floor / max clamp / framing-aware bounds. (Pairs with `project_f3_slider_recalibration_pending`.)

### RC-5 — Host-gate dead styles: wet-ink + charcoal never run their tonal grammar — **P1, 2D**
**Cells:** wet-ink + charcoal styles, all 197, PRESET — output near-identical to Clean (filter overlay only).
**Cause:** `renderSmartHachure`'s host gate admits only rough-handdrawn/sketchy/bold-ink/stipple, so techniqueMap's wet-ink/charcoal tonal-fill grammar is DEAD code; those styles render as a thin filter pass over Clean and never become a real hand-drawn transform. Pairs with `project_f3_styles_must_all_be_real` (wireframe/newsprint/stipple/simplification stubs).

### RC-6 — Sparse/pale shapes have no tonal relief on dark 3D materials — **P2, 3D**
**Cells:** keychain, tangleToy, monkeyNoodle, drumsticks, bigSafetyPin-family on matteClay (and solid/inflate Native), all angles.
**Cause:** the darkest matte material on a sparse/thin form gives lit-face lum ~25 with tonal spread 1–17 — no shading gradient, reads as a flat dark mass. Distinct from RC-2 (that's interior-burial on dense shapes; this is no-relief on sparse shapes). Several of these are also Clean-render false positives where the thin ground truth is near-blank.

**Non-catastrophic / coverage-only causes** (not blockers): WEAK-EFFECT toggles imperceptible at thumbnail scale (RC under-exercise, fix = add large/dense fixtures); orphaned engine code (learnedProvider, smartPick, convertStrokePool — dead wiring, not a render break); /public + upload-image placeholders.

---

## 3. PRIORITIZED fix list

### P0 — Blockers (whole catalog lost, or core feature produces blank/blob)

1. **RC-3 — strokePalette bg/inverted nukes ink.** Exclude `bg`/`inverted` (and any paper/none/transparent/null) from STROKE remapping per `feedback_palette_overrides_ink_not_paper`. Single narrowest fix; un-breaks ~all 197 under two palette modes.
2. **RC-4 — inkIntensity = 0 → all blank.** Add a non-zero floor to the inkIntensity slider (or clamp wrapper opacity floor). Also clamp Hatch hachureGap max and apply a usable floor; framing-aware bounds for rod radius LOW.
3. **RC-1 — dark-fill swallows interior detail (2D dark-blob).** Stop the fill router from painting over labelled/photo sub-regions: detect interior structure inside dark panels and preserve it (don't treat the whole panel as one fillable dark region). Highest-touch fix but it's the headline visual bug across posters/cases/cards + the stipple preset. Follow `feedback_fillstyle_slider_must_switch_classifier_pick` (narrow override) and the regression-check law before declaring fixed.

### P1 — Major (a style/mode is dead or systematically loses detail)

4. **RC-5 — wet-ink + charcoal dead grammar.** Either route these into `renderSmartHachure` so their tonal-fill grammar runs, or remove them from the style list until real. No stubs-as-real (`project_f3_styles_must_all_be_real`).
5. **RC-2 — 3D solid-family buries interiors.** Confirm by-design vs bug with Sebs. If keeping solid/extrude as solid forms, default interior-detail shapes to rod/inflate (which preserve detail) or add interior-relief on the native material. Decision needs design input — bring to main chat, don't silently auto-pick.

### P2 — Polish / robustness

6. **RC-6 — sparse shapes flat on matteClay.** Add tonal-relief floor or auto-swap material for sparse/thin forms in 3D.
7. **Slider recalibration pass** (pairs `project_f3_slider_recalibration_pending`) — dead zones + non-linear sliders surfaced by the sweep.

### Hygiene (not render breaks)

8. Wire or delete `learnedProvider` (currently inert — `index.ts:194` = `[ruleEngineProvider]` only). Smart-layer claim is shipped but dead.
9. Wire or delete orphaned `smartPick` (desk/audit path) and `convertStrokePool` (no consumer).
10. /public + upload-image: implement or relabel honestly (upload-image already honestly stubbed).

---

## 4. Coverage statement (honest)

**Covered — FULL, NO SAMPLING on the object set:**
- All 197 deduped catalog shapes rendered in EVERY 2D sweep (Cluster 1–5, 11 styles, 34 toggles × LOW/MID/HIGH, sliders to extremes), through the REAL `SvgStyleTransform` 2D path with smartHachure ON in real providers.
- All 197 rendered in 3D geometry sweep (5 modes × 2 orbit angles = 1,970 GL renders through the REAL `Stroke3DScene`).
- Every contact-sheet mosaic READ with vision; every flagged cell DRILLED Clean-vs-state side-by-side.
- INK-BLACK/TAN re-fix verified at full scale (3,186 Native cells, zero over threshold).

**NOT fully covered (honest gaps):**
- **3D style/material/per-mode toggle matrix (90-state):** rendered 177/197 — 20 head shapes (catalog idx 90–109, work-rig/punk trophy-wall heads) NOT pixel-rendered for the style/material/toggle layer. GPU saturated (16 concurrent sibling 3D contexts, load avg 207) and froze the head shard at 32/55; killed to stop thrashing. Head shapes have geometry + flag-stat evidence (zero blob/tan/empty) and sibling 5-mode geometry sheets visually cross-confirm heads 1–60 render clean — but NOT the full style/material pixel layer. **Re-run the head shard solo when the GPU is free.**
- **Cluster-1 toggles swept only in rough-handdrawn host:** these toggles have chrome only in rough-family styles (per `MODIFIER_SETS_BY_STYLE`); sketchy/bold-ink/stipple share the same path pipeline (identical geometry, different presets) and were NOT re-swept per-style.
- **SVG-port on smooth geometry (rod/inflate)** not separately swept — tested on extrude (where EdgesGeometry yields contours); flagged as a coverage caveat (near-empty edges by nature on smooth tubes).
- **Hatch light-following re-orientation** rendered but not frame-differenced across orbit (single-angle capture per state).
- **Input pipelines:** draw-panel (F1 tone-brush / F2 fill+lasso / F3 shape-assist) and upload-image NOT render-swept — catalog uses pre-built shapes, never the freehand input path. Covered only by behavior batteries.
- **High-vertex / multi-subpath / huge / tiny / empty SVG inputs** NOT exercised — catalog shapes are sparse (<15 vertices), so RDP simplify is a confirmed no-op; the 100+ subpath / degenerate / huge / tiny paths exist in code but untested.
- **Desk / realtime / public surfaces** NOT in scope here (covered by desk-robust gauntlet + route-sweep, not the catalog).

---

## 5. Proposed NEW fixtures (to close the gaps)

Add a fixture set swept through all 11 styles × toggles exactly like the catalog, plus a 3D solo head re-run:

1. **Dense-traced rose** (~112 subpaths) — exercises sub-path splitter + RDP at scale.
2. **50-vertex freehand path** — fires RDP simplification (catalog never does).
3. **Empty / whitespace SVG** — degenerate-input guard.
4. **viewBox-only, no width/height** — `normalizeSvgSize` edge.
5. **2000px huge SVG** — bounds/framing/overflow stress.
6. **4px tiny SVG** — sub-pixel render floor.
7. **N drawn-stroke + tone-fill + lasso objects** (DrawSurface output) — the real F1/F2/F3 input pipeline, swept through all styles/toggles for render-correctness (not just behavior).
8. **3D head-shard solo re-run** — render catalog idx 90–109 through the 90-state style/material/toggle matrix on a free GPU to close the 20-shape pixel gap.

These also surface the WEAK-EFFECT toggles (fillPalette, hachureAngle, dotSize, texture, etc.) whose effect is invisible on sparse catalog thumbnails but visible on large/dense content.

---

## 6. Overview (scannable — Sebs running)

**Total broken cells:** ~65 distinct shape×state breakage entries catalogued, expanding to **~1,900+ failing cells** once recurrences are counted (RC-2 alone ≈ 864 3D cells; RC-3 ≈ near-all-197 under two palette modes; RC-4 = all 197 at inkIntensity 0). Catastrophic, fixable bugs cluster into **6 root causes**.

**Top 5 root causes (fix these and the catalog goes green):**
1. **RC-3 (P0) — strokePalette bg/inverted paints ink with paper color → strokes vanish on ~all 197.** Narrowest fix, biggest win. Violates the locked palette-ink rule.
2. **RC-4 (P0) — slider floors blank the render** (inkIntensity 0 = all blank; Hatch gap HIGH = all 3D blank; rod radius LOW = overflow). Needs floor/ceiling clamps.
3. **RC-1 (P0) — dark-fill swallows interior detail** (posters, jewel cases, trading cards, stipple preset) — the headline 2D dark-blob. Invisible to whole-cell detectors; caught by footprint heuristic + vision.
4. **RC-2 (P1) — 3D solid/extrude bury multi-stroke interiors** on 144 shapes (~864 cells). rod + inflate are fine — likely by-design; needs Sebs's call.
5. **RC-5 (P1) — wet-ink + charcoal styles are dead** (host-gated out of renderSmartHachure; render as Clean + filter, no real transform).

**What's clean (verified, no flags):**
- Cluster-2: every pen tip + every texture + textureIntensity to 3.0× — 100% faithful transforms of Clean.
- Cluster-1 broad gnarly extremes: zero catastrophic flags (only thin-render fill-loss at ms_off/ms_single).
- 3D geometry substrate: zero exploded meshes / NaN / broken topology at either angle; rod + inflate preserve interior detail on all 197.
- 3D ink-black/tan envmap fix (`be7aac7`): HOLDS at full catalog scale — zero tan cells across 3,186 Native renders.
- 3D silhouette-identity (31) + thin (22) shapes read fine even in the solid family.

**Honest gaps to close next:** 20 head shapes need a solo 3D style/material re-run (GPU-saturation deferral); draw-panel + upload-image + high-vertex/degenerate inputs need the 8 new fixtures above; `learnedProvider`/`smartPick`/`convertStrokePool` are shipped-but-dead wiring (hygiene).
