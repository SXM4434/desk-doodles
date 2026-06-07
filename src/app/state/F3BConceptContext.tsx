import { createContext, useContext, useState, type ReactNode } from 'react';

// F3-B concept selector — 7 candidate concepts per F3-B.md §C3.
// Trophy Wall is the 8.1-B.2 primary lean. Floating Canvas is the user-added
// 7th concept (no surface · items float · drag-to-place affordance). Other 5
// concepts (Pegboard, Display Shelf, Side-Profile Workbench, Tool Reel,
// Climbing Wall) render a "coming soon" placeholder until they are built.

export type F3BConcept =
  | 'trophy-wall'
  | 'floating-canvas'
  | 'pegboard'
  | 'display-shelf'
  | 'side-profile-workbench'
  | 'tool-reel'
  | 'climbing-wall';

export type F3BConceptMeta = {
  id: F3BConcept;
  label: string;
  detail: string;
  built: boolean;
};

export const F3B_CONCEPTS: F3BConceptMeta[] = [
  {
    id: 'trophy-wall',
    label: 'Trophy Wall',
    detail: 'Pinned artifacts (sketches · letters · medals · postcards) scattered on a wall surface. 8.1-B.2 primary lean.',
    built: true,
  },
  {
    id: 'floating-canvas',
    label: 'Floating Canvas',
    detail: 'No surface — items float freely in column space. User-added option 2026-05-29; drag-to-place affordance future.',
    built: true,
  },
  {
    id: 'pegboard',
    label: 'Pegboard',
    detail: 'Tools mounted on a vertical workshop wall. Strong runner-up per §C3. Path 2 SVG only.',
    built: true,
  },
  {
    id: 'display-shelf',
    label: 'Display Shelf',
    detail: 'Vertically-stacked shelves with objects on each. Curio-cabinet register.',
    built: false,
  },
  {
    id: 'side-profile-workbench',
    label: 'Workbench (side)',
    detail: 'Desk rotated 90° in scene-space — viewer sees the side profile.',
    built: false,
  },
  {
    id: 'tool-reel',
    label: 'Tool Reel',
    detail: 'Vertical rotating reel of tool/software logos. Scroll-driven.',
    built: false,
  },
  {
    id: 'climbing-wall',
    label: 'Climbing Wall',
    detail: 'Project history as climbing-wall holds. ⚠️ K1 violation risk.',
    built: false,
  },
];

type Ctx = {
  state: F3BConcept;
  setState: (v: F3BConcept) => void;
};

const F3BConceptCtx = createContext<Ctx | null>(null);

export function F3BConceptProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<F3BConcept>('trophy-wall');
  return <F3BConceptCtx.Provider value={{ state, setState }}>{children}</F3BConceptCtx.Provider>;
}

export function useF3BConcept(): Ctx {
  const v = useContext(F3BConceptCtx);
  if (!v) throw new Error('useF3BConcept must be used inside F3BConceptProvider');
  return v;
}
