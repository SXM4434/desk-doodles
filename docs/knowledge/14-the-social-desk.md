# 14 — The Social Desk: shared desks, the drawer, and where doodles land

**In one sentence:** The social layer is a wall of capped public desks you pan and zoom around, an anonymous identity that's a friendly handle (never a raw UUID), a *drawer* that is a passive cross-desk index (not a stash) where placing a card copies that doodle onto your desk, drag-to-place that drops a copy at the cursor, and smart placement that lands new arrivals in the largest clear region instead of blindly scattering them.

---

## Plain language

### The desk is a place, not a feed

The core object is the **desk**: a warm-paper surface where doodles sit (not float — Comeau-style layered, hue-tinted shadows make them look *placed*). You pan around it (empty-desk drag or two-finger scroll) and zoom 25%–400% (cursor-anchored; the desk metaphor, not Figma's 2%–25,600%). Desk coordinates are camera-independent — drag an object at 212% zoom and the stored x/y match the un-zoomed position exactly (verified vs the live DB: 0.00 delta). The grain zooms with the desk; modals don't.

### Multi-desk — caps and auto-spawn

One unbounded shared feed lags by construction: every doodle is rough.js-heavy (~20–80 DOM nodes), and the browser warns near ~800 nodes. So instead of virtualization, the desk is **hard-capped** (~120 objects) — capping makes the worst case *impossible*, not just deferred (the r/place fixed-grid move). When a desk fills, the next "Done" **auto-spawns desk N+1 server-side** in one transaction, guarded by a partial unique index so exactly one desk is ever open (no client race).

A **gallery** (`/desks`) browses the wall-of-walls: each card shows a real **mini-desk** — the desk's first ~6 doodles scattered on a tiny warm-paper surface (live-capped via `listDoodlesForDesk(id, 6)`, no schema change), not a single-doodle thumbnail. Desks get **deterministic fun names** from Sebs's own well (Tireless Switchback, Golden Hour Cafecito, Ink Stained Sketchbook…) — hashed from the desk index so the same index always yields the same name.

### The drawer — index, not stash (this distinction is load-bearing)

The most-litigated social decision: what is the drawer? The lock is **a passive cross-desk INDEX, not a stash.** It doesn't *hold* your doodles in a separate inventory you move things into and out of — it's a *view* of doodles that already live on desks, surfaced for quick re-placement. Three consequences:

- **It's a 2-column grid of mini collectible cards** (the ObjectCard mini variant — TCG frame, the one "marks" stat, name banner) — which kills the one-row-too-much-scrolling problem.
- **Placing a card = COPYING.** Drag a card onto the desk (or use the Place-here pill), and the doodle is *published as a copy* at the drop point — the original stays where it was. Place is a copy, never a move.
- **Clicking a card opens the FULL detail view** — the same Edit object surface used everywhere (one surface, every context; drawer cards are always yours).

So: index (a view), not stash (an inventory). Place = copy (additive), not move (relocating). Click = full detail (the one surface), not a peek.

### Drag-to-place

You drag a drawer card onto the desk; drop = a copy published at that exact point (`screenToDesk` converts the drop coordinates). The Place-here pill stays as a keyboard/fallback path. The drop animation **reuses** the already-ratified "doodle lands" motion moment — deliberately NOT a third motion family (the desk has exactly two celebrated motion moments, and restraint here is a Sebs-agreed call; a third family would need the identity pass and his explicit ask).

### Friendly handles, never raw UUIDs

Identity is **anonymous by default**: a client-minted localStorage UUID is your session. But you never *see* a UUID — everyone gets a deterministic friendly handle generated from that UUID (adjective + noun, like `@doodled-finch`; "you" for your own). No raw UUIDs anywhere in the UI. The handle is *already yours* with Keep / Reroll / Type-your-own — no email, no password, no gate. (Optional upgrade path, post-makeathon: Supabase anonymous sign-ins preserve `user.id` across an email/OAuth upgrade, so desks carry over with zero merge code — but that's a now-or-later schema decision, not built.)

### Smart placement (P-1) — anti-cover landing

New doodles shouldn't blindly scatter on top of existing ones (which you can't move if they're not yours). Placement is a smart-system decision surface like any other: **signals (existing object bboxes + a density map) → classify (crowded vs clear regions) → treatment (a landing spot + allowable nudge) → render (the scatter).** P-1 lands a new doodle in the **largest clear region** near the lamp-pool center, never more than X% overlapped — replacing blind scatter (this *is* the long-queued "anti-cover validator"). P-2 (spread relax — widen the radius as the desk crowds) and P-3 (learn placement from how people *move* doodles after placing — drag-corrections as labels) are later rungs.

### The object card

When you make an object, the artifact is a **collectible card**, not a feed row (TCG canon — tarot-tall, UI painted onto the art): a graphite name-banner (which doubles as the ML label), the object render as the card art, a one-line why-block, a handle/anon footer, optional stats + rarity stroke. The card is, again, just a *view of the record* — name/why/owner/render are already-stored fields. The mint-only card shine is the one celebratory flourish; the full premium treatment rides the 06-16 identity pass.

---

## The design — why it's built this way

**Why public-anonymous, not private-with-accounts.** An explicit reversal (2026-06-05): anonymous + private = localStorage-only = a blank desk every session = pointless. Real private needs full auth machinery — too heavy for 14 days. Public-anonymous is structurally *simpler* (one table, a session ID, no auth UI), matches the original idea, and gives the Build-in-Public / Community-Favorite prize tracks a living demo.

**Why cap instead of virtualize.** A cap makes the lag impossible up front; virtualization just defers the cost and adds complexity. The cap also gives multi-desk its reason to exist (auto-spawn at the ceiling) and gives the gallery a natural unit (one desk = one card).

**Why the drawer is an index, not a stash.** A stash implies *moving* doodles in and out of an inventory — which creates a "where did my doodle go?" mental-model tax and a sync problem (is it on a desk or in the drawer?). An index sidesteps both: doodles always live on desks; the drawer is a *lens* onto them. Place-as-copy is the honest consequence — you're not relocating the original, you're stamping a new one.

**Why place = copy and click = the one surface.** Copy keeps the social desk additive (placing never disturbs the source). One surface (the same Edit ObjectSurface everywhere) is the nested-modal fix generalized — never a fresh dialog per context, always the single persistent surface keyed to selection (the Figma/tldraw/Excalidraw model). The drawer cards are always *yours*, so clicking them is always Edit (not Sandbox).

**Why reuse the doodle-lands motion for drag-drop.** Restraint (`feedback_push_back_on_overadding`). Two celebrated motion moments is the budget; a third drop-specific family spreads the motion language thin and pre-empts the Day-12/13 identity pass. Reusing the ratified moment keeps the vocabulary tight and consistent — Sebs agreed the framing.

**Why friendly handles and no raw UUIDs.** A UUID in the UI reads as a leak / a bug / a privacy hole. A friendly handle is the Mural pattern (auto-assigned animal handles so everyone has an identity with zero input) — playful, anonymous, and never a gate. It also makes the desk feel *social* (other people's handles) instead of *machine* (other sessions' UUIDs).

**Why smart placement is a smart-system surface, not a layout hack.** Placement is `signals → classify → treatment → render` like every other decision (it even generates labels: P-3 learns from drag-corrections). Treating it as part of the one brain — rather than a one-off scatter function — means it inherits the same dataset, the same receipts, and the same future-model path. (See the [smart/ML ladder page](15-the-smart-ml-ladder.md), Phase P.)

**Why the desk earns warmth, not realism.** Subtle `feTurbulence` paper-grain reads as texture; literal wood-grain or cork reads as a tacky template. Comeau's layered, hue-tinted shadows make objects *sit*. Taste anchors: Paper by FiftyThree, Things 3, riso/letterpress warmth — ink on good paper, never glossy app-chrome. The whole wedge is "the user's hand survives," and a surface that feels like cheap polish betrays it (`feedback_no_cheap_polish` — craft bar holds even on backgrounds).

---

## Technical

All paths under `/Users/sebs/Desktop/Projects/desk-doodles/`. The social slice landed across the multi-desk build, the pan/zoom + Sandbox + social-smalls fleet (`wf_02eb1cdc`), the gallery mini-desks fleet (`wf_c44fa189`), and the round-6 Drawer v2 + DeskPage batch (`37b9bcb`). The Drawer v2 cards/drag and the header craft pass landed in round 6.

### Desk + pan/zoom — `DeskPage.tsx`

- Objects array; drag via the playground pointer pattern; viewport-fit. 25%–400% cursor-anchored zoom, empty-desk drag + 2-finger pan, −/%/+/Fit header pills, Cmd+0 reset. Desk coords camera-independent (verified vs live DB at 212% zoom: 0.00 delta). Modals unscaled; grain zooms with the desk.
- P-1 smart placement: candidate-ring scoring (`DeskPage.tsx:~1102-1135`) — **built but unlogged** (gap G-7; P-1 decisions + first-drag corrections should log `{surface:'placement', …}`).
- D-6 penSnapshot at publish (`~:1140`); the legacy freeze pins null-config rows to DEFAULT (round-6 batch — see the [pen-model page](11-the-pen-model.md)).
- Header craft pass (round 6): one baseline for wordmark/desk-name/count, 12px intra-cluster / 20px inter-cluster rhythm, zoom cluster grouped as one unit, LIVE chip vertically centered, DRAWER toggle in the identity cluster.

### Multi-desk schema + RPCs

- `schema-v2-desks.sql`: `desks` table + one-open-public-desk partial-unique-index + `doodles` gains `desk_id`/`name`/`why`/`render_config` + genesis seed + backfill + `publish_to_open_desk` RPC (server-side cap/spawn; folds in `harden-v1.sql`: drops the wide-open anon DELETE/UPDATE, 64KB svg cap). Cap **~120**.
- `publish.ts`: desk-aware `getOpenDesk` / `listDesks` / `listDoodlesForDesk` / `publishDoodle` (returns `{row, desk}`) / `subscribeDoodlesForDesk` (filters realtime on `desk_id`) + `move_my_doodle` / `delete_my_doodle` SECURITY DEFINER RPCs (scoped mutations replacing the dropped open policies).
- `deskNames.ts`: hero-name well + weighted templates, deterministic by desk index (xmur3 → mulberry32 → `Adjective Noun`).
- Gallery `/desks` (`DeskGallery`): desk cards with name + a real mini-desk (`listDoodlesForDesk(id, 6)` scattered on shared PAPER_GRAIN/WARM_POOL, sanitized, CHIP badges). Home "Browse the wall" → `/desks`.

### Drawer v2 — `DrawerPanel.tsx`

- 2-col grid of mini ObjectCards (TCG frame, one marks stat, name banner) — round-6 build (`37b9bcb`).
- Place = copy: drag a card onto the desk, drop publishes a copy at `screenToDesk(dropPoint)`; Place-here pill = keyboard/fallback path.
- Drop animation reuses the ratified doodle-lands moment (no third motion family).
- Click → the same Edit ObjectSurface (one surface; drawer cards are always yours).
- The #28 copy path is a whole-config endorsement label (gap G-7: should log one line on copy).

### Identity / social smalls

- `session.ts`: client-minted localStorage UUID `dd.session.id`; in-memory fallback for private mode / Make quirks. **No UI ever prints the raw UUID.**
- Friendly handles (`@doodled-finch` style; "you" for own) — deterministic from the session UUID. Publish double-read removed; empty-art guard.
- Sanitize-on-read: `sanitizeSvgMarkup` (DOMPurify SVG profile) applied on read in DeskPage (RLS can't parse SVG, so sanitize-on-read is the enforceable layer).
- STORED-XSS hole closed; `dompurify@^3` (Make-safe pure-JS).

### Object surface / card

- One `activeSurface: { mode, objectId? } | null` slot in DeskPage — Create and Edit/Sandbox structurally can't both be open (nesting impossible by construction).
- Sandbox = nested F3 providers wrap just the card; live controls scoped local; desk byte-identical both directions; reset on close.
- Card = a view of the record's metadata (name/why/owner/render); mint-only shine; full premium treatment rides the 06-16 identity pass.

---

## Connections

- **→ [11-the-pen-model.md](11-the-pen-model.md)** — why the global lens is viewer-local: the desk is SHARED, so a sweep must be private and records sacred. The drawer's place=copy creates a new record. Edge: *the shared surface the lens is held up to, and the records it must never trample*.
- **→ [12-the-creation-loop.md](12-the-creation-loop.md)** — Place is the loop's output landing on the desk; the object card is the minting artifact; naming is the label. Edge: *receives the loop's minted records*.
- **→ [15-the-smart-ml-ladder.md](15-the-smart-ml-ladder.md)** — P-1 placement is a smart-system surface (signals→classify→treatment→render); drag-corrections + copy events are training labels (P-3), currently unlogged (gap G-7). Edge: *placement is one of the smart engine's decision surfaces*.
- **→ [03-the-smart-system.md](03-the-smart-system.md)** — the one brain, one more hand: placement reuses the same engine shape and the same future-model path. Edge: *another consumer of the one engine*.
- **→ [01-what-is-desk-doodles.md](01-what-is-desk-doodles.md)** — "the desk is public" is one of the three founding ideas; this page is its full mechanics. Edge: *expands the public-desk pillar*.
- **→ [08-the-stack.md](08-the-stack.md)** — Supabase (Postgres + RLS + realtime + Storage), the anonymous-session model, the publishable-key-is-safe-by-RLS rule, the no-Rapier physics lock for the eventual desk physics. Edge: *the backend the social desk runs on*.
- **Doc edges:** `docs/design/object-model-and-desk-architecture.md` (the keystone — object-as-record, one surface, multi-desk caps, naming-as-training, identity, desk craft) · `docs/design/smart-system-build-plan.md` Phase P addendum (smart placement) · `SESSION-HANDOFF.md` round-6 Drawer v2 + header craft + drag-to-place specs.

---

## Honest status

**The shipping smart system everywhere is a RULE ENGINE.** The social slice is the most-built area of recent work, but several round-6 specs are queued. Precisely:

### Real in code today (2026-06-12)

- `/desk` fully wired to Supabase: loads the shared feed, auto-publishes every Done, drag-persists position, realtime inserts from other sessions, ●Live/○Connecting/○Offline chip.
- Pan/zoom (25%–400% cursor-anchored), empty-desk drag/scroll pan, header zoom pills, Cmd+0; camera-independent desk coords (DB-verified).
- Multi-desk: `desks` table + cap (~120) + server-side auto-spawn RPC + scoped mutation RPCs; `/desks` gallery with real mini-desks; deterministic desk names.
- Sandbox mode (live local controls on others' objects, writes nothing); the one `activeSurface` slot; object cards (mint shine).
- Friendly handles, no raw UUIDs anywhere; sanitize-on-read XSS closure.
- P-1 candidate-ring placement scoring — **built** (`DeskPage.tsx:~1102-1135`).
- Drawer v2 (2-col mini-cards, drag-to-place=copy, click→Edit surface, reused drop motion) + header craft pass — round-6 (`37b9bcb`).

### Planned / queued (do NOT describe as fully shipped)

- **P-1 placement receipts** — the scoring is live but **unlogged** (gap G-7); placement decisions + first-drag corrections + drawer-copy endorsements are training labels currently discarded. Receipts retrofit recommended 06-13.
- **P-2 spread-relax · P-3 learned placement** — post-makeathon rungs.
- **Anon-auth upgrade** (Supabase `signInAnonymously` → email/OAuth carry-over, real RLS via `auth.uid()`) — a now-or-later schema decision; the localStorage-UUID model ships, the upgrade UI is post-makeathon.
- **Full premium card treatment** (shine/colophon beyond the mint shine) — rides the 06-16 identity pass.
- **Private multiple desks** (`owner_id` filter + "My Desks" switcher) — schema column exists; the switcher UI is queued.
- **Desk physics** (cannon-es bodies on the desk) — deps installed, unwired; the desk is static-placement today.
- **Cached desk-thumbnail column** (`preview_svg` at desk-close, the research's scale answer) — the live-capped mini-desk ships for demo scale; the cached column is post-makeathon.
