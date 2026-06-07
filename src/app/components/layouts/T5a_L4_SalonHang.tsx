import React from 'react';
import { Page1120 } from './PageInset';
import { FH_A } from '../shells/FH_A';
import { SV_A } from '../shells/SV_A';
import { primaryProject, supportProjects } from '../../data/projects';
import type { ComboLayoutProps } from '../combo/composition';

// T5-L4 Salon Hang:
// 17c Paris Académie gallery-wall packing principle — density over
// registration. 6-col grid, gap 12 (denser than the prior 16), variable
// spans (2/3/4) with gridAutoFlow dense so cells pack into available
// holes rather than maintaining row alignment. FH-A spans 4; supports
// cascade at 2, 3, 3, 2.
export function T5a_L4({ renderFeatured, renderStandard }: ComboLayoutProps = {}) {
  const [s0, s1, s2, s3] = supportProjects;
  return (
    <Page1120>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: 12,
          gridAutoFlow: 'dense',
        }}
      >
        <div style={{ gridColumn: 'span 4' }}>
          {renderFeatured ? renderFeatured(primaryProject) : <FH_A project={primaryProject} />}
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          {renderStandard ? renderStandard(s0) : <SV_A project={s0} />}
        </div>
        <div style={{ gridColumn: 'span 3' }}>
          {renderStandard ? renderStandard(s1) : <SV_A project={s1} />}
        </div>
        <div style={{ gridColumn: 'span 3' }}>
          {renderStandard ? renderStandard(s2) : <SV_A project={s2} />}
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          {renderStandard ? renderStandard(s3) : <SV_A project={s3} />}
        </div>
      </div>
    </Page1120>
  );
}
