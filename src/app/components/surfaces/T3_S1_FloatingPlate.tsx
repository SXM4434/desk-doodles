import React from 'react';
import { SurfacePage } from './SurfacePage';
import { IS } from '../cards/tokens';
import { Media } from '../cards/Media';
import { ProjectLabel, TypeTag, ProofStat } from '../cards/CardAtoms';
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
import type { StandardShell } from './candidates';

// T3-S1 Floating Info Plate — content behaves as a floating plate docked over
// media. Media fills the card ground; content plate is inset, offset from the
// media edge, and carries its own tonal/shadow differential so it reads as
// detached. Tier register: same atoms, different structural grammar.
// Identity toggles wired: cardFrame (native on; off strips outer ground but
// plate stays — it's the content holder) / title / caption / image treatment
// (applied to media layer) / aspect variance / divider (plate border) / proof.

function FloatingPlateFeatured({ project: p = primaryProject }: { project?: Project } = {}) {
  const titleStyle = useTitleStyle('default');
  const captionStyle = useCaptionStyle('default');
  const imageStyle = useImageTreatmentStyle('plain');
  const aspectOverride = useAuthoredAspect('16 / 10', 'uniform');
  const dividerBorder = useDividerBorder('section');
  const proofVisible = useProofVisible('on');
  const frameVisible = useCardFrameVisible('on');
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        minHeight: 460,
        backgroundColor: frameVisible ? 'var(--dir-recessed)' : 'transparent',
        border: frameVisible ? '1px solid var(--dir-border)' : 'none',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', inset: 0, ...imageStyle }}>
        <Media
          project={p}
          role="Featured"
          style={{ width: '100%', height: '100%', aspectRatio: aspectOverride ?? 'auto' }}
        />
      </div>
      <div
        style={{
          position: 'absolute',
          right: 40,
          top: 40,
          bottom: 40,
          width: 440,
          backgroundColor: 'var(--dir-raised)',
          border: dividerBorder,
          boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
          padding: 32,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div>
          <ProjectLabel label={p.label} meta={p.labelMeta} />
          <h2
            style={{
              fontFamily: IS,
              fontSize: 22,
              fontWeight: 500,
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
              color: 'var(--dir-text-primary)',
              margin: 0,
              marginBottom: 16,
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
              lineHeight: 1.6,
              color: 'var(--dir-text-secondary)',
              margin: 0,
              ...captionStyle,
            }}
          >
            {p.framingCompressed}
          </p>
        </div>
        <div style={{ marginTop: 'auto', paddingTop: 32 }}>
          {proofVisible && (
            <div style={{ display: 'flex', gap: 32, marginBottom: 16 }}>
              {p.proof.slice(0, 2).map((s) => (
                <ProofStat key={s.label} value={s.value} label={s.label} sub={s.sub} />
              ))}
            </div>
          )}
          <TagList tags={p.tags} typeTag={p.typeTag} max={3} nativeMode="hidden" />
          <div style={{ marginTop: 16 }}>
            <PillCTA variant="primary">{p.ctaPrimary} →</PillCTA>
          </div>
        </div>
      </div>
    </div>
  );
}

function FloatingPlateStandardSvA({
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
  const outerSize: React.CSSProperties = mediaHeight
    ? { height: mediaHeight }
    : aspectOverride
      ? { aspectRatio: aspectOverride, height: 'auto' }
      : mediaAspect
        ? { aspectRatio: mediaAspect, height: 'auto' }
        : { minHeight: 360, height: '100%' };
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        ...outerSize,
        backgroundColor: frameVisible ? 'var(--dir-recessed)' : 'transparent',
        border: frameVisible ? '1px solid var(--dir-border)' : 'none',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', inset: 0, ...imageStyle }}>
        <Media
          project={project}
          role="Standard"
          style={{ width: '100%', height: '100%', aspectRatio: 'auto' }}
        />
      </div>
      <div
        style={{
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 16,
          backgroundColor: 'var(--dir-raised)',
          border: dividerBorder,
          boxShadow: '0 3px 8px rgba(0,0,0,0.06)',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <TypeTag>{project.typeTag}</TypeTag>
        <h3
          style={{
            fontFamily: IS,
            fontSize: 18,
            fontWeight: 500,
            lineHeight: 1.25,
            letterSpacing: '-0.015em',
            color: 'var(--dir-text-primary)',
            margin: 0,
            marginBottom: 8,
            ...titleStyle,
          }}
        >
          {project.title}
        </h3>
        <p
          style={{
            fontFamily: IS,
            fontSize: 13,
            fontWeight: 300,
            lineHeight: 1.55,
            color: 'var(--dir-text-secondary)',
            margin: 0,
            marginBottom: 12,
            ...captionStyle,
          }}
        >
          {project.framingCompressed}
        </p>
        <div style={{ marginBottom: 12 }}>
          <TagList tags={project.tags} typeTag={project.typeTag} max={3} />
        </div>
        <PillCTA variant="text">{project.ctaPrimary} →</PillCTA>
      </div>
    </div>
  );
}

function FloatingPlateStandardSvB({
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
  const outerSize: React.CSSProperties = mediaHeight
    ? { height: mediaHeight }
    : aspectOverride
      ? { aspectRatio: aspectOverride, height: 'auto' }
      : mediaAspect
        ? { aspectRatio: mediaAspect, height: 'auto' }
        : { minHeight: 360, height: '100%' };
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        ...outerSize,
        backgroundColor: frameVisible ? 'var(--dir-recessed)' : 'transparent',
        border: frameVisible ? '1px solid var(--dir-border)' : 'none',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', inset: 0, ...imageStyle }}>
        <Media
          project={project}
          role="Standard"
          style={{ width: '100%', height: '100%', aspectRatio: 'auto' }}
        />
      </div>
      <div
        style={{
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 16,
          backgroundColor: 'var(--dir-raised)',
          border: dividerBorder,
          boxShadow: '0 3px 8px rgba(0,0,0,0.06)',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
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
            marginBottom: 8,
            ...titleStyle,
          }}
        >
          {project.title}
        </h3>
        <p
          style={{
            fontFamily: IS,
            fontSize: 13,
            fontWeight: 300,
            lineHeight: 1.55,
            color: 'var(--dir-text-secondary)',
            margin: 0,
            marginBottom: 12,
            ...captionStyle,
          }}
        >
          {project.framingCompressed}
        </p>
        {proofVisible && (
          <p
            style={{
              fontFamily: IS,
              fontSize: 11,
              fontWeight: 400,
              color: 'var(--dir-detail)',
              borderTop: dividerBorder,
              paddingTop: 8,
              margin: 0,
              marginBottom: 12,
              letterSpacing: '0.01em',
              ...captionStyle,
            }}
          >
            {tiny}
          </p>
        )}
        <div style={{ marginBottom: 12 }}>
          <TagList tags={project.tags} typeTag={project.typeTag} max={3} nativeMode="hidden" />
        </div>
        <PillCTA variant="text">{project.ctaPrimary} →</PillCTA>
      </div>
    </div>
  );
}

export function T3_S1({ standardShell = 'sv-a' }: { standardShell?: StandardShell } = {}) {
  const supports = supportProjects.slice(0, 3);
  return (
    <SurfacePage
      featured={<FloatingPlateFeatured />}
      standards={supports.map((p) =>
        standardShell === 'sv-b'
          ? <FloatingPlateStandardSvB project={p} />
          : <FloatingPlateStandardSvA project={p} />,
      )}
    />
  );
}

export const T3_S1_renderers = {
  featured: (project: Project) => <FloatingPlateFeatured project={project} />,
  standard: (project: Project, opts?: { shell?: StandardShell; mediaAspect?: string; mediaHeight?: number }) =>
    opts?.shell === 'sv-b'
      ? <FloatingPlateStandardSvB project={project} mediaAspect={opts?.mediaAspect} mediaHeight={opts?.mediaHeight} />
      : <FloatingPlateStandardSvA project={project} mediaAspect={opts?.mediaAspect} mediaHeight={opts?.mediaHeight} />,
};
