# Per-Style Shading Axes + Audit Parity — Architecture

**Date:** 2026-06-12 · **Status:** SPEC — READ-ONLY pass on src/ (research lane R4; build fleet owns the tree).
**Directive (Sebs, Shade-register test video 2026-06-12 7:57pm):** "when we go to rough hand-drawn, remember we have different axes that define how to make shading different" + "document this architecture out" + **"we need to let people create stuff like we see in the audit pages."**
**Governing refs:** `09-LOCKED-MODEL.md` I-1/I-2/I-3/I-5 · `coverage.ts` · `modifierSpecs.ts` MODIFIER_SETS_BY_STYLE · `techniqueMap.ts` · `renderRegion.ts` · `conversion-semantics-spec.md` + addendum · `mark-intent-boundary-spec.md` · `global-toggles-and-mixed-3d.md` D-5/D-7 · `docs/knowledge/06-tone-and-shading.md`.
**Siblings (in flight, parallel lanes — cross-referenced by lane name):** region-fill spec · shade-brush spec · shape-snap spec. This doc owns the AXIS architecture + the audit-parity gap table; input mechanics live in those lanes.

---

## 0. The point

The Shade register shipped (Rock 3): users brush discrete tone bands under their ink. But a band is only HALF of shading — it says *how dark*, not *what kind of marks*. The other half already exists as the per-style axis system (`MODIFIER_SETS_BY_STYLE`, `modifierSpecs.ts:46`): each style declares which modifiers it owns, and the Phase A/B recalibration routes darkness through one coverage math into per-grammar mark parameters. This doc specifies the architecture that CONNECTS the new tone inputs to that axis system, then audits the honest gap between what users can create and what the 197-shape audit catalog demonstrates — because the catalog is the creation ceiling Sebs named.

## 1. The two-layer model: band = WHAT, axes = HOW

- **The band is record data** (`render_config.toneFills`, band index 0–7 — `DrawSurface.tsx:134`, addendum ch.2.1). It is style-independent perceptual identity: I-2, "source darkness owns per-region perceptual identity." A band survives every style switch, every mode flip, every re-render. Never baked (D-5).
- **The axes are pen state** (the style's declared modifier set + slider values, snapshotted into `render_config` at Done per D-7). They are I-3 bias WITHIN the band — character, not identity. `hachureGap` can make band-4 hachure tighter or looser; it can never make band 4 read as band 2.
- **One math joins them:** band → darkness midpoint → `darknessToCoverage` (Murray-Davies inverse, `coverage.ts:90`) → `coverageToParams` per mark grammar (`coverage.ts:330`) → gap/weight/layers. The user's axis values enter as the solve's anchor/bias (`CoverageBias`, `coverage.ts:51`) — exactly the "sliders are bias within band" contract, now expressed as which variable the inverse solves around.

### The per-style mapping table (the I-2 table — what ONE band becomes in each style)

Grammar column from `techniqueMap.ts` `applyStyleModulation` (:252–295) + `BASE_BY_ROLE`; axis columns from `MODIFIER_SETS_BY_STYLE` (`modifierSpecs.ts:46–86`); primary-density-knob discipline per `F3-shading-calibration-spec.md` §4 (one primary knob per technique, secondaries dampened).

| Style | A band becomes… | Primary density axis | Character axes (bias within band) | Live status |
|---|---|---|---|---|
| rough-handdrawn | rough.js marks per role (hachure → cross-hatch as bands darken); user fillStyle pick sacred (I-1 narrow override) | hachureGap | hachureAngle · fillDensity · strokeWidth · fillOpacity | **LIVE** smart path |
| sketchy | tonal fills STRIPPED by register design (`techniqueMap.ts:262` — draft/outline-leaning) | — | wobble family | LIVE — needs the SA-2 visibility rule |
| bold-ink | solid floods for dense roles; heavier marks (×1.2) elsewhere | fillDensity | strokeWidth · fillStyle | **LIVE** smart path |
| stipple | dots grammar, gap-dominant (dot pitch carries tone) | hachureGap (= dot pitch) | dotScatter · fillDensity · strokeWidth (dot diameter) | **LIVE** smart path |
| wet-ink | hachure at wet line ×1.3; blur/bleed halo is the FX layer | fillOpacity | blurAmount · bleed | map READY; host gate (below) |
| charcoal | wide soft marks ×1.5 at ×0.85 opacity; grain/smudge FX ride on top | grainIntensity | smudgeAmount · pressureVariance | map READY; host gate |
| risograph | dense roles flood to solid spot-ink; light roles keep fuller hachure | inkIntensity | offsetDistance/Angle · registrationError · colorShift · risoSecondaryColor | map READY; host gate |
| newsprint | dots grammar for ALL tonal roles — the band IS a dot screen | dotSpacing | dotSize · dotPattern · dotScatter | map READY; host gate |
| clean / outline-only | NOT shading-capable: band renders as the honest flat band-grey wash | — | inkIntensity · fillOpacity | rule to lock (SA-2) |

**Host-gate honesty:** `techniqueMap.ts` is total over all 8 shading-capable styles (Phase B, Rock 4), but the live gate at `SvgStyleTransform.tsx:2231-2232` still admits only the 4 rough-family styles into the smart path; wet-ink/charcoal/risograph/newsprint currently read tone through the legacy `fillDarknessFactor` path + their FX layers. Lifting the gate is the documented 1-line host edit (`techniqueMap.ts:28-31`). Until it lifts, the table's right column is the contract, not the screen.

**Dots inverse note (I-5: each grammar gets its own model):** stipple/newsprint solve `a₁ = π(w/2)²/g²` (`coverage.ts:228`), hachure solves `w/g`, cross-hatch `1−(1−w/g)²` — same band, different closed forms. That per-grammar math is exactly "different axes that define how to make shading different," already locked in code. Stipple dot DISTRIBUTION quality (beyond pitch) is the weighted-Voronoi upgrade, post-makeathon (Secord, *Weighted Voronoi Stippling*, NPAR 2002 — https://dl.acm.org/doi/10.1145/508530.508537).

## 2. Inputs → bands: producers and precedence

All tone producers emit into ONE band table (`COVERAGE_BANDS`, `coverage.ts:114`) and one record shape — new inputs add producers, never new brains (doc 06 "one shared smart system"):

| Producer | Status | Emits |
|---|---|---|
| Shade brush (Ink\|Shade register, 7 swatches + erase + size — `DrawPanel.tsx:1003-1013`) | **BUILT** | `ToneFill{points, band}` records |
| Region fill (tap-to-fill a detected region) | sibling lane — region-fill spec | band bound to an extracted region (pool raster, `strokeTo3d.ts:994-1127`, promoted per addendum A-3) |
| Lasso / marquee tone selection | sibling lane (region-fill / shade-brush spec) | `ToneFill` with user-drawn mask — the mask IS its region (addendum §2.4) |
| Inferred from marks (scribble/hatch/dot-cluster gestures) | BUILT v1 (`geometry3d/markIntent.ts`, rules R4/R7/R8) | `surface-hatch(band)` metadata; marks preserved |
| Upload fills (hex/token/color-mix/gradient-avg) | BUILT | darkness → `bandIndexForDarkness` (`signals.ts` → `coverage.ts:126`) |

**Precedence ladder (addendum A-8, extends D2-F):** override store > tone-fill band > upload's own fill darkness > inferred. Each rung beats every rung below; resolution logged to the decision log. A brushed band 5 and an inferred band 5 are indistinguishable downstream by construction — `TONE_BAND_HEX` derives patch greys from band midpoints so they re-quantize to themselves (`DrawSurface.tsx:158`).

## 3. The live path: how a brushed band becomes marks

`toneFillsToMarkup` renders patches as flat band-grey fills under the ink (`DrawSurface.tsx:253`) → smartHachure signals read the hex as `darknessL` → classifier assigns a tonal role → `selectTreatment` 3-stage pipeline (role base → style modulation → user-slider modulation, `techniqueMap.ts:84-100`) → `renderRegion` quantizes to the band and solves `coverageToParams` weight-anchored (`renderRegion.ts:231-257`). The brushed grey never ships raw under a shading style — it ships as that style's marks at that band's density. This is the wedge sentence: **tone-fill gave drawn input the darkness channel; the axis system spends it per style.**

## 4. Where shading controls surface (the Shade-register question)

Options enumerated (decision discipline):
1. **Shade register stays universal** — band swatches + size + erase only; per-style axes stay in the pen panel. *(status quo)*
2. Duplicate the active style's shading axes (hachureGap etc.) inside the Shade cluster.
3. Show only the style's PRIMARY density axis in the Shade cluster, linked to the pen panel value.
4. Keep controls universal but make the preview style-aware: band swatches render as the current style's mark grammar (mini hachure/dot chips), and the existing Sketch\|Style pill already previews patches through the live pen.
5. Per-patch axis overrides (angle/gap stored per ToneFill).

**Recommendation: 1 + 4.** The band is record data; the axes are pen state — surfacing axes in the Shade register would blur D-7's one-pen model and invite per-patch render state (option 5 violates D-5 nothing-baked and bloats the 45KB record; option 2 duplicates chrome the pen panel already owns; option 3 creates two sliders for one value). The Shade register answers WHAT (identity); the pen panel answers HOW (character); the Sketch\|Style pill is the bridge that shows them composed. Style-aware swatch chips are a cheap craft upgrade — slot at the 06-16 identity pass. **→ SA-1.**

## 5. 3D and the AI path — same bands, two more renderers

- **Hatch style (BUILT, Rock 1):** screen-space band-quantized hatch material reads the SAME 8-band table via `bandTableForUniforms()` (`coverage.ts:168`) — uniforms from the Shading sliders, one math two renderers. Per-region `surface-hatch(band)` rides `ConversionUnit.band` (`conversionMap.ts:166-167`); tonal roles carry bands per `ROLE_tonal_mass_with_band` (`conversionMap.ts:69-72`).
- **Relief(band)** = opt-in secondary axis only, polarity toggle, never silent default (conversion-semantics-spec §5, D2-D).
- **AI path:** bands rasterize as flat greys at band midpoints INTO the conditioning composite (styled-line + flat-tone, addendum §3.1-3.2) — a brushed dark flank is a volume statement the model can act on; band histogram rides the router prompt. Zero per-region control on the returned GLB (addendum §3.3) — the bands' leverage is upstream.

## 6. Pipeline placement (signals → classify → treatment → render)

| Stage | Piece | File |
|---|---|---|
| signals | `darknessL` (tokens/hex/color-mix/gradient-avg) · explicit `toneFills` bands · mark-intent stroke features | `smartHachure/signals.ts` · `DrawSurface.tsx` · `geometry3d/markIntent.ts` |
| classify | upload brain = classifier roles; drawn brain = topology + mark-intent; explicit band SKIPS inference (precedence ladder) | `classifier.ts` · `markIntent.ts` · addendum A-8 |
| treatment | 2D: `selectTreatment` (role × style × sliders → gap/weight/layers/opacity) · 3D: conversion treatments + carriesBand | `techniqueMap.ts` · `smart/conversionMap.ts` |
| render | `coverageToParams` per grammar · per-style FX layers · Hatch uniforms · AI composite rasterizer | `renderRegion.ts` · `SvgStyleTransform.tsx` · `Stroke3DScene.tsx` · addendum §3.2 |

## 7. Audit parity — the honest gap table

The catalog: 197 shapes (93 Trophy-Wall `PinShape` + 104 Pegboard `PegToolShape`, `DeskDoodlesAudit.tsx:3-8`). Conventions read from source (`PegToolShape.tsx:8-10`): one ink (`STROKE = var(--dir-text-primary)`), one wash (`WASH` = 8% color-mix), one knockout ink (`BG_INK = var(--dir-bg)`), `transparent`/`none`. **Zero gradients, zero `<pattern>` in either file (grep-verified).** The catalog's expressive ceiling is: exact primitives + washes + solid fills + repeated detail marks + dasharray + text + paper-knockouts + per-element transforms — all monochrome.

| Catalog construction (representative) | User path today (ink + tone + fill + snap) | Gap | Recommendation |
|---|---|---|---|
| WASH fills (8% washes — sketchbook body, blob ellipses) | Shade band 1 ≈ the same statement | **PARITY** | — |
| Solid ink masses (blade polygon, pen ink-window) | fill-intent scribble (markIntent R5/R6) or band-7 patch | **PARITY** (v1) | calibrate per MI-F |
| Exact primitives (rect/rx, circle, ellipse, polygon — macbook, monitor) | freehand only — wobbly approximations | the single biggest ceiling | **BUILD — shape-snap sibling lane (in flight)** |
| Repeated detail marks (spiral-binding dot rows, ruler ticks, 27× dasharray stitching) | draw each mark by hand | tedium, not impossibility | **DEFER** — a repeat/array tool is post-makeathon craft; hand-repetition is on-brand for doodles |
| Text/labels (≈125 `<text>` in PinShape + ≈20 in Peg — "MARS", "5K", "CO₂") | none (rods render uploaded text honestly in 3D) | real | **DEFER post-makeathon** — mark-intent §1 already parks annotation strokes; a type tool dilutes the doodle wedge |
| Paper-knockout (BG_INK text/marks reversed out of solid fills) | none — Shade erase lifts patches, it doesn't reserve paper inside ink | real, expressive | **DEFER, design now**: band-0 "paper resist" patches (the eighth swatch) fit the existing ToneFill record + precedence ladder cleanly |
| Per-element transforms / multi-part assembly (rotated ellipses, 5–15-element groups) | one Done = one object; composition by drawing skill | partial | **DEFER** — post-makeathon edit tools; desk-level composition already covers the spirit |
| Dashed ink strokes (stroke-dasharray on linework) | no dash axis on the pen | small | **flag SA-4** — candidate cheap axis (endpoint/penTip cluster); else defer |
| Gradients | n/a — the catalog itself uses none; uploads carry them (avg-stop baked, doc 06) | none | **NEVER as input primitive** — the 8 discrete bands ARE our gradient, by design (JND-grounded); literal gradients stay an upload-register concern |
| Multi-color | palette overrides remap ink at render (`feedback_palette_overrides_ink_not_paper`) | none for makeathon | **NEVER (makeathon)** — monochrome warm ink is the locked identity (D2-E); color is a render-layer palette, never per-stroke paint |

**Honest summary:** with shape-snap + region-fill + the Shade brush landed, a user can reproduce the catalog's tonal and structural vocabulary. What stays out of reach is convenience and annotation — repeats, text, knockouts, element transforms — and each defer is judged against the wedge: the product is an intelligent per-region transformation system, not a vector editor.

## 8. SEBS DECISIONS

| # | Decision | Recommendation |
|---|---|---|
| SA-1 | Shade register: universal band picker only, axes stay in pen panel; style-aware swatch chips at identity pass | Yes — option 1+4 (§4); per-patch axes rejected |
| SA-2 | Tone-band visibility rule: a band may change grammar per style but may NEVER render to nothing — sketchy (fills stripped, `techniqueMap.ts:262`) and clean/outline-only fall back to the flat band-grey wash | Lock it — I-2 + D-3 never-skip applied to tone; verify sketchy live before lock |
| SA-3 | Host-gate lift (4 FX styles into the smart path) so the §1 table is live everywhere | Schedule with the next SvgStyleTransform-owning rock; 1-line edit + regression sweep |
| SA-4 | Dashed-ink stroke axis (dasharray parity with catalog linework) | Cheap-build IF an endpoint-cluster rock opens; else defer |
| SA-5 | Paper-resist (band-0 reservation patches, the knockout register) | Defer build; adopt the design (eighth swatch = resist) so the record shape doesn't churn later |
| SA-6 | Audit-parity defer list (repeats · text · transforms) ratified as post-makeathon | Yes — wedge-judged in §7 |
| SA-7 | Per-style primary-density-axis list (§1 table col 3) locked as the calibration contract | Yes — it is the calibration spec's one-primary-knob rule, now per-band |

## 9. Citations

**Ours (all line-verified this pass):** `modifierSpecs.ts:46` MODIFIER_SETS_BY_STYLE · `coverage.ts` (:90 darknessToCoverage · :114 COVERAGE_BANDS · :126 bandIndexForDarkness · :168 bandTableForUniforms · :228 dots inverse · :330 coverageToParams · :51 CoverageBias) · `techniqueMap.ts` (:33 8 styles · :50 STYLE_OWNS_FILL_GRAMMAR · :252-295 style modulation · :28-31 host-gate note) · `renderRegion.ts:177-257` · `SvgStyleTransform.tsx:2231-2232` (gate) · `DrawSurface.tsx` (:134 ToneFill · :158 TONE_BAND_HEX · :253 toneFillsToMarkup) · `DrawPanel.tsx` (:254 register · :1003-1013 ToneShadeCluster) · `smart/conversionMap.ts` (:40 surface-hatch · :69-72 carriesBand · :166-167 band) · `geometry3d/markIntent.ts` + `mark-intent-boundary-spec.md` §3 R4/R7/R8 · `strokeTo3d.ts:994-1127` pool raster · `PegToolShape.tsx:8-10` + `PinShape.tsx` (fill grep) · `DeskDoodlesAudit.tsx:3-8` · `conversion-semantics-spec.md` §3-§5 + addendum ch.2-3, A-3/A-8 · `global-toggles-and-mixed-3d.md` D-5/D-7 · `09-LOCKED-MODEL.md` I-1/I-2/I-3/I-5 · `F3-shading-calibration-spec.md` §4 · `docs/knowledge/06-tone-and-shading.md` · `21-research-3d-pipeline-and-style-translation.md` §4/§10.
**External (previously verified in our docs, plus one new):** Praun et al. — *Real-Time Hatching*, SIGGRAPH 2001, https://gfx.cs.princeton.edu/pubs/Praun_2001_RH/index.php (TAM band nesting) · Secord — *Weighted Voronoi Stippling*, NPAR 2002, https://dl.acm.org/doi/10.1145/508530.508537 (stipple distribution, post-makeathon) · Murray-Davies coverage model per 21-research §4 (print-science lineage documented there).
