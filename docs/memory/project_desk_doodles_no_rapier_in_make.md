---
name: project-desk-doodles-no-rapier-in-make
description: "VERIFIED 2026-06-05 — Rapier WASM fails in Figma Make preview. Desk Doodles physics layer uses cannon-es, not Rapier."
metadata: 
  node_type: memory
  type: project
  originSessionId: 287a83f0-0fdf-4ed6-a8c0-31db25f03667
---

**Verdict (verified 2026-06-05 via TWO Day 4 smoke tests):** Rapier WASM does NOT instantiate in Figma Make's preview environment under ANY API surface tested. Desk Doodles physics layer is locked to **cannon-es** (pure JS, no WASM), not Rapier.

**Why (two-test evidence):**

**Test 1 — `@react-three/rapier` wrapper + Suspense:**
- LOCAL (Vite localhost:5174): green ✓
- MAKE: `Cannot read properties of undefined (reading 'fg')`
- Versions verified compatible per declared peer deps.

**Test 2 — Direct `@dimforge/rapier3d-compat` + explicit `await RAPIER.init()`, no React wrapper:**
- LOCAL: green ✓ (assumed; same code path as Test 1 mechanism)
- MAKE: SAME error `Cannot read properties of undefined (reading 'fg')`. Phase = `render` (caught by error boundary, not by `.catch()` of init), meaning the throw is synchronous — happens before async init resolution, likely at WASM glue module-load or first property access.

**Ruled out across both tests:**
- ❌ Missing Suspense (Test 1 post-fix, same error)
- ❌ React wrapper bugs (Test 2 bypassed @react-three/rapier entirely, same error)
- ❌ Version pin mismatch (peer deps satisfied; works locally)
- ❌ Generic "Make can't install npm deps" (9 of 10 Desk Doodles deps verified loading clean — three, R3F, drei, roughjs, perfect-freehand, svgson, culori, supabase, polygon-clipping)

**Remaining explanation (refined 2026-06-05 with Make AI analysis):** It's a **cold-load race condition**, not an absolute sandbox block. Mechanism: Make uses Vite in a sandboxed iframe. On warm cache, `RAPIER.init()` resolves fast enough that `useFrame`'s first frame doesn't touch the uninitialized world. On cold load (fresh `optimizeDeps` after dep change, server restart, fork/clone), the WASM fetch loses the race — `useFrame` hits an uninitialized world, throws `Cannot read properties of undefined (reading 'fg')`. Confirmed by observation: same code, same Make file, alternated green ↔ red across reload cycles depending on cache state.

**Why can't be hardened from inside Make:**
- Would need `vite.config.ts` `optimizeDeps.exclude` for `@dimforge/rapier3d-compat` — Make doesn't expose Vite config editing
- Or top-level `await RAPIER.init()` at module entrypoint — Make's `main.tsx` entrypoint pattern doesn't support cleanly
- Or gate `<Canvas>` mount behind init Promise via Suspense throw — but Rapier doesn't throw a Suspense promise during init, it throws synchronously when accessed pre-init
- Net: zero fixes available without Make platform changes

**Why "intermittent" = "unshippable" for hackathon:**
- Hackathon demo URL is opened ONCE by judges (cold load)
- Public canvas users opening the URL fresh = cold load every time for new visitors
- Warm-cache success doesn't help the first-impression case
- Fork/clone of the Make file = cold load for the next user
- Same logic as "the demo fails 1/N times" → judges mark it broken, never re-load

**Shippable path:** cannon-es. Pure JS, no WASM, no race window, no platform dependency.

**How to apply:**
- Desk Doodles's `~/Desktop/Projects/desk-doodles/package.json` must NOT include `@react-three/rapier` or `@dimforge/rapier3d-compat`. Use `cannon-es` instead.
- Physics layer architecture: cannon-es is imperative, not declarative — no `<Physics>` / `<RigidBody>` JSX. Manual `World` + `Body` + stepping in a `useFrame` loop. ~1 day of work to wire up (already absorbed in Desk Doodles plan).
- Don't waste time trying to "fix" Rapier in Make. The throwaway smoke test is definitive; no need to re-test.
- If Figma Make later announces WASM support / sandbox changes, re-test before assuming Rapier works.

**Related:** [[feedback_dont_parrot_external_ai_screenshots]] — same session, we wasted ~1 hour cycling through Make AI's diagnoses before testing locally first. Always test local before declaring "X is broken in Make."
