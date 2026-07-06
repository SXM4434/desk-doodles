-- Reset the public board to a single EMPTY OPEN orchard, then re-seed.
-- ============================================================================
-- WHY: once the orchard filled (120/120) it CLOSED and a second public desk
-- ("The Crooked Ruler Union") opened. publish_to_open_desk targets whatever desk
-- is open — so a seed/draw would land on the SECOND desk, not the orchard, and
-- objects piled up / spilled. This resets the board to ONE open orchard so the
-- seed (and normal drawing) lands back on the Graphite Orchard.
--
-- Run this ONCE in the Supabase SQL Editor, THEN open the local dev app at
-- http://localhost:5182/desk?seedorchard=1 once. Same shared Supabase the Make
-- site reads → the Figma site reflects it. No Make credits needed.
--
-- Only touches PUBLIC desks (owner_id IS NULL). Private desks are untouched.
-- ⚠️ This DELETES the extra public desk(s) and their doodles (test data). If you
--    want to KEEP "The Crooked Ruler Union", delete steps 1–2 and instead just
--    run step 3+4 (but then seeds land on Crooked Ruler Union, not the orchard).
-- ============================================================================

-- 1) Delete doodles on every public desk EXCEPT the orchard (desk_index 0).
delete from public.doodles
 where desk_id in (
   select id from public.desks where owner_id is null and desk_index > 0
 );

-- 2) Delete those extra public desks themselves.
delete from public.desks
 where owner_id is null and desk_index > 0;

-- 3) Wipe the orchard's own doodles.
delete from public.doodles
 where desk_id = (
   select id from public.desks where owner_id is null and desk_index = 0
 );

-- 4) Make the orchard empty + the SOLE open desk so publishes land here.
update public.desks
   set object_count = 0,
       is_open      = true
 where owner_id is null and desk_index = 0;

-- (Optional) confirm: exactly one open public desk, empty.
-- select name, desk_index, is_open, object_count
--   from public.desks where owner_id is null order by desk_index;
