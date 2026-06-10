# F3 toggle architecture — evolving, post-Phase 2

> Date opened: 2026-05-31
> Owner: Hero #8 / F3 Desk family
> Status: Live — extended as new dimensions surface. NOT a lock doc.

This captures the toggle dimensions that have surfaced across F3-A and F3-B
build work. Lives outside `F3-B-desk-vertical-column.md` because most of these
toggles apply to all F3 concepts (Pegboard / Trophy Wall / Floating Canvas /
future) and the F-cell research docs are scoped to per-cell research only.

---

## The 7-axis toggle taxonomy

| # | Toggle | Dimension | Scope | Built? |
|---|---|---|---|---|
| 1 | **Concept** | What surface the items live on | per-cell (F3-A vs F3-B differ) | ✓ |
| 2 | **Path** | Render technology | per-concept | ✓ (Trophy Wall has both; Pegboard SVG-only) |
| 3 | **Subject form** | Object catalog — which object renders for each CIS subject | per-concept × per-subject | ✓ Pegboard · ⏳ Trophy Wall + Floating Canvas |
| 4 | **Hang mechanism** | How items attach to the surface | Pegboard-only | ✓ |
| 5 | **Style** | How lines are drawn / how surfaces are rendered | per-path | ⏳ pending |
| 6 | **Interaction** | How items behave in the scene | per-path | ⏳ pending |
| 7 | **Fidelity** | Which source-asset fidelity drives the shape render | per-shape (runtime A/B) | ⏳ pending |

**Fidelity axis (axis 7) detail:** Each shape can have multiple source-asset
fidelity variants (**low / mid / high / x-high**, same 4 levels for both SVG
and 3D). The user toggles between them at runtime to see which fidelity reads
best against the active style. Only meaningful for shapes that have multiple
fidelity variants produced — the 4-shape SVG starter set + 2-3 3D starter set
in lab. The other ~127 shapes stay as their single low-fi placeholder (the
Fidelity toggle no-ops for them).

**CRITICAL — Fidelity ≠ quality.** All fidelity variants are HIGH QUALITY
renders. The 4 levels refer to **level of detail / visual complexity**, NOT
polish. Every variant is a properly-produced asset (clean paths via Quiver
for SVG; proper topology + materials for 3D). The differentiation is HOW MUCH
DETAIL the source carries:

- **Low** = minimal detail, distilled silhouette. SVG: ~2-5 paths, signature
  shape only. 3D: low-poly, simplest topology, no surface texture detail.
- **Mid** = moderate detail. SVG: signature shape + key inner details. 3D:
  mid-poly, basic surface details (creases, edges).
- **High** = full detail. SVG: all distinguishing features + texture hints.
  3D: high-poly, full surface detail, normal/material variation.
- **X-high** = maximum detail. SVG: photoreal-vector level (every line that
  reads). 3D: subdivided / displacement / full PBR materials.

Default fidelity: `auto` (picks the recommended fidelity-per-style per shape
based on calibration findings — e.g., rough-handdrawn auto-resolves to low/mid
since rough.js noise overwhelms high detail). User can override per shape.

Subject toggle (CIS = Core Identity Set) replaced the per-item visibility chip
row for Pegboard. Each subject's dropdown has `off` + N form variants. 14
subjects defined: sketching · work-rig · punk · nintendo · movies · pokemon ·
sony · wwe · travel · gf · running · roots · fidget · seltzer.

**Note on `sketching` + `work-rig`:** These are TRAIT subjects (how Sebs
works), not project subjects. Earlier draft used `elara` + `ion` which
conflated trait-register (I sketch on paper / MacBook as main rig) with
project-navigation (link to Elara / Ion case studies). Refactored 2026-05-31
to trait-first naming + captions. Click actions still hidden-link to case
studies as a delight, but labels read trait-first.

---

## Style toggle — proposed options

Per-path because the rendering register differs by tech.

**SVG (Path 2) style options:**
- `clean` — current crisp vector strokes (default)
- `outline-only` — strokes only, no fill washes
- `rough-handdrawn` — apply `rough.js` multi-stroke jittered Bezier per stroke,
  sibling-coherent with the playground's C3 UserFlow + B1 Venn + D1 Wavy
  Spectrum stroke vocabulary. Multi-stroke layered (2-3 passes per edge with
  seed offsets) per existing `lib/handFeel` calibration

**3D (Path 1) style options:**
- `filled-toon` — flat-shaded fills + toon shader (existing Trophy Wall Path 1)
- `outline-edges` — `EdgesGeometry` + thin line material on top of mesh; clean
  outline accent over filled fill
- `wireframe` — pure wireframe, no fill
- `rough-edges-handdrawn` — **research pass required first**. Technique:
  extract mesh edges via `EdgesGeometry`, project edges to screen-space via
  the camera, run 2D polylines through `rough.js` to get jittered strokes,
  render the resulting strokes as an SVG overlay on top of the 3D canvas.
  Needs validation that the projection holds cleanly as geometry rotates
  (otherwise the strokes would re-jitter every frame and produce wobble)

---

## Interaction toggle — proposed options

Per-path because 2D and 3D have different interaction registers.

**SVG (Path 2) interaction options:**
- `static` — line stays still (default)
- `auto-redraw` — `rough.js` re-rolls the strokes every N seconds; looks like
  the drawing is being re-sketched live
- `hover-redraw` — re-roll strokes only while hovered (less aggressive)
- `drift / wobble` — slight position jitter so items appear to float (paper
  on cork-board feel)

**3D (Path 1) interaction options:**
- `static` — fixed orientation (default)
- `auto-rotate` — slow continuous spin on Y axis
- `hover-spin` — spins only while hovered, returns to rest on leave
- `drag-rotate` — user grabs and rotates manually (drei `<PresentationControls>`)
- `auto-tour` — cycles through 4-5 key angles on a loop

Probably global per-concept (not per-subject — too jarring if items behave
differently).

---

## Build order (locked 2026-06-01, corrected)

CIS structural extension is COMPLETE across all 4 concepts (F3-A desk + F3-B
Pegboard / Trophy Wall / Floating Canvas).

User direction 2026-06-01: **finish F3-B SVG fully → finish F3-A SVG fully →
THEN 3D phase**. Don't interleave families. Don't interleave SVG and 3D.

### Phase 1 — F3-B SVG (complete this before any F3-A SVG)

1. **SVG style toggle on F3-B** (against current low-fi SVG placeholders) —
   reuses `lib/handFeel` / `rough.js` calibration from playground artifacts.
   Builds the path transformation layer (clean / outline-only / rough-handdrawn).
2. **SVG interaction toggle on F3-B** — animation layer (static / auto-redraw /
   hover-redraw / drift).
3. **SVG fidelity toggle** — runtime A/B between source-asset fidelity variants
   per shape. Only meaningful for shapes that have multiple fidelity variants
   produced (i.e., the 4-shape calibration set in step 4).
4. **4-shape SVG calibration pass on F3-B** via Quiver / Gemini — the ONLY
   in-lab high-quality asset production. Generate low/mid/high/x-high fidelity
   variants for the 4 starter shapes, wire into the fidelity toggle, A/B every
   combination across the 3 style variants. Lock fidelity-per-style learnings
   per shape.

**That's the full in-lab SVG asset scope: 4 shapes, ~16 source variants (4
shapes × 4 fidelities), wired live for calibration.** The remaining ~127
shapes stay as inline-JSX low-fi placeholders in the lab and defer to the
website build. User direction 2026-06-01: only a HANDFUL get high-quality
treatment in the lab. Mass production is the website build's job, not the
lab's.

### Phase 2 — F3-A SVG (complete this before any 3D)

5. **F3-A Path 2 SVG port** — adds SVG variant to F3-A horizontal desk.
   Component build (`F3_A_DeskScene_Path2.tsx`) using shared shape catalog.
   F3-A subjects gain `position2D` field alongside `position3D`. Path toggle
   expands from `F3BPathContext` → `F3PathContext`. Inherits Phase 1 style +
   interaction + fidelity wiring automatically.
6. **F3-A SVG asset coverage = inherited.** F3-A automatically inherits F3-B's
   4-shape high-quality calibration set (since the shape catalog is shared —
   mechanical pencil is mechanical pencil). No additional production in lab.
   Any F3-A-only shapes (if curated later) defer to the website build.

### Phase 3 — 3D (open only after Phase 1 + Phase 2 done)

7. **3D basic-identifiable-form pass** — replace current generic-primitive
   placeholders (boxes/cylinders) with composed primitives that READ as the
   object (basic blocky shoe that reads as a shoe; basic Pokéball as sphere
   + center band). Parallels how SVG placeholders are already identifiable
   silhouettes. THIS IS THE QUALITY BAR — not generic primitives.
8. **3D style toggle** — research pass first (`rough-edges-handdrawn` via
   EdgesGeometry projection — does it hold under rotation?), then build.
9. **3D interaction toggle** — drei has the building blocks
   (`<PresentationControls>`, `useFrame` rotation loops).
10. **3D fidelity toggle** — runtime A/B between 4 fidelity variants per
    shape (low / mid / high / x-high — same 4-level scheme as SVG, parity).
    For 3D: low = lowest-poly distilled topology, x-high = subdivided +
    full materials. Only meaningful for the 2-3 starter shapes that get
    multi-fidelity treatment in lab.
11. **3D calibration pass** — same handful approach: 2-3 starter 3D shapes,
    generate 4 fidelity variants each via Tripo / Meshy / Blender, A/B
    across style variants. Lock fidelity-per-style learnings. Mass 3D
    production defers to website build (curated 10-15 subset; flat
    memorabilia doesn't benefit from 3D so the count is naturally smaller
    than SVG).

**Key sequencing principle:** complete one phase before opening the next.
Don't interleave. The structural CIS extension to F3-A I shipped 2026-06-01
is wiring-only — F3-A doesn't get deepened until Phase 2 opens.

**Key scope principle:** the lab only produces high-quality assets for a
handful of starter shapes (4 SVG + 2-3 3D). Mass production happens in the
website build phase, NOT in this lab. The lab proves the technique; the
website implements at scale.

---

## Why we hold style + interaction toggles until CIS extension finishes

If style/interaction toggles ship before CIS extends to Trophy Wall + Floating
Canvas, the new toggles get wired only into Pegboard and have to be patched
into the other two concepts later (drift risk). Extending CIS first means new
toggles apply universally once landed.

---

## SVG asset pipeline interaction with the style toggle

Current state: 131 SVG shapes are LOW-FI placeholders drawn inline as JSX
primitives (rect / circle / line / path / text). Functional, recognizable,
but not the final asset register.

**Eventual pipeline:** high-quality SVGs generated via Gemini / ChatGPT image 2 /
Quiver per `reference_vector_asset_tools`. Each shape gets a clean
single-glance line-illustration asset.

**Critical interaction with the style toggle:**

The style toggle (clean / outline-only / rough-handdrawn) operates on the
SAME source SVG via programmatic transformation. Single asset, multiple
render styles:

- `clean` — render source SVG as-is (strokes + fills as drawn)
- `outline-only` — strip fills, keep strokes only — derived from source
- `rough-handdrawn` — pass source paths through `rough.js` for jittered
  multi-stroke renders — derived from source

This means the source SVG must be **rough.js-compatible**:
- Path-based (or use SVG primitives that rough.js handles natively: `rect`,
  `circle`, `ellipse`, `line`, `polygon`)
- No filter effects or rasters — would break the path-traversal transform
- Stroke + fill encoded as attributes, not inline styles (rough.js can
  re-roll the stroke; the fill needs to be readable for outline-only)

**Sequencing recommendation:**

Build the **style toggle architecture against current low-fi placeholders
FIRST**. Then swap high-quality SVGs in as a localized refactor (replace
the contents of each `<svg>` element in the `PegToolShape` / `PinShape`
switches). The style transform code gets validated against known shapes;
the asset swap is then a contained, repeatable task per shape.

DO NOT swap high-quality SVGs first then build style toggle — risks
discovering the assets aren't rough.js-compatible and needing re-generation.

**Per-asset workflow when swap time comes:**
1. Generate clean line-illustration source via Gemini / ChatGPT image 2 / Quiver
2. Optimize via SVGO (drop unused groups, simplify paths, inline attributes)
3. Inline into the shape switch as JSX
4. Verify all three style variants render correctly (clean / outline-only / rough)
5. Visual review against the wall composition (size, balance, single-glance read)

---

## Family A vs Family B — perceptual frame, not content (2026-06-01)

Same OBJECTS across families (shape catalog shared 1:1). What differs is the
**viewing relationship** the layout creates. Family A is "the portrait in the
entryway"; Family B is "the photo on your desk you see all day." Same person,
same image even — different relationship to the viewer.

### Design dimensions that change per family

| Dimension | Family A · MOMENT (band above work) | Family B · ONGOING (column alongside work) |
|---|---|---|
| Item count | More allowed (8-14); viewer commits attention here once | Fewer / staggered (5-9); items compete with work cards |
| Spatial distribution | Spread laterally across band — all items visible simultaneously | Distributed vertically through column — items encountered sequentially as user scrolls |
| Composition logic | Items add to ONE scene (movie still). Whole frame = the moment | Each item is its OWN moment (feed / album). No single composed image |
| Item posture | Performative / arranged. Items feel deliberately placed | Casual / accumulated. Items feel collected over time |
| Hover register | Concentrated exploration. Viewer hovers across band trying every item | Distributed ambient noticing. Some items hovered, others not |
| Text placement | Title + identity copy as CAPTION to the scene (below/above/beside band) | Title + identity copy as continuous REFERENCE beside the column |
| Density per viewport | Higher — viewer is in "absorb mode" | Lower — attention split with work cards; density overwhelms |
| Rhythm dimension | Compositional (clusters / gaps in 2D — still photograph) | Temporal (intervals through scroll position — piece of music) |
| Reading time | Bounded — viewer reads MOST items before scrolling | Open — viewer reads SOME items over the work-browsing session |
| Sense of completion | Scene COMPLETES when viewer scrolls past | No completion — hero just stays |
| Posture language | Lie flat, lean, prop, group — "still life" arrangement | Hang, pin, accumulate — "wall ledger" |

### How each hero looks in concrete terms

**F3-A horizontal band:** Sebs's desk, viewed slightly from above, as a single
composed scene. Mechanical pencil resting on the open sketchbook. MacBook
closed at the center. Vinyl LP propped against the right edge. Race medal
hanging from a clip. Pokéball on the desk. Boarding pass tucked under a mug.
Everything visible simultaneously — viewer sweeps left-to-right, takes the
desk in as one image, scrolls down. Composition has a center of weight,
items group naturally. It's a STAGED moment.

**F3-B vertical column:** Sebs's wall, encountered while the viewer scrolls
work cards beside it. Top: framed sketch + race medal — visible while
reading the first project. Mid: vinyl LP + pinned Pokémon photo — visible
during middle projects. Bottom: boarding pass + Polaroid — visible at the
bottom of the work column. Viewer never fully absorbs the wall; it
accompanies. Items feel less arranged, more accumulated. The wall ledger
never resolves into a single composed moment — it's an ongoing presence.

### Practical implications for the F3-A port

1. **F3-A defaults run denser** than F3-B — more subjects default-on (10-12), items closer.
2. **F3-A composition language = arranged / staged** — tilts that suggest items were placed; F3-B language = accumulated.
3. **F3-A reads as ONE FRAME** — composition has to balance as a whole. F3-B reads as a SEQUENCE — composition has to work at any scroll position.
4. **F3-A hover can be more aggressive** (concentrated discovery moment); F3-B hover should be subtler (ambient surfacing).
5. **F3-A item count: ~10-12 default-on.** F3-B item count: ~6-9 default-on.

---

## Asset calibration pass — locked approach (2026-05-31)

User direction: don't mass-produce 131 high-quality SVGs. Instead validate
the pipeline on a small starter set, lock the process, then either keep
fine-tuning OR defer mass production to the real-website build phase.

**Insight: fidelity per style.** Different render styles benefit from
different SOURCE fidelity levels:
- `clean` style → HIGH source fidelity (sharp paths, all detail reads)
- `outline-only` style → MID fidelity (too much detail = busy outlines)
- `rough-handdrawn` style → LOW or MID fidelity (rough.js adds visual noise;
  less source detail prevents the result from becoming a mess)

**Starter set (4 shapes, spans visual variety):**

| # | Shape | Subject · Register | Why |
|---|---|---|---|
| 1 | Mechanical pencil | sketching · Pegboard ★ default | Thin geometry — tests rough.js on fine paths |
| 2 | Stickered laptop lid | work-rig · Trophy Wall ★ default | HIGH detail composite — tests fidelity ceiling |
| 3 | Race medal w/ ribbon | running · Trophy Wall ★ default | Composite (ribbon + disc) — tests compound shapes |
| 4 | Pokéball | pokemon · Pegboard ★ default | Symmetric / iconic / low detail — baseline ("easy mode") |

If the style transform reads cleanly across all four, the technique
generalizes.

**Workflow per shape:**
1. Source generation — feed reference photo to Quiver (or generate via
   ChatGPT image 2 / Gemini) → SVG at low / mid / high / x-high fidelity
   (4 source candidates per shape)
2. Build the style toggle architecture (clean / outline-only / rough-handdrawn
   render paths)
3. A/B all 4 sources × 3 styles per shape = 12 combos per shape · 48 total
4. Pick the best source-fidelity-per-style PER SHAPE (might differ per shape —
   that's a finding worth recording)
5. Lock the process when patterns emerge

**3D pipeline = same pattern.** Pick 2-3 objects from the same 4, generate
via Tripo / Meshy / Blender at different topology densities, validate
filled-toon / outline-edges / wireframe / rough-edges-handdrawn across each.

**When this calibration pass runs:** after the Floating Canvas CIS extension
lands (completes the structural extension), and before mass production of
the remaining 127 shapes. The calibration pass is its own bounded
mini-workstream.

---

## Known issues / open work — SVG style toggle (Phase 1 step 1)

### Hover accumulation bug (2026-06-01)

**Symptom:** When Style = Rough hand-drawn, hovering items causes the rough
strokes to multiply / layer over each other. Each hover adds another rough
pass.

**Root cause:** `SvgStyleTransform` does DOM mutation inside the React-managed
SVG. React re-renders parent on hover (hover state changes) → `useEffect`
re-runs → `transformElement` traverses children → hits the previous rough-output
`<g>` elements still in the DOM → recurses into their `<path>` children → runs
rough.js on the already-rough paths. Rough-of-a-rough on every render.

**Fix plan (not yet shipped):** Dual-render approach. Render the clean SVG in
a hidden div (React-managed, untouched). On rough mode, CLONE the clean SVG
into a separate parallel div and apply the rough transform on the clone.
Each hover / state change re-clones from the untouched source — no
accumulation possible.

```tsx
<div>
  <div ref={cleanRef} style={{ display: rough ? 'none' : 'block' }}>{children}</div>
  <div ref={roughRef} style={{ display: rough ? 'block' : 'none' }} />
</div>
```

useEffect: clone cleanRef's `<svg>` into roughRef on every style/children change,
then apply rough transform to the clone.

### Style options — full inventory (2026-06-01)

User direction: **every style must be portable to BOTH SVG and 3D.** Cross-path
register parity — same Style value, different implementation per path, same
visual register. Style toggle becomes a cross-path dimension, not per-path.

Per the "more options = better" rule, building the FULL inventory in one pass
rather than trimming. Each row needs both an SVG implementation AND a 3D
implementation; they MUST stay in sync.

| # | Style | SVG implementation | 3D implementation |
|---|---|---|---|
| 1 | **Clean** | Source SVG as-drawn (default) | `meshStandardMaterial` default flat fill (current Trophy Wall Path 1 behavior) |
| 2 | **Outline only** | CSS strips fills; keep strokes | `EdgesGeometry` + thin line material on transparent fill |
| 3 | **Rough hand-drawn** | rough.js multi-stroke jittered Bezier | `EdgesGeometry` → screen-space projection → rough.js overlay. **Rotation-stable** via one of: stable seed / temporal smoothing / edge-stable jitter / pre-baked (research-required) |
| 4 | **Sketchy** | Gentler rough (lower roughness, fewer strokes) | Same as rough but lighter parameters |
| 5 | **Bold ink** | Heavier strokeWidth (~2.5+), less jitter | Thick `EdgesGeometry` strokes with darker material |
| 6 | **Wet ink** | SVG `feGaussianBlur` filter on strokes | `EdgesGeometry` + Gaussian blur post-process pass |
| 7 | **Stipple** | Dot-pattern fills instead of solid/hachure | Edge overlay with dot pattern (custom shader OR per-edge dot decals) |
| 8 | **Charcoal / pencil** | `feTurbulence` filter overlay on strokes | Textured stroke material with `feTurbulence`-baked normal map |
| 9 | **Risograph** | Each path duplicated in 2 colors w/ subtle offset | Each edge duplicated in 2 colors w/ pixel-offset on screen-space |
| 10 | **Newsprint / halftone** | Dot-pattern fills via SVG `<pattern>` | Halftone post-process pass on the 3D render |
| 11 | **Wireframe** | Bounding-box / simplified outline only, no fills | Three.js `WireframeGeometry` (built-in) |

**Build expansion order:** wire all 11 as toggle options across both paths.
For SVG, ship 1-4 first (Clean / Outline-only / Rough / Sketchy) since they're
the closest variations of the same technique. Then 5-7 (Bold ink / Wet ink /
Stipple). Then 8-11 (Charcoal / Risograph / Newsprint / Wireframe). For 3D,
defer until Phase 3 but design the cross-path API now so 3D inherits the
same Style enum.

### Modifier toggles — section structure (2026-06-01)

Currently `SvgStyleTransform.tsx` hardcodes rough.js parameters (roughness 1.4,
bowing 0.8, strokeWidth 1.2, fillStyle 'hachure', hachureGap 4, hachureAngle -41).
These should become user-toggleable in a SEPARATE chrome section that only
shows when Style = Rough hand-drawn.

**Three groups.** Per `feedback-more-toggle-options-better` rule, every
graduated toggle gets **6+ steps** (or a continuous slider). Don't trim ranges.

| Group | Toggle | Range (8 steps each unless noted) |
|---|---|---|
| **Line** | Roughness | Off · Very-low · Low · Mid-low · Mid · Mid-high · High · Very-high (8) |
| **Line** | Bowing | 0 · 0.2 · 0.4 · 0.6 · 0.8 · 1.0 · 1.5 · 2.0 (8) |
| **Line** | Stroke width | 0.5 · 0.75 · 1.0 · 1.25 · 1.5 · 2.0 · 2.5 · 3.0 (8) |
| **Line** | Curve tightness | 0 · 0.1 · 0.2 · 0.4 · 0.6 · 0.8 · 1.0 · 1.5 (8) |
| **Line** | Multi-stroke | Off · Single · Double · Triple · Quad (5 — small set OK; binary-ish) |
| **Line** | Simplification | 0 · 0.1 · 0.2 · 0.3 · 0.5 · 0.7 · 0.9 · 1.0 (8) |
| **Shading** | Fill style | None · Solid · Hachure · Cross-hatch · Dots · Zigzag · Dashed · Zigzag-line (8) |
| **Shading** | Hachure gap | 1 · 2 · 3 · 4 · 6 · 8 · 12 · 16 px (8) |
| **Shading** | Hachure angle | -90 · -60 · -41 · -30 · 0 · 30 · 41 · 60 · 90° (9) |
| **Shading** | Fill density | Off · Very-light · Light · Mid-light · Mid · Mid-dense · Dense · Very-dense (8) |
| **Coloring** | Ink intensity | Very-light · Light · Mid-light · Mid · Mid-dark · Dark · Very-dark · Max (8) |
| **Coloring** | Fill opacity | 0% · 8% · 16% · 24% · 32% · 48% · 64% · 80% · 100% (9) |
| **Coloring** | Palette mode | Source · Accent · Neutral · Inverted · Direction-token (5 — discrete) |

Conditional UI: section hides for Clean / Outline-only styles (no rough
parameters to tune). For Rough hand-drawn + Sketchy + Bold ink etc., the
section shows. Show as inline chrome rows (wrapping) OR collapsible panel —
decide at implementation time.

### 3D rough-handdrawn port — rotation stability research

User requirement 2026-06-01: rough-handdrawn style MUST port to 3D AND must
work when objects are rotatable (drag-rotate / auto-rotate / auto-tour).

**Critical concern:** when 3D objects rotate, mesh edges re-project frame-by-frame.
If rough.js re-jitters every frame, strokes "wobble" constantly. This is
research-blocking — must find a stable approach BEFORE building 3D style toggle.

**Solutions to research (Phase 3 prerequisite):**

1. **Stable seed** — lock rough seed per-object so jitter pattern stays
   constant regardless of angle. Trade-off: strokes don't respond to the
   new edge geometry on rotation; might look "stuck."
2. **Temporal smoothing** — re-jitter at fixed intervals (e.g., 250ms) rather
   than every frame. Strokes refresh but not jarringly.
3. **Edge-stable jitter** — jitter as a function of the edge's WORLD-space
   position, not screen-space. The same edge always jitters the same way
   regardless of camera angle. Most rigorous approach.
4. **Pre-baked** — pre-render rough strokes for N camera angles (e.g., 8 or
   16), interpolate between them. Higher memory cost but stable.

Decision deferred to Phase 3 research pass.

---

## Open research items

- `rough.js`-on-3D-edges via `EdgesGeometry` projection — does the projection
  remain stable as the geometry rotates, or do strokes re-jitter every frame?
  Look for prior art / reference implementations before committing to the
  technique
- Whether `drei <PresentationControls>` per-item plays nicely with the
  Pegboard wall plane background and other items in the scene
- Whether auto-rotate at item-scale conflicts with the scroll-through-card
  read pattern (column persists while user scrolls past featured card)

---

## Cross-refs

- Pegboard CIS + form toggle landed 2026-05-31 — see
  `f3CoreIdentitySet.ts` + `F3SubjectFormsContext.tsx` + Hero8Shell Row 6
- Hang mechanism toggle landed 2026-05-31 — see `F3PegboardHangContext.tsx`
- Playground rough.js stroke vocabulary — see `lib/handFeel.ts` +
  `C3UserFlow.tsx` + `B1VennPositioning.tsx` + `D1WavySpectrum.tsx`
- Core directive: finish Desk family fully before opening next F-family
  ([[project-hero-8-finish-desk-first]])
