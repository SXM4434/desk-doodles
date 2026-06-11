# Everything affects everything: the interconnection graph

**In one sentence:** Desk Doodles' toggles are not a flat list of independent sliders — they are nodes in a multi-dimensional, bidirectional knowledge graph where every edge (one toggle influencing another) is explicitly declared, documented, and enforced, so the system behaves like one living instrument instead of twenty disconnected knobs.

---

## Plain language

### Your mental model, verbatim

This is your framing, and it is the frame the whole system is built on:

> "multi-dimensional bidirectional interconnected, like a 3D-type knowledge graph"

Unpack each word:

- **Nodes** = toggles (wobble, simplification, fillStyle…), clusters (the layer-groups those toggles live in), and signals (what the system reads out of the source drawing — darkness, area, anchor density).
- **Edges** = *sanctioned influences*. "Sanctioned" is load-bearing: an edge exists only if it was deliberately declared and written down. Wobble is *allowed* to scale every shape's jitter. The layer nudge is *not allowed* to move layers when sketchingStyle owns the transform. Undeclared coupling is a bug, even when it accidentally looks good.
- **Multi-dimensional** = the graph isn't a chain. One slider can touch geometry, dispatch, shading, and the future classifier at once — different *kinds* of edges, not just more of them.
- **Bidirectional** = influence flows both ways. Signals flow *forward* (source drawing → classification → render choices), and user choices flow *backward* as signals (your fillStyle pick, your simplification setting — these are statements of intent the smart layer reads). More on the one place this is dangerous below.

Think of it like a node editor — Xpresso in C4D, or a Substance Designer graph. Every wire is visible. You can trace any output back through every node that touched it. Nobody gets to run an invisible wire behind the canvas.

### The clusters: layer groups with one master each

The ~30 modifiers don't float free — they partition into **clusters**, the way you'd organize a heavy Photoshop file into layer groups, each group with one master control (like group opacity). The clusters share render code, which is *why* they're grouped: members of a cluster literally funnel through the same functions.

| # | Cluster | Master | Members | Plain question it answers | Your anchor |
|---|---|---|---|---|---|
| **0** | Geometry / Resampling *(planned — on paper)* | simplification | simplification (future: live streamline, resample density) | "How many anchor points does the path keep?" | The mesh itself — retopo before any material is applied |
| 1 | Multi-Stroke | wobble | wobble · strokeCount · strokeWidth · endpointBehavior · sketchingStyle | "Where does the stroke's path go, and how many passes?" | The base sketch layer — pencil construction lines |
| 2 | Pen Tip | penTip | penTip · strokeWidth (shared) · texture | "What implement is drawing?" | Brush preset — swaps the whole tip engine |
| 3 | Shading | fillStyle | fillStyle · hachureGap · hachureAngle · fillDensity · fillOpacity · dot-params | "How do tonal regions get marked?" | The fill/AO layer — this is Smart Hachure's home |
| 4 | Surface Texture | texture | texture · textureIntensity · roughness · blur · bleed · grain · smudge · pressureVariance | "What does the substrate do to the ink?" | A filter/adjustment layer clipped on top of everything below |
| 5 | Color / Palette | inkIntensity | strokePalette · fillPalette · inkIntensity | "What tier of W1 ink?" | The color-grade pass — mostly orthogonal to the rest |

Pipeline order matters and reads exactly like a Painter layer stack, bottom to top: **Cluster 0 (geometry) → renderer dispatch → Cluster 1 (strokes) → Cluster 3 (fills) → Cluster 4 (surface filter wraps the whole group) → Cluster 5 (color)**. Cluster 4 is literally implemented as an SVG filter wrapping the geometry group after Clusters 1–3 render — same idea as an adjustment layer at the top of the stack affecting everything beneath it.

Cluster 0 is the newest idea (from the simplification research) and the most upstream: it changes the *mesh* every other cluster paints on. Change the anchor count and you haven't adjusted a material — you've retopologized the model under all the materials.

### The matrix: a UV unwrap of the graph

A 3D graph is hard to look at, so doc 19 serializes it the way you'd UV-unwrap a model: flatten it into a 2D adjacency matrix. Rows and columns are modifiers; each cell says whether row-A drives column-B directly (`→`), jointly through a third variable (`*`), or not at all (`—`). The matrix in `19-research-cross-axis-interconnection.md` §C is **the same object as the graph** — just laid out flat so you can audit every cell, the way an unwrapped UV sheet is the same surface as the model. The simplification research (doc 22 §3.1) added a new row for ε with a fourth symbol, `⚠`, for *discontinuous* edges — places where sliding smoothly makes the output **snap** (renderer identity flips).

### Why bidirectionality matters — and where it's locked

Forward direction: the signal extractor reads the source drawing the way photogrammetry reads photos — darkness, geometry, topology come *out of the source*, and the classifier decides treatment from them. Backward direction: your choices are themselves signals. Your fillStyle pick tells the system which mark grammar you want. Your simplification setting says "I want this looser." The smart layer is supposed to read those.

The danger is when forward and backward meet in a cycle. If the classifier reads signals from geometry that the user's simplification slider already modified, you get: classifier reads simplified shape → picks treatment → user nudges slider → signals change → treatment flips → **style roulette on a "detail" slider**. Node editors refuse circular wiring for exactly this reason. The system's answer is the **S11 feedback-loop lock**: classifier signals come from RAW committed points (or geometry at the canonical ε = 3.0), *never* from user-ε geometry. The user's ε still enters the classifier — but as an *input signal* (a statement of intent), not as a transform applied before signal extraction. The graph stays bidirectional but acyclic.

The companion fix is the **dispatch freeze**, and it is exactly your baking-vs-live-material instinct: the polygonal-vs-curve renderer decision gets *baked* once at canonical ε = 3.0 (like baking a normal map from the high-poly source), while anchor density renders *live* at the user's ε. Identity is baked; detail is live.

---

## The design — why it's built this way

**Why clusters instead of a flat slider list.** Because the flat list was tried and it failed — this is documented history, not theory. The playground (the original Hero-lab artifact system) was ~9 modifiers that all funneled through the same six functions, so interactions came for free. The first rebuild flattened that into ~20 *independent* sliders and lost the wobble master dial, the per-shape sacred ratios, and several pair-wise interactions — doc 19's whole §B is the autopsy. The lesson became invariant I-13: group by shared render path, give each cluster a master, and have the intelligent layer consume **cluster-level features**, not 30 raw values. Fewer, more stable dimensions for the classifier; one master dial per group for the human.

**Why edges must be *sanctioned*, not emergent.** Two regressions taught this. `stableLayerNudge` was added to make multi-stroke visible at low wobble — reasonable alone — but it applied its offset even when sketchingStyle owned the layer transform, so the two fought (doc 19 §B.3). The fix became invariant I-14: *sketchingStyle owns layer transform exclusively*. That's an edge being revoked, in writing. Same with kink: the doc-comment promised a randomized-angle kink that was never implemented; for months kink rendered identically to protrude — a node in the UI with no edges behind it. The Day 9 overhaul made it real (random-angle push at every anchor) and it got a formal KEEP ruling (R-1 in the locked model). Rule extracted from both: a toggle either has declared, real edges, or it doesn't ship.

**Why the registration rule.** Every new toggle must declare its edges *on arrival* — before code. Doc 22 is the template: the simplification slider arrived with a 14-edge declaration (S1–S14), a cluster placement (new Cluster 0), a discontinuity audit (the `⚠` cells), and explicit lock candidates — all *before* the build is allowed to start (the doc literally gates pending decision ⑤). The rejected alternative was "ship the slider, discover the edges via bug reports" — which is how the rebuild regressions happened in the first place. Registration cost: one research doc. Non-registration cost: a 681-pattern sweep that can no longer tell you which axis broke.

**Why the dispatch freeze beat its alternatives.** When the ε slider crosses the 8-anchor cap, the renderer would flip from Catmull-Rom to straight-bezier *and* silently cut wobble amplitude by 60% — an identity change riding a detail slider. Three options were evaluated (doc 22 §4.5): a hysteresis band around 8 (rejected: stateful, order-dependent, untestable in sweeps), scaling the cap with ε (rejected: just relocates the cliff), and classifying at canonical ε while rendering at user ε (chosen: identity becomes a property of the *source*, which is the spirit of invariant I-2 — source owns perceptual identity).

**Why bidirectional-but-acyclic.** Full bidirectionality without the S11 lock gives you the feedback loop above. No bidirectionality at all throws away the most valuable signals the future smart layer has — the user's own choices. The lock keeps both: signals flow forward from frozen sources, intent flows backward as data.

---

## Technical

### The graph's documents (the serialized views)

| Artifact | Path | What it holds |
|---|---|---|
| The matrix (clusters 1–5) | `docs/locked-refs/F3-smart-hachure-system/19-research-cross-axis-interconnection.md` §C (13×13 matrix), §D (N-way compounds), §E (cluster taxonomy) | The original serialized graph |
| The contract | `docs/locked-refs/F3-smart-hachure-system/09-LOCKED-MODEL.md` §2, I-13 | Cluster table + the pair-wise/N-way interactions **wired in code** tables; I-11 (wobble master), I-12 (one pipeline), I-14 (layer-transform ownership) |
| The Cluster 0 extension | `docs/research/22-research-simplification-toggle.md` §3 (edges S1–S14), §3.3 (cluster placement), §4.5 (dispatch freeze) | The newest row of the matrix + the registration-rule template |

### The graph's nodes in code

- **Toggle state (every node's value):** `F3ModifiersState` at `src/app/state/F3RoughModifiersContext.tsx:61` — ~30 fields with per-field doc comments naming their cluster role (e.g. wobble's I-11 comment at `:63-68`).
- **Cluster grouping in chrome:** `src/app/components/chrome/SmartHachureChrome.tsx` — sections carry their cluster numbers: Multi-stroke `:186` ("cluster 1"), Shading `:308` ("cluster 3"), Surface texture `:337` ("cluster 4"), Color/palette `:382` ("cluster 5"). Pen tip (Cluster 2's master) currently renders *inside* the Multi-stroke section at `:241-266` — no dedicated Cluster 2 section.
- **Signals (the forward-flowing nodes):** `extractSignals` at `src/app/lib/smartHachure/signals.ts:33`, `extractAllSignals` at `:341`.
- **Classifier (the rule engine — see Honest status):** `classify` at `src/app/lib/smartHachure/classifier.ts:31`, `ruleEngineProvider` at `:315`, `RULE_REGISTRY` at `:354`. Treatment selection: `selectTreatment` at `src/app/lib/smartHachure/techniqueMap.ts:45`. Pipeline entry: `renderSmartHachure` at `src/app/lib/smartHachure/index.ts:61`.

### Five concrete edge walks (trace the wires)

**Walk 1 — simplification → anchor count → renderer dispatch → wobble amplitude (edge S1, the `⚠` headline).**
In `src/app/components/canvas/SvgStyleTransform.tsx`: `rdp()` (`:546`) simplifies the committed polyline at `RDP_EPSILON = 3.0` (`:1632`), gated by `RDP_VERTEX_THRESHOLD = 15` (`:1705`). The surviving anchor count hits `POLY_ANCHOR_CAP = 8` (`:1791`): ≤8 anchors → `straightBezierPath` (`:706`) **with `wobbleAmp * 0.4`** (`:1795`); 9+ → `catmullRomPath` (`:745`) at full amplitude. So a future ε slider sweeping a heart from 9 anchors to 8 would flip the renderer AND cut wobble 60% in one tick — unless the dispatch freeze (doc 22 §4.5) bakes the decision at canonical ε. Four nodes, three edges, one discontinuity.

**Walk 2 — wobble → sacred ratios → corner fan (the Cluster 1 compound).**
Wobble multiplies the per-shape calibrated bases (`HAND_FEEL_BASE`: rect 2.4 / oval 2.4 / diamond 2.0 / line 1.4 / orthogonal 1.6 — I-11) — one dial, ratios preserved, like exposure in linear light scaling all channels without shifting their balance. Then the N-way compound (09-LOCKED-MODEL §I-13, "strokeCount × sketchingStyle × endpointBehavior"): protrude pushes each corner radially outward → loose-overlap shifts the endpoint *further* along the segment from the already-protruded position → each extra layer extends further → a **fan of overshoots at every corner**, growing per layer. No single toggle owns that fan; it exists only in the edges.

**Walk 3 — source darkness → identity band → user slider (the bidirectional edge, both directions at once).**
Forward: `extractSignals` reads darkness → I-2 assigns an identity band (paper/light/mid/dark/near-black) → the band bounds what any slider may do. Backward: the user's fillStyle pick flows into the render as the *narrow override* at `src/app/lib/smartHachure/index.ts:164-185` — the user swaps WHICH mark grammar fills the regions the classifier chose to fill, but the classifier keeps the "fillable or not" call and the tiny-area clamp (`signals.area < 40` at `:177`) stays classifier-owned. User intent and source identity meet at a declared boundary instead of overwriting each other.

**Walk 4 — ε → segment length → jaggedness character (edge S3).**
`injectJaggedness` (`SvgStyleTransform.tsx:325`) inserts perpendicular zigzag intermediates *between consecutive points* — so splinter density is proportional to anchor density. High ε → few long segments → the same jaggedness value reads as occasional long spikes; low ε → fuzz. The lesson for the smart layer: the perceptual invariant is **splinters per 100px of arc length**, not the raw slider value. A toggle's *meaning* can depend on another toggle's setting — that's an edge, and the audit dataset has to record both ends.

**Walk 5 — ε ↔ Phase C signals (edge S11, the locked cycle).**
Input complexity (vertex density, corner count, sub-path count) is exactly the signal family the planned Phase C auto-pick consumes. If those signals were computed from post-user-ε geometry, the graph gains a cycle (the style-roulette loop). The S11 lock breaks it: signals from RAW points or canonical-ε geometry only; user ε enters as an *input* signal. Dataset corollary: the 197-shape /audit catalog and the 681-pattern sweep were captured at ε = 3.0 — every future labeled sample must record its ε or the training set silently mixes geometry regimes.

### The registration rule (mechanics)

Every new toggle, on arrival, must declare — *before build*:

1. **Cluster placement** (or justify a new cluster, as simplification did with Cluster 0 — doc 22 §3.3).
2. **Its matrix row** — every `→` / `★` / `⚠` / `—` against existing nodes (doc 22 §3.1-3.2 is the worked example).
3. **Discontinuities** (`⚠` cells) with a mitigation (dispatch freeze, floors, clamps — §4.5/§4.6).
4. **Smart-layer notes** — which signals it perturbs, whether it's classifier-input or classifier-output, any lock candidates (S11-style).
5. **Regression gates** — what must be pixel-identical at the default tick (doc 22 §4.9: s = 1.0 ≡ today's ε = 3.0, byte-identical audit shapes).

Doc 19 §F.5's `bannedCombinations` (preset bans sourced from the matrix's worst cells) is the planned enforcement hook for edges that should *never* co-fire.

---

## Connections

This page is the map; these are the territories (edges of the knowledge graph itself):

- **→ the pipeline page** (signals → classify → select treatment → render): the interconnection graph is *what the classifier reads* — I-13 says it consumes cluster-level features, so the cluster table here defines that page's input vocabulary. Source: `docs/locked-refs/F3-smart-hachure-system/07-architecture-ml-pipeline.md`.
- **→ the locked-model / invariants page**: I-11 (wobble master), I-12 (one render pipeline), I-13 (cluster features), I-14 (layer-transform ownership) are this graph's constitution — each invariant is an edge grant or an edge revocation. Source: `09-LOCKED-MODEL.md` §2.
- **→ the simplification / Cluster 0 page**: doc 22 is both the newest subgraph (S1–S14) and the registration-rule template every future toggle follows. Source: `docs/research/22-research-simplification-toggle.md`.
- **→ the drawn-canvas geometry page** (RDP, dispatch, wobble field, endpoint behaviors): walks 1, 4 happen entirely inside `SvgStyleTransform.tsx` — that page owns the per-function detail this page only points at.
- **→ the audit-as-dataset page**: every catalogued breakage is a labeled data point, and per edge S11 every artifact must now record its ε — the graph dictates the dataset schema. Memory: `docs/memory/` mirror of `project_smart_layer_foundation_via_audit`.
- **→ the 3D pipeline page**: edge S12 — simplified anchors must feed Rod/Extrude so the hand survives the mode flip; the graph extends across the 2D/3D boundary, it doesn't stop at SVG. Source: `docs/research/21-research-3d-pipeline-and-style-translation.md`.
- **→ the chrome/controls page**: cluster taxonomy IS the chrome's information architecture (per-cluster collapsible sections, masters at top — I-13's chrome clause).

---

## Honest status

The shipping smart system is a **RULE ENGINE** — `ruleEngineProvider` walking `RULE_REGISTRY` in `classifier.ts`. There is no ML anywhere in the product today. Everything below is labeled accordingly.

### EXISTS in code today

| Thing | Where | Note |
|---|---|---|
| Cluster taxonomy (1–5) locked + chrome grouped by cluster | 09-LOCKED-MODEL §I-13 · `SmartHachureChrome.tsx:186/:308/:337/:382` | Per-cluster collapse persisted via `shc.cluster.*` keys |
| Wobble as master dial with sacred per-shape ratios | `F3RoughModifiersContext.tsx:63-68` (I-11) | The doc-19 B.1 regression, fixed |
| Pair-wise + N-way edges wired | tables in 09-LOCKED-MODEL §I-13 (each row cites its mechanism + file) | e.g. wobble × bowing, strokeCount × sketchingStyle, fillOpacity × hachureGap |
| I-14 layer-transform ownership | `stableLayerNudge` at `SvgStyleTransform.tsx:248`, single-pass-only | Edge revocation, enforced |
| RDP + dispatch + the S1 cliff | `SvgStyleTransform.tsx:546/:1632/:1705/:1791-1807` | ε is a **hardcoded constant** — the cliff exists but no user slider reaches it yet |
| Narrow fillStyle override (user↔classifier boundary) | `smartHachure/index.ts:164-185` | Walk 3's backward edge |
| Kink as a real, distinct node | `applyEndpointBehavior` `SvgStyleTransform.tsx:657` · R-1 ruling in 09 §11 | Was a fake node for months; now real |
| Rule-engine classifier + signals extractor | `classifier.ts:31/:315/:354` · `signals.ts:33/:341` | v1 provider chain = `[ruleEngineProvider]` only |

### PLANNED (not in code — don't let future-me blur this)

| Thing | Status | Source of the plan |
|---|---|---|
| **Cluster 0 itself** — the `simplification` slider | Research-locked, build-gated. The state field was *removed* as a dead stub in the Day 9 sweep; doc 22 §4.9 is the build checklist | doc 22 §4 |
| Dispatch freeze + closed-path floor | Build requirement of the slider — lands with it, not before | doc 22 §4.5/§4.6 |
| S11 lock as enforced code | Today it's a LOCK CANDIDATE in a research doc, plus the "record ε in artifacts" rule. Nothing enforces it in code yet | doc 22 §3.2 S11 |
| Phase C auto-pick (classifier choosing styles/fillStyles from signals) | Planned — Phase C of the Smart Rendering workstream. The rule engine classifies *regions for shading*; it does not auto-pick toggles | SESSION-HANDOFF §8.6 phases |
| Phase F cross-axis cascade (wobble-undersampling compensation, splinters-per-100px, bowing normalization) | Planned — carried as explicit notes for Phase F | doc 22 §4.8 · doc 19 §F |
| `bannedCombinations` in style presets | Planned — "bones for the future classifier," never built | doc 19 §F.5 |
| Doc 19 §E revision to formally add Cluster 0 | Pending — doc 22 §3.3 says "when next revised" | doc 22 §3.3 |
| ML of any kind | Deferred entirely. The only ML on any roadmap is personal sketch-style adaptation (task #30), explicitly NOT part of Smart Hachure v1 | 09-LOCKED-MODEL §6 |

### Known honesty gaps in the graph itself

- The doc-19 matrix serializes **13 modifiers**; live `F3ModifiersState` has ~30 fields. The matrix is a partial unwrap — style-specific modifiers (riso offsets, dot params, charcoal grain) have no matrix rows yet. Registering them is real future work, not done work.
- Cluster 2 (Pen Tip) has no dedicated chrome section — penTip renders inside Multi-stroke (`SmartHachureChrome.tsx:241`). Taxonomy and chrome disagree slightly; the taxonomy is the truth.
- `techniqueMap.ts` still contains `getBaseTreatmentForRole(role: TonalRole)` (`:278`) — role-based machinery the 09 kill-list (§7) marks for tear-out. The kill-list is the contract; the code hasn't fully caught up.
