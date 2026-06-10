---
name: project-desk-doodles-local-is-canonical
description: "Desk Doodles workflow rule — local ~/Desktop/Projects/desk-doodles/ + github.com/SXM4434/desk-doodles is source of truth. Make is deployment artifact, NOT pushed back to GitHub. Manually port Make-AI auto-edits back to local."
metadata: 
  node_type: memory
  type: project
  originSessionId: 287a83f0-0fdf-4ed6-a8c0-31db25f03667
---

**Rule:** Local repo at `~/Desktop/Projects/desk-doodles/` (synced to `github.com/SXM4434/desk-doodles`) is the canonical source of truth for Desk Doodles. The Figma Make file is purely a deployment artifact + working file for Community share — NOT pushed back to GitHub.

**Why:** Decided 2026-06-07. Sebs flagged the workflow conflict: Make can push to GitHub, but using that feature would overwrite the carefully-built local commit history with Make's post-AI-edited state. For Build-in-Public, the clean local commit trail ("Day 5 fork from Hero-8-Lab", "Day 7 SVG mode wired", "Day 11 cannon-es physics") IS the artifact judges browse. Letting Make push back would mud that.

**How to apply:**

1. **Never tap Make's "Connect to GitHub" / "Push to GitHub" feature** for this repo. It's off-limits for the duration of the makeathon.
2. **All development happens in local Vite** (`~/Desktop/Projects/desk-doodles/`). Commits + pushes flow from local → `origin/main`.
3. **Make uploads are one-way** (local → Make, manual paste-back at Days 7/12/13/14 checkpoints). Make is the deployment target.
4. **After each Make session:** if Make AI auto-fixed something (e.g., the tw-animate-css resolver fix from the Rapier smoke test), manually copy the fix back to local + commit. Otherwise local will drift behind Make.
5. **Submission deliverables don't require GitHub:**
   - Live URL = `*.figma.site` (Make-deployed)
   - Working file link = Make file shared to Figma Community
   - GitHub is purely the Build-in-Public process trail + docs
6. **If Make local-codebase beta lands (Action #53):** revisit this rule. Continuous sync changes the calculus — local and Make become effectively the same artifact in real-time. Probably still keep `main` as the source-of-truth branch.

**Optional escalation if needed later:** Branch split — `main` = local clean dev, `submission` = Make-pushed state. Defer unless something forces it.

Related: [[feedback_selective_brand_tagging]], [[project_desk_doodles_makeathon]]
