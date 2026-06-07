import React, { createContext, useContext, useState } from 'react';

// §03 Sub-section + slot spacing toggle — controls vertical breathing room between
// sub-sections in native-fixed §03 (insight rows, persona callout area, pattern close).
//
// User request: insights read muddy in native-fixed; want 4 spacing options anchored
// around the §10 Reflection sub-section spacing as reference.
//
// 4 states:
//   'native'      — current native-fixed (16px row-padding · 32px effective gap)
//   'reflection'  — matches §10 Reflection sub-section spacing (24px row-padding · 48px gap)
//   'wide'        — half of section→section transition (32px row-padding · 64px gap)
//   'extra-wide'  — double Reflection (48px row-padding · 96px gap)
//
// ROW_PADDING value is applied per side for paired-padding contexts (insight rows that have
// both paddingTop and paddingBottom, so the effective between-row gap = 2 × row-padding when
// rows are stacked with hairline rules).
// GAP value is applied for single-direction margin/padding contexts (persona callout
// marginBottom, pattern close marginTop, etc).

// All values on locked spacing ladder (4/8/12/16/24/32/48/64/128). No off-ladder exceptions.
export type GateAIonS03SubSectionGap = 'native' | 'reflection' | 'wide';

export const SUB_SECTION_ROW_PADDING: Record<GateAIonS03SubSectionGap, number> = {
  'native': 16,     // 16 = Component (locked)
  'reflection': 24, // 24 = Block (locked) — matches §10 Reflection
  'wide': 32,       // 32 = locked — gives 64px effective gap (= half section transition 128)
};

export const SUB_SECTION_GAP: Record<GateAIonS03SubSectionGap, number> = {
  'native': 32,     // 32 locked
  'reflection': 48, // 48 = Section (locked) — matches §10 Reflection rhythm
  'wide': 64,       // 64 locked — half of section→section transition (128)
};

type Ctx = { state: GateAIonS03SubSectionGap; setState: (s: GateAIonS03SubSectionGap) => void };
const Cx = createContext<Ctx | null>(null);

export function GateAIonS03SubSectionGapProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GateAIonS03SubSectionGap>('wide');
  return <Cx.Provider value={{ state, setState }}>{children}</Cx.Provider>;
}

export function useGateAIonS03SubSectionGap(): Ctx {
  const v = useContext(Cx);
  if (!v) throw new Error('useGateAIonS03SubSectionGap must be inside GateAIonS03SubSectionGapProvider');
  return v;
}
