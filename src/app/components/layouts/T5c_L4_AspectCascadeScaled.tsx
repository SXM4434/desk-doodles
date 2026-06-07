import React from 'react';
import { Page1120 } from './PageInset';
import { IS } from '../cards/tokens';
import { SV_A } from '../shells/SV_A';
import { supportProjects, primaryProject } from '../../data/projects';
import type { ComboLayoutProps } from '../combo/composition';

// T5c-L4 Aspect-Cascade Scaled Sequence:
// Hambidge root-rectangle DNA from T5c-L1 applied along a reading axis.
// A single left-aligned column of 4 tiles where each successive tile
// is scaled by 1/√2 (≈ 0.707) and carries an aspect that matches its
// own root rectangle.
export function T5c_L4({ renderFeatured, renderStandard }: ComboLayoutProps = {}) {
  const renderTile = (p: typeof primaryProject, aspect: string) =>
    renderStandard
      ? renderStandard(p, { mediaAspect: aspect })
      : <SV_A project={p} mediaAspect={aspect} />;

  return (
    <Page1120>
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
          paddingBottom: 16,
          borderBottom: '1px solid var(--dir-border)',
        }}
      >
        Aspect cascade · √2 ratio · sequential scale diminishment
      </p>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 48,
          alignItems: 'flex-start',
        }}
      >
        <div style={{ width: 'min(100%, 1120px)' }}>
          {renderFeatured
            ? renderFeatured(primaryProject)
            : <SV_A project={primaryProject} mediaAspect="1.414 / 1" />}
        </div>
        <div style={{ width: 'min(70.7%, 792px)' }}>
          {renderTile(supportProjects[0], '1 / 1.414')}
        </div>
        <div style={{ width: 'min(50%, 560px)' }}>
          {renderTile(supportProjects[1], '1.414 / 1')}
        </div>
        <div style={{ width: 'min(35.4%, 396px)' }}>
          {renderTile(supportProjects[2], '1 / 1.414')}
        </div>
      </div>
    </Page1120>
  );
}
