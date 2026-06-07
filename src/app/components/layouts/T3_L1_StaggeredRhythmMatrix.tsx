import React from 'react';
import { Page1120 } from './PageInset';
import { FH_A } from '../shells/FH_A';
import { SV_A } from '../shells/SV_A';
import { primaryProject, supportProjects } from '../../data/projects';
import type { ComboLayoutProps } from '../combo/composition';

// T3-L1 Staggered Rhythm Matrix:
// FH-B anchor; SV-A supports on a 3-col grid with vertical offsets drawn from
// the ladder as a programmatic A-B-C-B rhythm (0 / 24 / 48 / 24). Stagger stays
// within the grid — no fractional spans, no free-floating heights. Above 96
// vertical offset, the rupture starts reading against the grid (T4-L2 territory).
export function T3_L1({ renderFeatured, renderStandard }: ComboLayoutProps = {}) {
  const offsets = [0, 24, 48, 24];
  return (
    <Page1120>
      <div style={{ marginBottom: 48 }}>
        {renderFeatured ? renderFeatured(primaryProject) : <FH_A project={primaryProject} />}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 24,
        }}
      >
        {supportProjects.map((p, i) => (
          <div key={p.id} style={{ marginTop: offsets[i] ?? 0 }}>
            {renderStandard ? renderStandard(p) : <SV_A project={p} />}
          </div>
        ))}
      </div>
    </Page1120>
  );
}
