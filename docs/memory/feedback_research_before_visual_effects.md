---
name: Research online before implementing any visual effect you don't know how to do properly
description: For visual effects (hand-drawn, sketchy, glitch, displacement, gradients, animations, anything register-dependent), search for established techniques and named libraries first. Do NOT improvise with naive implementations like "feTurbulence on a line" — they read as fake/cheap.
type: feedback
originSessionId: 9b14c381-d2c0-43dc-aa4c-667a20f2a755
---
For ANY visual effect / register / aesthetic that has an established name (hand-drawn, sketchy, scribble, ink, watercolor, halftone, glitch, etc.), research how it's done properly before shipping. Look up named libraries (rough.js, paper.js, etc.), academic / blog techniques, and established SVG/Canvas patterns. Do NOT slap a generic primitive (e.g., feTurbulence + feDisplacementMap) on a line and call it the named register.

**Why:** User explicitly enforced this 2026-05-04 after I implemented "hand-drawn-feel" in B1 Venn using bare `feTurbulence + feDisplacementMap`. The result reads as "noise on a line," not as actual hand-drawn. The hand-drawn aesthetic has a real technical literature — `rough.js` (Preet Shihn) is the de-facto library for SVG hand-drawn rendering, used in Excalidraw and many editorial tools. It produces multi-stroke wobbly paths with controlled jitter, not turbulence-displaced curves. My naive implementation looked like a fake filter; it failed the "honest register" rule from `feedback_rule_breaking_standard`.

**How to apply:**

1. Before implementing any named visual register, search online for the established technique. Search terms: "[register name] [SVG / Canvas / CSS] technique," "[register name] library," "how does [reference site] do [effect]."
2. Identify named libraries / methods. Read their docs / examples to understand what makes the effect look authentic.
3. Decide: use the library directly (if license/scope permits), reimplement the technique honestly (multi-stroke jitter for hand-drawn, not noise filters), OR drop the option from the toggle if you can't do it well.
4. Document the technique in a code comment so future passes know the source / approach.
5. If unsure, ASK before shipping a half-baked implementation.

**Specific techniques to remember:**
- **Hand-drawn / sketchy**: rough.js (Preet Shihn) — multi-stroke wobbly path generation. The signature look is multiple slightly-different strokes laid over each other, plus jittered fill hatching. NOT a filter.
- **Watercolor**: layered transparent fills with edge-displacement, often via Canvas + custom shaders.
- **Halftone / dot screen**: Canvas dot pattern at varied radius/density driven by source brightness; or SVG <pattern> with circles.
- **Scribble / mark**: similar to hand-drawn — multiple offset strokes.
- **Glitch / displacement**: feDisplacementMap CAN work but with intentional wave/noise patterns, not random.

**Anti-pattern (do NOT do):**
- "Just slap an SVG filter on it" — produces fake-looking results.
- "Random turbulence" without a real underlying technique — reads as noise.
- Skipping research because the effect "feels close enough" — close-enough is not IC quality.
