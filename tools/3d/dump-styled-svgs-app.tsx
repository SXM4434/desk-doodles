// DUMP STYLED SVGS app (see dump-styled-svgs.html). Repo tool only.
//
// Purpose: capture the SERIALIZED styled <svg> markup that the REAL
// SvgStyleTransform engine produces for real catalog objects (PinShape /
// PegToolShape — the EXACT same components /audit and the desk render) plus
// raw authored OUTLINES (the sanctioned new-asset pipeline: author the outline,
// run it through the engine so it inherits the hand — never a finished agent
// drawing). The portfolio Canvas-Lab 404 decision inlines these captures so
// every drawn mark on that page is engine output.
//
// Driven headless by tools/3d/dump-styled-svgs.mjs through window.__dump:
//   __dump.kindOf(shape)                → 'trophy' | 'pegboard' | null
//   __dump.capture(shape, style?)       → Promise<string | null>
//   __dump.captureRaw(markup, style?)   → Promise<string | null>
//
// READ-ONLY over src (same contract as catalog-orbit-app.tsx).

import { useEffect } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { SvgStyleTransform } from '../../src/app/components/canvas/SvgStyleTransform';
import { F3RoughModifiersProvider } from '../../src/app/state/F3RoughModifiersContext';
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

// ── inventory membership (same dedupe ground as /audit + catalog-orbit) ──────
const TROPHY = new Set<string>();
for (const subj of F3_TROPHY_WALL_SUBJECTS) for (const f of subj.forms) TROPHY.add(f.shape);
const PEG = new Set<string>();
for (const subj of F3_PEGBOARD_SUBJECTS) for (const f of subj.forms) PEG.add(f.shape);

function kindOf(shape: string): 'trophy' | 'pegboard' | null {
  if (TROPHY.has(shape)) return 'trophy';
  if (PEG.has(shape)) return 'pegboard';
  return null;
}

/** Seeds the style context when a non-default style is requested (the provider
 *  default is rough-handdrawn — the engine signature). */
function StyleSeed({ style }: { style: F3SvgStyle }) {
  const { state, setState } = useF3SvgStyle();
  useEffect(() => {
    if (state !== style) setState(style);
  }, [state, style, setState]);
  return null;
}

/** Raw authored outline mounted as real DOM (SvgStyleTransform reads the DOM). */
function RawSvg({ markup }: { markup: string }) {
  return <span dangerouslySetInnerHTML={{ __html: markup }} />;
}

const host = document.getElementById('capture-host') as HTMLDivElement;
let root: Root | null = null;

function captureNode(node: React.ReactNode, style: F3SvgStyle): Promise<string | null> {
  return new Promise((resolve) => {
    if (!root) root = createRoot(host);
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
    const hardStop = setTimeout(done, 5000);
    flushSync(() => {
      root!.render(
        <F3RoughModifiersProvider>
          <F3SvgStyleProvider>
            <StyleSeed style={style} />
            <SvgStyleTransform
              onRender={(s) => {
                latest = s;
                if (quiet) clearTimeout(quiet);
                quiet = setTimeout(done, 350);
              }}
            >
              {node}
            </SvgStyleTransform>
          </F3SvgStyleProvider>
        </F3RoughModifiersProvider>,
      );
    });
  });
}

function renderShape(shape: string): React.ReactNode {
  const kind = kindOf(shape);
  if (kind === 'trophy') return <PinShape shape={shape as F3TrophyWallShapeId} />;
  if (kind === 'pegboard') return <PegToolShape shape={shape as F3PegboardShapeId} />;
  return null;
}

declare global {
  interface Window {
    __dump: {
      kindOf: (shape: string) => 'trophy' | 'pegboard' | null;
      capture: (shape: string, style?: F3SvgStyle) => Promise<string | null>;
      captureRaw: (markup: string, style?: F3SvgStyle) => Promise<string | null>;
      counts: { trophy: number; pegboard: number };
    };
  }
}

window.__dump = {
  kindOf,
  capture: (shape, style = 'rough-handdrawn' as F3SvgStyle) => {
    const node = renderShape(shape);
    if (!node) return Promise.resolve(null);
    return captureNode(node, style);
  },
  captureRaw: (markup, style = 'rough-handdrawn' as F3SvgStyle) =>
    captureNode(<RawSvg markup={markup} />, style),
  counts: { trophy: TROPHY.size, pegboard: PEG.size },
};

const status = document.getElementById('status');
if (status) status.textContent = `dump-styled-svgs: ready · trophy ${TROPHY.size} · pegboard ${PEG.size}`;
