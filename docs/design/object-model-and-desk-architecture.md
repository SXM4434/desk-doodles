# Object Model & Desk Architecture

**Status:** Design synthesis (research-backed, no code yet) · Day 10–11 of the makeathon
**For:** the desk flow — `/desk` (DeskPage), the draw popup (DrawPanel), Supabase persistence, identity, multi-desk
**Synthesizes:** four research findings (object surface · identity · multi-desk · card+craft) into one architecture
**Reads against real code:** `src/app/components/DeskDoodles/DeskPage.tsx`, `DrawPanel.tsx`, `DrawSurface.tsx`, `src/app/lib/session.ts`, `src/app/lib/publish.ts`, `supabase/schema.sql`

---

## The keystone

Today a desk object is a **blob**: one SVG markup string, plus where it sits (`x`, `y`, `rotation`) and which session published it. That's the whole record (`supabase/schema.sql`: `svg`, `content_hash`, `x`, `y`, `rotation`, `session_id`). Everything you can do with it is "drag it around."

The keystone move — the one idea everything else hangs off — is to stop treating the object as a bare SVG blob and start treating it as a **rich record**. In your terms: it's the difference between a flattened bitmap and a layered file with the layers still live. A blob is baked; a record keeps the ingredients.

A rich object record carries three things the blob doesn't:

| Part of the record | What it is | Anchor |
|---|---|---|
| **Render config** | The Smart Hachure style + modifier values this object was drawn/published with (style, fillStyle, wobble, multi-stroke, palette…). | This is its *layer style* — re-applyable, not baked into pixels. |
| **Metadata** | `name`, `why` (one line: why you made it), `owner` (session/handle), `created_at`, rarity. | This is the *label track* — human-readable, and doubles as ML training data (see §3). |
| **Source strokes** | The raw points you drew, kept alongside the rendered markup. | This is the *editable original* — today's pipeline throws these away at Done (`DrawSurface`), which is why real edit-after-place is a real slice, not a small. |

Once the object is a record, **every feature in this doc is just a different VIEW of the same record**:

- The **draw popup** is a view that *creates* a record.
- The **inspect/sandbox panel** is a view that *reads* a record and re-renders it through different config.
- The **object card** is a view that *displays* the record's metadata as a collectible.
- The **desk** is a view that *lays out* records in space.
- A **multi-desk gallery** is a view that *groups* records by which desk they live on.

That's the unifying frame. Build the record once; the rest are views. The current `DeskObject` interface (`{ id, dbId, svgMarkup, x, y, rotation }` in `DeskPage.tsx`) is the blob version — the work below grows it into the record version, one field at a time, without rewriting the desk.

This also slots cleanly into the **locked plan's global-vs-object scope**. The makeathon plan already specs a viewer-controlled re-render of *cached* doodles: S12 (Unify toggle — global pickers snap every object to one baseline and twist them together) and S13 (Path-B partial-toggle — per-doodle "this applies to me / not to me" indicators). Both of those *assume* an object whose render config can be re-applied on demand without re-generating it. The rich record is exactly the data shape S12/S13 need. We're not inventing scope — we're naming the record those locked features already require (`docs/locked-refs/F3-smart-hachure-system/makeathon-plan.md` §S12, §S13).

---

## The one object surface (modes, never nested popups)

**Hard constraint:** never nest a modal inside a modal. The canonical fix across the whole UX literature is *one* surface that morphs by context, not three surfaces that stack. Figma's right sidebar, tldraw's inspector, Excalidraw's LayerUI — all use **one persistent panel keyed to the current selection**, never a fresh dialog spawned per object [Figma; tldraw; Excalidraw]. A modal-within-modal is sanctioned only for a destructive double-confirm (e.g. "really delete?") — never for switching *what you're editing* [nested-modal anti-pattern refs].

So the object surface is **one component, three modes**. Not tabs, not three modals. We evolve the existing `DrawPanel.tsx` (already a real modal: `role="dialog"`, `aria-modal="true"`, scrim at `zIndex 300`, click-outside + Escape cancel) into the single object-interaction surface, taking a `mode` prop plus an optional `sourceObject`.

Why morph and not tab: the three modes are **mutually-exclusive ownership contexts** (who owns the object), not parallel views of one object. You never flip Create ↔ Sandbox on the same item, so tabs are the wrong mental model. The "morphing controls" pattern is the right one — keep the shell *visually identical* (same chrome, same position), and change only the label / banner / color so it reads as *one surface in a different mode*, not a different app [morphing-controls pattern].

What stays the same across all three modes: the scrim, the dialog frame, Escape-to-close, click-outside-to-close. What **morphs** is only the **header region** and the **footer action set**:

| Mode | When | Header morphs to | Body | Footer action | Result |
|---|---|---|---|---|---|
| **Create** | "Add doodle" pressed (no source object) | Blank title | DrawSurface + input-mode pills (Draw / Upload SVG / Upload image) — the *capture* surface | **Cancel** · **Done** | Adds a NEW object to the desk (today's `onDone` path) |
| **Inspect / Edit** | Click an object you own (`obj.session_id === getSessionId()`) | Your object's info card (name / why / when) | Object preview + the style/modifier controls applied to *this one object* | **Cancel** · **Save** | Persists changes to your row (needs source-stroke retention — real slice) |
| **Sandbox** | Click someone else's object (`session_id` ≠ yours) | Their info card + a persistent **"Sandbox — changes won't be saved"** banner | Object preview + full live 2D/3D controls re-rendering *their* markup through *your* chosen config | **✕ Discard** · *(opt.)* **Remix as mine** | ✕ throws away your local edits; their DB row is untouched. Remix forks it into a NEW owned object. |

**Create vs Edit/Sandbox diverge on one axis: capture-first vs object-first.** Create starts blank and *captures* (draw/upload) — controls are optional. Edit/Sandbox start from an *existing* record — the object is already there, so the controls are primary and there's no blank canvas (adding strokes to an existing object is a later slice). `DrawSurface` already proves a single surface can morph by a state flag (its committed/Done/Edit/Reopen pills flip the in-frame chrome) — that's the in-component precedent for "one surface, flag flips the chrome."

**Sandbox is not "disabled" and not "read-only."** The controls are fully live — you *can* drag every slider. It's an **ephemeral, unsaved-scope** edit. Signpost the *why* of that scope with three things [Carbon/Cloudscape read-only-vs-disabled guidance]: (1) the persistent banner in the header, (2) the primary action labeled to match the outcome (**Discard**, not Save), (3) a distinct frame treatment (e.g. dashed/tinted edge) so it never looks like your own editable object.

**Enforce "never nested" at the STATE layer, not by discipline.** `DeskPage` holds a single piece of state — `activeSurface: { mode, objectId? } | null`. Because there's one slot, Create and Inspect/Sandbox **structurally cannot** both be open. Nesting becomes impossible by construction, not by being careful.

**The global SmartHachureChrome stays a sibling, never a child.** Today `SmartHachureChrome` lives in a right `CollapsiblePanel` and restyles the *whole desk* (`DeskPage.tsx`). That's the Figma/tldraw "persistent inspector keyed to context" model, and it must stay a **persistent sibling** of the object surface — never stacked underneath the modal. Whole-desk restyle (the global picker) and one-object inspect (the morphing panel) are two inspectors at two scopes, side by side. This is the same global-vs-object split the plan draws between S12's *global* pickers and a per-object surface (`makeathon-plan.md` §S12/§S13).

**Per-object quick actions stay lightweight.** Open / delete / remix want a small, trivially-dismissible affordance (click empty desk or Escape to clear it) — *not* a heavy floating toolbar. Miro's floating toolbar is the cautionary case: users beg to pin/dock/hide it because it blocks the view and follows them around [Miro]. Deep controls belong in the morphing panel; the selection affordance is just the three quick verbs.

**Ship order:** Sandbox first. It only re-renders *existing* markup through viewer-chosen config and then discards — the exact mechanism S12 already specs (`makeathon-plan.md` §S12), and the lowest-risk of the three because it writes nothing. Edit comes second, once source-stroke retention lands.

---

## The object card + naming-as-training

When you make an object, the satisfying artifact isn't a row in a feed — it's a **collectible card**. Two cheap psychology levers make this land:

- **Naming-as-labeling.** Von Ahn's ESP Game proved that accurate labels fall out as a *byproduct of play* — players label images because labeling *is* the game [ESP game]. Apply it directly: the object's **NAME is the ML label**. When you name your doodle "coffee mug," you've just hand-labeled a training example for the classifier — but it feels like christening your creation, not filling a form. Hide the labeling inside the play.
- **Make a collectible, not a form.** The IKEA effect: people value self-made things ~63% higher [IKEA effect]. Lean into it — ask "why this object?" right after creation (Duolingo-style why-priming), and the one-line `why` becomes part of the record *and* deepens attachment.

**Card layout** (TCG canon — tarot-tall, big and bold, UI painted onto the art):

- A graphite **name-banner** across the card — this doubles as the ML label.
- The **object render** is the card art (the same SVG markup, same `SvgStyleTransform` pipeline).
- A capped **why-block** (one line, truncated).
- A **handle-or-anon footer** (the owner — see §5).
- *Optional* Pokédex-style hex-radar stats and a rarity stroke.
- **Rule: never label a control as if it were metadata** — the card displays the record; it doesn't become a settings panel.

The card is, again, just a **view of the record** — name/why/owner/render are fields we're already storing. No new capability; it's a presentation layer over §1's record.

---

## Multi-desk: caps, spawning, gallery, fun names

**The problem caps solve.** Today it's one flat `doodles` table feeding one desk. Every object is rough.js-heavy (≈20–80 DOM nodes each), and Lighthouse warns as the DOM nears ~800 nodes [Lighthouse dom-size]. An unbounded shared feed therefore *lags by construction* the moment it gets popular. The fix isn't virtualization — it's a **hard cap per desk**, which bounds cost up front the way r/place bounded itself with a fixed grid [r/place]. Capping beats virtualization here because it makes the worst case *impossible*, not just deferred.

**The capped-public-desk model:**

- **Cap ≈ 50 objects per public desk** (50 × 20–80 nodes stays well under the Lighthouse warn line). Final number is an open question (§8).
- **Auto-spawn at the cap, server-side.** When desk N fills, the next "Done" opens desk N+1 in one transaction (an RPC), guarded by a **unique `desk_index`** and a **partial unique index on `is_open`** so exactly one desk is ever open. No client race.
- **Gallery to browse past desks** — a newest-first grid of desk cards + a recents strip. Keep it simple.
- **Cache a desk thumbnail at desk-close** (`preview_svg` on the desk row) so the gallery never pays the rough.js render cost to show a filled desk.

**Schema changes** (additive — a data-model change, not an architecture change):

```
-- new table
desks (
  id          uuid pk,
  desk_index  int unique,        -- drives the deterministic name + spawn ordering
  name        text,              -- generated + STORED at creation (see below)
  object_cap  int default 50,
  object_count int,
  is_open     bool,              -- partial unique index: only one open desk
  preview_svg text,              -- thumbnail cached at desk-close
  created_at  timestamptz
)

-- doodles gains:
doodles.desk_id  uuid references desks(id)   -- backfill existing rows to a genesis desk
```

`publish.ts` grows `listDoodlesForDesk`, `listDesks`, `getOpenDesk`, and the realtime subscription filters on `desk_id` (so you only get live inserts for the desk you're looking at, not the whole world).

**Deterministic fun names.** Hash `desk_index` with `xmur3` → seed `mulberry32` → pick `Adjective Noun` from Sebs-themed pools [bryc PRNGs; haikunator/docker-name-generator precedent]. Deterministic means *same index always yields the same name* (no collisions to manage, regenerable, and you can store it once on the row). ~30 seed names from your own well — XC/long-haul, coastal Long Island, Medellín/cafecito, sketchbook/craft:

> Tireless Switchback · Salt Air Boardwalk · Golden Hour Cafecito · Ink Stained Sketchbook · Long Haul Ridge · Paciente Sobremesa · Sun Warmed Arepa · Dog Eared Margin · Mountain Born Teleférico · Restless Long Island · Quiet Graphite Morning · Second Wind Mile · Warm Riso Press · Tidewater Sketch · Sobremesa Sunset · Marker Smudge Monday · Trailhead Daybreak · Carbon Paper Dream · Cobblestone Comuna · Field Notes Friday · Overcast Harbor · Felt Tip Frontier · Slow Burn Ridge · Paper Grain Dawn · Cafecito Con Leche · Switchback Shadow · Tide Chart Tuesday · Borrowed Compass · Ridgeline Riso · Loose Leaf Legend

**Private multiple desks** ride the *same* `desks` table — just keyed to your identity (`owner_id`) instead of the public pool, plus a small board switcher in chrome. Excalidraw/tldraw users actively request exactly this (a dashboard/list of canvases to create/rename/delete), and community forks prove the demand [Excalidraw multi-canvas issue; excalidraw-multi-tabs]. It works for anonymous users too — desks keyed to the anon id — so **multiple private desks does NOT require login.** It's the same table, a different `owner_id` filter, and a switcher.

---

## Optional, fun, skippable identity

**The good pattern is already half-built.** Excalidraw and tldraw open straight to a blank canvas — no signup, no email popup, full functionality anonymous [Excalidraw no-login; tldraw review]. FigJam is the *counter*-example (wants your account) and gets criticized for it. Desk Doodles' session-id model (`session.ts` — a client-minted localStorage UUID) already matches the good pattern. **The profile must stay strictly additive and skippable — never a gate.**

**Layer 1 — playful optional handle (genuinely quick, client-side).** On first session, *deterministically generate* a friendly handle from the existing `dd.session.id` UUID — adjective+noun like "Wobbly Marker" (same seeded-PRNG trick as the desk names). Show it as *already yours* with **Keep / Reroll / Type-your-own**. No email, no password, no form. This is the Mural pattern (auto-assigned animal handles so everyone has a friendly identity with zero input) [FigJam/Mural anonymous handles]. Skip = you stay the generated handle and still own your session-desk.

**Layer 1, variant — pick-a-mark avatar.** Instead of an uploaded photo, your identity mark is a *tiny doodle* drawn in the same DrawPanel, rendered through the same `SvgStyleTransform` pipeline, stored as a small inline SVG string on the profile. Reuses 100% of existing primitives — no new capability.

**Layer 2 — the real-account upgrade (no passwords on us).** Supabase **anonymous sign-ins** are the purpose-built mechanism, and the schema already names them as upgrade option (b) (`schema.sql` v1 TRUST MODEL block). `signInAnonymously()` mints a *real* auth user (role `authenticated`, `is_anonymous=true` claim). Later, `updateUser({ email })` (magic-link) or `linkIdentity({ provider: 'google' })` (OAuth) converts that *same* user to permanent — **Supabase preserves `user.id` across the upgrade**, so every desk and doodle keyed to `auth.uid()` carries over with **zero merge code** [Supabase anonymous auth]. No password handling on our side.

**The one decision to make BEFORE launch.** Today's canonical identity is a hand-minted localStorage UUID (`session.ts`), *not* a Supabase `auth.uid()`. The free carry-over only happens if rows are keyed to a Supabase anonymous-auth user. So:

| When you swap to anon-auth | Cost |
|---|---|
| **Now (before launch)** | Small — one lib swap: `session.ts` returns `supabase.auth.signInAnonymously().user.id` (the SDK still persists it in localStorage, so "never blank, no wall" is preserved), and key `session_id`/`owner_id` off `auth.uid()`. |
| **After launch** | A one-time data migration mapping old localStorage UUIDs → new auth uids. |

Make the swap now and two things get *strictly better* for free: (1) RLS mutation policies become **real** — `using (session_id = auth.uid())` replaces today's honor-system `using (true)`, deleting the security-theater caveat in `schema.sql`; (2) the "claim this identity" button later just calls `updateUser`/`linkIdentity` and everything carries over. This is the single pre-makeathon decision if the upgrade is wanted in scope.

**Honesty check.** The fun handle/mark and multiple desks are quick *and* true. The upgrade is quick **only if** you swap to anon-auth now; otherwise the upgrade still works but you inherit a migration. Genuinely **post-makeathon**: OAuth manual-linking config (`GOTRUE_SECURITY_MANUAL_LINKING_ENABLED`), multi-device email-collision merge (Supabase returns an obfuscated response on collision — needs a real "email already has an account" branch), and CAPTCHA/Turnstile abuse hardening (anon sign-ins are rate-limited 30/hr/IP; Turnstile pairs with the Day-13 vision-router moderation call) [Supabase anonymous auth; identity linking].

---

## The desk as a crafted surface

The desk is where the objects *live* — and warmth here is the difference between "a feed with a skin" and "a place you made things." The bar is **craft, not cheap polish**:

- **Warmth, not realism.** A subtle `feTurbulence` `fractalNoise` paper-grain (baseFrequency ~0.6–0.9) reads as *texture*. **Never** literal wood-grain or cork — that's the tacky failure mode that makes the whole thing read as a template.
- **Objects that sit, not float.** Comeau's layered shadows: light from above-left, ~2:1 offset, *stacked* shadows of decreasing opacity, **hue-tinted not pure black**, with a tight contact shadow plus a soft ambient one. That combination is what makes an object look placed on a surface rather than pasted over it [Comeau shadows].
- **Taste anchors:** Paper by FiftyThree, Things 3, riso/letterpress warmth — soft, tactile, ink-on-good-paper, not glossy app-chrome.

The desk surface is also a *view of records* (§1) — it lays the objects out in space; the grain + shadow treatment is the frame they sit in.

---

## What is quick vs what is the craft work

**Honest split.** Most of the *components* here are genuinely quick because the record already exists or nearly does:

| Piece | Why it's quick |
|---|---|
| Per-object style/config | A column on the record + a snapshot of the current chrome values. |
| Object card | A *view* of the record's metadata (§3) — presentation only. |
| Sandbox mode | Throwaway local override state re-rendering existing markup; writes nothing (§2). |
| Multi-desk | `desk_id` FK + a cap + a spawn RPC (§4) — additive data model. |
| Fun names + handles | One deterministic generator, reused for both (§4, §5). |

**The hard part is the one you named: the intentional FLOW.** Not the parts — the *feel*. How the morphing panel transitions between modes so it reads as one surface (§2). How optional identity feels invitational and never gate-like (§5). How an object getting *created* feels like minting a collectible, not submitting a form (§3). How the desk feels like a *place* (§6). The components are quick; **the flow is the craft work, and craft is non-negotiable** — this product's whole wedge is "the user's hand survives," and a flow that feels like cheap polish betrays that wedge. (Memory: `feedback` — no cheap polish; craft bar holds.)

**Makeathon-feasible build order:**

1. Grow the record (add the config snapshot + name/why columns; keep blob rendering working).
2. Object surface, **Sandbox mode first** (re-render only, lowest risk) — proves the morphing shell.
3. Per-object inspect + lightweight quick-actions (open/delete/remix); wire the `activeSurface` single-slot state.
4. Object card view + naming-as-label.
5. Multi-desk cap + auto-spawn + gallery (if time before demo).
6. Optional identity Layer 1 (generated handle, Keep/Reroll/Type) + desk-surface craft pass.

**Genuinely post-makeathon:** source-stroke retention → true Edit-with-strokes; the anon-auth → real-account *upgrade UI* (the swap itself is a now-decision, the claim button is later); OAuth manual-linking + multi-device merge; CAPTCHA/Turnstile hardening; the S13 per-doodle "applies to me / not to me" partial-toggle affordance.

---

## Open questions for Sebs

1. **Object cap number.** 50 is the research-backed default (Lighthouse headroom), but it's *your* density call — does a 50-object public desk feel full, sparse, or cramped at demo scale?
2. **Edit needs stroke-retention-at-publish.** Real Edit-after-place requires keeping source strokes *alongside* the rendered markup (today they're discarded at Done). Do we add stroke retention now (so Edit ships this cycle) or ship Sandbox-only and defer Edit?
3. **The anon-auth swap — now or after?** Make `session.ts` return `supabase.auth.signInAnonymously().user.id` before launch (small now, real RLS, free upgrade later) — or keep the localStorage UUID and accept a one-time migration if you ever want the upgrade? This is the single pre-makeathon identity decision.
4. **How does fun-identity LOOK?** Generated handle as a quiet chip vs a playful first-run "meet your marker" moment? Pick-a-mark doodle in scope for the demo, or Layer-1-handle-only?
5. **When does multi-desk land — in the demo or after?** Capped public desk + gallery is a strong feed-comparison moment (pairs with S12's Unify demo), but it's also the largest §4 chunk. Demo headline, or post-makeathon?
6. **Quick-action affordance shape.** Lightweight selection chip (open/delete/remix) on object click — confirm we're avoiding a pinned floating toolbar (the Miro anti-pattern) and going trivially-dismissible.

---

### Citations

**Code (this repo):**
`src/app/components/DeskDoodles/DrawPanel.tsx` (Create-mode modal: `role=dialog`, `aria-modal`, scrim z300, input-mode pills, `onDone` returns one SVG markup) ·
`src/app/components/DeskDoodles/DeskPage.tsx` (objects array, `dbId` + `session_id` own-vs-others, drag-only interaction, SmartHachureChrome in right CollapsiblePanel as global controls, no per-object inspect surface yet) ·
`src/app/components/DeskDoodles/DrawSurface.tsx` (committed/Done/Edit/Reopen morph precedent; `hideActions` when host supplies chrome; strokes discarded at Done) ·
`src/app/lib/session.ts` (identity = client-minted localStorage UUID `dd.session.id`) ·
`src/app/lib/publish.ts` (session-scoped mutations via `.eq('session_id', getSessionId())` honor-system) ·
`supabase/schema.sql` (v1 TRUST MODEL block; names upgrade options a=signed session JWT, b=anonymous sign-ins)

**Locked plan:**
`docs/locked-refs/F3-smart-hachure-system/makeathon-plan.md` §S12 (Unify toggle + global pickers re-rendering cached doodles on demand) · §S13 (Path-B partial-toggle, per-doodle "applies to me / not to me" indicators)

**Object surface / nested-modal patterns:**
Figma right-sidebar inspector updates as selection changes — https://help.figma.com/hc/en-us/articles/360039832014 ·
tldraw inspector (single persistent panel, `editor.getSelectedShapes()` via `useValue`, morphs by selection) — https://tldraw.dev/examples/inspector-panel · contextual toolbar `getSharedStyles()` mixed-vs-shared — https://tldraw.dev/examples/contextual-toolbar ·
Excalidraw LayerUI persistent panel — https://deepwiki.com/excalidraw/excalidraw ·
Nested-modal alternatives (replace-not-stack, single emergency exit) — https://fireart.studio/blog/learn-why-you-should-exclude-nested-models-from-your-design-and-how-to-replace-them/ · https://uxplanet.org/removing-nested-modals-from-digital-products-6762351cf6de ·
Modal UX / double-modal only for destructive confirm — https://blog.logrocket.com/ux-design/modal-ux-design-patterns-examples-best-practices/ ·
Morphing-controls pattern — https://ui-patterns.com/patterns/morphing-controls ·
Read-only vs disabled vs ephemeral-edit signposting — https://cloudscape.design/patterns/general/disabled-and-read-only-states/ · https://carbondesignsystem.com/patterns/read-only-states-pattern/ ·
Miro floating-toolbar anti-pattern — https://community.miro.com/ideas/want-to-be-able-to-move-pin-or-hide-the-floating-editing-toolbar-15695

**Identity:**
Supabase anonymous sign-ins (`signInAnonymously`, `updateUser` email upgrade, `linkIdentity` OAuth, `user.id` preserved, `is_anonymous` claim, 30/hr IP limit + CAPTCHA/Turnstile) — https://supabase.com/docs/guides/auth/auth-anonymous ·
Supabase identity linking (`GOTRUE_SECURITY_MANUAL_LINKING_ENABLED`, obfuscated email-collision response) — https://supabase.com/docs/guides/auth/auth-identity-linking ·
Excalidraw no-login — https://nologin.tools/blog/excalidraw-free-whiteboard-no-login/ · tldraw no-login — https://makerstack.co/reviews/tldraw-review/ ·
FigJam open sessions / anonymous handles — https://help.figma.com/hc/en-us/articles/4410786053911 ·
Excalidraw multi-canvas demand — https://github.com/excalidraw/excalidraw/issues/8934 · https://github.com/MontejoJorge/excalidraw-multi-tabs ·
Anonymous→permanent carry-over discussion — https://github.com/orgs/supabase/discussions/29017

**Multi-desk:**
Lighthouse dom-size warning (~800 nodes) — web.dev dom-size audit · r/place fixed-grid engineering · haikunatorjs / docker name generator (adjective-noun precedent) · bryc PRNGs (xmur3 + mulberry32)

**Card + craft:**
ESP Game (labels as byproduct of play) — https://en.wikipedia.org/wiki/ESP_game ·
IKEA effect (~63% higher valuation) — https://thedecisionlab.com/biases/ikea-effect ·
Comeau layered shadows — https://www.joshwcomeau.com/css/designing-shadows/ ·
Taste anchors: Paper by FiftyThree, Things 3, riso/letterpress warmth
