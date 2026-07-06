# Demo Video Plan — M13 (Rock I)

**Date:** 2026-06-11 (Day 10) · **Status:** PLAN — no footage shot yet. Shoot/edit block = **06-17** per RE-BASELINE §D; script iterates from 06-12; raw capture-as-you-go starts the moment a feature lands.
**Governing refs:** `makeathon-plan.md` §1.3 (submission reqs, confirmed 2026-06-04 from the [Contra guidelines](https://contra.com/community/topic/configmakeathon/guidelines)) + §1.5 (prize targeting) + RE-BASELINE/D′ · `docs/design/3d-roundtrip-build-plan.md` §6 (the slider moment IS the wedge shot) · `docs/design/smart-system-build-plan.md` §2 (06-17 data-story beat) · `docs/design/object-model-and-desk-architecture.md`.

---

## 0. What the rules require (and score)

From makeathon-plan §1.3 (extracted from the guidelines 2026-06-04 — the public Contra page is JS-gated, so **re-verify length caps on the guidelines page before the 06-17 shoot**):

- **Required:** (1) main video walking through *work + idea + workflow + design decisions*; (2) **30-second project walkthrough video** for the social post ("Loom is a great tool for this" per the guidelines); (3) social post on IG/X/LinkedIn tagged `#ConfigMakeathon` + `@figma`.
- **Scoring:** judging category 3 is literally *"Quality of video — workflow + design decisions + emulatable process."* The video is scored on showing PROCESS, not just product. A pure product-demo cut leaves points on the table.
- M13 spec: **≤5 min** main. That's a cap, not a target (§7 decision).

## 1. Research synthesis (what wins, cited)

- **Hook immediately.** "Explain what your app does in the first few seconds"; judges use the video to understand exactly how the app works — screencast with narration beats a "snazzy marketing video" ([Devpost video best practices](https://help.devpost.com/article/84-video-making-best-practices)).
- **Short beats long.** Most hackathons converge on under ~3 minutes; don't pack too much in or speed up audio to fit — script first, multiple takes, edit out the messy stuff ([Devpost: 6 tips for a winning demo video](https://info.devpost.com/blog/6-tips-for-making-a-hackathon-demo-video)).
- **The demo is the centerpiece** — highly visual, project in use, not slides ([Devpost 6 tips](https://info.devpost.com/blog/6-tips-for-making-a-hackathon-demo-video)).
- **Captions are load-bearing on social.** ~85% of social video plays muted ([Digiday, "85 percent of Facebook video is watched without sound"](https://digiday.com/media/silent-world-facebook-video/)) — the 30-sec cut must read with sound OFF.
- **Reference for "show the magic in second one":** tldraw's *Make Real* — wireframe → working UI in one click — went viral on the strength of a few seconds of screen capture, no production gloss ([Latent Space: The Accidental AI Canvas, with Steve Ruiz](https://www.latent.space/p/tldraw)). Our wedge flip is the same species of moment: lead with it.
- **Don't upload last-minute** — processing delays are a named failure mode ([Devpost best practices](https://help.devpost.com/article/84-video-making-best-practices)). Upload 06-17 night, not 06-18.

**Structure verdict:** cold-open the wedge (tease), 3 beats building BACK to the wedge as climax, then a short workflow/process segment (category-3 points), then close. Target **~3:10** (§7 decision).

## 2. The three beats (per D′), structured backwards from the wedge

The climax is fixed: **draw → desk → flip to 3D, same hand character** — the slider shot where `hachureGap`/`hachureAngle` restyle 2D and 3D *together* (3d-roundtrip-build-plan §6). Everything earlier exists to load that moment: Beat 1 (social desk) establishes *the place and the hand*, Beat 2 (smart system) establishes *the system understands marks*, so Beat 3 lands as "…and the marks survive dimension."

## 3. Shot list — main cut (~3:10)

| # | Time | Screen | Action | Viewer must feel |
|---|---|---|---|---|
| 1 | 0:00–0:08 | /canvas, pre-staged | COLD OPEN, no intro: a scratchy hand-drawn doodle flips 2D→3D and orbits — same wobbly line character in 3D. Caption: "You drew this. Now spin it." | "Wait — how?" (hook before context) |
| 2 | 0:08–0:20 | Title card (Weave/Agent asset) | Desk Doodles wordmark on warm paper grain. VO states the problem + one-line what-it-is. | Oriented; warmth, not SaaS |
| 3 | 0:20–0:38 | /desk, DrawPanel open | **Beat 1a:** draw a small doodle live (real strokes, real wobble), hit Done — it lands on the shared desk with sit-shadow. | Drawing is the verb; zero friction |
| 4 | 0:38–0:55 | /desk | **Beat 1b:** drag it into place; a SECOND session's doodle pops in live (●Live badge visible); pan/zoom the desk; hover an object card (name + why). | This is a *place*, other people are here |
| 5 | 0:55–1:05 | /desks gallery | **Beat 1c:** zoom out to wall-of-walls — mini-desks with real scattered doodles, deterministic names. | The place has history; "stop scrolling" shot |
| 6 | 1:05–1:25 | /desk or /canvas, upload | **Beat 2a:** upload an SVG → smart-pick chip appears WITH its receipt ("picked sketchy + hachure — dense small regions, dark fills"). Twist 2 sliders, style follows. | It decided, and it can say why |
| 7 | 1:25–1:45 | /audit + b-roll | **Beat 2b:** quick cuts — 197-shape audit grid, golden-diff terminal pass, `window.__dd_decisionLog` in DevTools, one audit-archive mosaic. VO: traced decisions, blessed baselines, corrections as training data. | Not a filter — an engine with receipts |
| 8 | 1:45–2:20 | /canvas | **CLIMAX (the wedge):** draw fresh strokes → flip the 2D/3D toggle → Rods/Extrudes appear hatched → orbit → THE SLIDER SHOT: move hachureGap, 2D and 3D restyle in lockstep. Hold the orbit a beat longer than feels necessary. | The hand survives the round-trip. Nobody else does this |
| 9 | 2:20–2:50 | Split/cuts | **Workflow (category 3):** Figma Make published surface + local dev side-by-side; Weave-made motion assets; Agent-made logo; one build-in-public post; one docs-tree shot. VO: emulatable process. | "I could learn from this person" |
| 10 | 2:50–3:10 | /desks → end card | Slow zoom out of the gallery; tagline; `*.figma.site` URL + logo end card (Agent/Weave asset). | Invited, not sold to |

**Backup plan baked in:** if 3D-hard (Tripo/TRELLIS) lands, shot 8 gains 5s of "photo → 3D on the desk" using the CACHED example (never live API on camera — R-register). If 3D slips entirely, shot 1+8 shoot against easy-path Rod/Extrude + hatch — still a complete story (RE-BASELINE video-timing note).

## 4. Script skeleton (Sebs's build-in-public voice — plain, warm, zero buzzwords)

| Shot | VO line (≈ caption text) |
|---|---|
| 1 | *(no VO — just the flip; caption only: "You drew this. Now spin it.")* |
| 2 | "I sketch at my desk constantly. Those drawings die in a notebook. So for the Config Makeathon I built Desk Doodles — a shared desk where everyone's doodles live together." |
| 3 | "You draw something small. Hit done. It lands on the desk." |
| 4 | "It's one desk for everybody. That doodle showing up right now? Someone else, drawing at the same time." |
| 5 | "When a desk fills up, it's archived on the wall and a fresh one opens. The wall keeps growing." |
| 6 | "Under the hood there's a rendering system that actually looks at what you made — it picked this style because the regions are small and dense. You can always overrule it." |
| 7 | "Every choice is traced. 1,394 region decisions, each with its reasons. When I correct one, that's training data. I tested it on 197 shapes until it stopped lying to me." |
| 8 | "Here's the part I care about most. Every tool that turns drawings into 3D throws your handwriting away. Watch — same wobble, same hatching, now it has a back. Move one slider and both worlds change together. **Your hand survives the round-trip.**" |
| 9 | "Built in Figma Make, with Weave making the video assets and the Figma agent on the logo. Everything's documented in public — the audit page that debugged the engine IS its training set. Steal the process." |
| 10 | "Desk Doodles. Come leave something on the desk." |

Voice rules: first person, past-tense honest ("until it stopped lying to me"), numbers as warmth not flex, no "revolutionary/seamless/powered by AI." Read aloud 3× before recording; cut any line that sounds like a launch tweet.

## 5. The fallback 60-second cut (if 06-17 collapses)

One take, one screen recording session, captions burned, VO optional:

| Time | Shot | Caption |
|---|---|---|
| 0:00–0:06 | The wedge flip (shot 1 as-is) | "You drew this. Now spin it." |
| 0:06–0:20 | Draw → Done → lands on the shared desk, second doodle arrives live | "Desk Doodles — one shared desk, everyone's sketches" |
| 0:20–0:32 | Smart-pick chip + 2 slider twists | "A rendering engine that looks at what you made — and shows its reasons" |
| 0:32–0:50 | Climax replay, longer: flip, orbit, THE slider shot | "Your hand survives the round-trip to 3D" |
| 0:50–1:00 | Gallery zoom-out → URL end card | "Built in Figma Make · #ConfigMakeathon" |

The **required 30-sec social cut** = this minus shots at 0:20–0:32, re-exported 9:16 with captions (must read muted per §1). Derive both from the SAME takes as the main cut — never schedule separate shoots.

## 6. Production checklist

- **Capture tool: [Screen Studio](https://screen.studio/)** (macOS) — auto-zoom on clicks, cursor smoothing, one-click 16:9↔9:16 re-export (kills the social-cut re-edit), auto captions. Free to record/edit; export needs a paid plan (~$29 one month) — §7 decision. Fallback: macOS built-in `⌘⇧5` capture + CapCut/iMovie (free, slower).
- **Settings:** record full-Retina (2x); export main at 1920×1080 minimum (4K if YouTube), 60fps capture so the 3D orbit + drag physics stay smooth.
- **Window hygiene:** clean browser profile, no bookmarks bar, hide dock, ~1600×1000 window, `localhost:5182` replaced by the **published `*.figma.site` URL on camera** (judges should see the real surface; §1.3 build-tooling rule).
- **Demo-data prep (06-16 night):** seed the open desk with 8–10 genuinely good doodles; second browser/device logged into the desk for the live-arrival shot; cached 3D-hard example staged; reliability/decision-log b-roll exported (smart-system-build-plan §2, 06-17 row).
- **B-roll inventory (already exists):** `audit-archive/dd-audit/` + `dd-canvas-sweep/` mosaics (engine receipts), golden-diff terminal runs, `docs/` tree, build-in-public posts. 2–4s cuts max each.
- **Weave/Make assets (plan §1.5 Innovative-Workflow positioning):** [Figma Weave](https://weave.figma.com/) (node-based AI image/video, [acquired Weavy](https://www.figma.com/blog/welcome-weavy-to-figma/), 1.5k credits granted) makes: title card motion, chapter dividers, motion bed behind shot 9, end card. Figma Agent: logo + intro visuals. **Showing these tools on screen in shot 9 is itself scoring material.**
- **Audio:** quiet room, mic 15–20cm (best available mic per [Devpost](https://info.devpost.com/blog/6-tips-for-making-a-hackathon-demo-video)); record VO AFTER picture-lock against the edit; burned-in captions on BOTH cuts (muted-viewing per [Digiday](https://digiday.com/media/silent-world-facebook-video/)).
- **Music:** §7 decision. Recommendation: one quiet lo-fi/felt-piano bed under shots 1–2 and 8–10 only, ducked −12dB under VO, silence under the demo middle (the UI sounds/VO carry it). No music is also fine; music under ALL of it is not.
- **Schedule:** raw clips captured as features land (06-12→06-16, each feature gets a 60s raw capture same day it ships — insurance against 06-17 being a scramble); script v1 06-12, tightened daily; shoot 06-17 AM; edit 06-17 PM; **upload to YouTube (public or unlisted — NOT private) 06-17 night**; verify playback logged-out; link + social cut into Contra submission 06-18.

## 7. Sebs decisions (flag — none block scripting, all block the shoot)

1. **VO vs captions-only (main cut):** recommend Sebs's real voice + burned captions — build-in-public authenticity is the brand, and category 3 rewards the human process. Captions-only main is the fallback if recording stalls.
2. **Length target:** recommend ~3:10 (cap is 5:00). Says no to padding toward the cap; the extra 2 min buys nothing per the under-3-min research norm.
3. **Music:** quiet bed on bookends only / none. Pick one.
4. **Screen Studio purchase** (~$29 one month) vs free `⌘⇧5`+CapCut pipeline.
5. **Face on camera?** Optional 5s corner-bubble intro in shot 2 (Loom-style). Skippable; warmth vs friction call.
6. **Beat order sanity-check:** social desk → smart system → wedge (as above) vs wedge-early-full. Plan recommends as-above: tease-then-payoff.
7. **Re-verify on the Contra guidelines page before 06-17:** exact main-video length cap, hosting requirements, and whether the 30-sec cut must be a separate upload or the social post itself.

---

# PART II — THE SHOT-BY-SHOT SCRIPT (added 2026-06-13)

> **This part EXTENDS Part I above — it does not replace it.** Part I owns the research, the structure verdict, the production checklist, and the open Sebs decisions. Part II is the *recordable* artifact: every shot's exact on-screen action, the VO beat under it (caption text where VO is absent), the running clock, and the criterion this beat scores against. It is written to be read while recording — print it, follow it top to bottom.
>
> **Canonical story alignment.** Every VO line traces to `docs/submission/the-story.md` (THE canonical story — hook §1, problem §2, wedge §3, product §4, workflow §5, why §6, arc §7) and the prize map in `docs/submission/prize-positioning.md` §8 (optimize the video around Runner-Up / Grand + Innovative-Workflow; Build-in-Public rides README/docs; don't bend for Building-with-Purpose).
>
> **Honesty laws (carried).** Solo 14-day project. **Authored locally, deployed + run live as a Figma Make site** — never "built in Make" (`makeathon-rules-VERBATIM.md` §⚖️ GUARDRAIL). **Rule engine, not ML** ("I tested it until it stopped lying to me," never "AI that learned your style"). **Custom geometry engine** (Free Stroke = Sebs's own in-bundle IP), not a "third-party API" (`makeathon-rules-VERBATIM.md` §🧩). Tagging: **#ConfigMakeathon + @figma**, tag tools shown (Weave), no over-tagging. Where a beat is not yet shot/shipped it is flagged in §11 (status) — the telling never outruns the build.

## 8. The two cuts, and the open length call

Three deliverables, all derived from **one** recording session (never schedule separate shoots — Part I §5):

| Deliverable | Length | Aspect | Sound | Required? | Source takes |
|---|---|---|---|---|---|
| **Main video** | **target ~3:10** (cap 5:00; §7.2 decision) | 16:9 | VO + burned captions | YES — scores criteria #1 + #3 | the master take set |
| **30-sec social cut** | **0:30** | 9:16 | reads MUTED (captions load-bearing) | YES — required to qualify (`makeathon-rules-VERBATIM.md` §submission) | subset of the same takes |
| 60-sec fallback | 1:00 | 16:9 | captions, VO optional | only if 06-17 collapses | same takes (Part I §5) |

**OPEN — length target (Sebs decision, flagged in `openQuestionsForSebs`).** Part I §7.2 recommends **~3:10**; the hackathon research norm is **under 3:00**. The shot-by-shot below is timed to **3:10** but every shot carries a *tight-cut second number* in brackets so it collapses to a **~2:35 lean cut** by taking the bracketed times — pick one before recording VO. The 3:10 version spends its extra ~35s on the workflow segment (the emulatable-steps beat, criterion #3) and on holding the wedge orbit; the 2:35 version keeps both but trims the b-roll and the gallery zoom.

**OPEN — VO vs screen-only (Sebs decision, flagged).** Part I §7.1 recommends **Sebs's real voice + burned captions** (build-in-public authenticity is the brand; criterion #3 rewards the human process). Screen-only-with-captions is the documented fallback. The script writes a full VO line per shot AND a caption per shot, so it records either way without a rewrite — the caption is the muted-safe compression of the VO. **Default assumption below: VO + captions.**

## 9. Main cut — full shot-by-shot (≈3:10 / lean ≈2:35)

Timing notation: `0:00–0:08 [0:00–0:06]` = 3:10-cut window, then `[lean-cut window]`. "Screen" = exact route/state. "Action" = what the cursor/UI does. "VO" = spoken; "Caption" = burned-in (muted-safe). "Scores" = the judging criterion this beat is built to hit.

---

### BEAT 0 — COLD OPEN (the hook · no context · share-bait)

**Shot 1 — The wedge tease** · `0:00–0:08 [0:00–0:06]`
- **Screen:** `/canvas`, pre-staged with one finished scratchy doodle (a mug or a little plant — something legibly hand-drawn).
- **Action:** NO intro card, NO logo first. The doodle sits a half-second → the 2D→3D toggle flips → it becomes a hatched 3D form and **orbits ~270°**, holding the same wobbly line character in 3D. End on a 3/4 angle.
- **VO:** *(none — let the motion carry it)*
- **Caption:** **"You drew this. Now spin it."**
- **Scores:** #2 (idea, in one gesture) + Community Favorite (muted-autoplay share-bait). This is the tldraw/Make-Real species of moment (Part I §1) — lead with the magic.

---

### BEAT 1 — THE PLACE AND THE HAND (social desk · establishes the world)

**Shot 2 — Title + the problem** · `0:08–0:20 [0:06–0:16]`
- **Screen:** Title card (Weave/Figma asset — wordmark on warm-paper grain), then hard-cut to `/desk`.
- **Action:** Wordmark holds ~2s, then the live desk fades up underneath it (already seeded with 8-10 good doodles — demo-data prep, Part I §6).
- **VO:** *"I sketch at my desk constantly — and those drawings die in a notebook. So for the Config Makeathon I built Desk Doodles: a shared desk where everyone's doodles live together."*
- **Caption:** **"Sketches die in a notebook. Desk Doodles is one shared desk for all of them."**
- **Scores:** #2 (the real, in-scope problem — `the-story.md` §2). Warm, first-person, no buzzwords.

**Shot 3 — Drawing is the verb** · `0:20–0:38 [0:16–0:30]`
- **Screen:** `/desk` with the DrawPanel popup open.
- **Action:** Draw a small doodle **live** (real strokes, real wobble — a heart or a little cup). Hit **Done**. It rides the ratified land-on-desk spring (soft overshoot, sit-shadow). Cursor nudges it into place.
- **VO:** *"You draw something small. Hit done. It lands on the desk — with a little shadow, like you set it down."*
- **Caption:** **"Draw → Done → it's on the desk."**
- **Scores:** #1 (craft — the minting/landing motion is the one earned flourish, `the-story.md` §7) + #2.

**Shot 4 — Other people are here** · `0:38–0:52 [0:30–0:40]`
- **Screen:** `/desk`, two browser contexts (the second is the seeded "other session").
- **Action:** A SECOND session's doodle **pops in live** with the **●Live badge** visible. Pan/zoom the desk a touch. Hover one object card so the name + "why" line shows.
- **VO:** *"It's one desk for everybody. That doodle that just showed up? Someone else, drawing at the same time."*
- **Caption:** **"●Live — someone else, drawing right now."**
- **Scores:** #2 (idea) + Community Favorite (the "other people are here" moment — `prize-positioning.md` §5).

**Shot 5 — The place has history** · `0:52–1:02 [0:40–0:48]`
- **Screen:** `/desks` gallery.
- **Action:** Zoom out to the **wall of walls** — mini-desks rendering their real first ~6 doodles under deterministic hero names ("The Graphite Orchard").
- **VO:** *"When a desk fills up, it gets archived on the wall and a fresh one opens. The wall keeps growing."*
- **Caption:** **"Desks fill, archive to the wall, and a new one opens."**
- **Scores:** #1 (build depth) + Community Favorite (stop-scrolling shot).

---

### BEAT 2 — THE SYSTEM UNDERSTANDS MARKS (the engine, with receipts)

**Shot 6 — It decided, and it can say why** · `1:02–1:22 [0:48–1:04]`
- **Screen:** `/canvas` (or `/desk` draw popup), upload an SVG.
- **Action:** Upload → the **smart-pick chip appears WITH its receipt** ("picked sketchy + hachure — dense small regions, dark fills"). Twist **two sliders** (gap, weight) — the style follows live. Then change the Style dropdown manually → the chip quietly **dismisses** (the override is honest; the human always overrules).
- **VO:** *"Under the hood there's a rendering engine that actually looks at what you made. It picked this style because the regions are small and dense — and it tells you why. You can always overrule it; the moment you do, the suggestion steps aside."*
- **Caption:** **"An engine that looks at your marks — and shows its reasons. You always overrule it."**
- **Scores:** #1 (build) + #4 (novel system — `signals → classify → treatment`, `the-story.md` §3/§4).

**Shot 7 — Not a filter, an engine (the receipts cut)** · `1:22–1:42 [1:04–1:18]`
- **Screen:** Quick cuts — `/audit` 197-shape grid · a golden-diff terminal pass scrolling · `window.__dd_decisionLog` expanded in DevTools · one `audit-archive/` mosaic.
- **Action:** 2-4s per cut, fast. The terminal shows the golden-diff exiting on flips; the DevTools log shows real decision entries with scores + margins.
- **VO:** *"Every choice is traced — about fourteen hundred region decisions, each with its reasons. When I correct one, that correction becomes training data. I tested it on a hundred and ninety-seven shapes until it stopped lying to me."*
- **Caption:** **"~1,394 traced decisions. 197 test shapes. Every correction = training data."**
- **Scores:** #1 (build rigor) + #3 (emulatable engineering process) + Build-in-Public. **Honesty:** "rule engine," "training data" = the dataset being built, NEVER "a model that learned your style" (`the-story.md` §3).

---

### BEAT 3 — THE MARKS SURVIVE DIMENSION (the wedge climax)

**Shot 8 — THE WEDGE + THE LOCKSTEP SLIDER** · `1:42–2:18 [1:18–1:48]`  ← **the climax; the single beat that wins Grand/Runner-Up**
- **Screen:** `/canvas`.
- **Action (the choreography, in order):**
  1. Draw **fresh** strokes (a few seconds of real hand).
  2. Flip the **2D→3D toggle** → the strokes become Rods / Extrudes, **rendered hatched in the same mark family**.
  3. **Orbit** the form slowly — hold it.
  4. **THE SLIDER SHOT:** grab `hachureGap` (or `hachureAngle`) and move it — **2D preview AND the 3D form restyle in lockstep**, the same eight coverage bands quantizing both. Hold the orbit *a beat longer than feels necessary.*
  5. (If staged) drop a pinned-3D rod onto an otherwise-2D desk for one second — the viewer-local-lens shot no competitor's desk can make.
- **VO:** *"Here's the part I care about most. Every tool that turns a drawing into 3D throws your handwriting away — you get back a clean mesh, and your hand is gone. Watch: same wobble, same hatching, now it has a back. Move one slider and both worlds change together. Your hand survives the round-trip."*
- **Caption:** **"Every other tool strips your hand. Move one slider — 2D and 3D change together. Your hand survives the round-trip."**
- **Scores:** #1 + #2 + #4 all at once. The technical truth under it: *one math, two renderers* — the 3D Hatch material reads the SAME 8-band coverage table as the 2D SVG renderer (`the-story.md` §3, Praun TAM). This is the load-bearing 36s; do not rush it.

---

### BEAT 4 — THE WORKFLOW (criterion #3 — emulatable process)

**Shot 9 — Steal the process** · `2:18–2:52 [1:48–2:14]`  ← **the Innovative-Workflow beat; see §10 for the full emulatable-steps breakdown**
- **Screen:** Split/sequence of REAL tool windows (not a claim, actual surfaces):
  1. Figma Make published `*.figma.site` surface **side-by-side** with the local Vite dev server.
  2. Figma **Weave** node graph that made the motion assets (title card / dividers / intro).
  3. The Claude Code CLI mid-build (a real terminal — commit messages, a battery run).
  4. The `/audit` page reframed: "the page that debugged the engine IS its training set."
  5. One build-in-public post + a glance at the `docs/` tree.
- **Action:** Each surface holds 3-5s; the VO names the loop so a viewer could repeat it.
- **VO:** *"Here's how it's built, so you can steal the process. Figma Make is home base — designed-to-code and published live. The Claude Code CLI is the engineering and test-and-break partner, with a Figma MCP and local loop wiring it together, and Weave making the motion. Everything's documented in public — even the audit page that debugged the engine is its own training set. The steps are all in the repo."*
- **Caption:** **"Figma Make (home base) + Claude Code CLI + Figma MCP/Local + Weave. All documented in public — steal the process."**
- **Scores:** #3 (emulatable process — the criterion that *explicitly rewards "steps others could take to emulate"*) + #4 (multi-tool Figma suite) + Build-in-Public. **Honesty:** Make = deployment/published surface, CLI = the engineering partner — never "built in Make." Drop **Agent** from this VO if access is unconfirmed (§11 open question).

---

### BEAT 5 — THE INVITATION (close)

**Shot 10 — End card** · `2:52–3:10 [2:14–2:35]`
- **Screen:** `/desks` slow zoom-out → end card (Weave/Figma asset).
- **Action:** Pull back across the wall of walls; the end card resolves with the wordmark, the live `*.figma.site` URL, and `#ConfigMakeathon @figma`.
- **VO:** *"Desk Doodles. Come leave something on the desk."*
- **Caption:** **"Desk Doodles · [live URL] · #ConfigMakeathon @figma"**
- **Scores:** Community Favorite (invited, not sold to) + the required tag discipline on screen.

---

**Running totals:** 3:10 cut = shots 1-10 as windowed. Lean 2:35 cut = the bracketed windows. Both keep all five beats; the lean cut trims hold-times on shots 5, 7, 10 and tightens VO breaths — it never drops a beat (Runner-Up rewards the *absence of holes*, `prize-positioning.md` §2).

## 10. The emulatable-steps spine (criterion #3, expanded)

Criterion #3 rewards "**steps others could take to emulate**" — not just *that* you have a workflow but a *repeatable recipe*. Shot 9 names the loop; this section is the script's backing detail so the VO (and the social-post caption + README) can pull a concrete, honest, repeatable sequence. **This is the bridge between the video and the Build-in-Public docs** — say the steps on camera, then "they're all in the repo."

**The repeatable loop, as a viewer could run it (each step verifiable in our public trail):**
1. **Author locally** in Vite + React + TS, public on GitHub from day one (Build-in-Public). *Why: the git log IS the process record.*
2. **Wire Figma into the build** via the Figma MCP + Local loop (design context into the coding tool).
3. **Use the Claude Code CLI as an engineering + automated test-and-break partner** — not just generate, but *break*: every feature ships a node-runnable battery + a playwright driver whose screenshots are actually read (`the-story.md` §5).
4. **Gate every engine change on golden labels** — baseline the output (1,394 regions / 197 shapes), bless it, and exit-non-zero on any unexpected flip. *Correction → measurement → bless* is the loop, demonstrable in the diff.
5. **Make the debug surface do double duty** — the `/audit` catalog is both the regression surface AND the training dataset; every catalogued breakage is a labeled data point.
6. **Diagnose with real data before patching** — build the inspection tool (playwright/headless diagnostic) before guessing past attempt 2 (the codified Day-6 lesson).
7. **Deploy + live-test through Figma Make** at recurring checkpoints; publish the `*.figma.site` as the live surface; share the working file to the Figma Community.
8. **Produce motion/video in Figma Weave** (node-based AI media) for the title card, dividers, intro animation, and end card.
9. **Write it all down as you go** (~68 docs) so the process is reusable, not folklore.

**On-camera, this compresses to the Shot-9 VO + one line:** *"The steps are all in the repo."* The depth lives in `docs/` (Build-in-Public award is scored on the README + docs tree, `prize-positioning.md` §4) — the video's job is to *point at* it credibly, not recite all nine.

## 11. KEY SCENES Claude screen-records near end-of-build (the capture shot list)

Per `makeathon-rules-VERBATIM.md` §🎬: **Claude records clean screen-recordings of the key scenes near end-of-build; Sebs takes them into Figma + Weave to assemble.** These are the raw clips the edit is cut from — capture each as a clean, isolated take (clean browser profile, dock hidden, ~1600×1000, 60fps, the **published `*.figma.site` URL on camera**, not localhost — Part I §6). Capture extra handles (a few seconds of lead-in/out) so the edit has room.

| # | Scene | Route / state | The exact moment to capture | Feeds shot(s) | Status (per `submission-gap-audit.md`) |
|---|---|---|---|---|---|
| K1 | **Draw → Sketch\|Style flip** | `/desk` draw popup or `/canvas` | Live strokes drawn raw, then the Sketch→Style flip restyling them through the pen pipeline live | 3, 6 | Engine REAL; capture pending |
| K2 | **2D↔3D wedge + lockstep slider** | `/canvas` | Draw → flip to 3D (hatched, same family) → orbit → move `hachureGap`, 2D+3D restyle together | **1, 8** | SVG-port path BUILT (Rock 1 #30); **live lockstep capture NOT yet shot — the single named video gap** |
| K3 | **Region-fill** | `/canvas` shade/fill register | Bucket-fill a region derived from the ink → flip fillStyle so the fill re-renders as hachure/dots at the same density | 6 (or its own micro-cut) | Fill/Lasso BUILT (Rock F2, battery pending); capture pending |
| K4 | **Shading (tone brush)** | `/canvas` shade register | Brush discrete darkness bands onto a region (marker model, re-stroke to darken), then watch the bands drive the render | 6, 8 (the band that survives to 3D) | Shade-brush BUILT (Rock F1/Rock 3); capture pending |
| K5 | **The live social desk** | `/desk` + 2nd session | A doodle arriving live with the ●Live badge; pan/zoom; hover-card name+why | 4 | REAL, verified (25/120 on "The Graphite Orchard," ●LIVE); seed before capture |
| K6 | **Wall of walls** | `/desks` | Zoom-out across mini-desks with real scattered doodles + deterministic names | 5, 10 | REAL; capture pending |
| K7 | **The receipts b-roll** | `/audit` + terminal + DevTools | 197-shape grid · golden-diff terminal exit · `__dd_decisionLog` expanded · one `audit-archive/` mosaic | 7 | All REAL artifacts on disk; capture/screen-grab pending |
| K8 | **The minting moment** | `/desk` draw → name | Draw → name like a trading card (name + why) → drop with the sit-shadow spring | 3 | REAL; capture pending (the flagship motion beat) |
| K9 | **The workflow surfaces** | Make site · local dev · Weave graph · CLI · docs tree | Real tool windows for the emulatable-steps beat (NOT a mockup) | 9 | Make publish + Weave assets pending; CLI/docs REAL now |

**Capture discipline:** every scene above must be a *clean* take against the **published Make URL** with seeded demo data — re-record rather than ship a messy take (Devpost "edit out the messy stuff," Part I §1). K2 is the priority capture — the whole Grand/Runner-Up case routes through it landing clean (`prize-positioning.md` §1). If 3D-hard (Tripo/TRELLIS) lands, K2 gains a 5s "photo → 3D on the desk" using the CACHED example (never a live API call on camera — Part I §3 backup plan).

## 12. Figma + Weave assembly + the first-visit intro animation — where they slot in

Per `makeathon-rules-VERBATIM.md` §🎬 + §🚀: the video is **assembled in Figma + Weave** (this is itself criterion-#4 footprint — showing Weave on screen in Shot 9 scores), and a **first-visit intro animation** ships on the live site as a stop-scrolling hook.

**Weave/Figma-produced assets in the edit (mapped to shots):**
| Asset | Made in | Slots into | Doubles as |
|---|---|---|---|
| Wordmark title card (warm-paper grain, motion) | Weave + Figma | Shot 2 | — |
| Chapter dividers (between beats, optional) | Weave | beat transitions | keeps the cut legible |
| Motion bed behind the workflow segment | Weave | Shot 9 | — |
| End card (wordmark + URL + tags) | Weave + Figma | Shot 10 | the social-cut end frame |
| **First-visit intro animation** | Weave/Figma | **the live site** (`/` first load) AND b-roll inside Shot 9 (showing it on screen = the asset is real) | Community-Favorite hook + a 5th-tool proof point |
| OG image (1200×630) | Figma (after the 06-16 identity pass) | not in the video; the social-share preview | +5 bonus surfaces |

**The first-visit intro animation, specifically:** it lives on the site, not just the video — it's the first thing a judge sees when they click the live link, so it's both a product surface and a capturable b-roll clip. Build it in Weave/Figma; capture a clean run of it for Shot 9 (proves Weave usage on camera) and/or as an alternate cold-open variant. It is the "stop-scrolling" Community-Favorite lever on the *product* side, mirroring the wedge flip on the *video* side. **Status:** PLANNED (Round 9 earmark per SESSION-HANDOFF) — flagged here so it isn't lost; if it slips, the video's cold-open wedge (Shot 1) carries the hook alone.

**Assembly order (06-17, after picture is roughly blocked):**
1. Block the edit from K1-K9 raw captures against the script windows (§9).
2. Drop in Weave/Figma assets (title, dividers, motion bed, end card).
3. Record VO against picture-lock (never before — Part I §6).
4. Burn captions on BOTH cuts (muted-safe — Part I §1).
5. Export 16:9 main + re-export 9:16 30-sec social cut from the same timeline (Screen Studio one-click, Part I §6).
6. Upload to YouTube (public/unlisted, NOT private) 06-17 night; verify logged-out playback.

## 13. The 30-second social cut — exact shot map

Derived from the SAME takes (never a separate shoot). Must read **MUTED** (captions load-bearing — ~85% muted plays, Part I §1), 9:16, ends on the URL + tags.

| Time | Shot (from §9) | Caption (muted-safe) |
|---|---|---|
| 0:00–0:06 | Shot 1 (the wedge flip) as-is | **"You drew this. Now spin it."** |
| 0:06–0:14 | Shot 3 condensed (draw → Done → lands) + Shot 4 (live arrival) | **"One shared desk. Everyone's doodles, live."** |
| 0:14–0:22 | Shot 6 (smart-pick chip + 2 slider twists) | **"An engine that reads your marks — and shows why."** |
| 0:22–0:28 | Shot 8 replay, the lockstep slider, held | **"Your hand survives the round-trip to 3D."** |
| 0:28–0:30 | Shot 10 end card | **"Desk Doodles · #ConfigMakeathon @figma"** |

This cut alone satisfies the required 30-sec walkthrough AND carries the qualifying social post (`makeathon-rules-VERBATIM.md` §submission). If the official rule turns out to require the 30-sec cut as the social-post video specifically (re-verify, §7.7), this IS that video.

## 14. Script status board (what's recordable now vs. gated)

Cross-checked against `submission-gap-audit.md` + `the-story.md` §7 story-holes, so the shoot never promises what the build can't show:

- **Recordable today (REAL + verified):** Shots 2-7, 10 — the social desk (K5, verified live), the wall of walls (K6), the smart-pick chip + sliders (K1), the receipts b-roll (K7), the minting moment (K8). The 2D engine, shade/fill, geometry modes, and the SVG-port are all built.
- **The one priority gap (K2 / Shot 8):** the **live lockstep-slider round-trip is built but NOT yet captured.** It is the climax and the Grand/Runner-Up linchpin — capture it first, clean, against the published URL.
- **Gated / fallback-covered:** 3D-hard (vision-LLM router → Tripo/TRELLIS) is PLANNED; if it lands, K2 gains a cached-example "photo → 3D" beat — **never a live API call on camera.** If it slips entirely, Shot 8 shoots against easy-path Rod/Extrude + hatch and the story is still complete (Part I §3).
- **Honesty flags that constrain VO wording:** say **"rule engine"** not "AI that learned your style" (Shot 7); say **"published + run live as a Figma Make site" / "Claude Code CLI as the engineering partner"** not "built in Make" (Shot 9); say **"our custom geometry engine"** not "a 3D API" for Free Stroke (Shot 8); **drop Agent** from Shot 9 if access is unconfirmed.
- **Pre-shoot blockers (not script work, but they gate the shoot):** the published `*.figma.site` URL must exist (final Make checkpoint), the desk must be seeded + Supabase-keepalive verified firing, and the 06-16 identity pass should land so the surface reads as finished craft, not scaffold (`submission-gap-audit.md`).
