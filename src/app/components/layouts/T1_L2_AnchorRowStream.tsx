import React from 'react';
import { Page1120 } from './PageInset';
import { FH_B } from '../shells/FH_B';
import { SH_A_Row } from '../shells/SH_A_Row';
import { primaryProject, supportProjects } from '../../data/projects';
import type { ComboLayoutProps } from '../combo/composition';

// T1-L2 Anchor Row Stream:
// FH-B anchor; SH-A Row supports stacked vertically (list mode).
// Inter-row gap: 24 (ladder); serial browse rhythm — F-pattern.
export function T1_L2({ renderFeatured, renderStandard }: ComboLayoutProps = {}) {
  return (
    <Page1120>
      <div style={{ marginBottom: 32 }}>
        {renderFeatured ? renderFeatured(primaryProject) : <FH_B project={primaryProject} />}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {supportProjects.map((p) => (
          <React.Fragment key={p.id}>
            {renderStandard ? renderStandard(p) : <SH_A_Row project={p} />}
          </React.Fragment>
        ))}
      </div>
    </Page1120>
  );
}
