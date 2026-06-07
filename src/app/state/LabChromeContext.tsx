import React, { createContext, useContext, useState } from 'react';

// Manual toggle for lab chrome (LabShell top toolbar + candidate nav strip).
// Independent of cardScale — works at any scale including 'standard'.
// GlobalNav is the website's nav and is NOT gated by this — it always renders.

type Ctx = {
  chromeVisible: boolean;
  setChromeVisible: (v: boolean) => void;
  toggleChrome: () => void;
};

const Cx = createContext<Ctx | null>(null);

export function LabChromeProvider({ children }: { children: React.ReactNode }) {
  const [chromeVisible, setChromeVisible] = useState<boolean>(true);
  const toggleChrome = () => setChromeVisible((v) => !v);
  return (
    <Cx.Provider value={{ chromeVisible, setChromeVisible, toggleChrome }}>
      {children}
    </Cx.Provider>
  );
}

export function useLabChrome(): Ctx {
  const v = useContext(Cx);
  if (!v) throw new Error('useLabChrome must be used inside LabChromeProvider');
  return v;
}
