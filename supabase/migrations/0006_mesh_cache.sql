-- 0006_mesh_cache — cache re-hosted AI-mesh GLBs by the doodle's content hash so a
-- repeat 3D generation of the SAME image returns the cached GLB for FREE instead of
-- paying the provider again. Written/read by the `image-to-3d` edge function
-- (writeCache/readCache, MESH_CACHE_TABLE='mesh_cache'). The function uses the
-- service-role admin client, so RLS never gates it; the read policy is public
-- because the GLB urls are already public-hosted in the `meshes` bucket. Columns
-- match the edge function's upsert/select EXACTLY (content_hash, glb_url, provider,
-- file_size). See supabase/functions/image-to-3d/index.ts + HARD-3D-PLAN.md.

create table if not exists public.mesh_cache (
  content_hash text primary key,
  glb_url      text not null,
  provider     text not null,
  file_size    bigint,
  created_at   timestamptz not null default now()
);

alter table public.mesh_cache enable row level security;

-- Public SELECT (GLB urls are already public). All WRITES go through the
-- service-role edge function only — never the anon / publishable client.
drop policy if exists "mesh_cache public read" on public.mesh_cache;
create policy "mesh_cache public read"
  on public.mesh_cache
  for select
  using (true);
