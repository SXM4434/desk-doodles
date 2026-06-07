import React from 'react';
import { Page1120 } from '../layouts/PageInset';
import { FH_A } from '../shells/FH_A';
import { SV_A } from '../shells/SV_A';
import { primaryProject, supportProjects } from '../../data/projects';
import type { ComboLayoutProps } from '../combo/composition';
import { IdentityAside } from './IdentityAside';

// Family B · V2 Masonry — Identity + Work Field with column-flow masonry
// inside the work column. Sticky typographic aside + work column. Inside
// the work column: FH-A hero + CSS columns:2 masonry with authored per-slot
// aspects (3:2 / 1:1 / 3:4 / 16:9) driving advance-mismatch. Work col ~627px at centered 1120 —
// 2 masonry columns at ~297px each.
export function FamilyB_V2Masonry({ renderFeatured, renderStandard, renderHero }: ComboLayoutProps = {}) {
  const [s0, s1, s2, s3] = supportProjects;
  const tiles: Array<{ project: typeof s0; aspect: string }> = [
    { project: s0, aspect: '3 / 2' },
    { project: s1, aspect: '1 / 1' },
    { project: s2, aspect: '3 / 4' },
    { project: s3, aspect: '16 / 9' },
  ];
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
          <div style={{ columns: 2, columnGap: 24 }}>
            {tiles.map((t) => (
              <div key={t.project.id} style={{ breakInside: 'avoid', marginBottom: 24 }}>
                {renderStandard
                  ? renderStandard(t.project, { mediaAspect: t.aspect })
                  : <SV_A project={t.project} mediaAspect={t.aspect} />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Page1120>
  );
}
