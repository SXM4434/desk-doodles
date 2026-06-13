# tools/ml — the first REAL trained model for the smart layer

This is the "actual training, actual model, actual eval" rung of the ML ladder
(docs/knowledge/04-the-ml-layer.md + 15-the-smart-ml-ladder.md). It honors the
hard rule **feedback_actual_ml_not_fake**: a real labeled dataset, a real
leakage-safe train/test split, a real fitted model, and honest held-out metrics.

## What it is

A **softmax logistic-regression** region-role classifier, trained from scratch
(minibatch SGD, no external ML deps) on the golden labeled dataset
`datasets/smart-layer.dataset.jsonl` (1,394 examples, 6 role classes).

- `lib.mjs` — dataset I/O, feature encoding, the leakage-safe shape-grouped
  split, the SGD softmax trainer, metrics, and two comparison baselines. Pure
  functions, zero deps.
- `train-region-classifier.mjs` — the re-runnable entry point: load → split →
  standardize (on train only) → train → evaluate on held-out test → compare to
  baselines → write the artifact.

## Run / re-run (re-trains as the dataset grows)

```bash
node tools/ml/train-region-classifier.mjs --verbose
# options: --test-fraction 0.25  --seed desk-doodles-v1  --epochs 300  --lr 0.3  --l2 1e-3
#          --dataset datasets/smart-layer.dataset.jsonl  --out datasets/smart-layer.model.json
```

Output artifact: `datasets/smart-layer.model.json` (weights + standardizer +
class list + split receipt + metrics + honesty notes).

## The split rule (no leakage)

Examples are **grouped by `svgHash`** (shape); whole shapes go to either train
or test, never split across. A shape's regions are near-duplicates (shared
darkness/area regime), so a region-level random split would leak. The split is
deterministic by a seeded hash of `svgHash`, and disjointness is asserted at
runtime (the script exits non-zero if any shape lands in both sides).

## Honest result (default seed; mean over 5 seeds in parens)

| Model (held-out, unseen shapes) | accuracy | macro-F1 |
|---|---|---|
| majority-class baseline | 27.4% (~27%) | 0.072 |
| lookup baseline (rule-style, same 3 features) | 51.9% (~59%) | 0.282 (~0.31) |
| **LEARNED softmax LR** | **65.2% (~66%)** | **0.616 (~0.62)** |
| (train-set acc, overfit check) | 68.1% | 0.629 |

The learned model beats the majority baseline by ~+38 pts and the rule-style
lookup baseline by ~+13 pts on accuracy, and roughly **doubles macro-F1** on
this imbalanced data. Train≈test (68% vs 65%) ⇒ not overfit. Stable across 5
independent shape-grouped splits ⇒ N=1394 supports a stable result.

## What is honestly limited

- **Only 3 features exist in the dataset** (`darknessL`, `area`, `fillStyle`);
  the rule engine reads ~10 `Signals`. This model answers "how far do those 3
  predict the role", not "can it replace the rule engine."
- **`fillStyle` is downstream of classification** (it's a rendered treatment
  output, not a `Signals` field), so it is unknown at runtime classify-time.
  Ablation: WITH fillStyle 65.4% mean, WITHOUT it 59.8% mean. The runtime-honest
  number is ~60% until a `Signals`-only retrain.
- **Label provenance:** golden labels originated as blessed rule-engine output,
  so labels + rule baseline share an ancestor. The held-out metric still
  measures generalization to UNSEEN shapes, which is the honest claim.

## Wiring (deferred, on purpose)

`src/app/lib/smartHachure/learnedProvider.ts` is the bolted-in seat: it loads
the artifact and exposes `makeLearnedProvider()` as a `ClassifierProvider`.
It is **not** inserted into the chain yet because of the `fillStyle`-at-runtime
gate above — wiring should follow a `Signals`-only retrain. The one-line edit
when ready (index.ts:194):
`providers = opts.providers ?? [ruleEngineProvider, learnedProvider]`.

---

# v2 — the SIGNALS-ONLY model (the honest, production-wireable retrain)

The v1 above used `fillStyle`, which is **downstream of classification** (a
treatment output, unknown at classify-time) — so it can't go live as-is. v2
drops it and trains on the **full classify-time `Signals` vector** captured via
the production extractor.

## The three re-runnable steps

```bash
# 1. CAPTURE — render the /audit 197-shape inventory through the REAL providers,
#    run the PRODUCTION extractAllSignals + hashSvg + ruleEngineProvider verbatim,
#    dump the full Signals vector per (svgHash, regionPath). Builds + serves an
#    isolated harness (touches ZERO production code).
node tools/ml/capture-signals.mjs --serve        # → tools/ml/captured-signals.json

# 2. ENRICH — join the captured signals onto the blessed golden role labels and
#    UPSERT into datasets/smart-layer.dataset.jsonl (dedupe by exampleId; the
#    1,394 golden rows are UPDATED in place with the full feature vector).
#    fillStyle is recorded OUTSIDE `features` (as `fillStyleTreatment`) so it
#    cannot leak; the old `features.fillStyle` is removed.
node tools/ml/enrich-dataset.mjs                 # feeds the dataset

# 3. TRAIN — softmax LR on signals-only, leakage-safe shape-grouped split,
#    metrics on held-out unseen shapes vs the CURRENT rule engine on the SAME
#    signals.
node tools/ml/train-region-classifier-signals.mjs --seeds 5   # → datasets/smart-layer.signals.model.json
```

`lib-signals.mjs` owns the signals-only feature encoding (32 features: 6
continuous geometric/perceptual + 6 topological + 5 stylistic-binary + stroke-bin
& tag one-hots). It reuses the proven SGD trainer + metrics + shape-grouped split
from `lib.mjs`. **fillStyle is excluded by construction** (the encoder reads only
`ex.features`; fillStyle lives outside it).

## Honest result (32 signals-only features; mean over 5 shape-grouped splits)

| Model (held-out, unseen shapes) | accuracy | macro-F1 |
|---|---|---|
| majority-class baseline | 29.0% | 0.074 |
| **CURRENT rule engine** (same real signals) | **77.5%** | 0.714 |
| **LEARNED softmax LR (signals-only)** | **92.7%** | **0.881** |
| (train-set acc, overfit check) | 94.8% | 0.894 |
| signals + LEAKY fillStyle (ablation, NOT shippable) | 96.3% | 0.920 |

**Beats the rule engine: YES, +15.2 pts** on the same real signals. Train≈test
(94.8% vs 92.7%) → not overfit. Split disjointness asserted (0 shape overlap).

### Why this is beyond rule-imitation (the skeptical check)

On the **84 held-out HARD cases** (where the current rule engine disagrees with
the blessed golden label), the model is **90.5% correct** — a pure rule-imitator
would be ~0% there. On the 284 easy cases (rule == golden) it's 96.5%. So the
model recovers human-blessed intent the rule engine misses, it doesn't just
memorize the rules. Top features by |weight|: `enclosesSiblingCount`, `hasFill`,
`isContained`, `tag=text`, `darknessL` — the same signals the rule clusters use,
weighted better (`fillOpacity` is NOT a top feature → no soft darkness-proxy
leak).

## The label-regime caveat (printed + in the artifact — not hidden)

Golden v2 was blessed under the **OLD darkness regime**. The wash-darkness fix
(`signals.ts` color-mix → 8%) changed `darknessL` on **345/1394** regions AFTER
blessing. So golden labels are **partly independent** of the current rule engine
(75.3% full-set agreement). This is why the rule baseline is "only" 77.5% — the
fix legitimately moved the rule engine away from the old blessed reads. Both the
learned model and the rule baseline read the SAME current signals; the held-out
metric is fair. A **golden v3 re-bless** (already pending per SESSION-HANDOFF —
the 279 wash flips) would tighten both numbers.

## Wiring — FLAGGED FOR THE PENDING QUEUE (not done this phase)

The model beats the rule baseline and all wiring files (`classifier.ts`,
`index.ts`, `learnedProvider.ts`) are COLD — so wiring is now *permitted*. But
it is **deliberately deferred to the next phase** (per the retrain task: "Do NOT
wire yet — the next phase decides wiring"). When wiring is decided:
1. point `learnedProvider.ts` at `datasets/smart-layer.signals.model.json` +
   the 32-feature signals-only encoder (it currently loads the v1 3-feature
   artifact);
2. `index.ts:194` → `providers = opts.providers ?? [ruleEngineProvider, learnedProvider]`
   (rules first for provenance + confident cases; learned fills where rules
   abstain). Before flipping: re-bless golden v3, re-run the regression check
   (6 representative shape classes) per `feedback_never_declare_fixed_without_regression_check`.
