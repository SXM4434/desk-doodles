// 2D audit-catalog STYLE sweep harness (see audit-style-sweep.html). Repo tool
// only — renders the REAL /audit inventory (PinShape + PegToolShape, the same
// deduped 197-shape inventory the /audit page builds) through the REAL
// SvgStyleTransform 2D path with smartHachure ON, wrapped in the REAL providers.
//
// window.__sweep API (driven headless by audit-style-sweep.mjs):
//   .inventory          — [{ kind, shape, label, subjectId, subjectName }]
//   .styles             — the 11 F3 SVG style ids in dropdown order
//   .setStyle(id)       — force the global F3 SVG style AND apply that style's
//                         preset (exactly what the chrome dropdown does), then
//                         resolves once React has committed the re-render
//   .ready              — true once the first paint settled
//
// Deterministic: no randomness here; smartHachure/rough.js seeding is the app's
// own. Same shape + style always produces the same markup. This is the 2D twin
// of tools/3d/audit-sweep-harness.tsx.
import { useEffect, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
// Real W1 design tokens (--dir-* paper/ink/border) so PinShape/PegToolShape
// render with the same colors the /audit page uses. theme.css defines them on
// :root (light/w1 by default) — exactly the audit default.
import '../../src/styles/theme.css';
import { F3SvgStyleProvider, useF3SvgStyle, F3_SVG_STYLES, type F3SvgStyle } from '../../src/app/state/F3SvgStyleContext';
import {
  F3RoughModifiersProvider,
  useF3RoughModifiers,
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

// ─── Inventory (verbatim copy of DeskDoodlesAudit.flattenInventory) ─────────
// Dedupe by shape id, keep first subject seen, trophy then pegboard.

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
      out.push({
        kind: 'trophy',
        shape: form.shape,
        label: form.label,
        subjectId: subj.id,
        subjectName: subj.displayName,
      });
    }
  }
  for (const subj of F3_PEGBOARD_SUBJECTS) {
    for (const form of subj.forms) {
      if (seenPeg.has(form.shape)) continue;
      seenPeg.add(form.shape);
      out.push({
        kind: 'pegboard',
        shape: form.shape,
        label: form.label,
        subjectId: subj.id,
        subjectName: subj.displayName,
      });
    }
  }
  return out;
}

const INVENTORY = flattenInventory();
const STYLE_IDS = F3_SVG_STYLES.map((s) => s.id);

// Fixed cell so screenshots are deterministic + crisp for close-ups.
const CELL = 220;
const COLS = 7; // grid columns; affects only layout, not per-cell clip

declare global {
  interface Window {
    __sweep?: {
      inventory: { kind: string; shape: string; label: string; subjectId: string; subjectName: string }[];
      styles: string[];
      setStyle: (id: string) => Promise<{ style: string }>;
      ready: boolean;
    };
    __dd_diag?: boolean;
  }
}

// ─── Grid ────────────────────────────────────────────────────────────────────

function Grid() {
  const { setState: setSvgStyle } = useF3SvgStyle();
  const { state: mods, replace } = useF3RoughModifiers();
  const modsRef = useRef(mods);
  modsRef.current = mods;

  useEffect(() => {
    // dd-diag on so silent clamps log to console (the .mjs scrapes them).
    window.__dd_diag = true;

    window.__sweep = {
      inventory: INVENTORY.map((c) => ({
        kind: c.kind,
        shape: c.shape,
        label: c.label,
        subjectId: c.subjectId,
        subjectName: c.subjectName,
      })),
      styles: STYLE_IDS,
      setStyle: (id: string) =>
        new Promise((resolve) => {
          const nextStyle = id as F3SvgStyle;
          // EXACTLY what the chrome dropdown does: set style + snap modifiers to
          // that style's preset. flushSync forces the commit synchronously so the
          // driver's screenshot sees the new render.
          flushSync(() => {
            setSvgStyle(nextStyle);
            const next = applyStylePreset(modsRef.current, nextStyle);
            replace(next);
          });
          // double-rAF: let the SvgStyleTransform effect (clone + smartHachure)
          // run + paint after the state commit before the driver screenshots.
          requestAnimationFrame(() =>
            requestAnimationFrame(() => resolve({ style: id })),
          );
        }),
      ready: true,
    };
    // signal initial readiness once mounted + first paint
    requestAnimationFrame(() => requestAnimationFrame(() => {
      (window as unknown as { __sweepReady?: boolean }).__sweepReady = true;
    }));
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
            // paper bg — same as the audit art frame (var(--dir-bg))
            background: 'var(--dir-bg)',
            // 1px guide border so overflow-past-cell is visible to the eye in
            // the mosaic; the driver clips the INNER region for pixel metrics.
            border: '1px solid #e7e1d5',
          }}
        >
          <SvgStyleTransform>
            {cell.kind === 'trophy'
              ? <PinShape shape={cell.shape} />
              : <PegToolShape shape={cell.shape} />}
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
        {/* App.tsx mounts this GLOBALLY (inside the providers) — it renders the
            hidden <defs> the newsprint mask (dd-newsprint-dot-mask) + the
            dedicated wet-ink/charcoal <filter> blocks reference. Without it the
            newsprint mask ref resolves to nothing and every cell masks to blank
            — a harness artifact, NOT a product bug. */}
        <TextureFilterDefs />
        <Grid />
      </F3RoughModifiersProvider>
    </F3SvgStyleProvider>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
