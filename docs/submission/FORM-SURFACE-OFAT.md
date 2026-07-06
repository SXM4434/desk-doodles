# FORM × SURFACE OFAT — the unified 3D control system (R38, 2026-06-27)

Sebs: *"go do a big daddy ofat on it all first then i test."* One-factor-at-a-time
sweep of the newly-unified 3D controls (`Canvas3DChrome` for both mesh + stroke
objects), driven LIVE via the desk-wide dev hooks — the SAME controls + render
path the edit modal uses. Goal: confirm the FORM × SURFACE matrix renders
correctly across the board BEFORE Sebs tests, and catch any breakage the
unification introduced.

## Method
- `tools/ofat-form-surface.mjs` — 32 combos across 2 desks, headed Chrome:
  - **mesh** (`/desk?test=suzanne`, 5 AI meshes): `ai-mesh` FORM × 5 surfaces
    (greyscale/native/hatch/svg-port/og-pbr) + `extrude·inflate·rod·solid` ×
    `native·hatch·svg-port` (the stroke-built forms, rebuilt from the Quiver SVG).
  - **stroke** (`/desk?demo=rock`, 6 closed doodles): `auto·extrude·inflate·rod·
    solid` × `native·hatch·svg-port` (regression — the pre-unification stroke path).
- Each combo applied via `__dd_canvas3d` (setGeometryMode / setStyle3d /
  setAiMeshMaterialMode), screenshotted, console+page errors captured per combo.
- 6 parallel vision agents judged the 32 shots (bounded reads, one slice each).
- Flagged forms re-rendered in the **edit-modal lens** (`tools/ofat-modal-forms.mjs`,
  orbit-framed, large) — the true user view — to adjudicate the desk-wall verdicts.
- Sub-control regression: `tools/verify-mesh-controls-work.mjs` re-run through the
  restructured chrome.

## Results
- **0 console / page errors across ALL 32 combos** (both desks). No crashes, no
  broken state, no React errors from the unification.
- **All 5 AI-mesh surfaces render correctly** — greyscale (grey value, detail kept),
  native (matte ink material), hatch (cross-hatch), svg-port (engraved: dark form +
  light incised drawing), og-pbr (original photoreal + color, allowed).
- **All geometry FORMs convert + render dimensionally** — extrude/inflate/rod/solid
  rebuild the object from its Quiver SVG (mesh desk) and from the strokes (stroke desk).
- **Stroke objects = regression-clean** — the pre-unification 3D path is unchanged;
  auto/extrude/inflate/rod render fine, no AI-mesh leak.
- **Sub-controls still drive through the new chrome** — material preset (matte→glossy
  pixel-diff 84.79) + hatch grammar (hachure→stipple diff 85.07).

## The desk-wall "FAKE" flags = a camera artifact (adjudicated, NOT bugs)
6 vision agents flagged `rod`/`solid` (mesh) and `solid`/`inflate-native` (stroke) as
"flat 2D, no dimensional form." Re-rendering those in the **modal lens** (orbit-framed,
large — the real user view) disproved it:
- **rod** = thin tubes along each drawn stroke, clearly tilted in 3D. Minimal on a
  concentric-circle drawing (turntable) because the input IS just circles — correct.
- **inflate** = puffy volumetric rings with real shading. Clearly dimensional.
- **solid** = a watertight mass with the drawing engraved + a beveled silhouette.
  Reads dark/heavy (one lit-ink mass) — that's solid-mode *character* on a flat-disc
  drawing, not a defect. `solid + svg-port` is the most readable solid variant.

Root cause of the false flags: the desk-wall sweep view is **small + near-top-down**,
which collapses thin/flat forms to ambiguous silhouettes. The modal (where Sebs
actually edits) is angled + large and reads them correctly. Lesson logged for future
OFATs: judge FORM dimensionality in the modal lens, judge SURFACE in either.

## Honest caveats (mode character, not bugs — flag for Sebs's taste)
- **Solid** on flat/disc-like drawings reads as a dark heavy mass (inherent to "one
  watertight lit-ink mass"). Fine, but heavy — `solid + svg-port` or `+ outline`
  reads best if that's too dark for a given object.
- **Rod** is sparse on drawings that are just outlines/circles (few strokes → few
  tubes). Correct, but minimal — extrude/inflate give more body for those.

## Verdict
The unified FORM × SURFACE control system is **clean across the full 32-combo matrix**
— 0 errors, every surface + every form rendering correctly in the true lens, sub-
controls intact, stroke objects regression-free. Ready for Sebs to test.

Artifacts: `/tmp/ofat-fs/` (32 sweep shots + manifest.json), `/tmp/ofat-modal-forms/`
(modal-lens adjudication), `datasets/form-surface-ofat.jsonl` (32 reconciled verdicts).
