# Desk Doodles — Skills Index

Reusable playbooks for the workflows that recur in this project. Each skill is a directory under [`../.claude/skills/`](../.claude/skills/) with a `SKILL.md` (YAML frontmatter + instruction body) and auto-loads when its trigger phrases appear. They encode the gauntlet ([`BUILD-TEST-FLOW.md`](BUILD-TEST-FLOW.md)) and the project LAWS (no live-DB writes · commit-only-what-you-touch · conservative deletes · visual check is the verdict · blocked work goes to the autofire queue) so they don't have to be re-derived each time.

## Skills

| Skill | What it does |
|---|---|
| [run-audit-sweep](../.claude/skills/run-audit-sweep/SKILL.md) | Drive the `/audit` 197-shape catalog across a style/geometry-mode matrix, pixel-analyze headless, build contact sheets, READ them back, and flag failures — never sample-and-claim. |
| [regression-check](../.claude/skills/regression-check/SKILL.md) | The baseline→change→re-screenshot→diff ritual that gates "fixed," plus the mandatory golden-diff gate for classifier/coverage changes. |
| [launch-gauntlet-fleet](../.claude/skills/launch-gauntlet-fleet/SKILL.md) | Scaffold a new rock (build + own-battery + adversarial-verify + smash) or a laned fleet, with the LAWS block and file-ownership collision rules baked in. |
| [make-checkpoint-prep](../.claude/skills/make-checkpoint-prep/SKILL.md) | Assemble the clean Make-importable file list, re-check each file against Make's constraints, and write the ≤10-file upload/routing prompt set. |

## How they relate

- **launch-gauntlet-fleet** is the meta-skill — it scaffolds the units of work the other skills run inside.
- **run-audit-sweep** and **regression-check** are the proof engines a rock's battery invokes (sweep = breadth across the catalog; regression = depth on a specific change + the golden gate).
- **make-checkpoint-prep** is the deployment hand-off — it runs once the build/test rocks have landed and the tree is clean, producing the upload set for the live submission URL.

_Living index — add a row here (and a `<name>/SKILL.md`) when a new recurring workflow earns a skill. Linked from the master guide: [`README.md`](README.md) → Skills._
