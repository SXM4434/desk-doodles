// Ion CoCreate "From ambiguity to certainty" wavy-spectrum — verbatim from source.
// Source: source-materials/ion-deck-cocreate-long.md (L127-L141)
// Visual character: tangled-line drawing on the left progressively smoothing out to a
// straight line on the right.

export type WavyStage = {
  label: string;
};

export type WavyDataset = {
  source: string;
  synthesized: boolean;
  leftAnchor: { primary: string; secondary: string };
  rightAnchor: { primary: string; secondary: string };
  stages: WavyStage[];
};

export const ION_WAVY_COCREATE: WavyDataset = {
  source: 'CoCreate long deck',
  synthesized: false,
  leftAnchor: { primary: 'High ambiguity', secondary: 'Low certainty' },
  rightAnchor: { primary: 'Low ambiguity', secondary: 'High certainty' },
  stages: [
    { label: 'Understand & Design research' },
    { label: 'Concept exploration & direction setting' },
    { label: 'Detail refinement' },
    { label: 'Implementation ready' },
  ],
};
