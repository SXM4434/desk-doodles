# Community Publish + Motion Documentation — the two-artifact plan

**Date:** 2026-06-13 (Day 13 of 14). **Deadline:** 2026-06-18 11:59 PM PDT.
**Purpose:** Two concrete deliverables Sebs asked for, both living here so they don't get lost:
- **PART 1** — the TWO Community artifacts (Make project → Community + a design-system Figma file → Community), each earning **+5**, with copy-pasteable step-by-step publish flows and the exact required submission links.
- **PART 2** — HOW to document the motion work (the two celebrated moments, the first-visit intro, the lockstep-slider wedge), one recommended primary method, and how it ties into the video + the Community file.

> **Scope + laws.** Strategy/positioning doc only — **no `src/` edits, no live-DB writes, no fabricated tool usage.** New file, no collision (verified target did not exist). Every Figma-mechanics claim traces to a cited Figma Help Center page (June 2026). Honesty law carried from `the-story.md` + `figma-suite-usage-plan.md`: name a tool only for work it *actually does*; the public git log shows local Claude Code authoring and Build-in-Public invites that cross-check, so a forced/false claim dings the Build-in-Public axis itself.
>
> **Builds on, does not duplicate:**
> - The required links + the +5 bonuses + judging criteria → `makeathon-rules-VERBATIM.md` (SOURCE OF TRUTH)
> - Which Figma tools earn their place → `figma-suite-usage-plan.md` §6 (the committed-artifacts table — this doc operationalizes the **Make** + **FigJam/diagram** + **MCP/Local** + **Weave** rows)
> - The narrative the artifacts serve → `the-story.md`
> - Video shot list + the K-scene capture list → `docs/design/demo-video-plan.md` (esp. §11 K1–K9, §12 assembly)
> - Motion-moment ratifications → `docs/research/25-research-own-design-language.md` §2 + `docs/knowledge/14-the-social-desk.md`

---

## 0. The answer first (read this if you're running)

- **YES — both shares are valid Community shares, and they earn TWO separate +5s** is the *intent*, but **confirm the stacking with the makeathon host** (the rules say "+5 for projects shared to the Figma Community" — singular "projects," not "per share"). Treat the **Make→Community share as the load-bearing one** (it also satisfies the required *working-file link* AND gives you the live link in one shot). The **design-system file→Community share is the bonus-stacker + craft signal** — do it, but it's insurance, not the thing the entry hinges on. (Decision flagged below.)
- **Make→Community publishes to the public web automatically** — one action gives you BOTH required links (live `*.figma.site` + Community page). This is the cheapest path to closing the flagged Community-link GAP.
- **A Figma design-system file→Community is a normal file publish** (Share → Publish to Community) — available on any plan, needs a Community profile, a 1920×1080 cover, description, ≤5 tags, a category.
- **Motion docs: ONE primary = a Figma "Motion Spec" page** (the named moments + easing/timing/keyframe notes), built as a board that lives INSIDE the design-system Community file and feeds a video chapter card. The in-repo motion-doc is the cheap honest backup; a Weave export is *not* documentation (it's an asset).
- **By-hand items for Sebs** are flagged with ⚠️ throughout and collected in §7.

---

# PART 1 — THE TWO COMMUNITY ARTIFACTS

## 1.1 Are both valid Community shares? (eligibility read)

The makeathon rules (`makeathon-rules-VERBATIM.md` §Scoring): *"**+5 points** for Figma projects shared to the Figma Community."* And §Bonus: *"sharing to the Figma Community = bonus points + possible feature at top of figma.com/community."*

Two things are independently shareable to the Figma Community, and both are first-class Community resource types:

| Artifact | Community resource type | Valid Community share? | Earns the +5? |
|---|---|---|---|
| **(a) The Make project** (the live app) | "Functional prototype / web app" Community page | **YES** — Figma's own publish flow is "Publish a functional prototype or web app to the Figma Community" | **YES** (it's a Figma project shared to Community) |
| **(b) A design-system Figma file** (tokens/variables/styles + render-style + tone-band swatches) | Standard Community file (design resource) | **YES** — the canonical "Publish files to the Figma Community" flow | **YES** (it's a Figma project shared to Community) |

Both are genuine, non-forced Community shares. (b) is *especially* honest because the design system is real work we have to do anyway — the 06-16 "II Warm Riso Press" identity pass (`project_desk_doodles_own_design_language`; `figma-suite-usage-plan.md` §6). Publishing it is not theater; it's the identity work made shareable.

> ⚠️ **DECISION FOR SEBS — does the +5 stack to +10 for two shares, or cap at +5?** The rule text is singular ("projects shared to the Figma Community"). **Don't assume +10.** Recommended posture: do BOTH regardless (the second is cheap and a craft/Community-Favorite signal even at +0 marginal points), and **ask the host on Contra whether two Community shares stack.** Plan the entry to qualify and score fully on the *Make* share alone; treat the design-file share as upside.

## 1.2 The exact required submission links (what goes in the entry)

From `makeathon-rules-VERBATIM.md` §Submission requirements #3: *"a **live project link** AND a **community or working project file link**."*

The Make→Community publish satisfies BOTH at once (it publishes to the public web *and* creates the Community page — cited below). So the entry's link block is:

| Required link | Source | The actual URL shape |
|---|---|---|
| **Live project link** | Make publish → public web | `https://<three-random-words>.figma.site` (Figma's auto-generated subdomain; custom domain optional on paid plans) |
| **Community / working file link** | Make→Community page (primary) | the `figma.com/community/...` page for the published Make project |
| **(bonus) 2nd Community link** | design-system file→Community | the `figma.com/community/file/...` page for the design system |

> ⚠️ **Sebs by-hand:** copy these three URLs into the Contra entry's link fields + the social post + the README. The live `*.figma.site` URL must be the one shown ON CAMERA in the demo video (not localhost — `demo-video-plan.md` §6).

---

## 1.3 ARTIFACT A — publish the Make project to Community (the live app)

**Source:** Figma Help — *Publish a functional prototype or web app to the Figma Community* ([help.figma.com/...33652209702423](https://help.figma.com/hc/en-us/articles/33652209702423-Publish-a-functional-prototype-or-web-app-to-the-Figma-Community)) + *Figma Make FAQs* ([...31722591905559](https://help.figma.com/hc/en-us/articles/31722591905559-Figma-Make-FAQs)) + *Publish, update, or unpublish a Figma Make file* ([...31304586129559](https://help.figma.com/hc/en-us/articles/31304586129559-Publish-update-or-unpublish-a-Figma-Make-file)).

### Prerequisites (verify BEFORE publishing)
- **Seat/plan:** a **Full seat on a paid plan** can publish to Community + public web. (Sebs has Pro per `feedback`/handoff — confirmed access.) `can edit` on the Make file is required.
- ⚠️ **CRITICAL precondition = Make checkpoint #2 first.** The Make file MUST contain ALL of Round 7/7b/8 (3D system + shading/fill + the wedge). Last checkpoint was ~Day 9 / 34 files (`makeathon-rules-VERBATIM.md` §🚀). **Do a FULL re-upload of current code → smoke-test in Make preview → THEN publish.** Submitting the stale Make file would make "made in Make" point at a version WITHOUT the wedge — the worst possible miss. (Claude preps the clean file list + importability re-check + upload prompt; Sebs runs the upload.)
- ⚠️ **Note for judges/remixers:** Figma's current behavior — *"conversation history is displayed when someone remixes your functional prototype or web app."* Since the Make file is the *deploy* surface (not the authoring record), make sure the Make-side prompt history doesn't contradict the honest "authored locally, published live through Make" framing. If the history is thin/clean, fine; if it implies Make authored the app, that conflicts with the repo cross-check (`makeathon-rules-VERBATIM.md` §⚖️). Review it before publishing.

### Step-by-step (exact UI)
1. Open the Make file in Figma (owner or `can edit`).
2. Click **Publish** in the upper-right corner.
3. Toggle **Feature on Community** ON.
4. Fill the Community-page fields in the publish flow:
   - **Page name** (required) — `Desk Doodles`
   - **Description** (optional but DO IT) — see copy block below
   - **Tags** (optional but DO IT) — see tag list below
   - **Thumbnail preview** — the cover image (see §1.5 for the recommended cover)
   - **Additional contributors / Support contact / Comments toggle** — optional; leave comments ON (Community-Favorite engagement)
5. Click **Publish**. A Community-page preview appears on success.
6. **After publishing:** you can edit the Community page — change the screenshot/thumbnail, add more detail, etc. Do a polish pass here.

### What happens automatically
- *"When you publish a functional prototype or web app to the Community, Figma Make also publishes to the public web so [it] can be accessed from the corresponding Community page."* → **one action = live link + Community link.**
- The public URL is `<three-random-words>.figma.site` (Make FAQ). Hosted on AWS, routed via Cloudflare.
- ⚠️ By default the published app **isn't discoverable by search engines** — adjustable in the published project's settings. (Doesn't matter for the entry; the link is what's judged.)

### ⚠️ Things Sebs must do by hand for Artifact A
- Run the **full re-upload to Make** (checkpoint #2) and smoke-test all routes in Make preview FIRST.
- Verify the live `*.figma.site` loads logged-OUT (incognito) — judges aren't logged into your Figma.
- Verify the **Supabase keepalive Action has fired** so the live desk isn't auto-paused during judging (06-18→23) (`the-story.md` §7 durability hole).
- Seed the open desk with 8–10 good doodles before the link goes public (demo-data prep, `demo-video-plan.md` §6).
- Copy the live URL + Community URL into the entry/social/README.

> **Unpublish caveat:** unpublishing the Community page ALSO unpublishes the app from the public web (they're linked). Don't unpublish during judging week.

---

## 1.4 ARTIFACT B — publish the design-system Figma file to Community

**Source:** Figma Help — *Publish files to the Figma Community* ([help.figma.com/...360040035974](https://help.figma.com/hc/en-us/articles/360040035974-Publish-files-to-the-Figma-Community)) + *Create a Community profile* ([...360038510833](https://help.figma.com/hc/en-us/articles/360038510833-Create-a-Community-profile)) + *Community publishing permissions* ([...360041423614](https://help.figma.com/hc/en-us/articles/360041423614-Community-publishing-permissions)).

### What this file IS (per Sebs's plan)
A real Figma **design-system file** for Desk Doodles, populated by the genuine suite tools (`figma-suite-usage-plan.md` §6):
- **Tokens / variables / styles** — the 06-16 "II Warm Riso Press" identity (W1/W1-D color, ISe type ladder, locked spacing), **synced via MCP** (the `get_variable_defs` bridge is the genuine MCP act — `figma-suite-usage-plan.md` §2.2) and **authored/assisted via Figma Agent** (Agent's one honest graphics commitment — §2.4: graphics file only, NEVER the engine).
- **Render-style swatches** — the 11 SVG styles (rough-handdrawn / sketchy / bold-ink / wet-ink / stipple / charcoal / risograph / newsprint / wireframe / clean / outline-only) shown as sample marks.
- **Tone-band swatches** — the 8-band coverage table (the marker-model darkness bands 1–7 + the "one math, two renderers" invariant from `the-story.md` §3) as a visible ramp.
- **The pipeline diagram** — `signals → classify → treatment → render` + the 2D↔3D round-trip + the three-fidelity-poles map, as a FigJam/diagram board (MCP `generate_diagram` — `figma-suite-usage-plan.md` §2.5). This is the file's conceptual body and doubles as a video chapter card.
- **The Motion Spec page** — see PART 2 (this is where the motion documentation LIVES).

This is the "working project file link" in its fullest, craft-forward form — and it's honest because every piece is real work the identity pass requires anyway.

### Prerequisites
- **Plan:** *"Available on any plan."* `can edit` on the file required.
- ⚠️ **Community profile required first** (you publish *as* a profile). If Sebs doesn't have one: create it via *Create a Community profile* before publishing. (One-time, ~2 min.)
- **Permissions:** publishing rights depend on team/org role — if the file is in a team that restricts Community publishing, move it to a personal/draft space or get the role bumped (*Community publishing permissions*).

### Step-by-step (exact UI)
1. Open the design-system file in the Figma editor.
2. Click the **Share** button in the toolbar.
3. Select **Publish to Community** (tab at the top of the modal).
4. Click **Publish** to open the publishing modal.
5. Fill required metadata:
   - **Name** — `Desk Doodles — Design System & Motion Spec`
   - **Description** — directions + credit (copy block below)
   - **Category** — choose one (recommend a design-systems / UI-kit category)
   - **Tags** — **up to 5**, max 25 chars each (list below)
   - **Thumbnail** — recommended **1920 × 1080**; use the **Community file cover frame preset** to make a correctly-sized frame
   - **Additional images** — up to **9** more for the media carousel (also 1920×1080) — use these for the swatch sheets, the pipeline diagram, the motion-spec frames
   - **Optional:** additional contributors (need view/edit access + a Community account), comments toggle, support contact
6. Click **Publish**.

### ⚠️ Things Sebs must do by hand for Artifact B
- Create the Community profile (if not already).
- Build the cover frame (1920×1080) using the preset — this is design work, do it with care (it's the Community thumbnail people scroll past).
- Decide the carousel order (lead with the strongest frame — recommend the wedge/round-trip diagram or the hero swatch sheet).
- Confirm the file isn't in a permission-locked team.

---

## 1.5 Shared assets — cover, description, tags (reuse across both)

### Cover image (both artifacts)
- **Make:** the "thumbnail preview" in the publish flow (can be changed after publishing).
- **File:** 1920×1080, built with the **Community file cover frame preset**.
- **Recommendation:** the cover should be the **wedge in one frame** — a hand-drawn doodle on warm paper, half 2D / half flipped to 3D, with the line "Your hand survives the round-trip." This is the scroll-stopper (Community-Favorite lever) and it's consistent with the OG image + video cold-open. Make it in **Weave/Figma** (also widens the suite footprint honestly — `figma-suite-usage-plan.md` §2.3).

### Description (drop-in copy — edit to taste, keep it honest)
> **Desk Doodles** — a shared public desk where you draw the little things around you, restyle them with a real hand-drawn engine, and flip them between 2D and 3D. The bet no other tool makes: *your hand survives the round-trip.*
>
> Built solo for the Config Makeathon. Authored locally (Vite + React + TS, public on GitHub), deployed and run live as a Figma Make site, with the design system bridged in via Figma MCP and motion/media from Figma Weave.
>
> Live app: <\*.figma.site URL> · Repo: github.com/SXM4434/desk-doodles · #ConfigMakeathon @figma

(For Artifact B add: *"This file documents the design tokens, the 11 render-style swatches, the 8-band tone ramp, the signals→classify→treatment pipeline, and the motion spec for the two celebrated moments."*)

> **Honesty guardrail:** the description says *"deployed and run live as a Figma Make site"* — NEVER "built in Make" (`makeathon-rules-VERBATIM.md` §⚖️; matches `the-story.md` §8 Option C). This survives the public-repo cross-check.

### Tags (≤5; reuse for both, custom tags ≤25 chars)
`hand-drawn` · `2d-to-3d` · `npr` (or `non-photorealistic`) · `design-system` · `config-makeathon`

(Swap `design-system` for `prototype`/`web-app` on the Make share if a more app-flavored tag reads better; keep `config-makeathon` on both for discoverability + the host's possible Community feature.)

---

# PART 2 — HOW TO DOCUMENT THE MOTION

## 2.1 The decision: ONE primary method

Three candidates were on the table. The recommendation:

| Method | What it is | Verdict |
|---|---|---|
| **(i) Figma "Motion Spec" page** | A board: the named moments + keyframe stills + easing/timing/spring notes | **★ PRIMARY** — it's *documentation* (legible, durable, judge-readable), it lives inside the Community design-system file (so it ships as a Community artifact, +5 surface), and it feeds a video chapter card. Best fit for criterion #1 (craft) + #3 (emulatable process). |
| **(ii) Weave workflow capture/export** | A node-graph / rendered clip of the motion in Weave | **NOT documentation** — it's an *asset/output*, not a spec. Weave makes the *media around* the demo (title cards, intro), not the engineering record of how the spring is tuned. Keep Weave for what §2.3 of `figma-suite-usage-plan.md` already commits it to; don't reframe an asset as a spec. |
| **(iii) Short in-repo motion doc (.md)** | Markdown listing the moments + the actual spring/duration constants | **SECONDARY / backup** — cheap, honest, lives where the code is (Build-in-Public), and it can cite the *real* constants from source. Do it as the lightweight companion; it is NOT the showcase. |

**Primary = the Figma Motion Spec page.** Backup = a short in-repo `.md`. Weave is *not* a documentation method — it's where the motion *assets* get produced (and shown on camera, which scores criterion #4 separately).

> **Why a Figma page over a repo doc as the primary:** the motion work is part of the *craft + Community* story, and a Figma motion-spec board (a) is something a judge can actually look at and learn from, (b) ships as a Community artifact (closing/strengthening the +5 file), and (c) becomes a ready-made video chapter card. A repo `.md` does (none of those) for judges who don't read source — but it's the honest source-of-truth backup, so do both.

## 2.2 What gets documented (the exact content)

Three motion moments are RATIFIED and must each get a spec block (per `25-research-own-design-language.md` §2 + `14-the-social-desk.md`). **There are exactly TWO celebrated motion families — restraint is a Sebs-agreed law; do NOT invent a third** (`feedback_push_back_on_overadding`; `14-the-social-desk.md` line 57).

### Moment 1 — "Doodle lands on the desk" (celebrated #1, the flagship)
- **The motion:** scale-in **0.92 → 1.0 with a slight overshoot** + **sit-shadow fade** — the object "drops" onto the paper. **Interruptible.**
- **Spring tuning per identity** (`25-research` §2 + §5): the chosen "II Warm Riso Press" / riso pole = **one soft overshoot** (not critically damped, not bouncy). (Calm-paper pole = zero bounce; marker pole = low damping — but the locked direction is the middle/riso "one soft overshoot.")
- **Also covers the drag-to-place DROP** — the drag-drop drop animation **REUSES this exact moment** (deliberately NOT a third motion family — `14-the-social-desk.md` lines 31/57/89). Document the reuse explicitly; it's a tightness signal.
- **Document:** keyframe stills (rest → 0.92 overshoot peak → settle), the scale curve, the shadow opacity curve, the duration, "interruptible," and the "drag-drop reuses this" note.

### Moment 2 — "The minting / card moment" (celebrated #2)
- **The motion:** the card-mint shared-element transition — per `25-research` §2/§5, the riso direction = the mint gets **one soft-overshoot spring**; (the marker variant adds a one-shot shine/tilt, but the locked pole is the riso one-soft-overshoot). This is "the one earned flourish" (`the-story.md` §3/§7; `demo-video-plan.md` K8).
- **Document:** the name-card → drop sequence (draw → name like a trading card → drop with sit-shadow spring), the shared-element morph, the duration.

### The lockstep-slider wedge (the CLIMAX motion — document as its own spec block)
- **Not a "spring" — it's the headline interaction motion.** Moving `hachureGap` / `hachureAngle` restyles **2D AND 3D in lockstep**, the same 8 coverage bands quantizing both renderers ("one math, two renderers" — `the-story.md` §3). The orbit + the synchronized restyle is THE moment that wins Grand/Runner-Up.
- **Document:** the choreography in order (draw → flip 2D→3D → orbit → slider drag → both worlds restyle together → hold the orbit a beat longer than feels necessary), the timing of the orbit, and the fact that the restyle is *driven by the shared coverage table*, not two separate animations. This is the technical-truth caption.
- ⚠️ **STATUS:** the lockstep capture is BUILT (Rock 1, #30) but **NOT YET SHOT** — the single named video gap (`the-story.md` §7; `demo-video-plan.md` §14, K2). The motion spec can be authored from the built behavior now; the *clip* is captured at the 06-17 shoot. **Capture K2 first, clean, against the published URL.**

### The first-visit intro animation
- **The "stop-scrolling" hook on the live site** (`makeathon-rules-VERBATIM.md` §🎬; `demo-video-plan.md` §12). Produced in **Weave/Figma**.
- **Document:** what it shows (recommend: the wedge gesture as an ambient loop, or the wordmark assembling on warm paper grain), its trigger (first load of `/`), and that it mirrors the video cold-open. ⚠️ **STATUS: PLANNED** (Round 9 earmark per SESSION-HANDOFF) — if it slips, the cold-open wedge carries the hook alone. Spec it; flag it as planned.

### Chrome motion (the calm baseline — document briefly for contrast)
- Panel collapse **260ms ease-out**, no spring (`25-research` §2 table). Document one line so the spec shows the *discipline*: only the two celebrated moments get springs; everything else stays calm ≤300ms. The contrast IS the craft point.

## 2.3 How the motion spec ties into the video + the Community file

- **→ Community file (Artifact B):** the Motion Spec page is one section of the design-system file. It ships as part of the +5 Community share and is a craft signal a judge can read.
- **→ Video:** the motion spec frames become a **chapter card / b-roll** in the workflow segment (Shot 9, `demo-video-plan.md`) — "here's the spec for the moment you just saw." The lockstep-slider spec block backs the climax (Shot 8); the doodle-lands spec backs the minting beat (Shot 3 / K8).
- **→ Weave handoff:** the spec is the *brief* Weave/Figma work to (the title card, dividers, intro animation reference the documented timings). Spec first → assets second. (Don't let Weave output become the spec — §2.1.)
- **→ In-repo backup `.md`:** cite the REAL constants from source so the doc is true (e.g. `INFLATE_PRESSURE_INFLUENCE`, the spring config, the 0.92→1.0 scale, the 260ms collapse). ⚠️ Pull these from the actual code at authoring time — do not invent numbers. (This doc states the ratified *design* values from the locked research; the exact in-code constants must be read from source before publishing the backup .md.)

## 2.4 Build order for the motion docs (cheap → showcase)
1. **In-repo `.md` first** (30 min, Build-in-Public, honest source-of-truth) — list the 3 moments + intro + chrome baseline, pull real constants from source.
2. **Figma Motion Spec page** (the showcase) — built during the 06-16 identity pass alongside the swatch sheets (same Figma session, same tools), using Agent for layout assist (graphics-only). Capture keyframe stills from the running app (K8, K2) once shot.
3. **Video chapter card** — derived from the Figma page at the 06-17 edit.

---

## 3. Decisions for Sebs

- **+5 stacking — ASK THE HOST.** Don't assume two Community shares = +10. Plan to qualify + score on the *Make* share alone; do the design-file share as cheap upside + Community-Favorite/craft signal. (Confirm on Contra.)
- **Order of operations is fixed:** Make checkpoint #2 (full re-upload + smoke test) → publish Make to Community (gets live link + working-file link in one action) → THEN the design-system file → Community (06-16 identity pass) → THEN the motion spec rides inside that file.
- **Confirm Pro/Full-seat** is active (it is, per handoff) so the Make→Community publish path is unlocked.
- **Create a Figma Community profile** if you don't have one (needed for the file publish).
- **Motion docs:** Figma Motion Spec page = primary (rides the identity-pass Figma session); short in-repo `.md` = backup (real constants from source); Weave = assets, NOT the spec.
- **Capture K2 (the lockstep wedge) FIRST** at the shoot — it's both the video climax AND the motion-spec hero stills, and it's the one named gap.
- **Review the Make-side conversation/remix history** before publishing the Make project — it's shown to remixers and must not contradict the "authored locally, published live through Make" honesty line.

---

## 4. Sources

- **Binding rules (source of truth):** `makeathon-rules-VERBATIM.md` (§Submission requirements #3 = live + community/working link; §Scoring = +5 social, +5 Community; §Bonus; §🚀 publish/repo plan; §🎬 video/graphics; §⚖️ honesty guardrail; §🧩 custom engine).
- **Figma mechanics (cited, June 2026):**
  - Publish a functional prototype / web app to Community — https://help.figma.com/hc/en-us/articles/33652209702423-Publish-a-functional-prototype-or-web-app-to-the-Figma-Community
  - Publish files to Community — https://help.figma.com/hc/en-us/articles/360040035974-Publish-files-to-the-Figma-Community
  - Figma Make FAQs (public web URL = `*.figma.site`; AWS+Cloudflare; custom domains) — https://help.figma.com/hc/en-us/articles/31722591905559-Figma-Make-FAQs
  - Publish, update, or unpublish a Figma Make file — https://help.figma.com/hc/en-us/articles/31304586129559-Publish-update-or-unpublish-a-Figma-Make-file
  - Create a Community profile — https://help.figma.com/hc/en-us/articles/360038510833-Create-a-Community-profile
  - Community publishing permissions — https://help.figma.com/hc/en-us/articles/360041423614-Community-publishing-permissions
  - Manage a custom domain for your site — https://help.figma.com/hc/en-us/articles/31414274019863-Manage-a-custom-domain-for-your-site
- **Sibling submission docs (this doc operationalizes, does not duplicate):** `figma-suite-usage-plan.md` §6 (committed-artifacts table — Make / FigJam-diagram / MCP-Local / Weave / Agent), `the-story.md` §3/§5/§7/§8 (wedge / pipeline / story-holes / one-liners), `docs/design/demo-video-plan.md` §11 (K-scenes) + §12 (assembly + first-visit intro).
- **Motion-moment canon:** `docs/research/25-research-own-design-language.md` §2 (motion character + spring tuning per identity) + §5; `docs/knowledge/14-the-social-desk.md` (drop reuses doodle-lands; two-celebrated-moments law).
- **Honesty memory:** `feedback_research_first_no_fake_provenance`, `project_desk_doodles_local_is_canonical`, `project_desk_doodles_own_design_language`, `feedback_selective_brand_tagging`, `feedback_push_back_on_overadding`.
