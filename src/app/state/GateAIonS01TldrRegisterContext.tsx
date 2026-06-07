import React, { createContext, useContext, useState } from 'react';

// Controls the typographic register of the §01 Overview TLDR block.
// Researched against editorial / typographic / museum-label / academic-abstract precedents — see
// docs/labs/applied-surfaces-v2/ion/gate-a-ion-s01-tldr-contrib-research.md
//
// 'native'              = current shadcn-style callout (left border + tinted bg) — fallback
// 'tldr-standfirst'     = ★ Rec · large lede paragraph, no border, magazine standfirst register
// 'tldr-dek'            = ★ Rec · hed/dek pairing — small CAPS hed + sentence-case dek paragraph
// 'tldr-eyebrow-stack'  = uppercase tracked eyebrow + statement paragraph stacked
// 'tldr-dropcap-lede'   = drop cap on first paragraph, no other chrome
// 'tldr-epigraph'       = italic intro, em-dash attribution line
// 'tldr-pullquote-scale'= oversized display-scale paragraph, no quote marks
// 'tldr-tombstone'      = ★ Rec · museum tombstone register — title / role / dates / medium stack
// 'tldr-abstract-column'= narrow text column with "Abstract" sidehead, academic register
export type GateAIonS01TldrRegister =
  | 'native'
  | 'tldr-standfirst'
  | 'tldr-dek'
  | 'tldr-eyebrow-stack'
  | 'tldr-dropcap-lede'
  | 'tldr-epigraph'
  | 'tldr-pullquote-scale'
  | 'tldr-tombstone'
  | 'tldr-abstract-column';

type Ctx = { state: GateAIonS01TldrRegister; setState: (s: GateAIonS01TldrRegister) => void };
const Cx = createContext<Ctx | null>(null);

export function GateAIonS01TldrRegisterProvider({ children }: { children: React.ReactNode }) {
  // Default 2026-05-02: tldr-dek (drops literal "TL;DR" label; sub-headline register matches verified senior-IC reference set per s01 research §3 + Step A symmetry)
  const [state, setState] = useState<GateAIonS01TldrRegister>('tldr-dek');
  return <Cx.Provider value={{ state, setState }}>{children}</Cx.Provider>;
}

export function useGateAIonS01TldrRegister(): Ctx {
  const v = useContext(Cx);
  if (!v) throw new Error('useGateAIonS01TldrRegister must be inside GateAIonS01TldrRegisterProvider');
  return v;
}
