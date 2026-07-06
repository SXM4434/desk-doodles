---
name: desk-doodles-perf
description: Use when Desk Doodles feels laggy / janky — pan/zoom stutter, slow 3D flip, frame drops on the desk canvas, or any "make it faster" request. The method: MEASURE first (profile, A/B, never claim a win without a before/after number), then apply the ranked levers — strictly without degrading the ink-black pencil aesthetic (no softening hachure, no dropping marks, no gloss). Triggers on "the desk lags", "optimize performance", "why is panning slow", "speed up 3D", "it's janky".
---

# Desk Doodles — Performance / Anti-Lag

The performance playbook for this app: React + many heavy Smart-Hachure SVG objects in a CSS-`transform` desk canvas + a shared drei/WebGL canvas. Full detail, tables, and sources live in [`docs/submission/OPTIMIZATION-ANTI-LAG.md`](../../../docs/submission/OPTIMIZATION-ANTI-LAG.md) — this skill is the operating procedure that points at it. Companions: `DESK-RENDER-FIXES-PLAN.md` (the diagnosed cull/pan fix), `CODE-QUALITY-PASS.md` (the closure/effect debt), and the `desk-doodles-bug-index` skill (the bug index + known solutions).

## The brand law every optimization obeys (the guardrail)

**Every speedup must preserve the ink-black pencil aesthetic.** The whole look is ONE PENCIL — matte black + grayscale, value from mark-density/light, never hue, never gloss. The marks ARE the product, so the cheap-but-wrong wins are OFF the table:

- ❌ Don't rasterize far objects to low-res PNG/snapshots if it visibly softens the hachure (a static far-LOD is only allowed if it's pixel-faithful at that zoom).
- ❌ Don't drop Smart-Hachure detail (fewer marks, bigger gap) to go faster — that's a visual regression, not an optimization.
- ❌ Don't add gloss/cheaper materials in 3D for frame budget — matte pencil is the law.
- ✅ DO cull/skip work for things you can't see, stabilize what re-renders, and bound paint cost — all invisible to the user.

## Step 1 — MEASURE first (non-negotiable)

Profile before you patch, A/B every change, never claim a win without a before/after number (`feedback_diagnose_with_real_data_first`, `feedback_no_sampled_verification_claims`). Repro desk is built: **`/desk?demo=1&n=80`** (local, no DB; use a fixed `n` so before/after compare). Record a pan + zoom + 3D-flip, then classify the frame:

| Profiler reads… | The frame is… | Go to lever group |
|---|---|---|
| Scripting (React/JS) dominates | Render churn / event-time stale reads | §1 React render perf |
| Painting dominates (Paint flashing = whole desk re-paints on pan) | Re-rasterizing heavy SVGs in one big layer | §3 Paint/composite |
| Layout dominates | Forced sync reflow (read-then-write) | §1 (batch reads before writes) |
| Composite only, still slow | Layer exceeds GPU max texture → re-rasters every frame | §3 (tile/shrink the layer) |

Tools: Chrome Performance panel · Rendering tab (Paint flashing, Layer borders, Layers panel) · FPS meter · React DevTools Profiler · `performance.now()` deltas around the streaming effect.

## Step 2 — apply the ranked levers (quick wins first)

**⚡ Quick wins (do these in order — they also CLOSE render bugs B1–B5):**
1. **Ref-mirror the drag handlers** (§1) — `handlePointerMove`/`handlePointerUp` read `objects`/`draggingId` from CLOSURE → new handler identity each render → defeats `DeskObjectView`'s `React.memo`. Read from the existing `objectsRef`/`draggingIdRef` at event time. High impact, low risk.
2. **Remove `content-visibility:auto`, add an explicit zoom-aware cull** (§2) — the browser heuristic mis-culls under the parent `scale(zoom)` (that IS bug B1). Own the cull: compute the visible world-rect from camera + ResizeObserver'd viewport + a proportional world-unit margin `≈ (viewport/zoom)*0.25`; `display:none` the misses; never cull the dragged/selected id; drive BOTH 2D paint and the 3D set from ONE shared visible-set. This is the highest-leverage item — it fixes bugs AND paint. (tldraw/Excalidraw pattern.)
3. **Debounce the `threeDIds` recompute to camera-idle** (§4) — the streaming effect re-runs every camera delta and the LOAD/UNLOAD thresholds churn mid-pan (B3/B5). Debounce to idle (tldraw hysteresis), or load the whole visible-set on 3D-flip and let drei `<View>` cull.
4. **Verify `will-change:transform` is ONLY on the camera layer** (§3), not on every object (promoting hundreds of objects blows GPU memory and backfires).

**🔬 Deep dives (only if a re-measure still shows the bottleneck):**
- Isolate the camera transform into a tiny subscriber so the huge DeskPage render fn doesn't run 60×/sec (tldraw quick-reactor pattern) — if Scripting still dominates (§1).
- Tile/clip the desk layer to stay under GPU max texture — if measured Paint-bound (§3).
- Add an R-tree (`rbush`) for the visible-set query — only if `n` grows past a few hundred (§2).
- Cap concurrent 3D `<View>` slots to the visible-set + margin (NOT a dumb first-N cap) — if a heavy 3D desk lags (§4).

## Step 3 — the honest-call ledger (real wins vs diminishing returns vs forbidden)

| Verdict | Item |
|---|---|
| ✅ Real win, do it | §2 explicit zoom-aware cull · §1 ref-mirror drag handlers · §4 camera-idle debounce |
| ✅ Real win if measured Paint-bound | §3 tiling/clipping the desk layer |
| 🟡 Diminishing returns | Micro-memoizing components not in the hot path · R-tree before `n` is in the hundreds |
| 🛑 Beyond us for the makeathon | Rewriting the DOM desk as a `<canvas>` 2D renderer · GPU shader-level SVG raster · custom WebGL 2D path renderer |
| 🛑 Forbidden (brand) | Any "win" that softens hachure, drops marks, or adds gloss |

## Step 4 — regress-check the win

Same object count, same look, only the frame cost changed. Live, not headless. Capture before/after numbers (`feedback_never_declare_fixed_without_regression_check`; see the `regression-check` skill). A speed claim without a measured A/B is as bad as a speculative bug patch.

## Sources
The doc carries the full verifiable source list — tldraw culling/visibility/hysteresis, Excalidraw rendering pipeline, web.dev rendering-performance, MDN `content-visibility`, React `useCallback` / You-Might-Not-Need-an-Effect, drei `<View>` / pmndrs scissor, d3-zoom `constrain`/`translateExtent`. See [`OPTIMIZATION-ANTI-LAG.md`](../../../docs/submission/OPTIMIZATION-ANTI-LAG.md) "Sources".
