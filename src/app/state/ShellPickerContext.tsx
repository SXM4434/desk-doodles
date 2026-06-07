import React, { createContext, useContext, useMemo, useState } from 'react';

// Shell selection mode for Narrow-2 family space (Cards + Tiles) and the
// articulation pages. Three modes:
//   - baseline  : use each surface's existing native shell (default)
//   - native    : auto-pick best shell per layout tier via NATIVE_SHELL_FOR_LAYOUT
//   - manual    : per-slot user picks (featuredShell + standardShell overrides)
export type ShellId = 'FH-A' | 'FH-B' | 'FV-A' | 'SV-A' | 'SV-B' | 'SH-A-Row';
export type ShellPickerMode = 'baseline' | 'native' | 'manual';

export type ManualShellOverrides = {
  featured?: ShellId;
  standard?: ShellId;
};

type Ctx = {
  mode: ShellPickerMode;
  setMode: (m: ShellPickerMode) => void;
  manual: ManualShellOverrides;
  setManual: (m: ManualShellOverrides) => void;
};

const Cx = createContext<Ctx | null>(null);

export function ShellPickerProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ShellPickerMode>('baseline');
  const [manual, setManual] = useState<ManualShellOverrides>({});
  const ctx = useMemo<Ctx>(
    () => ({ mode, setMode, manual, setManual }),
    [mode, manual],
  );
  return <Cx.Provider value={ctx}>{children}</Cx.Provider>;
}

export function useShellPicker(): Ctx {
  const v = useContext(Cx);
  if (!v) throw new Error('useShellPicker must be used inside ShellPickerProvider');
  return v;
}
