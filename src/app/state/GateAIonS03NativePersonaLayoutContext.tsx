import React, { createContext, useContext, useState } from 'react';

// §03 Native persona callout layout — controls whether the merged-density personas
// (NativePersonaCalloutBlock A/B/C states) render stacked or side-by-side.
//
// 'stacked' (default) — each cohort vertically stacked at full text-column width.
//   At C density: clean 2-line max-merged per cohort.
// 'side-by-side' — both cohorts at 1fr 1fr (half-column each).
//   Tradeoff at C density: prose wraps to multi-line at half width, partially defeating
//   the "max-merged 2-line" intent. Acceptable A/B exploration.

export type GateAIonS03NativePersonaLayout = 'stacked' | 'side-by-side';

type Ctx = { state: GateAIonS03NativePersonaLayout; setState: (s: GateAIonS03NativePersonaLayout) => void };
const Cx = createContext<Ctx | null>(null);

export function GateAIonS03NativePersonaLayoutProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GateAIonS03NativePersonaLayout>('stacked');
  return <Cx.Provider value={{ state, setState }}>{children}</Cx.Provider>;
}

export function useGateAIonS03NativePersonaLayout(): Ctx {
  const v = useContext(Cx);
  if (!v) throw new Error('useGateAIonS03NativePersonaLayout must be inside GateAIonS03NativePersonaLayoutProvider');
  return v;
}
