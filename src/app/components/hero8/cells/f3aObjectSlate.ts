// F3-A desk object id + short-label slate.
// Exposed for chrome chips (visibility toggles) without importing the full
// F3_A_DeskScene component. Ids must match DESK_OBJECTS in F3_A_DeskScene.tsx.

export const F3A_OBJECT_SLATE = [
  { id: 'macbook',        label: 'MacBook' },
  { id: 'pokemonFigure',  label: 'Pokémon' },
  { id: 'loveLetter',     label: 'Letter' },
  { id: 'seltzer',        label: 'Seltzer' },
  { id: 'sketchbook',     label: 'Sketchbook' },
  { id: 'pyramid',        label: 'Pyramid' },
  { id: 'runningPin',     label: 'Pin' },
  { id: 'flagColombiaUSA', label: 'Flag' },
  { id: 'clickyPen',      label: 'Pen' },
] as const;

export type F3AObjectId = typeof F3A_OBJECT_SLATE[number]['id'];
