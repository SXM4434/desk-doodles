# Shade Brush — fill-feel behavior spec (R2 research spec)

**Date:** 2026-06-12 · **Status:** research spec, build-ready pending SEBS DECISIONS (§7)
**Trigger:** Sebs's Shade-register test (video 06-12 7:57pm): "the shading just acts like strokes — we want more of a fill behavior" · "drawing a shade stroke over the same does nothing" · "when I start drawing strokes in a region it glitches out." The creation ceiling is the point: tone work should reach what the /audit pages show (197 shapes of region-tone craft).
**Siblings (stay-in-lane):** `region-fill-spec.md` (R1 — bucket/highlight/lasso region-targeted fill; refers to this doc as "shade-brush-spec.md", same doc) · `shape-snap-spec.md` · `shading-axes-spec.md`. This doc owns ONLY the freehand brush's feel: accumulation, blending, eraser, persistence, ink interaction.
**Governing refs:** `conversion-semantics-addendum.md` ch.2 (toneFills record contract, cache key, never-average) · `mark-intent-boundary-spec.md` §4 (brush = explicit register, beats inference) · `coverage.ts` COVERAGE_BANDS (one band table) · `strokeTo3d.ts` pool raster (`extractPoolRegions`, `REGION_EXTRACTOR_VERSION`) · `DrawSurface.tsx` / `DrawPanel.tsx` as-built.

---

## 1. Diagnosis — each complaint against the as-built code

Headless repro (playwright, READ-ONLY, no Done): `/tmp/dd-shade-repro/repro.mjs` → shots `A1/B1/C-after/D1/E1/E2*.png`. All three complaints reproduced 06-12.

**C1 — "acts like strokes."** Root cause: every pen-down→pen-up becomes ONE discrete capsule patch. `toneOutline()` (`DrawSurface.tsx:188-201`) sweeps the centerline through perfect-freehand `getStroke` at `size = 2×radius`; `handlePointerUp` (`:700-714`) appends it as a standalone `ToneFill`. Nothing ever merges — 6 passes = 6 `<path>` nodes (counted in repro). A back-and-forth scribble is one lumpy worm (shot `A1`), its outline decimated to 64 anchors (`TONE_OUTLINE_MAX_PTS:179`) which jags long gestures further. The brush records *gestures*; fill-feel requires it to record *coverage*.

**C2 — "over the same does nothing."** Two opposite behaviors, both wrong together:
- *Raw Sketch layer*: one `<g>` per band at group `opacity={0.55}` (`:815`) — flat by construction ("never compounds," comment `:793-798`), so a same-band repaint is interior-invisible. No-op was deliberate (addendum ch.2.3 "never average") but there is **no buildup affordance at all**, so it reads dead.
- *Styled render*: the no-op is an illusion. Every invisible repaint appended another patch; in the style pipeline each patch is its own region, marks stack multiplicatively — 5 overlapping band-3 passes render near-BLACK (shot `E2` right; ~1−0.54⁵ ≈ 95% coverage). Raw preview and styled output disagree → WYSIWYG broken. Bonus rot: invisible patches eat the 24KB `TONE_FILLS_JSON_BUDGET` (`:182`), silently degrading all outlines via `capToneFills`.

**C3 — "strokes in a region glitches out."** Sketch mode is fine (shot `D1`); the glitch is the styled render (shots `E1/E2`): (a) a scribbled sweep outline **self-intersects** (perfect-freehand makes no guarantee against it on hairpin centerlines); the browser fills it nonzero (solid blob in Sketch) but the mark pipeline's scanline fill treats crossings even-odd → alternating solid-black wedges and voids at densities unrelated to the brushed band (`E2` left) — the deferred fill-rule-normalize gap (18-scope-audit row 16, rough.js scanline); (b) the per-patch compounding from C2 buries ink strokes drawn in the region under near-solid marks. Verdict: the discrete-capsule record is the single upstream cause of all three.

---

## 2. The fix — brush into a BAND MASK, not a patch list

One architectural change dissolves C1/C2/C3 together: during a draw session the shade register's source of truth is a **per-cell band grid** (the soft coverage mask), not an array of capsules.

- **Grid:** `Uint8Array`, draw-frame space (800×600), 2px cells → 400×300 (120K cells, trivially cheap). Cell value = band index 0–7 (0 = paper). Lives in a DrawSurface ref for the session only — it is never stored.
- **Brushing:** each pointermove stamps the brush disc (radius slider) into the grid through the §3 rule table — exactly how raster brushes work in Procreate/Photoshop. Live preview keeps today's cheap swept-capsule overlay while the pointer is down.
- **Pen-lift = extraction:** trace each band's cell islands (+holes) into closed outlines using the pool-raster contour machinery already blessed as THE region extractor — same marching-loop + depth pass as `rasterizePoolLoops`, same RDP + Chaikin simplify (`SOLID_RDP_EPSILON_CELLS`, `chaikinClosed`, `strokeTo3d.ts:1320-1328`), behind its own `TONE_MASK_VERSION` constant (golden-gate pattern, addendum ch.2.2). Overlapping passes are now ONE region per band island, contours are non-self-intersecting **by construction** (kills C3a), one region per area (kills C2's compounding + C3b), smooth merged boundary (kills C1's worm).
- **Record unchanged:** output is still `render_config.toneFills: Array<{id, points, band}>` — same schema, same `capToneFills` guard, just fewer/bigger patches (holes: emit hole loops as separate subpaths in one `<path>` with `fill-rule="evenodd"`, mirroring the extractor's outer/hole roles). Re-draw reload re-rasterizes stored outlines into the grid at their band (ascending band order, darker wins) — deterministic round-trip, because stored patches are already *resolved* band statements; §3 rules apply only at brush time.
- **Bump `TONE_OUTLINE_MAX_PTS` 64 → 128 for merged regions** (one merged region replaces many capsules; net JSON shrinks).

---

## 3. Accumulation + blending — ONE deterministic rule table (the marker model)

What the reference tools do: **Photoshop** Opacity caps paint flat *within* one stroke; lifting the pen and stroking again adds another layer ([Phlearn](https://phlearn.com/tutorial/the-difference-between-flow-and-opacity-in-photoshop/), [How-To Geek](https://www.howtogeek.com/749933/whats-the-difference-between-opacity-flow-and-density-in-photoshop/)). **Procreate** glazed rendering: a stroke holds one tone no matter how much it self-overlaps; it darkens only on stylus lift + re-stroke ([Procreate Handbook — Brush Studio rendering](https://help.procreate.com/procreate/handbook/brushes/brush-studio-settings), [Adventures with Art](https://adventureswithart.com/procreate-glazed-brushes/)). **Copic markers**: layering the same color darkens roughly one value step per dried pass ([Ellen Hutson Copic shading tutorial](https://blog.ellenhutson.com/2018/08/08/copic-marker-shading-tutorial/), [Copic 101](https://shurkus.com/tutorial/copic-101-all-you-need-to-know-to-get-started)). **Clip Studio screentone layers** are the opposite school: a tone is a flat-density mask; repainting never darkens — you pick a different density ([CSP manual — Screentones](https://help.clip-studio.com/en-us/manual_en/540_comic/Screentones.htm)).

Recommendation: the **marker model** — it is what Sebs's complaint literally asks for, and Desk Doodles is a hand-feel product, not a manga-production tool. Per grid cell, brush band `p` over existing cell band `b`, applied at stamp time:

| Case | Rule | Result | Grounding |
|---|---|---|---|
| onto paper (`b = 0`) | paint | `p` | — |
| same band, SAME stroke (pen still down) | flat — no buildup within a stroke | `b` | Photoshop Opacity · Procreate glaze |
| same band, NEW stroke (`p = b`) | **darken one band** | `min(7, b+1)` | Copic same-color layering |
| darker over lighter (`p > b`) | replace | `p` | marker physics; Multiply-family blending |
| lighter over darker (`p < b`) | **ignore** — markers can't lighten | `b` | marker physics; lightening = eraser's job (§4) |

Never average (addendum ch.2.3 holds — every cell always carries a band the user's acts produced). "Same stroke" = cells already stamped since pen-down (a per-stroke dirty bitset; cheap). The whole table is per-cell deterministic → same gesture sequence, same record, cacheable.

---

## 4. Eraser semantics

Erase is a **band-0 stamp**: the same disc writes 0 into the grid; pen-lift re-extracts. This upgrades today's whole-patch lift (`eraseToneAt`, `DrawSurface.tsx:661-666` — addendum ch.2.3 deferred per-pixel subtraction, which the grid now makes free): partial erase carves regions, full pass clears them, a tap is a dab-lift. Erase ignores band — it lifts whatever is there (paper is the absence of tone, `ToneFill` doc `:139-141`). Lighten workflow = erase, then brush the lighter band. Eraser radius = the same Brush slider. No change to `ToneShadeCluster` chrome (`DrawSurface.tsx:1133+`) beyond the tooltip copy.

---

## 5. Persistence, determinism, caching

- `render_config.toneFills` schema is UNCHANGED (addendum ch.2.1: sibling of strokes, band index not alpha, never baked-only-into-svg). Downstream consumers — `toneFillsMarkup`/`strokesToObjectMarkup` (`DrawSurface.tsx:59-94, :253-265`), DrawPanel Done staging (`DrawPanel.tsx:548-567`), ch.2.3 region re-bind, ch.3.2 AI-conditioning rasterize — see the same type with healthier geometry.
- Extraction is versioned (`TONE_MASK_VERSION`) and pure: (stored patches ∪ session gestures) → grid → outlines is a deterministic function. Conversion caches already key on `SHA-1(svg ∥ strokesJson ∥ toneFillsJson ∥ extractorVersion)` (addendum ch.2.2) — append `TONE_MASK_VERSION` to that concatenation; no schema change.
- Budgets: `TONE_FILLS_JSON_BUDGET` 24KB stands; merging makes typical records smaller, and the C2 invisible-repaint budget leak is gone (repaints mutate cells, never append records).

---

## 6. Interaction with ink strokes (and WYSIWYG)

- **Shade under ink, always.** Already structural — tone paths precede stroke paths in document order in every markup builder (`strokesToObjectMarkup:85-93`, `composeBackdropAndStrokes:377-389`, styled layer `DrawSurface.tsx:854-893`); upload precedence ladder per addendum ch.2.5. Keep invariant; add a battery assertion.
- **Ink never perturbs tone.** Ink strokes and the band grid are independent pools; drawing ink in a shaded region only re-renders layers (C3's glitch was tone geometry, fixed in §2). Region *binding* of tone to ink-enclosed regions is conversion-time (addendum ch.2.3-2.4) — not this brush's job.
- **WYSIWYG gap to close:** raw Sketch tone renders at 0.55 opacity while the styled pipeline reads the full band grey — sketch systematically lies ~half a ladder light. Recommend raising the raw layer toward the true band grey (~0.85–1.0, ink stays legible because ink is ON TOP and pure-dark); exact value is a Sebs eyeball (SB-3).
- Styled render after §2: one region per band island → classifier reads the band grey (I-2; brushed band ≡ inferred band downstream) → marks at honest `coverage.ts` density; ink stays legible over band-3 marks instead of drowning in stacked black.

---

## 7. SEBS DECISIONS

| # | Decision | Recommendation |
|---|---|---|
| SB-1 | Accumulation school: marker buildup (same band re-stroke darkens +1) vs Clip-Studio statement (same band = no-op; darken only via picker) | **Marker buildup** — it's the complaint verbatim; picker still jumps bands directly |
| SB-2 | Lighter band over darker: ignore vs replace | **Ignore** (markers can't lighten; keeps one-way ladder + eraser story clean). Replace = more "direct manipulation" but makes accidental light passes destructive |
| SB-3 | Raw-preview tone opacity 0.55 → ~0.85–1.0 (WYSIWYG) | Raise; eyeball the exact value on real doodles |
| SB-4 | Within-stroke flatness (no buildup until pen-lift) | **Keep flat** — Photoshop/Procreate convention; scrubbing one pass stays controllable |
| SB-5 | Partial (per-cell) erase replacing whole-patch lift now, in the same build | **Yes** — the grid makes it ~free; whole-patch lift was only a stopgap |
| SB-6 | Live preview during a stroke: capsule overlay (cheap, today's) vs live grid render | Capsule overlay for makeathon; live grid is polish |

---

## 8. Citations

**Ours:** `DrawSurface.tsx` (`toneOutline:188`, patch append `:700-714`, raw layer `:793-823`, styled layer `:854-893`, eraser `:661-666`, `ToneShadeCluster:1133`) · `DrawPanel.tsx` (register `:254`, Done staging `:548-567`) · `conversion-semantics-addendum.md` ch.2.1-2.5 · `mark-intent-boundary-spec.md` §4 (D2-F: brush beats inference) · `coverage.ts` `COVERAGE_BANDS` · `strokeTo3d.ts` `extractPoolRegions:1302` / `REGION_EXTRACTOR_VERSION:1278` (the versioned raster→contour machinery §2 reuses) · 18-scope-audit row 16 (fill-rule/scanline gap) · repro evidence `/tmp/dd-shade-repro/` (script + 7 shots, 2026-06-12).
**External:** [Procreate Handbook — Brush Studio Settings (rendering/glaze)](https://help.procreate.com/procreate/handbook/brushes/brush-studio-settings) · [Adventures with Art — Procreate glazed brushes](https://adventureswithart.com/procreate-glazed-brushes/) · [Phlearn — Flow vs Opacity in Photoshop](https://phlearn.com/tutorial/the-difference-between-flow-and-opacity-in-photoshop/) · [How-To Geek — Opacity, Flow & Density](https://www.howtogeek.com/749933/whats-the-difference-between-opacity-flow-and-density-in-photoshop/) · [Clip Studio Paint manual — Screentones](https://help.clip-studio.com/en-us/manual_en/540_comic/Screentones.htm) · [Ellen Hutson — Copic shading tutorial](https://blog.ellenhutson.com/2018/08/08/copic-marker-shading-tutorial/) · [Copic 101 (layering)](https://shurkus.com/tutorial/copic-101-all-you-need-to-know-to-get-started) · [perfect-freehand](https://github.com/steveruizok/perfect-freehand) (swept outlines; no non-self-intersection guarantee) · [rough.js](https://github.com/rough-stuff/rough) scanline fill (+ [issue #65](https://github.com/rough-stuff/rough/issues/65), already in our handoff).
