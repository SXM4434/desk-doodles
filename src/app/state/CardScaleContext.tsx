import React, { createContext, useContext, useState } from 'react';

// Card-scale axis — scopes the Featured card to a viewport-relative bounding
// box. Narrow-2 only. Layout / Surface / Combo / Narrow-1 modes ignore it.
//
//   - standard    : current behavior — card renders inside the layout's
//                   authored grid cell; whatever dimensions that produces
//                   stand (T1-L3 Tiles overflow stays as-is at this value).
//   - contain     : 85vw × 85vh max — whole card (image + label stack) fits
//                   inside the viewport; card sizes to content, not to box.
//                   Use when you want to see the entire card at max legible
//                   size without any cropping.
//   - fit         : 85vw × 75vh — card stretches to fill the bounding box.
//   - hero        : 88vw × 80vh — Bill Guo register.
//   - ultra       : 95vw × 85vh — pushing.
//   - fullscreen  : 100vw × 90vh — maxed bounding box.
//   - overflow    : 110vw × 95vh — explicit edge-case stress (card beyond
//                   the viewport even on a wide monitor).
//
// Non-standard values remove the layout from the render and show the
// Featured card alone at the chosen scale — that's the whole point of the
// axis (how big can this card breathe?). Standard keeps the layout render.
//
// `fit`-mode (`'fill'`) makes the card stretch to match the outer box so the
// inside register expands to cover it. `contain`-mode (`'contain'`) caps the
// outer dimensions and lets the card size to its natural content height.
export type CardScaleMode =
  | 'standard'
  | 'contain'
  | 'fit'
  | 'hero'
  | 'ultra'
  | 'fullscreen'
  | 'overflow';

export type CardScaleFit = 'fill' | 'contain';

type Ctx = { mode: CardScaleMode; setMode: (m: CardScaleMode) => void };

const Cx = createContext<Ctx | null>(null);

export function CardScaleProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<CardScaleMode>('standard');
  return <Cx.Provider value={{ mode, setMode }}>{children}</Cx.Provider>;
}

export function useCardScale(): Ctx {
  const v = useContext(Cx);
  if (!v) throw new Error('useCardScale must be used inside CardScaleProvider');
  return v;
}

// Bounding-box resolver for a card-scale value. Returns the outer box CSS
// (width / height) the Featured render should fill at that scale plus a
// `fit` hint — 'fill' stretches the card to the box (grid child), 'contain'
// caps the card at the box and lets content size naturally (maxWidth /
// maxHeight on an inline-block wrapper).
export function resolveCardScaleBox(mode: CardScaleMode): {
  width: string;
  height: string;
  fit: CardScaleFit;
} | null {
  if (mode === 'standard') return null;
  if (mode === 'contain') return { width: '85vw', height: '85vh', fit: 'contain' };
  if (mode === 'fit') return { width: '85vw', height: '75vh', fit: 'fill' };
  if (mode === 'hero') return { width: '88vw', height: '80vh', fit: 'fill' };
  if (mode === 'ultra') return { width: '95vw', height: '85vh', fit: 'fill' };
  if (mode === 'fullscreen') return { width: '100vw', height: '90vh', fit: 'fill' };
  if (mode === 'overflow') return { width: '110vw', height: '95vh', fit: 'fill' };
  return null;
}
