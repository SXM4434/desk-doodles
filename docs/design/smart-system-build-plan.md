# Smart System — Architecture + Build Plan (Rock H)

**Date:** 2026-06-11 (Day 10, deadline 06-18 11:59 PM PDT) · **Status:** PLAN ONLY — no code in this pass; `src/app/lib/smartHachure/**` + `SvgStyleTransform.tsx` are file-locked to a concurrent fleet right now.
**Governing refs:** `makeathon-plan.md` §8.6 + RE-BASELINE/D′ · `09-LOCKED-MODEL.md` (I-1..I-14 sacred) · `docs/research/24-research-classifier-improvements.md` (the research this plan executes) · `21-research-3d-pipeline-and-style-translation.md` §4 (coverageToParams math) · `07-architecture-ml-pipeline.md` (superseded except audit-as-dataset) · memories `project_smart_layer_foundation_via_audit`, `project_generalizable_rendering_decision_pattern`.
**Constraints honored throughout:** Make-importable (no new npm deps, no WASM, relative imports only) · determinism (all fitting OFFLINE; runtime ships frozen versioned JSON; no unseeded randomness, no wall-clock in render paths) · one engine, no second brain · user's Style/fillStyle dropdowns stay sacred (I-1).

---

## 1. What ALREADY RUNS (as-built, from source — this is further along than the chat history suggests)

| Piece | Where | Verified state |
|---|---|---|
| **Signals** | `src/app/lib/smartHachure/signals.ts` | Per-region feature vector: geometry (bbox/area/aspect/perimeter), topology (zIndex, areaFractionOfParent, enclosesSiblingCount, stripe-cluster), style (fill/stroke/strokeWidthBin/dasharray/opacity), perceptual `darknessL` (1−OKLab L, with W1-token + color-mix + gradient resolution). |
| **Rule-engine classifier + provider chain** | `classifier.ts` | 16 independent rules vote; per-role additive sum; winner = best role, `confidence = min(1, sum)` (`classifier.ts:362`). Chain: override store wins at 1.0 → providers in order, first ≥ threshold (0.7) wins → conservative `paper` fallback. v1 = one provider (`ruleEngineProvider`); the chain interface for future providers already exists. Recall-hole fix landed 06-11 (root-tonal 0.55→0.70, 140 flips, Sebs-blessed). |
| **Decision log (QW-1/QW-2)** | `index.ts:26-77`, `classifier.ts:343-368` | Every region's decision is traced: `svgHash, regionPath, role, confidence, rawScore` (UNCAPPED sum), `margin` (best − second-best), `firedRules`, `classifiedBy, darknessL, area, fillStyle`. In-memory FIFO (cap 5000), exposed at `window.__dd_decisionLog` for playwright/DevTools. Write-only side channel — zero render-path behavior change. |
| **Golden regression baseline** | `tools/classifier/` + `audit-runs/golden-labels.v2.json` | **v2 BLESSED**: 197 shapes → 1,394 region entries with role + confidence + margin + firedRules. `golden-snapshot.js` (drives /audit headless) · `golden-diff.js` (EVERY entry, exits 1 on any flip — THE gate for classifier changes) · `ambiguity-queue.js` (margin-ascending top-20 = Settles uncertainty sampling). |
| **Treatment + render** | `techniqueMap.ts`, `renderRegion.ts` | Role → 5-axis treatment, style/slider modulation, Agent-5 clamps (weight ≤ 0.7×gap, gap ∈ [1.5,12]px, <40px² → solid). Density math is scaffolded but NOT yet calibrated to the 8-band L* table (21-research §4). |
| **Override store** | `overrideStore.ts` | Manual labels keyed (svgHash, regionPath), localStorage, JSON export/import — corrections always win. |
| **Audit breakage catalog** | `/audit` route + `audit-runs/` + `audit-archive/` (84MB mosaics rescued) | Per-shape × per-modifier × per-value sweep reports. Each "X breaks at value Y on shape Z" = one labeled example for per-element scaling curves (`project_smart_layer_foundation_via_audit`). |
| **Phase-D seed** | `lib/geometry3d/strokeTo3d.ts:140` | Engine-routing auto-pick already exists in miniature: closed stroke → Extrude, open → Rod. |

**24-research §7.1 scoreboard:** QW-1 ✅ QW-2 ✅ QW-3 ✅ (v2 blessed) QW-4 ✅ · QW-5 (reliability/ECE script) NOT built · QW-6 (noisy-OR) NOT shipped — `min(1,sum)` still live.

So: the smart system is not "starting" — the engine, the receipts, and the dataset collectors are running. What remains in-makeathon is the FULL recommendation surface: calibration math (A), a smart pick for EVERY conversion picker (C, all of them — not a two-dropdown sampler), all shading-capable styles (B), engine routing (D), physics preset suggestion (E, when physics lands), and the cross-axis cascade (F). Per Sebs 2026-06-11 ("I don't want cut stuff — the smart system gives a recommendation for each thing") + `feedback_build_full_dont_self_stop_at_mvp`: phases are SEQUENCED, never pre-cut; Sebs calls time. Only the *training method* upgrades (T2-b learned weights, QW-6) default post-makeathon — they change numeric behavior near submission, which is a safety argument, not scope trimming.

---

## 2. The LADDER (dated against D′ — social slice → commit gate → 3D wiring → M7/M8 → hard path → M11 → video)

### Inside the makeathon (the recommended cut)

| Date | Slice | What ships | Gate |
|---|---|---|---|
| **06-12** | **QW-5 reliability script** (~1h, offline) | `tools/classifier/reliability.js`: bin confidence vs correctness against golden v2, print reliability table + ECE. Answers "does 0.7 mean anything?" — prerequisite for touching the threshold. Zero locked-file contact; can run while the fleet owns smartHachure. | none (read-only) |
| **06-13** | **Phase C — SMART PICK on input** (the demo-visible smart moment) | NEW `src/app/lib/smart/smartPick.ts`: on upload/draw Done, run `extractAllSignals` on the input → rule table → auto-pick a recommendation for EVERY conversion picker in the §8.6 table: `svgStyle` · `fillStyle` · `texture` · `penTip` · `multiStroke` · `sketchingStyle` (Sebs 2026-06-11: a recommendation for each thing, no sampler cut). Wired in `DrawPanel.tsx` (NOT locked) as the *initial* dropdown values; decision-log entries (`surface:'input-pick'`) are the receipts. Pick-once-at-ingest; dropdowns stay sacred after (I-1). | tsc + manual A/B on 6 inputs |
| **06-14** | **Phase A — coverageToParams calibration** (paired with M8 SVG-style→3D port) | NEW pure module `src/app/lib/smart/coverage.ts`: Murray-Davies inverse `coverage = (R_paper−R_target)/(R_paper−R_ink)` → 8-band L* table → per-fillStyle inverses (hachure `a≈w/g` · cross-hatch `a≈1−(1−w/g)²` · dots `a=Nπr²/Area` · zigzag path-length-per-area) per 21-research §4. `renderRegion.ts` swaps its density math to call it — **needs smartHachure lock-lift + commit gate first**. Same 8-band table feeds the M8 screen-space hatch shader uniforms: ONE math, TWO renderers (the round-trip coherence receipt). Phase B (apply across ALL 8 shading-capable styles — full scope, not rough-family-only) rides on this — per-style modulation already lives in `techniqueMap.ts`. | `golden-diff` (zero unblessed flips) + sweep harness + 6-class screenshot baseline per `feedback_never_declare_fixed_without_regression_check` |
| **06-14/15** | **Phase D — engine routing** (inside 3D round-trip work) | Extend the `strokeTo3d` auto-pick into the documented router: signals (closed/open, stroke count, complexity) → Rod / Extrude / "needs Tripo" recommendation. Already half-built; this is wiring + receipts, not new ML. | 15/15 geometry3d smoke + visual |
| **06-15** | **T2-a — Platt calibration** (offline fit, frozen constants) | `tools/classifier/fit-platt.js` fits `(a,b)` on (rawScore, correct?) pairs derived from golden v2 + the v1→v2 flip set → ships `calibration.v1.json`; classifier reads `confidence = sigmoid(a·rawScore+b)`; threshold re-tuned from the reliability table instead of hand-set 0.7. Sklearn guidance: sigmoid IS the small-sample method; isotonic needs >~1000 *labels-with-errors*, park it. Demo line: **"confidences are measured, not guessed."** | golden-diff + reliability before/after table |
| **06-17** | **Data-story segment in the demo video** | Export decision log + golden receipts + ambiguity queue as the "this is a real learning system" beat (§4 below). | n/a |

**NOTHING IS PRE-CUT (Sebs 2026-06-11 directive + `feedback_build_full_dont_self_stop_at_mvp` — phases are sequenced, Sebs calls time):**
- **Phase E** (physics preset suggestion) — IN SCOPE, sequenced behind physics actually landing on the desk (it recommends presets for a system that must exist first). The moment objects get physics, E's rule table ships with it.
- **Phase F** (cross-axis cascade, I-13 + doc-19 matrix) — IN SCOPE, target 06-16: when a smart pick or user change moves one cluster, the dependent clusters get their interlinked recommendations per the doc-19 matrix. Largest wiring surface, so it's last in line — but it's on the board, not cut.
- **T2-b learned rule weights** + **QW-6 noisy-OR** — sequenced LAST and flagged for Sebs: both change numeric classifier behavior days before submission (regression risk, not scope). Default post-makeathon UNLESS Sebs calls them in on a clean 06-16; the 1,394 blessed labels make T2-b feasible today.

### Post-makeathon (the learned-classifier ladder, from 24-research §7.3)

1. **T2-b LR weights** (`ruleWeights.v1.json`, 16×9 matrix, mljs-pattern or ~80 lines plain GD — fitted offline, frozen) — the first *trained* artifact; provenance per rule preserved.
2. **P-3 decision-tree provider** trained on decision log + golden labels + breakage catalog, inserted rules→tree in the chain (doc-07 v3, depth-capped).
3. **P-4 cached-LLM ingest provider** — build-time only, svgHash-keyed sidecar, FrugalGPT-style acceptance bar; never render-time (I-10).
4. **P-1 Snorkel-style label model** (per-rule accuracies from agreement structure) · **P-2 conformal sets** for escalate/abstain · **P-5 batched weighted-majority updates** · **P-6 RIPPER rule proposals** (Sebs-approved only) · **P-7 CheckList MFT/INV/DIR suite** (DIR = I-2 band monotonicity as executable tests).
5. **P-8 role-agnostic label schema** — primary label = (marks yes/no × identity band), role demoted to annotation, so the dataset survives the §7 taxonomy teardown.
6. **Manual-toggle smart layer** (per-element scaling of wobble/bowing/strokeWidth trained on the breakage catalog) — the second decision surface on the same engine.
7. **Meta-engine extraction:** per `project_generalizable_rendering_decision_pattern`, do NOT pre-build. The manual-toggle layer is the second concrete instance — extraction is justified only when it actually lands, not before.

---

## 3. Architecture — where each phase plugs into the existing pipeline

```
                     TODAY (live)                                  ADDED (phase)
input SVG ──► extractAllSignals (signals.ts) ──► classify (classifier.ts chain)
                      │                                │  calibration.v1.json (T2-a, frozen)
                      │                                │  [post] ruleWeights.v1.json · tree · cached-LLM
                      ▼                                ▼
              smartPick.ts (C, NEW) ──► DrawPanel    selectTreatment (techniqueMap.ts)
              initial svgStyle/fillStyle                       │
              + 'input-pick' log entries                       ▼
                                                     renderRegion.ts ──► coverage.ts (A, NEW, pure)
                                                               │          8-band L* + per-fillStyle inverses
                                                               │          └──► M8 hatch shader uniforms (3D)
                                                               ▼
                                              decision log (window.__dd_decisionLog)
                                                               │
                              tools/classifier/: golden-snapshot → golden-diff (GATE)
                                                 ambiguity-queue · reliability.js (NEW) · fit-platt.js (NEW)
```

**New modules (all NEW files — nothing locked gets touched until lock-lift):**
`src/app/lib/smart/coverage.ts` (pure math, no DOM) · `src/app/lib/smart/smartPick.ts` (reads smartHachure exports, fine) · `tools/classifier/reliability.js` · `tools/classifier/fit-platt.js` · `public`-side `calibration.v1.json`.

**Edit points that DO wait for the lock-lift + commit gate:** `renderRegion.ts` (swap density math → `coverage.ts` call), `classifier.ts` (read frozen calibration constants), `index.ts` (accept `surface` field on log entries). Each is a small, gated diff — golden-diff + sweep run before/after, per `feedback_never_declare_fixed_without_regression_check`.

**Data flow:** decision log (in-memory) → snapshot scripts → `audit-runs/*.json` (versioned, committed) → offline fit scripts → frozen JSON constants → runtime reads constants. Training never happens at runtime; the render path stays deterministic (I-7) and network-free (I-10). Object `name`/`why` already persist on the Supabase record (`render_config` columns landed with schema-v3) — the naming-as-label tuple is `(name, svgHash, signalsSnapshot, chosen config)`, exportable by joining the doodles table against logged hashes; no schema change needed.

---

## 4. The DATA STORY (the judging narrative — every claim has a receipt on disk)

The §8.6 headline is *"an intelligent design system that picks the right transformation per region per source."* The story that makes this REAL and not buzzword:

1. **Every decision is traced.** 1,394 region decisions across 197 shapes carry `firedRules`, raw score, and margin — you can ask the system *why* any region got hachure (`window.__dd_decisionLog`, live in the demo).
2. **The human is the ground truth, by design.** Overrides + blessed golden labels = Sebs's eyeball operationalized. The 06-11 recall-hole fix is the worked example: classifier silently dropped pure-black details → golden-diff produced the per-item table (140 flips, 67 shapes) → human blessed → v2 became the new contract. Correction → measurement → bless: a real learning loop with receipts.
3. **Labeling is hidden inside play.** Naming your doodle IS labeling a training example (ESP Game pattern — von Ahn & Dabbish, *Labeling Images with a Computer Game*, CHI 2004, https://dl.acm.org/doi/10.1145/985692.985733); the why-line deepens it (IKEA effect — Norton, Mochon & Ariely, J. Consumer Psych. 2012). The social desk is simultaneously the data flywheel.
4. **Breakage is data, not debris.** The audit catalog ("wobble 0.8 shreds pencil-tip polygons") is the labeled dataset for per-element scaling — the future model's curriculum already exists in `audit-runs/`.
5. **Confidences are measured.** Post T2-a: reliability table + ECE, frozen calibration constants, threshold tuned on data — "the 0.7 is no longer a guess."
6. **Honest tiering.** Rules today (inspectable, deterministic), measured calibration this week, trained providers next — each tier gated by a regression harness that diffs all 1,394 decisions. Nothing silently shifts. This maps 1:1 to the wedge: trust · reversibility · authorship · steering · human-in-the-loop.

---

## 5. Research anchors (verified citations — load-bearing ones only; full bibliography in 24-research)

- **Small-data calibration:** Platt sigmoid over isotonic below ~1000 samples — scikit-learn calibration guide (https://scikit-learn.org/stable/modules/calibration.html); ECE/reliability diagrams — Guo et al., ICML 2017 (arXiv:1706.04599).
- **Rules-as-labeling-functions is a published production pattern, not a hack:** Snorkel — Ratner et al., VLDB 2018 (arXiv:1711.10160).
- **Small tabular data: trees/linear beat NNs** — Grinsztajn, Oyallon & Varoquaux, *Why do tree-based models still outperform deep learning on tabular data?*, NeurIPS 2022 D&B (arXiv:2207.08815). Validates the no-neural-nets verdict for this scale.
- **Cheap→expensive cascades:** Viola–Jones (CVPR 2001) for stage discipline; FrugalGPT (arXiv:2305.05176) for the acceptance-scorer framing of "when to escalate to the cached-LLM provider."
- **Spending the human's labeling time:** uncertainty/margin sampling — Settles, *Active Learning Literature Survey* (2009, https://burrsettles.com/pub/settles.activelearning.pdf); interactive-ML interface design — Amershi et al., *Power to the People*, AI Magazine 2014.
- **Regression discipline for ML changes:** The ML Test Score — Breck et al., Google 2017; behavioral MFT/INV/DIR tests — CheckList, ACL 2020 (arXiv:2005.04118).
- **Density math:** Murray-Davies inverse + Praun TAM banding + Mahy JND — see 21-research §4 refs (already verified in that pass).

---

## 6. SEBS DECISIONS (each with recommended default)

| # | Decision | Options | **Recommended default** |
|---|---|---|---|
| SD-1 | In-makeathon scope | ~~cut options~~ **RESOLVED by Sebs 2026-06-11: FULL scope** — A + B + C (every conversion picker) + D + E (when physics lands) + F + T2-a, sequenced as dated above; Sebs calls time. Only open sub-question: pull T2-b/QW-6 in on a clean 06-16? (default: post — numeric-behavior safety, not scope) |
| SD-2 | Smart-pick visibility | (a) silent defaults · (b) visible "smart picked sketchy + hachure — dense small regions, dark fills" chip with the receipt · (c) full explain panel | **(b)** — the receipts ARE the wedge demo; a chip costs ~an hour, an explain panel is scope creep. |
| SD-3 | Does smart pick ever re-fire after the first pick? | (a) once at ingest only · (b) re-pick on every style change | **(a)** — I-1 stays absolute; the user's dropdowns are never auto-moved after ingest. |
| SD-4 | Phase A timing | (a) standalone 06-13 · (b) paired with M8 on 06-14 (shared 8-band table) | **(b)** — "one math, two renderers" is the round-trip coherence receipt, and it sequences after the commit gate + lock-lift naturally. |
| SD-5 | T2-b LR weights | (a) post-makeathon · (b) stretch on a clean 06-16 | **(a)** — golden v2 makes it *possible*; the deadline makes it unwise. The demo line "trained on my corrections" still exists honestly as "the dataset + harness are live; first trained provider is next." |
| SD-6 | Naming-as-label export | (a) ship the export join script in-makeathon (small) · (b) post | **(a) if 06-16 has slack, else (b)** — it's a receipts artifact, not a feature. |

**Next move when a smart-system session opens:** confirm SD-1..SD-6 → QW-5 reliability script (no locks needed) → Phase C smartPick build in DrawPanel.
