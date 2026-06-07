// Ion Demo Day 4-phase friction breakdown — verbatim from source materials.
// Source: source-materials/ion-deck-demo-day.md (L51-L75)
// Two slides: bare workflow phases / same phases with friction labels overlaid.
// Native register = friction-overlaid (the strategic-diagnostic slide).

export type C2Item = {
  text: string;
  isPrimary?: boolean; // bolded primary friction per Demo Day deck (top-row labels)
};

export type C2Phase = {
  name: string;
  workflowItems: string[]; // Slide 1: bare workflow at this phase
  frictionItems: C2Item[]; // Slide 2: friction labels overlaid (Kickoff stays untouched)
};

export type C2Dataset = {
  source: string;
  synthesized: boolean;
  phases: C2Phase[];
};

export const ION_PHASE_FRICTION_DEMO_DAY: C2Dataset = {
  source: 'Demo Day deck',
  synthesized: false,
  phases: [
    {
      name: 'Kickoff',
      workflowItems: ['Ticket', 'PRD', 'Kickoff call'],
      // Kickoff remains unchanged on the friction slide — no friction labels overlaid.
      frictionItems: [
        { text: 'Ticket' },
        { text: 'PRD' },
        { text: 'Kickoff call' },
      ],
    },
    {
      name: 'Ideation',
      workflowItems: ['Market research', 'Review past designs', 'Source inspiration', 'Rapid prototyping'],
      frictionItems: [
        { text: 'Unclear direction', isPrimary: true },
        { text: 'Scattered source of inspirations' },
        { text: '"Skip wireframing"' },
        { text: 'Go straight to hifi' },
      ],
    },
    {
      name: 'Review',
      workflowItems: ['HiFi designs', 'Design iteration', 'Team feedback', 'User Testing'],
      frictionItems: [
        { text: 'Scattered feedback', isPrimary: true },
        { text: 'Multiple feedback channels' },
        { text: 'Lost in Slack threads' },
        { text: 'Figma comments' },
      ],
    },
    {
      name: 'Delivery',
      workflowItems: ['Design spec', 'Engineering handoff', 'Rollout', 'Performance tracking'],
      frictionItems: [
        { text: 'Back-and-forth communication', isPrimary: true },
        { text: 'Misaligned handoff, poor execution' },
        { text: '"Final" design changes' },
        { text: 'Tight timeline' },
      ],
    },
  ],
};
