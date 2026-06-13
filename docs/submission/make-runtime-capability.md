# Make Runtime Capability — does the FULL stack run in Figma Make?

**Purpose:** De-risk the public submission artifact. Sebs's plan publishes the Make version as the live link + Community file. This doc answers, per stack piece: **does it actually RUN in Make's preview AND in the published `*.figma.site`?** — with evidence, honest risk levels, fallbacks, and a smoke-test checklist Sebs runs after checkpoint #2.

**Date:** 2026-06-13 (Day 12). **Deadline:** 2026-06-18 11:59 PM PDT.
**Scope:** New doc, research + repo audit only. No `src/` edits, no live-DB writes.

> ## ⚡ SEBS, READ THIS FIRST (the headline)
> **Does the 3D wedge run in Make's published site? → RISKY-but-expected-YES.** WebGL / three.js / React Three Fiber is **first-class supported** by Figma Make — Figma's own developer docs use `import * as THREE from 'three'` (with a full scene+camera+geometry example) as THE canonical "third-party library" sample. A published `*.figma.site` is a normal browser web app, and WebGL runs in normal browsers. So the wedge *should* run. The reason it's RISKY not GREEN: **nobody has verified OUR specific scene** (lazy-loaded R3F `Canvas` + drei `Environment`/`OrbitControls`/`Lightformer`/`ContactShadows` + a **custom GLSL `THREE.ShaderMaterial`** for the hatch) **on the PUBLISHED url** — and Make's preview ≠ published is a documented, real gap. **The only thing that converts RISKY → GREEN is Sebs loading the published url and orbiting the cube.** Claude cannot do that (interactive/authed Make UI). This doc makes that test fast.
>
> **Everything else (Supabase realtime, cannon-es, the 2D engine, all 11 styles, the deps): RUNS or low-risk.** The 3D wedge is the single piece that needs eyes-on confirmation on the published url.

---

## 0. What actually ships today (repo audit, 2026-06-13)

This corrects a stale claim in `docs/knowledge/08-the-stack.md`, which still says three/R3F/drei have **"zero imports in src/"**. **That is no longer true** — the 3D wedge is now real, wired code that ships in the bundle:

| Surface | Real import sites (verified by grep) | Ships in bundle? |
|---|---|---|
| **3D scene (the wedge)** | `canvas3d/Stroke3DScene.tsx` · `canvas3d/hatchMaterial.ts` · `canvas3d/rodAdornments.ts` · `geometry3d/strokeTo3d.ts` | YES (lazy-loaded) |
| **Supabase + realtime** | `lib/supabase.ts` · `lib/publish.ts` (`.channel()` + `postgres_changes`) · `DeskDoodles/DeskPage.tsx` | YES |
| **rough.js / perfect-freehand / culori / dompurify** | 14 files across smartHachure, handFeel, svgUpload, SvgStyleTransform, DrawSurface, etc. | YES |
| **cannon-es / @react-three/cannon** | none yet | installed, not imported |
| **svgson / polygon-clipping / framer-motion** | none | installed, not imported |

**The 3D scene imports (the high-risk surface), verbatim from `Stroke3DScene.tsx`:**
```ts
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
```
Plus a custom `THREE.ShaderMaterial` with hand-written GLSL vertex+fragment shaders in `hatchMaterial.ts` (screen-space hatch using `gl_FragCoord`). It is **lazy-loaded** — `const Stroke3DSceneLazy = lazy(() => import('../canvas3d'))` in `DeskDoodlesCanvas.tsx:34`, behind `<Suspense>` — so it is **not in the main chunk**; it loads only when 3D mode is entered.

**Reachable routes:** `/` `/canvas` (3D lives here) `/desk` (realtime social desk) `/desks` `/public` `/playground` `/audit` — `react-router` `createBrowserRouter`.

**Build is clean (just ran `npm run build`, 2026-06-13):**
```
882 modules transformed
dist/assets/index.css            13.63 kB │ gzip:   3.50 kB
dist/assets/index-[main].js     228.68 kB │ gzip:  75.85 kB   ← app
dist/assets/index-[3d].js     1,671.81 kB │ gzip: 461.12 kB   ← three/R3F/drei (lazy chunk)
```
71 source files. The big chunk is the 3D engine, correctly split out by the lazy import.

---

## 1. Per-stack-piece capability table — RUNS / RISKY / WON'T-RUN

Verdict legend: **RUNS** = documented-supported or already-verified; **RISKY** = should work but unverified on OUR config / on the PUBLISHED url; **WON'T-RUN** = known blocked.

| # | Stack piece | Preview verdict | **Published `*.figma.site` verdict** | Evidence |
|---|---|---|---|---|
| 1 | **WebGL / three.js / R3F / drei** (the wedge) | RUNS (likely) | **RISKY → expected YES** | Figma dev docs use `import * as THREE from 'three'` as the canonical library example, with a full scene/camera/geometry sample [1]. esm.sh resolves three cleanly [1][2]. Published figma.site = normal browser web app; WebGL runs in browsers. **Gap:** our exact scene (drei Environment/OrbitControls + custom GLSL ShaderMaterial) unverified on the published url; preview≠published is real [5][6]. |
| 1b | **Custom GLSL `THREE.ShaderMaterial`** (hatch shader) | RUNS (likely) | **RISKY → expected YES** | Shaders are compiled by the browser's GL driver at runtime, not by Make's bundler — so esm.sh/Make never touches the GLSL. If WebGL runs at all (piece 1), the shader runs. No precompile step to break. Lowest-novelty risk within the 3D surface. |
| 1c | **drei `Environment`** (baked HDRI-style env from Lightformers) | RUNS (likely) | **RISKY → expected YES** | Our `Environment` uses **in-scene `<Lightformer>` panels**, `frames={1}`, `background={false}` (`Stroke3DScene.tsx:150`) — it bakes from geometry, **not from a remote `.hdr`/`.exr` file**. So there is **no external asset fetch** that a CDN/CSP could block. This is the safe way to use drei Environment in a sandboxed host. |
| 2 | **@react-three/cannon (cannon-es)** | RUNS | RUNS (when wired) | Pure-JS, no WASM, no binary fetch, no race window — the whole reason it beat Rapier [`project_desk_doodles_no_rapier_in_make`]. **N/A today: not imported yet.** When physics lands it carries zero Make-specific risk (unlike Rapier). |
| 3 | **Supabase realtime (websockets)** | RUNS | **RUNS** | Supabase is the **only first-class blessed backend** in Make; Figma + Supabase shipped official integration [3][4]. supabase-js runs client-side in the browser; realtime is a standard outbound `wss://` from the page. Published-site Supabase publish errors were a Nov-2025 bug, now **resolved — "publish without running into errors"** [4]. **Caveat:** realtime replication must be enabled on the table server-side (Supabase default-off) [8] — that's a dashboard setting, not a Make limit. |
| 4 | **@supabase/supabase-js client + baked URL/key** | RUNS | RUNS | Verified loading clean in Make Day-4 smoke test [`20-research…`]. `.env` doesn't travel into Make, so `supabase.ts` carries client-safe fallback URL + publishable key (`supabase.ts:9-13`) → works verbatim after drag-drop. Publishable key is client-safe by design (RLS gates everything). |
| 5 | **rough.js + runtime dots patch** | RUNS (verified) | RUNS | Verified clean in Make Day-4 smoke test. The dots determinism fix is a **runtime prototype patch in our own bundle** (`patchRoughDots.ts`, called at `main.tsx:8`) precisely so it survives Make's fresh npm install — node_modules edits/patch-package do NOT survive [1]. |
| 6 | **perfect-freehand / culori / dompurify / svgson / polygon-clipping** | RUNS | RUNS | All browser-pure ESM. perfect-freehand/culori/svgson/polygon-clipping verified clean in Day-4 smoke test. dompurify@^3 is pure-JS (added post-checkpoint-#1; **must be in the package.json that goes to Make** so Make installs it). |
| 7 | **react / react-dom 18 / react-router 7 / tailwind 4 / vite 6** | RUNS | RUNS | This IS Make's default stack (Vite + React 18 + TS + Tailwind) [1]. The whole running app today. react-router `createBrowserRouter` works on a published SPA. |
| 8 | **File count (71 src files) / bundle size (461KB gzip 3D chunk)** | RUNS | RUNS | No published runtime bundle-size cap [`20-research…` §7]. The **1 MB limit is per-file for the AI-chat attachment**, not a runtime/bundle limit [7] — none of our files approach 1 MB. The 10-files-per-upload-prompt limit is an **upload** constraint (→ batched checkpoint prompts), not a runtime one. |
| 9 | **esm.sh CDN rewrite of all deps** | RUNS | RUNS | Make auto-maps every `import` to esm.sh; "most packages work"; three is the documented example [1][2]. 9/10 deps already verified resolving clean in Make (three, R3F, drei, rough, perfect-freehand, svgson, culori, supabase, polygon-clipping) [`20-research…` §9]. dompurify is the one un-smoke-tested addition — pure-JS, very low risk, but **include it in the smoke test**. |
| — | **@react-three/rapier (WASM)** | WON'T-RUN | WON'T-RUN | Cold-load race, verified twice. **NOT in our stack** — cannon-es replaced it. Listed only to confirm it's gone: `grep` shows zero rapier imports and it's absent from package.json. |

---

## 2. The honest "can it run the 3D wedge?" verdict

**Verdict: RISKY, leaning strongly YES — but it is NOT confirmed until Sebs loads the published url and orbits a 3D doodle.**

**Why "leaning strongly YES":**
1. Figma **officially documents three.js** as a supported third-party library, with a working scene example — this is not a hack, it's a blessed path [1].
2. A published `*.figma.site` is a **standard browser web app**, and WebGL/canvas 3D is a standard browser capability. There is no documented WebGL block on published Make sites.
3. Our highest-novelty bits are de-risked by construction: the **custom shader** is compiled by the browser GL driver (Make's bundler never touches GLSL), and the **drei Environment bakes from in-scene Lightformers with no remote `.hdr` fetch** — so there's no external-asset path for a CDN/CSP to break.
4. The 3D engine is **lazy-loaded** behind Suspense, so even if the 461KB chunk is slow on a cold load, it can't blank the rest of the app — `/desk`, `/canvas` 2D, the styles, and realtime all render without it.

**Why it stays RISKY (the honest caveats):**
- **Preview ≠ published is a documented, recurring gap** in Make — users report sites that work in preview but go blank when published, and vice-versa; causes are usually file/config-specific (routing, asset paths, a console error), and "test the published url, not just preview" is the standing advice [5][6]. The most relevant failure family ("Make sites blank when published") is reported as **file/config-specific, not a universal WebGL/canvas problem** [6] — which is reassuring but not a guarantee for our scene.
- **Nobody has run OUR scene on the published url.** The Day-4 smoke test verified the deps *load*; it did not render this hatch-shader Environment scene end-to-end on a deployed site.
- **WebGL context can fail on the judge's machine** for reasons unrelated to Make (no GPU, blocklisted driver, hardware accel off, mobile). That's a general WebGL fact, not a Make fact — but the demo still needs to survive it (see fallback F2).

**Bottom line:** treat the 3D wedge as **expected-to-work but unconfirmed**, and make the published-url 3D smoke test (§4) a **hard gate** before submission. Do not assume; verify.

---

## 3. Fallbacks if a piece breaks

Ordered by what's most worth pre-deciding. **F1 is the one to lock now.**

### F1 — If WebGL/3D fails ONLY in published Make (works locally): host the live link elsewhere, keep Make as the Community file
This is the cleanest insurance and **it's free**. The makeathon requires a **live project link** AND a **community or working Figma file link** — these can be **two different URLs** (per `makeathon-rules-VERBATIM.md`). So:
- **Live link** → deploy the same Vite build to **Vercel / Netlify / Cloudflare Pages / GitHub Pages** (the repo already builds clean to `dist/`; `npm run build` → drop the folder). A normal static host has no Make sandbox quirks; WebGL definitely runs.
- **Figma requirement** → still publish to Make for the **Community/working-file link** (required regardless), even if the live demo points at the static host.
- **Eligibility is intact:** the rules require the project be "made using Figma's suite (Make, MCP, Local, Weave, agent)" — our hybrid local+MCP+Make workflow qualifies, and the live link is allowed to be a separate host. **This does NOT weaken the submission.** (Confirm the exact wording against `makeathon-rules-VERBATIM.md` before relying on it.)
- **Cost:** ~15 min to deploy. Recommend doing this as a **standing backup even if Make works**, so the demo can never go dark mid-judging.

### F2 — If WebGL fails on the viewer's machine (no GPU / accel off / mobile): graceful 2D-only degrade
- The app is **already mostly 2D**: `/desk` (the social wall), `/canvas` 2D draw + all 11 styles, `/desks`, `/audit` need **no WebGL**. Only the 3D mode toggle does.
- Add a WebGL capability check before mounting the R3F `Canvas` (detect `canvas.getContext('webgl2'||'webgl')`); on failure show an honest "3D needs WebGL — here's the 2D round-trip" card with a still image/GIF of the 3D result. The Suspense boundary already isolates the 3D chunk, so this is a small, contained addition.
- **The wedge story survives a 2D-only fallback** for the *site*, because the **video** carries the live 3D demo regardless of the viewer's hardware. The site failing 3D on one judge's laptop ≠ the demo failing.

### F3 — If Supabase realtime is flaky in published Make: poll-fallback
- Low likelihood (Supabase is blessed [3][4]), but if `postgres_changes` doesn't deliver on the published site, fall back to a **5–10s `listDoodlesForDesk` poll** for the demo window. The desk still fills; it just isn't instant. (Realtime replication being **off by default server-side** [8] is the far likelier culprit than a Make block — check that first in the smoke test.)

### F4 — If a specific dep won't esm.sh-resolve (most likely candidate: dompurify, the one un-smoke-tested add)
- dompurify is pure-JS and widely used via esm.sh; risk is low. If it fails, the SVG sanitizer can fall back to the existing manual `<script>`/`on*` strip already in `svgUpload.ts`. Verify dompurify in the smoke test so this never surprises at submission.

### F5 — If the published site blanks entirely (the documented preview≠published failure)
- First response is **diagnostic, not panic**: open DevTools console on the published url, read the actual error [5][6]. Causes are almost always config-specific (a routing base-path issue on the SPA, an asset path, one throwing module). Then either fix in Make or fall back to **F1** (static host) for the live link.

---

## 4. MAKE SMOKE-TEST CHECKLIST — Sebs runs this after checkpoint #2

> **This is Sebs's action, not Claude's.** Claude **cannot** drive Figma Make's UI — it's an interactive, authenticated product surface; Claude can't log in, click Publish, load the authed preview, or open the published url's DevTools. This checklist exists so the manual test is fast and complete. **Run every item on the PUBLISHED `*.figma.site` url, not just the in-Make preview** (they are documented to differ [5][6]).

**Setup**
- [ ] Checkpoint #2 uploaded; package.json in the drop set includes **dompurify** (Make installs from public npm).
- [ ] Supabase: the **same** project Make connects to is the one with the v3 RLS schema; **realtime replication is ENABLED on `public.doodles`** (Supabase dashboard → Database → Replication; default is OFF [8]).
- [ ] Publish to get the `*.figma.site` url. Open it in a **fresh/incognito window** (cold cache = the judge's first-load experience). Open DevTools console and keep it open for the whole run.

**A. Every route renders (no blank page, no thrown module)**
- [ ] `/` home renders
- [ ] `/desk` renders (the social wall — the headline product surface)
- [ ] `/canvas` renders (draw + style)
- [ ] `/desks` gallery renders
- [ ] `/public`, `/playground`, `/audit` render
- [ ] **No red errors in console** on any route (warnings OK; a thrown error is the blank-page signal [6])

**B. The 3D wedge — THE critical test (RISKY piece)**
- [ ] On `/canvas`, draw or load a doodle, switch to **3D mode**
- [ ] The R3F `Canvas` mounts (the lazy 3D chunk fetches — watch Network for the ~461KB chunk; Suspense "Loading 3D" shows then resolves)
- [ ] A 3D form renders (not blank, not a black void, not a flat blob)
- [ ] **Orbit works** — drag rotates the object (OrbitControls), damping feels right
- [ ] The **hatch shader** renders (the custom GLSL — marks on the surface, not a solid grey/tan blob); check for the warm-tan env regression too (the Day-12 envmap fix)
- [ ] No WebGL/shader-compile errors in console (`WebGL: INVALID_OPERATION`, `Program Info Log`, `THREE.WebGLProgram` errors are the red flags)
- [ ] Switch back to 2D — the toggle is clean both ways

**C. Draw → publish → realtime (the social loop)**
- [ ] On `/desk`, draw a doodle → Done → it publishes (appears on the desk; a row lands in Supabase)
- [ ] Open the SAME published url in a **second browser/incognito**; publish in window A → **it appears in window B within ~1–2s** (realtime). If not → check replication-enabled first (F3), then poll-fallback.
- [ ] Drag an object → position persists on reload
- [ ] **No console errors** during publish/realtime (watch for CSP/`wss://` connection errors, supabase-js errors)

**D. All 11 styles render**
- [ ] On `/canvas` or `/desk`, cycle the SVG style dropdown through **all 11** (rough-handdrawn, sketchy, bold-ink, wet-ink, stipple, charcoal, risograph, newsprint, + the rest) — each renders without blanking or console error. (Newsprint dot-screen mask + wet-ink/charcoal filters are the historically Make-sensitive ones — confirm the `<pattern>`/`<filter>` composites render on the published url specifically.)

**E. Share + final**
- [ ] og:image: the `*.figma.site` share preview shows the 1200×630 image (absolute URL baked with the real published origin)
- [ ] Keepalive: Supabase hasn't auto-paused (7-day idle); confirm the keepalive Action fired so the demo DB is live at judging
- [ ] Re-run **B (3D)** once more after ~10 min idle (re-checks a warm vs cold path)

**If any item fails:** read the console error first (don't guess), then go to the matching fallback in §3. For a 3D-only failure on published Make → **F1 (static host the live link)** is the fast, eligibility-safe escape.

---

## 5. Sources

Real, fetched 2026-06-13. Where Make's published-runtime behavior for our exact scene isn't documented, that's stated as RISKY above, not asserted.

1. Figma Developer Docs — Use packages and third-party libraries (the `import * as THREE from 'three'` example; esm.sh auto-mapping; package.json/public-npm) — https://developers.figma.com/docs/code/use-packages-and-third-party-libraries/
2. Figma Forum / search synthesis — esm.sh import mechanism for Make third-party libraries — https://forum.figma.com/share-your-feedback-26/figma-make-library-support-42423
3. Figma Make official page (Make built on Claude; AI app/prototype builder) — https://www.figma.com/make/
4. Supabase blog — Create a Supabase backend using Figma Make (Postgres/Storage/Edge Functions; first-class integration) + resolved publish error thread — https://supabase.com/blog/figma-make-support-for-supabase · https://forum.figma.com/report-a-problem-6/resolved-publish-error-when-linking-to-supabase-47509
5. Figma Forum — Make preview vs published differences (CSS/behavior differ; "test the published url") — https://forum.figma.com/ask-the-community-7/figma-make-desing-difference-between-preview-an-published-url-49090 · https://forum.figma.com/report-a-problem-6/figma-sites-publish-vs-preview-layout-changes-43606
6. Figma Forum — "Make sites blank when published" (file/config-specific, not universal WebGL) + Troubleshoot in Figma Make help — https://forum.figma.com/report-a-problem-6/figma-make-sites-blank-when-published-46635 · https://help.figma.com/hc/en-us/articles/31304610458647-Troubleshoot-in-Figma-Make
7. Figma Make 1 MB per-file limit applies to AI-chat attachment, not runtime/bundle (search synthesis) — https://help.figma.com/hc/en-us/articles/31304610458647-Troubleshoot-in-Figma-Make
8. Supabase Docs — Postgres Changes (realtime over websockets; replication default-OFF for new projects, must enable) — https://supabase.com/docs/guides/realtime/postgres-changes
9. Internal: `docs/locked-refs/F3-smart-hachure-system/20-research-figma-make-capabilities.md` (Day-4 smoke test: 9/10 deps verified) · `project_desk_doodles_no_rapier_in_make` (Rapier WASM cold-load race) · `docs/knowledge/08-the-stack.md` (Make-survival constraint table; **note: its "three/R3F = zero imports" line is now stale**, see §0).

---

## decisionsForSebs

1. **Lock the F1 backup now (recommended YES):** deploy the same `dist/` build to a static host (Vercel/Netlify/Pages, ~15 min) as the **live link**, and keep Make as the **Community/working-file link**. The rules allow live-link ≠ Figma-file-link, eligibility stays intact, and the demo can never go dark from a Make-published quirk. Do this even if Make's 3D works. **Your call: set it up as standing insurance, or only if the §4-B test fails?**
2. **§4-B (published-url 3D test) = hard submission gate.** Agree to treat "3D renders + orbits on the published `*.figma.site`, console clean" as a blocking checkbox before you file. If it fails and isn't quickly fixable → F1.
3. **Add the WebGL capability check + 2D-only degrade (F2)?** Small, contained (the Suspense boundary already isolates 3D). Protects against a judge's no-GPU/mobile machine. **Build it, or accept that the video carries the 3D and the site degrades silently?**
4. **Confirm Supabase realtime replication is ON for `public.doodles`** before checkpoint #2 — it's OFF by default and is the likeliest cause of "realtime doesn't fire," more than any Make limit. (Sebs-side dashboard toggle.)
5. **Include dompurify in the checkpoint-#2 package.json** (the one un-smoke-tested dep) and tick it in §4. Low risk, but it's the only resolution-unverified add since checkpoint #1.

**One honest caveat to carry:** every "RUNS" for the published site that isn't tagged "verified" rests on documented support + the published-site-is-a-normal-browser argument, not on a test of our exact deployed scene. The §4 checklist is what converts the load-bearing RISKY items (3D wedge, realtime) to confirmed. Claude can't run it — it's yours.
