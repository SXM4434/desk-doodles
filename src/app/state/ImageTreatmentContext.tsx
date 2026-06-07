import React, { createContext, useContext, useState } from 'react';

// Media container treatment around the image.
//   - plain         : flush image, no frame
//   - framed        : single hairline border + small inset
//   - double-frame  : hairline + inner border + padded mat (gallery register)
//   - mat           : padded background mat around image, no outer border
//   - native        : surface's own authored baseline
export type ImageTreatmentMode = 'plain' | 'framed' | 'double-frame' | 'mat';
export type ImageTreatmentState = ImageTreatmentMode | 'native';

type Ctx = { state: ImageTreatmentState; setState: (s: ImageTreatmentState) => void };

const Cx = createContext<Ctx | null>(null);

export function ImageTreatmentProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ImageTreatmentState>('native');
  return <Cx.Provider value={{ state, setState }}>{children}</Cx.Provider>;
}

export function useImageTreatment(): Ctx {
  const v = useContext(Cx);
  if (!v) throw new Error('useImageTreatment must be used inside ImageTreatmentProvider');
  return v;
}
