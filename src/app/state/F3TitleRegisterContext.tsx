import { createContext, useContext, useState, type ReactNode } from 'react';
import { ISe, CD } from '../components/cards/tokens';

// F3 family title register — locked face × size pairs per
// docs/locked/typography-system.md (Cycle 11). NOT a free face swap; each
// register has a SINGLE locked face × size. User direction 2026-05-31:
// "we don't have a 22 Clash Display" — face is determined by register.
//
// Locked registers (per typography-system.md lines 32–34, 87–110, 237):
// • Display / Hero    — CD 500  · 52px · lh 1.08 · -0.03em
// • Editorial Intro   — ISe 400 · 32px · lh 1.18 · -0.025em
// • Editorial Section — ISe 400 · 22px · lh 1.25 · -0.02em
//
// CD is display-only; never section-heading duty.
// ISe is editorial only at 22/32; never display (52).
// Independent state per cell — F3-A may sit at Display while F3-B sits at Section.

export type F3TitleRegister = 'display' | 'intro-heading' | 'section-heading';

export type F3TitleRegisterMeta = {
  id: F3TitleRegister;
  label: string;
  detail: string;
  fontFamily: string;
  fontWeight: number;
  fontSize: number;
  lineHeight: number;
  letterSpacing: string;
};

export const F3_TITLE_REGISTERS: F3TitleRegisterMeta[] = [
  {
    id: 'display',
    label: 'Display · CD 52',
    detail: 'Clash Display 500 · 52px · Homepage / case-study hero headline (locked Display register).',
    fontFamily: CD,
    fontWeight: 500,
    fontSize: 52,
    lineHeight: 1.08,
    letterSpacing: '-0.03em',
  },
  {
    id: 'intro-heading',
    label: 'Intro Heading · ISe 32',
    detail: 'Instrument Serif 400 · 32px · Editorial intro / manifesto-like opening statement (locked Editorial Intro register).',
    fontFamily: ISe,
    fontWeight: 400,
    fontSize: 32,
    lineHeight: 1.18,
    letterSpacing: '-0.025em',
  },
  {
    id: 'section-heading',
    label: 'Section Heading · ISe 22',
    detail: 'Instrument Serif 400 · 22px · Editorial section content title (locked Editorial Section register · earning rule applies).',
    fontFamily: ISe,
    fontWeight: 400,
    fontSize: 22,
    lineHeight: 1.25,
    letterSpacing: '-0.02em',
  },
];

export function getTitleRegisterMeta(id: F3TitleRegister): F3TitleRegisterMeta {
  return F3_TITLE_REGISTERS.find((r) => r.id === id) ?? F3_TITLE_REGISTERS[0];
}

type Ctx = {
  stateA: F3TitleRegister;
  stateB: F3TitleRegister;
  setStateA: (v: F3TitleRegister) => void;
  setStateB: (v: F3TitleRegister) => void;
};

const F3TitleRegisterCtx = createContext<Ctx | null>(null);

export function F3TitleRegisterProvider({ children }: { children: ReactNode }) {
  // Defaults match locked composition: F3-A hero band = Display (CD 52);
  // F3-B identity column = Section Heading (ISe 22).
  const [stateA, setStateA] = useState<F3TitleRegister>('display');
  const [stateB, setStateB] = useState<F3TitleRegister>('section-heading');
  return (
    <F3TitleRegisterCtx.Provider value={{ stateA, stateB, setStateA, setStateB }}>
      {children}
    </F3TitleRegisterCtx.Provider>
  );
}

export function useF3TitleRegister(): Ctx {
  const v = useContext(F3TitleRegisterCtx);
  if (!v) throw new Error('useF3TitleRegister must be used inside F3TitleRegisterProvider');
  return v;
}
