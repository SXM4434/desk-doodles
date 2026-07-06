# FIX-SPEC — complex filled SVG → 3D (the rose bird's-nest) [READY TO IMPLEMENT]

Source: read-only fix-spec agent (ae92f4fbb425716a7), verified against HEAD `ce30289`. No code edited yet.

## Root cause (verified)
The rose is ONE compound filled `<path>` — **112 subpaths**, `fill-rule:evenodd`, **fill inherited from `<g fill="#000">`**.
The upload→3D bridge treats it as line centerlines:
1. `svgMarkupToStrokes` (`src/app/lib/svgToStrokes.ts:153`) → `sampleElement` (`:81`) calls `getTotalLength()`/
   `getPointAtLength()` on the WHOLE compound path → the browser parameterizes all 112 subpaths as one arc length →
   **one 600-pt tangled polyline jumping between 112 disjoint loops** (fill/fill-rule ignored).
2. `DeskDoodlesCanvas.tsx:347-354,701` feeds it to `Stroke3DScene` with defaults `geometryMode='auto'`, `style3d='native'`.
3. `Stroke3DScene.tsx:611-649`: native+auto skips the pool-solid branch (`:617` only `solid`/`isSvgPort`) → per-stroke build.
4. `buildStrokeWithParams`→auto (`:417`): first pt (subpath 1) vs last pt (subpath 112) far apart → `closureStateOf`='open'
   → `pickGeometryMode`='rod' → ONE giant TubeGeometry weaving all 112 loops + joint spheres = the bird's-nest.
(Even if Auto picked Extrude, the self-intersecting 112-loop polyline hits the self-intersection guard `strokeTo3d.ts:880` → falls back to Rod.)

## The fix — two coordinated changes (engine already exists)
**Change A — `src/app/lib/svgToStrokes.ts` (load-bearing):** make `svgMarkupToStrokes` subpath-aware + fill-aware.
- For a `<path>` whose **computed** fill (via `getComputedStyle(el).fill`, so it resolves the inherited `<g fill>` —
  this is ALSO the SVG-upload "inherited `<g fill>` dropped" bug) is not none/transparent: **split `d` into subpaths**
  (`splitSubpaths` regex `/[Mm][^Mm]*/g`) and sample EACH as a **CLOSED loop** (reuse `samplePath` from
  `src/app/lib/simplifyToSketch.ts:170-227` — mounts one `<path>` per subpath offscreen, reports `closed` from trailing Z).
  Apply the existing `fitOf` transform (`:68`) per subpath. Honor `MAX_PATH_DATA_CHARS`(64KB)/`MAX_SAMPLE_POINTS`(2048)
  ceilings (also avoids the 19.7M-char rough-dots perf bomb).
- Return ~112 CLOSED loops (not one open polyline) + a `filled`/`isFilledUpload` flag; thread it through
  `DeskDoodlesCanvas` `uploadStrokes` memo (`:347`). Keep non-filled/open-path behavior unchanged.

**Change B — route filled uploads to the existing pool-solid extrude.** `buildPoolSolidGeometry` (`strokeTo3d.ts:1715`)
→ `buildSolidGeometry` (`:1606`) already rasterizes all loops → one binary grid → scanline-fill → marching contours →
**containment-depth even/odd classification (= the rose's fill-rule:evenodd) → ONE watertight beveled mass with real holes.**
- `Stroke3DScene.tsx:617`: broaden to `if (geometryMode==='solid' || isSvgPort || isFilledUpload)` (thread new
  `isFilledUpload` prop from `DeskDoodlesCanvas`). Now a filled rose renders as one extruded silhouette in native/auto/rod/
  extrude/solid — never per-stroke rods. Pass `holes:true` so evenodd interiors subtract (also fixes evenodd-donut flood).
- Prefer the raster over forcing `extrude` (per-stroke, chokes on 112 self-crossing loops). polygon-clipping@0.15.7 is the
  fallback ONLY if grid res (144, cap 200) loses fine petal detail → `polygonClipping.union(loops)` → `buildExtrudeGeometryWithHoles`.

## svg-port relief comes for free
`Stroke3DScene.tsx:617` already forces `buildPoolSolidGeometry` when `isSvgPort` and carves the real `SvgStyleTransform`
render (`svgPortMarkup`, `DeskDoodlesCanvas.tsx:362-367`) as emissive-ink + normal-map relief on the mass's front cap
(`:797+`, grazing key light `:155-181`). Once A+B give it filled loops + a coherent mass, svg-port carves the 2D marks
INTO the extruded silhouette's surface = Sebs's rule (real 3D transform carrying the 2D essence, not a flat plop). The
jagged-rims / near-invisible-carve / `viewBox:Infinity` items are separate svg-port-polish (see FIX-SPECS-remaining).

## Effort ~3–3.5 hr · Flags
1. **Fill detection MUST use `getComputedStyle().fill`** (inherited `<g>` fill) or the rose misclassifies as unfilled → rods.
2. Raster res vs thin petals — escalate to polygon-clipping union if mushy (+1–1.5 hr).
3. Mixed line+fill SVGs need partitioning (filled loops→solid + open strokes→rods); whole-file flag suffices for the rose.

## Files: `svgToStrokes.ts` (A) · `Stroke3DScene.tsx:611-649` (B) · `DeskDoodlesCanvas.tsx:347-354,701` (thread flag) ·
reuse `simplifyToSketch.ts:170-227` · engine present `strokeTo3d.ts:1606-1748`. **VERIFY LIVE: upload rose → 3D → screenshot = coherent solid, not rods.**
