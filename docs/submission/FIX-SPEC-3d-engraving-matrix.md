# FIX-SPEC — 3D engraving + distinct homepage matrix (R10, 2026-06-15)

Source: research workflow `wf_49307b52-80b` (6 agents, validated against live repo). Full output:
`/private/tmp/.../tasks/wux4qkzsw.output`. Sebs eyes-on; "engrave the detail", "nothing on the homepage repeats".

## Headline finding
The engraving pipeline **already exists** (svg-port: emissive ink albedo + Sobel `normalMap` head-on read +
`displacementMap` carve on a `TessellateModifier(0.04,5)` cap; `drawingTexture.ts buildSvgPortTexture`). It is **DEAD on
the homepage/desk** because the *static* `DeskObject3DMount` never passes `svgPortMarkup` to `Stroke3DSceneLazy` (the carve
effect `Stroke3DScene.tsx:894` early-returns when markup is falsy) → svg-port objects render an uncarved blob. Native
extrude/solid uses a `bumpMap` fallback (`buildDrawingReliefTexture`, `RELIEF_BUMP_SCALE 2.2`) that's too shallow at the
current tuning.

## PART A — Engraving
**A1 (REQUIRED unblock).** `src/app/components/DeskDoodles/DeskObject3DMount.tsx` static `DeskObject3DMount`:
- Add optional `svgPortMarkup?: string` PROP (do NOT import `strokesToObjectMarkup` — it lives in the heavy DrawSurface and
  would bloat the homepage chunk; the homepage already computes per-shape markup via `shapeMarkup()` and can pass it).
- Pass `svgPortMarkup` + `hatchInputs={{hachureGap:4,hachureAngle:-41,strokeWidth:1.2,inkIntensity:1.0, grammar:resolved.hatchGrammar, direction:resolved.hatchDirection}}` to `Stroke3DSceneLazy` (mirror Live3DMount lines 190-200; both props already accepted by Stroke3DScene at :563/:569).
- ⚠ FIRST verify which path the homepage actually uses: static `DeskObject3DMount` vs the shared-canvas `Object3DViewLazy`/`Shared3DCanvasLazy`/`LiveObject3DSlot` (homepage showed 6 canvases). Wire markup into whichever the hero objects mount through (and into `Object3DView`/MultiStroke3D if shared — it already accepts `svgPortMarkup` per the synthesis).

**A2 (tuning, after A1 lights up svg-port).**
- `Stroke3DScene.tsx:934` `TessellateModifier(0.04,5)` → `(0.03,6)` (finer cap so thin marks carve as continuous channels).
- `drawingTexture.ts` `RELIEF_DISPLACEMENT_SCALE 0.17 → ~0.22`; `GROOVE_FRAC 0.007 → ~0.010` (deeper recess + fatter walls so a slab's screen/buttons read as crisp pits). Keep `NORMAL_STRENGTH 0.5` + normalScale 4.0 (robust head-on read). Keep the svg-port grazing keys + `dimFill` (raking light reveals shallow grooves — do NOT raise fill).

**A3.** Native `bumpMap` fallback (`Stroke3DScene.tsx:830-869`) — no change; safety net when markup absent.
Make-safe: only canvas-2D rasterization + CanvasTexture + TessellateModifier (already imported). No CSG/POM/TSL (parked).

## PART B — distinct homepage matrix (13 configs, ZERO repeats), in `DeskDoodlesHome.tsx:75-97`
| # | shape | geo3d | shows |
|---|-------|-------|-------|
| 1 | pokeball | solid · native · glossyPlastic | glossy clearcoat (unchanged) |
| 2 | gameBoy | **extrude · svg-port** | ENGRAVED screen+buttons (was extrude/native/matteClay) |
| 3 | pairedMug | inflate · native · softGel | soft balloon (unchanged) |
| 4 | medal | **solid · svg-port** | carved ring/text (was extrude/hatch — breaks extrude repeat) |
| 5 | switch | rod · native · signal | metallic tube (unchanged) |
| 6 | shoe | **rod · hatch · contour** | contour-hatch wire (was inflate/hatch — breaks inflate repeat) |
| 7 | vinyl | solid · native · matteClay · nativeProps{outline:0.6} | inverted-hull ink OUTLINE dial (new) |
| 8 | overEarHeadphones | rod · native · **ink** | brand ink preset, unused (new) |
| 9 | filmReel | extrude · native · **rubber** | satin rubber preset, unused (new) |
| 10 | marioHat | inflate · svg-port | carve into a puff (new) |
| 11 | ps5Controller | extrude · hatch · cross-hatch | cross-hatch slab (new) |
| 12 | flagPin | inflate · native · glossyPlastic | glossy puff (distinct from #3 by material) (new) |
| 13 | instaxCamera | solid · hatch · stipple | stipple-dot mass (new) |

Zero-repeat proof: native triples all distinct; svg-port only on distinct geo labels (extrude/solid/inflate); hatch only
with distinct grammars (contour/cross-hatch/stipple). svg-port objects (#2,#4,#10) DEPEND on A1. hatch-grammar objects
(#6,#11,#13) need the `hatchInputs` thread from A1. Giving the 7 formerly-2d-only objects a geo3d is harmless while they
stay 2D; if Sebs wants them to actually flip, change their `behavior` (design call).

## Files
1. `DeskObject3DMount.tsx` — A1 (svgPortMarkup prop + hatchInputs); confirm static-vs-shared path first.
2. `Stroke3DScene.tsx:934` — A2 tessellate.
3. `drawingTexture.ts` — A2 displacement+groove.
4. `DeskDoodlesHome.tsx:75-97` — Part B 13 configs (+ pass svgPortMarkup for svg-port heroes).

## Verify (CLAUDE.md gate)
Headed Chrome at :5182 (headless can't WebGL). Flip Game Boy → 3D, before/after screenshot: screen rectangle + 4 buttons
read as recessed at thumbnail AND on orbit. Then homepage: all 13 distinct, none a blob. Harness: `/tmp/dd-rose3d.mjs`,
`/tmp/dd-home.mjs`.

## Already shipped this round (tsc-clean, local, NOT committed)
Auto→Inflate line-art routing (rose reads in Auto); fresnel rim glow on Native (`applyRimGlow`, helped Pokéball);
MAX_STROKES_3D 60→220; edge lines on for native/hatch; Pokémon-style Card PNG export (`exportPokemonCardPng`, verified).
