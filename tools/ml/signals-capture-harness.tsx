// tools/ml/signals-capture-harness.tsx — FULL signal-vector capture harness.
//
// PURPOSE (task: "Re-pull from a headless /audit run capturing the FULL
// classify-time signal vector that signals.ts/extractSignals actually produces"):
// the persisted dataset only carries 3 features (darknessL, area, fillStyle).
// This harness re-derives the ENTIRE `Signals` value the production classifier
// sees — for every region of every audit shape — joined by (svgHash, regionPath)
// so it can be merged onto the blessed golden role labels.
//
// IT TOUCHES ZERO PRODUCTION CODE. It renders the EXACT /audit 197-shape
// inventory through the EXACT production providers + SvgStyleTransform (rough-
// handdrawn default, smartHachure ON — golden's render conditions), then exposes
// window.__ddSignals.capture() which, per shape cell, reproduces production's
// own clone step (cloneSvg in SvgStyleTransform: cloneNode(true) +
// setAttribute('overflow','visible') + style.overflow='visible') and runs the
// PRODUCTION extractAllSignals + hashSvg + ruleEngineProvider VERBATIM. So:
//   - svgHash matches golden exactly (djb2 over the same clone outerHTML)
//   - regionPath matches golden exactly (same getRenderableChildren walk)
//   - the signal vector IS what classify() reads at runtime — no leakage of any
//     post-classification field (fillStyle treatment is NOT a Signals member).
//
// Build:   npx vite build --config tools/ml/vite.signals.config.ts --outDir /tmp/dd-ml-sig-dist
// Preview: npx vite preview --config tools/ml/vite.signals.config.ts --outDir /tmp/dd-ml-sig-dist --port 4471 --strictPort
// Driver:  node tools/ml/capture-signals.mjs
//
// LIVE-DB: none. Offscreen render only — zero DB reads/writes.
import { useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import '../../src/styles/theme.css';
import {
  F3SvgStyleProvider,
  useF3SvgStyle,
  type F3SvgStyle,
} from '../../src/app/state/F3SvgStyleContext';
import {
  F3RoughModifiersProvider,
  useF3RoughModifiers,
} from '../../src/app/state/F3RoughModifiersContext';
import { SvgStyleTransform, TextureFilterDefs } from '../../src/app/components/canvas/SvgStyleTransform';
import { PinShape } from '../../src/app/lib/items/PinShape';
import { PegToolShape } from '../../src/app/lib/items/PegToolShape';
import {
  F3_TROPHY_WALL_SUBJECTS,
  F3_PEGBOARD_SUBJECTS,
  type F3TrophyWallShapeId,
  type F3PegboardShapeId,
} from '../../src/app/lib/items/identitySet';
// PRODUCTION modules — used verbatim, not reimplemented.
import { extractAllSignals } from '../../src/app/lib/smartHachure/signals';
import { hashSvg } from '../../src/app/lib/smartHachure/overrideStore';
import { ruleEngineProvider } from '../../src/app/lib/smartHachure/classifier';
import type { Signals } from '../../src/app/lib/smartHachure/types';

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
const CELL = 200;
const COLS = 8;

/** A captured row: full signal vector + rule-engine role, keyed by (svgHash, regionPath). */
type CapturedRow = {
  svgHash: string;
  regionPath: string;
  shape: string;
  subjectId: string;
  signals: Signals;
  ruleRole: string | null; // ruleEngineProvider role (null = no opinion → fallback to paper at runtime)
  ruleConfidence: number;
  ruleRawScore: number;
  ruleMargin: number;
  ruleFiredRules: string[];
};

declare global {
  interface Window {
    __ddSignals?: {
      inventory: { kind: string; shape: string; subjectId: string }[];
      capture: () => CapturedRow[];
      ready: boolean;
    };
    __ddSignalsReady?: boolean;
    __dd_diag?: boolean;
  }
}

/** Reproduce SvgStyleTransform.cloneSvg EXACTLY so hashSvg matches golden. */
function cloneLikeProduction(src: SVGSVGElement): SVGSVGElement {
  const clone = src.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('overflow', 'visible');
  clone.style.overflow = 'visible';
  return clone;
}

function captureAll(): CapturedRow[] {
  const rows: CapturedRow[] = [];
  const cells = document.querySelectorAll<HTMLElement>('[data-shape-id]');
  cells.forEach((cell) => {
    const shape = cell.getAttribute('data-shape-id') ?? '';
    const subjectId = cell.getAttribute('data-subject-id') ?? '';
    // The clean (hidden) SVG carries the SOURCE markup. When smartHachure runs,
    // SvgStyleTransform sets cleanRef display:none and renders the fx clone. We
    // want the clean source SVG (the input to renderSmartHachure), reproduced
    // through the same clone step production uses before hashing/extraction.
    // Prefer the hidden clean SVG; if not present, fall back to any svg in cell.
    const allSvgs = Array.from(cell.querySelectorAll<SVGSVGElement>('svg'));
    // The clean container is the one with display:none (production hides it
    // when needsClone). If both are visible (clean style), take the first.
    let cleanSvg: SVGSVGElement | null = null;
    for (const s of allSvgs) {
      const container = s.parentElement;
      if (container && getComputedStyle(container).display === 'none') {
        cleanSvg = s;
        break;
      }
    }
    if (!cleanSvg) cleanSvg = allSvgs[0] ?? null;
    if (!cleanSvg) return;

    // To extract signals the SVG must be DOM-connected (getBBox needs layout).
    // Production extracts on the clone which IS appended to the fx container.
    // Our clean SVG is already connected; clone it, attach to a hidden mount,
    // measure, then detach — so getBBox returns real geometry.
    const clone = cloneLikeProduction(cleanSvg);
    const mount = document.createElement('div');
    mount.style.cssText = 'position:absolute;left:-99999px;top:0;width:0;height:0;overflow:visible';
    const wrapSvgHolder = document.createElement('div');
    wrapSvgHolder.appendChild(clone);
    mount.appendChild(wrapSvgHolder);
    document.body.appendChild(mount);
    try {
      const svgHash = hashSvg(clone);
      const sigMap = extractAllSignals(clone);
      for (const [regionPath, signals] of sigMap.entries()) {
        const cls = ruleEngineProvider.classify(signals, {
          svgHash,
          regionPath,
          parentClassification: null,
          confidenceThreshold: 0.7,
        });
        rows.push({
          svgHash,
          regionPath,
          shape,
          subjectId,
          signals,
          ruleRole: cls?.role ?? null,
          ruleConfidence: cls?.confidence ?? 0,
          ruleRawScore: cls?.rawScore ?? 0,
          ruleMargin: cls?.margin ?? 0,
          ruleFiredRules: cls?.firedRules ?? [],
        });
      }
    } finally {
      document.body.removeChild(mount);
    }
  });
  return rows;
}

function Grid() {
  const { setState: setSvgStyle } = useF3SvgStyle();
  const { replace } = useF3RoughModifiers();
  // Match golden render conditions: rough-handdrawn default. We do NOT need to
  // change modifiers — signals are modifier-independent (extractSignals reads
  // only the source SVG geometry/style, never the F3 modifier state).
  useEffect(() => {
    window.__dd_diag = false;
    flushSync(() => {
      setSvgStyle('rough-handdrawn' as F3SvgStyle);
    });
    window.__ddSignals = {
      inventory: INVENTORY.map((c) => ({ kind: c.kind, shape: c.shape, subjectId: c.subjectId })),
      capture: captureAll,
      ready: true,
    };
    requestAnimationFrame(() =>
      requestAnimationFrame(() => requestAnimationFrame(() => { window.__ddSignalsReady = true; })),
    );
  }, [setSvgStyle, replace]);

  const cells = useMemo(() => INVENTORY, []);
  return (
    <div id="grid" style={{ display: 'grid', gridTemplateColumns: `repeat(${COLS}, ${CELL}px)`, gap: 0, background: '#fdfcf9' }}>
      {cells.map((cell) => (
        <div
          key={cell.shape}
          data-shape-id={cell.shape}
          data-subject-id={cell.subjectId}
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
