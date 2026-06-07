import { createContext, useContext, useState, type ReactNode } from 'react';

// F3 family identity title copy — shared selection state between F3-A and
// F3-B but cell-specific text per id (F3-A's "Turning chaos…" per §8.1-A.2
// vs F3-B's "Product designer…" per §8.1-B.2). User picks "Alt 1" once and
// each cell renders its own Alt 1 text.

export type F3TitleCopy = 'current' | 'alt-1' | 'alt-2';

export type F3TitleCopyMeta = {
  id: F3TitleCopy;
  label: string;
};

export const F3_TITLE_LABELS: F3TitleCopyMeta[] = [
  { id: 'current', label: 'Current' },
  { id: 'alt-1', label: 'Alt 1' },
  { id: 'alt-2', label: 'Alt 2' },
];

// F3-A hero band title — per §8.1-A.2 default + alts from candidate list.
export const F3_A_TITLE_TEXTS: Record<F3TitleCopy, string> = {
  'current': 'Turning chaos into intentional design.',
  'alt-1': 'I help teams turn messy product ideas into clean workflows.',
  'alt-2': 'Clear interfaces for complex workflows.',
};

// F3-B identity caption title — per §8.1-B.2 default + alts from candidate list.
export const F3_B_TITLE_TEXTS: Record<F3TitleCopy, string> = {
  'current': 'Product designer working at the seam between tools and teams.',
  'alt-1': 'Designing where teams meet tools.',
  'alt-2': 'Systems, prototypes, shipped outcomes.',
};

// Dropdown rendering — show label + cell-specific text snippets so the user
// can see what each option becomes per cell.
export const F3_TITLE_COPIES = F3_TITLE_LABELS.map((m) => ({
  id: m.id,
  label: m.label,
  text: `F3-A: ${F3_A_TITLE_TEXTS[m.id]} · F3-B: ${F3_B_TITLE_TEXTS[m.id]}`,
}));

type Ctx = {
  state: F3TitleCopy;
  setState: (v: F3TitleCopy) => void;
};

const F3TitleCopyCtx = createContext<Ctx | null>(null);

export function F3TitleCopyProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<F3TitleCopy>('current');
  return <F3TitleCopyCtx.Provider value={{ state, setState }}>{children}</F3TitleCopyCtx.Provider>;
}

export function useF3TitleCopy(): Ctx {
  const v = useContext(F3TitleCopyCtx);
  if (!v) throw new Error('useF3TitleCopy must be used inside F3TitleCopyProvider');
  return v;
}

export function getF3ATitleText(id: F3TitleCopy): string {
  return F3_A_TITLE_TEXTS[id] ?? F3_A_TITLE_TEXTS.current;
}
export function getF3BTitleText(id: F3TitleCopy): string {
  return F3_B_TITLE_TEXTS[id] ?? F3_B_TITLE_TEXTS.current;
}
// Back-compat — defaults to F3-B text.
export function getF3TitleText(id: F3TitleCopy): string {
  return getF3BTitleText(id);
}
