---
name: desk-doodles-draw-panel-vs-desk-canvas
description: Desk Doodles draw surface and desk canvas are DIFFERENT surfaces — draw panel is a popup/side panel that produces ONE object per Done; desk canvas holds the array of objects
metadata: 
  node_type: memory
  type: project
  originSessionId: 9fe905f2-0f57-4ff7-8d81-c236f0e7ff1b
---

In Desk Doodles, the draw canvas (where the user is making a stroke) and the desk canvas (where finished objects live, scattered) are SEPARATE surfaces. Don't conflate.

**Architecture (per Sebs 2026-06-09):**

- **Desk canvas** = main/public surface holding an array of objects. Each object has a kind (`drawn` / `uploaded` / `pegboard-pin` / etc.), strokes-or-svg-source, position, tilt. This is what becomes the published shared feed on /public.
- **Draw panel** = popup / side-panel UI that opens when user clicks "Add new object → Draw." User draws inside the panel, clicks Done → ONE discrete object is added to the desk. Each new draw session = one new object.
- **Upload + image + future inputs** = same shape: each upload creates ONE object added to the desk.

**How to apply:**

- When the real flow is wired (not just the /canvas test surface): desk canvas is the parent, with an array of `objects`. Draw panel returns a single object. Upload returns a single object. Etc.
- Don't merge all strokes into a single big drawing on the desk — each draw session has a clear boundary at Done.
- `/canvas` as it exists 2026-06-09 is the TEST surface for the drawing primitive (perfect-freehand capture + Smart Hachure rendering). It's fine that it conflates surfaces because the test is "can I draw + style?" Not "is the product flow right?" — that's a follow-up build.
- Memory anchor for makeathon-plan §8.6 / §M9 (public canvas).

**Don't:**

- Build the canvas where every draw session merges into the same blob.
- Assume `/canvas` IS the desk canvas.
- Add object-management logic into the draw test surface (#46) before the desk surface exists.
