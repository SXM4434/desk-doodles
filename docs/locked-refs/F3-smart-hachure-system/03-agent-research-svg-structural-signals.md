# Agent 3 — SVG structural signals catalog

**Date:** 2026-06-03
**Word count:** ~1150
**Status:** Verified research with cited sources

---

# Structural Signals Catalog for Smart Hachure Classification

A render-time classifier that inspects each fill region of an arbitrary SVG and assigns a tonal role (paper / sparse / mid / dense / structural-frame / decorative-accent) without per-pin metadata. Browser-only, deterministic, ~120 elements per pass.

## 1. Geometric signals — extractable per element

For each element, harvest from DOM APIs (no preprocessing):

- **Bounding box**: `el.getBBox()` returns `SVGRect {x, y, width, height}` in user-space units. Works on `path`/`rect`/`circle`/`polygon`/`g`/etc. Note: ignores parent transforms — combine with `el.getCTM()` if a parent applies one. ([MDN getBBox](https://developer.mozilla.org/en-US/docs/Web/API/SVGGraphicsElement/getBBox))
- **Area**: `bbox.width × bbox.height` (proxy for closed shapes) or `getTotalLength()` × stroke width (line-like). Closed-shape true area = polygon-shoelace from sampled `getPointAtLength()`. ([MDN SVGGeometryElement](https://developer.mozilla.org/en-US/docs/Web/API/SVGGeometryElement))
- **Aspect ratio**: `w/h`. Useful bands: `>4` = strip/band, `1±0.15` = square/icon, `<0.25` = hairline.
- **Perimeter**: `getTotalLength()` on `SVGGeometryElement` (path/rect/circle/ellipse/line/polygon/polyline).
- **Position relative to parent**: `bbox.x / parentBBox.width`, etc. — gives normalised `[0..1]` slot.
- **Distance to siblings**: pairwise centroid distance + bbox-edge gap.
- **Z-order**: index in `parent.children`. SVG paint order = DOM order, so later siblings paint on top — critical signal for "behind" vs "on top of."
- **Path topology**: parse `d` with [svg-pathdata](https://github.com/nfroidure/svg-pathdata) for segment count, presence of `C/Q/A` (curved) vs `L/H/V` only (polygonal), and `Z` closure. Closed = candidate fillable region; open = decoration/line.

## 2. Topological signals — relationships

- **Parent-child nesting**: `el.parentElement` chain.
- **Sibling similarity**: cluster sibling rects by `width`, `height`, `x`-stride. ≥3 rects with equal width and constant `y`-stride = stripe family.
- **Containment**: bbox-A wholly inside bbox-B (with small ε for stroke). Standard test: `Ax ≥ Bx ∧ Ay ≥ By ∧ Ax+Aw ≤ Bx+Bw ∧ Ay+Ah ≤ By+Bh`.
- **Overlap area** between bboxes (intersection-over-union).
- **Outer-frame detection**: largest closed shape whose bbox encloses ≥80% of siblings AND lies first in DOM order = "frame/back-plate."
- **Stripe detection**: 3+ rects with same width, evenly-spaced `y`, identical fill.

## 3. Stylistic signals — from attributes

For each element, read `getAttribute()` on `fill`, `stroke`, `stroke-width`, `stroke-dasharray`, `opacity`, `fill-opacity`, `transform`:

- **Fill presence**: `none|transparent|absent` vs colored.
- **Stroke presence**: same logic.
- **Combo**: `fill=color, stroke=none` = mass; `fill=none, stroke=color` = line/border; both = bordered shape.
- **Stroke-width bin**: `<0.5` hairline, `0.5–1` thin, `1–1.5` medium, `>1.5` heavy.
- **Dasharray**: dashed = often annotation/stitching/cut-line (see `bandPatch` `stroke-dasharray="2 2"` perimeter at `F3_B_TrophyWall_Path2.tsx:127`).
- **Tag**: `rect`/`circle`/`path`/`polygon`/`line`/`text` — each carries weak priors (text → label, line → connector, rect → panel).
- **Transform**: inline `translate/scale/rotate` often marks an "anchored" decoration.
- **Opacity**: already-low = stylistic intent — preserve the darkness scale.

Hero-8-Lab already extracts source-fill darkness via `fillDarknessFactor()` parsing `color-mix` percentages and W1 token names (`SvgStyleTransform.tsx:280–297`). That's the single-axis input the new classifier extends.

## 4. Pattern signals — common SVG-authoring heuristics

Each maps to a candidate role:

| Pattern | Detection | Likely role |
|---|---|---|
| Largest closed shape, painted first (lowest z) | Index 0 + encloses ≥80% siblings + has fill | **Back-plate / frame** |
| Inner rect bordered by outer rect, both same x-padding | Containment + similar paddings | **Frame (outer) + content (inner)** |
| Wide thin rect inside frame, fill=STROKE | aspect>3, contained, fill=ink | **Tonal band / bold band** |
| Single fill behind everything, low darkness (≤0.1) | First child + WASH fill | **Background mass / paper** |
| `fill=none, stroke=color` | No fill, has stroke | **Outline / border decoration** |
| `stroke-dasharray` present | Dashes detected | **Annotation / stitch / cut** |
| 3+ siblings with identical width + constant stride | Stripe cluster | **Hatch lines / ruling** |
| Path with only stroke + ≤6 segments | Open path, low segment count | **Line accent** |
| Text near a stroked rect, contained | Proximity + containment | **Label inside frame** |
| Tiny element, area <2% of root | Area threshold | **Decorative accent / dot / pin-head** |

## 5. Classifier output dimensions

Each element receives:

- **tonalRole** ∈ `paper | sparse-tonal | mid-tonal | dense-tonal | solid-content | structural-frame | decorative-accent | line-decoration | label-text`
- **confidence** ∈ `[0,1]` — derived by counting how many independent signals agree (e.g. "first-z + encloses-all + has-fill" = 3-agreement = 0.9).
- **suggestedTreatment**:
  - `paper` → skip hachure
  - `structural-frame` → render as clean outline (no fill technique) regardless of source darkness
  - `sparse-tonal` → hachure gap ~6×base, 1 layer
  - `dense-tonal` → hachure gap ~base, 2 layers
  - `solid-content` → solid fill or cross-hatch at user's darkness
  - `decorative-accent` → preserve as-is, scale roughness down
  - `line-decoration` → outline only, no fill family
  - `label-text` → never hachure

## 6. JS ecosystem tooling (verified)

- **Native DOM**: `getBBox()`, `getCTM()`, `getTotalLength()`, `getPointAtLength()`, `querySelectorAll`. Zero-dependency, available since 2015.
- **[svgson](https://github.com/elrumordelaluz/svgson)** — `parse`/`parseSync`/`stringify`; returns `{name, type, attributes, children}` AST. Works in browser via UMD. Good when you need to inspect attributes BEFORE the SVG is in the live DOM (no `getBBox`).
- **[svg-pathdata](https://github.com/nfroidure/svg-pathdata)** — segment-level parsing of `d` strings (M/L/C/Q/A/Z), needed for curvature/segment-count signals.
- **[svgo](https://github.com/svg/svgo)** — primarily an optimizer; its plugin API exposes an AST `(ast, params, info) => visitor`. Heavier than svgson for pure inspection; useful if you want to normalize shapes-to-paths via the `convertShapeToPath` plugin before classification.
- **[flatten.js / svg-flatten](https://github.com/stadline/svg-flatten) / [flatten-svg](https://www.npmjs.com/package/flatten-svg)** — collapse `<g>` transforms into per-element coordinates so geometry signals are transform-invariant.
- **Canvas pixel-scan fallback**: rasterize to `OffscreenCanvas` at 1× and read `getImageData()` for region-darkness verification when token parsing is uncertain. Deterministic given fixed size.
- **Academic precedent**: [DeepSVG (Carlier et al., NeurIPS 2020)](https://arxiv.org/abs/2007.11301) — Transformer-based hierarchical encoder for SVG paths; ships a PyTorch SVG manipulation library. Not browser-deployable but its path-token taxonomy (command-level) informs the segment-features design. [Semantic Document Derendering (arxiv 2511.13478, 2025)](https://arxiv.org/html/2511.13478v1) — VLM-driven SVG reconstruction; relevant as proof that semantic SVG inference is an open problem. No off-the-shelf JS classifier exists; we're building one.

## 7. Walkthrough — `framedFlyer` (`F3_B_TrophyWall_Path2.tsx:99–115`)

Source elements, in DOM order:

| # | Element | Attrs | Geometric signal | Topological signal | Style signal | Pattern → Role | Confidence | Treatment |
|---|---|---|---|---|---|---|---|---|
| 1 | `rect 3,3 74×94` | `fill=WASH stroke=STROKE sw=1.5` | aspect 0.79, area 6956 (96% of svg) | z=0, encloses all later siblings | wash fill + stroke | "outer back-plate with frame stroke" → **structural-frame (with sparse-tonal interior)** | 0.9 (z0 + enclose-all + wash) | Render clean outline at full stroke. Skip hachure on the wash interior — frame, not content. |
| 2 | `rect 12,14 56×14` | `fill=STROKE` | aspect 4.0, area 784 (11%) | inside #1, top zone | solid ink, no stroke | wide bold band inside frame → **solid-content** | 0.85 | Solid-fill at full darkness OR dense cross-hatch — user's tonal pick. |
| 3 | `text "PUNK"` | `fill=BG` | text element | inside #2 | white-on-ink | **label-text on solid band** | 0.95 | Pass through unchanged. Never hachure text. |
| 4 | `path d="M12 40 …"` zigzag | `fill=none stroke=STROKE sw=1` | open, 13 segments, polygonal | inside #1, mid zone | stroke-only | **line-decoration (spiky ornament)** | 0.85 | Roughen the stroke; no fill family. |
| 5–7 | three `line` el | `stroke=STROKE sw=0.5` | aspect ∞, length descending | sibling stripe of 3, constant y-stride 8 | hairline stroke | **line-decoration / ruling lines** | 0.9 (stripe-cluster) | Roughened lines as-is. Don't add hachure. |
| 8 | `text "FREE"` | `fill=STROKE` | text | inside #1, bottom | small text | **label-text** | 0.95 | Pass through. |

Result: instead of treating the outer rect's 1.0 STROKE the same as the inner band's 1.0 STROKE, the classifier separates them by **z-order + containment + area-fraction**. Outer rect = frame (outline only). Inner band = solid-content (full shade). Spiky path and hairlines = line-decoration (roughen-only). This is exactly the disambiguation the current darkness-only path can't make.

## 8. What SVG can't tell us — uncertainty policy

Author intent is not in the SVG. A 1.0-STROKE outer rect could be a "framed poster border" OR an intentional dark back-plate. Suggested policy:

- **High-confidence (≥0.75)**: use the classified role.
- **Medium (0.5–0.75)**: log a `data-hachure-classification-uncertain` attribute + fall back to **current darkness-only treatment** so we never get *worse* than today.
- **Low (<0.5)**: default to **paper / pass-through** — the conservative side. Rule: when in doubt, do less hachure. Matches "shading should be sparing" direction from the calibration spec.
- **Per-pin override hook**: expose an optional `data-tonal-role="…"` attribute so the artist can pin a region when the heuristic disagrees. Classifier reads it as confidence 1.0. Keeps the system zero-config in the common case, escape-hatch in the rare case.

## 9. Performance + determinism notes

- All signals are O(N) over ~120 elements; pairwise containment is O(N²) but N is small (worst case ~14k ops/SVG). Acceptable per render-style change.
- DOM `getBBox()` requires the SVG be in a rendered tree. If we want to classify before insertion, attach to a hidden `<svg style="position:absolute; visibility:hidden">` once, classify, then move — Hero-8-Lab already mounts the source SVG before `applyRoughTransform()` runs (`cloneSvg()` at `SvgStyleTransform.tsx:834`).
- Determinism: every signal is a pure function of input attributes + DOM order. Same SVG → same classification, every time. No `Math.random()`, no time inputs.
- Output is data only (the `{tonalRole, confidence, treatment}` triple per element) — feeds the existing `renderHandFeelShape` / `fillDarknessFactor` pipeline as a NEW axis, doesn't replace it. Composable with the current renderer.

## Key files

- `apps/Hero-8-Lab/src/app/components/hero8/cells/SvgStyleTransform.tsx` — `fillDarknessFactor` (lines 280–297), `renderHandFeelShape` (337+), `applyRoughTransform` (721) — the integration point.
- `apps/Hero-8-Lab/src/app/components/hero8/cells/F3_B_TrophyWall_Path2.tsx` — pin shape source (framedFlyer at 99–115, gigTicket at 87–98, bandPatch at 116–133, etc.) — the test corpus.
- `apps/Hero-8-Lab/src/app/state/F3RoughModifiersContext.tsx` — modifier state shape that the suggested-treatment dimension feeds.

## Sources

- [MDN getBBox](https://developer.mozilla.org/en-US/docs/Web/API/SVGGraphicsElement/getBBox)
- [MDN SVGGeometryElement](https://developer.mozilla.org/en-US/docs/Web/API/SVGGeometryElement)
- [svgson](https://github.com/elrumordelaluz/svgson)
- [svgo](https://github.com/svg/svgo)
- [svg-pathdata](https://github.com/nfroidure/svg-pathdata)
- [svg-flatten](https://github.com/stadline/svg-flatten) · [flatten-svg](https://www.npmjs.com/package/flatten-svg) · [Flatten.js gist](https://gist.github.com/timo22345/9413158)
- [DeepSVG (NeurIPS 2020)](https://arxiv.org/abs/2007.11301) · [project page](https://alexandre01.github.io/deepsvg/)
- [Semantic Document Derendering (arXiv 2511.13478, 2025)](https://arxiv.org/html/2511.13478v1)
