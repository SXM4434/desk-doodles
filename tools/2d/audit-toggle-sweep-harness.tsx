// 2D audit-catalog TOGGLE sweep harness (see audit-toggle-sweep.html). Repo tool
// only — renders the REAL /audit inventory (deduped 197 shapes: PinShape +
// PegToolShape) through the REAL SvgStyleTransform 2D path (smartHachure ON),
// wrapped in the REAL providers. UNLIKE audit-style-sweep (which sweeps the 11
// STYLE presets), this sweeps EVERY TOGGLE at LOW / MID / HIGH within its
// owning style's preset baseline — the dimension Sebs's full-sweep law requires
// ("sweep every toggle's low/mid/high"). One toggle is moved at a time; all
// other modifiers stay at the style preset.
//
// window.__sweep API (driven headless by audit-toggle-sweep.mjs):
//   .inventory   — [{ kind, shape, label, subjectId, subjectName }]
//   .cases       — [{ id, style, mod, level, value }] every (toggle × level)
//   .setCase(id) — apply the case's style preset, then override the one mod to
//                  the case value; flushSync + double-rAF before resolving
//   .ready
import { useEffect, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import '../../src/styles/theme.css';
import { F3SvgStyleProvider, useF3SvgStyle, type F3SvgStyle } from '../../src/app/state/F3SvgStyleContext';
import {
  F3RoughModifiersProvider,
  useF3RoughModifiers,
  DEFAULT_MODIFIERS,
  type F3ModifiersState,
} from '../../src/app/state/F3RoughModifiersContext';
import { SvgStyleTransform, applyStylePreset, TextureFilterDefs } from '../../src/app/components/canvas/SvgStyleTransform';
import { PinShape } from '../../src/app/lib/items/PinShape';
import { PegToolShape } from '../../src/app/lib/items/PegToolShape';
import {
  F3_TROPHY_WALL_SUBJECTS,
  F3_PEGBOARD_SUBJECTS,
  type F3TrophyWallShapeId,
  type F3PegboardShapeId,
} from '../../src/app/lib/items/identitySet';

type AuditCell =
  | { kind: 'trophy'; shape: F3TrophyWallShapeId; label: string; subjectId: string; subjectName: string }
  | { kind: 'pegboard'; shape: F3PegboardShapeId; label: string; subjectId: string; subjectName: string };

function flattenInventory(): AuditCell[] {
  const seenTrophy = new Set<F3TrophyWallShapeId>();
  const seenPeg = new Set<F3PegboardShapeId>();
  const out: AuditCell[] = [];
  for (const subj of F3_TROPHY_WALL_SUBJECTS)
    for (const form of subj.forms) {
      if (seenTrophy.has(form.shape)) continue;
      seenTrophy.add(form.shape);
      out.push({ kind: 'trophy', shape: form.shape, label: form.label, subjectId: subj.id, subjectName: subj.displayName });
    }
  for (const subj of F3_PEGBOARD_SUBJECTS)
    for (const form of subj.forms) {
      if (seenPeg.has(form.shape)) continue;
      seenPeg.add(form.shape);
      out.push({ kind: 'pegboard', shape: form.shape, label: form.label, subjectId: subj.id, subjectName: subj.displayName });
    }
  return out;
}

const INVENTORY = flattenInventory();

// ─── TOGGLE CASE MATRIX ──────────────────────────────────────────────────────
// Each toggle is swept LOW/MID/HIGH inside the style whose preset actually
// activates it (so the sweep exercises the real product render path for that
// toggle, not a dead path). For sliders LOW/MID/HIGH = min / midpoint / max
// from SLIDER_SPECS. For discrete dropdowns we pick three representative steps.

type ToggleCase = {
  id: string;
  style: F3SvgStyle;
  mod: keyof F3ModifiersState;
  level: 'low' | 'mid' | 'high';
  value: number | string;
};

// slider min/mid/max — kept in sync with modifierSpecs.SLIDER_SPECS
const S = (min: number, max: number) => ({ low: min, mid: +(min + (max - min) / 2).toFixed(3), high: max });

// (style that activates the toggle, slider range, OR discrete steps low/mid/high)
const SLIDER_CASES: { style: F3SvgStyle; mod: keyof F3ModifiersState; range: ReturnType<typeof S> }[] = [
  // rough-handdrawn family hand-feel + fill sliders
  { style: 'rough-handdrawn', mod: 'wobble', range: S(0, 2.0) },
  { style: 'rough-handdrawn', mod: 'jaggedness', range: S(0, 2.0) },
  { style: 'rough-handdrawn', mod: 'simplification', range: S(0, 2.0) },
  { style: 'rough-handdrawn', mod: 'bowing', range: S(0, 2.5) },
  { style: 'rough-handdrawn', mod: 'strokeWidth', range: S(0.5, 3.0) },
  { style: 'rough-handdrawn', mod: 'curveDamp', range: S(0, 1.5) },
  { style: 'rough-handdrawn', mod: 'hachureGap', range: S(1, 12) },
  { style: 'rough-handdrawn', mod: 'hachureAngle', range: S(-90, 90) },
  { style: 'rough-handdrawn', mod: 'fillDensity', range: S(0, 1.2) },
  { style: 'rough-handdrawn', mod: 'inkIntensity', range: S(0, 1) },
  { style: 'rough-handdrawn', mod: 'fillOpacity', range: S(0, 1) },
  { style: 'rough-handdrawn', mod: 'textureIntensity', range: S(0, 3) },
  // wet-ink sliders
  { style: 'wet-ink', mod: 'blurAmount', range: S(0, 1.5) },
  { style: 'wet-ink', mod: 'bleed', range: S(0, 1) },
  // charcoal sliders
  { style: 'charcoal', mod: 'grainIntensity', range: S(0, 2.5) },
  { style: 'charcoal', mod: 'smudgeAmount', range: S(0, 2) },
  { style: 'charcoal', mod: 'pressureVariance', range: S(0, 1) },
  // stipple / newsprint dot sliders
  { style: 'stipple', mod: 'dotSize', range: S(0.3, 6) },
  { style: 'stipple', mod: 'dotSpacing', range: S(1, 20) },
  { style: 'stipple', mod: 'dotScatter', range: S(0, 1) },
  // risograph sliders
  { style: 'risograph', mod: 'offsetDistance', range: S(0, 6) },
  { style: 'risograph', mod: 'offsetAngle', range: S(-180, 180) },
  { style: 'risograph', mod: 'colorShift', range: S(0, 1) },
  { style: 'risograph', mod: 'registrationError', range: S(0, 1.5) },
];

// discrete dropdown cases — low/mid/high = three representative enum steps.
const DISCRETE_CASES: { style: F3SvgStyle; mod: keyof F3ModifiersState; vals: [string, string, string] }[] = [
  { style: 'rough-handdrawn', mod: 'multiStroke', vals: ['off', 'triple', 'heavy'] },
  { style: 'rough-handdrawn', mod: 'fillStyle', vals: ['solid', 'cross-hatch', 'zigzag-line'] },
  { style: 'rough-handdrawn', mod: 'endpointBehavior', vals: ['clean', 'protrude', 'kink'] },
  { style: 'rough-handdrawn', mod: 'sketchingStyle', vals: ['single-pass', 'parallel-pass', 'cross-rotate'] },
  { style: 'rough-handdrawn', mod: 'penTip', vals: ['plain', 'pencil-2b', 'charcoal'] },
  { style: 'rough-handdrawn', mod: 'texture', vals: ['none', 'ribbed', 'canvas'] },
  { style: 'rough-handdrawn', mod: 'strokePalette', vals: ['source', 'accent', 'inverted'] },
  { style: 'rough-handdrawn', mod: 'fillPalette', vals: ['source', 'secondary', 'inverted'] },
  { style: 'newsprint', mod: 'dotPattern', vals: ['grid', 'random', 'concentric'] },
  { style: 'risograph', mod: 'risoSecondaryColor', vals: ['accent', 'secondary', 'inverted'] },
];

function buildCases(): ToggleCase[] {
  const out: ToggleCase[] = [];
  for (const c of SLIDER_CASES) {
    (['low', 'mid', 'high'] as const).forEach((lvl) => {
      out.push({ id: `${c.style}__${c.mod}__${lvl}`, style: c.style, mod: c.mod, level: lvl, value: c.range[lvl] });
    });
  }
  for (const c of DISCRETE_CASES) {
    (['low', 'mid', 'high'] as const).forEach((lvl, i) => {
      out.push({ id: `${c.style}__${c.mod}__${lvl}`, style: c.style, mod: c.mod, level: lvl, value: c.vals[i] });
    });
  }
  return out;
}

const CASES = buildCases();
const CELL = 220;
const COLS = 14;

declare global {
  interface Window {
    __sweep?: {
      inventory: { kind: string; shape: string; label: string; subjectId: string; subjectName: string }[];
      cases: ToggleCase[];
      setCase: (id: string) => Promise<{ id: string }>;
      ready: boolean;
    };
    __sweepReady?: boolean;
    __dd_diag?: boolean;
  }
}

function Grid() {
  const { setState: setSvgStyle } = useF3SvgStyle();
  const { state: mods, replace } = useF3RoughModifiers();
  const modsRef = useRef(mods);
  modsRef.current = mods;

  useEffect(() => {
    window.__dd_diag = true;
    const byId = new Map(CASES.map((c) => [c.id, c]));
    window.__sweep = {
      inventory: INVENTORY.map((c) => ({ kind: c.kind, shape: c.shape, label: c.label, subjectId: c.subjectId, subjectName: c.subjectName })),
      cases: CASES,
      setCase: (id: string) =>
        new Promise((resolve) => {
          const c = byId.get(id)!;
          flushSync(() => {
            setSvgStyle(c.style);
            // baseline = the style's preset applied to a hard DEFAULT_MODIFIERS
            // root (NOT modsRef.current) so the prior case's non-preset keys
            // (strokePalette / fillPalette / penTip / endpointBehavior /
            // sketchingStyle) CANNOT bleed across cases. Then override the one
            // swept modifier. This makes every case fully independent.
            const base = applyStylePreset(DEFAULT_MODIFIERS, c.style);
            replace({ ...base, [c.mod]: c.value } as F3ModifiersState);
          });
          requestAnimationFrame(() => requestAnimationFrame(() => resolve({ id })));
        }),
      ready: true,
    };
    requestAnimationFrame(() => requestAnimationFrame(() => { window.__sweepReady = true; }));
    return () => { window.__dd_diag = false; };
  }, [setSvgStyle, replace]);

  const cells = useMemo(() => INVENTORY, []);
  return (
    <div id="grid" style={{ display: 'grid', gridTemplateColumns: `repeat(${COLS}, ${CELL}px)`, gap: 0, background: '#fdfcf9' }}>
      {cells.map((cell) => (
        <div
          key={cell.shape}
          data-shape-id={cell.shape}
          data-subject-id={cell.subjectId}
          data-kind={cell.kind}
          style={{
            width: CELL, height: CELL, boxSizing: 'border-box', display: 'flex',
            alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
            background: 'var(--dir-bg)', border: '1px solid #e7e1d5',
          }}
        >
          <SvgStyleTransform>
            {cell.kind === 'trophy' ? <PinShape shape={cell.shape} /> : <PegToolShape shape={cell.shape} />}
          </SvgStyleTransform>
        </div>
      ))}
    </div>
  );
}

function App() {
  return (
    <F3SvgStyleProvider>
      <F3RoughModifiersProvider>
        <TextureFilterDefs />
        <Grid />
      </F3RoughModifiersProvider>
    </F3SvgStyleProvider>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
