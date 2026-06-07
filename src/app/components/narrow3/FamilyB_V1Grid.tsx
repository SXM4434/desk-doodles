import React from 'react';
import { Page1120 } from '../layouts/PageInset';
import { FH_A } from '../shells/FH_A';
import { SV_A } from '../shells/SV_A';
import { primaryProject, supportProjects } from '../../data/projects';
import type { ComboLayoutProps } from '../combo/composition';
import { IdentityAside } from './IdentityAside';

// Family B · V1 Grid — Identity + Work Field with 2-up grid standards.
// Sticky typographic identity aside + work column. Inside the work column:
// FH-A hero on top, 2-up grid of standards below.
// T2-L4 register, narrower work column carries a 2-up grid of 2 supports.
export function FamilyB_V1Grid({ renderFeatured, renderStandard, renderHero }: ComboLayoutProps = {}) {
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
        {renderHero ? renderHero() : <IdentityAside />}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {renderFeatured ? renderFeatured(primaryProject) : <FH_A project={primaryProject} />}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
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
