import { NavLink } from 'react-router';
import { IS, ISe } from '../../lib/typography';

export function DeskDoodlesPublicCanvas() {
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
      <header
        style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--dir-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <NavLink
          to="/"
          style={{
            fontFamily: ISe,
            fontSize: 18,
            letterSpacing: '-0.01em',
            color: 'var(--dir-text-primary)',
            textDecoration: 'none',
          }}
        >
          Desk Doodles
        </NavLink>
        <NavLink
          to="/canvas"
          style={{
            fontFamily: IS,
            fontSize: 13,
            fontWeight: 600,
            padding: '8px 16px',
            background: 'var(--dir-cta-bg)',
            color: 'var(--dir-cta-text)',
            border: '1px solid var(--dir-cta-border)',
            borderRadius: 4,
            textDecoration: 'none',
          }}
        >
          Start doodling →
        </NavLink>
      </header>

      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 48,
          gap: 24,
        }}
      >
        <h1
          style={{
            fontFamily: ISe,
            fontSize: 32,
            lineHeight: 1.15,
            letterSpacing: '-0.015em',
            margin: 0,
            color: 'var(--dir-text-primary)',
          }}
        >
          Public canvas — coming Day 9
        </h1>
        <p
          style={{
            fontFamily: IS,
            fontSize: 15,
            lineHeight: 1.55,
            color: 'var(--dir-text-body)',
            margin: 0,
            maxWidth: 560,
            textAlign: 'center',
          }}
        >
          Infinite Figma-style canvas where everyone's published doodles get scattered together.
          Mixed styles, mixed modes, slight rotation, anti-cover placement. Wiring lands Day 9
          (Supabase + anonymous session ID + opt-in publish).
        </p>
      </main>
    </div>
  );
}
