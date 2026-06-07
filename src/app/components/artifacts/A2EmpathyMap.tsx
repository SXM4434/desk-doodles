import React from 'react';
import { IS } from '../cards/tokens';
import { ION_EMPATHY_MAP, type EmpathyPersona, type EmpathyQuadrant, type EmpathyItem } from './data/ion-empathy-map';
import { useGateAIonArtifactPlayground, type A2State } from '../../state/GateAIonArtifactPlaygroundContext';

// A2 · Empathy Map — native only at IC quality.
// Native = synthesized 4-quadrant empathy map for the Workflow-focused persona, content
// derived from Leyi's affinity-map post-its (researcher observations, not direct user
// quotes). Marked synthesized per playground plan §4.
//
// SYSTEM ADHERENCE (audited pre-ship):
// - Typography: locked ladder — IS 10/500/0.12em uppercase (eyebrow + quadrant labels +
//   attribution caps), IS 11/300 (item text + attributions), IS 13/300 (persona thesis),
//   IS 18/600 (persona name). No off-ladder.
// - Spacing: locked tokens — gap 24/16/12/8, padding 16. Center figure 96 (space-10).
// - Color: W1 only — borders --dir-border, attributions --dir-detail, body --dir-text-primary.

function attributionLabel(item: EmpathyItem): string | null {
  return item.author ? item.author : null;
}

function QuadrantPanel({ quadrant, itemsLimit, showAttr, position, hasCenterFigure, hideHeader }: {
  quadrant: EmpathyQuadrant;
  itemsLimit: number;
  showAttr: boolean;
  position: 'tl' | 'tr' | 'bl' | 'br';
  hasCenterFigure: boolean;
  hideHeader?: boolean;
}) {
  const items = quadrant.items.slice(0, itemsLimit);
  // Inner-corner padding clears space for the 128px center figure (figure radius 64 +
  // 16 margin = 80, which is space-9 in the locked spacing scale).
  // - tl: pad bottom + right (inner corner is bottom-right toward grid center)
  // - tr: pad bottom + left
  // - bl: pad top + right
  // - br: pad top + left
  const innerPad = hasCenterFigure ? 80 : 16;
  const padTop = position === 'bl' || position === 'br' ? innerPad : 16;
  const padBottom = position === 'tl' || position === 'tr' ? innerPad : 16;
  const padLeft = position === 'tr' || position === 'br' ? innerPad : 16;
  const padRight = position === 'tl' || position === 'bl' ? innerPad : 16;
  return (
    <div
      style={{
        paddingTop: padTop,
        paddingBottom: padBottom,
        paddingLeft: padLeft,
        paddingRight: padRight,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        minWidth: 0,
        // Internal grid borders — only on the inner edges so the outer rectangle border
        // is rendered by the parent grid container.
        borderTop: position === 'bl' || position === 'br' ? '1px solid var(--dir-border)' : 'none',
        borderLeft: position === 'tr' || position === 'br' ? '1px solid var(--dir-border)' : 'none',
      }}
    >
      {/* In-panel label — Dave Gray canonical empathy-map convention. Hidden when
          quadrantLabelsPosition='edge' moves labels outside the panels. */}
      {!hideHeader && (
        <p
          style={{
            fontFamily: IS,
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--dir-text-primary)',
            margin: 0,
            paddingBottom: 8,
            borderBottom: '1px solid var(--dir-border)',
          }}
        >
          {quadrant.label}
        </p>
      )}
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map((item, i) => (
          <li key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <p style={{ fontFamily: IS, fontSize: 11, fontWeight: 300, lineHeight: 1.45, color: 'var(--dir-text-primary)', margin: 0 }}>
              {item.text}
            </p>
            {showAttr && attributionLabel(item) && (
              <p style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--dir-detail)', margin: 0 }}>
                {attributionLabel(item)}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CenterFigure({ persona, mode }: { persona: EmpathyPersona; mode: A2State['centerFigure'] }) {
  if (mode === 'none') return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        width: 128,
        height: 128,
        backgroundColor: 'var(--dir-bg)',
        border: '1px solid var(--dir-text-primary)',
        borderRadius: 64,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        padding: 12,
      }}
    >
      {mode === 'silhouette' && (
        <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden>
          <circle cx="16" cy="11" r="6" fill="var(--dir-text-primary)" />
          <path d="M 4 30 C 4 22, 10 18, 16 18 C 22 18, 28 22, 28 30 Z" fill="var(--dir-text-primary)" />
        </svg>
      )}
      {mode === 'glyph' && (
        <span style={{ fontFamily: IS, fontSize: 28, fontWeight: 600, color: 'var(--dir-text-primary)' }}>✦</span>
      )}
      <p style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-text-primary)', margin: 0, textAlign: 'center' }}>
        {persona.name.split(' ')[0]}
      </p>
    </div>
  );
}

function EdgeLabel({ children, align }: { children: React.ReactNode; align: 'left' | 'right' | 'center' }) {
  return (
    <p
      style={{
        fontFamily: IS,
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--dir-text-primary)',
        margin: 0,
        textAlign: align,
      }}
    >
      {children}
    </p>
  );
}

function NativeClassic4Quadrant({ state, persona }: { state: A2State; persona: EmpathyPersona }) {
  const quadrants = persona.quadrants.filter((q) => ['says', 'thinks', 'does', 'feels', 'pains', 'gains'].includes(q.key));
  const says = quadrants.find((q) => q.key === 'says')!;
  const thinks = quadrants.find((q) => q.key === 'thinks')!;
  const does = quadrants.find((q) => q.key === 'does')!;
  const feels = quadrants.find((q) => q.key === 'feels')!;
  const pains = quadrants.find((q) => q.key === 'pains');
  const gains = quadrants.find((q) => q.key === 'gains');
  const hasFigure = state.centerFigure !== 'none';
  const useEdge = state.quadrantLabelsPosition === 'edge';
  // quadrantSet=6 in the classic-4-quadrant variant appends a Pains/Gains row below
  // the canonical 4-grid (Dave Gray updated canvas). Falls back gracefully if data
  // doesn't carry pains/gains.
  const extend = state.quadrantSet === 6 && pains && gains;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: useEdge ? 12 : 0 }}>
      {useEdge && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <EdgeLabel align="left">{says.label}</EdgeLabel>
          <EdgeLabel align="right">{thinks.label}</EdgeLabel>
        </div>
      )}
      <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr', border: '1px solid var(--dir-border)' }}>
        <QuadrantPanel quadrant={says} itemsLimit={state.itemsPerQuadrant} showAttr={state.sourceAttribution === 'show'} position="tl" hasCenterFigure={hasFigure} hideHeader={useEdge} />
        <QuadrantPanel quadrant={thinks} itemsLimit={state.itemsPerQuadrant} showAttr={state.sourceAttribution === 'show'} position="tr" hasCenterFigure={hasFigure} hideHeader={useEdge} />
        <QuadrantPanel quadrant={does} itemsLimit={state.itemsPerQuadrant} showAttr={state.sourceAttribution === 'show'} position="bl" hasCenterFigure={hasFigure} hideHeader={useEdge} />
        <QuadrantPanel quadrant={feels} itemsLimit={state.itemsPerQuadrant} showAttr={state.sourceAttribution === 'show'} position="br" hasCenterFigure={hasFigure} hideHeader={useEdge} />
        <CenterFigure persona={persona} mode={state.centerFigure} />
      </div>
      {useEdge && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <EdgeLabel align="left">{does.label}</EdgeLabel>
          <EdgeLabel align="right">{feels.label}</EdgeLabel>
        </div>
      )}
      {extend && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', border: '1px solid var(--dir-border)', borderTop: 'none' }}>
          <QuadrantPanel quadrant={pains!} itemsLimit={state.itemsPerQuadrant} showAttr={state.sourceAttribution === 'show'} position="bl" hasCenterFigure={false} hideHeader={false} />
          <QuadrantPanel quadrant={gains!} itemsLimit={state.itemsPerQuadrant} showAttr={state.sourceAttribution === 'show'} position="br" hasCenterFigure={false} hideHeader={false} />
        </div>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Variant: cross-shape — NN/g cross arrangement (quadrants in cardinal positions)
// ───────────────────────────────────────────────────────────────────────────

function ArmPanel({ quadrant, itemsLimit, showAttr }: { quadrant: EmpathyQuadrant; itemsLimit: number; showAttr: boolean }) {
  const items = quadrant.items.slice(0, itemsLimit);
  return (
    <div style={{ padding: 16, border: '1px solid var(--dir-border)', display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
      <p style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-text-primary)', margin: 0, paddingBottom: 8, borderBottom: '1px solid var(--dir-border)' }}>
        {quadrant.label}
      </p>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map((item, i) => (
          <li key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <p style={{ fontFamily: IS, fontSize: 11, fontWeight: 300, lineHeight: 1.45, color: 'var(--dir-text-primary)', margin: 0 }}>
              {item.text}
            </p>
            {showAttr && attributionLabel(item) && (
              <p style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--dir-detail)', margin: 0 }}>
                {attributionLabel(item)}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function VariantCrossShape({ state, persona }: { state: A2State; persona: EmpathyPersona }) {
  const quadrants = persona.quadrants;
  const says = quadrants.find((q) => q.key === 'says')!;
  const thinks = quadrants.find((q) => q.key === 'thinks')!;
  const does = quadrants.find((q) => q.key === 'does')!;
  const feels = quadrants.find((q) => q.key === 'feels')!;
  // 3x3 grid: corner cells empty, cardinal positions hold quadrants, center holds figure.
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: 'auto auto auto', gap: 16 }}>
      <div /> {/* empty corner */}
      <div style={{ gridColumn: 2, gridRow: 1 }}>
        <ArmPanel quadrant={thinks} itemsLimit={state.itemsPerQuadrant} showAttr={state.sourceAttribution === 'show'} />
      </div>
      <div /> {/* empty corner */}
      <div style={{ gridColumn: 1, gridRow: 2 }}>
        <ArmPanel quadrant={feels} itemsLimit={state.itemsPerQuadrant} showAttr={state.sourceAttribution === 'show'} />
      </div>
      <div style={{ gridColumn: 2, gridRow: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {state.centerFigure !== 'none' && (
          <div style={{ width: 128, height: 128, border: '1px solid var(--dir-text-primary)', borderRadius: 64, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, padding: 12, backgroundColor: 'var(--dir-bg)' }}>
            {state.centerFigure === 'silhouette' && (
              <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden>
                <circle cx="16" cy="11" r="6" fill="var(--dir-text-primary)" />
                <path d="M 4 30 C 4 22, 10 18, 16 18 C 22 18, 28 22, 28 30 Z" fill="var(--dir-text-primary)" />
              </svg>
            )}
            {state.centerFigure === 'glyph' && (
              <span style={{ fontFamily: IS, fontSize: 28, fontWeight: 600, color: 'var(--dir-text-primary)' }}>✦</span>
            )}
            <p style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-text-primary)', margin: 0, textAlign: 'center' }}>
              {persona.name.split(' ')[0]}
            </p>
          </div>
        )}
      </div>
      <div style={{ gridColumn: 3, gridRow: 2 }}>
        <ArmPanel quadrant={says} itemsLimit={state.itemsPerQuadrant} showAttr={state.sourceAttribution === 'show'} />
      </div>
      <div /> {/* empty corner */}
      <div style={{ gridColumn: 2, gridRow: 3 }}>
        <ArmPanel quadrant={does} itemsLimit={state.itemsPerQuadrant} showAttr={state.sourceAttribution === 'show'} />
      </div>
      <div /> {/* empty corner */}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Variant: linear-stacked — 4 sections in a single column
// ───────────────────────────────────────────────────────────────────────────

function VariantLinearStacked({ state, persona }: { state: A2State; persona: EmpathyPersona }) {
  const keys = state.quadrantSet === 6
    ? ['says', 'thinks', 'does', 'feels', 'pains', 'gains']
    : ['says', 'thinks', 'does', 'feels'];
  const quadrants = persona.quadrants.filter((q) => keys.includes(q.key));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, border: '1px solid var(--dir-border)' }}>
      {quadrants.map((q, i) => (
        <div key={q.key} style={{ padding: 24, borderTop: i === 0 ? 'none' : '1px solid var(--dir-border)', display: 'grid', gridTemplateColumns: '128px 1fr', gap: 24, alignItems: 'start' }}>
          <p style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-text-primary)', margin: 0 }}>
            {q.label}
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {q.items.slice(0, state.itemsPerQuadrant).map((item, j) => (
              <li key={j} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <p style={{ fontFamily: IS, fontSize: 13, fontWeight: 300, lineHeight: 1.6, color: 'var(--dir-text-primary)', margin: 0 }}>
                  {item.text}
                </p>
                {state.sourceAttribution === 'show' && attributionLabel(item) && (
                  <p style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--dir-detail)', margin: 0 }}>
                    {attributionLabel(item)}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Variant: extended-6-quadrant — adds Pains and Gains (Dave Gray updated canvas)
// ───────────────────────────────────────────────────────────────────────────

function VariantSixQuadrant({ state, persona }: { state: A2State; persona: EmpathyPersona }) {
  // 6 panels in 3 columns × 2 rows: Says/Thinks/Does on top, Feels/Pains/Gains on bottom.
  // Internal borders: each cell draws a top border if it's in the bottom row, and a left
  // border if it's NOT in the first column. Outer rectangle border is on the parent.
  const order: ('says' | 'thinks' | 'does' | 'feels' | 'pains' | 'gains')[] = ['says', 'thinks', 'does', 'feels', 'pains', 'gains'];
  const items = order
    .map((k) => persona.quadrants.find((q) => q.key === k))
    .filter((q): q is EmpathyQuadrant => Boolean(q));
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', border: '1px solid var(--dir-border)' }}>
      {items.map((q, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const items = q.items.slice(0, state.itemsPerQuadrant);
        return (
          <div
            key={q.key}
            style={{
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              minWidth: 0,
              borderTop: row > 0 ? '1px solid var(--dir-border)' : 'none',
              borderLeft: col > 0 ? '1px solid var(--dir-border)' : 'none',
            }}
          >
            <p style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-text-primary)', margin: 0, paddingBottom: 8, borderBottom: '1px solid var(--dir-border)' }}>
              {q.label}
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {items.map((item, j) => (
                <li key={j} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <p style={{ fontFamily: IS, fontSize: 11, fontWeight: 300, lineHeight: 1.45, color: 'var(--dir-text-primary)', margin: 0 }}>
                    {item.text}
                  </p>
                  {state.sourceAttribution === 'show' && attributionLabel(item) && (
                    <p style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--dir-detail)', margin: 0 }}>
                      {attributionLabel(item)}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function VariantStub({ name, why }: { name: string; why: string }) {
  return (
    <div
      style={{
        padding: 32,
        border: '1px dashed var(--dir-border)',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <p style={{ fontFamily: IS, fontSize: 13, fontWeight: 300, color: 'var(--dir-text-primary)', margin: 0 }}>
        {name} variant — pending native approval
      </p>
      <p style={{ fontFamily: IS, fontSize: 11, fontWeight: 300, lineHeight: 1.4, color: 'var(--dir-text-secondary)', margin: 0, maxWidth: 480, alignSelf: 'center' }}>
        {why}
      </p>
    </div>
  );
}

export function A2EmpathyMap() {
  const { a2 } = useGateAIonArtifactPlayground();
  // Choose persona based on toggle (or render side-by-side for 'both')
  const dataset = ION_EMPATHY_MAP;
  const personas = a2.personaTarget === 'both'
    ? dataset.personas
    : dataset.personas.filter((p) => p.id === a2.personaTarget);
  const renderMap = (persona: EmpathyPersona) => {
    if (a2.variant === 'classic-4-quadrant') {
      return <NativeClassic4Quadrant key={persona.id} state={a2} persona={persona} />;
    }
    if (a2.variant === 'cross-shape') {
      return <VariantCrossShape key={persona.id} state={a2} persona={persona} />;
    }
    if (a2.variant === 'linear-stacked') {
      return <VariantLinearStacked key={persona.id} state={a2} persona={persona} />;
    }
    if (a2.variant === 'extended-6-quadrant') {
      return <VariantSixQuadrant key={persona.id} state={a2} persona={persona} />;
    }
    return null;
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <p style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-detail)', margin: 0 }}>
        Empathy map · {personas.length === 1 ? personas[0]!.name : 'both personas side-by-side'}
      </p>

      {/* Persona header(s) */}
      {personas.length === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <h3 style={{ fontFamily: IS, fontSize: 18, fontWeight: 600, lineHeight: 1.4, letterSpacing: '-0.01em', color: 'var(--dir-text-primary)', margin: 0 }}>
            {personas[0]!.name}
          </h3>
          <p style={{ fontFamily: IS, fontSize: 13, fontWeight: 300, lineHeight: 1.6, color: 'var(--dir-text-secondary)', margin: 0 }}>
            {personas[0]!.thesis}
          </p>
        </div>
      )}

      {/* Variant render */}
      <div style={{ display: 'grid', gridTemplateColumns: personas.length === 2 ? '1fr 1fr' : '1fr', gap: 32 }}>
        {personas.map(renderMap)}
      </div>

      {/* Synthesis disclaimer — Leyi's affinity-map source is researcher observations,
          not direct user transcription. Says/Does items paraphrase those observations
          (no fabricated direct quotes); Thinks/Feels are inferred from the same source. */}
      {dataset.synthesized && (
        <p style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-detail)', margin: 0 }}>
          synthesized · Says/Does paraphrased from attributed affinity post-its (Florence Chow · Esther Pelaez · Dora Zhang · Amenze Sholanke · Sebastian Moreno Mesa); Thinks/Feels inferred
        </p>
      )}
    </div>
  );
}
