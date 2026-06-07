// Ion storyboard — synthesized 6-panel scenario.
//
// Source: ion-case-study-outline-source.md §06 (Ruby's Journey across Slack →
// Canvas → Workspace touchpoints) + §05 (Reframe / clarify-before-execute) +
// §02-04 (problem / discovery / deeper issue framing).
//
// 6 panels in three-act arc (NN/g UX-portfolio canon):
//  1. Founder messages  — Slack request lands (vague brief)
//  2. Designer opens     — Click "Open in Canvas" handoff
//  3. Prompt on Canvas   — Element selected, refinement prompt typed
//  4. Ruby generates     — 3–4 variations rendered
//  5. Iterate via panels — Workspace property panels + layers
//  6. Engineer ships     — Locked spec → versioned handoff
//
// Synthesized: yes — no canonical 6-panel storyboard exists in Ion source decks;
// this synthesizes the documented Ruby's Journey into a UX-storyboard frame
// per the playground plan + research recommendations.
//
// Each panel carries a typographic register (no cartoon characters per AI-smell
// trap list in the research doc). Two registers available:
// - 'editorial' — primary text inside the frame (e.g., "@ruby" with channel)
// - 'glyph'     — single restrained mark (Slack bot mark, canvas grid, etc.)

export type C5Register = 'editorial' | 'glyph';

export type C5Panel = {
  step: string;          // "01"–"06"
  title: string;         // panel title (under-frame caption)
  caption: string;       // sub-caption / scenario fragment
  register: C5Register;
  // Editorial register fields
  primaryText?: string;  // large editorial-typographic primary (e.g., "@ruby")
  secondaryText?: string;
  metaText?: string;     // small caps line inside the frame
  // Glyph register fields
  glyph?: string;        // single restrained mark (text glyph)
  glyphLabel?: string;   // small caps label under glyph
};

export type C5Dataset = {
  source: string;
  synthesized: boolean;
  scenarioCaption: string;
  panels: C5Panel[];
};

// Director's-note annotations per panel — used by the `annotated-frames`
// variant only. Each entry has a small caps label + a one-line note in the
// editorial info-design register (Holmes / Wired marginalia lineage). Keyed
// by panel.step so the variant can look up notes without modifying core
// panel data. Synthesized from the Ion narrative threads (Slack handoff,
// Canvas prompt grammar, Workspace property panels, versioned spec).
export type C5Annotation = {
  label: string;
  note: string;
};

export const ION_STORYBOARD_ANNOTATIONS: Record<string, C5Annotation[]> = {
  '01': [
    { label: 'Surface', note: 'Slack — #design channel, async start' },
    { label: 'Tone', note: 'Vague brief — no spec, no examples' },
    { label: 'Risk', note: 'Designer would normally guess intent' },
  ],
  '02': [
    { label: 'Action', note: 'One-click handoff from Slack reply' },
    { label: 'Continuity', note: 'Brief context carries to Canvas' },
    { label: 'Cost', note: 'Zero re-stating of the request' },
  ],
  '03': [
    { label: 'Surface', note: 'Infinite Canvas — element selected' },
    { label: 'Grammar', note: 'Verb + scope (refine + spacing)' },
    { label: 'Discipline', note: 'Clarify-before-execute, not auto-pilot' },
  ],
  '04': [
    { label: 'Output', note: '3–4 variants rendered in 6–12s' },
    { label: 'Layout', note: 'Side-by-side frames, no auto-winner' },
    { label: 'Decision', note: 'Designer judges, Ruby proposes' },
  ],
  '05': [
    { label: 'Surface', note: 'Workspace — property panel + layers' },
    { label: 'Edits', note: 'Spacing, color, type — token-bound' },
    { label: 'Trace', note: 'Every tweak captured for handoff' },
  ],
  '06': [
    { label: 'Output', note: 'Versioned spec — tokens + spacing + comp' },
    { label: 'Audience', note: 'Engineer reviews with full context' },
    { label: 'Loop', note: 'No re-spec, no drift' },
  ],
};

export const ION_STORYBOARD: C5Dataset = {
  source: 'Synthesized · Ion product narrative mapped to 6-panel UX storyboard',
  synthesized: true,
  scenarioCaption:
    'Designer-using-Ion scenario across Slack entry → Canvas exploration → Workspace handoff. Synthesized from Ruby\'s Journey (§06) — no canonical 6-panel artifact exists in Ion source decks.',
  panels: [
    {
      step: '01',
      title: 'Founder messages',
      caption: '@ruby — request lands with sketch or screenshot attached',
      register: 'editorial',
      primaryText: '@ruby',
      // Grounded in OG §06 Step 1: "Trigger @ruby in any channel, drop in a sketch
      // or screenshot, and get options back." The user attaches a sketch + brief
      // line — Ion's Slack-first entry point catches the request where the team
      // already works.
      secondaryText: 'sketch + brief — open in Canvas',
      metaText: '#design · slack entry',
    },
    {
      step: '02',
      title: 'Designer opens Ion',
      caption: 'Click "Open in Canvas" from Slack reply',
      register: 'glyph',
      glyph: '↗',
      glyphLabel: 'Open in Canvas',
    },
    {
      step: '03',
      title: 'Prompt on Canvas',
      caption: 'Select element · type refinement prompt',
      register: 'editorial',
      primaryText: 'Refine spacing',
      secondaryText: 'on selected hero block',
      metaText: 'canvas · live cursor',
    },
    {
      step: '04',
      title: 'Ruby generates',
      caption: '3–4 variations rendered · 6–12s typical',
      register: 'glyph',
      glyph: '▦',
      glyphLabel: '3–4 variants',
    },
    {
      step: '05',
      title: 'Iterate via panels',
      caption: 'Workspace · property panels + layers',
      register: 'editorial',
      // Grounded in Demo Day Property Panel artifact (Typography section):
      // Font: Inter / Bold / 16px / Line height 16px / Letter spacing 16px.
      // Picking Typography as the panel section label since OG §06 Step 3 calls
      // out "property controls, layer hierarchy, keyboard shortcuts" and the
      // Demo Day deck spec leads with the Typography section.
      primaryText: 'Typography · 16',
      secondaryText: 'Inter · bold · spacing token',
      metaText: 'workspace · property panel',
    },
    {
      step: '06',
      title: 'Engineer ships',
      caption: 'Locked spec → handoff with versioned context',
      register: 'glyph',
      glyph: '✓',
      glyphLabel: 'Versioned spec',
    },
  ],
};
