// Personal-space data layer — profiles (handles), private desks, drawer.
//
// Typed wrappers over the Supabase RPCs added by supabase/migrations/
// (0001 profiles, 0002 anon-auth RLS, 0003 private desks + drawer). Mirrors the
// shape + graceful-fallback discipline of lib/publish.ts: every call swallows
// the "table/function does not exist" error (migrations not applied yet) and
// returns a null/empty/false result so the app NEVER crashes on a DB that
// hasn't run the personal-space migrations.
//
// ⚠️  FLAGGED OFF BY DEFAULT. isPersonalSpaceEnabled() gates whether the UI
//     wires any of this. Until the migrations are applied + Sebs flips the flag,
//     these helpers are dormant — nothing calls the live DB. This keeps the
//     stream DB-SAFE (no live mutation) and lets DeskPage integrate behind one
//     boolean.

import { supabase } from './supabase';
import { getSessionId } from './session';
import { contentHash } from './contentHash';
import { handleFromId } from './handle';
import type { DeskRow, DoodleRow } from './publish';

// ─── Feature flag ────────────────────────────────────────────────────────────
// Off until: (1) migrations 0001-0003 applied, (2) anon-auth swap done (or the
// honor-system era is accepted), (3) Sebs flips it on. Reads an env var so Make
// + local can toggle without a code edit; defaults OFF.
export function isPersonalSpaceEnabled(): boolean {
  try {
    return import.meta.env.VITE_PERSONAL_SPACE === '1';
  } catch {
    return false;
  }
}

// ─── Identity (swappable to anon-auth) ───────────────────────────────────────
// TODAY this returns the localStorage UUID (lib/session.ts). After the anon-auth
// swap, change getSessionId() itself to return supabase.auth.signInAnonymously()
// .user.id (the SDK persists it in localStorage, so "never blank, no wall" holds)
// — then this helper + every owner_id/session_id keyed off it become a real
// auth.uid(). Keeping the indirection here documents the single swap point.
export function getIdentityId(): string {
  return getSessionId();
}

// Postgres "relation does not exist" / PostgREST "function not found" — the
// signal that a personal-space migration hasn't been applied. (Same codes
// lib/publish.ts checks.)
function isMissing(err: { code?: string; message?: string } | null): boolean {
  if (!err) return false;
  if (err.code === '42P01' || err.code === 'PGRST202') return true;
  const m = (err.message ?? '').toLowerCase();
  return m.includes('does not exist') || m.includes('schema cache') || m.includes('could not find');
}

// ─── Profiles / handles ──────────────────────────────────────────────────────

export interface ProfileRow {
  id: string;
  handle: string;
  handle_source: 'generated' | 'rerolled' | 'custom' | string;
  avatar_svg: string | null;
  created_at: string;
  updated_at: string;
}

/** Read the caller's profile (handle), or null if none yet / pre-migration. */
export async function getMyProfile(): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', getIdentityId())
    .maybeSingle();
  if (error) {
    if (isMissing(error)) return null; // pre-migration → no profile
    throw new Error(`getMyProfile failed: ${error.message}`);
  }
  return (data as ProfileRow) ?? null;
}

/** Read one profile by id (for rendering another person's handle). */
export async function getProfile(id: string): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) {
    if (isMissing(error)) return null;
    throw new Error(`getProfile failed: ${error.message}`);
  }
  return (data as ProfileRow) ?? null;
}

/**
 * Claim (or update) the caller's handle. Resolves:
 *   'claimed'      — the handle is now yours
 *   'taken'        — someone else owns it (caller should reroll / append token)
 *   'unavailable'  — pre-migration DB (RPC absent) — caller falls back to the
 *                    deterministic local handle (handleFromId) with no persistence
 */
export async function claimHandle(
  handle: string,
  source: 'generated' | 'rerolled' | 'custom' = 'generated',
): Promise<'claimed' | 'taken' | 'unavailable'> {
  const { data, error } = await supabase.rpc('claim_handle', {
    p_id: getIdentityId(),
    p_handle: handle,
    p_source: source,
  });
  if (error) {
    if (isMissing(error)) return 'unavailable';
    throw new Error(`claimHandle failed: ${error.message}`);
  }
  return data === true ? 'claimed' : 'taken';
}

/** The caller's effective handle: their claimed one, else the deterministic
 *  local fallback so the UI always has a friendly label even pre-onboarding. */
export async function getEffectiveHandle(): Promise<string> {
  const profile = await getMyProfile().catch(() => null);
  return profile?.handle ?? handleFromId(getIdentityId());
}

// ─── Private desks ───────────────────────────────────────────────────────────

/** Create a new private desk owned by the caller. Returns the desk, or null
 *  pre-migration. */
export async function createPrivateDesk(name = 'My Desk'): Promise<DeskRow | null> {
  const { data, error } = await supabase.rpc('create_private_desk', {
    p_session: getIdentityId(),
    p_name: name,
  });
  if (error) {
    if (isMissing(error)) return null;
    throw new Error(`createPrivateDesk failed: ${error.message}`);
  }
  return (data as DeskRow) ?? null;
}

/** List the caller's private desks (owner_id = me), newest-first. [] pre-migration. */
export async function listMyDesks(): Promise<DeskRow[]> {
  const { data, error } = await supabase
    .from('desks')
    .select('*')
    .eq('owner_id', getIdentityId())
    .order('created_at', { ascending: false });
  if (error) {
    if (isMissing(error)) return [];
    throw new Error(`listMyDesks failed: ${error.message}`);
  }
  return (data ?? []) as DeskRow[];
}

// ─── Personal drawer ─────────────────────────────────────────────────────────
// A drawer doodle = owner_id is me AND desk_id is null.

/** Save a doodle into the caller's personal drawer (separate from any desk). */
export async function stashToDrawer(input: {
  svg: string;
  name?: string | null;
  why?: string | null;
  renderConfig?: Record<string, unknown> | null;
}): Promise<DoodleRow | null> {
  const content_hash = await contentHash(input.svg);
  const { data, error } = await supabase.rpc('stash_to_drawer', {
    p_session: getIdentityId(),
    p_svg: input.svg,
    p_content_hash: content_hash,
    p_name: input.name ?? null,
    p_why: input.why ?? null,
    p_render_config: input.renderConfig ?? null,
  });
  if (error) {
    if (isMissing(error)) return null;
    throw new Error(`stashToDrawer failed: ${error.message}`);
  }
  return (data as DoodleRow) ?? null;
}

/** List the caller's drawer doodles (owner = me, not on any desk). [] pre-migration. */
export async function listMyDrawer(limit = 100): Promise<DoodleRow[]> {
  const { data, error } = await supabase
    .from('doodles')
    .select('*')
    .eq('owner_id', getIdentityId())
    .is('desk_id', null)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) {
    if (isMissing(error)) return [];
    throw new Error(`listMyDrawer failed: ${error.message}`);
  }
  return (data ?? []) as DoodleRow[];
}

/** Move a drawer doodle onto a desk (clears it from the drawer). */
export async function placeFromDrawer(
  id: string,
  deskId: string,
  x = 0,
  y = 0,
  rotation = 0,
): Promise<boolean> {
  const { data, error } = await supabase.rpc('place_from_drawer', {
    p_id: id,
    p_session: getIdentityId(),
    p_desk_id: deskId,
    p_x: x,
    p_y: y,
    p_rot: rotation,
  });
  if (error) {
    if (isMissing(error)) return false;
    throw new Error(`placeFromDrawer failed: ${error.message}`);
  }
  return data === true;
}
