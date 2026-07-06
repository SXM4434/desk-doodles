# KNOWN-SOLUTIONS — PART 2 (Features/UX · Complex→3D · Recognition+Gap-close · NPR/Smart-ML)

Companion to **[KNOWN-SOLUTIONS.md](./KNOWN-SOLUTIONS.md)** (region-fill · even-odd holes · 3D
relief · plush inflation · silhouette cleanup · the known-bugs inventory + region-fill refactor
path). This Part 2 covers the problem classes that doc does **not**: shape editing/selection UX,
turning a complex/branchy drawing into 3D, sketch recognition + gap-closing, and the
non-photorealistic-rendering + smart/ML layer. Same format throughout —
**problem → proven solution (with real citation) → our recommendation, mapped to our stack.**

Stack reference: Vite/React/TS · perfect-freehand · three.js + @react-three/fiber + drei ·
polygon-clipping@0.15.7 · roughjs 4.6.6 · svgson. READ-ONLY research — nothing here was wired;
each "our recommendation" names the file/contract it lands in.

Cross-cutting principle (per project memory): the pipeline stays **object-agnostic** — region /
silhouette / signal driven, never object-identity. Everything below honors that.

---

## SECTION 1 — FEATURES / UX (insert · reshape · select · shape-picker · auto-detect+override)

The headline finding: **most of this is assembly of engines we already built** (the shapeFit.ts
recognizer, the shapeLibrary.ts parametric generators, the round-8 tap-select, the lasso) behind
**one shared bbox-transform overlay** — not new invention.

### How the leading tools do it
- **Excalidraw** — *data-oriented*. Every element carries `x/y/width/height/angle`; ALL transforms
  flow through one `resizeElements`/`transformElements` function. 8 bbox handles (corner = aspect
  lock, edge = single-axis, Shift toggles aspect) + a rotate handle writing `angle` in radians;
  selection box uses a fixed padding offset. Free-aspect multi-resize is **disabled** when any
  selected element is rotated (the rotated-multi-select math is the gotcha).
- **tldraw** — *behavior-oriented*. Every shape is a `ShapeUtil` exposing `getGeometry() →
  Geometry2d` (Rectangle2d/Polyline2d/Arc2d/Edge2d/CubicBezier2d/Group2d). That ONE geometry tree
  powers hit-testing (`hitTestPoint(point, margin)`, `distanceToPoint`), snapping, brush-marquee,
  and resize/rotate. Geometry is **cached** so dragging a brush over hundreds of shapes stays
  smooth. Shape TYPE is a *style* (`GeoShapeGeoStyle`): rectangle↔ellipse↔star is
  `editor.updateShape({props:{geo}})`, keeping the bbox, with last-used remembered.
- **Illustrator Live Shapes** — width/height/corner-radius held as *live params* edited by on-canvas
  widgets (corner-radius circles) until "Convert to Curves".
- **Affinity** — Shape tool → Convert to Curves → Node Tool (drag vertices / drag sides to curve) +
  a dedicated **Corner Tool** (drag a corner inward to round it individually).
- **Figma** — vector **network** (nodes can have >2 edges) + Bend tool / Cmd-click to add bezier
  handles, with handle-mirroring modes (none / angle / angle+length); **Cmd-K** command palette;
  FigJam quick-create edge-dots spawn adjacent shapes directionally.
- **Procreate QuickShape** — draw-and-**hold** snaps to the best primitive; keep holding to
  scale/rotate; a **second finger** constrains (oval→circle, rect→square); then a time-limited "Edit
  Shape" panel with transform nodes AND a shape-type switcher.
- **Selection-cycling convention** (CAD/design) — repeated same-point click, or Tab / Shift+Space,
  steps the z-stack; marquee = bbox-intersect; lasso = point-in-polygon enclosure.

### Problem → proven solution → our recommendation

| Problem | Proven solution | Our recommendation (mapped) |
|---|---|---|
| **Insert a primitive + reshape it without quality loss** | Excalidraw single-transform model: store `{x,y,w,h,angle}` + a kind, not baked points; one `transformElements()` runs every type. | Store each inserted primitive as a `shapeLibrary` kind + `{x,y,w,h,angle}`. On resize, **re-run `shapeLibrary.generate(newBbox)`** so the parametric outline regenerates crisply — this is *exactly the `generate(bbox)` contract `shapeLibrary.ts` was authored for* (verified: `generate(bbox): Pt[]` at shapeLibrary.ts:42). Strokes affine-map their cached perfect-freehand points by the bbox delta. |
| **Reshape WITHOUT redrawing (premium feel)** | Illustrator Live Shapes / Figma corner-radius: edit the shape's *defining params*, not its rendered points. | Extend each `shapeLibrary` entry's params (rect `cornerRadius`, star `pointCount`/`innerRatio`, n-gon `sideCount`) and render one on-canvas widget per param that calls `generate()` again. Cheapest high-leverage reshape because our generators are already pure unit-box functions. |
| **Arbitrary path reshape (corners, not just bbox)** | Figma vector network / Affinity Node+Corner tools — drop into node-edit, drag anchors, bend segments. | Heaviest tier. Our strokes are already point-chains, and **we already compute `detectCorners()`** — so scope this to *corner-only* editing (handles on detected corners, not every noisy point). Defer full bezier-handle editing: over-scope for a desk-doodle tool and poor on touch. |
| **Select before applying anything** | tldraw/Paper.js stack: click hit-test topmost-first (point-in-polygon for fills, point-to-segment margin for strokes), drag-marquee bbox-intersect, lasso point-in-polygon, same-point repeat-click to cycle z-stack, Shift multi-select. | We already have round-8 tap-select + lasso (with the `LASSO_MIN_DIM_PX`/bbox-area degenerate guard). Add: (a) **point-in-polygon for filled regions using the installed polygon-clipping** (~20-line solved algorithm), (b) bbox-**marquee** (drag from empty = rect-intersect — trivial), (c) **same-point repeat-click cycle** (the only touch-safe substitute for alt-click). Cache geometry like tldraw to stay smooth on touch. |
| **Shape selector that scales past ~15 shapes** | Inline favorites + overflow flyout + Cmd-K / slash search (Excalidraw row, Figma "More shapes", Notion `/`, Linear/Raycast Cmd-K). | Our `ShapeStrip` already implements inline + overflow (`[Freehand][inline][More ▾]`). As the library grows, add a **categorized searchable grid** in the More popover + a **Cmd-K / `/`-to-insert** path over the existing kind strings. |
| **Auto-detect shape on draw + free override** | Procreate QuickShape snap + type-switcher; tldraw geo-style swap keeps bbox. | **Recognition already exists** (`shapeFit.ts`: ShortStraw+RDP corners, `$1` resample, confidence-scored kinds). Add the missing **override surface**: a non-blocking "snapped to X — keep freehand?" chip + a **type-swap dropdown** that calls `generate(sameBbox)` for any other kind. Gate auto-snap behind a tunable confidence floor so it never fights the user (matches the "auto-detect + free override" framing in memory). |

### ⚠ PREREQUISITE BLOCKER (verified in source, fix before the override + selector tiers)
The recognizer (`shapeFit.ts`) emits kinds **rect / circle / triangle / ellipse**, but
`SHAPE_LIBRARY` (shapeLibrary.ts:345) only registers
`diamond/pentagon/hexagon/octagon/heart/cloud/speech-bubble/lightning/crescent/teardrop/arrow-block/star-5`.
So `generateShape('rect', bbox)` **returns null** (verified at shapeLibrary.ts:428–430: `if
(!entry) return null;`). Inline insert and geo-swap into those four kinds **silently fail today.**
Add four trivial parametric generators (rect, circle, ellipse, triangle) so recognizer kinds and
library kinds are **1:1**. This unblocks BOTH the auto-detect override (tier 3) and the selector
(tier 4).

### Section 1 — TOP RECOMMENDATION
**Build in four tiers, leaning on engines we already have.** (1) **Selection foundation** — unify on
a tldraw-style cached-geometry-per-element + `{x,y,w,h,angle}` model; add point-in-polygon (via
polygon-clipping), bbox-marquee, repeat-click cycle, Shift multi-select on top of our existing
tap-select + lasso. (2) **ONE bbox-transform overlay** (Excalidraw single-function model) — 8 scale
handles + rotate, and **on primitive resize re-run `shapeLibrary.generate(newBbox)`** instead of
scaling baked points. (3) **Auto-detect + override** — the recognizer + generators already exist;
add the chip + type-swap surface, gated by a confidence floor. (4) **Selector** — extend `ShapeStrip`
with a searchable categorized grid + Cmd-K/`/`. **First, fix the rect/circle/triangle/ellipse
generator gap (the verified blocker).** Defer/scope node-editing to corner-only.

### Section 1 citations (real)
- https://deepwiki.com/excalidraw/excalidraw/3.6-element-selection-and-manipulation
- https://deepwiki.com/excalidraw/excalidraw/3.4-geometry-and-bounds-calculation
- https://github.com/excalidraw/excalidraw/pull/1099
- https://tldraw.dev/sdk-features/shapes · https://tldraw.dev/sdk-features/geo-shape · https://tldraw.dev/sdk-features/styles
- https://tldraw.dev/features/composable-primitives/drawing-and-canvas-interactions
- https://deepwiki.com/tldraw/tldraw/2.5-tools-and-interaction · https://tldraw.dev/reference/editor/Editor
- https://help.procreate.com/procreate/handbook/guides/quickshape · https://help.procreate.com/articles/zymjvk-quickshape
- https://helpx.adobe.com/illustrator/desktop/draw-shapes-and-paths/modify-live-shapes/change-corner-radius-of-live-shapes.html
- https://helpx.adobe.com/in/illustrator/using/live-shapes.html · https://helpx.adobe.com/au/illustrator/using/reshape-with-live-corners.html
- https://www.figma.com/blog/introducing-vector-networks/ · https://help.figma.com/hc/en-us/articles/360040450213-Vector-networks
- https://designbundles.net/design-school/how-to-use-the-node-tool-in-affinity-designer · …/how-to-use-the-corner-tool-in-affinity-designer
- https://help.figma.com/hc/en-us/articles/1500004291601-Build-faster-with-quick-create-in-FigJam
- https://medium.com/design-bootcamp/command-palette-ux-patterns-1-d6b6e68f30c1
- AutoCAD object-cycling: knowledge.autodesk.com (Shift+Space) · Graphisoft Tab cycling: help.graphisoft.com
- http://paperjs.org/reference/hitresult/ · https://lazyjobseeker.github.io/en/posts/winding-number-algorithm/
- https://en.wikipedia.org/wiki/Hit-testing · https://github.com/scottglz/distance-to-line-segment

---

## SECTION 2 — COMPLEX DRAWING → 3D (easy-path inflation vs the R10 AI hard-path)

The whole class descends from **Teddy** (Igarashi, SIGGRAPH '99); the modern browser-proven standard
is **Monster Mash** (Google/ETH/CTU, SIGGRAPH Asia 2020). This is the deeper-engineering companion to
KNOWN-SOLUTIONS.md §1C (relief) and **§1D (plush inflation)** — read both together; §1D and this
section both point at the same inflation family, this one fans out the full option space + the AI tier.

### How the leading tools do it
Teddy → triangulate the closed silhouette, build a medial/**chordal axis**, lift the surface by
distance-to-axis onto a rounded (quarter-oval) cross-section. **Monster Mash** (monstermash.zone)
replaces chordal-axis lifting with a **Laplacian/Poisson solve** for the height field (z=0 Dirichlet
on the boundary, positive interior source → rounded cross-section); runs entirely client-side via
WASM+WebGL; handles multiple overlapping regions into layered characters; **Apache-2.0**. Cheap
commercial "inflate image / bas-relief" tools (Curvy 3D, Bildeform, Carveco AI) use the
distance-transform-heightmap shortcut. The current AI hard-path is single-image LRM reconstruction:
**TripoSR** (MIT, self-host, <1s/A100) offline, or hosted GLB-returning APIs on **fal.ai** — TRELLIS
2, Hunyuan3D v2/v3.1. Meshy & Tripo ship dedicated sketch/line-art-to-3D modes; both stress that
**clean, high-contrast, decluttered input dominates output quality.**

### Problem → proven solution → our recommendation

| Problem | Proven solution + citation | Our recommendation (mapped) |
|---|---|---|
| **Rounded organic 3D from a closed silhouette (the default, no credits)** | **Monster Mash** Laplacian/Poisson height-field inflation (Dvořák et al., SIGGRAPH Asia 2020, Apache-2.0). | **Easy-path to ship.** We already produce the closed silhouette polygon (perfect-freehand outline / svgson path). Add a tiny MIT triangulator (`cdt2d` or `poly2tri`), solve a sparse Laplacian for z with z=0 on the boundary, mirror front/back into a watertight `BufferGeometry`, render via our R3F/drei pipeline. True rounded forms, not a flat extrude. |
| **Canonical reference / fallback lift** | **Teddy** chordal-axis inflation (Igarashi, SIGGRAPH '99); JS-friendly port `zeyap/teddy`. | Keep as the conceptual reference; the chordal-axis pruning/retriangulation is more fiddly to make robust than the Poisson solve — prefer Monster Mash, cite Teddy as lineage. |
| **Cheapest first cut ("puffy sticker"), no solver** | Distance-transform height map: rasterize silhouette → Euclidean Distance Transform → dome falloff `z = h·√(1−(1−d/dmax)²)`; iso-contours via `d3-contour`. The documented bas-relief pipeline. | If a sparse solver feels heavy for v1, ship EDT + dome falloff + displaced `PlaneGeometry` first, then **swap the lift step up to the Poisson solve — same data in/out.** Handles holes natively (mask). |
| **Branchy / self-intersecting strokes that crease a heightfield** | Implicit/metaball/SDF field + **Marching Cubes** (already a three.js addon: `import { MarchingCubes } from 'three/addons/objects/MarchingCubes.js'`). | Keep in pocket — **zero new deps**. Use when a stroke is branchy and the heightfield creases; fields just add, so merges/self-intersections resolve naturally. Grid-resolution-bound (blobby), so not the default. |
| **"Make it REAL 3D" — invent the unseen back (R10 hard-path, credits)** | Single-image LRM: hosted **fal.ai Hunyuan3D v2** (~$0.16/call, GLB out) or **TRELLIS 2** (~$0.25–0.35); offline **TripoSR** (MIT, needs a GPU). Returns textured GLB. | Opt-in premium tier. Render the doodle to a **clean centered PNG first** (input cleanliness dominates), call the hosted API, drop the GLB into `useGLTF`. Reserve self-hosted TripoSR for when a GPU exists (it won't run in-browser). This is the **credits-gated** path, not the default. |

### Section 2 — TOP RECOMMENDATION
**Two tiers.** **EASY-PATH (default, ship this):** Laplacian/Poisson height-field inflation
(Monster Mash method) — NOT a plain extrude. We already have the closed silhouette; add a small
MIT triangulator + a sparse Laplacian solve, mirror to watertight, render in our existing R3F
pipeline. If the solver is too heavy for v1, start with the **distance-transform "puffy sticker"
heightmap** and upgrade the lift step in place (same data in/out). Keep three.js's built-in
**MarchingCubes** addon in your pocket for branchy strokes (zero new deps). **HARD-PATH (R10,
opt-in, credits):** wire fal.ai **Hunyuan3D v2** or **TRELLIS 2**, render a clean PNG first, load
the returned GLB via `useGLTF`. Build the Poisson easy-path now; gate the AI GLB path behind credits.

### Section 2 citations (real)
- https://github.com/zeyap/teddy/blob/master/README.md · https://dl.acm.org/doi/10.1145/311535.311602
- https://history.siggraph.org/learning/teddy-a-sketching-interface-for-3d-freeform-design-by-igarashi-matsuoka-and-tanaka/
- https://research.google/pubs/pub49531/ · https://dcgi.fel.cvut.cz/en/publications/2020/dvoroznak-tog-mm/
- https://github.com/google/monster-mash · https://monstermash.zone/ · https://igl.ethz.ch/projects/monster-mash/
- https://research.google/blog/monster-mash-a-sketch-based-tool-for-casual-3d-modeling-and-animation/ · https://arxiv.org/pdf/1804.06092
- https://theartsquirrel.com/3787/2d-image-to-height-map-for-bas-relief/
- https://en.wikipedia.org/wiki/Marching_cubes · https://threejs.org/docs/#examples/en/objects/MarchingCubes · https://threejs.org/examples/webgl_marchingcubes.html
- http://rodolphe-vaillant.fr/?e=86 · https://github.com/d3/d3-contour · https://github.com/mattdesl/svg-mesh-3d
- https://github.com/VAST-AI-Research/TripoSR · https://huggingface.co/stabilityai/TripoSR · https://arxiv.org/pdf/2403.02151
- https://fal.ai/models/fal-ai/trellis-2 · https://fal.ai/models/fal-ai/hunyuan3d/v2/api · https://fal.ai/models/fal-ai/hunyuan3d-v3/image-to-3d/api
- https://www.meshy.ai/blog/sketch-to-3d · https://www.meshy.ai/compare/meshy-vs-tripo

---

## SECTION 3 — SHAPE RECOGNITION + GAP-CLOSING

Bottom line: **`shapeFit.ts` is already correctly architected** (a PaleoSketch-style geometric
fitter, not a template matcher). The work here is *calibration* + building a **standalone gap-closer**
that feeds both fill (KNOWN-SOLUTIONS.md §1A) and 3D (Section 2 above). This is the upstream sibling
of KNOWN-SOLUTIONS.md **§1E (silhouette cleanup + nested-region detection)**.

### How the leading tools do it
- **Procreate QuickShape** — draw-and-hold (~1s) snaps to line/arc/polyline/ellipse/triangle/quad; a
  **second finger** regularizes (oval→circle, rect→square, scalene→equilateral); result stays
  draggable. Explicit, on-demand + regularize — almost exactly our explicit Snap pill + chip-cycle.
- **OneNote Ink to Shape** — auto-converts *while* inking, 12+ shapes. Always-on (the opposite of
  Sebs's freehand-default law — which is why ours is opt-in).
- **Gap closing converges on VECTOR endpoint logic.** **Blender Grease Pencil** ships three tunable
  modes: leak-size (bitmap plus-probe), stroke **EXTENSION** along the tangent, direct **ENDPOINT
  CONNECTION** within a distance threshold, plus curvature extension. **Inkscape** bridges gaps with
  an invisible straight line before fill (small/med/large). **MyPaint** uses a distance-transform
  pre-pass that stops the flood at synthesized barriers **without dilating** (preserves corners).
  **GIMP/Krita** use morphological close on a rasterized mask. Shared lesson: gap closure is a
  **separate, explicit, distance-thresholded step before fill**, and vector endpoint
  extension/welding beats raster dilation when you need clean geometry afterward (we do — for fill
  AND 3D).

### Problem → proven solution → our recommendation

| Problem | Proven solution + citation | Our recommendation (mapped) |
|---|---|---|
| **Recognize a drawn primitive** | $-family template recognizers ($1/$P/$N/$Q, Wobbrock et al.) vs **PaleoSketch** geometric recognizer (Paulson & Hammond, IUI '08, 98.56%, NDDE/DCR curve-vs-polyline split, complexity-prior ranking). | **Keep `shapeFit.ts` (PaleoSketch philosophy).** Do NOT swap in a $-family recognizer — it's a *template matcher* (returns "closest template," not parametric geometry, and normalizes away rotation, so a tilted square wrongly un-tilts). The only borrowable bit (resample/normalize) we already have. |
| **Corner detection** | ShortStraw (Wolin '08) → resample, straw=chord ±3 pts, minima below 0.95× median = corners; **IStraw** adds curvature/arc handling (~92%); Sezgin = speed minima + curvature maxima. | We use a **ShortStraw+RDP hybrid** with noise-scaled epsilon (survives touchpad jitter). If mixed line+arc strokes keep mis-cornering, adopt **IStraw's arc-aware curvature check**. Avoid Sezgin's speed term — needs timestamps we don't trust in the snap path. |
| **Fit circle / ellipse / polygon** | Circle: Kasa algebraic but **biased on short arcs** → prefer **Pratt/Taubin** (Chernov & Lesort). Ellipse: Fitzgibbon direct LSQ via the numerically-stable **Halir-Flusser** reformulation. Polygon: RDP + regularize. | **Confirm `fitEllipse` uses Halir-Flusser** (the production standard). For **gap-closed PARTIAL arcs**, fit the circle with **Taubin/Pratt, not Kasa** (Kasa biases on short arcs → seam/center drift). |
| **Reported snap bugs** (side-count 5→"Polygon(8)", overshoot tail, circle seam) | These are corner-detection + weld-tolerance **calibration**, not architecture. | Calibrate; adopt IStraw if line+arc keep mis-cornering. For a true regular n-gon where the primary pass smears, keep a **finer-epsilon recovery pass** gated on equal-edges/equal-turns (PaleoSketch regular-polygon gate). |
| **"Gap slider can't close a visibly-open gap"** | **Blender Grease Pencil's three vector modes** — endpoint-connection, tangent-extension, curvature-extension — + a raster morphological-close fallback for tangled ink. | **DECOUPLE gap-closing from snap.** Build a STANDALONE vector gap-closer: endpoint-connection (weld two ends within the gap-slider distance), tangent-extension (extend smoothed-tangent ends until they cross), raster morphological-close fallback for tangled multi-stroke ink. **The gap slider maps directly to Blender's `extension_distance`/endpoint threshold.** |
| **One closed loop → two consumers** | — | That gap-closed loop is the single **closed-loop PRODUCER** feeding two CONSUMERS: **polygon-clipping fill (KNOWN-SOLUTIONS.md §1A)** AND **the 3D extrusion/inflation path (Section 2)**. One producer, two pipelines. |

### Section 3 — TOP RECOMMENDATION
**No rewrite.** (1) Calibrate corners (IStraw arc-check only if line+arc keep mis-cornering) and lock
the ellipse fit to **Halir-Flusser**; use **Taubin/Pratt** (not Kasa) for gap-closed partial arcs.
(2) **Build the standalone Blender-Grease-Pencil-style vector gap-closer** (endpoint-connect +
tangent-extend + raster fallback), with the **gap slider mapped to the extension/endpoint distance**.
(3) Wire that gap-closer as the **single closed-loop producer feeding both polygon-clipping fill
(§1A) and the 3D path (Section 2)**. Keep the no-snap honesty and the regular-polygon
finer-epsilon recovery gate.

### Section 3 citations (real)
- $-family: http://depts.washington.edu/acelab/proj/dollar/ · …/pdollar.html · …/qdollar.html · https://faculty.washington.edu/wobbrock/pubs/mobilehci-18.pdf · https://dl.acm.org/doi/10.1145/2388676.2388732
- PaleoSketch: https://www.researchgate.net/publication/221607733_PaleoSketch_Accurate_primitive_sketch_recognition_and_beautification · https://dl.acm.org/doi/pdf/10.1145/2030365.2030369
- ShortStraw/IStraw: https://www.sciencedirect.com/science/article/abs/pii/S0097849310001044 · https://stars.library.ucf.edu/facultybib2010/953/ · Sezgin: https://rationale.csail.mit.edu/publications/Sezgin2001Sketchbased.pdf
- Ellipse fit: https://cseweb.ucsd.edu/~mdailey/Face-Coord/ellipse-specific-fitting.pdf · https://autotrace.sourceforge.net/WSCG98.pdf
- Circle fit (Kasa bias): https://arxiv.org/pdf/cs/0301001 · https://rdrr.io/cran/conicfit/man/EllipseDirectFit.html
- Gap closing: https://www.davepagurek.com/blog/blender-flood-fill/ · https://community.mypaint.app/t/floodfill-gap-closing-demo/1215 · http://tavmjong.free.fr/INKSCAPE/MANUAL/html/Bucket-Gap.html · https://wiki.inkscape.org/wiki/index.php/A_better_Bucket_Fill_tool_fill
- Morphological close: https://homepages.inf.ed.ac.uk/rbf/HIPR2/close.htm · https://mzucker.github.io/2018/05/14/maptrace.html
- Procreate QuickShape: https://help.procreate.com/procreate/handbook/guides/quickshape · OneNote Ink to Shape: support.microsoft.com (create-diagrams-with-shape-recognition)

---

## SECTION 4 — NPR + SMART/ML LAYER

Headline: **this research VALIDATES our system rather than redirecting it.** coverage.ts
(Murray-Davies + 8-band TAM) and the rough.js fills are textbook-correct; the ML go-live is
*correctly deferred behind honesty gates*. One genuine upgrade (Bridson dots) is a stretch slot.
Key files: `src/app/lib/smart/coverage.ts`, `src/app/lib/smartHachure/renderRegion.ts` (dot path +
caps), `src/app/lib/smartHachure/classifier.ts` (rule chain), `learnedProvider.ts`,
`tools/ml/train-region-classifier-signals.mjs`, `datasets/smart-layer.signals.model.json`,
`datasets/QUARANTINE.md`. (Honors `feedback_actual_ml_not_fake`: real dataset, real split, real
metrics — the ML must be real, never an if-statement dressed up.)

### How the leading tools do it
**rough.js** (Excalidraw, Mermaid, draw.io, **our app** — roughjs 4.6.6) is the de-facto hand-drawn
fill engine: every primitive → polygon path → fill via **scan-line polygon hachure** (rotate by
`hachureAngle+90`, sweep horizontal rows at `hachureGap`, intersect polygon edges, emit segments,
rotate back); cross-hatch = two passes 90° apart; **dots = the same scan grid, one jittered dot per
cell** (so the grid is visible at low density and the field *masses* to solid at high density). It
does NOT do blue-noise or tonal-art-maps — tone is purely gap/weight. The academic NPR lineage real
tools draw from: **Tonal Art Maps** (Praun et al., SIGGRAPH 2001) for tone→nested-hatch with
scale/temporal coherence; **Secord weighted Voronoi stippling** (NPAR 2002) and **Bridson
Poisson-disk** (2007) for non-grid tone-accurate dots. On the ML side the mainstream production
pattern is the **hybrid**: a rule engine for transparent cases + a learned model that activates only
where rules abstain, with the learned confidence **post-hoc calibrated** (Platt/isotonic, validated
by reliability diagram + ECE).

### Problem → proven solution → our recommendation

| Problem | Proven solution + citation | Our recommendation (mapped) |
|---|---|---|
| **Tone → hatch density with coherence** | **Tonal Art Maps** (Praun, Hoppe, Webb, Finkelstein, SIGGRAPH 2001) — a sequence of nested-superset hatch images per tone level, mipmapped, blended at render. | We already implement the *spirit*: coverage.ts's 8-band L* quantization (`COVERAGE_BANDS`, `bandIndexForDarkness`, `tamCell` 0–7, verified coverage.ts:97–111) IS a TAM cell index, and the 3D hatch shader reads the same band table as uniforms (one math, two renderers). **Keep it; cite Praun 2001 in 09-LOCKED-MODEL** so the provenance is on record. We get band-quantization, not literal cross-band stroke coherence (we synthesize via rough.js) — acceptable for the makeathon. |
| **Source darkness → ink coverage** | **Murray-Davies** inverse `coverage = (R_paper − R_target)/(R_paper − R_ink)`. | Already done and cited (coverage.ts:86 cites Murray-Davies + CIELAB cube-root R_target=L³). **Keep.** Note: coverage **saturates to 1.0 above darkness ≈ 0.63** (verified coverage.ts:138–139 SATURATION NOTE) — that's a property of the math; the `COVERAGE_LEGIBLE_DENSE_CAP` in renderRegion.ts is **our own legibility policy, NOT in the Murray-Davies literature** — keep it documented as such (a sensible engineering ceiling, honestly labeled). |
| **Hand-drawn fill grammars** | **rough.js** scan-line hachure (multi-contour, so concave + holes work) + grid-jitter dots. | We already use it (roughjs 4.6.6). Scan-line hachure handles concave + holes via multi-contour — good. The **grid-jitter dots are the weakest grammar** (visible grid + massing); the dots-path perf bomb and the "Stipple renders as hachure" bug live here → next row. |
| **Non-grid tone-accurate dots (stipple/newsprint)** | **Bridson Fast Poisson-Disk** (SIGGRAPH 2007, O(n), ~40 lines, no dep) — adaptive radius by local darkness; vs **Secord weighted Voronoi/Lloyd** (NPAR 2002, higher quality but iterative → too slow for live re-render). | **The one genuine UPGRADE (stretch slot, AFTER bug-fixes):** replace rough.js grid-jitter dots with **adaptive Bridson Poisson-disk** for stipple/dots/newsprint only. Kills the visible grid + massing, **fixes the 19.7M-char perf bomb honestly** (point count bounded by construction), and **density-by-radius drops straight onto our Murray-Davies target coverage** (coverage → dot-area fraction → r). ~40 lines, zero new deps, parallel to rough.js for those 3 styles. |
| **When to trust rules vs a learned model** | The **hybrid rule-engine + learned-classifier** pattern (rules first; learned fills the abstain gap; learned confidence calibrated). | **Exactly our architecture.** `classify()` walks `[ruleEngineProvider, learnedProvider]` — rules first (carry `firedRules` provenance), learned second, abstaining (returns null) below `minConfidence`. The signals-only v2 model is leakage-safe (shape-grouped split by `svgHash`), honestly scored: **92.7% held-out acc / 0.881 macro-F1** vs rules 77.5% on the same signals; 90.5% on the 84 HARD cases. |
| **Go-live: is it wired?** | — | **NOT YET WIRED — correctly.** Verified: index.ts:194 is `const providers = opts.providers ?? [ruleEngineProvider];` (rules only). Three honesty gates remain before flipping it to `[ruleEngineProvider, learnedProvider]`: (1) **golden v3 re-bless** (the wash-darkness fix moved `darknessL` on 345/1394 regions after golden v2 was blessed — caps both baselines); (2) the **dataset is QUARANTINED** (datasets/QUARANTINE.md, zero new rows until live-verified honest labels); (3) labels share an ancestor with the rule engine, so **held-out-unseen-shapes is the only honest claim** — never "replaces the rules." Point `learnedProvider.ts` at the **v2 signals-only artifact** (the v1 3-feature one is leaky, must not ship). |
| **Make the abstention threshold mean something** | Post-hoc **calibration** — Platt scaling (sigmoid) or **isotonic regression** (non-parametric, ~30 lines, usually better ECE/Brier for selective prediction), validated by reliability diagram + **ECE**. | Before flipping the provider chain, add **isotonic calibration + a reliability-diagram/ECE check** so `confidence ≥ X ⇒ accuracy ≥ X` and the section-13 auto-apply-vs-auto-offer band sits on real numbers. Pure pre-wiring polish — only worth it once the model is actually being promoted. |

### Section 4 — TOP RECOMMENDATION
**Don't rip anything out — this validates the foundations.** In priority order: (1) Cite Praun 2001
+ Murray-Davies in 09-LOCKED-MODEL; keep the `COVERAGE_LEGIBLE_DENSE_CAP` documented as *our*
legibility policy, not Murray-Davies. (2) Keep the **ML go-live deferred** until **golden v3
re-bless** lands (the 345-region wash-darkness drift is the single biggest correctness item and caps
both baselines); when wiring, set index.ts:194 to `[ruleEngineProvider, learnedProvider]` pointed at
the **v2 signals-only** artifact, and add **isotonic calibration + ECE** first. (3) The one genuine
upgrade worth a stretch slot AFTER the bug-fixes: **adaptive Bridson Poisson-disk dots** for
stipple/dots/newsprint — fixes the grid artifacts + the perf bomb honestly, density-by-radius maps
onto Murray-Davies, ~40 lines, zero deps. (4) Honesty discipline: the learned model beats rules ONLY
on held-out unseen shapes against partly-shared-ancestry labels — never let demo/docs upgrade that to
"replaces the rule engine"; keep the dataset quarantine until labels are honest live-visual.

### Section 4 citations (real)
- TAM: https://artis.inrialpes.fr/Members/Cyril.Soler/DEA/NonPhotoRealisticRendering/Papers/p581-praun.pdf · https://history.siggraph.org/learning/real-time-hatching-by-praun-hoppe-webb-and-finkelstein/
- rough.js: https://github.com/rough-stuff/rough/wiki · https://github.com/rough-stuff/rough/blob/master/src/fillers/scan-line-hachure.ts · …/src/fillers/dot-filler.ts
- Stippling: https://www.cs.ubc.ca/labs/imager/tr/2002/secord2002b/secord.2002b.pdf · https://www.cs.ubc.ca/~rbridson/docs/bridson-siggraph07-poissondisk.pdf · https://extremelearning.com.au/an-improved-version-of-bridsons-algorithm-n-for-poisson-disc-sampling/
- Stroke-based rendering by example: https://www.research.autodesk.com/app/uploads/2023/03/interactive-hatching-and-stippling.pdf_reccx3S28mr0uPOsn.pdf · survey https://arxiv.org/pdf/2506.00870
- Hybrid rules+ML: https://www.techtarget.com/searchenterpriseai/feature/How-to-choose-between-a-rules-based-vs-machine-learning-system · https://nlathia.github.io/2020/10/ML-and-rule-engines.html
- Calibration: https://www.kdnuggets.com/a-deep-dive-into-calibration-of-language-models-platt-scaling-isotonic-regression-temperature-scaling · https://fastml.com/classifier-calibration-with-platts-scaling-and-isotonic-regression/ · https://arxiv.org/pdf/2601.04982

---

## How Part 1 and Part 2 fit together

| If you're working on… | Read |
|---|---|
| Filling a region (incl. gaps, nested, donut holes) | **KNOWN-SOLUTIONS.md §1A/§1B** + the §4 refactor path |
| Embossed relief / plush inflation from a silhouette | **KNOWN-SOLUTIONS.md §1C/§1D** + **Part 2 §2** (deeper option space + AI tier) |
| Cleaning a noisy silhouette / detecting nested regions | **KNOWN-SOLUTIONS.md §1E** + **Part 2 §3** (the gap-closer that produces the loop) |
| The known-bugs inventory & status | **KNOWN-SOLUTIONS.md §2** |
| Insert / reshape / select / shape-picker / auto-detect | **Part 2 §1** |
| Recognition calibration + the shared gap-closer | **Part 2 §3** |
| Fill grammars, TAM/coverage, the smart/ML layer | **Part 2 §4** |
| Many objects in 3D · live capture · export | **Part 2 §5A–5G** |
| Desk pan bounds · viewport culling under `scale()` · 3D streaming | **Part 2 §5H/§5I** (+ DESK-RENDER-FIXES-PLAN.md) |

**The throughline:** Part 2 §3's standalone gap-closer produces ONE closed loop that feeds BOTH the
Part 1 §1A polygon-clipping fill AND the Part 2 §2 inflation path — one producer, two consumers.

---

## SECTION 5 — MANY-OBJECTS-IN-3D · LIVE CAPTURE · EXPORT · PAN/ZOOM/CULL (IMPLEMENTED + VERIFIED, 2026-06-14 → 06-18)

Unlike §1–4 (pre-build research), these were **shipped + verified**. Same format —
problem → proven solution → where it lives. Read before touching the 3D mount, captures, export, or
the desk pan/zoom/cull/3D-streaming path. §5A–5G are the 2026-06-14 3D-canvas batch; **§5H/§5I are the
2026-06-18 desk pan-bounds / viewport-culling / 3D-streaming fixes** (the proven forms behind
`DESK-RENDER-FIXES-PLAN.md`).

### 5A — Flipping MANY objects to 3D at once without the WebGL-context crash
**Problem:** each `Stroke3DScene` / `DeskObject3DMount` / `Live3DMount` is its OWN `<Canvas>` = one
WebGL context. A browser caps live contexts (~16); flipping a whole desk/drawer/shelf to 3D exhausts
them → `CubeCamera.update` / context-lost crash. A first-N cap ("only 10 in 3D") is the trap — it
looks broken when you zoom out (flat 2D objects beside 3D ones) and does nothing for the grids.
**Proven solution:** **drei `<View>`** — ONE `<Canvas>` per surface, N scissored viewports
(`gl.setScissor` per object). Context count is always 1; no cap. (pmndrs/drei View docs; verified
working in our drei 9.122.)
**Where it lives:** `canvas3d/Stroke3DScene.tsx` exports `Stroke3DContents` (scene internals usable
inside `<Canvas>` OR `<View>`). `canvas3d/MultiStroke3D.tsx` = `Shared3DCanvas` (the one canvas +
`<View.Port/>`) + `Object3DView` (the per-object inline `<View>` slot). `DeskObject3DMount.tsx`
exports lazy `Shared3DOverlay` + `LiveObject3DSlot`. Wired in DeskPage (desk) + DrawerPage
(drawer+shelf). VERIFIED via real-Chrome capture: desk 20+ objects + drawer 6, `canvases:1`, no crash.

### 5B — Per-object rotate in a shared-View canvas (the event-routing gotcha)
**Problem:** the shared canvas must be `pointerEvents:none` (so it doesn't block the page) → drei's
implicit `events.connected` is unreliable across N views → TrackballControls silently get no events
(rotation dead). Also the react-router `#1053` bug (controls die after nav) bites a persistent
app-root canvas.
**Proven solution / recommendation:** (a) mount the shared canvas **per page** (consumer unmounts on
route change) — sidesteps #1053. (b) bind each view's controls to **its own slot element explicitly**:
`<View ref={setSlotEl}>` (HtmlView ref = the slot div) → pass it as `controlsDomElement` →
`<TrackballControls domElement={controlsDomElement}>`. **STATUS: implemented, NOT yet verified** —
automated drag can't test it (see 5C). Needs a real-mouse test.

### 5C — Capturing real WebGL screenshots/video of the live app (headless can't)
**Problem:** WebGL does NOT render in a headless browser here; there's no playwright/puppeteer
installed; synthetic drags (page.mouse / CDP / dispatched PointerEvents) do NOT trigger three.js
controls or even desk-pan (no real captured pointer).
**Proven solution:** drive **real Google Chrome** (headed = real GPU → WebGL renders) via
`puppeteer-core` (`npm i puppeteer-core --no-save`, `executablePath` = `/Applications/Google
Chrome.app/...`, `headless:false`). Clicks + DOM work; `page.screenshot` captures the canvas; frames
→ mp4 via `ffmpeg`. Personal-space surfaces are DB-gated/empty → mock the supabase `/rest/v1/doodles`
fetch via `page.evaluateOnNewDocument` (same-origin Response, no CORS). Downloads: CDP
`Page.setDownloadBehavior`. **Drag/rotate/pan can't be driven** — needs real OS mouse (`cliclick`,
which needs **Ghostty** Accessibility permission — a GUI grant). Scripts: `/tmp/dd-capture-*.mjs`,
`/tmp/dd-glb-verify.mjs`, `/tmp/dd-cliclick-rotate.mjs`.

### 5D — Exporting a doodle as a real 3D model (.glb)
**Problem:** need a downloadable 3D file; three's `GLTFExporter` uses `FileReader` → throws in Node
(browser-only) so it can't be node-tested.
**Proven solution:** `lib/exportGlb.ts` (lazy) builds the SAME watertight `buildPoolSolidGeometry`
mass → one-mesh scene → `GLTFExporter.parse(scene, …, {binary:true})` → Blob download. Builders come
from `geometry3d/strokeTo3d` directly (NOT Stroke3DScene) so it pulls no drei. VERIFIED end-to-end via
real-browser download → valid 126KB glTF (magic `glTF`).

### 5E — Two SVG exports are different: framed card vs raw doodle
**Problem:** "export the SVG" is ambiguous — the card frame (paper+pool) vs just the drawing.
**Proven solution:** `exportCard.ts` has both: `buildCardSvgString`/`exportCardSvg` (framed card) and
`buildDoodleSvgString`/`exportDoodleSvg` (RAW — baked colors, cropped to the box, transparent, no
frame). The Export ▾ menu uses card→PNG and raw→SVG. Verified: raw .svg has no `dd-pool` frame.

### 5G — Dots/Stipple perf-bomb: the CAP must cover the extra LAYERS too (OFAT 2026-06-15)
**Problem:** Stipple (→ fillStyle 'dots') emitted a **10.4M-char `<path>`** that freezes the tab — found by the live OFAT style sweep. The U3 area pre-estimate (`pathBBoxArea`) mis-parses arc/curve command params as coords so it under-shoots and skips the gap-raise.
**Proven solution (renderRegion.ts `renderHachureFamily`):** a post-generation **char-length backstop** on the dots group (regenerate with a larger gap until ≤300K) — but CRITICALLY also **propagate the raised gap to `fillOpts.hachureGap`** so the EXTRA dot LAYERS (stipple uses `layers:2`) inherit the bounded gap. Without that, the base group is capped but `tonal-layer-1` re-renders at the original tiny gap and ships the multi-MB path (the diagnosed culprit). Verified: 10.4M → 298K. Reusable OFAT harness: `/tmp/dd-ofat-styles.mjs`.

### 5F — A shared-canvas overlay must bind to the SURFACE, not the viewport
**Problem:** a `position:fixed` full-viewport shared canvas paints 3D objects OVER the side panels /
chrome ("objects covering UI").
**Proven solution:** `position:absolute; inset:0` inside the surface container (desk `<main>` /
drawer `<main>`), which is a flex SIBLING of the panels and `position:relative` (+ `overflow:hidden`
on the desk). The canvas + every scissored view is then clipped to the surface and auto-resizes when
panels hide/show. Verified panel-open AND panel-collapsed.

### 5H — Pan bounds + viewport culling under a parent `scale(zoom)` transform (2026-06-18, Sebs-verified)
Two related fixes for a pan/zoom canvas where the whole object layer sits under ONE parent CSS
`scale(zoom)` transform and pan is `translate(panX,panY)`. World↔screen convention throughout:
**`screen = world·zoom + pan`** (so `world = (screen − pan)/zoom`). Both live in `DeskPage.tsx`.

**Problem A — pan bounds shrink as you zoom in.** A viewport-box leash (clamp pan to a `vw×vh` box)
makes the reachable *desk-space* extent scale as **1/zoom** — zoom in and the world area you can pan
to collapses, so an object you saw zoomed-out becomes unreachable zoomed-in.
**Proven solution (d3-zoom content-bbox `constrain`/`translateExtent` model):** clamp the pan against
the CONTENT's world bbox, not the viewport. Compute `objectsBounds()` = world bbox over all placed
objects, padded by a fixed **world-unit** margin (`PAN_PAD = 800` world px) so you can wander onto
empty paper but always pan back. With viewport `W×H`, clamp per axis: if padded content is wider than
the viewport, `panX ∈ [W − cx1·zoom, −cx0·zoom]`; else **center** it. Reachable area is now a function
of the CONTENT, not `1/zoom` → zoom-correct at every zoom. Ref: d3-zoom `constrain`/`translateExtent` —
https://d3js.org/d3-zoom.
**Where it lives:** `DeskPage.tsx` ~`:765-815` — new `objectsBounds()` + rewritten `leashCamera()`,
applied on every camera set. **Sebs verified ✅** ("1 is good").

**Problem B — edge objects vanish while still on-screen (and 3D won't paint) under `scale()`.** Using
CSS `content-visibility:auto` per object to skip off-screen paint is the trap: its browser
**screen-space** on-screen relevancy heuristic + paint-containment clip are NOT reliable inside a
scaled/transformed ancestor. At `zoom > 1` the intersection math and clip break — boxes that ARE on
screen get judged off-screen and skipped, so edge objects pop out **while in view**. The same skipped
wrappers also host the drei `<View>` 3D slots → they don't paint their 3D either (a mixed/blank 3D
desk). This is documented Chrome behavior for `content-visibility` under `scale`. Ref: WICG
`content-visibility` explainer (the heuristic is screen-space) —
https://github.com/WICG/display-locking/blob/main/explainers/content-visibility.md.
**Proven solution (explicit zoom-aware world-rect DOM cull — the tldraw model):** compute the visible
world-rect YOURSELF from the live camera (`panX/panY/zoom`) + the ResizeObserver'd viewport size + a
**proportional world-unit margin** (a band like `(viewport/zoom)·0.25` or ½-viewport that does NOT
collapse as you zoom): `wx0 = (0 − panX)/zoom − marginX`, `wx1 = (W − panX)/zoom + marginX` (same for
Y). An object whose footprint bbox doesn't intersect that rect gets explicit `display:none` (a `hidden`
prop). Off-screen objects don't paint (the perf win) but stay in DOM/state, and drei `<View>` skips
`display:none` slots so 3D is bounded too. Explicit + zoom-correct, no browser heuristic under
`scale()`. Never cull the dragged/selected id. Ref: tldraw culling/visibility —
https://tldraw.dev/sdk-features/visibility.
**Where it lives:** `DeskPage.tsx` ~`:2986` — per-object `hidden` (`display:none`) computed in the
`objects.map` from the live camera + a ½-viewport margin; replaced the removed
`content-visibility:auto`/`containIntrinsicSize` wrapper style. **Sebs verified "great" ✅.**

**The lesson:** on a `scale()`-transformed canvas, do viewport culling EXPLICITLY in your own
world↔screen math (`screen = world·zoom + pan`, proportional world-unit margin, `display:none`) —
never delegate to `content-visibility:auto`, whose screen-space heuristic + paint clip are unreliable
under the parent transform.

### 5I — "Static 3D set + display:none cull" beats per-camera 3D streaming (2026-06-18, shipped; Sebs live re-test pending)
**Problem:** to flip a whole desk to 3D, an obvious approach is to STREAM the set of 3D-active object
ids from the camera — add ids inside a viewport-margin LOAD band, drop them past an UNLOAD band,
recomputed on every camera delta. This churns: (1) off-center objects more than the load-band out
**never flip** (mixed 2D/3D desk), (2) objects whose distance crosses the LOAD/UNLOAD thresholds **pop
in and out** mid-pan, (3) any click that nudges the camera **re-keys the set** → a borderline object's
membership flips → reads as a toggle flickering on click. Tightly-coupling a camera-derived set to
expensive 3D mounts is the anti-pattern.
**Proven solution:** **decouple the 3D-active SET from the camera.** When the desk is globally flipped,
make `threeDIds` a **STATIC set = ALL object ids** (deps `[objects, deskView, deskLens]`, NO camera
term) so it cannot churn, every object flips, and a camera-nudging click can't re-key it. Bound the
paint cost with the **§5H explicit `display:none` cull**, which drei `<View>` already honors (it skips
`display:none` slots) — so "load all ids" costs nothing for off-screen objects. This is the same
principle as drei `<View>` + viewport scissor culling (§5A): let ONE cheap, camera-correct cull gate
paint, and keep the *membership* set stable. Refs: tldraw culling —
https://tldraw.dev/sdk-features/visibility; d3-zoom (camera math) — https://d3js.org/d3-zoom.
**Where it lives:** `DeskPage.tsx` ~`:1540` — replaced the camera-keyed streaming effect with the
static-on-global-flip set. tsc-clean. **STILL OPEN: awaits Sebs's live re-test on `/desk?demo=1&n=80`**
(per the live-not-headless rule — WebGL doesn't render headless).

---

## 6 — Image upload + AI-mesh modal (2026-06-16)

### 6A — AI-mesh "empty 3D well" was a CAPTURE-TIMING artifact, not a render bug
**Problem:** after the "✨ Generate AI 3D" chip reached "✓", the modal's 3D well looked EMPTY in the
screenshot — looked like HardMesh wasn't rendering.
**Diagnosis (the lesson):** the chip flips to "✓" the instant `hardMeshUrl` is SET, but `useGLTF` then
still has to FETCH + parse the ~2MB GLB from Supabase Storage. With `<Suspense fallback={null}>` the
well shows nothing while it streams, so a screenshot fired at "✓" catches a blank. Isolate render from
the 84s/$0.02 generation with a temp `window.__forceHardMesh(url)` hook that injects a known-good cached
GLB → HardMesh rendered perfectly (proof `/tmp/dd-shots/forcemesh-well.png`). Cached GLBs verified valid
(glTF magic, `content-type: model/gltf-binary`, `access-control-allow-origin: *`).
**Proven solution (UX fix):** `Stroke3DScene.tsx` — extract the local form (`builds` + `fillBodies`)
into `localForm` and use it as the Suspense fallback: `{hardMeshUrl ? <Suspense fallback={localForm}>
<HardMesh/></Suspense> : localForm}`. The doodle's own local 3D shows while the GLB streams, then swaps
to the AI mesh on load — no blank well. (HardMesh's own doc intended `fallback={localForm}`.) Verified:
early frame = local form, final = AI mesh; 5-object native-3D regression clean.

### 6B — Image upload → trace → OUR system: route by file type, reuse the SVG path
**Problem:** "Upload image" (PNG/JPG) needs to become a desk object that restyles + flips to 3D like a
drawing — not a foreign artifact.
**Proven solution:** a traced image IS just SVG markup, so the whole downstream pipeline is reused.
`imageToSvg(file)` (lib) does validate → Quiver Edge trace → `simplifyToSketch` → sanitize, returning
clean line-art in our register. In each surface's `handleFileChange`, ROUTE BY FILE TYPE
(`isRasterImageFile(file)` → `imageToSvg`; else `prepareSvgUpload` + `simplifyToSketch`), then hand the
markup to the SAME `setUpload`/`acceptUploadMarkup` path. NOTE: the two surfaces are SEPARATE
(`project_desk_doodles_draw_panel_vs_desk_canvas`) — DrawSurface (/canvas, real input modes) AND
DrawPanel (/desk, own file input + `upload` state) each need wiring. In DrawPanel, define
`isUploadInput = upload-svg || upload-image` and use it at EVERY consumption site (preview, backdrop,
staging, 3D-derive, size-cap) since a traced image is svg from there on. Remove the "coming soon"
honesty gates (DrawSurface gate + DrawPanel's separate `input==='upload-image'` pane gate). Verified
live both surfaces, 2D restyle + image→3D, SVG upload regression-free (rose).

### 6C — Edge-fn cache must be WRITTEN, and the result fetch needs the contentHash
**Problem:** `image-to-3d` read `mesh_cache` but never WROTE it → every regen of the same doodle paid
again. The result GET also didn't carry the contentHash to key the write.
**Proven solution:** client `hardPath.ts` `fetchMeshResult` appends `&contentHash=` to the result URL
(backward-compatible — an older deployed fn ignores it); edge fn reads it and `writeCache()` upserts
`mesh_cache(content_hash, glb_url, provider, file_size)` after `downloadAndRehost` (best-effort, never
fails the result; `onConflict: 'content_hash'`). ⚠️ Needs `supabase functions deploy image-to-3d` +
the `mesh_cache` table to activate.
