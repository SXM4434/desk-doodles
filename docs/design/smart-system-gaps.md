# Smart System — Gap Audit (what the plans miss now that conversion/3D exists)

**Date:** 2026-06-12 · **Status:** AUDIT — plan amendments proposed, no code changed (src/ owned by the build fleet).
**Audited plans:** `docs/design/smart-system-build-plan.md` (+ Phase P addendum) · `makeathon-plan.md` §8.6 + RE-BASELINE/D′ · `07-architecture-ml-pipeline.md` (superseded except audit-as-dataset) · `09-LOCKED-MODEL.md` I-1..I-14.
**Audited against as-built (read 2026-06-12):** `lib/smart/smartPick.ts` (Phase C, live) · `lib/smart/coverage.ts` + `smartHachure/renderRegion.ts:18,68` (Phase A math, routed) · `tools/classifier/reliability.js` (QW-5, built) · `lib/geometry3d/strokeTo3d.ts` + `components/canvas3d/Stroke3DScene.tsx` (3D conversion, live on /canvas) · `DeskPage.tsx:1102-1160` (P-1 placement + D-6 penSnapshot) · `publish.ts:397-440` (v4 restyle / v5 re-draw RPCs) · `DrawerPanel.tsx` + the #28 copy path · `global-toggles-and-mixed-3d.md` D-7 + amendments 1-5 · `3d-mode-controls-spec.md` (round-7 per-mode params).
**Coordination:** a sibling agent is speccing **D2 (the 3D conversion router)** from the same sources — this doc names the D2-shaped holes and defers router option-space/spec detail to that doc. No duplication here.

---

## 0. As-built delta — the plan is BEHIND reality in both directions

| Plan item | Plan date | Reality 2026-06-12 |
|---|---|---|
| QW-5 reliability script | 06-12 | **BUILT** (`tools/classifier/reliability.js`, ECE + honest upper-bias caveat) |
| Phase C smartPick | 06-13 | **BUILT ahead** — draw + upload-svg, abstain-by-default, `window.__dd_inputPickLog` w/ pick/abstain/undo events |
| Phase A coverage math | 06-14 | **BUILT** — `coverage.ts` pure module, `renderRegion.ts` routes through it behavior-preservingly; recalibration eyeball still pending |
| Phase D engine routing | 06-14/15 | half-built (`resolveGeometryMode`, strokeTo3d.ts:254-263) but **receipts never built** (G-1) |
| Phase P-1 placement | "next desk slice" | **BUILT** (DeskPage.tsx:1102-1135 candidate-ring scoring) but **unlogged** (G-7) |

The plan's ladder is ahead of schedule on engines and behind on **receipts**: three live smart surfaces (conversion, placement, edits) produce zero training data while the docs' own data-story (§4) claims "every decision is traced."

---

## 1. THE GAPS

### G-1 · 3D conversion decisions are not decision-logged — training-data loss is live NOW
- **Not covered:** every Auto resolution (open→rod / closed→extrude), every extrude-triangulation try/catch fallback, every D-3 ladder fallback (no strokes → outline-extrude → paper card) runs silently. `grep __dd` over `lib/geometry3d/` + `components/canvas3d/` = zero hits. `3d-roundtrip-build-plan.md` §5 risk 3 explicitly ordered "log to `window.__dd_decisionLog` so failures become training data" — never implemented.
- **Why it matters:** every Auto pick is a Phase-D label; once round 8 makes AI mesh the default, the local-vs-AI route IS the D2 router's training set. Demo-week traffic (unique real users) starts 06-13 — each unlogged conversion is a lost label.
- **Cheapest amendment:** `__dd_conversionLog` FIFO mirroring smartPick's idiom (~40 LOC, new file beside strokeTo3d): `{surface:'conversion', strokesKey, setting, resolved, perStroke:[{closed, mode, fallback?}], paramsSnapshot}`. **Field names = the D2 spec's vocabulary** (sibling doc owns them — adopt, don't fork).

### G-2 · §8.6's conversion-vs-calibration table has no 3D column
- **Not covered:** the scope table (makeathon-plan.md:643-647) predates 3D. Round 7's per-mode params (rod radius/caps/joints · extrude width/depth · inflate base/tip/pressure/puff · solid ink-radius/depth/holes, per `3d-mode-controls-spec.md` §2) are exactly §8.6 **calibration surfaces** (auto-tune from stroke signals: length, density, pressure stats, closed-ratio); geometry dropdown + 3D style + material sub-dropdown are exactly **conversion pickers**. The plan's Phase D stops at "Rod/Extrude/needs-Tripo."
- **Why it matters:** the wedge claim is "a recommendation for each thing" (Sebs, no-cuts). A whole panel of 3D toggles with no smart opinion breaks the headline the moment the round-7 chrome split ships.
- **Cheapest amendment:** add two rows to the §8.6 table (3D conversion pickers / 3D calibration params) + rename Phase D → D1 (done-in-miniature) and **D2 = the sibling spec** (router + per-mode calibration). One paragraph, no new architecture — same `signals → classify → treatment` engine.

### G-3 · smartPick has no 3D axes
- **Not covered:** `SmartPickAxes` (smartPick.ts:50-60) = 6 2D pen axes only. `geometryMode` / `style3d` / material absent.
- **Why it matters:** ingest-time is when the system knows the most (strokes in hand); SD-3 says pick fires once at ingest — if 3D axes aren't in that pick, they can never be picked without violating SD-3.
- **Cheapest amendment:** optional `geometryMode?` / `style3d?` on SmartPickAxes, fed by `resolveGeometryMode` aggregates (majority-closed → extrude etc.); abstain-by-default like texture/sketchingStyle today. ~30 LOC inside the existing rule table; log entries ride `__dd_inputPickLog` for free.

### G-4 · `render_config` records carry no mode/3D fields
- **Not covered:** the D-6 penSnapshot (DeskPage.tsx:~1140) = `{svgStyle, modifiers, strokes?}`. D-7 amendment 4 + D-5 require objects to keep "own style AND own mode" on the mixed desk, and pinned-3D objects to persist geometry + 3D style + material. No field exists for any of it.
- **Why it matters:** (a) pinned-3D (the (d) model, ratified direction) is structurally impossible until the record holds mode; (b) the durable training store is the Supabase row — window FIFOs die on reload; a conversion the user *kept* is the accepted-label, and it's never persisted. D-6 already taught this lesson once: "cheap now, expensive to backfill."
- **Cheapest amendment:** define record schema v-next in the object-model doc NOW — optional `{mode?, geometry?:{mode,params}, style3d?, material?}` — and write it at the next publish-path touch (the round-7 3D chrome build). jsonb column already exists; zero schema paste.

### G-5 · Tone-fill brush is absent from the signals plan
- **Not covered:** round 7 ratified the tone-fill/shade-brush (second draw register, discrete darkness levels → source-darkness for ALL renderers). `signals.ts` derives `darknessL` from region *fill colors* — drawn doodles are stroke-only, so the classifier sees almost no tonal regions on the product's PRIMARY input. No smart-system doc says how brushed tone enters the pipeline.
- **Why it matters:** I-2 (source darkness owns per-region identity) is the central invariant, and the main input mode currently can't express source darkness at all. Tone patches are also the missing link for cross-fillStyle conversion (`project_desk_doodles_shading_input_tone_fill`).
- **Cheapest amendment:** one signals paragraph in the build plan: tone patches enter as regions with **explicit darknessL** (bypassing fill-color resolution), classifier treats them as first-class tonal regions, decision-log entries gain `darknessSource:'fill'|'tone-brush'`. Confirm before the round-7 build so the brush writes the right data shape.

### G-6 · Re-draw / Edit-restyle before→after is not logged as correction labels
- **Not covered:** v4 (`updateDoodleConfig`) and v5 (`updateDoodleArt`) rewrite config/svg with no before/after capture (publish.ts:397-440).
- **Why it matters:** this is the placement-correction trick generalized — "system (or past-self) chose X, user changed to Y" is the highest-value preference label the app produces, and Edit-after-smartPick is a *direct correction of the smart system*. P-3 already names drag-corrections as labels; restyle/re-draw corrections are the same class, currently discarded.
- **Cheapest amendment:** ~15 LOC at the two call sites: `{surface:'edit-correction', rowId, before, after}` into the conversionLog FIFO (G-1's collector). Export later by joining rows.

### G-7 · P-1 placement decisions + drag corrections are unlogged
- **Not covered:** P-1 scores candidates and lands (DeskPage.tsx:1102-1135) with no receipt; `updateDoodlePosition` persists only final x/y. The plan's OWN P-3 (learned placement from how people move doodles) names this exact data — being discarded now.
- **Cheapest amendment:** log `{surface:'placement', candidatesScored, chosen, bestScore}` at land + `{surface:'placement-correction', from, to, ageMs}` on a fresh object's first drag-end. Drawer place-here copies (#28 path) get one line too — a copy is a whole-config endorsement label.

### G-8 · No evaluation story per smart surface (reliability.js covers ONLY the classifier)
- **Not covered:** smartPick quality (undo events are logged but no metric script; no fixture set of inputs→expected picks beyond the 6-input manual A/B); placement quality (no metric: mean overlap at land, correction distance/rate); conversion quality (tools/3d sweep harness is render QA, not a blessed decision baseline).
- **Why it matters:** the data-story (§4) and T2-a both rest on "measured, not guessed" — true today for the classifier only. Phase F (cascade) will shift picks with nothing to catch regressions on the other surfaces.
- **Cheapest amendment:** an EVAL LADDER table in the build plan — per surface: collector → metric → script → bless gate. Concrete makeathon-sized pieces: `tools/smart/pick-eval.js` over a ~20-input fixture dir (golden-snapshot idiom); bless the 3D sweep's auto-flags into `golden-3d.v1.json`; placement metric = mean bestScore at land (already computed, just record it).

### G-9 · Cross-renderer consistency has no harness ("one math, two renderers" is unchecked)
- **Not covered:** `coverage.ts` bands feed 2D density today and M8 hatch uniforms tomorrow — nothing verifies 2D band N and 3D band N produce matching perceived ink for the same object/classification. Hatch-vs-2D calibration is flagged as an eyeball one-off (build-plan risk 5), not a repeatable check.
- **Why it matters:** the demo's wedge beat IS the sliders restyling 2D and 3D together; silent drift between renderers breaks it invisibly. Also `project_f3_shading_port_to_3d`: no shading phase is "complete" until both paths match.
- **Cheapest amendment:** extend the existing tools/3d sweep with one paired-render mode — same fixture at defaults, 2D vs 3D, per-band pixel-ink-coverage compared within tolerance; run at the M8 gate + before the video.

### G-10 · Decision-log provenance: lens / preview / record renders are indistinguishable
- **Not covered:** the Pen|Desk **Desk lens** re-renders ALL objects through pen values; the preview squiggle and popup render too. All emit classifier decisions into the same `__dd_decisionLog` with no scope tag (the `surface` field on index.ts entries is a planned lock-lift edit, still pending).
- **Why it matters:** training exports will mix canonical record renders with transient lens sweeps → duplicate, mutually contradictory labels per svgHash. Quietly poisons the dataset the whole story depends on.
- **Cheapest amendment:** make the already-planned index.ts `surface` field carry `'record'|'desk-lens'|'pen-preview'|'sandbox'|'audit'` and land it FIRST at lock-lift, before any export script runs.

Minor (noted, not numbered): upload-image (S1 tracer) + round-6 draw-over uploads create mixed-source objects (backdrop + strokes) — smartPick's `SmartPickInput` and the signals story should name that source class when the slice opens.

---

## 2. WHEN each remaining smart/ML piece lands (plan + D′ calendar, as of 06-12)

| Piece | Status | Lands |
|---|---|---|
| QW-5 reliability · Phase C smartPick · Phase A math · P-1 placement | **BUILT** | done (Phase A recalibration eyeball rides M8) |
| SD-2 smart-pick chip visibility in DrawPanel | built w/ Phase C | live; verify in round-6 sweep |
| Receipts retrofit: G-1 conversion log · G-6 edit-corrections · G-7 placement log · G-10 surface tags | **NOT PLANNED — this audit** | recommend 06-13 (half-day, mostly new-file FIFOs; G-10 at lock-lift) |
| Phase B (all 8 shading styles through coverage) | rides techniqueMap | 06-14 (with Phase A recalibration) |
| Phase D2 — 3D conversion router + per-mode smart calibration (G-2/G-3) | sibling spec in flight | spec 06-12 → build with round-7 3D chrome 06-13/14; AI-route extension = round 8 hard path (~06-15) |
| Tone-fill brush as signal (G-5) | round-7 build, ingestion unspecced | amendment before build; brush ~06-13/14 |
| record schema v-next w/ mode+3D (G-4) | not planned | next publish-path touch (round-7 3D build) |
| T2-a Platt calibration | not built | 06-15 |
| Phase F cross-axis cascade | not built | 06-16 |
| Cross-renderer harness (G-9) + eval ladder (G-8) | not planned | G-9 at M8 gate (06-14); pick-eval 06-16 if slack, else post |
| Phase E physics presets | gated on physics (stretch 6.5) | only if physics lands; else post |
| Data-story export segment | planned | 06-17 |
| P-2 spread-relax · P-3 learned placement · T2-b/QW-6 · tree/LLM providers · manual-toggle layer · meta-engine | post ladder | post-06-18 |

---

## 3. SEBS DECISIONS (recommended defaults)

| # | Decision | Recommendation |
|---|---|---|
| GD-1 | Receipts retrofit (G-1/6/7) now (~half-day, 06-13) vs post-makeathon | **Now** — demo-week traffic is unique labeled data; the data-story claims it's being collected |
| GD-2 | smartPick gains 3D axes in round 7 (G-3) vs Auto-only for makeathon | **Round 7** — abstain-by-default keeps it honest; the chip already exists |
| GD-3 | record schema v-next with mode/3D fields at next publish touch (G-4) | **Yes** — D-6 lesson; jsonb only, no SQL paste |
| GD-4 | Cross-renderer band check as a hard M8 gate (G-9) | **Yes** — it's the wedge shot's regression test |
| GD-5 | Tone-fill ingestion model = explicit-darknessL regions + `darknessSource` tag (G-5) | **Confirm before round-7 brush build** |
| GD-6 | Eval ladder scripts (G-8): pick-eval + golden-3d in-makeathon vs post | **06-16 if slack, else post** — collectors (GD-1) are the part that can't wait; metrics can |
