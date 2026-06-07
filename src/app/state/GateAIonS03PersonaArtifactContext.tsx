import React, { createContext, useContext, useState } from 'react';
import type { GateAIonS03Direction } from './GateAIonS03DirectionContext';

// §03 Persona Artifact toggle — REPLACES the inline persona callout when active.
// Default `none` → inline persona callout renders in the direction's register.
// Any artifact → artifact REPLACES the callout entirely (they never both render).
//
// 12 artifact options per `docs/labs/applied-surfaces-v2/ion/gate-a-ion-s03-phase-a-research.md`
// Track 2 (2026-05-05 · revised 2026-05-16). Each does the callout's content job
// (persona names + value statements + quotes) in a heavier or structurally distinct register.
//
// Family 1 revision 2026-05-16: 1.A + 1.B cut (concept-broken — required per-persona n
// that doesn't exist in source). Replaced with 1.D Pew typology table + 1.E quote chorus.
//
// W1 palette only, IS/ISe/CD type lock, no ISe italic, no orange.

export type GateAIonS03PersonaArtifact =
  | 'none'
  // Family 1 · Data journalism
  | '1.C' // Persona-divided journey strip (Pew small-multiples 2×5)
  | '1.D' // Pew typology comparison table (★ native + 1A)
  | '1.E' // Themed-coded verbatim quote chorus (★ 1C)
  // Family 2 · Editorial print
  | '2.A' // Hero pull-quote diptych (★ 2A)
  | '2.B' // Annotated typographic portrait pair (★ 2B + 2C)
  | '2.C' // Two-block named-subject spread
  // Family 3 · Out-of-the-box
  | '3.A' // Twin tombstone label pair (★ 3C)
  | '3.B' // Structured-abstract participants block (★ 3B)
  | '3.C' // Letter-prose named-cohort passage (★ 3A)
  // Family 4 · Design portfolio
  | '4.A' // Hairline-bordered persona card pair (★ 4A)
  | '4.B' // Senior-narrated rule-bounded paragraph (★ 4B)
  | '4.C' // Numbered case-study row pair (★ 4C)
  // Playground extras + 2026-05-18 graph-research-driven options
  | 'EXT.E1'    // Overlap spider — single chart, both personas as overlapping polygons on 3 bidirectional axes
  | 'EXT.E1.S'  // Slope graph (Tufte) — two persona columns, 3 trait lines crossing
  | 'EXT.E1.B'  // Butterfly chart — central spine, persona bars extending left/right per trait row
  | 'EXT.E1.P'  // Profile chart (clinical psych variant) — 3 horizontal trait axes, persona ribbons threading through
  | 'EXT.E1.C'  // Diverging radial coxcomb — per-persona disc, wedges in lean hemisphere (Nightingale lineage)
  | 'EXT.E1.R'  // Polar bar per persona — 3 radial bars per disc, length = lean strength
  | 'EXT.E1.H'  // Hofstede vertical bar — 3 columns per panel, height = position (Hofstede country comparison precedent)
  | 'EXT.E1.M'  // Pew/Spotify small multiples — 3 stacked bipolar spectrum rows per panel, dot at persona position
  | 'EXT.E1.A'  // Asymmetric lean cluster (OG-faithful with chip rail + quote below) — preserved for comparison
  | 'EXT.E1.V1'  // Full OG cluster (6 endpoints · themes replace trait labels at lean · lines only to lean) — 2026-05-18 (i)+(α) fixes
  | 'EXT.E1.V2'  // Improved overlap spider (themes at lean positions, both personas as overlapping triangles) — 2026-05-18 (i)+(α) fixes
  | 'EXT.E1.V3'  // Lean-only cluster (only 3 lean endpoints per chart · themes at positions · no non-lean labels) — 2026-05-18 cleaned
  | 'EXT.E1.OSG' // Semantic Differential (Osgood 1957) — verbal anchors at row ends + both persona markers on continuum
  | 'EXT.E1.BUL' // Bullet Graph small multiples (Few) — 3 stacked rows with shaded range background + persona markers
  | 'EXT.E1.CRD' // Sports-Card pair (FIFA/Pokemon Ultimate Team) — two persona cards side-by-side with stat grid
  | 'EXT.E1.TOR' // Tornado Diagram — central spine, bars ordered by magnitude (largest divergence first)
  // Convergent / synthesis (Ion serves both) — 2026-05-18 build
  | 'EXT.E1.SC'  // Shared-center spider — both personas as opposing polygons + central Ion mark
  | 'EXT.E1.BR'  // Bridge chart — WF | Ion bridge | CCS, opposed postures with Ion as connector
  | 'EXT.E1.VP'  // Venn-of-postures — AI-as-deputy ∩ AI-as-consultant, overlap = Ion's coverage
  // Spectrum-plotted themes (political-compass paradigm) — 2026-05-19 build
  | 'EXT.E1.RS'  // Radial spectrum — single chart, 3 bipolar axes through center, theme pills plotted on axes at lean positions, pole labels at perimeter
  | 'EXT.E1.HR'; // Horizontal spectrum rows — 3 stacked rows with pole labels at ends, theme pills plotted on each row at lean positions

type Ctx = { state: GateAIonS03PersonaArtifact; setState: (s: GateAIonS03PersonaArtifact) => void };
const Cx = createContext<Ctx | null>(null);

export function GateAIonS03PersonaArtifactProvider({ children }: { children: React.ReactNode }) {
  // SOFT-LOCKED 2026-05-20: default value flipped from 'none' to 'EXT.E1.V1' (Full OG cluster · themes replace trait labels at lean · pill-themes / plain-text-poles V1-craft-close from 2026-05-20). Inline persona callout (the 'none' default) is still available via toggle — soft = revisitable, default render shows the locked artifact combo.
  const [state, setState] = useState<GateAIonS03PersonaArtifact>('EXT.E1.V1');
  return <Cx.Provider value={{ state, setState }}>{children}</Cx.Provider>;
}

export function useGateAIonS03PersonaArtifact(): Ctx {
  const v = useContext(Cx);
  if (!v) throw new Error('useGateAIonS03PersonaArtifact must be inside GateAIonS03PersonaArtifactProvider');
  return v;
}

// ★ recommended persona artifact per direction (Phase A Track 2 lines 491-505, revised 2026-05-16).
// Returns null if no recommendation (native-original baseline = A/B comparison, no rec).
// When a direction is active, the persona artifact toggle dropdown should annotate the matching
// option with `★ recommended for <direction-name>`. Default state stays `none` regardless —
// marker is informational, not auto-selected.
export function recommendedPersonaArtifactForDirection(d: GateAIonS03Direction): GateAIonS03PersonaArtifact | null {
  switch (d) {
    case 'native-fixed':         return '1.D'; // shared with 1A — formal-typology pairing
    case 'native-original':      return null;  // A/B baseline, no rec
    case '1A-pew-multiples':     return '1.D'; // shared with native — Pew register match
    case '1B-pudding-qual':      return '1.C';
    case '1C-reuters-longform':  return '1.E';
    case '2A-magazine-pull-stat':return '2.A';
    case '2B-tufte-sparkline':   return '2.B'; // shared with 2C — annotation lineage
    case '3A-annual-letter':     return '3.C';
    case '3B-scientific-abstract':return '3.B';
    case '3C-museum-wall':       return '3.A';
    case '4A-billguo-framed':    return '4.A';
    case '4B-senior-narrated':   return '4.B';
    case '4C-studio-brief':      return '4.C';
    default: return null;
  }
}
