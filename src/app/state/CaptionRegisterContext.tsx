import React, { createContext, useContext, useState } from 'react';

// Caption / body scale register.
//   - default     : IS 13 body, 11 caption (locked scale)
//   - small-caps  : 11px caps body across caption-register atoms
//   - native      : surface's own authored baseline
export type CaptionRegisterMode = 'default' | 'small-caps';
export type CaptionRegisterState = CaptionRegisterMode | 'native';

type Ctx = { state: CaptionRegisterState; setState: (s: CaptionRegisterState) => void };

const Cx = createContext<Ctx | null>(null);

export function CaptionRegisterProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CaptionRegisterState>('native');
  return <Cx.Provider value={{ state, setState }}>{children}</Cx.Provider>;
}

export function useCaptionRegister(): Ctx {
  const v = useContext(Cx);
  if (!v) throw new Error('useCaptionRegister must be used inside CaptionRegisterProvider');
  return v;
}
