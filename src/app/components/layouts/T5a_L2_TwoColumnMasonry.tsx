import React from 'react';
import { Page1120 } from './PageInset';
import { FH_A } from '../shells/FH_A';
import { SV_A } from '../shells/SV_A';
import { primaryProject, supportProjects } from '../../data/projects';
import type { ComboLayoutProps } from '../combo/composition';

// T5-L2 Two-Column Masonry:
// Rachelchen.tech pattern. Two independent columns advance by content
// height, row registration abandoned. Implemented via CSS `columns: 2`
// + `break-inside: avoid` so each card claims its own flow position.
// Authored per-slot aspect variance (4:3 / 1:1 / 3:4 / 16:9) surfaces
// the advance-mismatch principle — uniform placeholder aspects mute it.
// FH-A hero anchors at top (outside the masonry flow).
export function T5a_L2({ renderFeatured, renderStandard }: ComboLayoutProps = {}) {
  const [s0, s1, s2, s3] = supportProjects;
  const tiles: Array<{ project: typeof s0; aspect: string }> = [
    { project: s0, aspect: '4 / 3' },
    { project: s1, aspect: '1 / 1' },
    { project: s2, aspect: '3 / 4' },
    { project: s3, aspect: '16 / 9' },
  ];
  return (
    <Page1120>
      <div style={{ marginBottom: 48 }}>
        {renderFeatured ? renderFeatured(primaryProject) : <FH_A project={primaryProject} />}
      </div>
      <div
        style={{
          columns: 2,
          columnGap: 32,
        }}
      >
        {tiles.map((t) => (
          <div
            key={t.project.id}
            style={{ breakInside: 'avoid', marginBottom: 32 }}
          >
            {renderStandard
              ? renderStandard(t.project, { mediaAspect: t.aspect })
              : <SV_A project={t.project} mediaAspect={t.aspect} />}
          </div>
        ))}
      </div>
    </Page1120>
  );
}
