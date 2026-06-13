-- ============================================================================
-- Desk Doodles — Personal Space, migration 1/3: profiles + friendly handles
-- ============================================================================
-- ⚠️  ARTIFACT ONLY — DO NOT RUN against the live shared database yet.
--     Scaffolded by the personal-space MVP stream (R9). Apply order is
--     0001 → 0002 → 0003, AFTER schema.sql + schema-v2-desks.sql + schema-v3-rls.sql.
--     Review with Sebs first; the anon-auth swap (migration 0002) is the one
--     pre-launch identity decision (object-model doc §"Optional identity" Q3).
--
-- WHAT THIS MIGRATION DOES:
--   (a) creates a `profiles` table — one row per identity, holding the friendly
--       HANDLE (e.g. "doodled-finch") the onboarding flow lets a visitor
--       Keep / Reroll / Type-your-own;
--   (b) a CASE-INSENSITIVE UNIQUE index on the handle so two people can't claim
--       the same one (collision handling: the client reroll/append-token loop +
--       this index = the authority);
--   (c) a claim_handle() RPC that atomically inserts-or-updates the caller's
--       profile handle, returning success/failure so the client can reroll on a
--       taken handle without a race;
--   (d) RLS: public SELECT (handles are public labels), owner-scoped write.
--
-- ============================================================================
-- IDENTITY MODEL — anon-auth ready, honor-system compatible
-- ============================================================================
-- The `id` column is the identity key. It is written to deliberately support
-- BOTH eras with no schema change:
--   • TODAY (honor-system): the client-minted localStorage UUID (lib/session.ts).
--   • POST-SWAP (anon-auth): the Supabase auth.uid() of an anonymous (or later
--     permanent) user. Because Supabase PRESERVES user.id when an anonymous user
--     upgrades to permanent (updateUser({email}) / linkIdentity()), the handle +
--     every desk/doodle keyed to this id carry over for free.
--     [https://supabase.com/docs/guides/auth/auth-anonymous]
--
-- The owner-scoped RLS below is written in the auth.uid() form but DISABLED for
-- the honor-system era via a guard (see the policy comments). Migration 0002
-- flips the guard on once lib/session.ts returns auth.uid().
-- ============================================================================

-- ----------------------------------------------------------------------------
-- (a) profiles table
-- ----------------------------------------------------------------------------
-- One row per identity. `id` is the session/auth id (text so it holds either a
-- localStorage UUID or an auth.uid() string). `handle` is the friendly,
-- lowercase, hyphenated label shown everywhere a person is named (drawer,
-- object-card footer, desk owner). `handle_source` records whether they kept
-- the generated one, rerolled, or typed their own (a soft analytics/ML signal).

create table if not exists public.profiles (
  id            text primary key,                    -- session id today; auth.uid() post-swap
  handle        text not null,                       -- friendly handle, e.g. "doodled-finch"
  handle_source text not null default 'generated',   -- 'generated' | 'rerolled' | 'custom'
  avatar_svg    text,                                -- optional pick-a-mark doodle (inline SVG)
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.profiles is
  'Personal-space identity. One row per session/auth id. handle = the friendly @-label the onboarding flow lets a visitor Keep/Reroll/Type. id holds a localStorage UUID today, an auth.uid() after the anon-auth swap (migration 0002) — preserved across the anonymous->permanent upgrade.';

-- ----------------------------------------------------------------------------
-- (b) handle uniqueness — case-insensitive
-- ----------------------------------------------------------------------------
-- Two people can't claim the same handle. Case-insensitive so "Doodled-Finch"
-- and "doodled-finch" collide (handles are stored lowercase; this is defence in
-- depth). The client's reroll / append-numeric-token loop resolves collisions;
-- this index is the final authority that makes claim_handle() race-free.

create unique index if not exists profiles_handle_unique_ci
  on public.profiles (lower(handle));

-- Bound handle shape at the DB edge (the client validates too): 3..32 chars,
-- lowercase letters / digits / single hyphens, no leading/trailing hyphen.
alter table public.profiles
  drop constraint if exists profiles_handle_shape;
alter table public.profiles
  add constraint profiles_handle_shape
  check (handle ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(handle) between 3 and 32);

-- ----------------------------------------------------------------------------
-- (c) claim_handle RPC — atomic insert-or-update, collision-safe
-- ----------------------------------------------------------------------------
-- Upserts the caller's profile with a desired handle. Returns true if claimed,
-- false if the handle is already taken by someone else (the client then rerolls
-- or appends a token and calls again). Atomic: the unique index + ON CONFLICT
-- make two simultaneous claims of the same handle deterministic — exactly one
-- wins.
--
-- SECURITY DEFINER + honor-system: in the localStorage-UUID era there is no
-- trusted identity, so the caller passes p_id (their session id) and the RPC
-- writes that row. After the anon-auth swap, p_id should be ignored in favour of
-- auth.uid() (see the commented line) so a client can't claim a handle for
-- someone else's id. We keep p_id now for the honor-system era and flip to
-- auth.uid() in migration 0002.
--
-- Params:
--   p_id      text — caller's identity (session id today; auth.uid() post-swap)
--   p_handle  text — desired handle (client pre-normalizes to lowercase/hyphen)
--   p_source  text — 'generated' | 'rerolled' | 'custom'
-- Returns: boolean (true = claimed/updated, false = taken by another id).

create or replace function public.claim_handle(
  p_id     text,
  p_handle text,
  p_source text default 'generated'
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner text;
begin
  -- POST-SWAP: replace p_id with (select auth.uid()::text) and drop the param
  -- from the client call — see migration 0002.
  -- p_id := coalesce((select auth.uid()::text), p_id);

  if p_handle !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
     or char_length(p_handle) not between 3 and 32 then
    raise exception 'invalid handle shape: %', p_handle;
  end if;

  -- Is this handle already owned by a DIFFERENT id? (case-insensitive)
  select id into v_owner
    from public.profiles
   where lower(handle) = lower(p_handle)
   limit 1;

  if v_owner is not null and v_owner <> p_id then
    return false;   -- taken by someone else → client rerolls
  end if;

  -- Insert or update the caller's own profile row.
  insert into public.profiles (id, handle, handle_source, updated_at)
    values (p_id, p_handle, coalesce(p_source, 'generated'), now())
  on conflict (id) do update
    set handle        = excluded.handle,
        handle_source = excluded.handle_source,
        updated_at    = now();

  return true;
end;
$$;

comment on function public.claim_handle is
  'Atomically claim/update the caller''s friendly handle. Returns false if the handle is taken by another id (client rerolls). Honor-system: trusts p_id today; switches to auth.uid() in migration 0002.';

grant execute on function public.claim_handle(text, text, text) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- (d) Row Level Security — profiles
-- ----------------------------------------------------------------------------
alter table public.profiles enable row level security;

-- READ: handles are public labels (shown on cards / drawer / desks). Anyone may
-- read any profile so the UI can render "@doodled-finch" next to a doodle.
drop policy if exists "profiles_select_public" on public.profiles;
create policy "profiles_select_public"
  on public.profiles
  for select
  to anon, authenticated
  using (true);

-- WRITE: in the honor-system era there is no trusted identity, so direct
-- INSERT/UPDATE can't be owner-enforced (any client could claim any id). All
-- writes therefore go through claim_handle() (SECURITY DEFINER) — we keep NO
-- direct anon write policy, exactly like desks go only through the publish RPC.
--
-- POST-SWAP (migration 0002) re-adds real owner-scoped policies:
--   create policy "profiles_write_own" on public.profiles
--     for all to authenticated
--     using ( (select auth.uid())::text = id )
--     with check ( (select auth.uid())::text = id );
-- ...and claim_handle starts ignoring p_id in favour of auth.uid().

-- ----------------------------------------------------------------------------
-- Realtime (optional) — handle changes are rare; not added to the publication.
-- ----------------------------------------------------------------------------
-- profiles is intentionally LEFT OUT of supabase_realtime: handles change once
-- in a blue moon and the UI reads them on load. Add it later if a live
-- "someone renamed themselves" indicator is ever wanted.
