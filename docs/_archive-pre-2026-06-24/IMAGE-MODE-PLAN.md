# Image mode — image → simpler hand-drawn sketch (plan + pipeline)

**Status:** scaffold + working conversion pipeline. NOT live-wired (needs the
Quiver key in Supabase secrets + the Edge function deployed — both Sebs-side).
**Feature lock:** `docs/submission/DECISIONS-FOR-SEBS.md` → "Image-mode refinement"
(Sebs, 2026-06-13). **Lane:** `src/app/lib/imageToSvg.ts` +
`src/app/lib/simplifyToSketch.ts` + `supabase/functions/image-to-svg/*` + this doc.

---

## 1. What the feature is

The "Upload image" input path on the desk. A user drops a PHOTO (PNG/JPG/WebP);
the app returns a **simpler hand-drawn sketch** version of it — abstracted to a
**few confident strokes** that fit the Desk Doodles look — and drops it on the
desk like any other doodle.

The point is **NOT** a faithful, photo-real vectorization. A faithful trace is
the opposite of a desk doodle (hundreds of filled regions, photographic color,
noise). **The simplify-to-sketch step is part of the conversion**, not an
afterthought — it is the differentiator.

Two locked decisions:

1. **Best-quality provider** = **Quiver Arrow** (`arrow-1.1-max`) via a Supabase
   **Edge function**. Quality over key-convenience — we do NOT ship the
   free-vtracer path as primary.
2. **Output = a SIMPLER sketch**, produced by our own post-process on top of the
   trace.

---

## 2. The pipeline (end to end)

```
 [PNG/JPG/WebP File]
   │  imageToSvg.ts: validate (type + 12 MiB cap)
   ▼
 [base64]  ──POST {image:{base64}, model:'arrow-1.1-max', target_size:768, auto_crop}──►
   │                                  Supabase Edge fn  /functions/v1/image-to-svg
   │   (Authorization: ANON/publishable key — client-safe)
   ▼
 Edge fn (supabase/functions/image-to-svg/index.ts)
   │  holds QUIVERAI_API_KEY (secret) ──Bearer──► api.quiver.ai/v1/svgs/vectorizations
   │  parses 200 { data:[{svg}], credits } → returns { svg }
   ▼
 [faithful trace SVG: many filled paths, fine detail]
   │  imageToSvg.ts → simplifyToSketch()   ◄── THE DIFFERENTIATOR
   │     • salience filter → drop noise specks + keep top-N dominant paths
   │     • sample each path → RDP simplify → re-emit clean polyline
   │     • fill → outline stroke (line-art the hand-feel pipeline reads)
   ▼
 [a few hand-drawn strokes]
   │  sanitizeSvgMarkup() (shared DOMPurify SVG profile)
   ▼
 [clean SVG markup]  →  desk add boundary (normalizeSvgSize → SvgStyleTransform
                         hand-feel restyle → strokeTo3d 3D path) — identical
                         contract to a prepared .svg upload.
```

After the sketch markup exists, it is **indistinguishable to the rest of the app
from a drawn or uploaded-SVG doodle** — it gets wobble, Smart Hachure, pen-tips,
2D↔3D, the works. That reuse is the whole reason the simplify step targets
**line art** (stroked outlines), not fills.

---

## 3. The simplify-to-sketch approach (the concrete algorithm)

`src/app/lib/simplifyToSketch.ts`, `simplifyToSketch(svg, opts) → { markup, stats }`.
Pure function: DOMParser in, transformed element tree, XMLSerializer out. No new
deps (no svgson/roughjs imported) — matches `normalizeInput.ts`'s house style and
stays Make-importable. Mounts the parsed SVG offscreen so the browser geometry
API (`getBBox` / `getTotalLength` / `getPointAtLength`) returns real numbers;
removes the host node in a `finally`.

**Steps** (each grounded in cited research, see §6):

1. **Collect** all `<path>/<polygon>/<polyline>` and unify poly\* → `path d`.
2. **Salience score + noise floor.** For each path compute a level-of-detail
   importance proxy `H ≈ 2·√(area/drawingArea) + pathLen/√drawingArea` (the
   area = "segment size" term, length = the "le" term from Kang/Son line-
   abstraction). Drop any path whose bbox area < `minAreaFrac` of the whole
   drawing (the standard "remove paths with area < threshold" auto-trace
   cleanup, scaled to the drawing so it works at any source size).
3. **Keep top-N.** Sort by salience, keep `maxPaths` (default 12) — the
   "structural lines only" end of the LoD slider. This is the single biggest
   "abstract to a few strokes" lever. Remove the rest from the tree.
4. **Sample → RDP → re-emit.** Split each kept path on `M` (sub-paths sampled
   separately so a multi-region path never gets a bogus bridging connector — the
   same multi-M hazard the Day-9 drawn-canvas overhaul fixed). Sample each
   sub-path to a polyline via `getPointAtLength`, then **Ramer–Douglas–Peucker**
   at `rdpEpsilon` (default 1.6 viewBox units). RDP is distance-bounded (never
   deviates more than ε → "still reads as the photo"), spike-preserving (keeps
   sharp corners — right bias for line art), and slider-stable. Re-emit a clean
   `M/L[/Z]` polyline.
5. **Fill → outline stroke** (`outlineFills`, default on). Set `fill:none`,
   `stroke:currentColor` (so palette overrides drive INK, never paper — per
   `feedback_palette_overrides_ink_not_paper`), round joins/caps. This is the
   inverse of "expand/outline stroke"; it gives the hand-feel pipeline line art
   instead of a fill stack it would only flatten.
6. **(Optional) dedupe parallel edges** (`dedupeParallel`, default off): a trace
   often emits inner+outer boundaries for one thick line; a cheap bbox/centroid
   test drops the shorter twin. Off by default — `maxPaths` already prunes most.

**Tunables** (`SketchifyOptions`, all real + exposed):

| knob | default | effect |
|---|---|---|
| `maxPaths` | 12 | how many dominant strokes survive (the "few strokes" dial) |
| `minAreaFrac` | 0.0015 | noise-speck floor (fraction of drawing bbox area) |
| `rdpEpsilon` | 1.6 | per-path looseness (higher = fewer anchors = more gestural) |
| `outlineFills` | true | fills → stroked outlines (line-art look) |
| `strokeWidth` | 2 | outline ink width (viewBox units) |
| `ink` | `currentColor` | outline color (palette-override safe) |
| `dedupeParallel` | false | merge near-duplicate parallel edges |

`stats` ({ pathsIn, pathsKept, pointsIn, pointsKept, outlined }) is returned for
honest UI copy ("traced 214 → 12 strokes") and to feed the smart-layer dataset
(every conversion is a data point — `feedback_keep_feeding_smart_ml`).

**Degrades safely:** no DOM / unparseable / zero usable paths → returns the input
unchanged with a `console.warn`. Never throws, never fakes.

**Why RDP not Visvalingam:** `docs/research/22-research-simplification-toggle.md`
§2 — VW shaves narrow spikes (wrong for hand-drawn intent), RDP is the project's
shipped engine (ε=3.0 in `SvgStyleTransform`), distance-bounded, regression-swept.
VW's precomputed-ranking (exact "keep k anchors") is the documented post-makeathon
upgrade.

---

## 4. The Edge function (key/secret handling)

`supabase/functions/image-to-svg/index.ts` — Deno, deployed by the Supabase CLI,
**not** in the Vite bundle, **not** in the Make drag-drop, **not** built by the
app's tsc (`@ts-nocheck`, lives outside `src/`). **Scaffold only — NOT deployed,
embeds NO key.**

- Reads `QUIVERAI_API_KEY` from `Deno.env` (Supabase secret). If unset → honest
  `503` ("not configured"), never a fake result.
- Validates the body, clamps `target_size` to Quiver's 128..4096, caps base64 at
  ~18M chars (Quiver decodes ≤ 12 MiB).
- `POST https://api.quiver.ai/v1/svgs/vectorizations`, `Authorization: Bearer`,
  `{ model, image, auto_crop, target_size?, stream:false }`.
- Parses the **verified** response shape `data[0].svg` (with defensive fallbacks
  for minor drift), returns plain `{ svg }`. Quiver errors → `502` with detail.
- CORS open for the browser invoke.

**Key never touches the client.** The browser sends only the Supabase ANON
(publishable) key to authorize the Edge invoke; the Quiver secret lives only in
the Edge runtime. No `VITE_QUIVERAI_*` exists anywhere — that would bundle the
secret into the browser (forbidden, CLAUDE.md).

---

## 5. What's left to wire (and who)

**Sebs-side (the only blockers to going live):**
1. Quiver account → API key. `supabase secrets set QUIVERAI_API_KEY=sk-...`
   (secret, never committed, never `.env` that ships).
2. `supabase functions deploy image-to-svg`.
3. Ensure `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` are present (they
   already are — `lib/supabase.ts`). The client auto-routes to the Edge function
   once the URL is set; no flag needed (an explicit
   `VITE_IMAGE_TO_SVG_PROVIDER=quiver` forces it).

**Code-side (small, deferred — not this lane's scope, noted as integration
points):**
4. **DrawPanel wiring** (the "Upload image" mode). DrawPanel currently has an
   honest image-upload stub (SESSION-HANDOFF). The integration is one call:
   ```ts
   import { imageToSvg, activeProviderNeedsKey } from '@/app/lib/imageToSvg';
   const res = await imageToSvg(file);          // validate→trace→sketchify→sanitize
   if (res.ok) addDoodle(normalizeSvgSize(res.markup)); // same boundary as SVG upload
   else showError(res.error);                   // honest copy
   ```
   `res.markup` is already sanitized + simplified — feed it to the SAME add
   boundary an uploaded `.svg` uses (`normalizeSvgSize` → desk object). Do NOT
   edit DrawPanel from this lane (other streams may touch it); this is the
   documented hand-off.
5. **(Optional) expose the sketchify knobs in the upload UI** (maxPaths / RDP ε /
   outline toggle) so the user can dial "looser/tighter" — `DEFAULT_SKETCHIFY`
   is re-exported for that. Or let Phase C of the smart system auto-pick them
   from image signals later.

---

## 6. Research basis (real citations)

**Quiver API** (verified against the public-beta docs + OpenAPI, 2026-06):
- Endpoint + params + response: docs.quiver.ai/api-reference/vectorize-svg/image-to-svg,
  api.quiver.ai/v1/openapi.json — `POST /v1/svgs/vectorizations`, Bearer auth,
  `{ model, image:{base64|url}, auto_crop, target_size:128..4096, stream }`,
  → `{ data:[{ mime_type:'image/svg+xml', svg }], credits }`. Rate limit 20/60s.
- Models: quiver.ai/blog/introducing-arrow-1-1 — `arrow-1.1` (default, cleaner
  primitives, cheaper) vs `arrow-1.1-max` (best fidelity, higher cost — our pick).
- docs.quiver.ai/getting-started/quickstart.

**Simplification + abstraction:**
- **Path/line salience (LoD):** Kang & Lee, "Level-of-Detail Line Abstraction";
  Son, Kang et al., "Abstract Line Drawings from 2D Images" (Pacific Graphics
  2007) — umsl.edu/~kangh/Papers/kang_pg07.pdf. Importance
  `H(e) = le + g(ζe) + β·f(Se) + α·Ve`; one salience threshold sweeps
  structural→fine. We use an area+length proxy of this to rank/keep paths.
- **Drop-tiny-paths cleanup:** standard auto-trace cleanup (remove paths with
  area < threshold / opacity < 0.05, merge same-color overlaps) — Figma "SVG Path
  Cleaner", SVGOMG (svgomg.net) remove-out-of-bounds / merge-paths.
- **RDP:** Ramer–Douglas–Peucker — en.wikipedia.org/wiki/Ramer–Douglas–Peucker_algorithm;
  comparison vs Visvalingam: martinfleischmann.net/line-simplification-algorithms,
  msbarry gist 9152218, matthewdeutsch.com/projects/polyline-simplification.
  Project decision: docs/research/22-research-simplification-toggle.md §2.
- **Fill ↔ outline:** "expand/outline stroke" inverse — Sketch "export borders
  as SVG" (medium.com/sketch-app-sources), Illustrator Object > Path > Outline
  Stroke; SVG painting model svgwg.org/svg2-draft/painting.html.
- **Hand-drawn character (downstream, already in-app):** rough.js algorithms
  (roughness/bowing) — shihn.ca/posts/2020/roughjs-algorithms, github.com/rough-stuff/rough.
  Desk Doodles' own `SvgStyleTransform` hand-feel pipeline applies this after the
  sketch markup enters the desk, so the simplify step deliberately stops at clean
  line art and lets the existing wobble/hachure engine add the hand.

---

## 7. Security checklist (all satisfied in this scaffold)

- [x] `QUIVERAI_API_KEY` is NEVER `VITE_`-prefixed, NEVER in client code, NEVER committed.
- [x] Key lives only in Supabase secrets, used only inside the Edge function.
- [x] Client sends only the client-safe ANON/publishable key to invoke the Edge fn.
- [x] Provider output is sanitized through the shared DOMPurify SVG profile (same
      gate as file uploads + DB rows) before it can reach `dangerouslySetInnerHTML`.
- [x] Size caps on both ends (client 12 MiB, Edge ~18M base64 chars) before any
      network call — no tab-freeze, no runaway hosted bill.
- [x] No live Supabase DB writes; the Edge function is an artifact (NOT deployed).
- [x] `npx tsc --noEmit` green for the client TS; Edge fn is `@ts-nocheck`, outside `src/`.
```
