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

## IN FLIGHT (process on landing)
- **Audit fleet iter-1** (`wf_7339974f-fe4`): 33 Clean-paired sheets (2D styles + 3D geomode) OFAT vs Clean + research → fix → LOOP.
- **Bas-relief integration agent** (`a45e6d6467521da84`, worktree): applies drawingTexture as `bumpMap` on Solid/Extrude, REMOVES the lazy face-ink overlay, VERIFIES with full-res screenshots (/tmp/dd-relief-verify/) → review + merge if premium.
- Worktree to harvest (R10): image-mode (`agent-ad1dd831d13817ddc`) — imageToSvg.ts + Edge fn; **best-quality = Quiver Arrow + SIMPLER-SKETCH output**.

## NEXT in the R8 loop (not done)
fix CASE-2/3 + fill-smooth · per-toggle LMH audit (2D sliders + 3D rod/extrude/inflate/solid props) · **3D svg-port vs its 2D SVG style** (must match the style, not just Clean) · draw-mode object test (197 + weird inputs through the LIVE tools) · LOOP until clean N passes → certify → golden-v3 bless gate.

## Rounds
R8 (air-tight loop) → **Make checkpoint #2** (Make assistant clean-overwrites same-named src files; I prep the file list) → **R9** (3D into desk: 2D↔3D flip+orbit on placed object [demo climax] + personal space: private desk owner_id + per-person drawer + onboarding handle — MVP) → **R10** (ML go-live + shading-fill + image-mode [Quiver, sketch-simplify] + HARD-3D [fal/Tripo hardPath.ts, gated on credits]) → **R11** (3D symmetry-law completeness + polish) → R12 (identity + submission assets) → R13 submit (06-18).

## Sebs-side pending
golden-v3 bless (after I certify air-tight) · fal/Tripo credits → Supabase secrets · Figma Community profile · (Supabase realtime already ON for doodles+desks).
