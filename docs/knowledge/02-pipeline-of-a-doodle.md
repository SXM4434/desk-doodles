# 02 — The Pipeline of a Doodle

**In one sentence:** A doodle starts as raw pointer events, lives as an unstyled preview until you press Done, then gets re-rendered from scratch by the style pipeline (wobble, multi-stroke, endpoints) and — for the four rough-family styles — by Smart Hachure, which classifies each region and draws outline + fill marks as brand-new SVG elements.

---

## Plain language

Think of the whole system like a non-destructive workflow in Photoshop or C4D: **your original drawing is never painted over — it's kept clean, and every styled result is a freshly generated copy.** Change a slider, throw the copy away, generate a new one. That's the single most important idea in this page. The clean stroke data is the "live material"; every styled render is a "bake." Re-bake is cheap, so we re-bake constantly.

### Stage 1 — Capturing your hand (pointer → points)

When you press down on the canvas, the browser fires pointer events with screen-pixel coordinates. But the canvas is an SVG with its own 800×600 coordinate system (its `viewBox`), and the SVG is usually displayed at some other size on screen. So every event goes through an **inverse camera projection**: exactly like unprojecting a screen-space click back into world space in a 3D viewport. The code takes the screen point, multiplies it by the inverse of the screen transform matrix (`getScreenCTM().inverse()`), and lands in viewBox coordinates. Each captured point is `[x, y, pressure]` — pressure comes from the stylus if you have one, else 0.5.

### Stage 2 — The live preview (perfect-freehand polygon)

While you drag, the in-progress stroke renders through a library called **perfect-freehand**. It doesn't draw a thin line — it computes a variable-width *outline polygon* around your gesture (thicker where you pressed harder, tapered at the ends) and fills it solid. Like a brush tip in Photoshop with pressure-driven size: the "stroke" is actually a filled shape. While dragging it renders at 50% opacity; on pen-up it joins the preview pool at full ink.

Critically, **pen-up does not commit anything**. Your rule, recorded in the code: "if I stop drawing and lift it shouldn't auto-add the object until I choose to be done." Strokes pile up as raw perfect-freehand polygons — what you drew, exactly, unstyled.

### Stage 3 — Done: the polygon → polyline swap

Pressing **Done** flips one boolean (`committed`), and the strokes re-render through the style pipeline. But first there's a quiet, load-bearing conversion: the committed strokes are NOT the filled perfect-freehand polygons anymore. They become **stroke-only polylines** — a plain `M x y L x y L x y…` path with `fill="none"` and a uniform 3px stroke.

Why throw away the nice variable-width ink? Because Smart Hachure's outline stage *filters out anything with a real fill* (filled paths are treated as tonal regions to be replaced with hachure marks, not outlines to be jittered). A filled polygon would be eaten by the pipeline. The trade is explicit in the code comments: lose the variable-width character, gain transformability — wobble, jaggedness, multi-stroke all need a centerline polyline to operate on, not an outline blob. (Think: you can deform a spline; you can't meaningfully deform a baked alpha stamp.)

### Stage 4 — SvgStyleTransform: the two-layer non-destructive wrapper

`SvgStyleTransform` is a React component that wraps any SVG. Internally it keeps **two divs**: a hidden one holding your clean source SVG, and a visible one holding a DOM clone that gets transformed. Original layer preserved underneath, effects rendered on a duplicate on top — the smart-object pattern. Every time a slider or style changes, the clone is rebuilt from the clean source.

The clone then routes by style:

- **Smart Hachure path** (only when `?smartHachure=1` is in the URL — the canvas page force-enables this — AND the style is one of the four rough-family styles: rough-handdrawn, sketchy, bold-ink, stipple).
- **Legacy rough path** for rough-family styles without Smart Hachure.
- **Risograph** (clone twice, offset + recolor the second copy, `mix-blend-mode: multiply` — literally a blend-mode misregistration print).
- **Wireframe** (replace each child with its bounding box — the engineering-drawing register).
- Finally **texture** is applied on top: SVG filters built from `feTurbulence` noise (light/heavy/chalky/paper-tooth/etc. are preset noise recipes — same mental model as procedural noise textures in C4D), plus a real halftone dot-screen mask for newsprint.

### Stage 5 — The hand-feel re-draw (how a path becomes "drawn")

Inside the transform, every SVG element is dispatched by tag. Rects, circles, ellipses, lines, and polygons have dedicated point-builders. Your drawn doodle arrives as a `<path>` of straight line segments, which takes the most interesting route:

1. **Sub-path split.** The `d` string is walked token by token; every `M` command starts a new sub-path rendered independently. (An auto-traced SVG can contain 100+ sub-paths; without the split, the renderer drew connector curves *between* them — the "rose chaos" bug.)
2. **Decimation (RDP).** Drawn input is dense — a heart gesture is ~80 vertices. The wobble math was calibrated for sparse shapes (2–6 vertices). **Ramer-Douglas-Peucker** simplification is polygon reduction, same idea as a decimation modifier in C4D: drop every point that deviates less than ε=3px from the line through its neighbors. A heart collapses to ~15–20 anchors that still hold the shape. Sparse input skips RDP entirely (gated on >15 vertices), so curated audit shapes are untouched.
3. **Polygonal vs. curve dispatch.** After RDP, the anchor count *is* the intent signal: **≤8 anchors → you drew a polygon** (rectangle, triangle, diamond) and it renders with straight Bézier segments per side so corners stay crisp; **9+ anchors → you drew a curve** (heart, blob, spiral) and it renders as a **Catmull-Rom spline** — a curve interpolated smoothly *through* every anchor, like a B-spline through points in C4D, with corner detection so a heart's V-bottom stays sharp while its lobes stay round.
4. **The modifier stack** then applies, in order: `endpointBehavior` moves the anchors (protrude/long-overshoot extend line ends like a sketcher overshooting a corner; kink pushes every anchor in a random direction), an **arc-length wobble field** displaces the curve at a ~35–90px wavelength (low-frequency noise along the path — flowing hand-wander, not per-vertex jitter), `bowing` bends each segment perpendicular to its chord, `curveDamp` tightens it back, and `jaggedness` optionally injects alternating perpendicular zigzag points (the "splinter" toggle — independent from wobble: wobble is *how far* the line wanders, jaggedness is *how sharp* the wandering reads).
5. **Multi-stroke** renders the whole thing N times (1–8 layers) with different seeds — like duplicating a layer and nudging it. Each extra layer gets a stable pixel nudge or a sketching-style transform: cross-rotate spins layers around the shape's centroid, parallel-pass scales concentric copies, loose-overlap drifts them. Layer 0 is drawn at 1.25× stroke width (the "primary" pass); ghosts at 1.0×.

Everything is **seeded random** — same seed in, same wobble out. No `Math.random()`. That's what makes renders stable across re-renders (deterministic procedural noise, like locking a noise seed in C4D instead of regenerating every frame).

### Stage 6 — Smart Hachure (the rule engine on top)

For the four rough-family styles with Smart Hachure on, the orchestrator runs a per-region pipeline that should feel exactly like a **smart material in Substance Painter**: scan the geometry to produce maps (signals), let masks decide which treatment applies where (classify), then paint each region with its assigned material (render).

For each top-level child of the SVG:

1. **Signals** — geometry + tone measurements (area, bbox, fill darkness, containment in siblings, z-order) extracted *before* any mutation, because `getBBox()` returns zeros on removed elements.
2. **Classify** — a **rule engine** (explicitly not ML — see Honest status) assigns a tonal role with a confidence score (threshold 0.7).
3. **Treatment** — the role maps to a fillStyle + gap + weight. Your fillStyle dropdown does a *narrow* override here: it swaps which mark grammar fills the regions the classifier already chose to fill — it never forces fills onto regions classified as paper/frames/text. Tiny regions (<40px²) clamp to solid because coverage statistics on something that small are noise.
4. **Outline** — the same `transformElement` hand-feel pipeline from Stage 5 runs with fillStyle suppressed, producing the jittered contour. Output is filtered to stroke-only elements (the fill-eating filter that forced the Stage 3 polyline swap).
5. **Fill marks** — hachure/cross-hatch/dots are generated for the region, with density driven by **source darkness**: the fill color is converted to a 0–1 darkness score (CSS-token tiers are hand-mapped; literal hex/rgb/hsl colors get real WCAG relative luminance — converting a color map to a grayscale density map, the way you'd derive an AO or roughness map from albedo). Dark region → tight gap, heavy lines. Faint wash → sparse marks. White → nothing.
6. **Replace** — the original child is removed and replaced by `[fill marks] + [outline]`, fills painted first so the contour sits on top (fixed layer-stack order, fills under linework). Every generated element gets `data-smart-*` attributes stamping its role, confidence, and treatment — so DevTools can tell "no hachure rendered" apart from "hachure rendered but invisible."

### The upload variant

Upload SVG skips Stages 1–3 entirely. The file is read as text, lightly **sanitized** (strip `<script>` tags and inline `on*=` event handlers so an uploaded file can't execute code), the `<svg>…</svg>` block is regex-extracted, and the markup is injected into the page inside the same `SvgStyleTransform` wrapper. From Stage 4 on, the pipeline is identical — that's the architectural point: *drawn and uploaded input converge into one styled-render path.*

Two upload-specific differences downstream:
- Uploaded SVGs contain arbitrary element types (rects, circles, groups, curved paths), so the full per-tag dispatch matters. Paths with real curve commands (`C/Q/S/T/A`) can't be corner-walked; they're sampled by arc length (`getTotalLength`/`getPointAtLength` — sampling a spline at fixed intervals) into a polyline first.
- Uploaded fills are literal colors (`#c84` not `var(--dir-text-primary)`), which is exactly what the WCAG-luminance branch of the darkness parser exists for.

### Diagram — the full journey

```
DRAW PATH                                     UPLOAD PATH
─────────                                     ───────────
pointer event (screen px)                     .svg file picked
   │  inverse CTM ("unproject")                  │  read text
   ▼                                             ▼
[x, y, pressure] in viewBox coords            sanitize: strip <script>, on*=
   │                                             │  regex-extract <svg>…</svg>
   ▼                                             ▼
LIVE PREVIEW                                  raw markup injected
perfect-freehand polygon                         │
(variable-width, filled, 50% while drag)         │
   │  pen-up → preview pool (still raw)          │
   │  ... more strokes ...                       │
   ▼                                             │
[ DONE ]                                         │
   │  strokeToPolylinePath:                      │
   │  filled polygon → stroke-only M/L path      │
   └───────────────┬─────────────────────────────┘
                   ▼
        ╔═══ SvgStyleTransform ═══╗
        ║ clean SVG (hidden)      ║   ← live material, never mutated
        ║ DOM clone (visible)     ║   ← the bake, rebuilt per slider change
        ╚═══════════╤═════════════╝
                    ▼
     style dispatch (per active style)
     ├─ Smart Hachure (4 rough styles + ?smartHachure=1)
     │     per region: signals → classify (RULE ENGINE)
     │     → treatment → outline via transformElement
     │     → fill marks via renderRegion
     │     → replace child with [fills]+[outline]
     ├─ legacy rough  (applyRoughTransform)
     ├─ risograph     (offset clone + multiply blend)
     └─ wireframe     (bbox per child)
                    ▼
     transformElement per element (the hand-feel core)
     <path>: sub-path split → RDP ε=3 (if >15 verts)
       → ≤8 anchors: straightBezierPath (polygon intent)
       → 9+ anchors: catmullRomPath (curve intent)
     then: endpointBehavior → wobble field → bowing/curveDamp
       → jaggedness → multi-stroke × N seeded layers
                    ▼
     applyTexture: feTurbulence filter recipe
       (+ newsprint halftone dot mask)
                    ▼
              FINAL SVG on canvas
```

---

## The design — why it's built this way

**Preview ≠ committed render.** The biggest UX decision in the file: strokes stay raw until Done. Two reasons. First, your explicit call ("don't auto-add the object when I lift the pen") — multi-stroke doodles need multiple gestures before they're *one object*. Second, it keeps the expensive pipeline (clone + classify + re-render) off the hot drawing path; while you draw, the only work is a perfect-freehand polygon per frame.

**Why two stroke converters exist.** `strokeToPolygonPath` (filled, variable-width) is what your hand *looks like*; `strokeToPolylinePath` (centerline, uniform) is what the pipeline *can transform*. The alternative — teaching Smart Hachure to treat perfect-freehand polygons as outlines rather than tonal fills — was rejected because the fill/outline distinction is load-bearing across the whole classifier (filled = region to shade, stroked = contour to jitter). One cheap conversion at commit time beats a special case threaded through the entire engine. The cost (losing pressure-width character) is a known, commented trade; the personal-sketch-style research (Phase 4, parked) is the path to winning it back.

**Why clone-and-replace instead of mutating.** `renderSmartHachure`'s contract is *mutate in place; calling twice doubles the marks* — so the component never hands it the original. The hidden-clean/visible-clone split makes every render idempotent and every slider change fully reversible. This is the baked-vs-live discipline: never bake into your source.

**Why RDP before styling.** The wobble math has a calibrated "voice" tuned against sparse audit shapes. Dense drawn input through the same math produced braided, wiry strokes (wobble wavelength ≈ vertex spacing — like applying a displacement map at the wrong UV scale). Rather than recalibrate wobble for every input density, the input is normalized to the density the engine speaks. The threshold gate (>15 vertices) is what protects the 197-shape audit catalog from any behavior change.

**Why anchor count decides polygon-vs-curve.** Post-RDP anchor count is a remarkably honest intent signal: nobody needs 9 anchors for a triangle, and no curve survives RDP with 5. The rejected alternative was curvature analysis per segment — more code, and it dissolves the crisp either/or (a shape rendered half-spline, half-polygon reads as broken). Known limit, already documented in the simplification research: the ≤8 cliff is a renderer-identity discontinuity, and the planned Simplify slider freezes dispatch at canonical ε to keep it stable.

**Why Smart Hachure regenerates fills instead of restyling them.** A filled region's *tone* is data; its solid pixels are not. Replacing the fill with marks whose density encodes the same tone is what a pen artist does when "inking" a value study — and it's why source darkness is invariant I-2 in the locked model: the fill color owns the region's perceptual identity, and every fillStyle must reproduce that identity in its own grammar.

**Why seeds everywhere.** Determinism is a feature you can feel: re-render the same doodle, get the same doodle. It also makes the sweep harnesses (681-pattern canvas sweep, 197-shape audit) meaningful — a diff means the code changed, not the dice.

---

## Technical

All paths relative to `/Users/sebs/Desktop/Projects/desk-doodles/`.

### Capture + commit — `src/app/components/DeskDoodles/DeskDoodlesCanvas.tsx`

| Thing | Where | What |
|---|---|---|
| `StrokePoint` / `Stroke` types | lines 15–16 | `[x, y, pressure]` triples; stroke = id + points |
| `STROKE_OPTS` | lines 18–25 | perfect-freehand config: size 4, thinning/smoothing/streamline 0.5, `simulatePressure: true` |
| `strokeToPolygonPath(points)` | lines 30–38 | `getStroke()` → filled outline polygon d-string (`… Z`). Live + preview render |
| `strokeToPolylinePath(points)` | lines 45–51 | raw points → stroke-only `M/L` d-string. Committed render. Comment documents the variable-width-vs-transformability trade |
| `DrawSurface` | line 284 | owns `strokes` (preview pool), `current` (active drag), `committed` flag, `uploadedSvg` |
| `eventToSvgPoint` | lines 349–365 | screen→viewBox via `svg.createSVGPoint()` + `getScreenCTM().inverse()`; falls back to bounding-rect deltas if no CTM |
| pointer handlers | lines 367–382 | down: `setPointerCapture` + start stroke; move: append point; up: <2 points discards, else push to pool |
| `commitDrawing` / `reopenForEdit` | lines 390–397 | the Done/Edit flip — just `setCommitted` |
| committed layer (1a) | lines 443–467 | strokes as polylines, `strokeWidth={3}`, wrapped in `<SvgStyleTransform>` |
| preview layer (1b) | lines 470–488 | strokes as raw `strokeToPolygonPath` polygons, no styling |
| live layer (2) | lines 490–514 | the pointer-capture `<svg>`; current stroke at `fillOpacity={0.5}` |
| upload handler | `handleFileChange`, lines 305–332 | extension/MIME check → `file.text()` → strip `<script>` + `on*=` attrs (3 regexes) → regex-match `<svg>…</svg>` → state |
| upload render | lines 431–440 | `dangerouslySetInnerHTML` inside `<SvgStyleTransform>` |
| smartHachure auto-enable | lines 340–347 | appends `?smartHachure=1` + reloads if missing |
| 3D honesty gate | lines 632–653 | opaque placeholder over the surface when mode='3d' |

Viewbox constants `VIEWBOX_W = 800` / `VIEWBOX_H = 600` at lines 400–401.

### Style pipeline — `src/app/components/canvas/SvgStyleTransform.tsx`

| Thing | Where | What |
|---|---|---|
| `STYLE_PRESETS` | lines 49–75 | per-style preset values applied on "Reset to preset" (live render uses raw state, not these) |
| `SvgStyleTransform` component | line 2104 | dual-div clean/fx refs; `NEEDS_DOM_CLONE` list line 2100; smartHachure URL-param gate lines 2114–2123 (only rough-handdrawn/sketchy/bold-ink/stipple) |
| render effect | lines 2125–2150 | clone via `cloneSvg` (line 2045, forces `overflow: visible`) → `renderSmartHachure` OR `applyRoughTransform` (line 1920) / `applyRisographTransform` (line 1959) / `applyWireframeTransform` (line 2071) → `applyTexture` (line 2021) |
| `transformElement` | line 1346 | the per-tag dispatch: rect/circle/ellipse/line/polygon/polyline/path/text/g. Exported — Smart Hachure calls it directly |
| case `'path'` | lines 1570–1872 | sub-path split on every `M` (corner walker, lines 1637–1674); curve paths sampled via `getTotalLength`/`getPointAtLength`, `sampleSpacing = max(12, totalLen/6)` (lines 1676–1689); `RDP_EPSILON = 3.0` (line 1632), `RDP_VERTEX_THRESHOLD = 15` (line 1705); `POLY_ANCHOR_CAP = 8` dispatch between `straightBezierPath` and `catmullRomPath` (lines 1791–1807) |
| `rdp(points, epsilon)` | line 546 | Ramer-Douglas-Peucker recursion |
| `straightBezierPath` | line 706 | polygon intent: control points on each side's chord + jitter; honors bowing/curveDamp/endpointBehavior |
| `catmullRomPath` | line 745 | curve intent: `smoothPolyline` (line 587, corner-preserving 30° threshold) → `arcLengthWobbleField` (line 625, wavelength `max(35, min(90, arcLen*0.12))`) → corner-aware tangents (45° threshold) |
| `applyEndpointBehavior` | line 657 | clean / protrude (4px) / long-overshoot (9px) / kink (2.5px random-angle per anchor) |
| `injectJaggedness` | line 325 | perpendicular zigzag intermediates; gates the buildPath fast-path at `m.jaggedness <= 0.05` |
| `renderHandFeelShape` | line 871 | the layer loop: `multiStrokeMeta` (line 87, off→0 … heavy→8) × `effectiveLayerCount` clamp (line 504, ~12px/layer) × `seedOffsets` prime increments via `SEED_INCREMENTS` (lines 196–199); per-layer SVG transforms for cross-rotate/parallel-pass (lines 1086–1108); base-fill path + hachure shading block (lines 972–1055); `__dd_diag` console diagnostics (line 902) |
| `fillDarknessFactor` | line 387 | fill color → 0–1 darkness; CSS-token tiers hand-mapped, literal hex/rgb/hsl → WCAG relative luminance (`Y = 0.2126R + 0.7152G + 0.0722B`, sRGB-linearized) × alpha, lines 414–476; unknown-color catch-all `0.75` at line 478 |
| size-aware clamps | lines 491–539 | `effectiveHachureGap` / `effectiveLayerCount` / `effectiveRoughness` / `effectiveWobble` / `effectiveFillWeight` — interim rules the planned smart layer replaces |
| `TEXTURE_RECIPES` | line 2228 | feTurbulence noise presets per texture step |
| `buildNewsprintDotTile` | line 2281 | real halftone `<pattern>` tile (grid/staggered/random/concentric) used as luminance mask |

### Smart Hachure orchestration — `src/app/lib/smartHachure/index.ts`

`renderSmartHachure(svgRoot, fullModifiers, opts)` (line 61) — the one public entry point. Key moves, in order:

1. Snapshot `originalChildren` via `getRenderableChildren` before mutating (line 76).
2. Pre-pass `extractSignals` for every child (lines 94–100) — must happen before any removal (`getBBox()` returns zeros on detached elements; the comment documents the 2026-06-03 misclassification bug this fixes).
3. Per child: `classify(signals, ctx, providers, overrideStore)` (line 160) with `providers ?? [ruleEngineProvider]` and `confidenceThreshold ?? 0.7`; `selectTreatment` (line 163, from `techniqueMap.ts:45`); narrow user fillStyle override + `<40px²` tiny-clamp exception (lines 171–185).
4. Outline: `transformElement(child, rc, outlineModifiers, …)` with `fillStyle: 'none'` (line 198), output filtered to fill-less elements (lines 199–209) — *this filter is why committed strokes must be polylines*.
5. Fill marks: `renderRegion(child, treatment, …)` (line 215, from `renderRegion.ts:40`) with `baseSeed + 7919` so fill and outline seeds don't collide.
6. Diagnostics: `data-smart-role` / `data-smart-confidence` / `data-smart-fill-style` / `data-smart-gap` / `data-smart-weight` on fills; `data-smart-source-role` / `data-smart-source-darkness` on outlines (lines 226–236).
7. Edge-case policy: mask/filter attrs → pass-through (line 149); clip-path copied onto generated marks (lines 241–246).
8. Replace: fills inserted first, outlines second, original removed (lines 248–258). Mutation contract: in-place, calling twice doubles — caller clones first.

Supporting modules (real names): `signals.ts` → `extractSignals` (line 33), `getRenderableChildren` (line 399); `classifier.ts` → `classify` (line 31), `ruleEngineProvider` (line 315), `RULE_REGISTRY` (line 354); `techniqueMap.ts` → `selectTreatment` (line 45), `SmartHachureStyle` (line 18); `renderRegion.ts` → `renderRegion` (line 40). Point/path builders live in `src/app/lib/f3HandFeel.ts` (`roughRectPathExtended:89`, `roughOvalPathExtended:168`, `roughLinePathExtended:262`, `roughRectPoints:329`, `penTipPath:414`, `pointsToPolylinePath:563`).

---

## Connections

This page is one slice through the knowledge graph; these are its edges:

- **→ Smart Hachure system internals** — Stage 6 here is the *call site*; the classifier rules, tonal roles, treatment table, and the I-1…I-14 invariants live in `docs/locked-refs/F3-smart-hachure-system/09-LOCKED-MODEL.md` (THE contract — cite a section for any Smart Hachure change) and `07-architecture-ml-pipeline.md` (the `signals → classify → treatment` pattern). A dedicated knowledge page on the classifier should hang off this one.
- **→ Shading math** — `fillDarknessFactor` and the gap/weight equations in `renderHandFeelShape` lines 1010–1033 implement `docs/locked-refs/F3-siblings/F3-shading-calibration-spec.md` §4; the planned unified `coverageToParams(a, fillStyle)` function is specced in `docs/research/21-research-3d-pipeline-and-style-translation.md`.
- **→ Simplification / RDP** — the dispatch-freeze design (classify polygon-vs-curve at canonical ε so the Simplify slider can't flip a doodle's renderer identity) is locked in `docs/research/22-research-simplification-toggle.md`. Stage 5's `POLY_ANCHOR_CAP` cliff is the thing that doc exists to tame.
- **→ Chrome / modifier state** — every `m.*` value in this pipeline comes from `F3RoughModifiersContext` (`src/app/state/F3RoughModifiersContext.tsx`), surfaced by `SmartHachureChrome` (`src/app/components/chrome/SmartHachureChrome.tsx`) in the canvas right panel. Toggles live in shell chrome, never in the canvas itself (locked rule).
- **→ The audit dataset** — the same pipeline renders the 197-shape `/audit` catalog (`src/app/lib/items/PegToolShape.tsx`, `DeskDoodlesAudit.tsx`); every catalogued breakage is a labeled data point for the future smart layer. Any change to this pipeline must re-run the sweep harness before being declared done.
- **→ The desk canvas (future)** — this `/canvas` page is the drawing *primitive's* test surface. The real product flow is a separate desk canvas where each Done in a draw-panel popup adds one object to the desk (memory: `project_desk_doodles_draw_panel_vs_desk_canvas`). The pipeline documented here is what runs inside that popup.
- **→ 3D mode (future)** — committed stroke polylines are also the planned input for Rod (TubeGeometry) and Extrude (ExtrudeGeometry) on Day 11; the wedge is that the same hand survives into 3D ("user's hand survives the round-trip," 21-research).

---

## Honest status

**Real, in code today (everything in the Technical section above is verified against source):**

- Full draw flow: pointer capture → perfect-freehand live preview → preview pool → Done/Edit/Clear → polyline commit → `SvgStyleTransform` → styled render.
- Upload-SVG flow with sanitization, Replace/Clear, and the identical downstream pipeline.
- The complete hand-feel engine: sub-path split, RDP, polygon/curve dispatch, wobble field, bowing, curveDamp, jaggedness, endpoint behaviors, multi-stroke layers, pen tips, seeded determinism.
- Smart Hachure end-to-end for the 4 rough-family styles — and it is a **RULE ENGINE**: `ruleEngineProvider` in `classifier.ts` is hand-written rules over extracted signals. There is no ML anywhere in the shipping path. The provider-chain type (`ClassifierProvider[]`) exists so an ML provider *could* slot in later; today the chain has exactly one rule-based member.
- Texture filters, newsprint dot screen, risograph, wireframe, palette mapping.
- DevTools diagnostics: `window.__dd_diag = true` + `data-smart-*` attributes.

**Planned / stubbed — do not describe as working:**

- **Upload image** — the button exists in the input dock; selecting it does nothing (no handler, no tracer; `isUpload` only checks `'upload-svg'`). Stretch S1, needs imagetracerjs.
- **3D mode** — the 2D/3D toggle shows an honest placeholder ("3D mode lands Day 11"). Rod/Extrude geometry from committed strokes is planned, not built.
- **Publish** — button rendered disabled ("Publish wiring lands Day 9"); Supabase project exists, table/bucket/RLS and the wiring do not.
- **Smart-layer ML / vision-LLM routing** — research-locked direction (21-research), zero code.
- **`coverageToParams` unified shading function** — specced, not implemented; today's darkness→gap/weight math is the Phase 1A baseline inline in `renderHandFeelShape`.
- **Simplify slider** — research doc locked (22-research); `simplification` field was *removed* as a dead stub; the slider doesn't exist yet.
- **Settings panel** — left-dock Settings section is a text placeholder ("Style picker + Smart Hachure controls wire in Day 7"); the real controls live in the right panel.
- **Variable-width character on committed strokes** — currently lost at the polyline swap by design; the personal-sketch-style pass (Phase 4 research) is the planned recovery path.
