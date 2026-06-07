import React from 'react';
import { Page1120 } from './PageInset';
import { FH_A } from '../shells/FH_A';
import { SV_A } from '../shells/SV_A';
import { primaryProject, supportProjects } from '../../data/projects';
import type { ComboLayoutProps } from '../combo/composition';

// T5-L8 Root-Rectangle Tessellation (Dynamic Symmetry · √2):
// Hambidge dynamic-symmetry ratio (√2 ≈ 1:1.414) held across two
// mirrored rows. Precise √2 widths fit the Page1120 content box
// (1024 interior): Row 1 splits 572/48/404 = 1024; Row 2 inverts to
// 404/48/572. 572/404 ≈ 1.416, holding √2.
export function T5c_L1({ renderFeatured, renderStandard }: ComboLayoutProps = {}) {
  const [s0, s1, s2, s3] = supportProjects;
  return (
    <Page1120>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 48px minmax(0, 1.414fr)',
          gap: 0,
          marginBottom: 48,
          alignItems: 'start',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {renderStandard ? renderStandard(s0) : <SV_A project={s0} />}
          {renderStandard ? renderStandard(s1) : <SV_A project={s1} />}
        </div>
        <div />
        {renderFeatured ? renderFeatured(primaryProject) : <FH_A project={primaryProject} />}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.414fr) 48px minmax(0, 1fr)',
          gap: 0,
          alignItems: 'start',
        }}
      >
        {renderStandard ? renderStandard(s2) : <SV_A project={s2} />}
        <div />
        {renderStandard ? renderStandard(s3) : <SV_A project={s3} />}
      </div>
    </Page1120>
  );
}
