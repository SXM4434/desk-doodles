# 22 — Research: Simplification toggle (post-stroke geometry fidelity slider)

**Status:** research-first pass, 2026-06-10. GATES the build of pending decision ⑤ ("simplification as REAL slider wired to RDP ε?" — SESSION-HANDOFF Day 9 batch). No code in this pass.
**Code context audited:** `src/app/components/canvas/SvgStyleTransform.tsx` (`rdp()` :546, `RDP_EPSILON = 3.0` :1632, `RDP_VERTEX_THRESHOLD = 15` :1705, `POLY_ANCHOR_CAP = 8` :1791, `smoothPolyline` :587, `arcLengthWobbleField` :625, `applyEndpointBehavior` :657, `straightBezierPath` :706, `catmullRomPath` :745, `injectJaggedness` :325), `modifierSpecs.ts` SLIDER_SPECS, `DeskDoodlesCanvas.tsx` perfect-freehand STROKE_OPTS, plus the dead `simplification` stub field removed in the Day 9 sweep.
**Sister doc:** `docs/locked-refs/F3-smart-hachure-system/19-research-cross-axis-interconnection.md` — §3 here extends its cluster matrix with a new geometry-stage axis.

---

## §0 — The question and what exists today

Day 9 added Ramer-Douglas-Peucker simplification as an internal bug fix: drawn/auto-traced input arrives DENSE (heart ≈80 verts, rose sub-paths ≈25 verts) while the wobble pipeline was calibrated against SPARSE audit shapes (2-6 verts). RDP at hardcoded ε=3.0 normalizes dense input down to ~15-20 anchors; a vertex-count gate (>15) keeps audit shapes untouched; a polygonal-intent dispatch sends ≤8-anchor results to `straightBezierPath` (sharp corners) and 9+ to `catmullRomPath` (smooth curves).

The question: if ε becomes a **user slider**, what should that slider BE — name, range, mapping, default, pipeline position — and how does it ripple through every other axis of the living system?

Three findings up front:

1. **Every serious drawing tool exposes this control; Figma's refusal to is a documented user pain point** (§1). Exposing it is the right call.
2. **The slider is not "one more Cluster-1 modifier" — it is a new PIPELINE STAGE 0 axis** (geometry resampling) that sits upstream of Clusters 1-3 from doc 19 and feeds them all. Its strongest interaction is discrete, not continuous: it can flip WHICH RENDERER fires (§3, edge S1).
3. **The classifier must never read signals downstream of the user's ε** (§3, edge S11) — otherwise the smart system and the slider form a feedback loop.

---

## §1 — Survey: how shipping tools expose simplification / stabilization

### §1.1 Summary table

| Tool | Control name | Range / steps | Default | Live or post-stroke | Mechanism (as documented) |
|---|---|---|---|---|---|
| Procreate | StreamLine (Amount + Pressure) | percentage slider | per-brush | live, during stroke | smooths wobble as ink follows a stricter path ([Procreate Handbook](https://help.procreate.com/procreate/handbook/brushes/brush-studio-settings)) |
| Procreate | Stabilization (Amount) | 0-100% | per-brush | live | "moving average of a stroke"; faster strokes get more smoothing (Handbook) |
| Procreate | Motion Filtering (Amount + Expression) | percentage sliders | per-brush | live | deletes wobble extremities outright instead of averaging; **Expression slider re-injects hand character after filtering** (Handbook) |
| Adobe Illustrator | Pencil tool **Fidelity** | Accurate ↔ Smooth, 5 detents | middle | post-stroke (path built on release) | higher (smoother) settings build the path with **fewer anchor points** ([Adobe Help](https://helpx.adobe.com/illustrator/desktop/draw-shapes-and-paths/draw-shapes/pencil-tool-options.html), [Adobe Community](https://community.adobe.com/t5/illustrator-discussions/ai2025-the-pencil-tool-has-become-unusable-again-there-s-no-accuracy-it-s-too-smooth-solved/td-p/14922613)) |
| Krita | Brush smoothing: None / Basic / Weighted / Stabilizer | mode picker + per-mode params (Distance, Stroke Ending, Sample Count at Min/Max Speed, Delay dead-zone, Finish Line, **Scalable Distance**) | Basic | live | documented per-mode in the [Krita Manual](https://docs.krita.org/en/reference_manual/tools/freehand_brush.html) |
| Clip Studio Paint | Stabilization + Post Correction | 0-100 | per-tool | **both**: live stabilization AND a separate after-stroke "Post Correction" pass, plus "adjust by speed" ([CSP tool guide](http://www.clip-studio.com/site/gd_en/csp/toolguide/csp_toolguide/100_reference/Correction.htm), [CSP support](https://support.clip-studio.com/en-us/faq/articles/20200030)) |
| Figma / FigJam pencil | — none exposed — | — | — | live auto-smoothing, not adjustable | smoothing hardwired "to make FigJam performant"; users report shapes being changed and request a slider ([forum: marker tool changing drawings](https://forum.figma.com/t/marker-tool-in-figjam-is-changing-what-im-drawing/61801), [forum: custom smoothing request](https://forum.figma.com/t/custom-smoothing-for-pencil-tool/30104), [Figma help: pencil](https://help.figma.com/hc/en-us/articles/4402723791511-Sketch-on-the-canvas-with-the-pencil-tool)) |
| Excalidraw | — none exposed — | — | — | live (perfect-freehand) | integrated perfect-freehand via [PR #3512](https://github.com/excalidraw/excalidraw/pull/3512) (authored by Steve Ruiz); uses RDP internally for shape detection in [PR #9313](https://github.com/excalidraw/excalidraw/pull/9313) |
| tldraw | — none exposed; internal constants — | streamline **0.62** (pen) / `modulate(strokeWidth, [9,16], [0.64,0.74])` (mouse); smoothing **0.62**; thinning 0.62 pen / 0.5 mouse | fixed | live | verified in [`getPath.ts`](https://github.com/tldraw/tldraw/blob/main/packages/tldraw/src/lib/shapes/draw/getPath.ts); behavior described in [tldraw draw-shape docs](https://tldraw.dev/sdk-features/draw-shape) |
| perfect-freehand (lib we ship) | `streamline`, `smoothing` options | 0..1 each | **0.5 / 0.5** | live (input-side) | README + shipped source, §1.2 below ([GitHub](https://github.com/steveruizok/perfect-freehand)) |
| Inkscape | Simplify (Ctrl+L) + "Simplification threshold" preference | threshold number | 0.002-ish (pref) | post-stroke command, repeatable | repeated Ctrl+L within 0.5s **escalates the threshold each call**; resets after a pause; aggressiveness also scales with selection size ([Tavmjong Bah manual](http://tavmjong.free.fr/INKSCAPE/MANUAL/html/Paths-Editing.html), [Inkscape forum](https://inkscape.org/forums/questions/setting-simplify-agressivity-and-simplify-acceleration/)) |
| mapshaper | Simplify slider | **0-100% of removable points retained** | 100% | batch, interactive slider | default = **weighted Visvalingam** (weighting coefficient 0.7, biased to remove small-angle vertices for smoother output) ([mapshaper reference](https://github.com/mbloch/mapshaper/blob/master/REFERENCE.md), [Simplification Tips wiki](https://github.com/mbloch/mapshaper/wiki/Simplification-Tips)) |
| paper.js | `path.simplify(tolerance)` | tolerance = max allowed deviation | 2.5 (docs) | post-stroke method | Schneider curve-fitting, §2.4 ([paper.js tutorial](https://paperjs.org/tutorials/paths/smoothing-simplifying-flattening/), [Path reference](https://paperjs.org/reference/path/)) |
| simplify.js (Leaflet) | `simplify(points, tolerance, highQuality)` | tolerance in px | 1 | batch | radial-distance prepass + RDP; `highQuality=true` skips the prepass, ~10-20× slower ([mourner.github.io/simplify-js](https://mourner.github.io/simplify-js/), [GitHub](https://github.com/mourner/simplify-js)) |

### §1.2 perfect-freehand verified internals (we already ship this for live preview)

From the README in `node_modules/perfect-freehand/README.md` and the shipped `dist/esm/index.mjs` (verifiable in-repo; upstream at [steveruizok/perfect-freehand](https://github.com/steveruizok/perfect-freehand)):

- Defaults: `thinning: 0.5, smoothing: 0.5, streamline: 0.5`.
- **`streamline` is a live lag filter**, not a point reducer: in `getStrokePoints`, the lerp factor is `t = 0.15 + (1 − streamline) × 0.85`, and each accepted point is `lerp(previousPoint, inputPoint, t)`. `streamline = 0` → t = 1.0 (raw input); `streamline = 1` → t = 0.15 (heavy lag toward the previous point). Points that don't move are also dropped, and early points are suppressed until `runningLength ≥ size`.
- **`smoothing` controls outline vertex spacing**: outline points are only emitted when squared distance from the last emitted point exceeds `(size × smoothing)²` — i.e., smoothing is a *minimum-spacing* filter on the generated polygon, plus corner-rounding interpolation.
- Desk Doodles currently runs `thinning/smoothing/streamline = 0.5/0.5/0.5` for the live preview (`DeskDoodlesCanvas.tsx:20-22`) — the committed polyline the RDP stage receives is therefore **already lag-filtered once**.

### §1.3 Survey takeaways for Desk Doodles

1. **Two distinct axes exist in the wild and must not be conflated:** live input stabilization (Procreate StreamLine, Krita, CSP stabilization, perfect-freehand `streamline`) vs **post-stroke geometry simplification** (Illustrator Fidelity, Inkscape Simplify, CSP Post Correction, paper.js/mapshaper). Our RDP stage is firmly the second kind. The slider we ship is a **Fidelity-class control**, not a stabilizer.
2. **Anchor count is the user-legible currency.** Illustrator documents Fidelity directly as "fewer anchor points"; mapshaper abandoned raw tolerance for **percentage of points retained** in its UI. Raw ε is a developer unit, not a user unit.
3. **Percentage/notched controls beat raw tolerance UIs.** Illustrator uses 5 detents; Procreate/CSP use 0-100%; mapshaper uses 0-100%. Nobody ships "epsilon in pixels" to end users.
4. **Repeat-to-escalate (Inkscape) and Expression (Procreate)** are both evidence that users want simplification *with a hand-character escape hatch* — in our system wobble/jaggedness ARE the expression channel, which is exactly why the interconnection notes in §3 matter.
5. **Not exposing the control is the documented failure mode** (Figma forum threads). Desk Doodles exposing it is differentiation, and it's on-wedge: the toggle is another input the smart system can auto-tune.

---

## §2 — Algorithm landscape: what fits a post-stroke slider on committed polylines

### §2.1 Ramer-Douglas-Peucker (what we ship)

Global recursive split on max perpendicular distance vs ε ([Wikipedia](https://en.wikipedia.org/wiki/Ramer%E2%80%93Douglas%E2%80%93Peucker_algorithm)). Properties that matter for a slider:

- **Distance-bounded:** the simplified path never deviates more than ε from the original — ε is a guarantee, not a vibe. Good for "the drawing still reads as what I drew."
- **Preserves spikes/extremes:** sharp features survive ([comparison gist by msbarry](https://gist.github.com/msbarry/9152218), [Fleischmann, line simplification algorithms](https://martinfleischmann.net/line-simplification-algorithms/)). For hand-drawn intent (heart V-bottoms, lightning bolts) this is the RIGHT bias — Visvalingam would shave narrow spikes off.
- **Stable under a sweeping slider:** for a fixed input, the recursion tree (farthest-point decomposition) doesn't depend on ε; raising ε only prunes deeper. Retained anchors at high ε are a subset of those at low ε, so sweeping the slider removes/adds anchors progressively instead of reshuffling them. (Property of the algorithm structure; observable in our own `rdp()` :546.)
- **O(n log n) typical / O(n²) worst** — irrelevant at our n (≤ a few hundred points per sub-path).

### §2.2 Visvalingam-Whyatt

Iteratively removes the vertex with the smallest effective triangle area ([msbarry gist](https://gist.github.com/msbarry/9152218), [Fleischmann](https://martinfleischmann.net/line-simplification-algorithms/), [Deutsch, polyline simplification](https://www.matthewdeutsch.com/projects/polyline-simplification/)). Produces smoother results; tends to remove narrow spikes RDP keeps. Two genuinely attractive slider properties:

- **Exact anchor-count control:** "keep k anchors" is the native operation — mapshaper's percentage slider is built on this.
- **Precomputable ranking:** compute the removal order once per stroke at commit; afterwards every slider tick is an O(1) cutoff into a sorted list. Perfectly smooth slider response, no re-run of the algorithm.

Cost: loses RDP's distance guarantee and its spike preservation (bad default for drawn intent), and replacing RDP would invalidate the Day 9 calibration + 681-pattern sweep. **Verdict: not for v1; the precomputed-ranking idea is the documented post-makeathon upgrade path** (§4.8).

### §2.3 Chaikin corner-cutting — wrong tool, note why

Chaikin (1974) iteratively replaces each vertex with two points at ¼ and ¾ of each segment — it **adds** points to smooth a polygon; it is a subdivision/smoothing scheme, not a simplifier ([Joy, UC Davis notes](https://www.cs.unc.edu/~dm/UNC/COMP258/LECTURES/Chaikins-Algorithm.pdf), [Sighack walkthrough](https://sighack.com/post/chaikin-curves)). Our pipeline already owns this axis with `smoothPolyline()` (corner-preserving moving average :587) + Catmull-Rom interpolation. Adding Chaikin would duplicate an existing stage and densify exactly what RDP just sparsified. **Rejected.**

### §2.4 Schneider curve fitting (paper.js `simplify`, Illustrator-class)

Philip J. Schneider's "An Algorithm for Automatically Fitting Digitized Curves" (Graphics Gems, 1990) fits piecewise cubic Béziers within an error tolerance, splitting where the fit fails ([original C source](https://www.realtimerendering.com/resources/GraphicsGems/gems/FitCurves.c), [paper.js tutorial](https://paperjs.org/tutorials/paths/smoothing-simplifying-flattening/) — paper.js credits this exact algorithm). It outputs **Bézier segments, not anchor polylines**. Our entire hand-feel stage (`renderHandFeelShape`, wobble fields, jaggedness, per-anchor kink, multi-stroke offsets) consumes anchor polylines — switching representation would orphan the whole modifier system. **Rejected for the slider; relevant only as the long-term "export clean vector" feature.**

### §2.5 perfect-freehand `streamline` — complementary, not competing

It's an input-side lag filter (§1.2). It cannot retro-apply to committed/uploaded geometry, can't be re-tuned after the stroke without replaying input, and doesn't reduce vertex count toward audit-compatible density. **Keep it fixed at 0.5 for live preview; it is NOT the simplification slider.** (If a live "Streamline" slider ever ships, it's a second, separate axis — see §3 edge S13.)

### §2.6 Verdict

**RDP stays the engine.** It's already shipped, calibrated (ε=3.0), regression-swept (681 patterns), spike-preserving (right bias for drawn intent), distance-bounded, and slider-stable. The slider should modulate ε through a perceptual mapping (§4.3), with a documented VW-ranking upgrade path for exact-count control later.

---

## §3 — Cross-axis notes for the smart system (THE interconnection analysis)

Per Sebs's directive: "many toggles will be interconnected, we are a living breathing system — our smart system and ML system should have major notes to make sure this happens." This section extends doc 19's cluster matrix. **Simplification is a new Stage-0 (geometry resampling) axis that sits UPSTREAM of Cluster 1 (Multi-Stroke), Cluster 3 (Shading), and the renderer dispatch itself.** Doc 19's I-13 says the classifier consumes cluster-level features — simplification changes the geometry those features are computed FROM, which is why it gets its own section.

### §3.1 Interaction matrix (simplification ε row, read ε → column)

`→` direct drive · `★` joint effect through a third variable · `⚠` discontinuous/identity-changing · `—` independent

| | dispatch (≤8 cap) | wobble | jaggedness | multiStroke | curveDamp | bowing | endpointBehavior | corner gates | closed-path | bbox→effW | fillStyle/shading | Phase C signals | 3D path | live streamline |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **simplification ε** | ⚠ | ★ | → | ★ | ★ | → | → | → | ⚠ | ★ | ★ | ⚠ | → | ★ |

### §3.2 Edge-by-edge notes

**S1. ε → POLY_ANCHOR_CAP dispatch — THE discontinuity (⚠ headline).**
`SvgStyleTransform.tsx:1786-1807`: post-RDP anchor count ≤ 8 → `straightBezierPath` (polygonal renderer, and wobble amplitude is ALSO cut to `wobbleAmp * 0.4`); 9+ → `catmullRomPath` (smooth renderer, full `wobbleAmp`). A user sweeping ε will, at some tick, push a heart from 15 anchors to 8 — and the shape **snaps from smooth-curve rendering to polygon rendering while simultaneously dropping 60% of its wobble amplitude**. That is a renderer-identity flip riding on a "detail" slider.
**Smart-system note:** renderer identity must be a property of the SOURCE, not the slider (I-2 spirit: source owns perceptual identity). Mitigation locked into §4.5: classify polygonal-vs-curve intent at **canonical ε = 3.0**, render at user ε.

**S2. ε ↔ wobble (★ — both directions of failure documented).**
`catmullRomPath` displaces the ANCHORS through `arcLengthWobbleField` (wavelength = `clamp(arcLen × 0.12, 35, 90)` px, :779-789). The field is continuous in arc length, but it's only *sampled at anchors*:
- **Low ε (dense anchors):** anchor spacing ≪ wavelength → the Day 9 braid bug returns (wavelength ≈ vertex spacing, comment :1619-1631). This is why ε must be floored above zero (§4.3).
- **High ε (sparse anchors):** anchor spacing can exceed the ~35-90px wavelength → the wobble field is undersampled/aliased; wobble visually fades or produces single lopsided bulges instead of flowing waves.
**Smart-system note:** wobble's perceived amplitude is a JOINT function of (wobble slider, ε). Phase F cascade rule candidate: when ε pushes mean anchor spacing above ~0.75× wavelength, either bias wobble up within band or re-densify anchors for wobble sampling only.

**S3. ε → jaggedness (→ per-segment coupling).**
`injectJaggedness` (:325) inserts perpendicular alternating zigzag intermediates **between consecutive points** — splinter density is proportional to anchor density. High ε → few, long segments → jaggedness reads as occasional long spikes; low ε → fuzz. Same slider value, completely different mark character.
**Smart-system note:** if Phase C/F wants constant perceived jaggedness, the invariant is **splinters per 100px of arc length**, not the raw jaggedness value. Record both in audit data.

**S4. ε → multiStroke layer divergence (★).**
Per-layer jitter `j()` is applied **per anchor** (:1813, :1827-1829) — fewer anchors mean sister layers track each other through long mid-segments and only diverge at anchors (layers look fused at high ε even at multiStroke=triple). Open-path parallel-pass offsets are computed per anchor via `offsetLinePerpendicular(cleanPoints, layerIndex)` (:1783) — sparser anchors = smoother but stiffer parallel sisters. `stableLayerNudge` (whole-layer transform, :248) is ε-independent — at high ε it becomes the ONLY visible layer separation, which is exactly the regression-B.3 fight doc 19 warned about, now modulated by a slider.
**Smart-system note:** layer-divergence visibility = f(anchor count, nudge, sketchingStyle). The I-14 invariant (sketchingStyle owns layer transform) needs an ε footnote.

**S5. ε ↔ curveDamp and ε → bowing (★ / → amplification).**
In `straightBezierPath`, bow magnitude is `effectiveBow × segmentLength × 0.06` (:734) — **segment length is in the formula**, so raising ε literally amplifies bowing for the same slider value; curveDamp damps it via `tightnessDamp = 1 − curveDamp × 0.45` (:719). In `catmullRomPath`, tangent handles derive from neighbor differences — longer segments = longer handles = curveDamp has more to damp.
**Smart-system note:** bowing and curveDamp calibration bands (F3-shading-calibration-spec) are implicitly calibrated at ε=3.0 segment lengths. Phase F cascade: scale effective bowing by (canonical mean segment length / current mean segment length) to keep the band stable, or document the drift.

**S6. ε → endpointBehavior (→ count and direction coupling).**
`applyEndpointBehavior` (:657): **kink is a random-angle push at EVERY anchor** (:666-672 — the Day 9 rework that earned the KEEP verdict), so kink intensity is directly proportional to anchor count: a high-ε shape gets 5 kinks where a low-ε shape gets 20. Protrude/long-overshoot extend along the first/last segment direction (:684-694) — RDP moves the neighbor anchor, so the overshoot ANGLE swings as ε changes. Closed-path protrude pushes radially from the anchor centroid (:673-682), which also shifts with ε.
**Smart-system note:** kink is the most ε-sensitive enum in the system. If the KEEP lock lands, record "kinks per anchor" vs "kinks per 100px" as the perceptual unit before Phase C touches it.

**S7. ε → corner classification gates (→ compounding sharpening).**
RDP increases the turn angle at surviving anchors (it cuts gentle in-between points). Two downstream thresholds then flip: `smoothPolyline`'s 30° corner bypass (:590, :607) and `catmullRomPath`'s 45° CORNER_THRESHOLD straight-tangent rule (:797). So beyond S1's hard dispatch flip, higher ε ALSO makes the smooth renderer progressively treat more anchors as corners — simplification sharpens twice.
**Smart-system note:** corner-count signals must be computed at canonical ε (see S11) or the classifier will see "polygonal" where the user drew "smooth."

**S8. ε → closed-path integrity (⚠ degeneracy).**
Closed sub-paths append the first anchor for the bezier loop (:1716-1718). At high ε a drawn circle can drop to 3-4 anchors → renders as a wobbly triangle; below 3 it degenerates entirely. **§4.6 locks a closed-path anchor floor.**

**S9. ε → bbox/centroid → effectiveWobble (★ second-order).**
`bboxMin`, `sizeClampBbox`, and centroid are computed from the SIMPLIFIED points (:1723-1740); corner-cutting shrinks the bbox slightly, which perturbs `effectiveWobble`'s size clamp and the sub-path centroid used elsewhere. Small, but it means ε is not strictly visual-only — it touches the calibration inputs. Cheap hardening: compute bbox from raw points.

**S10. ε → Cluster 3 shading (★).**
The simplified outline IS the fill region the shading system hachures. Edge positions of rough.js scanlines shift with the outline; jaggedness re-injection on basePath fill boundaries resamples with anchor density; and on small shapes, corner-cutting area loss can newly trip the tiny-area `<40px²` solid clamp (edge-case row 13). Mild for makeathon scope, but the audit dataset should record ε so shading regressions aren't misattributed.

**S11. ε ↔ Phase C auto-pick signals (⚠ feedback-loop hazard — the big smart-system note).**
Input complexity (vertex density, corner count, sub-path count) is precisely the signal family Phase C uses to auto-pick styles/fillStyles and to auto-tune calibration parameters. If those signals are computed from post-user-ε geometry, the loop closes: classifier reads simplified shape → picks treatment → user nudges slider → signals change → treatment flips → the user experiences style roulette on a "detail" slider.
**LOCK CANDIDATE:** *all classifier signals are computed from RAW committed points, or from geometry at canonical ε = 3.0 — never from user-ε geometry.* The user's ε is itself an INPUT signal to the classifier (a statement of intent: "I want this looser/tighter"), not a transform applied before signal extraction. This mirrors I-2 (source owns identity) and the fillStyle-override lesson (user picks grammar; classifier picks from source).
**Dataset note (per `project_smart_layer_foundation_via_audit`):** the 197-shape /audit catalog and 681-pattern sweep were captured at ε=3.0. Every future labeled sample must record its ε, or the smart-layer training set silently mixes geometry regimes.

**S12. ε → 3D path (→ shared-stage requirement).**
Day 11 Rod/Extrude consume the committed polyline as the TubeGeometry/ExtrudeGeometry control path. If simplification applies at the shared committed-geometry stage, the SVG render and the 3D conversion see the SAME anchors — mode-flip stays coherent (the wedge: "the hand survives the round-trip"). If it were SVG-render-only, a user would tune simplification, flip to 3D, and watch it vanish. Per `project_f3_shading_port_to_3d`: the slider is not "complete" until both paths honor it.

**S13. ε ↔ perfect-freehand streamline (★ compounding smoothing budget).**
Committed points are already lag-filtered once by `streamline = 0.5` live (§1.2). The two stages compose: if a live Streamline slider ever ships, (streamline, ε) form one combined "fidelity budget" and maxing both = double-smoothed mush. Until then, streamline is a fixed known prior on all drawn input — uploaded SVG input does NOT carry that prior, which is itself a usable Phase C source-discrimination signal.

**S14. ε ↔ RDP_VERTEX_THRESHOLD gate (intentional dead zone).**
The >15-vertex gate (:1705) means the slider is a NO-OP for sparse input (all audit/catalog shapes, simple uploaded SVGs). This is correct — sparse input is already at intent-level anchors — but it's a slider with a silent inactive state. Chrome should communicate it (§4.7), and the smart system should know "simplification inapplicable" is a per-sub-path fact, not a global one.

### §3.3 Cluster placement

Simplification joins the system as the first member of a new **Cluster 0 — Geometry/Resampling** (members today: `simplification`; future: live streamline, resample density, closed-path snapping). Pipeline order: **Cluster 0 → dispatch → Cluster 1 (Multi-Stroke) → Cluster 3 (Shading) → Cluster 4 (Surface Texture) → Cluster 5 (Color)**. Doc 19 §E should gain this cluster when next revised; I-13 cluster-level features then include "Cluster 0 state" as classifier input.

---

## §4 — Recommendation

### §4.1 Name and key

- **State key:** `simplification` — resurrects the exact field name removed as a dead stub in the Day 9 sweep; re-add to `F3ModifiersState`, `SLIDER_SPECS`, and chrome.
- **Display name:** **"Simplify"** with endpoint micro-labels **"faithful" ↔ "essential."** Rationale: this is a Fidelity-class post-stroke control (§1.3 takeaway 1), and action-naming (Inkscape "Simplify," mapshaper "Simplify") reads truer to what it does than Illustrator's opaque "Fidelity." Avoid "Smoothing"/"Stabilization" — those name the live axis and would collide with perfect-freehand vocabulary if streamline is ever exposed.

### §4.2 Range, step, ticks

`simplification: { min: 0, max: 2, step: 0.05 }` — same shape as wobble/jaggedness specs (41 ticks; satisfies the 6+-ticks rule per `feedback_more_toggle_options_better`).

### §4.3 Mapping — exponential, not linear

**ε(s) = 3.0 × 4^(s − 1)**, s ∈ [0, 2] → ε ∈ [0.75 … 12], with **s = 1.0 ≡ ε = 3.0 exactly** (today's shipped, sweep-verified behavior).

Why exponential: anchor count decays roughly **geometrically** in ε — our own calibration history is the evidence: ε 1.5 → ~30-40 anchors on the heart, ε 3.0 → ~15-20 (code comment :1629-1631, real measured data from Day 9). A linear ε slider would cram all visible change into its bottom quarter and waste the top half; equal slider steps should produce roughly equal *proportional* anchor-count change. This is the same reason mapshaper's UI exposes percentage-retained rather than raw tolerance ([mapshaper docs](https://github.com/mbloch/mapshaper/wiki/Simplification-Tips)) and Illustrator exposes 5 perceptual detents rather than a tolerance number.

Why the floor is 0.75 and **never 0**: ε = 0 disables RDP and resurrects the Day 9 braid bug (S2, dense-anchor wobble aliasing). The slider modulates the STRENGTH of input normalization; it never turns the normalization off. (Also consistent with the slider-floors lesson in `project_f3_slider_recalibration_pending` — no dead/broken zones at the extremes.)

Why max ε = 12: at 4× the canonical ε the heart lands around 4-7 anchors — genuinely "essential gesture" territory — while the closed-path floor (§4.6) prevents degeneracy. Matches `hachureGap`'s precedent of a 12-unit ceiling being "a lot" in viewBox px.

### §4.4 Where in the pipeline

Replace the `RDP_EPSILON` constant (:1632) with the context value, applied exactly where RDP runs today: **per sub-path, at render time, inside `SvgStyleTransform`** — NOT destructively at commit. Consequences, all desirable:

- **Non-destructive + re-applicable:** raw committed points stay stored; moving the slider re-renders committed objects live (CSP Post Correction + Inkscape's repeatable command, but continuous). Supabase publishes **raw polylines + modifier state, never simplified geometry** — the smart layer can always re-derive signals from source.
- **Uniform across input sources:** drawn, uploaded-SVG, and (future) traced-image input all pass through the same gate.
- **Live preview untouched:** perfect-freehand keeps `streamline = 0.5`; the in-flight stroke is a separate surface (per `project_desk_doodles_draw_panel_vs_desk_canvas`).

### §4.5 Dispatch freeze (the S1 fix — build requirement, not optional)

Compute the polygonal-vs-curve decision from **canonical geometry**: `isPolygonal = rdp(points, 3.0).length ≤ POLY_ANCHOR_CAP`, decided once per sub-path; then render with `rdp(points, ε_user)`. The slider changes anchor density WITHIN a renderer; it never flips the renderer or the hidden `wobbleAmp × 0.4` polygonal attenuation. Alternatives considered and rejected: hysteresis band around 8 (stateful, order-dependent, untestable in sweeps); scaling the cap with ε (just moves the cliff). Phase C may later override the canonical decision from richer signals — but from SOURCE signals, per S11.

### §4.6 Closed-path floor

Closed sub-paths never simplify below **5 retained anchors** (pre-closure-append). Implementation freedom: clamp effective ε down for the sub-path, or take the shallowest RDP recursion level with ≥5 anchors. Prevents the circle→triangle degeneracy (S8).

### §4.7 Chrome and gating honesty

The `RDP_VERTEX_THRESHOLD = 15` gate stays (audit shapes byte-identical at any slider value). The slider therefore reads "no effect" on sparse input — show the slider in a disabled/dimmed state (or tooltip "input already at essential density") when every sub-path of the selected object falls under the gate. No silent dead controls.

### §4.8 Default and Phase C auto-tune

- **Manual default: s = 1.0** (≡ ε = 3.0). The 681-sweep and all Day 9 sign-offs (wobble thread closed by Sebs's eyes-on 2026-06-10) anchor this point; defaults must not move it.
- **Phase C signals (computed from RAW points per S11):** verts per 100px of arc length · corner count at canonical ε · sub-path count · closed-ness · input source (drawn = carries the streamline-0.5 prior; uploaded = raw) · optionally draw speed from pointer timestamps (fast sloppy strokes → bias s up; slow deliberate strokes → bias s down — the speed-sensitivity precedent is Procreate Stabilization and CSP adjust-by-speed, §1).
- **Phase C target:** auto-tune toward an anchor-DENSITY target (≈1 anchor per 25-35px arc length for smooth intent — the band where the 35-90px wobble wavelength stays well-sampled per S2), expressed as a bias **within ±0.35 of the user's slider value, never an override** (I-3 bias-within-band).
- **Style-aware bias:** bold-ink/wet-ink (confident, few-stroke registers) bias s up; sketchy biases s down (searchy lines want detail); stipple/charcoal neutral (their character lives in Clusters 3-4, not anchors).
- **Phase F cascade notes to carry forward:** wobble-undersampling compensation (S2), splinters-per-100px invariant (S3), bowing segment-length normalization (S5), kinks-per-anchor accounting (S6).

### §4.9 Build-gate checklist (when this doc unblocks the build)

1. Re-add `simplification` to context + `SLIDER_SPECS` + chrome (Cluster 0 placement; pill/slider per chromeStyles canon).
2. Thread ε through the sub-path loop; implement dispatch freeze (§4.5) + closed-path floor (§4.6).
3. Regression per `feedback_never_declare_fixed_without_regression_check`: baseline 6 representative shape classes at s=1.0 (must be pixel-identical to pre-slider build), then sweep s ∈ {0, 0.5, 1, 1.5, 2} on drawn-heart + rose + a polygon + an audit shape (audit must be identical at ALL s). Run the 681-pattern harness at defaults.
4. Day 11: feed the same simplified anchors to Rod/Extrude (S12) before calling the slider done.
5. Record ε in every audit/sweep artifact from now on (S11 dataset rule).

---

## §5 — Sources

**Shipping-tool documentation:**
- Procreate Handbook — Brush Studio settings (StreamLine / Stabilization / Motion Filtering + Expression): https://help.procreate.com/procreate/handbook/brushes/brush-studio-settings
- Adobe Illustrator — Pencil tool options (Fidelity): https://helpx.adobe.com/illustrator/desktop/draw-shapes-and-paths/draw-shapes/pencil-tool-options.html · community detail on the 5-notch Accurate↔Smooth slider: https://community.adobe.com/t5/illustrator-discussions/ai2025-the-pencil-tool-has-become-unusable-again-there-s-no-accuracy-it-s-too-smooth-solved/td-p/14922613
- Krita Manual — Freehand brush smoothing modes (None/Basic/Weighted/Stabilizer, Distance, Delay, Scalable Distance): https://docs.krita.org/en/reference_manual/tools/freehand_brush.html
- Clip Studio Paint — Correction tool guide: http://www.clip-studio.com/site/gd_en/csp/toolguide/csp_toolguide/100_reference/Correction.htm · Stabilization FAQ: https://support.clip-studio.com/en-us/faq/articles/20200030
- Figma Help — pencil sketching: https://help.figma.com/hc/en-us/articles/4402723791511-Sketch-on-the-canvas-with-the-pencil-tool · forum evidence of un-adjustable auto-smoothing: https://forum.figma.com/t/marker-tool-in-figjam-is-changing-what-im-drawing/61801 · slider feature request: https://forum.figma.com/t/custom-smoothing-for-pencil-tool/30104
- tldraw — draw shape feature docs: https://tldraw.dev/sdk-features/draw-shape · verified StrokeOptions source: https://github.com/tldraw/tldraw/blob/main/packages/tldraw/src/lib/shapes/draw/getPath.ts
- Excalidraw — perfect-freehand integration PR #3512: https://github.com/excalidraw/excalidraw/pull/3512 · RDP in shape detection PR #9313: https://github.com/excalidraw/excalidraw/pull/9313
- Inkscape — node editing / Simplify (Tavmjong Bah manual): http://tavmjong.free.fr/INKSCAPE/MANUAL/html/Paths-Editing.html · simplify threshold + acceleration: https://inkscape.org/forums/questions/setting-simplify-agressivity-and-simplify-acceleration/
- mapshaper — command reference (simplify %, weighted Visvalingam, weighting 0.7): https://github.com/mbloch/mapshaper/blob/master/REFERENCE.md · Simplification Tips: https://github.com/mbloch/mapshaper/wiki/Simplification-Tips

**Libraries (verified in source where noted):**
- perfect-freehand (Steve Ruiz) — README + shipped dist verified locally at `node_modules/perfect-freehand/` (streamline lerp `t = 0.15 + (1−streamline)·0.85`; smoothing as `(size·smoothing)²` outline spacing): https://github.com/steveruizok/perfect-freehand
- simplify.js (Vladimir Agafonkin) — radial-distance + RDP, tolerance, highQuality: https://mourner.github.io/simplify-js/ · https://github.com/mourner/simplify-js
- paper.js — Smoothing/Simplifying/Flattening tutorial (Schneider fit): https://paperjs.org/tutorials/paths/smoothing-simplifying-flattening/ · Path reference: https://paperjs.org/reference/path/

**Algorithms:**
- Ramer-Douglas-Peucker: https://en.wikipedia.org/wiki/Ramer%E2%80%93Douglas%E2%80%93Peucker_algorithm
- Visvalingam-Whyatt vs RDP comparisons: https://gist.github.com/msbarry/9152218 · https://martinfleischmann.net/line-simplification-algorithms/ · https://www.matthewdeutsch.com/projects/polyline-simplification/
- Chaikin corner cutting (1974): https://www.cs.unc.edu/~dm/UNC/COMP258/LECTURES/Chaikins-Algorithm.pdf · https://sighack.com/post/chaikin-curves
- Schneider, "An Algorithm for Automatically Fitting Digitized Curves," Graphics Gems 1990 — original C: https://www.realtimerendering.com/resources/GraphicsGems/gems/FitCurves.c

**Internal (code + locked docs cited by line throughout):**
- `src/app/components/canvas/SvgStyleTransform.tsx` — `rdp` :546, ε rationale comments :1619-1632, gate :1705, dispatch :1786-1807, wobble field :779-789, endpoint behaviors :657-696, corner gates :590/:797, bow formula :734
- `src/app/components/DeskDoodles/DeskDoodlesCanvas.tsx` :20-22 — live perfect-freehand options
- `src/app/components/chrome/modifierSpecs.ts` — SLIDER_SPECS conventions
- `docs/locked-refs/F3-smart-hachure-system/19-research-cross-axis-interconnection.md` — cluster matrix this doc extends
- `docs/locked-refs/F3-smart-hachure-system/09-LOCKED-MODEL.md` — I-2 / I-3 / I-13 / I-14 invariants referenced in §3-§4
