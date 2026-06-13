// ─── Render-survival battery harness (browser) — gap-hunt H4/H5/H7 ──────────
// Drives ARBITRARY / edge-case / sanitized-hostile SVG markup through the REAL
// 2D render path — normalizeSvgSize → SvgStyleTransform (smartHachure ON for the
// rough family) — wrapped in the REAL providers, in a real Chromium page. This
// is the twin of tools/2d/audit-style-sweep-harness.tsx, but instead of the
// curated 197-shape catalog it renders whatever markup the driver injects.
//
// The driver (render-survival-battery.mjs) drives it through window.__rsb:
//   .styles            — the F3 SVG style ids in dropdown order
//   .setStyle(id)      — force the global style + apply its preset (chrome parity)
//   .render(markup)    — normalizeSvgSize(markup) then mount it in the cell,
//                        returns { normalizeMs, normalizeThrew, normalizeWarn,
//                        renderMs } once React has committed + painted.
//   .clear()           — empty the cell (so a giant fixture doesn't leak into
//                        the next render's perf measurement)
//   .ready             — true once mounted
//
// SvgStyleTransform's own try/catch DEGRADE-TO-RAW means a thrown transform
// will NOT crash the page — it renders raw source. The battery therefore
// catalogs the SYMPTOM (blank / flood / NaN-in-DOM / console error / over-budget
// time) rather than relying on an uncaught throw. That's the point: prove what
// the user would actually SEE on a hostile-but-sanitized upload.
//
// Repo-side tool only — tools/ never ships in the Make drag-drop.

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import '../../src/styles/theme.css';
import {
  F3SvgStyleProvider,
  useF3SvgStyle,
  F3_SVG_STYLES,
  type F3SvgStyle,
} from '../../src/app/state/F3SvgStyleContext';
import {
  F3RoughModifiersProvider,
  useF3RoughModifiers,
} from '../../src/app/state/F3RoughModifiersContext';
import {
  SvgStyleTransform,
  applyStylePreset,
  TextureFilterDefs,
} from '../../src/app/components/canvas/SvgStyleTransform';
import { normalizeSvgSize } from '../../src/app/lib/normalizeInput';

const STYLE_IDS = F3_SVG_STYLES.map((s) => s.id);

interface RenderResult {
  normalizeMs: number;
  normalizeThrew: string | null;
  normalizeWarn: string[]; // any console.warn emitted by normalizeSvgSize
  renderMs: number;
  injectedLen: number;
}

declare global {
  interface Window {
    __rsb?: {
      styles: string[];
      setStyle: (id: string) => Promise<{ style: string }>;
      render: (markup: string) => Promise<RenderResult>;
      clear: () => Promise<void>;
      ready: boolean;
    };
    __rsbReady?: boolean;
    __dd_diag?: boolean;
  }
}

// The /canvas upload branch passes block + 100%×100% so a viewBox-only uploaded
// svg can resolve percentage sizing and fill the frame — replicate that exact
// production call-site override so we test the REAL upload render, not the
// inline-block audit-cell render.
const UPLOAD_WRAPPER: CSSProperties = {
  display: 'block',
  width: '100%',
  height: '100%',
};

function Stage() {
  const { setState: setSvgStyle } = useF3SvgStyle();
  const { state: mods, replace } = useF3RoughModifiers();
  const modsRef = useRef(mods);
  modsRef.current = mods;

  // The injected markup string. We feed it as raw innerHTML inside a child of
  // SvgStyleTransform via dangerouslySetInnerHTML — exactly how DeskPage /
  // DrawPanel inject an uploaded/sanitized svg into the transform.
  const [markup, setMarkup] = useState<string>('');

  useEffect(() => {
    window.__dd_diag = true;

    // Capture console.warn so the normalizeSvgSize edge-path warns surface in
    // the per-item result (degenerate dims, unparseable, etc.).
    let warnSink: string[] = [];
    const origWarn = console.warn;
    console.warn = (...args: unknown[]) => {
      warnSink.push(args.map(String).join(' '));
      origWarn.apply(console, args as []);
    };

    const doubleRaf = () =>
      new Promise<void>((res) =>
        requestAnimationFrame(() => requestAnimationFrame(() => res())),
      );

    window.__rsb = {
      styles: STYLE_IDS,

      setStyle: (id: string) =>
        new Promise((resolve) => {
          const nextStyle = id as F3SvgStyle;
          flushSync(() => {
            setSvgStyle(nextStyle);
            replace(applyStylePreset(modsRef.current, nextStyle));
          });
          requestAnimationFrame(() =>
            requestAnimationFrame(() => resolve({ style: id })),
          );
        }),

      render: async (raw: string) => {
        // 1. normalizeSvgSize — the input-boundary call DeskPage/DrawPanel make.
        warnSink = [];
        let normalized = raw;
        let normalizeThrew: string | null = null;
        const t0 = performance.now();
        try {
          normalized = normalizeSvgSize(raw);
        } catch (e) {
          normalizeThrew = (e as Error).message ?? String(e);
          normalized = raw; // fall through to render the raw markup, honest
        }
        const normalizeMs = performance.now() - t0;
        const normalizeWarn = [...warnSink];

        // 2. mount it + let the SvgStyleTransform effect (clone + smartHachure /
        //    rough / texture) run + paint. Time the whole commit→paint window.
        const t1 = performance.now();
        flushSync(() => setMarkup(normalized));
        await doubleRaf();
        // a second settle for the filter-heavy styles whose effect mutates the
        // DOM after the first paint (wet-ink/charcoal/risograph/newsprint).
        await new Promise<void>((res) => setTimeout(res, 0));
        await doubleRaf();
        const renderMs = performance.now() - t1;

        return {
          normalizeMs,
          normalizeThrew,
          normalizeWarn,
          renderMs,
          injectedLen: normalized.length,
        };
      },

      clear: async () => {
        flushSync(() => setMarkup(''));
        await doubleRaf();
      },

      ready: true,
    };

    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        window.__rsbReady = true;
      }),
    );

    return () => {
      console.warn = origWarn;
      window.__dd_diag = false;
    };
  }, [setSvgStyle, replace]);

  return (
    <div
      id="rsb-cell"
      data-rsb-cell
      style={{
        width: 360,
        height: 360,
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: 'var(--dir-bg)',
        border: '1px solid #e7e1d5',
      }}
    >
      {markup ? (
        <SvgStyleTransform wrapperOverride={UPLOAD_WRAPPER}>
          {/* Raw injection mirrors the production sink (dangerouslySetInnerHTML
              of a sanitized/normalized svg string). A wrapping div carries the
              size so percentage-sized uploaded svgs resolve. */}
          <div
            style={{ width: '100%', height: '100%' }}
            dangerouslySetInnerHTML={{ __html: markup }}
          />
        </SvgStyleTransform>
      ) : null}
    </div>
  );
}

function App() {
  return (
    <F3SvgStyleProvider>
      <F3RoughModifiersProvider>
        {/* Hidden defs the newsprint mask + wet-ink/charcoal filters reference;
            without it those styles mask to blank (harness artifact, not a bug). */}
        <TextureFilterDefs />
        <div
          style={{
            fontFamily: 'ui-monospace, Menlo, monospace',
            fontSize: 12,
            padding: 16,
            color: '#1a1a1a',
            background: '#faf8f3',
            minHeight: '100vh',
          }}
        >
          <h1 style={{ fontSize: 16, margin: '0 0 8px' }}>
            Render-Survival Battery — edge / hostile-sanitized SVG through the 2D
            render path
          </h1>
          <div style={{ marginBottom: 12, color: '#555' }}>
            Target: <code>normalizeSvgSize → SvgStyleTransform</code> · driven by
            render-survival-battery.mjs via <code>window.__rsb</code>
          </div>
          <Stage />
        </div>
      </F3RoughModifiersProvider>
    </F3SvgStyleProvider>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
