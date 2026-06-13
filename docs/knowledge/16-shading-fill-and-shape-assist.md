# 16 — Shading, Region Fill & Shape Assist: the "ink without the ink outline" system

**In one sentence:** Shading is two layers — the tone **band** says *how dark* (permanent, lives in the record, survives every style switch) and the per-style **axes** say *what kind of marks* express that darkness — and the 2026-06-12 research pass (4 parallel agents, specs in `docs/design/`) turned Sebs's video feedback into three input tools (boundary-aware Brush, ink-derived tap-Fill, freehand Lasso) plus an ink-side Shape Assist (Snap/Straighten), all riding the ONE region brain already built for 3D conversion.

> The band table + per-style grammar is [06-tone-and-shading.md](06-tone-and-shading.md); the record/pen model these tools write into is [11-the-pen-model.md](11-the-pen-model.md); the region extractor they share with 3D is in [13-the-3d-system.md](13-the-3d-system.md). This page is the input-tool system and its laws.

---

## Plain language

### The founding insight (Sebs, mid-sentence, 2026-06-12)

> "…a more defined region, like it's essentially the ink without the ink outline."

The region you want to fill **already exists — your ink drew it**. The fill tool doesn't ask you to outline anything; it *finds* the enclosed area bounded by your strokes and floods it with tone, no outline added, tone under ink. Accuracy comes from the ink, not from how carefully you gesture. That one idea collapsed three feature requests (bucket, highlight, lasso) into two tools, because bucket and highlight are the same operation (extractor-backed region pick) and only lasso does something the ink can't.

### The three tools, sorted by where accuracy comes from

| Tool | Region comes from | For |
|---|---|---|
| **Brush** | your hand, clipped to the ink region you're inside | partial/textured shading inside a shape |
| **Fill** (tap or scrub) | the ink itself (pool-raster extractor) | flat-filling a whole ink-bounded region |
| **Lasso** | your gesture, auto-closed | regions ink can't define (shadows, open space, vignettes) |

One **region brain** (the pool-raster extractor from `strokeTo3d.ts`) feeds four consumers: tap-fill (2D), brush clipping (2D), solid faces (3D), donut holes (3D). What fills in the panel is what becomes mass in 3D — consistency by construction, not by testing.

### The almost-closed problem (quick circle that didn't quite close)

Layered forgiveness, never a dead end:

1. **Free** — the extractor thickens ink before looking for loops (stamp radius IS the gap tolerance), so small gaps fill with zero user action.
2. **The scrub rescue** — too big a gap → honest "no region found" caption, then press-hold-drag sideways widens tolerance with a LIVE region preview (Procreate ColorDrop move). Plus a persistent 6-tick Gap slider.
3. **Lasso** as the universal fallback; **Snap** as a sidedoor (snapping the circle closes it).
4. **Anti-fixture law:** a C-shape must NEVER fill even at max tolerance — forgiveness may not become wrongness.
5. Every miss/rescue logged → the smart layer learns real gap sizes from real hands.

The lasso has its own not-closed answer: it **auto-closes on release** with a straight chord, the chord is shown dashed LIVE while dragging (auto-close is never a surprise), and degenerate flicks are refused honestly (no sliver patches).

### Shade brush: why the video glitched, and the marker model

All three video complaints (2026-06-12, 7:57pm recording) were ONE root cause: each swipe was stored as its own sausage-outline polygon — so they never merged (stroke feel), stacked invisibly (multiplicative darkening after styling), and self-intersected (the spiky-shard / white-cap-circle glitches). The rebuild (Rock F1, in flight): the brush paints into a hidden per-cell 8-band grid; pen-lift traces one clean merged region per band. Same `toneFills` storage, no schema change.

**Accumulation = the marker model (Sebs-ratified):** flat within one stroke; a NEW stroke over the same band darkens +1 band (Copic layering — his complaint verbatim), capped at 7; darker replaces lighter; lighter over darker does nothing (markers can't lighten — erase to go back); never average. Eraser carves per-cell partial chunks.

### Shape Assist: snap the intent, keep the hand

Two pills in the Ink cluster, one pure engine (`lib/draw/shapeFit.ts`): **Snap** (auto-detect line/polyline/polygon/triangle/rect/circle/ellipse → chip shows the pick → tapping the chip cycles ranked candidates *including the original* — the "clearly drew a triangle but wants something else" case is a first-class path) and **Straighten** (same engine, corner-chain only — crisps edges without forcing a textbook shape). The snapped result **replaces the stroke's points and stays a stroke** — the pen still renders it, 3D/shading/publish need zero special cases.

**THE LAW (Sebs, ratified in chat):** freehand is the default, always. Snap/Straighten are **verbs, not modes** — they act on the last stroke only when tapped. No auto-snap on pen-up, no unprompted suggestion chips. A user who never touches the pills never sees the feature. (Honesty twin: a stroke that doesn't read as one clean shape is refused with a caption, never mangled — refusals logged with the full candidate table as training data.)

### Audit parity (the bar from the video's /audit tour)

R4's census of the 197-shape catalog: **zero gradients, zero multi-color**. The catalog's entire trick is one ink + light wash + solid fills + clean shapes + repeated ticks + tiny text + white knockouts. So shade brush + region fill close the wash/solid gap, shape-snap closes the clean-shapes gap (rounded-rect = first v1.1 add — MacBook/Game Boy/monitor all use it), and the rest is convenience (repeat tool, text, knockouts) — deferred or never (gradients: never; the 8 bands ARE the discrete gradient).

---

## Honest status ledger (move forward only)

| Piece | State (2026-06-12 night) |
|---|---|
| 4 research specs (`region-fill`, `shade-brush-behavior`, `shape-assist`, `shading-axes-architecture`) | LANDED in docs/design/, real external citations |
| Rock F1 — grid brush + marker accumulation + partial erase | BUILDING (workflow `wf_850a5e75`) |
| Rock F2 — Fill/Lasso pills + gap scrub + chord preview | QUEUED behind F1 in same pipeline |
| Rock F3 — shapeFit.ts + Snap/Straighten pills | QUEUED behind F2 |
| Gap-sweep battery (0–40px circles + C-shape anti-fixture) | SPECCED as F2's headline gate |
| FX-styles gate lift (SA-3, 1-line) + tone-never-vanishes fallback (SA-2) | QUEUED behind round-7b (file collision avoidance) |
| Sebs eyeball gates | preview-opacity board (F1 produces) · band-7 look policy · sketchy fallback verify |

## Decision ledger (where each ruling lives)

D-RF1..7 in `region-fill-spec.md` · SB-1..6 in `shade-brush-behavior-spec.md` · SA-A..H in `shape-assist-spec.md` · SA-1..7 in `shading-axes-architecture.md`. Chat-ratified on top of the specs: marker accumulation (SB-1), vertex-editing deferred (SA-F), freehand-default law, lasso chord preview + degenerate refusal, tone-never-vanishes (SA-2 lock pending sketchy live check).
