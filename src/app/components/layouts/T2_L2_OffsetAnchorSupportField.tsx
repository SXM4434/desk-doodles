import React from 'react';
import { Page1120 } from './PageInset';
import { FH_A } from '../shells/FH_A';
import { SV_A } from '../shells/SV_A';
import { primaryProject, supportProjects } from '../../data/projects';
import type { ComboLayoutProps } from '../combo/composition';

// T2-L2 Offset Anchor + Stable Support Field:
// FH-B at 1008 wide shifted 64px off centerline (ladder value — stronger
// than the 48px option, still below the 96px column-split threshold).
// 3-col SV-A grid held stable below.
export function T2_L2({ renderFeatured, renderStandard }: ComboLayoutProps = {}) {
  const supports = supportProjects.slice(0, 3);
  return (
    <Page1120>
      <div
        style={{
          marginBottom: 48,
          width: '90%',
          marginLeft: '10%',
          marginRight: 0,
        }}
      >
        {renderFeatured ? renderFeatured(primaryProject) : <FH_A project={primaryProject} />}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 24,
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
