// Supabase Edge Function — image-to-svg (Quiver Arrow proxy) — SCAFFOLD, NOT DEPLOYED.
//
// WHY THIS EXISTS: the client must never hold a hosted vectorizer's API key.
// VITE_-prefixed vars get bundled into the browser (the publishable-key-safe
// rule, CLAUDE.md, forbids a secret there). So the browser posts the image to
// THIS function, which holds QUIVERAI_API_KEY in its Edge secrets and proxies
// the request to Quiver. The browser only ever sends the client-safe ANON key.
//
// This is a Deno function (Supabase Edge runtime — NOT the Vite app bundle, NOT
// the Make drag-drop set, NOT compiled by the app's tsc). It is scaffolded here
// so the integration point is concrete; it is NOT deployed and embeds NO key.
//
// ── TO MAKE IT PRODUCTION (Sebs-side, never commit the key) ──────────────────
//   1) Create a Quiver account → API key (docs.quiver.ai). Vectorizations debit
//      svg_vectorize credits per successful request.
//   2) Set the secret (Supabase secrets, NOT .env, NOT committed):
//        supabase secrets set QUIVERAI_API_KEY=sk-...
//   3) Deploy:
//        supabase functions deploy image-to-svg
//   4) (Optional) the client auto-routes to this function whenever
//      VITE_SUPABASE_URL is set; an explicit VITE_IMAGE_TO_SVG_PROVIDER=quiver
//      flag forces it. The flag is a FLAG, never the key.
//   5) imageToSvg.ts posts here, then runs simplify-to-sketch + sanitizes the
//      returned { svg } through the shared DOMPurify profile.
//
// ── Quiver image→SVG API (verified vs docs.quiver.ai + OpenAPI, 2026-06) ──────
//   POST https://api.quiver.ai/v1/svgs/vectorizations
//   Authorization: Bearer <QUIVERAI_API_KEY>
//   body: { model: 'arrow-1.1' | 'arrow-1.1-max',
//           image: { base64 } | { url },
//           auto_crop?: boolean (default false),
//           target_size?: 128..4096 (square resize),
//           stream?: boolean (default false; we use false for one-shot JSON) }
//   200 → { id, created, credits,
//           data: [ { mime_type: 'image/svg+xml', svg: '<svg>...</svg>' } ],
//           usage: {...} }
//   Rate limit: 20 requests / 60s / organization. Decoded image cap:
//   12582912 bytes / 4096x4096 / 16777216 total px.

// @ts-nocheck — Deno/Edge runtime types are not in the app's tsconfig; this file
// is deployed by the Supabase CLI, not built by Vite. (Kept out of `src/`.)

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const QUIVER_ENDPOINT = 'https://api.quiver.ai/v1/svgs/vectorizations';

// Best-quality variant per Sebs (quality over cost). The client also sends a
// model; this is the fallback if it doesn't.
const DEFAULT_MODEL = 'arrow-1.1-max';

// Mirror the client cap so a giant payload is rejected before it hits Quiver.
// Quiver's decoded cap is 12582912 bytes; base64 inflates ~4/3, so the base64
// string ceiling is ~16.8M chars. Use 18M to leave headroom for the data: noise.
const MAX_BASE64_CHARS = 18 * 1024 * 1024;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);

  const key = Deno.env.get('QUIVERAI_API_KEY');
  if (!key) {
    // Honest 503 until the secret is set — never silently fail or fake output.
    return json({ error: 'image-to-svg not configured (QUIVERAI_API_KEY unset).' }, 503);
  }

  let body: {
    image?: { base64?: string; url?: string };
    model?: string;
    auto_crop?: boolean;
    target_size?: number;
  };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400);
  }

  const image = body.image;
  if (!image || (!image.base64 && !image.url)) {
    return json({ error: 'Missing image.base64 or image.url.' }, 400);
  }
  if (image.base64 && image.base64.length > MAX_BASE64_CHARS) {
    return json({ error: 'Image too large.' }, 413);
  }

  // Clamp target_size to Quiver's documented 128..4096 range if provided.
  let targetSize: number | undefined;
  if (typeof body.target_size === 'number' && Number.isFinite(body.target_size)) {
    targetSize = Math.max(128, Math.min(4096, Math.round(body.target_size)));
  }

  try {
    const upstream = await fetch(QUIVER_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: body.model ?? DEFAULT_MODEL,
        image,
        auto_crop: body.auto_crop ?? true,
        ...(targetSize ? { target_size: targetSize } : {}),
        stream: false,
      }),
    });

    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => '');
      return json({ error: `Quiver error ${upstream.status}`, detail: detail.slice(0, 500) }, 502);
    }

    // Verified response shape: { data: [ { mime_type, svg } ], credits, ... }.
    // Be defensive about minor shape drift: prefer data[0].svg, then a few
    // legacy/alt envelopes, then raw text — but always hand back plain { svg }.
    const ct = upstream.headers.get('content-type') ?? '';
    let svg: string | undefined;
    if (ct.includes('application/json')) {
      const data = await upstream.json();
      svg =
        data?.data?.[0]?.svg ?? // ← the documented shape
        data?.svg ??
        data?.content ??
        data?.output ??
        data?.data?.svg;
    } else {
      svg = await upstream.text();
    }

    if (!svg || !/<svg[\s\S]*<\/svg>/i.test(svg)) {
      return json({ error: 'Quiver returned no usable SVG.' }, 502);
    }
    return json({ svg }, 200);
  } catch (err) {
    return json({ error: `Upstream request failed: ${(err as Error).message}` }, 502);
  }
});

function json(obj: unknown, status: number): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}
