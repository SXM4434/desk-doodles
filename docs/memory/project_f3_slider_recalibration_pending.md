---
name: project-f3-slider-recalibration-pending
description: "F3 SVG-style modifier sliders need recalibration pass — some are non-linear (small drag = huge visual change), some have dead zones (no visible effect at low values), and the rough × strokeWidth interaction makes multi-stroke invisible at extreme low values"
metadata: 
  node_type: memory
  type: project
  originSessionId: 280032a1-475d-4acd-83ea-e9c6f3003e23
---

User direction 2026-06-02: "you need recalibrate all these sliders cause its annoying — some work, some I change slightly and there's a massive change, some don't seem to do anything." And specifically: "even on single-pass we should still know there are multi-strokes — like we never had an issue with this in the playground."

**Diagnosed root cause (verified against playground source):**

- Per-layer divergence is driven by jitter amplitude = `(rand - 0.5) × 2 × rough` (handFeel.ts:37)
- At rough = 0.08 + strokeWidth = 0.30: jitter ≈ 0.19px, stroke = 0.30px → layers are sub-pixel divergent → multi-stroke invisible
- Playground has IDENTICAL math (verified C3UserFlow.tsx:333 uses same binary 1.25/1.0 + same seed-per-layer system). The playground "works" because its DEFAULTS run at rough≈1.0 + strokeWidth≈1.0 where everything reads.
- Hero-8-Lab user pushes rough toward 0.08 expecting "low rough = clean but still multi-stroke visible." That's not how rough.js works — at low rough, ALL multi-stroke output collapses.

**What's failed once (don't retry):**
- Per-layer width taper (gradual 1.25 → 0.55 across layers) — diverges from playground convention, doesn't fix the underlying issue. Reverted to playground-canonical binary 1.25/1.0. Don't propose this again.

**Recalibration scope when this work opens:**

1. **Rough slider range/scale** — likely needs floor (~0.2) so users can't enter the dead zone, OR exponential scale so 0-0.5 of slider = 0.5-2.0 effective rough
2. **strokeWidth slider** — floor at 0.5 (sub-0.5 is sub-pixel, multi-stroke can't differentiate)
3. **Per-slider linearity audit** — user reports "some slight changes = massive output change, others = no visible change." Each slider needs an explicit min/max/curve calibration entry, ideally with documented "visible-range" floor + ceiling
4. **Slider × multi-stroke interaction** — when multiStroke ≥ double, possibly clamp rough floor higher (e.g., 0.3) so multi-stroke is ALWAYS visible. Or expose this as an explicit "guarantee multi-stroke visible" toggle
5. **Test against the screenshot values** (rough=0.08, strokeWidth=0.30, single-pass, multi-stroke=double or higher): output should still show layered stroke effect

**Deferred — not blocking other stub fixes.** Per user direction "please continue with the other stuff." Pick this up as its own focused pass.

Related:
- [[project-f3-shading-port-to-3d]] — slider recalibration is SVG-pipeline-only; ports to 3D SVG-port mode via same bridge
- [[feedback-match-locked-labs]] — playground's binary 1.25/1.0 is the canonical convention; don't diverge
