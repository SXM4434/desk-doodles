import React, { createContext, useContext, useState } from 'react';

// Controls the maxWidth of the reading column inside <main> (or inner container when dual active).
// Research grounded: Bringhurst 45–75ch optimal; empirical web platform standards.
export type GateAIonTextColumnWidthToken =
  | 'native'   // no maxWidth — content fills available width (current behavior)
  | 'journal'  // 340px — Nature single-col (89mm); IEEE (88.9mm); dense scientific text
  | 'xs'       // 480px — Bringhurst minimum; Ruder lower bound; Japanese hanmen lower end
  | 'sm'       // 560px — Ruder/Bringhurst mid; Japanese hanmen upper; JLREQ kihon-hanmen
  | 'md'       // 640px — Bringhurst optimal ~66ch; Wikipedia body; web typography consensus
  | 'lg'       // 680px — Medium (~700px); Stripe (660px); Substack; Tufte CSS (650px)
  | 'xl'       // 720px — Bringhurst upper ~75ch; literary supplement; long-form editorial
  | '2xl'      // 760px — upper Bringhurst bound ~80ch; The New Yorker digital range
  | '3xl'      // 840px — wide academic/magazine single-column; Nature at wider viewports
  | 'wide'     // 920px — between 3xl and full; emmiwu.com-class content area with right breathing room
  | 'full';    // no maxWidth — explicit full-width intent (same as native structurally)

export const TEXT_COLUMN_WIDTH_VALUES: Record<GateAIonTextColumnWidthToken, number | undefined> = {
  native:  undefined,
  journal: 340,
  xs:      480,
  sm:      560,
  md:      640,
  lg:      680,
  xl:      720,
  '2xl':   760,
  '3xl':   840,
  wide:    920,
  full:    undefined,
};

type Ctx = {
  state: GateAIonTextColumnWidthToken;
  setState: (s: GateAIonTextColumnWidthToken) => void;
};

const Cx = createContext<Ctx | null>(null);

export function GateAIonTextColumnWidthProvider({ children }: { children: React.ReactNode }) {
  // Lock default 2026-05-24: '3xl' is the production-pick text column width for Gate A Ion shell.
  const [state, setState] = useState<GateAIonTextColumnWidthToken>('3xl');
  return <Cx.Provider value={{ state, setState }}>{children}</Cx.Provider>;
}

export function useGateAIonTextColumnWidth(): Ctx {
  const v = useContext(Cx);
  if (!v) throw new Error('useGateAIonTextColumnWidth must be used inside GateAIonTextColumnWidthProvider');
  return v;
}
