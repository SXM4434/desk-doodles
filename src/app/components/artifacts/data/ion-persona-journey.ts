// Ion persona-journey overlay dataset — synthesized · persona-mapped journey.
//
// Two personas (Workflow-Focused + Creative Control Seekers) overlaid on the
// Ion 5-step canonical workflow used by C1 funnel / C4 service blueprint /
// C5 storyboard / C3 user flow:
//   01 Slack request → 02 Open Ion → 03 Prompt on Canvas → 04 Ruby generates →
//   05 Workspace handoff.
//
// Per-step persona annotations and dropoff markers are grounded in
// `leyi-zhang-iondesign-case-study.md` §1 affinity-map post-its (the only
// place in the source materials where persona-specific behavior language
// appears). Where a marker would not be defensible from Leyi's quote evidence,
// it is omitted — never invented.
//
// Persona identifiers reuse the IDs from `ion-persona-traits.ts` so future
// cross-linking between E1 (trait visualization) and E2 (journey overlay)
// stays consistent.

export type PersonaId = 'workflow-focused' | 'creative-control';

export type PersonaSummary = {
  id: PersonaId;
  name: string;
  thesis: string;
};

export type JourneyStepId = 'slack' | 'open' | 'prompt' | 'generate' | 'handoff';

export type JourneyStep = {
  id: JourneyStepId;
  stepNumber: string;
  label: string;
  // True when Leyi's case study supports a friction divergence between the two
  // Ion personas at this step (the same 3 CCS-dropoff steps documented in C1
  // funnel / C4 service blueprint). False = personas converge at this step.
  // Used by the renderer's `pathOverlapVisibility` toggle as the explicit
  // divergence signal — replaces the older implicit dropoff-based heuristic
  // (which conflated "any persona has a dropoff here" with "personas diverge").
  divergent: boolean;
};

// Emotion register for the emotion-augmented variant. Three-tier scale derived
// from the existing dropoff data: cells with a dropoff = FRUSTRATED, cells
// flagged as turnkey acceptance/handoff = SATISFIED, everything else = NEUTRAL.
// Caps text only — never emoji-art (locked AI-smell trap).
export type PersonaEmotion = 'FRUSTRATED' | 'NEUTRAL' | 'SATISFIED';

export type PersonaCellAnnotation = {
  // Short eyebrow caps label rendered above the per-persona note in the cell.
  // Kept compact (≤22 chars) to fit under the marker pill.
  eyebrow: string;
  // The per-persona description of how that persona experiences this step.
  body: string;
  // Per-persona emotion for the emotion-augmented variant (NN/g extension).
  // Required so the variant renders without ad-hoc derivation in the component.
  emotion: PersonaEmotion;
  // Optional dropoff/friction marker — surfaced ONLY where Leyi's case study
  // quote evidence supports it. `eyebrow` is the caps-eyebrow line; `body`
  // explains the friction; `source` cites the post-it author.
  dropoff?: {
    eyebrow: string;
    body: string;
    source: string;
  };
};

export type PersonaJourneyDataset = {
  source: string;
  personas: PersonaSummary[];
  steps: JourneyStep[];
  // cells[personaId][stepId] = annotation. Map shape avoids tuple lookup
  // gymnastics in the renderer.
  cells: Record<PersonaId, Record<JourneyStepId, PersonaCellAnnotation>>;
};

export const ION_PERSONA_JOURNEY: PersonaJourneyDataset = {
  source: 'Leyi case study §1 affinity map — Workflow-Focused (Florence Chow / Esther Pelaez quotes) + Creative Control Seekers (Esther Pelaez / Dora Zhang / Amenze Sholanke quotes). Step labels match C1 / C4 / C5 timeline.',
  personas: [
    {
      id: 'workflow-focused',
      name: 'Workflow-Focused',
      thesis: 'Speed & efficiency.',
    },
    {
      id: 'creative-control',
      name: 'Creative Control Seekers',
      thesis: 'Creativity, control & craft.',
    },
  ],
  // `divergent` flagged true at the 3 CCS-dropoff steps Leyi's case study
  // supports as friction divergences (Slack request → context-load gap;
  // Prompt on Canvas → critique-vs-create register clash; Ruby generates →
  // execution gap, 90% prefer to edit). False at Open Ion + Workspace handoff
  // where both personas converge.
  steps: [
    { id: 'slack',    stepNumber: '01', label: 'Slack request',     divergent: true  },
    { id: 'open',     stepNumber: '02', label: 'Open Ion',           divergent: false },
    { id: 'prompt',   stepNumber: '03', label: 'Prompt on Canvas',   divergent: true  },
    { id: 'generate', stepNumber: '04', label: 'Ruby generates',     divergent: true  },
    { id: 'handoff',  stepNumber: '05', label: 'Workspace handoff',  divergent: false },
  ],
  cells: {
    'workflow-focused': {
      slack: {
        eyebrow: 'Entry · in-thread',
        body: 'Files a quick design request from the Slack channel without leaving the conversation.',
        emotion: 'SATISFIED',
      },
      open: {
        eyebrow: 'Comfortable handoff',
        body: 'Hands the request to Ruby and steps away — expects a turnkey response.',
        emotion: 'SATISFIED',
      },
      prompt: {
        eyebrow: 'Minimal prompt',
        body: 'Short prompt; trusts Ruby to validate decisions and close the loop.',
        emotion: 'NEUTRAL',
      },
      generate: {
        eyebrow: 'First good = good',
        body: 'Accepts the first directionally-right variation; treats Ruby as a validator, not a critic.',
        emotion: 'SATISFIED',
      },
      handoff: {
        eyebrow: 'Unblock engineers',
        body: 'Wants Ruby to deliver code/output that unblocks engineering on async design requests.',
        emotion: 'SATISFIED',
      },
    },
    'creative-control': {
      slack: {
        eyebrow: 'Entry · with context',
        body: 'Brings PRD + persona context; the request itself is rarely the work — review is.',
        emotion: 'FRUSTRATED',
        dropoff: {
          eyebrow: 'Friction · context-load',
          body: 'Wants Ruby to enter with the same context she has (PRD + personas) before any output begins.',
          source: 'Esther Pelaez',
        },
      },
      open: {
        eyebrow: 'Reviews, then steers',
        body: 'Opens Ion to critique an existing flow rather than generate from zero.',
        emotion: 'NEUTRAL',
      },
      prompt: {
        eyebrow: 'Critique, not create',
        body: 'Prompt frames Ruby as critic of existing designs — flows critiqued through Figma.',
        emotion: 'FRUSTRATED',
        dropoff: {
          eyebrow: 'Friction · prompt-fit',
          body: 'Text-prompt register fights accuracy when the actual task is review of something already designed.',
          source: 'Esther Pelaez',
        },
      },
      generate: {
        eyebrow: 'Reviews all variants',
        body: 'Reviews multiple variations before accepting; expects explicit hand-off points to steer.',
        emotion: 'FRUSTRATED',
        dropoff: {
          eyebrow: 'Friction · execution gap',
          body: 'Drop-offs caused by gap between users\' vision and Ruby\'s actual output (90% prefer to edit).',
          source: 'Leyi case study §Block 2',
        },
      },
      handoff: {
        eyebrow: 'Final touches kept',
        body: 'Switches to the design workspace for final fine-tuning before shipping — keeps authorship.',
        emotion: 'SATISFIED',
      },
    },
  },
};
