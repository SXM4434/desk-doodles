# 24 — Research: Smart-System Classifier Improvements

**Date:** 2026-06-11 (Day 10 of 14)
**Status:** Research only — no code edits. Online research with verifiable citations per `feedback_research_first_no_fake_provenance`.
**Scope:** How to improve the Desk Doodles smart-system classifier (`src/app/lib/smartHachure/classifier.ts` + `signals.ts` + `techniqueMap.ts` + `overrideStore.ts`) across 6 areas: confidence calibration · learned rule weights · provider-chain patterns · active learning from overrides · evaluation harness · kill-list compliance.
**Read first:** `docs/locked-refs/F3-smart-hachure-system/09-LOCKED-MODEL.md` (the contract, esp. §7 kill-list), `04-agent-research-classifier-architectures.md` (the research that picked this design), `07-architecture-ml-pipeline.md` (provider-chain hooks; superseded except audit-as-dataset), `19-research-cross-axis-interconnection.md` (graph spirit for §8).

---

## 0. The system as it exists (read 2026-06-11, actual source)

What's live in `src/app/lib/smartHachure/`:

- **`signals.ts`** — feature vector per region: geometry (`bbox`, `area`, `aspectRatio`, `perimeter`), topology (`zIndex`, `areaFractionOfParent`, `enclosesSiblingCount`, `containedInZIndex`, `isPartOfStripeCluster`), style (`fill`, `stroke`, `strokeWidthBin`, `hasDasharray`, `tag`, `opacity`, `fillOpacity`), perceptual (`darknessL` = 1 − OKLab L via culori, with W1 token table + color-mix + url(#) gradient resolution).
- **`classifier.ts`** — 16 independent rules (`ALL_RULES`), each emitting `(role, confidence)` with hand-guessed constants in **0.55–0.95**. All rules fire; confidence **sums additively per role**; best role wins; final confidence = `Math.min(1, bestScore)`. Provider chain: first provider with `confidence ≥ ctx.confidenceThreshold` (0.7 per doc 07) wins; manual override (`overrideStore`) wins outright at confidence 1.0; conservative fallback = `paper` at confidence 0.
- **`techniqueMap.ts`** — `BASE_BY_ROLE` (9 roles → 5-axis treatment), style modulation, slider modulation with Agent-5 clamps (weight ≤ 0.7 × gap, gap ∈ [1.5, 12]px, tiny-area < 40px² → solid).
- **`overrideStore.ts`** — manual labels keyed `(svgHash, regionPath)`, localStorage v1, JSON export/import, djb2 `hashSvg`.

**The §7 tension, named honestly.** `09-LOCKED-MODEL.md §7` kill-lists the 9-role taxonomy, `BASE_BY_ROLE`, role-multiplier×slider math, and the confidence-threshold-fallback-to-paper — superseded by the 6-axis per-fillStyle density model. The makeathon code still ships the role engine, re-scoped so it does NOT violate I-1: the classifier decides **which regions get fill marks and at what density register**; the user's fillStyle dropdown picks the grammar via the narrow override (`feedback_fillstyle_slider_must_switch_classifier_pick`). Every recommendation below is therefore framed at the level of **scores vs. labels vs. escalation** — machinery that survives the §7 teardown unchanged, because none of it cares whether the label space is 9 roles or (mark-decision × identity band). §6 maps each recommendation against the kill-list explicitly; §7.4 (P-8) specifies the role-agnostic label schema that makes the dataset portable across the taxonomy change.

**Concrete weaknesses this research targets (observed in source):**

1. **Confidences are hand-guessed constants.** 0.55–0.95 were authored, never measured. The 0.7 threshold compares an additive SUM to a constant: a single correct rule firing alone at 0.55 (all three `root_tonal_*` rules) fails the threshold and silently becomes `paper` → no marks. That recall hole is baked into hand constants, invisible without calibration data.
2. **`min(1, sum)` destroys ranking above 1.0.** Two roles that both saturate tie at 1.0; the tie breaks by `Object.entries` insertion order (deterministic but arbitrary, and strict `>` keeps the first-inserted). Margin information (best − second-best) is computed nowhere and logged nowhere.
3. **The provider chain has one provider.** Escalation semantics ("when do we call something expensive?") are designed (doc 07) but unmeasured — there is no data on WHERE the rule engine is unsure.
4. **Overrides are stored but never learned from.** Every manual tag is a labeled correction; today it only patches one `(svgHash, regionPath)` key. The audit catalog (197 shapes, `project_smart_layer_foundation_via_audit`) is the declared training dataset but no harness consumes it as labels.
5. **No quality measurement exists.** No per-role precision/recall, no regression gate on role flips, no agreement metric against Sebs's eyeball (the ground truth).

---

## 1. Confidence calibration — turning hand-guessed scores into measured probabilities

**The problem in literature terms.** The rule engine's capped sum is a *score*, not a probability: nothing guarantees that regions scored 0.7 are correct 70% of the time. Post-hoc calibration is the standard fix — learn a monotone map from score → empirical probability on held-out labels, leaving the classifier itself untouched.

**Platt scaling (sigmoid).** Fit `P(correct | s) = 1/(1 + exp(a·s + b))` — two parameters — on labeled (score, correct?) pairs. The scikit-learn calibration guide's verified guidance: *"In general this method is most effective for small sample sizes or when the un-calibrated model is under-confident"* ([scikit-learn: Probability calibration](https://scikit-learn.org/stable/modules/calibration.html), [CalibratedClassifierCV](https://scikit-learn.org/stable/modules/generated/sklearn.calibration.CalibratedClassifierCV.html)). This is the right first tool for us: 2 parameters can be fit on ~50–200 labels, and the runtime cost is one sigmoid evaluation.

**Isotonic regression.** Non-parametric monotone step-function fit; corrects any monotonic distortion but *"is more prone to overfitting, especially on small datasets"*; sklearn's explicit threshold: isotonic wins only *"when there is enough data (greater than ~ 1000 samples)"* ([scikit-learn calibration guide](https://scikit-learn.org/stable/modules/calibration.html); same conclusion in [FastML's Platt-vs-isotonic comparison](https://fastml.com/classifier-calibration-with-platts-scaling-and-isotonic-regression/) and [Better Classifier Calibration for Small Data Sets, arXiv:2002.10199](https://arxiv.org/pdf/2002.10199)). Our label count (overrides + blessed audit labels) will live in the dozens-to-hundreds for months → **isotonic is the wrong tool until the dataset crosses ~1000 labeled regions.** Park it.

**Temperature scaling.** Guo et al., *On Calibration of Modern Neural Networks* (ICML 2017): a single-parameter variant of Platt scaling that rescales logits; introduced **Expected Calibration Error (ECE)** — bin predictions by confidence, measure |confidence − accuracy| per bin ([arXiv:1706.04599](https://arxiv.org/abs/1706.04599), [PMLR pdf](https://proceedings.mlr.press/v70/guo17a/guo17a.pdf)). Two takeaways transfer directly: (a) ECE + reliability diagrams are the measurement vocabulary for "is 0.7 real?"; (b) a 1-parameter map fit on held-out data is often enough.

**Conformal prediction.** Angelopoulos & Bates, *A Gentle Introduction to Conformal Prediction and Distribution-Free Uncertainty Quantification* ([arXiv:2107.07511](https://arxiv.org/abs/2107.07511), [reference implementation](https://github.com/aangelopoulos/conformal-prediction)): wrap ANY pre-trained scorer; using a small calibration set, produce prediction SETS guaranteed to contain the true label with user-chosen probability (e.g. 90%), distribution-free. For us the natural use is **escalation/abstention semantics**: when the conformal set at 90% coverage contains more than one role, that region is genuinely ambiguous → escalate to next provider / surface for manual tag. Split conformal needs only a modest calibration set; class-conditional (Mondrian) variants give per-role coverage once per-role label counts allow.

**Venn-Abers predictors.** Vovk & Petej (UAI 2014): isotonic-based calibrators that are *"guaranteed to be well calibrated"* under exchangeability and output a (lower, upper) probability pair per prediction ([arXiv:1211.0025](https://arxiv.org/pdf/1211.0025), [UAI pdf](https://www.auai.org/uai2014/proceedings/individuals/166.pdf)). The interval width is itself an ambiguity signal. Computationally heavier (refit per test point) → post-makeathon only.

**What's practical for a 16-rule voting engine:**

| Step | Mechanism | Label budget | Where it fits |
|---|---|---|---|
| Measure first | Reliability diagram + ECE over (capped sum, correct?) pairs | any | Quick win (offline script) |
| Calibrate | Platt sigmoid on raw (uncapped) sum, per provider | ~50–200 | Day-13 T2 |
| Set semantics | Split conformal → "ambiguous set > 1 → escalate" | ~dozens–hundreds | Post-makeathon |
| Upgrade | Isotonic / Venn-Abers | >1000 / heavier compute | Post-makeathon, if ever |

**Determinism note (I-7):** all of these are FIT OFFLINE on logged data; runtime ships frozen constants `(a, b)` or a frozen threshold table in a versioned JSON. Same input → same output, always.

---

## 2. Learned rule weights — keep the rules, learn their votes

The cheapest "actual ML" that satisfies the no-fake rule: keep the 16 human-readable rules exactly as they are, and replace the hand-guessed confidence constants with weights learned from data. The rules stay the interpretable feature extractors; only the numbers change, with provenance.

**Logistic regression over rule firings (the primary recommendation).** Encode each region as a 16-dim binary vector `x_i = 1 if rule i fired` (optionally + 2–3 raw signals like `darknessL`, `areaFractionOfParent`). Train one-vs-rest logistic regression: per role, a weight per rule + bias. This is exactly "learned rule weights": the model's coefficient FOR rule `text-label` toward role `label-text` replaces the hand-guessed 0.95, and `firedRules` provenance survives untouched — you can still print "rule X contributed +w to role Y." In-browser/offline tooling exists in our stack's ecosystem: [mljs/logistic-regression](https://github.com/mljs/logistic-regression) (one-vs-all for >2 classes, [npm ml-logistic-regression](https://www.npmjs.com/package/ml-logistic-regression), 13.7 kB), same mljs family as the `ml-cart` decision tree doc 04 already vetted ([ml-cart docs](http://mljs.github.io/decision-tree-cart/)). A 16×9 weight matrix is small enough to fit with plain gradient descent in a node script and commit as JSON. Logistic outputs are also far closer to calibrated probabilities than additive sums, partially solving §1 for free.

**Snorkel / data programming (the strongest conceptual match).** Ratner et al., *Snorkel: Rapid Training Data Creation with Weak Supervision* (VLDB 2018): users write **labeling functions** — *"arbitrary heuristics, which can have unknown accuracies and correlations"* — and Snorkel *"denoises the outputs of labeling functions without access to ground truth"* by learning their accuracies from agreement/disagreement structure alone ([arXiv:1711.10160](https://arxiv.org/abs/1711.10160), [VLDB pdf](https://cs.brown.edu/people/sbach/files/ratner-vldb17.pdf), [ACM](https://dl.acm.org/doi/10.14778/3157794.3157797)). Our 16 rules ARE labeling functions in the Snorkel sense. Two borrowings: (a) if labels stay scarce, a Snorkel-style generative label model can estimate per-rule accuracy with NO ground truth — agreements/disagreements across the 197-shape catalog are enough; (b) Snorkel's framing legitimizes the whole architecture: heuristics-with-learned-weights is a published, production pattern, not a hack.

**Weighted Majority / Winnow (the online-update option).** Littlestone & Warmuth's Weighted Majority algorithm combines expert votes and multiplicatively downweights experts that err (β-decay per mistake); mistake bounds are logarithmic in expert count ([explainer with bounds](https://monishver11.github.io/blog/2025/WMA/)). Winnow (Littlestone 1988) is the attribute-efficient relative: mistake bound O(k log n) — robust to many irrelevant features ([Winnow overview](https://grokipedia.com/page/winnow_algorithm), [Kivinen & Warmuth, perceptron vs Winnow](https://www.semanticscholar.org/paper/The-perceptron-algorithm-vs.-Winnow:-linear-vs.-few-Kivinen-Warmuth/fc3ae3bfa9c55bb44ed84ee65a3fdca491f0ed59)). Fit for us: every manual override is exactly one "mistake event" — multiply down the weights of the rules that voted for the wrong role on that region. Trivial to implement, BUT continuous online mutation fights I-7 determinism and reproducibility of audit runs → adopt the **batched** form: accumulate overrides, apply the multiplicative update offline, commit a new versioned weight file (post-makeathon, P-5).

**RIPPER / rule induction (the new-rules option).** Cohen 1995, *Fast Effective Rule Induction*: sequential-covering rule learner producing human-readable rule sets, competitive with C4.5rules, near-linear scaling ([paper pdf](https://cse.usf.edu/~lohall/dm/Ripper.pdf), [Semantic Scholar](https://www.semanticscholar.org/paper/Fast-Effective-Rule-Induction-Cohen/6665e03447f989c9bdb3432d93e89b516b9d18a7)). This addresses a different gap than weighting: when the override store accumulates corrections that NO existing rule explains, rule induction over (signals → corrected role) can PROPOSE new candidate rules in the same human-readable form as the existing 16. This is the algorithmic engine behind doc 04 §6's "rule promotion log" — and the doc's discipline holds: surfaced as proposals, **never auto-promoted** (Sebs approves; provenance comment cites the override count).

**Combination math today (a principled micro-upgrade).** The additive-sum-then-cap can be replaced by **noisy-OR**: treat each rule as independent evidence and compute `P(role) = 1 − ∏(1 − c_i)` over the rules that fired for that role — the classic causal-independence combination from Bayesian networks (Kim & Pearl lineage; see [Exploiting Causal Independence in Bayesian Network Inference, arXiv:cs/9612101](https://arxiv.org/pdf/cs/9612101), [A Generalization of the Noisy-Or Model, UAI 1993](https://dl.acm.org/doi/abs/10.5555/2074473.2074499), [a worked applied example](https://pmc.ncbi.nlm.nih.gov/articles/PMC2656011/)). Properties we want: monotone in each vote, asymptotically approaches but never hard-caps at 1.0 (margins survive agreement), deterministic, four lines of code. It changes numeric outputs → ships only behind the §5 regression gate.

---

## 3. Provider-chain patterns — when to call the expensive provider

Our provider chain (`classify()` walks providers until one clears the threshold) is a **cascade** — a pattern with deep literature.

**Viola–Jones cascades (the canonical cheap-to-expensive design).** *Rapid Object Detection using a Boosted Cascade of Simple Features* (CVPR 2001): combine *"increasingly more complex classifiers in a 'cascade'"* so easy negatives are rejected early and expensive computation concentrates on hard candidates ([Semantic Scholar](https://www.semanticscholar.org/paper/Rapid-object-detection-using-a-boosted-cascade-of-Viola-Jones/dc6ea0e30e46163b706f2f8bdc9c67ca87f83d63), [Baeldung explainer](https://www.baeldung.com/cs/viola-jones-algorithm)). Transfer: the rule engine is our stage-1 — it should resolve the easy 90% (text, stripes, paper) in <1ms, and the design goal of later stages is to ONLY see the residue. Key Viola-Jones discipline we currently lack: each stage's pass/reject threshold is TUNED ON DATA for a target false-negative rate, not hand-set. Our 0.7 should be tuned the same way once §5's harness exists.

**FrugalGPT (LLM cascades in production form).** Chen, Zaharia & Zou: send the query to cheap models first; a learned **scoring function** decides whether to accept the answer or escalate; matches GPT-4 performance with *"up to 98% cost reduction"* ([arXiv:2305.05176](https://arxiv.org/abs/2305.05176)). The load-bearing idea for us is the **acceptance scorer**: "is this provider's answer good enough?" is itself a small learned judgment — which for us is exactly the calibrated confidence from §1. Follow-on work adds **early abstention** — letting the cascade say "no answer" instead of escalating when even the expensive model would likely fail ([Cost-Saving LLM Cascades with Early Abstention, arXiv:2502.09054](https://arxiv.org/html/2502.09054v1)) — which maps onto our conservative `paper` fallback: abstention IS our fallback, and it should be a measured decision, not a free one.

**RouteLLM (router as alternative to cascade).** Ho et al.: train a router on preference data to send each query to a strong or weak model BEFORE running either; >2× cost reduction without quality loss, and routers generalize to unseen model pairs ([arXiv:2406.18665](https://arxiv.org/abs/2406.18665), [OpenReview](https://openreview.net/forum?id=8sSqNntaMr)). Cascade-vs-router distinction for us: a cascade runs the cheap provider always (fine — ours costs <1ms); a router would predict upfront which regions need the expensive provider. With our cost profile, **cascade is correct**; the router idea only matters if a per-region LLM call ever becomes the bottleneck at ingest time.

**Mixture-of-experts gating (what NOT to build).** Jacobs et al. 1991 introduced gating networks that learn to weight expert sub-models per input ([Adaptive Mixtures of Local Experts, Neural Computation 3(1):79–87; overview](https://aman.ai/primers/ai/mixture-of-experts/)); Shazeer et al. 2017 scaled it with sparse top-k gating ([Outrageously Large Neural Networks](https://www.researchgate.net/publication/312619873_Outrageously_Large_Neural_Networks_The_Sparsely-Gated_Mixture-of-Experts_Layer), [HF MoE explainer](https://huggingface.co/blog/moe)). Verdict: MoE is the right shape when experts are co-trained and opaque. Our system wants the OPPOSITE — sequential, inspectable, each provider individually auditable. MoE gating would also skirt the "one engine, no per-feature brains" rule. Cite it to reject it.

**LLM-as-fallback-provider, concretely.** Doc 04's verdict stands and the cascade literature reinforces it: the LLM provider is a **build/ingest-time pre-pass, cached by `svgHash` into a JSON sidecar, never a render-time call** (I-10 forbids network at render). The improvements this research adds to that plan: (a) the escalation trigger should be *calibrated* confidence (§1) or conformal-set-size > 1, not the raw 0.7; (b) the LLM's own output gets a HIGHER acceptance bar (doc 07 said 0.9) and lands in the same decision log so its accuracy is measured like any provider; (c) per FrugalGPT, cache hit-rate makes amortized cost ≈ 0 — `svgHash` already exists as the cache key.

**Recommended chain (target state):**

```
override store (absolute)
  → rule engine (calibrated; resolves ~easy 90%)
  → [Day-13+] learned-weights provider (LR over rule firings; same <1ms)
  → [post] cached-LLM ingest pre-pass (only regions still ambiguous; cached by svgHash)
  → conservative fallback = paper (measured abstention)
```

One engine, one chain — providers are stages of it, not parallel brains.

---

## 4. Active learning from overrides — every correction is a label

**The framing.** The override store is a **correction stream**: each entry is a (signals, wrong-prediction, right-label) triple authored by the ground-truth oracle himself. Active learning is the literature on spending that oracle's time where it buys the most.

**Uncertainty sampling.** Settles' *Active Learning Literature Survey* (2009) is the canonical reference ([pdf](https://burrsettles.com/pub/settles.activelearning.pdf)): query the instances the model is least sure about. Three standard flavors — **least confidence** (lowest top-score), **margin** (smallest gap between top-2 scores), **entropy** over the score distribution; for binary cases they coincide, for multiclass margin and entropy generalize better (survey §3.1; modern summary in [Lil'Log: Active Learning](https://lilianweng.github.io/posts/2022-02-20-active-learning/)). Fit to our engine is direct and cheap: the per-role score table already exists inside `ruleEngineProvider.classify` — we just never persist `margin = best − secondBest`. A ranked "most ambiguous regions" list IS uncertainty sampling, no model changes needed.

**Calibration before uncertainty (ordering note).** Uncertainty sampling quality depends on the scores meaning something; recent work explicitly couples the two ([Calibrated Uncertainty Sampling for Active Learning, arXiv:2510.03162](https://arxiv.org/html/2510.03162v1)). With our capped sums, least-confidence is distorted at the 1.0 ceiling — **margin on raw (uncapped) sums is the robust choice today**, least-confidence becomes trustworthy after §1's Platt fit.

**Human-in-the-loop design.** Amershi, Cakmak, Knox & Kulesza, *Power to the People: The Role of Humans in Interactive Machine Learning* (AI Magazine 2014): interactive ML couples system and user tightly; systems that let end-users *"train, adjust, and correct"* models outperform ones that treat the human as a rating API; and the interface for giving corrections is as load-bearing as the algorithm ([AAAI](https://ojs.aaai.org/aimagazine/index.php/aimagazine/article/view/2513), [Microsoft Research](https://www.microsoft.com/en-us/research/publication/power-to-the-people-the-role-of-humans-in-interactive-machine-learning/)). Transfer: the right-click → "Tag as ___" flow (doc 04 §7) plus an **ambiguity queue** ("here are the 20 regions I'm least sure about across the catalog") converts Sebs's eyeball time from random patching into prioritized labeling. This also matches how he already works — the audit catalog process IS labeling (`project_smart_layer_foundation_via_audit`).

**What the correction stream feeds (the loop):**

1. Override lands → region instantly fixed (existing behavior, untouched).
2. Override is APPENDED to the decision log as a labeled example (new).
3. Labels accumulate → §1 calibration refits + §2 weight refits (offline, versioned).
4. Repeated similar corrections → §2 RIPPER-style rule proposals (doc 04 §6 promotion log; never auto-promote).
5. §5 harness re-runs → measured improvement (or regression) per refit.

**Few-shot bank for the future LLM provider.** Doc 04 already locked the pattern (≤8 most-similar corrections per prompt, cosine similarity on signal vectors, per [arXiv:2305.14264](https://arxiv.org/pdf/2305.14264)); the decision-log schema below is deliberately a superset of what that needs, so no second store is required later.

---

## 5. Evaluation harness — measuring a perceptual classifier

**Ground truth definition.** Agreement with Sebs's eyeball IS the ground truth — there is no external oracle. Operationally: golden labels = override-store entries + explicitly "blessed" classifier outputs on the 197-shape audit catalog. A blessed label and a correction carry equal weight; both are his judgment.

**The golden set.** The audit catalog (197 shapes in `PegToolShape.tsx`, runs in `audit-runs/`) is the natural golden set — same role the literature assigns curated regression suites. Procedure: run the classifier over all 197 → snapshot `(svgHash, regionPath) → (role, confidence, firedRules)` → Sebs corrects what's wrong (via overrides) and blesses the rest → commit `golden-labels.v1.json`. From then on, classifier quality is computable offline at any commit.

**Metrics that matter for this system:**

- **Per-role precision / recall / F1 + confusion matrix.** Role frequencies are heavily imbalanced (paper + line-decoration dominate; solid-content is rare), so aggregate accuracy is misleading; macro-averaged F1 weights each role equally and the confusion matrix localizes systematic confusions (the expected hot pair: `sparse-tonal` ↔ `paper`, i.e., the recall hole from §0 weakness #1). Reference for the multiclass-metric tradeoffs: [Metrics for Multi-Class Classification: an Overview, arXiv:2008.05756](https://arxiv.org/pdf/2008.05756).
- **Cohen's kappa** — chance-corrected agreement between classifier and Sebs-as-rater: κ = (p₀ − pₑ)/(1 − pₑ); designed for inter-rater agreement, standard when one "rater" is a model and the other is human ground truth; robust where imbalanced classes inflate raw accuracy ([Galileo: Cohen's Kappa metric](https://galileo.ai/blog/cohens-kappa-metric)). One number to track release-over-release.
- **Calibration metrics** — reliability diagram + ECE (§1, [Guo et al.](https://arxiv.org/abs/1706.04599)); Brier score with sklearn's caveat that it mixes calibration and discrimination, so a lower Brier alone doesn't prove better calibration ([sklearn calibration guide](https://scikit-learn.org/stable/modules/calibration.html)).
- **Escalation/abstention rates** — % of regions falling through to `paper` fallback, and (later) conformal-set sizes. These are the provider-chain health numbers (§3).

**Regression gates (process).** Two verified frameworks transfer:

- **The ML Test Score** (Breck, Cai, Nielsen, Salib, Sculley — Google, 2017): 28 concrete tests/monitoring needs for production ML; the themes that map to us: golden-set tests run on every change, monitored prediction-distribution drift, and reproducibility of training ([research.google](https://research.google/pubs/the-ml-test-score-a-rubric-for-ml-production-readiness-and-technical-debt-reduction/), [rubric pdf](https://research.google.com/pubs/archive/45742.pdf)). Our minimal slice: (gate 1) **no unblessed role flips** on the golden set per classifier change; (gate 2) per-rule firing-rate table diffed per change (a rule that suddenly fires 3× more is drift even if labels don't flip); (gate 3) weight/calibration refits are versioned files with the fit script committed (reproducibility).
- **CheckList** (Ribeiro, Wu, Guestrin, Singh — ACL 2020 best paper): behavioral testing beyond held-out accuracy via **MFT** (minimum functionality), **INV** (invariance: label-preserving perturbation must not change prediction), **DIR** (directional: a known perturbation must move the prediction a known way) ([ACL Anthology](https://aclanthology.org/2020.acl-main.442/), [arXiv:2005.04118](https://arxiv.org/abs/2005.04118)). This maps onto our system almost 1:1:
  - **MFT:** `<text>` → `label-text`, always. Dasharray → `decorative-accent`. Stripe-cluster member → `line-decoration`.
  - **INV:** translate the whole SVG; reorder z-irrelevant siblings; rename ids; palette-swap within the same darkness band → role must not change. (Also doubles as a determinism test, I-7.)
  - **DIR:** darken a region's fill across band boundaries → classification must move monotonically darker (sparse → mid → dense → solid) and never backwards. This is **I-2's identity-band monotonicity expressed as an executable test** — the single most valuable test family for this system.
- Both gates plug into the existing discipline: `feedback_never_declare_fixed_without_regression_check` already mandates baseline → change → diff; this harness gives that memory a classifier-level instrument instead of only screenshots.

**Perceptual boundary, stated.** Classifier metrics are the UPSTREAM gate; the final arbiter remains the render. A correct role with bad density math still fails Sebs's eyeball, and a "wrong" role can render acceptably. The screenshot-diff sweep harness stays the perceptual gate; this harness catches decision-layer regressions before they reach pixels.

---

## 6. Kill-list compliance — every recommendation against the contract

| Recommendation | I-1 (fillStyle/Style sacred) | No 9-role fillStyle-switching rebuild | I-7 (determinism) | One engine / no per-feature brains | I-10 (perf, no render-time network) |
|---|---|---|---|---|---|
| §1 Calibration (Platt/ECE/conformal) | Touches confidence numbers only; never selects grammar | Taxonomy-agnostic: maps score→probability for ANY label space | Fit offline; frozen constants in versioned JSON | Lives inside the one chain | Sigmoid eval ≈ ns |
| §2 LR over rule firings | Weights vote toward mark-decision/role; grammar stays user's | Weights transfer to any label space; schema P-8 makes data portable | Frozen weight matrix, versioned; no runtime fitting | Replaces constants INSIDE the rule engine, not beside it | 16×9 dot product <1ms |
| §2 Noisy-OR combination | Same | Same | Pure function | Same | 4 lines |
| §2 RIPPER rule proposals | Proposed rules are role rules, never grammar swaps | Proposals reviewed by Sebs; never auto-promoted (doc 04 §6) | Induction offline; live rules are static code | New rules join ALL_RULES | n/a (offline) |
| §3 Cascade/escalation | Providers output classification, never grammar | Chain semantics independent of taxonomy | Chain order static; thresholds frozen constants | The chain IS the one engine; MoE explicitly rejected | LLM = ingest-time cached only |
| §4 Ambiguity queue / correction loop | Surfaces regions; Sebs tags roles | Labels stored role-agnostic (P-8) | Read-only over logs | Feeds the one engine's data | Offline scripts |
| §5 Golden set + gates | Tests classification, not user dropdowns | DIR tests target I-2 bands — already the post-teardown vocabulary | INV suite doubles as determinism test | Single harness for the single engine | CI/offline |

**Explicit non-rebuilds:** nothing here adds fillStyle-switching by role (the §7 kill-list's named corpse — `feedback_smart_hachure_drift_pattern`); nothing collapses the user's dropdowns; nothing introduces a second decision engine; nothing defers contract scope ("v1 stub" framing not used — every roadmap item below is a complete, shippable unit at its tier).

**The §7 teardown hedge (load-bearing).** When the locked-model teardown replaces roles with (mark-decision × identity-band × 6-axis tuple), everything in this doc survives IF labels are stored role-agnostically. Hence P-8: the decision log stores `signalsSnapshot + the human's preferred OUTCOME` (marks yes/no + band + any grammar-agnostic intent), with the current role kept as a derived annotation, not the primary key.

---

## 7. Staged roadmap

### 7.1 Quick wins — makeathon-safe, small, low-risk, feasible THIS WEEK

| # | What | Size | Risk | Notes |
|---|---|---|---|---|
| QW-1 | **Decision-log collector.** During /audit runs, persist per region: `svgHash, regionPath, signalsSnapshot, firedRules, per-role raw sums, winner, rawScore, cappedConfidence, classifiedBy`. Append-only JSON in `audit-runs/`. | ~1–2h | None (write-only side channel; zero render-path change) | This file IS the calibration + training dataset. Everything else feeds on it. |
| QW-2 | **Margin in the trace.** Add `rawScore` (uncapped) + `margin` (best − second-best) fields to `Classification`. Additive fields; no behavior change. | ~30min | None | Unlocks §4 uncertainty sampling + exposes 1.0-cap ties. |
| QW-3 | **Golden-set baseline.** Snapshot classifier output over all 197 audit shapes → `golden-labels.v1.json` (blessed-pending). Diff script: re-run + report role flips. | ~2h | None (offline) | Per `feedback_no_sampled_verification_claims`: ALL 197, per-item table. Gate exists even before Sebs blesses labels — unblessed flips still demand explanation. |
| QW-4 | **Ambiguity queue.** Offline script ranking regions by margin (asc) → top-20 list for Sebs to override-tag in the /audit UI. | ~1h | None | Settles margin sampling, zero model changes. Highest label-value per minute of Sebs's time. |
| QW-5 | **Reliability script.** Once ≥~50 labels exist (overrides + blessed golden labels): bin confidence vs accuracy, print reliability table + ECE. | ~1h | None | Answers "does 0.7 mean anything?" — the prerequisite for touching the threshold. |
| QW-6 | *(optional, gated)* **Noisy-OR combination** replacing `min(1, sum)`. | ~30min + regression run | Low but REAL (numeric outputs change) | Ships ONLY behind QW-3's diff + sweep harness, per `feedback_never_declare_fixed_without_regression_check`. If Day-10/11 scope is tight, skip — QW-1..5 don't depend on it. |

Order: QW-1 → QW-2 → QW-3 → QW-4 (Sebs tags during normal audit time) → QW-5. Total new runtime code in the render path: two logged fields.

### 7.2 Day-13 T2 — the ML ladder slot (per makeathon-plan)

- **T2-a · Platt-scale the rule engine.** Fit `(a, b)` on the decision log's labeled rows (node script); ship as `calibration.v1.json`; `confidence = sigmoid(a·rawScore + b)`. Threshold re-tuned on the reliability table instead of hand-set 0.7. *(Demo line: "confidences are measured, not guessed.")*
- **T2-b · Logistic regression over rule firings.** 16-dim binary vector (+ `darknessL`, `areaFractionOfParent`), one-vs-rest, trained offline ([ml-logistic-regression](https://github.com/mljs/logistic-regression) or ~80 lines of plain GD); ship `ruleWeights.v1.json`; runtime = dot product + softmax. `firedRules` provenance unchanged; per-rule learned weights printable next to the old hand constants. *(This is the headline "actual ML, interpretable, trained on MY corrections" artifact — Snorkel-pattern citation ready for the writeup.)*
- **T2-c · Margin-based escalation.** Provider chain escalates on `margin < τ` (τ from the reliability table) rather than `cappedSum < 0.7`.
- **Gate for all three:** golden-set diff (QW-3) + 6-class screenshot baseline + sweep harness. If label count is <~50 by Day 13, ship T2-a only (2 parameters stay sane on tiny data; 16×9 LR does not) and demo the harness + queue instead — honest scope per the no-fake rule.

### 7.3 Post-makeathon

- **P-1 · Snorkel-style label model** — learn per-rule accuracies from agreement structure with no ground truth, if labels stay scarce ([arXiv:1711.10160](https://arxiv.org/abs/1711.10160)).
- **P-2 · Conformal layer** — split conformal sets for escalate/abstain with coverage guarantees; Mondrian per-role when counts allow ([arXiv:2107.07511](https://arxiv.org/abs/2107.07511)); Venn-Abers upper/lower probabilities as the heavier alternative ([arXiv:1211.0025](https://arxiv.org/pdf/1211.0025)).
- **P-3 · Decision-tree provider** — doc-04 v3 (`ml-cart`) trained on the decision log, inserted between rules and LLM in the chain; depth-capped per doc-04's overfit warning.
- **P-4 · Cached LLM ingest provider** — FrugalGPT-style acceptance scoring, `svgHash`-keyed sidecar, few-shot bank from the decision log (≤8 examples), higher acceptance bar; never render-time ([arXiv:2305.05176](https://arxiv.org/abs/2305.05176), doc 04 §4–5).
- **P-5 · Batched Weighted-Majority updates** — multiplicative downweighting of rules that voted wrong, applied offline per override batch, versioned snapshots (determinism preserved) ([WMA explainer](https://monishver11.github.io/blog/2025/WMA/)).
- **P-6 · RIPPER-style rule proposal engine** behind doc-04 §6's promotion log; Sebs-approved only ([Cohen 1995](https://cse.usf.edu/~lohall/dm/Ripper.pdf)).
- **P-7 · CheckList suite** — MFT/INV/DIR generator over the audit catalog; DIR = I-2 band monotonicity as executable tests ([ACL 2020](https://aclanthology.org/2020.acl-main.442/)).
- **P-8 · Role-agnostic label schema migration** — primary label = (marks yes/no × identity band), role kept as derived annotation → the dataset survives the §7 teardown intact.

### 7.4 What this roadmap deliberately does NOT contain

No neural nets (doc-04 verdict stands: hostile to inspectability/reversibility for this scale). No runtime LLM. No MoE gating. No second engine. No auto-promotion of anything. No fillStyle-switching, ever.

---

## 8. Interconnection edges added (doc-19 graph spirit)

Doc 19 maps how toggle clusters drive each other; this work adds **data/process edges** to the same graph:

| Edge | From → To | Meaning |
|---|---|---|
| E-1 | overrideStore → decision log | every manual tag doubles as a labeled training/calibration example (was: dead-end patch) |
| E-2 | /audit catalog → golden set → regression gate | the 197 shapes become an executable contract; every classifier change runs through them (`project_smart_layer_foundation_via_audit` made operational) |
| E-3 | calibrated confidence → provider-chain escalation | the 0.7 constant becomes a measured, tunable quantity; future providers key off it |
| E-4 | margin → ambiguity queue → override UI → E-1 | the human-in-the-loop cycle closes; Sebs's tagging time is spent by uncertainty ranking |
| E-5 | rule registry ↔ learned-weights JSON | each weight names its rule; provenance is bidirectional (weight explains rule's trust; rule explains weight's meaning) |
| E-6 | eval harness ↔ `feedback_never_declare_fixed_without_regression_check` | the memory's screenshot discipline gains a classifier-level instrument (role-flip diff) upstream of pixels |
| E-7 | decision-log schema ↔ 09 §7 teardown | role-agnostic labels (P-8) keep the dataset valid across the taxonomy change — the bridge between today's engine and the locked 6-axis model |
| E-8 | I-13 cluster-level signals ↔ feature vector | future signal additions enter classifier, calibration, AND eval through one schema, keeping one engine |

---

## Sources

**Confidence calibration**
- [scikit-learn User Guide: Probability calibration](https://scikit-learn.org/stable/modules/calibration.html) — sigmoid-vs-isotonic small-data guidance (">~1000 samples" threshold), Brier caveat, multiclass OvR
- [scikit-learn: CalibratedClassifierCV](https://scikit-learn.org/stable/modules/generated/sklearn.calibration.CalibratedClassifierCV.html)
- [FastML: Classifier calibration with Platt's scaling and isotonic regression](https://fastml.com/classifier-calibration-with-platts-scaling-and-isotonic-regression/)
- [Better Classifier Calibration for Small Data Sets — arXiv:2002.10199](https://arxiv.org/pdf/2002.10199)
- [Guo, Pleiss, Sun, Weinberger — On Calibration of Modern Neural Networks (ICML 2017) — arXiv:1706.04599](https://arxiv.org/abs/1706.04599) · [PMLR pdf](https://proceedings.mlr.press/v70/guo17a/guo17a.pdf)
- [Angelopoulos & Bates — A Gentle Introduction to Conformal Prediction — arXiv:2107.07511](https://arxiv.org/abs/2107.07511) · [reference implementation](https://github.com/aangelopoulos/conformal-prediction)
- [Vovk & Petej — Venn–Abers Predictors (UAI 2014) — arXiv:1211.0025](https://arxiv.org/pdf/1211.0025) · [UAI pdf](https://www.auai.org/uai2014/proceedings/individuals/166.pdf)

**Learned rule weights**
- [Ratner et al. — Snorkel: Rapid Training Data Creation with Weak Supervision — arXiv:1711.10160](https://arxiv.org/abs/1711.10160) · [VLDB pdf](https://cs.brown.edu/people/sbach/files/ratner-vldb17.pdf) · [ACM DL](https://dl.acm.org/doi/10.14778/3157794.3157797)
- [Weighted Majority Algorithm explainer (Littlestone & Warmuth lineage, mistake bounds)](https://monishver11.github.io/blog/2025/WMA/) · [Winnow algorithm overview](https://grokipedia.com/page/winnow_algorithm) · [Kivinen & Warmuth — Perceptron vs Winnow](https://www.semanticscholar.org/paper/The-perceptron-algorithm-vs.-Winnow:-linear-vs.-few-Kivinen-Warmuth/fc3ae3bfa9c55bb44ed84ee65a3fdca491f0ed59)
- [Cohen 1995 — Fast Effective Rule Induction (RIPPER) — pdf](https://cse.usf.edu/~lohall/dm/Ripper.pdf) · [Semantic Scholar](https://www.semanticscholar.org/paper/Fast-Effective-Rule-Induction-Cohen/6665e03447f989c9bdb3432d93e89b516b9d18a7)
- [mljs/logistic-regression (GitHub)](https://github.com/mljs/logistic-regression) · [npm: ml-logistic-regression](https://www.npmjs.com/package/ml-logistic-regression) · [ml-cart docs (doc-04 vetted)](http://mljs.github.io/decision-tree-cart/)
- Noisy-OR: [Zhang & Poole — Exploiting Causal Independence in Bayesian Network Inference — arXiv:cs/9612101](https://arxiv.org/pdf/cs/9612101) · [Srinivas — A Generalization of the Noisy-Or Model (UAI 1993)](https://dl.acm.org/doi/abs/10.5555/2074473.2074499) · [applied noisy-OR example (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC2656011/)

**Provider chains / cascades**
- [Viola & Jones — Rapid Object Detection using a Boosted Cascade of Simple Features (CVPR 2001) — Semantic Scholar](https://www.semanticscholar.org/paper/Rapid-object-detection-using-a-boosted-cascade-of-Viola-Jones/dc6ea0e30e46163b706f2f8bdc9c67ca87f83d63) · [Baeldung explainer](https://www.baeldung.com/cs/viola-jones-algorithm)
- [Chen, Zaharia, Zou — FrugalGPT — arXiv:2305.05176](https://arxiv.org/abs/2305.05176)
- [Cost-Saving LLM Cascades with Early Abstention — arXiv:2502.09054](https://arxiv.org/html/2502.09054v1)
- [Ong et al. — RouteLLM: Learning to Route LLMs with Preference Data — arXiv:2406.18665](https://arxiv.org/abs/2406.18665) · [OpenReview](https://openreview.net/forum?id=8sSqNntaMr)
- [Mixture-of-Experts primers: aman.ai](https://aman.ai/primers/ai/mixture-of-experts/) · [HuggingFace MoE Explained](https://huggingface.co/blog/moe) · [Shazeer et al. 2017 — Outrageously Large Neural Networks (ResearchGate)](https://www.researchgate.net/publication/312619873_Outrageously_Large_Neural_Networks_The_Sparsely-Gated_Mixture-of-Experts_Layer)

**Active learning / human-in-the-loop**
- [Settles — Active Learning Literature Survey (2009) — pdf](https://burrsettles.com/pub/settles.activelearning.pdf)
- [Lilian Weng — Learning with not Enough Data Part 2: Active Learning](https://lilianweng.github.io/posts/2022-02-20-active-learning/)
- [Calibrated Uncertainty Sampling for Active Learning — arXiv:2510.03162](https://arxiv.org/html/2510.03162v1)
- [Amershi, Cakmak, Knox, Kulesza — Power to the People (AI Magazine 2014)](https://ojs.aaai.org/aimagazine/index.php/aimagazine/article/view/2513) · [Microsoft Research page](https://www.microsoft.com/en-us/research/publication/power-to-the-people-the-role-of-humans-in-interactive-machine-learning/)
- [Margatina et al. — Active Learning Principles for In-Context Learning — arXiv:2305.14264 (via doc 04)](https://arxiv.org/pdf/2305.14264)

**Evaluation harness**
- [Breck, Cai, Nielsen, Salib, Sculley — The ML Test Score (Google, 2017)](https://research.google/pubs/the-ml-test-score-a-rubric-for-ml-production-readiness-and-technical-debt-reduction/) · [rubric pdf](https://research.google.com/pubs/archive/45742.pdf)
- [Ribeiro, Wu, Guestrin, Singh — Beyond Accuracy: Behavioral Testing of NLP Models with CheckList (ACL 2020)](https://aclanthology.org/2020.acl-main.442/) · [arXiv:2005.04118](https://arxiv.org/abs/2005.04118)
- [Grandini, Bagli, Visani — Metrics for Multi-Class Classification: an Overview — arXiv:2008.05756](https://arxiv.org/pdf/2008.05756)
- [Galileo — Enhancing AI Evaluation with Cohen's Kappa Metric](https://galileo.ai/blog/cohens-kappa-metric)

**In-repo (read for this doc)**
- `src/app/lib/smartHachure/classifier.ts` · `signals.ts` · `techniqueMap.ts` · `overrideStore.ts`
- `docs/locked-refs/F3-smart-hachure-system/09-LOCKED-MODEL.md` (§2 invariants, §7 kill-list)
- `docs/locked-refs/F3-smart-hachure-system/04-agent-research-classifier-architectures.md`
- `docs/locked-refs/F3-smart-hachure-system/07-architecture-ml-pipeline.md` (superseded; audit-as-dataset section live)
- `docs/locked-refs/F3-smart-hachure-system/19-research-cross-axis-interconnection.md`
