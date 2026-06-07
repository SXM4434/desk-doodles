import React, { createContext, useContext, useState } from 'react';

// Title typographic register.
//   - default      : Instrument Sans 500 (locked IS token)
//   - ise-italic   : Instrument Serif italic (editorial / literary register)
//   - small-caps   : Instrument Sans uppercase w/ letter-spacing (editorial meta)
//   - native       : surface's own authored baseline
export type TitleRegisterMode = 'default' | 'ise-italic' | 'small-caps';
export type TitleRegisterState = TitleRegisterMode | 'native';

type Ctx = { state: TitleRegisterState; setState: (s: TitleRegisterState) => void };

const Cx = createContext<Ctx | null>(null);

export function TitleRegisterProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<TitleRegisterState>('native');
  return <Cx.Provider value={{ state, setState }}>{children}</Cx.Provider>;
}

export function useTitleRegister(): Ctx {
  const v = useContext(Cx);
  if (!v) throw new Error('useTitleRegister must be used inside TitleRegisterProvider');
  return v;
}
