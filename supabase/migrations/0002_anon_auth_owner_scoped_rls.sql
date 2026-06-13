-- ============================================================================
-- Desk Doodles — Personal Space, migration 2/3: anon-auth + owner-scoped RLS
-- ============================================================================
-- ⚠️  ARTIFACT ONLY — DO NOT RUN against the live shared database yet.
--     This is the "make the policies REAL" migration. It assumes the codebase
--     has SWAPPED to Supabase anonymous sign-ins (lib/session.ts now returns
--     supabase.auth.signInAnonymously().user.id) so auth.uid() exists on every
--     request. Run it ONLY after that client swap is live — otherwise legitimate
--     anon-key requests (which have no auth.uid()) lose write access.
--
-- WHY anon-auth (object-model doc §"Optional identity"):
--   • Today identity = a client-minted localStorage UUID. Every request hits the
--     DB as the same `anon` role, so "only touch your own rows" can't be RLS-
--     enforced — it's honor-system, scoped client-side.
--   • signInAnonymously() mints a REAL auth user (role `authenticated`,
--     is_anonymous=true). Now auth.uid() is a trusted server value, so
--     `using ((select auth.uid())::text = owner_id)` is REAL enforcement.
--   • The SAME user.id is PRESERVED when the anonymous user upgrades to permanent
--     (updateUser({email}) / linkIdentity({provider})), so private desks +
--     drawer carry over to a real account with ZERO merge code.
--     [https://supabase.com/docs/guides/auth/auth-anonymous]
--
-- RLS PERFORMANCE (Supabase troubleshooting guide):
--   • Wrap auth.uid() as `(select auth.uid())` so Postgres runs it ONCE per
--     statement (initPlan cache) instead of per row.
--   • Scope every policy `to authenticated` (after the swap, anon-key-only
--     requests shouldn't write) — execution stops before the row check for anon.
--   • INDEX every column referenced in a policy (owner_id / session_id) — done
--     in v2 (desks_owner_id_idx, doodles_session_id_idx) + below.
--   • Always give INSERT/UPDATE a WITH CHECK so a user can't set owner to
--     someone else's id (ownership theft).
--     [https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv]
-- ============================================================================

-- ----------------------------------------------------------------------------
-- (a) doodles gains a real owner key
-- ----------------------------------------------------------------------------
-- v1/v2 stamp rows with session_id (the localStorage UUID). After the swap,
-- session_id IS the auth.uid() string (lib/session.ts returns it), so we can
-- scope directly on session_id — no new column needed. We keep session_id as
-- the owner key for doodles (it already exists + is indexed) and add the
-- matching index assurance here for the RLS planner.

create index if not exists doodles_session_id_idx
  on public.doodles (session_id);

-- ----------------------------------------------------------------------------
-- (b) profiles: switch to real owner-scoped write
-- ----------------------------------------------------------------------------
-- Now that auth.uid() is trusted, profiles get a real owner-scoped write policy
-- (replaces the RPC-only honor-system from migration 0001). claim_handle() also
-- starts ignoring its p_id param in favour of auth.uid() — re-create it here.

create policy "profiles_write_own"
  on public.profiles
  for all
  to authenticated
  using ( (select auth.uid())::text = id )
  with check ( (select auth.uid())::text = id );

-- Re-create claim_handle to trust auth.uid() (ignore p_id). Collision check +
-- atomic upsert unchanged; only the identity source flips.
create or replace function public.claim_handle(
  p_id     text,   -- kept for signature compatibility; IGNORED post-swap
  p_handle text,
  p_source text default 'generated'
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner text;
  v_id    text := (select auth.uid())::text;   -- trusted identity now
begin
  if v_id is null then
    raise exception 'claim_handle requires an authenticated (anon-auth) session';
  end if;
  if p_handle !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
     or char_length(p_handle) not between 3 and 32 then
    raise exception 'invalid handle shape: %', p_handle;
  end if;

  select id into v_owner
    from public.profiles
   where lower(handle) = lower(p_handle)
   limit 1;
  if v_owner is not null and v_owner <> v_id then
    return false;
  end if;

  insert into public.profiles (id, handle, handle_source, updated_at)
    values (v_id, p_handle, coalesce(p_source, 'generated'), now())
  on conflict (id) do update
    set handle        = excluded.handle,
        handle_source = excluded.handle_source,
        updated_at    = now();
  return true;
end;
$$;

grant execute on function public.claim_handle(text, text, text) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- (c) doodles: real session-scoped mutation policies (replaces v3 RPCs)
-- ----------------------------------------------------------------------------
-- v2/v3 dropped the wide-open UPDATE/DELETE and routed mutation through
-- SECURITY DEFINER RPCs (move_my_doodle / delete_my_doodle) because the anon
-- role had no trusted identity. With auth.uid() trusted, we can re-add REAL
-- direct policies. The RPCs keep working (they self-check session_id) but the
-- client may now also use direct .update()/.delete() if desired — both enforce
-- ownership. SELECT stays public (the shared feed is browsable by design).

-- UPDATE: only your own rows; can't reassign session_id to someone else.
drop policy if exists "doodles_update_own" on public.doodles;
create policy "doodles_update_own"
  on public.doodles
  for update
  to authenticated
  using ( (select auth.uid())::text = session_id )
  with check (
    (select auth.uid())::text = session_id
    and char_length(svg) between 1 and 65536
  );

-- DELETE: only your own rows.
drop policy if exists "doodles_delete_own" on public.doodles;
create policy "doodles_delete_own"
  on public.doodles
  for delete
  to authenticated
  using ( (select auth.uid())::text = session_id );

-- INSERT: keep the sanity-bounded insert but additionally require that an
-- authenticated caller stamps their OWN id as session_id (no impersonation).
-- Anon-key-only callers (no auth.uid()) are now blocked from direct insert —
-- the publish path goes through publish_to_open_desk() which is SECURITY DEFINER
-- and self-stamps. (Recreate, scoped to authenticated, with the ownership check.)
drop policy if exists "doodles_insert_anon" on public.doodles;
create policy "doodles_insert_own"
  on public.doodles
  for insert
  to authenticated
  with check (
    (select auth.uid())::text = session_id
    and char_length(session_id) between 1 and 64
    and char_length(svg) between 1 and 65536
    and char_length(content_hash) between 1 and 128
  );

-- ----------------------------------------------------------------------------
-- (d) RPC identity hardening — move/delete/meta start trusting auth.uid()
-- ----------------------------------------------------------------------------
-- The v3 RPCs trust the p_session param (honor-system). Re-create them to
-- prefer auth.uid() when present so they can't be called on behalf of another
-- id. Signatures unchanged → publish.ts keeps working without edits.

create or replace function public.move_my_doodle(
  p_id uuid, p_session text, p_x real, p_y real, p_rotation real
) returns boolean
language plpgsql security definer set search_path = public
as $$
declare v_updated int; v_id text := coalesce((select auth.uid())::text, p_session);
begin
  update public.doodles
     set x = p_x, y = p_y, rotation = p_rotation
   where id = p_id and session_id = v_id;
  get diagnostics v_updated = row_count;
  return v_updated > 0;
end;
$$;

create or replace function public.delete_my_doodle(
  p_id uuid, p_session text
) returns boolean
language plpgsql security definer set search_path = public
as $$
declare v_desk uuid; v_deleted int; v_id text := coalesce((select auth.uid())::text, p_session);
begin
  select desk_id into v_desk from public.doodles where id = p_id and session_id = v_id;
  delete from public.doodles where id = p_id and session_id = v_id;
  get diagnostics v_deleted = row_count;
  if v_deleted > 0 and v_desk is not null then
    update public.desks set object_count = greatest(0, object_count - 1) where id = v_desk;
  end if;
  return v_deleted > 0;
end;
$$;

create or replace function public.update_my_doodle_meta(
  p_id uuid, p_session text, p_name text, p_why text
) returns boolean
language plpgsql security definer set search_path = public
as $$
declare v_updated int; v_id text := coalesce((select auth.uid())::text, p_session);
begin
  update public.doodles
     set name = nullif(left(coalesce(p_name, ''), 60), ''),
         why  = nullif(left(coalesce(p_why, ''), 140), '')
   where id = p_id and session_id = v_id;
  get diagnostics v_updated = row_count;
  return v_updated > 0;
end;
$$;

grant execute on function public.move_my_doodle(uuid, text, real, real, real) to anon, authenticated;
grant execute on function public.delete_my_doodle(uuid, text) to anon, authenticated;
grant execute on function public.update_my_doodle_meta(uuid, text, text, text) to anon, authenticated;
