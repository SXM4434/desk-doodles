# 3D Mode Controls — Per-Mode Parameter Taxonomy (Round 7 build spec)

**Date:** 2026-06-12 · **Status:** BUILD-READY SPEC — parameters grounded in Free Stroke origin/main (Sebs's own tuned taxonomy, the primary source); external precedents cited per `feedback_research_first_no_fake_provenance`. Sebs decisions flagged in §6.
**Sources (ours):** `free-stroke` origin/main `lib/geometry-engines.ts` + `lib/style-system.ts` + `components/viewport-3d.tsx` (read via `git show` — local checkout stale) · `docs/design/global-toggles-and-mixed-3d.md` (D-7 + amendments, the chrome contract) · `docs/design/3d-roundtrip-build-plan.md` · `docs/research/21-research-3d-pipeline-and-style-translation.md` §5/5b/6/7/9 · `docs/locked-refs/F3-siblings/F3-toggle-architecture.md` (3D Path 1 styles + rotation stability) · `src/app/lib/geometry3d/strokeTo3d.ts` (current constants, already PORT-FIRST provenance-commented).

---

## 0. The locked frame (do not re-litigate)

1. **Chrome split (Sebs round 7, ratified):** in 3D mode the right panel shows 3D controls ONLY — 3D STYLE dropdown + per-geometry param sets. The 2D SVG chrome appears ONLY under the SVG-port style (where it drives the ported treatment). Today's 2D-panel-doing-nothing-in-3D reads broken; this spec kills it.
2. **D-7 amendment 4:** Global ON → toggles own everything including mode + geometry; geometry dropdown is `Auto / Rod / Extrude / Inflate / Solid` where Auto is a default VALUE (shape decides: open→rod, closed→extrude), not a hidden rule.
3. **Never trim params** (Sebs round 7 + `feedback_more_toggle_options_better`): full per-mode sets, 6+ ticks per slider.
4. **Unit conversion:** Free Stroke maps longest canvas side → 3 world units; we map 800px → 8 units (`WORLD_SCALE 0.01`). Absolute lengths port ×8/3; radius-relative factors port verbatim (already locked in `strokeTo3d.ts` header).
5. **No stubs** (`project_f3_styles_must_all_be_real`): a dropdown option ships only when real.

## 1. The control model — three picks

Per research 21 §5 (locked v1.1): **Geometry mode** (dropdown) → **per-geometry params** (this spec §2) → **3D Style** (dropdown) → **per-style params** (§3). Each pick sacred per I-1 spirit; smart system may suggest, never override. This mirrors 2D's `Style dropdown + MODIFIER_SETS_BY_STYLE` house pattern — per-mode param sets swap exactly like per-style modifier sets.

---

## 2. Per-mode parameter sets

Format: control · range (step) · default · what it does physically · provenance. Free Stroke (FS) values given native, with ×8/3 desk-doodles (DD) world conversion where absolute.

### 2.1 Rod (open strokes — "your line IS the object")

| Control | Range (step) | Default | Physical effect | Provenance |
|---|---|---|---|---|
| Radius | 0.010–0.128 world (0.002) | 0.032 | Tube half-thickness of the ink line | FS `TUBE_RADIUS 0.012` (×8/3 = 0.032, already ported); floor from FS `fallbackRodRadius` clamp 0.003 (×8/3 ≈ 0.008); ceiling = 4× default, inside FS's 0.08 (×8/3 = 0.213) envelope |
| End caps | toggle | ON | Spherical caps inset 0.35×radius along tangent — rounded ink tip, not a bead | FS cap inset (`CAP_INSET_FACTOR 0.35`, verbatim) |
| Joint blobs | toggle | ON | Spheres at sharp corners fill the TubeGeometry pinch crease — the ink-blob feel | FS `detectJoints3D` |
| Joint sensitivity | 20–70° (5°) | 40° | Corner angle that earns a blob; lower = blobbier | FS `JOINT_ANGLE_THRESHOLD_DEG 40`; dedup factors (1.25× endpoint exclusion, 0.75× spacing) stay internal |

Stretch (post-round-7): pressure→radius modulation (build plan §6.1 — `StrokePoint[2]` already captured). Precedent for per-stroke tube radius as THE user control: Blender's Skin modifier exposes exactly per-vertex radius (Ctrl+A) plus branch smoothing, nothing else ([Blender manual: Skin Modifier](https://docs.blender.org/manual/en/latest/modeling/modifiers/generate/skin.html)).

### 2.2 Extrude (closed shapes — cookie-cutter slab). PORT THE FS PERCEPTUAL SYSTEM VERBATIM

| Control | Range (step) | Default | Physical effect | Provenance |
|---|---|---|---|---|
| Width | t ∈ 0–1 (0.01) | 0.5 | Ribbon half-width via **quadratic perceptual map** `width(t) = floor + (ceil−floor)·t²` — mid-slider = the tuned "clean default"; only the last ~25% reaches chunky/experimental territory | FS `mapExtrudeWidthSlider` (exp 2.0, floor 0.020, ceil 0.080; effective clamp 0.010–0.085). DD: ×8/3 → floor 0.0533, ceil 0.2133, clamp 0.0267–0.2267 |
| Depth | 0.1–4.0 (0.05) | 1.0 | **Width-relative multiplier**, decoupled: `effDepth = clamp(mult × effWidth, floor, ceil)`. Depth never bloats XY; width never compresses Z | FS depth-multiplier block (anchors: 0.25 shallow · 1.0 default "as deep as half-wide" · 2.0 deep · 3.0 dramatic · 4.0 max). FS world clamp 0.005–0.50 → DD 0.0133–1.333 |
| Bevel | toggle | ON | Rounded extrusion edges (bevelSize 0.015 FS → 0.040 DD, 2 segments — constants, not sliders) | FS `DEFAULT_EXTRUDE_PARAMS`; auto-disables below FS tiny-width 0.03 (DD 0.08) — surface as a status chip, never silent |

Width anchor table (FS → DD world): t=0 → 0.020/0.053 (always clean) · 0.25 → 0.024/0.064 · 0.5 → 0.035/0.093 (default) · 0.75 → 0.054/0.144 (heavy, controlled) · 1.0 → 0.080/0.213 (chunky). Inverse `extrudeWidthToSlider` ports too (debug readout).
Precedent: Spline exposes exactly this surface on 2D→3D shapes — an **Extrusion** value + **bevel** ("rounded edges on the resulting volume") in the Shape panel, nothing more ([Spline docs: Extruding 2D objects in 3D](https://docs.spline.design/doc/extruding-2d-objects-in-3d/docfstXfUI9s)); Spline's path objects add only Size/Corner/Subdivision ([Spline docs: 3D Paths](https://docs.spline.design/doc/-/docbpQK7hyhv)). Two sliders + a bevel toggle is the shipping-tool norm.

### 2.3 Inflate (closed/open strokes — puffed balloon; swept-capsule heuristic, NOT Teddy)

Constants already exported in `strokeTo3d.ts` (Sebs round 7: "constants exported") — they become sliders:

| Control | Range (step) | Default | Physical effect | Provenance |
|---|---|---|---|---|
| Base radius | 0.06–0.45 (0.01) | 0.22 | Mid-stroke fullness (XY radius around centerline); auto-clamped to 0.35× arc length so short strokes read as blobs, not spheres | DD `INFLATE_BASE_RADIUS 0.22` + `INFLATE_MAX_BASE_TO_LENGTH 0.35`; FS analog: `inflateStrokeRadiusXY` from the Width/thickness slider |
| Tip radius | 0.010–0.150 (0.005) | 0.035 | End-taper floor — never 0 (degenerate rings) | DD `INFLATE_TIP_RADIUS 0.035` |
| Pressure influence | 0–1 (0.05) | 0.35 | How strongly stylus pressure (0..1, neutral 0.5) scales local radius — the hand survives into the volume | DD `INFLATE_PRESSURE_INFLUENCE 0.35` |
| Puff | 0–1 (0.05) | 0.5 | Z-aspect / cross-section roundness: sqrt-eased map drives aspectZ 0.34→1.55 **plus the derived feel bundle** (profileExponent 2.1→3.4, crossSectionBulge 0.07→0.28, capRoundness 0.6→1.0, joinSoftness 0.45→0.85) — one slider, five tuned curves | FS `inflateBuildStaticGeometries` (the whole bundle, verbatim numbers) — **D-A, Sebs decision §6** |

Algorithm note: current DD inflate is a `sin(πt)^0.8` profile sweep (`INFLATE_PROFILE_EXP 0.8`); FS is an elliptical-capsule loft with metaball-style caps (`inflateBuildEllipticalTube`, ringSegs 28, 3 tangent-smoothing passes). If the visual character doesn't match FS after calibration, **port FS's loft function, don't tweak numbers** (`feedback_copy_implementation_before_tweaking_numbers`).
Literature: single-view inflation tools deliberately keep ONE inflation knob — Teddy inflates "wide areas fat, narrow areas thin" with no user params ([Igarashi et al., SIGGRAPH '99](https://www.cs.toronto.edu/~jacobson/seminar/igarashi-et-al-1999.pdf)); Monster Mash likewise auto-inflates and spends its UI on deformation ([Dvorožňák et al. 2020](https://dcgi.fel.cvut.cz/home/sykorad/Dvoroznak20-SA.pdf) · [monstermash.zone](https://monstermash.zone/)); Womp's SDF blobs expose Roundness/smooth-inflate-style controls rather than mesh params ([Womp FAQ](https://www.womp.com/faq)). Our 4 sliders are already at the generous end — do not add more.

### 2.4 Solid (multi-stroke fused mass — raster → marching squares → extrude)

| Control | Range (step) | Default | Physical effect | Provenance |
|---|---|---|---|---|
| Ink radius | 0.03–0.20 (0.005) | 0.08 | Half-width of the stamped ink body each stroke contributes to the binary grid — fatter ink = chunkier fused mass | DD `SOLID_INK_RADIUS 0.08`; FS analog: Thickness slider 4–64px (step 2) default 38, eased ^1.35 to effective 4–44px — apply the same ease so mid-slider feels calibrated |
| Depth | 0.05–1.35 (0.025) | 0.48 | Z extrusion of the fused silhouette, eased ^1.2 | FS Solid depth slider 0.02–0.5 (0.01) default 0.18, curve 1.2 → DD ×8/3 |
| Holes | toggle | ON | Preserve interior holes (donut stays a donut) vs filled silhouette | FS hole pipeline (H1/H2/H3 stabilization, `Shape.holes`); Sebs's round-7 word "fill" — **D-B, §6** |

Internal, NOT chrome: grid resolution 144/200, min loop area 2, contour RDP 0.6 cells, Chaikin pass (DD constants). Precedent for thickness+offset-style minimal surface: Blender Solidify ships Thickness / Offset / Even Thickness / Rim as its whole user face ([Blender manual: Solidify Modifier](https://docs.blender.org/manual/en/latest/modeling/modifiers/generate/solidify.html)).

### 2.5 AI mode — round 8 placeholder (do NOT build chrome in round 7)

Per Sebs round-8 note: hard path (vision-LLM router → Tripo/TRELLIS GLB, research 21 §8) becomes the **DEFAULT 3D when available**; local geometry modes stay as options + fallback ladder (AI → local Auto → honest paper card; never skip, never stub). Geometry param sets don't apply (mesh comes from the API); its controls are: Engine pick (`3D Artist` / `Volumetric AI`), Regenerate, router-status chip. The 3D Style dropdown still applies on top — SVG-port is universal across every geometry source (policy lock, 21 §5). Reserve the dropdown slot; ship nothing visible in round 7.

---

## 3. The 3D STYLE dropdown taxonomy

### Round 7 ships exactly three (all real):

| Style | What it is | Param set shown under it | Provenance |
|---|---|---|---|
| **Native** | Lit MeshPhysicalMaterial — the clay/ink object read | **Material sub-dropdown** (below) | FS materials are `implemented: true` with real numbers |
| **Hatch** | Procedural screen-space hachure post-process; 8-band luminance quantization | The Shading sliders (hachureGap/hachureAngle/inkIntensity/strokeWidth) — SAME state as 2D, surfaced in the 3D panel (one math, two renderers, `coverage.ts` bands) | D-4 ratified interim; build plan §3; research 21 §7 choice (c) |
| **SVG-port** | EdgesGeometry → screen-project → SvgStyleTransform overlay, stable seed | **The entire 2D chrome mounts under this option** — the chrome-split rule's only 2D appearance in 3D mode | M8 (this round); 21 §6; rotation-stability option (a) per F3-toggle-architecture |

### Native's Material sub-dropdown — port from FS style-system (real, tuned):

`Ink · Soft Gel · Matte Clay · Glossy Plastic · Rubber · Signal · Custom…` — full MeshPhysicalMaterial param tables in FS `MATERIAL_PARAMS` (color/roughness/metalness/clearcoat/sheen/emissive/envMapIntensity per preset). Port verbatim including the two behavioral rules: **per-mode defaults** (`rod→ink, extrude→glossyPlastic, solid→matteClay, inflate→softGel` — FS `MODE_MATERIAL_DEFAULTS`) and **`materialUserOverride`** (mode switches never overwrite an explicit material pick — I-1 spirit in FS's own code). FS preset colors are dark-brand (charcoal #26262b etc.) — expect a recolor at the 06-16 identity pass, not a re-architecture (**D-C, §6**). Custom… exposes FS's `CustomMaterial` sliders (color/roughness/metalness/clearcoat/sheen/emissive/envMap) — port the panel only if free after the three styles land.

### Explicitly NOT in round 7 (honesty ladder):

- `native-edges` / `native-wireframe` / `halftone` — real candidates (21 §6 decision matrix, F3-toggle-architecture Path-1 list); add pills only when implemented.
- FS **dither / ASCII / texture / fusion / layer-stack** preset families: FS's own registry marks every one `implemented: false` — they are labeled shells even at the source. Post-makeathon material at most; porting them now would violate the no-stub rule. Same for FS texture-lock modes (`screen/object/surface/stroke`) — the lock concept matters only once textures exist.
- FS **motion systems** (MotionMode `off/independent/syncToDraw`, material animations `shineSweep/gelShimmer/…` — implemented v1 in FS; reveal modes `raw/smooth/hybrid` in viewport-3d): defer. The desk already has its two celebrated motion moments; a third family needs the Day 12-13 identity pass and Sebs's explicit ask (`feedback_push_back_on_overadding`).

---

## 4. Per-mode vs shared

| Scope | Controls |
|---|---|
| **Shared across all geometry modes** | Geometry dropdown (Auto/Rod/Extrude/Inflate/Solid) · 3D Style dropdown · Material sub-dropdown (under Native) · Shading sliders (under Hatch — same `F3RoughModifiersContext` values the 2D pen uses) · orbit (always on) |
| **Per-geometry** | §2 param sets — swap with the dropdown exactly like 2D's `MODIFIER_SETS_BY_STYLE` |
| **Per-style** | §3 param sets — Native→materials, Hatch→shading, SVG-port→full 2D chrome |
| **Auto position** | Shows an explainer chip ("shape decides: open→rod, closed→extrude") + NO per-mode sliders; defaults apply. Picking an explicit mode reveals its set (**D-D, §6**) |

Pen|Desk gate semantics unchanged (D-7): Pen scope styles the preview squiggle + next doodle; Desk scope sweeps the lens. Per amendment 4, the 3D toggles are swept exactly like the 2D ones.

## 5. Chrome layout (under the locked split rule)

Right panel when mode = 3D — top to bottom, reusing `CollapsiblePanel`/`usePanelOpen` (keys `c3d.cluster.*`) + `chromeStyles` pills:

1. **MODE** — existing 2D|3D pill pair (header, unchanged).
2. **GEOMETRY cluster** (default open) — geometry dropdown + the active mode's §2 param set.
3. **3D STYLE cluster** (default open) — style dropdown + the active style's §3 set. Under SVG-port: the full 2D chrome (SmartHachureChrome) mounts HERE, inside the 3D panel, driving the ported treatment — it does not reappear as the separate 2D panel.
4. **(Round 8 reserved)** — AI engine row, hidden until real.

The 2D panel never renders in 3D mode; the 3D panel never renders in 2D mode. Precedent for the split: Blender's per-viewport shading + Spline's per-object-vs-scene scope split, already cited and locked in `global-toggles-and-mixed-3d.md` §3. Same panel component serves /canvas, DrawPanel popup, ObjectSurface Edit/Sandbox (one surface everywhere).

## 6. SEBS DECISIONS (recommended defaults, not locked)

| # | Decision | Recommendation |
|---|---|---|
| D-A | Inflate: add **Puff** as 4th slider (port FS's Z-aspect + derived feel bundle) vs keep 3-slider base/tip/pressure | Add Puff — it's FS's signature inflate feel, one slider, five tuned curves ride free |
| D-B | Solid **Holes** toggle default | ON (donuts stay donuts); OFF = the "fill" look Sebs named |
| D-C | Material sub-dropdown in round 7 vs hold for 06-16 identity pass | Port now (it's the Native style's substance); recolor presets at identity pass |
| D-D | Auto geometry position: hide per-mode sliders vs show in-use modes' clusters collapsed | Hide + explainer chip — params appear when the pick is explicit |
| D-E | Rod radius ceiling 0.128 (4× default) vs FS fallback envelope max 0.213 | 0.128 — past that, rods read as worms and swallow joints |
| D-F | Reveal/draw-in animation (FS raw/smooth/hybrid) anywhere in scope? | Defer entirely; revisit only if the demo video wants a 3D-build beat |

## 7. Citations

**Ours (primary):** free-stroke origin/main `lib/geometry-engines.ts` (TUBE/joint constants L193-200; extrude width map L231-308; depth multiplier L334-357; solid L379-452; inflate bundle L4937-5050; fallbackRodRadius L2012) · `lib/style-system.ts` (MaterialPreset L22-29; MATERIAL_PARAMS L339-460; MODE_MATERIAL_DEFAULTS L460-466; preset registry `implemented` flags L586-740) · `components/viewport-3d.tsx` (RevealMode L323; slider-dep contract L77-98) · desk-doodles `src/app/lib/geometry3d/strokeTo3d.ts` (DD constants + ×8/3 lock) · docs cited in header.
**External:** [Spline — Extruding 2D objects in 3D](https://docs.spline.design/doc/extruding-2d-objects-in-3d/docfstXfUI9s) · [Spline — 3D Paths](https://docs.spline.design/doc/-/docbpQK7hyhv) · [Spline — 3D Modeling Tools](https://docs.spline.design/doc/3d-modeling-tools/docxkPgyIGLN) · [Blender Manual — Solidify Modifier](https://docs.blender.org/manual/en/latest/modeling/modifiers/generate/solidify.html) · [Blender Manual — Skin Modifier](https://docs.blender.org/manual/en/latest/modeling/modifiers/generate/skin.html) · [Igarashi, Matsuoka, Tanaka — Teddy: A Sketching Interface for 3D Freeform Design, SIGGRAPH '99 (PDF)](https://www.cs.toronto.edu/~jacobson/seminar/igarashi-et-al-1999.pdf) · [Dvorožňák et al. — Monster Mash, SIGGRAPH Asia 2020 (PDF)](https://dcgi.fel.cvut.cz/home/sykorad/Dvoroznak20-SA.pdf) · [monstermash.zone](https://monstermash.zone/) · [Womp FAQ](https://www.womp.com/faq) · [Womp — drawing/image to 3D print workflow](https://www.womp.com/blogs/how-to-turn-any-drawing-or-image-into-a-3d-print-in-womp/).
