-- Desk Doodles — v6: delete one of YOUR private desks (+ its doodles).
-- Paste AFTER the 0003 private-desks migration. Same trust model as the other
-- session-scoped RPCs (delete_my_doodle / move_my_doodle): a SECURITY DEFINER
-- function enforcing owner_id = caller, so a visitor can only delete THEIR OWN
-- private desks. Idempotent.
--
-- What it unlocks: the /your-space desk list gets a real Delete (Sebs 2026-06-17
-- "I want to delete my own desks"). Client side: personalSpace.ts deleteMyDesk()
-- routes here and returns false gracefully while this file isn't pasted (PGRST202
-- → a quiet no-op, the desk stays).
--
-- Cascade: a private desk's doodles are deleted with it (they live on that desk
-- and have nowhere else to go). Public desks (owner_id IS NULL) are NEVER
-- deletable here — the guard requires owner_id = caller.

create or replace function public.delete_private_desk(
  p_id      uuid,
  p_session text
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner text := coalesce(nullif(p_session, ''), '');
  v_deleted int;
begin
  if char_length(v_owner) not between 1 and 64 then
    return false;
  end if;

  -- Drop the desk's doodles first (FK-safe + leaves no orphans), owner-scoped.
  delete from public.doodles
   where desk_id = p_id
     and owner_id = v_owner;

  -- Delete the desk itself — ONLY if it's a private desk owned by the caller.
  delete from public.desks
   where id = p_id
     and owner_id = v_owner;
  get diagnostics v_deleted = row_count;
  return v_deleted > 0;
end;
$$;

comment on function public.delete_private_desk is
  'Delete one of the caller''s OWN private desks (owner_id = p_session) and its doodles. Public desks (owner_id IS NULL) are never matched, so the open wall can''t be deleted.';

grant execute on function public.delete_private_desk(uuid, text) to anon, authenticated;
