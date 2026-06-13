# RUNNING TODO — everything Sebs has asked for (single source of truth)

**Rule (Sebs 2026-06-13, emphatic): capture EVERY ask here the moment it's said; mark 🟢 DONE as finished so nothing drops and Sebs doesn't have to wonder.**
Status: 🔴 open · 🟡 in progress (owner) · 🟢 done · 🔵 design-decision → main chat first.
_Last comb-through: 2026-06-13 (this session + prior context + round plan)._

---

## 🐛 DRAWING / FILL / SNAP BUGS
- 🔴 **Fill bleeds PAST the outline edge** — gray fill spills beyond the stroke (dirty edges). [img 2026-06-13] — overlaps a5faecfd fill-smooth; verify on landing.
- 🔴 **Fill must be CLEAN + SMOOTH on edges** AND able to FULLY fill (small gap OK, no ragged/blobby). 🟡 a5faecfd.
- 🔴 **Fill doesn't fill the WHOLE object** — need full-fill ability. 🟡 a5faecfd (FULL FILL control exists; verify completeness).
- 🔴 **Circle draw + snap doesn't fully CLOSE** — closed circle + snap ADDS a separation/gap. [img 2026-06-13] — QUEUED fill/draw lane after a5faecfd (shapeFit/snap-close).
- 🔴 **Select WHAT snaps** — user control over which strokes/shapes snap (not forced/auto on everything). [2026-06-13] 🔵 design + build.
- 🔴 **RE-DRAW shows strokes CUT OFF / zoomed / cropped** (not fit to the modal) — CASE-2, CONFIRMED still broken [img 2026-06-13]. (agent a5faecfd documented but did NOT fix it; re-queued.)
- 🔴 **RE-DRAW modal MISSING the drawing toggles/tools** — only SKETCH/STYLE + BACK/DONE; no brush/fill/snap/primitive controls like the main draw popup. [img 2026-06-13]
- 🟡 **Elongated drawing shifts out of view** on SKETCH→STYLE flip — CASE-3. → a2a70592.
- 🟢 Place doodle → move → disappears — FIXED (c6b087e).
- 🟢 SVG upload freeze + truncation — FIXED (57a0359).
- 🟢 2D systemic: group-transform collapse + riso nested-white flood — FIXED (3ed6924).

## 🐛 3D BUGS
- 🟡 **svg-port 3D "all hella broken"** (uniform hachure slab, drawing absent) → REBUILT in main loop: drawing now ON the form, surface-locked, carved (displacement+normal+emissive). 🔵 craft target (line-art reads faint) → Sebs's eye.
- 🟢 RC-2 solid buries the hand → bas-relief. RC-5 wet-ink/charcoal dead → fixed. Extrude/svg-port broken → in the svg-port rebuild.
- 🔴 **svg-port must RETAIN the 2D vibe** (hand-drawn feel) AND feel FULLY 3D (carved, not plopped on top) — main-loop, in progress.
- 🔴 **svg-port shading svg→3D** (don't double-shade / wash the 2D tone) — design resolved (emissive ink + lit relief); verify.

## ✨ FEATURES (drawing tools)
- 🔴🔵 **MORE PRIMITIVES** — more drawing primitives/shapes (said twice). Which set + how surfaced = design.
- 🔴🔵 **Select different PARTS of a drawing** — pick/edit any region/stroke, not just the last-drawn. [face img]
- 🔴🔵 **Mode-switching UX is annoying** — rework the 2D/3D + input (draw/upload/image) switch flow.
- 🔴 **Shading input** — tone-fill / shade-brush (discrete bands) feeding I-2 source-darkness.
- 🔴 **Import the drawing tools INTO the 3D canvas** (test hatch etc. live in 3D).

## ✨ FEATURES (card / sharing / space)
- 🟡 **Card export → SVG (+PNG)** on the card detail modal. → aadc3aed.
- 🟡 **Optional AUTHOR-NAME field** on the card (skippable; ties to onboarding handle). → aadc3aed.
- 🟡 **Personal space MVP** — private desk (owner_id) + per-person drawer + onboarding handle (Keep/Reroll/Type, anon-auth). FULL feature. → af1ef603 (scaffold committed UNWIRED; DeskPage wiring + 2 type fixes deferred to R9 integration).
- 🔴 **Drawer in BOTH public AND personal** (Sebs 2026-06-13) — every person gets a drawer on the PUBLIC desk too, not just their personal space. Scaffold did personal-only; add public-desk drawer.

## ✨ FEATURES (conversion / 3D — R9/R10)
- 🟡 **Image mode** (image→SVG; Quiver best-quality; output SIMPLER hand-drawn sketch). → a5efbbb8.
- 🔴 **Hard-3D path** (fal/Tripo image→GLB) — R10, gated on Sebs's credits.
- 🔴 **3D into the desk: 2D↔3D flip + orbit on a PLACED object** (demo climax) — R9.
- 🔴 **3D symmetry-law completeness + polish** — R11.
- 🔴 **ML go-live** (92.7% model wired live) — R10, gated on golden-v3 bless.

## 🔁 PROCESS / QUALITY (standing)
- 🟡 **THE LOOP** — audit→fix→re-audit, multiple iterations until air-tight. Iter-2 (per-toggle LMH 2D+3D · weird/adversarial inputs · paired-vs-Clean · svg-port-vs-2D-style) queued after svg-port settles.
- 🟡 **Verification standard** — paired-vs-Clean per object, OFAT every toggle LMH, SVG AND 3D, read by me, never sample-and-claim.
- 🟡 **Adversarial break-it** — weird/made-up/degenerate/extreme inputs + the 197 through the LIVE draw tools.
- 🟡 **Keep feeding the smart/ML dataset** from every audit/sweep/pick.
- 🟢 **Keep this running doc + mark done** (this file) — established 2026-06-13.
- 🔴 **Research online for everything** before building — standing.

## 📦 SUBMISSION / SHIP (later rounds)
- 🔴 **Make checkpoint #2** (Sebs runs; I prep file list) — after R8.
- 🔴 **Golden-v3 bless** (Sebs eyeball, after I certify the wall clean) — gates ML go-live.
- 🔴 **Identity / own design+motion language pass** — R12.
- 🔴 **Submission assets** (video, story, build-in-public posts) — R12. Selective brand tagging.

## ⚙️ PARALLEL STREAMS NOW (worktree agents, DB-safe, Opus)
- a5faecfd: CASE-2 redraw + fill-smooth (fill-bleed likely here)
- a2a70592: CASE-3 elongated-shift
- af1ef603: personal-space MVP scaffold
- aadc3aed: card export + author field
- a5efbbb8: image-mode
- MAIN LOOP: svg-port 3D craft tuning
