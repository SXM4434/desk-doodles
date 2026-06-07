// Ion service blueprint — 4-tier Shostack classic synthesized from product narrative.
//
// Source: ion-case-study-outline-source.md §05 (Ruby Guardrails + Interaction Contract)
// + §06 (Ruby's Journey through Slack → Canvas → Workspace touchpoints).
// 4 tiers × 5 timeline touchpoints. Synthesized: yes — no canonical service-blueprint
// artifact exists in Ion source decks; this synthesizes the documented product
// narrative into Shostack's 4-tier framework. Marked `(synthesized blueprint)` in the
// artifact header.
//
// Tier separators carry Shostack's canonical names:
// - Line of Interaction (between Customer + Frontstage)
// - Line of Visibility (between Frontstage + Backstage)
// - Line of Internal Interaction (between Backstage + Support)
//
// Fail-point markers grounded in Ion's "clarify-before-execute" guardrail concept
// (case study §05) — moments where Ruby pauses + asks rather than executing on
// ambiguous input.

export type C4TierId = 'customer' | 'frontstage' | 'backstage' | 'support';

export type C4Tier = {
  id: C4TierId;
  label: string;
  shortLabel: string;
};

export type C4TouchpointId = 'slack' | 'open' | 'prompt' | 'generate' | 'handoff';

export type C4Touchpoint = {
  id: C4TouchpointId;
  label: string;
  stepNumber: string;
};

export type C4Cell = {
  tier: C4TierId;
  touchpoint: C4TouchpointId;
  text: string;
  failPoint?: string;       // optional fail-point annotation
};

export type C4Separator = {
  betweenAbove: C4TierId;
  betweenBelow: C4TierId;
  label: string;            // Shostack canonical separator name
};

export type C4Dataset = {
  source: string;
  synthesized: boolean;
  tiers: C4Tier[];
  touchpoints: C4Touchpoint[];
  cells: C4Cell[];
  separators: C4Separator[];
};

export const ION_SERVICE_BLUEPRINT: C4Dataset = {
  source: 'Synthesized · Ion product narrative mapped to Shostack 4-tier',
  synthesized: true,
  tiers: [
    { id: 'customer',   label: 'Designer (customer)',     shortLabel: 'Designer' },
    { id: 'frontstage', label: 'Ion UI (frontstage)',     shortLabel: 'Ion UI' },
    { id: 'backstage',  label: 'Ruby AI (backstage)',     shortLabel: 'Ruby AI' },
    { id: 'support',    label: 'Infra (support)',         shortLabel: 'Infra' },
  ],
  touchpoints: [
    { id: 'slack',    label: 'Slack request',     stepNumber: '01' },
    { id: 'open',     label: 'Open Ion',          stepNumber: '02' },
    { id: 'prompt',   label: 'Prompt on Canvas',  stepNumber: '03' },
    { id: 'generate', label: 'Ruby generates',    stepNumber: '04' },
    { id: 'handoff',  label: 'Workspace handoff', stepNumber: '05' },
  ],
  separators: [
    { betweenAbove: 'customer',   betweenBelow: 'frontstage', label: 'Line of interaction' },
    { betweenAbove: 'frontstage', betweenBelow: 'backstage',  label: 'Line of visibility' },
    { betweenAbove: 'backstage',  betweenBelow: 'support',    label: 'Line of internal interaction' },
  ],
  cells: [
    // Customer (designer)
    { tier: 'customer', touchpoint: 'slack',    text: '@ruby in channel · drops sketch + brief' },
    { tier: 'customer', touchpoint: 'open',     text: 'Clicks "Open in Canvas" from Slack reply' },
    {
      tier: 'customer', touchpoint: 'prompt',
      text: 'Selects element on canvas, types refinement prompt',
      failPoint: 'Ambiguous prompt → clarify-before-execute',
    },
    { tier: 'customer', touchpoint: 'generate', text: 'Reviews reply options · accepts or refines' },
    { tier: 'customer', touchpoint: 'handoff',  text: 'Locks spec via Workspace · hands to engineer' },

    // Frontstage (Ion UI)
    { tier: 'frontstage', touchpoint: 'slack',    text: 'Slack bot reply with quick option set' },
    { tier: 'frontstage', touchpoint: 'open',     text: 'Canvas opens with sketch + brief loaded' },
    { tier: 'frontstage', touchpoint: 'prompt',   text: 'Live cursor highlights selected element' },
    { tier: 'frontstage', touchpoint: 'generate', text: 'Reply panel renders 3–4 variations' },
    { tier: 'frontstage', touchpoint: 'handoff',  text: 'Workspace · property panels + layers (Figma-familiar)' },

    // Backstage (Ruby AI)
    { tier: 'backstage', touchpoint: 'slack',    text: 'Parses sketch + brief into design intent' },
    { tier: 'backstage', touchpoint: 'open',     text: 'Loads project context · prior decisions' },
    { tier: 'backstage', touchpoint: 'prompt',   text: 'Combines prompt + element + project context' },
    {
      tier: 'backstage', touchpoint: 'generate',
      text: 'Generates 3–4 variations · 6–12s typical',
      failPoint: 'Misinterprets context → returns clarifying question',
    },
    { tier: 'backstage', touchpoint: 'handoff',  text: 'Serializes versioned spec for Workspace' },

    // Support (infra)
    { tier: 'support', touchpoint: 'slack',    text: 'Slack webhook auth · workspace permissions' },
    { tier: 'support', touchpoint: 'open',     text: 'Session linking · Slack ↔ Canvas state' },
    { tier: 'support', touchpoint: 'prompt',   text: 'Vector-store retrieval for project context' },
    { tier: 'support', touchpoint: 'generate', text: 'Model API call · prompt-engineering layer' },
    { tier: 'support', touchpoint: 'handoff',  text: 'Versioned-doc storage · audit log' },
  ],
};

// ───────────────────────────────────────────────────────────────────────────
// Variant supplements
// ───────────────────────────────────────────────────────────────────────────

// Emotion-augmented (NN/g extension): one emotion eyebrow per touchpoint column.
// Derived rule (from Ion fail-points):
//   - any touchpoint with a fail-point in any tier → FRUSTRATING
//   - 'handoff' column (the closing/satisfying moment) → SATISFYING
//   - all others → NEUTRAL
// Restraint: caps eyebrow text only — never emoji glyphs.
export type C4EmotionLevel = 'FRUSTRATING' | 'NEUTRAL' | 'SATISFYING';

export const ION_C4_EMOTION_TRACK: Record<C4TouchpointId, C4EmotionLevel> = {
  slack:    'NEUTRAL',
  open:     'NEUTRAL',
  prompt:   'FRUSTRATING',   // ambiguous prompt → clarify-before-execute
  generate: 'FRUSTRATING',   // misinterprets context → returns clarifying question
  handoff:  'SATISFYING',    // closes the loop
};

// Physical-evidence row: tangible artifact per touchpoint (NN/g + Shostack 5-tier).
// Restrained text labels — never stock icons. Caps eyebrow register.
export const ION_C4_PHYSICAL_EVIDENCE: Record<C4TouchpointId, string> = {
  slack:    'Slack message',
  open:     'Browser tab',
  prompt:   'Canvas surface',
  generate: 'Reply panel',
  handoff:  'Workspace doc',
};
