# ALL BUGS & FIXES — the master bug INDEX

**Created 2026-06-18.** The single skimmable index of every known bug/issue across the whole app, grouped by subsystem.

> ⚠️ **STATUSES BELOW ARE STALE as of 2026-06-19.** A 6-agent verification sweep re-checked every open/partial bug against live code — ~10 rows marked 🔴/🟡 here are actually FIXED (B1–B5 camera/render, 3D hachureGap HIGH cap, AI-mesh material toggle, SVG simplify UI, side-panel, elongated-shift, decision-log channels, etc.), and Phase 0/1 closed several more. **The current verified board is [`RUNNING-TODO.md`](./RUNNING-TODO.md)** — trust that for status; use the rows below for the root-cause + KS cross-refs only. Re-grep before acting (line numbers drift).

## How to use this doc

- **This is the bug INDEX.** It tells you *what's broken, why, the recommended fix, and where the proven solution lives.* It deliberately does NOT re-paste algorithms.
- **The proven algorithms live in [`KNOWN-SOLUTIONS.md`](./KNOWN-SOLUTIONS.md) + [`KNOWN-SOLUTIONS-PART2.md`](./KNOWN-SOLUTIONS-PART2.md)** (region-fill, even-odd holes, 3D relief/inflation, recognition+gap-close, NPR/smart-ML, many-objects-in-3D). When a row says "→ KS §X", read that section for the citable, ready-to-execute fix.
- **The diagnosed desk-canvas zoom/pan/3D-streaming fix plan lives in [`DESK-RENDER-FIXES-PLAN.md`](./DESK-RENDER-FIXES-PLAN.md)** — this doc FOLDS IN those render bugs by reference (Camera/Render section) instead of duplicating the root-cause writeup.
- **Performance/lag is its own playbook:** [`OPTIMIZATION-ANTI-LAG.md`](./OPTIMIZATION-ANTI-LAG.md).
- **Status legend:** 🟢 fixed · 🟡 partial · 🔴 open · ⏸️ parked (deferred post-makeathon / Sebs-gated) · 🔵 design call → main chat.
- **Discipline:** nothing here is "fixed" without a live `:5182` before/after per `feedback_never_declare_fixed_without_regression_check`. Several FIX-SPEC docs marked bugs "open" that git later closed — status here reconciles to the latest pass (git + live re-diagnosis).

**Stack (verified `package.json`):** React 18.3.1 · Vite 6 · three 0.169 · @react-three/fiber 8.17 · drei 9.114 · @react-three/cannon 6.6 / cannon-es 0.20 · perfect-freehand 1.2.3 · roughjs 4.6.6 · **polygon-clipping 0.15.7 (installed, the analytic lever)** · svgson 5.3.1 · @supabase/supabase-js 2.107.

---

## 0. At-a-glance — open/partial bugs by subsystem

| Subsystem | Open 🔴 | Partial 🟡 | Parked ⏸️ | Worst live-impact open item |
|---|---|---|---|---|
| Camera / Render (desk canvas) | — | 1 | — | B2/B3/B5 3D streaming — fixed, awaits Sebs live re-test (DESK-RENDER-FIXES-PLAN) |
| Fill / Shade | 3 | 2 | 1 | Nested-tap auto-capture flaky; clean-edge / full-fill reliability |
| 3D / svg-port | 4 | 3 | 2 | svg-port jagged rims; 3D hachureGap HIGH no-cap (76% of 3D breaks) |
| Image-upload / AI-mesh | 2 | 2 | 1 | rough+fill blobs images; AI-mesh material-mode toggle unbuilt |
| Save / Persistence / Supabase | 4 | 1 | — | Async-save closure capture; contentHash crashes in insecure ctx |
| Personal-space | 2 | 1 | — | Save-routing (drawer/shelf/both) not built |
| Drag / Drop | 2 | — | — | Stale-drag closures (objects/draggingId read from closure) |
| Misc / robustness | 6 | — | 3 | O(n²) sibling pass has no element cap (10k-sibling upload hangs) |

---

## 1. Camera / Render — desk-canvas zoom / pan / 3D streaming

**Authority: [`DESK-RENDER-FIXES-PLAN.md`](./DESK-RENDER-FIXES-PLAN.md)** (user-reported 2026-06-18, root-caused, ordered fix plan). All live in `DeskPage.tsx`. Repro desk: `/desk?demo=1&n=80`. Summarized here; read the plan for the world↔screen math and ordered steps.

| ID | Symptom | Root cause (where) | Recommended fix | Status | Cross-ref |
|----|---------|--------------------|-----------------|--------|-----------|
| **B1** | Objects near edges stop rendering when zoomed in | `content-visibility:auto` mis-culls under the parent `scale(zoom)` — its screen-space relevancy heuristic + paint clip break under `scale()` (`DeskPage.tsx` DeskObjectView wrapper, ~`:642`) | **Remove** `contentVisibility`/`containIntrinsicSize`; replace with ONE explicit zoom-aware viewport cull (world-rect from camera + ResizeObserver'd `viewportSize` + proportional world-unit margin `≈ (viewport/zoom)*0.25`); `display:none` the misses; never cull the dragged/selected id | 🟢 **fixed** — removed `content-visibility:auto`; explicit per-object `display:none` cull computed in `objects.map` from the LIVE camera + ½-viewport margin (`hidden` prop on `DeskObjectView`), `DeskPage.tsx` ~`:2986`. Off-screen objects don't paint but stay in DOM/state. **Sebs verified "great" ✅** | DESK-RENDER-FIXES-PLAN §R1 + Fix 2 · OPT-ANTI-LAG §2 · KS-P2 §5H |
| **B2** | Some objects won't flip to 3D in a 3D desk (mixed 2D/3D) | `threeDIds` LOAD band only ½ viewport (`loadMx=vw*0.5`, ~`:1545`); off-center objects never enter the band → never added. Compounded by B1 (content-skipped wrappers don't paint their `<View>` 3D either) | Drive BOTH 2D paint + the 3D `threeDIds` set from the ONE shared visible-set; on global 3D-flip load all-in-visible-set once and let drei `<View>` cull (option a), OR widen band massively + recompute on camera-**idle** only (option b) | 🟡 **fixed, awaits Sebs live re-test** — `threeDIds` is now a STATIC set = ALL object ids when globally flipped (deps `[objects, deskView, deskLens]`, no camera), `DeskPage.tsx` ~`:1540`; the B1 `display:none` cull bounds perf (drei `<View>` skips `display:none` slots). B1 fix also un-blocks the 3D-paint half | DESK-RENDER-FIXES-PLAN §R2 + Fix 3 · KS-P2 §5I |
| **B3** | Objects pop in/out when switching to / panning in 3D | LOAD (0.5) and UNLOAD (1.0) thresholds crossed back-and-forth mid-pan → churn; streaming effect re-runs on every camera delta (deps `[objects,camera,viewportSize,…]`, ~`:1534`) | Same shared-visible-set rework as B2; debounce the set to camera-idle so it can't churn mid-pan | 🟡 **fixed, awaits Sebs live re-test** — static set (no camera dep) means the membership can't churn mid-pan; `DeskPage.tsx` ~`:1540` | DESK-RENDER-FIXES-PLAN §R2 + Fix 3 · OPT-ANTI-LAG §1/§4 · KS-P2 §5I |
| **B4** | Zoom out → see more; zoom in → can't pan back to area you saw | `leashCamera` clamps pan to a viewport-sized box that shrinks as **1/zoom** (`PAN_LEASH_PX=160`, `leashCamera` ~`:795`, applied ~`:1483`) | Replace with a **content-bbox clamp in world space** (d3-zoom `constrain`/`translateExtent` model): clamp panX/panY against the placed-objects bbox + world-unit margin; center when content fits | 🟢 **fixed** — content-bbox d3-zoom `constrain` clamp: new `objectsBounds()` + rewritten `leashCamera()` (`DeskPage.tsx` ~`:765-815`); reachable region = objects' world bbox + `PAN_PAD(800)` world px, clamp per axis `panX ∈ [W − cx1·zoom, −cx0·zoom]`, center when padded content < viewport. Zoom-correct (everything reachable at every zoom). **Sebs verified ✅** | DESK-RENDER-FIXES-PLAN §R3 + Fix 1 · KS-P2 §5H |
| **B5** | Clicking the desk flips a toggle back and forth | A click that nudges the camera (or re-renders) re-runs the streaming effect → membership flips for borderline objects → reads as toggle flicker | Falls out of the B2/B3 fix (idle-debounced, stable visible-set); also fold in the stale-drag ref fix (§7) so handlers don't churn | 🟡 **fixed, awaits Sebs live re-test** — falls out of the static-set B2/B3 fix (a camera-nudging click no longer re-keys the set → no membership flip), `DeskPage.tsx` ~`:1540` | DESK-RENDER-FIXES-PLAN §R2 + Fix 3 · KS-P2 §5I |

> Note: line numbers above are approximate against HEAD 2026-06-18. Treat DESK-RENDER-FIXES-PLAN as the authority and re-grep before editing. B1/B4 are **Sebs-verified ✅**; B2/B3/B5 are coded + tsc-clean and **await Sebs's live re-test** (the only Camera/Render item still open).

**Older camera/framing items (mostly resolved):** 3D auto-framing over-zoom/overflow on long objects (`seltzerCan`/`begleri`/`boardingPassTW`) — addressed `eb99f7c` + `FRAME_FIT_MARGIN 1.18→1.32`; shoe clip-on-rotate fixed. Invalid `?desk=N` silently falls back to OPEN desk with zero signal (🔴 low, Sebs decision).

---

## 2. Fill / Shade

The headline fill rework (raster span-flood pick + gap dilation + polygon-clipping trace) is fully specced in **KS §1A + §4** — the recommended root-cause fix for the nested/starving family. Use it before hand-patching the rows below.

| Bug | Symptom | Root cause | Recommended fix | Status | Cross-ref |
|-----|---------|-----------|-----------------|--------|-----------|
| Nested/concentric pick | Tap inner shape floods whole outer; small enclosed hole fills parent; small interiors starve at low grid res | Global region-tree pick + union-bbox pool under-resolves nested interiors | Per-cluster extraction landed (`9e7f907`) + 400-grid lift (`6d6f882`); proper root fix = **raster span-flood pick** (local to click, gap-tolerant) | 🟡 **tap-inside-small-triangle rides detection but auto-capture flaky** | KS §1A, §1E, §4 · KS §2 |
| 2D shade-brush tone ignored fill-style | Tone fills rendered flat grey regardless of fillStyle (I-2 violation) | Tone-fill path didn't get classifier→fillStyle marks that SVG fills get | `RULE_enclosing_tonal_wash` in `classifier.ts` | 🟢 `ae6e449` (live-verified solid/hachure/crosshatch/dots/zigzag/dashed distinct) | KS §2 |
| Fill clean edge | Fill bleeds past outline + white corner-notches on styled fills | Rasterizer enclose-conform handed outer-shape ink | Clean-edge passes + proximity gate | 🟢 `fb52ea5`,`b96aa6c`,`0b81414` (+ nested proximity gate in DrawSurface) | KS §2 |
| Full-fill reliability | Fill doesn't fill the WHOLE object; ragged/blobby; can't close a slightly-open gap | Marching-squares pick is gap-intolerant | Gap-tolerant raster flood + **dilation gap slider (None/Small/Med/Large ≈1/2/4/8px)** + trace-back via polygon-clipping | 🔴 open | KS §1A steps 1-3 · KS §3 (gap-closer) |
| evenodd DONUT loses hole / floods | Compound donut floods solid under rough/stipple | `extractRegionPath` doesn't propagate `fill-rule`; transformElement splits subpaths into solid discs | Multi-subpath: **polygon-clipping XOR / difference** + emit evenodd compound path. Multi-subpath path DONE+verified (`renderRegion.ts` evenOddRegionPath; catalog-safe, 0 evenodd in 197) | 🟡 multi-subpath done; **self-intersecting single-path (pentagram) + solid-fill-evenodd (github) still wrong** | KS §1B · BROKEN-MAP-STATUS U4 |
| Circle draw + snap won't fully CLOSE | Seam/notch on large circle, overshoot tail on small | Weld tolerance + seam-seal in `shapeFit.ts applyCandidate` | Proportional seam tol `max(8px, 4%·bboxDiag)` (overshoot half-fixed); circle-seam endpoint sub-bug remains. Use **Taubin/Pratt circle fit (not Kasa)** for gap-closed arcs | 🟡 `99d6666` partial | KS §3 (circle fit) · BROKEN-MAP D4 |
| Stipple = hachure on uploads | 'Stipple' SVG-style renders diagonal hachure not dots | Not in `STYLE_OWNS_FILL_GRAMMAR`; stale `fullModifiers.fillStyle` wins (live render uses raw state, not preset) | Add to grammar table + harden state-staleness on upload (`project_f3_styles_must_all_be_real`) | 🔴 open (U1 flows dots on `<g>` uploads; U2 staleness NOT committed) | KS §2 · KS-P2 §4 |

**Fill perf bombs (fixed, keep in mind):** rough.js 'dots' on large dark region → 19.7M-char path freeze (U3, `MAX_DOTS=6000` cap `c9dcf6c`); rose 1.1M-char hachure path — backstop generalized to ALL gap grammars (`MAX_PATH_CHARS=300000`). See **KS-P2 §5G** for the layer-propagation nuance (cap the EXTRA dot layers too, not just the base group).

---

## 3. 3D / svg-port

Two translation chains (north-star 2026-06-15): **straight-3D** (peer style, baseline = clean SVG form) vs **svg-port** (wears the styled 2D, baseline = same 2D style). It's ALL ONE PENCIL — matte ink-black, value from light/density, never hue/gloss. Relief options + inflation are specced in **KS §1C/§1D + KS-P2 §2**.

| Bug | Symptom | Root cause | Recommended fix | Status | Cross-ref |
|-----|---------|-----------|-----------------|--------|-----------|
| svg-port JAGGED RIMS | Carve silhouette spiky/torn rims | Carve read off rasterized markup (RDP-coarse + outline jitter) not a Chaikin-smoothed ring | Route carve through `smoothClosedLoopCornerAware` (3D-1) — simplify-then-corner-aware-smooth | 🔴 open (Sebs confirmed still jagged live) | KS §1E · KS §2 |
| 3D hachureGap HIGH no-cap | At hachureGap HIGH (30px) tone band renders to nothing on 192/197 (SA-2) | LOW floor but NO HIGH cap; 2D's 12px cap not ported to the 3D shader | ~30-min one-shader-line cap in `hatchMaterial.ts` | 🔴 open — **highest-volume 3D defect (76% of 3D breaks)** | KS §2 (RC-1 3D) |
| Black-blob line-art | Extrude/Solid fuse line-art into a featureless black slab | Fuse modes lose interior detail; black-on-black; old 60-stroke cap dropped half the marks | Etching (`detailLines` light incised lines, R10c) + Auto biases line-art→Rod/Inflate + cap 60→220 (done). Extrude/Solid fidelity pass still owed when explicitly picked | 🟡 etch+cap done; **Extrude/Solid blob-when-picked still owed** | KS-P2 §2 · CRAFT-VISUAL-PASS |
| svg-port v1 deep relief | Functional but not deep geometric 3-treatment relief (engrave/indent/raise) | Relief reads via shading/normal, not sealed-mesh geometry | Sealed watertight mesh (front+skirt+back, mergeVertices) + CSG (manifold-3d / three-bvh-csg) | ⏸️ **post-makeathon** (Sebs: v1 LOCKED, stop blind-tuning) | 3D-SVGPORT-POSTMAKEATHON.md · KS §1C/§1D |
| Pressure slider dead (Inflate) | Pressure toggle changes nothing on mouse/SVG input | Mouse/SVG write constant 0.5 → `(p-0.5)=0` zeroes modulation | Treat a flat channel (max−min ≤0.02) as "no pressure" → synth from curvature (`strokeTo3d.ts buildInflateGeometry`) | 🟢 fixed + verified 2026-06-15 (spiral fattens at bends) | SESSION-HANDOFF 3D status |
| RC-2 open-tangle guard | Solid mode buries interior on open/tangled strokes | `buildPoolSolidGeometry` openness | solid-buries-interior fixed (`4dba28a`); openness guard still flags P1 | 🟡 partial | KS §2 |
| WebGL context loss | 3D throw white-screens the surface; no `webglcontextlost` listener/fallback | Cold-load context race in Make preview iframe (+ no listener locally) | Self-healing auto-retry `Canvas3DBoundary` (backoff remount) — DONE + Make-validated for homepage/desk/drawer/mounts. Still no explicit `webglcontextlost` listener in `Stroke3DScene.tsx` | 🟡 boundary done; **explicit context-lost listener open** | KS-P2 §5A · SESSION-HANDOFF R10d |
| Stroke toggles → 3D | wobble/jaggedness/multiStroke etc. changed 2D but were byte-identical in svg-port 3D | `detailLines` built from RAW strokes | Build detailLines from STYLED markup, strip `[data-smart-hachure]` first, lift etch z above cap peak | 🟢 fixed 2026-06-16 (9/9 sliders + categoricals distinct) | SESSION-HANDOFF R10k · KS-P2 §5 |

**Many-objects-in-3D (shipped, see KS-P2 §5):** per-object `<Canvas>` exhausted WebGL contexts → crash; fixed via ONE shared canvas + N drei `<View>` scissored viewports (`MultiStroke3D.tsx`). Per-object rotate binding implemented, **NOT real-mouse verified** (synthetic drags can't drive controls). Export GLB/SVG/PNG done.

---

## 4. Image-upload / AI-mesh

Three SEPARATE conversion filters (R11): raster→Quiver SVG · vector .svg→match-us simplify · raster→3D mesh (fal/TRELLIS). Reuse-the-SVG-path principle in **KS-P2 §6B**.

| Bug | Symptom | Root cause | Recommended fix | Status | Cross-ref |
|-----|---------|-----------|-----------------|--------|-----------|
| Image render blobs under fill | Smart-pick chooses rough+dense cross-hatch for images → dense blob | `fillStyle:hachure` fills regions densely regardless; dark-everything → rough hachures solid | Images default to CLEAN (lines + flat greyscale); fill as a dial; needs a value RANGE not crushed darks | 🟡 DrawPanel defaults image→Clean (done); **smart-pick behavior for image-class = design call** | RUNNING-TODO R11 · 🔵 main chat |
| AI-mesh empty 3D well | Modal 3D well looked empty after "✓" | Capture-timing artifact — chip flips on `hardMeshUrl` set, GLB still streaming | Use the LOCAL form as the Suspense fallback (`localForm`) while GLB streams | 🟢 fixed (proof forcemesh-well.png) | KS-P2 §6A |
| AI-mesh material MODE toggle | AI-mesh objects can't switch OG-PBR ↔ our greyscale/ink | Toggle set never built (3rd toggle set: native/svg-port/AI-mesh) | Add material-mode toggle in Canvas3DChrome (HardMesh already takes `materialMode`) | 🔴 open | RUNNING-TODO R11 |
| Edge-fn cache not written | Every regen of same doodle pays again | `image-to-3d` read `mesh_cache` but never WROTE it; result GET lacked contentHash | `fetchMeshResult` appends `&contentHash=`; `writeCache()` upserts after rehost | 🟡 CODED; **needs `supabase functions deploy image-to-3d` + mesh_cache table (Sebs-side)** | KS-P2 §6C |
| SVG simplify-mode toggle UI | off/filled/line modes exist as libs but no UI | `applyUploadSimplify` + `centerline.ts` ready, no DrawSurface/DrawPanel UI | Wire the toggle + handler branch in both surfaces | 🔴 open | RUNNING-TODO R11-cont |
| TRELLIS on flat doodles | AI mesh = generic box/cup for flat doodles | TRELLIS domain is PHOTOS not doodles | Hard-path sends the ORIGINAL PHOTO (`sourceImage`), not the rasterized doodle; local-3D stays the doodle default | ⏸️ architecture decided; gated on real-photo testing (Sebs-side) | SESSION-HANDOFF R10n |

---

## 5. Save / Persistence / Supabase

Persist sites: `publish.ts` (`publish_to_open_desk`), `personalSpace.ts` (RPCs), `ObjectSurface.tsx handleDone` → `updateDoodleConfig`. The "code-quality pass" flagged stale-state + async-save as the architecture debt.

| Bug | Symptom | Root cause | Recommended fix | Status | Cross-ref |
|-----|---------|-----------|-----------------|--------|-----------|
| Async-save closure capture | Saving mid-edit can persist stale `surfStyle`/`surfMods`/`baseline` | `handleDone` (`ObjectSurface.tsx:885`) + `handleRedrawDone` persist closure-captured config across an `await` | Read edited config from REFS at write time, OR hard-disable Save during the in-flight write | 🔴 open (architecture debt) | CODE-QUALITY-PASS · DESK-RENDER-FIXES-PLAN Fix 3 |
| 2D/3D toggle was a no-op Save | Toggling 3D + Save didn't persist | The toggle never marked the config dirty | Toggle now marks `render_config` dirty (per-object `is3d`); desk/drawer render via `force3dIds`/`rowIs3d` | 🟢 fixed R12 (tsc-clean, **Sebs live-verify pending**) | SESSION-HANDOFF R12 |
| Drawer save read stale DB | Drawer re-fetched DB before ObjectSurface's await-write landed | Read-before-write race | Optimistic — patch the row locally on `onConfigSave`/`onObjectUpdate` | 🟢 fixed R12 | SESSION-HANDOFF R12 |
| Local-3D + AI-mesh look persistence | 3D edits (geometry mode/material) didn't reappear for saved objects | Look never written to `render_config` | `Geometry3DSync` + `AiMeshLookSync` seed context + capture to ref + mark dirty → handleDone writes `config.geometry3d`/`config.aiMesh`; desk/drawer resolve per-object w/ context fallback | 🟢 fixed R12 (**Sebs live-verify pending**) | SESSION-HANDOFF R12 |
| contentHash crashes insecure ctx | PUBLISH crashes in a non-secure context (judge-env variable) | `crypto.subtle.digest('SHA-1')` unguarded (`contentHash.ts:27`) | Add a pure-JS SHA-1 fallback when `crypto.subtle` is unavailable | 🔴 open | KS §2 |
| personalSpace read helpers ungated | Flag-on-before-migrations fires 404/400 on every /desk mount | Reads don't gate on `isPersonalSpaceDbReady()` | Gate read helpers; degrade silently (default-OFF already clean) | 🔴 open (clean safe fix) | KS §2 · RUNNING-TODO U1 |
| Conversion cache never read | content_hash stamped but never used as a cache key | No OPFS/IndexedDB cache layer (CLAUDE.md headline unbuilt) | Build a thin OPFS/IndexedDB cache, or reframe the wedge claim | ⏸️ open (H2) | KS §3 (planned) |

---

## 6. Personal-space

Built + DB-verified: claim_handle, private desks, drawer/shelf RPCs (SESSION-HANDOFF "PERSONAL SPACE DB VERIFIED"). The IA is built; the open items are routing + side-panel population.

| Bug | Symptom | Root cause | Recommended fix | Status | Cross-ref |
|-----|---------|-----------|-----------------|--------|-----------|
| Save ROUTING incomplete | Drawings only save to shelf; nothing routes to drawer; private desk should ASK drawer/shelf/both | Publish/save routing subsystem not wired for the ask | Build the dest-ask on draw/Place; stash-to-drawer + publishToPrivateDesk routing | 🔴 open — its own pass | SESSION-HANDOFF R12 #1 |
| Side-panel doesn't populate | Desk LEFT side-panel empty until Expand | Panel doesn't show shelf (public) / drawer (private); only Expand → /drawer works | Populate the side panel from shelf/drawer; Expand → bigger /drawer page | 🔴 open | SESSION-HANDOFF R12 #1 |
| Re-draw for uploaded Quiver SVGs | Edit modal gates Re-draw on `storedStrokes` which uploads lack | No backdrop-draw path for uploads in the edit card | Add a backdrop-draw path (create page already does it) | 🟡 open | SESSION-HANDOFF R12 #3 |

---

## 7. Drag / Drop

| Bug | Symptom | Root cause | Recommended fix | Status | Cross-ref |
|-----|---------|-----------|-----------------|--------|-----------|
| Stale-drag closures | Drag across the desk during a pan → stale jump/teleport; handler churn defeats child memo | `handlePointerMove` (`DeskPage.tsx:2321`) + `handlePointerUp` (`:2352`) read `objects`/`draggingId` from CLOSURE | Switch to the existing `objectsRef` (`:939`) / `draggingIdRef` (`:1423`) refs at event time | 🔴 open (architecture debt) | DESK-RENDER-FIXES-PLAN Fix 3 · OPT-ANTI-LAG §1 |
| Custom drag follower scope | Card flies on drag; Sebs wants the OBJECT to pop OFF the card (doodle lifts, not whole card) | Make-side PersonalDrawer drag-follower renders a whole styled card | Port the Make drag-follower, modify to lift only the doodle off its dimmed card | 🔴 open (needs the Make code) | CODE-QUALITY-PASS (Figma Make additions) |

**Resolved drag items:** Place→move→disappears (`c6b087e`); demo-wall add no longer bounces to the real desk (`isDemoWall` short-circuit).

---

## 8. Misc / robustness

| Bug | Symptom | Root cause | Recommended fix | Status | Cross-ref |
|-----|---------|-----------|-----------------|--------|-----------|
| O(n²) sibling pass uncapped | A large innocent upload (10k siblings) hangs the tab on classify | `signals.ts:197` sibling pass has no element-count cap (quadratic) | Add an element-count cap / early-out on large sibling sets | 🔴 open (H5, high) | KS §2 |
| `<use>`/`<symbol>` dropped | Icon-system SVGs render empty | `signals.ts normalizeTag`/`SKIP_TAGS` drops instantiation | Instantiate `<use>`/`<symbol>` before classify | 🔴 open (H7, med) | KS §2 |
| Elongated drawing shifts out of view | SKETCH→STYLE shifts an elongated drawing off-screen (CASE-3) | Percentage-source hosts; fix understood, not re-implemented on HEAD | Wrapper+inner hosts fill 100% (re-implement on current `SvgStyleTransform`) | 🔴 open (med) | KS §2 · RUNNING-TODO |
| learnedProvider DEAD | 92.7% signals model exists but default chain = rules only | `index.ts:194` = `[ruleEngineProvider]`; gated behind golden-v3 bless | Wire `[ruleEngineProvider, learnedProvider]` (v2 signals-only artifact) + isotonic calibration AFTER golden-v3 re-bless | ⏸️ correctly deferred (honesty gates) | KS-P2 §4 |
| Two decision-log channels dropped | `shadeFillLog.ts` + `shapeSnapLog.ts` not in KNOWN_SOURCES → feed-dataset drops them | Missing adapters/entries (violates keep-feeding-smart-ml) | Add adapters + KNOWN_SOURCES entries (shade-fill carries `darknessL`) | 🔴 open (med) | KS §2 · feedback_keep_feeding_smart_ml |
| `/playground` 3D toggle dead | Button highlights, no canvas mounts | Dead control | Honesty-gate or wire (safe-fix prepared) | 🔴 open (low) | KS §2 · RUNNING-TODO S1 |
| Single tap → no feedback | Single dot/tap → zero strokes, silent (TAP_SLOP_PX=6) | By-design, no micro-feedback | Allow dot marks or micro-feedback | 🔴 open (low, O5) | KS §2 |
| Off-canvas drag selects UI text | Dragging off-canvas selects chrome text | No `user-select:none` on canvas chrome | Add `user-select:none` | 🔴 open (low, O6) | KS §2 |
| No responsive/mobile layout | `/canvas` hardcoded 280/360; `/desk` chrome > viewport ≤400px | Desktop-first scope gap | Responsive pass (or accept — demo is desktop) | ⏸️ open (low, Sebs in/out) | KS §2 · RUNNING-TODO O3 |
| `/public` placeholder | Marketing copy + CTA, not the real surface | Real surface is /desk + /desks | Relabel/redirect | ⏸️ open (low, gap/relabel) | KS §2 |
| github nonzero-winding knockout | Detailed knockout logo floods as solid blob | Nonzero-winding multi-subpath; U4 only covers evenodd | Leave as a known-rough STRESS fixture (north-star = real doodles, not logos) | ⏸️ parked (Sebs-ratified) | BROKEN-MAP-STATUS · SESSION-HANDOFF R10m |
| default-black icon fill | no-fill icons (github/x/nintendo) render outline-only | SVG-default-black guarded in `signals.ts` | Scoped to UPLOADS only (`svgUpload.ts normalizeDefaultBlackFills`) — catalog untouched by construction; revisit globally only if a demo leans on logos | ⏸️ parked (defer; would shift 13 locked-catalog objects globally) | BROKEN-MAP-STATUS · SESSION-HANDOFF R10e/R10m |

---

## Cross-doc map

| Working on… | Read |
|---|---|
| The bug index (this doc) | **ALL-BUGS-AND-FIXES.md** |
| The proven algorithm for a fix | **KNOWN-SOLUTIONS.md** + **KNOWN-SOLUTIONS-PART2.md** |
| Desk-canvas zoom/pan/3D-stream root causes + ordered plan | **DESK-RENDER-FIXES-PLAN.md** |
| Performance / lag without regressing quality | **OPTIMIZATION-ANTI-LAG.md** |
| Live re-diagnosed broken-map (upload/evenodd status) | **BROKEN-MAP-STATUS.md** |
| Architecture debt (stale-state, unnecessary effects) | **CODE-QUALITY-PASS.md** |
| Per-bug detailed traces (historical) | **FIX-SPECS-remaining.md**, FIX-SPEC-*.md, GAP-HUNT.md, EXHAUSTIVE-AUDIT.md, EXHAUSTIVE-3D-AUDIT.md |

**Standing law before any "fixed":** baseline `:5182` screenshot → apply → re-screenshot → diff (6 shape classes; full sweep if smartHachure/SvgStyleTransform touched) per `feedback_never_declare_fixed_without_regression_check`. Live, not headless (`feedback_live_check_not_headless_harness`). Every audit/sweep result feeds `datasets/smart-layer.dataset.jsonl` (`feedback_keep_feeding_smart_ml`).
