import React from 'react';
import { IS, ISe } from '../cards/tokens';

// Shared hero band placeholder for Family A variants. Horizontal page-entry
// band that sits above the featured project card. Parallel to IdentityAside
// (which serves Family B as a vertical left-column hero zone).
//
// Added 2026-05-26 as Hero #8 scaffolding — both Family A and Family B now
// declare a hero zone at the macro-layout level. The Hero #8 lab composes
// against these placeholders during 8.1 research; this is NOT the locked hero.
// Typographic only — not a hero design, not an intro page. Structural
// placeholder so Hero #8 has material to compose against per the placement-
// × strategy-family matrix research bank.
//
// Family A's hero placement = horizontal band above the work field.
// Family B's hero placement = vertical column beside the work field.
//
// Stays visible in compact mode — the featured card sizes itself to fit
// alongside the hero band in the viewport.
export function HeroBandPlaceholder() {
  return (
    <header
      style={{
        // Full-width band above the featured card. 16px vertical breathing
        // room before the locked 80px marginBottom on the featured wrapper
        // takes over. No background / no border — typographic only.
        paddingTop: 8,
        paddingBottom: 32,
      }}
    >
      <p
        style={{
          fontFamily: IS,
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--dir-text-secondary)',
          margin: 0,
          marginBottom: 16,
        }}
      >
        Sebastian Moncada
      </p>
      <h1
        style={{
          fontFamily: ISe,
          fontSize: 32,
          fontWeight: 400,
          lineHeight: 1.18,
          letterSpacing: '-0.025em',
          color: 'var(--dir-text-primary)',
          margin: 0,
          marginBottom: 16,
          maxWidth: 720,
        }}
      >
        Product designer working at the seam between tools and teams.
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
        Hero band placeholder — Family A page-entry register. Horizontal band
        above the work field. Hero #8 lab will compose strategy families
        (display-type / proof-led / desk / system-diagrammatic / live-lab /
        etc.) against this placement during 8.1 research.
      </p>
    </header>
  );
}
