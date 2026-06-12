# 03 — The smart system (the rule-engine brain)

**In one sentence:** The smart system is a four-stage pipeline — extract signals → classify each region → select a treatment → render marks — where a rule engine (not ML) votes on what each SVG region *is*, and then decides how dense its hand-drawn shading should be, while your fillStyle and Style dropdowns stay sacred.

---

## Plain language

Think about how a **Substance Painter smart mask** works. You don't paint the dirt by hand — generators read *baked mesh maps* (curvature, AO, position) and decide where the grunge goes. You still pick the *material* that fills the mask. The smart system is exactly that pattern, applied to an SVG instead of a mesh:

| Substance Painter | Smart system |
|---|---|
| Baked mesh maps (curvature, AO, thickness) | **Signals** — darkness, size, containment, stroke style, extracted per region |
| Smart mask generators deciding *where* | **Classifier** — rule engine deciding which regions get shading and what tonal role they play |
| The material you pick to fill the mask | **Your fillStyle dropdown** — hachure / cross-hatch / dots / etc. The system never swaps it |
| The render engine drawing the result | **renderRegion** — rough.js actually drawing the marks |

Walk one shape through it. You drop an SVG of a Polaroid onto the desk:

1. **Signals (the baking pass).** Before anything is touched, the system walks every element in the SVG and *bakes* a frozen data record per region: how big is it, is it inside something else, does it enclose other things, is it part of a repeating stripe pattern, what's its fill, and — the key one — how *dark* is that fill perceptually. Darkness is computed in **OKLab**, a perceptual color space, so `darknessL` behaves like reading the **luminosity channel** in Photoshop rather than naive RGB math: 0 = paper, 1 = pure ink. This is "baking vs live materials" in the literal sense — the signals are pure serializable data with **zero DOM references**, captured from the *un-mutated* source before the renderer starts tearing the tree apart. Downstream stages depend on the baked snapshot, never on the live DOM.

2. **Classify (the voting brain).** Sixteen small rules each look at the signals and either stay silent or cast a vote: "this looks like a structural frame, confidence 0.85," "this is a dark inner band, 0.85," "this has a dasharray, it's a decorative accent, 0.85." Votes for the same role *stack* — like low-opacity layers in Photoshop accumulating toward full opacity — and the highest-scoring role wins. No rule knows any other rule exists, so there's no "rule A secretly overrides rule B" ordering bug. If nothing confident fires, the system **falls back to `paper`** — when in doubt, leave the paper white. Do less, never guess. (Non-destructive instinct, same as never flattening a layer you're unsure about.)

3. **Treatment (role → recipe).** The winning role looks up a base recipe — sparse-tonal gets wide-gap single-direction hatching, solid-content gets tight cross-hatch — then two modulation passes run on top: the user's Style choice (sketchy suppresses fills entirely; bold-ink swaps cross-hatch for solid; stipple swaps to dots), then the user's sliders (hachureGap, strokeWidth, fillDensity, inkIntensity, fillOpacity) fine-tune *within* the role's range. Perceptual guardrails clamp the result: line weight never exceeds 70% of gap (so hatch lines never merge into a solid blob), gap never drops below 1.5px (never optically blends) or exceeds 12px (stops reading as tone, starts reading as stray lines).

4. **Render (two layers, fixed paint order).** The original element is replaced by two stacks, exactly like a layered PSD: **fill marks underneath** (rough.js hachure clipped to the region's geometry), **jittered outline on top** (the legacy hand-feel pipeline with its fill suppressed so nothing double-paints). Both are stamped with `data-smart-*` debug attributes so you can audit every decision from DevTools.

### One brain, internally compartmentalized — your OOP framing

This is the framing you locked: the smart system is **one brain** but each module is sealed.

- **Encapsulation.** Modules only ever see *typed contracts*, never each other's internals. `signals.ts` emits `Signals`. `classifier.ts` consumes `Signals`, emits `Classification`. `techniqueMap.ts` consumes `Classification`, emits `Treatment`. `renderRegion.ts` consumes `Treatment`, emits SVG elements. The classifier has no idea rough.js exists; the renderer has no idea what a rule is. You could swap the rule engine for an ML model tomorrow and the renderer wouldn't notice — the contract is the boundary.
- **Ownership semantics — like memory ownership in C.** Each stage *owns* its output and hands it forward; downstream stages **read, never mutate**. The classifier owns `role` + `confidence`; the technique map reads them but never rewrites them. The treatment stages even enforce this internally — every modulation returns a *new* object via spread (`{ ...base, ... }`), never mutates the role table. Same deal in the chrome: each of the 5 modifier clusters (Multi-Stroke, Pen Tip, Shading, Surface Texture, Color/Palette — invariant I-13) owns its params; others read.
- **Message passing.** Data only moves by passing typed values forward. There is no shared mutable global the stages reach into (invariant I-8: pure functions, no module-level mutable state). That's what makes multi-instance rendering safe — two desk objects can classify concurrently without trampling each other.

### The sacred controls

The single most important political fact about this system: **it advises on density, it never overrides your authorship.**

- **I-1: fillStyle + Style dropdowns are sacred.** The classifier decides *whether* a region gets fill marks. The user's fillStyle decides *what grammar* those marks use. The narrow override in `index.ts` swaps only the mark grammar on regions the classifier already chose to fill — it never lifts gap/weight/opacity (those stay the classifier's tonal-density call), never recurses into `<g>` children, never forces marks onto no-fill roles (paper, frames, accents, lines, text).
- **Manual overrides always win.** The override store sits *outside* the provider chain. If you've hand-tagged a region's role, the classifier isn't even consulted — your tag returns at confidence 1.0. "Sebastian's authority is absolute, the algorithm is suggestion" — that's a literal comment in the source.

---

## The design — why it's built this way

**Why a rule engine and not ML?** Three reasons, all locked in the research docs. (1) *Trust + reversibility + authorship* — every classification carries `firedRules` provenance, so a wrong call has an audit trail you can read in DevTools; a neural net's wrong call is a shrug. (2) *No render-time network calls* (invariant I-10: the whole pipeline must fit in ~16ms per frame budget). (3) *The training data doesn't exist yet* — the `/audit` route's per-shape breakage catalog IS the dataset being built for the eventual smart layer; shipping ML before the dataset exists would be fake intelligence. The architecture pre-commits to the upgrade path instead: `ClassifierProvider` is a pluggable chain (v1 = rules only; v2 inserts a build-time cached-LLM pre-pass; v3 inserts a decision tree), and the `classifiedBy` field already enumerates all four sources.

**Why independent voting instead of if/else priority?** Hand-coded rule engines rot through ordering: rule 12 silently shadows rule 4 and nobody notices for a month. Here every rule fires independently, confidence *sums* per role, highest sum wins (capped at 1.0). Adding a rule can never break an existing rule's firing — only out-vote it, visibly, in the provenance.

**Why conservative fallback to paper?** A wrong "add marks" is far more destructive than a wrong "leave blank" — over-marking floods a drawing; under-marking leaves it clean. Below the confidence threshold (default 0.7), the system does nothing. Same philosophy as the mask/filter pass-through rule: elements carrying `mask` or `filter` attributes are left completely untouched, because composing generated marks with a luminance mask or feDisplacement inverts intent unpredictably.

**Why bake signals before mutating?** Hard-won bug, twice. `getBBox()` returns `{0,0,0,0}` on elements removed from the DOM — so if signals were extracted mid-mutation, element N's topology checks would see already-replaced siblings 0..N−1 as zero-sized, miss real containment, and classify every dark band as `paper` (the "no hachure, just outlines" bug of 2026-06-03). The fix — pre-pass extraction against the clean tree — got promoted to invariant I-6. This is the same reason you bake a texture before deleting the high-poly: the snapshot must not depend on the live source surviving.

**Why replace-don't-decorate?** The original element is removed and replaced by [fills] + [outline]. Keeping the original under the marks would double-paint fills (a solid black source rect under hachure = no visible hachure). The outline pass runs the *legacy* `transformElement` with `fillStyle: 'none'` forced, then defensively filters out any element that snuck through with a real fill — because nested `<g>` children carry fills the top level can't see.

**What was rejected:**

| Rejected | Why |
|---|---|
| Darkness-only classification (old `fillDarknessFactor`) | Can't distinguish a 1.0-darkness outer frame from a 1.0-darkness inner band — structural intent and tonal intent need separating. That's the whole reason roles exist. |
| fillStyle-switching per region | The original drift pattern (memory: `feedback_smart_hachure_drift_pattern`). The system picking different mark grammars per region violates I-1 — one user-chosen mark family, modulated on multiple axes. |
| Letting the user-pick override the tiny-shape clamp | Regions under 40px² render solid regardless of fillStyle pick — coverage statistics on discrete marks are too noisy at that size. That clamp is a perceptual constraint, not a grammar choice, so the pick doesn't override it. |
| `Math.random()` anywhere | I-7: all randomness is seeded (region path → djb2 hash → seed; fill seed offset by +7919 so it never collides with the outline seed). Same input → same drawing, every time. |
| SVG-wide rotation pivot for layered marks | Caused "top book rotating opposite of bottom book around a shared far pivot" chaos — each group computes its own pivot. |

---

## Technical

All module paths are under `src/app/lib/smartHachure/`.

### Module map — the chain in code

| Stage | File | Key exports | Contract in → out |
|---|---|---|---|
| Types (the contracts) | `types.ts` | `TonalRole`, `Signals`, `Classification`, `Treatment`, `Override`, `ClassifierProvider`, `OverrideStoreApi` | — |
| 1. Signals | `signals.ts` | `extractSignals`, `extractAllSignals`, `isRenderable`, `getRenderableChildren` | `SVGElement + ExtractionContext → Signals` |
| 2. Classify | `classifier.ts` | `classify`, `ruleEngineProvider`, `RULE_REGISTRY` | `Signals + ClassificationContext → Classification` |
| 3. Treatment | `techniqueMap.ts` | `selectTreatment`, `getBaseTreatmentForRole` | `Classification + SmartHachureStyle + ModifierSubset → Treatment` |
| 4. Render | `renderRegion.ts` | `renderRegion` | `SVGElement + Treatment + RenderContext → SVGElement[]` |
| Orchestrator | `index.ts` | `renderSmartHachure(svgRoot, fullModifiers, opts)` | mutates the SVG in place — **caller clones first** |
| Persistence | `overrideStore.ts` | `createOverrideStore`, `hashSvg`, `getOverridesForSvg`, `clearOverridesForSvg` | localStorage key `smartHachure.overrides.v1` |

### Entry point and gating

`renderSmartHachure` is called from exactly one place: `src/app/components/canvas/SvgStyleTransform.tsx:2138`, on a fresh clone (`cloneSvg`), gated by URL param `?smartHachure=1` (read once on mount, lines 2112–2117) AND one of the 4 rough-family styles (`rough-handdrawn | sketchy | bold-ink | stipple`, line 2121–2123). Ink color passed as `var(--dir-text-primary)` — token discipline (I-9).

### Stage 1 — signals (`signals.ts`)

- `extractSignals` (line 33): geometric (`bbox`, `area`, `aspectRatio`, `perimeter`), topological (`zIndex`, `areaFractionOfParent`, `enclosesSiblingCount`, `containedInZIndex`, `isPartOfStripeCluster`), stylistic (`fill`, `stroke`, `strokeWidthBin`, `hasDasharray`, `tag`, `opacity`, `fillOpacity`), perceptual (`darknessL`).
- `computeDarkness` (lines 240–271): resolution order is (1) explicit W1 token table (`--dir-text-primary` → 1.0, `--dir-detail` → 0.4, etc. — culori can't parse `var()`), (2) `color-mix(... N%, transparent)` percentage extraction, (3) culori OKLab L on direct color strings; returns `1 − L`. Unknown opaque colors fall to 0.75 (assume mid-dark).
- `resolveUrlFillDarkness` (line 295): `url(#...)` fills resolve their def — gradients average stop darkness × stop-opacity; `<pattern>` → 0 (patterns author their own density; the smart layer must not over-mark).
- `isRenderable` / `getRenderableChildren` (lines 388–401) are the **SHARED CONTRACT** — `index.ts`'s walk and `signals.ts`'s walk both use this single filter (skips `defs/style/title/desc/metadata/clipPath/mask/filter/gradients/pattern/symbol`); diverging filters would make region-path lookups silently fail.

### Stage 2 — classifier (`classifier.ts`)

- `classify` (lines 31–65), resolution order: **(1) override store wins** at confidence 1.0, `classifiedBy: 'manual-override'`; **(2)** walk the provider chain, first result with `confidence ≥ ctx.confidenceThreshold` wins (default threshold 0.7, set in `index.ts:68`); **(3) conservative fallback** → `{ role: 'paper', confidence: 0, firedRules: ['fallback:no-provider-confident'] }`.
- 16 rules in 7 clusters (lines 94–304):

| Cluster | Rules (id → role, confidence) |
|---|---|
| A — text | `text-label` → label-text, 0.95 |
| B — frames | `outer-frame-encloses-all` → structural-frame, 0.85 · `outer-frame-bordered-wash` → structural-frame, 0.75 |
| C — content | `inner-band-dark` → solid-content 0.85 · `inner-content-mid-tonal` → mid-tonal 0.7 · `inner-content-dense-tonal` → dense-tonal 0.75 · `inner-content-solid` → solid-content 0.8 · `inner-content-sparse-tonal` → sparse-tonal 0.7 |
| D — lines | `stroke-only-path` → line-decoration 0.85 · `stripe-cluster-member` → line-decoration 0.9 · `dashed-annotation` → decorative-accent 0.85 |
| E — accents | `tiny-decorative` → decorative-accent 0.65 |
| F — root tonal | `root-tonal-sparse` 0.55 · `root-tonal-mid` 0.55 · `root-tonal-dense` 0.55 |
| G — paper | `paper-near-zero` → paper, 0.9 |

- `ruleEngineProvider` (lines 315–351): all rules fire independently → `scores[role] += confidence` → best role wins → confidence capped at `Math.min(1, bestScore)`. Returns `null` (= "no opinion, delegate") if zero rules fired.

### Stage 3 — treatment (`techniqueMap.ts`)

- `selectTreatment` (line 45) = 3 pure stages: `BASE_BY_ROLE[role]` (lines 74–180; e.g. sparse-tonal = hachure, gap ×5.0, weight ×0.6, opacity 0.7, gap-dominant; solid-content = cross-hatch, gap ×0.9, weight ×1.2, weight-dominant) → `applyStyleModulation` (lines 189–212; sketchy zeroes fills, bold-ink swaps cross-hatch→solid +20% weight, stipple swaps→dots) → `applyModifierOverrides` (lines 226–272; slider math + clamps).
- Clamps in stage 3: tiny area `< 40px²` → forced `solid` · `effectiveGap = clamp(1.5, 12, hachureGap × gapMul)` · `effectiveWeight ≤ effectiveGap × 0.7`.

### Stage 4 — render (`renderRegion.ts`)

- `renderRegion` (line 40): `fillStyle === 'none'` → `[]` (caller keeps outline-only). Else `renderHachureFamily` (line 58) builds rough.js options: `stroke: 'none'`, `fill: ctx.inkColor`, `hachureAngle: -41 + 0.07` (deterministic ε so scan lines never pass exactly through polygon corners — the Inkscape stray-hachure bug; 18-scope-audit §H-6), `roughness: 0` on the hachure layer itself (clean parallel lines clipped to a jittered outline, not jittered hachure).
- Extra layers (`layerCount > 1`, skipped for cross-hatch which handles 2 directions internally): seed offset `+ i*100`, angle offset `+22°` per layer (lines 111–125).
- `extractRegionPath` (line 135) converts rect/circle/ellipse/polygon → path d-strings (circles via 4 cubic Béziers, κ = 0.5523); polyline/line → `null` (open paths can't be hachured).

### Orchestrator (`index.ts`)

- Pre-pass signal snapshot before any mutation (lines 87–99, the I-6 fix). viewBox as root parent bbox (lines 81–85 — without it `areaFractionOfParent` is 0 and the frame rule never fires).
- **The I-1 narrow fillStyle override, lines 171–185** — the four-line heart of the sacred-controls contract:
  - `userPick === 'none'` or classifier said no-fill → stays `'none'` (classifier owns "fillable or not")
  - tiny clamp active → classifier's pick survives (perceptual constraint beats grammar pick)
  - otherwise → `userPick` replaces the grammar, nothing else is lifted
- Outline pass via legacy `transformElement` with `fillStyle: 'none'` forced (line 114–117, 198), then fill-bearing elements filtered out (lines 199–209, text exempted).
- Diagnostic stamps (lines 226–236): `data-smart-role`, `data-smart-confidence`, `data-smart-fill-style`, `data-smart-gap`, `data-smart-weight` on fills; `data-smart-source-role`, `data-smart-source-darkness` on outlines.
- Edge-case conformance: `mask`/`filter` attrs → full pass-through (line 149); `clip-path` copied onto all generated marks (lines 241–246).

### Override store (`overrideStore.ts`)

- `createOverrideStore` (line 57): localStorage-backed, in-memory cached, `set` stamps `setAt` ISO timestamp + `setBy: 'manual'`. `exportToJson` pretty-prints for git; `importFromJson` throws on bad shape (never silently swaps state).
- `hashSvg` (lines 119–128): djb2 over `outerHTML`, unsigned, base36. Keys are `(svgHash, regionPath)` — e.g. `("k3x9z2", "rect[0]")`.
- Every `Override` carries a `signalsSnapshot` frozen at tagging time — each manual tag is one labeled training example for the future decision tree, in exactly the right shape.

---

## The six decision surfaces — this brain is not just about shading

Everything above describes the surface that's *built* (region shading). But the engine pattern — signals → classify → treatment, with a provider chain and one shared dataset — is the **one brain** that serves SIX decision surfaces (Sebs's scope lock, 2026-06-11):

| # | Decision surface | The question it answers | Status |
|---|---|---|---|
| 1 | **Marks / shading** | which regions get marks, how dense | **real — this page's code** |
| 2 | **Object identity** | *what is this drawing?* (a mug? a heart? furniture?) | planned — vision-LLM provider territory; feeds every surface below |
| 3 | **3D conversion routing** | Free Stroke easy-path vs cloud API; which geometry mode (Rod/Extrude/Solid/Inflate); which API + what prompt | planned — Smart Phase D, the Day 13 vision router |
| 4 | **Physics preset** | how should this object behave on the desk (heavy? bouncy?) | planned — Phase E |
| 5 | **Auto-picked toggles** | which style/fillStyle/texture/penTip suits this input | planned — Phase C |
| 6 | **Calibration auto-tune** | per-darkness gap/weight numbers | partially real — Phase 1A clamps; full coverageToParams is Phase A/B |

The point of the architecture is that these are **not six systems**. They're six *consumers* of the same machinery: the same Signals idea (measure the input), the same provider chain (cheap rules → trained model → rented frontier model), the same audit dataset training the same future model, the same interconnection graph registering their edges. Improve the machinery once — better calibration, learned rule weights, smarter cascading — and all six surfaces inherit it. That's the cash value of "one brain, many hands."

---

## Connections

This page is a hub — the smart system touches almost everything:

- **→ The render pipeline / SvgStyleTransform page.** `transformElement` is the smart system's outline subcontractor; `SvgStyleTransform.tsx:2138` is the only call site; the 5-cluster modifier state (`F3RoughModifiersContext`) feeds both paths. Edge: *delegates outline rendering to / gated by*.
- **→ The locked contract.** `docs/locked-refs/F3-smart-hachure-system/09-LOCKED-MODEL.md` — I-1..I-14 invariants + §7 kill-list + §11 post-lock rulings (R-1: kink endpoint KEPT 2026-06-10). Every change to this module must cite a section. Edge: *governed by*.
- **→ The audit/dataset page (`/audit` route, `DeskDoodlesAudit.tsx`, 197 shapes).** The per-shape breakage catalog is the bootstrap training dataset for the v2/v3 providers; the `signalsSnapshot` fields in `Classification` and `Override` exist specifically to feed it. Edge: *produces training data for / validated against*.
- **→ The hand-feel / wobble page.** Wobble (Cluster 1 master) drives the outline jitter the smart system requests via `transformElement`; I-11 locks wobble = path, roughness = surface. Edge: *composes with*.
- **→ The chrome page (`SmartHachureChrome.tsx` + `modifierSpecs.ts`).** Every slider in the Shading cluster lands in `ModifierSubset`; per-cluster collapse mirrors I-13's cluster taxonomy. Edge: *controlled by*.
- **→ The design-system page.** Ink color is always a W1 token (`var(--dir-text-primary)`); the darkness table in `computeDarkness` mirrors the W1 token ladder. Edge: *consumes tokens from*.
- **→ The research stack.** `docs/locked-refs/F3-smart-hachure-system/03-agent-research-svg-structural-signals.md` (signal catalog), `04-agent-research-classifier-architectures.md` (hybrid provider pattern), `18-scope-audit.md` (21-row edge-case policy table — most of the odd branches in `signals.ts`/`index.ts` cite its rows), `docs/research/21-research-3d-pipeline-and-style-translation.md` (the locked `coverageToParams` math for the v2 density models). Edge: *derived from*.
- **→ The 3D mode page (planned).** Per `project_f3_shading_port_to_3d`: every shading fix here must eventually port to the 3D path; per 21-research the 3D analog is screen-space hatching with TAM math in shader uniforms. Edge: *must stay in parity with*.
- **→ The generalization pattern.** `signals → classify → treatment → render` is a general decision pattern (memory: `project_generalizable_rendering_decision_pattern`) — Smart Hachure is the first concrete instance; the meta-engine is deliberately NOT pre-built. Edge: *first instance of*.
- **→ [15-the-smart-ml-ladder.md](15-the-smart-ml-ladder.md)** — the dated build sequence of this engine (smart-pick, coverage, golden gates, reliability, the post-makeathon trained ladder) plus "ahead on engines, behind on receipts." Edge: *the build plan for this engine*.
- **→ [13-the-3d-system.md](13-the-3d-system.md)** — Phase D2 (conversion semantics) is this engine's third decision surface, but with a register split: the UPLOAD register uses the classifier here verbatim, while the DRAWN register is a separate geometry/topology brain (the classifier misfires `paper@0.9` on stroke-only input). Edge: *third decision surface, register-split*.

---

## Honest status

**The shipping smart system is a RULE ENGINE. There is no ML anywhere in the running code.** Sixteen hand-written heuristics vote; that's the whole brain today. Everything below is labeled accordingly.

### Exists in code today (verified in source, 2026-06-10)

- Full 4-stage chain: `signals.ts` → `classifier.ts` → `techniqueMap.ts` → `renderRegion.ts`, orchestrated by `index.ts`, wired into the app at `SvgStyleTransform.tsx:2138` behind `?smartHachure=1` + 4 rough-family styles.
- 16-rule voting engine with confidence accumulation, provenance (`firedRules`), 0.7 threshold, conservative paper fallback.
- The I-1 narrow fillStyle override (`index.ts:171–185`) with tiny-clamp exception.
- OKLab darkness extraction incl. W1 tokens, color-mix, computed-style fallback, gradient/pattern url() resolution.
- Seeded determinism end-to-end (djb2 region-path seeds, +7919 fill offset, ε-guarded hachure angle); seeded dots via the runtime rough.js patch (`src/app/lib/patchRoughDots.ts`).
- Override store with localStorage persistence + JSON export/import + `signalsSnapshot` capture. **But: no chrome UI calls `overrideStore.set` yet** — the API is real and tested by the orchestrator's read path; tagging regions currently requires the console.
- Edge-case conformance for most of the 18-scope-audit policy table (mask/filter pass-through, clip-path copy, symbol skip, tiny-area solid clamp, 12px gap cap, computed-fill fallback).

### Planned — NOT in code (do not let any future page blur this)

- **The v2 contract itself.** `09-LOCKED-MODEL.md` §7 kill-list schedules the 9-role `TonalRole` taxonomy, the `BASE_BY_ROLE` table, and the threshold-fallback-to-paper for TEAR-OUT, replaced by per-fillStyle density models (`FillStyleModel.compute: Signals → AxisTuple`, §5) with identity bands (I-2) instead of roles. **The code you just read is the v1 system the contract plans to replace.** The final 3 sign-off boxes in §8 are still unchecked — until Sebs signs, the v1 rule engine ships.
- Per-fillStyle forward density math (Murray-Davies, Yule-Nielsen, TAM nesting, Secord/CCVT dots, `coverageToParams` from `docs/research/21-research-3d-pipeline-and-style-translation.md` §4) — research schemas locked, zero implementation.
- The 6-axis `AxisTuple` (today's `Treatment` is 5-axis + biasMode; `color` axis and `pressureEnvelope` are typed but pressure is always `null` and color doesn't exist yet).
- `cached-llm` and `decision-tree` providers — the string literals exist in `Classification.classifiedBy` and the `ClassifierProvider` chain accepts them, but only `ruleEngineProvider` exists.
- Identity-band enforcement (I-2 sliders-bounded-within-band) — sliders today modulate via multipliers + clamps, not band-bounded TAM nesting.
- Override-tagging chrome UI, `rule-promotion` (`setBy` literal exists, nothing sets it), server-synced store.
- Personal sketch-style training (the actual ML, task #30) — explicitly deferred, separate layer, separate dataset.
- Every interface stub in `types.ts:161–223` (`ObjectCollection`, `SubjectFormVariants`, `VisitorSession`, `SvgToThreeDBridge`, `BroadcastTreatment`, `RotationConflictGuard`, `InteractionTier`) — future-ready typed contracts, **no implementations**.
