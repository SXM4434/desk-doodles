# 11 — The Pen Model: the panel is your pen, the popup is the object, Global is a lens

**In one sentence:** Every desk object is a frozen RECORD that stored its full render config at the moment you pressed Done, and the control panel doesn't edit those records — it's your *pen* (it styles the next doodle and the live preview), the object's own popup edits the object, and the Global switch turns the same panel into a viewer-local *lens* that re-renders the whole desk without ever writing to a single record.

---

## Plain language

This is the single most-confusing-until-it-clicks idea in the app, so here is the whole thing in one breath, the way Sebs locked it (D-7, ratified 2026-06-11):

> **The panel is your pen. The popup is the object. Global is a lens.**

Three surfaces, three jobs, and they never bleed into each other.

### The object is a record, frozen at Done

When you finish a doodle and press Done, the app doesn't just save a picture. It snapshots the **render config** — the SVG style, every modifier slider, the strokes you drew — onto the object's database row (`render_config` jsonb). That snapshot is taken *once*, at Done, and then it's frozen. It is the object's identity.

Think of it like a **baked render with the project file attached.** The baked image is what you see on the desk; the project file (strokes + config) rides along so the object can be re-opened and re-rendered later without guessing. A blob would be just the baked image — paint it once, lose the recipe. A record keeps the recipe. (This is the keystone from the object-model doc: stop treating objects as bare SVG blobs, start treating them as rich records — "the difference between a flattened bitmap and a layered file with the layers still live.")

### The panel is your PEN (Global OFF — the default)

The control panel on the right of the desk — the styles, the sliders, the fillStyle dropdown — is, by default, **your pen**. Here's the part that trips everyone up: with Global OFF, *moving a slider changes nothing on the desk.* The objects already there keep their own frozen looks. What the panel styles is:

1. **The live preview squiggle** at the top of the panel — a little sample stroke rendered through your current pen settings, re-rendering instantly on every change (this is the **Procreate Brush Studio** pattern: the brush panel never repaints your canvas, but the preview stroke gives your hand immediate feedback — see D-7 amendment 1).
2. **The draw popup** — when you open it to make a new doodle, it opens loaded with the pen's settings.
3. **The NEXT doodle you place** — its Done snapshot captures whatever the pen is set to right now.

So the pen is exactly a pen: it determines how the *next* mark you make will look, not how the marks already on the page look. Changing your pen never reaches back and re-inks what you already drew. That's why the placed desk is stable — it's a pile of finished drawings, each made with the pen as it was at the time.

### The popup is the OBJECT (how you change something already placed)

If the pen can't touch placed objects, how do you change one? You open its **popup** — the object surface. Click an object you own → Edit. Click someone else's → Sandbox (changes don't save). The popup is the *one* place an existing object's look changes, and it writes back to that object's record. (Full mechanics of the popup — Create/Edit/Sandbox, Re-draw, naming — live on the [creation-loop page](12-the-creation-loop.md).)

One surface, never nested: the desk holds a single `activeSurface` slot, so a Create popup and an Edit popup *structurally cannot* both be open. Nesting is impossible by construction, not by being careful.

### Global is a LENS (Global ON — the sweep)

Now the twist that makes the pen also a power tool. Flip the **Pen | Desk** pill (the Global switch) to ON, and the same panel becomes a **lens you hold up to the whole desk.** Every object on the desk re-renders through the *current panel values* — the exact settings already in the pen, so the panel never jumps or lies. Drag the wobble slider and the entire desk wobbles together. Flip it back to Pen and the lens lifts: every object snaps back to its own frozen record, untouched.

Two things make this safe and honest:

- **It's viewer-local.** The lens is *yours*. Nobody else on the shared desk sees your sweep — exactly like Figma's view settings (pixel preview, outline mode) affect only your tab while edits sync to everyone. The records on the server never change, so there's no "a stranger flattened my object" failure.
- **It writes nothing.** Global ON is a render-stage choice, not an edit. Permanently baking a sweep into the records ("make them all actually match") is a *separate, explicit action* (S12 "Unify"), post-makeathon — never the toggle's silent side effect.

The two desk states, in one line each:

| State | Who rules | What you see |
|---|---|---|
| **Global OFF (Pen)** | Records rule | The MIXED desk — every object its own style AND its own mode (2D and 3D side by side), exactly as drawn |
| **Global ON (Desk)** | Toggles rule | The UNIFORM desk — every object re-rendered through the current panel state, including mode + geometry (a viewer-local lens) |

### Why "Global means ALL of them, including mode"

A subtle correction Sebs made (D-7 amendment 4, which supersedes an earlier "auto per object" reading): Global ON means the toggles own **everything** — not just the 2D style, but the mode flip and the 3D geometry too. Set the geometry dropdown to Rod and *every* object becomes a rod. The mode flip is just another toggle the lens sweeps, in both directions (flip to 3D and the whole desk is 3D under the current geometry; flip back and it all renders 2D under the current 2D toggles). "Auto" in the geometry dropdown isn't a hidden rule — it's just the dropdown's default *value* (each shape decides: open→rod, closed→extrude). It's a position on the toggle, not magic.

### The legacy freeze — why the pen had to stop touching old objects

There was a real bug the freeze fixes. Most objects on the live desk are **legacy** rows published before render-config persistence existed — their `render_config` is null. Before the fix, those null-config objects fell through to "render with the current pen values," so every time you moved a Pen-scope slider, the mostly-legacy desk *restyled* — which made the Pen|Desk distinction illegible (the pen visibly changed the desk even in Pen mode, contradicting D-7). The fix: **legacy/null-config rows pin to a DEFAULT snapshot at load.** Now Pen-scope slider moves leave the placed desk alone, and the Pen|Desk pill means what it says. (Optional later: a one-time backfill SQL to give legacy rows real configs.)

---

## The design — why it's built this way

**Why a frozen record instead of a live global style?** Because a shared public desk is a pile of *other people's finished work*. If the global panel edited the actual desk, one viewer's slider drag would rewrite everyone's art — the Tripo sin (one clean look stripping every signature) committed on our own product. Frozen records mean every object's hand survives no matter who's looking or what their pen is set to. The wedge ("the user's hand survives the round-trip") is a *per-object* promise; the record is what keeps it per-object.

**Why is the global toggle viewer-local and not synced?** Surveyed precedent is unanimous that view ≠ edit: Figma view settings are per-person, Blender viewport shading restyles your view without touching materials, Illustrator's Outline mode re-renders all artwork without modifying the file, tldraw keeps styles as per-shape props with no global restyle toggle at all. No surveyed tool ships a destructive same-treatment sweep *as a mode toggle* — where bulk restyle exists it's an explicit select-all action. So our sweep is a lens (toggle) and Unify is the action.

**Why the live preview squiggle is non-negotiable.** The gap Sebs kept probing: with Global OFF, moving a slider changes nothing visible → the controls *feel broken* even though they're correctly aiming at the next doodle. The preview stroke is what makes Pen mode legible — it's the immediate-feedback half of the pen. It ships *with* the gate, not after, and it re-renders instantly (direct manipulation = no tween, per the motion research).

**Why mode is a render-stage choice, never a treatment-stage write.** The whole architecture collapses to one sentence: *mode is a render-stage choice; style is a treatment-stage record; the global toggle picks the renderer, the record tells the renderer what each object IS.* Any implementation where flipping to 3D writes into objects' treatments has drifted upstream — it should be caught in review. This is the same `signals → classify → treatment → render` pipeline: the global toggle lives at **render** and only render.

**Why per-object pins land with the Edit surface, not before.** A future "pin this one object to 3D while the rest stay 2D" (the (d) model in the global-toggles doc) is artwork, not a lens — so it persists and syncs (everyone sees your pinned 3D rod sitting on the 2D desk). But it depends on the record holding a `mode` field and on the Edit surface existing, so it's sequenced after both, not bolted on early.

**What was rejected** (global-toggles doc §4 + D-7 amendments):

| Rejected | Why |
|---|---|
| Same-treatment sweep AS the toggle (option a) | Tramples objects that already chose their look; can't honestly build geometry for stroke-less objects anyway. Demoted to the explicit S12 Unify action. |
| Synced global flip ("everyone flips when you flip") | A stranger rewriting your desk's look. Post-makeathon experiment at most. |
| Neutral-default seed for Desk mode | The panel values would *jump* on flip (the panel would lie about what it's showing). |
| Latest-object seed for Desk mode | A hidden rule — the default global look should just BE your pen at the moment you flip it. |
| A real conversion step on Global ON | Destroys saved looks + other people's art. The sweep re-renders strokes; it never converts them. |

---

## Technical

All paths under `/Users/sebs/Desktop/Projects/desk-doodles/`. **Status note:** the D-7 model is the ratified CONTRACT; the desk-side wiring landed across the round-4 → round-6 build fleet (commits `f171da5` … `37b9bcb`). Read `docs/design/global-toggles-and-mixed-3d.md` (D-7 + amendments 1–5) before touching desk controls — it is the contract this page narrates.

### The record

- `doodles.render_config` jsonb column — live since `schema-v2-desks.sql`; `publishDoodle` accepts it (`src/app/lib/publish.ts`). The D-6 **penSnapshot** (`{ svgStyle, modifiers, strokes? }`) is what gets written at Done (`DeskPage.tsx` ~:1140).
- `DeskObject` interface in `DeskPage.tsx` is the in-memory shape; it grows from blob (`{ id, dbId, svgMarkup, x, y, rotation }`) toward the full record one field at a time.
- **Record schema v-next (planned, gap G-4):** optional `{ mode?, geometry?:{mode,params}, style3d?, material? }` so pinned-3D objects and the mixed desk can persist mode — written at the next publish-path touch (the round-7 3D chrome build), jsonb only, no SQL paste.

### The three surfaces in code

| Surface | Where | Role |
|---|---|---|
| **Pen** (the panel) | `SmartHachureChrome` in DeskPage's right `CollapsiblePanel`; reads the one global `F3RoughModifiersContext` + `F3SvgStyleContext` | Styles preview squiggle + draw popup + next doodle's Done snapshot |
| **Popup** (the object) | `DrawPanel.tsx` / object surface, single `activeSurface: { mode, objectId? } \| null` slot in DeskPage | The only writer of an existing object's look (Edit yours / Sandbox theirs) |
| **Lens** (Global ON) | the same chrome state, applied to every desk object's render when the Pen\|Desk pill = Desk | Viewer-local re-render; never persists |

### The Pen | Desk gate

- One pill at the top of the desk panel (`Pen | Desk`, default **Pen/OFF**). Scope is always visible, never implicit.
- **Pen (OFF):** placed objects render from their own `render_config`; the panel drives only the preview + next doodle. Structurally also fixes the all-N re-render perf bug — placed objects only listen to the panel while Global is ON.
- **Desk (ON):** the lens initializes from the *current* pen values (panel never jumps), re-renders every object through them, lifts cleanly on switch-back.
- **Live preview squiggle:** a sample stroke at the panel top, re-rendered instantly on every control change (D-7 amendment 1).

### The legacy freeze (UX-audit fix)

Null-`render_config` rows pin to a DEFAULT snapshot at load, so Pen-scope slider moves don't restyle the (mostly-legacy) live desk — this is what makes the Pen|Desk pill legible (it resolved a D-7 contradiction the audit found). Lives in `DeskPage.tsx` (landed in the round-6 DeskPage batch, `37b9bcb`).

### Where each piece sits in the pipeline

| Stage | What from this page lives there |
|---|---|
| **Signals** | unchanged — per-object stroke availability, closed/open, darkness |
| **Classify** | geometry auto-pick (Phase D); stroke-less-object fallback class |
| **Treatment** | the per-object record (`render_config` = the selected treatment, persisted); global sliders = treatment-stage *bias*; a future per-object pin = the Override Store winning over the global suggestion |
| **Render** | **the global 3D/lens toggle lives here and ONLY here** — it selects which renderer consumes the treatments; it must never reach back and mutate treatment or classify outputs |

---

## Connections

- **→ [12-the-creation-loop.md](12-the-creation-loop.md)** — the popup half of the model: how a record gets *minted* (draw → name → place) and *re-edited* (Edit, Re-draw). This page says "the popup is the object"; that page is the popup's full mechanics. Edge: *the pen makes the next doodle this page's loop creates*.
- **→ [13-the-3d-system.md](13-the-3d-system.md)** — the mode flip the lens sweeps in both directions; "Global ON means mode too." The 3D toggle is the render-stage renderer-swap this page formalizes. Edge: *mode is the render-stage choice this page keeps out of the record*.
- **→ [14-the-social-desk.md](14-the-social-desk.md)** — why viewer-local matters: the desk is *shared*, so the lens must be private and records must be sacred. Drag-to-place and the drawer also create records (place = copy). Edge: *the shared surface the lens is held up to*.
- **→ [03-the-smart-system.md](03-the-smart-system.md)** — "manual overrides always win, the algorithm is suggestion" generalizes here: the per-object record (and future pin) is the Override Store winning over the global pen's suggestion. Edge: *same authorship-is-sacred principle (I-1) at desk scope*.
- **→ [05-the-interconnection-graph.md](05-the-interconnection-graph.md)** — the global panel's sliders are the same cluster nodes; the lens just applies them at desk scope. Edge: *the toggle graph, swept across every object*.
- **→ [10-glossary.md](10-glossary.md)** — "pen," "lens," "record," "legacy freeze," "Pen|Desk gate" are this page's terms. Edge: *defines vocabulary for*.
- **Doc edges:** `docs/design/global-toggles-and-mixed-3d.md` (D-7 + amendments 1–5 — THE contract) · `docs/design/object-model-and-desk-architecture.md` (object-as-record keystone) · `docs/memory/project_f3_shading_port_to_3d.md` (separate dropdowns, mode flips convert from the record).

---

## Honest status

**The D-7 control model is RATIFIED (Sebs "gooo", 2026-06-11). The desk-side wiring landed across the round-4 → round-6 fleet; some pieces are still queued.** Precisely:

### Real in code today (2026-06-12)

- One global `F3RoughModifiersContext` + `F3SvgStyleContext`; the chrome panel restyles via a single shared state (the "pen" substrate).
- `render_config` jsonb column live; `publishDoodle` accepts it; the D-6 penSnapshot writes `{ svgStyle, modifiers, strokes? }` at Done (landed with the round-4 creation loop, `f171da5`).
- The object popup (Create/Edit/Sandbox) — Edit saves config to the object's record (schema-v4 RPC, `3dd411e`); Re-draw rewrites svg+strokes+config (schema-v5, `f171da5`).
- The legacy freeze (null-config rows pin to DEFAULT at load) — landed in the round-6 DeskPage batch (`37b9bcb`).
- Pan/zoom, drag-persist, viewer-local chrome semantics — the "lens is already accidentally viewer-local" behavior the model formalizes.

### Planned / queued (do not describe as fully shipped)

- **The explicit Pen | Desk pill + live preview squiggle** — the ratified gate. The viewer-local-global-state behavior exists by accident; the *explicit pill* + the *instant preview stroke* are the round-4/round-5 build (some fleet agents died on a session-limit; resume was queued). Verify the pill + squiggle in the build before claiming the full gate is live.
- **Record schema v-next with `mode`/`geometry`/`style3d`/`material`** — gap G-4, not yet written; required before per-object 3D pins are possible.
- **Per-object 3D pin (the (d) model)** — lands *with* the Edit surface + stroke retention, persisted + synced; not built.
- **S12 "Unify"** (persist a sweep into the records as a real action) — post-makeathon.
- **One-time legacy backfill SQL** (give null-config rows real configs) — optional, post-makeathon; the freeze covers correctness without it.

The shipping smart system everywhere remains a **rule engine**, not ML — the pen/lens model is orthogonal to that and changes none of it.
