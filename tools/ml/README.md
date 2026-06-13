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
