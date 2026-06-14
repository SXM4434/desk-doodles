# 3D Fix Spec — researched, source-grounded (2026-06-14)

From the `research-3d-fix-solutions` workflow (4 web-research angles + synthesis, cited). Grounded against the real stack (`strokeTo3d.ts`, `convert.ts`, `toneMask.ts`, `Stroke3DScene.tsx`, `hatchMaterial.ts`). Much infrastructure already exists — each fix targets the actual gap, not greenfield.

## Bug 1 — Filled 2D region renders HOLLOW in 3D (tone band lost) ← clean, do first
**Root cause (confirmed in source):** `ToneFill[]` from `toneMask.ts` (band grid → island outlines, `band` 1–7) is **never read by the 3D converter**. `convertStrokePool` (`convert.ts:155`) takes only `StrokeInputPoint[][]`; `toneFills` is not in `ConvertOptions`. A filled region arrives as its bounding ink strokes only → hollow extrude/rod; band dropped.
**Fix (reuses existing fns):**
1. Add `toneFills?: ToneFill[]` to `ConvertOptions`; thread into `convertStrokePool`. DrawSurface/Canvas already hold `toneFills` (sibling of `strokes`).
2. Per `ToneFill`, build a filled slab via existing **`buildExtrudeGeometryWithHoles(world, holeWorlds, opts)`** (`strokeTo3d.ts:864`). `fill.points`→outer world loop via `normalizeStrokePoints` (`strokeTo3d.ts:484`); `fill.holes[]`→`holeWorlds`.
3. Color by band via existing `COVERAGE_BANDS`/`TONE_BAND_HEX` (`lib/smart/coverage.ts`, used in `hatchMaterial.ts:34`). Emit fill slab as its own `ConversionUnit` carrying `band`; in `Stroke3DScene` tint that mesh to band hex (Native = MeshStandard color; Hatch = `u_bands`).
**Gotcha:** hole winding must oppose outer; render slab THROUGH `buildExtrudeGeometryWithHoles` (it already `translate(0,0,-depth/2)`) so fill shares the z=0 plane with ink. Source: three.js Shape/ExtrudeGeometry — threejs.org

## Bug 2 — NPR hand-drawn vibe on lit carved 3D (auto=blob, extrude=jagged)
Mostly built (`buildSvgPortTexture` = emissive ink + Sobel normal + displacement; TessellateModifier cap). Two misroutes:
- **auto=dark blob:** auto→Native material, svg-port texture branch doesn't fire (needs `isSvgPort`), so marks exist only as bumpMap on an ink-black slab → featureless mass under key light. Fix: relief bumpMap path (`Stroke3DScene.tsx:660`) must ALSO carry partial-emissive ink (mirror svg-port emissive layer), or route auto-closed Native bodies through `buildSvgPortTexture`.
- **extrude=jagged silhouette:** don't let displaced triangle edges define the outline. Keep carving in the Sobel **normal map** (no vertex motion, clean outline) + keep displacement SMALL (`displacementScale~0.3`, `bias~-0.15`). Contour already smoothed (Chaikin + 186a1a4).
**Gotcha:** never MatCap for ink (view-locked, won't wrap on orbit); keep `computeVertexNormals()` after displacement. Sources: Real-Time Hatching (hhoppe.com/proj/hatching), three.js SobelOperatorShader, SDF AA (redblobgames).

## Bug 3 — Discrete band (0–7) → relief without stair-steps
Reconstruct a **continuous Float32 height field** from band (`h = band/7 * maxDepth`), **Gaussian-blur in float**, THEN displace. Never displace the raw 8-step staircase; never round-trip through an 8-bit PNG channel (the 256-step terracing trap). Feed as `THREE.DataTexture` `FloatType` → `displacementMap`. Bands live in `toneMask.ts` `grid.bands: Uint8Array`. Blur amount = a shippable "relief smoothing" slider. Sources: three.js discourse terrain-banding #53849, three.js #21759.

## svg→polyline approach: KEEP getPointAtLength
Validated as the canonical browser-native approach. Libraries (points-on-path by the rough.js author, svg-path-properties, flatten-svg) are alternatives but getPointAtLength is robust for our case; only gotcha is DOM-mount requirement (we handle it) + perf on huge paths (we cap). No swap needed.

_Full synthesis + all cited URLs: workflow wf_b7ba0933-531 output._
