# Session Handoff — Desk Doodles

**Per CLAUDE.md handoff rule:** short, factual, action-oriented. Records current state, real changes, locked decisions, unresolved questions, next move. Historical session detail lives in git log + per-system locked docs.

Port-back to Hero-8-Lab / visitor playground / other portfolio surfaces is **post-makeathon triage** (after 2026-06-18 deadline) — don't pre-plan, don't track live, just keep the work clean.

---

## ⭐ SESSION STATE — 2026-06-13 (READ THIS FIRST — crucial cross-session facts)

### 📋 ROUND LEDGER (Sebs tracks work in ROUNDS — keep this current)
- **Round 7** ✅ landed + verified 2026-06-12: 3D chrome split (rock 1 PASS) · conversion D2 v1 (rock 2 — failed on arrow rule, fixed in 7b) · tone brush (rock 3 PASS) · Phase A recalibration (rock 4 PASS, Sebs eyeball pending).
- **Round 7b** ✅ landed + both verified PASS 2026-06-13: Rock X (arrow rod-default + chip, unified `__dd_decisionLog`, real engine options holes/joint/bevel/wall, Tier-2 geometry family pills) · Rock Y (real Wireframe schematic register).
- **Round 8** 🔄 IN FLIGHT 2026-06-13 = shading/fill/shape tools + 3D symmetry + the FIX WAVE + verification + ML start. Done: F1 grid brush · F2 fill/lasso · F3 shape-assist · envmap tan fix (+slab re-fix) · Hatch/Native gap cells · wash-darkness fix · engine crash bugs (Infinity/hollow-circle/phantom) · render outline+riso fix · ML signals-only model trained (92.7% vs 77.5%, committed, NOT wired). In flight: classifier dark-blob re-fix (dense hatch not flat black) · the EXHAUSTIVE AUDIT (197×11 SVG + 3D + toggles low/mid/high vs Clean) + GAP-HUNT + their autonomous fixes. **CLOSES with the FINAL RECHECK** (queue P-FINAL) — re-audit the combined state clean before Round 9.
- **Round 9** ⏭️ = production + forward (each item BUILDS ONLY WHEN ITS FILES ARE COLD — watchdog/collision protocol, see PENDING-AUTOFIRE-QUEUE): wire the 92.7% ML LIVE (gated: classifier cold + golden v3 bless) · vision/LLM layer #3 (scaffolded) · AI-mesh hard 3D path Tripo/fal → default, local fallback (scaffolded, keys Sebs-side ~Day 14) · desk 2D↔3D flip / demo climax (scaffolded) · round-trip back-half OR wedge-reframe (Sebs ruling) · video/Weave + intro animation.
- **BUILD-WHEN-RUNNABLE rule (Sebs 2026-06-13):** nothing builds into a HOT file. Every queued build is gated on its target files being cold (check git status / the watchdog zone map first); colliding work waits in PENDING-AUTOFIRE-QUEUE and auto-fires when free. "Build only when it can be ran."

### 🚨 FABLE 5 SUSPENDED — ALL AGENTS RUN ON OPUS NOW
Anthropic suspended ALL Claude Fable 5 access platform-wide (2026-06-13, US gov export-control directive). Mid-flight Fable agents died with `issue with the selected model (claude-fable-5[1m])`. Session switched to **Opus 4.8 (1M)**. **Launch every agent/workflow with `model:'opus'` (never 'fable').** That error = the suspension, NOT a bug/limit/our-fault. Memory: `feedback_fable_suspended_use_opus.md` (supersedes "use Fable for sub agents"). Restore-check later.

### 🏆 MAKEATHON RULES NOW KNOWN — ELIGIBILITY RESOLVED (full text: docs/submission/makeathon-rules-VERBATIM.md = SOURCE OF TRUTH)
- Deadline **Jun 18 11:59pm PDT**; winners June 23 at Config. 6 prizes ($50k grand / $15k runner / $10k×3 Innovative-Workflow + Building-with-Purpose + Build-in-Public / $5k Community).
- **"Made using Figma's suite (Make, MCP, agent, Local, Weave)" — NOT "built in Make".** Our local+MCP+Make-deploy workflow IS eligible, and the hybrid is an ASSET for the **$10k Innovative Workflow** prize (criterion #4 names "Make, MCP, Local, Weave, agent"). Sebs's Make-thinness worry is RESOLVED — lean into the hybrid pipeline honestly; do NOT claim Make-authored-the-app.
- **REQUIRED to qualify:** video walkthrough (problem+idea+workflow) · live link · **community OR working Figma file link** (⚠️ NEW GAP — we're code-only, need a Figma file/Community post) · **social post #ConfigMakeathon @figma** (required). Bonus +5 social, +5 Figma Community share.
- Prize bets ranked: Innovative-Workflow (strongest) → Grand/Runner (the wedge demo) → Build-in-Public (docs trail) → Building-with-Purpose (WEAKEST — needs a real-problem narrative or concede) → Community Favorite.

### LANDED THIS SESSION (all committed; ~28 commits unpushed to origin/main — PUSH pending Sebs go)
- `5df2931` wash-darkness fix (color-mix read as 8% not 100% ink — the Process-print solid-black flood); 279/1394 golden flips ALL wash-region → **needs Sebs v3 re-bless** (rides with the 1 Phase-A recal flip).
- `905f3ba` F1 shade-brush band-mask rebuild (kills the 3 video glitches: shards/white-caps/dark-stacking) + marker-model accumulation.
- `497372f` R1-R4 research specs (region-fill, shade-brush, shape-assist, shading-axes).
- `89efad1` Rock X (arrow rod+chip default, unified decision log, real engine options holes/joint/bevel/wall, Tier-2 family pills).
- `1eaa853` Rock Y (real Wireframe schematic register).
- `072abe7` **3D SYMMETRY LAW** (every axis node gets BOTH style + property toggle sets — in 3d-mode-controls-spec.md).
- `be7aac7` envmap tan-band fix (see below).
- F2 partial (Brush|Fill|Lasso built, battery PENDING — committed honestly labeled).
- Knowledge page 16 (shading/fill/shape-assist) + index. Memory index rewritten (was over size limit).

### FLEETS RUNNING (Opus; concurrency cap ~16 = SATURATED, more would just queue)
1. `wf_633c5c80` relaunch: F2 verify+harden → F3 shape-assist (draw lane) ‖ envmap adversary re-verify → Hatch/Native gap cells (3D lane) ‖ smash.
2. `wf_cb7e8688` research+sweep: makeathon rules/prizes/Make-framing · submission-gap audit · prize positioning · desk-social regression · 197 2D integrity.
3. `wf_b556a1f2` heavy break/gap: ALL 197×11 style full matrix · modifier-extreme break-hunt · test-coverage gap map.
NEXT WAVE (fires on their results, esp. the gap map): full 197×geometry 3D sweep + draw-loop gauntlet (both deferred — files under active edit).

### ⏳ PENDING SEBS EYEBALL/RULING (the one consolidated review when he's back)
arrow ruling rod-vs-solid (board /tmp/dd-arrow-rule/board.png) · Phase-A A/B board + **golden v3 re-bless** (now includes the 279 wash flips, bug-clean) · Tier-2 family boards (/tmp/dd-tier2/) · F1 preview-opacity 0.55→0.9 · balloon/cushion inflate calibration · Glossy Plastic re-check post-envmap-fix · Hatch grammar board + Native dials (when gap-cells land) · band-7 look policy.

### RATIFIED DESIGN DECISIONS THIS SESSION (don't re-litigate)
- **"Ink without the ink outline"**: fill regions are DERIVED from ink, not gestured — one pool-raster region brain shared by 2D fill + 3D solids/holes. Bucket+highlight = ONE Fill tool; Lasso = the open-space fallback (auto-closes on release with a LIVE dashed chord preview; degenerate flicks refused). Layered gap forgiveness (free stamp-radius tolerance → scrub rescue → lasso → snap); C-shape NEVER fills (anti-fixture law).
- **Marker-model accumulation**: re-stroke same band = +1 darker capped at 7; darker replaces lighter; lighter-over-darker ignored; never average.
- **Shape assist freehand-default LAW**: Snap/Straighten are action VERBS on the last stroke, never modes, never auto-fire; snap stays-a-stroke (replaces points). Vertex editing deferred post-makeathon.
- **3D SYMMETRY LAW**: geometry and 3D-style are independent axes (neither nests); EACH node carries both discrete style toggles + continuous property sliders. SVG-port works on any geometry. Missing cells (Hatch style rows + Native property dials) = the gap-cells rock in flight. Future 3D nodes (AI Mesh) owe both sets too.
- **Tone band visibility**: a band may change grammar per style but NEVER render to nothing (sketchy strips tone — must fall back to flat grey wash; SA-2, pending live confirm).

---

### ENV TAN-BAND FIX LANDED 2026-06-12 — INK-BLACK POLICY VIOLATION KILLED (Stroke3DScene.tsx + NEW tools/3d/material-battery.{html,tsx-harness,mjs}; tsc clean on owned files + build green; 72-cell battery ALL PASS, every board READ)
1. **THE BUG (round-7 verifier, reproduced before fixing)**: glossy/clearcoat materials mirrored the warm Environment as a broad warm-TAN band — battery baseline measured rgb(146,122,96) Δr−b 50 on Glossy Extrude @315° (verifier saw rgb(142,118,91)); glossy rod/inflate @0° Δ49/Δ50. Root cause: the FS rig port "warmed" the env — bg #8a8174 (mid warm grey) + fill #ffd9b0 (Δ79) re-entered via clearcoat/envmap ×1.8. Specular bypasses albedo, so the ink-black base color never mattered.
2. **THE FIX (env re-registration, sheen-flood cure family)**: named `STUDIO_ENV` register in Stroke3DScene — env bg → **#211e1a** (dark warm graphite, warm-axis sibling of FS ancestor #15171a — the bg these material params were CALIBRATED against, per git show origin/main viewport-3d.tsx) · fill #ffd9b0 → **#e8e0d4** (whisper-warm Δ20) · key/rim/streak + ALL panel positions/intensities + all material surface params UNTOUCHED (panels keep clearcoat alive — no Day-11 flat-blob regression).
3. **RIG EXTRACTED FOR TESTABILITY**: `StudioRig` (lights + Environment bake) + `createNativeMaterial(preset)` now EXPORTED from Stroke3DScene — the new material battery renders through the exact product rig (tier2-board omitted the Environment bake, which is the gap that let the tan ship).
4. **BATTERY** (`MODE=baseline|verify node tools/3d/material-battery.mjs`, vite on :4407 or BASE_URL): 6 presets × 8 orbit angles on Extrude slab (48 cells) + glossy/signal × rod/inflate × 4 angles (16) + distinctness strip + hatch/svg-port. Gates: lit-face Δr−b<25 · lum<128 (with concrete specular exemption: real highlight region ≥10% + BODY median dark + warmth passed — a grey or tan rod still fails) · form spread vs baseline · anti-vacuous pixel floor. Post-fix: **72/72 PASS**; hatch + svg-port **sha1-byte-identical** to pre-fix baseline; strip shows 6 visibly distinct ink-black surfaces; real-component proof via audit-sweep page (jet-black slab, neutral highlight). Boards at /tmp/dd-mat/ (BEFORE boards kept for A/B).
5. **FLAG (not mine, tool-side)**: tools/3d/mark-intent-battery-harness.ts + tier2-board-harness.ts carry a LEGACY tool-side material (INK '#5A5043' — the banned bronze — + sheen #d8c9ae, own rig minus Environment) — their boards render warm-brown and will mislead future eyeballs; owners should re-point at the exported createNativeMaterial/StudioRig.
- Sebs eyeball queue: strip board (/tmp/dd-mat/board-strip.png) for the 6-way distinctness · the two PASS·spec end-on rod cells (board-rodinflate.png — bright NEUTRAL specular line on black body, policy-allowed) · glossy extrude @315° neutral area-light sheet (the wet look, was the tan cell).

### ROCK X LANDED 2026-06-12 — CONVERSION RECONCILE + ENGINE OPTIONS + TIER-2 STYLE TOGGLES (geometry3d/** + smart/conversionMap + canvas3d/** + Canvas3DChrome + tools/3d/**; tsc+build clean; smoke 48/48; battery 11/11; tier-2 board 19 cells + arrow board + live /canvas proof — every screenshot READ)
1. **THE ARROW RULE — ⚠ SEBS RULING PENDING**: `TREATED_AS_CLOSED_DEFAULT: 'rod' | 'solid'` in strokeTo3d.ts, set **'rod'** (open-ish stroke → honest open rod + "Open-ish — treat as closed?" chip — the anti-auto-fill read). BOTH variants implemented; the LIVE chip (Stroke3DScene HTML overlay, auto mode only) flips per object either way, every flip logged as a `conversion-correction` training tuple. **Ruling board: `/tmp/dd-arrow-rule/board.png`** (regen: `node tools/3d/arrow-rule-board.mjs`) — pane A rod+chip vs pane B solid+chip, REAL scenes, chip click proven live (welds rod→slab). Sebs picks solid → flip the one literal + re-snapshot the arrow golden. Truly-closed strokes (the heart) stay silent slabs in both worlds; explicit modes never chip. Docs note: conversion-semantics addendum A-2 recommends 'solid' — record the ruling there once made.
2. **RECEIPTS UNIFIED**: conversion receipts + chip corrections flow through `window.__dd_decisionLog` (spec §8's named channel) — conversionMap wraps the window install via defineProperty (load-order safe; smartHachure's collector becomes the wrapped host, its file UNTOUCHED). Entries discriminate by `entryType: 'shading' (added at read) | 'conversion' | 'conversion-correction'`; receipts gain G-10 `renderSurface` (null = honest unwired; ConvertOptions passes it). `__dd_conversionLog` stays as the thin filtered compat alias. Proven live on /canvas: one get() returns 4 shading entries + the chip correction. **markintent-golden.json self-bless STRIPPED** → `status: "candidate — pending Sebs bless"` (v2 = rod-default snapshot).
3. **ENGINE OPTIONS REAL (rock-1 cross-contract closed)**: `buildSolidGeometry/buildPoolSolidGeometry` gained `holes?: boolean` (OFF = filled silhouette) + `edge?: 'crisp'|'eased'`; `buildRodGeometry`/`detectJointPositions` gained `jointAngleThresholdDeg`; `buildExtrudeGeometry(WithHoles)` gained `bevelProfile`/`sideWall`; `buildInflateGeometry` gained `profileExp`. Stroke3DScene's rock-1 local mirrors (detectJointsWithAngle + buildExtrudeNoBevel) DELETED — the chrome drives the engine. Gates flipped: **Solid Holes toggle ENABLED** (pending-chip removed), joint-sensitivity verified live via `__dd3d` (20°→7 · 70°→5 joints on a drawn zigzag).
4. **TIER-2 STYLE TOGGLES** (three-tier amendment, between mode dropdown and sliders): Rod **Cap** round/flat/ink-blob + **Joint** blob/clean (NEW `canvas3d/rodAdornments.ts` = ONE placement source for scene + harness; engine returns endPositions/endDirections) · Extrude **Bevel** sharp/soft/rounded + **Wall** straight/drafted (18% back-face taper) · Inflate **Profile** balloon/cushion/bead (presets OVER the Puff curve — profileExp + aspectScale) · Solid **Edge** crisp/eased + Holes. Defaults = today's look byte-identical (round/blob · rounded/straight · balloon · eased). **FAMILY BOARDS for Sebs's eyeball before lock: `/tmp/dd-tier2/board-{rod,extrude,inflate,solid}.png`** (regen: `node tools/3d/tier2-board.mjs` — renders through the EXPORTED product `buildStrokeWithParams`).
- Batteries: `node tools/3d/strokeTo3d-smoke.mjs` 48/48 · `node tools/3d/mark-intent-battery.mjs` 11/11 under rod default (arrow → line-rod/rod + CHIP(open?)) · tier2-board + arrow-rule-board ALL PASS · live /canvas proof (chip flip rod→extrude, unified log, family pills → `__dd3d`, zero DB writes). /desk regression: loads clean, untouched.
- Known smalls: Solid Holes only bites when the raster yields odd-depth loops (ring-of-arcs ink; two closed circles scanline-fill to a disc by design) · joint-sensitivity discriminates near-hairpin interior angles 20–70° (FS formula semantics, verbatim port — "lower = blobbier" holds) · chip overrides are scene-local (signature-keyed); record persistence rides the conversion-wiring round.

### ROCK Y LANDED 2026-06-12 — WIREFRAME REBUILT FOR REAL (Sebs "build it fr real" — overrides Rock B's stub removal; owned files: SvgStyleTransform + F3SvgStyleContext + modifierSpecs; tsc+build clean; battery 21/21 PASS + rockb C4/D re-pass, every screenshot READ)
1. **THE REGISTER**: `applyWireframeSchematic` — every renderable leaf goes stroke-only at ONE uniform weight in SCREEN px (`vector-effect:non-scaling-stroke` — a 682×986-viewBox upload and a drawn doodle render the same hairline; without it user-space hairlines vanish on big viewBoxes). Painted fills (computed-style resolved: inherited `<g>` attrs, CSS classes, currentColor, SVG default-black) are REMOVED and their boundary renders as a line at the lighter construction register (0.75× weight, stroke-opacity = fillOpacity); source-stroked geometry = primary contour (full weight/opacity). Ink fixed to `var(--dir-text-primary)`. NO hand-feel structurally (never enters rough/smartHachure; applyTexture skipped at call site). Simplify rides along (doc-22 ε(s)=3×4^(s−1)) on POLYLINE geometry only (M/L paths incl. relative+H/V, polyline/polygon) — curves keep true geometry, never faceted. Pass-through: text legible, `<image>` raster honest pass-through (NEVER a bounding box), defs/clipPath/mask/pattern/marker/symbol/gradient subtrees untouched. Invisible geometry stays invisible.
2. **HONEST CHROME**: dropdown restored (11 styles) with detail "Uniform hairline schematic — contours only. True geometry, no hand-feel." MODIFIER_SETS = exactly [strokeWidth, simplification, fillOpacity, inkIntensity] — all four proven live at min/max; wobble/multiStroke/penTip/texture/palettes deliberately ABSENT (suppressed, not hidden-but-active). Preset: hairline 0.75, fillOpacity 1.0 (construction feel = dial down), hand-feel keys pinned 0.
3. **LEGACY ROUND-TRIP FLIPPED**: persisted `wireframe` render_configs (which fell back to rough-handdrawn after Rock B) now parse + render as REAL wireframe — proven non-vacuously (rockb C4.1 passes with the change, fails `rough-handdrawn` with it reverted). tools/rockb battery C4/D updated to the new reality (comments cite Rock Y).
4. **ZERO PERTURBATION PROOF**: existing styles byte-identical pre/post (21 screenshot pairs, 0 differing px — audit cells ×3 styles + drawn + rose); classifier golden-diff pre-vs-post = ZERO flips, entry set identical. (The 1 flip vs blessed v2 — ga7tp7 text[7] — pre-exists at HEAD, it's the known Phase A v3 re-bless pending, isolated by reverted-build snapshot.)
- Battery: `node tools/rocky/wireframe-battery.mjs` (vite preview :4399 per HMR-churn rule — Rock X/F1 edit this tree live; `DD_BASE` env on all rocky+rockb harnesses now). Fixtures: rose line-art (THE anti-fixture — old stub drew bounding boxes on it; now true petal contours, asserted rects=0) + filled-rose variant + strokes-over-upload merged markup (contour & boundary registers coexist, widths 0.75/0.5625). Shots → /tmp/dd-rocky/.
- KNOWN (not mine, pre-existing): rockb C1 synthetic-UPDATE check fails with target at negative left (-342px) WITH AND WITHOUT my change — harness/data brittleness in wrapperAt position lookup, flag to DeskPage owner.

### ROCK B (round 7) LANDED 2026-06-12 — RESILIENCE + REALTIME + WIREFRAME REMOVAL (DeskPage + publish.ts + SvgStyleTransform + F3SvgStyleContext + NEW chrome/PanelBoundary.tsx; tsc+build clean; battery 30/30 PASS, every screenshot READ)
1. **PANEL BOUNDARIES**: NEW `chrome/PanelBoundary.tsx` (class boundary; quiet "This panel hit a snag — reload to restore" + Reload-panel pill that key-bump REMOUNTS; popup variant = fixed centered card + Close pill; DEV-only `window.__dd_crashPanel='<label>'` crash probe for batteries). Wrapped in DeskPage: drawer (`drawer`), right pen panel (`pen-panel`), DrawPanel (`draw-popup`), both ObjectSurface mounts (`object-surface`/`drawer-surface`). Verified: each panel killed individually → desk + 23 objects untouched, retry restores, popup Close dismisses.
2. **STYLE-ENGINE DEGRADE-TO-RAW**: SvgStyleTransform's transform effect is try/caught — a throw clears the fx clone and shows the SOURCE markup raw (visible, honest) + ONE console.warn per instance; every effect re-run resets to canonical layout first (degrade never sticks past the next good pass). Proven via test-page monkeypatch (connected-svg cloneNode throws): 23/23 objects render raw, control restores styled.
3. **REALTIME DELETE+UPDATE**: publish.ts subs take `{onInsert, onUpdate?, onDelete?}` (one channel, three listeners). DELETE is bound UNFILTERED on purpose — postgres_changes DELETE old records carry ONLY the PK, so a desk_id filter would suppress every event; client id-match desk-scopes it. DeskPage: delete removes (final, even mid-drag); update applies x/y/rotation+name/why+svg+render_config EXCEPT the locally-dragged object (don't-fight-the-hand, proven mid-drag); `configRaw` fingerprint keeps the parsed config REFERENCE stable on position-only echoes so the art memo never re-runs rough.js for a 2px move. Proven BOTH ways: synthetic payloads through the real channel bindings (zero DB writes, reload-restores asserted) AND true two-context realtime (one sanctioned UI row: publish in A → B sees insert → A drags → B sees move → A UI-deletes → B sees delete; row verified gone).
4. **WIREFRAME REMOVED** (Sebs ratified): meta entry deleted from F3_SVG_STYLES (kills the dropdown option + every parser's membership check → persisted wireframe configs fall back to rough-handdrawn at parse — verified live, non-vacuous control); `applyWireframeTransform` + render branch + CSS rules deleted; the id stays in the F3SvgStyle UNION (deprecation note) so unowned `MODIFIER_SETS_BY_STYLE`/`STYLE_PRESETS` Records keep typechecking. Real wireframe rides the 3D work post-makeathon.
- Battery: `node tools/rockb/resilience-battery.mjs` (dev on :5182; `ONLY=A,B,...` phase filter; shots → /tmp/dd-rockb/). Phase E is the one sanctioned live row — UI-deleted + verified each run.

### ROCK A r7 LANDED 2026-06-12 — CREATE-SURFACE SMASHER-B FIXES (DrawPanel + smartPick only; DrawSurface untouched; tsc+build clean; battery 18/18 PASS, every screenshot READ)
1. **SMART-PICK CHIP HONESTY**: any manual style/control change after a pick (Style dropdown, any slider/dropdown via onMod, Reset) DISMISSES the chip — quiet 220ms fade (`data-fading` + pointer-events off), logged as NEW `'overridden'` event in `window.__dd_inputPickLog` (kept separate from 'undo' for training data). Undo only exists while the pick is untouched; restores the immediately-prior pen (verified: prior→pick→undo round-trip). The pen KEEPS the manual choice (Bold ink survives — no more revert-to-pre-pick lie).
2. **UPLOAD-REMOVAL STRANDING**: Remove with strokes/tone present keeps the work (DrawSurface never unmounts), auto-switches input register to Draw, Done works on the strokes alone → naming stage; honest caption-slot note "upload removed — your strokes stay" (5s, clears early on input switch/new file). Chip dismisses too (its pick described the removed file). Strokeless Remove unchanged (back to picker).
3. **INK|SHADE CAPTION CRUSH**: register row relaid — pills flexShrink:0, caption is the ONE flexible item (flex 1 1 0, nowrap, ellipsis, full text via title), row wraps ONLY the Replace/Remove cluster at narrow. Verified single-line at true-1180 (viewport 1700; all 6 buttons same y), 856 (desk-inset width), and 636 narrow clamp.
- Battery: /tmp/dd-smash/rA-battery.js (18 checks, exit-1 on fail) + rA-01..11 shots. Writes intercepted (LIVE-DB rules — zero rows created).

### ROCK 2 LANDED 2026-06-12 — CONVERSION D2 v1 (geometry3d/** + smart/conversionMap.ts + tools/3d/**; tsc+build clean; smoke 36/36; battery 11/11 PASS, every screenshot READ)
1. **3-STATE CLOSURE** (amendment + addendum ch.1a): `closureStateOf` in strokeTo3d.ts — closed < max(8px, 2.5% diag) → silent slab; treated-as-closed up to max(24px, 8% diag) → solid + `treatedAsClosed` flag (rock 1 renders the chip from `ConversionReceipt`/`ConversionUnit`); open → rod. `isClosedStroke` boolean unchanged (= solid family) — zero live regression.
2. **PARITY HOLES** (D2-B ON): pool raster promoted to THE region extractor — `extractPoolRegions`/`extractStrokePoolRegions` (+`REGION_EXTRACTOR_VERSION`, deterministic, cacheable) + `containmentDepths` generalized out of Solid; `buildExtrudeGeometryWithHoles` cuts nested drawn loops at odd depth as `Shape.holes` (donut verified visually + smoke).
3. **MARK-INTENT v1** (geometry-register rules): NEW `geometry3d/markIntent.ts` — arc-length-resampled features (reversalFreq w/ 2-segment hairpin window · selfIsect · hullCoverage · turnSum/spiral w/ bbox-aspect compactness gate · dotness) → structure / shading-gesture (tone band onto region, ZERO geometry) / fill-intent (raster envelope, one clean mass, band 7); composite endpoint-graph loops (two-arc fix); parallel-hatch + dot clusters; contained ink/patches RIDE the host face (addendum §1.4).
4. **NEW `smart/conversionMap.ts`** — treatment vocabulary + upload-register role→treatment table + §4 per-mode matrix + **`ConversionReceipt` contract** + `window.__dd_conversionLog` collector (QW-1; training data live). NEW `geometry3d/convert.ts` — `convertStrokePool(strokes, {mode, holes, …})` → `{units, receipts, analysis}`; auto = D2 pipeline; explicit modes stay sacred (I-1) w/ extrude inheriting parity holes. **Scene/chrome wiring = rock 1's contract, not done here.**
5. **BATTERY**: tools/3d/mark-intent-{fixtures.ts, battery.html, battery-harness.ts, battery.mjs} + markintent-golden.json — 10 spec fixtures + donut extra; run `node tools/3d/mark-intent-battery.mjs` (dev on :5182) → /tmp/dd-mark-intent/ shots+table; exits 1 on golden mismatch. Smoke suite extended to 36 checks.
- Classifier UNTOUCHED (paper@0.9 re-bless ceremony separate). Known smalls: spiral raster leaves a pinhole at the spiral's start (honest envelope, eyeball call); mark-intent thresholds PROVISIONAL per MI-F (battery-calibrated, live-desk sweep before lock).

### ROUND 7 SPEC ADDITIONS (Sebs 2026-06-12 ~11:56, from 3D testing screenshots — ALL ratified direction)
- 3D CHROME SPLIT (locked rule: separate Style dropdowns per renderer): in 3D mode the right panel shows 3D controls ONLY — 3D STYLE dropdown (Native / Hatch / SVG-port) + per-geometry param sets. The 2D SVG chrome appears ONLY under the SVG-port style (it then drives the ported treatment). Today the 2D panel shows in 3D doing nothing = reads broken.
- PER-MODE FULL PARAM TOGGLES (never trim): Rod (radius/caps/joint blobs), Extrude (width/depth — PORT free-stroke's tuned param+perceptual-slider system), Inflate (base/tip radius, pressure influence — constants exported), Solid (ink radius/fill). 
- SVG-PORT style option = the M8 port (not built; round 7).
- TONE-FILL/SHADE-BRUSH input (the fill stuff — fell off the grid, Sebs asked): second draw register brushing discrete darkness levels; feeds source-darkness -> all renderers. Round 7.
- Desk 3D = lens + shared Hatch + auto geometry; hatch uniforms from the Shading sliders (uses coverage.ts bands — one math two renderers).
- ROUND 8 NOTE (Sebs): hard path (AI mesh) becomes the DEFAULT 3D when available; local geometry modes stay as options + fallback ladder.

### QUEUED ROUND 6 — HEADER CRAFT PASS (Sebs 2026-06-12 ~11:43: "chrome lacking proper spacing and alignment, doesn't scream craft and care")
DeskPage header relayout spec: ONE baseline for wordmark / desk name / count (currently three ad-hoc baselines); consistent 12px gap rhythm inside clusters + 20px between clusters; the zoom cluster (- % + FIT) groups as ONE visual unit (shared bounding treatment or tighter internal gaps); Pen|Desk caption ("styling your next doodle") aligns under its pills, never floats; LIVE chip vertically centers with the pill row; DRAWER toggle sits with the identity cluster (wordmark side) with breathing room. Chevron-grammar fix DONE (committed). Files: DeskPage (wave-5 owns; fire after).

### QUEUED ROUND 6 — DRAWER v2 (Sebs 2026-06-12 ~11:35 + screenshot)
1. 2-col grid of MINI COLLECTIBLE CARDS (ObjectCard mini variant — TCG frame, the one marks stat, name banner) — kills the one-row-too-much-scrolling problem; full premium card treatment (shine/colophon) still rides the 06-16 identity pass.
2. DRAG-TO-PLACE: drag a card from the drawer onto the desk, drop = copy published at the drop point (screenToDesk exists); Place-here pill stays as keyboard/fallback path.
3. Drop animation = REUSE the ratified doodle-lands moment (two celebrated motion moments only — no third family; restraint per feedback_push_back_on_overadding, Sebs agreed framing).
4. CLICK-TO-OPEN: drawer card click opens the SAME Edit ObjectSurface (one surface everywhere; drawer cards are always yours).
Files: DrawerPanel + DeskPage (wave-5 rock A owns them; fire after it lands).

### ROCK B LANDED 2026-06-12 — CREATE-SURFACE BATCH (DrawPanel + DrawSurface only; tsc+build clean; every flow playwright-driven + screenshots READ)
1. **STYLED NAMING PREVIEW** ✓ — minting card renders staged art through nested F3 providers + StagedRenderScope (local mirror of ObjectSurface SurfaceRenderScope — not exported there) + SvgStyleTransform under the live pen. Verified: rough-handdrawn doubled ink in the well, never raw 3px hairlines; works for drawn, plain-upload AND merged draw-over staging.
2. **ESCAPE = ONE LAYER / SCRIM SAFETY** ✓ — naming→Back (strokes intact); compose+strokes → first Esc ARMS visible footer confirm ("press Esc again…", 3s disarm), second closes; compose empty → close; scrim-click w/ strokes = arms (non-destructive), staged = no-op, empty = close. All verified incl. true-scrim coordinates.
3. **SIZE-CAP HONESTY** ✓ — Place measures normalizeSvgSize(staged,180).length vs 65536 (the publish_to_open_desk/harden cap); over-cap → honest accent note (~NNKB) + popup STAYS + **real "Shrink to fit" pill** (point decimation on a copy; live strokes keep full fidelity) + receipt; exhausted/no-stroke variants honest. NOTE: copy says shrink-to-fit NOT "Simplify" — the Simplify slider is render-time only and does NOT shrink the stored svg (the suggested copy would've been a false claim).
4. **UPLOAD PARITY** ✓ (a) Sketch|Style pills shared with uploads — Style renders upload through the pen live; (b) DRAW-OVER: upload letterboxes into the 800×600 frame as backdrop, strokes on top; Done merges via **inverse-mapping strokes into the upload's local coords, flat, NO transforms** — a `<g transform>` merge rendered tiny/broken through smartHachure (row-9 getCTM flatten deferred — caught by screenshot, fixed); (d) preview fills the pane; un-embeddable files (no viewBox/size) get an honest no-draw-over fallback. Input switching never destroys strokes (DrawSurface stays mounted; upload states are opaque covers). **(c) STRETCH path-to-stroke conversion NOT built** — sampler lives in SvgStyleTransform (other rock's file) + needs imperative stroke injection; queued.
   - **MERGED OBJECTS RECORD NO STROKES (deliberate):** ObjectSurface Re-draw Done rebuilds svg from strokes ALONE → would destroy the upload half. Until Re-draw is backdrop-aware (ObjectSurface rock), merged objects take the honest legacy note instead of a data-loss path. Flip: record capStrokes in DrawPanel handleDone upload branch once safe.
5. **NARROW-VIEWPORT CLAMP** ✓ — DrawPanel scrim paddingRight/Left clamp ≥640px popup floor (ObjectSurface pattern); verified 1440/1100/900px. `leftInset` prop interface landed (cross-rock with DeskPage).
- Sanctioned live cycle done: published "rock-b verify" → Edit → Delete via UI, desk back to baseline. /canvas + plain-upload regressions screenshot-verified clean.

### UX-AUDIT FIX BATCH (fires with the mega-sweep when wave-5 frees DeskPage/DrawPanel)
1. LEGACY-ROW FREEZE (DeskPage): null render_config rows pin to a DEFAULT snapshot at load, so Pen-scope slider moves stop restyling the (mostly-legacy) live desk — makes the Pen|Desk pill legible (D-7 contradiction found by audit). Optional later: one-time backfill SQL.
2. ~~NAMING-STAGE STYLED PREVIEW (DrawPanel)~~ DONE by rock B (see ROCK B LANDED above).
3. ~~ESCAPE/SCRIM SAFETY (DrawPanel)~~ DONE by rock B. STILL OPEN from this item: consider collapsing the desk panel while the popup is open (audit: two identical pen columns on screen; the familiar one is a discard trap).
DONE ALREADY: in-flight stroke full-ink (37c73cc) - honest save-note copy - re-draw persistence (v5 pasted + RPC-verified live).

### QUEUED: FULL-CATALOG 3D SWEEP (Sebs 2026-06-12: "we have a lot of objects, using ALL of them would be good")
The round-6 3D rock builds the harness + sweeps >=40 representative shapes. The moment it lands, fire the FULL run: ALL 197 catalog shapes x 5 geometry modes (985 renders) through its harness, per-item table, auto-flags (empty/blob/NaN), contact sheets read. Also queued: 3d-mode-controls-spec.md (research in flight) feeds round 7's per-mode toggle build; test-gap audit report -> next sweep priorities.

### QUEUED: MEGA IMAGE-SWEEP (Sebs 2026-06-12 — fire the MOMENT wave-5 lands)
Debug + edge testing, IMAGE-CHECKING heavy (every claim = screenshot READ): all 5 geometry pills visually distinct at 2+ orbit angles · 2D↔3D flip integrity · Sketch|Style at every stage · drawer copy round-trips · smart-pick chips · regression baselines for desk/popup/gallery. v4+v5 PASTED + RPC-verified (strokes survive). SVG→3D style-port toggle = M8, not built — sweep establishes its baselines.

## Current state · 2026-06-11 EVENING (Day 10 — COMMITTED+PUSHED · D-7 model LOCKED · build fleet paused on session limit)

### THE LOCKED CONTROL MODEL (D-7 + amendments 1-4, full chain in docs/design/global-toggles-and-mixed-3d.md — READ THAT DOC before touching desk controls)

Sebs ratified the whole thing 2026-06-11 evening after several rounds — the doc is the contract:
- **Pen | Desk gate** (explicit pill in desk panel; default Pen/OFF).
- **Global OFF = the MIXED desk. Records rule.** Panel changes touch NOTHING on the desk — they style the preview squiggle (REQUIRED, instant, Procreate-style), the draw popup, and the next doodle (render_config snapshot at Done). Objects keep own style AND own mode (2D + 3D side by side). Desk changes only by direct acts: drag own / Edit own / delete own / new arrivals.
- **Global ON = the UNIFORM desk. The toggles own EVERYTHING — all of them, including mode + geometry.** Viewer-local lens, initializes from current pen values (panel never jumps), lifts cleanly on switch-back. Geometry dropdown (Auto/Rod/Extrude/Inflate/Solid) — "Auto" is just the default VALUE (shape decides: open→rod, closed→extrude), set Rod and ALL are rods. 3D style = shared Hatch interim (D-4), per-style twins after M8 (port from free-stroke style-system.ts). Both directions: 3D→SVG renders all under current 2D toggles too.
- **Style sweep never converts (re-renders strokes); mode flip converts FROM THE RECORD via D-3 ladder** (strokes→geometry, cached; no strokes→outline-extrude, else honest paper card; never skip).

### Session-limit pause + EXACT resume (2026-06-11 ~17:25 ET)

Build fleet wf_72ae3af6-a35 (Pen|Desk+perf · UX fix-nows · slider dead zones · reliability): **3 of 4 build agents died on "session limit · resets 9:10pm ET"** (~3.5M agent tokens burned today). Reliability script COMPLETED. Reruns before 9:10pm die instantly — DON'T.
**RESUME (after 9:10pm ET):** `Workflow({ scriptPath: "/Users/sebs/.claude/projects/-Users-sebs-Desktop-Projects-desk-doodles/166ddaed-f4e6-429a-a87f-63a995593063/workflows/scripts/desk-doodles-ratified-build-wf_72ae3af6-a35.js", resumeFromRunId: "wf_72ae3af6-a35" })` — completed agents return cached; failed re-run. The pen-desk prompt was UPDATED in that script (items 8-9: preview squiggle + amendments 2-4) before resume, so the re-run builds the final model.

### Done this evening (all COMMITTED `558caba..94a6a99` + PUSHED to origin/main — keepalive Action is ARMED)

5 commits: engine fixes (pen-tip ink survives + re-ink line-feel + Reset + dropdown) · desk social slice (pan/zoom, ObjectSurface Edit/Sandbox, cards+handles, gallery mini-desks, RPCs, 2-scale grain) · 3D foundation (rod/extrude/inflate/solid lib + R3F scene, UNWIRED, 29/29 smoke) · docs wave (D-1..D-7, smart-system FULL-scope ladder per Sebs "no cuts", demo-video plan, identity candidates, router spec, submission checklist, slider-sweep receipts) · keepalive.

### Sebs ratifications tonight (beyond D-7): the 47-item decision board — all recs accepted ("gooo")

Highlights: **identity = II Warm Riso Press** (06-16 pass) · mint-only card shine · VO+captions ~3:10 video · interim Make checkpoint 06-13 · drawer = passive cross-desk index, left panel, pre-demo · router = Haiku publish-then-revoke lenient · smart system FULL A-F (no MVP cuts — Sebs explicit) · foreign-drag block · newest-on-top. Full list in the 2026-06-11 conversation + per-doc decision tables.

### STILL PENDING
- **Stray wipe (Sebs approve at prompt):** delete 4 unnamed agent doodles, sessions 65f21b25/a973e2b7/05130373/f6c38f9d (20:27-20:45) via delete_my_doodle; KEEP session 52281805 (Sebs's 8) + the 4 named seeds.
- Resume fleet at 9:10pm → then: 3D wiring (/canvas gate, PORT-FIRST from free-stroke origin/main via git show — local checkout stale) → smart Phase C → README voice pass (draft in submission-checklist §3) → og-image after 06-16 identity pass.

---

## Previous state · 2026-06-11 PM (Day 10 — pen-tip/reset/grain/dropdown fix batch + 3D rocks fleet)

### Pen-tip + toggles + reset + grain fix batch (06-11 PM, uncommitted; tsc + build clean; all browser-verified via playwright + screenshots)

- **Pen-tip vanish FIXED**: penTip ≠ plain outputs FILLED perfect-freehand polygons; smartHachure's outline filter (index.ts ~269, strips real fills) dropped them → every stroke blanked on any tip change. Fix: `data-pen-tip-ink="1"` tag at creation (SvgStyleTransform ~1125) + filter keeps tagged ink. Verified: all 12 desk objects render under chisel/pencil-2b.
- **Line-feel toggles dead on non-plain tips FIXED**: pen-tip branch fed RAW anchors to penTipPath, bypassing wobble/bowing/curveDamp/jaggedness (they live in the path builders). Fix: build the plain-mode `d` first, resample via NEW `samplePathForPenTip` (~4px spacing, cap 256), ink THAT. Verified: wobble/bowing/jaggedness visibly change chisel ink; plain-mode desk screenshot BYTE-IDENTICAL pre/post (regression clean).
- **Reset button FIXED**: presets carry no penTip/endpoint/sketching/palette keys, so preset-onto-current merge left them stale. Fix: `DEFAULT` → exported `DEFAULT_MODIFIERS` (F3RoughModifiersContext); chrome Reset = `applyStylePreset(DEFAULT_MODIFIERS, svgStyle)`. Style-SWITCH keeps merge semantics (tip survives switching; Reset = true baseline). Verified: chisel→plain, wobble 2→0.4.
- **Paper grain VISIBLE**: 0.05 opacity was imperceptible (1:1 A/B proof). deskCraft PAPER_GRAIN → 0.22 (f0.8 fine tooth; coarser variants went blotchy — A/B at /tmp/grain-ab2.html). Sebs may want to dial.
- **Dropdown cutoff FIXED for real**: root cause = popover 480px vs trigger 323px → bulged past the right panel to screen edge. Fix: menu width == trigger width (native-select), opens under trigger, flip-up + maxHeight clamp retained. Verified: all menus alignedToTrigger + onScreen at 1440/2000px.
- **Disappear-on-load reload-flash** (earlier): smartHachure force-reload effects removed from DeskPage + DrawSurface.
- **Fable fleet LANDED (wf_c44fa189)**: ① /desks gallery mini-desks (6 most-recent doodles, deterministic scatter, shared PAPER_GRAIN/WARM_POOL, sanitized, CHIP badges) — verified pass. ② .github/workflows/supabase-keepalive.yml (daily cron + manual; inert until committed/pushed; publishable key inline = intentional) — verified pass. ③ docs/design/3d-roundtrip-build-plan.md — build-ready: strokes SURVIVE Done on /canvas but are DISCARDED at DrawPanel→DeskPage; MVP 3D mounts on /canvas; Rod/Extrude via new geometry3d lib; procedural 8-band hatch post-process (uniforms from existing Shading sliders).
- **Fleet RUNNING (wf_b4c385c5)**: ① docs/design/global-toggles-and-mixed-3d.md (Sebs's mixed-treatment 3D-toggle semantics question — option space + precedents + Sebs-decisions flagged). ② geometry3d lib build (strokeTo3d.ts + Stroke3DScene.tsx, NEW FILES ONLY, native-first, no new deps).
- **SOCIAL FLEET LANDED (wf_02eb1cdc, all verified ✓):** ① PAN/ZOOM live on /desk — 25%–400% cursor-anchored zoom, empty-desk drag + 2-finger-scroll pan, −/%/+/Fit pills in header, Cmd+0 reset, desk coords camera-independent (verified vs live DB: drag at 212% zoom → row x/y == style 0.00 delta), modals unscaled, grain zooms with desk. Known smalls: +/- pills step ×1.25 (never exactly 200%), no pan leash (Fit recovers), no touch-pinch (scope was wheel/trackpad). ② SANDBOX LIVE-CONTROLS — nested F3 providers wrap just the card; 3 sliders + style dropdown scoped local; desk byte-identical both directions; reset on close. ③ SOCIAL SMALLS — friendly handles (@doodled-finch style, "you" for own), no raw UUIDs anywhere, publish double-read removed, empty-art guard. ④ DRAWER = report only, 7 Sebs questions (stash-vs-index is load-bearing; recommended passive index, left CollapsiblePanel, half-day build).
- **PERF ALARM (fleet-3 diagnostic, receipts /tmp/dd-perf/):** dragging ONE object re-runs the FULL pipeline on ALL N per pointermove — 5fps at 30 realistic objects, ~1fps at 120. Memoization fix = FIRST main-thread rock now that DeskPage is free. Same root cause hits pan/zoom + realtime inserts. Also: newest doodle renders BOTTOM of stack (buried under scatter) — z-order fix should ride the memo slice.
- **Leg-up fleet LANDED (wf_1a10cbb2):** demo-video-plan.md ✓ · 25-research-own-design-language.md (3 identity candidates; 2 citation defects patched by main) · vision-router-spec.md (price defect patched) · submission-checklist.md ✓ (README says "Day 5 of 14" publicly! Contra URL ≠ entry; Make ~47 files stale → interim checkpoint 06-13 recommended) · cap-perf diagnostic (above).
- **NEXT**: per-object memoization + newest-on-top (main, DeskPage now free) · wire geometry3d into /canvas honesty gate (port-first from free-stroke origin/main) · Sebs decision batch (identity pick · demo voice · mixed-3d D-1..D-6 · drawer Qs · Make checkpoint 06-13) · COMMIT (Sebs go) · README refresh.

---

## Previous state · 2026-06-10 (Day 9 of 14 CLOSED — Make checkpoint + doc mirror + research spree + 21-synthesis v1.2 finalized)

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

### Day 9 late-evening small-task sweep (06-10, uncommitted)

Research-backed chrome consistency pass (2 scan workflows + 5-agent edit fleet; build verified tsc-clean):

- **NEW `src/app/lib/chromeStyles.ts`** — shared PILL / CTA / SECTION_LABEL constants. /playground is the chrome reference; ALL pages import these now (playground's local copies deleted). Per Sebs: pill shapes everywhere, no square buttons, all pages same design.
- **NEW `src/app/components/chrome/CollapsiblePanel.tsx`** — shared collapse system: CollapsiblePanel (260ms ease-out slide, reduced-motion fade, visibility-hidden a11y when closed) + PanelToggle (header pill, chevron flips, aria-expanded, tooltip w/ shortcut) + usePanelOpen (localStorage persistence) + useMinimizeUi (⌘\/Ctrl+\ minimize-all, Figma convention). Pattern locked from online research: fixed-but-collapsible (Figma UI3 model), NOT floating (Figma reversed floating panels Oct 2024). Auto-reopen-on-selection parked until desk canvas has selection.
- **Wired into /canvas (left Input 280 + right Controls 360), /audit (right Controls 480), /playground (upgraded from instant unmount to animated shared system).**
- **Pill violations fixed (10):** /canvas 2D/3D tablist + Publish + input-mode buttons · home 2 CTAs · /public CTA · playground subject-nav rows + thumbnails (8→16) · Dropdown option rows (10→999) · Slider native range → `.dd-range` pill track CSS in theme.css.
- **3D toggle honesty gate** in /canvas DrawSurface: mode='3d' disables drawing + shows "3D mode lands Day 11" note (state preserved). Real wiring waits for Day 11 Rod/Extrude.
- **vite.config.ts port pinned 5180→5182** (was never actually set; only worked via auto-increment past the portfolio labs).
- **Type-guard fix** in SvgStyleTransform.tsx:1694 (pre-existing tsc error; `undefined > 0` is false in JS, guard is behavior-identical — no rendering delta).
- Backlog verdicts: upload-image = S1 stretch (needs imagetracerjs dep, half-day, buffer Day 15) NOT a small task · 3D toggle wiring waits for Day 11 · **desk-canvas + draw-panel-popup flow has NO plan slot — must be explicitly folded into Day 10 M9 build** (also flagged in CLAUDE.md).

### Completeness sweep + fix fleet (06-10 night, uncommitted)

4-agent exhaustive doc sweep (65 doc files opened, receipts logged) + UI audit found 72 rocks (most parked-by-design or stale) + 21 UI findings. 8-agent fix fleet landed (tsc + build verified clean):

- **UI consistency:** SHC + /audit + /canvas rebased on chromeStyles canon (drifted SECTION_LABEL copies deleted, FRAME_PILL consolidation for 6 canvas frame buttons, tablist matches playground); /audit viewport-fit (height:100vh + internal scroll); sliders full-width; dropdown chevron → currentColor inline svg (dark-direction safe); popover shadow + focus ring → color-mix; trigger 9999→999; home card r4→6.
- **Per-cluster collapse in SmartHachureChrome** (21-research §9 "apply now"): Style pinned always-visible; Multi-Stroke + Shading default open; Surface-texture + Color/palette default collapsed; persisted via usePanelOpen keys `shc.cluster.*`.
- **fillDarknessFactor hex/rgb/hsl parsing** (spec §7.B-14) in SvgStyleTransform — literal fills now get real WCAG-luminance darkness instead of 0.75 catch-all. Surgical 80-line insert, var() branches untouched. **NOT yet visually regression-verified** — eyeball on next hex-filled upload or run sweep before declaring done.
- **Dead stubs:** `simplification` field removed; textureIntensity max → 3. dotScatter/dotPattern removal SKIPPED (cross-file refs — needs 4-file coordinated edit, deferred).
- **New libs (locked decisions, unwired until Day 10/11):** `lib/normalizeInput.ts` (auto-resize ~180px), `lib/contentHash.ts` (SHA-1, 4 cache points), `lib/session.ts` (getSessionId).
- **Doc hygiene (portfolio source + re-mirrored):** stale 06-19 dates killed (incl. header), §1.2/§9 cross-refs fixed, SUPERSEDED banners on docs 00/06/07/08 (task #38 banner version — anti-drift).
- **84MB audit/sweep mosaics rescued** from /tmp → `audit-archive/` (gitignored). The smart-layer dataset no longer dies on reboot.
- **KINK VERDICT (D-makeathon-6): KEEP** — Day 9 overhaul made kink genuinely different from protrude (random-angle push at every anchor vs structured endpoint extension; SvgStyleTransform:581-619). Needs Sebs confirm → record lock in 09-LOCKED-MODEL.

### Solo fix batch (06-10 late night — rate limit killed agents, executed in main loop; tsc + build clean)

- **curveTightness → curveDamp** (§7.B-7): 50 sites; rough.js API coupling preserved (`curveTightness: m.curveDamp` at SvgStyleTransform ~1224 w/ comment — tsc caught it).
- **sketchingStyle 'cross-hatch' → 'cross-rotate'** (§7.B-8): 7 sites; fillStyle 'cross-hatch' (11 sites) untouched; dropdown auto-renders new value.
- **Slider floors applied** (recalibration memory items 1-2): roughness min 0→0.2, strokeWidth min 0.3→0.5; zero preset conflicts verified. Full linearity pass still deferred.
- **Curve tooltip** (§6.7) via new Slider `title` prop.
- **ε-guard** (18-scope-audit §H-6): hachureAngle −41 + 0.07° deterministic epsilon in smartHachure/renderRegion.ts — exact-corner stray-hachure mitigation. Imperceptible by design; eyeball /audit to confirm.
- **Verdicts:** ε-jitter WAS missing (now guarded) · rough.js #65: our hachure is rough.js scanline over SVG paths, no raster canvas bounds — low risk, 5-min oversized-shape repro queued · dotScatter/dotPattern: FULLY dead-gated (no MODIFIER_SETS entry → chrome never renders, zero consumers) — implement-vs-remove is Sebs's call.
- Memory sweep ran (solo grep): only real hits were slider floors (now done, memory updated) + Canopi-vs-Elara TODO (non-makeathon, needs Sebs).

### CONSOLIDATION PHASE (06-11 — Sebs called restraint: finish what's started before adding more)

Per [[feedback_push_back_on_overadding]]: stop adding new features; make the object surface + multi-desk EXCEPTIONAL + committed first. Order: (1) COMMIT the tree (was 60 uncommitted files) · (2) fix critical delete/drag-dead bug (RLS RPCs, needs schema paste) · (3) land verify findings · (4) make object surface work (Edit-save, Sandbox controls). THEN add private desks / drawer / identity / 3D. Make checkpoint #2 = AFTER consolidation, not on a buggy state.

**DECIDED — DESK GALLERY MINI-PREVIEW (write-down so it's not lost):** gallery `/desks` cards should each show a REAL MINI-DESK (the desk's objects scattered on a tiny warm-paper surface), NOT the current single-doodle preview_svg. Research (docs/research, w5jknnpzg): board tools cache snapshots, never live-render many. **Demo approach (Sebs approved): LIVE-CAPPED — render the desk's first ~6 doodles via listDoodlesForDesk(id, 6) scattered in the card (no schema change, no paste, fine at demo scale).** Post-makeathon upgrade: cached-layout JSON column on the desk row (the research's recommendation, for scale). STATUS: decided + approved, NOT built — in the build queue.

**VERIFY-SWEEP FINDINGS (06-11, w6k71qt8c) — 28 total, fix during consolidation:** CRITICAL: delete + drag-persist silently dead on v2 (RLS dropped UPDATE/DELETE, no scoped replacement) → fix via delete_my_doodle + move_my_doodle SECURITY DEFINER RPCs (like publish_to_open_desk). EDGE/DESIGN (many already fixed by main): ~~just-drawn opens Sandbox~~ FIXED · ~~pointer cancel/touch-threshold/leave-conflation~~ FIXED · ~~stat/maxLength/date-year~~ FIXED · STILL OPEN: two paper grains (DESK_GRAIN 0.8 vs ART_GRAIN 0.85 → one shared deskCraft constant) · ObjectCard hand-rolls SECTION_LABEL + shadow 9% vs 10% · CHIP constant for Live/count badges · modal centering FEELS off when right panel open (add scrim paddingRight = panel width; confirmed NOT an ancestor-transform bug) · Edit mode editable-but-no-save (render display-only OR wire save) · Remix always-disabled stub (implement or remove) · reactive ?desk (clicking a gallery card while on /desk doesn't re-read) · publishDoodle extra getOpenDesk read · friendly owner handle (don't print raw UUID).

### Multi-desk social system LANDED + plan re-baselined (06-11, uncommitted; tsc + build clean)

Object-model research (5 agents) → `docs/design/object-model-and-desk-architecture.md` (keystone: object = rich record; one-surface-3-modes; card=view+naming-as-ML-label; multi-desk caps; optional identity; desk craft). Then multi-desk build (4 agents):
- **schema-v2-desks.sql** (NEW, on clipboard, cap **120**): desks table + one-open-public-desk partial-unique-index + doodles gains desk_id/name/why/render_config + genesis seed + backfill + `publish_to_open_desk` RPC (server-side cap/spawn) + **folds in harden-v1.sql** (drops the open DELETE/UPDATE, 64KB svg cap). **SEBS PASTES THIS** → multi-desk live + security holes closed in one shot (harden-v1.sql no longer needed separately).
- **publish.ts** desk-aware: getOpenDesk/listDesks/listDoodlesForDesk/publishDoodle(returns {row,desk})/subscribeDoodlesForDesk + graceful pre-v2 fallback.
- **DeskPage** desk-aware: views one desk (open by default, ?desk=N for past), shows name + count/cap, switches view when a Done spawns a fresh desk, fallback to flat feed pre-paste. Handles {row,desk} correctly.
- **DeskGallery** at /desks (wall of walls — desk cards w/ name+thumbnail), Home "Browse the wall" → /desks.
- **deskNames.ts** generator (hero names + weighted templates + deterministic by index).
- **makeathon-plan.md re-baselined**: governing RE-BASELINE 2026-06-11 section (done/remains/decisions-locked/day-grid 06-11→06-18/Sebs-prereqs). All-3 spine, own design language Day 12-13, session-UUID for demo, cap (now 120), Sandbox-first.

**Build queue (sequenced, NEXT-slice locked):** (1) **object surface + cards** — morphing Create/Edit/Sandbox popup + ObjectCard + naming-as-training (THE next slice — needs activeSurface single-slot state in DeskPage, DrawPanel takes mode+sourceObject, new ObjectCard; record columns already exist). (2) **private desks** — owner_id filter + "My Desks" switcher (schema owner_id column already there). (3) identity handle + desk craft surface. (4) per-object memoization (perf — required before cap matters; drag currently re-renders all). (5) 3D round-trip (the wedge, Day 13-15).

### Gap sweep (72 findings) + critical fixes landed (06-11, uncommitted; tsc + build clean)

4-hunter gap sweep ran (code/product/online/security). Critical fixes done by hand (verified):
- **DEMO-BLOCKING nav FIXED**: /desk is now the primary CTA from home + /public ("Start doodling →" → /desk; "Try the engine" → /canvas secondary). /public placeholder copy replaced. Judges can now reach the real product.
- **index.html**: title "Homepage Surfaces v2" → "Desk Doodles" + meta description + OG/Twitter card tags (og:image needs /public/og-image.png 1200×630 before submit).
- **STORED-XSS hole CLOSED**: added `sanitizeSvgMarkup` (DOMPurify SVG profile) to svgUpload.ts; applied on READ in DeskPage (listDoodles map + realtime callback) — RLS can't parse SVG so sanitize-on-read is the enforceable layer. dompurify@^3 installed (Make-safe pure-JS). + `typecheck` npm script added.
- **harden-v1.sql written + on clipboard** — Sebs pastes: drops the wide-open anon DELETE + UPDATE policies (any visitor could wipe/rewrite the feed via the public key), tightens INSERT svg cap 1MB→64KB. NOT YET PASTED — live security hole until then.
- **gap-cleanup-fleet RUNNING** (wf_585358c8): slider no-ops (hachure-angle wire + roughness removed from sets), stale comments, reload-flash removal (default smartHachure ON), DrawSurface→shared DOMPurify sanitizer, DrawPanel preview normalizeSvgSize.
- **object-model-architecture research RUNNING** (wf_8328591b) → docs/design/object-model-and-desk-architecture.md (object-as-record keystone, one-surface-3-modes, card-is-read-artifact, multi-desk caps+gallery+naming, optional-fun identity, desk craft).

**QUEUED big (the plan re-baseline decides sequence — after research lands)**: 3D round-trip M6/M7/M8 (ZERO code — the wedge), demo video M13 (not started, biggest scoring factor), heartbeat M10 (doesn't exist — Supabase auto-pause risk), anti-cover validator, per-object style storage (validated by sweep), the object/card/desk/identity architecture, **Desk Doodles OWN design+motion language** (Day 12-13, not portfolio reskin), DECISION: demo spine = wedge (hand→3D) vs social desk.

### M9 LIVE: desk persists + golden v2 blessed + start values (06-11, uncommitted; tsc + build clean)

- **Sebs pasted schema.sql ("Success") → /desk is FULLY WIRED to Supabase**: loads the shared feed on mount, every Done auto-publishes (optimistic add + row-id attach), drag-end persists position (session-scoped), other sessions' doodles arrive live via realtime, header shows ●Live/○Connecting/○Offline status chip (Publish button removed — auto-publish has no button to press). NEW `updateDoodlePosition` in publish.ts. **Round-trip VERIFIED against the live DB** (insert/update/select/delete via node, table left clean).
- **Golden baseline v2 BLESSED** (Sebs eyeball on the post-bump wall) → audit-runs/golden-labels.v2.json is the regression baseline now.
- **Gradient sampler RECEIPT**: post-bump re-render shows all six swatches shading with correctly ORDERED density (pale sparse → dark dense) — gradient-darkness fix + recall-hole fix both verified on Sebs's fixture.
- **Start values per Sebs**: rough-handdrawn preset + first-load DEFAULT → wobble 0.4, curveDamp 0.3 (calmer default line; I-11 ratios untouched).
- Stale /canvas Publish tooltip fixed ("Publishing lives on /desk").
- **Smalls still queued**: DrawPanel Clear pill · DrawSurface sanitizer→shared svgUpload swap · rough.js #65 repro · §7.B-15/16/18 (golden-gated) · desk object delete UI (✕ — deleteDoodle exists, UI missing) · /public feed page (reads listDoodles — natural next M9 slice) · tone patches Tier 1.
- **Sebs product decisions (06-11)**: desk pan/zoom = YES (in M9 scope all along), zoom limits ~25%–400% (desk metaphor, not Figma's 2%–25,600%) · delete-after-place = next slice · EDIT-after-place needs stroke retention alongside markup (real slice, not small — strokes currently discarded at Done) · session correction noted: new window = SAME session (localStorage), new browser/incognito = new user · NSFW/moderation = post-makeathon EXCEPT it rides the Day 13 vision router nearly free (one extra call per publish); demo-week RLS hardening question in the gap sweep.
- **Total gap sweep RUNNING** (4 hunters: code/product/online/security — wf_0beafc94) — results land as fix-now / queue / needs-Sebs table.
- **COMMIT IS OVERDUE** — tree carries 2+ days: chrome+panels+clusters, conformance batch, renames+floors, dots determinism+scatter+pattern, knowledge base, 4 research docs, /desk flow + DrawPanel + uploads, QW-1/2 + golden tools + v1/v2 baselines, supabase schema+publish wiring, fixtures. Commit go from Sebs pending.

### DrawPanel upload modes + Make-importability audit (06-11, uncommitted; tsc + build clean)

- **/desk Add-doodle popup now has the full input trio** (Sebs caught the gap): Draw · Upload SVG (pick → thumbnail preview → Done = one desk object, sanitized via NEW shared `lib/svgUpload.ts`, sized by normalizeSvgSize at the add boundary) · Upload image (honest stub — autotrace S1). Footer Done adapts per mode.
- **Make-importability audit CLEAN** (Sebs directive "everything Figma Make importable"): zero absolute paths in src/, zero new npm deps tonight, only env reads carry baked Make-safe fallbacks (supabase.ts), no WASM/workers, roughjs deep imports OK (no exports map), dots patch is in-bundle by design. NON-APP dirs (tools/, supabase/, docs/, test-fixtures/, audit-archive/) stay OUT of the Make drag-drop — repo-side only. WATCH at Make checkpoint #2: localStorage in the Make preview iframe (panel persistence + dd.session.id) — expected fine, verify once.

### Day 10 fleet + recall-hole fix WITH receipts (06-11, uncommitted; tsc + build clean)

- **/desk IS LIVE — the real product flow**: desk canvas (objects array, drag via playground pointer pattern, viewport-fit), "Add doodle" → DrawPanel POPUP (modal, Done/Cancel, tight-bbox markup) → ONE object per Done, normalized ~180px via normalizeSvgSize, deterministic scatter ±80/60px + rotation ±8°. SmartHachureChrome right panel restyles whole desk. /canvas untouched (DrawSurface extracted to its own file, byte-identical render). Publish disabled until Supabase.
- **Upload sizing bug FIXED** (viewBox-only SVGs rendered 0×0): upload boundary forces width/height=100% + SvgStyleTransform gained `wrapperOverride` prop (call-site-only; audit/playground untouched). Diagnosed via playwright DOM dump per the diagnose-first rule.
- **Classifier recall hole FIXED with receipts**: root-tonal rules 0.55→0.70. Golden tooling (NEW tools/classifier/: golden-snapshot/golden-diff/ambiguity-queue + README) captured baseline (1394 regions/197 shapes) → diff shows exactly 140 flips across 67 shapes, ALL source-darkness 1.00 (pure-black details silently rendering as empty outlines) → visual A/B (/tmp/dd-audit-BEFORE|AFTER-bump.png) confirms only true-black regions gained hachure (trophy cup, print blocks), light regions identical. **Sebs blesses /audit eyeball → candidate JSON becomes golden-labels v2.**
- **QW-1/QW-2 landed**: Classification carries rawScore + margin; renderSmartHachure logs every decision (window.__dd_decisionLog) — the calibration/training dataset collector, zero behavior change.
- **Supabase M9 prep ready**: supabase/schema.sql (doodles table + RLS + v1 trust-model banner + sanity bounds) — SEBS PASTES into SQL Editor → then wire publish.ts (publishDoodle/listDoodles/deleteDoodle/subscribeDoodles, already written) into /desk.
- /canvas two-layer coordinate quirk (drawn heart "shrinks" vs upload letterbox) = test-surface-only, dissolved by /desk architecture; stopgap only if Sebs asks.
- Knowledge base COMPLETE: docs/knowledge/ 00-INDEX + 10 pages; page 03 patched with the six-decision-surfaces table. Classifier research doc 24 + simplification 22 + Suzanne 23 all on disk.

### Decisions executed + dots real + research docs (06-10 latest, uncommitted; tsc + build clean)

- **Kink KEEP locked** — 09-LOCKED-MODEL §11 Post-lock rulings R-1 (portfolio + mirror).
- **/canvas default style → rough-handdrawn** (Q-8 closed).
- **rough.js dots determinism SHIPPED** — runtime prototype patch `src/app/lib/patchRoughDots.ts` (Make-safe: lives in our bundle; node_modules edits don't survive Make's npm install). Seeded jitter, same distribution. Check: hard refresh → /audit → fillStyle dots → re-render → dots stay put.
- **dotScatter REAL** (stipple row): displacement-scale primary axis + baseFrequency rhythm-break, calibrated neutral at 0.3 default (zero visual change until slider moves).
- **dotPattern REAL** (newsprint row): buildNewsprintDotTile generates true grid/staggered/random/concentric dot screens as SVG `<pattern>` + root-svg mask composed OVER the existing grain. Defaults now show subtle staggered halftone perforation (deliberate); newsprint with texture=none now still shows the dot screen. Agent flagged 4 eyeball items (root-svg mask first use — check Make preview too; random-tile periodicity; dotSize saturation >1.8; sweep newsprint since SvgStyleTransform touched).
- **Simplification research doc WRITTEN** — `docs/research/22-research-simplification-toggle.md` (37KB, cited: 12 tools surveyed). Locked rec: 'Simplify' slider, key `simplification`, s∈[0,2] step 0.05, ε(s)=3.0×4^(s−1), default s=1.0 pixel-identical to today, render-time per-sub-path, **dispatch freeze** (polygonal-vs-curve classified at canonical ε=3.0 — fixes the renderer-identity cliff S1), Phase C auto-tunes from RAW-point signals only (S11 feedback-loop lock), new Cluster 0 Geometry/Resampling upstream of doc 19 matrix. **Audit/sweep artifacts must record ε from now on.** Build gated on this doc + regression checklist inside it.
- **Suzanne brief WRITTEN** — `docs/research/23-brief-suzanne3d.md` (cited). Verdict: Suzanne = AI browser 3D studio → CLEAN parametric printable CAD (OpenSCAD/STEP, wants sanitized linework, zero style preservation) → **our wedge SURVIVES, sharpened: 3 poles — fidelity-to-intent (Suzanne) / fidelity-to-mesh (Tripo-Meshy) / fidelity-to-the-hand (US, unoccupied)**. API enterprise-only → no makeathon integration; relationship play. 8 chat questions + 3 offers + transparency etiquette inside. PLUS: founder's YC hackathon repo (Atlas — voice→3D worlds, Hunyuan3.1 + Tripo fallback, Three.js) reviewed in-session — kinship opener + practitioner questions added to the outreach thread.

### Edge-case conformance pass (06-10 late night — solo, tsc + build clean)

Audited smartHachure against ALL 21 rows of the locked 18-scope-audit edge-case policy table. Fixed in code (each cited): **symbol→SKIP_TAGS** (row 11) · **mask/filter attr → true pass-through** in index.ts (rows 3-4) · **clip-path attr copied onto generated marks** (row 2) · **gradient → average-stop darkness, pattern → pass-through** via resolveUrlFillDarkness in signals.ts (rows 5-6) · **CSS-class/currentColor computed-fill fallback** with UA-default-black guard (rows 7-8; drawn-canvas commit layer verified explicit fill="none" — unaffected) · **tiny-area <40px² → solid clamp** in techniqueMap + user-pick override exception in index.ts (row 13) · **gap cap 12px** (row 14) · ε-guard (row 17, earlier tonight). Already conformant: rows 1, 12, 15, 18-20 (paletteMode/overrideStore is injectable per I-14). **DEFERRED with reason:** row 9 getCTM bbox flatten (topology-wide change — needs the full regression sweep, Day 10) · row 16 fill-rule normalize (needs rough.js scanline research) · row 10 `<use>` resolution (browser getBBox partially covers; full shadow-tree walk is post-MVP).

**⚠️ REGRESSION CHECK PENDING per feedback_never_declare_fixed_without_regression_check:** tiny-area clamp + gap cap + computed-fill fallback CAN change audit-page renders (by design, policy-mandated). Before commit: Sebs eyeball /audit at defaults + rough-handdrawn, or run the sweep harness. Do NOT declare done until then.

**Day 10 queue (THE one queue — items leave only by being DONE):** regression check on tonight's smartHachure conformance batch (above) · row 9 getCTM flatten (with sweep) · tone-fill shading-input RESEARCH pass (heavy, Sebs directive — non-enclosed-region fill, see memory) · desk-canvas + draw-panel flow INSIDE M9 · §7.B-15/16/18 (regression-sweep-gated) · rough.js #65 repro · fillDarkness visual verify · pipeline scaffold (Day 11) · Make-AI port-back check.

**Sebs decisions pending (batch):** ① kink KEEP lock confirm ② Q-8 /canvas default style (rec: rough-handdrawn) ③ dots in demo? → #211 interim seed patch ④ dotScatter/dotPattern: implement dotScatter (~45min real stipple knob) vs remove both (rec: implement scatter, dotPattern rides Phase B) ⑤ simplification as REAL slider wired to RDP ε? ⑥ did Make-AI auto-fix anything in smoke test? ⑦ 09 sign-off boxes + Tripo rotation + $50 grant.

### Supabase + fal.ai wired (06-10 late evening)

- Supabase project `desk-doodles` created (East US, free tier). URL + publishable key in `.env.local` (gitignored) AND baked as client-safe fallbacks in **NEW `src/app/lib/supabase.ts`** so the file works verbatim in Make. API probe verified live (PGRST205 = auth OK, no tables yet — Day 10 SQL creates table + bucket + RLS policies).
- fal.ai key in `.env.local` as `FAL_KEY` (no VITE_ prefix — never bundles client-side; moves to Edge Function secrets Day 13). Account has NO credits — fine until Day 13 T3; ~$5 covers dozens of TRELLIS gens if we attempt it.
- Make-side: Sebs connects Make's Supabase integration to the SAME project at next checkpoint (don't let Make create a second project).
- Still Sebs-side: Tripo key rotation · daily Make-beta email check.

### Wobble thread CLOSED (06-10 evening)

Sebs eyes-on sign-off: rose SVG + drawn-heart repros confirmed fixed by the Day 9 drawn-canvas overhaul (multi-M sub-path split + jaggedness default 0 + polygonal/curve dispatch). The 06-09 "Open thread — wobble debug" section below is historical.

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

### ROUND 4 — THE FULL OBJECT CREATION LOOP (Sebs 2026-06-11 late: "don't forget the full object creation flow is not done" — LOCKED NEXT after round 3 lands)

The loop is DONE only when: draw → style (full pen controls beside the canvas) → name/why → place → **reopen → restyle AND re-draw → save back to the same object**. Status map:
- Create mini-desk w/ full pen controls — round-3 rock B (in flight)
- Full toggles in Sandbox + Edit, Edit SAVES config to the object — round-3 rock C (in flight, schema-v4 paste)
- **PLUS Sebs popup feedback 22:53 (fold into round 4 — files owned by round 3 until it lands):** ① create-popup pen column must carry the FULL per-style set (port the rock-C SurfaceControls pattern into DrawPanel — never "core subset" again); ② popup should be BIGGER (use more viewport, e.g. min(1040px, 92vw) wide / 88vh tall); ③ NESTED SCROLL fix — dropdown menus inside popup columns must NOT scroll-within-scroll: cap dropdown maxHeight lower inside popups so only the COLUMN scrolls (Sebs: "dropdown shorter and only scroll the panel"), research the standard pattern; ④ CREATE CANVAS LIVE RESTYLE not wired — strokes in the create popup render raw; they must re-render through the pen pipeline live as controls change (the canvas IS the preview; the wiring exists in DrawSurface's commit layer — connect it).
- **ALSO round 4 — ADD-TIME NAMING STAGE (Sebs expects it, 2026-06-11 late):** create flow gains the card-info step — draw → Done → naming card (name + why, the minting moment) → lands. Today naming only happens post-place via Edit. NOTE: no naming stage exists in DrawPanel at all (verified by grep — the earlier "Name your doodle" screenshot was the Edit surface).
- **MISSING = STROKE RETENTION + RE-DRAW (round 4):** (a) Done stores the raw perfect-freehand strokes (ride render_config.strokes jsonb — no new column; check size vs the 64KB svg cap) through publish; (b) Edit popup gains "Re-draw" → reopens the draw canvas WITH the object's strokes loaded + editable, Done re-runs the pipeline and UPDATEs the same row (svg + strokes + config via the v4 RPC — extend to accept p_svg); (c) legacy strokeless rows: Re-draw hidden, honest note. Files: DrawPanel/DrawSurface/ObjectSurface/publish/DeskPage + schema-v4 amendment — ALL owned by round-3 rocks right now, hence sequenced not parallel.

### Sebs feedback round 2026-06-11 ~18:30 (screenshots) — QUEUE ELEVATIONS
- **Endless paper FIXED by main thread** (oversized grain layer inside camera; pool marks workspace) — verified zoomed-out.
- **Sandbox/Edit need the FULL toggle set** (more-toggles-better): extend the restyle column to the per-style full controls (MODIFIER_SETS_BY_STYLE-driven like the chrome). → next fleet rock (ObjectSurface).
- **Create popup should be the mini-desk too**: canvas LEFT + full pen controls RIGHT (same shared pen state as the desk panel per D-7 — two surfaces, one pen). → next fleet rock (DrawPanel, after pen-desk rock lands).
- **EDIT-BACK-IN (restyle) unlocks with render_config** (tonight's pen-desk rock) → then Edit popup gets the same control column writing to the object's config via update RPC. **FULL draw-edit needs source-stroke retention — ELEVATED from stretch to the 06-12 grid** (Sebs has asked repeatedly; strokes currently discarded at Done).
- **Smart placement = Phase P in smart-system plan** (P-1 anti-cover landing rides next desk slice).
- Session limit: ALL agent rocks dead until 9:10pm ET reset (credits don't lift the window). Resume command in the section above; fire on first message after reset + launch the round-2 rocks (sandbox-full-toggles · create-mini-desk · stroke-retention · P-1 placement).
