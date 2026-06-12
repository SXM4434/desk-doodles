# 15 — The Smart / ML Ladder: what runs now, what's scheduled, and the receipts debt

**In one sentence:** The smart system is further along than the chat history suggests — the classifier, smart-pick, coverage math, golden gates, reliability/ECE, and the conversion + placement engines all RUN today — but it's *ahead on engines and behind on receipts*: three live smart surfaces produce zero training data, and the honest near-term work is the receipts retrofit, with the trained-model ladder explicitly post-makeathon.

> This page is the *ladder* — the dated build sequence and the honest exists-vs-scheduled ledger. The *engine* (signals → classify → treatment) is [03-the-smart-system.md](03-the-smart-system.md); the *trained-model architecture* is [04-the-ml-layer.md](04-the-ml-layer.md). This page is when each rung lands and where the gaps are.

---

## Plain language

### What actually RUNS today (more than you'd guess)

The smart system is not "starting." The engine, the receipts collectors, and the dataset are running. Verified in source:

| Piece | What it does | State |
|---|---|---|
| **Rule-engine classifier + provider chain** | 16 independent rules vote per region → role + confidence; chain ready for future providers | LIVE (recall-hole fix blessed 06-11) |
| **Decision log (QW-1/QW-2)** | every region's decision traced: `role, confidence, rawScore, margin, firedRules, classifiedBy, darknessL, area` → `window.__dd_decisionLog` | LIVE (write-only side channel, zero render change) |
| **Golden regression baseline** | 197 shapes → 1,394 region entries, blessed v2; `golden-diff` exits non-zero on ANY unblessed flip — THE gate for classifier changes | LIVE + BLESSED |
| **Reliability / ECE (QW-5)** | bins confidence vs correctness against golden, prints reliability table + ECE — "does 0.7 mean anything?" | BUILT (ECE 0.242, honest upper-bias caveat) |
| **Smart Pick (Phase C)** | on draw/upload Done, auto-picks a recommendation for every conversion picker (style/fillStyle/texture/penTip/multiStroke/sketchingStyle); abstain-by-default; logs `__dd_inputPickLog` | BUILT ahead of schedule |
| **Coverage math (Phase A)** | `coverage.ts` pure module — Murray-Davies inverse + 8-band L* table + per-fillStyle inverses; `renderRegion.ts` routes through it | BUILT (recalibration eyeball pending) |
| **Phase D engine routing (seed)** | closed stroke → Extrude, open → Rod, already in `strokeTo3d.ts` | half-built |
| **Phase P-1 placement** | anti-cover candidate-ring scoring — lands new doodles in the largest clear region | BUILT |
| **Coverage / golden tooling** | `golden-snapshot.js` · `golden-diff.js` (the gate) · `ambiguity-queue.js` (margin-ascending top-20, uncertainty sampling) | LIVE |

So: rules today (inspectable, deterministic), measured calibration this week, trained providers next — each tier gated by a harness that diffs all 1,394 decisions. Nothing silently shifts.

### "Ahead on engines, behind on receipts" — the central honesty

Here's the gap the audit found and named: the ladder is **ahead of schedule on engines and behind on receipts.** Three live smart surfaces — *conversion* (3D Auto picks), *placement* (P-1 landing), *edits* (Re-draw/restyle) — produce **zero training data**, while the docs' own data-story claims "every decision is traced." That claim is true *today only for the classifier*. The other three surfaces run silently.

Why it matters: demo-week traffic (unique real users) is the highest-value labeled data the app will ever see, and **every unlogged conversion / placement / edit is a lost label.** Once round-8 makes AI mesh the default 3D, the local-vs-AI route IS the conversion router's training set — and it's being discarded.

### The receipts retrofit — the cheapest honest fix

The fix is small and mostly new-file FIFOs mirroring the classifier's existing idiom:

- **G-1 conversion log** — `__dd_conversionLog`: every Auto resolution, extrude fallback, D-3 ladder fallback → `{surface:'conversion', strokesKey, setting, resolved, perStroke, paramsSnapshot}` (~40 LOC).
- **G-6 edit-correction log** — at the v4/v5 RPC call sites: `{surface:'edit-correction', rowId, before, after}` — "system chose X, user changed to Y" is the highest-value preference label the app produces (~15 LOC).
- **G-7 placement log** — at P-1 land: `{surface:'placement', candidatesScored, chosen, bestScore}`; on a fresh object's first drag-end: `{surface:'placement-correction', from, to, ageMs}`; drawer-copy = a whole-config endorsement (one line).
- **G-10 surface tags** — the planned `surface` field on log entries must carry `'record' | 'desk-lens' | 'pen-preview' | 'sandbox' | 'audit'` — because the Pen|Desk lens, the preview squiggle, and popups all emit classifier decisions into the SAME log; without a scope tag, training exports mix canonical record renders with transient lens sweeps → duplicate, contradictory labels per svgHash (quietly poisons the dataset). This lands FIRST at lock-lift, before any export script runs.

Recommendation: do the retrofit ~06-13 (half-day) — demo-week labels can't wait, but the *metrics* on those surfaces can.

### The full in-makeathon ladder (sequenced, never pre-cut)

Sebs's directive (2026-06-11): "I don't want cut stuff — the smart system gives a recommendation for each thing." So phases are **sequenced, not pre-cut**; Sebs calls time. Dated against the D′ calendar:

| Date | Rung | What ships |
|---|---|---|
| 06-12 | **QW-5 reliability** | bin confidence vs correctness, print reliability + ECE (built) |
| 06-13 | **Phase C smart pick** | recommendation for EVERY conversion picker at ingest; receipts retrofit (G-1/6/7/10) |
| 06-14 | **Phase A coverage + Phase B** | `coverageToParams` calibration wired into `renderRegion`; applied across ALL 8 shading-capable styles; same 8-band table feeds the M8 hatch shader (one math, two renderers) |
| 06-14/15 | **Phase D engine routing** | extend the `strokeTo3d` auto-pick into the documented router (signals → Rod/Extrude/needs-Tripo) + receipts |
| 06-15 | **T2-a Platt calibration** | fit `(a,b)` offline on (rawScore, correct?) → ship `calibration.v1.json`; `confidence = sigmoid(a·raw+b)`; threshold re-tuned from the reliability table — "confidences are measured, not guessed" |
| 06-16 | **Phase F cross-axis cascade** | when a pick/change moves one cluster, dependent clusters get interlinked recommendations (the doc-19 matrix) |
| 06-17 | **Data-story video segment** | export decision log + golden receipts + ambiguity queue as the "real learning system" beat |

Also in scope (sequenced behind their prerequisites): **Phase D2** (3D conversion semantics — the per-region "what is this as matter" brain, builds with the round-7 3D chrome) · **Phase E** (physics-preset suggestion, the moment physics lands) · **tone-fill brush as a signal** (G-5 — drawn input's only source-darkness channel). Only the *training-method* upgrades default post-makeathon — **T2-b learned rule weights** and **QW-6 noisy-OR** change numeric classifier behavior days before submission (a regression-safety argument, not scope-trimming).

### The post-makeathon trained-model ladder

The order the dataset earns its trained successors (from the classifier-improvements research):

1. **T2-b LR weights** — `ruleWeights.v1.json` (16×9 matrix, fitted offline, frozen) — the first *trained* artifact; per-rule provenance preserved.
2. **P-3 decision-tree provider** — trained on the decision log + golden labels + breakage catalog; inserted rules→tree in the chain, depth-capped.
3. **P-4 cached-LLM ingest provider** — build-time only, svgHash-keyed sidecar, FrugalGPT-style acceptance bar; never render-time (I-10).
4. **P-1 Snorkel label model · P-2 conformal sets · P-5 weighted-majority updates · P-6 RIPPER rule proposals (Sebs-approved only) · P-7 CheckList tests** (DIR = I-2 band monotonicity as executable tests).
5. **P-8 role-agnostic label schema** — primary label = (marks yes/no × identity band); role demoted to annotation, so the dataset survives the §7 taxonomy teardown.
6. **Manual-toggle smart layer** — per-element scaling of wobble/bowing/strokeWidth, trained on the breakage catalog — the *second* concrete decision surface on the same engine.
7. **Meta-engine extraction** — per `project_generalizable_rendering_decision_pattern`, do NOT pre-build; the manual-toggle layer is the second instance, so extraction is justified only when it actually lands.

### The data story (why this is real, not buzzword)

The headline claim is *"an intelligent design system that picks the right transformation per region per source."* The receipts that make it real:

1. **Every decision is traced** — 1,394 region decisions carry `firedRules`, raw score, margin; ask the system *why* any region got hachure, live, in the demo.
2. **The human is ground truth, by design** — the 06-11 recall-hole fix is the worked example: classifier silently dropped pure-black details → golden-diff produced the 140-flip/67-shape table → Sebs blessed → v2 became the new contract. Correction → measurement → bless: a real learning loop with receipts.
3. **Labeling is hidden inside play** — naming a doodle IS labeling a training example (ESP-game pattern); the why-line deepens it (IKEA effect). The social desk is simultaneously the data flywheel.
4. **Breakage is data, not debris** — the audit catalog ("wobble 0.8 shreds pencil-tip polygons") is the labeled curriculum for per-element scaling; it already exists in `audit-runs/`.
5. **Confidences will be measured** — post T2-a: reliability table + ECE, frozen calibration constants, threshold tuned on data.
6. **Honest tiering** — rules → measured calibration → trained providers, each gated by a regression harness diffing all 1,394 decisions.

---

## The design — why it's built this way

**Why rules first, model later (not the reverse).** Three locked reasons: (1) trust + reversibility + authorship — every classification carries `firedRules` provenance a model can't give; (2) no render-time network calls (I-10, ~16ms budget); (3) the training data didn't exist yet — the `/audit` catalog and the decision log ARE the dataset being built by *running* the rules. The architecture pre-commits to the upgrade path (the `ClassifierProvider` chain, the `classifiedBy` enum already naming `cached-llm`/`decision-tree`) so the model slots in as a one-line change, never a rewrite.

**Why the receipts retrofit can't wait but the metrics can.** Collectors are write-only and append-only — once a real user does something, the label is either captured or lost forever. Metrics (pick-eval, golden-3d, cross-renderer harness) read *accumulated* data and can be built anytime. So the honest priority is: land the FIFOs before demo-week traffic, build the eval scripts when there's slack. (Gap GD-1/GD-6.)

**Why surface tags land FIRST.** The G-10 poison is silent and irreversible at export time: if the Pen|Desk lens, the preview squiggle, and the canonical record render all log without a scope tag, you can't separate them after the fact — every svgHash gets contradictory labels. Tagging at the source is the only fix, and it must precede any export script. (This is the same baking-vs-live discipline: don't bake an unlabeled mix you can't un-mix.)

**Why measured calibration is a makeathon line and learned weights aren't.** Platt sigmoid is the small-sample method (sklearn guidance: isotonic needs >~1000 labels-with-errors); it's an offline fit producing frozen constants — zero render-path risk, and it makes "the 0.7 is no longer a guess" honestly sayable. T2-b learned weights *change numeric classifier behavior* — shipping that days before submission is a regression risk, not a scope cut, so it defaults post-makeathon (the 1,394 blessed labels make it *feasible*; the deadline makes it *unwise*).

**Why one engine, many surfaces — not a classifier per feature.** The plan literally re-merged around this (2026-06-08): five plan entries collapsed into one Smart Rendering System because they were the same engine pointed at different decision surfaces. Conversion (D2), placement (P), engine routing (D), physics (E), auto-pick (C), calibration (A) are six *consumers* of the same machinery — same Signals idea, same provider chain, same audit dataset, same future model. Improve the machinery once, all six inherit it. The generality is recognized but **not pre-built** (extract the meta-engine only when a second concrete instance independently lands).

**Why naming/placement/conversion corrections are all the same label class.** "System chose X, user changed to Y" is the highest-value preference signal, whether the X is a fillStyle (smart-pick correction), a landing spot (drag-correction), a closure (the "treated as closed?" chip flip), or a 3D treatment (per-region override). They all flow through the `overrideStore` / decision-log pattern into the same flywheel. Capturing them uniformly is what makes the dataset coherent across surfaces.

---

## Technical

All paths under `/Users/sebs/Desktop/Projects/desk-doodles/`. The smart slice landed across wave-5 (`aad27b4`: Smart Pick + coverage + 3D wiring), `e25b67a` (QW-5 reliability + Phase P placement), and earlier golden tooling.

### What runs (verified in source)

- `src/app/lib/smartHachure/` — `signals.ts` (feature vector + `darknessL`), `classifier.ts` (16 rules, additive vote, chain, decision-log emit `:343-368`), `techniqueMap.ts` + `renderRegion.ts` (treatment + render; `renderRegion.ts:18,68` routes through `coverage.ts`), `overrideStore.ts` (manual labels win), `index.ts:26-77` (decision-log FIFO, cap 5000, `window.__dd_decisionLog`).
- `src/app/lib/smart/smartPick.ts` — Phase C; `SmartPickAxes` (`:50-60`) = 6 2D pen axes (3D axes absent — gap G-3); abstain-by-default; `window.__dd_inputPickLog` (pick/abstain/undo).
- `src/app/lib/smart/coverage.ts` — Phase A pure math (`COVERAGE_BANDS`, `bandIndexForDarkness`, `bandTableForUniforms`).
- `src/app/lib/geometry3d/strokeTo3d.ts:254-263` — `resolveGeometryMode` (Phase D seed; **receipts never built** — gap G-1).
- `tools/classifier/` — `golden-snapshot.js`, `golden-diff.js` (THE gate), `ambiguity-queue.js`, `reliability.js` (QW-5, ECE 0.242), planned `fit-platt.js`. `audit-runs/golden-labels.v2.json` (1,394 entries, blessed).
- `DeskPage.tsx:~1102-1135` — P-1 candidate-ring placement (built, **unlogged** — gap G-7).
- `publish.ts:~397-440` — v4 `updateDoodleConfig` / v5 `updateDoodleArt` (no before/after capture — gap G-6).

### New modules (NEW files — nothing locked touched until lock-lift)

`coverage.ts` ✓ · `smartPick.ts` ✓ · `tools/classifier/reliability.js` ✓ · `tools/classifier/fit-platt.js` (planned) · `conversionMap.ts` + `markIntent.ts` (D2/intent, planned) · the receipts-retrofit FIFOs (`__dd_conversionLog` etc.).

### Edit points that wait for the smartHachure lock-lift + commit gate

`renderRegion.ts` (swap density math → `coverage.ts` — done behavior-preservingly), `classifier.ts` (read frozen `calibration.v1.json`), `index.ts` (accept the `surface` field on log entries — G-10, lands FIRST). Each is a small, golden-diff-gated diff per `feedback_never_declare_fixed_without_regression_check`.

### The gap ledger (smart-system-gaps.md)

| Gap | What's missing | Fix |
|---|---|---|
| G-1 | 3D conversion decisions unlogged | `__dd_conversionLog` FIFO (~40 LOC) |
| G-2 | §8.6 scope table has no 3D column | 2 rows + Phase D→D1, D2=router |
| G-3 | smartPick has no 3D axes | optional `geometryMode?`/`style3d?` (~30 LOC) |
| G-4 | records carry no mode/3D fields | record schema v-next (jsonb only) |
| G-5 | tone-fill brush absent from signals plan | explicit-`darknessL` regions + `darknessSource` tag |
| G-6 | edit/re-draw corrections unlogged | `{surface:'edit-correction'}` at the RPC sites |
| G-7 | placement decisions + drag corrections unlogged | placement/placement-correction log lines |
| G-8 | no per-surface eval (reliability covers classifier only) | eval-ladder table + `pick-eval.js` + `golden-3d.v1.json` |
| G-9 | "one math, two renderers" unchecked | paired-render 2D-vs-3D per-band ink-coverage harness at the M8 gate |
| G-10 | lens/preview/record renders indistinguishable in the log | `surface` field carries scope tag — lands FIRST |

---

## Connections

- **→ [03-the-smart-system.md](03-the-smart-system.md)** — the engine this ladder schedules; the 16-rule voting brain, the provider chain, the six decision surfaces. Edge: *the ladder is the build sequence of that engine*.
- **→ [04-the-ml-layer.md](04-the-ml-layer.md)** — the trained-model layer this ladder leads to; the two dataset streams, the provider-as-second-opinion, "don't fake shit." Edge: *the post-makeathon rungs ARE that page*.
- **→ [13-the-3d-system.md](13-the-3d-system.md)** — Phase D2 (conversion semantics) + the two register brains are smart-system surfaces; the AI router is a rented model at a stage, not the shipping ML. Edge: *conversion is a decision surface; its receipts are G-1*.
- **→ [14-the-social-desk.md](14-the-social-desk.md)** — Phase P placement; drag/copy corrections are labels (G-7). Edge: *placement is a decision surface; its receipts are G-7*.
- **→ [12-the-creation-loop.md](12-the-creation-loop.md)** — naming-as-label and edit-corrections are dataset streams; the tone brush is the missing source-darkness signal (G-5). Edge: *the loop is the data flywheel*.
- **→ [06-tone-and-shading.md](06-tone-and-shading.md)** — Phase A `coverageToParams` + the 8-band table; "one math, two renderers" (G-9). Edge: *the calibration rung spends that page's currency*.
- **→ [09-systems-thinking.md](09-systems-thinking.md)** — audit-as-dataset, one-brain-many-hands, layering-beats-replacement, no-fake-provenance — this ladder operationalizes that philosophy. Edge: *the philosophy made into a dated plan*.
- **Doc edges:** `docs/design/smart-system-build-plan.md` (the dated ladder + data story + Phase P addendum) · `docs/design/smart-system-gaps.md` (the G-1..G-10 receipts/eval ledger) · `docs/research/24-research-classifier-improvements.md` (the post-makeathon ladder) · `docs/research/21-research-3d-pipeline-and-style-translation.md` §4 (coverage math).

---

## Honest status

**The shipping smart system is a RULE ENGINE. There is no trained model anywhere in running code.** The ladder is real and partly ahead of schedule; the receipts are the live debt. Precisely:

### Real in code today (2026-06-12)

- Rule-engine classifier (16 rules, additive vote, provenance), provider chain (one provider: `ruleEngineProvider`), conservative paper fallback, 0.7 threshold.
- Decision log (`window.__dd_decisionLog`, `__dd_inputPickLog`) — **for the classifier + smart-pick only.**
- Golden v2 baseline (1,394 blessed entries) + `golden-diff` gate + ambiguity queue.
- QW-5 reliability/ECE script (built, ECE 0.242).
- Smart Pick (Phase C) — every 2D conversion picker, abstain-by-default, with the visible chip.
- Coverage math (Phase A) — `coverage.ts` routed through `renderRegion.ts` behavior-preservingly (recalibration eyeball pending).
- Phase D engine-routing seed + P-1 placement scoring (both **built but unlogged**).

### Scheduled in-makeathon (sequenced, not built)

- Receipts retrofit (G-1/6/7/10) — recommended 06-13; **the live debt.**
- Phase B (all 8 shading styles through coverage) — 06-14 with Phase A recalibration.
- Phase D2 (3D conversion router + per-mode smart calibration) — builds with the round-7 3D chrome.
- Tone-fill brush as a signal (G-5) — round-7; ingestion model needs confirming before build.
- T2-a Platt calibration — 06-15.
- Phase F cross-axis cascade — 06-16.
- Cross-renderer harness (G-9) at the M8 gate; eval ladder (G-8) 06-16 if slack.
- Phase E physics presets — only if physics lands; else post.
- smartPick 3D axes (G-3) + record schema v-next mode fields (G-4) — round-7.

### Post-makeathon (the learned ladder — vapor until built)

- Any trained artifact: T2-b LR weights, the decision-tree provider, the cached-LLM ingest provider, Snorkel/conformal/RIPPER/CheckList, the role-agnostic schema, the manual-toggle scaling layer, the meta-engine.
- QW-6 noisy-OR (still `min(1,sum)` today).
- Per-surface eval metrics beyond the classifier's reliability script.

**The one-line you can say out loud at the makeathon:** "The smart system shipping today is a deterministic, inspectable rule engine across six decision surfaces; every classifier decision is traced and golden-gated, confidences get *measured* this week, and the labeled dataset for the trained layer is accruing through naming, audits, and (once the receipts retrofit lands) every conversion, placement, and edit." That sentence is true once the retrofit lands; until it lands, only the classifier surface honestly traces.
