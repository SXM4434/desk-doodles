# F3 Shading + Toggle Calibration — Design Contract

> Research output produced 2026-06-02. Becomes the implementation spec for the
> next Hero-8-Lab F3 SVG-style pass. Every numeric value and parameter range
> below is cited to either: (a) the rough.js wiki, (b) the perfect-freehand
> TypeScript source, (c) MDN SVG filter primitives, (d) a published pen-and-ink
> shading reference, or (e) the playground's own calibration constants in
> `apps/Homepage Surfaces v2 Lab/src/app/lib/handFeel.ts` /
> `C3UserFlow.tsx` / `B1VennPositioning.tsx`.
>
> **Authority order (highest first):** Playground constants (locked, in
> production) → library docs (rough.js wiki, perfect-freehand types.ts, MDN) →
> published shading conventions (Erika Lancaster, Craftsy, Fiveable) → research
> docs in `docs/labs/applied-surfaces-v2/ion/gate-a-ion-texture-and-pen-tip-research.md`.
> Hero-8-Lab MUST match the playground unless a divergence is explicitly
> sanctioned in §7 of this doc; divergences not sanctioned here are bugs.

---

## §0 · Why this doc exists

The current Hero-8-Lab F3 SVG-style transform (`SvgStyleTransform.tsx`)
exposes 11 styles × ~25 modifiers (10 sliders + 8 dropdowns + 2 universal
palettes + style-specific knobs) on a chrome that lets the user mix any
combination of values, against source SVGs that use a constrained vocabulary
(WASH = `color-mix(... 8%, transparent)`, STROKE = `var(--dir-text-primary)`,
BG = `var(--dir-bg)`, occasional opaque tints). The combinatoric surface is
~10⁹. There is no implementation contract that says, for each combination,
which output is correct.

This has produced four classes of bugs the user has flagged:

1. **Hachure doesn't read as shading.** When `fillStyle = hachure` is active,
   the rendered hachure either ignores the source's tonal value entirely
   (8% WASH and 100% STROKE both render at the same hachure density) or
   inverts it (8% WASH hatched darker than the solid-fill region next to
   it). The mental model an artist holds — "hachure REPLACES a tonal region
   with parallel lines at density proportional to that region's darkness" —
   isn't reflected in the math.
2. **Modifier compounds blow out at the edges.** roughness × multi-stroke
   `heavy` × `long-overshoot` on a 40-px shape collapses the shape into
   visual noise. There is no compounding rule documented anywhere in code
   or spec.
3. **Modifiers are exposed in style chrome where they have no effect.**
   `roughness` slider is exposed under `wet-ink` and `charcoal` (in the
   universal chrome row) but doesn't drive output because those styles
   don't run the rough-family code path. The user sees a slider that does
   nothing.
4. **Defaults are silently inconsistent.** The DEFAULT in
   `F3RoughModifiersContext` is the rough-handdrawn baseline. When the
   user switches to `charcoal`, those defaults persist; the resulting
   render mixes the wrong calibration with the wrong style.

This doc fixes all four by writing the contract: (a) what each modifier means
semantically, (b) what math implements that meaning, (c) which modifiers apply
to which styles, (d) how modifiers interact when compounded, (e) what the
recommended defaults are.

---

## §1 · The semantic model

### §1.1 · Pen-and-ink shading conventions — the artist's mental model

Pen-and-ink shading techniques map a target tonal value (light → mid → dark)
to a SPATIAL DENSITY OF MARKS. The universal rule across every published
treatment is:

> **"Increase the density of your lines by placing them closer together or
> creating a second (or even third) layer overlapping the first in areas
> that you want to appear darker."**
> — *Erika Lancaster, Guide to Shading Techniques: Hatching, Cross-Hatching,
> Scribbling and Others*
> (https://www.erikalancaster.com/art-blog/guide-to-shading-techniques-hatching-cross-hatching-scribbling-and-others)

Two corollary rules are stated in every reference:

- **Crosshatching is multi-pass hatching.** "A second layer is drawn on top
  of the first in a perpendicular or nearly perpendicular direction"
  (Lancaster, op. cit.; corroborated by *Fiveable: Hatching and
  Cross-Hatching*, https://fiveable.me/drawing-foundations/unit-6/hatching-cross-hatching/study-guide/SBjr8djW1TCdGeXY,
  and *Craftsy: 6 Basic Forms of Hatching*,
  https://www.craftsy.com/post/hatching-and-cross-hatching). Each additional
  layer at a different angle DARKENS the region.
- **Stippling, tick hatching, scribbling all map density to dots / marks /
  lines per unit area.** The mark type changes; the rule stays: more marks
  per area = darker (Lancaster, op. cit.; Craftsy §6 "tick hatching").

### §1.2 · Three knobs that produce tonal darkness

Across the canonical techniques, **three knobs** independently control
output darkness:

| Knob | Mechanism | Bound for legibility |
|---|---|---|
| **Spacing (gap)** | Closer lines = darker. | Lower bound: gap ≈ line weight × 2 (below that, lines merge into a solid block — see Craftsy "fine crosshatching" remark on optical blending). Upper bound: shape's smaller dimension / 4 (a region needs at least ~4 hachure lines to read as shaded, per pen-and-ink practice). |
| **Weight (line thickness)** | Heavier lines = darker. | Bound: line weight ≤ 1/3 of gap, else region reads as solid (Craftsy: "lines pile on top of one another to create density" in tick hatching = anti-pattern when not intended). |
| **Passes (cross-hatch / layered hatch)** | More angled passes overlapping = darker. | Bound: 4 passes saturate (each successive pass adds diminishing visual darkness; 4-layer crosshatch is at the edge of "blended optical tone" per Craftsy §4 "fine crosshatching"). |

When an artist shades a real region, they pick ONE primary knob and use the
others sparingly:
- **Hachure (single-direction parallel lines):** density knob = SPACING.
- **Cross-hatch:** density knob = PASSES (2 perpendicular passes), spacing
  fixed; weight fixed.
- **Stippling:** density knob = DOTS PER AREA (= a different mechanism — a
  count, not a spacing).
- **Tick hatching:** density knob = MARK COUNT (similar to stippling but
  short lines instead of dots).

### §1.3 · The source SVG's tonal vocabulary

Hero-8-Lab's source SVGs (per `F3_B_TrophyWall_Path2.tsx` and sibling cells)
use **three named fill tokens** that map directly onto pen-and-ink tonal
regions:

| Token | CSS value | Tonal role | Density target |
|---|---|---|---|
| `STROKE` | `var(--dir-text-primary)` | **Dark** — fully inked region (e.g., the `pitchDeckCover` outer rect filled black; the band on `framedFlyer`). | Dense hachure, OR solid fill. |
| `WASH` | `color-mix(in oklab, var(--dir-text-primary) 8%, transparent)` | **Light** — gentle background wash inside ticket / patch / poster shells. | Very sparse hachure, OR no shading at all. |
| `BG` | `var(--dir-bg)` | **None / unshaded** — white-paper register, used for "inside" cutouts (e.g., the `cartShadowBox` inner cartridge body). | Zero shading. |

Other fills appear inline:
- `fill={STROKE}` on small accent rects (block text bars, dot eyes).
- `fill="transparent"` / `fill="none"` on dashed-line annotation rectangles.
- Direct hex / keyword fills (none observed in source so far, but the
  `fillDarknessFactor` function in `SvgStyleTransform.tsx` line 222 handles
  these defensively).

**This three-tier vocabulary IS the shading semantic.** The transform's
job is to translate this tonal vocabulary into the chosen rendering
TECHNIQUE while preserving tonal relationships.

### §1.4 · Why the current implementation breaks

The current `fillDarknessFactor` in `SvgStyleTransform.tsx` (line 221-238)
DOES read the source tonal value correctly (the math is right: it parses
`color-mix(... 8%, transparent)` and emits 0.08; it maps `--dir-text-primary`
to 1.0; etc.). What it does WRONG is how it uses that darkness:

```js
const darknessGapMul = 1 / Math.max(0.12, darkness);
const adaptedGap = m.hachureGap * sizeMul * darknessGapMul;
```

This means at `darkness = 1.0`, gap = base. At `darkness = 0.08` (the WASH),
gap = base / 0.08 = base × 12.5 — VERY sparse hachure. This is directionally
correct (lighter source → sparser hachure).

BUT it also does:

```js
const adaptedFillWeight = m.fillDensity * 2 * sizeDamp * Math.max(0.4, darkness);
```

The fill weight ALSO scales with darkness. So light areas get sparser AND
thinner lines. The artist's mental model is ONE knob carries the tonal
mapping, not both. When both scale down together, the light-area hachure
disappears entirely (8% wash → gap ×12.5 + weight × 0.4 = effectively
invisible). When both scale up together, the dark-area hachure becomes a
solid block (gap ×1 + weight ×1 = lines packed adjacent to each other).

The fix is in §4.

---

## §2 · Per-style inventory (11 styles)

Each style is a NAMED RENDERING REGISTER. For each, define what the artist is
"doing" and what code path it runs under in `SvgStyleTransform.tsx`.

The eleven styles are declared in
`apps/Hero-8-Lab/src/app/state/F3SvgStyleContext.tsx` lines 9-20.

### §2.1 · clean

**Semantic:** Source SVG as authored. The reference register.
**Artist mental model:** N/A — this is the *un-rendered* baseline, the source
asset itself.
**Code path:** CSS-only (`needsClone = false`, line 761). The original
`<svg>` renders unchanged; the wrapper applies opacity (`inkIntensity`) and
a CSS `fill-opacity` variable, plus optional texture filter.
**Modifiers that apply:** `inkIntensity`, `fillOpacity`, `paletteMode`
(via the CSS `[data-f3-stroke=...]` rules in `SvgStyleTransform.tsx` lines
810-827), `texture`, `textureIntensity`.
**Modifiers that don't:** every rough-family modifier (`roughness`, `bowing`,
etc.), every style-specific modifier (`grainIntensity`, `offsetDistance`,
etc.). The `clean` register is by definition un-stylized; modifiers that
mutate geometry have nothing to mutate against.

### §2.2 · outline-only

**Semantic:** Strip fills; keep strokes. Pure line-illustration register.
**Artist mental model:** "I'm going to look at just the contours, not the
masses." Equivalent to traditional line drawing (contour-only).
**Code path:** CSS-only. The CSS rule
`[data-svg-style="outline-only"] svg [fill]:not(text) { fill: transparent !important; }`
(line 798-800) does the work in CSS.
**Modifiers that apply:** `strokeWidth` (CSS-only, see line 805), `inkIntensity`,
`paletteMode`, `texture`, `textureIntensity`.
**Modifiers that don't:** anything fill-related (`fillOpacity`, `fillStyle`,
`hachureGap`, `hachureAngle`, `fillDensity`); rough-family geometry
modifiers (the source SVG isn't being re-rendered). Multi-stroke,
endpointBehavior, sketchingStyle, penTip — all silent.

### §2.3 · wireframe

**Semantic:** Schematic outline only. Strip fills + force a thinner stroke.
**Artist mental model:** "Show me the geometry, no aesthetics." Engineering
drawing register.
**Code path:** CSS-only. Two CSS rules (lines 801-806) strip fills and force
`stroke-width: 0.8 !important`.
**Modifiers that apply:** same as outline-only (`inkIntensity`, `paletteMode`,
`texture`, `textureIntensity`). Note `strokeWidth` is currently exposed
under wireframe but is OVERRIDDEN by the `!important` rule — **bug, see
§7.B-1**.
**Modifiers that don't:** every rough-family modifier; every fill-related
modifier.

### §2.4 · wet-ink

**Semantic:** Fountain-pen-on-absorbent-paper. Soft edges via Gaussian blur.
**Artist mental model:** "The ink bled slightly into the paper as I drew."
**Code path:** Dynamic SVG filter. `NEEDS_DOM_CLONE` includes `wet-ink`
(line 751); the clone gets `applyTexture(clone, m.texture, style, m)` which
builds a dynamic filter `hero8-dyn-wet-ink-<blurAmount>-<bleed>` (line 718,
recipe at lines 908-922). Filter chain: `feGaussianBlur` → `feTurbulence`
fractalNoise → `feDisplacementMap` → `feColorMatrix` (slight
desaturation by `bleed`).
**Modifiers that apply:** `blurAmount`, `bleed`, `inkIntensity`, `fillOpacity`,
`paletteMode`, `textureIntensity`.
**Modifiers that don't:** every rough-family modifier (no geometry change);
`strokeWidth` does not apply through the wet-ink filter path (the SVG paths
keep their authored stroke widths because the DOM-clone has no rough.js
transform invoked — see `applyRoughTransform` is gated on `isRoughFamilyStyle`,
line 772). Texture dropdown is silent for `wet-ink` (the dynamic filter
takes over; user-selected `texture` is overridden).

### §2.5 · charcoal

**Semantic:** Graphite on rough paper. Heavy edge break, optional smudge,
optional pressure variance.
**Artist mental model:** "I dragged a charcoal stick across the paper; it
caught the tooth of the page and the edges are ragged."
**Code path:** Dynamic SVG filter. Filter recipe at lines 889-905:
`feTurbulence` (baseFrequency tied to `grainIntensity` and `smudgeAmount`)
→ `feDisplacementMap` (scale tied to `grainIntensity + smudgeAmount + textureIntensity`)
→ optional second `feTurbulence` + `feDisplacementMap` (pressure variance,
gated on `pressureVariance > 0`).
**Modifiers that apply:** `grainIntensity`, `smudgeAmount`, `pressureVariance`,
`inkIntensity`, `fillOpacity`, `paletteMode`, `textureIntensity`.
**Modifiers that don't:** every rough-family modifier; the `texture` dropdown
is silent (charcoal has its own dynamic filter).

### §2.6 · newsprint

**Semantic:** Newspaper-print dot-pattern fill.
**Artist mental model:** "Halftoned for cheap reproduction."
**Code path:** Currently CSS-only with no fills processed (the
`MODIFIER_SETS_BY_STYLE[newsprint]` row lists `inkIntensity, fillOpacity,
paletteMode, texture, textureIntensity` only — line 133). **Bug:** the
preset (line 43) declares `dotSize: 1.2, dotSpacing: 4, dotPattern: 'staggered'`
but no dot-pattern code exists to consume them. See §7.B-2.
**Modifiers that should apply (after fix):** `dotSize`, `dotSpacing`,
`dotPattern`, `inkIntensity`, `fillOpacity`, `paletteMode`, `texture`,
`textureIntensity`.

### §2.7 · risograph

**Semantic:** Two-color offset printing. Each path duplicated, second layer
offset and color-shifted (mix-blend-mode multiply).
**Artist mental model:** "Cheap two-color print run, registration is slightly
off."
**Code path:** `applyRisographTransform` (lines 673-710). Clones each source
element into a `<g data-riso-layer="secondary">` group with translate
transform + multiply blend mode + opacity tied to `colorShift`.
**Modifiers that apply:** `offsetDistance`, `offsetAngle`, `colorShift`,
`registrationError`, `inkIntensity`, `fillOpacity`, `paletteMode`,
`texture`, `textureIntensity`.
**Modifiers that don't:** every rough-family modifier; the secondary layer
color is hardcoded (`#D4574A` if `colorShift > 0` else `--dir-text-body`,
line 696) — **bug, see §7.B-3** (user has no choice of secondary color).

### §2.8 · rough-handdrawn

**Semantic:** Multi-stroke jittered-Bezier hand-drawn pen line + hatched
shading. The flagship register.
**Artist mental model:** "I'm sketching this freehand with a pen; I drew the
outline twice slightly off; I'm hatching the shaded regions."
**Code path:** `applyRoughTransform` (lines 634-669). Dispatches each SVG
primitive (`rect`, `circle`, `ellipse`, `line`, `polygon`, `polyline`,
`path`) to `transformElement`, which builds jittered points via
`f3HandFeel` and renders via `renderHandFeelShape`.
**Modifiers that apply:** `roughness`, `bowing`, `strokeWidth`,
`curveTightness`, `multiStroke`, `endpointBehavior`, `sketchingStyle`,
`penTip`, `fillStyle`, `hachureGap`, `hachureAngle`, `fillDensity`,
`inkIntensity`, `fillOpacity`, `paletteMode` (via `strokePalette` +
`fillPalette`), `texture`, `textureIntensity`.
**Modifiers that don't:** style-specific knobs (`blurAmount`, `bleed`,
`dotSize`, etc.); `simplification` (rough.js only applies it to path
input — `transformElement`'s `<path>` branch passes it via
`buildRoughOptionsForPath` but **the current code never reads
`m.simplification`** — bug, see §7.B-4).

### §2.9 · sketchy

**Semantic:** Quick-draft rough register. Lower roughness, fewer strokes,
no fills.
**Artist mental model:** "Loose sketch; just the outline."
**Code path:** Same `applyRoughTransform` as `rough-handdrawn`. Preset
(line 46) zeroes `fillStyle: 'none'` and lowers roughness/bowing/strokeWidth.
**Modifiers that apply:** same as `rough-handdrawn` MINUS `fillStyle`,
`hachureGap`, `hachureAngle`, `fillDensity` (because `fillStyle = 'none'`
means no hachure path runs — see `isHachureFamily` check at line 320).
But the chrome row currently HIDES these only if `fillStyle === 'none'`
(lines 878-880). **Caveat:** if the user re-enables fill-style under
sketchy, the hachure params re-appear — which is correct behavior, but
the preset says "sketchy ≠ fills."

### §2.10 · bold-ink

**Semantic:** Heavy felt-tip register. Thick strokes, no jitter, solid fills.
**Artist mental model:** "Confident, deliberate marks; flat black masses."
**Code path:** Same `applyRoughTransform`. Preset (line 47) sets
`strokeWidth: 2.8, multiStroke: 'off', fillStyle: 'solid'`.
**Modifiers that apply:** `strokeWidth`, `bowing`, `curveTightness`,
`fillStyle`, `fillDensity`, `endpointBehavior`, `penTip`, `inkIntensity`,
`fillOpacity`, `paletteMode`, `texture`, `textureIntensity`.
**Modifiers that don't:** `roughness` (preset implies 0.6 baseline — low
jitter — but slider is still active in chrome; ok), `multiStroke` (preset
is `off`; the slider IS in `MODIFIER_SETS_BY_STYLE[bold-ink]` row absent —
correct hide); `hachureGap`/`hachureAngle` (only relevant for hachure-family
fills, which bold-ink's preset isn't using).

### §2.11 · stipple

**Semantic:** Dot-pattern fill. Pointillism register.
**Artist mental model:** "I'm filling this region with dots; density carries
tonal value."
**Code path:** Same `applyRoughTransform`. Preset (line 48) sets
`fillStyle: 'dots'`. The hachure code path in `renderHandFeelShape` lines
347-387 includes `dots` in `isHachureFamily`, so it goes through the same
rough.js `rc.path(dPath, fillOpts)` call. rough.js's built-in `dots`
fillStyle renders sketchy dots inside the closed shape.
**Modifiers that apply:** `roughness`, `bowing`, `strokeWidth`,
`curveTightness`, `multiStroke`, `endpointBehavior`, `sketchingStyle`,
`penTip`, `fillStyle` (default `dots`), `hachureGap` (acts as dot
spacing for rough.js's `dots`), `fillDensity`, `inkIntensity`,
`fillOpacity`, `paletteMode`, `texture`, `textureIntensity`.
**Modifiers that don't:** `hachureAngle` (rough.js's `dots` ignores angle
— **see §6.6 for why**); the locally-defined `dotSize` / `dotSpacing` /
`dotScatter` / `dotPattern` are preset values but **never consumed**
because rough.js's `dots` engine doesn't expose them — **bug, see
§7.B-5**.

---

## §3 · Per-modifier definition

Twenty-five modifiers, grouped by category. Each modifier table specifies
exact source citations.

### §3.1 · Geometry (rough-family only)

#### §3.1.1 · Roughness

| Field | Value |
|---|---|
| **Name** | Roughness |
| **Semantic** | How much the rendered geometry deviates from the source geometry. Equivalent of "how steady is my hand." |
| **Implementation math** | Two layers compound: (a) `f3HandFeel`'s per-vertex jitter, `corner + (rand-0.5) × 2 × ROUGH` where `ROUGH = HAND_FEEL_BASE.shape × m.roughness × clamp(bboxMin / 60)` (per `f3HandFeel.ts:73-108` and `SvgStyleTransform.ts:264-267`). (b) For `<path>` elements, rough.js's internal `roughness` parameter passed via `buildRoughOptionsForPath` (line 454, set to `m.roughness`). Per rough.js wiki, rough.js's roughness "0+" — multiplies internal random offsets. Reference: https://github.com/rough-stuff/rough/wiki under Options. |
| **Slider range** | 0 – 2, step 0.02 (per `SLIDER_SPECS.roughness`, Hero8Shell.tsx:101). Currently capped at 2; rough.js allows higher but playground caps at ~1.0 default. Recommendation: **keep 0-2 range.** Excalidraw warning zone begins above 1.4 (per playground `EXCALIDRAW_WARN_THRESHOLD = 1.4`, handFeel.ts:411). |
| **Recommended default** | **1.0** for rough-handdrawn (playground baseline; HAND_FEEL_BASE.rect = 2.4 × 1.0 = 2.4 jitter px = the playground's published calibration). Current Hero-8-Lab default of 1.6 (`F3RoughModifiersContext.ts:109`) is **higher than playground** — see §7.D for divergence note. |
| **Discrete/continuous** | Continuous (slider). |
| **Style applicability** | rough-handdrawn ✓ · sketchy ✓ · stipple ✓ · bold-ink ✓ (low default but exposed). Doesn't apply to clean / outline-only / wireframe / wet-ink / charcoal / newsprint / risograph (none invoke `applyRoughTransform`). |
| **Cross-modifier interactions** | (1) Multiplies HAND_FEEL_BASE per shape: rect/oval = 2.4, diamond = 2.0, line = 1.4, orthogonal = 1.6 (handFeel.ts:397-408). So a roughness slider of 1.0 puts a rectangle at 2.4 px jitter vs a line at 1.4 px. (2) Combined with `multiStroke ≥ double`, each layer adds independent jitter; at high roughness × many layers, the layered geometry FANS OUT visibly. **Clamp rule:** see §6.1. (3) `endpointBehavior` adds protrude OUTSIDE this jitter envelope; protrude is independent of roughness. |
| **Common bug patterns** | (a) Setting roughness too high on a small shape causes the jitter envelope to swamp the shape (60-px box at roughness 2.0 has ±4.8 px jitter on every vertex). The `effectiveRoughness` clamp at line 264 partially mitigates: `Math.min(userRoughness, bboxMin/60)`. (b) Confusing roughness with bowing — roughness affects VERTICES; bowing affects EDGE CURVATURE. |

#### §3.1.2 · Bowing

| Field | Value |
|---|---|
| **Name** | Bowing |
| **Semantic** | How much each edge curves between its two endpoints. Per rough.js wiki: "controls line curvature; 0 = straight lines." (https://github.com/rough-stuff/rough/wiki) |
| **Implementation math** | (a) For `<path>` elements: passed directly to rough.js as `bowing: m.bowing + endpointBowingNudge` (SvgStyleTransform.ts:455). The `endpointBowingNudge` adds 0.2/0.5/0.8 for protrude/long-overshoot/kink (line 446-451). (b) For rect/circle/line/polygon/polyline (the f3HandFeel path): `pointsToPolylinePath(pts, isClosed, m.bowing, m.curveTightness, seed)` (line 409). The polyline-to-Q-bezier conversion in `f3HandFeel.ts:330-356` uses `effectiveBow = bowing × (1 - curveTightness × 0.45)`, offset magnitude = `effectiveBow × segLen × 0.08 × sign(rand)`. |
| **Slider range** | 0 – 5, step 0.05 (`SLIDER_SPECS.bowing`). rough.js default = 1 (per wiki). Range is reasonable; recommend keeping. |
| **Recommended default** | **1.0** for rough-handdrawn (rough.js default; playground baseline). |
| **Discrete/continuous** | Continuous. |
| **Style applicability** | rough-handdrawn ✓ · sketchy ✓ · stipple ✓ · bold-ink ✓. Doesn't apply elsewhere. |
| **Cross-modifier interactions** | (1) Compounds with `endpointBowingNudge` from `endpointBehavior` — at `endpointBehavior=kink`, effective bowing on `<path>` elements = `m.bowing + 0.8`. (2) Dampened by `curveTightness` per the formula above — at `curveTightness=1.0`, effective bowing is halved. (3) When `penTip != 'plain'`, bowing has NO effect (line 396: pen-tip mode bypasses bowing/curveTightness because perfect-freehand generates its own polygon stroke). |
| **Common bug patterns** | (a) Setting bowing > 2 on a short edge (< 30px) produces visible C-curves; over-stylized. (b) User expects bowing to affect penTip-rendered shapes; it doesn't (silent — by design). |

#### §3.1.3 · Stroke width

| Field | Value |
|---|---|
| **Name** | Stroke width |
| **Semantic** | Line thickness of the outline stroke (or, in pen-tip mode, the base diameter of the perfect-freehand polygon). |
| **Implementation math** | (a) Plain mode: `m.strokeWidth × (i === 0 ? 1.25 : 1.0)` per layer (line 415). First layer is heavier so the multi-stroke "drawn-twice" reads as a primary plus ghosts. (b) Pen-tip mode: passed to `penTipPath(pts, m.penTip, m.strokeWidth, seed, ctx.bboxMin)` — perfect-freehand's `size = preset.size × m.strokeWidth × sizeScale × 2` (handFeel.ts:622, scaled by `sizeScale = clamp(bboxMin/140, 0.3, 1.0)` in f3HandFeel.ts:173). Per perfect-freehand docs (https://github.com/steveruizok/perfect-freehand): `size` = base diameter. |
| **Slider range** | 0.1 – 6, step 0.05 (`SLIDER_SPECS.strokeWidth`). |
| **Recommended default** | **1.0** for rough-handdrawn / clean / outline-only. **1.2** for sketchy. **2.8** for bold-ink. **0.8** for wireframe (hardcoded CSS override). |
| **Discrete/continuous** | Continuous. |
| **Style applicability** | Universal (every style uses it). For CSS-only styles (clean, outline-only), strokeWidth is set via inline SVG attributes from the source (the modifier has no effect unless the user adds a CSS rule to inject it — currently absent). **Hero-8-Lab inconsistency:** strokeWidth slider for `outline-only` is exposed in `MODIFIER_SETS_BY_STYLE[outline-only]` (line 129) but no CSS rule writes it through. See §7.B-6. |
| **Cross-modifier interactions** | (1) In pen-tip mode, multiplied by the preset's intrinsic size (ballpoint 1.6 / charcoal 3.2 etc., handFeel.ts:454-460). At `strokeWidth=2.0 + penTip=charcoal`, effective polygon size = 3.2 × 2.0 × bboxScale × 2 = up to ~12.8 px. **Cap recommended:** see §6.2. (2) Compounds with `fillWeight` for hachure — hachure lines should be visibly thinner than the outline (per §1.2 "weight ≤ 1/3 of gap"). |
| **Common bug patterns** | (a) At strokeWidth > 4 on a small shape, the multi-stroke layers visually merge into a single blob; multiStroke effectively becomes invisible. (b) The 1.25× multiplier on layer 0 creates an asymmetry; if a user wants TRULY EVEN multi-stroke, this code path doesn't honor it. |

#### §3.1.4 · Curve tightness

| Field | Value |
|---|---|
| **Name** | Curve |
| **Semantic** | Dampens bowing's effect; tighter curves = less visible bowing. |
| **Implementation math** | `tightnessDamp = max(0.1, 1 - curveTightness × 0.45)` (f3HandFeel.ts:334). `effectiveBow = bowing × tightnessDamp`. At `curveTightness=0`, no effect; at `curveTightness=2.0`, damp = max(0.1, 1-0.9) = 0.1 — bowing is 10× attenuated. Per rough.js wiki: `curveFitting` = "Rendering accuracy vs. specified dimensions; range 0-1" (https://github.com/rough-stuff/rough/wiki). Note: rough.js's parameter is `curveFitting`, semantically different from our `curveTightness`. **The Hero-8-Lab implementation uses curveTightness LOCALLY (as a bowing dampener); rough.js's own `curveTightness` is different (per wiki: "curveTightness" — a separate option for path-input simplification). The two have the same name but different semantics in our codebase.** See §7.B-7 for the divergence. |
| **Slider range** | 0 – 2, step 0.02 (`SLIDER_SPECS.curveTightness`). |
| **Recommended default** | **0** for all styles (default = "bowing isn't dampened"). |
| **Discrete/continuous** | Continuous. |
| **Style applicability** | rough-handdrawn ✓ · sketchy ✓ · stipple ✓ · bold-ink ✓. |
| **Cross-modifier interactions** | (1) Direct multiplier on bowing's effective magnitude. (2) Like bowing, has no effect in pen-tip mode. |
| **Common bug patterns** | (a) User confuses curveTightness with rough.js's wiki-documented `curveTightness` (different math). (b) Setting curveTightness > 0.5 on bowing=1.0 effectively eliminates bowing's visible effect. |

#### §3.1.5 · Simplification

| Field | Value |
|---|---|
| **Name** | Simplification |
| **Semantic** | Per rough.js wiki: "Path point reduction factor; 0 = none, 1 = full reduction." (https://github.com/rough-stuff/rough/wiki). Only meaningful for path-based input (the `<path>` branch of `transformElement`). |
| **Implementation math** | `buildRoughOptionsForPath` (line 437-474) does NOT pass `simplification` to rough.js. **Bug — see §7.B-4.** Should be `opts.simplification = m.simplification`. |
| **Slider range** | 0 – 1, step 0.02 (recommended). Currently `simplification` is in `F3ModifiersState` type (line 64) but NOT in `SLIDER_SPECS` (Hero8Shell.tsx:100-123). Add to SLIDER_SPECS. |
| **Recommended default** | **0** (= no simplification). |
| **Discrete/continuous** | Continuous. |
| **Style applicability** | Only useful for the `<path>` branch (paths with many segments). In Hero-8-Lab's source SVGs (per F3_B_TrophyWall_Path2.tsx), paths are short (e.g., `<path d="M 8 14 Q 8 8 14 8 ...">` band-patch outline). At simplification > 0.3 these short paths collapse visibly. **Recommendation: keep modifier wired but hide from chrome unless the user's source SVG has long paths.** |
| **Cross-modifier interactions** | None. |
| **Common bug patterns** | (a) Currently exposed in type but not in chrome — confusing dead state. (b) When wired (per fix), high simplification on short paths breaks shape recognition. |

### §3.2 · Multi-stroke + sketching style

#### §3.2.1 · Multi-stroke

| Field | Value |
|---|---|
| **Name** | Multi-stroke |
| **Semantic** | Number of layered outline passes (the "drawn twice" effect). |
| **Implementation math** | `multiStrokeMeta` (line 61-72) maps step → layerCount: off=0, single=1, double=2, triple=3, quad=4, quint=5, six=6, heavy=8. Then `effectiveLayerCount(ms.layerCount, ctx.bboxMin) = min(userLayers, max(1, ceil(bboxMin/30)))` (line 257). So a 60-px shape caps at 2 layers; a 90-px shape caps at 3; a 240-px shape allows all 8. |
| **Slider range** | Discrete dropdown, 8 values. |
| **Recommended default** | **`double`** for rough-handdrawn (= 2 layers; matches playground's `strokeCount: 2` default). **`single`** for sketchy. **`off`** for bold-ink (preset; strokes are confident, no ghosts). |
| **Discrete/continuous** | Discrete. |
| **Style applicability** | rough-handdrawn ✓ · sketchy ✓ · stipple ✓. NOT in bold-ink's MODIFIER_SETS_BY_STYLE row (line 137) — correctly hidden. |
| **Cross-modifier interactions** | (1) **Layer count × roughness:** at high roughness × many layers, points fan out chaotically. Clamp via `effectiveLayerCount`. (2) **Layer count × strokeWidth:** layer 0 renders at 1.25 × strokeWidth, layers 1+ at 1.0 × strokeWidth. (3) **Layer count × penTip:** each layer is a separate perfect-freehand polygon; at penTip=charcoal × 8 layers, render cost is high (8 × ~200-vertex polygons). |
| **Common bug patterns** | (a) "Heavy" (8 layers) is overkill at default roughness; the layers stack on near-identical jittered geometry and read as a single thick line. (b) User picks `multiStroke=heavy` expecting more ROUGHNESS, but multi-stroke and roughness are orthogonal axes. |

#### §3.2.2 · Endpoint behavior

| Field | Value |
|---|---|
| **Name** | Endpoint behavior |
| **Semantic** | What happens at the corners / line endpoints. "Did my pen overshoot when I drew the corner?" |
| **Implementation math** | Per playground convention (handFeel.ts:42-57): `clean` = no overshoot. `protrude` = corners pushed outward by `PROTRUDE_AMOUNT` (playground: 4 px; Hero-8-Lab: `PROTRUDE_LOCAL = 2 px`, f3HandFeel.ts:57). `long-overshoot` = `LONG_OVERSHOOT_AMOUNT` (playground 9 / Hero-8-Lab 4.5). `kink` = `KINK_AMOUNT` outward at randomized angle (playground 5 / Hero-8-Lab 2.5). Hero-8-Lab additionally scales by `protrudeScale = clamp(bboxMin/140, 0.25, 1.0)` (line 199-201). |
| **Slider range** | Discrete dropdown, 4 values. |
| **Recommended default** | **`clean`** for all rough-family styles. Playground default = clean (handFeel.ts:282). |
| **Discrete/continuous** | Discrete. |
| **Style applicability** | rough-handdrawn ✓ · sketchy ✓ · stipple ✓ · bold-ink ✓ (preset shows it can apply). |
| **Cross-modifier interactions** | (1) Adds to `endpointBowingNudge` for `<path>` elements: protrude=+0.2, long-overshoot=+0.5, kink=+0.8 bowing (line 446-451). (2) Cap at bboxMin/140 means very small shapes (< 35 px) get a small fraction of the protrude amount. (3) Compounds with `multiStroke`: each layer gets the same protrude, so an 8-layer kink renders 8 kinks fanning out per corner. **Clamp rule:** see §6.4. |
| **Common bug patterns** | (a) Hero-8-Lab divergence from playground: half-magnitude protrudes (per f3HandFeel.ts:55-59 comment). This is sanctioned — playground shapes are 300-500 px, Hero-8-Lab shapes are 60-100 px. (b) `kink` on a small shape (< 40 px) reads as "broken corner" not "human kink." |

#### §3.2.3 · Sketching style

| Field | Value |
|---|---|
| **Name** | Sketching style |
| **Semantic** | Pacing / layering style of multi-stroke layers. Per playground (handFeel.ts:46-49) and Hero-8-Lab F3RoughModifiersContext.ts:43-44: `single-pass` = layers on same geometry, `loose-overlap` = each layer offset along segment direction, `parallel-pass` = each layer offset perpendicular ("ghost outlines"), `cross-hatch` = rotates each layer ±6° around centroid. |
| **Implementation math** | `single-pass` = no transform (default). `loose-overlap` = `parallelPassTranslateFor(i)` translates (playground translates 5 px in alternating diagonal patterns, handFeel.ts:113-125). `parallel-pass` for closed = `scalePointsAround(pts, cx, cy, parallelPassScaleFor(i))` where scale = `1 + i × 0.06` (handFeel.ts:107) — each layer 6% larger; for open lines = `offsetLinePerpendicular(points, i)` (handFeel.ts:131-151) where layer i offsets ±i × 6 px perpendicular. `cross-hatch` = `rotatePointsAround(pts, cx, cy, ±6° × ceil(i/2))` (handFeel.ts:79-88). |
| **Slider range** | Discrete dropdown, 4 values. |
| **Recommended default** | **`single-pass`** for rough-handdrawn and all rough-family. |
| **Discrete/continuous** | Discrete. |
| **Style applicability** | rough-handdrawn ✓ · sketchy ✓ · stipple ✓. |
| **Cross-modifier interactions** | (1) **Only meaningful at `multiStroke ≥ double`.** At `multiStroke=off` or `single`, sketching style has no observable effect (one layer means no spread between layers). **Recommendation:** hide sketching-style dropdown when multiStroke < 2 — see §6.3. (2) `cross-hatch` here is the *outline* cross-hatch (rotating multi-stroke layers); NOT to be confused with `fillStyle=cross-hatch` (rough.js's hachure-fill cross-hatching). The names collide; see §7.B-8 and §6.6. |
| **Common bug patterns** | (a) Confusion with `fillStyle=cross-hatch`. (b) `parallel-pass` on a shape at default roughness produces near-invisible offset (1.06× scale on a 60-px shape = 3.6 px expansion; doesn't read at hero scale). |

#### §3.2.4 · Pen tip

| Field | Value |
|---|---|
| **Name** | Pen tip |
| **Semantic** | Stroke profile — variable-width pencil / marker / charcoal vs. uniform vector stroke. |
| **Implementation math** | When `penTip != 'plain'`: each layer's jittered points are fed through perfect-freehand's `getStroke(pressured, options)` (handFeel.ts:622) with options derived from `PEN_TIP_PRESETS[preset]` (handFeel.ts:451-461). The returned polygon is rendered as `<path fill=strokeColor stroke="none">`. When `penTip = 'plain'`: layers render as `<path stroke=strokeColor>` polylines. Per perfect-freehand types.ts: `size = base diameter, thinning ∈ [-1,1] (pressure→width sensitivity), smoothing ∈ [0,1], streamline ∈ [0,1], start/end = { cap, taper, easing }` (https://github.com/steveruizok/perfect-freehand/blob/main/packages/perfect-freehand/src/types.ts). |
| **Slider range** | Discrete dropdown, 8 values (plain + 7 presets). |
| **Recommended default** | **`plain`** for all rough-family styles. The presets are opt-in. |
| **Discrete/continuous** | Discrete. |
| **Style applicability** | rough-handdrawn ✓ · sketchy ✓ · stipple ✓ · bold-ink ✓. |
| **Cross-modifier interactions** | (1) **bowing + curveTightness are silenced when penTip != 'plain'** (line 396 comment). User-visible: if user is on `penTip=ballpoint` and slides bowing, nothing changes. **Recommendation:** disable bowing/curveTightness sliders (visually grey them out) when penTip != 'plain'. (2) `strokeWidth` multiplies preset size — see §3.1.3. (3) `multiStroke` layers each become independent perfect-freehand polygons; high cost at heavy×charcoal. |
| **Common bug patterns** | (a) Bowing slider does nothing when pen-tip is active (silent fail; user thinks slider is broken). (b) Charcoal preset on tiny shapes renders as a blob (size 3.2 × 1.0 × 2 = 6.4 px diameter; on a 40-px shape, the stroke is 16% of the shape's width). The `bboxMin/140` size scale in f3HandFeel.ts:173 partially mitigates. |

### §3.3 · Fill (hachure family) — see §4 for the full shading spec

#### §3.3.1 · Fill style

| Field | Value |
|---|---|
| **Name** | Fill style |
| **Semantic** | What SHADING TECHNIQUE replaces solid tonal fills. Per rough.js wiki (https://github.com/rough-stuff/rough/wiki#fillStyle): 7 values shipped in v4. |
| **Implementation math** | Per `isHachureFamily` (line 320): hachure / cross-hatch / dots / zigzag / dashed / zigzag-line all enter the hachure render path (lines 347-387) via `rc.path(dPath, fillOpts)` with `fillStyle: m.fillStyle`. `solid` and `none` skip the hachure path. rough.js's own implementations (per shihn.ca / rough wiki): `hachure` = parallel jittered lines at `hachureAngle`, gap `hachureGap`; `cross-hatch` = two hachure passes at `hachureAngle` and `hachureAngle+90°`; `dots` = sketchy dot field, ignores angle; `zigzag` = continuous zigzag fill; `dashed` = hachure with dashes (`dashGap` / `dashOffset`); `zigzag-line` = hachure where each line is itself a zig-zag (`zigzagOffset`). |
| **Slider range** | Discrete dropdown, 8 values: none / solid / hachure / cross-hatch / dots / zigzag / dashed / zigzag-line. |
| **Recommended default** | **`hachure`** for rough-handdrawn (preset line 45). **`solid`** for bold-ink (preset line 47). **`dots`** for stipple (preset line 48). **`none`** for sketchy (preset line 46). |
| **Discrete/continuous** | Discrete. |
| **Style applicability** | rough-handdrawn ✓ (full set) · stipple ✓ (default `dots`) · bold-ink ✓ (default `solid`) · sketchy ✗ (preset `none` but slider is in chrome — see line 138 absence). |
| **Cross-modifier interactions** | See §4 in full. Briefly: `hachureGap` is meaningful for hachure/cross-hatch/dashed/zigzag-line/zigzag. `hachureAngle` is meaningful for hachure/cross-hatch (and dashed/zigzag-line which inherit angle). `dots` ignores angle. `fillDensity` scales fillWeight for all. |
| **Common bug patterns** | (a) See §1.4 — hachure density doesn't match source darkness. The fix is in §4. (b) `dots` ignores hachureAngle but the slider is still visible in chrome — see §7.B-9. |

#### §3.3.2 · Hachure gap

| Field | Value |
|---|---|
| **Name** | Hachure gap |
| **Semantic** | Spacing between parallel hachure lines (in pixels), at the SOURCE side of the §4 darkness mapping. |
| **Implementation math** | Currently: `adaptedGap = m.hachureGap × sizeMul × darknessGapMul` where `sizeMul = max(1, 80/bboxMin)` and `darknessGapMul = 1/max(0.12, darkness)`. So at source darkness 1.0, gap = base × sizeMul. At darkness 0.08, gap = base × sizeMul × 12.5 — **way too sparse**. See §4 for the corrected math. |
| **Slider range** | 0.5 – 20, step 0.25 (`SLIDER_SPECS.hachureGap`). Per rough.js wiki default = 4 × strokeWidth ≈ 4 px at default stroke. Range is reasonable. |
| **Recommended default** | **4** (matches rough.js default × 1px stroke, per wiki). Hero-8-Lab default 4 matches. |
| **Discrete/continuous** | Continuous (slider). |
| **Style applicability** | hachure ✓ · cross-hatch ✓ · dashed ✓ · zigzag-line ✓ · zigzag ✓. Per chrome (line 878): also conditionally exposed for dots — **bug**, see §7.B-9 (dots uses spacing internally but rough.js's dots ignores `hachureGap` directly; needs verification). |
| **Cross-modifier interactions** | See §4. Compounds with source darkness and bboxMin via the darkness-gap multiplier. |
| **Common bug patterns** | (a) Setting hachureGap < 1 produces lines so dense they read as solid fill — defeating the hachure register. (b) Per §4, current darkness-gap mapping is wrong direction at one of the endpoints. |

#### §3.3.3 · Hachure angle

| Field | Value |
|---|---|
| **Name** | Hachure angle |
| **Semantic** | Angle of hachure lines in degrees. Per rough.js wiki: default −41° (sketchy oblique). |
| **Implementation math** | Passed directly to rough.js as `hachureAngle: m.hachureAngle` (line 372). rough.js internally uses this as the parallel-line angle. For cross-hatch, rough.js renders two passes: one at the user's angle, one at `userAngle + 90°` (per shihn.ca rough.js algorithm write-up). |
| **Slider range** | -90 to 90, step 1 (`SLIDER_SPECS.hachureAngle`). |
| **Recommended default** | **-41** (rough.js default; matches the wiki and the rough-handdrawn preset). |
| **Discrete/continuous** | Continuous. |
| **Style applicability** | hachure ✓ · cross-hatch ✓ (drives both passes via the +90° offset). **NOT applicable to dots** — see §6.6. The current chrome correctly hides hachureAngle when fillStyle is not hachure or cross-hatch (line 879). |
| **Cross-modifier interactions** | At `fillStyle=cross-hatch` × shape with steep aspect ratio, the +90° second pass aligns with the long axis — both passes look like one denser hachure rather than perpendicular hatching. This is rough.js's geometry, not a Hero-8-Lab bug. |
| **Common bug patterns** | (a) Setting angle = 0 produces horizontal hachure that can read as scan-lines on small shapes. (b) Setting angle = 45 + cross-hatch produces a perfect "X" grid which reads as a pattern, not as shading. |

#### §3.3.4 · Fill density

| Field | Value |
|---|---|
| **Name** | Fill density |
| **Semantic** | Modulates hachure line WEIGHT (thickness), at the SOURCE side of the §4 darkness mapping. Currently the math compounds with source darkness; this is **wrong** per §1.2 (the artist's primary density knob is spacing, not weight; weight is a secondary axis). |
| **Implementation math** | Currently: `adaptedFillWeight = m.fillDensity × 2 × sizeDamp × max(0.4, darkness)` (line 365). User's `fillDensity` slider directly multiplies; then the source darkness scales the result. Per rough.js wiki, `fillWeight` default = strokeWidth/2. Our default for fillDensity = 0.7 → fillWeight = 1.4 × sizeDamp × darknessFactor. |
| **Slider range** | 0 – 1.5, step 0.02 (`SLIDER_SPECS.fillDensity`). |
| **Recommended default** | **0.7** for rough-handdrawn (Hero-8-Lab default, matches the preset; produces fillWeight ≈ 1.4 px at full source darkness — slightly thinner than the typical outline stroke at strokeWidth=1.2). |
| **Discrete/continuous** | Continuous. |
| **Style applicability** | Any fillStyle ≠ none. Chrome currently exposes correctly (line 880: `mods.fillStyle !== 'none'`). |
| **Cross-modifier interactions** | See §4 for the proper density mapping. The fix: density should control PRIMARY axis (spacing) for hachure / cross-hatch; weight is secondary. For dots, density should control DOT COUNT (= dot spacing inverse). For zigzag, density should control zigzag AMPLITUDE / SPACING. |
| **Common bug patterns** | (a) User cranks fill-density expecting denser hachure; gets thicker lines instead. The density mental model doesn't match the math. (b) At fillDensity > 1.0, fillWeight > 2 px competing with outline strokeWidth — hachure reads heavier than the outline. |

### §3.4 · Texture (filter family)

#### §3.4.1 · Texture

| Field | Value |
|---|---|
| **Name** | Texture |
| **Semantic** | Edge-grain register applied as an SVG filter (feTurbulence + feDisplacementMap). The grain RIDES on top of the geometry; it does not replace geometry. Per playground research doc (gate-a-ion-texture-and-pen-tip-research.md §2.1, §3): "additive grain only — geometry already hand-drawn at the rough.js layer." |
| **Implementation math** | `TEXTURE_RECIPES` (SvgStyleTransform.ts:839-857) defines for each texture: `type` (fractalNoise vs turbulence), `baseFrequency` (cycles per px), `numOctaves`, `seed`, `baseScale` (px of feDisplacementMap displacement), `margin` (filter region inflation %), optional `blur` (feGaussianBlur stdDeviation). At render: `effectiveScale = baseScale × m.textureIntensity`. Per MDN (https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feTurbulence): baseFrequency in 1/px; numOctaves typical 1-6; seed integer. |
| **Slider range** | Discrete dropdown, 10 values: none / light / heavy / chalky / paper-tooth / ribbed / stipple / wet-ink / smudge / canvas. |
| **Recommended default** | **`none`** for all styles. Per-style preset overrides: rough-handdrawn → `paper-tooth`, sketchy → `light`, charcoal → handled by charcoal-specific dynamic filter (texture dropdown silenced), wet-ink → handled by wet-ink-specific dynamic filter. |
| **Discrete/continuous** | Discrete. |
| **Style applicability** | Universal in principle. **However:** for `charcoal` and `wet-ink`, the dynamic filter takes precedence (per `buildDynamicFilterId` line 714-725). User's `texture` selection is silent under those two styles — **see §7.B-10.** |
| **Cross-modifier interactions** | (1) `textureIntensity` multiplies the effective scale. (2) For wet-ink and charcoal, the texture dropdown is ignored. (3) The texture filter applies to the WHOLE SVG content (not per-element); it's a single `filter=url(...)` on the `<svg>` root. |
| **Common bug patterns** | (a) Setting texture under charcoal/wet-ink does nothing (silent fail). (b) High `textureIntensity` (> 2) with `chalky` / `smudge` displaces shapes far enough that they visually break apart. |

#### §3.4.2 · Texture intensity

| Field | Value |
|---|---|
| **Name** | Texture intensity |
| **Semantic** | Multiplier on the active texture's `feDisplacementMap.scale`. |
| **Implementation math** | `effectiveScale = recipe.baseScale × m.textureIntensity` (line 885). |
| **Slider range** | 0 – 2.5, step 0.05 (`SLIDER_SPECS.textureIntensity`). Type declares 0–3 (line 87) — minor mismatch; recommend bumping slider max to 3. |
| **Recommended default** | **1.0** (= baseScale baseline). |
| **Discrete/continuous** | Continuous. |
| **Style applicability** | Active whenever `m.texture !== 'none'` OR when style is charcoal / wet-ink (those filters also consume `textureIntensity`, lines 898 and 917). Chrome correctly conditions on `mods.texture !== 'none'` (line 912) — **bug** for charcoal/wet-ink which have their own scale axes; see §7.B-11. |
| **Cross-modifier interactions** | See §3.4.1. |
| **Common bug patterns** | (a) At intensity 0, texture is effectively off but the filter is still applied (zero cost, but the filter region inflation still applies). |

#### §3.4.3 · Blur amount (wet-ink only)

| Field | Value |
|---|---|
| **Name** | Blur amount |
| **Semantic** | feGaussianBlur stdDeviation for the wet-ink filter — softness of ink edges. |
| **Implementation math** | `stdDeviation = m.blurAmount × m.textureIntensity` (line 909). MDN feGaussianBlur: stdDeviation in user-space units, typical 0-5 for visible effect. |
| **Slider range** | 0 – 3, step 0.05 (`SLIDER_SPECS.blurAmount`). |
| **Recommended default** | **0.4** (matches wet-ink preset). |
| **Discrete/continuous** | Continuous. |
| **Style applicability** | wet-ink only. Chrome correctly conditions via `MODIFIER_SETS_BY_STYLE[wet-ink]` row (line 131). |
| **Cross-modifier interactions** | At blur > 1.5, fine details (thin strokes, small text) blur into the surrounding area; legibility drops. |
| **Common bug patterns** | (a) Setting blur > 2 on small shapes washes them out entirely. |

#### §3.4.4 · Bleed (wet-ink only)

| Field | Value |
|---|---|
| **Name** | Bleed |
| **Semantic** | Per playground research (§5.5): wet-ink saturation drop — the ink visibly spreads/desaturates at edges. |
| **Implementation math** | (a) feTurbulence baseFrequency = `0.04 + bleed × 0.08` (line 913). (b) feDisplacementMap scale = `0.8 + bleed × 2.5` (line 917). (c) feColorMatrix alpha = `1 - bleed × 0.3` (line 920). Three combined effects. |
| **Slider range** | 0 – 1, step 0.02 (`SLIDER_SPECS.bleed`). |
| **Recommended default** | **0** (matches wet-ink baseline; bleed is opt-in). |
| **Discrete/continuous** | Continuous. |
| **Style applicability** | wet-ink only. |
| **Cross-modifier interactions** | At bleed > 0.5 + textureIntensity > 1, the displacement scale gets very high (e.g., bleed=0.7 × intensity=2 → effective scale = (0.8 + 1.75) × 2 = 5.1 px); shapes warp visibly. |
| **Common bug patterns** | (a) User expects bleed to ONLY affect saturation; doesn't realize it also affects displacement amount. |

#### §3.4.5 · Grain intensity (charcoal only)

| Field | Value |
|---|---|
| **Name** | Grain |
| **Semantic** | Per playground convention (§5.7): heavy charcoal grain = high-frequency ragged edge. |
| **Implementation math** | feTurbulence baseFrequency = `0.03 + grain × 0.02` per axis (line 893). feDisplacementMap scale contribution: `1.5 + grain × 1.0` (line 898). |
| **Slider range** | 0 – 3, step 0.05 (`SLIDER_SPECS.grainIntensity`). |
| **Recommended default** | **2.5** (matches charcoal preset). |
| **Discrete/continuous** | Continuous. |
| **Style applicability** | charcoal only. |
| **Cross-modifier interactions** | Compounds with `smudgeAmount` and `pressureVariance` in the scale formula. |
| **Common bug patterns** | (a) At grain > 2.5, edge break exceeds 4 px and visibly fragments strokes. |

#### §3.4.6 · Smudge amount (charcoal only)

| Field | Value |
|---|---|
| **Name** | Smudge |
| **Semantic** | Asymmetric vertical-bias displacement — reads as "rubbed sideways." |
| **Implementation math** | feTurbulence Y-axis baseFrequency = baseFreq + smudge × 0.05 (line 893; the second component of the `baseFrequency="X Y"` two-value form). Scale contribution: `+ smudge × 1.5`. |
| **Slider range** | 0 – 3, step 0.05 (`SLIDER_SPECS.smudgeAmount`). |
| **Recommended default** | **0** (no smudge baseline; opt-in). |
| **Discrete/continuous** | Continuous. |
| **Style applicability** | charcoal only. |
| **Cross-modifier interactions** | Compounds with grain in the scale formula. |
| **Common bug patterns** | (a) At smudge > 2 on small shapes, vertical displacement exceeds 3 px and visibly drags the shape. |

#### §3.4.7 · Pressure variance (charcoal only)

| Field | Value |
|---|---|
| **Name** | Pressure var |
| **Semantic** | Per playground convention (§5.7 / §3): an additional displacement pass driven by a high-frequency turbulence layer — simulates pencil pressure varying along a stroke. |
| **Implementation math** | Second feTurbulence + feDisplacementMap chain gated on `pressureVariance > 0` (lines 899-903). baseFrequency = `0.4 + pressure × 0.3`, scale = `pressure × 3 × textureIntensity`. |
| **Slider range** | 0 – 1, step 0.02 (`SLIDER_SPECS.pressureVariance`). |
| **Recommended default** | **0** (off). |
| **Discrete/continuous** | Continuous. |
| **Style applicability** | charcoal only. |
| **Cross-modifier interactions** | Compounds via the cascaded filter (the second feDisplacementMap operates on the already-displaced output). |
| **Common bug patterns** | (a) The cascade can over-displace: at pressureVariance=1 × textureIntensity=2, the second pass scales 6 px on top of the first pass's already-displaced output. |

### §3.5 · Risograph-specific

#### §3.5.1 · Offset distance

| Field | Value |
|---|---|
| **Name** | Offset distance |
| **Semantic** | How far the secondary color layer translates from the primary. Print-registration offset distance. |
| **Implementation math** | `dx = offsetDistance × cos(offsetAngle)`, `dy = offsetDistance × sin(offsetAngle)` (line 685-687). Then `+ rand × registrationError` per axis (line 688-689). |
| **Slider range** | 0 – 12, step 0.25 (`SLIDER_SPECS.offsetDistance`). |
| **Recommended default** | **2** (matches risograph preset; subtle but visible at hero scale). |
| **Discrete/continuous** | Continuous. |
| **Style applicability** | risograph only. |

#### §3.5.2 · Offset angle

| Field | Value |
|---|---|
| **Name** | Offset angle |
| **Semantic** | Direction of the secondary-layer offset. |
| **Implementation math** | Angle in degrees, converted to radians (line 685). |
| **Slider range** | -180 – 180, step 1. |
| **Recommended default** | **45** (matches preset; diagonal print-registration look). |

#### §3.5.3 · Color shift

| Field | Value |
|---|---|
| **Name** | Color shift |
| **Semantic** | Per playground convention: saturation/opacity of the secondary color layer (how visible the offset is). |
| **Implementation math** | `secondary.style.opacity = colorShift` (line 694). Also gates the secondary color choice: if `colorShift > 0`, secondary = `#D4574A`; else secondary = `--dir-text-body` (line 696). |
| **Slider range** | 0 – 1, step 0.02. |
| **Recommended default** | **0.7** (matches preset). |
| **Common bug patterns** | (a) Secondary color is hardcoded; user has no control. **See §7.B-3.** |

#### §3.5.4 · Registration error

| Field | Value |
|---|---|
| **Name** | Reg. error |
| **Semantic** | Random per-render variance in the secondary-layer offset — simulates imprecise print registration. |
| **Implementation math** | `±rand × registrationError` added to dx/dy (line 688-689). **Bug:** uses `Math.random()` not seeded — non-deterministic across renders. **See §7.B-12.** |
| **Slider range** | 0 – 3, step 0.05. |
| **Recommended default** | **0** (deterministic). |

### §3.6 · Stipple / newsprint dot params

#### §3.6.1 · Dot size

| Field | Value |
|---|---|
| **Name** | Dot size |
| **Semantic** | Diameter of stipple/newsprint dots. |
| **Implementation math** | Currently in state but **never consumed** — see §7.B-5. Stipple's fillStyle=dots uses rough.js's internal dot sizing (driven by `fillWeight`, not `dotSize`). |
| **Slider range** | 0.3 – 6, step 0.1. |
| **Recommended default** | **1.0** (matches stipple preset; needs a real consumer to validate). |

#### §3.6.2 · Dot spacing

| Field | Value |
|---|---|
| **Name** | Dot spacing |
| **Semantic** | Px between dots. |
| **Implementation math** | Currently unconsumed. Stipple's fillStyle=dots uses `hachureGap` as the spacing axis (rough.js convention). |
| **Slider range** | 1 – 20, step 0.25. |
| **Recommended default** | **3** for stipple (matches preset). |

#### §3.6.3 · Dot scatter

| Field | Value |
|---|---|
| **Name** | Dot scatter |
| **Semantic** | Random offset of each dot from its grid position. |
| **Implementation math** | Currently unconsumed. |
| **Slider range** | 0 – 1, step 0.02. |
| **Recommended default** | **0.3** (matches preset). |

#### §3.6.4 · Dot pattern

| Field | Value |
|---|---|
| **Name** | Dot pattern |
| **Semantic** | grid / staggered / random / concentric — different lattice layouts. |
| **Implementation math** | Currently unconsumed. Newsprint preset declares `dotPattern: 'staggered'` (line 43) — but newsprint has no code path implementing dot rendering. **See §7.B-2.** |

### §3.7 · Universal

#### §3.7.1 · Ink intensity

| Field | Value |
|---|---|
| **Name** | Ink intensity |
| **Semantic** | Global opacity multiplier on the entire transformed SVG. "How saturated is my ink." |
| **Implementation math** | Applied as `opacity: m.inkIntensity` on the wrapper div (line 783). |
| **Slider range** | 0 – 1, step 0.01. |
| **Recommended default** | **1.0** (fully opaque). |
| **Style applicability** | Universal. |

#### §3.7.2 · Fill opacity

| Field | Value |
|---|---|
| **Name** | Fill opacity |
| **Semantic** | Opacity of FILLED REGIONS only (not strokes). Lets the user fade out fills while preserving outlines. |
| **Implementation math** | (a) Applied as a CSS custom property `--f3-fill-opacity` consumed by the `[data-f3-stroke] svg [fill]:not(text)` rule (line 784, 807). (b) For hachure renders (which output as `fill="none"` + stroke), the post-process at line 658-668 maps it to `stroke-opacity` on the hachure paths. (c) For base paper-fill paths (line 333), applied as `fill-opacity` attribute. |
| **Slider range** | 0 – 1, step 0.01. |
| **Recommended default** | **1.0**. Preset overrides: outline-only / wireframe → 0; risograph → 0.7. |
| **Style applicability** | Universal. Note: at 0, behaves like outline-only. |

#### §3.7.3 · Stroke palette / Fill palette

| Field | Value |
|---|---|
| **Name** | Stroke palette / Fill palette |
| **Semantic** | Override the source SVG's stroke color / fill color with a chosen W1 token. Preserves color-mix transparency wrappers (so an 8% WASH stays 8% under any palette). |
| **Implementation math** | `mapPaletteColor(originalColor, palette)` (line 106-122). 'source' = passthrough. Otherwise: if color-mix(...), swap the inner var(); else swap the whole token. |
| **Slider range** | Discrete dropdown: source / primary / body / body-soft / secondary / detail / accent / bg / neutral / inverted. |
| **Recommended default** | **`source`** for both. |
| **Style applicability** | Universal (rough-family uses `mapPaletteColor` in `renderHandFeelShape`; CSS-only styles use the `[data-f3-stroke]` / `[data-f3-fill]` CSS rules at line 810-827). |
| **Cross-modifier interactions** | (1) The legacy `paletteMode` field still exists but is **unused** in render code; only `strokePalette` and `fillPalette` matter. **See §7.B-13.** (2) Palette swaps preserve color-mix percentage — so an 8% WASH on a primary-ink source becomes an 8% WASH on the chosen palette. This is correct behavior per §1.3. |
| **Common bug patterns** | (a) User picks `strokePalette=bg` on a light-page direction → invisible strokes (intended — but no warning). (b) The legacy `paletteMode` modifier was kept in F3ModifiersState; legacy widgets that bind to it write to a dead field. |

---

## §4 · The hachure-as-shading specification — THE most important section

This is where the user's biggest complaint lives. The artist's mental model
of pen-and-ink shading is precise and Hero-8-Lab's implementation diverges
from it. Below is the specification that closes the gap.

### §4.1 · The pen-and-ink shading rule (restated for §4 alone)

A real pen-and-ink artist looks at a region of the drawing and decides:

1. **How dark should this region appear?** (= the source SVG's fill darkness — see §1.3 tokens)
2. **Which shading TECHNIQUE am I using?** (= the user's `fillStyle` selection)
3. **Given the technique and the target darkness, how do I tune the technique's PRIMARY density knob?**
4. **Are there secondary knobs (weight, passes) I should adjust to refine?**

Hero-8-Lab's current math collapses steps 3 and 4 into a single composite
formula that doesn't match what the artist would do. Below: the explicit
mapping from source darkness × technique × user's density slider → output.

### §4.2 · Source-fill → darkness score

The current `fillDarknessFactor` (SvgStyleTransform.ts:221-238) is
**directionally correct** and **should be kept** with one fix.

**Inputs handled:**
- `none` / `transparent` / undefined → 0 (no shading).
- `color-mix(in oklab, TOKEN N%, transparent)` → `N / 100` (i.e., the 8% WASH → 0.08).
- `var(--dir-bg)` → 0 (paper background — never shade).
- `var(--dir-text-primary)` → 1.0.
- `var(--dir-text-body)` → 0.8.
- `var(--dir-text-body-soft)` → 0.6.
- `var(--dir-text-secondary)` → 0.55.
- `var(--dir-detail)` → 0.4.
- `var(--dir-accent)` → 0.85.
- Unknown opaque color → 0.75.

**Fix needed:** add hex / rgb / rgba / hsl parsing. Today an inline
`fill="#000000"` falls into the catch-all "0.75" branch. **Recommended:**
parse the color, compute relative luminance per WCAG (Y = 0.2126R +
0.7152G + 0.0722B), then `darkness = 1 - Y` (darker color → higher
darkness). For rgba/hex with alpha, multiply by alpha. See §7.B-14.

### §4.3 · Skip threshold

Currently: `if (darkness < 0.05) skip shading` (line 350-352). This is
correct. White / bg / near-transparent areas are UNSHADED in pen-and-ink
practice (paper shows through). Keep as-is.

### §4.4 · Technique × darkness mapping table

For each fillStyle, the spec for how darkness drives the technique's
parameters. **The principle: ONE primary density knob per technique;
secondary knobs are dampened.**

#### §4.4.1 · `hachure` (single-direction parallel lines)

**Primary density knob:** spacing (hachureGap).
**Secondary knob:** line weight (fillWeight).

```
effectiveGap   = m.hachureGap × sizeMul × (1.0 / clamp(darkness, 0.1, 1.0))
effectiveWeight = m.fillDensity × 2 × sizeDamp × max(0.5, 0.5 + darkness × 0.5)
```

- At `darkness=1.0`: gap = userGap × sizeMul × 1.0 = base. Lines pack at the user's chosen gap. Weight = `fillDensity × 2 × sizeDamp × 1.0` = the user's slider value.
- At `darkness=0.5`: gap = userGap × sizeMul × 2.0 = twice as sparse. Weight = `fillDensity × 2 × sizeDamp × 0.75` = mildly thinner.
- At `darkness=0.08` (WASH): gap = userGap × sizeMul × 10 — very sparse (maybe just 2-3 lines across the region). Weight = `fillDensity × 2 × sizeDamp × 0.54` = visibly thinner.

The **secondary weight knob has a floor of 0.5**. Even at darkness=0.1, the
line is at least half-weight; we never produce hairline-thin lines that
disappear at hero scale.

**This is the change from current.** Current formula has weight scaling
linearly with darkness all the way down to 0.4 minimum; combined with
gap going to 12.5×, the result is invisible lines on light areas.

#### §4.4.2 · `cross-hatch`

**Primary density knob:** number of passes (rough.js handles this internally
— two perpendicular passes always). Secondary: spacing × weight scale
identically to hachure.

```
effectiveGap   = m.hachureGap × sizeMul × (1.0 / clamp(darkness, 0.1, 1.0))
effectiveWeight = m.fillDensity × 2 × sizeDamp × max(0.5, 0.5 + darkness × 0.5)
```

Same math as hachure. rough.js does the perpendicular second pass for free
(per shihn.ca, https://shihn.ca/posts/2020/roughjs-algorithms/). **The
crosshatch register IS the darker rendering** at any given gap+weight — so
the spec is: pick cross-hatch when the source area is darker than ~0.5;
pick hachure for lighter areas. Both at the same density slider = cross-hatch
reads ~2× darker, which matches the artist convention.

#### §4.4.3 · `dots` (stipple)

**Primary density knob:** dot count per area (which, in rough.js's
implementation, is driven by `hachureGap` as inter-dot spacing).
**Secondary knob:** dot diameter (`fillWeight`).

```
effectiveGap   = m.hachureGap × sizeMul × (1.0 / clamp(darkness, 0.15, 1.0))
effectiveWeight = m.fillDensity × 1.5 × sizeDamp × max(0.5, 0.5 + darkness × 0.5)
```

Two differences from hachure:
- `hachureAngle` is **ignored** — pass any value; rough.js's dots don't use it.
- The `fillWeight × 1.5` (instead of × 2) — dots in rough.js render as small filled circles; same fillWeight produces VISIBLY heavier mass than hachure at the same number, so we scale down the multiplier.

#### §4.4.4 · `zigzag`

**Primary density knob:** the zigzag's overall spacing. rough.js's `zigzag`
renders a continuous zigzag path filling the shape; gap controls the
amplitude of the zigzag.

```
effectiveGap   = m.hachureGap × sizeMul × (1.0 / clamp(darkness, 0.2, 1.0))
effectiveWeight = m.fillDensity × 2 × sizeDamp × max(0.5, 0.5 + darkness × 0.5)
```

Note clamp floor is 0.2 (not 0.1) because zigzag at very high gap renders
as a single zigzag line across the region — under that threshold it stops
reading as a fill technique.

#### §4.4.5 · `dashed`

**Primary density knob:** spacing (same as hachure).
**Secondary knob:** dashGap / dashOffset (rough.js's defaults are
`dashOffset = hachureGap` and `dashGap = hachureGap` per the wiki).

```
effectiveGap = m.hachureGap × sizeMul × (1.0 / clamp(darkness, 0.1, 1.0))
effectiveWeight = m.fillDensity × 2 × sizeDamp × max(0.5, 0.5 + darkness × 0.5)
// rough.js auto-derives dashOffset/dashGap from hachureGap
```

#### §4.4.6 · `zigzag-line`

Same as `hachure` math; rough.js auto-derives `zigzagOffset` from
`hachureGap`. Treat identically to hachure.

#### §4.4.7 · `solid`

**No darkness mapping.** rough.js's solid fill paints the entire region with
the chosen fill color. Honor the source's fill color (palette-mapped) and
apply `fill-opacity = m.fillOpacity × max(0.5, darkness)` for parity with
the artist convention (a light WASH stays light under solid; a primary-ink
fill stays full opacity).

#### §4.4.8 · `none`

**Skip.** No fill, no shading layer.

### §4.5 · Should shading cover the FULL region or be clipped?

**Recommendation: full region.** Pen-and-ink convention is to shade the
entire tonal region uniformly (modulated only by edge falloff for masters
like Albrecht Dürer or Andrew Loomis — but in the digital register that's
out of scope). When a source SVG has `<rect x=3 y=3 width=94 height=69 fill=WASH>`,
the entire 94×69 region carries the wash; hachure should cover the entire
region at the wash's darkness level.

The current implementation does this correctly (hachure path uses
`pointsToPolylinePath(layer0Points, true)` to render the SAME shape as
the outline — see line 367-378). Keep.

### §4.6 · Worked example

A `framedFlyer` element (per F3_B_TrophyWall_Path2.tsx:99-115):

```jsx
<svg viewBox="0 0 80 100" width="72" height="90">
  <rect x="3" y="3" width="74" height="94" fill={WASH} stroke={STROKE} strokeWidth="1.5" />
  <rect x="12" y="14" width="56" height="14" fill={STROKE} />          // dark band
  <path d="..." fill="none" stroke={STROKE} strokeWidth="1" />          // spiky line
  <line x1="14" y1="60" x2="66" y2="60" stroke={STROKE} strokeWidth="0.5" />
  ...
</svg>
```

With `fillStyle=hachure` + `m.hachureGap=4` + `m.fillDensity=0.7`:

| Element | Source fill | Darkness | bboxMin | sizeMul | effGap | effWeight |
|---|---|---|---|---|---|---|
| Outer rect (poster background) | WASH (8%) | 0.08 | 74 | 1.08 | 4 × 1.08 × 12.5 = **54 px** (so basically 1 line across the 94-px height) | 0.7 × 2 × 0.74 × 0.54 = **0.56 px** |
| Inner band | STROKE (1.0) | 1.0 | 14 | 5.7 (capped at 5.7 from 80/14) | 4 × 5.7 × 1 = **22.8 px** (so 0 lines across a 14-px-tall band — too sparse!) | 0.7 × 2 × 0.4 × 1.0 = **0.56 px** |

The band example exposes another problem: tiny shapes get HUGE size multipliers
(`sizeMul = max(1, 80/bboxMin) = 5.7` for a 14-px-tall band), which combined
with the existing gap math overcorrects in the wrong direction. The 14-px
band is supposed to be DARK (it's the inner band of a flyer — STROKE-filled);
it should hatch DENSELY at full darkness. Instead it ends up with effGap=22.8
on a 14-px shape — no lines fit at all.

**Fix:** the sizeMul should be capped lower. Recommendation:

```js
const sizeMul = clamp(80 / max(bboxMin, 40), 1.0, 2.0);
```

At bboxMin=14: sizeMul = clamp(80/40, 1, 2) = 2.0 (capped).
At bboxMin=40: sizeMul = clamp(80/40, 1, 2) = 2.0.
At bboxMin=80: sizeMul = clamp(80/80, 1, 2) = 1.0.
At bboxMin=160: sizeMul = clamp(80/160, 1, 2) = 1.0 (floor).

This bounds sizeMul to [1, 2] — small shapes get DOUBLE the gap (still
visible hachure), not 5× (invisible hachure).

Re-running the band: effGap = 4 × 2.0 × 1.0 = 8 px. On a 14-px-tall band,
that's 1-2 hachure lines visible — readable as "shading" without crowding.

Re-running the poster: effGap = 4 × 1.08 × 12.5 = 54 px. On a 94-px-tall
region with WASH-light source... still very sparse. But this is correct:
the WASH should NOT carry visible hachure, it's almost-white-paper.

**Conclusion of the worked example:** the size-clamp fix is critical. The
darkness mapping is otherwise correct after the §4.4 weight-formula change.

---

## §5 · Calibration matrix (style × modifier)

✓ = applies and currently works · — = correctly hidden from this style's chrome · ❌ = currently exposed but broken/dead · ⚠️ = exposed and works but mis-calibrated (needs fix per §3 or §4)

| Modifier | clean | outline-only | wireframe | wet-ink | charcoal | newsprint | risograph | rough-handdrawn | sketchy | bold-ink | stipple |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **roughness** | — | — | — | — | — | — | — | ⚠️ (default 1.6 diverges from playground 1.0) | ⚠️ | ⚠️ | ⚠️ |
| **bowing** | — | — | — | — | — | — | — | ✓ | ✓ | ✓ | ✓ |
| **strokeWidth** | — | ❌ (exposed but no CSS write-through) | ❌ (overridden by `!important`) | — | — | — | — | ✓ | ✓ | ✓ | ✓ |
| **curveTightness** | — | — | — | — | — | — | — | ✓ | ✓ | ✓ | ✓ |
| **simplification** | — | — | — | — | — | — | — | ❌ (in type but never read) | ❌ | ❌ | ❌ |
| **multiStroke** | — | — | — | — | — | — | — | ✓ | ✓ | — (preset off) | ✓ |
| **endpointBehavior** | — | — | — | — | — | — | — | ✓ | ✓ | ✓ | ✓ |
| **sketchingStyle** | — | — | — | — | — | — | — | ⚠️ (silent when multiStroke<2) | ⚠️ | — | ⚠️ |
| **penTip** | — | — | — | — | — | — | — | ✓ | ✓ | ✓ | ✓ |
| **fillStyle** | — | — | — | — | — | — | — | ⚠️ (§4 darkness mapping wrong) | — | ✓ | ⚠️ |
| **hachureGap** | — | — | — | — | — | — | — | ⚠️ (size-mul overcorrects) | — | — | ⚠️ |
| **hachureAngle** | — | — | — | — | — | — | — | ✓ (correct hide for dots) | — | — | ❌ (dots ignores; should hide) |
| **fillDensity** | — | — | — | — | — | — | — | ⚠️ (weight×darkness wrong axis) | — | ✓ | ⚠️ |
| **blurAmount** | — | — | — | ✓ | — | — | — | — | — | — | — |
| **bleed** | — | — | — | ✓ | — | — | — | — | — | — | — |
| **grainIntensity** | — | — | — | — | ✓ | — | — | — | — | — | — |
| **smudgeAmount** | — | — | — | — | ✓ | — | — | — | — | — | — |
| **pressureVariance** | — | — | — | — | ✓ | — | — | — | — | — | — |
| **offsetDistance** | — | — | — | — | — | — | ✓ | — | — | — | — |
| **offsetAngle** | — | — | — | — | — | — | ✓ | — | — | — | — |
| **colorShift** | — | — | — | — | — | — | ⚠️ (also hardcodes secondary color) | — | — | — | — |
| **registrationError** | — | — | — | — | — | — | ⚠️ (Math.random — non-deterministic) | — | — | — | — |
| **dotSize** | — | — | — | — | — | ❌ (no consumer) | — | — | — | — | ❌ |
| **dotSpacing** | — | — | — | — | — | ❌ | — | — | — | — | ❌ |
| **dotScatter** | — | — | — | — | — | — | — | — | — | — | ❌ |
| **dotPattern** | — | — | — | — | — | ❌ | — | — | — | — | ❌ |
| **inkIntensity** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **fillOpacity** | ✓ | — (preset 0) | — (preset 0) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **strokePalette** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **fillPalette** | ✓ | — | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **texture** | ✓ | ✓ | ✓ | ❌ (overridden by wet-ink filter) | ❌ (overridden by charcoal filter) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **textureIntensity** | ✓ | ✓ | ✓ | ✓ (consumed by wet-ink filter) | ✓ (consumed by charcoal filter) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

**Summary of failures (from the matrix):**
- 5 modifiers with `❌` dead state on at least one style: `strokeWidth` (under outline-only/wireframe), `simplification`, `dotSize`/`dotSpacing`/`dotScatter`/`dotPattern` (under newsprint/stipple), `hachureAngle` under stipple, `texture` under wet-ink/charcoal.
- 7 modifiers with `⚠️` mis-calibration: `roughness` default, `sketchingStyle` silent-when-no-multiStroke, `fillStyle` darkness mapping, `hachureGap` overcorrected by sizeMul, `fillDensity` weight axis wrong, `colorShift` hardcoded color, `registrationError` non-deterministic.

The Implementation Roadmap (§8) prioritizes these.

---

## §6 · Cross-modifier interaction rules

For each meaningfully-interacting pair, the documented compounding rule.

### §6.1 · Multi-stroke × roughness — fan-out clamp

**Symptom:** At `multiStroke=heavy` × `roughness=2.0`, the 8 layers each
jitter independently and the layer envelope on a 60-px shape becomes ±9.6 px
— larger than the shape itself.

**Rule:** Cap layer count at `bboxMin / 30` (already in code, line 257).
**Additionally recommended:** at `multiStroke ≥ quad`, dampen per-layer
roughness by `1 / sqrt(layerIndex)` so later layers don't fan out further
than earlier ones. **Not currently implemented; see §7.B-15.**

### §6.2 · Pen-tip × strokeWidth — cap interaction

**Symptom:** `penTip=charcoal` × `strokeWidth=4` on a 40-px shape: effective
pen-tip size = 3.2 × 4 × clamp(40/140, 0.3, 1) × 2 = 3.2 × 4 × 0.3 × 2 = 7.68 px
— 19% of the shape's width per stroke layer.

**Rule:** the `bboxMin/140` size scale in f3HandFeel.ts:173 partially
mitigates. **Additionally recommended:** cap effective penTip size at
`min(bboxMin/4, 8)` so the stroke never exceeds 25% of the shape's smaller
dimension. **Not currently implemented; see §7.B-16.**

### §6.3 · Sketching style ↔ multi-stroke (visibility gate)

**Rule:** `sketchingStyle` dropdown is meaningful only when `multiStroke ≥ double`.
**Chrome behavior:** hide or disable the `sketchingStyle` dropdown when
`multiStroke ∈ {off, single}`. **Not currently implemented; see §7.B-17.**

### §6.4 · Endpoint × multi-stroke — protrude compounding

**Symptom:** `endpointBehavior=long-overshoot` × `multiStroke=quad` — each
of 4 layers protrudes corners outward by 4.5 px × layer-specific seed jitter;
combined render reads as a starburst at each corner.

**Rule:** protrude amount scales by `1 / max(1, layerIndex)` per layer. So
layer 0 = full protrude; layer 1 = full × 1 (current); layer 2 = full × 0.5;
layer 3 = full × 0.33. Keeps the layered character without fanning protrudes.
**Not currently implemented; see §7.B-18.**

### §6.5 · Fill density × hachure gap × source darkness — the §4 rule

The full mapping is specified in §4.4. Summary: density → primary axis is
**gap** (scaling with `1/darkness`); secondary axis is **weight** (scaling
with `max(0.5, 0.5 + darkness × 0.5)`).

### §6.6 · Hachure angle × fill style — applicability matrix

| fillStyle | angle applies? | reason |
|---|---|---|
| `hachure` | ✓ | Single-pass parallel lines at `hachureAngle`. |
| `cross-hatch` | ✓ | Two passes at `hachureAngle` and `hachureAngle+90°` (rough.js handles internally). |
| `dashed` | ✓ | Same as hachure (rough.js renders dashed parallel lines at angle). |
| `zigzag-line` | ✓ | Each zigzag line oriented at angle (rough.js). |
| `dots` | ✗ | rough.js's dots fill is a scattered field; angle ignored. |
| `zigzag` | ✗ | Continuous zigzag fills the shape's interior; rough.js does not orient zigzag by angle (per shihn.ca write-up — the zigzag path is geometry-driven, not angle-driven). |
| `solid` | ✗ | No lines to angle. |
| `none` | ✗ | N/A. |

**Chrome behavior:** hide hachureAngle slider when fillStyle ∈ {dots, zigzag, solid, none}. Current code hides only when not in {hachure, cross-hatch} — partially correct (also hides for dashed and zigzag-line which actually USE angle). Recommended: switch to "show when fillStyle ∈ {hachure, cross-hatch, dashed, zigzag-line}." **See §7.B-19.**

### §6.7 · Bowing × curve tightness — dampener pair

Per §3.1.2: `effectiveBow = bowing × (1 - curveTightness × 0.45)`. At
`curveTightness=2.0`, effective bowing is 10× attenuated. **Rule (kept):**
curve dampens bowing. **Watch:** at `curveTightness > 0.8`, the user
effectively can't see bowing's effect — make sure the slider's behavior is
documented in tooltips. **Optional improvement; see §9 Q-1.**

### §6.8 · Texture × style (override rule)

- `wet-ink` and `charcoal` styles have their OWN dynamic filters; the
  `texture` dropdown is silenced under those styles.
- All other styles consume `m.texture` via the static `TEXTURE_RECIPES`.

**Recommendation:** disable the `texture` dropdown UI when style is `wet-ink`
or `charcoal`. **See §7.B-10.**

### §6.9 · Palette × source-fill darkness (preservation rule)

When palette-mapping `color-mix(in oklab, var(--dir-text-primary) 8%, transparent)`
under `strokePalette=accent`, the result is
`color-mix(in oklab, var(--dir-accent, #D4574A) 8%, transparent)` — the
8% is preserved. **This is correct behavior and the implementation works
(lines 113-115). Document it in §3.7.3.** Already done.

### §6.10 · InkIntensity × FillOpacity (independent axes)

- `inkIntensity` = wrapper opacity (affects EVERYTHING in the SVG).
- `fillOpacity` = fill-only opacity (does NOT affect strokes).

**Rule:** they multiply. At `inkIntensity=0.5 × fillOpacity=0.5`, fills render
at 0.25 effective opacity, strokes at 0.5. **No fix needed.** Document.

### §6.11 · Multi-stroke `off` vs `single`

`off` = 0 layers (line 62) → no outline rendered (only the base fill).
`single` = 1 layer → one outline stroke.

**This is correct behavior and matches playground (where strokeCount=1
produces a single-pass stroke). But it's potentially confusing:** at
multiStroke=off, the shape renders WITHOUT an outline. Document explicitly.

---

## §7 · Current bug inventory

Numbered for cross-reference from earlier sections.

### §7.A · Conceptual / calibration bugs (the user's main complaints)

#### 7.A-1 · Hachure doesn't reflect source darkness correctly

**Symptom:** WASH (8%) and STROKE (100%) regions hatch with similar density
on the same shape; or hatching disappears entirely on WASH areas.
**Root cause:** `effectiveFillWeight` scales weight ×darkness; `effectiveGap`
scales gap ×1/darkness; both are too aggressive in opposite directions.
Plus sizeMul = 80/bboxMin un-capped, so tiny shapes get gap × 5×, no lines.
**Fix:** apply the §4.4 formulas. Cap sizeMul at [1, 2]. Use weight floor
of 0.5 (not 0.4×darkness).

#### 7.A-2 · Hachure renders OVER solid base fill (when both exist)

**Symptom:** When `fillStyle=hachure` AND source has fill, both the base
paper-fill and the hachure stroke render. Hachure overlays the source's fill
color.
**Current code:** Line 328 says `if (isClosed && fillColor && !isHachureFamily)`
— skips base path WHEN hachure is active. **This is already correct.** Verify
in the field; if the user reports double-fill, it's likely a different bug.

#### 7.A-3 · Default modifier state doesn't match active style

**Symptom:** User loads page, defaults are rough-handdrawn baseline
(roughness=1.6, bowing=1.0). User switches to charcoal; the rough-family
modifiers persist (now wrong calibration for charcoal). User switches back
to rough-handdrawn; still rough-handdrawn defaults but maybe the user changed
something while in charcoal.
**Fix:** Auto-apply STYLE_PRESETS on style change (currently the "Reset to
preset" button does this but it's manual). Recommendation: snap defaults
to the new style's preset automatically when style changes. **See §7.B-20.**

### §7.B · Specific code bugs (numbered for §8 implementation)

#### 7.B-1 · strokeWidth slider exposed under wireframe but overridden

**Code:** Hero8Shell.tsx:130 has wireframe declaring `strokeWidth` in MODIFIER_SETS;
SvgStyleTransform.tsx:804 has `[data-svg-style="wireframe"] svg [stroke-width] { stroke-width: 0.8 !important; }`.
The slider does nothing under wireframe.
**Fix:** either (a) remove `!important` and let slider win, or (b) hide
strokeWidth from wireframe's MODIFIER_SETS. Recommend (a) — give user control.

#### 7.B-2 · newsprint preset declares dot params but no dot renderer exists

**Code:** STYLE_PRESETS.newsprint (line 43) sets dotSize/dotSpacing/dotPattern;
no code consumes them under newsprint. The style's MODIFIER_SETS row (line 133)
also doesn't expose dot params, so they're invisible AND dead.
**Fix:** either (a) implement dot-pattern rendering for newsprint (build an
SVG `<pattern>` and apply as fill), or (b) drop the dot params from
newsprint's preset and treat newsprint as just-another-filter-style. Recommend
(a) — newsprint without dots isn't newsprint.

#### 7.B-3 · risograph secondary color hardcoded

**Code:** Line 696: `const shiftedColor = m.colorShift > 0 ? '#D4574A' : 'var(--dir-text-body)'`.
User has no choice of secondary color.
**Fix:** add a `risoSecondaryColor` PaletteModeStep modifier to the state;
chrome exposes a dropdown when style=risograph.

#### 7.B-4 · simplification slider in type but never wired

**Code:** F3RoughModifiersContext.tsx:64 declares `simplification: number`;
SvgStyleTransform.tsx `buildRoughOptionsForPath` doesn't pass it to rough.js.
Chrome doesn't expose it.
**Fix:** add to SLIDER_SPECS; wire `opts.simplification = m.simplification`
in buildRoughOptionsForPath; expose in chrome when style is rough-family.

#### 7.B-5 · dot params unconsumed under stipple

**Code:** stipple preset (line 48) declares dotSize/dotSpacing/dotScatter;
the actual render is rough.js's `dots` fillStyle which consumes hachureGap and
fillWeight only. The dot-specific params are dead under stipple.
**Fix:** either (a) port a custom dots renderer that respects dotSize/Spacing/Scatter/Pattern,
or (b) drop these params from stipple's preset and document that stipple uses
hachureGap (= dot spacing) and fillDensity (= dot size). Recommend (b) for
simplicity; (a) only if the user wants stipple to differ from rough.js's defaults.

#### 7.B-6 · strokeWidth exposed under outline-only with no write-through

**Code:** Hero8Shell.tsx:129 exposes strokeWidth in outline-only's MODIFIER_SETS.
The CSS rule for outline-only (line 798-800) only strips fills; nothing writes
the user's strokeWidth into the SVG.
**Fix:** add CSS rule
`[data-svg-style="outline-only"] svg [stroke-width] { stroke-width: var(--f3-stroke-width, 1) !important; }`
and write `--f3-stroke-width: m.strokeWidth` on the wrapper. Apply same fix
to wireframe (replacing the hardcoded 0.8 !important rule).

#### 7.B-7 · curveTightness name collision with rough.js

**Code:** Hero-8-Lab's `curveTightness` dampens bowing; rough.js has its own
`curveTightness` parameter (different semantics, per wiki). The name collision
risks confusion if anyone reads rough.js docs and expects Hero-8-Lab's slider
to do the same thing.
**Fix:** rename the F3ModifiersState field to `curveDamp` (or similar); keep
slider label "Curve" in chrome.

#### 7.B-8 · sketchingStyle=cross-hatch vs fillStyle=cross-hatch name collision

**Code:** Two unrelated concepts share the name "cross-hatch": (a) the outline
multi-stroke rotation under `sketchingStyle=cross-hatch`, (b) the fill
technique under `fillStyle=cross-hatch`.
**Fix:** rename `sketchingStyle` value `cross-hatch` to `cross-rotate` or
`scribble-rotate`. Document the distinction in chrome tooltip.

#### 7.B-9 · hachureAngle shown for dots (rough.js ignores)

**Code:** Hero8Shell.tsx:879 hides hachureAngle when fillStyle is not in
{hachure, cross-hatch}. **Actually correct** — dots/zigzag are correctly
hidden. **But:** dashed and zigzag-line should also show (they DO use angle).
**Fix:** change condition to `fillStyle ∈ {hachure, cross-hatch, dashed, zigzag-line}`.

#### 7.B-10 · texture dropdown silent under wet-ink/charcoal

**Code:** SvgStyleTransform.tsx:728-735 `applyTexture` checks `buildDynamicFilterId`
which prefers wet-ink/charcoal dynamic filters over the static texture
recipe. The user's selection of `texture` is ignored under those two styles.
**Fix:** disable the texture dropdown in chrome when style is wet-ink or charcoal.
Add a tooltip explaining the style has its own texture system.

#### 7.B-11 · textureIntensity visible condition wrong for wet-ink/charcoal

**Code:** Hero8Shell.tsx:912 shows textureIntensity slider only when `mods.texture !== 'none'`.
But wet-ink and charcoal consume textureIntensity through their own dynamic
filters (lines 898, 917) — textureIntensity SHOULD always be visible under
those styles.
**Fix:** change condition to `mods.texture !== 'none' OR style ∈ {wet-ink, charcoal}`.

#### 7.B-12 · risograph registrationError uses Math.random

**Code:** Line 688-689: `rdx = dx + (Math.random() - 0.5) × 2 × reg`.
Non-deterministic — re-renders show different jitter.
**Fix:** use a seeded LCG (like `seededRandom` from f3HandFeel.ts:29). Pass
a fixed seed (or derive from the modifier state) so renders are stable.

#### 7.B-13 · legacy paletteMode field still in F3ModifiersState

**Code:** F3RoughModifiersContext.tsx:93 declares `paletteMode: PaletteModeStep`
marked `@deprecated`. State holds a value but no render code reads it
(strokePalette and fillPalette are the live fields).
**Fix:** remove `paletteMode` from the type and from DEFAULT; verify no
chrome control writes to it.

#### 7.B-14 · fillDarknessFactor doesn't handle hex/rgb/hsl

**Code:** SvgStyleTransform.tsx:221-238 handles var() tokens and color-mix;
falls back to 0.75 for unknown colors. Inline `fill="#000000"` gets 0.75.
**Fix:** add parser for `#rrggbb`, `#rgb`, `rgb(...)`, `rgba(...)`, `hsl(...)`,
`hsla(...)`. Compute WCAG luminance: `Y = 0.2126R + 0.7152G + 0.0722B` (all
sRGB linearized). darkness = 1 - Y; multiply by alpha if rgba/hsla.

#### 7.B-15 · multi-stroke roughness fan-out

**Code:** All layers get the same per-vertex jitter from the same roughness
formula. Layer 0 and Layer 7 have equally noisy jitter.
**Fix:** dampen per-layer: `layerJitterMul = 1 / sqrt(1 + layerIndex)`.
Layer 0 = 1.0, layer 1 = 0.707, layer 2 = 0.577, ... layer 7 = 0.354. Apply
in renderHandFeelShape when building per-layer points.

#### 7.B-16 · pen-tip × strokeWidth × bboxMin upper bound

**Code:** Current scale = `clamp(bboxMin/140, 0.3, 1.0)` (f3HandFeel.ts:173).
At strokeWidth=4 + charcoal preset + 40-px shape, effective size still
overflows the shape.
**Fix:** cap final pen-tip diameter at `min(bboxMin/4, 8)`. Implementation:

```js
const presetSize = PEN_TIP_PRESETS[preset].size;
const naiveSize = presetSize × sizeMul × sizeScale × 2;
const cappedSize = Math.min(naiveSize, bboxMin / 4, 8);
```

#### 7.B-17 · sketchingStyle silent at multiStroke<2

**Code:** sketchingStyle dropdown always visible regardless of multiStroke.
At multiStroke=off or single, sketching style has no observable effect.
**Fix:** add visibility condition to chrome: hide sketchingStyle when
multiStroke ∈ {off, single}. Or render the dropdown disabled with a tooltip
"requires multi-stroke ≥ double."

#### 7.B-18 · endpointBehavior protrude compounds across layers

**Code:** All layers use the same `protrudeFor(mods.endpointBehavior)` amount.
At long-overshoot × heavy multiStroke, 8 layers each protrude 4.5 px outward
at jittered corners — produces a starburst.
**Fix:** scale protrude amount by `1 / max(1, layerIndex)` so later layers
get fractional protrudes.

#### 7.B-19 · hachureAngle visibility (extending §7.B-9)

See §6.6 table: hachureAngle should show for hachure, cross-hatch, dashed,
zigzag-line; hide for dots, zigzag, solid, none.

#### 7.B-20 · Style switch doesn't auto-apply preset

**Code:** STYLE_PRESETS is defined; `applyStylePreset` helper exists; but the
useEffect at line 763-778 doesn't call applyStylePreset on style change. User
must manually click "Reset to preset" (assuming such a button exists).
**Fix:** on style change, call `applyStylePreset(currentState, newStyle)`
automatically. UX consideration: this loses any user-tweaked values when
switching styles. Alternative: snap defaults only on FIRST entry into each
style (track touched/untouched).

### §7.C · Architectural notes (not bugs but design decisions to document)

#### 7.C-1 · The DOM-clone approach

`NEEDS_DOM_CLONE = ['rough-handdrawn', 'sketchy', 'bold-ink', 'stipple', 'risograph', 'wet-ink', 'charcoal', 'newsprint']`.
These styles need a CLONE of the source SVG because they transform it
geometrically OR apply expensive filters. The clean / outline-only / wireframe
styles do NOT need a clone — they're CSS-only on the original SVG. This is
correct and efficient.

#### 7.C-2 · The text element is preserved as-is

`transformElement` line 618-619: `<text>` elements are cloned unchanged. This
is correct — text should never be jitter-rendered (illegible). Matches the
playground convention (C3UserFlow.tsx line 584 explicitly renders text
OUTSIDE the filter group).

### §7.D · Divergences from playground (sanctioned)

#### 7.D-1 · Half-magnitude protrude constants

Playground: PROTRUDE_AMOUNT=4, LONG_OVERSHOOT=9, KINK=5 (handFeel.ts:51-53).
Hero-8-Lab: PROTRUDE_LOCAL=2, LONG_OVERSHOOT_LOCAL=4.5, KINK_LOCAL=2.5 (f3HandFeel.ts:57-59).
**Justification (sanctioned per f3HandFeel.ts:54-56 comment):** playground
shapes are 300-500 px artifacts; Hero-8-Lab shapes are 60-100 px hero pins.
Half-magnitude is correct.

#### 7.D-2 · Default modifier state baseline

Playground C3_NATIVE (GateAIonArtifactPlaygroundContext.tsx:440):
`wobble=1.0, strokeCount=2, strokeWidth=1.0, endpointBehavior=clean, sketchingStyle=single-pass, penTip=plain, texture=none`.
Hero-8-Lab DEFAULT (F3RoughModifiersContext.ts:108-144): `roughness=1.6,
bowing=1.0, strokeWidth=1.2, multiStroke=double, fillStyle=hachure`,
endpointBehavior=clean, sketchingStyle=single-pass, penTip=plain, texture=none.

**Divergence:** Hero-8-Lab default roughness is 1.6 vs playground's 1.0;
strokeWidth 1.2 vs 1.0; fillStyle starts at `hachure` vs playground's `none`.
**Justification:** Hero-8-Lab needs richer hand-feel because the hero
artifacts are smaller and more isolated (vs playground's flow diagrams).
**Recommendation:** ratify by updating DEFAULT in F3RoughModifiersContext.ts
to match `STYLE_PRESETS['rough-handdrawn']` exactly (which is what the user
would see on `rough-handdrawn` after auto-preset-apply per §7.B-20).

#### 7.D-3 · Hachure-as-shading darkness mapping

**Hero-8-Lab has it; playground does NOT.** The playground's hand-feel
artifacts (C3, B1, D1) don't expose a fillStyle modifier in chrome —
they hardcode their fills. So the playground has no precedent for the
darkness-mapping math in §4. This is a Hero-8-Lab innovation.
**Recommendation:** apply the §4 spec; document as a Hero-8-Lab extension.

---

## §8 · Implementation roadmap

Ordered by impact. Each item should be implementable in 30-60 min.

### Phase 1 — Fix the §4 darkness mapping (highest user impact)

1. **§7.A-1 + §7.B-14:** Patch `fillDarknessFactor` to handle hex/rgb/hsl colors
   (WCAG luminance). [~30 min]
2. **§7.A-1:** Cap `sizeMul` at [1, 2] in the hachure render path (line 358).
   [~10 min]
3. **§7.A-1:** Apply the corrected §4.4 weight formula
   (`max(0.5, 0.5 + darkness × 0.5)`) replacing line 365. [~10 min]
4. **§7.A-1:** Verify against the §4.6 worked example. Render in browser.
   [~20 min]

### Phase 2 — Wire up dead modifiers / hide dead chrome

5. **§7.B-1 + §7.B-6:** Wire strokeWidth for outline-only and wireframe via CSS
   custom property. [~30 min]
6. **§7.B-9 + §7.B-19:** Fix hachureAngle visibility condition (include
   dashed + zigzag-line; exclude dots/zigzag/solid/none). [~10 min]
7. **§7.B-11:** Fix textureIntensity visibility for wet-ink/charcoal. [~10 min]
8. **§7.B-10:** Disable texture dropdown for wet-ink/charcoal in chrome. [~10 min]
9. **§7.B-17:** Hide sketchingStyle when multiStroke < 2. [~10 min]
10. **§7.B-13:** Remove legacy `paletteMode` field; verify no chrome writes
    to it. [~15 min]

### Phase 3 — Auto-defaults + cross-modifier clamps

11. **§7.B-20:** Auto-apply STYLE_PRESETS on style change. [~30 min]
12. **§7.B-15:** Dampen per-layer roughness in multi-stroke. [~20 min]
13. **§7.B-18:** Scale endpoint protrude per layer (`1/max(1,layerIndex)`).
    [~15 min]
14. **§7.B-16:** Cap pen-tip diameter at `min(bboxMin/4, 8)`. [~15 min]
15. **§7.D-2:** Update DEFAULT to match `STYLE_PRESETS['rough-handdrawn']`
    after auto-preset wires up. [~5 min]

### Phase 4 — Risograph + simplification

16. **§7.B-3:** Add `risoSecondaryColor` modifier; chrome dropdown when
    style=risograph. [~30 min]
17. **§7.B-12:** Replace `Math.random()` in risograph with seeded LCG. [~15 min]
18. **§7.B-4:** Wire `simplification` to rough.js options; add slider.
    [~20 min]
19. **§7.B-7:** Rename `curveTightness` → `curveDamp` to avoid name collision.
    [~15 min]
20. **§7.B-8:** Rename `sketchingStyle=cross-hatch` → `cross-rotate` to avoid
    fill-style name collision. [~15 min]

### Phase 5 — Newsprint + stipple cleanups

21. **§7.B-2:** Decide: build dot-pattern renderer for newsprint, OR drop
    newsprint's dot params. [~60 min if building; ~10 min if dropping]
22. **§7.B-5:** Decide: build custom dots renderer for stipple, OR document
    that stipple uses hachureGap/fillDensity as its density axes. [~60 min
    or ~10 min]

**Total Phase 1 effort: ~70 min.** Phase 1 should land first; user will see
the hachure-as-shading complaint resolved.

---

## §9 · Open questions

Questions the research couldn't answer without your input.

### Q-1 · curveTightness behavior at high values

At `curveTightness > 0.8`, bowing effectively disappears. Is this the right
UX, or should the slider have a different mapping (e.g., curveTightness=1.0
means "exactly straight, no bowing"; curveTightness=2.0 means "bend the OTHER
direction")? The current monotonic-damp model is simpler; the bipolar model
is more expressive.

### Q-2 · newsprint — build or drop?

Newsprint as a style declares dot params but no consumer code exists.
Two paths:
- **Build it:** ~60 min; implement an SVG `<pattern>` with halftone dots,
  size + spacing + pattern (grid / staggered / random / concentric) wired.
- **Drop it:** treat newsprint as just a stipple-texture filter (use the
  existing `stipple` filter recipe under the texture dropdown).

Which path serves the hero better? Newsprint as a register is "cheap-print
halftone" — a distinct aesthetic. Worth keeping if dot rendering lands.

### Q-3 · stipple — distinct from rough.js's dots?

stipple's preset declares dotSize/dotSpacing/dotScatter; rough.js's dots
fillStyle doesn't honor those. Two paths:
- **Custom dots renderer:** ~60 min; honors all params.
- **Document the divergence:** stipple uses rough.js dots; hachureGap is its
  spacing, fillDensity is its dot mass. Drop the dot-specific params.

### Q-4 · Per-style chrome restoration

When user switches from style A to style B, should the modifier state:
- (a) **Auto-snap to style B's preset** (my recommendation per §7.B-20). Loses
  any tweaks under style A.
- (b) **Persist across styles** (current behavior). User must manually reset.
- (c) **Persist within session per style** — remember the user's last value
  for each style. Snap to preset on first entry, persist on subsequent.

Option (c) is the most expressive but adds state complexity.

### Q-5 · Hachure as REPLACEMENT vs ADDITIVE

§4.5 picks "full region" — hachure covers the entire fill area. The artist
convention supports this. But there's a register where shading is partial
(e.g., shading the SHADOW side of a form only). Is partial-region shading
in scope, or does Hero-8-Lab always render hachure across the full source
fill region? **Current code and §4.5 spec: full region.** Confirm.

### Q-6 · Outline + hachure both render or one?

When fillStyle is hachure, the outline still renders (rough.js multi-stroke
outline + rough.js hachure fill). Some artists DROP the outline when shading
is dense (the hachure edge IS the outline). Two paths:
- **Both render (current).** Outline + interior hachure both visible.
- **Drop outline when fillStyle is dense.** At hachure with low gap (= dense),
  skip the outline render.

Recommend keeping current behavior unless the user signals otherwise.

### Q-7 · "Plain" pen-tip vs ballpoint at strokeWidth=1

These produce similar-looking output. Should the chrome merge them (drop
`plain`), or keep `plain` as the "no perfect-freehand transform" escape
hatch (faster render, different math)? Current behavior keeps plain as a
distinct preset. Recommend keeping.

### Q-8 · Recommended default style on page load

Hero-8-Lab currently defaults to `clean` (F3SvgStyleContext.ts:52). Is that
correct for the hero? Or should the default register be `rough-handdrawn`
(matches the hero artifact's intended register)?

---

## Appendix A — Source citations

**rough.js:**
- Wiki (full Options API): https://github.com/rough-stuff/rough/wiki
- Algorithm write-up (Preet Shihn / Pavithra Kodmad): https://shihn.ca/posts/2020/roughjs-algorithms/
- Site: https://roughjs.com/

**perfect-freehand:**
- Repo: https://github.com/steveruizok/perfect-freehand
- TypeScript types (canonical option list): https://github.com/steveruizok/perfect-freehand/blob/main/packages/perfect-freehand/src/types.ts
- npm: https://www.npmjs.com/package/perfect-freehand

**SVG filter primitives (MDN):**
- feTurbulence: https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feTurbulence
- feDisplacementMap: https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/feDisplacementMap
- feGaussianBlur: https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feGaussianBlur
- feColorMatrix: https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feColorMatrix
- pattern: https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/pattern

**Pen-and-ink shading conventions:**
- Erika Lancaster, *Guide to Shading Techniques: Hatching, Cross-Hatching, Scribbling and Others*: https://www.erikalancaster.com/art-blog/guide-to-shading-techniques-hatching-cross-hatching-scribbling-and-others
- Craftsy, *6 Basic Forms of Hatching and Cross Hatching*: https://www.craftsy.com/post/hatching-and-cross-hatching
- Fiveable, *Hatching and Cross-Hatching* (Drawing I Class Notes): https://fiveable.me/drawing-foundations/unit-6/hatching-cross-hatching/study-guide/SBjr8djW1TCdGeXY
- Sketchbooks.org, *Hatching and Cross-Hatching: Use Lines to Build Value and Texture*: https://sketchbooks.org/hatching-cross-hatching-techniques/
- Drawing Life, *Shading Techniques of Hatching and Cross Hatching*: https://drawinglife.art/shading-techniques-hatching-cross-haching/

**Playground research docs (in repo):**
- `docs/labs/applied-surfaces-v2/ion/gate-a-ion-texture-and-pen-tip-research.md` — feTurbulence honest defense, fillStyle deep-dive, pen-tip preset catalog.
- `docs/labs/applied-surfaces-v2/ion/gate-a-ion-hand-feel-toggle-system-research.md` — referenced by texture research.
- `docs/labs/applied-surfaces-v2/ion/gate-a-ion-c3-userflow-register-research.md` — calibration target rationale.

**Playground code (in repo):**
- `apps/Homepage Surfaces v2 Lab/src/app/lib/handFeel.ts` — locked rough.js technique + perfect-freehand integration.
- `apps/Homepage Surfaces v2 Lab/src/app/components/artifacts/C3UserFlow.tsx` — texture filter recipes + hand-feel render harness reference.
- `apps/Homepage Surfaces v2 Lab/src/app/components/artifacts/B1VennPositioning.tsx` — rough.js usage for hand-feel circles.
- `apps/Homepage Surfaces v2 Lab/src/app/state/GateAIonArtifactPlaygroundContext.tsx` — C3HandFeel state schema + calibration baselines.

**Hero-8-Lab code (in repo):**
- `apps/Hero-8-Lab/src/app/lib/f3HandFeel.ts` — local fork of playground hand-feel.
- `apps/Hero-8-Lab/src/app/components/hero8/cells/SvgStyleTransform.tsx` — the transform component this spec governs.
- `apps/Hero-8-Lab/src/app/state/F3RoughModifiersContext.tsx` — modifier state schema.
- `apps/Hero-8-Lab/src/app/state/F3SvgStyleContext.tsx` — style enum + meta.
- `apps/Hero-8-Lab/src/app/components/hero8/Hero8Shell.tsx` — chrome rendering with SLIDER_SPECS and MODIFIER_SETS_BY_STYLE.
- `apps/Hero-8-Lab/src/app/components/hero8/cells/F3_B_TrophyWall_Path2.tsx` — source SVGs with WASH/STROKE/BG token vocabulary.

---

## Appendix B — Quick reference: every modifier's default + range

| Modifier | Type | Default | Range/values | Notes |
|---|---|---|---|---|
| roughness | slider | 1.0 (after §7.D-2 fix) | 0–2, step 0.02 | Was 1.6 |
| bowing | slider | 1.0 | 0–5, step 0.05 | |
| strokeWidth | slider | 1.0 (per-style override) | 0.1–6, step 0.05 | |
| curveTightness (→curveDamp) | slider | 0 | 0–2, step 0.02 | Rename per §7.B-7 |
| simplification | slider | 0 | 0–1, step 0.02 | Wire per §7.B-4 |
| multiStroke | dropdown | double | off/single/double/triple/quad/quint/six/heavy | |
| endpointBehavior | dropdown | clean | clean/protrude/long-overshoot/kink | |
| sketchingStyle | dropdown | single-pass | single-pass/loose-overlap/parallel-pass/cross-rotate | Rename per §7.B-8 |
| penTip | dropdown | plain | plain/ballpoint/fineliner/pencil-hb/pencil-2b/felt-tip/chisel/charcoal | |
| fillStyle | dropdown | hachure (rough-handdrawn) | none/solid/hachure/cross-hatch/dots/zigzag/dashed/zigzag-line | |
| hachureGap | slider | 4 | 0.5–20, step 0.25 | |
| hachureAngle | slider | -41 | -90 to 90, step 1 | |
| fillDensity | slider | 0.7 | 0–1.5, step 0.02 | |
| blurAmount | slider | 0.4 (wet-ink) | 0–3, step 0.05 | |
| bleed | slider | 0 | 0–1, step 0.02 | |
| dotSize | slider | 1.0 | 0.3–6, step 0.1 | Dead per §7.B-2/5 |
| dotSpacing | slider | 3 (stipple) | 1–20, step 0.25 | Dead per §7.B-5 |
| dotScatter | slider | 0.3 | 0–1, step 0.02 | Dead per §7.B-5 |
| dotPattern | dropdown | staggered | grid/staggered/random/concentric | Dead per §7.B-2 |
| grainIntensity | slider | 2.5 (charcoal) | 0–3, step 0.05 | |
| smudgeAmount | slider | 0 | 0–3, step 0.05 | |
| pressureVariance | slider | 0 | 0–1, step 0.02 | |
| offsetDistance | slider | 2 (risograph) | 0–12, step 0.25 | |
| offsetAngle | slider | 45 | -180 to 180, step 1 | |
| colorShift | slider | 0.7 | 0–1, step 0.02 | |
| risoSecondaryColor | dropdown | accent | (same palette set) | Add per §7.B-3 |
| registrationError | slider | 0 | 0–3, step 0.05 | Seed per §7.B-12 |
| texture | dropdown | none (per-style override) | 10 values | |
| textureIntensity | slider | 1.0 | 0–2.5 (consider 3), step 0.05 | |
| inkIntensity | slider | 1.0 | 0–1, step 0.01 | |
| fillOpacity | slider | 1.0 (per-style override) | 0–1, step 0.01 | |
| strokePalette | dropdown | source | 10 values | |
| fillPalette | dropdown | source | 10 values | |

— END OF DESIGN CONTRACT —
