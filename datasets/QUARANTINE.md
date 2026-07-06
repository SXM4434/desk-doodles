# ⛔ DATASET QUARANTINE — do not train until regenerated (2026-06-14)

**Why:** the entire `smart-layer.dataset.jsonl` (64,336 rows) was generated from the **197-object catalog through an
offscreen replay/OFAT harness** — single shapes, one at a time. It NEVER exercised: multiple shapes on one canvas,
complex real-world SVG uploads (e.g. the rose line-art), or the broken 3D geometry-toggle path. The "0 BREAK / drawing
done" summary built on it was FALSE (coverage never existed). Rows fed before `cc782bd` also carry the aspect-ratio
("snap-widening") harness artifact. None of this is ground truth, and no ML model was trained on it (ML deferred; the
`.model.json` files are the rule-engine).

**Status of each source (by `"source"` tag):**

| source            | rows  | verdict     | reason |
|-------------------|-------|-------------|--------|
| fidelity-3d       | 29553 | QUARANTINE  | catalog proxy, offscreen, pre-fix |
| ofat-2d           | 20094 | QUARANTINE  | catalog OFAT, single-object, pre-fix |
| fidelity-2d       |  8245 | QUARANTINE  | catalog proxy, offscreen, pre-fix |
| ofat-3d           |  2426 | QUARANTINE  | catalog OFAT, single-object, pre-fix |
| ofat-manualdraw   |  1366 | QUARANTINE  | single-object replay, pre-fix, narrow |
| ofat-upload       |  1251 | QUARANTINE  | single-object upload, pre-fix, narrow |
| golden            |  1394 | REVIEW/KEEP | blessed ground-truth — verify `isGroundTruth:true` before trusting |
| desk-perf         |     7 | KEEP        | perf metrics, not fidelity labels |

**Regeneration gate (post-fix):** rebuild OFAT/fidelity coverage ONLY against the LIVE app, on **arbitrary + multi-shape +
complex-SVG** inputs (not just the 197 catalog), with honest live-verified labels. The catalog is a proxy, not the target.

**Recovery is non-destructive:** filter by `source` + `ingestIndex` to drop/flag; raw rows are retained for audit.

---

## ✅ NEW CLEAN SOURCE — `datasets/smart-layer.clean.jsonl`
Seeded 2026-06-14 from the live-OFAT (`wg6jeydjx`) via `tools/dataset/feed-live-ofat.mjs`: **108 honest rows**
(64 ok / 31 break / 13 partial), 103 screenshot-backed, all 4 stages. Labels are HONEST works/broken-vs-Clean from
the LIVE app — this is the trustworthy replacement for the quarantined garbage.
- **Caveat:** the SVG-upload rows (~19) have screenshot paths NOT on disk (that agent didn't save them) → lower
  confidence; re-run the SVG OFAT read-only to solidify.
- **Nature:** current-state (pre-fix) audit data — honest, but NOT trainable "correct treatment". Training the smart
  pick needs post-fix OFAT rows (re-run after each code fix). Filter on `label` + `regime.label`.
- Re-run the feed (idempotent): `node tools/dataset/feed-live-ofat.mjs [resultfile]`.
