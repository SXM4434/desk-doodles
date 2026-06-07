import React from 'react';
import { Page1120 } from './PageInset';
import { FH_A } from '../shells/FH_A';
import { SV_A } from '../shells/SV_A';
import { projects } from '../../data/projects';
import type { ComboLayoutProps } from '../combo/composition';

// T3-L4 Anchor Cluster + Satellite Field:
// Cluster: FH-B + Elara SV-A pinned at 16px — reads as grouped.
// Satellites: 3 SV-As 64px below cluster, 3-col distribution.
// Proximity ratio 16 : 64 = 1 : 4 — tighter than prior 1:5, still well above
// the 1:2 Gestalt threshold.
export function T3_L4({ renderFeatured, renderStandard }: ComboLayoutProps = {}) {
  const primary = projects[0];
  const clusterSupport = projects[1];
  const satellites = projects.slice(2);
  return (
    <Page1120>
      <div style={{ marginBottom: 64 }}>
        {renderFeatured ? renderFeatured(primary) : <FH_A project={primary} />}
        <div style={{ marginTop: 16 }}>
          {renderStandard ? renderStandard(clusterSupport) : <SV_A project={clusterSupport} />}
        </div>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 48,
        }}
      >
        {satellites.map((p) => (
          <React.Fragment key={p.id}>
            {renderStandard ? renderStandard(p) : <SV_A project={p} />}
          </React.Fragment>
        ))}
      </div>
    </Page1120>
  );
}
