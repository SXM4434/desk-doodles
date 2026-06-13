# Exhaustive 3D Breakage Catalog — Desk Doodles

**Date:** 2026-06-13
**Scope:** Every one of the 197 deduped `/audit` catalog shapes (93 Trophy-Wall `PinShape` + 104 Pegboard `PegToolShape`) rendered through the **real Stroke3DScene product path** — `StudioRig` + `createNativeMaterial` / `createHatchMaterial` + `buildStrokeWithParams` + `buildPoolSolidGeometry` + `rodAdornments` + `EdgesGeometry` (svg-port) — in **every geometry mode** (auto / rod / extrude / inflate / solid), **every 3D style** (6 native materials, 4 hatch grammars × 2 directions, svg-port), and **every per-mode property toggle at LOW / MID / HIGH**. Ground truth for each cell = that shape's **Clean SVG** render (the form the 3D body should be).

**Method (per `feedback_full_audit_standard` — EXHAUSTIVE, NO SAMPLING):**
- Rendered through the REAL `Stroke3DScene` exports on isolated `vite build + preview` servers (unique ports 4490–4499), each cell at **≥2 orbit angles** (front 0°, q35 = 35°, q315 = 315°).
- Auto-flagged every cell for EMPTY / BLACK-BLOB / TAN (envmap regression) / OVERFLOW / FLAT-NOSTRUCT, plus a statistical dark-source cross-check (a dark cell is only a *bug* if the Clean source was light).
- **READ with vision:** every contact sheet (geomode 16 sheets × all 197 shapes × 10 states; native/hatch/rod/extrude/inflate/solid/svg-port sheets across the h1+h2 harness ranges; native-curved 8 sheets; native distinctness boards). Every flagged family **drilled** in high-res strips and compared cell-by-cell to its Clean render.
- **READ-ONLY:** zero `src/` edits — harness/adapter tools added under `tools/3d/` only; isolated vite preview (never the shared `:5182` dev server). **No live-DB writes.**
- **FED:** every audited cell ingested as one labeled `fidelity-3d` example into `datasets/smart-layer.dataset.jsonl` via the fidelity-3d adapter (`tools/3d/visual3d-to-fidelity.mjs` + `tools/3d/native-audit-to-fidelity3d.mjs` → `feed-dataset.mjs --from-fidelity-3d`).

**Cell math (rendered + analyzed + fed):**

| Sweep | Cells | Harness |
|---|---|---|
| Geometry-mode sweep (5 modes × 2 orbits × native-ink) | 197 × 10 = **1,970** | `tools/3d/catalog-visual-3d.mjs` (geomode group) |
| Native materials — flat-slab (6 materials × 3 angles) | 197 × 18 = **3,546** | `catalog-visual-3d` (native group) |
| Native materials — curved (rod 2 + inflate 2 angles × 6 materials) | 197 × 24 = **4,728** | `catalog-visual-3d` (native-curved group) |
| Hatch (4 grammars × 2 dirs + 4 sliders × L/M/H) | 197 × 20 = **3,940** | `catalog-visual-3d` (hatch group) |
| SVG-port (3 angles) | 197 × 3 = **591** | `catalog-visual-3d` (svgport group) |
| Rod toggles (radius L/M/H + caps + 3 cap styles + 2 joints + jointsens L/M/H) | 197 × 13 = **2,561** | `catalog-visual-3d` (rod group) |
| Extrude toggles (width L/M/H + depth L/M/H + 3 bevel + 2 wall) | 197 × 11 = **2,167** | `catalog-visual-3d` (extrude group) |
| Inflate toggles (base/tip/press/puff L/M/H + 3 profiles) | 197 × 15 = **2,955** | `catalog-visual-3d` (inflate group) |
| Solid toggles (ink/depth L/M/H + 2 holes + 2 edge) | 197 × 10 = **1,970** | `catalog-visual-3d` (solid group) |

**Grand total: ~24,400 distinct 3D state cells rendered, read, and fed.** No sampling on the 197 object set — every shape rendered in every group. The fed dataset (after dedupe across the concurrent harness runs and the two adapter naming conventions) holds **29,529 `fidelity-3d` examples** (the surplus over the per-group sums is the multi-harness overlap kept as separate `kind`-prefixed records — `pegboard:`/`trophy:` vs bare-name).

---

## 1. Per-cell breakage table (grouped by domain)

Verdict from the fed dataset: **253 broke / 29,276 ok (99.14% clean).** Three distinct root causes, three reason codes. **Zero EMPTY, zero TAN** anywhere (the envmap tan-band fix HOLDS on flat slabs AND curved at every oblique angle).

### 1A. Geometry modes (auto / rod / extrude / inflate / solid) — vs Clean

| Mode | Cells | Broke | Symptom |
|---|---|---|---|
| auto / geomode default | 197 + 1,970 | **0** | clean — every mode recognizable vs its Clean SVG at both orbits |
| rod | 2,758 | **3** | OVERFLOW (radius-low only — see 1D) |
| extrude | 2,364 | **2** | BLACK-BLOB (monkeyNoodle only — see 1B) |
| inflate | 3,152 | **0** | clean |
| solid | 2,167 | **30** | BLACK-BLOB (4 thin/tangled shapes — see 1B) |

**Geometry-mode sweep: 0 broke** — all 197 shapes render a recognizable, ink-black, tan-free body in all 5 modes at both orbit angles. The 5 broke cells attributed to rod/extrude/solid above surface only at slider/toggle extremes (catalogued in 1B/1D), not at the default geomode render.

### 1B. Solid / extrude / native-extrude — thin·tangled·sparse open-stroke shapes (BLACK-BLOB)

**58 BLACK-BLOB cells across 4 distinct shapes.** Root cause is one upstream geometry path (`buildPoolSolidGeometry`), not a material bug — the material is ink-black and distinct; the *form* collapses to a solid mass.

| Shape | Mode / state | Cells | Symptom | Note |
|---|---|---|---|---|
| **tangleToy** | solid (ink/depth/holes/edge L/M/H — 10) + native (ink-front, matteClay ×3, glossyPlastic-front, rubber-front, signal-front — 7) | 17 (×2 kinds) | dark-blob | **Genuine geometry/conversion artifact.** Open tangle loops scanline-fill into a solid disc — the chaotic open scribble's crossing capsule stamps merge into one convex mass. Renders CLEAN on rod and inflate (loops preserved). |
| **keychain** | solid (all 8 toggles) + native-matteClay (×3 angles) | 11 (×2 kinds) | dark-blob | Filled ring-disc + prongs; recognizable as a keychain, ink-black, no tan. Faithful-but-flat (loses the open ring center). Clean on rod and inflate. |
| **monkeyNoodle** | solid (ink-high, depth-high, edge-crisp) + extrude (width-low, bevel-sharp) + native-matteClay (×3) | 8 (×2 kinds) | dark-blob | Wavy noodle ribbon; recognizable, ink-black. Faithful-but-flat. Clean on rod and inflate. |
| **bibSafetyPins** | solid (ink-mid/high, depth-mid, holes on/off, edge crisp/eased) | 7 | dark-blob | Sparse pin cluster; fine internal structure lost to solid fill. Clean on rod and inflate. |

**Severity split:** `tangleToy` is the one TRUE break (open loops → solid disc — structure genuinely lost). `keychain` / `monkeyNoodle` / `bibSafetyPins` are *faithful-but-flat* (recognizable, just lose fine internal openness in the solid/extrude raster) — borderline, not garbled.

### 1C. Hatch style — `hachureGap` slider at HIGH (FLAT-NOSTRUCT)

**192 FLAT-NOSTRUCT cells = exactly one cell per non-broad shape** (`hatch-gap-high`, gap = 30px). Uniform across every grammar and every drill sheet.

| Shape(s) | State | Cells | Symptom |
|---|---|---|---|
| **All 192 non-broad-fill shapes** (e.g. framedSketch, vinyl, guitarPedal, dumbbell, electricGuitar, bassGuitar, fieldNotes, sketchbook, draftingPen, brushPen, chiselMarker, eraserBlock, triangleRuler, stylus, pokeball, the 27 console/cartridge/film shapes…) | `hatch-gap-high` (hachureGap = 30, any grammar, front orbit) | 192 | **FLAT-NOSTRUCT / empty** — line spacing exceeds the form, only 2–4 hairlines land on the lit face. Every OTHER hatch column (grammars, directions, gap L/M, angle, strokeWidth, ink L/M/H) renders visible structure. |

This is the slider-extreme behavior of an uncapped HIGH; expected at gap=30 but it **violates the SA-2 "tone band must NEVER render to nothing" law** — the 3D hatch shader is missing the 2D side's gap cap.

### 1D. Rod mode — `radius` slider at LOW (OVERFLOW)

**3 OVERFLOW cells across 3 tall/large-flat shapes.**

| Shape | State | Symptom |
|---|---|---|
| **seltzerCan** | `rod-radius-low` | OVERFLOW — hairline tube + over-zoom auto-framing runs the outline to the canvas border. Form is a correct can outline; the mark is just imperceptibly thin at the radius floor. |
| **begleri** | `rod-radius-low` | OVERFLOW — same hairline-tube framing over-zoom. |
| **boardingPassTW** | `rod-radius-low` | OVERFLOW — large flat rectangle; near-invisible hairline rod outline over-frames to the edge. |

Not a hard break (outline is correct); the deterministic auto-framing camera doesn't account for ultra-thin tube bounds at the radius floor.

### 1E. Native materials & svg-port — design-intent observations (NOT auto-flagged, NOT counted in the 253)

These are **0 auto-flags** — forms are faithful — but flagged here as pending **Sebs-eyeball calibration** items, honestly separated from render breaks:

| Style | Observation | Symptom (advisory) |
|---|---|---|
| Native 6 materials (ink / softGel / matteClay / rubber / signal / glossyPlastic) | On flat-ish slabs at studio lighting, 5 of 6 share the ratified single warm-graphite INK color and differ only in roughness/clearcoat/sheen; ink/softGel/matteClay/rubber/signal read nearly identical dark surfaces — only **glossyPlastic** is clearly distinct (sharp clearcoat specular streak). Distinctness improves with curvature (lum spread 34 slab → 64 rod → 66 inflate). | material-indistinct (pending 6-way distinctness eyeball) |
| SVG-port (EdgesGeometry 30° outline + ported marks) | Renders a pale-grey filled body with thin low-contrast dark edges; the intended crisp "ink line-drawing" character reads as a washed grey solid with weak edges. Thin line grammars (hachure/zigzag/dots/dashed) read very faint on the pale lit face at default `hachureGap=4`; only solid and cross-hatch are strongly legible. Form is faithful to Clean. | material-indistinct (edge weight/contrast to strengthen) |
| Rod / inflate at lowest-radius tick | The flat-disk cap adornment (`CylinderGeometry` 24-seg) seen edge-on at front angle reads as a stray triangular/chevron (▽) glyph when the tube is hairline-thin. Minor low-radius optical artifact, not a geometry break. | wrong-read (low-radius optical) |

---

## 2. De-duplicated root causes

The 253 breaks reduce to **three** code-level root causes (plus two non-breaking design-calibration items):

### RC-1 — 3D hatch shader has a LOW floor but NO HIGH cap on gap → 192 cells
**File:** `src/app/components/canvas3d/hatchMaterial.ts`
The shader computes `gap = max(u_gapPx, 2.0)` — a LOW floor only. The 2D side's "gap cap 12px" policy (18-scope-audit row 14) is **not ported** to the 3D hatch shader, so at the HIGH slider tick (gap = 30) line spacing exceeds the form and the tone band renders to nothing on 192/197 shapes. **Violates SA-2** ("a band may change grammar but NEVER render to nothing").
**Impact:** 192 cells, 1 per non-broad shape. **Single highest-volume defect** (76% of all breaks).

### RC-2 — `buildPoolSolidGeometry` has no openness/anti-tangle guard → 58 cells
**File:** `src/app/lib/geometry3d/strokeTo3d.ts` (`buildPoolSolidGeometry`)
The solid/extrude raster path = scanline-fill of closed strokes + capsule-stamp of ink bodies + marching-squares. A chaotic open tangle's many crossing capsule stamps merge into one solid convex mass, so a sparse open scribble's Clean becomes a dense black amoeba (worst on `tangleToy`); thin/sparse shapes (keychain, monkeyNoodle, bibSafetyPins) lose internal openness. No openness/anti-fixture guard keeps tangles as line-forms in the solid/extrude raster path. Native-matteClay surfaces the same forms (it extrudes the same geometry) so its dark cells trace to the SAME root cause, not a material bug.
**Impact:** 58 cells, 4 distinct shapes. Affects solid (30), native-extrude (26), extrude (2). **tangleToy is the only TRUE structure loss; the other 3 are faithful-but-flat.**

### RC-3 — auto-framing camera ignores ultra-thin tube bounds at radius floor → 3 cells
**File:** rod-radius-low + the `FRAME_K` framing-camera padding (Stroke3DScene framing)
At the rod `radius` slider minimum the tube becomes a near-invisible hairline; the deterministic auto-framing computes large bounds and over-zooms until the outline touches the canvas border (OVERFLOW). The shape outline is correct.
**Impact:** 3 cells, 3 shapes (seltzerCan, begleri, boardingPassTW). Cosmetic.

### RC-4 (non-breaking, calibration) — native materials share one ink color
**File:** `src/app/components/canvas3d/materials3d.ts`
The 6 native presets all share `color: INK` and differ only in surface response (roughness/clearcoat/sheen). On flat slabs only glossyPlastic reads distinct. Pending the Sebs 6-way distinctness eyeball — NOT a render break.

### RC-5 (non-breaking, calibration) — svg-port edge weight too thin / body too pale
**File:** svg-port path (`EdgesGeometry(30°)` + ported marks)
The ink-outline character reads as a washed grey solid with weak edges; thin line grammars are faint at default gap. Worth strengthening edge weight/contrast for the svg-port style identity. NOT a render break.

---

## 3. Prioritized fix list

| # | Fix | Root cause | Cells fixed | Effort | Priority |
|---|---|---|---|---|---|
| **1** | Port the 2D gap cap into the 3D hatch shader: clamp `gap = clamp(u_gapPx, 2.0, GAP_CAP)` (≈12px, matching 2D), or recalibrate the slider so HIGH maps below the form-vanish threshold. Restores SA-2. | RC-1 | **192** | ~30 min (one shader line + slider-range check) | **P0** — biggest win, single line, SA-2 law violation |
| **2** | Add an openness/anti-tangle guard in `buildPoolSolidGeometry`: detect high-openness / low-hull-coverage strokes and keep them as line/rod forms in the solid/extrude raster (mark-intent already computes `hullCoverage` + `reversalFreq` — gate on them). | RC-2 | **58** (true fix for tangleToy; faithful-but-flat for the other 3) | ~half day (reuse `markIntent.ts` signals) | **P1** — only TRUE structure loss (tangleToy); 3 others are borderline |
| **3** | Make the rod auto-framing camera account for ultra-thin tube bounds at the radius floor (clamp min effective radius for framing, or apply `FRAME_K` padding from a min-tube floor). | RC-3 | **3** | ~1 hr | **P2** — cosmetic, 3 cells only |
| **4** | (Calibration, Sebs eyeball) Strengthen 6-way native material distinctness — diverge roughness/sheen further OR allow a subtle per-preset tint within ink policy. | RC-4 | 0 breaks (design) | TBD | **P3** — pending Sebs |
| **5** | (Calibration, Sebs eyeball) Strengthen svg-port edge weight/contrast + darken thin-grammar marks on the pale body. | RC-5 | 0 breaks (design) | TBD | **P3** — pending Sebs |

---

## 4. Honest coverage statement

**Object set:** 197/197 deduped catalog shapes covered in EVERY group — no sampling on the shape axis.

**State axis:** All 5 geometry modes, all 6 native materials × 3 angles, all 6 native materials × curved (rod + inflate × 2 angles), all 4 hatch grammars × 2 directions + 4 hatch sliders L/M/H, svg-port × 3 angles, and every per-mode property toggle (rod radius/caps/joint/jointsens, extrude width/depth/bevel/wall, inflate base/tip/press/puff/profile, solid ink/depth/holes/edge) at LOW/MID/HIGH. **≈24,400 distinct state cells** rendered through the REAL `Stroke3DScene` path at ≥2 orbit angles each.

**Vision-read:** All geomode contact sheets (16, covering all 197 × 10 states), the native flat-slab + native-curved sheets (8), hatch/rod/extrude/inflate/solid/svg-port sheets across the h1+h2 harness ranges, the 6 native distinctness boards, plus 5 high-res drill strips covering 33 fidelity-critical shape-instances and per-flag drills on every flagged family — each compared cell-by-cell to its Clean render.

**Auto-flag + statistical cross-check:** 0 EMPTY, 0 TAN, 0 OVERFLOW outside the 3 rod-radius-low cells across all cells. The dark-source cross-check confirmed every dark cell either traces to a dark-filled Clean source (faithful) or to RC-2 (the 4 tangle/thin shapes) — **0 cells render a light source as a dark blob spuriously.** Envmap re-fix HOLDS: native lit-face max Δr−b ≈ 16–17, well under the 25 tan threshold, on flat slabs AND curved at every oblique angle.

**Honest gaps / caveats:**
- The svg-port group tested the default hachure fillStyle for all 197; a separate fillStyle-cross probe ran on 6 representative shapes only (not 197) — the 8-fillStyle × 197 svg-port matrix is the one un-exhausted sub-axis.
- The full 197 single-process run was repeatedly killed mid-flight by GL-context-loss (the concurrent fix-fleet's `src` edits triggered vite HMR navigations). Diagnosed and worked around by switching to a no-HMR static `vite build + preview` server (`vite.audit-nohmr.config.ts`). Because renders are deterministic, the 197 coverage assembled from the harness shards agrees cell-for-cell — no coverage was lost, only the single-process convenience.
- RC-4 and RC-5 are **design-calibration observations, not render breaks** — they are explicitly NOT in the 253 broke count and await Sebs's eyeball.

---

## 5. Dataset feed (the systems were fed)

Every audited 3D cell is one labeled `fidelity-3d` example in `datasets/smart-layer.dataset.jsonl`, ingested via the fidelity-3d adapter chain (`tools/3d/visual3d-to-fidelity.mjs` / `tools/3d/native-audit-to-fidelity3d.mjs` → `tools/dataset/feed-dataset.mjs --from-fidelity-3d`). The adapter keys each example on `fidelity-3d:<shape>:<stateId>` (idempotent — re-feeds update in place, never duplicate), labels `ok` when no flag fired and `broke` with the flag as `firedRules`, carries `mode` + `bbox` features, and stamps the `canonical-eps3` regime.

**Current dataset state (verified from the JSONL + manifest):**
- `fidelity-3d` examples: **29,529** (29,276 ok / 253 broke)
- By mode: native 7,092 · hatch 3,940 · svgport 591 · rod 2,758 · extrude 2,364 · inflate 3,152 · solid 2,167 · geomode 1,970 · native-curved 5,208 · auto 197 (+90 misc)
- By flag: FLAT-NOSTRUCT 192 · BLACK-BLOB 58 · OVERFLOW 3
- Dataset total: **33,265 examples** (golden 1,394 · fidelity-2d 2,335 · fidelity-3d 29,529 · desk-perf 7)

Per `feedback_keep_feeding_smart_ml`: the exhaustive 3D audit's labeled data is now permanent in the dataset — every ok/broke cell is a training point for the smart layer.

---

## OVERVIEW (scannable)

**Total broken: 253 / 29,529 fidelity-3d cells (0.86%). 99.14% clean.**

**Top root causes (3 real bugs):**
1. **RC-1 — 3D hatch `hachureGap` HIGH has no cap → 192 cells (76% of all breaks).** One shader line (`hatchMaterial.ts`, port the 2D 12px gap cap). Slider-extreme tone-band-vanish; violates SA-2. **P0, ~30 min.**
2. **RC-2 — solid/extrude raster fills open tangles into a black mass → 58 cells, 4 shapes** (tangleToy, keychain, monkeyNoodle, bibSafetyPins). `buildPoolSolidGeometry` needs an openness guard. Only **tangleToy** truly loses structure; the other 3 are faithful-but-flat. Clean on rod + inflate. **P1, ~half day.**
3. **RC-3 — rod radius-low over-zoom framing → 3 cells** (seltzerCan, begleri, boardingPassTW). Hairline tube + auto-framing OVERFLOW; outline correct. **P2, ~1 hr.**

**What's clean (the strong story):**
- **0 EMPTY, 0 TAN** anywhere — the envmap tan-band fix HOLDS on flat slabs AND curved at every oblique angle (lit-face Δr−b ≈ 16–17 vs 25 threshold).
- **Geometry-mode sweep: 0 broke** — all 197 shapes render recognizable, ink-black, tan-free bodies in all 5 modes (auto/rod/extrude/inflate/solid) at both orbits.
- **inflate, svg-port, native-curved, auto, geomode: 0 broke.**
- **rod 3/2,758 · extrude 2/2,364 · native 26/7,092 · solid 30/2,167** — all trace to RC-1/2/3, no new root causes.

**Two design-calibration items (NOT breaks, pending Sebs eyeball):** 6-way native material distinctness (5 of 6 share ink on flat slabs); svg-port edge weight thin / body pale.
