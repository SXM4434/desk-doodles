# Phase 2 — Deep Geometric svg-port 3D Relief — Implementation Plan

> Read-only research output (2026-06-19, overnight). Nothing here is wired yet. Every `file:line` is a real reference verified against current HEAD. Builds on `3D-SVGPORT-POSTMAKEATHON.md` (sealed-mesh + CSG architecture). This is the morning plan for Phase 2 — read it, then we execute together (carve depth / boldness are your taste calls).

## TL;DR
Today's svg-port "relief" is a normalMap + 6%-displacement trick on a flat cookie that **can't go deep without tearing** (the cap is a free-floating clone). Phase 2 replaces it with a **welded watertight relief mesh** (no new dep — ships first as a real improvement) + **manifold-3d CSG** (lazy WASM, Make-safe, guaranteed-watertight) for sheer-walled screen indents and proud buttons. Prototype on the **Game Boy**, driven through `/audit` with live tune seams so you dial depth in real time.

---

## 1. Current state vs goal
- **Today:** svg-port routes to ONE flat pool-solid slab (`Stroke3DScene.tsx:753-775`, `EXTRUDE_DEPTH=0.5`). The "3 treatments" (engrave/indent/raise) live in a CanvasTexture height field (`drawingTexture.ts:707-763`) + a `treatMask` primitive classifier (`:551-594`), but geometry only moves `±0.03` world (`SVGPORT_DISPLACEMENT_SCALE=0.06`, `:284`) on a tessellated **clone** cap (`Stroke3DScene.tsx:1111`). Depth reads almost entirely via Sobel normalMap, not real geometry. It's pinned shallow because the clone cap **tears off** at any real depth (topology problem, not tuning).
- **Goal:** a real sealed watertight mesh where engrave/indent/raise are **actual geometry that catches light on orbit**, honoring the one-pencil monochrome north-star (value from marks/shadow, never gloss) + the verify rule (svg-port style X reads like 2D style X; clean = sanity baseline).

## 2. Approach
- **2a. Sealed relief mesh (no dep, always-on base):** front displaced grid + skirt + back, sharing byte-identical boundary vertices, `mergeVertices` + `computeVertexNormals` (lithophane pattern). `BufferGeometryUtils`/`mergeVertices` available in three 0.169 (same import path as `TessellateModifier`, `Stroke3DScene.tsx:16`). Welded = can't tear → real depth is safe.
- **2b. CSG for hard edges — RECOMMEND `manifold-3d` over `three-bvh-csg`:** guaranteed-manifold output (stays sealed for GLB export) + **version-independent WASM** (immune to the duplicate-three / cold-load race that bit Make — `three-bvh-csg` imports `three` directly = more Make risk). Lazy-loaded (~1–1.5MB) only when an svg-port object has a CSG-classified feature. INDENT = `subtract` a rounded box/cylinder; RAISE = `union` a low boss.
- **2c. Detail-vs-structure split (keep):** structure (basins, screen, button) = real geometry; fine detail (hand-lines, hatch grain, rough wobble) = normalMap + existing detail-lines (`Stroke3DScene.tsx:1014-1052`), never deep-displaced. This is why rough stays rough and can't tear.

## 3. Step-by-step (each ships a visible win, tsc-green, headed-Chrome verified; main-loop only)
- **Step 0 — Make-safety spike for manifold (DO FIRST, ½ day):** lazy-`import('manifold-3d')`, one trivial subtract, build, drop into a Make checkpoint to confirm the WASM loads in the preview iframe. If it flakes like Rapier → fall back to sealed-mesh-only (steps 1–3), present CSG as the next tier. **Gate the CSG half on this.** New `lib/geometry3d/csg.ts` + `tools/harnesses/manifold-smoke.mjs`.
- **✅ Step 1 — Sealed mesh builder (DONE 2026-06-19 overnight, isolated/unwired):** `lib/geometry3d/sealedRelief.ts` `buildSealedReliefGeometry(contour, heightAt, opts)` — triangulate contour (three earcut) → midpoint-subdivide for interior verts → displace interior (boundary kept flat) → skirt from boundary edges → flat back → `mergeVertices` + `computeVertexNormals`. **Verified WATERTIGHT** by `tools/harnesses/sealed-relief-smoke.mjs`: at sub=1/2/3 → 0 boundary edges, 0 non-manifold edges, finite, displacement real (z reaches 0.22 at sub=3, scale 0.3). tsc green. NOT wired into any scene → zero render change. **Morning = Step 2 wires it.**
- **🟡 Step 2 — CPU front-cap displacement on the SEALED MASS (DONE flag-gated 2026-06-20, awaits Sebs visual):** simpler/safer than a contour rebuild — the pool-solid `mass` is ALREADY a sealed welded mesh, so `displaceFrontCapByHeight` (`drawingTexture.ts`) CPU-displaces only its flat front-cap verts (normal.z ≳ 0.9) by the height field, leaving bevel rim + skirt + back put → no tear. Wired in `Stroke3DScene.tsx:1109+` behind `window.__sealedRelief` (default OFF = current shallow look); when on, the GPU `displacementMap` is dropped (scale 0) so depth isn't double-applied; depth via `window.__sealedReliefTune.scale` (default 0.3). Math node-verified (front displaces by field, rim/skirt flat). **OPEN (Sebs check-list #12):** the canvas-flipY-vs-GPU convention couldn't be proven headless (could render upside-down — 1-line flip if so). `buildSealedReliefGeometry` (Step 1) stays available if a smoother silhouette via full contour-rebuild is wanted later.
- **Step 3 — Deepen the amplitudes** (`ENGRAVE_AMT`/`DEEP_AMT` `:727-728`, `RAISE_AMT`/`INDENT_AMT` `:755-756`) — these were chosen for a ±0.03 budget; the sealed mesh affords real depth. **First dramatic before/after with NO new dep** — ship as the new v1 even if Step 0 killed CSG.
- **Step 4 — CSG hard features (gated on Step 0):** `lib/geometry3d/csg.ts`, sealed↔Manifold adapter; per `treatMask` primitive build a tool solid from its bbox (`drawingTexture.ts:557-568`) and subtract/union. Run at conversion time, cache in `render_config`. Verify: Game Boy screen = sheer recess, buttons = crisp standoffs.
- **Step 5 — Port to NATIVE + OFAT** (`project_f3_shading_port_to_3d`): bring native Path 1 (`RELIEF_DISPLACEMENT_SCALE=0.42` bump-only, `drawingTexture.ts:264`) onto the same sealed builder; fold into the 3D OFAT (paired svg-port-X ↔ 2D-X ↔ clean).

## 4. Prototype — the Game Boy (already primitive-classifiable, `PegToolShape.tsx:219-230`)
- screen `rect` (frac≈0.22 → INDENT) → deep sunk panel · A/B `circle`s (frac≈0.007 → RAISE) → proud standoffs · dpad/speaker `line`s → engrave · body outline → engrave.
- **Money shot:** 30°-orbit grazing-key render — screen reads as a dark self-shadowed sunk panel, buttons cast tiny crown shadows (impossible at 0.06).
- **Drive it:** `/audit` (`routes.tsx:53`) gameBoy cell, style→svg-port, geometry→solid, head-on + orbit. Live tune seams already exist: `window.__svgPortCarveTune`, `__svgPortTune`, `__svgPortDebug`→`__svgPortDebugURLs{emissive,height,normal}`. Add `window.__sealedReliefTune` for the new amplitudes. Reuse `/tmp/dd-svgport-dump.mjs`, `dd-svgport-levels.mjs`, `tools/harnesses/`.

## 5. Risks + verify
- **3D can't headless** → every claim = a headed Google Chrome screenshot, verified PAIRED `[clean · 2D-X · svg-port-3D-X]`.
- manifold flakes in Make → Step 0 gates; degrade to sealed-mesh basin behind a boundary, never crash (Rapier precedent).
- watertight seam → smoke asserts zero boundary edges + finite guard before wiring.
- stale normals → `computeVertexNormals()` after displacement AND each CSG op.
- vertex blow-up → cap grid res; CSG once at conversion (cached), regression-check a `?demo=1` desk.
- 2D regression → catalog byte-diff gate (`/tmp/dd-catalog-diff.mjs`, 197/197) — svg-port edits are 3D-only by construction.
- GLB export → point `lib/exportGlb.ts` at the sealed/CSG mesh; manifold output exports clean.

## 6. Open taste calls for Sebs (wire to `window.__sealedReliefTune`, dial live on the Game Boy)
1. **Carve depth / boldness** — INDENT sink + RAISE proudness vs slab thickness (0.5). Propose subtle/medium/bold triad; pick the default.
2. **Engrave depth + wall** — V (sharp) vs U (soft) groove; pencil-incision vs machined.
3. **Indent-vs-raise thresholds** — area-fraction bands (`RAISE_MAX=0.045`, `INDENT_MAX=0.6`, `:555`) — does a mid circle read as a raised dial or a sunk port? Semantic taste.
4. **CSG crisp vs height-field soft** — per treatment (screen=CSG crisp, button=soft union?).
5. **Preset count** — discrete depth presets in chrome (6+ steps vs tight subtle/medium/bold).
6. **CSG opt-in vs always-on** — if manifold is heavy/flaky, ship CSG as default deep path or opt-in toggle with sealed basin as safe default.

**Key files:** `drawingTexture.ts` (height field + treatMask) · `Stroke3DScene.tsx:753-775,1078-1197` (svg-port body/material — the clone+tessellate to replace) · `strokeTo3d.ts:1749-1891` (`buildPoolSolidGeometry`, contour) · `PegToolShape.tsx:219-230` (Game Boy) · `routes.tsx:53` (`/audit`) · `lib/exportGlb.ts`. New: `geometry3d/{sealedRelief,csg}.ts`, `tools/harnesses/{sealed-relief,manifold}-smoke.mjs`.
