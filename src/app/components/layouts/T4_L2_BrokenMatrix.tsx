import React from 'react';
import { Page1120 } from './PageInset';
import { FH_A } from '../shells/FH_A';
import { SV_A } from '../shells/SV_A';
import { primaryProject, supportProjects } from '../../data/projects';
import type { ComboLayoutProps } from '../combo/composition';

// T4-L2 Broken Matrix / Collage Field:
// 12-col grid skeleton stays visible via a faint repeating column-boundary
// gradient underneath the cards; cards land on column boundaries but vertical
// offsets rupture the row rhythm at ladder values (48 / 64 / 96). The
// underlying grid reads as a ruled skeleton — disruption *against* the grid,
// not *within* it (that would be T3-L1 stagger).
export function T4_L2({ renderFeatured, renderStandard }: ComboLayoutProps = {}) {
  const s = supportProjects;
  const skeletonBg =
    'repeating-linear-gradient(to right, var(--dir-border) 0 1px, transparent 1px calc(100% / 12))';
  return (
    <Page1120>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          columnGap: 16,
          rowGap: 0,
          backgroundImage: skeletonBg,
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          padding: '24px 0',
        }}
      >
        <div style={{ gridColumn: '1 / span 8' }}>
          {renderFeatured ? renderFeatured(primaryProject) : <FH_A project={primaryProject} />}
        </div>
        <div style={{ gridColumn: '9 / span 4', marginTop: 64 }}>
          {renderStandard ? renderStandard(s[0]) : <SV_A project={s[0]} />}
        </div>
        <div style={{ gridColumn: '1 / span 4', marginTop: 96 }}>
          {renderStandard ? renderStandard(s[1]) : <SV_A project={s[1]} />}
        </div>
        <div style={{ gridColumn: '6 / span 4', marginTop: 48 }}>
          {renderStandard ? renderStandard(s[2]) : <SV_A project={s[2]} />}
        </div>
        <div style={{ gridColumn: '10 / span 3', marginTop: 0 }}>
          {renderStandard ? renderStandard(s[3]) : <SV_A project={s[3]} />}
        </div>
      </div>
    </Page1120>
  );
}
