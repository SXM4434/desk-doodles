# RUNNING TODO — everything Sebs has asked for (single source of truth)

**Rule (Sebs 2026-06-13, emphatic): capture EVERY ask the moment it's said; mark 🟢 DONE as finished so nothing drops.**
Status: 🔴 open · 🟡 in progress (owner) · 🟢 done · 🔵 design-decision → main chat first.
_Last full comb: 2026-06-13 (whole session + summary + memories + round plan + docs)._

---

## 🐛 DRAWING / FILL / SNAP BUGS (all MAIN LOOP — existing-file, can't worktree: stale-base)
- 🔴 **Fill CLEAN EDGE** — fill bleeds PAST the outline (dirty edges) + ugly white corner-notches on styled fills [imgs 2026-06-13]. ← FIX FIX, next in main loop.
- 🔴 **Fill must be SMOOTH + able to FULLY fill** (small gap OK, no ragged/blobby).
- 🔴 **Fill doesn't fill the WHOLE object** — full-fill reliability.
- 🔴 **Circle draw + snap doesn't fully CLOSE** — closed circle + snap ADDS a gap [img]. (shapeFit/snap weld)
- 🔴 **Select WHAT snaps** — user control over which strokes snap (not forced/auto). 🔵 design+build.
- 🔴 **RE-DRAW strokes CUT OFF / cropped** (not fit to modal) — CASE-2, CONFIRMED broken [img].
- 🔴 **RE-DRAW modal MISSING drawing toggles/tools** — only SKETCH/STYLE + BACK/DONE; no brush/fill/snap/primitives [img].
- 🟡 **Elongated drawing shifts out of view** on SKETCH→STYLE — CASE-3. FIX FOUND (percentage-source → wrapper+inner hosts fill 100%); worktree a2a70592 stale-base → RE-IMPLEMENT on current SvgStyleTransform (main loop).
- 🟢 Place→move→disappears (c6b087e) · SVG upload freeze+truncation (57a0359) · 2D systemic group-transform + riso flood (3ed6924).

## 🐛 3D BUGS
- 🟡 **svg-port 3D** ("all hella broken" → uniform hachure slab, drawing absent) → REBUILT + committed (2c23850): drawing now ON the form, surface-locked, carved (emissive ink + displacement + normal). STRUCTURE fixed. 🔵 CRAFT pending: marks read FAINT — needs bold-carve tuning + Sebs's eye. ← pushing now.
- 🔴 **svg-port RETAIN 2D vibe** AND feel FULLY 3D (carved, not plopped on top) — main loop, in progress.
- 🔴 **svg-port shading svg→3D** (no double-shade/wash of 2D tone) — design resolved (emissive ink + lit relief); verify in tuning.
- 🟢 RC-2 solid buries hand → bas-relief. RC-5 wet-ink/charcoal dead → fixed. Arrow→rod default.

## ✨ FEATURES — DRAWING TOOLS (most 🔵 design)
- 🔴 **FULL drawing-tool gambit ON the /canvas (3D) route** (Sebs 2026-06-13) — brush · fill · snap · shade · ALL primitives available in the canvas so you can draw + test the draw tools AND the 3D together in one place. (= "import the drawing tools into the 3D canvas".)
- 🔴🔵 **MORE PRIMITIVES** — more drawing primitives/shapes (said 3×).
- 🔴🔵 **Select different PARTS of a drawing** — pick/edit any region/stroke, not just last-drawn.
- 🔴🔵 **Mode-switching UX is annoying** — rework the 2D/3D + input switch flow.
- 🔴 **Shading input** — tone-fill / shade-brush (discrete bands) feeding I-2 source-darkness.

## ✨ FEATURES — CARD / SHARING / SPACE
- 🟢 **Card export → SVG + PNG** on the card detail modal — DONE (7f4345c).
- 🟢 **Optional AUTHOR-NAME field** (naming stage + card, skippable) — DONE (7f4345c).
- 🟡 **Personal space MVP** — private desk (owner_id) + per-person drawer + onboarding handle (Keep/Reroll/Type, anon-auth). Scaffold committed UNWIRED (9338de6). R9: wire DeskPage (+2 type fixes).
- 🔴 **Drawer in BOTH public AND personal** — every person gets a drawer on the PUBLIC desk too. (scaffold did personal-only.)

## ✨ FEATURES — CONVERSION / 3D (R9/R10/R11)
- 🟡 **Image mode** (image→SVG, Quiver best-quality, output SIMPLER hand-drawn sketch). Scaffold committed (470229a); wire DrawPanel + deploy Edge fn (key in Supabase secrets) = R10.
- 🔴 **Hard-3D path** (fal/Tripo image→GLB) — R10, gated on Sebs's credits. ← scaffolding now (new files).
- 🔴 **3D into the desk: 2D↔3D flip + orbit on a PLACED object** (demo climax) — R9.
- 🔴 **3D symmetry-law completeness + polish** — R11.
- 🔴 **ML go-live** (92.7% model wired live) — R10, gated on golden-v3 bless.

## 🧪 TESTING PROTOCOL (Sebs 2026-06-13 — how we test draw tools + 3D)
- 🟡 **Run the 197 audit objects THROUGH the live draw tools** (not just the catalog harness) — render each in-app.
- 🟡 **MANUALLY draw the objects myself by hand** via the draw tools — exercises the draw tools AND the 3D conversion on real hand input.
- 🟡 **Adversarial break-it** — weird/made-up/degenerate/extreme inputs; toggle extremes.
- 🟡 **Paired-vs-Clean per object, OFAT every toggle LMH, SVG AND 3D**, read by me, never sample-and-claim. + svg-port-vs-2D-style.

## 🔁 PROCESS / QUALITY (standing)
- 🟡 **THE LOOP** — audit→fix→re-audit, multiple iterations until air-tight (iter-2 fires after fill+redraw+svg-port settle).
- 🟡 **Keep feeding the smart/ML dataset** from every audit/sweep/pick.
- 🟡 **Persist until proven impossible** — never quietly downgrade scope.
- 🟢 **Keep this running doc + auto-fire queue + mark done** — established 2026-06-13.
- 🔴 **Research online for everything** before building — standing.
- 🔴 **Selective brand tagging** (build-in-public: hashtags always, brand tags only kickoff/milestone/demo/submission).

## 📦 SUBMISSION / SHIP (later)
- 🔴 Make checkpoint #2 (Sebs runs; I prep file list) · golden-v3 bless (Sebs eyeball) · identity/own-design pass (R12) · submission assets video/story/posts (R12) · fal+Tripo credits (Sebs).

## ⚙️ STATUS (2026-06-13) — see PENDING-AUTOFIRE-QUEUE.md for the auto-orchestration
- ALL 5 parallel worktree agents LANDED + merged/committed: card-export ✅ · image-mode ✅ · personal-space ✅ · CASE-3 (re-implement pending, stale-base) · fill (taken to main loop).
- MAIN LOOP now: svg-port craft tuning → fill clean-edge → redraw → snap-close → CASE-3 re-implement.
- FIRING: hard-3D scaffold (worktree, new files).
