-- Desk Doodles — demo-week RLS hardening (2026-06-11)
-- Paste into Supabase SQL Editor, Run. Closes the gap-sweep security findings:
-- the app is live on a public URL with a public (by-design) anon key, so the
-- policies are the ONLY thing standing between a visitor and the shared feed.

-- 1. DROP anon DELETE entirely. The desk delete-✕ UI is not shipped yet, so
--    nothing legitimate uses anon DELETE — but `using (true)` let ANY visitor
--    wipe every row via one REST call. Re-add a scoped policy when the ✕ lands.
drop policy if exists "doodles_delete_anon_v1_trust" on public.doodles;

-- 2. DROP anon UPDATE for now. Drag-position persistence is nice-to-have, not
--    demo-critical; `using (true)` let any visitor rewrite every row's svg
--    (stored-XSS amplifier). Re-add scoped (e.g. signed session token) post-MVP.
drop policy if exists "doodles_update_anon_v1_trust" on public.doodles;

-- 3. Tighten the INSERT size cap: real stroke doodles are <10KB; 1MB was a
--    storage-DoS hole (free tier ~500MB → ~500 rows fills it). Recreate the
--    INSERT policy with a 64KB svg ceiling + the existing session/hash bounds.
drop policy if exists "doodles_insert_anon" on public.doodles;
create policy "doodles_insert_anon" on public.doodles
  for insert to anon, authenticated
  with check (
    char_length(session_id) between 1 and 64
    and char_length(svg) between 1 and 65536          -- 64KB, was 1MB
    and char_length(content_hash) between 1 and 128
  );

-- SELECT policy (public read) is unchanged — the shared feed must stay readable.
-- Read-side XSS is handled in the CLIENT (DOMPurify on every row before render);
-- RLS cannot parse SVG, so sanitize-on-read is the enforceable layer.
