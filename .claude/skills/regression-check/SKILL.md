---
name: regression-check
description: Use before declaring ANY Desk Doodles fix or change "done" — the baseline→change→re-screenshot→diff ritual, plus the golden-diff gate for classifier/coverage changes. Triggers on "is this fixed?", "verify the fix", "did that regress anything?", "run the regression check", "golden diff", or any time smartHachure / SvgStyleTransform / classifier / coverage / shading was touched. The law: never declare fixed without the baseline-vs-after visual diff AND (for classifier changes) a passing golden-diff.
---

# Regression Check

The ritual that gates the word "fixed." From the standing law (`feedback_never_declare_fixed_without_regression_check`, reinforced in BUILD-TEST-FLOW.md): a build is done only when it was broken on purpose, debugged with real data, edge-cased, and **visually checked with screenshots read back** — and when a change touches the classifier/coverage path, when the **golden-diff gate passes**. Code compiling ≠ done. "Works once" ≠ done.

## When this fires

- Before telling Sebs "fixed" / "done" on any rendering or behavior change.
- ANY edit to `smartHachure/*`, `SvgStyleTransform`, the classifier, or coverage math → golden-diff is **mandatory**, not optional.
- "Did X regress?" — run the visual baseline diff across representative classes.

## Part A — the visual baseline ritual (every fix)

1. **BASELINE FIRST, before the edit.** Screenshot 6 representative shape classes (cover the span: a line/stroke shape, a closed-region shape, a dense-tonal shape, a multi-region shape, a text-bearing shape, a degenerate/edge shape). Save them somewhere stable (`/tmp/dd-regress/baseline/`).
2. **Apply the fix.**
3. **RE-SCREENSHOT** the same 6 classes, same conditions → `/tmp/dd-regress/after/`.
4. **DIFF each pair** and **READ both** with vision (the diff number is triage; the eye is the verdict). For each pair: did the target case improve? Did any of the other 5 change when they shouldn't have?
5. **Run the sweep harness** if smartHachure / SvgStyleTransform / coverage was touched (see `run-audit-sweep` — at minimum the headless geometry/coverage pass; the full visual sweep when render files are settled).
6. Only then: "done."

Use isolated preview to avoid HMR churn from concurrent fleets:
```
npm run build -- --outDir /tmp/dd-regress-dist && npx vite preview --outDir /tmp/dd-regress-dist --port <uniqueport>
```

## Part B — the golden-diff gate (classifier / coverage changes)

The golden-diff is THE regression gate for classifier changes — it compares EVERY entry, no sampling, and exits non-zero on any role flip or entry-set drift. Run order (`tools/classifier/README.md`):

```
# 1. baseline snapshot BEFORE the change (drives /audit?smartHachure=1 headless, dev server on :5182)
node tools/classifier/golden-snapshot.js          # writes audit-runs/golden-labels.v1.json (or --out elsewhere)

# 2. make the classifier change

# 3. candidate snapshot AFTER
node tools/classifier/golden-snapshot.js --out /tmp/dd-candidate.json

# 4. THE GATE — full table, no sampling; exits 1 on any role flip or |Δconf|>0.1 or entry-set drift
node tools/classifier/golden-diff.js audit-runs/golden-labels.v2.json /tmp/dd-candidate.json
```

- A non-zero exit = the change moved labels. Inspect the printed table; if the move is intended, the baseline gets re-blessed (version bump `v2`→`v3`) — **only by Sebs**. Don't self-bless (golden self-bless was explicitly stripped, Rock X item 2).
- `audit-runs/golden-labels.v2.json` is the current blessed baseline; `v1` is the seed dataset — do not delete either.

### Adjacent measurement (not a gate)
- `node tools/classifier/reliability.js` — QW-5 calibration (ECE/MCE, per-bin accuracy vs confidence). Run before/after calibration work to show the confidence→correctness curve moved. **Measurement only — golden-diff stays the gate.** Flags: `--baseline`, `--from <snapshot.json>` (offline), `--bins N`, `--out`, `--screenshot`.
- `node tools/classifier/ambiguity-queue.js <golden.json>` — ranks by ascending margin (uncertainty sampling), top 20 = Sebs's override-tagging priority list.

## Hard rules

- **No "all PASS" without the per-item evidence.** Two prior "all PASS" claims fell to verifiers (byte-diff, angle-sampling) — show the table, not a summary (`feedback_no_sampled_verification_claims`).
- **NO live Supabase writes** during verification — route-intercept any publish/delete.
- **Never re-bless the golden baseline yourself** — that's a Sebs ruling. Flag the diff and surface it.
- **Commit only files you touch** (golden snapshots → `audit-runs/`; never `git add -A`). Co-Authored-By line on the commit.
- Blocked (can't reach :5182, classifier change is half-landed, files HOT)? Record it in `docs/PENDING-AUTOFIRE-QUEUE.md`, don't force a partial gate.

## References
- `docs/BUILD-TEST-FLOW.md` — the regression ritual as non-negotiable #5
- `tools/classifier/README.md` — golden snapshot/diff/reliability/ambiguity run order + the seed-dataset rule
- `audit-runs/golden-labels.v2.json` — current blessed baseline (the diff target)
