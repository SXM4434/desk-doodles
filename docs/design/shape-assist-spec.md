# Shape Assist — recognition, snap, and the honest scope line

**Date:** 2026-06-12 · **Status:** SPEC — research pass, no code (src/ owned by build fleet). R3 of the round-7 research wave; siblings: `region-fill-spec.md` · `shade-brush-spec.md` · `shading-axes-spec.md`.
**Governing refs:** `mark-intent-boundary-spec.md` §2 (signal features REUSED verbatim) · `conversion-semantics-spec.md` + amendment (one record, one vocabulary) · `global-toggles-and-mixed-3d.md` D-3 (convert FROM THE RECORD) · `strokeTo3d.ts` (rdpPoints :210, closureStateOf :253, extractPoolRegions :1302) · `markIntent.ts` (resampling + feature constants) · `coverage.ts` bands · `DrawSurface.tsx` / `DrawPanel.tsx` (registers, chip pattern) · 197-shape catalog (`PinShape.tsx` + `PegToolShape.tsx`, rendered at /audit).

---

## 0. Why — the creation ceiling

Sebs's Shade-register test (video 2026-06-12 7:57pm): the registers work, but the ceiling is what a hand can produce — "we need to let people create stuff like we see in the audit pages." The /audit catalog is built from CLEAN primitives (true rects, circles, straight ruled lines) composed with tone. Freehand + shade gets the tone half; the clean-geometry half needs assist. Procreate solves this with QuickShape (hold a stroke → snaps to line / arc / poly-line / ellipse / triangle / quadrilateral, with an Edit Shape bar offering alternatives, and a second finger to regularize oval→circle, rect→square) — but QuickShape is a HOLD gesture and we have no touch/hold grammar: our equivalents must be **buttons** in the existing pill chrome. [Procreate Handbook — QuickShape]

## 1. What ships — one engine, two pills, one chip

- **SNAP pill** — convert-to-primitive. Auto-detects what the target stroke meant (line · polygon · triangle · rect · circle · ellipse), replaces its points with the clean shape, and raises a **switch-chip** cycling the ranked alternatives (the Edit-Shape-bar move, as a chip not a mode). Auto-detect-then-switch beats pick-shape-first: one tap for the 90% case, and a wrong read is one more tap — Procreate's exact economy.
- **STRAIGHTEN pill** — the polygonal-fit variant of the SAME engine (candidate set restricted to corner-chain fits, no template regularization). Procreate's hold-to-snap for wobbly straight-edged forms, as a button. Covers Sebs's (b); also the honest fallback when Snap declines.
- **The chip** answers Sebs's (c): circle and oval are separate CANDIDATES, not separate buttons — a near-round stroke ranks `circle` first and the chip cycles to `ellipse` (and back to `Original`). Square / equilateral variants ride the same chip (our second-finger equivalent).
- **No auto-fire.** Snap is always an explicit act on an explicit target. (A future smart-suggest can ride the decision log — not v1.)

Placement: both pills live in the **Ink tool cluster** of DrawPanel — the row that already shows the Tone cluster when Shade is in hand (`DrawPanel.tsx:1003-1015` pattern, gated `composeMode==='draw' && penRegister==='ink'`), enabled when ≥1 stroke exists. Toggles stay in chrome, never in the canvas (per `feedback_toggles_always_in_chrome`).

## 2. The engine — `lib/draw/shapeFit.ts` (NEW, pure, node-runnable like `strokeTo3d.ts`)

Pipeline (every stage already exists somewhere in our stack — this module composes, it does not invent):

1. **Resample** the stroke arc-length at 4px (`INTENT_RESAMPLE_SPACING_PX`, `markIntent.ts:45` — the $1-recognizer normalization move [Wobbrock '07], same capStrokes-invariance argument as mark-intent §2).
2. **Gate** with mark-intent features (REUSE, don't recompute differently): `reversalFreq ≥ SCRIBBLE_REVERSAL_FREQ` or high `selfIsectDensity` → **refuse** (scribbles are tone/fill intent, not shapes); `bboxDiag < 24px` → refuse (dot territory); `closureStateOf` (3-state, `strokeTo3d.ts:253`) gates closed vs open candidate families.
3. **Corners**: ShortStraw on the resampled points (straw = chord length over a ±3 window; minima below median×0.95 are corner candidates) [Wolin '08], cross-checked against `rdpPoints` ε=3.0 anchors (`strokeTo3d.ts:210`) — a corner must appear in both to count. Hybrid is deliberate: ShortStraw finds corners RDP smears on slow curves; RDP kills ShortStraw's false positives on noise.
4. **Fit every eligible candidate** and score:

| Candidate | Closure | Fit method | Error metric (normalized) |
|---|---|---|---|
| line | open | total-least-squares (PCA) line | RMS perpendicular dist ÷ bboxDiag |
| polyline (Straighten) | open | corner chain, straight segments | max perp dev per segment ÷ bboxDiag |
| polygon (Straighten) | closed/treated | closed corner chain | same |
| triangle | closed/treated | exactly 3 corners | same · chip variant: equilateral |
| rect | closed/treated | exactly 4 corners → edges regularized to two perpendicular directions (Pegasus-style constraint inference [Igarashi '97]) | same · chip variant: square |
| circle | closed/treated | Kåsa algebraic least-squares (linear) [Chernov/conicfit] | RMS radial residual ÷ radius |
| ellipse | closed/treated | Fitzgibbon-Pilu-Fisher direct LSQ [Fitzgibbon '99] | radial residual approx ÷ mean radius |

Geometric corroboration (PaleoSketch's move — geometry tests per primitive, not error alone [Paulson '08]): circle/ellipse additionally require `|turnSum| ≈ 2π` with consistent winding (`markIntent.ts` turnSum features); rect/triangle require corner count to match exactly after merge; ellipse with `bboxAspect ≤ 1.1` cedes rank to circle.

5. **Score + threshold**: `score = 1 − normErr/ERR_SCALE` minus a small complexity prior (line < circle < triangle < rect < ellipse < polygon — prefer the simpler read when errors tie, PaleoSketch ranking). **Accept** only if best `normErr ≤ SNAP_MAX_NORM_ERR` (provisional 0.035 ≈ 3.5% of bboxDiag — calibrated by the battery before lock, mirror of MI-F). Chip carries every candidate with `normErr ≤ 2×` threshold, ranked, plus `Original` always last.
6. **Honest no-snap**: below threshold for everything → NO mutation; caption-slot note ("didn't read as one clean shape — try Straighten", 5s, the remove-note slot pattern `DrawPanel.tsx` rA-r7) and the full candidate table goes to the decision log anyway. Never force the least-bad fit.

**Straighten** = same pipeline, candidates restricted to {line, polyline, polygon}, no template regularization (drawn proportions kept). It almost never refuses — except corner count > 24 (that's a scribble; refuse honestly).

**Logging (training flywheel):** every evaluation → `window.__dd_decisionLog` `{surface:'shape-snap', strokeId, candidates:[{kind, normErr, score}], chosen, accepted, margin}` (QW-1/QW-2 pattern); chip cycles/keeps/reverts log as `'overridden'`/`'kept'` events exactly like the smart-pick chip (`__dd_inputPickLog` grammar, rA-r7).

## 3. Interaction spec

- **Target**: SNAP acts on the **last stroke** by default. While the chip is up, tapping another stroke on the canvas retargets (hit-test = min distance to stroke polyline < 12px viewBox; pure util in shapeFit, no DOM hit-testing). No armed mode, no selection model.
- **Chip**: appears by the pills (smart-pick chip slot): `Circle ▸` — tap cycles ranked candidates live (stroke re-renders each cycle), `Original` restores the pre-snap points. Pre-snap points live in component memory ONLY while the chip lives. Chip dismisses on: next stroke drawn, register/input switch, manual pen change, Done — dismissal logs `'kept'`.
- **Closure weld**: snapping a `treated-as-closed` stroke to a closed candidate emits an EXACTLY closed loop — the gap-weld is legitimate here because snap is an explicit user act (unlike the silent inference the 3-state closure chip exists to confess, `conversion-semantics` amendment). Open candidates never weld.
- **Shade register**: pills hidden while Shade is in hand (tone patches don't snap — region-fill is the sibling spec's lane).

## 4. Record semantics — the snapped stroke STAYS a stroke

The result **replaces `stroke.points` in the record** (`Stroke = {id, points: [x,y,pressure][]}`, `DrawSurface.tsx:14-15`) — same id, pressure = mean of the original. Emission density: ~8px spacing along the ideal outline (straight edges collapse to corner anchors under RDP ε=3.0 → the 2D polygonal dispatch ≤8 anchors gives sharp `straightBezierPath` corners; circles stay dense → Catmull-Rom smooth). Nothing downstream changes:

| Consumer | Effect |
|---|---|
| `strokesToObjectMarkup` (`DrawSurface.tsx:59`) | unchanged — still a `fill="none"` polyline |
| pen styling (SvgStyleTransform, wobble/penTip/multiStroke) | still applies — **snap the intent, keep the hand**: clean geometry rendered in the user's pen IS the wedge |
| mark-intent at Done (`markIntent.ts`) | calm + closed → R2 structure, cleaner margins (snapped strokes are the easiest classifications it will ever see) |
| 3D (`strokeTo3d.ts` / `convert.ts`) | closed → solid slab, open → rod, per the amendment map; `extractPoolRegions` gets exact loops → better holes/containment |
| shade/tone (`coverage.ts` bands, `ToneFill`) | untouched — tone patches reference regions, not stroke identity |
| capStrokes ~45KB budget | snapped strokes are SMALLER than freehand — budget relief, never pressure |

No schema change, no new column, no second geometry representation to keep in sync. This is the load-bearing simplicity: Procreate's snapped shapes become special objects; ours stay strokes and ride every existing pipeline including 3D.

## 5. Scope line — corner-point vertex editing (Sebs's (d))

Honest assessment: Procreate's tap-a-vertex-drag-it is **Edit Shape mode** — the editor-grade tier. For us it requires: a stroke-selection model (none exists), per-vertex handles rendered over the canvas with ≥24px hit targets, drag state + live restyle loop, an undo stack (none exists), and a control-point parameterization for curves (a circle has no vertices — you'd edit its center/radius, a different interaction than polygon corners). Estimate **1.5–2 days including battery**, against 6 days to deadline holding the identity pass (06-16), demo video, and submission. The correction need it serves is ~80% covered cheaper: wrong candidate → chip cycle; wobbly edges → Straighten; wrong shape entirely → Re-draw.

**Recommendation: DEFER post-makeathon (SA-F).** The seam is already clean: a snapped stroke's vertices ARE its record points (recoverable via `rdpPoints`), so a future vertex editor needs zero schema work. If Sebs overrules, build it ONLY for polygon-family strokes (corner drag), never curves, ~1 day.

## 6. What the 197-shape catalog needs that drawing still can't express

Census of the catalog's source vocabulary (93 `PinShape` + 104 `PegToolShape`; e.g. `macbook` = rounded rect + line + circle; `sketchbook` = rect + 6 mapped spiral dots + Q-curve; `xacto` = rect + polygon + 4 ruled ticks):

| Catalog vocabulary | After snap+shade+fill? | Via / gap |
|---|---|---|
| straight-edged bodies (vhs, nesCartridge, cardSleeve, monitor bezels) | **YES** | rect/polygon snap + Straighten |
| circles/ellipses (vinyl, pokeball, filmReel, ring, lens dots) | **YES** | circle/ellipse snap |
| solid black details (pupils, blade fills, key blocks) | **YES** | shade band 7 / fill-intent R5 (`mark-intent` §3) |
| 8% washes (the WASH fill on nearly every shape) | **YES** | shade brush low bands (`shade-brush-spec.md`) |
| organic curves (shoe, carriel, ruanaCloth) | **YES already** | freehand + Catmull-Rom |
| rounded-corner rects (`rx` on macbook, gameBoy, monitor — pervasive) | **NO in v1** | SA-C: rounded-rect candidate (5th closed fit; corner radius from residual) — the single highest-leverage add |
| dashed/ruled detail (ruler ticks, dashed strokes, stitch lines) | PARTIAL | each tick drawable+snappable but tedious; dash-as-style = post-makeathon |
| repeated arrays (spiral-binding dots ×6, ruled lines, button grids) | PARTIAL | manual repetition works; a stamp/array tool = post-makeathon |
| precise alignment between shapes (screen centered in bezel, concentric rings) | PARTIAL | snap cleans each shape; inter-shape constraints (Pegasus territory) deferred |

Verdict: snap + Straighten + shade + fill-intent covers the structural vocabulary of roughly the whole catalog; the named residual gaps are **rounded corners** (fixable cheap, SA-C), **dash/array detail** (tedious-not-impossible), and **alignment constraints** (post-makeathon).

## 7. Battery — `test-fixtures/shape-snap/` + `tools/draw/shape-snap-battery.mjs` (golden-gated)

| # | Fixture | Expected |
|---|---|---|
| 1 | wobbly hand-rect | rect, right angles; chip offers square |
| 2 | lazy circle (aspect ~1.05) | circle ranked over ellipse; chip cycles to ellipse |
| 3 | deliberate oval (aspect ~1.8) | ellipse first; circle NOT offered first |
| 4 | triangle with 12px gap (treated-as-closed) | triangle + welded closure → silent solid in 3D |
| 5 | straightish line with end-hook | line if hook < threshold, else honest no-snap |
| 6 | 5-point star | Snap refuses templates → Straighten yields clean 10-corner polygon, concavity kept |
| 7 | scribble | NO-SNAP (reversal gate), note + logged candidate table |
| 8 | two-arc circle (2 strokes) | per-stroke v1 refuses; logged for SA-E |
| 9 | lightning bolt | Straighten → clean bolt; Snap-to-primitive refuses |
| 10 | tiny tick < 24px | no-snap (dot gate) |

Pass = chosen candidate matches golden AND screenshot pairs read per `feedback_never_declare_fixed_without_regression_check`; thresholds provisional until battery + a 20-stroke live-desk sweep (SA-H).

## 8. SEBS DECISIONS

| # | Decision | Recommendation |
|---|---|---|
| SA-A | Auto-detect + switch-chip vs pick-shape-first menu | Auto-detect + chip — one-tap 90% case, Procreate economy, chip grammar already ours |
| SA-B | Two pills (Snap · Straighten) in the Ink cluster | Yes — one engine, two buttons max; circle/oval ride the chip, not a third button |
| SA-C | Candidate set v1: line/polyline/polygon/triangle/rect/circle/ellipse; rounded-rect; arc | Ship the 7; add **rounded-rect** v1.1 (catalog pressure, §6); defer arc (freehand curves already render fine) |
| SA-D | Snap REPLACES record points (original only in chip-undo memory) | Yes — stays a stroke, zero schema, 3D free; decision log preserves the training pair |
| SA-E | Composite multi-stroke snap (two-arc circle → one loop) | Defer — region graph exists (`extractPoolRegions`) but per-stroke v1; log refusals as demand data |
| SA-F | Corner-point vertex editing | **DEFER post-makeathon** (§5) — 1.5-2 days vs chip+Straighten+Re-draw covering ~80% |
| SA-G | Closure weld on snapping treated-as-closed strokes | Yes — explicit act, gap honesty preserved for un-snapped strokes |
| SA-H | Threshold lock (SNAP_MAX_NORM_ERR etc.) | Provisional until battery + live sweep — log-first lock-second (mirror MI-F) |

## 9. Citations

**Ours:** `mark-intent-boundary-spec.md` §2 features + §8 citation bank (Rubine '91 · $1 Wobbrock '07 · $P Vatavu '12 · Sezgin '01 — links there, REUSED not re-derived) · `markIntent.ts` (resample 4px :45, scribble/turnSum/aspect constants :42-96) · `strokeTo3d.ts` (rdpPoints :210, closureStateOf :253, CLOSE_GAP_PX :184, extractPoolRegions :1302) · `coverage.ts` (COVERAGE_BANDS :114, bandIndexForDarkness :126) · `DrawSurface.tsx` (Stroke :14, strokesToObjectMarkup :59, ToneFill system :125-262) · `DrawPanel.tsx` (register row :880-1015, smart-pick chip + remove-note patterns) · `conversion-semantics-spec.md` + addendum · `global-toggles-and-mixed-3d.md` D-3/D-7 · `PinShape.tsx`/`PegToolShape.tsx` (the 197 catalog) · research doc 22 (RDP ε=3.0 canon).
**External (verified, real):**
- Procreate Handbook — *QuickShape*. https://help.procreate.com/procreate/handbook/guides/quickshape (snap families: line/arc/poly-line/ellipse/triangle/quadrilateral; Edit Shape bar; second-finger regularization)
- Wolin, Eoff, Hammond — *ShortStraw: A Simple and Effective Corner Finder for Polylines*, SBIM 2008. https://diglib.eg.org/items/9fc7bbef-5b6f-430e-b586-2a00883a362f
- Paulson, Hammond — *PaleoSketch: Accurate Primitive Sketch Recognition and Beautification*, IUI 2008. https://www.researchgate.net/publication/221607733_PaleoSketch_Accurate_primitive_sketch_recognition_and_beautification (8 primitives + geometric corroboration tests + simplicity ranking)
- Fitzgibbon, Pilu, Fisher — *Direct Least Squares Fitting of Ellipses*, IEEE TPAMI 21(5), 1999. https://homepages.inf.ed.ac.uk/rbf/CVonline/LOCAL_COPIES/FITZGIBBON/ELLIPSE/
- Chernov — *conicfit: Algorithms for Fitting Circles, Ellipses and Conics* (Kåsa/Taubin circle fits, implementation reference). https://rdrr.io/cran/conicfit/man/EllipseDirectFit.html
- Igarashi, Matsuoka, Kawachiya, Tanaka — *Interactive Beautification: A Technique for Rapid Geometric Design* (Pegasus), UIST 1997. https://dl.acm.org/doi/10.1145/263407.263525 (perpendicularity/congruence constraint inference — our rect regularization + the deferred alignment tier)
