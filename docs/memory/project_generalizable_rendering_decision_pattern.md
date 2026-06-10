---
name: project-generalizable-rendering-decision-pattern
description: "The `signals → classify → select treatment → render` pipeline is GENERAL, not shading-specific. Watch list of domains where it likely applies (motion · type · color · spacing · cards · 3D fidelity · microcopy · images · loading · a11y). Don't pre-build the meta-engine — extract when we hit the second concrete example. Sebastian's discipline 2026-06-03. Cross-project."
metadata: 
  node_type: memory
  type: project
  originSessionId: 280032a1-475d-4acd-83ea-e9c6f3003e23
---

## The pattern

Sebastian's insight 2026-06-03 while designing Smart Hachure System architecture:

> "i feel like we can expand to a new part of the whole object creation drawing , handrawn, the styles , the dffrent pen tips textured etc basically verthing right ??? i mean lets make sure it workd for tis first then exapnd it out"

The architecture pattern is:

```
Input → Extract Signals → Classify Region/Element → Select Treatment → Render
                                       ↓
                             Override Store wins
                                       ↓
                             Learning Loop (corrections promote rules)
```

This is **architectural**, not domain-specific. Different signal sets, different role taxonomies, different treatment maps — same pipeline shape.

## Candidate domains (watch list)

When work opens in any of these and starts looking like the same shape, that's the signal to extract the pattern as a generic engine:

| Domain | What classify→treatment means there |
|---|---|
| **Motion / animation** | Region role → animation register (orchestrated entrance · stagger · easing · idle · hover) |
| **Typography** | Text role → register from CSML ladder (section heading · body · eyebrow · label · meta) |
| **Color application** | Region role → ink token tier (primary · body · detail · accent) |
| **Spacing** | Container role → spacing token (section transition · block · item · micro) |
| **Card / component shells** | Position + status → shell variant (featured · standard · archived) |
| **3D fidelity** | Object focus + position → poly tier (hero high-poly · prop mid · accent low) |
| **Microcopy** | Section role + intent → voice register (confident · supportive · direct) |
| **Image / asset treatment** | Asset category → crop + filter + scale |
| **Loading / skeleton states** | Element role → loading register |
| **A11y** | Element role → focusable / decorative / structural |

## How to apply

**DO NOT** pre-build the meta-engine. Premature abstraction = wasted code.

**DO:**
1. Build Smart Hachure System v1 for SHADING specifically (concrete, not abstract)
2. When motion-lab work (or any candidate above) opens and starts having the same shape, RECOGNIZE the pattern
3. Extract `signals→classify→select→render` as a generic engine THEN
4. Smart Hachure becomes the first consumer; motion (or whatever) becomes the second
5. Each new axis after that = a new (classifier · selector · treatment-map) tuple plugged into the same engine

**Trigger conditions for extracting the generic engine:**
- Second concrete implementation has emerged
- Both implementations independently arrived at the same shape
- A third use case is imminent

Until then: keep the pattern in your head, capture it here, but ship concrete code.

## Related
- [[user-goals-and-wedge]] — generic rendering-decision pipeline aligns with Sebastian's design-engineering-for-creative-tools wedge
- [[feedback-build-one-section-stop]] — anti-scope-creep discipline that pairs with this
- [[feedback-decision-discipline]] — every concrete decision still needs 4-6 options pass
- Smart Hachure System docs at `portfolio-system-lab/docs/labs/hero/cells/F3-smart-hachure-system/` — first concrete instance
