// ─── Edge-fixture corpus generator (gap-hunt H4/H5/H7) ──────────────────────
// Writes the static, human-openable edge/degenerate/hostile-but-sanitized SVG
// corpus into tools/edge-fixtures/svg/. The render-survival battery
// (render-survival-battery.mjs) consumes this corpus + the two pre-existing
// test-fixtures (edge-case-torture.svg, gradient-sampler.svg) + a handful of
// PROGRAMMATIC giants it generates in-memory (10k-element, deep-nesting,
// 1000-subpath) so the repo never carries multi-MB fixtures.
//
//   node tools/edge-fixtures/generate-fixtures.mjs
//
// Idempotent: re-running overwrites the corpus byte-for-byte. Each family maps
// to the README's fixture taxonomy (A degenerate · B structural · C fills ·
// D text/unicode · E empty/malformed). Every fixture is VALID-but-weird or
// sanitized-hostile markup — never something the sanitizer would reject; the
// point is RENDER survival, not sanitize survival (the security battery owns
// that). NOT shipped in the Make drag-drop (tools/ is repo-side only).

import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'svg');
mkdirSync(OUT, { recursive: true });

const NS = 'xmlns="http://www.w3.org/2000/svg"';

// Each entry: [filename, family, note, markup]. The note is mirrored as an XML
// comment at the top of the file so a human who opens it knows what it probes.
const FIXTURES = [
  // ── A · Degenerate geometry (render-path robustness) ─────────────────────
  ['zero-area-rect.svg', 'A-degenerate',
    'rect width=0 height=0 — getBBox 0x0 → aspectRatio 0/0 div path',
    `<svg ${NS} viewBox="0 0 100 100"><rect x="50" y="50" width="0" height="0" fill="#1a1a1a"/></svg>`],

  ['single-point-path.svg', 'A-degenerate',
    'path d="M50 50 Z" — one point, closed; zero length',
    `<svg ${NS} viewBox="0 0 100 100"><path d="M50 50 Z" fill="#222" stroke="#000"/></svg>`],

  ['single-point-polyline.svg', 'A-degenerate',
    'polyline with one vertex — no segments',
    `<svg ${NS} viewBox="0 0 100 100"><polyline points="50,50" fill="none" stroke="#1a1a1a" stroke-width="2"/></svg>`],

  ['collinear-path.svg', 'A-degenerate',
    '3 collinear points — zero-area enclosure, degenerate winding',
    `<svg ${NS} viewBox="0 0 120 40"><path d="M10 20 L60 20 L110 20 Z" fill="#333" stroke="#000"/></svg>`],

  ['nan-coords.svg', 'A-degenerate',
    'literal NaN inside the d-string — parser/sampler must not propagate NaN',
    `<svg ${NS} viewBox="0 0 100 100"><path d="M NaN 10 L 20 NaN L 40 40 Z" fill="#222"/><rect x="10" y="10" width="30" height="30" fill="#1a1a1a"/></svg>`],

  ['infinity-coords.svg', 'A-degenerate',
    'coordinate 1e400 parses to Infinity — arc-length walk / getPointAtLength OOM class',
    `<svg ${NS} viewBox="0 0 100 100"><path d="M10 10 L 1e400 50 L 90 90" fill="none" stroke="#1a1a1a" stroke-width="2"/><rect x="20" y="20" width="20" height="20" fill="#222"/></svg>`],

  ['negative-dims.svg', 'A-degenerate',
    'rect width=-50 height=-50 — negative dimensions',
    `<svg ${NS} viewBox="0 0 100 100"><rect x="80" y="80" width="-50" height="-50" fill="#1a1a1a"/></svg>`],

  ['giant-10000px.svg', 'A-degenerate',
    'viewBox 0 0 10000 10000 single huge shape — normalize down-scale + memory',
    `<svg ${NS} viewBox="0 0 10000 10000"><rect x="500" y="500" width="9000" height="9000" fill="none" stroke="#1a1a1a" stroke-width="20"/><circle cx="5000" cy="5000" r="3000" fill="#222"/></svg>`],

  ['micro-1px.svg', 'A-degenerate',
    'viewBox 0 0 1 1 — normalize up-scale vs tiny-area clamp interplay',
    `<svg ${NS} viewBox="0 0 1 1"><rect x="0.1" y="0.1" width="0.8" height="0.8" fill="#1a1a1a"/></svg>`],

  ['extreme-aspect.svg', 'A-degenerate',
    '10000x1 sliver — geomean bbox-min path, aspectRatio explosion',
    `<svg ${NS} viewBox="0 0 10000 1"><rect x="0" y="0" width="10000" height="1" fill="#1a1a1a"/><line x1="0" y1="0.5" x2="10000" y2="0.5" stroke="#000" stroke-width="0.5"/></svg>`],

  // ── B · Multi-subpath / structural extremes ──────────────────────────────
  // (the 1000-subpath, 10000-element, deep-nesting giants are generated
  //  in-memory by the harness — see makeGiant* there. Seed/small ones here.)
  ['self-intersecting-polygon.svg', 'B-structural',
    'figure-8 polygon — fill-rule / winding; raster region extractor (edge policy row 16 DEFERRED)',
    `<svg ${NS} viewBox="0 0 100 100"><polygon points="20,20 80,80 80,20 20,80" fill="#222" stroke="#000"/></svg>`],

  ['empty-g.svg', 'B-structural',
    'a single empty <g> — 0 renderable children',
    `<svg ${NS} viewBox="0 0 100 100"><g></g></svg>`],

  ['defs-only.svg', 'B-structural',
    'only <defs>, nothing renderable — extractAllSignals returns empty map',
    `<svg ${NS} viewBox="0 0 100 100"><defs><linearGradient id="g"><stop offset="0" stop-color="#000"/></linearGradient><rect id="tmpl" width="10" height="10"/></defs></svg>`],

  ['nested-50-g.svg', 'B-structural',
    '50-level <g> nesting (small, human-openable; harness generates the 500-level)',
    `<svg ${NS} viewBox="0 0 100 100">${'<g>'.repeat(50)}<rect x="30" y="30" width="40" height="40" fill="#1a1a1a"/>${'</g>'.repeat(50)}</svg>`],

  // ── C · Fills the catalog never has ──────────────────────────────────────
  ['currentcolor-no-context.svg', 'C-fills',
    'fill=currentColor with NO color attr — UA-default-black guard path',
    `<svg ${NS} viewBox="0 0 100 100"><rect x="20" y="20" width="60" height="60" fill="currentColor"/></svg>`],

  ['gradient-no-stops.svg', 'C-fills',
    'linearGradient with zero <stop> — resolveUrlFillDarkness n===0 branch',
    `<svg ${NS} viewBox="0 0 100 100"><defs><linearGradient id="empty"></linearGradient></defs><rect x="20" y="20" width="60" height="60" fill="url(#empty)"/></svg>`],

  ['gradient-dangling-ref.svg', 'C-fills',
    'fill=url(#missing) — def not found → 0.75 catch-all',
    `<svg ${NS} viewBox="0 0 100 100"><rect x="20" y="20" width="60" height="60" fill="url(#nope)" stroke="#000"/></svg>`],

  ['hsl-fill.svg', 'C-fills',
    'hsl() fill — culori parse coverage the var()-token catalog skips',
    `<svg ${NS} viewBox="0 0 100 100"><rect x="20" y="20" width="60" height="60" fill="hsl(260 70% 30%)"/></svg>`],

  ['named-color-fill.svg', 'C-fills',
    'rebeccapurple named-color fill',
    `<svg ${NS} viewBox="0 0 100 100"><rect x="20" y="20" width="60" height="60" fill="rebeccapurple"/></svg>`],

  ['rgba-fill.svg', 'C-fills',
    'rgba() fill with alpha — parse + darkness',
    `<svg ${NS} viewBox="0 0 100 100"><rect x="20" y="20" width="60" height="60" fill="rgba(20,20,20,0.6)"/></svg>`],

  ['8-digit-hex-fill.svg', 'C-fills',
    '#1a1a1a80 8-digit hex fill — alpha hex parse',
    `<svg ${NS} viewBox="0 0 100 100"><rect x="20" y="20" width="60" height="60" fill="#1a1a1a80"/></svg>`],

  ['filter-on-renderable.svg', 'C-fills',
    'filter=url(#blur) on a fill region — pass-through claim untested in 2D sweep',
    `<svg ${NS} viewBox="0 0 100 100"><defs><filter id="blur"><feGaussianBlur stdDeviation="2"/></filter></defs><rect x="20" y="20" width="60" height="60" fill="#222" filter="url(#blur)"/></svg>`],

  ['mask-clip-combo.svg', 'C-fills',
    'element with BOTH mask + clip-path — interaction untested',
    `<svg ${NS} viewBox="0 0 100 100"><defs><clipPath id="cp"><circle cx="50" cy="50" r="40"/></clipPath><mask id="mk"><rect x="0" y="0" width="100" height="100" fill="#fff"/><rect x="40" y="0" width="20" height="100" fill="#000"/></mask></defs><rect x="10" y="10" width="80" height="80" fill="#1a1a1a" clip-path="url(#cp)" mask="url(#mk)"/></svg>`],

  // ── D · Text / unicode ───────────────────────────────────────────────────
  ['unicode-emoji-text.svg', 'D-text',
    'emoji + RTL Arabic + CJK in <text>',
    `<svg ${NS} viewBox="0 0 200 60"><text x="10" y="35" font-size="24" fill="#1a1a1a">🎨 مرحبا 漢字</text></svg>`],

  ['textpath.svg', 'D-text',
    'textPath on a path — unrecognized element walk',
    `<svg ${NS} viewBox="0 0 200 100"><defs><path id="curve" d="M10 80 Q100 10 190 80"/></defs><text font-size="16" fill="#1a1a1a"><textPath href="#curve">following a curve along its length</textPath></text></svg>`],

  ['tspan-nested.svg', 'D-text',
    'text with nested tspan — child-of-text walk',
    `<svg ${NS} viewBox="0 0 200 60"><text x="10" y="35" font-size="20" fill="#1a1a1a">Hi <tspan font-weight="bold" fill="#000">there</tspan> <tspan dx="4" baseline-shift="super" font-size="12">!</tspan></text></svg>`],

  ['text-heavy.svg', 'D-text',
    '50 <text> nodes — label-text rule at volume; perf',
    (() => {
      let body = '';
      for (let i = 0; i < 50; i++) {
        const x = 10 + (i % 5) * 90;
        const y = 20 + Math.floor(i / 5) * 30;
        body += `<text x="${x}" y="${y}" font-size="11" fill="#1a1a1a">label-${i}</text>`;
      }
      return `<svg ${NS} viewBox="0 0 470 320">${body}</svg>`;
    })()],

  // ── E · Empty / malformed-but-parseable (render path, not just sanitize) ──
  ['empty-svg.svg', 'E-empty',
    'valid <svg> but no content',
    `<svg ${NS} viewBox="0 0 100 100"></svg>`],

  ['whitespace-only.svg', 'E-empty',
    '<svg> containing only whitespace',
    `<svg ${NS} viewBox="0 0 100 100">  \n  \n  </svg>`],

  ['no-viewbox-no-dims.svg', 'E-empty',
    'no viewBox AND no width/height but real content — normalizeSvgSize zero-dim warn path',
    `<svg ${NS}><rect x="20" y="20" width="60" height="60" fill="#1a1a1a"/></svg>`],

  ['comment-bomb.svg', 'E-empty',
    '~60KB of comments around one rect — parser + walk on padded markup',
    (() => {
      const pad = ('<!-- ' + 'x'.repeat(120) + ' -->\n').repeat(450);
      return `<svg ${NS} viewBox="0 0 100 100">\n${pad}<rect x="20" y="20" width="60" height="60" fill="#1a1a1a"/>\n${pad}</svg>`;
    })()],

  ['prolog-garbage.svg', 'E-empty',
    'XML prolog + processing instruction + DOCTYPE before <svg>',
    `<?xml version="1.0" encoding="UTF-8"?>\n<?xml-stylesheet type="text/css" href="x.css"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<svg ${NS} viewBox="0 0 100 100"><rect x="20" y="20" width="60" height="60" fill="#1a1a1a"/></svg>`],

  // ── Sanitized-hostile (the H4 headline: what the sanitizer KEEPS, rendered)
  // These are the cleaned outputs of common XSS shapes — the dangerous bits are
  // gone (the security battery proves that), but the leftover geometry must
  // still render without crashing. We bake the post-sanitize shape directly so
  // the battery does not depend on import-order with the sanitizer.
  ['sanitized-onload-stripped.svg', 'F-sanitized-hostile',
    'what survives after onload= is stripped — bare animated-looking rect',
    `<svg ${NS} viewBox="0 0 100 100"><rect x="20" y="20" width="60" height="60" fill="#1a1a1a"/></svg>`],

  ['sanitized-foreignobject-empty.svg', 'F-sanitized-hostile',
    'foreignObject body stripped by sanitizer — empty fO + a real shape',
    `<svg ${NS} viewBox="0 0 100 100"><foreignObject x="0" y="0" width="50" height="50"></foreignObject><circle cx="70" cy="70" r="20" fill="#222"/></svg>`],

  ['sanitized-animate-leftover.svg', 'F-sanitized-hostile',
    'animate element kept (inert), values reference may be malformed',
    `<svg ${NS} viewBox="0 0 100 100"><rect x="20" y="20" width="40" height="40" fill="#1a1a1a"><animate attributeName="x" values="20;NaN;20" dur="2s"/></rect></svg>`],
];

let count = 0;
for (const [name, family, note, markup] of FIXTURES) {
  const header = `<!-- EDGE FIXTURE [${family}] — ${note}\n     Generated by tools/edge-fixtures/generate-fixtures.mjs. RENDER-survival probe\n     (valid-but-weird / sanitized-hostile); the security battery owns sanitize. -->\n`;
  writeFileSync(join(OUT, name), header + markup + '\n');
  count++;
}

// Manifest the static corpus so the battery + a human can enumerate it.
const manifest = FIXTURES.map(([name, family, note]) => ({ name, family, note }));
writeFileSync(
  join(OUT, '_manifest.json'),
  JSON.stringify({ generatedAt: new Date().toISOString(), count, fixtures: manifest }, null, 2),
);

console.log(`wrote ${count} static edge fixtures + _manifest.json → ${OUT}`);
