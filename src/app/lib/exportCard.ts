// ─── exportCard — turn a rendered doodle into a shareable SVG / PNG file ─────
//
// Card features (Sebs 2026-06-13, docs/submission/DECISIONS-FOR-SEBS.md):
// "Export card → SVG (+ PNG) for social sharing." This is the export side of
// that — a small, dependency-free util the card detail modal calls.
//
// WHY CAPTURE THE LIVE DOM, NOT THE RAW MARKUP. The doodle's final look is the
// product of three layers that only exist once it's MOUNTED: (1) rough.js has
// rewritten the source <svg> into hand-drawn paths in the DOM, (2) the wrapper
// CSS resolves var(--dir-*) ink/paper tokens + a stack of !important palette
// rules onto those paths (SvgStyleTransform.tsx ~line 2856), (3) filters /
// textures apply. Serializing the source markup would export the CLEAN shape,
// not the styled doodle. So we read the rendered <svg> straight out of the
// card's art well and bake the computed cascade into it.
//
// SELF-CONTAINED OUTPUT (the spec's hard requirement). A standalone .svg can't
// see the page's stylesheet or its :root custom properties, so we resolve every
// paint to a concrete value: walk the clone, read getComputedStyle for each
// element, and write fill / stroke / opacities / dash / line-caps as INLINE
// attributes. After this pass the SVG carries zero external refs and renders
// identically in an <img>, a design tool, or a fresh tab.
//
// Research (cited in the PR report):
//   · MDN XMLSerializer.serializeToString — DOM → string.
//   · ourcodeworld "render SVG string onto a canvas → PNG/JPEG at custom
//     resolution": serialize → data URI (xmlns required, drop <?xml?>) →
//     Image → drawImage at a scaled size → canvas.toBlob('image/png').
//   · MDN "Allowing cross-origin use of images and canvas" / tainted-canvas:
//     drawing a cross-origin (or <foreignObject>) source taints the canvas and
//     toBlob throws SecurityError. Doodle SVGs are self-generated strokes +
//     sanitized uploads (no <foreignObject>, no external <image>), and the
//     paper texture we add is a same-origin data: URI — so the canvas stays
//     clean. We still wrap the rasterize step in try/catch and fall back to the
//     SVG download, so a future exotic input degrades instead of breaking.

import { PAPER_GRAIN } from './deskCraft';

const SVG_NS = 'http://www.w3.org/2000/svg';
const XLINK_NS = 'http://www.w3.org/1999/xlink';

/** Default export padding (SVG user units) around the doodle on the paper. */
const PAD = 28;
/** PNG raster scale floor — a social-friendly 2x, multiplied by the device
 *  pixel ratio so the export is crisp on the machine that made it. Capped so a
 *  huge doodle on a 3x display can't ask for a multi-thousand-px canvas. */
const PNG_BASE_SCALE = 2;
const PNG_MAX_SCALE = 4;

export type ExportColors = {
  /** Paper background fill (resolved --dir-bg). */
  paper: string;
  /** Warm light-pool tint, rgba — matches deskCraft WARM_POOL's inner color. */
  pool: string;
};

/** Read the live theme colors off the document so the export matches whatever
 *  direction (light / dark) the page is in. Falls back to the warm-paper light
 *  values if the tokens aren't resolvable (SSR / detached node). */
export function readExportColors(el?: Element | null): ExportColors {
  const probe = el ?? (typeof document !== 'undefined' ? document.documentElement : null);
  let paper = '#FDFCF9';
  if (probe && typeof getComputedStyle === 'function') {
    const v = getComputedStyle(probe).getPropertyValue('--dir-bg').trim();
    if (v) paper = v;
  }
  // The warm pool is a fixed warm-white in deskCraft (direction-independent).
  return { paper, pool: 'rgba(255,246,229,0.5)' };
}

// ─── computed-paint baking ───────────────────────────────────────────────────
// The properties that carry the doodle's look. Read each via getComputedStyle
// (which resolves var() tokens AND the wrapper's !important rules) and write it
// as an inline attribute on the clone, so the standalone SVG needs no CSS.
const PAINT_PROPS: Array<[prop: string, attr: string]> = [
  ['fill', 'fill'],
  ['fill-opacity', 'fill-opacity'],
  ['fill-rule', 'fill-rule'],
  ['stroke', 'stroke'],
  ['stroke-opacity', 'stroke-opacity'],
  ['stroke-width', 'stroke-width'],
  ['stroke-linecap', 'stroke-linecap'],
  ['stroke-linejoin', 'stroke-linejoin'],
  ['stroke-dasharray', 'stroke-dasharray'],
  ['stroke-dashoffset', 'stroke-dashoffset'],
  ['opacity', 'opacity'],
];

/** Normalize a computed CSS value into a clean SVG presentation-attribute
 *  value: getComputedStyle hands back px-suffixed lengths ("2px", "4px, 3px")
 *  and quoted url()s ('url("#x")'), neither of which is portable SVG 1.1. Strip
 *  px units from numeric lengths and unquote url() refs so the standalone file
 *  renders identically in strict SVG renderers, not just a browser. */
function cleanAttrValue(val: string): string {
  return val
    .replace(/url\((['"])(.*?)\1\)/g, 'url($2)') // unquote url("#x") → url(#x)
    .replace(/(-?\d*\.?\d+)px\b/g, '$1'); // 2px → 2, 4px, 3px → 4, 3
}

/** Bake the computed cascade of `src` onto `dst` (same element, in a clone),
 *  recursing through children index-aligned. `src` must still be live in the
 *  document (computed styles only exist for mounted nodes). */
function bakeComputed(src: Element, dst: Element) {
  if (typeof getComputedStyle === 'function') {
    const cs = getComputedStyle(src);
    for (const [prop, attr] of PAINT_PROPS) {
      const raw = cs.getPropertyValue(prop).trim();
      // Skip empty / initial-ish values that would just add noise, but DO keep
      // explicit 'none' fills/strokes — they're meaningful (outline-only).
      if (raw === '') continue;
      dst.setAttribute(attr, cleanAttrValue(raw));
    }
    // Preserve any filter reference (texture / wet-ink) — it points at a <defs>
    // filter that lives inside the same captured <svg>, so it stays valid.
    const filter = cs.getPropertyValue('filter').trim();
    if (filter && filter !== 'none') dst.setAttribute('filter', cleanAttrValue(filter));
  }
  const sKids = src.children;
  const dKids = dst.children;
  for (let i = 0; i < sKids.length && i < dKids.length; i++) {
    bakeComputed(sKids[i], dKids[i]);
  }
}

/** The visible rendered <svg> inside a card art well. SvgStyleTransform mounts
 *  TWO inner divs (clean vs fx); only one is display:block at a time. Find the
 *  <svg> whose chain isn't display:none. Falls back to the first <svg>. */
export function findRenderedSvg(root: Element): SVGSVGElement | null {
  const svgs = Array.from(root.querySelectorAll('svg')) as SVGSVGElement[];
  if (svgs.length === 0) return null;
  const visible = svgs.find((svg) => {
    let node: Element | null = svg;
    while (node && node !== root) {
      if (node instanceof HTMLElement && node.style.display === 'none') return false;
      node = node.parentElement;
    }
    return true;
  });
  return visible ?? svgs[0];
}

/** The doodle's intrinsic box in user units — viewBox if present, else the
 *  measured render box, else width/height attrs, else a square fallback. */
function svgBox(svg: SVGSVGElement): { x: number; y: number; w: number; h: number } {
  const vb = svg.viewBox?.baseVal;
  if (vb && vb.width > 0 && vb.height > 0) {
    return { x: vb.x, y: vb.y, w: vb.width, h: vb.height };
  }
  try {
    const b = svg.getBBox();
    if (b.width > 0 && b.height > 0) return { x: b.x, y: b.y, w: b.width, h: b.height };
  } catch {
    // getBBox throws on a detached node — fall through to attrs.
  }
  const w = Number(svg.getAttribute('width')) || 180;
  const h = Number(svg.getAttribute('height')) || 180;
  return { x: 0, y: 0, w, h };
}

/** Build the self-contained export <svg> as a string: the captured doodle,
 *  computed-paints baked in, sitting on the warm-paper card with padding.
 *  `root` is the card art well (the element wrapping SvgStyleTransform). */
export function buildCardSvgString(root: Element): string | null {
  if (typeof document === 'undefined') return null;
  const rendered = findRenderedSvg(root);
  if (!rendered) return null;

  const box = svgBox(rendered);
  const colors = readExportColors(root);

  // Clone the rendered doodle and bake its computed look in (self-contained).
  const inner = rendered.cloneNode(true) as SVGSVGElement;
  bakeComputed(rendered, inner);
  // The inner <svg> becomes a nested group at the doodle's own coordinates —
  // strip its sizing attrs so the OUTER svg owns layout; keep its viewBox so
  // its internal coordinate system is preserved.
  inner.removeAttribute('width');
  inner.removeAttribute('height');
  inner.removeAttribute('style');
  if (!inner.getAttribute('viewBox')) {
    inner.setAttribute('viewBox', `${box.x} ${box.y} ${box.w} ${box.h}`);
  }

  const totalW = box.w + PAD * 2;
  const totalH = box.h + PAD * 2;

  // Compose the outer document. Paper rect + warm-pool radial + grain image
  // (the deskCraft data-URI, decoded from the css url("…") wrapper) + the
  // doodle nested at (PAD, PAD) over the doodle's own box.
  const out = document.createElementNS(SVG_NS, 'svg');
  out.setAttribute('xmlns', SVG_NS);
  out.setAttribute('xmlns:xlink', XLINK_NS);
  out.setAttribute('width', String(Math.round(totalW)));
  out.setAttribute('height', String(Math.round(totalH)));
  out.setAttribute('viewBox', `0 0 ${totalW} ${totalH}`);

  // defs: warm-pool radial gradient (mirrors deskCraft WARM_POOL ellipse).
  const defs = document.createElementNS(SVG_NS, 'defs');
  const grad = document.createElementNS(SVG_NS, 'radialGradient');
  grad.setAttribute('id', 'dd-pool');
  grad.setAttribute('cx', '50%');
  grad.setAttribute('cy', '42%');
  grad.setAttribute('r', '72%');
  const s0 = document.createElementNS(SVG_NS, 'stop');
  s0.setAttribute('offset', '0%');
  s0.setAttribute('stop-color', colors.pool);
  const s1 = document.createElementNS(SVG_NS, 'stop');
  s1.setAttribute('offset', '63%');
  s1.setAttribute('stop-color', 'rgba(255,246,229,0)');
  grad.appendChild(s0);
  grad.appendChild(s1);
  defs.appendChild(grad);
  out.appendChild(defs);

  // Paper fill.
  const paper = document.createElementNS(SVG_NS, 'rect');
  paper.setAttribute('x', '0');
  paper.setAttribute('y', '0');
  paper.setAttribute('width', String(totalW));
  paper.setAttribute('height', String(totalH));
  paper.setAttribute('fill', colors.paper);
  out.appendChild(paper);

  // Paper grain — the deskCraft tiled data-URI as a tiled <image> pattern. The
  // url("…") css wrapper is unwrapped to the bare data: URI. data: is same-
  // origin, so it never taints the export canvas.
  const grainHref = unwrapCssUrl(PAPER_GRAIN);
  if (grainHref) {
    const pat = document.createElementNS(SVG_NS, 'pattern');
    pat.setAttribute('id', 'dd-grain');
    pat.setAttribute('width', '280');
    pat.setAttribute('height', '280');
    pat.setAttribute('patternUnits', 'userSpaceOnUse');
    const gimg = document.createElementNS(SVG_NS, 'image');
    gimg.setAttribute('width', '280');
    gimg.setAttribute('height', '280');
    gimg.setAttributeNS(XLINK_NS, 'xlink:href', grainHref);
    gimg.setAttribute('href', grainHref);
    pat.appendChild(gimg);
    defs.appendChild(pat);
    const grainRect = document.createElementNS(SVG_NS, 'rect');
    grainRect.setAttribute('width', String(totalW));
    grainRect.setAttribute('height', String(totalH));
    grainRect.setAttribute('fill', 'url(#dd-grain)');
    out.appendChild(grainRect);
  }

  // Warm pool over the grain.
  const pool = document.createElementNS(SVG_NS, 'rect');
  pool.setAttribute('width', String(totalW));
  pool.setAttribute('height', String(totalH));
  pool.setAttribute('fill', 'url(#dd-pool)');
  out.appendChild(pool);

  // The doodle, placed with padding, sized to its box inside the card.
  const place = document.createElementNS(SVG_NS, 'svg');
  place.setAttribute('x', String(PAD));
  place.setAttribute('y', String(PAD));
  place.setAttribute('width', String(box.w));
  place.setAttribute('height', String(box.h));
  place.setAttribute('viewBox', `${box.x} ${box.y} ${box.w} ${box.h}`);
  // Move the cloned doodle's children into the placement svg (a nested <svg>
  // re-roots the coordinate system cleanly via its viewBox).
  while (inner.firstChild) place.appendChild(inner.firstChild);
  out.appendChild(place);

  return new XMLSerializer().serializeToString(out);
}

/** Strip the CSS `url("…")` wrapper from a background-image string → the bare
 *  URI (here, the deskCraft data: URI). Returns null if it isn't a url(). */
function unwrapCssUrl(css: string): string | null {
  const m = css.match(/url\(\s*(['"]?)([\s\S]*?)\1\s*\)/);
  return m ? m[2] : null;
}

// ─── download helpers ─────────────────────────────────────────────────────────

/** Trigger a browser download of a Blob under `filename`. */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke on the next tick so the click's navigation has consumed the URL.
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** A filesystem-safe slug for the doodle name → the download filename stem. */
export function slugifyName(name?: string | null): string {
  const base = (name ?? '').trim().toLowerCase();
  const slug = base
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return slug || 'doodle';
}

export type ExportResult = { ok: true } | { ok: false; error: string };

/** Export the card's doodle as a self-contained .svg download. */
export function exportCardSvg(root: Element | null, name?: string | null): ExportResult {
  if (!root) return { ok: false, error: 'nothing to export' };
  const svgString = buildCardSvgString(root);
  if (!svgString) return { ok: false, error: 'no rendered doodle to export' };
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  downloadBlob(blob, `${slugifyName(name)}.svg`);
  return { ok: true };
}

/** Build a data: URI for an SVG string. URL-encoded (not base64): SVG wants
 *  plain URL-encoded data, and encodeURIComponent handles the # / % / quotes
 *  that would otherwise break the URI (ourcodeworld). */
function svgStringToDataUri(svgString: string): string {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);
}

/** Load an SVG string into an HTMLImageElement (decoded), or reject. */
function loadSvgImage(svgString: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Same-origin data: URI — crossOrigin is unnecessary, but setting it
    // anonymous is harmless and keeps the canvas clean if a UA is strict.
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('svg image failed to decode'));
    img.src = svgStringToDataUri(svgString);
  });
}

/** Export the card's doodle as a crisp PNG download. Rasterizes the SAME
 *  self-contained SVG used for the .svg export onto a DPR-aware 2x canvas, on
 *  the paper background, then toBlob → download. Async (image decode + toBlob).
 *
 *  Falls back to the SVG download if rasterization fails (e.g. a tainted
 *  canvas from a future exotic input) — the user still gets a usable file. */
export async function exportCardPng(
  root: Element | null,
  name?: string | null,
): Promise<ExportResult> {
  if (!root) return { ok: false, error: 'nothing to export' };
  const svgString = buildCardSvgString(root);
  if (!svgString) return { ok: false, error: 'no rendered doodle to export' };

  try {
    const img = await loadSvgImage(svgString);
    // The outer svg carries width/height in user units = the natural px box.
    const baseW = img.naturalWidth || img.width || 256;
    const baseH = img.naturalHeight || img.height || 256;
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const scale = Math.min(PNG_MAX_SCALE, PNG_BASE_SCALE * dpr);

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(baseW * scale);
    canvas.height = Math.round(baseH * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('no 2d context');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    // The SVG already paints its own paper rect, so drawImage fills the frame;
    // a paper underlay guarantees opacity even if the SVG had transparency.
    const { paper } = readExportColors(root);
    ctx.fillStyle = paper;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/png'),
    );
    if (!blob) throw new Error('canvas produced no PNG (possibly tainted)');
    downloadBlob(blob, `${slugifyName(name)}.png`);
    return { ok: true };
  } catch (err) {
    // Rasterize failed — fall back to the vector download so the user still
    // gets a shareable file, and report the downgrade honestly.
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    downloadBlob(blob, `${slugifyName(name)}.svg`);
    return {
      ok: false,
      error: `couldn't make a PNG (${err instanceof Error ? err.message : 'unknown'}) — saved the SVG instead`,
    };
  }
}
