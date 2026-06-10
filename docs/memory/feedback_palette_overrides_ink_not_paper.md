---
name: palette-overrides-ink-not-paper
description: "Palette overrides (strokePalette / fillPalette) remap INK fills only, NEVER paper / background / transparent / no-fill. var(--dir-bg) is paper substrate, not ink."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 280032a1-475d-4acd-83ea-e9c6f3003e23
---

**Rule:** Color/Palette cluster overrides (strokePalette / fillPalette) remap INK fills (ink tier tokens, color-mix wash overlays, hex/named colors). They MUST skip:
- `null` / `undefined` (no source fill — preserving means leaving the element fill-less)
- `'none'` / `'transparent'` (explicit no-fill)
- Any fill containing `var(--dir-bg)` (paper / page background — not ink)

**Why:** 2026-06-04 Sebs flagged that switching fillPalette from `source` to `detail` (or any non-source value) FLOODED EVERY PIN with the override color — Polaroid, sketchbooks, framed posters all went solid grey. Root cause: `mapPaletteColor` was treating `var(--dir-bg)` (paper) as an ink token and swapping it for `var(--dir-detail)`. So white paper backgrounds became opaque grey, drowning the pin geometry.

This is conceptually a Color/Palette cluster invariant: PAPER ≠ INK. Palette overrides change what color you draw WITH. Paper stays paper.

**How to apply:**
- When implementing a color/palette override system, ALWAYS exclude background/paper tokens from remapping.
- The exclusion list per W1 system: `--dir-bg` (and `--dir-bg-d` for dark direction equivalent), `none`, `transparent`, null/undefined.
- For `color-mix(in oklab, TOKEN N%, transparent)` washes: swap TOKEN, preserve N% AND transparent endpoint — wash stays wash, just color shifts.
- For plain var() tokens that aren't `--dir-bg`: swap whole var() to replacement.
- Test by cycling through every palette value with at least one pin containing each fill type (paper, wash, ink) and verify only ink + wash regions change color.

**Both code paths need the exclusion** — easy to fix one and miss the other:
1. **JS** `mapPaletteColor` (used by rough-family styles that go through `transformElement`): early-return when fill includes `--dir-bg`. Properly handles `color-mix(in oklab, TOKEN N%, transparent)` by swapping inner TOKEN while preserving N% and transparent endpoint.
2. **CSS** `data-f3-fill="X"` selectors (used by clean / outline-only / wireframe styles that don't clone): need TWO exclusions — `:not([fill*="--dir-bg"])` AND `:not([fill*="color-mix"])`. CSS can't dynamically rewrite the var() token INSIDE a color-mix attribute, so override would flatten the wash to opaque palette color (losing the 8% wrapper). The `bg` palette explicitly opts into bg flooding but still excludes color-mix; all others exclude both.
- Sebs flagged the same root issue THREE times (2026-06-04) before all paths were fixed: first fix only patched JS, second fix added bg exclusion to CSS but not color-mix exclusion. Stacked sketchbooks alternating wash/ink revealed the color-mix gap — all 4 bars rendered same opaque color instead of 2 ink + 2 wash. Audit ALL THREE protections every time: bg, color-mix, plus none/transparent.
- **Known tradeoff post-fix:** CSS-route wash fills don't migrate color when palette swaps (they stay as their source token). Wash COLOR migration requires JS DOM mutation (same as `mapPaletteColor` does for rough-family) — only ink fills migrate via CSS.

Related memories:
- [[copy-implementation-before-tweaking-numbers]]
- [[color-palette-changes]] — don't change W1 palette without authorization (this rule is about USING palette, not changing it)
- [[smart-hachure-drift-pattern]]
