import { NavLink } from 'react-router';
import { IS, ISe } from '../../lib/typography';
import { CTA, PILL } from '../../lib/chromeStyles';

export function DeskDoodlesHome() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--dir-bg)',
        color: 'var(--dir-text-primary)',
        fontFamily: IS,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <header style={{ padding: '32px 48px', borderBottom: '1px solid var(--dir-border)' }}>
        <div style={{ fontFamily: ISe, fontSize: 22, letterSpacing: '-0.01em' }}>Desk Doodles</div>
      </header>

      <main
        style={{
          flex: 1,
          padding: '96px 48px',
          maxWidth: 720,
          marginInline: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 48,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <h1
            style={{
              fontFamily: ISe,
              fontSize: 52,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              margin: 0,
              color: 'var(--dir-text-primary)',
            }}
          >
            Doodle what's on your desk.
          </h1>
          <p
            style={{
              fontFamily: IS,
              fontSize: 15,
              lineHeight: 1.55,
              color: 'var(--dir-text-body)',
              margin: 0,
              maxWidth: 560,
            }}
          >
            Designers sketch at their desks constantly — it's just a habit. Desk Doodles turns that
            habit into a shared canvas. Doodle your mug, your headphones, the dumb little trinkets,
            flip them between 2D and 3D, and drop them onto a wall of everyone else's desk.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {/* Primary CTA → /desk (the real shared-desk flow). /canvas is the
              engine test surface — reachable but not advertised as the entry. */}
          <NavLink
            to="/desk"
            style={{
              ...CTA,
              padding: '12px 20px', // hero CTA — keep larger padding than chrome PILL
              textDecoration: 'none',
            }}
          >
            Start doodling →
          </NavLink>
          {/* Browse the wall → /desks (the public desk gallery — wall of walls).
              Repointed from /public so the gallery is the reachable entry. */}
          <NavLink
            to="/desks"
            style={{
              ...PILL,
              padding: '12px 20px', // hero CTA — keep larger padding than chrome PILL
              textDecoration: 'none',
            }}
          >
            Browse the wall
          </NavLink>
          <NavLink
            to="/canvas"
            style={{
              fontFamily: IS,
              fontSize: 13,
              color: 'var(--dir-text-body-soft)',
              textDecoration: 'none',
              marginLeft: 4,
            }}
          >
            Try the engine
          </NavLink>
        </div>

        <div
          style={{
            marginTop: 48,
            padding: 24,
            background: 'var(--dir-raised)',
            border: '1px solid var(--dir-border)',
            borderRadius: 6, // soft band floor — non-interactive cards use 6-16
            fontFamily: IS,
            fontSize: 11,
            color: 'var(--dir-text-secondary)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          Built in public · github.com/SXM4434/desk-doodles
        </div>
      </main>
    </div>
  );
}
