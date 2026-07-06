# Drawing-Tool Features — BUILD LOG (live resume doc)

> **ON RESUME (after any auto-compaction): READ THIS FILE FIRST, then `docs/FEATURES-UX-BUILD-SPEC.md`.**
> This is the live progress tracker for the Phases 0–3 features build (task #13). It survives
> conversation compaction. Update the checkboxes + "CURRENT STEP" after every meaningful step.
> Build in the MAIN LOOP (edits to existing files — stale-base rule). Local-canonical; tsc+build
> after each component; live-verify per phase (§12 of the spec).

## ⚠️ REVISED 2026-06-15 PM — SNAP IS MANUAL NOW (supersedes OFFER-ONLY below)
Sebs reworked the snap flow live (screenshots). The auto-detect-on-pen-up OFFER is **REMOVED**.
Current, shipped + tsc/build green on ALL 3 hosts (DrawPanel /desk, DeskDoodlesCanvas /canvas,
ObjectSurface RE-DRAW):
- **No auto-offer on pen-up.** Drawing a stroke raises nothing. `onStrokeCommitted` wiring removed
  from all 3 DrawSurface usages; per-host `handleStrokeCommitted` deleted.
- **No click-through cycle chip.** The `SnapChip` component + `DrawToolbarSnapChip` type + per-host
  `snapChip`/`cycleSnapChip` state DELETED. DrawToolbar's `snapChip` prop replaced by `snapSwitcher?: ReactNode`.
- **SNAP button = the one snap path.** `runSnap` fits the last stroke, applies the best shape, AND
  opens the recognized∪library∪Original **switcher** (`setOverride` + `setSwitchAllOpen(true)`).
- **Switcher = a real overlay dropdown.** `SwitchPopover` now `position:absolute; top:calc(100%+6px); left:0; z:30`
  (was in-flow → "inserted into the UI" + wrapped). Drops under its trigger like ShapeStrip's popover.
- **Receipt lives AT the SNAP button.** The "Snapped to X ▾ / ✕" pill is passed via DrawToolbar's
  `snapSwitcher` slot, rendered right after the SNAP/STRAIGHTEN pills (was floating above the canvas).
  ✕ dismisses (applied shape stays; pick **Original** in the switcher to revert).
- **SELECTION (Sebs "do what u think is best" 2026-06-15):** modeless **tap = select, drag = draw**.
  Tap anywhere INSIDE a closed shape selects it (`strokeContainingPoint` ray-cast, smallest-area wins)
  OR near the outline (`SELECT_HIT_RADIUS_PX` 16→22). A drag always draws (draw-inside never blocked).
  **Move gate** uses `pointInStroke(body) || nearOutline` (not whole-bbox) so empty bbox corners of a
  selected shape still draw. **Inserted shapes AUTO-SELECT** (handles show → move/resize immediately).

## LOCKED DECISIONS (Sebs, 2026-06-15 — ⚠️ OFFER-ONLY part is SUPERSEDED, see block above)
- **OFFER-ONLY** (the §13.1 "auto-apply vs auto-offer" call → Sebs picked **offer**). On pen-up,
  run `fitStroke`; if `accepted`, DO **NOT** auto-mutate the stroke — instead raise the persistent
  OverrideReceipt as an **offer**: "Snap to circle?" Tap to apply, ignore to keep freehand. This is
  GENTLER than the spec's auto-apply default; §3.2's `handleStrokeCommitted` is modified accordingly
  (don't call `api.applyToStroke` on accept — just `setOverride(...)` with the offered best as the
  highlighted entry; apply happens on the user's tap via `onSwitchTo`/`onCycleOverride`).
- **Inline shapes** (ShapeStrip): Freehand · rectangle · circle · triangle · diamond · star · heart.
  Rest (pentagon, hexagon, octagon, cloud, speech-bubble, lightning, crescent, teardrop, block-arrow,
  +line/arrow) under **More ▾** overflow. Flag if 7 inline wraps at /desk popup width → drop to 4.
- **Resize** = Tier A only (corner handles on the selected library-inserted shape → re-generate at
  new bbox). EXCLUDE rotate / skew / multi-select / layers / per-vertex (§7).

## PHASE PLAN (dependency-aware, §11) + STATUS
- [ ] **Phase 0 — extract `DrawToolbar.tsx`** (structural prerequisite; no behavior change except
      RE-DRAW gains the pills). Move register pills + ToneShadeCluster + the snap chip (reshaped to
      OverrideReceipt) out of DrawPanel + DeskDoodlesCanvas into the new shared component; wire all
      THREE hosts (DrawPanel, DeskDoodlesCanvas, ObjectSurface RE-DRAW). Verify parity on /desk +
      /canvas + RE-DRAW.
- [x] **Phase 1 — auto-detect-on-pen-up + persistent OFFER receipt. ✅ DONE on ALL 3 HOSTS
      (2026-06-15).** /desk (DrawPanel) + /canvas (DeskDoodlesCanvas) LIVE-VERIFIED (draw circle →
      "SNAP TO CIRCLE?" offer → tap snaps clean → all ▾ switcher → ✕ keeps freehand, 0 errors).
      RE-DRAW (ObjectSurface) WIRED + tsc/build green (identical pattern; live-verify via edit-modal
      → Re-draw when convenient). OFFER-only (no auto-apply). `onStrokeCommitted`/`onSelectionChange`
      on DrawSurface; per-host `handleStrokeCommitted` (fitStroke DIRECT, not stale api.fitLast) +
      `applyOverrideEntry` (recognized/library/original) + inline offer chip + SwitchPopover.
- [~] **Phase 2 — ShapeStrip + insert. CORE DONE + VERIFIED on /desk (2026-06-15).** ✅
      `DrawSurface.tsx`: `armedShape`/`onShapeInserted` props + `insertBox` state + insert gesture
      gated FIRST in handlePointerDown/Move/Up (drag→bbox, Shift aspect-lock via `normalizeInsertBox`,
      click-to-place fallback INSERT_MIN_PX 8 / INSERT_DEFAULT_PX 120) + live dashed-bbox+shape
      preview + `insertOutlineFor`(handles rect/square/triangle/circle/ellipse DIRECTLY since
      shapeLibrary only has the 12; star→star-5, arrow→arrow-block aliases) + `insertStrokeFromBox`
      (applyCandidate weld). `DrawPanel.tsx`: `armedShape` state + `armShape` (forces ink, clears
      offer) + `<ShapeStrip>` rendered + wired `armedShape`/`onShapeInserted`. **VERIFIED**
      `/tmp/dd-inserttest.mjs`: armed RECTANGLE → drag → clean rect placed ("1 STROKE"), 0 errors,
      tsc+build green. Screen `/tmp/dd-shots/insert-test.png`.
      ✅ **Insert now wired on ALL 3 HOSTS** (/desk + /canvas + RE-DRAW): `armedShape` state +
      `armShape` + `<ShapeStrip>` + armedShape/onShapeInserted props on each `<DrawSurface>`.
      ✅ **DE-CLUTTER (Sebs 2026-06-15 "the shape row clutters the UI"):** ShapeStrip now `collapsed`
      on all 3 hosts → a SINGLE "Shapes ▾" button → popover grid of all shapes (Freehand + 12). This
      is the ONLY toolbar change. Verified (`/tmp/dd-shots/cleanui-closed.png`), tsc+build green.
      ⚠️ **DO NOT remove the Snap/Straighten pills.** I briefly set `showSnap={false}` (assuming
      auto-detect made them redundant) — Sebs FLAGGED it ("where's the snap button"), REVERTED on all
      3 hosts back to the original `showSnap={composeMode/redrawMode === 'draw'}` (Canvas = default
      true). Snap/Straighten STAY. The de-clutter was only ever the shape row.
      REMAINING in Phase 2: Tier-A corner-resize on a selected inserted shape (spec §6.4 — not yet
      built; insert-then-reinsert is the interim "resize"). Snap clarification for Sebs: auto-detect
      ("snap") is the FREEHAND behavior (draw→offer), independent of the Shapes button; Straighten
      went with the removed pills (reachable via the offer switcher's recognized candidates).
- [ ] **Phase 3 — overflow + polish + smart-log feed.** `More ▾` overflow; `'auto'` outcome in
      `shapeSnapLog.ts`; eyeball-tune insert consts + inline-count-at-narrow-width.

## ⚠️ CURRENT STATE (discovered 2026-06-15 — MUCH is already scaffolded; DON'T rebuild)
Prior passes (Jun 13–14) already built + WIRED most of the structure. Verified present:
- ✅ **Phase 0 DONE** — `DrawToolbar.tsx` (286 ln) EXISTS and is **wired into all 3 hosts**
  (DrawPanel, DeskDoodlesCanvas, ObjectSurface). The structural extraction (kill the dup rows + give
  RE-DRAW a toolbar) is complete. BUT it currently hosts the **OLD button-triggered SnapChip**
  (`DrawToolbarSnapChip`), not the new auto-detect OFFER flow.
- ✅ **Components built** (not yet the live path): `OverrideReceipt.tsx`, `ShapeStrip.tsx`,
  `SwitchPopover.tsx`, and `lib/draw/switchSet.ts` (`buildSwitchSet` + `SwitchEntry`/`ShapeOverride`
  types). USE THESE — do not recreate (the half-written `DrawToolbar` rewrite I started is unneeded;
  the existing one is the base).
- ❌ **Phase 1 NOT wired** — DrawSurface has NO `onStrokeCommitted` (grep empty). Hosts still use the
  OLD `runSnap`→`fitLast`→`applyToStroke` BUTTON path (DrawPanel :451/:472, Canvas :218/:236). No
  auto-detect on pen-up.
- ❌ **Phase 2 NOT wired** — DrawSurface has NO `armedShape`/`onShapeInserted`/`insertBox`. No insert
  gesture.

## CURRENT STEP — Phase 1 (the real remaining meat), OFFER-ONLY
1. **DrawSurface.tsx**: add `onStrokeCommitted?(stroke)` prop; fire it in the new-stroke branch of
   `handlePointerUp` (find the `setStrokes((prev)=>[...prev, committed])` site — spec §3.1, anchor
   stale). (Also `onSelectionChange` for re-targeting.)
2. **Hosts (DrawPanel + Canvas + ObjectSurface)**: add `handleStrokeCommitted` = OFFER variant —
   `api.fitLast('snap')`; if `accepted`, **do NOT applyToStroke**; instead `setOverride({appliedKind:
   best.kind, switchSet: buildSwitchSet(result, pts), appliedIndex, originalPoints})` so the receipt
   OFFERS it; apply happens on the user's tap (`onSwitchTo`). Wire `onStrokeCommitted`→this.
3. **DrawToolbar**: render the new `OverrideReceipt` (offer copy "Snap to X?") + `ShapeStrip` instead
   of / alongside the old `DrawToolbarSnapChip`. Reconcile the props.
4. Tear-down: clear override on new stroke / mode-input-register flip / undo / Done (§4.4).
Then Phase 2 (armedShape + insert gesture in DrawSurface) per spec §6. Verify per §12 (live, 3 hosts).

NOTE: a half-written from-scratch DrawToolbar rewrite was attempted then abandoned on discovering the
existing scaffold — IGNORE it; build on the EXISTING DrawToolbar.tsx + the 4 component/lib files.

## FILES TO TOUCH (spec §9 — exact anchors)
- **NEW** `src/app/components/DeskDoodles/DrawToolbar.tsx` — the shared toolbar (§2).
- **NEW (rec)** `src/app/lib/draw/switchSet.ts` — `buildSwitchSet` (§4.2), pure/node-testable.
- `src/app/lib/draw/shapeFit.ts` — header: add SEBS'S LAW block (§0). Optional: `applyCandidate`
  curve-verbatim for `notes:'library:<curvedKind>'` (§4.6). Engine ALREADY built (fitStroke :1367,
  applyCandidate :1617, ShapeKind :199, SNAP_MAX_NORM_ERR :64).
- `src/app/components/DeskDoodles/DrawSurface.tsx` — props `onStrokeCommitted` (§3.1),
  `armedShape`+`onShapeInserted` (§6.1), `onSelectionChange` (§4.3); `insertBox` state; insert gates
  at TOP of handlePointerDown :1518 / Move :1569 / Up :1639; fire onStrokeCommitted in new-stroke
  branch :1680-1686; onSelectionChange in tap-select :1672-1679; consts near :1458; preview overlay.
- `src/app/components/DeskDoodles/DrawPanel.tsx` — delete SnapChip :160 / runSnap :427 / cycle :473 /
  dismiss :499; reshape snap state → ShapeOverride; add armedShape; handleStrokeCommitted (OFFER) +
  applyLibrary (§4.5); render `<DrawToolbar variant="panel">`; onSnapApi already :377.
- `src/app/components/DeskDoodles/DeskDoodlesCanvas.tsx` — same deletion :89/:252/:297/:323; render
  `<DrawToolbar variant="canvas">` (adds the gambit to /canvas).
- `src/app/components/DeskDoodles/ObjectSurface.tsx` — RE-DRAW stage :1004-1056: add snapApiRef +
  onSnapApi, armedShape, handleStrokeCommitted; render `<DrawToolbar variant="redraw" shadeEnabled>`;
  pass new props to the existing `<DrawSurface>` :1040. (Fixes RUNNING-TODO:16.)
- `src/app/lib/shapeSnapLog.ts` — add `'auto'` outcome (Phase 3).
- Reusable: ToneShadeCluster already exported `DrawSurface.tsx:2367`.

## VERIFICATION (spec §12 — before declaring any phase done)
baseline+after screenshots of 6 shape classes through LIVE draw on /canvas AND /desk AND RE-DRAW;
break battery: tiny/huge/spanning/elongated/scribble/almost-closed strokes; offer→apply→Original
round-trip; insert→resize→switch→Original; draw→undo→redraw; flip Sketch↔Style mid-receipt; rapid
multi-stroke (receipt tracks latest). Every offer+override feeds shapeSnapLog → smart/ML dataset.

## DONE THIS BUILD (append as completed)
- **2026-06-15: Phase 1 OFFER-only auto-detect LIVE + VERIFIED on /desk (DrawPanel).** ✅
  - `DrawSurface.tsx`: added `onStrokeCommitted?(stroke)` + `onSelectionChange?(id)` props; fire
    `onStrokeCommitted(committed)` in the new-stroke branch of `handlePointerUp`; `onSelectionChange`
    in the tap-select branch.
  - `DrawPanel.tsx`: added `override`/`switchAllOpen` state; `handleStrokeCommitted` (fits the
    committed stroke via the PURE `fitStroke(stroke.points,'snap')` — NOT `api.fitLast`, which reads
    stale pre-flush state and returns null → that was the first-attempt bug); `applyOverrideEntry`
    (recognized→candidate, library→generateShape at bbox, original→restore); a persistent OFFER chip
    ("Snap to X?" + "all ▾" SwitchPopover + "✕") rendered above the toolbar; wired `onStrokeCommitted`.
  - **VERIFIED LIVE** (`/tmp/dd-offertest.mjs` + `/tmp/dd-applytest.mjs`): draw a circle → "SNAP TO
    CIRCLE?" offer appears (auto, no mutation); tap → snaps to a clean closed circle; 0 errors;
    tsc+build green. Screens `/tmp/dd-shots/offer-test.png`, `apply-test.png`.
- **KEY BUG FOUND + FIXED:** `onStrokeCommitted` fires synchronously at pen-up BEFORE `setStrokes`
  flushes, so `api.fitLast()` (state-reading) returns null. Hosts MUST fit the committed stroke
  DIRECTLY via `fitStroke(stroke.points, action)` (pure engine). Apply-by-strokeId via the api is
  fine (state has flushed by tap-time).

- **2026-06-15: Phase 1 ALSO LIVE + VERIFIED on /canvas (DeskDoodlesCanvas).** ✅ Same proven
  pattern (override/switchAllOpen state + applyOverrideEntry + handleStrokeCommitted via fitStroke
  direct + offer chip + onStrokeCommitted wired). VERIFIED `/tmp/dd-canvastest.mjs`: draw circle →
  "SNAP TO CIRCLE?" offer → 0 errors. tsc+build green. **Phase 1 done on BOTH primary draw surfaces.**

## NEXT (continue here)
1. **3rd host — `ObjectSurface.tsx` RE-DRAW (`:1004-1056`)**: bigger lift — it has NO `onSnapApi`
   today. Install a `snapApiRef` + `onSnapApi` on its `<DrawSurface>`, add the same `override`/
   handlers/offer-chip, wire `onStrokeCommitted`. (Fixes RUNNING-TODO:16.) Then RE-DRAW gets the
   offer too. Lower priority than the two primary surfaces (both done).
2. **Phase 2 — ShapeStrip + insert gesture** (spec §5/§6): `armedShape`+`onShapeInserted`+`insertBox`
   in DrawSurface; the ShapeStrip is already built — wire it; insert drag-to-place + Tier-A resize.
3. **Phase 3 — overflow + smart-log `'auto'` outcome + tuning.**
NOTE: the offer chip is currently rendered inline in DrawPanel (proven). Optional later cleanup: move
it into DrawToolbar so all 3 hosts share one render (the existing OverrideReceipt component can host
it — but the inline version works + is verified, don't block on the refactor).
