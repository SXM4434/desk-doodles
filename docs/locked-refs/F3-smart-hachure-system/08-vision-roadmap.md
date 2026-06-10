# 08 — Vision Roadmap (exploration space, not specs)

**Date:** 2026-06-03
**Status:** Living doc — captures direction without locking decisions
**Per Sebastian's framing (2026-06-03):** *"leave it open, figure it out when we get there"*

---

## What this doc IS and IS NOT

**IS:**
- A snapshot of all the open directions Sebastian has surfaced for the Smart Hachure System and adjacent features
- A reference for what architecture interfaces in doc 06 are designed to support
- A parking lot for ideas that aren't v1 scope but shouldn't be lost

**IS NOT:**
- A specification — nothing in this doc is "decided"
- A timeline — phases listed are LOGICAL ordering, not calendar commitments
- A scope creep enabler — anything here is EXPLICITLY deferred from v1

When work opens on any concept in this doc, run a fresh decision-discipline pass + write a real architecture proposal at that time. This doc just keeps directions alive so they don't drop.

---

## Concept A — Hero randomization

**The pattern:** Sebastian's catalog has multiple form variants per subject (running theme has race-medal · Strava badge · race bib · finishing photo · etc.). Each page LOAD picks one form per subject. Visitor A sees race-medal; Visitor B sees Strava badge. Each visit feels unique without any visitor input.

**Status:** open exploration

**Open questions:**
- Selection logic — pure random? Weighted? Time-of-day biased? Seeded by visitor session?
- Form-swap trigger — click? hover? auto-cycle on timer? scroll? Combination?
- Animation between forms — instant swap? crossfade? morph? 3D flip?
- Persistence — does the swap state survive page navigation? Or reset on every load?

**Architecture support already in doc 06:**
- `SubjectFormVariants` interface (no-op v1, ready to wire)
- `ObjectCollection` abstraction (not hardcoded to a fixed catalog)
- Existing F3 form-toggle code path (rename + extend rather than rebuild)

**Frontend-only.** No backend needed for hero randomization.

---

## Concept B — Visitor canvas

**The pattern:** A shared collective space in Sebastian's portfolio where visitors ADD objects (draw or upload). Canvas grows over time. Each visitor's contribution adds to the shared space.

**Status:** open exploration

**Sub-concepts:**
- **Drawing flow** — popup overlay (re-openable since toggles change between sessions). Not side panel.
- **Upload flow** — image or SVG upload, system converts/processes
- **Sync mode** — broadcast a treatment choice to ALL objects on the canvas at once
- **Edit mode** — area-wide toggles enabled, changes apply to everything
- **Per-object modal** — individual object toggles + 3D-convert action
- **SVG↔3D parity** — every object addressable in both representations, swap on demand

**Open questions:**
- Scale handling (multiple options on the table — Sebastian had numerous ideas, see next section)
- Auth vs session-only — do visitors need accounts, or is the canvas anonymous?
- Moderation — does Sebastian curate? Auto-filter? Time-limited objects?
- Privacy — visitor uploads = what storage / retention / opt-out?
- Backend stack pick — Node + Postgres · Supabase · Firebase · serverless · etc. (decision deferred)

**Architecture support already in doc 06:**
- `VisitorSession` interface (no-op v1, ready for per-visitor state)
- `BroadcastTreatment` interface (no-op v1, ready for sync mode)
- `ObjectCollection` abstraction (per-visitor catalog plugs in)
- `SvgToThreeDBridge` interface (full bidirectional swap support)

**Backend required.** Pick deferred until this concept opens.

---

## Scale-handling exploration space (Concept B)

When the visitor canvas grows large, multiple ideas on the table. Sebastian's framing: **multiple options exist; pick when we get there.**

| Approach | Pattern | Tradeoff |
|---|---|---|
| **Viewport / feed** | Single canvas, backend keeps full history, viewer sees only recent N slice, view rotates as new objects added (feed-like) | Simple to implement, but viewers never see older contributions |
| **Multi-canvas / worlds** | Discrete canvases — each fills up + becomes view-only. New visitors start a fresh canvas. Past canvases browsable as gallery. | Preserves history as time-capsules, but adds UX complexity (navigation between worlds) |
| **Spatial map** | Single huge canvas, viewer pans/zooms through it (like a real-world map). Backend serves visible slice. | Rich exploration, but big data + perf concerns |
| **Layered timeline** | Single canvas, all objects present but ordered/styled by recency (most recent = front; older = faded/back) | Preserves entire history visible, but visual density problem |
| **Curated gallery + live wing** | Sebastian-curated permanent + live-add wing that resets periodically | Mixed authorship; Sebastian retains editorial control |
| **Other ideas Sebastian has** | TBD | TBD |

**Meta direction:** leave open, figure out when scale becomes a real problem (not before).

---

## SVG ↔ 3D Parity (cross-cutting)

**The pattern:** every object addressable in both SVG and 3D representations. Switch between them.

**Two versions:**

### Lighter hero version (Concept A territory)
- No backend storage
- In-memory state swap
- Easter-egg angle — subtle, discoverable, not noisy
- Triggered by some interaction (hover? click? scroll-position?)
- Conflict-guarded: when 3D rotation mode active, the swap interaction disables

### Full visitor-canvas version (Concept B territory)
- Backend keeps both SVG and 3D versions per object
- Visitor can request 3D conversion per-object OR for entire canvas at once
- Lazy generation acceptable (visitor waits briefly first time, cached after)

**Open questions:**
- 3D generation pipeline — automated (Tripo / Meshy / Blender) or pre-rendered per-asset?
- Storage model — both SVG + GLB per object? Generate on demand and cache?
- Switching transition — instant cut? Animated? Crossfade?
- Quality tier — same model for hero vs canvas, or different fidelity?

**Architecture support in doc 06:**
- `SvgToThreeDBridge` interface (stub v1)
- `InteractionTier` interface (separates static / interactive / fully-rotatable)
- `RotationConflictGuard` (stub v1)

---

## SVG Progressive Interaction Tiers (cross-cutting)

**The pattern:** parallel to the 3D rotation tiers (static → hover-reactive → toggle-able → fully-rotatable), SVG objects should have a similar tier model.

**Possible tiers:**
1. **Static SVG** — just renders, no interaction
2. **Hover-reactive** — micro-animation on pointer-over
3. **Toggle-able** — click to switch states (e.g., swap to another form, expand annotations)
4. **Fully-interactive** — drag · drop · resize · rotate · annotate

**Open questions:**
- Which tier is default per object?
- Per-subject default vs global default?
- User-overridable per object?
- Tier selection UI — discoverable or hidden?

**Architecture support in doc 06:** `InteractionTier` interface (stub v1).

---

## Hero subject-tagged interactions

**The pattern:** Each subject (running, sketching, gaming, etc.) has its OWN interaction signature. Race-medal interaction ≠ sketchbook interaction.

**Open questions:**
- What's the signature per subject? Sebastian hasn't enumerated.
- Are these hand-coded per subject OR derived from subject metadata?
- Do interactions extend across the form variants in a subject (running's medal AND Strava badge share an interaction), or are they per form?

**Tied to Concept A** — form-swap mechanic IS one interaction signature. Others TBD.

**Architecture support in doc 06:** `SubjectFormVariants` interface includes interaction-signature field (no-op v1).

---

## ML training on Sebastian's sketches → separate mini-lab

**Status:** SEPARATE SCOPE per task #30. Do NOT bundle into Smart Hachure System architecture.

**Why separate:**
- Different training data source (Sebastian's actual sketches, not classifier overrides)
- Different deployment (probably build-time per asset, not browser inference)
- Different workflow (involves Sebastian feeding sketches as training data)
- Different evaluation (perceptual sketch match, not classification accuracy)
- Different timeline (later than the Smart Hachure System v1/v2/v3 progression)

**Why pre-supported by Smart Hachure architecture (doc 06 + 07):**
- Multi-axis treatment vocabulary IS the feature space the sketch-trained model would output
- Override store stores the right data shape
- Classifier provider chain accepts new providers (sketch-derived model slots in)
- TechniqueSelector has biasMode field a sketch-trained model could feed

**When to open:** after Smart Hachure v1 ships AND Sebastian has free cycles to feed sketches.

---

## Future spinoffs (parked)

### Personalized-portfolio standalone app

**Status:** PARKED to `user_parked_future_projects.md`.

Spinoff project where each user generates their OWN personalized portfolio version using the Smart Hachure System tech. Not Sebastian's portfolio scope.

**Why parked, not in this roadmap:** the visitor canvas (Concept B) adds objects to a SHARED collective space in Sebastian's portfolio. The standalone app would be each user gets their OWN portfolio version. Different scope, different product.

**Depends on:** Smart Hachure v1 ships + visitor canvas works + backend exists + sketch-training mini-lab probably useful.

---

## Cross-cutting open decisions (deferred)

| Decision | When to make it |
|---|---|
| Backend stack pick (Node+Postgres / Supabase / Firebase / serverless / etc.) | When visitor canvas implementation opens |
| Data model — per-visitor session vs shared catalog ownership | When visitor canvas implementation opens |
| Auth vs session-only | When visitor canvas implementation opens |
| **Visitor identity tracking** — none / device UUID (localStorage) / optional sign-in / session-only / hybrid (Sebastian 2026-06-03 deferral; recommendation = device UUID for first cut, can layer sign-in later) | When visitor canvas implementation opens |
| Privacy + retention model | When visitor canvas implementation opens |
| Storage budget + cost model | When backend opens |
| Scale-handling pattern pick (from the exploration table above) | When canvas reaches scale problem in production |
| Tier default per object/subject | When SVG progressive interaction tiers get implemented |
| LLM provider for cached pre-pass | When ML v2 opens (doc 07) |

None of these block v1. v1 has interface stubs ready for all of them.

---

## Cross-system integration (locked operating manual)

Per Sebastian 2026-06-03: Smart Hachure System will be interconnected with `docs/locked/cross-system-rules.md` (Cycle 10 close · 1,393 lines · governs how locked visual systems compose).

**Touch points with locked systems:**

| Locked system | How Smart Hachure interacts |
|---|---|
| **Color System (W1)** | Treatment selector pulls ink token via CSS var. Marks inherit theme. W1-D (dark) flips paper+ink → marks invert automatically via CSS inheritance, OR override store needs direction-aware entries (TBD when W1-D testing runs). |
| **Typography System** | Classifier labels `<text>` as `label-text` role → never hachured. CSML type registers (Eyebrow / Body / Subordinate aside / Pull quote) are NOT touched. |
| **Spacing System** | Bbox classification uses spacing semantics (frames larger, accents smaller). Not consuming tokens directly. |
| **Hero System #8** | Smart Hachure IS the rendering layer for hero items. Direct dependency. |
| **Case Study Module System (CSML)** | Hero items appear in §01 hero. When CSML renders under rough-handdrawn, Smart Hachure governs marks. |
| **Media-Prototype-Presentation** | When hero items become video / 3D, Smart Hachure transitions to / composes with media system. |
| **Navigation System** | Hero subject-tagged interactions integrate with nav patterns (hover reveal, click destinations). |

**Hard rule:** Smart Hachure NEVER invents tokens. Ink colors come from W1 CSS vars. Type registers untouched. Spacing untouched. Consumes, doesn't override.

**When Hero system #8 locks:** extend `cross-system-rules.md` §14 Extension Roadmap with:
- Smart Hachure System added as a new interacting system
- Path A/B/C outcome protocol applied to any divergences from locked systems surfaced during Hero #8 lock
- New CSML × Smart Hachure composition rules if needed
- W1-D direction adaptation documented

This is a SEPARATE workstream from Smart Hachure v1 implementation. Won't block code. Triggers when Hero system lock pass runs.

---

## Meta direction

> "leave it open, figure it out when we get there" — Sebastian, 2026-06-03

This doc captures direction WITHOUT committing to specs. Every "TBD" / "open question" / "exploration" tag is intentional. Architecture proposal in doc 06 has interface boundaries that don't lock any of these directions out.

When a concept here graduates from "exploration" to "let's build it" — that's the moment to:
1. Run a fresh decision-discipline pass (4-6 options per call)
2. Write a real architecture proposal at that time
3. Spawn research agents if needed
4. Update this roadmap doc with "decided" + cross-reference to the new proposal

Until then: keep options open, don't paint into corners.

---

## Cross-references

- Technical core (v1 architecture + interface stubs): `06-architecture-technical-core.md`
- ML pipeline (v1/v2/v3 phases): `07-architecture-ml-pipeline.md`
- Agent research that informs this doc: `01` through `05` in this folder
- Memory: `user_parked_future_projects.md` (personalized-portfolio app parked there)
- Memory: `user_goals_and_wedge.md` (the wedge that filters scope decisions)
- Task #22 — Smart Hachure rebuild
- Task #27 — v1 implementation
- Task #28 — Image upload quick-test (validates "works on ANY SVG")
- Task #29 — This vision roadmap (THIS DOC fulfills it)
- Task #30 — Sketch-training mini-lab (separate scope)
