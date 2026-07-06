# OPTIMIZATION / ANTI-LAG playbook — speed WITHOUT regressing visual quality

**Created 2026-06-18.** The performance playbook for THIS app: React + many heavy Smart-Hachure SVG objects in a CSS-`transform` desk canvas + a shared drei/WebGL canvas. Companion to [`DESK-RENDER-FIXES-PLAN.md`](./DESK-RENDER-FIXES-PLAN.md) (the diagnosed culling/pan fix), [`CODE-QUALITY-PASS.md`](./CODE-QUALITY-PASS.md) (the closure/effect debt this builds on), [`ALL-BUGS-AND-FIXES.md`](./ALL-BUGS-AND-FIXES.md) (the bug index), and [`KNOWN-SOLUTIONS.md`](./KNOWN-SOLUTIONS.md) / [`KNOWN-SOLUTIONS-PART2.md`](./KNOWN-SOLUTIONS-PART2.md) (proven algorithms).

## The brand law this playbook obeys

**Every optimization here must preserve the ink-black pencil aesthetic.** The whole look is ONE PENCIL — matte black + grayscale, value from mark-density/light, never hue, never gloss (SESSION-HANDOFF "3D NORTH-STAR"). So the cheap-but-wrong wins are OFF the table:

- ❌ Don't rasterize far objects to low-res PNG/snapshots if it visibly softens the hachure (the marks ARE the product). A static far-LOD is only allowed if it's pixel-faithful at that zoom.
- ❌ Don't drop Smart-Hachure detail (fewer marks, bigger gap) to go faster — that's a visual regression, not an optimization.
- ❌ Don't add gloss/cheaper materials in 3D for frame budget — matte pencil is the law.
- ✅ DO cull/skip work for things you can't see, stabilize what re-renders, and bound paint cost — all invisible to the user.

## Measure FIRST (non-negotiable)

Per `feedback_diagnose_with_real_data_first` + `feedback_no_sampled_verification_claims`: **profile before you patch, A/B every change, never claim a win without a before/after number.** Speculative perf patches lie as badly as speculative bug patches.

| Tool | What it tells you | Where it points |
|---|---|---|
| **Chrome Performance panel** (record a pan/zoom on `/desk?demo=1&n=80`) | Where the frame goes: Scripting (React/JS) vs Rendering (Layout) vs Painting vs Compositing | If Painting dominates → §3. If Scripting dominates → §1. If Layout dominates → you triggered reflow (§1 read-then-write). |
| **Rendering tab → Paint flashing** | Which regions actually re-paint each frame | Green flash over the whole desk on pan = the big transformed layer re-rasterizes (§3). |
| **Rendering tab → Layer borders** + **Layers panel** | How many composited layers, layer sizes, why each was promoted | A single layer larger than the GPU max texture → re-raster every pan frame (§3). |
| **FPS meter** + **React DevTools Profiler** ("highlight updates" / flame) | Which components re-render 60×/sec and why | DeskPage re-rendering on every camera frame → §1. |
| **`window.performance.now()` deltas around the streaming effect** | Cost of the `threeDIds` recompute per camera delta | Confirms §4 / DESK-RENDER-FIXES-PLAN R2 churn. |

Repro desk is already built: **`/desk?demo=1&n=80`** (`buildDemoWall(n)`, local, no DB — cycles the catalog, scatters over a grid that widens with `n`). Use a fixed `n` so before/after are comparable.

---

## Quick wins vs deep dives (the split)

| Tier | Item | Impact | Risk | §
|---|---|---|---|---|
| ⚡ Quick win | Stale-drag closures → refs (`objectsRef`/`draggingIdRef`) | High (kills handler churn that defeats child memo) | Low | §1 |
| ⚡ Quick win | Stable callbacks (`useCallback`) on props handed to memoized `DeskObjectView` | Med | Low | §1 |
| ⚡ Quick win | Replace `content-visibility:auto` with explicit zoom-aware cull | High (also fixes B1/B3 bugs) | Med | §2 |
| ⚡ Quick win | `will-change:transform` ONLY on the camera layer (already present) — verify it's not on every object | Med | Low | §3 |
| ⚡ Quick win | Debounce `threeDIds` recompute to camera-idle | High (kills per-frame 3D churn + B3/B5) | Med | §4 |
| 🔬 Deep dive | Isolate the camera transform into a tiny subscriber so DeskPage's huge render fn doesn't run 60×/sec | High | Med-High | §1 |
| 🔬 Deep dive | Tile/clip the desk layer so it never exceeds GPU max texture | High (if Layout/Paint-bound) | High | §3 |
| 🔬 Deep dive | Spatial index (R-tree) for the visible-set query if `n` grows past a few hundred | Med (only at scale) | Med | §2 |
| 🔬 Deep dive | Cap how many objects are in 3D at once (drei `<View>` slot budget) | Med | Med | §4 |

---

## §1 — React render perf (Scripting-bound)

The CODE-QUALITY-PASS already diagnosed the React path as *mostly* optimized (memo holds, camera = CSS transform + cameraRef, stable handlers) — the remaining wins are killing **render churn** and **event-time stale reads**.

| Lever | Why | How | Cross-ref |
|---|---|---|---|
| **Ref-mirrors for event-time reads** | `handlePointerMove`/`handlePointerUp` read `objects`/`draggingId` from CLOSURE → new handler identity each render → defeats `DeskObjectView`'s `React.memo` → every object re-renders on every drag/pan frame | Read from the existing `objectsRef` (`DeskPage.tsx:939`) / `draggingIdRef` (`:1423`) at event time; an event handler that isn't used during render can read a ref as an instance variable (React docs pattern) | DESK-RENDER-FIXES-PLAN Fix 3 · ALL-BUGS §7 |
| **Stable callbacks** | `useCallback` only helps if its deps are stable; an unstable dep (closure `objects`) makes the memo pointless | After the ref-mirror fix, the move/up callbacks have stable deps → child memo finally bites. Only memoize where there's a *measured* win — `useCallback`/`useMemo` have their own cost | web.dev / React docs |
| **Don't re-render DeskPage 60×/sec** | Camera in state would re-run the whole (3487-line) DeskPage render fn every pan frame | Camera is ALREADY a CSS transform + `cameraRef` (good). Deep-dive: isolate the transform into a tiny subscriber component (tldraw's `useQuickReactor` pattern — update the transform without a React reconcile) so even the wrapper doesn't reconcile | tldraw shape-rendering |
| **Derive during render, not effect+state** | Unnecessary `useEffect` (the `*Sync` dirty-detect + `view3d` reconcile effects) add commit passes | Per react.dev "You Might Not Need an Effect" — derive flags during render; no effect just to sync props→state | DESK-RENDER-FIXES-PLAN Fix 3 · CODE-QUALITY-PASS |
| **Avoid forced sync layout** | Reading `offsetWidth`/`getBBox` then writing styles in the same frame = layout thrash | Batch reads before writes; the viewport size already comes from a `ResizeObserver` (good — keep measuring, never static px per `feedback_no_static_pixels_when_viewport_relative`) | web.dev avoid-layout-thrashing |

> tldraw's relevant trick: the Shape component uses a quick-reactor to update transforms **without** triggering React reconciliation — faster than React's diff for frequent pan/zoom transform updates. That's the deep-dive target if Scripting still dominates after the ref-mirror + stable-callback quick wins.

---

## §2 — Zoom-aware viewport CULLING / virtualization (the DOM canvas)

**This is the highest-leverage item and it doubles as the B1/B2/B3 bug fix.** Full root-cause + ordered steps in [`DESK-RENDER-FIXES-PLAN.md`](./DESK-RENDER-FIXES-PLAN.md) §R1 + Fix 2 — summarized here as the perf lever.

**The trap we're in:** `content-visibility:auto` on each `DeskObjectView` wrapper (`DeskPage.tsx:~642`) lets the browser skip painting off-screen objects — BUT its relevancy heuristic is **screen-space** and its paint clip breaks under the parent `scale(zoom)` transform. So at `zoom>1` it judges on-screen boxes as off-screen and skips them (the edge pop-out). It's a browser heuristic we don't control, and it's wrong under our transform. (Known `content-visibility` fragility: it also drops SVG `<text>` paint in Safari and interacts subtly with transforms/view-transitions — not a reliable culler for a scaled canvas.)

**The fix = own the cull (what tldraw / Excalidraw do):**

1. **Remove** `contentVisibility:'auto'` + `containIntrinsicSize`.
2. **Compute the visible world-rect ourselves** from camera (`panX/panY/zoom`) + ResizeObserver'd `viewportSize` + a **PROPORTIONAL world-unit margin** `≈ (viewport/zoom)*0.25` (a band that does NOT collapse as you zoom in — the bug today is that the band is screen-space).
   - `wx0 = (0−panX)/zoom − marginX`, `wx1 = (W−panX)/zoom + marginX` (same for Y). Convention: `screen = world*zoom + pan`.
3. **`display:none` the misses** (object footprint bbox ∉ visible world-rect). Explicit, zoom-correct, no `scale()` heuristic.
4. **Never cull the dragged/selected id** — keep `draggingIdRef.current` + selected in the set regardless of bbox, or a drag off-edge blanks the thing under the cursor.
5. **Drive BOTH paths from this ONE shared visible-set** — 2D paint AND the 3D `threeDIds` set (kills the mixed 2D/3D desk, B2).

**This is exactly the industry pattern, validated:**
- **tldraw** culls by setting off-viewport shape containers to `display:none`; a 10,000-shape canvas might render only ~50. Shapes stay in the store (still selectable). They use an **R-tree spatial index** for the "what's in viewport" query and a **centralized** cull (O(1) subscription cost, not O(N)). They're even adding **hysteresis** so the set doesn't recompute every pan/zoom frame — exactly the camera-idle debounce we want (§4).
- **Excalidraw** filters to a `visibleElements` array via `isElementInViewport()` each frame, **throttles the static-scene redraw to ~60fps**, and **memoizes** `getRenderableElements()` so it returns cached results when inputs haven't changed. Plus a two-canvas split (cached static layer + live interactive layer).

**Quick win:** the explicit cull above (steps 1-4). **Deep dive (only if `n` grows past a few hundred):** add an R-tree (`rbush`) so the visible-set query is sub-linear instead of scanning all object bboxes each recompute. Not needed at demo scale — measure first.

**Brand-safe:** culling skips *off-screen* work only; on-screen objects render at full Smart-Hachure fidelity. Zero visual change to what the user sees.

---

## §3 — Paint / composite cost of many heavy SVG vector paths (Paint-bound)

The desk objects are heavy Smart-Hachure SVGs (dense vector paths). The CODE-QUALITY-PASS hypothesis: **the lag is browser PAINT of many heavy SVGs in one big transformed layer, not React.** Confirm with Paint flashing + the Layers panel before acting.

| Lever | Why | How | Risk |
|---|---|---|---|
| **One composited layer for the camera transform** | A property change that needs neither layout nor paint can jump straight to compositing (the cheapest path) — that's why panning a `transform`/`opacity` layer is cheap | `will-change:transform` on the camera layer (already at `DeskPage.tsx:2950`). **Verify it's NOT on every object** — promoting hundreds of objects to their own layers blows GPU memory and backfires | Low (audit only) |
| **Keep the transformed layer under the GPU max texture size** | If the big desk layer exceeds the GPU's max cacheable texture, it **re-rasterizes every pan frame** instead of just re-compositing the cached bitmap → paint cost on every frame | Deep dive: tile/clip the desk layer, OR (this is what §2 culling already buys you) shrink the painted area to the visible set so the layer the GPU must cache stays small | High |
| **Cull first, then worry about paint** | Fewer painted nodes = less paint, full stop | §2 culling is the single biggest paint win — an off-screen `display:none` object costs zero paint. Do §2 before any tiling deep-dive | — |
| **`content-visibility` caveat (do NOT re-add it)** | It's a paint-skip tool, but it mis-culls under `scale()` (§2) and drops SVG text paint | Use the explicit cull instead; if you ever want `content-visibility` for a NON-scaled list (e.g. the gallery grid, not the zoomed desk), it's fine there | — |

**Note on SVG specifically:** each Smart-Hachure object is a real SVG subtree (many `<path>`s). Painting a complex SVG is genuinely expensive; the answer is **paint fewer of them at once** (cull, §2) rather than degrade each one (brand law). If a single object is pathologically heavy, the **perf-bomb caps already exist** (`MAX_PATH_CHARS=300000`, `MAX_DOTS=6000`) — see KS-P2 §5G; those bound per-object path size without touching the look.

---

## §4 — The shared 3D canvas cost (drei `<View>`)

The whole desk/drawer/shelf/homepage 3D goes through ONE shared WebGL canvas with N scissored drei `<View>` viewports (`canvas3d/MultiStroke3D.tsx`, `Shared3DCanvas` + `Object3DView`) — see KS-P2 §5A. This already solved the context-exhaustion crash; the remaining cost is **how many slots render per frame** and **how often the slot set churns**.

| Lever | Why | How | Cross-ref |
|---|---|---|---|
| **drei `<View>` already culls off-screen views** | `<View>`'s `useFrame` skips `gl.render` when the slot div isn't visible → off-screen 3D slots cost ~nothing | Keep the slots tied to tracking divs (already done); the scissor approach renders "an infinite number of scenes limited only by processing capability" on one context — no hard cap, but real per-slot GPU cost | drei View docs · pmndrs scissor |
| **Stop the `threeDIds` set churning** | The streaming effect re-runs on every camera delta (deps include `camera`), and the LOAD/UNLOAD thresholds (0.5/1.0 viewport) get crossed back-and-forth mid-pan → objects flip in/out every frame (B3) and a click re-runs it (B5) | **Debounce the recompute to camera-IDLE** (tldraw's hysteresis idea), OR on global 3D-flip load all-in-visible-set once and let `<View>` cull. This is the same fix as DESK-RENDER-FIXES-PLAN R2/Fix 2 | DESK-RENDER-FIXES-PLAN §R2 · ALL-BUGS §1 B3/B5 |
| **Cap concurrent 3D slots if needed** | Each visible `<View>` still builds geometry (`buildPoolSolidGeometry`, `MAX_STROKES_3D=220` per object) + a draw call | At demo scale the shared canvas handles 20+ objects (verified). If a heavy desk lags in 3D, cap the in-3D set to the visible-set + a small margin (NOT a dumb first-N cap — that's the trap that looked broken when zoomed out). Measure slot count vs FPS first | KS-P2 §5A |
| **Matte stays matte** | Don't trade the pencil look for frame budget | No gloss/cheaper materials for perf; if 3D is too heavy, render fewer slots, don't degrade each | SESSION-HANDOFF 3D north-star |

**How many slots are affordable?** No hard number — scissored views are limited by GPU/processing, not by a context cap (one context). Verified working at desk 20+ / drawer 6. Treat "how many in 3D at once" as a **measured** budget on the real desk, not a guess.

---

## §5 — CPU vs GPU: what's NORMAL, what to profile, what's "beyond us"

**What's normal for a DOM + WebGL app like this:**
- Panning a big CSS-`transform` layer should be **GPU-composited and cheap** — IF the layer fits in a cached texture and you're not re-painting. If panning is expensive, you're re-rasterizing (§3) or re-rendering React (§1), not hitting a GPU wall.
- A WebGL canvas with a handful of matte meshes is **GPU-light**; the cost there is usually **geometry build on the CPU** (per-object `buildPoolSolidGeometry`) and **draw-call count** (one per visible `<View>`), not fill-rate.
- Many heavy SVGs is a **CPU paint** cost (rasterizing vector paths), not GPU. The cure is paint fewer (cull), not a faster GPU.

**What to actually profile (in order):** record a pan + a zoom + a 3D-flip on `/desk?demo=1&n=80`, then read: (1) Performance panel — is the frame Scripting / Rendering / Painting / Compositing? (2) Paint flashing — what re-paints on pan? (3) Layers panel — how big is the desk layer, is it re-rastering? (4) React Profiler — what re-renders 60×/sec? Each maps to a section above.

**Honest call — real wins vs diminishing returns:**

| Verdict | Item |
|---|---|
| ✅ **Real win, do it** | §2 explicit zoom-aware cull (fixes bugs AND paint) · §1 ref-mirror drag handlers · §4 camera-idle debounce of the 3D set |
| ✅ **Real win if measured Paint-bound** | §3 tiling/clipping the desk layer to stay under GPU max texture |
| 🟡 **Diminishing returns** | Micro-memoizing components that aren't in the hot path (premature; React is fast by default, and `useMemo`/`useCallback` have their own cost) · adding an R-tree before `n` is in the hundreds |
| 🛑 **Beyond us / not worth it for the makeathon** | Rewriting the DOM desk as a `<canvas>` 2D renderer (Excalidraw-style two-canvas) — large rewrite, throws away the SVG-DOM model the whole app is built on, and the brand-faithful SVG fidelity is the point · GPU shader-level SVG rasterization · a custom WebGL 2D path renderer |
| 🛑 **Forbidden (brand)** | Any "win" that softens hachure, drops marks, or adds gloss — that's a visual regression, not a speedup |

---

## Order of operations (do this, in this order)

1. **Measure** on `/desk?demo=1&n=80` — record pan + zoom + 3D-flip; classify the frame (Scripting / Layout / Paint / Composite).
2. **Quick wins:** ref-mirror the drag handlers (§1) → remove `content-visibility`, add the explicit cull (§2) → debounce the 3D set to idle (§4). These also close bugs B1-B5 (ALL-BUGS §1).
3. **Re-measure.** If Paint still dominates → §3 deep dive (layer size / tiling). If Scripting still dominates → §1 deep dive (transform subscriber).
4. **Regress-check** per `feedback_never_declare_fixed_without_regression_check`: same object count, same look, only the frame cost changed. Live, not headless. Capture before/after numbers — never claim a win without them.

---

## Sources (current best practice, verifiable)

**Culling / virtualization**
- tldraw — Shape Rendering & Culling (display:none off-viewport, R-tree, quick-reactor transforms): https://deepwiki.com/tldraw/tldraw/3.4-shape-rendering-and-culling
- tldraw — Performance: https://tldraw.dev/sdk-features/performance · Visibility (culling API): https://tldraw.dev/sdk-features/visibility
- tldraw — hysteresis for cull (debounce recompute during pan/zoom): https://github.com/tldraw/tldraw/issues/7436
- Excalidraw — Canvas Rendering Pipeline (isElementInViewport, throttled redraw, memoized renderable set, two-canvas): https://deepwiki.com/excalidraw/excalidraw/5.1-canvas-rendering-pipeline

**Rendering / paint / compositing**
- web.dev — Rendering performance (pipeline, compositing is cheapest): https://web.dev/articles/rendering-performance
- web.dev — Avoid large, complex layouts and layout thrashing (read-before-write, will-change/layer promotion): https://web.dev/articles/avoid-large-complex-layouts-and-layout-thrashing
- MDN — `content-visibility` (and its caveats): https://developer.mozilla.org/en-US/docs/Web/CSS/content-visibility
- W3C/WebKit thread — `content-visibility` + SVG-as-image / text paint pitfall: https://lists.w3.org/Archives/Public/public-css-archive/2024Jun/0505.html

**React render perf**
- React — `useCallback` (stable props for `React.memo`, ref-as-instance-variable for event handlers): https://react.dev/reference/react/useCallback
- React — You Might Not Need an Effect (derive during render): https://react.dev/learn/you-might-not-need-an-effect

**Shared 3D canvas (drei View / scissor)**
- drei — View (gl.scissor per tracking div, one performant canvas): https://drei.docs.pmnd.rs/portals/view
- pmndrs/react-three-scissor (multiple scenes, one context; why one context beats many): https://github.com/pmndrs/react-three-scissor

**Camera / pan math**
- d3-zoom (`constrain` / `translateExtent` — content-bbox pan clamp): https://d3js.org/d3-zoom
