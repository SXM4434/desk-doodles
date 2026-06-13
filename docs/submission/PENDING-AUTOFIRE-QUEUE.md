# PENDING AUTO-FIRE QUEUE — the auto-orchestration (Sebs 2026-06-13)

**How "auto" works:** every agent completion wakes the main loop (harness notification). On each landing I: (1) review + merge/commit the landed work, (2) check this queue, (3) fire any item whose blocker just cleared. New unblocked work fires immediately. Design/craft decisions still surface to Sebs.

**⚠️ STALE-BASE LAW:** worktree agents branch from `54ca22f` (NOT current HEAD). So:
- ✅ Worktree OK for: NEW files + READ-ONLY (audits). Merge = copy files.
- ❌ Worktree BAD for: editing heavily-changed EXISTING files (DrawSurface, SvgStyleTransform, DeskPage) → stale 3-way merge. Do those IN MAIN LOOP, or have the agent emit a diff I re-implement on HEAD.

---

## 🟢 DONE / COMMITTED
- svg-port WIP (2c23850) · image-mode scaffold (470229a) · personal-space scaffold unwired (9338de6) · 2D systemic fix (3ed6924).

## 🟡 RUNNING (worktree)
- **aadc3aed — card export + author field** (ObjectCard existing + new export util). On landing: cp new util clean; ObjectCard edits may need re-apply on HEAD (stale-base).

## 🔥 FIRE NOW (unblocked, worktree-safe = new files)
- **hard-3D scaffold** (R10): fal/Tripo image→GLB Edge fn + hardPath.ts (NEW files, inert, gated on credits). LAUNCHING.

## 🛠️ MAIN LOOP (existing-file edits — can't worktree; Sebs-live area) — in priority order
1. **Fill clean-edge** (corner notches + bleed past edge + full-fill) — Sebs FIX FIX. ← NOW.
2. **Re-draw modal**: strokes cut off/cropped (CASE-2) + missing drawing toggles.
3. **Snap doesn't close** circle (shapeFit/snap weld).
4. **CASE-3 re-implement** on current SvgStyleTransform (logic captured: percentage-source → wrapper+inner hosts fill 100%). [stale worktree a2a70592 = reference only]
5. **svg-port craft tuning** (mark boldness) — pairs with Sebs's eye.

## ⏳ AUTO-FIRE WHEN BLOCKER CLEARS
- **Iteration-2 audit** (read-only, worktree/in-tree OK) ← fire when fill+redraw+svg-port settle (audit the fixed tree). Per-object paired-vs-Clean + per-toggle LMH 2D+3D + svg-port-vs-2D-style + weird inputs. Feeds dataset.
- **Card-export merge** ← on aadc3aed landing.
- **2D↔3D desk flip + orbit** (R9) ← needs svg-port stable (shares Stroke3DScene). Main loop.
- **Personal-space WIRE** (DeskPage integration + 2 type fixes + drawer-in-public) ← R9, after fill/redraw settle (DeskPage lane).

## 🔵 DESIGN → MAIN CHAT (not agent-able)
- More primitives · select drawing PARTS · select WHAT snaps · mode-switch UX · drawer in BOTH public+personal · identity pass.

## 🙋 SEBS-SIDE
- Make checkpoint #2 · golden-v3 bless · fal/Tripo credits.
