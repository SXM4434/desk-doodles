# THE STORY — Desk Doodles (ConFigMakeathon)

**Date:** 2026-06-12 (Day 12 of 14). **Deadline:** 2026-06-18 11:59 PM PDT.
**What this is:** THE canonical story — the single source the social post, the demo video, and the README all draw from. Seven sections: the hook · the problem + who it's for · the wedge · what you can do · how it was built · why it matters · the arc. Tight, true, quotable.

> **Builds on, does not duplicate.** This is the *narrative* layer. The supporting docs own their own jobs and are cited inline, not re-derived here:
> - Rules / eligibility → `makeathon-rules-VERBATIM.md` (source of truth) + `makeathon-rules-and-framing.md`
> - Per-prize odds + where the marginal hour goes → `prize-positioning.md`
> - What's done / missing / at-risk → `submission-gap-audit.md`
> - Video shot list + script → `docs/design/demo-video-plan.md`
> - Official-requirements checklist + countdown → `docs/design/submission-checklist.md`
> - Product canon → `docs/knowledge/01-what-is-desk-doodles.md`; wedge research → `docs/research/21-research-3d-pipeline-and-style-translation.md` §8/§13 + `23-brief-suzanne3d.md`
>
> **Honesty laws (carried from the LAWS + memory).** Real verifiable facts only — no invented metrics or precedents. This is Sebastian's **solo** 14-day makeathon project. The app is **authored locally** (Vite + React + TS, public on GitHub for Build-in-Public) and **deployed + run live as a Figma Make site**, with **Figma Weave** for motion/video assets. We do **not** claim Make authored the code — the public git log shows the local CLI build, and Build-in-Public invites that cross-check (`makeathon-rules-VERBATIM.md` §⚖️ GUARDRAIL). Brand tagging: **#ConfigMakeathon + @figma**, tag the tools actually built with (Weave when shown); @figma on the kickoff/milestone/final posts only, not every update (`feedback_selective_brand_tagging`). Where a claim is a plan, not yet shot or shipped, it is marked — the telling never outruns the build.

---

## 1. The hook — one line that stops a scroll

> **You drew this. Now spin it.**

That is the cold open (six seconds, no intro, no voiceover): a scratchy hand-drawn doodle flips from 2D to 3D and orbits — *with the same wobbly line character in 3D.* It reads with the sound off, which is the point (≈85% of social video plays muted — `demo-video-plan.md` §1). It is the share-bait moment and the whole thesis in one gesture.

**The one-sentence identity (the breath before the paragraph):**

> Desk Doodles is a shared public desk where you draw the little things around you, restyle them with a real hand-drawn engine, flip them between 2D and 3D, and leave them next to everyone else's — on one bet no other tool makes: **your hand survives the round-trip.**

**Quotable spares (use one, never all):**
- *"Other tools want your drawing sanitized; Desk Doodles wants your hand."*
- *"Sketch in, sketch out, signature intact."*
- *"It's one desk for everybody."*

---

## 2. The problem + who it's for

**The one-paragraph pitch** (condensed from `submission-checklist.md` §3 + `01-what-is-desk-doodles` + README): Designers sketch at their desks constantly, and those sketches die in a notebook — there's no shared space that makes the habit social and visible. Desk Doodles is that space: draw or upload a doodle, and the app treats your hand's character — wobble, pressure, stroke grammar — as the *material*, not noise. It restyles your marks parametrically (hatching, stipple, charcoal, risograph, and more across ~13 live axes — an engine deciding per region per source, not a stamped filter), flips the same drawing between 2D and 3D with the mark family intact on both sides, and drops it onto a live public desk next to everyone else's.

**The problem, in two honest halves** (this is the *quality-of-idea* axis, judging category #2):
- **The real, in-scope problem (creative, not civic):** designers and doodlers sketch constantly; those sketches are private, static, and disposable. There is no low-friction shared surface where a quick doodle becomes a thing other people see and react to — and where the *character* of the drawing survives instead of being flattened into a clean asset.
- **The adjacent technical problem (the wedge's reason to exist):** every existing sketch-to-3D and sketch-restyle tool throws away the one thing that makes a drawing *yours* — your line quality. You get back a clean mesh or a clean filter; your hand is gone.

**Who it's for:**
- **Primary — designers and habitual doodlers.** People who already sketch at their desk and want the marks to *mean* something beyond a closed notebook. The product speaks their language (mark grammar, hatching, NPR) without requiring it.
- **Secondary — anyone who wants to leave a small mark on a communal surface.** The public, anonymous, no-account desk lowers the floor to *draw a heart, hit Done.* (Public-anonymous was a deliberate design reversal on 2026-06-05: a private desk for anonymous users would be `localStorage`-only — a blank desk every session, i.e. pointless. Public-anonymous is structurally simpler — one session ID, no auth UI — *and* it gives the Community / Build-in-Public story a living demo. `01-what-is-desk-doodles` §"Why public-anonymous".)
- **Tertiary — makeathon judges and fellow builders.** The Build-in-Public trail (68+ docs, public repo, the `/audit` catalog) is itself an artifact for the *builder* audience — "steal the process."

> **Honesty note (do not over-claim).** This is a *creative-habit* problem, not a serious social / accessibility / civic one. Per `prize-positioning.md` §6 we **do not target Building-with-Purpose** and **do not twist the narrative** to fake real-world impact. See §6 for the strongest *true* version of the purpose claim.

---

## 3. The wedge — "your hand's character is the material; it survives the 2D↔3D round-trip"

This is the defensible core (`21-research` §8/§13 locked synthesis; `01-what-is-desk-doodles` §"the wedge"). State it precisely, in two halves:

- **(a) In — your marks generate the form.** Drawn marks become the 3D geometry: locally via **our own** geometry engine — Rod / Extrude / Inflate / Solid — for simple paths, and (the "hard path") via cloud AI (Tripo / TRELLIS) for complex inputs. The local engine is Sebastian's own IP, ported from his Free Stroke project ([github.com/SXM4434/free-stroke](https://github.com/SXM4434/free-stroke)) — an in-bundle library, **not a black-box mesh API.** That ownership is *why* the hand can survive: we control how the form is built (`makeathon-rules-VERBATIM.md` §🧩; `13-the-3d-system`).
- **(b) Out — the form re-renders back in your marks.** The 3D object is re-drawn in marks of the *same family* — your sketch style becomes the render style of the 3D form. The **SVG-port bridge** is the mechanism: `EdgesGeometry → project to screen space → run through the SAME SvgStyleTransform pipeline → SVG overlay`, so the entire 2D Style dropdown and all its modifiers become available on the 3D form, on *every* geometry mode (built — Rock 1, item #30; Wireframe schematic register rebuilt for real — Rock Y).

**Sketch in, sketch out, signature intact. No shipping competitor does both halves.**

### The three fidelity poles (why our pole is empty, not just unclaimed)

From `21-research` §8 addendum + §13 and the Suzanne brief (`23-brief-suzanne3d.md`). Every player in 2026 optimizes exactly one fidelity target:

| Pole | Who lives there | What they optimize | What happens to your hand |
|---|---|---|---|
| **Fidelity-to-intent** | Suzanne (suzanne3d.studio, v1.0 May 2026) | "What did you *mean*?" → clean editable parametric CAD (OpenSCAD / STEP), print-ready | Stripped by design — it tells you "closed outlines and clear silhouettes reconstruct best," i.e. sanitize the linework |
| **Fidelity-to-mesh** | Tripo · Meshy · Rodin · TRELLIS | "What's an accurate generic 3D version?" → clean textured mesh | Stripped — stylization is texture-stage only, never carried from your strokes |
| **Fidelity-to-the-hand** | **UNOCCUPIED → Desk Doodles** | "How did you *draw* it?" → form from your marks, surface in your mark family | Preserved, both directions — it IS the product |

**Why the third pole is structurally empty:** parametric CAD has no slot for stroke wobble, and neural mesh reconstruction treats line character as scanning noise. Preserving the hand requires *owning the rendering layer* — controlling how the scene is drawn, not just what mesh it contains. The mesh is commodity; the marks are the moat.

**Verbatim contrast lines (research-locked, for video/social):**
- *"Suzanne answers 'what did you mean?' — Desk Doodles answers 'how did you draw it?'"*
- *"Other tools want your drawing sanitized; Desk Doodles wants your hand."*

### The proof — what is real today vs. in-flight (so claims stay on camera)

Cross-checked against `submission-gap-audit.md` + SESSION-HANDOFF round 7/7b/8 + git log. State only what's true:

- **2D restyle engine — REAL.** 11 SVG styles (clean / outline-only / rough-handdrawn / sketchy / bold-ink / wet-ink / stipple / charcoal / risograph / newsprint / wireframe), ~13 live axes, fillStyle override, per-region classify-and-replace. Golden-label v1/v2 diffing gates every engine change.
- **Live shared desk — REAL, verified.** A read-only check loaded **25/120 doodles on "The Graphite Orchard," ●LIVE** (`submission-gap-audit.md` line 9) — Supabase live + realtime + the social loop, not mocked.
- **2D→3D geometry — REAL.** Rod / Extrude / Inflate / Solid landed; Hatch + SVG-port 3D styles; conversion pipeline (Rock X/Y/1/2); ink-black material policy fixed (env tan-band cured). Smoke 48/48, mark-intent battery 11/11, material battery 72/72.
- **The technical guarantee behind the round-trip — REAL.** *One math, two renderers.* The Hatch 3D material reads the **same 8-band coverage table** (`bandTableForUniforms()` over `COVERAGE_BANDS`) that the 2D SVG renderer uses — so a band-5 region is equally dark in every grammar and every renderer. Render the 3D back to 2D and the band survives, because the shader quantizes with the same eight numbers (Praun TAM banding, *Real-Time Hatching*, SIGGRAPH 2001). Only hatching guarantees this viewpoint-independent invariance — relief and lighting are lossy (`shading-axes-architecture` §5; `conversion-semantics-spec` §5).
- **The one sanctioned geometry exception — REAL.** Pressure → inflate radius (`INFLATE_PRESSURE_INFLUENCE`, shipped): the only place pen character literally changes the *geometry*. Everything else (multi-stroke, pen tip, wobble) carries via Hatch uniforms or the SVG-port — a deliberate, honest boundary (multi-stroke-as-N-tubes was explicitly rejected).
- **The headline lockstep-slider capture — NOT YET SHOT.** The SVG-port path that makes "move one slider, 2D *and* 3D restyle together" is *built* (Rock 1, #30) — but the live capture is the single named gap for the video, and the Grand/Runner-Up case routes through that clip landing clean (`prize-positioning.md` §1).
- **3D-hard path (vision-LLM router → Tripo/TRELLIS) — PLANNED / gated, with a citable novelty.** `21-research` §8 found **no documented production case study** of a vision LLM used as a pre-step to route to a 3D generator (closest is research-stage: arXiv 2505.20129 / SpatialVLM). Gated on Sebs-side Tripo key + fal.ai credits; a **cached example must ship as fallback** so an API failure can't kill the moment.
- **No ML in the shipping system — stated plainly.** Smart Hachure is a *rule engine* today (`ruleEngineProvider`, `firedRules` provenance). The `/audit` 197-shape catalog is being built *as* the future training dataset — every catalogued breakage is one labeled data point. Say **"rule engine,"** never "AI that learned your style." The honest self-description: **"ahead on engines, behind on receipts."**

---

## 4. What you can do (the product)

### The creation loop — the closed product story
**Draw** (raw ink; pen-up never commits) → **flip to Style and tune** across ~13 live axes (the canvas IS the preview, restyling live) → **name your doodle** like minting a trading card — name + a "why" line — which doubles as the ML label → **place it** on the shared desk with a sit-shadow and a single soft-overshoot spring → **reopen any time** to restyle *or* re-draw the original strokes. The object is a rich record (render-config + metadata + source strokes), not a baked blob — every surface (card, sandbox, desk, gallery) is a *view* of the same record (`12-the-creation-loop`; `object-model-and-desk-architecture`).

### Restyle — an engine, not a filter
Eleven SVG styles, ~13 live axes (gap, weight, wobble, pen tip, layers, opacity…), a `fillStyle` override, and per-region classify-and-replace. The smart-pick chip doesn't just choose a style — it **names why** ("picked sketchy + hachure — dense small regions, dark fills"), and twisting two sliders makes the style follow. The user's Style and fillStyle dropdowns are **sacred** (invariant I-1): the system recommends and calibrates; the human always overrules (every override is logged as a correction).

### Shade / fill — make the audit-page look yourself
A second draw register: brush a region with discrete darkness bands (marker model — re-stroke the same band to darken +1, capped at 7), then flip the fillStyle so the brushed band re-renders as hachure / cross-hatch / dots at the *same* density. Fill regions are **derived from the ink, not gestured** — one pool-raster region brain is shared by 2D fill *and* 3D solids/holes ("ink without the ink outline"). Lasso is the open-space fallback; a C-shape never fills (anti-fixture law).

### 2D ↔ 3D — the round-trip
The same strokes become rods, extrusions, inflated forms, or fused solids — orbit them live, and the mark family carries across (see §3). Per-geometry Tier-2 toggles (Rod caps/joints, Extrude bevel/wall, Inflate profile, Solid edge/holes) plus the **3D Symmetry Law**: every 3D axis carries both *style* toggles (discrete grammar) and *property* dials (continuous sliders) — no axis ships half-equipped. The global 3D toggle is a **viewer-local lens**, so a pinned-3D rod can sit on an otherwise-2D desk — a shot no competitor's desk can make.

### The social desk — a place, not a tool
Publish and it lands on a **live public desk**; other people's doodles arrive in realtime with a ●Live badge; desks fill, hit a cap (120), and spawn the next one — a **wall of walls** at `/desks`, where mini-desks render their first ~6 real doodles under deterministic hero names like "The Graphite Orchard." The place has history. Pan/zoom, a drawer of everything you've made, drag-to-place — anonymous, no account.

---

## 5. How it was built — the workflow (criterion #4 + Build-in-Public)

The makeathon scores *how* you built as much as *what* (judging category #3 = emulatable process; category #4 = novel Figma-suite use). This is the honest, winning frame.

### The Figma-suite pipeline (criterion #4 footprint)
**Decided direction (Sebs, 2026-06-13): Make-forward, repo-safe.**
- **Figma Make = home base** — where Desk Doodles is designed-to-code and **published live** as the `*.figma.site` submission surface (satisfies the live-link + Make-usage requirements).
- **Figma MCP + Local loop** wires design into the build.
- **The Claude Code CLI** is the engineering + automated test-and-break partner.
- **Figma Weave** produces the motion / video / graphics (title-card motion, chapter dividers, the motion bed behind the workflow segment, end card, first-visit intro animation, OG image) — a fifth suite tool, and showing it on screen is itself scoring material.

That stacks the literal "**Make, MCP, Local, Weave, design agent**" the criterion names. The hybrid Local → MCP → Make pipeline is the **strongest fit for the $10k Innovative Workflow prize** — the rules reward exactly this combination (`makeathon-rules-VERBATIM.md` §⚖️ + §🎬; `makeathon-rules-and-framing.md` §5).

> **The honesty guardrail (load-bearing).** Frame Make as **deployment + live-test + published surface + Weave for media** — all verifiable (Make checkpoints, preview runs, the `.figma.site` URL, the Community share). **Never** claim Make *authored* the app: the public git log shows local CLI commits, and Build-in-Public invites exactly that cross-check, so a false "built in Make" line would ding us on the very Build-in-Public axis (`makeathon-rules-VERBATIM.md` §⚖️ GUARDRAIL). Author locally; deploy and run live through Make.

### Build → break → verify as one unit (the engineering character)
This is the distinctive workflow move, and the spine of the category-#3 story:
- **Golden-label discipline.** Baselines v1 (1,394 regions / 197 shapes) then v2 (Sebs-blessed) gate every engine change; golden-diff exits non-zero on any of the 1,394 flips. The worked example: a classifier recall fix showed exactly **140 flips across 67 shapes, all source-darkness 1.00**, before/after A/B confirming only true-black regions changed — *correction → measurement → bless* is a real loop, not a claim.
- **Per-rock automated batteries with READ screenshots.** Every work unit ships a node-runnable battery + a playwright driver whose screenshots are actually read: `strokeTo3d-smoke` 48/48, `mark-intent-battery` 11/11, `material-battery` 72/72 cells × orbit angles, `resilience-battery` 30/30, `wireframe-battery` 21/21.
- **The `/audit` page is the workflow hero.** A 197-shape catalog (93 Trophy-Wall + 104 Pegboard) that doubles as (a) the regression surface gating every change and (b) the smart-layer training dataset — "the audit page that debugged the engine IS its training set."
- **The decision-log flywheel.** `window.__dd_decisionLog` (unified across surfaces — shading / conversion / conversion-correction / shape-snap / shade-fill) records every engine decision with raw score + margin; chip dismissals log "overridden" events; naming labels train the classifier. *Log now, learn later* — the learned ladder is post-makeathon, but the dataset accrues from day one.
- **Diagnose-with-real-data-first.** A codified rule born from receipts: the Day-6 five-bug fix took 3 hrs of speculative patching, then 30 min after writing a playwright headless diagnostic. Standing law: build the inspection tool before patching a visual bug past attempt 2.

### Make-safe by design (a continuous constraint, not an afterthought)
Vite + React + TS · **cannon-es, not Rapier** (Rapier WASM races in Make's cold-load preview — verified Day 4) · pure-JS R3F + drei, no WASM / workers / absolute paths · perfect-freehand + rough.js (vendored dot-seed fix) under a custom parametric mark engine · DOMPurify sanitize-on-read · Supabase (anon sessions, realtime, RLS-gated security-definer RPCs) · env reads carry baked Make-safe fallbacks. A daily **Supabase keepalive GitHub Action** (cron + `workflow_dispatch`, committed `94a6a99`) fights the free-tier 7-day auto-pause through judging week (`08-the-stack`; `project_desk_doodles_no_rapier_in_make`).

### The verifiable Build-in-Public trail
~68 docs in `docs/`, a public GitHub with dense engineering-narrative commits (`50e3457` "3D system lands," `be7aac7` "kill env-reflection tan band," `1eaa853` "real Wireframe schematic register," `905f3ba` "band-mask rebuild"), golden-label baselines, the `audit-runs/` catalog, per-rock batteries with read screenshots. `prize-positioning.md` rates Build-in-Public as **HIGH odds / best-EV** — the raw material massively exceeds what most solo entrants will have; the cost to convert is *packaging, not building.* **But it only counts if pushed** (see §7).

---

## 6. Why it matters (the purpose narrative — our weakest axis, the strongest TRUE version)

> **Read this honestly.** Building-with-Purpose is the one prize we **concede** (`prize-positioning.md` §6). Desk Doodles is a creative / expressive product, not a serious civic / accessibility / health problem-solver. We spend **zero optimization hours** trying to win this category, and we do **not** twist the narrative to fake real-world impact — that would violate the no-fake-provenance LAW and read as inauthentic to judges who see the same move from many entrants. The text below is the strongest claim we can make that is *fully true*, offered as free upside if a judge reads it charitably — not a target.

**The true "why" (creative, soft, real):**

- **A creative habit deserves a place.** Designers and doodlers sketch constantly, and almost all of it dies in a closed notebook — private, static, never seen. Desk Doodles gives that habit a low-friction *shared* surface: draw a heart, hit Done, and it's sitting on a public desk next to a stranger's mug and someone else's boat. The point is small and human — *come leave something on the desk* — not a civic intervention.

- **It refuses to flatten the maker out of the made thing.** Every adjacent tool optimizes for a clean output and, in doing so, deletes the part of a drawing that is unmistakably *a person's* — the wobble, the pressure, the hesitation in a line. Treating that character as the material rather than as noise is a small stand for authorship: the tool should carry *how you drew it,* not just *what you drew.* That is the value underneath the wedge, and it is a real (if modest) design conviction, not a slogan.

- **The process is the gift.** The whole build is in public — 68+ docs, golden baselines, the audit-as-training-set, a cited research method — explicitly so other builders can take the pattern. "Steal the process" is the one line in the video aimed past the product at the community. That generosity is its own kind of purpose, and it's the one the Build-in-Public award actually rewards.

**The honest ceiling, in one sentence:** *Desk Doodles solves the small, real problem of a creative habit that has nowhere to live and a hand that everything else erases — not a problem of the world, but a true one.*

---

## 7. The arc — the rounds journey

How the build got here, and how the demo tells it.

### The build arc (the rounds journey, from the handoff ledger)
- **Days 1–4 — foundation.** Hero-8-Lab Smart Hachure engine; the Rapier-vs-cannon Make smoke test (verdict: cannon-es).
- **Day 5 — the fork.** 338 files rsync'd into a standalone repo + own public GitHub (`SXM4434/desk-doodles`).
- **Day 6 — chrome rebuild + the five-bug pipeline fix** via a playwright diagnostic (the diagnose-first lesson was born here).
- **Day 7 — `/canvas` v1 + the 197-shape `/audit` catalog.**
- **Days 8–9 — drawn-canvas overhaul + 681-pattern sweep + Make checkpoint #1 (34 files) + a 51-file doc mirror + a 7-agent research spree** producing the 822-line, 55-citation `21-research` synthesis that locked the wedge.
- **Day 10 — the social desk.** Supabase wired, the D-7 control model locked, pan/zoom, gallery, RPCs, keepalive.
- **Days 11–12 — the 3D system.** Round 7 (3D chrome split, conversion D2 v1, tone brush, Phase A recalibration), Round 7b (Rock X arrow-rule + unified decision log + real engine options + Tier-2 family pills; Rock Y real Wireframe register), Round 8 in flight (shading-fill-shape-assist, the 3D Symmetry Law, the env tan-band cure, heavy 197-shape break/gap testing).
- **A documented "caught it before it shipped" moment.** Adversarial review confirmed *live* that the upload classifier contributes zero useful bits for *drawn* strokes (23/23 drawn regions classify as "paper" — would render every doodle as nothing in 3D). The result was a ratified **two-register-brain architecture** (drawn = geometry/topology brain; upload = classifier brain) instead of shipping a broken one-brain design (`conversion-semantics-addendum`). Catching a wrong design before it shipped is part of the story, not a blemish.

### The narrative arc (how the demo tells it)
Three beats, structured backwards from the wedge climax (`demo-video-plan.md` §2). Each loads the next:

1. **The place and the hand (social desk).** Draw a small doodle live, hit Done, it lands; a second session's doodle arrives in realtime; zoom out to the wall-of-walls. *Establishes: this is a place, other people are here, drawing is the verb.*
2. **The system understands marks (smart engine, with receipts).** Upload → a smart-pick chip appears *with its reason*; twist two sliders, the style follows; cut to the `/audit` grid, golden-diff pass, `window.__dd_decisionLog` in DevTools. *Establishes: it decided, and it can say why — not a filter, an engine.*
3. **The marks survive dimension (the wedge climax).** Draw fresh strokes → flip 2D→3D → the form renders in the same mark family → orbit → **the slider shot**: move `hachureGap`, 2D and 3D restyle in lockstep; hold the orbit a beat longer than feels necessary. *Lands: your hand survives the round-trip. Nobody else does this.*

Then the **workflow segment** (judging category #3): Make published surface + local dev side-by-side, Weave-made motion assets, the `/audit`-page-as-debugger-and-training-set, one build-in-public post. VO: *"Steal the process."*

### The most film-worthy moments (ranked by stop-scrolling power; status per §3)
1. **The wedge flip + lockstep slider** (climax; the Grand/Runner-Up beat). *Gap: live lockstep capture not yet shot.*
2. **The cold-open "you drew this, now spin it"** (the muted-autoplay, Community-Favorite share-bait).
3. **A doodle arriving live on the shared desk** (●Live badge; "other people are here, right now").
4. **Zoom out to the wall of walls** (`/desks`; the place has history).
5. **The smart-pick chip showing its reason** ("it decided, and it can say why").
6. **The receipts cut** (197-shape audit grid · golden-diff terminal pass · the decision log in DevTools — "I tested it on 197 shapes until it stopped lying to me; every correction is training data").
7. **The minting moment** (draw → name like a trading card → drop with a sit-shadow — the one earned flourish, the flagship motion beat per `25-research-own-design-language` §2).

### Story holes — what we cannot honestly claim yet (cross-checked against `submission-gap-audit.md`)
So the telling never outruns the build:
- **The live lockstep-slider round-trip is not yet on camera.** Built, not captured.
- **3D-hard (vision-LLM router → Tripo/TRELLIS) is not live.** Citable novelty holds; the *live* beat needs a cached example to ship.
- **No ML model exists.** Rules + a dataset-in-the-making. Say "rule engine."
- **The public GitHub face is stale.** origin/main README still reads as Day-5 era; the refreshed README + all Day 11–12 work sit in **~31 unpushed commits** — Build-in-Public is scored only on what's *pushed*.
- **Submission deliverables are largely unstarted** — no demo footage, no final `*.figma.site` publish, no Figma Community working-file link, no qualifying social post yet (all 06-17/06-18 work, the biggest scoring lever).
- **Own design language not yet applied.** The warm-paper look on screen is the portfolio *scaffold*; identity (candidate "II Warm Riso Press") lands 06-16. Until then "craft" reads as scaffold, capping the quality axis.
- **Figma Agent usage is unconfirmed** (beta needed pre-June-3 preregistration). If access isn't real, drop Agent honestly — Make + Weave + MCP/Local still satisfies the suite requirement.
- **Live-demo durability through judging (06-18→23).** Supabase auto-pauses after 7 idle days; the keepalive Action is committed but must be *verified fired*, and the demo must point at the published surface, not localhost.

---

## 8. Reusable one-liners (tagging + workflow honesty)

- **Social one-liner (suite + honest provenance):** *"Made with Figma's suite — deployed and run live as a Figma Make site, with motion assets from Figma Weave. #ConfigMakeathon @figma"* (`makeathon-rules-VERBATIM.md` Option C).
- **Workflow framing (Innovative-Workflow):** Figma Make is home base (designed-to-code + published live) with a Figma MCP/Local loop and the Claude Code CLI as the engineering + automated test-and-break partner; motion/video with Weave. Four+ Figma-suite tools = the literal criterion-#4 footprint — and it survives the public repo because it's true.
- **Tag discipline:** #ConfigMakeathon on every relevant post; @figma on kickoff / milestone / final only; tag the tools actually used (Weave when shown). ~2–4 @-tags across the run, not every update (`feedback_selective_brand_tagging`).

---

## Sources

- **Internal product canon:** `docs/knowledge/01-what-is-desk-doodles.md` (wedge, three poles, honest status), `04-the-ml-layer.md`, `07-the-3d-pipeline.md`, `12-the-creation-loop.md`, `13-the-3d-system.md`, `15-the-smart-ml-ladder.md`, `16` (shading/fill/shape-assist), `25-research-own-design-language.md`.
- **Internal wedge research:** `docs/research/21-research-3d-pipeline-and-style-translation.md` §8 (vision-LLM router — no production precedent) + §8 addendum / §13 (three-pole map / the wedge); `docs/research/23-brief-suzanne3d.md` (intent pole).
- **Internal design specs:** `docs/design/shading-axes-architecture.md` §5, `conversion-semantics-spec.md` §5/§29, `conversion-semantics-addendum.md` (two-register-brain), `3d-mode-controls-spec.md`, `object-model-and-desk-architecture.md`, `smart-system-build-plan.md`, `smart-system-gaps.md`.
- **Internal submission docs (this doc extends, does not duplicate):** `makeathon-rules-VERBATIM.md`, `makeathon-rules-and-framing.md`, `prize-positioning.md`, `submission-gap-audit.md`; `docs/design/demo-video-plan.md`, `submission-checklist.md`.
- **As-built state:** `git log` (Day-12 commits; ~31 ahead of origin) + `SESSION-HANDOFF.md` (round 7/7b/8 battery-verified landings) + `README.md`; live `/desk` read-only observation (25/120 on "The Graphite Orchard," ●LIVE).
- **Workflow / honesty memory:** `project_desk_doodles_local_is_canonical`, `project_desk_doodles_own_design_language`, `feedback_selective_brand_tagging`, `feedback_research_first_no_fake_provenance`, `project_desk_doodles_no_rapier_in_make`.
