# 04 — The ML layer (the real one)

**In one sentence:** The ML layer is a *planned* trained model that will slot into the already-shipped classifier provider chain as a second opinion above the rule engine, trained on the labeled dataset we are accumulating right now through the `/audit` breakage catalog — and until that model is trained and evaluated, the shipping smart system is a rule engine, full stop.

---

## Plain language

Your hard rule, verbatim: **"ACTUAL ML, actual training model, don't make me fake shit."** This page exists to hold that line. So before anything else:

> **Today there is no model.** No weights, no training script, no inference call. What ships is a hand-written rule engine plus a growing dataset. The "ML layer" is the plan for what that dataset becomes. Every section below is tagged real vs planned.

### What "real ML" means here (vs what it doesn't)

A real ML layer has three parts, and you can think of all three through your texturing workflow:

1. **A labeled dataset.** Like a photogrammetry capture session: lots of observations of the same subject under controlled variation. Here, the subject is "how do hand-drawn marks break," and the controlled variation is the modifier sweep — 197 shapes × 11 modifiers × 5–8 values each, screenshotted and hashed. Each observation that gets a verdict attached ("the pencil tips shred at wobble 0.8") is one *labeled example* — a (features → correct answer) pair. No labels, no ML; this is the non-negotiable raw material.

2. **A training loop.** Like baking: an expensive offline process that runs once, looks at every labeled example, and *distills* the pattern into a compact artifact (the model file — think of it as the baked map). Training never happens at render time, exactly like you never bake mid-render.

3. **An inference call.** The cheap runtime lookup — sampling the baked map. The model takes the same `Signals` the rule engine already reads (bounding box, area ratio, stroke width, darkness, etc.) and emits the same kind of answer the rules emit (a role + a confidence number). It is just another voice in the existing chain.

What it does *not* mean: calling an LLM at render time and labeling that "AI," hard-coding more rules and calling them "learned," or a confidence number that is made up. The rule engine's confidences are hand-assigned weights — that's fine and honest *as a rule engine*; the moment we call any of it "trained" without a training run, that's the fake shit.

### How the layers stack (your blend-mode anchor)

The classifier is a layer stack, and it composites top-down like Photoshop:

| Layer (top wins) | What it is | Real today? |
|---|---|---|
| Manual override | Your tag on a specific region. Locked layer at the top — always wins, confidence 1.0. | Store **exists in code**; no tagging UI yet, so the corpus is empty |
| Rule engine | 16 hand-written heuristics; each fires or stays transparent; scores sum per role | **Real, shipping, the only provider** |
| Trained model | A second provider consulted when the layer above has no confident opinion | **Planned — does not exist** |
| Paper fallback | If nobody is confident, do nothing (no hachure). Conservative by design. | **Real** |

Each provider either paints an opinion or returns `null` ("transparent — let the next layer show through"). The first opinion that clears the confidence threshold (default 0.7) wins. So the trained model never *replaces* the rules — it fills the gaps the rules leave, the same way a fill layer underneath only shows where the layers above are transparent.

### The two dataset streams (what the labels actually are)

There are two distinct labeled-data streams, for two distinct smart surfaces:

**Stream 1 — role labels (for the fillStyle/shading classifier).** Each example: `Signals → TonalRole` (one of 9 roles like `structural-frame`, `dense-tonal`, `label-text`). The intended source is the override store — every time you correct a wrong classification, the correction is saved *with a frozen snapshot of the signals at tagging time*, which is exactly a training row. **Today this stream has zero entries** because the tagging UI doesn't exist yet.

**Stream 2 — breakage labels (for the manual-toggle smart layer).** Each example: `(element features) → (correct per-modifier scaling curve)`. The source is the `/audit` sweep catalog. The canonical example (2026-06-08): at wobble = 0.8 on `pencilStubJar`, the 4–5px pencil-tip polygons inside an 80px parent shred — same slider value applied uniformly to outer shell and decorative tip is wrong. The label: `{role: decorative-tip, parentSize: 80, ownSize: 5} → scaling-curve(wobble) ≈ 0.2–0.4 of user value`. **Today this stream is raw observations, not yet clean labels** — the sweep reports record which DOM cells changed per value (NO-OP / PARTIAL / n-of-m matrices plus screenshot mosaics); the "breaks at Y" verdicts still live in your eyes and the session notes. Turning observations into a labeled table is itself a planned work item.

### What stays rules forever

Some decisions never go to a model, by design:

- **Manual overrides** — authorship is the top layer permanently. ML is suggestion; manual is canon.
- **The locked invariants** (09-LOCKED-MODEL I-1..I-14) — e.g. "user's fillStyle pick is sacred," "source darkness owns perceptual identity." These are contracts, not patterns to learn.
- **Safety clamps** — tiny-area solid clamp, gap cap, pass-throughs for masks/filters. Edge-case *policy* stays inspectable code.
- **The conservative fallback** — "when nobody's confident, do less" is a value judgment, not a learnable target.

---

## The design — why it's built this way

### Why rules first, model later (not the other way around)

The classifier-architectures research (doc 04 in locked-refs) compared five candidates: rule engine, decision tree / random forest, small neural net, LLM-as-classifier, and a hybrid. The verdict that shaped the build:

| Candidate | Why it lost (or waits) |
|---|---|
| Rules only, forever | Brittle past ~40 rules (interaction matrix explodes); ~60–75% estimated accuracy on wild SVGs |
| Decision tree day-1 | Needs labeled data that didn't exist yet — you can't train on nothing |
| Small neural net | Needs thousands of examples; opaque failures; 10–50ms inference vs <1ms rules. Verdict in the research: **overkill, skip** unless the problem turns pixel-level |
| LLM at runtime | 800–3000ms per call, non-deterministic, external dependency in the render path — fatal |
| **Hybrid (chosen)** | Rules cover the confident cases now; each later layer covers the previous one's weakness |

The deeper reason is your wedge: trust, reversibility, authorship. Every rule-engine classification ships with provenance — which rules fired, the exact signal snapshot. A trained model gets held to the same standard, which is why the research recommends **interpretable model classes** (a depth-capped decision tree reads as nested if-statements in English) before anything opaque.

### Why the model is a *provider*, not a rewrite

The single most important architectural decision: the classifier accepts a *chain* of providers, and the entry point was written that way on day one. Adding the trained model is a one-line change at the call site (`[ruleEngineProvider]` → `[ruleEngineProvider, treeProvider]`), not a refactor. The `Classification` type already reserves the provenance values `'cached-llm'` and `'decision-tree'`. The hooks are baked; only the thing that plugs in is missing.

### Why training data comes from the audit, not from scratch

Your framing (2026-06-08), now a locked memory: the smart layer is two things — the recognition/classification system, AND the foundational dataset it bootstraps from. The `/audit` route + sweep harness *is* the data collection rig. Going shape-by-shape watching what breaks isn't debugging that happens to produce data; it's data collection that happens to also fix bugs. That's why `audit-runs/` says **do not delete** — old runs are the dataset's history, and deleting them would be throwing away labeled examples. Build order: grow catalog → train on it → set the trained system as the rendering pipeline's foundation → new inputs (visitor uploads) plug into that foundation.

### Why training waits for volume (rejected: train now on tiny data)

A tree trained on 30 examples of your own desk-object sketches learns "this looks like Sebs's sketches," not "this is a decorative tip" — the overfitting trap the research flags explicitly. Mitigations are already specified for when training opens: `maxDepth` 5–8 cap, `minNumSamples` ≥ 10, and the ~500-override volume gate before the first real training run. Until the data clears that bar, training would produce a model that *exists* but isn't *real* in any useful sense — which fails your rule from the other direction.

### One boundary that is separate scope on purpose

Training on **your personal sketches** (so generated marks match your hand) is a different project: different data source (your sketch corpus), probably a vision encoder rather than tabular features, different evaluation (perceptual match, not classification accuracy). Your line from 2026-06-03: "we train the ml just not on my sketching yet — that's a separate process that involves me feeding you stuff." The provider chain pre-supports it (a sketch-derived provider slots in like any other), but nothing here builds it.

---

## Technical

All paths relative to `~/Desktop/Projects/desk-doodles/` unless noted.

### The shipping provider chain (REAL)

- `src/app/lib/smartHachure/classifier.ts:31-65` — `classify(signals, ctx, providers, overrideStore)`. Resolution order: (1) override store wins at confidence 1.0; (2) walk `providers` in order; (3) first result with `confidence >= ctx.confidenceThreshold` wins; (4) fallback `{ role: 'paper', confidence: 0 }`.
- `src/app/lib/smartHachure/classifier.ts:315-351` — `ruleEngineProvider: ClassifierProvider`. All rules fire independently; confidence sums per role; capped at 1.0; returns `null` if zero rules fired (= delegate to next provider).
- `src/app/lib/smartHachure/classifier.ts:280-304` — `ALL_RULES`: 16 rules in 7 clusters (text / frames / content / lines / accents / root tonal / paper). Exported as `RULE_REGISTRY` (line 354).
- `src/app/lib/smartHachure/index.ts:66-68` — runtime wiring inside `renderSmartHachure`: `providers = opts.providers ?? [ruleEngineProvider]`, `threshold = opts.confidenceThreshold ?? 0.7`. This is the one-line insertion point for a future trained provider.
- `src/app/lib/smartHachure/types.ts:156-159` — `ClassifierProvider` interface (`classify(...) → Classification | null`).
- `src/app/lib/smartHachure/types.ts:76-82` — `Classification`: `classifiedBy: 'rules' | 'cached-llm' | 'decision-tree' | 'manual-override'` — the enum already names the planned providers; `signalsSnapshot` frozen per classification "for cache + training data."
- `src/app/lib/smartHachure/types.ts:39-65` — `Signals`: geometric (bbox, `area`, `aspectRatio`), topological (`zIndex`, `areaFractionOfParent`, `enclosesSiblingCount`, `isPartOfStripeCluster`), stylistic (`fill`, `strokeWidthBin`, `tag`), perceptual (`darknessL` = 1 − OKLab L). **This is the feature vector** any trained model consumes — pure serializable data, no DOM refs, by design.
- `src/app/lib/smartHachure/overrideStore.ts:57` — `createOverrideStore()` (localStorage-backed; `set` at line 65 stamps `signalsSnapshot` per `Override`, types.ts:124-130 — training-row shape ready). **No UI calls it yet**; a grep across `src/**/*.tsx` outside the lib finds zero call sites.

### The dataset (REAL, raw form)

- `audit-runs/README.md` — the contract: each subdirectory is one dated sweep snapshot; "every 'X breaks at slider value Y on shape Z' entry is one labeled training example"; **do not delete**.
- `audit-runs/2026-06-08/` — first committed run, 4 styles: `report-{rough-handdrawn,sketchy,bold-ink,stipple}.{md,json}`.
- JSON shape (`report-rough-handdrawn.json`): `{ style, cellCount: 197, sweeps: { <modifier>: { kind: 'discrete'|'slider', values: [...], perCellHashes: { <value>: { <shapeName>: <domHash> } } } } }` — 11 modifiers swept (multiStroke, sketchingStyle, fillStyle, endpointBehavior, penTip, wobble, roughness, bowing, strokeWidth, hachureGap, fillDensity).
- MD shape: per-shape × per-modifier matrix of `n/m` distinct-DOM counts, with `NO-OP` / `PARTIAL` flags as bug candidates, plus per-modifier failure summaries. (Note when reading: `roughness` shows NO-OP on all 197 *by design* — it's an I-11 placeholder reserved for the Cluster 4 surface-texture repurpose, not a bug.)
- `audit-archive/` (gitignored) — 84MB of sweep screenshot mosaics rescued from `/tmp` on 2026-06-10 so the visual half of the dataset survives reboots.
- Sweep harness: `/tmp/dd-audit-sweep.js` (uncommitted; drives the dev server, per README). The `/audit` route itself: `src/app/components/DeskDoodles/DeskDoodlesAudit.tsx` over the 197-shape catalog in `src/app/lib/items/PegToolShape.tsx`.

### The planned model layer (PLANNED — none of this file-exists)

Per `docs/locked-refs/F3-smart-hachure-system/07-architecture-ml-pipeline.md` — **note its SUPERSEDED banner**: the classifier-pipeline specifics there are research history overridden by 09-LOCKED-MODEL; the section that remains LIVE is "Per-shape breakage catalog — foundation for the MANUAL-TOGGLE smart layer." With that caveat, the still-standing plan:

| Piece | Plan | Status |
|---|---|---|
| Model class | Decision tree via `ml-cart` (JS, sklearn-like API: `gainFunction: 'gini'`, `maxDepth: 6`, `minNumSamples: 10`); random forest via `ml-random-forest` if single tree overfits; small net explicitly rejected | Planned; `ml-cart` not in package.json |
| Optional bridge before the tree | Cached LLM **build-time pre-pass** for low-confidence regions — bake classifications to a JSON cache once per asset, runtime reads the cache (never a runtime API call) | Planned; provider pick deferred |
| Training data | Stream 1: override rows (`signalsSnapshot → role`). Stream 2: audit breakage labels (`element features → scaling curve`) | Stream 1 empty; stream 2 raw |
| Train trigger | Manual `npm run smartHachure:retrain`, or every ~50 new overrides; first run gated on ~500-entry volume | Planned; no script exists |
| Eval loop | Hold-out accuracy vs rule engine on the same regions + your review of N=20 model-only classifications before the tree is trusted | Planned |
| Model artifact | Versioned JSON (`smartHachure-tree-v1.json`, v2, ...), old versions never deleted, rollback by config | Planned |
| Inference wiring | `treeProvider: ClassifierProvider` appended to the chain after `ruleEngineProvider`; promotion to earlier chain position is a manual config change after review, never automatic | Planned (insertion point real, index.ts:67) |

---

## Connections

Edges in the knowledge graph (bidirectional — each of these should point back here):

- **→ [03-the-smart-system.md](03-the-smart-system.md)** — the rule-engine brain (signals → classify → select treatment → render). The ML layer is a *provider inside* that pipeline, not a sibling system. Shared types: `Signals`, `Classification`, `ClassifierProvider`. Edge type: *plugs into*.
- **→ [02-pipeline-of-a-doodle.md](02-pipeline-of-a-doodle.md)** — where in a doodle's lifecycle classification fires (after Done, inside the rough-family render path). A trained provider changes WHO answers, never WHEN the question is asked. Edge type: *lives inside stage 3 of*.
- **→ [06-tone-and-shading.md](06-tone-and-shading.md)** — `darknessL` is one feature in the `Signals` vector, and shading density is what the classification ultimately spends itself on. Tone math stays deterministic; only the *role* call is a candidate for learning. Edge type: *feeds features to / receives decisions from*.
- **→ [05-the-interconnection-graph.md](05-the-interconnection-graph.md)** — the cross-axis cascade (Phase F). A trained model must obey the same declared edges as the rules; it cannot invent new toggle couplings. Edge type: *constrained by the same graph*.
- **→ [09-systems-thinking.md](09-systems-thinking.md)** — audit-as-dataset is one of that page's load-bearing philosophies, and the 09-LOCKED-MODEL invariants (I-1..I-14) define what the model is never allowed to learn over. Edge type: *governed by*.
- **→ [07-the-3d-pipeline.md](07-the-3d-pipeline.md)** — the planned vision-LLM *router* (which 3D generator handles an upload, research doc 21) is a different decision surface using the same provider-chain thinking. Don't conflate: the router picks a generator per upload; this layer classifies regions per SVG. Edge type: *pattern sibling*.
- **→ [01-what-is-desk-doodles.md](01-what-is-desk-doodles.md)** — the wedge (trust · reversibility · authorship) is WHY the model class must be interpretable and why overrides outrank it forever. Edge type: *justified by*.
- **System parts**: `src/app/lib/smartHachure/*` (the chain), `src/app/components/canvas/SvgStyleTransform.tsx` (where stream-2 scaling decisions like geomean per-detail wobble currently live as hand-tuned compromise code the trained layer would replace), `audit-runs/` + `audit-archive/` (the dataset), `docs/memory/project_smart_layer_foundation_via_audit.md` and `docs/memory/project_generalizable_rendering_decision_pattern.md` (the framing memories — the second one warns: don't pre-build the meta-engine).

---

## Honest status

**Real, in code, today (verified by reading the files this page cites):**

- Rule engine with 16 independent rules, confidence accumulation, provenance on every classification (`classifier.ts`).
- Provider-chain architecture with the trained model's insertion point pre-wired (`index.ts:67`, `types.ts:156`).
- Override store API with training-ready row shape (`overrideStore.ts`) — **but no UI writes to it, so zero accumulated overrides**.
- Confidence threshold plumbing (default 0.7, configurable per call).
- Dataset raw material: one committed audit run (2026-06-08, 4 styles × 197 shapes × 11 modifiers, hash matrices + failure summaries) plus 84MB of screenshot mosaics in `audit-archive/`.

**Planned, does not exist (every one of these is vapor until built):**

- Any trained model. No weights, no `ml-cart` dependency, no training script, no eval harness, no model JSON artifact.
- The tagging UI that would populate override stream 1.
- The labeling pass that converts audit hash-matrices + mosaics into a clean `(features → verdict)` table for stream 2.
- The cached-LLM build-time pre-pass (provider unpicked, cache file unwritten).
- `treeProvider`, retrain scripts, model versioning, promotion workflow.
- Sketch-training on your personal drawing hand — separate scope entirely, by your explicit instruction.

**The honest one-line summary you can say out loud at the makeathon:** "The smart system shipping today is a deterministic, inspectable rule engine; we're building the labeled dataset for the trained layer through systematic breakage audits, and the architecture has the model's seat already bolted in." That sentence is 100% true. Calling today's system "ML" is not.
