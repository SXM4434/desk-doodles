import React from 'react';
import { Page1120 } from './PageInset';
import { FH_B } from '../shells/FH_B';
import { SV_B } from '../shells/SV_B';
import { primaryProject, supportProjects } from '../../data/projects';
import type { ComboLayoutProps } from '../combo/composition';

// T5-L6 Centerline Editorial Stack (Proof Register):
// Brodovitch-leaning editorial centerline. All cards center-aligned on
// the page vertical axis; widths cascade 1120 → 840 → 560 → 336 at
// root-2-adjacent proportions. Asymmetric rhythm comes from width
// variance, not horizontal offset. Shell register held in proof-led
// B-shells throughout (FH-B + SV-B whole-grid honored) — differentiates
// from T3-L2 Descending Scale Ladder which uses A-shells left-aligned.
export function T5a_L6({ renderFeatured, renderStandard }: ComboLayoutProps = {}) {
  const widths = [840, 560, 336];
  return (
    <Page1120>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 32,
        }}
      >
        <div style={{ width: '100%' }}>
          {renderFeatured ? renderFeatured(primaryProject) : <FH_B project={primaryProject} />}
        </div>
        {supportProjects.slice(0, 3).map((p, i) => (
          <div key={p.id} style={{ width: widths[i] }}>
            {renderStandard ? renderStandard(p, { shell: 'sv-b' }) : <SV_B project={p} />}
          </div>
        ))}
      </div>
    </Page1120>
  );
}
