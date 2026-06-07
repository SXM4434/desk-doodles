import React, { createContext, useContext, useState } from 'react';

// Preset selector for Cards/Tiles family pages.
//
// Presets are the 10 Cards / 3 Tiles named combinations from SURFACE_ATTRS.
// Selecting a preset cascades its fixed/baseline values into the 8 identity
// axis contexts (CardFrame, Divider, TitleRegister, ImageTreatment,
// CaptionRegister, ShippedProof, ProofPlacement, AspectVariance).
//
// The cascade itself lives in the family page (it has access to all 8 setters
// and to SURFACE_ATTRS). This context just carries the selected preset id.

export type PresetId = 'custom' | string; // 'custom' or a SURFACE_ATTRS id

type Ctx = { preset: PresetId; setPreset: (id: PresetId) => void };

const Cx = createContext<Ctx | null>(null);

export function PresetProvider({ children }: { children: React.ReactNode }) {
  const [preset, setPreset] = useState<PresetId>('custom');
  return <Cx.Provider value={{ preset, setPreset }}>{children}</Cx.Provider>;
}

export function usePreset(): Ctx {
  const v = useContext(Cx);
  if (!v) throw new Error('usePreset must be used inside PresetProvider');
  return v;
}
