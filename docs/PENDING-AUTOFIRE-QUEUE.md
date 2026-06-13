# Pending Auto-Fire Queue

**Purpose (Sebs 2026-06-13):** work that's blocked on something currently running, tracked here so it LAUNCHES the moment its blocker clears — no waiting to be told. Claude checks this queue on every fleet-landing notification and auto-fires whatever is now unblocked (per `feedback_spin_agents_autonomously`). Collision rule: never fire onto files a live fleet is editing.

## Active-edit zones (the collision map — update as fleets land)
- **Draw panel (HOT):** DrawSurface.tsx · DrawPanel.tsx · toneMask.ts · shadeFillLog.ts · shapeFit.ts · smartHachure/* — owned by the relaunch fleet (F2/F3).
- **canvas3d (HOT):** Stroke3DScene · hatchMaterial · materials3d · modeParams · rodAdornments · Canvas3DChrome · Canvas3DContext — owned by the relaunch fleet (Hatch/Native gap cells).
- **CLEAN:** DeskPage · DeskGallery · ObjectSurface · DrawerPanel · DeskDoodlesHome · publish.ts · typography · index.html · public/ · docs/* (except in-flight submission docs) · tools/*.

## Queue (item · blocker · trigger · fire-as)
| # | Item | Blocked on | Trigger to fire | Priority |
|---|---|---|---|---|
| P1 | **Make-importability re-check + checkpoint-#2 prep** (clean file list + upload/routing prompt) — gates the REQUIRED live URL + working-file link | canvas3d + shade-fill settling | relaunch fleet `wf_633c5c80` lands | **HIGH** |
| P2 | **Visual 3D render sweep** — ALL 197 × geometry modes (rod/extrude/inflate/solid) rendered + screenshots READ + auto-flag | canvas3d HOT | relaunch fleet lands | HIGH |
| P3 | **Draw-loop gauntlet** — full draw→name→place→reopen→re-draw→save, all 197 where applicable, visual | draw panel HOT | relaunch fleet lands | HIGH |
| P4 | **2D↔3D flip integration on a PLACED desk object** (the demo climax; desk has 0 3D objects today) — needs real-stroke injection hook | canvas3d + draw panel HOT | relaunch fleet lands | HIGH |
| P5 | **SA-2 tone-never-vanishes** (sketchy/clean fall back to flat grey wash, never nothing) + **SA-3 FX-style gate lift** (wet-ink/charcoal/riso/newsprint onto the smart path) | toneMask/smartHachure/DrawSurface HOT | relaunch fleet lands | MED |
| P6 | **README voice/accuracy pass** (draw from THE-STORY; fix public "Day 5 of 14") | THE-STORY synthesis | story fleet `wf_d0726d05` lands | MED |
| P7 | **Project-file cleanup EXECUTION** (the merges/deletes the housekeeping plan flags safe) | the cleanup PLAN + in-flight submission docs finishing | housekeeping fleet + submission fleets land | MED |
| P8 | **Visual smash of Hatch grammar + Native dials at scale** (beyond the gap-cells own battery) | canvas3d HOT | relaunch fleet lands | MED |
| P10 | **Capture KEY SCENES (Claude records via playwright)** — the lockstep-slider wedge (Grand/Runner-Up linchpin, built-not-filmed), draw→Sketch\|Style flip, 2D→3D flip + orbit, region-fill, shading, live social desk. Clean local recordings cut to the video beats → Sebs assembles in Figma/Weave | canvas3d + draw panel HOT (would film a mid-edit state) | relaunch fleet `wf_633c5c80` lands (capture locally; re-capture on published Make URL if it differs) | **HIGH** |
| P9 | **Figma Agent reintegration** — Agent CONFIRMED (Sebs has beta); thread it back as the 5th suite tool across narrative docs (the-story · social-post-draft · demo-video-plan · README · makeathon-rules-VERBATIM framing) + ensure we actually USE Agent on a real asset (Community file / intro graphic / video) so the claim is true | housekeeping/story fleets editing docs | housekeeping fleet `wf_d63505a1` lands | HIGH |

| P11 | **Conversion/shading FIDELITY audit + fix** — Sebs flagged (2026-06-13) that clean→hand-drawn conversion + "regions that should shade aren't shading" had issues all day. Definitively catalog EVERY shape×style that converts/shades WRONG, classify each as real-engine-BUG vs by-design vs not-built-input-tool, FIX the bugs (don't let them hide under "shading system not done"). Already-fixed today: wash flood, outline-only blank posters, riso flood — confirm + go beyond | SvgStyleTransform.tsx HOT (render-bug fix `w7dt2ducr` in flight) | render-bug-fix fleet lands | **HIGH** |

| P12 | **Outline-only blank-poster fix is BROKEN** (fidelity catalog caught it): the synthesis at SvgStyleTransform.tsx:2455 reads the POST-CSS computed fill (already forced transparent) → skips every rect, so posters still blank under Outline-only. Fix = read the SOURCE fill, not computed. | SvgStyleTransform.tsx HOT (render-bug fleet `w7dt2ducr` may still be on it — check if it self-caught in verify first) | render-bug fleet lands; if still broken, fire correction | HIGH |

| P13 | **Wire the 92.7% learned classifier LIVE** (the ML layer goes into production) — add learnedProvider to the chain `[ruleEngineProvider, learnedProvider]` (index.ts:194). Model committed 05a8428 (92.7% vs 77.5% rule baseline, no leak). 2-step recipe in tools/ml/README.md. | classifier.ts/index.ts cold (render fix + audit in them) AND golden v3 re-blessed (Sebs) AND a regression check | classifier free + golden v3 blessed | **HIGH** |
| P14 | **Render-survival follow-up fixes** — whatever the hostile-SVG battery (in-flight `wf_28d6d942`) flags: O(n²) sibling pass element cap (H5), `<use>`/`<symbol>` dropped (H7), any crash/hang on torture SVG (H4). | SvgStyleTransform hot | render fleet/audit free + battery results | MED |
| P15 | **Populated-desk perf gate** — the populated-desk battery (in-flight) measures fps@80/120; if it confirms the ~1fps@120 cliff, the per-object memoization fix is required before the "wall of doodles" demo. | DeskPage | battery results land | MED-HIGH |
| — | _In-flight via wf_28d6d942: feed unfed collectors (shadeFillLog/shapeSnapLog — keep-feeding), build the two batteries above, commit+ingest GAP-HUNT. Full gap list: docs/submission/GAP-HUNT.md._ |  |  |  |

| P-FINAL | **RECHECK EVERYTHING (the closing gate for Round 8)** — after ALL fix fleets land + the tree settles, re-run the FULL exhaustive audit (197×11 SVG + 3D + toggles low/mid/high vs Clean) on the COMBINED final state, READ every sheet myself. The interim audits ran against a mid-fix tree; this verifies the fixes didn't break each other. This is the gate before golden v3 bless → ML wiring → any push. Sebs: "sounds like you need to recheck everything again." | ALL fix fleets in flight (render-redo, dark-blob, audit, gap-fixes, scaffold) | last fix fleet lands + tree clean | **HIGH** |

> **GATING RULE (Sebs 2026-06-13): build only when it can be ran.** Before firing ANY queued item, check its target files are COLD (git status + /tmp/dd-watchdog.log zone map). If hot → it stays queued, auto-fires when free. No build into a hot file, ever. The watchdog is the early-warning; the main loop is the gate.

## Git hygiene (do before any push, when fleets quiet)
- **Consolidate branch:** all session work is linear on `og-image-baseline` (a stray branch from the og-image rock); `main` is stuck at f6bf608. FF it: `git checkout main && git merge --ff-only og-image-baseline && git branch -d og-image-baseline`. Nothing lost (linear). DO NOT switch branches while agents are committing.

## Sebs-gated (NOT auto-fire — his call, surface in main chat)
- Identity / 06-16 design+motion pass (design decision).
- First-visit intro animation (his Weave creative direction — don't auto-build a React version that clashes).
- All the eyeball rulings (arrow rod-vs-solid, golden v3 bless, Tier-2 family lock, preview opacity, band-7 policy, balloon/cushion, Glossy re-check).

_Living doc — move items to DONE (in git log) as they fire + land; add new blocked work here instead of letting it get lost._
