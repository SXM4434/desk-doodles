# Classifier offline tooling (QW-3 + QW-4 · 24-research §7.1)

Manual node scripts over the QW-1 decision log (`window.__dd_decisionLog`). NOT part of the app bundle. Dev server must be running at localhost:5182.

- `golden-snapshot.js` — drives /audit?smartHachure=1 headless, pulls the decision log, writes `audit-runs/golden-labels.v1.json` (sorted, deduped per svgHash+regionPath).
- `golden-diff.js <baseline> <candidate>` — compares EVERY entry (full table, no sampling): role flips + |Δconf| > 0.1; exits 1 on any flip or entry-set drift. THE regression gate for classifier changes.
- `ambiguity-queue.js <golden.json>` — ranks by ascending margin (Settles uncertainty sampling), prints top 20 — Sebs's override-tagging priority list; already-overridden entries excluded.

Run order: snapshot (baseline) → make classifier change → snapshot (`--out` elsewhere) → diff → if gate passes, queue → Sebs tags in /audit.

`audit-runs/golden-labels.v1.json` is the calibration/training SEED DATASET (blessed-pending until Sebs corrects + blesses): Platt scaling (T2-a), rule-weight fitting (T2-b), and the reliability script (QW-5) all feed on it. Do not delete; version bumps (`v2`…) on re-bless.
