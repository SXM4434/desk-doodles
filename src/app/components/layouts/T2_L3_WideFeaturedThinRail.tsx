import React from 'react';
import { Page1120 } from './PageInset';
import { FH_B } from '../shells/FH_B';
import { SV_A } from '../shells/SV_A';
import { primaryProject, supportProjects } from '../../data/projects';
import type { ComboLayoutProps } from '../combo/composition';

// T2-L3 Wide Featured + Thin Support Rail:
// 1120 container split 736 / 48 / 336 = FH-B ~66% + SV-A rail ~30% with 48
// gutter. Rail width 336 is above the 320 legibility floor for SV-A internal
// tier register; below 320, the 4 core card jobs start to compress.
export function T2_L3({ renderFeatured, renderStandard }: ComboLayoutProps = {}) {
  const supports = supportProjects.slice(0, 3);
  return (
    <Page1120>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(520px, 11fr) minmax(280px, 5fr)',
          gap: 48,
          alignItems: 'start',
        }}
      >
        {renderFeatured ? renderFeatured(primaryProject) : <FH_B project={primaryProject} />}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {supports.map((p) => (
            <React.Fragment key={p.id}>
              {renderStandard ? renderStandard(p) : <SV_A project={p} />}
            </React.Fragment>
          ))}
        </div>
      </div>
    </Page1120>
  );
}
