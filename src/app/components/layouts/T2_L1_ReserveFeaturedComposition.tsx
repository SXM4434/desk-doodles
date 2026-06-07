import React from 'react';
import { Page1120 } from './PageInset';
import { FH_B } from '../shells/FH_B';
import { FV_A } from '../shells/FV_A';
import { SV_A } from '../shells/SV_A';
import { projects } from '../../data/projects';
import type { ComboLayoutProps } from '../combo/composition';

// T2-L1 Reserve Featured Composition:
// Primary FH-B full-width + reserve FV-A in its own row at ≥ 2/3 container
// width + SV-A support field. FV-A sits at 75% (840 of 1120 — above its 2/3
// = 746 floor). FV-A's locked placement rule forbids 50/50 / grid / list; this
// layout honors it by giving FV-A its own dedicated row.
export function T2_L1({ renderFeatured, renderStandard }: ComboLayoutProps = {}) {
  const primary = projects[0];
  const reserve = projects[1];
  const supports = projects.slice(2);
  return (
    <Page1120>
      <div style={{ marginBottom: 32 }}>
        {renderFeatured ? renderFeatured(primary) : <FH_B project={primary} />}
      </div>
      <div style={{ marginBottom: 64, width: '75%' }}>
        {renderFeatured ? renderFeatured(reserve) : <FV_A project={reserve} />}
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
