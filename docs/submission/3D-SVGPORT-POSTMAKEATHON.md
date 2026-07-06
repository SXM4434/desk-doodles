# svg-port 3D — what shipped (v1) + the post-makeathon plan (researched)

## ✅ SOLVED 2026-06-16 — stroke toggles now TRANSLATE to svg-port 3D
Sebs: "multi stroke should show in 3d… many things to translate." They didn't.
ROOT CAUSE (proven 3 ways — OFAT byte-identical md5, code read, visual): the svg-port crisp incised
marks (`detailLines` in Stroke3DScene.tsx) were built from the RAW strokes, so stroke-PATH toggles
(wobble/jaggedness/simplification/bowing/multiStroke/sketchy/penTip/endpoint) changed the 2D markup but
NEVER reached the 3D marks. Two secondary bugs: the etch sat at z+0.012 but the displaced cap peaks at
~+0.03 → marks OCCLUDED; and the styled marks needed scale-1 sampling to register on the form.
FIX (Stroke3DScene.tsx): for svg-port, build `detailLines` from the STYLED markup
(`svgMarkupToStrokes(svgPortMarkup)`), STRIP `[data-smart-hachure]` fill/tone groups first (else the dense
hachure inscribes as a white blob = the "scratch mess"), and lift the etch z above the cap peak. Native
relief untouched (gated on isSvgPort). Added `__ddSet.setMod` dev seam for headless toggle testing.
VERIFIED (OFATs /tmp/dd-shots/svgport-translate, setmod-verify): 9/9 sliders + 5/5 categoricals
(incl. multiStroke 7/8) now produce DISTINCT, readable 3D renders. Catalog Game Boy (fill-heavy)
regression = clean, not a mess. tsc green. (Deep GEOMETRIC relief below is still post-makeathon.)

---


**Status (2026-06-15):** svg-port 3D ships as **v1 / functional, refinement ongoing.** It renders in-system
(desk · catalog · modal · /canvas), wears the styled 2D, and reads as a clean matte-ink-black sketch on a 3D
form — crisp marks, no tearing. The **deep geometric 3-treatment relief** (dramatic indent/raise) is a
**documented post-makeathon improvement** (real plan below). Honest: not "fully done," it's v1 + a roadmap.

---

## What shipped in v1 (the quick win that works)
The relief **LIGHTS the drawing — it does not try to BE the surface** (the Ink-and-Ray principle). Concretely:
- **Near-flat displacement** (`SVGPORT_DISPLACEMENT_SCALE = 0.06`): the displaced front-cap barely moves, so it
  **cannot tear** off the body (the tear was deep displacement ripping a separate cap clone — topology, not smoothing).
- **Crisp marks via detail-LINES** (the R10c etching, now enabled for svg-port): the doodle's strokes drawn as
  light incised line geometry on the form — marks stay sharp because they live in the LINE/NORMAL layer, never
  in deep displacement (immune to the blur that used to mud them).
- **3 treatment layers read via shading + normal** (not deep geometry): engrave (lines) · indent (tone/closed
  panel → darker via normal/shadow + dark albedo) · raise (small detached closed shape → lighter). Per-element
  classifier + signed height field in `drawingTexture.ts` (`treatMask`), plus the value ladder (graphite ground,
  light chalk on lines, fills sink) and emissiveIntensity 0.42 so marks read on the dark form.
- **Black-block fix (the real in-system bug):** the desk/catalog markup is in its OWN viewBox (e.g. `0 0 64 100`)
  but the strokes/geometry are fit to the engine 800×600, so svg-port re-rooted the raster OUTSIDE the content →
  uniform block. Fixed by remapping the sub-rect into the markup's native viewBox + resolving `var(--dir-*)` to
  hex before raster (presentation-attr var() doesn't resolve in a data-URL raster). svg-port markup now wired
  through Live3DMount / LiveObject3DSlot (was unwired → plain slab on desk/modal).

## Why the dramatic deep relief is NOT v1 (root cause)
The tear is a **topology problem**: we displace a SEPARATE tessellated front-cap clone; at real depth its
vertices move but the welded body's don't, so the cap pulls away and exposes the interior ("outer layer breaking
off"). Smoothing only hides it by killing the relief. You cannot get deep, crisp geometric relief on a
free-floating cap.

## Post-makeathon plan (researched — wf wq0iqh7ra)
**Architecture = the Ink-and-Ray / Digital-Bas-Relief register split:** relief drives shadow/AO/normals; the
crisp 2D marks stay authoritative. Build it as:
1. **ONE sealed watertight mesh** instead of a cap clone — front displaced grid + skirt walls + flat back, with
   **welded boundary vertices** (`BufferGeometryUtils.mergeVertices`) so nothing can separate, + **recompute
   normals after displacement** (`computeVertexNormals` or shader finite-difference — stale normals were the
   "muddy when smoothed"). This is exactly how lithophane/terrain meshers stay watertight (fogleman/hmm `-b`
   solid + border padding, FreeCAD Lithophane Box mode). Low–moderate effort, no heavy dep.
2. **CSG for the discrete hard-edged features** — SUBTRACT a rounded box for a screen INDENT, UNION a boss for a
   raised button — via `manifold-3d` (guaranteed-manifold) or `three-bvh-csg`. Perfectly crisp vertical walls a
   height field can't give.
3. **Detail-vs-structure split (keep):** small smooth displacement for big indent/raise structure only;
   engraved lines + hatch as Sobel **normal map** + real **line geometry**, never deep-displaced.
4. **Shading:** toon/Lambert ink-black + strong **SAO/N8AO** (no specular, no hue) so indent/raise read by
   shadow; depth = darker (self-shadow), raise = lighter (lit crown). Tonal Art Maps (Praun-Hoppe) for hatching
   that follows form (curvature direction field) if we want true contour-hatch.
5. **Tessellation scales with displacement depth** (or adaptive/error-bounded like Garland-Heckbert).

## Citations
- Ink-and-Ray (Sykora et al., TOG 2014) — relief proxy LIGHTS the drawing, marks stay crisp: https://dcgi.fel.cvut.cz/home/sykorad/ink-and-ray
- Lumo (Johnston, NPAR 2002) — normals from line art to light it without displacing: https://www.semanticscholar.org/paper/Lumo:-illumination-for-cel-animation-Johnston/2e0a1dbdc8a741c49684aa61b9482c8c735c7fd9
- Digital Bas-Relief from 3D Scenes (Weyrich et al., SIGGRAPH 2007) — compress low-freq, preserve high-freq detail: https://gfx.cs.princeton.edu/pubs/Weyrich_2007_DBF/index.php
- Sketch2Relief (deep GAN sketch→relief): https://shizhezhou.github.io/projects/sketch2relief/ske2rlf.pdf
- Real-Time Hatching / Tonal Art Maps (Praun-Hoppe, SIGGRAPH 2001): https://hhoppe.com/proj/hatching/
- three.js mergeVertices: https://threejs.org/docs/pages/module-BufferGeometryUtils.html · normals-after-displacement: https://discourse.threejs.org/t/calculating-vertex-normals-after-displacement-in-the-vertex-shader/16989
- lithophane/terrain mesh (sealed solid): https://github.com/fogleman/hmm · https://github.com/furti/FreeCAD-Lithophane
- CSG: manifold-3d (https://github.com/elalish/manifold) · three-bvh-csg (https://github.com/gkjohnson/three-bvh-csg)
- Full research output: `/private/tmp/.../tasks/wq0iqh7ra.output`

> Earlier internal research already pointed here: `docs/3D-FIX-SPEC-RESEARCHED.md` (detail-vs-structure, ~0.3 displacement, Sobel normal marks).
