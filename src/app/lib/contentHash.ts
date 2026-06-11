// Content hashing for pipeline cache keys.
//
// Per docs/research/21-research-3d-pipeline-and-style-translation.md §3:
// `Stage.cacheKey?(input) — SubtleCrypto SHA-1 of normalized input`. SHA-1 is
// fine here — these are cache keys, not security hashes.
//
// Cache points that key off this hash (§3 cache strategy + §5/risk table):
//   • conversion cache (classification / treatment results)
//   • GLB blobs in OPFS (hard-path 3D — biggest cache win)
//   • vision-LLM analysis results (Claude tier-1 = 50 RPM at demo time)
//   • demo pre-warm (hash the demo inputs ahead of time, demo from cache)
//
// Live now — used by publish.ts to stamp each published doodle's content_hash
// (the cache-key column on public.doodles).

/**
 * SHA-1 content hash → lowercase hex string. Strings are hashed over their
 * UTF-8 bytes; Blobs over their raw bytes. Same content always yields the
 * same key, so normalized inputs (see normalizeInput.ts) dedupe across
 * sessions and across the Supabase-cached mode-flip.
 */
export async function contentHash(input: string | Blob): Promise<string> {
  const bytes =
    typeof input === 'string'
      ? new TextEncoder().encode(input)
      : new Uint8Array(await input.arrayBuffer());
  const digest = await crypto.subtle.digest('SHA-1', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
