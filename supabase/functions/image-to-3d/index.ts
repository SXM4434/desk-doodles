// Supabase Edge Function — image-to-3d (the "hard" 3D path).
//
// ⚠️ DEPLOYED 2026-06-16 (Sebs, FAL_KEY set). REVISED 2026-06-16: now WRITES
//    mesh_cache after re-hosting (writeCache), so a repeat gen of the same doodle
//    is a free cache hit. THIS REVISION NEEDS A REDEPLOY to take effect:
//        supabase functions deploy image-to-3d
//    (Until redeployed, gens still work but every regen pays — readCache always
//    misses because nothing writes the row. The client already passes contentHash
//    on both submit AND result.) Requires the mesh_cache table to exist (see
//    "TO MAKE IT PRODUCTION" §3 below).
//
// WHY THIS EXISTS: the client must never hold fal/Tripo API keys. VITE_-prefixed
// vars get bundled into the browser (the publishable-key-safe rule, CLAUDE.md,
// forbids a secret there). So the browser posts the rasterized doodle to THIS
// function, which holds FAL_KEY / TRIPO_KEY in its Edge secrets and proxies
// submit → poll → result to the provider (fal.ai TRELLIS primary, Tripo
// fallback). The browser only ever sends the client-safe ANON key.
//
// This is a Deno function (Supabase Edge runtime — NOT the Vite app bundle, NOT
// the Make drag-drop set, NOT compiled by the app's tsc). It is scaffolded here
// so the integration point is concrete; it is NOT deployed and embeds NO key.
// It mirrors the shape of the existing supabase/functions/image-to-svg/index.ts.
//
// ── CLIENT PROTOCOL (matches src/app/lib/hardPath.ts) ────────────────────────
//   POST  /functions/v1/image-to-3d
//         { imageUrl, contentHash?, provider?, style? }
//     → 200 { jobId, provider, status, queuePosition? }      (job submitted)
//     → 200 { jobId:'', provider, status:'cached', glbUrl, source:'cache' } (cache hit)
//     → 503 { error }                                        (keys unset → honest off)
//   GET   /functions/v1/image-to-3d?jobId=…&provider=…
//     → 200 { status, queuePosition? }                       (poll)
//   GET   /functions/v1/image-to-3d?jobId=…&provider=…&result=1
//     → 200 { glbUrl, source, fileSize? }                    (terminal result)
//
// `provider` is one of: auto | fal-trellis | fal-tripo | tripo-direct.
//
// ── PROVIDER APIs (verified vs live docs, 2026-06-13 — see docs/HARD-3D-PLAN.md) ─
//   fal.ai queue (TRELLIS + Tripo-via-fal), Authorization: Key $FAL_KEY:
//     submit  POST https://queue.fal.run/{model_id}
//             → { request_id, status_url, response_url, cancel_url, queue_position }
//     status  GET  https://queue.fal.run/{model_id}/requests/{request_id}/status
//             → { status: IN_QUEUE | IN_PROGRESS | COMPLETED, queue_position? }
//     result  GET  https://queue.fal.run/{model_id}/requests/{request_id}
//             → { model_mesh: { url, content_type, file_name, file_size }, ... }
//     model ids: fal-ai/trellis  ·  tripo3d/tripo/v2.5/image-to-3d
//   Tripo direct, Authorization: Bearer $TRIPO_KEY:
//     upload  POST https://api.tripo3d.ai/v2/openapi/upload  (or pass image url)
//     create  POST https://api.tripo3d.ai/v2/openapi/task
//             { type:'image_to_model', file:{type,file_token|url},
//               model_version:'v2.5', texture, pbr, style? }
//             → { code:0, data:{ task_id } }
//     poll    GET  https://api.tripo3d.ai/v2/openapi/task/{task_id}
//             → { code:0, data:{ status:queued|running|success|failed|…,
//                                output:{ model, pbr_model } } }
//
// ── TO MAKE IT PRODUCTION (Sebs-side, never commit a key) ────────────────────
//   1) Load credits: a FAL_KEY with credits (TRELLIS ~$0.02/gen; fal gives free
//      signup credits) and/or a TRIPO_KEY (~$0.13/gen). The $50 Tripo dev grant
//      is Game-Hub-only — do NOT count on it (spec §2e).
//   2) Set the secrets (Supabase secrets, NOT .env, NOT committed):
//        supabase secrets set FAL_KEY=...           # never VITE_-prefixed
//        supabase secrets set TRIPO_KEY=...          # only if using Tripo-direct
//   3) Create the Storage bucket + mesh_cache table (HARD-3D-PLAN.md §"Server
//      wiring"): a public-read `meshes` bucket + `mesh_cache(content_hash pk,
//      glb_url, provider, file_size, created_at)` with RLS read-true,
//      service-role writes. (Sebs pastes the SQL like route_cache.)
//   4) Deploy:  supabase functions deploy image-to-3d
//   5) Turn the client ON:  VITE_HARD_PATH_ENABLED=1  (a FLAG, never a key).
//      probeHardPathConfig() flips to configured + isHardPathEnabled() → true.
//
// ⚠️ Until deployed + secrets set, this file does nothing. The client's
//    isHardPathEnabled() is false by default and the fallback ladder uses the
//    local geometry modes. Provider result URLs are short-lived — this function
//    DOWNLOADS the GLB and RE-HOSTS it in Supabase Storage; the client never
//    persists a raw provider URL (spec §7 signed-URL-expiry).

// @ts-nocheck — Deno/Edge runtime types are not in the app's tsconfig; this file
// is deployed by the Supabase CLI, not built by Vite. (Kept out of `src/`.)

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const FAL_QUEUE = 'https://queue.fal.run';
const TRIPO_BASE = 'https://api.tripo3d.ai/v2/openapi';

// fal model ids. TRELLIS primary (cheap, open weights); Tripo-via-fal fallback.
const FAL_MODEL_TRELLIS = 'fal-ai/trellis';
const FAL_MODEL_TRIPO = 'tripo3d/tripo/v2.5/image-to-3d';

// Supabase Storage bucket the re-hosted GLBs land in (public read).
const MESH_BUCKET = 'meshes';
const MESH_CACHE_TABLE = 'mesh_cache';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  const falKey = Deno.env.get('FAL_KEY');
  const tripoKey = Deno.env.get('TRIPO_KEY');
  if (!falKey && !tripoKey) {
    // Honest 503 until at least one provider secret is set — never fake a mesh.
    return json({ error: 'image-to-3d not configured (FAL_KEY/TRIPO_KEY unset).' }, 503);
  }

  try {
    if (req.method === 'POST') return await handleSubmit(req, { falKey, tripoKey });
    if (req.method === 'GET') return await handleStatusOrResult(req, { falKey, tripoKey });
    return json({ error: 'POST or GET only' }, 405);
  } catch (err) {
    return json({ error: `Edge error: ${(err as Error).message}` }, 502);
  }
});

// ─── Submit: cache check → provider dispatch ──────────────────────────────────

async function handleSubmit(req: Request, keys: Keys): Promise<Response> {
  let body: { imageUrl?: string; contentHash?: string; provider?: string; style?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400);
  }
  if (!body.imageUrl) return json({ error: 'Missing imageUrl.' }, 400);

  // 1) content_hash cache: a prior GLB for this doodle → return it free.
  if (body.contentHash) {
    const cached = await readCache(body.contentHash);
    if (cached) {
      return json(
        { jobId: '', provider: cached.provider, status: 'cached', glbUrl: cached.glb_url, source: 'cache', fileSize: cached.file_size },
        200,
      );
    }
  }

  // 2) provider dispatch. 'auto' → TRELLIS via fal if FAL_KEY, else Tripo-direct.
  const provider = pickProvider(body.provider ?? 'auto', keys);
  if (!provider) return json({ error: 'No provider available for the configured keys.' }, 503);

  if (provider === 'tripo-direct') {
    const created = await tripoCreate(body.imageUrl, body.style, keys.tripoKey!);
    return json({ jobId: created.taskId, provider, status: normalizeTripo(created.status) }, 200);
  }

  // fal (TRELLIS or Tripo-via-fal): submit to queue.fal.run/{model_id}.
  const modelId = provider === 'fal-tripo' ? FAL_MODEL_TRIPO : FAL_MODEL_TRELLIS;
  const sub = await falSubmit(modelId, body.imageUrl, keys.falKey!);
  return json(
    { jobId: sub.request_id, provider, status: 'queued', queuePosition: sub.queue_position },
    200,
  );
}

// ─── Status / Result ──────────────────────────────────────────────────────────

async function handleStatusOrResult(req: Request, keys: Keys): Promise<Response> {
  const url = new URL(req.url);
  const jobId = url.searchParams.get('jobId');
  const provider = (url.searchParams.get('provider') ?? 'auto') as ProviderId;
  const wantResult = url.searchParams.get('result') === '1';
  // contentHash rides the RESULT fetch (client appends it) so we can persist the
  // re-hosted GLB under it → the next gen of the same doodle is a free cache hit.
  const contentHash = url.searchParams.get('contentHash') || undefined;
  if (!jobId) return json({ error: 'Missing jobId.' }, 400);

  if (provider === 'tripo-direct') {
    const t = await tripoPoll(jobId, keys.tripoKey!);
    const status = normalizeTripo(t.status);
    if (!wantResult) return json({ status }, 200);
    if (status !== 'succeeded' || !t.modelUrl) return json({ error: 'Not ready.' }, 409);
    const hosted = await downloadAndRehost(t.modelUrl, provider, undefined);
    await writeCache(contentHash, hosted);
    return json({ glbUrl: hosted.glbUrl, source: 'fresh', fileSize: hosted.fileSize }, 200);
  }

  // fal (TRELLIS / Tripo-via-fal).
  const modelId = provider === 'fal-tripo' ? FAL_MODEL_TRIPO : FAL_MODEL_TRELLIS;
  if (!wantResult) {
    const s = await falStatus(modelId, jobId, keys.falKey!);
    return json({ status: normalizeFal(s.status), queuePosition: s.queue_position }, 200);
  }
  const r = await falResult(modelId, jobId, keys.falKey!);
  const meshUrl = r?.model_mesh?.url;
  if (!meshUrl) return json({ error: 'No mesh in result.' }, 409);
  const hosted = await downloadAndRehost(meshUrl, provider, r.model_mesh?.file_size);
  await writeCache(contentHash, hosted);
  return json({ glbUrl: hosted.glbUrl, source: 'fresh', fileSize: hosted.fileSize }, 200);
}

// ─── fal.ai queue calls ───────────────────────────────────────────────────────

async function falSubmit(modelId: string, imageUrl: string, falKey: string) {
  const res = await fetch(`${FAL_QUEUE}/${modelId}`, {
    method: 'POST',
    headers: { Authorization: `Key ${falKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_url: imageUrl }),
  });
  if (!res.ok) throw new Error(`fal submit ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return (await res.json()) as { request_id: string; status_url: string; queue_position?: number };
}

async function falStatus(modelId: string, requestId: string, falKey: string) {
  const res = await fetch(`${FAL_QUEUE}/${modelId}/requests/${requestId}/status`, {
    headers: { Authorization: `Key ${falKey}` },
  });
  if (!res.ok) throw new Error(`fal status ${res.status}`);
  return (await res.json()) as { status: string; queue_position?: number };
}

async function falResult(modelId: string, requestId: string, falKey: string) {
  const res = await fetch(`${FAL_QUEUE}/${modelId}/requests/${requestId}`, {
    headers: { Authorization: `Key ${falKey}` },
  });
  if (!res.ok) throw new Error(`fal result ${res.status}`);
  return (await res.json()) as { model_mesh?: { url: string; file_size?: number } };
}

// ─── Tripo direct calls ───────────────────────────────────────────────────────

async function tripoCreate(imageUrl: string, style: string | undefined, tripoKey: string) {
  // Pass a public image url directly (no upload-to-file_token step needed when
  // the image is already a reachable URL — spec §2c).
  const res = await fetch(`${TRIPO_BASE}/task`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tripoKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'image_to_model',
      model_version: 'v2.5-20250123',
      file: { type: 'jpg', url: imageUrl },
      texture: true,
      pbr: true,
      ...(style ? { style } : {}),
    }),
  });
  if (!res.ok) throw new Error(`tripo create ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = (await res.json()) as { code: number; data?: { task_id: string; status?: string } };
  if (data.code !== 0 || !data.data?.task_id) throw new Error('tripo create returned no task_id');
  return { taskId: data.data.task_id, status: data.data.status ?? 'queued' };
}

async function tripoPoll(taskId: string, tripoKey: string) {
  const res = await fetch(`${TRIPO_BASE}/task/${taskId}`, {
    headers: { Authorization: `Bearer ${tripoKey}` },
  });
  if (!res.ok) throw new Error(`tripo poll ${res.status}`);
  const data = (await res.json()) as {
    code: number;
    data?: { status: string; output?: { model?: string; pbr_model?: string } };
  };
  return { status: data.data?.status ?? 'unknown', modelUrl: data.data?.output?.model };
}

// ─── Download the provider GLB + re-host in Supabase Storage (+ cache) ─────────

async function downloadAndRehost(providerUrl: string, provider: ProviderId, sizeHint?: number) {
  // Provider URLs are short-lived — fetch the GLB bytes NOW.
  const glb = await fetch(providerUrl);
  if (!glb.ok) throw new Error(`GLB download ${glb.status}`);
  const bytes = new Uint8Array(await glb.arrayBuffer());

  const supabase = adminClient();
  const path = `${crypto.randomUUID()}.glb`;
  const up = await supabase.storage.from(MESH_BUCKET).upload(path, bytes, {
    contentType: 'model/gltf-binary',
    upsert: false,
  });
  if (up.error) throw new Error(`storage upload: ${up.error.message}`);
  const { data: pub } = supabase.storage.from(MESH_BUCKET).getPublicUrl(path);
  return { glbUrl: pub.publicUrl, fileSize: sizeHint ?? bytes.byteLength, provider };
}

async function readCache(contentHash: string) {
  const supabase = adminClient();
  const { data } = await supabase
    .from(MESH_CACHE_TABLE)
    .select('glb_url, provider, file_size')
    .eq('content_hash', contentHash)
    .maybeSingle();
  return data as { glb_url: string; provider: ProviderId; file_size?: number } | null;
}

// Persist a re-hosted GLB under its content_hash so a later gen of the SAME
// doodle returns from cache (free). Best-effort: a cache-write failure must NOT
// fail the result response (the GLB is already re-hosted + returned). No-op when
// there's no contentHash (e.g. an ad-hoc gen with no stable key). upsert keeps it
// idempotent if two results race for the same hash.
async function writeCache(
  contentHash: string | undefined,
  hosted: { glbUrl: string; fileSize: number; provider: ProviderId },
) {
  if (!contentHash) return;
  try {
    const supabase = adminClient();
    await supabase.from(MESH_CACHE_TABLE).upsert(
      {
        content_hash: contentHash,
        glb_url: hosted.glbUrl,
        provider: hosted.provider,
        file_size: hosted.fileSize,
      },
      { onConflict: 'content_hash' },
    );
  } catch (_err) {
    // swallow — caching is an optimization, never the success path.
  }
}

// Service-role client (server-side only — the service key never leaves the Edge
// runtime). Distinct from the client's anon key.
function adminClient() {
  const url = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

type ProviderId = 'auto' | 'fal-trellis' | 'fal-tripo' | 'tripo-direct';
type Keys = { falKey?: string; tripoKey?: string };

function pickProvider(requested: string, keys: Keys): ProviderId | null {
  if (requested === 'fal-trellis' || requested === 'fal-tripo') return keys.falKey ? requested : null;
  if (requested === 'tripo-direct') return keys.tripoKey ? 'tripo-direct' : null;
  // auto: prefer cheap TRELLIS via fal; else Tripo-direct.
  if (keys.falKey) return 'fal-trellis';
  if (keys.tripoKey) return 'tripo-direct';
  return null;
}

function normalizeFal(raw: string): string {
  switch ((raw || '').toUpperCase()) {
    case 'IN_QUEUE':
      return 'queued';
    case 'IN_PROGRESS':
      return 'running';
    case 'COMPLETED':
      return 'succeeded';
    default:
      return 'failed';
  }
}

function normalizeTripo(raw: string): string {
  switch ((raw || '').toLowerCase()) {
    case 'queued':
      return 'queued';
    case 'running':
      return 'running';
    case 'success':
      return 'succeeded';
    case 'cancelled':
      return 'cancelled';
    default:
      return 'failed';
  }
}

function json(obj: unknown, status: number): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}
