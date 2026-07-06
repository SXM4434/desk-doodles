-- ============================================================================
-- Desk Doodles — Personal Space, migration 0004: SHELF + makeathon honor-system
-- ============================================================================
-- Apply AFTER 0001 (profiles) and 0003 (private desks + drawer). Do NOT need 0002
-- (anon-auth) for the makeathon — this migration makes the personal space work in
-- the HONOR-SYSTEM era (identity = the client localStorage UUID, no auth.uid()).
--
-- WHY THIS EXISTS:
--   • 0003's desks SELECT policy uses auth.uid() (= null without 0002), so an
--     owner could NOT read their OWN private desks. Honor-system fix below makes
--     desks/doodles readable; the CLIENT scopes by owner_id. (Soft privacy —
--     real DB-enforced privacy lands with the 0002 anon-auth swap, post-makeathon.)
--   • Adds the SHELF: a doodle's public face. is_public flag + the two RPCs the
--     client already calls (share_to_shelf, publish_to_private_desk) + a trigger
--     so every doodle gets owner_id and public-desk doodles auto-land on the shelf.
--
-- Idempotent: safe to re-run.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- (1) HONOR-SYSTEM read policies — owners can read their own private rows.
-- ----------------------------------------------------------------------------
-- 0003 set desks SELECT to (owner_id is null OR auth.uid()=owner_id); without
-- anon-auth that hides private desks from their owner. Make desks + doodles
-- readable; the client filters by owner_id. (Writes still go only through the
-- SECURITY DEFINER RPCs — no direct write policy is added.)
drop policy if exists "desks_select_public_or_own" on public.desks;
drop policy if exists "desks_select_public" on public.desks;
create policy "desks_select_honorsystem"
  on public.desks for select to anon, authenticated using (true);

drop policy if exists "doodles_select_honorsystem" on public.doodles;
create policy "doodles_select_honorsystem"
  on public.doodles for select to anon, authenticated using (true);

-- ----------------------------------------------------------------------------
-- (2) SHELF flag — a doodle is on its owner's public shelf when is_public.
-- ----------------------------------------------------------------------------
alter table public.doodles
  add column if not exists is_public boolean not null default false;

comment on column public.doodles.is_public is
  'On the owner''s public SHELF when true. Public-desk doodles are auto-flagged (trigger); a private/drawer doodle becomes public via share_to_shelf().';

create index if not exists doodles_shelf_idx
  on public.doodles (owner_id) where is_public;

-- ----------------------------------------------------------------------------
-- (3) Trigger — every doodle gets owner_id; public-desk doodles join the shelf.
-- ----------------------------------------------------------------------------
-- Stamps owner_id = session_id when unset (so the publisher owns it = on their
-- shelf), and flags is_public when the doodle lands on a PUBLIC desk (owner_id
-- null desk). Works for ANY insert path (public publish_to_open_desk too) without
-- editing those RPCs.
create or replace function public.doodle_shelf_autoflag()
returns trigger language plpgsql as $$
begin
  if new.owner_id is null then
    new.owner_id := new.session_id;
  end if;
  if new.desk_id is not null and new.is_public = false then
    if exists (select 1 from public.desks where id = new.desk_id and owner_id is null) then
      new.is_public := true;   -- on a PUBLIC desk → public shelf
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists doodles_shelf_autoflag on public.doodles;
create trigger doodles_shelf_autoflag
  before insert on public.doodles
  for each row execute function public.doodle_shelf_autoflag();

-- Backfill existing rows: owner from creator, public-desk doodles onto the shelf.
update public.doodles set owner_id = session_id where owner_id is null;
update public.doodles d set is_public = true
  from public.desks k
 where d.desk_id = k.id and k.owner_id is null and d.is_public = false;

-- ----------------------------------------------------------------------------
-- (4) share_to_shelf RPC — flip one of my drawer doodles public (onto my shelf).
-- ----------------------------------------------------------------------------
create or replace function public.share_to_shelf(
  p_id      uuid,
  p_session text
) returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_id      text := coalesce((select auth.uid())::text, p_session);
  v_updated int;
begin
  update public.doodles
     set is_public = true
   where id = p_id and owner_id = v_id;
  get diagnostics v_updated = row_count;
  return v_updated > 0;
end;
$$;

comment on function public.share_to_shelf is
  'Make one of the caller''s own doodles public (onto their shelf). Owner-checked.';

grant execute on function public.share_to_shelf(uuid, text) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- (5) publish_to_private_desk RPC — put a doodle on one of MY private desks.
-- ----------------------------------------------------------------------------
-- The routing fix: drawing on a private desk publishes onto THAT desk (owner-
-- scoped), not the public board. Stays private (is_public false).
create or replace function public.publish_to_private_desk(
  p_session       text,
  p_desk_id       uuid,
  p_svg           text,
  p_content_hash  text,
  p_name          text default null,
  p_why           text default null,
  p_render_config jsonb default null,
  p_x             real default 0,
  p_y             real default 0,
  p_rot           real default 0
) returns public.doodles
language plpgsql security definer set search_path = public as $$
declare
  v_id     text := coalesce((select auth.uid())::text, p_session);
  v_doodle public.doodles;
begin
  if char_length(coalesce(v_id, '')) not between 1 and 64 then
    raise exception 'invalid owner id';
  end if;
  -- only onto a desk the caller owns (a private desk)
  if not exists (select 1 from public.desks where id = p_desk_id and owner_id = v_id) then
    raise exception 'not your desk';
  end if;
  if char_length(p_svg) not between 1 and 65536 then
    raise exception 'svg out of bounds (1..65536 bytes)';
  end if;

  insert into public.doodles (
    session_id, owner_id, svg, content_hash,
    x, y, rotation, desk_id, name, why, render_config, is_public
  ) values (
    v_id, v_id, p_svg, p_content_hash,
    p_x, p_y, p_rot, p_desk_id, p_name, p_why, p_render_config, false  -- private desk → not shelf
  )
  returning * into v_doodle;

  update public.desks set object_count = object_count + 1 where id = p_desk_id;
  return v_doodle;
end;
$$;

comment on function public.publish_to_private_desk is
  'Publish a doodle onto one of the caller''s PRIVATE desks (owner-checked). Stays private (is_public false) — the private-desk routing fix.';

grant execute on function public.publish_to_private_desk(text, uuid, text, text, text, text, jsonb, real, real, real) to anon, authenticated;
