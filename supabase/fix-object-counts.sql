-- ONE-TIME RECOUNT (2026-06-11): desks.object_count drifted from reality
-- (header said 15/120, gallery chip 10/120) because test rows were inserted
-- directly (bypassing publish_to_open_desk's counter) and then deleted via
-- delete_my_doodle (which DOES decrement) — the counter went stale low.
-- This recomputes every desk's count from the actual rows. Idempotent.
update public.desks d
set object_count = coalesce(c.n, 0)
from (
  select desk_id, count(*) as n
  from public.doodles
  group by desk_id
) c
where c.desk_id = d.id;

-- Desks with zero rows (no join match) also reset to 0:
update public.desks
set object_count = 0
where id not in (select distinct desk_id from public.doodles where desk_id is not null);
