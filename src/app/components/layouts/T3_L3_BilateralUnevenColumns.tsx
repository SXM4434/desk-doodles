import React from 'react';
import { Page1120 } from './PageInset';
import { FH_A } from '../shells/FH_A';
import { SV_A } from '../shells/SV_A';
import { primaryProject, supportProjects } from '../../data/projects';
import type { ComboLayoutProps } from '../combo/composition';

// T3-L3 Bilateral Uneven Columns:
// 672 / 48 / 400 = wider col 60% / gutter / narrower col 40%.
// FH-B mandatory in wider column (at 400 it would cramp its 52/48 internal
// split against 420 min-height). Wider col: FH-B + 1 SV-A. Narrower col:
// 3 SV-A stacked.
export function T3_L3({ renderFeatured, renderStandard }: ComboLayoutProps = {}) {
  const widerSupport = supportProjects[0];
  const narrowerSupports = supportProjects.slice(1, 4);
  return (
    <Page1120>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 3fr) minmax(0, 2fr)',
          gap: 48,
          alignItems: 'start',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {renderFeatured ? renderFeatured(primaryProject) : <FH_A project={primaryProject} />}
          {renderStandard ? renderStandard(widerSupport) : <SV_A project={widerSupport} />}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {narrowerSupports.map((p) => (
            <React.Fragment key={p.id}>
              {renderStandard ? renderStandard(p) : <SV_A project={p} />}
            </React.Fragment>
          ))}
        </div>
      </div>
    </Page1120>
  );
}
