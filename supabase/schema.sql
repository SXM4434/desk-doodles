-- ============================================================================
-- Desk Doodles — M9 public canvas schema (v1, makeathon)
-- ============================================================================
-- Paste this ENTIRE file into the Supabase SQL Editor (project: desk-doodles)
-- and run it once. It is idempotent — safe to re-run.
--
-- M9 scope (docs/memory/project_desk_doodles_makeathon.md): public canvas =
-- anonymous session (client-minted UUID, src/app/lib/session.ts) + shared
-- global feed. No auth UI. One table.
--
-- v1 keeps the SVG markup INLINE as TEXT — published blobs are small stroke
-- SVGs from the draw panel. UPGRADE PATH (post-makeathon / big uploads):
-- move svg bodies to a Storage bucket and store the object path here as
-- svg_blob_url, keeping this table as the feed index.
-- ============================================================================

-- gen_random_uuid() is built into Postgres 13+ — no extension needed here.

create table if not exists public.doodles (
  id           uuid primary key default gen_random_uuid(),
  session_id   text not null,            -- anonymous session UUID (lib/session.ts)
  svg          text not null,            -- inline SVG markup (v1; bucket upgrade path above)
  content_hash text not null,            -- SHA-1 of svg (lib/contentHash.ts) — dedupe/cache key
  x            real default 0,           -- desk-canvas placement
  y            real default 0,
  rotation     real default 0,           -- degrees
  created_at   timestamptz default now()
);

comment on table public.doodles is
  'M9 public canvas feed. Anonymous-session honor-system trust model (v1) — see policy comments below.';

-- ----------------------------------------------------------------------------
-- Indexes
-- ----------------------------------------------------------------------------

-- Feed reads newest-first (listDoodles in src/app/lib/publish.ts).
create index if not exists doodles_created_at_idx
  on public.doodles (created_at desc);

-- Client-side mutation scoping + future "my doodles" queries filter on this.
create index if not exists doodles_session_id_idx
  on public.doodles (session_id);

-- Future dedupe / conversion-cache lookups key off the content hash.
create index if not exists doodles_content_hash_idx
  on public.doodles (content_hash);

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------

alter table public.doodles enable row level security;

-- READ: the feed is public by design — anyone can browse the shared canvas.
drop policy if exists "doodles_select_public" on public.doodles;
create policy "doodles_select_public"
  on public.doodles
  for select
  to anon, authenticated
  using (true);

-- INSERT: anonymous publish, session honor system. There is no auth, so
-- session_id is whatever the client claims. Sanity bounds only (no identity
-- verification possible): non-empty session_id, payload size cap to keep
-- abuse cheap to ignore.
drop policy if exists "doodles_insert_anon" on public.doodles;
create policy "doodles_insert_anon"
  on public.doodles
  for insert
  to anon, authenticated
  with check (
    char_length(session_id) between 1 and 64
    and char_length(svg) <= 1048576          -- 1 MB cap; stroke SVGs are far smaller
    and char_length(content_hash) between 1 and 128
  );

-- ============================================================================
-- v1 TRUST MODEL — UPDATE / DELETE (read before judging `using (true)`)
-- ============================================================================
-- "Only mutate rows where session_id matches the caller's session" is NOT
-- enforceable in RLS without auth: every request arrives as the same `anon`
-- role, and any client could claim any session_id. A policy like
-- `using (session_id = <claimed value>)` has no trusted value to compare
-- against — it would be security theater.
--
-- v1 therefore allows anon UPDATE/DELETE broadly and the APP scopes every
-- mutation client-side with .eq('session_id', getSessionId()) — see
-- deleteDoodle in src/app/lib/publish.ts. Honest clients only ever touch
-- their own rows; a hostile client with the publishable key could touch
-- others. Accepted for the makeathon public canvas: low stakes, shared
-- feed, nothing private stored.
--
-- POST-MAKEATHON UPGRADE PATH (pick one):
--   a) Signed session tokens — an Edge Function mints a JWT embedding the
--      session_id; RLS becomes
--      `using (session_id = auth.jwt() ->> 'session_id')`.
--   b) Supabase anonymous sign-ins — auth.uid() exists; store it instead of
--      the localStorage UUID and scope policies on it.
-- ============================================================================

drop policy if exists "doodles_update_anon_v1_trust" on public.doodles;
create policy "doodles_update_anon_v1_trust"
  on public.doodles
  for update
  to anon, authenticated
  using (true)
  with check (
    char_length(session_id) between 1 and 64
    and char_length(svg) <= 1048576
  );

drop policy if exists "doodles_delete_anon_v1_trust" on public.doodles;
create policy "doodles_delete_anon_v1_trust"
  on public.doodles
  for delete
  to anon, authenticated
  using (true);

-- ----------------------------------------------------------------------------
-- Realtime (live shared feed — subscribeDoodles in src/app/lib/publish.ts)
-- ----------------------------------------------------------------------------
-- Adds the table to Supabase's realtime publication so postgres_changes
-- INSERT events reach subscribed clients. Wrapped so re-runs (already a
-- member) and environments without the publication don't fail the script —
-- the client no-ops gracefully if realtime never delivers.

do $$
begin
  alter publication supabase_realtime add table public.doodles;
exception
  when duplicate_object then null;   -- already in the publication (re-run)
  when undefined_object then null;   -- publication absent (non-hosted env)
end $$;
