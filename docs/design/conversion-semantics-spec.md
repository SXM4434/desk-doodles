# Conversion Semantics — Phase D2 spec (per-region 2D→3D meaning)

**Date:** 2026-06-12 · **Status:** SPEC — no code in this pass (src/ owned by the build fleet). Deliverable of the round-7 directive (Sebs: "it's just auto-filling the whole thing… there's no system yet for how to handle conversion… building these now will help the smart and ML systems, which should have a layer in each dealing with this stuff").
**Governing refs:** `docs/design/smart-system-build-plan.md` (Phase D + Phase P addendum — D2 is the missing sibling) · `docs/design/global-toggles-and-mixed-3d.md` D-3/D-7-am.3 (mode flip converts FROM THE RECORD; geometry is style-independent) · `docs/design/3d-mode-controls-spec.md` (per-mode params; AI mode round 8) · `docs/research/21-research-3d-pipeline-and-style-translation.md` §4/§5/§5b/§7 · `src/app/lib/smartHachure/` (types/classifier/techniqueMap) · `src/app/lib/smart/coverage.ts` (8-band table) · `src/app/lib/geometry3d/strokeTo3d.ts` · `09-LOCKED-MODEL.md` I-1/I-2/I-7/I-10.

---

## 0. The problem (Sebs's arrow repro, root-caused in source)

Draw an arrow as an outline → Auto/Extrude renders a solid arrow-shaped slab: the whole interior fills. Root cause chain in `strokeTo3d.ts`:

1. `isClosedStroke` (:231) calls anything with endpoint gap < max(24px, 8% bbox diag) **closed** — an open-ish outline qualifies.
2. `pickGeometryMode` (:254) → `extrude`; `buildExtrudeGeometry` (:519) builds `THREE.Shape` from the loop — and `THREE.Shape` **silhouette-fills everything inside the outline** by definition.
3. No per-region layer exists between "closed" and "filled": what should stay line-work, what an enclosed-but-unshaded region means (hole? air? face?), what 2D shading means in 3D — none of it is decided anywhere. Closure is the *only* signal consulted.

Meanwhile the 2D side already HAS per-region decisions: `smartHachure/classifier.ts` assigns 9 `TonalRole`s with confidence + receipts, and `coverage.ts` quantizes source darkness into 8 bands. The 3D conversion just never asks. **Phase D2 = the layer that asks.**

## 1. Phase D2 in the smart system — same pipeline, new decision surface

Phase D (engine routing) answers "which geometry engine for this object." Phase P (placement) answers "where does it land." **Phase D2 answers "what does each REGION of the drawing mean as matter."** Same locked pattern, third instance:

```
signals (per region)  →  classify (CONSUME the existing classifier — no second brain)
                      →  conversion treatment (solid/shell/line-rod/hole/air + hatch-band/relief-band)
                      →  per-mode application (what Rod/Extrude/Inflate/Solid do with that treatment)
                      →  decision log entry (surface:'conversion') — receipts like everything else
```

**One classifier, many treatment surfaces (load-bearing):** D2 adds a second `techniqueMap`-style lookup (`src/app/lib/smart/conversionMap.ts`, NEW pure module — no locked-file contact), NOT a second classifier. 2D rendering and 3D conversion read the SAME `Classification` (role + `darknessL` + signals snapshot). A region the 2D engine hachures as `dense-tonal` is, by construction, the same region the 3D engine renders as dark-banded mass. That coherence IS the round-trip wedge.

**Two input registers, one region graph** (D-7 am.3: conversion always FROM THE RECORD, never from the rendered look):
- **Drawn strokes:** region graph = closed loops + containment-depth tree — exactly the machinery Solid mode already runs (`strokeTo3d.ts:1055-1107` depth-parity outer/hole classification). D2 promotes it from "Solid's internal trick" to the shared region model for all modes.
- **SVG uploads:** regions = elements; roles come straight from the live classifier (overrides still win at 1.0).
- **Tone-fill brush (round 7, the natural conversion input):** brushed darkness regions arrive with an EXPLICIT band — no inference needed. Tone-fill is to D2 what naming is to the label flywheel: the user telling the system the answer while playing.

## 2. Signals per region (all already computed or trivially derivable)

| Signal | Source | Drives |
|---|---|---|
| `closure` (closed / open / **open-ish**: gap ∈ (0, threshold]) | `isClosedStroke` split into three states | solid-vs-line family; open-ish gets the honesty chip (§6) |
| `role` (9 TonalRoles) | `classifier.ts` chain, verbatim | line-work vs mass vs pass-through |
| `darknessL` → band 0–7 | `signals.ts` + `coverage.ts` `bandIndexForDarkness` | hatch density / relief depth (§4) |
| `containmentDepth` (even=outer, odd=hole-candidate) | Solid's depth-parity walk, generalized | hole vs mass |
| `hasFill` / `strokeOnly` | signals.ts stylistic fields | shell-vs-solid for frames |
| `toneBand` (explicit, 0–7 or null) | tone-fill brush record | overrides inferred band (D2-F) |
| `areaFractionOfParent`, `enclosesSiblingCount` | signals.ts, verbatim | tiny-region clamps, donut rule |

## 3. Conversion treatments — the vocabulary

| Treatment | Meaning in matter | 2D analog (same classifier output) |
|---|---|---|
| `solid` | volumetric mass | filled/hachured region |
| `shell` | the OUTLINE is the object; interior is air | structural-frame outline, no fill |
| `line-rod` | the stroke itself is the object (ink worm) | line-decoration / open stroke |
| `hole` | subtract from the containing solid | paper reservation inside ink (donut) |
| `air` | enclosed but means nothing; render nothing | `paper` role |
| `surface-hatch(band)` | band drives hatch density on the region's surface | I-2 source-darkness → fillStyle density |
| `relief(band)` | band offsets extrusion depth (opt-in axis, §4) | — (new; Heightmap-lite per 21 §5) |

**Default role → treatment map** (rule-based, transparent, every row loggable):

| Role(s) | Treatment |
|---|---|
| `paper` | `air` — never mass |
| `structural-frame`, `line-decoration` | `shell` (closed) / `line-rod` (open) — **the arrow fix**: outline → wall/rods, never slab |
| `sparse/mid/dense-tonal`, `solid-content` | `solid` + `surface-hatch(band)` |
| `decorative-accent` | `line-rod`, radius scaled down (mirrors its 2D roughness-down rule) |
| `label-text` | `line-rod` flat, never inflated — pass-through spirit of I-1 |
| enclosed + band 0 + odd containment depth | `hole` (donut rule — depth parity, already proven in Solid) |
| enclosed + band 0 + even depth | `air` if strokeOnly parent region, else front face of the parent's `solid` — genuinely ambiguous, user toggle (§6, D2-B) |

Precedent for the defaults: closed-region-becomes-volume is the founding convention of sketch-modeling — Teddy inflates closed strokes only ([Igarashi et al., SIGGRAPH '99](https://www.cs.toronto.edu/~jacobson/seminar/igarashi-et-al-1999.pdf)); SketchUp Push/Pull operates on FACES (closed loops) only — open edges can't extrude ([SketchUp Help: Pushing and Pulling Shapes into 3D](https://help.sketchup.com/en/sketchup/pushing-and-pulling-shapes-3d)); Spline's 2D→3D is extrusion-of-shapes with open paths handled as path objects, not fills ([Spline docs: Extruding 2D objects](https://docs.spline.design/doc/extruding-2d-objects-in-3d/docfstXfUI9s) · [3D Paths](https://docs.spline.design/doc/-/docbpQK7hyhv)); Monster Mash inflates closed outlines and treats other strokes as annotations ([Dvorožňák et al., SIGGRAPH Asia 2020](https://dcgi.fel.cvut.cz/home/sykorad/Dvoroznak20-SA.pdf)); the open-vs-closed dichotomy and its ambiguity are catalogued in the SBIM survey ([Olsen et al., Computers & Graphics 2009](https://ires.cpsc.ucalgary.ca/publ/papers/2009/refs/Olsen%20et%20al.%20'09.pdf)). What NONE of these ship is role-aware region semantics inside one drawing — that's our classifier dividend.

## 4. Per-mode application matrix (geometry dropdown stays sacred; treatments decide WITHIN the mode)

| Treatment | Rod | Extrude | Inflate | Solid |
|---|---|---|---|---|
| `line-rod` | tube (native) | tube (regions that are line-work stay rods even in Extrude) | tube | ink-stamp only (no interior fill) |
| `solid` | closed-loop tube (honest outline read — Rod never fakes mass) | filled slab (today's behavior, now EARNED by role) | capsule/blob | scanline-fill into grid |
| `shell` | closed-loop tube | **makeathon cut:** closed-rod tube ring · **post:** true ribbon wall (outline offset ± strokeWidth/2, outer Shape + inner hole) | tube-around-loop (croissant read — already the documented forced-inflate character) | ink-stamp WITHOUT scanline fill |
| `hole` | n/a (no interior) | `Shape.holes` on the containing solid | post-MVP (capsule can't hole; falls back to `air` + log) | depth-parity holes (BUILT) |
| `air` | skip | skip | skip | don't fill |
| `surface-hatch(band)` | band → Hatch-shader uniform per mesh | same | same | same |
| `relief(band)` | n/a | per-region depth offset (opt-in) | base-radius offset (opt-in) | per-contour depth (opt-in) |

Auto mode composes: per REGION, `line-rod` regions → Rod machinery, `solid` regions → Extrude, inside ONE object. The arrow end-to-end: outline classifies `structural-frame`, interior band 0 → `shell` → closed-rod ring; the arrowhead's solid-filled notch (if inked) → small `solid` slab. No more auto-slab.

**Mark grammar (multi-stroke, pen-tip, wobble) does NOT convert to geometry.** D-7 am.3 is explicit: geometry is style-independent; style differences live in the 3D material/NPR layer. Pen character carries via (a) Hatch uniforms (Shading sliders → `coverage.ts` bands — one math, two renderers), (b) SVG-port style at M8 (the full 2D chrome re-applied on projected edges), (c) the ONE sanctioned geometry exception: pressure → inflate radius (`INFLATE_PRESSURE_INFLUENCE`, already shipped). Multi-stroke as N parallel tubes = rejected: triples mesh cost, breaks physics hulls, and duplicates what SVG-port does honestly at the style layer.

## 5. 2D shading → 3D: pick the band-preserving mapping

Three candidate meanings for a dark/hachured region: deeper relief, denser surface hatching, darker material. **Primary = `surface-hatch(band)`: coverage band → hatch density on that region's surface, same `COVERAGE_BANDS` table via `bandTableForUniforms()`.** The argument:

1. **I-2 round-trip invariance.** Source darkness owns per-region perceptual identity. Hatch density preserves the band EXACTLY (the 3D shader quantizes with the same 8 numbers the SVG renderer uses — Praun TAM banding, [Real-Time Hatching, SIGGRAPH 2001](https://gfx.cs.princeton.edu/pubs/Praun_2001_RH/index.php)). Relief preserves it only via lighting — lossy and viewpoint-dependent. Render the 3D back to 2D and the band must survive; only hatching guarantees that.
2. **It's what the marks MEAN.** An artist hatching a region is declaring tone, not excavating depth. The literature that lifts 2D drawings toward 3D treats shading as an illumination/normal cue, not a displacement map — Lumo derives normals from line art for lighting ([Johnston, NPAR 2002](https://www.semanticscholar.org/paper/Lumo:-illumination-for-cel-animation-Johnston/2e0a1dbdc8a741c49684aa61b9482c8c735c7fd9)); Ink-and-Ray builds bas-relief proxies to LIGHT hand-drawn characters, keeping the drawing authoritative ([Sýkora et al., TOG 2014](https://dcgi.fel.cvut.cz/home/sykorad/ink-and-ray)).
3. **Darker material is rejected as the mapping** because the 3D material is policy-fixed monochrome ink (§7) — per-region material lightness would fork the ink into N greys and kill hatch contrast on the dark bands.

**`relief(band)` ships as an opt-in SECONDARY axis** — one "Relief" slider (0 = off default … 1 = full band-to-depth), the Heightmap-lite of 21 §5. Expressive, honest, never the silent default, polarity toggle per §6.

## 6. The honest boundary — what CANNOT be inferred (user toggles, never guesses)

| Ambiguity | Why inference is impossible | Control |
|---|---|---|
| Hole vs face (enclosed, unshaded, even-depth) | A window and a panel are drawn identically | `Holes` toggle (already specced, 3d-mode-controls §2.4) + post-MVP per-region tap-override |
| Open-ish closure | The 24px/8% threshold is a guess about intent | "Treated as closed" status chip + `Treat as: closed/open` pill on the object |
| Relief polarity | Printmaking raises ink; engraving recesses it — both real conventions | polarity toggle next to the Relief slider |
| Inflate vs extrude for closed organic shapes | Balloon vs cookie is pure intent (Teddy assumes balloon; Spline assumes cookie) | the geometry dropdown — already sacred, stays the answer |
| Absolute depth/scale | A drawing has no Z | per-mode Depth sliders (3d-mode-controls §2) |
| Hatching-as-tone vs hatching-as-form-cue (curvature strokes) | Same marks, different artist intent | default = tone (§5); form-cue reading is post-makeathon research |
| Which strokes form one object | Grouping is compositional intent | desk = one object per Done (already the model); Solid merges the pool explicitly |

## 7. Material color policy — monochrome warm-graphite ink (Sebs lean, ratified direction)

- **ONE 3D material family until the 06-16 identity pass: warm-graphite ink.** All four local modes + AI meshes + the Hatch style's ink. No per-object hue, no per-region grey forks.
- **The palette rule generalizes** (`feedback_palette_overrides_ink_not_paper`): color systems remap INK only, never paper/none. In 3D: object material = ink register; desk paper + lighting = paper register. **Color never touches user art** — a colored source drawing still converts to graphite mass; the color lives untouched in the record (D-5: nothing is baked; the 2D life keeps it).
- **Current value is out of register:** `Stroke3DScene.tsx` `INK_SOFT_FALLBACK = '#5A5043'` sits at the W1 *secondary/caption* ink tier (≈ `#5F5B54`) — caption ink on an object mass is why it reads light/bronze ("clay tan"). Recommended range: **the W1 dark-ink span, `#121110` (primary, L*≈7) → `#383632` (body, L*≈23), warm-graphite axis** — recommend default ≈ `#2A2622` (between primary and body; the warm-axis sibling of Free Stroke's proven charcoal `#26262b`). Keep the paper-tinted sheen `#d8c9ae` — sheen, not base lightness, is what carries curvature on white. Exact hex = identity-pass call (II Warm Riso Press), range locks now (D2-E).

## 8. Honest defaults vs the learned ladder

**Makeathon cut (rule-based, transparent):** the §3 role→treatment table + §4 matrix as `conversionMap.ts` lookups; every region logs `{surface:'conversion', regionPath, role, band, treatment, firedRules}` to `window.__dd_decisionLog`; offline/deterministic per I-7/I-10; shell = closed-rod (D2-C); relief off by default; §6 toggles global-level only.
**Training data, exactly like naming/placement:** every §6 toggle flip and post-MVP per-region correction is a labeled tuple `(signalsSnapshot, role, defaultTreatment, correctedTreatment)` through the existing `overrideStore`/decision-log pattern — the drag-correction analog from Phase P-3. Conversion-golden = snapshot auto-treatments across the 197-shape catalog, blessed by eyeball, diffed by the same golden-diff gate before any rule change. Learned providers (tree on corrections; cached-LLM region semantics at ingest; the round-8 vision router consuming the region graph in its prompt) slot into the SAME provider chain — post-makeathon per the build-plan ladder, dataset starts accruing day one.

## 9. SEBS DECISIONS

| # | Decision | Recommended default |
|---|---|---|
| D2-A | Adopt "Phase D2 — Conversion Semantics" as a named smart-system phase (slots after Phase D, builds with the 3D rounds) | Yes — it's the missing sibling; the doc above is its contract |
| D2-B | Enclosed-unshaded default: hole (depth parity) vs air vs solid face | Hole by depth parity (donut rule — matches Solid + Teddy convention), `Holes` toggle beside it |
| D2-C | Shell makeathon cut = closed-rod ring; true ribbon-wall post | Yes — zero new geometry code now, honest ladder |
| D2-D | Shading mapping: surface-hatch primary, relief opt-in slider | Yes — band-preserving wins (§5 argument) |
| D2-E | 3D ink range `#121110`–`#383632` warm axis, default ≈ `#2A2622`; exact hex at identity pass | Lock the range now; current `#5A5043` is out of register |
| D2-F | Tone-fill band vs inferred band when both exist on a region | Tone-fill wins — explicit user register beats inference, always |
| D2-G | Per-region treatment override UI (tap region → cycle) | Post-makeathon; makeathon ships global toggles + receipts |

## 10. Citations

**Ours:** `smart-system-build-plan.md` (pipeline + Phase P precedent) · `global-toggles-and-mixed-3d.md` (D-3 ladder, D-7 am.3) · `3d-mode-controls-spec.md` (param sets, AI round 8) · `21-research` §4/§5/§5b/§7 + consolidated citations [19][20] · `smartHachure/types.ts` (TonalRole/Treatment) · `classifier.ts` · `coverage.ts` (COVERAGE_BANDS, bandTableForUniforms) · `strokeTo3d.ts` (:231 closure, :254 auto-pick, :519 Shape fill, :1055 depth parity) · `Stroke3DScene.tsx` (:43 ink fallback) · `color-system-w1.md` (ink ladder).
**External (verified):** [Igarashi, Matsuoka, Tanaka — Teddy, SIGGRAPH '99 (PDF)](https://www.cs.toronto.edu/~jacobson/seminar/igarashi-et-al-1999.pdf) · [Teddy — SIGGRAPH History archive](https://history.siggraph.org/learning/teddy-a-sketching-interface-for-3d-freeform-design-by-igarashi-matsuoka-and-tanaka/) · [SketchUp Help — Pushing and Pulling Shapes into 3D](https://help.sketchup.com/en/sketchup/pushing-and-pulling-shapes-3d) · [Spline — Extruding 2D objects](https://docs.spline.design/doc/extruding-2d-objects-in-3d/docfstXfUI9s) · [Spline — 3D Paths](https://docs.spline.design/doc/-/docbpQK7hyhv) · [Womp — drawing/image → 3D](https://www.womp.com/blogs/how-to-turn-any-drawing-or-image-into-a-3d-print-in-womp/) · [Dvorožňák et al. — Monster Mash, SIGGRAPH Asia 2020 (PDF)](https://dcgi.fel.cvut.cz/home/sykorad/Dvoroznak20-SA.pdf) · [Olsen, Samavati, Sousa, Jorge — Sketch-based modeling: A survey, C&G 2009 (PDF)](https://ires.cpsc.ucalgary.ca/publ/papers/2009/refs/Olsen%20et%20al.%20'09.pdf) · [Delanoy et al. — 3D Sketching using Multi-View Deep Volumetric Prediction (arXiv:1707.08390)](https://arxiv.org/pdf/1707.08390) · [Praun et al. — Real-Time Hatching, SIGGRAPH 2001](https://gfx.cs.princeton.edu/pubs/Praun_2001_RH/index.php) · [Johnston — Lumo: Illumination for Cel Animation, NPAR 2002](https://www.semanticscholar.org/paper/Lumo:-illumination-for-cel-animation-Johnston/2e0a1dbdc8a741c49684aa61b9482c8c735c7fd9) · [Sýkora et al. — Ink-and-Ray, TOG 2014 (project page)](https://dcgi.fel.cvut.cz/home/sykorad/ink-and-ray)

---

## RED-TEAM AMENDMENT (RATIFIED 2026-06-12 — supersedes §1's "one brain" framing and §3's single table)

The adversarial review CONFIRMED LIVE (decision log on the real desk: 23/23 drawn-doodle regions classify `paper` — signals.ts returns the literal "none" for fill, darknessL=0, RULE_paper_near_zero@0.9 outscores RULE_stroke_only_path@0.85) that the classifier contributes ZERO useful bits for drawn strokes. Consuming it verbatim per §3 would render every drawn doodle as `air` — nothing — in 3D, and the post-fix labels would turn every closed drawn loop into a wire ring (killing the chunky-slab default the sketch-modeling canon demands).

**The ratified architecture: one record, one treatment vocabulary, TWO register brains.**

1. **DRAWN register (stroke-only records): geometry/topology is the brain.** Closed → `solid` (the heart slab is sacred — Teddy/SketchUp/Spline convention); open → `line-rod`; open-ish → `line-rod` + a "treated as closed?" chip (3-state closure replaces the grabby max(24px, 8%) threshold — root cause #1 of the arrow-slab); nested band-0 loop at odd containment depth → `hole` (D2-B donut rule); tone-band > 0 → `solid + surface-hatch(band)`. `shell` is reachable via toggle/override, NEVER the drawn default. **The classifier is never invoked on drawn stroke records.**
2. **UPLOAD register: the classifier is the brain** (rich, golden-gated) — §3's role table applies as written.
3. **The classifier `paper` misfire is a real bug filed separately** (classifier.ts:287 must exclude fill==="none", or signals.ts normalizes per types.ts:55) — fixing it flips labels across the 197-shape catalog → requires a golden re-bless ceremony, NOT tonight.
4. **D2-D stands with the Native-invisibility rider:** surface-hatch(band) has no visible channel under the Native 3D style (monochrome ink policy forbids per-region grey forks) — the demo's shading beat must run under Hatch style or with Relief visibly nudged. Per-region shading has zero drawn-input effect until the tone-fill brush ships.
5. **Router schema gains optional `regionTreatments?` now** so demo-warmed cache rows survive the post-makeathon LLM semantics provider landing.
6. Tonight's build = the smallest blast radius: 3-state closure + donut-parity holes + conversionMap.ts + decision-log receipts (G-1) + the §6 toggles. No classifier contact, no golden re-bless.
