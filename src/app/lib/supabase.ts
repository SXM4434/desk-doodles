import { createClient } from '@supabase/supabase-js';

// Desk Doodles Supabase backend (project: desk-doodles, East US).
// The publishable key is client-safe by design — RLS policies gate all
// access. The baked-in fallbacks keep this file working verbatim when the
// codebase is drag-dropped into Figma Make, where .env files don't travel.
// Secret keys (fal/Tripo) NEVER go here — they live in Supabase Edge
// Function secrets, server-side only.
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ?? 'https://revoukwqlisqdjteortc.supabase.co';
const SUPABASE_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  'sb_publishable_3YwGoTCMKQZFZhgKdvwu3w_GXfX3m80';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
