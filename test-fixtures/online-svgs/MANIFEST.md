# Online SVG Edge Corpus — MANIFEST

Real-world SVGs sourced from the open web (Wikimedia Commons, simple-icons, bootstrap-icons)
for Desk Doodles big-daddy OFAT testing. Each file stresses one or more pipeline failure modes.
All files verified well-formed XML (parsed with `xml.etree.ElementTree`, 15/15 OK).

Retrieval note: the sandbox denies `curl`/`wget`, so files were retrieved as verbatim raw markup
via the WebFetch tool and written to disk, then re-parsed locally. One hallucinated WebFetch
response (a fabricated simplified skull) was caught and rejected; the real file bytes were
re-fetched and verified before saving. No `src/` files were touched.

License key: PD = public domain / ineligible-for-copyright (Wikimedia); CC0 = CC0 1.0;
CC-BY-SA = Creative Commons Attribution-ShareAlike (attribution required if used).

| Filename | Edge category | License | Source URL | Path/shape count | Fill vs stroke | viewBox |
|---|---|---|---|---|---|---|
| cat-silhouette.svg | Complex FILLED compound path (silhouette/illustration) — the "rose-like" case | PD (released to public domain) | https://commons.wikimedia.org/wiki/File:Cat_silhouette.svg | 1 path (long compound, `fill-rule:evenodd`) | Filled black, no stroke | none (w/h 400×380) |
| skull-and-crossbones.svg | Intricate FILLED + stroke illustration with internal detail (eye sockets, teeth) — recognizable-object stress | PD | https://commons.wikimedia.org/wiki/File:Skull_and_Crossbones.svg | 12 paths (mixed filled + `fill:none` open strokes) | Mixed: filled #FFF skull + many open strokes | none (w/h 510×490) |
| typographic-ornament.svg | STROKE-ONLY line drawing, very INTRICATE / high-node, self-intersecting curves (perf stress) | PD Mark 1.0 (1887 fleuron) | https://commons.wikimedia.org/wiki/File:Typographic_ornament_01.svg | 1 path (very high node count) | `fill:none; stroke:#000` — stroke only | none (w/h 479.18×294.66) |
| brain-line-art (SKIPPED) | Stroke-only line drawing (CC0) | CC0 | https://commons.wikimedia.org/wiki/File:Brain-outline-lateral.svg | n/a | n/a | n/a |
| anglo-american-card-suits.svg | MULTIPLE DISJOINT SHAPES in one file (4 suits) — multi-shape fill region detection | CC-BY-SA 3.0 (+GFDL) | https://commons.wikimedia.org/wiki/File:Anglo-American_card_suits.svg | 4 disjoint paths | Filled (black + red), mixed nonzero/evenodd | none (w/h 816×1056) |
| annulus-donut.svg | Multi-path with HOLES (donut/ring via stacked arcs) + radial gradients + live `<text>` + transforms | PD | https://commons.wikimedia.org/wiki/File:Annulus.svg | 4 paths + 2 `<text>` | Gradient-filled arcs + `fill:none` stroke marks | none (w/h 600×600) |
| public-domain-map-logo.svg | Logo / symbol with knockouts as path outlines (text-as-path style, `fill-rule:nonzero` holes) | PD (below threshold of originality) | https://commons.wikimedia.org/wiki/File:Public_Domain_Map_logo.svg | 1 compound path w/ multiple subpath knockouts | Filled #5451C5, no stroke | 0 0 500 500 |
| color-square-pattern.svg | File using an SVG `<pattern>` fill (also `<clipPath>` + nested `<use>`/`xlink` + rotations + viewBox/size mismatch) | CC-BY-SA 3.0 (+GFDL) | https://commons.wikimedia.org/wiki/File:Color_square_cm.svg | 1 `<pattern>` (10 circles ×9 `<use>`), 1 filled `<rect>` | `fill="url(#Pattern)"` pattern fill | 0 0 800 800 (rendered 3000×3000) |
| linear-gradient.svg | File using a GRADIENT fill (`linearGradient`) | CC-BY-SA 3.0 (+GFDL) | https://commons.wikimedia.org/wiki/File:Linear-gradient.svg | 2 `<rect>` + 1 `<linearGradient>` | 1 gradient-filled rect + 1 `fill:none` stroked rect | none (w/h 120×120) |
| fillrule-evenodd-star.svg | SELF-INTERSECTING / degenerate path (5-point star) + `fill-rule:evenodd` + gradient + SMIL `<animate>` | CC-BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Svg_Demo_fillrule-evenodd.svg | 1 self-intersecting path + `<animate>` | Gradient fill + black stroke, evenodd | none (no width/height) |
| herringbone-tiling.svg | Multiple disjoint rects via `<use>` instancing + degenerate MALFORMED transform `translate(17-51)` (missing comma) | PD (text-editor authored) | https://commons.wikimedia.org/wiki/File:Herringbone_pattern_as_hexagonal_tiling.svg | 4 `<rect>`, 10 `<use>`, 2 `<g>` | Filled rects + black stroke | 0 0 216 208 |
| github-icon.svg | TINY / minimal geometric icon (single path) | CC0 1.0 | https://github.com/simple-icons/simple-icons (https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/github.svg) | 1 path | No explicit fill (inherits currentColor) | 0 0 24 24 |
| nintendo-switch-icon.svg | Simple geometric icon (single path w/ counter holes) | CC0 1.0 | https://github.com/simple-icons/simple-icons (https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/nintendoswitch.svg) | 1 path | No explicit fill (inherits currentColor) | 0 0 24 24 |
| x-twitter-icon.svg | TINY minimal icon with self-overlapping path + counter knockout | CC0 1.0 | https://github.com/simple-icons/simple-icons (https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/x.svg) | 1 path | No explicit fill (inherits currentColor) | 0 0 24 24 |
| bootstrap-heart-icon.svg | Simple geometric icon, single path w/ `fill="currentColor"`, negative coords | MIT | https://github.com/twbs/icons (https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/heart.svg) | 1 path | `fill="currentColor"`, no stroke | 0 0 16 16 |
| bootstrap-gear-icon.svg | Simple geometric icon, TWO paths (outer + inner hole = donut knockout via 2 paths) | MIT | https://github.com/twbs/icons (https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/gear.svg) | 2 paths | `fill="currentColor"`, no stroke | 0 0 16 16 |

## Edge-category coverage summary (15 files downloaded)

- Complex FILLED compound path (rose-like): **cat-silhouette.svg**, **public-domain-map-logo.svg**
- STROKE-ONLY line drawing: **typographic-ornament.svg** (also intricate); **annulus** stroke marks
- MULTI-PATH with HOLES (evenodd / donut knockouts): **annulus-donut.svg** (stacked-arc donut), **bootstrap-gear-icon.svg** (outer+inner), **public-domain-map-logo.svg** (nonzero knockouts), **x-twitter-icon.svg** (counter)
- MULTIPLE DISJOINT SHAPES: **anglo-american-card-suits.svg** (4 suits), **herringbone-tiling.svg** (instanced rects)
- Logo with text/symbol as PATHS: **public-domain-map-logo.svg**
- Very INTRICATE / high-node (perf stress): **typographic-ornament.svg**, **skull-and-crossbones.svg**
- TINY / minimal icon: **x-twitter-icon.svg** (253 bytes), **github-icon.svg**, **nintendo-switch-icon.svg**
- SELF-INTERSECTING / weird / degenerate: **fillrule-evenodd-star.svg** (self-intersect + SMIL animate), **herringbone-tiling.svg** (malformed `translate(17-51)`)
- File using `<pattern>` or gradient: **color-square-pattern.svg** (`<pattern>`), **linear-gradient.svg** (`linearGradient`), **annulus-donut.svg** (`radialGradient`), **fillrule-evenodd-star.svg** (`linearGradient`)
- Simple geometric icons: **github-icon.svg**, **nintendo-switch-icon.svg**, **bootstrap-heart-icon.svg**, **bootstrap-gear-icon.svg**

### Bonus stress features present (beyond the requested categories)
- `<clipPath>` + nested `<use>`/`xlink:href` deep instancing + rotation transforms: color-square-pattern.svg
- SMIL `<animate>` (animated `d`): fillrule-evenodd-star.svg
- Live `<text>`/`<tspan>` elements (font-dependent rendering): annulus-donut.svg
- `<filter>`/`feGaussianBlur` was considered (Hatching.svg) but not shipped (see skips)
- Inkscape/sodipodi proprietary attributes (`sodipodi:type="arc"`): annulus-donut.svg
- viewBox vs width/height mismatch (3000px render, 800 user units): color-square-pattern.svg
- Missing width/height/viewBox entirely (intrinsic-size ambiguity): fillrule-evenodd-star.svg

## Skipped candidates (and why)

- **Brain-outline-lateral.svg** (CC0, stroke-only line art) — SKIPPED: file too large; WebFetch raw retrieval exceeded the 32k-token output cap, so verbatim bytes could not be captured. Stroke-only category is already covered by typographic-ornament.svg.
- **Cessna 172 Skyhawk line drawing.svg** (PD, 39 KB, stroke-only multi-view) — SKIPPED: WebFetch summarizer refused (false-positive "proprietary technical drawing"); also near the size cap.
- **Charts SVG Documented Fill Patterns.svg** (CC-BY-SA, real `<pattern>` ×49) — SKIPPED: 19 KB, too large to retrieve in full without truncation; `<pattern>` category covered cleanly by the smaller color-square-pattern.svg.
- **Cross-hatching.svg** (PD, 65 KB) — SKIPPED: too large for WebFetch; `<pattern>` use unconfirmed.
- **Hatching.svg** (PD) — retrieved but NOT shipped: turned out to be a single evenodd crosshatch path + `<filter>` blur, not a true `<pattern>` element (named misleadingly).
- **Fourrure héraldique Vair.svg** (CC-BY-SA, 144 B) — retrieved but NOT shipped: a single bell-shape path, no `<pattern>` element (not the heraldic-fur tiling expected).
- **Svg-pattern nevit 011.svg** (CC-BY-SA, 176 B) — retrieved but NOT shipped: misleadingly named; it is one two-triangle path with no `<pattern>` element.
- **freesvg.org "Outline drawing of African animals" (CC0)** — SKIPPED: freesvg.org's download endpoint returned empty via WebFetch (session-gated); only a PNG preview was reachable, no raw SVG bytes.
- **Skull (first WebFetch attempt)** — REJECTED: WebFetch returned a fabricated simplified SVG (rounded circles/ellipses). Detected via a structure-only verification fetch; the real 12-path file was re-fetched and shipped instead.
