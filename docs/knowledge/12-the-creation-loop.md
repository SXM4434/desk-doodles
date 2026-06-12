# 12 — The Creation Loop: from blank canvas to a minted, re-editable object

**In one sentence:** The full loop is draw (or upload) → flip Sketch|Style to see it inked → name it (the minting moment) → place it on the desk as a record that kept its raw strokes → and later re-open it to restyle OR Re-draw — a closed loop because the strokes survive Done, which is what makes "edit after place" real instead of a one-way export.

---

## Plain language

A doodle is only "done" in this app when you can come *back* to it. Sebs's lock (round 4): the loop is complete only when you can `draw → style → name/why → place → reopen → restyle AND re-draw → save back to the same object.` Every stage below exists to close that loop.

### Sketch | Style — the clean swap

The create/redraw canvas has an explicit two-mode pill pair: **Sketch** and **Style**.

- **Sketch mode:** you draw, and pen-up *never transforms anything*. Your raw ink stays raw — no surprise restyling the instant you lift the pen. (This kills the old "provisional ghost" snap where lifting the pen auto-styled the stroke.)
- **Style mode:** the canvas shows the *styled* render — your strokes run through the full pen pipeline (rough-handdrawn, wet-ink, whatever the pen is set to), live, re-rendering as you move the controls.

The ratified behavior (D-7 amendment 5) is a **clean swap**: Style mode shows ONLY the styled render. A UX-audit alternative — keep raw ink faintly visible *under* the styled render, a "lens overlay" — was presented to Sebs and **rejected** ("keep what we have"). Don't re-litigate without his ask. So Sketch is your construction surface, Style is the inked result, and flipping between them is a clean cut, not a fade.

Anchor: this is the **live-material vs bake** discipline from the pipeline page, made into a UI toggle. Sketch = the live material (your raw strokes, never mutated). Style = the bake (a fresh styled render generated from those strokes). You can flip back and forth forever because the bake never overwrites the material.

### Stroke retention — the load-bearing change

For most of the build, pressing Done *threw away your raw strokes* and kept only the rendered SVG markup. That's a one-way door: once the strokes are gone, you can re-color the object but you can never re-draw it, because there's no point data left to re-run the pipeline on.

Round 4 fixed this: **Done now stores the raw perfect-freehand strokes alongside the rendered markup**, riding the object's `render_config` (no new column). The strokes are the *editable original* — the project file behind the baked image. This one change is what flips "edit after place" from a wish into a feature, and it's why the loop can finally close.

One honest size constraint: stroke data is big, and the stored SVG has a ~64KB hard cap (`publish_to_open_desk`). So strokes get **capped** — point density roughly halved (`capStrokes`) to fit a ~45KB row budget. Every downstream stroke-feature computation resamples to a fixed ~4px spacing first, so a capped record classifies identically to the live one (the $1-recognizer normalization move). Live strokes keep full fidelity; only the *stored* copy is decimated.

### The naming stage — minting, not a form

After you draw and press Done, the create flow shows a **naming card**: name + a one-line "why this object?". This is the *minting moment* — the doodle becomes a named collectible, not an anonymous row in a feed.

Two cheap psychology levers, both load-bearing:

- **Naming IS labeling.** When you christen a doodle "coffee mug," you've hand-labeled a training example for the smart system — but it feels like naming your creation, not filling a form. This is the ESP-game pattern (accurate labels fall out as a *byproduct of play*). The name is simultaneously the ML label `(name, svgHash, signalsSnapshot, chosen config)`.
- **The IKEA effect.** People value self-made things ~63% higher. Asking "why this object?" right after creation (Duolingo-style why-priming) deepens attachment *and* enriches the record.

The naming card itself renders the **styled** art live — the staged doodle runs through the same nested F3 providers + `SvgStyleTransform` under the current pen, so you name the object while looking at its finished ink (verified: rough-handdrawn shows doubled ink in the naming well, never raw 3px hairlines — works for drawn, plain-upload, and merged draw-over staging).

### Place → the record lands on the desk

Done-from-naming adds **one object per Done** to the desk, as a full record: rendered SVG + raw strokes + the pen's config snapshot + name + why + owner session. It's normalized to ~180px, scattered with a deterministic offset, and (planned) placed by smart placement (P-1, anti-cover) rather than blind scatter. The record is what the [pen-model page](11-the-pen-model.md) calls frozen-at-Done.

There's an honest **size-cap gate** at Place: the app measures the normalized SVG's byte length against the 64KB publish cap. Over-cap → an honest accent note (~NNKB), the popup *stays open*, and a real **"Shrink to fit"** pill appears (it decimates points on a *copy* — live strokes keep full fidelity). Important honesty detail: the copy says **shrink-to-fit, NOT "Simplify"** — the Simplify slider is render-time only and does NOT shrink the stored SVG, so calling it "Simplify" would be a false claim.

### Re-draw — reopening the strokes

Open an object you own → Edit → **Re-draw**. This reopens the draw canvas *with the object's strokes loaded and editable*. Draw more, erase, adjust; Done re-runs the pipeline and UPDATEs the same row (svg + strokes + config, via the schema-v5 RPC). The loop is closed: the same object, re-drawn, saved back to itself.

Legacy strokeless rows (published before stroke retention) hide the Re-draw button and show an honest note — they have no strokes to load, so re-draw would be a data-loss lie.

### Upload parity — uploads are first-class doodles

Uploads (SVG today; image is a stretch) get the **same** Sketch|Style pills and the same loop:

- **Style on uploads:** an uploaded SVG renders through the pen live, exactly like a drawn doodle.
- **Draw-over:** an upload letterboxes into the 800×600 frame as a *backdrop*, and you draw strokes on top. Done merges the two by **inverse-mapping your strokes into the upload's local coordinates, flat, with no transforms** — a naive `<g transform>` merge rendered tiny/broken through Smart Hachure (a real bug, caught by screenshot, fixed). Input switching never destroys strokes (the draw surface stays mounted; upload states are opaque covers over it).
- **Un-embeddable files** (no viewBox/size) get an honest "no draw-over" fallback instead of a silent failure.

One deliberate honesty gap: **merged (draw-over) objects record NO strokes.** Re-draw rebuilds the SVG from strokes *alone*, which would destroy the upload half. Until Re-draw is backdrop-aware, merged objects take the honest legacy note instead of a data-loss path. (Flip planned: record cap-strokes in the upload branch once Re-draw can carry the backdrop.)

### The tone-fill / shade brush — the missing shading input (round 7)

Drawn strokes are `fill="none"` polylines — they carry no fill, so the entire shading half of the engine has *nothing to read* on a drawing (the classifier literally returns `paper@0.9` on every drawn region). The fix landing in round 7 is a **second draw register: a tone-fill / shade brush** that paints discrete darkness *levels* (8 bands, the round-7 ask) onto regions of the canvas.

A tone patch is an **editable object** — `{ region geometry, band 0–7 }` — like a marker swatch on tracing paper laid over the drawing: placeable anywhere (including half-overlapping a shape), movable, re-tonable, deletable, and it stores as record data (`render_config.toneFills`), never baked into the SVG. The band feeds **source darkness** for *every* renderer (2D fillStyles and the 3D Hatch shader read the same 8-band table — one math, two renderers), which is exactly what lets a scribbled/brushed region convert across fillStyles the way a colored upload's fill already can. (Full tone math is on the [tone page](06-tone-and-shading.md); the drawn-input intent layer that *infers* tone from scribbles when the brush isn't used is on the [3D-system page](13-the-3d-system.md).)

---

## The design — why it's built this way

**Why Sketch|Style is an explicit pill, not automatic.** Sebs's rule "don't auto-add the object when I lift the pen" generalizes: styling is an *opt-in* act, not a side effect of drawing. The explicit pill makes the moment of transformation a decision you make, so the pen-up gesture stays sacred (raw ink stays raw). The clean-swap (not lens-overlay) was a direct Sebs call — the styled render should be the styled render, full stop.

**Why stroke retention is the keystone, not a nice-to-have.** Every other "edit after place" feature is impossible without it. Re-draw needs strokes. Smart-pick re-application needs strokes. The 3D mode flip "converts FROM THE RECORD, never from the rendered look" — and the record *is* the strokes. Throwing strokes away at Done was the single thing blocking the loop from closing, which is why it got elevated from stretch to a dated grid item after Sebs asked repeatedly.

**Why the naming card renders styled art (not raw).** You're minting a collectible — it should look finished while you name it. Rendering raw 3px hairlines in the naming well would make the object look unfinished at its most ceremonial moment. The staged-render scope (a local mirror of the object surface's render scope) exists precisely so the naming card shows the real ink.

**Why "Shrink to fit," never "Simplify."** The honesty rule (memory: no false claims). The Simplify slider is render-time only — it doesn't change the stored bytes. Labeling the size-fix pill "Simplify" would tell the user something untrue about what it does. Shrink-to-fit decimates the stored strokes; that's the honest name for the honest operation.

**Why uploads share the exact same loop.** Architectural payoff from the pipeline page: drawn and uploaded input converge into one styled-render path. Uploads aren't a second-class import — they're doodles with a different capture origin. The same Sketch|Style, the same naming, the same record. Draw-over is the bridge that lets you *annotate* an upload with your own hand, which is the wedge applied to imported art.

**Why merged objects honestly record no strokes (for now).** Re-draw rebuilds from strokes alone; a draw-over object is backdrop + strokes. Re-running stroke-only Re-draw on it would silently delete the backdrop. The honest interim is to disable Re-draw on merged objects with a note, rather than ship a data-loss path. (Memory: fix on the spot where cheap, queue honestly where not.)

**Why the tone brush is a register, not a fill tool.** Drawn strokes can't carry fills, so source darkness — invariant I-2, the central currency — has *no input channel* on the product's primary input mode. The tone brush is that channel. Making patches editable *objects* (not baked pixels) means stacked darkness is always *computed*, never flattened — delete a patch and the tone recomputes non-destructively (the same baked-vs-live discipline, one more time).

---

## Technical

All paths under `/Users/sebs/Desktop/Projects/desk-doodles/`. The creation loop landed across commits `f171da5` (round 4: naming, stroke retention, Re-draw, live-styled canvas), `4515345`/`37c73cc`/`023055f` (Sketch|Style + clean swap + full-ink in-flight), and the round-6 create batch in `37b9bcb`. The tone brush is round 7 (not yet built).

### Capture + Sketch|Style — `DrawPanel.tsx` / `DrawSurface.tsx`

- `StrokePoint = [x, y, pressure]` (`DrawSurface.tsx:13`); `strokesToObjectMarkup` emits `fill="none"` polylines (`:77`).
- Pressure is low-trust on mouse: `e.pressure || 0.5` (`:426-429`) reports a constant.
- `capStrokes` halves point density to fit the ~45KB row budget (`:85-101`).
- Sketch|Style pills: Sketch = pen-up never transforms; Style = strokes re-render through the pen pipeline live (the create canvas wiring connects to `DrawSurface`'s commit layer). Clean swap ratified (D-7 amendment 5).

### Naming stage — `DrawPanel.tsx`

- The minting card renders staged art through nested F3 providers + a local `StagedRenderScope` (a mirror of the object surface's `SurfaceRenderScope`, which isn't exported) + `SvgStyleTransform` under the live pen. Verified across drawn / plain-upload / merged-draw-over staging.
- Escape/scrim safety: naming→Back keeps strokes; compose+strokes → first Esc *arms* a visible footer confirm ("press Esc again…", 3s disarm), second closes; empty → close; scrim-click with strokes = arms (non-destructive).

### Size-cap honesty — `DrawPanel.tsx`

- Place measures `normalizeSvgSize(staged, 180).length` vs `65536` (the `publish_to_open_desk` / harden cap). Over-cap → honest accent note (~NNKB) + popup STAYS + real **"Shrink to fit"** pill (point decimation on a copy; live strokes keep full fidelity) + receipt. Copy says shrink-to-fit, NOT "Simplify."

### Stroke retention + Re-draw — `publish.ts`

- Strokes ride `render_config.strokes` (jsonb, no new column).
- v5 Re-draw RPC `updateDoodleArt` (`publish.ts:~425`) rewrites svg + strokes + config + `content_hash` atomically. v4 `updateDoodleConfig` (`:~397`) is the restyle-only path (Edit saves config without re-running strokes).
- `content_hash` = SHA-1(svg) (`publish.ts:~134`) — correct as *artwork* identity, insufficient as *conversion* identity (the addendum's cache-key amendment keys conversion caches on `SHA-1(svg ∥ strokesJson ∥ toneFillsJson ∥ extractorVersion)`).

### Upload parity — `DrawPanel.tsx` / `svgUpload.ts`

- Sketch|Style shared with uploads; Style renders the upload through the pen live.
- Draw-over: upload letterboxes into the 800×600 frame as backdrop; Done merges strokes via inverse-mapping into the upload's local coords, flat, no transforms (a `<g transform>` merge rendered broken through smartHachure — fixed).
- Un-embeddable files (no viewBox/size) → honest no-draw-over fallback. Input switching never destroys strokes (DrawSurface stays mounted; upload states are opaque covers).
- **Merged objects record no strokes (deliberate):** Re-draw rebuilds from strokes alone → would destroy the upload half. Honest legacy note until Re-draw is backdrop-aware.

### Tone-fill brush (round 7 — planned, not built)

- Record shape (spec): `render_config.toneFills: Array<{ id, points (brushed outline, viewBox coords), band: 0-7 }>` — store the **band index**, not raw alpha (the 8 discrete levels are the round-7 ask, JND-grounded by `coverage.ts` `COVERAGE_BANDS`).
- Re-draw invalidation (spec, addendum Ch. 2): re-extract regions → re-bind patches to new regions by overlap → re-convert caches. Floating patch with no host = self-region.
- Precedence ladder on uploads: `override (1.0) > tone-fill band > upload's own fill darkness > classifier-inferred darkness`.

---

## Connections

- **→ [11-the-pen-model.md](11-the-pen-model.md)** — the loop produces the *record* that page describes as frozen-at-Done; the pen styles the next doodle this loop creates; the popup is where Edit/Re-draw live. Edge: *creates and re-edits the records the pen/lens model operates on*.
- **→ [02-pipeline-of-a-doodle.md](02-pipeline-of-a-doodle.md)** — the per-doodle render path (capture → perfect-freehand → Done polyline swap → hand-feel → Smart Hachure) is what Style mode runs; the naming card calls the same `SvgStyleTransform`. Edge: *the loop wraps a UX flow around that page's render engine*.
- **→ [06-tone-and-shading.md](06-tone-and-shading.md)** — the tone-fill brush is the missing *input* to that page's currency: drawn strokes have no fills, so the brush is how source darkness (I-2) enters a drawing. Edge: *supplies the darkness channel for drawn input*.
- **→ [13-the-3d-system.md](13-the-3d-system.md)** — the mode flip "converts FROM THE RECORD" — i.e. from the strokes this loop retains; the drawn-register intent layer infers tone from scribbles when the brush isn't used. Edge: *retained strokes are the 3D conversion's only honest input*.
- **→ [14-the-social-desk.md](14-the-social-desk.md)** — Place is where a record joins the shared desk; drawer place = copy is the same record-creation move. Edge: *the loop's output lands on the social desk*.
- **→ [04-the-ml-layer.md](04-the-ml-layer.md)** — naming-as-label is one of the two dataset streams; every name is a training tuple. Edge: *the minting moment is a labeling moment*.
- **Doc edges:** `docs/design/object-model-and-desk-architecture.md` (record keystone, naming-as-training, object surface modes) · `docs/design/conversion-semantics-addendum.md` Ch. 2 (tone-fill lifecycle) · `docs/design/global-toggles-and-mixed-3d.md` D-7 amendment 5 (Sketch|Style clean swap) · `docs/memory/project_desk_doodles_shading_input_tone_fill.md`.

---

## Honest status

**Real in code today (2026-06-12 — verified against the round-4 → round-6 commits):**

- Sketch|Style pill pair with the clean swap; pen-up never transforms in Sketch; Style re-renders live (`4515345`, `37c73cc`, `023055f`).
- Stroke retention at Done — raw perfect-freehand strokes ride `render_config.strokes`; `capStrokes` decimation to the ~45KB budget (`f171da5`).
- The naming/minting stage — styled-art preview via `StagedRenderScope` + `SvgStyleTransform`; Escape/scrim one-layer safety; verified across drawn/plain-upload/merged staging (`37b9bcb` create batch).
- Re-draw — reopens an owned object's strokes, editable; Done UPDATEs the same row via the v5 RPC (`f171da5`). Legacy strokeless rows hide Re-draw with an honest note.
- Size-cap honesty — Place measures vs the 64KB cap; honest note + real "Shrink to fit" pill (copy decimation; live strokes full fidelity); copy is shrink-to-fit, never "Simplify."
- Upload parity — Sketch|Style on uploads; draw-over (inverse-mapped flat merge); un-embeddable fallback; input-switch never destroys strokes.

### Planned / stubbed (do NOT describe as working)

- **Tone-fill / shade brush** — round 7, spec'd in detail (`conversion-semantics-addendum.md` Ch. 2 + `mark-intent-boundary-spec.md`), **zero code.** Until it ships, drawn input has no explicit darkness channel (the inference fallback is also unbuilt).
- **Merged (draw-over) objects retaining strokes** — deliberately NOT recorded; Re-draw is disabled on them until it's backdrop-aware. The honest legacy note stands.
- **Upload image** — stretch S1, needs a tracer dep (imagetracerjs); the button is an honest stub.
- **Path-to-stroke conversion** for uploads (so an uploaded SVG can be Re-drawn) — sampler lives in `SvgStyleTransform`, needs imperative stroke injection; queued, not built.

The shipping smart system everywhere remains a **rule engine** — naming produces labels for a *future* trained layer; no model exists today.
