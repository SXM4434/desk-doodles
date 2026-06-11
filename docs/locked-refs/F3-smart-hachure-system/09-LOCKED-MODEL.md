# Smart Hachure — LOCKED MODEL (contract)

**Status: LOCK v2 2026-06-04** (v1 locked 2026-06-03; v2 folds in `18-scope-audit.md` findings + D-1 through D-9 decisions). Every implementation decision is checked against this doc. Drift from any statement = stop and re-verify with user before continuing.

This doc supersedes any conflicting statement in `00-overview`, `06-architecture-technical-core`, `07-architecture-ml-pipeline`, `08-vision-roadmap`. Where those drift, this wins. They get rewritten or marked superseded after sign-off (task #38).

---

## 1. What the system does

For each renderable region in an arbitrary input SVG: read source signals (darkness, color, alpha, geometry, topology, context). Output a per-region tuple across **6 axes** — `(gap, weight, layers, pressure, color, opacity)` — that, when rendered using the **user's chosen fillStyle** (mark grammar) and **user's chosen Style** (render register), reproduces source darkness as hand-drawn density.

The rendered density at every region must be perceptually equivalent to source darkness at that region, modulo the user's slider bias, with per-region perceptual identity preserved (see I-2).

**Two orthogonal user-facing axes (locked D-1.b):**

- **fillStyle = mark grammar.** What marks STRUCTURE as: hachure / cross-hatch / dots / zigzag / dashed / zigzag-line / solid / none. Output of the smart layer is the 6-axis tuple regardless of Style.
- **Style = render register.** HOW each mark RENDERS: rough-handdrawn / wet-ink / charcoal / risograph / newsprint / stipple / sketchy / bold-ink. The Style register applies per-mark visual treatment (jitter / bleed / chalk / registration offset / halftone).

Composition is at render time. fillStyle decides mark structure; Style decides mark rendering. Each is user-pickable; system never overrides either (I-1).

**Style scope breakdown:**
- Bypass entirely (no marks): `clean`, `outline-only`, `wireframe`
- Bypass fill marks (Style register suppresses): `sketchy`
- Replaced by solid fill (degenerate): `bold-ink` (Smart Hachure detects region, emits solid)
- Marks render with Style register applied: `rough-handdrawn`, `wet-ink`, `charcoal`, `risograph`, `newsprint`, `stipple`

**Two-pass rendering contract:**
1. **Outline pass.** fillStyle-agnostic. Reads strokeWidth × palette × outline modifiers only. Never darkness-modulated. Stroke-only paths (`fill=none`) get this pass and no fill marks.
2. **Fill pass.** Per-fillStyle model emits marks for regions with real fill. Style register applied per-mark at render.

---

## 2. The invariants (NEVER violate)

**I-1. The user's fillStyle dropdown AND Style dropdown are sacred.** Both dropdowns are user-pickable; system never silently swaps either. The chosen fillStyle picks mark grammar uniformly across all regions that get marked. The chosen Style picks render register uniformly across all marks.

**I-2. Source darkness owns per-region perceptual identity.** A region's source darkness assigns it a perceptual identity band: paper / light / mid / dark / near-black. The smart layer enforces the band. Sliders vary intensity WITHIN the band; cannot push a region across band boundaries. A region with source darkness 0.85 always reads as dark, no matter where any slider sits. Sliders DO affect every region (not no-ops); they're bounded by the band edges. Computational mechanism: TAM stroke-nesting (Praun et al. SIGGRAPH 2001) per fillStyle — as darkness moves darker, marks are only ADDED, never removed or repositioned.

Identity bands (carved per Agent 1 §C.6 + Agent 2 §C.3, refinable per fillStyle):

| Band | Source darkness (1 - OKLab L*) | TAM nesting starting point |
|---|---|---|
| Paper | 0.00–0.10 | empty (paper-white reservation) |
| Light | 0.10–0.30 | layer 1 (sparse) |
| Mid | 0.30–0.55 | layer 1 (denser) |
| Dark | 0.55–0.80 | layers 1 + 2 (cross direction for hachure-family) |
| Near-black | 0.80–1.00 | layers 1 + 2 + 3 |

**I-3. Sliders are BIAS within per-region bounds.** All ~13 sliders (Hachure Gap, Stroke Width, Fill Density, Roughness, Bowing, Curve, Multi-Stroke, Endpoint, Sketching Style, Pen Tip, Ink Intensity, Fill Opacity, Hachure Angle) stay per `feedback_more_toggle_options_better`. Each is quantized to 6+ discrete ticks (D-5.a). Slider effect is monotonic globally, bounded locally per region's identity band. Never multiplies per-region multipliers (the broken v1 pattern). Each tick maps to a TAM band; tick-to-tick transitions use Webb 2002 threshold-texture cross-fade to avoid banding.

**I-4. The intelligent layer ships intelligent at v1.** Per-region density model built on real per-fillStyle research (Murray-Davies forward, Yule-Nielsen `n`-correction, CIELAB L* cube root, TAM nesting, JND quantization, per-family `k_family` calibration). Not stubs. ML training defers ONLY for personal sketch-style adaptation (task #30, §6).

**I-5. Each mark family gets its own research and its own model.** Hachure ≠ cross-hatch ≠ dots ≠ zigzag ≠ dashed ≠ zigzag-line ≠ solid. Each has independent forward density math, identity invariant, calibration constant, validation. Shared interface (`Signals → AxisTuple`); distinct implementation. Same applies for Style render registers (see §4).

**I-6. Signal extraction is pre-pass; rendering mutates a parallel clone.** Signals computed against un-mutated source clone before any DOM mutation. Renderer mutates a separate clone. (The 2026-06-03 fix becomes a load-bearing invariant.)

**I-7. Determinism / seeded randomness everywhere.** All randomness derives from a deterministic seed; no `Math.random()` outside the seeded RNG. Includes vendor-fix for rough.js #211 (dot filler bypass).

**I-8. Pure functions / no module-level mutable state.** Every per-region computation is pure. Multi-instance / multi-visitor renders run concurrently without state collision. Enables visitor-canvas multi-instance.

**I-9. Token discipline.** Smart Hachure consumes locked-system tokens only (W1 / W1-D ink, locked type, locked spacing). Never invents tokens. Cross-system rule per `cross-system-rules.md`.

**I-10. Performance budget.** Full pipeline (signal extraction + render-region for a 120-element SVG) completes within one frame budget (~16ms) on a 2024 MacBook Air. No external LLM/network calls at render time.

**I-11. Wobble = path/motion master. Roughness = surface texture axis (future repurpose).** Sebs's mental-model lock 2026-06-04.

**Wobble** defines WHERE the stroke's path goes in 2D space. Geometric path waviness — the trajectory wanders. A scalar `0-2` that multiplies the per-shape calibrated bases (`HAND_FEEL_BASE`). The per-shape bases (`rect: 2.4, oval: 2.4, diamond: 2.0, line: 1.4, orthogonal: 1.6` per `handFeel.ts:397-408`) are SACRED RATIOS — wobble preserves them while scaling. Without wobble the system has independent knobs instead of a connected ecosystem. Chrome shows EXCALIDRAW_WARN at wobble > 1.4 (signature-zone breakdown). Wobble drives BOTH the shape-primitive points-based jitter AND rough.js's `<path>` content jitter via the `roughness` rough.js parameter — so wobble is uniform across all renderable content. Size-aware clamp: `effectiveWobble(userWobble, bboxMin) = min(userWobble, max(0.3, bboxMin/60))` because hero pins are 60-80px vs playground's 100-300px content; same amplitude reads chaotically on small pins without the clamp.

**Roughness** (3D PBR-style surface property) controls the STROKE'S SURFACE quality along the trajectory wobble defines. Borrowed conceptually from 3D rendering where roughness controls diffuse light scatter (matte vs glossy). In 2D rendering this maps to: edge raggedness/serration, pencil-grain texture, variable ink density along the stroke, feTurbulence-style micro-displacement on stroke geometry. **Roughness does NOT move the path** — only wobble does that. Roughness shapes how the stroke RENDERS along that path.

**Roughness is one knob in a MULTI-TOGGLE surface-texture system** (revised 2026-06-08 per Sebs after audit surfaced stipple already wiring roughness). The system composes:
- `texture` — categorical: paper-tooth · chalky · ribbed · stipple · wet-ink · smudge · canvas · light · heavy · none. Selects the substrate / mark grammar.
- `textureIntensity` — slider: 0-3. Multiplies the active texture's displacement scale.
- `roughness` — slider: 0-2. Modulates **per-stroke surface character** (edge raggedness, pencil grain, ink-density variation) ORTHOGONAL to texture's substrate choice.
- (future Cluster 4 additions: `grainIntensity`, `smudgeAmount`, `pressureVariance` already in spec; will compose into the same system.)

The three (texture · textureIntensity · roughness) must work together — picking `texture=paper-tooth` at `textureIntensity=1.5` with `roughness=0.8` reads as "medium-rough strokes on paper-tooth substrate." Picking the same texture at `roughness=0` reads as "clean strokes on paper-tooth substrate" — substrate same, stroke surface clean. The slider lets the user dial stroke-grain INDEPENDENTLY from substrate choice.

**Current wiring state** (2026-06-08):
- Wobble: fully wired across all rough-family styles (cluster 1 master).
- Texture: wired (cluster 4 head, 10 categorical options).
- TextureIntensity: wired (multiplies displacement).
- **Roughness: partially wired — stipple style consumes it for dot-scatter / stroke-grain (95/197 shapes respond). Rough-handdrawn / sketchy / bold-ink: not wired yet.** Slider visible but mostly no-op on those three; full integration tracked in Cluster 4 build (post-makeathon per current plan). Audit-catalog (`audit-runs/2026-06-08/report-stipple.json`) captures the exact responsive subset for the eventual classifier.

**Cluster placement (per I-13):**
- Wobble → Cluster 1 (Multi-Stroke) — path/trajectory master
- Roughness → Cluster 4 (Surface Texture) — surface quality, alongside texture/grain/blur/bleed/smudge/pressureVariance

Added 2026-06-04 per `19-research-cross-axis-interconnection.md` regression B.1 + Sebs's conceptual lock on wobble-vs-roughness as orthogonal axes (path vs surface, mirroring 3D PBR terminology).

**I-12. One render pipeline per primitive type.** Don't fork "shape primitives → points-based" vs "path primitives → rough.js options". Sample paths to polylines and route through the same `protrudeFor → corners → segment-shift → jitter → seed` chain that the playground uses for every primitive. Otherwise pair-wise interactions (endpoint × sketchingStyle compound, kink × loose-overlap fan-of-overshoots) silently break for path content. Added 2026-06-04 per `19-research-cross-axis-interconnection.md` regressions B.2 + B.4.

**I-13. Cluster-level features for the classifier.** The intelligent layer consumes cluster-level signals (Multi-Stroke, Pen Tip, Shading, Surface Texture, Color/Palette), not individual modifier values. Cluster taxonomy locked per `19-research-cross-axis-interconnection.md` §E. Chrome groups toggles by cluster; cluster master toggles render at the top of each group. Pair-wise + N-way interactions per §C/§D matrix fire across cluster boundaries when both toggles active.

**The 5 clusters + master per cluster:**

| # | Cluster | Master | Members | Role |
|---|---|---|---|---|
| 1 | **Multi-Stroke** | wobble | wobble · strokeCount · strokeWidth · endpointBehavior · sketchingStyle | Path/motion. Defines WHERE the stroke goes + how many layers stack + corner overshoot + per-layer pacing |
| 2 | **Pen Tip** | penTip | penTip · strokeWidth (shared with #1) · texture | Implement choice. Swaps render path from polyline to perfect-freehand polygon when ≠ plain |
| 3 | **Shading** | fillStyle | fillStyle · hachureGap · hachureAngle · fillDensity · fillOpacity · dot-params | Mark grammar for tonal regions. fillStyle ≠ none triggers hachure render via rough.js |
| 4 | **Surface Texture** | texture | texture · textureIntensity · blurAmount · bleed · grainIntensity · smudgeAmount · pressureVariance · **roughness** (partial — stipple style wires it for dot-scatter / stroke-grain 2026-06-08; rough-handdrawn / sketchy / bold-ink TBD) | Substrate / grain / surface quality. **MULTI-TOGGLE system** — texture (categorical) × textureIntensity (slider) × roughness (slider) must compose. See I-11 detail. |
| 5 | **Color/Palette** | inkIntensity | strokePalette · fillPalette · inkIntensity | Token-mapped color overrides. Mostly orthogonal to Clusters 1-4 |

**Pair-wise interactions WIRED in code** (per §C matrix → direct drives):

| A × B | Mechanism | Where |
|---|---|---|
| wobble × bowing | wobble adds control-point jitter, bowing adds perpendicular offset — both control points get both | `roughRectPathExtended` / `roughOvalPathExtended` / `roughLinePathExtended` in `f3HandFeel.ts` |
| wobble × curveTightness | tightness dampens BOTH wobble jitter scale AND bowing offset | same |
| strokeCount × endpointBehavior | each layer gets distinct seed → different jitter, same protrude amount → fan of overshoots at corners | `renderHandFeelShape` loop in `SvgStyleTransform.tsx` |
| strokeCount × sketchingStyle | per-layer transform (loose-overlap shift, parallel-pass scale, cross-hatch rotate) | `applyLayerTransform` |
| strokeCount × penTip | each layer renders as separate perfect-freehand polygon | renderHandFeelShape (usePenTip branch) |
| strokeWidth × penTip | strokeWidth × penTip's sizeMul (~10× range from fineliner small to charcoal large) | `penTipPath` |
| endpointBehavior × sketchingStyle | corners protrude FIRST, then loose-overlap shifts endpoints along segment direction (compound) | shape primitives' `roughRectPoints` etc. + path branch's polyline sampler |
| sketchingStyle × layerIndex (loose-overlap) | first/last endpoint shifts proportional to layer N | `buildPoints` closures honor `mods.layerIndex` |
| fillStyle × hachureGap × hachureAngle | hachure render fires only for hachure/cross-hatch/dashed/zigzag-line; angle ignored for dots/zigzag | `renderHandFeelShape` hachure branch + chrome conditional rendering |
| fillOpacity × hachureGap | fillOpacity multiplies hachure group opacity | `hachureG.setAttribute('opacity', m.fillOpacity)` |
| penTip × texture | texture filter wraps the geometry group AFTER penTip swap; both compose | `applyTexture` after render |

**N-way compounds WIRED** (per §D):

- **wobble × strokeCount × endpointBehavior** — wobble drives jitter, strokeCount stacks layers, endpoint pushes corners → playground "weight at corners" feel. EXCALIDRAW_WARN at wobble > 1.4.
- **strokeCount × sketchingStyle × endpointBehavior** — the headline "fan of overshoots" compound. Loose-overlap layer shift × per-layer different jitter × protrude amount → corner fan grows per layer. Wired for shape primitives AND path content (Day 2 polyline sampler).
- **penTip × strokeCount × sketchingStyle × texture** — pen-tip swaps to perfect-freehand polygons, sketchingStyle transforms layers, texture filter wraps. Most expressive 4-way compound.
- **wobble × strokeCount × strokeWidth** — stableLayerNudge ensures visible layer separation at low wobble/strokeWidth (single-pass only per I-14).

**I-14. sketchingStyle owns layer transform exclusively.** When `sketchingStyle !== 'single-pass'`, no other modifier may apply layer-offset translations. The `stableLayerNudge` (added to make multi-stroke visible at low roughness for `single-pass`) becomes a permanent invariant ONLY for `single-pass`; for non-`single-pass` styles, sketchingStyle's own transform owns the offset. Fixes `19-research-cross-axis-interconnection.md` regression B.3.

---

## 3. Source signal extraction (shared, fillStyle-agnostic)

Per region, the extractor produces:

**Source signals:**
- `darknessL ∈ [0, 1]` — perceived darkness (1 - OKLab L*); linear-light mixing, never sRGB compositing
- `colorHueL ∈ [0, 360]`, `colorChromaC ∈ [0, ?]` — for color-axis modulation (palette-aware mark color)
- `alpha ∈ [0, 1]` — fill opacity / color-mix transparency
- `band ∈ {paper, light, mid, dark, near-black}` — identity band (I-2 enforcement)
- `bbox`, `area`, `aspectRatio`, `perimeter` — geometry in user space
- `containedInZIndex`, `enclosesSiblingCount`, `isPartOfStripeCluster` — topology
- `hasFill`, `hasStroke`, `fillRule ∈ {even-odd, nonzero}`, `strokeWidthAuthored`, `hasDasharray` — stylistic
- `tag` — SVG element type
- `confidence ∈ [0, 1]` — extractor's confidence (low when source uses unresolvable refs)

**Source format resolution:**
- W1 token detection (`var(--dir-text-primary)` etc.) via explicit table — matches legacy `fillDarknessFactor`
- `color-mix(in oklab, TOKEN N%, transparent)` percentage extraction
- Hex/rgb/hsl direct parse via culori (linear-light → OKLab L*)
- `currentColor` resolved via `getComputedStyle` against inherited color
- CSS-class-only fills resolved via `getComputedStyle(el).fill`

**Coordinate normalization:**
- All geometric calculations in user space; transforms flattened via `el.getCTM()` composition before signal extraction
- `gap` and `weight` always in user-space units (never viewport pixels)
- Calibration measurement accounts for `devicePixelRatio`

**Skip threshold:**
- `darknessL < 0.05` → output empty AxisTuple (paper-white reservation, per Agent 1 §A-5 + Agent 2 §C.3)

No role-tagging. No 9-tier taxonomy. The extractor produces signals; downstream consumes them.

---

## 4. Research deliverables

Each must be a written research doc with verifiable citations BEFORE its model implementation. No name-dropping precedents to backfill (`feedback_research_first_no_fake_provenance`).

**Pre-fillStyle (foundation):**

| File | Scope |
|---|---|
| `17-research-source-extraction.md` | Signal extractor reference. W1 var() resolution, `currentColor`, CSS-class fills, linear-light → OKLab L*, transform flattening, coordinate normalization. Ships FIRST — extractor seeds every fillStyle. |

**Per fillStyle (mark grammar models):**

| File | Scope |
|---|---|
| `10-research-hachure-tonal-density.md` | Murray-Davies forward, Yule-Nielsen `n`-correction, CIELAB L* cube root, TAM nesting, gap × weight × layers × pressure × angle curves. Agent 5 doc is seed. |
| `11-research-cross-hatch-tonal-density.md` | Own model per D-4.b. Two-pass forward density, 30°+ angle separation rule, Moiré model, per-pass interaction math. |
| `12-research-dots-tonal-density.md` | Secord weighted Voronoi / Balzer CCVT per D-7.a. Coverage fraction. Per-dot pressure → diameter mapping. |
| `13-research-zigzag-tonal-density.md` | Amplitude × frequency × stroke vs perceived darkness. Hachure with path-length multiplier. |
| `14-research-dashed-tonal-density.md` | Dash length × gap × stroke. Hachure with duty cycle. |
| `15-research-zigzag-line-tonal-density.md` | Single-line zigzag variant. |
| `16-research-solid-tonal-density.md` | Opacity-only. Color/alpha overlay math. Degenerate case. |

**Per Style register (mark rendering models):**

Numbered docs 19+, sequenced per integration order after core fillStyle research lands. Each covers one Style register's mark rendering (per D-1.b):

- rough-handdrawn (jittered straight stroke — existing playground constants are upstream authority)
- wet-ink (bleed envelope per mark)
- charcoal (chalky texture per mark)
- risograph (per-layer registration offset)
- newsprint (halftone-pattern overlay)
- stipple (intrinsic dots-like register)

**Per-doc schema (mandatory fields):**

1. **Forward model + primary citation.** Parametric `source darkness → AxisTuple` function (or `AxisTuple → render output` for Style registers). Cite primary source.
2. **Identity invariant.** How this fillStyle's mark set monotonically grows with darkness per TAM nesting.
3. **Per-family calibration constant `k_family`** empirically fit against a Macbeth grayscale strip.
4. **Primary axis declaration.** Per fillStyle: which axis is dominant for density (gap-dominant / layers-dominant / weight-dominant / count-dominant). Secondary axes dampened.
5. **`gap_min` / `gap_max` clamps** (prevent sub-pixel saturation analog of Yule-Nielsen and visible scan-line discreteness).
6. **`sizeMul` curve** for tiny-bbox shapes (Agent 1 §A-6).
7. **`weight ≤ 0.7 × gap` clamp** preserved across all parallel-mark fillStyles (Agent 1 §D-5).
8. **Angle policy.** Which fillStyles use `hachureAngle`? Which ignore it?
9. **Layer policy.** Layer count budget; monotonic add per identity invariant.
10. **Pressure semantics.** Concrete: per-stroke alpha taper? perfect-freehand per-point taper? per-dot diameter variation?
11. **Color semantics.** How `color` axis (hueDelta / satMul / lightDelta) applies in this fillStyle.
12. **Skip / fallback policy.** `area < threshold` → solid fill at target L. `area > threshold` → cap gap at ~12 px.
13. **Visual reference table.** 6-darkness rendered patches: 0.0 / 0.2 / 0.4 / 0.6 / 0.8 / 1.0.
14. **Test pin matrix.** Validates against framedFlyer · vinylLpSleeve · stackedSketchbooks · Polaroid · NES cartridge · PSA Charizard.
15. **Slider-tick quantization.** 6+ discrete ticks, each mapped to a measured ΔL* step.
16. **Validation method.** Offscreen rasterize → linearize → average Y → OKLab L* → compare to source L* within tolerance ΔL* ≤ 2.

---

## 5. Per-fillStyle model implementations

```ts
type AxisTuple = {
  gap: number;          // mark spacing px (user space)
  weight: number;       // stroke px (user space)
  layers: number;       // integer ≥ 0 (TAM-nesting; monotonically grows with darkness)
  pressure: PressureEnvelope; // perfect-freehand per stroke (D-6.b lock)
  color: ColorShift;    // hue/sat/lightness shift over palette-inherited base
  opacity: number;      // alpha [0, 1]
};

type PressureEnvelope = {
  shape: 'flat' | 'taper-start' | 'taper-end' | 'taper-both' | 'arc';
  intensity: number;  // [0, 1]
  thinning: number;   // perfect-freehand `thinning` ∈ [-1, 1]
} | null;

type ColorShift = {
  hueDelta: number;     // degrees, [-180, 180]
  satMul: number;       // multiplier, [0, 2]
  lightDelta: number;   // [-1, 1]
} | null;

type SliderBias = {
  // ~13 sliders, each quantized to 6+ ticks per I-3
  gapTick: number;
  weightTick: number;
  fillDensityTick: number;
  roughnessTick: number;
  bowingTick: number;
  curveTick: number;
  multiStrokeTick: number;
  endpointTick: number;
  sketchingStyleTick: number;
  penTipTick: number;
  inkIntensityTick: number;
  fillOpacityTick: number;
  hachureAngleTick: number;
};

type FillStyleModel = {
  fillStyle: FillStyleStep;
  // Pure function. No state. Same input → same output. Per I-7 + I-8.
  compute: (signals: Signals, sliderBias: SliderBias) => AxisTuple;
  // Dev mode trace
  computeWithTrace?: (signals: Signals, sliderBias: SliderBias) => {
    tuple: AxisTuple;
    trace: { primaryAxis: string; identityBand: string; clampsApplied: string[]; intermediates: Record<string, number> };
  };
  // Style auto-snap defaults per Agent 1 §A-10
  defaultSliderBias: SliderBias;
};

type StyleRegister = {
  style: F3SvgStyle;
  // Pure function from AxisTuple → render output. Per fillStyle output.
  renderMark: (axisTuple: AxisTuple, markGeometry: Path, ctx: RenderCtx) => SVGElement[];
};
```

**Locked dependencies:**
- rough.js (vendored where needed — fix #211 dot-filler seed bypass, #65 cutoff)
- perfect-freehand (pressure axis per D-6.b)
- svgson (SVG AST parsing)
- culori (OKLab + color parsing, treeshaken)
- Secord weighted Voronoi or Balzer CCVT implementation (replace rough.js dot filler per D-7.a)

---

## 6. Scope boundary — sketch-style ML (DEFERRED)

The "ML later" Sebs has referenced is the **personal sketch style training** mini-lab (task #30). Trains the renderer on his actual stroke style — different data, different model, different deployment. NOT part of Smart Hachure v1.

Smart Hachure v1 ships with:
- Real per-fillStyle tonal density models (§4 + §5)
- Real per-Style render registers (§4 + §5)
- No personal sketch-style adaptation

Sketch style training is a separate v2 layer that wraps the AxisTuple → render pipeline, not the density model itself.

---

## 7. Kill-list — what we tear out / never rebuild

**Tear out:**
- ❌ 9-role TonalRole taxonomy — gone.
- ❌ `BASE_BY_ROLE` table in `techniqueMap.ts` — gone.
- ❌ Role-multiplier × slider math — gone.
- ❌ Confidence threshold-based fallback to `paper` for moderately-dark regions — gone.
- ❌ "v1 stub, real model later" framing — never use this pattern.
- ❌ "rough.js handles cross-hatch internally" assumption — wrong; cross-hatch is its own fillStyle per D-4.b.
- ❌ "Collapse user-facing dropdown options into one model" — never. fillStyle and Style are user-picked; system never overrides.
- ❌ "Defer one of the 6 axes to v2" — never. All 6 axes ship in v1 per D-2.c.
- ❌ rough.js dot filler — replaced with Secord/CCVT per D-7.a.

**Keep useful code:**
- ✅ Source signal extractor in `signals.ts` — keep, this is the §3 deliverable (minus role-tagging fields)
- ✅ Override store + svg hash — keep per D-9.c; JSON export ships in v1
- ✅ Region path extractor in `renderRegion.ts` — keep, geometry conversion is fillStyle-agnostic
- ✅ Outline pass via legacy `transformElement` with `fillStyle='none'` — keep
- ✅ DOM mutation pre-pass (the 2026-06-03 fix) — keep, promoted to invariant I-6

---

## 8. Implementation order (locked)

1. ✏️ Sebs sign off this contract (the 4 sign-off boxes below).
2. ✏️ Rewrite `00-overview.md` to match this contract; mark `06`, `07`, `08` superseded where they conflict (task #38).
3. 🗑️ Tear out `techniqueMap.ts` + `classifier.ts` per §7 kill-list. Stub `selectTreatment` to throw (task #32).
4. 📚 Write `17-research-source-extraction.md` FIRST — extractor seeds every fillStyle.
5. 🛠️ Implement signal extractor against doc 17. Visual validate (extracted darkness vs source visually inspected).
6. 📚 Write `10-research-hachure-tonal-density.md` per §4 schema. **Note: hachure first is SEQUENCING (Sebs currently testing on F3-B Trophy Wall with hachure), not primacy. All fillStyles equal-rank.**
7. 🛠️ Implement hachure `FillStyleModel`. Visual validate against §4 6-darkness reference table + 6 test pins (task #34).
8. ✅ Ship hachure end-to-end. Sebs sign-off.
9. 📚 + 🛠️ + ✅ Cross-hatch (doc 11) — own fillStyle per D-4.b. Independent forward density. 30°+ separation Moiré model (task #35).
10. 📚 + 🛠️ + ✅ Dots (doc 12) — Secord/CCVT replacement per D-7.a (task #36).
11. 📚 + 🛠️ + ✅ Zigzag, dashed, solid (docs 13–16) (task #37).
12. 📚 + 🛠️ + ✅ Style registers (docs 19+) — rough-handdrawn first (existing playground is upstream authority), then wet-ink, charcoal, risograph, newsprint, stipple. Tasks created per register as sequencing reaches them.

One at a time. Real research, real validation, real sign-off per stage. No parallel ships.

---

## 9. Anti-drift discipline

Every code change in this rebuild prefaces with: "checking against LOCKED-MODEL §X: ..." If I cannot cite the section the change implements, I stop and re-read.

If Sebs says "build X," I check this doc first. If X conflicts, I name the conflict before I touch code.

If a research doc surfaces something that requires changing this contract, the change goes through Sebs sign-off. No silent doc edits.

**Specific drift patterns to watch (per `feedback_smart_hachure_drift_pattern`):**
- Proposing the system ships as LESS than what Sebs defined — either by collapsing user-facing choices ("internally these are the same") or by deferring agreed-upon scope ("v1 stub, real later")
- Recommending "defer this axis to v2" when the contract names all 6 axes for v1
- Recommending "collapse these fillStyles into one model" because internal math elegantly supports it (I-1 forbids)
- Recommending "defer this Style register" when D-1.b put it in scope

If I notice myself drafting any of these, STOP. Restate the contract section being violated. Ask Sebs before continuing.

---

## 10. Scope audit (COMPLETED 2026-06-04)

`18-scope-audit.md` written + reviewed. All findings folded into §1–§8 above. All D-1 through D-9 decisions locked (see audit doc for full breakdown):

- D-1: **D-1.b** — Smart Hachure across all mark-bearing Styles. Style × fillStyle architecture.
- D-2: **D-2.c** — 6-axis tuple `(gap, weight, layers, pressure, color, opacity)`.
- D-3: **D-3.a** — Lightroom Flow / Density / Pressure vocabulary in docs.
- D-4: **D-4.b** — Cross-hatch is its own fillStyle.
- D-5: **D-5.a** — 6+ discrete ticks per slider.
- D-6: **D-6.b** — perfect-freehand pressure ships in v1.
- D-7: **D-7.a** — Secord/CCVT replaces rough.js dot filler.
- D-8: **D-8 cascade via D-1.b** — each Style register gets its own research, sequenced.
- D-9: **D-9.c** — Full override store + JSON export + git-commit in v1.

---

**Sign-off (gated on §10 audit completion — DONE 2026-06-04)**

- [x] `18-scope-audit.md` written + reviewed
- [x] D-1 through D-9 locked
- [ ] Sebs has read the updated §1–§7 (this v2) and confirmed they describe his FULL intent
- [ ] Sebs has approved the §8 implementation order
- [ ] Sebs has approved the §9 anti-drift discipline

Until the final three boxes are checked, no code is touched.

---

## 11. Post-lock rulings

**R-1 · kink endpoint KEPT (2026-06-10, Sebs).** D-makeathon-6 had recommended dropping `kink` as a fake toggle (it rendered identically to `protrude` in both apps at the time). Code verification 2026-06-10 found the Day 9 drawn-canvas overhaul made it genuinely distinct: `applyEndpointBehavior` (SvgStyleTransform.tsx ~581-619) gives kink a random-angle push at EVERY anchor while protrude remains a structured endpoint extension — different geometry classes in all live render paths. Sebs confirmed KEEP. The Endpoint dropdown ships all four values (clean / protrude / long-overshoot / kink) as real options; D-makeathon-6's drop recommendation is closed-superseded.
