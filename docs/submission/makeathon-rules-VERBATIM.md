# Config Makeathon — VERBATIM rules + eligibility verdict + strategy

**Source of truth.** This is the official guidelines text Sebs pasted from the Config Makeathon page on 2026-06-13. If a research doc or any other note conflicts with this, THIS WINS. Deadline: **enter by Jun 18, 11:59pm PDT.** Winners announced **June 23 at Config.**

---

## The challenge (verbatim intent)
> Design a solution to a problem; test out new tools and use them to design and build something that makes a difference. Show how you use Figma to build something with purpose and meaning — something that improves your life, your community, or the world.

## Submission requirements (ALL required)
1. **Video** walking through the work + the idea behind it — the problem you're solving, and the **workflow** used to bring it to life.
2. **Made using Figma's suite of products** (Figma Make, MCP, agent, etc. — see Tools).
3. **Link(s) to your project** — a **live project link** AND a **community or working project file link**.
4. **Share your video to social** — REQUIRED to qualify (Instagram, X, or LinkedIn; tag **#ConfigMakeathon** and **@figma**). After submitting, share social links on Contra.

**Bonus:** sharing to the Figma Community = bonus points + possible feature at top of figma.com/community.

## Judging criteria (5 pts each)
1. **Quality of work** across design, build, impact, craft.
2. **Quality of the idea** + its ability to solve a real problem (yourself / community / world).
3. **Quality of the video** showcasing workflow, design decisions, and steps others could emulate.
4. **Building in Figma in a novel/innovative/unexpected way** across Make, MCP, Local, Weave, design agent, etc.

## Scoring
- 5 points per judging category (4 categories)
- **+5 points** for projects shared on social
- **+5 points** for Figma projects shared to the Figma Community

## The tools (what counts as "Figma's suite")
Figma **Make** (prompt-to-code), Figma **MCP** (connect Figma to AI coding tools), Figma **Agent** (beta, in-canvas), Figma **Weave** (AI image/video/media workflows), **Local**. The judging criterion #4 explicitly names "**Make, MCP, Local, Weave, design agent, etc.**"

## Prizes
| Prize | $ | What wins it |
|---|---|---|
| Grand Prize | $50,000 | Best overall — exceptional across design, build, impact, craft |
| Runner Up | $15,000 | Delivered on all dimensions; creative use of Figma to ship a standout working prototype |
| **Innovative Workflow** | $10,000 | Not what you built but **how** — most inventive design-to-build workflow using Make/MCP/Local/Weave/agents |
| Building with Purpose | $10,000 | Most exemplary use of design to solve real problems for real people |
| Build-in-Public | $10,000 | Most generous process documentation (screencasts, breakdowns, explainers) |
| Community Favorite | $5,000 | The project that makes people stop scrolling |

## Teams
Max 2 people. One submits = sole prize recipient. Tag teammates in the entry. Solo is allowed (we're solo).

---

## ⚖️ ELIGIBILITY VERDICT — we're IN, and the workflow is an ASSET (not a liability)

Sebs worried our Figma Make usage was thin (we built local-canonical and used Make as a deploy/live-test surface). **The rules resolve this in our favor:**

- The requirement is "**made using Figma's suite of products (Figma Make, MCP, agent, etc.)**" — NOT "authored entirely inside Make." Judging criterion #4 explicitly rewards **MCP + Local + Make** together.
- Our real workflow IS a Figma-suite workflow: **Figma MCP/Local** (the Figma MCP server wired into our AI coding tool — used this whole build) **+ Figma Make** (deploy + live-test checkpoints). That is literally the named "Local + MCP + Make" combination.
- So the honest framing is also the WINNING framing: a hybrid **Local → MCP → Make** pipeline is exactly the territory the **$10k Innovative Workflow** award rewards. We do NOT hide the local-first workflow — we lean into it as the novel design-to-build pipeline.

**Make-usage framing — DECIDED DIRECTION (Sebs 2026-06-13): Make-forward, repo-safe.**
- There IS a Figma Make file/project; the app is **published live through Make** (satisfies the live-link + Make-usage requirements).
- Frame Make as **home base** (designed-to-code + published) and the **Claude Code CLI as the engineering + automated test-and-break partner**, with Figma MCP/Local wiring design into the build and **Weave** for motion/video/graphics.
- Recommended line: *"Figma Make is home base — where Desk Doodles is designed-to-code and published live — with a Figma MCP + Local loop and the Claude Code CLI as the engineering + automated test-and-break partner. Designed in Figma, motion and video with Weave."* (Stacks 4 Figma-suite tools = the literal Innovative-Workflow criterion.)
- ⚠️ **GUARDRAIL (honesty/credibility):** the GitHub repo is PUBLIC for Build-in-Public and its git log shows local Claude Code commits. Do NOT claim Make *authored* what the repo shows the CLI built — a judge cross-check (which Build-in-Public invites) would ding us on workflow-honesty, the exact Build-in-Public axis. The hybrid framing above is Make-forward AND survives the repo. Final wording = Sebs confirms.

## 🎬 VIDEO + GRAPHICS PLAN (Sebs 2026-06-13 — uses Figma + Weave = more criterion-4 footprint)
- **Submission video** (REQUIRED; scores 2 of 4 categories) — assembled in **Figma + Weave**; covers problem + idea + workflow + emulatable steps.
- **First-visit intro animation** on the site — "stop-scrolling" hook (Community Favorite) — built in Weave/Figma.
- **Other graphics** as needed: OG image (public/og-image.png 1200×630), social card, explainer frames.
- **Claude records the key scenes near end-of-build** (clean screen-recordings of: draw→Sketch|Style flip · the 2D↔3D wedge "hand survives the round-trip" · region-fill · shading) → Sebs takes them into Figma/Weave to assemble. Cut to the video beats.
- Using Weave also helps the **Figma Community share** bonus (+5) and adds a 5th tool to the suite footprint.

## 🚀 PUBLISH + REPO PLAN (Sebs 2026-06-13 — resolves the credibility guardrail)
- **Decision:** the public/submission GitHub repo = the **Figma Make version** (so "made in Make" matches what judges see). THIS current local repo stays as the engineering record, reconciled post-makeathon.
- **Make git constraint:** Figma Make can **PUSH to git but NOT pull.** So it's one-way: drag-drop the current full code INTO Make → Make **pushes** to the public submission repo. Make can't merge our local Claude Code history, so the Make repo should be its own repo/branch (don't point Make's push at a repo with conflicting local history it can't pull/merge).
- **⚠️ CRITICAL precondition = Make checkpoint #2:** the Make version MUST contain ALL of Round 7/7b/8 (3D system, shading/fill, the wedge) — the last checkpoint was ~Day 9 / 34 files. Do a FULL re-upload of current code to Make FIRST, smoke-test in Make preview, THEN publish + push. Do NOT submit the stale Make file. **STATUS: PENDING (Sebs-side — he runs Make uploads). Claude preps the clean file list + Make-importability re-check + the upload/routing prompt.**
- This single Make-published version satisfies BOTH required links: **live project link** (Make deploy) + **working project file link** (the Make file / pushed repo).

## 🧩 FREE STROKE = OUR CUSTOM ENGINE (workflow-story asset)
- Free Stroke is Sebs's own draw→3D geometry engine (rod/extrude/inflate/solid + style-system), ported in as the `geometry3d` lib. Frame it as **"our custom geometry engine"** — NOT a third-party "API" (it's an in-bundle library, his own IP). Calling it a custom engine is both more accurate AND more impressive.
- It's a genuine wedge + Innovative-Workflow asset: we built our OWN hand-preserving 2D→3D engine instead of a black-box mesh service — which is WHY "the hand survives the round-trip" (Tripo/Meshy/Suzanne strip the artist's signature; our engine keeps the strokes).
- Dual-path story: **custom Free Stroke engine** (local, hand-preserving, default) + optional **Tripo / fal.ai AI-mesh** (genuine third-party API, the "hard path," point-of-need ~Day 14). Mention both honestly.

**One open verification (low risk):** confirm "made using Figma's suite" is satisfied by MCP/Local usage in judges' eyes — the criteria text strongly implies yes. The deeper positioning lives in the research fleet's docs/submission/makeathon-rules-and-framing.md.

---

## 🎯 QUALIFY CHECKLIST (must-haves before the deadline)
- [ ] **Video walkthrough** (problem + idea + workflow + emulatable steps). Biggest scoring lever; touches 2 of 4 categories. Plan: docs/design/demo-video-plan.md. — NOT DONE
- [ ] **Live project link** (deployed URL — the Make deployment or other host). — verify status
- [ ] **Community OR working project file link** — ⚠️ NEW GAP: we've been code-only. Need a Figma Community post or a working Figma file link. Also unlocks the +5 Community share bonus. — NOT DONE, FLAG
- [ ] **Social post** with the video, #ConfigMakeathon + @figma — REQUIRED to qualify. — NOT DONE
- [ ] **Contra**: share social links after submit.

## 🏆 PRIZE STRATEGY (which to optimize — can't max all)
Lead bets, in priority:
1. **Innovative Workflow ($10k)** — our hybrid Local+MCP+Make + the smart-rendering engine (signals→classify→treatment) is genuinely novel design-to-build. Strongest fit.
2. **Grand/Runner-Up ($50k/$15k)** — the wedge ("the user's hand survives the round-trip" 2D↔3D) as a standout working prototype. Needs the demo to land.
3. **Build-in-Public ($10k)** — we have a real build trail; the knowledge-docs (docs/knowledge/) + screencasts are generous documentation. Cheap to capture more.
4. **Building with Purpose ($10k)** — our WEAKEST axis (Desk Doodles is a creative/social canvas, not an obvious "solves a real-world problem"). Needs a crisp purpose narrative or we concede this one. (Research fleet to propose angles.)
5. **Community Favorite ($5k)** — rides the Figma Community share + a scroll-stopping demo clip.

Detailed prize-by-prize angles + win-probabilities: research fleet → docs/submission/prize-positioning.md.
