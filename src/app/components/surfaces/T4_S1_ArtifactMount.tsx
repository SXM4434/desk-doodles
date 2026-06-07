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

// T4-S1 Artifact Mount — display-register mount. Media held at formal
// distance with generous surrounding mat; content flips role into wall-label
// register (smaller, quieter, serving the artifact). Outer frame uses
// recessed ground; media centered on raised inner plate.
// Identity toggles wired: cardFrame (native on; off strips outer mat ground
// but inner raised-plate mat stays — it IS the display mount) / title /
// caption / image treatment (on the raised plate wrapping media) / aspect
// variance / divider (plate border) / proof.

function ArtifactMountFeatured({ project: p = primaryProject }: { project?: Project } = {}) {
  const titleStyle = useTitleStyle('default');
  const captionStyle = useCaptionStyle('default');
  const imageStyle = useImageTreatmentStyle('plain');
  const aspectOverride = useAuthoredAspect('16 / 10', 'authored');
  const dividerBorder = useDividerBorder('section');
  const proofVisible = useProofVisible('on');
  const frameVisible = useCardFrameVisible('on');
  return (
    <div
      style={{
        width: '100%',
        minHeight: 540,
        backgroundColor: frameVisible ? 'var(--dir-recessed)' : 'transparent',
        border: frameVisible ? '1px solid var(--dir-border)' : 'none',
        padding: frameVisible ? 48 : 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 32,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 720,
          backgroundColor: 'var(--dir-raised)',
          border: dividerBorder,
          padding: 16,
          ...imageStyle,
        }}
      >
        <Media project={p} role="Featured" style={{ width: '100%', aspectRatio: aspectOverride ?? '16/10' }} />
      </div>
      <div
        style={{
          width: '100%',
          maxWidth: 720,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 12,
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
            margin: 0,
            ...captionStyle,
          }}
        >
          {p.label} · {p.labelMeta}
        </p>
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
        <p
          style={{
            fontFamily: IS,
            fontSize: 13,
            fontWeight: 300,
            lineHeight: 1.65,
            color: 'var(--dir-text-secondary)',
            maxWidth: 520,
            margin: 0,
            ...captionStyle,
          }}
        >
          {p.framingCompressed}
        </p>
        {proofVisible && (
          <div style={{ display: 'flex', gap: 48, marginTop: 12 }}>
            {p.proof.map((s) => (
              <ProofStat key={s.label} value={s.value} label={s.label} sub={s.sub} />
            ))}
          </div>
        )}
        <TagList
          tags={p.tags}
          typeTag={p.typeTag}
          align="left"
          nativeMode="hidden"
        />
        <div style={{ marginTop: 16 }}>
          <PillCTA variant="text">{p.ctaPrimary} →</PillCTA>
        </div>
      </div>
    </div>
  );
}

function ArtifactMountStandard({
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
        alignItems: 'center',
        height: '100%',
        gap: 16,
      }}
    >
      <div
        style={{
          width: '100%',
          backgroundColor: 'var(--dir-raised)',
          border: dividerBorder,
          padding: 8,
          ...imageStyle,
        }}
      >
        <Media project={project} role="Standard" style={mediaStyle} />
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 4,
          width: '100%',
          flex: 1,
        }}
      >
        <p
          style={{
            fontFamily: IS,
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--dir-detail)',
            margin: 0,
            ...captionStyle,
          }}
        >
          {project.typeTag}
        </p>
        <h3
          style={{
            fontFamily: IS,
            fontSize: 15,
            fontWeight: 500,
            lineHeight: 1.3,
            letterSpacing: '-0.01em',
            color: 'var(--dir-text-primary)',
            margin: 0,
            ...titleStyle,
          }}
        >
          {project.title}
        </h3>
        <p
          style={{
            fontFamily: IS,
            fontSize: 11,
            fontWeight: 300,
            lineHeight: 1.55,
            color: 'var(--dir-text-secondary)',
            margin: 0,
            maxWidth: 240,
            ...captionStyle,
          }}
        >
          {project.framingCompressed}
        </p>
        <TagList
          tags={project.tags}
          typeTag={project.typeTag}
          size="compact"
          nativeMode="hidden"
        />
        <div style={{ marginTop: 'auto', paddingTop: 12 }}>
          <PillCTA variant="text">{project.ctaPrimary} →</PillCTA>
        </div>
      </div>
    </div>
  );
}

export function T4_S1() {
  const supports = supportProjects.slice(0, 3);
  return (
    <SurfacePage
      featured={<ArtifactMountFeatured />}
      standards={supports.map((p) => <ArtifactMountStandard project={p} />)}
    />
  );
}

export const T4_S1_renderers = {
  featured: (project: Project) => <ArtifactMountFeatured project={project} />,
  standard: (project: Project, opts?: { mediaAspect?: string; mediaHeight?: number }) =>
    <ArtifactMountStandard project={project} mediaAspect={opts?.mediaAspect} mediaHeight={opts?.mediaHeight} />,
};
