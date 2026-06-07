// Ion competitive landscape — SYNTHESIZED a16z-style cluster constellation.
// Categories + items derived from Leyi/CoCreate Venn context (Design tools / Vibe code /
// UI Dev tools / AI assistants). Ion materials don't have an explicit competitive
// landscape map; this is interpretation. Marked synthesized per playground plan §4.

export type LandscapeItem = {
  name: string;
  isFocal?: boolean;
};

export type LandscapeCluster = {
  name: string;
  items: LandscapeItem[];
};

export type LandscapeDataset = {
  source: string;
  synthesized: boolean;
  clusters: LandscapeCluster[];
  focalItem: LandscapeItem;
  focalThesis: string; // what role Ion plays vs the clusters
};

export const ION_COMPETITIVE_LANDSCAPE: LandscapeDataset = {
  source: 'Synthesized · Leyi/CoCreate Venn categories + a16z market-map register',
  synthesized: true,
  clusters: [
    {
      name: 'Design tools',
      items: [{ name: 'Figma' }, { name: 'Sketch' }, { name: 'Storybook' }],
    },
    {
      name: 'Vibe code',
      items: [{ name: 'Bolt.new' }, { name: 'Lovable' }, { name: 'Vercel v0' }],
    },
    {
      name: 'AI assistant',
      items: [{ name: 'ChatGPT' }, { name: 'Claude' }, { name: 'Cursor' }],
    },
  ],
  focalItem: { name: 'Ion', isFocal: true },
  focalThesis: 'Bridges design intent + production output + AI assistance — not fully in any single category',
};
