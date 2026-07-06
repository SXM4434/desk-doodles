---
name: desk-doodles-bug-index
description: Use when debugging ANY Desk Doodles bug or rendering issue — consult the bug INDEX (ALL-BUGS-AND-FIXES.md) + the proven-algorithm library (KNOWN-SOLUTIONS.md / -PART2.md) FIRST, before re-diagnosing from source. Triggers on "fix X", "X is broken", "why does X render wrong", "debug the desk/fill/3D/upload/save", "is this a known bug?", or any render/conversion/persistence defect. The law: check whether it's already diagnosed and whether a proven solution already exists before burning time hacking your own.
---

# Desk Doodles — Bug Index & Known-Solutions First

Before re-diagnosing any Desk Doodles bug from source, **read the index**. Most issues are already root-caused, status-tracked, and pointed at a proven, citable algorithm. Re-diagnosing something that's already mapped is the waste this skill exists to prevent (`feedback_use_proven_solutions_for_solved_problems`).

## The two docs and how they relate

| Doc | Role | What it gives you |
|---|---|---|
| [`docs/submission/ALL-BUGS-AND-FIXES.md`](../../../docs/submission/ALL-BUGS-AND-FIXES.md) | **The bug INDEX** | *What's broken, why, the recommended fix, where the proven solution lives, and the live-impact status.* The single skimmable map of every known issue across the app, grouped by subsystem. It deliberately does NOT re-paste algorithms. |
| [`docs/submission/KNOWN-SOLUTIONS.md`](../../../docs/submission/KNOWN-SOLUTIONS.md) + [`KNOWN-SOLUTIONS-PART2.md`](../../../docs/submission/KNOWN-SOLUTIONS-PART2.md) | **The proven-algorithm library** | The *citable, ready-to-execute* fixes: region-fill (raster span-flood, gap dilation, polygon-clipping trace), even-odd holes, 3D relief/inflation, clean silhouette, recognition + gap-close, NPR/smart-ML, many-objects-in-3D, image-upload + AI-mesh. Real citations included. |

**The link between them:** every row in the index that says `→ KS §X` (or `KS-P2 §X`) points at the section of KNOWN-SOLUTIONS that holds the proven algorithm for that bug. Index tells you *what + where*; KNOWN-SOLUTIONS tells you *how*.

Two more docs the index folds in by reference (don't duplicate them):
- [`DESK-RENDER-FIXES-PLAN.md`](../../../docs/submission/DESK-RENDER-FIXES-PLAN.md) — the diagnosed, ordered fix plan for the desk-canvas zoom / pan / 3D-streaming bugs (B1–B5), with the world↔screen math. The index's "Camera / Render" section is a summary; this is the authority.
- [`OPTIMIZATION-ANTI-LAG.md`](../../../docs/submission/OPTIMIZATION-ANTI-LAG.md) — performance/lag is its own playbook (see the `desk-doodles-perf` skill).

## The method (do this, in order)

1. **Locate the bug in the index.** Open `ALL-BUGS-AND-FIXES.md`, read §0 (at-a-glance open/partial bugs by subsystem), then jump to the subsystem section: Camera/Render · Fill/Shade · 3D/svg-port · Image-upload/AI-mesh · Save/Persistence/Supabase · Personal-space · Drag/Drop · Misc/robustness.
2. **Read its row.** Note: symptom · root cause (with `file:line`) · recommended fix · **status** (🟢 fixed · 🟡 partial · 🔴 open · ⏸️ parked · 🔵 design call→main chat) · cross-ref.
   - If it's already 🟢 fixed → don't re-fix; re-verify it's actually live (statuses can lag git; line numbers are approximate — **re-grep before editing**).
   - If it's ⏸️ parked or 🔵 a design call → it goes to main chat, not a blind fix.
3. **Follow the `→ KS §X` cross-ref** into KNOWN-SOLUTIONS for the proven algorithm. Use it rather than inventing one — the "Problem → Proven-Solution → Our-Recommendation" tables already did the research (`feedback_always_research_before_building`). The fill rework, even-odd knockout, 3D relief, gap-closer, etc. are all specced there with the dep already installed (e.g. `polygon-clipping`).
4. **Only re-diagnose from source if the bug is NOT in the index** — and when you do, build a real-data diagnostic FIRST (playwright/console on `/desk?demo=1&n=80` or `/audit`), never guess from reading source (`feedback_diagnose_with_real_data_first`; speculative patch attempt 3 = stop, build the inspection tool).
5. **Add new bugs back to the index** when you find them — a new row keeps it the single source of truth (and each labeled bug feeds `datasets/smart-layer.dataset.jsonl` per `feedback_keep_feeding_smart_ml`).

## The standing discipline (non-negotiable before any "fixed")

- **Diagnose with real data first** — diagnostic tool before speculative patches.
- **Live-verify, not headless** — final proof = driving the LIVE app at `:5182` (isolated/headless harnesses lie; `feedback_live_check_not_headless_harness`).
- **Regression-check** — baseline screenshot → apply → re-screenshot → diff (6 representative shape classes; full sweep if `smartHachure`/`SvgStyleTransform`/classifier/coverage touched). See the `regression-check` skill. Never declare fixed without it (`feedback_never_declare_fixed_without_regression_check`).
- **Edits to existing files = main loop only** (worktree agents are on a stale base); read-only diagnosis/OFAT agents are fine.

## Cross-doc map (from the index)

| Working on… | Read |
|---|---|
| The bug index | `ALL-BUGS-AND-FIXES.md` |
| The proven algorithm for a fix | `KNOWN-SOLUTIONS.md` + `KNOWN-SOLUTIONS-PART2.md` |
| Desk-canvas zoom/pan/3D-stream root causes + ordered plan | `DESK-RENDER-FIXES-PLAN.md` |
| Performance / lag without regressing quality | `OPTIMIZATION-ANTI-LAG.md` (skill: `desk-doodles-perf`) |
| Live re-diagnosed upload/evenodd status | `BROKEN-MAP-STATUS.md` |
| Architecture debt (stale-state, unnecessary effects) | `CODE-QUALITY-PASS.md` |
