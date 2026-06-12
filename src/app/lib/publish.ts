// M9 public canvas — typed wrappers over the shared Supabase client.
//
// Per M9 (docs/memory/project_desk_doodles_makeathon.md): anonymous publish
// (session UUID from lib/session.ts, no auth UI) + shared global feed. The
// backing tables are created by supabase/schema.sql (v1, flat feed) then grown
// by supabase/schema-v2-desks.sql (multi-desk) — paste BOTH into the Supabase
// SQL Editor BEFORE wiring these into a page.
//
// v1/v2 TRUST MODEL: RLS lets anon read everything; the desk-aware insert path
// goes through the publish_to_open_desk() RPC (server-side cap + atomic spawn,
// no client race). Mutation scoping ("only delete your own") is still
// honor-system — enforced HERE via .eq('session_id', getSessionId()), not
// server-side. See the policy comments in the SQL files for why + the
// post-makeathon upgrade path (anonymous sign-ins → real owner_id policies).
//
// Wired into the desk flow at /desk (DeskPage) as of 2026-06-11 — schema.sql
// has been run, so publishDoodle / listDoodles / updateDoodlePosition /
// deleteDoodle / subscribeDoodles all hit the live table.
//
// MULTI-DESK GRACEFUL FALLBACK: the desk-aware helpers (getOpenDesk / listDesks)
// catch the "desks table does not exist" error (user hasn't pasted
// schema-v2-desks.sql yet) and return null / [] so callers fall back to flat
// single-desk behavior — the app NEVER crashes on a half-migrated DB.

import { supabase } from './supabase';
import { getSessionId } from './session';
import { contentHash } from './contentHash';
import { deskName } from './deskNames';

/** One row of public.doodles (see supabase/schema.sql + schema-v2-desks.sql). */
export interface DoodleRow {
  id: string;
  session_id: string;
  svg: string;
  content_hash: string;
  x: number;
  y: number;
  rotation: number;
  created_at: string;
  // v2 rich-record fields (null on un-migrated rows / pre-v2 DBs):
  desk_id?: string | null;
  name?: string | null;
  why?: string | null;
  render_config?: Record<string, unknown> | null;
}

/** One row of public.desks (see supabase/schema-v2-desks.sql). */
export interface DeskRow {
  id: string;
  desk_index: number;
  name: string;
  object_cap: number;
  object_count: number;
  is_open: boolean;
  preview_svg: string | null;
  owner_id: string | null;
  created_at: string;
}

/** Input for publishDoodle. Placement + rich-record fields are all optional. */
export interface PublishDoodleInput {
  svg: string;
  x?: number;
  y?: number;
  rotation?: number;
  /** Desk to publish onto. Omit/null → the current open public desk (RPC picks). */
  deskId?: string | null;
  /** Object name — doubles as the ML label (object-model doc §3). */
  name?: string | null;
  /** One-line "why you made it". */
  why?: string | null;
  /** Per-object style snapshot (Smart Hachure style + modifier values). */
  renderConfig?: Record<string, unknown> | null;
}

/** publishDoodle result: the inserted row + the desk it actually landed on. */
export interface PublishDoodleResult {
  row: DoodleRow;
  /** The desk the doodle landed on (possibly a freshly-spawned one). May be
   *  null on a pre-v2 DB (RPC absent → flat insert fallback, no desk concept). */
  desk: DeskRow | null;
}

const TABLE = 'doodles';
const DESKS_TABLE = 'desks';

// Postgres error code for "relation does not exist" — the signal that the user
// has not pasted schema-v2-desks.sql yet. PostgREST surfaces it as 42P01.
const UNDEFINED_TABLE = '42P01';
// PostgREST "could not find the function" — RPC absent (pre-v2 DB).
const UNDEFINED_FUNCTION = 'PGRST202';

/** True when an error means "the v2 desks table / RPC isn't there yet". */
function isMissingV2(err: { code?: string; message?: string } | null): boolean {
  if (!err) return false;
  if (err.code === UNDEFINED_TABLE || err.code === UNDEFINED_FUNCTION) return true;
  const m = (err.message ?? '').toLowerCase();
  return (
    m.includes('does not exist') ||
    m.includes('schema cache') ||
    m.includes('could not find')
  );
}

/**
 * M9 + v2: publish a doodle to the shared public canvas.
 *
 * Stamps the row with this browser's anonymous session id (lib/session.ts)
 * and the SHA-1 content hash of the SVG (lib/contentHash.ts — same key the
 * conversion caches use).
 *
 * v2 path: calls the publish_to_open_desk() RPC so the cap-check + auto-spawn
 * happen SERVER-SIDE in one transaction (no client race). The RPC ignores the
 * passed deskId for which desk to write — it always writes to the current open
 * public desk — and the client supplies the deterministic name for the NEXT
 * desk (lib/deskNames.ts) so DB + client agree if this publish fills the desk.
 * Returns the inserted row AND the (possibly new) desk it landed on.
 *
 * GRACEFUL FALLBACK: on a pre-v2 DB (RPC absent), falls back to the flat v1
 * insert and returns { row, desk: null } so the app still works.
 */
export async function publishDoodle(
  input: PublishDoodleInput,
): Promise<PublishDoodleResult> {
  const {
    svg,
    x = 0,
    y = 0,
    rotation = 0,
    name = null,
    why = null,
    renderConfig = null,
  } = input;
  const content_hash = await contentHash(svg);
  const session_id = getSessionId();

  // The name the NEXT public desk should get if THIS publish fills the current
  // one. We can't know the next index without a round-trip, so peek the open
  // desk; if that's unavailable (pre-v2), the RPC path is moot anyway. The
  // peeked row is REUSED below to resolve the landed desk, so publish costs
  // one desks read total, not two.
  let nextDeskName: string | null = null;
  const openDesk = await getOpenDesk();
  if (openDesk) nextDeskName = deskName(openDesk.desk_index + 1);

  const { data, error } = await supabase.rpc('publish_to_open_desk', {
    p_session_id: session_id,
    p_svg: svg,
    p_content_hash: content_hash,
    p_x: x,
    p_y: y,
    p_rot: rotation,
    p_name: name,
    p_why: why,
    p_render_config: renderConfig,
    p_next_desk_name: nextDeskName,
  });

  if (error) {
    // Pre-v2 DB (RPC not created yet) → fall back to the flat v1 insert.
    if (isMissingV2(error)) {
      const { data: flat, error: flatErr } = await supabase
        .from(TABLE)
        .insert({ session_id, svg, content_hash, x, y, rotation })
        .select()
        .single();
      if (flatErr) throw new Error(`publishDoodle failed: ${flatErr.message}`);
      return { row: flat as DoodleRow, desk: null };
    }
    throw new Error(`publishDoodle failed: ${error.message}`);
  }

  const row = data as DoodleRow;
  // Resolve the desk the row landed on WITHOUT a second desks round-trip: in
  // the common case the row lands on the open desk peeked above, and the RPC's
  // post-state is fully determined from that peek (object_count + 1; the RPC
  // closes the desk at cap) — the same snapshot the old re-read fetched. Only
  // when the peek missed (null on a fresh DB → genesis spawn, or the open desk
  // advanced between peek and RPC) do we actually fetch the landed desk
  // (best-effort — null if the lookup fails).
  let desk: DeskRow | null = null;
  if (row.desk_id) {
    if (openDesk && openDesk.id === row.desk_id) {
      const object_count = openDesk.object_count + 1;
      desk = {
        ...openDesk,
        object_count,
        is_open: object_count >= openDesk.object_cap ? false : openDesk.is_open,
      };
    } else {
      const { data: deskData } = await supabase
        .from(DESKS_TABLE)
        .select('*')
        .eq('id', row.desk_id)
        .single();
      desk = (deskData as DeskRow) ?? null;
    }
  }
  return { row, desk };
}

/**
 * v2: the current open PUBLIC desk row, or null.
 *
 * Returns the open public desk with the highest index (the "live" one). The
 * genesis desk is seeded by schema-v2-desks.sql and the RPC opens the next one
 * on the publish that fills a desk, so this is a pure read — if it returns null
 * on a migrated DB the next publishDoodle's RPC will open the genesis desk.
 *
 * GRACEFUL FALLBACK: on a pre-v2 DB (desks table absent) returns null so
 * callers fall back to flat single-desk behavior.
 */
export async function getOpenDesk(): Promise<DeskRow | null> {
  const { data, error } = await supabase
    .from(DESKS_TABLE)
    .select('*')
    .eq('is_open', true)
    .is('owner_id', null)
    .order('desk_index', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    if (isMissingV2(error)) return null; // pre-v2 DB → flat fallback
    throw new Error(`getOpenDesk failed: ${error.message}`);
  }
  return (data as DeskRow) ?? null;
}

/**
 * v2: all PUBLIC desks, newest-first (for the gallery).
 *
 * GRACEFUL FALLBACK: on a pre-v2 DB returns [] so the gallery renders empty
 * rather than crashing.
 */
export async function listDesks(limit = 100): Promise<DeskRow[]> {
  const { data, error } = await supabase
    .from(DESKS_TABLE)
    .select('*')
    .is('owner_id', null)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) {
    if (isMissingV2(error)) return []; // pre-v2 DB → empty gallery
    throw new Error(`listDesks failed: ${error.message}`);
  }
  return (data ?? []) as DeskRow[];
}

/**
 * M9: read the shared feed, newest first.
 *
 * Public by design — RLS grants anon SELECT on everything. Default limit 200
 * keeps the first desk-canvas paint cheap; pagination is post-MVP (S13
 * multi-desk pagination).
 */
export async function listDoodles(limit = 200): Promise<DoodleRow[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(`listDoodles failed: ${error.message}`);
  return (data ?? []) as DoodleRow[];
}

/**
 * v2: read one desk's doodles, newest-first. Like listDoodles but filtered by
 * desk_id — the gallery + per-desk view use this so each desk only pays the
 * rough.js render cost for its own (capped) object set.
 */
export async function listDoodlesForDesk(
  deskId: string,
  limit = 200,
): Promise<DoodleRow[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('desk_id', deskId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(`listDoodlesForDesk failed: ${error.message}`);
  return (data ?? []) as DoodleRow[];
}

/**
 * M9: persist a dragged doodle's new position/rotation. Session-scoped via
 * the same v1 honor-system where-clause as deleteDoodle — only this
 * session's rows actually move; a 0-row match resolves false silently.
 */
export async function updateDoodlePosition(
  id: string,
  x: number,
  y: number,
  rotation: number,
): Promise<boolean> {
  // v2+ DROPS the open anon UPDATE policy (security), so a direct .update()
  // silently no-ops. Route through the session-scoped SECURITY DEFINER RPC
  // (move_my_doodle), which enforces session_id server-side. Fall back to the
  // direct update on a pre-v3 DB where the RPC isn't installed yet.
  const { data, error } = await supabase.rpc('move_my_doodle', {
    p_id: id,
    p_session: getSessionId(),
    p_x: x,
    p_y: y,
    p_rotation: rotation,
  });
  if (error) {
    if (isMissingV2(error)) {
      const fb = await supabase
        .from(TABLE)
        .update({ x, y, rotation })
        .eq('id', id)
        .eq('session_id', getSessionId())
        .select('id');
      return (fb.data ?? []).length > 0;
    }
    throw new Error(`updateDoodlePosition failed: ${error.message}`);
  }
  return data === true;
}

/**
 * M9: delete one of THIS session's doodles.
 *
 * The session scope lives in the .eq('session_id', …) where-clause — the v1
 * honor-system trust model (see supabase/schema.sql). Resolves true if a row
 * was deleted, false if nothing matched (wrong id, or a row this session
 * doesn't own — the where-clause makes that a silent 0-row delete).
 */
export async function deleteDoodle(id: string): Promise<boolean> {
  // Same as updateDoodlePosition: v2+ drops the open anon DELETE policy, so go
  // through the session-scoped delete_my_doodle RPC (also decrements the desk
  // object_count). Fall back to a direct delete on a pre-v3 DB.
  const { data, error } = await supabase.rpc('delete_my_doodle', {
    p_id: id,
    p_session: getSessionId(),
  });
  if (error) {
    if (isMissingV2(error)) {
      const fb = await supabase
        .from(TABLE)
        .delete()
        .eq('id', id)
        .eq('session_id', getSessionId())
        .select('id');
      return (fb.data ?? []).length > 0;
    }
    throw new Error(`deleteDoodle failed: ${error.message}`);
  }
  return data === true;
}

/**
 * Edit-mode save: rename / re-why one of your own doodles. Routes through the
 * session-scoped update_my_doodle_meta RPC (schema-v3). Resolves true if a row
 * matched. No-op fallback returns false on a pre-v3 DB (the RPC isn't there).
 */
export async function updateDoodleMeta(
  id: string,
  name: string | null,
  why: string | null,
): Promise<boolean> {
  const { data, error } = await supabase.rpc('update_my_doodle_meta', {
    p_id: id,
    p_session: getSessionId(),
    p_name: name,
    p_why: why,
  });
  if (error) {
    if (isMissingV2(error)) return false;
    throw new Error(`updateDoodleMeta failed: ${error.message}`);
  }
  return data === true;
}

/**
 * v4: persist an Edit-mode restyle — write a new render_config onto one of
 * your own doodles. Routes through the session-scoped update_my_doodle_config
 * SECURITY DEFINER RPC (supabase/schema-v4-config.sql — same pattern + grants
 * as the v3 RPCs). Resolves true if a row matched.
 *
 * GRACEFUL NO-RPC FALLBACK: on a DB where schema-v4-config.sql hasn't been
 * pasted yet, the RPC is absent (PGRST202 / schema-cache miss) → returns
 * false so the caller can say "saved locally" honestly instead of lying.
 * There is deliberately NO direct-table fallback here: v2+ dropped the open
 * anon UPDATE policy, so a direct .update() would silently no-op anyway.
 */
export async function updateDoodleConfig(
  id: string,
  renderConfig: Record<string, unknown>,
): Promise<boolean> {
  const { data, error } = await supabase.rpc('update_my_doodle_config', {
    p_id: id,
    p_session: getSessionId(),
    p_render_config: renderConfig,
  });
  if (error) {
    if (isMissingV2(error)) return false; // pre-v4 DB — RPC not installed yet
    throw new Error(`updateDoodleConfig failed: ${error.message}`);
  }
  return data === true;
}

/**
 * v4 helper: resolve a doodle ROW from its svg markup via the content_hash
 * column (the same SHA-1 cache key publishDoodle stamps at insert).
 *
 * Why it exists: the object surface (Edit/Sandbox popup) receives an object's
 * MARKUP from DeskPage but not its row id / stored render_config. Until the
 * caller passes those through (the clean contract — ObjectSurfaceData.id /
 * .renderConfig), this lookup recovers them so Edit can initialize from the
 * object's real config and persist on Done. scope 'mine' adds the session_id
 * filter (Edit — your own row); 'any' matches any maker (Sandbox baseline).
 *
 * Best-effort by design: returns null on any error (missing table, network,
 * no match) — callers fall back to the current pen values. Known limit: the
 * hash is computed over the markup AS HELD by the caller; DeskPage sanitizes
 * on read, so a sanitizer that rewrites the stored markup would miss here
 * (the sanitize round-trip is idempotent for our own published markup, which
 * was already sanitized at the add boundary). Newest row wins on duplicate
 * content.
 */
export async function findDoodleBySvg(
  svg: string,
  scope: 'mine' | 'any' = 'mine',
): Promise<DoodleRow | null> {
  try {
    const hash = await contentHash(svg);
    let query = supabase
      .from(TABLE)
      .select('*')
      .eq('content_hash', hash)
      .order('created_at', { ascending: false })
      .limit(1);
    if (scope === 'mine') query = query.eq('session_id', getSessionId());
    const { data, error } = await query.maybeSingle();
    if (error) return null;
    return (data as DoodleRow) ?? null;
  } catch {
    return null;
  }
}

/**
 * M9: subscribe to new doodles landing on the shared feed (live canvas).
 *
 * Listens for postgres_changes INSERT events on public.doodles (the table is
 * added to the realtime publication by supabase/schema.sql). Graceful no-op
 * when realtime is unavailable: channel setup failures are swallowed and the
 * callback simply never fires — the feed still works via listDoodles on
 * load/refresh. Returns an unsubscribe function (call it on unmount).
 */
export function subscribeDoodles(onInsert: (row: DoodleRow) => void): () => void {
  try {
    const channel = supabase
      .channel('public:doodles')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: TABLE },
        (payload) => {
          onInsert(payload.new as DoodleRow);
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  } catch {
    // Realtime unavailable (blocked socket / Make preview quirk) — no-op.
    return () => {};
  }
}

/**
 * v2: subscribe to new doodles landing on ONE desk (live per-desk feed).
 *
 * Same as subscribeDoodles but the realtime postgres_changes filter scopes to
 * `desk_id=eq.<deskId>` so you only get live inserts for the desk you're
 * looking at — not the whole world (the multi-desk point). Graceful no-op when
 * realtime is unavailable. Returns an unsubscribe function (call on unmount).
 */
export function subscribeDoodlesForDesk(
  deskId: string,
  onInsert: (row: DoodleRow) => void,
): () => void {
  try {
    const channel = supabase
      .channel(`public:doodles:desk:${deskId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: TABLE,
          filter: `desk_id=eq.${deskId}`,
        },
        (payload) => {
          onInsert(payload.new as DoodleRow);
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  } catch {
    // Realtime unavailable (blocked socket / Make preview quirk) — no-op.
    return () => {};
  }
}
