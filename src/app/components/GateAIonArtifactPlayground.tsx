import React from 'react';
import { IS, ISe } from './cards/tokens';
import {
  useGateAIonArtifactPlayground,
  ARTIFACT_LABELS,
} from '../state/GateAIonArtifactPlaygroundContext';
import { A1AffinityMap } from './artifacts/A1AffinityMap';
import { B1VennPositioning } from './artifacts/B1VennPositioning';
import { C1Funnel } from './artifacts/C1Funnel';
import { C2PhaseFriction } from './artifacts/C2PhaseFriction';
import { D1WavySpectrum } from './artifacts/D1WavySpectrum';
import { D2WorkflowDisconnect } from './artifacts/D2WorkflowDisconnect';
import { A2EmpathyMap } from './artifacts/A2EmpathyMap';
import { A4MentalModel } from './artifacts/A4MentalModel';
import { B22x2Matrix } from './artifacts/B22x2Matrix';
import { B3CompetitiveLandscape } from './artifacts/B3CompetitiveLandscape';
import { B4ConceptMap } from './artifacts/B4ConceptMap';
import { C3UserFlow } from './artifacts/C3UserFlow';
import { E1PersonaTraitVisualization } from './artifacts/E1PersonaTraitVisualization';
import { C4ServiceBlueprint } from './artifacts/C4ServiceBlueprint';
import { C5Storyboard } from './artifacts/C5Storyboard';
import { E2PersonaJourneyOverlay } from './artifacts/E2PersonaJourneyOverlay';

// Page shell — system adherence:
// - Typography: locked ladder per typography-system.md §B (10·11·13·15·18·22·32·52,
//   exceptions 12 + 28). h1 = 32 ISe 400 (Editorial Intro Heading); body = 13 IS 300
//   (Dense Body); content placeholder display ink = 18 IS 600 (Supporting/Sub-heading).
// - Spacing: locked tokens per spacing-layout-rhythm.md §A (4·8·12·16·24·32·48·64·80·96·128).
//   Page padding = 48 (Section); maxWidth = 1280 (Wide per Width Map §B); section gap = 48.
// - Color: W1 tokens only (color-system-w1.md §B).

// Artifact Playground page shell — Step 3 per gate-a-ion-artifact-playground-plan.md §10.
// Page body only — NO local toolbar. All toggles live in LabShell chrome per the lab-wide
// rule that all toggles belong in chrome (NarrowPass4 context pattern). The Artifact
// dropdown + Variant/Customize placeholders render in the LabShell toolbar when mode is
// 'artifact-playground'. State is hoisted into GateAIonArtifactPlaygroundContext so the
// chrome (writes) and the page (reads) share one source.
//
// Step 4 will populate the 18 artifact components in components/artifacts/.

export function GateAIonArtifactPlayground() {
  const { artifact } = useGateAIonArtifactPlayground();

  return (
    <div style={{ padding: 48, maxWidth: 1280, margin: '0 auto' }}>
      <header style={{ marginBottom: 48 }}>
        <h1
          style={{
            fontFamily: ISe,
            fontSize: 32,
            fontWeight: 400,
            lineHeight: 1.18,
            letterSpacing: '-0.025em',
            color: 'var(--dir-text-primary)',
            margin: 0,
            marginBottom: 12,
          }}
        >
          Artifact Playground · Ion-grounded
        </h1>
        <p
          style={{
            fontFamily: IS,
            fontSize: 13,
            fontWeight: 300,
            lineHeight: 1.6,
            color: 'var(--dir-text-secondary)',
            margin: 0,
            maxWidth: 680,
          }}
        >
          Exploration of research artifacts as standalone explorable components. Default content seeded from real Ion materials where available; synthesized content explicitly marked. Toggles live in the LabShell chrome above.
        </p>
      </header>

      <section style={{ minHeight: 400 }}>
        {artifact === 'none' && (
          <div
            style={{
              minHeight: 400,
              border: '1px dashed var(--dir-border)',
              padding: 32,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                fontFamily: IS,
                fontSize: 13,
                fontWeight: 300,
                lineHeight: 1.6,
                color: 'var(--dir-text-secondary)',
                margin: 0,
                marginBottom: 8,
              }}
            >
              Select an artifact in the chrome above.
            </p>
            <p
              style={{
                fontFamily: IS,
                fontSize: 11,
                fontWeight: 300,
                color: 'var(--dir-text-secondary)',
                margin: 0,
              }}
            >
              16 artifacts catalogued (per playground plan §2). 6 direct Ion fits · 8 partial fits · 2 catalog refinements (A3 dropped, D3 absorbed into D2, E1 reframed to persona-trait visualization).
            </p>
          </div>
        )}
        {artifact === 'A1' && <A1AffinityMap />}
        {artifact === 'B1' && <B1VennPositioning />}
        {artifact === 'C1' && <C1Funnel />}
        {artifact === 'C2' && <C2PhaseFriction />}
        {artifact === 'D1' && <D1WavySpectrum />}
        {artifact === 'D2' && <D2WorkflowDisconnect />}
        {artifact === 'A2' && <A2EmpathyMap />}
        {artifact === 'A4' && <A4MentalModel />}
        {artifact === 'B2' && <B22x2Matrix />}
        {artifact === 'B3' && <B3CompetitiveLandscape />}
        {artifact === 'B4' && <B4ConceptMap />}
        {artifact === 'C3' && <C3UserFlow />}
        {artifact === 'E1' && <E1PersonaTraitVisualization />}
        {artifact === 'C4' && <C4ServiceBlueprint />}
        {artifact === 'C5' && <C5Storyboard />}
        {artifact === 'E2' && <E2PersonaJourneyOverlay />}
        {artifact !== 'none' && artifact !== 'A1' && artifact !== 'B1' && artifact !== 'C1' && artifact !== 'C2' && artifact !== 'D1' && artifact !== 'D2' && artifact !== 'A2' && artifact !== 'A4' && artifact !== 'B2' && artifact !== 'B3' && artifact !== 'B4' && artifact !== 'C3' && artifact !== 'E1' && artifact !== 'C4' && artifact !== 'C5' && artifact !== 'E2' && (
          <div
            style={{
              minHeight: 400,
              border: '1px dashed var(--dir-border)',
              padding: 32,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                fontFamily: IS,
                fontSize: 18,
                fontWeight: 600,
                lineHeight: 1.4,
                letterSpacing: '-0.01em',
                color: 'var(--dir-text-primary)',
                margin: 0,
                marginBottom: 8,
              }}
            >
              {ARTIFACT_LABELS[artifact]}
            </p>
            <p
              style={{
                fontFamily: IS,
                fontSize: 11,
                fontWeight: 300,
                color: 'var(--dir-text-secondary)',
                margin: 0,
                maxWidth: 560,
              }}
            >
              16 of 16 built (A1 · A2 · A4 · B1 · B2 · B3 · B4 · C1 · C2 · C3 · C4 · C5 · D1 · D2 · E1 · E2). C3 native pending register reframe.
            </p>
          </div>
        )}
      </section>

    </div>
  );
}
