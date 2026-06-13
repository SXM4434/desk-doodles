-- ============================================================================
-- Desk Doodles — Personal Space, migration 3/3: private desks + personal drawer
-- ============================================================================
-- ⚠️  ARTIFACT ONLY — DO NOT RUN against the live shared database yet.
--     Apply after 0001 + 0002 (+ the v1/v2/v3 base). Adds the two halves of a
--     visitor's "personal space":
--       • PRIVATE DESK  — an owner-scoped desk (desks.owner_id = your id) that
--         only you see/edit, alongside the public pool. Same `desks` table.
--       • PERSONAL DRAWER — your own saved doodles, kept separate from any
--         public desk so you can stash work-in-progress / favourites.
--
-- The `desks` table already has owner_id (NULL = public pool; id = private) and
-- desks_owner_id_idx (schema-v2-desks.sql). This migration adds the owner-scoped
-- RLS + the RPCs the client calls to create/list private desks and stash/list
-- drawer doodles. Everything is auth.uid()-scoped (post-0002), so a private desk
-- is genuinely private at the DB layer.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- (a) the drawer — owner-scoped doodles not bound to any public desk
-- ----------------------------------------------------------------------------
-- The drawer is "your own saved doodles, separate from the public desk". We
-- model it WITHOUT a new table: a doodle is "in your drawer" when it has
-- owner_id = your id AND desk_id is null (not placed on any desk). This reuses
-- the rich doodle record (svg + render_config + name + why) so a drawer item can
-- be dragged onto a desk later with zero conversion.
--
-- Add owner_id to doodles (distinct from session_id, which records the CREATOR;
-- owner_id records who it currently BELONGS to — usually the same, but lets a
-- "remix as mine" fork reassign ownership cleanly).

alter table public.doodles
  add column if not exists owner_id text;

comment on column public.doodles.owner_id is
  'Owner of this doodle (drawer/private scope). NULL = unowned/public-only. id = a session/auth id. A doodle with owner_id set AND desk_id null lives in that owner''s personal drawer.';

-- Backfill: existing rows belong to their creator.
update public.doodles set owner_id = session_id where owner_id is null;

-- Drawer + "my doodles" lookups filter on owner.
create index if not exists doodles_owner_id_idx
  on public.doodles (owner_id);

-- Drawer query is (owner_id = me AND desk_id IS NULL) — a partial index keeps it
-- cheap regardless of how big the public feed grows.
create index if not exists doodles_drawer_idx
  on public.doodles (owner_id)
  where desk_id is null;

-- ----------------------------------------------------------------------------
-- (b) desks RLS — private desks are owner-only; public desks stay public
-- ----------------------------------------------------------------------------
-- v2 set desks SELECT to `using (true)` (all desks readable). That's fine for
-- public desks but a private desk must NOT be browsable by others. Replace the
-- SELECT policy so you can read: every PUBLIC desk (owner_id null) + your OWN
-- private desks. (Post-0002, auth.uid() is trusted.)

drop policy if exists "desks_select_public" on public.desks;
create policy "desks_select_public_or_own"
  on public.desks
  for select
  to anon, authenticated
  using (
    owner_id is null                                   -- public pool: everyone
    or (select auth.uid())::text = owner_id            -- your own private desks
  );

-- Private desks are created + mutated through the owner-scoped RPCs below
-- (SECURITY DEFINER), so NO direct anon INSERT/UPDATE/DELETE policy on desks —
-- same posture as the public publish_to_open_desk path.

-- ----------------------------------------------------------------------------
-- (c) create_private_desk RPC — make (or fetch) one of my private desks
-- ----------------------------------------------------------------------------
-- Creates a private desk owned by the caller. Unlike the public pool there is no
-- single-open-desk constraint (the partial-unique index in v2 is scoped to
-- `owner_id IS NULL`, so private desks are exempt — a person can have several).
-- desk_index for private desks uses a NEGATIVE space (-1, -2, …) per owner so it
-- never collides with the public 0,1,2,… sequence or its global unique index.
--
-- Params:
--   p_session text — caller id (session today; ignored in favour of auth.uid()
--                    when present, post-0002)
--   p_name    text — desk name (client may pass a deskName()-style label)
-- Returns the created desk row.

create or replace function public.create_private_desk(
  p_session text,
  p_name    text default 'My Desk'
) returns public.desks
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id    text := coalesce((select auth.uid())::text, p_session);
  v_index int;
  v_desk  public.desks;
begin
  if char_length(coalesce(v_id, '')) not between 1 and 64 then
    raise exception 'invalid owner id';
  end if;

  -- Next negative index for THIS owner: -1, -2, … (private space, collision-free
  -- with the public 0,1,2,… and exempt from the one-open-public partial index).
  select coalesce(min(desk_index), 0) - 1
    into v_index
    from public.desks
   where owner_id = v_id;
  if v_index >= 0 then v_index := -1; end if;

  insert into public.desks (desk_index, name, owner_id, is_open, object_count)
    values (v_index, coalesce(nullif(left(p_name, 60), ''), 'My Desk'), v_id, true, 0)
  returning * into v_desk;

  return v_desk;
end;
$$;

comment on function public.create_private_desk is
  'Create a private desk owned by the caller (auth.uid() post-swap, else p_session). Private desks use a per-owner negative desk_index so they never collide with the public 0,1,2,… pool or its one-open-public unique index.';

grant execute on function public.create_private_desk(text, text) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- (d) stash_to_drawer RPC — save a doodle into my personal drawer
-- ----------------------------------------------------------------------------
-- Inserts a doodle owned by the caller with desk_id NULL (drawer scope). Mirrors
-- publish_to_open_desk's insert but skips the desk cap/spawn (the drawer is not a
-- public wall) and stamps owner_id. Returns the inserted row so the client can
-- show it in the drawer immediately.
--
-- Params: p_session, p_svg, p_content_hash, p_name, p_why, p_render_config.

create or replace function public.stash_to_drawer(
  p_session       text,
  p_svg           text,
  p_content_hash  text,
  p_name          text default null,
  p_why           text default null,
  p_render_config jsonb default null
) returns public.doodles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id     text := coalesce((select auth.uid())::text, p_session);
  v_doodle public.doodles;
begin
  if char_length(coalesce(v_id, '')) not between 1 and 64 then
    raise exception 'invalid owner id';
  end if;
  if char_length(p_svg) not between 1 and 65536 then
    raise exception 'svg out of bounds (1..65536 bytes)';
  end if;
  if char_length(p_content_hash) not between 1 and 128 then
    raise exception 'invalid content_hash length';
  end if;

  insert into public.doodles (
    session_id, owner_id, svg, content_hash,
    x, y, rotation, desk_id, name, why, render_config
  ) values (
    v_id, v_id, p_svg, p_content_hash,
    0, 0, 0, null, p_name, p_why, p_render_config   -- desk_id null = drawer
  )
  returning * into v_doodle;

  return v_doodle;
end;
$$;

comment on function public.stash_to_drawer is
  'Save a doodle into the caller''s personal drawer (owner_id = caller, desk_id null). Separate from any public desk; can be placed on a desk later.';

grant execute on function public.stash_to_drawer(text, text, text, text, text, jsonb) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- (e) place_from_drawer RPC — move a drawer doodle onto a desk (public or mine)
-- ----------------------------------------------------------------------------
-- Sets desk_id + placement on one of YOUR OWN drawer doodles, moving it from the
-- drawer onto a desk. Bumps the target desk's object_count. Owner-checked so you
-- can only place your own items. Returns true if a row matched.

create or replace function public.place_from_drawer(
  p_id      uuid,
  p_session text,
  p_desk_id uuid,
  p_x       real default 0,
  p_y       real default 0,
  p_rot     real default 0
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id      text := coalesce((select auth.uid())::text, p_session);
  v_updated int;
begin
  update public.doodles
     set desk_id = p_desk_id, x = p_x, y = p_y, rotation = p_rot
   where id = p_id and owner_id = v_id and desk_id is null;
  get diagnostics v_updated = row_count;

  if v_updated > 0 then
    update public.desks set object_count = object_count + 1 where id = p_desk_id;
  end if;
  return v_updated > 0;
end;
$$;

comment on function public.place_from_drawer is
  'Move one of the caller''s drawer doodles (owner=caller, desk_id null) onto a desk: set desk_id + placement, bump the desk object_count. Owner-checked.';

grant execute on function public.place_from_drawer(uuid, text, uuid, real, real, real) to anon, authenticated;
