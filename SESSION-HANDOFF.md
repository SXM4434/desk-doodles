# Session Handoff — 2026-06-14 (R8 NIGHT-2: live-OFAT verified broken-map + the stale-base trap caught)

**Per CLAUDE.md:** short, current, action-oriented. History = git log + locked docs.

## 🆕 R41 (2026-06-28) — SVG-port "ports over ALL the SVG stuff": full 2D pen controls drive the mesh line-art + the "two sliders" fix (live-verified)
Sebs (furious): *"why are there two sliders thats not what the svg port does… IT PORTS OVER ALL THE SVG STUF"* then *"wtf have u been working on if you only gave me two sliders."* Two real problems: (1) the pen controls weren't WIRED to the mesh line-art (the R40 pencil only used dark/contrast); (2) svg-port defaulted to the **Clean** SVG style, which — exactly like the 2D pen — exposes only **Ink intensity + Fill opacity** → it READ as "two sliders / broken."
- **✅ FULL pen system now drives the mesh's own line-art.** Threaded the live 2D pen mods → the svg-port pencil shader: `mods.{strokeWidth, wobble, inkIntensity, fillStyle}` → `hatchInputs` (Live3DMount/LiveObject3DSlot + /canvas) → `StrokeMeshes.meshLine` (`fillStyleToMode`) → `HardMesh line=` → **`inkSkinClone(..., line)`** new uniforms `uLineWeight/uLineWobble/uLineInk/uLineStyle`. Pencil shader uses them: **strokeWidth → line THICKNESS** (Sobel reach + silhouette rim widen), **wobble → hand-drawn WAVER** (procedural sample-coord bend), **inkIntensity → line DARKNESS**, **fillStyle → line CHARACTER** (none=silhouette-only, dots=stipple, dashed/zigzag-line=dashes, else continuous). Still the mesh's OWN form inked — NEVER the 2D drawing stamped on (the R40 core rule holds).
- **✅ "Two sliders" fixed — svg-port defaults to the HAND-DRAWN register.** `ObjectSurface`: when svg-port first activates on a MESH from the bare `clean` default, one-shot (ref-guarded) promote `surfStyle → 'rough-handdrawn'` so the **full 12-control pen set** shows immediately (Smart · SVG style · Multi-stroke · Wobble · Jaggedness · Stroke width · Curve · Hachure gap/angle · Fill density · Ink intensity · Fill opacity · Texture intensity) AND the mesh reads hand-drawn (svg-port's whole point). A later manual `clean` pick STICKS (never fights the user).
- **VERIFIED LIVE in the edit modal** (headed Chrome, `?test=suzanne` turntable, real WebGL): svg-port now opens straight to "Rough hand-drawn" + the full set. Drove the sliders on the actual mesh: **Stroke width** = thick bold ink lines (2.875) vs fine pale lines (0.5) — DRAMATIC; **Ink intensity** = lines fade pale (0) vs ink up dark (1); **Wobble** = waver vs clean. The mesh's OWN grooves/tonearm/edges are what's inked. tsc + `npm run build` GREEN.
- **Files:** `aiMeshMaterial.ts` (`InkLineParams` + 4 line uniforms in the pencil branch), `HardMesh.tsx` (`line` prop → inkSkinClone, in memo deps), `Stroke3DScene.tsx` (`StrokeMeshes.hatchInputs` → `meshLine` → HardMesh; import `fillStyleToMode`), `DeskObject3DMount.tsx` (Live mounts pass wobble/fillStyle/fillOpacity), `ObjectSurface.tsx` (svg-port→rough-handdrawn auto-promote). `/canvas` already passed wobble/fillStyle.
- **🔴 THE REAL BUG (found after Sebs "you didn't actually get svg port to WORK on the ai meshes"): svg-port FAILED TO COMPILE on the real Trellis GLB.** The pencil shader's silhouette used the raw `vNormal` varying, which three.js only declares for SMOOTH-shaded materials. The real DB Quiver Game Boy GLB is flat-shaded → `ERROR: 0:1641: 'vNormal' : undeclared identifier` → fragment shader not compiled → the mesh rendered **invisible/broken**. The suzanne meshes happened to be smooth-shaded so they masked it — which is why my earlier "verified" was on the wrong meshes. **FIX:** inject the pencil block after `<normal_fragment_begin>` (was `<map_fragment>`) and use three.js's computed `normal` (always valid — derived from screen derivatives when flat-shaded) instead of `vNormal`. VERIFIED on the REAL `?test=quiver` GLB: **0 shader errors**, mesh renders as a line-drawing (vs native's photographic look), and Stroke width / Ink / Wobble visibly drive it. Suzanne regression-clean (0 errors). tsc + build GREEN. (This bug predates this session — it shipped in R40; svg-port never actually worked on a flat-shaded GLB until now.)
- **NOTE on the DESK panel:** placed meshes carry a saved per-object look that overrides the global `aiMeshMaterialMode`, so the desk-wide style dropdown doesn't sweep them to svg-port (greyscale wins) — the EDIT MODAL is the surface that drives a mesh's svg-port. (Desk-wide mesh restyle = a separate follow-up if Sebs wants it.)
- **⚠️ Still rough (honest):** the GLB frames small/off-centre in the well for wide-flat meshes (gameboy sits in a corner) — a camera-framing issue, separate from svg-port working; flag for a framing pass.

## 🆕 R40 (2026-06-28) — THE CORE RULE: recreate the FEELING from the mesh's own form, NEVER stamp the 2D drawing (live-verified)
Sebs (the rule I'd been violating): *"you can't take the strokes from 2D and plop them onto the ai mesh — we RECREATE THE FEELING."* My svg-port-on-mesh was rasterizing the object's 2D drawing and planar-projecting it onto the GLB — the exact violation, and why the SVG-port style options did NOTHING (diagnostic: clean→bold→rough pixel-diff = **0**; it never used the mesh).
- **✅ SVG-port REBUILT to recreate the feeling.** It now renders the mesh's OWN form as a **hand-drawn LINE SKETCH** — a real-time Sobel on the mesh's albedo inks its **texture-edge boundaries** (screen / buttons / part seams) + a **view-space-normal SILHOUETTE** contour (works on ANY mesh, incl. low-detail spheres) over a light cel form. No 2D drawing, no planar projection (`meshPlanarUv=false`; `meshSvgPortMat` dormant). `inkSkinClone(..., pencil)` does it: **SVG-port = pencil/line look, Native = solid lit-ink look**, both from the mesh itself, one mechanism. Removed the misleading "what's carved in" 2D-restyle controls + the `flip3dStrokes`-gate hack.
- **VERIFIED visually on ALL the AI meshes we have** (Sebs "we don't have 197, use what we have + always visually check"): `?test=suzanne` (5) + the real DB Quiver gameboy. Vision-agent + my eyes: turntable, both gameboys, camera, Poké Ball = **clean hand-drawn line sketches** (contour + interior detail on warm paper). One noisy text-generated demo mesh (suzanne-3) stays muddy — a bad SOURCE texture (broad photo gradients smear the Sobel); silhouette is the clean fallback. tsc + build GREEN.
- **Tuning levers** (all in `aiMeshMaterial.ts` pencil branch): Sobel threshold `smoothstep(0.13,0.28)` (higher = cleaner on noisy textures, fewer interior lines), silhouette `1.0 - smoothstep(0.16,0.42, facing)`, light form `mix(0.58,0.95)`. The `pencil` foundation also drives a still-dormant alt-Native look.
- **NEXT (when Sebs directs):** (a) per-style FEELING for svg-port (rough/bold/charcoal → vary the line weight/wobble — recreate each 2D PEN feeling on the mesh's edges, still NEVER the drawing); (b) the muddy-noisy-texture mesh (pre-blur the albedo before Sobel, or auto-fall-back to silhouette when edge-density is high); (c) Native's own hand-drawn pass if "solid lit ink" still reads too photographic.

## 🆕 R39 (2026-06-28, OVERNIGHT auto-mode) — AI mesh = the Native STYLE + "bring the engine into AI-mesh space" (live-verified)
Sebs (corrected model, then "auto mode i sleep, don't stop till perfect, OFAT to the max"): the AI mesh is **not a toggle/geometry option — it's the NATIVE STYLE**, and our engine treatments must render the mesh's OWN detail, not flatten or hack-project it.
- **✅ AI mesh = the Native style (the big restructure).** Killed the "AI mesh" geometry option + the "Surface" dropdown. Panel is now identical for every object: **GEOMETRY (Auto/Rod/Extrude/Inflate/Solid) + 3D STYLE (Native/Hatch/SVG-port)** + a quiet **⬡ AI mesh** tag. Native = the mesh; under it a **Finish** picker (Material / Value / Photoreal). `meshShown = aiMeshActive && geometryMode ∈ {auto, ai-mesh}`; the 3D-STYLE dropdown is DERIVED from `aiMeshMaterialMode` (the render truth) so it can't desync; `setStyleUnified` syncs style3d↔aiMeshMaterialMode. Removed the provider 'ai-mesh' default (auto already renders the mesh via the gate). VERIFIED: `tools/verify-mesh-toggles-drive.mjs` — EVERY control (style, finish, preset) moves the mesh (diffs ~85 vs noise-floor 0); structure assertions pass (tag ✓, no "Surface", geometry has no AI-mesh); stroke objects regression-clean.
- **✅ "Engine in AI-mesh space" — Native + Hatch now render the mesh's baked detail (was a flat octagon).** Root cause: image-to-3d meshes bake detail into their TEXTURE; Native/Hatch REPLACED the material with a flat slab → lost it. Fix: exported `inkSkinClone` (the greyscale re-skin that keeps the mesh's albedo map + UVs + normals) and rebuilt **Native** on it per-mesh (keeps detail, wears the preset's surface finish from engineMaterial). **Hatch** now feeds the mesh's albedo into the shader (`u_valueMap`/`u_hasValueMap` + `vUv`; HardMesh sets it from the mesh's own map) so hatch tone follows the texture value → the form reads. Verified live on the real DB Quiver Game Boy + the suzanne meshes: native = detailed ink Game Boy, hatch = form reads through the hatch (both were flat before). **ALL 5 mesh surfaces now good** (Native/Value/Photoreal/Hatch/SVG-port).
- **✅ Quiver-SVG geometry OFAT (Sebs "use the svg saved with the trellis mesh — check the db").** Pulled the REAL Quiver trace from Supabase (`doodles` row "gameboy test", 27 region paths + circle/ellipse/rect — DIFFERENT from our stroke SVGs) → `public/test-svgs/quiver-gameboy.svg` + a **`?test=quiver` desk** (`demoWall`) carrying it + the real GLB. Found+fixed: **Extrude on a filled trace = black blob** (the body region buried detail) → route a FILLED TRACE (`pool≥8 && closedFrac≥0.6`) through the SOLID unified-mass for both Extrude AND Inflate (clean Game Boy now); Rod/Solid already clean. Gated so our own (open-stroke) drawings are untouched (verified: catalog Game Boy extrude unchanged).
- **✅ SVG-port: the "what's carved in" controls now appear** (Sebs "i click svg port no toggles show up"). The engraving IS the 2D drawing, so its controls = the 2D Restyle set — `EngraveStyleSync` reports the active svg-port surface up to ObjectSurface, which mounts `SurfaceControls` under the 3D chrome; changing the drawing's style re-engraves the mesh LIVE (verified diff 66). Renamed "Engraved" → **SVG-port** everywhere (Sebs hated the mismatch). Engraving normal-mask (front-confinement) fix from R38 kept.
- **⚠️ KNOWN-ROUGH (honest, the next clear steps):** (1) **SVG-port on a flat texture-detail SLAB mesh** (image-to-3d) = the drawing floats centered/small — it has no geometry to align to; Native/Value/Hatch are the right surfaces there (svg-port shines on geometry-detail meshes). Tried the mesh's own UVs → an atlas that SCRAMBLES it, reverted to planar. (2) **Hatch on the flat trace-built MASS** (extrude/inflate/solid from a Quiver trace) = blob — the texture-value hatch fix only reaches the actual GLB, not stroke geometry; the mass is a flat slab → uniform lambert. Native/SVG-port on those forms read fine. (3) Material/Hatch on a slab were the flat cases — NOW FIXED via inkSkin/value-feed.
- **🎨 AESTHETIC ("the renders are ass" — the BIG open item).** Sebs is right that the mesh renders read PHOTOGRAPHIC, not hand-drawn. Art-director critique (logged): they lack the two things that make a 3D form read as drawn — **(a) a confident ink OUTLINE** and **(b) cel-posterized value bands** (not smooth CG gradient), on warm paper. Tried the quick versions overnight: cel-posterize (washed out — these image-to-3d textures have a NARROW value range, so nothing to posterize/separate), a light pencil/line-art map (same washout), and the inverted-hull outline (**does NOT render on a GLB even at 12% push + depthWrite — a real bug**). All REVERTED (don't ship worse than the verified detail-preserving state). Conclusion: this is a real NPR pass, not a shader tweak — **next build = a working edge-detection ink-outline pass** (the #1 lever; the hull approach is broken for GLBs) + a fitting palette + paper grain, and the TARGET LOOK (ink-wash vs pencil/line-art vs cel-cartoon) is Sebs's art call. A DORMANT `pencil` path is left in `inkSkinClone` (off) as the start. Current shipped mesh state = the verified detailed-ink renders (functional, all 5 surfaces read), NOT yet "hand-drawn beautiful".
- **Files:** `aiMeshMaterial.ts` (export `inkSkinClone` + `surfaceFrom`), `HardMesh.tsx` (native per-mesh ink-skin · hatch value-map feed · svg-port planar+normal-mask), `hatchMaterial.ts` (`u_valueMap`/`vUv`), `Stroke3DScene.tsx` (filled-trace→solid for extrude/inflate · engrave emissive 1.6), `Canvas3DChrome.tsx` (AI mesh = Native style restructure), `ObjectSurface.tsx` (EngraveStyleSync + SurfaceControls under svg-port), `demoWall.tsx` (`?test=quiver`). tsc + build GREEN. Harnesses: `verify-mesh-toggles-drive`, `ofat-quiver-max`, `verify-engrave-toggles`, `ofat-modal-forms`.

## 🆕 R38 (2026-06-27) — FORM × SURFACE UNIFICATION: one 3D control set for mesh + stroke (live-verified, the modal-rage fix)
- **Sebs (furious, on the actual desk):** the edit modal was inconsistent — mesh objects got a broken "Look" dropdown + a bolt-on AI-mesh panel, the property panel was cut off, and the AI mesh wasn't a real FORM. His model: *"WE WERE GNNA HAVE A 3D MESH AS A STYLE THE SURFACE IS ESSENTIALLY THE MATERIAL PANEL AND 3D STYLE MIXED TOGETHER… ai 3d mesh would be its native… I want the geometry nodes to work on the ai mesh / convert quiver svg into the normal 3d engine version."* Plan: `docs/submission/AI-MESH-UNIFY-PLAN.md`.
- **✅ BUILT + LIVE-VERIFIED — `Canvas3DChrome` is now THE single 3D control for EVERY object** (mesh + stroke). Deleted the "Look" dropdown + the mesh-only `AiMeshControlsEdit`; `ObjectSurface` renders `<Canvas3DChrome/>` for both. Two orthogonal axes:
  - **GEOMETRY / FORM** — `GeometryModeSetting` gained **`'ai-mesh'`** (`strokeTo3d.ts`); the geometry dropdown shows **AI mesh** only when a GLB exists (`AI_MESH_GEOMETRY_OPTION`, prepended via `aiMeshActive`), defaults to it for a mesh (provider effect sets `'ai-mesh'` when a mesh appears + geometry untouched). Render gate (`Stroke3DScene` ~1740): **GLB when geometry ∈ {ai-mesh, auto}** (auto = backward-compat for every placed mesh), **stroke-built form (from the Quiver SVG via `svgMarkupToStrokes`) for an explicit stroke mode**. Geometry generators can't run on a finished GLB → stroke modes rebuild from the drawing (Sebs's accepted fallback).
  - **3D STYLE / SURFACE** — surface-aware: for the AI-mesh form the dropdown IS the merged material+style "**Surface**" set (Material[native]/Greyscale/Hatch/Engraved/Original → `aiMeshMaterialMode`); for a stroke form it's Native/Hatch/SVG-port (→ `style3d`). Native + Hatch sub-controls SHARED (same context fields drive both). The mesh's Engraved = the #29 svg-port-carries-2D-style work, now in the unified chrome.
- **✅ Cut-off panel FIXED (Sebs "the property panel is cut off"):** the modal control column was capped to the short preview-card height (`Math.max(cardH,320)`) → ~311px of controls crammed below the fold. Now the row stretches + the column FILLS the panel (card stays top-aligned). Removed the dead `cardH` ResizeObserver. Live: **0 hidden overflow** in 2D + 3D; the full restyle set shows.
- **✅ FORM-choice persists for meshes** — `config.geometry3d` now saved for ANY 3D object incl. meshes (was `!hardMeshUrl`-gated), so a mesh converted to Extrude survives reload; the render gate keeps a default mesh on the GLB.
- **VERIFIED LIVE** (headful Chrome, real WebGL): `tools/verify-unify-modal.mjs` (`/desk?test=suzanne`) — turntable mesh: no Look dropdown, Surface picker (Material/Greyscale/Hatch/**Engraved reads correctly**), FORM→Extrude **rebuilt the vinyl from its Quiver SVG**, FORM→AI mesh restored the GLB. `tools/verify-stroke-modal.mjs` (default wall) — a stroke object (pokeball) shows GEOMETRY (auto/rod/extrude/inflate/solid, **NO `AI mesh`**) + 3D STYLE (NO Surface), regression-clean. `tools/verify-2d-panel.mjs` — column fills the 792px panel, 0 hidden. Desk meshes still render as GLBs. tsc + `npm run build` GREEN.
- **Type plumbing:** `'ai-mesh'` excluded from stroke-concrete types (`conversionMap.ConcreteMode`, `resolveGeometryMode`, `directiveForTreatment` compose it like `auto`); `MODE_MATERIAL_DEFAULTS_3D` gained an `'ai-mesh'` key (matteClay, never read for the GLB).
- **✅ BIG-DADDY OFAT (Sebs "go do a big daddy ofat on it all first then i test") — CLEAN.** `tools/ofat-form-surface.mjs` swept the full FORM × SURFACE matrix (32 combos, 2 desks: meshes `?test=suzanne` + closed strokes `?demo=rock`) via the desk-wide dev hooks; 6 parallel vision agents judged. **0 console/page errors on every combo**; all 5 AI-mesh surfaces + all geometry FORMs render correctly; stroke objects regression-clean; sub-controls still drive (preset diff 84.79, grammar diff 85.07). Agents flagged rod/solid as "flat" — **camera artifact** of the small top-down desk-wall view, DISPROVEN in the modal lens (`tools/ofat-modal-forms.mjs`: rod=tilted tubes, inflate=puffy volumetric, solid=engraved mass). Honest caveat (mode character, not a bug): solid reads dark on flat-disc drawings, rod is sparse on outline-only drawings → `solid+svg-port`/`+outline` reads best. Writeup `docs/submission/FORM-SURFACE-OFAT.md`, 32 verdicts `datasets/form-surface-ofat.jsonl`.
- **✅ MODAL STATE-MACHINE verified** (`tools/verify-modal-transitions.mjs`): ai-mesh→Extrude flips the panel to "3D style"+Material (no Surface); →back-to-AI-mesh RESTORES the Surface picker (no stuck state); the full ai-mesh→extrude→hatch→svg-port→ai-mesh→engraved round-trip ends with the Game Boy mesh engraved + controls consistent, 0 errors. (Done-stays-open on the no-DB test desk = the existing honest "saved locally" note path, not a regression — my only save change was adding `config.geometry3d` for meshes.)
- **PANEL CROP hardened** (`tools/audit-panel-crop.mjs`): 0 hidden content across normal/short(680)/narrow(760) viewports, 2D + 3D.
- **⏳ STILL OPEN — the LAST plan item (#5):** **Text → SVG pipeline.** ON THE BACK BURNER (Sebs 2026-06-27: "put this on the back burner" — the OTHER chat / portfolio effort owns text→SVG). Decision LOCKED = **Option A (prompt → AI-drawn SVG sketch)** per Sebs, matching the "every input → SVG doodle first" architecture. Needs an LLM key + a Supabase edge function = Sebs deploy (same constraint as Suzanne). Research done (`imageToSvg.ts` is the client/edge pattern to mirror; svgMarkup output contract; no font/LLM deps today). When un-paused: build the client side + `text-to-svg` edge fn + a local fallback so it's testable pre-deploy.

## 🆕 R37 (2026-06-27) — MESH SURFACE OFAT: "where does it get too fake?" (full 5-mesh sweep, live + agent-judged)
- **Sebs: "some of it gets too fake… test every possible combo and value, big fun OFAT."** Swept 31 surface variants (greyscale dark/contrast · PBR · 6 native presets · polish/reflection/sheen/outline dials · gloss suspects · hatch grammar×direction) on **all 5 Suzanne meshes** (live headed Chrome, `tools/mesh-surface-ofat.mjs` + `mesh-ofat-sheets.mjs`, captures `/tmp/mesh-ofat*`). Per-mesh vision-agent judged (5 agents, one per mesh, all 31 each). Full writeup `docs/submission/MESH-SURFACE-OFAT.md`; per-mesh verdicts `datasets/mesh-surface-ofat.jsonl` (155 labeled points).
- **CONSENSUS (decisive, consistent across meshes):**
  - **UNIVERSAL FAKE → drop:** `pbr-photoreal` (color breaks monochrome), `native-glossyPlastic`, `dial polish-1`, `suspect glossy-polish1-refl1` (all 5×❌); near-universal: reflection-1 / sheen-1 / ink-polish1 / signal-refl1 (the whole gloss/reflective end).
  - **UNIVERSAL AUTHENTIC → keep:** `hatch crosshatch-fixed` (the most robust), crosshatch-light / contour-fixed/light, `greyscale-default` / contrast-low, `dial outline-mid`.
  - **MESH-DEPENDENT:** native presets (ink/matte/rubber/signal) = clean on FORM meshes (turntable, pokeball), fake-blob on flat/photo meshes (gameboys). greyscale-dark-high crushes detail meshes. Sparse hatch (hachure-light/stipple-light) too empty on form meshes.
  - **HEADLINE:** hatch (crosshatch) + greyscale are the ONLY surfaces authentic on every mesh; gloss/PBR fake on everything; native = a form-mesh option.
- **✅ BUILT + LIVE-VERIFIED (Sebs "go fix it all" → then "don't remove stuff just make it work, except PBR"):** the AI-mesh **SURFACE picker** = **Greyscale (default) · Material (native) · Hatch · Original (photoreal/PBR)**. CORRECTION (Sebs caught over-curation): the first cut FORCED matteClay + cross-hatch and hid the presets/dials/grammars — that's removal. Reverted: **'native' wears the FULL `nativeMaterial`** (every Material preset incl. glossyPlastic + Polish/Reflection/Sheen dials drive it), **'hatch' uses the LIVE grammar** (hachure/cross-hatch/stipple/contour + direction). NOTHING removed; the OFAT (cross-hatch + matte read best) is the recommended DEFAULT only. `AiMeshMaterialMode` widened to `greyscale|og-pbr|hatch|native`; `Stroke3DContents` resolves `meshEngineMaterial` (native→nativeMaterial, hatch→a hatch instance synced to live inputs) → `HardMesh` (replaced the R36 dev flag). `AiMeshControlsEdit` now reveals the full preset+dials (native) / grammar+direction (hatch) controls per surface. Verified live: `tools/verify-mesh-surfaces.mjs` (4 surfaces distinct) + `tools/verify-mesh-controls-work.mjs` (preset matteClay→glossyPlastic diff 84.8 + hatch hachure→stipple diff 84.9 BOTH drive the mesh → not forced/removed). tsc + `npm run build` GREEN.
- **✅ 100% (Sebs "100"):** wired the last two. **Outline-on-GLB** — `HardMesh` adds a BackSide inverted-hull ink child per mesh (scale-normalized push); threaded `meshOutline` (= nativeProps.outline on native) Stroke3DContents→StrokeMeshes→HardMesh. **Hatch micro-dials** (gap/angle/width/intensity) — `LiveObject3DSlot` + `Live3DMount` now read the F3 modifiers (`useF3RoughModifiersOptional` → falls back to `DEFAULT_MODIFIERS` = the old hardcoded values, so byte-identical at default + no-throw if provider-less) instead of hardcoding → the 2D Shading sliders feed the 3D hatch ("one math, two renderers"). **VERIFIED LIVE** (`tools/verify-mesh-100.mjs`): outline 0→1 diff 84.9 (hull on GLB) + hatch gap 4→20 diff 85.0 (slider feeds mesh). Dev hook `window.__dd_mods.set` added to the App-level F3 provider (`devHook` prop) for OFAT driving. tsc + build GREEN. EVERY 3D control now works on a mesh: presets (all 6) · polish/reflection/sheen · outline · hatch grammar/direction/gap/angle/width/intensity · greyscale dark/contrast · PBR.
- **NOTE:** in-modal dedicated mesh hatch micro-sliders aren't added (AiMeshControlsEdit sits outside the modal's F3 provider scope); they're driven via the global Shading panel. Per-object persistence of the extended native/hatch params for meshes (beyond materialMode) = a follow-up.
- **🆕 MEGA OFAT (Sebs "keep doing a few rounds of a mega big daddy ofat") — 3 rounds, all 5 meshes, agent-judged, `docs/submission/MESH-SURFACE-OFAT.md` + `datasets/mesh-surface-ofat.jsonl`. Harnesses `tools/mega-ofat{,-r2,-r3}.mjs`.**
  - R1 (36 variants × 5): confirmed gloss/PBR = universal fake; hatch/greyscale = authentic; native = form-mesh only. **Outline = a real win** (recovers structure, sweet spot ~0.5; gloss+outline = fake). **Hatch micro sweet spot = gap~6 + thin width(~0.6) + full intensity** (thick width = muddy blob).
  - R2 (16 × 5, finalists): the best default is MESH-DEPENDENT — greyscale for baked-value meshes, contour/matte+outline for clean forms; greyscale reads FAKE (flat blob) on form meshes.
  - **R3 (the answer):** enabled **outline-on-HATCH** (the hull is a separate ink pass → works under hatch too; `meshOutline` now native|hatch). **`hatch + outline ~0.5` = the UNIVERSAL WINNER** across every mesh — pen-and-ink: outline gives forms their silhouette + recovers detail-mesh screens/buttons, hatch shades inside. Beats every single-control option. Outline now exposed on BOTH native + hatch in `AiMeshControlsEdit`. tsc+build GREEN.
  - **→ RECOMMENDED DEFAULT for AI meshes = hatch (cross-hatch) + outline ~0.5.** Setting it as the literal default needs per-mesh default handling (so it doesn't entangle the global native/2D dials) — DESIGN CALL flagged for Sebs.
  - **R4 (Sebs "greyscale could be lighter, did u test every toggle / every svg port"):** (a) **Greyscale default DARKNESS 0.18→0.40** (`AI_MESH_DARK_DEFAULT`) — the grey sweep `/tmp/grey-*` showed 0.18 buries detail-mesh screens/buttons; 0.40 keeps them legible, ink-family. (b) **svg-port-on-mesh BUILT** (the one untested surface — the projection pipeline): added `'svg-port'` to the surface enum; `Stroke3DContents` builds the object's drawing into the svg-port ink/relief texture (`buildSvgPortTexture` w/ the object's strokes) → `HardMesh` projects it via PLANAR UVs (`planarUv`, geometry cloned before UV rewrite). demoWall suzanne objects now carry a real catalog drawing (gameBoy/pokeball/vinyl) as source markup so the projection has real content + a better 2D fallback. **MECHANISM WORKS (meshes take the svg-port material, no longer raw PBR) BUT v1 = dark blob:** the planar projection assumes the mesh front = XY plane, but GLB exports orient per-mesh → the drawing collapses edge-on. Legible projection needs per-mesh front-axis detection + lighting tuning = the genuine "massive pipeline". **NOT added to the surface picker** (greyscale/native/hatch/og-pbr stay the shipped 4); svg-port is wired+testable via `__dd_canvas3d.setAiMeshMaterialMode('svg-port')`, fallback = greyscale (never raw PBR). tsc + build GREEN.
  - **✅ svg-port-on-mesh BUILT + WORKING + SHIPPED (Sebs "do a real build… until everything without a doubt works and is perfect"):** the object's LINE WORK (its strokes) is rasterized (`rasterizeStrokesToTexture`, no-mipmap crisp) and projected onto the GLB via planar UVs (HardMesh, broadest-face axis detection). The treatment that WORKS = **ENGRAVED: a DARK ink form with the drawing as LIGHT incised lines** (emissive-glowing on the dark ground, low form key so the ground stays dark) — high contrast on the light desk, reads beautifully (Game Boy wears its screen/d-pad/buttons, turntable wears its vinyl spiral, Poké Ball its band+button). The earlier dark-blob / washed-out dead-ends were: (1) reused the dark-form CARVE texture (wrong source), (2) light-paper-on-light-desk (no contrast), (3) mipmap minification fading the lines. Fixed all three. Shipped as the **"Engraved"** option in both surface pickers (AiMeshControlsEdit + Canvas3DChrome); persists via materialMode; greyscale fallback if the object has no strokes (e.g. a photo-upload mesh). Verified live tight-crop on Game Boy / turntable / Poké Ball — all clearly read. tsc + build GREEN, all 4 other surfaces no-regression.
- **Dev hook KEPT:** `window.__dd_canvas3d.{setStyle3d,setMaterialPreset,setNativeProps,setHatchGrammar,setHatchDirection,setAiMeshMaterialMode,setAiMeshDark,setAiMeshContrast,setGeometryMode}` in `Canvas3DContext` — harmless, reused for 3D verification (strip in the Phase-A redesign).
- **STILL OPEN (the FORM axis):** AI-mesh as a geometry-mode entry + lift the upload stroke-derivation skip so stroke geometry modes derive from the saved SVG (Sebs confirmed the SVG bridge). svg-port-ON-mesh = separate projection research. Native gated by mesh-type (auto) = smart-layer later. Greyscale auto-tune-by-darkness = nice-to-have.

## 🆕 R36 (2026-06-27) — "ALL 3D CONTROLS ON AI MESHES" — architecture locked + SURFACE axis de-risked (live-proven)
- **Sebs's framing, locked (the big build):** make the full 3D control suite drive an imported AI mesh (GLB), not just the 4 AI-mesh toggles. Resolved into TWO orthogonal axes:
  - **FORM** (= geometry mode: auto/rod/extrude/inflate/solid + **AI-mesh** as one more entry). Stroke-based modes generate from the object's **saved SVG** (every object has one — drawn, or Quiver-traced); AI-mesh is the optional extra form. Picking a stroke mode "overwrites" the mesh because you chose a different *way to make the form* — that's the wedge, not a bug. ⚠️ Code-confirmed the SVG bridge: a 3D object derives strokes from `render_config.strokes` else `svgMarkupToStrokes(svgMarkup)`; uploads currently skip derivation (`sourceImage` set → null) as a QUALITY call (traced photo → rough extrude), NOT missing data — enabling Form-on-mesh = lifting that skip for the explicit pick. Pure text→3D w/ no drawing = the only true mesh-only case (gets a Quiver SVG per the locked arch).
  - **SURFACE** (= native material / hatch / svg-port) rides on top of whatever form is active. svg-port already works on stroke forms TODAY; svg-port-ON-the-mesh is the one hard tier (needs projection — separate research build).
- **SURFACE axis DE-RISKED + live-proven (this round):** `HardMesh` now takes an optional `engineMaterial` — when set, OUR material (the exact native-preset / screen-space-hatch instance the local geometry uses, so the parent's per-frame hatch uniform sync drives it for free) is assigned to every mesh in the GLB instead of the greyscale re-skin. The hatch shader is **screen-space (`gl_FragCoord`)** → no UVs → works on arbitrary GLB topology; native is a standard lit material → also topology-agnostic. Wired behind dev flag `window.__dd_aiMeshSurface='engine'` (+ a dev hook `window.__dd_canvas3d.setStyle3d/...` in `Canvas3DContext` to drive style without the chrome). `engineMaterial=null` ⇒ greyscale, **byte-identical default, no regression**.
- **VERIFIED LIVE** (headful Chrome, `tools/verify-surface-on-mesh.mjs` on `/desk?test=suzanne`, PNGs `/tmp/surface-on-mesh/`): greyscale→HATCH→NATIVE on the 5 Suzanne meshes — both non-blank, hatch diff 84.7 / native diff 84.6 vs prior, toggle-off restores greyscale **0.00 diff** (no state damage). Eyeballed: hatch = clean pen-ink dressing on the meshes, native = matte-clay forms. **Sebs aesthetic sign-off pending.** tsc green.
- **NEXT (buildable, awaiting Sebs's "looks good"):** (1) wire the SURFACE picker into the real AI-mesh material/Look control (add Native presets + Hatch beside greyscale/PBR, greyscale default); (2) the FORM axis — AI-mesh as a geometry-mode entry + lift the upload stroke-derivation skip for the explicit pick. (3) svg-port-ON-mesh = separate research build. + **Quiver SVG = its own style, only on a Quiver object** (same pattern).

## 🆕 R35 (2026-06-27) — ROTATE-HANDLE REDESIGN: body=move, clean handle=rotate, NO grip, NO mode switch (Sebs-directed, live-verified)
- **Problem (Sebs, escalating):** the 3D pointer model fought itself. R29 made body-drag = ORBIT-rotate; the ugly ⠿ braille grip = MOVE. Physics blocked rotate, and Sebs hated the grip + the move/rotate conflict: *"WE DO NOT REMOVE A FUNCTION WE MAKE IT ALL WORK… rotate the object without that ugly grip icon while getting everything else to work… this can't be no fucking mode switch."* Agreed ("Yeah") to a clean visible rotate HANDLE over hidden gestures.
- **Redesign (built + live-verified):** ONE pointer model. **Body drag = MOVE** (flings under physics, foreign-drag block intact); a **tap opens the card** — same `handlePointerDown`/`handlePointerUp` path 2D objects use. **Rotation moved off the body onto a clean rotate HANDLE** (top-right, hover-reveal on ANY 3D object, circular-arrow glyph, fully-rounded pill) driving a per-object **tumble {az,el}** read imperatively each frame (no React re-render on drag). The ⠿ grip is DELETED. No mode switch; move never removed.
- **Threading:** new `TumbleState` + `TumbleGroup` (wraps `StrokeMeshes`, rotates about origin — form is origin-centered so it spins IN PLACE; identity/no-op when no ref → `/canvas` OrbitControls untouched). `tumbleRef` flows `DeskObjectView → DeskObjectArt → LiveObject3DSlot → Object3DView → Stroke3DContents → TumbleGroup`. Desk slots set `orbitable=false` (slot non-interactive → body events fall through to MOVE); the handle mutates the ref via pointer-capture. Foreign 3D objects keep rotate (view-only inspect, session-local) — "don't remove a function".
- **Cleanup:** removed the dead capture-phase tap shim (`tapStartRef`, `onOpen3dTap`/`handleOpen3dTap`) + the wrapper's `physicsActive` prop (physics reads from refs in the handlers). tsc clean.
- **VERIFIED LIVE** (headful Chrome, real WebGL, `tools/verify-rotate-handle.mjs` on `/desk?test=suzanne`): handle appears on hover w/ SVG rotate glyph + **no ⠿** · handle-drag changed the mesh render (84.8/byte) + **moved the object 0.0px** (rotates in place) · **body-drag moved it 180px** (MOVE preserved) · tap opened the card. ALL PASS. tsc green.
- **⚠️ Supersedes R29 `orbitable = rotatable && !physicsActive` + R34 `orbitable = rotatable`** — `orbitable` is now always false on the desk; rotation is the handle, not the body.
- **NEXT (the active thread, Sebs 2026-06-27):** back to the Suzanne/AI-mesh build. THE BIG ONE = **get the FULL 3D control suite working on AI MESHES** (imported GLBs), not just the 4 AI-mesh toggles. + **Quiver SVG becomes its OWN style, accessible only when the object is a Quiver SVG** (style-specific entry, same pattern as the AI-mesh Look entry).

## 🆕 R34 (2026-06-26 night) — SUZANNE API explored + AI-mesh wall integration started (Sebs co-design session)
- **BUGFIX (Sebs "when physics is on I can't rotate the 3D object"):** `DeskPage` line ~661 `orbitable` was `rotatable && !physicsActive` — physics-ON deliberately killed orbit + made the object hand-flingable. Changed to `orbitable = rotatable` → orbit ALWAYS wins for a 3D object; it still physics-simulates (collides/shoved), you just rotate by dragging instead of hand-flinging. Verified live (physics ON, drag → turntable rotated, `/tmp/orbit-before|after.png`). tsc+build green. Trade: no hand-fling of 3D objects in physics (would need a separate grip gesture — future).
- **Suzanne 3D API (suzanne3d.com) — tested live.** Key (test, `sk_test_…`) in `~/Desktop/rock3d-lab/.env` (no git there). Harnesses in rock3d-lab: `suzanne-test.mjs` (text-to-3d), `suzanne-upload.mjs` (photo-to-3d via presigned upload — INLINE base64 FAILS fast w/ `vendor_model_error`; the UPLOAD path works), `suzanne-dl.mjs` (download needs the auth header on `download_url` or 401), `render-glb.mjs` (GLB→PNG via model-viewer). Base `https://api.suzanne3d.com`, Bearer auth, ~$0.85 + 2–6min/gen.
- **FINDINGS:** text-to-3d = clean polished meshes, well-proportioned, **style IS prompt-definable** (matte clay / chunky / "sketchy hand-drawn black-ink" all landed). photo-to-3d on a REAL photo (purple GBA) = clean accurate. **photo-to-3d on FLAT doodles = unreliable** (gameboy over-thick "3 stacked", pokeball "dumbbell") — no depth cues. NO prompt allowed on the image path (API rejects it). → **Routing decision:** text → Suzanne text-to-3d; uploaded photo → Suzanne photo-to-3d; **hand-drawn doodle → OUR own extrude/svg-port** (not Suzanne).
- **ARCHITECTURE Sebs locked (the unification):** every input (draw/image/text) → **SVG doodle FIRST** (image+text via Quiver), a normal desk object w/ normal controls; **"Make 3D" is an optional upgrade that routes by source**. The Quiver-SVG path + the AI-mesh (Suzanne/Trellis) path should STOP being separate bolt-on panels → become **entries in the SVG-style dropdown with style-specific toggles** (reuses the existing per-style modifier-set mechanism). Quiver = easy (a 2D SVG style); AI-mesh = a "mode" entry. The exact-style answer = **svg-port-on-arbitrary-mesh** (apply OUR render style to Suzanne's mesh — "mesh from them, style from us"), acknowledged as a MASSIVE new pipeline (deferred research+build phase).
- **PIECE A DONE + verified:** 5 Suzanne GLBs staged in `public/suzanne/`, wired as a hard-mesh wall via `buildDemoWall` variant `'suzanne'` (+ `hardMeshUrl` added to `DemoWallObject.renderConfig`) + DeskPage test-seed passes the variant. **`/desk?test=suzanne`** = the 5 meshes as movable/editable 3D desk objects (seeded as yours). Fixed a clipping bug: `Stroke3DScene` HardMesh `target` ×0.7 so wide/flat meshes (gameboy) get margin instead of clipping the camera frame. tsc + build green.
- **PIECE B FIRST CUT DONE (2026-06-26 night):** the AI mesh is now a **"Look" dropdown** entry, not a separate bolt-on panel. In the edit-modal mesh branch (`ObjectSurface` ~line 1996) the controls lead with a `<Dropdown label="Look" value="ai-mesh">` listing **"AI 3D mesh" + all F3 2D styles**; `onChange` drives the EXISTING `setView3d`/`handleStyle` state (ai-mesh→3D, a 2D style→flip to 2D doodle + apply) so the existing render switch responds — NO control-rendering rewrite, NO `F3SvgStyle` pollution ('ai-mesh' is a Look option, not a 2D style). Verified live (`/tmp/look-dropdown.png`): "Look: AI 3D mesh" + Material/Darkness/Contrast below, 0 errors. tsc+build green.
- **NEXT:** PIECE B remainder = (a) **Quiver** as a Look option once that path's built; (b) optionally give 2D objects the same "Look" framing (today 2D uses SurfaceControls' own SVG-style dropdown — functionally fine, mild naming inconsistency). Then PIECE C = svg-port-on-mesh (the big new pipeline). Original wart (mesh showing irrelevant 2D toggles) was never real — the edit modal already showed mesh controls; B made them dropdown-driven. **PENDING FORK (Sebs to answer):** do "Quiver" + "AI 3D mesh" live in the SAME SVG-style dropdown, or a separate little mode switch beside it? Then PIECE C = svg-port-on-mesh (big). Also: Quiver text→SVG leg unconfirmed (Quiver may be image→SVG only; text→SVG might need ChatGPT/Gemini). Suzanne integration needs a server-side EDGE FUNCTION (key is secret) + Sebs deploy before it's live in-app.

## 🆕 R33 (2026-06-26) — ML WIRED LIVE: the trained region classifier goes into the chain ("look at both", Sebs-directed)
- **Sebs: "do the ml" → "always look at both" → "but yeah".** Wired the trained signals-only region-role classifier (`datasets/smart-layer.signals.model.json`, 92.7% held-out, beats rules +15.2pts) into the live Smart Hachure chain. tsc + build GREEN.
- **Built:** `learnedProvider.encodeSignals32` (32-feature signals encoder, replicates lib-signals + enrich EXACTLY) + `predictRoleSignals` + `makeLearnedSignalsProvider`; `signalsModel.generated.ts` (artifact bundled into src via `tools/ml/emit-signals-model-ts.mjs`, re-emit after retrain); `classify()` rewritten to **"look at both"** — runs rules AND model every region, `reconcileBoth`: agree→trusted, in-vocab disagreement + model conf≥0.6→model wins, else rule keeps its nuance (out-of-vocab roles the model never learned). Wired default `[ruleEngineProvider, LEARNED_SIGNALS_PROVIDER]` in `index.ts`.
- **PARITY EXACT** (`tools/ml/parity-check.mjs`): runtime encoder == training encoder, 0/1549 vector mismatches (delta 0.0), 0 prediction mismatches → the live model IS the trained model.
- **Blast radius** (`tools/ml/blast-radius.mjs`, 1549 regions): agree 74.0% · model overrides 9.2% (mostly structural-frame→paper = rules over-marked, model leaves blank, aligns w/ I-2 conservative) · rule kept 16.8%.
- **Regression check:** A/B-rendered the 5 most-overridden catalog shapes (nintendo/punk/roots/running/sony) model-OFF vs ON (`/tmp/ml-ab/*`) — visually ~unchanged → NO regression. The corrections are real but subtle (biggest override is between two minimally-marked roles); value shows most on OFF-catalog doodles where rules guess worse.
- **DEFAULT FLIPPED TO OPT-IN (2026-06-26, same session):** Sebs eyeballed the A/B and caught a REGRESSION — on `nintendo` the model reclassified the Mario hat as solid-content and BURIED the white "M" detail (a per-region classifier can't tell "should be solid" [sony win] from "has a detail to preserve" [nintendo M loss]). He noted the deeper point himself: per-region classification makes shading vary object-to-object + can misfire — exactly the §7 / I-2 rationale. So default reverted to **RULES-ONLY**; model is wired+validated+available but OFF unless opted in. **OPT IN:** `window.__DD_ML_ON__ = true` (live) or `opts.providers`. Live default now == pre-ML behavior, zero regressions.
- **⚠️ LOCKED-MODEL NOTE:** the M regression VALIDATES §7 (darkness-driven I-2 = consistent + can't bury details; role classifier = inconsistent + misfires). The model's avg accuracy gain is real (sony) but it's not uniformly better.
- **I-2 GUARD added (Sebs "why not both?") — the "detail-aware" half, reframed as I-2 ENFORCEMENT.** Root cause of the M: the model overrode LIGHT/paper-darkness regions (darknessL 0.00-0.08, stroke-only circle outlines) to `solid-content` (fill black) — a hard I-2 violation (source darkness owns identity; a light region can't cross to near-black). FIX (`classifier.reconcileBoth`): the model may NOT override a region to a DARK-FILL role (`solid-content`/`dense-tonal`) when `darknessL < 0.3` — keep the rule, no matter the model confidence (I-2 is an invariant, not a vote). Blocks 25 light→dark-fill overrides (the M class), keeps 117 legit ones. **VERIFIED visually (`/tmp/ml-ab2`, model now opt-in via `__DD_ML_ON__`): nintendo M RESTORED + sony solid win PRESERVED** (sony's poster is genuinely dark ≥0.3 → allowed). tsc+build green.
- **FULL OVERRIDE AUDIT (Sebs "all object u check") — DONE, DEFAULT-ON RESTORED.** Only 14 catalog objects have post-I-2-guard overrides (117 total). Rendered ALL 14 rules-only vs rules+model, judged each (me + 4 parallel vision agents, no sampling): **1 BETTER (sony), 13 SAME, 0 WORSE** — zero detail-burying anywhere. Verdicts logged `tools/ml/override-audit.json` (confirmation labels, feeds provenance). Gate passed → flipped default back to RULES+MODEL; OFF switch now `window.__DD_ML_OFF__ = true`. tsc+build green.
- **"Both" status:** detail-aware half = DONE (I-2 guard) + AUDITED (0 regressions). Human-in-the-loop confirm-layer UI (model proposes / user vetoes per object via the override store) = optional next build — the audit + I-2 guard already remove the disasters, so it's per-object peace-of-mind for OFF-catalog surprises, not a guardrail. Golden-v3 re-bless still pending (refinement).

## 🆕 R32 (2026-06-26) — "SMART" one-tap auto-style toggle (the wedge on-ramp; Sebs "one toggle that smart-defaults everything")
- **Contract-checked FIRST (09-LOCKED-MODEL.md):** Sebs's first instinct ("Auto picks the best TECHNIQUE per region") = the EXACT thing the
  locked model forbids (I-1 fillStyle/Style are sacred user picks; §7 tore out the per-region role-classifier — "never rebuild"). Flagged it; he
  chose the I-1-compliant version: a SINGLE "Smart" toggle that auto-picks the WHOLE-OBJECT config as a suggestion you can override.
- **REUSED the existing engine (no rebuild):** `smartPick.ts` already analyzes a doodle's whole-object character (meanDarkness, regionCount,
  inkPerDiag, thinStrokeFraction, linework vs fills…) and votes style+fillStyle+modifiers — it just only fired ONCE at ingest with an undo chip.
  Exposed it as an ON-DEMAND button: `DrawPanel.smartRunRef` re-runs `smartPickFromMarkup(currentMarkup, source) → applySmartPick` (same path as
  the ingest auto-pick, so dropdowns reflect it + stay overridable; no once-latch).
- **WIRED into `SurfaceControls`** (the shared control column — NOT the chrome). Early take put the pill in `SmartHachureChrome`, but that panel sits
  BEHIND the DrawPanel popup and isn't visible in the edit modal → reverted. `SurfaceControls` (used by DrawPanel popup, edit modal, AND drawer) got an
  optional `onSmart`/`smartActive` → renders the "✦ Smart" pill above the SVG-style dropdown. One component, every surface gets it for free.
- **BOTH surfaces live now:**
  - DrawPanel (`stableSmartRun`, line ~2048): `smartPickFromMarkup(currentMarkup, source) → applySmartPick`. Shows while a doodle has content.
  - EDIT modal (`ObjectSurface.runSmartPick`, line ~922): re-runs the pick on `artMarkup`, applies via `setSurfStyle`+`applyStylePreset`+secondary axes
    (a faithful copy of DrawPanel's `applySmartPick`). New local `smartOn` state lights the pill "· on"; ANY manual move (setSurfMod/handleStyle/
    handleReset) routes through `clearSmartPick()` → clears it. I-1 preserved — the dropdowns reflect the pick and stay fully overridable.
- **ML-dataset parity** (`feedback_keep_feeding_smart_ml`): `smartPickFromMarkup`→`evaluateSmartPick` already auto-logs every `'pick'`/`'abstain'` to
  `__dd_inputPickLog`. Added the missing `'overridden'` signal in the edit modal — a manual move while a Smart pick is live logs `logSmartPickOverridden`
  (DrawPanel already did this; edit modal didn't). Verified live: tap Smart → manual move → pick-log = `["pick","overridden"]`, both with full axes+features.
- **VERIFIED live BOTH:** (a) upload face → Smart → Clean→Rough-handdrawn + fillStyle hachure (`dd-smart-upload.mjs`). (b) edit modal on `/desk?test=1`
  pokeball → Smart → SVG style **Bold ink→Rough hand-drawn**, preview visibly wobbled/sketchy, pill lit "✦ SMART · ON", dropdowns reflect the pick
  (`/tmp/verify-smart-edit.cjs`, screenshots `/tmp/smart-edit/01-before|02-after.png`). tsc + build green, 0 React errors.
- **Abstain acknowledgment** (no more silent no-op; Sebs: "keep abstain, just make it clear"): `onSmart` returns `'applied'|'abstained'`; on abstain the shared
  `SurfaceControls` pill shows a FILLED chip "✦ Smart · looked — nothing to change" (warm-gray fill + dark readable text, held ~2s, reverts) — honest (it LOOKED, found
  nothing; not an endorsement) + legible. 3 distinct states: resting/applied "· on"/abstain. Fixes BOTH surfaces from one component. Verified live + screenshots, 0 errs.
  FORK RESOLVED: keep honest-abstain, NOT always-pick-something.
- **Draw-input OVER-ABSTAIN FIXED** (the big one — Smart now works on real freehand, not just the catalog): tested Smart on actual hand-drawn doodles → a clean face/house
  ABSTAINED. Cause: `input==='draw'` had only `draw-dense-scribble` + `draw-bold-strokes`; ordinary moderate-stroke doodles matched nothing (fill rules need filledCount,
  `upload-linework` is upload-gated). FIX: new `draw-linework` rule (`smartPick.ts`) → sketchy+none for real line art (regionCount 2-9, inkPerDiag≥1.2, per-stroke<1.2),
  mutually exclusive w/ the other 2 draw rules. Verified live (face/house/tree → pick; trivial squiggle → still abstains; catalog upload picks byte-identical = no regression).
  ⚠️ `sketchy` default is tunable.
- **Upload-input OVER-ABSTAIN ALSO FIXED:** pulled real features for the 3 abstaining catalog uploads → 2 gaps. Added `upload-light-linework` (line art w/ 1 near-white fill →
  sketchy/none: shoe, macbook) + `few-mid-dark-fills` (3 medium-dark fills, the few-big-blacks↔dark-fill-field gap → rough/hachure: gameBoy). Verified ALL 6 catalog objects pick,
  ZERO abstains; the 3 that worked = byte-identical (no regression). NET: Smart confidently styles real freehand AND uploads now; abstain only for genuinely-nothing input.
- **NEXT for Smart:** the learned-ML "best" is the Phase-B/C wedge finale (train on the fed dataset, then on his hand). Today it's the honest rule engine.
- **Primitives (R31) re-checked — NO bug.** Chased a suspected `rect` vs `rectangle` kind-mismatch; traced all insert paths: `DrawSurface.insertOutlineFor()` special-cases
  rect/square/triangle/circle/ellipse with explicit direct geometry (so the library-kind mismatch is moot for insert), rounded-rect + decoratives go via generateShape with
  real library keys. R31's live-Circle + sibling code paths cover rect/triangle. De-staled the misleading `ShapeStrip` KIND NOTE that claimed these return null. No code-behavior change.

## 🆕 R31 (2026-06-26) — Drawing-tool depth: BASIC PRIMITIVES added to the insert tool (Sebs "move on" from physics)
- **Gap (Explore-surveyed):** the shape-insert library (`src/app/lib/draw/shapeLibrary.ts`) had 12 DECORATIVE shapes (heart, cloud, lightning,
  star, pentagon…) but NONE of the everyday basics — you could insert a heart but not a square/circle. Backwards.
- **FIX:** added `rectangle, circle, triangle, rounded-rect` to `SHAPE_LIBRARY` (pure unit-box generators: new `ellipseUnit` + `roundedRectUnit`
  helpers; triangle via the existing `regularPolygonFilledUnit(3,0)`; rectangle = unit corners). Put them FIRST so they lead the picker. Added their
  glyphs to `ShapeStrip.LIBRARY_GLYPH` (▭ ○ △ ▢). Wiring was ALREADY there (the Explore agent's "gated/unused" claim was WRONG — `ShapeStrip` auto-
  renders `SHAPE_LIBRARY`, `generateShape(kind,bbox)` looks up by kind; `kind: string`, no union to extend).
- **VERIFIED live** (`dd-primitives.mjs`): all 4 basics show in the Shapes ▾ popover; armed Circle + dragged a bbox → inserted a clean circle
  (paths 0→3), renders correct in the rough style. tsc + build green, 0 errors.
- **Drawing-tool-depth remainder (Explore-ranked):** open-shape shading = DEFER (the lasso already solves it — draw a loop around the open shape);
  full draw tools on the /canvas (3D) route = MEDIUM (~state plumbing, lower value since /canvas is the test surface). Next-biggest Phase-B rock is
  the SMART-LAYER/ML wedge (make "smart" real: auto-pick + trained model on the fed dataset).

## 🆕 R30 (2026-06-25) — "3D Rock" style preset + demo=rock eyeball wall (tsc+build GREEN; needs Sebs WebGL eyeball)
- **Context (portfolio-side thread):** Sebs wants his sketches turned into the **Rock 3D font look** (chunky extruded block + hand-drawn
  wobbly outline + matte). Met the **Suzanne** founder — she says style is **prompt-definable**, but he must TEST the API (un-integrated;
  no code/key in repo yet — `.env`/grep clean). Decision: build the **deterministic baseline now** to A/B Suzanne against later.
- **Built (pure COMPOSITION — engine already had every piece):** `ROCK_3D_PRESET = { geometryMode:'extrude', style3d:'svg-port',
  materialPreset:'matteClay' }` in `lib/demoWall.tsx`. extrude = chunky bevelled slab (EXTRUDE_DEPTH 0.5 + rounded bevel); svg-port carries
  the styled 2D hand-marks onto the form; matteClay = matte pencil. NO engine/render changes.
- **`?demo=rock` eyeball wall:** `buildDemoWall(limit, variant)` now branches — `variant==='rock'` → 6 closed shapes (pokeball/gameBoy/medal/
  ring/fidgetCube/seltzerCan) each stamped `is3d:true` + `geometry3d:ROCK_3D_PRESET`, mixed bold-ink (chunky) + rough-handdrawn (wobbly) so
  Sebs can compare hand character. DeskPage demo seed passes `searchParams.get('demo')` → builder (1-line). The demo seed already passes
  `renderConfig` verbatim (DeskPage:1774) + `force3dIds` reads `is3d` (1650) + `geometry3d` (375) → LiveObject3DSlot, so **NO DeskPage logic
  change** beyond the 1-line variant pass. Normal `?demo=1` wall byte-identical (variant!=='rock' → old path).
- **VERIFY:** tsc clean + `npm run build` green. ⚠️ The 3D LOOK is unverified by me (repo rule: WebGL = headed-Chrome/Sebs only). **Sebs:
  open `localhost:5185/desk?demo=rock`** (dev on :5185, 5182 was taken). Tune levers if close: extrude depth, reliefDepth, bold-ink vs
  rough-handdrawn, matte read. If svg-port-on-extrude doesn't capture Rock → try hollow-outline front face / deeper bevel.
- **NEXT:** Sebs eyeballs → tune the preset OR pivot composition; separately, test the Suzanne API (prompt-defined style) once the key's stashed.

## 🆕 R29 (2026-06-25) — RAPIER unlocked + TOP-DOWN desk physics built (toggleable, live)
- **Engine decision:** Sebs self-hosting off Figma Make → the no-Rapier-in-Make lock is lifted (it was Make-platform-only). Installed
  `@react-three/rapier@1.5.0` (R3F-v8 line; v2 wants R3F v9/React 19) for future 3D physics + `@dimforge/rapier2d-compat@0.19.3` for the
  2D desk. cannon-es dropped. Recorded in `project_desk_doodles_no_rapier_in_make` (now SUPERSEDED header) + CLAUDE.md stack. ⚠️ npm install
  prunes the `--no-save puppeteer-core` harness dep — reinstall after any install.
- **Desk physics = TOP-DOWN tabletop (Sebs picked):** NO gravity; doodles have weight, collide, get shoved, fling, and settle (linear+angular
  damping = tabletop friction). NOT side-on gravity. `src/app/lib/deskPhysics.ts` (Rapier2D manager: sync/grab/move/release/step/read/isSettled,
  px↔physics scale) + `src/app/lib/useDeskPhysics.ts` (rAF loop: steps the sim, writes left/top/rotate straight onto the object nodes
  imperatively — NO per-frame React; state synced only on the settle edge).
- **Engine PROVEN** (`tools/harnesses/dd-physics-smoke.mjs`, node): collision separates overlapping boxes to a clean gap + settles · no-drift
  (0 gravity) · fling slides ~490px then rests · grab-shove knocks a neighbour 216px. Tuning (damping/restitution/friction/scale) all in deskPhysics.ts.
- **WIRED into DeskPage, TOGGLEABLE** (header "Physics · on" pill; OFF = desk byte-identical to before). Gated by `physicsOnRef`: pointer-down grabs
  the body (mine-only), move drives it kinematically + samples fling velocity, up releases with the fling (skips anti-pile), settle-edge syncs
  positions back to state. Node registry via a new `nodeRef` prop on the object wrapper. tsc + `npm run build` GREEN (Rapier WASM bundles inline, no Vite config needed).
- **LIVE-verified** (`tools/harnesses/dd-physics-live.mjs`, demo desk, MINE placed objects): toggles ON, a flung doodle **slid 787px after release
  then settled** = the sim drives the real desk end-to-end; desk stays stable (no drift/explosion), 0 page errors. ⚠️ The live COLLISION assertion
  failed on test SETUP (flung object shot to the edge, the two sampled objects weren't overlapping) — engine collisions are proven, so this is a
  harness gap, not a bug. Sebs to confirm collision feel by playing.
- **FEEL PASS 1 (Sebs played: "too feathery, no recoil/weight/skidding" + "collider is a box, want the actual outline"):** retuned for WEIGHT —
  density 1→5, linearDamping 3.2→1.7 (carries momentum, skids ~680px), angularDamping→2, restitution 0.16→0.42 (recoil), friction→0.45. **OUTLINE
  colliders:** new `src/app/lib/svgToHull.ts` (samples every geom el → monotone-chain convex hull → centred 180px local px); DeskPhysics uses
  `ColliderDesc.convexHull` (box fallback), hull cached per object in the hook. **BOUNCY WALLS** (`setBounds`, restitution 0.55) around content+700px
  so a hard fling recoils instead of sailing off. ALL live-verified (`dd-physics-collide.mjs`: drove a doodle into a neighbour → **169px push**;
  `dd-physics-live.mjs`: fling 682px + bounces; 0 errors; tsc+build green). Convex hull = concave shapes (U/donut) collide as outer silhouette (later: decomp).
- **FEEL SIGNED OFF (Sebs "looking good" 2026-06-25)** after two "too hot" rounds tuning the throw down: `flingScale` 0.45→**0.22**, `maxFling`
  850→**450**, `restitution`→**0.3** (release velocity scaled+clamped in DeskPhysics.release). A fling now skids ~165px — controlled toss, keeps the
  weight/skid/recoil. Final knobs all in deskPhysics.ts defaults.
- **SMART per-object physics (Sebs "go to what you feel is best" → the wedge):** each doodle's weight/bounce/tumble is derived from its OWN
  SHAPE signals (object-AGNOSTIC per project_desk_doodles_generalizes), NOT identity. `hullPhysicsProfile()` in svgToHull.ts: roundness
  (4πA/P²)→restitution, coverage (hull area/footprint)→density, elongation (bbox max/min)→angularDamping. PhysObjInput carries per-object
  density/restitution/angularDamping (fall back to world defaults); hook computes+caches the profile with the hull. VERIFIED differentiates
  (`dd-profile-test.mjs`): round/pokeball = heavy+bouncy (d6.8 r0.57), thin/guitar = light+tumbles (d3.4 ad1.2), boxy = heavy+thud. Honest:
  this is a RULE ENGINE on shape signals (not trained ML) — the signals→behavior pairs can feed the smart-layer dataset later. tsc+build+live green.
- **PHYSICS TEST DESK `/desk?test=1` (Sebs "need a test desk, hard to tell if it's working"):** small empty desk, physics auto-ON, 6
  shape-DISTINCT catalog doodles (pokeball round · gameBoy boxy · shoe · guitar long/thin · vinyl · macbook) so the smart per-shape behaviour is
  obvious. Reuses `buildDemoWall(6)` (real catalog render path — hand-authored SVGs render INVISIBLE through SvgStyleTransform, lesson), seeded as
  YOURS (draggable). `?test` skips DB load + demo seed; `?test=1&n=N` for more. Verified renders + fling works (`dd-testdesk.mjs`).
  **FIX (Sebs "can't place from shelf on test desk"):** `addObject` only treated `?demo` as a local no-DB wall, so test-desk adds (incl.
  place-from-shelf, which routes through addObject) fell to the "can't add to a public desk" block. Added `isTestDesk` to that local branch →
  adds/place-from-shelf now land locally + auto-become physics bodies. Verified `dd-testdesk-add.mjs` (add → 6→7, placed object flings 363px).
- **DIFFERENTIATION PASS (Sebs "hard to notice the difference" → exaggerated, AUTONOMOUS):** widened every spread + added two visible tells.
  `hullPhysicsProfile` now: density 1.5–11.5, restitution 0.04–0.86, **per-object linearDamping** 0.6–5 (light/thin SKIDS far, heavy PLANTS — the
  most legible cue), angularDamping 0.4–4.6, and **spin 0–1** (elongated → SPUN on throw via DeskPhysics.release setAngvel). Verified live
  (`dd-physics-diff.mjs`): guitar throw = 491px slide + **221° spin**; pokeball = 381px + **0° spin** (rolls straight). Wall restitution 0.55→0.72.
- **PLOP-IN / FLOP DONE (autonomous; Sebs "a little more flop when placed"):** a doodle added AFTER physics is on gets an outward shove (135) PLUS a
  wobble-spin (2.8 rad/s, settles at its shape's angular-damping pace) so it FLOPS in with life. Hook tracks knownIds (first batch = no nudge). Verified
  `dd-flop.mjs` (placed object moved 21px + spun 11° then settled at an angle). `DeskPhysics.nudge(id,vx,vy,spin?)`.
- **EDGE-TESTED + REGRESSION CLEAN (autonomous):** `dd-physics-edge.mjs` — scales to n=20 (286px fling, no hang), toggle on/off no crash, add-while-on
  OK, 0 page errors. Part editor (5/5 select+move+resize) + stroke editor (all strokes select) UNTOUCHED + verified. All routes load 0 errors
  (`dd-route-smoke`). Demo clip sent to Sebs (`/tmp/physvid/physics-demo.mp4`).
- **DECISION (autonomous, flag for Sebs):** did NOT DB-persist physics positions — physics is a PLAY mode (in-memory, resets on reload to restore his
  arrangement); auto-saving scrambled positions would permanently rearrange his real desk just from playing. onSettle stays state-only.
- **EDIT-MODAL + PHYSICS — NON-BUG (chased hard, resolved):** a harness made it LOOK like opening an edit card froze physics drag; root cause was the
  harness clicking a `Back`/`Close` text button that does NOT close the edit card (it closes via Escape / scrim-click / X), so the scrim (fixed z=300)
  stayed up blocking the desk. Closed properly (Escape/scrim) → physics drag resumes fine (371px). NO product bug. Kept 3 harmless defensive
  improvements found en route: tap releases the grabbed body (no freeze if you tap-to-edit), `draggingIdRef` set eagerly in pointer-down, and the
  physics loop self-heals stale node refs via a new `data-desk-obj-id` attr. All debug instrumentation removed; tsc+build green.
- **3D-VIEW PHYSICS DONE (Sebs "Go"):** the 3D desk is FLIP-IN-PLACE (one shared WebGL canvas, each object's 3D form at its 2D wrapper position) →
  the SAME 2D top-down sim that drives the wrapper left/top already moves the 3D forms. Only the INTERACTION needed wiring: with physics ON, a 3D
  object must FLING (normal physics drag) not ORBIT. Added `orbitable = rotatable && !physicsActive` (DeskObjectView) → gates the wrapper's
  stopProp/capture-tap handlers AND the `LiveObject3DSlot interactive` (threaded a new `orbitable` prop into DeskObjectArt). Physics OFF + 3D =
  orbit unchanged (orbitable===rotatable), so zero regression. VERIFIED live (`dd-physics-3d.mjs`): flip to 3D + physics → fling moved a 3D form
  321px, forms render clean (matte-clay), 0 errors. This is 2D-sim-drives-3D-forms (objects slide/collide on the surface) — NOT gravity-stacking
  (that'd need a unified rapier3d scene with a ground plane — a bigger separate build if Sebs wants true 3D piles).
- **NEXT (Phase B remainder):** make the smart layer REAL (auto-pick + trained ML on the fed dataset) · more drawing-tool depth (primitives, full
  tools on the 3D/canvas route, open-shape shading) · optional gravity-stack true-3D physics · backend deploy 🧑‍💻 (Sebs's hands, LAST before Phase A
  redesign). Log new surfaces in POST-MAKEATHON-PLAN DESIGN-DEBT LIST.

## 🆕 R28 (2026-06-25) — PART EDITOR: the REAL "pops off" cause found on HIS data — 2 coordinate bugs fixed
- **The R27 rebuild fixed clean UPLOADS but NOT his actual doodles** (Sebs furious, rightly — I kept verifying on stand-in SVGs).
  Captured his REAL doodles from the desk=0 network load (`tools/harnesses/dd-capture-doodles.mjs` → `/tmp/dd-doodle-*.svg`):
  the "Draw over" (part-editor) ones have **off-origin/negative viewBoxes** (`-106 -60 500 298`) and **per-part transforms baked
  in from PRIOR edits** (`<circle … transform="translate(105.89 -43.98)">`) — neither of which my `0 0 W H`, no-transform test
  SVGs had. THAT mismatch is why every "verified" passed while he kept seeing it broken.
- **TWO coordinate bugs, both fixed + proven** (`tools/harnesses/dd-xform-test.mjs`: a baked-transform part inside a negative
  viewBox → selection box Δ=(0,0) on all 3 parts):
  1. **viewBox-origin double-shift** (`svgToParts.ts`): `getCTM` NORMALIZES the viewBox origin to 0 (verified:
     `tools/harnesses/ctm-test.mjs` — a child of `viewBox="-106 -60"` maps local 0→106), but partFit ALSO subtracts `vb.x`.
     Fix: `bboxInViewBox` adds `(vb.x, vb.y)` back so the bbox is in true viewBox-USER coords matching the rendered (stripped,
     viewBox-less) markup. Identity for `0 0 W H`.
  2. **transform-clobber** (`DrawSurface.tsx` render effect + `svgToParts` now records `part.transform`): a part's bbox already
     reflects its baked transform T0 (via getCTM), but the render effect REMOVED the transform at rest → the part snapped to its
     untransformed spot while the selection box stayed put = "pops off and appears somewhere else." Fix: record T0; at rest
     restore T0; when edited COMPOSE `translate()scale() T0` (never replace). Round-trips (composed transform becomes next T0).
- **Regression intact** (dd-parts-verify 5/5 select + move + resize), tsc + `npm run build` green.
- **⚠️ His EXISTING doodles are partly CORRUPTED by the OLD bug** — it saved parts at wrong spots (doodle-0 renders scattered:
  head shoved +105, eye −58). The fix STOPS new corruption AND lets him drag scattered parts back + save correctly. Old damage
  is data, not re-introduced.
- **STILL OPEN / bigger call (his fury is really about this):** the part editor is a POOR FIT for rough hand-drawn doodles —
  svgToParts shards them into clean-shapes + every rough overlay stroke as separate "parts." A DRAWN doodle re-uploaded DERIVES
  strokes → "Re-draw" STROKE editor (where selection works perfectly — `dd-stroke-select.mjs` proved smile selects). RECOMMENDATION
  to raise: route strokeless-but-derivable doodles to the STROKE editor on open (svgMarkupToStrokes), reserve the part editor for
  genuine shape SVGs → kills the confusing two-editor split. NOT yet done (design decision, needs Sebs's go).

## 🆕 R27 (2026-06-25) — PART EDITOR REBUILT in FRAME SPACE (the "box pops off somewhere else" bug killed) — verified
- **Why a rebuild (Sebs: "REBUILD IT FROM SCRATCH … look at how we did it before"):** the R26 part editor put shapes in a
  SEPARATE nested-`<svg>` (upload viewBox, letterboxed via preserveAspectRatio) and bridged clicks with getScreenCTM/getCTM.
  That space-mismatch was the whole defect — boxes off-center, small parts unselectable, "selection pops off and appears
  somewhere else" on move, glitchy resize. Patching it 4× failed; rebuilt on the PROVEN stroke editor's model instead.
- **The fix = ONE coordinate space.** Everything now lives in the 800×600 FRAME space, exactly like freehand strokes:
  parts render letterboxed into the frame via a single `<g transform="translate(ox oy) scale(s)">`; each part's **frame box**
  is the source of truth (`partBoxes` state, `frameBoxOf`); hit-test / select / move / resize all use `eventToSvgPoint` + the
  SAME `hitCorner`/`cornerXY`/`oppositeCorner` helpers the stroke editor uses. The selection box + handles are drawn directly
  at `frameBoxOf(part)`. Part and overlay are now both functions of one frame box → they CAN'T diverge (the old bug is
  structurally impossible). `DrawSurface.tsx`: rewrote the part state/effects block, pointer down/move/up, and the render.
- **VERIFIED on the LIVE /desk flow (not a headless harness — per the live-check rule):**
  - `tools/harnesses/dd-parts-verify.mjs` — upload 5-part SVG → place → Draw over → SELECT each part: selection box coincides
    with the shape **to the pixel, 5/5** (incl. the two small buttons UNDER the body bbox + the unfilled outline circle).
    MOVE: part + box both track the cursor (Δ=(89,60) for a (90,60) drag) and stay coincident. RESIZE via SE handle: shape
    45×45→95×95, box tracks. Smallest-area-wins hit-test = small parts under big ones are grabbable.
  - `tools/harnesses/dd-parts-serialize.mjs` — save is LOSSLESS: part-layer innerHTML keeps all 5 geometry els, the moved
    part carries its upload-space `translate(...)` (move persists), only the moved part is touched. **Done** enables on a
    parts-only move (was disabled pre-edit) → the "won't let me save unless I draw a stroke" complaint is fixed. Saved
    viewBox is code-floored at the original (≥200×300, can only EXPAND) → no crop.
  - tsc clean, `npm run build` exit 0, zero page errors throughout.
- **STATUS: select + move + resize + delete + lossless save all WORKING + verified for uploads/legacy (stroke-less) objects.**
  Drawn objects with recorded strokes still use the existing stroke editor (gated by `editableParts = storedStrokes ? null :
  svgToParts(artMarkup)`). NEXT: restyle/UNIFY the stroke-handle vs part-box interaction feel into one language; then the rest
  of Phase B (physics · smart-layer completion · real ML) → Phase A visual refresh → Phase C train-on-strokes. DB/Supabase
  deploy = LAST Phase-B step (Sebs's hands).

## 🆕 R26 (2026-06-24) — Phase B started: lossless element-based PART EDITOR (foundation + DrawSurface 2a built DORMANT)
- **Sequence reset (Sebs):** B (features) BEFORE A (design pass) BEFORE C (train on his strokes). DB/Supabase deploy = the LAST
  Phase-B step, right before the refresh (still NOT deployed — his hands). Plan: `docs/submission/POST-MAKEATHON-PLAN.md`.
- **Phase B.1 = lossless "edit any part."** Found: in-app DRAWN doodles already edit their parts (storedStrokes→Re-draw→select/
  move/resize/erase); only uploads/legacy are draw-over-only. svgToStrokes is LOSSY (fills→outlines) — wrong tool. Sebs wants
  lossless → **element-based parts** (each SVG shape stays a real element, fill intact). Coexists with freehand strokes.
- **Slice 1 (parser) ✓ DONE + validated:** `src/app/lib/svgToParts.ts` tags each geometry el with data-part-id + returns bbox
  (viewBox space) + computed fill. Test `tools/harnesses/dd-svgparts-test.mjs`: 8 real objects, **0 fills lost**, all tagged,
  bboxes sane, median 6 parts/obj (max 24). Guard: >60 parts → caller falls back to draw-over.
- **Slice 2a (select+highlight) BUILT but DORMANT** in `DrawSurface.tsx`: new optional props `editableParts`/`onSelectPart`,
  `selectedPartId` state, a nested-`<svg>` parts layer (native letterbox via preserveAspectRatio) + dashed selection box, and a
  tap-select hook at the top of `handlePointerDown` (click a `data-part-id` el → select; empty → clear → draws as normal). **ALL
  gated behind `editableParts`, which NOTHING passes yet → current drawing byte-identical. tsc + build GREEN.**
- **ACTIVATED + live-verified by Sebs:** ObjectSurface wires `editableParts = svgToParts(artMarkup)` for stroke-less objects →
  DrawSurface. **2a select VERIFIED** on both paths (strokes = existing `selectedStrokeId`; shapes = new). Hit-test = bbox in
  parts-viewBox space (offset by move) so UNFILLED outlines (a D-pad) are grabbable, not just the hairline.
- **2b MOVE built:** tap-to-select then drag the selected shape → `partXf` translate (composed w/ original transform, applied
  imperatively); selection box follows. Backdrop suppressed when `editableParts` active (killed the double-image ghost).
- **🎨 MONOCHROME AT UPLOAD — shipped + Sebs-approved ("looks good"):** `src/app/lib/monochromeSvg.ts` maps each shape's effective
  fill/stroke (getComputedStyle, resolves inheritance + `<style>` blocks) → its LUMINANCE grey; called in DrawPanel
  `acceptUploadMarkup` so uploads are colourless EVERYWHERE (desk/editor/3D), not patched per view. Design ruling: Desk Doodles is
  monochrome — "value from marks, never hue"; color would dilute the "doodle" identity. Value preserved so shapes stay distinct.
- **2d SAVE — DONE + Sebs-verified ("good now"):** DrawSurface emits the edited parts as a standalone SVG (transforms baked) via
  `onEditedParts` → ObjectSurface `editedPartsRef`; `handleRedrawDone` saves it even with NO strokes (added `partsEdited` flag so
  the Done button enables on a move, was stroke-gated). **Crop FIXED:** saved viewBox = the parts' live `getBBox()` after moving
  + 12% padding (my bbox arithmetic was wrong; getBBox includes the applied transforms). Round-trip verified: move shape → Done →
  persists on desk + reopen, uncropped, monochrome. (Old objects saved before the fix keep their bad frame — re-edit to refresh.)
- **PART EDITOR STATUS: select + move + save all WORKING/verified for uploads.** Remaining slices: **2c delete + resize + restyle**
  (delete = simplest/highest-value next; restyle is murkier in a monochrome app) → then **UNIFY** the stroke-handles vs shape-box
  feel into one interaction. All gated behind `editableParts`; drawn-stroke objects unaffected (use the existing stroke path).

## 🆕 R25 (2026-06-24) — ⚠️ OFAT WAS ON THE TEST SURFACE (/canvas). Finding WRONG. Harness re-pointed to real /desk.
- **Sebs caught it:** big-daddy drives `/canvas` = the "drawing primitive's TEST surface" (routes.tsx:41), NOT the real `/desk` +
  DrawPanel flow. So the Phase-2 svg-upload "16 modifiers inert on uploads" finding is **WRONG** — a harness control-driving
  artifact (it never switched to Rough / expanded the collapsed modifier `Section`s, so the sliders were never reached; same
  option-selection bug — options carry a title+description so a `length<30` filter dropped "Rough hand-drawn").
- **PROVEN on the REAL surface** (`tools/realofat/realofat2d-one.mjs`): /desk → Add doodle → Upload SVG → Rough → expandAll →
  ALL modifiers mount + MOVE the render. pokeball: wobble/jaggedness/strokeWidth/curve/hachureGap/fillDensity all setOk=true,
  6/6 move the render. The modifier chrome (SmartHachureChrome) is SHARED between /canvas and /desk — the bug was the DRIVER,
  not the surface per se, but Sebs's rule stands: drive the REAL surface.
- **Phase-2 2D data DISCARDED — never fed** (held the whole time; the dishonest-data guard worked). 3D OFAT (already fed) used
  `/canvas` for draw INPUT but the 3D chrome+engine are shared (DrawPanel imports the same Canvas3DChrome) → likely valid, but
  RE-VERIFY on /desk before trusting. Engine-level fixes (hatch/CSG/rim/line-art/state-bleed/polish-material) are surface-INDEPENDENT → still valid.
- **NEW real-surface driver:** `tools/realofat/realofat2d-lib.mjs` (openUpload/setStyle/expandAll/setSlider/shotPreview) — verified.
  ⚠️ CAVEAT before a real data run: 2D renders have wobble-SEED jitter (~1.5% per re-render) → need the deterministic seed the old
  harness had, else subtle line factors drown in noise. DECISION PENDING (Sebs): full 197-obj real-surface 2D re-run (~2hr) vs park.

## 🆕 R24 (2026-06-24) — Finish-control leverage FIX (signed off) + OFAT Phase 2 (svg-upload) launched
- **(a) polish/reflection/sheen leverage — FIXED + Sebs-signed-off.** OFAT found them near-inert on the matte default. Root cause:
  on `matteClay` (roughness 1, clearcoat 0, reflectivity 0.08) a tighter highlight had nothing to sharpen. Fix in
  `applyNativeProps` (`materials3d.ts`): polish drops roughness harder (0.3→0.62) + lends a clearcoat coat above neutral;
  reflection clearcoat coeff 0.5→0.85. **polish-H 0.17%→2.41%** (visible gloss); reflection/sheen left at their working ~6.7%
  (tried tightening sheenRoughness → REGRESSED 6.6%→0.6%, reverted). **Identity at 0.5 preserved (0.00%) → matte north-star
  intact.** tsc + build green. Sebs: "i agree" (keep 0.5-center, current strength). NOTE the slider's LOWER half (0→0.5) is inert
  on the matte default (can't out-matte matte) — by design; full range works on glossy presets.
- **⚠️ FOLLOW-UP (dataset honesty):** the fed 3D OFAT rows reflect PRE-fix polish ("weak"). Now stale (~591 polish rows). Queue a
  3D finish-factor re-run (fixed material) → vision-read → re-feed AFTER Phase 2 finishes (feed is regime-scoped → replaces clean).
- **(b) OFAT Phase 2 (svg-upload, 2D) RUNNING** — 4 shards into `/tmp/bigdaddy` (accumulates beside 3D dirs; manifests resume-safe,
  keep 3D rows). Load only ~12 (2D is ~5× lighter than 3D — no WebGL/manifold), ~2 hr ETA. ofat2d revert is correct (RESET-TO-PRESET).
  Then vision-read (build a `vision-read-2d` variant — 20 2D factors) → feed. Phase 3 = 2d-draw, still gated on drawing-tools.

## 🆕 R23 (2026-06-24) — EXHAUSTIVE OFAT Phase 1 (3D) COMPLETE end-to-end: render → vision-read → fed
- **197/197 objects, 4,334 panels, 0 convert-blocks, 0 console errors** (clean run, fixed harness). Vision-read = 197-agent
  workflow (`vision-read-3d.run.mjs`), each labels all 7 factors ×L/M/H vs Clean. **4,137 honest labeled rows fed** into
  `datasets/smart-layer.clean.jsonl` (regime `bigdaddy-current`, `--append` — correctly preserved 394 valid `live-audit` 2D rows;
  zero contaminated 3D rows). Dataset 1,291 → 5,427 rows, 0 parse errors.
- **FACTOR HEALTH (of 197):** geoMode 188 works / 0 broken (rock-solid) · style3d 154/36/7 · material 120/57/20 · outline3d
  116/46/35 · **polish 2/154/41 · reflection 3/159/35 · sheen 1/148/48** (1–2% works).
- **HEADLINE FINDING (high-confidence, FOR SEBS'S EYE — design decision):** polish/reflection/sheen are near-INERT on the
  default MATTE material catalog-wide — three of four finish controls barely move the render until you first pick a glossy
  material. Honest physics, but weak UX leverage. Pairs with the relief-depth weak-top-end finding. Options: glossier defaults /
  more slider leverage / de-emphasize-on-matte. NOT auto-changed.
- **SECONDARY:** flat/small/faint objects (arepaPan-type) don't showcase style3d/material/outline (verified by eye — genuinely
  no visible change; "broken" labels there are honest PERCEPTUAL calls, byte-diffs exist but sub-perceptual). Candidate bug lists
  (need Sebs's eye, not confirmed): style3d-dead-7 (arepaPan, coladorTela, collectorTin, marioHat, pinnedFigurePhoto,
  setlistHandwritten, vita); outline3d-dead-35 (mostly thin/flat — pens, folded flags, mag spines).
- **Notes (effectLevels + per-factor explanations) preserved in `/tmp/dd-vision-results.json` + manifests** — NOT in the dataset
  (feed-bigdaddy carries `m.note`, patch wrote `m.visionNote`); enrich later if wanted. Contaminated v1 run archived
  `/tmp/bigdaddy-contaminated-v1` (not fed).
- **NEXT OFAT:** Phase 2 = svg-upload (stable), Phase 3 = 2d-draw (gated on drawing-tools). ofat2d revert is FINE (RESET-TO-PRESET).

## 🆕 R22 (2026-06-23) — EXHAUSTIVE OFAT launched (Sebs: "lets do the ofat")
- **Staged by data-stability (NOT MVP-cut):** Phase 1 = 3D source ALL 197 obj (the hardened pipeline + where thumbnail artifacts
  hid, ~4,300 panels) · Phase 2 = svg-upload · Phase 3 = 2d-draw (GATED on the drawing-tools expansion — else that data goes
  stale when those tools change). Full 3-source = ~28k panels.
- **Phase 1 RUNNING** via `tools/bigdaddy/run-bigdaddy.mjs --sources 3d --out /tmp/bigdaddy`, idempotent/resumable (skips done
  object-sources). Launched 4 shards (i/4); all 4 confirmed `working set` (49+49+50+49=197), first objects converted OK (0 gate
  blocks, 0 crashes). **THROTTLED 4→2 shards** — load avg hit 61 (climbing) on the Mac; stopped chunks 2/4 + 3/4. Wave 1 =
  chunks 0/4+1/4 (idx%4∈{0,1}, ~99 obj); Wave 2 = re-launch 2/4+3/4 (~98 obj) after wave 1 lands (auto-fire on fleet-landing).
- **⚠️ HARNESS BUG CAUGHT pre-feed (validate-before-feed paid off):** a 1-object vision-read validation on pokeball + md5
  confirm exposed a STATE-BLEED bug in `ofat3d` — its per-factor REVERT only reset style3d+geoMode, NEVER the `material` dropdown
  or `polish/reflection/sheen/outline` sliders. So in test order material stuck at Signal + each slider held its last value →
  every finish-factor panel CONTAMINATED (the byte-identical staircase material-H==polish-M==reflection-... ). Feeding raw would
  have taught the model "polish/reflection/sheen broken" = a TEST-RIG artifact, not product. **FIXED**: added `reset3dToBaseline()`
  (style3d=Native, geoMode=auto, material=Matte Clay, sliders 0.5/0.5/0.5/0 = DEFAULT_NATIVE_PROPS_3D) used for clean baseline AND
  every revert. ofat2d is FINE (its revert hits RESET-TO-PRESET = full reset). **Wave 1+2 data DISCARDED for the contaminated
  finish factors** → re-running the 3D sweep fresh with the fixed harness. Valid takeaways from the void run: 3D pipeline robust
  (0 crash/0 convert-block across 96+ objects), vision-read approach validated end-to-end.
- **NEXT:** validate fix on pokeball (staircase gone) → re-launch 3D sweep (2 shards) → vision-read fan-out (agents read each
  `_contact.png` paired-vs-Clean → fill `status`) → `node tools/bigdaddy/feed-bigdaddy.mjs '/tmp/bigdaddy/manifest-*.jsonl'
  --append` (safe: only labeled rows, scoped to `bigdaddy-current` regime). Big-daddy alive — Playwright at portfolio path, no revival.

## 🆕 R21 (2026-06-23) — HATCH-BURIAL fix (OFAT batch-1's real signal A) (tsc + BUILD GREEN; NOT committed)
- **Root cause (diagnosed, not guessed):** a dense hatch region averages as DARK in the blurred structure height field, so all
  three depth paths (GPU disp `height`, CPU disp `structureHeight`, deep-CSG contour `extractReliefContours`) recess + bury it.
  Hatch is TEXTURED (high local high-freq energy) where a SOLID fill is uniform.
- **Fix** (`drawingTexture.ts` `flattenTextured`): regional texture energy `|carve − carveDisp|` → box-blur to region scale →
  pull high-texture pixels toward **0.5 = FLAT** (signed-field) in BOTH soft (`carveDispFlat`→`height`, GPU+CSG) and sharp
  (`carveDispSharpFlat`→`structureHeight`, CPU). Texture → normal map; solids untouched, still carve crisp. FREE-ish (2 box
  blurs). Disable: `window.__svgPortTextureFlatten = 0`.
- **Live A/B verified** (`tools/harnesses/dd-hatch-flatten-ab.mjs`, walls-sharp deep CSG, demo wall): `__csgDeepRegions` **29→1**
  (28 spurious textured carves gone, 1 = genuine solid). Diff **1.21%**, localized to the textured panel + rims; solids byte-stable.
  Game Boy screen recess is a **primitive** carve (csg.ts:204-207) → independent of height field, can't regress (confirmed
  visually `/tmp/dd-hatch-ab/crop-*.png`). tsc + production build green.
- **HONEST:** mechanism fix is real + worth keeping (texture belongs on normal map not geometry; 29→1 = faster manifold), but
  the visible severity at FULL-res is MODEST — hatch already read via emissive+normal, so much of the OFAT "collapse" was the
  512px-thumbnail artifact. No regression. Default ON.
- **Signal (B) relief-H flatter than relief-M → DEBUNKED** (`tools/harnesses/dd-relief-mh.mjs`): both depth paths are provably
  monotonic in code (`displaceFrontCapByHeight` linear in scale; CSG `sink` only saturates via `Math.min(…, thickness*0.7)`, can't
  invert). Full-res M(0.3) vs H(0.55) close-up: visually indistinguishable (`/tmp/dd-relief-mh/crop-smooth-*.png`), 0.91% px
  differ, H NOT flatter. The OFAT agent's call was a 512px-thumbnail misread. **REAL sub-finding (for Sebs's eye, not auto-changed):**
  the depth slider has WEAK leverage at the top end — sharp-M and sharp-H stddev identical because CSG sink saturates at
  thickness*0.7 on a thin slab. Recalibrating the depth ramp / thickness clamp is a taste call → main chat.
- **BIG-DADDY full-res OFAT harness = CONFIRMED ALIVE (no Playwright revival needed).** Playwright is already at the portfolio
  path `bigdaddy-lib.mjs` probes + chromium is cached → `tools/bigdaddy/run-bigdaddy.mjs` runs as-is. Smoke (`--objects gameBoy
  --sources 3d`): **22 full-res panels, 0 console errs, no app drift** (`/tmp/bigdaddy-smoke/gameBoy/3d/_contact.png` — Clean +
  7 3D toggles × L/M/H, each distinct + crisp = the trustworthy resolution the 512px desk thumbnails lacked). The honest FEED
  path also exists + is safe: `feed-bigdaddy.mjs` ingests ONLY rows whose `status` the vision pass filled (blank skipped), scoped
  to the `bigdaddy-current` regime (NOT the destructive whole-file `feed-live-ofat`).
- **STILL OPEN from OFAT batch-1:** the remaining piece of item (a) is the FULL exhaustive run (197 obj × 4 sources × all factors
  × L/M/H, 8 shards) → vision-read fan-out fills `status` paired-vs-Clean → `feed-bigdaddy --append`. Machinery proven; it's a
  multi-hour fleet that monopolizes :5182 + writes the ML dataset (sacred) → wants Sebs's go on launching now vs scheduling.
  Both vision signals triaged: A fixed, B debunked.

## 🆕 R20 (2026-06-22) — D1 image policy · DB prep · DEEP CSG relief everywhere (tsc + BUILD GREEN; NOT committed)
- **D1 (image fill policy) BUILT**: `acceptUploadMarkup` → `upload-image` swaps fill grammar to `'solid'` (flat tonal, I-2/16-research-solid). ⚠️ visual verify is Sebs-side (image trace needs the `image-to-svg` Quiver edge fn + a real photo — no local tracer by design).
- **DB prep**: wrote the missing **`0006_mesh_cache.sql`** migration (matches `image-to-3d` writeCache cols). `VITE_PERSONAL_SPACE=1` already on. Commands for Sebs: `supabase db push` + redeploy both edge fns (`--no-verify-jwt`) + confirm `QUIVERAI_API_KEY`. **Tripo NOT needed** — `pickProvider('auto')` uses fal/TRELLIS when `FAL_KEY` set (it is); TRIPO_KEY only for the never-reached `tripo-direct` fallback. (Confirmed current: TRELLIS = best quality/cost for doodles; Tripo's edge is production topology, irrelevant here.)
- **EXHAUSTIVE OFAT — batch 1 (3D fidelity) RAN via multi-agent workflow** (4th in the order): rendered 11 svg-port-3D OFAT cells on the demo desk (Clean + 5 styles + relief L/M/H + walls smooth/sharp), fanned out 11 agents to vision-read each paired-vs-Clean + label per-object (works/partial/broken), synthesized a fidelity report. **VERIFY-FIRST + a re-run with read-back-and-retry (corrected):** `style-bold.png` is byte-identical (MD5) to Clean — and STAYS identical after the verify-retry confirmed the dropdown shows "Bold ink". RESOLVED: bold==Clean is a **512px-thumbnail-resolution artifact** — at full-res (`spz-bold-ink.png` ≠ `spz-clean.png`, different MD5) bold renders distinctly, so bold WORKS in svg-port 3D; the desk renders svg-port at 512px (perf) where bold's subtle ink-weight rounds sub-pixel. NOT a product bug. `style-rough` DID differ from Clean (agent over-claimed "not applied" — it IS applied, subtly); sketch/stipple/news apply correctly. **LESSON: the quick desk-wide OFAT harness has a false-negative on subtle styles at thumbnail scale — a trustworthy style-fidelity OFAT must render PER-OBJECT FULL-RES (= what the existing big-daddy runner / contact sheets do). Revive big-daddy (needs Playwright) for the real OFAT; the desk-thumbnail batch is only reliable for GEOMETRY factors (relief/walls), not sub-pixel style nuance.** **REAL signal (worth a bug pass):** (A) the center HATCH/cross-hatch panel loses its texture under EVERY depth op — relief-M/H, walls-smooth, walls-sharp (incl. the new deep CSG) → fine high-freq fill doesn't survive extrusion/displacement/CSG while solid forms with sparse carved marks do (top fix + strong smart-layer feature: flag hatch-heavy regions before 3D depth ops); (B) relief-H reads FLATTER than relief-M (non-monotonic at the top end — possible clamp/inversion or my rim-fix blur over-flattening — isolate+repro). **Validated this session's deep CSG: crisp walls on SOLID forms ✓ (works), buries hatch detail (the refinement).** ⚠️ FEED HELD: data has the bold artifact + `feed-live-ofat` REWRITES the clean dataset (destructive) — feed only after fixing the OFAT harness (bold) for a clean re-run + using an append-safe feeder. Renders: `/tmp/dd-ofat3d/`. Workflow result: the task output JSON.
- **DRAG-FOLLOWER "doodle off a dimmed card" DONE** (3rd in the order): note was stale — the drag image was already only the doodle (`setDragImage([data-dd-card-art])`). Added the missing piece: source card dims to opacity 0.4 on dragstart (rAF after snapshot → bright doodle, grey card), restored on dragend, in `DrawerPanel` + `PersonalDrawer`. tsc+build green. ⚠️ visual verify Sebs-side (demo drawer empty → needs personal space). The float is the native drag-image SNAPSHOT, not a live custom follower — premium live follower = a bigger separate build if wanted.
- **INLINE-EDIT "focus mode" v1 DONE** (2nd in the order): the edit card now LIFTS from the tapped doodle's spot on open + settles back on close (in-place focus, not a box at center). `activeSurface.origin = {x,y}` captured at tap (`DeskPage`) → `ObjectSurface` 3-phase CSS-transition (enter small@origin → in → exit back@origin), scrim fades with it, all close paths animate (scrim/Escape/Close/Save), prefers-reduced-motion honored. Verified `dd-focusmode` (lift-in frames, opens/closes, 0 err), tsc+build green. ⚠️ Sebs taste: speed/ease (currently 0.46s expo-out). Next iterations: controls-RAIL layout + 3D-tap origin capture.
- **DEEP CSG RELIEF "crisp everywhere" DONE** (Sebs locked order: Deep CSG → inline-edit → drag-follower → OFAT; then ML/rebrand/physics): new `applyDeepCsgRelief` (`geometry3d/csg.ts`) carves manifold-CSG walls for primitives AND **structural tonal regions** of ANY doodle (soft-height threshold → `marchingSquaresLoops` contours → `CrossSection.extrude` → 1 subtract + 1 union). Fine detail stays normal-map. Wired in `Stroke3DScene` (replaced `applyCsgRelief` call; dropped the needs-primitives gate). Verified desk: `csgApplied:18` + **`csgDeepRegions:68`**, crisp vs Smooth, no regression. Depth = existing Relief slider + Walls:Sharp. ⚠️ /canvas (test surface) CSG didn't fire — placed-on-desk works; separate follow-up.

## 🆕 R19 (2026-06-21) — verification pass + /playground honesty-gate (tsc + full BUILD GREEN; NOT committed)
"Don't stop till everything doable without my eyes is done."
- **FULL `npm run build` GREEN** (1285 modules, 3.3s — only pre-existing chunk-size + manifold-WASM warnings). First full build this session (had been tsc-only).
- **4 "needs-eyeball" items FUNCTIONALLY VERIFIED** (feel/taste left for Sebs): single-tap dot lays a clean pen dot (`dd-tap-dot`) · drag tracks to drop, no stale-jump (`dd-drag`) · rough circle → Snap → "SNAPPED TO CIRCLE" clean (`dd-snap-circle`) · gap-fill seals gaps into bounded regions + `gapClosePx` wired to the ladder ceiling (esbuild fn-test; slider's visible leverage is a live check since the shape-ceiling dominates large shapes).
- **`/playground` 3D toggle → HONESTY-GATED** (`DeskDoodlesPlayground.tsx`): no `mode==='3d'` branch existed → the 3D pill is now disabled + dimmed w/ honest tooltip (3D lives on /canvas), matching the disabled Publish beside it.
- **Left for Sebs (eyes/decisions/keys ONLY):** drag/snap/gap/dot FEEL · drag-follower dim+float custom follower (Make-side) · image-class auto-fill register (design → main chat) · Supabase deploys + personal-space flag (mesh-cache, edge fns, migration 0002, the save-routing stash live test) · the 🎯 post-submission build (rebrand, ML, physics, deep CSG relief, exhaustive OFAT).

## 🆕 R18 (2026-06-21) — remaining 🟡 cleared: even-odd pentagram · async-save refs · save-routing parity (tsc GREEN; NOT committed)
"Do it all" on the last three 🟡 items.
- **even-odd PENTAGRAM → FIXED** (`renderRegion.ts`): the `subs<2 → null` skip flooded a self-intersecting single-subpath
  star solid (polygon-clipping resolves it to NONZERO, no hole — verified). New `evenOddViaRaster`: rasterize with the
  browser's own `fill('evenodd')` + a 1-cell dilation (seals the inner-vertex pinch leaks) + the proven `traceToRings`
  marching-squares tracer → true outer + pentagon-hole rings. Verified in-browser (pentagram d → 2 subpaths). ⚠️ FUNCTION-level
  + trivial unchanged integration; NOT a full styled-hachure render (upload preview is browser-native). **github** nonzero-knockout
  stays 🎯 post-submission. `dd-evenodd-pentagram`, `dd-evenodd-raster-check`.
- **async-save closure → refs → DONE** (`ObjectSurface.tsx`): `saveStateRef` per-render snapshot `{name,why,author,surfStyle,
  surfMods,view3d,hardMeshUrl,baseline}`; `handleDone`+`handleRedrawDone` build config from `saveStateRef.current` (not their
  async closure) → no stale-config window on a config-swap / mesh-gen landing mid-edit. Behavior-preserving. Verified: tsc +
  draw-over end-to-end still saves (`up-4-after.png`).
- **save-routing parity → DONE**: /canvas needs nothing (Publish intentionally DISABLED — "test surface"). Edit modal: new
  `allowDrawer` prop + "Also save to: Drawer/Shelf" pills (DrawPanel port), gated from DeskPage to OWNER-EDIT only
  (`personalSpaceOn && desk?.owner_id && obj.ownerSession===getSessionId() && mode==='edit'`); Done best-effort `stashToDrawer`+
  `shareToShelf` (independent of dirty-check, one-shot). UI verified (`alsosave-ui.png`). ⚠️ live stash round-trips Supabase
  personal space (flag + migrations) → final test Sebs-side.
- **ALL 🟡 PARTIAL 3D/fill/save items now ✅** (rim·line-art·ctxloss·tangle·even-odd·async-save·save-routing). Make kit: port
  `drawingTexture.ts`, `Stroke3DScene.tsx`, `renderRegion.ts`, `ObjectSurface.tsx`, `DeskPage.tsx` when syncing.

## 🆕 R17 (2026-06-21) — 3D fidelity sweep: 4 KS items CLOSED + 2 stale reconciles (tsc GREEN; NOT committed)
Diagnose-with-real-renders pass over the remaining 🟡 3D items; in every case the TODO's source-guess was wrong and the
real cause came from rendering, not reading. **2 real code fixes + 4 reconciles/verifies:**
- **svg-port jagged rim → FIXED** (`drawingTexture.ts`): NOT "carve reads raw raster" — the silhouette was already smooth;
  the spiky crown was the CPU deep-relief displacement faceting the coarse cap because the displacement height field
  (`carveDispSharp`) was too sharp (blur 0.006). Fix: blur **0.006→0.02** (FREE — boxBlurField is running-sum, radius-free).
  Crown gone at 0.25+0.45 depth, feature relief still reads (Game Boy/Pokéball, clean/rough/bold/stipple). Built+A/B'd+REMOVED
  a geometric rim-feather that did nothing (TessellateModifier normals unreliable). `dd-disp-blur-ab`, `dd-deep-canvas`.
- **Line-art shards on explicit Extrude → FIXED** (`Stroke3DScene.tsx:1519`): NOT a blob, NOT geometry (rays ARE clean rods).
  The native bas-relief `reliefMaterial` (displacementMap on PLANAR whole-pool UVs) was applied to EVERY build; the per-stroke
  rod rays have their own rod UVs + no tessellation → displacement shoved their verts to garbage = feathered shards. Fix:
  `material={i === 0 ? bodyMaterial : material}` — carve material is the MASS's alone. Sebs-confirmed intent ("do the rec +
  still show the strokes"). Verified: sun (clean spokes + carved disc) + multi-stroke Game Boy extrude (clean body/screen/
  buttons); SOLID Game Boy carve/etch UNCHANGED (single-build → i0 always). `dd-lineart-many`, `dd-gameboy-regress`.
- **Reconciled STALE (already correct, now verified):** `webglcontextlost` handler IS wired in BOTH canvases
  (`MultiStroke3D.tsx:165`, `Stroke3DScene.tsx:1886`) — recovery verified via WEBGL_lose_context (`dd-ctxloss`: lose+restore →
  repaints, not black). · RC-2 open-tangle does NOT bury interior (`dd-tangle`: auto=clean tube, solid=interior etched). ·
  hardMeshUrl re-persist already in `handleDone` (`ObjectSurface.tsx:940`). · icon `<symbol>`/`<use>` upload LIVE-verified
  (`dd-icon-upload`: renders a real star, survives place). All 4 svg-port/3D KS items (rim·line-art·ctxloss·tangle) CLOSED.
- **Leftover 🟡 (low-value):** even-odd holes pentagram/github (logo stress, not real doodles) · async-save closure→refs
  (debt, race already mitigated) · save-routing parity on edit-modal/canvas (feature, design-ish). Detail in RUNNING-TODO.

## 🆕 R16 (2026-06-21) — DRAW-OVER for uploads/no-stroke objects (tsc+build GREEN; needs Sebs eyeball)
The edit modal's dead-end "drawn before re-editing existed" → a working **"Draw over"** for any object with NO recorded
strokes (uploads/legacy). `redrawBackdrop = storedStrokes ? null : prepareBackdrop(artMarkup)` rides the art as a
`DrawSurface.backdrop`; Done `composeBackdropAndStrokes` bakes new ink/tone in WITHOUT setting render_config.strokes
(repeatable). Reuses the proven create-flow draw-over primitives. ⚠️ Edit row is `isSandbox ? Close-only : Delete+Re-draw`
→ demo-wall objects (sandbox) can't show it headless; verified the gate + prepareBackdrop, but the end-to-end (mine upload →
Draw over → draw → Done → save) needs Sebs's eyes. Also this session: stipple-on-uploads RECONCILED non-bug (code-verified),
/playground = dead dev page. Detail in RUNNING-TODO "Re-draw for uploaded Quiver SVGs". Make kit: ObjectSurface.tsx synced.

## 🆕 R15 (2026-06-20) — svg-port desk RESTYLE: lag killed + per-style relief for all 11 styles (tsc+build GREEN, live-verified)
Full detail in `docs/submission/RUNNING-TODO.md` → top "2026-06-20" block. NOT committed.
- **Lag:** whole-desk svg-port restyle "lags like crazy" → **~40–50 ms max frame gap** (headed Chrome). Levers (svg-port BUILD
  path only, 3D-only): on-screen-only build gate (`inView` threaded 8 layers, ~20 builds→~4 + `builtSigRef` skip) + 512 px
  thumbnail texture (vs 1024·dpr; modal keeps full) + `useMemo`'d `svgPortBuild {inView,longEdge,styleId}` bundle.
- **Differences:** `STYLE_CARVE_PROFILE` (drawingTexture.ts) → each of 11 styles its own carved surface (crisp-V / deep-U /
  raised-emboss / round-dimple). styleId threaded on desk·modal·/canvas·drawer. DEFAULT profile == old constants by
  construction → modal/homepage/native unchanged.
- **Newsprint FIXED** — `inlineExternalDefs()` pulls the styled markup's externally-referenced `<mask>/<pattern>/<filter>`
  (newsprint dots, charcoal/wet-ink filters) from the live TextureFilterDefs into the build svg so they rasterize
  self-contained (they were silently no-op'ing standalone → solid form). **ALL 11 now read distinct** (triple-checked
  headed, `/tmp/dd-shots/tc-*.png`); **toggles translate** (`tog-*.png`). **LAG re-measured: worst 42 ms, most 9–17 ms,
  newsprint 9 ms (zero penalty).** tsc+build green, clean(control) byte-identical.
- **2026-06-21 follow-ups:** newsprint dots ×1.6 (`NEWSPRINT_3D_DOT_SCALE`) · **relief depth ×1.25 for ALL styles**
  (`CARVE_DEPTH_BOOST` + `SVGPORT_DISPLACEMENT_SCALE` 0.06→0.09, verified no tearing) · **THE "mini version of the object on
  it in the middle" BUG = FIXED.** Root cause: svg-port `detailLines` sampled marks in the markup viewBox (~180) but
  `normalizeStrokePoints` world-scales by a constant per ENGINE-viewBox-unit (~800) → marks rendered at ~0.22× centered = a
  mini drawing on each form. FIX (`Stroke3DScene.tsx` detailLines): bbox-fit the styled marks onto the form's xy bbox (native
  path unchanged). Before/after `/tmp/dd-shots/BEFORE-bold-ink.png` vs `tc-bold-ink.png`. The ⠿ MOVE GRIP was wrongly removed
  then RESTORED (Sebs wants it; "figure an intuitive move/rotate without it" is a PARKED idea, grip stays meanwhile).
- **DEEP 3D RELIEF shipped (2026-06-21)** — Sebs picked it next + chose a "depth slider, sensible-deep default."
  `displaceFrontCapByHeight` CPU-displaces the welded front cap by the height field = real geometry depth, no tearing.
  Now a **"Relief depth" slider** (0→0.6, default 0.25) in the svg-port 3D controls: `reliefDepth` in `Canvas3DContext` →
  threaded via `svgPortBuild` (folded in at LiveObject3DSlot/Live3DMount/DeskDoodlesCanvas) → build effect (CPU displace) +
  material (drop GPU disp) + `builtSigRef` sig. Verified `/tmp/dd-shots/slider-{flat,bold}.png`; desk 0.25 default clean,
  lag 50 ms, 0 err. Detail in RUNNING-TODO "2026-06-21 DEEP 3D RELIEF" block. NEXT tier = CSG hard edges (gated on a
  manifold Make-safety spike) per `PHASE-2-DEEP-RELIEF-PLAN.md`.
- **CRISP HARD EDGES — "two versions" (Sebs 2026-06-21):** V1 **Make-friendly** (no WASM) DONE+verified — sharper
  `structureHeight` (drawingTexture) + finer cap tess → steeper/crisper welded-mass walls (`bold-SOFT.png` vs
  `slider-bold.png`), lag 50 ms. V2 **manifold-3d WASM CSG DONE + browser-verified** — `lib/geometry3d/csg.ts` (lazy
  load + THREE↔manifold + per-feature subtract/union), `drawingTexture` exposes `treatFeatures`, build effect runs CSG when
  the **"Walls: Sharp" toggle** is on (else V1 fallback). `dd-csg-verify.mjs`: manifoldLoaded=true, csgApplied=18, 0 err,
  clean render. **Fixes:** Vite wasm URL (`manifold-3d/manifold.wasm?url` + `locateFile`) — else "expected magic word"; +
  POSITION-ONLY weld for ofMesh. **SCOPING:** CSG only on CLEAN-ish styles w/ primitive rect/circle (Game Boy screen/
  buttons) — rough/freehand → V1. ⚠️ Make-iframe cold-load test = Sebs's deploy. `manifold-3d` adds 2 npm advisories.
  ⚠️ `npm install` PRUNES `--no-save puppeteer-core` → reinstall it after any npm install. Detail: RUNNING-TODO "CRISP HARD
  EDGES" block + `PHASE-2-DEEP-RELIEF-PLAN.md`.
- **Make kit** synced (14 files). Harnesses: `tools/harnesses/dd-svgport-*.mjs`, `dd-desk-allstyles.mjs`,
  `dd-allstyles-toggles.mjs`, `dd-triplecheck.mjs`, `dd-newsprint-diag.mjs`, `dd-deep-canvas.mjs`, `dd-relief-slider.mjs`,
  `manifold-smoke.mjs`.

## 🆕 R14 (2026-06-19) — POST-SUBMISSION burn-down: bug-sweep reconcile + Phase 0/1 fixes + overnight robustness (tsc+build GREEN)
Makeathon SUBMITTED → un-cut everything (rebrand + deep 3D + ML + physics all back ON). Rebuilt the plan from a verified bug sweep.
- **☑️ FIRST THING — read `docs/submission/SEBS-CHECK-THESE.md`** — the live-verify checklist (11 items) for everything tsc-green this session. Several are hot paths I couldn't prove headless (drag feel, gap-seal, circle snap, ink dot, icon upload).
- **NEW DOCS:** `RUNNING-TODO.md` REBUILT (clean reconciled board; old 45KB → `RUNNING-TODO-ARCHIVE-pre-2026-06-19.md`) · `POST-MAKEATHON-PLAN.md` (6 phases: 0 stabilize → 1 fill → 2 3D pencil → 3 personal-space → 4 rebrand → 5 OFAT+ML → 6 PHYSICS/living-desk) · `PHASE-2-DEEP-RELIEF-PLAN.md` (the morning plan — sealed mesh + manifold CSG, Game Boy prototype, your taste calls).
- **6-AGENT BUG SWEEP reconciled the stale index:** B1–B5 camera/render, 3D hachureGap HIGH cap, AI-mesh material toggle, SVG simplify UI, side-panel, elongated-shift, decision-log channels = all ALREADY FIXED (index was stale).
- **PHASE 0 (stabilize) DONE:** contentHash insecure-ctx crash (pure-JS SHA-1 fallback, verified == Node crypto) · O(n²) sibling cap (`MAX_TOPOLOGY_SIBLINGS=1500`) · personalSpace read-helper gating · `<use>`/`<symbol>` instantiation (`expandUseReferences`, verified in real DOM) · stale-drag closures (refs not closure — ⚠️ live-verify drag feel).
- **PHASE 1 (fill/draw) DONE:** Gap slider wired into the flood (`gapClosePx=DEFAULT*gapMult`, default = no-op) · circle fit Kåsa→**Taubin** (validated vs Kåsa) · single-tap Ink dot. Stipple-on-uploads = diagnosed NOT a real bug (chrome snaps to dots; OFAT artifact) — NOT patched.
- **OVERNIGHT robustness (safe, no blind render-tuning):** WebGL `webglcontextlost` recovery handler (`canvas3d/contextLoss.ts`, wired into both canvases) · hardMeshUrl re-persist when a mesh is generated in the edit modal (`ObjectSurface handleDone`).
- **PHASE 2 STEP 1 DONE (isolated, unwired, zero render risk):** `lib/geometry3d/sealedRelief.ts` `buildSealedReliefGeometry` — verified WATERTIGHT (0 boundary/non-manifold edges, displacement real) by `tools/harnesses/sealed-relief-smoke.mjs`. Morning = Step 2 wires it into svg-port (per `PHASE-2-DEEP-RELIEF-PLAN.md`). NOT in the Make kit yet (unwired).
- **PLAN RECONCILE (Sebs caught physics was dropped → swept the archive for OTHER drops):** re-added to RUNNING-TODO/POST-MAKEATHON-PLAN — smart-layer Phases C (auto-pick)/D (engine-routing)/F (cascade), MORE primitives, select/edit any PART of a drawing, FULL drawing tools on the 3D canvas, open-shape shading. (Confirmed already-present: hard-path, Quiver, ML, physics, cascade.) Lesson: the bug-sweep lens dropped PLANNED FEATURES — the docs now carry both.
- **MAKE KIT** `~/Desktop/dd-make-update/updates/` updated with all of the above (+ `WHERE-EACH-GOES.txt`). `DrawerPage.tsx` still needs pasting to clear the Make build error.
- **NEXT (morning, WITH Sebs):** Phase 2 deep 3D relief — start at Step 0 (manifold Make-safety spike) per `PHASE-2-DEEP-RELIEF-PLAN.md`. Riskier bug items deferred to awake session: async-save→refs, save-routing parity (modal/canvas), evenodd pentagram/github.

## 🆕 R13 (2026-06-18) — warm-handle pool expansion + GLOBAL GEOMETRY SWEEP (tsc+build GREEN, NOT live-verified by me)
Two Sebs asks landed, both compile+build clean. NOT committed. Files synced to `~/Desktop/dd-make-update/updates/`.
- **WARM HANDLES — no more "-7" number, pool 16×16 → 50×50** (Sebs: a number suffix is lazy). `lib/handle.ts` +
  `ObjectCard.tsx` now share IDENTICAL 50-adj × 50-noun pools (2500 combos) in the SAME order; `handleFromId` /
  `ownerHandle` return a clean two-word `adj-noun` (token dropped). Cross-checked the two FNV-1a impls
  (`streamHash` with `>>>0` on seed vs `handleHash` without) — **0 mismatches over 300k calls**, identical pool
  indices → same person shows the same handle in both files. Guaranteed uniqueness is deferred to claim-time
  (`claim_handle` collision check, migration 0002 — not yet deployed). ⚠️ deploy 0002 for the hard uniqueness guarantee.
- **GLOBAL GEOMETRY SWEEP** (Sebs decided: "changing the global geometry sweeps the whole desk = restyle the whole
  desk"). New `geometryEngaged` flag on `Canvas3DContext` — flips true the moment the user touches the desk's geometry
  dropdown (`setGeometryMode`). `LiveObject3DSlot` (DeskObject3DMount): `const saved = ctx.geometryEngaged ? null :
  savedRaw` → once engaged, EVERY object follows the live chrome (geometry+style+material+props), overriding saved
  per-object 3D looks. NON-DESTRUCTIVE: saved render_config untouched, restores on next desk mount (engaged resets to
  false). No accidental engagement: DeskPage never auto-calls setGeometryMode; the edit-modal/`/canvas`/drawer each
  have their OWN Canvas3DProvider so seeding there can't leak to the desk. Drawer grid inherits the same sweep (uses
  LiveObject3DSlot) — consistent with its R10l `engaged` pattern. **NEEDS Sebs LIVE eyeball**: a desk with ≥2 objects
  that have DIFFERENT saved 3D looks → change global geometry → all should snap to it (headless can't WebGL + no DB
  objects with saved geometry3d to repro).
- Make kit updated: `Canvas3DContext.tsx` (NEW), `DeskObject3DMount.tsx` (changed again), `ObjectCard.tsx`+`handle.ts`
  (changed) added/refreshed in `updates/` + WHERE-EACH-GOES.txt notes what's new vs already-pasted.

## 🆕 R12 (2026-06-16, Sebs LIVE rapid-fire edit-modal/3D pass) — ALL tsc-clean, NOTHING committed, NOT live-verified by me
Sebs drove the live app and fired a long burst of edit-modal / 3D / desk bugs. Everything below is tsc-clean across the
whole batch but I (Claude) could NOT WebGL-verify the 3D renders — Sebs is the live tester. Files touched this round:
`ObjectSurface.tsx` (big), `DeskPage.tsx`, `DrawerPage.tsx`, `chrome/Dropdown.tsx`, `lib/exportCard.ts`, `DrawPanel.tsx`,
`canvas3d/{Stroke3DScene,MultiStroke3D}.tsx`, `DeskObject3DMount.tsx`.
**LANDED (HMR-live):**
- **Per-object 3D (`is3d`)** — toggle 3D + Save now persists `render_config.is3d`; desk + drawer render that object 3D on
  its OWN via `force3dIds` (desk) / `rowIs3d` (drawer), independent of the global lens. The 2D/3D toggle now marks the
  config dirty (the bug: Save was a no-op because the toggle never flagged dirty). `view3d` inits from saved `is3d`.
- **Rotate** — global-flip 3D rotates again AND per-object 3D rotates; tap-to-open card via a capture-phase tap detector
  (wrapper `rotatable = render3d`; `onOpen3dTap`). I'd over-corrected to interactive=false earlier.
- **AI mesh = the 3D form** on flip everywhere (desk/drawer/shelf/modal). Upload w/ no mesh now STAYS 2D (no rough native
  rebuild) — gated on `sourceImage` present.
- **AI-mesh LOOK persistence (the big one)** — Material/Darkness/Auto-spin now save to `render_config.aiMesh` and render
  per-object on the desk/drawer. Threading: `AiMeshLookSync` (ObjectSurface, seeds context + captures to ref + marks dirty)
  → handleDone writes `config.aiMesh` → desk/drawer read it → `LiveObject3DSlot/Object3DSlot → Object3DView →
  Stroke3DContents → StrokeMeshes`, all as OPTIONAL `aiMeshLook` props that fall back to context (zero regression where
  not passed).
- **LOCAL-3D look persistence (normal objects) — NOW DONE too.** `Geometry3DSync` (ObjectSurface) seeds the context from
  saved `render_config.geometry3d` on open + captures it to a ref + marks dirty → handleDone writes `config.geometry3d`
  (when `can3d && !hardMeshUrl`). Desk/drawer pass it as `LiveObject3DSlot config={...}` → resolves per-object via
  `resolveScene3DInputs`, falling back to the live context when an object has no saved look (so global restyle still drives
  un-edited objects, zero legacy regression). Addresses "3d edits don't appear for normal 3d objects".
- **Drawer save** — was re-fetching the DB BEFORE ObjectSurface's await-write landed (stale); now optimistic (patches the
  row locally on onConfigSave/onObjectUpdate).
- **Dropdown crop** — popover PORTALED to body (`position:fixed`), never clipped by a scrolling panel.
- **Edit popup** — create-page sized (1180px, tall floor). **Re-draw**: Style toggle REMOVED (Sebs decided keep-as-stage,
  not unify-with-create); canvas aspect-locked; strokes+tone now fit-to-frame TOGETHER (one shared transform) — the crop
  was tone loading at raw coords while strokes were fit.
- **Export 3D on the card** (`exportCard.artImageDataUrl` → `<image>` in the frame); regenerate button gone from edit modal.
- **3D click-to-open on desk**; export-in-3D finds the doodle.
**STILL OPEN / Sebs reported, NOT done (next focused pass):**
1. **Personal-space SAVE ROUTING** (NEW, separate subsystem): drawings only save to shelf, nothing to drawer; private desk
   should ASK drawer/shelf/both; the desk LEFT side-panel doesn't populate (must Expand) — it should show shelf (public
   desk) / drawer (private), Expand → the bigger /drawer page. Touches publish/save routing + the desk side panel. NOT
   started — needs its own pass.
2. **Local-3D look persistence** (geometry mode/material for non-mesh objects) — only AI-mesh look persists so far.
3. **Re-draw for uploaded Quiver SVGs** — Sebs wants draw-over in the EDIT card (create page already does it); edit modal
   gates Re-draw on `storedStrokes` which uploads lack → needs a backdrop-draw path.
4. **Verify the whole R12 batch LIVE** (hard-refresh first — some "doesn't save" reports may have been stale HMR state).


## 🆕 R11 (2026-06-16 day, Sebs LIVE) — IMAGE→SVG pipeline overhaul + 3D greyscale. ALL tsc-clean, NOTHING committed.
**The full image-upload (Quiver) pipeline was rebuilt + validated this session. Detail in docs/submission/RUNNING-TODO.md
R11 / R11-cont.** Files touched: `src/app/lib/imageToSvg.ts` (big), `simplifyToSketch.ts`, `svgUpload.ts`,
`components/canvas3d/{aiMeshMaterial.ts(new),HardMesh.tsx}`, `lib/centerline.ts (new)`, `components/DeskDoodles/DrawPanel.tsx`.

**DONE + tsc-clean (live in dev, Sebs eyeballed the harness renders):**
- **imageToSvg pipeline:** Quiver model **arrow-1.1-max @1024** (fidelity winner) · **input downscale to 1280** (fixed a
  real 413 — 11MB photo blew Quiver's cap) · light cleanup + **Chaikin edge-smooth** (`chaikinSmooth` opt on
  simplifyToSketch) · **dropBackgroundRegions** (strips the full-frame traced photo/screenshot background — bbox touches
  all 4 edges; VALIDATED) · **valueizeColors** → dark greyscale (hue→value) · **toLineArt** = strip `<text>` labels (they
  were `<text>` w/ font-size in a `<style>` we sanitize away → rendered huge) + ink-ify Quiver's faint colored strokes
  (killed the purple) + **add ink OUTLINE to every region** (our SVGs always have outlines; Quiver gives only ~7 thin ones).
  Net: a clean lines+fill greyscale doodle, no text/bg/purple/blob. Also returns **`sourceImage`** (downscaled original
  photo data-URL) for the hard path.
- **DrawPanel: image uploads default to CLEAN style** (was smart-picking rough+cross-hatch → dense blob; Clean = lines +
  flat greyscale fill = the right read). `acceptUploadMarkup(...,'upload-image')`.
- **3D AI-mesh:** `aiMeshMaterial.applyAiMeshMaterial` + HardMesh re-skin to **dark greyscale @0.18** by default (Sebs pick)
  → AI mesh fits the desk instead of photoreal blob. Reachable via the existing "✨ Generate AI 3D" chip.
- **centerline.ts** (LINE-mode single-line tracer) + **svgUpload.applyUploadSimplify(off/filled/line)** — libs ready.

**KEY LEARNINGS:** lines(stroke) ≠ fill(region hachure) — rough blobbed because fillStyle:hachure fills regions dense, NOT
because it confuses lines for fill. Dark-everything → rough hachures solid; needs a value RANGE or fillStyle:none. Quiver
text = `<text>` elements. No ML/training needed — all deterministic.

**NEXT (Sebs decided 2026-06-16): keep uncommitted; hard-path sends the ORIGINAL PHOTO.**
1. **Thread `sourceImage` → hard path.** imageToSvg now RETURNS it. DrawPanel image branch must capture `traced.sourceImage`
   → carry it onto the created object → ObjectSurface `generateAiMesh` (line 969-984) currently does
   `rasterizeMarkupPng(artMarkup)`; change to: use `object.sourceImage` (the photo) if present, else rasterize the doodle.
   DECISION OPEN: persist the data-URL (heavy ~150KB in renderConfig) vs session-cache vs upload-to-storage. For the demo,
   in-session carry is enough; persist later.
2. **Persist hardMeshUrl** in renderConfig so a saved AI-mesh object loads the cached GLB instead of regenerating. (The 2D
   `svg` is ALREADY persisted — ObjectSurface line 759 v5 RPC.)
3. **SVG simplify-mode toggle UI** (off/filled/line) in DrawSurface + DrawPanel — wire applyUploadSimplify + centerline.
4. **AI-mesh material MODE toggle** (greyscale↔og-pbr) in Canvas3DChrome (HardMesh already takes the `materialMode` prop).
5. **Image render: rough+fill still blobs** even at fillStyle:solid (cross-hatches the regions) — fill-density tuning OR
   keep images on Clean. Lines-only (fillStyle:none) = clean hand-drawn read.
6. DrawSurface (/canvas) image upload: mirror DrawPanel's Clean-default (only DrawPanel done).

## 🆕 R10o (2026-06-16 NIGHT cont., AUTONOMOUS — Sebs asleep) ⭐ READ — overnight scope DONE+VERIFIED
**The 3 overnight asks (fix → 5/6 → image upload) are ALL complete and live-verified. Nothing committed.**
- **#6 HARD-PATH CHIP — RENDER VERIFIED + no-blank-well fix.** The earlier "empty well" was a CAPTURE-TIMING artifact
  (screenshot fired the instant hardMeshUrl set, before the ~2MB GLB streamed). Proven: injected a cached GLB via a temp
  `__forceHardMesh` hook → HardMesh renders perfectly (the cup) in the modal 3D well (`/tmp/dd-shots/forcemesh-well.png`).
  Temp hook REMOVED after. FIX: `Stroke3DScene.tsx` now uses the LOCAL form as the Suspense `fallback` (extracted
  `localForm` = builds + fillBodies) so the doodle's own 3D shows while the GLB streams, then swaps to the AI mesh — no
  blank well (early-frame proof `forcemesh-early.png` = local form, final = cup). 3D REGRESSION CHECK: 5 demo objects in
  native 3D render clean, 0 errors (`/tmp/dd-shots/reg3d-{0..4}.png`). The cached GLBs are still valid (glTF magic, CORS *).
- **IMAGE UPLOAD — LIVE END-TO-END, both surfaces + 3D.** Backend confirmed live (image-to-svg edge fn → 200, 10-path SVG,
  ~10s). Wired the UI in BOTH surfaces (they're separate per the SEPARATE-surfaces rule): **DrawSurface** (/canvas) +
  **DrawPanel** (/desk) — handleFileChange routes by file type (raster → `imageToSvg` = Quiver trace + simplifyToSketch +
  sanitize, all in-lib; svg → prepare + simplify), accept is mode-aware, busy "Tracing your image…" copy, removed BOTH
  "Image upload is coming" honesty gates (DrawSurface gate + DrawPanel's separate `input==='upload-image'` pane gate),
  DeskDoodlesCanvas 3D-note copy updated. DrawPanel now uses `isUploadInput` (= upload-svg||upload-image) at every
  consumption site (preview, backdrop, staging, 3D-derive, size-cap) since a traced image IS svg from there on.
  VERIFIED LIVE: /canvas image (Game Boy → clean line-art, wears Rough+multiStroke), /desk image (disc → Sketchy,
  smart-pick fired), /desk image→3D (Native+MatteClay form), /desk SVG (rose, regression-free — simplify didn't over-
  abstract). Shots: `/tmp/dd-shots/imgupload-canvas.png`, `imgupload-desk.png`, `img3d-desk.png`, `svgupload-desk.png`.
- **SVG-UPLOAD SIMPLIFY now in DrawPanel too** (was only DrawSurface) per Sebs "simplify the svg they upload to our clean
  style." Rose upload verified clean. ⚠️ same caveat: may over-abstract a clean logo → gate on path-count if it bites.
- **REGRESSION:** tsc clean throughout · catalog signature 197 cells / 411 smartFills (all objects render; 2D pipeline
  UNTOUCHED — only upload handlers + 3D scene changed) · no page errors in any live test.
- **Files touched:** Stroke3DScene.tsx (localForm fallback), ObjectSurface.tsx (temp hook added+removed), DrawSurface.tsx
  (image branch + accept + picker copy + gate removed), DrawPanel.tsx (image branch + acceptUploadMarkup + isUploadInput +
  accept + picker copy + 2 gates removed + SVG simplify), DeskDoodlesCanvas.tsx (3D-note copy). Harnesses:
  /tmp/dd-forcemesh-test.mjs, dd-3d-regression.mjs, dd-imgupload-canvas.mjs, dd-imgupload-desk.mjs, dd-svgupload-desk.mjs,
  dd-img3d-desk.mjs.
- **EDGE-FN CACHE-WRITE — now CODED (was deferred), needs a 1-line REDEPLOY by Sebs.** `hardPath.ts` fetchMeshResult now
  appends `&contentHash=` to the result GET (backward-compatible); `image-to-3d/index.ts` reads it + `writeCache()` upserts
  mesh_cache(content_hash, glb_url, provider, file_size) after downloadAndRehost (best-effort, never fails the result).
  ⚠️ NOT verified by me (can't deploy the Deno fn / write mesh_cache from here). To activate: `supabase functions deploy
  image-to-3d` AND ensure the `mesh_cache` table exists (header §3). Until then gens work but regens still pay (readCache
  misses). tsc clean (edge fn is @ts-nocheck, out of app tsconfig).
- **STILL OPEN (Sebs-side / next):** deploy the cache-write (above) · test Quiver on a REAL PHOTO (my tests used rendered
  doodles/screenshots → outer-frame border got traced; a real photo won't) · final UI/UX polish pass (#21/#25, design
  decisions → main chat) · Make sync · submission. Nothing committed (awaiting Sebs go).

## 🆕 R10n (2026-06-16 NIGHT, AUTONOMOUS — Sebs asleep, trusts the overnight build) ⭐ READ
**Uncommitted, verified work this session (NOT committed — Sebs hasn't said push):** stroke-translation (svg-port),
restyle-persist (drawer), donut compound-outline chord, share-feedback, + the svg-port **flattener** below.
- **svg-port LAG/FREEZE — FIXED via a pure-math path flattener.** Root cause: my stroke-translation `styledMarkupPool`
  ran `svgMarkupToStrokes` (offscreen mount + getPointAtLength) SYNCHRONOUSLY → froze on dense doodles. FIX: new
  `src/app/lib/svgPathFlatten.ts` (`svgMarkupToPolylinesFast` — parses path `d` with math, no DOM, no getPointAtLength);
  Stroke3DScene `styledMarkupPool` now uses it (strip [data-smart-hachure] → flatten outline paths). svg-port-3D-ONLY →
  zero 2D/catalog risk. VERIFIED: wobble/jaggedness still translate (distinct md5s) + marks render clean + tsc green.
  Residual ~½s on EXTREME scribbles = pre-existing svg-port TEXTURE build (not the flattener) → post-makeathon.
- **HARD-PATH (image→3D) — BACKEND LIVE + TESTED.** Sebs deployed `image-to-3d` + set FAL_KEY. Test (/tmp/dd-hardpath-test.mjs)
  made REAL GLBs: gameBoy (1.59MB) + pokeball (2.1MB) in Supabase Storage. **BUT TRELLIS on flat doodles = generic shapes**
  (gameBoy→box, pokeball→cup). Its domain is PHOTOS, not doodles. Local 3D stays the doodle default.
  GLB urls: …/storage/v1/object/public/meshes/9081e19b-…glb (gameBoy), f8f5a8d5-…glb (pokeball).
- **QUIVER (image→SVG) — deployed + reachable** (probe 400 = configured). Sebs setting QUIVERAI_API_KEY + deploying
  image-to-svg before sleep. Input shape: `{image:{base64|url}}`.
- **DECIDED ARCHITECTURE:** uploaded image → Quiver SVG → OUR system (2D styles + local-3D, all toggles, coherent) =
  the real "upload anything" win, mostly already wired (Upload-image button + imageToSvg client + uploadedSvgMarkup→system
  all EXIST → just needed deploy+key). AI mesh = FOREIGN GLB, doesn't fit desk global-flip/toggles → **modal-only, opt-in,
  cached** (NOT desk-integrated — that's the 1.5-day awkward part, deferred).
- **FINAL OVERNIGHT STATE (2026-06-16 ~06:10, all tsc-clean + route-smoke clean = 9/9 routes, 0 console errors):**
  - ✅ SVG-UPLOAD NORMALIZE: direct .svg uploads now run simplifyToSketch (DrawSurface.tsx upload handler ~1822) so
    they come in as clean line-art in our register (was ONLY the image-trace path). VERIFIED: uploaded donut → clean
    round circles vs angular hexagons+junk before. Graceful noop if unparseable. ⚠️ Sebs: test a few real uploads — may
    over-abstract a clean logo; if so gate it on path-count/complexity.
  - ✅ svg-port flattener (no lag) · ✅ Quiver tuned to arrow-1.1 + target_size 512 (imageToSvg.ts — clean line-art;
    flip back to arrow-1.1-max for max detail; edge-fn DEFAULT_MODEL still -max, mirror+redeploy OR moot since client
    sends model) · ✅ #5 SCENE-RENDER fully threaded + DORMANT (HardMesh.tsx renders the GLB when hardMeshUrl set;
    hardMeshUrl threaded Live3DMount→Stroke3DSceneLazy→Stroke3DScene[outer]→inner→StrokeMeshes→render branch that
    gates builds/fillBodies on !hardMeshUrl; bounds/shadow/framing still compute). Nothing sets hardMeshUrl yet → zero
    behavior change → app healthy.
  - ⏭️ #6 CHIP (resumable — the activation): in ObjectSurface.tsx add `const [hardMeshUrl,setHardMeshUrl]=useState<string|null>(null)`
    + a "✨ Generate AI 3D" button gated on `view3d && isHardPathEnabled()` (from lib/hardPath.ts) → onClick: rasterize the
    doodle to a PNG data-url (rasterizeDoodlePng in exportCard.ts — BUT 3D view hides the SVG, so rasterize from `artMarkup`
    STRING, not the DOM: wrap artMarkup in a temp el or add a markup-string variant) → `runMesh({imageUrl, contentHash, onStatus:setMeshStatus})`
    → setHardMeshUrl(mesh.glbUrl). Pass `hardMeshUrl={hardMeshUrl ?? undefined}` to Live3DMount (ObjectSurface ~line 1156).
    Show meshStatus (queued/running/failed copy). Verify scene-render with the EXISTING GLBs (gameBoy/pokeball urls in R10n)
    by temporarily hardcoding hardMeshUrl before wiring the chip. ⚠️ MODAL-ONLY (not desk global-flip — that's deferred).
  - ⏭️ EDGE-FN CACHE-WRITE (resumable): image-to-3d reads mesh_cache but never WRITES → repeat gens not free. Fix: client
    fetchMeshResult passes contentHash; edge fn handleStatusOrResult writes mesh_cache(content_hash,glb_url,provider,file_size)
    after downloadAndRehost. Needs edge-fn redeploy (Sebs).
  - ⏭️ Quiver image→SVG: deployed+keyed; TEST with a REAL PHOTO (not a doodle) to confirm clean-SVG quality into our system.
  - Budget: well under $50 overnight. NOTHING committed (Sebs hasn't said push).
- **OVERNIGHT BUILD (in progress, main-loop for hot files per stale-base rule; agents for verify/research):**
  (1) svg-port flattener ✅ done. (2) #5/#6 AI-mesh-in-modal (HardMesh.tsx new ✅ + rasterizeDoodlePng ✅ in exportCard.ts;
  THREADING hardMeshUrl Live3DMount→Stroke3DSceneLazy→Stroke3DScene + HardMesh render branch + ObjectSurface chip+runMesh).
  (3) image-upload Quiver wire+test (once key live). (4) edge-fn cache-write fix (mesh_cache never written → repeat gens not free).
  Research wf we4g2hyh4 (Quiver+fal call/clean-output/structuring) running. Budget <$50. REGRESSION-CHECK everything (catalog
  byte-diff, route-smoke, tsc, homepage). Test harnesses: /tmp/dd-hardpath-test.mjs, dd-quiver-probe.mjs, dd-glb-view.mjs,
  dd-freeze-repro.mjs, dd-fixproof.mjs.


## 🆕 R10m (2026-06-16) — even-odd verified + compound-outline CHORD fixed
- **even-odd core WORKS** (clean compound donut → proper filled ring + knockout hole; the 2 failing fixtures are
  degenerate — animated star, gradient-stacked donut). **D1/D2 nested-fill** = already fixed (task #9) + smoke
  functional · **D4 snap** = works (wobbly→Rectangle) · **C3** = explicitly deferred (scope-audit row 16).
- **COMPOUND-OUTLINE CHORD FIXED** (`SvgStyleTransform.tsx` case 'path'): a curved COMPOUND path (donut/holey icons)
  was sampled as ONE continuous getPointAtLength walk → the M-jump between sub-paths drew a CHORD across the form
  (Sebs caught it on the donut outline; only under rough/hachure styles, Clean was always fine). The straight-line
  walker already split; the curve sampler didn't. FIX: split curved `d` by M, sample each sub-path on its own helper
  path. GATED to all-absolute-M multi-sub-path `d` (relative-`m` falls through to old single-sample); single-sub-path
  = byte-identical. VERIFIED: donut chords gone + **catalog gate 197/197 byte-identical (0 diffs)** at rough-handdrawn
  + tsc clean. Helps any multi-sub-path curved upload (donuts, holey icons).
- **DEFERRED POST-MAKEATHON — DECIDED by Sebs 2026-06-16 ("defer papa"):** uploaded-SVG fidelity edge cases —
  default-black icon fills (would fill no-fill icons like github/x-twitter BUT shifts 13 locked-catalog objects),
  gradient-fill, animated-SVG final-frame, pentagram self-intersection. Core upload path works (clean compound
  even-odd proven). REVISIT default-black ONLY if a future demo leans on "upload a logo/icon". Do NOT re-litigate.

## 🆕 R10l (2026-06-16, AUTONOMOUS) — big-daddy PASS + restyle-persist drawer gap fixed
- **BIG-DADDY OFAT = PASS** (ultracode vision-audit, 23 agents, 22 paired sheets, **0 genuine regressions**). 2D styles
  (10×197, only the ~9 large-flat-fill objects flag under wireframe/outline-only/sketchy/stipple = expected fill-strip,
  not bugs; fill styles 0 flags) · svg-port (11×4, 0 tears) · toggles (sliders LMH + categoricals via setMod). Verdict:
  render system SHIP-READY. Paired packets: `/tmp/dd-shots/bigdaddy/_PAIRED/` + `…/svgport-cert/_sheets/` +
  `…/toggle-lmh/TOGGLE-LMH-SHEET.png`. 1970 rows fed to `datasets/smart-layer.dataset.jsonl`.
- **RESTYLE-PERSIST (#24) — drawer gap FIXED** (`DrawerPage.tsx`): the drawer grid painted every card with the shared
  panel state, so a desk/modal restyle was invisible there. Now each card defaults to its OWN saved style
  (`rowConfig(row)` → svgStyle+modifiers); the shared panel overrides the whole grid only once ENGAGED (handleStyle/
  handleMod set `engaged`); Reset un-engages → back to saved. desk + edit-modal already honored config; /your-space is
  a desk-list (no object previews); homepage/audit = fixtures. tsc clean, /drawer smoke 0 errors. ⚠️ NEEDS Sebs LIVE
  eyeball (headless has no DB drawer rows).
- **STILL EYES-ON / GATED:** #4 visual-system polish (Sebs 2026-06-16: native-treatment import is AXED as a standalone —
  it's part of the polish pass, not separate) · #5 hard-path 3D (needs Sebs fal key + edge-fn deploy — Claude pings when
  #5 is up) · low-pri: uploaded-SVG even-odd fill (donut holes) + drawing-tool D1/D2 nested-fill-flood + D4 snap-seam.

## 🆕 R10k (2026-06-16, AUTONOMOUS w/ Sebs at gym) — BIG-DADDY OFATs + stroke toggles TRANSLATE to 3D ⭐ READ
**The big-daddy OFATs ran + a real fix landed.** Sebs: "multi stroke should show in 3d… many things to translate."
- **OFATs done:** (a) toggle LOW/MID/HIGH sweep — 218 records, 0 errs (`/tmp/dd-shots/toggle-lmh`); (b) 2D-style
  cert all 11 canonical styles × 197 objects (fleet + my gap-fill of bold-ink[0 flags]/outline-only[12 collapses=
  spec-correct fill-strip] — the fleet had wrongly run crosshatch[invalid]+tonal in their place); (c) svg-port
  matching-2D-style cert 44 cells, 0 tears (`/tmp/dd-shots/svgport-cert`).
- **THE FIX (Stroke3DScene.tsx) — stroke toggles now reach svg-port 3D.** Root cause: `detailLines` (the crisp
  incised marks) were built from RAW strokes → wobble/jaggedness/simplification/bowing/multiStroke/sketchy/penTip/
  endpoint changed 2D but were byte-identical in 3D. Fix: for svg-port build detailLines from the STYLED markup
  (`svgMarkupToStrokes(svgPortMarkup)`), STRIP `[data-smart-hachure]` groups first (else white-blob scratch-mess),
  lift etch z above the displaced cap (proud 0.06 svg-port / 0.012 native). Added `__ddSet.setMod` dev seam.
  Native relief UNTOUCHED (gated on isSvgPort). tsc green.
- **VERIFIED:** 9/9 sliders + 5/5 categoricals (multiStroke 7/8, fillStyle 6/6, penTip 5/5, endpoint 4/4,
  sketchingStyle 3/4) now produce DISTINCT readable 3D renders. Toned square + catalog Game Boy (fill-heavy) =
  clean, not a mess. Proof packet sent: `/tmp/dd-shots/STROKE-TRANSLATION-PROOF.png`.
- **Dev server restarted on :5182** (the HMR-3D-graph limit needs a restart for Stroke3DScene structural edits).
- **NOTE:** this SUPERSEDES R10j's "stop tuning svg-port / deep relief = post-makeathon" for the STROKE-TRANSLATION
  axis (now solved). Deep GEOMETRIC relief (sealed mesh + CSG) is STILL post-makeathon.
- **NEXT (supervised):** native-treatment import system-wide · polish/restyle-persist · Make sync · submission.

## 🆕 R10j (2026-06-15, AWAKE w/ Sebs) — svg-port 3D = V1 LOCKED (functional; deep relief = POST-MAKEATHON) ⭐ READ
**Decision (Sebs): svg-port 3D ships as v1 / "functional, 3D refinement ongoing" — NOT fully done.** Deep geometric
3-treatment relief is a DOCUMENTED post-makeathon improvement. Full plan + research → `docs/submission/3D-SVGPORT-POSTMAKEATHON.md`.
- **THE BIG WIN: svg-port now WORKS IN-SYSTEM** (was a black block on desk/catalog/modal). Root cause = coordinate
  mismatch: stored markup is in its OWN viewBox (`0 0 64 100`) but strokes/geometry fit to engine 800×600 →
  svg-port re-rooted the raster OUTSIDE the content → blank. FIXED: (a) remap sub-rect into the markup's NATIVE
  viewBox in `buildSvgPortTexture` (xMidYMid-meet inverse), (b) resolve `var(--dir-*)`→hex before raster
  (presentation-attr var() doesn't resolve in a data-URL `<img>`), (c) wire `svgPortMarkup` through Live3DMount +
  LiveObject3DSlot (+ ObjectSurface passes artMarkup, DeskPage/DrawerPage pass the object markup).
- **NO-TEAR quick win (research wq0iqh7ra):** the tear was a TOPOLOGY problem — we displace a SEPARATE front-cap
  CLONE that rips off the welded body at depth. Quick fix that ships: **`SVGPORT_DISPLACEMENT_SCALE 0.5→0.06`**
  (near-flat → cap can't tear by construction) + **detail-LINES enabled for svg-port** (crisp marks via the R10c
  light line geometry, immune to blur) + the Sobel **normalMap** carries the relief shading. = the Ink-and-Ray
  principle (relief LIGHTS the drawing, marks stay authoritative). VERIFIED clean (no tear, crisp) on the drawn
  FACE + the real catalog GAME BOY, head-on AND orbit (`/tmp/dd-shots/facefix2.png`, `gbfix.png`).
- **3-treatment classifier (engrave/indent/raise) is BUILT** (`drawingTexture.ts`: signed height + `treatMask` —
  small closed shape→raise, mid closed→indent, lines→engrave; value ladder; per-pixel hatch carry). It reads via
  shading/normal now (not deep geometry) — deep GEOMETRIC indent/raise needs the sealed-mesh rebuild = post-makeathon.
- **Current svg-port knobs (drawingTexture.ts / Stroke3DScene.tsx):** SVGPORT_DISPLACEMENT_SCALE=0.06,
  carveDisp blur R=longPx*0.018, normalScale=2.0, emissiveIntensity=0.42, GROUND_V=0.14, detailLines gated on
  `reliefBody || isSvgPort`. Debug dump hook: `window.__svgPortDebug` → `__svgPortDebugURLs{emissive,height,normal,svg,serialized,meta}`.
- **POST-MAKEATHON (doc'd):** sealed watertight mesh (front+skirt+back, `mergeVertices`+`computeVertexNormals`,
  lithophane-style) + CSG (`manifold-3d`/`three-bvh-csg`) for crisp deep screen-indent/button-raise + Ink-and-Ray
  relief-as-lighting + TAM hatching. = the dramatic deep relief, done right (no tear, crisp).
- ⚠️ **STOP blind-tuning svg-port** (Sebs: "beating a dead horse"). v1 is locked; further svg-port work = the
  post-makeathon sealed-mesh rebuild, not param tweaks. Next = the SPINE (native treatment system-wide → OFAT → polish → ship).
- **VERIFIED BROADLY (autonomous sweep while Sebs at gym):** svg-port v1 holds across the CATALOG — swept 9 varied
  demo objects (Pokéball·Game Boy·shoe·guitar·vinyl·MacBook·MX mouse·medal·Instax·kettle) through svg-port 3D
  (`/tmp/dd-svgport-sweep.mjs` → `/tmp/dd-shots/sweep/`): ALL clean — no tears, no black-blocks, marks read,
  recognizable. **Homepage native heroes intact** (`/tmp/dd-shots/home-check.png`, 0 page errors). 2D render code
  UNCHANGED this session (all edits 3D-only) → no 2D-regression risk. svg-port v1 = certified-clean for ship.
- **SUPERVISED QUEUE (held — did NOT touch unsupervised, since churn = the risk):** (a) native-treatment import
  system-wide (align desk/catalog native 3D config to the homepage extrude·rubber·etch — 3D config, eyes-on);
  (b) P1 fill-flood clamp (rough hachure overshoot — touches the 197 catalog, verify via catalog-diff);
  (c) light visual polish + restyle-persist; (d) stretch wedge = hard-path 3D (Sebs deploys fal key + edge fn).
  These are riskier/eyes-on → for the supervised session, not unsupervised edits.

## 🆕 R10h (2026-06-15 overnight) — svg-port CLEANUP done + verified IMPROVED (tsc+build green, NOT committed)
Sebs accepted the **B polarity** (light marks on ink-black form, "yeah its fine") + said "clean it and improve, still
looks like garbage." Kept Hatch a SEPARATE 3D option (not folded into svg-port). What I changed + verified via headed Chrome:
- **THE fix — value now rides the BOLDED coverage, not raw (1-lum).** `drawingTexture.ts`: the old value-register
  `v=(1-lum)` discarded ALL the bold-ink/sparse-floor work (the loop wrote `src.data` then the register overwrote it
  from untouched `lum`) → thin anti-aliased marks read FAINT/washed = the "garbage". Replaced both passes with ONE
  monochrome block: `v = 255 · covRaw · cap` where `covRaw=(INK_EDGE−lum)/INK_EDGE` (gap-preserving, per-pixel) and
  `cap` slides BOLD_MAX→1 by sparseness (isolated marks go near-solid). Form = ink-black, marks = LIGHT + CRISP,
  value still emerges from density. (`paperDarkenT`/`aoStrengthT` now unused — harmless, noUnusedLocals:false.)
- **Relief de-noise:** `GROOVE_BLUR_FRAC 0.004→0.006` (smoother carve walls) + svg-port `normalScale 2.5→2.0`
  (`Stroke3DScene.tsx`) — softens the torn/dashed edge the high-contrast white-on-black amplified.
- **VERIFIED (headed, face doodle, verify rule):** CLEAN 2D style → svg-port reads as a **crisp white-line sketch on a
  matte-black coin** (`/tmp/dd-shots/svgport2-3d-clean-{headon,orbit}.png`); ROUGH 2D style → correctly scratchy
  (`/tmp/dd-shots/svgport-3d-{headon,orbit}.png`). Marks read crisp now (was faint). 0 page errors. Harnesses:
  `/tmp/dd-svgport-clean.mjs` (rough), `/tmp/dd-svgport-clean2.mjs` (clean-style, drives the SVG-STYLE dropdown).
## 🆕 R10i (2026-06-15, AWAKE w/ Sebs) — 3-TREATMENT SIGNED RELIEF on svg-port (task #30, in progress, tsc green)
**LOCKED DECISIONS (Sebs, this session):**
- **3 treatments** every region routes to: **ENGRAVED line** (thin sharp incision) · **INDENT** (filled area pushed IN —
  tone=shallow basin, closed-inside-bigger=deep dent/hole like the Game Boy screen) · **RAISED** (filled area pushed OUT —
  button/band). "Engraving=thin incised line, indent=area pushed in, raised=area pushed out." Form stays ink-BLACK;
  **value = light/shadow on the relief, never a tint** (his rule, in 3D).
- **BLACK form is LOCKED. POS/paper base REJECTED** ("why is the circle WHITE bro" — he wants black). The A/B is dead.
- **svg-port "LIVES it, doesn't WEAR it"** (Sebs, load-bearing): svg-port is NOT a lazy carve/decal of the 2D marks — it
  RE-CREATES the 2D treatment's DNA (feel/look/vibe) natively in 3D. A hatched tone isn't "hatch stuck on the surface",
  it's that TONE re-expressed as real 3D relief (the smooth tone-BASIN, not pasted hatch grain). This is the wedge.
- **Doesn't go too far into the hard path** (Sebs Q): 3 separate 3D things — (1) straight/Native (geometry transform, own
  style, clean baseline), (2) svg-port (re-creates the styled 2D in 3D), (3) hard-path (Tripo/TRELLIS AI volume, gated).
  Relief lives in 1+2, NOT 3. Building on **svg-port FIRST**, then port the same height field to Native (homepage heroes).
- **Folds into the OFAT** once built+fixed (Sebs): the 3D treatment OFAT verifies each region's pick vs clean/2D, feeds the dataset.

**BUILT + VERIFIED (headed Chrome, clean-style face fixture):**
- **Signed height field** in `buildSvgPortTexture` (`drawingTexture.ts`): replaces the recess-only luminance carve. 0.5=FLAT,
  <0.5 indent, >0.5 raised. Thin LINE = sharp shallow incision (ENGRAVE_AMT, from per-pixel cov); FILLED area = SMOOTH
  basin (from box-averaged `1−density`, depth SHALLOW..DEEP by darkness — NOT per-hatch grain). `SVGPORT_DISPLACEMENT_SCALE
  0.18→0.5`; svgPortMaterial `displacementBias −scale → −0.5·scale` (the unlock for raised/signed). NoColorSpace kept.
- **Emissive value ladder** (neg): deep-graphite GROUND (0.14) so indents have room to read DARKER; light chalk only on
  thin LINES (gated by 1−dW); FILLED areas sink toward black (value comes from the dent, not a light mark).
- **BRIGHT-BLOB BUG FIXED:** the shade read as a bright blob because the legacy **`fillBodies` grey tone-slab** (native path,
  `Stroke3DScene.tsx:1285`) rendered as a SEPARATE mid-grey mesh ON TOP even in svg-port. Gated OFF for svg-port
  (`!svgPortBody`). Now the shade reads as a **dark recessed dent**, inversion gone. Pics: `/tmp/dd-shots/svgport2-3d-clean-{headon,orbit}.png`.
  Debug dump hook `window.__svgPortDebug` → `__svgPortDebugURLs{emissive,height,normal}` (harness `/tmp/dd-svgport-dump.mjs`).

**NEXT (svg-port, in priority):** (a) verify DEEP indent (a dark screen fill) + add RAISED (small detached blob → +height)
+ per-object override (Engrave/Indent/Raise) — needs the SEMANTIC layer (read `data-smart-role`/`data-tone-band`/containment
off the markup; foundation map in wf wqv72qvk4 output). (b) the deeper "LIVES it" pass: real 3D contour-hatching following
the form (TAM/Praun-Hoppe) as a refinement. (c) port the signed field to NATIVE (homepage Game Boy screen→real indent,
buttons→raised). Foundation research/maps: `/private/tmp/.../tasks/wqv72qvk4.output` (depth ladder, SDF/smoothstep/smin, signal reuse).

**R10i UPDATE (same session, tsc+build green):**
- **Smooth-basin REVERTED → PER-PIXEL HATCH CARRY.** Sebs: the smooth basin "made shading non-existent / all black" — it
  erased the 2D's shade LEVELS. The 2D already converts tone per style (pressure/tone/technique each make lighter-darker);
  svg-port must CARRY that, different shades reading DIFFERENT, monochrome, not all-black, NO colour. New height:
  `sh = 0.5 − maxDepth·cov` per-pixel (cov=per-pixel ink), `maxDepth = ENGRAVE_AMT + dW·(DEEP_AMT−ENGRAVE_AMT)` →
  a thin line = a few shallow grooves; a dense dark fill = many deeper grooves → shade levels read different via groove
  density + self-shadow (the 2D's technique, in 3D). **VERIFIED:** 3 patches light/mid/dark → read as 3 different 3D
  values w/ visible carved hatch texture (`/tmp/dd-shots/levels-crop.png`, harness `/tmp/dd-svgport-levels.mjs` — picks
  tone swatches via `[data-shade-cluster] button`). Sent to Sebs; awaiting his read on whether the differentiation is strong enough.
- **ARCHITECTURE re-locked (Sebs):** TWO chains — **(A) straight 2D→3D**: styles DON'T matter, DIRECT conversion, **clean
  SVG = baseline**, the 3D is its OWN new style (peer to clean/rough). **(B) svg-port**: LIVES the styled 2D (re-creates its
  DNA in 3D, not a decal). On B. NEW svg-port REQ: **each element's DEFAULT 3D treatment must MATCH its own 2D version** —
  store the per-element 2D toggle/treatment values to seed the default, THEN per-element override. = the semantic layer
  (read `data-smart-role`/`data-tone-band`/toggle vals off the markup), still TODO.
- **"svg-port LIVES it, doesn't WEAR it" (load-bearing):** not a lazy carve/decal of the flat 2D marks — re-creates the 2D
  treatment's feel/look/vibe natively in 3D (a hatched tone = that TONE re-expressed as real 3D relief). The wedge.

## 🆕 R10f (2026-06-15) — snap-flow rework DONE + DEMO WALL added (local, tsc+build green, NOT committed)
- **SNAP consolidated to ONE manual path** on all 3 hosts (DrawPanel /desk, DeskDoodlesCanvas /canvas,
  ObjectSurface RE-DRAW). Removed: auto-offer-on-pen-up + the click-through cycle chip (`SnapChip`
  component + `DrawToolbarSnapChip` type + per-host `snapChip`/`cycleSnapChip`/`handleStrokeCommitted`
  all deleted). Now: **SNAP button** fits the last stroke → applies best → opens the recognized∪library∪
  Original **switcher**. `SwitchPopover` is now a real overlay dropdown (`position:absolute; top:calc(100%+6px)`)
  and the **"Snapped to X ▾ / ✕" receipt rides DrawToolbar's new `snapSwitcher` slot** (renders right next
  to the SNAP/STRAIGHTEN pills, was floating above the canvas). Full decision record in
  `docs/submission/FEATURES-BUILD-LOG.md` ("REVISED 2026-06-15 PM" block at top).
- **SELECTION model (Sebs "do what u think is best"):** modeless **tap = select, drag = draw**.
  `strokeContainingPoint` (ray-cast) → tap anywhere INSIDE a closed shape selects it; `SELECT_HIT_RADIUS_PX`
  16→22. Move gate = `pointInStroke(body) || nearOutline` (empty bbox corners still draw → draw-inside
  preserved). Inserted shapes AUTO-SELECT (handles show immediately). All in `DrawSurface.tsx`.
- **DEMO WALL for recording** (`?demo=1`): `src/app/lib/demoWall.tsx` `buildDemoWall()` = 21 curated catalog
  objects (PegToolShape → markup → normalizeSvgSize 180) across families × all 11 render styles. DeskPage
  seeds it behind the URL flag (network load early-returns on demo; dedicated seed effect → setObjects +
  feed 'live' + resetCamera frames it). **URL: `http://localhost:5182/desk?demo=1`.** No DB. Verified
  headless: 21 objects, ● LIVE, 0 real errors, screenshot `/tmp/dd-shots/wall-demo.png`. tsc+build green.
  NORMAL /desk untouched (gated). NOT yet in the Make sync kit.
- **DEMO WALL now PICKABLE from the gallery** (`/desks`, "the wall of walls"): `DeskGallery.tsx` leads with
  a **"The Showcase Wall" (DEMO)** card (mini-preview built from `buildDemoWall(6)`) → opens `/desk?demo=1`.
  Always renders (works DB-on or DB-off → gallery never empty); real desks append below; loading/error
  demoted to a small note under the grid. Verified headless: card shows + click lands on the 21-object
  wall, 0 real errors. Screens `/tmp/dd-shots/gallery-demo.png`, `/tmp/dd-shots/wall-demo.png`.
- **DEMO add stays LOCAL (fix)**: adding a doodle on `?demo` no longer publishes to / switches to the real
  open desk (Sebs: "when I add an object it changes to the other desk wtf"). `DeskPage` has `isDemoWall`;
  `addObject` short-circuits to an optimistic local add + returns (no publishDoodle, no resolve). Verified
  live: draw→Done→Place keeps URL `/desk?demo=1`, count 21→22, still the demo wall. `/tmp/dd-shots/demo-add-after.png`.

## ⭐ 3D NORTH-STAR (Sebs 2026-06-15, load-bearing — read before ANY 3D work)
**It's ALL ONE PENCIL.** The entire aesthetic is MONOCHROME — black + grayscale — and what reads as "color"
is purely VALUE (light→dark) produced by pencil moves: pressure, shading, hatch density. The 2D does NOT use
real colors; it's grayscale + shading techniques mimicking the tonal range of a single pencil. **3D must carry
the SAME pencil-sketch character:** a matte black/grayscale SKETCH with the pencil marks + shading preserved
ON the form — NOT a glossy lit black solid that kills the sketch feel.
- ⇒ The glossy Native materials (polish / reflection / sheen / "Soft Gel") FIGHT the vision (plastic, not
  pencil). The 3D should read MATTE pencil, value from shading/marks, never hue, never gloss.
- ⇒ svg-port (wears the 2D render) is the RIGHT instinct for "carry the pencil look" — fix its artifacts, don't
  abandon it. Solid/native should also read matte-pencil-grayscale, not lit-plastic-black.
- ⇒ Pressure is part of the SAME one-pencil range (harder = darker/wider) — must work.
- ⇒ **VALUE = MARK DENSITY, NOT A TINT (Sebs 2026-06-15):** the grey must EMERGE from black marks at varying
  density (hatch spacing / pressure), like a real pencil — NEVER a flat grey surface tint (a grey FORM reads
  as a "color" = wrong). Form = pure ink-black; "grey" = denser black marks. svg-port now does this via
  `v=(1-lum)` (ink-black form + light marks, value from density); Native still shows a wrong white grey-slab
  blob → kill it, bring it to the same language.
- ⇒ **OUR 2D IS ITSELF A MIMICRY** of pencil (Smart Hachure density / 11 grammars / tone bands), not real
  pencil, not 1-to-1. The 2D→3D conversion must HONOR + EXTEND what the 2D already does (svg-port wears the 2D
  → 2D shading language IS the source), not reinterpret from scratch. Research BOTH: (A) real pencil/etching =
  north-star · (B) what our 2D already does = the source; bridge B→3D anchored to A. The 2D mimicry feeds the
  conversion but the two chains consume it differently (straight-3D = form transform; svg-port = wears marks).
  Hypothesis to confirm: real pen-and-ink of a 3D object uses CONTOUR hatching (follows form, denser in
  shadow — TAM / real-time hatching), so flat-wrapped 2D marks alone won't fully read 3D-pencil.
- VERIFY against the rule below: clean SVG ↔ 2D style X ↔ svg-port 3D style X must read as the same pencil.

**TWO 3D MODES = TWO TRANSLATION CHAINS (Sebs 2026-06-15, architecture — they give DIFFERENT results by design):**
1. **Straight 3D** = its OWN STYLE, a PEER to the 2D svg styles (picking "3D" is like switching svg-style
   clean→rough→…). A direct, self-contained transform of the OBJECT (geometry/strokes) into a 3D form. It
   does NOT inherit the 2D style's marks — if it did it'd just BE svg-port (don't stack them). 2D style and
   straight-3D are SIBLING choices. Compare to the clean form/geometry, NOT the 2D marks.
2. **SVG-port** = a special multi-step PORT — a there-and-back chain: styled 2D (rough hand-drawn + ALL its
   toggle modifications) → 3D form → the 2D-styled marks ported/WRAPPED onto that form. It CARRIES the OG 2D
   modifications into 3D ("translate, then translate again, but bring the original modifications across").
   ⚠️ NOT a lazy decal slapped flat on the form — a REAL port that re-derives when a toggle changes.
   ⇒ svg-port style X MUST read like 2D style X; changing a 2D modifier (wobble/jaggedness/…) MUST change the
   svg-port 3D result (it re-ports the modified 2D). Same nominal style via the two chains = different output,
   and that's CORRECT (e.g. rough→straight-3D ≠ rough→svg-port-3D). Don't "fix" that difference; verify each
   chain against its own baseline (straight 3D ↔ form; svg-port ↔ 2D style render).

## 🛑 3D STATUS (honest, 2026-06-15 late) — DO TOGETHER AWAKE, not blind
Sebs saw svg-port 3D look "artifacted / fucked." Verified via headed-Chrome capture (real WebGL):
- svg-port is NOT all-black in a fresh build — it renders a LIGHT paper form with the drawing etched in
  (`/tmp/dd-shots/svgport-real.png`). If Sebs saw pure black, his tab was STALE (hard-refresh) OR a theme/
  geometry-mode difference. BUT the etch/rim IS genuinely **artifacted** (jagged torn marks, dashy rim) —
  that's the real open bug. This is the long-standing hard 3D-quality problem (R10b/c saga), NOT a quick fix.
- Pressure slider: ✅ **FIXED + VERIFIED 2026-06-15.** ROOT CAUSE (diagnosis wf wccranuf1): mouse/SVG capture
  writes a CONSTANT 0.5 into the pressure channel (`DrawSurface.tsx ~:1850 [x,y,e.pressure||0.5]`), so
  `extractPressures` returned a flat `[0.5,…]` (not undefined) → the `pressures ?? synth` gate was defeated and
  `(p-0.5)=0` zeroed all modulation. FIX (`strokeTo3d.ts buildInflateGeometry`): treat a FLAT channel (max−min
  ≤ 0.02) as "no real pressure" → fall back to `synthPressures(world)` (curvature → 0.5–1.0 envelope, fuller at
  bends). Real varying stylus pressure still wins. VERIFIED via headed capture (`/tmp/dd-pressure-cap.mjs`,
  geometry=Inflate, slider 0.00 vs 1.00): renders now DIFFER — at 1.00 the spiral fattens at the bends, tapers
  between (`/tmp/dd-shots/inflate-p-{low,high}.png`). tsc+build green.
- **BASE + FIXTURES (Sebs 2026-06-15, CORRECTED — baseline depends on the chain):**
  - **STRAIGHT 3D (basic 2D→3D)** baseline = **svg CLEAN** (the clean form). It's a conversion of the geometry.
  - **SVG-PORT** baseline = the **SAME style + toggles in its 2D form** (svg-port-rough ↔ 2D-rough, etc.).
    Comparing svg-port to CLEAN defeats its purpose — svg-port carries the styled 2D over, so it must match the
    styled 2D, not clean. **Clean is ALWAYS looked at too** — it's the OG root / the standing sanity check that
    the 2D render itself is correct — but it is NOT the svg-port comparison baseline (the matching 2D style is).
  - **Use the 197 AUDIT CATALOG objects as the test fixtures** (they have known clean baselines) for the
    svg-port/3D debugging too, not just hand-drawn scribbles.
- **VERIFY RULE (Sebs 2026-06-15, standing):** ALWAYS compare the 3D render back to the **clean SVG** baseline;
  and for **svg-port** specifically, compare it to the **SAME SVG STYLE rendered in 2D** — svg-port wears the
  2D render, so style-X-in-3D must read like style-X-in-2D (same marks/tone, just on the form). Pair every
  svg-port OFAT cell: [clean SVG] · [2D style X] · [svg-port 3D style X]. Mismatch = the bug.
- **DECISION: stopped blind 3D work.** The 3D shading/quality needs Sebs's eyes + real-time iteration — do it
  as a focused awake session. My tonight 3D changes (tone→svg-port one-liner, pressure synth) are safe-by-
  construction + documented; reapply/revert together. The svg-port ARTIFACTS are baseline (not caused by the
  tone change). Everything NON-3D tonight is solid + verified.

## 🟡 SVG-UPLOAD OFAT — upload path SOLID, rough-fill is the fault line (2026-06-15, wf wir7agehu)
15/15 fixtures uploaded + rendered; **Clean renders correctly on all but the known evenodd-star**. The
"upload your own SVG" CORE PATH is healthy. Breakage is concentrated in the **rough.js hachure FILL** on
fill-heavy / winding-knockout icons (the github family) — severity scales with solid-fill + evenodd/winding
dependence. Known 3 stress cases UNCHANGED (match broken-map: github=leave-alone, star=open, annulus=false-eo).
- **NEW (same root family, real bugs):** P1 large-solid-fill FLOOD/overshoot (nintendo, x-twitter — rough
  hachure not clamped to region bounds); P1 scale-aware roughness (tiny 16px compound paths shatter — gear,
  heart); P2 honor per-subpath knockout in rough fill (github family); P2 raise bezier sampling (typographic
  ornament decimates to chords); P3 `<pattern>`/`<defs>` not preserved (herringbone/color-square).
- **WINS confirmed (north-star working):** linear-gradient → hatch VALUE; card-suits 2-color → grayscale value;
  cat/skull line-art clean. Color→value-via-hatch behaving as designed.
- **⚠ METHOD CAVEAT:** 2 groups (nintendo/x-twitter incl.) used the `__ddSet` dev seam = NO preset-snap, so
  hachure density (flood severity) may be WORSE than a real user (dropdown) sees → re-pass nintendo/x-twitter
  via the real dropdown to confirm before fixing. Full report: `/private/tmp/.../tasks/wir7agehu.output`.
- **PRIORITY FRAMING (north-star):** these are mostly ICON/LOGO stress fixtures, not "arbitrary user doodles"
  (the real target). Worth fixing the P1 flood-clamp (helps real fills too) but github-family knockout =
  still a known-rough stress fixture, lower priority than the 3D pencil + deadline.

## ✅ 2D OFAT — CERTIFIED HEALTHY (2026-06-15 overnight, wf w3lqe0zzr, 13 agents)
Captured the full **197-object catalog across ALL 11 SVG styles** headless (/audit, custom-dropdown driven).
**11/11 styles render all 197 objects; ZERO regressions** from tonight's 2D changes (bold-ink-vs-clean geometry
diff = byte-for-byte identical across all 197; newsprint census 0 collapse / 0 perf-bombs). The fill/perf/snap
changes live on the draw path, not the catalog render path — confirmed untouched.
- **2 PRE-EXISTING style-spec edge cases (NOT regressions, NOT blind-fix — Sebs spec calls):**
  (a) **outline-only**: `psPoster` + `ppvPoster` (knockout WHITE text on solid fill) collapse to empty frames
  when fills are stripped — the lettering is fill-encoded. Decide: keep a thin text outline, or accept+document.
  (b) **stipple**: low-outline cards (`pitchDeckCover`) read near-illegible as a dot-field. Spec tension.
- **Coverage note:** stipple was only visually swept ~20/197 (DOM census passed for all 197); finish that sweep.
- Recipe for re-runs saved (result.recipe): /audit headless, drive the custom SVG-style dropdown
  (button.dd-dropdown-trigger → `[role=option]`), `[data-shape-id]` per-cell crop; ignore headless getBBox
  zero-size false-positives — trust the pixel read. Full report: `/private/tmp/.../tasks/w3lqe0zzr.output`.

## 🏁 FINISH PLAN (LOCKED 2026-06-15, ~3 days to 6/18 11:59pm PDT) — reconciled vs the rounds
**Sequence (render → cert → polish → ship):**
1. **3D PENCIL** (= the 2D/3D/svg-port build-out, task #14 jagged-rims + matte/value-register/two-chain) —
   NOW, needs Sebs's eyes (taste: carve depth, svg-port value-register paper→ink, preset count). #1 priority.
2. **P1 fill-flood clamp** (upload-OFAT finding — rough hachure overshoot on large fills; helps real doodles).
3. **OFAT cert on fixed code** — 2D ✅, upload ✅; do the **3D OFAT** (unblocked after #1) → **FOCUSED big-daddy**.
4. **Light UI/UX cleanup** + **Make sync** + **submission**.

**CUT / DEFER (Sebs-ratified 2026-06-15):**
- ✂️ **Full visual-system / own-design-language pass (#25)** → LIGHT polish only (full rebrand not feasible/needed in 3 days).
- ⏸️ **#19 place-gate (Q2)** + **#29 open-shape shading** → post-makeathon (refinements, core works).
- 🪨 **github nonzero-knockout + pattern/`<defs>`** (upload P2/P3) → known-rough stress fixtures (north-star: real doodles, not logos).
- 📉 **Exhaustive big-daddy** (every object × every toggle × LOW/MID/HIGH × 2D+3D) → FOCUSED cert.

**WEDGE/STRETCH — Sebs-gated on external APIs, can't be done autonomously:**
- **Hard-3D path** (Tripo/TRELLIS via fal.ai, the WEDGE) = scaffolded but INERT (`lib/hardPath.ts` +
  `geometry3d/hardPath.ts` + `fallbackLadder.ts` + `visionProvider.ts`; `image-to-3d` edge fn undeployed;
  `isHardPathEnabled()`=false). **PARKED — decide after 3D pencil** (Sebs choice): if time → light up (Sebs
  deploys fal/Tripo + ~½–1d wiring); else → present as architecture in the submission.
- **Image-upload** (photo→autotrace SVG) = UI stub; client built (`imageToSvg.ts`+`simplifyToSketch.ts`);
  `image-to-svg` edge fn undeployed (needs Quiver key). **DEFERRED** unless Sebs stands up Quiver.

## ☀️ MORNING — READ THIS FIRST (plain, no jargon) — 2026-06-15
Hey. Nothing's on fire. Here's the whole picture in plain words:

**WORKS NOW (done + safe):**
- Personal space — private desks, drawer, shelf — verified working on your live DB.
- Snap button + shapes rework, the demo wall (`/desk?demo=1`, pickable from `/desks` as "The Showcase Wall"),
  adding objects on the demo wall stays on the demo wall (the bounce bug is fixed).
- Nested fill (small shape inside big) gets enough resolution now; single shapes are unchanged.
- The 3D **Pressure** slider actually does something now (fattens the curvy parts).
- Your **shading now gets sent into 3D** (the "svg-port" 3D style wears your 2D drawing's shading +
  light/dark instead of going solid black). This is the first real version of shading→3D.

**NEW since you dozed off (all tsc+build green):**
- ✅ **3D Pressure slider FIXED + verified** (mouse wrote constant-0.5 → defeated the gate; now a flat channel
  falls back to curvature synth; headed capture shows the spiral fatten at bends at high pressure).
- ✅ **3D now defaults to MATTE pencil** (every geometry mode → matteClay; was glossy ink/plastic/gel). Compile-
  verified, NOT visually verified (didn't want to pop a Chrome window while you slept). Reversible one-liner
  (`materials3d.ts MODE_MATERIAL_DEFAULTS_3D`). **Homepage hero materials left as you art-directed them** (glossy
  pokeball etc.) — flag: they now contradict the matte north-star; want them matte too? your call.
- ✅ **Test harnesses preserved** from ephemeral /tmp → `tools/harnesses/` + README (so they survive).
- 🟡 **svg-port artifacts: A+B+C ALL applied + headed-verified as an IMPROVEMENT (not yet clean).**
  - **B** normalScale 4.0→2.5 (`Stroke3DScene.tsx`) — softens the compounded facet hardening.
  - **C** displacement SPLIT — new `SVGPORT_DISPLACEMENT_SCALE=0.18` (`drawingTexture.ts`) used by svg-port
    only; native keeps 0.42 (no regression). Stops thin-line tearing on the cap.
  - **A** carve-field BOX BLUR before the height/Sobel pass (`drawingTexture.ts`, mirrors the bas-relief
    GROOVE_BLUR + the file's own density box-average idiom) — softens the stair-stepped walls. Highest-leverage.
  - Headed before/after (`/tmp/dd-shots/svgport-BEFORE.png` vs `svgport-real.png`): interior etch reads
    SOFTER/cleaner; **rim still shows some faceting** (residual = the tessellated single-step cap + blur radius
    + carve depth — all eyes-on TASTE tunes). tsc+build green. Honest: improved, NOT certified clean. Morning
    eyes-on: tune blurR / carve depth, then per the verify rule (svg-port style X ↔ 2D style X, clean=root).
- 📋 **Full surgical 3D fix plan saved** (diagnosis wf): the remaining mechanical fixes for the svg-port
  artifacts (blur the carve field before Sobel · drop normalScale 4→2.5 · split + lower svg-port displacement)
  + the full matte preset-table re-tune, each with file:line + the headed-Chrome verify. Plan is in
  `/private/tmp/.../tasks/wccranuf1.output` (result.plan) — re-runnable; ask me to re-surface it in the morning.
  TASTE calls left for you: svg-port carve depth, svg-port value-register (paper→ink), toon-ramp, homepage heroes.

**THE 2 THINGS WORTH A 30-SEC GLANCE (your call, no rush):**
1. On your phone (http://192.168.86.36:4173, same WiFi): /canvas → draw + shade → 3D → set 3D style to
   **svg-port**. Does your shading show on the form now? If yes, shading→3D is basically there for that mode.
2. The **solid/native** 3D modes still go black by design (they don't wear the 2D drawing). If you want
   those to carry shading too, that's a bigger build — tell me and I'll do it.

**I did NOT change anything you see by default** — svg-port is opt-in, pressure is a slider you control,
fill/personal-space are unchanged for normal use. So no surprises.

**HONEST svg-port verification status:** I tried to auto-screenshot svg-port 3D but my script couldn't
drive the custom 3D-STYLE dropdown to "svg-port" → it captured **Native** mode instead
(`/tmp/dd-shots/svgport-3d.png`). So svg-port-wears-shading is CODE-CORRECT but **not visually proven by me**
— needs your glance (or a better driver). The Native capture DID reveal a real bug: a shaded region renders
as a **white raised blob** (the old disjoint grey-slab toneFills path, Stroke3DScene.tsx:769-803). Per the
agreed design call (solid/native = clean black FORM + tone via etch/recess, NOT pasted shading), that blob
should be RETIRED → next build: kill the grey-slab extrude in native/solid, carry tone via R10c etch density.
DECISION LOCKED (Sebs 2026-06-15): svg-port wears the literal 2D shading; solid/native carry only tone
(light/dark) via etch + slight recess, never the literal hatch texture.

Everything below is the detailed/technical log. ↓

## 🌙 R10g (2026-06-15 overnight) — render broken-map RE-DIAGNOSED + autonomous fix pass
**Diagnostic workflow `wogmmqht3` (8 agents) done.** Result: 5 of 7 areas ALREADY FIXED (do not redo) —
evenodd donut multi-subpath knockout (renderRegion.ts:140-241), auto-mode line-art→inflate bias
(≥6 strokes; Stroke3DScene + convert.ts), stipple dots+perf cap, snap side-count/overshoot/seam (shapeFit.ts).
**OPEN / tonight's queue (in priority order):**
- R1 (MED): nested/concentric small-hole **fill resolution starve** — DrawSurface.tsx floodFillAt + lib/fill/regionFill.ts (bump grid resolution for the smallest feature; cap ≤1200 for perf). Highest user-visible.
- R2 (LOW): mirror the `MAX_PATH_CHARS` perf cap into the `?smartHachure=0` FALLBACK shading block + delete dead `buildRoughOptionsForPath` — SvgStyleTransform.tsx.
- R3 (MED, **DESIGN CALL → Sebs**): 3D Inflate **pressure slider is dead** on mouse/SVG (no pressure channel). Fix = synth pseudo-pressure from curvature. Ships the mechanism but CHANGES default inflate character → needs Sebs's call on default. DEFERRED to main chat.
**LEAVE ALONE (makeathon):** github nonzero-winding knockout (= known-rough stress fixture, fixing risks the 197 catalog), pentagram single-path evenodd (animated demo), annulus-donut (false-evenodd url() gradient), 3D rims (already smoothed, tuning-only).
**Commit hygiene (needs Sebs / no autonomous commits):** stipple `MAX_PATH_CHARS` backstop (renderRegion.ts:289-321) is WORKING-TREE only — commit so a reset can't resurrect the 19.7M-char path bomb.

**TONIGHT'S AUTONOMOUS RESULTS (2026-06-15 overnight, tsc+build GREEN throughout):**
- ✅ **R2 DONE** — perf-cap backstop mirrored into the `?smartHachure=0` FALLBACK shading block (SvgStyleTransform.tsx, after the fallback `ctx.rc.path`: MAX_PATH_CHARS=300000, ≤4 gap-raises, solid excluded) + **deleted dead `buildRoughOptionsForPath`** (zero callers). Low risk; tsc+build green.
- ✅ **R1 DONE (verify-by-construction + needs 1 eyeball)** — nested/concentric **fill resolution scaling** in DrawSurface.tsx `floodFillAt`: compute cluster-span ÷ smallest-member-feature ratio → `dynRes = clamp(400, ratio*48, 900)` passed to `fillRegionAtMultiScale`. SINGLE shape / same-size siblings → ratio≈1 → stays 400 = **byte-identical to before (zero regression by construction)**. Tiny nested features now get up to ~900-res cells so they fill their OWN region instead of starving. NOT live-verified (headless fill-drive is fragile + would mislead) → **Sebs: eyeball = draw a big circle + a tiny circle inside, switch to Shade→Fill, tap the tiny one → only it fills.** tsc+build green.
- ⏸️ **R3 DEFERRED (correctly)** — Inflate "Pressure" slider dead on mouse/SVG (`extractPressures`→undefined, default `INFLATE_PRESSURE_INFLUENCE=0.35`, gate `pressures && influence>0` never true). Fix = synth pseudo-pressure from curvature (strokeTo3d.ts buildInflateGeometry ~1067 + a `synthPressures()` from the centerline; caller Stroke3DScene.tsx:505). NOT shipped: (a) changes the DEFAULT inflate look = a taste call for Sebs, (b) 3D can't be verified headless (needs real mouse). ~5-min apply when Sebs is up + picks the default character.
- 🔬 **Shading→3D research FIRED** (`wsldp2f79`, read-only) → ranked ink-black tone-transfer approaches + a prototype plan, for the "before-OFAT" build. Brief lands → I prototype ONE on one object → bring Sebs sample renders to pick.

### 🎯 OFAT note — 2D shading/tone → 3D transfer (Sebs 2026-06-15) — see RUNNING-TODO "OFAT REQUIREMENT"
SVG-port→3D still doesn't carry 2D tone: dark regions don't read dark in 3D. Must transfer shading
(grayscale tone bands + hatch styles) to 3D while staying INK-BLACK (value from light). Candidate:
tone→hatch-density etch (R10c) + tone→depth/relief. Dedicated svg-port tone-fidelity OFAT pass gates big-daddy.

## ✅ PERSONAL SPACE DB — VERIFIED WORKING (2026-06-15, task #10 DONE)
Ran all flows end-to-end against live Supabase via browser harness (`/tmp/dd-ps-dbtest.mjs`, isolated
session `test-ps-ee1b7cf5` → owner-scoped, invisible on public wall). ALL 200/ok: `claim_handle`,
`create_private_desk` (**desk_index −4** → migration 0005 applied + globally-unique, no `-1` collision),
listMyDesks, `stash_to_drawer`, listMyDrawer, `share_to_shelf`, listMyShelf, `publish_to_private_desk`,
doodles-on-private-desk, public-pool-separate. Migrations 0001/0003/0004/0005 all live; 0002 intentionally
NOT applied (post-makeathon anon-auth). `.env.local` flags on. (Test rows left in DB — owner-scoped junk,
harmless; wipe later if desired.)

## ⏯️ ACTIVE BUILD (2026-06-15) — Drawing-tool features Phases 0–3 (task #13)
**IN PROGRESS. ON RESUME read `docs/submission/FEATURES-BUILD-LOG.md` FIRST** (live progress + locked
decisions + checkboxes), then `docs/FEATURES-UX-BUILD-SPEC.md` (the build-ready spec). Locked: OFFER-
ONLY (auto-detect on pen-up OFFERS via persistent receipt, never auto-mutates — Sebs 2026-06-15);
inline shapes = Freehand/rect/circle/triangle/diamond/star/heart; Tier-A corner resize only. Phase 0
(extract shared `DrawToolbar.tsx`) is the current step. Build in MAIN LOOP, tsc+build each step.

## 🆕 R10e (2026-06-15 overnight) — Make 3D self-heal (desk+drawer+mounts) + recording + broken-map RE-DIAGNOSED
- **Desk/drawer/per-object 3D now self-heal in Make's preview** (auto-retry `Canvas3DBoundary` exported from DeskObject3DMount, wraps Live3DMount/DeskObject3DMount + DeskPage/DrawerPage overlays). Homepage version VALIDATED in Make by Sebs ("it worked"). Kit `~/Desktop/dd-make-update/` = DeskObject3DMount.tsx + DeskPage.tsx + DrawerPage.tsx (3-file desk round). tsc+build+smoke clean.
- **Build-in-public recording** delivered: `~/Desktop/dd-home.mp4` (full-screen living desk, 24s, 2.7MB).
- **BROKEN-MAP RE-DIAGNOSED LIVE → `docs/submission/BROKEN-MAP-STATUS.md`.** Ran corpus sweep + captured real renders. **Most of FIX-SPECS-remaining is ALREADY FIXED** (U3, D3, 3D-2, U1-g, U5 all present — DON'T re-do). **Opens:** (1) **U4 evenodd** — ✅ MULTI-SUBPATH DONE+VERIFIED overnight (`renderRegion.ts` evenOddRegionPath: polygon-clipping XOR of sampled sub-path rings → donut renders ring-with-knockout, verified via temp default-black; catalog-safe — 0 evenodd in catalog; tsc+build clean; NOT in Make kit yet, ships next batch). STILL OPEN sub-cases: self-intersecting single-path evenodd (pentagram star → wrong triangle, subs<2 so U4 skips) + solid-fill evenodd (github classified 'solid', floods) — both also need default-black. (2) **default-black — SCOPED TO UPLOADS (Sebs's idea: "isn't there a way it doesn't affect the other objects"). DONE.** `svgUpload.ts normalizeDefaultBlackFills` makes SVG-default-black EXPLICIT (`fill="#000"` on any leaf with no fill declared up-chain) in the upload sanitizer — which the CATALOG NEVER passes through → uploads fill, 197-catalog untouched BY CONSTRUCTION (no global guard flip, no 13-object shift). Sweep: github/nintendo/x-twitter/skull went marks=0→fill ✓; catalog unaffected. tsc+build clean. ⚠️ **github still looks ROUGH** — it uses NONZERO-winding knockout (NO fill-rule attr, 3 opposite-wound subpaths), and U4 only covers `evenodd` → github floods as a solid blob (cat not knocked out). Fixing = extend region-recompute to NONZERO winding (broader/riskier — nonzero is the default, every multi-subpath path would route through it) + detailed logos read stylized-rough anyway → recommend github stays a known-rough STRESS fixture (not a real user doodle, per north-star). annulus-donut still marks=0 (declares a fill somewhere — separate edge case). Auto-snap design call = ANSWERED "always just offer" (features §13). D1/D2/D4/3D-1 = re-verify current state before assuming open (several specs were silently fixed).
- **#1 personal-space DB-on = BLOCKED** on Sebs's Supabase migrations (headless can't verify; outbound network sandboxed).

## 🆕 R10d (2026-06-15) — Make homepage 3D crash FIXED (shared canvas) + door + Make sync kit (local, tsc clean :5182, build green, NOT committed)
Make deployment threw `THREE.WebGLRenderer: Context Lost` + `addEventListener` on null + `reading 'fg'` (React Router boundary) → homepage broken in Make. **Root cause:** the homepage mounted ~6 separate WebGL contexts (one `<Canvas>` per 3D hero object via `DeskObject3DMount`). Fine locally (<16 cap), but Make's iframe caps lower → context loss cascade. It was the LAST surface still on the per-object-canvas path that R9-3D's shared canvas replaced everywhere else.
- **FIX (uses existing repo system):** homepage now routes ALL 3D hero objects through ONE shared canvas (drei `<View>`). Added exported **`Object3DSlot`** to `DeskObject3DMount.tsx` (prop-driven sibling of `LiveObject3DSlot` — reads explicit per-object `config` so each hero keeps its DISTINCT style). `DeskDoodlesHome.tsx`: one `<Shared3DOverlay containerRef={deskRef}>` over `.dd-desk`; `ThreeDObject`/`FlipObject` use `Object3DSlot`. **1 WebGL context now (was 6).**
- **Flip rebuilt** (the shared-canvas 3D is a sibling layer → CSS opacity can't cross-fade it; old reveal showed BOTH faces misaligned = "weird pop / double image", Sebs flagged). Now a **card-turn**: only ONE face `display:block` at a time, hard-swapped at the edge-on midpoint (`@keyframes dd-cardflip` scaleX→0.04). 3D layer kept mounted (display-toggled, drei culls when hidden → no rebuild, no bleed). Sebs: "the flip is good".
- **"Your space" door** now shows by default — `personalSpace.ts isPersonalSpaceEnabled()` was gated on `VITE_PERSONAL_SPACE` (doesn't travel to Make) → now defaults ON; DB-write gate (`VITE_PERSONAL_SPACE_DB`) still separate/OFF so no live writes.
- **Verified local:** tsc clean, build green, `MultiStroke3D` stays lazy chunk; harness `/tmp/dd-flipcheck.mjs` → worst simultaneous visible faces = **1** over 729 samples/12 flips, 0 errors, ctxLost 0, canvases **1**. Burst frames `/tmp/dd-shots/burst-*.png`.
- **Make sync kit** `~/Desktop/dd-make-update/` (3 files + PROMPT.txt): DeskDoodlesHome.tsx, DeskObject3DMount.tsx, personalSpace.ts → replace-in-place. Earlier same-session Make fix: removed `react-dom/server` (Make shim lacks `renderToStaticMarkup` → blank pages) → `createRoot`+rAF poll in `shapeMarkupAsync`.
- **DUPLICATE-THREE crash (the REAL Make 3D blocker).** After the shared canvas reached Make, BOTH homepage AND desk-3D threw `TypeError: Cannot read properties of undefined (reading 'fg')` at R3F `applyProps → createInstance` — fiber failing an `instanceof THREE.*` identity check because **two copies of `three`** were bundled. ROOT: `stats-gl` (transitive via drei) pulls **three@0.170** while the stack is on **three@0.169** (`npm ls three` → `stats-gl/node_modules/three@0.170.0`; two physical copies). Dormant locally (we never import drei Perf/stats-gl → 0.170 stays out of the graph → 0 errors local), but Make's optimizer bundled both.
  - **vite.config.ts** `resolve.dedupe` += `['three','@react-three/fiber','@react-three/drei']` + `optimizeDeps.include` (belt).
  - **package.json** (the authoritative fix): pinned `"three":"0.169.0"` + `"overrides":{"three":"0.169.0"}`. ⚠️ npm only collapses the dup on a CLEAN install (delete package-lock.json → reinstall); a plain `npm install` reuses the stale lock and keeps stats-gl's 0.170. VERIFIED locally: clean install → `stats-gl/node_modules/three` GONE, single three, build green, homepage 1 canvas/0 errors.
  - **DeskDoodlesHome.tsx** `Canvas3DBoundary` (class) wraps the 3D layer → on any 3D throw, `threeFailed` flips → desk re-renders 2D-only (force2d on DeskItem, no Shared3DOverlay). Ships as APP code so it takes effect even with Make's stale deps cache → **homepage never white-screens** (worst case = flat doodles).
  - **CORRECTION (Make AI gathered facts + Sebs confirmed):** duplicate-three is NOT Make's cause. Make uses **pnpm** → only ONE three@0.169 there (the 0.170 dup was a LOCAL **npm** artifact; harmless override kept local, INERT for Make). The vite.config dedupe + package.json override + clean-reinstall were a dead end for Make — DROPPED from the kit. The local package.json pin/override + vite dedupe stay locally (valid hygiene, harmless).
  - **REAL Make cause = WebGL context COLD-LOAD RACE in the editor-PREVIEW iframe** (same family as Rapier). Even 1 context (shared canvas IS live in Make — Sebs applied that earlier kit) can fail to acquire on a cold preview load → R3F `createInstance` throws `reading 'fg'`. **The PUBLISHED *.figma.site site WORKS** (warms up fine) — preview-only flake. Sebs wants to test IN the Make app, so the preview matters.
  - **FIX = self-healing auto-retry boundary** (DeskDoodlesHome `Canvas3DBoundary`, upgraded): on a 3D throw → show flat 2D doodles → backoff 150/400/1000ms → REMOUNT 3D (fresh key) → retry usually lands warm → 3D appears on its own; only stays 2D if all retries fail. NEVER white-screens. Lever 1 (single shared context) already done on homepage/desk/drawer (`DeskPage:2572` Shared3DOverlay + `:357` LiveObject3DSlot; `DrawerPage:298/677`); leftover per-object `Live3DMount` are single-object surfaces (modal/preview, 1 ctx each — fine). Verified local: normal=3D/1 canvas/0 err; forced-down=clean all-2D/0 canvas/no crash; tsc+build green.
  - ✅ **VALIDATED IN MAKE (Sebs 2026-06-15): "it worked"** — homepage auto-retry self-heals to 3D in the editor preview. Cold-load context race confirmed as the real cause; auto-retry is the proven fix.
  - ✅ **Desk + drawer + per-object mounts now wrapped too.** `Canvas3DBoundary` EXPORTED from DeskObject3DMount.tsx (auto-retry, fallback prop); wraps Live3DMount + DeskObject3DMount internals (→ edit modal / draw preview / desk preview auto-covered) + the desk (`DeskPage:2572`) and drawer (`DrawerPage:298`) Shared3DOverlay usages. Homepage LEFT UNTOUCHED (its own validated boundary — no re-upload needed; small intentional dup of the class, consolidate post-makeathon). tsc+build clean; /desk + /drawer smoke-load 0 errors. NOT yet re-validated in Make (Sebs to test). Make kit `~/Desktop/dd-make-update/` updated: DeskObject3DMount.tsx + DeskPage.tsx + DrawerPage.tsx (homepage/personalSpace unchanged/optional).
- **Make kit** `~/Desktop/dd-make-update/` = 3 files: **DeskDoodlesHome.tsx (★ auto-retry, the only real change)** + DeskObject3DMount.tsx + personalSpace.ts (both unchanged/optional). NO reinstall. PROMPT.txt updated.
- **PENDING (Sebs):** re-add og:image/social-preview meta via Make settings (Make blocks index.html). Small test hooks left in DeskDoodlesHome (`.dd-flipwrap`, `data-flipface`) — harmless, can stay.

## 🆕 R10c (2026-06-15) — 3D detail SOLVED via ETCHING + craft doc (local, tsc clean :5182, NOT committed)
The "show detail on black 3D" saga RESOLVED. Proven dead-ends (don't retry): native/bump/displacement = black but
detail invisible; svg-port + hatch = detail shows but renders GREY (they paint the drawing as paper-albedo, never
black). **THE FIX = ETCHING:** the doodle's own lines drawn as LIGHT incised lines (`detailLines` in
`Stroke3DScene.tsx` StrokeMeshes — light LineSegments from the strokes at the front AND back cap z), on the black
native form. Form stays ink-black, detail reads as light cut-lines (like an engraving). Gated to native solid/extrude
(the fused forms that lose detail) → already SYSTEMIC (every such object app-wide gets it). Also: real
`displacementMap` carve added to the black native material (reliefGeom = TessellateModifier cap), RELIEF_DISPLACEMENT
0.42, BUMP 5.0 — secondary depth.
- **Homepage pokeball + gameboy**: both native solid/extrude + etched, DISTINCT (pokeball solid·glossyPlastic glossy
  puck; gameBoy extrude·**rubber** satin slab — unused material). Both show band/button + screen/dpad as light etched
  lines. Verified `/tmp/dd-shots/pgb-crop.png`. **Game Boy moved to bottom-right (slot s12); flagPin → top (s2)** (swap
  in HERO_OBJECTS). DON'T touch the other homepage objects (medal/shoe hatch etc. — Sebs: "they're fine").
- **Shoe clip on rotate** → FRAME_FIT_MARGIN 1.18→1.32 (sphere-fit breathing room for long objects).
- **Card PNG** = Pokémon-style card DONE (`exportPokemonCardPng`). **Cat fill-drop** DONE+verified. Default-black icon
  fill REVERTED (sequenced behind evenodd U4, see FIX-SPECS-remaining).
- **CRAFT / BIG-VISUAL-PASS doc**: `docs/submission/CRAFT-VISUAL-PASS.md` (from video-analysis wf — 2 ref videos vs our
  gap). Quick wins (land now): contact-shadow, procedural env/IBL, Inflate-as-default, rim luminance-adapt, reveal
  cascade, cursors, ink-confetti reward, Ken-Burns drift. Big pass: value-range(light+AO+hatch-as-tone), flip-as-hero-
  beat, one-hand chrome, textured-ink media. ALL ink-black (value from light, never hue).

## 🆕 R10b (2026-06-15) — 3D "black blob" pass (SUPERSEDED by R10c above)
Sebs (video-confirmed): 3D models render as featureless BLACK BLOBS, detail invisible; "happens on drawing too". DECISION (Sebs picked): **ink-black form + EDGE/CONTOUR LINES** (toon-ink), NOT lighter material. Diagnosis frames `/tmp/rosevid2/`, mode captures `/tmp/dd-rose3d-modes/`.
- ✅ **Stroke cap 60→220** (`Stroke3DScene.tsx:374` MAX_STROKES_3D) — at 60, the rose's 112 strokes lost HALF before render. Perf bounded by viewport streaming.
- ✅ **Edge lines ON** for native+hatch (`Stroke3DScene.tsx:1312` showEdges) — EdgesGeometry@30° in ink. Helps Rod/Inflate (per-stroke geometry → creases → reads as a rose w/ petals, verified `/tmp/dd-rose3d-modes/mode-Inflate.png`). MARGINAL on Extrude/Solid (they FUSE line-art → no interior edges left to outline → still blobs).
- 🔴 **KEY REMAINING LEVER: Auto must stop using Extrude/Solid for LINE-ART** → bias multi-stroke/line drawings to Rod/Inflate (which preserve + now edge-outline the lines). The blob is inherent to the fuse modes. Auto logic is in `convert.ts:304+` (intent-cluster pipeline — substantial, verify carefully; NOT done, deferred from this giant session). Consider: stroke-count/openness heuristic → prefer inflate when many thin strokes.
- 🔴 **Pressure slider (Inflate) dead** — ROOT-CAUSED `strokeTo3d.ts:1067`: `r *= 1+influence*2*(p-0.5)`; mouse/SVG = constant/no pressure → ×1. FIX: synth pseudo-pressure from speed/curvature when no real channel (samplePressure/extractPressures ~942/956). NOT done.
- 🔴 **Card PNG export = bare object** — Sebs wants Pokémon-style CARD w/ frame+name+info. `lib/exportCard.ts`. NOT done.
- Reusable: `/tmp/dd-rose3d.mjs` (headed-Chrome: upload rose → compose 3D → cycle modes → capture), `/tmp/rosevid2/` (video frames). 3D = headed Chrome only (headless can't WebGL); rotation still needs Sebs's real mouse.

## 🆕 R10 (2026-06-15) — CAT fill-drop FIXED (local, tsc clean on :5182, NOT committed)
- **CAT fill-drop FIXED + PROVEN collateral-free** (Sebs's explicit ask: "the cat thing ain't even an outline it renders like some weird triangle"). Root: cat's fill is inline `style="fill:black"`, not a `fill` attr → old `trustBlack` guard dropped the computed black → no fill (the "weird triangle" = empty-fill artifact). Fix in `signals.ts` extractSignals: walk el + ≤10 ancestors for a *declared* fill (inline `style.fill` or `fill` attr) → trust black. Cat now fills as a recognizable silhouette. **Verified:** per-object catalog diff at Bold-ink = **ZERO diffs / 197** vs OLD HEAD (411 marks both) + 11-style sweep 197/197 0-empty. tsc clean.
- **DEFAULT-BLACK icon fill: tried → REVERTED → SEQUENCED.** Heuristic "trust black when neither fill nor stroke declared" filled simple-icons (github/x/nintendo) BUT (a) shifted 13 locked-catalog objects, (b) donut perf 335→214K, (c) knockout logos render WRONG (github fills the cat, not the disc-with-hole) due to the **open evenodd hole-knockout bug**. → fix evenodd FIRST, then 1-line re-enable (NOTE comment in signals.ts). Full writeup + evidence in `docs/submission/RUNNING-TODO.md` COMPLEX-SVG section; pics `/tmp/dd-icon-decision/`, `/tmp/dd-shots/{og-github,github-filled}.png`.
- **NEXT highest-value (unblocks a lot):** the evenodd hole-knockout fix (gates default-black icons + annulus-donut + every knockout logo — core to "handle arbitrary user SVGs"). Edits to existing files = MAIN LOOP only (stale-base rule). Reusable: `/tmp/dd-corpus-sweep.mjs`, `/tmp/dd-catalog-diff.mjs` (before/after via git stash), `/tmp/dd-svg-render-check.mjs`, `/tmp/dd-cell-capture.mjs`.

## 🆕 R9-3D (2026-06-14 eve) — FLIP-ALL real fix + Export menu (local, tsc+HMR clean on :5182, NOT committed)
Full detail in `docs/submission/RUNNING-TODO.md` → "R9-3D" section. Summary:
- **Flip-all-3D rebuilt the RIGHT way** (the cap-at-10 was "cheap"): ONE shared WebGL canvas per surface, N drei `<View>` viewports → no context limit, every object flips at once. New `canvas3d/MultiStroke3D.tsx` (`Shared3DCanvas` + `Object3DView`) + `Stroke3DContents` extracted from Stroke3DScene + `Shared3DOverlay`/`LiveObject3DSlot` in DeskObject3DMount. Wired into **desk** (cap removed → viewport+margin streaming via threeDIds), **drawer + shelf** (DrawerPage grid). Make-safe (drei verified in Make; per-page canvas + eventSource ref).
- **PROVEN via real-Chrome capture** (headed Chrome = real GPU renders WebGL — headless still can't): desk 20+ objects + drawer 6, one shared canvas, no crash, transparent, **bounds-fixed** (canvas absolute-bound to the surface, never over the panel; panel open+collapsed both correct).
- **Export menu COMPLETE** (`lib/exportGlb.ts`, lazy): ObjectSurface Share row = Export SVG · PNG (card) · **3D (.glb)**. GLB verified end-to-end (real-browser download → valid 126KB glTF).
- **SVG→3D** added to Add-a-doodle modal (Upload SVG flips to 3D preview). **Share-to-shelf** → hover-reveal. Naming-stage 3D toggle removed + dead code cleaned.
- ⚠️ **ROTATION unverified** — synthetic drags don't trigger 3D controls (even desk-pan doesn't respond to synthetic drag); real-mouse path needs **Ghostty** granted Accessibility, then `node /tmp/dd-cliclick-rotate.mjs`. Bound each view's controls to its slot as the likely fix. NEEDS Sebs's real mouse OR the permission. Also pending: **Figma Make published-URL test**.
- Capture harness (reusable): headed-Chrome puppeteer-core, scripts in `/tmp/dd-capture-*.mjs`, `/tmp/dd-glb-verify.mjs`. `puppeteer-core` installed `--no-save`.


## 🆕 R9 DAY (2026-06-14 pm) — nested-fill FIXED + personal-space IA BUILT (local only, NOT committed)
Working tree has uncommitted changes (tsc clean throughout). Dev server for testing ran on :5183 with `VITE_PERSONAL_SPACE=1` (UI on, DB flag OFF). To see the personal space: run dev with `VITE_PERSONAL_SPACE=1`; it's gated OFF in `.env.local` so normal :5182 is untouched.

- **NESTED FILL FIXED (Sebs's #1 bug) — LIVE-VERIFIED** (`/tmp/dd-ps/70,71`): tap inside a shape nested in another fills ONLY that shape; tap the ring fills ring w/ holes. Two fixes in DrawSurface.tsx: (1) `floodFillAt` (cluster-pick → `floodFillRegionAt` flood bounded by ink → toVb map) REPLACES the region-tree in `commitFillAt`+preview; (2) `strokeBordersOutline` proximity gate on `inkOutlinesNear`/`strokeCenterlinesNear` (bbox-overlap wrongly handed the OUTER shape's ink to the rasterizer's enclose-conform → it filled the whole outer region). `applyFillRegion`→`applyFillPatch` refactor; highlight path unchanged. Caveat: mouse-drawn ACUTE triangles draw OPEN (perfect-freehand pinhole) → flood leaks; closed shapes (circles proven) isolate correctly. Real users draw closed/snap.
- **PERSONAL-SPACE IA BUILT + LIVE-VERIFIED** (Sebs locked full social-drawer, Drawer+Shelf naming, lazy identity):
  - Homepage `/` = hub: Public door (/desk,/desks) + Your space door + invitational handle chip (`DeskDoodlesHome.tsx` rewritten). `/tmp/dd-ps/20`.
  - `/your-space` (new `YourSpacePage.tsx`, agent-built): first-run claim + My desks (+New) + drawer entry. `/tmp/dd-ps/81`.
  - `/drawer` (new `DrawerPage.tsx`, agent-built): Drawer|Shelf tabs + metaphor line. `/tmp/dd-ps/82`.
  - `ProfileShelfPopover.tsx` (new, agent-built) — NOT mounted yet.
  - Lazy identity: `DeskPage` no longer auto-pops onboarding on /desk (claim lives on /your-space); overlay still re-openable via chip.
  - Data layer added to `personalSpace.ts`: `listMyShelf/listShelfOf/shareToShelf/publishToPrivateDesk` + local-handle persistence (`getLocalHandle/setLocalHandle`, fixes DB-off chip inconsistency). `DoodleRow` +owner_id +is_public. Routes added.
- **ALSO DONE + live-verified:** drawer **Expand ⤢** button on the desk personal panel → /drawer (`/tmp/dd-ps/90`); **ProfileShelfPopover** mounted — click another maker's @handle on a desk object → ObjectSurface → owner button → their shelf (`/tmp/dd-ps/91`, honest empty state DB-off). Threaded `onOwnerClick` ObjectCard→ObjectSurface→DeskPage (owner_id==session id this era, so ownerSession is the shelf key).
- **STILL TODO (task #8) — DB-GATED, can't function/verify without Sebs DB:** stash-to-drawer entry in the draw/Add-doodle flow; publishToPrivateDesk routing (draw on private desk → that desk); public-desk-doodle→shelf-auto. Need: migrations 0001/0003 + `is_public`/shelf flag + `share_to_shelf`/`publish_to_private_desk` RPCs + flip `VITE_PERSONAL_SPACE_DB`. Everything DB-INDEPENDENT in the personal-space IA is now built+verified.
- Personal-space audit workflow ran (matchPercent 72): identity DONE/over-delivers; the "write your name" = Type-your-own handle claim (no literal name field was ever specced).

## ⚡ ON RESTART — read this first
Tonight surfaced a verified LIVE broken-map (real, not the old mechanical-harness lie) AND a critical process trap. Nothing
new was committed tonight (working tree clean; only docs added: this handoff, RUNNING-TODO additions, datasets/QUARANTINE.md).

## ✅ FIXED + COMMITTED this run (local only, NOT pushed)
- **2D shading — tone fills now honor fill-style** (`ae6e449`): `RULE_enclosing_tonal_wash` in classifier.ts.
  LIVE-VERIFIED on :5182 (solid/hachure/crosshatch/dots/zigzag/dashed render distinct; was identical flat grey).
  Proof: `/tmp/ofat-2d/shadefill2/_sheet.png`. + snap polygon side-count label (`countTrueSides`, tsc-clean).
- **Multi-shape fill region detection** (`9e7f907`): per-cluster extraction in extractFillRegions (union-find on bboxes;
  each shape extracts at full res over its own bbox vs one grid over the union). tsc-clean, no-regression verified on
  box+circle. Multi-shape-far improvement by-design; **nested-small-feature resolution starve still OPEN** (separate fix).
- **Complex SVG → 3D (the rose)** (`5b2cde0`): svgMarkupToStrokes splits a multi-subpath `<path>` and samples each subpath
  as its own loop (was: one compound path → one tangled rod). LIVE-VERIFIED on :5182 — rose renders as a recognizable
  rose (bloom+stem+leaves) with real extruded depth, 0 errors (proof `/tmp/rose3d/02-3d.png`). Change A alone sufficed;
  Change B (unify into one pool-solid mass w/ evenodd holes) deferred as refinement. Follow-ups: 60-stroke 3D cap drops
  ~half the loops (rose still reads); svg-port real-relief carve on the rose is separate (FIX-SPECS-remaining svg-port rims).
- **3D-2 viewBox-Infinity + D3 gap ladder** (`f82f96c`): strokesToObjectMarkup emits '' on degenerate bbox (was the rose
  svg-port "Infinity" source) + poolCenter/buildSvgPortTexture finite-guards. LIVE-VERIFIED: rose svg-port 0 console errors
  (was 3). GAP_LADDER extended to bridge ~96px gaps (tsc-clean).
- **D4 snap overshoot tail** (`99d6666`): proportional seam tolerance in closedLoopVertices. tsc-clean (circle-seam sub-bug
  + live snap verify = follow-up).
- Ready artifacts: clean dataset `smart-layer.clean.jsonl` (108 honest rows) · feature scaffolds (switchSet/OverrideReceipt/
  SwitchPopover/ShapeStrip, type-clean, 19/19) · online-SVG corpus (15 files, `test-fixtures/online-svgs/`) · all fix-specs
  saved (`FIX-SPEC-rose-3d.md`, `FIX-SPEC-2d-shading.md`, `FIX-SPECS-remaining.md`).

## ▶️ NEXT FIXES (specs ready, in priority order) — implement in MAIN LOOP, live-verify each
rose→3D (FIX-SPEC-rose-3d.md, Change A svgToStrokes subpath-aware fill-sampling + Change B Stroke3DScene route filled→
pool-solid) · U1 inherited `<g fill>` (FIX-SPECS-remaining) · 3D svg-port jagged rims · U3 dots perf-bomb cap · nested-fill
resolution · viewBox-Infinity guard · snap overshoot/seam · THEN feature wiring (Phases 1–3) · THEN big-daddy.

## 🛑 CRITICAL LESSON — worktree agents are on a STALE BASE (don't repeat tonight's waste)
- `isolation:'worktree'` (Agent AND Workflow) creates worktrees from **`54ca22f` — 144 commits behind HEAD `ce30289`**.
  Half the current files (e.g. `shapeFit.ts`, likely `strokeTo3d.ts`) **didn't exist yet** at that base. A side-debugger
  proved it and correctly REFUSED to fake a diff. This matches the long-standing `feedback`/PENDING-AUTOFIRE stale-base law.
- **CONSEQUENCE / RULE:**
  - **EDITS to existing files → MAIN LOOP only** (me, on current HEAD), live-verified. NO worktree fix agents.
  - **READ-ONLY agents (no worktree) → fine and good** — the live-OFAT fleet worked great because it drove the *running*
    app at :5182, not a stale checkout. Use agents for OFAT/live-drive/diagnosis/research, never for edits.
- 3 fleets were launched on worktrees tonight and KILLED once this was understood (2 redundant + 1 stale-base fix-fleet).

## ✅ VERIFIED LIVE broken-map (live-OFAT wf wg6jeydjx — drove :5182, 183+ screenshots, DOM probes, HONEST)
Full output: `/private/tmp/.../tasks/wg6jeydjx.output`. Screenshots: `/tmp/ofat-2d`, `/tmp/ofat-3d` (svg + drawtools partial).
**WORKS:** 2D Clean + all 11 styles + every pen slider (true ranges) · fill clean-edge (no bleed/notch) · multi-shape 2D
render · **3D geometry toggles DO change the mesh for drawn shapes** (the "dead toggles" claim was FALSE for simple shapes).
**BROKEN (fix these):**
- **2D shading:** shade-brush TONE fills ignore fill-style — render flat grey, no `<pattern>` (DOM-confirmed). Fill-style
  WORKS on SVG-source fills → so the bug is the tone-fill path. Target: `DrawSurface.tsx:759 toneFillsMarkup` emits a flat
  `<path fill=hex>`; tone patches are NOT getting the classifier→fillStyle marks that SVG-source fills get. (med)
- **SVG upload:** inherited `<g fill>` dropped → fill-style total no-op on those uploads (high) · "Stipple" preset renders
  as hachure not dots (high) · rough.js "dots" on a big region emits a **19.7M-char path** (perf bomb, med) · evenodd
  donut loses hole/floods solid (med) · pattern/gradient fills degrade (low).
- **drawing tools:** concentric/nested → tapping inner floods outer (med) · small hole tap fills parent (med) · gap slider
  can't close a visibly-open gap (low) · snap mislabels polygon side-count (5→"Polygon(8)") + overshoot tail (low) ·
  snap-circle endpoint seam (low). [snap bugs → `shapeFit.ts` fitPolygon ~926/937, n-gon weld ~1718-1764, circle wrap.]
- **3D:** rose (complex compound path) → bird's-nest of rods (high) · svg-port jagged rims (high) · svg-port carve
  near-invisible on rose's fused face (med) · `viewBox: Infinity` console error on rose svg-port (low).

## ▶️ RESUME PLAN (in a FRESH/cheap session — this one's context is huge/expensive)
1. **Fix the broken-map in MAIN LOOP**, one bug at a time, each live-verified on :5182 with a before/after screenshot.
   Start: 2D shading (tone fills → fill-style) · then rose→3D (filled compound path should EXTRUDE the filled silhouette,
   not rod-per-stroke — `svgToStrokes.ts`) · svg-port real-3D-relief (Sebs's rule: actual 3D transform carrying the 2D
   essence, NOT a flat plopped line) · fill-region nested/concentric · SVG-upload fill bugs · snap (shapeFit).
2. **Drawing-tool FEATURES** = `docs/FEATURES-UX-BUILD-SPEC.md` **Phases 1–3** (Phase 0/DrawToolbar done). Direction is
   LOCKED (§0); UX research already cited (§8). One Sebs design call open: §13 "auto-apply vs auto-offer" confidence band.
3. **Re-run per-stage OFATs on FIXED code** (live, paired-vs-Clean) incl. a DEDICATED svg-port "real-3D-relief" OFAT.
4. **BIG-DADDY OFAT** — full 197 + gap objects + the online-SVG edge corpus (rose + more), live, paired-vs-Clean.
   **GATED on BOTH the bug-fixes AND the drawing-tool features (Phases 1–3) being DONE first** (Sebs 2026-06-14) — big-daddy
   tests the full user flow *through* the final tools, so the tools must be complete + fixed before it runs. Order:
   fixes → feature wiring (Phases 1–3, main loop; new files scaffolded in parallel) → big-daddy.

## 🔒 GATES (the trust repair — non-negotiable)
- **No "fixed" claim without a live :5182 screenshot Sebs can open.** Pass = the picture is right vs Clean, not "strokes exist".
- **Dataset QUARANTINED** (`datasets/QUARANTINE.md`): zero new rows until fixes verified; then only honest visual
  paired-vs-Clean labels from the live app, fresh source tag. No mechanical labels, no `__ddSet` shortcuts.
- **OFAT flow (Sebs canon, FULL scope):** FIVE input-source OFATs on the LIVE app — (1) 2D · (2) SVG-upload · (3) drawing
  tools · (4) 3D · (5) online-SVG edge corpus (rose + more) — PLUS the audit catalog (197/224) **one object at a time**.
  Method: hold the **Clean SVG** baseline → change ONE toggle → at **each value LOW/MID/HIGH** → **compare to Clean** →
  revert → next; every toggle, every value. Drawing-tools = just-verify-live (no Clean to diff). Plus bugs/edge/breaking/
  gaps. **Big-daddy = all of it on FIXED code** (final cert + the clean trainable dataset). Keep growing the online-SVG set.

## 🧰 Reusable (good): the live-OFAT drivers the agents wrote — `/tmp/ofat-2d/driver-lib.mjs`, `run-ofat.mjs`,
`/tmp/ofat-3d/driver.mjs` (real /canvas driving via playwright @ /tmp/dd-pp). Reuse these for re-runs (they DRIVE LIVE).

## 🙋 Sebs-side / open design calls
auto-apply-vs-auto-offer confidence band (§13) · Tier-A corner-resize = the intended "reshape"? · budget: decide fresh-session.
