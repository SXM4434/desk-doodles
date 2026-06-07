import React from 'react';
import { Page1120 } from './PageInset';
import { FH_A } from '../shells/FH_A';
import { SV_A } from '../shells/SV_A';
import { primaryProject, supportProjects } from '../../data/projects';
import type { ComboLayoutProps } from '../combo/composition';

// T5-L7 Offset Inset Cascade:
// Vertical rhythm from width variance, not alignment variance. Cards
// left-aligned (no centerline — differentiates from L6), widths
// alternate across the locked ladder: 1120 (standard) → 680 (reading)
// → 840 (wide-support) → 680 (reading) → 1120 (standard). The
// content-inset rhythm mimics magazine editorial "tighten/loosen"
// pacing — wide for scan moments, narrow for read moments.
export function T5a_L7({ renderFeatured, renderStandard }: ComboLayoutProps = {}) {
  const [s0, s1, s2, s3] = supportProjects;
  return (
    <Page1120>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 32,
        }}
      >
        <div style={{ width: 'min(100%, 1120px)' }}>
          {renderFeatured ? renderFeatured(primaryProject) : <FH_A project={primaryProject} />}
        </div>
        <div style={{ width: 'min(60.7%, 680px)' }}>
          {renderStandard ? renderStandard(s0) : <SV_A project={s0} />}
        </div>
        <div style={{ width: 'min(75%, 840px)' }}>
          {renderStandard ? renderStandard(s1) : <SV_A project={s1} />}
        </div>
        <div style={{ width: 'min(60.7%, 680px)' }}>
          {renderStandard ? renderStandard(s2) : <SV_A project={s2} />}
        </div>
        <div style={{ width: 'min(100%, 1120px)' }}>
          {renderStandard ? renderStandard(s3) : <SV_A project={s3} />}
        </div>
      </div>
    </Page1120>
  );
}
