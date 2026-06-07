// Ion mental model — SYNTHESIZED Indi Young towers diagram.
// Source roots (verifiable):
//   - Demo Day "3 Insights": AI as thought partner / Leveraging familiar design patterns
//     / Precise control (source-materials/ion-deck-demo-day.md L91-L95)
//   - Leyi affinity-map themes: Speed / Quick design requests / Communication /
//     Unblock handoff / Styles alignment / Design Review / Insights finding
//   - Demo Day capability set: Slack entry, Infinite Canvas, Workspace, Property Panel,
//     Layers Panel, Live Cursor, AI Feedback, Node-based editing
//
// Indi Young's mental-model framework places user behaviors as vertical "towers" above
// a horizontal alignment line, with product capabilities aligned beneath. Ion materials
// don't carry an explicit towers diagram — this synthesizes one from the verifiable
// research themes + capabilities. Marked synthesized per playground plan §4.

export type MentalModelTask = {
  text: string;
  author?: string;
};

export type MentalModelTower = {
  name: string;
  atomicTasks: MentalModelTask[];
};

export type MentalModelCapability = {
  name: string;
  supportsTowers: number[]; // indexes into towers array (0-based)
};

export type MentalModelDataset = {
  source: string;
  synthesized: boolean;
  populationLabel: string;
  towers: MentalModelTower[];
  capabilities: MentalModelCapability[];
};

export const ION_MENTAL_MODEL: MentalModelDataset = {
  source: 'Synthesized · Demo Day 3 Insights + Leyi affinity themes + Demo Day capability set',
  synthesized: true,
  populationLabel: 'Designers using AI in product development',
  towers: [
    {
      name: 'Speed & cycle time',
      atomicTasks: [
        { text: 'Quick design checks mid-development' },
        { text: 'Async unblocking of engineering teams', author: 'Esther Pelaez' },
        { text: 'Reduce cycle time on small features' },
        { text: 'Skip full designer sign-off where possible' },
        { text: 'Move from Figma artifact to shipped output fast', author: 'Dora Zhang' },
      ],
    },
    {
      name: 'Control & craft',
      atomicTasks: [
        { text: 'Critique existing flows with PRD + persona context', author: 'Esther Pelaez' },
        { text: 'Refine designs one component at a time' },
        { text: 'Keep creative direction in human hands' },
        { text: 'Use AI for sharpening, not generation' },
        { text: 'Manage design QA backlog without losing time', author: 'Dora Zhang' },
      ],
    },
    {
      name: 'Trust & validation',
      atomicTasks: [
        { text: 'Validate decisions with Ruby in conversation', author: 'Florence Chow' },
        { text: 'Get a thought partner on synthesis' },
        { text: 'Surface insights from research and conversations' },
        { text: 'Confirm direction before committing to fidelity' },
        { text: 'Decompose complex problems into next steps' },
      ],
    },
    {
      name: 'Learning curve & familiarity',
      atomicTasks: [
        { text: 'Match patterns designers already know' },
        { text: 'Avoid steep onboarding costs' },
        { text: 'Use Figma-familiar interactions' },
        { text: 'Inherit existing design vocabulary' },
        { text: 'Avoid disrupting existing tools', author: 'Dora Zhang' },
      ],
    },
    {
      name: 'AI agency & collaboration',
      atomicTasks: [
        { text: 'Define what AI handles vs what designer owns' },
        { text: 'Treat AI as collaborator, not replacement' },
        { text: 'Set boundaries when AI proposes vs decides' },
        { text: 'Maintain final authority over shipped output' },
        { text: 'Use AI for generation, human for judgment' },
      ],
    },
  ],
  capabilities: [
    { name: 'Slack entry', supportsTowers: [0, 3] }, // Speed + Familiarity
    { name: 'Infinite Canvas', supportsTowers: [1, 2] }, // Control + Trust
    { name: 'Workspace', supportsTowers: [1, 4] }, // Control + AI Agency
    { name: 'Property Panel', supportsTowers: [1] }, // Control
    { name: 'Layers Panel', supportsTowers: [1, 3] }, // Control + Familiarity
    { name: 'Live Cursor', supportsTowers: [2, 4] }, // Trust + AI Agency
    { name: 'AI Feedback', supportsTowers: [2, 4] }, // Trust + AI Agency
    { name: 'Node-based editing', supportsTowers: [0, 1] }, // Speed + Control
  ],
};
