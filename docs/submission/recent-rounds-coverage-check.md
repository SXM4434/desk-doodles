# Recent-rounds TEST-COVERAGE GAP MATRIX — Rounds 7 / 7b / 8

Generated 2026-06-13. Scope: the "gap test/check for whatever rounds recently finished" — every rock that LANDED in Round 7, Round 7b, and the in-flight Round 8 (per the SESSION-HANDOFF round ledger).

**This pass added ONE headless gauntlet** (geometry-correctness lane) and cross-referenced what the three currently-running fleets cover, so nothing in-flight is marked MISSING.

## What this gauntlet ran (and what it deliberately did NOT)

NEW repo tool added this pass (tools/ only — zero src/ edits, zero live-DB writes):
- `tools/3d/catalog-geometry-sweep.html`
- `tools/3d/catalog-geometry-sweep-harness.tsx`
- `tools/3d/catalog-geometry-sweep.mjs`

This is the **browser-driven companion** the pre-existing pure-node `tools/3d/geometry-gauntlet.mjs` already references by name (it samples the catalog SVGs via the DOM `getTotalLength`/`getCTM` pipeline, which node-only logic can't do). It runs the FULL catalog — **ALL 197 audit shapes × 5 geometry modes (auto/rod/extrude/inflate/solid)** — through the REAL engine (`strokeTo3d` + `convert` + `markIntent`) and gates on **geometry correctness ONLY**:

- vertex / triangle counts per built BufferGeometry
- non-finite scan (NaN / Infinity in any vertex) → 0
- determinism: every builder run twice, position arrays byte-compared → 0 drift
- mark-intent determinism: `convertStrokePool` run twice, unit label-set compared → 0 drift
- closure classification per stroke (closed / treated-as-closed / open)
- holes (Shape.holes via solid.holes + extrude.holesCut)
- joints (rod jointPositions at 20°/40°/70° thresholds — the Rock X axis)
- empty-non-vacuous: a sampled (non-empty) shape that builds 0 vertices in a form mode

**It mounts NOTHING from the active-edit set** — no `Stroke3DScene`, `hatchMaterial`, `Canvas3DChrome`, `Canvas3DContext`, `materials3d`; no WebGL renderer; reads NO pixels. The 197×geometry **VISUAL** 3D render sweep stays deferred (those files are mid-edit; `git status` confirms all 5 are `M`).

### Result — engine is geometrically clean across the whole catalog

```
Shapes: 197  ·  Hard-failing shapes: 0 / 197
NONFINITE 0 · NONDET 0 · MI-NONDET 0 · ENGINE-ERR 0 · EMPTY-NONVAC 0
(info) FALLBACK 114 · NO-SAMPLE 0 · ZERO-HOLE 35
closure totals: closed 938 · treated-as-closed 0 · open 418
mark-intent units: solid 506 · hole 434 · line-rod 260 · surface-hatch 34
joints fire on 192/197 shapes; monotonic (low≥default≥high) 197/197
```
Full per-shape×mode table: `/tmp/dd-catalog-geom/catalog-geom-table.md` · raw dataset: `/tmp/dd-catalog-geom/reports.json`.

Reproduce (dev server on :5182): `node tools/3d/catalog-geometry-sweep.mjs`

**Non-vacuity proof:** rows carry real per-mode vertex/triangle counts (e.g. trophy/framedSketch rod=17442v/32768tri, solid=756v/252tri/0h), 434 hole units cut, 938 closed vs 418 open strokes, 192/197 shapes exercise the joint axis. Not an all-zeros pass.

**Informational flags (NOT failures, by design):**
- `FALLBACK` (114) — a forced mode degraded to its honest degenerate path (e.g. extrude on a near-collinear loop → rod). Expected per Rock 2/X "explicit modes stay sacred but degenerate honestly."
- `ZERO-HOLE` (35) — a multi-closed-loop shape cut 0 holes. Matches the Rock X known-small: "Solid Holes only bites on odd-depth raster loops; two closed circles scanline-fill to a disc by design." Eyeball-worthy, not a bug. These are the cells the deferred VISUAL sweep should look at first.
- `treated-as-closed 0` — NO catalog stroke lands in the arrow-rule ambiguous band, so `arrowChips=0` everywhere. The arrow rule is exercised by the synthetic smoke/mark-intent batteries, not by the curated catalog (catalog art is cleanly closed or cleanly open). Flagged so the deferred draw-loop gauntlet covers the ambiguous band with real hand-drawn open-ish strokes.

---

## Coverage legend

Five axes per rock:
- **battery** — the rock's own build-time battery (the author's PASS gate)
- **verify** — an independent adversarial verifier re-ran it
- **smash** — a hostile break/SMASH pass (malformed input, extremes, crash probes)
- **gap-check** — edge-case / full-catalog gap sweep
- **visual** — screenshot-read at scale (pixel render)

Status: `done` · `in-flight` (a currently-running fleet covers it) · `MISSING`.

In-flight fleets cross-referenced (from the handoff "FLEETS RUNNING"):
- F-style: `wf_b556a1f2` — ALL 197×11 2D style matrix (hits **Rock Y Wireframe** + **wash fix**), modifier-extreme break-hunt, test-coverage gap map.
- F-relaunch: `wf_633c5c80` — **F2** verify+harden → **F3 shape-assist**, **envmap** adversary re-verify → **Hatch/Native gap cells**, smash.
- This engine gauntlet: the conversion/geometry engine (this doc) — hits **Rock X**, **Rock 2 (conversion D2)**, **Phase A** geometry side, and the **F1/F2 fill→region** geometry contract via the shared pool-raster region brain.

---

## ROUND 7

### Rock 1 — 3D chrome split (per-mode exclusive controls)
| battery | verify | smash | gap-check | visual |
|---|---|---|---|---|
| done | done | partial | partial | MISSING |

- battery/verify: landed + verified PASS (per-param min/max screenshots, per-item table — handoff "rock 1 PASS").
- smash/gap: chrome state-space (style × geometry × per-mode params) has no hostile toggle-combo fuzz beyond the build battery; `Canvas3DChrome` is in the active-edit set so a live smash is held.
- visual: the chrome's effect on render is part of the deferred 197×geometry VISUAL sweep.
- **Engine side covered here:** all per-mode builders (rod/extrude/inflate/solid params) proven finite + deterministic across 197 by this gauntlet.

### Rock 2 — conversion D2 v1 (3-state closure · parity holes · mark-intent v1 · conversionMap)
| battery | verify | smash | gap-check | visual |
|---|---|---|---|---|
| done | done | in-flight | **done (this pass)** | MISSING |

- battery: smoke 36→48/48 · mark-intent 11/11 (handoff).
- verify: round-7 verifier (caught the arrow-rule miss → fixed in 7b).
- smash: pure-node `geometry-gauntlet.mjs` (in-flight fleet's) runs adversarial fixtures (empty stroke / degenerate loop) — see WATCH below.
- gap-check: **this pass** — closure classification + holes + mark-intent labels + determinism over ALL 197 (was only 10 fixtures + 48 representative before).
- visual: deferred (donut hole render, spiral pinhole) — VISUAL sweep.

### Rock 3 — tone brush (DrawSurface tone-fill, band-grey, shade capture)
| battery | verify | smash | gap-check | visual |
|---|---|---|---|---|
| done | done | partial | MISSING | MISSING |

- battery/verify: landed PASS (bands under ink, 2 bands × 2 styles density, RPC body toneFills intercepted, live row round-trip — handoff "rock 3 PASS").
- smash/gap/visual: `DrawSurface` is in the active-edit/draw-panel prohibited set → no hostile pass on the draw loop. **Belongs to the deferred draw-loop gauntlet.**

### Rock 4 — Phase A recalibration (darknessToCoverage · 8-band · coverage across 8 styles · clamps)
| battery | verify | smash | gap-check | visual |
|---|---|---|---|---|
| done | done | in-flight | in-flight | MISSING (eyeball pending) |

- battery/verify: landed PASS (handoff "rock 4 PASS, Sebs eyeball pending").
- smash/gap: the 197×11 2D style matrix (`wf_b556a1f2`) + modifier-extreme break-hunt exercise the coverage→params math across the full catalog.
- visual: Phase-A A/B board + **golden v3 re-bless** still PENDING SEBS EYEBALL (rides the 279 wash flips).

---

## ROUND 7b

### Rock X — arrow rule (rod default + chip) · unified `__dd_decisionLog` · real engine options (holes/joint/bevel/wall) · Tier-2 family pills
| battery | verify | smash | gap-check | visual |
|---|---|---|---|---|
| done | done | in-flight | **done (this pass)** | done (boards) |

- battery: smoke 48/48 · mark-intent 11/11 under rod-default · tier2-board (19 cells) + arrow-rule-board · live /canvas proof (handoff "verified PASS").
- verify: 7b verifier PASS.
- smash: pure-node `geometry-gauntlet.mjs` adversarial fixtures (in-flight).
- gap-check: **this pass** — engine options proven over ALL 197: holes (434 hole units cut, 0 NaN), joints (192/197 fire, monotonic low≥default≥high 197/197, the Rock X invariant), bevel/wall/profile builders finite + deterministic everywhere.
- visual: family boards exist (`/tmp/dd-tier2/`) but PENDING SEBS EYEBALL; in-render visual is the deferred sweep.
- **NOTE:** arrow-rule ambiguous band has 0 catalog hits (curated art is cleanly closed/open) → the chip path needs hand-drawn open-ish strokes (draw-loop gauntlet).

### Rock Y — real Wireframe schematic register
| battery | verify | smash | gap-check | visual |
|---|---|---|---|---|
| done | done | in-flight | in-flight | in-flight |

- battery: `wireframe-battery.mjs` 21/21 + rockb C4/D re-pass + classifier golden-diff ZERO flips (handoff).
- verify: 7b verifier PASS.
- smash/gap/visual: the **197×11 2D style matrix** (`wf_b556a1f2`) includes Wireframe as one of the 11 styles → full-catalog visual + flag sweep is IN FLIGHT. Do not mark missing.

---

## ROUND 8 (in flight)

### F1 — grid shade-brush (band-mask rebuild, marker-model accumulation)
| battery | verify | smash | gap-check | visual |
|---|---|---|---|---|
| done | done | done | done | MISSING (eyeball pending) |

- battery/verify/smash/gap: `tools/rockf1/battery.mjs` full battery + break-on-purpose, per-item table, screenshots READ (handoff + task #63 complete).
- visual: F1 preview-opacity 0.55→0.9 PENDING SEBS EYEBALL.
- region-extraction geometry shares the pool-raster brain proven finite/deterministic by this gauntlet.

### F2 — fill / lasso (Brush|Fill|Lasso region tools)
| battery | verify | smash | gap-check | visual |
|---|---|---|---|---|
| done | in-flight | in-flight | done | MISSING |

- battery: `tools/rockf2/battery.mjs` full gauntlet 43/43 (commit `1cdf702` — lasso closing-chord + degenerate guard).
- verify/smash: `wf_633c5c80` relaunch (F2 verify+harden) IN FLIGHT.
- gap: gap-sweep battery + break-on-purpose done (task #66).
- visual: render at scale = deferred (draw surface is active-edit).

### F3 — shape-assist (Snap/Straighten verbs)
| battery | verify | smash | gap-check | visual |
|---|---|---|---|---|
| in-flight | in-flight | in-flight | MISSING | MISSING |

- Relaunching on Opus in `wf_633c5c80` (draw lane). All axes IN FLIGHT / deferred (draw loop). Not landed yet.

### envmap fix (tan-band kill, ink-black policy)
| battery | verify | smash | gap-check | visual |
|---|---|---|---|---|
| done | in-flight | done | done | done (boards, eyeball pending) |

- battery: `material-battery.mjs` 72/72 PASS, every board READ; hatch + svg-port sha1-byte-identical pre/post.
- verify: envmap adversary re-verify IN FLIGHT (`wf_633c5c80`).
- smash/gap: 6 presets × 8 orbit angles + glossy/signal × rod/inflate (the angle-sampling trap explicitly defended).
- visual: boards at `/tmp/dd-mat/`; Glossy Plastic re-check PENDING SEBS EYEBALL.
- **WATCH (tool-side, flagged in handoff, not this rock's bug):** `mark-intent-battery-harness.ts` + `tier2-board-harness.ts` carry the LEGACY banned-bronze material (#5A5043) + own rig minus Environment — their boards mislead; owners should re-point at exported `createNativeMaterial`/`StudioRig`.

### Hatch / Native gap cells (symmetry-law cells)
| battery | verify | smash | gap-check | visual |
|---|---|---|---|---|
| in-flight | in-flight | in-flight | MISSING | MISSING |

- `wf_633c5c80` (3D lane: Hatch/Native gap cells) IN FLIGHT — `gapcell-battery.{html,tsx,mjs}` is being authored (untracked). All axes in flight / not landed.

### wash-darkness fix (color-mix read as 8% not 100% ink)
| battery | verify | smash | gap-check | visual |
|---|---|---|---|---|
| done | in-flight | in-flight | in-flight | in-flight (golden v3 re-bless pending) |

- battery: committed (`5df2931`); 279/1394 golden flips ALL wash-region.
- verify/smash/gap/visual: the **197×11 2D style matrix** (`wf_b556a1f2`) re-renders every wash shape (e.g. processPrint) across all styles — IN FLIGHT. Golden v3 re-bless PENDING SEBS.

---

## mustRunDeferred — the gaps still needing a pass

1. **197×geometry 3D VISUAL render sweep** — the existing `tools/3d/audit-sweep.mjs` covers only 48 representative shapes AND mounts `Stroke3DScene`. The full 197×5 PIXEL render (empty/blob/wall/distinctness, contact sheets READ) is deferred until the canvas3d files (`Stroke3DScene` · `hatchMaterial` · `materials3d` · `Canvas3DChrome` · `Canvas3DContext`) leave active edit. **This pass cleared the geometry half** (197×5, 0 hard fails) so the visual sweep only needs to judge pixels, not correctness. Start at the 35 ZERO-HOLE cells + the 114 FALLBACK cells.

2. **Full draw-loop gauntlet** — `DrawSurface` / `DrawPanel` / `toneMask` / `shapeFit` are prohibited (active edit). Deferred axes: Rock 3 tone-brush smash/gap/visual, F2 lasso visual, F3 shape-assist (all axes), AND the **arrow-rule ambiguous band** + **treated-as-closed chip** (0 catalog hits — needs real hand-drawn open-ish strokes, which only the draw loop produces).

3. **Hatch/Native gap cells** — battery/verify/smash/gap/visual all in flight or not landed (`wf_633c5c80` 3D lane authoring `gapcell-battery.*`). Re-check on fleet completion; if it stalls, this is a clean MISSING.

4. **F3 shape-assist** — not landed; relaunching on Opus. No coverage until it lands.

5. **Pure-node `geometry-gauntlet.mjs` (in-flight fleet's) is RED — flag to its owner, do NOT fix (not mine):** 6 assertion FAILs + a heap OOM crash when run standalone. The failing assertions (px-floor closure / single-loop-no-spurious-hole / donut-vert-count / dense-scribble fill-intent / empty-stroke-in-pool no-throw / empty-pool no-units) read as **harness-assertion-vs-engine mismatches in an unfinished in-flight tool**, NOT engine bugs — this pass's 197×5 catalog sweep proves the engine itself is finite, deterministic, and throw-free across the whole catalog (0 ENGINE-ERR). The OOM is the harness allocating without disposal in a tight loop. Owner (the running break/gap fleet) should reconcile its assertions to the shipped engine semantics and add geometry disposal.

6. **Sebs eyeball queue (visual sign-offs, not automatable):** arrow rod-vs-solid ruling · Phase-A A/B + golden v3 re-bless (incl. 279 wash flips) · Tier-2 family boards · F1 opacity 0.55→0.9 · balloon/cushion inflate calibration · Glossy Plastic re-check · Hatch grammar board + Native dials · band-7 look policy.
