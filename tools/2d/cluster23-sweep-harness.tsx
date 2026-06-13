// Cluster 2 (pen tip) + Cluster 3 (shading/fill) TOGGLE sweep harness.
// Repo tool only. Renders the REAL /audit inventory (deduped 197 shapes:
// 93 Trophy Wall PinShape + 104 Pegboard PegToolShape) through the REAL
// SvgStyleTransform 2D path (smartHachure ON), wrapped in the REAL providers —
// exactly like tools/2d/audit-style-sweep-harness.tsx, but instead of forcing
// one of the 11 STYLES it forces ARBITRARY MODIFIER STATE so the driver can
// sweep penTip / texture / textureIntensity (Cluster 2) + fillStyle / hachureGap
// / hachureAngle / fillDensity / fillOpacity (Cluster 3) at LOW/MID/HIGH on a
// fixed base style.
//
// Base style for the toggle sweeps = 'rough-handdrawn' (the style whose
// MODIFIER_SETS_BY_STYLE includes ALL of penTip, fillStyle, hachureGap,
// hachureAngle, fillDensity, fillOpacity, texture, textureIntensity — so every
// toggle under test is actually live). 'clean' is also exposed as the
// ground-truth baseline (window.__sweep.setClean()).
//
// window.__sweep API (driven headless by cluster23-sweep.mjs):
//   .inventory          — [{ kind, shape, label, subjectId, subjectName }]
//   .setState(svgStyle, mods)  — set the global F3 SVG style to svgStyle and
//                         REPLACE the modifier state with `mods` (a full
//                         F3ModifiersState). flushSync commit + double-rAF.
//   .baseRough          — the rough-handdrawn preset merged onto DEFAULT
//                         (so the driver can spread overrides onto it).
//   .baseClean          — clean preset merged onto DEFAULT.
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

type AuditCell = {
  kind: 'trophy';
  shape: F3TrophyWallShapeId;
  label: string;
  subjectId: string;
  subjectName: string;
} | {
  kind: 'pegboard';
  shape: F3PegboardShapeId;
  label: string;
  subjectId: string;
  subjectName: string;
};

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

// Precompute the two base modifier states the driver spreads overrides onto.
const BASE_ROUGH = applyStylePreset(DEFAULT_MODIFIERS, 'rough-handdrawn');
const BASE_CLEAN = applyStylePreset(DEFAULT_MODIFIERS, 'clean');

declare global {
  interface Window {
    __sweep?: {
      inventory: { kind: string; shape: string; label: string; subjectId: string; subjectName: string }[];
      baseRough: F3ModifiersState;
      baseClean: F3ModifiersState;
      setState: (svgStyle: string, mods: F3ModifiersState) => Promise<{ ok: boolean }>;
      ready: boolean;
    };
    __sweepReady?: boolean;
    __dd_diag?: boolean;
  }
}

function Grid() {
  const { setState: setSvgStyle } = useF3SvgStyle();
  const { replace } = useF3RoughModifiers();

  useEffect(() => {
    window.__dd_diag = true;
    window.__sweep = {
      inventory: INVENTORY.map((c) => ({
        kind: c.kind, shape: c.shape, label: c.label, subjectId: c.subjectId, subjectName: c.subjectName,
      })),
      baseRough: BASE_ROUGH,
      baseClean: BASE_CLEAN,
      setState: (svgStyle: string, mods: F3ModifiersState) =>
        new Promise((resolve) => {
          flushSync(() => {
            setSvgStyle(svgStyle as F3SvgStyle);
            replace(mods);
          });
          requestAnimationFrame(() => requestAnimationFrame(() => resolve({ ok: true })));
        }),
      ready: true,
    };
    requestAnimationFrame(() => requestAnimationFrame(() => { window.__sweepReady = true; }));
    return () => { window.__dd_diag = false; };
  }, [setSvgStyle, replace]);

  const cells = useMemo(() => INVENTORY, []);

  return (
    <div
      id="grid"
      style={{ display: 'grid', gridTemplateColumns: `repeat(${COLS}, ${CELL}px)`, gap: 0, background: '#fdfcf9' }}
    >
      {cells.map((cell) => (
        <div
          key={cell.shape}
          data-shape-id={cell.shape}
          data-subject-id={cell.subjectId}
          data-kind={cell.kind}
          style={{
            width: CELL, height: CELL, boxSizing: 'border-box',
            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
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

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
