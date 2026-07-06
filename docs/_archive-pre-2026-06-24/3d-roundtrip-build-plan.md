# 3D Round-Trip — Build Plan (Rod + Extrude + screen-space hatch NPR)

**Date:** 2026-06-11 · **Status:** PLAN ONLY — no code written. Builder starts from here.
**Contract:** `docs/research/21-research-3d-pipeline-and-style-translation.md` v1.2 (LOCKED). Every decision below cites its section. This plan implements the **easy path** (§5b Rod + Extrude) + the **NPR post-process** (§7 choice (c)) and wires the existing 3D honesty gate. Hard path (vision-LLM router + Tripo/TRELLIS, §8) is out of this plan's scope — it plugs into the same scene mount later.
**The wedge (§13):** the user's hand survives the round-trip — drawn strokes become 3D form, and the 3D form re-renders in marks of the same family (hatch NPR driven by the SAME Shading-cluster modifiers the 2D pipeline uses).

---

## 0. Ground truth — where strokes live today (read 2026-06-11)

| Fact | Where |
|---|---|
| Raw points type | `DrawSurface.tsx:13-14` — `StrokePoint = [x, y, pressure]`, `Stroke = { id, points }` (perfect-freehand input shape) |
| Points captured | `DrawSurface.tsx:82-89` — `strokes` + `current` useState; `eventToSvgPoint` (line 144) maps pointer → 800×600 viewBox coords via inverse screen CTM |
| /canvas Done | `commitDrawing` (line 185) only flips `committed=true` — **raw points STAY in state**. Flip-to-3D on /canvas can read them directly. |
| /desk Done | `DrawPanel.tsx:23-46 strokesToObjectMarkup()` → SVG markup string → `onDone(svgMarkup)` (line 84-90) → `DeskPage` `DeskObject.svgMarkup` → Supabase `doodles.svg`. **Raw points are DISCARDED at this boundary.** (Sebs already flagged: "EDIT-after-place needs stroke retention" — same slice.) |
| Honesty gate | Overlay at `DrawSurface.tsx:427-451` ("3D mode lands Day 11"), drawing disabled at line 163 (`if (input !== 'draw' || mode === '3d') return`). `mode` state lives at `DeskDoodlesCanvas.tsx:17`, set by the header 2D/3D tablist (lines 74-101), passed as prop at line 212. |
| 2D style state the NPR shader needs | `F3RoughModifiersContext.tsx` — `hachureGap` (0.5-30, default 4), `hachureAngle` (-90..90, default -41), `inkIntensity` (0-1), `strokeWidth`, `fillStyle`; `F3SvgStyleContext.tsx` — the 11-style enum. Both providers mount in `App.tsx:22-23`, so any component under the router can read them. |
| 3D deps | `package.json`: `three@^0.169`, `@react-three/fiber@^8.17.10`, `@react-three/drei@^9.114`, `@react-three/cannon@^6.6`, `cannon-es@^0.20` installed, **zero imports in src/ today** (verified by grep). `@react-three/postprocessing` NOT installed. |
| Make verification | `docs/locked-refs/.../20-research-figma-make-capabilities.md` lines 210-224: three ✅ / fiber ✅ / drei ✅ VERIFIED clean in Make 2026-06-05. Rapier ❌ banned (WASM cold-load race). cannon-es = the locked physics lib. |

**MVP surface = /canvas** (points still in state there). /desk per-object 3D = stretch (needs the stroke-retention slice, §6 below).

---

## 1. Data path: strokes → 3D geometry (Rod + Extrude)

All geometry code is NEW files — nothing imports from or into `SvgStyleTransform.tsx` / `lib/smartHachure/` (zero collision with the 2D pipeline).

### 1.1 `src/app/lib/geometry3d/strokeTo3d.ts` (NEW — pure functions, no React/DOM)

```
VIEWBOX (800×600, y-down) ──normalize──▶ world space (y-up, centered, ~8 units wide)
Stroke.points ──rdp simplify──▶ anchors ──closed?──▶ Rod (open) | Extrude (closed)
```

Functions to write:

- `rdpPoints(points: StrokePoint[], epsilon = 3.0): StrokePoint[]`
  Local Ramer-Douglas-Peucker copy (~30 LOC). NOTE: an `rdp()` exists inside `SvgStyleTransform.tsx` but is module-private; **duplicate it here with a provenance comment** rather than exporting from the 2D pipeline file — keeps the 2D file untouched. ε=3.0 matches the 2D canonical ε (research doc 22's dispatch-freeze value).
- `normalizeStrokePoints(points: StrokePoint[], viewBox: {w,h}, scale = 0.01): THREE.Vector3[]`
  `x' = (x − w/2) · scale`, `y' = −(y − h/2) · scale`, `z = 0`. 800px → 8 world units. Pressure (index 2) is carried through in a parallel array for the stretch radius-modulation; ignored in MVP.
- `isClosedStroke(points: StrokePoint[]): boolean`
  Endpoint gap < max(24 viewBox px, 8% of stroke bbox diagonal) → closed. Drives auto mode pick.
- `pickGeometryMode(stroke: Stroke): 'rod' | 'extrude'`
  closed → extrude, open → rod (§5b "default Rod for open, Extrude for closed" — the Phase-D auto-pick; user toggle overrides per I-1 spirit).
- `buildRodGeometry(world: THREE.Vector3[], opts: { radius?: number; closed?: boolean }): THREE.TubeGeometry`
  `new THREE.CatmullRomCurve3(world, closed, 'centripetal', 0.5)`; `tubularSegments = min(world.length * 3, 512)`; `radius` default **0.05** world units; `radialSegments = 10` (§5b performance budget: 8-12 thin, 16 hero). Endpoint caps: two `SphereGeometry(radius)` positions returned alongside (render as sibling meshes — simpler than CSG merge). Joint spheres at ≥40° corners = stretch.
- `buildExtrudeGeometry(world: THREE.Vector3[], opts: { depth?: number }): THREE.ExtrudeGeometry`
  `new THREE.Shape(world.map(v => new THREE.Vector2(v.x, v.y)))` (auto-append first point if not closed); `{ depth: 0.5, bevelEnabled: true, bevelSize: 0.02, bevelSegments: 2, curveSegments: 12 }` (§5b sketch). **Wrap in try/catch** — self-intersecting shapes can throw in triangulation → fall back to `buildRodGeometry` for that stroke (honest degradation, no crash).
- `strokesKey(strokes: Stroke[]): string`
  Cheap sync key (join of `id:length`) for `useMemo` deps. (Don't use `lib/contentHash` — it's async SHA-1; overkill for a render memo.)

### 1.2 Per-stroke, not per-drawing

Each `Stroke` in the pool becomes its own mesh (matches the 2D commit layer, one `<path>` per stroke). A 5-stroke doodle → 5 meshes grouped under one `<group>` so OrbitControls orbit the whole doodle. Group centered at origin by the normalize step (whole-pool bbox center, not per-stroke center — preserves relative layout).

---

## 2. Scene mount + wiring the existing 3D toggle

### 2.1 `src/app/components/three/Doodle3DScene.tsx` (NEW — default export, for `React.lazy`)

```tsx
// Props
{ strokes: Stroke[]; viewBox: { w: number; h: number };
  geometryMode: 'auto' | 'rod' | 'extrude'; style3d: 'native' | 'hatch' }
```

- `<Canvas dpr={[1, 2]} camera={{ position: [0, 1.5, 7], fov: 40 }} gl={{ antialias: true }}>`
- Background = warm paper: resolve `--dir-bg` ONCE via `getComputedStyle(document.documentElement)` at mount and pass as `<color attach="background" args={[resolved]} />`. **Never hand `var(--dir-bg)` strings to three** — WebGL doesn't read CSS vars (same family as `feedback_media_overlay_ink_doesnt_flip`).
- Lights: `<ambientLight intensity={0.6} />` + one `<directionalLight position={[3, 5, 4]} intensity={1.2} />`. Lighting matters: the hatch effect quantizes **lit luminance** into bands, so the directional key is what makes box faces hatch at different densities.
- drei `<OrbitControls makeDefault enableDamping />` (verified Make-clean 2026-06-05).
- `<StrokeMeshes strokes geometryMode />` (below).
- `{style3d === 'hatch' && <HatchPostProcess />}`.

### 2.2 `src/app/components/three/StrokeMeshes.tsx` (NEW)

`RodMesh` + `ExtrudeMesh` components. Each: `useMemo(() => build…Geometry(...), [strokesKey, params])` + **explicit `geometry.dispose()` in the effect cleanup** — programmatic geometries don't auto-dispose (§5b R3F gotcha, verbatim). Material MVP: `<meshStandardMaterial color={inkSoft} roughness={0.85} />` — a warm clay read; the hatch pass restyles it anyway.

### 2.3 Wiring the honesty gate — EDIT `DrawSurface.tsx`

The ONLY 2D-pipeline file edit. Surgical swap inside the existing `mode === '3d'` cover (lines 427-451):

1. Keep the absolutely-positioned cover div (it already preserves 2D state underneath and blocks the pointer-capture svg — exactly what OrbitControls needs; set `pointerEvents: 'auto'` explicitly).
2. Inside it, replace the placeholder copy with:
   - `strokes.length > 0` → `<Suspense fallback={<Spinner3D/>}><Doodle3DScene strokes={strokes} viewBox={{w:800,h:600}} geometryMode={...} style3d={...} /></Suspense>` where `Doodle3DScene` is `React.lazy(() => import('../three/Doodle3DScene'))`.
   - `strokes.length === 0 && uploadedSvg` → honest note: "Upload→3D is the hard path — coming with the vision router. Draw strokes to see Rod/Extrude." (no stub, per `project_f3_styles_must_all_be_real` spirit).
   - nothing drawn → "Draw in 2D first, then flip to 3D."
3. The early-return at line 163 (`mode === '3d'` blocks drawing) stays — correct behavior.
4. Works in BOTH committed and uncommitted states: the `strokes` pool persists across Done on /canvas, so 2D→Done→flip-3D and draw→flip-3D both render.

`React.lazy` keeps three+drei (~600KB gz) out of the main chunk — /desk and 2D-only sessions never pay it. **Make watch item:** lazy chunks are standard Vite output but untested in Make preview — verify at Make checkpoint #2; fallback = switch to a static import (bigger bundle, zero risk).

### 2.4 3D chrome — EDIT `DeskDoodlesCanvas.tsx` + NEW `Canvas3DContext.tsx`

Per `feedback_toggles_always_in_chrome` (ALL toggles live in shell chrome, never in cell/design) and research §9's "always-visible row":

- NEW `src/app/state/Canvas3DContext.tsx` — `{ geometryMode: 'auto' | 'rod' | 'extrude'; style3d: 'native' | 'hatch' }` + provider + `useCanvas3D()` hook. Pattern-copy `F3SvgStyleContext.tsx` (67 lines — the house template). Defaults: `auto`, `hatch` (the wedge look is the first impression).
- EDIT `App.tsx` — mount `<Canvas3DProvider>` alongside the existing providers (lines 22-23).
- EDIT `DeskDoodlesCanvas.tsx` — when `mode === '3d'`, render next to the 2D/3D tablist in the header: a 3-pill Geometry row (`Auto · Rod · Extrude`) + a Style pill pair (`Native · Hatch`). Reuse the existing tablist pill idiom (lines 74-101). **List ONLY real options** — no greyed `SVG port` / `Solid` / `Inflate` stubs (per `project_f3_styles_must_all_be_real`).
- `DrawSurface` reads `useCanvas3D()` directly (it already lives under the providers) — no new props through `DeskDoodlesCanvas`, keeping the /desk `DrawPanel` host signature untouched.

The hatch effect's parameters need **no new chrome at all**: it reads the existing Shading cluster (`hachureAngle`, `hachureGap`, `inkIntensity`, `strokeWidth`) from `useF3RoughModifiers()` — the same sliders restyle 2D and 3D. That shared-control moment IS the round-trip demo beat.

---

## 3. Screen-space hatching NPR (research §7 choice (c) — LOCKED)

### 3.1 Architecture

`@react-three/postprocessing` `<EffectComposer>` + ONE custom `Effect` subclass. Post-process runs after render; cannon-es (if/when added) is unaffected (§7).

- NEW `src/app/lib/geometry3d/hatchEffect.ts` — `class HatchEffect extends Effect` (from the `postprocessing` package): fragment shader string + uniform `Map`, with plain setters (`setAngle`, `setGap`, …).
- NEW `src/app/components/three/HatchPostProcess.tsx` — mounts `<EffectComposer><primitive object={effect} /></EffectComposer>`; a `useEffect` (not per-frame) copies `useF3RoughModifiers()` values into the uniforms whenever sliders move.

### 3.2 Uniforms (from research §7 sketch, MVP-trimmed)

| Uniform | Type | Source | MVP |
|---|---|---|---|
| `u_hachureAngle` | float (rad) | `m.hachureAngle · π/180` (default −41°, the house angle) | ✅ |
| `u_gapPx` | float | `m.hachureGap · k` (calibrate k ≈ 2 on screen; eyeball vs 2D at defaults) | ✅ |
| `u_weight` | float 0..1 | `clamp(m.strokeWidth / 4)` | ✅ |
| `u_inkColor` | vec3 | resolved `--dir-text-primary` (re-resolve on direction-mode change) | ✅ |
| `u_paperColor` | vec3 | resolved `--dir-bg` | ✅ |
| `u_inkIntensity` | float 0..1 | `m.inkIntensity` | ✅ |
| `u_bands` | int (8) | §4 8-band L* table (Praun + Mahy JND) | ✅ |
| `u_hatchTAM` | sampler2D | packed 8-cell TAM texture | ⏳ stretch |
| `u_normalBuffer` | sampler2D | postprocessing `NormalPass` | ⏳ stretch |

### 3.3 MVP shader logic (procedural — NO TAM asset needed)

The §11 open question ("author a TAM texture — TBD") is **dodged for MVP** by generating hatch procedurally in the fragment shader:

1. `luma = dot(inputColor.rgb, vec3(0.299, 0.587, 0.114))` → `band = floor((1.0 − luma) · 8.0)` (§4 8-band quantization, verbatim from the research sketch).
2. Rotate screen UV (aspect-corrected, in px) by `u_hachureAngle`; hatch line = `smoothstep` on `fract(rotated.y / u_gapPx)` with `fwidth()` anti-aliasing; line thickness ∝ `u_weight`.
3. Bands stack like the §4 TAM-nesting table: band ≥ 2 adds a half-gap-offset second line set (denser), band ≥ 5 adds the cross direction (+90°, the §4 Beer-Lambert cross-hatch step), band ≥ 7 approaches solid. Band 0 = paper.
4. `outputColor = mix(inputColor→paper-tinted, u_inkColor, ink · u_inkIntensity · u_weight)`.

Result: a box extruded from a drawn rectangle shows its lit face sparse, shadowed faces dense — multi-face mark placement (§7's problem statement) for free from luminance, no UV authoring.

### 3.4 Stretch tiers (post-MVP, in order)

1. **TAM texture** (`u_hatchTAM`, 1024×128, 8 horizontal cells) — author it **with rough.js hachure on a hidden 2D canvas at first load**: the 3D marks then literally share the 2D mark grammar (the wedge, sharpened). Swap step 2-3 above for TAM sampling.
2. **NormalPass + tangent bias** — hatch direction follows face orientation (`u_hachureAngle + tangentBias(worldNormal)`, §7 sketch) instead of constant screen angle. Kills the "shower-door" read on rotation.
3. **fillStyle awareness** — `m.fillStyle === 'dots'` → procedural stipple variant; `'cross-hatch'` → start crossing at band 2. Narrow switch on the same Effect, no new pass.
4. **SVG-port 3D style** (§6) — EdgesGeometry → screen-project → SvgStyleTransform overlay. Big slice, own plan, NOT this build.

---

## 4. File manifest

### NEW files (6)

| File | Contents | Est. size |
|---|---|---|
| `src/app/lib/geometry3d/strokeTo3d.ts` | rdpPoints · normalizeStrokePoints · isClosedStroke · pickGeometryMode · buildRodGeometry · buildExtrudeGeometry · strokesKey | ~180 LOC |
| `src/app/lib/geometry3d/hatchEffect.ts` | HatchEffect (Effect subclass) + GLSL fragment + uniform setters | ~140 LOC |
| `src/app/components/three/Doodle3DScene.tsx` | Canvas host + lights + paper background + OrbitControls + StrokeMeshes + conditional hatch pass (default export for lazy) | ~120 LOC |
| `src/app/components/three/StrokeMeshes.tsx` | RodMesh + ExtrudeMesh + group centering + dispose lifecycle | ~110 LOC |
| `src/app/components/three/HatchPostProcess.tsx` | EffectComposer wrapper + modifier→uniform sync | ~60 LOC |
| `src/app/state/Canvas3DContext.tsx` | geometryMode + style3d provider/hook (pattern: F3SvgStyleContext) | ~50 LOC |

### EDITED files (4)

| File | Edit | Blast radius |
|---|---|---|
| `src/app/components/DeskDoodles/DrawSurface.tsx` | Swap honesty-gate overlay body (lines 427-451) for lazy `Doodle3DScene` + honest empty/upload states; add `useCanvas3D()` read | ~25 LOC swap; 2D layers + capture logic untouched |
| `src/app/components/DeskDoodles/DeskDoodlesCanvas.tsx` | 3D chrome row in header when `mode === '3d'` (Geometry pills + Style pills) | additive |
| `src/app/App.tsx` | `<Canvas3DProvider>` wrap | 2 lines |
| `package.json` | ADD `@react-three/postprocessing@^2.16.0` + `postprocessing@^6.36.0` — **pin the v2 line: v3 requires R3F v9; we're on fiber 8.17** | dep add only |

### Explicitly NOT touched

`SvgStyleTransform.tsx` · `lib/smartHachure/*` · `lib/f3HandFeel.ts` · `DrawPanel.tsx` · `DeskPage.tsx` · `publish.ts` · supabase schema. The 2D pipeline and the desk flow don't know 3D exists. (Stretch slice 6.2 later touches DrawPanel/DeskPage/publish — listed there, not in MVP.)

### Verification per house rules

- `npm run typecheck` + `npm run build` clean before any "done" claim.
- The DrawSurface edit CAN touch 2D rendering only via JSX-structure mistakes — per `feedback_never_declare_fixed_without_regression_check`: before/after screenshot /canvas 2D (draw → Done → styled render) + /desk add-doodle flow once; /audit is untouched by construction.
- 3D eyeball matrix (manual): {open scribble, closed blob, multi-stroke face, single dot-ish micro-stroke} × {Rod, Extrude, Auto} × {Native, Hatch} — 24 cells, screenshot each, per `feedback_no_sampled_verification_claims` show the table.

---

## 5. Risks + Make-importability

### Make check (the hard gate)

| Item | Status |
|---|---|
| WASM anywhere in path? | **NO.** three / fiber / drei / postprocessing / @react-three/postprocessing are pure JS + GLSL strings. cannon-es (if used later) pure JS. The Rapier ban (`project_desk_doodles_no_rapier_in_make`) is not tripped. |
| three / fiber / drei in Make | ✅ VERIFIED clean 2026-06-05 (doc 20 lines 210-224; Canvas mounted, OrbitControls mounted, HMR worked). |
| postprocessing pair in Make | ⚠️ NEW, unverified. Pure-JS so expected fine, but smoke it at **Make checkpoint #2** before building on it. Fallback if it misbehaves: drop the composer, ship `native` material + drei `<Edges>`/`<Wireframe>` styles — still a complete (if less wedge-y) 3D demo. |
| `React.lazy` chunk in Make preview | ⚠️ Standard Vite output, unverified in Make. Verify at checkpoint #2; fallback = static import. |
| Version pinning | Make re-runs npm install — pin `@react-three/postprocessing` to the **^2.x** line in package.json so Make can't resolve the R3F-9-only v3. fiber 8.17 + drei 9.114 + three 0.169 are already mutually pinned. |
| No absolute paths / env reads | All new files are plain relative-import TS — consistent with the 06-11 Make-importability audit. |

### Build risks

1. **WebGL can't read CSS vars** — resolve `--dir-bg` / `--dir-text-primary` via `getComputedStyle` at mount + on direction-mode change. Passing `var(...)` strings to three fails silently to black.
2. **Geometry leak** — TubeGeometry/ExtrudeGeometry don't auto-dispose; `useMemo` + cleanup `dispose()` is mandatory (§5b gotcha). Symptom if missed: GPU memory climb on slider scrub.
3. **Self-intersecting closed strokes** — THREE.Shape triangulation can produce garbage or throw. try/catch → per-stroke Rod fallback. Log to `window.__dd_decisionLog` (the existing QW-2 collector) so failures become training data.
4. **Y-axis flip** — viewBox is y-down, world is y-up. One sign error makes every doodle render mirrored; the eyeball matrix catches it (draw an "L").
5. **Hatch calibration vs 2D** — `u_gapPx` scale factor k is a guess until eyeballed next to the 2D hachure at defaults (gap 4, angle −41). Budget one calibration sit-down; per `feedback_copy_implementation_before_tweaking_numbers`, if it reads wrong after 2 tweaks, port the rough.js spacing math instead of iterating constants.
6. **Performance** — many strokes × 512 tubular segments can spike. Budget: cap pool at 60 strokes for 3D (toast beyond), radialSegments 10, no shadows, single composer pass. dpr [1,2] capped.
7. **Pointer conflict** — the 3D cover div must keep `pointerEvents: 'auto'` and sit above the capture svg (it already does structurally) or OrbitControls and stroke capture fight.

---

## 6. Day-13 MVP cut vs stretch

### MVP (must demo end of Day 13)

On **/canvas**: draw strokes → Done (or not) → flip the existing 2D/3D toggle → strokes appear as 3D Rods (open) / Extrudes (closed) on warm paper → orbit with the mouse → **Hatch style on by default, driven by the SAME Shading sliders as 2D** → move `hachureAngle`/`hachureGap` and watch 2D and 3D restyle together. That slider moment is the demo-video wedge shot (§13).

In-cut: all 6 NEW files, 4 edits, Auto/Rod/Extrude pills, Native/Hatch styles, procedural hatch (no TAM), honest empty/upload states, dispose hygiene, eyeball matrix.

### Out of cut (stretch ladder, in order)

| # | Item | Size | Notes |
|---|---|---|---|
| 6.1 | Pressure → Rod radius modulation (`StrokePoint[2]` is already captured) | ~0.5d | per-cross-section radius = custom BufferGeometry or per-segment tube radius hack |
| 6.2 | **/desk per-object 3D + stroke retention** | ~1d | Extend `DrawPanel.onDone(svgMarkup, strokes?)`; persist `rdpPoints`-simplified points into the existing `doodles.render_config` jsonb (`publish.ts:44` — column already live, NO schema paste needed); `DeskObject` gains `strokes?`. This is also Sebs's named "EDIT-after-place" prerequisite — one slice serves both. |
| 6.3 | TAM texture authored via rough.js (stretch tier 3.4-1) | ~0.5d | the grammar-sharing upgrade |
| 6.4 | NormalPass tangent bias (3.4-2) | ~0.5d | face-aware hatch direction |
| 6.5 | cannon-es drop-on-desk physics (`@react-three/cannon` already installed) | ~0.5d | convex-hull or box body; demo beat, not core |
| 6.6 | Solid (marching squares) + Inflate-Lite geometry modes | ~1.5d | §5b Day 12-13 ladder; add pills only when real |
| 6.7 | SVG-port 3D style (stable seed) | own plan | §6 of research; carries all 11 2D styles into 3D |

Hard-path (Volumetric AI / 3D Artist, §5c + §8) mounts into the SAME `Doodle3DScene` later: a GLB-loading `<mesh>` sibling of `StrokeMeshes`, with the same HatchPostProcess on top — nothing in this plan blocks it.

### Suggested build order (one sitting each, STOP + show between)

1. `strokeTo3d.ts` + `StrokeMeshes` + `Doodle3DScene` with native material → wire honesty gate → **show Sebs the first rod**.
2. Chrome pills + Canvas3DContext + Extrude + auto-pick → show.
3. postprocessing deps + HatchEffect + slider sync → calibrate vs 2D → eyeball matrix → show.
4. (If green and time) stretch 6.1 / 6.2.
