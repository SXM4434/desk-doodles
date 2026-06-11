// Shared SVG sanitization + upload preparation.
// THE sanitizer for every SVG that reaches dangerouslySetInnerHTML —
// uploads (DrawPanel/DrawSurface) AND DB-sourced rows on read (DeskPage).
// A regex strip is NOT enough (it misses unquoted on* handlers, javascript:
// hrefs, <foreignObject>, external <use>/<image>, <style>@import beacons), so
// this uses DOMPurify with the SVG profile — pure-JS, Make-importable.

import DOMPurify from 'dompurify';

/** Sanitize arbitrary SVG markup for safe injection. Run on EVERY untrusted
 *  SVG — uploaded files AND public-feed rows (RLS can't parse SVG, so
 *  sanitize-on-read is the enforceable XSS layer). */
export function sanitizeSvgMarkup(markup: string): string {
  return DOMPurify.sanitize(markup, { USE_PROFILES: { svg: true, svgFilters: true } });
}

export type SvgUploadResult =
  | { ok: true; name: string; markup: string }
  | { ok: false; error: string };

export async function prepareSvgUpload(file: File): Promise<SvgUploadResult> {
  if (!/\.svg$/i.test(file.name) && !file.type.includes('svg')) {
    return { ok: false, error: `Not an SVG file: ${file.name}` };
  }
  try {
    const text = await file.text();
    const match = text.match(/<svg[\s\S]*?<\/svg>/i);
    if (!match) return { ok: false, error: 'Could not find <svg> in file.' };
    const clean = sanitizeSvgMarkup(match[0]);
    if (!/<svg[\s\S]*<\/svg>/i.test(clean)) {
      return { ok: false, error: 'SVG could not be safely sanitized.' };
    }
    return { ok: true, name: file.name, markup: clean };
  } catch (err) {
    return { ok: false, error: `Read failed: ${(err as Error).message}` };
  }
}
