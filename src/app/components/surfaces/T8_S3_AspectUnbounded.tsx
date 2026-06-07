import React from 'react';
import { SurfacePage } from './SurfacePage';
import { IS } from '../cards/tokens';
import { Media } from '../cards/Media';
import { PillCTA } from '../cards/PillCTA';
import { TagList } from '../cards/TagList';
import { ProofBlock } from '../cards/ProofBlock';
import {
  useTitleStyle,
  useCaptionStyle,
  useImageTreatmentStyle,
  useAuthoredAspect,
  useDividerBorder,
  useCardFrameVisible,
} from '../cards/identityStyle';
import type { StandardShell } from './candidates';
import { primaryProject, supportProjects } from '../../data/projects';
import type { Project } from '../../data/projects';

// T8-S3 Aspect-Variant Unbounded — billguo.me-adjacent register.
// Still no card chrome, but each tile holds its own authored aspect.
// Featured uses a narrow 21:9 band; Standards cycle 4:3 / 1:1 / 3:4 across
// the three slots so rhythm is carried by aspect variance within the grid.
// Identity toggles wired: title / caption / image treatment / aspect variance
// (native = 'authored' — the whole point of this surface) / divider (the
// caption's borderTop rule).

const SUPPORT_ASPECTS: string[] = ['4 / 3', '1 / 1', '3 / 4'];

function AspectFeatured({ project: p = primaryProject }: { project?: Project } = {}) {
  const titleStyle = useTitleStyle('default');
  const captionStyle = useCaptionStyle('default');
  const imageStyle = useImageTreatmentStyle('plain');
  const aspectOverride = useAuthoredAspect('21 / 9', 'authored');
  const dividerBorder = useDividerBorder('section');
  const frameVisible = useCardFrameVisible('off');
  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        backgroundColor: frameVisible ? 'var(--dir-raised)' : 'transparent',
        border: frameVisible ? '1px solid var(--dir-border)' : undefined,
        padding: frameVisible ? 24 : 0,
      }}
    >
      <div style={{ ...imageStyle }}>
        <Media project={p} role="Featured" style={{ aspectRatio: aspectOverride ?? 'auto' }} />
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '280px 1fr auto',
          gap: 48,
          alignItems: 'start',
          borderTop: dividerBorder,
          paddingTop: 16,
        }}
      >
        <div>
          <p
            style={{
              fontFamily: IS,
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--dir-text-primary)',
              margin: 0,
              marginBottom: 4,
              ...captionStyle,
            }}
          >
            {p.label}
          </p>
          <p
            style={{
              fontFamily: IS,
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--dir-detail)',
              margin: 0,
              ...captionStyle,
            }}
          >
            {p.typeTag} · {p.labelMeta}
          </p>
        </div>
        <div>
          <h2
            style={{
              fontFamily: IS,
              fontSize: 22,
              fontWeight: 600,
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
              color: 'var(--dir-text-primary)',
              margin: 0,
              marginBottom: 8,
              ...titleStyle,
            }}
          >
            {p.title}
          </h2>
          <p
            style={{
              fontFamily: IS,
              fontSize: 13,
              fontWeight: 300,
              lineHeight: 1.65,
              color: 'var(--dir-text-secondary)',
              margin: 0,
              marginBottom: 12,
              maxWidth: 520,
              ...captionStyle,
            }}
          >
            {p.framingCompressed}
          </p>
          <TagList tags={p.tags} typeTag={p.typeTag} max={3} />
        </div>
        <div style={{ paddingTop: 4 }}>
          <PillCTA variant="text">{p.ctaPrimary} →</PillCTA>
        </div>
      </div>
    </div>
  );
}

function AspectStandard({
  project,
  aspect,
  mediaAspect,
  mediaHeight,
}: {
  project: Project;
  aspect: string;
  mediaAspect?: string;
  mediaHeight?: number;
}) {
  const titleStyle = useTitleStyle('default');
  const captionStyle = useCaptionStyle('default');
  const imageStyle = useImageTreatmentStyle('plain');
  const aspectOverride = useAuthoredAspect(mediaAspect ?? aspect, 'authored');
  const dividerBorder = useDividerBorder('section');
  const frameVisible = useCardFrameVisible('off');
  const mediaStyle: React.CSSProperties = mediaHeight
    ? { height: mediaHeight, aspectRatio: 'auto' }
    : { aspectRatio: aspectOverride ?? 'auto' };
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: frameVisible ? 'var(--dir-raised)' : 'transparent',
        border: frameVisible ? '1px solid var(--dir-border)' : undefined,
        padding: frameVisible ? 16 : 0,
      }}
    >
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', marginBottom: 12 }}>
        <div style={{ ...imageStyle, width: '100%' }}>
          <Media project={project} role="Standard" style={mediaStyle} />
        </div>
      </div>
      <div style={{ borderTop: dividerBorder, paddingTop: 12 }}>
        <p
          style={{
            fontFamily: IS,
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--dir-detail)',
            margin: 0,
            marginBottom: 4,
            ...captionStyle,
          }}
        >
          {project.label} · {project.labelMeta}
        </p>
        <h3
          style={{
            fontFamily: IS,
            fontSize: 15,
            fontWeight: 600,
            lineHeight: 1.25,
            letterSpacing: '-0.015em',
            color: 'var(--dir-text-primary)',
            margin: 0,
            marginBottom: 4,
            ...titleStyle,
          }}
        >
          {project.title}
        </h3>
        <p
          style={{
            fontFamily: IS,
            fontSize: 12,
            fontWeight: 300,
            lineHeight: 1.55,
            color: 'var(--dir-text-secondary)',
            margin: 0,
            marginBottom: 8,
            ...captionStyle,
          }}
        >
          {project.framingEditorial}
        </p>
        <TagList tags={project.tags} typeTag={project.typeTag} max={2} size="compact" nativeMode="hidden" />
        <ProofBlock
          project={project}
          visibleNative="off"
          placementNative="inline"
          divider={dividerBorder}
          register="standard"
          style={{ marginTop: 8 }}
        />
      </div>
    </div>
  );
}

export function T8_S3({ standardShell = 'sv-a' }: { standardShell?: StandardShell } = {}) {
  const supports = supportProjects.slice(0, 3);
  return (
    <SurfacePage
      featured={<AspectFeatured />}
      standards={supports.map((p, i) => (
        <AspectStandard project={p} aspect={SUPPORT_ASPECTS[i]} />
      ))}
    />
  );
}

export const T8_S3_renderers = {
  featured: (project: Project) => <AspectFeatured project={project} />,
  standard: (project: Project, opts?: { mediaAspect?: string; mediaHeight?: number }) =>
    <AspectStandard project={project} aspect={SUPPORT_ASPECTS[0]} mediaAspect={opts?.mediaAspect} mediaHeight={opts?.mediaHeight} />,
};
