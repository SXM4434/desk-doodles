import React, { createContext, useContext, useState } from 'react';

// Controls whether §07 Decision Snapshots row ordinal anchor is rendered.
//
// Classification: row ordinal anchor is a meta-data layer label — slots under the
// Eyebrow register (Cycle 3 lock: IS 10/500/0.12em UC text-secondary) as a new
// sanctioned use case alongside section eyebrow, card eyebrow, tier labels, and
// §09 Mode A block labels. It identifies/anchors a row rather than carrying content.
//
// Two states:
//   'off'      — no row id; row identity carried by decision title + accordion structure.
//                CSML §07 doesn't mandate row numbering; §08/§10 don't number rows.
//                Cleaner editorial read per CSML tone rule (line 80–98: not cold, not over-explained).
//   'numeric'  — zero-padded ordinals (01, 02, 03) at Eyebrow register before decision title.
//                Reinforces the "Three decisions" framing from the Title; lab-canonical pattern.
//
// Default 'off' (cleaner CSML reading, consistent with §08/§10 row patterns).
export type GateAIonS07RowId = 'off' | 'numeric';

type Ctx = { state: GateAIonS07RowId; setState: (s: GateAIonS07RowId) => void };
const Cx = createContext<Ctx | null>(null);

export function GateAIonS07RowIdProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GateAIonS07RowId>('off');
  return <Cx.Provider value={{ state, setState }}>{children}</Cx.Provider>;
}

export function useGateAIonS07RowId(): Ctx {
  const v = useContext(Cx);
  if (!v) throw new Error('useGateAIonS07RowId must be inside GateAIonS07RowIdProvider');
  return v;
}
