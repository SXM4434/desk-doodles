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

// PATH-DATA CAPS (bug 1) — the element-count + byte caps both MISS the
// single-giant-geometry freeze: one `<path>` (or `<polygon>`) carrying a ~2MB
// `d`/`points` string is 1 element and <2MiB, so it slips past BOTH guards →
// DOMPurify + dangerouslySetInnerHTML on a monster path string → multi-second
// main-thread freeze (and, in the image flow, getTotalLength/getPointAtLength
// sampling over it = a second freeze). The fix is a cap on PATH-DATA VOLUME, the
// dimension the other guards don't measure: the sum of all `d`+`points`
// attribute lengths, AND a cap on any SINGLE such attribute.
//
//   MAX_TOTAL_PATH_DATA_CHARS = 256K
//     Headroom math: a real-world dense icon/illustration is a few KB of path
//     data; an honestly auto-traced photo (the heaviest legit input — Quiver
//     output, hundreds of sub-paths) lands in the low tens of KB. 256K is ~10×
//     above that worst legit case — generous enough that no real doodle is ever
//     rejected — yet ~8× UNDER the ~2MB single-path that freezes, so the freeze
//     class is closed with margin on both sides.
//   MAX_SINGLE_PATH_DATA_CHARS = 64K
//     A single hand/traced sub-path is at most a few KB; 64K (= the desk row's
//     whole-SVG storage cap, a known-safe upper bound for one doodle's geometry)
//     bounds the per-element work so one pathological `<path>` can't freeze the
//     parser or the getTotalLength sampler even while the total stays under cap.
const MAX_TOTAL_PATH_DATA_CHARS = 256 * 1024; // 256K summed d+points chars
const MAX_SINGLE_PATH_DATA_CHARS = 64 * 1024; // 64K for any one d/points attr

function bytesToReadable(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  return `${Math.max(1, Math.round(bytes / 1024))}KB`;
}

/**
 * Sum the length of every `d` and `points` attribute in the markup, and track
 * the single largest one. Cheap regex pass over the sanitized string, run BEFORE
 * rendering / BEFORE any getTotalLength sampling — never parses the geometry,
 * just measures the volume of path data. Handles both quote styles. Exported so
 * the verify harness can assert the measured volume directly.
 */
export function measurePathData(markup: string): { total: number; max: number } {
  let total = 0;
  let max = 0;
  // d="..." | d='...' | points="..." | points='...'  (attribute VALUE only).
  const re = /\b(?:d|points)\s*=\s*("([^"]*)"|'([^']*)')/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(markup)) !== null) {
    const value = m[2] ?? m[3] ?? '';
    const len = value.length;
    total += len;
    if (len > max) max = len;
  }
  return { total, max };
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

    // EXTRACT the <svg> element (bug 2) — FIRST complete root, non-greedy.
    // The previous fix went GREEDY (match to the LAST `</svg>`) to keep nested
    // SVGs whole, but greedy ALSO merges two sibling roots and swallows any junk
    // between them: `<svg>…</svg><script>…</script><svg></svg>` extracts the
    // whole blob — the inter-root `<script>` + a second root — defeating the
    // "extract THE svg" intent (DOMPurify strips the script downstream, but we
    // should never feed it that extra unsanitized text + a merged document).
    // Fix: strip comments + CDATA first (a `</svg>` hidden there is dead markup,
    // not a real close), then take the FIRST `<svg`…matching-`</svg>` only —
    // dropping everything AFTER the first root (the existing leading-junk drop is
    // preserved by anchoring on the first `<svg`).
    const stripped = text
      .replace(/<!--[\s\S]*?-->/g, '') // XML comments
      .replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, ''); // CDATA sections
    const extracted = extractFirstSvgRoot(stripped);
    if (!extracted) return { ok: false, error: 'Could not find <svg> in file.' };

    // PATH-DATA CAP (bug 1) — measure the extracted root's path-data volume
    // BEFORE sanitizing/rendering. A single ~2MB `d` slips past the byte +
    // element caps; reject it here so it never reaches DOMPurify / the DOM /
    // getTotalLength sampling. Measured on the extracted root (the only markup
    // we keep) so trailing junk we already dropped can't inflate the count.
    const pathData = measurePathData(extracted);
    if (pathData.max > MAX_SINGLE_PATH_DATA_CHARS) {
      return {
        ok: false,
        error: `SVG has an oversized path (${bytesToReadable(
          pathData.max,
        )} of path data in one element). Max ${bytesToReadable(
          MAX_SINGLE_PATH_DATA_CHARS,
        )} per path.`,
      };
    }
    if (pathData.total > MAX_TOTAL_PATH_DATA_CHARS) {
      return {
        ok: false,
        error: `SVG too detailed (${bytesToReadable(
          pathData.total,
        )} of path data). Max ${bytesToReadable(MAX_TOTAL_PATH_DATA_CHARS)}.`,
      };
    }

    const clean = sanitizeSvgMarkup(extracted);
    if (!/<svg[\s\S]*<\/svg>/i.test(clean)) {
      return { ok: false, error: 'SVG could not be safely sanitized.' };
    }
    return { ok: true, name: file.name, markup: clean };
  } catch (err) {
    return { ok: false, error: `Read failed: ${(err as Error).message}` };
  }
}

/**
 * Take the FIRST complete `<svg>…</svg>` from the text — the first `<svg` opener
 * to its matching close. Scans tags from the first opener forward, tracking nest
 * depth so a legitimately NESTED `<svg>` (e.g. an `<svg>` inside a `<symbol>`)
 * keeps the OUTER root whole instead of closing on the inner one. Drops anything
 * after the first root (sibling roots + inter-root junk). Returns null if no
 * `<svg` opener or no matching close is found. Exported for the verify harness.
 */
export function extractFirstSvgRoot(text: string): string | null {
  const open = /<svg\b/i.exec(text);
  if (!open) return null;
  const start = open.index;
  // Walk every <svg…> / </svg> from the first opener, balancing depth.
  const tagRe = /<svg\b[^>]*?(\/?)>|<\/svg\s*>/gi;
  tagRe.lastIndex = start;
  let depth = 0;
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(text)) !== null) {
    const tag = m[0];
    if (/^<\/svg/i.test(tag)) {
      depth--;
      if (depth === 0) {
        // Matched the close for the first root → return through this tag only.
        return text.slice(start, m.index + tag.length);
      }
    } else if (m[1] === '/') {
      // Self-closing <svg/> — only a root by itself when depth is 0.
      if (depth === 0) return text.slice(start, m.index + tag.length);
    } else {
      depth++;
    }
  }
  return null; // opener with no matching close
}
