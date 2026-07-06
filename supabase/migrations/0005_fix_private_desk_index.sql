-- ============================================================================
-- Desk Doodles — migration 0005: FIX create_private_desk index collision
-- ============================================================================
-- BUG (found live 2026-06-14): create_private_desk allocated desk_index as the
-- PER-OWNER min minus 1 (so every owner's first private desk wanted -1). But the
-- unique index on desk_index is GLOBAL, so the second owner to create a private
-- desk hit `duplicate key (desk_index)=(-1)` (SQLSTATE 23505).
--
-- FIX: allocate a GLOBALLY-unique negative index — one below the global minimum
-- over ALL desks — with a small retry loop so concurrent creates can't race into
-- the same index. Private desks stay in negative space (collision-free with the
-- public 0,1,2,… pool); each new one is globally unique.
--
-- Apply after 0001 + 0003 + 0004. Idempotent (create or replace).
-- ============================================================================

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

  -- Try up to 5 times: take one below the GLOBAL minimum desk_index, insert, and
  -- if a concurrent create grabbed that index (unique_violation), recompute + retry.
  for attempt in 1..5 loop
    select least(coalesce(min(desk_index), 0), 0) - 1
      into v_index
      from public.desks;
    begin
      insert into public.desks (desk_index, name, owner_id, is_open, object_count)
        values (v_index, coalesce(nullif(left(p_name, 60), ''), 'My Desk'), v_id, true, 0)
      returning * into v_desk;
      return v_desk;
    exception when unique_violation then
      -- another create took this index between the select and insert — retry.
      null;
    end;
  end loop;

  raise exception 'could not allocate a private desk index after 5 attempts';
end;
$$;

comment on function public.create_private_desk is
  'Create a private desk owned by the caller. Allocates a GLOBALLY-unique negative desk_index (one below the global min, with retry) so private desks never collide across owners or with the public 0,1,2,… pool.';

grant execute on function public.create_private_desk(text, text) to anon, authenticated;
