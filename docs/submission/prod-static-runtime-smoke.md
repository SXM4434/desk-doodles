# Prod-Static Runtime Smoke Test

**What this is:** an empirical test of whether the Desk Doodles **production build** actually *runs* when served as a static bundle — the closest available proxy for Figma Make's published `*.figma.site` (we cannot drive Make's UI). This complements the docs-research ("does Make *support* the stack") with real evidence ("does our built app *run* in a prod-static context").

**Date:** 2026-06-13 · **Method:** `vite build` → serve `dist/` statically → Playwright-load every route, capture console + pageerrors + network, screenshot + read each, plus a WebGL/3D mechanics probe and a Supabase connection probe. **No src edits. No live-DB writes** (the desk read-on-load is the only DB touch; nothing published or deleted).

> ⚠️ Scope note: this judges **runtime mechanics** (does WebGL init, does the R3F scene mount without crashing, does Supabase connect, do routes load, is the console clean) — **NOT 3D visual content quality**, which is mid-edit by another fleet and covered by a separate visual sweep.

---

## How it was run

1. **Build:** `npx vite build` → ✅ green. 882 modules transformed, built in 2.29s. Output `dist/` = 2.3 MB.
2. **Serve:** `npx vite preview --outDir dist --port 4317` — serves the **built prod bundle** (not the dev server). This is the primary harness.
3. **Worst-case serve:** a hand-written Node static server with **no SPA fallback** (`/tmp/dd-prod-smoke/dumb-static.mjs`, port 4319) to expose the deep-route risk a naive static host would have.
4. **Drive:** Playwright (Chromium) loaded `/ , /desk , /canvas , /audit , /desks`. For `/canvas` it drew a closed triangle stroke via mouse, toggled to 3D, and probed the WebGL context.

Harness + artifacts: `/tmp/dd-prod-smoke/` (`smoke.mjs`, `results.json`, `shots/*.png`, `dumb-static.mjs`, `deeproute.mjs`, `clientnav.mjs`, `assets.mjs`).

---

## Per-route results (served from the BUILT bundle via `vite preview`)

| Route | HTTP | Mounted | Console errors | Page errors | Key elements present | Verdict |
|---|---|---|---|---|---|---|
| `/` (home) | 200 | ✅ | 0 | 0 | wordmark, H1 "Doodle what's on your desk.", "Start doodling" CTA, "Browse the wall", build-in-public footer | **RUNS** |
| `/desk` (real product) | 200 | ✅ | 0 | 0 | ●LIVE status chip, "The Graphite Orchard 25/120", ADD DOODLE, PEN/DESK pills, full pen-controls panel, **50 doodle SVGs rendered from DB** | **RUNS** |
| `/canvas` (3D wedge) | 200 | ✅ | 0 | 0 | 2D/3D mode tablist, Draw/Upload inputs, **WebGL 3D scene mounts + renders** (see below) | **RUNS** |
| `/audit` | 200 | ✅ | 0 | 0 | "AUDIT · 197 SHAPES", full Smart Hachure controls, **402 SVGs rendered** through the pipeline | **RUNS** |
| `/desks` (gallery) | 200 | ✅ | 0 | 0 | "THE WALL OF WALLS", live desk card w/ mini-desk preview, ●LIVE badge, 25/120 count | **RUNS** |

**Screenshot reads (all captured + visually confirmed):**
- **Home** — clean warm-paper page; serif wordmark; hero + two CTAs + "Built in Public · github.com/SXM4434/desk-doodles" card. Nothing missing or broken.
- **/desk** — the real product: ~25 hand-drawn doodles (hearts, mug, paper boat, scribbles) scattered on warm paper; right-side pen-controls panel fully populated; ●LIVE. **This is live Supabase data rendering in the prod bundle.**
- **/canvas (3D)** — my drawn closed triangle stroke converted to a real **extruded 3D solid**, ink-black material, contact shadow, correct lighting; full 3D chrome (3D Style / Material / Polish-Reflection-Sheen-Outline sliders / Geometry mode). The wedge runs.
- **/audit** — the 197-shape catalog rendering through current style + modifier state; controls panel intact.
- **/desks** — gallery card showing a real mini-desk preview (6 doodles scattered), live badge, count — Supabase-fed.

---

## Per-stack-piece results

| Stack piece | Evidence | Verdict |
|---|---|---|
| **Production build** | `vite build` green, 882 modules, 2.29s, 2.3 MB dist, 0 errors | **RUNS** |
| **React + react-router (`createBrowserRouter`)** | All routes mount under SPA fallback; client-side nav (Home → /desk) works even on a no-fallback host | **RUNS** (with one deploy caveat — see RISKY) |
| **WebGL / three.js / R3F (the 3D wedge)** | On `/canvas`, after drawing a stroke + toggling 3D: **WebGL 2.0 context created** (`WebGL 2.0 (OpenGL ES 3.0 Chromium)`), canvas 702×526 with matching drawing buffer, R3F `<canvas>` mounted, **no THREE/WebGL errors, no crash, no empty-state**; screenshot shows a real extruded 3D triangle with lighting + shadow | **RUNS** |
| **Supabase client** | Client initializes from baked-in fallbacks (no env needed); on `/desk` it issued real REST calls to `revoukwqlisqdjteortc.supabase.co/rest/v1/desks` + `/doodles` that **succeeded and rendered 50 SVGs**; status chip reads ●LIVE; no uncaught supabase errors | **RUNS** |
| **Google Fonts (external CDN @import)** | `fonts.googleapis.com` CSS + `fonts.gstatic.com` woff2 (Instrument Sans, Fraunces) all 200 | **RUNS** |
| **og-image.png** | Referenced as `/og-image.png` in meta tags; `HEAD /og-image.png` → 200; present in `dist/` (466 KB) | **RUNS** |
| **Deep-route direct load on a naive host** | Dumb static server (no SPA fallback): `/` → 200, but `/desk` `/canvas` `/audit` `/desks` → **404** | **RISKY** (see below) |
| **Bundle realities** | 2 JS chunks (1.67 MB main / 228 KB), 1 CSS (13.6 KB); gzip: main 461 KB, second 76 KB, CSS 3.5 KB. three.js + react-router + supabase all in the main chunk. No leaked absolute FS paths, no `process.env`/`__dirname`/`require()` SSR-only constructs | **RUNS** (heavy first paint; not a blocker) |

---

## The one real risk for Make: deep-route 404 (RISKY, fixable)

The app uses `createBrowserRouter` (HTML5 history paths). The build emits a **single `index.html`** — there is no `/desk/index.html` etc.

- Under **`vite preview`** (and most modern static hosts with SPA fallback): all deep routes load fine (they rewrite unknown paths → `index.html`, then the client router takes over). ✅
- Under a **naive static host with no SPA fallback**: only `/` loads; a **direct load or hard-refresh of `/desk`, `/canvas`, `/audit`, `/desks` returns 404.** ❌
- **In-app navigation is unaffected** either way: clicking "Start doodling" on `/` pushState-navigates to `/desk` with no server round-trip — verified working even on the no-fallback host (no page error, full desk renders).

**What this means for the Make-published artifact:**
- If the submission/social link points at the **root `/`** and people navigate in-app → **works regardless** of Make's fallback behavior.
- If a judge **deep-links or refreshes** on `/desk` (likely — `/desk` is the primary product CTA) **and** Make's published static host does **not** rewrite to `index.html` → **404**.

**Fix options (do now, cheap):**
1. **HashRouter** (`createHashRouter`) — routes become `/#/desk`; 100% static-host-proof, zero infra. Safest for Make's unknown fallback behavior. (Small URL-aesthetics cost.)
2. **SPA fallback config** if Make supports a rewrite rule / `200.html` / `_redirects` convention — but Make's published-site rewrite behavior is unverified, so this is the riskier bet.
3. **At minimum:** ensure every entry/share link (submission, social post, README live link) points at the **root `/`**, never a deep route, and that the in-app first click does the navigation.

> Recommendation: switch to `createHashRouter` for the Make-published build, OR confirm empirically (when Make is up) that a hard-refresh on `*.figma.site/desk` does not 404. Until confirmed, treat deep links as unsafe.

---

## Console noise (non-blocking)

- `/canvas` emitted 4 **warnings** (not errors): `GL Driver Message (… Performance …): GPU stall due to ReadPixels`. These are **caused by the test harness itself** (`gl.readPixels` pixel-sampling for the non-blank check), not the app. The app's own render loop does not call readPixels. Disregard.
- No other console errors or warnings on any route. No failed network requests on any route.

---

## SHORT SCANNABLE OVERVIEW (Sebs)

**Does the built app run in a Make-like static deploy? — YES.** Built green (882 modules, 2.3 MB), served from the prod `dist` bundle, all 5 routes (`/ /desk /canvas /audit /desks`) load 200, mount, render real content, **zero console errors, zero page errors, zero failed requests.**

**Does the 3D wedge run? — YES.** On `/canvas`, drawing a stroke + flipping to 3D creates a **WebGL 2.0 context** and mounts the R3F scene with **no crash and no THREE/WebGL errors** — it rendered a real extruded 3D triangle (lit, shadowed). WebGL runs in the prod static bundle. (3D *visual quality* is out of scope here — separate sweep.)

**Supabase — YES.** The client inits with no env (baked fallbacks) and made **successful live REST calls** on `/desk` and `/desks`; the desk rendered 50 doodles, status ●LIVE. No uncaught errors.

**The one thing to fix before publishing on Make — deep-route 404 (RISKY).** Because of `createBrowserRouter` + single `index.html`, a **direct load / hard-refresh of any deep route 404s on a host without SPA fallback** (in-app navigation is fine; root `/` is fine). Make's published-site fallback behavior is unverified. **Fix:** switch the Make build to `createHashRouter` (static-proof, ~5-min change), or guarantee all share/submission links point at root `/`. Everything else runs clean.
