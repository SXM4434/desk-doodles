# Edge / degenerate / hostile INPUT fixtures — BUILT (gap-hunt 2026-06-13)

**Status:** ✅ BUILT + RUN. The render-survival battery
(`render-survival-battery.mjs`) is live, it drives the full corpus through the
REAL 2D render path, and it found real failures (catalogued below). The original
PROPOSED spec is preserved further down for reference. **The render code is HOT
(SvgStyleTransform / smartHachure) — the battery CATALOGS + FLAGS, it does not
fix.** See `RENDER-SURVIVAL-BATTERY.md` for the run report + per-finding detail.

## TL;DR run

```bash
node tools/edge-fixtures/generate-fixtures.mjs    # (re)write the static corpus
node tools/edge-fixtures/render-survival-battery.mjs   # build + preview + drive + assert
# screenshots + results.json → /tmp/dd-rsb/ ; exit 1 on any crash/NaN/hang/error
```

## What it found (2026-06-13, first run — 168 cells = 42 fixtures × 4 styles)

13 HARD-FAILS across 4 fixtures (the render-survival contract: no crash / NaN /
hang / console error):

| Fixture | Symptom | Flag |
|---|---|---|
| `nan-coords` | literal `NaN` in a `d`-string survives into the rendered DOM; 1–4 console errors per style; the path silently drops, sibling renders | CONSOLE + NAN-DOM |
| `infinity-coords` | `1e400` → `Infinity` in the rendered `d` attribute (wireframe); console errors every style; path drops | CONSOLE + NAN-DOM |
| `negative-dims` | `width="-50"` → browser console errors; on the **rough/smart path the negative dims propagate into the geometry builder as `M NaN NaN L NaN Na…`** | CONSOLE (+ NaN cascade in rough) |
| `gen-10000-element` | 10k innocent sibling `<rect>` → **22.7 s** render on rough-handdrawn (9× over the 2.5 s budget) — tab-hang class | OVER-BUDGET |

Plus 15 non-fatal `BLANK` / visual findings (silent under-render, not contract
violations): `single-point-path`, `single-point-polyline`, `extreme-aspect`
(10000×1 sliver normalizes to sub-pixel), `gradient-no-stops` (zero-stop fill →
nothing), `filter-on-renderable` (wireframe). And `use-symbol-unresolved` (H7)
renders the `<use>` instances as **bare boxes** — the `<symbol>` content is never
resolved into the smart path.

**Headline diagnosis (H5 corrected):** the gap-hunt hypothesised the hang was the
`signals.ts` O(n²) sibling pass. The measured growth curve says **no** — the
`clean` path stays flat (~0.005 ms/element at 10k). The blowup is the
**per-element rough/smartHachure transform**, which is *superlinear*: 0.16 → 0.27
→ 0.84 → 2.01 ms/element across 250 → 1000 → 4000 → 10000 siblings (~12.6× time
per 4× size). There is **no element cap anywhere**, so a detailed auto-traced
logo / CAD export hangs the tab on the rough family. (See the ELEMENT-COUNT
GROWTH table in the run output.)

---

## ORIGINAL PROPOSED SPEC (preserved for reference)

These are the fixtures the 197-shape catalog + the existing batteries do NOT
exercise. This README section is the spec the harness was built against.

## Why this exists

The codebase tests three things very well:
1. **The 197 curated catalog shapes** through `SvgStyleTransform` (2D) and the 3D
   geometry engines (`tools/2d/audit-style-sweep.mjs`, `tools/3d/*`).
2. **XSS execution** on hostile SVG through `sanitizeSvgMarkup`
   (`tools/security/payloads.ts` — proves no script fires).
3. **Non-finite / degenerate STROKE pools** through the 3D path
   (`strokeTo3d.ts` has explicit Infinity-OOM + degenerate-chord + empty-pool guards).

The hole: **nothing feeds arbitrary / hostile-but-sanitized / degenerate SVG
markup through the 2D RENDER path** (`normalizeSvgSize` → `extractAllSignals` →
classifier → `SvgStyleTransform`). The security battery proves a payload doesn't
*execute*; it never asserts the payload *renders without crashing / NaN / empty*.
And the two existing `test-fixtures/*.svg` (torture, gradient-sampler) are
referenced only in a CODE COMMENT in `classifier.ts` — never run by any harness.

## The fixture families (each = one `.svg` or one generator entry)

### A. Degenerate geometry (render-path robustness)
- `zero-area-rect.svg` — `<rect width="0" height="0">` (getBBox 0×0; aspectRatio div path)
- `single-point-path.svg` — `<path d="M50 50 Z">` (one point, closed)
- `single-point-polyline.svg` — `<polyline points="50,50">` (one vertex)
- `collinear-path.svg` — 3 collinear points (zero-area enclosure)
- `nan-coords.svg` — `<path d="M NaN 10 L 20 NaN">` (literal NaN in d-string)
- `infinity-coords.svg` — coordinate `1e400` (parses to Infinity → arc-length-walk OOM class on the 2D side too)
- `negative-dims.svg` — `<rect width="-50" height="-50">`
- `giant-10000px.svg` — viewBox `0 0 10000 10000` single huge shape (normalize down-scale + memory)
- `micro-1px.svg` — viewBox `0 0 1 1` (normalize up-scale; tiny-area clamp interplay)
- `extreme-aspect.svg` — 10000×1 sliver (geomean bbox-min path, aspectRatio explosion)

### B. Multi-subpath / structural extremes
- `1000-subpath.svg` — one `<path>` with 1000 `M…` subpaths (the rose-chaos class at scale; perf + sub-path split walker)
- `10000-element.svg` — 10k sibling `<rect>` (topology O(n²) sibling pass in signals.ts:extractTopology → quadratic blowup; NO element cap exists)
- `deep-nesting-500-g.svg` — 500-level `<g>` nesting (walkInto recursion; classifier recurse)
- `self-intersecting-polygon.svg` — figure-8 polygon (fill-rule / winding; raster region extractor)
- `empty-g.svg` — `<g></g>` only (0 renderable children)
- `defs-only.svg` — only `<defs>`, nothing renderable (extractAllSignals returns empty map)

### C. Fills the catalog never has
- `currentcolor-no-context.svg` — `fill="currentColor"` with NO `color` attr (UA-default-black guard path)
- `gradient-no-stops.svg` — `<linearGradient>` with zero `<stop>` (resolveUrlFillDarkness n===0 branch)
- `gradient-dangling-ref.svg` — `fill="url(#missing)"` (def not found → 0.75 catch-all)
- `pattern-recursive.svg` — `<pattern>` whose content references itself via `<use>`
- `hsl-fill.svg`, `named-color-fill.svg` (`rebeccapurple`), `rgba-fill.svg`, `8-digit-hex.svg` — culori parse coverage the catalog (var()-token-only) skips
- `filter-on-renderable.svg` — `filter="url(#blur)"` on a fill region (pass-through claim untested in 2D sweep)
- `mask-clip-combo.svg` — element with BOTH mask + clip-path (interaction untested)
- `use-symbol.svg` — `<use href="#sym">` of a `<symbol>` (NOTE: `<use>` is NOT in
  signals.ts SKIP_TAGS and NOT a recognized tag → becomes tag:'other', signals
  extracted but the symbol's content is NEVER resolved → silent under-render)

### D. Text / unicode
- `text-heavy.svg` — 50 `<text>` nodes (label-text rule at volume; perf)
- `unicode-emoji-text.svg` — emoji + RTL Arabic + CJK in `<text>`
- `textpath.svg` — `<textPath>` on a path (untested element)
- `tspan-nested.svg` — `<text>` with nested `<tspan>` (child-of-text walk)

### E. Empty / malformed (render-path, NOT just sanitize)
- `empty-svg.svg` — `<svg></svg>` (valid but no content)
- `whitespace-only.svg` — `<svg>  \n  </svg>`
- `no-viewbox-no-dims.svg` — `<svg>` with neither viewBox nor width/height + real content (normalizeSvgSize zero-dim warn path → renders at native? letterbox?)
- `comment-bomb.svg` — 100KB of `<!-- -->` comments around one rect
- `prolog-garbage.svg` — XML prolog + processing instructions + DOCTYPE before `<svg>`

## What the harness should ASSERT (the missing gate)

For EVERY fixture above, drive it through the REAL render path on an isolated
PROD preview (same pattern as `tools/2d/audit-style-sweep.mjs`):

1. `normalizeSvgSize(markup)` returns a string, no throw, finite width/height.
2. Inject the normalized markup, run `SvgStyleTransform` at default + all 11 styles.
3. Assert: **0 console errors · 0 NaN in any rendered attribute (d/transform/cx/…)
   · 0 thrown exceptions · render completes in < N ms (perf ceiling) · no OOM/hang.**
4. For the smart styles, dump `window.__dd_decisionLog` and assert every region
   got a role (no undefined / crash in classify).
5. For the 3D-flippable ones (drawn-equivalent), also run `convertStrokePool`
   and assert finite geometry / honest fallback.

This is the per-item table the gap-map called for under §3 ("SVG sanitize with
the malicious-payload fixture wired to an assertion") — extended from sanitize-only
to the full RENDER survival contract.

## Harness file — ✅ BUILT
`tools/edge-fixtures/render-survival-battery.mjs` — mirrors audit-style-sweep's
isolated-preview (`vite.rsb.config.ts` + `render-survival-battery.html` +
`render-survival-harness.tsx`) + per-cell PNG + NaN-DOM-scan + console capture,
but iterates this fixture corpus through `normalizeSvgSize → SvgStyleTransform`
instead of the catalog. Exit 1 on any crash/NaN/hang/console-error. Also measures
the element-count growth curve on both a light (`clean`) and heavy
(`rough-handdrawn`) path to quantify the blowup, and emits a render-fidelity feed
file the dataset feeder ingests (`--from-fidelity-2d`). See
`RENDER-SURVIVAL-BATTERY.md` for the full report.

## File map
- `generate-fixtures.mjs` — writes the static corpus into `svg/` (35 fixtures + manifest)
- `svg/` — the generated static corpus (human-openable; families A–F)
- `render-survival-harness.tsx` / `.html` / `vite.rsb.config.ts` — the isolated browser harness
- `render-survival-battery.mjs` — the playwright driver (the gate)
- `use-symbol-unresolved.svg` / `quadratic-topology-10000-rect.svg` — the two pre-written seed fixtures (consumed as-is)
- the harness ALSO wires `test-fixtures/edge-case-torture.svg` + `gradient-sampler.svg` (the H4 "rows 1–2" requirement) and generates 10k-element / 500-`<g>` / 1000-subpath giants in-memory
