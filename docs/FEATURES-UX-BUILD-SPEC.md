# Drawing-Tool UX Rework — Build-Ready Spec

**The "shape selection is bad UX" fix.**

**Status:** RESEARCH + DESIGN SPEC (build-ready). No app-src edited, no server run, no commit. · **Date:** 2026-06-13 · **Author:** research+spec agent (isolated worktree).
**Supersedes the decision content of:** `FEATURES-DRAW-TOOLS-PLAN.md` (that doc enumerated options; Sebs has since **picked** the direction — this doc specs the locked pick into a mechanical build plan). Where the prior doc and this one disagree, **this one wins** (it reflects Sebs's later iteration).
**Grounding refs (read alongside):** `docs/design/shape-assist-spec.md` (the recognizer's governing spec) · `src/app/lib/draw/shapeFit.ts` (the engine, already built) · `src/app/lib/draw/shapeLibrary.ts` (the 12 primitives, already built) · `src/app/components/DeskDoodles/DrawSurface.tsx` (the capture surface + `ShapeSnapApi` seam).

---

## 0. The locked direction (what we are building — DO NOT re-decide)

Sebs iterated past "draw → tap Snap → cycle a hidden chip" (the current model) to this five-part shape:

1. **AUTO-DETECT on draw.** When the user finishes a stroke (pen-up), the recognizer runs *automatically* and the stroke auto-cleans into the best-guess primitive (snap a circle/rect/triangle; straighten a polygon's edges). The recognizer **PROPOSES** — it doesn't wait for a button.
2. **FREE OVERRIDE after.** A quick-pick / chip lets the user switch the auto-detected result to **ANY** primitive — recognized alternatives **OR** any of the 12 library shapes. Drew a circle, wanted a heart? One tap. This override is what makes auto-detect **not "forced"** — it resolves the never-force-a-fit law (propose, user disposes) and must take **FEWER** clicks than today's hidden chip-cycle.
3. **MORE PRIMITIVES.** The 12 library shapes (`shapeLibrary.ts`: diamond, pentagon, hexagon, octagon, heart, cloud, speech-bubble, lightning, crescent, teardrop, block-arrow, star-5) are both **switch targets** (override) and **directly insertable**.
4. **DRAG-TO-PLACE + RESIZE/RESHAPE** for inserted shapes. **STOP before** rotation / skew / multi-select-transform / layers — the deliberate overcomplication line (the lead's restraint call, Sebs agreed).
5. **ONE shared `DrawToolbar`** hosts all of this — kills the duplicated DrawPanel/Canvas tool rows and fixes the RE-DRAW modal's missing tools.

The law that governs all of it (cite this verbatim in any code you touch):

> **SEBS'S LAW (never-force-a-fit):** auto-detect PROPOSES; the user DISPOSES. Auto-detect is only legitimate because it is *cheaply* dismissable / overridable — the override path must always be present, visible, and cost fewer interactions than re-drawing. A snapped result the user didn't ask for is one tap from any other primitive, and one tap from Original. We never silently force the least-bad fit, and we never make the clean shape the *only* reachable state. (Codify in the `shapeFit.ts` header next to the existing "freehand is the DEFAULT" note — see §9.)

**The honesty subtlety to preserve:** today `shapeFit.ts`'s header says "freehand is the DEFAULT … NEVER runs on pen-up, never auto-fires." We are *changing* that policy at the **host** layer (auto-detect on pen-up) while keeping the *engine* pure and the *override* free. The engine stays a pure proposer; the new policy is "auto-PROPOSE, then the override is the dispose." The closure-weld honesty (SA-G) is unchanged: auto-snap is still an explicit user act *in the sense that the user can instantly reject it* — but because it now fires without a button press, **the override affordance must be impossible to miss** (a persistent receipt, not a fade-out chip). That requirement is load-bearing, not polish (§4.4).

---

## 1. Current state (what exists, with exact anchors)

### 1.1 The engine is already built and correct
- **`src/app/lib/draw/shapeFit.ts`** (1662 lines, pure / node-runnable). `fitStroke(points, action)` → ranked `ShapeCandidate[]` with `'original'` always last (`:1367`, return `:1568`). `applyCandidate(candidate, original)` → a dense stroke-points array that REPLACES the stroke, stays a stroke, renders through the pen (`:1617`). `ShapeKind` = `line · polyline · polygon · triangle · rect · star · arrow · circle · ellipse · original` (`:199`). The auto-detect **already produces a ranked list** — it simply isn't *auto-invoked* on pen-up today.
- **`ShapeFitResult.accepted`** (`:236`) is the "did the best candidate clear `SNAP_MAX_NORM_ERR` (0.10)" gate — this is exactly the signal that decides whether to auto-apply on pen-up (§3.2).
- **`ShapeFitResult.candidates`** is the override's recognized-alternatives source: candidates within `2× threshold`, ranked, `'original'` last (`:1562-1566`).

### 1.2 The library is already built
- **`src/app/lib/draw/shapeLibrary.ts`** — `SHAPE_LIBRARY: ShapeLibraryEntry[]` (`:345`), 12 entries each `{ kind, label, curved, generate(bbox): Pt[] }`. `generateShape(kind, bbox)` (`:428`) returns the outline for a bbox. Curved shapes emit dense outlines (emit verbatim); cornered shapes emit corner vertices (densified downstream). This is the override's library-shape source AND the insert gesture's geometry source.

### 1.3 The capture surface + the seam
- **`DrawSurface.tsx`** owns `strokes` (`:1042`), `selectedStrokeId` (`:1052`), the pointer handlers (`handlePointerDown` `:1518` / `Move` `:1569` / `Up` `:1639`), `eventToSvgPoint(e)` (`:1379`, screen→viewBox via inverse CTM — **reuse this for the insert gesture**), and the **`ShapeSnapApi` seam** (`:49`, installed `:1322-1347`): `lastStroke()`, `fitLast(action)` (PURE), `applyToStroke(strokeId, candidate, originalPoints)`.
- **Tap-to-select already works** (`:1672-1679`): a pen-up under `TAP_SLOP_PX=6` (`:1458`) on an existing stroke within `SELECT_HIT_RADIUS_PX=16` (`:1459`) sets `selectedStrokeId`; `targetStroke()` (`:1312`) makes snap act on the selected stroke else the last. We keep this — it's how the override targets a *specific* stroke when several exist.

### 1.4 The duplication (what we're collapsing)
- **`DrawPanel.tsx`** (the /desk popup) renders the Snap/Straighten pills + `SnapChip` + the `runSnap`/`cycleSnapChip`/`dismissSnapChip` logic (`:160` SnapChip, `:427` runSnap, `:473` cycleSnapChip, `:499` dismissSnapChip) and the Ink|Shade register row + `ToneShadeCluster`.
- **`DeskDoodlesCanvas.tsx`** (the /canvas test page) has a **near-verbatim copy** — its own `SnapChip` (`:89`, comment `:85` "Mirrors DrawPanel.tsx's SnapChip"), its own `runSnap`/`cycleSnapChip`/`dismissSnapChip` (`:252`/`:297`/`:323`), comment `:194` "Mirrors DrawPanel.tsx exactly (the reference)."
- **The RE-DRAW modal** (`ObjectSurface.tsx:1004-1056`) mounts `<DrawSurface>` (`:1040`) with **no `onSnapApi`, no tool row** — just a Draw|Style toggle (`:1024`). So re-draw can't snap, switch, or insert at all. This is RUNNING-TODO:16's "RE-DRAW missing tools" and the third copy that never got made.

**Consequence:** every shape feature today must be written *twice* (DrawPanel + Canvas) and is *absent* a third time (RE-DRAW). The shared `DrawToolbar` (§2) is the prerequisite that makes the rest a single implementation.

---

## 2. Component architecture — `DrawToolbar.tsx` (the one shared host)

**New file:** `src/app/components/DeskDoodles/DrawToolbar.tsx`. It is a **controlled, presentational** component: it owns no canvas state, takes everything via props, emits everything via callbacks. The three hosts (DrawPanel, DeskDoodlesCanvas, ObjectSurface's RE-DRAW stage) each own the state and pass the `ShapeSnapApi` down; DrawToolbar is the single rendering + interaction surface.

Move into it (deleting the duplicates from DrawPanel + Canvas):
- the **Ink | Shade** register pills + the `ToneShadeCluster` (already exported from `DrawSurface.tsx:2367`) when Shade is in hand;
- the **shape override receipt** (the chip, reworked — §4) ;
- the **Shapes quick-pick row** (insert + the override's library tail — §5);
- the **honest-miss / refusal caption** slot;
- the Sketch | Style render-axis pills if the host wants them in-toolbar (DrawPanel currently has them separately — keep them where they are; the toolbar does NOT own the render axis, only the per-stroke tool grammar). *(Mode 2D|3D and Input Draw|Upload stay in the header/dock — different axes, per the prior doc's correct split.)*

### 2.1 Props (the contract)

```ts
// src/app/components/DeskDoodles/DrawToolbar.tsx
import type { ShapeSnapApi } from './DrawSurface';
import type { ShapeCandidate } from '../../lib/draw/shapeFit';
import type { ShadeToolState } from './DrawSurface';

export interface ShapeOverride {
  /** The stroke the receipt/override currently targets. */
  strokeId: string;
  /** The auto-detect result the host applied on pen-up (best candidate, or
   *  'original' if auto-detect refused). The toolbar shows this as the receipt
   *  label and as the highlighted entry in the switcher. */
  appliedKind: ShapeCandidate['kind'] | (string & {}); // shapeFit kind OR library kind
  /** The override's full switch set, already merged + ordered by the host:
   *  recognized candidates (within 2× threshold) first, then the 12 library
   *  shapes, then 'Original' last. See §4.2 for the merge. */
  switchSet: SwitchEntry[];
  /** Index of appliedKind within switchSet (for the highlight + cycle). */
  appliedIndex: number;
  /** The drawn stroke's pre-snap points, so 'Original' restores exactly. */
  originalPoints: [number, number, number][];
}

export interface SwitchEntry {
  source: 'recognized' | 'library' | 'original';
  kind: string;          // shapeFit ShapeKind OR shapeLibrary kind OR 'original'
  label: string;         // "Circle", "Heart", "Original"
  /** For recognized entries: the actual ShapeCandidate to apply.
   *  For library entries: null — the host generates from the stroke's bbox.
   *  For original: null — the host restores originalPoints. */
  candidate: ShapeCandidate | null;
}

export interface DrawToolbarProps {
  // — register —
  penRegister: 'ink' | 'shade';
  onRegisterChange: (r: 'ink' | 'shade') => void;
  shadeTool: ShadeToolState;
  onShadeToolChange: (s: ShadeToolState) => void;
  shadeEnabled: boolean;          // false in RE-DRAW v1 if tone-edit is out of scope

  // — shape insert (armed) —
  armedShape: string | null;      // a shapeLibrary kind, or null = freehand
  onArmShape: (kind: string | null) => void;

  // — shape override receipt (post auto-detect) —
  override: ShapeOverride | null; // null = nothing to override right now
  onSwitchTo: (entry: SwitchEntry, index: number) => void; // pick a specific entry
  onCycleOverride: () => void;    // tap the receipt label = next entry (cheap path)
  onDismissOverride: () => void;  // keep the standing choice; logs 'keep'

  // — captions —
  note: string | null;            // honest-miss / refusal one-liner; null = hidden

  // — layout —
  variant: 'panel' | 'canvas' | 'redraw'; // minor sizing only; behavior identical
}
```

### 2.2 Internal structure (render tree, left → right in one wrapping row)

```
<DrawToolbar>
  ├─ <RegisterPills>            Ink | Shade           (existing pill grammar)
  │     └─ {penRegister==='shade' && <ToneShadeCluster .../>}   (imported, unchanged)
  ├─ <ShapeStrip>              [Freehand*] [▢][◯][△][◇][★][♥] [More ▾]
  │     │   *Freehand is the armed=null default, shown selected when armedShape===null
  │     │   the 6 inline = the most-common: rect, circle, triangle, diamond, star, heart
  │     └─ <ShapeOverflow>     popover with the full 12 library + the recognized set
  ├─ <OverrideReceipt>         {override && "Circle ▸  (tap to switch · ✎ all)"}
  │     └─ <SwitchPopover>     the full switchSet as a grid (recognized · library · Original)
  └─ <Caption>                 {note}
```

- **`<ShapeStrip>`** drives **insert** (arm a shape → drag on canvas). It's persistent (always visible), Excalidraw-style. `Freehand` is one of its entries (the default). [Mobbin toolbar UX; Excalidraw tool row — §8.]
- **`<OverrideReceipt>`** appears **only when `override != null`** (i.e., right after a stroke auto-detected). It is the dispose half of propose-dispose. It is the *receipt*, persistent until dismissed (§4.4) — not a 5s fade.
- **`<ShapeOverflow>`** and **`<SwitchPopover>`** are the overflow menus for the 12-shape long tail (toolbar best practice: surface a few, overflow the rest — §8).

### 2.3 Each host's job after extraction
- **DrawPanel.tsx:** delete its `SnapChip` (`:160`), `runSnap`/`cycle`/`dismiss` (`:427`/`:473`/`:499`) inline JSX; keep the *state* (`penRegister` `:311`, `shadeTool` `:312`, the snap-chip state `:384` reshaped to `ShapeOverride`, plus new `armedShape`); render `<DrawToolbar … />`; wire `onSnapApi` (already `:377-381`).
- **DeskDoodlesCanvas.tsx:** same deletion (`:89`/`:252`/`:297`/`:323`); render `<DrawToolbar variant="canvas" … />`. This *adds* the full tool gambit to /canvas (RUNNING-TODO:27).
- **ObjectSurface.tsx (RE-DRAW):** add `const [reSnapApi] = useRef…`; pass `onSnapApi={…}` to the existing `<DrawSurface>` (`:1040`); render `<DrawToolbar variant="redraw" shadeEnabled={…} … />` in the re-draw stage (`:1004-1056`). RE-DRAW now has auto-detect + override + insert (RUNNING-TODO:16 fixed for free).

---

## 3. Auto-detect-on-pen-up — the wiring

### 3.1 Where it fires
Auto-detect is a **host-side policy**, not an engine change. The engine (`fitStroke`) stays pure. The trigger is a new callback from `DrawSurface` to the host, fired exactly when a *genuine new ink stroke commits* (the existing `handlePointerUp` path `:1684`, the `setStrokes((prev) => [...prev, current])` branch).

Add to `DrawSurface`'s props (next to `onStrokesChange` `:964`):

```ts
/** AUTO-DETECT (UX rework): fired ON PEN-UP for each genuinely committed ink
 *  stroke (NOT taps, NOT shade/fill/lasso, NOT inserts, NOT Style mode). The
 *  host runs fitStroke, and if accepted, applies the best candidate + raises
 *  the override receipt. Per SEBS'S LAW the host MUST make the override visible;
 *  auto-applying without a dispose path is forbidden. /canvas + /desk + RE-DRAW
 *  all wire this; passing nothing keeps the old draw-only behavior. */
onStrokeCommitted?: (stroke: { id: string; points: StrokePoint[] }) => void;
```

Fire it in `handlePointerUp` at the new-stroke branch (`DrawSurface.tsx:1680-1686`), AFTER `setStrokes`:

```ts
    if (!current || current.points.length < 2) { setCurrent(null); return; }
    setSelectedStrokeId(null);
    const committed = current;            // capture before clearing
    setStrokes((prev) => [...prev, committed]);
    setCurrent(null);
    inkDownPtRef.current = null;
    onStrokeCommitted?.({ id: committed.id, points: committed.points }); // ← NEW
```

**It must NOT fire for:** inserts (the armed-shape pen-up path, §6 — those are already clean geometry), taps (the select branch `:1672`), shade/fill/lasso (their own pen-up branches return earlier), or when `styled` (Style mode — `handlePointerDown` already bails `:1520`).

### 3.2 The host's auto-detect handler (in DrawToolbar's host — same in all three)

```ts
const handleStrokeCommitted = useCallback((stroke: { id: string; points: StrokePoint[] }) => {
  const api = snapApiRef.current;
  if (!api) return;
  // PURE fit, no mutation (fitLast targets this just-committed = last stroke).
  const fit = api.fitLast('snap');               // 'snap' = full template set
  if (!fit) return;
  const { strokeId, result } = fit;
  const originalPoints = stroke.points.slice();   // remember for Original
  const switchSet = buildSwitchSet(result, stroke.points); // §4.2

  if (result.accepted) {
    // PROPOSE: apply the best candidate (index 0). Stays a stroke, same id.
    const best = result.candidates[0];
    api.applyToStroke(strokeId, best, originalPoints);
    setOverride({
      strokeId, appliedKind: best.kind, switchSet,
      appliedIndex: switchSet.findIndex(e => e.kind === best.kind && e.source === 'recognized'),
      originalPoints,
    });
    logSnap('auto', 'evaluate', strokeId, result, best.kind, /*margin*/ marginOf(result));
  } else {
    // REFUSED: never force a fit. Leave the freehand stroke AS-DRAWN, but STILL
    // raise the override receipt so the user can switch it to any library shape
    // or run Straighten — the dispose path exists even when auto-detect declines.
    setOverride({
      strokeId, appliedKind: 'original', switchSet,
      appliedIndex: switchSet.findIndex(e => e.source === 'original'),
      originalPoints,
    });
    // Optional honest note (5s), reusing the existing caption slot:
    setNote(result.refusedReason === 'scribble-energy'
      ? null  // a scribble is tone intent — don't nag; just leave it freehand
      : 'kept your stroke — switch it to any shape if you like');
  }
}, [/* snapApiRef, logSnap */]);
```

**Key honesty point:** on refusal we DON'T snap (law preserved), but we DO surface the override so the dispose path is symmetric. A scribble (`scribble-energy`) raises no note (it's clearly tone intent, nagging would be wrong — cite the existing scribble gate `shapeFit.ts:1417`).

**Debounce / rapid-draw:** the receipt always re-targets the *latest* committed stroke (a new stroke supersedes the prior receipt — matches the existing `setSelectedStrokeId(null)` on new stroke `:1683`). If the user draws three strokes fast, the receipt tracks the third; the first two are already auto-snapped and standing (each was applied at its own pen-up). This is correct: every stroke gets its proposal; only the most recent is still "hot" for override. Tap-to-select (`:1672`) lets the user re-target an earlier stroke's override later (§4.3).

---

## 4. The override — fewer clicks than the old chip-cycle

### 4.1 The old cost vs the new cost
- **Old:** draw → *find* the Snap pill → tap Snap (1) → realize wrong → tap the chip to cycle (1) → cycle again (1) … → N taps, and the chip only offered what the recognizer fit (no library shapes, no "I wanted a heart").
- **New:** draw → it's already snapped (0 taps). Wrong? The receipt is *right there*: tap the label to cycle the best 2-3 recognized alternatives (1 tap each, the cheap path), OR tap "✎ all" to open the SwitchPopover and pick *any* of the 12 library shapes + Original in 1 tap. **Worst case to reach an arbitrary shape: 2 taps** (open popover + pick). Old worst case to reach a library shape: *impossible*.

### 4.2 `buildSwitchSet` — the override's data (host helper, pure)
This is the merge the prior plan called for ("the override switcher data = fitStroke candidates ∪ shapeLibrary"). Put it in the host (or a tiny `lib/draw/switchSet.ts` if you want it node-testable — recommended, it's pure):

```ts
import { SHAPE_LIBRARY, generateShape } from '../../lib/draw/shapeLibrary';
import type { ShapeFitResult, ShapeCandidate } from '../../lib/draw/shapeFit';

export function buildSwitchSet(
  result: ShapeFitResult,
  strokePoints: [number, number, number][],
): SwitchEntry[] {
  const out: SwitchEntry[] = [];
  // 1. RECOGNIZED alternatives, ranked, EXCLUDING 'original' (added last).
  for (const c of result.candidates) {
    if (c.kind === 'original') continue;
    out.push({ source: 'recognized', kind: c.kind, label: c.label, candidate: c });
  }
  // 2. LIBRARY shapes (the 12), EXCLUDING kinds already covered by a recognized
  //    candidate (no "Star" twice). Library entries carry candidate: null — the
  //    host generates the outline from the stroke's bbox at apply time (§4.5).
  const recognizedKinds = new Set(out.map(e => e.kind));
  for (const e of SHAPE_LIBRARY) {
    if (recognizedKinds.has(e.kind)) continue;
    out.push({ source: 'library', kind: e.kind, label: e.label, candidate: null });
  }
  // 3. ORIGINAL always last (Sebs's first-class "back to my stroke").
  out.push({ source: 'original', kind: 'original', label: 'Original', candidate: null });
  return out;
}
```

**Note on union semantics:** recognized candidates win their slot (they carry the *fitted* geometry, which honors the user's drawn proportions); library shapes fill the rest (canonical templates). `'original'` is the user's literal stroke. This satisfies "switch the auto-detected result to ANY primitive (recognized OR from the 12-shape library)."

### 4.3 Targeting (which stroke the override edits)
`api.applyToStroke(strokeId, …)` already takes an explicit `strokeId`. The receipt stores `override.strokeId` (the just-committed stroke). To override an *earlier* stroke: the existing tap-to-select (`DrawSurface:1672`) sets `selectedStrokeId`; the host should, on selection change, rebuild the override receipt for the newly selected stroke by calling `api.fitLast('snap')` against it (the API already uses `targetStroke()` `:1312` which prefers the selection). **Add** an `onSelectionChange?(id: string | null)` prop to `DrawSurface` (fire it in the tap-select branch `:1675`) so the host knows to refit. This is the same plumbing the prior plan's Feature 1 wanted, scoped to single-select (multi-select is out per the restraint line, §7).

### 4.4 The receipt is PERSISTENT, not a fade (load-bearing for the law)
Because auto-detect now fires *without a button press*, the dispose affordance can't be a 5-second fade-out chip (the current `SnapChip` fades — DrawPanel `:87` "chip quietly fades out"). If it fades, an auto-snap the user didn't notice becomes un-undoable except by re-draw → that *is* "forced." So:
- The `<OverrideReceipt>` stays visible until one of: a new stroke commits (it re-targets), the register/input/mode switches, Done/Save, or the user explicitly dismisses it. **No timer.** Dismissal logs `'keep'` (existing grammar).
- `Original` in the SwitchPopover is always reachable while the receipt lives — the cheap full undo of an unwanted auto-snap.

[This is the Procreate "Edit Shape" lesson: the receipt + edit affordance is *part of the gesture*, persistent until you tap away — not a transient toast. §8.]

### 4.5 Applying a library-shape override (the bbox map)
When the user picks a `library` entry, the host generates the outline scaled to the **drawn stroke's bbox** (so switching a drawn circle → heart keeps the heart where the circle was, at the same size), then writes it back as a stroke via the *same* apply path:

```ts
function applyLibrary(api: ShapeSnapApi, strokeId: string, kind: string,
                      strokePoints: [number, number, number][]) {
  const bbox = bboxOf(strokePoints);                 // {x,y,w,h} of the drawn stroke
  const outline = generateShape(kind, bbox);          // shapeLibrary.ts:428
  if (!outline) return;
  // Wrap as a synthetic 'closed library' candidate so applyCandidate densifies +
  // welds it exactly like a recognized closed shape (§4.6). curved shapes are
  // already dense; cornered get densifyVertexChain. Reuse applyCandidate's path.
  const cand: ShapeCandidate = {
    kind: 'polygon',          // routing kind for applyCandidate's densify/weld
    points: outline,
    normErr: 0, score: 1, closed: true,
    label: SHAPE_LIBRARY.find(e => e.kind === kind)?.label ?? kind,
    notes: `library:${kind}`,
  };
  api.applyToStroke(strokeId, cand, strokePoints);
}
```

### 4.6 One small engine touch (curve fidelity for library inserts)
`applyCandidate` (`shapeFit.ts:1617`) treats only `kind === 'circle' || 'ellipse'` as "already-dense, emit verbatim" (`:1628`); everything else gets `densifyVertexChain`. The library's **curved** shapes (heart, cloud, speech-bubble, crescent, teardrop) are already dense (48-64 pts) and should NOT be re-densified (it would re-sample a fine curve and is harmless, but cleaner to skip). **Recommended minimal change:** thread the library entry's `curved` flag through as a candidate `notes: 'library:<kind>'` and in `applyCandidate` treat `notes?.startsWith('library:')` + curved-kind as "emit verbatim" like circle/ellipse. *This is the only engine edit the whole rework needs* — and it's optional (densifying a dense curve still renders correctly). Flag it; don't gold-plate.

---

## 5. The Shapes quick-pick row (insert side)

The same `<ShapeStrip>` that hosts the inline most-common shapes is the **insert** surface. Picking a shape **arms** it (`onArmShape(kind)`); `Freehand` (armed=null) is the default and is always shown selected when nothing's armed.

- **Inline (always visible):** `Freehand`, then 6 highest-frequency: **rectangle, circle, triangle, diamond, star, heart**. (Rect/circle/triangle are the recognizer's core; diamond/star/heart are the most-wanted library adds per Sebs's own list.)
- **`More ▾` overflow popover:** the remaining library — pentagon, hexagon, octagon, cloud, speech-bubble, lightning, crescent, teardrop, block-arrow — plus line/arrow if you want the open primitives insertable. [2-3 inline + overflow is the toolbar-UX rule; we run 7 inline incl. Freehand, which is at the generous end but still scannable for a creative tool — §8, flag if it feels crowded at the panel's narrow width.]

Arming a shape clears any active shade tool (mutually exclusive registers); arming `null` (Freehand) returns to the default ink gesture.

---

## 6. The insert + resize gesture (pointer handling in DrawSurface)

### 6.1 New prop + state
Add to `DrawSurface` props (next to the shade block `:1000`):

```ts
/** SHAPE INSERT (UX rework): when set to a shapeLibrary kind, a pointer DRAG on
 *  the canvas defines the shape's bbox and pen-up drops it as a stroke (via
 *  shapeLibrary.generate + the applyCandidate path). null = freehand (default).
 *  Mutually exclusive with the shade register. /canvas + /desk + RE-DRAW wire it. */
armedShape?: string | null;
/** Fired after an insert commits, so the host can raise the override receipt on
 *  the new shape (you inserted a star, want a pentagon — same switcher). */
onShapeInserted?: (stroke: { id: string; points: StrokePoint[] }) => void;
```

Internal (next to `current` `:1046`):
```ts
const [insertBox, setInsertBox] = useState<{ start: [number, number]; cur: [number, number] } | null>(null);
const insertShiftRef = useRef(false);   // aspect-lock (Shift) live during drag
```

### 6.2 The gesture (gate it FIRST in the pointer handlers)
The insert gate goes at the **top** of `handlePointerDown` (`:1518`), before fill/lasso/shade/ink — an armed shape owns the pointer:

```ts
function handlePointerDown(e: React.PointerEvent) {
  if (styled) return;
  if (input !== 'draw' || mode === '3d') return;
  (e.currentTarget as SVGElement).setPointerCapture(e.pointerId);
  if (armedShape) {                                   // ← NEW, FIRST
    const [x, y] = eventToSvgPoint(e);
    insertShiftRef.current = e.shiftKey;
    setInsertBox({ start: [x, y], cur: [x, y] });
    return;
  }
  if (fillActive) { /* …existing… */ }
  // …
}
```

`handlePointerMove` (`:1569`), also first:
```ts
  if (insertBox) {
    const [x, y] = eventToSvgPoint(e);
    insertShiftRef.current = e.shiftKey;             // live aspect-lock toggle
    setInsertBox(b => b ? { ...b, cur: [x, y] } : b);
    return;
  }
```

`handlePointerUp` (`:1639`), also first:
```ts
  if (insertBox) {
    const box = normalizeBox(insertBox.start, insertBox.cur, insertShiftRef.current); // §6.3
    setInsertBox(null);
    if (box.w < INSERT_MIN_PX || box.h < INSERT_MIN_PX) {
      // Tiny drag / click-without-drag → CLICK-TO-PLACE at a default size,
      // centered on the down point (Figma's two placement modes — §8).
      const d = INSERT_DEFAULT_PX;
      box.x = insertBox.start[0] - d / 2; box.y = insertBox.start[1] - d / 2;
      box.w = d; box.h = d;
    }
    const outline = generateShape(armedShape!, box);  // shapeLibrary.ts:428
    if (outline) {
      const id = `ins-${Date.now()}`;
      const pts = libraryOutlineToStroke(outline, /*pressure*/ 0.5); // dense + welded
      setStrokes(prev => [...prev, { id, points: pts }]);
      onShapeInserted?.({ id, points: pts });
    }
    return;
  }
```

A live **preview** of the shape (or its bbox) renders during the drag — generate `generateShape(armedShape, normalizeBox(...))` each move into a translucent overlay path (cheap; the same overlay layer the fill hover-preview uses). Show the bbox rectangle + the shape outline so the user sees what they're placing.

### 6.3 Resize semantics (the box math — research-backed)
`normalizeBox(start, cur, shift)`:
- Default: `x=min(start.x,cur.x)`, `y=min(...)`, `w=|dx|`, `h=|dy|` — drag any direction, bbox grows from the down corner. (Excalidraw: resize on X/Y from any point of the bounding box. §8.)
- **Shift held → aspect-lock 1:1:** set `w=h=max(|dx|,|dy|)`, keeping the down corner fixed. (Figma + Excalidraw: Shift locks aspect / makes a perfect square-circle-polygon. §8.)
- *(Alt/center-out is the documented third modifier (Figma/Excalidraw) but is OPTIONAL polish — Shift is the one to ship; add Alt only if cheap.)*

Constants (define next to `TAP_SLOP_PX` `:1458`):
```ts
const INSERT_MIN_PX = 8;        // below this a drag is a "click" → default-size place
const INSERT_DEFAULT_PX = 120;  // click-to-place default (Figma uses 100×100)
```

### 6.4 Resizing an ALREADY-placed shape (the reshape half)
The locked direction says "resize/reshape for inserted shapes." Two honest tiers — **ship Tier A, the cheap one:**
- **Tier A (ship): re-arm + re-drag is the resize.** An inserted shape is a stroke; selecting it (tap) + picking the same shape in the override SwitchPopover regenerates it at the drawn-stroke bbox. To *resize*, the simplest in-scope path: the override receipt for a selected inserted shape shows a small **bbox with corner handles** when that shape was library-inserted (we can detect via a stroke-id prefix `ins-` or a per-stroke `meta`). Dragging a corner handle re-runs `generateShape` at the new bbox. **This is the minimum that satisfies "resize."**
- **Tier B (defer, name it): full transform handles on any stroke** (rotate/skew/multi-select) — explicitly OUT (§7).

**Recommended scope for the deadline:** Tier A corner-resize handles **only on the just-inserted / selected library shape**, drawn as 4 small squares at the stroke's bbox corners; corner-drag re-generates. ~Half a day. If even that is tight, the *fallback* "resize" is: the insert drag itself sizes it, and to change size you delete + re-insert — but **flag this to Sebs** as the reduced version, don't silently ship it (the law: name the cut).

### 6.5 Helper: `libraryOutlineToStroke`
```ts
// Reuse shapeFit's densify+weld so an inserted shape renders sealed like a snap.
function libraryOutlineToStroke(outline: Pt[], pressure: number): StrokePoint[] {
  // Route through applyCandidate by wrapping as a closed polygon candidate
  // (curved shapes are already dense; cornered get densified). Identical to §4.5.
  const cand: ShapeCandidate = { kind: 'polygon', points: outline, normErr: 0,
    score: 1, closed: true, label: 'insert' };
  return applyShapeCandidate(cand, outline.map(([x, y]) => [x, y, pressure])) as StrokePoint[];
}
```

---

## 7. The restraint line — what we deliberately EXCLUDE (and why, cited)

Per the lead's call (Sebs agreed) and toolbar-UX best practice, the v1 rework **stops** before:

| Excluded | Why (research-backed) |
|---|---|
| **Rotation / skew of placed shapes** | Each is a new gesture grammar + handle set + hit-testing + undo interaction. PatternFly/UX guidance: surface the few high-value actions, defer the rest — every added transform multiplies edge-case load against a 5-day deadline. [PatternFly toolbar; overflow guidance — §8.] |
| **Multi-select transform** | The prior plan's 1C ("real Select tool") is the Excalidraw model wholesale — marquee, multi-handle, group transform. Over-scope; the single-stroke override + tap-select covers the actual need (crisp/switch one shape). Forward-compatible: storing selection as one id now means a future Set is incremental, not a rewrite. |
| **Layers / z-order UI** | No user need surfaced; strokes already paint in commit order. Adding it is pure cognitive load (UXPin/Eleken: don't treat everything as equally important). |
| **Per-vertex point editing** | Already deferred in `shape-assist-spec.md` SA-F (1.5-2 days; chip+Straighten+Re-draw covers ~80%). Unchanged here. |
| **Composite multi-stroke snap** (two arcs → one circle) | `shape-assist-spec.md` SA-E defer; per-stroke v1. Log refusals as demand data. |

**The boundary principle to write into the toolbar header:** "Surface the common creation+switch actions inline; overflow the long tail; *exclude* spatial transforms (rotate/skew/multi-select/layers) — they are a different editor tier and a deadline-and-clarity cost, not a creation need." [Mobbin/PatternFly/UXPin — §8.]

---

## 8. Research — how the best tools do each piece (cited)

### 8.1 Auto-detect WITH override (propose → dispose)
- **Procreate QuickShape** is the canonical "snap then let me change it": after the snap, an **Edit Shape** affordance appears (tap the notification at the top), opening a menu to *switch your shape type* ("change a circle to a square") with transformation nodes for adjustment. The receipt + edit handle is part of the gesture, persistent until you tap away — **not a transient toast.** That is the model for our persistent `<OverrideReceipt>` (§4.4). *(Note: the public help page gives one example conversion (circle→square) and does NOT enumerate the full switch list — so our "switch to ANY of 12 + recognized" is a superset of Procreate's documented behavior, which is fine, but means we can't cite Procreate for the exact shape list.)* — https://help.procreate.com/articles/zymjvk-quickshape and https://help.procreate.com/procreate/handbook/guides/quickshape
- **tldraw** lets you change a geo shape's *type* after creation via the **style panel's GeoShapeGeoStyle dropdown** (rectangle → ellipse → triangle …) — i.e. switching the primitive is a first-class post-creation edit, exactly our override; programmatically `editor.updateShape({ type:'geo', props:{ geo:'ellipse' }})`. No documented single keypress to swap type (it's the dropdown), which validates the chip/popover approach over a hidden hotkey. — https://tldraw.dev/sdk-features/styles and https://tldraw.dev/sdk-features/geo-shape
- **Concepts** ships *Shape Guides* (sketch a perfect shape, adjust handles) AND an after-the-fact **smoothing slider** that straightens wavy lines "in orders of magnitude" — small waves first, up to fully straight. This is the same propose-then-adjust philosophy and supports our "Straighten as one of the override entries / a degree of cleanup," and the idea that the *amount* of correction is the user's to dispose. — https://concepts.app/en/ios/manual/precisiontools
- **Lesson where sources AGREE:** the target/result of an auto-action must be *visible and user-disposable* (Procreate's persistent Edit Shape bar, tldraw's always-present style panel). **Where they differ:** Procreate auto-snaps on a *hold* gesture (we have no hold grammar → we auto-snap on pen-up, which is *more* aggressive, which is exactly why §4.4's persistent receipt is non-negotiable for us); tldraw does NOT auto-detect freehand at all (you pick the geo tool first). So our "auto-detect on freehand pen-up" is closest to Procreate, and we adopt Procreate's persistent-receipt safeguard to keep it from feeling forced.

### 8.2 Drag-to-place + resize handles (incl. trackpad)
- **Figma** has two placement modes: **click = default 100×100**, **click-drag = custom size**; **Shift = perfect square/circle/polygon**, **Alt/Option = resize from center.** This directly specs our §6.2 click-to-place fallback + §6.3 Shift aspect-lock. — https://help.figma.com/hc/en-us/articles/360040450133-Shape-tools
- **Excalidraw** resize: **corner handles** resize with aspect control, **edge handles** one-dimension; **Shift while resizing keeps aspect ratio** (and Shift while *creating* locks 1:1 → square/circle/diamond); **Alt = symmetric both-sides resize**; you can resize on X/Y from any point of the bbox. This specs §6.3/§6.4 handle behavior and confirms Shift-aspect is the universal convention. Works with mouse/trackpad (Excalidraw is a web/trackpad-first tool — no pencil assumed), which answers the "on a TRACKPAD not just pencil" requirement: the bbox-drag + Shift model is *designed* for pointer/trackpad, unlike Procreate's pencil-hold. — https://help.figma.com/hc/en-us/articles/360040450133-Shape-tools , https://github.com/excalidraw/excalidraw/pull/2439 , https://x.com/excalidraw/status/1785683224682779099
- **Where sources AGREE:** Shift = aspect-lock is universal (Figma, Excalidraw, tldraw). Corner-from-any-point bbox drag is the trackpad-native creation gesture. **No disagreement found.** Min-size: none of the three document a hard floor; we choose `INSERT_MIN_PX=8` (below = treat as click-to-place, Figma's behavior) as a sensible local default — flag for eyeball-tuning.

### 8.3 Quick-pick toolbar + overflow for 12+ shapes
- **Excalidraw / tldraw**: a single persistent tool toolbar (quick-pick row), one-key shortcuts, pick-tool-then-draw is the dominant web-canvas pattern and the closest peer to Desk Doodles. Our `<ShapeStrip>` follows it. — https://csswolf.com/the-ultimate-excalidraw-tutorial-for-beginners/ , https://tldraw.dev/docs/user-interface
- **Toolbar overflow best practice (PatternFly / UXPin / UX Movement):** surface only the few high-frequency actions; put the long tail in an **overflow menu**; PatternFly explicitly warns against >3 fully-displayed actions and recommends overflow to avoid crowding + cognitive load. We run **Freehand + 6 inline shapes, rest in `More ▾`** — at the generous end of the guidance (justified for a *creative* tool where shape variety is the point, vs a productivity toolbar), but the overflow keeps it honest. **Flag:** at the /desk popup's narrow width, 7 inline pills may wrap — measure; if it wraps badly, drop to 4 inline (rect/circle/triangle/star) + overflow. — https://www.patternfly.org/components/toolbar/design-guidelines/ , https://www.patternfly.org/components/overflow-menu/design-guidelines/ , https://www.uxpin.com/studio/blog/8-user-control-ui-patterns-worth-using/
- **Radial/marking menus (Sketchbook lagoon)** are explicitly NOT chosen: research + trackpad reality + deadline argue against (poor discoverability, fiddly on trackpad). Post-makeathon power-user add at most. — (prior plan §3B, consistent with toolbar-UX sources above)

### 8.4 The "don't overcomplicate" boundary (what to exclude)
- **PatternFly toolbar / overflow guidelines** + **UXPin user-control patterns** + **Eleken navigation best practices**: the consistent message is *be selective; hide secondary actions; long unstructured menus increase cognitive load.* This is the cited basis for excluding rotation/skew/multi-select/layers from v1 (§7) — they're secondary-tier editor actions, not creation primitives, and surfacing them now trades clarity for capability we don't need this week. — https://www.patternfly.org/components/toolbar/design-guidelines/ , https://www.uxpin.com/studio/blog/8-user-control-ui-patterns-worth-using/ , https://www.eleken.co/blog-posts/ux-navigation-design

---

## 9. Files to touch — exact anchors

| File | Change | Anchor |
|---|---|---|
| **NEW** `src/app/components/DeskDoodles/DrawToolbar.tsx` | The shared toolbar (§2) — register pills + ToneShadeCluster + ShapeStrip + OverrideReceipt + SwitchPopover + caption. | — |
| **NEW (recommended)** `src/app/lib/draw/switchSet.ts` | `buildSwitchSet` (§4.2), pure + node-testable. | — |
| `src/app/lib/draw/shapeFit.ts` | (a) **Header:** add SEBS'S LAW (never-force-a-fit) block next to the existing "freehand is the DEFAULT" note, updating it to "auto-PROPOSE on pen-up; the override disposes" (§0). (b) **Optional:** `applyCandidate` curve-verbatim for `notes:'library:<curvedKind>'` (§4.6). | header `:1-39`; `applyCandidate` `:1617`, curve branch `:1628` |
| `src/app/components/DeskDoodles/DrawSurface.tsx` | Add props `onStrokeCommitted` (§3.1), `armedShape`+`onShapeInserted` (§6.1), `onSelectionChange` (§4.3). Add `insertBox` state (§6.1). Insert gesture gates at top of `handlePointerDown`/`Move`/`Up` (§6.2). Fire `onStrokeCommitted` in the new-stroke branch; `onSelectionChange` in the tap-select branch. Live insert preview overlay (reuse the hover-preview layer). `INSERT_MIN_PX`/`INSERT_DEFAULT_PX` consts. | props `:958-1037`; state `:1046`; `handlePointerDown` `:1518`; `Move` `:1569`; `Up` new-stroke `:1680-1686`, tap-select `:1672-1679`; consts near `:1458`; overlay near the fill-hover render |
| `src/app/components/DeskDoodles/DrawPanel.tsx` | Delete inline `SnapChip`/`runSnap`/`cycle`/`dismiss`; reshape snap-chip state → `ShapeOverride`; add `armedShape` state; add `handleStrokeCommitted` (§3.2) + `applyLibrary` (§4.5); render `<DrawToolbar variant="panel" …>`; wire `onStrokeCommitted`/`armedShape`/`onShapeInserted`/`onSelectionChange` to `<DrawSurface>`. Keep `onSnapApi` wiring. | `SnapChip` `:160`; `runSnap` `:427`; `cycle` `:473`; `dismiss` `:499`; state `:384`; api `:377` |
| `src/app/components/DeskDoodles/DeskDoodlesCanvas.tsx` | Same deletion + `<DrawToolbar variant="canvas" …>` (adds full gambit to /canvas). | `SnapChip` `:89`; `runSnap` `:252`; `cycle` `:297`; `dismiss` `:323`; api `:195` |
| `src/app/components/DeskDoodles/ObjectSurface.tsx` | RE-DRAW stage: add a `snapApiRef` + `onSnapApi`, `armedShape` state, `handleStrokeCommitted`, render `<DrawToolbar variant="redraw" shadeEnabled={…}>`; pass the new props to the existing `<DrawSurface>`. (Fixes RUNNING-TODO:16.) | re-draw stage `:1004-1056`, `<DrawSurface>` `:1040` |
| `src/app/lib/shapeSnapLog.ts` | New outcome value `'auto'` (auto-detect on pen-up) alongside the existing snap outcomes; one entry per auto-detect + per override switch (the dataset already keys on strokeId — feeds the smart/ML dataset per `feedback_keep_feeding_smart_ml`). | `ShapeSnapOutcome` |

---

## 10. How RE-DRAW reuses the toolbar

RE-DRAW today (`ObjectSurface.tsx:1004-1056`) is a `<DrawSurface initialStrokes=… styled=…>` with only a Draw|Style toggle. After this rework it becomes a **third host of `DrawToolbar`**, identical wiring to DrawPanel:
1. `initialStrokes` loads the recorded gesture (unchanged; CASE-2 fit bug is a *separate* lane — don't touch it here).
2. The RE-DRAW host installs `onSnapApi` (currently absent) → auto-detect + override + insert all work on the re-opened doodle.
3. `shadeEnabled` can be `false` for RE-DRAW v1 if tone-editing on re-draw is out of scope (it currently doesn't forward `shade`), keeping the toolbar's shape half live without pulling in the tone register.
4. Because the toolbar is one component, RE-DRAW can never drift from /desk again — the duplication bug class is closed.

---

## 11. Phase / build order (dependency-aware)

1. **Phase 0 — extract `DrawToolbar.tsx`** (the structural fix). Move the register pills + ToneShadeCluster + the *existing* snap chip (reshaped to OverrideReceipt) out of DrawPanel + Canvas into the shared component; wire all three hosts (incl. RE-DRAW). **No behavior change yet** beyond RE-DRAW gaining the snap pills. This is the prerequisite — do it first, verify parity on /desk + /canvas + RE-DRAW.
2. **Phase 1 — auto-detect on pen-up + persistent override receipt.** Add `onStrokeCommitted` to DrawSurface; `handleStrokeCommitted` + `buildSwitchSet` in the hosts; the persistent `<OverrideReceipt>` + `<SwitchPopover>` (recognized ∪ library ∪ Original). This delivers parts 1+2 of the locked direction (auto-detect + free override). **Verify the law:** auto-snap is always one tap from Original and ≤2 taps from any library shape.
3. **Phase 2 — the Shapes quick-pick + insert/resize gesture.** `<ShapeStrip>` + `armedShape` + the insert pointer gesture (drag-to-place, Shift aspect-lock, click-to-place fallback) + Tier-A corner-resize on the placed shape. Delivers parts 3+4.
4. **Phase 3 — overflow + polish + the smart-log feed.** `More ▾` overflow popover; `'auto'` log outcome; eyeball-tune `INSERT_MIN_PX`/`INSERT_DEFAULT_PX`/inline-count-at-narrow-width.

Each phase is independently shippable and verifiable. Phase 0 de-risks everything (one implementation, three hosts).

---

## 12. Verification hooks (per the regression law)
Before declaring any phase done (`feedback_never_declare_fixed_without_regression_check`): baseline + after screenshots of the 6 shape classes through the LIVE draw tools on /canvas AND /desk AND RE-DRAW; one-factor-at-a-time toggle check; and the adversarial break battery (`SESSION-HANDOFF.md` LOOP mindset): auto-detect on tiny/huge/canvas-spanning/elongated/scribble/almost-closed strokes; override-then-Original round-trip; insert→resize→switch→Original; draw→undo→redraw; flip Sketch↔Style mid-receipt; rapid multi-stroke (each gets its own proposal, receipt tracks the latest). Every auto-detect + override outcome feeds `shapeSnapLog` → the smart/ML dataset.

---

## 13. Risks the research flags in the LOCKED direction (for the lead — not silently changed)

1. **Auto-detect on pen-up is MORE aggressive than every cited tool.** Procreate auto-snaps only on a deliberate *hold*; tldraw/Excalidraw never auto-detect freehand (you pick the tool first). Firing on *every* pen-up means a user sketching loosely will see their strokes constantly cleaning themselves — potentially jarring for someone who wanted the rough hand. **Mitigation in this spec:** the persistent override receipt + always-reachable Original + no-snap-on-refusal. **Flag for Sebs:** consider whether auto-detect should respect a confidence margin higher than the bare `accepted` gate (e.g. only auto-apply when `best.normErr` is comfortably below `SNAP_MAX_NORM_ERR`, else just *offer* via the receipt without mutating) — that would make it feel like a suggestion, not a seizure. This is a one-line threshold the spec leaves as a Sebs decision (an "auto-apply vs auto-offer" confidence band).

2. **Persistent receipt vs the loop's mid-gesture flips.** The handoff's adversarial cases include "flip Sketch↔Style mid-gesture" and "draw→undo→redraw." A persistent (no-timer) receipt must be cleanly torn down on every mode/input/register flip and on undo, or it strands a stale override pointing at a gone stroke. Specced (§4.4 dismissal triggers) but it's the highest edge-case-density part — call it out for thorough break-testing.

3. **"Reshape" scope ambiguity.** The locked direction says "resize/reshape for inserted shapes" but stops before transform. Tier-A corner-resize (§6.4) is the honest minimum; full reshape (drag a heart's lobe) is vertex-editing = SA-F deferred territory. **Flag:** confirm Tier-A corner-resize is the intended "resize/reshape," not per-vertex reshape — if Sebs means the latter, that's a separate ~1-day build and crosses toward the excluded line.

4. **7 inline shapes at the /desk popup width** may wrap or crowd against the toolbar-UX guidance (≤3 fully-displayed is the strict rule; we run 7 for a creative tool). Measured-not-estimated per `feedback_no_static_pixels_when_viewport_relative`; fallback is 4 inline + overflow. Not a direction change — a layout flag.

5. **Library-shape override keeps the drawn bbox, not aspect.** Switching a wide-drawn ellipse → heart stretches the heart to the ellipse's bbox (could look squashed). Cited tools regenerate at the bbox too (tldraw geo-type swap), so this is conventional — but flag that some library shapes (heart, star) read better at their natural aspect; an optional "fit centered at natural aspect" toggle is a post-v1 nicety.

---

## 14. Sources
- Procreate — QuickShape (snap families, Edit Shape menu / switch shape type, persistent receipt): https://help.procreate.com/articles/zymjvk-quickshape · https://help.procreate.com/procreate/handbook/guides/quickshape
- tldraw — Styles (GeoShapeGeoStyle dropdown = switch shape type) + Geo shape: https://tldraw.dev/sdk-features/styles · https://tldraw.dev/sdk-features/geo-shape · UI: https://tldraw.dev/docs/user-interface
- Concepts — Precision Tools (Shape Guides + smoothing/straighten slider): https://concepts.app/en/ios/manual/precisiontools
- Figma — Shape tools (click=default size, drag=custom, Shift=1:1, Alt=center): https://help.figma.com/hc/en-us/articles/360040450133-Shape-tools
- Excalidraw — Shift aspect-lock + center/symmetric resize + corner-from-any-point: https://github.com/excalidraw/excalidraw/pull/2439 · https://x.com/excalidraw/status/1785683224682779099 · https://x.com/excalidraw/status/1335724774509699072 · tutorial: https://csswolf.com/the-ultimate-excalidraw-tutorial-for-beginners/
- PatternFly — Toolbar + Overflow menu design guidelines (≤3 inline, overflow the tail): https://www.patternfly.org/components/toolbar/design-guidelines/ · https://www.patternfly.org/components/overflow-menu/design-guidelines/
- UXPin — User-control UI patterns (selective surfacing, hide secondary): https://www.uxpin.com/studio/blog/8-user-control-ui-patterns-worth-using/
- Eleken — UX navigation patterns (cognitive load of unstructured menus): https://www.eleken.co/blog-posts/ux-navigation-design
- W3C SVG Basic Shapes (star/regular-polygon are standard parametric forms): https://www.w3.org/TR/SVG/shapes.html

**Internal (verified, real):** `src/app/lib/draw/shapeFit.ts` (engine, `fitStroke` :1367, `applyCandidate` :1617, `ShapeKind` :199, `SNAP_MAX_NORM_ERR` :64) · `src/app/lib/draw/shapeLibrary.ts` (`SHAPE_LIBRARY` :345, `generateShape` :428) · `src/app/components/DeskDoodles/DrawSurface.tsx` (`ShapeSnapApi` :49, `eventToSvgPoint` :1379, pointer handlers :1518/:1569/:1639, tap-select :1672, `ToneShadeCluster` :2367) · `DrawPanel.tsx` (SnapChip/runSnap/cycle/dismiss :160/:427/:473/:499) · `DeskDoodlesCanvas.tsx` (mirror :89/:252/:297/:323) · `ObjectSurface.tsx` (RE-DRAW stage :1004-1056) · `docs/design/shape-assist-spec.md` (SA-A..SA-H) · `FEATURES-DRAW-TOOLS-PLAN.md` (the superseded options doc).
