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
  // FORBID_TAGS: ['style'] closes a real exfil hole the SVG profile leaves open —
  // DOMPurify keeps inline <style>, so `@import url(...)` / `fill:url(http://evil)`
  // survive and the browser fires the request on inject (a CSS request/exfil
  // beacon). Proven by tools/security/security-battery.mjs (style-import-beacon /
  // style-url-background). Safe to forbid: Desk Doodles art is pure geometry with
  // inline attrs (rough.js / smartHachure / perfect-freehand) — never inline <style>.
  return DOMPurify.sanitize(markup, {
    USE_PROFILES: { svg: true, svgFilters: true },
    FORBID_TAGS: ['style'],
  });
}

export type SvgUploadResult =
  | { ok: true; name: string; markup: string }
  | { ok: false; error: string };

// Hard caps on RAW uploaded bytes + element count. A ~3.3MB / ~60k-path SVG
// froze the app: prepareSvgUpload ran an O(n) regex + a full DOMPurify parse +
// dangerouslySetInnerHTML on a 60k-node tree on the main thread, locking the UI
// for seconds. The established mitigation (OWASP / Fortinet SVG attack-surface
// guidance) is to REJECT files over a size limit AND cap file complexity before
// parsing — never hand an unbounded document to the parser/DOM.
//
// 2 MiB is comfortably above any hand-drawn / honestly-traced doodle (a dense
// auto-traced rose is ~tens of KB; the desk stores ≤64KB) yet well under the
// freeze threshold. The element cap bounds the DOM the browser must build even
// when a small file declares a huge tree.
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024; // 2 MiB raw file
const MAX_ELEMENT_COUNT = 12000; // total markup tags before sanitize

function bytesToReadable(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  return `${Math.max(1, Math.round(bytes / 1024))}KB`;
}

export async function prepareSvgUpload(file: File): Promise<SvgUploadResult> {
  if (!/\.svg$/i.test(file.name) && !file.type.includes('svg')) {
    return { ok: false, error: `Not an SVG file: ${file.name}` };
  }
  // SIZE CAP (bug 1) — check before reading text into memory + parsing. file.size
  // is the raw byte length, zero-cost. Over the cap = clear reject, no freeze.
  if (file.size > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      error: `SVG too large (${bytesToReadable(file.size)}). Max ${bytesToReadable(
        MAX_UPLOAD_BYTES,
      )}.`,
    };
  }
  try {
    const text = await file.text();
    // Belt-and-suspenders: file.size can lie (e.g. a 0-size blob with content,
    // or a mis-typed source). Re-check the decoded string length too.
    if (text.length > MAX_UPLOAD_BYTES) {
      return {
        ok: false,
        error: `SVG too large (${bytesToReadable(
          text.length,
        )}). Max ${bytesToReadable(MAX_UPLOAD_BYTES)}.`,
      };
    }

    // BILLION-LAUGHS / XML-bomb guard — reject DTD/entity declarations outright.
    // DOMPurify forbids them by default, but we parse raw text BEFORE sanitizing,
    // and an exponential-entity DOCTYPE can OOM/lock a browser during native XML
    // expansion. Cheap pre-reject (OWASP XXE/entity-expansion guidance).
    if (/<!DOCTYPE/i.test(text) || /<!ENTITY/i.test(text)) {
      return {
        ok: false,
        error: 'SVG contains a DOCTYPE/entity declaration and was rejected.',
      };
    }

    // ELEMENT-COUNT CAP (bug 1) — a 60k-path tree freezes DOMPurify + the DOM
    // build even under the byte cap (paths are short, so byte size stays modest
    // while node count explodes). Count opening tags cheaply on the raw text
    // BEFORE the expensive parse; over the cap = clear reject.
    const tagMatches = text.match(/<[a-zA-Z][^>]*>/g);
    const elementCount = tagMatches ? tagMatches.length : 0;
    if (elementCount > MAX_ELEMENT_COUNT) {
      return {
        ok: false,
        error: `SVG too complex (${elementCount.toLocaleString()} elements). Max ${MAX_ELEMENT_COUNT.toLocaleString()}.`,
      };
    }

    // EXTRACT the <svg> element (bug 2). The old non-greedy `<svg…?</svg>` stopped
    // at the FIRST `</svg>`, which a `</svg>` hidden inside an XML comment or a
    // CDATA section truncates the real document at — dropping everything after it.
    // Fix: (a) strip comments + CDATA first (a `</svg>` there is not a real close
    // and is dead markup anyway), then (b) GREEDY-match to the LAST `</svg>` so a
    // legitimately nested/multi `<svg>` document is captured whole.
    const stripped = text
      .replace(/<!--[\s\S]*?-->/g, '') // XML comments
      .replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, ''); // CDATA sections
    const match = stripped.match(/<svg[\s\S]*<\/svg>/i);
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
