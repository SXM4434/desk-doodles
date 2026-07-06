# Make prompt — Feature #3: Linked instances (edit a doodle once → every copy updates everywhere)

**You (Sebastian) do TWO things:**
1. **Deploy the SQL** — paste `supabase/schema-v7-linked-instances.sql` into the Supabase SQL Editor and run it once. (It's also pasted at the bottom of this doc so Make can see it.)
2. **Give Make the prompt below** (the "PASTE INTO MAKE" block) so it implements the client wiring in the project.

The schema is backward-compatible: after you run it, every existing doodle becomes its own "source", and every new original auto-links itself. Until the client wiring ships, editing still works — it just updates the single edited row (no propagation yet).

---

## PASTE INTO MAKE

> **Feature: Linked instances.** I added a `source_doodle_id uuid` column to the `doodles` table and two new Supabase RPCs (`set_doodle_source`, `update_doodle_instances`). I want one logical doodle to be able to live as multiple copies (placed on different desks, dropped from the drawer, shared to a shelf), and editing ANY copy should update ALL of them — same new drawing + style everywhere — while each copy keeps its own position/rotation on its own desk. Implement the client side:
>
> **1. Client data layer (`src/app/lib/publish.ts`).**
> - Add `source_doodle_id` to the `DoodleRow` type and include it in EVERY `.select(...)` of the `doodles` table (so it's available on every loaded object).
> - Add `export async function setDoodleSource(id: string, source: string): Promise<boolean>` → `supabase.rpc('set_doodle_source', { p_id: id, p_session: getSessionId(), p_source: source })`. Return `false` gracefully if the RPC is missing (PGRST202) — same pattern as the existing `updateDoodleSvg` / `deleteMyDesk`.
> - Add `export async function updateDoodleInstances(source: string, svg: string, renderConfig: unknown, contentHash?: string): Promise<number>` → `supabase.rpc('update_doodle_instances', { p_source: source, p_session: getSessionId(), p_svg: svg, p_render_config: renderConfig, p_content_hash: contentHash ?? null })`. It returns the number of rows updated; return `0` gracefully if the RPC is missing.
>
> **2. Stamp every COPY at place-time.** A "copy" is created whenever an EXISTING doodle is placed again rather than freshly drawn — i.e. drag/drop or "place on desk" from the **drawer or shelf side-panel**, and any duplicate action. In those code paths (in `DeskPage.tsx` `addObject` — the place-from-shelf branch and the `publishToPrivateDesk` private-desk branch), after the insert returns the new row's `id`, call:
> `void setDoodleSource(newRowId, sourceRow.source_doodle_id ?? sourceRow.id)`
> where `sourceRow` is the drawer/shelf item that was placed. (Use the source's OWN `source_doodle_id` so a copy-of-a-copy still links back to the one true original.) Do NOT stamp freshly DRAWN doodles — the DB trigger auto-links those as their own source.
>
> **3. Propagate on EDIT/SAVE.** In the edit-modal save path (`ObjectSurface.tsx` `handleDone` → the `onConfigSave` / `onObjectUpdate` callbacks that currently call `updateDoodleConfig(id, …)` and `updateDoodleSvg(id, …)`), when the object has a known source, route the save through the instances RPC instead of the single-row RPC:
> - On a re-draw + restyle save: `await updateDoodleInstances(obj.source_doodle_id ?? obj.dbId, newSvg, newConfig, newContentHash)`.
> - On a restyle-only save (config, no svg change): pass the object's CURRENT svg as `newSvg` so the one call updates both columns on every instance (the RPC always rewrites svg + config together).
> - Keep `updateDoodleConfig` / `updateDoodleSvg` as the fallback only when no source id is available.
>
> **4. Update on-screen copies immediately (optimistic).** When a save succeeds, don't just patch the one edited object in local state — patch EVERY loaded object whose `source_doodle_id` matches the edited object's source (same desk could hold two copies; the drawer/shelf panel could show the source). Apply the new `svg` + `renderConfig` to all of them so the change is instant, not waiting on realtime.
>
> **5. Realtime echo.** The existing `subscribeDoodles` postgres-changes subscription already fires one UPDATE event per affected row, so other open clients / other surfaces converge automatically — the per-row "patch object by `dbId === row.id`" handlers already cover it. Just make sure those handlers apply `svg` + `render_config` from the updated row (they should already). No new subscription needed.
>
> **Constraints:** don't propagate `x` / `y` / `rotation` / `desk_id` — those stay per-copy (the RPC already omits them). Everything is owner-scoped by `session_id` (a visitor can only update their own copies). Keep all RPC calls graceful no-ops when the function isn't deployed yet, so the app never throws if the SQL hasn't run.

---

## The SQL (for reference — already in `supabase/schema-v7-linked-instances.sql`)

```sql
-- 1) Column
alter table public.doodles add column if not exists source_doodle_id uuid;
create index if not exists doodles_source_doodle_id_idx on public.doodles (source_doodle_id);

-- 2) Auto-stamp originals (existing insert RPCs need no change)
create or replace function public.doodles_stamp_source() returns trigger
language plpgsql as $$
begin
  if new.source_doodle_id is null then new.source_doodle_id := new.id; end if;
  return new;
end; $$;
drop trigger if exists doodles_stamp_source_trg on public.doodles;
create trigger doodles_stamp_source_trg before insert on public.doodles
  for each row execute function public.doodles_stamp_source();

-- 3) Backfill
update public.doodles set source_doodle_id = id where source_doodle_id is null;

-- 4) Link a placed copy
create or replace function public.set_doodle_source(p_id uuid, p_session text, p_source uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_updated int;
begin
  update public.doodles set source_doodle_id = p_source
   where id = p_id and session_id = p_session;
  get diagnostics v_updated = row_count; return v_updated > 0;
end; $$;
grant execute on function public.set_doodle_source(uuid, text, uuid) to anon, authenticated;

-- 5) Propagate an edit to every instance
create or replace function public.update_doodle_instances(
  p_source uuid, p_session text, p_svg text, p_render_config jsonb, p_content_hash text default null)
returns integer language plpgsql security definer set search_path = public as $$
declare v_updated int;
begin
  if p_svg is null or char_length(p_svg) not between 1 and 65536 then return 0; end if;
  if p_render_config is not null and pg_column_size(p_render_config) > 262144 then return 0; end if;
  update public.doodles
     set svg = p_svg, render_config = p_render_config,
         content_hash = coalesce(p_content_hash, content_hash)
   where source_doodle_id = p_source and session_id = p_session;
  get diagnostics v_updated = row_count; return v_updated;
end; $$;
grant execute on function public.update_doodle_instances(uuid, text, text, jsonb, text) to anon, authenticated;
```
