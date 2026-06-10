---
name: smart-hachure-drift-pattern
description: My recurring drift on Smart Hachure — building rule-based 9-role classifiers with fillStyle-switching when user explicitly said the system is multi-axis (gap/weight/pressure/color/opacity) modulation of a SINGLE user-chosen mark family. Anti-drift checks before any Smart Hachure work.
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 280032a1-475d-4acd-83ea-e9c6f3003e23
---

**Rule:** Before touching any Smart Hachure code, read `portfolio-system-lab/docs/labs/hero/cells/F3-smart-hachure-system/09-LOCKED-MODEL.md` and verify the planned change against §1–§7. If the change can't be cited to a section, STOP and re-verify with the user.

**Why:** Over the 2026-06-03 / 2026-06-04 rebuild sessions I (Claude) drifted five times — all variations of the SAME META-failure: **proposing the system ship as LESS than what the user explicitly defined** — either by collapsing user-facing choices ("internally these are the same") or by deferring agreed-upon scope ("v1 stub, real model later"). Both shapes have the same effect: silently shrinking the contract:

1. Built `BASE_BY_ROLE` in `techniqueMap.ts` that switches fillStyle per region (sparse-tonal=hachure, dense-tonal=cross-hatch, solid-content=cross-hatch). User had been explicit: the user's chosen fillStyle is sacred, only density/weight/pressure/color/opacity vary per region.
2. Treated rule-based v1 as a step toward "ML v2." User had been explicit: the ML "later" is for personal sketch-style training (task #30), NOT for the per-region density model. The density model must be intelligent at v1, built on real per-fillStyle research.
3. Built a single 9-tier TonalRole taxonomy assuming one model serves all mark families. User had been explicit: each fillStyle (hachure / cross-hatch / dots / zigzag / dashed / stipple / solid) needs its own tonal density research because the math is fundamentally different per mark family.
4. In `18-scope-audit.md` D-4, recommended collapsing cross-hatch into "internal layer-add on hachure" because Praun TAM nesting describes the math that way. User had been explicit (and I had just written I-1 the day before): the user's fillStyle dropdown is sacred. Cross-hatch is its own family because the user picks it as its own family. Internal math elegance NEVER overrides the user-facing taxonomy.
5. In `18-scope-audit.md` D-6, recommended deferring perfect-freehand pressure to a follow-up because "engineering lift" — but the 5-axis tuple (gap, weight, layers, pressure, opacity) is the locked contract per D-2.a, and pressure is one of the 5 axes. Shipping a 4-axis v1 IS shrinking the contract. Engineering effort is NEVER a v1/v2 boundary; it's just work.
6. On 2026-06-04 wobble work: iterated 6+ calibration cycles (Math.max(wobble, roughness) → drop Max → add control-point jitter → size-aware clamp → bump scale → cubic-Bezier rewrite) before doing the obvious thing — using the playground's actual roughRectPath/roughOvalPath/roughLinePath functions directly. The algorithm was wrong (8 sub-points per side with Q-bezier vs playground's 4 corners with cubic Bezier). No calibration of the wrong algorithm could match playground's visual. Should have copied/extended playground's actual functions on iteration 1. Rule extracted to [[copy-implementation-before-tweaking-numbers]].
7. Sebs asked multiple times during the same session to save lessons to memory. I kept "promising to save" while continuing iteration and never actually saved until the loop had cost an hour. Rule extracted to [[save-to-memory-immediately]].
8. On kink decision: proposed deferring kink implementation to Day 3+ when it was a 30-line fix today. Sebs: "why not just implement kink now asshole." Defer-by-default IS the drift; when a fix is small + clearly designed (kink = random-angle push, doc-comment-described, just never implemented), JUST DO IT. Reserve "defer" for genuinely deep / under-researched scope, not "convenient for me."

Each drift cost a full debugging or doc-revision cycle and ended with the user (legitimately) furious that we built something different than what we agreed to step-by-step.

Each drift cost a full debugging cycle and ended with the user (legitimately) furious that we built something different than what we agreed to step-by-step.

**How to apply:**
- Any Smart Hachure work starts with reading [[smart-hachure-locked-model]] (the §09-LOCKED-MODEL.md doc) — full pass, not skim.
- Code change PR-equivalent: "Implements §X.Y of locked model: ..." If you can't fill that sentence, you don't write the code.
- If a research doc or implementation surfaces a tension with the locked model, name the conflict to user BEFORE editing the model or the code.
- Sliders never multiply per-region multipliers (the broken v1 pattern). Sliders are MONOTONIC global bias that preserves per-region ordering. Test: at any slider position, does the relative density between any two regions match the relative source darkness? If no, the slider model is broken.
- "fillStyle = hachure" means EVERY marked region is hachure. The smart layer outputs gap/weight/pressure/color/opacity. Never fillStyle.
- Per-fillStyle research is mandatory before implementing that fillStyle's model. No "Agent 5 covered it" handwaves — Agent 5 was hachure-specific.
- **Never propose collapsing two user-facing dropdown options into "internally the same model" — even when the math elegantly supports it.** If the user picks Family A in the dropdown, Family A renders. If Family B exists in the dropdown, Family B has its own model + research + visual identity. The dropdown is the contract; internal elegance is subordinate. Specific example: hachure and cross-hatch each get their own fillStyle, own research doc, own forward model — even though TAM nesting describes both with related math.

Related memories:
- [[research-first-no-fake-provenance]] — applies hard here. Don't name-drop precedents to fill gaps in research.
- [[decision-discipline]] — when user says X step-by-step, X is the lock; deviation is drift not "iteration."
- [[research-before-visual-effects]] — research established techniques BEFORE implementing.
- [[enumerate-before-shipping]] — the 4-6 options pass before any rebuild edit.
