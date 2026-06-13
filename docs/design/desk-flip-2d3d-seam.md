# Desk 2D↔3D Flip Seam — design + scaffold (gap-hunt H3)

**Status:** SCAFFOLD landed (additive, tsc-green, nothing wired into hot files). Build-vs-cheap-path decision is Sebs's — see §6.
**Gap:** `docs/submission/GAP-HUNT.md` row **H3** — *"2D↔3D flip on a PLACED desk object is architecturally absent."*
**Reads against real code:** `DeskPage.tsx`, `ObjectSurface.tsx`, `publish.ts`, `DeskDoodlesCanvas.tsx`, `canvas3d/Stroke3DScene.tsx`, `state/Canvas3DContext.tsx`, `lib/geometry3d/{strokeTo3d,convert,markIntent}.ts`, `components/canvas3d/{modeParams,materials3d,hatchMaterial}.ts`.
**Cited precedent:** `docs/design/3d-roundtrip-build-plan.md` (§0 ground truth, §6.2 stretch slice), `docs/design/object-model-and-desk-architecture.md` (§1 "grow the record one field at a time"), `docs/design/global-toggles-and-mixed-3d.md` (D-7: objects keep own mode; mode-flip converts FROM THE RECORD).

---

## 1. The gap, precisely

The flip is real but lives in exactly ONE place: **`/canvas`**. `DeskDoodlesCanvas.tsx` holds a `mode: 'svg' | '3d'` tab, lazy-loads `Stroke3DScene`, and feeds it the **live in-memory `strokes3d`** plus the `Canvas3DContext` values (`geometryMode`, `style3d`, `materialPreset`, `nativeProps`, `modeParams`). Flipping the tab re-renders the same live strokes as 3D. There is no record, no persistence — it converts whatever the draw surface currently holds.

A **placed desk object** cannot flip because:

| Missing piece | Evidence |
|---|---|
| No render-mode on the record | `DeskObject` (DeskPage.tsx:188) and `DoodleRow` (publish.ts:31) carry no `render_mode` — *grep empty*. |
| No 3D config on the record | No `geometry3d` field anywhere on the object. |
| No convert action in Edit | `ObjectSurface` footer = Delete · Re-draw · Done. No flip control. |
| No 3D mount on the desk | `DeskObjectArt` (DeskPage.tsx:285) only ever renders the 2D `SvgStyleTransform` subtree. |

This is **the demo climax** (3d-roundtrip §13 wedge: *"the user's hand survives the round-trip"*). On the desk today, it has no code path at all.

## 2. What makes this CHEAP to close (the load-bearing discovery)

Two existing contracts mean the **data half is almost free**:

1. **`render_config.strokes` already exists on drawn objects.** The strokes-in-the-record contract (DeskPage.tsx ~98) persists the raw perfect-freehand strokes into `render_config` at the Done boundary. `Stroke3DScene` rebuilds geometry deterministically from exactly those strokes. So **a drawn object already carries its 3D source** — nothing to add to make it flippable except the flag.
2. **`render_config` already passes unknown fields through, end-to-end, typed as `Record<string, unknown>`.** publishDoodle / updateDoodleConfig / updateDoodleSvg / realtime all treat it as opaque jsonb (publish.ts:44/73/494/517). Both parsers do `return { ...rec, svgStyle, modifiers }` (DeskPage.tsx:157, ObjectSurface.tsx:139) — **spread-then-override, so new top-level fields survive every round-trip untouched, today, with no parser change.**

**Therefore: no DB migration, no schema paste, no new RPC, no publish.ts change.** `renderMode` + `geometry3d` ride the same jsonb as `strokes`. The 3D config stores *inputs* (geometryMode/style3d/modeParams), **never a baked mesh** — the scene rebuilds from strokes on mount (keeps the record tiny, cache-stable, re-stylable for S12/S13 Unify).

## 3. The scaffold (NEW files only — all additive, tsc-green)

| File | Role |
|---|---|
| `src/app/lib/geometry3d/deskRenderMode.ts` | The record extension + resolvers. `DeskRenderMode` (`'2d'\|'3d'`), `Geometry3DConfig` (optional 3D inputs mirroring Stroke3DScene props), `RenderModeRecordFields` (the two optional fields to `&`-extend the hot config types). Pure resolvers: `resolveRenderMode` (anything ≠ `'3d'` ⇒ `'2d'`), `flipEligibility` (drawn ⇒ canFlip; upload-only ⇒ honest no-strokes note), `resolveScene3DInputs` (partial config → full Stroke3DScene prop bundle, same fallbacks as Canvas3DContext), `snapshotGeometry3DConfig` (live picks → minimal record). Type-only on three. |
| `src/app/components/DeskDoodles/DeskObject3DMount.tsx` | **The desk 3D mount (§"desk needs to mount the 3D scene").** Lazy-loads `../canvas3d` (keeps three out of /desk's main chunk, same discipline as DeskDoodlesCanvas), resolves the record's config, renders `Stroke3DSceneLazy` in the object's footprint. `interactive` prop (default false — see the orbit decision §6). |
| `src/app/components/DeskDoodles/ObjectConvertAction.tsx` | **The convert action seam.** `buildFlipFields(state, to, livePicks)` (pure — returns the record fields to merge into the persist path) + `<ObjectConvertAction>` (one pill; honest note when not flippable). Drops into ObjectSurface's control column with one import. |

### The seam, end to end

```
[ObjectSurface Edit]  user clicks "Flip to 3D"
   → buildFlipFields(state, '3d')  →  { renderMode:'3d', geometry3d:{…} }
   → merge into the SurfaceRenderConfig handleDone already builds
   → updateDoodleConfig(rowId, config)        ← EXISTING persist, no change
   → onConfigSave(config)                      ← EXISTING optimistic re-pin
[DeskPage] object.renderConfig now has renderMode:'3d'
   → DeskObjectArt branches on renderMode
   → renderMode==='3d'  →  <DeskObject3DMount strokes={cfg.strokes} config={cfg.geometry3d}/>
   → else                →  the existing 2D SvgStyleTransform subtree (unchanged)
```

## 4. Wiring to flag (the one-liners in HOT files — DO NOT auto-apply)

DeskPage.tsx, ObjectSurface.tsx are under active edit (round ledger). Each wiring point is small and isolated:

1. **DeskPage.tsx — `ObjectRenderConfig` type** (~105): add the optional fields by intersecting the existing type with `RenderModeRecordFields` (the index signature already admits them at runtime; this only surfaces them typed for the render branch).
2. **DeskPage.tsx — `DeskObjectArt` render** (~294): one branch — `resolveRenderMode(renderConfig?.renderMode) === '3d'` → `<DeskObject3DMount strokes={renderConfig.strokes as StrokeInputPoint[][]} config={renderConfig.geometry3d}/>`; else the existing 2D subtree. (Note: the 3D mount sits *inside* the same positioned wrapper, so drag/scatter/rotation already apply.)
3. **ObjectSurface.tsx — `SurfaceRenderConfig` type** (~78): same `& RenderModeRecordFields`.
4. **ObjectSurface.tsx — render `<ObjectConvertAction>`** in the control column / footer, wired to a handler that merges `buildFlipFields(...)` into the config it persists at Done (it already persists the whole config; this adds two keys).
5. **publish.ts — typed surfacing only (OPTIONAL, cosmetic):** the carry already works (it's `Record<string,unknown>`). If desired, add `renderMode?`/`geometry3d?` to `DoodleRow`/`PublishDoodleInput` for type ergonomics — purely additive, behavior-identical.

**Nothing else.** No edits to classifier.ts/index.ts (smartHachure), SvgStyleTransform, canvas3d render, or the draw panel — confirmed none are on this path.

## 5. Why the record stores inputs, not geometry

`Stroke3DScene` is deterministic: same `(strokes, geometryMode, style3d, modeParams)` → same mesh (Stroke3DScene.tsx determinism note). Storing a serialized mesh would (a) bloat the record past the 64KB svg cap, (b) freeze the object out of restyle (S12/S13 Unify re-applies config without re-generating — object-model §1), (c) break the wedge (the *hand* must survive, i.e. the strokes). So the record stores the same small input bundle the /canvas context holds. The /canvas flip and the desk flip become **the same scene fed from two sources** (live context vs record).

## 6. Decisions for Sebs

**D-FLIP-1 — Build the desk flip, or demo on /canvas (the cheap path)?**
- *Build it:* the climax happens on the real product surface (a doodle ON the desk lifts into 3D), strongest for Grand/Runner + Innovative-Workflow. The data half is nearly free (§2); the work is the two render/action seams + the orbit decision below.
- *Demo on /canvas:* zero new wiring — the flip already works there with live strokes. Honest, but the climax happens in the "drawing primitive's test surface", not the product (the desk). Weaker demo read.
- **Recommendation: build it — it's cheaper than it looks** because strokes + the jsonb passthrough already exist. The scaffold reduces the build to ~5 flagged one-liners + the orbit call.

**D-FLIP-2 — Minimal build scope (if building):**
1. Surface the two optional fields on the hot config types (`& RenderModeRecordFields`).
2. Branch `DeskObjectArt` on `renderMode` → `DeskObject3DMount`.
3. Add `<ObjectConvertAction>` to ObjectSurface + merge `buildFlipFields` into the existing Done persist.
4. Pick the orbit model (D-FLIP-3).
That is the whole MVP. Drawn objects flip; upload-only objects show the honest note (vision-router hard path stays out).

**D-FLIP-3 — Desk 3D interaction model (the one real design question):**
- *Still render (scaffold default, `interactive=false`):* each 3D object is a lit still in its footprint — cheap, deterministic, N objects fine.
- *Per-object orbit:* each 3D object is its own live R3F canvas with OrbitControls — N live canvases is a perf question (plan §5 risk 6 budgets ONE composer pass; realistic desks are small but uncapped).
- *Shared desk camera:* one 3D context the whole desk tilts in — richest, biggest build (a desk-wide camera rig, out of MVP).
- **Recommendation: ship still-render for the flip MVP; add per-object orbit-on-hover as a fast follow if a desk stays small.** Bring the call to the same review as D-FLIP-1.

**D-FLIP-4 — Persist the arrow-rule chip corrections per object?** The scaffold's `Geometry3DConfig.treatAsClosed` carries them (Rock X named this as "rides the conversion-wiring round"). Cheap to keep; confirm it's wanted on the record vs scene-local only.
