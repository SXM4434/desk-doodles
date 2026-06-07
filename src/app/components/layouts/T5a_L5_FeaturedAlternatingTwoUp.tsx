import React from 'react';
import { Page1120 } from './PageInset';
import { FH_A } from '../shells/FH_A';
import { SV_A } from '../shells/SV_A';
import { primaryProject, supportProjects } from '../../data/projects';
import type { ComboLayoutProps } from '../combo/composition';

// T5-L5 Featured + Alternating Two-Up:
// Billguo.me composition — full-width FH-A hero anchor followed by
// 2-up rows alternating 2fr/1fr then 1fr/2fr. Differs from L1 by
// providing an anchor (Ion shown as FH-A) before the alternation
// begins; rhythm reads as "featured case + supporting cadence" rather
// than "pure alternation field."
export function T5a_L5({ renderFeatured, renderStandard }: ComboLayoutProps = {}) {
  const [s0, s1, s2, s3] = supportProjects;
  return (
    <Page1120>
      <div style={{ marginBottom: 48 }}>
        {renderFeatured ? renderFeatured(primaryProject) : <FH_A project={primaryProject} />}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: 32,
          marginBottom: 32,
        }}
      >
        {renderStandard ? renderStandard(s0) : <SV_A project={s0} />}
        {renderStandard ? renderStandard(s1) : <SV_A project={s1} />}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 2fr',
          gap: 32,
        }}
      >
        {renderStandard ? renderStandard(s2) : <SV_A project={s2} />}
        {renderStandard ? renderStandard(s3) : <SV_A project={s3} />}
      </div>
    </Page1120>
  );
}
