import React, { createContext, useContext, useState } from 'react';

// Hero / entry zone density-mode toggle. A/B controls the spacing rhythm of
// the case study entry beat (pre-toc Hook + Thesis + hero image) ONLY.
// Body sections (§01 → §10) are locked at Standard mode per Cycle 6 — flag #5
// "ONE density mode across the whole case study (body)" + locked spec
// "Airy doesn't earn itself on body sections".
//
// Per locked spacing-layout-rhythm.md §C density-mode table:
//   - Airy:     Hero = 80 / Section = 64 / Block = 32 / Component = 16
//   - Standard: Hero = 64 / Section = 48 / Block = 24 / Component = 16
//   - Micro = 8 / Tight = 12 are stable anchors across modes
//
// Default: 'standard' (locked 2026-05-09 after visual A/B). Airy was the
// hypothesis — locked spec sanctions Airy for "page entry / hero-transition /
// opening beat" surfaces — but visual A/B showed Airy's wider rhythm didn't
// produce a meaningful read-difference for this case study's hero. Standard
// wins: matches body density throughout, removes the hero→body structural
// seam, simpler. Toggle infrastructure kept for future revisit if hero
// content/layout changes meaningfully.
export type GateAIonHeroDensityMode = 'airy' | 'standard';

export type HeroDensityValues = {
  hero: number;      // hero internal padding / entry breathing
  section: number;   // section gap inside hero zone
  block: number;     // block rhythm within hero copy
  component: number; // internal component padding
};

export const HERO_DENSITY_MODE_VALUES: Record<GateAIonHeroDensityMode, HeroDensityValues> = {
  airy:     { hero: 80, section: 64, block: 32, component: 16 },
  standard: { hero: 64, section: 48, block: 24, component: 16 },
};

type Ctx = { state: GateAIonHeroDensityMode; setState: (s: GateAIonHeroDensityMode) => void };
const Cx = createContext<Ctx | null>(null);

export function GateAIonHeroDensityModeProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GateAIonHeroDensityMode>('standard');
  return <Cx.Provider value={{ state, setState }}>{children}</Cx.Provider>;
}

export function useGateAIonHeroDensityMode(): Ctx {
  const v = useContext(Cx);
  if (!v) throw new Error('useGateAIonHeroDensityMode must be inside GateAIonHeroDensityModeProvider');
  return v;
}
