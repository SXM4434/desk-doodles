# Smart Hachure System — research + architecture

## Status

**Active research + design phase** as of 2026-06-03.

The 5 research agents below were spun up in parallel after multiple failed attempts to fix over-shading via threshold-based math. User direction shifted from "tune the formula" to "build an intelligent classification + rendering system that conveys tonal information faithfully across any SVG."

## Files in this folder

- `00-overview.md` — this file
- `01-agent-research-artist-tonal-canon.md` — Agent 1 deliverable: how real artists translate tonal info into hatching marks
- `02-agent-research-libraries-build-vs-buy.md` — Agent 2 deliverable: existing JS/TS libraries for hand-drawn rendering
- `03-agent-research-svg-structural-signals.md` — Agent 3 deliverable: structural signals available for classifying SVG fill regions
- `04-agent-research-classifier-architectures.md` — Agent 4 deliverable: rule-based / tree / NN / LLM / hybrid classifier comparison
- `05-agent-research-perceptual-lightness-math.md` — Agent 5 deliverable: OKLab L target-tone matching math
- `06-architecture-technical-core.md` — (next) the actual rendering + classification system architecture
- `07-architecture-ml-pipeline.md` — (next) ML pipeline for inference (not training)
- `08-vision-roadmap.md` — (next) bigger-vision roadmap, exploration space, all open questions

## Why this folder exists

To preserve agent research findings across context compression. The conversation history that produced these findings will eventually compress; the docs persist regardless.

## Cross-references

- Memory: `feedback_vocab_training_protocol.md` (vocab system used during this build)
- Memory: `feedback_teaching_workflow.md` (teaching protocol activated for this build)
- Memory: `feedback_decision_discipline.md` (4-6 options pass for every non-trivial call)
- Memory: `user_parked_future_projects.md` (personalized-portfolio standalone-app parked here)
- Task #22 — PARKED → in_progress, Smart Hachure System rebuild
- Task #26 — Architecture proposal (next deliverable after these reports persist)
- Task #29 — Bigger-vision roadmap (includes Concept A/B exploration space)
- Task #30 — Sketch-training mini-lab (separate scope)

## Reading order

1. Start with `01-artist-tonal-canon.md` for the "what should this look like?" question
2. Then `02-libraries-build-vs-buy.md` for the "what do we actually code vs reuse?" question
3. Then `03-svg-structural-signals.md` for the "how does the classifier extract signals?" question
4. Then `04-classifier-architectures.md` for the "how does the classifier actually decide?" question
5. Then `05-perceptual-lightness-math.md` for the "how do we measure + hit target tones?" question
6. Then the architecture proposal docs once written

## Key convergent recommendations across all 5 agents

| Layer | Recommendation | Source |
|---|---|---|
| Color math target | OKLab L | Agent 5 |
| Tonal density model | Murray–Davies in linear-light + Yule-Nielsen exponent | Agent 5 |
| 5 mark axes | gap · layers · weight · pressure · opacity (combinable) | Agents 1, 2, 5 |
| 7-9 tonal roles | paper · sparse · mid · dense · solid · structural · accent · line-decoration · label-text | Agent 3 |
| Day-1 classifier | Rule-based + confidence threshold + override table | Agent 4, 3 |
| 3mo classifier | + Cached LLM build-time pre-pass for low-confidence regions | Agent 4 |
| 1yr classifier | + Decision tree (ml-cart) trained on accumulated overrides | Agent 4 |
| Libraries to ADD | `svgson` (~5KB) + `culori` (~3KB treeshaken) | Agent 2 |
| Libraries to KEEP | `rough.js` + `perfect-freehand` | Agent 2 |
| Libraries REJECTED | p5.brush (canvas-only) · react-rough-fiber · roughViz · rough-notation · Textures.js | Agent 2 |
| Learning persistence | Per-project JSON in repo (NOT global memory) | Agent 4 |

## Open questions / honest gaps

- No canonical 5-value tonal scale across artist traditions — bias must be picked (Agent 1)
- Yule-Nielsen `n` for screen anti-aliasing not published — empirical fit needed (Agent 5)
- Author intent NOT in SVG — classifier needs uncertainty policy (Agent 3)
- Cross-asset perceptual identity not guaranteed by any forward model (Agent 5)

## Out of scope for this folder

- ML training on Sebastian's sketches — separate mini-lab per task #30
- Personalized-portfolio standalone app — parked per `user_parked_future_projects.md`
- Backend stack pick — deferred until visitor canvas opens
