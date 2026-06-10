# Session Handoff — Desk Doodles

**Per CLAUDE.md handoff rule:** short, factual, action-oriented. Records current state, real changes, locked decisions, unresolved questions, next move. Historical session detail lives in git log + per-system locked docs.

Port-back to Hero-8-Lab / visitor playground / other portfolio surfaces is **post-makeathon triage** (after 2026-06-18 deadline) — don't pre-plan, don't track live, just keep the work clean.

---

## Current state · 2026-06-10 (Day 9 of 14 CLOSED — Make checkpoint + doc mirror + research spree + 21-synthesis v1.2 finalized)

### Day 9 (06-10) — Make + docs + research

**Make checkpoint #1 LANDED** (2 days late from Day 7 plan). 34 files uploaded to Figma Make via drag-drop + AI-routing prompt. App routes / · /audit · /canvas · /playground · /public expected to render. Smoke verification pending in Make preview.

**Full doc mirror to `docs/`:** 51 markdown files (1.1MB) mirrored from portfolio + memory into a self-contained `docs/locked-refs/` + `docs/memory/` + `docs/research/` tree. `docs/README.md` is the index. CLAUDE.md updated to point at local mirror. Source-of-truth still in portfolio repo (post-makeathon port-back).

**7-agent research spree COMPLETE (6 parallel + 1 gap-fill).** Coverage: (1) NPR shading on 3D surfaces, (2) image-to-3D API landscape 2026, (3) Three.js 2D-to-3D primitives + Free Stroke source breakdown, (4) source-darkness → hatch density math (TAM/Murray-Davies/Yule-Nielsen/JND), (5) pipeline orchestration patterns, (6) frontier 2D-to-3D + NPR product survey 2026, (7) gap-fill pass. All returned with real verifiable citations.

**Synthesis doc FINALIZED v1.2** at `docs/research/21-research-3d-pipeline-and-style-translation.md` (+ mirror at portfolio). 822 lines · 13 sections + §0 ask-coverage + §5b Free Stroke detail + §5c-equivalent gap-fill content · 55 citations · covers all 17 of Sebs's asks.

**Key research-derived decisions (LOCKED in synthesis doc v1.2):**

- **The wedge:** "user's hand survives the round-trip" — drawn marks generate 3D form AND 3D form re-renders in marks of the same family. No shipping competitor does this end-to-end (Tripo / Meshy / Krea / Womp all strip the artist's signature).
- **3D NPR rendering:** screen-space hatching post-process via `@react-three/postprocessing` for makeathon scope. Praun TAM math maps to fragment shader uniforms. Object-space TAM 3D-texture path is the post-makeathon migration target.
- **3D geometry (easy):** ship Rod (TubeGeometry) + Extrude (ExtrudeGeometry) on Day 11. Solid (raster→marching-squares) + Inflate-Lite (swept capsule) on Day 12-13 if time. True Teddy chordal-axis = 1-2 weeks, out of scope.
- **3D geometry (hard):** Tripo + TRELLIS via fal.ai as the dual-API integration. Tripo $50 free dev credits; TRELLIS $20 free + ~$0.10/gen + 68% benchmark wins. Stable Fast 3D (0.5s) as wow-factor optional.
- **Vision LLM router:** Claude/GPT-4o/Gemini analyze → route to right 3D-generator API. Novel territory (no production case studies) → distinctive wedge.
- **Pipeline orchestration:** typed async function chain + Cockatiel circuit breaker + OPFS for GLB / IndexedDB for metadata / SubtleCrypto content-hash. Skip XState/LangGraph/Mastra (overkill for 5 stages).
- **Smart Hachure math:** single `coverageToParams(a, fillStyle) → (gap, weight, layers)` function. 8-band L* quantization (Praun + Mahy JND validates). Per-fillStyle inverse equations: Murray-Davies for hachure, Beer-Lambert √2 for cross-hatch, weighted Voronoi/Secord for dots, path-length-per-area for zigzag.
- **Auto-resize on input:** confirmed (any uploaded SVG/image normalized to canonical size). Reshape controls = post-MVP polish.

### Make upload checkpoint summary

Commit `e6c7889` pushed to `SXM4434/desk-doodles main` 2026-06-10. 34 files (7 REPLACE + 27 ADD) drag-dropped to Figma Make with the AI-routing prompt. The desk-doodles Make project now has package.json with NO Rapier, App.tsx routing through React Router, full Smart Hachure engine + audit + canvas + playground + chrome controls.

### Day 9 ledger (shipped 06-10)

- Drawn-canvas full overhaul committed + pushed (`e6c7889` on SXM4434/desk-doodles main)
- Make checkpoint #1 landed (34 files dropped + AI-routed in Make)
- 681-pattern sweep × 4 phases × 6 parallel workers — clean mosaic
- 51-file doc mirror from portfolio → `docs/`, committed
- 7-agent research spree (6 parallel + 1 gap-fill) on 3D + style architecture
- 822-line 21-research synthesis doc v1.2 covering all 17 asks, committed
- CLAUDE.md + SESSION-HANDOFF.md updated + committed

### NEXT MOVE (Day 10 = 06-11)

1. Task #22: Make smoke test — verify all 5 routes render in Make preview
2. Submit Contra social URL to complete entry
3. Day 10 MVP work: public canvas + Supabase wiring (1 table: `id · session_id · svg_blob_url · created_at`)

---

## Previously current state · 2026-06-09 evening (Day 9 — Day 7 Make checkpoint OVERDUE, drawn-canvas modifier overhaul + 681-pattern sweep harness landed)

### Day 9 session — drawn-canvas full overhaul + canvas sweep infra

**Headline:** the `<path>` rendering for drawn / uploaded input was rewritten end-to-end. Audit pipeline untouched (gated by RDP threshold). Bowing + curveTightness + endpointBehavior now work on drawn canvas (was silently no-op). Polygonal-vs-curve dispatch: ≤8 anchors → straightBezierPath (sharp corners), 9+ → Catmull-Rom (smooth curves) with corner-detection at sharp vertices.

**Code added to `SvgStyleTransform.tsx`:**
- `rdp()` — Ramer-Douglas-Peucker simplification (ε=3.0)
- `smoothPolyline()` — corner-preserving 3-pt moving average (skips smoothing at >30° turns)
- `arcLengthWobbleField()` — low-frequency wobble field (~60px wavelength) via cosine-interpolated seeded noise
- `applyEndpointBehavior()` — handles clean/protrude/long-overshoot/kink for open + closed paths
- `straightBezierPath()` — control-points-on-chord with bowing + jitter (for polygonal intent)
- `catmullRomPath()` — smooth interpolation through anchors with corner-detection (>45° turns get straight tangent), bowing on control points, curveTightness dampening

**Sub-path split for `<path>` with multi-M (rose chaos fix):** d-string walker breaks on every M, renders each sub-path as its own renderHandFeelShape call. Audit shapes always ≤1 sub-path → no change. Auto-traced rose with 112 sub-paths → no more cross-sub-path bezier connectors.

**Other shipped fixes:**
- Jaggedness default 0.6 → 0 across all rough-family presets + DEFAULT context (splinter is opt-in)
- stroke-dasharray preservation through wobble pipeline (gigTicket / framedSketch / conferenceLanyard dashes render correctly)
- stableLayerNudge magnitudes bumped — single-pass + multi-stroke=triple now shows 3 distinct outlines even at wobble=0
- `handlesPerVertexLayer` ctx flag — parallel-pass on open paths via buildPath instead of dense-vertex chaos
- Polygon detection at vertex count ≤ 8 in case 'path' buildPath
- bowing + curveTightness + endpointBehavior wired through to both straightBezierPath and catmullRomPath

### `/canvas` sweep harness (mirror of `/audit`)

`/tmp/dd-canvas-sweep.js` drives 681 synthesized canonical patterns (lines, sines, circles, polygons regular/irregular, rectangles, diamonds, triangles, stars, letters A-Z, digits 0-9, symbols, hooks, S-curves, arcs, loops, organic blobs, lightning, clouds, teardrops, crescents). Four phases:
- **Smoke** (681 patterns @ default state) — DONE 0 errors
- **Multi** (24 patterns × 8 multi-stroke × 4 sketching = 768 cells) — DONE
- **Wobble** (20 patterns × 5 wobble × 5 jaggedness = 500 cells) — DONE
- **Style** (12 patterns × 11 SVG styles = 132 cells) — DONE

Mosaic index: `/tmp/dd-canvas-sweep/index.html`. Parallelized: 6 workers × ~10min = full smoke pass.

### NEXT MOVE (Day 9 → 10): Make upload checkpoint

Per `makeathon-plan.md`: first Make upload was scheduled Day 7. **We are 2 days late.** Build is clean (215 modules, 554KB / 156KB gzip). Need:
1. Commit current changes to GitHub (1457 insertions across 7 files + 5 new files)
2. Push to https://github.com/SXM4434/desk-doodles
3. Sebs uploads folder to Make
4. Verify Smart Hachure / canvas / playground / audit / SVG upload all work in Make preview
5. Fix any Make-specific issues (per `project_desk_doodles_no_rapier_in_make` we already use cannon-es)

---

## Previously current state · 2026-06-09 morning (Day 7 substantially done · wobble investigation open)

### Day 7 + extensive audit work landed (last session, ~14 hrs)

**`/audit` route now 197 shapes** (104 Pegboard ported from Hero-8-Lab per `feedback_fork_a_lab_means_port_everything`). Lives at `src/app/lib/items/PegToolShape.tsx` (no Hero-8 context deps). Catalog runs in `audit-runs/2026-06-08/` + mosaics/comparisons in `/tmp/dd-audit/` (NOT in repo).

**Code fixes in `SvgStyleTransform.tsx` + `lib/smartHachure/` + `lib/f3HandFeel.ts`:**
- Wobble silently floored on multi-child SVGs → geomean `sqrt(perChild × group)` per-detail scaling
- multiStroke ceiling at triple → `effectiveLayerCount` divisor 30 → 12
- Path-corner sampler — pure-line paths use corners not 12px sampling
- Tall-thin shapes → `svgBBoxMin` from `min(w,h)` → `sqrt(w*h)` geomean
- Filter-ID collision (recipe vs dedicated for wet-ink/charcoal) — skip recipe filter for those
- Wet-ink filter rewritten: crisp SourceGraphic + dilated/blurred halo composite (was "blur mask")
- Charcoal grainIntensity default 4.0 → 3.0 (4.0 shredded small shapes)
- effectiveWobble floor 0.3 → 0.5 + curve-path sampleSpacing /8 → /6 (quick fixes; smart-system will replace)
- Narrow `fillStyle` override in `smartHachure/index.ts` — user picks the GRAMMAR of classifier-chosen fills (don't lift gap/weight/opacity, don't recurse `<g>`, don't override no-fill roles)
- Newsprint MODIFIER_SETS_BY_STYLE adds dotSize + dotSpacing; both wired into stipple texture recipe (dotSize → scale multiplier, dotSpacing → inverse baseFrequency)

**Jaggedness modifier added** (per Sebs's "splinter toggle" mental model):
- New `m.jaggedness` (0-2, default 0.6) — independent of wobble amplitude
- `injectJaggedness(points, jaggedness, seed)` inserts perpendicular alternating zig-zag intermediates between consecutive sampled points
- `canUseBuiltPath` gated on `m.jaggedness <= 0.05` so rect/circle/ellipse/line route through points pipeline at any non-zero jaggedness
- Also injects on basePath fill boundaries
- Verified 197/197 shapes respond at jagged 0 vs 2 (visual + pixel-mean-diff scoring)

**Day 7 `/canvas` shipped at v1:**
- Replaced placeholder with `DrawSurface` — pointer-event capture, `perfect-freehand` `getStroke` for live preview polygon
- 3-column layout: input dock · canvas · SmartHachureChrome
- Auto-enables `?smartHachure=1`
- **Done/Edit/Clear flow** (per Sebs 2026-06-09 "don't auto-add object when I lift pen"): strokes stay as raw polygons until user clicks Done; Done routes them through `SvgStyleTransform`; Edit reopens preview
- SVG upload via raw markup injection (svgson available for future AST work) + sanitize `<script>`/`on*`
- `eventToSvgPoint` uses `getScreenCTM().inverse()` so strokes map into viewBox not raw pixel deltas
- Background commit layer renders strokes as **stroke-only polylines** (not perfect-freehand filled polygons) — Smart Hachure outline filter drops filled paths, so stroke-only is the only shape that survives the pipeline

### Open thread — wobble debug (next session START HERE)

**Sebs's last screenshots (2026-06-09 ~12:52 PM):**
- Uploaded `/Users/sebs/Downloads/rose_line_art_cropped.svg` → /canvas → Upload SVG → Rough hand-drawn = CHAOS (crisscross diagonal lines all over the rose)
- Drew a heart → Done → Rough hand-drawn = visible BRAIDED/wire wobble character on thin polyline (not the smooth flowing wobble he expects)
- Same audit page at wobble=2 looks correct on curated trophy wall shapes

**My initial hypothesis** (proposed, NOT verified): rose chaos = Smart Hachure hachure fill-replacement on the rose's filled paths; heart braid = multi-stroke 'double' + jaggedness 0.6 zigzag on thin polyline.

**Sebs corrected** in his last message: jaggedness was at 0 in the audit screenshot, so the wobble character difference can't be jaggedness. Wants **full debug mode on wobble** to find the actual root cause.

**Repro recipe for next session:**
1. Load `/Users/sebs/Downloads/rose_line_art_cropped.svg` (confirm still there)
2. Open `localhost:5182/canvas?smartHachure=1`
3. Click "Upload SVG", pick the rose
4. Set style to "Rough hand-drawn"
5. Compare wobble character vs `/audit` at same settings
6. Enable `window.__dd_diag = true` in console to log per-shape signals
7. Identify why wobble character differs between curated SVGs and arbitrary input

**Do not** patch blindly per `feedback_never_declare_fixed_without_regression_check` memory. Baseline → diagnose → minimal fix → all-197 regression check → only then claim done.

### Working tree (uncommitted from last session)

```
M src/app/components/DeskDoodles/DeskDoodlesCanvas.tsx
M src/app/components/canvas/SvgStyleTransform.tsx
M src/app/components/chrome/SmartHachureChrome.tsx
M src/app/components/chrome/modifierSpecs.ts
M src/app/lib/smartHachure/index.ts
M src/app/routes.tsx
M src/app/state/F3RoughModifiersContext.tsx
?? audit-runs/
?? src/app/components/DeskDoodles/DeskDoodlesAudit.tsx
?? src/app/lib/items/PegToolShape.tsx
```

Most are part of the wobble investigation. `audit-runs/` is the catalog output — keep, commit as evidence trail.

### Memory entries written 2026-06-09 session

- `feedback_no_sampled_verification_claims.md` — never claim "checked all" after sampling
- `feedback_fillstyle_slider_must_switch_classifier_pick.md` — narrow override 4 lines only, don't drift
- `feedback_never_declare_fixed_without_regression_check.md` — baseline-screenshot 6 reps + sweep before claiming done
- `project_smart_layer_foundation_via_audit.md` — /audit catalog IS the smart-layer training dataset
- `project_desk_doodles_draw_panel_vs_desk_canvas.md` — `/canvas` is draw-primitive test; real flow = separate desk canvas + draw panel popup

### Doc updates (in portfolio repo, drive Desk Doodles)

- `09-LOCKED-MODEL.md §I-11` — Roughness reframed as multi-toggle Surface Texture system (texture × textureIntensity × roughness compose); stipple already partial-wires roughness
- `makeathon-plan.md §8.6` — added "Manual-toggle smart-layer foundation" framing + "Explicit issues parked for smart-system" list (fillStyle on no-fill shapes, rough-handdrawn variance by complexity, wobble per-element-type ratios, curve-path crinkle)
- `07-architecture-ml-pipeline.md` — sibling "Per-shape breakage catalog" section + two-part build framing (recognition system + audit catalog as bootstrap dataset)

Source-of-truth locations:
- Plan: `~/Desktop/Projects/portfolio/portfolio-system-lab/docs/labs/hero/cells/F3-smart-hachure-system/makeathon-plan.md`
- Locked model: `…/F3-smart-hachure-system/09-LOCKED-MODEL.md`
- Shading calib spec: `…/cells/F3-shading-calibration-spec.md`

### Dev server state

- Desk Doodles Vite at `http://localhost:5182/` — last known up (verify on session start)
- Hero-8-Lab Vite at `http://localhost:5181/` — last known up
- Homepage Surfaces v2 Lab at `http://localhost:5180/` — last known up

### Outstanding action items

- #53 Make local-codebase beta — daily email check
- Tripo API key rotation — pending from much earlier session
- Day 7 follow-ups: upload-image input mode (placeholder still), 3D mode toggle (button only), first Make upload checkpoint

### Read first next session

- `MEMORY.md` (auto-loads, new entries above)
- This `SESSION-HANDOFF.md`
- `src/app/components/canvas/SvgStyleTransform.tsx` — heavily edited
- `src/app/components/DeskDoodles/DeskDoodlesCanvas.tsx` — new DrawSurface
- `/tmp/dd-audit/index.html` — catalog navigator with all mosaics + per-style dirs (if still present)

---

## Previously current state · 2026-06-08 (Days 1-6 ✅ · pipeline bug pass ✅ · Day 7 next)

### Day 6 closeout — testing-bed playground + chrome rebuild + rendering pipeline fix-up

**What landed (~12 hrs):**

- ✅ **`/playground` testing bed** — collapsible left items panel + collapsible right Smart Hachure controls panel (verbatim port from Hero8Shell row-7 chrome → restyled vertical for app context). Click items to add; drag freely; click ✕ to remove. No anti-cover, no persistence (test bed only).
- ✅ **Day 6 routes** at `/` (home), `/canvas` (placeholder for Day 7+), `/public` (Day 9 placeholder), `/playground` (the testing bed). Old Hero-8-Lab routes stripped, 305 files removed (down from 338-file fork → 33 files).
- ✅ **Custom Dropdown component** restyled — vertical label + pill trigger; popover restyled with 16px corners + soft shadow + 6px-radius option rows. NOT the Hero utility-bar look.
- ✅ **GitHub repo public** at `https://github.com/SXM4434/desk-doodles` — clean commit trail across Day 5-6.
- ✅ **Five pipeline bug fixes** in `SvgStyleTransform.tsx` + `lib/handFeel.ts` + `lib/smartHachure/index.ts` (applied to BOTH Desk Doodles and Hero-8-Lab as source of truth):
  1. **Layer-0 always uses built path** — was swapping layer 0's render function when user picked cross-hatch/parallel-pass, changing the base outline's character.
  2. **`parallelPassScaleFor` step 0.06 → 0.10** — was getting swamped by wobble amplitude, concentric pattern read as random overlap.
  3. **Group-shared pivot for cross-hatch / parallel-pass** — was using per-child centroid → multi-element SVGs (stackedSketchbooks etc.) looked chaotic. Each `<g>` now ALWAYS computes its own pivot (not inherited).
  4. **SVG-level bbox-min for multi-stroke layer count** — `effectiveLayerCount` clamps to bboxMin/30. Per-tiny-child rects (16px tall books) silently downgraded multi-stroke=triple to 1 layer. Now passes whole-SVG bbox-min so user-picked layer count fires.
  5. **Layer rotation/scale via SVG transform attribute** — was mutating points then re-wrapping via `pointsToPolylinePath` which added wobble on top of jitter → secondary layers visibly noisier than base. Now applied as SVG `transform="rotate(angle cx cy)"`. All layers use SAME clean built path → identical line character.

**Method note:** all 5 bug fixes came from a **playwright headless diagnostic** (`/tmp/diag-playground.js` + `/tmp/diag-sweep.js`) that drove the app + captured console + screenshots. Spent ~3 hrs guessing + patching speculatively before writing the diagnostic; took ~30 min after it. Memory: `feedback_diagnose_with_real_data_first`.

### Other landings 2026-06-08

- ✅ Plan grid revision: Day 11 trimmed (ML → Day 13 ladder T2), Day 13 ladder structure (T1 fillStyle / T2 ML / T3 Tripo), Day 14 SUBMISSION-ONLY, Phase 6 buffer days, Build-in-Public discipline (3 designated content days), prize-strategy table (drop Building-with-Purpose target)
- ✅ Public canvas scope expanded M9: infinite Figma-style canvas + anti-cover validator + auto-scatter + mixed-styles default; new stretch S11/S12/S13/S14/S15/S16/S17/S18/S19/S20 for future-tier patterns (drag-publish, Unify toggle, multi-desk pagination, user object gallery, etc.)
- ✅ Multi-tool prize positioning: Weave for video assets (Days 12-13), Agent for logo+intro+UI polish. Sebs confirmed Pro+Weave+Agent access.
- ✅ **Hand Drawn → Desk Doodles rename** across all docs/memory (project memory files renamed too).
- ✅ Day 1 tweet batch drafted (3 posts: intro, engine clip, smoke-test build) — Sebs posted.
- ✅ Standalone repo decision: moved from `apps/Desk-Doodles/` to `~/Desktop/Projects/desk-doodles/` (own product, own GitHub).
- ✅ Local-canonical workflow rule locked: Make is deployment only, never push back to GitHub. `feedback` memory updated.
- ✅ Design principles file at `~/Desktop/design-principles-for-ai.md` — portable craft rules for any AI design task.

**New memory entries 2026-06-08:**
- `feedback_selective_brand_tagging` — hashtag every post, @figma only at kickoff+major milestones+final
- `feedback_dont_parrot_external_ai_screenshots` — extended (2nd incident + "X broken in env Y" SPECIAL RULE)
- `feedback_diagnose_with_real_data_first` — playwright/console FIRST, don't guess for visual rendering bugs
- `project_desk_doodles_no_rapier_in_make` — Rapier intermittent in Make, cannon-es locked
- `project_desk_doodles_local_is_canonical` — Make = deployment only

### Smart Rendering System reconciliation (2026-06-08)

Previously split as M5 + S3 + S6 + S10 + Day 13 T2 — all are ONE unified `signals → classify → treatment` engine applied to multiple decision surfaces. See `makeathon-plan.md` §8.6 for full unified framing. Applies where there's **CONVERSION** (pick discrete option) or **CALIBRATION** (auto-tune parameter from signals). NOT direct-manipulation sliders — those stay direct.

| Toggle type | Examples | Smart applies? |
|---|---|---|
| **Conversion / transformation pickers** | SVG style, fillStyle, texture, penTip, multiStroke, sketchingStyle, palette modes | **YES** — smart pick based on signals |
| **Calibration parameters** | hachureGap per darkness (spec §4), fillDensity per region, hachureAngle per shape orientation | **YES** — smart auto-tune |
| **Direct-manipulation sliders** | wobble, roughness, bowing, strokeWidth, curveTightness, inkIntensity, fillOpacity, blurAmount, grainIntensity | **NO** — direct user controls |

Plus routing layer (engine choice / physics preset / 3D mode) per S6. Plus the cross-axis interconnection matrix (`19-research-cross-axis-interconnection.md`) — values in one cluster affect others.

**Workstream phases (build FULL — don't self-stop at MVP):**
- **Phase A** — per-fillStyle darkness→density calibration (spec §4: hachure / cross-hatch / dots / zigzag / dashed)
- **Phase B** — apply across all 8 shading-capable SVG styles (rough-handdrawn / sketchy / bold-ink / wet-ink / stipple / charcoal / risograph / newsprint)
- **Phase C** — auto-pick conversion pickers (SVG style / fillStyle / texture / penTip / multiStroke) from input signals
- **Phase D** — engine routing (Free Stroke vs Tripo)
- **Phase E** — physics preset suggestion
- **Phase F** — cross-axis interconnection cascade (per `09-LOCKED-MODEL.md` I-13 + `19-research-cross-axis-interconnection.md`)
- **Phase G (post-makeathon)** — generalize engine to other rendering domains. DON'T pre-build the meta-engine — extract when 2nd concrete example justifies it.

This IS the makeathon headline (the wedge: "an intelligent design system that picks the right transformation per region per source").

---

## Previously current state · 2026-06-07 (Day 5 fork ✅ · standalone repo at ~/Desktop/Projects/desk-doodles/)

### Day 5 closeout — Fork ✅

- ✅ Bulk-fork from Hero-8-Lab → 338 files copied via rsync (excluded node_modules, lock, stale .md artifacts)
- ✅ `package.json` mutated: name = `desk-doodles`, added cannon-es + @react-three/cannon + @supabase/supabase-js + polygon-clipping. No @react-three/rapier. No workspace:* deps.
- ✅ npm install clean. Dev server boots at **http://localhost:5182/**
- ✅ Smart Hachure renders at `localhost:5182/hero-8/f3/b/v1?smartHachure=1` — Sebs visual-confirmed 2026-06-07. Engine ported correctly.

**Structural decision — relocated out of portfolio-system-lab.** Original plan put fork at `portfolio-system-lab/apps/Desk-Doodles/`. Mid-Day-5, Sebs flagged: Desk Doodles is its own product (own brand, public-canvas MVP, post-makeathon standalone potential, needs own public GitHub repo for Build-in-Public). Moved to `~/Desktop/Projects/desk-doodles/`. Vite path alias `@smart-hachure` back to portfolio = moot (was never wired; Smart Hachure was duplicated via fork).

**What was NOT done** (per `feedback_fork_a_lab_means_port_everything`): pre-stripping Hero-specific cells. All 60+ contexts + 50+ components ported as-is. Stripping happened Day 6 when we knew what Desk Doodles chrome needed to replace.

### Day 4 closeout — Rapier WASM smoke test DONE (verdict: DEFINITIVE switch to cannon-es)

Smoke test artifact: `/Users/sebs/Desktop/Projects/rapier-make-smoke-test/` (throwaway).

**Refined verdict — Rapier in Make is intermittent, NOT absolute-broken:**
- LOCAL (Vite localhost:5174): both tests green ✓
- MAKE preview: alternates green ↔ red across reloads. Warm cache → green. Cold load (fresh `optimizeDeps`) → `Cannot read properties of undefined (reading 'fg')`.
- Mechanism: WASM fetch race vs `useFrame` first-frame access. Same code, same Make file, behavior depends on cache state.
- **Not fixable from inside Make:** needs `vite.config.ts` `optimizeDeps.exclude` OR top-level await entrypoint — neither available to users.
- 9 of 10 Desk Doodles deps verified loading clean in Make. Only Rapier unreliable.

**Locked decision:** Desk Doodles physics = **cannon-es** (pure JS, no WASM, no race window).

**Process lesson logged:** tested local first would have anchored truth in 5 min. Memory `feedback_dont_parrot_external_ai_screenshots` now has explicit SPECIAL RULE for "X is broken in env Y" claims — always verify in known-good environment first.

---

## Day-1-through-4 source-of-truth

Pre-fork foundation work (I-11..I-14 invariants, playground-native primitives in `f3HandFeel.ts`, chrome row labeling, toggle audits) happened in Hero-8-Lab and was ported to Desk Doodles via the Day 5 bulk fork. Detail history lives in:
- Portfolio handoff archive (Hero-8-Lab era)
- Git history of this repo (Day 5 fork commit onward)
- `09-LOCKED-MODEL.md` in portfolio (the contract)
