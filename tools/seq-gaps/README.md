# seq-gaps — proposed INTERACTION / SEQUENCE batteries (STUBS)

These are **proposed-fixture stubs** produced by the 2026-06-13 sequence gap-hunt.
They are NOT yet wired/green — each is a scaffold with the scenario list + the
proven stroke-driving technique (`page.mouse.move/down/up` with `steps`, copied
verbatim from `tools/draw/shape-assist-ui-battery.mjs` which already drives REAL
strokes — the gap-map's "technique-blocked" claim is stale).

**Hard rules inherited from every existing battery (DO NOT VIOLATE):**
- Run against a FROZEN preview: `npm run build && npx vite preview --port 44XX`.
- Route-abort EVERY supabase/REST/realtime request (no live-DB reads or writes).
- Never click Place / Done-to-desk on `/desk` against the live DB.
- READ every screenshot with vision; gate on the `window.__dd_*` training logs.

Each file documents the SEQUENCE GAP it closes (the chains the per-Rock
single-action batteries never exercise end-to-end). See the gap-hunt findings
for the {area, whatIsMissing, risk, howToClose} table.

## Files
- `create-loop-roundtrip.stub.mjs` — full loop AS ONE CHAIN: draw → Sketch|Style
  toggle → Done → naming → Back → re-draw → Done → (Edit later) Re-draw round-trip.
- `cross-tool-cycling.stub.mjs` — rapid Ink↔Shade↔Fill↔Lasso register/tool
  cycling + tool-switch-mid-gesture (does the in-flight gesture tear down cleanly?).
- `mid-action-interrupt.stub.mjs` — Escape / scrim / panel-close fired mid-stroke,
  mid-scrub, mid-lasso, mid-tone, mid-pan, mid-drag; double-Escape edges.
- `desk-drag-place-chains.stub.mjs` — drawer drag-to-place, place-then-immediately-
  drag, click-vs-drag boundary, drag-during-realtime-echo, double-click open.
- `flip-2d3d-placed.stub.mjs` — the PLACED-OBJECT 2D↔3D flip (currently ARCHITECTURALLY
  ABSENT — DeskObject has no mode field). Stub asserts the gap + frames the future test.
- `smart-pick-chip-races.stub.mjs` — pick → undo, pick → manual-override-dismiss,
  pick → re-upload (chip must re-describe), pick → Reset, double-pick.
