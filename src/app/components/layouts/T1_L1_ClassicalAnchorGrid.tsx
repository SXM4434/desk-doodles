import React from 'react';
import { Page1120 } from './PageInset';
import { FH_A } from '../shells/FH_A';
import { SV_A } from '../shells/SV_A';
import { primaryProject, supportProjects } from '../../data/projects';
import type { ComboLayoutProps } from '../combo/composition';

// T1-L1 Classical Anchor Grid:
// FH-B full-width anchor on top; 3-col SV-A matrix below.
// Gutter: 24; row gap: 32; truest baseline — no offsets, no grouping, no stagger.
export function T1_L1({ renderFeatured, renderStandard }: ComboLayoutProps = {}) {
  const supports = supportProjects.slice(0, 3);
  return (
    <Page1120>
      <div style={{ marginBottom: 48 }}>
        {renderFeatured ? renderFeatured(primaryProject) : <FH_A project={primaryProject} />}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 24,
          rowGap: 32,
        }}
      >
        {supports.map((p) => (
          <React.Fragment key={p.id}>
            {renderStandard ? renderStandard(p) : <SV_A project={p} />}
          </React.Fragment>
        ))}
      </div>
    </Page1120>
  );
}
