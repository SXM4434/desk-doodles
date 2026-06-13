# Shading + Conversion Fidelity Catalog — Desk Doodles

**Date:** 2026-06-13 (Day 13/14, deadline 2026-06-18) · **Status:** READ-ONLY classification pass. **No src edits, no live-DB writes.** The render engine (`SvgStyleTransform.tsx`) is under active edit by another fleet — this catalog only observes and classifies; the fixes fire later (P11).

**Why this exists (Sebs 2026-06-13):** all day there were issues with clean SVGs not converting into hand-drawn, and "regions that should shade aren't shading." This treats those as REAL BUGS — not hidden under "the shading system isn't done" — and separates them from what is genuinely by-design or not-built-yet. It is also the **foundation dataset for the future smart/ML shading layer** (per `docs/memory/project_smart_layer_foundation_via_audit.md` — the `/audit` breakage catalog is the labeled training data: every classified row below is one labeled tuple `(shape, style, expected, actual, label)`).

---

## TL;DR (lead — Sebs running)

**There is ONE real engine bug, and it is the exact thing Sebs has been hitting all day.**

- 🔴 **REAL ENGINE BUG — 1 root cause, ~15 shapes affected ×4 smart styles:** full-bleed / large **dark `fill=STROKE` regions** (poster bodies, document covers, dark photos, TV screens) render as **EMPTY hand-drawn outlines** — the dense fill that should hachure (or go solid under bold-ink) is dropped. Root cause is **one classifier rule** (`outer-frame-encloses-all`) that ignores source darkness and treats any large enclosing rect as a frame border. 6 shapes go fully empty; ~9 more are badly under-shaded. **This is the P11 fix.**
- 🟢 **BY-DESIGN / CORRECT — the large majority:** 8%-ink washes render light (not flooded — wash-darkness fix confirmed live), stripe-cluster bands hachure correctly, text never hachures, `fill=none` strokes stay strokes, stackedSketchbooks' alternating spines are faithful. The whole catalog is **geometrically clean: 0 NaN, 0 console errors, 0 overflow across all 2,167 cells.**
- 🟡 **NOT-BUILT-YET (not a render bug):** the **FX styles (wet-ink · charcoal · risograph · newsprint) never go through the smart-shading path at all** — they are filter-over-the-clean-source, so they happen to keep dark fills but get **zero hand-drawn conversion**. That's the SA-3 smart-gate, scoped not-shipped. Plus the unbuilt user tone-brush/fill/lasso INPUT tools (F1/F2/F3).
- 🟦 **FIX-IN-FLIGHT (do not re-file):** outline-only blank posters + risograph ceiling flood are being fixed in the uncommitted working tree. Risograph flood = **confirmed fixed in this build.** Outline-only synthesis = **present in the bundle but NOT yet working** (CSS-cascade ordering bug) — flagged to its owner below.

**Bottom line: 1 real bug (well-understood, single-rule fix) · the rest is by-design or scoped-not-built.** The "clean SVG won't convert to hand-drawn" complaint is real and traced to a precise line.

---

## Method (verifiable — real screenshot evidence, no sample-and-claim)

- **Isolated PROD preview:** `vite build --config tools/2d/vite.sweep.config.ts --outDir /tmp/dd-fid-sweep-dist` (882→197 modules, exit 0) → `vite preview … --port 4517`. The build **includes the in-flight uncommitted edits** (verified: `applyOutlineOnlySynthesis` + the risograph `RISO_KNEE`/`RISO_CEIL` ceiling are in the emitted bundle).
- **Full sweep re-run on the fresh build:** `tools/2d/audit-style-sweep.mjs` — the REAL `/audit` inventory (197 deduped shapes: 93 Trophy-Wall `PinShape` + 104 Pegboard `PegToolShape`) through the REAL `SvgStyleTransform` 2D path (smartHachure default-ON) in **all 11 F3 styles = 2,167 cells**. Per-cell PNG + pixel metrics (inkFrac / darkFrac / edgeFrac), per-style contact-sheet mosaics, NaN DOM scan, console capture.
- **Pixel diff against the source-of-truth:** `clean` is the "what the source INTENDS" baseline. A shape×style is WRONG when its rendered fill diverges from clean's fill in a way the style's contract does not license.
- **DOM + decision-log probes:** `window.__dd_decisionLog` dumped live (2,788 region decisions on the rough-handdrawn pass) → exact role, darknessL, fillStyle, and fired-rule per region. Every "bug" claim below is backed by a screenshot READ + the decision-log entry that caused it.
- Artifacts: `/tmp/dd-2d-sweep/` (mosaics/, shots/<style>/<shape>.png, results.json, sweep-table.md) · probes `/tmp/probe-*.mjs`.

**Render-path map (the load-bearing structural fact this whole catalog turns on):**

| Style | Render path | Goes through classifier + tonal fill? | Dark-fill outcome |
|---|---|---|---|
| `clean` | source as-is | no (baseline) | preserved (the intent) |
| `rough-handdrawn` · `sketchy` · `bold-ink` · `stipple` | `renderSmartHachure` | **YES** | **dropped when misclassified ← THE BUG** |
| `wet-ink` · `charcoal` · `newsprint` | `applyTexture` filter over clean source | **no** | preserved (but no hand-feel conversion) |
| `risograph` | `applyRisographTransform` (clone+offset+multiply) | no | preserved (offset double-print) |
| `outline-only` | CSS fill-strip + (in-flight) synthesis | no | stripped by design (+ posters blank, see fix-in-flight) |
| `wireframe` | `applyWireframeSchematic` | no | stripped to hairline contour (by design) |

`SvgStyleTransform.tsx:2544` gates `useSmartHachure` to exactly `rough-handdrawn | sketchy | bold-ink | stipple`. Only those four convert; the FX four are filter-over-source. This is why the same dark poster is **empty under bold-ink** (smart path) but **correct under wet-ink** (filter path) — see the side-by-side below.

---

## The one real bug, proven (side-by-side)

`pitchDeckCover` — source is a solid near-black poster (`<rect fill={STROKE}>` darkness 1.0 + knockout "ION" text):

| clean (intent) | bold-ink (smart path) | wet-ink (filter path) |
|---|---|---|
| solid black "ION" poster | **EMPTY hand-drawn rectangle** 🔴 | solid black "ION" poster (correct) |
| `darkFrac 10.8%` | `darkFrac 1.4%` | `darkFrac 10.8%` |

The bold-ink failure proves the drop is in **classification (upstream of fillStyle)** — bold-ink would fill it solid if it reached the fill pass, but the region never gets there. wet-ink "succeeds" only because it skips conversion entirely (NOT-BUILT, not a fix).

**Root cause (decision-log + source):** `src/app/lib/smartHachure/classifier.ts:107` rule `outer-frame-encloses-all` fires on `zIndex===0 && enclosesSiblingCount≥3 && areaFractionOfParent>0.8` → `role: structural-frame` → `fillStyle: none` → drawn as an outline. **The rule never checks `darknessL`.** A full-bleed near-black poster body matches the same shape signature as a thin wash-bordered card frame, so the dense fill is treated as a frame border and dropped. Secondary contributor: the `fallback:no-provider-confident` path returns `role: paper` for dark regions no rule confidently claimed (10 dark regions hit this).

Decision-log evidence (rough-handdrawn pass, dark regions ≥0.55 that rendered `fillStyle:none`):
- 184 total → **104 are text/line (legit none, by-design)**, **80 are fill-region elements misrouted**, of which **18 are large-area (area>2000) dark fills rendered empty** — the visible bugs. Roles: `structural-frame` (outer-frame-encloses-all, 12) · `paper` (fallback, 10) · the rest are stripe/line decoration (by-design).

---

## Per-item table — every WRONG shape×style, classified

Classification legend: **(1) REAL ENGINE BUG** — should work today, doesn't · **(2) BY-DESIGN** — looks off but faithful to source · **(3) NOT-BUILT-INPUT** — not a render bug; unbuilt input tools / FX smart-gate · **(F) FIX-IN-FLIGHT** — already being fixed in the working tree.

### (1) REAL ENGINE BUGS — dark fill dropped/under-shaded by the smart path

Affects the 4 smart styles (`rough-handdrawn`, `sketchy`, `bold-ink`, `stipple`). Expected = dense hachure (rough/sketchy/stipple) or solid (bold-ink); actual = empty outline or far-too-sparse. clean% / smart% are darkFrac pixel measures.

| Shape | Subject | Severity | Expected | Actual (rough / bold) | Screenshot |
|---|---|---|---|---|---|
| `pitchDeckCover` | Work rig | **full drop** | dense fill (clean 10.8%) | empty outline (0.8% / 1.4%) | shots/{clean,rough-handdrawn,bold-ink,wet-ink}/pitchDeckCover.png |
| `psPoster` | Sony | **full drop** | dense fill (8.8%) | empty outline (0.7% / 1.2%) | shots/.../psPoster.png |
| `ppvPoster` | WWE | **full drop** | dense fill (8.5%) | empty outline (0.7% / 1.2%) | shots/.../ppvPoster.png |
| `framedMoviePoster` | Movies | **full drop** | dense outer poster (4.5%) | empty outline (0.7% / 1.3%) | shots/.../framedMoviePoster.png |
| `replicaBelt` | WWE | **full drop** | filled plates (4.2%) | empty (0.8% / 1.5%) | shots/.../replicaBelt.png |
| `trinitronTv` | Sony | **full drop** | dark screen filled (3.5%) | empty outline (0.9% / 1.7%) | shots/.../trinitronTv.png |
| `framedRacePhoto` | Running | partial | dark inner photo filled (7.8%) | sparse, figure barely visible (2.0% / 3.9%) | shots/.../framedRacePhoto.png |
| `ps1JewelCase` | Sony | partial | dark spine/region (7.4%) | under-shaded (2.2% / 2.8%) | shots/.../ps1JewelCase.png |
| `vinylLpSleeve` | Punk rock | partial | dark sleeve (6.9%) | under-shaded (1.9% / 3.5%) | shots/.../vinylLpSleeve.png |
| `wrestlingCard` | WWE | partial | dark fields (5.3%) | under-shaded (2.0% / 3.2%) | shots/.../wrestlingCard.png |
| `letterboxdCard` | Movies | partial | dark fields (4.9%) | under-shaded (2.1% / 3.8%) | shots/.../letterboxdCard.png |
| `looseCartridge` | Nintendo | partial | dark body (3.9%) | under-shaded (1.6% / 2.8%) | shots/.../looseCartridge.png |
| `perrierPoster` | Seltzer | partial | dark field (3.9%) | under-shaded (1.6% / 2.8%) | shots/.../perrierPoster.png |
| `passportDocument` | Roots | full drop | dense passport body (6.7% dark) | empty outline | shots/rough-handdrawn/passportDocument.png |
| `boxedGameCartridge` | Nintendo | full drop | dense box (4.9% dark) | empty outline | shots/rough-handdrawn/boxedGameCartridge.png |

Same root cause for all: a large dark `fill=STROKE` region classified as `structural-frame` (outer-frame-encloses-all) or `paper` (fallback), losing its fill. The pixel deltas come from `/tmp/dd-2d-sweep/results.json`; each row was screenshot-READ.

> **Borderline (counted as BY-DESIGN, listed here for the fix phase to eyeball):** `stackedSketchbooks` (5.4%→1.7%) and `flagPanel` (4.8%→2.4%) DO receive real hachure on their dark bands (visible cross-hatch in the screenshots) — they read as faithful-but-light, not empty. Whether the hachure density should track source darkness more aggressively is a **calibration** call (Phase A), not the frame-misroute bug. Leaving them on the by-design side; the fix should re-check after the frame rule is darkness-gated.

### (2) BY-DESIGN / CORRECT — looks "off" but faithful to source

| Shape×style class | Why it's correct |
|---|---|
| All `WASH` (8% ink) regions in every smart style — e.g. `processPrint`, `framedFlyer`, `conferenceLanyard`, `controllerShadowBox`, `ringsideTicket`, the bordered-card outer rects | darkness 0.08 → Light band → sparse/near-empty by I-2. The **wash-darkness flood fix is confirmed live** (washes render light grey, not solid black). |
| `<text>` labels (104 dark text regions render `fillStyle:none`) | Text is never hachured (classifier `text-label` rule, I-2). Glyphs render as glyphs. Correct. |
| `fill=none` stroke-only artwork (open strokes, line decorations, stripe rules) | Outline pass only, no fill marks (two-pass contract §1). Correct. |
| `stackedSketchbooks` alternating dark/light spines | Faithful: dark spines hachure, light spines stay light (Sebs-named correct case). |
| `flagPanel` stripe bands | Stripe-cluster members hachure per band — visible cross-hatch, correct. |
| Whole catalog: 0 NaN, 0 console errors, 0 overflow across 2,167 cells | Engine is geometrically clean. No broken geometry anywhere. |

### (3) NOT-BUILT-INPUT — not a render bug

| Item | What it is | Status |
|---|---|---|
| `wet-ink` · `charcoal` · `newsprint` · `risograph` **shading** | **SA-3 smart-gate.** These 4 styles never enter the smart-shading path — they are filter/clone-over-the-clean-source. They keep dark fills (look ≈ clean+texture) but apply **zero hand-drawn mark conversion**. Tonal-fill grammar for them lives in `techniqueMap.ts` (total over all 8 styles) but the `SvgStyleTransform` gate at line 2544 admits only the 4 rough-family styles — a documented 1-line host edit deferred to a later rock. | scoped, not on smart path |
| `sketchy` fill marks | Preset is `fillStyle:none` by design (quick-draft register strips fills, §1 "Bypass fill marks"). Its dark-fill loss is partly this, partly the bug; treated under the bug rows where it shares the smart-path drop. | by-design + shares bug |
| Tone-brush / Region-fill / Lasso / Shape-assist (F1/F2/F3) | The user INPUT tools that would let a user paint discrete darkness onto non-enclosed regions (feeding source-darkness). Mid-build (Round 8), not a render-engine bug. | in-flight build |
| FX styles' lack of darkness-driven density | Same as SA-3 — a missing capability, not a regression. | not-built |

### (F) FIX-IN-FLIGHT — already being fixed in the uncommitted working tree (do NOT re-file as new bugs)

| Item | Working-tree state | Verified in this build |
|---|---|---|
| **Risograph ceiling flood** (colorShift 1.0 → black-stamp over light artwork) | `RISO_KNEE 0.7` / `RISO_CEIL 0.82` opacity-compression added (`SvgStyleTransform.tsx` ~2086) | ✅ **FIXED** — `processPrint`, `bandTshirt` render as clean grey wash + offset, not a black mass. |
| **Outline-only blank posters** (4 cells: `pitchDeckCover`, `framedMoviePoster`, `psPoster`, `ppvPoster`) | `applyOutlineOnlySynthesis` added + `outline-only` joined `NEEDS_DOM_CLONE` (~2455) | ⚠️ **STILL BLANK** — see flag below. |

> 🚩 **Flag to the SvgStyleTransform fix owner (verified, not speculation):** the in-flight outline-only fix is in the emitted bundle but **does not work** — the 4 posters are still BLANK under outline-only (sweep + live DOM probe both confirm `data-f3-outline-synth` count = 0 on the rendered clone). **Root cause:** `applyOutlineOnlySynthesis` reads `getComputedStyle(el).fill` to decide whether to synthesize a contour, but the outline-only CSS rule `[data-svg-style="outline-only"] svg [fill]:not(text) { fill: transparent !important; }` has *already* forced the computed fill to `rgba(0,0,0,0)`, so `wireframePaintVisible()` returns false and every fill-only rect is skipped. The synthesis must read the **raw `fill` attribute** (or run before the CSS applies), not the post-CSS computed fill. Counted as fix-in-flight per instructions, but it needs another pass — it is not actually resolved.

---

## Summary counts

| Classification | Count | Notes |
|---|---|---|
| 🔴 **REAL ENGINE BUGS** | **~15 shapes** (6 full-drop + ~9 under-shaded), ×4 smart styles | **ONE root cause** (`outer-frame-encloses-all` ignores darkness; + `paper` fallback on dark). |
| 🟢 BY-DESIGN / CORRECT | the large majority — all washes, all text, all `fill=none`, stripe bands, alternating spines; 2,167/2,167 cells geometrically clean | wash + riso floods confirmed FIXED. |
| 🟡 NOT-BUILT-INPUT | 4 FX styles off the smart path (SA-3) + F1/F2/F3 input tools | scoped, not regressions. |
| 🟦 FIX-IN-FLIGHT | 2 items (risograph flood ✅ fixed; outline-only ⚠️ still blank — flagged) | do not re-file. |
| Crashes / NaN / console errors | **0** across all 2,167 cells | engine is sound. |

---

## Prioritized REAL-BUG list for the fix phase (P11)

1. **[P0 · single-rule fix · highest visible impact] Darkness-gate the frame classifier.** In `classifier.ts`, `outer-frame-encloses-all` (and `outer-frame-bordered-wash`) must NOT route a region to `structural-frame` when its `darknessL` is high (e.g. ≥ the Dark band ~0.55). A full-bleed near-black rect is a **filled poster body**, not a frame border. Gate on darkness (a dark enclosing rect → `solid-content`/`dense-tonal`, keep its fill). This single fix recovers all 6 full-drop posters + the inner-dark-photo partials.
   - Regression guard (per `feedback_never_declare_fixed_without_regression_check`): the wash-bordered cards (`processPrint`, `framedFlyer`, `ringsideTicket`, `controllerShadowBox`) MUST still classify as frames (their outer rect is a WASH, darkness 0.08 — the darkness gate naturally keeps them as frames). Re-run `tools/2d/audit-style-sweep.mjs` + the classifier golden-diff after the change.
2. **[P1] Fix the `paper` fallback on confident-dark regions.** `fallback:no-provider-confident` returns `role:paper` even when `darknessL` is high (10 dark regions). A dark region nothing else claimed should fall back to a tonal role, not paper.
3. **[P2 · re-finish in-flight] Outline-only synthesis reads post-CSS computed fill → no-op.** Read the raw `fill` attribute instead (flag above). 4 posters still blank.
4. **[P3 · calibration, not misroute] Phase-A density on correctly-classified dark fills.** After #1, re-check `stackedSketchbooks` / `flagPanel` / the partial set — hachure density should track source darkness (currently reads light). This is the Phase-A coverage calibration, separate from the frame bug.
5. **[P4 · scope, not bug] Lift the smart-hachure gate for the FX styles** (SA-3) — the 1-line `SvgStyleTransform.tsx:2544` host edit so wet-ink/charcoal/risograph/newsprint route their tonal-fill grammar through the shared coverage math (`techniqueMap.ts` is already total over all 8). Today they preserve dark fills by accident (filter-over-source) but get no hand-drawn conversion.

---

## Smart / ML-layer foundation note

Per `docs/memory/project_smart_layer_foundation_via_audit.md` + `07-architecture-ml-pipeline.md`, this catalog IS labeled training data for the smart/ML shading layer — not a throwaway debug pass. Each row is a tuple `(shape signals → expected treatment → actual treatment → human label ∈ {bug, by-design, not-built})`. The 6 full-drop posters are the cleanest **negative** examples for the classifier (large dark fill mis-labeled `structural-frame`); the wash-bordered cards are the **positive** frame examples that must stay frames — together they define the decision boundary the darkness-gate fix (or a learned classifier) must draw. The raw per-region decision log (`window.__dd_decisionLog`, 2,788 entries with role/darknessL/firedRules/margin) is the feature-labeled dataset; `/tmp/dd-2d-sweep/results.json` is the rendered-outcome ground truth. Keep both with this doc.

---

## Sources

`tools/2d/audit-style-sweep.{mjs,html}` (re-run on `/tmp/dd-fid-sweep-dist`, port 4517) · `/tmp/dd-2d-sweep/` (mosaics, shots, results.json, sweep-table.md) · live probes `/tmp/probe-outline2.mjs`, `/tmp/probe-decision{2,3}.mjs`, `/tmp/probe-map.mjs` · `src/app/components/canvas/SvgStyleTransform.tsx` (render-path gate :2544, in-flight diff) · `src/app/lib/smartHachure/{classifier.ts:107, signals.ts:240}` · `src/app/lib/items/PinShape.tsx` (source fills) · `09-LOCKED-MODEL.md` (I-1/I-2 contract) · `docs/submission/{test-coverage-gap-map.md, recent-rounds-coverage-check.md, submission-gap-audit.md, prod-static-runtime-smoke.md}` · already-fixed: wash-darkness `5df2931`, risograph + outline-only in working-tree diff.
