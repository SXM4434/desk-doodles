import { createContext, useContext, useState, type ReactNode } from 'react';

// F3-B Pegboard hanging-mechanism toggle.
//
// User direction 2026-05-31 + hand-drawn sketch reference: each tool's
// attachment to the wall is its own toggle dimension, orthogonal to the
// subject form pick. The string variants sag naturally → more hand-drawn
// feel than the current rigid peg dot.
//
//   peg            — small filled dot above item (current default)
//   string-triangle — single top anchor; string descends to each item corner
//                     forming a triangle. Like balloon-on-a-string.
//   string-arc      — string attached at two points on item top, meets at
//                     a single peg/hook above. Inverted-U / arch.
//   pin             — small pin/tack pierces the item near the top; item
//                     dangles below the pin head (no anchor above).

export type F3PegboardHang = 'peg' | 'string-triangle' | 'string-arc' | 'pin';

export type F3PegboardHangMeta = {
  id: F3PegboardHang;
  label: string;
  detail: string;
};

export const F3_PEGBOARD_HANGS: F3PegboardHangMeta[] = [
  { id: 'peg',             label: 'Peg dot',        detail: 'Small filled dot above the item. Default — flush mounted.' },
  { id: 'string-triangle', label: 'String triangle', detail: 'Single anchor + string descends to item corners forming a triangle.' },
  { id: 'string-arc',      label: 'String arc',      detail: 'String attached at two points on item; meets at a hook above. Inverted-U.' },
  { id: 'pin',             label: 'Pin through',     detail: 'Small pin pierces the item near the top. Item dangles below.' },
];

// Vertical clearance reserved above each item's top edge for the hang
// mechanism to render in. Strings get more room so the sag reads.
export const F3_HANG_CLEARANCE: Record<F3PegboardHang, number> = {
  peg: 8,
  'string-triangle': 28,
  'string-arc': 22,
  pin: 12,
};

type Ctx = {
  state: F3PegboardHang;
  setState: (v: F3PegboardHang) => void;
};

const F3PegboardHangCtx = createContext<Ctx | null>(null);

export function F3PegboardHangProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<F3PegboardHang>('peg');
  return <F3PegboardHangCtx.Provider value={{ state, setState }}>{children}</F3PegboardHangCtx.Provider>;
}

export function useF3PegboardHang(): Ctx {
  const v = useContext(F3PegboardHangCtx);
  if (!v) throw new Error('useF3PegboardHang must be used inside F3PegboardHangProvider');
  return v;
}
