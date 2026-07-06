# Desk-canvas render-fix pass — working plan

**Created 2026-06-18.** Companion to [`CODE-QUALITY-PASS.md`](./CODE-QUALITY-PASS.md) (the running issue log). That doc is the backlog + method reminders; THIS doc is the diagnosed, ordered fix plan for the desk-canvas zoom / pan / 3D-streaming bugs.

Scope: `src/app/components/DeskDoodles/DeskPage.tsx` (+ `ObjectSurface.tsx` for the async-save debt). **Local-only pass, one step at a time, live-verify each (not headless), measure before/after — don't claim.** Keep behavior identical except the named bug.

All line numbers verified against HEAD on 2026-06-18.

> **STATUS (2026-06-18):** Fix 1 (pan bounds, B4) and Fix 2 (culling rework, B1) are **SHIPPED + Sebs-verified ✅**. Fix 3 (3D streaming, B2/B3/B5) is **SHIPPED + tsc-clean but awaits Sebs's live re-test** — it's the one item still open in this pass. The proven, reusable forms of all three now live in **[`KNOWN-SOLUTIONS-PART2.md` §5H/§5I](./KNOWN-SOLUTIONS-PART2.md)**. Inline status markers below.

---

## 1. Bugs (user-reported, 2026-06-18)

Screen rec: `~/Desktop/style/Screen Recording 2026-06-18 at 6.33.15 PM.mov`. Repro desk: `/desk?demo=1&n=80`.

| # | Bug | What the user sees | Status |
|---|-----|--------------------|--------|
| B1 | **Zoom pop-out** | Objects near the edges stop rendering when zoomed in. | 🟢 **FIXED** (Fix 2, Sebs verified ✅) |
| B2 | **Mixed 2D/3D won't flip** | Some objects won't flip to 3D when the desk is already in 3D mode (you get a mixed 2D/3D desk). | 🟡 **FIXED, awaits Sebs live re-test** (Fix 3) |
| B3 | **3D pop in/out** | Objects pop in and out when switching to / panning in 3D. | 🟡 **FIXED, awaits Sebs live re-test** (Fix 3) |
| B4 | **Pan bounds shrink with zoom** | Zoom out → you see more canvas; zoom in → you can't pan/scroll back to the area you just saw zoomed out. | 🟢 **FIXED** (Fix 1, Sebs verified ✅) |
| B5 | **Toggle back-and-forth on click** | Clicking the desk makes a toggle flip back and forth. | 🟡 **FIXED, awaits Sebs live re-test** (Fix 3) |

---

## 2. Root causes (established by the audit)

All three roots live in `DeskPage.tsx`. Stated as findings, not hypotheses.

### R1 — `content-visibility: auto` mis-culls under the parent `scale()` (→ B1, contributes B2) — 🟢 FIXED (Fix 2)
- **Where:** the `DeskObjectView` wrapper style, `DeskPage.tsx:642–643` (`contentVisibility: 'auto'`, `containIntrinsicSize: '220px 220px'`).
- **Why:** `content-visibility:auto` decides paint/skip using the browser's own **screen-space** on-screen heuristic plus a paint-containment clip. The entire desk layer sits under a parent CSS `scale(zoom)` transform. At `zoom > 1` the heuristic's intersection math and the paint clip break — boxes that ARE on screen get judged off-screen and skipped. This is **documented Chrome behavior** for `content-visibility` inside scaled/transformed ancestors (paint-clip + screen-space relevancy heuristic are not reliable under `scale`).
- **Effect:** the edge pop-out (B1). It also **suppresses 3D paint for in-set objects**, because the same skipped wrappers host the `<View>`-driven 3D slots — a wrapper the browser has content-skipped won't paint its 3D either (feeds B2).

### R2 — `threeDIds` streaming re-keyed on every camera delta, LOAD band only ½ viewport (→ B2, B3, B5) — 🟡 FIXED (Fix 3), awaits Sebs live re-test
- **Where:** the streaming effect, `DeskPage.tsx:1502–1548`.
- **Why:** the effect deps are `[objects, camera, viewportSize, deskView, deskLens]` — it re-runs on **every camera delta** (every pan/zoom frame). The LOAD band is only half a viewport: `loadMx = vw * 0.5, loadMy = vh * 0.5` (`:1513`); UNLOAD is one viewport (`:1514`).
- **Effects:**
  - **B2 (some won't flip):** an off-center object more than ½ viewport out never enters the LOAD band, so it never gets added to `threeDIds` → never flips to 3D. Mixed 2D/3D desk.
  - **B3 (pop in/out):** the LOAD (0.5) and UNLOAD (1.0) thresholds are crossed back and forth mid-pan; objects churn in and out of the set as the camera moves.
  - **B5 (toggle flip on click):** a click that nudges the camera (or triggers a re-render that re-runs the effect) flips membership for borderline objects → reads as a toggle flickering back and forth.

### R3 — `leashCamera` clamps pan to a viewport-sized box that shrinks as 1/zoom (→ B4) — 🟢 FIXED (Fix 1)
- **Where:** `leashCamera`, `DeskPage.tsx:776–783` (`PAN_LEASH_PX = 160`, `:769`); applied on every camera set at `:1451`.
- **Why:** the clamp keeps `panX ∈ [mx − vw·zoom, vw − mx]` where `mx = min(PAN_LEASH_PX, vw·zoom, vw)`. The reachable pan range is expressed in **screen px against a viewport-sized box**, so the *desk-space* extent it permits scales as **1/zoom** — the more you zoom in, the smaller the world area you can pan to.
- **Numerically proven:** an object at desk-x = 3000 is reachable by panning at `zoom 0.25` but **not** at `zoom 4`. Zoom out → bigger reachable world; zoom in → reachable world collapses (B4).

> world↔screen convention used throughout: `screen = world*zoom + pan`, `world = (screen − pan)/zoom`.

---

## 3. Fix plan (ORDERED)

Do them in this order — pan-bounds first (isolated, lowest risk, unblocks free testing of the others), then the culling rework (the big one, fixes B1+B3 and the 3D half of B2), then fold in the React debt while in the files.

### Fix 1 — Pan bounds: clamp against the CONTENT bbox in world coords — 🟢 SHIPPED (Sebs verified ✅)
**Shipped:** new `objectsBounds()` + rewritten `leashCamera()` in `DeskPage.tsx` ~`:765-815`. Reachable region = objects' world bbox + `PAN_PAD(800)` world px; clamp per axis `panX ∈ [W − cx1·zoom, −cx0·zoom]`, center when padded content < viewport (world↔screen: `screen = world·zoom + pan`). Zoom-correct — everything reachable at every zoom. Proven, reusable form → **KNOWN-SOLUTIONS-PART2.md §5H**.

Replace `leashCamera`'s viewport-box clamp with a **content-bbox clamp in world space** (the d3-zoom `constrain` / `translateExtent` model).

- Compute the content bbox in world coords: `[cx0, cy0] .. [cx1, cy1]` over all objects (+ their footprint). Pad by a **world-unit margin** so you can wander onto empty paper but always pan back.
- With viewport size `W × H` and the bbox mapped to screen (`screen = world*zoom + pan`), clamp per axis:
  - if content is **wider** than the viewport (`(cx1−cx0)*zoom > W`): `panX ∈ [W − cx1*zoom, −cx0*zoom]`
  - else (content fits): **center** it — `panX = (W − (cx0+cx1)*zoom)/2` (or clamp to the centered point)
  - same for Y with `H`, `cy0`, `cy1`.
- This makes reachable area a function of the **content**, not `1/zoom` → the area you saw zoomed-out stays reachable zoomed-in.

Ref: d3-zoom `constrain`/`translateExtent` — https://d3js.org/d3-zoom

### Fix 2 — Culling rework: REMOVE `content-visibility`, add ONE explicit zoom-aware viewport cull — 🟢 SHIPPED (Sebs verified "great" ✅)
**Shipped:** removed `content-visibility:auto` + `containIntrinsicSize`; replaced with an EXPLICIT per-object `display:none` cull computed in the `objects.map` from the LIVE camera + a ½-viewport margin (`hidden` prop on `DeskObjectView`), `DeskPage.tsx` ~`:2986`. Off-screen objects don't paint (perf win) but stay in DOM/state. Removed the CSS heuristic that mis-culled under `scale()` AND suppressed the 3D `<View>` slots. Proven, reusable form (incl. WHY `content-visibility` fails under `scale()`) → **KNOWN-SOLUTIONS-PART2.md §5H**.

This is the core fix (B1, B3, and the 3D-paint half of B2).

1. **Remove** `contentVisibility:'auto'` + `containIntrinsicSize` from the wrapper (`:642–643`). Stop relying on a browser heuristic that breaks under `scale()`.
2. **Compute the visible world-rect** ourselves from: camera (`panX/panY/zoom`) + the **ResizeObserver'd** viewport size (`viewportSize`, already tracked) + a **PROPORTIONAL world-unit margin ≈ ¼ viewport** (`margin = (viewport / zoom) * 0.25` — a world-unit band that does NOT collapse as you zoom):
   - visible world-rect: `wx0 = (0 − panX)/zoom − marginX`, `wx1 = (W − panX)/zoom + marginX` (same for Y).
3. **`display:none` the misses** (an object whose footprint bbox doesn't intersect the visible world-rect). Explicit, zoom-correct, no `scale()` heuristic involved.
4. **Drive BOTH paths from this ONE shared visible-set:** 2D paint AND the 3D `threeDIds` set. Two ways to kill 3D churn (pick one):
   - **(a) load-all-on-global-flip + let drei `<View>` cull** — when the desk flips to 3D, put *all* (or all-in-visible-set) objects in `threeDIds` once and let drei's `<View>` viewport-cull handle paint cost. Simplest; eliminates threshold churn entirely. ✅ **THIS IS WHAT SHIPPED (Fix 3 below).**
   - **(b) widen the band massively + debounce to camera-idle** — much larger band than ½ viewport, and only recompute the set on camera-**idle** (not every delta) so it can't churn mid-pan.
5. **Never cull the dragged/selected object** — always keep `draggingIdRef.current` (and any selected id) in the visible/rendered set regardless of bbox, so a drag off-edge never blanks the thing under the cursor.

Refs: tldraw culling — https://tldraw.dev/sdk-features/visibility · Excalidraw rendering pipeline — https://deepwiki.com/excalidraw/excalidraw/5.1-canvas-rendering-pipeline · WICG `content-visibility` explainer (why the heuristic is screen-space) — https://github.com/WICG/display-locking/blob/main/explainers/content-visibility.md

### Fix 3 — 3D streaming: STATIC set on global-flip (Fix 2 option a) — 🟡 SHIPPED, awaits Sebs live re-test
**Shipped:** REPLACED the `threeDIds` streaming effect that re-keyed on every camera delta (churned the set during pan → "some won't flip / pop in-out / toggle-flips-on-click") with a **STATIC set = ALL object ids when globally flipped** (deps `[objects, deskView, deskLens]`, NO camera), `DeskPage.tsx` ~`:1540`. The `display:none` cull from Fix 2 bounds perf (drei `<View>` skips `display:none` slots), so loading all ids costs nothing off-screen. Kills B2 (mixed desk), B3 (mid-pan churn), and B5 (camera-nudge re-key) at the root. Proven, reusable form → **KNOWN-SOLUTIONS-PART2.md §5I**. **Still OPEN: awaits Sebs's live re-test on `/desk?demo=1&n=80`.**

### Fix 4 — React debt (fold in while in these files) — 🔴 still open (separate from the render fixes)
Per `CODE-QUALITY-PASS.md` §"Suspected architecture debt" (stale-state + unnecessary `useEffect`). Do these in the same pass since we're already editing the handlers/effects. (Independent of Fixes 1-3; tracked in `ALL-BUGS-AND-FIXES.md` §5/§7.)

| Item | Where | Fix |
|------|-------|-----|
| **Stale-drag closures** | `handlePointerMove` `DeskPage.tsx:2282`, `handlePointerUp` `DeskPage.tsx:2313` | They read `objects` / `draggingId` from **closure**. Switch to the existing `objectsRef` (`:908`) / `draggingIdRef` (`:1392`). Kills stale-drag reads + handler churn that defeats child memo. |
| **Async-save closure capture** | `ObjectSurface.tsx` `handleDone` (`:885`), `handleRedrawDone` (`:1262`) | They persist closure-captured `surfStyle`/`surfMods`/`baseline` across an `await`. Read the edited config from **refs** at write time, OR hard-disable Save during the in-flight write so the captured values can't go stale. |
| **Unnecessary effects** | the `*Sync` dirty-detect effects + the `view3d` reconciliation effect | Derive **during render** instead of effect+state (react.dev "You Might Not Need an Effect"). No effect just to sync props→state or reconcile a derived flag. |

Ref: react.dev — You Might Not Need an Effect — https://react.dev/learn/you-might-not-need-an-effect

---

## 4. Definition of done + verification (on `/desk?demo=1&n=80`)

Every check on the **edge test desk** `/desk?demo=1&n=80`, **live in a real browser** (not headless — headless can't WebGL and the heuristics differ). For each fix: capture **before/after** and confirm the bug is gone AND nothing else changed.

| Fix | Definition of done — concrete check | Status |
|-----|-------------------------------------|--------|
| **Fix 1 — pan bounds (B4)** | Zoom to **400%**; **every object is reachable** by panning. The area visible at min-zoom is still reachable at max-zoom. At min-zoom, content stays centered (no infinite drift onto blank paper). | 🟢 **Sebs verified ✅** |
| **Fix 2 — culling (B1, B3, B2-paint)** | Zoom in/out + pan around the whole desk: **no object pops out** at the edges at any zoom; paint stays cheap (frame cost not worse than before — measure). Dragged/selected object never blanks. | 🟢 **Sebs verified "great" ✅** |
| **Fix 3 — 3D flip (B2, B3, B5)** | Flip the **whole desk to 3D**: **ALL objects flip** (no leftover 2D, no mixed desk); pan around → **no pop in/out**; click the desk → **no toggle flicker** (B5). | 🟡 **shipped + tsc-clean; awaits Sebs live re-test** |
| **Fix 4 — React debt** | Drag an object across the desk during a pan → no stale jump/teleport. Edit style in `ObjectSurface`, Save mid-edit → persisted config matches what's on screen (no stale style written). No regression in any of the above. | 🔴 open (separate) |

**Standing gates (from memory + `CODE-QUALITY-PASS.md`):**
- **Measure before/after, don't claim** (`feedback_no_sampled_verification_claims`, perf rule). Capture frame cost / object-count both sides.
- **Keep behavior identical except the bug** — same object count, same look, only the named defect changes.
- **Live-verify, not headless** (`feedback_live_check_not_headless_harness`) — drive the live app at real scale; isolated harnesses lie.
- **Regression check before "done"** (`feedback_never_declare_fixed_without_regression_check`) — baseline → fix → re-screenshot → diff.

---

## Reference links

- d3-zoom (`constrain` / `translateExtent`) — https://d3js.org/d3-zoom
- tldraw culling / visibility — https://tldraw.dev/sdk-features/visibility
- Excalidraw canvas rendering pipeline — https://deepwiki.com/excalidraw/excalidraw/5.1-canvas-rendering-pipeline
- WICG `content-visibility` explainer — https://github.com/WICG/display-locking/blob/main/explainers/content-visibility.md
- react.dev — You Might Not Need an Effect — https://react.dev/learn/you-might-not-need-an-effect
