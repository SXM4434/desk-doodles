---
name: project-f3-shading-port-to-3d
description: "3D Path 1 has its OWN Style dropdown; ONE of those options is \"SVG port\" — a single 3D render mode that runs the entire SVG SvgStyleTransform pipeline on EdgesGeometry-projected polylines. SVG-side fixes ride that single mode for free. Must work under full 3D rotation."
metadata: 
  node_type: memory
  type: project
  originSessionId: 280032a1-475d-4acd-83ea-e9c6f3003e23
---

User direction 2026-06-02 (corrected framing — TWO prior drafts of this memory were wrong, now locked):

**SVG and 3D have SEPARATE Style dropdowns.** They are different render-mode sets, not a shared cross-path enum.

**SVG Path 2 Style options:** clean / outline-only / rough-handdrawn / sketchy / bold-ink / wet-ink / stipple / charcoal / risograph / newsprint / wireframe — all 11 run through `SvgStyleTransform.tsx` + the modifier system + the Phase 1A clamps.

**3D Path 1 Style options:** a separate set of 3D render modes — native-toon (current Trophy Wall Path 1 baseline) · native-edges (Three.js `EdgesGeometry` + line material) · native-wireframe (`WireframeGeometry`) · halftone (post-process pass) · etc. — AND one special option: **"SVG port"** (exact label TBD).

**The "SVG port" 3D option** is the bridge. When user picks it on the 3D path:
1. Mesh edges extracted via `EdgesGeometry`
2. Edges projected to screen-space (camera-aware)
3. The resulting 2D polylines fed through the **same `SvgStyleTransform` pipeline** as Path 2 — rough.js + clamps + fillStyle math + hachure shading + everything
4. Output rendered as an SVG overlay on top of the 3D canvas
5. The entire SVG Style sub-dropdown + all modifiers become available under this one 3D option (because it's the same pipeline)

**Hard requirement:** SVG-port mode MUST work under full object rotation (drag-rotate / auto-rotate / auto-tour). Rotation-stability research is the prerequisite — 4 candidate techniques documented in `docs/labs/hero/cells/F3-toggle-architecture.md` §"3D rough-handdrawn port":
- Stable seed (jitter pattern locked per object)
- Temporal smoothing (re-jitter at fixed intervals, e.g. 250ms)
- Edge-stable jitter (jitter as function of world-space edge position)
- Pre-baked N angles (interpolate between cached camera views)

One of those four gets picked at Phase 3 research; SVG-port mode then uses it.

**Implication for Phase 1A clamps (and all SVG-transform work):**
- Lands ONCE in `SvgStyleTransform.tsx` for the SVG path
- When 3D SVG-port mode is built (Phase 3), the clamps automatically apply through the bridge — no parallel R3F shader rewrite, no duplicate clamp math
- Phase 1B (style-switch auto-snap) is chrome-side in Hero8Shell — also handles 3D the moment 3D's Style dropdown lands

**Implication for non-SVG-port 3D styles:**
- They have their own native 3D implementations (toon shader / WireframeGeometry / halftone post-process / etc.)
- Independent of the SVG pipeline; need separate Phase 3 build work each
- Do NOT inherit Phase 1A clamps or any other SVG-transform math

**Phase order (locked per `F3-toggle-architecture.md` "Build order"):**
1. Phase 1 — F3-B SVG complete
2. Phase 2 — F3-A SVG complete
3. Phase 3 — 3D (only after both SVG phases done)
   - 3a. 3D basic-identifiable-form pass (replace generic placeholders)
   - 3b. 3D style toggle build (including rotation-stability research for SVG-port mode)
   - 3c. 3D interaction toggle
   - 3d. 3D fidelity toggle
   - 3e. 3D calibration pass (2-3 starter shapes × 4 fidelities)

**How to apply:**
- When implementing SVG-side fixes: don't worry about 3D porting; the bridge will handle SVG-port mode for free
- When planning 3D work: scope = (a) build the EdgesGeometry → SVG-overlay bridge with rotation stability + (b) build native 3D implementations for each non-SVG-port option
- Don't conflate the two — they're independent code paths

Related:
- [[project-hero-8-f3-toggle-architecture]] — the broader 7-axis taxonomy (Style is axis 5)
- [[project-f3-styles-must-all-be-real]] — applies to both SVG path's 11 styles and 3D path's native style options; stub options on either path violate the rule
- `docs/labs/hero/cells/F3-toggle-architecture.md` line 79-89 (3D Path 1 style options) + line 441-463 (rotation-stability research candidates)
- `docs/labs/hero/cells/F3-shading-calibration-spec.md` — SVG-pipeline-only spec; the math + clamps the SVG-port bridge inherits
