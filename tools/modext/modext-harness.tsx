// MODIFIER-EXTREME 2D break-hunt harness — repo tool only, NOT wired into the
// app and NOT in the Make drag-drop set. Mounts ONE catalog shape (PinShape or
// PegToolShape, the same 197-shape inventory /audit uses) through the REAL
// SvgStyleTransform inside the REAL F3 providers, and exposes a window API so a
// playwright driver can push the modifier space to extremes + adversarial combos
// directly (bypassing chrome UI clicks for speed + precision) and read back the
// rendered DOM.
//
// Driven by tools/modext/modext-sweep.mjs. The bridge component stashes the
// providers' imperative setters (replace / setState) on window so the driver can
// set FULL modifier state + style + shape in one call, then read the produced SVG.
//
// Deterministic: same shape + same modifier state always produces the same render
// (rough.js is seeded in this codebase). No wall-clock dependence.
import { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../../src/styles/index.css';
import { applyRoughDotsDeterminismPatch } from '../../src/app/lib/patchRoughDots';
import { SvgStyleTransform, TextureFilterDefs } from '../../src/app/components/canvas/SvgStyleTransform';
import {
  F3RoughModifiersProvider,
  useF3RoughModifiers,
  DEFAULT_MODIFIERS,
  type F3ModifiersState,
} from '../../src/app/state/F3RoughModifiersContext';
import {
  F3SvgStyleProvider,
  useF3SvgStyle,
  type F3SvgStyle,
} from '../../src/app/state/F3SvgStyleContext';
import { PinShape } from '../../src/app/lib/items/PinShape';
import { PegToolShape } from '../../src/app/lib/items/PegToolShape';
import {
  F3_PEGBOARD_SUBJECTS,
  F3_TROPHY_WALL_SUBJECTS,
  type F3PegboardShapeId,
  type F3TrophyWallShapeId,
} from '../../src/app/lib/items/identitySet';

// ─── Inventory flatten (mirror of DeskDoodlesAudit.flattenInventory) ────────

interface Cell {
  kind: 'trophy' | 'pegboard';
  shape: string;
  label: string;
  subjectName: string;
}

function flattenInventory(): Cell[] {
  const seenT = new Set<string>();
  const seenP = new Set<string>();
  const out: Cell[] = [];
  for (const subj of F3_TROPHY_WALL_SUBJECTS) {
    for (const form of subj.forms) {
      if (seenT.has(form.shape)) continue;
      seenT.add(form.shape);
      out.push({ kind: 'trophy', shape: form.shape, label: form.label, subjectName: subj.displayName });
    }
  }
  for (const subj of F3_PEGBOARD_SUBJECTS) {
    for (const form of subj.forms) {
      if (seenP.has(form.shape)) continue;
      seenP.add(form.shape);
      out.push({ kind: 'pegboard', shape: form.shape, label: form.label, subjectName: subj.displayName });
    }
  }
  return out;
}

const INVENTORY = flattenInventory();
const BY_SHAPE = new Map(INVENTORY.map((c) => [c.shape, c]));

// ─── Bridge — stashes imperative setters + current state on window ──────────

declare global {
  interface Window {
    __modext?: {
      ready: boolean;
      inventory: Cell[];
      setShape: (shape: string) => void;
      setStyle: (style: F3SvgStyle) => void;
      setMods: (partial: Partial<F3ModifiersState>) => void;
      replaceMods: (full: F3ModifiersState) => void;
      reset: () => void;
      current: { shape: string; style: F3SvgStyle; mods: F3ModifiersState };
    };
    __modextSetShape?: (shape: string) => void;
  }
}

function Bridge({ onShape }: { onShape: (shape: string) => void }) {
  const { state: mods, replace, set } = useF3RoughModifiers();
  const { state: style, setState: setStyle } = useF3SvgStyle();

  useEffect(() => {
    window.__modext = {
      ready: true,
      inventory: INVENTORY,
      setShape: (shape: string) => onShape(shape),
      setStyle: (s: F3SvgStyle) => setStyle(s),
      setMods: (partial: Partial<F3ModifiersState>) => {
        for (const [k, v] of Object.entries(partial)) {
          set(k as keyof F3ModifiersState, v as never);
        }
      },
      replaceMods: (full: F3ModifiersState) => replace(full),
      reset: () => replace(DEFAULT_MODIFIERS),
      current: { shape: '', style, mods },
    };
    window.__modext.current = { shape: (window.__modext.current?.shape) || '', style, mods };
  });

  return null;
}

// ─── App ────────────────────────────────────────────────────────────────────

function Harness() {
  const [shape, setShape] = useState<string>(INVENTORY[0].shape);
  const cell = useMemo(() => BY_SHAPE.get(shape) ?? INVENTORY[0], [shape]);

  useEffect(() => {
    window.__modextSetShape = (s: string) => setShape(s);
    if (window.__modext) window.__modext.current.shape = shape;
  }, [shape]);

  return (
    <F3SvgStyleProvider>
      <F3RoughModifiersProvider>
        <Bridge onShape={setShape} />
        <TextureFilterDefs />
        <div id="modext-label">{cell.label} · {cell.shape} ({cell.kind})</div>
        <div
          id="modext-cell"
          style={{
            width: 360,
            height: 360,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            background: 'var(--dir-bg, #fdfcf9)',
            border: '1px solid #d8d2c6',
            boxSizing: 'border-box',
          }}
        >
          <SvgStyleTransform>
            {cell.kind === 'trophy'
              ? <PinShape shape={cell.shape as F3TrophyWallShapeId} />
              : <PegToolShape shape={cell.shape as F3PegboardShapeId} />}
          </SvgStyleTransform>
        </div>
      </F3RoughModifiersProvider>
    </F3SvgStyleProvider>
  );
}

// Match the real app entry: rough.js dots determinism patch must run before
// any rough.svg() render (issue #211, patchRoughDots.ts).
applyRoughDotsDeterminismPatch();

createRoot(document.getElementById('root')!).render(<Harness />);
