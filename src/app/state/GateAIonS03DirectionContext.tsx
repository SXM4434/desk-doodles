import React, { createContext, useContext, useState } from 'react';

// Controls the visual layout direction for §03 Discovery → Requirements.
// Each option is a complete render variation researched against a real precedent.
// User toggles between them visually to pick the §03 direction for Ion case study.
//
// The 4 directions (each with 3 options) explore how to render the densest CSML module
// (4 layers + 6 optional evidence modules for Ion Heavy weight) without the
// muddy-paragraph-blur the current 'native' implementation exhibits.
//
// Adheres to W1 palette (no orange — ink-pop only), type lock (IS/ISe/CD), no ISe italic.
// Avoids AI/SaaS cliches: no bento grids, generic stat cards, gradient highlights, sparkle icons.
//
// Research synthesis: docs/labs/applied-surfaces-v2/ion/gate-a-ion-s03-direction-research.md (TBD)
//
// 'native-fixed'            = density-disciplined clean baseline — neutral default, no register-family commitment, real scale variance, addresses the 5 paragraph-blur issues. Default toggle state.
// 'native-original'         = original paragraph-blur baseline — kept for A/B comparison ("what bad looked like"). Same content, no scale variance, all 11–13px.
//
// — Direction 1: Data Journalism —
// '1A-pew-multiples'        = Pew Research small-multiples logic — sparkline per insight, common scale, finding-led row titles
// '1B-pudding-qual'         = Pudding qual-lead — qual narrative dominant, stats demoted to inline sentence-embedded numbers
// '1C-reuters-longform'     = Reuters Institute DNR-style — big stat numerals, tinted insight blocks, methods compressed to top metadata
//
// — Direction 2: Editorial Print Precedent —
// '2A-magazine-pull-stat'   = magazine feature spread — one hero stat at editorial-headline scale (~80-120px CD/ISe)
// '2B-tufte-sparkline'      = Tufte data-text integration — numbers inline with prose, no separate stats row
// (2C-holmes-spectrum CUT 2026-05-15 per direction plan §54 + flag #70: spectrum concept forbidden — two distinct user shapes are not opposites on a continuum. Family 2 now reduced to 2A + 2B.)
//
// — Direction 3: Out-of-the-box —
// '3A-annual-letter'        = Berkshire/Apple letter register — pure prose, stats inline, low chrome, maximum compression
// '3B-scientific-abstract'  = Nature/IEEE structured abstract — Methods/Findings/Insight→Req/Pattern micro-blocks
// '3C-museum-wall'          = MoMA/Tate exhibition wall text — title + 2-3 sentences + tombstone metadata, curator register
//
// — Direction 4: Design Portfolio —
// '4A-billguo-framed'       = Bill Guo–style — bordered insight cards, disciplined frame chrome
// '4B-senior-narrated'      = senior-portfolio milestone register — numbered insights as vertical track with body+req
// '4C-studio-brief'         = Pentagram/MetaLab brief — 3-up grid of mini-blocks with rule lines, deck-like
export type GateAIonS03Direction =
  | 'native-fixed'
  | 'native-original'
  | '1A-pew-multiples'
  | '1B-pudding-qual'
  | '1C-reuters-longform'
  | '2A-magazine-pull-stat'
  | '2B-tufte-sparkline'
  | '3A-annual-letter'
  | '3B-scientific-abstract'
  | '3C-museum-wall'
  | '4A-billguo-framed'
  | '4B-senior-narrated'
  | '4C-studio-brief';

type Ctx = { state: GateAIonS03Direction; setState: (s: GateAIonS03Direction) => void };
const Cx = createContext<Ctx | null>(null);

export function GateAIonS03DirectionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GateAIonS03Direction>('native-fixed');
  return <Cx.Provider value={{ state, setState }}>{children}</Cx.Provider>;
}

export function useGateAIonS03Direction(): Ctx {
  const v = useContext(Cx);
  if (!v) throw new Error('useGateAIonS03Direction must be inside GateAIonS03DirectionProvider');
  return v;
}
