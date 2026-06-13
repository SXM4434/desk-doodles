// 2D audit-catalog TOGGLE-CLUSTER sweep harness — Cluster 4 (surface texture)
// + Cluster 5 (color/palette) + geometry sliders, vs Clean.
//
// Twin of audit-style-sweep-harness.tsx but the headless API can set ANY
// modifier (not just the style preset). Renders the REAL deduped 197-shape
// /audit inventory (PinShape + PegToolShape) through the REAL SvgStyleTransform
// 2D path with smartHachure ON, wrapped in the REAL providers + TextureFilterDefs.
//
// window.__sweep API (driven headless by toggle-cluster-sweep.mjs):
//   .inventory               — [{ kind, shape, label, subjectId, subjectName }]
//   .setState(style, mods)   — set the F3 SVG style AND a full modifier object
//                              (NOT a preset snap — the driver controls every
//                              value). flushSync commit + double-rAF settle, so
//                              the driver's screenshot sees the exact render.
//   .defaultMods             — DEFAULT_MODIFIERS, the per-style preset baseline
//   .presetFor(style)        — applyStylePreset(DEFAULT, style): the chrome's
//                              real per-style baseline, the start point a sweep
//                              perturbs ONE toggle from.
//   .ready                   — true once the first paint settled
//
// Deterministic: smartHachure/rough.js seeding is the app's own. Same shape +
// style + mods always produce the same markup.
import { useEffect, useMemo, useRef } from 'react';
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
  DEFAULT_MODIFIERS,
  type F3ModifiersState,
} from '../../src/app/state/F3RoughModifiersContext';
import {
  SvgStyleTransform,
  applyStylePreset,
  TextureFilterDefs,
} from '../../src/app/components/canvas/SvgStyleTransform';
import { PinShape } from '../../src/app/lib/items/PinShape';
import { PegToolShape } from '../../src/app/lib/items/PegToolShape';
import {
  F3_TROPHY_WALL_SUBJECTS,
  F3_PEGBOARD_SUBJECTS,
  type F3TrophyWallShapeId,
  type F3PegboardShapeId,
} from '../../src/app/lib/items/identitySet';

// ─── Inventory (verbatim copy of DeskDoodlesAudit.flattenInventory) ─────────
type AuditCell =
  | { kind: 'trophy'; shape: F3TrophyWallShapeId; label: string; subjectId: string; subjectName: string }
  | { kind: 'pegboard'; shape: F3PegboardShapeId; label: string; subjectId: string; subjectName: string };

function flattenInventory(): AuditCell[] {
  const seenTrophy = new Set<F3TrophyWallShapeId>();
  const seenPeg = new Set<F3PegboardShapeId>();
  const out: AuditCell[] = [];
  for (const subj of F3_TROPHY_WALL_SUBJECTS) {
    for (const form of subj.forms) {
      if (seenTrophy.has(form.shape)) continue;
      seenTrophy.add(form.shape);
      out.push({ kind: 'trophy', shape: form.shape, label: form.label, subjectId: subj.id, subjectName: subj.displayName });
    }
  }
  for (const subj of F3_PEGBOARD_SUBJECTS) {
    for (const form of subj.forms) {
      if (seenPeg.has(form.shape)) continue;
      seenPeg.add(form.shape);
      out.push({ kind: 'pegboard', shape: form.shape, label: form.label, subjectId: subj.id, subjectName: subj.displayName });
    }
  }
  return out;
}

const INVENTORY = flattenInventory();

const CELL = 220;
const COLS = 7;

declare global {
  interface Window {
    __sweep?: {
      inventory: { kind: string; shape: string; label: string; subjectId: string; subjectName: string }[];
      setState: (style: string, mods: Partial<F3ModifiersState>) => Promise<{ style: string }>;
      defaultMods: F3ModifiersState;
      presetFor: (style: string) => F3ModifiersState;
      ready: boolean;
    };
    __dd_diag?: boolean;
    __sweepReady?: boolean;
  }
}

function Grid() {
  const { setState: setSvgStyle } = useF3SvgStyle();
  const { replace } = useF3RoughModifiers();

  useEffect(() => {
    window.__dd_diag = true;
    window.__sweep = {
      inventory: INVENTORY.map((c) => ({
        kind: c.kind,
        shape: c.shape,
        label: c.label,
        subjectId: c.subjectId,
        subjectName: c.subjectName,
      })),
      defaultMods: DEFAULT_MODIFIERS,
      presetFor: (style: string) => applyStylePreset(DEFAULT_MODIFIERS, style as F3SvgStyle),
      setState: (style: string, mods: Partial<F3ModifiersState>) =>
        new Promise((resolve) => {
          const nextStyle = style as F3SvgStyle;
          // Build the full mods from this style's REAL preset baseline, then
          // overlay the driver-specified toggle value(s). This mirrors what the
          // user sees: pick a style (snaps preset) then move ONE slider.
          const base = applyStylePreset(DEFAULT_MODIFIERS, nextStyle);
          const next: F3ModifiersState = { ...base, ...mods };
          flushSync(() => {
            setSvgStyle(nextStyle);
            replace(next);
          });
          requestAnimationFrame(() => requestAnimationFrame(() => resolve({ style })));
        }),
      ready: true,
    };
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        window.__sweepReady = true;
      }),
    );
    return () => {
      window.__dd_diag = false;
    };
  }, [setSvgStyle, replace]);

  const cells = useMemo(() => INVENTORY, []);

  return (
    <div
      id="grid"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${COLS}, ${CELL}px)`,
        gap: 0,
        background: '#fdfcf9',
      }}
    >
      {cells.map((cell) => (
        <div
          key={cell.shape}
          data-shape-id={cell.shape}
          data-subject-id={cell.subjectId}
          data-kind={cell.kind}
          style={{
            width: CELL,
            height: CELL,
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            background: 'var(--dir-bg)',
            border: '1px solid #e7e1d5',
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

// silence unused-import warning while keeping the style list available for ref
void F3_SVG_STYLES;

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
