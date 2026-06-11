# 08 — The Stack: every technology in the app and its job

**In one sentence:** Desk Doodles is a Vite-served React+TypeScript app where rough.js and perfect-freehand do the mark-making, culori does the color math, Supabase is the hosted backend, the 3D libraries (three/R3F/drei/cannon-es) sit installed-but-unwired waiting for Day 11, and everything is chosen to survive being drag-dropped into Figma Make.

---

## Plain language

Think of the stack as a render pipeline, the way a C4D project has a viewport, a scene graph, materials, and an output renderer. Every package below has exactly one job in that pipeline.

### Vite — the dev server and bundler

Vite is two things wearing one name:

1. **Dev server** (`npm run dev`): serves the app at `localhost:5182` and gives you **HMR — Hot Module Replacement**. HMR means: you save a file, and only that module is swapped into the running page — your canvas state, your slider positions, your drawn strokes all survive. This is the **live material** workflow: like tweaking a material in C4D and watching the viewport update without re-rendering the scene. No full page reload, no lost state.
2. **Bundler** (`npm run build`): the **bake**. It takes all your source files + dependencies and compiles them into a small set of optimized static files (one JS bundle, one CSS file). Like baking textures in Substance — expensive once, then the output is dumb, fast, and portable. The 156KB-gzip build that went to Make is this baked output's source.

Vite also enforces one security rule that matters later: **only env vars prefixed `VITE_` get baked into the client bundle**. Anything without the prefix (like `FAL_KEY`) stays server-side-only by construction. That's not a convention, it's a hard gate.

### React + TypeScript — the scene graph and the type system

**React** is the scene graph. The UI is a tree of components, like C4D's object hierarchy — and it's **declarative**: you describe what the scene should look like for the current state, and React figures out the minimal redraw. You never manually push pixels; you change state, the tree re-renders. Sliders in `SmartHachureChrome` write into React context (`F3RoughModifiersContext`), and every component reading that context redraws — like changing one node upstream in a Substance graph and watching everything downstream recompute.

**TypeScript** is the port-type enforcement on that node graph. In Substance you can't plug a grayscale output into a normal-map input; TypeScript does the same for code — a function declared to take `Signals` won't accept a raw DOM element. `tsc` (the type checker) is our pre-flight render check; "tsc-clean" in the handoffs means zero type errors.

### rough.js — the hand-drawn mark generator

rough.js takes clean vector geometry (a rect, a circle, a path) and re-draws it as if sketched by hand — jittered outlines, hachure fills, cross-hatching. Crucially this is **vector-level, not pixel-level**: it's not a Photoshop filter smudging raster pixels, it's a generator emitting *new SVG paths* that look hand-made. It is the raw mark vocabulary that Smart Hachure orchestrates.

The thing that makes rough.js usable for us is **seeded randomness** — like a noise shader with a fixed seed in C4D: same seed, same wobble, every render. That's Smart Hachure invariant I-7 (same input + seed → identical output). Except rough.js had one hole: the **dots filler** used raw `Math.random()` instead of the seeded randomizer (rough.js issue #211) — the equivalent of one noise node in your graph re-rolling its seed every frame. Result: stipple dots teleported on every re-render, shimmering across toggle changes. We fixed it with a runtime patch (story in the design section below).

### perfect-freehand — live ink

When you draw on `/canvas`, perfect-freehand converts your raw pointer points into a **variable-width stroke outline** — a closed filled polygon that swells and thins like real ink. This is brush-tip dynamics from Photoshop (pressure → width), but the output is a vector polygon, not raster pixels. It powers both the live preview while your pen is down and the pen-tip presets in the hand-feel system.

### svgson — SVG as data

svgson parses SVG markup into a JSON tree (an **AST — abstract syntax tree**, meaning the document as structured data instead of a text string). Anchor: it's like opening a layered PSD and getting the layers panel as a JS object you can walk, filter, and rewrite. Installed for future structural work on uploaded SVGs; **currently zero imports in src/** — today's pipeline walks the live DOM directly instead.

### culori — perceptual color math

culori parses any CSS color and converts between color spaces. We use it for **perceptual lightness (L\*)** — the "how dark does this actually look to a human" number, like working in Lab mode in Photoshop instead of raw RGB. Smart Hachure's signal extractor uses it to compute source darkness per region, which drives hatch density (darker fill → tighter hachure gap). RGB math would get this wrong: pure blue and mid-grey have similar RGB sums but very different perceived darkness.

### polygon-clipping — boolean geometry

Boolean operations (union / intersect / subtract) on 2D polygons — a Boole object for flat shapes. Installed for the planned **tone-patch partitioning** work: splitting a region into sub-patches of different darkness so each patch gets its own hatch density, the 2D equivalent of breaking a mesh into material zones before texturing. **Currently zero imports in src/.**

### cannon-es (and the Rapier story) — physics

Physics for the eventual desk canvas (objects dropping, settling, colliding). Two candidates existed:

- **Rapier** — Rust compiled to **WASM** (WebAssembly: a compiled binary the browser must download and initialize before any call works, like a native plugin your scene depends on).
- **cannon-es** — pure JavaScript. Slower, but it's just code in the bundle; there is no binary to fetch.

Rapier lost because of a **cold-load race in Figma Make** (verified by smoke test, Day 4): on a cold load, Make's preview asks the physics engine for its first frame *before the WASM binary finishes loading* → crash (`Cannot read properties of undefined (reading 'fg')`). Warm cache → works. Same code, coin-flip behavior. The fixes (Vite `optimizeDeps.exclude`, top-level await entry) aren't available to users inside Make. So: **cannon-es, locked**, per `project_desk_doodles_no_rapier_in_make`. Don't re-test unless Make announces WASM support.

### three / @react-three/fiber / @react-three/drei — the 3D mode (planned)

- **three.js** — the WebGL renderer. Scene, camera, lights, meshes, materials — the C4D of the browser.
- **@react-three/fiber (R3F)** — React bindings for three.js: the 3D scene graph expressed as React components, so the same declarative state model drives both the SVG canvas and the 3D canvas.
- **@react-three/drei** — a helpers/preset library on top of R3F (camera controls, environment/HDRI loaders, common abstractions). The asset-pack-of-good-defaults.
- **@react-three/cannon** — R3F bindings for cannon-es physics.

All four are in `package.json` and **none are imported anywhere in src/ yet**. The 3D toggle on `/canvas` is an honesty-gated stub ("3D mode lands Day 11"). The Day 11 plan: Rod (TubeGeometry) + Extrude (ExtrudeGeometry) from drawn strokes.

### @supabase/supabase-js — the backend

Supabase is a hosted backend-in-a-box: **Postgres** (a real relational database), **Storage** (file buckets — a cloud asset library for published doodle SVGs), **Edge Functions** (small server-side scripts that run on Supabase's machines, not in the browser), and **RLS — Row Level Security** (per-row access policies enforced by the database itself). It is the **only backend Figma Make blesses** — first-class integration, which is the main reason it's our backend at all.

Our model is **anonymous sessions, no auth UI**: a random UUID minted on first visit and kept in localStorage becomes the `session_id` on everything you publish. No accounts, no login — your browser *is* your identity, like a render farm tagging output by machine ID instead of user login. The client uses the **publishable key**, which is safe to ship in the bundle *by design* because RLS policies gate every read/write — the key opens the door only to rows the policies allow.

### fal — the GPU model proxy pattern (planned)

fal.ai hosts heavy AI models (Tripo, TRELLIS — image→3D generators) behind an API. There is **no fal npm package in package.json**; what exists is the **pattern**: the fal secret key lives in `.env.local` as `FAL_KEY` — deliberately *without* the `VITE_` prefix, so Vite can never bake it into the client bundle. Why this matters: anything in the client bundle is readable by anyone who opens DevTools — shipping a secret key client-side is like watermarking your master file with your bank password. The Day 13 plan: the browser calls a **Supabase Edge Function**, the Edge Function holds the secret in its server-side secrets store and calls fal on your behalf. Browser never sees the key.

### Figma Make — the deployment target (not the dev environment)

Make is where the app gets published (`*.figma.site` URL), per the locked **local-canonical** rule: dev happens here, Make is deployment only, never push Make back to GitHub. Make's constraints shape several stack decisions:

| Make behavior | Consequence for us |
|---|---|
| Installs deps **fresh from public npm** on its side | node_modules edits, patch-package, postinstall hooks **don't survive** → rough.js fix must be a runtime patch in our bundle |
| No monorepo / `workspace:*` deps | Desk Doodles is a single flat package; no shared-lib imports from the portfolio repo |
| Rewrites imports through esm.sh CDN | "Most packages work," but Node-only/SSR packages don't — everything we use is browser-pure |
| Supabase is the only blessed backend | Supabase chosen; client file carries baked-in fallback URL/key so it works verbatim after drag-drop (`.env` files don't travel into Make) |
| WASM cold-load race (verified) | cannon-es over Rapier |
| No iframe embedding (CSP) | The published app links out from the portfolio; can't be embedded in a case study |

---

## The design — why it's built this way

**One filter governed every choice: "does it survive Figma Make?"** Make installs fresh, runs browser-only, and gives us no control over its Vite config. That filter rejected Rapier (WASM race), rejected patch-package (patches dropped on fresh install), rejected any backend except Supabase, and rejected workspace-style code sharing with the portfolio repo (everything was duplicated in via the Day 5 fork instead).

**The patchRoughDots story is the cleanest example of the filter at work.** Three ways existed to fix rough.js #211:

| Option | Why rejected / chosen |
|---|---|
| Edit `node_modules/roughjs` directly | Dies on any `npm install`; dies instantly in Make |
| patch-package / vendoring a fork | Patches and postinstall hooks don't survive Make's fresh install (per the 20-research Make constraints doc) |
| **Runtime prototype patch in our own bundle** | **Chosen** — the fix is ordinary app code; it travels wherever the bundle travels, identical local + Make |

The patch is a faithful copy of rough.js's `dotsOnLines` with **exactly two lines changed**: `Math.random() * 2 * ro` → `helper.randOffsetWithRange(-ro, ro, o)` — same uniform distribution, drawn from the seeded randomizer. Minimal-diff on purpose: the full Secord/CCVT dot-placement replacement is scheduled Smart Phase A work, not a patch's job.

**Deps were front-loaded, wiring is staged.** three/R3F/drei/cannon-es/svgson/polygon-clipping are all installed now even though none are imported, because adding deps is the risky step in Make (esm.sh resolution, peer deps) and was de-risked early — 9 of 10 deps verified loading clean in Make back on Day 4. The wiring lands on its plan day (3D = Day 11; svgson/polygon-clipping = when the structural work needs them).

**cannon-es over Rapier is a reliability trade, not a quality trade.** Rapier is faster and more modern; cannon-es is pure JS and therefore *deterministic about loading*. For a hackathon judged in someone else's browser on a cold cache, "always works, slightly slower" beats "faster, fails on cold load" without contest.

**Supabase's publishable-key-in-source looks wrong and isn't.** `src/app/lib/supabase.ts` has the URL and key as literal fallbacks. That's deliberate: the publishable key is client-safe (RLS gates everything), and Make doesn't carry `.env` files, so the file must work verbatim after drag-drop. The line that must never be crossed is secret keys (fal, Tripo) in client code — those go in Edge Function secrets only.

---

## Technical

### Dependency table (package.json, 2026-06-10)

| Package | Version | Job | Wired today? |
|---|---|---|---|
| `vite` (dev) | ^6.4.1 | Dev server (HMR) + production bundler | YES — `vite.config.ts` |
| `@vitejs/plugin-react` (dev) | 4.7.0 | JSX/fast-refresh support in Vite | YES |
| `react` / `react-dom` | 18.3.1 | UI scene graph + DOM renderer | YES — entry `src/main.tsx` |
| `typescript` (dev) | ^5.0.0 | Type checking (`tsc`) | YES |
| `tailwindcss` + `@tailwindcss/vite` (dev) | 4.1.12 | Utility CSS engine | YES — plugin in `vite.config.ts:7` |
| `react-router` | 7.13.0 | Routes: `/` `/canvas` `/audit` `/playground` `/public` | YES — `src/app/routes.tsx` |
| `roughjs` | ^4.6.6 | Hand-drawn mark generation (the mark vocabulary) | YES |
| `perfect-freehand` | ^1.2.3 | Pointer points → variable-width ink polygon | YES |
| `culori` | ^4.0.2 | Perceptual lightness for darkness signals | YES — `smartHachure/signals.ts` only |
| `@supabase/supabase-js` | ^2.107.0 | Backend client (Postgres/Storage/Edge Functions) | Client created; no tables yet (Day 10 SQL) |
| `framer-motion` | ^11.0.0 | Animation lib (rode in with the Hero-8 fork) | NO — zero imports in src/ |
| `svgson` | ^5.3.1 | SVG → JSON AST | NO — zero imports; future structural work |
| `polygon-clipping` | ^0.15.7 | 2D boolean geometry | NO — zero imports; future tone-patch partitioning |
| `three` | ^0.169.0 | WebGL renderer | NO — Day 11 |
| `@react-three/fiber` | ^8.17.10 | React bindings for three | NO — Day 11 |
| `@react-three/drei` | ^9.114.0 | R3F helpers (controls, HDRI/env loaders) | NO — Day 11 |
| `cannon-es` + `@react-three/cannon` | ^0.20.0 / ^6.6.0 | Pure-JS physics + R3F bindings | NO — desk-canvas physics, post-Day-11 |

(Verified by grep, last re-run 2026-06-11: no `from 'three'`, `@react-three`, `cannon-es`, `svgson`, `polygon-clipping`, or `framer-motion` import anywhere in `src/`.)

### Key files

- **`/Users/sebs/Desktop/Projects/desk-doodles/package.json`** — the full dep list above; scripts `dev` / `build` only.
- **`/Users/sebs/Desktop/Projects/desk-doodles/vite.config.ts`** — 12 lines: `react()` + `tailwindcss()` plugins, `@` → `./src` alias, `server: { port: 5182 }` (line 11; pinned so it stops colliding with the portfolio labs on 5180/5181).
- **`/Users/sebs/Desktop/Projects/desk-doodles/src/main.tsx`** — entry point. Line 8 calls `applyRoughDotsDeterminismPatch()` **before** `createRoot(...).render(<App />)` — the patch must land before any `rough.svg()` call.
- **`/Users/sebs/Desktop/Projects/desk-doodles/src/app/lib/patchRoughDots.ts`** — the Make-safe runtime patch. Overrides `DotFiller.prototype.dotsOnLines` (cast through `unknown` because the method is `private` in the d.ts, lines 33-37). The two changed lines are 61-62: `this.helper.randOffsetWithRange(-ro, ro, o)` for cx/cy jitter. Idempotent via the `applied` flag (line 27).
- **`/Users/sebs/Desktop/Projects/desk-doodles/src/app/lib/supabase.ts`** — `createClient(SUPABASE_URL, SUPABASE_KEY)` with `import.meta.env.VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` and baked client-safe fallbacks (lines 9-13) so the file works verbatim in Make.
- **`/Users/sebs/Desktop/Projects/desk-doodles/src/app/lib/session.ts`** — `getSessionId()`: `crypto.randomUUID()` persisted under localStorage key `dd.session.id`, in-memory fallback for private mode / Make quirks. Not wired into any page yet.
- **`/Users/sebs/Desktop/Projects/desk-doodles/src/app/lib/smartHachure/signals.ts`** — line 11: `import { parse, converter, formatRgb } from 'culori'` — the only culori site; feeds `extractSignals()`.
- **`/Users/sebs/Desktop/Projects/desk-doodles/src/app/components/canvas/SvgStyleTransform.tsx`** — line 5 `import rough from 'roughjs'`; the main render component where rough.js + hand-feel meet.
- **`/Users/sebs/Desktop/Projects/desk-doodles/src/app/lib/handFeel.ts`** — line 448 `import { getStroke } from 'perfect-freehand'`; pen-tip presets map to perfect-freehand `StrokeOptions`.
- **`/Users/sebs/Desktop/Projects/desk-doodles/src/app/components/DeskDoodles/DeskDoodlesCanvas.tsx`** — line 3 `getStroke` import; the live-draw surface.
- **`/Users/sebs/Desktop/Projects/desk-doodles/.env.local`** (gitignored) — `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `FAL_KEY` (no `VITE_` prefix → never bundled).

### Constraint source

- **`/Users/sebs/Desktop/Projects/desk-doodles/docs/locked-refs/F3-smart-hachure-system/20-research-figma-make-capabilities.md`** — the Make constraints doc: Vite+React 18+TS+Tailwind default stack, esm.sh import rewriting, patched-packages-silently-dropped, no workspaces, Supabase-only backend, free-tier limits (incl. the 7-day auto-pause → heartbeat ping), no iframe embedding.

---

## Connections

- **→ Smart Hachure engine pages** (locked model / pipeline): rough.js + culori are the engine's raw materials — rough.js supplies the mark vocabulary, culori supplies the darkness signal. The dots patch exists to honor invariant I-7 in `docs/locked-refs/F3-smart-hachure-system/09-LOCKED-MODEL.md`.
- **→ Draw-flow / canvas pages**: perfect-freehand is the live-ink half of the draw → commit → `SvgStyleTransform` flow; the draw panel vs desk canvas split (per `docs/memory/project_desk_doodles_draw_panel_vs_desk_canvas.md`) determines where cannon-es physics eventually lives.
- **→ Backend / public-canvas pages**: `supabase.ts` + `session.ts` + `contentHash.ts` (`contentHash()` — SubtleCrypto SHA-1 for cache keys) are the three legs of the M9 anonymous-publish model; the planned table is `id · session_id · svg_blob_url · created_at`.
- **→ 3D pipeline pages**: three/R3F/drei + the fal proxy pattern are the substrate for the Rod/Extrude easy path and the Tripo/TRELLIS hard path — research synthesis at `docs/research/21-research-3d-pipeline-and-style-translation.md`.
- **→ Make deployment / workflow pages**: every "why" in this page's design section traces to `20-research-figma-make-capabilities.md` and the local-canonical rule (`docs/memory/project_desk_doodles_local_is_canonical.md`).
- **Memory edges**: `project_desk_doodles_no_rapier_in_make` (physics lock) · `project_desk_doodles_makeathon` (app architecture) · CLAUDE.md "Locked Working Stack" section is the one-screen authority this page expands.

---

## Honest status

**Real and wired today:**
- Vite (port 5182) + React 18 + TS + Tailwind 4 + react-router — the whole running app
- rough.js — all mark generation, including the **shipped** dots determinism patch (runtime, Make-safe, called at `main.tsx:8`)
- perfect-freehand — live draw on `/canvas` + pen-tip presets in `handFeel.ts`
- culori — darkness signal extraction in `smartHachure/signals.ts`
- Supabase **client** — project created (East US, free tier), API probe verified live, keys in `.env.local` + baked fallbacks
- `session.ts` / `contentHash.ts` / `normalizeInput.ts` — written, tsc-clean, **not yet imported by any page**

**Installed but zero imports (waiting on plan days):**
- three / @react-three/fiber / @react-three/drei — Day 11 (Rod + Extrude)
- cannon-es / @react-three/cannon — desk-canvas physics, after 3D lands
- svgson — future SVG-AST structural work
- polygon-clipping — future tone-patch partitioning
- framer-motion — fork residue; candidate for removal if still unused at cleanup

**Planned, no code yet:**
- Supabase tables + Storage bucket + RLS policies (Day 10 SQL) — as of this writing the database has **no tables**
- Edge Function proxy for fal.ai (Day 13) — `FAL_KEY` exists in `.env.local` only; **no fal npm package, no proxy code**
- Tripo / TRELLIS integration — research-locked in doc 21, zero implementation
- Screen-space hatching post-process via `@react-three/postprocessing` — that package isn't even installed yet

**And the standing honesty rule for this whole knowledge base:** the shipping smart system is a **rule engine** — deterministic signals → classify → treatment code in `src/app/lib/smartHachure/`. There is no ML anywhere in this stack today; the `/audit` catalog is the *future* training dataset, and anything ML-flavored is **planned**, not real.
