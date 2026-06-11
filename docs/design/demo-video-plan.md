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
