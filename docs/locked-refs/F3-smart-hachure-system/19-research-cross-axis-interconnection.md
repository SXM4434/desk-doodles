# 19 — Research: Cross-axis interconnection matrix

**Status:** seed research from playground decoding agent, 2026-06-04. Source authority: playground source at `apps/Homepage Surfaces v2 Lab/src/app/lib/handFeel.ts` + `C3UserFlow.tsx` + `GateAIonArtifactPlaygroundContext.tsx`. Rebuild compared: `apps/Hero-8-Lab/src/app/lib/f3HandFeel.ts` + `SvgStyleTransform.tsx` + `F3RoughModifiersContext.tsx`.

**Conclusion:** the playground is a tightly coupled ecosystem of ~9 modifiers where almost every toggle changes how the others render. The rebuild flattened this into ~20 independent sliders and lost (a) the one global "wobble" multiplier that scaled all roughness uniformly, (b) the deterministic per-side seed offset model, and (c) several pair-wise interactions that the playground gets implicitly because every primitive funnels through the same 6 functions in `handFeel.ts`.

---

## A. Toggle inventory

### A.1. Playground (the "ecosystem")

Per `GateAIonArtifactPlaygroundContext.tsx:399-432` and `C3UserFlow.tsx:263-271`:

| # | Toggle | Type | Source | Effect |
|---|---|---|---|---|
| 1 | `wobble` | continuous (0–2) | `:410` | global roughness multiplier across all shapes |
| 2 | `strokeCount` | discrete (1–5) | `:411` | how many layered passes per shape |
| 3 | `strokeWidth` | continuous (0.5–2.0) | `:412` | per-path strokeWidth multiplier |
| 4 | `endpointBehavior` | enum (clean · protrude · long-overshoot · kink) | `:413` | corner overshoot model |
| 5 | `sketchingStyle` | enum (single-pass · loose-overlap · parallel-pass · cross-hatch) | `:414` | layer pacing across N strokeCount layers |
| 6 | `penTip` | enum (8 presets) | `:415` | swaps render path from rough strokes to perfect-freehand polygons |
| 7 | `texture` | enum (10) | `:431` | SVG filter wrapping geometry group |
| 8 | `variant` | enum (a/b/c/d) | `:371` | composition variant |
| 9 | `decisionLabels` | on/off | `:436` | label visibility |

**Per-shape base calibration (sacred ratios):** `rect: 2.4, oval: 2.4, diamond: 2.0, line: 1.4, orthogonal: 1.6` at `handFeel.ts:397-408`. Multiplied by `wobble` at render time.

### A.2. Rebuild (the regression)

Per `F3RoughModifiersContext.tsx:61-110`: **20 continuous + 9 discrete modifiers**, every one *independently* settable. Critical missing piece: **no `wobble` field**. Raw `roughness` slider has no per-shape calibration concept.

---

## B. The 4 regressions — root cause

### B.1. Wobble is entirely missing

- **Playground (`handFeel.ts:17-27` + `C3UserFlow.tsx:263,289-290`):** `wobble: 0-2` from chrome multiplies `HAND_FEEL_BASE.rect|oval|diamond|line|orthogonal`. The per-shape bases are calibrated RATIOS. Wobble preserves them while scaling.
- **Rebuild:** No `wobble` field in `F3ModifiersState`. Raw `roughness` slider with no per-shape differentiation. Each shape's base IS in play but driven by raw roughness, not normalized multiplier. **Lost the only modifier that operates at SYSTEM level vs. SHAPE level.**

### B.2. Endpoint kink doesn't work on paths

- **Playground (`handFeel.ts:154-159`):** `protrudeFor()` for kink returns 5px radial push. All shape primitives apply it as radial corner push.
- **Critical finding:** `isKink()` is defined (line 161-164) but **NEVER called**. Kink is rendered identically to protrude in the playground source. The "randomized angle kink" the doc-comment describes was never implemented in either app.
- **Rebuild — paths (`SvgStyleTransform.tsx:536-541`):** Uses `endpointBowingNudge: 0.8` (segment bow), not radial corner push. **Different mechanism** for path content. On Hero-8 cells which use `<path>` heavily, kink reads as "no change."

### B.3. Layered strokes off after fixes

- **Playground (`C3UserFlow.tsx:275-318`):** Each layer renders with distinct seed via `seedOffsets()` line 275-278 with coprime increments `[0, 47, 113, 181, 257]`. Layer 0 gets fill + 1.25× strokeWidth; layers ≥1 get fill=none + 1.0× strokeWidth.
- **Rebuild (`SvgStyleTransform.tsx:468-520`):** Preserves the core logic but adds `stableLayerNudge()` (line 220-230) that applies a non-playground XY translate to layer ≥1 **even when `sketchingStyle = single-pass`**. The nudge's magnitude can outpace loose-overlap's magnitude=2 (line 209), so loose-overlap+nudge fight each other.

### B.4. Kink × loose-overlap interaction

- **Playground (`handFeel.ts:185-205`):** Compound effect: protrude/kink moves corner radially outward; loose-overlap then moves corner FURTHER along segment from already-protruded position. With strokeCount > 1, each layer extends further (`layerIndex * 3`). Creates a **fan of overshoots at each corner**, growing per layer.
- **Rebuild — primitive shapes:** Preserved in `f3HandFeel.ts:78-108` (halved constants). Works.
- **Rebuild — paths:** Breaks for the same reason B.2 breaks — path branch bypasses points-based logic, no compound corner extension possible.

---

## C. Pair-wise interaction matrix (the headline)

13 modifiers ≈ 169 cells. Read row → column. **→** = A drives B directly. *****  = joint effect via third variable. **—** = independent.

```
                     wob  cnt  sw   ep   sk   pen  tex  fil  hg   ha   ts   ink  fo
wobble                —   —    —    *    *    —    —    *    →    —    —    —    —
strokeCount           —   —    —    →    →    →    —    —    —    —    —    —    —
strokeWidth           —   —    —    —    —    →    —    —    —    —    —    —    —
endpointBehavior      *   —    —    —    →    *    —    —    —    —    —    —    —
sketchingStyle        *   →    —    →    —    *    —    —    —    —    —    —    —
penTip                —   *    →    *    *    —    →    —    —    —    →    —    —
texture               —   —    —    —    —    *    —    —    —    —    —    —    —
fillStyle             —   —    —    —    —    —    —    —    →    →    →    —    →
hachureGap            *   —    —    —    —    —    —    *    —    —    *    —    —
hachureAngle          —   —    —    —    —    —    —    *    —    —    —    —    —
textureIntensity      —   —    —    —    —    —    *    —    —    —    —    —    —
inkIntensity          —   —    —    —    —    —    —    —    —    —    —    —    →
fillOpacity           —   —    —    —    —    —    —    *    —    —    —    *    —
```

---

## D. N-way interactions (3+ toggles — the "living ecosystem" cells)

### D.1. wobble × strokeCount × endpointBehavior
Triangle defining "weight at corners" feel. `EXCALIDRAW_WARN_THRESHOLD = 1.4` at `handFeel.ts:411`. Rebuild has NO equivalent warn because wobble is gone.

### D.2. strokeCount × sketchingStyle × endpointBehavior (HEADLINE)
**This is the kink × loose-overlap interaction.** Per `handFeel.ts:185-205`: protrude moves corner radially → loose-overlap moves end further along segment → strokeCount > 1 each layer extends further → fan of overshoots per corner. Rebuild's `<path>` branch breaks this.

### D.3. penTip × strokeCount × sketchingStyle × texture
Maximum "drawn many times in pencil with grain" register. Pen-tip swaps to perfect-freehand polygons, sketchingStyle transforms layers, texture filter wraps. Playground supports via composition (`C3UserFlow.tsx:300-318` × line 457). Rebuild supports geometry but texture-intensity scaling diverges from playground calibration.

### D.4. strokeCount × strokeWidth × wobble
At strokeCount=3 + strokeWidth=0.45 + roughness=0.24, jitter (~0.58px) barely above stroke width → layers fuse. Playground avoids via wobble ≥ 0.5 keeping jitter visible. Rebuild added `stableLayerNudge()` to force separation — fights sketchingStyle (B.3).

---

## E. Cluster taxonomy (groupings by code coupling)

Toggles partition into 5 clusters that share render paths. The classifier should consume CLUSTER-level features, not individual modifier values.

### Cluster 1 — Multi-Stroke
**Members:** wobble · strokeCount · strokeWidth · endpointBehavior · sketchingStyle
**Code:** `handFeel.ts:154-391` (every primitive)
**Visual axis:** "how much hand is in the stroke"
**Regression:** wobble missing → no master dial

### Cluster 2 — Pen Tip
**Members:** penTip · strokeWidth (shared) · texture
**Code:** `handFeel.ts:451-672` + `C3UserFlow.tsx:457`
**Visual axis:** "what's the writing implement"
**Coupling:** penTip swaps entire render path (stroke → polygon). Texture filter wraps after. strokeWidth multiplies both.

### Cluster 3 — Shading (REBUILD-ONLY)
**Members:** fillStyle · hachureGap · hachureAngle · fillDensity · fillOpacity · dot-params
**Code:** `SvgStyleTransform.tsx:381-466` + rough.js fillStyle
**Visual axis:** "how is the tonal region rendered"
**This is Smart Hachure's home.** Playground has nothing equivalent.

### Cluster 4 — Surface Texture
**Members:** texture · textureIntensity · blurAmount · bleed · grainIntensity · smudgeAmount · pressureVariance
**Code:** `C3UserFlow.tsx:130-187` (TextureFilterDefs)
**Visual axis:** "what does substrate do to ink"
**Coupling:** All members compose into one SVG filter chain wrapping geometry group after Clusters 1-3.

### Cluster 5 — Color/Palette (REBUILD-ONLY)
**Members:** strokePalette · fillPalette · inkIntensity
**Code:** `SvgStyleTransform.tsx:93-126`
**Visual axis:** "what tier of W1 ink"
**Mostly orthogonal** to Clusters 1-4.

---

## F. Minimum fix list (priority order)

1. **Reintroduce wobble (0-2)** as multiplier on `HAND_FEEL_BASE.x` per shape. Add chrome row with Excalidraw warning band > 1.4. **Restores Cluster 1's master dial.** Fixes regression B.1.
2. **Route `<path>` content through a polyline sampler** so endpointBehavior + sketchingStyle apply identically across all primitive types. Fixes regressions B.2 and B.4.
3. **Make stableLayerNudge conditional** on `sketchingStyle === 'single-pass'`. When non-single-pass, sketchingStyle's transform owns the layer offset. Fixes regression B.3.
4. **Either implement randomized-angle kink** the doc-comment promises, **or drop the kink name entirely.** Currently both apps render kink identically to protrude. Removes fake-provenance source-of-truth.
5. **Add `bannedCombinations` to STYLE_PRESETS** sourced from the §C matrix. Style switch + preset application checks bans. Bones for the future classifier.
6. **Lock per-shape base ratios** as system constants with calibration comment explaining 2.4/2.4/2.0/1.4/1.6 ratio. Don't let future tuning drift them.
7. **Document Cluster taxonomy (§E)** as load-bearing in `09-LOCKED-MODEL.md`. Classifier consumes cluster-level features.

---

## G. Recommended invariants for `09-LOCKED-MODEL.md`

Add to §2:

**I-11. Wobble is the master proportion-preserving dial.** A scalar `0-2` that multiplies the per-shape calibrated bases (`HAND_FEEL_BASE`). The per-shape bases are sacred ratios — wobble preserves them while scaling. Without this, the system has independent knobs instead of a connected ecosystem.

**I-12. One render pipeline per primitive type.** Don't fork "shape primitives → points-based" vs "path primitives → rough.js options". Sample paths to polylines and route through the same pipeline. Otherwise pair-wise interactions silently break for path content.

**I-13. Cluster-level features for the classifier.** The intelligent layer consumes cluster-level signals (Multi-Stroke, Pen Tip, Shading, Surface Texture, Color), not individual modifier values. Cluster taxonomy locked per §E.

**I-14. sketchingStyle owns layer transform exclusively.** When `sketchingStyle !== 'single-pass'`, no other modifier may apply layer-offset translations. The stableLayerNudge fix (regression B.3) becomes a permanent invariant.

---

## H. Files surveyed

**Playground (upstream authority):**
- `apps/Homepage Surfaces v2 Lab/src/app/lib/handFeel.ts` (719 lines)
- `apps/Homepage Surfaces v2 Lab/src/app/components/artifacts/C3UserFlow.tsx` (1071 lines)
- `apps/Homepage Surfaces v2 Lab/src/app/state/GateAIonArtifactPlaygroundContext.tsx` (592 lines)

**Rebuild (under audit):**
- `apps/Hero-8-Lab/src/app/lib/handFeel.ts` (718 lines — copy of playground)
- `apps/Hero-8-Lab/src/app/lib/f3HandFeel.ts` (357 lines — Hero-8 overlay)
- `apps/Hero-8-Lab/src/app/components/hero8/cells/SvgStyleTransform.tsx` (1096 lines)
- `apps/Hero-8-Lab/src/app/state/F3RoughModifiersContext.tsx` (180 lines)

**Cross-reference:**
- `docs/labs/hero/cells/F3-shading-calibration-spec.md` — locked design contract; this doc seeds §6 extensions
