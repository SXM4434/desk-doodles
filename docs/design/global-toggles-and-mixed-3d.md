# Global-Toggle Semantics on Mixed-Treatment Desks

**Date:** 2026-06-11 · **Status:** DESIGN OPTIONS — recommendation made, key calls flagged as SEBS DECISIONS (nothing locked here).
**The question (Sebs, 2026-06-11):** "we need to figure what we do when we have multiple different types of treatments and some are 3D already and we turn all 3D — do we do one sweep of all the same 3D? do we just convert the SVG style to the 3D version? the toggles are global."
**Contracts read against:** `docs/research/21-research-3d-pipeline-and-style-translation.md` v1.2 (§5, §6, §13) · `docs/design/3d-roundtrip-build-plan.md` · `docs/design/object-model-and-desk-architecture.md` · `docs/memory/project_f3_shading_port_to_3d.md` · `docs/locked-refs/F3-smart-hachure-system/07-architecture-ml-pipeline.md` · `makeathon-plan.md` §S12/§S13.

---

## 1. TODAY — what "global toggle" actually means in the code

| Fact | Where |
|---|---|
| ALL toggles live in shell chrome, never in cell/design (locked rule) | `feedback_toggles_always_in_chrome`; `SmartHachureChrome.tsx` mounts in DeskPage's right `CollapsiblePanel` (`DeskPage.tsx:666-678`) |
| ONE modifier state restyles every object | `F3RoughModifiersContext.tsx` — single provider, single `F3ModifiersState`; every desk object renders through `<SvgStyleTransform>` reading that same context (`DeskPage.tsx:640-662`) |
| ONE global Style | `F3SvgStyleContext.tsx` — the 11-style enum, also chrome-global |
| Per-object overrides: data shape exists, behavior doesn't | `doodles.render_config` jsonb is live (`schema-v2-desks.sql:113`), `publishDoodle` accepts it (`publish.ts:44,132,153`) — but `DeskPage.tsx:345` publishes WITHOUT it and **nothing ever reads it back**. Write-capable, read-never. |
| 2D/3D toggle today | /canvas only (`DeskDoodlesCanvas` mode tablist + honesty gate). The 3D build plan adds `Canvas3DContext { geometryMode, style3d }` — also chrome-global (`3d-roundtrip-build-plan.md` §2.4). |

**The load-bearing nuance:** today's toggles are global ACROSS OBJECTS but **local to the viewer**. Chrome state is React state on your client — only `x/y/rotation` + svg sync through Supabase. When you drag wobble, *your* whole desk restyles; nobody else sees it. The "global toggle" is already behaving like a **lens you hold up to the shared desk**, not an edit to the shared artwork. That accident is the strongest hint about what the 3D toggle should be.

---

## 2. THE QUESTION — the mixed desk

Day 11+ the desk goes mixed: object **A** drawn-2D rough-handdrawn · object **B** already-3D Rod (per-object 3D, build-plan stretch 6.2) · object **C** uploaded-SVG newsprint. User flips the global **3D** toggle. What happens?

### Option space (4 honest options)

**(a) Global sweep — every object becomes the same 3D treatment.** Current global-toggle semantics extended verbatim: 3D = one more global modifier; all objects become, say, Extrude+hatch.

| Axis | Implication |
|---|---|
| Object record | None needed — record stays a blob; global state is the only truth. |
| Realtime | If sweep is viewer-local (today's behavior), others never see it — the "sweep" is a private hallucination. If synced, one viewer rewrites everyone's desk (a stranger flattening YOUR object's treatment). |
| Caching | One mesh per (content-hash, sweep-treatment) — simple. |
| Demo | One dramatic "whole desk pops to 3D" beat — but every object identical = the Tripo failure mode on our own desk. |
| Fatal problem | Object B already chose Rod. A sweep re-treats B → tramples the user's pick (violates I-1 spirit: user picks are sacred, `09-LOCKED-MODEL.md`). And C has no strokes retained (`3d-roundtrip-build-plan.md` §0: raw points discarded at the /desk Done boundary) — the sweep can't honestly build geometry for every object anyway. |

**(b) Per-style mapping — each SVG style converts to its 3D-equivalent style.** Needs an SVG→3D style map. The locked synthesis says there ISN'T a 1:1 enum map: **SVG and 3D have SEPARATE Style dropdowns** (`project_f3_shading_port_to_3d`, locked 2026-06-02); the bridge is the single **"SVG port"** 3D style that runs the whole 2D pipeline on EdgesGeometry-projected polylines (21 §6). So (b) honestly collapses to: *in 3D, each object renders as SVG-port carrying ITS OWN stored 2D style*.

| Axis | Implication |
|---|---|
| Object record | Requires per-object 2D style + modifiers persisted — `render_config` must be written at publish AND read at render. |
| Realtime | Map output is deterministic from the record → all viewers converge for free; nothing extra to sync. |
| Caching | Per (content-hash, geometry-mode, style) — matches the CLAUDE.md cached-mode-flip promise. |
| Demo | The wedge in purest form: A stays rough-handdrawn in 3D, C stays newsprint in 3D — sketch in, sketch out, per object. |
| Honest cost | SVG-port is Day-13-stretch/post-makeathon (21 §6 decision matrix). Until it's real, the only honest interim mapping is "every object → hatch NPR driven by the shared Shading sliders" (the build plan's MVP shader) — which is (a)'s look with (b)'s data model. No-stub rule applies (`project_f3_styles_must_all_be_real`). |

**(c) View-mode model — 3D is a per-desk VIEW MODE.** The toggle changes the RENDERER, not the artwork. Treatments stay per-object in `render_config`; flipping to 3D re-renders every record through the 3D renderer; flipping back loses nothing.

| Axis | Implication |
|---|---|
| Object record | Same requirement as (b): the record becomes load-bearing (read `render_config`, don't just write it). The toggle itself stores NOTHING on objects. |
| Realtime | Nothing to sync — the lens is yours. This formalizes today's accidental viewer-local semantics instead of fighting them. Zero write traffic, zero "stranger restyled my doodle" cases. |
| Caching | Content-hash per (object, view-mode) — exactly the "cached in Supabase so mode-flip doesn't re-generate" core promise (CLAUDE.md §Purpose). |
| Demo | Non-destructive flip: desk → 3D → orbit → back to 2D, every object intact. Strong craft story; pairs with the slider beat (move hachureGap, 2D and 3D restyle together). |
| Cost | "What renders in 3D for an object with no strokes?" needs a per-object fallback policy (extrude-from-outline / flat card / honest skip-with-note). |

**(d) Per-object 3D with global default + object-surface override.** The global toggle sets the desk's default mode; any object can PIN its own mode/treatment via the Edit/Sandbox surface (`object-model-and-desk-architecture.md` §one-object-surface), stored in `render_config`. Pinned beats global. This is `makeathon-plan.md` §S13's "applies to me / not to me" partial-toggle, and the pipeline's "Override Store wins" made user-facing.

| Axis | Implication |
|---|---|
| Object record | Record carries `{ mode: '2d'|'3d', geometryMode, style3d, …2D config }` — the fullest version of object-as-record. |
| Realtime | A PIN is artwork, not lens → synced; everyone sees B as a 3D rod sitting on the 2D desk. Mixed desk becomes a *feature*. |
| Caching | Same per-(object, mode) hashes; pinned objects just always hit their pinned-mode cache. |
| Demo | "This one's 3D, the rest aren't" is a unique shot no competitor desk has. Depends on the Edit surface + stroke retention (both real slices, queued). |

---

## 3. PRECEDENTS — how multi-mode canvases split global vs per-object

- **Blender — viewport shading**: shading mode (wireframe/solid/material/rendered) is a *viewport* setting that restyles the whole scene without touching any object's material; per-object Display properties can override it. Global-lens + per-object-override, exactly the (c)+(d) composite. [Blender manual: Viewport Shading](https://docs.blender.org/manual/en/2.81/editors/3dview/controls/shading.html)
- **Figma — view settings are per-person**: pixel preview, outline mode, zoom live in the view-options menu and affect only your tab — collaborators keep their own view while edits sync. The multiplayer answer to "do others see my sweep?": no, view ≠ edit. [Figma Help: Adjust your zoom and view options](https://help.figma.com/hc/en-us/articles/360041065034-Adjust-your-zoom-and-view-options) · [View layer outlines](https://help.figma.com/hc/en-us/articles/5724448965527-View-layer-outlines-in-Figma-Design)
- **tldraw — styles are per-shape props**: the styles panel edits the current *selection* (or sets the default for the next shape); `StyleProp` values are saved on each shape and tracked across selections. There is no global restyle-everything toggle — per-object record is the source of truth. [tldraw docs: Styles](https://tldraw.dev/sdk-features/styles)
- **Spline — two scopes, explicitly split**: materials are per-object (Material panel per object); post-processing effects are scene-global under Scene → Effects. Global = renderer-level effects, per-object = identity. Mirrors "hatch pass global, treatment per-record." [Spline docs: Effects (Post-Processing)](https://docs.spline.design/doc/effects-post-processing/docT36uyyg7Y) · [Getting started — Materials](https://docs.spline.design/)
- **Illustrator — outline mode**: GPU Outline/Preview toggles re-render all artwork as paths without modifying it — the canonical "toggle changes the renderer, not the file." [Adobe Help: How to view artwork](https://helpx.adobe.com/illustrator/using/viewing-artwork.html)

No surveyed tool implements (a)'s destructive same-treatment sweep as a *mode toggle*; where bulk restyle exists it's an explicit selection action (tldraw: select-all then style), which is our S12 "Unify" — an action, not a toggle.

---

## 4. RECOMMENDATION — the layered model (c) + (b) + (d), sweep demoted to an action

The options aren't mutually exclusive; they answer different questions. Recommended composite:

1. **The global 3D toggle = a viewer-local VIEW MODE (c).** It swaps the renderer for the desk you're looking at. Never writes to objects, never syncs. This formalizes the semantics the chrome already has (viewer-local global state) and keeps the locked toggles-in-chrome rule untouched — placement stays, meaning sharpens.
2. **What each object shows in 3D = its own record (b).** The 3D renderer reads each object's `render_config`; the per-style "conversion" is SVG-port-carrying-the-object's-2D-style once SVG-port lands (the locked bridge, 21 §6). **Makeathon interim:** all objects render Rod/Extrude + the procedural hatch NPR driven by the shared Shading sliders (`3d-roundtrip-build-plan.md` §3) — honest, labeled, no stub styles.
3. **Per-object pin (d) lands WITH the Edit surface**, not before. Pinned mode is artwork → persisted + synced. Pin always beats the global lens (Override-Store-wins).
4. **The same-treatment sweep (a) is NOT the toggle.** If we want the "snap everything to one look" moment, that's S12 Unify — an explicit, named action with its own affordance, already specced in the plan.

**Why this wins against the wedge:** "the user's hand survives the round-trip" (21 §13) is a *per-object* promise — A's hand, B's hand, C's hand each survive. A same-treatment sweep is our own product committing the Tripo sin (one clean look stripping every signature). The view-mode lens + per-object record is the only shape where the round-trip is non-destructive AND per-hand.
**Why it wins on craft/simple:** one new concept ("3D is a lens"), zero sync code now, no destructive paths to undo, and the record work is already mandated by S12/S13 + the object-model keystone — we're naming required work, not adding scope.
**Determinism/Make:** per-object stable seed keyed off object id/content-hash (no unseeded randomness, no wall-clock in render paths); pure-JS R3F path per the build plan — no WASM, relative imports only.

### SEBS DECISIONS (open — defaults recommended, not locked)

| # | Decision | Recommended default |
|---|---|---|
| D-1 | Global 3D toggle semantics: view-mode lens (c-composite) vs same-treatment sweep (a) | Lens. Sweep only as explicit S12 Unify action, if ever. |
| D-2 | Do other viewers see your 3D flip? | No — viewer-local, like Figma view settings. Desk-synced "everyone flips" is a post-makeathon experiment. |
| D-3 | 3D fallback for stroke-less objects (uploaded SVGs, pre-retention doodles) | Extrude-from-outline where closed paths allow; otherwise flat "paper card" standing on the desk + honest note. Never silently skip. |
| D-4 | Interim 3D look before SVG-port: one shared hatch NPR for all objects — acceptable for the demo? | Yes, labeled "Hatch" — it still answers to the user's Shading sliders (the wedge beat survives). |
| D-5 | What 2D mode shows for a pinned-3D object (once (d) exists): its 2D source render vs a 3D snapshot | Its own 2D render — the record keeps both lives; nothing is baked. |
| D-6 | When `render_config` starts being WRITTEN at publish (it's read-prerequisite for everything above) | Next publish-path touch: snapshot style + modifiers at Done. Cheap now, expensive to backfill. |

---

## 5. Rendering-pipeline placement (signals → classify → treatment → render)

Per `07-architecture-ml-pipeline.md` + `project_generalizable_rendering_decision_pattern.md`, each piece of this doc sits at exactly one stage:

| Stage | What from this doc lives there |
|---|---|
| **Signals** | Per-object: stroke availability, closed/open, complexity, source darkness — unchanged. |
| **Classify** | Geometry auto-pick (Rod for open / Extrude for closed — Phase D routing, 21 §5b); stroke-less-object fallback class (D-3). |
| **Treatment** | The per-object record: `render_config` = the SELECTED treatment, persisted. Per-object pin (d) = the Override Store winning over any global suggestion. Global modifier sliders = treatment-stage *bias*, same as today. |
| **Render** | **The global 3D toggle lives here and only here** — it selects which RENDERER consumes the treatments (SvgStyleTransform vs R3F scene + hatch/SVG-port). It must never reach back and mutate treatment or classify outputs. |

That one sentence is the whole architecture: **mode is a render-stage choice; style is a treatment-stage record; the global toggle picks the renderer, the record tells the renderer what each object IS.** Any implementation where flipping 3D writes into objects' treatments has drifted upstream and should be caught in review.

---
**Next actions if Sebs ratifies D-1/D-2:** (1) write `render_config` at publish (D-6, ~10 LOC in DeskPage's publishDoodle call); (2) keep `Canvas3DContext` as the lens state per the build plan; (3) fold "read `render_config` in 3D renderer" into the /desk-3D stretch slice 6.2; (4) S13 pin affordance rides the Edit-surface slice.

---

## Addendum 2026-06-11 — D-7 (RATIFIED): the Global gate — sweep stays, explicitly enabled

Sebs's actual question (clarified after one mis-read): the sweep is NOT going away. In the real world the desk panel needs an explicit **GLOBAL toggle** gating the full sweep — and the design questions are (1) how enabling works, (2) what the panel's toggles do while Global is OFF.

**The ratified model ("gooo" 2026-06-11):**
- **Global OFF (default): the panel is your PEN.** Toggles/sliders style the draw popup + the NEXT doodle you place. Placed objects are stable records rendering from their own `render_config` (D-6). Changing a placed object = its popup (Edit yours / Sandbox theirs). The panel always matches your latest placement by construction (it was drawn with these settings).
- **Global ON: the SWEEP goes live.** The same panel now drives every object on the desk — viewer-local lens semantics per D-1/D-2 (others never see your sweep; records untouched). Toggling Global OFF lifts the lens and every object returns to its own config.
- **Enabling affordance:** one pill at the top of the desk panel — `Pen | Desk` (or `Global` switch). Scope is always visible, never implicit. Persisting a sweep INTO the records ("make them all actually match") is S12 Unify, a separate explicit action, post-makeathon.
- **Why this wins simplicity/clarity:** one panel, two visible scopes, zero mixed-state sliders, no duplicate editor — and Global-OFF-by-default structurally fixes the all-N re-render perf bug (placed objects only listen while Global is ON).
