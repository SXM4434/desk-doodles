-- ============================================================================
-- Desk Doodles — v2 multi-desk schema (makeathon Day 10/11)
-- ============================================================================
-- Paste this ENTIRE file into the Supabase SQL Editor (project: desk-doodles)
-- and run it once. It is idempotent — safe to re-run. It assumes v1
-- (supabase/schema.sql) has ALREADY been run (the public.doodles table exists
-- with rows). This script grows that v1 single-flat-feed into the multi-desk
-- model from docs/design/object-model-and-desk-architecture.md (Multi-desk §).
--
-- WHAT THIS DOES (the architecture, in order):
--   (a) creates a `desks` table — one row per public (or private) desk;
--   (b) a PARTIAL UNIQUE INDEX so only ONE open PUBLIC desk exists at a time;
--   (c) grows `doodles` into a rich record (desk_id FK + name + why +
--       render_config — the per-object style snapshot from §1 "object-as-record");
--   (d) seeds a genesis public desk (desk_index 0) + backfills every existing
--       doodle onto it + sets its object_count;
--   (e) a publish_to_open_desk() RPC that inserts a doodle into the current
--       open public desk, increments object_count, and at the cap CLOSES that
--       desk and OPENS desk_index+1 — all in ONE transaction (no client race);
--   (f) RLS: public SELECT on both tables, anon INSERT on doodles via the RPC
--       path, and FOLDS IN harden-v1.sql (drops the wide-open anon UPDATE +
--       DELETE honor-system policies, tightens the svg insert cap to 64KB).
--   Plus: adds `desks` to the realtime publication (live gallery / live feed).
--
-- ============================================================================
-- v1/v2 TRUST MODEL (read before judging the policies)
-- ============================================================================
-- Identity is still a CLIENT-MINTED localStorage UUID (src/app/lib/session.ts),
-- NOT a Supabase auth.uid(). There is no auth, so every request arrives as the
-- same `anon` role and any client could claim any session_id. This is the v1
-- honor-system model: the APP scopes "my rows" client-side; RLS only enforces
-- sanity bounds + closes the wide-open holes.
--
-- The session-UUID honor system is accepted for the makeathon public canvas
-- (low stakes, shared feed, nothing private). The real fix — Supabase ANONYMOUS
-- SIGN-INS, after which `auth.uid()` exists and policies become real
-- (`using (owner_id = auth.uid())`) — is POST-MAKEATHON. See the v1 schema.sql
-- TRUST MODEL block + the object-model doc "Optional identity" §.
--
-- Because mutation can't be trusted to the anon role, the cap/spawn logic lives
-- in a SECURITY DEFINER function (publish_to_open_desk) instead of an anon
-- UPDATE policy: the function runs with the owner's rights, so it can close a
-- desk + open the next one atomically, while the anon role itself keeps NO
-- direct UPDATE/DELETE on either table.
-- ============================================================================

-- gen_random_uuid() is built into Postgres 13+ — no extension needed here.

-- ----------------------------------------------------------------------------
-- (a) desks table
-- ----------------------------------------------------------------------------
-- One row per desk. desk_index drives the deterministic fun name
-- (src/app/lib/deskNames.ts) + the spawn ordering. owner_id is NULL for the
-- PUBLIC pool and the session id for PRIVATE desks (post-makeathon, same table).

create table if not exists public.desks (
  id           uuid primary key default gen_random_uuid(),
  desk_index   int  not null,                  -- 0-based; unique (index below)
  name         text not null,                  -- generated + STORED at creation
  object_cap   int  not null default 120,      -- per-desk cap (Sebs 2026-06-11: a wall should feel full; perf gated by per-object memoization, not raw count — measure + tune)
  object_count int  not null default 0,        -- maintained by the RPC
  is_open      boolean not null default true,  -- only one open public desk (index below)
  preview_svg  text,                            -- thumbnail cached at desk-close
  owner_id     text,                            -- NULL = public pool; session id = private
  created_at   timestamptz not null default now()
);

comment on table public.desks is
  'v2 multi-desk. Each row is one public (owner_id null) or private (owner_id = session id) desk. desk_index drives the deterministic name (lib/deskNames.ts) + spawn order. object_count + is_open maintained server-side by publish_to_open_desk().';

-- ----------------------------------------------------------------------------
-- (b) uniqueness guarantees
-- ----------------------------------------------------------------------------

-- desk_index is globally unique (drives the name + spawn ordering).
create unique index if not exists desks_desk_index_key
  on public.desks (desk_index);

-- THE one-open-public-desk guarantee: at most one row may have
-- (is_open = true AND owner_id IS NULL). This is what makes the auto-spawn
-- race-free — two concurrent publishes that both try to open a new public
-- desk can't both succeed; the second hits this index and rolls back.
create unique index if not exists desks_one_open_public_idx
  on public.desks ((true))
  where is_open is true and owner_id is null;

-- Gallery reads newest-first (listDesks in src/app/lib/publish.ts).
create index if not exists desks_created_at_idx
  on public.desks (created_at desc);

-- Private-desk lookups + "my desks" filter on owner.
create index if not exists desks_owner_id_idx
  on public.desks (owner_id);

-- ----------------------------------------------------------------------------
-- (c) grow doodles into a rich record (additive, idempotent)
-- ----------------------------------------------------------------------------
-- desk_id FK groups doodles by desk. name/why are the human label track (and
-- ML labels — see object-model doc §3). render_config is the per-object style
-- snapshot (Smart Hachure style + modifier values) so an object re-renders
-- through its own config without re-generating — the keystone "object-as-record".

alter table public.doodles
  add column if not exists desk_id uuid references public.desks(id);

alter table public.doodles
  add column if not exists name text;

alter table public.doodles
  add column if not exists why text;

alter table public.doodles
  add column if not exists render_config jsonb;

comment on column public.doodles.desk_id is
  'Which desk this doodle lives on (v2 multi-desk). Backfilled to the genesis public desk for v1 rows.';
comment on column public.doodles.render_config is
  'Per-object style snapshot (Smart Hachure style + modifier values) — the re-applyable "layer style" from the object-as-record keystone.';

-- Realtime + gallery filter live inserts by desk (subscribeDoodlesForDesk).
create index if not exists doodles_desk_id_idx
  on public.doodles (desk_id);

-- ----------------------------------------------------------------------------
-- (d) seed the genesis public desk + backfill existing doodles
-- ----------------------------------------------------------------------------
-- desk_index 0 is the genesis public desk. Its stored name uses the SAME hero
-- string lib/deskNames.ts(0) yields so the client + DB agree; the client may
-- overwrite name cosmetically but index 0 is stable. We insert it OPEN so the
-- first publish lands on it (unless it's already full from the backfill, in
-- which case the RPC will spawn desk 1 on the next publish).

insert into public.desks (desk_index, name, owner_id, is_open)
  values (0, 'The Graphite Orchard', null, true)
on conflict (desk_index) do nothing;

-- Backfill every doodle that has no desk yet onto the genesis desk.
update public.doodles
   set desk_id = (select id from public.desks where desk_index = 0)
 where desk_id is null;

-- Set the genesis desk's object_count to the number of doodles now on it, and
-- close it if the backfill already met/exceeded the cap (the RPC then spawns
-- desk 1 on the next publish). Done in one statement so re-runs are stable.
update public.desks d
   set object_count = sub.cnt,
       is_open      = (sub.cnt < d.object_cap)
  from (
    select desk_id, count(*) as cnt
      from public.doodles
     where desk_id is not null
     group by desk_id
  ) sub
 where d.id = sub.desk_id
   and d.desk_index = 0;

-- ----------------------------------------------------------------------------
-- (e) publish_to_open_desk RPC — server-side cap + atomic spawn
-- ----------------------------------------------------------------------------
-- Inserts one doodle into the CURRENT open public desk, bumps object_count,
-- and when the cap is reached closes that desk + opens desk_index+1 with the
-- client-supplied generated name — all in ONE transaction (function body), so
-- there is no client race and exactly one desk is ever open.
--
-- SECURITY DEFINER: runs with the function-owner's rights so it can mutate
-- desks/doodles even though the anon role has no direct UPDATE on them. The
-- inserts/updates here are the ONLY way anon writes to these tables in v2.
--
-- Params:
--   p_session_id   text   — caller's localStorage session id
--   p_svg          text   — sanitized SVG markup (sanitize on read too, client)
--   p_content_hash text   — SHA-1 of the svg (lib/contentHash.ts)
--   p_x,p_y,p_rot  real   — desk placement
--   p_name         text   — object name (the ML label) — nullable
--   p_why          text   — one-line "why you made it" — nullable
--   p_render_config jsonb — per-object style snapshot — nullable
--   p_next_desk_name text — the deterministic name for desk_index+1 (client
--                           computes via lib/deskNames.ts so DB + client agree),
--                           used only if THIS publish fills the current desk.
-- Returns the inserted doodle row (so the client gets id + created_at + desk_id).

create or replace function public.publish_to_open_desk(
  p_session_id     text,
  p_svg            text,
  p_content_hash   text,
  p_x              real default 0,
  p_y              real default 0,
  p_rot            real default 0,
  p_name           text default null,
  p_why            text default null,
  p_render_config  jsonb default null,
  p_next_desk_name text default null
)
returns public.doodles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_desk        public.desks;
  v_doodle      public.doodles;
  v_next_index  int;
  v_next_name   text;
begin
  -- Sanity bounds (mirror the INSERT policy; the RPC is the trusted write path
  -- so it must self-enforce — RLS with-check doesn't apply to definer writes).
  if char_length(p_session_id) not between 1 and 64 then
    raise exception 'invalid session_id length';
  end if;
  if char_length(p_svg) not between 1 and 65536 then
    raise exception 'svg out of bounds (1..65536 bytes)';
  end if;
  if char_length(p_content_hash) not between 1 and 128 then
    raise exception 'invalid content_hash length';
  end if;

  -- Lock the current open PUBLIC desk so two concurrent publishes serialize on
  -- it (the FOR UPDATE row lock + the partial-unique index together make the
  -- close/spawn race-free).
  select * into v_desk
    from public.desks
   where is_open is true and owner_id is null
   order by desk_index desc
   limit 1
   for update;

  -- No open public desk (fresh DB, or all closed) — open the genesis one.
  if v_desk.id is null then
    insert into public.desks (desk_index, name, owner_id, is_open, object_count)
      values (0, coalesce(p_next_desk_name, 'The Graphite Orchard'), null, true, 0)
    on conflict (desk_index) do update set is_open = true
    returning * into v_desk;
  end if;

  -- Insert the doodle onto the open desk.
  insert into public.doodles (
    session_id, svg, content_hash, x, y, rotation,
    desk_id, name, why, render_config
  ) values (
    p_session_id, p_svg, p_content_hash, p_x, p_y, p_rot,
    v_desk.id, p_name, p_why, p_render_config
  )
  returning * into v_doodle;

  -- Bump the count.
  update public.desks
     set object_count = object_count + 1
   where id = v_desk.id
  returning * into v_desk;

  -- At/over cap → close this desk and open the next one in the SAME transaction.
  if v_desk.object_count >= v_desk.object_cap then
    update public.desks set is_open = false where id = v_desk.id;

    v_next_index := v_desk.desk_index + 1;
    v_next_name  := coalesce(p_next_desk_name, 'Desk ' || v_next_index::text);

    -- on conflict: if desk_index+1 somehow already exists (re-run / race), just
    -- reopen it rather than erroring — keeps exactly one open public desk.
    insert into public.desks (desk_index, name, owner_id, is_open, object_count)
      values (v_next_index, v_next_name, null, true, 0)
    on conflict (desk_index) do update set is_open = true;
  end if;

  return v_doodle;
end;
$$;

comment on function public.publish_to_open_desk is
  'v2 atomic publish: insert a doodle onto the open public desk, bump object_count, and at the cap close it + open desk_index+1 — all in one transaction (no client race). SECURITY DEFINER: the only anon write path to desks/doodles in v2.';

-- Anon + authenticated may call the RPC (the trusted insert path). They have
-- NO direct INSERT/UPDATE/DELETE on the tables themselves (see RLS below).
grant execute on function public.publish_to_open_desk(
  text, text, text, real, real, real, text, text, jsonb, text
) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- (f) Row Level Security — desks + doodles
-- ----------------------------------------------------------------------------

-- ---- desks ----------------------------------------------------------------
alter table public.desks enable row level security;

-- READ: the gallery is public by design — anyone can browse every desk.
-- (Private desks ride owner_id; a real owner filter lands with anon-auth
-- post-makeathon. For now all desks are readable — nothing private is stored.)
drop policy if exists "desks_select_public" on public.desks;
create policy "desks_select_public"
  on public.desks
  for select
  to anon, authenticated
  using (true);

-- NO anon INSERT/UPDATE/DELETE policy on desks. Desks are created + mutated
-- ONLY through publish_to_open_desk() (SECURITY DEFINER), so the anon role
-- can never spawn/close/wipe desks directly.

-- ---- doodles --------------------------------------------------------------
alter table public.doodles enable row level security;

-- READ: the feed is public by design (unchanged from v1).
drop policy if exists "doodles_select_public" on public.doodles;
create policy "doodles_select_public"
  on public.doodles
  for select
  to anon, authenticated
  using (true);

-- INSERT: keep a direct anon INSERT policy as the sanity-bounded fallback for
-- any non-RPC writer, but TIGHTEN the svg cap to 64KB (folds in harden-v1.sql:
-- real stroke doodles are <10KB; 1MB was a storage-DoS hole). The desk-aware
-- path goes through the RPC; this policy covers v1-style flat inserts + bounds.
drop policy if exists "doodles_insert_anon" on public.doodles;
create policy "doodles_insert_anon"
  on public.doodles
  for insert
  to anon, authenticated
  with check (
    char_length(session_id) between 1 and 64
    and char_length(svg) between 1 and 65536        -- 64KB (was 1MB) — harden-v1
    and char_length(content_hash) between 1 and 128
  );

-- DROP the v1 wide-open honor-system UPDATE + DELETE policies (folds in
-- harden-v1.sql). `using (true)` let ANY visitor rewrite/wipe the whole feed
-- with the public key — a live security hole + stored-XSS amplifier. Position
-- persistence + delete-✕ come back as SCOPED policies once anon-auth lands
-- (`using (owner_id = auth.uid())`) post-makeathon.
drop policy if exists "doodles_update_anon_v1_trust" on public.doodles;
drop policy if exists "doodles_delete_anon_v1_trust" on public.doodles;

-- ----------------------------------------------------------------------------
-- Realtime (live gallery + live per-desk feed)
-- ----------------------------------------------------------------------------
-- doodles is already in the publication from v1; add desks too so the gallery
-- gets live desk spawns/closes. Wrapped so re-runs + non-hosted envs don't
-- fail the script (the client no-ops gracefully if realtime never delivers).

do $$
begin
  alter publication supabase_realtime add table public.desks;
exception
  when duplicate_object then null;   -- already in the publication (re-run)
  when undefined_object then null;   -- publication absent (non-hosted env)
end $$;

do $$
begin
  alter publication supabase_realtime add table public.doodles;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;
