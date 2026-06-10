---
name: project-free-stroke
description: "Free Stroke — creative tooling project. Draw a 2D stroke → convert to clean 3D form → export GLB. Lives at `~/Desktop/Projects/free-stroke` (Next.js). One of Sebastian's flagship-candidate projects for grad school evidence + portfolio depth. Cross-project."
metadata: 
  node_type: memory
  type: project
  originSessionId: 280032a1-475d-4acd-83ea-e9c6f3003e23
---

## What Free Stroke is

A **creative tool**: draw a 2D stroke, convert it into a clean 3D form, export as GLB, animate the draw-in.

Concept loop: 2D capture → stroke processing → 3D viewport → export.

## Why it matters (wedge fit)

This project sits inside his wedge per [[user-goals-and-wedge]]: **creative authoring tool** + **3D interaction** + real engineering depth + design-led identity. It's a strong candidate for the **flagship prototype** that grad-school applications require — see [[user-shadow-degree]] "What credible evidence looks like."

If he completes a real MVP with demo video + repo + writeup, Free Stroke can ALONE clear the flagship-artifact bar for Cornell MSDT / NYU IDM applications.

---

## MVP scope (locked)

The MVP includes:
- **2D draw** (capture user stroke input)
- **Stroke processing** (clean / smooth / parameterize the raw input)
- **3D viewport** (render the form)
- **Rod mode** (one stroke-to-form technique)
- **Extrude mode** (style variant — another stroke-to-form technique)
- **GLB export** (downloadable 3D asset)
- **Draw-in animation** (the stroke "draws itself" as the form appears)

That's the MVP. Don't sprawl past it.

---

## Stack (locked)

- **Next.js** — app shell
- **Vanilla Three.js** (NOT R3F — vanilla three.js is the choice here)
- **GLB export** — three.js GLTFExporter
- **2D capture/replay** — likely Canvas2D + custom stroke buffer
- **Stroke processing** — own pipeline

Repo location: `~/Desktop/Projects/free-stroke` (per [[reference-dev-projects-folder]]).

---

## Working rules (from his ChatGPT strategy doc)

When helping with Free Stroke:

- **Small, testable iterations** — visible wins, not big-bang refactors
- **Validate with visible wins** — each chunk produces something he can see in the viewport
- **Do NOT overbuild controls early** — chrome / settings panels are post-MVP
- **Research loop ONLY for feature building** — NOT for routine debugging. Bugfix = diagnose → fix → verify. Don't turn every bug into a research session.
- **Parking lot future ideas** — capture them in a doc but don't derail MVP
- **Stop when the MVP is the MVP** — do NOT slip post-MVP features into the MVP scope

The biggest failure mode here: trying to make Free Stroke "perfect" before shipping the MVP. He has to ship the MVP first, then iterate from real artifact.

---

## Future / post-MVP (parking lot — do NOT slip into MVP)

These belong AFTER the MVP demo + writeup ship:

- **Watertight solid volume** (better than current rod/extrude)
- **Better extrude technique** — polygon boolean/offset OR raster mask / marching squares / triangulation / SDF pipeline
- **Material presets** (shader/material library)
- **Dithering**
- **iOS-style edit control panel**
- **Full UI polish**
- **Video export** (post-MVP)
- **Stroke editing** (edit existing strokes — post-MVP)

When he proposes adding one of these "while we're at it," redirect to the parking lot. The MVP ships first.

---

## How I should help with Free Stroke

1. **Protect the MVP scope** — call out scope creep when it happens. Use the locked MVP list above as the line.
2. **Push toward visible wins** — when he gets stuck on architecture or perfectionism, ask "what's the smallest visible thing this chunk can produce?"
3. **Bugfix discipline** — when he proposes re-prompting or re-researching a bug, push toward debugger + diagnosis instead. This is one of the [[user-skills-and-rebuild]] failure modes (debugging by prompt-spam).
4. **Use it as an engineering rebuild anchor** — concepts from [[user-skills-and-rebuild]] rebuild zones (math, graphics, frontend arch) tie into Free Stroke naturally. Linear Algebra especially — vectors, matrices, transforms, stroke-to-form math.
5. **Treat it as flagship-candidate evidence** — when proposing next steps, check against the [[user-shadow-degree]] credible-evidence requirements (demo video, repo with architecture notes, case-study writeup, visible technical signal).

---

## Open questions to push on next time Free Stroke opens

- Has he picked a build lane definitively? (Web TS/React/Three.js — Free Stroke already is — vs Unity/C# — would mean a different flagship)
- Is the rod-mode math solid, or is it a placeholder?
- Has he started the demo video + writeup, or is it all code so far?
- What's the next visible-win chunk?

---

## Related

[[user-goals-and-wedge]] · [[user-shadow-degree]] · [[user-skills-and-rebuild]] · [[user-collab-preferences]] · [[reference-dev-projects-folder]] · [[reference-vocab-motion]]
