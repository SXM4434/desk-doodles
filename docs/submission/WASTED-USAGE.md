# Wasted-usage accounting — R8 night/day session (2026-06-14)

Honest record of usage that produced **no usable output**, for a support-credit request. Not inflated — most of the
session DID produce value (see bottom); this lists only the genuine waste.

## Genuinely wasted (no usable output)

### 1. Stale-base worktree agents (the biggest, a real tooling issue)
The harness creates `isolation:'worktree'` agents from a **fixed base commit `54ca22f` — 144 commits behind HEAD**. Half
the current source files don't exist at that base, so any agent told to EDIT current code found the target file absent and
could only return BLOCKED. This is a tooling behavior, not a request error — worth reporting via Claude Code's `/bug`.
- **Side-debugger `abfc58f0b54133b2a`** — snap-bug fix in a worktree → BLOCKED (shapeFit.ts absent at base). **~31k subagent tokens, zero output.**
- **Fix-fleet `wjoy4060b`** — 4 worktree fix agents (fill/2D-shading/3D/rose), KILLED once the stale-base trap was understood; their diffs would not have applied to HEAD. Partial spend, **no usable output.**

### 2. Redundant fleets (killed once found to duplicate existing work)
- **Feature-spec `wmf15yvjy`** — re-derived `docs/FEATURES-UX-BUILD-SPEC.md` which already existed. Killed mid-run.
- **UX-research `a23c727…`** — re-did research already in that spec's §8. Killed mid-run.
- **Debug-diagnose `wsxw8mmzu`** — 8-agent diagnosis, killed at the budget alarm. Partial.

### 3. Leftover crash (prior session)
- **`aa9dd66c…`** "Manual-draw all-197 OFAT chunk 0" — died with "Request too large (max 32MB)" (vision-overflow). **~3.7k tokens, no output.**

## Root causes
1. **Worktree stale-base** (tooling) — the dominant waste; report via `/bug`.
2. **Over-launching** early (redundant + worktree fleets before the stale-base trap was understood) — process error on my side, now corrected (edits = main-loop; agents = read-only/research only).

## NOT wasted (real value produced this session — for honest balance)
11 bug fixes committed + verified (9 commits) · big-daddy harness built + tested · all fix-specs · feature scaffolds
(type-clean) · clean dataset (108 honest rows) · 15-file online-SVG corpus · Known-Solutions research.

## How to request a credit
I can't contact Anthropic for you. Use the official channels:
- **Claude Code `/bug`** — report the worktree stale-base behavior (the tooling cause of #1).
- **Anthropic support / help center** (support.anthropic.com) or your plan's billing/usage support — request a usage
  credit and cite this file + the categories above.
