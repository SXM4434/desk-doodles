import { createContext, useContext, useState, type ReactNode } from 'react';

// F3-B column width override. User direction 2026-05-31: "we should let it
// sit just whatever the page margin away from the right" — i.e., allow the
// column to flex beyond the locked Family B 5fr ratio when the title needs
// more horizontal room (e.g., Display register CD 52 doesn't fit at 5fr).
//
// 'fr-5' (default) — locked Family B grid: minmax(288px, 5fr) / minmax(512px, 9fr)
// 'content'         — column = content-natural-width; work column claims the rest
// '380' / '460' / '560' — fixed px overrides
//
// Note: choosing anything other than 'fr-5' violates the locked Family B
// grid spec for the F3-B route only. Acceptable as a lab exploration
// affordance; should not propagate to other Family B routes.

export type F3BColumnWidth = 'fr-5' | 'content' | '380' | '460' | '560';

export type F3BColumnWidthMeta = {
  id: F3BColumnWidth;
  label: string;
  detail: string;
};

export const F3B_COLUMN_WIDTHS: F3BColumnWidthMeta[] = [
  {
    id: 'fr-5',
    label: '5fr · locked default',
    detail: 'Family B locked grid: minmax(288px, 5fr) / minmax(512px, 9fr). Column ~290–440px depending on viewport.',
  },
  {
    id: 'content',
    label: 'Content-sized',
    detail: 'Column = max-content. Grows to fit title naturally; work column claims the rest. NOT the locked Family B grid.',
  },
  {
    id: '380',
    label: '380px fixed',
    detail: 'Override at 380px. Comfortable for Section Heading register; tight for Display.',
  },
  {
    id: '460',
    label: '460px fixed',
    detail: 'Override at 460px. Accommodates Intro Heading (ISe 32) without wrapping.',
  },
  {
    id: '560',
    label: '560px fixed',
    detail: 'Override at 560px. Display register (CD 52) fits in 2 lines for most title copies.',
  },
];

type Ctx = {
  state: F3BColumnWidth;
  setState: (v: F3BColumnWidth) => void;
};

const F3BColumnWidthCtx = createContext<Ctx | null>(null);

export function F3BColumnWidthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<F3BColumnWidth>('fr-5');
  return <F3BColumnWidthCtx.Provider value={{ state, setState }}>{children}</F3BColumnWidthCtx.Provider>;
}

export function useF3BColumnWidth(): Ctx {
  const v = useContext(F3BColumnWidthCtx);
  if (!v) throw new Error('useF3BColumnWidth must be used inside F3BColumnWidthProvider');
  return v;
}
