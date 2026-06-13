// ARROW RULE board harness (see arrow-rule-board.html). Repo tool only.
// Mounts the REAL Stroke3DScene twice on the battery's arrow fixture:
//   pane A — no override: renders whatever TREATED_AS_CLOSED_DEFAULT says
//            (shipped 'rod' → open rod + "Open-ish — treat as closed?" chip)
//   pane B — initialTreatAsClosed override TRUE on the arrow stroke: the
//            'solid' variant verbatim (welded slab + "Treated as closed —
//            tap to open" chip). Flipping the constant to 'solid' makes pane
//            A render exactly like pane B — one line.
// The chips are LIVE (clicking logs a correction into the unified decision
// log — the driver clicks pane A's chip and asserts the slab + the receipt).
import { createRoot } from 'react-dom/client';
import { Stroke3DScene } from '../../src/app/components/canvas3d';
import {
  TREATED_AS_CLOSED_DEFAULT,
  strokeSignature,
} from '../../src/app/lib/geometry3d/strokeTo3d';
import { MARK_INTENT_FIXTURES } from './mark-intent-fixtures';

const arrow = MARK_INTENT_FIXTURES.find((f) => f.name === 'arrow')!;
const sig = strokeSignature(arrow.strokes[0]);

declare global {
  interface Window {
    __arrowBoardReady: boolean;
    __arrowBoard: { default: string; arrowSignature: string };
  }
}

createRoot(document.getElementById('pane-rod')!).render(
  <Stroke3DScene
    strokes={arrow.strokes}
    geometryMode="auto"
    style={{ width: '100%', height: '100%' }}
  />,
);

createRoot(document.getElementById('pane-solid')!).render(
  <Stroke3DScene
    strokes={arrow.strokes}
    geometryMode="auto"
    initialTreatAsClosed={{ [sig]: true }}
    style={{ width: '100%', height: '100%' }}
  />,
);

window.__arrowBoard = { default: TREATED_AS_CLOSED_DEFAULT, arrowSignature: sig };
window.__arrowBoardReady = true;
