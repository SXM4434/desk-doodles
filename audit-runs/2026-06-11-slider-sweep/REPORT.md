# Slider Calibration Diagnostic Sweep — 2026-06-11 (ROCK F)

**Report-only diagnostic. No src files were edited.** This is the deferred linearity pass from
memory `project_f3_slider_recalibration_pending`, run as a measured sweep instead of guesswork.

## Method

- Target: `http://localhost:5182/desk` (live desk, 30 object SVG nodes; visually ~9 doodles in
  the home-camera frame: 2 faces, ovals, 4 hearts, a 6-pane window grid with hatched fills, a
  dark scribble ball). Style = default `rough-handdrawn`, modifiers at `DEFAULT_MODIFIERS`.
- Driver: Playwright (chromium headless, 1680x1050, DPR 1). Right Controls panel + Multi-stroke +
  Shading + Color/palette clusters pre-opened via `dd.panel.*` localStorage keys. Transitions
  killed via injected CSS. Feed frozen with `context.setOffline(true)` after load so realtime
  inserts can't pollute diffs (object count re-checked every step: stayed 30 for all 84 steps).
- Per slider: 7 evenly-spaced values across the `SLIDER_SPECS` range (snapped to step grid).
  After each set: settle (double rAF + 750 ms), screenshot a **fixed clip
  `{x:2, y:70, w:1316, h:978}`** (the desk `<main>`), same rect every time. Slider restored to
  its default after each sweep; full reload at the end.
- Metric: mean-absolute pixel diff (MAD, 0-255 scale, RGB) between consecutive steps and
  step-N-vs-step-0, computed in-browser via canvas. **Noise floor measured first: idle re-shot
  MAD = 0.0000, same-value re-dispatch re-render MAD = 0.0000.** Rendering is fully
  deterministic — every non-zero diff below is real signal.
- Eyeball pass: 2x zoom crops of the filled region (window grid + scribble, `zoom-crops/*-fill.png`)
  and the line region (hearts, `zoom-crops/*-line.png`) at each flagged slider's extremes,
  read by eye — not inferred from numbers alone.

**Caveat on amplitudes:** this desk is line-doodle-heavy; Shading-cluster sliders act on a small
pixel fraction (the window panes). Compare a slider's MADs against its *own* range, not across
sliders. Verdicts below always combine the curve with the eyeball read.

---

## Per-slider response curves (all 12 swept — none sampled out)

MAD = mean abs pixel diff vs previous step (`consec`) and vs step 0 (`fromZero`).

### 1. Wobble (0 -> 2.0, default 0.4) — QUEUE: top-end saturation

| step | value | consec MAD | fromZero MAD |
|---|---|---|---|
| 0 | 0 | — | — |
| 1 | 0.35 | 0.5318 | 0.5318 |
| 2 | 0.65 | 0.4200 | 0.8413 |
| 3 | 1.0 | 0.4771 | 1.1108 |
| 4 | 1.35 | 0.4832 | 1.3151 |
| 5 | 1.65 | 0.2727 | 1.4367 |
| 6 | 2.0 | 0.1945 | 1.5249 |

Roughly even response 0->1.35, then compresses hard: the last third of the slider (1.35->2.0)
delivers ~17 % of the total change. Eyeball at extremes: 0 vs 2.0 is visible but subtle on
hand-drawn hearts (anchors already carry real hand wobble, so synthetic wobble adds texture, not
shape). **The saturation zone coincides with the I-11 "Excalidraw zone" warn region (>1.4)**, so
the flat top is partially self-documenting. If desired: perceptual remap `w_eff = 2*(v/2)^1.4`
spreads the response evenly — but that moves the I-11 ratio calibration, so it's a Sebs call,
not a mechanical fix.

### 2. Jaggedness (0 -> 2.0, default 0) — QUEUE: 4-step staircase, not continuous

| step | value | consec MAD | fromZero MAD |
|---|---|---|---|
| 1 | 0.35 | 1.5539 | 1.5539 |
| 2 | 0.65 | 0.3683 | 1.6291 |
| 3 | 1.0 | 1.5427 | 1.7457 |
| 4 | 1.35 | 1.6755 | 1.8340 |
| 5 | 1.65 | 0.2397 | 1.8941 |
| 6 | 2.0 | 1.8709 | 2.0696 |

Textbook staircase. Root cause read from source (read-only):
`SvgStyleTransform.tsx:334 — zigsPerSeg = Math.min(4, Math.max(1, Math.round(jaggedness * 2)))`.
Zig count is an integer 1-4; crossing a rounding boundary re-lays-out the whole zig pattern
(big diff: 0->0.35, 0.65->1.0, 1.0->1.35, 1.65->2.0), while moves inside a bucket only scale
amplitude (tiny diff: 0.35->0.65, 1.35->1.65). The measured alternation matches the rounding
boundaries exactly. The slider promises 41 ticks; the engine delivers 4 structural levels with
amplitude interpolation between. Eyeball: 0.35 is subtle roughening; 2.0 is a dramatic
full-sawtooth — the range itself is good. Options (design call): (a) raise structure resolution
`round(j*3)` cap 6, (b) fix zigs at 3 and let amplitude alone scale (fully continuous, kills the
re-layout jumps), (c) accept + document the 4 zones.

### 3. Simplify (0 -> 2.0, default 1.0) — INFO: bottom-third compression (by-design exponential)

| step | value | consec MAD | fromZero MAD |
|---|---|---|---|
| 1 | 0.35 | 0.3706 | 0.3706 |
| 2 | 0.65 | 0.3535 | 0.4804 |
| 3 | 1.0 | 0.9787 | 1.0596 |
| 4 | 1.35 | 0.8577 | 1.3167 |
| 5 | 1.65 | 0.9150 | 1.4853 |
| 6 | 2.0 | 1.3677 | 1.8136 |

Monotonic but bottom-compressed: s <= 0.65 is nearly indistinguishable from s = 0 (eps = 0.75->1.85 px
on ~180 px doodles). This is the locked doc-22 mapping eps(s) = 3*4^(s-1) doing what it says —
"faithful zone" at the bottom. Eyeball: at 2.0 hearts go visibly angular/faceted; at 0 vs 0.65 no
readable difference. Leave unless Sebs wants the faithful zone shorter.

### 4. Bowing (0 -> 2.5, default 1.0) — HEALTHY

| step | value | consec MAD | fromZero MAD |
|---|---|---|---|
| 1 | 0.4 | 0.5986 | 0.5986 |
| 2 | 0.85 | 0.6579 | 1.0974 |
| 3 | 1.25 | 0.6019 | 1.4022 |
| 4 | 1.65 | 0.6078 | 1.6246 |
| 5 | 2.1 | 0.6894 | 1.8475 |
| 6 | 2.5 | 0.6350 | 2.0167 |

Near-perfectly even consecutive response (0.60-0.69 every step), monotonic accumulation.
Eyeball: 2.5 shows clear double-stroke divergence without destroying the doodle. No action.

### 5. Stroke width (0.5 -> 3.0, default 1.2) — HEALTHY (floor fix verified)

| step | value | consec MAD | fromZero MAD |
|---|---|---|---|
| 1 | 0.9 | 0.6966 | 0.6966 |
| 2 | 1.35 | 0.6482 | 1.3431 |
| 3 | 1.75 | 0.8252 | 1.9744 |
| 4 | 2.15 | 0.9156 | 2.6776 |
| 5 | 2.6 | 1.0519 | 3.4135 |
| 6 | 3.0 | 0.9155 | 3.9644 |

Monotonic, mildly expanding (wider lines move more pixels — expected). Eyeball at 0.5: strokes
are faint but **fully visible** — the 06-10 floor fix holds at desk scale. Largest total
amplitude of any slider (3.96). No action.

### 6. Curve / curveDamp (0 -> 1.5, default 0.3) — INFO: linear but low gain on drawn content

| step | value | consec MAD | fromZero MAD |
|---|---|---|---|
| 1 | 0.26 | 0.1951 | 0.1951 |
| 2 | 0.5 | 0.1895 | 0.3555 |
| 3 | 0.76 | 0.2088 | 0.5202 |
| 4 | 1.0 | 0.2001 | 0.6652 |
| 5 | 1.26 | 0.2282 | 0.8170 |
| 6 | 1.5 | 0.2175 | 0.9451 |

Flat, even, monotonic — the cleanest curve of the set — but low absolute amplitude. Eyeball 0 vs
1.5: the hearts straighten only subtly. Drawn paths carry dense anchors, so interpolation damping
has little room to act (catalog shapes with sparse anchors respond more — consistent with spec
6.7). No dead zone, no cliff. Leave; revisit only if Sebs wants Curve to "do more" on drawn input.

### 7. Hachure gap (1 -> 12, default 4) — **FIX-NOW: top HALF of the slider is dead**

| step | value | consec MAD | fromZero MAD |
|---|---|---|---|
| 1 | 2.75 | 0.2324 | 0.2324 |
| 2 | 4.75 | 0.1225 | 0.2986 |
| 3 | 6.5 | 0.0281 | 0.3074 |
| 4 | 8.25 | 0.0322 | 0.3093 |
| 5 | 10.25 | **0.0000** | 0.3093 |
| 6 | 12 | **0.0000** | 0.3093 |

Two consecutive steps with **literally zero** pixel change; 97 % of the total response happens
below slider ~5. Eyeball confirms: gap = 4.75, 6.5 and 12 are pixel-identical hatch pitch in the
window panes; only gap = 1 (near-solid optical merge) -> ~4.75 shows progression. Root cause
(read-only): `smartHachure/techniqueMap.ts:264 — effectiveGap = Math.max(1.5, Math.min(12,
m.hachureGap * styled.gap))`. Role gap multipliers (~2-5x) push the product past the 12 px cap by
slider ~5-6, pinning every region at the cap for the rest of the range. Remap options:
- **(a) 1-line slider-side:** `SLIDER_SPECS.hachureGap max 12 -> 6` (default 4 unchanged; 21 ticks,
  still >= 6 per I-3). Honest range, zero engine risk.
- **(b) engine-side (better per I-3 "bias within band"):** normalize before the cap —
  `effectiveGap = 1.5 + (12 - 1.5) * t^0.85` with `t = (m.hachureGap - 1)/11`, and let
  `styled.gap` bias t by +-20 % instead of multiplying past the cap. Slider max then lands AT the
  cap for every role. Touches locked smartHachure math -> needs the owner + a sweep-harness
  regression run per `feedback_never_declare_fixed_without_regression_check`.

### 8. Hachure angle (-90 -> 90 deg, default -41) — HEALTHY (convention note)

| step | value | consec MAD | fromZero MAD |
|---|---|---|---|
| 1 | -60 | 0.1457 | 0.1457 |
| 2 | -30 | 0.1353 | 0.1500 |
| 3 | 0 | 0.1452 | 0.1594 |
| 4 | 30 | 0.1457 | 0.1507 |
| 5 | 60 | 0.1360 | 0.1463 |
| 6 | 90 | 0.1444 | 0.0536 |

Every 30-degree step produces the same-magnitude change — ideal angular response. fromZero collapses at
+90 because -90 and +90 are the same line orientation (180-degree period — duplicate endpoints, expected).
Eyeball note: slider 0 renders **vertical** hatch lines, +-90 renders horizontal — a 90-degree offset
from what the label intuitively suggests. Cosmetic only; no action required.

### 9. Fill density (0 -> 1.2, default 0.7) — **FIX-NOW: bottom 40 % of the slider is dead**

| step | value | consec MAD | fromZero MAD |
|---|---|---|---|
| 1 | 0.2 | **0.0000** | 0.0000 |
| 2 | 0.4 | **0.0000** | 0.0000 |
| 3 | 0.6 | 0.0181 | 0.0181 |
| 4 | 0.8 | 0.0332 | 0.0511 |
| 5 | 1.0 | 0.0330 | 0.0834 |
| 6 | 1.2 | 0.0293 | 0.1124 |

0 -> 0.4 is byte-identical output. Eyeball confirms: panes at density 0 and 0.4 carry identical
hatching; 1.2 reads slightly denser/heavier. Root cause (read-only):
`smartHachure/techniqueMap.ts:267 — effectiveWeight = m.strokeWidth * styled.weight *
Math.max(0.5, m.fillDensity)`. The 0.5 floor (intentional — "light fills don't vanish") swallows
slider values 0-0.5 exactly where the first measured non-zero diff appears (0.4->0.6 crosses 0.5).
**Concrete default-preserving remap (1 line):** replace `Math.max(0.5, m.fillDensity)` with a
piecewise map that keeps the floor *and* the default:
`densityScale = m.fillDensity < 0.7 ? 0.5 + (m.fillDensity / 0.7) * 0.2 : m.fillDensity`
(0 -> 0.5, 0.7 -> 0.7 — default pixel-identical, 1.2 -> 1.2, monotonic, no dead zone). Owner of
smartHachure/** should land it + regression-sweep.

### 10. Ink intensity (0 -> 1, default 1.0) — HEALTHY (textbook linear)

| step | value | consec MAD | fromZero MAD |
|---|---|---|---|
| 1 | 0.17 | 0.3593 | 0.3593 |
| 2 | 0.33 | 0.3473 | 0.7065 |
| 3 | 0.5 | 0.3559 | 1.0619 |
| 4 | 0.67 | 0.3483 | 1.4093 |
| 5 | 0.83 | 0.3253 | 1.7333 |
| 6 | 1.0 | 0.3338 | 2.0649 |

The reference curve — near-constant consecutive response, perfectly linear accumulation.
Eyeball: at 0 the desk is **completely blank** (correct for an opacity-family control, but note
the UX: bottom ~15 % of the slider renders the desk near-empty). No remap needed.

### 11. Fill opacity (0 -> 1, default 1.0) — HEALTHY (low amplitude = small fill area, not a bug)

| step | value | consec MAD | fromZero MAD |
|---|---|---|---|
| 1 | 0.17 | 0.0215 | 0.0215 |
| 2 | 0.33 | 0.0262 | 0.0475 |
| 3 | 0.5 | 0.0222 | 0.0695 |
| 4 | 0.67 | 0.0221 | 0.0911 |
| 5 | 0.83 | 0.0203 | 0.1111 |
| 6 | 1.0 | 0.0210 | 0.1318 |

Flat, even, monotonic. The tiny MADs initially looked like a wiring problem — eyeball disproves
that: at 0 the window-pane hatch fills vanish entirely (clean empty outlines), at 1 fully
hatched. The amplitude is small only because fills are a small pixel fraction of this desk.
No action.

### 12. Texture intensity (0 -> 3, default 1.0; BONUS — swept at texture = `light`) — **FIX-NOW: invisible at default**

Slider is hidden at default (`texture: 'none'`), so it was swept after setting Texture -> `light`
via the chrome dropdown (separate run, same fixed clip, desk still 30 objects; internally consistent).

| step | value | consec MAD | fromZero MAD |
|---|---|---|---|
| 1 | 0.5 | **0.0000** | 0.0000 |
| 2 | 1.0 | **0.0000** | 0.0000 |
| 3 | 1.5 | 0.0200 | 0.0200 |
| 4 | 2.0 | 0.0786 | 0.0969 |
| 5 | 2.5 | 0.1444 | 0.2335 |
| 6 | 3.0 | 0.1543 | 0.3772 |

**Texture `light` at the default intensity 1.0 is byte-identical to texture off.** The user picks
a texture and sees nothing until they push the slider past ~1.3. Root cause (read-only):
`SvgStyleTransform.tsx:2559 — feDisplacementMap scale = recipe.baseScale * textureIntensity`;
`light.baseScale = 1.2` (line 2354) -> displacement stays sub-pixel until the product reaches
~2.4-3.0. Same paper-grain-at-0.05-opacity failure mode the 06-11 batch already fixed elsewhere.
By the same math, low-baseScale recipes (`light` 1.2, `wet-ink` 1.3, `paper-tooth` 1.4, `stipple`
1.6) are all at/near invisible at intensity 1.0 — **including `paper-tooth`, which the
rough-handdrawn PRESET ships as its texture** (preset texture axis is currently decorative).
Eyeball: intensity 3.0 gives a real eroded-ink grain; 0-1.0 are identical clean strokes.
Concrete options: (a) additive visibility offset when texture != none:
`scale = 1.8 + recipe.baseScale * textureIntensity` (every recipe visible from intensity ~0.2,
keeps growth slope); (b) re-base the four low recipes' `baseScale` ~x2.2 so intensity 1.0 lands
at today's intensity ~2.2 look. Both change how presets render -> Sebs should eyeball one object
before it lands fleet-wide.

---

## Verdict summary

| Slider | Verdict | Issue |
|---|---|---|
| Hachure gap | **fix-now** | Slider >= ~6 -> zero change (effectiveGap 12 px cap x role multipliers, techniqueMap.ts:264) |
| Fill density | **fix-now** | 0-0.5 dead (Math.max(0.5, ...) floor, techniqueMap.ts:267); default-preserving 1-line remap given |
| Texture intensity | **fix-now** | texture `light`/`paper-tooth` invisible at default 1.0 (sub-pixel feDisplacementMap scale) |
| Jaggedness | queue | 4-level staircase (zigsPerSeg = round(j*2) clamp 1..4); alternating cliff/flat consec response |
| Wobble | queue | Top third (>1.35) delivers ~17 % of total change; overlaps I-11 warn zone — remap is a design call |
| Simplify | info | Bottom-third compression is the locked doc-22 exponential doing its job |
| Curve | info | Linear + even but low gain on dense drawn anchors (spec 6.7 consistent) |
| Hachure angle | info | Healthy; 0 renders vertical lines (90-degree label offset), +-90 duplicate endpoints |
| Ink intensity | info | Textbook linear; 0 = blank desk (by design) |
| Fill opacity | info | Healthy; low MAD is content share, not wiring — fills verified vanishing at 0 |
| Bowing | info | Healthy — most even response of the multi-axis set |
| Stroke width | info | Healthy; 0.5 floor renders visible (06-10 floor fix verified at desk scale) |

Also verified: **rendering is fully deterministic** (idle + same-value re-render MAD = 0.0000) —
the no-unseeded-randomness constraint holds on /desk end-to-end.

## Artifacts

- `results.json` — all curves, machine-readable
- `baseline-{a,b,c}.png` — noise-floor proof
- `<slider>/step{0..6}-<value>.png` — 84 fixed-crop sweep screenshots (+7 textureIntensity)
- `zoom-crops/` — 2x crops used for the eyeball pass (fill region + line region per flagged slider)
- run-1's end-of-script reload crashed before writing `sweep-log.txt`; stdout numbers were
  captured and are reproduced verbatim in `results.json`

All sliders restored to defaults (per-slider restore during the run + full reload at the end;
modifiers are in-memory state, nothing persisted).
