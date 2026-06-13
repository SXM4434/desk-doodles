---
name: launch-gauntlet-fleet
description: Use when scaffolding a new "rock" (one unit of work) or a fleet of rocks for Desk Doodles — a build + own-battery + adversarial-verify + smash workflow with the LAWS block and rock structure baked in. Triggers on "launch a rock for X", "scaffold a gauntlet fleet", "build + verify X with agents", "spin up a verify fleet", "set up the build-test workflow for X". Bakes in file-ownership laning, the no-live-DB / commit-hygiene / visual-check laws, and the autofire-queue fallback for blocked work.
---

# Launch Gauntlet Fleet

Scaffold a new **rock** (one unit of work) or a wave of rocks following the Desk Doodles gauntlet (`docs/BUILD-TEST-FLOW.md`). A rock that can't pass its own battery does NOT report done. Output of this skill is a ready-to-launch agent prompt (or set of them), correctly laned and carrying the LAWS block verbatim.

## The rock structure (one unit of work)

```
BUILD → own BATTERY (per-item table, screenshots READ)
      → adversarial VERIFIER (independent, re-runs evidence, hostile)
      → [fix round if verify fails] → re-VERIFY
      → SMASH (hostile edge/break passes) → [blocker-fix round]
```

- **Build** reads the authoritative spec FIRST, then the real code it composes with. Never approximate from docs alone (`feedback_match_locked_labs`).
- **Own battery** = the builder proves its own work: enumerated edge cases, the FULL object set where the task says all, screenshots taken AND read, `tsc --noEmit` + `npm run build` green.
- **Adversarial verifier** = a SEPARATE agent told to assume the build lies; it re-runs evidence ITSELF (not the build's artifacts), producing its own screenshots/tables. Two prior "all PASS" claims fell to verifiers (byte-diff, angle-sampling) — this catch is why the step exists. Only spin verifier fleets for contested FACTS, never taste questions (`feedback_right_size_agent_fanouts`).
- **Smash** = hostile users hitting the new surface with weird sequences, double-actions, extremes, mid-action interrupts, degenerate inputs. Blockers get a fix round.

## The LAWS block — paste verbatim into every build/test agent prompt (adapt paths/ports)

```
LAWS:
- Never "just build": build + break-on-purpose + debug-with-real-data + edge-case enumeration + VISUAL check (screenshots taken AND read back), one unit, before reporting.
- Per-item tables. Use ALL 197 audit objects where the task says all — never sample-and-claim.
- NO live Supabase writes (no publish RPC / deletes / test rows; route-intercept only).
- Isolated preview to dodge HMR churn from concurrent fleets: vite build --outDir /tmp/<tag>-dist && vite preview --port <uniqueport>. Playwright browsers cached ~/Library/Caches/ms-playwright.
- tsc --noEmit AND npm run build green before done.
- Commit own files ONLY (never git add -A / git add src/ — concurrent fleets share the tree). If git index locked, wait + retry. Message ends with the Co-Authored-By line.
- Output is structured data for the orchestrator, not prose.
```

## Fleet orchestration (multi-rock waves)

1. **Lane by file-ownership.** Rocks touching the SAME files run SERIALLY; rocks on disjoint files run in PARALLEL. Check the collision map in `docs/PENDING-AUTOFIRE-QUEUE.md` (the "Active-edit zones" section) before assigning files.
2. **Collision rule.** NEVER launch a rock onto files a live fleet is editing. Sequence it or defer to the next wave. The current HOT zones (verify the queue for live state):
   - **Draw panel (HOT):** `DrawSurface` · `DrawPanel` · `toneMask` · `shadeFillLog` · `shapeFit` · `smartHachure/*`
   - **canvas3d (HOT):** `Stroke3DScene` · `hatchMaterial` · `materials3d` · `modeParams` · `rodAdornments` · `Canvas3DChrome` · `Canvas3DContext`
   - The headless engine/geometry gauntlets run anyway (they don't render); the **visual** render sweep waits while canvas3d is under edit.
3. **Commit hygiene.** Each rock commits ONLY its explicit files. A broad `git add` steals another rock's work — it has happened.
4. **Right-size.** Justify agent counts BEFORE launching. Past the ~16 concurrency cap new agents queue (fine), but "launch more" ≠ "more parallelism" once saturated.
5. **Model + autonomy.** All agents run on Opus (`model:'opus'` — Fable 5 suspended). Spin agents as work is found; auto-fire the next wave when a fleet lands and frees files/slots.

## Procedure to scaffold a rock

1. Name the rock + its single unit of work. Identify the authoritative SPEC doc and the real source files it composes with.
2. Determine file ownership → check the collision map → assign a lane (parallel vs serial). If its files are HOT, do NOT launch — add it to `docs/PENDING-AUTOFIRE-QUEUE.md` with blocker + trigger + fire-as priority.
3. Write the build prompt: spec-first, the explicit owned-file list, the enumerated battery (full object set where applicable), and the LAWS block verbatim.
4. Write the adversarial verifier prompt (separate agent, assume-the-build-lies, re-run evidence independently) for any contested-fact rock.
5. Pick a unique `/tmp/<tag>-dist` + port per concurrent rock to avoid preview/HMR collisions.
6. On landing: plain-language per-agent accounting to Sebs + verified state — never a silent "done" (`feedback_report_agent_outcomes`). Decisions that are genuinely Sebs's (rulings, eyeball calls, scope) come to main chat; clear-cut build/test/research is autonomous.

## Hard rules (the project LAWS)

- **NO live Supabase writes** anywhere in the workflow.
- **Conservative on deletes** — only remove CONFIRMED duplicates/wrong content; FLAG anything uncertain for Sebs rather than deleting.
- **Commit only files the rock touches** — never `git add -A`.
- **Blocked execution → record in `docs/PENDING-AUTOFIRE-QUEUE.md`** instead of forcing it.
- **Visual check is the verdict** — DOM counts and pixel-diff numbers are triage only.

## References
- `docs/BUILD-TEST-FLOW.md` — the canonical gauntlet (rock structure + LAWS block + fleet orchestration)
- `docs/PENDING-AUTOFIRE-QUEUE.md` — live collision map (HOT/CLEAN zones) + blocked-work queue
- `tools/3d/geometry-gauntlet.mjs` — example of a headless break+edge+gap gauntlet (sandboxed pathological inputs)
