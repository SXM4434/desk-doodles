---
name: desk-doodles-session-start
description: "When the session starts in or about Desk Doodles (~/Desktop/Projects/desk-doodles/), auto-read this repo's CLAUDE.md + SESSION-HANDOFF.md FIRST before any work. Do NOT read or write the portfolio repo's SESSION-HANDOFF.md for Desk Doodles state."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 934698c4-b8de-4796-855b-b4795d6de56a
---

When entering `~/Desktop/Projects/desk-doodles/` or any task framed as "Desk Doodles work," read in this order BEFORE doing anything else:

1. `~/Desktop/Projects/desk-doodles/CLAUDE.md`
2. `~/Desktop/Projects/desk-doodles/SESSION-HANDOFF.md`

**Do NOT route Desk Doodles state into `~/Desktop/Projects/portfolio/SESSION-HANDOFF.md`.** That repo is for portfolio system work (case studies, hero system, color, typography, etc.). Desk Doodles has its own handoff in its own repo as of 2026-06-09.

The two repos overlap in source-of-truth documentation: `09-LOCKED-MODEL.md`, `makeathon-plan.md`, etc. still live in portfolio under `portfolio-system-lab/docs/labs/hero/cells/F3-smart-hachure-system/`. Reference them in place; don't duplicate.

**Port-back from Desk Doodles → portfolio surfaces (Hero-8-Lab, visitor playground, other) is POST-MAKEATHON triage** (after 2026-06-18). Don't pre-plan port-back during the build; don't track it live. Sebs's framing: "once Desk Doodles is done we figure out what gets ported back to the portfolio."

**Why:** Desk Doodles is its own product with its own brand, public GitHub repo (https://github.com/SXM4434/desk-doodles), and post-makeathon standalone potential. Writing its session state into the portfolio handoff bloated the portfolio doc (1200+ lines) and conflated two product trails. Split established 2026-06-09 at Sebs's explicit request.

**How to apply:**

- Session opens with "desk doodles" / "deskdoodles" / referencing the makeathon / or cwd is `~/Desktop/Projects/desk-doodles/` → read this repo's CLAUDE.md + SESSION-HANDOFF.md first.
- Session opens with portfolio framing (case study, hero, color, typography) → read portfolio's CLAUDE.md + SESSION-HANDOFF.md per `[[portfolio-session-start]]`.
- When ambiguous (e.g. "should I work on the Smart Hachure stuff"), ask which surface — they share the lib, but the dev work happens in different repos.
- Smart Hachure changes that need to flow to Hero-8-Lab during the makeathon = note in conversation, leave port for post-makeathon.

Related memories:
- [[portfolio-session-start]] — the original portfolio auto-read rule (still applies to portfolio repo)
- [[desk-doodles-local-is-canonical]] — local repo is source of truth, Make is deployment
- [[desk-doodles-makeathon]] — the project memory
- [[save-to-memory-immediately]] — drove the immediate memory write
