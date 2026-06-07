// Ion persona-trait spectrums — primary anchor grounded in Leyi's case study.
//
// Source: leyi-zhang-iondesign-case-study.md §1 — "Defining our target user:
// the tradeoff between empowering creativity vs. speeding automation." The two
// personas (Workflow-Focused / Creative Control Seekers) sit at opposite ends
// of this canonical Ion tradeoff.
//
// Secondary spectrums (Trust in AI, Process control) are DERIVED from the same
// research themes (creativity / control / craft language for CCS; speed /
// efficiency / automation language for W-F). Marked synthesized: derived =
// true so the visualization can flag them visibly.

export type PersonaId = 'workflow-focused' | 'creative-control';

export type Persona = {
  id: PersonaId;
  name: string;
  thesis: string;
};

export type TraitSpectrum = {
  id: string;
  // Trait dimension name shown as caps eyebrow (e.g. "PRIMARY DRIVER").
  axisName: string;
  // Endpoint labels — caps micro-labels at left / right ends of the axis.
  leftLabel: string;
  rightLabel: string;
  // Source caption rendered under the spectrum.
  source: string;
  derived: boolean;            // false = direct Ion source quote / heading; true = derived from themes
  // Persona positions on this spectrum, expressed as 0..100 (left = 0, right = 100).
  positions: Record<PersonaId, number>;
  // Short annotation under each persona marker, grounded in research where possible.
  annotations: Record<PersonaId, string>;
};

export type IonPersonaTraitDataset = {
  source: string;
  personas: Persona[];
  spectrums: TraitSpectrum[];
};

export const ION_PERSONA_TRAITS: IonPersonaTraitDataset = {
  source: 'Leyi case study §1 (primary) · Demo Day affinity quotes (secondary, derived)',
  personas: [
    {
      id: 'workflow-focused',
      name: 'Workflow-Focused',
      thesis: 'Values speed & efficiency.',
    },
    {
      id: 'creative-control',
      name: 'Creative Control Seekers',
      thesis: 'Values creativity, control & craft.',
    },
  ],
  spectrums: [
    {
      id: 'primary-driver',
      axisName: 'Primary driver',
      leftLabel: 'Speeding automation',
      rightLabel: 'Empowering creativity',
      source: 'Leyi case study §1 — "the tradeoff between empowering creativity vs. speeding automation"',
      derived: false,
      positions: { 'workflow-focused': 16, 'creative-control': 84 },
      annotations: {
        'workflow-focused': 'Wants Ruby to validate decisions and speed up the workflow (Florence Chow).',
        'creative-control': 'Wants Ruby to review existing designs with PRD + persona context (Esther Pelaez).',
      },
    },
    {
      id: 'process-control',
      axisName: 'Process control',
      // Behavioral relabel 2026-05-17: "AI-led / Designer-led" → "Hands-off / Hands-on".
      // Same underlying derived axis from Leyi affinity sort; the new labels read as
      // observable designer behavior rather than abstract orientation, shortening the
      // bridge from chart position → inferred theme without changing source semantic.
      leftLabel: 'Hands-off',
      rightLabel: 'Hands-on',
      source: 'Derived from "creative control" framing throughout Leyi case study + CoCreate deck',
      derived: true,
      positions: { 'workflow-focused': 28, 'creative-control': 78 },
      annotations: {
        'workflow-focused': 'Comfortable letting Ruby drive flow end-to-end when output is good enough.',
        'creative-control': 'Wants explicit hand-off points; reviews and steers each step.',
      },
    },
    {
      id: 'trust-in-output',
      axisName: 'Trust in AI output',
      leftLabel: 'Skeptical',
      rightLabel: 'Trusting',
      source: 'Derived from quote evidence — W-F treats Ruby as validator, CCS as critic',
      derived: true,
      positions: { 'workflow-focused': 70, 'creative-control': 36 },
      annotations: {
        'workflow-focused': 'Trusts Ruby for unblocking handoff and quick design requests.',
        'creative-control': 'Trusts Ruby less; uses it to surface alternatives, not commit to them.',
      },
    },
  ],
};
