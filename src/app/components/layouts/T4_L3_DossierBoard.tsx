import React from 'react';
import { Page1280 } from './PageInset';
import { IS } from '../cards/tokens';
import { FH_B } from '../shells/FH_B';
import { SV_A } from '../shells/SV_A';
import { primaryProject, supportProjects } from '../../data/projects';
import type { ComboLayoutProps } from '../combo/composition';

// T4-L3 Dossier Board:
// FH-B + 4 SV-As as pinned records on a board. Board ground = --dir-recessed
// (surface tone shift signals "board" without full exception inversion).
// Per layout-bank principle 8: catalog register normally depends on Axis B
// surface language (labels / tags / dates / provenance). With layout-only
// dossier composition, the candidate may collapse toward T1-L1 or T4-L2 —
// that cross-axis risk is explicit in the research bank and held here.
export function T4_L3({ renderFeatured, renderStandard }: ComboLayoutProps = {}) {
  const s = supportProjects;
  return (
    <div style={{ backgroundColor: 'var(--dir-recessed)' }}>
      <Page1280>
        <div
          style={{
            position: 'relative',
            aspectRatio: '1280 / 1100',
            padding: 24,
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
              marginBottom: 24,
            }}
          >
            Dossier board · record register (Axis B surface language deferred)
          </p>
          <div
            style={{
              position: 'absolute',
              left: '1.875%',
              top: '6.55%',
              width: '59.375%',
            }}
          >
            {renderFeatured ? renderFeatured(primaryProject) : <FH_B project={primaryProject} />}
          </div>
          <div
            style={{
              position: 'absolute',
              right: '1.875%',
              top: '10.9%',
              width: '26.5625%',
            }}
          >
            {renderStandard ? renderStandard(s[0]) : <SV_A project={s[0]} />}
          </div>
          <div
            style={{
              position: 'absolute',
              left: '5%',
              top: '47.27%',
              width: '28.125%',
            }}
          >
            {renderStandard ? renderStandard(s[1]) : <SV_A project={s[1]} />}
          </div>
          <div
            style={{
              position: 'absolute',
              left: '37.5%',
              top: '50.9%',
              width: '25%',
            }}
          >
            {renderStandard ? renderStandard(s[2]) : <SV_A project={s[2]} />}
          </div>
          <div
            style={{
              position: 'absolute',
              right: '3.75%',
              top: '54.55%',
              width: '26.5625%',
            }}
          >
            {renderStandard ? renderStandard(s[3]) : <SV_A project={s[3]} />}
          </div>
        </div>
      </Page1280>
    </div>
  );
}
