# Desk Doodles — Makeathon Plan

**Status:** v1 lock 2026-06-04. Deadline 2026-06-19 (15 days). Submission: Figma Make makeathon.

This doc is the executable plan. Locked decisions live here. Open questions are flagged with `?`.

---

## 1. Constraints (the box we're building inside)

### 1.1. Deadline
- **2026-06-18 at 11:59 PM PDT.** Confirmed 2026-06-04 from ConFigMakeathon guidelines.
- **14 days from today, not 15.** One day tighter than initial estimate.
- Winners announced June 23 at Config.
- Effective build budget = ~12 working days (no buffer day — submission Day 14 includes all upload + paperwork + social shares).

### 1.2. Figma Make hard constraints (per `18-figma-make-research.md`)
- **No monorepo / workspace support.** Make installs from public npm. `workspace:*` deps don't resolve. `pnpm-workspace.yaml` does nothing. **Desk Doodles is a single self-contained Vite app — every dependency lives inside its `package.json`, every file lives inside its `src/`.**
- **No bulk file upload.** Manual paste-back per file, OR attach up to 10 files per prompt (each ≤1 MB). Each upload is friction.
- **Make → GitHub is one-way push.** GitHub → Make is manual. Push from Make overwrites whatever's in GitHub.
- **Local codebase mode** (closed beta, Mac-only, Figma Beta desktop) would solve all of this. **ACTION ITEM:** Sebs requests beta access immediately. If granted, the entire upload-checkpoint friction disappears.
- **AI credits enforced.** Professional plan ≈ 50–70 prompts/month. Initial app gen: 100+ credits. Complex prompts: 200–340+. Effective budget: ~4 Make prompts per day. **Use point-and-edit (zero credit cost) for cosmetic work. Use Gemini Flash model for trivial prompts. Reserve Claude Opus for Supabase scaffolding only.**
- **No iframe embedding** of published Make site. Portfolio case-study links out, doesn't embed.
- **Auto-pause Supabase after 7 idle days.** During hackathon, fire a heartbeat DB query every 5 days — critical for the live demo not to be dead at judging.
- **Version history performance dies after ~200 iterations.** Plan to clone the Make file mid-hackathon if iteration count crawls.
- **`.tsx` file creation in UI costs an AI prompt.** Either ask Make to scaffold the full file structure on first prompt (one big credit hit, saves dozens later) OR paste a complete folder via attachment.

### 1.3. ConFigMakeathon submission requirements (confirmed 2026-06-04 from guidelines)
- **All required to qualify:**
  1. Live project link (the `*.figma.site` Make URL)
  2. Community / working project file link (Make file shared to Figma Community)
  3. Main video walking through work + idea + workflow + design decisions
  4. 30-second project walkthrough video for the social post
  5. Social post on Instagram / X / LinkedIn tagged `#ConfigMakeathon` + `@figma`
- **Bonus / scoring:**
  - 5 points per judging category (4 categories = 20 max)
  - +5 points for social share
  - +5 points for Figma Community share (potential to be featured at top of figma.com/community)
- **Judging criteria (4 categories):**
  1. Quality of work — design + build + impact + craft
  2. Quality of idea — solves real problem
  3. Quality of video — workflow + design decisions + emulatable process
  4. Building in Figma in novel/innovative/unexpected way
- **Tools available (each is in-scope to use):**
  - Figma Make (primary)
  - Figma MCP
  - Figma Weave (1.5k AI credits for image/video/creative media — useful for video assets)
  - Figma Agent beta (only if preregistered before June 3 5pm PST — Sebs verify access)
  - Figma Pro plan w/ 3k AI credits granted via Contra confirmation email
- **Build tooling rule (re-read):** must be made using Figma's suite. Make is the primary build environment. External Vite dev IS the dev environment per our plan; published surface MUST be the Make site.

### 1.4. Prize structure ($100k total)
- **$50k Grand Prize** — best overall across all 4 categories
- **$15k Runner Up** — delivered on all dimensions
- **$10k Innovative Workflow** — most inventive design-to-build workflow
- **$10k Building with Purpose** — most exemplary use of design to solve real problems
- **$10k Build-in-Public** — most generous documentation of process for the community
- **$5k Community Favorite** — makes people stop scrolling

### 1.5. Prize-targeting strategy (REVISED 2026-06-07 per guidelines audit)

Realistic targeting based on guidelines + scope:

| Prize | Fit | Why |
|---|---|---|
| **$50k Grand** | Conditional | Needs strong showing across all 4 judging categories. Execution-dependent. |
| **$15k Runner-Up** | Strong | Creative Figma usage + working prototype = direct fit. |
| **$10k Innovative Workflow** | Strong (CONDITIONAL on multi-tool usage) | Currently weak if Make-only. Strong if we add Figma Weave (video assets) + Figma Agent (logo + intro visuals + UI polish). Guidelines explicitly reward usage across "Make, MCP, Local, Weave, design agent, etc." |
| **$10k Build-in-Public** | Strong | Existing locked-model + scope-audit + playground-decoding docs + 3 designated content days + buffer artifacts. Aligns directly with "screencasts, breakdowns, explainers — most generous documentation." |
| **$5k Community Favorite** | Strong | Public canvas scatter metaphor is distinctive; "stop scrolling" energy. |
| **$10k Building with Purpose** | **Weak — DON'T target** | Desk Doodles is creative/expressive, not solving a serious real-world problem. Don't twist the narrative to claim this. |

**Multi-tool usage breakdown for Innovative Workflow positioning:**
- **Figma Make** — primary build environment (Day 5 fork onward)
- **Figma Weave** — video assets (chapter dividers, motion behind voiceover, hero animation, end card) on Days 12-13
- **Figma Agent** — logo + intro visuals + UI polish (Days 6, 12, 13)
- **Figma MCP** — natural byproduct IF Agent integrates with it (don't force standalone usage; code → Figma → Make is backwards for our workflow)
- **Figma Pro** — 3k AI credits for Make work

Build-in-Public requires extra work (recording designated-day screencasts, polishing existing docs as public artifacts) but the raw artifacts mostly already exist.

### 1.4. Credit + capacity assumptions
- Sebs's primary AI capacity is Claude Code (here, in this conversation). Unlimited cycles.
- Make's AI = scarce. Strategic use only.
- Sebs is one person. Time budget = realistically 6-10 focused hours/day across 12-14 days = ~80-120 hours total.

---

## 2. The decoded architecture

### 2.1. App shape

```
Desk Doodles (single Vite + React + TS + Tailwind + shadcn app)
│
├── INPUT
│   ├── Draw in-app (capture stroke data via pointer events)
│   ├── Upload image (PNG/JPG/etc.) → autotrace → SVG
│   └── Upload SVG (direct)
│
├── INTELLIGENCE LAYER (the "smart" core — drives all routing)
│   ├── Source analysis (extract signals: stroke count, bbox, fill, complexity)
│   ├── ML object analysis (route engine + suggest physics preset + suggest SVG style)
│   │   └── v1 = heuristic (shape/stroke analysis); v2+ = personal sketch-style training
│   └── Cross-axis interconnection (per playground decoding §19; foundation of "intelligent system")
│
├── SVG MODE CANVAS
│   ├── 11 user-pickable SVG styles (clean / outline / wireframe / rough-handdrawn / sketchy / bold-ink / wet-ink / stipple / charcoal / risograph / newsprint)
│   ├── Smart Hachure SHADING SUB-SYSTEM (active for styles 4–11, the shading-enabled set)
│   │   └── 6-axis output: (gap · weight · layers · pressure · color · opacity)
│   └── Per-style toggle clusters (Multi-Stroke · Pen Tip · Shading · Surface Texture · Color/Palette)
│
├── 3D MODE CANVAS
│   ├── 3D mesh (from Free Stroke OR Tripo OR pre-prepped GLB, depending on input)
│   ├── SVG style → 3D rendering port layer (R3F + EdgesGeometry + shaders)
│   ├── Physics layer (rapier — hard/soft body)
│   ├── Interaction patterns spectrum (no-rotate → slight → free → physics-driven)
│   └── 3D-specific toggles (lighting · material · camera · animation)
│
├── BACKEND (Supabase)
│   ├── Auth (anonymous + email/magic-link)
│   ├── DB (Postgres — projects table, settings table, ML feedback table)
│   ├── Storage (cached SVGs, GLBs, source images by content hash)
│   ├── Edge Functions (Tripo proxy, autotrace, heartbeat keep-alive)
│   └── Realtime (multi-user sharing — stretch tier)
│
└── BI-DIRECTIONAL CANVAS MODE FLIP
    └── Cached → no re-generation on flip
```

### 2.2. Smart Hachure scope clarification (locked)

**Smart Hachure = the intelligent SHADING sub-system inside SVG mode.** Active for 8 of the 11 SVG styles. NOT the whole SVG render system. NOT the whole app.

Smart Hachure's 6-axis output `(gap, weight, layers, pressure, color, opacity)` feeds the active SVG style's render register. The locked-model contract `09-LOCKED-MODEL.md` still governs Smart Hachure's behavior; this plan doc extends scope to the app shell that wraps it.

### 2.3. The 3D pipeline split by input KIND (not source)

Per the playground interconnection findings + Free Stroke video decoding:

| Input KIND | Engine | Reason |
|---|---|---|
| Writing / signature / cursive / single-gesture pen-stroke | Free Stroke (Rod / Extrude / Solid / Inflate) | Engine designed for this — "Seb" demo proves it |
| Simple closed silhouette (one main path) | Free Stroke Solid mode | Silhouette extrusion is Solid's job; H1/H2/H3 hole support handles complex closed shapes |
| Object drawing / scene / illustration / complex composition | Cloud AI (Tripo) → textured 3D mesh | Free Stroke would extrude the bbox as a slab; wrong result |
| Uploaded SVG (complex multi-element, like Trophy Wall pins) | Cloud AI (Tripo) | Same as above |
| Uploaded raster image (simple) | Vectorize → simple path → Free Stroke OR direct Tripo | Routing by complexity |
| Uploaded raster image (complex) | Direct Tripo | Skip the vectorize step |

**Routing intelligence:** the ML object analysis layer (heuristic in v1) classifies the input and picks the right engine. Same intelligence layer that suggests physics preset.

### 2.4. SVG style → 3D port (the UX-integrity requirement)

When the canvas flips from SVG to 3D, the user's chosen SVG style must carry over. Without this, the canvas-mode flip feels disconnected.

| SVG style | 3D rendering counterpart | MVP / Stretch |
|---|---|---|
| Clean | Default R3F PBR / flat material | MVP — trivial |
| Outline only | EdgesGeometry → line render | MVP — standard pattern |
| Wireframe | WireframeGeometry → line render | MVP — standard pattern |
| Rough hand-drawn (Smart Hachure) | EdgesGeometry → silhouette → hachure marks projected onto surface | **MVP target** — real engineering, the headline feature |
| Sketchy / Bold ink | Variants of rough-handdrawn pipeline | Stretch |
| Wet ink | Gaussian-blur post-process shader | Stretch |
| Stipple | Vertex-distributed dot rendering | Stretch |
| Charcoal | 3D-noise overlay shader | Stretch |
| Risograph | Per-pass offset render | Stretch |
| Newsprint | Halftone pattern shader | Stretch |

---

## 3. Feature list — MVP vs Stretch

**NOTE 2026-06-08:** M5 (Smart Hachure hachure fillStyle) + S3 (cross-hatch + dots) + S6 (ML heuristic v1) + S10 (interconnection wiring) + Day 13 T2 (ML heuristic) are RECONCILED into ONE Smart Rendering System per §8.6. The entries below stay for traceability but are now phases of the unified system, not separate features.

### 3.1. MVP (must ship for a credible submission)

| # | Feature | Owner-bucket |
|---|---|---|
| M1 | Draw in-app (pointer capture, smooth strokes) | Frontend core |
| M2 | Upload SVG (direct) | Frontend core |
| M3 | SVG canvas mode with 3 SVG styles working: Clean, Outline only, Rough hand-drawn (Smart Hachure) | Frontend + Smart Hachure restoration |
| M4 | **Restored playground regressions** (wobble master, path polyline sampler, conditional stableLayerNudge, locked HAND_FEEL_BASE ratios) — per §19 fix list | **FOUNDATION — blocks everything else** |
| M5 | Smart Hachure: hachure fillStyle working end-to-end with 6-axis tuple output | Smart Hachure core |
| M6 | 3D canvas mode with Free Stroke 4-mode picker (Rod / Extrude / Solid / Inflate) | 3D engine port |
| M7 | Bi-directional SVG ↔ 3D flip | Frontend |
| M8 | SVG style → 3D port: at minimum Clean + Outline + Rough hand-drawn (hachure marks on 3D surface via EdgesGeometry) | 3D + Smart Hachure bridge |
| M9 | Basic Supabase: anonymous session ID (no auth UI), cached SVG/GLB (storage), **public canvas as primary surface** — every saved drawing/conversion lands on a shared global feed others can browse. **Infinite canvas (Figma-style pan/zoom).** **Auto-scatter on publish** with slight rotation (-8° to +8°). **Anti-cover validator:** bounding-box check rejects placement that fully obscures another object. Mixed styles on canvas = the feel (style chaos). Session-ID in localStorage lets a user edit/delete THEIR posts during a session. No private/per-user scope at MVP — going private requires real auth (Stretch S9). | Backend + public canvas (MVP-PROMOTED 2026-06-05, scope expanded 2026-06-07) |
| M10 | Heartbeat keep-alive (5-day cron via Supabase Edge Function) | Backend |
| M11 | Portfolio language design system (W1 tokens, ISe ladder, locked spacing) | Frontend polish |
| M12 | Published `*.figma.site` URL working end-to-end | Deployment |
| M13 | Demo video (≤5 min, shows draw → SVG → 3D round-trip) | Submission paperwork |

### 3.2. Stretch tier (in scope if time allows, in order of priority)

| # | Feature | Adds |
|---|---|---|
| S1 | Image upload + autotrace → SVG | Bigger input range |
| S2 | Tripo cloud AI for complex SVG → 3D mesh | Better 3D for non-stroke input |
| S3 | Additional Smart Hachure fillStyles: cross-hatch + dots | Shading expressiveness |
| S4 | Physics layer (rapier) with 3-4 presets (rock / balloon / glass / wood) | Headline 3D interaction |
| S5 | Custom physics editor | Power-user mode |
| S6 | ML object analysis (heuristic v1) for engine + physics + style routing | The "intelligent" wedge |
| S7 | Additional SVG style → 3D ports: stipple, charcoal | Visual range in 3D |
| S8 | Override store + JSON export per `09-LOCKED-MODEL.md` D-9.c | Locked contract scope |
| S9 | **Private canvas (auth-gated)** — adds real auth (email/magic-link), per-user DB scope, per-user storage folders, login UI + flow. Lets a user keep work off the public wall. NOT in MVP because the cheap version (no auth + localStorage only) = blank every session = pointless. Real private requires the auth machinery, that's the cost. Public-vs-private surface UX + remix/moderation model NOT yet defined. | Personal workspace + future paid tier |
| S10 | All 13 sliders with 6+ ticks per `09-LOCKED-MODEL.md` D-5.a + interconnection matrix wired (cluster-aware) | Honors the locked discipline fully |
| S11 | **Drag-to-position publish option** — alternative to auto-scatter; user drags doodle to placement before confirming publish. Anti-cover validator still active. | More authored publish flow |
| S12 | **Unify toggle + global style/mode pickers (Path A binary)** — viewer toggles "Unify": every doodle on the canvas snaps to a baseline (same style + mode). Global style/mode pickers become active, twist them to see all objects respond together. Toggle off → snap back to as-published. OG mode hides the pickers entirely. Re-renders cached doodles through viewer-controlled config on demand. | Comparison mode for the feed — biggest demo-video moment for the feed itself |
| S13 | **Path B partial-toggle (buffer-only extension to S12)** — in OG mode, global pickers visible but only affect doodles that natively support the toggled axis (others stay as-published). Requires feedback affordance (per-doodle indicator showing "this toggle applies to me / not to me") to avoid feeling buggy. Buffer-day work if S12 lands and time remains. | Power-user "selectively explore in place" mode |

### 3.3. Explicit out-of-scope (for v1 submission)

- Sketch-style ML training (task #30) — separate scope, future
- All 7 fillStyles' research docs (only hachure ships at MVP)
- All Style register research docs (only rough-handdrawn registers fully)
- Full pair-wise interaction matrix in chrome (cluster taxonomy in code; chrome shows clusters but doesn't expose all interactions)
- Multi-user collaborative editing
- Plotter export (G-code / HPGL)
- Browser extension
- Personal hosted domain (use `*.figma.site` for submission; custom domain later)

---

## 4. Day-by-day sequence (the 15-day build)

**REVISED 2026-06-04 (Sebs's call):** Foundation first in Hero-8-Lab, fork second. Forking broken toggles propagates broken behavior into Desk Doodles. Fix the foundation against real F3-B Trophy Wall content, THEN fork a working system. Plus: interconnection is FOUNDATIONAL (per playground decoding §19), not stretch — every toggle participates in its cluster coupling.

### Phase 0 — Hero-8-Lab Foundation Pass (Days 1-4) ✅ COMPLETE 2026-06-05

**The scope:** EVERY toggle's options work + EVERY interconnection per §C matrix fires + clusters per §E lock + 4 named regressions restored. See `phase-0-hero-lab-foundation.md` for the detailed checklist.

**Closeout status (2026-06-05):** All 4 days landed. Foundation passes Trophy Wall validation. Day 4 evening smoke test produced Rapier verdict: WASM is **intermittent in Make** (cold-load race condition, can't harden from inside sandbox) — `cannon-es` locked as the physics swap. See `[memory project_desk_doodles_no_rapier_in_make]` + `20-research-figma-make-capabilities.md` §9 for the controlled-comparison evidence.

**Day 1 — Setup + wobble + per-toggle audit start**
- Update `09-LOCKED-MODEL.md` with invariants I-11 (Wobble master), I-12 (One render pipeline), I-13 (Cluster taxonomy), I-14 (sketchingStyle owns layer transform)
- Reintroduce `wobble: 0-2` to F3ModifiersState; multiply HAND_FEEL_BASE per shape; chrome slider with Excalidraw warn > 1.4
- Lock per-shape HAND_FEEL_BASE ratios (2.4/2.4/2.0/1.4/1.6) as system constants with calibration comment
- Begin per-toggle audit: roughness, bowing, curve — verify each tick value produces visually distinct output against framedFlyer test pin
- Sebs: request Figma Make local codebase mode beta + verify hackathon team-size rule + rotate Tripo API key

**Day 2 — Path pipeline + remaining per-toggle audit**
- Route `<path>` content through polyline sampler so endpointBehavior + sketchingStyle apply identically across primitives (fixes regressions B.2 + B.4 from doc 19)
- Make `stableLayerNudge` conditional on `sketchingStyle === 'single-pass'` (fixes regression B.3)
- Decide kink: drop name OR build randomized-angle behavior. Lock in `09-LOCKED-MODEL.md`
- Per-toggle audit continues: stroke width, multi-stroke (all 8 values), endpoint (4 values), sketching style (4 values), pen tip (8 presets), texture (10 presets), fillStyle (8 options), hachure params, ink/fill opacity, palettes

**Day 3 — Wire interconnections + clusters**
- Lock the 5 clusters per §E in code (group state, group chrome, cluster-level event triggers)
- Wire every pair-wise interaction from §C matrix that's marked → (direct drive). ~20 specific call paths.
- Wire N-way compounds from §D (kink × loose-overlap × strokeCount fan-of-overshoots; pen-tip × strokeCount × sketchingStyle × texture compound; etc.)
- Add `bannedCombinations` to STYLE_PRESETS per §F.5 (bones for future classifier)

**Day 4 — Validation + sign-off**
- Run all 6 Trophy Wall test pins (framedFlyer, vinylLpSleeve, stackedSketchbooks, Polaroid, NES cartridge, PSA Charizard) through:
  - Every fillStyle x every Style register combo
  - Wobble sweep 0 → 2 (verify ratios preserved)
  - Each cluster's master toggle full range
- Visual sign-off checkpoint. **Foundation done.** Sebs gives explicit go.
- Day 4 evening: De-risk Make. Push minimal Vite stub to a Make file with all 9 deps (three, R3F, rapier, rough, perfect-freehand, supabase, svgson, culori, polygon-clipping) — confirm Rapier WASM loads. If broken, swap to cannon-es.

### Phase 1 — Fork Desk Doodles + port foundation (Days 5-6)

**Day 5 — Fork** (real date: 2026-06-06)
- Fork Hero-8-Lab → `~/Desktop/Projects/desk-doodles/` per `feedback_fork_a_lab_means_port_everything`. Port: chrome contexts, fixed smartHachure lib, hand-feel primitives, F3-B Trophy Wall as test surface, ALL the Phase 0 foundation fixes.
- Strip Hero-specific cells (Hero #8 chrome rows, F3-A/B path UI, etc.) — keep only what Desk Doodles needs.
- Strip `workspace:*` deps, normalize `package.json` for Make's "install from npm" expectation.
- Add Desk Doodles-specific deps: **`cannon-es` + `@react-three/cannon` (NOT `@react-three/rapier` — see Phase 0 closeout)**, `@supabase/supabase-js`.
- Confirm Vite dev server runs end-to-end. F3-B Trophy Wall test surface renders correctly (proves the port).
- **🎤 Build-in-Public designated day** — record the fork moment + first-day intro tweet thread (3 posts: intro, engine clip, smoke-test build).

**Day 6 — App shell scaffold**
- Strip Hero #8 chrome → Desk Doodles chrome (mode toggle, input panel, settings panel)
- Top-level routes: home (intro), canvas (the app), gallery (stretch)
- Input panel: draw / upload SVG / upload image
- Mode toggle: SVG canvas / 3D canvas
- Settings panel: SVG style picker + Smart Hachure sliders (already wired from foundation)

### Phase 2 — SVG mode in Desk Doodles (Day 7)

**Day 7 — Draw + upload input working**
- Draw input: pointer-event capture, smooth strokes via perfect-freehand
- Upload SVG: file picker, svgson parse, render through Smart Hachure pipeline
- Smart Hachure renders correctly on draw/upload content (already validated against Trophy Wall in Phase 0)
- **First Make upload checkpoint** — push SVG mode alone to Make. Validate workflow, fix any conformance issues.

### Phase 3 — 3D mode (Days 8-10)

**Day 8 — Free Stroke engine port**
- Lift `lib/geometry-engines.ts`, `stroke-processing.ts`, `solid-mask.ts`, `solid-vector.ts` from `SXM4434/free-stroke` GitHub → `Desk-Doodles/src/app/lib/free-stroke/`
- Adapt 2 component files (drawing-canvas, viewport-3d) — drop Next.js imports
- 4-mode picker (Rod / Extrude / Solid / Inflate) wired

**Day 9 — Bi-directional flip + Supabase**
- SVG ↔ 3D mode flip with cached intermediate
- Supabase setup: anonymous auth, project DB, GLB Storage, heartbeat Edge Function
- Test mode-flip caching (same input hash → reuse cached GLB)

**Day 10 — SVG style → 3D port (headline feature)**
- Rough-handdrawn → 3D: EdgesGeometry → silhouette extraction → hachure marks projected on mesh
- Clean / Outline only / Wireframe → 3D (easy variants)
- Visual sign-off — the canvas-mode flip should feel coherent (style carries over)

### Phase 4 — Smart Rendering System + physics + polish (Days 11-12)

**RECONCILED 2026-06-08:** What was previously split as "Smart Hachure (M5)" + "ML heuristic v1 (S6)" + "Cross-axis interconnection (S10)" + "Additional fillStyles (S3)" is actually **ONE unified Smart Rendering System** — `signals → classify → treatment` applied to multiple decision surfaces. See §8.6 for the unified framing. Days 11-12 are MVP-first per day with extension-if-time.

**Day 11 — Smart Rendering System Phase A + cannon-es MVP**

MVP that day (must ship):
- **Smart Phase A baseline:** per-fillStyle darkness→density calibration for hachure (per `F3-shading-calibration-spec.md` §4.4.1). Source darkness → effective gap + weight formulas. Dark solid fills become hachure marks, light areas stay open.
- **cannon-es World setup:** imperative World + Body, step in `useFrame`. 1 body preset (rock = high mass + low restitution).
- **Interaction patterns:** no-rotate / free orbit toggle (2 of 4 from spectrum)

Extension if time:
- Smart Phase A for cross-hatch + dots fillStyles (§4.4.2, §4.4.3)
- Smart Phase C MVP: auto-pick SVG style from input signals (size + complexity) — the "intelligent wedge" demo moment
- Additional cannon-es presets (balloon, glass)
- Remaining interaction patterns (slight rotate, physics-driven)

- **🎤 Build-in-Public designated day** (or Day 12) — record the "smart shading + physics live" moment

**Day 12 — Smart Rendering System Phase B/C + polish + demo video starts**

MVP that day (must ship):
- **Smart Phase B baseline:** apply smart shading across all rough-family SVG styles (rough-handdrawn + sketchy + bold-ink + stipple — the 4 that use the shading axis)
- **Smart Phase C baseline:** auto-pick fillStyle + texture from signals on input. When user drops an item, system picks the right shading technique based on the source.
- **Portfolio design system overlay** on shadcn defaults (W1/W1-D, ISe ladder, locked spacing)
- **Second Make upload checkpoint** — full app
- **Demo video script + shot list draft.** Must include: the work, the idea, **the problem we're solving** (framing: *"Designers sketch at their desks constantly — there's no shared space to make that creative habit social and visible."*), the workflow.

Extension if time:
- Smart Phase B extended to wet-ink + charcoal + risograph + newsprint (the non-rough-family shading styles)
- Smart Phase F: wire cross-axis interconnection cascade (style change → fillStyle defaults → texture defaults)
- Smart Phase C extended to penTip + multiStroke auto-pick
- First demo video takes recorded

- **🤖 Figma Agent usage:** UI polish pass on chrome / panels / button-state refinement
- **🎨 Figma Weave usage:** generate video assets — chapter dividers, motion behind voiceover, hero animation, end card

### Phase 5 — Stretch ladder + video edit + submission (Days 13-14)

**Day 13 — Stretch ladder + Make checkpoint #3 + video edit + intro visuals (REVISED 2026-06-06)**

- **🤖 Figma Agent usage (continued):** generate intro visuals + Desk Doodles logo + end-card composition for demo video
- **🎨 Figma Weave usage (continued):** edit video footage with Weave-generated motion graphics; ~30-sec social cut also gets Weave-generated transitions

**The ladder (REVISED 2026-06-08 — Smart system now spans Days 11-12, ladder updated):**

Shop down this ordered list based on actual remaining time. Commit to Tier 1, then add Tier 2 if a day's left, then Tier 3. **DO NOT attempt all 3 from the start** — three half-shipped features look worse than one well-shipped feature.

| Tier | Feature | Cost | Why this order |
|---|---|---|---|
| **T1** | **Smart Phase D — engine routing** (signals → Free Stroke vs Tripo for 3D conversion). Plus **Phase E — physics preset suggestion** (drop a shape, system suggests rock/balloon/etc). The remaining ML-heuristic-v1 surfaces not covered by Days 11-12. | ~1 day | Closes the "intelligent system" claim across input-routing + interaction, not just shading. Pure local code. |
| **T2** | **Smart Phase F — cross-axis interconnection cascade end-to-end** (cluster master ↔ sub-toggle dependencies wired throughout chrome + render). Makes the system feel coherent — picking a style cascades to fillStyle + texture defaults, etc. | ~0.5-1 day | Honors `09-LOCKED-MODEL.md` I-13 interconnection contract fully. |
| **T3** | **Tripo image-to-3D** (image upload → cloud-AI 3D mesh via Supabase Edge Function). | ~1 day | Biggest "wow" demo moment IF it works (judges photograph their desk → 3D version on canvas). API-dependent → goes last because external failure kills the moment. If attempting, ship with a CACHED example as fallback. |

**Day 13 also includes:**
- **Demo video edit** (priority alongside ladder). Cut the 5-min main + 30-sec social. Video is the single biggest factor for the $50k Grand Prize.
- **Make upload checkpoint #3** — push final app state to Make

**Day 14 — SUBMISSION ONLY (deadline 11:59 PM PDT 2026-06-18)**

**Hard rule: NO build work on Day 14.** All code work locked at end of Day 13. Day 14 is paperwork + upload + paperwork. Build-day overflow into Day 14 is the single biggest reason makeathon submissions fail.

**Submission deliverables (REQUIRED to qualify):**
- Final upload to Make; confirm `*.figma.site` URL works
- **Test on PUBLISHED URL not just preview** — they differ per `20-research-figma-make-capabilities.md` §5
- Heartbeat ping fired (prevents 7-day Supabase auto-pause mid-judging)
- Upload demo videos to YouTube/Vimeo
- Share Make file to Figma Community (bonus 5 pts + potential featuring at top of figma.com/community)
- Social post to Instagram / X / LinkedIn with `#ConfigMakeathon` tag — per `feedback_selective_brand_tagging` use `@figma` only on the final submission post, NOT every Day 14 touch
- Submit on Contra

### Phase 6 — Buffer (real days 2026-06-16, -17, -18 morning)

**3 buffer days reserved.** Submission lands Day 14 (real date 2026-06-15 Sunday). Buffer days 06-16 / 06-17 / 06-18 morning = polish + breakage recovery + Build-in-Public artifact prep + Figma Community engagement.

**If nothing broke:** Build-in-Public publish push (long-form posts: foundation-first methodology, Smart Hachure algorithm breakdown, the Rapier verdict writeup). Each is a candidate for separate publication on dev.to / personal blog / Twitter thread. ~30-60 min each, sit on top of the existing locked-model + scope-audit + playground-decoding research that's already written.

**If something broke:** absorb here. Final hard deadline = 06-18 11:59 PM PDT.

**Submission filed before 11:59 PM PDT 2026-06-18.**

(Winners announced June 23 at Config.)

---

## 4.5. Git workflow rule (LOCKED 2026-06-07)

**Local `~/Desktop/Projects/desk-doodles/` + `github.com/SXM4434/desk-doodles` is canonical source of truth.** Figma Make is purely deployment artifact + Community-share working file.

- **Do NOT use Make's "Connect to GitHub" / "Push to GitHub" feature.** Off-limits for the makeathon duration. Would overwrite clean local commit history with Make's post-AI-edited state.
- All dev in local Vite. Commits + pushes flow local → `origin/main`.
- Make uploads are one-way (local → Make, manual paste-back at Days 7/12/13/14).
- After each Make session: if Make AI auto-fixed something, manually port the fix back to local + commit. Otherwise local drifts behind Make.
- **Submission deliverables don't require GitHub:** live URL = `*.figma.site` (Make), working file = Make Community share. GitHub is purely the Build-in-Public process trail + docs.
- If Make local-codebase beta lands (Action #53): revisit. Continuous sync changes the math, probably still keep `main` as source.

Memory anchor: `project_desk_doodles_local_is_canonical`.

---

## 5. Risk register

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | ~~@react-three/rapier WASM doesn't load in Make~~ — RESOLVED 2026-06-05 (intermittent cold-load race, can't harden from inside Make; cannon-es locked) | n/a | n/a | Closed. See `[memory project_desk_doodles_no_rapier_in_make]` + `20-research-figma-make-capabilities.md` §9. |
| R2 | Wobble restoration breaks existing tests | Low | Medium | Wobble is additive — old `roughness` slider stays, wobble multiplies into HAND_FEEL_BASE |
| R3 | Tripo API costs balloon during demo | Low (just one user) | Low | Hard rate-limit in Edge Function; Supabase free tier covers |
| R4 | Supabase auto-pauses mid-judging | High if forgotten | High | Heartbeat Edge Function (cron weekly) — Day 7 wired |
| R5 | Make AI credits run out before final polish | High | Medium | Use point-and-edit (free) for cosmetic work; reserve credits for Supabase scaffolding; Gemini Flash for trivial prompts |
| R6 | Make file performance degrades after 200+ iterations | Medium | Medium | Clone file mid-hackathon if iteration crawls |
| R7 | Free Stroke engine port surfaces hidden Next.js dependencies | Medium | Medium | Strip Next imports during port; framework-agnostic code in lib/ should be clean |
| R8 | SVG style → 3D port (hachure on 3D surface) is harder than expected | High | High | Time-box to Day 8. If not working, ship Clean + Outline only in 3D; defer hachure-on-3D to stretch |
| R9 | ~~Solo team-size rule~~ — RESOLVED 2026-06-04: ConFigMakeathon allows solo | n/a | n/a | Resolved. |
| R10 | Make's manual upload workflow eats too much time | High | Medium | Get local codebase mode beta access. If not, batch upload checkpoints (Days 5, 11, 14 only) |
| R11 | shadcn defaults clash with portfolio design system | Medium | Low | Override Tailwind tokens; replace component theming on Day 11 |
| R12 | Demo video doesn't render Smart Hachure clearly | Low | Medium | Day 14 video — script the demo flow to show SVG→3D flip explicitly |

---

## 6. The split: what's built HERE vs what's built IN Make

### 6.1. Built here (`~/Desktop/Projects/desk-doodles/` Vite app, on Sebs's machine)
- All Smart Hachure logic (signals, classifier, FillStyleModels, render-region)
- All 3D rendering (R3F, Free Stroke engine, physics, SVG-style-to-3D bridge)
- Input handling (draw capture, file upload)
- ML object analysis (heuristic v1)
- Portfolio design system (W1 tokens, ISe ladder)
- All component logic, all state management
- Backend WIRING (Supabase client setup, Edge Function code, schema migrations)

### 6.2. Built in Make (during upload checkpoints)
- Supabase scaffolding (run Make's "add Supabase" once — scaffolds auth + schema)
- Final cosmetic polish via point-and-edit
- Submission paperwork (Figma Slides embedding)
- Possibly: shadcn component theming tweaks if needed

### 6.3. NEVER touched in Make (would burn credits + likely break)
- 3D rendering loop, R3F + Rapier physics
- SVG → 3D extrusion math
- Color logic / culori
- Polygon clipping algorithms
- Smart Hachure FillStyleModels
- Tight iteration on stroke math

---

## 7. Open decisions (DECIDE BEFORE BUILDING)

### D-makeathon-1. Local codebase mode beta access
**Status 2026-06-04: Sebs is on the waitlist.** Beta access may activate mid-makeathon. Plan accommodates both workflows:
- **If activated before Day 7 (first planned upload):** switch to Workflow A — true two-way local↔Make sync. Skip the 4 batched upload checkpoints; use continuous sync instead. **Big productivity win.**
- **If activated mid-makeathon (Day 7-14):** transition mid-flight. Upload current state as one final batch, then activate continuous sync from there forward.
- **If never activated:** stay on Workflow B — 4 batched upload checkpoints (Days 4 evening, 7, 12, 14) per `20-research-figma-make-capabilities.md` §8.

Daily check: when Sebs sees the access-granted email, switch workflows immediately.

### D-makeathon-2. ~~Hackathon team-size rule~~ — LOCKED 2026-06-04
ConFigMakeathon on Contra. Solo allowed. Not FigBuild. **Resolved.** Sebs to still pull the rest of the submission rules from the guidelines page (deadline timezone, format, AI usage, IP) per §1.3 action item.

### D-makeathon-3. ML object analysis: heuristic-only or do we ship a real model in v1?
- **Recommendation: heuristic only in v1.** Real ML is the deferred sketch-style training (task #30). v1 heuristic uses stroke count, bbox aspect, fill density to route engine + suggest style + suggest physics. Good enough for the wedge claim.

### D-makeathon-4. Tripo integration: ship at MVP or stretch?
- **Recommendation: stretch (S2).** Free Stroke covers the drawing pathway perfectly. Tripo covers complex SVG/image. If time runs out, only-draw-mode 3D still ships a credible app.

### D-makeathon-5. ~~Public gallery / sharing~~ — RESOLVED 2026-06-05 — PUBLIC CANVAS PROMOTED TO MVP
**Decision flipped 2026-06-05.** Original framing was "private canvas in MVP, public stretch." Sebs flagged: anonymous private = localStorage only = blank every session = pointless. Real private requires auth machinery; that's the cost. Public canvas (anonymous session ID + global shared feed + opt-in publish, no Realtime required for MVP — simple `ORDER BY created_at DESC` query works) is structurally SIMPLER. And public-canvas-first was Sebs's original intent + better fits the Build-in-Public + Community Favorite prize criteria.
- **MVP M9:** public canvas with anonymous session ID, shared global feed, opt-in publish
- **Stretch S9:** private canvas with auth gating (was previously the MVP, swap stuck)

### D-makeathon-6. The kink behavior
- Per `19-research-cross-axis-interconnection.md` finding: `isKink()` defined but never called in playground either. Both apps treat kink as protrude.
- Options: (a) drop the kink name entirely, (b) build the randomized-angle behavior the doc-comment promises.
- **Recommendation: (a) drop the name.** Saves time; eliminates fake-provenance source-of-truth issue. Add kink as a real future toggle, properly researched.

### D-makeathon-7. Custom domain
- **Recommendation: skip for v1.** Use `*.figma.site` URL. Custom domain post-makeathon if Desk Doodles graduates to long-term hosting.

---

## 8. Standing tracker / state

### 8.1. Sign-offs needed before code starts
- [ ] Sebs reviews this plan + locks D-makeathon-1 through D-makeathon-7
- [ ] Sebs requests local codebase mode beta access
- [ ] Sebs confirms hackathon team-size rule
- [ ] Sebs reviews `09-LOCKED-MODEL.md` updates (I-11, I-12, I-13, I-14)
- [ ] Sebs schedules Tripo API key rotation (need fresh key before Day 13 if S2 stretches in)

### 8.2. Day 1 immediate actions
- Fork Desk-Doodles from Hero-8-Lab
- Smoke test Rapier WASM in Make
- Sebs: request beta + verify team rule + rotate Tripo

### 8.3. Critical dates (REVISED 2026-06-06 — earlier draft had off-by-one)
- 2026-06-04: plan locked
- 2026-06-05: Phase 0 closeout + Rapier smoke test verdict
- 2026-06-06 (today, real): Day 5 fork begins
- 2026-06-08: end of Phase 1 (fork + app shell done) — Make checkpoint #1
- 2026-06-11: end of Phase 3 (3D mode + SVG-style-to-3D port done)
- 2026-06-13: end of Phase 4 (physics + polish + demo video start) — Make checkpoint #2
- 2026-06-15: Day 14 (SUBMISSION-ONLY day, all build work locked end of 2026-06-14)
- 2026-06-16 to 2026-06-17: buffer days (Build-in-Public publish push if clean, breakage recovery otherwise)
- **2026-06-18 11:59 PM PDT: HARD DEADLINE** — final submission filed
- 2026-06-23: winners announced at Config
- 2026-06-05: Day 1 setup + de-risk
- 2026-06-09: end of Phase 1 (SVG mode shipped to Make checkpoint #1)
- 2026-06-12: end of Phase 2 (3D mode + Supabase integrated)
- 2026-06-15: end of Phase 3 (intelligence layer + polish; Make checkpoint #2)
- 2026-06-18: end of Phase 4 (stretch + buffer; final upload)
- 2026-06-19: submission day

---

## 8.6. Smart Rendering System — unified framing (LOCKED 2026-06-08)

What was previously scoped as separate plan entries — **M5 (Smart Hachure)**, **S3 (cross-hatch + dots fillStyles)**, **S6 (ML heuristic v1)**, **S10 (cross-axis interconnection)**, **Day 13 T2 (ML heuristic)** — is actually ONE unified Smart Rendering System with the same `signals → classify → select treatment → render` engine applied to multiple decision surfaces.

This is the makeathon headline (the wedge): *"an intelligent design system that picks the right transformation per region per source."*

### Where smart applies (and where it doesn't)

| Toggle type | Examples | Smart applies? |
|---|---|---|
| **Conversion / transformation pickers** (discrete options that pick which transformation to apply) | SVG style, fillStyle, texture, penTip, multiStroke, sketchingStyle, palette modes | **YES** — smart auto-pick |
| **Calibration parameters** (numeric values that should vary based on source signals) | hachureGap per darkness (spec §4), fillDensity per region, hachureAngle per shape orientation | **YES** — smart auto-tune |
| **Direct-manipulation sliders** (user expression controls) | wobble, bowing, strokeWidth, curveTightness, inkIntensity, fillOpacity, blurAmount, etc. (NOT roughness — see note below) | **REVISED 2026-06-08: slider VALUE stays direct (user picks 0-2 on wobble etc.). But HOW that value applies PER-REGION needs a smart layer — applying the same slider value uniformly across outer-shell + internal-detail + decorative-hatching shatters small/internal geometry at the slightest nudge (caught on Desk Doodles audit 2026-06-08: stacked-books outer shell read rigid while pencil-jar internal stubs went full-rough at identical slider state). Smart layer = per-detail scaling curve on top of user value; user intent preserved, per-region application protected. Adds as new sub-surface to the same `signals → classify → treatment` engine — same Smart Hachure region tagging fans out to manual-toggle scaling, not just hachure parameters. NOTE on roughness: the roughness slider does NOT belong in this row currently — per `09-LOCKED-MODEL.md §I-11` (locked 2026-06-04), roughness is reserved for Cluster 4 Surface Texture repurpose (3D-PBR-style stroke surface quality: edge raggedness, pencil grain, ink-density variation, feTurbulence micro-displacement). Slider stays visible as placeholder; per-region smart-layer scaling for roughness applies ONLY after that Cluster 4 wiring lands.** |

### Explicit issues parked for smart-system to resolve (added 2026-06-08)

These were diagnosed during Desk Doodles audit work and intentionally NOT patched in user-visible code today. Each will naturally improve when the smart-system build resumes:

- **fillStyle slider silent on 150/197 shapes** — Smart Hachure's classifier correctly decides "no fillable region" for stroke-only / wash-only shapes. UX gap: user can't tell which shapes are fillable. Smart system fix = surface per-shape fillable signal in chrome, OR widen what classifier considers fillable when user explicitly picks a fill.
- **Rough-handdrawn variance by shape complexity** — geomean bbox produces sliding-scale wobble. Simple shapes (actionFigure stick figure) look near-clean while complex ones look hand-drawn. Smart-layer per-element role classifier (outer-shell / decoration / internal-detail) will normalize VISUAL character regardless of element count.
- **Wobble per-element-type variance (HAND_FEEL_BASE ratios)** — `<line>` wobbles at 1.4× while `<rect>` at 2.4× per §I-11 sacred ratios. Visible inconsistency within a single SVG. Smart layer can detect "make all lines in this shape match the dominant character" instead of literal per-type ratios.
- **Curve-path dense sampling crinkle** (sombrero brim, folded map arcs) — 12px sampling on long shallow curves produces too many jitter points. Per-element classifier can detect "this is a decorative arc, sample sparser."
- **fillStyle classifier-vs-user override** — already partially resolved with the narrow override; smart system will refine by classifying per-region treatment intent.

These DON'T need separate fixes today. They're the natural payoff of the smart-layer build per the audit-catalog framing.

### Manual-toggle smart-layer foundation — built from the audit catalog (added 2026-06-08)

**Architecturally: building the smart layer is itself a two-part build.**

1. **The recognition + classification system** — a learned model that recognizes our objects' element roles (outer-shell / decorative-tip / internal-detail / hatching / etc.) and predicts the right per-element scaling for each manual toggle. This system becomes THE FOUNDATION the rest of the rendering pipeline plugs into.
2. **The foundational dataset that bootstraps it** — the per-shape breakage catalog produced by the Desk Doodles `/audit` route + sweep harness. The system *initially* learns from our catalog (our 93 shapes, every modifier swept, every breakage logged), and that's what makes its predictions stable enough to ship as the foundation.

So the order is: build the audit catalog → train the recognition system on it → set the trained system as the smart-layer foundation → everything else (visitor-canvas uploads, future asset additions, runtime classification) plugs into that foundation.

The manual-toggle smart layer (per-element scaling of wobble / bowing / strokeWidth / etc.) is the parallel surface to fillStyle smartness. Its **foundational training data isn't override events — it's the per-shape breakage catalog produced by the Desk Doodles `/audit` route + sweep harness.**

**Concrete kickoff example (logged 2026-06-08 during audit work):**

At rough-handdrawn defaults with wobble=0.8, `pencilStubJar` rendered with pencil-tip polygons (4-5px decorative geometry inside an 80px parent SVG) totally shredded — same slider value applied uniformly to outer-shell and decorative-tip is wrong. That single observation = one labeled example: `{role: decorative-tip, parentSize: 80, ownSize: 5} → scaling-curve(wobble) = 0.2-0.4 of user value`. Every analogous "X breaks on shape Y at value Z" surfaced by the audit grows the dataset.

**Pipeline (mirrors fillStyle maturity model from `07-architecture-ml-pipeline.md`):**

- **v1 (rules-only)** = geomean compromise currently shipped in `SvgStyleTransform.tsx` — `sizeClampBbox = sqrt(perChild × group)`. Soft per-detail scaling. Handles ~95% without classifier. Ships now.
- **v2 (cached LLM pre-pass)** = at build time, for each shape in inventory, ask the LLM to label each element's role (outer-shell / decorative-tip / internal-detail / hatching / etc.) and cache. Runtime classifier reads cache.
- **v3 (decision tree)** = retrain on accumulated audit labels + user overrides.

**Method (don't throw the audit data away):**

- Audit runs catalog `/tmp/dd-audit/` for now → graduate to repo-local `audit-runs/YYYY-MM-DD/` when corpus grows.
- Every catalogued bug = one labeled data point. The audit isn't a throwaway debug tool, it's the dataset.
- When the manual-toggle smart-layer build opens as its own session, start from the audit catalog — don't re-derive.

**Cross-references:**

- `07-architecture-ml-pipeline.md` — full pipeline architecture, now has a sibling section "Per-shape breakage catalog" mirroring this entry.
- Memory: `project_smart_layer_foundation_via_audit`.
- Table row below ("Direct-manipulation sliders") for the user-value vs per-region application split.

### Phases (rolled out across Days 11-13)

| Phase | What | Where it lands |
|---|---|---|
| **A** | Per-fillStyle darkness→density calibration formulas per `F3-shading-calibration-spec.md` §4 (hachure / cross-hatch / dots / zigzag / dashed / etc.) | Day 11 MVP (hachure) + Day 11 extension (cross-hatch + dots) |
| **B** | Apply across all 8 shading-capable SVG styles (rough-handdrawn / sketchy / bold-ink / wet-ink / stipple / charcoal / risograph / newsprint), not just rough-handdrawn | Day 12 MVP (4 rough-family styles) + Day 12 extension (other 4) |
| **C** | Auto-pick conversion pickers from input signals (SVG style / fillStyle / texture / penTip / multiStroke). When user drops an item, system picks defaults intelligently. | Day 12 MVP (SVG style + fillStyle auto-pick) + Day 12 extension (others) |
| **D** | Engine routing (signals → Free Stroke vs Tripo for 3D conversion) | Day 13 ladder T1 |
| **E** | Physics preset suggestion (signals → rock / balloon / glass / wood) | Day 13 ladder T1 |
| **F** | Cross-axis interconnection cascade (cluster master ↔ sub-toggles per `09-LOCKED-MODEL.md` I-13 and `19-research-cross-axis-interconnection.md`) | Day 12 extension OR Day 13 ladder T2 |

### Architecture (one engine, many surfaces)

`lib/smartHachure/` becomes `lib/smart/` (or keep name) — one classifier + treatment-selector + renderer pipeline that takes signals and produces decisions. Each phase adds a new "decision surface" to the same engine. NO separate ML system, NO separate ML heuristic — same code path, different application points.

### Build-full rule (CORRECTED 2026-06-08)

**Build the FULL system. Sebs calls time when needed — don't self-stop at MVP.**

The day blocks below list MVP as the floor of what ships, but the default is to push for the full phases that day. Don't artificially time-box to MVP and stop — keep going through the extensions. The only triggers to stop:
- Sebs explicitly calls time ("end here, we've spent enough")
- Real blocker that needs separate session (broken dep, missing decision, etc.)
- End-of-day natural break + work needs validation before extending

If we naturally finish a phase early in a day, push into the NEXT phase that day. Don't manufacture MVP-stops.

### Old plan entries — now subsumed

- **M5 (Smart Hachure: hachure fillStyle)** = Smart System Phase A MVP. Still MVP-required.
- **S3 (cross-hatch + dots)** = Smart System Phase A extensions. Drops from Stretch tier — now Day 11 extension.
- **S6 (ML heuristic v1)** = Smart System Phases C + D + E. Drops from Stretch tier — split across Day 12 + Day 13 ladder.
- **S10 (interconnection wiring)** = Smart System Phase F. Drops from Stretch tier — Day 12 extension or Day 13 T2.

### What's still post-makeathon (Phase G — explicit out-of-scope)

Generalize the engine to OTHER rendering domains per `project_generalizable_rendering_decision_pattern` memory (motion · type · color · spacing · 3D fidelity · etc.). DO NOT pre-build the meta-engine — extract only when 2nd concrete example justifies it. The makeathon ships the FIRST instance applied across all of Desk Doodles' surfaces; the cross-domain generalization is roadmap.

---

## 8.5. Build-in-Public discipline (REVISED 2026-06-06)

**Build-in-Public is a designated workstream, not a daily-screencast tax.** Daily capture eats ~30-60 min and accumulates to ~7 hrs over the build — that time is more valuable spent on the actual product. Instead:

### Designated content days (3 across the makeathon)

- **Day 5 (2026-06-06):** fork + intro. The Day 1 tweet batch (3 posts: Desk Doodles concept intro, engine clip, Rapier smoke-test build) — see drafts in session memory.
- **Day 9 (2026-06-10):** public canvas going live. Real shareable moment — record the feed appearing as a publish lands.
- **Day 11 or 12 (whichever lands physics+interactions first):** the "smart" feel + physics live. Voiceover + clip.

### Tagging discipline

Per `feedback_selective_brand_tagging`: hashtag `#ConfigMakeathon` on every post. Tag `@figma` ONLY on Day 1 kickoff + final submission post (2 tags total across 14 days). NOT every Build-in-Public update.

### Other days

Lightweight: single screenshot + 1-2 line caption if anything. No screencast/edit tax.

### Buffer-day artifacts (post-submission, 06-16/17 if clean)

Convert existing locked-model + scope-audit + playground-decoding docs into 2-3 long-form public posts:
- Foundation-first methodology breakdown
- Smart Hachure algorithm + the 13-axis parametric model
- The Rapier verdict writeup (controlled comparison, cold-load race finding)

Each is ~30-60 min of polish — the raw material exists.

---

## 9. Cross-reference index

- Foundation contract: `09-LOCKED-MODEL.md` (will receive I-11..I-14 update per playground decoding)
- Scope audit: `18-scope-audit.md`
- Playground interconnection: `19-research-cross-axis-interconnection.md` (to be written from agent #2 output)
- Figma Make capabilities: `18-figma-make-research.md` (to be written from agent #1 output — note conflicts with `18-scope-audit.md`; renumber to 20)
- Free Stroke source: `SXM4434/free-stroke` GitHub (private)
- Free Stroke video: `~/Desktop/style/Screen Recording 2026-06-04 at 2.00.46 PM.mov`
- Memory anchor: `project_desk_doodles_makeathon.md`
- Anti-drift: `feedback_smart_hachure_drift_pattern.md`

---

**End of plan.** Sebs reviews, locks D-makeathon-1 through D-makeathon-7, and Day 1 opens.
