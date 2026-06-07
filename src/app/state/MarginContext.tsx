import React, { createContext, useContext, useMemo, useState } from 'react';

// Shared global desktop PAGE-GUTTER axis for the homepage v2 lab system.
//
// Meaning: viewport-to-content gutter. Outer page-frame control.
//
// Two concept kinds live here:
//   • 'centered' — the OG baseline: max-width 1120 + margin 0 auto + 48 inner
//     padding. Viewport-responsive; matches the OG exactly on every monitor.
//     Not a gutter value; a framing mode. Lives OUTSIDE the numeric ramp.
//   • m1..m15 — fixed-px outer gutter tokens. Content width = viewport - 2*gutter.
//     Clean stepping across the whole ramp (no 160→320 spike).
//
// And one resolution layer:
//   • 'native' — state-only sentinel that resolves per-candidate via the
//     `nativeMargin` registry field. Never appears in MARGIN_VALUES / MARGIN_MODE.
//
// Consumed by Page1120 / Page1280 (which branch on mode) + GlobalNav.
// Lab chrome (LabShell toolbar + candidate subheader strips) stays at the
// fixed 48 locked inset and is NOT driven by this axis.

export type MarginToken =
  | 'centered'
  | 'm1'
  | 'm2'
  | 'm3'
  | 'm4'
  | 'm5'
  | 'm6'
  | 'm7'
  | 'm8'
  | 'm9'
  | 'm10'
  | 'm11'
  | 'm12'
  | 'm13'
  | 'm14'
  | 'm15';

export type MarginState = MarginToken | 'native';

export type MarginMode = 'gutter' | 'centered';

// For gutter tokens: value = outer gutter px.
// For centered token: value = inner padding inside the 1120 box (48 = OG).
export const MARGIN_VALUES: Record<MarginToken, number> = {
  centered: 48,
  m1: 16,
  m2: 24,
  m3: 32,
  m4: 48,
  m5: 72,
  m6: 96,
  m7: 128,
  m8: 160,
  m9: 200,
  m10: 240,
  m11: 320,
  m12: 400,
  m13: 480,
  m14: 560,
  m15: 640,
};

export const MARGIN_MODE: Record<MarginToken, MarginMode> = {
  centered: 'centered',
  m1: 'gutter',
  m2: 'gutter',
  m3: 'gutter',
  m4: 'gutter',
  m5: 'gutter',
  m6: 'gutter',
  m7: 'gutter',
  m8: 'gutter',
  m9: 'gutter',
  m10: 'gutter',
  m11: 'gutter',
  m12: 'gutter',
  m13: 'gutter',
  m14: 'gutter',
  m15: 'gutter',
};

// Numeric ramp only — narrow → wide. 'centered' lives outside the ramp.
export const MARGIN_RAMP: MarginToken[] = [
  'm1',
  'm2',
  'm3',
  'm4',
  'm5',
  'm6',
  'm7',
  'm8',
  'm9',
  'm10',
  'm11',
  'm12',
  'm13',
  'm14',
  'm15',
];

export const MARGIN_BASELINE: MarginToken = 'centered';
export const CENTERED_MAX_WIDTH = 1120;

type Ctx = {
  // What the user picked — may be 'native'.
  state: MarginState;
  // Always resolved to a concrete token (never 'native'). Use this for rendering.
  resolved: MarginToken;
  // Convenience — MARGIN_VALUES[resolved].
  value: number;
  // Convenience — MARGIN_MODE[resolved].
  mode: MarginMode;
  // Setters.
  setState: (s: MarginState) => void;
  setNativeTarget: (t: MarginToken) => void;
  // Introspection — the target 'native' currently resolves to.
  nativeTarget: MarginToken;
};

const MarginCtx = createContext<Ctx | null>(null);

export function MarginProvider({ children }: { children: React.ReactNode }) {
  // Lock default 2026-05-24: M2 (24px) is the production-pick gutter for Gate A Ion shell after toggle-iteration close.
  const [state, setState] = useState<MarginState>('m2');
  const [nativeTarget, setNativeTarget] = useState<MarginToken>(MARGIN_BASELINE);

  const resolved: MarginToken = state === 'native' ? nativeTarget : state;

  const ctx = useMemo<Ctx>(
    () => ({
      state,
      resolved,
      value: MARGIN_VALUES[resolved],
      mode: MARGIN_MODE[resolved],
      setState,
      setNativeTarget,
      nativeTarget,
    }),
    [state, resolved, nativeTarget],
  );

  return <MarginCtx.Provider value={ctx}>{children}</MarginCtx.Provider>;
}

export function useMargin(): Ctx {
  const v = useContext(MarginCtx);
  if (!v) throw new Error('useMargin must be used inside MarginProvider');
  return v;
}

// Helper — human label for a token (used in dropdowns + triggers).
export function marginTokenLabel(t: MarginToken): string {
  if (t === 'centered') return `Centered (${CENTERED_MAX_WIDTH} + ${MARGIN_VALUES.centered})`;
  return `${t.toUpperCase()} · ${MARGIN_VALUES[t]}px`;
}
