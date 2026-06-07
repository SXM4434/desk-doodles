import React from 'react';
import { Page1120 } from './PageInset';
import { FH_B } from '../shells/FH_B';
import { SV_B } from '../shells/SV_B';
import { primaryProject, supportProjects } from '../../data/projects';
import type { ComboLayoutProps } from '../combo/composition';

// T3-L2 Descending Scale Ladder:
// Featured on top at 100%. Supports cascade at a crisper even-step descent:
// 840 → 560 → 448 → 336. Smallest tier 336 ≥ SV-A's 320 legibility floor.
// Gap 32 compresses the cascade so the descending register reads tighter.
// Each tier left-aligned (not centered) so the cascade reads as descending
// priority rather than decorative pyramid.
export function T3_L2({ renderFeatured, renderStandard }: ComboLayoutProps = {}) {
  const widths = [840, 560, 448, 336];
  return (
    <Page1120>
      <div style={{ marginBottom: 32 }}>
        {renderFeatured ? renderFeatured(primaryProject) : <FH_B project={primaryProject} />}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        {supportProjects.map((p, i) => (
          <div key={p.id} style={{ width: widths[i] ?? 336 }}>
            {renderStandard ? renderStandard(p, { shell: 'sv-b' }) : <SV_B project={p} />}
          </div>
        ))}
      </div>
    </Page1120>
  );
}
