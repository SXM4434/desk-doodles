# Test-Coverage Gap Map — Desk Doodles

**Date:** 2026-06-12 (Day 10/14, deadline 2026-06-18) · **Method:** code surface enumeration (routes.tsx + DeskDoodles/ + canvas/ + canvas3d/ + chrome/ + lib/) cross-referenced against every existing harness (`tools/**` + `audit-runs/**` + the per-Rock batteries) and the live build, then driven against an **isolated frozen preview** (`vite build --outDir /tmp/dd-gap-dist` → `vite preview --port 4421`) with **all Supabase mutations route-aborted** (GET-only; zero publish/delete/move/test rows). Every state asserted below was screenshotted **and read with vision** per Sebs's standing law.

**New harnesses added (committed, repo-only):** `tools/gapmap/route-sweep.mjs` (every route × desktop+390px), `tools/gapmap/interaction-probe.mjs` (create loop · 2D↔3D flip · drawer · pan/zoom · live-desk census), `tools/gapmap/conversion-probe.mjs` (real-PointerEvent 2D→3D), `tools/gapmap/states-probe.mjs` (offline · upload-image stub · upload-svg picker). Shots in `/tmp/dd-gapmap/`.

---

## Headline

The codebase is **deeply unit-tested where it has a node-runnable or single-route harness** (the 197-shape SVG audit, the 3D geometry/material/mark-intent batteries, the classifier golden+reliability gates, the per-Rock create/resilience/shade batteries). It is **structurally untested everywhere the test technique is hard**: anything that needs a *real placed object* (the live desk integration), a *real drawn stroke* (no harness can drive `DrawSurface`'s `setPointerCapture` pointer pipeline — confirmed: both naive `mouse.*` and dispatched `PointerEvent` failed to register a stroke), a *second live client* (realtime is proven only via synthetic payloads through the channel callbacks, never a real two-client arrival in a repeatable battery), or a *narrow viewport* (zero responsive testing — and the two primary product routes are broken at 390px).

The single biggest gap-vs-stakes mismatch: **the demo climax (2D↔3D flip, "the hand survives the round-trip") and Beat 1 (live shared desk with realtime arrival) are the two least integration-tested surfaces in the app.** The 3D *engine* is exhaustively battery-tested in isolation; the *flip a real desk object into 3D* path has never been exercised end-to-end (the live desk currently holds **0** 3D objects — census via interaction-probe).

---

## Coverage legend

- **WELL-TESTED** — a dedicated automated harness exercises it with read-back assertions, re-runnable.
- **LIGHTLY-TESTED** — covered only by one-shot manual playwright scripts in `/tmp` (not re-runnable in a battery), OR a single "sanctioned live cycle" done by hand once, OR partial coverage of one branch.
- **UNTESTED** — no harness, no scripted verification; correctness rests on source reading or a single eyeball.

---

## 1. Routes / page surfaces

| Surface | Coverage | Evidence / harness | Notes |
|---|---|---|---|
| `/` home | LIGHTLY | route-sweep (renders clean desktop + 390px) | No interaction test; CTA wrap at 390px is cosmetic-OK. |
| `/canvas` (engine test surface) | LIGHTLY | rocky wireframe battery hits it; route-sweep | Chrome split (2D/3D) renders; **broken at 390px** (controls panel clipped off-screen). |
| `/desk` (THE product) | LIGHTLY | rockb resilience + rockf1/f2 batteries hit it | Desktop renders 25 live 2D objects clean; **broken at 390px** (pen panel eats full width, header overlaps, canvas a sliver). |
| `/desks` gallery | LIGHTLY | route-sweep (desktop + 390px both clean) | **Offline state hangs** on "Loading the wall…" — see §8. |
| `/public` | UNTESTED | route-sweep (renders, 248 chars placeholder) | Static CTA marketing page; low risk. |
| `/playground` | LIGHTLY | route-sweep | Renders desktop; **controls panel clipped at 390px** (same overflow class as /canvas). |
| `/audit` (197-shape catalog) | WELL | classifier golden/reliability + 3d audit-sweep + rocky; route-sweep confirms 4843 svg marks, 0 console errors | The most-tested surface in the app. |
| `*` 404 | LIGHTLY | route-sweep (renders correct "Not found." + back link) | Fine. |

**Console-error sweep:** all 8 routes render with **0 console errors** at desktop (route-sweep results.json). The only errors observed were the 3 expected Supabase-fetch failures under the simulated-offline run.

---

## 2. The full creation loop (draw → name → place → reopen → re-draw → save)

| Stage | Coverage | Notes |
|---|---|---|
| DrawPanel open + chrome (Sketch\|Style, Ink\|Shade, full per-style controls) | LIGHTLY | rockA/rockB create batteries + interaction-probe confirm it opens with full controls. |
| **Draw a real stroke** | UNTESTED (technique-blocked) | **No harness can drive a stroke.** `DrawSurface` uses `onPointerDown/Move/Up` + `setPointerCapture`; both playwright `mouse.*` and dispatched `PointerEvent('pen')` failed to register (verified twice — surface still shows "Draw your doodle" after a full drag). Every "drawn" battery actually injects pre-built stroke arrays or markup, never the gesture. The capture→perfect-freehand→Done polyline swap is verified by source only. |
| Naming/minting card (styled preview) | LIGHTLY | rockB task #8 (manual playwright, one-shot). Not a re-runnable battery. |
| Place → record lands on desk (size-cap gate, Shrink-to-fit) | LIGHTLY | rockB task #10 (one-shot); size-cap is intercept-proofed but never re-run. |
| Re-draw (reopen strokes, edit, save back to row) | UNTESTED (live) | ObjectSurface Re-draw exists + wired to v5 RPC; verified only by one hand-run "sanctioned live cycle." No battery; depends on a placed owned object the harness can't create without a write. |
| Edit (restyle, save config via v4 RPC) | UNTESTED (live) | Same — code-complete, never scripted. |
| Legacy strokeless row → Re-draw hidden + honest note | UNTESTED | Source-only; no fixture row to drive it. |

---

## 3. Upload paths

| Path | Coverage | Notes |
|---|---|---|
| Upload SVG (pick → sanitize → normalize → style) | LIGHTLY | File input present (states-probe). `sanitizeSvgMarkup` (DOMPurify) is the XSS layer — **never tested with a malicious payload** (no script/onload/foreignObject fixture run through it in any battery; `test-fixtures/edge-case-torture.svg` exists but isn't wired to an automated assertion). |
| Upload SVG draw-over (letterbox backdrop + inverse-mapped merge) | UNTESTED | The `<g transform>` flatten bug was caught by screenshot once and fixed; no regression battery guards it. Merged objects record no strokes (deliberate) — untested. |
| Un-embeddable SVG (no viewBox) → honest fallback | UNTESTED | Source-only. |
| Upload image | N/A (honest stub) | states-probe READ the stub: "IMAGE UPLOAD IS COMING — SVG upload works today." Honest, no fake controls. Correctly out of scope (S1). |

---

## 4. The 2D↔3D flip + caching (THE demo climax)

| Surface | Coverage | Notes |
|---|---|---|
| 3D geometry engines (Rod/Extrude/Inflate/Solid) — pure logic | WELL | `strokeTo3d-smoke.mjs` 48/48; runs the real lib node-side. |
| 3D × 197 catalog shapes × 5 modes render | WELL | `audit-sweep.mjs` flags EMPTY/BLOB/WALL/NANS. |
| Material × orbit-angle (ink-black policy) | WELL | `material-battery.mjs` 72/72 with per-cell table + tan-band gate. |
| Mark-intent / conversion semantics (arrow/cat-face/two-arc + donut) | WELL | `mark-intent-battery.mjs` 11/11 against `markintent-golden.json` (status: candidate, **pending Sebs bless**). |
| Tier-2 style toggles (caps/joints/bevel/wall/profile/edge/holes) | LIGHTLY | tier2-board + arrow-rule-board render boards (eyeball gates, not asserted). |
| **2D→3D flip on /canvas with a real drawn stroke** | UNTESTED (technique-blocked) | conversion-probe drove a real PointerEvent triangle + flipped to 3D → **canvas never mounted** (stroke didn't register; "NOTHING TO CONVERT YET"). The chrome split (3D Style / Material / Geometry dropdowns) IS built and renders correctly — but the *conversion of a real gesture* is unproven outside the node battery. |
| **2D↔3D flip on a PLACED desk object** | UNTESTED | The live desk holds **0** 3D objects (census). The mixed 2D+3D desk, the "convert FROM THE RECORD" path on a real row, and the Global-lens mode sweep are **completely unexercised in any integration test.** |
| Conversion caching (content-hash keyed intermediate) | UNTESTED | The cache-key amendment (svg∥strokes∥toneFills∥extractorVersion) is spec'd; no test confirms a flip re-uses a cached GLB/geometry rather than recomputing. |
| Hatch shader + SVG-port style (3D Style dropdown) | LIGHTLY | Rock 1 tasks #29/#30 one-shot; no re-runnable battery; SVG-port = M8, partially built. |

---

## 5. Realtime / multi-user

| Surface | Coverage | Notes |
|---|---|---|
| Realtime INSERT/UPDATE/DELETE handlers | LIGHTLY | `resilience-battery.mjs` fires **synthetic** postgres_changes payloads through the real channel callbacks (Phases 0–D) + ONE sanctioned true two-context cycle (Phase E) per run. The synthetic path is re-runnable; the true two-client path writes one row and is the only real arrival proof. |
| Two real clients arriving live on the SAME desk at scale | UNTESTED | Never tested with >1 concurrent real session beyond the single Phase-E row. The demo's Beat 1b ("a SECOND session's doodle pops in live") rests on this. |
| Don't-fight-the-hand (drag-local object survives a remote UPDATE echo) | LIGHTLY | Proven mid-drag once in rockB; not in a repeatable gate. |
| DELETE unfiltered + client id-match desk-scoping | LIGHTLY | rockB synthetic only. |
| Cap/auto-spawn (desk N+1 at 120) | UNTESTED | Server-side RPC; never driven to the cap (would need 120 writes). |

---

## 6. Smart-pick / classifier decision surfaces

| Surface | Coverage | Notes |
|---|---|---|
| Classifier (197-shape role assignment) | WELL | `golden-snapshot.js` + `golden-diff.js` + `reliability.js` (ECE) against `golden-labels.v2.json`. |
| Smart-pick chip (pick + receipt + undo + override-dismiss) | LIGHTLY | rockA r7 task #48 one-shot; logic in `smartPick.ts`. The chip only fires on **upload** (needs an uploaded markup) — its live appearance on the real upload path is unproven in a battery. |
| Coverage / band math (`coverage.ts`) | LIGHTLY | Exercised indirectly by the audit + 3d batteries; no direct unit test of `darknessToCoverage`/`coverageToParams` round-trip. |
| Conversion receipts unified into `__dd_decisionLog` | LIGHTLY | mark-intent battery counts receipts; the live `/canvas` get() was proven once by hand. |
| Placement P-1 (anti-cover landing) | UNTESTED | Built (`DeskPage.tsx ~1102-1135`) but **unlogged** (gap G-7) and never scored against a crowded-desk fixture. |

---

## 7. New in-flight work (shading-fill + shape-assist)

| Surface | Coverage | Notes |
|---|---|---|
| Shade brush (8-band grid, marker accumulation, partial erase) | LIGHTLY | `tools/rockf1/battery.mjs` (write-proofed, Place never clicked). Re-runnable but stages-only. |
| Region Fill / Lasso (tap-fill, gap scrub, chord preview) | LIGHTLY | `tools/rockf2/battery.mjs` — but task #66 (gap-sweep + full per-item + break-on-purpose) is **still in_progress**, so the headline C-shape anti-fixture gate + 0–40px gap sweep are **not yet green**. |
| Tone-fill → 3D `surface-hatch(band)` | UNTESTED | The one-math-two-renderers claim (tone band drives both 2D density and 3D hatch) is never tested across the boundary. |
| Shape Assist (Snap/Straighten, `shapeFit.ts`) | UNTESTED (Rock F3 queued, not built) | No code yet; nothing to test. |

---

## 8. Error / empty / offline states

| State | Coverage | Finding (READ from screenshot) |
|---|---|---|
| **Offline /desk** (backend dead) | UNTESTED → **BROKEN-ish** | states-probe with ALL Supabase traffic aborted: chrome renders, but the status chip is **stuck at "○ CONNECTING"** (never transitions to the "○ Offline" state the code claims), desk body blank, 3 console errors, **no retry affordance.** A judge on a flaky network sees a permanent "Connecting." |
| **Offline /desks gallery** | UNTESTED → **HANG** | Stuck on "Loading the wall…" indefinitely (4s, no transition). The gallery's `.catch()` → friendly-error state **does not fire** when reads are aborted/hang rather than reject fast. Real risk if Supabase auto-pauses (7-day idle clock — named risk R4). |
| Empty desk (0 objects) | UNTESTED | No fixture for a brand-new empty desk; the "what does a first-time empty desk look like" state is unverified. |
| Supabase auto-pause at judging | UNTESTED | Keepalive is a GitHub Action; never verified to have fired. Cross-refs submission-checklist R4. |
| PanelBoundary crash recovery | LIGHTLY | rockB has a `window.__dd_crashPanel` probe per panel; re-runnable but synthetic. |
| Style-engine degrade-to-raw on throw | LIGHTLY | rockB monkeypatch test, one-shot. |
| 64KB over-cap at Place | LIGHTLY | rockB intercept, one-shot. |

---

## 9. Mobile / narrow viewport

**UNTESTED across the board — and the two primary product routes are broken.** Read from route-sweep @390px:

- `/desk` @390: **broken.** Right pen panel takes ~full width; desk canvas is a left-edge sliver; header clusters overlap ("ADD DOODLE" over the wordmark; zoom pills clipped). No collapse, no responsive breakpoint.
- `/canvas` @390: **broken.** Controls panel clipped off the right edge; canvas frame barely visible.
- `/playground` @390: Controls panel clipped (same `CollapsiblePanel` width:360 with no narrow handling).
- `/` home @390: OK (CTAs wrap awkwardly but functional).
- `/desks` @390: OK (single-column card grid responds).

There is **no responsive harness, no touch/pinch test** (pan/zoom is wheel/trackpad only by design — touch-pinch explicitly out of scope, but untested on touch hardware). Demo will be shot on desktop, so this is lower demo-risk but high product-risk for any judge who opens the live URL on a phone.

---

## 10. Accessibility

**UNTESTED.** No axe-core, no keyboard-navigation battery, no contrast assertion anywhere in `tools/**`. aria/role attributes are present in the chrome + interactive DeskDoodles components and `onKeyDown` handlers exist in DrawSurface/DrawPanel/DeskPage/ObjectSurface/Dropdown/CollapsiblePanel — but the marketing/gallery/playground pages have **zero aria-labels** on interactive elements, and full keyboard-only traversal of the create loop, the desk, and the dropdowns has never been driven or asserted.

---

## Where the existing coverage is genuinely strong (don't re-test)

- The 197-shape SVG audit (classifier roles, golden diff, ECE reliability) — the most-tested surface.
- 3D geometry/material/mark-intent **as pure engines** (smoke 48/48, material 72/72, mark-intent 11/11, audit-sweep 197×5).
- Per-Rock create-surface + resilience batteries (re-runnable, write-proofed).
- The ink-black material policy (tan-band gate, per-cell table — this exact gate fell to angle-sampling twice and is now hardened).

The pattern: **engines are tested, integrations are not.** Every gap above lives at a seam between two systems (draw↔convert, record↔desk, client↔client, 2D↔3D, app↔backend) — exactly the seams a demo walks across.

---

## Recommended next-fleet sequence (highest demo-risk first)

1. Build the **real-stroke injection technique** (the prerequisite that unblocks the entire create loop + flip — find how rockf1/f2/smasher inject strokes, generalize it, or add a dev-only `window.__dd_injectStrokes` test hook). Without this, the create loop and the climax stay untestable.
2. **End-to-end flip integration** on a placed desk object (the climax) + mixed 2D/3D desk render.
3. **Offline/hang states** for /desk and /desks (fast-fail + retry + honest copy) — a flaky-network judge is a live failure mode.
4. **Two-real-client realtime arrival** as a repeatable battery (Beat 1b).
5. **Narrow-viewport** responsive pass on /desk + /canvas + /playground.
6. **Finish Rock F2** (region-fill C-shape anti-fixture + gap-sweep — task #66 still open).
7. **SVG sanitize** with the malicious-payload fixture (`edge-case-torture.svg`) wired to an assertion.
8. **a11y** keyboard + axe pass on the create loop and desk.
