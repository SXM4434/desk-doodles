import React from 'react';
import { Page1280 } from './PageInset';
import { FH_A } from '../shells/FH_A';
import { SV_A } from '../shells/SV_A';
import { primaryProject, supportProjects } from '../../data/projects';
import type { ComboLayoutProps } from '../combo/composition';

// T4-L1 Floating Islands:
// FH-B as primary island + SV-As as satellites with ladder "rare" gaps
// (80 / 96 / 128). 1280 canvas gives the field enough negative space. Islands
// land on grid positions at ladder-value vertical anchors (128-step multiples)
// and uniform 320 satellite widths — fewer spacing jumps than the prior pass.
export function T4_L1({ renderFeatured, renderStandard }: ComboLayoutProps = {}) {
  const s = supportProjects;
  return (
    <Page1280>
      <div style={{ position: 'relative', aspectRatio: '1280 / 1600' }}>
        <div style={{ position: 'absolute', left: '7.5%', top: '0%', width: '68.75%' }}>
          {renderFeatured ? renderFeatured(primaryProject) : <FH_A project={primaryProject} />}
        </div>
        <div style={{ position: 'absolute', right: '0%', top: '8%', width: '25%' }}>
          {renderStandard ? renderStandard(s[0]) : <SV_A project={s[0]} />}
        </div>
        <div style={{ position: 'absolute', left: '0%', top: '40%', width: '25%' }}>
          {renderStandard ? renderStandard(s[1]) : <SV_A project={s[1]} />}
        </div>
        <div style={{ position: 'absolute', left: '40%', top: '48%', width: '25%' }}>
          {renderStandard ? renderStandard(s[2]) : <SV_A project={s[2]} />}
        </div>
        <div style={{ position: 'absolute', right: '10%', top: '72%', width: '25%' }}>
          {renderStandard ? renderStandard(s[3]) : <SV_A project={s[3]} />}
        </div>
      </div>
    </Page1280>
  );
}
