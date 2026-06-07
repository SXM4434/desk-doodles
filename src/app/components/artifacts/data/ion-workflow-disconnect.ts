// Ion Demo Day "Workflow disconnect" — partial source verbatim, partial interpretation.
//
// Source verbatim (from source-materials/ion-deck-demo-day.md L143):
//   - Section title: "Workflow disconnect"
//   - Paired with sibling challenge: "Usage of specialized tools"
//   - Both rendered as a "Challenges for users" two-up
//
// Interpretation (NOT verbatim — marked illustrative per feedback_research_first_no_fake_provenance):
//   - Sparkle icon (Ion as glyph)
//   - Curved arrow
//   - Caption text framing the disconnect
//
// The visual register (icon + arrow + caption) is per playground research doc D2 spec.
// The exact caption text below is synthesized as a faithful interpretation of the deck's
// "challenges for users" framing — NOT lifted verbatim.

export type WorkflowDisconnectDataset = {
  source: string;
  synthesized: boolean; // true: visual rendering is interpretation, not direct source
  eyebrow: string; // verbatim section title
  pairedChallenge: string; // verbatim sibling challenge
  iconLabel: string;
  workflowLabel: string;
  caption: string;
};

export const ION_WORKFLOW_DISCONNECT: WorkflowDisconnectDataset = {
  source: 'Demo Day deck · Slide L143 (challenges for users)',
  synthesized: true,
  eyebrow: 'Workflow disconnect',
  pairedChallenge: 'Usage of specialized tools',
  iconLabel: 'Ion',
  workflowLabel: 'Established workflow',
  caption:
    "Ion sits outside the user's established workflow — a separate specialized tool, not integrated into how they already work.",
};
