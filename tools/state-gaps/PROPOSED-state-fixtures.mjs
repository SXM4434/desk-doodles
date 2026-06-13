// PROPOSED state-coverage fixtures (STUB — not wired, no assertions yet).
//
// Written by the STATE gap-hunt (2026-06-13). These are the app STATES that the
// existing harnesses DON'T cover, expressed as runnable skeletons so a follow-up
// can flesh each into a real assertion. They are deliberately additive to:
//   - tools/desk-robust/gauntlet.mjs   (offline/hang/abort/empty/narrow 820+640/gallery)
//   - tools/gapmap/states-probe.mjs    (offline screenshot grabs)
//   - tools/gapmap/route-sweep.mjs     (every route @1440 + @390 screenshot grab)
//   - tools/gapmap/interaction-probe.mjs (PROBE5 wheel zoom screenshot grab)
//
// What's NEW here (the gaps): true MOBILE 390px on the BROKEN routes with an
// assertion (not a grab), offline→ONLINE recovery repaint, zoom-extreme CLAMP +
// modal-at-zoom + pan-leash CORRECTNESS, POPULATED desk (many objects + 120 cap
// full), LEGACY null-render_config rows, invalid ?desk=N silent-wrong-desk,
// insecure-context crypto throw, /canvas narrow, audit/home/public narrow,
// WebGL-unavailable 3D frame.
//
// Run model mirrors the gauntlet: build → vite preview :4421 → intercept the
// Supabase host to seed each state. None of these write to the live DB.

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('/tmp/dd-pp/node_modules/playwright');
const BASE = process.env.DD_BASE ?? 'http://localhost:4421';

// ── Seed helpers (route-intercept; extend routeEmpty from the gauntlet) ──────

/** Respond to table reads with N synthetic doodle rows so the desk is POPULATED.
 *  Vary render_config: some null (LEGACY rows), some full, to hit both branches. */
function routePopulated(/* page, { n = 60, legacyEvery = 3 } */) {
  // TODO: fulfill GET .../doodles?... with n rows; every legacyEvery-th row has
  // render_config:null + no strokes (the legacy strokeless path). Also fulfill
  // the desks single() with object_count = n so the count chip reads N / cap.
}

/** Respond so the open desk is AT CAP (object_count === object_cap) — the full
 *  desk state (publish should refuse / spawn next; UI count chip "Full"). */
function routeFullDesk(/* page, { cap = 120 } */) {
  // TODO: desks single() → { object_count: cap, object_cap: cap, is_open:false }.
}

// ── GAP 1: TRUE MOBILE 390 on the routes the gap-map flagged BROKEN ──────────
// gauntlet phase 7/8 only narrow-test /desk + /playground at 820 & 640 — never
// 390, and never /canvas. Assert the canvas/desk body is not a clipped sliver.
async function gap_mobile390(page) {
  for (const route of ['/desk', '/canvas', '/playground', '/desks', '/', '/audit', '/public']) {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(BASE + route, { waitUntil: 'domcontentloaded' }).catch(() => {});
    // TODO ASSERT: primary content region (desk canvas / draw frame / card grid)
    // has on-screen width > ~40% of 390 AND no interactive control is positioned
    // off the right edge (boundingBox().x + width <= 390 + slop). Today both
    // /desk and /canvas FAIL this (fixed 280/360 panels + padding:48).
  }
}

// ── GAP 2: offline → ONLINE RECOVERY repaint (not just the drop) ─────────────
// gauntlet phase 5 drops the link; nothing asserts the desk REPAINTS after the
// browser comes back online (the 'online' listener + reloadNonce path).
async function gap_onlineRecovery(/* page */) {
  // TODO: route abort → wait for Offline+Retry → ctx.setOffline(false) +
  // un-route so reads succeed → dispatch 'online' → ASSERT chip flips to Live
  // AND the previously-loaded objects render (no stuck spinner, no blank desk).
}

// ── GAP 3: ZOOM EXTREMES correctness (clamp 25/400 · modal · pan-leash) ──────
// interaction-probe PROBE5 only screenshots a wheel-zoom. No assertion of the
// ZOOM_MIN/ZOOM_MAX clamp, that the % chip stops at 25/400, that a modal opened
// at extreme zoom is UNSCALED + centered, or that the pan-leash keeps the desk
// reachable at min zoom.
async function gap_zoomExtremes(/* page */) {
  // TODO: wheel-zoom past the clamp both ways → ASSERT header % reads "25%" /
  // "400%" and does not exceed. Open Add-doodle at 400% → ASSERT popup bbox is
  // viewport-scale (not 4x). At 25%, drag to a corner → ASSERT Fit recovers and
  // the working area never fully leaves the viewport (PAN_LEASH_PX honored).
}

// ── GAP 4: POPULATED desk (many objects perf + interaction) ──────────────────
// Every desk test runs against an EMPTY or live-incidental desk. The perf alarm
// (drag re-renders ALL N) and the populated render are never driven at scale.
async function gap_populatedDesk(/* page */) {
  // TODO: routePopulated(page, { n: 80 }) → load /desk → ASSERT all 80 render,
  // 0 console errors, and a single drag's pointermove→render budget is bounded
  // (instrument window.__dd perf hook or measure frame time over a drag).
}

// ── GAP 5: FULL desk at cap (120) — the "this desk is full" state ────────────
async function gap_fullDeskCap(/* page */) {
  // TODO: routeFullDesk(page) → /desk → ASSERT count chip shows cap/cap + the
  // full treatment; on /desks the card shows "· Full". Publish-at-cap behavior
  // (RPC spawns next desk) is server-side — assert the UI count math at least.
}

// ── GAP 6: LEGACY rows (null render_config / strokeless) on the desk ─────────
// UX-audit "LEGACY-ROW FREEZE" + the strokeless Re-draw-hidden path are
// source-only. routePopulated with render_config:null rows drives the branch.
async function gap_legacyRows(/* page */) {
  // TODO: seed rows with render_config:null → ASSERT they render (default
  // snapshot, no crash) and that Pen-scope slider moves do NOT restyle them
  // (the freeze). Open one in Edit → ASSERT Re-draw is hidden + honest note.
}

// ── GAP 7: invalid ?desk=N → silent wrong-desk (no signal) ───────────────────
// DeskPage falls back to the open desk when ?desk=N names no real desk, with
// ZERO user signal — a shared link to a deleted/nonexistent desk silently shows
// a different desk.
async function gap_invalidDeskParam(page) {
  await page.goto(BASE + '/desk?desk=99999', { waitUntil: 'domcontentloaded' }).catch(() => {});
  // TODO ASSERT (after deciding the desired behavior with Sebs): either a
  // "that desk doesn't exist — showing the open desk" note, OR a 404-style
  // panel. Today: silently the open desk, indistinguishable from /desk.
}

// ── GAP 8: insecure-context crypto throw (publish + session) ─────────────────
// session.ts crypto.randomUUID() and contentHash.ts crypto.subtle are
// unguarded. On http:// non-localhost / some embed iframes, crypto.subtle is
// undefined → contentHash throws → the publish path crashes (not the soft
// session fallback). Can't fully simulate via playwright flags, but:
async function gap_insecureCryptoNote() {
  // TODO: unit-test contentHash + getSessionId with crypto.subtle / randomUUID
  // stubbed undefined (node harness) → ASSERT a friendly fallback, not a throw.
}

// ── GAP 9: WebGL unavailable / context-loss on the 3D frame ──────────────────
// Stroke3DScene has no webglcontextlost listener and the 3D frame has no
// "3D unavailable on this device" fallback. A blocklisted-WebGL judge gets a
// blank/crashed frame after flipping to 3D.
async function gap_webglUnavailable(/* page */) {
  // TODO: launch with WebGL disabled (chromium arg) → /canvas → draw → flip 3D
  // → ASSERT an honest "3D not available" frame note, not a blank box / crash.
}

void { routePopulated, routeFullDesk, gap_mobile390, gap_onlineRecovery,
  gap_zoomExtremes, gap_populatedDesk, gap_fullDeskCap, gap_legacyRows,
  gap_invalidDeskParam, gap_insecureCryptoNote, gap_webglUnavailable, chromium, BASE };
console.log('PROPOSED state fixtures — stub only. See comments for each gap.');
