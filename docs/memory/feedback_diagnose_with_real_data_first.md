---
name: feedback-diagnose-with-real-data-first
description: "For visual rendering / runtime-behavior bugs, build the inspection tool FIRST (playwright headless + console capture + screenshot sweep). Don't read source and guess — instrument and observe."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 287a83f0-0fdf-4ed6-a8c0-31db25f03667
---

When debugging a visual / runtime / "this looks wrong" bug, **build the inspection tool BEFORE patching.** Don't read the source and guess from descriptions.

**Why:** 2026-06-07/08 — Sebs flagged "multi-stroke broken on stacked sketchbooks, cross-hatch + parallel-pass making lines wobblier." I spent hours:
1. Reading source, guessing at root cause
2. Patching speculatively (scale bump, layer-0 fix, group-pivot, SVG-level pivot)
3. Claiming "fixed" after each patch without verifying
4. Conflating systems (called outline-modifier bugs "Smart Hachure" issues)
5. Getting multiple rounds of pushback as user discovered the patches didn't fix what they claimed

Then Sebs said "go debug it yourself." I wrote a playwright script (~80 lines) that:
- Drove the app headlessly through the user's reported flow
- Captured console output from instrumented log statements
- Took screenshots of the canvas after each state change
- Wrote a JSON report of actual values

Within minutes the real data showed:
- `effectiveLayerCount: 1` (multi-stroke silently downgrading per size clamp)
- `inheritedPivot: true` (group pivot inheritance causing chaos)
- Visual screenshot showed secondary layers wobblier than base layer

Each fix from that point was targeted, small, and verified by re-running the diagnostic. ~30 lines of real code changes total.

**How to apply:**

1. **For visual rendering bugs:** write a playwright/puppeteer script that drives the app + screenshots + captures console. Use `/Users/sebs/Desktop/Projects/portfolio/tools/lab-screenshots/node_modules/playwright` if no project install. Pattern at `/tmp/diag-playground.js` and `/tmp/diag-sweep.js` from this session.

2. **For "X looks wrong" claims:** instrument the rendering with `console.log` (gated behind `window.__dd_diag = true` so it doesn't ship). Run the diagnostic to see actual values flowing through.

3. **For sweep verification:** loop the diagnostic over all relevant test cases (5+ items × 4 styles in this session). Don't trust "I checked one and it worked."

4. **Don't claim "fixed" without re-running the diagnostic** — verify the symptom is gone in the captured screenshots/logs.

5. **If you find yourself patching speculatively past attempt 2:** STOP. The signal is that you're not understanding the system. Build the inspection tool. Re-diagnose.

Related: [[feedback_dont_parrot_external_ai_screenshots]] (test in known-good env), [[feedback_match_locked_labs]] (read source not docs), [[feedback_enumerate_before_shipping]] (don't ship the first guess).

**Specific to Desk Doodles outline pipeline:** the `transformElement` / `renderHandFeelShape` pipeline has many size clamps + layer transforms + conditional reveals. Don't reason about it — instrument it.
