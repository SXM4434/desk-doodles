# Session Handoff — 2026-06-13 (Round 8 air-tight LOOP in progress)

**Per CLAUDE.md handoff rule:** short, current, action-oriented; historical detail lives in git log + locked docs.

## Where we are: ROUND 8 — the air-tight convergence LOOP
Goal: app + drawing + 2D + 3D all air-tight via the audit→fix→re-audit LOOP (multiple iterations until clean), THEN pause for **Make checkpoint #2**, then **R9**. Today's stretch goal: reach R11. The LOOP is crucial — memory `feedback_the_convergence_loop_is_crucial`.

## ⚔️ THE LOOP'S MINDSET — actively TRY TO BREAK IT (Sebs, emphatic)
The debug/test/edge-case loop is ADVERSARIAL: don't just verify the catalog renders — think "how do I break this?" and do it. That's how every live bug surfaced (Sebs drawing weird things). Each loop pass must HUNT breaks:
- **Weird/made-up/arbitrary drawings** (not just the 197 catalog — the catalog is a proxy; real users draw the unseen) + replicate shapes through the live draw TOOLS (brush/fill/snap).
- **Degenerate/extreme inputs:** tiny/huge/canvas-spanning/off-canvas/elongated/overlapping/rapid strokes; open vs closed vs almost-closed regions; empty.
- **Toggle extremes:** every toggle LOW/MID/HIGH, sliders to the rails, one-factor-at-a-time vs Clean.
- **Unexpected sequences:** draw→undo→redraw, flip SKETCH↔STYLE mid-gesture, drag-before-publish, place→move, re-draw, restyle, cancel/back at each stage, brush-over-fill, darker-over-lighter.
- Every break found → document + online-research the fix + fix + re-loop.

## Live-found bugs (Sebs's examples of the bug-class — docs/submission/WEIRD-INPUT-CASES.md)
- CASE-1: 3D Solid splits a multi-feature face into separate puffy pieces (disconnected features → separate masses) — bas-relief rework evaluates.
- CASE-2: RE-DRAW shows original strokes zoomed/cropped (not fit to canvas) — stroke-fit bug. NOT yet fixed.
- CASE-3: elongated drawing shifts out of view on SKETCH→STYLE flip — 2D style viewBox alignment. NOT yet fixed.
- fill gap-edge must be clean + smooth (not ragged/blobby). Partially (crisp + max-res); verify smoothness.

## Committed this session (og-image-baseline)
RC-1..5 (ace3151/eb99f7c/d16c788/4dba28a/b2bda13) · knockout (67db840) · dark-enclosing (fd8a5f3) · fill-crisp (1ff29e5) · **FIX-FLEET 7 lanes merged:** svgUpload freeze+truncation (57a0359) · shapeFit rect+star+arrow (a766ce2) · desk move→disappear+drag-queue+Fit-to-content (c6b087e) · toneMask brush-carve · risograph darkness-aware · ObjectCard drawer marks · DrawSurface ink-over-tone+full-fill+snap-any-stroke+upload-fit · **drawingTexture.ts** bas-relief helper (8d69d19).

## ⚙️ CONCURRENCY ZONE MAP (5 parallel worktree agents + main loop — 2026-06-13)
Main loop = the safety controller. Lanes (file-ownership) so merges stay clean:
- **MAIN LOOP (me) — svg-port 3D**: `canvas3d/Stroke3DScene.tsx` · `canvas3d/drawingTexture.ts` · `canvas3d/hatchMaterial.ts` · `DeskDoodlesCanvas.tsx`. (svg-port WIP UNCOMMITTED in live tree.)
- **Agent a5faecfd (CASE-2 redraw + fill-smooth)**: `DrawSurface.tsx` · `lib/toneMask.ts` · `lib/draw/*`.
- **Agent a2a70592 (CASE-3 elongated-shift)**: `canvas/SvgStyleTransform.tsx` bbox/viewBox ONLY (NOT the new onRender seam I added).
- **Agent af1ef603 (personal-space MVP)**: NEW files + `supabase/migrations/*` (NOT applied) + minimal `DeskPage.tsx` hook.
- **Agent aadc3aed (card export SVG/PNG + author field)**: card detail modal (ObjectCard/ObjectSurface) + doodle type + new export util.
- **Agent a5efbbb8 (image-mode)**: `lib/imageToSvg.ts` + `supabase/functions/image-to-svg/*` + docs.
WATCH ON MERGE: SvgStyleTransform (my onRender vs B's bbox — diff fns) · DeskPage (C vs maybe D) · DrawSurface/DrawPanel (A vs E). All worktrees branch from current HEAD (3ed6924) — NOT stale. All DB-SAFE (no live Supabase writes; migrations/Edge-fns are artifacts only).

## IN FLIGHT (process on landing)
- **2D-systemic fix agent IN-TREE** (`a3bca4f1dea2922a2`, editing live `SvgStyleTransform.tsx`): 4 root causes — A multi-region fill (DONE: dominoTiles shows all 3 tiles) · B nested-hole knockouts · C dark-region-outline-only · D riso nested-white. **On landing: review + verify each paired-vs-Clean (dominoTiles 3 tiles · flagPanel dark canton · collectorTin emblem white · boxedGameCartridge label white, no ampCombo/cardBinder regression) + tsc/build (tree COLD only) + commit.** ⚠️ tree is HOT while it runs — NO build/render until it lands.
- (killed) worktree 2D agent `a52326d9` (stale-base dup) + bas-relief integration agent (already merged c33c7d5).
- Worktree to harvest (R10): image-mode (`agent-ad1dd831d13817ddc`) — imageToSvg.ts + Edge fn; **best-quality = Quiver Arrow + SIMPLER-SKETCH output**.

## ✅ 2D systemic fix COMMITTED + verified (3ed6924)
Root causes A (group-transform preservation) + B/D (riso paper-occlusion knockout) fixed in SvgStyleTransform.tsx; C was a no-op confirm. tsc+build green. Verified by MY OWN paired-vs-Clean read of 4 fixed objects + 8 named regression controls × 11 styles (`/tmp/dd-2d-verify/`, tool `tools/2d/_verify-paired-r8.mjs`). dominoTiles 3 tiles ✓ · lacroixRack pyramid ✓ · collectorTin emblem knockout ✓ · boxedGameCartridge label ✓ · flagPanel dark canton legible ✓ · no regressions.

## SVG-PORT 3D — THE BIG ONE (Sebs: fully-3D transformation + RETAIN the SVG vibe, NOT lazy)
**Two hard parts (both required):** (1) FULLY 3D — marks carved INTO/part of the 3D surface, wrap on orbit, catch light; NOT a flat decal/overlay "plopped on top". (2) RETAIN the 2D SVG feel/look/vibe (hand-drawn hachure/ink character); NOT deadened to photo-on-plastic.
**BEFORE-baseline CONFIRMED with real renders** (`/tmp/dd-svgport-baseline/svgport-before-paired.png` + cells; tool `tools/3d/_svgport-baseline-paired.mjs`): current svg-port = a **uniform diagonal-hachure-filled slab + faint outline**, the actual drawing is COMPLETELY ABSENT (generic screen-space lambert-hatch on the silhouette, blackFrac≈0.06). Carries neither the drawing nor the vibe. ROOT: `hatchMaterial.ts` is the forbidden parallel GLSL shader (original locked design `project_f3_shading_port_to_3d` said USE the real SvgStyleTransform, "no parallel R3F shader rewrite").
**Direction (locked):** rasterize the REAL `SvgStyleTransform` render (exact vibe, no reimpl) → color `map` (ink) + height (emboss/DISPLACEMENT, real carved geometry needs a tessellated cap) → surface-locked on the form. SvgStyleTransform needs live DOM (getBBox) → rasterize from its rendered <svg> (offscreen mount or transform-fn), NOT renderToStaticMarkup.
**⚠️ SHADING INTERACTION = the crux (Sebs flagged):** 2D shading is region-based source-darkness (I-2) baked as content; the 3D rig adds a SECOND lambert tone → risk of DOUBLE-SHADING (drawing-dark × form-shadow = muddy) or rig WASHING OUT the 2D tone. RESOLUTION: separate tone from dimensionality — drawing's marks/tone ride EMISSIVE/unlit (2D shading preserved exactly, never re-shaded); dimensionality only from light on the carved RELIEF (light moves surface micro-shading, not the drawing's values); subtle lit component on the paper substrate for volume. Same ink-black/light-driven principle as bas-relief, extended so the drawing's own tone is the emissive layer. Emissive↔lit balance = eyeball tuning. FIRST-CLASS spec requirement.
**RESEARCH FLEET RUNNING** (`wf_c8f5dd91-d47`, 5 angles → synthesis spec): real-relief/tessellation · retain-NPR-vibe-on-lit-3D · surface-locked-wrap · three.js SVG→texture pipeline · prior-art drawing→relief. On landing: synthesize → implement → re-capture "after" in the SAME paired format (svg-port ‖ 2D-style ‖ Clean, per Sebs) → LOOP → show before/after.

## NEXT in the R8 loop (not done)
fix CASE-2/3 + fill-smooth · per-toggle LMH audit (2D sliders + 3D rod/extrude/inflate/solid props) · **3D svg-port vs its 2D SVG style** (must match the style, not just Clean) · draw-mode object test (197 + weird inputs through the LIVE tools) · LOOP until clean N passes → certify → golden-v3 bless gate.

## Rounds
R8 (air-tight loop) → **Make checkpoint #2** (Make assistant clean-overwrites same-named src files; I prep the file list) → **R9** (3D into desk: 2D↔3D flip+orbit on placed object [demo climax] + personal space: private desk owner_id + per-person drawer + onboarding handle — MVP) → **R10** (ML go-live + shading-fill + image-mode [Quiver, sketch-simplify] + HARD-3D [fal/Tripo hardPath.ts, gated on credits]) → **R11** (3D symmetry-law completeness + polish) → R12 (identity + submission assets) → R13 submit (06-18).

## Sebs-side pending
golden-v3 bless (after I certify air-tight) · fal/Tripo credits → Supabase secrets · Figma Community profile · (Supabase realtime already ON for doodles+desks).
