# Agent 5 — Perceptual lightness + target-tone math

**Date:** 2026-06-03
**Word count:** ~1180
**Status:** Verified research with cited sources

---

# Smart Hachure System — Target-Tone Matching: Math + Perceptual Research

## 1. Perceptual lightness fundamentals

**Linear sRGB and relative luminance (WCAG).** sRGB pixel values are gamma-encoded; you must linearize before any physical light math. WCAG's published formula:

```
if Cs ≤ 0.03928:  Clin = Cs / 12.92
else:             Clin = ((Cs + 0.055) / 1.055)^2.4
Y = 0.2126·Rlin + 0.7152·Glin + 0.0722·Blin
```

(WCAG notes errata: true threshold is 0.04045, negligible at 8-bit.) [W3 Relative Luminance](https://www.w3.org/WAI/GL/wiki/Relative_luminance). **Why it works:** sRGB encoding compresses dark values to match human sensitivity at coding-time; physical mixing of light (what a screen does when many thin lines abut white paper-tone) is linear in radiance, not in sRGB units. Mix in sRGB and you get the classic too-dark mid-grey.

**CIELAB L\*.** `L* = 116·f(Y/Yn) − 16` where `f` is a cube-root with a near-zero linear segment. CIELAB's own docs admit it is **"known to lack perceptual uniformity, particularly in the area of blue hues"** ([Wikipedia: CIELAB](https://en.wikipedia.org/wiki/CIELAB_color_space)). For neutrals (your case — warm paper, dark ink), L\* is fine.

**OKLab L.** Björn Ottosson's OKLab applies a cube-root nonlinearity to LMS cone responses, fit against three perceptual datasets ([Ottosson, 2020](https://bottosson.github.io/posts/oklab/)). For greys it tracks L\* closely; for chromatic mixing it is materially better, which is why CSS `color-mix(in oklab, …)` was specified. **Use OKLab L as your target metric** — it aligns with your existing `color-mix(in oklab, var(--dir-text-primary) N%, transparent)` wash tokens, so a "source fill at 8%" and a "hachure measured at 8%" speak the same language.

## 2. Halftone / hachure perceptual density

**Murray–Davies (1936)** is the foundational equation. For dot fraction `a`, paper reflectance `Rp`, solid-ink reflectance `Ri`:

```
R(a) = a·Ri + (1 − a)·Rp        (linear in reflectance, not density)
```

([Murray-Davies origin](https://cmykhistory.com/murray-davies-equation-origin-story/); [IS&T expanded MD](https://www.imaging.org/common/uploaded%20files/pdfs/Papers/1999/RP-0-93/1808.pdf)). **Why it works:** at viewing distance the eye spatially integrates ink and paper; integration is linear in radiance reflected from each sub-area.

**Yule–Nielsen (1951)** correction for optical dot gain (light scatters laterally inside paper, gets absorbed under nearby dots):

```
R(a)^(1/n) = a·Ri^(1/n) + (1 − a)·Rp^(1/n),   1 ≤ n ≤ 2.5
```

([Yule–Nielsen modeling, IS&T](https://library.imaging.org/admin/apis/public/api/ist/website/downloadArticle/jist/40/3/art00008)). On a screen there is no paper scatter, but **anti-aliasing on sub-pixel hachure strokes behaves analogously** — a 0.5-px-wide stroke at 1 device-pixel is gamma-blended with the background by the GPU, which is structurally the same nonlinearity. Treat `n` as an empirical "screen scatter" exponent you calibrate, not a physical paper property.

## 3. Forward model (parameters → perceived L)

Parallel hachure, gap `G` (center-to-center), stroke weight `W`, stroke opacity `α`:

```
C  = clamp(W / G, 0, 1)               # geometric coverage
α_eff = α                             # alpha-as-coverage if no overlap
Y_render = (1 − C·α_eff)·Y_paper + C·α_eff·Y_ink     # linear-light mix
L_render = OKLab_L(Y_render)
```

**Non-linear regimes to flag:**
- **Sub-pixel weights** (`W < 1 device-px`): GPU rasterizer applies its own coverage = `W / 1px`, then alpha-blends in gamma space in many browsers (Chrome anti-aliases SVG strokes with gamma-correct compositing only when `color-interpolation="linearRGB"` is set — default is `sRGB`). This is the dominant error source in your range.
- **Overlap** (`W > G`): coverage saturates at 1; ink stacks but Murray–Davies upper bound is `Ri`.
- **Cross-hatch / multi-stroke** (your Phase 2.5 case): each layer's coverage composites as `1 − Π(1 − Cᵢ·αᵢ)` in linear light. Stacking three 30% layers ≠ 90% — it's `1 − 0.7³ ≈ 0.657`.

## 4. Inverse model (target L → parameters)

The system is under-determined: `C = W/G` has a 1-parameter family of solutions. Pick one via **artistic priors** consistent with your hatching skill base:

1. **Anchor gap, solve weight** when target is light (`L > 0.7`): wider gaps preserve visible structure, which artists prefer over invisible hairlines. Solve `W = G · C_target / α`.
2. **Anchor weight, solve gap** when target is dark (`L < 0.4`): a fixed pleasing weight (e.g., 0.6–1.0 px) with closing gap reads as deepening shadow, which is the trained etcher's move.
3. **Crossover region** (`0.4 ≤ L ≤ 0.7`): hold weight at minimum legible, vary gap.

No optimization solver needed — a piecewise closed-form keeps the system deterministic, which matters because re-render must be stable. Optimization re-introduces flicker across re-renders.

## 5. Calibration loop

**Measurement.** Render the hachure into an offscreen `<canvas>` via `drawImage` of the SVG (or `OffscreenCanvas` + `Path2D`). `getImageData` → linearize each pixel via WCAG piecewise → average Y → OKLab L. **Critical:** sample at the *rendered display scale*, not a fixed 256-px thumbnail; sub-pixel anti-aliasing differs per zoom.

**Loop.**
```
predict  →  render  →  measure  →  error = L_target − L_measured
adjust   →  W' = W · (1 + k·error),  k ≈ 0.5 (under-relaxation prevents oscillation)
stop when |error| < 0.005 in OKLab L (≈ JND for neutrals near mid-grey)
```

**When to calibrate.** Once per `(strokeWidth-class × gap-class × ink-token)` tuple, cached. A 3-axis LUT with ~6 bins per axis = 216 entries, ~2 KB JSON. Persist to `localStorage` keyed by user-agent + devicePixelRatio (anti-aliasing differs across these). Invalidate on token change. Per-shape calibration is overkill; per-class hits the same shapes that share a bbox-size bucket.

## 6. Chroma handling

Your warm-paper direction means `Y_paper ≈ 0.93`, `Y_ink ≈ 0.05` with a warm `b` axis. **Same OKLab L can look warmer or cooler depending on `a, b`**, but for matching *tonal* fidelity you defined the target as L, so only L matters at the matching step. However: when the source fill is `color-mix(in oklab, --dir-text-primary 8%, transparent)`, the mixed result inherits the ink's `a, b` proportionally. Your hachure ink is the same `--dir-text-primary`, so chroma matches automatically — *as long as you mix in OKLab not sRGB*. This is the one place where "linear sRGB is enough" is **wrong**; do the mix in OKLab to preserve chroma identity, then read L for the tone comparison.

## 7. Edge cases

- **Tiny bbox** (< 40 px² of area): coverage statistics dominated by 2–3 strokes; quantization noise > JND. Fall back to a flat semi-transparent fill at target L, no hachure.
- **Huge bbox**: lines become visibly discrete; mid-frequency moiré is felt as texture, not tone. Cap density-driven gap at ~12 px and let L drift; users read it as "darker hatched area," not "lighter solid."
- **Extreme contrast** (`L < 0.1` on near-white paper): perception is non-linear (Weber–Fechner regime), small L errors look large. Bias your `k` lower here.
- **Browser AA variance**: Safari uses different sub-pixel positioning than Chrome. Calibration LUT *must* be UA-keyed.

## 8. Recommended approach

- **Target space:** OKLab L. One scalar, aligned to your color system.
- **Forward model:** Murray–Davies in linear-light with a Yule–Nielsen-style `n` exponent (start `n = 1.6`, fit per UA).
- **Inverse:** piecewise closed-form (light: vary W; dark: vary G; middle: hold W min).
- **Calibration:** under-relaxed feedback (`k ≈ 0.5`), tolerance 0.005 L, ≤ 5 iterations typical.
- **Cache:** LUT in `localStorage`, keyed `(UA, dpr, ink-token)`.

## 9. Honest gaps

- **JND of 0.005 OKLab L is a placeholder.** True neutral JND varies with surround, viewing distance, ambient light. Without psychophysical testing on your actual asset shapes, treat any threshold tighter than 0.01 as "looks right" intuition, not measurement.
- **Yule–Nielsen `n` for screen hachure has no published value.** Print research gives 1.4–2.0 for paper. Screens are physically different (no scatter, but gamma compositing); the `n` you fit is *phenomenological* — it works because the functional form happens to absorb AA non-linearity, not because of optics.
- **Cross-asset perception** (does Card A's hachure read same as Card B at different bbox?) requires controlled side-by-side study. The LUT will hit *measured* L identity; *perceptual* identity across spatial-frequency differences is not guaranteed by any forward model here.
- **OKLab L for very dark inks on warm paper.** OKLab is fit on isolated patches; small chips on textured backgrounds engage simultaneous-contrast effects no color space models. Expect a perceptual nudge of ~0.01–0.02 L that you'll dial in by eye.

---

## Sources

- [W3C WAI — Relative Luminance](https://www.w3.org/WAI/GL/wiki/Relative_luminance)
- [Wikipedia — CIELAB color space](https://en.wikipedia.org/wiki/CIELAB_color_space)
- [Ottosson — A perceptual color space for image processing (OKLab)](https://bottosson.github.io/posts/oklab/)
- [Murray–Davies origin story](https://cmykhistory.com/murray-davies-equation-origin-story/)
- [Modeling the Yule–Nielsen Halftone Effect (IS&T)](https://library.imaging.org/admin/apis/public/api/ist/website/downloadArticle/jist/40/3/art00008)
- [An Expanded Murray-Davies Model of Tone Reproduction (IS&T)](https://www.imaging.org/common/uploaded%20files/pdfs/Papers/1999/RP-0-93/1808.pdf)
- [Light Scattering and Ink Penetration Effects on Tone Reproduction (IS&T)](https://www.imaging.org/common/uploaded%20files/pdfs/Papers/2000/PICS-0-81/1618.pdf)
