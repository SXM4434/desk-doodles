-- Desk Doodles — v3: session-scoped move + delete RPCs.
-- Paste AFTER schema-v2-desks.sql. Fixes the regression where v2 dropped the
-- open anon UPDATE/DELETE policies (security) leaving delete + drag-to-rearrange
-- silently dead. These SECURITY DEFINER functions enforce session ownership
-- server-side (the same pattern as publish_to_open_desk) — so a visitor can only
-- move/delete THEIR OWN doodles, and the policies stay closed. Idempotent.

-- Move (reposition) one of your own doodles. Returns true if a row matched.
create or replace function public.move_my_doodle(
  p_id uuid,
  p_session text,
  p_x real,
  p_y real,
  p_rotation real
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated int;
begin
  update public.doodles
     set x = p_x, y = p_y, rotation = p_rotation
   where id = p_id and session_id = p_session;
  get diagnostics v_updated = row_count;
  return v_updated > 0;
end;
$$;

-- Delete one of your own doodles + decrement its desk's object_count.
create or replace function public.delete_my_doodle(
  p_id uuid,
  p_session text
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_desk uuid;
  v_deleted int;
begin
  -- Capture the desk before deleting so we can decrement its count.
  select desk_id into v_desk
    from public.doodles
   where id = p_id and session_id = p_session;

  delete from public.doodles
   where id = p_id and session_id = p_session;
  get diagnostics v_deleted = row_count;

  if v_deleted > 0 and v_desk is not null then
    update public.desks
       set object_count = greatest(0, object_count - 1)
     where id = v_desk;
  end if;

  return v_deleted > 0;
end;
$$;

-- Rename / re-why one of your own doodles (Edit-mode save). Returns true if a
-- row matched. Null name/why are allowed (clearing a field).
create or replace function public.update_my_doodle_meta(
  p_id uuid,
  p_session text,
  p_name text,
  p_why text
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated int;
begin
  update public.doodles
     set name = nullif(left(coalesce(p_name, ''), 60), ''),
         why  = nullif(left(coalesce(p_why, ''), 140), '')
   where id = p_id and session_id = p_session;
  get diagnostics v_updated = row_count;
  return v_updated > 0;
end;
$$;

grant execute on function public.move_my_doodle(uuid, text, real, real, real) to anon, authenticated;
grant execute on function public.delete_my_doodle(uuid, text) to anon, authenticated;
grant execute on function public.update_my_doodle_meta(uuid, text, text, text) to anon, authenticated;
