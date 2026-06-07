import React, { createContext, useContext, useState } from 'react';

// §03 Persona Content Density toggle — controls how the NATIVE persona callout renders
// in §03 directions when no artifact is active (personaArtifact === 'none'). Artifacts
// themselves are NOT affected by this toggle — they communicate the same persona message
// visually and stay on their own register.
//
// Four states, progressive merging — each reduces the typographic treatment count:
//
// 'original' (default) — direction-native callout per the shipped per-direction register.
//
// 'A-4treat' — 4 distinct typographic treatments, cohesive line-by-line:
//   1) CAPS eyebrow with value statement              (treatment 1: CAPS 10)
//   2) ISe persona name                                (treatment 2: ISe 22)
//   3) BODY verbatim quote                             (treatment 3: BODY 15)
//   4) CAPTION affinity-cluster attribution            (treatment 4: CAPTION 11)
//
// 'B-3treat' — 3 distinct typographic treatments, name+value compound at single ISe register:
//   1) ISe persona name + value compound               (treatment 1: ISe 22, single register, no inline size jump)
//   2) BODY verbatim quote                             (treatment 2: BODY 15)
//   3) CAPTION affinity-cluster attribution            (treatment 3: CAPTION 11)
//
// 'C-2treat' — 2 distinct typographic treatments, maximally merged:
//   1) ISe persona name + value compound               (treatment 1: ISe 22)
//   2) DENSE verbatim quote + affinity-cluster attribution compound (treatment 2: DENSE 13, single register, no inline size jump)
//
// "Cohesive merge" means: when content is merged onto one line, the line stays at ONE
// typographic register — no inline size jumps, no mid-line caption-size shifts. Merging is
// horizontal at the content level (commas, dashes), not vertical at the typographic level.

export type GateAIonS03PersonaContentDensity = 'original' | 'A-4treat' | 'B-3treat' | 'C-2treat';

type Ctx = { state: GateAIonS03PersonaContentDensity; setState: (s: GateAIonS03PersonaContentDensity) => void };
const Cx = createContext<Ctx | null>(null);

export function GateAIonS03PersonaContentDensityProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GateAIonS03PersonaContentDensity>('C-2treat');
  return <Cx.Provider value={{ state, setState }}>{children}</Cx.Provider>;
}

export function useGateAIonS03PersonaContentDensity(): Ctx {
  const v = useContext(Cx);
  if (!v) throw new Error('useGateAIonS03PersonaContentDensity must be inside GateAIonS03PersonaContentDensityProvider');
  return v;
}
