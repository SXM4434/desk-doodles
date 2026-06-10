# 06 — Smart Hachure System: Technical Core Architecture

**Date:** 2026-06-03
**Status:** Proposal — pending Sebastian review
**Synthesizes:** Agent reports 01–05 in this folder

---

## What this doc covers (and what it doesn't)

**This doc — technical core:**
- Module structure of the smart-hachure renderer + classifier
- Data flow per render call
- Interface boundaries (built so Concepts A/B from vision roadmap can plug in without refactor)
- Migration plan from current `fillDarknessFactor` code path
- Open decisions Sebastian needs to make before code

**Out of scope for this doc:**
- ML pipeline architecture → see `07-architecture-ml-pipeline.md`
- Visitor canvas / sync mode / scale handling / hero randomization / SVG↔3D parity → see `08-vision-roadmap.md`
- Backend stack pick — deferred until visitor canvas implementation opens

---

## Module structure

New folder: `apps/Hero-8-Lab/src/app/lib/smartHachure/`

| Module | Responsibility | Inputs | Outputs |
|---|---|---|---|
| `types.ts` | Shared type definitions across modules | — | `TonalRole`, `Signals`, `Classification`, `Treatment`, etc. |
| `signals.ts` | Extract structural signals from an SVG element | `SVGElement`, parent context | `Signals` vector (geometric · topological · stylistic per Agent 3) |
| `oklabMath.ts` | Perceptual lightness math (culori wrapper + Murray-Davies forward/inverse per Agent 5) | Color strings, target L, parameter tuples | OKLab L scalars, parameter recommendations |
| `classifier.ts` | Decide per-region role + confidence | `SVGElement`, signals, override store | `Classification { role, confidence, firedRules, signals }` |
| `techniqueMap.ts` | Pure function — pick treatment per role + user style | `Classification`, `userStyleChoice` | `Treatment { fillStyle, gap, weight, layerCount, pressureEnvelope, opacity, biasMode }` |
| `renderRegion.ts` | Generate SVG marks for one region | `Treatment`, `SVGElement`, modifier state | SVG marks (uses rough.js + perfect-freehand) |
| `overrideStore.ts` | Per-project JSON-backed manual overrides | `{svgHash, regionPath}` | `Override?` |
| `index.ts` | Public API — single `renderSmartHachure(svg, modifiers, opts)` function | full SVG + chrome state | transformed SVG |

**Why this split:** each module is independently testable. `classifier.ts` doesn't know about rendering. `renderRegion.ts` doesn't know about classification. `techniqueMap.ts` is a pure function — easiest to unit-test + iterate.

---

## Data flow per render call

```
SVG input
    ↓
[signals.ts]
    ↓ Signals[] (per region)
    ↓
[overrideStore.ts] → check for manual tag
    ↓ Override? hit → use that
    ↓ miss → continue
    ↓
[classifier.ts] → fire rules over signals
    ↓ Classification[] (per region: role + confidence + firedRules)
    ↓
[techniqueMap.ts] (per region) → role + userStyleChoice → Treatment
    ↓ Treatment[] (per region: fillStyle + gap + weight + layers + pressure + opacity + biasMode)
    ↓
[renderRegion.ts] (per region) → call rough.js (line generation) + perfect-freehand (pressure)
    ↓
[oklabMath.ts] (optional v2) → measure rendered L → adjust treatment → re-render
    ↓
SVG output
```

Each step is a pure transformation. No global state. No singletons. Deterministic given same input.

---

## Module details

### `signals.ts`

Per Agent 3 — extracts signals available at render time. No external deps; uses native DOM APIs (`getBBox`, `getCTM`, `getTotalLength`, parent traversal).

```ts
export type Signals = {
  // geometric
  bbox: { x: number; y: number; w: number; h: number };
  area: number;
  aspectRatio: number;
  perimeter: number;
  positionInParent: { x: number; y: number };  // normalized [0..1]

  // topological
  zIndex: number;
  parentBBox: { x: number; y: number; w: number; h: number } | null;
  enclosesSiblings: number;  // count of siblings fully inside this bbox
  containedIn: number | null; // z-index of containing parent shape
  siblingStripCluster: boolean; // 3+ siblings of equal width + constant stride

  // stylistic
  fill: string | null;
  stroke: string | null;
  strokeWidthBin: 'hairline' | 'thin' | 'medium' | 'heavy';
  hasDasharray: boolean;
  tag: 'rect' | 'circle' | 'path' | 'polygon' | 'line' | 'text' | 'g' | 'other';
  opacity: number;
  fillOpacity: number;
};

export function extractSignals(el: SVGElement, ctx: ExtractionContext): Signals;
```

### `oklabMath.ts`

Per Agent 5 — culori wrapper + Murray-Davies forward/inverse models.

```ts
export function toOkLabL(color: string): number;  // any CSS color → OKLab L scalar
export function forwardL(
  gap: number, weight: number, opacity: number,
  inkL: number, paperL: number, n?: number  // Yule-Nielsen exponent, default 1.6
): number;
export function inverseSolveLight(targetL: number, gap: number, /* … */): { weight: number };
export function inverseSolveDark(targetL: number, weight: number, /* … */): { gap: number };
```

`culori` added to package.json (treeshaken to `parse` + `oklab` only, ~3KB).

### `classifier.ts`

Per Agent 4 Hybrid recommendation — rule-based for v1.

```ts
export type TonalRole =
  | 'paper'           // skip hachure
  | 'sparse-tonal'    // light grey
  | 'mid-tonal'       // mid grey
  | 'dense-tonal'     // dark grey
  | 'solid-content'   // near-black with structure
  | 'structural-frame'// clean outline, no fill technique
  | 'decorative-accent'
  | 'line-decoration' // outline only
  | 'label-text';     // never hachure

export type Classification = {
  role: TonalRole;
  confidence: number;  // [0..1]
  firedRules: string[];
  signalsSnapshot: Signals;
};

export function classify(
  signals: Signals,
  ctx: ClassificationContext,
  overrideStore: OverrideStore
): Classification;
```

15–25 hand-coded rules covering: outer-frame detection (z=0 + encloses + has fill), inner-band (contained + aspect>3 + STROKE fill), background-mass (z=0 + WASH fill + low darkness), border (fill=none + has stroke), dasharray-annotation, stripe-cluster, hairline-line-decoration, label-text, etc.

Each rule emits `(role, confidence_contribution)`. Final classification = max-confidence rule that fired. Confidence threshold 0.7 = "use this"; 0.5–0.7 = "use but mark uncertain"; <0.5 = "default to paper" (Agent 3's conservative policy).

### `techniqueMap.ts`

Pure function. Per Agent 1's tonal-to-multi-axis canon + Option E hybrid bias picking (fillStyle + darkness + size).

```ts
export type Treatment = {
  fillStyle: 'hachure' | 'cross-hatch' | 'dots' | 'zigzag' | 'dashed' | 'zigzag-line' | 'solid' | 'none';
  gap: number;            // px
  weight: number;         // strokeWidth multiplier
  layerCount: number;     // 1-4
  pressureEnvelope: number[] | null;  // perfect-freehand thinning per stroke
  opacity: number;        // [0..1]
  biasMode: 'gap-dominant' | 'layers-dominant' | 'weight-dominant' | 'hybrid';
};

export function selectTreatment(
  classification: Classification,
  userStyleChoice: F3SvgStyle,
  modifiers: F3ModifiersState
): Treatment;
```

Mapping table sourced from Agent 1 canon (D=0.10-0.30 → sparse light; D=0.55-0.80 → cross-hatch; etc.) combined with userStyleChoice (rough-handdrawn vs sketchy vs bold-ink etc.).

### `renderRegion.ts`

Refactor of current `renderHandFeelShape` hachure block (lines 406-463 of `SvgStyleTransform.tsx`).

```ts
export function renderRegion(
  el: SVGElement,
  treatment: Treatment,
  modifiers: F3ModifiersState,
  ctx: RenderContext
): SVGElement[];
```

Generates marks: rough.js for line-in-polygon clipping (`polygonHachureLines`), perfect-freehand for per-line pressure modulation. Returns SVG elements ready to be inserted in place of the original.

### `overrideStore.ts`

Per Agent 4 — per-project JSON in repo (not memory).

```ts
type Override = {
  role: TonalRole;
  setAt: string;  // ISO date
  setBy: 'manual' | 'rule-promotion';
  signalsSnapshot: Signals;
};

export function get(svgHash: string, regionPath: string): Override | null;
export function set(svgHash: string, regionPath: string, override: Override): void;
export function exportToJson(): string;  // for git commit
export function importFromJson(json: string): void;  // for git checkout
```

v1: localStorage-backed in browser, manual export-to-JSON when committing to repo. v2 (when backend exists): server-synced.

### `index.ts` (public API)

```ts
export function renderSmartHachure(
  svgRoot: SVGSVGElement,
  modifiers: F3ModifiersState,
  opts: SmartHachureOpts
): void;
```

This is what `SvgStyleTransform.tsx`'s `applyRoughTransform` calls. One function. Replaces the existing hachure block. Modifies the SVG in-place (consistent with current architecture).

---

## Interfaces designed for future (per "future thinking" direction)

These are STUBS / INTERFACE BOUNDARIES in v1 — not implemented but designed so Concepts A/B from `08-vision-roadmap.md` slot in without refactor.

| Interface | v1 implementation | Future use |
|---|---|---|
| `ObjectCollection` | Hardcoded to F3 trophy wall pins | Pluggable: visitor uploads, drawings, randomized subsets |
| `SubjectFormVariants` | Existing F3 form-toggle architecture | Hero randomization (Concept A) picks form per page load |
| `VisitorSession` | Single hardcoded session | Per-visitor isolated state (Concept B) |
| `InteractionTier` | Static-only | Progressive disclosure: hover → toggle → fully-interactive (parallel to 3D tiers) |
| `SvgToThreeDBridge` | Stub (no swap) | Lighter SVG↔3D swap (hero) + full bidirectional swap (visitor canvas) |
| `BroadcastTreatment` | No-op | Sync mode broadcasts treatments to all objects |
| `RotationConflictGuard` | No-op | When 3D rotation active, disable other interactions |

These all live as TypeScript interfaces in `types.ts` with `// @future` comments + thin v1 implementations. No external API impact in v1.

---

## What ships in v1 (the must-have set)

- ✅ Modules 1-7 (types, signals, oklabMath, classifier, techniqueMap, renderRegion, overrideStore, index)
- ✅ Hand-coded rules (15-25)
- ✅ Per-project JSON override store (localStorage + manual export)
- ✅ OKLab L color math (no calibration loop yet)
- ✅ Interface stubs for Concepts A/B (not implemented)
- ❌ NO calibration feedback loop (deferred to v2)
- ❌ NO LLM build-time pre-pass (deferred to 3-month maturity)
- ❌ NO decision tree (deferred to 1-year horizon)
- ❌ NO visitor canvas / sync / hero randomization (deferred per vision roadmap)
- ❌ NO sketch-training (separate mini-lab per task #30)

---

## Migration plan from current code

**Phase 1 (v1 ships): coexist**
- Smart hachure modules live in `apps/Hero-8-Lab/src/app/lib/smartHachure/`
- New "Smart Hachure: ON / OFF" toggle in chrome
- ON = new pipeline · OFF = current `fillDarknessFactor` code path
- Default to OFF until verified against test pins
- Test pin matrix: framedFlyer · vinylLpSleeve · stackedSketchbooks · Polaroid · NES cartridge · PSA Charizard

**Phase 2 (after Sebastian validates): smart hachure becomes default**
- Default to ON
- Current code path stays as fallback when classifier returns confidence <0.5
- "Smart Hachure: OFF" toggle still available for A/B comparison

**Phase 3 (when Sebastian confirms reliability): retire current code**
- Remove `fillDarknessFactor` and the old hachure block
- Smart hachure is the only path

---

## Open decisions before implementation

**Per `feedback_decision_discipline`, these need 4-6 options + Sebastian's pick before I write code:**

1. **Where does `smartHachure/` live?** → `apps/Hero-8-Lab/src/app/lib/smartHachure/` (recommended — colocated with the lab that uses it first; can be promoted to shared lib later if visitor canvas opens elsewhere)

2. **Override store backend in v1:**
   - A. localStorage only · B. localStorage + manual JSON export to repo · C. JSON file Vite imports at build time · D. SQLite via a Vite plugin · E. Defer entirely (no overrides in v1)
   - Recommend B — pragmatic, git-trackable, no infra cost

3. **Smart Hachure ON/OFF toggle location in chrome:**
   - A. Top of modifier panel · B. In a new "Render mode" dropdown · C. In a dev-only menu · D. URL parameter `?smartHachure=1`
   - Recommend D for v1 (zero chrome surface, easy A/B), promote to A once validated

4. **Test pin coverage for v1:**
   - A. All 14+ trophy wall pins · B. 6 representative pins (framedFlyer · vinylLpSleeve · sketchbooks · Polaroid · NES · PSA) · C. Just framedFlyer · D. Pre-curated synthetic test SVGs
   - Recommend B — covers the edge cases without slowing iteration

5. **Slider chrome changes:**
   - A. No changes to existing modifiers (treatments come from techniqueMap, not user sliders) · B. Add a "Treatment override" dropdown (force role manually) · C. Add a "Bias mode" dropdown (gap/layers/weight/hybrid) · D. Hide existing modifiers when Smart Hachure ON (chrome is for old code path only)
   - Recommend A for v1 — minimal chrome surface, prove pipeline before adding controls

---

## Cross-references

- Convergent recommendations table in `00-overview.md`
- Artist canon: `01-agent-research-artist-tonal-canon.md`
- Build-vs-buy + library picks: `02-agent-research-libraries-build-vs-buy.md`
- Signal extraction details: `03-agent-research-svg-structural-signals.md`
- Hybrid classifier rationale: `04-agent-research-classifier-architectures.md`
- OKLab + Murray-Davies math: `05-agent-research-perceptual-lightness-math.md`
- ML pipeline (next doc): `07-architecture-ml-pipeline.md`
- Vision roadmap (next doc): `08-vision-roadmap.md`

---

## Next steps after Sebastian reviews this doc

1. Resolve the 5 open decisions (1-5 above)
2. Write doc 07 (ML pipeline — inference-only, hybrid pattern hooks)
3. Write doc 08 (vision roadmap — Concepts A/B exploration space)
4. Implementation (task #27) per the migration plan
