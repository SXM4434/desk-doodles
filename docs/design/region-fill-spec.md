# Region Fill — bucket · smart-highlight · lasso, consolidated (R1 research spec)

**Date:** 2026-06-12 · **Status:** research spec, build-ready pending SEBS DECISIONS (§8)
**Trigger:** Sebs's Shade-register test (video 06-12 7:57pm): "we need to let people create stuff like we see in the audit pages." The /audit catalog (197 shapes, `PegToolShape.tsx`) is full of *regions filled with tone* — today's Shade brush can only scrub tone in freehand; there is no way to say "this region, this dark" in one act. That is the creation ceiling this tool removes.
**Siblings (stay-in-lane):** `shade-brush-spec.md` (the brush itself), `shape-snap-spec.md`, `shading-axes-spec.md`. This doc owns ONLY region-targeted fill.

---

## 1. The consolidation — three asks, two mechanisms

Sebs asked for (a) bucket fill, (b) highlight-over-region → smart fill, (c) lasso-that-fills. (a) and (b) are the SAME mechanism with two gestures; (c) is the honest fallback when the mechanism can't see a region.

| Ask | Gesture | Mechanism |
|---|---|---|
| (a) Bucket | tap inside a detected region | `extractStrokePoolRegions` hit-test → region outline → tone patch |
| (b) Smart highlight | scribble/drag over a region | same extraction; the highlight's points vote by majority containment (LazyBrush's "rule of majority" [3]) → same region outline → same tone patch |
| (c) Lasso | draw a boundary; release closes it | NO extractor — the user's lasso outline IS the patch outline |

One engine, one output type. Everything commits as a `ToneFill` record (§4) — never paint.

## 2. The engine we already have (proven, do not rebuild)

`extractStrokePoolRegions` / `extractPoolRegions` (`src/app/lib/geometry3d/strokeTo3d.ts:1370/:1302`, `REGION_EXTRACTOR_VERSION = 1`) is THE drawn-register region extractor (conversion-semantics-addendum §1.2, ratified A-3). Properties that matter here:

- **Gap-tolerant by construction:** strokes stamp as capsules of `inkRadius` (`stampInkBody` :900) — "near-misses fuse and T-junction gaps ≤ ink radius auto-close — the ink radius IS the tolerance" (:1299-1301). This is the same job Clip Studio's "Close gap" fill setting does [4] and Photoshop approximates with Tolerance [2] — we get it from the rasterizer for free.
- **Nesting solved:** `containmentDepths` (:1062) gives the parity tree (even = outer, odd = hole); `ExtractedRegion` carries `{outline, depth, role, parentIndex, areaWorld}` (:1280). Donut parity is battery-proven (Rock 2, 11/11).
- **Noise-floored:** loops under `SOLID_MIN_LOOP_AREA` are dropped — tiny accidental slivers never become fill targets.
- **Deterministic + versioned** — cacheable, and every fill decision is replayable for training (§7).

Gap to close for THIS feature: the extractor outputs WORLD coords (pool-centered, y-normalized); `ToneFill.points` are draw-frame viewBox px. Build needs the inverse of `normalizeStrokePoints` applied to `outline` (the `poolCenter`/`WORLD_SCALE` mapping is already explicit at :1380-1391) — a ~15-line adapter, not a new extractor.

## 3. Tool UI — where the pills live

The Shade register's tool chrome is `ToneShadeCluster` (`DrawSurface.tsx:1133`), mounted by DrawPanel beside the Ink|Shade register pills (`DrawPanel.tsx:921`). Region fill is a **tool mode inside Shade**, not a fourth register — the register answers "what does the pointer put down" (tone), the tool answers "how" (D-RF1).

```
[Ink | Shade]   [Brush | Fill | Lasso]   [●●●●●●●  band swatches 1-7]  [Erase]  [Brush 26px | Gap 1.0×]
```

- **Brush** — the shipped tone brush, untouched (shade-brush-spec.md owns it).
- **Fill** — extractor-backed. Hover previews the region under the cursor (§5); tap commits; drag = highlight-select (§5). The radius slider swaps for a **Gap slider** (tolerance multiplier on `inkRadius`, §6) — same slot, per-tool relabel, pill idioms per `chromeStyles.ts`.
- **Lasso** — freeform outline; release auto-closes start→end (Krita's Enclose-and-Fill lasso closes the enclosing region the same way [5]; forgiving beats fussy on hand input — D-RF7). The committed patch outline = the lasso path through the existing `capToneFills` decimation (≤ `TONE_OUTLINE_MAX_PTS`).
- **Band swatches + Erase are shared by all three tools** — one band ladder (coverage.ts `COVERAGE_BANDS`), one erase semantics (band 0 = paper = absence). Erase in Fill mode = tap a region to lift the patch(es) whose outline matches it — same patch-level granularity as brush erase (`eraseToneAt` :664).

## 4. Band application — fills write tone bands, not paint (the I-2 contract)

A committed fill is a `ToneFill { id, points, band }` (`DrawSurface.tsx:134`) — **identical record shape to a brushed patch**. Nothing downstream changes:

- Renders as flat band-grey UNDER ink via `toneFillsMarkup` (`data-tone-band`, paint order `sortedToneFills` — band ascending, flat per band, "never average" per addendum ch.2.3).
- The style pipeline reads the band-grey as source darkness → classifier tonal roles → fillStyle marks at band density (coverage.ts §I-2 wedge: "brushed band 5 and inferred band 5 are indistinguishable downstream"). A bucket-filled band 5 is now a THIRD indistinguishable sibling. Flip fillStyle and the filled region re-renders as hachure/cross-hatch/dots at the same band — this is exactly what the audit-page looks need.
- Explicit-register precedence holds: a filled band on a region nulls any R4–R8 inferred band there (mark-intent-boundary-spec §4, D2-F mirror). Fill = explicit, same rank as brush.
- Rides `render_config.toneFills` within `TONE_FILLS_JSON_BUDGET` (24KB); region outlines are already RDP+Chaikin-simplified and decimate to ≤64 pts — cheaper than most brush sweeps.
- **No color fill at makeathon scope** (D-RF2): tone bands only; ink color stays the palette system's job. Procreate/Photoshop fill paint because paint is their medium; our medium is the band ladder.

**Record addition (D-RF6):** optional provenance on ToneFill — `src?: 'brush' | 'fill' | 'lasso'` (+ `gapTol?` when ≠ 1) — for the training ladder (§7). A few bytes per patch; `capToneFills` already budget-guards.

## 5. The smart suggestion moment — preview BEFORE commit (decision-logged)

How shipping tools handle "did I mean that region?": Procreate commits instantly and lets you scrub threshold after the drop [1]; Fresco lets you adjust Color margin after filling [6]; Clip Studio previews nothing but offers per-tool gap settings [4]. We can do better than all three because our regions are **vector outlines known before commit**:

1. **Hover (Fill mode):** pointer-move hit-tests detected regions (`pointInLoop` :1046, innermost wins — §6 nested). The candidate region renders as a translucent band-grey wash (current swatch, ~0.35 opacity) + a dashed outline — the same honest-cursor idiom as the shade brush's footprint ring (:953). No pointer-down, no commitment.
2. **Tap:** commits the hovered region. One act, no dialog.
3. **Highlight-drag:** drag scribbles a transient highlight; on release, each detected region scores by the fraction of highlight points inside it (majority containment — LazyBrush's soft-scribble rule [3]). Winner(s) ≥ 0.6 commit; a highlight straddling siblings commits each region it majority-covers separately (bands stay per-region statements, addendum ch.2.3). The highlight itself is never recorded as ink.
4. **Miss:** no region under the act → quiet caption in the register row's caption slot (the shipped one-line slot, `DrawPanel.tsx:693`): *"no closed region here — raise Gap, or use Lasso."* Never silently fill the whole canvas (Procreate's flood-the-canvas failure [7] is the anti-pattern).

Every preview→outcome pair is decision-logged (§7). This moment is also where the learned ladder will someday pre-suggest ("you always fill the eyes band 7") — log now, learn later.

## 6. Gap tolerance UX — the Procreate threshold-drag, adapted

Procreate's one great fill idea: drag-without-release scrubs Threshold on a thin bar, live, and the setting persists [1]. Ours maps the scrub to the **ink-stamp radius**, the extractor's native tolerance (§2):

- **Gap slider (persistent):** multiplier on `inkRadius`, ladder `0.5× · 0.75× · 1× · 1.5× · 2× · 3×` (6 ticks per `feedback_more_toggle_options_better`; default 1× = `SOLID_INK_RADIUS` parity with 3D conversion). Persists per-session like Procreate's remembered threshold.
- **Press-hold-drag (in-context):** hold on a region without releasing → after ~350ms the Gap scrub arms; horizontal drag walks the ladder; **the region preview re-extracts live** so the user watches the leak happen (drag right = gaps close = region grows/merges; drag left = region splits). Release commits at the current tolerance. Both controls, not either (D-RF3).
- **Cost control:** re-extraction per ladder step, not per pixel — 6 cached extractions max (`extractStrokePoolRegions` keyed `(contentHash, gapStep)`, resolution already capped by `SOLID_MAX_GRID_RESOLUTION`). Extraction runs panel-local on the 800×600 frame: run on entering Fill mode + debounced after stroke edits, NOT per pointermove (the N-object drag perf alarm's lesson).

## 7. Edge cases + decision log

| Case | Behavior | Why |
|---|---|---|
| Open region (extractor sees nothing) | §5.4 miss caption → Gap scrub or Lasso. Lasso-after-miss is logged as an extractor-miss label | the parity-holes battery proved the extractor honest; misses are DATA, not bugs |
| Tiny region (< area floor) | not a target (filtered at `SOLID_MIN_LOOP_AREA`); tap falls to the containing region | accidental slivers must not eat taps |
| Nested (donut hole, eye in face) | **innermost region under the point wins** (max containment depth; holes are legitimate targets — a hole is paper the user may want toned). `parentIndex` keeps the tree for logging | D-RF4; matches every shipping bucket (fill where you tapped, not the silhouette) |
| Re-fill same region, new band | patch with same outline → REPLACE its band, don't stack | flat-per-band, never-average (ch.2.3); also keeps the record small |
| Tone patches as boundaries? | NO — extractor input is ink strokes only; tone never bounds tone | tone is under ink (record contract); bounding on tone would make fills order-dependent |
| Upload register | out of scope v1 — extractor is drawn-register; uploads keep their own fills (addendum ch.2.5 precedence ladder) | cross-ref: vision-router / upload conditioning own that lane |
| Lasso over ink | patch simply lies under the ink like any brush sweep; no masking | same as shipped brush semantics |

**Decision log (the learned ladder's diet):** every fill act pushes to `window.__dd_decisionLog` (`smartHachure/index.ts:135` collector, surface-tagged per G-10) as `{ surface: 'shade-fill', tool, gesture: tap|highlight|lasso, band, gapTol, regionDepth, regionAreaWorld, outcome: committed|cancelled|miss|lasso-after-miss, extractorVersion }`. Highlight scores and hover-previewed-but-not-committed regions are negative labels — the same per-act labeled-data pattern as `__dd_inputPickLog`'s 'overridden' events and the /audit breakage catalog (`project_smart_layer_foundation_via_audit`).

## 8. SEBS DECISIONS

| # | Question | Recommendation |
|---|---|---|
| D-RF1 | Fill/Lasso live inside the Shade register's tool row vs a separate register | **Inside Shade** — Brush·Fill·Lasso pills; register stays "tone goes down" |
| D-RF2 | Bands only, or also color fill at makeathon | **Bands only** — I-2 contract; color is the palette system's lane |
| D-RF3 | Gap control: slider vs press-hold scrub | **Both** — slider persists, scrub is in-context with live preview |
| D-RF4 | Nested tap target: innermost vs outer silhouette | **Innermost wins**; depth logged |
| D-RF5 | Should a Brush-mode scribble ALSO auto-suggest region fill | **No** — brush stays literal (explicit register, no second-guessing); highlight lives in Fill mode |
| D-RF6 | ToneFill provenance fields (`src`, `gapTol`) | **Yes** — training data, bytes are cheap, budget-guarded |
| D-RF7 | Lasso closure: always-close on release vs 3-state closure chip | **Always-close** — tone patch semantics are forgiving; 3-state stays a geometry-register concept |

## 9. Citations

**Ours:** `strokeTo3d.ts` (:900 stampInkBody, :1046 pointInLoop, :1062 containmentDepths, :1278 REGION_EXTRACTOR_VERSION, :1302/:1370 extractors) · `DrawSurface.tsx` (:134 ToneFill, :158 TONE_BAND_HEX, :188 toneOutline, :207 capToneFills, :240 sortedToneFills, :664 eraseToneAt, :1133 ToneShadeCluster) · `DrawPanel.tsx` (:254 penRegister, :693 caption slot) · `coverage.ts` (:114 COVERAGE_BANDS, :126 bandIndexForDarkness) · `smartHachure/index.ts` (:49 DecisionLogEntry, :135 __dd_decisionLog) · `conversion-semantics-addendum.md` ch.1.2/2.1/2.3/2.5, A-3 · `mark-intent-boundary-spec.md` §4 D2-F · `09-LOCKED-MODEL.md` I-1/I-2 · /audit catalog (`PegToolShape.tsx`, 197 shapes) · memory `project_desk_doodles_shading_input_tone_fill`, `project_smart_layer_foundation_via_audit`.

**External (verified 2026-06-12):**
1. Procreate Help — "How to fill an area using ColorDrop" (threshold drag: hold, thin bar, drag left/right, remembered setting): https://help.procreate.com/articles/zmlayd-fill-an-area-using-colordrop
2. Adobe Photoshop Help — "Fill an area using the Paint Bucket tool" (Tolerance 0–255, Contiguous, Anti-alias): https://helpx.adobe.com/photoshop/using/tool-techniques/paint-bucket-tool.html
3. Sýkora, Dingliana, Collins — *LazyBrush: Flexible Painting Tool for Hand-drawn Cartoons*, Eurographics 2009 (scribble → region via rule of majority; robust to gappy boundaries): https://dcgi.fel.cvut.cz/home/sykorad/Sykora09-EG.pdf
4. Clip Studio Official — "Mastering the fill tool ①/②" (Close gap, Fill narrow areas, Refer multiple/reference layer, enclose-fill): https://tips.clip-studio.com/en-us/articles/590 · https://tips.clip-studio.com/en-us/articles/591
5. Krita Manual — "Enclose and Fill Tool" (lasso/brush enclosing region → fill detected sub-regions; inspired by Clip Studio): https://docs.krita.org/en/reference_manual/tools/enclose_and_fill.html
6. Adobe Fresco Help — "How to work with colors" (Fill tool, Color margin tolerance, Reference layer fill): https://helpx.adobe.com/fresco/using/colors.html
7. Procreate Help — "Why does my color flood the canvas when I use ColorDrop?" (the leak failure mode): https://help.procreate.com/articles/dxxave-color-flood-using-colordrop
8. Concepts Help — "How do you fill a region with a color?" (no bucket on movable vectors; Filled Stroke = lasso-like positive-space fill — the precedent for Lasso-as-primary on vector strokes): https://tophatch.helpshift.com/hc/en/3-concepts/faq/171-how-do-you-fill-a-region-with-a-color/
