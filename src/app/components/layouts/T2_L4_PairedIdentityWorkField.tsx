import React from 'react';
import { Page1120 } from './PageInset';
import { IS, ISe } from '../cards/tokens';
import { FH_A } from '../shells/FH_A';
import { SV_A } from '../shells/SV_A';
import { primaryProject, supportProjects } from '../../data/projects';
import type { ComboLayoutProps } from '../combo/composition';

// T2-L4 Paired Identity + Work Field:
// Identity block (typographic, not a card) as side co-anchor; FH-B + SV-A
// grid as the work field. 384 / 48 / 688 = identity / gutter / work.
// Identity stays typographic — grows into a hero/about if allowed to.
export function T2_L4({ renderFeatured, renderStandard }: ComboLayoutProps = {}) {
  const supports = supportProjects.slice(0, 2);
  return (
    <Page1120>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(288px, 5fr) minmax(512px, 9fr)',
          gap: 48,
          alignItems: 'start',
        }}
      >
        <aside style={{ position: 'sticky', top: 128 }}>
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
              lineHeight: 1.3,
              letterSpacing: '-0.015em',
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
              lineHeight: 1.7,
              color: 'var(--dir-text-secondary)',
              margin: 0,
            }}
          >
            Identity block as macro-layout co-anchor. Typographic only — not a
            hero, not an intro page. Work field holds its browse register
            beside it.
          </p>
        </aside>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {renderFeatured ? renderFeatured(primaryProject) : <FH_A project={primaryProject} />}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 16,
            }}
          >
            {supports.map((p) => (
              <React.Fragment key={p.id}>
                {renderStandard ? renderStandard(p) : <SV_A project={p} />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </Page1120>
  );
}
