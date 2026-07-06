# Feature Wiring Checklist (Phases 1-3) — anchor-verified vs HEAD 6d6f882

Ready-to-execute (from the wiring-checklist research agent). Full detail in session transcript; this is the actionable core.

## Pre-flight facts (spec was stale; these hold at HEAD)
- **DrawToolbar = OLD snap-pill grammar** (`DrawToolbar.tsx:79-126`: register/showSnap/snapChip/...). Phases 1-2 must ADD
  the new props (armedShape/override/onSwitchTo/...), NOT replace. Keep Snap/Straighten pills alongside.
- **RE-DRAW (ObjectSurface) is ALREADY a fully-wired 3rd host** (`ObjectSurface.tsx:1178-1258`, `redraw*` state). RUNNING-TODO:16 closed in Phase 0. All 3 hosts wire the SAME new props identically.
- **GAPS (load-bearing):** (1) rect/circle/triangle/ellipse have NO `shapeLibrary` entry → `generateShape` returns null →
  insert path breaks. FIX in Phase 2.0 (add generators to SHAPE_LIBRARY). (2) `ShapeSnapOutcome` lacks `'auto'`
  (shapeSnapLog.ts:22) — add in 3.1 (do FIRST, one-line, since Phase 1 logs 'auto'). (3) `handlePointerUp()` has NO event
  arg (`:1826`) — insert pen-up uses captured `insertBox` coords. (4) engine export is `applyCandidate`; DrawSurface alias `applyShapeCandidate` (`:36`).
- Scaffolds EXIST + type-clean: `switchSet.ts`, `OverrideReceipt.tsx`, `SwitchPopover.tsx`, `ShapeStrip.tsx`.

## PHASE 1 — auto-detect on pen-up + persistent override
- DrawSurface props (`:1084-1183`): add `onStrokeCommitted?(stroke)`, `onSelectionChange?(id)`.
- Fire onStrokeCommitted in the new-stroke branch `:1867-1873` (capture `committed` before setStrokes; NOT on tap/shade/fill/style).
- Fire onSelectionChange in tap-select `:1859-1865` (after setSelectedStrokeId(hitId)).
- DrawToolbar (`:79/:133/:161`): ADD armedShape/onArmShape, override/onSwitchTo/onCycleOverride/onDismissOverride,
  switchPopoverOpen/onToggleSwitchPopover; mount <ShapeStrip> + <OverrideReceipt>; host renders <SwitchPopover> when open.
- Each host (DrawPanel/Canvas/ObjectSurface): add override+armedShape+switchPopoverOpen state; `handleStrokeCommitted`
  (api.fitLast('snap') → buildSwitchSet → if accepted apply best+raise receipt, else 'original'+note, suppress note on
  scribble-energy); `onSwitchTo`/`onCycleOverride`/`onDismissOverride`; `applyLibrary` (generateShape@bbox → applyToStroke).
- TEARDOWN: extend the existing snapDismissKey effects (DrawPanel:695, Canvas:318, ObjectSurface) to also clear override +
  close popover on stroke/register/mode/input flip (persistent = no timer, only these triggers).
- Wire onStrokeCommitted/onSelectionChange to <DrawSurface>; new props to <DrawToolbar> in all 3 hosts.

## PHASE 2 — ShapeStrip insert + drag-place/resize
- **2.0 FIRST: add rect/circle/triangle/ellipse generators to SHAPE_LIBRARY** (shapeLibrary.ts:345-428) — the gap.
- DrawSurface: props armedShape + onShapeInserted; state insertBox + insertShiftRef (near `:1192`); consts INSERT_MIN_PX=8,
  INSERT_DEFAULT_PX=120 (near `:1645`).
- Insert gates FIRST in handlePointerDown(`:1705`)/Move(`:1756`)/Up(`:1826`); pen-up uses insertBox coords (no event arg);
  generateShape(box) → applyShapeCandidate → setStrokes + onShapeInserted. Import generateShape.
- normalizeBox helper (Shift=1:1; tiny-drag=click-to-place at default). Live preview overlay near `:2211`.
- Hosts: wire armedShape+onShapeInserted; onArmShape clears shade register (mutual exclusion).
- Tier-A corner-resize on selected `ins-` shape (4 handles → regenerate@bbox). FLAG: confirm Tier-A = intended "reshape".

## PHASE 3 — overflow + log + tune
- 3.1 add `'auto'` to ShapeSnapOutcome (do early). 3.2 verify logSnap pushes per auto-detect/switch (honor datasets/QUARANTINE).
- 3.3 ShapeStrip `More ▾` + SwitchPopover already built; tune INSERT_MIN/DEFAULT; measure 7-pill width at /desk (fallback 4 inline via ShapeStrip.inlineShapes prop).

## Open design calls for Sebs
1. auto-apply vs auto-offer confidence band (auto-apply on bare accepted, or tighter normErr band?).
2. Tier-A corner-resize = the intended "reshape" (vs per-vertex)?
3. QUARANTINE: are new smart-log rows unblocked yet?

## Verify (live, all 3 hosts): 6 shape classes before/after + break battery (tiny/huge/spanning/scribble; override→Original;
insert→resize→switch→Original; flip Sketch↔Style mid-receipt; rapid multi-stroke). Drivers: /tmp/ofat-2d/driver-lib.mjs.
