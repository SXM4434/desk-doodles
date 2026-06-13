# Prize Positioning — best chance to win EACH prize

**Date:** 2026-06-12 (Day 12 of 14). **Deadline:** 2026-06-18 11:59 PM PDT.
**Status:** strategist pass — honest per-prize odds, the single demo beat that wins each, the gap to close, and the 2-3 prizes to actually optimize around.

> **Scope + laws.** This is a positioning doc, not a build doc. No src edited, no DB written, no screenshots claimed beyond what the build fleet already verified (cited from SESSION-HANDOFF + git log). Prize categories are the **confirmed** ones (re-verified 2026-06-11 against the live Contra guidelines — `submission-checklist.md` §1; R1 did not surface a different set, so the planned targets ARE the real categories). Every external claim traces to a cited source at the bottom.

---

## 0. The prize field (confirmed)

Six prizes, $100k total (`makeathon-plan.md` §1.4 + `submission-checklist.md` §1, both traced to the [Contra guidelines](https://contra.com/community/topic/configmakeathon/guidelines)):

| Prize | $ | One-line bar |
|---|---|---|
| Grand | $50k | Best overall across all 4 judging categories |
| Runner-Up | $15k | Delivered on all dimensions, just under the Grand |
| Innovative Workflow | $10k | Most inventive design-to-build workflow ("across Make, MCP, Local, Weave, design agent, etc.") |
| Building with Purpose | $10k | Most exemplary use of design to solve a real-world problem |
| Build-in-Public | $10k | Most generous documentation of process for the community |
| Community Favorite | $5k | Makes people stop scrolling |

The 4 **judging categories** (5 pts each, +5 social, +5 Community share, max 30) are the lens all six prizes are scored through:
1. **Quality of work** — design + build + impact + craft
2. **Quality of idea** — solves a real problem
3. **Quality of video** — workflow + design decisions + emulatable process
4. **Novel/innovative Figma use** — across the Figma suite

Two structural facts that shape everything below:
- **You can't optimize for all six.** Grand, Runner-Up, and Build-in-Public reward *breadth + polish*; Innovative Workflow and Community Favorite reward *one sharp thing*. A single 3:10 video + one writeup has to serve them all. Decision §"For Sebs" at the bottom picks where the marginal hour goes.
- **The video is the dominant input.** Judging category 3 IS the video, and the other three categories are *experienced through* the video for most judges (they watch before they click). So "the gap to close" for almost every prize routes through the demo.

---

## 1. $50k Grand Prize

**Our angle.** One coherent thing that scores on all four axes at once: an intelligent rendering system whose headline claim — *the user's hand survives the round-trip 2D↔3D* — is a genuinely unoccupied competitive position (the "fidelity-to-the-hand" pole; Suzanne/Tripo/Meshy/TRELLIS all strip the hand — `21-research` §8 addendum, `01-what-is-desk-doodles` §"three fidelity poles"). It's wrapped in a live social product (the shared desk) that gives the idea a reason to exist and a stop-scrolling surface.

**The single strongest demo beat that wins it.** The **climax wedge shot** (demo-video shot 8, 1:45–2:20): draw fresh strokes → flip 2D→3D → the 3D form renders in the *same* mark family → orbit → move one `hachureGap` slider and 2D + 3D restyle in lockstep. This single moment hits work (real engineering), idea (no competitor does it), and novel-Figma-use (built in Make). It's the "Make Real went viral on a few seconds of capture" species of moment (`demo-video-plan` §1, [Latent Space / tldraw]).

**The gap we'd need to close.** Grand needs *all four* strong, and the weak axis is **breadth-of-polish under time pressure**, not the idea:
- The wedge must actually be on camera working end-to-end. As of Day 12 the 2D engine, the social desk, geometry modes (rod/extrude/inflate/solid), Hatch + SVG-port 3D styles, conversion pipeline, and ink-black material fix are landed and battery-verified (git log + SESSION-HANDOFF). The round-trip's *headline lockstep-slider* is the SVG-port path — built (Rock 1, item #30) but the live "move slider, both worlds change" capture isn't shot yet.
- Own design + motion language pass (M11, identity = II Warm Riso Press) is 06-16 — without it the surface reads as portfolio-scaffold, which caps "craft."
- Live-demo durability: Supabase auto-pause (R4) + published-surface parity must hold through judging June 18–23.

**Win probability: MEDIUM (lean medium-low).** Honest read: a $50k Grand against the entire ConFigMakeathon field is a long-ish shot for any solo entry — the base rate alone makes it low. What pulls it up to *medium* is that the idea genuinely owns an empty pole and the demo beat is unusually strong. What keeps it from *high*: Grand is won on breadth + finish, and the finish work (M11 identity, the live wedge capture, durability) all lands in the last 72 hours with zero slack. **What moves it:** land the lockstep-slider capture clean, do not let M11 slip, and shoot the video against a seeded, durable live desk. If the 3D-hard path (vision-LLM router → Tripo/TRELLIS) also lands with a cached fallback, the novel-Figma-use + idea axes jump and medium-low becomes solid-medium.

---

## 2. $15k Runner-Up

**Our angle.** Same product as Grand, framed as "delivered on every dimension." Runner-Up is the natural landing spot for an entry that is excellent and complete but doesn't quite top the field on the single most dazzling axis. Creative Figma usage + a real working prototype + a real idea = direct fit (`makeathon-plan` §1.5).

**The single strongest demo beat that wins it.** The **full three-beat arc playing cleanly** — social desk (Beat 1) → smart system with receipts (Beat 2) → wedge climax (Beat 3) — i.e. the whole video reading as "this person finished a real thing." Runner-Up rewards the *absence of holes* more than one peak. The receipts beat (shot 7: 1,394 traced region decisions, golden-diff, 197-shape audit) is the credibility anchor that says "complete, not a demo-ware shell."

**The gap we'd need to close.** Mostly the same finish work as Grand, minus the requirement to be #1. The specific risk for Runner-Up is **a visible seam in the arc** — e.g. the 3D path looking like a separate bolt-on rather than the same object (the 3D-chrome-split + SVG-port work directly addresses this; round-7 fixed the "2D panel shows in 3D doing nothing = reads broken" problem). Keep the round-trip feeling like one object, two views.

**Win probability: MEDIUM-HIGH.** This is realistically our best-EV high-dollar target. The work is broad and genuinely complete for a solo 14-day build, the idea is strong, and Runner-Up doesn't demand topping the field. **What moves it:** the same things that help Grand help here with more margin — every hour spent making the arc seamless and the video tight converts more reliably to Runner-Up than to Grand.

---

## 3. $10k Innovative Workflow

**Our angle.** Two distinct novelty claims, and they're different things — don't conflate them:
1. **The product's internal workflow is novel:** `signals → classify → treatment` as a general rendering-decision engine, and specifically the **vision-LLM-as-router** pre-step to 3D generators — `21-research` §8 found *no documented production case study* of using a vision LLM to route to a 3D generator. That's a real, citable novelty.
2. **The build workflow uses the Figma suite in a multi-tool way:** Figma Make (primary) + Weave (video/motion assets) + Figma Agent (logo/intro visuals) + MCP, plus the local-Vite ↔ Make checkpoint loop and the `/audit` page that doubles as debugger + training dataset. The guidelines explicitly reward usage "across Make, MCP, Local, Weave, design agent, etc." (`submission-checklist` §1).

**The single strongest demo beat that wins it.** The **workflow segment (shot 9, 2:20–2:50)**: Make published surface + local dev side-by-side, Weave-made motion assets on screen, Agent-made logo, the `/audit` debugger-as-trainingset, one build-in-public post — VO: "steal the process." Showing the tools on screen is itself the scoring material here.

**The gap we'd need to close.** Two real risks:
- **Figma Agent access is unconfirmed.** Agent beta required preregistration before June 3 5pm PST (`submission-checklist` §5). If Sebs doesn't have access, the multi-tool story drops to Make + Weave + MCP — still qualifying, but thinner. Verify access this week; if absent, drop Agent from the narrative *honestly* (the LAWS forbid name-dropping a tool we didn't use).
- **The vision-LLM router is 06-15 work, gated on Sebs-side Tripo key + fal credits.** If it doesn't land live, the *internal* novelty claim has to be demoed via the cached example, which is fine for the video but weaker than a live decision. The `signals → classify → treatment` Smart Hachure engine is already real and on camera, so the workflow claim survives even if the router slips — it just loses its sharpest example.

**Win probability: MEDIUM-HIGH (conditional).** This is the prize where our *specific* substance is strongest relative to the field — the vision-LLM-router novelty is citably-unoccupied, and the multi-tool Figma story is exactly what the category names. It's conditional on (a) Agent access being real and (b) at least the cached router example being shootable. **What moves it:** confirm Agent access now; land the router cached example even if live generation slips; make shot 9 concrete (real tool windows, not a claim).

---

## 4. $10k Build-in-Public

**Our angle.** The process trail is unusually deep and *already public*: 68+ docs, a public GitHub with 15+ commits carrying real engineering narrative, golden-label v1/v2 baselines, the `/audit` catalog as a documented training-dataset-being-built, designated build-in-public posting days, and a research method (cited deep-research synthesis docs) that's itself a teachable artifact. "Most generous documentation of process for the community" maps directly (`makeathon-plan` §1.5).

**The single strongest demo beat that wins it.** Not a single video beat — it's the **README + repo + docs tree as the artifact**, reinforced by the video's "everything's documented in public; the audit page that debugged the engine IS its training set; steal the process" line (shot 9 VO). The README is the first thing a Build-in-Public judge sees, and it's now refreshed (no longer "Day 5 of 14" — fixed; it reads as a real product with the wedge + three-pole framing).

**The gap we'd need to close.** Build-in-Public is judged on *generosity + emulatability*, and the gap is **packaging the existing depth into a few publishable narrative artifacts**, not creating new substance:
- The buffer-day long-form posts (foundation-first methodology, Smart Hachure algorithm breakdown, the Rapier-verdict writeup) are drafted-in-spirit but not all published.
- The Community-share of the Make file (+5 pts, potential figma.com/community featuring) is a 06-18 deliverable, not done.
- Consistent designated-day posting cadence through the final week (per `feedback_selective_brand_tagging`: hashtag every post, @figma only on the final).

**Win probability: HIGH.** This is our **best-odds prize.** The raw material massively exceeds what most solo entrants will have, the cost to convert it is low (packaging, not building), and it rewards exactly the thing this project has been doing involuntarily (writing everything down). The only way we lose it is by *not packaging* — leaving the depth buried in `docs/` where a judge skimming a social feed never sees it. **What moves it:** 2-3 polished public posts + the Community file share + a README that over-delivers. All cheap, all high-leverage.

---

## 5. $5k Community Favorite

**Our angle.** The shared public desk is a distinctive, legible-in-one-glance metaphor: a communal desk covered in everyone's mixed-style doodles, doodles arriving live, a wall-of-walls gallery. "Stop scrolling" energy (`makeathon-plan` §1.5). The wedge flip ("you drew this, now spin it") is also natively shareable — it's a 6-second muted-autoplay moment.

**The single strongest demo beat that wins it.** The **30-sec social cut**, specifically the cold-open wedge flip + the live-arrival desk moment, captioned to read **muted** (~85% of social video plays without sound — `demo-video-plan` §1, [Digiday]). Community Favorite is won on the social post, not the main video.

**The gap we'd need to close.**
- The 30-sec cut must be derived from the same takes, captions burned in, 9:16, reads muted (planned, not shot).
- The desk needs to *look alive* on camera — seeded with 8-10 genuinely good doodles + a second session for the live-arrival shot (demo-data prep, 06-16 night).
- Community Favorite often correlates with raw reach/voting dynamics we don't control; substance gets us in the running, distribution decides it.

**Win probability: MEDIUM (lean low if it's vote-driven).** The metaphor is genuinely scroll-stopping and the wedge is share-bait, so on *merit* this is a medium. The honest discount: if "Community Favorite" is decided partly by public votes / reach, a solo entrant without a big audience is at a structural disadvantage regardless of quality. **What moves it:** a killer muted 30-sec cut, an alive-looking seeded desk, and Sebs leaning into distribution (the build-in-public following he's accrued, tagging strategically). If it's pure judge-pick on "stop-scrolling," medium; if it's vote-weighted, low.

---

## 6. $10k Building with Purpose

**Our angle (honest: we don't really have one).** Building with Purpose rewards "design to solve real-world problems." Desk Doodles is creative/expressive — a shared space for a creative habit. That's a *real* problem in a soft sense (creative isolation, sketches dying in notebooks), but it is not a serious social/accessibility/civic problem of the kind this category is built to reward. Per the locked memory `project_desk_doodles_own_design_language` and `makeathon-plan` §1.5: **do not twist the narrative to claim this.** Forcing a purpose framing would also violate the LAWS (no inflated provenance) and risks reading as inauthentic to judges who see the same move from many entrants.

**The single strongest demo beat that wins it.** There isn't one we can ship honestly. The closest legitimate framing is the "designers sketch constantly, those sketches die, there's no shared space" problem statement (shot 2 VO) — but that's a creative-habit problem, not a "building with purpose" problem, and stretching it further would be dishonest.

**The gap we'd need to close.** A different product. To genuinely target this we'd need a real-world-problem core (accessibility, education, civic, health) that Desk Doodles doesn't have and shouldn't fake in 6 days.

**Win probability: LOW (do not target).** **What would move it** — and the honest answer is the only thing that would is a scope pivot we explicitly should NOT do this late. Don't spend a single optimization hour here. If a judge happens to read the creative-isolation framing charitably, that's upside we take for free; we don't engineer for it.

---

## 7. Honest summary table

| Prize | $ | Probability | The one beat that wins it | Biggest gap |
|---|---|---|---|---|
| **Build-in-Public** | $10k | **HIGH** | README + docs tree + 2-3 published posts + Community file share | Packaging depth into public artifacts (cheap) |
| **Runner-Up** | $15k | **MED-HIGH** | The full 3-beat arc playing seamlessly | A visible seam in the arc; finish polish |
| **Innovative Workflow** | $10k | **MED-HIGH (conditional)** | Workflow segment (shot 9) — multi-tool + vision-LLM router | Agent access unconfirmed; router is 06-15 + gated |
| **Community Favorite** | $5k | **MED** (low if vote-driven) | The muted 30-sec social cut (wedge flip + live arrival) | Alive-looking seeded desk; distribution we don't control |
| **Grand** | $50k | **MED** (lean med-low) | The climax wedge lockstep-slider shot | Breadth-of-finish in the last 72h (M11 + live capture + durability) |
| **Building with Purpose** | $10k | **LOW — don't target** | (none shippable honestly) | A different product; do not fake it |

---

## 8. The optimization call (which 2-3 to build the demo + writeup around)

A single 3:10 video + one writeup can't peak for all six. The math:

- **Build-in-Public is the highest-EV prize** (HIGH odds × $10k, low marginal cost) and it's optimized mostly *outside* the video — README, docs packaging, Community share, posts. So it gets the cheap-but-mandatory hours and doesn't compete with video time.
- **The video itself** should be optimized for the **Grand / Runner-Up axis** — because the same seamless, finished, wedge-climaxing arc that maximizes Runner-Up odds (med-high) is also the only thing that gives Grand (med) a shot, AND the workflow segment inside it carries Innovative Workflow. One video, three prizes, no conflict — *as long as we don't pad it for length and we keep shot 9 (workflow) concrete.*
- **Innovative Workflow** is the third focus because its substance is genuinely strong (citable vision-LLM-router novelty + multi-tool Figma) and its cost is mostly "make shot 9 real + confirm Agent access" — additive to the video we're already cutting.
- **Community Favorite** rides the 30-sec cut for free (derived from the same takes — never a separate shoot) plus Sebs's distribution; we don't bend the main video for it.
- **Building with Purpose** gets zero hours.

So: **optimize the demo video + writeup around Runner-Up / Grand (the seamless finished arc with the wedge climax) and Build-in-Public (the docs/README/posts/Community-share package), with Innovative Workflow as the close-third carried by the workflow segment inside the same video.** Don't touch Building with Purpose.

---

## 9. Sources

- Contra guidelines (rendered 2026-06-11): https://contra.com/community/topic/configmakeathon/guidelines — prize structure, judging categories, submission requirements, multi-tool reward language.
- Internal: `docs/locked-refs/F3-smart-hachure-system/makeathon-plan.md` §1.4 (prize structure), §1.5 (prize-targeting strategy, "don't target Building-with-Purpose"), §8.6 (Smart Rendering System framing).
- Internal: `docs/design/submission-checklist.md` §1 (re-verified requirements), §3 (three-pole positioning + 3 demo beats), §5 (Sebs decisions: Agent access, og-image, length).
- Internal: `docs/design/demo-video-plan.md` §1 (cited research: Devpost best practices, tldraw/Make Real virality, Digiday muted-video), §2-3 (the three beats + shot list), §5 (60-sec + 30-sec social cut).
- Internal: `docs/research/21-research-3d-pipeline-and-style-translation.md` §8 (vision-LLM router — no production precedent found), §8 addendum + §13 (three-pole map / the wedge).
- Internal: `docs/knowledge/01-what-is-desk-doodles.md` §"the wedge", §"three fidelity poles".
- As-built state: `git log` (Day-12 commits — round-7 3D system, Wireframe rebuild, env tan fix, shade-fill tools) + `SESSION-HANDOFF.md` (battery-verified landings) + `README.md` (refreshed, no longer "Day 5 of 14").
- Memory: `project_desk_doodles_own_design_language` (own design language at 06-16, not portfolio reskin), `feedback_selective_brand_tagging` (posting cadence + @figma tagging discipline).
