-- Desk Doodles — v5: Re-draw save (rewrite one of your own doodles' svg + record).
-- Paste AFTER schema-v4-config.sql. Idempotent (create or replace only).
--
-- Same trust model + pattern as the v3/v4 RPCs: SECURITY DEFINER functions
-- enforcing session ownership server-side (like move_my_doodle /
-- update_my_doodle_config), so a visitor can only rewrite THEIR OWN doodles
-- while the open anon UPDATE policy stays dropped (v2 security posture).
--
-- What it unlocks: the Edit popup's Re-draw stage (ObjectSurface) — reopen the
-- drawing with the object's stored strokes (render_config.strokes, written at
-- Done by the create flow), modify, and save the regenerated svg + updated
-- record back onto the SAME row. Client side: publish.ts updateDoodleSvg()
-- routes here and returns false gracefully while this file hasn't been pasted
-- (PGRST202 → "re-draw saved locally — needs schema-v5" note instead of lying).

-- Rewrite one of your own doodles (svg + render_config together — one
-- transaction, never a half-updated record). Returns true if a row matched.
--
-- p_content_hash is optional: when provided it keeps the content_hash column
-- (the conversion-cache / findDoodleBySvg key stamped at insert) in sync with
-- the new svg; when omitted the old hash is kept rather than going null.
create or replace function public.update_my_doodle_svg(
  p_id uuid,
  p_session text,
  p_svg text,
  p_render_config jsonb,
  p_content_hash text default null
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated int;
begin
  -- Same svg cap as the insert path (publish_to_open_desk + harden-v1): 64KB.
  -- Out-of-bounds resolves false, never partially writes.
  if p_svg is null or char_length(p_svg) not between 1 and 65536 then
    return false;
  end if;

  -- render_config cap: 64KB. Wider than v4's 16KB because the record now
  -- legitimately carries `strokes` (the raw gesture, client-decimated to a
  -- ≤45KB JSON budget before sending — publish.ts decimateStrokesToFit), on
  -- top of svgStyle + ~30 modifier scalars. Still keeps an anon-writable
  -- jsonb column from becoming a blob store.
  if p_render_config is not null
     and pg_column_size(p_render_config) > 262144 then
    return false;
  end if;

  update public.doodles
     set svg = p_svg,
         render_config = p_render_config,
         content_hash = coalesce(p_content_hash, content_hash)
   where id = p_id and session_id = p_session;
  get diagnostics v_updated = row_count;
  return v_updated > 0;
end;
$$;

grant execute on function public.update_my_doodle_svg(uuid, text, text, jsonb, text) to anon, authenticated;

-- ── v4 amendment (same paste): update_my_doodle_config cap 16KB → 64KB ───────
-- The v4 restyle RPC predates strokes-in-the-record. Edit-mode restyle saves
-- now write the WHOLE config back (style + modifiers + the passed-through
-- strokes field — dropping strokes on restyle would destroy re-editability),
-- so the 16KB sanity bound would silently reject any stroke-carrying config.
-- Re-created here with the same 64KB bound as above; body otherwise identical
-- to schema-v4-config.sql.
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
