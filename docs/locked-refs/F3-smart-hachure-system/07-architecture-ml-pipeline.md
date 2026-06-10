# 07 — ML Pipeline Architecture (inference-only, no training)

**Date:** 2026-06-03
**Status:** Proposal — pending Sebastian review
**Builds on:** Agent 4 (classifier architectures) in this folder; doc 06 (technical core)

---

## What this doc covers (and what it doesn't)

**This doc — ML pipeline (inference-only):**
- The 3-phase maturity model: rules → cached LLM → decision tree
- v1 implementation (rules + override store — referenced from doc 06)
- v2 architecture (cached LLM build-time pre-pass, when to add, how)
- v3 architecture (decision tree retrained on overrides, when to add, how)
- ML inference HOOKS in the v1 codebase so future phases plug in without refactor

**Out of scope:**
- Sketch-training on Sebastian's drawings → **separate mini-lab per task #30** (involves Sebastian feeding sketches in; whole separate pipeline; not bundled here)
- LLM provider final pick / cost analysis → deferred until v2 opens (when there's actual usage data to budget against)
- Backend infrastructure for ML serving → deferred until visitor canvas exists (per vision roadmap)

---

## Sebastian's load-bearing constraint

> "again we train the ml just not on my sketching yet thats a separate process that involves me feeding you stuff" — 2026-06-03

**Translation:**
- ML inference is fair game NOW (v2 cached LLM pre-pass = inference, not training)
- ML training on real corpora is fair game NOW (v3 decision tree trained on accumulated overrides)
- ML training on **Sebastian's sketches specifically** = separate mini-lab project (task #30, separate scope)

This doc respects that line. The pipeline IS designed to support sketch-training later (multi-axis features + override store = ready feature space) but does NOT bake training infrastructure for sketches into this architecture.

---

## The 3-phase maturity model (Agent 4 hybrid pattern)

| Phase | Timeline | What's added | What's the gain |
|---|---|---|---|
| **v1** | This month | Rules + override table (doc 06) | Determinism, debuggability, trust posture |
| **v2** | 3 months | + Cached LLM build-time pre-pass for low-confidence regions | Out-of-box accuracy on novel SVGs without runtime API cost |
| **v3** | 1 year | + Decision tree (`ml-cart`) trained on accumulated overrides | Pattern capture beyond what hand rules express |

Each phase ADDS to the previous; nothing gets removed. The classifier is hybrid by design:

```
v1: rules → override-check → output
v2: rules → cached-LLM (if low confidence) → override-check → output
v3: rules → cached-LLM (if low confidence) → decision-tree (if still low confidence) → override-check → output
```

Override store is the constant — manual tags always win, regardless of phase.

---

## v1 ML hooks (what ships in this iteration)

Doc 06 has the modules. This doc documents what's PRE-WIRED so v2 and v3 can plug in without refactor.

### Classifier interface accepts pluggable providers

```ts
// types.ts
export interface ClassifierProvider {
  readonly name: string;
  classify(signals: Signals, ctx: ClassificationContext): Classification | null;
  // returns null if this provider has no opinion (delegates to next)
}

// classifier.ts
export function classify(
  signals: Signals,
  ctx: ClassificationContext,
  providers: ClassifierProvider[],  // chain of responsibility
  overrideStore: OverrideStore
): Classification {
  // override store always wins
  const override = overrideStore.get(ctx.svgHash, ctx.regionPath);
  if (override) return { role: override.role, confidence: 1.0, /* ... */ };

  // walk provider chain
  for (const provider of providers) {
    const result = provider.classify(signals, ctx);
    if (result && result.confidence >= 0.7) return result;
  }
  // fallback: paper / pass-through (Agent 3 conservative policy)
  return { role: 'paper', confidence: 0.0, firedRules: [] };
}
```

v1 ships with ONE provider: `ruleEngineProvider`. v2 inserts `cachedLLMProvider` AFTER it. v3 inserts `treeProvider` AFTER that.

### Confidence threshold is configurable

```ts
export type ClassificationContext = {
  svgHash: string;
  regionPath: string;
  parentClassification: Classification | null;
  confidenceThreshold: number;  // default 0.7
};
```

When v2 ships, the LLM pre-pass uses a HIGHER threshold (0.9) for its own output (LLM is fuzzy; we want strong signal before trusting it).

### Cache schema for build-time pre-pass

```ts
// reserved file: apps/Hero-8-Lab/public/smartHachure-cache.json
type ClassificationCache = {
  version: 1;
  entries: Record<string /* svgHash */, {
    regions: Record<string /* regionPath */, {
      role: TonalRole;
      confidence: number;
      classifiedBy: 'rules' | 'cached-llm' | 'decision-tree' | 'manual';
      classifiedAt: string;  // ISO date
    }>;
  }>;
};
```

v1 ships with this file empty + schema documented. v2 build-time script populates it. v3 doesn't need this file — tree provider classifies at runtime.

### Override store provides training data shape

Doc 06's `OverrideStore` already stores `signalsSnapshot` per override. That's the training data shape for v3's decision tree (when it gets retrained). No schema change needed in v3 — overrides already in the right shape.

### Per-shape breakage catalog — foundation for the MANUAL-TOGGLE smart layer

**Added 2026-06-08** per Sebastian's framing during Desk Doodles audit work.

**Two-part build:** the smart layer is (1) a recognition + classification system that learns element roles + per-toggle scaling curves, AND (2) the foundational dataset the system bootstraps from. The system is set as the foundation only AFTER it's been initially trained on our dataset.

Smart Hachure v1-v3 above target the *fillStyle / hachure-density* surface. The MANUAL-TOGGLE smart layer (wobble / bowing / strokeWidth / curveTightness scaling per element role — NOT roughness, see note) is a parallel surface using the same `signals → classify → treatment` engine, and its **training data isn't override events — it's per-shape breakage observations from the `/audit` route.**

*Roughness note:* the roughness slider is excluded from the manual-toggle smart-layer scope today. Per `09-LOCKED-MODEL.md §I-11` (locked 2026-06-04), roughness is reserved for Cluster 4 Surface Texture repurpose (3D-PBR-style stroke surface quality, not trajectory). Per-region smart-layer scaling for roughness applies only AFTER that Cluster 4 wiring lands; until then the slider is a placeholder with no rendering effect.

**Method:**

1. The Desk Doodles `/audit` route renders every shape in the inventory simultaneously. A playwright sweep harness drives each modifier across its range, screenshots each shape, captures `[dd-diag]` console logs.
2. Each "X breaks at slider value Y on shape Z" observation = one labeled training example: `(element-features-of-Z) → (correct-scaling-curve-for-the-modifier-on-element-Z)`.
3. **Concrete example (2026-06-08):** at wobble=0.8 on `pencilStubJar`, the pencil-tip polygons (4-5px geometry inside an 80px parent SVG) shred — same slider value applied uniformly to outer-shell and decorative-tip is wrong. Label: `{role: decorative-tip, parentSize: 80, ownSize: 5} → scaling-curve(wobble) = 0.2-0.4 of user value`.
4. As the audit catalog grows, the smart layer's classifier consumes these labels to predict per-element scaling without needing manual labels per asset.

**Why this matters for the maturity model (above):**

- v1 (rules-only) for manual-toggle scaling = the **geometric-mean intermediate** currently shipped in `SvgStyleTransform.tsx` (sqrt(perChild × group) bbox). Soft per-detail compromise. Ships now without classifier.
- v2 (rule-based + cached LLM pre-pass) = same pattern as fillStyle v2 — at build time, for each shape in the inventory, ask the LLM to label each element's role (outer-shell / decorative-tip / internal-detail / etc.) and cache. Runtime classifier reads cache.
- v3 (decision tree) = retrain on accumulated audit labels + user overrides.

**Where the data lives:**

- Audit run outputs: `/tmp/dd-audit/` for now, graduate to repo-local `audit-runs/YYYY-MM-DD/` if the corpus becomes load-bearing.
- The catalog is NOT thrown away at the end of a debug session — it's the dataset.

**Cross-reference:**

- `makeathon-plan.md §8.6` "Direct-manipulation sliders" row (REVISED 2026-06-08) — declares manual-toggle scaling as a smart-layer surface.
- Memory: `project_smart_layer_foundation_via_audit` — "the audit IS the dataset, don't throw it away."

---

## v2 architecture (cached LLM build-time pre-pass)

**Timing:** added when (a) we've seen enough novel SVGs to know rules cover < 80% confidently OR (b) the visitor canvas opens with uploaded SVGs.

### When the LLM runs

NOT at render time. NOT per visitor interaction. **At BUILD TIME ONLY**, against the asset corpus:

```
build pipeline:
  for each SVG in asset corpus:
    if any region returned confidence < 0.7 from rules:
      send {svg, signals, low-confidence-regions} to LLM
      cache LLM's classification to smartHachure-cache.json
  
runtime classifier:
  for each region:
    rules → if low confidence, check cache → override store
```

This means: the LLM has been called maybe 50-200 times TOTAL across all assets, results cached, never re-called per visit. Cost = bounded. Latency = build-time only. Determinism = cache acts as fixed lookup table.

### LLM provider pick (deferred to v2)

5 candidates when it's time to pick:

| | Provider | Pros | Cons |
|---|---|---|---|
| A | Anthropic Claude (Haiku for cost) | Strong vision capability, good at structured output, Sebastian uses Claude Code | API key + cost; external dependency |
| B | OpenAI GPT-4o-mini | Similar capability tier, broad ecosystem | Same external-dependency concern |
| C | Local Llama / Mistral via Ollama | No external API, deterministic, offline-capable | Local compute required at build; lower out-of-box accuracy than hosted |
| D | OpenRouter (multi-provider) | Provider-agnostic, fallback resilience | Extra layer; complexity |
| E | None — skip v2 entirely, jump v1 → v3 | Simplest | Loses the "novel-SVG out-of-box accuracy" win |

Decision deferred. When v2 opens, enumerate again with actual usage data.

### Build-time integration

```ts
// scripts/build-classification-cache.ts (run via npm script before build)
import { extractSignals, classify } from '../src/app/lib/smartHachure';
import { ruleEngineProvider } from '../src/app/lib/smartHachure/providers/rules';
import { askLLM } from '../src/app/lib/smartHachure/providers/cachedLLM';

const corpus = loadAllSvgAssets();
const cache: ClassificationCache = { version: 1, entries: {} };

for (const svg of corpus) {
  // run rules locally
  const rulesResult = classifyWithRules(svg);
  // collect low-confidence regions
  const uncertain = rulesResult.filter(r => r.confidence < 0.7);
  if (uncertain.length === 0) continue;
  // ask LLM for the uncertain ones
  const llmResult = await askLLM(svg, uncertain);
  cache.entries[hashSvg(svg)] = { regions: llmResult };
}

writeJson('apps/Hero-8-Lab/public/smartHachure-cache.json', cache);
```

Runs as part of CI or pre-deploy. Cache version-controlled in git.

### Few-shot prompt structure

Per Agent 4 — cap at 8 examples per prompt to avoid over-prompting. Pull from override store, sorted by signal-similarity to the current region:

```
SYSTEM: You are a classifier for SVG fill regions in a hand-drawn portfolio tool.
Given the structural signals + the SVG context, label each region as:
paper | sparse-tonal | mid-tonal | dense-tonal | solid-content |
structural-frame | decorative-accent | line-decoration | label-text

USER: Here are 8 similar regions Sebastian has already labeled:
{8 most-similar overrides as JSON}

Now classify these regions:
{low-confidence regions from current SVG as JSON}
```

Sebastian's corrections become future few-shot examples = the system gets better at HIS classification preferences over time without needing to retrain a model.

---

## v3 architecture (decision tree retrained on overrides)

**Timing:** added when override-table volume exceeds ~500 entries. Earliest realistic = 6 months into active use.

### Why not jump straight to v3 from v1?

Decision trees need labeled data. The override store IS the labeled data — but only after Sebastian accumulates enough corrections. Until then, v2's cached LLM is the bridge.

### Tooling

`ml-cart` from the mljs ecosystem (per Agent 4). Pure JavaScript, browser-runnable, sklearn-equivalent API.

```ts
import { DecisionTreeClassifier } from 'ml-cart';

const tree = new DecisionTreeClassifier({
  gainFunction: 'gini',
  maxDepth: 6,  // bias-prevent overfitting on personal corpus
  minNumSamples: 10,
});

const X = overrides.map(o => signalsToFeatureVector(o.signalsSnapshot));
const y = overrides.map(o => o.role);

tree.train(X, y);

// serialize
const treeJson = JSON.stringify(tree.toJSON());
writeFile('apps/Hero-8-Lab/public/smartHachure-tree-v1.json', treeJson);
```

### When tree retraining runs

NOT at render time. Periodic batch job:
- Manual trigger (Sebastian runs `npm run smartHachure:retrain`)
- OR auto-trigger every N=50 new overrides
- OR build-time alongside cache regeneration

### Tree versioning

Each retrained model gets versioned: `smartHachure-tree-v1.json`, `v2.json`, etc. Old versions never deleted. Sebastian can roll back if a new tree behaves worse.

### When tree promotes from secondary to primary classifier

The chain is `rules → cached-LLM → tree → manual`. At first, tree is the LAST automated fallback (low trust). Once Sebastian has reviewed N=20 tree-only classifications and accepted them, tree promotes to SECOND position (after rules, before cached-LLM). Promotion is a manual config change, not automatic.

---

## Sketch-training mini-lab pointer (separate scope)

Per task #30 — Sebastian feeds sketches → system learns his personal multi-axis style preferences.

**Why it's separate scope:**
- Different training data source (Sebastian's actual sketch corpus, not classifier overrides)
- Different model architecture (probably needs vision encoder, not tabular features)
- Different deployment (probably runs at build time per Sebastian-asset, not browser inference)
- Different evaluation harness (perceptual match against his sketches, not classification accuracy)
- Involves data collection workflow (Sebastian sketches + uploads + tags)

**Why it's pre-supported by this architecture:**
- Multi-axis treatment vocabulary in doc 06 IS the feature space the sketch-trained model would output
- Override store stores `Signals → Treatment` mappings — the same shape as sketch-training data
- Treatment selector in doc 06 has a `biasMode` field that a sketch-trained model could feed
- Classifier chain accepts any new provider — sketch-derived classifier slots in same as cached-LLM

**Sebastian's "feed me stuff" workflow** (rough sketch, real planning happens in task #30):
1. Sebastian sketches a tonal region by hand
2. Photographs / scans / draws-on-tablet, uploads
3. System extracts mark properties (gap, weight, pressure, opacity, layer count)
4. System extracts source-region properties (size, darkness, role)
5. Training corpus accumulates `{source signals → mark properties}` pairs
6. Periodic training produces a sketch-style model
7. Model plugs into Smart Hachure as an alternative `TechniqueSelector`

---

## Cross-references

- v1 module definitions: `06-architecture-technical-core.md`
- Vision roadmap (Concepts A/B + future): `08-vision-roadmap.md`
- Memory: `user_parked_future_projects.md` (related parked spinoff: personalized portfolio app)
- Memory: `feedback_research_first_no_fake_provenance.md` (cited research must be real)
- Task #22 — Smart Hachure rebuild active
- Task #27 — v1 implementation
- Task #30 — Sketch-training mini-lab (separate scope)

---

## Open decisions (deferred until v2 opens)

1. **LLM provider pick** (5 options enumerated above) — TBD when v2 opens
2. **Caching strategy** — single JSON file vs per-SVG sidecars — TBD when v2 opens
3. **Cost budget** — TBD when v2 has usage data
4. **Build-time vs CI integration** — local npm script vs CI/CD step — TBD when v2 opens
5. **Tree retraining trigger** — manual vs N-overrides vs build-time — TBD when v3 opens

These are NOT blocking v1. v1 ships with hooks for all of them; the deferred decisions get made when their phase opens with real data.

---

## Why this architecture matches Sebastian's wedge

Per `user_goals_and_wedge.md` — Sebastian's interests: trust · reversibility · authorship · steering · human-in-the-loop control.

- **Trust:** rules are inspectable, LLM cache is auditable, tree is interpretable. Every classification carries provenance (which provider, fired rules, signal snapshot).
- **Reversibility:** override store is git-versioned JSON. Roll back via `git revert`. Tree versions never deleted. LLM cache regenerable at any time.
- **Authorship:** Sebastian's overrides ALWAYS win. ML is suggestion; manual is canon.
- **Steering:** confidence threshold is configurable. Provider chain can be reordered. Tree can be retired if it misbehaves.
- **Human-in-the-loop:** rule promotion log requires manual approval. Tree promotion requires manual approval. Nothing silently shifts.

Maps exactly to the agentic-creative-tools wedge.
