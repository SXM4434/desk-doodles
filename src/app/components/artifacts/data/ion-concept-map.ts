// Ion concept map — SYNTHESIZED Novak-style hierarchy.
// Source roots: Demo Day "3 Insights" + Leyi affinity themes. Ion materials don't carry
// an explicit concept map. Marked synthesized per playground plan §4.

export type ConceptNode = {
  id: string;
  label: string;
  level: 0 | 1 | 2; // 0 = root, 1 = tier-2 themes, 2 = atomic concerns
  isFocal?: boolean;
};

export type ConceptLink = {
  from: string; // source node id
  to: string; // target node id
  label: string; // Novak-canon labeled relationship
  isCrossLink?: boolean; // true = cross-branch link (Novak signature)
};

export type ConceptMapDataset = {
  source: string;
  synthesized: boolean;
  nodes: ConceptNode[];
  links: ConceptLink[];
};

export const ION_CONCEPT_MAP: ConceptMapDataset = {
  source: 'Synthesized · Demo Day 3 Insights + Leyi affinity themes',
  synthesized: true,
  nodes: [
    { id: 'root', label: 'Designer agency in AI-assisted work', level: 0, isFocal: true },
    { id: 'trust', label: 'Trust', level: 1 },
    { id: 'control', label: 'Control', level: 1 },
    { id: 'speed', label: 'Speed', level: 1 },
    // Trust subtree
    { id: 'trust-pred', label: 'AI predictability', level: 2 },
    { id: 'trust-valid', label: 'Validated decisions', level: 2 },
    { id: 'trust-partner', label: 'Thought partner mode', level: 2 },
    // Control subtree
    { id: 'ctl-iter', label: 'Iteration cycle', level: 2 },
    { id: 'ctl-scope', label: 'Scope drift', level: 2 },
    { id: 'ctl-qa', label: 'Component QA', level: 2 },
    // Speed subtree
    { id: 'spd-cycle', label: 'Cycle time', level: 2 },
    { id: 'spd-async', label: 'Async unblocking', level: 2 },
    { id: 'spd-checks', label: 'Quick design checks', level: 2 },
  ],
  links: [
    // Root → tier-2
    { from: 'root', to: 'trust', label: 'depends on' },
    { from: 'root', to: 'control', label: 'requires' },
    { from: 'root', to: 'speed', label: 'needs' },
    // Trust → leaves
    { from: 'trust', to: 'trust-pred', label: 'via' },
    { from: 'trust', to: 'trust-valid', label: 'via' },
    { from: 'trust', to: 'trust-partner', label: 'enables' },
    // Control → leaves
    { from: 'control', to: 'ctl-iter', label: 'over' },
    { from: 'control', to: 'ctl-scope', label: 'limits' },
    { from: 'control', to: 'ctl-qa', label: 'maintains' },
    // Speed → leaves
    { from: 'speed', to: 'spd-cycle', label: 'reduces' },
    { from: 'speed', to: 'spd-async', label: 'enables' },
    { from: 'speed', to: 'spd-checks', label: 'enables' },
    // Cross-links (Novak signature — connect across branches)
    { from: 'trust-pred', to: 'ctl-iter', label: 'shortens', isCrossLink: true },
    { from: 'trust-valid', to: 'spd-cycle', label: 'speeds', isCrossLink: true },
    { from: 'trust-partner', to: 'ctl-qa', label: 'supports', isCrossLink: true },
  ],
};
