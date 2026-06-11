# 06 — Tone is the currency: how shading works

**In one sentence:** Every region in a doodle gets reduced to one number — darkness, 0 = paper, 1 = ink — and that single number is the currency every shading grammar (hachure, cross-hatch, dots, stipple, newsprint, future 3D hatching) spends to decide how dense its marks should be.

## Plain language

Think of how you work in Substance Painter. Underneath all the fancy material channels there's usually one grayscale map doing the real work — a roughness map, an AO map, a height map. One channel, 0 to 1, and everything downstream *interprets* that channel its own way. Desk Doodles' shading system is built on exactly that idea, except the single channel is **darkness**: how much ink a region's original fill "wants."

- `0` = paper. Nothing to shade. Leave it alone.
- `1` = pure ink. Maximum density, whatever grammar you're in.
- `0.55` = a mid-tone. Render it as mid-density hachure, or mid-density dots, or a mid-gray charcoal smudge — the *number* doesn't care which.

This is invariant **I-2** in the locked Smart Hachure contract: *source darkness owns per-region perceptual identity.* A region that was dark in the source must read as dark after any style switch. Sliders can vary intensity within a band, but they can never push a dark region into reading light. The darkness number is the thing that "survives the round-trip" — it's the value study under the painting.

### How every input becomes darkness

Every kind of fill an SVG can carry gets collapsed into that one number:

| Input | How it becomes darkness | Anchor |
|---|---|---|
| W1 design tokens (`var(--dir-text-primary)` etc.) | Hand-mapped lookup table (primary→1.0, body→0.8, detail→0.4, bg→0) | Like a named swatch library — known values, no math needed |
| `color-mix(... 8%, transparent)` washes | Read the percentage straight off (8% → 0.08) | Layer opacity slider — the % IS the coverage |
| Literal colors (`#c0392b`, `rgb()`, `hsl()`) | Parse the color, compute perceptual lightness, darkness = 1 − lightness. Alpha multiplies in. | Desaturate the layer in Photoshop and read the gray value |
| Gradients (`url(#someGradient)`) | Average the darkness of all the gradient stops → one flat number | **Baked albedo, sampled at 1×1.** See below. |
| `<pattern>` fills | 0 — pass through untouched | The pattern already authored its own density; over-marking it would be double-shading |
| Unparseable / unknown | 0.75 catch-all — "assume mid-dark" | A safe guess that errs toward visible marks rather than blank paper |

**The gradient limitation, honestly:** averaging the stops is like baking a gradient texture down to a single pixel. A black-to-white gradient becomes flat 0.5 — the *spatial* information (dark on the left, light on the right) is thrown away, and the region renders at one uniform density. Doing this right would mean rasterizing the gradient and sampling darkness per sub-region — the "live material" version instead of the baked one. We knowingly ship the baked version; it's a documented edge-case policy decision, not an oversight.

### The per-grammar density math (how one number becomes marks)

Once you have darkness, each fill grammar needs to answer: *how do I lay down marks so the region reads at that darkness from arm's length?* The math comes from print science, and it's genuinely simple:

**Murray-Davies (1936) — coverage.** Perceived tone is just "what fraction of the paper did ink cover." This is literally how halftone printing works — the same dots-of-ink trick your newsprint style fakes. Inverting it: given a target tone, solve for the coverage fraction `a` you need. For hachure lines, coverage ≈ `weight / gap` — line thickness over line spacing. Want 30% darkness? Make the lines cover ~30% of the area. That's it.

**Beer-Lambert — stacking.** What happens when marks overlap, like cross-hatch? Same thing as layering marker passes: the second pass doesn't double the darkness, it darkens *what light is left*. Two hachure directions at coverage `w/g` each give total coverage `a ≈ 1 − (1 − w/g)²` — Photoshop **Multiply**, written in darkness terms (multiply the remaining *lightness* of each layer, then flip back to darkness). This is why cross-hatch at the same gap/weight reads ~√2× darker than single hachure, and why the cross-hatch grammar needs wider gaps to match a target tone.

**8-band quantization.** Human eyes can distinguish ~43 lightness steps in ideal conditions, but with hatch-texture masking the practical number is 6–10. So darkness gets bucketed into **8 bands** (paper → black), each band mapping to a mark-layer recipe — sparse layer 1, dense layer 1, layers 1+2, up to all 4 layers at max density. Marks are only ever *added* as bands get darker, never moved or removed (Praun's tonal-art-map nesting) — which is what keeps style-switching stable instead of flickery.

## The design — why it's built this way

**Why one scalar instead of keeping the color?** Because the whole product premise is *re-rendering the same content in different grammars*. Hachure doesn't have a concept of "red"; it has gap and weight. Dots have count and radius. The only property that translates across every grammar — including the planned 3D screen-space hatching — is tone. Color is handled separately (palette modes remap ink hue); darkness drives *density*. Splitting those two concerns is what makes 11 SVG styles + a 3D port share one brain.

**Why a token lookup table at all, instead of always computing luminance?** Because CSS `var()` references can't be parsed as colors — there's no color string to compute from without resolving the variable through the DOM. The W1 tokens are a small, closed set, so a hand-tuned table is both faster and more *intentional*: `--dir-accent` maps to 0.85 because that's how it should *behave* tonally, not just how it measures.

**Why does darkness get computed in two places with two different lightness models?** Honest quirk of the codebase:

| Implementation | Lightness model | Where |
|---|---|---|
| `computeDarkness` (smart layer) | **OKLab L** via culori — perceptual lightness | `src/app/lib/smartHachure/signals.ts` |
| `fillDarknessFactor` (legacy render path) | **WCAG relative luminance** (the contrast-ratio Y) | `src/app/components/canvas/SvgStyleTransform.tsx` |

Both return 0 = paper / 1 = ink and share the same token table (the signals.ts comment explicitly says it "mirrors legacy `fillDarknessFactor`"). They differ slightly on literal colors — OKLab is the perceptually-uniform one; WCAG Y is what the calibration spec (§7.B-14) prescribed for that branch. Two models existing is historical layering, not a design statement; the smart layer is the future-facing one.

**What was rejected:**

- *Rasterize-and-sample for gradients* — correct but heavy (offscreen canvas render per region per re-style). Average-stop is the documented quick approximation.
- *Yule-Nielsen n-correction* on Murray-Davies — models how paper scatters light around halftone dots in physical print. Screens don't scatter; linear Murray-Davies is sufficient. Skipped deliberately, not forgotten.
- *Treating `<pattern>` fills as tonal regions* — patterns author their own density; the smart layer marking over them would double-shade. Policy: pass through (darkness 0).
- *More than 8 darkness bands* — past ~10 levels the differences vanish under hatch-texture noise. 8 = Praun's 6-column tonal art map + headroom.

## Technical

### The smart-layer signal (rule engine — this is what ships)

**`computeDarkness(fillRaw, fillComputed)`** — `src/app/lib/smartHachure/signals.ts:240`
Resolution order, each branch returning 0–1 darkness:
1. `none` / `transparent` / null → `0` (line 241)
2. W1 token table (lines 245–251): `--dir-bg`→0 · `--dir-text-primary`→1.0 · `--dir-text-body-soft`→0.6 · `--dir-text-body`→0.8 · `--dir-text-secondary`→0.55 · `--dir-detail`→0.4 · `--dir-accent`→0.85
3. `color-mix(... N%, transparent)` regex → N/100 (lines 254–257)
4. culori `parse` → OKLab → `1 − L`, clamped (lines 260–267)
5. Catch-all `0.75` "unknown opaque color — assume mid-dark" (lines 263, 269)

**`resolveUrlFillDarkness(el, fill)`** — `src/app/lib/smartHachure/signals.ts:295`
For `url(#id)` fills: looks up the def in the owner SVG, then
- `<pattern>` → `0` pass-through (line 301)
- `linearGradient` / `radialGradient` → average over `<stop>`s of `(1 − OKLab L) × stop-opacity` (lines 302–325)
- unresolvable → `0.75` (same catch-all)

**Wiring:** the dispatch between the two lives at `signals.ts:87–90` — `fill.startsWith('url(')` routes to `resolveUrlFillDarkness`, everything else to `computeDarkness`. The result lands as `Signals.darknessL` (`src/app/lib/smartHachure/types.ts:64` — "1 - OKLab L of fill, 0..1; 0 = paper, 1 = ink").

**Consumers of `darknessL`:**
- `src/app/lib/smartHachure/classifier.ts` — rule thresholds band regions into tonal roles: ≤0.03 paper-ish (line 272), 0.05–0.3 `sparse-tonal` (177), 0.3–0.55 `mid-tonal` (147), 0.55–0.85 `dense-tonal` (157), ≥0.85 `solid-content` (167). These are hard-coded `if` rules — a rule engine, not ML.
- `src/app/lib/smartHachure/techniqueMap.ts` — `selectTreatment` (line 45) maps role → `BASE_BY_ROLE` gap/weight/opacity multipliers (e.g. `sparse-tonal`: hachure, gap 5.0× / weight 0.6×; `dense-tonal`: cross-hatch, gap 1.75× / weight 1.0×; `solid-content`: cross-hatch, gap 0.9× / weight 1.2×) which then multiply the user's sliders.
- `src/app/lib/smartHachure/index.ts:235` — every outline gets `data-smart-source-darkness` stamped on it, which is what the `/audit` debug tooling reads.

### The legacy render-path twin

**`fillDarknessFactor(fillColor)`** — `src/app/components/canvas/SvgStyleTransform.tsx:387`
Same token table + color-mix branch, then the literal-color branch (lines 403–475, added per calibration spec §4.2 + §7.B-14): hand-rolled hex (3/4/6/8-digit) + `rgb()/rgba()` + `hsl()/hsla()` parsing → sRGB linearization → WCAG relative luminance `Y = 0.2126R + 0.7152G + 0.0722B` → `darkness = (1 − Y) × alpha` (lines 470–475). Catch-all 0.75 at line 478. Consumed at `SvgStyleTransform.tsx:999` to scale hachure density in the non-smart render path.

### The density math (research-locked, partially implemented)

From `docs/research/21-research-3d-pipeline-and-style-translation.md` §4 (lines 153–205):

```ts
function coverageToParams(
  targetCoverage: number,   // 0..1, from source darkness via Murray-Davies inverse
  fillStyle: 'hachure' | 'cross-hatch' | 'dots' | 'zigzag' | 'dashed' | 'zigzag-line',
  bias: { gap?: number; weight?: number; density?: number }
): { gap: number; weight: number; layers: number; angle?: number }
```

| Grammar | Inverse equation | Note |
|---|---|---|
| Hachure | `a ≈ weight / gap` | Murray-Davies coverage, one parameter pair |
| Cross-hatch | `a ≈ 1 − (1 − w/g)²` | Beer-Lambert stacking; ~√2× darker than hachure at same params |
| Dots / stipple | `a = N·π·r² / Area` | Layers axis = dot count; weighted Voronoi (Secord 2002) for distribution |
| Zigzag | `a ≈ weight·pathLength / (gap·regionArea)` | Path length per unit area fixed by amplitude/frequency |

Murray-Davies inverse: `coverage = (R_paper − R_target) / (R_paper − R_ink)` with `R_paper ≈ 1.0`, `R_ink ≈ 0.05` for screens. The 8-band L* table (§4, lines 192–201) maps darkness bands to TAM layer recipes.

## Connections

- **Signals page** — `darknessL` is one signal among the geometric/topological/stylistic set extracted in `signals.ts`; this page zooms into the one perceptual signal. Edge: *darkness is computed during signal extraction, consumed everywhere downstream.*
- **Classifier / tonal-roles page** — darkness bands are the primary input to role assignment (`classifier.ts` rules above). Edge: *darkness in → role out.*
- **Treatment / techniqueMap page** — roles pick gap/weight/opacity multipliers; the planned `coverageToParams` will replace the role-multiplier approximation with true inverse math. Edge: *role + darkness → mark parameters.*
- **fillStyle override** (`feedback_fillstyle_slider_must_switch_classifier_pick`) — the user's grammar pick swaps WHICH equation spends the darkness; it never changes the darkness itself. Edge: *grammar is user-sacred (I-1), tone is source-sacred (I-2).*
- **Drawn-input / draw-panel page** — drawn strokes are stroke-only polylines with NO fills, so the entire shading half of the engine currently has nothing to read on drawn input. That gap is what the tone-patch system (below) exists to close. Memory: `project_desk_doodles_shading_input_tone_fill`.
- **3D pipeline** (`docs/research/21-research-3d-pipeline-and-style-translation.md` §6–7) — the planned screen-space hatching post-process consumes the same 8-band quantization (`int band = floor((1.0 − luma) * 8.0)` in the fragment-shader sketch, line 540). Edge: *tone is the cross-dimensional currency, 2D and 3D.*
- **Locked contract** — `docs/locked-refs/F3-smart-hachure-system/09-LOCKED-MODEL.md` I-2 (line 38) is the invariant this whole page implements; `docs/locked-refs/F3-siblings/F3-shading-calibration-spec.md` §4 is the per-modifier calibration source.
- **Audit dataset** (`project_smart_layer_foundation_via_audit`) — `data-smart-source-darkness` stamps make tone observable per shape in `/audit`; that catalog is the future training data.

## Honest status

The shipping smart system is a **RULE ENGINE** — hand-written `if` thresholds and lookup tables. There is no ML anywhere in the codebase today.

### EXISTS in code now

| Thing | Where | Caveat |
|---|---|---|
| `computeDarkness` (tokens + color-mix + OKLab) | `signals.ts:240` | — |
| `resolveUrlFillDarkness` (gradient avg-stop, pattern pass-through) | `signals.ts:295` | Gradient = baked-flat approximation by design |
| `fillDarknessFactor` literal-color WCAG branch | `SvgStyleTransform.tsx:387–479` | Shipped 2026-06-10, **not yet visually regression-verified** (handoff flag — eyeball a hex-filled upload or run the sweep before calling it done) |
| Classifier darkness-band rules → 9 tonal roles | `classifier.ts` | Rule engine. Bands are coarser (5-ish) than the 8-band target |
| Role → gap/weight/opacity multipliers | `techniqueMap.ts` `BASE_BY_ROLE` | Approximates density; not the true Murray-Davies inverse |
| `data-smart-source-darkness` debug stamps | `index.ts:235` | — |
| `polygon-clipping` dependency | `package.json:19` | Installed Day 5; **not yet wired to anything tone-related** |

### PLANNED (do not present as shipped)

- **`coverageToParams` as a single function** — research-locked shape (doc 21 §4), scaffolding exists in `renderRegion.ts`, but the 4 per-fillStyle inverse equations and the 8-band L* table are NOT yet calibrated/wired. That is Day 11 work per the doc itself.
- **The entire tone-patch system** (memory `project_desk_doodles_shading_input_tone_fill`) — nothing in code yet:
  - **Patches as editable objects** — a patch = {region geometry, darkness level}, like a marker swatch on tracing paper laid over the drawing: placeable anywhere (including half-overlapping a shape), movable/resizable/re-tonable/deletable after the fact. This is what gives drawn input a shading channel at all.
  - **Tier 1 — manual patch** (ships first): user paints/places the patch directly. Zero region detection. De-risks MVP.
  - **Tier 2 — tap-to-fill assist** (research-gated, confirmed wanted): tap a spot, even in a NON-enclosed region, and the system proposes the patch boundary — gap-closing/leak-proof flood fill, trapped-ball segmentation, scribble-based segmentation from the manga-colorization literature. Sebs's explicit directive: heavy research pass with real citations BEFORE building.
  - **Option B stacking — LOCKED by Sebs:** overlapping patches composite as `result = 1 − (1−a)(1−b)` — the multiplicative marker model, same Beer-Lambert family as the cross-hatch math (Photoshop Multiply in darkness terms).
  - **The four engineering solutions** (locked direction, all unbuilt): ① zone partition of overlapping patches via the already-installed `polygon-clipping` dep; ② SEAMLESS rendering via **line-screening** — generate ONE hachure field at the densest zone's density across the whole union, then per zone keep every k-th line, so lines align perfectly across zone boundaries (zero seams); ③ memoized edit cascades — only zones touching a moved patch recompute; ④ darkness cap (~0.95) plus the structural mitigation that patches are OBJECTS, so stacked darkness is always *computed*, never baked — delete a patch and the tone recomputes non-destructively.
- **One shared smart system** — architecture lock: tone patches, uploaded fills, gradients, future photo traces are all just *producers* of the same tone-region data feeding the single signals→classify→treatment engine. New inputs add producers, never new brains.
- **ML layer** — future, trains on the `/audit` breakage catalog. Today: zero ML, all rules.
