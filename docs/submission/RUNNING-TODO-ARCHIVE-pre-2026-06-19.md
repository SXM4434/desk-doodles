# RUNNING TODO — everything Sebs has asked for (single source of truth)

**Rule (Sebs 2026-06-13, emphatic): capture EVERY ask the moment it's said; mark 🟢 DONE as finished so nothing drops.**
Status: 🔴 open · 🟡 in progress (owner) · 🟢 done · 🔵 design-decision → main chat first.
_Last full comb: 2026-06-13 (whole session + summary + memories + round plan + docs)._

---

## 🆕 R11 (2026-06-16, Sebs LIVE) — CONVERSION FILTERS REWORK: 3 SEPARATE filters + 3D material modes
**Core principle (Sebs): three inputs, three DIFFERENT filters — don't conflate them.**
- 🟡 **Filter 1 — Raster image → Quiver (image→SVG):** Quiver IS the filter (image sent TO it). Take Quiver's
  output AS-IS by default — "don't fuck up what it gives." imageToSvg default now `sketchify:false` (DONE). Quiver
  returns FILLED tonal regions → our Smart Hachure **shading applies at render** = the differentiator (filled/shading
  is FOR Quiver photos). OPTIONAL: run the match-us filter on the side IF the output needs nudging into our register
  (keeps fills, never hollows). Quiver API has no style prompt/reference — levers = model(arrow-1.1)/target_size/crop.
- 🟢 **Filter 2 — Vector .svg upload (rose) → match-us simplify:** clean line-art into our register, **simplified
  DOWN more** (Sebs picked **L1 ≈ 7 strokes**, "the second looks good"). Stays FILLED, NEVER stroke-outlined (the
  hollow bug = old `outlineFills:true`, killed). **DON'T apply our fill/shading (Smart Hachure)** to rose/svg-uploads —
  they're line-art, no tonal regions; shading is Quiver-only. → bake L1 strength + add subpath-drop to the filter.
- 🟡 **Filter 3 — Raster image → 3D mesh (fal/TRELLIS):** wait for the model, keep its GEOMETRY untouched, re-skin to
  OUR material so it fits the desk. NOT uniform ink-black (= black blob, R10 problem). Use **GREYSCALE** — value carries
  detail, different parts = different shades (our 2D-shading logic) — but **DARKER overall: blackish w/ darker grey
  variation** (neutral greyscale too light). Pass `style` param where supported (Tripo).
- 🔴 **3D material MODE toggle = a 3rd toggle set** (Sebs): AI-mesh objects get their OWN toggles — keep **OG PBR**
  (provider photoreal) OR **our native** greyscale/ink, each WITH sub-toggles. (Native local-geometry presets = set 1;
  svg-port = set 2; AI-mesh = set 3.)
- 🔴 **Save the SVG for EVERY 3D object** (Sebs) — persist the 2D SVG source when an object goes 3D (flip-back / regen).
**RESOLUTIONS (Sebs live, 2026-06-16 pm):**
- **Rose / SVG-upload = TWO modes via a "simplify SVG" user toggle:** (a) **FILLED** = keep filled line-art,
  simplified (drop only tiny creases, keep all major strokes, NO outlining, NO missing areas — rose-filled.png A/B/C);
  (b) **LINE** = **CENTERLINE trace** (Zhang-Suen skeleton → true single lines, no fill, no outline, no solid) then
  simplify to ~L3-minimal + hand-feel restyle. Centerline = THE fix for "no fill but don't outline the strokes"
  (rose-centerline.png proved it). DON'T apply Smart-Hachure fill/shading to svg-uploads (line-art) — shading is
  Quiver-only.
- **Quiver = arrow-1.1-max @768** (fidelity winner — keeps D-pad/buttons/text; arrow-1.1 + max@512 over-abstract to a
  blob). Take output AS-IS (imageToSvg sketchify:false DONE) but **convert COLOR → our greyscale/ink register** (map
  every fill to its value, no hue — Sebs: "why is it in color, ugly"). Keep filled → Smart Hachure shades dark areas.
- **3D AI mesh = DARK greyscale** (value carries detail, blackish overall — gameboy-dark.png). Sebs pick PENDING
  (~0.40 "DARKER" = my rec). NOT uniform ink-black.
- **Phone-viewable deliverables:** 2-cell or 2×2 grids only (wide 4-cell rows get cropped on his phone).
**PENDING SEBS PICKS:** rose toggle direction (FILLED vs LINE) confirm · rose strength (A/B/C) · 3D darkness level ·
greyscale neutral-vs-warm.
**BUILD ITEMS (after picks):** ① bake rose simplify (filled-simplify + centerline LINE mode) + "simplify SVG" toggle ·
② Quiver→greyscale conversion + model→max@768 in imageToSvg · ③ AI-mesh material MODE toggle (OG PBR vs native
greyscale, 3rd toggle set) · ④ re-skin HardMesh to dark-greyscale + edges · ⑤ save SVG for every 3D object.
Deliverables sent: rose-matchus · rose-ladder · rose-filled · rose-centerline · rose-options · gameboy-3d-final ·
gameboy-grey · gameboy-dark · quiver-ours. NOTHING committed.

### R11-cont (2026-06-16 pm) — IMAGE PIPELINE findings + what's CODED vs TODO
**CODED + tsc-clean (NOT committed):**
- imageToSvg: Quiver model = **arrow-1.1-max @1024** (fidelity winner; A/arrow-1.1 = blob) · **input downscale to 1280**
  (fixed a real 413 — live upload of an 11MB photo blew Quiver's 12MiB cap) · light cleanup + **Chaikin edge-smooth**
  (chaikinSmooth opt added to simplifyToSketch) · **valueize → dark greyscale** (hue→value, our register).
- **centerline.ts** (new) — Zhang-Suen skeleton → single-line vectorize. The SVG-upload LINE mode engine.
- **svgUpload.applyUploadSimplify(mode)** + defaultSimplifyMode — off/filled/line helper (toggle UI not wired yet).
- **aiMeshMaterial.ts + HardMesh** — AI GLB re-skinned to **dark greyscale (0.18)** by default → fits the desk
  (reachable now via the existing "✨ Generate AI 3D" chip). materialMode prop: 'greyscale'(default)|'og-pbr'.
**KEY FINDINGS (Sebs live):**
- **Quiver gives FILLED regions, NO real outlines** (only ~7 thin colored strokes). Our SVGs always have outlines →
  **WE add ink outlines to every region** (all shape types, not just <path>). PROVEN in harness, NOT yet in pipeline code.
- **lines (stroke) ≠ fill (region hachure)** in our system. rough-handdrawn blobbed because **fillStyle:'hachure' fills
  the regions densely**, burying the lines. **fillStyle:'none' → clean hand-drawn line Game Boy** (proven). So: images
  default to clean fill (none/light), fill is the toggle ("what if we want fill?" → solid/light-hachure gives lines+fill).
- **Dark-everything fills → rough hachures solid.** For the sketch look fills need a value RANGE (light→dark), not crushed.
**NOW BAKED into imageToSvg (tsc-clean, NOT committed):**
- 🟢 **STRIP <text> labels** — they were `<text>` elements; font-size lived in a `<style>` block our sanitizer forbids →
  fell back to huge default. Stripping them fixes the giant START/SELECT/PHONE/VOLUME letters. (toLineArt)
- 🟢 **Outline-adding** — ink outline on EVERY region (all shape types) + ink-ify Quiver's faint colored edge strokes
  (killed the purple line). Our line-art register. (toLineArt)
- 🟢 **Background removal** — `dropBackgroundRegions`: strips the full-frame traced photo/screenshot background (bbox
  touches all 4 edges, ≥85% coverage), keeps the object. Conservative (only when ≥2 object shapes remain). VALIDATED
  (bg-removal.png). The og transparent PNG was already clean; this protects photo/screenshot uploads.
- Full image pipeline now: Quiver max@1024 → downscale(413 fix) → cleanup+chaikin → dropBackground → valueize(dark) →
  toLineArt(strip text + outlines) → sanitize. Produces the clean lines+fill Game Boy live.
**STILL TODO ("the other stuff", NOT built):**
- 🔴 **Image render default = clean fill** (DESIGN call): smart-pick chooses rough-handdrawn + DENSE cross-hatch for the
  image → blob. Lines+fill works in Clean; rough+fill cross-hatches solid regardless of fillStyle. Need: images default
  to a clean fill (none/light/solid), fill as a dial. Smart-pick behavior for image-class input → main chat.
- 🔴 **SVG simplify-mode toggle UI** (off/filled/line) — libs ready (applyUploadSimplify + centerline.ts), needs the
  DrawSurface + DrawPanel UI + handler branch.
- 🔴 **AI-mesh material MODE toggle** (og-pbr vs greyscale) in Canvas3DChrome.
- 🔴 **Save 3D config** in renderConfig on publish (svg already persisted).
- 🟡 Add a few Quiver-traced photos to the OFAT/smart-layer dataset later (no training needed — deterministic pipeline).

## 🆕 R10o (2026-06-16 NIGHT, autonomous — overnight scope DONE) — see SESSION-HANDOFF R10o for detail

- 🟢 **#6 AI-mesh chip — render VERIFIED + no-blank-well fix.** Empty-well was capture-timing (GLB still streaming). HardMesh
  renders the GLB in the modal (proof `/tmp/dd-shots/forcemesh-well.png`). Stroke3DScene now falls back to the LOCAL form
  while the GLB streams (extracted `localForm`) → no blank well. 3D regression: 5 demo objects clean, 0 errors.
- 🟢 **Image upload — LIVE end-to-end, BOTH surfaces + 3D.** PNG/JPG → Quiver Edge trace → simplifyToSketch → our SVG
  register → restyles + flips to 3D. Wired DrawSurface (/canvas) + DrawPanel (/desk), removed both "coming soon" gates,
  busy "Tracing…" copy, mode-aware accept, `isUploadInput` across DrawPanel. Verified: /canvas image, /desk image,
  /desk image→3D, /desk SVG (rose, regression-free).
- 🟢 **SVG-upload simplify now in DrawPanel too** (was only DrawSurface) — Sebs "simplify the svg they upload to our clean style."
- 🟢 **Edge-fn cache-write — CODED (was deferred), needs Sebs redeploy.** hardPath.ts passes contentHash on result;
  image-to-3d writeCache() upserts mesh_cache after rehost → repeat gens free once `supabase functions deploy image-to-3d`
  runs (+ mesh_cache table). NOT verified by me (can't deploy/write from here).
- 🟢 tsc clean · production build green (1276 modules) · catalog 197/411 (2D pipeline untouched). Nothing committed.
- 🔴 **Sebs-side next:** deploy cache-write · test Quiver on a REAL photo · final polish (🔵 decisions → main chat) · Make sync · submission.

---

## 🆕 R10 (2026-06-15) — 3D QUALITY + pressure + card export (Sebs eyes-on, video-confirmed)

- 🔵🔴 **3D models render as featureless BLACK BLOBS — detail can barely be seen** (Sebs, video `style/…10.57.51 PM.mov` + homepage screenshot; "happens on drawing too", not rose-specific). Diagnosed (frames `/tmp/rosevid2/`): THREE compounding causes —
  1. **Black "Ink" material + no albedo contrast** → on a 3D form you only see the silhouette + faint speculars; interior relief is invisible, worst at homepage size. (lighting rig is already rich — key/rim/fill/Env — so it's the black-on-black readability, not missing lights.)
  2. **Extrude/Solid FUSE line-art into a solid slab** → bloom becomes a blob (detail lost). Rod (thin tubes) + Inflate (petal swirls survive, frame f_042) read MUCH better for line drawings.
     - 🔵 **OFAT-LATER (Sebs 2026-06-15 — "I still want those fix"):** Extrude & Solid must ALSO be improved so they don't blob line-art (e.g. carve the line relief into the slab front face / svg-port-style, or per-stroke extrude that keeps gaps). The Auto fix only AVOIDS them for line-art; the modes themselves still need a fidelity pass when explicitly picked. Capture in the 3D OFAT.
  3. **`MAX_STROKES_3D = 60` cap** (Stroke3DScene.tsx:374) drops 52 of the rose's 112 strokes → half the detail gone before render.
  → DESIGN FORK (Sebs's eye, brand-sensitive ink-black): how should line-art read in 3D? (a) edge/contour outline pass on the form (toon-ink lines pop), (b) prefer detail-preserving geometry (Auto→Rod/Inflate for line-heavy), (c) carve marks as lit grooves (svg-port relief), (d) lighter/2-tone material so shading reads. Likely (a)+(b)+raise cap. **Recommend: ship raise-cap + Auto-prefers-Rod/Inflate-for-line-art + an edge/rim emphasis; hold lighter-material for Sebs.**
- 🔴 **Pressure toggle (Inflate) does nothing** — ROOT-CAUSED (strokeTo3d.ts:1067 `if (pressures && influence>0) r *= 1+influence*2*(p-0.5)`). Mouse/trackpad = constant pressure, SVG-converted = none → `(p-0.5)=0` → ×1 → no effect. Confirmed it's every non-stylus input ("happens on drawing too"). FIX: synthesize pseudo-pressure (velocity/curvature taper) when no real pressure channel, so the slider modulates something; OR relabel/disable when no pressure. Recommend synth-pressure (keeps the slider meaningful on the rose + mouse).
- 🟢 **Card PNG = Pokémon-style card WITH INFO — DONE + verified** (`exportPokemonCardPng` in `lib/exportCard.ts`, wired into ObjectSurface Export ▾ → Card). Double ink frame on warm paper, name + stroke count header, framed art window, species banner (style + 3D mode), stat block (Style/3D mode/Strokes/Made), Desk Doodles + @handle footer. Self-contained SVG → PNG. Proof `/tmp/dd-shots/card-render.png`. tsc clean.
- 🔵🟡 **3D "black blob" — research DONE, plan saved, partial impl shipped.** Full validated plan in `docs/submission/FIX-SPEC-3d-engraving-matrix.md` (research wf wf_49307b52-80b). KEY: the engraving pipeline ALREADY EXISTS (svg-port emissive+normal+displacement carve) but is DEAD on the homepage — the static mount never threads `svgPortMarkup`. Plan = A1 thread markup+hatch (unblock) → A2 deepen carve constants → Part B 13 distinct no-repeat configs (Game Boy→engraved, etc.). SHIPPED already: Auto→Inflate line-art routing, fresnel rim glow, stroke cap 60→220, edge lines on. PENDING: A1/A2/Part B (4 files; confirm static-vs-shared mount path first).

---

## 🆕 R9-3D (2026-06-14 pm, autonomous-while-Sebs-out) — FLIP-ALL real fix + SVG→3D (tsc+HMR clean on :5182, NOT committed)

**The rebuild Sebs confirmed (the cap-at-10 was "cheap, looks stupid"):** ONE shared WebGL canvas per surface, N scissored viewports (drei `<View>`) — removes the ~16-context limit so EVERY object flips to 3D at once, no cap, each rotatable. + Sebs's N64 streaming (load-near / unload-far by viewport+margin, drei auto-culls off-screen) so no lag. Make-safe (drei verified in Make; per-page canvas + eventSource ref dodges the #1053 react-router bug).

- 🟢 **Foundation**: extracted `Stroke3DContents` (scene internals usable in `<Canvas>` AND `<View>`); built `MultiStroke3D` = `Shared3DCanvas` + `Object3DView`; lazy wrappers `Shared3DOverlay` + `LiveObject3DSlot` in DeskObject3DMount.
- 🟢 **Drawer + Shelf** wired (one shared canvas over the grid; `LiveObject3DSlot` per card).
- 🟢 **Desk** wired (shared overlay over the viewport; **cap removed**, viewport+margin streaming via `threeDIds`).
- 🟢 **SVG → 3D** in the Add-a-doodle modal (Upload SVG now flips to a 3D preview/tune, same `svgMarkupToStrokes` derivation as the desk flip).
- 🟢 Add-a-doodle modal 2D/3D toggle (compose stage) + naming-stage toggle REMOVED (Sebs).
- 🟢 **Export menu COMPLETE + verified** — ObjectSurface "Share" row now has Export SVG · Export PNG (card) · **Export 3D (.glb)**. New `lib/exportGlb.ts` (lazy, buildPoolSolidGeometry → GLTFExporter). END-TO-END VERIFIED via real-browser download: open object → Export 3D → valid 126KB `.glb` (magic `glTF`). (Nuance: SVG/PNG export the CARD frame; a raw-doodle-SVG option is a possible add.)
- 🟢 **Flip-all PROVEN via real Chrome capture** (headed Chrome = real GPU): desk 20+ objects + drawer 6, ONE shared canvas, no crash, transparent, bounds-fixed (no UI overlap), panel-aware (open+collapsed). Screenshots/video sent to Sebs.
- 🟡 **ROTATION — untestable from automation** (synthetic drags don't trigger 3D controls; even desk-pan doesn't respond to synthetic drag; real-mouse path gated behind Ghostty Accessibility permission). Bound each view's controls to its slot as the likely fix. NEEDS Sebs's real-mouse test OR Ghostty Accessibility grant → then `node /tmp/dd-cliclick-rotate.mjs` films it.
- 🔴 **NEEDS SEBS EYES:** rotate works per object (above) · **Figma Make published-URL test**.
- 🔵 **Reusable:** headed-Chrome puppeteer-core capture (real WebGL) — scripts in /tmp/dd-capture-*.mjs, /tmp/dd-glb-verify.mjs.
- 🟢 **Export raw-SVG split**: Export ▾ menu now Card (PNG, framed) · Doodle (SVG, raw/transparent/no-frame, `exportDoodleSvg`) · 3D (GLB). All 3 = Sebs's intent. Verified.
- 🟢 **Export consolidated to ONE `Export ▾` menu** (was 3 buttons = clutter) — footer now Delete · Export ▾ · Save. Verified (menu opens, each format exports).
- 🟢 **Dead naming-stage 3D code removed** from DrawPanel.
- 🟢🔴 **CAUGHT + FIXED a MAKE-BREAKING bug:** `regionFill.ts` imported polygon-clipping as `* as` but the lib only `export`s a `default` → `polygonClipping.union/.difference` UNDEFINED in the prod/rollup build (esbuild dev-interop masked it) → **fill would crash in Figma Make**. Fixed: resolve runtime via `.default` (`pc.*`), keep namespace for types. **Production build now clean** (warning gone, ✓ 2.4s). Was only catchable via `npm run build`, not `tsc`/dev.
- 🟢 **Production build PASSES** + lazy chunks correct (MultiStroke3D 10kB, exportGlb 36kB split out — three/drei stay out of the main load). KNOWN-SOLUTIONS §5 written (this session's implemented solutions).

## 🆕 BROKEN-MAP — ACCURATE STATUS (2026-06-14 eve, code-inspected + 1 live fixture; handoff broken-map was STALE)
Built a reusable harness: `/tmp/dd-svg-render-check.mjs` (upload an SVG via Add-Doodle → stage → report smart-hachure fill-mark count + max path length + screenshot). Fixture `/tmp/dd-fixtures/gfill-donut.svg` (a `<g fill>` even-odd donut — tests U1+U3+U4 at once).
- 🟢 **U3 (dots perf-bomb)** — DONE in code (renderRegion.ts:109-119, MAX_DOTS=6000 gap-raise cap). Live: max path 30K, no freeze.
- 🟢 **U5 (pattern/gradient keep-source-fill)** — DONE in code (index.ts:402-407 keepsSourceFill for url()).
- 🟡 **U1 (inherited `<g fill>`)** + 🟡 **U4 (even-odd donut hole)** — code-inspection said OPEN, but LIVE the `<g fill>` even-odd donut renders CORRECTLY (ring hachure-filled = U1 honored; hole preserved = U4 honored). NOT a full audit (ONE fixture, no paired-vs-Clean) — needs Sebs's per-case audit to confirm across cases. Minor nit: a few stray marks crossing the hole.
- ⏭️ **NOT blind-safe (need Sebs's eye, paired-vs-Clean):** any remaining U1/U2/U4 edge cases, svg-port jagged rims, snap D4. These are the arc's render work — do WITH Sebs.
**Net:** the render backlog is SMALLER than the handoff implied; the safe-verifiable render fixes (U3/U5) are done; the rest is per-case visual audit work for the arc.

## 🆕 OFAT SWEEP (2026-06-15, live on :5182, reusable harnesses in /tmp) — mechanical anomaly scan
Built 3 reusable OFAT harnesses (style / fillStyle / upload). Mechanical = flags gross failures (errors/empty/perf), NOT visual-correctness (that's Sebs's paired-vs-Clean eye). Findings:
- 🟢🔴 **SVG-STYLE sweep** (197 shapes × 11 styles): 10/11 clean (197/197 content, 0 empty, 0 console errors). **FOUND + FIXED a real perf-bomb**: Stipple emitted a 10.4M-char dots `<path>` (tab-freeze). Root cause (diagnosed live): the extra dots LAYER (`tonal-layer-1`) rebuilt at the original tiny gap — I'd raised `density.gap` but not `fillOpts.hachureGap`. Fix in `renderRegion.ts` (propagate raised gap to layers + max-path backstop). Re-verified: 10.4M → 298K (bounded at the 300K ceiling).
- 🟢 **fillStyle sweep** (Bold-ink base × 8 fillStyles): ALL clean. dots = 295K (bounded — the fix holds at the fillStyle level, not just Stipple). none/solid/hachure/cross-hatch/dots/zigzag/dashed/zigzag-line all 197/197, 0 empty, 0 errors.
- 🟢 **upload-SVG sweep** (U1/U4 edge fixtures): g-fill donut, plain donut, **nested `<g><g>`**, multi-shape — ALL render fill (inherited `<g fill>` honored; donut hole kept). inherited-stroke correctly 0 marks (fill:none). So U1/U4 (FIX-SPEC said broken) render correctly for these cases. ⚠ pattern-fill had ONE flaky "no-dialog" capture → recheck. NOT visual-correctness verified.
- Harnesses (reusable for the arc): `/tmp/dd-ofat-styles.mjs`, `/tmp/dd-ofat-fillstyle.mjs`, `/tmp/dd-svg-render-check.mjs` (+ fixtures in `/tmp/dd-fixtures/`).
**Net:** the 2D render pipeline (style × fillStyle) + upload path are mechanically HEALTHY; 1 real perf-bomb found+fixed. Remaining render work = per-case VISUAL correctness (paired-vs-Clean, with Sebs) + the 3D toggle axis + complex real-world SVGs.

## 🆕 COMPLEX-SVG OFAT (2026-06-15, the online-svgs corpus + rose + torture, live :5182)
Swept 18 real-world SVGs (icons, complex filled compound paths, donuts, multi-disjoint, patterns/gradients, the rose, an edge-torture file) through the upload→smart-hachure path. This is the "complex-SVG" coverage the QUARANTINE gate names. Findings:
- 🟢🔴 **2nd perf-bomb found + FIXED:** the **rose** emitted a **1.1M-char HACHURE path** (not dots — the bomb class is broader). Generalized the renderRegion backstop to ALL gap-dependent grammars (dots/hachure/cross-hatch/zigzag/dashed), not just dots. Re-verified rose 1.1M → 253K (bounded). solid/none excluded (gap-independent, already bounded).
- 🟢 **CAT fill-drop — FIXED + VERIFIED (2026-06-15, Sebs's explicit ask):** the cat-silhouette uploaded fill-less because its fill is `style="fill:black"` (inline style), not a `fill` ATTR → the old `trustBlack = fillAttr !== null` guard at `signals.ts:284` rejected the computed `rgb(0,0,0)` → darknessL 0 → classified `paper` → no fill (the "weird triangle" was the empty-fill artifact). **Fix:** `extractSignals` now walks the element + up to 10 ancestors for a *declared* fill (own/ancestor inline `style.fill` OR `fill` attr) and trusts black when one exists. Cat now renders as a recognizable filled silhouette (marks 0→1, maxPath 1280→37645, "weird triangle" gone). **Collateral-free, PROVEN:** per-object catalog diff at Bold-ink (fill-heavy style) = **ZERO diffs across all 197** vs OLD HEAD (411 smart-fill marks both); 11-style gross sweep 197/197 content, 0 empty, perf capped. tsc clean.
- 🟡 **DEFAULT-BLACK icon fill — diagnosed, TRIED, REVERTED, SEQUENCED (NOT shipped — was flagged "needs Sebs sign-off"):** simple-icons (github / x-twitter / nintendo: `<svg role="img"><path d=.../></svg>`, NO paint attrs) render solid-black purely by SVG default, so they came up outline-only. Tried a principled heuristic — *trust computed black when NEITHER fill NOR stroke is declared anywhere* (SVG paint spec: that's the only way it's visible). It DID fill the icons **but failed three gates → reverted:** (a) shifts **13 locked-catalog objects** (+44 marks: sketchbooks, pencil-jar, dominoes, LaCroix, friendship-bracelet — visually subtle/benign but touches the locked baseline), (b) **annulus-donut perf 335→213,913** (bounded by the 300K backstop, no crash, but heavy), and **(c) the decider** — the "fixed" knockout icons render **WRONG**: github fills the *cat* solid instead of the *disc-with-cat-hole* because the **open evenodd hole-knockout bug** doesn't subtract the hole. → **Correct sequence: fix evenodd hole-knockout FIRST, THEN re-enable default-black trust** (one-line re-enable; see the NOTE comment in `signals.ts` extractSignals). Evidence: `/tmp/dd-icon-decision/` (paired Clean-vs-Bold cells), `/tmp/dd-shots/og-github.png` vs `github-filled.png`.
- 🟢 Everything else clean: donuts (gear/annulus/x-twitter knockouts), multi-disjoint (card-suits/herringbone), patterns/gradients (0 hachure marks = correct U5 keep-source), the torture file (9 marks, bounded), no other perf-bombs.
**Net:** complex-SVG path healthy + perf-bomb class fully capped (dots + hachure + all gap-dependent). **Cat fill-drop FIXED + proven collateral-free.** Default-black icon fill is correctly BLOCKED behind the evenodd-knockout fix (shipping it now would render knockout logos wrong). Still-empty fixtures confirmed CORRECT keep-source (source-inspected, NOT bugs): skull-and-crossbones = `fill=#FFF`+`stroke=#000` white outline art · color-square-pattern = `<pattern>`+`<use>`+bright colors · typographic-ornament = `fill:none;stroke` line-art. The solid-black icons that DON'T fill yet (github / x-twitter / nintendo / herringbone / annulus-donut) are the ones blocked behind default-black + evenodd.

---

## 🆕 R9 (2026-06-14) — Personal-space IA + UI foundation pass (live on :5183, all tsc-clean, NOT committed)

**🟢 DONE this session:**
- 🟢 Card-click in Drawer/Shelf → **edit mode** (twist toggles → **Save** persists; re-draw + delete) — "do it anywhere"
- 🟢 Draw "Place" flow: **anon = pill toggle** (Show @handle / Anonymous); **dest toggle hidden on the public desk** (public-only there); stash-to-drawer when private
- 🟢 **Per-doodle author field removed** (one @handle, show/anon — no name-per-doodle)
- 🟢 **2D/3D toggle inside the edit modal** (renders the form; controls-switch still pending — see below)
- 🟢 **"Open-ish — treat as closed?" chip removed** from the restyle gallery (was dead/unclickable there)
- 🟢 **Expand always shows Drawer + Shelf** (viewing private is harmless; gate is on PLACING)
- 🟢 **← Back to desk** always appears from Expand (was vanishing on the public board)
- 🟢 Donut fill bug fixed at module level (regionFill multiscale, 28/28)
- 🟡 **Homepage** = warm desk foundation v1 shipped; Sebs: "half-assed, do research" → research agent running, rebuilding hero to SHOW the product (foundation, NOT final polish)

**🔴 QUEUED — new UI asks (this session, all tracked in CLI task list #19–#27):**
- 🔴 **3D controls SWITCH** when flipped to 3D (Canvas3DChrome in modal + gallery, live-driven) — "like how the canvas has"
- 🔴 **Global desk 2D/3D flip** (flip ALL desk objects at once) [Sebs chose this]
- 🔴 **Restyle must persist across pages** (desk/drawer/shelf all read render_config — verify)
- 🔴 **Export model**: Card PNG (pokémon-card) + Doodle SVG + 3D model (GLB), as ONE menu
- 🔴 **Consolidate edit-modal buttons** (overflow cleanup)
- 🔵 **Side-panel private/public model + place-gate** (invariant: a private drawer doodle never goes public; gate on PLACE) — recommendation given, awaiting confirm
- 🔴 **Final UI/UX sweep** + **full visual-system pass = END of build** (this is foundation only)
- 🔴 Verify personal space LIVE with DB on

**🔴 STILL QUEUED — pre-personal-space path to big-daddy (NOT dropped):**
- Drawing-tool features Phases 1–3 · 3D + render fixes (KNOWN-SOLUTIONS) · re-run per-stage OFATs → BIG-DADDY OFAT · write app-wide KNOWN-SOLUTIONS doc to disk

---

## 🚨 R8 NIGHT-2 — CONFIRMED-BROKEN LIVE (Sebs eyes-on 2026-06-14, FURIOUS) + overnight mandate
**Honesty correction:** the "all-197 OFAT 0 BREAK / drawing done" claim was OVERCLAIMED. The replay harness
replays ONE catalog object at a time + sweeps toggles, reading its OWN offscreen renders — it never drew MULTIPLE
shapes, never exercised live fill-region picking, never read the live app. "0 BREAK" = harness didn't crash, NOT
tools work. Calling it "done" violated the live-check law. Fill/snap/redraw are COMMITTED but Sebs reports them
BROKEN live — committed ≠ working.

**Mandate (Sebs 2026-06-14, autonomous overnight):** run however many agents, big-daddy OFAT, research online, fix
EVERYTHING, don't stop till fixed, VERIFY ON THE LIVE APP VISUALLY (screenshots) — no harness-only claims.

- 🔴 **A — FILL region detection fails with MULTIPLE shapes** [Sebs live]. Two ellipses → Shade→Fill → tap inside one →
  doesn't detect the tapped region. LEAD root cause: `extractPoolRegions`/`rasterizePoolLoops` (strokeTo3d.ts ~1563)
  sets grid cell = max(spanX,spanY)/resolution over the UNION bbox of ALL strokes (res cap ~200) → multi-shape interiors
  under-resolved → enclosure missed. Proven fix: per-connected-component extraction at full res, OR analytic containment
  via polygon-clipping@0.15.7 (installed). ← diagnosing in fleet wsxw8mmzu.
- 🔴 **B — 3D GEOMETRY toggles do nothing** [Sebs live]. Inflate PROFILE (Balloon/Cushion/Bead) + Base/Tip radius +
  Pressure + Puff don't change the mesh. Suspect stale memo key OR SVG-port ignores geometry params. ← fleet diagnosing.
- 🔴 **C — Polygon/silhouette STILL jagged on SVG-port 3D** [Sebs live]. 186a1a4 Chaikin smoothing not applied on the
  svg-port path (spiky rims). ← fleet diagnosing.
- 🟡 **Full LIVE feature sweep** (2D + 3D) replacing the lying harness — every tool driven on :5182 + screenshotted. ← fleet.
- 🟡 **Research proven solutions online** (region-fill / polygon cleanup / inflate geometry) — Sebs standing ask. ← fleet.
- ⏭️ **Big-daddy OFAT** = the FINAL cert, runs AFTER fixes land, LIVE-verified this time (contact sheets, vision-safe). **Sebs: must be DONE by morning.**

### R8 NIGHT-2 added asks (Sebs, 2026-06-14, rapid-fire before sleep)
- 🔴 **SVG-PORT 3D RULE (restated):** svg-port in 3D must be an **ACTUAL 3D geometric transformation** — the marks carved/extruded into real relief ON the form, catching light, with depth — **while still capturing the 2D's essence/feel/vibe/look**. NOT a lazy flat line/decal "plopped on top" of a generic solid. → **its OWN dedicated OFAT** verifying: (a) real 3D (relief/depth, not flat), (b) preserves the drawing's essence.
- 🔴 **REDO every toggle OFAT** — 2D + SVG + 3D, properly, LIVE, paired-vs-Clean (the prior pass was the mechanical/garbage one).
- 🟢/🔴 **AUDIT page looks good, /canvas does not** (Sebs eyes-on): the catalog renderer on /audit renders well → the engine works; the **bugs live in the /canvas live draw→convert path**, not the core renderer. Scope fixes there. "that's a problem we need to fix."
- 🔴 **Online-SVG edge corpus** — keep sourcing real online SVGs (varied complexity, like the rose) as edge/gap inputs alongside the 197. Standing.

### Overnight pipeline (honest order — verified, not fake-green)
1. **Fix-fleet** (wjoy4060b, 4 worktree agents) → main loop integrates each diff + **live-verifies on :5182 with before/after screenshots** + commits. fill-region · 2D shading · 3D geometry+rims · rose→3D.
2. **Re-run per-stage OFATs on FIXED code** — live, paired-vs-Clean — incl. the **dedicated svg-port 3D OFAT**.
3. **BIG-DADDY OFAT** — full 197 + gap objects + online-SVG edge set, live, paired-vs-Clean.
- Status doc at morning: *fixed+verified* vs *still open*. No "fixed" claim without a screenshot Sebs can open.

---

## 🐛 DRAWING / FILL / SNAP BUGS (all MAIN LOOP — existing-file, can't worktree: stale-base)
- 🔴 **Fill CLEAN EDGE** — fill bleeds PAST the outline (dirty edges) + ugly white corner-notches on styled fills [imgs 2026-06-13]. ← FIX FIX, next in main loop.
- 🔴 **Fill must be SMOOTH + able to FULLY fill** (small gap OK, no ragged/blobby).
- 🔴 **Fill doesn't fill the WHOLE object** — full-fill reliability.
- 🔴 **Circle draw + snap doesn't fully CLOSE** — closed circle + snap ADDS a gap [img]. (shapeFit/snap weld)
- 🔴 **Select WHAT snaps** — user control over which strokes snap (not forced/auto). 🔵 design+build.
- 🔴 **RE-DRAW strokes CUT OFF / cropped** (not fit to modal) — CASE-2, CONFIRMED broken [img].
- 🔴 **RE-DRAW modal MISSING drawing toggles/tools** — only SKETCH/STYLE + BACK/DONE; no brush/fill/snap/primitives [img].
- 🟡 **Elongated drawing shifts out of view** on SKETCH→STYLE — CASE-3. FIX FOUND (percentage-source → wrapper+inner hosts fill 100%); worktree a2a70592 stale-base → RE-IMPLEMENT on current SvgStyleTransform (main loop).
- 🟢 Place→move→disappears (c6b087e) · SVG upload freeze+truncation (57a0359) · 2D systemic group-transform + riso flood (3ed6924).
- 🔴 **stipple style is a NO-OP on the UPLOAD path** — uploaded-SVG + stipple renders byte-identical to rough-handdrawn (fillStyle:'dots' not pushed into live modifiers on upload; "live render uses raw state, not preset"). Real `project_f3_styles_must_all_be_real` violation. Found by svg-upload OFAT (aaaf91d8). Scope: confirmed on /canvas upload; could not scope /audit. ← MAIN LOOP fix.

## 🐛 3D BUGS
- 🟡 **svg-port 3D** ("all hella broken" → uniform hachure slab, drawing absent) → REBUILT + committed (2c23850): drawing now ON the form, surface-locked, carved (emissive ink + displacement + normal). STRUCTURE fixed. 🔵 CRAFT pending: marks read FAINT — needs bold-carve tuning + Sebs's eye. ← pushing now.
- 🟡 **svg-port RETAIN 2D vibe** AND feel FULLY 3D (carved, not plopped) — STRUCTURAL FIX DONE + committed (ffab74b): svg-port always carves on a single mass cap, so marks show in ALL modes (auto no longer a dark blob — face carved + catches light, live-verified). 🔵 REMAINING = SEBS EYE: jagged-silhouette vs boldness tradeoff (displacement lever) + final boldness — present options in AM.
- 🔴 **svg-port shading svg→3D** (no double-shade/wash of 2D tone) — design resolved (emissive ink + lit relief); verify in tuning.
- 🟢 **Faceted/jagged silhouette rims** ("weird polygon artifacts in different 3d things") → FIXED + committed (186a1a4): corner-aware multi-pass Chaikin on the smoothed contour (circle rim 39.8°→3.8°, square corners pinned/sharp, watertight, 51/51 smoke, tsc, live-verified circle smooth + square sharp). 2D crisp-fill lane untouched.
- 🟢 RC-2 solid buries hand → bas-relief. RC-5 wet-ink/charcoal dead → fixed. Arrow→rod default.
- ⚠️ **UPLOADED-SVG → 3D IS NOT WIRED** (svg-upload OFAT aaaf91d8): /canvas flips to 3D on DRAWN STROKES only; uploads show honest gate "Upload→3D is the hard path — drawn strokes only for now". So the **svg→3D half of the grande-daddy can't run live yet**. 🔵 DECISION (main chat): defer svg→3D to R10 hard-path (credits) vs wire EASY svg→3D now (uploaded paths → strokes → existing strokeTo3d engine, no credits).

## ✨ FEATURES — DRAWING TOOLS (most 🔵 design)
- 🔴 **FULL drawing-tool gambit ON the /canvas (3D) route** (Sebs 2026-06-13) — brush · fill · snap · shade · ALL primitives available in the canvas so you can draw + test the draw tools AND the 3D together in one place. (= "import the drawing tools into the 3D canvas".)
- 🔴🔵 **MORE PRIMITIVES** — more drawing primitives/shapes (said 3×).
- 🔴🔵 **Select different PARTS of a drawing** — pick/edit any region/stroke, not just last-drawn.
- 🔴🔵 **Mode-switching UX is annoying** — rework the 2D/3D + input switch flow.
- 🔴 **Shading input** — tone-fill / shade-brush (discrete bands) feeding I-2 source-darkness.

## ✨ FEATURES — CARD / SHARING / SPACE
- 🟢 **Card export → SVG + PNG** on the card detail modal — DONE (7f4345c).
- 🟢 **Optional AUTHOR-NAME field** (naming stage + card, skippable) — DONE (7f4345c).
- 🟡 **Personal space MVP** — private desk (owner_id) + per-person drawer + onboarding handle (Keep/Reroll/Type, anon-auth). Scaffold committed UNWIRED (9338de6). R9: wire DeskPage (+2 type fixes).
- 🔴 **Drawer in BOTH public AND personal** — every person gets a drawer on the PUBLIC desk too. (scaffold did personal-only.)

## ✨ FEATURES — CONVERSION / 3D (R9/R10/R11)
- 🟡 **Image mode** (image→SVG, Quiver best-quality, output SIMPLER hand-drawn sketch). Scaffold committed (470229a); wire DrawPanel + deploy Edge fn (key in Supabase secrets) = R10.
- 🔴 **Hard-3D path** (fal/Tripo image→GLB) — R10, gated on Sebs's credits. ← scaffolding now (new files).
- 🔴 **3D into the desk: 2D↔3D flip + orbit on a PLACED object** (demo climax) — R9.
- 🔴 **3D symmetry-law completeness + polish** — R11.
- 🔴 **ML go-live** (92.7% model wired live) — R10, gated on golden-v3 bless.

## 🧪 TESTING PROTOCOL (Sebs 2026-06-13 — how we test draw tools + 3D)
- 🟡 **Run the 197 audit objects THROUGH the live draw tools** (not just the catalog harness) — render each in-app.
- 🟡 **MANUALLY draw the objects myself by hand** via the draw tools — exercises the draw tools AND the 3D conversion on real hand input.
- 🟡 **Adversarial break-it** — weird/made-up/degenerate/extreme inputs; toggle extremes.
- 🟡 **Paired-vs-Clean per object, OFAT every toggle LMH, SVG AND 3D**, read by me, never sample-and-claim. + svg-port-vs-2D-style.

### 🏆 THE GRANDE-DADDY OFAT (Sebs 2026-06-14 — the FINAL R8 cert, runs AFTER separate OFATs + all fixes land)
Structure (Sebs, restated): the **full user flow** checked end-to-end once the separate per-stage OFATs are done. **3 OFATs in one grande-daddy**, using the AUDIT catalog objects, **hand-drawn by me through the live tools**:
1. **Manual-draw → 2D check** — hand-draw each audit object via live tools; OFAT every 2D toggle, baseline held, switch ONE thing, **compare to the SVG/Clean** render, paired, read.
2. **Manual-draw → 3D convert → 3D check** — convert each to 3D; OFAT every 3D toggle the same way.
3. **SVG-upload flow** — upload each object's SVG → 2D check → (→ 3D check **blocked: upload→3D not wired**, see 3D BUGS decision).
- METHOD = true OFAT (one object, one toggle, one change vs Clean) at SCALE via **parallel agents, one object each** (`feedback_parallel_agent_verification_and_feed`): parallelism = throughput, each agent = the rigorous paired-with-Clean read. Every result feeds the dataset. NOT fast pixel-triage — that's the per-stage pre-check, this is the eyeball cert.
- DATASET adapters still TODO: `--from-ofat-manualdraw`, `--from-ofat-upload`, `--from-ofat-drawtools` (findings JSONs preserved on disk).

## 🐛 BUG-HUNT FINDINGS (workflow wbtntkavw, 11 agents/3 rounds, 2026-06-14)
- 🟢 **O1 (MED) — 2D→3D flip dropped shade/tone regions** = fill→3D-hollow (Bug 1) → FIXED + committed (2fdfbd8): toneFills threaded into Stroke3DScene, each fill builds a band-grey slab via buildExtrudeGeometryWithHoles. Live-verified macbook (was hollow → now solid tone slab).
- 🟡 **S1 — /playground "3D" toggle is a DEAD control** (button highlights, no canvas mounts, stays 2D). Workflow SAFE-FIXED in worktree (honesty-gate pattern) — HARVEST. `DeskDoodlesPlayground.tsx`.
- 🔴 **U1 (LOW) — personalSpace READ helpers don't gate on isPersonalSpaceDbReady()** — flag-on-before-migrations fires 404/400 on every /desk mount (degrades gracefully, default-OFF clean). `personalSpace.ts` getMyProfile/listMyDrawer. Clean safe fix.
- 🔴 **O5 (LOW) — single dot/tap → zero strokes, no feedback** (TAP_SLOP_PX=6, by-design but silent). Allow dot marks or micro-feedback. `DrawSurface.tsx`.
- 🔴 **O6 (LOW) — off-canvas drag selects UI text** (no `user-select:none` on canvas chrome). `DrawSurface.tsx`/page chrome.
- 🔵 **O3 (LOW) — no responsive/mobile layout** on /canvas + /desk (fixed chrome > viewport at ≤400px). Desktop-first scope gap → SEBS decision: in/out for makeathon?
- 🔵 **O4 (LOW, informational) — OOB `?desk=999/abc/<script>` silently → desk 0** (safe, no XSS). Add not-found state or leave. SEBS decision.
- O2 = svg-port absent@auto = already Bug 2 (don't double-count).

## 🔁 PROCESS / QUALITY (standing)
- 🟡 **THE LOOP** — audit→fix→re-audit, multiple iterations until air-tight (iter-2 fires after fill+redraw+svg-port settle).
- 🟡 **Keep feeding the smart/ML dataset** from every audit/sweep/pick.
- 🟡 **Persist until proven impossible** — never quietly downgrade scope.
- 🟢 **Keep this running doc + auto-fire queue + mark done** — established 2026-06-13.
- 🔴 **Research online for everything** before building — standing.
- 🔴 **Selective brand tagging** (build-in-public: hashtags always, brand tags only kickoff/milestone/demo/submission).

## 📦 SUBMISSION / SHIP (later)
- 🔴 Make checkpoint #2 (Sebs runs; I prep file list) · golden-v3 bless (Sebs eyeball) · identity/own-design pass (R12) · submission assets video/story/posts (R12) · fal+Tripo credits (Sebs).

## 🏠 R9 PERSONAL-SPACE IA + SOCIAL DRAWER (Sebs locked 2026-06-14, DON'T FORGET — full build now, parallel)
**Locked decisions (Sebs via 3 question rounds + "pick the best"):**
- 🔵→🟡 **Scope = FULL personal-space build now** (not shell-only). Build in PARALLEL with core-canvas; must not deflect it.
- 🟡 **Homepage = hub** (DONE): two doors — Public wall (/desk + /desks) + Your space (/your-space) + invitational handle chip. ✅ live-verified `/tmp/dd-ps/20-home-hub.png`.
- 🟡 **Identity = LAZY**: everyone gets a silent session handle; quick-doodlers NEVER forced. Claim moment lives in Your space, NOT a forced /desk overlay. (remove auto-overlay on /desk.)
- 🟡 **Drawer = its own page `/drawer`**, reachable from homepage AND from any desk via an **Expand** button (side panel → full page).
- 🟡 **TWO compartments, named DRAWER + SHELF** (resolves "two drawers is weird"): **Drawer** = private/closed/yours; **Shelf** = public/on-display/others can browse. (metaphor: in the drawer = hidden, on the shelf = visible.)
  - Public-desk doodle → **shelf automatically** (already public). Private-desk doodle → **you choose** (drawer or share to shelf).
- 🟡 **Social: click @handle on a doodle card → mini profile → view their SHELF** (their public doodles). Doodle row already carries owner_id, so no profiles-table dependency for the lookup (public-read RLS returns only their public rows).
- 🟢 Local-handle persistence (getLocalHandle/setLocalHandle) — shipped + verified (chip stays consistent DB-off).
**Build lanes (stale-base law: EDITS=main loop; NEW files=parallel non-worktree agents, file lanes):**
- main loop: personalSpace.ts data layer (listMyShelf/listShelfOf/shareToShelf/publishToPrivateDesk) · routes.tsx · DeskPage (lazy identity + drawer Expand + profile popover on cards) · DrawPanel stash/shelf entry.
- parallel agents (new files): YourSpacePage.tsx · DrawerPage.tsx (Drawer|Shelf tabs) · ProfileShelfPopover.tsx.
- 🔴 needs Sebs DB later: migrations 0001/0003 + an `is_public`/shelf flag + share_to_shelf/publish_to_private_desk RPCs; flip VITE_PERSONAL_SPACE_DB. (UI no-ops gracefully until then.)

## ⚙️ STATUS (2026-06-13) — see PENDING-AUTOFIRE-QUEUE.md for the auto-orchestration
- ALL 5 parallel worktree agents LANDED + merged/committed: card-export ✅ · image-mode ✅ · personal-space ✅ · CASE-3 (re-implement pending, stale-base) · fill (taken to main loop).
- MAIN LOOP now: svg-port craft tuning → fill clean-edge → redraw → snap-close → CASE-3 re-implement.
- FIRING: hard-3D scaffold (worktree, new files).

## 🎯 OFAT REQUIREMENT — 2D shading/tone → 3D transfer (Sebs 2026-06-15)
THE big SVG-port-3D problem to solve DURING or BEFORE the OFATs (not optional):
- 2D has real **shading**: light↔dark **tone bands** (grayscale) via the shade brush + multiple
  **shading STYLES** (hachure, crosshatch, dots, stipple, zigzag, dashed, solid). This is the
  per-region darkness signal (I-2 source-darkness).
- The **SVG-port → 3D path is still hella broken** at carrying that tone: dark areas do NOT read as
  dark in 3D. We need to TRANSFER shading/tone correctly so a 2D dark region shows as dark in 3D.
- TENSION (the design problem to resolve): everything 3D stays **ink-BLACK — value from LIGHT, never
  hue**. But our 2D shading is **grayscale**. So "show dark areas in 3D" can't be done by painting grey.
  Candidate approaches to evaluate (bring options to Sebs): (a) tone→DEPTH/relief (darker = deeper carve
  / more displacement), (b) tone→**hatch DENSITY** as etched light lines (darker = denser etch on the
  black form, matches the R10c etching solution), (c) tone→AO/curvature darkening under lights, (d)
  tone→material roughness. Likely (b)+(a) combined. Must stay ink-black; value from light.
- OFAT must include a DEDICATED svg-port "tone-fidelity" pass: per object, 2D toned render vs its 3D —
  does the dark region read dark? Paired-with-Clean. This gates the big-daddy.

## ✅ UPDATE 2026-06-15 — shading→3D corrected framing + first version shipped
Sebs corrected: NOT "dark doesn't read dark" — it's that the DIFFERENT 2D shading (styles AND tone) has no
way to transfer to 3D; it auto-goes-black. Root cause (shading-research wf): svg-port 3D markup was built
WITHOUT tone (DeskDoodlesCanvas.tsx:372 dropped the `tone` arg) → 3D saw only fill="none" stroke lines →
black. FIXED v1: `strokesToObjectMarkup(strokes3d, tone)` → the svg-port 3D style now WEARS the 2D shading
(luminance→relief+emissive machinery already existed). STILL OPEN: solid/native 3D modes ignore the 2D
drawing by design (always black); carrying shading there = the bigger build (etched marks / tone→density on
the black form). Sebs to glance at svg-port + say if the solid modes need it too.

## ✅ UPDATE 2026-06-16 — stroke TOGGLES now translate to svg-port 3D (Sebs: "multi stroke should show in 3d… many things to translate")
ROOT CAUSE (proven 3 ways — OFAT md5 byte-identical, code, visual): svg-port's crisp incised marks
(`detailLines` in Stroke3DScene.tsx) were built from the RAW strokes, so stroke-PATH toggles
(wobble/jaggedness/simplification/bowing/multiStroke/sketchy/penTip/endpoint) changed the 2D markup but
NEVER reached the 3D marks. Fill/tone toggles already translated (they feed the texture relief).
Two secondary bugs found: the detail-etch sat at z=+0.012 but the displaced svg-port cap peaks at ~+0.03 →
the marks were OCCLUDED by the cap; and the styled marks need scale-1 sampling to register on the form.
FIX (Stroke3DScene.tsx): for svg-port, build `detailLines` from the STYLED markup
(`svgMarkupToStrokes(svgPortMarkup)`), but STRIP the `[data-smart-hachure]` fill/tone groups first (else
the dense hachure inscribes as a white blob = the "scratch mess"); lift the etch z above the cap peak
(proud 0.06 for svg-port, 0.012 native unchanged). Native relief untouched (gated on isSvgPort).
VERIFIED: wobble/jaggedness now produce DISTINCT, readable 3D renders (smooth strokes → rough strokes),
crisp white incised on ink-black form, NOT a blob. Full translation OFAT re-running for the complete matrix
+ catalog-GB regression. Drivers: /tmp/dd-svgport-translate.mjs (matrix), /tmp/dd-fixproof.mjs (before/after).
