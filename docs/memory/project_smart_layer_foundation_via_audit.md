---
name: smart-layer-foundation-via-audit
description: Desk Doodles /audit route + per-shape breakage catalog IS the foundational dataset for the smart-layer/ML build. Not a throwaway debug tool.
metadata: 
  node_type: memory
  type: project
  originSessionId: 9fe905f2-0f57-4ff7-8d81-c236f0e7ff1b
---

The Desk Doodles `/audit` route (93-shape grid) + the sweep harness + per-shape screenshot catalog are not just a debugging utility for this session — they ARE the foundation for the smart-layer / ML build.

**Two-part build framing (Sebs 2026-06-08):** the smart layer is (1) a recognition + classification SYSTEM that learns element roles and per-toggle scaling, AND (2) the foundational dataset that bootstraps it. The trained system gets set as THE FOUNDATION of the rendering pipeline only after it's been initially trained on our dataset. Build order: grow audit catalog → train recognition system on it → set trained system as smart-layer foundation → everything else (visitor-canvas uploads, future assets) plugs into that foundation.

**Fact:** Going through every object and watching what breaks under modifier sweeps generates the labeled dataset the future smart layer needs (per-element classification + per-detail scaling curves).

**Why:** Sebs's framing 2026-06-08 after seeing pencil-jar tips shredded at wobble=0.8: "everything needs a smart layer like the wobble destroys the pencil tips here. Part of the smart layer will be creating the smart layer / ML system and going through and seeing what breaks on our objects as a way to create the foundation for it all." The catalog of what wobble amplitudes shred which element classes at which group sizes = the labels. Decorative-tip-polygon-on-large-group → low scaling. Outer-shell-rect → full. Etc. Smart Hachure already does this for fillStyle/hachure-density; the manual-toggle smart layer is the next surface to apply the same `signals → classify → treatment` engine to.

**How to apply:**
- Keep growing the per-shape breakage catalog in `/tmp/dd-audit/` (or graduate to a repo-local `audit-runs/` dir if it becomes load-bearing).
- Each new bug surfaced via audit = one more labeled data point for the smart-layer classifier.
- When the smart-layer build opens as its own session (parked task), start from this catalog — don't re-derive.
- Don't add this framing to `makeathon-plan.md` per Sebs's call ("just save this not [to] the build pma"). Keep it in memory only.
- Pairs with [[project_generalizable_rendering_decision_pattern]] — same pipeline pattern extending across decision surfaces.
- Pairs with the manual-toggle smart-layer note already in `makeathon-plan.md §8.6` (the "REVISED 2026-06-08" addition under Direct-manipulation sliders).
