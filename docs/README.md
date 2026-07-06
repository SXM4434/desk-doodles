# Desk Doodles — Master Guide

**Click and see everything we have and what each piece does.** This is the table of contents for the whole project: skills, knowledge docs, design specs, submission docs, process docs, tools, and the key source areas. One short sentence each. All links are relative — click through.

> ConFigMakeathon submission · deadline **2026-06-18 11:59 PM PDT** · winners June 23 at Config. The product: a multi-mode canvas where you draw or upload, restyle with a real hand-drawn engine, flip between 2D and 3D, and leave it on a live shared desk. The wedge: **your hand survives the round-trip.**

---

## Start here (read order)

1. [`../CLAUDE.md`](../CLAUDE.md) — project anchor + locked working rules + repo map (one level up).
2. [`../SESSION-HANDOFF.md`](../SESSION-HANDOFF.md) — current state, round ledger, next move (read after CLAUDE.md every session).
3. [BUILD-TEST-FLOW.md](BUILD-TEST-FLOW.md) — how we build and test (the gauntlet every rock obeys).
4. [memory/project_desk_doodles_makeathon.md](memory/project_desk_doodles_makeathon.md) — scope, deadline, app architecture (the project memory).
5. [locked-refs/F3-smart-hachure-system/09-LOCKED-MODEL.md](locked-refs/F3-smart-hachure-system/09-LOCKED-MODEL.md) — the Smart Hachure contract (I-1..I-14, sacred).
6. [knowledge/00-INDEX.md](knowledge/00-INDEX.md) — the systems knowledge base (everything the app does, explained).

New to the codebase? Read 1→4 for orientation, then [knowledge/00-INDEX.md](knowledge/00-INDEX.md) front to back. Touching 3D? Add [memory/project_f3_shading_port_to_3d.md](memory/project_f3_shading_port_to_3d.md) + [research/21-research-3d-pipeline-and-style-translation.md](research/21-research-3d-pipeline-and-style-translation.md).

---

## Skills

- [SKILLS.md](SKILLS.md) — index of the project's reusable skills/playbooks (authored by the skills pass; the entry point for "how do I do X here").

---

## Knowledge docs (00–16) — the systems knowledge base

Personal systems-knowledge base. Every page follows one structure: **In one sentence / Plain language / Design / Technical / Connections / Honest status** (the honest-status sections are the trust anchor — they say what exists vs. what is planned). Live in [knowledge/](knowledge/).

| # | Page | What it is |
|---|------|------------|
| 00 | [00-INDEX.md](knowledge/00-INDEX.md) | The index + reading order for the knowledge base. |
| 01 | [01-what-is-desk-doodles.md](knowledge/01-what-is-desk-doodles.md) | The product, the "your hand survives the round-trip" wedge, the three fidelity poles, and an exists-vs-planned ledger. |
| 02 | [02-pipeline-of-a-doodle.md](knowledge/02-pipeline-of-a-doodle.md) | One doodle end-to-end: pointer events → freehand preview → Done swap → hand-feel pipeline → Smart Hachure classify-and-replace. |
| 03 | [03-the-smart-system.md](knowledge/03-the-smart-system.md) | The rule-engine brain: signals → classify → treatment → render, a 16-rule voting engine deciding per-region shading. |
| 04 | [04-the-ml-layer.md](knowledge/04-the-ml-layer.md) | What a real trained model would mean: the audit catalog as labeled dataset, with an honest "no model exists yet" ledger. |
| 05 | [05-the-interconnection-graph.md](knowledge/05-the-interconnection-graph.md) | How toggles, clusters, and signals form a bidirectional graph where every influence edge is declared and enforced. |
| 06 | [06-tone-and-shading.md](knowledge/06-tone-and-shading.md) | Tone is the currency: every fill collapses to one darkness number; Murray-Davies/Beer-Lambert math spends it per grammar. |
| 07 | [07-the-3d-pipeline.md](knowledge/07-the-3d-pipeline.md) | Flat doodle to 3D and back: easy path (Rod/Extrude) or hard path (vision router → Tripo/TRELLIS) + screen-space hatching. |
| 08 | [08-the-stack.md](knowledge/08-the-stack.md) | Every package and its single job, filtered through "does it survive Figma Make?". |
| 09 | [09-systems-thinking.md](knowledge/09-systems-thinking.md) | The operating philosophy: one decision engine, invariants as load-bearing walls, cite-the-contract anti-drift. |
| 10 | [10-glossary.md](knowledge/10-glossary.md) | The vocabulary: three translation tables mapping each load-bearing word to its plain meaning + the file/line where it lives. |
| 11 | [11-the-pen-model.md](knowledge/11-the-pen-model.md) | "The panel is your pen, the popup is the object, Global is a lens" (D-7): objects are records frozen at Done. |
| 12 | [12-the-creation-loop.md](knowledge/12-the-creation-loop.md) | Draw → Sketch\|Style clean swap → name (the minting moment) → place → re-draw; stroke retention is the keystone. |
| 13 | [13-the-3d-system.md](knowledge/13-the-3d-system.md) | Geometry modes (Rod/Extrude/Inflate/Solid + AI) under the chrome-split rule; ink-black material policy; conversion brain. |
| 14 | [14-the-social-desk.md](knowledge/14-the-social-desk.md) | The shared layer: capped multi-desk + auto-spawn + gallery mini-desks; the drawer as a passive cross-desk index. |
| 15 | [15-the-smart-ml-ladder.md](knowledge/15-the-smart-ml-ladder.md) | The dated build sequence: what runs now, what's scheduled, the post-makeathon trained-model ladder. |
| 16 | [16-shading-fill-and-shape-assist.md](knowledge/16-shading-fill-and-shape-assist.md) | The input-tool system: "the ink without the ink outline" — regions derived from ink, Brush/Fill/Lasso, Snap/Straighten. |

---

## Design specs — build-ready contracts

How each system is meant to work, decided before (or alongside) the code. Live in [design/](design/).

- [smart-system-build-plan.md](design/smart-system-build-plan.md) — the smart-system architecture + phased build plan (Rock H).
- [smart-system-gaps.md](design/smart-system-gaps.md) — gap audit: what the smart-system plans miss now that conversion/3D exist.
- [conversion-semantics-spec.md](design/conversion-semantics-spec.md) — per-region 2D→3D meaning (Phase D2): how a drawing decides its 3D form.
- [conversion-semantics-addendum.md](design/conversion-semantics-addendum.md) — closes the three holes the spec left: region formation, shading lifecycle, hard path; the "two register brains" frame.
- [mark-intent-boundary-spec.md](design/mark-intent-boundary-spec.md) — shading vs. fill vs. structure for the DRAWN register (the geometry brain).
- [region-fill-spec.md](design/region-fill-spec.md) — bucket · smart-highlight · lasso fill tools (R1).
- [shade-brush-behavior-spec.md](design/shade-brush-behavior-spec.md) — the shade brush's fill-feel behavior, marker-model accumulation (R2).
- [shape-assist-spec.md](design/shape-assist-spec.md) — recognition, snap, straighten, and the honest scope line (R3).
- [shading-axes-architecture.md](design/shading-axes-architecture.md) — per-style shading axes + audit parity (R4).
- [3d-mode-controls-spec.md](design/3d-mode-controls-spec.md) — per-mode 3D parameter taxonomy (Rod/Extrude/Inflate/Solid), grounded in Free Stroke.
- [3d-roundtrip-build-plan.md](design/3d-roundtrip-build-plan.md) — the easy-path 3D build plan: Rod + Extrude + screen-space hatch NPR.
- [global-toggles-and-mixed-3d.md](design/global-toggles-and-mixed-3d.md) — the D-7 control model: Pen\|Desk gate, Global ON = uniform lens, mixed-treatment desk semantics. **Read before touching desk controls.**
- [object-model-and-desk-architecture.md](design/object-model-and-desk-architecture.md) — object = rich record, one-surface-3-modes, multi-desk caps, naming-as-ML-label.
- [vision-router-spec.md](design/vision-router-spec.md) — the vision-LLM router that analyzes a drawing and routes it to the right 3D generator (hard path).
- [demo-video-plan.md](design/demo-video-plan.md) — the demo-video plan (M13): the slider moment IS the wedge shot.
- [submission-checklist.md](design/submission-checklist.md) — submission + positioning checklist with verified official requirements + countdown.

---

## Submission docs — the makeathon entry

Rules, eligibility, positioning, gaps. Live in [submission/](submission/).

- [makeathon-rules-VERBATIM.md](submission/makeathon-rules-VERBATIM.md) — **source of truth** for the official rules (Sebs's verbatim paste; if anything conflicts, this wins).
- [makeathon-rules-and-framing.md](submission/makeathon-rules-and-framing.md) — the rules + honest eligibility verdict + judge-ready Make-framing sentences.
- [prize-positioning.md](submission/prize-positioning.md) — per-prize odds, the single demo beat that wins each, and which prizes to optimize around.
- [submission-gap-audit.md](submission/submission-gap-audit.md) — read-only submission-readiness audit: what's missing to qualify.
- [test-coverage-gap-map.md](submission/test-coverage-gap-map.md) — code surface × existing harnesses: where test coverage has holes.
- [parallelizable-backlog.md](submission/parallelizable-backlog.md) — work-discovery scout: candidate tasks that can run in parallel, each verified against source.
- [the-story.md](submission/the-story.md) — the narrative/story doc for the submission (in flight — being authored by the story pass).
- [social-post-draft.md](submission/social-post-draft.md) — the #ConfigMakeathon social-post draft (in flight — being authored by the story pass).

---

## 2026-06-18 code-quality + render pass docs

The map of the docs made during the local debugging / optimization / architecture pass Sebs kicked off 2026-06-18. They cross-link tightly: the **issue log** feeds the **render plan**, both roll up into the **bug index**, the bug index points at the **proven-algorithm library** and the **perf playbook**, and the two new **skills** are the on-ramps. Read them in roughly this order when working a render/lag/architecture problem.

| Doc | What it's for | When to read it |
|---|---|---|
| [CODE-QUALITY-PASS.md](submission/CODE-QUALITY-PASS.md) | Running issue log + method reminders for the pass; Sebs's recorded bug list, the suspected architecture debt (stale-state, unnecessary `useEffect`), and the lag-pass notes. | The append-as-you-go backlog — read/update first when working the pass. |
| [DESK-RENDER-FIXES-PLAN.md](submission/DESK-RENDER-FIXES-PLAN.md) | The diagnosed, ordered fix plan for the desk-canvas zoom/pan/3D-streaming bugs (B1–B5), with the world↔screen math and `file:line`. | Before touching `DeskPage.tsx` culling/pan/3D-stream — this is the authority the bug index summarizes. |
| [ALL-BUGS-AND-FIXES.md](submission/ALL-BUGS-AND-FIXES.md) | **The master bug INDEX** — what's broken, why, the recommended fix, where the proven solution lives, status, per subsystem. Doesn't re-paste algorithms; folds in the render plan + perf playbook by reference. | FIRST stop for ANY bug — check if it's already diagnosed before re-diagnosing. |
| [KNOWN-SOLUTIONS.md](submission/KNOWN-SOLUTIONS.md) + [KNOWN-SOLUTIONS-PART2.md](submission/KNOWN-SOLUTIONS-PART2.md) | **The proven-algorithm library** — citable, ready-to-execute fixes (region fill, even-odd holes, 3D relief/inflation, clean silhouette, recognition+gap-close, NPR/smart-ML, many-objects-in-3D, image-upload/AI-mesh). | When a bug-index row says `→ KS §X` — read that section for the *how*. |
| [OPTIMIZATION-ANTI-LAG.md](submission/OPTIMIZATION-ANTI-LAG.md) | The performance playbook: measure-first profiling, quick-wins-vs-deep-dives, the brand-law guardrail (speed without softening the ink-black pencil look), the ranked levers + verifiable sources. | When the desk feels laggy / janky — profile before patching. |
| `.claude/skills/desk-doodles-bug-index/SKILL.md` | Skill: teaches "consult the bug index + known-solutions FIRST before re-diagnosing"; how the two docs relate + the standing diagnose/live-verify/regress discipline. | Auto-fires when debugging — the on-ramp into the index + library. |
| `.claude/skills/desk-doodles-perf/SKILL.md` | Skill: the measure-first procedure + ranked levers + brand guardrail distilled from the anti-lag playbook. | Auto-fires on "the desk lags / optimize / speed up 3D". |

---

## Process docs — how we work

- [BUILD-TEST-FLOW.md](BUILD-TEST-FLOW.md) — the build-test gauntlet: the five non-negotiables, the rock structure, fleet orchestration, the LAWS block baked into every agent prompt.
- [PENDING-AUTOFIRE-QUEUE.md](PENDING-AUTOFIRE-QUEUE.md) — work blocked on something running, tracked so it auto-fires the moment its blocker clears; includes the active-edit collision map.

---

## Tools / harnesses — `tools/**`

Headless correctness harnesses + browser sweep drivers + golden gates. NOT part of the app bundle; repo-only. Most browser harnesses come as a trio: `.html` (mount), `-harness.tsx` (the React render rig), `.mjs` (the playwright driver + pixel analysis + contact sheets). Run with dev or an isolated `vite preview` per BUILD-TEST-FLOW.

- [`tools/classifier/`](../tools/classifier/) — the classifier regression gate: golden-snapshot / golden-diff (THE gate) / reliability(ECE) / ambiguity-queue. See [its README](../tools/classifier/README.md).
- `tools/2d/` — the 197-shape × 11-style 2D audit-style sweep harness (`audit-style-sweep.*`).
- `tools/3d/` — geometry + conversion correctness: `strokeTo3d-smoke`, `mark-intent-battery` (+ golden), `material-battery`, `tier2-board`, `arrow-rule-board`, `catalog-geometry-sweep`, `gapcell-battery`, `envmap-adversary`, `geometry-gauntlet`, `inflate-preview`.
- `tools/draw/` — `shape-fit-battery.mjs`: the shape-assist (snap/straighten) correctness battery.
- `tools/gapmap/` — submission-readiness probes: `route-sweep`, `interaction-probe`, `conversion-probe`, `states-probe`.
- `tools/modext/` — modifier-extreme break-hunt harness (sliders at their limits).
- `tools/rockb/` — Rock B resilience battery (panel boundaries, degrade-to-raw, realtime delete/update).
- `tools/rockf1/` · `tools/rockf2/` — shade-brush (F1) + fill/lasso (F2) batteries.
- `tools/rocky/` — Rock Y wireframe-schematic battery (+ before/after diff dirs).
- [`tools/desk-cleanup.mjs`](../tools/desk-cleanup.mjs) — one-off live-desk cleanup script (stray-doodle wipe; use with care, it touches the DB).

---

## Key source areas — `src/**`

What each main component/lib does. Full repo map is in [`../CLAUDE.md`](../CLAUDE.md). App routes: `/` home · `/desk` the real product flow · `/desks` the gallery · `/canvas` draw-primitive test surface · `/playground` testing bed · `/audit` the 197-shape catalog · `/public` placeholder.

**Pages / surfaces** — `src/app/components/DeskDoodles/`
- `DeskPage.tsx` — `/desk`, the real product: desk canvas, pan/zoom, drag/place, realtime, the right pen panel.
- `DeskGallery.tsx` — `/desks`, the wall of walls: desk cards with live mini-desk previews.
- `DrawPanel.tsx` — the draw popup (modal): Draw/Upload, Sketch\|Style, naming/minting stage; one object per Done.
- `DrawSurface.tsx` — the raw drawing primitive: pointer capture, perfect-freehand preview, Ink\|Shade registers, tone fills.
- `ObjectSurface.tsx` — the morphing Create/Edit/Sandbox object popup (one surface, three modes).
- `ObjectCard.tsx` — the collectible read-view of one doodle record (TCG-frame card + mini variant).
- `DrawerPanel.tsx` — the passive cross-desk index: your doodles as mini cards, drag-to-place + click-to-open.
- `DeskDoodlesAudit.tsx` — `/audit`, the 197-shape verification matrix (THE render + smart-layer dataset).
- `DeskDoodlesHome.tsx` · `DeskDoodlesCanvas.tsx` · `DeskDoodlesPlayground.tsx` · `DeskDoodlesPublicCanvas.tsx` — home · `/canvas` test surface · `/playground` test bed · `/public` placeholder.

**2D render engine** — `src/app/components/canvas/`
- `SvgStyleTransform.tsx` — the main render component: the whole hand-feel style pipeline (RDP, wobble, multi-stroke, pen tips, endpoint behavior) + Smart Hachure entry.

**3D render** — `src/app/components/canvas3d/`
- `Stroke3DScene.tsx` — the R3F scene: studio rig + materials + geometry mount; renders strokes as 3D.
- `hatchMaterial.ts` · `materials3d.ts` — screen-space hatch material (uniforms from Shading sliders) + the ink-black native material presets.
- `modeParams.ts` · `rodAdornments.ts` — per-mode parameter defaults + rod cap/joint placement (one source for scene + harness).

**Chrome / controls** — `src/app/components/chrome/`
- `SmartHachureChrome.tsx` · `modifierSpecs.ts` — the 2D right panel (the ~13 styling axes) + the per-style modifier spec tables.
- `Canvas3DChrome.tsx` — the 3D-mode right panel (the round-7 chrome split): 3D Style + per-geometry params.
- `Dropdown.tsx` · `Slider.tsx` · `CollapsiblePanel.tsx` · `PanelBoundary.tsx` — shared pill dropdown · slider · collapse system · per-panel error isolation.

**Smart Hachure (the shading engine)** — `src/app/lib/smartHachure/`
- `index.ts` — the engine entry (classify-and-replace; narrow fillStyle override). `classifier.ts` — the 16-rule region voting engine. `signals.ts` — per-region structural signals. `techniqueMap.ts` — role → shading grammar. `renderRegion.ts` — draws one region's marks. `overrideStore.ts` — palette/override injection. `types.ts` — shared types.

**Smart layer (shared brains)** — `src/app/lib/smart/`
- `coverage.ts` — the 8-band darkness→coverage table (one math, two renderers). `conversionMap.ts` — 2D→3D treatment vocabulary + ConversionReceipt contract + decision-log host. `smartPick.ts` — auto-pick conversion choices from input signals.

**3D geometry** — `src/app/lib/geometry3d/`
- `strokeTo3d.ts` — strokes → Rod/Extrude/Inflate/Solid geometry (closure detection, engine options). `markIntent.ts` — geometry-register rules (structure vs. shading-gesture vs. fill-intent). `convert.ts` — the orchestrator: `convertStrokePool` → units + receipts + analysis.

**Drawing helpers** — `src/app/lib/draw/`
- `shapeFit.ts` — shape recognition + snap/straighten geometry (the shape-assist engine).

**Catalog + other libs** — `src/app/lib/`
- `items/PegToolShape.tsx` · `items/PinShape.tsx` · `items/identitySet.ts` — the 197-shape audit catalog + pin shapes + identity set.
- `toneMask.ts` · `shadeFillLog.ts` — the tone band grid (marker-model stamping + pool-raster extraction) + the shade-fill decision log.
- `publish.ts` · `supabase.ts` · `session.ts` — desk-aware Supabase API (desks/doodles/realtime) + client + anonymous session id.
- `svgUpload.ts` · `normalizeInput.ts` · `contentHash.ts` — SVG sanitize/size + auto-resize to canonical size + SHA-1 cache keys.
- `f3HandFeel.ts` · `handFeel.ts` — the hand-feel primitives the render pipeline composes.
- `deskCraft.ts` · `deskNames.ts` · `typography.ts` · `chromeStyles.ts` — paper grain/craft constants · desk-name generator · type ladder · shared pill/CTA constants.
- `patchRoughDots.ts` — runtime rough.js dot-determinism patch (Make-safe, lives in our bundle).

**State** — `src/app/state/`
- `F3RoughModifiersContext.tsx` · `F3SvgStyleContext.tsx` · `Canvas3DContext.tsx` · `DirectionModeContext.tsx` — the modifier values · current SVG style · 3D params · light/dark direction contexts.

**Database** — `supabase/`
- `schema.sql` then `schema-v2-desks.sql` → `schema-v3-rls.sql` → `schema-v4-config.sql` → `schema-v5-redraw.sql` — the schema evolution (run in order); plus `harden-v1.sql` (security), `seed-test-desks.sql`, `fix-object-counts.sql`.

---

## Locked references — `locked-refs/**` (read-only mirrors)

The contracts Desk Doodles depends on, mirrored from the portfolio repo (source of truth `~/Desktop/Projects/portfolio/`). **Don't edit these here** — change them at the source, then re-mirror.

**The Smart Hachure engine** — [locked-refs/F3-smart-hachure-system/](locked-refs/F3-smart-hachure-system/)
- [09-LOCKED-MODEL.md](locked-refs/F3-smart-hachure-system/09-LOCKED-MODEL.md) — **THE CONTRACT** (I-1..I-14 invariants). Read first; cite for every change.
- [makeathon-plan.md](locked-refs/F3-smart-hachure-system/makeathon-plan.md) — the 14-day plan, MVP vs. stretch ladders, §8.6 Smart Rendering System.
- [18-scope-audit.md](locked-refs/F3-smart-hachure-system/18-scope-audit.md) — what's in/out of scope + the 9 locked D-decisions + the edge-case policy table.
- [19-research-cross-axis-interconnection.md](locked-refs/F3-smart-hachure-system/19-research-cross-axis-interconnection.md) — the 5-cluster taxonomy + pairwise + N-way interaction matrix.
- [20-research-figma-make-capabilities.md](locked-refs/F3-smart-hachure-system/20-research-figma-make-capabilities.md) — Make constraints per-dep (anchors why cannon-es not Rapier).
- [06-architecture-technical-core.md](locked-refs/F3-smart-hachure-system/06-architecture-technical-core.md) · [07-architecture-ml-pipeline.md](locked-refs/F3-smart-hachure-system/07-architecture-ml-pipeline.md) — technical core + the signals→classify→treatment pipeline (audit-as-dataset).
- [00-overview.md](locked-refs/F3-smart-hachure-system/00-overview.md) through [08-vision-roadmap.md](locked-refs/F3-smart-hachure-system/08-vision-roadmap.md) — the original cell research arc (tonal canon · libraries · structural signals · classifiers · perceptual math · vision roadmap).
- [phase-0-hero-lab-foundation.md](locked-refs/F3-smart-hachure-system/phase-0-hero-lab-foundation.md) — pre-fork foundation that landed in Hero-8-Lab before the split.

**Hero #8 siblings** — [locked-refs/F3-siblings/](locked-refs/F3-siblings/)
- [F3-shading-calibration-spec.md](locked-refs/F3-siblings/F3-shading-calibration-spec.md) — the per-modifier spec: math, ranges, defaults, bugs for every shading axis.
- [F3-toggle-architecture.md](locked-refs/F3-siblings/F3-toggle-architecture.md) — the 7-axis toggle taxonomy + 3D Path 1 style options + rotation-stability research.
- [F3-A-desk-horizontal-band.md](locked-refs/F3-siblings/F3-A-desk-horizontal-band.md) · [F3-B-desk-vertical-column.md](locked-refs/F3-siblings/F3-B-desk-vertical-column.md) — the two F3 layout families.
- [F3-subject-forms-research.md](locked-refs/F3-siblings/F3-subject-forms-research.md) · [F3-personal-sketch-style-research.md](locked-refs/F3-siblings/F3-personal-sketch-style-research.md) — object-form + personal sketch-style research.

**Locked system contracts** — [locked-refs/system/](locked-refs/system/)
- [color-system-w1.md](locked-refs/system/color-system-w1.md) — the W1 warm-paper token system Desk Doodles uses.
- [typography-system.md](locked-refs/system/typography-system.md) — the type ladder. [spacing-layout-rhythm.md](locked-refs/system/spacing-layout-rhythm.md) — the spacing tokens.
- [cross-system-rules.md](locked-refs/system/cross-system-rules.md) — how the systems compose. [north-star-filter.md](locked-refs/system/north-star-filter.md) — the design-judgment filter.
- [repo-architecture-and-doc-layers.md](locked-refs/system/repo-architecture-and-doc-layers.md) — what lives where.

---

## Research docs — `research/**`

Original research written during Desk Doodles work (real citations; not mirrored). Live in [research/](research/).

- [21-research-3d-pipeline-and-style-translation.md](research/21-research-3d-pipeline-and-style-translation.md) — the keystone 7-agent synthesis: 3D pipeline, style translation, fill-shading math, orchestration (55 citations).
- [22-research-simplification-toggle.md](research/22-research-simplification-toggle.md) — the simplification slider research (RDP ε, dispatch freeze, Cluster 0).
- [23-brief-suzanne3d.md](research/23-brief-suzanne3d.md) — competitive + relationship read on Suzanne (suzanne3d.studio); sharpens the three-pole wedge.
- [24-research-classifier-improvements.md](research/24-research-classifier-improvements.md) — the classifier-improvement research the smart-system plan executes.
- [25-research-own-design-language.md](research/25-research-own-design-language.md) — Desk Doodles' own design + motion language research (the Day 12-13 divergence pass).

---

## Memory mirrors — `memory/**` (read-only)

Cross-conversation memory entries that anchor decisions. **Read-only mirrors** — source of truth is `~/.claude/projects/-Users-sebs/memory/`; edits here propagate nowhere. Live in [memory/](memory/).

**Project state**
- [project_desk_doodles_makeathon.md](memory/project_desk_doodles_makeathon.md) — THE project memory: deadline, scope, app architecture, locked decisions.
- [project_desk_doodles_no_rapier_in_make.md](memory/project_desk_doodles_no_rapier_in_make.md) — why no Rapier WASM (cold-load race in Make).
- [project_desk_doodles_local_is_canonical.md](memory/project_desk_doodles_local_is_canonical.md) — local repo is source of truth; Make is deployment only.
- [project_desk_doodles_draw_panel_vs_desk_canvas.md](memory/project_desk_doodles_draw_panel_vs_desk_canvas.md) — the draw surface vs. desk canvas distinction.
- [project_smart_layer_foundation_via_audit.md](memory/project_smart_layer_foundation_via_audit.md) — `/audit` IS the smart-layer training dataset.
- [project_generalizable_rendering_decision_pattern.md](memory/project_generalizable_rendering_decision_pattern.md) — signals→classify→treatment is GENERAL; don't pre-build the meta-engine.
- [project_f3_shading_port_to_3d.md](memory/project_f3_shading_port_to_3d.md) — SVG and 3D have separate Style dropdowns; the SVG-port bridge.
- [project_f3_styles_must_all_be_real.md](memory/project_f3_styles_must_all_be_real.md) — no stub options; if a style is exposed it must be implemented.
- [project_f3_slider_recalibration_pending.md](memory/project_f3_slider_recalibration_pending.md) — the F3 sliders need a calibration pass.
- [project_free_stroke.md](memory/project_free_stroke.md) — the standalone Free Stroke creative tool (shared geometry engine).
- [project_hero_8_personal_sketch_style.md](memory/project_hero_8_personal_sketch_style.md) — Phase 4 personal sketch-style research.

**Process discipline (locked from prior incidents)**
- [feedback_smart_hachure_drift_pattern.md](memory/feedback_smart_hachure_drift_pattern.md) · [feedback_fillstyle_slider_must_switch_classifier_pick.md](memory/feedback_fillstyle_slider_must_switch_classifier_pick.md) · [feedback_more_toggle_options_better.md](memory/feedback_more_toggle_options_better.md) — Smart Hachure drift guards, narrow fillStyle override, granularity.
- [feedback_never_declare_fixed_without_regression_check.md](memory/feedback_never_declare_fixed_without_regression_check.md) · [feedback_no_sampled_verification_claims.md](memory/feedback_no_sampled_verification_claims.md) · [feedback_diagnose_with_real_data_first.md](memory/feedback_diagnose_with_real_data_first.md) — regression ritual, no sample-and-claim, diagnose with real data first.
- [feedback_palette_overrides_ink_not_paper.md](memory/feedback_palette_overrides_ink_not_paper.md) · [feedback_copy_implementation_before_tweaking_numbers.md](memory/feedback_copy_implementation_before_tweaking_numbers.md) — palette overrides skip paper; copy the reference's functions before recalibrating.
- [feedback_research_first_no_fake_provenance.md](memory/feedback_research_first_no_fake_provenance.md) · [feedback_research_before_visual_effects.md](memory/feedback_research_before_visual_effects.md) — research needs real citations; research techniques before applying named effects.
- [feedback_build_full_dont_self_stop_at_mvp.md](memory/feedback_build_full_dont_self_stop_at_mvp.md) · [feedback_save_to_memory_immediately.md](memory/feedback_save_to_memory_immediately.md) · [feedback_desk_doodles_session_start.md](memory/feedback_desk_doodles_session_start.md) — build full scope; save to memory now; the session-start read order.

---

## Maintenance rules

- **Knowledge pages are living** — they describe the app as it is; honest-status items move planned → real as things ship, never silently the reverse.
- **Locked-refs and memory mirrors are read-only here** — change them at the source and re-mirror.
- **New docs get a row here** — if you add a doc and it isn't in this guide, it's invisible. Add the link + one sentence.
