// Image → SVG seam (the "Upload image" input path).
//
// A raster image (PNG/JPG/WebP) becomes a SIMPLER HAND-DRAWN SKETCH in SVG, then
// re-enters the SAME pipeline as Draw / Upload-SVG: the markup is sanitized
// through svgUpload's `sanitizeSvgMarkup`, then the caller hands it to the desk's
// add boundary exactly like an uploaded .svg (normalizeSvgSize sizes it, the
// SvgStyleTransform 2D styles restyle it, strokeTo3d's 3D path converts it).
//
// ── LOCKED FEATURE (Sebs, DECISIONS-FOR-SEBS.md "Image-mode refinement") ──────
//  1. Best-QUALITY provider: Quiver Arrow via a Supabase EDGE FUNCTION
//     (api.quiver.ai/v1/svgs/vectorizations, Bearer key, model arrow-1.1-max).
//     Quality over key-convenience — NOT the free-vtracer path.
//  2. The output must be a SIMPLER SKETCH of the photo: abstract it to a few
//     hand-drawn strokes that fit the Desk Doodles look — NOT a detailed /
//     photo-real vectorization. The simplify-to-sketch step (simplifyToSketch.ts)
//     IS part of the conversion and runs AFTER the trace, BEFORE the desk gets it.
//
// PROVIDER INTERFACE — the conversion engine is swappable behind one type so the
// caller never changes when the engine does. Today: the hosted Quiver provider
// (best quality) and an honest unconfigured default (never fakes linework).
//
// ── KEY HANDLING (publishable-key-safe rule, CLAUDE.md) ──────────────────────
// QUIVERAI_API_KEY is a SECRET. It is NEVER VITE_-prefixed, NEVER in client code,
// NEVER committed. It lives only in the Supabase Edge function's secrets and is
// used only inside that function. The browser calls our Edge function
// `image-to-svg` (authorized by the client-safe ANON/publishable key); the Edge
// function holds the Quiver secret and proxies the request. Client-side we read
// only VITE_ FLAGS/URLs (provider flag, Supabase URL/anon key), never a secret.

import { sanitizeSvgMarkup } from './svgUpload';
import {
  simplifyToSketch,
  DEFAULT_SKETCHIFY,
  type SketchifyOptions,
  type SketchifyResult,
} from './simplifyToSketch';

// ── Result + validation ──────────────────────────────────────────────────────

export type ImageToSvgResult =
  | { ok: true; markup: string; sketch?: SketchifyResult['stats'] }
  | { ok: false; error: string };

// Mirror svgUpload's caps philosophy (OWASP/Fortinet attack-surface guidance):
// reject oversized input BEFORE handing it to any parser/encoder/network call.
// Raster source files are bigger than SVGs (a phone photo is multi-MB), so the
// raw-input cap is more generous than svgUpload's 2 MiB — but it is still a hard
// ceiling so a 50 MB drop never freezes the tab or runs up a hosted bill. 12 MiB
// is also Quiver's documented per-image decoded cap (12582912 bytes).
const MAX_IMAGE_BYTES = 12 * 1024 * 1024; // 12 MiB — also Quiver's per-image cap
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const ACCEPTED_EXT = /\.(png|jpe?g|webp)$/i;

function bytesToReadable(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  return `${Math.max(1, Math.round(bytes / 1024))}KB`;
}

/** True for raster image files this seam knows how to trace. SVGs are NOT a
 *  raster image — they go through prepareSvgUpload directly (the caller routes
 *  by type), so an .svg here is a caller bug and rejected. */
export function isRasterImageFile(file: File): boolean {
  return ACCEPTED_TYPES.includes(file.type) || ACCEPTED_EXT.test(file.name);
}

function validateImage(file: File): { ok: true } | { ok: false; error: string } {
  if (!isRasterImageFile(file)) {
    return { ok: false, error: `Not a PNG/JPG/WebP image: ${file.name}` };
  }
  // file.size is the raw byte length — zero-cost, checked before any read.
  if (file.size > MAX_IMAGE_BYTES) {
    return {
      ok: false,
      error: `Image too large (${bytesToReadable(file.size)}). Max ${bytesToReadable(
        MAX_IMAGE_BYTES,
      )}.`,
    };
  }
  return { ok: true };
}

// ── Provider interface (swappable engines) ──────────────────────────────────

/** A conversion engine: takes a validated raster File, returns raw SVG markup
 *  (UNSANITIZED, UN-SIMPLIFIED — imageToSvg sanitizes + sketchifies every
 *  provider's output uniformly) or a user-facing error. `needsKey` documents
 *  whether the provider depends on a server-side secret (drives selection +
 *  honest UI copy). */
export interface ImageToSvgProvider {
  readonly id: string;
  readonly label: string;
  /** True if this provider needs a server-side API key (hosted). The default is
   *  false (no account, no key — keeps the build runnable + honest). */
  readonly needsKey: boolean;
  convert(file: File): Promise<{ ok: true; markup: string } | { ok: false; error: string }>;
}

// ── QUIVER provider (hosted, best quality, via Supabase Edge Function) ────────
//
// Quiver image→SVG IS a real API (verified against the QuiverAI public-beta docs
// + OpenAPI, 2026-06):
//   POST https://api.quiver.ai/v1/svgs/vectorizations
//   Authorization: Bearer <QUIVERAI_API_KEY>
//   body: { model: 'arrow-1.1' | 'arrow-1.1-max',
//           image: { base64 } | { url },
//           auto_crop?: boolean (default false),
//           target_size?: 128..4096 (square resize),
//           stream?: boolean (default false) }
//   → 200 { id, created, credits, data: [{ mime_type:'image/svg+xml', svg }], usage }
//   (docs.quiver.ai/api-reference/vectorize-svg/image-to-svg)
//
// The key is a SECRET → it must NOT reach the browser. So the client does NOT
// call api.quiver.ai directly; it calls our Supabase Edge Function
// `image-to-svg`, which holds QUIVERAI_API_KEY in its secrets and proxies the
// request, returning a normalized `{ svg }`. The Edge function is scaffolded
// under supabase/functions/image-to-svg/ (NOT deployed here — artifact only).
//
// Best-quality default: model 'arrow-1.1-max' (Sebs: quality over cost). The
// Edge function may downscale via target_size — a smaller source naturally
// yields fewer, cleaner paths, which helps the simplify-to-sketch step. This is
// the DEFAULT/active provider per the locked feature; selectProvider() makes it
// active whenever the Supabase URL is configured, falling back to the honest
// unconfigured provider only when it is not.
const EDGE_FUNCTION_PATH = '/functions/v1/image-to-svg';
const QUIVER_MODEL = 'arrow-1.1-max'; // best-quality variant (Sebs locked)

const QUIVER_PROVIDER: ImageToSvgProvider = {
  id: 'quiver',
  label: 'Quiver Arrow (best quality)',
  needsKey: true,
  async convert(file: File) {
    const base = readEnv('VITE_SUPABASE_URL');
    const anon = readEnv('VITE_SUPABASE_ANON_KEY');
    if (!base) {
      return {
        ok: false,
        error: 'Image tracing needs VITE_SUPABASE_URL to reach the Edge function.',
      };
    }
    try {
      const base64 = await fileToBase64(file);
      const res = await fetch(`${base.replace(/\/$/, '')}${EDGE_FUNCTION_PATH}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // The ANON (publishable) key authorizes the Edge invoke — it is
          // client-safe by design; the SECRET QUIVERAI_API_KEY lives only in
          // the Edge function's environment, never here.
          ...(anon ? { Authorization: `Bearer ${anon}`, apikey: anon } : {}),
        },
        body: JSON.stringify({
          image: { base64 },
          model: QUIVER_MODEL,
          // Downscale the source so the trace is naturally simpler (fewer paths)
          // — the simplify step then abstracts the rest to a few strokes.
          target_size: 768,
          auto_crop: true,
        }),
      });
      if (!res.ok) {
        // Edge function returns honest JSON errors ({ error }); surface them.
        let detail = '';
        try {
          const j = (await res.json()) as { error?: string };
          detail = j.error ? ` — ${j.error}` : '';
        } catch {
          /* non-JSON body */
        }
        return {
          ok: false,
          error: `Tracer service error (${res.status})${detail}. Try draw or SVG upload.`,
        };
      }
      const data = (await res.json()) as { svg?: string; error?: string };
      if (data.error) return { ok: false, error: data.error };
      if (!data.svg || !/<svg[\s\S]*<\/svg>/i.test(data.svg)) {
        return { ok: false, error: 'Tracer returned no usable SVG.' };
      }
      return { ok: true, markup: data.svg };
    } catch (err) {
      return { ok: false, error: `Tracer request failed: ${(err as Error).message}` };
    }
  },
};

// ── DEFAULT / unconfigured provider — honest, never fakes ─────────────────────
//
// Desk Doodles forbids fake/stub UI that pretends to work (feedback_actual_ml_
// not_fake's spirit). When the Quiver Edge function is not configured (no
// Supabase URL / secret unset), the seam returns a clear "not wired" error
// instead of fabricating linework. The integration steps are in
// supabase/functions/image-to-svg/index.ts + docs/IMAGE-MODE-PLAN.md.
const UNCONFIGURED_PROVIDER: ImageToSvgProvider = {
  id: 'unconfigured',
  label: 'Image tracing (not configured)',
  needsKey: false,
  async convert(_file: File) {
    return {
      ok: false,
      error:
        'Image tracing is not configured yet (Quiver Edge function needs ' +
        'VITE_SUPABASE_URL + the QUIVERAI_API_KEY secret). For now, draw it or ' +
        'upload an SVG.',
    };
  },
};

// ── Provider selection ───────────────────────────────────────────────────────

const PROVIDERS: Record<string, ImageToSvgProvider> = {
  [QUIVER_PROVIDER.id]: QUIVER_PROVIDER,
  [UNCONFIGURED_PROVIDER.id]: UNCONFIGURED_PROVIDER,
};

/** Read a Vite env var safely in any bundler context (Make included). Only
 *  VITE_-prefixed values are ever read here — and only FLAGS/URLs, never a
 *  secret key (secrets live in Edge-function secrets). */
function readEnv(key: string): string | undefined {
  try {
    const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
    return env?.[key];
  } catch {
    return undefined;
  }
}

/** Pick the active provider. Per the locked feature, the BEST-QUALITY Quiver
 *  Edge path is the default whenever Supabase is configured (VITE_SUPABASE_URL
 *  present). When it isn't, fall back to the honest unconfigured provider so the
 *  build stays runnable and never fakes output. An explicit
 *  VITE_IMAGE_TO_SVG_PROVIDER flag overrides selection (a FLAG, never a key). */
function selectProvider(): ImageToSvgProvider {
  const flag = readEnv('VITE_IMAGE_TO_SVG_PROVIDER');
  if (flag && PROVIDERS[flag]) return PROVIDERS[flag];
  if (readEnv('VITE_SUPABASE_URL')) return QUIVER_PROVIDER;
  return UNCONFIGURED_PROVIDER;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** File → base64 string (no data: prefix) for the hosted request body. */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the image file.'));
    reader.onload = () => {
      const result = reader.result as string;
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.readAsDataURL(file);
  });
}

// ── Public entry point ───────────────────────────────────────────────────────

/**
 * Convert a raster image File to sanitized, SIMPLIFIED-TO-SKETCH SVG markup
 * ready for the desk pipeline. Pipeline:
 *
 *   validate (type + size cap)
 *     → selected provider (Quiver Edge, best quality) returns a faithful trace
 *     → simplifyToSketch() abstracts the trace to a few hand-drawn strokes
 *       (the differentiator: path-salience filter + RDP + fill→outline)
 *     → sanitizeSvgMarkup() (the SAME DOMPurify SVG profile every uploaded/DB
 *       SVG passes through — a hosted provider can never inject script/etc.)
 *
 * The returned `markup` is the exact thing the caller hands to the desk add
 * boundary — identical contract to a prepared .svg upload — plus `sketch` stats
 * for honest UI copy + the smart-layer dataset.
 *
 * `sketchify` lets a caller tune the abstraction (or pass `false` to skip it and
 * get the raw trace — e.g. if the user explicitly wants a faithful vectorize).
 */
export async function imageToSvg(
  file: File,
  sketchify: Partial<SketchifyOptions> | false = {},
): Promise<ImageToSvgResult> {
  const valid = validateImage(file);
  if (!valid.ok) return valid;

  const provider = selectProvider();
  const converted = await provider.convert(file);
  if (!converted.ok) return converted;

  // Extract the <svg> element from the provider output (treat as untrusted).
  const match = converted.markup.match(/<svg[\s\S]*<\/svg>/i);
  if (!match) return { ok: false, error: 'Traced output had no <svg> element.' };
  let working = match[0];
  let sketchStats: SketchifyResult['stats'] | undefined;

  // THE DIFFERENTIATOR: abstract the faithful trace to a few hand-drawn strokes.
  if (sketchify !== false) {
    const result = simplifyToSketch(working, sketchify);
    working = result.markup;
    sketchStats = result.stats;
  }

  // Sanitize LAST: whatever the provider + our transform produced, it passes the
  // same gate as a file upload before it can reach dangerouslySetInnerHTML.
  const clean = sanitizeSvgMarkup(working);
  if (!/<svg[\s\S]*<\/svg>/i.test(clean)) {
    return { ok: false, error: 'Traced SVG could not be safely sanitized.' };
  }
  return { ok: true, markup: clean, sketch: sketchStats };
}

/** Default sketchify options (re-exported for callers/UI that surface the knobs). */
export { DEFAULT_SKETCHIFY };

/** Whether the active provider needs a server-side key (for honest UI copy:
 *  the unconfigured fallback vs. the hosted Quiver path). */
export function activeProviderNeedsKey(): boolean {
  return selectProvider().needsKey;
}

/** The active provider's human label (for UI: "Quiver Arrow (best quality)"
 *  vs "Image tracing (not configured)"). */
export function activeProviderLabel(): string {
  return selectProvider().label;
}
