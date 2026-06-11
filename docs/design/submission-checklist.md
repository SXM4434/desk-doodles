# Submission + Positioning Checklist — ConFigMakeathon

**Date:** 2026-06-11 (Day 10). **Deadline:** 2026-06-18 11:59 PM PDT. **Scope:** docs-only Rock M deliverable — verified official requirements + repo readiness audit + judge-ready positioning + countdown. No src edits (two fleets active in src/).

---

## 1. Official requirements (re-verified 2026-06-11 against the live guidelines)

**Source of truth:** Contra guidelines page — https://contra.com/community/topic/configmakeathon/guidelines (JS SPA; content retrieved 2026-06-11 via rendering proxy, same method as the Suzanne brief). Internal §1.3 of `makeathon-plan.md` (confirmed 06-04) matches on every point re-checked today.

### Required to qualify (all of these)
1. **Link(s) to your project** — "live project link and community or working project file link" (= the published `*.figma.site` URL + the Make file shared to Figma Community).
2. **Main video** — "a video walking through the work and the idea behind it, sharing the problem you are solving" + "the workflow used to bring the idea to life." **No official max length is published** — our ≤5-min target is an internal convention, not a rule.
3. **30-second project walkthrough video** for the social post — "talks about your project, your process and the tools you used." Voiceover or screen-recording is fine.
4. **Social post** on Instagram / X / LinkedIn tagged `#ConfigMakeathon` + `@figma`, with 1–2 sentences on creation + tools. "Required to qualify for the prize pool."
5. **Built with Figma's suite** — "must be made using Figma's suite of products (Figma Make, MCP, agent, etc.)". Published surface = the Make site (our plan already locks this).
6. **Submit via the Contra platform** (entry form; it prompts for social links after submission).

### Scoring + prizes (guidelines page, confirmed)
- 4 judging categories × 5 pts: **quality of work** (design/build/impact/craft) · **quality of idea** (solves a real problem) · **quality of video** (workflow + design decisions + emulatable process) · **novel/innovative Figma use** ("across Make, MCP, Local, Weave, design agent, etc."). Bonus: **+5 social share**, **+5 Figma Community share**. Max 30.
- **$50k Grand · $15k Runner-Up · $10k Innovative Workflow · $10k Building with Purpose · $10k Build-in-Public · $5k Community Favorite** ($100k total). Targeting strategy unchanged (plan §1.5: don't target Building-with-Purpose).
- Teams ≤ 2; solo fine; only the submitter receives winnings.

### Honesty notes (what is NOT cleanly findable)
- **Timezone discrepancy:** guidelines render says **11:59pm PDT**; the Contra announcement post says "June 18th at 11:59pm PST". Treat **PDT as binding** (it's the earlier wall-clock moment; June California = PDT anyway).
- The **terms page** (https://contra.com/figma-hackathon-terms) is boilerplate from an earlier Figma hackathon — it still says "March 2nd, 2026" deadline. Its eligibility/IP terms (18+, OFAC-country exclusions, you keep IP but grant a perpetual promo license, "significant portions… developed during the Hackathon", "predominantly created using Figma's products and leverage Figma Make") are the best public signal but are **not confirmed verbatim for this edition**.
- **Winners announced June 23 at Config** — internal plan §1.1 claim (confirmed 06-04); not re-verified today.
- No published rubric weighting beyond the flat 5-pts-per-category; no published AI-usage policy.
- **The "Contra URL ✅" (Day 8-9) is a Build-in-Public social post, not the entry.** The final Contra submission form + the qualifying social post **with the 30-sec video** are still owed on 06-18.

---

## 2. Repo readiness audit (read-only, 2026-06-11)

### README.md — STALE, judges + Build-in-Public judges see this first
- Says **"Day 5 of 14"** (it's Day 10). Pitch paragraph predates the locked wedge — no "hand survives the round-trip" line, no three-pole framing, no `/desk` social system, no screenshots/GIF, no live-demo link slot. Stack list is accurate. Fix before submission (cheap, high-leverage for the $10k Build-in-Public award: "most generous documentation of process").
- Build trail itself is strong: 15+ well-written commits with real engineering narrative (`git log`), `docs/` = 68 files, `audit-runs/` golden labels v1/v2 — already public.

### index.html — meta DONE, og-image MISSING
- Title/description/OG/Twitter tags shipped (lines 6–24). Two open items:
  1. **`/public/og-image.png` (1200×630) does not exist** (`public/` contains only `fonts/`). Tag at line 18 points at it.
  2. **`og:image` is a relative URL** — scrapers expect an absolute URL (the Open Graph spec's examples are all absolute: https://ogp.me/). Needs the final published `*.figma.site` origin baked in at submission time, or accept broken share previews.

### Make checkpoint #2 — what changed since checkpoint #1 (commit `e6c7889`, 34 files)
- **~46–47 Make-relevant files** changed/new since the checkpoint: 42 committed (12 M + 30 A under `src/` + `index.html` + `package.json` + `vite.config.ts`) **plus** uncommitted: 13 modified + 4 brand-new untracked (`canvas3d/Stroke3DScene.tsx`, `canvas3d/index.ts`, `geometry3d/strokeTo3d.ts`, `lib/deskCraft.ts`).
- **New npm deps Make must install:** `dompurify@^3.4.9` + `@types/dompurify@^3.0.5` (package.json must be in the drop set; package-lock.json is repo-only — Make installs from public npm, plan §1.2).
- **The whole social spine is post-checkpoint-#1:** DeskPage, DeskGallery, DrawPanel, DrawSurface, ObjectCard, ObjectSurface, publish.ts, supabase.ts, session.ts, svgUpload.ts, deskNames.ts, deskCraft.ts, patchRoughDots.ts, chromeStyles.ts, CollapsiblePanel.tsx, routes (`/desk`, `/desks`) — Make's copy currently has NONE of the real product.
- **Repo-only, never in the drag-drop set:** `docs/` (68), `audit-runs/`, `tools/`, `test-fixtures/`, `supabase/*.sql` (pasted into Supabase dashboard, not Make), `.github/workflows/supabase-keepalive.yml`, CLAUDE.md, SESSION-HANDOFF.md, package-lock.json.
- **Prerequisites before checkpoint #2** (handoff consolidation order): ① commit the 2+ day tree (Sebs go — gate) · ② delete/drag-persist RPC fix live (verify `schema-v3-rls.sql` actually pasted; D′ implies yes, handoff line 94 was pre-fix) · ③ tsc + build clean · ④ keepalive workflow committed+pushed (currently inert, untracked).
- **Friction math:** Make accepts ≤10 files per prompt (plan §1.2) → ~47 files ≈ 5+ upload prompts. One late checkpoint = high risk.

### Supabase/infra state relevant to judging
- schema-v2 pasted (multi-desk live, cap 120); keepalive = GitHub Action daily cron (replaces M10 Edge Function) — **does nothing until pushed**; Supabase auto-pauses after 7 idle days (risk R4: dead live demo at judging).

---

## 3. Positioning one-pager (condensed from research 23 §2 + 21 §13 + landscape addendum)

### The three-pole map (the field, one glance)
| Pole | Who | What they optimize | What they do to your hand |
|---|---|---|---|
| **Fidelity-to-intent** | Suzanne (suzanne3d.studio, v1.0 May 2026) | "What did you mean?" → clean editable parametric CAD (OpenSCAD/STEP), print-ready | Asks you to sanitize it — "closed outlines and clear silhouettes reconstruct best" |
| **Fidelity-to-mesh** | Tripo · Meshy · Rodin · TRELLIS | Accurate generic 3D assets; stylization is texture-stage only | Strips it — clean mesh, signature gone |
| **Fidelity-to-the-hand** | **UNOCCUPIED → Desk Doodles** | The mark grammar itself — wobble, pressure, stroke character — as first-class transport 2D↔3D | Keeps it, both directions |

### The one-paragraph pitch
Designers sketch at their desks constantly — there's no shared space that makes that habit social and visible. Desk Doodles is a live shared desk: draw the little things around you, and the app treats your hand's character — wobble, pressure, stroke grammar — as the material, not noise. It restyles your marks parametrically (hatching, stipple, charcoal: ~13 live axes, not a stamped filter), flips the same drawing between 2D and 3D with the mark family intact on both sides, and drops it onto a public desk next to everyone else's. Every shipping sketch-to-3D tool optimizes fidelity-to-intent (Suzanne: clean printable CAD) or fidelity-to-mesh (Tripo/TRELLIS: clean textured assets) — both strip the hand. Desk Doodles owns the third pole: **the user's hand survives the round-trip. Sketch in, sketch out, signature intact.**

### The 3 demo beats (video spine, maps to all 4 judging categories)
1. **The hand survives the round-trip** (quality of work + idea). Draw a mug → restyle live across the 13 axes → flip to 3D → the 3D renders in the same mark family. Contrast line: *"Other tools want your drawing sanitized; Desk Doodles wants your hand."* / *"Suzanne answers 'what did you mean?' — Desk Doodles answers 'how did you draw it?'"*
2. **The smart pipeline** (novel Figma use + work). The doodle is analyzed → routed to the right treatment per region per source (Smart Hachure classifier; vision-LLM router on the 3D-hard path — 21-research found **no production precedent** for a vision-LLM pre-step routing to 3D generators). Show the engine making a decision, not a filter being applied.
3. **The shared desk** (community favorite + idea). Publish → it lands on the live public desk; someone else's doodle arrives in realtime; desks fill, hit cap, spawn the next one; `/desks` is a wall of walls. The stop-scrolling moment.

**Video must also show the workflow** (judging category 3 is explicitly about emulatable process): local Vite ↔ Make checkpoints, the `/audit` regression+training surface, build-in-public docs trail — plus Weave/Agent assets for the Innovative-Workflow multi-tool story (plan §1.5).

---

## 4. Countdown 06-12 → 06-18 (hard gates bolded; sequence per RE-BASELINE D/D′)

| Day | Work | Hard gates |
|---|---|---|
| **06-12** | Finish social slice (pan/zoom · Sandbox live-controls · smalls) · wire geometry3d into /canvas honesty gate | **COMMIT GATE** (Sebs go — tree is 2+ days deep) · **keepalive push** (inert until pushed; 7-day pause clock is running) |
| **06-13** | M7 round-trip core: bi-directional SVG↔3D flip + cached intermediate | **Make checkpoint #2 (interim)** after commit + clean build — don't let 06-17 be the first upload of the real product (~47 files ≈ 5+ prompts) |
| **06-14** | M8 SVG-style→3D port (EdgesGeometry → screen-space hachure) — the headline | **Sebs-side: Tripo key rotated + fal.ai credits loaded by EOD** (plan §E: "before 06-15"; both still open per CLAUDE.md) |
| **06-15** | 3D-hard path: vision-LLM router → Tripo/TRELLIS-via-fal · identity Layer 1 · desk craft | **Cached-example fallback ships WITH the hard path** (external API failure can't kill the demo moment — plan Day 06-15) |
| **06-16** | M11 own design+motion language pass · absorb slip · **og-image 1200×630 made AFTER this pass** (it should carry the final identity, not the scaffold) | **FEATURE FREEZE at EOD** — video shoots against whatever exists now |
| **06-17** | Demo video: script AM, shoot, edit main + 30-sec cut (Weave assets) · README refresh (§2 fixes) · **final Make checkpoint #3** | **Test on the PUBLISHED `*.figma.site` URL, not preview** · **keepalive verified fired** · og:image absolute URL baked + share-preview tested |
| **06-18** | **SUBMISSION ONLY — no build work.** Contra entry form (live URL + Community file link + videos) · share Make file to Figma Community (+5 pts) · social post `#ConfigMakeathon` + `@figma` with 30-sec video (+5 pts; per `feedback_selective_brand_tagging` this final post is a sanctioned @figma tag) | **Everything filed ≥3 hours before 11:59 PM PDT** (treat PDT as binding, §1 note) |

Slip rule (from the plan's video-timing note): if 3D-hard slips, the video shoots against easy-path round-trip + social desk — still a complete story. The video is the biggest single Grand-Prize factor; it never gets sacrificed for one more feature.

---

## 5. Sebs decisions flagged

1. **Interim Make checkpoint on 06-13** (recommended above) vs. single final checkpoint 06-17 — the plan only schedules the final one; ~47 changed files makes one-shot risky.
2. **README refresh copy** — needs his voice pass (it's the public Build-in-Public face); draft from §3 pitch.
3. **og-image art direction** — after M11 pass (recommended, carries the real identity) vs. scaffold version now as insurance.
4. **Main-video length** — no official max exists (§1); lock our ≤5-min target or go shorter (3 min is the hackathon norm, but that's taste, not rule).
5. **Figma Agent access** — Innovative-Workflow positioning assumes Agent usage, but Agent beta required preregistration before June 3 5pm PST (plan §1.3). Verify access; if absent, drop Agent from the workflow story honestly (Make + Weave + MCP still qualifies as multi-tool).
6. **Sebs-side gates he alone can clear:** Tripo key rotation + fal credits by 06-14 EOD · commit go on 06-12 · confirm `schema-v3-rls.sql` pasted · daily Make local-codebase beta email check.
7. **Confirm the existing Contra URL's role** — it satisfies build-in-public presence, NOT the qualifying social post (which needs the 30-sec video + @figma tag on 06-18).

---

**Sources:** Contra guidelines (rendered 2026-06-11): https://contra.com/community/topic/configmakeathon/guidelines · Contra announcement: https://contra.com/community/Pq6S4yhl-the-figma-x-contra-config-makeathon · Terms (stale edition, flagged §1): https://contra.com/figma-hackathon-terms · Open Graph spec: https://ogp.me/ · Internal: `makeathon-plan.md` §1.3–1.5 + RE-BASELINE/D′ · `docs/research/23-brief-suzanne3d.md` §2 · `docs/research/21-research-3d-pipeline-and-style-translation.md` §13 + landscape addendum · `git log`/`git status` 2026-06-11.
