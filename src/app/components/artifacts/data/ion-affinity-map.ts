// Ion affinity-map data — verbatim post-its from primary research case study.
// Source: docs/labs/applied-surfaces-v2/ion/source-materials/leyi-zhang-iondesign-case-study.md
// Reference image: source-materials/artifact-references/leyi-affinity-map-personas.png
//
// Two personas × three clusters × N post-its each. Author attributions are real research
// participants (Dora Zhang, Esther Pelaez, Amenze Sholanke, Florence Chow, Sebastian
// Moreano Mesa) — never invent attributions, never paraphrase quotes.

export type PostIt = {
  text: string;
  author?: string;
};

export type Cluster = {
  name: string;
  notes: PostIt[];
};

export type Persona = {
  name: string;
  thesis: string;
  clusters: Cluster[];
};

export const ION_AFFINITY_MAP: Persona[] = [
  {
    name: 'Design-heavy user',
    thesis: 'Values creativity, control & craft.',
    clusters: [
      {
        name: 'Styles alignment',
        notes: [
          { text: 'focused on improving design and visual aspects of product', author: 'Dora Zhang' },
          { text: 'Client has most problems with #3 the most and have many backlog tickets to resolve design QA problems' },
          { text: 'Most tickets are about the issue of styles which the client prefers to resolve on their own.' },
          { text: "Client's main challenge is to improve existing design" },
          { text: 'They look for continuous & proactive design, feedback & updates, and end-to-end support (they want the process to replicate & repeat)', author: 'Dora Zhang' },
          { text: 'Another main challenge of the user is improving components one by one.' },
        ],
      },
      {
        name: 'Design Review',
        notes: [
          { text: 'Wants Ruby to review and helping with flow and being a resource for the designer' },
          { text: 'Interesting in having flows critiqued through Figma', author: 'Esther Pelaez' },
          { text: 'Appreciates tools like this for when he needs to gain more clarity and designers are tied in other stuff and he wants things to move quicker.', author: 'Amenze Sholanke' },
          { text: 'Wants ruby to review existing designs they created — wants ruby with context she has (PRD + personas), critique the flows.', author: 'Esther Pelaez' },
        ],
      },
      {
        name: 'Insights finding',
        notes: [
          { text: 'how do I get the right insights from all these documents and all of these conversations that we\'re having and turn them into the action.' },
          { text: 'Wants to mostly use Ion for tools like Research and Ideation.', author: 'Amenze Sholanke' },
          { text: 'Hopes that this tool gives them back time to focus on the discovery, product, and strategic piece.', author: 'Esther Pelaez' },
          { text: 'Main challenge is in product process, particularly user story generation and user research', author: 'Sebastian Moreano Mesa' },
        ],
      },
    ],
  },
  {
    name: 'Workflow-focused user',
    thesis: 'Values speed & efficiency.',
    clusters: [
      {
        name: 'Quick design requests',
        notes: [
          { text: 'ruby enters convo to validate these decisions and speed up his workflow and make it > efficient — bc he has limited time', author: 'Florence Chow' },
          { text: 'Looking for product that can help reduce cycle time even more for small features without a designer sign off.' },
          { text: 'Wants someone to handle quick design requests, unblock engineers, and act as a resource' },
          { text: 'Helps with non-essential flows' },
          { text: 'Overlooked design work can lead to bottlenecks in development, causing delays in feature delivery and impacting overall project timelines.', author: 'Sebastian Moreano Mesa' },
        ],
      },
      {
        name: 'Communication',
        notes: [
          { text: 'Client is interested in the integration of design partner in Slack as it resolves the issue of context switching with AI tools.', author: 'Dora Zhang' },
          { text: 'Implementing tools that facilitate better communication and collaboration between engineering and design teams can help streamline the design process and reduce dependency on design resources.', author: 'Sebastian Moreano Mesa' },
        ],
      },
      {
        name: 'Unblock handoff',
        notes: [
          { text: 'Wants Ruby to unblock engineers on asyn design request', author: 'Esther Pelaez' },
          { text: 'Client wants to use the code ruby generated to support engineering team.', author: 'Dora Zhang' },
          { text: 'Wants someone to handle quick design requests, unblock engineers, and act as a resource', author: 'Esther Pelaez' },
          { text: 'Engineering teams often require quick access to design resources for supplemental flows to maintain project momentum.', author: 'Sebastian Moreano Mesa' },
          { text: 'The problem client is facing is 1) prototyping to speed, 2) have the design ready, and 3) the gap between figma and actual output.', author: 'Dora Zhang' },
        ],
      },
    ],
  },
];
