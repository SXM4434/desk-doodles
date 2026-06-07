import React from 'react';
import { Page1120 } from './PageInset';
import { FH_A } from '../shells/FH_A';
import { SV_A } from '../shells/SV_A';
import { primaryProject, supportProjects } from '../../data/projects';
import type { ComboLayoutProps } from '../combo/composition';

// T1-L3 Anchor + Paired Field:
// FH-B anchor; SV-A supports in 2-up pairs (4 supports = 2 pairs).
// Intra-pair gap: 16; inter-pair gap: 64 (ratio 1:4 — well above the 1:1.5
// Gestalt threshold below which the pair read collapses back to grid).
export function T1_L3({ renderFeatured, renderStandard }: ComboLayoutProps = {}) {
  const pairs = [
    [supportProjects[0], supportProjects[1]],
    [supportProjects[2], supportProjects[3]],
  ];
  return (
    <Page1120>
      <div style={{ marginBottom: 80 }}>
        {renderFeatured ? renderFeatured(primaryProject) : <FH_A project={primaryProject} />}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 64 }}>
        {pairs.map((pair, i) => (
          <div
            key={i}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 16,
            }}
          >
            {pair.map((p) => (
              <React.Fragment key={p.id}>
                {renderStandard ? renderStandard(p) : <SV_A project={p} />}
              </React.Fragment>
            ))}
          </div>
        ))}
      </div>
    </Page1120>
  );
}
