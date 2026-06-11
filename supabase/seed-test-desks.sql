-- Test data for the desk gallery — paste AFTER schema-v2-desks.sql.
-- Creates 4 closed "past" desks (indexes 1-4) with a few doodles each, so
-- /desks (the wall of walls) has content to browse. The genesis desk (index 0)
-- stays open and keeps whatever real doodles exist. Re-runnable: on-conflict
-- guards prevent dup desks; delete the test doodles by their 'TEST' name if
-- you want a clean slate (delete from doodles where name = 'TEST seed';).
--
-- Direct inserts run as the SQL-Editor role (bypasses the RPC-only desk RLS) —
-- this is a seed utility, not a client path.

-- 4 past desks with fun names (mirrors lib/deskNames.ts flavor), marked closed.
insert into public.desks (desk_index, name, owner_id, is_open, object_cap, object_count)
values
  (1, 'The Coffee-Ring Bureau',  null, false, 120, 4),
  (2, 'Cafecito Margin',         null, false, 120, 3),
  (3, 'Pencil Crumb Committee',  null, false, 120, 5),
  (4, 'The Graphite Orchard',    null, false, 120, 3)
on conflict (desk_index) do nothing;

-- A small bank of stroke-only doodles (hearts, stars, squiggles, circles)
-- scattered across the 4 test desks. viewBox is tight; positions vary.
with d as (
  select desk_index, id from public.desks where desk_index between 1 and 4
)
insert into public.doodles (svg, content_hash, x, y, rotation, desk_id, name, session_id)
select v.svg, md5(v.svg), v.x, v.y, v.rot, d.id, 'TEST seed', 'seed-script'
from (values
  -- desk 1
  (1, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60"><path d="M30 52C8 36 12 14 30 24C48 14 52 36 30 52Z" fill="none" stroke="#1a1a1a" stroke-width="3"/></svg>', 180, 140, -6),
  (1, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60"><path d="M30 6l7 16 17 1-13 11 4 17-15-9-15 9 4-17-13-11 17-1z" fill="none" stroke="#1a1a1a" stroke-width="3"/></svg>', 420, 230, 7),
  (1, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 40"><path d="M6 20C18 4 28 36 40 20S62 4 74 20" fill="none" stroke="#1a1a1a" stroke-width="3"/></svg>', 300, 360, -3),
  (1, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60"><circle cx="30" cy="30" r="22" fill="none" stroke="#1a1a1a" stroke-width="3"/></svg>', 560, 150, 4),
  -- desk 2
  (2, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60"><path d="M30 52C8 36 12 14 30 24C48 14 52 36 30 52Z" fill="none" stroke="#1a1a1a" stroke-width="3"/></svg>', 240, 200, 5),
  (2, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 40"><path d="M6 20C18 4 28 36 40 20S62 4 74 20" fill="none" stroke="#1a1a1a" stroke-width="3"/></svg>', 480, 300, -8),
  (2, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60"><path d="M30 6l7 16 17 1-13 11 4 17-15-9-15 9 4-17-13-11 17-1z" fill="none" stroke="#1a1a1a" stroke-width="3"/></svg>', 360, 130, 2),
  -- desk 3
  (3, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60"><circle cx="30" cy="30" r="22" fill="none" stroke="#1a1a1a" stroke-width="3"/></svg>', 200, 180, 0),
  (3, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60"><path d="M30 52C8 36 12 14 30 24C48 14 52 36 30 52Z" fill="none" stroke="#1a1a1a" stroke-width="3"/></svg>', 420, 240, -5),
  (3, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 40"><path d="M6 20C18 4 28 36 40 20S62 4 74 20" fill="none" stroke="#1a1a1a" stroke-width="3"/></svg>', 300, 380, 6),
  (3, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60"><path d="M30 6l7 16 17 1-13 11 4 17-15-9-15 9 4-17-13-11 17-1z" fill="none" stroke="#1a1a1a" stroke-width="3"/></svg>', 560, 320, 9),
  (3, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60"><circle cx="30" cy="30" r="22" fill="none" stroke="#1a1a1a" stroke-width="3"/></svg>', 140, 340, -2),
  -- desk 4
  (4, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60"><path d="M30 6l7 16 17 1-13 11 4 17-15-9-15 9 4-17-13-11 17-1z" fill="none" stroke="#1a1a1a" stroke-width="3"/></svg>', 260, 160, 3),
  (4, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 40"><path d="M6 20C18 4 28 36 40 20S62 4 74 20" fill="none" stroke="#1a1a1a" stroke-width="3"/></svg>', 440, 280, -7),
  (4, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60"><path d="M30 52C8 36 12 14 30 24C48 14 52 36 30 52Z" fill="none" stroke="#1a1a1a" stroke-width="3"/></svg>', 340, 360, 5)
) as v(desk_index, svg, x, y, rot)
join d on d.desk_index = v.desk_index;

-- Cache a preview thumbnail on each test desk (first doodle's svg) so the
-- gallery shows art without rendering the whole desk.
update public.desks dk
set preview_svg = (
  select dd.svg from public.doodles dd where dd.desk_id = dk.id order by dd.created_at limit 1
)
where dk.desk_index between 1 and 4;
