// CATALOG ORBIT app (see catalog-orbit.html). Repo tool only — NOT in the Make
// drag-drop, NOT wired into the app. READ-ONLY: imports + renders the EXACT
// product code, never edits it.
//
// THE POINT: the existing 3D engine already turns every catalog object into
// real geometry and renders it in the Rock-3D hand-drawn styles — this page
// just makes that render LIVE + DRAG-ORBITABLE. It mounts the PRODUCT scene
// component (`Stroke3DContents`, the same internals /canvas and the desk slots
// render) inside one <Canvas> with the product's own OrbitControls, so what
// you see IS the object's Rock-3D 3D version, spinnable 360°.
//
//   · Inventory = the EXACT 197 audit-catalog dedupe (PinShape/PegToolShape,
//     same as /audit + catalog-visual-3d) + the 36 Rock-3D font glyphs
//     (rock-glyphs.json, staged read-only from the portfolio Rock-3D-Lab).
//   · Default look = ROCK_3D_PRESET (lib/demoWall.tsx): svg-port + extrude +
//     matteClay. Under svg-port the engine ALWAYS builds the unified
//     pool-solid block with a front cap (Stroke3DScene builds memo) — the
//     hand-drawn isometric-block look: front cap WEARS the real styled 2D
//     render (SvgStyleTransform output, carved relief + etched marks), sides +
//     back come from the same watertight geometry.
//   · Mode switch (auto/rod/extrude/inflate/solid) + 3D style (svg-port/
//     hatch/native) + material + hatch grammar + block depth all exposed.
//     Inflate is NEVER the default.
//
// Driven headless by tools/3d/catalog-orbit-verify.mjs through window.__orbit
// (pick / set / tumble / shot). Deterministic apart from the engine's own
// seeded hand-feel.

import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { Canvas } from '@react-three/fiber';
import {
  Stroke3DContents,
  resolvePaperHex,
  type TumbleState,
} from '../../src/app/components/canvas3d/Stroke3DScene';
import { attachContextLossHandlers } from '../../src/app/components/canvas3d/contextLoss';
import {
  INK_3D_DEFAULT,
  DEFAULT_NATIVE_PROPS_3D,
  type MaterialPresetId,
} from '../../src/app/components/canvas3d/materials3d';
import {
  DEFAULT_MODE3D_PARAMS,
  type Mode3DParams,
} from '../../src/app/components/canvas3d/modeParams';
import type {
  HatchGrammar,
  HatchDirection,
  HatchInputs,
} from '../../src/app/components/canvas3d/hatchMaterial';
import type {
  GeometryModeSetting,
  StrokeInputPoint,
  ViewBoxSize,
} from '../../src/app/lib/geometry3d/strokeTo3d';
import { PinShape } from '../../src/app/lib/items/PinShape';
import { PegToolShape } from '../../src/app/lib/items/PegToolShape';
import { SvgStyleTransform } from '../../src/app/components/canvas/SvgStyleTransform';
import { F3RoughModifiersProvider } from '../../src/app/state/F3RoughModifiersContext';
import {
  F3SvgStyleProvider,
  useF3SvgStyle,
  F3_SVG_STYLES,
  type F3SvgStyle,
} from '../../src/app/state/F3SvgStyleContext';
import {
  F3_PEGBOARD_SUBJECTS,
  F3_TROPHY_WALL_SUBJECTS,
  type F3PegboardShapeId,
  type F3TrophyWallShapeId,
} from '../../src/app/lib/items/identitySet';
import ROCK_GLYPHS from './rock-glyphs.json';

// ─── Inventory (EXACT 197 dedupe — same as /audit + catalog-visual-3d) + glyphs ──

interface OrbitShape {
  kind: 'trophy' | 'pegboard' | 'glyph';
  shape: string;
  label: string;
}

function flattenInventory(): OrbitShape[] {
  const seenTrophy = new Set<string>();
  const seenPeg = new Set<string>();
  const out: OrbitShape[] = [];
  for (const subj of F3_TROPHY_WALL_SUBJECTS) {
    for (const form of subj.forms) {
      if (seenTrophy.has(form.shape)) continue;
      seenTrophy.add(form.shape);
      out.push({ kind: 'trophy', shape: form.shape, label: form.label });
    }
  }
  for (const subj of F3_PEGBOARD_SUBJECTS) {
    for (const form of subj.forms) {
      if (seenPeg.has(form.shape)) continue;
      seenPeg.add(form.shape);
      out.push({ kind: 'pegboard', shape: form.shape, label: form.label });
    }
  }
  // Rock-3D font glyphs (A–Z 0–9) — the same outlines rock3d.js draws.
  for (const g of ROCK_GLYPHS as Array<{ char: string; d: string }>) {
    out.push({ kind: 'glyph', shape: g.char, label: `Glyph ${g.char}` });
  }
  return out;
}

const INVENTORY = flattenInventory();
const GLYPH_BY_CHAR = new Map(
  (ROCK_GLYPHS as Array<{ char: string; d: string }>).map((g) => [g.char, g.d]),
);

/** Rock-3D glyph as a plain stroked SVG (rock3d.js draws the outline hollow —
 *  fill none, ink stroke). Coord range across all 36 glyphs: x 6–163.6,
 *  y 31.6–223.8 → viewBox 0 0 176 232 with width==viewBox (identity CTM so the
 *  styled-markup refit registers exactly). */
function GlyphShape({ char }: { char: string }) {
  const d = GLYPH_BY_CHAR.get(char) ?? '';
  return (
    <svg viewBox="0 0 176 232" width={176} height={232} aria-hidden="true">
      <path
        d={d}
        fill="none"
        stroke="var(--dir-text-primary)"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function renderSource(cell: OrbitShape) {
  if (cell.kind === 'trophy') return <PinShape shape={cell.shape as F3TrophyWallShapeId} />;
  if (cell.kind === 'pegboard') return <PegToolShape shape={cell.shape as F3PegboardShapeId} />;
  return <GlyphShape char={cell.shape} />;
}

// ─── SVG → stroke sampling (verbatim from catalog-visual-3d-harness) ─────────

const SCENE_VIEWBOX: ViewBoxSize = { w: 800, h: 600 };
const FIT_MARGIN = 0.08;
const SAMPLE_SPACING = 2.5;
const MIN_SAMPLES = 8;
const MAX_SAMPLES = 160;
const MAX_STROKES = 220; // mirrors the product MAX_STROKES_3D (R10 raise)

const samplerHost = document.getElementById('sampler')!;
const svgPortHost = document.getElementById('svgport-host')!;
let samplerRoot: Root | null = null;
let svgPortRoot: Root | null = null;

function nextFrame(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

interface SampleResult {
  strokes: StrokeInputPoint[][];
  sampledElements: number;
  /** Serialized styled <svg> from the REAL SvgStyleTransform (default style =
   *  rough-handdrawn, the engine signature), re-fit to the 800×600 scene —
   *  the svg-port markup the product rasterizes. null on capture failure. */
  svgPortMarkup: string | null;
}

/** Seeds the F3 style context to the requested 2D pen (the provider defaults
 *  to rough-handdrawn — the engine signature; the seed lets the tool capture
 *  any of the product's 11 styles). */
function StyleSeed({ style }: { style: F3SvgStyle }) {
  const { state, setState } = useF3SvgStyle();
  useEffect(() => {
    if (state !== style) setState(style);
  }, [state, style, setState]);
  return null;
}

/** Mount the shape inside the REAL F3 providers + SvgStyleTransform; its
 *  onRender seam hands back the serialized styled <svg> — the same markup the
 *  product feeds the 3D scene, so svg-port wears the EXACT 2D vibe. The seed
 *  re-styles asynchronously, so resolve DEBOUNCED on the LAST onRender (the
 *  first render is the provider default; the seeded style lands right after). */
function captureSvgPortMarkup(cell: OrbitShape, style: F3SvgStyle): Promise<string | null> {
  return new Promise((resolve) => {
    if (!svgPortRoot) svgPortRoot = createRoot(svgPortHost);
    let settled = false;
    let latest: string | null = null;
    let quiet: ReturnType<typeof setTimeout> | null = null;
    const done = () => {
      if (!settled) {
        settled = true;
        clearTimeout(hardStop);
        resolve(latest);
      }
    };
    const hardStop = setTimeout(done, 3000);
    flushSync(() => {
      svgPortRoot!.render(
        <F3RoughModifiersProvider>
          <F3SvgStyleProvider>
            <StyleSeed style={style} />
            <SvgStyleTransform
              onRender={(s) => {
                latest = s;
                if (quiet) clearTimeout(quiet);
                quiet = setTimeout(done, 300);
              }}
            >
              {renderSource(cell)}
            </SvgStyleTransform>
          </F3SvgStyleProvider>
        </F3RoughModifiersProvider>,
      );
    });
  });
}

async function sampleShape(cell: OrbitShape, style: F3SvgStyle): Promise<SampleResult> {
  if (!samplerRoot) samplerRoot = createRoot(samplerHost);
  flushSync(() => {
    samplerRoot!.render(renderSource(cell));
  });
  await nextFrame();

  const svgPortMarkup = await captureSvgPortMarkup(cell, style);

  const svg = samplerHost.querySelector('svg');
  if (!svg) return { strokes: [], sampledElements: 0, svgPortMarkup };

  const geomEls = Array.from(
    svg.querySelectorAll<SVGGeometryElement>(
      'path, rect, circle, ellipse, line, polyline, polygon',
    ),
  );

  const rawStrokes: Array<{ pts: Array<[number, number]>; len: number }> = [];
  for (const el of geomEls) {
    let len = 0;
    try {
      len = el.getTotalLength();
    } catch {
      continue;
    }
    if (!Number.isFinite(len) || len <= 0) continue;
    const m = el.getCTM();
    const n = Math.min(Math.max(Math.ceil(len / SAMPLE_SPACING), MIN_SAMPLES), MAX_SAMPLES);
    const pts: Array<[number, number]> = [];
    for (let i = 0; i <= n; i++) {
      const p = el.getPointAtLength((i / n) * len);
      if (m) {
        const t = new DOMPoint(p.x, p.y).matrixTransform(m);
        pts.push([t.x, t.y]);
      } else {
        pts.push([p.x, p.y]);
      }
    }
    rawStrokes.push({ pts, len });
  }

  rawStrokes.sort((a, b) => b.len - a.len);
  const kept = rawStrokes.slice(0, MAX_STROKES);

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const s of kept) {
    for (const [x, y] of s.pts) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (!Number.isFinite(minX) || maxX - minX < 1e-9 || maxY - minY < 1e-9) {
    return { strokes: [], sampledElements: 0, svgPortMarkup };
  }
  const spanX = maxX - minX;
  const spanY = maxY - minY;
  const scale = Math.min(
    (SCENE_VIEWBOX.w * (1 - 2 * FIT_MARGIN)) / spanX,
    (SCENE_VIEWBOX.h * (1 - 2 * FIT_MARGIN)) / spanY,
  );
  const offX = (SCENE_VIEWBOX.w - spanX * scale) / 2;
  const offY = (SCENE_VIEWBOX.h - spanY * scale) / 2;
  const strokes = kept.map((s) =>
    s.pts.map(([x, y]): StrokeInputPoint => [
      (x - minX) * scale + offX,
      (y - minY) * scale + offY,
    ]),
  );

  const fittedMarkup = svgPortMarkup
    ? refitMarkupToScene(svgPortMarkup, { minX, minY, scale, offX, offY })
    : null;

  return { strokes, sampledElements: strokes.length, svgPortMarkup: fittedMarkup };
}

/** Re-root a styled <svg> into the 800×600 SCENE_VIEWBOX with the SAME bbox-fit
 *  transform the strokes received (verbatim from catalog-visual-3d-harness). */
function refitMarkupToScene(
  markup: string,
  fit: { minX: number; minY: number; scale: number; offX: number; offY: number },
): string | null {
  try {
    const doc = new DOMParser().parseFromString(markup, 'image/svg+xml');
    const svg = doc.documentElement as unknown as SVGSVGElement;
    if (!svg || svg.tagName.toLowerCase() !== 'svg') return markup;
    const g = doc.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute(
      'transform',
      `translate(${fit.offX} ${fit.offY}) scale(${fit.scale}) translate(${-fit.minX} ${-fit.minY})`,
    );
    while (svg.firstChild) g.appendChild(svg.firstChild);
    svg.appendChild(g);
    svg.setAttribute('viewBox', `0 0 ${SCENE_VIEWBOX.w} ${SCENE_VIEWBOX.h}`);
    svg.setAttribute('width', String(SCENE_VIEWBOX.w));
    svg.setAttribute('height', String(SCENE_VIEWBOX.h));
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    return new XMLSerializer().serializeToString(svg);
  } catch {
    return markup;
  }
}

// ─── UI state ────────────────────────────────────────────────────────────────

interface OrbitConfig {
  geometryMode: GeometryModeSetting;
  style3d: 'native' | 'hatch' | 'svg-port';
  materialPreset: MaterialPresetId;
  hatchGrammar: HatchGrammar;
  hatchDirection: HatchDirection;
  /** Block thickness (modeParams.solid.depth) — svg-port always builds the
   *  unified block, so this is the isometric-block depth dial. */
  depth: number;
  /** svg-port emissive register — the engine's OWN live A/B hook
   *  (drawingTexture.ts `window.__svgPortPolarity`): 'pos' = PAPER form + dark
   *  marks (the literal 2D sketch — the Rock-3D showcase read) · 'neg' =
   *  ink-black form + light marks (the desk register). */
  polarity: 'pos' | 'neg';
  /** The 2D pen the svg-port front wears (the product's 11-style system). */
  svgStyle2d: F3SvgStyle;
}

/** The engine reads window.__svgPortPolarity at texture-build time; set it
 *  before the scene mounts and on every toggle (the Canvas key remounts the
 *  scene so the texture rebuilds under the new register). */
function applyPolarity(p: 'pos' | 'neg') {
  (window as unknown as { __svgPortPolarity?: string }).__svgPortPolarity = p;
}
applyPolarity('pos');

/** ROCK_3D_PRESET (lib/demoWall.tsx): extrude + svg-port + matteClay. svg-port
 *  routes to the unified block regardless of geometry mode — the showcase look.
 *  Inflate is NEVER the default (rejected balloon look). */
const DEFAULT_CONFIG: OrbitConfig = {
  geometryMode: 'extrude',
  style3d: 'svg-port',
  materialPreset: 'matteClay',
  hatchGrammar: 'cross-hatch',
  hatchDirection: 'fixed',
  depth: DEFAULT_MODE3D_PARAMS.solid.depth,
  polarity: 'pos',
  svgStyle2d: 'rough-handdrawn',
};

const GEOMETRY_MODES: GeometryModeSetting[] = ['auto', 'rod', 'extrude', 'inflate', 'solid'];
const STYLES: Array<{ id: OrbitConfig['style3d']; label: string }> = [
  { id: 'svg-port', label: 'SVG-port (Rock-3D)' },
  { id: 'hatch', label: 'Hatch' },
  { id: 'native', label: 'Native ink' },
];
const MATERIALS: MaterialPresetId[] = [
  'ink',
  'softGel',
  'matteClay',
  'glossyPlastic',
  'rubber',
  'signal',
];
const GRAMMARS: HatchGrammar[] = ['hachure', 'cross-hatch', 'stipple', 'contour'];

// ─── window API (verify driver seam) ─────────────────────────────────────────

declare global {
  interface Window {
    __orbitReady: boolean;
    __orbit: {
      count: number;
      shapes: OrbitShape[];
      /** Load object i (samples strokes + styled markup); resolves once the
       *  sample is committed (the 3D build/texture settle async after). */
      pick: (i: number) => Promise<{ strokes: number; hasMarkup: boolean }>;
      /** Merge a partial config (geometryMode / style3d / materialPreset /
       *  hatchGrammar / hatchDirection / depth). */
      set: (partial: Partial<OrbitConfig>) => void;
      /** Rotate the FORM in place (radians) — the turntable seam. Live drag
       *  stays on the product OrbitControls (camera). */
      tumble: (az: number, el: number) => void;
      /** PNG dataURL of the GL canvas (preserveDrawingBuffer on). */
      shot: () => string | null;
      state: () => { idx: number; cfg: OrbitConfig; strokes: number; hasMarkup: boolean };
    };
  }
}

// ─── App ─────────────────────────────────────────────────────────────────────

const railBtn = (active: boolean): CSSProperties => ({
  font: '11px/1.2 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  letterSpacing: '0.02em',
  padding: '5px 12px',
  borderRadius: 999,
  border: `1px solid ${active ? 'var(--dir-accent)' : 'var(--dir-border)'}`,
  background: active ? 'var(--dir-accent)' : 'var(--dir-raised)',
  color: active ? 'var(--dir-bg)' : 'var(--dir-text-secondary)',
  cursor: 'pointer',
});

const railSelect: CSSProperties = {
  font: '11px/1.2 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  padding: '5px 10px',
  borderRadius: 999,
  border: '1px solid var(--dir-border)',
  background: 'var(--dir-raised)',
  color: 'var(--dir-text-body)',
  maxWidth: 220,
};

const railLabel: CSSProperties = {
  font: '600 9px/1 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
  color: 'var(--dir-text-secondary)',
  marginRight: 2,
};

function OrbitApp() {
  const [idx, setIdx] = useState(() => {
    const i = INVENTORY.findIndex((s) => s.shape === 'sketchbook');
    return i >= 0 ? i : 0;
  });
  const [cfg, setCfg] = useState<OrbitConfig>(DEFAULT_CONFIG);
  const [sample, setSample] = useState<SampleResult | null>(null);
  const [busy, setBusy] = useState(true);
  const [paper] = useState(resolvePaperHex);
  const genRef = useRef(0);
  const tumbleRef = useRef<TumbleState>({ az: 0, el: 0 });
  const pickResolveRef = useRef<((r: { strokes: number; hasMarkup: boolean }) => void) | null>(
    null,
  );

  useEffect(() => {
    const gen = ++genRef.current;
    setBusy(true);
    (async () => {
      const s = await sampleShape(INVENTORY[idx], cfg.svgStyle2d);
      if (gen !== genRef.current) return;
      setSample(s);
      setBusy(false);
      const resolve = pickResolveRef.current;
      pickResolveRef.current = null;
      resolve?.({ strokes: s.strokes.length, hasMarkup: !!s.svgPortMarkup });
    })();
  }, [idx, cfg.svgStyle2d]);

  // Window API — reassigned every render so it never closes over stale state.
  useEffect(() => {
    window.__orbit = {
      count: INVENTORY.length,
      shapes: INVENTORY,
      pick: (i) =>
        new Promise((resolve) => {
          const clamped = Math.max(0, Math.min(INVENTORY.length - 1, i | 0));
          if (clamped === idx && sample) {
            resolve({ strokes: sample.strokes.length, hasMarkup: !!sample.svgPortMarkup });
            return;
          }
          pickResolveRef.current = resolve;
          setIdx(clamped);
        }),
      set: (partial) => setCfg((c) => ({ ...c, ...partial })),
      tumble: (az, el) => {
        tumbleRef.current = { az, el };
      },
      shot: () => {
        const canvas = document.querySelector('#stage canvas') as HTMLCanvasElement | null;
        return canvas ? canvas.toDataURL('image/png') : null;
      },
      state: () => ({
        idx,
        cfg,
        strokes: sample?.strokes.length ?? -1,
        hasMarkup: !!sample?.svgPortMarkup,
      }),
    };
    window.__orbitReady = true;
  });

  const modeParams = useMemo<Mode3DParams>(() => {
    const p: Mode3DParams = JSON.parse(JSON.stringify(DEFAULT_MODE3D_PARAMS));
    p.solid.depth = cfg.depth;
    return p;
  }, [cfg.depth]);

  const hatchInputs = useMemo<HatchInputs>(
    () => ({
      hachureGap: 4,
      hachureAngle: -41,
      strokeWidth: 1.2,
      inkIntensity: 1.0,
      grammar: cfg.hatchGrammar,
      direction: cfg.hatchDirection,
    }),
    [cfg.hatchGrammar, cfg.hatchDirection],
  );

  const cell = INVENTORY[idx];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* ── control rail (chrome, never in the stage) ── */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 8,
          padding: '10px 14px',
          borderBottom: '1px solid var(--dir-border)',
          background: 'var(--dir-bg)',
        }}
      >
        <span style={railLabel}>Object</span>
        <button
          type="button"
          style={railBtn(false)}
          onClick={() => setIdx((i) => (i - 1 + INVENTORY.length) % INVENTORY.length)}
        >
          ‹
        </button>
        <select
          style={railSelect}
          value={idx}
          onChange={(e) => setIdx(parseInt(e.target.value, 10))}
        >
          <optgroup label="Trophy wall">
            {INVENTORY.map((s, i) =>
              s.kind === 'trophy' ? (
                <option key={`${s.kind}-${s.shape}`} value={i}>
                  {s.label}
                </option>
              ) : null,
            )}
          </optgroup>
          <optgroup label="Pegboard">
            {INVENTORY.map((s, i) =>
              s.kind === 'pegboard' ? (
                <option key={`${s.kind}-${s.shape}`} value={i}>
                  {s.label}
                </option>
              ) : null,
            )}
          </optgroup>
          <optgroup label="Rock-3D glyphs">
            {INVENTORY.map((s, i) =>
              s.kind === 'glyph' ? (
                <option key={`${s.kind}-${s.shape}`} value={i}>
                  {s.label}
                </option>
              ) : null,
            )}
          </optgroup>
        </select>
        <button
          type="button"
          style={railBtn(false)}
          onClick={() => setIdx((i) => (i + 1) % INVENTORY.length)}
        >
          ›
        </button>

        <span style={{ ...railLabel, marginLeft: 10 }}>3D style</span>
        {STYLES.map((s) => (
          <button
            key={s.id}
            type="button"
            style={railBtn(cfg.style3d === s.id)}
            onClick={() => setCfg((c) => ({ ...c, style3d: s.id }))}
          >
            {s.label}
          </button>
        ))}

        <span style={{ ...railLabel, marginLeft: 10 }}>Geometry</span>
        {GEOMETRY_MODES.map((m) => (
          <button
            key={m}
            type="button"
            style={railBtn(cfg.geometryMode === m)}
            onClick={() => setCfg((c) => ({ ...c, geometryMode: m }))}
            title={
              cfg.style3d === 'svg-port'
                ? 'svg-port always wears the unified block (engine rule) — geometry mode applies to Hatch/Native'
                : undefined
            }
          >
            {m}
          </button>
        ))}

        {cfg.style3d === 'native' && (
          <>
            <span style={{ ...railLabel, marginLeft: 10 }}>Material</span>
            <select
              style={railSelect}
              value={cfg.materialPreset}
              onChange={(e) =>
                setCfg((c) => ({ ...c, materialPreset: e.target.value as MaterialPresetId }))
              }
            >
              {MATERIALS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </>
        )}

        {cfg.style3d === 'hatch' && (
          <>
            <span style={{ ...railLabel, marginLeft: 10 }}>Grammar</span>
            <select
              style={railSelect}
              value={cfg.hatchGrammar}
              onChange={(e) =>
                setCfg((c) => ({ ...c, hatchGrammar: e.target.value as HatchGrammar }))
              }
            >
              {GRAMMARS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
            <select
              style={railSelect}
              value={cfg.hatchDirection}
              onChange={(e) =>
                setCfg((c) => ({ ...c, hatchDirection: e.target.value as HatchDirection }))
              }
            >
              <option value="fixed">fixed</option>
              <option value="light">light-following</option>
            </select>
          </>
        )}

        {cfg.style3d === 'svg-port' && (
          <>
            <span style={{ ...railLabel, marginLeft: 10 }}>2D pen</span>
            <select
              style={railSelect}
              value={cfg.svgStyle2d}
              onChange={(e) =>
                setCfg((c) => ({ ...c, svgStyle2d: e.target.value as F3SvgStyle }))
              }
            >
              {F3_SVG_STYLES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            <span style={{ ...railLabel, marginLeft: 10 }}>Front</span>
            {(['pos', 'neg'] as const).map((p) => (
              <button
                key={p}
                type="button"
                style={railBtn(cfg.polarity === p)}
                onClick={() => {
                  applyPolarity(p);
                  setCfg((c) => ({ ...c, polarity: p }));
                }}
              >
                {p === 'pos' ? 'Paper sketch (Rock-3D)' : 'Ink block'}
              </button>
            ))}
          </>
        )}

        <span style={{ ...railLabel, marginLeft: 10 }}>Depth</span>
        <input
          type="range"
          min={0.1}
          max={1.35}
          step={0.01}
          value={cfg.depth}
          onChange={(e) => setCfg((c) => ({ ...c, depth: parseFloat(e.target.value) }))}
          style={{ width: 90 }}
        />

        <span
          style={{
            marginLeft: 'auto',
            font: '10px/1.2 ui-monospace, monospace',
            color: 'var(--dir-text-body-soft)',
          }}
          data-orbit-status
        >
          {cell.kind}/{cell.shape} · {sample?.strokes.length ?? 0} strokes
          {busy ? ' · sampling…' : ' · drag to orbit'}
        </span>
      </div>

      {/* ── the live orbit stage — the EXACT product scene, spinnable ── */}
      <div id="stage" style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        <Canvas
          // Remount on polarity flip — the engine reads the register at
          // texture-BUILD time, so the scene must rebuild under the new flag.
          key={cfg.polarity}
          dpr={[1, 2]}
          camera={{ position: [0, 1.5, 7], fov: 40 }}
          gl={{ antialias: true, preserveDrawingBuffer: true }}
          onCreated={({ gl }) => attachContextLossHandlers(gl)}
          style={{ width: '100%', height: '100%' }}
        >
          <Stroke3DContents
            strokes={sample?.strokes ?? []}
            viewBox={SCENE_VIEWBOX}
            geometryMode={cfg.geometryMode}
            style3d={cfg.style3d}
            materialPreset={cfg.style3d === 'native' ? cfg.materialPreset : undefined}
            nativeProps={DEFAULT_NATIVE_PROPS_3D}
            modeParams={modeParams}
            hatchInputs={hatchInputs}
            svgPortMarkup={sample?.svgPortMarkup ?? undefined}
            bg={paper}
            ink={INK_3D_DEFAULT}
            orbit
            tumbleRef={tumbleRef}
          />
        </Canvas>
        {busy && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              font: '12px/1 ui-monospace, monospace',
              color: 'var(--dir-text-body-soft)',
              background: 'color-mix(in oklab, var(--dir-bg) 65%, transparent)',
              pointerEvents: 'none',
            }}
          >
            sampling {cell.label}…
          </div>
        )}
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<OrbitApp />);
