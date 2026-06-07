// Ion Venn datasets — verbatim from source materials, plus one synthesized 4-tool variant.
// Sources:
//   - Leyi product-pivot Venn: source-materials/leyi-zhang-iondesign-case-study.md (L104-L110)
//     + visual reference at source-materials/artifact-references/leyi-venn-product-pivot.png
//   - CoCreate Ion-positioning Venn: source-materials/ion-deck-cocreate-long.md (L207-L221)
//   - Synthesized 4-tool: NOT real Ion data — illustrative for the 4-circle variant only;
//     marked via dataset.synthesized flag so the chrome / render can surface it.

export type VennCircle = {
  label: string;
  subtitle?: string;
};

export type VennDataset = {
  id: 'leyi' | 'cocreate' | 'synthesized-4';
  name: string;
  source: string;
  synthesized: boolean;
  circles: VennCircle[]; // 3 entries for Ion variants, 4 for synthesized
  centerLabel: string;
  centerSubtitle?: string;
  iconGlyph: string;
  annotationText: string;
  bodyContext?: string;
};

export const ION_VENN_LEYI: VennDataset = {
  id: 'leyi',
  name: 'Leyi · Product pivot',
  source: 'Leyi Zhang case study',
  synthesized: false,
  circles: [
    { label: 'Design tools', subtitle: 'Figma, Sketch' },
    { label: 'Vibe code', subtitle: 'Bolt.new, Lovable' },
    { label: 'UI Dev tools', subtitle: 'Claude code, storybook' },
  ],
  centerLabel: 'Product pivot',
  centerSubtitle: 'Bridging design, production, and AI-assisted workflow',
  iconGlyph: '✦',
  annotationText: 'Product pivot — Bridging design, production, and AI-assisted workflow',
};

export const ION_VENN_COCREATE: VennDataset = {
  id: 'cocreate',
  name: 'CoCreate · Ion is here',
  source: 'CoCreate long deck',
  synthesized: false,
  // Restructured 2026-05-20 to LEYI's info-rhythm: labels = CATEGORIES (Design tools / Code editors / AI assistants), subtitles = TOOL EXAMPLES within each category. Original CoCreate-deck labels (Figma / Code Editors / ChatGPT-Claude) were specific TOOLS, not categories — user feedback: "figma and claude/chatgpt are tools not category names." This restructure preserves the CoCreate dataset identity (3-tool-categories Venn) while using on-spec category semantics. `centerSubtitle` added so the "Ion is here" annotation gets a descriptive sub-line (mirrors LEYI's "Product pivot / Bridging design, production, and AI-assisted workflow" pattern).
  // Subtitles trimmed from 3 → 2 tool examples 2026-05-20 to fit lune width. At IS 11 with
  // 3 tools the subtitle was ~160px wide, overlapping each circle's outer arc at the
  // block's lateral extremes. 2 tools = ~100-110px subtitle, breathing room restored.
  circles: [
    { label: 'Design tools', subtitle: 'Figma, Sketch' },
    { label: 'Code editors', subtitle: 'Cursor, VS Code' },
    { label: 'AI assistants', subtitle: 'ChatGPT, Claude' },
  ],
  centerLabel: 'Ion is here',
  centerSubtitle: 'Bridging design, build, and AI assistance',
  iconGlyph: '✦',
  annotationText: 'Ion is here',
  bodyContext:
    'As an independent tool, Ion currently situated between a dedicated design tool, and an engineering handoff tool — and it didn\'t make sense in people\'s workflow.',
};

export const ION_VENN_SYNTHESIZED_4: VennDataset = {
  id: 'synthesized-4',
  name: 'Synthesized · 4-tool landscape',
  source: 'Synthesized — illustrative only',
  synthesized: true,
  circles: [
    { label: 'Figma' },
    { label: 'Code Editors' },
    { label: 'ChatGPT / Claude' },
    { label: 'Vibe code', subtitle: 'Bolt.new, Lovable' },
  ],
  centerLabel: 'Ion is here',
  iconGlyph: '✦',
  annotationText: 'Ion is here',
};
