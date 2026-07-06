# KNOWN-SOLUTIONS — Region Fill, Holes, 3D Relief, Silhouette

**Scope:** Synthesized research for the active fill priority + adjacent 3D/hole/silhouette problems in Desk Doodles. READ-ONLY research doc — points at proven, citable solutions and a concrete refactor path. Source-of-truth is local + GitHub.

**Installed levers (confirmed in `package.json`):** `polygon-clipping@0.15.7`, `svgson@5.3.1`, `perfect-freehand@1.2.3`.

**The active problem (Sebs):** "It needs to detect ANY area that can be filled, even with a slight gap — this is a SOLVED problem, research it." Current fill rasterizes strokes (marching squares) into a region tree and picks by point-in-loop. It is **unreliable for nested shapes** (two triangles in a circle: tapping the ring works; tapping inside a small triangle floods the whole circle; small interiors starve).

---

## 1. Problem → Proven-Solution → Our-Recommendation tables

### 1A. REGION FILL — "fill ANY area, even with a slight gap, including nested" (ACTIVE PRIORITY)

This is the headline. The four proven approaches below are ranked by fit for a hand-stroke / SVG canvas under a 2026-06-18 deadline.

| Proven approach | How it works (essence) | Pros | Cons | Fit for us |
|---|---|---|---|---|
| **Raster span/scanline flood fill** (Inkscape Bucket Fill model: rasterize → span flood from click pixel → trace back to a path) | Render visible ink to an offscreen bitmap. Read the pixel under the click; if on ink, nudge to nearest empty pixel. Run a **span/scanline** flood (fill left+right tracking `lx..rx`, enqueue seeds on rows above/below within that span) — **not** naive 4-px recursion (span is 2–8x faster, cache-friendly). Stops at any boundary pixel. **4-connectivity** avoids diagonal pinhole leaks; 8-way fills more but leaks. **Gap tolerance** = Inkscape "Close gaps" (None/Small/Medium/Large ≈ 1/2/4/8 px): virtually thicken/bridge the boundary before flooding so a not-quite-closed shape still fills. After flood, vectorize the filled mask (potrace / marching-squares contour) into a path; a "Grow/shrink by" offset compensates for the trace eating the boundary. | **Most ROBUST** to messy/open strokes; the de-facto answer to "fill ANY area even with a slight gap" — gap closing is a first-class tunable. **Nested works natively**: clicking a tiny interior floods only that interior because surrounding ink bounds it (directly fixes "tap small triangle floods whole circle"). No fragile topology; trivially handles overlaps, T-junctions, self-touching paths. We already rasterize for marching squares, so the offscreen pipeline is largely in place. | Pixel-bound fidelity: edges quantize, hairline gap/overlap unless you trace + grow/shrink (Inkscape literally tells users to zoom + refill for crisp corners). Gap close past ~8px rounds corners / can bridge separate regions. Zoom/resolution dependent. A raster mask doesn't compose with SVG↔3D — must trace back to a polygon. | **PICKER OF CHOICE.** Use as the region-DETECTION step; pair with vector trace for geometry. |
| **Planar subdivision / arrangement + point location** (Adobe Illustrator Live Paint; Asente, Schuster & Pettit, SIGGRAPH 2007) | Split every stroke at all pairwise intersections → planar graph. Build a **DCEL / half-edge** arrangement (each edge → two twin half-edges; each bounded half-edge cycle → a FACE). Faces = exactly the fillable regions, including nested + overlap-created ones. Click = **point location** (find the face containing the click). Fill paints the face while original strokes stay editable (Live Paint keeps the planar map virtual + re-matches faces on edit). **Gap handling** explicit: "Paint stops at" = Small/Medium/Large/custom gap length; sub-threshold openings treated as closed; optional "Close gaps with paths" inserts real bridge segments. | **EXACT and resolution-independent** — true vector faces, crisp, compose perfectly with SVG↔3D. Every enclosed region enumerable up front (can highlight all fillable faces). Nested/overlap native, zero special-casing — the gold standard for "click ANY region including nested." Gap tolerance is a clean geometric parameter. Fills stable/editable: move a stroke → face re-derives. | **Heaviest to build.** Needs robust curve–curve intersection, numerically robust arrangement/DCEL, face extraction, point-location query — the CGAL 2D-Arrangements problem; FP robustness (near-tangents, collinear overlaps) is genuinely hard. **No mature lightweight JS arrangement lib** (CGAL is C++; JS DCEL libs partial). Gap bridging adds another layer. | **NOT for the deadline.** Correct gold standard, but days of work + robustness minefield. Aspirational post-makeathon. |
| **Polygon boolean / Martinez** (use installed `polygon-clipping@0.15.7`: union all stroke outlines → faces → point-in-face) | Convert each stroke to a closed **outline ring** (perfect-freehand already emits the stroke outline; thin/SVG strokes → buffer centerline to a ribbon). Feed all rings to `union()` (Martinez-Rueda-Feito, O((n+k)log n)) → a clean MultiPolygon: non-overlapping, each `[outerRing, ...holeRings]` in GeoJSON form, self-intersections resolved. **The HOLES are your enclosed regions** (a circle ribbon → one polygon whose hole is the disk; two triangles inside → nested holes/islands). Click = point-in-polygon vs candidate faces/holes, **innermost-first**, fill the smallest region containing the click. Gap closing: buffer each outline outward by ε before union so near-miss endpoints overlap; shrink fill back by ε. | **Already INSTALLED** — zero new dep; proven robust Martinez (handles self-intersecting rings, touching polygons, holes-in-holes). **Exact vector** output (composes with SVG↔3D). Much lighter than a full arrangement. Innermost-first point-in-polygon **directly fixes the nested bug**. | Returns boolean RESULTS, not an arrangement — **no half-edge/face topology, no adjacency**, no notion of every interior face for arbitrary crossing segments. Clean for closed-ribbon regions; **fiddly when strokes merely cross** (open ends / T-junctions don't produce a hole, so a region bounded by 3 crossing strokes may not appear). You must manufacture closed ribbons (buffer centerlines) + tune ε (too large bridges separate regions). Covers "regions enclosed by closed-ish ink ribbons," not full Live-Paint "any cycle of edges." | **USE FOR GEOMETRY, NOT DETECTION.** Best as: clean/boolean the *traced* fill polygon, donut difference, robustness backstop. |
| **Trapped-ball segmentation** (LineFiller / hepesu — the production gap-tolerant raster technique behind modern line-art colorization) | Raster method for OPEN/leaky line art. Conceptually "roll a ball of radius R" through non-ink pixels — any gap **narrower than the ball's diameter** can't be crossed, so it's ignored. Implemented via morphology: erode the fillable area with a circular element of radius R (seals gaps ≤2R), flood/label, dilate back to the ink. Run with **decreasing R** (big ball first for leak-proof big regions, then smaller balls for thin/small regions), then **merge** leftover pixels into adjacent regions. Output = per-pixel label map; click returns the label → fill it. | **Best-in-class gap tolerance.** The decreasing-radius pass is *exactly* the cure for "small interiors starve" (big regions stay leak-proof while small interiors still get their own label). Robust to genuinely messy hand strokes; battle-tested colorization preprocessing. Nested = separate labels for free. | Raster → same pixel-fidelity caveats (need trace-back to vectors). More expensive than one span-flood (multiple erode/dilate + merge); R schedule must be tuned to stroke scale. More machinery than click-to-fill needs — its payoff is full-image auto-segmentation. | **OPTIONAL UPGRADE.** If plain dilation isn't enough for very messy doodles later, swap the gap step to trapped-ball (same mask, more passes). Not needed for deadline. |

**How leading tools actually do it:**
- **Inkscape (Bucket Fill):** RASTER. Offscreen bitmap at current zoom → read click pixel → scanline/span flood bounded *perceptually* by any visible color change (transparent/invisible ignored) → tunable "Close gaps" autogap (~1–8 px) → vectorize mask with potrace → "Grow/shrink by" offset. Users zoom in for crisp corners.
- **Adobe Illustrator (Live Paint):** PLANAR MAP / ARRANGEMENT (Asente/Schuster/Pettit 2007). Virtual planar map from selected paths; intersections split into edges; each enclosed area = a face (DCEL under the hood). Click = point location; original paths stay editable; heuristics re-match faces after edits. Gaps via "Paint stops at" length + "Close gaps with paths."
- **Line-art colorization (PaintsChainer-era, hepesu/LineFiller):** TRAPPED-BALL — morphological erode/flood/dilate-back at decreasing radii → leak-proof across narrow gaps → merge leftovers. Standard gap-tolerant segmentation for messy hand-drawn line art.
- **Krita:** raster flood + "Grow selection" + gap-close/threshold. **Procreate ColorDrop:** raster flood + drag-to-adjust threshold. **Figma:** no arbitrary-region bucket (vector shapes only) — confirming that on stroke/ink canvases the proven answers are raster-flood-with-gap-closing or planar-map, **not** naive shape fills.

---

### 1B. DONUT / EVEN-ODD HOLES — hachure must not bleed into the hole (Bug U4, rose Change B)

| Proven approach | How | Pros | Cons | Fit |
|---|---|---|---|---|
| **Even-odd fill-rule (render-time)** | Emit the region as an SVG **compound path** (outer ring + inner hole ring(s)) with `fill-rule="evenodd"` so a ray crossing toggles inside/outside — the hole stays unfilled even under a hachure/pattern fill (pattern is clipped by the even-odd path, not the bbox). | One attribute; the literal browser-native donut mechanism (Illustrator/Inkscape/Figma all use compound paths + evenodd/nonzero). | Needs correct ring nesting known (which ring is the hole). | **DO BOTH.** Emit evenodd compound path so hachure never bleeds. |
| **Boolean difference (geometry-time)** | `polygonClipping.difference(outerRing, ...holeRings)` (mfogel `polygon-clipping@0.15.7`, installed). Pass GeoJSON ring arrays `[[outer],[hole1],…]`; returns clean non-self-touching MultiPolygons, drops inner-ring overflow → a true **annulus** to hatch. (Clipper2 is the C++ analogue with explicit `FillRule`.) | Standard + already a dependency; robust to self-touching/self-crossing input (non-zero interp); gives geometry you can **re-hatch/tessellate** so hachure is generated only over the annulus. | Winding/ring order must be right; O(n log n) heavy on dense contours; near-zero-area holes can vanish. | **DO BOTH.** Compute the real fillable annulus, hatch that, AND emit evenodd. |

---

### 1C. 3D RELIEF FROM 2D — embossed depth from tone/shade (svg-port 3D)

| Proven approach | How | Pros | Cons | Fit |
|---|---|---|---|---|
| **Heightmap + displacement** (bas-relief / lithophane — Blender Displace modifier, Cura/Bambu lithophane) | Treat tone/grayscale as elevation (white high, black low — invert as needed). Subdivide a plane mesh, displace each vertex +Z by sampled luminance × heightScale. Our shade-brush / tone bands ARE the discrete height bands → skip the rasterize-to-tone step. | Dead-simple, fully general (any drawing, object-agnostic), GPU-cheap, 1:1 onto our existing tone input. Same map doubles as bump/normal. | Single-sided embossed plate, not a watertight solid. Flat drawings get no relief. Stair-steps unless tone is smoothed first. | **PRIMARY relief path.** Drive height from existing tone bands; smooth field first. |
| **Normal map from height via Sobel** (NPR shading, no geometry) | Sobel/central differences: `dx=(h_r−h_l)/2`, `dy=(h_b−h_t)/2`; `normal = normalize(vec3(−dx*strength, −dy*strength, 1.0))`; pack `n*0.5+0.5` (flat = 128,128,255). Feed into the NPR/lighting shader. | Real-time, zero added geometry, convincing relief + a `strength` uniform; pairs with Smart Hachure NPR; cheap A/B vs displacement. | Fakes depth — silhouette/parallax stay flat, no self-occlusion. Needs denoised height or it amplifies stroke noise. | **CHEAP COMPLEMENT.** Add a strength slider; combine with or A/B against displacement. |

---

### 1D. TRUE 3D VOLUME — "plush" inflation from a closed silhouette (3D-port showpiece)

| Proven approach | How | Pros | Cons | Fit |
|---|---|---|---|---|
| **Teddy inflation** (Igarashi 1999) | For a simple closed loop: (1) constrained Delaunay triangulation of the polygon; (2) extract chordal/medial axis → prune to a spine; (3) elevate interior/spine vertices ∝ distance from the contour (wide → fat, narrow → thin); (4) sew/inflate into a rounded surface; (5) mirror front↔back → closed mesh. Canonical "puffy plush"; open MATLAB/JS reimpls exist. | Actual rounded 3D SOLID with real silhouette/volume (plush look, not a plate). Object-agnostic — only needs the outline. The "2D → real 3D" wow moment. | Requires a **single simple closed loop** (no self-intersection) → depends on clean silhouette + gap-closing first. Medial-axis pruning fiddly; nested/holes need per-region handling. Heavier than displacement. | **3D-PORT SHOWPIECE.** Feed it the clean-contour ring per region. Build after relief. |

---

### 1E. CLEAN SILHOUETTE from noisy contour + NESTED-REGION DETECTION (shared upstream fix)

| Proven approach | How | Pros | Cons | Fit |
|---|---|---|---|---|
| **Simplify THEN smooth** | marching-squares contour → **Visvalingam-Whyatt** simplify (tol ≈ 0.003·perimeter; V-W gives more natural geometry than Douglas-Peucker, which can spike) → **corner-aware** smoothing: adaptive Chaikin (2–4 iters; replace each vertex with pts at ¼ and ¾ of each segment → quadratic B-spline) OR centripetal **Catmull-Rom α=0.5** (interpolating, provably cusp/overshoot-free). Detect sharp keypoints first and EXEMPT them so intended corners stay sharp. | Standard GIS/generative pipeline. Simplify-first kills raster jaggies cheaply; corner-aware keeps sharp corners while rounding noise. Centripetal Catmull-Rom avoids cusps — ideal before Teddy (needs a simple closed loop). | Plain Chaikin/Catmull can't keep sharpness without a corner-detection pass. Over-simplify erases small features; too many iters rounds real corners. Two-stage tuning. | **UPSTREAM for 3D rims (3D-1) + Teddy.** Route the svg-port carve silhouette through `smoothClosedLoopCornerAware` (fixes jagged rims). |
| **Contour-tree / ring-containment hierarchy** (root-cause fix for the fill bug, vector route) | Extract ALL closed contours (marching squares / d3-contour). For each ring, ray-cast point-in-polygon vs all others (bbox-prefilter) → parent = smallest enclosing ring; even depth = solid, odd depth = hole. A tap resolves to the **DEEPEST ring whose interior contains the point** → tapping a small triangle fills that triangle; the ring between triangle and circle fills as an annulus via `difference()`. | Directly fixes "tap small interior floods whole circle" + "small interiors starve" — selection = deepest-containing-ring, not first-loop-hit. General, object-agnostic, reuses marching-squares output. Hierarchy feeds the donut + Teddy fixes too. | O(n²) naive containment (bbox-precheck to mitigate); needs robust on/near-edge point-in-polygon; **requires contours to actually close** (pair with gap-closing first). | **VECTOR ALTERNATIVE to the raster picker.** Cleaner topology but inherits the "must close" weakness — which is exactly why the raster span-flood picker (1A) is recommended as primary. |

**How leading tools do the 3D/hole/silhouette parts:** Blender Displace + Cura/Bambu lithophane = canonical luminance→displacement; Substance/UE/Unity material graphs = Sobel height→normal; Carveco AI + Meshy "sketch-to-3D" = image→bas-relief; Igarashi Teddy (SIGGRAPH '99) = THE volume reference (basis of ZBrush ZSphere-style + sketch-modelers). Holes: every vector tool uses compound paths + `fill-rule` evenodd/nonzero; Clipper2 + mfogel/polygon-clipping expose difference/xor with explicit FillRule (holes = inner rings, outer first). Silhouette: ArcGIS/QGIS/PostGIS ship Douglas-Peucker AND Visvalingam-Whyatt (V-W preferred), then Chaikin/Catmull; d3-contour builds nested contour polygons (outer+hole rings) straight from marching squares — same containment-by-winding logic that resolves nested selection.

---

## 2. Known-bugs inventory (status, reconciled with git)

> Session-fix reconciliation: FIX-SPEC docs were written against HEAD `ce30289`, but 9 fix commits + earlier RC commits landed on top — several docs list bugs as "open" that git shows committed. Status below reflects git.

### Fixed this session (verified in git)
| Bug | Commit | File |
|---|---|---|
| 2D shade-brush tone fills ignored fill-style (paper fallback → flat grey, I-2 violation) — fixed via `RULE_enclosing_tonal_wash` | `ae6e449` (live-verified solid/hachure/crosshatch/dots/zigzag/dashed distinct) | `classifier.ts` |
| Fill detection failed with MULTIPLE shapes (union-bbox pool starved each enclosure) — per-cluster connected-component extraction at full local res | `9e7f907` (live box+circle) | `DrawSurface.tsx` extractFillRegions + `strokeTo3d.ts` extractPoolRegions |
| **Nested/concentric: tap inner floods whole outer; small enclosed hole fills parent (starved at 200-cell grid)** — D1/D2 lift 2D FILL lane to 400-grid (safe because extraction now per-cluster) | `6d6f882` (ring+two-triangles knockout verified; **tap-inside-small-triangle rides same detection but auto-capture flaky — follow-up flagged**) | `DrawSurface.tsx` |
| Complex filled SVG → 3D bird's-nest (compound path sampled as ONE element) — Change A splits multi-subpath, samples each subpath as own loop | `5b2cde0` (rose recognizable, 0 errors; **PARTIAL: Change B loop-union deferred; 60-stroke cap drops ~half the rose loops**) | `svgToStrokes.ts` |
| `viewBox='Infinity…'` console error (3D-2, empty pool) — degenerate-bbox guards | `f82f96c` (rose svg-port 0 console errors, was 3) | `strokeTo3d.ts` + `drawingTexture.ts` |
| Gap slider couldn't close >~70px gap (GAP_LADDER capped gapMult=3 ~48px) — D3 extend ladder to bridge ~96px | `f82f96c` | `DrawSurface.tsx` |
| SNAP overshoot tail past closing vertex (collapse only within ~8px) — D4 proportional tol `max(8px, 4%·bboxDiag)` | `99d6666` (**PARTIAL: circle-seam endpoint sub-bug + live snap verify left**) | `shapeFit.ts` |
| rough.js 'dots' on large dark region → ~19.7M-char path tab freeze — U3 cap MAX_DOTS=6000 | `c9dcf6c` (bound by construction; freeze-stress verify follow-up) | `renderRegion.ts` |
| `url()` pattern/gradient fills → blank outline — U5 keep source fill beneath hand-feel outline | `b475fb5` (gradient upload preserves 2 url() fills + 2 defs) | `smartHachure/index.ts` |
| Inherited `<g fill>` dropped → fill-style no-op on grouped uploads — U1 'g' case unions leaf geometry | `638eb0e` (rose `<g fill>` yields 2 fill groups, was 0) | `renderRegion.ts` |
| Snap mislabeled polygon side-count (5-gon read "Polygon (8)") — `countTrueSides()` collapses near-collinear | `ae6e449` | `shapeFit.ts` |

### Fixed earlier in session (RC fixes, per DECISIONS-FOR-SEBS)
| Bug | Commit |
|---|---|
| RC-1 dark-fill swallows interior detail (posters/jewel-cases/trading-cards/stipple) | `ace3151` |
| RC-3 strokePalette bg/inverted both → `var(--dir-bg)` on ink = invisible ink | `eb99f7c` |
| RC-4 slider floors zero the render (inkIntensity=0 → all 197 empty) + 3D framing | `eb99f7c` |
| RC-2 solid/extrude buries hand (mass=body, strokes overlaid as raised relief) | `4dba28a` |
| RC-5 wet-ink + charcoal styles DEAD (host gate now admits them) | `b2bda13` |
| RE-DRAW strokes cut off / cropped (CASE-2) | `aaac4d4` |
| RE-DRAW modal missing draw tools (Phase-0 shared DrawToolbar) | `ac4c963` |
| Fill clean edge (bleed past outline + white corner-notches) | `fb52ea5`, `b96aa6c`, `0b81414` |

### Open / partial (priority for the fill family in **bold**)
| Bug | Status | Severity | File |
|---|---|---|---|
| **evenodd DONUT loses its hole / floods solid under rough+stipple** (extractRegionPath doesn't propagate fill-rule; transformElement splits subpaths into solid discs). **Lever: `polygon-clipping` difference.** Same family as rose Change B. | **open (U4)** | medium | `renderRegion.ts` |
| **'Stipple' SVG-style preset renders as diagonal hachure not dots on uploads** (not in STYLE_OWNS_FILL_GRAMMAR + stale `fullModifiers.fillStyle` wins). `project_f3_styles_must_all_be_real` violation. | **partial** — U1 root flows dots on `<g>` uploads; U2 state-staleness harden NOT committed | high | `smartHachure/index.ts` |
| svg-port 3D JAGGED RIMS — carve silhouette read off rasterized markup (RDP-coarse + outline jitter) instead of Chaikin-smoothed ring. **Fix 3D-1: route carve through `smoothClosedLoopCornerAware`.** | open — Sebs confirmed still jagged live | high | `drawingTexture.ts` (buildSvgPortTexture) + `Stroke3DScene.tsx` |
| Circle draw + snap doesn't fully CLOSE (seam/notch on large, overshoot on small) | open (D4 circle sub-bug) — overshoot-tail half fixed (`99d6666`) | medium | `shapeFit.ts` (applyCandidate seam-seal) |
| svg-port 3D marks faint/sparse — structure fixed+committed (`ffab74b`, `e67aae5`, `899761c`); boldness = Sebs eyeball | partial | medium | `Stroke3DScene.tsx` + `drawingTexture.ts` |
| RC-2 open-tangle anti-fixture guard (tangleToy structure-loss) — solid-buries-interior fixed (`4dba28a`); openness guard still flagged P1 | partial | medium | `strokeTo3d.ts` (buildPoolSolidGeometry) |
| **RC-1 3D hachureGap HIGH (30px) has LOW floor but NO HIGH cap → tone band renders to nothing on 192/197 (SA-2 violation).** 2D 12px cap not ported to 3D shader. ~30-min one-shader-line fix. | open — highest-volume 3D defect (76% of 3D breaks) | high | `hatchMaterial.ts` |
| RC-3 3D rod radius LOW (0.01) hairline + auto-framing over-zoom overflow (seltzerCan/begleri/boardingPassTW) | partial — framing addressed `eb99f7c`; still listed P2 | low | Stroke3DScene framing (FRAME_K) |
| Elongated drawing shifts out of view SKETCH→STYLE (CASE-3) — fix understood (percentage-source hosts), not re-implemented on HEAD | open | medium | `SvgStyleTransform.tsx` |
| learnedProvider DEAD — 92.7% signals model exists but default chain = `[ruleEngineProvider]` only | open — gated behind golden-v3 bless | medium | `learnedProvider.ts` + `index.ts:194` |
| O(n²) sibling pass has NO element-count cap — large innocent upload (10k siblings) hangs tab on classify (H5) | open — quadratic fixture + sibling cap not built | high | `signals.ts:171` |
| `<use>`/`<symbol>` instantiation silently dropped — icon-system SVGs render empty (H7) | open | medium | `signals.ts` (normalizeTag, SKIP_TAGS) |
| `contentHash` `crypto.subtle.digest` unguarded — insecure context → PUBLISH crashes (judge-env variable) | open — needs JS SHA-1 fallback | medium | `…contentHash.ts:27` + `session.ts` |
| WebGL unavailable / context-loss on 3D frame — no `webglcontextlost` listener, no fallback (highest-stakes surface) | open | medium | `Stroke3DScene.tsx` |
| `/canvas` ZERO responsive code (hardcoded 280/360); `/desk` chrome > viewport ≤400px (O3) | open — Sebs in/out decision (demo is desktop) | low | `/canvas` + `/desk` chrome |
| Single dot/tap → zero strokes, no feedback (O5); off-canvas drag selects UI text (O6) | open (by-design polish) | low | `DrawSurface.tsx` |
| `/playground` '3D' toggle is a DEAD control | open — safe-fix prepared in worktree | low | `DeskDoodlesPlayground.tsx` |
| personalSpace read helpers don't gate on `isPersonalSpaceDbReady()` — flag-on 404/400 on /desk mount | open (clean safe fix) | low | `personalSpace.ts` |
| Invalid `?desk=N` silently falls back to OPEN desk, zero signal (O4) | open — Sebs decision | low | DeskPage ~965-980 |
| Two live decision-log channels (`shadeFillLog.ts` + `shapeSnapLog.ts`) NOT in KNOWN_SOURCES → feed-dataset drops them (violates keep-feeding-smart-ml; shade-fill carries explicit `darknessL`) | open — adapters + KNOWN_SOURCES entries not added | medium | `feed-dataset.mjs` + log files |
| Uploaded image input ('upload-image') honestly-labeled STUB ("Coming with autotrace") | open (R10) | low | DrawPanel 'upload-image' |
| `/public` is placeholder (marketing copy + CTA; real surface = /desk + /desks) | open (gap/relabel) | low | `DeskDoodlesPublicCanvas.tsx` |

---

## 3. Upcoming / planned

**Drawing-tool features (FEATURES-UX-BUILD-SPEC):**
- Phase 0 — shared `DrawToolbar.tsx` extracted, wire all 3 hosts (DrawPanel, DeskDoodlesCanvas, ObjectSurface RE-DRAW). Behavior-preserving. (Landed `ac4c963`.)
- Phase 1 — auto-detect-on-pen-up (`onStrokeCommitted` → fitStroke → propose best candidate) + PERSISTENT override receipt (SwitchPopover: recognized ∪ 12 library shapes ∪ Original; no fade-timer). Scaffolds present (OverrideReceipt.tsx, SwitchPopover.tsx, switchSet.ts).
- Phase 2 — Shapes quick-pick row (ShapeStrip.tsx) + armedShape insert (drag-to-place, Shift aspect-lock, click-to-place fallback) + Tier-A corner-resize. Stops before rotation/skew/multi-select/layers (restraint line).
- Phase 3 — More-overflow popover for the 12-shape tail + 'auto' shapeSnapLog outcome (feeds dataset) + eyeball-tune inline-count at narrow width.
- MORE PRIMITIVES beyond 12 (Sebs 3x); select different PARTS of a drawing (any region/stroke, not just last-drawn); select WHAT snaps (user control); rework 2D/3D + input mode-switch UX. All design-decision → main chat.
- FULL draw-tool gambit ON `/canvas` (3D) route (free via Phase-2 DrawToolbar `variant='canvas'`).

**3D / R-series:**
- R9 — wire 3D into the desk (2D↔3D flip + orbit on a PLACED object — the demo climax; architecturally absent today). R9 personal-space wire. 
- R10 — image mode (image→simpler hand-drawn SVG via Quiver Arrow Supabase Edge fn); hard-3D path (fal.ai/TRELLIS + Tripo fallback, scaffold inert default-OFF); ML go-live (wire learnedProvider as abstain-filler + held-out regression gate, gated on golden-v3 bless).
- R11 — 3D symmetry-law completeness + iterate THE LOOP (audit→fix→re-audit).
- svg-port 3D craft tuning — final mark boldness + jagged-silhouette-vs-boldness displacement tradeoff (paired with 3D-1 rims fix).
- Persistent conversion cache (CLAUDE.md headline) NOT built — content_hash stamped, never read as cache key (H2): build thin OPFS/IndexedDB cache or reframe.
- 3D round-trip BACK-HALF (3D→2D re-projection) does not exist — reframe the wedge claim (recommended) or build (H1).

**Process / submission:**
- THE GRANDE-DADDY OFAT — final R8 cert, gated on BOTH bug-fixes AND draw-tool Phases 1–3. Full 197 + gap objects + online-SVG corpus, LIVE on :5182, paired-vs-Clean, one object per parallel agent, every result feeds the dataset. NO harness-only claims (prior "all-197 OFAT 0 BREAK" was overclaimed).
- Re-run per-stage OFATs on FIXED code (live, paired) before grande-daddy; build dataset adapters; add 8 EXHAUSTIVE-AUDIT gap fixtures.
- Submission: Make checkpoint #2; golden-v3 bless; push origin/main (~31 commits unpushed, public README stale at "Day 5 of 14"); Supabase realtime + dompurify; keepalive cron; demo video (06-17, capture the lockstep-slider wedge); social cut + qualifying post (#ConfigMakeathon + @figma); Contra form; og-image 1200×630.
- Identity / own design+motion pass (06-16, R12, design-decision → main chat).
- **FILL — use `polygon-clipping@0.15.7` (installed, proven) as the analytic lever for U4 evenodd-donut difference + robustness backstop for D1/D2 nested fill + rose Change-B loop union, replacing/augmenting the marching-squares raster.**

---

## 4. Recommended refactor path — REGION FILL (the active priority)

**Top recommendation: a HYBRID — raster span flood for region DETECTION + gap tolerance (the robust part), and exact vector trace via marching-squares + `polygon-clipping@0.15.7` for the fill GEOMETRY (the part that composes with SVG↔3D).** This gives ~90% of Live Paint's behavior (click any region, nested, gap-tolerant) with code we mostly already have, and avoids the planar-arrangement robustness minefield that is wrong for a 2026-06-18 deadline.

### Step 1 — PICK = raster span flood (the core fix; addresses click-any-region + nested)
On click, render current strokes to an offscreen canvas at a **fixed, generous resolution** (e.g. 2× display, **not zoom-dependent** — reuse the buffer we already build for marching squares). Sample the pixel under the click; if on ink, nudge to the nearest empty pixel. Run a **scanline/span flood** with **4-connectivity** (avoid diagonal pinhole leaks), bounded by "is-ink" pixels.

This single change fixes BOTH reported bugs **for free**:
- Clicking inside a small nested triangle floods only that interior (bounded by its own ink) — kills "tap small triangle floods whole circle."
- Small interiors no longer starve — flooding is **local to the click**; there is no global region tree to misassign.
- Nested/concentric shapes need **zero special-casing**.

### Step 2 — GAP TOLERANCE = pre-close before flooding (Inkscape autogap, ~1–8 px)
Before the flood, **dilate the ink mask** by a small radius `g` (a 3×3 or 5×5 max/dilation pass), exposed as a **None / Small / Medium / Large slider mapping to ~1 / 2 / 4 / 8 px**. This seals slight gaps so the flood can't escape — exactly satisfying "detect ANY area that can be filled, even with a slight gap." Flood on the dilated mask but RECORD the region; when you trace, trace against the **original (undilated)** ink and optionally **grow the fill by ~g/2** so it tucks under the strokes with no hairline. (Upgrade path for very messy doodles later: swap dilation for **trapped-ball** — decreasing-radius erode/flood/dilate — same mask, more passes. Plain dilation is enough for the deadline.)

### Step 3 — FILL GEOMETRY = trace the flooded mask → clean with `polygon-clipping`
Run marching squares **on the flooded region mask** (not on all strokes) to get the region contour as a polygon (outer ring + inner holes where ink islands sit inside the region). Pass that polygon through `polygon-clipping@0.15.7` (union with itself / as-is, and `difference(outer, ...holes)` for donuts) → a clean, non-self-intersecting MultiPolygon. Store as the fill path. This keeps fills as **real vectors that round-trip to 3D**, gives crisp resolution-independent edges once traced, and applies the grow/shrink offset cleanly. `polygon-clipping` is already installed — no new dep.

### Why NOT the alternatives (for this deadline)
- **Full planar arrangement (Live Paint):** the "correct" gold standard — would enumerate every face exactly — but **no robust lightweight JS arrangement/DCEL library exists**; building one (curve intersection + numerically robust half-edge + point location + gap bridging) is days of work and a FP-robustness minefield. Wrong call for 2026-06-18.
- **Pure `polygon-clipping` union-of-ribbons AS THE PICKER:** only yields regions enclosed by **closed ink RIBBONS** (holes). Regions bounded merely by crossing/T-junction strokes wouldn't appear, and you'd have to buffer every centerline into a ribbon + tune ε — more fragile than raster flood for arbitrary doodles. Use `polygon-clipping` for what it's great at: **cleaning/booleaning the traced fill polygon + donut difference**, not for detection.

### Net
Keep the raster step we already have. **Swap the global region-tree pick for a LOCAL span flood seeded at the click**, add a dilation-based gap slider, and trace+clean the flooded region into a vector fill via marching squares + `polygon-clipping`. Minimal new code, fixes the nested/starving bugs at the root, stays object-agnostic (pure region signals, never object identity — per `project_desk_doodles_generalizes_to_arbitrary_drawings`), and round-trips to 3D. **Verify LIVE at real scale on :5182** (per `feedback_live_check_not_headless_harness`), including OOD doodles: nested triangles-in-circle, donut, gapped strokes.

---

## 5. Citations (real, verifiable)

**Region fill / flood / gap closing**
- Flood fill (span/scanline, 4 vs 8 connectivity): https://en.wikipedia.org/wiki/Flood_fill
- Inkscape Bucket Fill (FLOSS manual): https://archive.flossmanuals.net/inkscape/toolbox/bucket-fill-tool.html
- Inkscape Paintbucket Toolbar (gap-close settings): https://wiki.inkscape.org/wiki/Paintbucket_Toolbar
- Inkscape paintbucket tutorial: https://wiki.inkscape.org/wiki/Scratchpad_paintbuckettutorial
- Inkscape Bucket gap manual: http://tavmjong.free.fr/INKSCAPE/MANUAL/html/Bucket-Gap.html

**Planar map / Live Paint / arrangements**
- Illustrator Live Paint — find & close gaps: https://helpx.adobe.com/illustrator/desktop/paint-and-fill/learn-painting-basics/find-and-close-gaps-in-live-paint-groups.html
- Illustrator Live Paint groups: https://helpx.adobe.com/ca/illustrator/using/live-paint-groups.html
- Asente, Schuster, Pettit — Dynamic Planar Map Illustration (SIGGRAPH 2007), Adobe Research page: https://research.adobe.com/publication/dynamic-planar-map-illustration/
- Asente et al. paper PDF: https://www.lri.fr/~mbl/FundHCI/papers/Asente-SIGGRAPH07.pdf
- DCEL / half-edge: https://en.wikipedia.org/wiki/Doubly_connected_edge_list
- CGAL 2D Arrangements: https://doc.cgal.org/Manual/3.3/doc_html/cgal_manual/Arrangement_2/Chapter_main.html

**Polygon boolean (Martinez) — installed lever**
- mfogel/polygon-clipping (installed @0.15.7): https://github.com/mfogel/polygon-clipping
- w8r/martinez: https://github.com/w8r/martinez
- martinez-polygon-clipping (npm): https://www.npmjs.com/package/martinez-polygon-clipping
- Clipper2 overview (FillRule analogue): https://www.angusj.com/clipper2/Docs/Overview.htm
- Clipper2 FillRule types: https://www.angusj.com/clipper2/Docs/Units/Clipper/Types/FillRule.htm

**Trapped-ball segmentation**
- hepesu/LineFiller: https://github.com/hepesu/LineFiller
- Morphological closing: https://en.wikipedia.org/wiki/Closing_(morphology)
- Vectorization survey (Lei Qi et al.): https://cecilialeiqi.github.io/vectorization.pdf

**Holes / fill-rule**
- MDN fill-rule: https://developer.mozilla.org/en-US/docs/Web/CSS/fill-rule
- Using SVG — fill-rule (O'Reilly): https://oreillymedia.github.io/Using_SVG/extras/ch06-fill-rule.html
- Compound paths (Shaper): https://www.shapertools.com/en-us/blog/compound-paths

**3D relief / normal / volume**
- Normal mapping: https://en.wikipedia.org/wiki/Normal_mapping
- Igarashi Teddy (1999) PDF: https://www.cs.toronto.edu/~jacobson/seminar/igarashi-et-al-1999.pdf
- Teddy (ACM DOI): https://dl.acm.org/doi/10.1145/311535.311602
- Teddy MATLAB reimpl: https://github.com/alextpf/teddy_matlab/
- Meshy sketch-to-3D: https://www.meshy.ai/blog/sketch-to-3d
- Carveco AI image→relief: https://learn.carveco.com/3d-design-reliefs-and-models/carveco-ai-image-to-relief/
- 2D image → height map / bas-relief: https://theartsquirrel.com/3787/2d-image-to-height-map-for-bas-relief/

**Silhouette simplify + smooth + nested-contour**
- Chaikin's algorithm (UNC lecture): https://www.cs.unc.edu/~dm/UNC/COMP258/LECTURES/Chaikins-Algorithm.pdf
- Chaikin (Observable): https://observablehq.com/@pamacha/chaikins-algorithm
- Adaptive corner-aware clip: https://boundaries.r-euclid.com/reference/corner_clip.html
- Centripetal Catmull-Rom: https://en.wikipedia.org/wiki/Centripetal_Catmull%E2%80%93Rom_spline
- shapelysmooth: https://github.com/philipschall/shapelysmooth
- Line simplification (DP vs V-W): https://martinfleischmann.net/line-simplification-algorithms/
- ArcGIS Simplify Polygon: https://pro.arcgis.com/en/pro-app/latest/tool-reference/cartography/simplify-polygon.htm
- Marching squares: https://en.wikipedia.org/wiki/Marching_squares
- d3-contour (nested outer+hole rings): https://github.com/d3/d3-contour
- Point in polygon: https://en.wikipedia.org/wiki/Point_in_polygon
- Ray-casting algorithm: https://rosettacode.org/wiki/Ray-casting_algorithm
