// Ion empathy map — SYNTHESIZED from Leyi affinity-map observations.
// Source: Leyi's "Workflow-focused user" affinity post-its (Quick design requests /
// Communication / Unblock handoff clusters) — research observations, NOT direct user
// quotes. Empathy-map quadrant content is interpretation per Dave Gray's 4-quadrant
// canvas (Says / Thinks / Does / Feels). Marked synthesized per playground plan §4.
//
// Attributions are kept ONLY where the empathy-map item is a close paraphrase of a
// single Leyi observation with a named attribution. Interpretive items (Thinks / Feels)
// have no attributions because they're inferred.

export type EmpathyItem = {
  text: string;
  author?: string; // research participant attribution where applicable
};

export type EmpathyQuadrant = {
  key: 'says' | 'thinks' | 'does' | 'feels' | 'pains' | 'gains';
  label: string;
  items: EmpathyItem[];
};

export type EmpathyPersona = {
  id: 'workflow-focused' | 'creative-control';
  name: string;
  thesis: string;
  quadrants: EmpathyQuadrant[];
};

export type EmpathyDataset = {
  source: string;
  synthesized: boolean;
  personas: EmpathyPersona[];
};

export const ION_EMPATHY_MAP: EmpathyDataset = {
  source: 'Leyi affinity-map observations · Workflow-focused user clusters',
  synthesized: true,
  personas: [
    {
      id: 'workflow-focused',
      name: 'Workflow-focused user',
      thesis: 'Values speed & efficiency.',
      quadrants: [
        {
          key: 'says',
          label: 'Says',
          items: [
            { text: 'Wants Ruby to validate decisions and speed up the workflow — limited time.', author: 'Florence Chow' },
            { text: 'Looking for a product that reduces cycle time on small features without designer sign-off.' },
            { text: 'Wants someone to handle quick design requests, unblock engineers, and act as a resource.' },
            { text: 'Wants Ruby to unblock engineers on async design requests.', author: 'Esther Pelaez' },
            { text: 'Slack integration resolves the context-switching issue with AI tools.', author: 'Dora Zhang' },
          ],
        },
        {
          key: 'thinks',
          label: 'Thinks',
          items: [
            { text: 'Time is limited — I need to ship fast.' },
            { text: 'Small features should not need full designer sign-off.' },
            { text: 'Overlooked design work creates development bottlenecks.', author: 'Sebastian Moreano Mesa' },
            { text: 'There is a real gap between Figma and the actual shipped output.', author: 'Dora Zhang' },
            { text: 'Engineering needs quick access to design resources.', author: 'Sebastian Moreano Mesa' },
          ],
        },
        {
          key: 'does',
          label: 'Does',
          items: [
            { text: 'Pulls Ruby into conversations for quick validation.', author: 'Florence Chow' },
            { text: 'Skips full designer review for small features.' },
            { text: 'Uses code Ruby generates to support engineering.', author: 'Dora Zhang' },
            { text: 'Switches contexts between Slack and AI tools.', author: 'Dora Zhang' },
            { text: 'Prototypes to speed instead of pixel-precise fidelity.', author: 'Dora Zhang' },
          ],
        },
        {
          key: 'feels',
          label: 'Feels',
          items: [
            { text: 'Pressured by tight delivery timelines.' },
            { text: 'Anxious about being a design bottleneck for engineering.' },
            { text: 'Frustrated by misalignments between Figma and shipped output.' },
            { text: 'Eager for non-essential flows to move faster with AI help.' },
            { text: 'Overwhelmed by context switching between tools.' },
          ],
        },
        {
          key: 'pains',
          label: 'Pains',
          items: [
            { text: 'Tight delivery timelines collide with full-fidelity design loops.' },
            { text: 'Becomes the bottleneck when small features need design sign-off.' },
            { text: 'Context switching between Slack threads and AI tools breaks flow.' },
            { text: 'Misalignments between Figma artifacts and shipped output.' },
            { text: 'Overlooked design work cascades into engineering delays.' },
          ],
        },
        {
          key: 'gains',
          label: 'Gains',
          items: [
            { text: 'Faster cycle time on small features without designer sign-off.' },
            { text: 'Async unblocking of engineering teams via Ruby-generated assets.' },
            { text: 'Slack integration that eliminates context switching.' },
            { text: 'Ruby validating decisions in conversation to keep momentum.' },
            { text: 'Reliable handoff path from design intent to shipped code.' },
          ],
        },
      ],
    },
    {
      id: 'creative-control',
      // Sebastian's locked persona label from ion-case-study-outline-source.md §03
      // is "Creative Control Seekers" (plural). Align the empathy-map persona name
      // to that locked label.
      name: 'Creative Control Seekers',
      thesis: 'Values creativity, control & craft.',
      quadrants: [
        {
          key: 'says',
          label: 'Says',
          items: [
            { text: 'Wants Ruby to review existing designs with the same context she has — PRD + personas.', author: 'Esther Pelaez' },
            { text: 'Interested in having flows critiqued through Figma.', author: 'Esther Pelaez' },
            { text: 'Wants to mostly use Ion for tools like Research and Ideation.', author: 'Amenze Sholanke' },
            { text: 'Hopes this tool gives back time to focus on the discovery, product, and strategic piece.', author: 'Esther Pelaez' },
            { text: 'Most tickets are about issues of styles the client prefers to resolve on their own.' },
          ],
        },
        {
          key: 'thinks',
          label: 'Thinks',
          items: [
            { text: 'Continuous, proactive design feedback should be repeatable end-to-end.', author: 'Dora Zhang' },
            { text: 'Components need improvement one by one.' },
            { text: 'Main challenge is product process — user-story generation, user research.', author: 'Sebastian Moreano Mesa' },
            { text: 'I want clarity quickly when designers are tied up elsewhere.', author: 'Amenze Sholanke' },
            { text: 'Insights live across many docs and conversations — turning them into action is the work.' },
          ],
        },
        {
          key: 'does',
          label: 'Does',
          items: [
            { text: 'Focuses on improving design and visual aspects of the product.', author: 'Dora Zhang' },
            { text: 'Manages backlog tickets to resolve design QA problems.' },
            { text: 'Works to improve existing design rather than start fresh.' },
            { text: 'Asks Ruby to critique flows rather than generate from scratch.', author: 'Esther Pelaez' },
            { text: 'Spends discovery time on research and user-story shaping.' },
          ],
        },
        {
          key: 'feels',
          label: 'Feels',
          items: [
            { text: 'Protective of craft — wants to keep design decisions in their hands.' },
            { text: 'Drained by repetitive design QA backlog.' },
            { text: 'Eager for an active collaborator that respects design intent.' },
            { text: 'Confident in their direction — looking for sharpening, not generation.' },
            { text: 'Resistant to tools that automate craft away.' },
          ],
        },
        {
          key: 'pains',
          label: 'Pains',
          items: [
            { text: 'Repetitive design QA tickets eating discovery time.' },
            { text: 'Insights scattered across docs and conversations — hard to act on.' },
            { text: 'Tools that take agency away from the designer.' },
            { text: 'Component-by-component improvement loops grinding momentum.' },
            { text: 'Tools that generate from scratch when refinement is what is needed.' },
          ],
        },
        {
          key: 'gains',
          label: 'Gains',
          items: [
            { text: 'More time for discovery, product, and strategy work.', author: 'Esther Pelaez' },
            { text: 'Ruby critiquing flows with full PRD + persona context.', author: 'Esther Pelaez' },
            { text: 'Refinement-focused AI assistance that respects existing design.' },
            { text: 'Active collaborator on research synthesis and ideation.', author: 'Amenze Sholanke' },
            { text: 'Continuous, repeatable feedback loops on existing designs.', author: 'Dora Zhang' },
          ],
        },
      ],
    },
  ],
};
