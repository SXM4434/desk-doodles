---
name: never-declare-fixed-without-regression-check
description: "Never claim a fix is \"done\" after testing only the one thing the fix targeted. Always re-verify a checklist of representative surfaces against a baseline so the fix didn't break something else."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 9fe905f2-0f57-4ff7-8d81-c236f0e7ff1b
---

When I apply a fix, I MUST verify it didn't break other surfaces before claiming done. Test the target AND a baseline checklist of representative cases. If I shipped without that check, I'm gambling — and Sebs has caught me doing it repeatedly.

**Why:** Pattern caught 2026-06-08 on Desk Doodles fillStyle / rough-handdrawn line consistency. Sebs's framing: "u have fixed and then rebroken this so many times… DO NOT EVER APPLY A FIX PERMANENTLY WITHOUT CHECKING IF [IT] BREAKS SOMETHING ELSE." Specific examples that day:

1. **fillStyle slider**, fix #1 (narrow override): swapped fillStyle for classifier-wants-fill regions. Worked. ✓
2. **fillStyle slider**, fix #2 (broad override + gap/weight/opacity lift + `<g>` recursion): made paper regions fill too. Broke Smart Hachure differentiation. ✗
3. **fillStyle slider**, fix #3 (full revert): user slider does nothing again. ✗
4. **fillStyle slider**, fix #4 (re-applied narrow): broke again per Sebs in next session.

EACH TIME I declared "fixed" after one verification. EACH TIME I missed the broken surface. The pattern only stops with a real regression check.

Plus: **rough-handdrawn line consistency** — many shapes have lines that don't match other shapes' character at default rough-handdrawn. I never noticed because I only screenshotted 4-5 representative shapes per fix. The 192 others I didn't look at had inconsistent rendering.

**How to apply:**

Before ANY fix is declared done, run a fixed regression-check protocol:

1. **Baseline snapshot first.** Before applying the fix, screenshot the affected modifier path on at least 6 representative shape classes — outer-shell-only (rect like framedSketch), multi-child-group (stackedSketchbooks), curved-path (luchaMask), text-bearing (criterionSpine), tall-thin (xacto), high-density-detail (stickeredLaptopLid). Save as `before-{shape}.png`.
2. **Apply the fix.**
3. **Repeat the same 6 screenshots** as `after-{shape}.png`.
4. **Diff each pair.** For each shape, did it change in the WAY YOU INTENDED, AND did surfaces that should be unchanged stay unchanged?
5. **Run the sweep harness** on at least one full style if the fix touches Smart Hachure or render code — confirm no new NO-OP cells appeared and no working cells went silent.
6. **Only then** can I claim "fixed." Show Sebs the before/after pairs, NOT just the "look it works on this one shape."

If a fix touches `lib/smartHachure/`, `SvgStyleTransform.tsx`, `STYLE_PRESETS`, or chrome onChange handlers — ALWAYS do the full protocol. These are the surfaces that have repeatedly leaked regressions.

Anti-pattern to never do again: "I fixed X, here's a screenshot of X working, done." If the screenshot only shows the targeted change, the regression check didn't happen.

If I find myself about to type "Verified" or "Confirmed" or "Working" after testing only one thing — STOP. Run the protocol. Then say it.
