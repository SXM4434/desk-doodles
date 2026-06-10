---
name: copy-implementation-before-tweaking-numbers
description: "When matching another implementation's visual character, COPY/EXTEND its actual functions before tweaking calibration numbers. Calibrating math when the algorithm differs is wasted effort."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 280032a1-475d-4acd-83ea-e9c6f3003e23
---

**Rule:** When asked to make X look like Y, FIRST look at Y's actual code and use/extend Y's actual functions. ONLY tweak calibration numbers after the algorithm matches.

**Why:** 2026-06-04 Smart Hachure rebuild burned an entire session iterating on wobble math:
1. `Math.max(wobble, roughness)` composition
2. Drop the Max, use wobble alone
3. Add wobble-driven control-point jitter to Q-bezier
4. Size-aware clamp via effectiveWobble
5. Bump jitter scale 2.5 → 3.4
6. Cubic-Bezier rewrite with two jittered control points

None of those landed visibly because the rebuild was using a fundamentally different path-building algorithm than the playground. Our rebuild sampled 8 sub-points per side connected by Q-beziers; the playground sampled only 4 corners connected by cubic Beziers with two jittered control points each. The MATH was right; the SAMPLING DENSITY was wrong.

The fix that should have been the FIRST move: use the playground's `roughRectPath`/`roughOvalPath`/`roughLinePath` directly (or extended variants with bowing/curve added on top). Same algorithm = same visual character. Done.

Sebs called this out directly: "this what should have been done from the start why do u keep doing dumb shit like this."

**How to apply:**
- When user says "make X look like Y" or "match the playground" or similar: open Y's actual source FIRST. Find Y's path-builder / render function. COPY or EXTEND it. Don't reinvent the math.
- If Y's functions are already imported in the codebase (via re-export, package, etc.) — use them directly.
- If Y's functions need extension (e.g., support extra sliders the rebuild has but Y doesn't), write a wrapper that calls Y's logic + adds the new axis. Don't write from scratch.
- ONLY tweak calibration numbers AFTER the algorithm matches. If the algorithm is different, no amount of calibration will reproduce the visual.

**Detection heuristic:** if I'm on the 3rd+ calibration iteration of the same axis and user still says "doesn't match," stop calibrating. Open the reference implementation's source. Check if my algorithm matches. If not, swap algorithms.

Related memories:
- [[smart-hachure-drift-pattern]] — the broader Smart Hachure drift class this is an instance of
- [[research-first-no-fake-provenance]] — research the reference before claiming match
- [[match-locked-labs]] — always read locked lab source code before building surfaces; this is the same rule at code level
