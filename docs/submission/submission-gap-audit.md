# Submission Gap Audit — ConFigMakeathon

**Date:** 2026-06-12 (Day 12 of 14). **Deadline:** 2026-06-18 11:59 PM PDT. **Auditor:** read-only submission-readiness pass (no src edits, no live-DB writes, isolated preview only).

**Method (verifiable):**
- Isolated build + preview: `npx vite build --outDir /tmp/<tag>-dist` (exit 0, 2.11s) → `vite preview --port 5219` (HTTP 200). Screenshots of `/`, `/desk`, `/desks`, `/canvas` taken via the cached playwright the build fleet uses (`/tmp/dd-pp`) and **read** — all four routes render, **0 console errors** on each.
- Git facts read directly: `git status -sb`, `git log origin/main..HEAD`, `git show origin/main:README.md`.
- Official requirements cross-checked against `docs/design/submission-checklist.md` §1 (its citations: Contra guidelines + announcement, rendered 2026-06-11). No separate R-sibling requirements doc exists; the submission-checklist IS the authoritative requirements record in-repo.
- No live-DB writes performed; the live desk was observed read-only (loaded **25/120 doodles on "The Graphite Orchard"**, ●LIVE — confirms Supabase is NOT auto-paused right now).

---

## Official requirements (from submission-checklist.md §1, re-stated)

To qualify: (1) live project link + working file link, (2) main video (work + idea + workflow + design decisions; no published max length), (3) 30-second walkthrough video for the social post, (4) social post on IG/X/LinkedIn tagged `#ConfigMakeathon` + `@figma`, (5) built with Figma's suite (published Make site), (6) submit via the Contra entry form. Bonus +5 social share, +5 Figma Community share.

---

## DONE / MISSING / AT-RISK table

| Item | Status | Evidence | Owner | Effort |
|---|---|---|---|---|
| App builds clean | **DONE** | Isolated `vite build` exit 0, 2.11s; tsc clean per fleet handoffs | Claude | — |
| App runs, 4 routes render error-free | **DONE** | `/`, `/desk`, `/desks`, `/canvas` HTTP 200, 0 console errors, screenshots read | Claude | — |
| Live shared desk is real | **DONE (verified)** | `/desk` rendered 25 real doodles (hearts/mug/boat) + full chrome; `/desks` shows live mini-desk preview, 25/120, ●LIVE | — | — |
| Creation loop (draw→style→name→place→re-open) | **DONE (per handoffs; not re-flow-tested here)** | Rock A/B/F tasks #8–13, #40–63 completed; canvas chrome shows ~13 axes live | build fleet | — |
| 2D↔3D round-trip + Tier-2 toggles | **DONE-ish / mid-flight** | Rock X/Y/1/2 landed (tasks #26–59); env-tan fix landed today; 3D wired on /canvas honesty gate | build fleet | — |
| Supabase live DB up (not auto-paused) | **DONE today; AT-RISK for judging** | 25 doodles loaded live; keepalive Action committed to origin (`94a6a99`, daily 14:17 UTC cron) | — | see AT-RISK |
| Supabase keepalive workflow pushed + armed | **DONE** | `git show origin/main:.github/workflows/supabase-keepalive.yml` present with cron + workflow_dispatch | — | verify it has actually fired ≥once |
| index.html meta/OG/Twitter tags | **DONE (tags) / partial** | Title + description + og/twitter tags shipped (lines 6–24) | — | og:image URL still relative + absent (below) |
| **README publicly accurate** | **MISSING — STILL LIVE BUG** | **origin/main README says "In active dev (Day 5 of 14)".** Local README says "Day 12 of 14" but that fix is in 28 UNPUSHED commits — the public GitHub face is stale exactly as the handoff flagged | Sebs (push) / Claude | 2 min (push) |
| Local commits pushed to public GitHub | **MISSING** | `main...origin/main [ahead 28]` — all Day 11–12 work (3D, tier-2, shade-fill, README fix, identity, decision board) is local-only; Build-in-Public repo is 28 commits behind | Sebs (push go) | 5 min |
| **og-image.png (1200×630)** | **MISSING (on-plan deferral)** | `public/` has only `fonts/`; absent in build output; plan defers it to AFTER 06-16 identity pass | Sebs / Claude | 1–2 hr (design + export) |
| og:image absolute URL | **MISSING** | Tag is relative `/og-image.png`; OG scrapers need absolute `*.figma.site` origin — can't bake until final publish | Claude | 5 min (at publish) |
| **Live `*.figma.site` URL (final Make publish)** | **MISSING** | No published URL exists; checkpoint #2 was scheduled 06-13, final #3 on 06-17. Make's copy lacks the whole social spine (~47 files ≈ 5+ upload prompts) | Sebs (Make drag-drop) | 2–4 hr + risk |
| Figma Community working-file link | **MISSING** | Required deliverable; only created when the Make file is shared to Community (+5 bonus) | Sebs | 15 min (at submit) |
| **Main demo video** | **MISSING** | No footage on disk (only unrelated `passport_demo_corrected.mp4`); plan = shoot 06-17. Script skeleton exists (demo-video-plan.md) | Sebs (shoot/VO) | full day 06-17 |
| **30-second social-cut video** | **MISSING** | Derived from same takes; not shot. Required to qualify | Sebs | rides main shoot |
| Qualifying social post (`#ConfigMakeathon` + `@figma` + 30s video) | **MISSING** | The existing Day 8 Contra/social URL is a Build-in-Public post, NOT the qualifying entry post | Sebs | 06-18 |
| Contra entry form submitted | **MISSING** | Final submission not filed; due 06-18 with live URL + file link + videos | Sebs | 06-18, ≥3 hr early |
| Home page surfaces live-URL / submission framing | **MISSING (expected)** | Home footer says "BUILT IN PUBLIC · GITHUB.COM/SXM4434/DESK-DOODLES" only; no live link (URL doesn't exist until publish) | Claude | trivial (at publish) |
| Identity / own design language pass (M11) | **AT-RISK** | Scheduled 06-16; home already shows a warm-paper serif look but it's the scaffold per CLAUDE.md. og-image rides this | Sebs/Claude | 06-16 block |
| Figma Agent in workflow story | **AT-RISK (verify access)** | Innovative-Workflow positioning assumes Agent; beta needed pre-June-3 preregistration. Drop honestly if absent (Make+Weave+MCP still qualifies) | Sebs | verify |
| Tripo key + fal.ai credits (3D-hard path) | **AT-RISK** | Both Sebs-side, flagged open; 3D-hard is the "default 3D when available" (round 8). Cached-example fallback must ship with it | Sebs | by 06-14 |
| Make checkpoint #2 (interim) | **AT-RISK / likely slipped** | Was scheduled 06-13; ~47 changed files = 5+ prompts. No evidence it's been done; one-shot final upload on 06-17 is the named risk | Sebs | 2–4 hr |

---

## Notes on what's genuinely strong (don't re-litigate)

- The product is real and demoable today: live desk with 25 doodles, working chrome (~13 axes), gallery, canvas, 2D/3D — all error-free in the isolated preview, screenshots read.
- Build trail is exceptional for the $10k Build-in-Public award: dense commit narrative, `docs/` ≈ 68 files, `audit-runs/` golden labels, per-rock batteries with READ screenshots. **But it only counts if pushed** — see the 28-commit gap.
- Keepalive is real and on the public repo, which de-risks the "dead live demo at judging" failure mode — provided it has actually fired and the final URL is the published one.

---

## Sources

- `docs/design/submission-checklist.md` (official reqs §1, citations within) · `docs/design/demo-video-plan.md` · `README.md` + `git show origin/main:README.md` · `index.html` · `git status -sb` / `git log origin/main..HEAD` (2026-06-12) · isolated `vite build`+`preview` on :5219, 4 screenshots read · `.github/workflows/supabase-keepalive.yml` on origin · `public/` listing (no og-image) · live `/desk` read-only observation (25/120, no DB writes).
