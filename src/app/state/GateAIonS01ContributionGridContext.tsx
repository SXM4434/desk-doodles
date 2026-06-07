import React, { createContext, useContext, useState } from 'react';

// Controls the visual format of the contribution grid in §01 Overview.
// Researched against editorial / academic-author-credit / museum / archival / playbill precedents — see
// docs/labs/applied-surfaces-v2/ion/gate-a-ion-s01-tldr-contrib-research.md
//
// 'native'                = 3-column CSS grid with CAPS heading + bullet list per column (defense fallback / 4f)
// 'two-col'               = 2-column grid — Owned+Enabled merged left, Led Alignment right
// 'stacked'               = single column, each group as a labeled row with border separator
// 'inline'                = flat prose: each group as "LABEL: item · item · item" on its own line
// 'hidden'                = contribution grid suppressed entirely (precedent: emmiwu.com / billguo.me both omit)
// 'role-line'             = 4a · inline rows — each CONTRIB_COLS group as CAPS label + interpunct-joined items on one line
// 'role-team'             = 4b · stacked sidehead — CAPS label above, items as comma-prose below, each group as a row
// 'film-credit'           = 4c · film-credit register — right-aligned CAPS label / left items column as comma-prose
// 'wall-label'            = 4d · museum wall-label register — sentence-case label inline at start, items as semicolon-prose
// 'sidehead-chips'        = 4e · sidehead + chip cluster — CAPS label LEFT, CONTRIB_COLS items rendered as chips RIGHT per group
// 'contrib-credit-prose'  = (deprecated 2026-05-01 — collapses 3 categorical lists into single-author attribution; flagged by research §7)
// 'contrib-byline'        = (deprecated 2026-05-01 — same collapse; person-attribution register)
// 'contrib-credits-card'  = (deprecated 2026-05-01 — same collapse; person-attribution register)
// 'contrib-museum-positional' = (deprecated 2026-05-01 — same collapse; positional-credit register)
// 'contrib-credit-statement' = (deprecated 2026-05-01 — same collapse; paragraph-attribution)
// 'contrib-finding-aid'   = (deprecated 2026-05-01 — single-author archival register)
// 'contrib-program-billing' = (deprecated 2026-05-01 — playbill register collapses lists into ranked names)
// 'contrib-degree-modifier' = (deprecated 2026-05-01 — degree-axis collapses lists into role labels)
// 'prose-team-field'      = (deprecated placeholder · failed scannability review 2026-05-01)
// 'inline-credit-line'    = (deprecated placeholder · removed invented credits 2026-05-01)
// 'contrib-def-list'      = (alternate · 2026-05-02 reversal) · semantic <dl><dt><dd> register kept callable for evaluation only · NOT default · failed visual review: bold sentence-case 14/500 label is system-orphan (no other surface uses this register), indented rows read as Notion-property-list, vertical stack burns 2-3× height. Step A symmetry reversal: the SaaS-tripartite cliche signature is at the chrome layer (rounded cards, tinted fills, sparkle icons, grey-on-grey Tailwind labels) NOT the pattern layer. 3-col CAPS labeled grid in pure system register (IS 10/500/0.12em UC + IS 13/300 dense + W1) is editorial-credit-table convention predating v0 by ~200yr; native is the answer.
export type GateAIonS01ContributionGrid =
  | 'native'
  | 'two-col'
  | 'stacked'
  | 'inline'
  | 'hidden'
  | 'role-line'
  | 'role-team'
  | 'film-credit'
  | 'wall-label'
  | 'sidehead-chips'
  | 'contrib-credit-prose'
  | 'contrib-byline'
  | 'contrib-credits-card'
  | 'contrib-museum-positional'
  | 'contrib-credit-statement'
  | 'contrib-finding-aid'
  | 'contrib-program-billing'
  | 'contrib-degree-modifier'
  | 'prose-team-field'
  | 'inline-credit-line'
  | 'contrib-def-list';

type Ctx = { state: GateAIonS01ContributionGrid; setState: (s: GateAIonS01ContributionGrid) => void };
const Cx = createContext<Ctx | null>(null);

export function GateAIonS01ContributionGridProvider({ children }: { children: React.ReactNode }) {
  // Default 2026-05-02 (reverted from contrib-def-list): 'native' 3-col CAPS labeled grid is the right answer. Step A symmetry reversal — the SaaS-tripartite cliche signature is at the chrome layer (cards/tints/icons/grey-on-grey), NOT the pattern layer. 3-col labeled-categorical-list in pure IS/ISe + W1 system register is editorial-credit-table convention predating v0 by ~200yr.
  const [state, setState] = useState<GateAIonS01ContributionGrid>('native');
  return <Cx.Provider value={{ state, setState }}>{children}</Cx.Provider>;
}

export function useGateAIonS01ContributionGrid(): Ctx {
  const v = useContext(Cx);
  if (!v) throw new Error('useGateAIonS01ContributionGrid must be inside GateAIonS01ContributionGridProvider');
  return v;
}
