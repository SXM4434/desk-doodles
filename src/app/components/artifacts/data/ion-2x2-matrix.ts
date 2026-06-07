// Ion 2x2 matrix — SYNTHESIZED Speed × Craft control positioning.
// Ion materials don't have an explicit 2x2 matrix. Items + positions are interpretation
// based on Ion's two personas (Workflow-focused / Creative Control Seekers) plus the
// competitive context Leyi/CoCreate identified (Figma, vibe-code tools).
// Marked synthesized per playground plan §4.

export type MatrixItem = {
  label: string;
  x: number; // 0..1 normalized — 0 = low on X axis, 1 = high
  y: number; // 0..1 normalized — 0 = low on Y axis, 1 = high
  weight?: number; // for weighted item-size variant; 1 = standard
  isFocal?: boolean; // highlighted item (Ion)
};

export type MatrixDataset = {
  source: string;
  synthesized: boolean;
  defaultAxisX: string;
  defaultAxisY: string;
  items: MatrixItem[];
};

export const ION_2X2_MATRIX: MatrixDataset = {
  source: 'Synthesized · Ion personas (Leyi) + competitive context (Figma / vibe-code tools)',
  synthesized: true,
  defaultAxisX: 'Speed',
  defaultAxisY: 'Craft control',
  items: [
    // Persona labels match the locked names from ion-case-study-outline-source.md §03
    // and Leyi case study §1: "Workflow-Focused" / "Creative Control Seekers".
    { label: 'Workflow-Focused', x: 0.78, y: 0.5, weight: 1.2 },
    { label: 'Creative Control Seekers', x: 0.5, y: 0.78, weight: 1.2 },
    { label: 'Figma', x: 0.4, y: 0.85, weight: 1.0 },
    { label: 'Vercel v0', x: 0.85, y: 0.45, weight: 1.0 },
    { label: 'Ion', x: 0.65, y: 0.65, weight: 1.4, isFocal: true },
  ],
};
