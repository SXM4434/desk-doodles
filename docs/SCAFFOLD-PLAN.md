# Personal Space — Scaffold Plan

**Status:** Scaffold + research (R9 "personal space" MVP). NOT a live build — all DB
migrations are artifacts, all client code is behind a feature flag, nothing
mutates the live shared Supabase database. Built by the personal-space stream
(agent af1ef603) in an isolated worktree.

**Goal (Sebs locked, FULL-feature MVP):** every visitor gets a **private desk** +
a **per-person drawer**, reached via a friendly **onboarding** flow (auto-generated
handle with Keep / Reroll / Type-your-own; anonymous-auth now, swappable to real
auth later for proper RLS).

This plan is the bridge between the design synthesis in
`docs/design/object-model-and-desk-architecture.md` (§"Optional identity",
§"Multi-desk", §"Private multiple desks") and the concrete files scaffolded here.

---

## Architecture at a glance

```
ONBOARDING (first run, flagged)
  OnboardingFlow.tsx  ──claim_handle()──▶  profiles table  (handle uniqueness)
        │
        ▼ handle settled (Keep / Reroll / Type)
PERSONAL SPACE (left drawer panel, flagged)
  PersonalDrawer.tsx
    ├─ MY DESKS   ──create_private_desk()──▶ desks (owner_id = me, negative index)
    └─ MY DRAWER  ──stash_to_drawer() / place_from_drawer()──▶ doodles (owner_id = me, desk_id null)

IDENTITY (the swap point)
  lib/session.ts  getSessionId()  ── localStorage UUID today
                                  ── supabase.auth.signInAnonymously().user.id  AFTER the swap
  → owner_id / session_id are keyed off this → RLS becomes real (auth.uid())
```

### The keystone decision: anonymous-auth, swappable

Identity today is a client-minted localStorage UUID (`lib/session.ts`). That can't
be RLS-enforced — every request hits the DB as the same `anon` role, so "only
touch your own rows" is honor-system (scoped client-side in `lib/publish.ts`).

The path forward (object-model doc §"Optional identity"; Supabase docs):

1. **Supabase anonymous sign-ins** mint a *real* auth user (role `authenticated`,
   `is_anonymous=true` claim). `auth.uid()` becomes a trusted server value, so
   `using ((select auth.uid())::text = owner_id)` is REAL enforcement.
2. The **same `user.id` is preserved** when an anonymous user upgrades to permanent
   (`updateUser({ email })` magic-link, or `linkIdentity({ provider })` OAuth) — so
   every private desk + drawer item keyed to that id carries over to a real account
   with **zero merge code**.
3. The SDK persists the anon session in localStorage, so "never blank, no wall"
   (the reason we rejected anonymous-private in the first place) is preserved.

**The single swap** (`lib/personalSpace.ts` `getIdentityId()` documents it): make
`getSessionId()` return `supabase.auth.signInAnonymously().user.id`. Migration
0002 then flips RLS from honor-system to `auth.uid()`-scoped. Do it now (small) and
RLS becomes real + the upgrade is free; do it later and you inherit a one-time
localStorage-UUID → auth-uid migration.

---

## The SQL migrations (artifacts — DO NOT APPLY yet)

Live as numbered files under `supabase/migrations/`. Apply order:
`schema.sql` → `schema-v2-desks.sql` → `schema-v3-rls.sql` → **0001 → 0002 → 0003**.
Review with Sebs first; the anon-auth swap (0002) is the one pre-launch identity
decision.

| File | What it adds |
|---|---|
| `0001_personal_space_profiles.sql` | `profiles` table (handle + source + optional avatar SVG); **case-insensitive unique** index on handle; `claim_handle()` RPC (atomic, collision-safe, returns taken/claimed); RLS public-read, RPC-only write (honor-system era). |
| `0002_anon_auth_owner_scoped_rls.sql` | The "make policies REAL" migration. Assumes the anon-auth swap is live. Real owner-scoped RLS on `profiles` + `doodles` (`(select auth.uid())::text = …`, `to authenticated`, `with check` on insert/update); re-points `claim_handle` + the move/delete/meta RPCs at `auth.uid()`. |
| `0003_private_desks_and_drawer.sql` | `doodles.owner_id` column (+ partial drawer index); desks SELECT becomes **public-or-own** (private desks are genuinely private); `create_private_desk()` (per-owner **negative** desk_index, collision-free with the public 0,1,2… pool + exempt from the one-open-public unique index); `stash_to_drawer()`, `place_from_drawer()`. |

### RLS choices (cited, see Research)

- **`(select auth.uid())`** wrapping → Postgres runs it once per statement
  (initPlan cache), not per row.
- **`to authenticated`** on every write policy → execution stops before the row
  check for anon-key-only requests (post-swap, those shouldn't write directly).
- **`with check`** on insert/update → a user can't set `owner_id`/`session_id` to
  someone else's id (ownership theft).
- **Indexes** on every policy column — `desks_owner_id_idx`, `doodles_session_id_idx`
  (v2) + `doodles_owner_id_idx` + partial `doodles_drawer_idx` (0003).
- **Private desks via negative `desk_index`** so the global unique index + the
  partial "one open public desk" index (scoped `owner_id IS NULL`) are untouched.

### Handle uniqueness / collision handling

- DB: case-insensitive unique index is the authority; `claim_handle()` returns
  `false` when a handle is owned by another id.
- Client (`lib/handle.ts`): generate adjective+noun (haikunator pattern, 256 base
  combos); on a `taken` result, `appendToken()` adds a short numeric suffix
  (`doodled-finch` → `doodled-finch-7`) and retries up to 3×, then surfaces a
  "try Reroll" note. Reroll is intentionally random; the deterministic
  `handleFromId()` is the always-available fallback so the UI is never empty.

---

## The client scaffold (new files)

| File | Role |
|---|---|
| `src/app/lib/handle.ts` | Friendly-handle generation + normalization. `handleFromId` (deterministic), `randomHandle` (reroll), `appendToken`/`stripToken` (collision), `normalizeHandle`/`isValidHandle`/`handleError` (Type-your-own), `displayHandle` (`@…`). |
| `src/app/lib/personalSpace.ts` | Data layer over the migrations' RPCs — profiles, private desks, drawer. **`isPersonalSpaceEnabled()` feature flag** (env `VITE_PERSONAL_SPACE=1`, default OFF). **`getIdentityId()`** = the single anon-auth swap point. Graceful fallback on a pre-migration DB (every call returns null/[]/false, never crashes). |
| `src/app/components/DeskDoodles/OnboardingFlow.tsx` | "Claim your space" first-run overlay. Pre-filled handle + **Keep / Reroll / Type-your-own** + **Skip for now** (invitational, never a gate). framer-motion entrance, paper-grain wash, craft-bar chrome (PILL/CTA/RAISED_SHADOW). Writes the `dd.onboarded` localStorage marker on settle. |
| `src/app/components/DeskDoodles/PersonalDrawer.tsx` | The per-person drawer panel content — **My desks** (private desk switcher + New) and **My drawer** (saved doodles as `ObjectCard mini` with "Place here"). Designed to be the inner content of a left `CollapsiblePanel` the host owns. |

All four are dormant until the flag flips — `tsc --noEmit` is green with the flag off.

---

## DeskPage integration (the only edit to an existing component)

Kept minimal + clearly marked (every block tagged `// PERSONAL-SPACE`) because
another stream may also touch `DeskPage.tsx`. Five additive edits, all gated on
`personalOn = isPersonalSpaceEnabled()`:

1. **Imports** — `isPersonalSpaceEnabled`, `OnboardingFlow` + `hasOnboarded`,
   `PersonalDrawer`.
2. **State hook** (next to the existing panel state) — `personalOn`,
   `drawerOpen`/`toggleDrawer` (`usePanelOpen('desk.drawer')` + `useMinimizeUi`),
   `showOnboarding` (init `personalOn && !hasOnboarded()`).
3. **Header toggle** — a `PanelToggle side="left" label="Your space"` before the
   Controls toggle (toggles always in chrome).
4. **Left drawer panel** — a `CollapsiblePanel side="left" width={300}` wrapping
   `<PersonalDrawer>` inserted before `<main>` in the body. Wired:
   `currentDeskId={desk?.id ?? openDeskId}`, `onViewDesk={loadDeskView}`,
   `onPlaced` (adds the placed row to the desk via the existing `rowToObject`),
   `onEditHandle` (re-opens onboarding).
5. **Onboarding mount** — `{personalOn && showOnboarding && <OnboardingFlow …/>}`
   near the DrawPanel/ObjectSurface mounts.

With the flag OFF (default), every one of these is `false &&` / `personalOn &&` —
zero behavioural change to the current desk.

---

## What's left to wire (the honest TODO)

**To turn it on (Sebs + a session):**
1. Review the three migrations with Sebs; apply `0001` (+ `0003` if staying
   honor-system) to the live DB via the Supabase SQL Editor.
2. **Decide the anon-auth swap** (object-model doc Q3). If yes: change
   `lib/session.ts` `getSessionId()` to await `supabase.auth.signInAnonymously()`
   and return `user.id` (note: it becomes async — `getIdentityId()` + callers may
   need an await/bootstrap; today everything calls it synchronously, so this is
   the one real refactor the swap costs). Then apply migration `0002`.
3. Set `VITE_PERSONAL_SPACE=1` (`.env.local` + Make env) to flip the flag.

**Build work still open (beyond the flag flip):**
- **Stash-to-drawer entry point.** `DrawPanel`/the Add-doodle flow has a "publish to
  desk" path; it needs a sibling "stash to drawer" action wired to
  `personalSpace.stashToDrawer()`. (Lives in another stream's file — DrawSurface/
  DrawPanel — so left as an integration point, not edited here.)
- **Private-desk publish routing.** When viewing a private desk, `addObject` should
  publish onto *that* desk (owner-scoped) rather than the open public desk. Today
  `publishDoodle` always routes to the open public desk via the RPC; a
  `publishToPrivateDesk(deskId, …)` helper (mirror of `stash_to_drawer` but with a
  `desk_id`) is the clean addition.
- **Async identity bootstrap** if the anon-auth swap lands — a top-level
  `await ensureSession()` before first render so `auth.uid()` exists for the first
  query.
- **Handle on the ObjectCard footer** — `ObjectCard.tsx` already derives a handle
  inline; once `profiles` is live, swap its `ownerLabel` to read the *claimed*
  handle from `profiles` (via a small `getProfile` cache). (ObjectCard is in
  another stream's lane right now — left as a note.)
- **`pick-a-mark` avatar** (`profiles.avatar_svg`) — column + RPC support exist;
  the draw-a-tiny-mark UI is post-MVP polish.

**Genuinely post-makeathon:** OAuth manual-linking config
(`GOTRUE_SECURITY_MANUAL_LINKING_ENABLED`), multi-device email-collision merge,
CAPTCHA/Turnstile abuse hardening (anon sign-ins are rate-limited 30/hr/IP), the
"claim this account" upgrade UI.

---

## Security / DB-safety notes

- **No live mutation.** Every migration is an artifact under `supabase/migrations/`;
  nothing in this stream runs `supabase db push`/`reset` or applies SQL.
- **Feature flag default OFF.** The client layer never calls the live DB until
  `VITE_PERSONAL_SPACE=1` AND the migrations are applied.
- **Secret keys stay server-side.** Nothing here adds a `VITE_`-prefixed secret.
  The Supabase publishable key is client-safe by design (RLS gates access);
  FAL/TRIPO/QUIVER/service-role keys are NEVER client-side / NEVER `VITE_`-prefixed
  (they belong in Supabase Edge Function secrets). Anon-auth uses the same
  publishable key — no new secret.
- **Honor-system is explicit.** Until the anon-auth swap, `claim_handle` and the
  private-desk/drawer RPCs trust the passed id (same honor-system as the existing
  `publish_to_open_desk`). Migration 0002 closes this by switching to `auth.uid()`.

---

## Research findings + citations

**Supabase anonymous sign-ins → permanent upgrade**
- `signInAnonymously()` mints a real auth user (role `authenticated`,
  `is_anonymous=true` JWT claim). The SDK persists the session client-side.
- Convert to permanent via `updateUser({ email })` (magic-link) or
  `linkIdentity({ provider })` (OAuth, needs manual linking enabled). **`user.id`
  is preserved**, so id-keyed data carries over with no merge code.
- RLS can distinguish anon vs permanent:
  `(select (auth.jwt()->>'is_anonymous')::boolean) is false` (use `restrictive`
  policies to enforce reliably). Rate limit: **30 anon sign-ins / hour / IP**;
  Supabase recommends invisible CAPTCHA / Cloudflare Turnstile.
  — https://supabase.com/docs/guides/auth/auth-anonymous

**Owner-scoped RLS best practice**
- Wrap `auth.uid()` as `(select auth.uid())` → initPlan-cached once per statement
  (vs per-row) for performance.
- Always scope `to authenticated` (stops execution before the row check for anon).
- Index every column referenced in a policy (seq-scan without it; 50ms vs 2ms on
  10k rows, times out at 1M).
- INSERT/UPDATE without `with check` = ownership-theft hole.
  — https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv
  — https://supabase.com/docs/guides/database/postgres/row-level-security

**Friendly-handle generation + collision handling**
- Haikunator (Heroku-style adjective+noun, optional numeric token): default ~8645
  combos; collisions handled by appending/lengthening the token, or token-free for
  shorter handles. The adjective-noun-token shape is the precedent we follow.
  — https://github.com/ouvrages/haikunator · https://www.npmjs.com/package/haikunator

**Onboarding "claim your space" UX**
- Minimize input to the aha-moment; every extra step raises drop-off → the handle
  is pre-filled + valid so the zero-effort path is one click (Keep).
  — https://www.uxdesigninstitute.com/blog/ux-onboarding-best-practices-guide/
  — https://userpilot.com/blog/user-onboarding-best-practices/
- Auto-assigned friendly handles with zero input (the Mural pattern — anonymous
  collaborators get an animal name; FigJam is the criticized counter-example that
  demands an account) → identity is invitational, never a gate; "Skip for now"
  keeps the generated handle.
  — https://forum.figma.com/suggest-a-feature-11/allow-for-guest-collaborators-13521

**Design synthesis (this repo)**
- `docs/design/object-model-and-desk-architecture.md` — §"Optional identity"
  (Layer 1 generated handle Keep/Reroll/Type; Layer 2 anon-auth upgrade; the one
  pre-launch swap decision), §"Multi-desk" + §"Private multiple desks" (same
  `desks` table keyed to `owner_id`; works for anonymous users; no login required).
