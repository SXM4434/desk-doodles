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

## Sebs-gated (NOT auto-fire — his call, surface in main chat)
- Identity / 06-16 design+motion pass (design decision).
- First-visit intro animation (his Weave creative direction — don't auto-build a React version that clashes).
- All the eyeball rulings (arrow rod-vs-solid, golden v3 bless, Tier-2 family lock, preview opacity, band-7 policy, balloon/cushion, Glossy re-check).

_Living doc — move items to DONE (in git log) as they fire + land; add new blocked work here instead of letting it get lost._
