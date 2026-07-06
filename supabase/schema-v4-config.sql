-- Desk Doodles — v4: Edit-mode style save (per-object render_config update).
-- Paste AFTER schema-v3-rls.sql. Same trust model + pattern as the v3 RPCs:
-- a SECURITY DEFINER function enforcing session ownership server-side (like
-- move_my_doodle / update_my_doodle_meta), so a visitor can only restyle
-- THEIR OWN doodles while the open anon UPDATE policy stays dropped (v2
-- security posture). Idempotent.
--
-- What it unlocks: the Edit popup's full control column (ObjectSurface) can
-- persist a restyled render_config onto the object record (D-6/D-7 — the
-- record is the treatment-stage truth every viewer renders from). Client
-- side: publish.ts updateDoodleConfig() routes here and returns false
-- gracefully while this file hasn't been pasted (PGRST202 → "style saved
-- locally — needs schema-v4" note instead of lying).

-- Restyle one of your own doodles. Returns true if a row matched.
create or replace function public.update_my_doodle_config(
  p_id uuid,
  p_session text,
  p_render_config jsonb
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated int;
begin
  -- Sanity bound. RAISED 16KB → 256KB (Sebs 2026-06-16): an object's config can
  -- legitimately carry the recorded strokes, tone fills, the saved 3D look
  -- (geometry3d / aiMesh) AND — for a traced upload — the source photo data-URL
  -- (sourceImage, ~150KB). At 16KB those edits silently failed to persist (the
  -- RPC returned false → "saved locally" → reverted on reload). 256KB fits them
  -- while still blocking an anon-writable jsonb from becoming a blob store.
  if p_render_config is not null
     and pg_column_size(p_render_config) > 262144 then
    return false;
  end if;

  update public.doodles
     set render_config = p_render_config
   where id = p_id and session_id = p_session;
  get diagnostics v_updated = row_count;
  return v_updated > 0;
end;
$$;

grant execute on function public.update_my_doodle_config(uuid, text, jsonb) to anon, authenticated;
