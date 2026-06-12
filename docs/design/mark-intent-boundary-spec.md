# Mark-Intent Boundary — shading / fill / structure for the DRAWN register

**Date:** 2026-06-12 · **Status:** SPEC — no code in this pass (src/ owned by build fleet). Round-7 directive sibling of `conversion-semantics-spec.md`.
**Governing refs:** `conversion-semantics-spec.md` + its RED-TEAM AMENDMENT (ratified 2026-06-12 — "one record, one treatment vocabulary, TWO register brains") · `global-toggles-and-mixed-3d.md` D-3/D-7 (convert FROM THE RECORD) · `strokeTo3d.ts` · `DrawSurface.tsx` · `coverage.ts` · `09-LOCKED-MODEL.md` I-1/I-2/I-7/I-10 · research doc 22 (S11: signals from RAW points only) · memory `project_desk_doodles_shading_input_tone_fill`.

---

## 0. Ground truth: why the drawn register needs its own brain

Traced live (red-team, decision log on the real desk): drawn stroke records are `fill="none"` polylines (`DrawSurface.tsx:77` `strokesToObjectMarkup`); `signals.ts:42-44` returns the **literal string `"none"`**, not `null`; `classifier.ts:282-290` `RULE_paper_near_zero` only bails when `fill === null`, so with darknessL≈0 it fires **`paper@0.9` on every drawn stroke** (23/23 regions on the real desk). The smartHachure classifier contributes **zero useful bits for drawings** — it serves the UPLOAD register only. The `paper` misfire is a separate filed bug (golden re-bless ceremony, not here).

So the drawn register's intent layer must be **stroke-feature/geometry-driven**: computed from the `[x,y,pressure]` arrays in the record (`StrokePoint`, `DrawSurface.tsx:13`), never from the classifier. Both brains emit into the SAME treatment vocabulary (conversion-semantics §3) and the SAME decision log. This spec is the drawn brain's contract for the question closure alone cannot answer: **is this mark a thing, a tone, or a fill?**

Canonical failures this spec exists to fix: (1) Sebs's ARROW — structural outline → slab; (2) CAT-FACE EYE SCRIBBLES — shading gestures → per-stroke 3D blobs; (3) two-arc circle — region never recognized; (4) deliberate spiral-fill — must STAY solid; (5) hand-hatching inside an outline — must not become 50 tubes.

## 1. The taxonomy — three intents, argued minimal

| Intent | Meaning | The mark's fate |
|---|---|---|
| `structure` | the stroke IS the drawing's form (outline, limb, arrow shaft) | geometry: amendment rules verbatim — closed→solid slab (sacred), open→line-rod, open-ish→rod+chip |
| `shading-gesture` | the marks declare TONE on a region (scribble, hatching, stipple) | **no geometry of its own**; emits `surface-hatch(band)` onto the containing region; marks preserved visually in 2D |
| `fill-intent` | the marks declare a SOLID area (spiral-fill, blacked-in eye) | the marks' envelope becomes the region: 2D solid / band-7; 3D one clean solid mass — never per-stroke blobs |

Plus the **`ambiguous` outcome** (not a 4th intent): argmax applies, honest chip surfaces (§3).

**Why exactly three.** (a) *Structure vs tone* is the load-bearing split — it decides whether a stroke produces geometry at all; every fixture failure is a tone mark getting structure treatment. (b) *Shading vs fill* cannot merge: shading modifies a region that ALREADY exists (band on container, marks kept); fill CREATES its region (envelope→mass, must survive as solid — fixture 4 vs fixture 5 demand opposite treatments for similar-energy scribbles). (c) Candidates rejected from the minimal set: **dots** fold into structure (a tap = ink bead) except dot-CLUSTERS inside a region, which are stipple shading (cluster row, §3) — no new intent needed; **text/annotation** is a real class in the literature (Olsen survey §annotation) but rods render it honestly — post-makeathon; **scratch-out-as-delete** (the CALI scribble-erase gesture) is deliberately NOT inferred — destructive actions stay explicit UI (MI-H). Teddy makes the same minimality move: a handful of stroke intents disambiguated by context, not a deep grammar [Igarashi '99].

## 2. Signals — computable from the record, nothing else

**Honesty constraints first:** the record has **no timestamps** (`StrokePoint = [x,y,pressure]`) — Rubine's duration/speed features (f12-f13) and Sezgin's speed-based corner detection are NOT available offline; stroke ORDER is in the record (array order) and is usable. **Pressure is low-trust** — mouse reports a constant (`e.pressure || 0.5`, `DrawSurface.tsx:426-429`). **`capStrokes` halves point density** to fit the ~45KB row budget (`DrawSurface.tsx:85-101`) — so every signal below is computed on an **arc-length-resampled** polyline (fixed ~4px spacing, the $1-recognizer normalization move [Wobbrock '07]) so a capped record classifies identically to the live one. Raw points in, per S11 (doc 22): no signal may read post-simplification artifacts.

**Per-stroke** (Rubine-lineage geometry features [Rubine '91]):

| Signal | Definition | Discriminates |
|---|---|---|
| `bboxDiag`, `arcLen` | stroke bbox diagonal; resampled polyline length | scale gates; `arcLen/bboxDiag` = wander ratio |
| `hullCoverage` | ink area (arcLen × 3px stroke width, capped) ÷ convex-hull area | scribble density: fill ≳ shading ≳ outline |
| `reversalFreq` | ~180° direction flips (turn > 150° at resample spacing) per 100px arcLen | scribble/hatch zigzag vs calm line |
| `selfIsectDensity` | segment-segment crossings (on RDP ε=3.0 anchors) ÷ arcLen | scribble/spiral vs simple curve |
| `turnSum`, `absTurnSum`, `sharpness` | signed total turning; absolute total; Σθ² — Rubine f9-f11 | spiral signature: \|turnSum\|>4π AND \|turnSum\|/absTurnSum>0.8 (consistent winding); lightning: high sharpness, sign-alternating |
| `anchorCount`, `meanSegLen` | RDP ε=3.0 anchors (existing `rdpPoints`, `strokeTo3d.ts:196`); mean segment | polygonal-vs-curve kinship with the 2D dispatch (doc 22) |
| `closure` (3-state) | closed / open-ish / open — amendment thresholds, replaces grabby `isClosedStroke` (`strokeTo3d.ts:231`) | structure sub-treatment |
| `dotness` | bboxDiag < 8px ∨ resampled count < 4 | bead vs stroke |
| `pressureVar` | variance of p; **trusted only if p ≠ 0.5-constant** | stylus-only tiebreak, never primary |

**Per-cluster** (the pool at Done; singles are clusters of 1):

| Signal | Definition | Discriminates |
|---|---|---|
| `containment` | fraction of the stroke's points inside a region of the **composite region graph** (below) | shading needs a container |
| `parallelism` | group of ≥3 strokes: principal-axis angles within ±20°, inter-stroke spacing regularity (σ/μ < 0.4) — the StrokeAggregator proximity/parallelism grouping [Liu '18; Orbay '11] | hand-hatching cluster (fixture 5) |
| `regionCoverage` | cluster ink hull ÷ containing-region area | shading (partial patch) vs fill of the region |
| `dotClusterSize` | count of `dotness` strokes within one region, pairwise gap < ~24px | stipple shading (fixture 10) |
| `sequenceAdjacency` | consecutive record indices | hatching/scribble bursts are drawn consecutively — cheap cluster prior |

**Composite region graph (the two-arc fix, fixture 3):** before intent runs, build an endpoint graph — strokes are edges; endpoints within `max(CLOSE_GAP_PX, 8% of joint bbox diag)` merge into nodes; graph cycles become composite loops; loops + single closed strokes feed the existing depth-parity containment tree (`strokeTo3d.ts:1055-1107`, promoted per conversion-semantics §1). Multi-stroke consolidation into intended curves is exactly StrokeAggregator's problem statement [Liu '18]; Ink-and-Ray likewise stitches outline fragments into closed regions before semantics [Sýkora '14].

## 3. Decision table — signals → intent → treatment (one record, one vocabulary)

Scored rules, top score wins; every evaluation logs `{surface:'mark-intent', clusterId, strokeIds, rawScore, margin, firedRules}` to `window.__dd_decisionLog` (QW-1/QW-2 pattern, same as the classifier). Thresholds below are PROVISIONAL — calibrated against §6 before lock.

| # | Pattern | Intent | Treatment (2D · 3D) |
|---|---|---|---|
| R1 | `dotness`, no cluster | `structure` (bead) | mark as-is · ink bead (degenerate rod, already built `strokeTo3d.ts:406`) |
| R2 | calm stroke: reversalFreq < 1.5 ∧ selfIsectDensity ≈ 0 | `structure` | mark as-is · amendment map: closed→solid · open→line-rod · open-ish→rod + "treated as closed?" chip |
| R3 | composite loop (region graph cycle) | `structure` | as R2 closed, on the merged loop — two-arc circle becomes a slab + a containing region |
| R4 | scribble (reversalFreq ≥ 3 ∨ selfIsectDensity high) ∧ containment ≥ 0.7 ∧ regionCoverage < 0.55 | `shading-gesture` | marks preserved + region band = `bandIndexForDarkness(est. coverage)` (`coverage.ts:126`) feeds I-2 · `surface-hatch(band)` on container, ZERO own geometry |
| R5 | scribble ∧ containment ≥ 0.7 ∧ regionCoverage ≥ 0.55 — or contained ∧ hullCoverage ≥ 0.6 (the blacked-in eye) | `fill-intent` | solid dark patch at the marks' hull · one clean solid mass (envelope via the Solid raster machinery, `strokeTo3d.ts:994`) — never per-stroke blobs |
| R6 | spiral signature (\|turnSum\|>4π, consistent winding) ∨ uncontained scribble with hullCoverage ≥ 0.6 | `fill-intent` (self-region) | spiral-fill STAYS solid (fixture 4); hull becomes the region |
| R7 | parallel cluster: ≥3 strokes, ±20°, spacing regular, contained | `shading-gesture` (cluster) | ONE band on the container, marks preserved · 0 tubes (fixture 5); est. coverage from spacing/width (Praun TAM density math, already our §4 calibration) |
| R8 | dot cluster ≥ 4 inside region | `shading-gesture` (stipple band) | band from dot density · no spheres |
| R9 | high-energy but uncontained + sprawling (lightning, cursive): reversals/sharpness high ∧ containment < 0.3 ∧ hullCoverage < 0.35 | `structure` | reversal-energy alone NEVER demotes to tone — containment or hull-density must corroborate (fixtures 6-7) |
| R10 | margin < 0.15 between top two intents | `ambiguous` | apply argmax + **honest chip** on the object: `Marks: Lines / Shading / Fill` 3-way pill; flip = labeled training tuple through `overrideStore` (same flywheel as naming/placement/conversion corrections) |

The arrow end-to-end: open-ish outline → R2 structure → rod + chip (the amendment's fix — the slab came from the grabby closure threshold, root cause #1). The cat-face eyes: small contained dense scribbles → R5 fill-intent → two clean dark patches, no blobs. **"Preserve the marks, infer the meaning"** is the invariant: intent assigns METADATA (bands, geometry contribution); the user's actual ink is never redrawn without an explicit conversion act (§5). Precedent: Teddy types strokes by context (creation vs paint vs erase) [Igarashi '99]; Ink-and-Ray separates structural outlines from shading marks and keeps the drawing authoritative [Sýkora '14]; sketch-cleanup nets treat overdraw as ONE intended curve — and their failure on shading marks (everything becomes line) is exactly the failure we route around [Simo-Serra '16].

## 4. Where it runs

- **At Done** (DrawPanel / ObjectSurface), after region extraction (§2 graph), before publish. Output stored IN THE RECORD: `render_config.markIntents = [{strokeIds, intent, band?, regionRef?, rawScore, margin}]` — so D-3 "convert FROM THE RECORD" reads intents without recompute, and mode flips are deterministic offline (I-7/I-10).
- **Re-runs on Re-draw Done** (strokes changed → intents stale). Style sweeps NEVER re-run it (D-7: sweep re-renders, never re-classifies). Geometry-dropdown overrides still win per stroke (I-1 spirit).
- **The tone-fill brush (round 7) is the explicit register and ALWAYS beats inference** — a brushed band on a region nulls any R4-R8 inferred band there (mirror of D2-F). Inference is the fallback for people who shade the way Sebs does: by scribbling. Until the brush ships, inferred shading is the ONLY drawn-input channel into per-region tone (amendment item 4's gap, closed from the inference side).
- Module: `src/app/lib/smart/markIntent.ts` (NEW, pure, node-runnable like `strokeTo3d.ts` — smoke harness drives fixtures headless). No classifier contact, no locked-file contact.

## 5. The 2D consequence — one intent layer, both renderers

A recognized `shading-gesture` writes its band into the region's **source darkness (I-2)** — the same number the upload register gets from fills. Downstream, free: (a) the 2D fillStyle conversion can now treat the scribbled region as a TONE REGION — flip fillStyle and the region re-renders as hachure/cross-hatch/dots at the same band (this is precisely what memory `project_desk_doodles_shading_input_tone_fill` says scribbles can't do today); (b) the 3D Hatch shader reads the same band via `bandTableForUniforms()` (`coverage.ts:168`) — one math, two renderers. Default 2D render stays **marks preserved** (the record is sacred); "Convert marks to fill style" is an opt-in per-object toggle (MI-C). `fill-intent` regions enter at band 7 and stay solid under every fillStyle (the I-1 narrow-override rule already protects user-explicit solids).

## 6. The 10-fixture battery (golden-gated like everything else)

Stored as stroke-record JSON in `test-fixtures/mark-intent/`; expected labels = `markintent-golden.json`; same golden-diff ceremony before any threshold change. Headless via the pure module.

| # | Fixture | Expected intent → treatment |
|---|---|---|
| 1 | Sebs's ARROW (open-ish outline) | structure → line-rod + closure chip; NEVER slab |
| 2 | CAT-FACE with scribbled eyes | head: structure→solid; eyes: fill-intent→2 clean dark patches, zero blobs |
| 3 | Two-arc circle | composite loop → structure→solid; region exists for later containment |
| 4 | Deliberate spiral-fill | fill-intent → STAYS solid (winding signature) |
| 5 | Hand-hatching inside an outline (7 parallel strokes) | cluster shading-gesture → ONE band on region; 0 tubes |
| 6 | Lightning bolt (zigzag, uncontained) | structure — reversal energy without containment/density |
| 7 | Cursive signature (self-crossing, sprawling) | structure — crossings without containment/density |
| 8 | Single wavy line INSIDE a region | structure (decoration) — low reversalFreq per length; guards R4 from eating calm contained strokes |
| 9 | Full-canvas scribble, no container | fill-intent over own hull (R6) — not "shading of nothing" |
| 10 | Dot cluster inside outline + one lone dot outside | cluster → stipple band; lone dot → structure bead |

Pass = intent labels match golden AND the 3D render shows the stated treatment (screenshot pair per fixture, per `feedback_never_declare_fixed_without_regression_check`). Fixtures 6-9 are the adversarial guards: every one is a HIGH-energy mark that must stay structure or self-fill — the rules that catch 2/4/5 must not eat them.

## 7. SEBS DECISIONS

| # | Decision | Recommendation |
|---|---|---|
| MI-A | Adopt the 3-intent taxonomy (+ ambiguous outcome) as the drawn-register brain | Yes — minimal set argued §1; both registers share the treatment vocabulary |
| MI-B | Ambiguous handling: argmax + honest 3-way chip vs always-default-structure | Argmax + chip — always-structure reproduces the eye-blob failure; chip flips are training data |
| MI-C | 2D default for recognized shading: marks preserved (convert = opt-in toggle) | Preserve — "preserve the marks, infer the meaning"; conversion is an explicit act |
| MI-D | Storage: `render_config.markIntents` (no schema change) vs new column | render_config — rides existing publish path + 45KB stroke budget untouched |
| MI-E | Add timestamps to StrokePoint for speed features | Defer — geometry suffices for all 10 fixtures; size cost hits `capStrokes`; revisit only if calibration stalls |
| MI-F | Threshold lock (R4-R10 numbers) | Provisional until the battery passes + a 20-drawing live-desk sweep; log-first, lock-second |
| MI-G | Scratch-out scribble as delete gesture | NEVER inferred — destructive stays explicit UI (CALI precedent acknowledged, rejected) |
| MI-H | Build slot | With the tone-fill brush in round 7 — they share the region graph + band plumbing; brush = explicit register, this = inferred fallback |

## 8. Citations

**Ours:** `conversion-semantics-spec.md` + RED-TEAM AMENDMENT (two-brains architecture, 3-state closure, D2-F) · `signals.ts:42-44` / `classifier.ts:282-290` (the paper@0.9 trace) · `DrawSurface.tsx:13/:77/:85-101/:426-429` (record shape, fill="none", capStrokes, pressure) · `strokeTo3d.ts` (:196 rdp, :231 closure, :994 Solid raster, :1055 depth parity) · `coverage.ts` (:126 bandIndexForDarkness, :168 bandTableForUniforms) · `global-toggles-and-mixed-3d.md` D-3/D-7 · `09-LOCKED-MODEL.md` I-1/I-2/I-7/I-10 · research doc 22 §S11 · memory `project_desk_doodles_shading_input_tone_fill`.
**External (verified, real):**
- Rubine, D. — *Specifying Gestures by Example*, SIGGRAPH '91. https://dl.acm.org/doi/10.1145/127719.122753 (the 13 geometric/temporal stroke features; we use the geometry subset)
- Wobbrock, Wilson, Li — *$1 Recognizer*, UIST '07. https://dl.acm.org/doi/10.1145/1294211.1294238 + Vatavu, Anthony, Wobbrock — *$P: Gestures as Point Clouds*, ICMI '12. https://dl.acm.org/doi/10.1145/2388676.2388732 (resample-normalize lineage; articulation-invariant multistroke)
- Sezgin, Stahovich, Davis — *Sketch Based Interfaces: Early Processing for Sketch Understanding*, PUI '01. https://dl.acm.org/doi/10.1145/971478.971487 (corner finding from curvature; speed channel noted as unavailable in our record)
- Fonseca, Pimentel, Jorge — *CALI: An Online Scribble Recognizer for Calligraphic Interfaces*, AAAI Spring Symp. on Sketch Understanding, 2002 (thinness P²/A + hull-area ratio features; scratch-out gesture precedent)
- Igarashi, Matsuoka, Tanaka — *Teddy*, SIGGRAPH '99. https://www.cs.toronto.edu/~jacobson/seminar/igarashi-et-al-1999.pdf (context-typed strokes; closed-loop-becomes-volume)
- Sýkora et al. — *Ink-and-Ray*, ACM TOG 33(2), 2014. https://dcgi.fel.cvut.cz/home/sykorad/ink-and-ray (outline-vs-shading separation; drawing stays authoritative)
- Liu, Rosales, Sheffer — *StrokeAggregator*, ACM TOG 37(4) / SIGGRAPH 2018. https://www.cs.ubc.ca/labs/imager/tr/2018/StrokeAggregator/ (proximity/parallelism stroke consolidation → our cluster signals + endpoint-graph merge)
- Orbay, Kara — *Beautification of Design Sketches Using Trainable Stroke Clustering and Curve Fitting*, IEEE TVCG 17(5), 2011 (trainable stroke clustering precedent)
- Simo-Serra, Iizuka, Sasaki, Ishikawa — *Learning to Simplify*, ACM TOG 35(4) / SIGGRAPH 2016. https://esslab.jp/~ess/en/research/sketch/ (overdraw collapses to one curve; cleanup's blindness to shading marks = our cautionary tale)
- Noris et al. — *Smart Scribbles for Sketch Segmentation*, Computer Graphics Forum 31(8), 2012 (stroke-level intent labeling via scribble supervision — the chip-flip training loop's ancestor)
- Olsen, Samavati, Sousa, Jorge — *Sketch-Based Modeling: A Survey*, Computers & Graphics 2009. https://ires.cpsc.ucalgary.ca/publ/papers/2009/refs/Olsen%20et%20al.%20'09.pdf (stroke-role taxonomy incl. annotation strokes)
- Praun et al. — *Real-Time Hatching*, SIGGRAPH 2001. https://gfx.cs.princeton.edu/pubs/Praun_2001_RH/index.php (hatch-density-as-tone; band math already ours via coverage.ts)
- perfect-freehand (Ruiz) — https://github.com/steveruizok/perfect-freehand (pressure simulation from velocity; why recorded pressure ≠ rendered width)
