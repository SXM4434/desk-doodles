# Desk Doodles — Puppeteer test harnesses

Reusable browser-driven harnesses for verifying Desk Doodles flows (demo wall, gallery,
personal-space DB, and the headed-Chrome WebGL/3D checks). Preserved here from `/tmp`
(2026-06-15 night session) so they survive a `/tmp` wipe.

## Shared prerequisites (read first)

- **Dev server must be running at `http://localhost:5182`** (`npm run dev` from the repo root).
- All harnesses import puppeteer-core directly from the local install:
  `node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js` (absolute path baked into each file).
- They launch the system **Google Chrome**, not a bundled Chromium:
  `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`.
- **Headed harnesses need a real GPU for WebGL** — the 3D ones (`dd-svgport-cap`, `dd-pressure-cap`)
  run `headless: false` because headless Chrome cannot create a WebGL context, so any 3D render
  comes out blank/black. Run them on the physical Mac, not over a GPU-less remote session.
- Screenshots are written to **`/tmp/dd-shots/`** — create it first if it doesn't exist
  (`mkdir -p /tmp/dd-shots`), otherwise `page.screenshot` throws.
- Run any harness with: `node tools/harnesses/<file>` (from the repo root). They are ESM `.mjs`
  with top-level `await`; Node 16+ runs them directly, no flags.

## The harnesses

### `dd-wall-cap.mjs` — capture the demo wall
- **Run:** `node tools/harnesses/dd-wall-cap.mjs`
- **Mode:** headless (`headless: 'new'`). No WebGL needed (2D SVG capture).
- **What it does:** loads `/desk?demo=1`, waits ~3.5s for the demo seed (21 curated catalog objects
  across families × all render styles) to land and the camera to frame, then screenshots the wall.
- **Verifies:** the demo wall seeds correctly with no DB — reports the SVG count on the page, the
  first ~200 chars of body text (should show the wall is `● LIVE`), and any console/page errors.
- **Output:** `/tmp/dd-shots/wall-demo.png`.

### `dd-gallery-cap.mjs` — capture the gallery + click through to the wall
- **Run:** `node tools/harnesses/dd-gallery-cap.mjs`
- **Mode:** headless. No WebGL needed.
- **What it does:** loads `/desks` (the "wall of walls" gallery), screenshots it, then finds the
  **"The Showcase Wall" (DEMO)** card by matching button text `/Showcase Wall/i`, clicks it, and
  confirms the navigation lands on `/desk?demo=1`.
- **Verifies:** the gallery always renders the demo card (DB-on or DB-off) and the card routes
  through to the 21-object wall. Reports gallery text, whether the card was found/clicked, the URL
  after the click, the resulting desk text, and console/page errors.
- **Output:** `/tmp/dd-shots/gallery-demo.png`, `/tmp/dd-shots/gallery-to-desk.png`.

### `dd-ps-dbtest.mjs` — personal-space DB end-to-end (live Supabase)
- **Run:** `node tools/harnesses/dd-ps-dbtest.mjs`
- **Mode:** headless. No WebGL — this is a pure RPC test driven through the browser.
- **What it does:** loads the app origin (`http://localhost:5182/`) so Supabase CORS allows the
  fetches, then runs the full personal-space RPC chain against the **live** Supabase project from
  inside the page via `fetch`: `claim_handle` → `create_private_desk` → list my desks →
  `stash_to_drawer` → list my drawer → `share_to_shelf` → list my shelf →
  `publish_to_private_desk` → confirm doodle on the private desk → negative check that the private
  desk does NOT appear in the public gallery pool (`owner_id=is.null`).
- **Isolation:** every run uses a throwaway session id (`test-ps-<random>`), so all writes are
  owner-scoped, sit in negative (private) desk-index space, and are invisible on the public wall.
  Test rows are left in the DB (owner-scoped junk, harmless; wipe later if desired).
- **Verifies:** all RPCs return 200/ok; `create_private_desk` returns a globally-unique negative
  `desk_index` (migration 0005); drawer/shelf/desk separation holds; private stays out of public.
- **Output:** a per-step status table to stdout (no screenshot).
- **Keys:** the Supabase URL + **publishable anon key are hardcoded at the top of this file**.
  These mirror the values in **`.env.local`** (`VITE_SUPABASE_URL` / anon key) — if the project or
  key rotates, update both. The anon key is publishable (client-side) by design.

### `dd-svgport-cap.mjs` — draw → shade → 3D → pick svg-port style → capture + probe
- **Run:** `node tools/harnesses/dd-svgport-cap.mjs`
- **Mode:** **headed** (`headless: false`, window pushed off-screen at `2400,2400`). Needs a real
  GPU for WebGL.
- **What it does:** loads `/canvas`, draws a closed circle on the largest SVG capture surface,
  clicks **Shade** and scribbles a dark patch, flips to **3D**, opens the custom **3D-STYLE**
  dropdown (trigger reads "Native"), and picks the **svg-port** option. Then probes pipeline state.
- **Verifies:** the svg-port path renders (a light paper form with the drawing etched in, not
  all-black) and the offscreen svg-port source SVG exists. Reports the click results, the picked
  option label, a probe (canvas count, offscreen source-SVG lengths, whether the svg-port label is
  present), and console/page errors.
- **Output:** `/tmp/dd-shots/svgport-real.png`.

### `dd-pressure-cap.mjs` — draw zigzag → 3D → Inflate → pressure low vs high
- **Run:** `node tools/harnesses/dd-pressure-cap.mjs`
- **Mode:** **headed** (`headless: false`, off-screen window). Needs a real GPU for WebGL.
- **What it does:** loads `/canvas`, draws a curvy zigzag (open stroke = good Inflate candidate),
  flips to **3D**, opens the **Geometry Mode** dropdown (trigger reads "Auto") and selects
  **Inflate**, then drives the **Inflate Pressure** slider to its extremes — `0.00` then `1.00` —
  capturing a screenshot at each.
- **Verifies:** the pressure slider actually modulates geometry — at high pressure the stroke
  fattens at the bends and tapers between (the R10f pressure fix). Compare the two screenshots:
  they should visibly differ.
- **Output:** `/tmp/dd-shots/inflate-p-low.png`, `/tmp/dd-shots/inflate-p-high.png`.

### `dd-demo-add.mjs` — Add-doodle on the demo wall stays local
- **Run:** `node tools/harnesses/dd-demo-add.mjs`
- **Mode:** headless. (Drives the 2D Add-doodle dialog; no 3D render is asserted.)
- **What it does:** loads `/desk?demo=1`, records the object count, clicks **Add doodle**, draws a
  stroke on the largest SVG inside the dialog (the DrawSurface capture surface), clicks **Done**
  then **Place on desk**, and re-reads the URL + count.
- **Verifies:** adding a doodle on the demo wall does NOT publish to / bounce to the real open desk
  — the URL stays `/desk?demo=1` and the count goes up by one (the R10f "demo add stays local"
  fix). Reports BEFORE/AFTER url+count and console/page errors.
- **Output:** `/tmp/dd-shots/demo-add-after.png`.

## Key gotchas (all harnesses)

- **Headless cannot do WebGL.** Any harness that asserts a 3D render must be headed
  (`dd-svgport-cap`, `dd-pressure-cap`). The headless ones only touch 2D SVG / DB / DOM.
- **Custom dropdowns are NOT native `<select>`.** The 3D-STYLE and Geometry-Mode controls are
  custom `button[aria-haspopup="listbox"]` triggers. Driving them is two steps: find the trigger by
  its current label text (e.g. `/native/i`, `/auto/i`) and click it to open, then click the
  matching `[role="option"]` (e.g. `/svg.?port/i`, `/inflate/i`). You cannot set them like a select.
- **Sliders are `input[type=range]`.** Set them by grabbing the native value setter
  (`Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set`) and dispatching both
  `input` and `change` events (bubbling) so React picks up the change. The **Inflate Pressure**
  slider is **index 6** in the on-page range list; its default is **0.35** (`INFLATE_PRESSURE_INFLUENCE`).
  If the chrome layout changes, re-confirm the index.
- **Timing is fixed-`setTimeout`, not condition-waited.** The demo seed needs ~3.5s; 3D
  composition/re-port needs ~1.5–3.5s. On a slow machine bump the waits rather than assuming a
  failure.
- **`/tmp/dd-shots/` must exist** before running, or `page.screenshot` throws.
- **Supabase anon key lives in `.env.local`** and is duplicated at the top of `dd-ps-dbtest.mjs`;
  keep them in sync on a project/key rotation.

## Skill candidates (later)

Two of these encode repeatable verification workflows that are good candidates to graduate into
proper Claude skills post-makeathon:

- **3D-verify skill** — generalize `dd-svgport-cap.mjs`: headed Chrome, draw/shade → 3D → drive the
  custom 3D-STYLE dropdown to a target style → capture, with the standing **verify rule**
  (compare each 3D render to its baseline: straight-3D ↔ clean SVG, svg-port ↔ the same SVG style
  in 2D). This is the recurring "prove the 3D render" loop.
- **OFAT-style toggle skill** — generalize `dd-pressure-cap.mjs`: hold a baseline, change ONE
  control (slider or dropdown) across its range, capture each step, diff against the held baseline.
  This is the one-factor-at-a-time pattern already used across the project; the slider/dropdown
  driving primitives here are the reusable core.

The DB (`dd-ps-dbtest`) and 2D capture (`dd-wall-cap`, `dd-gallery-cap`, `dd-demo-add`) harnesses
are useful as-is but are more flow-specific; they're better kept as scripts than promoted to skills.
