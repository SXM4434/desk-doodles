import React from 'react';
import { Page1120 } from '../layouts/PageInset';
import { FH_A } from '../shells/FH_A';
import { SV_A } from '../shells/SV_A';
import { primaryProject, supportProjects } from '../../data/projects';
import type { ComboLayoutProps } from '../combo/composition';
import { IdentityAside } from './IdentityAside';

// Family B · V3 Asymmetric Rows — Identity + Work Field with asymmetric
// paired rows inside the work column. Sticky typographic aside + work
// column. Inside the work column: FH-A hero + two rows at 3/2 then 2/3
// flex ratios with authored per-tile aspects (1512:1024, 4:5, 1:1, 16:9). Pressure case — work column
// ~627px yields ~238px narrow-side tiles; aspect authoring carries rhythm.
export function FamilyB_V3AsymRows({ renderFeatured, renderStandard, renderHero }: ComboLayoutProps = {}) {
  const [s0, s1, s2, s3] = supportProjects;

  const renderTile = (p: typeof s0, aspect: string) =>
    renderStandard
      ? renderStandard(p, { mediaAspect: aspect })
      : <SV_A project={p} mediaAspect={aspect} />;

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    gap: 24,
    alignItems: 'flex-start',
  };

  return (
    <Page1120>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(288px, 5fr) minmax(512px, 9fr)',
          gap: 48,
          alignItems: 'start',
        }}
      >
        {renderHero ? renderHero() : <IdentityAside />}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {renderFeatured ? renderFeatured(primaryProject) : <FH_A project={primaryProject} />}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <div style={rowStyle}>
              <div style={{ flex: 3, minWidth: 0 }}>{renderTile(s0, '1512 / 1024')}</div>
              <div style={{ flex: 2, minWidth: 0 }}>{renderTile(s1, '4 / 5')}</div>
            </div>
            <div style={rowStyle}>
              <div style={{ flex: 2, minWidth: 0 }}>{renderTile(s2, '1 / 1')}</div>
              <div style={{ flex: 3, minWidth: 0 }}>{renderTile(s3, '16 / 9')}</div>
            </div>
          </div>
        </div>
      </div>
    </Page1120>
  );
}
