# 00 · Index — the Desk Doodles knowledge base

This folder is Sebs's personal systems-knowledge base for Desk Doodles: every load-bearing idea in the app, explained from high level → technical → design → stack → systems thinking. Every page follows the same fixed structure: **In one sentence / Plain language / Design / Technical / Connections / Honest status** — so you always know where to find the squint-level summary versus the file-and-line detail. The Honest-status sections are the trust anchor: they say what exists today versus what is planned, with no inflation.

## Reading order

- **First time:** 01 → 02 → 06 → 03 → 05 (product → pipeline → tone → smart system → graph)
- **Going deep:** 04 (ML layer) · 07 (3D pipeline) · 08 (stack)
- **Philosophy:** 09
- **Reference, dip in anytime:** 10

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

## Living document rules

- Pages get **updated when the system changes** — they describe the app as it is, not as it was on writing day.
- **Honest-status sections move items from planned → real** as things ship; never the reverse silently.
- **New pages get registered here** — a row in the table and a slot in the reading order.
