import React, { createContext, useContext, useState } from 'react';

// Controls which Mode renders for §09 Outcomes / Scoreboards in Gate A Ion Shell.
//
// Per CSML `09-outcomes-and-scoreboards.md` lines 19–28:
//   Mode A — Outcome Spine / Clean Signal Pairs (default reusable system mode)
//   Mode B — Narrative Ledger / State-Grouped (alternate authored mode)
//
// Default flipped from 'mode-a' to 'mode-b' on 2026-05-24 per Ion production pick.
// Reasoning (audit pass 2026-05-24):
//   - CSML §09 line 164-168 explicit lock: "For the Ion implementation specifically:
//     Mode B is the stronger fit." Built into the CSML lock based on Ion's content shape.
//   - Ion's state mix maps directly onto Mode B's grouped-by-state structure: 2 shipped
//     (Slack-first entry · Canvas branching+compare) + 2 prototyped/enabled (Trust
//     guardrails · Design system at scale) + 2 in-dev (Cross-variant editing · Workspace
//     refinement). Three distinct certainty tiers with multiple items each — textbook
//     Mode B "earned scaffolding" case per CSML line 153-157.
//   - Honest mixed-state truth: Mode A's "validation signals support primary outcome"
//     structure soft-pedals the fact that half Ion's features are still in development.
//     Mode B's position-carries-certainty grouping is more honest per CSML §09 line 263
//     "an honest ending, not a victory lap."
//   - Narrative tone: Mode B's "The Slack-first bet shipped. The rest is honest about
//     where it stands." opener nails Ion's authored-but-honest tone vs Mode A's more
//     report-like "Slack-first entry shipped and validated as the primary creative
//     starting point."
//   - BeforeAfterSlider (added 2026-05-24 as §09's first sanctioned interaction custom)
//     positioning: in Mode B, sits at narrative anchor after "the rest is honest about
//     where it stands" — slider frames the state groups as "here's the transformation,
//     now see where each piece lands." Slightly stronger narrative beat than Mode A's
//     T3-only anchor.
//   - `feedback_native_first_then_variants` doesn't conflict: rule is BUILD native first
//     (both modes are built at IC quality already, locked 2026-05-08), not "default
//     forever." Mode B is Ion's production pick per CSML lock.
//
// Mode A retained as toggle alternate (Lab chrome) for system-level evaluation +
// comparison + future case studies that might use Mode A as their default.
//
// Cascade table (build plan flag #37 + flag #43 path-a + Cycle 11 close):
//   Mode A block labels: IS 10/500/UC (Eyebrow class)
//   Mode B item title: CAPS_15 (demoted from ISe 22 per Cycle 11 scarcity discipline)
//   Mode B item description: Body 15 per flag #43 path-a (Mode B stacked structure
//     doesn't earn compressed register; matches §07 decision row body pattern)
export type GateAIonOutcomesMode = 'mode-a' | 'mode-b';

type Ctx = { state: GateAIonOutcomesMode; setState: (s: GateAIonOutcomesMode) => void };
const Cx = createContext<Ctx | null>(null);

export function GateAIonOutcomesModeProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GateAIonOutcomesMode>('mode-b');
  return <Cx.Provider value={{ state, setState }}>{children}</Cx.Provider>;
}

export function useGateAIonOutcomesMode(): Ctx {
  const v = useContext(Cx);
  if (!v) throw new Error('useGateAIonOutcomesMode must be inside GateAIonOutcomesModeProvider');
  return v;
}
