// Ion CoCreate long-deck 5-step funnel — verbatim from source materials.
// Source: source-materials/ion-deck-cocreate-long.md (L225-L239)
// Three slides in deck: bare 5-step / "Ion starts here" at step 03 / "What if Ion starts
// here?" at step 01 (the strategic-move slide — the canonical native register).

export type FunnelStage = {
  id: string; // "01"-"05"
  label: string;
  // Synthesized retention % at this stage. Ion's narrative funnel does NOT carry real
  // analytics. These values are ILLUSTRATIVE, surfaced only when the conversion-% toggle
  // is flipped to 'shown', and the render adds a "synthesized · illustrative" marker.
  synthesizedRetentionPct: number;
};

export type FunnelAnnotation = {
  text: string;
  targetStepId: string; // which step the annotation points at
};

export type FunnelDataset = {
  source: string;
  synthesized: boolean;
  stages: FunnelStage[];
  annotations: FunnelAnnotation[];
};

export const ION_FUNNEL_COCREATE: FunnelDataset = {
  source: 'CoCreate long deck',
  synthesized: false,
  stages: [
    { id: '01', label: 'User receives design prompt from managers / Founder messages designer about their idea', synthesizedRetentionPct: 100 },
    { id: '02', label: 'User conducts design research', synthesizedRetentionPct: 78 },
    { id: '03', label: 'User goes into figma to ideate', synthesizedRetentionPct: 62 },
    { id: '04', label: 'Rounds of iterations', synthesizedRetentionPct: 51 },
    { id: '05', label: 'User hands off design to engineers', synthesizedRetentionPct: 35 },
  ],
  annotations: [
    { text: 'What if Ion starts here?', targetStepId: '01' },
    { text: 'Ion starts here', targetStepId: '03' },
  ],
};
