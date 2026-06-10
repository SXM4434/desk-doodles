# Phase 0 — Hero-8-Lab Foundation Pass

**Goal:** every toggle's options work + every interconnection per `19-research-cross-axis-interconnection.md` matrix fires + clusters lock + 4 named regressions restored. THEN fork to Desk Doodles.

**Why here first:** forking broken toggles propagates broken behavior into Desk Doodles. Foundation in Hero-8-Lab is validated against real F3-B Trophy Wall pins. Fork-with-port-everything then transfers a WORKING system.

**Days:** 1–4 of the 15-day makeathon plan.

**Deliverables:**
- All toggle options visually distinct (no dead values, no stub values)
- Every direct pair-wise interaction (→ cells in §C matrix) firing in code
- N-way compounds from §D firing
- 5 clusters from §E locked in state + chrome
- 4 regressions restored: wobble, path polyline, conditional nudge, kink decision
- `09-LOCKED-MODEL.md` updated with I-11/I-12/I-13/I-14
- All 6 Trophy Wall test pins pass visual sign-off across every fillStyle × Style combo

---

## Per-toggle audit (every option must be visually distinct, no stubs)

For each toggle, validate every value renders distinctly against the framedFlyer test pin. If a value produces the same output as another value, fix or remove.

### Multi-Stroke cluster

| Toggle | Values | Audit checklist |
|---|---|---|
| `wobble` | 0 / 0.5 / 1.0 / 1.4 (warn) / 2.0 (extreme) | NEW — added Day 1. Multiplies HAND_FEEL_BASE. Each value visibly different jitter while preserving per-shape ratio |
| `roughness` | 0 / 0.25 / 0.5 / 0.75 / 1.0 / 1.5 / 2.5 | Each tick produces distinct jitter amplitude. Working in playground; verify in rebuild |
| `bowing` | 0 / 0.25 / 0.5 / 1.0 / 1.5 / 2.5 | Each tick produces distinct perpendicular displacement. Currently broken per Sebs's report |
| `curveTightness` | 0 / 0.25 / 0.5 / 0.75 / 1.0 | Each tick changes curve fitting. Verify against curved-pin (vinyl LP sleeve) |
| `strokeWidth` | 0.5 / 0.75 / 1.0 / 1.25 / 1.5 / 2.0 | Linear progression. Pen-tip should scale proportionally |
| `multiStroke` | off / single / double / triple / quad / quint / six / heavy (0-8 layers) | Each value renders distinct layer count. Layer 0 = 1.25× width; layers ≥1 = 1.0× |
| `endpointBehavior` | clean / protrude / long-overshoot / kink* | *kink: decide drop name OR build randomized-angle. Each remaining value distinct |
| `sketchingStyle` | single-pass / loose-overlap / parallel-pass / cross-hatch | Each layer pattern distinct. Validate at strokeCount=3+ |

### Pen Tip cluster

| Toggle | Values | Audit checklist |
|---|---|---|
| `penTip` | plain / ballpoint / fineliner / pencil-hb / pencil-2b / felt-tip / chisel / charcoal | All 8 presets visually distinct. Currently per-shape size scaling differs from playground; calibrate |

### Shading cluster (Smart Hachure)

| Toggle | Values | Audit checklist |
|---|---|---|
| `fillStyle` | none / solid / hachure / cross-hatch / dots / zigzag / dashed / zigzag-line | Each fillStyle produces distinct mark grammar. Locked per `09-LOCKED-MODEL.md` D-4.b (each its own family) |
| `hachureGap` | 1.5 / 2 / 3 / 4 / 6 / 8 / 12 | Each value distinct line spacing. Floor at 1.5px |
| `hachureAngle` | -90 / -45 / -41 (default) / 0 / 45 / 90 | Each angle distinct orientation. Verify on rectangular pins |
| `fillDensity` | 0.25 / 0.5 / 0.7 / 1.0 / 1.2 | Each tick scales weight. Capped at gap × 0.7 |
| `fillOpacity` | 0.25 / 0.5 / 0.75 / 1.0 | Linear progression |
| `inkIntensity` | 0.5 / 0.75 / 1.0 | Linear; multiplies fillOpacity for hachure |

### Surface Texture cluster

| Toggle | Values | Audit checklist |
|---|---|---|
| `texture` | none / light / heavy / chalky / paper-tooth / ribbed / stipple / wet-ink / smudge / canvas | All 10 visually distinct. Each is a different feTurbulence + feDisplacementMap recipe |
| `textureIntensity` | 0 / 0.25 / 0.5 / 0.75 / 1.0 | Scales active filter's displacement |
| `blurAmount` | 0 / 0.5 / 1 / 2 / 4 | For wet-ink, soft-edges; verify each tick distinct |
| `bleed` | 0 / 0.25 / 0.5 / 1.0 | For wet-ink expansion |
| `grainIntensity` | 0 / 0.25 / 0.5 / 1.0 | For chalky/charcoal grain |
| `smudgeAmount` | 0 / 0.25 / 0.5 / 1.0 | For smudge texture |
| `pressureVariance` | 0 / 0.25 / 0.5 / 1.0 | Pen-tip pressure jitter |

### Color/Palette cluster

| Toggle | Values | Audit checklist |
|---|---|---|
| `strokePalette` | source / primary / body / body-soft / secondary / detail / accent / bg / neutral / inverted | All 10 W1 ink mappings. Verify each renders correct OKLab value |
| `fillPalette` | same 10 | Same audit. Verify hachure marks pick up correct palette |
| `inkIntensity` | listed under Shading; shared modifier | Cross-cluster — handle once |

---

## Interconnection wire-up checklist (per §C matrix + §D N-way compounds)

### Direct drives (the → cells in §C)

These must produce visible changes when both toggles move:

1. **strokeCount → endpointBehavior amplification.** Each successive layer applies endpoint protrude with different seed → fan of overshoots. Verify at strokeCount=5, endpoint=long-overshoot.
2. **strokeCount → sketchingStyle pacing.** Each layer transforms per sketchingStyle (loose-overlap shift, parallel-pass scale, cross-hatch rotate). Verify at strokeCount=3, sketchingStyle=cross-hatch.
3. **strokeCount → penTip layer count.** When penTip ≠ plain, N layers = N perfect-freehand polygons stacked. Verify at strokeCount=3, penTip=charcoal.
4. **strokeWidth → penTip sizeMul.** strokeWidth scales both rough.js path stroke AND penTip polygon outline size. Single knob, ~10× range. Verify by sweeping strokeWidth 0.5 → 2.0 with penTip=fineliner.
5. **endpointBehavior → sketchingStyle compound.** Protrude pushes corner radially → loose-overlap shifts along segment → corners read as fan-of-overshoots. Verify per §D.2 headline.
6. **endpointBehavior → penTip vertex pressure.** Protruded vertex feeds perfect-freehand; pressure jitter applies at the protruded position. Verify at penTip=pencil-2b + endpoint=protrude.
7. **sketchingStyle → strokeCount transformations.** Cross-hatch rotates per layer about centroid; parallel-pass scales concentric; loose-overlap shifts endpoints. Each is the layer's transformation owner.
8. **sketchingStyle → endpointBehavior (corner geometry).** Sketching style's transformation applies AFTER endpoint behavior baked in. Verify order: corner overshoot → segment shift.
9. **sketchingStyle → penTip transformation passthrough.** When penTip active, sketchingStyle transforms apply to perfect-freehand input points. Verify at penTip=pencil-2b + sketchingStyle=cross-hatch + strokeCount=4.
10. **penTip → strokeWidth ×2 amplification.** See #4.
11. **penTip → texture filter wraps polygons.** Texture filter applies to the geometry group AFTER penTip swap. Verify at penTip=charcoal + texture=chalky.
12. **penTip → all layers become filled polygons.** When penTip active, every layer is a filled poly outline (not stroke). Layer 0 + N ghosts all polygons.
13. **fillStyle → hachureGap active.** When fillStyle requires hachure (hachure/cross-hatch/dots/zigzag/dashed/zigzag-line), hachureGap drives spacing.
14. **fillStyle → hachureAngle active.** Same as #13 for angle.
15. **fillStyle → fillDensity active.** Same as #13 for density.
16. **fillStyle → fillOpacity active.** Same as #13 for opacity.
17. **wobble → roughness amplitude.** Wobble multiplies HAND_FEEL_BASE per shape. Verify at wobble=2.0 with rect, oval, diamond, line, orthogonal — all should jitter 2× while preserving relative ratios.
18. **wobble → fillStyle (hachure) amplitude.** Hachure ride on top of jittered polygon; wobble indirectly affects hachure positioning. Verify wobble=2.0 with fillStyle=hachure.
19. **inkIntensity → fillOpacity scaling.** inkIntensity multiplies fillOpacity for hachure layers.
20. **texture → penTip displacement.** Texture filter wraps after penTip polygons → polygons displaced. Verify penTip=fineliner + texture=chalky.

### N-way compounds (§D)

21. **wobble × strokeCount × endpointBehavior triangle.** Wobble drives jitter, strokeCount stacks layers, endpoint pushes corners outward. EXCALIDRAW_WARN at wobble × strokeCount > 1.4 × 3 = 4.2 effective; chrome shows warning.
22. **strokeCount × sketchingStyle × endpointBehavior fan-of-overshoots.** The headline compound. Verify on paths after polyline sampler lands (Day 2).
23. **penTip × strokeCount × sketchingStyle × texture.** Maximum "drawn many times in pencil with grain" register. All four compose. Verify at penTip=pencil-2b + strokeCount=4 + sketchingStyle=cross-hatch + texture=chalky.
24. **strokeCount × strokeWidth × wobble line-visibility.** At low values, layers fuse. Make stableLayerNudge conditional on sketchingStyle=single-pass per §F.3.

### Cluster-level locks (§E)

25. Cluster 1 Multi-Stroke: state grouped, chrome row groups all 5 toggles, wobble at row head as master.
26. Cluster 2 Pen Tip: pen tip + texture grouped, strokeWidth shared with Cluster 1 (annotated).
27. Cluster 3 Shading: Smart Hachure group, fillStyle at head; sub-toggles conditional on fillStyle requiring hachure.
28. Cluster 4 Surface Texture: texture at head, intensity + recipe sub-toggles.
29. Cluster 5 Color/Palette: stroke + fill palette + inkIntensity grouped.

### Banned combinations (§F.5)

30. `stableLayerNudge ON + sketchingStyle ≠ single-pass` → automatically disable nudge.
31. `kink on <path>` rendered via radial protrude after polyline sampler (no separate bowing-nudge mechanism).
32. `hachureGap min + fillOpacity max + fillStyle=none` → impossible state (no marks rendered); fillStyle=none takes precedence in chrome.

---

## 09-LOCKED-MODEL.md updates (Day 1)

Add to §2 invariants:

**I-11. Wobble is the master proportion-preserving dial.** A scalar `0-2` that multiplies the per-shape calibrated bases (`HAND_FEEL_BASE`). The per-shape bases are sacred ratios — wobble preserves them while scaling. Without this, the system has independent knobs instead of a connected ecosystem.

**I-12. One render pipeline per primitive type.** Don't fork "shape primitives → points-based" vs "path primitives → rough.js options". Sample paths to polylines and route through the same pipeline. Otherwise pair-wise interactions silently break for path content.

**I-13. Cluster-level features for the classifier.** The intelligent layer consumes cluster-level signals (Multi-Stroke, Pen Tip, Shading, Surface Texture, Color), not individual modifier values. Cluster taxonomy locked per `19-research-cross-axis-interconnection.md` §E.

**I-14. sketchingStyle owns layer transform exclusively.** When `sketchingStyle !== 'single-pass'`, no other modifier may apply layer-offset translations. The stableLayerNudge fix becomes a permanent invariant.

---

## Day 4 validation gate

Sebs walks all 6 Trophy Wall test pins through:

- Wobble sweep: 0 → 0.5 → 1.0 → 1.4 → 2.0 — preserves per-shape proportion ratios
- Every fillStyle (8 options) × every Style register (rough-handdrawn / sketchy / bold-ink / wet-ink / charcoal / risograph / newsprint / stipple) — every cell renders
- Each cluster's master toggle full range
- The 4 named regressions verified fixed
- N-way compounds (kink × loose-overlap × strokeCount fan-of-overshoots, etc.) visibly working on PATH content (not just shape primitives)

If all pass: foundation done. Fork to Desk Doodles opens (Day 5).

If gaps remain: extend Phase 0 by 1 day max; cut from Desk Doodles stretch tier to absorb.
