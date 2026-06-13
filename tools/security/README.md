# SVG Sanitization Security Battery

Proves the upload/read sanitizer (`src/app/lib/svgUpload.ts` —
`sanitizeSvgMarkup` / `prepareSvgUpload`) neutralizes hostile SVG before it reaches
`dangerouslySetInnerHTML`. Every untrusted SVG in Desk Doodles is sanitized on read
(public-feed rows in `DeskPage`/`DeskGallery`) and on upload (`DrawPanel`/`DrawSurface`).
RLS can't parse SVG, so this is the one enforceable XSS layer — this battery is its
regression guard.

## Run it

```bash
node tools/security/security-battery.mjs
```

- Builds an isolated dist (`/tmp/dd-sec-dist`) and serves it via `vite preview` on
  port **4471** — no HMR churn against the active `/desk` + `canvas3d` edit zones.
- Drives the page in real Chromium (the runtime DOMPurify actually uses in prod).
- Blocks all outbound network so XXE / style-beacon / external-`<use>` vectors can't
  exfiltrate and any attempt shows up as a blocked request.
- Exits **non-zero** if ANY payload survives. Screenshots + `results.json` → `/tmp/dd-sec/`.

Env knobs: `DD_SEC_PORT`, `DD_SEC_OUTDIR`, `DD_SEC_SHOTS`, `DD_SEC_KEEP=1`.

## How it tests (faithful to production)

1. `window.__dd_xss_fired` beacon cleared.
2. `sanitizeSvgMarkup(payload)` — the exact production read-path call.
3. Cleaned string injected via `innerHTML` (what `dangerouslySetInnerHTML` lowers to —
   identical to `DeskPage.tsx:296/332` and `DeskGallery.tsx:392`).
4. Event-dependent vectors (`onclick`, `<a>` activation) are synthetically triggered.
5. Beacon re-read: **nonzero = the payload executed = real finding**.
6. Sanitized string checked for forbidden tokens (`<script`, `onload=`, `javascript:`, …);
   file-gate payloads also run through `prepareSvgUpload`.

## Payload families (`payloads.ts`)

inline `<script>` · `on*` handlers (onload/onerror/onclick/onbegin, unquoted + mixed-case)
· `javascript:` / `data:` hrefs (href, xlink:href, whitespace-obfuscated) · `<foreignObject>`
HTML smuggling · XXE (SYSTEM entity, parameter entity, external `<use>`) · `<style>` `@import`
/ `url()` beacons · billion-laughs + 2000-deep nesting (DoS) · malformed/unclosed · plus a
benign control that MUST survive (no over-stripping).

## NOT in scope (by design)

- No live DB writes — sanitizer is exercised directly + via the file gate; nothing is published.
- No CSP meta tag in the harness — we test the SANITIZER, not a browser-layer backstop.
  Production CSP headers are separate defense-in-depth.
- `tools/` is repo-side only and never part of the Make drag-drop set.
