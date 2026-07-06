# AI-Mesh + 3D Controls — Unification Plan (locked w/ Sebs 2026-06-27)

The edit-modal 3D controls split into two inconsistent structures (a "Look" dropdown
for mesh objects vs the "3D STYLE / geometry" chrome for stroke objects), and the
mesh wasn't wired into the agreed FORM × SURFACE model. This is the fix.

## THE MODEL (one control set for EVERY 3D object)

Two orthogonal axes, identical UI for mesh + non-mesh:

### Axis 1 — GEOMETRY / FORM (how the 3D shape is MADE)
`auto · extrude · inflate · rod · solid` — all built from the object's **Quiver SVG**
(its strokes). Plus **`AI mesh`** as one more entry, *only when the object has a
generated GLB*.
- `AI mesh` → render the generated GLB.
- a stroke mode → render the SVG-derived form (extrude/inflate/etc. of the drawing).
- **Geometry modes CANNOT run on the GLB itself** — they are 2D→3D generators (strokes
  → geometry); an imported mesh is already finished geometry. So for a mesh object the
  stroke modes build an ALTERNATIVE form from its Quiver SVG (the "convert the SVG to
  the engine form" path). Definitive: there is no "extrude the existing mesh" op.

### Axis 2 — 3D STYLE / SURFACE (how the form is DRESSED)
`Native · Hatch · SVG-port`. Applies to whatever form is active.
- **`AI mesh` form's default style = Native** (the mesh was generated as a material 3D
  object → Native IS its look).
- **Native / Hatch / SVG-port all work on the GLB** (done today): native = lit material;
  hatch = screen-space; **svg-port = the drawing engraved as light lines on the dark form**.
- For stroke forms these map to the existing `style3d` (native/hatch/svg-port).
- For the AI-mesh form these map to `aiMeshMaterialMode` (greyscale default + native /
  hatch / svg-port[engraved] / og-pbr).

## STATUS (2026-06-27 — live-verified on /desk?test=suzanne + the default wall)

- ✅ **1. Unify the modal** — `Canvas3DChrome` now serves BOTH mesh + stroke
  objects; the "Look" dropdown + `AiMeshControlsEdit` are deleted. Live: a mesh
  object's modal shows GEOMETRY + SURFACE, no Look; a stroke object shows
  GEOMETRY + 3D STYLE with NO `AI mesh` option (regression-clean).
- ✅ **2. AI-mesh as a FORM** — `GeometryModeSetting` gained `'ai-mesh'`; the
  geometry dropdown shows it when a GLB exists, defaults to it for a mesh, and the
  render gate shows the GLB for `ai-mesh`/`auto`, the stroke-built form (from the
  Quiver SVG) for an explicit stroke mode. Live: switching a turntable mesh →
  Extrude rebuilt the form from its drawing; the FORM choice persists.
- ✅ **3. svg-port carries the 2D style** — the Engraved surface reads the styled
  markup; live the turntable engraved correctly (dark form + light incised lines).
- ✅ **4. Cut-off panel** — the modal control column FILLS the panel now (was
  capped to the short card → ~311px crammed below the fold). Live: 0 hidden
  overflow in 2D + 3D; the full restyle set is visible.
- ⏳ **5. Text → SVG** — the last leg; own build (below). Not started.

## WORK ITEMS (in order)

1. **Unify the modal** — kill the "Look" dropdown + the mesh-only `AiMeshControlsEdit`
   special-case. Mesh + non-mesh both render the SAME control: a GEOMETRY dropdown
   (incl. `AI mesh` when present) + a 3D STYLE dropdown (Native/Hatch/SVG-port) + the
   per-style sub-controls. (Likely: extend `Canvas3DChrome` to handle the mesh case and
   use it for both, instead of two branches.)

2. **Wire AI-mesh as a FORM** — add `ai-mesh` to the geometry-mode selector (only when a
   GLB exists). Render gating: show the GLB when geometry === `ai-mesh`; show the
   stroke-built form (from the Quiver SVG) for the other modes — even when a GLB exists.
   The 3D STYLE drives the active form's surface (mesh → aiMeshMaterialMode; strokes →
   style3d).

3. **svg-port "done like asked"** — the mesh engraving must CARRY THE 2D STYLE (rough /
   charcoal / stipple / wet-ink / etc.), not just plain line work. Rasterize the STYLED
   markup (the `svgPortMarkup` that already goes through SvgStyleTransform) as the
   engraving source, rendered light-on-dark, so the style reads on the form. (Today it
   rasterizes plain strokes → one flat treatment. That's the gap.)

4. **Fix the cut-off 2D property panel** — the modal's 2D controls render incomplete /
   clipped; the full restyle set must show.

5. **Text → SVG pipeline (the missing leg)** — today text→3D goes straight to Suzanne's
   text-to-3D (mesh from a prompt), with NO 2D step. Quiver is image→SVG only, so text
   has no Quiver SVG → can't drive geometry modes or 2D styles. Need a text→SVG step
   (LLM/vector) so a text object gets a drawing → then geometry + styles + mesh all work.
   Own build, last.

## VERIFY
Each item live on `/desk?test=suzanne` (mesh objects) AND a stroke object (the guitar),
edit modal open, every Geometry × 3D STYLE combo rendering correctly; tsc + build green;
no regression on the 4 working surfaces.
