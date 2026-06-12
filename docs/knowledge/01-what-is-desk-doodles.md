# 01 · What Desk Doodles is

**In one sentence:** Desk Doodles is a multi-mode canvas web app where you draw (or upload) a doodle and the app re-renders it in styled hand-drawn marks or as a 3D object — built on one bet no other tool makes: *your hand survives the round-trip*.

---

## Plain language

### The product in one walkthrough

You open the canvas and draw a heart with your cursor. The raw stroke is captured as points (the same way a pressure pen records a path). You hit **Done**, and the app re-renders that heart in one of 11 SVG styles — rough hand-drawn, sketchy, bold ink, wet ink, stipple, charcoal, risograph, newsprint, and so on. The fills aren't flat color: a sub-system called **Smart Hachure** looks at each region of the drawing, decides how dark it reads, and fills it with actual hatching marks — parallel strokes, cross-hatch, dots — at a density that matches that darkness. Then (planned, Day 11) you flip the same canvas to **3D mode** and the heart becomes a 3D form. Then you publish it to a shared public desk where everyone's doodles live together.

Three ideas stack here:

1. **One canvas, multiple modes.** SVG mode and 3D mode are two views of the *same* object, not two separate tools. Think of it like having both the viewport render and the wireframe view of the same C4D object — switching views never destroys the object.
2. **Conversions are baked, not live.** In C4D terms: flipping SVG ↔ 3D is expensive (some conversions call cloud AI APIs that take 30–90 seconds). So every conversion gets cached in a Supabase backend, keyed by a *content hash* — a fingerprint computed from the drawing's actual data, like a texture bake's filename derived from what was baked. Flip modes twice, pay once. Same drawing in = same hash = cache hit, no re-generation. This is exactly the baked-vs-live-material distinction: the conversion is the bake; the canvas just loads the bake.
3. **The desk is public.** No accounts. You get an anonymous session ID, and everything you publish lands on a shared global feed others can browse — a communal desk covered in everyone's doodles.

### What "Smart Hachure" means in Photoshop terms

Take a drawing with a dark grey region. A naive style filter would just wobble the outline and keep the flat grey fill. Smart Hachure instead deletes the flat fill and **rebuilds it as marks** — like replacing a Solid Color fill layer with a hand-hatched brush pass whose stroke spacing is tuned so that, squinting, it reads as the same grey. Darker source region → tighter, heavier, more-layered hatching. The original fill's darkness is the "target value" the marks must hit, the way a bump map's grey values are targets the displacement must reproduce. Each object ends up as a layer stack: fill marks underneath, jittered outline strokes on top — same compositing logic as your Photoshop layer groups.

The "smart" part: a classifier looks at each region's signals (size, position, darkness, whether it contains other shapes, stroke weight...) and assigns it a *tonal role* — paper (leave white), mid-tonal (hatch), structural frame (outline only, never fill), label text (never touch), etc. — then picks the right treatment for that role. **Today this is a rule engine — explicit if-this-then-that rules a human wrote — not machine learning.** More on that in Honest status.

### The wedge — "the user's hand survives the round-trip"

Every shipping sketch-to-3D tool in 2026 treats your drawing as a *problem to be cleaned up*. Tripo, Meshy, Krea give you back a clean mesh stripped of your line character. The stylization they do offer happens only at the texture stage — like being told you may repaint the model in Substance Painter *after* the mesh is built, but your linework had zero say in the form, and nothing of your stroke quality made it onto the surface.

Desk Doodles' bet (locked in `docs/research/21-research-3d-pipeline-and-style-translation.md` §13): the user's own **mark grammar** — stroke character, weight, jitter, wobble — is preserved end-to-end. Two halves:

- **(a) In:** your drawn marks generate the 3D form (via the Free Stroke engine for simple paths, cloud AI for complex inputs).
- **(b) Out:** the 3D form is re-rendered *back* in marks of the same family — your sketch style applied as the rendering style of the 3D object, like a custom NPR (non-photorealistic rendering — any render style that isn't trying to look like a photo) post effect that learned its strokes from you.

Sketch in, sketch out, signature intact. No shipping competitor does both halves.

### The three fidelity poles — and why ours is empty

Research on the 2026 landscape (21-research §8 addendum + the Suzanne brief) found every player optimizes exactly one fidelity target:

| Pole | Who lives there | What they optimize | What happens to your hand |
|---|---|---|---|
| **Fidelity-to-intent** | Suzanne (suzanne3d.studio) | "What did you *mean*?" → clean, editable, parametric, printable CAD (OpenSCAD/STEP) | Stripped *by design* — docs literally ask for "clean, high-contrast linework, closed outlines." Wobble is noise to disambiguate away |
| **Fidelity-to-mesh** | Tripo · Meshy · Rodin · TRELLIS | "What does an accurate generic 3D version look like?" → clean textured mesh (GLB) | Stripped — stylization exists only at the texture stage, never carried from your strokes |
| **Fidelity-to-the-hand** | **UNOCCUPIED → Desk Doodles** | "How did you *draw* it?" → form from your marks, surface rendered in your mark family | Preserved — it IS the product |

Why is the third pole empty? Because the other two poles' output *representations physically can't carry it*. Parametric CAD code is ideal geometry — there's no slot in an OpenSCAD file for stroke wobble. A photogrammetry-style neural mesh reconstruction (which is what image-to-3D APIs effectively are — photogrammetry from a single image, hallucinating the unseen sides) optimizes for surface accuracy, and treats line character as scanning noise. Preserving the hand requires *owning the rendering layer* — controlling how the 3D scene is drawn, not just what mesh it contains. That's why the plan leans on Tripo/TRELLIS as geometry engines where needed but keeps Smart Hachure as our own NPR layer on top of the three.js scene. The mesh is commodity; the marks are the moat.

Demo-video contrast line, verbatim from the research: *"other tools want your drawing sanitized; Desk Doodles wants your hand."* Or: Suzanne answers "what did you mean?" — Desk Doodles answers "how did you draw it?"

### The makeathon context

Desk Doodles is the submission to the **ConFigMakeathon on Contra** ($100k in prizes for things built in Figma; solo entries allowed). Deadline: **2026-06-18, 11:59 PM PDT**; winners announced June 23 at Config. We're on Day 10 of 14. Deliverables: live `*.figma.site` link + Community-shared Make file + demo video + 30-sec social video + tagged social post. The prize strategy targets Grand ($50k) + Innovative Workflow ($10k) + Build-in-Public ($10k) — the intelligent-routing wedge and the daily public posting both feed that.

Workflow quirk worth knowing: development happens **locally** in this repo (local is canonical); Figma Make is *deployment only* — folders get drag-dropped to Make at checkpoints, and Make never pushes back to GitHub. Physics is cannon-es, not Rapier, because Rapier's WASM load intermittently races in Make's preview and can't be hardened from inside Make.

### Standalone life after June 18

Desk Doodles deliberately lives at `~/Desktop/Projects/desk-doodles/` with its own public GitHub (`SXM4434/desk-doodles`) — *not* inside the portfolio repo — because it's its own product: own brand, public-canvas social loop, post-makeathon roadmap. The after-life sketch:

- **Port-back triage** — what flows back to the portfolio / Hero-8-Lab / visitor playground gets decided after the deadline, not tracked during the build.
- **Object-space TAM rendering** — the proper version of marks-on-3D (hatching textures that live on the surface like baked maps, stable under camera orbit) replaces the makeathon's cheaper screen-space post-process.
- **A richer router** — the vision-LLM router (an AI that looks at your doodle and decides which 3D generator suits it) could grow a *parametric route*: functional doodles (a phone stand, a hook) → clean printable CAD via something like Suzanne; expressive doodles → mesh-gen + hand-styled rendering. That's a relationship play with Suzanne's founder, not a current integration (her API is enterprise-only).
- **Generalizing the engine** — the `signals → classify → treatment` pattern isn't shading-specific; post-makeathon it's a candidate to extract for other rendering decisions (locked rule: don't pre-build the meta-engine; extract when the second concrete example exists).

---

## The design — why it's built this way

**Why multi-mode-one-object instead of two tools?** The round-trip IS the wedge. If SVG mode and 3D mode were separate apps, the claim "your hand survives the round-trip" has no surface to live on. The shared canvas with a mode flip makes the preservation *visible* — same heart, two renderings, one signature.

**Why cache conversions (bake) instead of regenerating (live)?** Cloud 3D generation costs real money ($0.05–0.40/gen) and 30–90 seconds. A mode toggle that re-bills and re-waits on every flip would make the core interaction feel broken. Content-hash caching makes flipping free after the first conversion — and deterministic: same input always shows the same output, which matters for trust.

**Why public-anonymous instead of private-with-accounts?** This was an explicit reversal (2026-06-05). The plan briefly drifted to "private MVP, public stretch," and Sebs flagged the flaw: anonymous + private = localStorage-only = a blank desk every session = pointless. Real private needs full auth machinery — too heavy for 14 days. Public-anonymous is structurally *simpler* (one table, session ID, no auth UI), matches the original idea, and gives the Build-in-Public / Community Favorite prize tracks a living demo. Private canvas is parked as stretch S9.

**Why a rule engine instead of ML for the smart layer?** Three reasons. (1) Time — 14 days. (2) Data — ML needs labeled examples; the `/audit` route's 197-shape breakage catalog is *being built as* that dataset right now (every catalogued bug = one labeled data point), so the training data doesn't precede the rules, it comes from running them. (3) Inspectability — every classification carries `firedRules` provenance so a wrong call has an audit trail, which a black-box model wouldn't give. The architecture has a `ClassifierProvider` chain with a confidence threshold precisely so smarter providers (cached-LLM, decision-tree) can slot in behind the rules later without rewriting the pipeline.

**Why screen-space hatching for 3D (makeathon) instead of object-space TAMs?** Screen-space post-processing (marks computed on the final 2D image, like a Photoshop action run on the render) is days of work via `@react-three/postprocessing`. Object-space TAMs (Tonal Art Maps — pre-baked hatching textures at nested density levels, applied on the surface like your Substance texture sets, so marks stick to the object under orbit) are the *correct* answer but weeks of work. Ship the cheap one, lock the migration path.

**What was rejected:** Rapier physics (WASM cold-load race in Make — verified, not vibes); building inside the portfolio repo (own-product argument won); private-first canvas (see above); Suzanne integration for the makeathon (enterprise-only API, 8 days out); true Teddy-style inflation for draw→3D (1–2 weeks of chordal-axis math — Rod/Extrude/Solid/Inflate-Lite cover the demo); XState/LangGraph for pipeline orchestration (overkill for 5 stages — a typed async function chain wins).

---

## Technical

Stack (locked): Vite + React + TypeScript · @react-three/fiber + drei + @react-three/cannon over **cannon-es** · Supabase · perfect-freehand · svgson. Dev server: `npm run dev` → `localhost:5182` (port pinned in `vite.config.ts`).

### Routes — `src/app/routes.tsx`

| Route | Component | What it is |
|---|---|---|
| `/` | `DeskDoodlesHome` | Landing |
| `/canvas` | `DeskDoodlesCanvas` | Draw/upload surface + style controls (today: the drawing primitive's test surface — the real desk-canvas + draw-panel-popup flow folds in with M9) |
| `/public` | `DeskDoodlesPublicCanvas` | Shared public desk (placeholder until Supabase wiring) |
| `/playground` | `DeskDoodlesPlayground` | Testing bed — add/drag catalog items, chrome reference |
| `/audit` | `DeskDoodlesAudit` | 197-shape catalog (`src/app/lib/items/PegToolShape.tsx`) — the smart-layer dataset |

### The drawing surface — `src/app/components/DeskDoodles/DeskDoodlesCanvas.tsx`

- `DeskDoodlesCanvas()` (line 56) — page shell; `DrawSurface` (line 284) does pointer-event capture.
- Live preview uses perfect-freehand's `getStroke` (imported line 3, applied line 32) to swell the point path into a pen-like polygon.
- **Done/Edit/Clear contract:** strokes stay raw polygons until the user clicks Done; Done routes them through the style pipeline. Committed strokes render as **stroke-only polylines** (filled polygons don't survive the Smart Hachure outline filter).

### The style pipeline — `src/app/components/canvas/SvgStyleTransform.tsx` (~2,550 lines)

- `STYLE_PRESETS` (line 49) — per-style modifier presets; `applyStylePreset` (line 78).
- `transformElement` (line 1346) — the per-element workhorse: jittered outlines, multi-stroke layers, endpoint behavior, sub-path splitting (`rdp`, `catmullRomPath`, `straightBezierPath` live in this file).
- `SvgStyleTransform` (line 2104) — the React wrapper component; `TextureFilterDefs` (line 2365) — shared SVG filter defs (grain, wet-ink halo, newsprint dot screens).

### Style + modifier state — `src/app/state/`

- `F3SvgStyleContext.tsx` — `F3SvgStyle` union, lines 9–20: `clean · outline-only · rough-handdrawn · sketchy · bold-ink · wet-ink · stipple · charcoal · risograph · newsprint · wireframe` (11 styles, metadata in `F3_SVG_STYLES`, line 30). Default is `'rough-handdrawn'` (line 55, Q-8 decision). `isRoughFamilyStyle()` gates which styles take rough.js modifiers.
- `F3RoughModifiersContext.tsx` — `F3ModifiersState` (line 61): the ~13 sliders + steps (`MultiStrokeStep`, `FillStyleStep`, `EndpointBehaviorStep`, `SketchingStyleStep`, `PenTipStep`, ...).

### Smart Hachure — `src/app/lib/smartHachure/`

One public entry: `renderSmartHachure(svgRoot, fullModifiers, opts)` (`index.ts` line 61). Pipeline = **signals → classify → select treatment → render**, one file per stage:

| Stage | File | Key symbol |
|---|---|---|
| Signals | `signals.ts` | `extractSignals` (l.33), `extractAllSignals` (l.341) → `Signals` (geometric + topological + stylistic + `darknessL`) |
| Classify | `classifier.ts` | `classify` (l.31), `ruleEngineProvider` (l.315), `RULE_REGISTRY` (l.354) → `Classification` with `role`, `confidence`, `firedRules` |
| Treatment | `techniqueMap.ts` | `selectTreatment` (l.45), `getBaseTreatmentForRole` (l.278) → `Treatment` (fillStyle + gap/weight/layers/pressure/opacity) |
| Render | `renderRegion.ts` | `renderRegion` (l.40) — emits the actual marks via rough.js |

Types in `types.ts`: `TonalRole` (line 17 — 9 roles from `paper` to `label-text`), `Signals` (l.39), `Classification` (l.76), `Treatment` (l.92), `ClassifierProvider` (l.156), `OverrideStoreApi` (l.227). The contract governing all of it is `docs/locked-refs/F3-smart-hachure-system/09-LOCKED-MODEL.md` (invariants I-1..I-14 — sacred).

### Backend + pipeline libs (written, mostly unwired — see Honest status)

- `src/app/lib/supabase.ts` — `supabase` client (line 15); live project, **no tables yet**.
- `src/app/lib/contentHash.ts` — `contentHash(input)` (line 21), SHA-1 via SubtleCrypto — the cache key for the 4 planned cache points.
- `src/app/lib/session.ts` — `getSessionId()` (line 19) — anonymous identity for the public desk.
- `src/app/lib/normalizeInput.ts` — `normalizeSvgSize(svgMarkup, targetMaxPx = 180)` (line 23) — auto-resize lock for any input.
- `src/app/lib/patchRoughDots.ts` — runtime prototype patch making rough.js dot fills deterministic (seeded, Make-safe).

---

## Connections

The knowledge base is a graph; these are this page's edges. Pages other than this one are **planned** — the underlying docs cited are real today.

| Edge | Target | Relationship |
|---|---|---|
| contains | Smart Hachure System page *(planned)* — until then: `docs/locked-refs/F3-smart-hachure-system/09-LOCKED-MODEL.md` | Smart Hachure is the mark-making engine *inside* SVG mode; this page is its container |
| contains | 3D pipeline page *(planned)* — until then: `docs/research/21-research-3d-pipeline-and-style-translation.md` §5–§8 | Free Stroke modes + cloud-API routing + NPR-on-3D are the 3D half of the round-trip |
| is-justified-by | `docs/research/21-research-3d-pipeline-and-style-translation.md` §13 + §8 addendum | The wedge + three-poles map — the strategic argument this whole product rests on |
| is-sharpened-by | `docs/research/23-brief-suzanne3d.md` | Suzanne defined the intent pole; the brief proves our pole stays empty |
| is-scheduled-by | `docs/locked-refs/F3-smart-hachure-system/makeathon-plan.md` (esp. §8.6) | The 14-day plan + the unified Smart Rendering System framing |
| is-fed-by | `/audit` route + `audit-runs/` + `docs/locked-refs/F3-smart-hachure-system/07-architecture-ml-pipeline.md` | The audit catalog is the labeled dataset the future smart layer trains on |
| is-generalized-by | `docs/memory/project_generalizable_rendering_decision_pattern.md` | `signals → classify → treatment` is a general pattern; Smart Hachure is instance #1 |
| is-constrained-by | `docs/memory/project_desk_doodles_no_rapier_in_make.md` + `docs/locked-refs/F3-smart-hachure-system/20-research-figma-make-capabilities.md` | Make's runtime quirks shape the stack (cannon-es, checkpoint uploads) |
| interacts-via | `docs/research/19…cross-axis` (in `docs/locked-refs/F3-smart-hachure-system/`) + `docs/research/22-research-simplification-toggle.md` | Modifier axes are interconnected; simplification gets its own upstream cluster |
| is-controlled-by | [11-the-pen-model.md](11-the-pen-model.md) | The desk control model: objects are frozen records, the panel is your pen, Global is a viewer-local lens (D-7) |
| is-created-by | [12-the-creation-loop.md](12-the-creation-loop.md) | The full loop: Sketch\|Style → name (minting) → place as a stroke-retaining record → Re-draw; the tone brush |
| renders-into-3d-via | [13-the-3d-system.md](13-the-3d-system.md) | Geometry modes + chrome split + ink-black policy + the conversion-semantics brain (two register brains) |
| is-published-onto | [14-the-social-desk.md](14-the-social-desk.md) | The public layer: capped multi-desk, the drawer-as-index (place=copy), friendly handles, smart placement |
| is-scheduled-by | [15-the-smart-ml-ladder.md](15-the-smart-ml-ladder.md) | The dated smart/ML build sequence + "ahead on engines, behind on receipts" + the receipts retrofit |

---

## Honest status

The rule Sebs set: **don't make me fake shit.** So, precisely:

### Exists in code today (2026-06-10, Day 10 of 14)

- Draw surface with perfect-freehand capture, Done/Edit/Clear flow, SVG upload (sanitized raw-markup injection) — `/canvas`.
- All 11 SVG styles rendering, ~13 modifier sliders, fillStyle override, jaggedness, endpoint behaviors, multi-stroke, surface textures.
- **Smart Hachure as a RULE ENGINE.** `ruleEngineProvider` is the only provider in the chain; every classification reports `classifiedBy: 'rules'` with `firedRules` IDs. The `'cached-llm'` and `'decision-tree'` values in the `Classification` type are *empty slots for planned providers*, not running code. There is **no ML anywhere in the shipping system.**
- `/audit` (197 shapes) + `/playground` + sweep harnesses; `audit-runs/` evidence trail.
- Supabase **client** created and probe-verified live — but zero tables, zero rows, nothing persisted yet.
- `contentHash` / `getSessionId` / `normalizeSvgSize` — written, tsc-clean, **unwired** (locked decisions awaiting Day 10/11 integration).
- Make checkpoint #1 uploaded (34 files); smoke verification of all 5 routes in Make preview still pending.

### Planned (not in code, or honesty-gated)

- **3D mode entirely.** The 3D toggle on `/canvas` is an honesty gate — it disables drawing and literally says "3D mode lands Day 11." Rod (TubeGeometry) + Extrude (ExtrudeGeometry) are Day 11; Solid + Inflate-Lite Day 12–13 if time.
- **Public desk wiring** (Day 10): the one table (`id · session_id · svg_blob_url · created_at`), publish flow (the Publish button is a placeholder), shared feed rendering.
- **The round-trip's second half**: NPR hatching on 3D surfaces (screen-space post-process makeathon-scope; object-space TAM post-makeathon).
- **Vision-LLM router** + Tripo/TRELLIS cloud generation (Day 13 tier; fal.ai key exists, no credits loaded; Tripo key needs rotation).
- **Image upload** (stretch S1 — needs a tracer dependency).
- **Smart phases A–F** (darkness→density calibration math from 21-research §4, auto-pick of conversion pickers, engine routing, physics suggestions, cross-axis cascade) — researched and locked on paper, not implemented.
- **Phase G / the meta-engine, Suzanne parametric route, portfolio port-back** — explicitly post-makeathon.

When this page says "the app converts between modes" — that is the *architecture*. What a user can do **today** is draw/upload → styled SVG with rule-engine-driven hatching. The 3D half and the public desk are the next four days of work.
