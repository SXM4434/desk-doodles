# 21 · Research — 3D pipeline + style translation + fill shading + workflow orchestration

**Date:** 2026-06-10 (Day 9 of 14 — makeathon submission 2026-06-18 11:59 PM PDT)
**Status:** v1.2 — research-locked, implementation pending. Decisions supersede any conflicting statement in `00-overview.md` and `08-vision-roadmap.md` for the 3D + style-bridge surface area.
**Method:** 7 research agents (6 parallel + 1 gap-fill) with web access produced cited findings; this doc synthesizes them with Sebs's asks against the locked invariants of `09-LOCKED-MODEL.md`. v1.1 added 3D Artist as its own mode + mode-specific Style options + Top-3 priority. v1.2 adds gap-fill findings (no real "preserve sketch in mesh" knob exists; cost realism; vision LLM schema).

---

## 0. Context — every ask coverage (v1.2)

Across the deep-thinking message + follow-ups 2026-06-10, Sebs raised 17 interlocking asks. This doc answers each in a section below.

| # | Ask | Where addressed |
|---|---|---|
| 1 | Free Stroke modes — port all 4 or subset; how to expose user control | §5 — full mode list + Top-3 priority |
| 2 | SVG style ↔ 3D style translation (separate Style dropdowns per `project_f3_shading_port_to_3d`) | §6 — SVG-port bridge mechanism |
| 3 | "Fill thing" — clean SVG shading translating to other styles (mark grammar math) | §4 — single `coverageToParams` function + 8-band L* |
| 4 | "Look at hero docs + our docs, bring over any docs we might've forgotten" | §1 — cross-reference table to 11 locked refs |
| 5 | "Pink would be weird for shading — could become a mess with all the controls" (chrome UX) | §9 — cluster collapse + context-aware visibility + reset-to-preset |
| 6 | Controls for 3D paths (easier + harder) — chrome layout | §9 — 3D mode controls layout matrix |
| 7 | SVG → simple 3D conversion complexity | §5 + §6 — Geometry modes split + SVG-port bridge |
| 8 | Multi-face mark placement (rectangle → 6-face box) | §7 — screen-space hatching post-process + shader uniform sketch |
| 9 | Vision LLM analysis → hard-path 3D pipeline | §8 — vision LLM router + structured JSON schema + Tripo/TRELLIS APIs |
| 10 | Pipeline orchestration (workflows communicating) | §3 — typed async function chain + Cockatiel + OPFS/IndexedDB |
| 11 | Reshape vs auto-size on input — lock the call | §2 — auto-resize lock, reshape post-MVP |
| **12** | **Hard path 3D = "AI 3D artist recreating in 3D while keeping sketchy fidelity"** | **§5 — 3D Artist as its own mode with its own pipeline** |
| **13** | **"Each 3D option has its unique styles"** | **§5 — mode-specific Style options table** |
| **14** | **SVG-port is universal across all Geometry modes (the wedge mechanism)** | **§5 + §6 — policy lock** |
| **15** | **Top-2 focus / 3rd as reach / rest likely out of MVP scope** | **§5 — priority table (Focus: Stroke + 3D Artist; Reach: Volumetric AI)** |
| **16** | **Volumetric AI gets sketchy lines through SVG-port (not baked into mesh)** | **§5 — Volumetric AI clean mesh + SVG-port re-applies hand at render** |
| **17** | **2D Style hints (sketch character / shading) flow to vision LLM for 3D Artist mode** | **§5 — multi-pass LLM analysis includes style/character passes; §8 — structured JSON schema** |

### v1.2 additions (gap-fill findings on 3D Artist mode mechanics)

- **No 3D-gen API has a "preserve sketch character in mesh" knob.** All stylization happens at the texture/material stage, never at the geometry stage. Meshy 6 `art_style`, Hyper3D Rodin `material`, Tripo3D v3 `style` — all texture-level. § 5b expanded.
- **TRELLIS Gaussian-splat decoder beats mesh decoder by 78 ELO on 3D Arena** — splats carry style better but are unsuitable for desk-object animation/edit pipeline.
- **Cost realism for makeathon demo**: ~$0.17–0.30 per "3D Artist" interaction (2-pass Claude Opus 4.7 vision + Tripo v3 = $0.04 + $0.13). **$50 dev-grant budget covers ~150–250 demos.** TRELLIS-original at $0.02/gen is the cheap fallback.
- **Mesh-bake style in 14 days = NO.** Skip mesh-baking entirely; tag as v2. Render-time style via SVG-port + cheap displacement-map overlay = YES (well-documented in three.js).
- **3D Artist v1 final spec:** Tripo v3 image-to-3D (`style: object:clay` default for hand-made-feel) + 2-pass Claude Opus 4.7 vision analysis producing structured JSON → tuned prompt + auto-apply SVG-port 3D Style at render. Per-demo cost ~$0.17–0.30. See §5c.

---

## 1. Cross-reference to locked refs (the answer to ask #4)

The doc mirror in `docs/` is the local snapshot. Source-of-truth lives in `~/Desktop/Projects/portfolio/portfolio-system-lab/docs/`. The load-bearing refs for this surface area:

| Concern | Locked ref |
|---|---|
| 6-axis tuple `(gap, weight, layers, pressure, color, opacity)` + I-1..I-13 invariants | `docs/locked-refs/F3-smart-hachure-system/09-LOCKED-MODEL.md` §1, §2 |
| Per-fillStyle calibration math + slider ranges + bug patterns | `docs/locked-refs/F3-siblings/F3-shading-calibration-spec.md` §3, §4 |
| 5-cluster taxonomy (Multi-Stroke / Pen Tip / Shading / Surface Texture / Color/Palette) + interaction matrix | `docs/locked-refs/F3-smart-hachure-system/19-research-cross-axis-interconnection.md` §C–§E |
| 7-axis Style/fillStyle/Path/etc toggle taxonomy + 3D Path 1 style options + rotation-stability research | `docs/locked-refs/F3-siblings/F3-toggle-architecture.md` lines 79–89, 441–463 |
| MVP vs stretch ladder + Smart Rendering System §8.6 unified framing | `docs/locked-refs/F3-smart-hachure-system/makeathon-plan.md` §3.1 (M1–M13), §3.2 (S1–S13), §8.6 |
| Make compatibility (NO Rapier) | `docs/locked-refs/F3-smart-hachure-system/20-research-figma-make-capabilities.md` + `docs/memory/project_desk_doodles_no_rapier_in_make.md` |
| `signals → classify → treatment` general pattern | `docs/locked-refs/F3-smart-hachure-system/07-architecture-ml-pipeline.md` + `docs/memory/project_generalizable_rendering_decision_pattern.md` |
| SVG and 3D have SEPARATE Style dropdowns; "SVG port" 3D option bridges via EdgesGeometry | `docs/memory/project_f3_shading_port_to_3d.md` |
| Free Stroke as separate project (don't conflate) | `docs/memory/project_free_stroke.md` |
| No stub styles | `docs/memory/project_f3_styles_must_all_be_real.md` |
| Audit-as-foundation for the smart layer | `docs/memory/project_smart_layer_foundation_via_audit.md` |

---

## 2. Input layer — auto-resize lock (ask #11)

**Decision: AUTO-RESIZE on every upload. NO reshape controls in MVP.**

Reasoning:
- Drop any SVG / image / drawing → normalize to a canonical bbox (target ~140–200 px on the longest axis to match existing item slate ergonomics per `F3-B-desk-vertical-column.md` §C7).
- Skip drag-handles, skip pinch-to-zoom, skip aspect-ratio locking. Those land post-MVP per `makeathon-plan.md` §3.2 stretch list (no current entry — would be S14+).
- Auto-resize is a **single function** at the input boundary: read source bbox, compute uniform scale, apply once before the item enters the render pipeline.
- User can manually drag-position on the canvas surface (already wired per `DeskDoodlesPlayground.tsx`). Reshape is a different gesture — out of scope.

Implementation:
```ts
// pseudo-code, lands at canvas input
function normalizeInputSize(rawSvg: SVGSVGElement, targetMaxPx = 180): SVGSVGElement {
  const bbox = rawSvg.getBBox();
  const longSide = Math.max(bbox.width, bbox.height);
  const scale = longSide > 0 ? targetMaxPx / longSide : 1;
  rawSvg.setAttribute('width', String(bbox.width * scale));
  rawSvg.setAttribute('height', String(bbox.height * scale));
  rawSvg.setAttribute('viewBox', `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);
  return rawSvg;
}
```

Edge cases to log but not fix in MVP:
- Tall-thin shapes (criterionSpine class — handled via geomean clamp in `SvgStyleTransform.tsx` line 119)
- Very small shapes (auto-resize UP to target min, not just down)

---

## 3. Pipeline orchestration (ask #10)

Sebs's observation: "we have all these things that are basically workflow pipelines communicating with each other." Six interlocking pipelines:
1. **Smart Hachure 2D** — signal extraction → classify → 6-axis tuple → render with fillStyle × Style
2. **3D easy** — 2D path → TubeGeometry / ExtrudeGeometry → R3F scene + cannon-es
3. **3D hard** — image → vision LLM → 3D-generator API (Tripo / TRELLIS) → GLB → R3F scene
4. **NPR-on-3D shader** — 3D scene + Smart Hachure params → screen-space post-process hatch
5. **Public-canvas Supabase** — local draft → publish → shared feed → cache results for mode-flip
6. **Auto-resize input normalizer** — any new upload → canonical size

### Architecture decision (per Agent 5 + the locked `signals → classify → treatment` pattern)

**Use a typed async function chain with stage objects + Cockatiel circuit breaker. Skip XState, LangGraph, Mastra.**

Concrete shape:

```ts
type Stage<I, O> = {
  name: string;
  run(input: I, ctx: PipelineCtx): Promise<O>;
  fallback?(input: I, err: Error, ctx: PipelineCtx): Promise<O>;
  cacheKey?(input: I): string; // SubtleCrypto SHA-1 of normalized input
};

type PipelineCtx = {
  cache: Map<string, unknown>;   // OPFS-backed for blobs, IndexedDB for metadata
  breaker: CircuitBreaker;       // Cockatiel retry + exponential backoff
  sceneNonce: number;            // Excalidraw-style content-version invalidation
};
```

Why this shape (cited from Agent 5):
- **TouchDesigner [10] / Houdini [11] / Blender geometry nodes [12] / Cables.gl [13]** all converge on dirty-flag DAG with on-demand pull evaluation + per-node cache. We have 5–6 stages, mostly linear, with 2 branching points (SVG / 3D-easy / 3D-hard) and 3 fallback paths — sub-DAG complexity. Function chain pays its weight at ~150 LOC; XState pays at ~600 LOC for the same surface.
- **tldraw Image Pipeline starter kit [14] (2025)** is the closest analogous production architecture — DAG execution on a Cloudflare Worker, typed ports. We migrate the function chain into their shape later if we ever expose a user-facing node editor (stretch S11+).
- **Excalidraw's `sceneNonce` trick [15]** — bump a version int on any canvas mutation; stale caches self-invalidate. Borrow this for the public-canvas feed cache.
- **OPFS vs IndexedDB benchmark [16]** — OPFS ~10× faster than IndexedDB for blob writes (90 ms vs 850 ms for 100 MB). Use OPFS for GLB blobs, IndexedDB for JSON metadata. Mirror async to Supabase storage for the public feed.
- **Cockatiel [17]** for retry + exponential backoff + circuit breaker. Three primitives in one TS lib. When a Tripo call fails, surface circuit state to UI: "3D generator cooling down — using extrude fallback."

### Cache strategy

```
INPUT (drawn / SVG / image)
  ↓                                                       Cache?
SIGNAL EXTRACTION (signals.ts)                            no (cheap)
  ↓
CLASSIFICATION (classifier.ts via providers chain)        yes (sceneNonce-versioned, in-memory)
  ↓
SMART HACHURE TREATMENT (renderRegion.ts)                 yes (per-region tuple, IndexedDB)
  ↓                                                       ┌── 2D mode →  DOM mutate, render done
RENDER REGISTER                                          ─┤
  ↓                                                       └── 3D mode →  scene route below
3D MODE BRANCH:
  - easy path → TubeGeometry / ExtrudeGeometry           yes (BufferGeometry vertices, OPFS)
  - hard path → vision LLM → 3D API                      yes (GLB blob, OPFS) ← biggest cache win
  ↓
NPR-on-3D POST-PROCESS (screen-space shader)             no (frame-driven, runs every frame)
```

---

## 4. Smart Hachure clean → stylized math (ask #3)

The "fill thing" — when user picks a fillStyle other than `none`/`solid`, the system has to translate the source region's clean fill into mark patterns (hachure / cross-hatch / dots / etc.) at a density that reproduces the source darkness.

**This is locked in `09-LOCKED-MODEL.md` §1, §I-2, §I-3 — but Agent 4 surfaced concrete implementer-ready math.**

### Single function shape

```ts
function coverageToParams(
  targetCoverage: number,     // 0..1, from source darkness via Murray-Davies inverse
  fillStyle: 'hachure' | 'cross-hatch' | 'dots' | 'zigzag' | 'dashed' | 'zigzag-line',
  bias: { gap?: number; weight?: number; density?: number }  // user slider bias
): { gap: number; weight: number; layers: number; angle?: number }
```

### Per-fillStyle inverse equations (cited Agent 4)

- **Hachure (single direction):** `coverage a ≈ weight / gap`. One parameter pair drives both. [Murray-Davies 1936, ref [3]; rough.js implementation [5]]
- **Cross-hatch (two directions):** `a ≈ 1 − (1 − w/g)²` — Beer-Lambert-style stacking. Same `(gap, weight)` yields ~√2× darker than hachure → need wider gap for matched darkness.
- **Dots / stippling:** `a = N · π · r² / Area`. Distribution = weighted Voronoi via Lloyd's relaxation (Secord NPAR 2002 [7]). Layers axis maps to dot count, NOT stroke count.
- **Zigzag:** `a ≈ weight · pathLength / (gap · regionArea)`. Path length per unit area fixed by amplitude/frequency.

### Source darkness → coverage (Murray-Davies inverse)

```
coverage = (R_paper − R_target) / (R_paper − R_ink)
```

For screen rendering, `R_paper ≈ 1.0`, `R_ink ≈ 0.05`, `R_target = (L*_source / 100)³ · 100` (CIELAB cube-root inverse).

Yule-Nielsen `n`-correction (`R^(1/n) = a · R_ink^(1/n) + (1−a) · R_paper^(1/n)`, n ≈ 1.4–3.0 [4]) accounts for paper light scatter in print. **Skip for screen rendering** — Murray-Davies linear is sufficient.

### 8-band L* quantization

Per Mahy 1994 [6]: CIELAB JND ≈ 2.3 → ~43 distinguishable lightness steps in ideal viewing. For hatch density bands with context-masking, practical robust = 6–10 levels. **Match Praun's 6-column TAM + headroom = 8 bands.** Each band picks one TAM cell.

Bands mapped to layer count per `09-LOCKED-MODEL.md` §I-2:

| Band | Source L* range | TAM nesting start |
|---|---|---|
| Paper | 0.00–0.10 | empty |
| Light | 0.10–0.30 | layer 1 sparse |
| Mid-light | 0.30–0.45 | layer 1 dense |
| Mid | 0.45–0.55 | layers 1 + 2 |
| Mid-dark | 0.55–0.65 | layers 1 + 2 |
| Dark | 0.65–0.80 | layers 1 + 2 + 3 |
| Near-black | 0.80–0.92 | layers 1 + 2 + 3 + 4 |
| Black | 0.92–1.00 | layers 1 + 2 + 3 + 4 (max density) |

### Implementation phase placement

This is **Smart Phase A baseline** per `makeathon-plan.md` Day 11. The implementation today (in `lib/smartHachure/renderRegion.ts`) has the scaffolding but the per-fillStyle inverse equations are not yet calibrated against the 8-band L* table. **Day 11 work = wire the 4 per-fillStyle inverses + the 8-band table; validate on `/audit` against the `audit-runs/2026-06-08/` baseline.**

---

## 5. 3D Geometry modes — full list, Top-3 priority, build-all policy (asks #1 + #7)

### Three independent axes (locked v1.1)

```
INPUT (2D drawn / SVG / image)
  ↓
2D Style ← user picks (rough-handdrawn / sketchy / charcoal / clean / ...)
  ↓
[2D rendering complete]
  ↓ optional flip to 3D
3D Geometry ← user picks (Stroke / Punch out / Inflate / Merge / Volumetric AI / 3D Artist / ...)
  ↓
[3D mesh built]
  ↓
3D Style ← user picks (native-toon / native-edges / native-wireframe / halftone / SVG port + mode-specific)
  ↓
[3D rendering complete]
```

Three picks. Each independent. Each "sacred" per I-1 spirit (system never overrides). Smart Rendering System Phase D may SUGGEST defaults from signals, but user always overrides.

### Full 3D Geometry mode list

| Mode | What it does | Source / Implementation |
|---|---|---|
| **Stroke** (Rod) | Tube/worm along open stroke. Your line IS the 3D object. | Three.js TubeGeometry + CatmullRomCurve3 |
| **Punch out** (Extrude) | Closed shape pulled out as a slab. Cookie-cutter aesthetic. | Three.js ExtrudeGeometry from THREE.Shape |
| **Inflate** (Inflate-Lite) | Puffed-up balloon version of closed shape. Soft volumetric. | Swept elliptical capsule (Free Stroke heuristic). Full Teddy [19][20] = post-MVP. |
| **Merge** (Solid) | Multiple overlapping strokes fused into one watertight mesh; holes preserved. | Raster → marching squares → ordered loop → ExtrudeGeometry |
| **Volumetric AI** | "Make this thing in 3D" — generic 3D reconstruction. | Vision LLM identifies → Tripo / TRELLIS API → clean GLB. **The artist's hand strips off in the mesh.** Render-time SVG port re-applies it. |
| **3D Artist** | "Pretend you're a 3D artist who got handed a sketch and was told to recreate it in 3D while keeping the sketchy character." Multi-pass deep analysis + style-preserving generation. | Vision LLM structured-style-guide JSON → stylization-aware 3D-gen path (heavily-prompted Tripo / Meshy stylized mode / future custom bake of normal+displacement from source 2D). **The artist's hand survives in the mesh itself.** |
| **Layered slabs** (post-MVP) | Each closed sub-path becomes a slab at a different Z depth. Papercraft / pop-up book aesthetic. | ExtrudeGeometry × N with z-offsets |
| **Heightmap** (post-MVP) | Source darkness → Z displacement. Lighter = lower, darker = higher. Topographic relief. | BufferGeometry built from displacement map of source |
| **Sweep / Lathe** (post-MVP) | Stroke revolved around an axis. Pottery / vase shape. | THREE.LatheGeometry |

### Policy lock (per Sebs 2026-06-10)

**SVG-port 3D Style works on EVERY Geometry mode.** That's how the "user's hand survives the round-trip" wedge transfers — it doesn't matter which Geometry mode built the mesh, SVG-port projects edges + applies the user's 2D Style on top.

**Focus 2 (bulletproof these):**

| # | Mode | Why |
|---|---|---|
| 1 | **Stroke** (Rod) | Easiest — trivial Three.js primitive. Day 11 instant feedback. |
| 2 | **3D Artist** | The wedge demo moment. Day 13-14 polish — the headline moment of the demo video. |

**Reach 1 (build because pipeline shares):**

| # | Mode | Why |
|---|---|---|
| 3 | **Volumetric AI** | Shares ~80% of pipeline with 3D Artist (vision LLM router + 3D-gen API + GLB loader). Building it is mostly free once 3D Artist's plumbing is in. Gives users a comparison option in the demo (clean AI vs 3D Artist take). |

**Build-eventually (out of MVP scope, ship if time):**

| Mode | Effort tier |
|---|---|
| Punch out (Extrude) | Trivial — ships Day 11 alongside Stroke as free win, not really "focus" |
| Inflate (Inflate-Lite) | Medium — Day 12-13 stretch |
| Merge (Solid) | Hard — Day 14 stretch (raster + marching squares + hole stabilization) |
| Layered slabs · Heightmap · Sweep · proper Teddy | Post-MVP buffer days (06-16/17) |

### 3D Artist mode — pipeline detail

```
INPUT (2D drawing, including 2D Style choice + mark grammar)
  ↓
VISION LLM (Claude 4.7 Opus / Gemini / GPT-4o) — multi-pass:
  Pass 1: STRUCTURE     → "yellow Pokémon, sphere body, two pointed ears, lightning-bolt tail"
  Pass 2: STYLE         → "rough hand-drawn outlines, slight wobble, hachure-shaded cheek pouches"
  Pass 3: CHARACTER     → "intentional asymmetry, low-poly target, hand-drawn aesthetic NOT photoreal"
  Pass 4: INTENT        → "pose: standing facing forward; mood: cheerful; detail emphasis: ear tips"
  ↓
STRUCTURED STYLE-GUIDE JSON (schema TBD — see gap-fill research v1.2 update)
  ↓
ROUTING (function chain stage):
  Heavily-prompted Tripo3D OR Meshy stylized mode OR custom bake pipeline
  ↓
GLB blob (cached in OPFS by content-hash of input image + style-guide)
  ↓
R3F scene: useGLTF → mesh + cannon-es Convex body
  ↓
USER'S 3D STYLE CHOICE applies (likely SVG port by default for max hand-feel)
```

The split from Volumetric AI: **Volumetric AI uses generic prompt, gets clean mesh. 3D Artist uses the structured style-guide JSON, gets stylized mesh.** Both route to the same APIs; the difference is in the LLM's prompt construction and which preset is requested on the 3D-gen side.

### 3D Geometry-mode-specific Style options (each mode has its UNIQUE Styles)

| Style option | Stroke | Punch out | Inflate | Merge | Volumetric AI | 3D Artist |
|---|---|---|---|---|---|---|
| `native-toon` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `native-edges` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `native-wireframe` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `halftone` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **`SVG port`** (universal — the wedge mechanism) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `Puff shading` (lit by source 2D darkness) | — | — | ✓ unique | — | — | — |
| `Cookie depth` (controls extrude depth visibility) | — | ✓ unique | — | — | — | — |
| `Native sketch surface` (the baked-in hand-made surface treatment) | — | — | — | — | — | ✓ unique |
| `Texture-transfer` (2D drawing → UV map on the AI mesh) | — | — | — | — | ✓ unique | ✓ unique |
| `API picker / prompt tuning` (UI affordance, not a Style per se) | — | — | — | — | ✓ unique | ✓ unique |

Five universal Styles work across all modes; the mode-specific Styles let each Geometry mode lean into what it's good at. Structurally similar to 2D's per-Style modifier sets (bleed for wet-ink, grainIntensity for charcoal).

### 3D Artist mode v1 — makeathon-realistic spec (gap-fill agent, 2026-06-10)

**Hard finding:** No 3D-gen API has a "preserve sketch character in mesh" knob. All stylization happens at the texture/material stage. References:

- **Meshy 6**: `art_style` is TEXTURE-stage [G1][G2]. Preview mode returns untextured geometry that's identical across style choices.
- **Hyper3D Rodin**: `material` accepts `PBR | Shaded | All` — texture-stage stylization, not geometry [G3].
- **Tripo3D v3**: `style` enum (`object:clay` · `object:steampunk` · `object:barbie` · `person:person2cartoon` etc.) closest to what we want; reviews suggest output is clean toon-shaded, NOT sketch-character-in-geometry [G5][G6].
- **TRELLIS**: same flow-transformer latents drive 3 decoders. Gaussian-splat decoder beats mesh decoder by 78 ELO on 3D Arena [G7]. Splats carry style better but unsuitable for our pipeline (hard to animate/edit, cannon-es physics doesn't handle splats).
- **LoRA / fine-tune for stylized 3D** (June 2026): research-stage only (MeshTron, TreeMeshGPT, Mesh-RFT). NOT production-ready [G9].

**Conclusion:** 3D Artist mode v1 = **clean Tripo v3 mesh + Smart Hachure-driven render-time styling.** Skip mesh-bake entirely (flag as v2 / post-makeathon).

### Vision LLM structured-output JSON schema (locked v1.2)

Per gap-fill agent: no production multi-pass precedent found (Krea uses Hunyuan3D2.1 single-shot; Polycam is capture-based [G10]). Best-practice from structured-output literature [G11] is Anthropic tool-use schemas with explicit fields. Locked schema for the 2-pass call:

```typescript
type StyleGuide = {
  subject: {
    primary: string;          // "Pikachu"
    parts: string[];          // ["sphere body", "pointed ears", "lightning-bolt tail"]
  };
  silhouette: {
    complexity: 1 | 2 | 3 | 4 | 5;
    symmetry: "none" | "bilateral" | "radial" | "broken";
    dominant_axes: ("vertical" | "horizontal" | "diagonal")[];
  };
  line_quality: {
    weight: "thin" | "medium" | "thick" | "variable";
    confidence: "hesitant" | "confident" | "gestural";
    closure: "closed" | "open" | "sketchy";
  };
  shading: {
    present: boolean;
    style: "none" | "hatching" | "stippling" | "smudge" | "solid";
    coverage: number;         // 0..1
  };
  proportions: {
    stylization: "realistic" | "chibi" | "exaggerated" | "abstract";
  };
  rendering_intent_prompt: string;  // pre-written 1-sentence prompt for downstream 3D-gen
};
```

Two-pass execution:
- Pass 1 (LLM call A): extract structured JSON above. Self-heal on schema-validation failure (standard pattern [G11]).
- Pass 2 (LLM call B OR same call): given JSON, compose the 3D-gen API prompt.

### Cost realism (gap-fill agent, locked v1.2)

| Stage | Cost per call | Notes |
|---|---|---|
| Claude Opus 4.7 vision (2-pass) | ~$0.04 | $5/MTok input, $25/MTok output; ~4K in + ~800 out per analysis [G12][G13] |
| Tripo3D v3 image-to-3D | ~$0.13 | 20 credits @ $19.90/3000 credits Pro plan [G14][G15] |
| Tripo P1 (higher quality) | ~$0.53 | 80 credits — skip for makeathon |
| TRELLIS original via fal.ai | ~$0.02 | Cheap fallback if Tripo budget tight [G16] |
| TRELLIS 2 via fal.ai | ~$0.25–0.35 | Quality up-tier [G17] |

**Total per 3D Artist interaction:** ~$0.17–0.30 (Claude vision + Tripo v3). With retries + texture pass: ~$0.30–0.50. **$50 dev-grant budget covers ~100–250 demos.** Headroom for the live demo + judging period.

Mitigations:
- Content-hash cache by input image + style-guide JSON → repeated demos hit free
- Pre-warm cache for known demo inputs before recording the video
- TRELLIS-original as cost fallback ($0.02 vs $0.13)

### Render-time displacement (cheap mesh-bake substitute)

Per gap-fill agent: full mesh-bake from style reference = NOT realistic in 14 days. BUT three.js `MeshStandardMaterial.displacementMap` is cheap [G18][G19][G20]:

- Pre-process source 2D sketch → threshold/roughen → 1024 × 1024 displacement map
- Apply as `displacementMap` on the Tripo-generated mesh
- `displacementScale` slider (user-facing, 0..0.05) controls how strongly the sketch warps the surface
- Combined with SVG-port 3D Style at render = mesh that looks "hand-touched" without actual bake

This is a stretch for Day 13. v1-without-displacement is acceptable; v1.1 with displacement is the polish target.

---

## 5b. Free Stroke mode breakdown (technical detail)

### Ground truth (Agent 3 pulled actual Free Stroke source code [18])

`SXM4434/free-stroke` at `lib/geometry-engines.ts` exports:
```ts
export type GeometryMode = "rod" | "extrude" | "inflate" | "solid"
```

Mode internals:

| Mode | Implementation | Three.js primitives | Build difficulty |
|---|---|---|---|
| **Rod** | TubeGeometry along CatmullRomCurve3 + spherical caps at endpoints + joint spheres at corners ≥ 40° | TubeGeometry · CatmullRomCurve3 · SphereGeometry | **Trivial** (~50 LOC R3F) |
| **Extrude** | Ribbon ExtrudeGeometry; half-width 0.015–0.080 nonlinear-quadratic slider; bevel optional | ExtrudeGeometry · THREE.Shape (or SVGLoader.createShapes) | **Trivial** (~50 LOC R3F) |
| **Solid** | Raster→marching-squares→ordered loop→ShapeGeometry/ExtrudeGeometry with H1/H2/H3 hole stabilization. Watertight from overlapping strokes. | Custom raster pipeline + ExtrudeGeometry | **Non-trivial** (~1 day) |
| **Inflate** | Free Stroke ships a swept-elliptical-capsule heuristic, NOT real Igarashi/Teddy [19][20] chordal-axis. Phase 1 reuses `buildMaskSolid` BEVEL_EXTRUDE branch. | TubeGeometry with variable radius via shader OR per-cross-section BufferGeometry | **Medium** (Inflate-Lite ~0.5 day; full Teddy = 1–2 weeks, out of scope) |

### Port decision

**Ship Rod + Extrude on Day 11. Ship Solid on Day 12 if time. Ship Inflate-Lite on Day 12–13 if time. Skip true Teddy.**

Implementation route: **DO NOT port the Free Stroke engine codebase verbatim.** Free Stroke is Next.js + vanilla Three.js with its own state model; Desk Doodles is Vite + R3F + cannon-es. The primitives (TubeGeometry, ExtrudeGeometry, CatmullRomCurve3) are built into `three` (already a dep). Wire them directly inside R3F components.

R3F sketches (cited Agent 3 [21][22]):

```tsx
// Rod
const curve = new THREE.CatmullRomCurve3(
  cleanPoints.map(p => new THREE.Vector3(p.x, -p.y, 0)),
  isClosed, "centripetal", 0.5
);
const tubularSegments = Math.min(cleanPoints.length * 3, 512);
<mesh>
  <tubeGeometry args={[curve, tubularSegments, 0.012, 16, isClosed]} />
  <meshStandardMaterial />
</mesh>

// Extrude
const shape = new THREE.Shape(cleanPoints.map(p => new THREE.Vector2(p.x, -p.y)));
const geom = new THREE.ExtrudeGeometry(shape, {
  depth: 0.1, bevelEnabled: true, bevelSize: 0.005, bevelSegments: 2, curveSegments: 12
});
<mesh geometry={geom}>
  <meshStandardMaterial />
</mesh>
```

Performance budget (Agent 3): keep `radialSegments = 8–12` for thin lines, `16` only for hero strokes; TubeGeometry verts = `(tubular + 1) × radial`. For ExtrudeGeometry, `curveSegments = 12` default fine; drop to 6 for previews. Cap Solid-mode raster at 512 × 512.

**R3F gotcha:** programmatically-constructed geometries don't auto-dispose. Wrap in `useMemo` keyed on a pointsHash; explicit `.dispose()` in cleanup.

### User control

Per I-1 spirit, the mode pick is sacred. Expose as a 4-button row in 3D mode chrome (same pattern as the existing Style dropdown in 2D chrome). Default to **Rod** for open strokes, **Extrude** for closed shapes — auto-pick per `signals → classify → treatment` (Smart Rendering System Phase D engine routing per `makeathon-plan.md` §8.6).

---

## 6. SVG style ↔ 3D style translation (ask #2)

**Per `docs/memory/project_f3_shading_port_to_3d.md` (2026-06-02 user direction, locked):**

> SVG and 3D have SEPARATE Style dropdowns. They are different render-mode sets, not a shared cross-path enum.

### 2D (SVG path) Style options
11 styles, all running through `SvgStyleTransform.tsx` + the modifier system: `clean` · `outline-only` · `rough-handdrawn` · `sketchy` · `bold-ink` · `wet-ink` · `stipple` · `charcoal` · `risograph` · `newsprint` · `wireframe`.

### 3D (Path 1) Style options
A separate set per `F3-toggle-architecture.md` lines 79–89:
- `native-toon` — current Trophy Wall Path 1 baseline (MeshStandardMaterial + drei `<Toon>` or `MeshToonMaterial`)
- `native-edges` — EdgesGeometry + LineMaterial (only emits edges where face-angle delta > 30° → silhouette aesthetic, NOT every triangle edge)
- `native-wireframe` — drei `<Wireframe>` (fill / fillMix / stroke / thickness / dashes, declarative)
- `halftone` — post-process pass via `@react-three/postprocessing`
- `"SVG port"` — the bridge: project EdgesGeometry to screen-space → feed through SvgStyleTransform → SVG overlay on top of the 3D canvas

### The "SVG port" bridge

This is the **answer to "how do styles work in 3D" without rewriting everything**. When user picks "SVG port" on the 3D Style dropdown:

1. Compute mesh edges via `EdgesGeometry(mesh.geometry, 30)` (30° face-angle threshold for silhouette-style)
2. Project edges to screen-space (camera-aware) every frame
3. Run the resulting 2D polylines through `SvgStyleTransform` — the same pipeline as 2D mode
4. Render as an SVG overlay on top of the WebGL canvas (positioned absolutely, pointer-events: none for the overlay)
5. **The entire 2D Style sub-dropdown + ALL modifiers become available under this one 3D option** (because it's the same pipeline)

**Hard requirement (per `project_f3_shading_port_to_3d`):** SVG-port mode must work under full object rotation. Rotation-stability research is the prerequisite — 4 candidate techniques per `F3-toggle-architecture.md` lines 441–463:
- (a) Stable seed (jitter pattern locked per object)
- (b) Temporal smoothing (re-jitter at fixed intervals, e.g., 250 ms)
- (c) Edge-stable jitter (jitter as function of world-space edge position)
- (d) Pre-baked N angles (interpolate between cached camera views)

**For makeathon scope: ship (a) stable seed.** Simplest, gives visually-acceptable result even under rotation (the jitter "rotates with" the object, looks intentional). Migrate to (c) or (d) post-makeathon. Cite the option in the 3D Style dropdown chip as "SVG port (stable seed)".

### Decision matrix

| Style on 3D dropdown | Implementation | When to ship |
|---|---|---|
| `native-toon` | drei `<MeshToonMaterial>` or shader; cel-shaded look | Day 11 (baseline) |
| `native-edges` | EdgesGeometry(geom, 30) + drei `<Line>` for variable width | Day 11 (baseline) |
| `native-wireframe` | drei `<Wireframe>` | Day 11 (baseline) |
| `halftone` | EffectComposer + halftone effect | Day 13 if time |
| `SVG port (stable seed)` | EdgesGeometry → screen-space project → SvgStyleTransform → SVG overlay | Day 13 if time (carries 2D's 11 styles + all modifiers as bonus) |

---

## 7. Multi-face mark placement (ask #8) — the rectangle-as-box problem

**Agent 1's research recommended: screen-space hatching post-process via `@react-three/postprocessing`.**

### The problem

A 2D rectangle drawn at SVG mode renders as a single sketch outline with hachure-fill marks at angle −41° (or whatever the user picked). Flip to 3D → ExtrudeGeometry makes a box. The box has 6 faces (top, bottom, 4 sides). Each face needs marks placed at the user's chosen hachureAngle, with proper density per Praun TAM bands.

### Three architectural choices (Agent 1, cited)

| Choice | Pros | Cons | Source |
|---|---|---|---|
| **(a) Per-face 2D UV hatching projected** | Highest artistic control; marks rotate with surface | Requires UV unwrap per face, seam handling, expensive to author | Praun 2001 [1] |
| **(b) Object-space TAM 3D texture stack** | ~2 texture fetches at runtime, frame coherence, scale invariance via mips | TAM authoring tool needed; each TAM texel must contain darker-tone nesting; needs custom mips | Praun 2001 [1] + Webb 2002 [2] |
| **(c) Screen-space hatching post-process** | Trivial integration with R3F + EffectComposer; one-pass; no TAM authoring | Loses surface-direction info → tri-planar projection needed for world-space mark direction; "shower-door" artifact risk | Kyle Halladay [9] + Codrops [23] |

### Makeathon decision: **(c) screen-space hatching post-process**

Reasoning:
- R3F + `@react-three/postprocessing` already has the EffectComposer pipeline. Adding a custom `Effect` that reads the normal buffer + depth buffer + lit luminance is **~1–2 days of work**.
- The 6-axis tuple `(gap, weight, layers, pressure, color, opacity)` maps cleanly to **fragment shader uniforms** — no per-face UV authoring, no lapped-texture build.
- cannon-es physics is unaffected (post-process runs after physics + render).
- **hachureAngle on 3D box faces:** sample the world-space normal in the fragment shader, project the screen-space hatch direction into the dominant-face tangent frame. The math is short.
- **Praun's TAM nesting** approximated by sampling N density-tiers of a single hatch texture and lerping by luminance bands — direct port of 2D coverage math from §4.
- (a) is out: 14 days isn't enough for lapped textures + direction fields. (b) is the **right post-makeathon migration** but needs a TAM authoring tool we don't have yet.

### Migration path post-makeathon

Lift the same TAM density texture from screen-space sampling into a 3D texture stack indexed in object space — the shader math stays, only the sampling coordinate changes. Webb 2002 [2] shows you only need ~2 texture fetches at runtime to do this.

### Shader uniform shape

```glsl
uniform sampler2D u_hatchTAM;        // 8-band TAM packed in a single 2D texture (8 horizontal cells)
uniform float u_hachureAngle;        // radians, user slider
uniform float u_gap;                 // px in screen space
uniform float u_weight;              // 0..1 stroke thickness
uniform float u_layers;              // 1..4 active TAM bands
uniform vec3  u_inkColor;
uniform float u_inkIntensity;

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec3 worldNormal = texture2D(u_normalBuffer, uv).xyz * 2.0 - 1.0;
  float luma = dot(inputColor.rgb, vec3(0.299, 0.587, 0.114));
  int band = int(floor((1.0 - luma) * 8.0));  // §4 8-band quantization
  vec2 hatchUV = rotate(uv * u_gap, u_hachureAngle + tangentBias(worldNormal));
  float ink = texture2D(u_hatchTAM, vec2(hatchUV.x, float(band) / 8.0)).r;
  outputColor = mix(inputColor, vec4(u_inkColor, 1.0), ink * u_inkIntensity * u_weight);
}
```

(Shader sketch only — actual implementation lives in Day 13 if 3D-easy lands by Day 12.)

---

## 8. Hard-path 3D — vision LLM + image-to-3D APIs (ask #9)

### The pipeline

```
User uploads complex image (Pikachu drawing, photo of object)
  ↓
VISION LLM (Claude 4.7 Opus / GPT-4o / Gemini 2.0 Pro)
  → analyzes the input
  → outputs: { object_class, suggested_prompt, suggested_API, recommended_style }
  ↓
ROUTING (function chain stage):
  if API == 'tripo' → POST to Tripo + prompt
  if API == 'trellis' → POST to fal.ai TRELLIS
  if API == 'fast' → POST to Stability SF3D
  ↓
GLB blob returned (cached in OPFS by content-hash)
  ↓
R3F scene loads via useGLTF → cannon-es Convex body wraps the mesh
  ↓
NPR-on-3D post-process applies the user's Style choice (§6)
```

### Image-to-3D API landscape (Agent 2, June 2026 cited [24]–[31])

| API | Input | Output | Latency | Cost / generation | Free tier | Best for |
|---|---|---|---|---|---|---|
| **Tripo3D v3.0 / P1** | Image · text | GLB · FBX · OBJ · USDZ | ~30–60s | $0.20–0.40 via fal/Wavespeed; 10–20 credits direct | **300 credits/mo + 5,000 one-time dev grant ($50)** | Stylized doodles, low-poly |
| **Hyper3D Rodin Gen-2** | Image · text | GLB · FBX · USDZ · OBJ | ~60–90s | $0.30–0.40 via fal; $1.50/credit direct | None — $30–120/mo | Highest quality, 4K PBR (game-ready) |
| **Meshy 6** | Image · text · sketch | GLB · FBX · OBJ · USDZ · STL · BLEND | ~60–120s | ~$0.80/run via Wavespeed | API gated at Pro ($20/mo)+ | Balanced; sketch-to-3D explicit |
| **Hunyuan3D 2.1 / 2.5** | Image · text | GLB · OBJ + PBR | ~30–60s self-host | **Free (Apache 2.0)** or ~$0.05–0.10 hosted | Open weights on HF; 6 GB VRAM shape, 16 GB w/ texture | Self-host route |
| **TRELLIS / TRELLIS.2 (Microsoft)** | Image | GLB · Gaussians · NeRF | ~30–90s | ~$0.05–0.10 on fal | **Open weights on HF (4B params); $20 free fal signup** | **Wins 68% of academic benchmarks**; highest visual fidelity |
| **Stable Fast 3D (SF3D)** | Single image | GLB (UV-unwrapped, PBR) | **0.5s** | 2 credits/successful gen via Stability API; free under <$1M revenue | Free open weights on HF | Speed-critical demos |

### Makeathon picks

**Primary: Tripo3D** — claim the dev grant for $50 free credits; mature API; handles stylized inputs well [24][25].

**Secondary: TRELLIS via fal.ai** — $20 free signup credits, ~$0.10/gen, best open-source quality at the price; single REST endpoint [26][27].

**Wildcard: Stable Fast 3D** — 0.5s latency for live "doodle-and-it-appears" UX. Lower fidelity, but the latency itself is the demo wow-factor [28].

**SVG note:** **No API accepts SVG natively.** Rasterize first (`html2canvas` or `canvas.toBlob` at 1024 px). One line of code, but call it out.

### Vision LLM router — the novel territory

Agent 2 found **no documented production case study** of using a vision LLM as a pre-step to route to a 3D generator. The closest published work is research-stage:
- "Agentic 3D Scene Generation with Spatially Contextualized VLMs" arXiv 2505.20129 [29]
- SpatialVLM

CSM's "Cube" does scene understanding internally but doesn't expose a vision-LLM stage [30].

**This is a distinctive wedge moment for the demo video.** "Watch — Desk Doodles looks at the doodle, figures out 'this is a Pikachu,' picks the right 3D generator, sends a tuned prompt, gets back a model, applies your sketch style to its surface." No competitor does this end-to-end.

### Prompt for the vision LLM router (sketch)

```
SYSTEM: You analyze a user's drawing and route it to the best 3D-generator API.

INPUT: <image>

OUTPUT (strict JSON):
{
  "object_class": "<one of: character | creature | object | architecture | abstract | scene>",
  "stylization_level": "<one of: photoreal | stylized | abstract>",
  "complexity": "<one of: simple | medium | complex>",
  "suggested_api": "<one of: tripo | trellis | sf3d>",
  "suggested_prompt": "<a 1-sentence prompt to send to the API, written in its preferred style>",
  "recommended_3d_style": "<one of: native-toon | native-edges | native-wireframe | SVG port (stable seed)>"
}
```

Caching: cache the LLM analysis by content-hash of the input image. Don't re-call on every mode-flip.

---

## 9. Chrome UX — preventing the "pink mess" (asks #5 + #6)

Sebs's concern: "see the pink that would be weird for shading — could become a mess quick with all the controls."

### The discipline already locked

Per `09-LOCKED-MODEL.md` §I-13: **chrome groups toggles by cluster**, cluster master toggles render at the top of each group. The 5 clusters:

| # | Cluster | Master | Members |
|---|---|---|---|
| 1 | Multi-Stroke | wobble | wobble · strokeCount · strokeWidth · endpointBehavior · sketchingStyle |
| 2 | Pen Tip | penTip | penTip + (any pen-specific modifiers) |
| 3 | Shading | fillStyle | fillStyle · hachureGap · hachureAngle · fillDensity · fillOpacity · inkIntensity |
| 4 | Surface Texture | texture | texture · textureIntensity · roughness · grainIntensity · smudgeAmount · pressureVariance |
| 5 | Color/Palette | strokePalette | strokePalette · fillPalette |

### UX strategy (the "don't become a mess" promise)

**Three locked mechanisms:**

1. **Cluster collapse/expand** — show the cluster master + value; click to expand and reveal the cluster's members. Default: only Style + Multi-Stroke + Shading expanded. (User can re-pin via a small star icon — post-MVP polish.)
2. **Context-aware visibility** — modifiers hide when irrelevant. Already locked:
   - `hachureGap` / `hachureAngle` / `fillDensity` only show when `fillStyle ∈ {hachure, cross-hatch, dots, zigzag, dashed, zigzag-line}`
   - `dotSize` / `dotSpacing` only show for `fillStyle === 'dots'` OR `texture === 'stipple'`
   - `bleed` only shows for `style === 'wet-ink'`
   - `grainIntensity` only shows for `style === 'charcoal'`
3. **Reset to preset button per cluster** — one click, that cluster snaps back to the active Style preset. Solves the "I twisted too many knobs" anxiety.

### Tactical changes to apply now

Looking at the current `SmartHachureChrome.tsx`:
- All clusters render flat (no collapse) — **add `<details>` per cluster with the master visible always, members under expand**
- Reset-to-preset already wired per `feedback_more_toggle_options_better` — keep it
- The "pink shading" Sebs flagged is the active-value highlight on dropdowns — **change from solid pink to a thin pink left-border (per `north-star-filter.md`: "disciplined systems with human residue"; not gallery-piece)**

### 3D mode controls layout

When user flips to 3D mode:

**Always-visible row (top):**
- `2D ↔ 3D toggle`
- `3D Geometry mode` (Rod / Extrude / Solid / Inflate) — the 4-button row
- `3D Style` dropdown (`native-toon` / `native-edges` / `native-wireframe` / `halftone` / `SVG port (stable seed)`)

**Cluster behavior:**

| If 3D Style is... | Then show... |
|---|---|
| `native-toon` | toon-specific modifiers (toon levels, shadow color, rim light) |
| `native-edges` | edge angle threshold (default 30°) + line width + line color |
| `native-wireframe` | drei `<Wireframe>` props (fill / fillMix / stroke / thickness / dashes) |
| `halftone` | dot size / pattern / angle (post-process uniforms) |
| `SVG port (stable seed)` | **The entire 2D Style sub-dropdown + ALL 2D clusters reappear** — because the same pipeline is rendering |

This is the magic: "SVG port" doesn't multiply the control surface, it shares it. One pipeline, one set of clusters.

### Avoiding chrome explosion

Hard rules:
- **Never show all 5 clusters expanded at once** unless user explicitly opens them
- **3D-specific clusters are MUTUALLY EXCLUSIVE with 2D-specific clusters** when in 3D mode (except for SVG-port which intentionally inherits 2D)
- **Sliders that already exist for both modes** (wobble, jaggedness, roughness, bowing, curve, strokeWidth) STAY across the flip — they're the user's hand-feel commitment, not the style commitment

---

## 10. Implementation phases — Day 9 → 18 (v1.1 with Top-3 lock)

Mapping research to the schedule from `SESSION-HANDOFF.md`:

| Day | Date | Work |
|---|---|---|
| **9** | 06-10 | Make checkpoint #1 ✓ · doc mirror ✓ · 6-agent research ✓ · this synthesis doc ✓ · Contra social URL submit |
| **10** | 06-11 | Public canvas + Supabase (1 table: `id`, `session_id`, `svg_blob_url`, `created_at`; anon publish; shared feed with infinite canvas) |
| **11** | 06-12 | 3D-easy scaffold: R3F Canvas + **Stroke (focus #1)** + Punch out (free win) + cannon-es body; 2D↔3D mode toggle; auto-resize input normalizer. Smart Hachure Phase A baseline (8-band L* → hachure coverage table) |
| **12** | 06-13 | NPR-on-3D screen-space hatching post-process · SVG-port (stable-seed) 3D Style — works on ALL Geometry modes universally · physics presets (rock / balloon) · Make checkpoint #2 · video assets start (Weave) · Inflate-Lite if time |
| **13** | 06-14 | **Volumetric AI (reach #3)** wiring — vision LLM router + Tripo/TRELLIS · **3D Artist (focus #2)** — pipeline shares with Volumetric AI, the polish is the multi-pass style-guide JSON + heavy-prompted output · Make checkpoint #3 · main demo video shoot |
| **14** | 06-15 | Polish · 30-sec social cut · Community share · final Make sync |
| **15** | 06-16 | Buffer — stretch items if MVP solid (S1 image upload · S3 cross-hatch + dots · S6 ML routing · S7 stipple + charcoal 3D ports) |
| **16** | 06-17 | Buffer — submission paperwork prep |
| **17** | 06-18 | Submit by 11:59 PM PDT |

---

## 11. Open questions / followups

- **TAM texture asset.** Screen-space approach needs a packed 8-band hatch texture. Author one in 2D (Procreate / Krita / hand-drawn at 1024 × 128) OR generate procedurally via Praun's algorithm in a worker on first load. **TBD Day 12.**
- **cannon-es body for non-convex meshes.** Extrude/Solid/Inflate outputs are arbitrary triangle meshes. cannon-es Convex body needs convex hull; Trimesh body has performance issues with many triangles. **Mitigation:** auto-compute convex hull via `three-convex-hull` or simplify to oriented bounding box.
- **Vision LLM rate limits at demo time.** Claude API has 50 RPM on tier 1. **Mitigation:** content-hash cache on input image; demo with pre-warmed cache.
- **SVG-port rotation stability calibration.** Stable-seed (option a) is the simplest but may look "jittery in place" when the object is still. Try at 4 wobble values + 4 rotation speeds; record per-config; pick the band that reads as intentional. **TBD Day 13.**
- **Public canvas anti-cover validator.** `makeathon-plan.md` M9 specifies bbox check rejecting placement that fully obscures another object. Algorithm: AABB intersection > 80% of either bbox → reject + auto-scatter to nearest free spot. **TBD Day 10.**

---

## 12. Citations consolidated

**NPR shading on 3D surfaces (Agent 1):**

1. Praun, Hoppe, Webb, Finkelstein — "Real-Time Hatching" SIGGRAPH 2001. https://gfx.cs.princeton.edu/pubs/Praun_2001_RH/index.php · PDF: https://artis.inrialpes.fr/Members/Cyril.Soler/DEA/NonPhotoRealisticRendering/Papers/p581-praun.pdf
2. Webb, Praun, Finkelstein, Hoppe — "Fine Tone Control in Hardware Hatching" NPAR 2002. https://gfx.cs.princeton.edu/pubs/Webb_2002_FTC/Webb_2002_FTC.pdf
3. Hertzmann — "Painterly Rendering with Curved Brush Strokes of Multiple Sizes" SIGGRAPH 1998. https://mrl.cs.nyu.edu/publications/painterly98/hertzmann-siggraph98.pdf
4. Lake et al. — "Stylized Rendering Techniques for Scalable Real-Time 3D Animation" NPAR 2000. http://www.markmark.net/npar/npar2000_lake_et_al.pdf
5. JonGreenberg/Crosshatching three.js NPR shader. https://github.com/JonGreenberg/Crosshatching
6. Codrops — "Sketchy Pencil Effect with Three.js Post-Processing" (2022). https://tympanus.net/codrops/2022/11/29/sketchy-pencil-effect-with-three-js-post-processing/
7. colesloow/moebius_shaders (Unity URP). https://github.com/colesloow/moebius_shaders
8. Blender Freestyle docs. https://docs.blender.org/manual/en/latest/render/freestyle/introduction.html
9. Kyle Halladay — "A Pencil Sketch Effect" (TAM tradeoffs). https://kylehalladay.com/blog/tutorial/2017/02/21/Pencil-Sketch-Effect.html
10. "Controllable Neural Style Transfer for Dynamic Meshes" SIGGRAPH 2024. https://dl.acm.org/doi/10.1145/3641519.3657474
11. "Advances in 3D Neural Stylization: A Survey" IJCV 2025. https://link.springer.com/article/10.1007/s11263-025-02403-9
12. "Hybridizing Expressive Rendering" arXiv 2506.00870 (2025). https://arxiv.org/pdf/2506.00870

**Source-darkness to hatch density math (Agent 4):**

3. Murray-Davies equation history. https://cmykhistory.com/murray-davies-equation-origin-story/
4. Modeling Yule-Nielsen Halftone Effect — IS&T. https://library.imaging.org/admin/apis/public/api/ist/website/downloadArticle/jist/40/3/art00008
5. CIELAB color space — Wikipedia. https://en.wikipedia.org/wiki/CIELAB_color_space
6. Color difference — Wikipedia (Mahy ΔE 2.3 JND). https://en.wikipedia.org/wiki/Color_difference
7. rough.js. https://github.com/rough-stuff/rough · hachure-fill: https://github.com/pshihn/hachure-fill
8. Secord weighted Voronoi stippling — NPAR 2002. https://www.cs.ubc.ca/labs/imager/tr/2002/secord2002b/secord.2002b.pdf
9. p5.brush. https://github.com/acamposuribe/p5.brush

**Pipeline orchestration (Agent 5):**

10. TouchDesigner Cook docs. https://docs.derivative.ca/Cook
11. Houdini cooking system. https://www.artivoxa.com/understanding-houdinis-cooking-system-why-your-scene-is-slow-and-how-to-fix-it/
12. Blender Geometry nodes caching. https://developer.blender.org/docs/features/nodes/proposals/caching/
13. Cables.gl. https://cables.gl/
14. tldraw Image Pipeline starter kit. https://tldraw.dev/starter-kits/image-pipeline
15. Excalidraw canvas rendering pipeline (sceneNonce). https://deepwiki.com/excalidraw/excalidraw/5.1-canvas-rendering-pipeline
16. OPFS vs IndexedDB benchmark. https://barndoors.lumafield.com/3x-faster-project-loads-with-the-origin-private-file-system/
17. Cockatiel (TS resilience). https://github.com/connor4312/cockatiel

**Three.js 2D-to-3D primitives (Agent 3):**

18. SXM4434/free-stroke `lib/geometry-engines.ts`. https://github.com/SXM4434/free-stroke/blob/main/lib/geometry-engines.ts
19. Igarashi Teddy paper. https://www.cs.toronto.edu/~jacobson/seminar/igarashi-et-al-1999.pdf
20. Teddy SIGGRAPH archive. https://history.siggraph.org/learning/teddy-a-sketching-interface-for-3d-freeform-design-by-igarashi-matsuoka-and-tanaka/
21. Three.js TubeGeometry. https://threejs.org/docs/#api/en/geometries/TubeGeometry
22. Three.js ExtrudeGeometry. https://threejs.org/docs/pages/ExtrudeGeometry.html
23. Codrops real-time dithering shader 2025. https://tympanus.net/codrops/2025/06/04/building-a-real-time-dithering-shader/

**Image-to-3D APIs (Agent 2):**

24. Tripo3D pricing. https://www.tripo3d.ai/pricing
25. Tripo developer credit program ($50 free). https://www.tripo3d.ai/blog/tripo-game-hub-developer-api-credits-program-english
26. Microsoft TRELLIS. https://github.com/microsoft/TRELLIS
27. TRELLIS on fal.ai. https://fal.ai/models/fal-ai/trellis/api
28. Stable Fast 3D. https://stability.ai/news-updates/introducing-stable-fast-3d
29. Agentic 3D Scene Generation arXiv 2505.20129. https://arxiv.org/html/2505.20129v2
30. CSM Cube. https://3d.csm.ai/

**Frontier survey (Agent 6):**

31. Womp Spark (sketch/image → 3D print). https://www.womp.com/blogs/how-to-turn-any-drawing-or-image-into-a-3d-print-in-womp/
32. Spline AI 3D generation. https://spline.design/ai-generate
33. Adobe Project Neo (vectors → extruded 3D). https://projectneo.adobe.com/
34. Krea 3D. https://www.krea.ai/3d
35. Hybridizing Expressive Rendering (IEEE CG&A 2026). https://arxiv.org/abs/2506.00870

**Gap-fill agent — 3D Artist mode mechanics (v1.2):**

- [G1] Meshy 6 Launch Blog. https://www.meshy.ai/blog/meshy-6-launch
- [G2] Meshy 6 ComfyUI tutorial (art_style param). https://docs.comfy.org/tutorials/partner-nodes/meshy/meshy-6
- [G3] Hyper3D Rodin Gen-2 API. https://developer.hyper3d.ai/api-specification/rodin-generation-gen2
- [G4] Hyper3D Generate Texture API. https://developer.hyper3d.ai/api-specification/generate-texture
- [G5] Tripo v3.0 Ultra release notes. https://www.tripo3d.ai/blog/introducing-tripo-new-algorithm3
- [G6] Tripo Platform OpenAPI schema. https://platform.tripo3d.ai/docs/schema
- [G7] 3D Arena evaluation paper (splat vs mesh ELO). https://arxiv.org/pdf/2506.18787
- [G8] Microsoft TRELLIS repo. https://github.com/microsoft/TRELLIS
- [G9] Mesh-RFT paper. https://arxiv.org/pdf/2505.16761
- [G10] Krea AI 3D Generator (Hunyuan3D2.1). https://www.krea.ai/nodes/app/sturdiermemorablechimaera/ai-accuracy
- [G11] LLM Structured Outputs guide (2026). https://collinwilkins.com/articles/structured-output
- [G12] Anthropic API pricing docs. https://platform.claude.com/docs/en/about-claude/pricing
- [G13] Claude Opus 4.7 pricing breakdown — CloudZero. https://www.cloudzero.com/blog/claude-opus-4-7-pricing/
- [G14] Tripo Studio pricing. https://www.tripo3d.ai/pricing
- [G15] Sloyd vs Meshy vs Tripo vs CSM vs Hyper3D credits comparison. https://www.sloyd.ai/blog/3d-ai-price-comparison
- [G16] TRELLIS on fal.ai. https://fal.ai/models/fal-ai/trellis
- [G17] TRELLIS 2 on fal.ai. https://fal.ai/models/fal-ai/trellis-2
- [G18] three.js displacement map example. https://threejs.org/examples/webgl_materials_displacementmap.html
- [G19] Displacement Maps in R3F. https://codeworkshop.dev/blog/2020-11-05-displacement-maps-normal-maps-and-textures-in-react-three-fiber
- [G20] CodePen: Vertex/fragment displacement shader. https://codepen.io/marksunming/pen/zYNjPQd

---

## 13. The wedge (Agent 6 synthesis — for the demo video)

> Everything shipping in 2026 treats "sketch → 3D" as a *fidelity* problem (how realistic can we make the mesh) and "3D NPR" as a *post-process* (style transfer onto a finished render). Nobody ships a tool where (a) the user's *own* mark grammar — their stroke character, weight, jitter — is preserved end-to-end *into* the 3D output, and (b) the 3D output is rendered back in marks consistent with that same grammar.
>
> Tripo, Meshy, Krea give you a clean mesh stripped of your hand. Womp gives you sculpted clay. NPR research papers are style-image transfer, not stroke-grammar transfer.
>
> **Desk Doodles' defensible position is *the user's hand survives the round-trip*: their drawn marks generate 3D form, and the 3D form is re-rendered in marks of the same family — sketch in, sketch out, with the artist's signature intact.**
>
> No shipping tool currently treats stroke grammar as a first-class transport between 2D and 3D. Lean on Tripo/TRELLIS as the geometry engine if needed, but **own the rendering layer** (Smart Hachure as the NPR shader on top of an R3F/three.js scene) — that is the makeathon-distinctive surface, not the mesh-generation step itself.

---

**Doc status: COMPLETE 2026-06-10. Next: Day 10 implementation work begins from §10 schedule.**
