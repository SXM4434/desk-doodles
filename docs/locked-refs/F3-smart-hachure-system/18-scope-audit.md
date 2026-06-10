# Smart Hachure — Scope Audit (gating doc for `09-LOCKED-MODEL.md` sign-off)

**Status: synthesis complete 2026-06-04.** Three concurrent research passes:
- **Pass A — Internal docs sweep:** combed `00-overview`, agents `01–05`, architecture `06–08`, `F3-toggle-architecture.md`, `F3-shading-calibration-spec.md`.
- **Pass B — Academic literature:** Murray-Davies, Yule-Nielsen, CIELAB perceptual models, Winkenbach-Salesin pen-and-ink, Praun et al. TAMs, Secord stippling, Balzer CCVT, JND/ΔE perception.
- **Pass C — Practitioner / production tools:** rough.js source + open issues, perfect-freehand, p5.brush, Procreate, Concepts, Clip Studio, Inkscape, tldraw, Excalidraw, Mermaid, NPR engines.

Output: proposed additions and revisions to `09-LOCKED-MODEL.md` §1–§7, an enumerated edge-case policy, per-fillStyle research seeds, and a clearly-marked list of decisions only Sebs can make. **No silent doc edits** — `09-LOCKED-MODEL.md` is unchanged until sign-off.

---

## Headline findings (read these first)

### H-1. The contract has a Style × fillStyle axis conflation that has to be settled before code

F3 today has TWO orthogonal user-facing dropdowns:
- **Style** (11 options): `clean`, `outline-only`, `wireframe`, `rough-handdrawn`, `sketchy`, `bold-ink`, `stipple`, `wet-ink`, `charcoal`, `risograph`, `newsprint`
- **fillStyle** (8 options): `none`, `solid`, `hachure`, `cross-hatch`, `dots`, `zigzag`, `dashed`, `zigzag-line`

`09-LOCKED-MODEL.md` §I-1 says "the user's fillStyle dropdown is sacred" and lists 7 families — that's the **fillStyle axis only**. But `Style` is also user-chosen and currently gates whether Smart Hachure runs at all (currently scoped to the 4 rough-family Styles).

**Sebs decision required** (D-1 below).

### H-2. The axis set in §I-1 dropped TWO things: `layers` from the agent convergence AND originally substituted `color` — but `color` was on Sebs's explicit list

Sebs explicitly named `(line thickness, gap, pencil pressure, color, opacity)` as the darkness mechanisms. The 5 agents converged on `(gap, layers, weight, pressure, opacity)`. The contract's first draft used `(gap, weight, pressure, color, opacity)` — dropped layers, kept color. The 2026-06-04 first-pass recommendation (D-2.a) flipped to drop color, restore layers — but that DROPS something Sebs explicitly named. Drift again.

**Final corrected recommendation (D-2.c): 6-axis tuple `(gap, weight, layers, pressure, color, opacity)`.** Restore BOTH from their respective sources. Layers from agent convergence + practitioner hatching convention. Color from Sebs's explicit naming. Drop nothing.

Cross-hatch is its OWN family per D-4.b lock (not layer-add on hachure). TAM nesting (Praun) describes how marks accumulate within each fillStyle as darkness grows, independently per fillStyle.

### H-3. The identity-preservation invariant (I-2) has a published computational answer: Praun et al. 2001 TAM stroke-nesting

**Praun, Hoppe, Webb, Finkelstein — "Real-Time Hatching" (SIGGRAPH 2001).** https://gfx.cs.princeton.edu/proj/hatching/hatching.pdf

The rule: as a region's target darkness moves darker, you ONLY add strokes — never remove, never reposition. Mathematically forces "dark stays dark across slider extremes." This is the missing computational primitive that makes I-2 enforceable rather than aspirational.

**This is the single most important reference for the rebuild.** TAM nesting describes how marks accumulate WITHIN one fillStyle as target darkness grows — applies independently to hachure, cross-hatch, dots, etc. It does NOT collapse user-facing fillStyles into each other (see D-4 lock 2026-06-04: cross-hatch is its own family).

### H-4. Multi-axis identity preservation under orthogonal slider control is OPEN TERRITORY

Praun nesting preserves identity along ONE axis (tone). No published model preserves identity simultaneously across orthogonal user sliders (gap × weight × pressure × layers × color). Smart Hachure is inventing this. The contract should NAME this as a v1 deliverable (not pretend it's solved upstream) and document the approach taken.

**Recommendation:** v1 keeps Sebs's existing ~13 separate sliders (Hachure Gap, Stroke Width, Fill Density, Roughness, Bowing, Curve, Multi-Stroke, Endpoint, Sketching Style, Pen Tip, Ink Intensity, Fill Opacity, Hachure Angle) — `feedback_more_toggle_options_better` is standing direction. Each slider's effect is bounded to preserve per-region identity bands (I-2 enforcement). The "smart" layer takes the slider state + source signals and computes the per-region 6-axis tuple such that (a) every slider still affects every region's rendering, (b) no slider can push a region across its identity band edge, (c) per-region ordering is preserved at every slider position. The multi-axis identity invariant is the v1 inventive work — research doc per fillStyle must spec how its model honors it across all axes simultaneously.

Earlier draft of this recommendation collapsed sliders to a single "density" axis — drift toward fewer-options-than-agreed. Removed.

### H-5. Real perceptual math, real citations

- **Murray-Davies forward model:** `R = a·R_ink + (1-a)·R_paper` (linear coverage → tone). Baseline for solid + hachure.
- **Yule-Nielsen `n`-correction:** `R^(1/n) = a·R_ink^(1/n) + (1-a)·R_paper^(1/n)` for sub-pixel saturation analog (when gap approaches output pixel size). Empirically fit per UA × DPR; default `n ≈ 1.6`.
- **CIELAB L* cube root:** `coverage ≈ (1 − L*/100)^3`. Linear coverage slider feels non-linear in perception; cube-root through L* to make slider feel right.
- **JND:** ΔL* ≈ 1 per ~30 reliably distinguishable lightness steps. Use as v1 slider quantization unit.
- **Per-family calibration constants `k_family`:** hachure ≈ 0.9–1.1, cross-hatch ≈ 0.85 (overlap reduces apparent darkness), stipple ≈ 0.7–0.85 (small dots look lighter than equivalent solid coverage). Empirically fit per fillStyle against a Macbeth grayscale strip.

These replace the rule-stub heuristics that v0 had.

### H-6. rough.js has documented bugs we will inherit if we don't fix

- **#211 dot-filler bypasses the seeded RNG** (uses raw `Math.random()`). Reproducibility breaks for the dots fillStyle.
- **#65 hachure cutoff at canvas bounds.** Shapes larger than canvas don't fully fill — biting on responsive layouts.
- **Stray hachure at exact-corner polygon intersections** (Inkscape extension documents the same bug). Mitigation: jitter scan-line position by ε.
- **rough.js dot filler uses jittered grid, NOT Poisson-disk.** Instantly recognizable as rough.js. If Smart Hachure dots ship with this, the wedge claim is gone — v1 dots should use weighted Voronoi (Secord) or CCVT (Balzer).
- **rough.js project is in maintenance mode** (last meaningful release v4.0; Feb 2026 issue questioning maintenance). v1 should plan to vendor + extend rough.js where needed, not bet on upstream fixes.

### H-7. p5.brush is the closest existing JS library to Smart Hachure's wedge

It has a `gradient` axis on its `brush.hatch()` API — the only mainstream JS library that exposes a density-gradient axis natively. https://github.com/acamposuribe/p5.brush

Also has vector fields (direction-field-aligned strokes — what NPR engines call "directional flow" and rough.js entirely lacks). Worth studying as reference but is p5-bound; lifting the math out for our use is engineering work.

### H-8. Manga screentone UI (Clip Studio) is the consumer-shippable analog

Screentones are indexed by **density % (10, 20, 30, … 80)** and **LPI** — picking a tone is two-axis, direct tone-matching ("apply 40% tone here") is built in. https://tips.clip-studio.com/en-us/articles/6227

This validates that the **target-darkness UI** Smart Hachure wants is consumer-shippable; we are not inventing a UX paradigm, we are porting one from print to live-rendered SVG.

### H-9. Lightroom "Flow vs Density" framing is the canonical UX vocabulary

https://hueandhatchet.com/lightroom-brushes-flow-vs-density/

- **Density** = global ceiling on effect (Smart Hachure global slider acts like Density)
- **Flow** = per-stamp opacity (Smart Hachure per-region modulation, driven by source darkness)

Smart Hachure should adopt this naming explicitly so user mental model maps to existing conventions. Do not label both axes "intensity."

---

## Proposed contract revisions

Below is what should change in `09-LOCKED-MODEL.md` after Sebs reviews this audit and makes the D-1…D-9 decisions in the next section.

### Additions to §1 (What the system does)

**Per-region output, revised axis tuple:**
```
AxisTuple = (gap, weight, layers, pressure, opacity)
```
(`color` becomes a derived signal — palette inheritance — not a primary axis. See H-2.)

**Two-pass rendering contract:**
1. **Outline pass** — fillStyle-agnostic; reads `strokeWidth × palette × outline modifiers` only; never darkness-modulated.
2. **Fill pass** — runs the per-fillStyle model on regions with `fill ≠ none`; emits marks per the AxisTuple.

(Surfaced by Agent 1 A-1.)

**Performance budget (NEW INVARIANT — promote to §I):**

Full pipeline (signal extraction + classification gating + render-region for a 120-element SVG) completes within one frame budget (~16 ms) on the user's primary dev machine (2024 MacBook Air). External LLM/network calls forbidden at render time.

**Determinism (NEW INVARIANT — promote to §I):**

All randomness derives from a deterministic seed; no `Math.random()` outside the seeded RNG. Lesson from rough.js #211.

**DOM mutation contract (NEW INVARIANT — promote to §I):**

Signal extraction reads from an un-mutated source clone. Rendering mutates a parallel clone. The 2026-06-03 pre-pass fix becomes a load-bearing invariant, not a code-quality note.

**Pure functions / no module-level mutable state (NEW INVARIANT):**

Every per-region computation is a pure function. Multi-instance / multi-visitor renders run concurrently without state collision. Enables visitor-canvas multi-instance (downstream scope per Agent 1 E-2).

**Token-discipline invariant:**

Smart Hachure consumes locked-system tokens only (W1 / W1-D color tokens, locked type ladder, locked spacing). Smart Hachure never invents new tokens. Cross-system rule per `cross-system-rules.md`.

### Revision to §I-2 (identity-preservation invariant)

Add specific mechanism: **TAM-nesting per fillStyle (Praun et al. 2001).** When target darkness moves darker, the per-fillStyle model ONLY adds marks; never removes; never repositions. This is the computational backbone of the "dark stays dark" rule.

Specific per-band thresholds (carving suggested by Agent 1 C-6 + Agent 2 §C.3):

| Band | Source L (= 1 - L*) | Coverage range (cube root) | TAM stroke nesting |
|---|---|---|---|
| Near-white | 0.00–0.10 | 0–0.001 | empty (paper) |
| Light | 0.10–0.30 | 0.001–0.027 | hachure layer 1 (sparse) |
| Mid | 0.30–0.55 | 0.027–0.216 | hachure layer 1 (denser) |
| Dark | 0.55–0.80 | 0.216–0.614 | hachure layers 1 + 2 (cross direction) |
| Near-black | 0.80–1.00 | 0.614–1.000 | hachure layers 1 + 2 + 3 (third angle) |

These are starting carve points, not perfect — refined per fillStyle in research docs 10-16.

### Revision to §I-3 (slider as bias)

Add: sliders are quantized to **N discrete ticks** (default N=6, matching `feedback_more_toggle_options_better` standing rule). Each tick maps to a TAM-style mark-count band. Tick-to-tick transitions use Webb 2002 "threshold textures" pattern (deterministic seed-based cross-fade) to avoid banding.

Slider effect is bounded by the per-region identity band (I-2): a region in the "dark" band cannot have its rendered density driven into the "light" band by any slider position. Slider can vary density WITHIN the band — but the band edges are enforced floors/ceilings.

**Lightroom Flow vs Density adoption:**
- Global slider = "Density" (intensity ceiling)
- Per-region modulation = "Flow" (driven by source darkness, automatic)
- Future per-stroke pressure = "Pressure" (third label)
- DO NOT collapse all three to "intensity."

### Additions to §3 (Signal extraction)

The extractor produces, per region:

**Source signals:**
- `darknessL ∈ [0, 1]` — perceived darkness; **linear-light mixing, then OKLab L conversion**, not sRGB compositing (Agent 2 §C.1, C.2)
- `colorHueL, colorChromaC` — for palette-aware mark color (palette inheritance, not axis modulation in v1)
- `alpha ∈ [0, 1]` — fill opacity / color-mix transparency
- `band ∈ {paper, light, mid, dark, near-black}` — identity band (I-2 enforcement)
- `bbox`, `area`, `aspectRatio`, `perimeter` — geometry
- `containedInZIndex`, `enclosesSiblingCount`, `isPartOfStripeCluster` — topology
- `hasFill`, `hasStroke`, `fillRule (even-odd | nonzero)`, `strokeWidthAuthored`, `hasDasharray` — stylistic
- `tag` — element type
- `confidence ∈ [0, 1]` — extractor's confidence in the darkness signal (low when source uses unresolvable refs)

**Source format resolution:**
- W1 token detection (`var(--dir-text-primary)` etc.) via explicit table — matches legacy `fillDarknessFactor`
- `color-mix(in oklab, TOKEN N%, transparent)` percentage extraction
- Hex/rgb/hsl direct parse via culori (linear-light → OKLab L)
- `currentColor` resolved via `getComputedStyle` against inherited color
- CSS-class-only fills resolved via `getComputedStyle(el).fill`

**Coordinate normalization (Agent 1 B-7, Agent 3 §E):**
- All geometric calculations occur in user-space; transforms flattened via `el.getCTM()` composition before signal extraction
- `hachureGap` and `weight` always in user-space units (never viewport pixels)
- Calibration measurement accounts for `devicePixelRatio`

**Skip threshold:**
- `darknessL < 0.05` → output empty AxisTuple (paper white reservation; Agent 1 A-5, Agent 2 §C.3)

### Additions to §4 (Per-fillStyle research deliverables)

Each research doc MUST contain:

1. **Forward model + citation.** What is the parametric `source darkness → AxisTuple` function for this fillStyle? Cite primary source.
2. **Identity invariant per Praun nesting.** How does this fillStyle's mark set monotonically grow with darkness?
3. **Per-family calibration constant `k_family`** measured empirically against Macbeth grayscale.
4. **Primary axis declaration.** Per Agent 1 A-22: each fillStyle picks ONE primary density axis (gap-dominant, layers-dominant, weight-dominant, count-dominant). Secondary axes are dampened.
5. **`gap_min` and `gap_max` clamps** to prevent sub-pixel saturation (Yule-Nielsen analog) and visible scan-line discreteness.
6. **`sizeMul` curve** (Agent 1 A-6) so tiny bbox shapes don't get gap × 5.7× blowup.
7. **`weight ≤ 0.7 × gap` clamp** (Agent 1 D-5) preserved across all parallel-mark fillStyles.
8. **Angle policy.** Which fillStyles use `hachureAngle`? Which ignore it? (Agent 1 D-8.)
9. **Layer policy.** Layer count budget; layer-add monotonicity per identity invariant.
10. **Pressure semantics.** Concrete: what does `pressure` mean for THIS fillStyle? (Each-stroke alpha taper? perfect-freehand per-point taper? per-dot diameter variation?) Agent 1 D-1.
11. **Skip / fallback policy.** What does this fillStyle do for `area < threshold` (Agent 1 B-11), for `area > threshold` (B-12)?
12. **Visual validation table.** 6-darkness rendered patch reference: 0.0 / 0.2 / 0.4 / 0.6 / 0.8 / 1.0.
13. **Test pin matrix.** Per Agent 1 A-20: 6 representative test pins (framedFlyer, vinylLpSleeve, stackedSketchbooks, Polaroid, NES cartridge, PSA Charizard) — must pass visual validation before fillStyle ships.
14. **Slider-tick quantization.** 6+ discrete ticks per Agent 1 D-14, with each tick mapped to a measured ΔL* step.

### Additions to §5 (Per-fillStyle model implementations)

```ts
type AxisTuple = {
  gap: number;          // mark spacing px (user space)
  weight: number;       // stroke px (user space)
  layers: number;       // integer ≥ 0 (layer-add monotonic)
  pressure: PressureEnvelope; // see below
  opacity: number;      // alpha [0,1]
};

type PressureEnvelope = {
  shape: 'flat' | 'taper-start' | 'taper-end' | 'taper-both' | 'arc';
  intensity: number;  // [0, 1]
} | null;

type SliderBias = {
  densityTick: number;        // [0..N-1], default N=6
  weightBias: number;         // [-1, 1] user override, monotonic
  gapBias: number;            // [-1, 1] user override, monotonic
  layerBias: number;          // [-1, 1] user override, monotonic
};

type FillStyleModel = {
  fillStyle: FillStyleStep;
  // Pure function. No state. Same input → same output.
  compute: (signals: Signals, sliderBias: SliderBias) => AxisTuple;
  // Returns debug info in dev mode (Agent 1 F-12, recommendation re: trace)
  computeWithTrace?: (signals: Signals, sliderBias: SliderBias) => {
    tuple: AxisTuple;
    trace: { firedRules: string[]; intermediates: Record<string, number> };
  };
  // Default slider bias for this fillStyle (Agent 1 A-10 — style-preset auto-snap)
  defaultSliderBias: SliderBias;
};
```

**Renderer integration:**
- Pass overlay outlines as parallel clone; **never mutate source** (Agent 1 A-3 / A-8)
- Honor seed everywhere — fix rough.js dot-filler bypass (H-6)
- For `dots` fillStyle, replace rough.js scan-line+jitter with weighted Voronoi (Secord 2002) or CCVT (Balzer 2009) — H-6 / Agent 2 §G.4
- For pressure: integrate perfect-freehand per stroke (H-1 ambition; Agent 1 D-1; Agent 3 §G.7)

### Updates to §7 (Kill-list — what we tear out)

Already correct. Add explicit deferrals (move to §G):
- `risograph` color-modifier — separate Style axis, not fillStyle; orthogonal to Smart Hachure scope
- `wireframe`, `wet-ink`, `charcoal`, `newsprint` Style register — orthogonal to Smart Hachure; their compositions with fillStyle are out-of-scope for v1

### Updates to §8 (Implementation order)

Revised order with the Pass A/B/C findings folded in:

1. ✏️ Sebs review + sign off this audit doc (`18-scope-audit.md`).
2. ✏️ Revise `09-LOCKED-MODEL.md` §1–§7 per audit findings + Sebs's D-1…D-9 decisions.
3. ✏️ Rewrite `00-overview.md` to match revised contract; mark `06`/`07`/`08` superseded where they conflict.
4. 🗑️ Tear out `techniqueMap.ts` + `classifier.ts` per kill-list. Stub `selectTreatment` to throw.
5. 📚 **NEW: Write `17-research-source-extraction.md` FIRST** — extractor seeds every fillStyle.
6. 🛠️ Implement signal extractor against `17-research-source-extraction.md`. Visual validate (extracted darkness vs source visually inspected).
7. 📚 Write `10-research-hachure-tonal-density.md` per §4 schema. **Note: hachure first is SEQUENCING (Sebs currently testing on F3-B Trophy Wall with hachure), not primacy. All fillStyles equal-rank per Sebs's standing principle "each shading style needs its own research."**
8. 🛠️ Implement hachure `FillStyleModel`. Visual validate against 6-darkness reference table + 6 test pins.
9. ✅ Ship hachure end-to-end. Sebs sign-off.
10. 📚 + 🛠️ + ✅ Cross-hatch (doc 11) — its own fillStyle per D-4.b lock. Independent forward density model. Angle interaction (30°+ separation, Moiré) modeled per doc 11.
11. 📚 + 🛠️ + ✅ Dots (doc 12) — replace rough.js dot filler with Secord/CCVT.
12. Repeat per fillStyle (zigzag → dashed → solid → zigzag-line if kept).

---

## Edge-case policy table

Per Agent 1 §B + Agent 3 §E. Each row = one edge case + v1 rule + rationale.

| Edge case | v1 policy | Rationale |
|---|---|---|
| Overlapping z-stacked regions | Top element only; no compositing | Source SVG paint order already composites visually; smart layer reads the actual paint output |
| `clipPath` | Render marks clipped to region geometry (not over-draw + clipPath) | clipPath drops AA — clipped edges look chopped (W3C SVG masking spec) |
| `mask` | Pass-through (no Smart Hachure) | mask treats luminance as opacity; inverts intent; softens mark tips |
| `filter` (especially feDisplacement) | Pass-through (no Smart Hachure) | Unsafe to compose with hachure marks |
| `linearGradient` / `radialGradient` | Use average stop color as darkness signal | Quick approximation; perfect would require rasterization |
| `<pattern>` as fill | Pass-through (treat as opaque) | Patterns already author their own density; smart layer would over-mark |
| `currentColor` | Resolve via `getComputedStyle` at extraction time | Standard CSS inheritance semantics |
| CSS-class-only fills | Use `getComputedStyle(el).fill` not `getAttribute('fill')` | Computed style includes class-driven fills |
| Nested `<g>` transforms | Flatten via `el.getCTM()` composition before signal extraction | Otherwise translated groups produce wrong bbox |
| `<use>` references | Resolve to target before signal extraction | Browser does this for rendering; smart layer must walk resolved shadow tree |
| `<symbol>` definitions | Inert except via `<use>` | Standard SVG semantics |
| viewBox vs viewport coords | All math in user space; calibration measurement at display scale | Prevents weight/gap drift across zoom |
| Tiny shapes (area < 40 px²) | Solid fill at target L (no marks) | Coverage statistics noisy; tonal model unstable (Agent 2 §7) |
| Huge shapes (gap cap at 12 px) | Cap density-driven gap | Lines become visibly discrete; user reads as "darker hatched area" not literal target L (Agent 2 §7) |
| Stroke-only paths (`fill=none`) | Outline pass only; no fill marks; outline weight from user slider, NOT darkness | Source authored its weight; respect (Agent 1 B-13) |
| `even-odd` vs `nonzero` fill rule | Normalize winding before scan-lining; honor source `fill-rule` | Avoid odd/even bugs at corners |
| Self-intersecting / exact-corner polygons | Jitter scan-line position by ε | Inkscape hatch-fill documents this exact bug |
| Browser AA / DPR variance | Calibration cache keyed by `(UA, DPR, ink-token)` — deferred to v2 calibration loop | Agent 5 §7 |
| W1-D dark direction | Use computed style; CSS var inheritance handles flip automatically | If extractor reads computed style, direction flip is transparent |
| Multi-instance / visitor canvas | Pure functions throughout; no module-level mutable state | Already covered by new §I invariant |

---

## Decisions only Sebs can make (D-1…D-9)

These are forks in the road where multiple consistent contracts exist. Pick one per row before sign-off; the chosen rule lands in `09-LOCKED-MODEL.md`.

### D-1. Style × fillStyle scope (LOCKED via "follow recommendations" 2026-06-04)

**LOCKED: D-1.b.** Smart Hachure runs across ALL mark-bearing Styles. fillStyle and Style are conceptually orthogonal:
- **fillStyle** = mark grammar (what the marks STRUCTURE as — hachure / cross-hatch / dots / etc.)
- **Style** = render register (HOW each mark renders — rough-handdrawn / wet-ink / charcoal / risograph / newsprint / stipple)

Compositions are valid: wet-ink × hachure = parallel hachure lines drawn with bleeding wet-ink stroke. Charcoal × dots = dots drawn with soft chalky stroke. Risograph × cross-hatch = cross-hatched marks with layered registration offset. Each Style × fillStyle pair is a real renderable thing.

**Style scope breakdown:**
- Marks bypass entirely: `clean`, `outline-only`, `wireframe` (no marks structurally)
- Marks replaced by solid fill: `bold-ink` (degenerate — Smart Hachure detects region, renders solid)
- Marks suppressed by Style register: `sketchy` (explicit outline-leaning per spec, no fill marks)
- Marks render with Style register applied: `rough-handdrawn`, `wet-ink`, `charcoal`, `risograph`, `newsprint`, `stipple`

**Architecture:**
- fillStyle research docs (10-16) = tonal density model per mark grammar; output is the 6-axis tuple regardless of Style
- Style render registers = HOW each tuple emits visually (jittered straight stroke vs bleeding stroke vs chalky stroke vs registration offset vs halftone-pattern overlay)
- Composition is at render time: fillStyle picks mark structure, Style picks mark rendering

Closed options (kept for record):
- ~~D-1.a~~ — rejected: shrinks scope below standing direction "each shading style needs its own research."
- **D-1.b (LOCKED)** — Full Style × fillStyle matrix as architecture; sequenced implementation.
- ~~D-1.c~~ — rejected: collapses user-facing taxonomy, violates I-1.

**Implementation sequencing (not primacy):** rough-handdrawn × hachure ships first (Sebs's current F3-B Trophy Wall test surface), then rough-handdrawn × cross-hatch, then rough-handdrawn × dots, etc. Style register research (wet-ink / charcoal / risograph / newsprint / stipple as registers) sequences AFTER core fillStyle research lands. Architecture is committed v1; implementation is staged.

### D-2. Axis tuple: full 6-axis (LOCKED via drift correction)

**LOCKED: D-2.c** by Sebs 2026-06-04 (via drift audit). Restore both `layers` (from agent convergence + practitioner hatching convention) and `color` (from Sebs's explicit naming "line thickness gap pencil pressure color"). Drop nothing.

**Final tuple: `(gap, weight, layers, pressure, color, opacity)`.**

Closed options (kept for record):
- ~~D-2.a~~ — was: restore layers, drop color. Rejected: drops something Sebs explicitly named.
- ~~D-2.b~~ — was: keep color, drop layers. Rejected: drops agent convergence + practitioner hatching convention (dark=3-5 layers, mid=1-2, light=none).
- **D-2.c (LOCKED)** — All 6 axes ship in v1.

**Implication:** contract §1 + §5 update from 5-axis to 6-axis. Each fillStyle research doc specs all 6 axes.

### D-3. Slider naming convention (LOCKED via "follow recommendations" 2026-06-04)

**LOCKED: D-3.a.** Adopt Lightroom Flow vs Density vocabulary in documentation and contract language to distinguish where a control acts in the pipeline. Does NOT change the user-facing slider count — all ~13 sliders stay per `feedback_more_toggle_options_better`. The vocab is for internal disambiguation:
- **Density-class** sliders = global ceiling on effect (e.g. Ink Intensity acts like Density)
- **Flow-class** = per-region modulation, driven by source darkness (the smart layer does this automatically)
- **Pressure-class** = per-stroke modulation (perfect-freehand envelope per D-6.b)

User-facing slider labels stay literal (Hachure Gap, Fill Density, etc.). The Density/Flow/Pressure taxonomy lives in the contract + research docs, not in chrome labels.

Closed options:
- **D-3.a (LOCKED)** — Lightroom vocab in internal docs.
- ~~D-3.b~~ — keep current naming only; doesn't disambiguate pipeline stage.

### D-4. Cross-hatch as fillStyle vs. as layer-add on hachure

**LOCKED: D-4.b** by Sebs 2026-06-04. Cross-hatch is its own user-facing fillStyle. I-1 ("user's fillStyle dropdown is sacred") forbids collapsing the user's choice. Doc 11 ships as its own research deliverable. TAM nesting (Praun 2001) still describes the internal math — how cross-hatch's layer count grows monotonically with darkness — but cross-hatch is NOT structurally hachure-with-layers=2. Angle interaction (Moiré, 30°+ separation rule) needs its own forward model.

Closed options (kept for record):
- ~~D-4.a~~ — was: cross-hatch as internal layer-add on hachure. Rejected: drift toward overriding user's fillStyle choice, violates I-1.
- **D-4.b (LOCKED)** — Cross-hatch is a separate fillStyle with its own model + research doc 11.

**Implication for next-step research:** Doc 11 (`11-research-cross-hatch-tonal-density.md`) covers the cross-hatch forward density model independently of doc 10 (hachure). Both apply TAM nesting internally; both are user-pickable; the user picks WHICH family at the dropdown, the system NEVER swaps between them.

### D-5. Slider quantization (LOCKED via "follow recommendations" 2026-06-04)

**LOCKED: D-5.a.** 6+ discrete ticks per slider, matching `feedback_more_toggle_options_better` standing direction. Each tick maps to a TAM-style mark-count band (Praun 2001 nesting); Webb 2002 threshold-texture cross-fade between ticks avoids banding artifacts. Internal density gradient (per region) stays continuous within each tick's band.

Closed options:
- **D-5.a (LOCKED)** — 6+ discrete ticks per slider.
- ~~D-5.b~~ — continuous; rejected, per-region failures more likely at fine increments.

### D-6. Pressure shipping in v1

**LOCKED: D-6.b** by Sebs 2026-06-04. Pressure is one of the 5 axes in the AxisTuple per D-2.a. Shipping without it means shipping a 4-axis system that isn't what we agreed to. Engineering effort is not a v1/v2 boundary; pressure is in scope from day one. Concrete integration path: perfect-freehand per stroke, formula `r(pressure) = (size/2) * (1 - thinning * (1 - easing(pressure)))` (Agent 2 §B.10), `thinning` becomes a user-exposed knob. Each fillStyle's research doc (§4) must spec pressure semantics (per-stroke alpha taper for hachure/cross-hatch/dashed/zigzag/zigzag-line; per-dot diameter variation for dots; ignored for solid).

Closed options (kept for record):
- ~~D-6.a~~ — was: defer perfect-freehand to follow-up; ship flat-weight v1. Rejected: another drift toward "ship less than agreed." All 5 axes ship in v1.
- **D-6.b (LOCKED)** — Ship perfect-freehand per stroke in v1. Higher engineering lift but achieves the authored hand-feel + correct 5-axis tuple from day one.

**Implication for next-step research:** Doc 10 (hachure) must include pressure envelope spec; doc 11 (cross-hatch) inherits; doc 12 (dots) maps pressure → per-dot diameter; etc. perfect-freehand becomes a locked dependency in §5.

### D-7. Dots filler (LOCKED via "follow recommendations" 2026-06-04)

**LOCKED: D-7.a.** Replace rough.js dot filler with Secord weighted Voronoi stippling (NPAR 2002) or Balzer Capacity-Constrained Voronoi Tessellation (SIGGRAPH 2009). Real Poisson-disc-like distribution. Smart Hachure dots look unlike rough.js dots — supports the wedge against the field. Fixes rough.js #211 (dot filler bypasses seeded RNG) as a side effect because we own the algorithm.

Closed options:
- **D-7.a (LOCKED)** — Secord/CCVT Poisson-disc.
- ~~D-7.b~~ — keep rough.js dots; rejected, visually inferior + maintains the rough.js dot tell.

### D-8. Risograph + newsprint + stipple research scope (LOCKED via D-1.b)

**LOCKED via D-1.b cascade.** Each Style render register needs its own research doc. Newsprint, risograph, charcoal, wet-ink, stipple as Style registers are IN-SCOPE for Smart Hachure architecture; each documents how its register renders the 6-axis output. Sequencing: fillStyle research (docs 10-16) ships first; Style register research (docs 19+, numbered per integration order) follows.

Implementation cost is bounded by sequencing — we commit to the architecture, then ship one register × one fillStyle pair at a time. No deferral of scope; only staging of implementation.

Tasks #41+ will track per-Style-register research as they sequence in.

### D-9. Override store scope in v1 (LOCKED via drift correction)

**LOCKED: D-9.c** by Sebs 2026-06-04 (via drift audit). Full override store + JSON export + git-commit flow per Agent 4 §6 ships in v1. Manual region-pin of the AxisTuple persists to localStorage; user-triggered JSON export commits canonical overrides to the repo.

Closed options (kept for record):
- ~~D-9.a~~ — was: override store in v1, JSON export deferred. Rejected: deferring agreed-upon architecture scope.
- ~~D-9.b~~ — was: defer override store entirely. Rejected: it's already shipped + part of architecture.
- **D-9.c (LOCKED)** — Full override architecture (store + JSON export + git-commit) per Agent 4 §6.

---

## Items correctly omitted (out-of-scope for v1)

Confirming the contract's §G:

- **9-role TonalRole taxonomy** — replaced by direct `Signals → AxisTuple` mapping per fillStyle. Safe defer.
- **`BASE_BY_ROLE` table** — same as above.
- **Role-multiplier × slider math** — replaced by SliderBias + per-fillStyle compute. Safe defer.
- **Confidence threshold-based fallback to `paper`** — killed with classifier. Per-region darkness IS the signal. Safe defer.
- **Decision tree / ML model (doc 07 v3)** — requires override corpus that doesn't exist. Safe defer.
- **Cached LLM build-time pre-pass (doc 07 v2)** — adds external dependency without proving v1 model. Safe defer.
- **Personal sketch-style ML training (task #30)** — different scope, different data, different deployment. Safe defer per §6.
- **Hero randomization (Concept A)** — hero composition decision, separate from Smart Hachure. Must not preclude (does not).
- **Visitor canvas (Concept B)** — backend + ingest pipeline, separate workstream. Must not preclude (does not).
- **SVG ↔ 3D bridge / EdgesGeometry projection** — Phase 3 of F3-toggle-architecture, behind F3-A SVG and F3-B SVG completion. Safe defer with note: when 3D Path 1 implements its own shading register, Smart Hachure invariants port (per `project_f3_shading_port_to_3d.md`).
- **Edge falloff width** — not in NPR canon; safe defer.
- **Calibration feedback loop (Agent 5 §5)** — doc 06 explicitly defers to v2. Constraint: UA-keyed cache when v2 implements (Agent 1 B-14).
- **Author-intent uncertainty policy (Agent 3 §8)** — bound to dead classifier. Safe defer.

---

## Decisions baked-in (not asking — confirming)

- W1 + W1-D ink palettes are honored via CSS var inheritance; extractor reads computed style.
- Library set locked: rough.js + perfect-freehand + svgson + culori. Rejected: p5.brush (p5-bound), react-rough-fiber, roughViz, Textures.js. **NEW: vendor rough.js (or fork specific fillers) to fix #211 dot seed bug + #65 cutoff if v2 is unmaintained.**
- File location: `apps/Hero-8-Lab/src/app/lib/smartHachure/`.
- Sliders live in Hero8Shell chrome (`feedback_toggles_always_in_chrome`).
- Test pin matrix: framedFlyer · vinylLpSleeve · stackedSketchbooks · Polaroid · NES cartridge · PSA Charizard (per doc 06).
- Playground hand-feel constants are upstream authority for hand-feel calibration (F3-shading-calibration-spec §0).

---

## References (cited only — full source lists in agent transcripts)

**Academic (Pass B):**
- Praun, Hoppe, Webb, Finkelstein 2001. "Real-Time Hatching." SIGGRAPH 2001. https://gfx.cs.princeton.edu/proj/hatching/hatching.pdf
- Webb, Praun, Finkelstein, Hoppe 2002. "Fine Tone Control in Hardware Hatching." NPAR 2002. https://gfx.cs.princeton.edu/pubs/Webb_2002_FTC/Webb_2002_FTC.pdf
- Winkenbach & Salesin 1994. "Computer-Generated Pen-and-Ink Illustration." SIGGRAPH '94. https://grail.cs.washington.edu/projects/cg-illus/
- Salisbury et al. 1994. "Interactive Pen-and-Ink Illustration." SIGGRAPH '94. https://grail.cs.washington.edu/projects/int-illus/
- Salisbury et al. 1996. "Scale-Dependent Reproduction of Pen-and-Ink Illustrations." SIGGRAPH '96.
- Secord 2002. "Weighted Voronoi Stippling." NPAR 2002. https://www.cs.ubc.ca/labs/imager/tr/2002/secord2002b/secord.2002b.pdf
- Balzer, Schlömer, Deussen 2009. "Capacity-Constrained Point Distributions." ACM SIGGRAPH 2009.
- Hertzmann 2003. "A Survey of Stroke-Based Rendering." IEEE CG&A 23(4). https://www.dgp.toronto.edu/~hertzman/sbr02/hertzmann-cga03.pdf
- Murray-Davies equation: https://cmykhistory.com/murray-davies-equation-origin-story/
- Yule-Nielsen modification: https://hal.science/hal-00962258
- CIELAB / OKLab / JND: standard references via Wikipedia color-difference + CIEDE2000 demystified.

**Practitioner (Pass C):**
- rough.js source: https://github.com/rough-stuff/rough — issues #65, #74, #211, #237
- Preet Shihn — rough.js algorithms: https://shihn.ca/posts/2020/roughjs-algorithms/
- perfect-freehand: https://github.com/steveruizok/perfect-freehand
- p5.brush: https://github.com/acamposuribe/p5.brush
- Procreate Brush Studio: https://help.procreate.com/procreate/handbook/brushes/brush-studio-settings
- Procreate Folio Hatching Rules: https://folio.procreate.com/discussions/10/28/27726
- Concepts Halftone Brushes: https://concepts.app/en/brushes/halftone-brushes/
- Clip Studio screentones: https://tips.clip-studio.com/en-us/articles/6227
- Lightroom Flow vs Density: https://hueandhatchet.com/lightroom-brushes-flow-vs-density/
- Inkscape Hatch Fill: https://wiki.evilmadscientist.com/Hatch_fill
- Sara Soueidan SVG coords: https://www.sarasoueidan.com/blog/svg-coordinate-systems/
- W3C SVG2 coords: https://www.w3.org/TR/SVG2/coords.html
- patternTransform browser inconsistencies: https://github.com/w3c/svgwg/issues/293

**Internal (Pass A):** see citations inline; sources are `00-overview.md`, agents `01–05`, architecture `06–08`, `F3-toggle-architecture.md`, `F3-shading-calibration-spec.md`, prior session SESSION-HANDOFF.

---

## Sign-off path

1. Sebs reads §H headlines + D-1…D-9 decisions.
2. Sebs decides D-1…D-9 (or proposes additional options).
3. I revise `09-LOCKED-MODEL.md` §1–§7 per the decisions.
4. Sebs reviews revised contract; checks the 4 sign-off boxes.
5. Then and only then — task #32 (tear-out) begins.

Until step 5, no code is touched.
