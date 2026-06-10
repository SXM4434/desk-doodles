---
name: project-f3-styles-must-all-be-real
description: "F3 Style toggle exposes labels (wireframe, etc) that were never actually implemented — every Style must be REAL, not stubbed, per user direction 2026-06-02"
metadata: 
  node_type: memory
  type: project
  originSessionId: 280032a1-475d-4acd-83ea-e9c6f3003e23
---

User direction 2026-06-02: "some toggles like the wireframe one in the style toggle never got made — that's another thing we gotta fix. Make everything get implemented."

**Why:** F3-shading-calibration-spec.md §2 documents 11 styles; §5 calibration matrix marks ❌ for stubs / dead code. Wireframe is the most flagrant — exposes a `strokeWidth` slider that's overridden by `!important` CSS (per §7.B-1). Likely others (newsprint dot-pattern code path, stipple custom renderer per §7.B-2 / §7.B-5, simplification per §7.B-4) are similarly named but not real.

**The rule:** Don't ship a Style dropdown option whose render is a stub or whose modifier set claims toggles that don't fire. Either implement it for real or remove it from the dropdown until it's real.

**Inventory of known-stub or partial styles (extend as discovered):**
- **wireframe** — §2.3, §5: CSS-only strip-fills + force `stroke-width: 0.8 !important`. No real schematic / geometric implementation. strokeWidth slider does nothing.
- **newsprint** — §2.6, §7.B-2: preset declares dotSize / dotSpacing / dotPattern but no code consumes them. Falls back to CSS-only.
- **stipple** dot params — §7.B-5: locally-defined dotSize / dotSpacing / dotScatter / dotPattern are presets but never read; rough.js's `dots` fillStyle ignores them.
- **simplification** modifier — §7.B-4: in state type but `buildRoughOptionsForPath` never reads it.

**How to apply:**
- Phase 2A (newsprint custom dot renderer) and Phase 2B (stipple custom renderer) per handoff already address two of these.
- Wireframe needs its own implementation pass — likely after Phase 1A+1B verify.
- Final phase per handoff: "Properly implement Wireframe + audit all styles per §2 — make sure each is REALLY implemented, not just stubbed."
- This rule pairs with [[project-f3-shading-port-to-3d]] — each real style must also have a 3D counterpart.

Related: [[feedback-more-toggle-options-better]] — more toggle options are GOOD, but only if they actually work per spec. Stub options violate this.
