# 13 — The 3D System: geometry modes, the chrome split, and the conversion brain

**In one sentence:** 3D mode is four local geometry engines (Rod / Extrude / Inflate / Solid) plus an AI hard path, drawn in a single ink-black material under one of three 3D styles (Native / Hatch / SVG-port), where a *conversion-semantics* layer decides what each region of your drawing MEANS as matter — with two separate register brains (geometry/topology for drawings, the classifier for uploads) and the 2D chrome appearing only under SVG-port.

> This page is the systems layer on top of [07-the-3d-pipeline.md](07-the-3d-pipeline.md). Page 07 is the *pipeline* (easy path / hard path / caching / the wedge); this page is the *control model, the chrome rules, the material policy, and the conversion brain* that landed in rounds 7–8. Read 07 first.

---

## Plain language

### Three picks, and the chrome-split rule

3D mode is **three independent picks**, the same separation C4D draws between modeling and shading:

1. **Geometry mode** (a dropdown): `Auto / Rod / Extrude / Inflate / Solid` — what MESH gets built. "Auto" is the dropdown's *default value* (the shape decides: open→rod, closed→extrude), not a hidden rule; set it to Rod and everything is rods.
2. **Per-geometry params** (sliders that swap with the mode): Rod's radius/caps/joint-blobs, Extrude's width/depth, Inflate's base/tip/pressure/puff, Solid's ink-radius/depth/holes. Full sets, never trimmed (6+ ticks each).
3. **3D Style** (a second dropdown): `Native / Hatch / SVG-port` — HOW the mesh is drawn.

The **chrome-split rule** (Sebs round 7, ratified) is the headline UI lock: *in 3D mode the right panel shows 3D controls ONLY.* No more 2D SVG chrome sitting in 3D doing nothing (that read as broken). The 2D chrome reappears in exactly one place — **under the SVG-port style**, where it drives the ported treatment. So:

| 3D Style | What it is | What the panel shows under it |
|---|---|---|
| **Native** | Lit material — the clay/ink object read | A material sub-dropdown (Ink / Soft Gel / Matte Clay / …) — surface qualities only |
| **Hatch** | Procedural screen-space hachure, 8-band luminance quantization | The Shading sliders — the SAME state the 2D pen uses (one math, two renderers) |
| **SVG-port** | Mesh silhouette edges → screen-projected → run through the 2D pipeline | **The entire 2D chrome mounts here** — the chrome-split rule's only 2D appearance in 3D |

The 2D panel never renders in 3D mode (except under SVG-port); the 3D panel never renders in 2D mode. Precedent: Blender's per-viewport shading + Spline's per-object-vs-scene scope split.

### The four local geometry engines

These are the deterministic, in-browser, no-network engines (page 07 covers the C4D analogies; here are their *controls*, ported verbatim from Free Stroke — Sebs's own tuned taxonomy):

- **Rod** (open strokes — "your line IS the object"): a `TubeGeometry` swept along your line. Controls: **Radius** (tube thickness), **End caps** (rounded ink tip), **Joint blobs** (spheres filling the pinch crease at sharp corners), **Joint sensitivity** (the corner angle that earns a blob).
- **Extrude** (closed shapes — cookie-cutter slab): the FS *perceptual* width system ported verbatim — **Width** on a quadratic perceptual map (`floor + (ceil−floor)·t²`, so mid-slider = the tuned clean default, only the last ~25% reaches chunky), **Depth** as a width-relative multiplier (decoupled — depth never bloats XY), **Bevel** toggle.
- **Inflate** (puffed balloon, swept-capsule heuristic — NOT Teddy): **Base radius**, **Tip radius**, **Pressure influence** (stylus pressure scales local radius — the one sanctioned place the hand survives into the *volume*), and **Puff** (one slider driving five tuned curves — Z-aspect plus the FS feel bundle).
- **Solid** (multi-stroke fused mass — raster → marching-squares → extrude): **Ink radius**, **Depth**, **Holes** toggle (donut stays a donut).

Unit lock: Free Stroke maps the longest canvas side → 3 world units; we map 800px → 8 units (`WORLD_SCALE 0.01`), so absolute FS lengths port ×8/3 and radius-relative factors port verbatim.

### Ink-black material policy

The locked color rule (Sebs 2026-06-12): **"Everything should just be a black color regardless of material."** All four local modes, AI meshes, and the Hatch ink render in ONE ink color — a warm-graphite near-black (default ≈ `#2A2622`, range `#121110`–`#383632`). Material presets differ ONLY in *surface qualities* (roughness, metalness, sheen, clearcoat) — never in hue or value. Any Free Stroke preset that shipped with a brand color (charcoal `#26262b`, etc.) ports its surface parameters and gets **recolored to the ink now**.

Why: this generalizes the palette rule (`feedback_palette_overrides_ink_not_paper`) — color systems remap INK only, never paper. In 3D, the object material is the ink register; desk paper + lighting is the paper register. **Color never touches user art:** a colored source drawing still converts to graphite mass, and the color lives untouched in the record (nothing is baked; the 2D life keeps it). Color enters the app only through the identity pass's chrome inks (riso blue/orange on UI), never on forms.

(There was a real bug here: the old fallback `#5A5043` sat at the W1 *caption* ink tier, which is why objects read light/bronze — "clay tan." The fix moves it into the dark-ink span. Keep the paper-tinted sheen `#d8c9ae` — sheen, not base lightness, carries curvature on white.)

### The conversion-semantics layer — "what does this region MEAN as matter?"

Here's the problem Sebs hit (the *arrow repro*): draw an arrow as an outline, flip to Extrude, and you get a solid arrow-shaped slab — the whole interior fills. Root cause: the only signal the 3D conversion consulted was "is this stroke closed?" — and `THREE.Shape` silhouette-fills anything closed by definition. Nothing decided what should stay *line-work*, what an enclosed-but-unshaded region *means* (a hole? air? a face?), or what 2D shading means in 3D.

**Phase D2 — Conversion Semantics — is the layer that asks.** It's the same `signals → classify → treatment → render` pipeline, third instance (after Phase D engine-routing and Phase P placement), with a conversion-treatment vocabulary:

| Treatment | Meaning in matter |
|---|---|
| `solid` | volumetric mass |
| `shell` | the OUTLINE is the object; interior is air |
| `line-rod` | the stroke itself is the object (an ink worm) |
| `hole` | subtract from the containing solid (donut) |
| `air` | enclosed but means nothing — render nothing |
| `surface-hatch(band)` | the darkness band drives hatch density on the region's surface |
| `relief(band)` | the band offsets extrusion depth (opt-in secondary axis) |

The arrow, end-to-end: the outline classifies as line-work → `shell`/`line-rod` → a wall/ring of rods, never a slab. The arrowhead's inked notch → a small `solid` slab. No more auto-slab.

### Two register brains — the load-bearing red-team finding

The first draft of D2 said "consume the existing classifier for every region." The adversarial review **confirmed live on the real desk** that this is wrong: drawn strokes are `fill="none"` polylines, so the classifier returns `paper@0.9` on *every* drawn region (23/23 traced) — it contributes zero useful bits for drawings (it was tuned on the upload catalog). Consuming it verbatim would render every drawn doodle as `air` — nothing — in 3D.

So the ratified architecture is **one record, one treatment vocabulary, TWO register brains:**

- **Drawn register** (stroke-only records): **geometry/topology is the brain.** Closed → `solid` (the heart slab is sacred — the Teddy/SketchUp/Spline convention); open → `line-rod`; open-ish → `line-rod` + a "treated as closed?" chip; a nested band-0 loop at odd containment depth → `hole` (donut rule). The classifier is *never* invoked on drawn strokes.
- **Upload register:** **the classifier IS the brain** — the 9-role table applies as written, golden-gated.

Both brains emit into the *same* treatment vocabulary and the *same* decision log. The classifier `paper` misfire is a real bug filed separately (fixing it flips labels across the 197-shape catalog → needs a golden re-bless ceremony, not a quick patch).

The three canonical fixtures the conversion brain must get right (the mark-intent battery's headliners):
- **Arrow** (open-ish outline) → structure → line-rod + closure chip; NEVER a slab.
- **Cat-face with scribbled eyes** → head is structure→solid; the scribbled eyes are *fill-intent* → two clean dark patches, **zero per-stroke blobs**.
- **Two-arc circle** → a *composite loop* (two strokes whose endpoints merge into one cycle) → structure→solid, and a region now exists for later containment.

### The drawn-register intent layer — three intents

Closure alone can't answer "is this mark a *thing*, a *tone*, or a *fill*?" The mark-intent boundary spec adds a small stroke-feature taxonomy (computed from the `[x,y,pressure]` arrays, never the classifier):

| Intent | Meaning | Fate |
|---|---|---|
| `structure` | the stroke IS the form (outline, limb, arrow shaft) | geometry: closed→slab, open→rod |
| `shading-gesture` | the marks declare TONE on a region (scribble, hatching) | no geometry of its own; emits a band onto the container; marks kept in 2D |
| `fill-intent` | the marks declare a SOLID area (spiral-fill, blacked-in eye) | the marks' envelope becomes the region; one clean solid mass — never per-stroke blobs |

The invariant: **"preserve the marks, infer the meaning."** Intent assigns metadata (bands, geometry contribution); your actual ink is never redrawn without an explicit conversion act. A 10-fixture golden battery guards it (the arrow, the cat-face, the two-arc circle, a deliberate spiral that must STAY solid, hand-hatching that must NOT become 50 tubes, plus adversarial high-energy marks — lightning, cursive — that must stay structure).

### 2D shading → 3D: hatch, not relief

A dark/hachured region maps to **`surface-hatch(band)`** — coverage band → hatch density on that region's surface — as the *primary* mapping, with relief (band → depth) as an opt-in secondary slider. Why hatch wins: it preserves the darkness band *exactly* (the 3D shader quantizes with the same 8 numbers the 2D renderer uses — Praun TAM banding), so the round-trip is band-exact; relief preserves it only via lighting, which is lossy and viewpoint-dependent. (And darker-*material* is rejected because the material is policy-fixed monochrome ink — per-region greys would fork the ink and kill hatch contrast.)

### AI-as-default coexisting with the local hard path

Round-8 lock: when available, the **AI hard path** (vision-LLM router → Tripo/TRELLIS GLB) becomes the **DEFAULT 3D**; the local geometry modes stay as options + the fallback ladder (AI → local Auto → honest paper card; never skip, never stub). The division of labor in one sentence: **on the local rungs, D2 decides what each region IS as matter; on the AI rung, D2 decides what the model SEES** — same record, same vocabulary, same receipts, two places the brain plugs in.

For the AI path, region semantics move *upstream* (you can't edit an opaque GLB's regions): they shape the **conditioning image** (strokes rendered through the pen + tone bands rasterized as flat greys; hachure marks omitted so dense grammars don't read as bumpy surface noise) and the **router prompt** (region-graph stats — closure states, containment, band histogram). On the GLB itself there is **zero per-region control** — Regenerate is the only lever, honestly labeled.

---

## The design — why it's built this way

**Why the chrome split.** The 2D panel sitting inert in 3D mode read as broken to Sebs. The split makes scope visible: 3D controls for 3D, 2D controls only where they actually drive something (SVG-port). It mirrors the locked SVG-vs-3D separate-dropdowns rule (`project_f3_shading_port_to_3d`) at the chrome level — a combined enum would force every style to work in both renderers (most can't).

**Why ink-black across all materials.** A makeathon-week call for coherence and craft: a desk of multicolored 3D blobs would read as a toy; a desk of warm-graphite forms with material *variety in surface* reads as a sketchbook brought into three dimensions. It also keeps the palette rule honest — color is an ink-register concern, and forms are ink. Recoloring now (not at the identity pass) resolves the "clay tan" bug immediately.

**Why two register brains instead of one classifier.** Because the live trace proved one classifier can't serve both inputs: drawn strokes carry none of the stylistic signals the rules vote on, so it misfires `paper` on everything. Forcing one brain would either render drawings as nothing (consume-verbatim) or require retuning the classifier on drawn input (a golden-teardown mid-makeathon). Two brains, one vocabulary, is the smallest honest blast radius — and it respects the sketch-modeling canon (closed-loop-becomes-volume) that the geometry brain encodes natively.

**Why the heart stays a slab.** The founding convention of sketch-based modeling (Teddy inflates closed strokes only; SketchUp Push/Pull operates on faces only; Spline extrudes shapes) is "closed means mass." The red-team's worry: a naive fix that made every closed drawn loop a *wire ring* would kill the chunky-slab default the canon demands. So the drawn register's law is closed→solid, and `shell` is reachable only by toggle/override — never the drawn default.

**Why 3-state closure replaces the boolean.** The arrow-slab root cause is the grabby threshold `max(24px, 8% diag)` calling an open-ish outline "closed." The fix keeps the topology brain but makes the guess *honest*: tight gap → silent slab (the heart), ambiguous gap → slab + a "treated as closed?" chip (one tap to rod, logged as a correction), wide gap → rod. The thresholds are calibration constants, swept against fixtures + the live decision log before freezing.

**Why hatch over relief for shading.** I-2 round-trip invariance: source darkness owns per-region perceptual identity, and the band must survive a 3D→2D round-trip. Only hatching guarantees that (same 8 numbers both renderers). Relief is expressive but lossy — so it ships as an opt-in secondary axis with a polarity toggle, never the silent default. (Printmaking raises ink; engraving recesses it — both real conventions, so polarity is a user choice, not a guess.)

**Why mark grammar does NOT convert to geometry.** Multi-stroke, pen-tip, and wobble are *style*, and geometry is style-independent (a chair is a chair whether sketched rough or clean). Pen character carries via the Hatch uniforms and the SVG-port style layer instead. Multi-stroke as N parallel tubes was rejected: it triples mesh cost, breaks physics hulls, and duplicates what SVG-port does honestly at the style layer. The one sanctioned geometry exception is pressure→inflate-radius (already shipped).

**Why never trim params, never stub.** `feedback_more_toggle_options_better` (full per-mode sets, 6+ ticks) + `feedback_copy_implementation_before_tweaking_numbers` (if Inflate's visual character doesn't match FS after calibration, port FS's loft function — don't tweak constants) + `project_f3_styles_must_all_be_real` (a dropdown option ships only when real — `native-edges`/`wireframe`/`halftone` and FS's dither/ASCII/texture families are real *candidates* but stay off the menu until built).

---

## Technical

All paths under `/Users/sebs/Desktop/Projects/desk-doodles/`. The 3D conversion engines wired onto `/canvas` in wave-5 (`aad27b4`); the round-6 batch shipped the 3D look fix + audit sweep (`37b9bcb`); the ink-black policy ratified in `c22dbbe`. **The chrome split, per-mode param sliders, SVG-port style, and the tone brush are round-7 SPEC, not yet built.** D2 + the two-register architecture is spec'd (`conversion-semantics-spec.md` + addendum + `mark-intent-boundary-spec.md`), with the smallest-blast-radius tonight cut named.

### Current 3D conversion (live on /canvas)

- `src/app/lib/geometry3d/strokeTo3d.ts` — `isClosedStroke` (`:231`, the grabby `max(24px, 8% diag)` threshold = arrow-slab root cause #1), `pickGeometryMode`/`resolveGeometryMode` (`:254`), `buildExtrudeGeometry` (`:519`, `THREE.Shape` silhouette-fills), Solid pool raster (`:994-1127`), depth-parity containment walk (`:1055-1107`, the donut machinery D2 promotes to the shared region model), deterministic saddle resolution (`:914-921`).
- `src/app/components/canvas3d/Stroke3DScene.tsx` — the R3F scene; `INK_SOFT_FALLBACK = '#5A5043'` (`:~43`, the out-of-register "clay tan" value the ink-black policy fixes).
- `src/app/lib/smart/coverage.ts` — `COVERAGE_BANDS`, `bandIndexForDarkness`, `bandTableForUniforms()` — the 8-band table shared by the 2D density math and the 3D Hatch shader uniforms (one math, two renderers).

### Per-mode param sets (round-7 build spec, `3d-mode-controls-spec.md` §2)

Provenance: Free Stroke origin/main `lib/geometry-engines.ts` + `lib/style-system.ts`, read via `git show` (local checkout stale). Examples — Extrude Width `t∈0–1` quadratic map (FS `mapExtrudeWidthSlider`, exp 2.0, floor 0.020/ceil 0.080 → DD ×8/3); Inflate Puff drives aspectZ 0.34→1.55 + four derived curves (FS `inflateBuildStaticGeometries`); Rod radius 0.010–0.128 world (FS `TUBE_RADIUS 0.012` ×8/3 = 0.032 default). Constants already ported + provenance-commented in `strokeTo3d.ts` header.

### The chrome split (round-7 build spec, `3d-mode-controls-spec.md` §5)

Right panel when mode=3D, reusing `CollapsiblePanel`/`usePanelOpen` (keys `c3d.cluster.*`) + `chromeStyles` pills: MODE pill pair → GEOMETRY cluster (dropdown + active mode's §2 set) → 3D STYLE cluster (dropdown + active style's set; under SVG-port the full `SmartHachureChrome` mounts HERE) → (round-8 reserved AI engine row, hidden until real).

### Conversion semantics (D2 — spec, not built)

- `src/app/lib/smart/conversionMap.ts` (NEW, pure) — the role/topology → treatment lookup; logs `{surface:'conversion', regionPath, role, band, treatment, firedRules}` to `window.__dd_decisionLog`. NOT a second classifier — both registers read the same treatment vocabulary.
- `src/app/lib/smart/markIntent.ts` (NEW, pure, node-runnable) — the drawn-register 3-intent brain; logs `{surface:'mark-intent', clusterId, strokeIds, rawScore, margin, firedRules}`.
- Tonight's smallest cut (red-team item 6): 3-state closure + donut-parity holes + `conversionMap.ts` + decision-log receipts + the §6 honesty toggles. **No classifier contact, no golden re-bless.**

### Material policy

Single ink color across all presets; presets vary surface params only. Default ≈ `#2A2622`, range `#121110`–`#383632` warm-graphite axis; sheen `#d8c9ae` kept. Free Stroke preset colors port surface params, recolored to ink (`c22dbbe`).

---

## Connections

- **→ [07-the-3d-pipeline.md](07-the-3d-pipeline.md)** — the pipeline this page controls: easy-path geometry, hard-path AI, caching, the wedge. Page 07 = mechanism; this page = control model + chrome + conversion brain. Edge: *the systems layer over the pipeline*.
- **→ [11-the-pen-model.md](11-the-pen-model.md)** — the mode flip the global lens sweeps; "convert FROM THE RECORD, never the rendered look." Edge: *mode is the render-stage renderer-swap the pen model formalizes*.
- **→ [12-the-creation-loop.md](12-the-creation-loop.md)** — the conversion reads the *strokes* that loop retains; the tone brush is the explicit darkness register that beats inferred bands. Edge: *retained strokes + tone bands are the conversion's input*.
- **→ [03-the-smart-system.md](03-the-smart-system.md)** — D2 is the same `signals → classify → treatment → render` engine, third decision surface; the UPLOAD register uses that page's classifier verbatim; the DRAWN register is a separate geometry brain. Edge: *third instance of the one engine, with a register split*.
- **→ [06-tone-and-shading.md](06-tone-and-shading.md)** — `surface-hatch(band)` uses the same 8-band currency; tone is the cross-dimensional value preserved into 3D. Edge: *spends the same darkness currency in the third dimension*.
- **→ [15-the-smart-ml-ladder.md](15-the-smart-ml-ladder.md)** — every conversion/intent decision logs a receipt; the AI router is a rented model at a pipeline stage (not the shipping smart system's ML). Edge: *conversion decisions feed the receipts ladder*.
- **Doc edges:** `docs/design/3d-mode-controls-spec.md` (per-mode params + chrome split + ink-black policy) · `docs/design/conversion-semantics-spec.md` (D2 vocabulary + two-register red-team amendment) · `docs/design/conversion-semantics-addendum.md` (region formation, shading lifecycle, hard-path conditioning) · `docs/design/mark-intent-boundary-spec.md` (the 3-intent drawn brain + 10-fixture battery) · `docs/research/21-research-3d-pipeline-and-style-translation.md` (the pipeline contract).

---

## Honest status

**ALL of 3D is recent and partly still spec. The shipping smart system everywhere is a RULE ENGINE.** Precisely:

### Real in code today (2026-06-12)

| What | Status |
|---|---|
| Four local geometry engines (Rod/Extrude/Inflate/Solid) wired on `/canvas` | REAL (`aad27b4` wave-5; round-6 look fix `37b9bcb`) — but with the arrow-slab grabby-closure bug and the out-of-register ink fallback still in the tree until the round-7 fixes land |
| `coverage.ts` 8-band table feeding 2D density (Phase A) | REAL (`aad27b4`); the 3D Hatch shader consuming the same uniforms is M8, not built |
| Ink-black material policy | RATIFIED (`c22dbbe`); the `INK_SOFT_FALLBACK` recolor is the corrective edit, verify it landed |
| Decision-log infra (`window.__dd_decisionLog`) | REAL for the classifier; the conversion/mark-intent surfaces are NOT yet logging (gap G-1) |

### Planned / spec only (do NOT describe as shipped)

- **The chrome split** (3D-only panel; SVG-port mounts 2D chrome) — round-7 build spec, not built. Today the 2D panel still shows in 3D doing nothing (the "reads broken" state the split fixes).
- **Per-mode param sliders** (Rod/Extrude/Inflate/Solid full sets) — round-7 spec; constants ported but not surfaced as sliders.
- **3D Style dropdown (Native/Hatch/SVG-port)** + Native's material sub-dropdown — round-7 spec. SVG-port = M8, not built.
- **Phase D2 conversion semantics** — spec'd (vocabulary, two-register architecture, 3-state closure, donut holes, `conversionMap.ts`/`markIntent.ts`). **Zero code.** The arrow still slabs until the tonight-cut lands.
- **The 3-intent drawn-register brain + 10-fixture golden battery** — spec'd, not built.
- **Tone-fill brush → `surface-hatch(band)`** — round-7, the only honest drawn-input shading channel; not built (inferred-from-scribble fallback also not built).
- **AI hard path as default 3D** + router + Tripo/TRELLIS + GLB loading — round-8 / Day-13 tier; research-locked, fal.ai key exists with no credits, Tripo key needs rotation. Zero code.
- **The classifier `paper@0.9` misfire fix** — filed bug; needs a golden re-bless, deliberately NOT done in the tonight cut.

If a future session finds this page claiming a built geometry-control panel or a working conversion brain, re-verify against `SESSION-HANDOFF.md` and the round-7/8 commit trail before trusting it.
