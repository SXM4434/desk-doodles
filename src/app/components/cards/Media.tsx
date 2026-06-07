import React, { useState } from 'react';
import { IS } from './tokens';
import { useMediaTruth } from '../../state/MediaTruthContext';

type ProjectLike = {
  label: string;
  aspect: string;
  realAssetPath?: string;
  realAssetLabel: string;
  assets?: {
    id: string;
    path: string;
    label: string;
    aspect: string;
    mediaClass: 'hero' | 'detail' | 'mobile';
  }[];
};

type Props = {
  project: ProjectLike;
  role: string;
  /**
   * Optional media-pool variant id. If the exact id isn't present in the
   * project's asset pool the resolver walks through same-project best-fit in
   * order: exact id → same mediaClass → hero → first available → legacy
   * realAssetPath. Only when nothing resolves does the neutral placeholder
   * render.
   */
  variant?: string;
  /** Optional mediaClass hint used when variant is absent. */
  mediaClass?: 'hero' | 'detail' | 'mobile';
  className?: string;
  style?: React.CSSProperties;
};

function resolveAsset(
  project: ProjectLike,
  variant?: string,
  mediaClass?: 'hero' | 'detail' | 'mobile',
): { path: string; label: string; aspect: string } | null {
  const pool = project.assets ?? [];
  if (variant) {
    const exact = pool.find((a) => a.id === variant);
    if (exact) return exact;
  }
  if (mediaClass) {
    const byClass = pool.find((a) => a.mediaClass === mediaClass);
    if (byClass) return byClass;
  }
  const heroMatch = pool.find((a) => a.mediaClass === 'hero');
  if (heroMatch) return heroMatch;
  if (pool[0]) return pool[0];
  if (project.realAssetPath) {
    return { path: project.realAssetPath, label: project.realAssetLabel, aspect: project.aspect };
  }
  return null;
}

function StructuralPlaceholder({
  label,
  aspect,
  style,
}: {
  label: string;
  aspect: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        width: '100%',
        aspectRatio: aspect,
        backgroundColor: 'var(--dir-recessed)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        color: 'var(--dir-text-secondary)',
        ...style,
      }}
    >
      <p
        style={{
          fontFamily: IS,
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--dir-text-secondary)',
          margin: 0,
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontFamily: IS,
          fontSize: 10,
          fontWeight: 400,
          color: 'var(--dir-detail)',
          margin: 0,
        }}
      >
        {aspect}
      </p>
    </div>
  );
}

// Neutral no-asset fallback — used only when the project has no resolvable
// media pool entry AT ALL. Quiet by design; no loud "ASSET MISSING" shouting.
function NeutralFallback({
  label,
  aspect,
  style,
}: {
  label: string;
  aspect: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        width: '100%',
        aspectRatio: aspect,
        backgroundColor: 'var(--dir-muted)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
    >
      <p
        style={{
          fontFamily: IS,
          fontSize: 10,
          fontWeight: 400,
          letterSpacing: '0.08em',
          color: 'var(--dir-detail)',
          margin: 0,
        }}
      >
        {label}
      </p>
    </div>
  );
}

export function Media({ project, role, variant, mediaClass, style }: Props) {
  const { mode } = useMediaTruth();
  const [failed, setFailed] = useState(false);

  const resolved = resolveAsset(project, variant, mediaClass);
  const assetLabel = resolved?.label ?? project.realAssetLabel;
  const assetAspect = resolved?.aspect ?? project.aspect;
  const labelWithRole = role ? `${assetLabel} \u00b7 ${role}` : assetLabel;

  if (mode === 'structural-placeholder') {
    return (
      <StructuralPlaceholder
        label={labelWithRole}
        aspect={assetAspect}
        style={style}
      />
    );
  }

  if (!resolved || failed) {
    return <NeutralFallback label={labelWithRole} aspect={assetAspect} style={style} />;
  }

  return (
    <div
      style={{
        width: '100%',
        aspectRatio: assetAspect,
        overflow: 'hidden',
        backgroundColor: 'var(--dir-recessed)',
        ...style,
      }}
    >
      <img
        src={resolved.path}
        alt={labelWithRole}
        onError={() => setFailed(true)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
        }}
      />
    </div>
  );
}
