import React from 'react';
import { Page1120 } from './PageInset';
import { FH_A } from '../shells/FH_A';
import { SV_A } from '../shells/SV_A';
import { primaryProject, supportProjects } from '../../data/projects';
import type { ComboLayoutProps } from '../combo/composition';

// T5-L3 Brick Wall Variance:
// 6-col grid, gap 16. Span pattern rotates per row — 4+2 then 2+4 —
// producing a bento-style brick-wall composition where supports never
// align into a uniform matrix. Authored aspect variance sharpens the
// contrast: wide-span (4-col) cards hold 16:9 landscape; narrow-span
// (2-col) cards hold 3:4 portrait. Distinct from T3-L1 Staggered (which
// keeps uniform spans and offsets vertically) — here the spans and
// the aspects both vary.
export function T5a_L3({ renderFeatured, renderStandard }: ComboLayoutProps = {}) {
  const [s0, s1, s2, s3] = supportProjects;
  return (
    <Page1120>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: 16,
        }}
      >
        <div style={{ gridColumn: 'span 6', marginBottom: 16 }}>
          {renderFeatured ? renderFeatured(primaryProject) : <FH_A project={primaryProject} />}
        </div>
        <div style={{ gridColumn: 'span 4' }}>
          {renderStandard
            ? renderStandard(s0, { mediaAspect: '16 / 9' })
            : <SV_A project={s0} mediaAspect="16 / 9" />}
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          {renderStandard
            ? renderStandard(s1, { mediaAspect: '3 / 4' })
            : <SV_A project={s1} mediaAspect="3 / 4" />}
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          {renderStandard
            ? renderStandard(s2, { mediaAspect: '3 / 4' })
            : <SV_A project={s2} mediaAspect="3 / 4" />}
        </div>
        <div style={{ gridColumn: 'span 4' }}>
          {renderStandard
            ? renderStandard(s3, { mediaAspect: '16 / 9' })
            : <SV_A project={s3} mediaAspect="16 / 9" />}
        </div>
      </div>
    </Page1120>
  );
}
