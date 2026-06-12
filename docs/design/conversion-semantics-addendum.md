# Conversion Semantics — Addendum (region formation · shading lifecycle · hard path)

**Date:** 2026-06-12 · **Status:** SPEC ADDENDUM — READ-ONLY on src/ (build fleet owns the tree). Closes the three holes left open by `conversion-semantics-spec.md` after the red-team landed.
**Governing frame (red-team, ratified in-chat 2026-06-12 — supersedes the parent spec's §1 "consume the classifier" for drawn input):** the classifier does NOT work on drawn strokes (traced misfire: drawn regions classify `paper`@0.9 — the rules were tuned on the 197-shape upload catalog, and a stroke-built region carries none of the stylistic signals they vote on). The ratified architecture is **one record, one treatment vocabulary (parent spec §3 — unchanged), TWO register brains**: geometry/topology decides for the DRAWN register (closed → SOLID family stays the default — the heart slab is sacred; open → rod; donut holes by containment parity); the classifier decides for UPLOADS only. Root cause #1 of the arrow-slab is the closure threshold `max(24px, 8% diag)` at `strokeTo3d.ts:231` — the amendment is a 3-state closure (§1.1).
**Sibling:** `mark-intent-boundary-spec.md` (in flight, sibling pass) owns the INTENT taxonomy — which marks mean what. This addendum is additive: region-formation mechanics, shading lifecycle, hard-path conditioning. No overlap by construction.
**Refs:** `conversion-semantics-spec.md` (D2 vocabulary + §6 honesty table + D2-F) · `global-toggles-and-mixed-3d.md` D-3/D-5/D-7 am.3-4 · `3d-mode-controls-spec.md` §2.4-2.5 · `strokeTo3d.ts` (:231 closure · :994-1127 pool raster · :914 deterministic saddles · :1055 parity) · `coverage.ts` (COVERAGE_BANDS, bandIndexForDarkness) · `publish.ts` (:397 v4 restyle · :425 v5 Re-draw · :134 content_hash) · `contentHash.ts` · `vision-router-spec.md` · `21-research` §5c/§6/§8 · SESSION-HANDOFF round-7 (tone-fill register) + round-8 (AI default).

---

## CHAPTER 1 — REGION FORMATION

### 1.1 Three-state single-stroke closure (the fast path — the arrow-slab fix)

`isClosedStroke` collapses a continuum into a boolean at the LOOSE end of the plausible range — an arrow outline with a 15-20px endpoint gap "closes," `pickGeometryMode` (:254) says extrude, and `THREE.Shape` silhouette-fills it (:519). The amendment keeps the topology brain but makes the guess honest:

| State | Condition (endpoint gap g) | Treatment | Receipt |
|---|---|---|---|
| **closed** | g < max(8px, 2.5% bbox diag) | solid family, no ceremony — Auto→Extrude slab. **The heart stays a slab.** | log only |
| **treated-as-closed** | g ∈ [tight, max(24px, 8% diag)) | solid family + status chip "Treated as closed" + `Treat as: closed / open` pill (parent spec §6 row 2, now wired to a real state) | chip + log + every flip = a labeled correction (§8 pattern) |
| **open** | g ≥ loose bound | rod | log only |

The tight bound is a proposal, not a measurement — both thresholds are calibration constants (same standing as `K_ZIGZAG` in coverage.ts): sweep the drawn-stroke fixtures + the live decision log before freezing; the chip-flip corrections then tune them with data. Worked examples: a hand-drawn heart returns to its start (g ≈ 0-8px) → closed, slab, silent. The arrow repro lands in the ambiguous band → still a slab by default (closed-means-mass stays the drawn-register law) but CHIPPED — one tap to rod, logged, reversible. Precedent for closed-only volume: Teddy inflates closed strokes only ([Igarashi et al., SIGGRAPH '99](https://www.cs.toronto.edu/~jacobson/seminar/igarashi-et-al-1999.pdf)); SketchUp Push/Pull operates on faces only ([SketchUp Help](https://help.sketchup.com/en/sketchup/pushing-and-pulling-shapes-3d)); the open/closed ambiguity band itself is catalogued in the SBIM survey ([Olsen et al. 2009](https://ires.cpsc.ucalgary.ca/publ/papers/2009/refs/Olsen%20et%20al.%20'09.pdf)).

### 1.2 Multi-stroke enclosure: pool raster IS the region extractor

Two candidate machines for "which areas do these N strokes enclose":

| Axis | **Pool raster** (built — `buildSolidGeometry` :994-1127) | Planar-arrangement graph (exact intersections → half-edge faces) |
|---|---|---|
| Cost | O(grid): ≤200² = 40k cells, pure JS scanline + capsule stamp + marching squares — sub-10ms per Done | O((n+k)·log n) on segments — fine — but JS has no maintained exact-arrangement lib; `polygon-clipping@0.15.7` (in package.json, unused) does booleans, NOT face extraction from open polylines |
| Robustness on hand input | The ink radius IS the tolerance: near-misses fuse, T-junction gaps ≤ ink radius auto-close — exactly what hand drawing needs | Exact arithmetic or epsilon-tuning hell at near-tangent crossings and gapped junctions — hand drawing's whole character is the degenerate case |
| Determinism | Fully deterministic: no randomness, fixed saddle resolution (:914-921) — same strokes → same grid → same loops → content-hash-stable | Achievable, but float branch flips near degeneracies are hash-instability risks |
| Sub-regions from crossing strokes | NO — interior ink absorbs into the mass (see §1.4) | YES — its one real advantage |

**Recommendation: promote the pool raster from "Solid's internal trick" to THE drawn-register region extractor for ALL modes** (the parent spec §1 already pointed here; the red-team made it the only brain for drawn input). Concretely that means the containment-parity walk (:1055-1107) feeds every mode: Extrude gets its donut holes via `Shape.holes` from the same parity tree (parent spec §4 hole row), Rod/Inflate get closure + containment facts, Solid keeps its current path verbatim. Planar arrangement = post-makeathon, and only if §1.4's cut ever gets un-cut.

### 1.3 WHEN it runs

Options: (a) live during draw — burns the same per-pointermove budget as the N-object drag perf alarm, for zero user-visible payoff (2D needs no region graph until shading/3D); (b) lazily at first 3D flip, cached by content_hash — cheapest, but every fresh device recomputes and the 2D tone-fill render (Ch. 2) would ALSO need it, making "lazy" a lie; (c) **at Done, persisted into `render_config`** — recommended. It rides the existing record boundary: strokes already ride `render_config` (v5 Re-draw rewrites svg + strokes + config + content_hash together, `publish.ts:425`), and D-7 am.3 already says mode flip converts FROM THE RECORD, cached. Store a compact region summary `{ extractorVersion, closureStates[], containmentTree, perRegionBand[] }`. Because the extractor is deterministic (§1.2), the cache is an OPTIMIZATION, never a truth source: legacy/null rows and version mismatches recompute on read and get identical answers — no backfill SQL needed, no honesty gap.

### 1.4 Crossing-stroke sub-regions — the honest makeathon cut

Draw a circle, then a chord across it: a planar arrangement yields two half-moons; the pool raster yields one mass with a line of ink through it. **Cut: crossing strokes do NOT subdivide regions this makeathon.** The chord renders as ink riding the solid (line-rod over mass, mark-grammar layer). This is shipping practice, not a dodge: Teddy treats a stroke drawn across the object as an explicit cutting OPERATION, never a passive split ([Igarashi '99](https://www.cs.toronto.edu/~jacobson/seminar/igarashi-et-al-1999.pdf) §cutting); Ink-and-Ray needs explicit user scribble annotations to resolve region structure in hand-drawn art ([Sýkora et al., TOG 2014](https://dcgi.fel.cvut.cz/home/sykorad/ink-and-ray)) — nobody infers sub-regions silently from crossings. And the round-7 tone brush dissolves most of the need: a user who wants the lower half-moon darker BRUSHES it darker — the tone mask delivers the sub-region with an explicit band attached, no arrangement math at all (§2.4). The intent-layer reading of crossing strokes belongs to `mark-intent-boundary-spec.md`.

---

## CHAPTER 2 — SHADING LIFECYCLE

### 2.1 Tone-fill bands are RECORD data

The round-7 tone register stores as a sibling of strokes — `render_config.toneFills: Array<{ id, points (brushed outline, viewBox coords), band: 0-7 }>` — never baked into the svg (D-5: nothing is baked; the 2D life keeps everything). Store the **band index**, not a raw alpha: the 8 discrete levels are the round-7 ask verbatim, JND-grounded by the same `COVERAGE_BANDS` table both renderers quantize with — a brushed band 5 and an inferred band 5 are indistinguishable downstream by construction (one math, two registers in, two renderers out).

### 2.2 Invalidation on Re-draw — deterministic, content-hash-consistent

Re-draw (ObjectSurface → draw canvas → Done) rewrites svg + strokes + config atomically (v5 RPC, `publish.ts:425`). Lifecycle rule, in order: (1) **re-extract** — ink changed, so the §1.3 region graph recomputes at the same boundary; (2) **re-bind** — tone patches are user statements about AREAS of the canvas, so they survive ink edits as geometry and re-attach to the NEW regions by the §2.3 overlap rule; a patch whose host vanished falls back to self-region (§2.4); (3) **re-convert** — cached conversions invalidate via the key. **Cache-key amendment:** the doodle's `content_hash` is SHA-1(svg) only (`publish.ts:134`) — correct as artwork identity, insufficient as conversion identity (same ink + different tone bands must not collide). Conversion/render caches key on `SHA-1(svg ∥ strokesJson ∥ toneFillsJson ∥ extractorVersion)` via the existing `contentHash()`; `extractorVersion` bumps invalidate fleet-wide when the algorithm changes (the golden-gate pattern applied to caches). Every re-bind logs `{surface:'shading-rebind', patchId, oldRegion, newRegion, rule}` — deterministic in, receipts out.

### 2.3 Bands straddling regions

A brushed patch overlapping two regions splits AT region boundaries — tone is per-region data downstream (I-2: source darkness owns per-region identity; `coverage.ts` solves per region; 3D `surface-hatch(band)` applies per region surface). Mechanics: intersection of patch mask × region (the installed `polygon-clipping` martinez booleans do exactly this; raster fallback = count shared grid cells). Attachment floor: intersection ≥ 40px² OR ≥ 10% of the region's area (consistent with the 2D tiny-area clamp, 18-scope-audit row 13) — below it the sliver is noise, logged and dropped. Two patches with different bands on one region: **area-majority wins** (discrete bands never average — averaging would mint a band the user never brushed), loser logged. Per-pixel tone WITHIN a region (gradient shading) = post-makeathon; makeathon contract is one band per (patch × region) intersection.

### 2.4 Shading with NO enclosing region

Brushing tone on open canvas: **the patch's own brushed mask IS its region** — it enters the §1.2 pool as a closed loop carrying an explicit band (the brush is its own enclosure; closure is never in question). 2D: marks render clipped to the mask at that band — tone-brushing works everywhere, no "you must close a shape first" rule. 3D: if the mask overlaps a solid region, it's `surface-hatch(band)` on that mesh (normal §2.3 binding); a floating patch with no host becomes a thin slab at band-driven hatch (depth × 0.25 of the mode default — visibly flatter than drawn mass, honestly a "shading chip" not an object). Never silently skipped (D-3's law), always logged. The thin-slab read is a Sebs eyeball call — flagged A-6.

### 2.5 Uploads: own fills vs tone bands — the precedence ladder

Uploads arrive with literal fills the signals layer already converts to darkness (`fillDarknessFactor` hex/rgb/hsl → WCAG luminance, spec §7.B-14). When tone bands land on upload regions, precedence per region is: **override store (1.0) > tone-fill band > upload's own fill darkness > classifier-inferred darkness** — D2-F's "explicit user register beats inference, always," extended to a full ladder where each rung beats every rung below. The tone band replaces the region's darkness INPUT to `coverageToParams`/band lookup; the upload's original fill stays untouched in the record (D-5) — lift the tone patch and the fill-derived band returns. Every resolution logs `{surface:'shading', regionPath, source:'override'|'tone-fill'|'upload-fill'|'inferred', band}`.

---

## CHAPTER 3 — HARD-PATH CONVERSION SEMANTICS

### 3.1 Input conditioning — what image per intent

Every image-to-3D pick conditions on APPEARANCE: no API accepts SVG (21 §8 "SVG note" — rasterization is mandatory, so "what image" is unavoidable); TRELLIS conditions on DINOv2 visual features of the input image ([Xiang et al., arXiv:2412.01506](https://arxiv.org/abs/2412.01506)); and across Tripo/Meshy/Rodin all stylization is texture-stage (21 §5c [G1]-[G6]) — the IMAGE is the only lever we have on the returned geometry. Three candidate conditioning images, and the argument for what preserves the hand: the hand lives in **line quality** (wobble, pressure, closure) and **the tonal statement** — NOT in the mark grammar, because marks round-trip at the render layer regardless (policy lock 21 §5: SVG-port works on EVERY geometry mode; the mesh never needed to carry the hachure). So:

| Intent | Conditioning image | Why |
|---|---|---|
| raw strokes (rejected as default) | plain black polylines | Sanitized linework is the Suzanne pole — exactly the fidelity-to-intent product we are not (21 §8 three-poles); strips line character the model could echo |
| **Volumetric AI (default)** | **styled-line + flat-tone composite**: strokes rendered through the current pen pipeline (line character survives) + tone bands rasterized as flat greys; hachure/stipple MARKS omitted | Max geometry legibility; dense mark grammars risk reading as surface noise → bumpy reconstruction (reasoned risk — the §3.5 log turns it into a measured one); the hand returns via SVG-port/Hatch on the GLB |
| **3D Artist** | **full styled render** (marks included) + StyleGuide JSON (21 §5c) | Appearance conditioning is the only stylization lever the APIs offer — if the mesh is to carry the hand, the model must SEE the hand |

### 3.2 Tone bands rasterize INTO the conditioning image

Single-image reconstruction reads shading as a shape cue — a brushed dark flank is a volume statement the model can act on. Each band rasterizes as a flat grey at its band's darkness midpoint (`COVERAGE_BANDS` — the same 8 numbers everywhere), composited under the line layer. Deterministic rasterization: same record state + same toggles → byte-identical PNG → same hash → cache hit (`contentHash` on the blob; GLBs key off it in OPFS per 21 §3).

### 3.3 Honest boundary: ZERO per-region control on return

The GLB is one opaque textured mesh — our region graph does not map onto it. No hole toggle, no per-region treatment, no band edit applies to an AI mesh; **Regenerate is the only lever** (mesh segmentation back to our regions = post-makeathon research, not a chip we fake). UI: the D2/§6 per-region affordances disable in AI mode with one status line ("AI mesh — regions live in the drawing; regenerate to apply changes"). What our region semantics DO control on the hard path moves upstream: the composite (§3.1-3.2) and the router prompt (region-graph stats — closure states, containment, band histogram — ride the prompt per the parent spec §8's round-8 note and `vision-router-spec.md` §2 stroke-stats slot).

### 3.4 Local toggles → the composite, on AI-mode switch

When the user flips to AI mode (or hits Regenerate), the composite is built from the record under the CURRENT effective toggles (pen scope or desk lens, D-7 am.4) — what you see in 2D is what the model is shown. WYSIWYG conditioning, no hidden canonical render. After a GLB exists, toggle changes never auto-regenerate (cost + I-1: the system never spends the user's credits or overrides their kept result) — a quiet "Regenerate with current look" pill appears when the live composite hash drifts from the GLB's source hash. The existing mesh stays until the user acts.

### 3.5 Decision-logged training pairs

Every generation logs `{surface:'hard-path', contentHash, compositeVariant: 'raw'|'styled-line+tone'|'full-styled', toggleSnapshot, engine, styleGuide?, outcome: 'accepted'|'regenerated'|'reverted-to-local'}` — accept/reject IS the label. This is the same flywheel as naming/placement/conversion corrections (parent spec §8, smart-system plan §4): the conditioning-variant policy (§3.1's table) starts as rules and earns its learned successor from these pairs. Pre-warm fixtures double as the eval set for the variant A/B.

### 3.6 AI-as-default + local D2 coexistence (ratified round 8)

Hard path becomes the DEFAULT 3D when available; local geometry modes stay options + the fallback ladder AI → local Auto → honest paper card, never skip, never stub (`3d-mode-controls-spec.md` §2.5). Local-instant-first stands (vision-router-spec §5: local render is the floor; the router only upgrades, never gates). The division of labor in one sentence: **on the local rungs, D2 decides what each region IS as matter; on the AI rung, D2 decides what the model SEES** — same record, same vocabulary, same receipts, two places the brain plugs in.

---

## SEBS DECISIONS (recommended defaults — nothing locked here)

| # | Decision | Recommendation |
|---|---|---|
| A-1 | 3-state closure: tight bound max(8px, 2.5% diag), loose bound stays max(24px, 8% diag) | Adopt; treat both as calibration constants — sweep + chip-flip corrections tune them |
| A-2 | Treated-as-closed default: solid family + chip (vs default-open + chip) | Solid + chip — closed-means-mass is the drawn-register law; the chip makes the guess reversible |
| A-3 | Pool raster = THE drawn-register region extractor for all modes (Extrude inherits parity holes); planar arrangement post-makeathon | Yes — built, deterministic, ink-radius tolerance fits hand input |
| A-4 | Region graph computed at Done, persisted in render_config, recompute-on-mismatch (no backfill) | Yes — deterministic extractor makes the cache an optimization, not a truth source |
| A-5 | Crossing-stroke sub-regions CUT; tone brush is the sub-region mechanism | Yes — Teddy/Ink-and-Ray practice; the brush gives explicit sub-regions for free |
| A-6 | Floating tone patch = self-region; 3D read = thin slab (0.25× depth) at band hatch | Yes, slab read is an eyeball call at first build |
| A-7 | Straddle rule: split at region boundaries; ≥40px²/10% floor; area-majority per region, never average | Yes |
| A-8 | Shading precedence ladder: override > tone-fill > upload fill > inferred (extends D2-F) | Yes |
| A-9 | Conditioning: Volumetric = styled-line + flat-tone; 3D Artist = full styled render; variant + accept/reject logged | Yes — A/B the rejected raw-strokes variant on the eval fixtures before freezing |
| A-10 | Post-gen toggle drift: never auto-regenerate; explicit "Regenerate with current look" pill | Yes — I-1 + credit safety |

## Citations

**Ours:** `conversion-semantics-spec.md` (§3 vocabulary · §4 matrix · §6 · §8 · D2-F) · `strokeTo3d.ts` (:231/:254/:519/:914/:994/:1055) · `coverage.ts` (COVERAGE_BANDS · bandIndexForDarkness) · `publish.ts` (:134/:397/:425) · `contentHash.ts` · `global-toggles-and-mixed-3d.md` (D-3 · D-5 · D-7 am.3-4) · `3d-mode-controls-spec.md` (§2.4 · §2.5) · `vision-router-spec.md` (§2 · §5) · `21-research-3d-pipeline-and-style-translation.md` (§3 · §5 policy lock · §5c [G1]-[G6] · §6 · §8) · `smart-system-build-plan.md` (§4 · Phase P-3) · 18-scope-audit row 13 · SESSION-HANDOFF rounds 7-8 · red-team findings ratified in-chat 2026-06-12 (no doc on disk; `mark-intent-boundary-spec.md` sibling in flight).
**External (all previously verified in our docs except TRELLIS, verified via arXiv id):** [Igarashi, Matsuoka, Tanaka — Teddy, SIGGRAPH '99 (PDF)](https://www.cs.toronto.edu/~jacobson/seminar/igarashi-et-al-1999.pdf) · [Sýkora et al. — Ink-and-Ray, TOG 2014](https://dcgi.fel.cvut.cz/home/sykorad/ink-and-ray) · [Olsen et al. — Sketch-based modeling survey, C&G 2009 (PDF)](https://ires.cpsc.ucalgary.ca/publ/papers/2009/refs/Olsen%20et%20al.%20'09.pdf) · [SketchUp Help — Pushing and Pulling Shapes into 3D](https://help.sketchup.com/en/sketchup/pushing-and-pulling-shapes-3d) · [Xiang et al. — Structured 3D Latents for Scalable and Versatile 3D Generation (TRELLIS), arXiv:2412.01506](https://arxiv.org/abs/2412.01506) · [Dvorožňák et al. — Monster Mash, SIGGRAPH Asia 2020 (PDF)](https://dcgi.fel.cvut.cz/home/sykorad/Dvoroznak20-SA.pdf).
