// Simplified Ion user flow — synthesized from product narrative.
// Source basis: ion-case-study-outline-source.md + ion-deck-cocreate-long.md
// (Slack entry → Canvas → Ruby generates → iterate via panels → Workspace handoff).
// Synthesized: yes — no canonical user-flow artifact exists in Ion source decks;
// this is the simplest defensible flowchart shape that matches the documented product
// narrative. Marked `(simplified Ion flow)` in the artifact header per the playground
// rule that synthesized content surfaces a visible marker.

export type C3NodeShape = 'oval' | 'rect' | 'diamond';

export type C3Node = {
  id: string;
  shape: C3NodeShape;
  label: string;
  // Step number for Candidate C (Holmes numbered-stepper register).
  // Decision step renders 'DECISION' in place of a number.
  stepNumber?: string;
  // Short Ion-grounded annotation for Candidate B (annotated-editorial register).
  // Each pulled from source-materials/ion-case-study-outline-source.md §05–§07.
  annotation?: string;
};

export type C3Edge = {
  from: string;
  to: string;
  label?: string;        // path label (e.g., "Yes" / "No" on decision branches)
  kind?: 'forward' | 'loopback';
};

export type C3Dataset = {
  source: string;
  synthesized: boolean;
  nodes: C3Node[];
  edges: C3Edge[];
};

export const ION_USER_FLOW_SIMPLIFIED: C3Dataset = {
  source: 'Synthesized · simplified Ion flow',
  synthesized: true,
  nodes: [
    {
      id: 'start', shape: 'oval', label: 'Slack request', stepNumber: '01',
      annotation: 'Trigger @ruby in any channel · drop in a sketch or screenshot',
    },
    {
      id: 'open', shape: 'rect', label: 'Open Ion', stepNumber: '02',
      annotation: 'Slack-first entry · 6–10s loop to Ruby reply options',
    },
    {
      id: 'prompt', shape: 'rect', label: 'Prompt on Canvas', stepNumber: '03',
      annotation: 'Infinite canvas · branch, compare, iterate without losing context',
    },
    {
      id: 'generate', shape: 'rect', label: 'Ruby generates', stepNumber: '04',
      annotation: 'Reply options · live cursor selects element for inline edits',
    },
    {
      id: 'iterate', shape: 'rect', label: 'Iterate via panels', stepNumber: '05',
      annotation: 'Workspace · property panels + layers (zero learning curve for Figma)',
    },
    {
      id: 'check', shape: 'diamond', label: 'Iteration acceptable?', stepNumber: 'DECISION',
      annotation: 'Clarify-before-execute guardrails · designer judgment moment',
    },
    {
      id: 'end', shape: 'oval', label: 'Workspace handoff', stepNumber: '06',
      annotation: 'Locked-in spec · handoff to engineer with versioned context',
    },
  ],
  edges: [
    { from: 'start',    to: 'open',     kind: 'forward' },
    { from: 'open',     to: 'prompt',   kind: 'forward' },
    { from: 'prompt',   to: 'generate', kind: 'forward' },
    { from: 'generate', to: 'iterate',  kind: 'forward' },
    { from: 'iterate',  to: 'check',    kind: 'forward' },
    { from: 'check',    to: 'end',      label: 'Yes', kind: 'forward' },
    { from: 'check',    to: 'generate', label: 'No',  kind: 'loopback' },
  ],
};
