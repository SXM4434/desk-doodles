# App-tool debug fleet — bug catalog + fix queue (2026-06-13)

Source fleet: `wf_26600740-dcc` (7 agents, DB-safe, root-caused + online-researched + repro'd). Full detail (symptom/repro/rootCause/research/citation per bug) in the task output: `/private/tmp/claude-501/.../tasks/wbrvb0e0c.output` (26 bugs, 20 research notes). This doc = the prioritized fix queue.

## CRITICAL
- **SVG-upload hard-freeze** — `svgUpload.ts prepareSvgUpload()` has NO file-size / element-count cap; a ~3.3MB / 60k-`<path>` SVG freezes the whole app (/canvas + /desk). FIX: cap bytes + element count, reject/downsample over the cap (we already FORBID style tags; add size guard).

## HIGH
- **desk move→disappear (THE bug Sebs hit)** — `DeskPage.tsx:1360-1367` publish `.then`: when `landedDesk.id !== desk.id` it calls `loadDeskView(landedDesk)` whose feed load does NOT include the just-placed optimistic doodle → it vanishes. FIX: keep the optimistic object (don't drop on the post-publish reload) / reconcile by dbId.
- **brush carves tone** — `toneMask.ts:182-186` single-band-per-cell grid: darker stroke OVERWRITES lighter cells → lighter region fragments. FIX: per-band SUPERSET extraction (band≥N) so lighter stays continuous under darker (compositing, not destructive). [CLIP Studio marker-layering]
- **fill doesn't conform (blob / cut corners ~58px)** — `chaikinClosed()` runs unconditionally (strokeTo3d.ts:1569 / toneMask.ts:561) rounding corners → octagon/blob; + marching squares on coarse 144 grid staircases. FIX: skip Chaikin for fill, conform to the actual boundary, raise grid res. [Chaikin = corner-cutting smoothing; MS low-res staircases]
- **shape-assist: rect→"Polygon"** — `shapeFit.ts:555` fitRect hard-gates `loopVerts.length !== 4`; detectCorners over-segments → never 4. FIX: collinear/turn-angle merge post-pass + tolerant rect/triangle fit.
- **shape-assist: no Star / Arrow primitives** — `shapeFit.ts:98-106` ShapeKind enum lacks them. FIX: add star + arrow recognizers. (Sebs: "more primitives".)
- **shape-assist: snap/straighten only the LATEST stroke** — `DrawSurface.tsx:1052` fitLast always returns last pool stroke; no selection UI. FIX: stroke selection → snap/straighten any. (Sebs: "select different part".)
- **SVG-upload truncation** — `svgUpload.ts:36` non-greedy `<svg…</svg>` stops at first `</svg>` inside a comment/CDATA. FIX: match last close / parse robustly.
- **SVG-upload oversize+clipped on /canvas** — DrawSurface.tsx:1488 wrapperOverride sizing overflows the frame. FIX: fit uploaded viewBox into the frame.
- **LIVE indicator stuck ~8s "Connecting" → "Offline"** — `publish.ts:104` LOAD_TIMEOUT_MS=8000. FIX: fast-fail / shorter probe for unreachable backend.

## MEDIUM
- tone paints OVER ink in Sketch preview (DOM order; DrawSurface.tsx Layer 0t before 1b) — inverted vs styled render. FIX: ink on top (z-order).
- no "full fill" + GAP slider inert on closed shapes (Fill targets only odd-depth enclosed region). FIX: add full-fill (fill to edge) + make GAP live. (Sebs: "ability to fully fill".)
- "Fit" button doesn't fit content — `DeskPage.tsx:1108` resets to CAMERA_HOME, never computes object bounds. FIX: compute bbox + frame it.
- drawer `countMarks` regex omits `<text>/<use>/<image>` → text-only / `<use>` doodles show "0 marks" / blank mini-card. FIX: count those + render defs/use in the mini-card.
- move not persisted if dragged before publish round-trip resolves (DeskPage.tsx:1581 needs dbId). FIX: queue the move until dbId resolves.

## LOW
- brush compositing architectural (same root as carve), lasso off-canvas sliver, almost-closed >10% gap won't fill (by-design tolerance), naming-overlay a11y (Tab reaches covered UI; smart-pick undo unclickable in NAME stage).

> Most of these are R10 (tool/desk round). The **audit-object RENDER fidelity** (risograph flood, svg-port 3D, extrude/solid drawing→3D) is the separate convergence loop gating the golden bless.
