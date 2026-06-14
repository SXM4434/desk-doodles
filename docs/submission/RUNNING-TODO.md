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
- 🔴 **stipple style is a NO-OP on the UPLOAD path** — uploaded-SVG + stipple renders byte-identical to rough-handdrawn (fillStyle:'dots' not pushed into live modifiers on upload; "live render uses raw state, not preset"). Real `project_f3_styles_must_all_be_real` violation. Found by svg-upload OFAT (aaaf91d8). Scope: confirmed on /canvas upload; could not scope /audit. ← MAIN LOOP fix.

## 🐛 3D BUGS
- 🟡 **svg-port 3D** ("all hella broken" → uniform hachure slab, drawing absent) → REBUILT + committed (2c23850): drawing now ON the form, surface-locked, carved (emissive ink + displacement + normal). STRUCTURE fixed. 🔵 CRAFT pending: marks read FAINT — needs bold-carve tuning + Sebs's eye. ← pushing now.
- 🔴 **svg-port RETAIN 2D vibe** AND feel FULLY 3D (carved, not plopped on top) — main loop, in progress.
- 🔴 **svg-port shading svg→3D** (no double-shade/wash of 2D tone) — design resolved (emissive ink + lit relief); verify in tuning.
- 🟢 **Faceted/jagged silhouette rims** ("weird polygon artifacts in different 3d things") → FIXED + committed (186a1a4): corner-aware multi-pass Chaikin on the smoothed contour (circle rim 39.8°→3.8°, square corners pinned/sharp, watertight, 51/51 smoke, tsc, live-verified circle smooth + square sharp). 2D crisp-fill lane untouched.
- 🟢 RC-2 solid buries hand → bas-relief. RC-5 wet-ink/charcoal dead → fixed. Arrow→rod default.
- ⚠️ **UPLOADED-SVG → 3D IS NOT WIRED** (svg-upload OFAT aaaf91d8): /canvas flips to 3D on DRAWN STROKES only; uploads show honest gate "Upload→3D is the hard path — drawn strokes only for now". So the **svg→3D half of the grande-daddy can't run live yet**. 🔵 DECISION (main chat): defer svg→3D to R10 hard-path (credits) vs wire EASY svg→3D now (uploaded paths → strokes → existing strokeTo3d engine, no credits).

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

### 🏆 THE GRANDE-DADDY OFAT (Sebs 2026-06-14 — the FINAL R8 cert, runs AFTER separate OFATs + all fixes land)
Structure (Sebs, restated): the **full user flow** checked end-to-end once the separate per-stage OFATs are done. **3 OFATs in one grande-daddy**, using the AUDIT catalog objects, **hand-drawn by me through the live tools**:
1. **Manual-draw → 2D check** — hand-draw each audit object via live tools; OFAT every 2D toggle, baseline held, switch ONE thing, **compare to the SVG/Clean** render, paired, read.
2. **Manual-draw → 3D convert → 3D check** — convert each to 3D; OFAT every 3D toggle the same way.
3. **SVG-upload flow** — upload each object's SVG → 2D check → (→ 3D check **blocked: upload→3D not wired**, see 3D BUGS decision).
- METHOD = true OFAT (one object, one toggle, one change vs Clean) at SCALE via **parallel agents, one object each** (`feedback_parallel_agent_verification_and_feed`): parallelism = throughput, each agent = the rigorous paired-with-Clean read. Every result feeds the dataset. NOT fast pixel-triage — that's the per-stage pre-check, this is the eyeball cert.
- DATASET adapters still TODO: `--from-ofat-manualdraw`, `--from-ofat-upload`, `--from-ofat-drawtools` (findings JSONs preserved on disk).

## 🐛 BUG-HUNT FINDINGS (workflow wbtntkavw, 11 agents/3 rounds, 2026-06-14)
- 🟢 **O1 (MED) — 2D→3D flip dropped shade/tone regions** = fill→3D-hollow (Bug 1) → FIXED + committed (2fdfbd8): toneFills threaded into Stroke3DScene, each fill builds a band-grey slab via buildExtrudeGeometryWithHoles. Live-verified macbook (was hollow → now solid tone slab).
- 🟡 **S1 — /playground "3D" toggle is a DEAD control** (button highlights, no canvas mounts, stays 2D). Workflow SAFE-FIXED in worktree (honesty-gate pattern) — HARVEST. `DeskDoodlesPlayground.tsx`.
- 🔴 **U1 (LOW) — personalSpace READ helpers don't gate on isPersonalSpaceDbReady()** — flag-on-before-migrations fires 404/400 on every /desk mount (degrades gracefully, default-OFF clean). `personalSpace.ts` getMyProfile/listMyDrawer. Clean safe fix.
- 🔴 **O5 (LOW) — single dot/tap → zero strokes, no feedback** (TAP_SLOP_PX=6, by-design but silent). Allow dot marks or micro-feedback. `DrawSurface.tsx`.
- 🔴 **O6 (LOW) — off-canvas drag selects UI text** (no `user-select:none` on canvas chrome). `DrawSurface.tsx`/page chrome.
- 🔵 **O3 (LOW) — no responsive/mobile layout** on /canvas + /desk (fixed chrome > viewport at ≤400px). Desktop-first scope gap → SEBS decision: in/out for makeathon?
- 🔵 **O4 (LOW, informational) — OOB `?desk=999/abc/<script>` silently → desk 0** (safe, no XSS). Add not-found state or leave. SEBS decision.
- O2 = svg-port absent@auto = already Bug 2 (don't double-count).

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
