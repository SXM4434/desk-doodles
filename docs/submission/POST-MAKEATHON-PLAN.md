# POST-MAKEATHON PLAN — Desk Doodles

**Rewritten 2026-06-24.** Submitted ~2026-06-18; now fully post-makeathon, **no deadline**, Sebs's own clock. Goal (Sebs 2026-06-24): **realize the FULL north star, perfectly done** — completeness + craft, no shortcuts. This is the *order + why*; `RUNNING-TODO.md` is the live *what's-left* board. See memory `project_desk_doodles_post_makeathon_vision`.

**North stars that rule everything:** real arbitrary doodles (not the 197 catalog) · one-pencil monochrome 3D (value from marks, never hue/gloss — matte default is locked) · its OWN design language (not a portfolio reskin) · REAL ML, not a rule-engine in a trenchcoat · no cheap polish.

---

## ✅ DONE (engine + correctness — surface-independent, validated by render diffs)
Most of the original Phase 0–3 backlog is complete:
- **Stabilize:** contentHash SHA-1 fallback · O(n²) sibling cap · personalSpace read gating · stale-drag refs · `<use>`/`<symbol>` expansion · webglcontextlost + openness gate.
- **Fill / draw:** Gap slider→floodFill · circle snap · single-tap dot · even-odd pentagram (raster fallback) · stipple reconciled (non-bug).
- **3D pencil depth:** deep geometric svg-port relief (sealed mass + manifold CSG, crisp walls) · jagged-rim fix · black-blob Extrude/Solid fix · **hatch-burial fix** (texture→normal-map, solids still carve) · per-style relief profiles · newsprint defs-inline.
- **Personal-space:** save-routing parity (edit modal + /canvas) · re-draw for uploads · drag-follower (dimmed card) · async-save→refs. *(Live round-trip still gated on Supabase deploy.)*
- **3D material:** polish/reflection/sheen leverage fix — gloss controls now move the render on the matte default while 0.5=identity keeps the matte north-star (Sebs signed off).

**Groundwork banked (not urgent):** 3D OFAT (197 obj) vision-read + fed → labeled fidelity dataset = the foundation the final personal-strokes ML trains on. 2D OFAT harness re-pointed to the REAL /desk DrawPanel (the /canvas-test-surface bug is fixed). See `RUNNING-TODO.md` R17–R25 for detail.

---

## ▶ THE SEQUENCE (Sebs 2026-06-24 — **B before A**: build the product whole, THEN one definitive design pass)

> **Order decision (Sebs):** features FIRST, design language SECOND. A design system built over a half-built feature set is a moving target (you'd restyle surfaces the new features then change). Build it whole → one comprehensive visual pass over the finished product. **Caveat:** build new features on the current scaffold *knowingly* and log every new surface in the **DESIGN-DEBT LIST** (below) so Phase A catches them all.

### Phase B — The big feature build-out · FIRST · the product gets whole
Recommended internal order: drawing-tool depth → physics → smart-layer + ML; backend deploy in parallel (Sebs's hands).
1. **Drawing-tool depth** (standing asks — start here: core creative surface + unblocks the 2d-draw OFAT) — MORE primitives/shapes · select + edit ANY part of a drawing (not just last-drawn) · FULL draw tools on the 3D/`canvas` route (brush·fill·snap·shade·primitives in one place) · open-shape shading.
2. **Physics / living desk** — wire **cannon-es** (installed, 0 refs): objects settle / collide / jiggle. Then **SMART physics presets** (classifier picks per-object behavior — ball bounces, paper flutters, mug sits heavy) = smart-layer Phase E. cannon-es ONLY (Rapier WASM races Make).
3. **Smart-layer completion** — Phase C full auto-pick (system picks treatment per region end-to-end) · Phase D engine-routing (2D→3D, half-built) · Phase F cross-axis cascade (one change ripples across render+3D+physics).
4. **Real ML go-live** — train a REAL model on `datasets/smart-layer.dataset.jsonl` (region classifier → treatment); real train/eval/inference, wired live, honestly labeled (`feedback_actual_ml_not_fake`). Today the "smart system" is a rule engine; this makes it real.
5. **Backend deployed** 🧑‍💻 — **THE LAST Phase-B step, immediately before the Phase A refresh** (Sebs 2026-06-24: "the last thing we do before refresh is all the db stuff — I never uploaded it"). Still NOT deployed. When we get here, Claude hands Sebs the exact commands; Sebs runs them (needs his auth): `supabase db push` (mesh_cache + migrations) + deploy `image-to-3d` / `image-to-svg` edge fns (`--no-verify-jwt`) + confirm `QUIVERAI_API_KEY`/`FAL_KEY`. Unblocks D1, drag-follower, save-routing, mesh-cache verification — so it lands right before the design pass that needs those surfaces live.

### Phase A — Visual redesign / own design language · SECOND · eyes-on, design-led
One comprehensive pass over the COMPLETE product. Research-first, concept-before-pixels (`feedback_ground_up_means_concept_not_just_layout`, `feedback_no_cheap_polish`, `project_desk_doodles_own_design_language`). Decisions through main chat.
1. **Visual-state audit** — capture every real surface as-is (now including all Phase-B additions); mark genuine identity vs leftover portfolio-token scaffold; fold in the DESIGN-DEBT LIST.
2. **Concept directions** — 2–3 distinct design-language directions (what it should *feel* like) for Sebs to react to before any code.
3. **Own visual + motion system** — tokens, type, color, motion (Emil-grade) derived for Desk Doodles, not the portfolio scaffold.
4. **Homepage** — remove the @handle chip; re-derive the entry "doors" (Start a doodle / Browse the wall / Your space / Try the engine) with real hierarchy.
5. **Apply across every surface** — clears its own new typography/spacing/color/motion locks; no card-in-card; reads as Desk Doodles.

### Phase C — Train it on HIS OWN strokes · THE FINALE
The last thing. Personal sketching hand as a learned style (`project_hero_8_personal_sketch_style`). The OFAT/audit dataset + a capture of Sebs's real strokes feed this. Only meaningful once Phase B's ML pipeline is real.

### DESIGN-DEBT LIST (new surfaces built on scaffold during Phase B — revisit in Phase A)
*(append every new/changed surface here as Phase B builds, so the design pass catches all of them)*
- _(none yet)_

---

## Ongoing / low-urgency
- **OFAT dataset continuation** — full real-/desk-surface 2D OFAT (needs deterministic wobble seed first) + 2d-draw source (gated on drawing-tool depth). Lowest urgency: it's groundwork for Phase C's ML, no deadline. Don't over-intensify.
- **Keep feeding the dataset** from every audit/sweep/pick (`feedback_keep_feeding_smart_ml`).
- **Make sync** (if still maintaining the Make deployment) — Make-relevant changed files → the update folder; local-only tools stay out.

## How to run it
- Burn down `RUNNING-TODO.md`, one item at a time, each **live-verified on the REAL `/desk` surface** at `:5182` with before/after (`feedback_live_check_not_headless_harness`). The /canvas-test-surface lesson: verify on the real product flow, never a test harness surface.
- Design decisions → main chat (prose, not menus — `feedback_prose_not_structured_questions`).
- Parallelize read-only verification with agent fleets; edits to existing files stay in the MAIN LOOP.

**Recommended first move:** Phase B.1 — **drawing-tool depth**. It's the core creative surface, a standing ask, and it unblocks the 2d-draw OFAT. (Physics is the alternative if you want the early "wow" beat.) Log each new surface in the DESIGN-DEBT LIST as you go.
