# SEBS — CHECK THESE LIVE

Everything from the 2026-06-18/19 sessions that needs your eyes (headless couldn't prove these). Each = **do this → should see this.** Tick as you go. Local first; then on the Make/Figma site after pasting the kit.

## A. Bugs you reported this session — confirm they're fixed
- [ ] **1. Private desk label** — open your own (private) empty desk → it must NOT say "past desk — full and closed." It's yours, addable.
- [ ] **2. "Place on desk" + multi-save** — on your private desk: draw → Done. "Where it goes" reads **Place on desk** with **Drawer / Shelf** multi-select chips (tick either/both/neither). Place → lands on the desk AND shows in whatever you ticked.
- [ ] **3. Global flip to 2D** — DESK mode, some objects saved 3D (incl. an AI-mesh/Quiver one) → toggle **View → 2D** → EVERY object flattens, the black mesh shows its flat Quiver SVG. Toggle 3D → all rise.
- [ ] **4. Geometry sweep** — DESK mode → change global **geometry mode** (Rod/Extrude/Inflate/Solid) → the WHOLE desk follows, not just some.
- [ ] **5. Handles** — an object's @owner / your handle → two warm words like `quiet-heron`, **no `-7` number**.
- [ ] **6. Buttery drawing** — fast scribbles on /canvas or the draw popup → smooth, no lag/stutter as the line grows.

## B. Phase 0 / Phase 1 fixes — eyeball
- [ ] **7. Drag feel** — drag a doodle around the desk, ESPECIALLY zoomed in / after panning → tracks the cursor cleanly, stays put on release, no jump-back/teleport.
- [ ] **8. Gap slider seals fill** — draw a shape with a small visible opening → Shade → Fill → tap inside → crank **Gap** up → it seals + fully fills (no leak/ragged).
- [ ] **9. Circle snap** — draw a circle, especially one that doesn't quite close → SNAP → closes into a clean round circle. (now uses Taubin fit)
- [ ] **10. Ink single-tap dot** — tap once on bare paper with nothing selected → a pen dot appears. (Tap a stroke still selects; paper-tap with a selection still deselects.)
- [ ] **11. Icon SVG upload** — upload an SVG that uses `<symbol>`/`<use>` (many downloaded icon-set files do) → renders the shape instead of blank.

## D. Phase 2 deep 3D relief — FLAG-GATED eval (default is unchanged)
- [ ] **12. Deep svg-port relief (opt-in flag)** — open a doodle (Game Boy is ideal) in 3D → **svg-port** style. In the browser console run `window.__sealedRelief = 1; window.__sealedReliefTune = {scale: 0.3}` then re-open/re-enter 3D. The relief should now be **real geometry depth** — screen sinks IN, buttons stand OUT — *without the cap tearing* at depth. Dial `scale` (try 0.15 / 0.3 / 0.5) for boldness.
  - ⚠️ **If the relief looks UPSIDE-DOWN / inverted** (indents bulge out, raises sink), tell me — the canvas flipY vs GPU convention is the one bit I couldn't prove headless; it's a one-line flip to fix.
  - Default (no flag set) = the current shallow relief, **unchanged** — so this can't regress anything.

## C. Invisible-when-working — nothing to SEE, they just stop breaking
- [ ] **contentHash crash** — publish from an insecure/embedded context no longer crashes.
- [ ] **personalSpace 404s** — console on `/desk` shows no 404/400 spam.
- [ ] **O(n²) hang** — only if you upload a pathological ~10k-element SVG; it won't freeze the tab.

---

**Fastest pass:** one round on your **private desk** (1–5), one **drawing** round (6, 8, 9, 10), one **drag** (7), one **icon upload** (11).

If any A–B item misbehaves, note the number → Claude digs. Several are hot paths that couldn't be proven without your screen.

> Status note: items written here are tsc+build green and (where possible) logic/DOM-verified by Claude; the ⚠️ ones are behavior/feel changes only you can confirm.
