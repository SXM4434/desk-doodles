# Desk Doodles — docs/

Self-contained reference set for the makeathon (deadline 2026-06-18 11:59 PM PDT). Mirrored from the portfolio repo so this project can be reasoned about, uploaded to Make, or handed off without cross-repo lookups.

**Source repos:**
- `~/Desktop/Projects/portfolio/portfolio-system-lab/docs/` (locked + lab docs)
- `~/.claude/projects/-Users-sebs/memory/` (memory entries)

Mirror date: 2026-06-10. Sources may evolve in their home repos — these copies are snapshots for makeathon work, not living docs.

---

## docs/locked-refs/F3-smart-hachure-system/

The Smart Hachure engine — the headline of Desk Doodles. The full cell folder is here verbatim. Read order:

1. **`09-LOCKED-MODEL.md`** — THE CONTRACT. Every implementation decision checks against this. I-1 through I-13 invariants. Read FIRST.
2. **`makeathon-plan.md`** — 14-day plan, MVP vs stretch ladders, §8.6 Smart Rendering System unified framing.
3. **`07-architecture-ml-pipeline.md`** — `signals → classify → treatment` pipeline (general pattern). Audit-as-foundation framing for the smart layer.
4. **`06-architecture-technical-core.md`** — technical core architecture.
5. **`19-research-cross-axis-interconnection.md`** — 5-cluster taxonomy (Multi-Stroke / Pen Tip / Shading / Surface Texture / Color/Palette) + pair-wise + N-way interaction matrix.
6. **`20-research-figma-make-capabilities.md`** — Make constraints (per-dep verified). **Anchors why we use cannon-es not Rapier.**
7. **`18-scope-audit.md`** — what's in/out of scope and why. 9 D-decisions locked.
8. **`00-overview.md`** through **`08-vision-roadmap.md`** — the original cell research arc (artist tonal canon · libraries · structural signals · classifiers · perceptual lightness math · technical core · ML pipeline · vision roadmap).
9. **`phase-0-hero-lab-foundation.md`** — pre-fork foundation work that landed in Hero-8-Lab before Desk Doodles split off.

## docs/locked-refs/F3-siblings/

Hero #8 cell-level docs that contextualize Smart Hachure within the wider hero system:

- `F3-A-desk-horizontal-band.md` · `F3-B-desk-vertical-column.md` — the two F3 layout families
- `F3-toggle-architecture.md` — 7-axis taxonomy + 3D Path 1 style options + rotation-stability research candidates
- `F3-shading-calibration-spec.md` — full per-modifier spec (gap, weight, angle, density, multistroke, etc.) with math, ranges, defaults, bugs
- `F3-personal-sketch-style-research.md` · `F3-subject-forms-research.md` — sketch-style adaptation + object form research

## docs/locked-refs/system/

Locked system contracts Desk Doodles depends on:

- `color-system-w1.md` — W1 token system (warm paper clean direction). Desk Doodles uses W1.
- `typography-system.md` — ISe ladder
- `spacing-layout-rhythm.md` — locked spacing tokens
- `cross-system-rules.md` — how systems compose
- `north-star-filter.md` — design judgment filter ("disciplined systems with human residue")
- `repo-architecture-and-doc-layers.md` — what lives where

## docs/memory/

Cross-conversation memory entries that anchor architectural decisions.

**Project memories** (the project state + decisions):
- `project_desk_doodles_makeathon.md` — THE project memory. Deadline, scope, MVP vs stretch, app architecture, locked decisions.
- `project_desk_doodles_no_rapier_in_make.md` — why no Rapier WASM (cold-load race in Make preview).
- `project_desk_doodles_local_is_canonical.md` — local repo is source of truth; Make is deployment only.
- `project_desk_doodles_draw_panel_vs_desk_canvas.md` — draw surface vs desk canvas distinction.
- `project_smart_layer_foundation_via_audit.md` — `/audit` IS the smart-layer training dataset.
- `project_f3_shading_port_to_3d.md` — SVG and 3D have SEPARATE Style dropdowns; "SVG port" 3D option bridges via EdgesGeometry → SvgStyleTransform.
- `project_f3_styles_must_all_be_real.md` — no stub options; if a style is exposed it must be implemented.
- `project_f3_slider_recalibration_pending.md` — F3 sliders need calibration pass.
- `project_generalizable_rendering_decision_pattern.md` — `signals → classify → treatment` is GENERAL, not shading-specific. Don't pre-build meta-engine; extract on 2nd concrete example.
- `project_free_stroke.md` — the standalone Free Stroke creative tool (separate project, grad-school flagship candidate).
- `project_hero_8_personal_sketch_style.md` — Phase 4 personal sketch-style research.

**Feedback memories** (process discipline locked from prior incidents):
- `feedback_smart_hachure_drift_pattern.md` — drift patterns to avoid when working on Smart Hachure.
- `feedback_fillstyle_slider_must_switch_classifier_pick.md` — narrow fillStyle override; don't drift.
- `feedback_more_toggle_options_better.md` — granularity discipline.
- `feedback_never_declare_fixed_without_regression_check.md` — baseline + sweep before claiming done.
- `feedback_diagnose_with_real_data_first.md` — playwright/console diagnostic before patching.
- `feedback_no_sampled_verification_claims.md` — never claim "checked all" after sampling.
- `feedback_palette_overrides_ink_not_paper.md` — palette overrides skip paper/transparent/color-mix.
- `feedback_copy_implementation_before_tweaking_numbers.md` — use reference's actual functions before recalibrating.
- `feedback_research_first_no_fake_provenance.md` — research docs need real verifiable citations.
- `feedback_research_before_visual_effects.md` — research established techniques before slapping filters.
- `feedback_save_to_memory_immediately.md` — when Sebs says save, do it now.
- `feedback_desk_doodles_session_start.md` — auto-read THIS docs folder + CLAUDE.md + SESSION-HANDOFF on entry.
- `feedback_build_full_dont_self_stop_at_mvp.md` — default to building full phase scope.

## docs/research/

New research docs written during Desk Doodles work (NOT mirrored from portfolio — original here):

- `21-research-3d-pipeline-and-style-translation.md` — synthesis of the 6-agent research spree on 3D pipeline + style translation + multi-face mark placement + pipeline orchestration + chrome UX strategy. Cites the locked refs above + adds external citations from web research.

---

## Quick-start orientation for any reader

**If you're a future Claude / Make AI / new contributor walking into this:**

1. Read `~/Desktop/Projects/desk-doodles/CLAUDE.md` for project anchor + locked working rules.
2. Read `~/Desktop/Projects/desk-doodles/SESSION-HANDOFF.md` for current state + next move.
3. Read `docs/memory/project_desk_doodles_makeathon.md` for scope + deadline.
4. Read `docs/locked-refs/F3-smart-hachure-system/09-LOCKED-MODEL.md` for the engine contract.
5. Read `docs/locked-refs/F3-smart-hachure-system/makeathon-plan.md` §3.1 (MVP) + §3.2 (Stretch) + §8.6 (Smart Rendering System).
6. If touching the 3D path: also read `docs/memory/project_f3_shading_port_to_3d.md` + `docs/research/21-*.md`.

**Don't change anything in `locked-refs/` from this repo.** Source-of-truth lives in `~/Desktop/Projects/portfolio/`. If a locked doc needs to change, change it there first, then re-mirror.

**Memory entries are READ-ONLY mirrors.** Source-of-truth lives at `~/.claude/projects/-Users-sebs/memory/`. Edits there propagate to all sessions; edits here propagate nowhere.
