import { IS, ISe } from '../../cards/tokens';
import { F3B_CONCEPTS, type F3BConcept } from '../../../state/F3BConceptContext';

export function F3_B_ConceptComingSoon({ concept }: { concept: F3BConcept }) {
  const meta = F3B_CONCEPTS.find((c) => c.id === concept);
  return (
    <div
      style={{
        padding: '32px 24px',
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
        F3-B · {meta?.label ?? concept} · not built
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
        Concept available · component pending
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
        Switch back to Trophy Wall or Floating Canvas in chrome ↑
      </p>
    </div>
  );
}
