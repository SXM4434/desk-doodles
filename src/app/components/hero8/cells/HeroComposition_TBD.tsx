import { useParams } from 'react-router';
import { IS, ISe } from '../../cards/tokens';

// Placeholder hero composition for F-families outside active scope.
// Renders in either the Family A hero band slot or the Family B identity
// aside slot, sized appropriately for the surrounding layout. F3 (Desk) is
// the first reference family being built — others open as research progresses.
export function HeroComposition_TBD() {
  const { fFamilyId = '', layoutFamilyId = '' } = useParams();
  const isFamilyA = layoutFamilyId === 'a';

  if (isFamilyA) {
    return (
      <header
        style={{
          padding: '24px 0',
          borderTop: '1px dashed var(--dir-border)',
          borderBottom: '1px dashed var(--dir-border)',
          marginBottom: 16,
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
            marginBottom: 8,
          }}
        >
          {fFamilyId.toUpperCase()}-A · horizontal band · not in active scope
        </p>
        <p
          style={{
            fontFamily: IS,
            fontSize: 13,
            fontWeight: 300,
            lineHeight: 1.55,
            color: 'var(--dir-text-body)',
            margin: 0,
          }}
        >
          F3 (Desk) is the first reference family being built. This cell opens
          its own research pass after F3 narrows.
        </p>
      </header>
    );
  }

  return (
    <aside
      style={{
        position: 'sticky',
        top: 32,
        alignSelf: 'start',
        padding: '16px 0',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
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
        {fFamilyId.toUpperCase()}-B · vertical column · not in active scope
      </p>
      <h2
        style={{
          fontFamily: ISe,
          fontSize: 24,
          fontWeight: 400,
          lineHeight: 1.15,
          letterSpacing: '-0.02em',
          color: 'var(--dir-text-primary)',
          margin: 0,
        }}
      >
        Not in active scope.
      </h2>
      <p
        style={{
          fontFamily: IS,
          fontSize: 13,
          fontWeight: 300,
          lineHeight: 1.55,
          color: 'var(--dir-text-body)',
          margin: 0,
        }}
      >
        F3 (Desk) is the first reference family being built. This cell opens its
        own research pass after F3 narrows.
      </p>
    </aside>
  );
}
