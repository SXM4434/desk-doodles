# Agent 2 — Hand-drawn libraries: build vs buy matrix

**Date:** 2026-06-03
**Word count:** ~1200
**Status:** Verified research with cited sources (reading actual source code in github.com/rough-stuff/rough, github.com/steveruizok/perfect-freehand, github.com/acamposuribe/p5.brush + verified-summary research of Excalidraw, rough-notation, roughViz, react-rough-fiber, Textures.js, flubber, paper.js, svgson)

---

# Smart Hachure System — Library Research & Build/Buy Matrix

## 1. rough.js — already integrated, partial fit

**What it does well** (verified in `src/renderer.ts` + `src/fillers/hachure-filler.ts`):
- Seeded-random jitter on Bezier control points (`_curveWithOffset` duplicates each point with `_offsetOpt`).
- Multi-stroke via `_doubleLine` (two overlapping strokes, second has different offset calc).
- Hachure / cross-hatch / dots / zigzag / dashed / zigzag-line via `polygonHachureLines` → `doubleLineOps`.
- Length-aware roughness damping (>500px lines scale jitter from 1.0 down to 0.4).
- All controls are explicit options: `roughness`, `bowing`, `hachureGap`, `hachureAngle`, `fillWeight`, `fillStyle`.

**What's missing** (verified absent in source):
- No source-darkness reading. Caller must compute it (you do in `fillDarknessFactor`, SvgStyleTransform.tsx:280).
- No region classification. One shape gets one fillStyle.
- No multi-axis density control — `fillWeight` and `hachureGap` are independent sliders, not a coordinated tonal axis.
- No pressure variation along the stroke. Width is uniform across each stroke layer.
- No learning loop. Fixed parameters per call.
- Known bug: `_doubleLine` second-pass offset can be sub-pixel at low roughness (you wrote `stableLayerNudge` to fix this, SvgStyleTransform.tsx:217-227 — cites the bug directly at `rough/master/src/renderer.ts#L60-L67`).

**REUSE for**: hachure / cross-hatch / dots / zigzag / dashed / zigzag-line LINE GENERATION (it does `polygonHachureLines` clipping correctly, including concave polygons). Path-data jitter for arbitrary `<path>` elements (you already do this at SvgStyleTransform.tsx:701).

**REPLACE for**: nothing. Keep it as the hachure-line-generation primitive. It's the right level: lines-in-polygon, not classification.

## 2. perfect-freehand — best-of-class pressure axis

**What it does well** (verified in `packages/perfect-freehand/src/getStroke.ts`):
- Pressure-aware tapered polygon outline. Accepts `[x, y, pressure]` tuples OR auto-simulates pressure from velocity.
- Independent `start` and `end` cap/taper/easing config — you can taper one end and not the other.
- Options: `size`, `thinning` (how strongly pressure modulates width), `smoothing`, `streamline`, `easing`, `simulatePressure`, `last`.
- Outputs an SVG polygon — fits your existing `penTipPath` plumbing (f3HandFeel.ts:163).

**Use case for the Smart Hachure System**: this is your pressure axis. Each hachure line is a stroke; feed each stroke through `getStroke` with a pressure envelope (e.g. heavy mid-stroke, light at endpoints to mimic charcoal lift-off) and you get a width-varying mark for the price of one polygon. `simulatePressure: false` plus a hand-authored pressure envelope keeps it deterministic.

**Integration cost**: you already wrap it (`penTipPath`). Adding per-line pressure modulation = pass a pressure array per stroke. Maybe 30 min wiring inside the hachure render loop.

**REUSE for**: every per-line mark where pressure variation is part of the technique (charcoal hachure, pencil cross-hatch, dry-brush). **REPLACE for**: nothing.

## 3. p5.brush — wrong runtime, right vocabulary

**What it does well** (verified via README + npm package): 11 built-in brushes (`2B`, `HB`, `2H`, `cpencil`, `pen`, `rotring`, `spray`, `marker`, `marker2`, `charcoal`, `hatch_brush`), watercolor fill with bleed, `brush.hatch()` with `hatchStyle()` controls, vector-field stroke deformation, custom brush registration.

**Hard blocker**: canvas/WebGL output only. No SVG export. Requires p5.js 2.x WEBGL or its standalone WebGL2 build. Your portfolio is SVG-first (cards must scale + be themable with CSS vars).

**REUSE for**: nothing at runtime. **REPLACE for**: nothing. **STEAL FROM**: their public API as a vocabulary cheat-sheet. `fillBleed`, `fillTexture`, `hatchStyle`, `mass` are good toggle names to mirror in your modifier state. Their brush preset list (2B/HB/2H = pencil hardness) is the right way to label your pen-tip presets in the chrome.

## 4. Excalidraw — fork is identical to upstream for our purposes

**What's there**: `@excalidraw/roughjs` exists on npm and is referenced from the Excalidraw monorepo. Their renderer files are `renderer/{staticScene,staticSvgScene,interactiveScene,helpers,roundRect,animation,renderNewElementScene,renderSnaps}.ts`. The fork supports the same fill styles as upstream rough.js: hachure (default), solid, zigzag, cross-hatch, dots, dashed, zigzag-line. The fork's changes are bug fixes + their RTL/text handling, not new tonal logic. There is an open feature request asking for additional sketch styles (excalidraw/excalidraw issue #6734), which confirms they HAVEN'T extended into the tonal-axis space you need.

**REUSE for**: nothing the upstream doesn't already give us. **REPLACE for**: nothing. Stick with stock rough.js.

## 5. Krita / OpenToonz — no web port exists

Verified: Krita brush engines are Qt/C++ desktop. No JavaScript port. Their research (Bristle engine, Color Smudge, Shape engine) is documented at docs.krita.org but ports don't exist. Same for OpenToonz.

**STEAL FROM**: their brush-engine taxonomy as a mental model — "particle engine" vs "shape engine" vs "smudge engine" maps cleanly onto your stipple / hachure / charcoal styles. Nothing to call into.

## 6. D3-shape / D3 hachure plugins

**d3-shape itself**: only generates symbol paths, no hachure. **patternfills** (iros/patternfills): static SVG `<pattern>` defs; not parametric. **Textures.js** (riccardoscalco): D3-coupled SVG pattern generator with `lines`/`circles`/`paths`, plus `.heavier()/.lighter()/.thicker()/.thinner()` adjusters that map onto a coarse density axis. Worth a glance for the chaining API, but it's `<pattern>`-based and doesn't clip to arbitrary polygons the way rough.js does.

**REUSE for**: nothing. Their density adjusters are 4 fixed steps; you already have continuous control via `hachureGap` / `fillWeight`. **STEAL FROM**: the `.heavier()/.lighter()` naming for tier names in your tonal classifier.

## 7. Other libraries

- **rough-notation**: 7 annotation types (underline / box / circle / highlight / strike-through / crossed-off / bracket) on HTML elements. Wraps rough.js. No tonal/hachure logic. **Skip** — annotation overlays, not region fills.
- **react-rough-fiber**: React wrapper around rough.js + React reconciler. Adds no new rendering capability. Your `SvgStyleTransform` already does the imperative rough.js plumbing in `useEffect` — wrapper would add indirection without value. **Skip**.
- **roughViz**: chart-shaped wrapper around rough.js + D3. Adds nothing relevant. **Skip**.
- **paper.js / two.js**: vector graphics scene graphs. paper.js is canvas-rendered; two.js outputs SVG/canvas/WebGL. Both give you Boolean ops (union, intersect, subtract on paths). **STEAL FROM**: paper.js Boolean ops if you need to clip hachure lines to complex source regions that rough.js's `polygonHachureLines` chokes on (rare — its scan-line clipper handles concave fine). Optional fallback only.
- **flubber**: SVG path interpolation. Useful for animating BETWEEN two fillStyles (hachure morphing into cross-hatch under a toggle). Not for tonal mapping. **Optional polish**, not core.

## 8. SVG analysis / classification tooling

- **svgson** (elrumordelaluz/svgson): parse SVG → JSON AST with `name`/`type`/`attributes`/`children`. `transformAttr` + `transformNode` callbacks for mutation. Round-trips back to SVG via `stringify`. Stable, small, no DOM dependency. **USE IT** for the classification pass — beats DOM traversal because it works server-side too (Vite SSR/build-time pre-classification is a future option).
- **svg-parser** (Rich-Harris): similar role, slimmer. Either works.
- **svgo internals**: heavy, optimization-focused. Don't pull it in just to read attributes.
- **culori**: OKLab / OKLCH conversion in pure JS. Treeshakeable. **USE IT** for perceptual-lightness math — your `fillDarknessFactor` currently does token-string sniffing (SvgStyleTransform.tsx:280-297). Real perceptual lightness via OKLCh `L` channel = honest darkness score, works on any input color, no hard-coded W1 token table.
- **Three.js / R3F raycasting**: irrelevant for the SVG side. Relevant for the deferred Phase 3 EdgesGeometry→SVG bridge (Task #9) but that's a separate problem.

## 9. Build-vs-buy matrix

| Capability | Verdict | Stack |
|---|---|---|
| Source-fill **classification** (paper / sparse / mid / dense / solid / accent / structural border) | **BUILD** | svgson AST walk → culori OKLCh `L` → 7-tier classifier. No library does this. |
| **Multi-axis mark rendering** (gap × weight × color × opacity × pressure) | **BUILD (orchestration) + BUY (primitives)** | Your code combines axes; rough.js generates lines; perfect-freehand modulates pressure per line. |
| **Per-region technique selection** (which style for which tonal role) | **BUILD** | A classifier→technique mapping table. Pure JS, ~50 lines. |
| **Pressure-aware strokes** | **BUY** | perfect-freehand. Best-of-class, MIT, you already wrap it. |
| **Hachure line-in-polygon clipping** | **BUY** | rough.js `polygonHachureLines`. Solved problem. |
| **Perceptual lightness math** | **BUY** | culori (OKLab/OKLCh). Don't reinvent CIELAB. |
| **Learning loop** | **BUILD** | No library can know your portfolio's tonal intent. Persist `{sourceFill → tonalRole}` overrides in localStorage; chrome lets you correct misclassifications; corrections feed the classifier as priors. |
| **SVG parsing / round-trip** | **BUY** | svgson. |
| **Texture / paper grain** | **KEEP CURRENT** | Your `feTurbulence` recipes (SvgStyleTransform.tsx:980-998) are already correct. Don't add p5.brush for this. |

## 10. Recommended architecture

**Runtime deps to ADD** (two, both small):
- `svgson` — SVG → AST → classified AST → SVG. ~5KB gz.
- `culori` (treeshake to `oklab` + `parse` only) — perceptual lightness from any color string. ~3KB gz for the subset you need.

**Runtime deps to KEEP**:
- `roughjs` — hachure line generation (`polygonHachureLines`), arbitrary path jitter (the `<path>` fallback you already use).
- `perfect-freehand` (already wrapped in `penTipPath`) — pressure axis for every per-line mark.

**Runtime deps to REJECT**:
- p5.brush (canvas-only, wrong runtime)
- react-rough-fiber (no new capability)
- roughViz / rough-notation (wrong domain)
- Textures.js (`<pattern>`-based, less flexible than rough.js)
- paper.js / two.js (overkill; only consider if rough.js's clipper fails)
- flubber (optional polish for fillStyle morph; not core)

**Custom code you OWN**:
1. **Classifier** (`smartHachure/classifier.ts`) — svgson walk → per-region `{fill, stroke, opacity, tonalRole, confidence}`. Confidence comes from culori OKLCh L distance to the nearest tier centroid.
2. **Technique selector** (`smartHachure/techniqueMap.ts`) — `{tonalRole, userStyleSelection} → {fillStyle, gap, weight, layerCount, pressureEnvelope}`. Pure function. Testable.
3. **Renderer** (`smartHachure/renderRegion.ts`) — your existing `renderHandFeelShape` refactored to take the selector's output. Hachure lines still come from rough.js; per-line pressure modulation via perfect-freehand.
4. **Learning store** (`smartHachure/store.ts`) — localStorage `{sourceFillSignature → {tonalRole, lastSeenAt}}`. Chrome surfaces a "this region was misclassified, set to X" override; override = high-confidence prior next time.

**Why this stack matches Sebastian's stated values**:
- Reuses real-fit (rough.js for clipping, perfect-freehand for pressure, culori for color math, svgson for AST) — three of these you already own indirectly; only svgson + culori are net new.
- Doesn't bypass fundamentals — the classifier is OKLCh math you can verify against any color picker; the technique selector is a table you author by hand; nothing is a black box.
- Lines up with Hero-8-Lab's locked direction: F3 SVG style toggle gets a real classification layer instead of darkness sniffing CSS token strings.

**Files this will touch**:
- `apps/Hero-8-Lab/src/app/components/hero8/cells/SvgStyleTransform.tsx` — `fillDarknessFactor` is the seam to replace with `classifier.ts`. The hachure block at lines 406-463 becomes `renderRegion(classifierOutput, modifiers)`.
- `apps/Hero-8-Lab/src/app/lib/f3HandFeel.ts` — `penTipPath` stays the pressure-mark primitive; add a per-line pressure envelope arg.
- New: `apps/Hero-8-Lab/src/app/lib/smartHachure/` for classifier + selector + store.

## Sources

- [rough.js source — renderer.ts](https://raw.githubusercontent.com/rough-stuff/rough/master/src/renderer.ts)
- [rough.js source — hachure-filler.ts](https://raw.githubusercontent.com/rough-stuff/rough/master/src/fillers/hachure-filler.ts)
- [perfect-freehand getStroke.ts](https://raw.githubusercontent.com/steveruizok/perfect-freehand/main/packages/perfect-freehand/src/getStroke.ts)
- [p5.brush repo (acamposuribe, not acerolajs)](https://github.com/acamposuribe/p5.brush)
- [@excalidraw/roughjs on npm](https://www.npmjs.com/package/@excalidraw/roughjs)
- [Excalidraw renderer dir](https://github.com/excalidraw/excalidraw/tree/master/packages/excalidraw/renderer)
- [shihn.ca — rough.js algorithm internals (author post)](https://shihn.ca/posts/2020/roughjs-algorithms/)
- [rough-notation](https://github.com/rough-stuff/rough-notation)
- [react-rough-fiber](https://github.com/amindlab/react-rough-fiber)
- [roughViz](https://github.com/jwilber/roughViz)
- [Textures.js](https://riccardoscalco.it/textures/)
- [flubber](https://github.com/veltman/flubber)
- [paper.js](http://paperjs.org/about/)
- [svgson](https://github.com/elrumordelaluz/svgson)
- [Winkenbach & Salesin, Computer-Generated Pen-and-Ink Illustration (SIGGRAPH '94)](https://www.cin.ufpe.br/~sbm/p91-winkenbach.pdf) — theoretical grounding for "controlled-density hatching" / stroke textures, the underlying technique the Smart Hachure System operationalizes.
- [Krita brush engine reference](https://docs.krita.org/en/reference_manual/brushes/brush_engines.html) — taxonomy only, no web port.
