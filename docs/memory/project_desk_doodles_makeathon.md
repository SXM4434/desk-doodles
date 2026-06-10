---
name: desk-doodles-makeathon
description: "Desk Doodles = makeathon submission, 2026-06-19 deadline (15 days from 2026-06-04). New Vite app at apps/Desk-Doodles/. Multi-mode canvas (image upload → SVG → 3D, draw, all bi-directional, backend-cached). Smart Hachure is ONE shading sub-system within SVG mode. Free Stroke engine for draw→3D. Tripo cloud AI for complex upload→3D. Dev happens here; manual upload to Figma Make for submission."
metadata: 
  node_type: memory
  type: project
  originSessionId: 280032a1-475d-4acd-83ea-e9c6f3003e23
---

**The project:** Desk Doodles — multi-mode canvas web app submitted to the **ConFigMakeathon on Contra** ($100k in prizes for ideas built in Figma). Solo entries ALLOWED — not FigBuild 2026, different event. Rules page: https://contra.com/community/topic/configmakeathon/guidelines (JS-rendered SPA; requires Contra account to read substantively). User draws or uploads (image/SVG); app converts between modes (SVG ↔ 3D) and applies styling. Cached in Supabase backend so canvas mode-flip doesn't re-generate.

**Deadline:** **2026-06-18 at 11:59 PM PDT.** Confirmed from guidelines 2026-06-04. **14 days from 2026-06-04**, not 15. Winners announced June 23 at Config. MVP-ruthless triage required.

**Submission deliverables (all required):** live `*.figma.site` link + Figma Community-shared Make file link + main demo video + 30-sec social walkthrough video + social post on Instagram/X/LinkedIn tagged `#ConfigMakeathon` + `@figma`. Bonus 5 pts for social + 5 pts for Community share. Judging: 4 categories × 5 pts each.

**Prize structure ($100k):** $50k Grand · $15k Runner-Up · $10k Innovative Workflow · $10k Building with Purpose · $10k Build-in-Public · $5k Community Favorite. Multi-prize pursuit is realistic: Innovative Workflow + Build-in-Public + Grand all align with the work already produced.

**Free resources for participants:** Figma Pro w/ 3k AI credits + Figma Weave w/ 1.5k AI credits (for image/video assets). Access via Contra confirmation email — claim BEFORE Day 1. Figma Agent beta if preregistered before June 3 5pm PST — Sebs verify.

**Local codebase mode (Figma Beta):** Sebs is on the waitlist as of 2026-06-04. If activated, switches workflow from manual paste-back checkpoints to continuous local↔Make sync. Daily check for access-granted email.

**Why:** Makeathon submission + showcases Sebs's intelligent shading system + leverages his Free Stroke 2D→3D engine (flagship grad-school candidate) for double-duty visibility.

**How to apply:**

- **Dev surface (RELOCATED 2026-06-07):** standalone Vite app at `~/Desktop/Projects/desk-doodles/`. **NOT inside portfolio-system-lab** (moved out 2026-06-07 — original plan had it under `portfolio-system-lab/apps/` but Sebs flagged: Desk Doodles is its own product with public-canvas MVP + own brand + potential post-makeathon standalone life + needs its own public GitHub repo for Build-in-Public). Forked from Hero-8-Lab per `feedback_fork_a_lab_means_port_everything` — bulk port of chrome + contexts + smartHachure lib + hand-feel primitives + F3-B test pins. Hero-specific stripping happens Day 6, not during fork.
- **Upload to Make:** GitHub→Make is one-way pull, Make→GitHub is auto push. So: Sebs uploads Desk Doodles folder to Make at checkpoints (Days 7, 12, 13, 14), Make AI used only for last-mile Make-specific tuning, dev work happens here against locked discipline. Save Sebs's Make AI credit limits.
- **Hero-8-Lab decoupled:** since Desk Doodles relocated out of `portfolio-system-lab/apps/`, the planned Vite path alias `@smart-hachure` back to portfolio is moot — Smart Hachure was duplicated via the fork. Future bidirectional work needs explicit syncing (post-makeathon).
- **Design system:** portfolio language (W1/W1-D + ISe ladder + locked spacing). Don't invent new design system mid-makeathon. Treats the makeathon submission as a portfolio extension.

**App architecture (locked direction):**

```
INPUT (Draw / Upload SVG / Upload image)
  ↓
Conversion (cached in Supabase by content hash)
  ↓
┌────────────────────┬────────────────────┐
│ SVG CANVAS MODE    │ 3D CANVAS MODE     │
│                    │                    │
│ 11 SVG styles:     │ 3D-specific:       │
│  - Clean           │  - Lighting        │
│  - Outline only    │  - Material        │
│  - Wireframe       │  - Camera          │
│  - Rough handdrawn │  - Interaction     │
│    (Smart Hachure  │    pattern         │
│    applies)        │    spectrum        │
│  - Sketchy         │  - Physics (rapier)│
│  - Bold ink        │  - Preset library  │
│  - Wet ink         │                    │
│  - Stipple         │  + SVG sub-option: │
│  - Charcoal        │    apply SVG style │
│  - Risograph       │    to 3D surfaces  │
│  - Newsprint       │                    │
└────────────────────┴────────────────────┘
```

Smart Hachure = the SHADING sub-system inside SVG mode. Applies to the 8 shading-capable styles. Does NOT apply to Clean / Outline only / Wireframe.

**3D pipeline split by input source:**
- Draw → Free Stroke engine (Rod / Extrude / Solid / Inflate, user picks). Port engine lib/ from `SXM4434/free-stroke` GitHub.
- Simple SVG silhouette → Free Stroke Solid mode.
- Complex SVG (multi-element) → Tripo cloud AI (key needs rotation before Make submission).
- Raster image → autotrace → SVG → either path; OR direct Tripo.
- Portfolio's own pins → asset-prep pipeline (separate, NOT makeathon scope).

**Feature scope (still triaging — see `makeathon-plan.md`):**
- MVP: Draw + 2D Smart Hachure (≥1 fillStyle) + 3D via Free Stroke + canvas mode-flip + basic Supabase caching + **public canvas (anonymous session ID, no auth UI, all saved drawings/conversions land on a shared global feed others browse — restored as MVP 2026-06-05, was Sebs's original idea)**
- Stretch: image upload, all 7 fillStyles, all Style registers, physics presets, ML object-analysis, Tripo, **private canvas (real auth required to be meaningful — Stretch S9)**, override store JSON export

**Canvas tier history (2026-06-05):** Plan briefly drifted to "private MVP, public stretch" framing. Sebs flagged: anonymous private = localStorage-only = blank every session = pointless; real private needs auth machinery. Flipped back to public-MVP (original intent + structurally simpler + better demo for Build-in-Public + Community Favorite prizes).

**Locked principles (from `09-LOCKED-MODEL.md` and feedback memories):**
- User's fillStyle + Style dropdowns are SACRED (I-1)
- Source darkness owns per-region perceptual identity (I-2) — TAM-nesting (Praun 2001) enforces
- All ~13 sliders stay; 6+ ticks each; bias within band (I-3)
- 6-axis tuple `(gap, weight, layers, pressure, color, opacity)`
- Cross-axis interconnection matrix is foundation of intelligent layer (I-11 — added 2026-06-04)
- Every Style and every fillStyle gets its own research doc

**Anti-drift watch (per `feedback_smart_hachure_drift_pattern`):** never propose shipping less than what was agreed. Never collapse user-facing dropdowns into "internally same." Never defer agreed-upon axes/registers.

Related memories:
- [[smart-hachure-locked-model]] — the contract that drives Smart Hachure inside Desk Doodles
- [[smart-hachure-drift-pattern]] — anti-drift discipline
- [[free-stroke]] — the 3D engine project (flagship grad-school candidate)
- [[more-toggle-options-better]] — slider count + granularity
- [[ground-up-means-concept-not-just-layout]]
- [[fork-a-lab-means-port-everything]] — fork rules
- [[research-first-no-fake-provenance]]
