import React from 'react';
import { IS, ISe } from '../cards/tokens';

// Shared identity aside for Family B variants. Sticky typographic co-anchor
// beside the work column.
//
// Hero #8 scaffolding clarification (2026-05-26): this IS the Family B hero
// zone for the purposes of the Hero #8 lab. Family B's hero placement = the
// vertical column on the left side of the page (this component). Family A's
// hero placement = a horizontal band above the work field (HeroBandPlaceholder).
// Both placements are now declared at the macro-layout level; Hero #8 composes
// strategy families against both during 8.1 research matrix.
//
// Earlier "not a hero, not an intro page" framing was scoped to the pre-Hero-#8
// homepage v2 track narrowing — at Narrow 4 Pass 4 the identity block was
// declared typographic-only. Hero #8 reframes both Family A and Family B as
// having a hero zone; the current content is placeholder copy at typographic
// register only, NOT a locked hero design.
export function IdentityAside() {
  return (
    <aside style={{ position: 'sticky', top: 96 }}>
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
          fontSize: 22,
          fontWeight: 400,
          lineHeight: 1.25,
          letterSpacing: '-0.02em',
          color: 'var(--dir-text-primary)',
          margin: 0,
          marginBottom: 16,
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
        }}
      >
        Identity block as macro-layout co-anchor. Typographic only — not a hero,
        not an intro page. Work field holds its browse register beside it.
      </p>
    </aside>
  );
}
