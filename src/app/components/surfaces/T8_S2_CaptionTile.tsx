import React from 'react';
import { SurfacePage } from './SurfacePage';
import { IS, ISe } from '../cards/tokens';
import { Media } from '../cards/Media';
import { TagList } from '../cards/TagList';
import { PillCTA } from '../cards/PillCTA';
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

// T8-S2 Caption Tile — emmiwu.com register.
// Even sparser than T8-S1: only a single mono caps meta line and an ISe
// title below the media. No framing, no CTA, no prose. Weight is carried
// entirely by the media and the rhythm between tiles.
// Identity toggles wired: title / caption / image treatment / aspect variance.
// Title hardcoded ISe italic stays in place under native; dropdown override
// wins when explicitly set. Proof is toggle-on-add (inline placement) so the
// sparse register stays intact unless the recruiter asks for proof.

function CaptionTileFeatured({ project: p = primaryProject }: { project?: Project } = {}) {
  const titleStyle = useTitleStyle('default');
  const captionStyle = useCaptionStyle('default');
  const imageStyle = useImageTreatmentStyle('plain');
  const aspectOverride = useAuthoredAspect('16 / 9', 'authored');
  const proofDivider = useDividerBorder('section');
  const frameVisible = useCardFrameVisible('off');
  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
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
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 48,
          borderTop: proofDivider,
          paddingTop: 12,
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <p
            style={{
              fontFamily: IS,
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--dir-text-secondary)',
              margin: 0,
              marginBottom: 8,
              ...captionStyle,
            }}
          >
            {p.label} — {p.typeTag} — {p.labelMeta}
          </p>
          <h2
            style={{
              fontFamily: ISe,
              fontStyle: 'italic',
              fontSize: 28,
              fontWeight: 400,
              lineHeight: 1.2,
              letterSpacing: '-0.005em',
              color: 'var(--dir-text-primary)',
              margin: 0,
              ...titleStyle,
            }}
          >
            {p.title}
          </h2>
          <div style={{ marginTop: 12 }}>
            <TagList
              tags={p.tags}
              typeTag={p.typeTag}
              nativeMode="hidden"
            />
          </div>
          <ProofBlock
            project={p}
            visibleNative="off"
            placementNative="inline"
            divider={proofDivider}
            register="featured"
            style={{ marginTop: 12 }}
          />
          <div style={{ marginTop: 12 }}>
            <PillCTA nativeMode="hidden">{p.ctaPrimary} →</PillCTA>
          </div>
        </div>
        <span
          style={{
            fontFamily: IS,
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--dir-detail)',
            flexShrink: 0,
            alignSelf: 'flex-end',
          }}
        >
          01 / {String(supportProjects.length + 1).padStart(2, '0')}
        </span>
      </div>
    </div>
  );
}

function CaptionTileStandard({
  project,
  index,
  mediaAspect,
  mediaHeight,
}: {
  project: Project;
  index: number;
  mediaAspect?: string;
  mediaHeight?: number;
}) {
  const titleStyle = useTitleStyle('default');
  const captionStyle = useCaptionStyle('default');
  const imageStyle = useImageTreatmentStyle('plain');
  const aspectOverride = useAuthoredAspect(mediaAspect ?? '4 / 3', 'authored');
  const proofDivider = useDividerBorder('section');
  const frameVisible = useCardFrameVisible('off');
  const mediaStyle: React.CSSProperties = mediaHeight
    ? { height: mediaHeight, aspectRatio: 'auto' }
    : { aspectRatio: aspectOverride ?? 'auto' };
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        backgroundColor: frameVisible ? 'var(--dir-raised)' : 'transparent',
        border: frameVisible ? '1px solid var(--dir-border)' : undefined,
        padding: frameVisible ? 16 : 0,
      }}
    >
      <div style={{ ...imageStyle }}>
        <Media project={project} role="Standard" style={mediaStyle} />
      </div>
      <div style={{ borderTop: proofDivider, paddingTop: 10 }}>
        <p
          style={{
            fontFamily: IS,
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--dir-detail)',
            margin: 0,
            marginBottom: 4,
            ...captionStyle,
          }}
        >
          {String(index + 2).padStart(2, '0')} — {project.label}
        </p>
        <h3
          style={{
            fontFamily: ISe,
            fontStyle: 'italic',
            fontSize: 20,
            fontWeight: 400,
            lineHeight: 1.25,
            letterSpacing: '-0.005em',
            color: 'var(--dir-text-primary)',
            margin: 0,
            ...titleStyle,
          }}
        >
          {project.title}
        </h3>
        <div style={{ marginTop: 8 }}>
          <TagList
            tags={project.tags}
            typeTag={project.typeTag}
            size="compact"
            nativeMode="hidden"
          />
        </div>
        <ProofBlock
          project={project}
          visibleNative="off"
          placementNative="inline"
          divider={proofDivider}
          register="standard"
          style={{ marginTop: 8 }}
        />
        <div style={{ marginTop: 8 }}>
          <PillCTA nativeMode="hidden">{project.ctaPrimary} →</PillCTA>
        </div>
      </div>
    </div>
  );
}

export function T8_S2({ standardShell = 'sv-a' }: { standardShell?: StandardShell } = {}) {
  const supports = supportProjects.slice(0, 3);
  return (
    <SurfacePage
      featured={<CaptionTileFeatured />}
      standards={supports.map((p, i) => <CaptionTileStandard project={p} index={i} />)}
    />
  );
}

export const T8_S2_renderers = {
  featured: (project: Project) => <CaptionTileFeatured project={project} />,
  standard: (project: Project, opts?: { mediaAspect?: string; mediaHeight?: number }) =>
    <CaptionTileStandard project={project} index={0} mediaAspect={opts?.mediaAspect} mediaHeight={opts?.mediaHeight} />,
};
