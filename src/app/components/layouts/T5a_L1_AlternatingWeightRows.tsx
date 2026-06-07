import React from 'react';
import { Page1120 } from './PageInset';
import { SV_A } from '../shells/SV_A';
import { supportProjects } from '../../data/projects';
import type { ComboLayoutProps } from '../combo/composition';

// T5-L1 Alternating Weight Rows:
// Row-to-row weight inversion. Row A 2fr/1fr, Row B 1fr/2fr. No featured
// anchor — asymmetric rhythm carries hierarchy without a hero. Tests
// whether row-level weight inversion reads as composition or as two
// unrelated 2-ups. 4 supports across 2 rows; gap 48.
export function T5a_L1({ renderStandard }: ComboLayoutProps = {}) {
  const [s0, s1, s2, s3] = supportProjects;
  return (
    <Page1120>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: 32,
          marginBottom: 32,
        }}
      >
        {renderStandard ? renderStandard(s0) : <SV_A project={s0} />}
        {renderStandard ? renderStandard(s1) : <SV_A project={s1} />}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 2fr',
          gap: 32,
        }}
      >
        {renderStandard ? renderStandard(s2) : <SV_A project={s2} />}
        {renderStandard ? renderStandard(s3) : <SV_A project={s3} />}
      </div>
    </Page1120>
  );
}
