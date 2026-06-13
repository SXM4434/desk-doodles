# Figma Suite Usage Plan — the honest fit filter

**Date:** 2026-06-13 (Day 13 of 14). **Deadline:** 2026-06-18 11:59 PM PDT.
**Purpose:** Sebs's directive — figure out where each Figma-suite tool is *genuinely* useful for Desk Doodles, not "use it to use it." Forced/checkbox usage is obvious to judges and counts against us on the very axis we're targeting (Innovative-Workflow, criterion #4). This doc is the honest filter: per-tool real-vs-forced rating, what we actually commit to, and what we deliberately don't force.

> **Scope + laws.** Positioning/strategy doc — no `src/` edits, no live-DB writes, no fabricated tool usage. New doc, no collision. Every external claim traces to a cited source (mostly internal docs + the binding guidelines). Honesty law (carried from `the-story.md` + memory `feedback_research_first_no_fake_provenance`): we name a tool only for work it *actually does*; the public git log shows local Claude Code authoring, and Build-in-Public invites that cross-check, so a forced/false tool claim dings us on the Build-in-Public axis itself.
>
> **Builds on, does not duplicate:**
> - Eligibility + Make-framing sentences → `makeathon-rules-and-framing.md` §5 (Options A/B/C — not re-derived here)
> - Per-prize odds → `prize-positioning.md` §3 (Innovative Workflow)
> - The narrative this serves → `the-story.md` §5 (the Figma-suite pipeline)
> - Make runtime constraints → `docs/locked-refs/F3-smart-hachure-system/20-research-figma-make-capabilities.md`
> - Open decisions → `DECISIONS-FOR-SEBS.md` §C

---

## 0. The one-paragraph thesis (read this first)

**The innovation is the wedge — "your hand survives the 2D↔3D round-trip" — plus the smart rendering engine (`signals → classify → treatment`). The Figma suite is the *delivery and storytelling layer* around that, not the headline.** The genuinely novel, judge-legible workflow is a **Local → MCP → Make pipeline** (author locally with the Figma MCP wired into the AI coding tool, deploy + run live as a Make site) with **Weave** telling the story in motion. That stacked pipeline is the literal territory criterion #4 names ("across Make, MCP, Local, Weave, design agent") and the strongest fit for the $10k Innovative Workflow prize (`prize-positioning.md` §3). Lead with the wedge; let the tools earn their place by doing real jobs. Anything a tool can't honestly do, we cut — and we say *why* we cut it, which is itself a craft signal.

---

## 1. The honest fit table (the core deliverable)

Five tools, rated **genuine-core / genuine-supporting / thin-forced**, with the strongest honest job each does and whether the usage is *innovative* (advances the workflow story) or merely *present* (satisfies the requirement but adds nothing novel).

| Tool | Strongest honest job for Desk Doodles | Rating | Innovative or merely present? |
|---|---|---|---|
| **Figma Make** | The published, live-running submission surface (`*.figma.site`) — satisfies both required links (live + working-file) and the "made using Figma's suite" gate. Run live across the build via checkpoints to prove the full stack deploys + behaves there. | **genuine-core** (as deployment/runtime), *not* as authoring IDE | **Present, leaning innovative** — Make-as-runtime for a hand-authored R3F+Supabase app is a legit, slightly-against-the-grain use; the innovation lives in the *pipeline around* Make, not Make alone |
| **Figma MCP / Local** | The design-to-build bridge: Figma MCP server wired into the Claude Code CLI so design context (tokens, the 06-16 "II Warm Riso Press" identity, component specs) flows into the local build; Local-codebase loop is the two-way author/deploy seam. | **genuine-core** | **Innovative** — this IS the Local→MCP→Make pipeline criterion #4 explicitly rewards; it's the spine of the Innovative-Workflow case |
| **Figma Weave** | Real media production: the submission video's motion bed + title/chapter/end cards, the first-visit intro animation (the "stop-scrolling" hook), the OG image / social card. Genuine AI-media work we have to do anyway. | **genuine-supporting** | **Present, genuinely useful** — Weave does real labor (we need motion assets regardless); showing it on screen is scoring material, but it's a media tool serving the story, not the workflow novelty itself |
| **Figma Agent** (beta, confirmed) | In-canvas design assists on the artifacts we're *already* making in Figma: the Community working file's layout/diagram, intro-graphic composition, video design frames, an explainer board. | **genuine-supporting** (capped — see §3) | **Present** — honest if pointed at real graphics work; it does NOT touch the code app, so it must stay a supporting graphics player, never a headline |
| **FigJam / diagram (via MCP `generate_diagram`)** | One genuinely useful artifact: the **pipeline diagram** (`signals → classify → treatment → render`, and the 2D↔3D round-trip / three-fidelity-poles map) as a clean FigJam board for the Community file + a video chapter card. | **genuine-supporting** (optional, cheap) | **Present, high-leverage-for-cost** — turns our strongest conceptual asset into a shareable Figma artifact; cheap, and it doubles as the Community-file body |

### Reading the table

- **Two genuine-core tools** (Make-as-runtime, MCP/Local-as-bridge) carry the eligibility *and* the Innovative-Workflow case. They are true, verifiable, and load-bearing.
- **Two genuine-supporting tools** (Weave, Agent) do real media/graphics labor we'd do anyway — honest to name, but they serve the story, not the novelty.
- **One cheap-but-real supporting artifact** (FigJam diagram) converts our best conceptual asset into a Figma-native shareable. It also happens to be the most natural body for the *required* Community working-file link (a code app has no native Figma file otherwise).
- **Nothing rated thin-forced is committed.** See §4 for what we deliberately don't force.

---

## 2. Per-tool detail — the honest case

### 2.1 Figma Make — genuine-core (runtime, not authoring)

**The real job.** Make is the **published, live-running submission surface** (`*.figma.site`) and satisfies both required links — live project link *and* working-project-file link — plus the "made using Figma's suite of products" gate (`makeathon-rules-and-framing.md` §1, §4). Throughout the build we ran the app live in Make's preview at checkpoints (checkpoint #1 = commit `e6c7889`, 34 files, 2026-06-10; the Day-4 Rapier-vs-cannon verdict was *decided* by running both in Make's preview across reloads — `20-research` §9). That's genuine, verifiable usage.

**Why not "authoring IDE."** The honest ground truth (CLAUDE.md, `project_desk_doodles_local_is_canonical`): development is local Vite+React+TS, public on GitHub. Make is deployment + live-test. We never claim Make authored the code — the public git log shows local CLI commits and Build-in-Public invites that cross-check (`makeathon-rules-VERBATIM.md` §⚖️ GUARDRAIL). Framing sentences that are strictly true: `makeathon-rules-and-framing.md` §5 Options A/B/C.

**Innovative or present?** Present, leaning innovative. Make-as-runtime for a hand-authored R3F + Supabase + cannon-es app (deliberately *not* a Make-AI-generated app) is a slightly-against-the-grain use — the novelty is the *pipeline*, not Make in isolation. The one genuine workflow insight to show on camera: **we hardened the app to be Make-safe by design** (cannon-es not Rapier because Rapier's WASM races in Make's cold-load preview — verified Day 4; pure-JS R3F, no WASM/workers/absolute paths, env reads with baked Make-safe fallbacks, a Supabase keepalive Action). "Built to survive Make's runtime" is a real, emulatable lesson — that's the criterion-#3 (process) value of the Make story.

**Risk to manage.** Make checkpoint #2 must contain ALL of Round 7/7b/8 (the 3D system + the wedge) before publish — the last checkpoint was ~Day 9 / 34 files (`makeathon-rules-VERBATIM.md` §🚀). Submitting the stale Make file would make "made in Make" point at a version without the wedge. This is Sebs-side (he runs Make uploads); Claude preps the clean file list + importability re-check + upload prompt.

### 2.2 Figma MCP / Local — genuine-core (the bridge, the spine of the workflow case)

**The real job.** The official Figma MCP server (present in this environment — code↔design, FigJam, Code Connect, design-context, variable-defs, screenshots) wired into the Claude Code CLI is the **design-to-build bridge**: it pulls Figma design context (tokens, the 06-16 own-identity "II Warm Riso Press" palette/type, component specs, the intro-graphic frames) into the local build, and `get_variable_defs` / `get_design_context` make the design system *legible to the coding agent*. Local-codebase mode (Mac-only beta, true two-way sync — `20-research` §8) is the author↔deploy seam that lets Make and the local repo round-trip.

**Why genuine-core.** This is the single tool whose presence makes our *real* workflow a *Figma-suite* workflow rather than "a local app we exported." Criterion #4 explicitly rewards usage "across Make, MCP, Local" — and the hybrid **Local → MCP → Make** pipeline is precisely that. The eligibility verdict itself leans on MCP/Local being genuine suite usage (`makeathon-rules-VERBATIM.md` §⚖️; `prize-positioning.md` §3).

**Innovative or present?** Innovative — but only if we *show* the bridge doing real work, not just assert it. The strongest concrete, honest demonstration before 06-18: pull the **06-16 identity tokens from Figma via MCP into the build** (the identity pass has to happen anyway — `project_desk_doodles_own_design_language` — so routing it through MCP `get_variable_defs` is real work, not theater). That single act turns "we have MCP access" into "MCP carried the design system into the code," which is the emulatable-process gold criterion #3 wants. **This is the one genuine-MCP commitment to lock (see §6).**

**Honesty boundary.** If the identity-via-MCP pull doesn't land in time, MCP/Local is still genuinely used (the server was wired into the build loop) — but we'd describe it as "design context bridge," not over-claim a token pipeline we didn't run. Don't invent MCP usage that didn't happen.

### 2.3 Figma Weave — genuine-supporting (real media labor)

**The real job.** Weave produces media we *must* make regardless: the submission video's motion bed + title/chapter/end cards, the first-visit intro animation (the muted-autoplay "stop-scrolling" hook — Community-Favorite lever), the OG image (`public/og-image.png` 1200×630), the social card (`makeathon-rules-VERBATIM.md` §🎬). This is honest, useful work — not a checkbox.

**Innovative or present?** Present, genuinely useful. Weave is an AI-media tool doing media labor; it's a 5th suite tool on the footprint and showing it on screen scores, but it doesn't advance the *workflow* novelty (that's the wedge + the pipeline). Treat it as the storyteller, not the story. It also helps the +5 Figma Community share and the +5 social bonus.

**Boundary.** Weave makes the *assets*; the demo footage of the actual product (the wedge flip, lockstep slider, live desk) is screen-recorded from the running app, not Weave-generated. Don't let a "Weave made the demo" implication creep in — Weave made the *motion design around* the demo. Capture/assembly plan: `makeathon-rules-VERBATIM.md` §🎬 + `demo-video-plan.md`.

### 2.4 Figma Agent — genuine-supporting, CAPPED (the honest weakest fit — say so)

**Access is confirmed** (Sebs has the beta, 2026-06-13 — `DECISIONS-FOR-SEBS.md` §C). That removes the "is it even available" risk. The honest *fit* question remains, and the directive asks for a straight answer:

**The straight answer: Agent is the weakest-fitting suite tool for THIS project, and it should stay a supporting graphics player — never a headline.** Reasoning: Figma Agent is an *in-canvas design agent*. Desk Doodles is a *code app* (R3F + Supabase, authored locally). An in-canvas design agent has no honest seam into the running product — it doesn't write the geometry engine, it doesn't classify regions, it doesn't render hatching. Pointing Agent at the code app would be exactly the forced/checkbox usage the directive warns against, and a judge cross-checking the public repo would see Agent had no hand in what shipped.

**Where Agent IS honest.** On the Figma-native artifacts we're *already* making: the Community working file's layout, the intro-graphic / explainer-board composition, video design frames, the pipeline-diagram board. These are real graphics jobs; Agent assisting them is true. The honesty requirement (`DECISIONS-FOR-SEBS.md` §C) is explicit: Agent must do *actual work on real artifacts* so "built across Make+MCP+Local+Weave+Agent" is TRUE, not "we have access."

**Recommendation.** Keep Agent in the suite footprint (it genuinely widens the criterion-#4 stack to five named tools, and access is real), but **commit it only to a specific graphics artifact** (recommend: the Community file's identity/diagram board) and **never frame it as touching the engine or the wedge.** If even that graphics use doesn't materialize before 06-18, drop Agent from the narrative honestly — Make + MCP/Local + Weave already satisfies the multi-tool requirement (`makeathon-rules-and-framing.md` §6). Do not list a tool we didn't use.

### 2.5 FigJam / diagram — genuine-supporting, cheap, high-leverage

**The real job.** The MCP `generate_diagram` / FigJam path turns our single strongest conceptual asset — the `signals → classify → treatment → render` pipeline and the 2D↔3D round-trip / three-fidelity-poles map (`01-what-is-desk-doodles`, `03-the-smart-system`) — into a clean Figma-native board. That board can be (a) a video chapter card and (b) **the natural body of the required Community working-file link** — which a code app otherwise lacks a Figma artifact for.

**Why this matters.** The Community / working-file link is a flagged GAP (`makeathon-rules-VERBATIM.md` §QUALIFY: "we've been code-only"). A FigJam board of the architecture + the wedge is the cheapest honest way to have a *real Figma file* worth sharing — and it doubles as the +5 Community-share bonus surface. It's supporting, but it's the rare supporting move that closes a required gap. Recommend greenlight as a cheap commit.

---

## 3. The recommended narrative — "lead with the wedge, tools in service"

The framing for the README, video workflow segment, and social post (extends `the-story.md` §5; do not duplicate the framing sentences in `makeathon-rules-and-framing.md` §5):

1. **The headline is the product idea, not the toolchain.** "Your hand survives the 2D↔3D round-trip" + the smart engine that decides per-region per-source. That's what wins Grand/Runner-Up and quality-of-idea (`prize-positioning.md` §1–2).
2. **The workflow is a *pipeline*, and the pipeline is the criterion-#4 story.** Author locally with the **Figma MCP** bridging design into the build (the identity tokens flow through MCP) → **Local-codebase** loop → **Make** as the live published runtime, **hardened to be Make-safe by design** → **Weave** produces the motion/video → **Agent** assists the Figma-native graphics. Five suite tools, each with a real job. The novelty is the *shape of the pipeline*, not any single tool.
3. **Honesty is the asset, not the liability.** We say plainly: authored locally, deployed + run live through Make, design bridged via MCP, media via Weave. That survives the public repo (it's true) and *is* the strongest Innovative-Workflow posture — exactly the territory the prize rewards.
4. **The cut tools are part of the craft story.** "We didn't force Agent onto the code app because an in-canvas design agent has no honest seam there" is a *restraint* signal that reads as taste, not as a gap. Judges who see forced usage everywhere will register the discipline.

**One-line workflow framing (for the video VO / README):** *"Designed in Figma and bridged into the build with MCP, authored locally, deployed and run live as a Figma Make site hardened to survive Make's runtime, with motion and video from Weave — the wedge is the idea; the Figma suite is how it ships."*

---

## 4. What we deliberately DON'T force (the restraint list)

Naming these explicitly is the point of the exercise — and saying *why* in the video is a craft signal.

- **Don't claim Make authored the app.** Repo cross-check kills it; dings the Build-in-Public axis (`makeathon-rules-VERBATIM.md` §⚖️). Make = deployment/runtime/published surface only.
- **Don't point Agent at the code app.** No honest seam (an in-canvas design agent can't write the geometry engine / classifier / renderer). Agent stays on Figma-native graphics or gets dropped honestly.
- **Don't imply Weave generated the product demo.** Weave makes the motion *around* the demo; the product footage is screen-recorded from the running app.
- **Don't over-claim an MCP token pipeline that didn't run.** If the identity-via-MCP pull doesn't land, describe MCP as the design-context bridge it genuinely was — don't manufacture a pipeline.
- **Don't build a parametric Figma plugin / round-trip-into-Figma feature for the makeathon** (the stretch — see §5). It's a time-trap this close to the deadline.
- **Don't manufacture a Code Connect story.** The Figma MCP exposes Code Connect (mapping Figma components to code components), but Desk Doodles is a canvas/engine app, not a component-library product — there's no honest component-to-Figma-component map worth building. Forcing it would be checkbox usage. Skip it.

---

## 5. The stretch — could a doodle round-trip INTO Figma via MCP? (pressure-tested)

**The idea (and why it's seductive).** A doodle round-tripping *into Figma* — a creative tool that speaks Figma's protocol — rhymes beautifully with the round-trip thesis ("the hand survives the round-trip"; now it survives all the way into Figma's own canvas). The MCP server in this environment genuinely supports code→design writes (`use_figma`, `create_new_file`, `upload_assets`), so it's *technically* on the table: render a styled doodle's SVG → push it into a Figma file via MCP as real vector layers.

**Feasibility before 06-18.** Technically plausible at a shallow level (push the styled SVG markup as a frame into a new Figma file via MCP), but with real friction: SVG-import fidelity into Figma is imperfect (our hand-feel marks are many small jittered paths + filters — `wet-ink halo`, `newsprint dot screens`, grain — that may flatten or import as rasterized/odd vector soup, *losing the very hand character that is the whole point*). Making it land *cleanly* (the marks surviving the import recognizably) is the hard 80%, and it's unvalidated. The hatching is rough.js scanline geometry over SVG paths — it *might* import as clean vectors, but proving that takes a spike we haven't run.

**Worth it or time-trap?** **Time-trap — cut it (or demote to a tiny post-makeathon experiment).** Reasoning:
- **It competes for the scarcest hours.** Day 13–14 is owned by the things that actually win: the live lockstep-slider wedge capture (the Grand/Runner-Up linchpin, *not yet shot* — `the-story.md` §7), Make checkpoint #2, the video, the Community file, the qualifying social post. A speculative Figma-import spike risks all of those for a flourish.
- **The fidelity risk inverts the thesis.** If the marks flatten on import, the demo would *show the hand NOT surviving* — actively undercutting the wedge. A half-working round-trip-into-Figma is worse than none.
- **The novelty is already banked without it.** The Local→MCP→Make pipeline + the in-app 2D↔3D round-trip already own the Innovative-Workflow and idea axes. The Figma-import round-trip adds marginal novelty for outsized risk.
- **There's a cheap honest substitute.** If we want a "speaks Figma's protocol" beat, the **FigJam pipeline diagram + pushing the identity tokens through MCP into the build** (§2.2, §2.5) already demonstrate code↔Figma traffic via MCP — real, low-risk, and on the critical path anyway.

**Verdict: do NOT greenlight the doodle-into-Figma round-trip before 06-18.** Park it as a one-line "post-makeathon: doodles that speak Figma's protocol" aspiration in the standalone roadmap (rhymes with the existing post-makeathon items in `01-what-is-desk-doodles` §"Standalone life"). If Sebs has a spare hour and wants the share-bait, the *cheapest* version is a single hand-pushed SVG frame as a one-off social clip — explicitly labeled an experiment, never load-bearing for the submission.

---

## 6. What we ACTUALLY commit to (concrete artifacts)

The honest commitments — each is a real artifact doing a real job, nothing forced:

| Tool | Committed artifact | Status / owner |
|---|---|---|
| **Make** | Checkpoint #2 (full Round 7/7b/8 code) → published `*.figma.site` = live link + working-file link | Sebs-side upload; Claude preps file list + prompt |
| **MCP / Local** | Pull the 06-16 "II Warm Riso Press" identity tokens from Figma via MCP `get_variable_defs` into the build (real design-to-build bridge act) | Lands with the 06-16 identity pass |
| **Weave** | Submission-video motion bed + title/chapter/end cards · first-visit intro animation · OG image + social card | Sebs creative direction (06-16→18) |
| **Agent** | One Figma-native graphics artifact (rec: the Community file's identity/diagram board) — graphics only, never the engine | Confirmed access; commit to one real use or drop honestly |
| **FigJam / diagram** | The pipeline + round-trip + three-poles board → the Community working-file body + a video chapter card | Cheap; closes the Community-link gap |

**Suite footprint:** five named tools (Make, MCP, Local, Weave, Agent) + FigJam — each with a *true* job. That fully populates criterion #4's named list without a single forced use.

---

## 7. Sources

- **Binding rules + framing:** `makeathon-rules-VERBATIM.md` (source of truth — criterion #4, §⚖️ guardrail, §🎬 video/graphics plan, §🚀 publish/repo plan, §QUALIFY); `makeathon-rules-and-framing.md` §1/§4/§5 (eligibility verdict + Options A/B/C framing sentences — not re-derived here); both trace to the live guidelines https://contra.com/community/topic/configmakeathon/guidelines ("Must be made using Figma's suite of products (Figma Make, MCP, agent, etc.)").
- **Prize odds this serves:** `prize-positioning.md` §3 (Innovative Workflow — multi-tool + the pipeline).
- **Narrative this extends:** `the-story.md` §5 (the Figma-suite pipeline), §7 (story holes — Agent access, the unshot wedge capture).
- **Make runtime constraints (the real basis for Make-as-runtime + Make-safe-by-design):** `docs/locked-refs/F3-smart-hachure-system/20-research-figma-make-capabilities.md` (§5 publish path, §8 Make↔GitHub one-way + Local two-way beta, §9 Rapier verdict).
- **Product canon (the wedge + the engine the tools serve):** `docs/knowledge/01-what-is-desk-doodles.md` (the wedge, three poles, standalone-life roadmap), `03-the-smart-system.md` (signals→classify→treatment).
- **Open decisions + Agent honesty requirement:** `DECISIONS-FOR-SEBS.md` §C (Agent confirmed; must do real work).
- **As-built / runtime facts:** CLAUDE.md (local-canonical, cannon-es), `SESSION-HANDOFF.md` (Round 7/7b/8 landed; ~28–31 commits unpushed; Make checkpoint #2 pending).
- **Environment fact:** the official `claude.ai Figma` MCP server is present and exposes code→design (`use_figma`, `create_new_file`, `upload_assets`), design→code (`get_design_context`, `get_variable_defs`, `get_screenshot`), FigJam (`generate_diagram`, `get_figjam`), and Code Connect — the basis for §2.2, §2.5, and the §5 feasibility read.
- **Honesty memory:** `feedback_research_first_no_fake_provenance`, `project_desk_doodles_local_is_canonical`, `project_desk_doodles_own_design_language`, `feedback_selective_brand_tagging`.
