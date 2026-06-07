import { IS, ISe } from '../../cards/tokens';
import { F3A_CONCEPTS, type F3AConcept } from '../../../state/F3AConceptContext';

export function F3_A_ConceptComingSoon({ concept }: { concept: F3AConcept }) {
  const meta = F3A_CONCEPTS.find((c) => c.id === concept);
  return (
    <div
      style={{
        padding: '48px clamp(24px, 4vw, 64px)',
        backgroundColor: 'var(--dir-raised)',
        border: '1px dashed var(--dir-border)',
        borderRadius: 4,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        minHeight: 320,
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
      }}
    >
      <p
        style={{
          fontFamily: IS,
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--dir-text-secondary)',
          margin: 0,
        }}
      >
        F3-A · {meta?.label ?? concept} · not built
      </p>
      <h2
        style={{
          fontFamily: ISe,
          fontSize: 22,
          fontWeight: 400,
          lineHeight: 1.2,
          letterSpacing: '-0.02em',
          color: 'var(--dir-text-primary)',
          margin: 0,
          maxWidth: '20ch',
        }}
      >
        Concept candidate · component pending
      </h2>
      <p
        style={{
          fontFamily: IS,
          fontSize: 13,
          fontWeight: 300,
          lineHeight: 1.55,
          color: 'var(--dir-text-secondary)',
          margin: 0,
          maxWidth: '36ch',
        }}
      >
        {meta?.detail}
      </p>
      <p
        style={{
          fontFamily: IS,
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--dir-detail)',
          margin: 0,
          marginTop: 8,
        }}
      >
        Switch back to Desk · Scattered in chrome ↑
      </p>
    </div>
  );
}
