import React from 'react';
import { SurfacePage } from './SurfacePage';
import { IS } from '../cards/tokens';
import { Media } from '../cards/Media';
import { ProofStat } from '../cards/CardAtoms';
import { TagList } from '../cards/TagList';
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

// T4-S4 Fragment Stack — object assembled from visible fragments (chips,
// strips, plates) held together as one project by alignment + proximity +
// typographic repetition. No outer frame by default; each atom wears its
// own fragment edge. Composition performs the effect, not disassembly of
// content. Identity toggles wired: cardFrame (native off; toggle on wraps
// the stack in a recessed outer mat) / title / caption (chip + prose) /
// image treatment (media fragment frame) / aspect variance / divider (all
// fragment borders route through this, including the media plate) / proof
// (Featured proof column gates; media span expands into the empty column
// so the stack still reads as one object, not a hole).

function FragChip({
  children,
  bg = 'var(--dir-raised)',
  borderStyle,
  captionStyle,
}: {
  children: React.ReactNode;
  bg?: string;
  borderStyle: string;
  captionStyle?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        backgroundColor: bg,
        border: borderStyle,
        padding: '8px 12px',
        fontFamily: IS,
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--dir-text-primary)',
        ...captionStyle,
      }}
    >
      {children}
    </div>
  );
}

function FragmentStackFeatured({ project: p = primaryProject }: { project?: Project } = {}) {
  const titleStyle = useTitleStyle('default');
  const captionStyle = useCaptionStyle('default');
  const imageStyle = useImageTreatmentStyle('plain');
  const aspectOverride = useAuthoredAspect('16 / 10', 'uniform');
  const dividerBorder = useDividerBorder('section');
  const proofVisible = useProofVisible('on');
  const frameVisible = useCardFrameVisible('off');
  return (
    <div
      style={{
        width: '100%',
        minHeight: 500,
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gap: 12,
        backgroundColor: frameVisible ? 'var(--dir-recessed)' : 'transparent',
        border: frameVisible ? '1px solid var(--dir-border)' : undefined,
        padding: frameVisible ? 24 : 0,
      }}
    >
      <div style={{ gridColumn: '1 / span 4', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <FragChip bg="var(--dir-recessed)" borderStyle={dividerBorder} captionStyle={captionStyle}>
          {p.label} · {p.labelMeta}
        </FragChip>
        <div
          style={{
            backgroundColor: 'var(--dir-raised)',
            border: dividerBorder,
            padding: 16,
          }}
        >
          <h2
            style={{
              fontFamily: IS,
              fontSize: 22,
              fontWeight: 500,
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
              color: 'var(--dir-text-primary)',
              margin: 0,
              ...titleStyle,
            }}
          >
            {p.title}
          </h2>
        </div>
        <div
          style={{
            backgroundColor: 'var(--dir-raised)',
            border: dividerBorder,
            padding: 16,
          }}
        >
          <p
            style={{
              fontFamily: IS,
              fontSize: 13,
              fontWeight: 300,
              lineHeight: 1.6,
              color: 'var(--dir-text-secondary)',
              margin: 0,
              ...captionStyle,
            }}
          >
            {p.framingCompressed}
          </p>
        </div>
      </div>
      <div
        style={{
          gridColumn: proofVisible ? '5 / span 5' : '5 / span 8',
          border: dividerBorder,
          display: 'flex',
          ...imageStyle,
        }}
      >
        <Media
          project={p}
          role="Featured"
          style={{ width: '100%', height: '100%', aspectRatio: aspectOverride ?? 'auto' }}
        />
      </div>
      {proofVisible && (
        <div style={{ gridColumn: '10 / span 3', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {p.proof.map((s) => (
            <div
              key={s.label}
              style={{
                backgroundColor: 'var(--dir-raised)',
                border: dividerBorder,
                padding: 16,
              }}
            >
              <ProofStat value={s.value} label={s.label} sub={s.sub} />
            </div>
          ))}
        </div>
      )}
      <div
        style={{
          gridColumn: '1 / span 12',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginTop: 4,
        }}
      >
        <TagList tags={p.tags} typeTag={p.typeTag} max={4} />
        <PillCTA variant="primary">{p.ctaPrimary} →</PillCTA>
      </div>
    </div>
  );
}

function FragmentStackStandard({
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
  const frameVisible = useCardFrameVisible('off');
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
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        height: '100%',
        backgroundColor: frameVisible ? 'var(--dir-recessed)' : 'transparent',
        border: frameVisible ? '1px solid var(--dir-border)' : undefined,
        padding: frameVisible ? 16 : 0,
      }}
    >
      <FragChip bg="var(--dir-recessed)" borderStyle={dividerBorder} captionStyle={captionStyle}>
        {project.typeTag}
      </FragChip>
      <div style={{ border: dividerBorder, ...imageStyle }}>
        <Media project={project} role="Standard" style={mediaStyle} />
      </div>
      <div
        style={{
          backgroundColor: 'var(--dir-raised)',
          border: dividerBorder,
          padding: 16,
        }}
      >
        <h3
          style={{
            fontFamily: IS,
            fontSize: 18,
            fontWeight: 500,
            lineHeight: 1.25,
            letterSpacing: '-0.015em',
            color: 'var(--dir-text-primary)',
            margin: 0,
            ...titleStyle,
          }}
        >
          {project.title}
        </h3>
      </div>
      <div
        style={{
          backgroundColor: 'var(--dir-raised)',
          border: dividerBorder,
          padding: 16,
        }}
      >
        <p
          style={{
            fontFamily: IS,
            fontSize: 13,
            fontWeight: 300,
            lineHeight: 1.55,
            color: 'var(--dir-text-secondary)',
            margin: 0,
            ...captionStyle,
          }}
        >
          {project.framingCompressed}
        </p>
      </div>
      <TagList tags={project.tags} typeTag={project.typeTag} max={3} />
      <div style={{ marginTop: 'auto' }}>
        <PillCTA variant="text">{project.ctaPrimary} →</PillCTA>
      </div>
    </div>
  );
}

export function T4_S4() {
  const supports = supportProjects.slice(0, 3);
  return (
    <SurfacePage
      featured={<FragmentStackFeatured />}
      standards={supports.map((p) => <FragmentStackStandard project={p} />)}
    />
  );
}

export const T4_S4_renderers = {
  featured: (project: Project) => <FragmentStackFeatured project={project} />,
  standard: (project: Project, opts?: { mediaAspect?: string; mediaHeight?: number }) =>
    <FragmentStackStandard project={project} mediaAspect={opts?.mediaAspect} mediaHeight={opts?.mediaHeight} />,
};
