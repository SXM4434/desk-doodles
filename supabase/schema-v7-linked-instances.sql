-- Desk Doodles — v7: Linked instances (edit one doodle → every copy updates).
-- ============================================================================
-- Paste this ENTIRE file into the Supabase SQL Editor (project: desk-doodles)
-- AFTER schema-v6-delete-desk.sql, and run it once. Idempotent — safe to re-run.
--
-- MODEL: every doodle row gets a `source_doodle_id`.
--   • An ORIGINAL points at itself      (source_doodle_id = id).
--   • A COPY / instance (the same doodle placed on another desk, dropped from
--     the drawer, or shared to a shelf) points at the ORIGINAL's id.
-- Editing ANY instance writes the new svg + render_config to EVERY row that
-- shares the source id AND belongs to the caller (owner-scoped) — so all copies
-- update everywhere at once. Placement (x/y/rotation/desk_id) is per-instance
-- and is NEVER propagated.
--
-- Trust model = identical to v3/v4/v5: SECURITY DEFINER + session ownership
-- enforced server-side, so the open anon UPDATE policy stays dropped.
-- ============================================================================

-- 1) Column ------------------------------------------------------------------
alter table public.doodles
  add column if not exists source_doodle_id uuid;

comment on column public.doodles.source_doodle_id is
  'Logical-source id. Originals point at their own id; copies point at the original. Edits propagate to every row sharing this id (update_doodle_instances).';

create index if not exists doodles_source_doodle_id_idx
  on public.doodles (source_doodle_id);

-- 2) Auto-stamp originals ----------------------------------------------------
-- Any insert that does NOT set source_doodle_id (every EXISTING insert path:
-- publish_to_open_desk, publish_to_private_desk, stash_to_drawer,
-- share_to_shelf, seeds) is an ORIGINAL → stamp it to its own id. A COPY sets
-- source_doodle_id explicitly (via set_doodle_source below) and the trigger
-- leaves a non-null value untouched. This means the existing RPCs need NO
-- signature change — originals get linked for free.
create or replace function public.doodles_stamp_source()
returns trigger
language plpgsql
as $$
begin
  if new.source_doodle_id is null then
    new.source_doodle_id := new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists doodles_stamp_source_trg on public.doodles;
create trigger doodles_stamp_source_trg
  before insert on public.doodles
  for each row execute function public.doodles_stamp_source();

-- 3) Backfill every existing row ---------------------------------------------
update public.doodles
   set source_doodle_id = id
 where source_doodle_id is null;

-- 4) Link a freshly-placed COPY to its source --------------------------------
-- Called right after a copy is inserted (the existing place/publish RPCs return
-- the new row's id; the client then links it to the source it was copied from).
-- Owner-scoped, idempotent.
create or replace function public.set_doodle_source(
  p_id uuid,
  p_session text,
  p_source uuid
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated int;
begin
  update public.doodles
     set source_doodle_id = p_source
   where id = p_id and session_id = p_session;
  get diagnostics v_updated = row_count;
  return v_updated > 0;
end;
$$;

grant execute on function public.set_doodle_source(uuid, text, uuid) to anon, authenticated;

-- 5) Propagate an edit to EVERY instance -------------------------------------
-- Rewrites svg + render_config (+ optional content_hash) on ALL of the caller's
-- rows that share the source id. Returns the number of rows updated (0 = nothing
-- matched / not yours). Same 64KB svg + 256KB config caps as v5; placement is
-- deliberately left out so each copy keeps its own spot.
create or replace function public.update_doodle_instances(
  p_source uuid,
  p_session text,
  p_svg text,
  p_render_config jsonb,
  p_content_hash text default null
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated int;
begin
  if p_svg is null or char_length(p_svg) not between 1 and 65536 then
    return 0;
  end if;
  if p_render_config is not null
     and pg_column_size(p_render_config) > 262144 then
    return 0;
  end if;

  update public.doodles
     set svg = p_svg,
         render_config = p_render_config,
         content_hash = coalesce(p_content_hash, content_hash)
   where source_doodle_id = p_source
     and session_id = p_session;
  get diagnostics v_updated = row_count;
  return v_updated;
end;
$$;

grant execute on function public.update_doodle_instances(uuid, text, text, jsonb, text) to anon, authenticated;

-- ── DONE. Deploy notes ──────────────────────────────────────────────────────
-- • After running this, every existing doodle is its own source (backfill), and
--   every NEW original auto-stamps (trigger) with zero client changes.
-- • The CLIENT side (stamp copies at place-time + route edits through
--   update_doodle_instances) is implemented in the project — see the Make prompt
--   (docs/submission/MAKE-PROMPT-3-linked-instances.md). Until that ships, edits
--   still work (they just update the single edited row via the v4/v5 RPCs).
