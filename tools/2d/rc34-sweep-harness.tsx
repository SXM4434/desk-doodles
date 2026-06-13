// RC-3 / RC-4 focused VISUAL-VERIFY harness (repo tool only).
//
// Renders the REAL deduped /audit inventory (197 shapes) through the REAL
// SvgStyleTransform 2D path, wrapped in the REAL providers, sweeping:
//   • Clean baseline (source palette, ink 1.0) — the reference.
//   • EVERY strokePalette mode (10) at ink 1.0 — RC-3. The bg / inverted modes
//     are the ones that previously mapped INK → var(--dir-bg) = paper, so the
//     stroke vanished on ~every shape. Swept in BOTH a CSS-route style (clean,
//     which resolves stroke via the data-f3-stroke CSS rules) AND a rough-family
//     style (rough-handdrawn, which resolves stroke via JS mapPaletteColor) so
//     both fix paths are exercised.
//   • inkIntensity at 0 / min-floor / mid / max — RC-4. inkIntensity=0 drove
//     wrapper opacity → 0 (blank); the floor must keep the minimum visible.
//
// The driver (rc34-sweep.mjs) flags BLANK cells (inkFrac < 0.2%) — the exact
// "ink vanished" signal — and builds one mosaic per case + Clean reference.
//
// window.__sweep API mirrors audit-toggle-sweep-harness for headless driving.
import { useEffect, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import '../../src/styles/theme.css';
import { F3SvgStyleProvider, useF3SvgStyle, type F3SvgStyle } from '../../src/app/state/F3SvgStyleContext';
import {
  F3RoughModifiersProvider,
  useF3RoughModifiers,
  DEFAULT_MODIFIERS,
  PALETTE_MODE_STEPS,
  type F3ModifiersState,
  type PaletteModeStep,
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

// ─── RC-3 / RC-4 CASE MATRIX ─────────────────────────────────────────────────

type SweepCase = {
  id: string;
  style: F3SvgStyle;
  // overrides applied over the style preset
  overrides: Partial<F3ModifiersState>;
  note: string;
};

function buildCases(): SweepCase[] {
  const out: SweepCase[] = [];
  // Clean reference — source palette, full ink, both routes' baseline.
  out.push({ id: 'ref__clean__source', style: 'clean', overrides: { strokePalette: 'source', inkIntensity: 1.0 }, note: 'Clean reference (CSS route)' });
  out.push({ id: 'ref__rough__source', style: 'rough-handdrawn', overrides: { strokePalette: 'source', inkIntensity: 1.0 }, note: 'rough-handdrawn reference (JS route)' });

  // RC-3 — every strokePalette mode at full ink, in BOTH routes.
  for (const mode of PALETTE_MODE_STEPS as PaletteModeStep[]) {
    out.push({ id: `rc3__clean__${mode}`, style: 'clean', overrides: { strokePalette: mode, inkIntensity: 1.0 }, note: `RC-3 CSS-route strokePalette=${mode}` });
    out.push({ id: `rc3__rough__${mode}`, style: 'rough-handdrawn', overrides: { strokePalette: mode, inkIntensity: 1.0 }, note: `RC-3 JS-route strokePalette=${mode}` });
  }

  // RC-4 — inkIntensity 0 / floor / mid / max, in BOTH routes, source palette.
  const inkLevels: { lvl: string; v: number }[] = [
    { lvl: '0', v: 0 },
    { lvl: 'min', v: 0.15 },
    { lvl: 'mid', v: 0.5 },
    { lvl: 'max', v: 1.0 },
  ];
  for (const { lvl, v } of inkLevels) {
    out.push({ id: `rc4__clean__ink-${lvl}`, style: 'clean', overrides: { strokePalette: 'source', inkIntensity: v }, note: `RC-4 CSS-route inkIntensity=${v}` });
    out.push({ id: `rc4__rough__ink-${lvl}`, style: 'rough-handdrawn', overrides: { strokePalette: 'source', inkIntensity: v }, note: `RC-4 JS-route inkIntensity=${v}` });
  }
  return out;
}

const CASES = buildCases();
const CELL = 160;
const COLS = 14;

declare global {
  interface Window {
    __sweep?: {
      inventory: { kind: string; shape: string; label: string; subjectId: string; subjectName: string }[];
      cases: SweepCase[];
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
    const byId = new Map(CASES.map((c) => [c.id, c]));
    window.__sweep = {
      inventory: INVENTORY.map((c) => ({ kind: c.kind, shape: c.shape, label: c.label, subjectId: c.subjectId, subjectName: c.subjectName })),
      cases: CASES,
      setCase: (id: string) =>
        new Promise((resolve) => {
          const c = byId.get(id)!;
          flushSync(() => {
            setSvgStyle(c.style);
            // baseline = the style preset applied to a hard DEFAULT_MODIFIERS
            // root so prior case's non-preset keys can't bleed across cases.
            const base = applyStylePreset(DEFAULT_MODIFIERS, c.style);
            replace({ ...base, ...c.overrides } as F3ModifiersState);
          });
          requestAnimationFrame(() => requestAnimationFrame(() => resolve({ id })));
        }),
      ready: true,
    };
    requestAnimationFrame(() => requestAnimationFrame(() => { window.__sweepReady = true; }));
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
