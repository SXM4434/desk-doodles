import React, { createContext, useContext, useState } from 'react';

// §02 artifact treatment toggle — 3 variants for visual A/B exploration 2026-05-24.
//
//   'native'         — current treatment. Hand-drawn rough-oval annotation marks
//                      (rough.js / handFeel) on raw screenshot, --dir-recessed inner
//                      bg, no outer wrapper, no eyebrow above. Per Shestopalov
//                      "annotated old-UI" precedent (Tip #7) + Ion hand-feel family
//                      (matches §04 Venn + §03 hand-feel artifacts). Caption below
//                      with numbered quote pairs.
//
//   'raised-wrapper' — hybrid: keep hand-drawn marks unchanged, ADD outer raised
//                      surface (--dir-raised + 1px border + locked borderRadius +
//                      padding) + CAPS 10 eyebrow above ("OLD ION · IN-SESSION").
//                      Matches §04 Venn / §05 Funnel / §06 closer artifact wrapper
//                      treatment + cross-section CAPS-eyebrow-above-content pattern.
//                      Conflates research-observation pattern with synthesis-artifact
//                      pattern (per `feedback_case_study_artifact_treatment` analysis)
//                      — explore to evaluate.
//
//   'leader-lines'   — Rachel Chen pattern. Raised outer surface + CAPS eyebrow.
//                      Clean RECTANGULAR numbered markers (no hand-feel) on image.
//                      Labeled callouts BELOW image with bold labels + descriptive
//                      text (simulates Rachel's leader-line callout look without
//                      requiring SVG leader-line layout). Drops the hand-feel
//                      annotation family for this section in favor of cleaner
//                      technical annotation register.
//
// Default = 'native' per `feedback_native_first_then_variants` discipline. The
// other two are exploratory variants until user picks production.
//
// Production-pick decision deferred — once user reviews all 3 at localhost, the
// production pick gets locked into CSML §02 (or stays as toggle for ongoing A/B).
export type GateAIonS02ArtifactTreatment = 'native' | 'raised-wrapper' | 'leader-lines';

type ContextValue = {
  state: GateAIonS02ArtifactTreatment;
  setState: (v: GateAIonS02ArtifactTreatment) => void;
};

const GateAIonS02ArtifactTreatmentContext = createContext<ContextValue>({
  state: 'native',
  setState: () => {},
});

export function GateAIonS02ArtifactTreatmentProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GateAIonS02ArtifactTreatment>('native');
  return (
    <GateAIonS02ArtifactTreatmentContext.Provider value={{ state, setState }}>
      {children}
    </GateAIonS02ArtifactTreatmentContext.Provider>
  );
}

export function useGateAIonS02ArtifactTreatment() {
  return useContext(GateAIonS02ArtifactTreatmentContext);
}
