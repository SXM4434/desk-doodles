# 07 · The 3D Pipeline — from flat doodle to 3D and back

**In one sentence:** Your 2D doodle becomes a 3D object through one of two routes — a geometry route you'd recognize from sweeping a spline in C4D (easy path) or an AI route that photographs your drawing and asks a generator to sculpt it (hard path) — and then your hand-drawn mark style gets re-applied ON TOP of the 3D render so the round-trip never strips your hand.

---

## Plain language

### The two-axis model

Everything in 3D mode is two independent picks, the same way C4D separates **modeling** from **shading**:

| Axis | C4D analogue | What it decides | Options |
|---|---|---|---|
| **Geometry mode** | The modeling step (sweep, extrude, volume builder) | What MESH gets built from your doodle | Stroke (Rod) · Punch out (Extrude) · Inflate · Merge · Volumetric AI · 3D Artist |
| **3D Style** | The material/render step | How that mesh gets DRAWN on screen | native-toon · native-edges · native-wireframe · halftone · **SVG port** |

You never lose one by changing the other. Swap the geometry, keep the style; swap the style, keep the geometry — exactly like swapping a material on an object without remodeling it. And critically: 2D Style and 3D Style are **separate dropdowns**, not one shared list. They're different render engines, like how a Sketch & Toon material list isn't the Photoshop brush list.

### The easy path — geometry from your strokes directly

When you draw a stroke, the app already has the math of your line (the point list). Turning that into a mesh is the same operation as **putting a spline in a Sweep object in C4D**:

- **Stroke (Rod):** your drawn line becomes the sweep path; a small circle is the profile. Three.js calls this `TubeGeometry` — it sweeps a circular cross-section along a smoothed curve (`CatmullRomCurve3`, which is just spline interpolation through your points). Result: a worm/wire version of your line. Your line IS the object.
- **Punch out (Extrude):** if your stroke closes into a shape, that shape becomes the spline in an **Extrude object** — pulled back into a slab, like a cookie cutter. Three.js calls this `ExtrudeGeometry`, with optional bevel (same bevel caps you'd toggle in C4D's extrude).

No AI, no network, no waiting. It's deterministic geometry construction, ~50 lines of code per mode, runs instantly in the browser. The two harder siblings — **Merge** (overlapping strokes fused into one watertight slab, like a Boole + connect) and **Inflate** (puff the closed shape like a balloon, a cheap cousin of C4D's Volume Builder smoothing) — use the same family of tricks but need more steps.

### The hard path — geometry from an AI looking at your drawing

For complex input (you drew a Pikachu, or uploaded a photo), no spline math can recover the 3D form. So the pipeline does what you'd do handing a sketch to a 3D artist:

1. **Rasterize** — the SVG gets flattened to a PNG (~1024px). No 3D-generation API accepts SVG; they all want pixels. Think of it as taking a photo of the drawing before sending it out.
2. **Vision LLM router** — a vision model (Claude) looks at the image and produces a **structured JSON** verdict: what the object is, how complex, how stylized, which generator API fits best, and a one-sentence tuned prompt for it. This is the "art director" step — it doesn't make geometry, it writes the brief.
3. **3D generator API** — Tripo (primary) or TRELLIS (cheap fallback) receives the image + brief and returns a **GLB file** — a complete mesh with materials, the same format you'd export from C4D for web. This is the photogrammetry-feeling step: image in, mesh out, except it's a generative model hallucinating the unseen sides instead of triangulating multiple photos.
4. **Load into the scene** — the GLB drops into the React Three Fiber scene with a physics body, sitting on the desk like everything else.

The **3D Artist mode** is the hard path with extra care: the vision model runs a deeper multi-pass analysis (structure, style, character, intent) so the brief preserves your drawing's personality — "intentional asymmetry, hand-drawn, NOT photoreal." Key research finding: **no generator API can keep sketch character in the mesh itself** — every API's "style" knob is texture-stage only (like how changing a material in Substance never changes the lowpoly). So the sketchy hand comes back at the next step instead.

### The style port — why marks can't be glued onto the mesh

Naive idea: take the hachure marks from 2D mode and paste them onto the 3D object like a decal. This breaks immediately — call it the **rectangle-as-box problem**. In 2D, a rectangle is ONE region with one set of marks at one angle. Extrude it and you get a box with **six faces**, each facing a different direction, each needing marks at a coherent angle, with density that responds to lighting. Gluing the 2D marks on would be like projecting one flat Photoshop layer onto a whole model from one camera — correct on the front face, smeared garbage on every other face (the classic camera-projection stretch you know from projection mapping in C4D).

The real solutions, in texture-pipeline terms:

| Approach | Texture-world analogue | Verdict |
|---|---|---|
| Per-face UV hatching | Hand-painting marks in UV space per face in Substance | Highest control, way too slow to build (needs unwrap + seams) |
| Object-space TAM texture stack | A baked multi-channel texture where each mip/band holds a darker hatch level | The RIGHT long-term answer (Praun's "Real-Time Hatching"), but needs an authoring tool we don't have |
| **Screen-space post-process** | **A blend-mode layer over the final render** — like a Multiply hatch layer in Photoshop driven by the render's luminance | **The pick.** One shader pass, no UVs, no baking |

The screen-space pass works like a smart Photoshop layer sitting over the finished 3D render: for every pixel it reads "how dark did this render?" (luminance), quantizes that into one of **8 darkness bands** (the same 8-band L\* table the 2D shading engine uses), and lays down the corresponding hatch density. It reads the **normal buffer** (a per-pixel "which way does this surface face" map, same data as a baked normal map) to bias hatch direction per face — that's how each of the box's six faces gets its own coherent mark angle. The trade-off is the known "shower-door" risk: marks live on the glass in front of the scene, not on the object, so they can feel like they slide. The mitigation ladder lives in the rotation-stability research (stable seed first, world-space-anchored jitter later).

**SVG port** is the deepest style option: instead of shading in the shader, it extracts the mesh's silhouette edges (`EdgesGeometry` — only edges where faces meet at >30°, i.e. the outline a toon shader would draw), projects them to the screen as flat 2D polylines, and feeds those through the SAME `SvgStyleTransform` pipeline that renders 2D mode. The entire 2D style system — all 11 styles, all modifiers — becomes available on the 3D object, because it literally IS the 2D renderer drawing the 3D object's contours every frame. That's the round-trip promise made literal.

### Caching — bake once, reuse forever

Hard-path generation costs real money (~$0.17–0.30 per 3D Artist run) and ~30–90 seconds. So results are treated like **baked textures**: expensive to produce, cheap to reuse, keyed by their inputs.

- **Content-hash keys:** hash the normalized input (SHA-1 of the bytes). Same drawing → same hash → cache hit, no API call. Like how a bake is invalid only if the highpoly changed.
- **OPFS** (Origin Private File System) — a real private filesystem the browser gives the app, ~10× faster than IndexedDB for big binary blobs. GLB files go here; small JSON metadata goes to IndexedDB; both mirror to Supabase so the public canvas can serve cached conversions to everyone.
- **Demo insurance:** pre-warm the cache with the demo drawings before recording, so the live demo plays from cache.

### The round-trip promise (the wedge)

Every competitor optimizes one of three poles: **fidelity-to-intent** (Suzanne — "you meant a phone stand, here's clean CAD," explicitly wants your linework sanitized), **fidelity-to-mesh** (Tripo/Meshy/Rodin/TRELLIS — accurate geometry, your hand stripped off), and **fidelity-to-the-hand** — unoccupied. Desk Doodles' position: sketch in, sketch out. Your marks generate the 3D form AND the 3D form re-renders in marks of the same family. The mesh generator is rented; **the rendering layer is owned.**

---

## The design — why it's built this way

- **Two axes instead of one combined list** — locked per `docs/memory/project_f3_shading_port_to_3d.md`: SVG and 3D have SEPARATE Style dropdowns. A combined enum would force every style to work in both renderers (most can't) and would break the "your pick is sacred" invariant (I-1) when flipping modes.
- **Easy path built from Three.js primitives, NOT a port of Free Stroke's codebase** — Free Stroke is Next.js + vanilla Three.js with its own state model; Desk Doodles is Vite + R3F + cannon-es. The primitives (`TubeGeometry`, `ExtrudeGeometry`, `CatmullRomCurve3`) ship inside `three` itself. Porting the wrapper would import a foreign state model for zero gain. (Research §5b.)
- **Screen-space hatching over UV/TAM approaches** — rejected (a) per-face UV hatching: needs unwrap + seam handling, weeks of work; rejected (b) object-space TAM stack: the right post-makeathon migration but needs a TAM authoring tool first. Screen-space is ~1–2 days because `@react-three/postprocessing` already provides the EffectComposer, and the 6-axis Smart Hachure tuple maps directly to shader uniforms. The migration path is clean: same shader math, only the sampling coordinate changes. (Research §7.)
- **Vision LLM router instead of calling one generator blindly** — different generators win at different inputs (Tripo for stylized, TRELLIS for fidelity-per-dollar, SF3D for speed). No production tool does this routing step end-to-end — it's novel territory and a demo-distinctive moment. (Research §8.)
- **3D Artist = clean mesh + render-time style, NOT mesh-baked style** — the gap-fill research checked every API (Meshy `art_style`, Rodin `material`, Tripo `style`): all stylization is texture-stage; no "preserve sketch in geometry" knob exists anywhere, and mesh-bake-from-style-reference in 14 days was scored a hard NO. So the hand survives via SVG-port + (stretch) a cheap displacement map derived from the source sketch — `displacementMap` warping the surface like a height channel in Substance. (Research §5/§5c, v1.2 additions.)
- **Typed async function chain, not XState/LangGraph** — the whole pipeline is 5–6 mostly-linear stages with 2 branches. TouchDesigner/Houdini/Blender-nodes all converge on dirty-flag DAG + per-node cache; at this size a plain function chain with `Stage` objects + Cockatiel retry/circuit-breaker pays its weight at ~150 LOC where XState costs ~600. (Research §3.)
- **OPFS for blobs / IndexedDB for metadata** — benchmark: OPFS ~10× faster on 100MB blob writes. GLBs are blobs; JSON is not. (Research §3.)
- **cannon-es, never Rapier** — Rapier's WASM load races intermittently in Figma Make preview and can't be hardened from inside Make. Verified 2026-06-05; locked in `docs/memory/project_desk_doodles_no_rapier_in_make.md`.
- **Rasterize-first for the hard path** — no 3D-gen API accepts SVG. One line of code, deliberate, not laziness. (Research §8.)
- **Tripo primary / TRELLIS fallback** — Tripo: $50 free dev-grant credits, mature API, good with stylized input, `object:clay` default for hand-made feel. TRELLIS via fal.ai: ~$0.02–0.10/gen, wins 68% of academic benchmarks — the budget safety net. Independent confirmation: the Atlas project (Suzanne founder's YC hackathon repo) ships Hunyuan + Tripo fallback — same shortlist reached independently. (Research §8 + Landscape addendum.)
- **Priority lock** — Focus: Stroke (instant feedback, Day 11) + 3D Artist (the wedge demo, Day 13–14). Reach: Volumetric AI (shares ~80% of 3D Artist's plumbing). Punch out ships as a free win beside Stroke; Merge/Inflate/Layered slabs/Heightmap/Lathe are stretch or post-MVP. (Research §5.)

---

## Technical

### What the pipeline reads/writes today (real, verified in code)

| Thing | Where | Notes |
|---|---|---|
| Mode toggle (`CanvasMode = 'svg' \| '3d'`) | `src/app/components/DeskDoodles/DeskDoodlesCanvas.tsx:53` (state at :57, tablist at :114–141) | The 2D/3D pill pair in /canvas chrome |
| 3D honesty gate | `DeskDoodlesCanvas.tsx:629–653` | `mode === '3d'` renders an opaque "3D mode lands Day 11" cover; drawing input is also gated at `handlePointerDown` (`:368`: `if (input !== 'draw' \|\| mode === '3d') return`) — stroke/upload state survives underneath, flipping back restores everything |
| `DrawSurface` | `DeskDoodlesCanvas.tsx:284` | The 2D capture + render surface the 3D path will branch from |
| `contentHash(input: string \| Blob): Promise<string>` | `src/app/lib/contentHash.ts:21` | SHA-1 via SubtleCrypto; the cache key for conversion results, GLB blobs, vision-LLM analyses, demo pre-warm. **Built, not yet wired into any page** (file header says so explicitly) |
| `normalizeSvgSize(svgMarkup, targetMaxPx = 180)` / `normalizeBBox(w, h, targetMaxPx)` | `src/app/lib/normalizeInput.ts:23` / `:83` | Input-boundary auto-resize (research §2 lock: auto-resize, no reshape controls in MVP). **Built, not yet wired** |
| Supabase client | `src/app/lib/supabase.ts` (`export const supabase`) | Live project, keys baked as Make-safe fallbacks; no tables yet — the conversion-cache mirror lands with Day 10 SQL |
| 2D render engine the SVG-port will reuse | `src/app/components/canvas/SvgStyleTransform.tsx` | The whole 2D style pipeline; SVG-port feeds projected 3D edges through this exact component |
| Smart Hachure engine (rule engine) | `src/app/lib/smartHachure/index.ts` — `renderSmartHachure` (`:61`), re-exports `classify`, `selectTreatment`, `extractAllSignals` (`renderRegion` is imported at `:14` and called internally, not re-exported) | The `signals → classify → treatment` chain whose 6-axis tuple becomes the 3D shader's uniforms |
| 3D deps already installed | `package.json` | `three@0.169`, `@react-three/fiber@8`, `@react-three/drei@9`, `@react-three/cannon@6`, `cannon-es@0.20` — present since the Day 5 fork, unused by /canvas so far |

### The contracts the 3D build implements (from research, not yet code)

All from `docs/research/21-research-3d-pipeline-and-style-translation.md`:

- **`Stage<I, O>` / `PipelineCtx`** (§3) — the typed function-chain stage shape: `run`, optional `fallback`, optional `cacheKey` (content-hash). `PipelineCtx` carries the cache map, the Cockatiel breaker, and an Excalidraw-style `sceneNonce` for invalidation. Cockatiel is **not in package.json yet**.
- **Geometry mode source of truth** (§5b) — Free Stroke's `lib/geometry-engines.ts` exports `type GeometryMode = "rod" | "extrude" | "inflate" | "solid"` (github.com/SXM4434/free-stroke). Rod = `TubeGeometry` along `CatmullRomCurve3` + sphere caps + joint spheres at ≥40° corners; Extrude = ribbon `ExtrudeGeometry`. Perf budget: `radialSegments` 8–12, tube verts = `(tubular + 1) × radial`, `curveSegments` 12. R3F gotcha: programmatic geometries don't auto-dispose — `useMemo` keyed on a points hash + explicit `.dispose()`.
- **`StyleGuide` JSON schema** (§5, locked v1.2) — the vision-LLM structured output: `subject` / `silhouette` / `line_quality` / `shading` / `proportions` / `rendering_intent_prompt`. Two-pass: extract JSON, then compose the generator prompt.
- **Router output schema** (§8) — `{ object_class, stylization_level, complexity, suggested_api: 'tripo' | 'trellis' | 'sf3d', suggested_prompt, recommended_3d_style }`, cached by content-hash of the input image.
- **Screen-space hatch shader uniforms** (§7) — `u_hatchTAM` (8-band hatch texture), `u_hachureAngle`, `u_gap`, `u_weight`, `u_layers`, `u_inkColor`, `u_inkIntensity`; fragment reads luminance → 8-band quantize → sample TAM band, normal-buffer `tangentBias` steers angle per face. The §7 GLSL is a sketch, not shipped code.
- **8-band L\* table** (§4) — shared between 2D `coverageToParams` calibration and the 3D shader's band quantization. Same darkness math both sides of the flip.

### API landscape (condensed from §8; full table + citations there)

| API | Latency | Cost/gen | Why it's in the plan |
|---|---|---|---|
| **Tripo3D v3** | ~30–60s | ~$0.13 (credits) | PRIMARY — $50 dev grant, stylized-input strength, `object:clay` style |
| **TRELLIS via fal.ai** | ~30–90s | ~$0.02–0.10 | FALLBACK — best open-source quality per dollar |
| Stable Fast 3D | **0.5s** | ~free tier | Wildcard — latency IS the wow factor |
| Meshy 6 / Rodin Gen-2 | 60–120s | $0.30–0.80 | Surveyed, not picked (gated/expensive) |
| Hunyuan3D 2.1 | 30–60s self-host | free (Apache) | Self-host route, post-makeathon |
| Suzanne | — | — | Enterprise-only API; parametric-CAD router candidate post-makeathon (relationship play) |

### Build schedule (research §10)

Day 11 (06-12): R3F canvas + Stroke + Punch out + cannon-es body + mode toggle wiring + input normalizer. Day 12 (06-13): screen-space hatching + SVG-port (stable seed). Day 13 (06-14): vision LLM router + Tripo/TRELLIS + 3D Artist. Days 15–16: buffer.

---

## Connections

This page sits on the 3D edge of the knowledge graph. Named edges:

- **→ `03-the-smart-system.md`** (code at `src/app/lib/smartHachure/`) — *supplies the style*: the `signals → classify → treatment` chain's 6-axis tuple becomes the 3D shader's uniforms; Phase D engine-routing (planned) will suggest Rod-for-open-strokes / Extrude-for-closed-shapes from signals, user always overrides (I-1).
- **→ `06-tone-and-shading.md`** — *shares the currency*: the 8-band L\* darkness table is shared verbatim between 2D fill calibration (`coverageToParams`, planned) and the 3D shader's luminance quantization. Same darkness math both sides of the mode flip.
- **→ `02-pipeline-of-a-doodle.md`** — *feeds the geometry and is reused by the style port*: `DrawSurface`'s stroke points are the spline the easy path sweeps; SVG-port feeds projected mesh edges back into the same `SvgStyleTransform` pipeline that renders drawn strokes. The Done/Edit commit flow gates when 3D conversion fires.
- **→ `04-the-ml-layer.md`** — *same honesty boundary*: the vision LLM router is a rented external model at a pipeline STAGE; it is not the planned trained classifier, and neither makes the shipping smart system ML.
- **→ `08-the-stack.md`** — *holds the parts list*: three/R3F/drei/cannon-es installed-but-unwired, Supabase client, the no-Rapier lock, and why everything must survive Figma Make. Caching (`contentHash` + OPFS + Supabase mirror) is what makes the 2D↔3D flip free and lets the public feed serve everyone's cached conversions.
- **→ `05-the-interconnection-graph.md`** — *extends the graph into 3D*: geometry mode × 3D style × the 2D modifier set are new node clusters whose edges (e.g. wobble → SVG-port jitter stability) must be declared, not discovered.
- **→ `01-what-is-desk-doodles.md`** — *carries the wedge*: "your hand survives the round-trip" is the one-sentence bet; this page is the mechanism that pays it.
- **→ `13-the-3d-system.md`** — *the control layer over this pipeline*: the chrome-split rule, the per-mode param sets (Rod/Extrude/Inflate/Solid), the ink-black material policy, the conversion-semantics brain (two register brains, the arrow/eyes/two-arc fixtures), and AI-as-default — the round-7/8 systems that sit on top of this pipeline. Read this page first, then 13.
- **Doc edges:** `docs/research/21-research-3d-pipeline-and-style-translation.md` (the contract for everything on this page) · `docs/research/23-brief-suzanne3d.md` (three-poles landscape) · `docs/locked-refs/F3-siblings/F3-toggle-architecture.md` lines 79–89 + 441–463 (3D Style options + rotation stability) · `docs/memory/project_f3_shading_port_to_3d.md` (separate dropdowns + port-parity rule) · `docs/memory/project_free_stroke.md` (don't conflate the projects).

---

## Honest status

**The rule that governs this section: the shipping smart system is a RULE ENGINE, not ML. And as of today (Day 10, 2026-06-11), ALL of 3D mode is planned, not built.**

### Exists in code right now

| What | Status |
|---|---|
| 2D/3D toggle in /canvas chrome | REAL — but flipping to 3D shows the **honesty gate** ("3D mode lands Day 11", `DeskDoodlesCanvas.tsx:629–653`). It deliberately does NOT pretend; state is preserved under the cover |
| `contentHash.ts`, `normalizeInput.ts`, `session.ts` | REAL files, tsc-clean, **unwired** — both file headers say "Not wired into any page yet — activates in the Day 10/11 builds" |
| Supabase client + live project | REAL — no tables yet; conversion-cache table is Day 10 work |
| three / R3F / drei / cannon-es deps | REAL in package.json since the Day 5 fork; zero 3D rendering uses them in /canvas today |
| Smart Hachure 2D engine | REAL and shipping — and it is a **rule engine** (`classifier.ts` `ruleEngineProvider`, `RULE_REGISTRY`), not a trained model |
| The research contract | REAL doc — `21-research-3d-pipeline-and-style-translation.md` v1.2, 55 citations, research-locked |

### Planned (NOT in code — do not describe any of this as shipped)

| What | Target |
|---|---|
| Rod + Punch out geometry, R3F scene, cannon-es bodies, toggle wiring | Day 11 |
| Smart Hachure Phase A (8-band table wired to `coverageToParams`) | Day 11 |
| Screen-space hatching post-process + SVG-port (stable seed) | Day 12–13 |
| Vision LLM router + `StyleGuide` JSON + Tripo/TRELLIS calls + GLB loading | Day 13 |
| OPFS blob cache + Cockatiel breaker (Cockatiel not even installed yet) | Day 11–13, as the stages land |
| Merge / Inflate-Lite geometry | Day 12–13 stretch |
| Displacement-map "hand-touched" surface | Day 13 stretch |
| Mesh-baked sketch style, object-space TAM, full Teddy inflate, Suzanne parametric route | Post-makeathon / v2 |
| Phase D auto-suggest of geometry mode from signals | Planned — and when it lands it will STILL be the rule engine, not ML |

If a future session finds this page claiming more than the table above, the page is stale — re-verify against `SESSION-HANDOFF.md` before trusting it.
