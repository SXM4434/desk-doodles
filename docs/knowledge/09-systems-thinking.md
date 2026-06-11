# 09 — How we think: the operating philosophy

**In one sentence:** Desk Doodles is built as one living organism — a single decision engine (the brain) that every feature feeds, held up by 14 non-negotiable invariants (the load-bearing walls), protected by a kill-list (immune memory of past mistakes), disciplined by cite-the-contract-before-changing, fed by an audit catalog that doubles as future ML training data, and judged at every decision by one filter: *structured enough to trust, alive enough to feel authored.*

---

## Plain language

### The "living breathing system" idea, made concrete

Sebs's phrase for what this app should be is a *living breathing system*. That sounds vibey until you pin down what an organism actually has that a pile of features doesn't:

| Organism part | Desk Doodles equivalent | What it does |
|---|---|---|
| **One brain** | The `signals → classify → select treatment → render` engine | Makes every rendering decision in one place |
| **Many hands** | Features (fillStyle, wobble, texture, 3D conversion, draw panel…) | Produce signals and consume decisions — they never decide alone |
| **Skeleton / load-bearing walls** | Invariants I-1..I-14 in the locked contract | Things that NEVER move, so everything else can |
| **Immune memory** | The §7 kill-list | Remembers infections (bad patterns) so they can't reinfect |
| **Discipline / nervous reflex** | Anti-drift rule: cite the contract section before any change | Stops the hand before it drifts |
| **Diet / learning** | The `/audit` breakage catalog | Every bug observed = one labeled data point the future smart layer learns from |
| **Taste** | The north-star filter | "Structured enough to trust, alive enough to feel authored" — the yes/no on every decision |

### One brain, many hands

Think of how you work in C4D: you don't build a separate lighting rig per object. You build ONE rig — and every object in the scene is lit by it. A new object doesn't bring its own sun.

Same rule here. When a new surface needs "smart" behavior — picking a fillStyle for a region, auto-tuning hachure density, routing a drawing to the right 3D engine — it does NOT get its own little classifier bolted on. It becomes a new *consumer* of the one engine. The engine's shape is always the same four stages:

```
Input → extract signals → classify → select treatment → render
```

- **Signals** are like an HDRI capture before you render: you measure the environment (darkness, geometry, topology, what encloses what) BEFORE making any decision, so every decision downstream is grounded in the same measurement.
- **Classify** assigns a role — "this region is paper, this is a dense tonal area, this is text, never touch text."
- **Select treatment** maps role → concrete rendering parameters (mark spacing, stroke weight, layer count).
- **Render** executes. No thinking happens here — by the time you render, every decision is already made.

The makeathon plan even had to *re-merge* itself around this idea: what started as five separate plan entries (Smart Hachure, extra fillStyles, ML heuristic, cross-axis interconnection, a Day-13 ML task) got reconciled on 2026-06-08 into ONE Smart Rendering System, because they were all secretly the same engine pointed at different decision surfaces. The features were drifting toward "a smart layer per feature" and the plan caught it.

The boundary is just as important: this generality is recognized but **not pre-built**. The discipline (from the project memory) is: build the concrete instance, and only extract a generic meta-engine when a *second* concrete consumer independently arrives at the same shape. Premature abstraction is its own form of drift.

### The two layered systems — rule engine + ML, and why layering beats replacement

The brain has layers, like a non-destructive Photoshop stack:

1. **Override store** (top layer, like an adjustment layer with full opacity) — a manual human tag on a region. Always wins. Never flattened.
2. **Rule engine** (the base layer) — 16 named, independent heuristic rules. Each looks at the signals and votes for a role with a confidence. Votes are summed; the highest-confidence role wins. Deterministic, inspectable, debuggable.
3. **ML providers** (planned layers, not yet real) — a cached-LLM pass, then a trained decision tree. Each would slot into the chain *after* the rules, consulted only when the layers above aren't confident enough.

Why layer instead of replace? The same reason you bake a material instead of leaving everything live-procedural in Substance:

- **Baked = trustable.** The rule engine is "baked decisions" — you can open the file and read exactly why region 14 got cross-hatched (every classification carries a `firedRules` list, literally the names of the rules that voted). A pure-ML replacement is a live procedural node you can't open.
- **The blend-mode analogy.** Each provider in the chain is a layer with pass-through: if it has no opinion (or low confidence), the pixel falls through to the layer below. Replacement would be flattening the stack — you'd lose the ability to toggle a layer off and see what changed.
- **ML never gets to break the walls.** Because ML slots in as a provider *inside* the existing chain, the invariants (user's dropdowns sacred, darkness owns identity, determinism) constrain it structurally. A replacement system would have to re-promise all of them from scratch.
- **The rule era generates the training data.** Every classification and every manual override snapshots its input signals in exactly the shape a future classifier trains on. Running the rule engine for months IS building the dataset. Replacement would throw that away.

### The kill-list as institutional memory

The locked contract keeps a list of things we built, tore out, and must **never rebuild** — the 9-role taxonomy as the shipping abstraction, role-multiplier × slider math, "v1 stub / real model later" framing, collapsing user-facing options because the internal math is elegant, deferring axes to v2.

This is immune memory. The dangerous thing about these patterns is not that they're stupid — it's that they're *attractive*. They keep getting re-proposed because they're locally elegant. The drift-pattern memory file documents the rebuild repeatedly regressing toward a rule-based role classifier with fillStyle-switching even after it was rejected. A dead pattern that isn't written down WILL come back, proposed sincerely, by a future you (or a future AI session) that doesn't remember why it died. The kill-list exists so the system remembers even when no individual session does.

### Anti-drift discipline: cite the contract before changing

The rule, verbatim from the contract: *"Every code change in this rebuild prefaces with: 'checking against LOCKED-MODEL §X: …' If I cannot cite the section the change implements, I stop and re-read."*

This is the engineering equivalent of checking your reference board before painting a stroke. It sounds bureaucratic; it isn't. The failure mode it prevents is real and recurring: a change that's locally reasonable, individually defensible, and cumulatively destroys the model. Drift never announces itself — it arrives as a helpful simplification. Forcing every change to name its contractual authority makes drift *visible at the moment it happens* instead of three sessions later.

The contract also names the specific drift smells to watch for: proposing the system ships as LESS than defined, deferring agreed scope, collapsing user choices "because internally they're the same."

### Audit-as-dataset: debugging that doubles as training data

The `/audit` route renders all 197 catalog shapes and lets us sweep every modifier across them. When wobble=0.8 shreds the pencil-jar tips, that's a bug — AND it's a labeled data point: *decorative-tip polygon on a large group → needs low wobble scaling.* The breakage catalog is photogrammetry for the smart layer: hundreds of captures of the same objects under systematically varied conditions, from which the model of "what treatment suits what element" gets reconstructed.

The two-part build framing (locked 2026-06-08): the smart layer is (1) a recognition + classification system that learns element roles and per-toggle scaling, AND (2) the foundational dataset that bootstraps it. Build order: grow audit catalog → train on it → set the trained system as the foundation → everything else (visitor uploads, future assets) plugs into that foundation. So the rule: never shortcut the audit process, never let the catalog die in `/tmp` (it now lives in `audit-runs/` + `audit-archive/`).

### The north-star filter, applied to engineering

"**Structured enough to trust. Alive enough to feel authored.**" — originally a visual-direction filter, but it's load-bearing for engineering decisions too:

- *Structured enough to trust* → determinism (seeded randomness everywhere, no stray `Math.random()`), pure functions, performance budgets, inspectable classifications with provenance, invariants that hold.
- *Alive enough to feel authored* → wobble, pressure, hand-feel, per-region tonal response — but always *bounded* aliveness. Seeded wobble is authored; unseeded wobble is noise.

The filter's kill conditions translate directly: an engineering choice that's "cool but less clear" (clever abstraction nobody can debug), "expressive but ungoverned" (randomness without a seed), or "premium but lifeless" (perfectly uniform output with no hand in it) — gets killed. The whole rule-engine-with-provenance architecture is this sentence as code: the structure earns trust, the marks carry the hand.

---

## The design — why it's built this way

**Why invariants at all?** Because this system is built across many sessions, by a human + AI pair, under deadline, with context loss between sessions. Anything not written down as non-negotiable WILL eventually be "improved" away. The invariants are the subset of decisions promoted from "current choice" to "wall" — each one exists because its violation was either observed or convincingly foreseen. What each wall protects, in one line:

| Invariant | Protects |
|---|---|
| **I-1** fillStyle + Style dropdowns sacred | User authorship — the system advises, never overrides the human's pick |
| **I-2** source darkness owns per-region identity bands | Tonal truth — a dark region reads dark at every slider position |
| **I-3** sliders are bias within bands | Honest controls — every slider does something, no slider can lie about the source |
| **I-4** the intelligent layer ships intelligent at v1 | Against stub-shipping — "real model later" is a killed pattern |
| **I-5** each mark family gets its own research + model | Against elegant collapse — hachure ≠ dots ≠ zigzag, even if one formula *almost* fits all |
| **I-6** signals extracted pre-pass; render mutates a clone | Measurement integrity — the system never measures its own output as input |
| **I-7** determinism / seeded randomness everywhere | Reproducibility — caching, regression diffing, and "same drawing twice" all depend on it |
| **I-8** pure functions, no module-level mutable state | Concurrency — multiple canvases / visitors render without state collision |
| **I-9** token discipline (locked W1 ink/type/spacing only) | Design-system coherence — the engine can't invent its own visual language |
| **I-10** ~16ms full-pipeline budget, no network at render | Interactivity — the smart layer must feel like a material preview, not a render farm |
| **I-11** wobble = path master / roughness = surface quality | The mental model — same split as PBR (geometry vs. surface), so intuition transfers |
| **I-12** one render pipeline per primitive type | Compound effects — forked pipelines silently break pair-wise toggle interactions |
| **I-13** classifier consumes cluster-level features | The future ML feature space — 5 clusters, not 30 raw knobs |
| **I-14** sketchingStyle exclusively owns layer transforms | No double-driving — two systems offsetting the same layers = chaos |

**Why a rule engine first, not ML first?** Rejected: shipping an ML classifier at v1. The honest reasons: (a) no training data existed — the audit catalog is *creating* it; (b) a rule engine is debuggable during the exact period when the problem definition is still moving; (c) determinism (I-7) and the frame budget (I-10) are trivial for rules, hard for models; (d) the provider-chain architecture means ML costs nothing to add later but would cost everything to retrofit trust into. The trade-off accepted: rules plateau — they will misclassify novel uploads that a trained model would catch. That ceiling is the explicit trigger for the next layer, not a reason to skip the floor.

**Why a kill-list instead of just deleting code?** Deleted code leaves no scar tissue. The patterns on the kill-list were attractive enough to get built once; deletion alone leaves them attractive enough to get built twice. Writing *why it must stay dead* converts a deletion into institutional memory. (The drift-pattern memory file exists because exactly this re-emergence happened — repeatedly — during the Smart Hachure rebuild.)

**Why "cite the contract" instead of trusting judgment?** Because judgment is exactly what drift compromises. Every drift incident in the project's memory files happened through *reasonable-seeming* judgment calls. The citation requirement is cheap (one sentence) and converts an invisible failure mode into a visible checkpoint.

**Why audit-as-dataset instead of separate debugging + data collection?** One pass of work, two outputs. Debugging without labeling throws away the labels; collecting data without fixing bugs ships a broken app. Coupling them means the makeathon's necessary QA *is* the smart layer's bootstrap — no separate data-collection phase ever has to be scheduled or justified.

**What was rejected, summarized:** smart-layer-per-feature (fragmented brains), ML-replaces-rules (flattened stack, lost trust), pre-building the generic meta-engine (abstraction before the second example), stub-now-real-later (killed pattern), and unwritten institutional knowledge (the whole docs/memory apparatus exists because session memory is not system memory).

---

## Technical

The philosophy is not aspirational — it is visible in the shipping code. All paths relative to `/Users/sebs/Desktop/Projects/desk-doodles/`.

### The one engine

`src/app/lib/smartHachure/` — 7 modules, ~2,000 lines, one stage per module:

| Stage | Module | Key exports |
|---|---|---|
| Orchestration | `index.ts` (285 ln) | `renderSmartHachure(svgRoot, fullModifiers, opts)` — the single public entry |
| Signals | `signals.ts` (404 ln) | `extractSignals`, `extractAllSignals`, `getRenderableChildren` |
| Classify | `classifier.ts` (354 ln) | `classify`, `ruleEngineProvider` |
| Treatment | `techniqueMap.ts` (280 ln) | `selectTreatment`, `getBaseTreatmentForRole`, `BASE_BY_ROLE` (line 74) |
| Render | `renderRegion.ts` (217 ln) | `renderRegion` |
| Human layer | `overrideStore.ts` (161 ln) | `createOverrideStore`, `hashSvg` |
| Contracts | `types.ts` (233 ln) | `Signals`, `Classification`, `Treatment`, `TonalRole`, `ClassifierProvider`, `OverrideStoreApi` |

### Layering, in code

- **Provider chain:** `ClassifierProvider` interface at `types.ts:156-159` — `classify(signals, ctx): Classification | null`, where `null` = "no opinion, fall through." The chain default is `[ruleEngineProvider]` (`index.ts:67`). The doc comment at `types.ts:148-155` names the planned layers: v2 cached LLM, v3 decision tree.
- **Override always wins:** `classifier.ts:37-47` — the override store is checked *before* the provider chain, returning `confidence: 1.0`, `classifiedBy: 'manual-override'`.
- **Conservative fallback:** `classifier.ts:57-64` — if no provider clears the confidence threshold (default `0.7`, `index.ts:68`), the region falls back to role `'paper'` (do less, not more).
- **Independent voting rules:** `classifier.ts:77-86` — each `Rule` is `{ id, description, evaluate }`; rules don't know about each other; the engine sums confidence per role and the max wins (avoids rule-ordering bugs). Example: `RULE_outer_frame_encloses_all` (`classifier.ts:103-113`) fires `structural-frame @ 0.85` for z-index-0 elements enclosing ≥3 siblings at >80% parent area.

### Trust mechanisms, in code

- **Provenance on every decision:** `Classification` (`types.ts:76-82`) carries `firedRules: string[]`, `classifiedBy`, and a frozen `signalsSnapshot`. The renderer additionally stamps `data-smart-role`, `data-smart-confidence`, `data-smart-fill-style`, `data-smart-gap`, `data-smart-weight` onto every generated mark (`index.ts:226-236`) — classification is inspectable from DevTools alone.
- **I-6 in code:** the signal pre-pass at `index.ts:87-100` extracts ALL signals before any DOM mutation, with the comment documenting the 2026-06-03 bug (mutating mid-walk made topology checks see removed siblings as zero-sized → everything misclassified as paper) that got this promoted to an invariant.
- **I-1 in code (the narrow override):** `index.ts:171-185` — the user's fillStyle pick swaps the mark grammar *only* on regions the classifier already chose to fill; the classifier keeps the fillable-or-not call, the tiny-area (<40px²) solid clamp stays a perceptual constraint the user pick cannot override.
- **Training-data shape, today:** `Override` (`types.ts:124-130`) snapshots signals *at tagging time* — the doc comment says it outright: "so future decision-tree training has labeled data in the right shape."

### The dataset

- `audit-runs/2026-06-08/` — per-style sweep reports: `report-rough-handdrawn.{json,md}`, `report-sketchy.{json,md}`, `report-bold-ink.{json,md}`, `report-stipple.{json,md}` (e.g. stipple's report records the exact 95/197 shapes that respond to the roughness slider).
- The 197-shape catalog lives at `src/app/lib/items/PegToolShape.tsx`; the `/audit` route renders it (`src/app/components/DeskDoodles/DeskDoodlesAudit.tsx`).
- 84MB of sweep mosaics rescued from `/tmp` into `audit-archive/` (gitignored) on 2026-06-10 — "the smart-layer dataset no longer dies on reboot."

### The contracts

- `docs/locked-refs/F3-smart-hachure-system/09-LOCKED-MODEL.md` — THE contract. §2 = I-1..I-14, §7 = kill-list, §9 = anti-drift discipline, §11 = post-lock rulings (R-1 kink KEEP, 2026-06-10).
- `docs/locked-refs/system/north-star-filter.md` — the filter, including the decision-filter question list and the keep/kill test.
- `docs/locked-refs/F3-smart-hachure-system/07-architecture-ml-pipeline.md` — SUPERSEDED banner at line 1 (09 wins), EXCEPT the still-live "Per-shape breakage catalog" section (line 133) with the two-part build framing (line 137).
- `docs/locked-refs/F3-smart-hachure-system/makeathon-plan.md` §8.6 (line 511) — the 2026-06-08 reconciliation of M5/S3/S6/S10/T2 into ONE Smart Rendering System; Phase G (post-makeathon generalization) explicitly out of scope at line 603.
- `docs/memory/project_generalizable_rendering_decision_pattern.md` — the don't-pre-build-the-meta-engine discipline + the 10-domain watch list.
- `docs/memory/project_smart_layer_foundation_via_audit.md` — audit-IS-the-dataset framing.
- `CLAUDE.md` "Working Rules" — the enforcement surface: invariants sacred, narrow fillStyle override only, no sampled verification claims, no fix declared without regression check, don't shortcut the audit catalog.

---

## Connections

This page is the hub for *why*; the spokes are the *what* and *how*:

- **→ Smart Hachure engine** (the pipeline page): this page explains why the engine is shaped `signals → classify → treatment → render`; that page explains each stage's mechanics. Edge: *philosophy ⇄ implementation*.
- **→ Signals / source extraction**: signals are the "HDRI capture" stage argued for here (I-6, measure-before-decide). Edge: *invariant ⇄ mechanism*.
- **→ The audit system / breakage catalog**: audit-as-dataset is introduced here as philosophy; the audit page owns the harness, the sweep method, and the per-style reports. Edge: *strategy ⇄ instrument*.
- **→ Modifier clusters / toggle architecture** (wobble, roughness, texture, the 5 clusters): I-11/I-13/I-14 are the walls that keep that surface coherent; the clusters are the feature space the future classifier consumes. Edge: *constraint ⇄ surface*.
- **→ 3D pipeline / engine routing**: the planned Phase D (route drawing → Free Stroke vs Tripo) is the same one brain pointed at a routing decision — the clearest future test of one-brain-many-hands. Edge: *pattern ⇄ next consumer*.
- **→ The locked design system (W1 / type / spacing)**: I-9 makes the rendering engine a *consumer* of the design system, never a second author of it. Edge: *token discipline*.
- **System parts named above:** `src/app/lib/smartHachure/*`, `src/app/components/canvas/SvgStyleTransform.tsx` (the legacy outline pass the engine orchestrates), `audit-runs/`, and the `docs/locked-refs/` contract tree.

---

## Honest status

Per the house rule — "don't make me fake shit" — here is exactly where reality sits as of 2026-06-10:

**EXISTS in code today:**

- The full `signals → classify → select treatment → render` pipeline, shipping and rendering on `/audit`, `/canvas`, `/playground`. **It is a RULE ENGINE.** There is no ML anywhere in the shipping product. 16 hand-written heuristic rules (`classifier.ts:94-268`, gathered in `ALL_RULES` at line 280) with confidence voting.
- The override store (localStorage + JSON export), the provider-chain architecture, provenance on every classification, the `data-smart-*` DevTools diagnostics, seeded determinism (including the `patchRoughDots.ts` runtime patch for rough.js dot determinism).
- The audit catalog: 197 shapes, 4 per-style sweep reports in `audit-runs/2026-06-08/`, mosaics archived in `audit-archive/`.
- The contracts themselves: 09-LOCKED-MODEL (v2 locked 2026-06-04), north-star filter, the memory files.

**EXISTS but in tension with the contract — be precise here:**

- The shipping code STILL contains the 9-role `TonalRole` taxonomy (`types.ts:17-26`), `BASE_BY_ROLE` (`techniqueMap.ts:74`), and role-multiplier treatment math — all of which the §7 kill-list marks "gone / never rebuild." This is not hypocrisy; it's sequencing. The kill-list governs the *rebuild target*: 09-LOCKED-MODEL §8 step 3 schedules the tear-out (task #32), gated behind sign-off boxes that are **still unchecked** ("Until the final three boxes are checked, no code is touched"). Today's role-based rule engine is the working makeathon system; the kill-list is the demolition order for the rebuild, already signed in principle, not yet executed. Don't read the kill-list as describing current code, and don't read current code as license to keep the killed patterns.

**PLANNED — not one line of it exists:**

- The ML layers: cached-LLM provider (v2) and trained decision tree (v3) in the classifier chain. Interface stubs only (`ClassifierProvider`, the snapshot fields).
- Training the recognition system on the audit catalog (the "two-part build" — part 2 dataset is growing; part 1 trained system is zero code).
- The per-fillStyle tonal-density models from the rebuild contract (Murray-Davies / TAM / Yule-Nielsen math, docs 10-17). Researched and synthesized (doc 21), not implemented.
- Personal sketch-style ML (09-LOCKED-MODEL §6, explicitly deferred to v2).
- The generic meta-engine across other domains (Phase G / the 10-domain watch list) — explicitly out of scope until a second concrete consumer exists.
- Smart Phases A-F from makeathon-plan §8.6 (darkness→density calibration, smart conversion-picker auto-pick, engine routing, physics presets, cross-axis cascade) — planned for Days 11-12, not landed as of this page's writing.

If a future session finds this page claiming ML exists, the page is stale — fix the page, not the claim.
