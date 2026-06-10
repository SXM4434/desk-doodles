# F3 Personal-Sketch Style — research item (Phase 4)

> Date opened: 2026-06-01
> Phase: deferred until SVG toggle architecture is solid (Phase 1-2)
> Owner: Hero #8 / F3 Desk family

User direction 2026-06-01:

> "would this possible i take pictures of different objects you tell me to
> sketch that i will either just trace over to sketch or sketch by hand and
> we mimic my sketching style ??? probably would have to use probably what we
> use for the hand drawn style plus more tech to train a style that matches
> me"

## Goal

The hand-drawn rendering should match **Sebs's personal sketching hand**,
not a generic rough.js calibration. Same identity-content idea as the rest of
the portfolio — the way the hero items are drawn should feel like the way
HE draws.

## Approaches to research (ranked by complexity)

### A. Quiver image-to-SVG on actual sketches (simplest, highest fidelity)

1. Sebs sketches a set of objects by hand (or traces from reference photos)
2. Photographs / scans the sketches
3. Runs each through Quiver's image-to-SVG → vector source
4. Inline the result as the SOURCE SVG for that shape in `PinShape` /
   `PegToolShape`
5. No style transform needed — the source IS the hand-drawn version

**Pro:** Highest fidelity match — it literally IS his hand. No calibration
needed.

**Con:** Per-shape sketching effort. He'd need to sketch every shape we
want to use this technique on. Curated subset (4-15 shapes) is manageable.

### B. Calibration tuning from sketch samples (mid-complexity)

1. Sebs sketches ~10 simple reference shapes (line, rectangle, circle,
   curve) multiple times each
2. Analyze: average stroke variance (jitter from "ideal" line), average
   bowing, average stroke count, endpoint behavior (does he overshoot?
   protrude? kink?), pen-tip register (consistent thin / thick / variable)
3. Derive a custom rough.js calibration that mimics those measurements
4. Apply to ALL shapes (not just sketched ones) — the same calibration
   stays consistent

**Pro:** Scales across all shapes without per-shape sketching effort.

**Con:** Won't match the exact character of a hand sketch — only the
statistical signature. Misses the subjective "this looks like me" feel.

### C. Style-transfer ML (high-complexity)

1. Train a small model on Sebs's sketches → learns his style as latent space
2. At runtime, transform clean SVG sources through the model to produce
   "in Sebs's style" versions
3. Could be neural style transfer OR a fine-tuned diffusion model
4. Tools: PyTorch + fine-tuned model OR ChatGPT image API with custom
   instructions

**Pro:** Highest visual fidelity beyond Approach A — could even handle
shapes Sebs hasn't drawn directly by extrapolating from his style.

**Con:** Significant ML infra. Quality unknown. Might not converge well
on sketch-style transfer (most models tuned for photo-realistic output).

## Combined approach (recommended once ready)

**Phase 4 plan:**
- **Step 1**: Approach A on the 4-shape calibration starter set (sketchbook,
  laptop, race medal, pokéball — the curated SVG calibration set we already
  have). Sebs sketches these, Quivers them, inlines. Validates the technique.
- **Step 2**: If A works for the starter set, expand to ~10-15 most
  identity-bearing shapes (or curated subset per `feedback-build-one-section-stop`).
- **Step 3**: Approach B as a fallback for shapes Sebs hasn't sketched —
  derived calibration applied to remaining shapes via rough.js so they
  feel sibling-coherent with the sketched ones.
- **Step 4**: Approach C ONLY if Approach A + B together don't produce a
  satisfying result. Almost certainly skipped.

## When to open Phase 4

After Phase 1 (F3-B SVG toggle architecture + 4-shape calibration) lands.
The 4-shape calibration set is the natural starting point for Phase 4 —
those shapes get re-done as actual sketches.

## Open questions for when Phase 4 opens

- How many objects total worth sketching? (4? 10? 15?)
- What reference style does Sebs draw in? (Loose? Architectural? Pencil?
  Pen? Marker?)
- How does Sebs want the texture to read? (Pen on paper? Charcoal? Marker?)
- Trace from reference photos OR freehand from imagination?
- Production process: scan vs photograph?

## Related

- [[project-hero-8-finish-desk-first]]
- [[project-hero-8-f3-toggle-architecture]]
- [[reference-vector-asset-tools]] — Quiver is the key tool for Approach A
