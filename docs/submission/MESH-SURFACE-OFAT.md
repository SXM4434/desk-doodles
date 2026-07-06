# Mesh Surface OFAT — "where does it get too fake?" (2026-06-27)

Sebs: *"some of it gets too fake… test every possible combo and value on them, basically a big fun OFAT."* One-factor-at-a-time sweep of every surface treatment × value on the AI meshes, live (headed Chrome, real WebGL, `/desk?test=suzanne`), paired against the greyscale baseline.

**Method:** 31 variants captured wide (all 5 Suzanne meshes) + **deep on two diagnostic meshes** — `suzanne-2` Game Boy (a *photo* mesh = baked surface detail) and `suzanne-0` turntable (a *form* mesh = identity in the 3D geometry). Harness: `tools/mesh-surface-ofat.mjs` (drives `__dd_canvas3d` + `__dd_aiMeshSurface`), sheets `tools/mesh-ofat-sheets.mjs`. Captures: `/tmp/mesh-ofat{,-gb,-tt}/`.

---

## THE MAP — fake ↔ authentic

### ✅ AUTHENTIC (keep)
- **Greyscale (the AI register)** — keeps the mesh's *own* value/detail, so the object stays recognizable (the Game Boy screen survives). The universal-safe default. ⚠️ **Tune:** the `dark=0.18` default is too dark for detail-rich meshes — it buries the detail. `dark≈0.30–0.40` + `contrast≈1.2–1.6` reads markedly better (screen legible) while staying ink-family.
- **Hatch** — honest hand-drawn pen-ink; the *opposite* of fake. **cross-hatch** and **stipple** read fullest; **hachure** and **contour** leave the lit faces a bit empty/thin. Great as the signature stylistic surface.
- **Native matte / rubber + Outline** — clean sculptural ink form. The **Outline dial** (ink edges via EdgesGeometry) recovers object structure that plain native loses — the best native sub-mode for keeping identity. **Good on form-rich meshes** (turntable reads as a clean object); weak on flat-detail meshes (see below).

### ❌ TOO FAKE (drop / never default / cap)
- **PBR (photoreal)** — renders in **full color** (purple Game Boy, blue screen). Breaks the monochrome ink desk completely — the single most foreign/"fake" result. Keep ONLY as an explicit "show original," never on the desk by default.
- **Glossy family** — `glossyPlastic`, `ink`, and **high polish / high reflection / high sheen** → wet plastic CG highlights = textbook "too fake." The reflection *ceiling* keeps matte safe, but the gloss end is pure fakeness with no upside.
- **Plain native on a detail/photo mesh** — flattens the Game Boy into a featureless dark **blob** (value from form only → the screen/buttons vanish). Not "shiny-fake" but "generic-CG-fake": it loses what made it that object.

---

## THE PRINCIPLE (why fakeness is mesh-dependent)
Native materials make value come from **form + lighting** only. So:
- **Form mesh** (turntable: platter, tonearm, knobs are real geometry) → native reads **fine**, the form carries identity. Matte = clean sculptural; glossy = a touch plastic but still legible.
- **Detail/photo mesh** (Game Boy: identity is baked *surface* detail) → native **destroys** it (uniform blob). Only greyscale (keeps the texture) or hatch (re-draws it as marks) preserves the object.

→ The right default is **mesh-aware**: detail/photo mesh → greyscale; form mesh → native-matte is also good. (A future smart-layer pick.)

---

## MEGA OFAT — ROUND 3 (the combined winner) ★ THE ANSWER
R2's per-mesh winners split (greyscale for baked meshes, contour/outline for forms) because no SINGLE control did both jobs. R3 enabled **outline on the hatch surface** (the hull is a separate ink pass — works under any body) and tested the combo. Result, unanimous across all 5 meshes:

**`hatch + outline ~0.5` = the UNIVERSAL winner.** Cross-hatch (or contour/hachure) shading WITH a clean ink silhouette reads as proper pen-and-ink on every mesh type:
- **Form meshes** (turntable, Poké Ball): the outline gives the silhouette + band/button/edge that hatch-alone *dissolved* → a solid drawn object instead of a floating hatch cloud.
- **Detail/photo mesh** (Game Boy photo): the outline draws the screen rectangle + buttons back; hatch shades inside → a crisp detailed line drawing (the detail greyscale/native lost).
- **Baked-value meshes** (sketchy/doodle Game Boys): crisper + more "drawn" than greyscale — all detail reads via the ink edge.

This beats EVERY single-control option (greyscale flattens forms; native blobs detail; hatch-alone floats). It's the quintessential hand-drawn-3D look and sits perfectly in the monochrome ink desk. → **Recommended default for AI meshes = hatch (cross-hatch) + outline ~0.5.** (Setting it as the literal default needs per-mesh default handling so it doesn't entangle the global native/2D dials — flagged.) Outline is now exposed on BOTH native + hatch surfaces in the mesh controls. Captures: `/tmp/mega-r3-*/sheets/`.

---

## MEGA OFAT — ROUND 2 (finalists: pick THE default; zoom outline + micro)
16 variants × 5 meshes; per-mesh judges ranked the 4 candidate defaults (A greyscale · B matte+outline-50 · C cross-hatch-mid · D contour) and zoomed the outline ladder + micro grid.

**The default is MESH-DEPENDENT — no universal winner:**
| mesh | type | WINNER | greyscale verdict |
|---|---|---|---|
| turntable | form | **matte + outline-50** | reads as flat CG blob (fake) |
| Poké Ball | form | **contour** | flat fill, band/button vanish (fake) |
| Game Boy (photo) | detail | **contour** | ok but extremes crush; contour keeps screen |
| Game Boy (sketchy) | baked-value | **greyscale** | best — shaded sketch, detail legible |
| Game Boy (doodle) | baked-value | **greyscale** | best — full 3D legibility |

**The rule:** a mesh with **baked surface value** (the sketchy/doodle Game Boys) → **greyscale** shades it like a drawing. A clean **form-only** mesh (turntable, Poké Ball) → greyscale flattens to a fake blob; it needs **outline** (heavy mechanical forms) or **contour** (rounded forms) to draw the edges. → the smart-layer auto-pick: measure the mesh's surface-value variance → greyscale if rich, contour/outline if flat. Until then: greyscale stays the safe default + the user picks per object.

**Tuned sub-defaults (consensus):**
- **OUTLINE ≈ 0.5** is the sweet spot (0 = no edge, 75–100 over-inks/muddies fine detail). matte+outline for heavy forms (turntable); ink+outline for lighter/detail forms (Poké Ball, sketchy GB).
- **Cross-hatch micro = gap ~6 + thin width (~0.6) + full intensity.** Thick width (w15) → muddy black blob (universal fail); wide gap (10) → sparse/dissolves; low intensity → ghosts out.

---

## MEGA OFAT — ROUND 1 (36 variants × 5 meshes, full control space incl. NEW outline + hatch micro-dials)
After the 100% wiring, re-swept the complete space. Consensus across 5 per-mesh judges:

**Confirms the prior map:** gloss/PBR/high-dials = universal FAKE (pbr, glossyPlastic, polish-1, reflection-1, sheen-1, glossy suspects, glossy-outline). Hatch (cross-hatch/contour) + greyscale = universal AUTHENTIC. Native presets = FORM-mesh only (clean on turntable/pokeball; dark-blob on the gameboys).

**NEW — OUTLINE is a genuine win** (the OFAT-recommended native companion, now reachable):
- Recovers structure native flattens — on the photo Game Boy it brings the screen rectangle + button edges back; on the Poké Ball `outline-100` defines the equatorial band + button seam; on the turntable 33–66 sharpens the platter/arm.
- Sweet spot ≈ **0.5–0.66** (100 can muddy fine-detail meshes like the turntable; on detail meshes 100 is fine). **Gloss + outline = FAKE** (gloss kills the recovery). → native's best form = **matte + outline ~0.5**.

**NEW — HATCH MICRO-DIALS sweet spot:**
- **Thin–mid stroke width + tight–mid gap + low–mid intensity** = crisp hand-drawn crosshatch (best). 
- **Thick width = universal FAIL** (crushes to a muddy black blob); **wide gap** dissolves identity on form meshes (ok on some detail meshes). `angle-0` reads slightly mechanical.

**Round-1 finalists for THE default (per mesh type):** detail/photo mesh → **greyscale** or **hatch (cross-hatch/contour)**; form mesh → **greyscale**, **matte+outline**, or **hatch**. Gloss/PBR never default. → Round 2 zooms the outline level + micro sweet-spot + a 4-way finalist head-to-head.

---

## FULL 5-MESH SWEEP — cross-mesh consensus (31 variants × 5 meshes, 1 judge each)
Every variant captured deep on all 5 Suzanne meshes (turntable=FORM, gameboy-purple=PHOTO/detail, gameboy-sketchy=text→3D, gameboy-doodle, pokeball=FORM) and judged by a per-mesh vision agent (`/tmp/mesh-ofat{,-gb,-tt,-suzanne-1,-suzanne-3,-suzanne-4}/`). Tally = ✅authentic / ⚠️borderline / ❌fake across the 5 meshes.

**UNIVERSAL FAKE (❌ on every mesh) — HARD DROP:**
- `pbr-photoreal` (5×❌) — photoreal color/value, breaks monochrome
- `native-glossyPlastic` (5×❌) — plastic CG highlight
- `dial polish-1` (5×❌) — glossy specular
- `suspect glossy-polish1-refl1` (5×❌) — wettest gloss
- near-universal fake: `reflection-1`, `sheen-1`, `suspect ink-polish1`, `suspect signal-refl1` (4×❌) — the whole gloss/reflective end

**UNIVERSAL AUTHENTIC (✅ on every mesh) — KEEP:**
- `hatch crosshatch-fixed` (5×✅) — **the single most robust treatment**
- `hatch crosshatch-light`, `hatch contour-fixed`, `hatch contour-light` (✅ all/near-all)
- `greyscale-default`, `greyscale-contrast-low` (✅ all)
- `dial outline-mid` (positive everywhere — ink edges recover structure)

**MESH-DEPENDENT (✅ on FORM meshes / ❌ on flat-detail meshes):**
- `native-ink / -matteClay / -rubber / -signal` — clean sculptural on turntable + pokeball; collapse to a dark CG blob on the gameboys (esp. sketchy). Form-mesh-only.
- `greyscale-dark-high` — fine on form; crushes detail meshes to black.
- sparse hatch `hachure-light`, `stipple-light` — good on the gameboys; too empty on form meshes.

### Headline
**Hatch (crosshatch) + greyscale are the only surfaces authentic on EVERY mesh.** The gloss/reflection/PBR end is fake on everything. Native presets are a *form-mesh* option, not a universal one. → The earlier 2-mesh read holds, now confirmed across all 5.

## Per-variant verdict (deep meshes — gameboy-purple + turntable preview)

| variant | Game Boy (photo/detail) | Turntable (form) |
|---|---|---|
| greyscale-default (0.18) | ✅ real, but dark — detail subtle | ✅ reads, dark |
| greyscale-dark-low (0.10) | ⚠️ too black, detail lost | ⚠️ very dark |
| greyscale-dark-high (0.40) | ✅✅ **best legibility** (screen reads) | ✅ lighter, clean |
| greyscale-contrast-low | ⚠️ flat/muddy | ⚠️ flat |
| greyscale-contrast-high | ✅ good separation | ✅ good |
| pbr-photoreal | ❌ full color — breaks desk | ❌ full color |
| native-ink | ❌ glossy blob | ⚠️ glossy but form reads |
| native-softGel | ❌ blob | ⚠️ ok |
| native-matteClay | ⚠️ blob (no detail) | ✅ clean sculptural |
| native-glossyPlastic | ❌ plastic blob | ⚠️ plasticky |
| native-rubber | ⚠️ blob | ✅ clean satin |
| native-signal | ⚠️ metallic blob | ⚠️ metallic |
| polish-1 / reflection-1 / sheen-1 | ❌ adds plastic highlight | ⚠️ slightly plastic |
| polish-0 / reflection-0 / sheen-0 | ⚠️ flat matte blob | ✅ clean matte |
| outline-mid / outline-high | ✅ **ink edges recover structure** | ✅ drawn edges, clean |
| glossy-polish1-refl1 (suspect) | ❌ wettest/fakest | ⚠️ plasticky |
| hatch-hachure-fixed/light | ✅ ink sketch (lit faces a bit empty) | ✅ ink sketch |
| hatch-crosshatch-fixed/light | ✅✅ fullest, most "drawn" | ✅✅ rich |
| hatch-stipple-fixed/light | ✅ dotwork, good substance | ✅ good |
| hatch-contour-fixed/light | ⚠️ sparse/thin | ⚠️ sparse |

---

## RECOMMENDATION (confirmed across all 5 meshes)
1. **Default surface = greyscale.** Universally safe (keeps whatever identity the mesh has). Don't over-lighten — `dark-high` crushes detail meshes; keep ~0.18–0.25 and **auto-tune by the mesh's own darkness** rather than a fixed bump.
2. **Signature stylistic surface = Hatch, default grammar `cross-hatch`** — the only stylistic treatment authentic on EVERY mesh. Offer the other grammars (contour also strong; hachure/stipple light go sparse on form meshes) but crosshatch is the safe default.
3. **HARD-DROP the gloss/reflective end on meshes:** `glossyPlastic`, `pbr` (from the desk default), and cap polish/reflection/sheen to their low half — their high end is fake on every mesh with zero upside.
4. **Keep the Outline dial** — positive everywhere (ink edges recover structure); pairs with native.
5. **Native presets = a FORM-mesh option, gated/auto, not a universal default.** Great on geometry-rich meshes (turntable, pokeball), fake-blob on flat/photo meshes. The mesh-type gate is a smart-layer pick later.
6. **PBR → relabel "Original (photoreal)"**, off the desk by default — the lone color escape hatch.

→ **Build = 3 surfaces: Greyscale (default) · Hatch (cross-hatch) · Native-matte+Outline (form meshes).** Gloss + PBR demoted out of the defaults.
