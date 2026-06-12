# 00 · Index — the Desk Doodles knowledge base

This folder is Sebs's personal systems-knowledge base for Desk Doodles: every load-bearing idea in the app, explained from high level → technical → design → stack → systems thinking. Every page follows the same fixed structure: **In one sentence / Plain language / Design / Technical / Connections / Honest status** — so you always know where to find the squint-level summary versus the file-and-line detail. The Honest-status sections are the trust anchor: they say what exists today versus what is planned, with no inflation.

## Reading order

- **First time:** 01 → 02 → 06 → 03 → 05 (product → pipeline → tone → smart system → graph)
- **The product surfaces (rounds 4–8 systems):** 11 → 12 → 14 → 13 (pen model → creation loop → social desk → 3D system)
- **Going deep:** 04 (ML layer) · 15 (smart/ML ladder) · 07 (3D pipeline) · 08 (stack)
- **Philosophy:** 09
- **Reference, dip in anytime:** 10

The 01–10 pages describe the engine (how a doodle becomes marks); the **11–15 pages describe the app the engine lives inside** — the pen/lens control model, the creation loop, the 3D system, the social desk, and the smart/ML build ladder. They are the systems that landed across rounds 4–8 (2026-06-11→12) and cite the `docs/design/` specs rather than duplicating them.

## Pages

| # | Page | One-liner |
|---|------|-----------|
| 01 | [What Desk Doodles is](01-what-is-desk-doodles.md) | The product: multi-mode draw/upload canvas (styled SVG ↔ 3D, public desk), the "your hand survives the round-trip" wedge, the three fidelity poles and why ours is empty, plus an honest exists-vs-planned ledger. |
| 02 | [The pipeline of a doodle](02-pipeline-of-a-doodle.md) | One doodle end-to-end: pointer events → perfect-freehand preview → Done polyline swap → hand-feel style pipeline (RDP, polygon-vs-curve, wobble, multi-stroke) → Smart Hachure classify-and-replace; uploads converge into the same path. |
| 03 | [The smart system](03-the-smart-system.md) | The rule-engine brain: signals → classify → treatment → render, a 16-rule voting engine (not ML) deciding per-region shading density while the user's fillStyle and Style dropdowns stay sacred. |
| 04 | [The ML layer](04-the-ml-layer.md) | What a real trained model would mean: the audit breakage catalog as labeled dataset, the provider-chain seat above the rule engine, and a brutally honest ledger (today: rules + data, no model exists). |
| 05 | [The interconnection graph](05-the-interconnection-graph.md) | How toggles, clusters, and signals form a bidirectional knowledge graph where every influence edge is declared and enforced — 5 locked clusters + planned Cluster 0, five traced edge walks, the new-toggle registration rule, the S11 acyclicity lock. |
| 06 | [Tone is the currency](06-tone-and-shading.md) | Every fill collapses to one darkness number (0=paper, 1=ink) per I-2; Murray-Davies/Beer-Lambert math spends it per grammar; planned tone patches with Option B stacking and seamless line-screening. |
| 07 | [The 3D pipeline](07-the-3d-pipeline.md) | Flat doodle to 3D and back: easy path (Rod/Extrude spline-sweep) or hard path (rasterize → vision LLM router → Tripo/TRELLIS → GLB), then screen-space hatching + the SVG-port bridge re-apply your hand — all Day 11+, toggle currently an honesty gate. |
| 08 | [The stack](08-the-stack.md) | Every package and its single job — Vite/React/rough.js/perfect-freehand/culori/Supabase wired today, three/R3F/cannon-es installed-but-waiting — filtered through "does it survive Figma Make?" |
| 09 | [How we think](09-systems-thinking.md) | The operating philosophy made concrete: one decision engine many features feed, 14 invariants as load-bearing walls, the kill-list as immune memory, cite-the-contract anti-drift, audit-as-ML-dataset, the north-star filter. |
| 10 | [The vocabulary](10-glossary.md) | Three translation tables (project canon · CS-rebuild engineering terms · 3D/graphics) mapping each load-bearing word to its plain meaning, Sebs's verbatim shorthand where sourced, and the real file/line where it lives. |
| 11 | [The pen model](11-the-pen-model.md) | "The panel is your pen, the popup is the object, Global is a lens" (D-7): objects are records frozen at Done; the panel styles the next doodle + a live preview squiggle (Global OFF); Global ON = a viewer-local lens re-rendering the whole desk without writing; the legacy freeze. |
| 12 | [The creation loop](12-the-creation-loop.md) | Draw → Sketch\|Style clean swap → name (the minting moment, naming=label) → place as a record that kept its strokes → Re-draw; stroke retention is the keystone; upload parity + draw-over; the round-7 tone-fill brush as drawn input's source-darkness channel. |
| 13 | [The 3D system](13-the-3d-system.md) | Geometry modes (Rod/Extrude/Inflate/Solid + AI) under the chrome-split rule (3D-only panel; 2D chrome only under SVG-port); ink-black material policy; the conversion-semantics brain (two register brains, the arrow/eyes/two-arc fixtures); AI-as-default coexisting with the local path. |
| 14 | [The social desk](14-the-social-desk.md) | The shared layer: capped multi-desk + auto-spawn + gallery mini-desks; the drawer as a passive cross-desk index (place=copy, click=full Edit surface); drag-to-place; friendly handles (no raw UUIDs); smart placement P-1 anti-cover landing. |
| 15 | [The smart/ML ladder](15-the-smart-ml-ladder.md) | The dated build sequence: what runs now (classifier, smart-pick, coverage, golden gates, reliability/ECE, P-1), what's scheduled when, the post-makeathon trained-model ladder — and the central honesty: "ahead on engines, behind on receipts" + the receipts retrofit. |

## Living document rules

- Pages get **updated when the system changes** — they describe the app as it is, not as it was on writing day.
- **Honest-status sections move items from planned → real** as things ship; never the reverse silently.
- **New pages get registered here** — a row in the table and a slot in the reading order.
