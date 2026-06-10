# Agent 4 — Classifier architecture comparison

**Date:** 2026-06-03
**Word count:** ~1190
**Status:** Verified research with cited sources

---

# Classifier Architecture for the Smart Hachure System

**Decision context.** The classifier's job, per the F3 shading calibration spec, is to look at an arbitrary SVG's fill regions and tag each one with a semantic role — `paper` (no shading), `tonal-content` (dense hachure), `accent` (sparse hachure), `structural` (frame/border, no shading), `cutout` (inner negative shape). The current Hero-8-Lab implementation hard-codes role detection by reading source CSS tokens (`STROKE` / `WASH` / `BG` per spec §1.3) — that works for Hero-8 source SVGs but fails the project's stated requirement: work on ANY SVG and learn over time.

Five architectures are real candidates. One is the recommendation; the others have legitimate use cases at different time horizons.

---

## 1. Rule-based / expert system

Hand-coded heuristics over the structural signals already documented in the related research thread (bbox containment, stroke-width, sibling overlap, color luminance, depth in DOM tree, area ratio, fill-token literal match).

**Pros.** Deterministic — same SVG always produces same classification. No training data needed. Trivially debuggable: every classification carries a "rule X fired at signal Y" trace. Adding a new heuristic is a one-line edit. Runs in <1ms per region (microbenchmark; no library overhead). Maps cleanly onto Sebastian's stated wedge interest in **trust, reversibility, authorship** — every decision is inspectable in source.

**Cons.** Rule accumulation curve is brutal: at ~30 rules the interaction matrix has 435 pair-orderings; at ~50 rules it's 1,225. Maintenance moves from "edit a function" to "debug an ordering precedence problem." Brittle for genuinely novel SVG conventions (e.g., Figma-exported clip-paths, Adobe Illustrator's `<switch>` fallbacks). The "learns and improves" path is **override tables + new rules**, not actual learning — every correction becomes a maintainer task.

**Performance.** Day 1 accuracy on Hero-8-Lab's own source: ~95% (the existing token-match code already proves this). On a random SVG from the wild: estimate 60–75% based on the literature on rule-based vs. learned visual classifiers ([Algomox: Hybrid Threshold-Based Rules with AI/ML](https://www.algomox.com/resources/blog/hybrid_approach_pairing_threshold_based_rules_with_ai_ml_techniques)).

**Learning mechanism.** "When Sebastian corrects → add to override table keyed by `{svg-hash, region-id}`; when 5+ overrides share a signal pattern, surface a rule-promotion prompt." Real, just doesn't scale beyond a few hundred SVGs.

---

## 2. Decision tree / random forest

Lightweight ML over the same structural signals, trained on Sebastian's labeled corpus.

**Pros.** Handles non-linear interactions between signals that hand rules miss. **Fully interpretable** — every leaf is a path you can render as English ("inner bbox AND stroke-width > 1.5 AND area ratio < 0.3 → structural"). Trains on tens-to-hundreds of examples, not thousands. Runs in <5ms in-browser. Tooling: [`ml-cart`](http://mljs.github.io/decision-tree-cart/) is the canonical sklearn equivalent for JS, ships `DecisionTreeClassifier` with `gainFunction`, `maxDepth`, `minNumSamples` — same API shape as sklearn ([mljs/decision-tree-cart](https://github.com/mljs/decision-tree-cart)). Random forest via the same ecosystem (`ml-random-forest`).

**Cons.** Needs labeled training data Sebastian doesn't have yet. **Overfits hard on a personal corpus** — if 80% of training SVGs are Sebastian's own desk-object sketches, the tree learns "this looks like Sebastian's sketches" not "this is structural." Mitigation: aggressive `maxDepth` cap (5–8) and bagging via random forest.

**Performance.** Published benchmarks for sklearn CART on small-feature classification tasks land at 85–92% with 200+ training examples; ml-cart matches in JS. ([scikit-learn docs](https://scikit-learn.org/stable/modules/tree.html))

**Learning mechanism.** Periodic batch retrain — collect corrections into a labeled set, retrain every N corrections (50?), version the model.

---

## 3. Small neural net (TensorFlow.js / brain.js)

**Pros.** Pattern recognition over signals where the human couldn't articulate the rule.

**Cons.** Needs thousands of labeled regions, not hundreds. Opaque — failures can't be inspected. Per [TensorFlow.js benchmarks](https://github.com/tensorflow/tfjs/blob/master/e2e/benchmarks/local-benchmark/README.md), small classifier inference is 10–50ms in-browser on WASM backend (10–30× faster than CPU JS but still slower than rules). Training brain.js / synaptic networks for this scale is awkward ([brain.js docs](https://github.com/BrainJS/brain.js): "you should try to train the network offline" — exactly the opposite of "learn and improve at runtime"). Hostile to Sebastian's reversibility requirement.

**Verdict.** Overkill. Skip unless the problem turns out to need image-level vision (rasterizing the SVG and running a CNN on the pixels), which the project's structural-signal framing explicitly avoids.

---

## 4. LLM-as-classifier

Prompt a model with the SVG snippet + signal summary + "classify each region."

**Pros.** Strong out-of-box performance on novel SVGs — uses world knowledge of SVG conventions. No training data needed. Few-shot improvements from in-context examples are real: 10–50% performance lift documented for general classification ([Tetrate: Few-shot Learning for LLMs](https://tetrate.io/learn/ai/few-shot-learning-llms)). Sebastian's corrections become few-shot examples appended to future prompts.

**Cons.** Latency: 800–3000ms per call. Non-deterministic at temp > 0. Cost (rate-limit risk if classifying every region at render time). External-API dependency for a "library-scale build" — violates the "custom dependency" framing. Over-prompting degrades performance past ~10 examples ([Cleanlab: Reliable Few-Shot Prompts](https://cleanlab.ai/blog/learn/reliable-fewshot-prompts/); [arXiv 2509.13196](https://arxiv.org/pdf/2509.13196)) — naive "just keep appending corrections" caps out fast.

**Right call when.** Build-time pre-pass that caches classifications per SVG (run once, store JSON sidecar, ship with the asset). Not at render time. Not in the runtime path. ([Medium: Hybrid Validation Pattern — Rules First, LLM Fallback](https://medium.com/@kumarharsh74799/the-hybrid-validation-pattern-rules-first-llm-fallback-cfe545efcd44))

---

## 5. Hybrid (rules + ML/LLM fallback)

The industry default for high-stakes interpretable classification. Cheap rules cover the high-confidence cases; LLM (or tree) handles the low-confidence tail.

**Confidence threshold pattern.** Per the literature: each rule emits both a classification AND a confidence score; when no rule clears the threshold (commonly 0.7), system escalates. Hugging Face's BERT + phrase-list pattern is the canonical write-up — phrase list as "high-precision filter handling low-hanging fruit," ML for "hard cases requiring complex understanding" ([HuggingFace: High-Confidence NLP on CPU](https://huggingface.co/blog/tlogandesigns/using-ml-to-flag-fair-housing-violations)). Algomox documents the threshold-rule + ML-fallback pattern formally.

**The "< 70% → ask LLM" question.** Yes, this works, with a caveat: **LLM must be a build-time pre-pass, not a render-time call.** The hybrid pattern with LLM as runtime fallback adds 1–3s latency per uncertain region — fatal for an interactive lab. Build-time pre-pass means: rules classify on first SVG ingest, LLM classifies the leftover ambiguous regions once, result is cached as a JSON sidecar shipped with the asset.

---

## 6. Learning loop architecture

The hard part. Four mechanisms in candidate order:

1. **Override table (per-SVG keyed).** Sebastian's manual tag wins, full stop, every time. Keyed by `{svg-hash, region-id-path}`. Persisted as JSON in the project repo (per-project), reviewable in git. **This is the reversibility primitive** — to undo a learned change, delete the entry.
2. **Rule promotion log.** When the same signal pattern is corrected N times (N=5 default), surface a *proposed rule* for Sebastian to approve. Approval moves the rule into the live ruleset with a provenance comment (`// promoted 2026-06-15 from 7 overrides`). Never auto-promote.
3. **Few-shot example bank.** For the LLM pre-pass, accumulate corrections as `{signals → role}` pairs. Cap at 8 examples per prompt (over-prompting threshold). Rotate examples by relevance to the current SVG via simple cosine-similarity on signal vectors ([arXiv 2305.14264: Active Learning Principles for ICL](https://arxiv.org/pdf/2305.14264)).
4. **Tree retrain (deferred to year 1).** Once override-table volume exceeds ~500 entries, train an `ml-cart` decision tree on the corrected set. Model file versioned in repo; old versions never deleted.

Persistence lives **in the project repo** as JSON files, not in a memory file. Reason: per-project context (Sebastian's "vinyl box" SVG semantics differ from Sebastian's "boarding pass" SVG semantics); a global memory file would average them into mush.

---

## 7. Trust / control / reversibility

Maps directly to wedge interests:

- **Inspectable.** Every classification carries a trace object: `{role, confidence, fired-rule | matched-override | llm-prediction, signal-snapshot}`. Rendered as a dev-only tooltip.
- **Overridable.** Right-click region → "Tag as ___" → writes to override table, takes effect next render.
- **Auditable.** All corrections + rule promotions are git-committed JSON; full history in `git log`.
- **Reversible.** Delete the override-table entry, or revert the rule-promotion commit.

Neural-net option (#3) fails all four. LLM-only option (#4) fails inspectability and auditability unless logged. Rules + decision tree both pass.

---

## 8. Recommended architecture

**Day 1 (this month):**
- Hand-coded rule engine. ~15–25 rules covering the signals already enumerated (stroke-width threshold, bbox containment, sibling overlap, area ratio, fill-token literal match, DOM depth, luminance). Each rule emits `(role, confidence)`. Threshold for "confident" = 0.7.
- Override table (per-SVG JSON). Manual tag wins.
- No ML, no LLM. Get the rule signal set right before adding capacity.

**3-month maturity:**
- Build-time LLM pre-pass for SVGs where rules left >2 regions uncertain. Runs once on ingest, caches to JSON sidecar. Few-shot prompt includes the 8 most-similar corrections from override table.
- Rule promotion log starts surfacing proposed rules. Sebastian approves/rejects in batch.

**1-year horizon:**
- Decision-tree (`ml-cart`) trained on accumulated overrides. Runs in-browser as second-tier classifier between rules and LLM. Hybrid order: rule → tree → cached-LLM → manual.
- LLM stays build-time only; never runtime.

---

## 9. Tradeoffs

| Approach | Loses | Gains |
|---|---|---|
| Rules only | Novel-SVG accuracy past ~40 rules | Determinism, debuggability, trust posture |
| Tree only | Day-1 accuracy (no data) | Pattern capture without opacity |
| Neural net | Inspectability, reversibility, training simplicity | Pattern capture for fuzzy signals (not needed here) |
| LLM only | Determinism, runtime latency budget, library-as-dependency framing | Out-of-box accuracy on novel SVGs |
| **Hybrid (recommended)** | Architectural simplicity | Each layer covers the previous one's weakness; preserves trust + reversibility |

The recommendation **trades implementation effort for trust durability.** Rules + override table is more code than calling an LLM; tree + LLM hybrid is more code than rules alone. The exchange: every classification is auditable, every learned change is reversible, the system never silently flips behavior. That's the wedge.

---

## Sources

- [ml-cart documentation](http://mljs.github.io/decision-tree-cart/)
- [mljs/decision-tree-cart GitHub](https://github.com/mljs/decision-tree-cart)
- [scikit-learn Decision Trees](https://scikit-learn.org/stable/modules/tree.html)
- [TensorFlow.js Local Benchmark](https://github.com/tensorflow/tfjs/blob/master/e2e/benchmarks/local-benchmark/README.md)
- [BrainJS README](https://github.com/BrainJS/brain.js/blob/master/README.md)
- [Algomox: Hybrid Threshold-Rules + AI/ML](https://www.algomox.com/resources/blog/hybrid_approach_pairing_threshold_based_rules_with_ai_ml_techniques)
- [HuggingFace: High-Confidence NLP on CPU — BERT + Phrase List](https://huggingface.co/blog/tlogandesigns/using-ml-to-flag-fair-housing-violations)
- [Medium: Hybrid Validation Pattern — Rules First, LLM Fallback](https://medium.com/@kumarharsh74799/the-hybrid-validation-pattern-rules-first-llm-fallback-cfe545efcd44)
- [Tetrate: Few-Shot Learning for LLMs](https://tetrate.io/learn/ai/few-shot-learning-llms)
- [Cleanlab: Reliable Few-Shot Prompt Selection](https://cleanlab.ai/blog/learn/reliable-fewshot-prompts/)
- [arXiv 2509.13196: Over-Prompting Large Language Models](https://arxiv.org/pdf/2509.13196)
- [arXiv 2305.14264: Active Learning Principles for In-Context Learning](https://arxiv.org/pdf/2305.14264)
- [AAAI: User-Driven Model Adjustment via Boolean Rule Explanations](https://cdn.aaai.org/ojs/16737/16737-13-20231-1-2-20210518.pdf)
- [arXiv 2506.19573: Interpretable Hybrid ML Models with FOLD-R++](https://arxiv.org/pdf/2506.19573)
