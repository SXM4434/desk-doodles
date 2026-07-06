# Code-quality / re-engineering pass — running notes

**Started 2026-06-18 (Sebs kicked off a local debugging + optimization + architecture pass; he'll record a list of issues as he tests).** This is the backlog for that pass — keep appending; don't lose anything.

## How we're working this pass
- **Local, not Figma.** Do the debugging/optimization/architecture work HERE; Figma Make gets the synced files after.
- **One step at a time** (Sebs). Diagnose with real data first, fix, live-verify, then next.
- **Figma updated some code** — Sebs will hand over the Make-side changes when we're ready; fold them in then (don't assume local == Make until he shares).
- **Use the project skills + research.** Sebs: "we have skills in projects… use some re-engineering skills in there too, but research as well." → at the start of each chunk, check available Claude Code skills (code-review / refactor / architecture) AND research current best practice before sweeping changes.

## Suspected architecture debt (Sebs's hunch 2026-06-18 — AUDIT, don't assume)
1. **Stale-state issues** — "a lot of stale state issues." Likely refs/state read at the wrong time, closures capturing old values, optimistic updates not reconciling. → systematic audit: every `useRef` mirror, every place state is read inside a callback/timeout/async, every optimistic-then-server-reconcile path.
2. **Unnecessary `useEffect`** — "a lot of stuff with unnecessary useEffect." → audit every effect against the React "you might not need an effect" rules: derive-during-render instead of effect+state, event-handler logic instead of effect, no effect just to sync props→state, etc. DeskPage + ObjectSurface + DrawSurface are the big ones to sweep.

## Lag pass (in progress)
- **Step 1 SUPERSEDED → REPLACED by the explicit zoom-aware cull (#1 above):** the original `content-visibility: auto` step skipped painting off-screen objects, BUT its screen-space heuristic mis-culled under the parent `scale(zoom)` (caused the B1 zoom pop-out + suppressed 3D slots). It was REMOVED and replaced with an explicit per-object `display:none` cull (DeskPage ~:2986) — same perf win (off-screen objects don't paint), no `scale()` heuristic. Diagnosis still holds: React path already optimized (memo holds, camera = CSS transform + cameraRef, stable handlers); lag = browser PAINT of many heavy smart-hachure SVGs in one big transformed layer.
- **Next candidates if step 1 isn't enough:**
  - The big transformed desk layer may exceed the GPU's max cacheable texture size → re-rasterizes every pan frame. Mitigations: tile/clip the layer, or rasterize far objects to a cheaper static representation.
  - DeskPage re-renders on every camera frame (camera in state) — isolate the camera transform into a tiny subscriber so the huge DeskPage render fn doesn't re-run 60×/sec.
- **svg-port LAG (Sebs flagged, deferred to its own step):** switching to svg-port 3D lags. Known long-standing (offscreen mount / getPointAtLength / texture build). One step at a time — after the 2D desk lag.

## Sebs's recorded issue list (2026-06-18, screen rec at ~/Desktop/style/Screen Recording 2026-06-18 at 6.33.15 PM.mov)
1. **Zoom pop-out — render radius not tied to zoom.** Zoom in a lot → objects pop OUT. The "radius of what can be rendered" isn't tied to the zoom. ⚠️ SUSPECT: my `content-visibility:auto` step-1 (browser cull heuristic isn't zoom/transform-aware). Confirm on the test desk (A/B with it off). If it's the cause → replace with zoom-aware React viewport culling (render only objects in viewport + a margin that SCALES with zoom), not a browser heuristic.
2. **Toggle back-and-forth on desk click.** Clicking the desk makes a toggle flip back and forth (which toggle? likely 2D/3D or PEN/DESK). Repro + find the state thrash.
3. **3D pop in/out.** Some objects pop in/out when switching to 3D. = threeDIds viewport-streaming margin (3D) — same family as #1; cull radius not zoom-aware.
4. **Pan bounds shrink with zoom.** Zoom OUT → see more canvas; zoom IN → can't pan/scroll to the area you saw zoomed out. The pan clamp is computed in a way that loses reachable area at high zoom. Pan-bounds math needs to be zoom-correct.

6. **Private-desk toggle flicker** (Sebs 2026-06-18, video 7.44.52 PM) — on a PRIVATE desk, a toggle flips back and forth for ~1s before SETTLING. Classic state-init race: renders a default, then an effect/async-load corrects it → visible flicker. Candidates: PersonalDrawer `tab` ('drawer'|'shelf') defaulting on `isPrivate` before isPrivate resolves; or PEN/DESK / 2D-3D / deskLens init. FIX = lazy-init the toggle from the loaded value (or don't render until settled) — an "unnecessary effect / props→state sync" case (Agent 2 family). NOT YET FIXED — investigate which toggle on a private desk, then derive its initial state instead of default+correct.

## Render-fix progress (2026-06-18)
- ✅ **#4 pan bounds** — content-bbox d3-zoom clamp (objectsBounds + leashCamera, DeskPage ~:765-815). Sebs verified: "1 is good." Synced. Proven/reusable form → KNOWN-SOLUTIONS-PART2.md §5H.
- ✅ **#1 zoom pop-out + 3D "disappear while in view near edge"** — REPLACED content-visibility:auto with EXPLICIT zoom-aware cull: per-object `hidden` (display:none) computed in the objects.map from the live camera + ½-viewport margin (DeskPage ~:2986). Removes the CSS heuristic that mis-culled under scale() AND suppressed 3D slots. **Sebs verified "great" ✅.** Proven/reusable form (incl. WHY content-visibility fails under scale()) → KNOWN-SOLUTIONS-PART2.md §5H.
- 🟡 **#2/#3/#5 threeDIds streaming** (some won't flip 3D / pop in-out / "toggle flip" on click) — **SHIPPED:** REPLACED the camera-keyed streaming effect with a STATIC set = ALL object ids when globally flipped (deps `[objects, deskView, deskLens]`, NO camera), DeskPage ~:1540. The #1 display:none cull bounds perf (drei `<View>` skips display:none slots), so loading all ids costs nothing off-screen → set can't churn mid-pan, every object flips, a camera-nudging click can't re-key it. tsc-clean. **STILL OPEN: awaits Sebs's live re-test on /desk?demo=1&n=80.** Proven/reusable form → KNOWN-SOLUTIONS-PART2.md §5I.

## Figma Make additions (Sebs handed over, 2026-06-18 — DESCRIPTIONS, need the actual code to edit)
- **Reveal cascade** across the 3 2D card grids (DeskGallery /desks, Drawer/Shelf page grid, side-panel drawer): cards pop in one-at-a-time, scale-overshoot 0.9→1.02→1.0 + fade, stagger ~45–55ms (capped), prefers-reduced-motion fallback (opacity only). Pure CSS. NOT on live desk objects (they have dd-land already). ⇒ need the Make code to port locally.
- **Custom drag follower** (PersonalDrawer): hides the native HTML5 drag ghost (1×1 transparent setDragImage) + renders a live styled card following the cursor (scale 1.05, tilt, warm shadow); source card dims; tracks via document dragover; clears on dragend/drop. Drop logic unchanged.
  - **SEBS WANTS:** the **OBJECT to pop OFF the card** (the doodle lifts off its card), not the whole card flying. ⇒ need the Make PersonalDrawer drag-follower code to modify.

## Edge test desk (DONE 2026-06-18) — to stress-test smoothness
`buildDemoWall(n)` now cycles the catalog (markup cached per shape) so it generates ANY n objects, scattered over a grid that widens with n. Local, no DB. URL: **`/desk?demo=1&n=80`** (or any n) = a heavy desk to test pan/zoom/3D limits. Use this to repro #1–#4 above with a real load.

## Method reminders (from memory)
- `feedback_diagnose_with_real_data_first` — build the inspection/profile tool first; don't speculative-patch (esp. after the fill-algorithm mess — synthetic harnesses LIE; live-verify).
- `feedback_never_declare_fixed_without_regression_check` — before/after, and for perf: measure, don't claim.
- Keep changes "same behaviour, faster" unless Sebs okays a behaviour change.

## Parked (not this pass unless Sebs says)
- AI-mesh generation: button wired + 401 fix shipped; needs `image-to-3d` deployed `--no-verify-jwt` (Sebs-side) + a real fal test.
- Nested-fill: closed-inner now fills (gCells=0 preference); very-open (>~8% gap) shapes still leak — snap to close.
