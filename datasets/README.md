# `datasets/` — the persistent labeled dataset for the Desk Doodles smart layer

**One sentence:** This directory is the *growing, on-disk, version-controlled* labeled dataset that the smart layer's collectors feed into — so every test / debug / audit / conversion run **accumulates** real labeled examples instead of vanishing in per-session `window.__dd_*` memory.

This is the plumbing the smart-ML ladder calls "the receipts" (`docs/knowledge/15-the-smart-ml-ladder.md`). The collectors (`window.__dd_decisionLog`, `__dd_inputPickLog`, the conversion receipts, the fidelity catalog) are **write-only, append-only side channels in RAM** — once the tab closes the labels are gone. This directory is where they land permanently.

> **HONESTY LINE (this is a hard rule — `feedback_actual_ml_not_fake` / `04-the-ml-layer.md`):**
> Today this directory holds a **labeled dataset**, not a trained model. There is no model file here, no training run, no inference. The shipping smart system is a rule engine. This dataset is the raw material the *future* trained provider needs — and we are now persisting it so it actually accrues.

---

## Files

| File | What it is | Grows? |
|---|---|---|
| `smart-layer.dataset.jsonl` | **THE dataset.** One JSON object per line = one labeled example. Append-only, deduped on a stable key. | yes — every feed run |
| `smart-layer.manifest.json` | Sidecar metadata: schema version, per-source counts, the regime ledger, the high-water `ingestIndex`, dedupe key. NOT the examples — just the accounting. | rewritten each feed run |
| `README.md` | this file — the schema + the contract | as schema evolves |

JSONL (newline-delimited JSON) is the format on purpose: appending N new examples is appending N lines, never rewriting a 1MB array. Every standard ML loader (pandas `read_json(lines=True)`, HF `datasets`, DuckDB `read_json_auto`) reads it directly.

---

## The per-example schema (one line of the `.jsonl`)

Every example is a `(features → label)` row with full provenance. Fields:

### Identity / dedupe
| Field | Type | Meaning |
|---|---|---|
| `exampleId` | string | stable dedupe key = `${source}:${svgHash}:${regionPath}` (region examples) or source-specific (see below). Re-feeding the same observation **updates in place**, never duplicates. |
| `ingestIndex` | integer | **monotonic** per-example counter (0, 1, 2, …) assigned at first ingest. This is the time-free ordering — scripts NEVER read the clock to order examples (S-rule: no `Date.now()` inside the feeder; a timestamp, if ever wanted, is *passed in* as `--captured-at`). |

### Features (the `Signals` vector the classifier reads — `signals.ts`)
The classifier-decision examples carry the geometric / topological / stylistic / perceptual signal snapshot. Stored under `features`:
| Field | From | Meaning |
|---|---|---|
| `darknessL` | `signals.darknessL` | `1 − OKLab L*` — 0 = paper, 1 = pure ink (I-2 source-darkness identity) |
| `area` | `signals.area` | bbox area in px² |
| `fillStyle` | `treatment.fillStyle` | the mark grammar the treatment resolved to |
| *(extensible)* | — | the seed (golden) carries the four fields the decision log persists today (`darknessL`, `area`, plus `fillStyle`); the full `Signals` vector (aspectRatio, strokeWidthBin, zIndex, areaFractionOfParent, enclosesSiblingCount, isPartOfStripeCluster, tag, …) is captured whenever a feed source provides it. Missing features are **absent**, never faked with a default. |

### The label (what the example teaches)
| Field | Type | Meaning |
|---|---|---|
| `labelKind` | enum | `'role'` (classifier role label) · `'correct-or-not'` (a correction tuple) · `'treatment'` (conversion/3D treatment) · `'fidelity'` (breakage verdict) — which of the smart layer's decision surfaces this example labels |
| `label` | string | the value: for `role` → the `TonalRole` (`paper`/`solid-content`/`line-decoration`/`structural-frame`/`label-text`/`dense-tonal`); for `treatment` → the geometry/treatment kind; for `fidelity` → the verdict (`ok`/`partial`/`no-op`/`broke`) |
| `confidence` | number | the classifier's confidence at decision time (for `role`/`treatment`); `1.0` for human-blessed labels |
| `rawScore`, `margin` | number | QW-2 uncapped score + winner−runnerUp (uncertainty sampling fuel) |
| `firedRules` | string[] | provenance — which rules voted (a model can't give this; we keep it) |
| `classifiedBy` | enum | `'rules'` / `'cached-llm'` / `'decision-tree'` / `'manual-override'` |
| `isGroundTruth` | bool | `true` = a human blessed/corrected this (override, chip flip, golden bless). These are the highest-value preference labels. |

### Source provenance
| Field | Type | Meaning |
|---|---|---|
| `source` | enum | `'golden'` · `'audit-decisionlog'` · `'conversion'` · `'conversion-correction'` · `'input-pick'` · `'fidelity-2d'` · `'fidelity-3d'` — WHICH collector produced this example |
| `renderSurface` | enum\|null | G-10 surface scope: `'record'`/`'desk-lens'`/`'pen-preview'`/`'sandbox'`/`'audit'`/`null`. **`null` = honestly unwired** — never guessed. Training exports must triage null, not mix it with canonical record renders (the G-10 poison). |
| `svgHash` | string | content hash of the source SVG (region examples) |
| `regionPath` | string | stable region address (`circle[0]`, `g[1]/path[0]`) |

### ★ S11: the geometry regime / epsilon (NON-NEGOTIABLE — edge S11)
Per `05-the-interconnection-graph.md` walk 5 + `22-research-simplification-toggle.md` S11: **every sample MUST record its geometry regime, or the training set silently mixes geometry regimes** (a heart at 9 anchors vs 8 anchors are different examples, and the renderer-identity dispatch flips between them). Stored under `regime`:
| Field | Type | Meaning |
|---|---|---|
| `regime.epsilon` | number | the RDP ε this example's geometry was simplified at. The 197-shape /audit catalog + the golden 1,394 were ALL captured at the **canonical ε = 3.0** (`SvgStyleTransform.tsx:1731`). |
| `regime.polyAnchorCap` | number | the polygonal-vs-curve dispatch cap (canonical = 8, `:1791`). |
| `regime.label` | string | human-readable regime tag, e.g. `'canonical-eps3'` — examples from different regimes never co-train without an explicit decision. |

A feed source that cannot state its regime is ingested with `regime.epsilon: null` + `regime.label: 'unknown'` and **flagged in the manifest** — it is never silently folded in as canonical.

---

## How to grow it (the one command)

```bash
# from repo root. Seeds from the blessed golden 1,394 — NO dev server needed:
node tools/dataset/feed-dataset.mjs --from-golden audit-runs/golden-labels.v2.json

# fold in a live headless /audit decision-log pull (dev server on :5182):
node tools/dataset/feed-dataset.mjs --from-audit

# fold in a fidelity-catalog report (2D style sweep or 3D gauntlet):
node tools/dataset/feed-dataset.mjs --from-fidelity-2d /tmp/dd-audit/results.json
node tools/dataset/feed-dataset.mjs --from-fidelity-3d /tmp/dd-gauntlet/gauntlet-report.json

# do several in one run:
node tools/dataset/feed-dataset.mjs --from-golden audit-runs/golden-labels.v2.json --from-audit
```

Every run **appends new examples, updates changed ones in place (dedupe key), and never duplicates.** The `ingestIndex` high-water mark only ever goes up. Re-run it after any test/debug/conversion session and the set grows.

`--captured-at <ISO>` is optional and only stamps a manifest field — the feeder never reads the system clock itself (determinism rule).

---

## What is and isn't possible *today* (honest)

- **Possible now:** persist + grow + dedupe + regime-stamp the labeled dataset; uncertainty-rank it (`ambiguity-queue.js`); measure rule-engine calibration against it (`reliability.js`, with its honest upper-bias caveat).
- **NOT honestly possible yet — and we will not fake it:** training a model and reporting a *held-out* accuracy. The dataset's `role` labels currently originate as **blessed classifier output** (golden v2 = Sebs eyeballing the rule engine's own decisions). Training a model on those labels and evaluating it on a held-out slice of the same labels measures *"can a model imitate the rule engine,"* not *"is the model right"* — and any accuracy number off that split is leakage-flavored, exactly the `reliability.js` caveat. A real held-out metric needs **independent ground truth**: the override/correction tuples (`isGroundTruth: true`) and net-new human-corrected regions. Those accrue through this pipeline; the trained-model rung opens (per `04` / `15`) once that human-labeled volume clears the ~500 bar — **post-makeathon, by explicit plan.** Until then the honest report is the count, the split feasibility, and the sources flowing in.

## Cross-refs
- `docs/knowledge/15-the-smart-ml-ladder.md` — "ahead on engines, behind on receipts"; this dir IS the receipts ledger
- `docs/knowledge/04-the-ml-layer.md` — the two dataset streams; the don't-fake-it rule
- `docs/knowledge/05-the-interconnection-graph.md` — edge S11 (the regime rule)
- `tools/classifier/` — the snapshot/diff/ambiguity/reliability tools that read this seed
- `audit-runs/golden-labels.v2.json` — the 1,394-region blessed seed
