export type ProofStat = {
  value: string;
  label: string;
  sub?: string;
};

// One named asset variant inside a project's media pool. `id` is the free-form
// key surfaces pass to Media via `variant`; Media's best-fit resolver falls
// through to the primary asset when an id is missing.
export type ProjectAsset = {
  id: string;
  path: string;
  label: string;
  aspect: string;
  mediaClass: 'hero' | 'detail' | 'mobile';
};

export type Project = {
  id: string;
  label: string;
  labelMeta?: string;
  typeTag: string;
  title: string;
  framingFull: string;
  framingCompressed: string;
  framingEditorial: string;
  tags: string[];
  proof: ProofStat[];
  ctaPrimary: string;
  ctaSecondary?: string;
  status: 'Shipped' | 'In progress' | 'Archived';
  realAssetPath?: string;
  realAssetLabel: string;
  aspect: string;
  assets: ProjectAsset[];
};

// Ion carries real content; the other four entries use honest placeholder
// framings (marked PLACEHOLDER) so no fabricated outcomes leak into first-read
// judgment. Media assets are real proxy screenshots from the Media System Lab.
export const projects: Project[] = [
  {
    id: 'ion',
    label: 'Ion Design',
    labelMeta: 'YC W24',
    typeTag: 'Design Tool',
    title: 'Reducing context loss from conversation to production',
    framingFull:
      'Launched Ruby as a Slack-first entry that continues through Ion\u2019s canvas, using clarify-before-execution while building the editor foundations for precise control — without changing the team\u2019s stack.',
    framingCompressed:
      'Moved AI to the start of the design funnel. Shipped Slack + Canvas. Built Ruby\u2019s trust + control contract without changing the team\u2019s stack.',
    framingEditorial:
      'Slack-first AI entry that continues through the Ion canvas — clarify before execution, precise control after.',
    tags: ['B2B SaaS', 'Multimodal', 'Prototyping', 'Design Systems'],
    proof: [
      { value: '2', label: 'shipped surfaces', sub: 'Slack + Canvas' },
      { value: '5', label: 'Ruby guardrails', sub: 'trust + control' },
    ],
    ctaPrimary: 'View case study',
    ctaSecondary: 'Try Ion',
    status: 'Shipped',
    realAssetPath: '/proxy-assets/ion/canvas-version-branching.png',
    realAssetLabel: 'Ion \u00b7 Canvas',
    aspect: '16 / 9',
    assets: [
      {
        id: 'hero',
        path: '/proxy-assets/ion/canvas-version-branching.png',
        label: 'Canvas \u00b7 version branching',
        aspect: '16 / 9',
        mediaClass: 'hero',
      },
      {
        id: 'workspace',
        path: '/proxy-assets/ion/workspace-product-grid.png',
        label: 'Workspace \u00b7 product grid',
        aspect: '16 / 9',
        mediaClass: 'hero',
      },
      {
        id: 'editor',
        path: '/proxy-assets/ion/workspace-selected-edit.png',
        label: 'Workspace \u00b7 selected edit',
        aspect: '16 / 9',
        mediaClass: 'detail',
      },
    ],
  },
  {
    id: 'elara',
    label: 'Elara',
    labelMeta: 'PLACEHOLDER',
    typeTag: 'Product Design',
    title: 'Project framing TBD',
    framingFull:
      'Placeholder framing. Full project context to be written before Gate A hiring-facing review.',
    framingCompressed:
      'Placeholder framing. Project context TBD.',
    framingEditorial:
      'Placeholder framing. Editorial register TBD.',
    tags: ['Consumer', 'Placeholder'],
    proof: [
      { value: '\u2014', label: 'metric TBD' },
      { value: '\u2014', label: 'metric TBD' },
    ],
    ctaPrimary: 'View case study',
    ctaSecondary: 'See process',
    status: 'In progress',
    realAssetPath: '/proxy-assets/elara/getting-started-desktop.png',
    realAssetLabel: 'Elara \u00b7 Getting started',
    aspect: '16 / 9',
    assets: [
      {
        id: 'hero',
        path: '/proxy-assets/elara/getting-started-desktop.png',
        label: 'Getting started \u00b7 desktop',
        aspect: '16 / 9',
        mediaClass: 'hero',
      },
      {
        id: 'checklist',
        path: '/proxy-assets/elara/checklist-upload-desktop.png',
        label: 'Checklist upload \u00b7 desktop',
        aspect: '16 / 9',
        mediaClass: 'hero',
      },
      {
        id: 'mobile',
        path: '/proxy-assets/elara/checklist-upload-mobile.png',
        label: 'Checklist upload \u00b7 mobile',
        aspect: '3 / 4',
        mediaClass: 'mobile',
      },
    ],
  },
  {
    id: 'canopi',
    label: 'Canopi',
    labelMeta: 'PLACEHOLDER',
    typeTag: 'Platform',
    title: 'Project framing TBD',
    framingFull:
      'Placeholder framing. Full project context to be written before Gate A hiring-facing review.',
    framingCompressed:
      'Placeholder framing. Project context TBD.',
    framingEditorial:
      'Placeholder framing. Editorial register TBD.',
    tags: ['Climate', 'Placeholder'],
    proof: [
      { value: '\u2014', label: 'metric TBD' },
      { value: '\u2014', label: 'metric TBD' },
    ],
    ctaPrimary: 'View case study',
    status: 'Shipped',
    realAssetPath: '/proxy-assets/canopi/verifications-hub.png',
    realAssetLabel: 'Canopi \u00b7 Verifications hub',
    aspect: '16 / 9',
    assets: [
      {
        id: 'hero',
        path: '/proxy-assets/canopi/verifications-hub.png',
        label: 'Verifications hub',
        aspect: '16 / 9',
        mediaClass: 'hero',
      },
      {
        id: 'template',
        path: '/proxy-assets/canopi/job-template-detail.png',
        label: 'Job template detail',
        aspect: '16 / 9',
        mediaClass: 'detail',
      },
      {
        id: 'evidence',
        path: '/proxy-assets/canopi/evidence-compare-modal.png',
        label: 'Evidence compare modal',
        aspect: '16 / 9',
        mediaClass: 'detail',
      },
    ],
  },
  {
    id: 'iyna',
    label: 'IYNA',
    labelMeta: 'PLACEHOLDER',
    typeTag: 'Editorial',
    title: 'Project framing TBD',
    framingFull:
      'Placeholder framing. Full project context to be written before Gate A hiring-facing review.',
    framingCompressed:
      'Placeholder framing. Project context TBD.',
    framingEditorial:
      'Placeholder framing. Editorial register TBD.',
    tags: ['Nonprofit', 'Placeholder'],
    proof: [
      { value: '\u2014', label: 'metric TBD' },
      { value: '\u2014', label: 'metric TBD' },
    ],
    ctaPrimary: 'View case study',
    status: 'Archived',
    realAssetPath: '/proxy-assets/iyna/member-dashboard-desktop.png',
    realAssetLabel: 'IYNA \u00b7 Member dashboard',
    aspect: '16 / 9',
    assets: [
      {
        id: 'hero',
        path: '/proxy-assets/iyna/member-dashboard-desktop.png',
        label: 'Member dashboard \u00b7 desktop',
        aspect: '16 / 9',
        mediaClass: 'hero',
      },
      {
        id: 'rankings',
        path: '/proxy-assets/iyna/rankings-desktop.png',
        label: 'Rankings \u00b7 desktop',
        aspect: '16 / 9',
        mediaClass: 'hero',
      },
      {
        id: 'mobile',
        path: '/proxy-assets/iyna/rankings-mobile.png',
        label: 'Rankings \u00b7 mobile',
        aspect: '3 / 4',
        mediaClass: 'mobile',
      },
    ],
  },
  {
    id: 'gardens',
    label: 'GARDENS',
    labelMeta: 'PLACEHOLDER',
    typeTag: 'Exploration',
    title: 'Project framing TBD',
    framingFull:
      'Placeholder framing. Full project context to be written before Gate A hiring-facing review.',
    framingCompressed:
      'Placeholder framing. Project context TBD.',
    framingEditorial:
      'Placeholder framing. Editorial register TBD.',
    tags: ['Research', 'Placeholder'],
    proof: [
      { value: '\u2014', label: 'metric TBD' },
      { value: '\u2014', label: 'metric TBD' },
    ],
    ctaPrimary: 'View case study',
    status: 'In progress',
    realAssetPath: '/proxy-assets/gardens/single-mission-screen.png',
    realAssetLabel: 'GARDENS \u00b7 Mission screen',
    aspect: '16 / 9',
    assets: [
      {
        id: 'hero',
        path: '/proxy-assets/gardens/single-mission-screen.png',
        label: 'Single mission screen',
        aspect: '16 / 9',
        mediaClass: 'hero',
      },
      {
        id: 'log',
        path: '/proxy-assets/gardens/mission-log.png',
        label: 'Mission log',
        aspect: '16 / 9',
        mediaClass: 'detail',
      },
      {
        id: 'play',
        path: '/proxy-assets/gardens/click-to-play.png',
        label: 'Click to play',
        aspect: '16 / 9',
        mediaClass: 'detail',
      },
    ],
  },
];

export const primaryProject = projects[0];
export const supportProjects = projects.slice(1);
