---
name: project-hero-8-personal-sketch-style
description: "Phase 4 research item — render F3 hero items in Sebs's personal sketching hand, not generic rough.js. Quiver image-to-SVG on actual hand sketches is the primary approach. Deferred until Phase 1-2 SVG toggle architecture lands. Full plan at docs/labs/hero/cells/F3-personal-sketch-style-research.md."
metadata: 
  node_type: memory
  type: project
  originSessionId: ab08230a-30a0-4478-a2b1-ba5e8f6b16aa
---

User direction 2026-06-01: hand-drawn rendering should match Sebs's personal sketching hand, not a generic rough.js calibration. Same identity-content principle as the rest of the portfolio — the WAY items are drawn should feel like the way HE draws.

**Three approaches (ranked):**
- **A. Quiver image-to-SVG on actual sketches** (simplest, highest fidelity) — Sebs sketches objects, photographs, runs through Quiver, inlines result as source SVG. The source IS the hand-drawn version; no style transform needed.
- **B. Calibration tuning from sketch samples** (mid) — Sebs sketches ~10 reference shapes; measure his natural jitter/bowing/stroke-count/endpoint; derive custom rough.js calibration to mimic.
- **C. Style-transfer ML** (high) — train on his sketches; transform clean SVGs through the model. Almost certainly skipped — A + B together should suffice.

**Phase 4 plan:** Approach A on the 4-shape calibration starter set (sketchbook, laptop, race medal, pokéball) → expand to 10-15 most identity-bearing shapes → Approach B as fallback for unsketched shapes.

**When:** opens AFTER Phase 1 (F3-B SVG toggle architecture + 4-shape calibration) lands. The 4-shape calibration set is the natural starting point.

**How to apply:** When SVG toggle architecture stabilizes, open this research thread. Reference doc has 5 open questions to resolve at that point.

Related: [[project-hero-8-finish-desk-first]] · [[project-hero-8-f3-toggle-architecture]] · [[reference-vector-asset-tools]] · [[feedback-research-before-visual-effects]].
