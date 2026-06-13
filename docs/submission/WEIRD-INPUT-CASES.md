# Weird / arbitrary-input test cases (Sebs live edge-case testing, 2026-06-13)

Per [[project_desk_doodles_generalizes_to_arbitrary_drawings]] — the audit loop must
include NOVEL/weird drawings, not just the 197 catalog. Cases Sebs surfaced by
drawing arbitrary things to "see what breaks":

## CASE-1: multi-feature face (disconnected strokes) → 3D Solid splits into separate puffy pieces
- **Drawing (2D):** a cat/creature face — 2 triangle ears, 2 eyes (circles w/ detail), a nose, a smile. Disconnected strokes.
- **2D render:** fine (clean line drawing in rough-handdrawn).
- **3D Solid:** each disconnected region becomes its OWN inflated/solid blob (ears, eyes, nose, smile all separate puffy pieces) — NOT a unified form. Because pool-raster makes one mass per connected contour; disconnected features → separate masses.
- **Evaluate in the 3D rework + audit:** is "each feature its own solid" intended, or should the form unify / bas-relief carry the features as relief on a single body? The bas-relief approach (drawing→surface) would render the whole face on one form; the per-stroke solid gives separate 3D pieces. DECISION pending in the 3D rework (lean: bas-relief unifies; keep per-stroke solid as a mode).
- **The methodology Sebs wants:** draw weird/varied/made-up inputs, observe what breaks, one object/one toggle at a time vs Clean (2D) / vs Clean + the 2D style for svg-port (3D), loop a few times till air-tight.

## CASE-2: RE-DRAW shows original strokes zoomed/cropped (not fit to canvas)
- **Repro:** open a placed doodle → RE-DRAW ("your original strokes, editable"). The loaded source strokes render at the wrong scale — zoomed in + overflowing/cropped by the re-draw canvas, instead of fit to the frame.
- **Root area:** the re-draw/reopen path (ObjectSurface → DrawSurface loading source strokes) doesn't fit the strokes' bbox to the edit canvas viewBox (same class as the upload-oversize fit the DrawSurface lane fixed, but for re-draw strokes).
- **Fix:** scale/translate the loaded strokes to fit the re-draw canvas (fit-to-frame), like the upload path. VERIFY: re-draw a multi-stroke doodle → strokes appear whole + centered, editable.

## CASE-3: elongated drawing shifts out of view on SKETCH→STYLE flip
- **Repro:** draw a LONG object (e.g. a big arrow spanning the canvas) in SKETCH/INK → flip to STYLE. The styled render is SHIFTED/offset (up-left) and the far end (arrowhead) is cropped out of the frame — doesn't align with the sketch.
- **Root area:** SvgStyleTransform styled-render viewBox/transform doesn't match the sketch's framing for elongated / edge-positioned content (sibling of the RC-4 3D-elongated-framing class, but on the 2D style path).
- **Fix:** the styled SVG must share the sketch's viewBox/extent so the transform aligns (no shift/crop) regardless of stroke extent or position. VERIFY: draw a canvas-spanning arrow → STYLE keeps it whole + aligned.
- Sebs: "the type of stuff to test for — just an example."
