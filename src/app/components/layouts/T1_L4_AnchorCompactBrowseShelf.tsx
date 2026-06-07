import React from 'react';
import { Page1120 } from './PageInset';
import { IS } from '../cards/tokens';
import { FH_A } from '../shells/FH_A';
import { SV_A } from '../shells/SV_A';
import { primaryProject, supportProjects } from '../../data/projects';
import type { ComboLayoutProps } from '../combo/composition';

// T1-L4 Anchor + Compact Browse Shelf:
// FH-B anchor + 3-up SV-A shelf above the fold; remaining projects deferred
// below the fold marker. Above-fold support count capped at 3 (collapse
// trigger: ≥ 4 → reverts to T1-L1).
export function T1_L4({ renderFeatured, renderStandard }: ComboLayoutProps = {}) {
  const shelf = supportProjects.slice(0, 3);
  const belowFold = supportProjects.slice(3);
  return (
    <Page1120>
      <div style={{ marginBottom: 48 }}>
        {renderFeatured ? renderFeatured(primaryProject) : <FH_A project={primaryProject} />}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16,
        }}
      >
        {shelf.map((p) => (
          <React.Fragment key={p.id}>
            {renderStandard ? renderStandard(p) : <SV_A project={p} />}
          </React.Fragment>
        ))}
      </div>
      <div
        style={{
          marginTop: 96,
          paddingTop: 24,
          borderTop: '1px solid var(--dir-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
        }}
      >
        <p
          style={{
            fontFamily: IS,
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--dir-text-secondary)',
            margin: 0,
          }}
        >
          Below the fold · {belowFold.length} more projects
        </p>
        <p
          style={{
            fontFamily: IS,
            fontSize: 11,
            fontWeight: 400,
            color: 'var(--dir-detail)',
            margin: 0,
          }}
        >
          scroll to continue
        </p>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 24,
          marginTop: 48,
        }}
      >
        {belowFold.map((p) => (
          <React.Fragment key={p.id}>
            {renderStandard ? renderStandard(p) : <SV_A project={p} />}
          </React.Fragment>
        ))}
      </div>
    </Page1120>
  );
}
