# Fill Clean-Edge — Algorithm Research & Recommendation

**Status:** research + recommendation only. No app-src edits, no dev server, no commit.
**Date:** 2026-06-13.
**Scope:** the 2D SHADE→Fill clean-edge problem, mapped to our actual grid + all three tone tools (Fill / Lasso / Brush).
**Audience:** the build agent that executes the fix against `rasterizeFillPatch`.

---

## 0. The constraint (what "clean" means for Fill)

When the user draws a closed shape and fills it (SHADE → Fill, tap inside), the grey tone must conform to the **VISIBLE perfect-freehand ink edge** with ALL FOUR of:

- **(a) NO bleed** past the outline (grey never pokes outside the visible ink).
- **(b) NO white sliver** between fill and ink (grey reaches *under* the ink, which is drawn on top).
- **(c) sharp CORNERS preserved** (no notch, no rounding of a drawn square's corner).
- **(d) watertight** (no empty / partial fill), at any scale.

The ink is drawn **ON TOP** of the tone (z-order: tone patches first in document order, strokes last — `strokesToObjectMarkup` line ~177, `composeBackdropAndStrokes` line ~922). This z-order is load-bearing: it means the tone is *allowed* to reach the ink's centerline / inner-half and still look clean, because the opaque ink covers that overlap. "Clean" is therefore: **tone's outer boundary lands somewhere between the ink's inner edge and the ink's centerline — never past the ink's outer edge.**

### The three failed ad-hoc attempts (and which constraint each broke)

| Attempt | What it did | Broke |
|---|---|---|
| **Centerline-capsule wall** (`inkLines` branch, lines 780–1064) | swept fat/thin capsules along the raw/streamlined gesture centerline as the reach + flood barrier | **(a) bleed + facets** — the capsule follows the *faceted raw stroke* and bows OUTSIDE the smooth `getStroke` ink on convex bends/corners (perfect-freehand thins + pulls inward there, the capsule doesn't) → grey pokes past the visible ink (measured ≤11px overshoot). |
| **Thin perfect-freehand RIBBON as a flood barrier** (the `inkOutlines` branch's `inkMask` *alone*, lines 472–495) | rasterized the thin ink outline ribbon (~4px) and scanline-filled it as the only flood wall | **(d) empties the fill** — a ~4px ribbon rasterizes with GAPS on the 2px grid (a tapered edge is sub-cell ~0.6px → no cell center inside it → zero ink cells on that edge). The border flood leaks straight through the gap → the whole interior is reachable from outside → zero fill. |
| **Inward grid EROSION** | eroded the interior mask inward by N cells to tuck it under the ink | **(c) notches corners** — a square's corner cell erodes from *two* axes at once, biting a diagonal notch out of the corner. (Confirmed by morphology theory: erosion/closing rounds convex corners — see §1.3.) |

The current code (the live `inkOutlines` PRIMARY branch, lines 435–779) is the **4th attempt**: it patches all three failures by *combining* their pieces — exact ink mask for reach (fixes bleed + corners), a fat centerline capsule `floodWall` only to bridge gesture gaps (fixes the empty-fill leak), and a thin `reachWall` point-trace to plug the sub-cell taper gap. It is correct in principle but is a 340-line tangle of four interacting flood passes (outside / phantom / seed-grow / hole-carve) with hand-tuned radii (0.5-cell / 1-cell / 2-cell) that has regressed repeatedly ("BLED at scale", per SESSION-HANDOFF). This doc's recommendation **keeps that exact strategy but replaces the brittle multi-pass machinery with a single clean construction.**

---

## 1. Algorithms compared (cited)

### 1.1 Polygon offsetting / inward buffer (straight-skeleton / Clipper2 / Minkowski)

Inset the **region polygon** (or the ink polygon) inward by the ink half-width using a true geometric offset, instead of a grid erosion.

- **Straight skeleton**: each edge translates perpendicular inward at uniform speed, vertices move along the **angular bisector**, sharp corners maintained at the wavefront. "This offsetting technique will keep the corners of the polygon as-is." ([CGAL Straight Skeleton & Polygon Offsetting](https://doc.cgal.org/latest/Straight_skeleton_2/index.html))
- **Clipper2 / clipper-lib**: customizable polygon offsetting (inflate/shrink) via the Clipper algorithm; corner behavior is configurable (miter/round/square join). ([Clipper2 Overview](https://www.angusj.com/clipper2/Docs/Overview.htm), [clipper-lib](https://github.com/junmer/clipper-lib))

| Criterion | Verdict |
|---|---|
| Corner behavior | **Excellent** with straight-skeleton / miter join (bisector preserves corners). |
| Watertightness | Excellent (it's exact polygon geometry, not a raster). |
| Fit to our 2px grid + marching-squares pipeline | **Poor.** Our entire pipeline is raster (the band grid IS the source of truth; `extractToneFills` runs marching squares over it). An offset polygon would have to be re-rasterized into the grid anyway — so we'd pay for a polygon offset *and* a rasterization, and re-introduce a grid-quantization edge. It solves a problem (corner-preserving inset) we can avoid entirely (see §2: we don't need to inset at all — the extractor already gives us a corner-true interior polygon, and the ink mask already carries the corner). |
| Dep cost | `polygon-clipping@0.15.7` is **already installed** but does **NOT do offsetting** — only union/intersection/difference/xor ([polygon-clipping README](https://github.com/mfogel/polygon-clipping/blob/main/README.md)). A true offset needs **a new dep** (clipper-lib ~ tens of KB, or js-angusj-clipper WASM) or a hand-rolled straight-skeleton (hard, corner cases). |

**Reject as the core mechanism** — wrong paradigm (polygon, not raster) for a raster pipeline, and needs a new dep. *But the boolean side of the already-installed `polygon-clipping` is useful for an OPTIONAL polish pass — see §2.5.*

### 1.2 Signed-distance-field (SDF) threshold

Build an SDF from the ink ribbon (or interior), threshold at the inner edge — watertight by construction.

- An SDF stores distance to the nearest edge; thresholding "fill[s] everything with a higher elevation than that contour line" — watertight, smooth.
- **Disqualifying corner behavior:** single-channel SDF **rounds sharp corners**: "A common complaint was that corners end up rounder than they should... distance alone cannot accurately represent coverage at corners." Only **multi-channel (MSDF)** fixes it, by storing distance to the closest *two* edges. ([Red Blob Games — SDF Fonts](https://www.redblobgames.com/x/2403-distance-field-fonts/), [Chlumský msdfgen](https://github.com/Chlumsky/msdfgen))

| Criterion | Verdict |
|---|---|
| Corner behavior | **Single-channel: rounds corners (fails (c)).** MSDF preserves them but is a font-rasterizer-grade subsystem. |
| Watertightness | Excellent. |
| Fit to our 2px grid | A single-channel SDF over a 2px grid would round corners *worse* than the grid already does. MSDF is wildly out of scope for a 2px tone grid. |
| Dep cost | MSDF = new heavy dep or large hand-roll. |

**Reject** — single-channel rounds corners (fails (c)); MSDF is out of scope.

### 1.3 Marching-squares + morphological close/open

After extracting the interior mask, run a morphological **close** (dilate-then-erode) to seal gaps, or grow-then-shrink for clean edges.

- Closing = dilation followed by erosion with the same structuring element. ([HIPR2 Closing](https://homepages.inf.ed.ac.uk/rbf/HIPR2/close.htm))
- **Disqualifying:** "When dilating by a disk... **convex boundaries will become rounded**, and concave boundaries will be preserved." "Closing **rounds the concave corners** of each shape, while opening **rounds the convex corners**." ([HIPR2 Dilation](https://homepages.inf.ed.ac.uk/rbf/HIPR2/dilate.htm), [Roboflow morphology](https://blog.roboflow.com/morphological-operations/))

| Criterion | Verdict |
|---|---|
| Corner behavior | **Rounds corners** (convex via open, concave via close) — fails (c). This is the *theoretical reason* the erosion attempt notched and any morphology-based grow/shrink will damage corners. |
| Watertightness | Good for sealing small holes, but a square structuring element grows the silhouette and an octagonal one rounds it. |
| Fit | Cheap on our grid, but corner damage is fatal. |

**Reject** — morphology rounds/notches corners by definition (fails (c)). *Exception: morphology is fine for the BRUSH, which is deliberately soft-edged — see §4.3.*

### 1.4 The "ink mask" approach — WATERTIGHT solid ink, fill up to it

This is the standard paint-program technique. Two halves:

**(i) Build a watertight ink solid.** Rasterize the ink as a SOLID, gap-free mask. The thin-ribbon failure (1, above) came from rasterizing only the *outline ribbon* — a thin band with sub-cell gaps. The fix is to rasterize the ink as **FAT CAPSULES along the centerline at radius = ink half-width, UNIONed across all strokes**. A capsule is convex and solid (every cell within `r` of the segment is set), so a union of capsules is **watertight by construction** — no sub-cell gaps regardless of grid resolution, unlike the thin ribbon. This is the standard "stroke a thick line into a mask" primitive (`stampToneCapsule` already does exactly this for the brush; the 3D `extractPoolRegions` does it as `inkRadius`-stamping, line ~217 `SOLID_INK_RADIUS`).

**(ii) Fill the interior, then EXPAND it under the ink, clipped to the ink mask.** This is the documented paint-bucket cure for the antialiased-fringe (white-sliver) problem:

- The sliver IS the standard antialiased-fill fringe: "a fuzzy fringe of pixels between the edge of your fill and the inside edge of the outline... caused by antialiasing artifacts." The cure is to **expand the fill so the antialiasing pixels are included** ("increase the Tolerance... so the antialiasing pixels are also included as target pixels", "Expand Fill... successive clicks expand the paint... eventually covering the gap"). ([Adobe — fill leaving an outline](https://community.adobe.com/t5/photoshop/is-there-a-way-to-make-the-paint-bucket-tool-actually-fill-a-selection-witout-leaving-an-outline/td-p/9920413), [Flood fill — Wikipedia](https://en.wikipedia.org/wiki/Flood_fill))
- **The clip is what gives us (a):** expanding the fill into the ink kills the sliver (b), but expanding *unbounded* would bleed (a). Clipping the expansion to the watertight ink mask means the fill can grow under the ink but **never past the ink's outer edge** → no bleed.

| Criterion | Verdict |
|---|---|
| Corner behavior | **Sharp** — the ink mask carries the true corner (it's the union of capsules along the real corner geometry), and the clip stops the expansion *exactly at the mask*, so the corner is neither rounded (no morphology on the result) nor notched (no inward erosion). The fill grows OUT into a corner that's already correct, not IN where two axes fight. |
| Watertightness | **Excellent** — capsule union has no sub-cell gaps; the interior flood is bounded by a closed barrier. |
| Fit to our 2px grid + marching-squares | **Native.** Capsule-stamping, border flood, and clip are all the operations the grid already does (`stampToneCapsule`, the flood in `rasterizeFillPatch`, the marching-squares extractor). No new paradigm. |
| Dep cost | **Zero** — pure grid ops, no lib. |

**This is the recommendation.** It is exactly the strategy the current 4th-attempt code already uses (`inkMask` for reach, `floodWall` for enclosure) — but the *implementation* is over-complicated. §2 specifies the clean version.

---

## 2. Recommendation — "Watertight ink mask + clip-the-expansion"

### 2.1 One-paragraph statement

Rasterize the bordering ink into ONE **watertight ink mask** `inkSolid` = the UNION of fat capsules stamped along every bordering stroke's centerline at **radius = the ink's half-width** (`STROKE_OPTS.size/2 ≈ 2px`, the same half-width perfect-freehand draws). Flood the window border through cells that are NOT `inkSolid` → `outside`; the interior is everything not `outside` and not `inkSolid`, seeded from the tapped region so only the tapped component fills (gives (d) watertight — the capsule union is a closed barrier, no leak). Then **expand the interior outward by ≥ the ink half-width but CLIP every expansion cell to `inkSolid`** (`grow ⇒ only set a cell if it is inside `inkSolid``). The expansion eats the white sliver by reaching under the ink (b); the clip stops it dead at the ink's outer edge so it can never bleed (a); and because the clip target (`inkSolid`) carries the drawing's true corner geometry and we never erode, corners stay sharp (c). One mask, one flood, one clipped grow — no phantom-peel, no shave-to-convergence, no triple-radius tuning.

### 2.2 Why it beats the three hacks on all four constraints

| | Bleed (a) | Sliver (b) | Corners (c) | Watertight (d) |
|---|---|---|---|---|
| Centerline capsule | ✗ (capsule bows past smooth ink) | ✓ | ~ (faceted) | ✓ |
| Thin ribbon barrier | ✓ | ✗ | ✓ | ✗ (sub-cell gaps leak) |
| Inward erosion | ✓ | ✗/✓ | ✗ (notch) | ✓ |
| **Ink mask + clipped expand** | **✓** clip to `inkSolid` outer edge | **✓** expand under the ink | **✓** mask carries the corner, no erode | **✓** capsule union = closed barrier |

The single mechanism that makes all four work together: **the clip target and the expansion bound are the SAME watertight solid.** Bleed and sliver are the two failure directions of one knob (how far the fill reaches); clipping the expansion to `inkSolid` pins that knob to "exactly the ink's extent" on both sides. Corners come for free because `inkSolid` is built from the real geometry and nothing erodes it. Watertightness comes for free because a capsule union has no gaps.

### 2.3 What to KEEP from the current code

- `extractFillRegions` / `extractPoolRegions` (region detection, the tapped paper region's `outline`). The region outline is already a clean, watertight, RDP-simplified polygon with **Chaikin off in `crisp` mode** (strokeTo3d.ts line ~1583 — crisp keeps the drawn shape's sharp corners). **Keep `crisp: true` and `resolution: SOLID_MAX_GRID_RESOLUTION` (200).** This polygon is the SEED region (which component to fill), and a corner-true reference.
- `inkOutlinesNear` / `strokeCenterlinesNear` (lines 569 / 509) — the bbox pre-filter that picks the strokes bordering this region. **Keep `strokeCenterlinesNear`** (centerlines are what we stamp capsules along). `inkOutlinesNear` (the exact `getStroke` outline polygons) can be **dropped** from the new path — see §2.4 note — or kept only as an optional refinement (§2.5).
- The window-bbox + ≥3-cell empty ring setup (lines 369–411), the border-seeded `outside` flood (lines 592–618), the region-seeded interior grow (lines 668–706), the hole-carve flood-from-centroid + the `holes` plumbing (lines 715–778). These are all correct; they just operate against `inkSolid` instead of the three-way `reach`/`floodWall`/`reachWall`/`phantom` tangle.
- The marching-squares re-extraction (`extractToneFills`) downstream — unchanged. The grid stays the source of truth; the patch outline is re-derived from the grid (lines 1385–1501). **This is why we don't need polygon offsetting:** whatever we paint into the grid gets re-contoured with sharp corners by the crisp (no-Chaikin) extractor anyway.

### 2.4 What to REPLACE (the concrete change to `rasterizeFillPatch`)

Replace the entire `if (inkPolys) { ... }` PRIMARY branch (lines 435–779) — the `inkMask`/`floodWall`/`reachWall`/`reach`/`phantom`/`eligible` six-mask construction — with this:

```
// Inputs already available: `mask` (the tapped region polygon rasterized,
// lines 415–433), `holes`, the window bbox (c0,c1,r0,r1,bw,bh), and the
// bordering centerlines (rename opts.inkCenterlines → the primary input).

// (1) inkSolid = WATERTIGHT union of fat capsules along every bordering
//     centerline, radius = the ink half-width. STROKE_OPTS.size = 4 ⇒
//     half-width 2px = exactly TONE_CELL_PX (1 cell). Densify each centerline
//     to ≤1px sub-segments first (reuse `densify`, line 233) so the swept tube
//     has no facet gap — the SAME watertight primitive stampToneCapsule uses.
const INK_HALF = STROKE_OPTS_SIZE / 2;          // = 2px; pass in or import
const inkSolid = new Uint8Array(bw * bh);
stampCapsules(inkSolid, preppedCenterlines, INK_HALF);   // generic capsule stamp

// (2) outside = border flood through NON-inkSolid cells (closed barrier ⇒
//     watertight ⇒ constraint (d)). [identical to current lines 592–618 but
//     the barrier is inkSolid, not reach∪floodWall]

// (3) interior = region-seeded 8-connected grow through (!outside && !inkSolid),
//     seeded from `mask ∩ !outside ∩ !inkSolid`. [identical to lines 668–706]

// (4) EXPAND the interior under the ink, CLIPPED to inkSolid:
//     grow `interior` by ceil(INK_HALF / TONE_CELL_PX) + 1 cells, but a grown
//     cell is only set if inkSolid[cell] === 1. (≈ a bounded dilate; reuse the
//     octagonal dilate at lines 1067–1092, with the per-cell guard `&& inkSolid[j]`.)
//       · grow eats the sliver  → (b)   (tone reaches under the ink)
//       · clip to inkSolid      → (a)   (tone can't pass the ink's outer edge)
//       · inkSolid carries the corner, nothing erodes → (c)
//     This REPLACES the phantom-peel + shave-to-convergence entirely.

// (5) holes: carve each hole's interior the SAME way — flood from the hole
//     centroid through !inkSolid (donut mirror), then expand-under-clip the
//     hole boundary against inkSolid so the ring's inner edge tucks under the
//     inner ink. [the current lines 715–778 logic, retargeted to inkSolid]

mask = interior;   // then the unconditional REPLACE write at lines 1095–1111
```

**Note on dropping `inkOutlines`:** the current code feeds the exact `getStroke` outline polygons (`inkPolys`) to get true taper. The capsule-union `inkSolid` approximates the ink as a **constant-half-width** tube. Because `STROKE_OPTS.thinning = 0.5`, the ink *does* taper, so a constant-half-width capsule is slightly fatter than the ink at tapered ends. **This is acceptable and arguably desirable:** the ink is drawn ON TOP, so a fill that reaches the *full* (untapered) half-width and gets covered by the (thinner) ink at a taper is still clean — no bleed beyond `INK_HALF` (the ink's max), no sliver. If a future test shows visible over-reach at a sharp taper, the refinement in §2.5 (intersect with the exact outline) recovers exactness without the brittleness. **Start with the constant-half-width capsule — it is the watertight, corner-safe, dependency-free core.**

### 2.5 OPTIONAL polish (only if a test demands it) — exact taper via the already-installed dep

If §2.4's constant-width approximation visibly over-reaches at a sharp taper, intersect `inkSolid`'s reach with the exact ink outline using **`polygon-clipping` (already a dependency, `intersection`)**:

```
finalInk = polygonClipping.intersection([capsuleUnionPoly], [getStrokeOutlinePoly])
```

then rasterize `finalInk` as the clip target. This needs **no new dep** (boolean intersection is supported; only offsetting is not — [polygon-clipping README](https://github.com/mfogel/polygon-clipping/blob/main/README.md)). Treat as a follow-up, not part of the core fix — the core is pure-grid.

---

## 3. Dependency decision

**No new dependency. The core fix is pure grid operations** (capsule stamp + flood + clipped dilate), all of which already exist in `toneMask.ts`. Rationale:

- Our source of truth is a 2px raster grid, not polygons — a polygon-offset lib would force a polygon→raster round-trip and re-introduce a quantization edge.
- The corner-preservation that an offset lib buys us is already delivered by (i) the crisp/no-Chaikin extractor and (ii) building the clip target from the real geometry and never eroding.
- `polygon-clipping@0.15.7` is **already installed** and covers the *optional* exact-taper polish (§2.5) via boolean `intersection` — so even the polish needs no new dep. (It does NOT do offsetting, so it could not implement §1.1 anyway.)
- A true offset lib (clipper-lib / js-angusj-clipper WASM) would be a **new dep** for a capability we don't need. Reject.

**Manual is enough — and lighter, faster, and grid-native.**

---

## 4. Per-tool clean-edge definition + live edge-test battery

Three tools commit through `rasterizeFillPatch`, but they hit different branches and have **different definitions of "clean."**

### 4.1 FILL (region-fill — the main case) — `src='fill'`

- **Call site:** `applyFillRegion` (DrawSurface.tsx line 1244) → `rasterizeFillPatch(..., 'fill', { inkOutlines, inkCenterlines, gapTol, dilatePx })`.
- **Clean = all four constraints (a)+(b)+(c)+(d)** against the visible ink. This is the tool the recommendation rebuilds (§2).
- **Applies the recommended approach fully:** capsule-union `inkSolid` + region-seeded interior + clipped expand.
- **Live edge-test battery (run on :5182, the LIVE app — isolated/headless harness renders LIE, per `feedback_live_check_not_headless_harness`):**
  1. **Circle** — smooth convex curve; check no bleed on the convex arc (the old centerline-capsule's worst case), no sliver.
  2. **Square** — four sharp 90° corners; check NO notch and NO rounding at each corner (the erosion-failure case), no sliver on the straight edges (the thin-ribbon sub-cell case).
  3. **Rectangle (thin / elongated)** — long straight edges where the ink tapers; check no edge sliver and no bleed (the tapered-edge sub-cell case).
  4. **Small shape** (≈ 20–30px) — fill must be watertight at small scale (cell-quantization stress); check non-empty, no leak.
  5. **Blob** (irregular hand-drawn closed gesture, concave + convex) — check the boundary hugs the ink everywhere, both bleed and sliver.
  6. **Donut** (ring — shape with a hole) — check the OUTER edge AND the INNER (hole) edge are both clean; the gray ring tucks under both inner and outer ink, no bleed into the hole, no sliver on the inner rim.
  - **Scale sweep:** repeat circle + square at small / medium / large (the "BLED at scale" regression in SESSION-HANDOFF was scale-dependent — never declare clean from one size).
  - **Adversarial (LOOP MINDSET):** unclosed corner (gesture gap) — the capsule `floodWall`/`inkSolid` must bridge it so the fill doesn't empty; over-the-bbox-edge shape; gap slider extremes (0.5× and 3×) must not bleed or empty.
  - **Per-constraint pass table required** (no sample-and-claim, per `feedback_no_sampled_verification_claims`): for EACH of the 6 shapes × {small,med,large}, a row scoring (a)/(b)/(c)/(d) pass/fail with a screenshot.

### 4.2 LASSO (freehand loop → fill) — `src='lasso'`

- **Call site:** `commitLasso` (DrawSurface.tsx line 1327) → `rasterizeFillPatch(grid, decimateLoop(pts), [], band, 'lasso', {})` — **note the empty opts**: no `inkOutlines`, no `inkCenterlines`, no `dilatePx`. So it hits the **`else` FALLBACK branch (lines 1065–1092) with `dilate = 0`** — the lasso loop polygon is rasterized AS-IS (nonzero winding) and written, with NO conform and NO dilation.
- **Clean = the lasso's OWN self-closed loop IS the clean edge.** The lasso is NOT conforming to any ink — the user's drawn loop is the boundary by definition (D-RF7: "the loop auto-closes and ITS outline is the patch — no extractor"). There is no separate ink edge to bleed past or sliver from. So **(a) bleed and (b) sliver do not apply** (no reference ink). What DOES apply:
  - **(c) corners** — the loop's own corners must survive rasterization + re-extraction. The crisp/no-Chaikin extractor already preserves them. ✓
  - **(d) watertight** — the loop must fill solid with no internal gaps. Nonzero-winding rasterization of a closed loop is watertight by construction. ✓
- **Therefore: the lasso needs the SAME recommended approach ONLY if we want it to also tuck under bordering ink** — which the spec says it should NOT (lasso is the escape hatch for "the extractor can't find a region", it paints exactly the loop the user drew). **Recommendation: leave lasso on the as-is fallback (no conform).** The one thing to verify: that `dilate=0` fallback is genuinely watertight and corner-true for self-crossing loops.
- **Live edge-test battery:**
  1. **Open loop** (user lifts before closing) — auto-close must produce a sane filled region (the gesture from start→end closes the gap); check watertight, no spurious thin sliver from the auto-close chord.
  2. **Self-crossing loop (figure-8 / bowtie)** — nonzero-winding fill must fill BOTH lobes (the `lassoDegenerate` guard keys on bbox extents NOT shoelace area precisely so bowties aren't rejected, lines 668–688); check both lobes fill, no cancellation hole.
  3. **Tight concave loop** (star / comb shape) — check the concavities fill correctly (no over-fill across a concavity).
  4. **Degenerate** (tiny flick, near-straight drag) — must MISS honestly (commit nothing, caption), not paint a blob (`lassoDegenerate` guard).
  5. **Lasso OVER existing ink** — confirm it paints the loop as drawn (it deliberately does NOT conform to the ink underneath — that's the lasso contract); verify this is the intended behavior with Sebs if it looks wrong over a drawn shape.

### 4.3 BRUSH (tone — swept capsules) — `src='brush'` (TONE_SRC_BRUSH)

- **Call site:** `stampToneCapsule` (toneMask.ts line 126), one capsule per pointer segment, NOT through `rasterizeFillPatch` at all (the brush writes the grid directly via the §3 marker table).
- **Clean = deliberately SOFT-edged. The clean-edge concept does NOT apply.** The brush is a freeform tone applicator — its edge IS the swept capsule footprint (the radius slider). There is no outline to conform to. Constraints (a) bleed and (b) sliver are **meaningless** for the brush (no reference ink edge — the brush can and should be painted anywhere, including past any ink). What matters for the brush:
  - **(d) watertight WITHIN a stroke** — consecutive pointer events stamp connected capsule SEGMENTS (lastTonePtRef, line 1146) so a fast drag leaves no gap. ✓ (already handled).
  - **Band composition correctness** — the §3 marker table (darker-over-lighter replaces, lighter-over-darker ignores, same-band-new-stroke darkens one step). This is the brush's "correctness", not edge cleanliness.
- **Recommendation: do NOT apply the clean-edge conform to the brush.** It would fight the brush's purpose. If anything, the brush could *optionally* get a morphological **close** for a slightly smoother soft edge (§1.3 — morphology rounds corners, which is FINE here because soft is the goal) — but that's a nicety, not a fix, and not requested.
- **Live edge-test battery:**
  1. **Overlapping strokes (same band)** — two passes over the same area: the §3 rule darkens by one band on the NEW stroke (not flat); check the overlap is exactly one band darker, the union is gap-free.
  2. **Darker-over-lighter** — brush a dark band across a light patch: dark must REPLACE (line 182), the light patch must stay whole UNDER it after extraction (the superset/isoband extraction, lines 1396–1423 — light band region stays unbroken beneath the dark stroke).
  3. **Lighter-over-darker** — must be IGNORED (line 187, markers can't lighten); verify the darker band is untouched.
  4. **Fast drag** — no capsule gaps along a quick stroke (segment connection).
  5. **Eraser (band 0)** — lifts whatever is there to paper unconditionally (line 161); check it carves cleanly and updates provenance.
  6. **Brush OVER a fill / fill OVER a brush** — provenance majority vote at extraction (the cell becomes brush-majority honestly); check the composite band grid is correct and the extracted patches carry the right `src`.

---

## 5. Summary for the build agent

1. **Keep** region extraction (`crisp:true`, res 200), the bordering-stroke pre-filter (`strokeCenterlinesNear`), the window/flood/seed/hole-carve scaffolding, and the marching-squares re-extraction.
2. **Replace** the `inkOutlines` six-mask tangle (toneMask.ts lines 435–779) with: **`inkSolid` = capsule union at ink half-width (2px)** → border flood → region-seeded interior → **expand-and-clip-to-inkSolid**. One mask, one flood, one clipped grow.
3. **Lasso** stays on the as-is fallback (its own loop is its clean edge); just verify watertight + self-crossing.
4. **Brush** is intentionally soft; do not conform it.
5. **No new dependency.** `polygon-clipping` (already installed) covers the optional exact-taper polish via boolean `intersection`; offsetting is neither available there nor needed.
6. **Verify on the LIVE app** with the per-tool batteries in §4, per-constraint pass table, scale sweep, adversarial inputs — never sample-and-claim, never headless.

---

## Sources

- [CGAL — 2D Straight Skeleton and Polygon Offsetting](https://doc.cgal.org/latest/Straight_skeleton_2/index.html) — corner-preserving inward offset via angular bisectors.
- [Clipper2 — Polygon Clipping, Offsetting & Triangulating](https://www.angusj.com/clipper2/Docs/Overview.htm) and [clipper-lib (JS port)](https://github.com/junmer/clipper-lib) — offsetting lib (would be a new dep).
- [Red Blob Games — Signed Distance Field Fonts](https://www.redblobgames.com/x/2403-distance-field-fonts/) — single-channel SDF rounds corners; MSDF needed to preserve them.
- [Chlumský — msdfgen](https://github.com/Chlumsky/msdfgen) — multi-channel SDF for sharp corners.
- [HIPR2 — Morphological Closing](https://homepages.inf.ed.ac.uk/rbf/HIPR2/close.htm) and [Dilation](https://homepages.inf.ed.ac.uk/rbf/HIPR2/dilate.htm) — closing/dilation rounds convex corners (why erosion notches).
- [Roboflow — Morphological Operations](https://blog.roboflow.com/morphological-operations/) — opening rounds convex corners, closing rounds concave.
- [Adobe community — paint bucket leaving an outline](https://community.adobe.com/t5/photoshop/is-there-a-way-to-make-the-paint-bucket-tool-actually-fill-a-selection-witout-leaving-an-outline/td-p/9920413) — the antialiased white-fringe (sliver) cure: expand the fill to include the edge pixels.
- [Wikipedia — Flood fill](https://en.wikipedia.org/wiki/Flood_fill) — connected-component fill; contiguous vs global modes.
- [polygon-clipping (mfogel) — README](https://github.com/mfogel/polygon-clipping/blob/main/README.md) — union/intersection/difference/xor only; **no offsetting** (already installed @0.15.7).
- [perfect-freehand (steveruizok)](https://github.com/steveruizok/perfect-freehand) — `getStroke` builds a variable-width outline ring from spline points; `thinning`/`smoothing`/`streamline` options (why a centerline capsule can't track the variable width).
