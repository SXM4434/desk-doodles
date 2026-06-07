import React from 'react';
import { SurfacePage } from './SurfacePage';
import { IS, ISe } from '../cards/tokens';
import { Media } from '../cards/Media';
import { PillCTA } from '../cards/PillCTA';
import {
  useTitleStyle,
  useCaptionStyle,
  useImageTreatmentStyle,
  useAuthoredAspect,
  useDividerBorder,
  useProofVisible,
  useCardFrameVisible,
} from '../cards/identityStyle';
import { primaryProject, supportProjects, type Project } from '../../data/projects';
import { TagList } from '../cards/TagList';
import type { StandardShell } from './candidates';

// T4-S2 Gallery Placard Surface — three-tier museum label grammar:
// intro (role/year) / tombstone (title/material/scope) / caption (framing).
// Placard is a detached formal block alongside exhibit-register media.
// Per Step 2 research: real placard register is three-tier, not a single block.
// Identity toggles wired: cardFrame (native on; off strips outer mat) / title
// / caption / image treatment (media frame) / aspect variance / divider
// (placard inner rules + plate border) / proof.

function PlacardBlock({
  intro,
  tombstone,
  caption,
  bottom,
  divider,
  captionStyle,
}: {
  intro: string;
  tombstone: React.ReactNode;
  caption: string;
  bottom?: React.ReactNode;
  divider: string;
  captionStyle: React.CSSProperties;
}) {
  return (
    <div
      style={{
        backgroundColor: 'var(--dir-raised)',
        border: divider,
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        height: '100%',
      }}
    >
      <p
        style={{
          fontFamily: IS,
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'var(--dir-detail)',
          borderBottom: divider,
          paddingBottom: 8,
          margin: 0,
          ...captionStyle,
        }}
      >
        {intro}
      </p>
      <div
        style={{
          borderBottom: divider,
          paddingBottom: 12,
        }}
      >
        {tombstone}
      </div>
      <p
        style={{
          fontFamily: ISe,
          fontSize: 13,
          fontWeight: 400,
          fontStyle: 'italic',
          lineHeight: 1.6,
          color: 'var(--dir-text-secondary)',
          margin: 0,
          ...captionStyle,
        }}
      >
        {caption}
      </p>
      {bottom && <div style={{ marginTop: 'auto', paddingTop: 8 }}>{bottom}</div>}
    </div>
  );
}

function GalleryPlacardFeatured({ project: p = primaryProject }: { project?: Project } = {}) {
  const titleStyle = useTitleStyle('default');
  const captionStyle = useCaptionStyle('default');
  const imageStyle = useImageTreatmentStyle('plain');
  const aspectOverride = useAuthoredAspect('16 / 10', 'uniform');
  const dividerBorder = useDividerBorder('section');
  const frameVisible = useCardFrameVisible('on');
  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        minHeight: 500,
        gap: 32,
        backgroundColor: frameVisible ? 'var(--dir-recessed)' : 'transparent',
        border: frameVisible ? '1px solid var(--dir-border)' : 'none',
        padding: frameVisible ? 32 : 0,
      }}
    >
      <div
        style={{
          flex: 1,
          display: 'flex',
          backgroundColor: 'var(--dir-raised)',
          border: dividerBorder,
          ...imageStyle,
        }}
      >
        <Media
          project={p}
          role="Featured"
          style={{ width: '100%', height: '100%', aspectRatio: aspectOverride ?? 'auto' }}
        />
      </div>
      <div style={{ width: 380, flexShrink: 0 }}>
        <PlacardBlock
          divider={dividerBorder}
          captionStyle={captionStyle}
          intro={`${p.label} · ${p.labelMeta}`}
          tombstone={
            <>
              <h2
                style={{
                  fontFamily: IS,
                  fontSize: 22,
                  fontWeight: 500,
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
              <TagList tags={p.tags} typeTag={p.typeTag} max={3} size="compact" nativeMode="hidden" />
            </>
          }
          caption={p.framingCompressed}
          bottom={<PillCTA variant="primary">{p.ctaPrimary} →</PillCTA>}
        />
      </div>
    </div>
  );
}

function GalleryPlacardStandardSvA({
  project,
  mediaAspect,
  mediaHeight,
}: {
  project: (typeof supportProjects)[number];
  mediaAspect?: string;
  mediaHeight?: number;
}) {
  const titleStyle = useTitleStyle('default');
  const captionStyle = useCaptionStyle('default');
  const imageStyle = useImageTreatmentStyle('plain');
  const aspectOverride = useAuthoredAspect(mediaAspect ?? '4 / 3', 'uniform');
  const dividerBorder = useDividerBorder('section');
  const frameVisible = useCardFrameVisible('on');
  const mediaStyle: React.CSSProperties | undefined = mediaHeight
    ? { height: mediaHeight, aspectRatio: 'auto' }
    : aspectOverride
      ? { aspectRatio: aspectOverride }
      : mediaAspect
        ? { aspectRatio: mediaAspect }
        : undefined;
  return (
    <div
      style={{
        backgroundColor: frameVisible ? 'var(--dir-recessed)' : 'transparent',
        border: frameVisible ? '1px solid var(--dir-border)' : 'none',
        padding: frameVisible ? 16 : 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        height: '100%',
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--dir-raised)',
          border: dividerBorder,
          ...imageStyle,
        }}
      >
        <Media project={project} role="Standard" style={mediaStyle} />
      </div>
      <PlacardBlock
        divider={dividerBorder}
        captionStyle={captionStyle}
        intro={project.typeTag}
        tombstone={
          <>
            <h3
              style={{
                fontFamily: IS,
                fontSize: 15,
                fontWeight: 500,
                lineHeight: 1.3,
                letterSpacing: '-0.01em',
                color: 'var(--dir-text-primary)',
                margin: 0,
                marginBottom: 4,
                ...titleStyle,
              }}
            >
              {project.title}
            </h3>
            <TagList tags={project.tags} typeTag={project.typeTag} max={2} size="compact" nativeMode="dot" />
          </>
        }
        caption={project.framingCompressed}
        bottom={<PillCTA variant="text">{project.ctaPrimary} →</PillCTA>}
      />
    </div>
  );
}

function GalleryPlacardStandardSvB({
  project,
  mediaAspect,
  mediaHeight,
}: {
  project: (typeof supportProjects)[number];
  mediaAspect?: string;
  mediaHeight?: number;
}) {
  const titleStyle = useTitleStyle('default');
  const captionStyle = useCaptionStyle('default');
  const imageStyle = useImageTreatmentStyle('plain');
  const aspectOverride = useAuthoredAspect(mediaAspect ?? '4 / 3', 'uniform');
  const dividerBorder = useDividerBorder('section');
  const proofVisible = useProofVisible('on');
  const frameVisible = useCardFrameVisible('on');
  const tiny = project.proof.map((p) => `${p.value} ${p.label}`).join(' · ');
  const mediaStyle: React.CSSProperties | undefined = mediaHeight
    ? { height: mediaHeight, aspectRatio: 'auto' }
    : aspectOverride
      ? { aspectRatio: aspectOverride }
      : mediaAspect
        ? { aspectRatio: mediaAspect }
        : undefined;
  return (
    <div
      style={{
        backgroundColor: frameVisible ? 'var(--dir-recessed)' : 'transparent',
        border: frameVisible ? '1px solid var(--dir-border)' : 'none',
        padding: frameVisible ? 16 : 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        height: '100%',
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--dir-raised)',
          border: dividerBorder,
          ...imageStyle,
        }}
      >
        <Media project={project} role="Standard" style={mediaStyle} />
      </div>
      <PlacardBlock
        divider={dividerBorder}
        captionStyle={captionStyle}
        intro={proofVisible ? tiny : project.typeTag}
        tombstone={
          <>
            <h3
              style={{
                fontFamily: IS,
                fontSize: 15,
                fontWeight: 500,
                lineHeight: 1.3,
                letterSpacing: '-0.01em',
                color: 'var(--dir-text-primary)',
                margin: 0,
                marginBottom: 4,
                ...titleStyle,
              }}
            >
              {project.title}
            </h3>
            <TagList tags={project.tags} typeTag={project.typeTag} max={2} size="compact" nativeMode="hidden" />
          </>
        }
        caption={project.framingCompressed}
        bottom={<PillCTA variant="text">{project.ctaPrimary} →</PillCTA>}
      />
    </div>
  );
}

export function T4_S2({ standardShell = 'sv-a' }: { standardShell?: StandardShell } = {}) {
  const supports = supportProjects.slice(0, 3);
  return (
    <SurfacePage
      featured={<GalleryPlacardFeatured />}
      standards={supports.map((p) =>
        standardShell === 'sv-b'
          ? <GalleryPlacardStandardSvB project={p} />
          : <GalleryPlacardStandardSvA project={p} />,
      )}
    />
  );
}

export const T4_S2_renderers = {
  featured: (project: Project) => <GalleryPlacardFeatured project={project} />,
  standard: (project: Project, opts?: { shell?: StandardShell; mediaAspect?: string; mediaHeight?: number }) =>
    opts?.shell === 'sv-b'
      ? <GalleryPlacardStandardSvB project={project} mediaAspect={opts?.mediaAspect} mediaHeight={opts?.mediaHeight} />
      : <GalleryPlacardStandardSvA project={project} mediaAspect={opts?.mediaAspect} mediaHeight={opts?.mediaHeight} />,
};
