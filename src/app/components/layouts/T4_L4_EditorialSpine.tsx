import React from 'react';
import { Page1120 } from './PageInset';
import { IS, ISe } from '../cards/tokens';
import { FH_A } from '../shells/FH_A';
import { SV_A } from '../shells/SV_A';
import { primaryProject, supportProjects } from '../../data/projects';
import type { ComboLayoutProps } from '../combo/composition';

// T4-L4 Editorial Spine + Side Interruptions:
// Central typographic spine (384) anchors; FH-B + SV-As interrupt from both
// sides at staggered vertical anchors. Axial composition — divides across a
// line, not alongside one (distinct from T3-L3 bilateral columns). The spine
// is non-project reading content; side interruptions carry the work field.
// Left 368 / spine 384 / right 368 = 1120 (no gutter; the spine acts as gutter).
export function T4_L4({ renderFeatured, renderStandard }: ComboLayoutProps = {}) {
  const s = supportProjects;
  return (
    <Page1120>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 23fr) minmax(0, 24fr) minmax(0, 23fr)',
          gap: 0,
          alignItems: 'start',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 64,
            paddingTop: 96,
          }}
        >
          {renderStandard ? renderStandard(s[0]) : <SV_A project={s[0]} />}
          {renderStandard ? renderStandard(s[2]) : <SV_A project={s[2]} />}
        </div>

        <aside
          style={{
            paddingLeft: 24,
            paddingRight: 24,
            borderLeft: '1px solid var(--dir-border)',
            borderRight: '1px solid var(--dir-border)',
          }}
        >
          <p
            style={{
              fontFamily: IS,
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--dir-text-secondary)',
              margin: 0,
              marginBottom: 16,
            }}
          >
            Editorial spine · reading register
          </p>
          <h1
            style={{
              fontFamily: ISe,
              fontSize: 22,
              fontWeight: 400,
              lineHeight: 1.3,
              letterSpacing: '-0.015em',
              color: 'var(--dir-text-primary)',
              margin: 0,
              marginBottom: 32,
            }}
          >
            The work this page is indexing was made under specific constraints.
          </h1>
          <p
            style={{
              fontFamily: IS,
              fontSize: 13,
              fontWeight: 300,
              lineHeight: 1.75,
              color: 'var(--dir-text-secondary)',
              margin: 0,
              marginBottom: 24,
            }}
          >
            Axial composition: the page is divided across a central reading
            column. Project cards interrupt the spine from the sides rather
            than sitting beside it as co-anchors. The flirtation with
            narrative mode is deliberate — T4-L4 exists to bound where the
            homepage stops behaving as a work index and starts behaving as
            a story page.
          </p>
          <p
            style={{
              fontFamily: IS,
              fontSize: 13,
              fontWeight: 300,
              lineHeight: 1.75,
              color: 'var(--dir-text-secondary)',
              margin: 0,
              marginBottom: 48,
            }}
          >
            If the spine outgrows the interruptions, the page collapses toward
            about-page behavior (convergence to T2-L4). If the spine shrinks
            to an eyebrow, the axial read weakens back into bilateral
            co-anchor mode.
          </p>
          {renderFeatured ? renderFeatured(primaryProject) : <FH_A project={primaryProject} />}
        </aside>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 64,
            paddingTop: 48,
          }}
        >
          {renderStandard ? renderStandard(s[1]) : <SV_A project={s[1]} />}
          {renderStandard ? renderStandard(s[3]) : <SV_A project={s[3]} />}
        </div>
      </div>
    </Page1120>
  );
}
