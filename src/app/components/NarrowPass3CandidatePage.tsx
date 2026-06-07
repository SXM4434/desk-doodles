import React, { useEffect } from 'react';
import { useParams, useSearchParams, NavLink } from 'react-router';
import { IS } from './cards/tokens';
import { GlobalNav } from './GlobalNav';
import { useResetIdentityToggles } from '../state/useResetIdentityToggles';
import { resolvePairNative } from './combo/pairNative';
import { findSurfaceCandidate } from './surfaces/candidates';
import { candidates } from './layouts/candidates';
import { T8_S1_renderers } from './surfaces/T8_S1_PlainTile';
import { useCta, type CtaMode } from '../state/CtaContext';
import { useMediaTruth, type MediaTruth } from '../state/MediaTruthContext';
import { useTagStyle, type TagStyle } from '../state/TagStyleContext';
import {
  useMargin,
  marginTokenLabel,
  type MarginState,
} from '../state/MarginContext';
import { useCardScale, resolveCardScaleBox } from '../state/CardScaleContext';
import { useLabChrome } from '../state/LabChromeContext';
import { usePreset } from '../state/PresetContext';
import { useShellPicker } from '../state/ShellPickerContext';
import { renderShell } from './shells/shellRenderers';
import { primaryProject, type Project } from '../data/projects';
import {
  FAMILIES,
  FAMILY_IDS,
  VERSIONS,
  VERSION_IDS,
  getNarrow3Component,
  isFamilyId,
  isVersionId,
} from './narrow3/narrowedFamilies';

// Narrow Pass 3 — family × version candidate page.
//
// URL: /narrow-3/:familyId/:versionId where familyId ∈ 'a' | 'b' and
// versionId ∈ 'v1' | 'v2' | 'v3'. Tile surface only (T8-S1 PlainTile
// renderers). Pair-native resolvers carry the 4 prior axes (margin, cta,
// tags, media) against a synthetic "layout side" that uses t1-l1's
// defaults — Narrow-3 layouts aren't registered candidates, so we resolve
// margin against the tile surface (m6) directly and let cta / tags / media
// fall through to the surface-native values.

export function NarrowPass3CandidatePage() {
  useResetIdentityToggles();
  const { familyId: familyParam = '', versionId: versionParam = '' } = useParams();
  const [searchParams] = useSearchParams();

  const familyId = isFamilyId(familyParam) ? familyParam : null;
  const versionId = isVersionId(versionParam) ? versionParam : null;

  const LayoutComponent =
    familyId && versionId ? getNarrow3Component(familyId, versionId) : undefined;

  // Pair-native resolution uses the t8-s1 surface's authored defaults;
  // the tile surface carries margin m6 natively. Layout side falls back to
  // t1-l1 (centered baseline) so cta / tags / media resolve surface-native.
  const syntheticLayout = candidates.find((c) => c.id === 't1-l1')!;
  const surface = findSurfaceCandidate('t8', 's1')!;

  const { setMode: setCta } = useCta();
  const { setMode: setMedia } = useMediaTruth();
  const { setMode: setTagStyle } = useTagStyle();
  const { setState: setMargin, setNativeTarget } = useMargin();
  const { mode: cardScale, setMode: setCardScale } = useCardScale();
  const scaleBox = resolveCardScaleBox(cardScale);
  const isScaled = scaleBox !== null;
  const { chromeVisible } = useLabChrome();
  const { preset } = usePreset();
  const { mode: shellMode, manual: shellManual } = useShellPicker();

  useEffect(() => {
    if (!isScaled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCardScale('standard');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isScaled, setCardScale]);

  const ctaParam = searchParams.get('cta') ?? 'native';
  const tagsParam = searchParams.get('tags') ?? 'native';
  const mediaParam = searchParams.get('media') ?? 'native';
  const marginParam = searchParams.get('margin') ?? 'native';

  useEffect(() => {
    if (!familyId || !versionId) return;
    const resolved = resolvePairNative(syntheticLayout, surface);
    setNativeTarget(resolved.margin);
    setCta(ctaParam === 'native' ? resolved.cta : (ctaParam as CtaMode));
    setTagStyle(tagsParam === 'native' ? resolved.tags : (tagsParam as TagStyle));
    setMedia(
      mediaParam === 'native' ? resolved.media : (mediaParam as MediaTruth),
    );
    setMargin(
      marginParam === 'native' ? 'native' : (marginParam as MarginState),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [familyId, versionId, preset, ctaParam, tagsParam, mediaParam, marginParam]);

  if (!familyId || !versionId) {
    return (
      <>
        <GlobalNav />
        <div style={{ padding: 48, fontFamily: IS, fontSize: 13 }}>
          <p style={{ marginBottom: 12 }}>
            Unknown family/version pair{' '}
            <strong>{familyParam || '(empty)'}</strong>/
            <strong>{versionParam || '(empty)'}</strong>. Valid families:{' '}
            <strong>a</strong> · <strong>b</strong>. Valid versions:{' '}
            <strong>v1</strong> · <strong>v2</strong> · <strong>v3</strong>.
          </p>
          <p>
            <NavLink to="/narrow-3">Return to the Narrow Pass 3 index</NavLink>.
          </p>
        </div>
      </>
    );
  }

  if (!LayoutComponent) {
    return (
      <>
        <GlobalNav />
        <div style={{ padding: 48, fontFamily: IS }}>
          <p style={{ fontSize: 13 }}>
            Missing component for {familyId}/{versionId}.{' '}
            <NavLink to="/narrow-3">Return to the Narrow Pass 3 index</NavLink>.
          </p>
        </div>
      </>
    );
  }

  const family = FAMILIES.find((f) => f.id === familyId)!;
  const version = VERSIONS.find((v) => v.id === versionId)!;
  const resolved = resolvePairNative(syntheticLayout, surface);

  const fIdx = FAMILY_IDS.indexOf(familyId);
  const prevFamily = FAMILY_IDS[(fIdx - 1 + FAMILY_IDS.length) % FAMILY_IDS.length];
  const nextFamily = FAMILY_IDS[(fIdx + 1) % FAMILY_IDS.length];
  const vIdx = VERSION_IDS.indexOf(versionId);
  const prevVersion =
    VERSION_IDS[(vIdx - 1 + VERSION_IDS.length) % VERSION_IDS.length];
  const nextVersion = VERSION_IDS[(vIdx + 1) % VERSION_IDS.length];

  const prevFamilyMeta = FAMILIES.find((f) => f.id === prevFamily)!;
  const nextFamilyMeta = FAMILIES.find((f) => f.id === nextFamily)!;
  const prevVersionMeta = VERSIONS.find((v) => v.id === prevVersion)!;
  const nextVersionMeta = VERSIONS.find((v) => v.id === nextVersion)!;

  const suffix =
    searchParams.toString().length > 0 ? `?${searchParams.toString()}` : '';

  // Shell picker resolution. Narrow-3 has no layoutId in the registry, so
  // 'native' defaults to the narrow3 layouts' authored FH-A featured + SV-A
  // standard. 'baseline' keeps the tile preset (T8_S1 renderers).
  const featuredShellId =
    shellMode === 'manual'
      ? (shellManual.featured ?? 'FH-A')
      : shellMode === 'native'
        ? 'FH-A'
        : null;
  const standardShellId =
    shellMode === 'manual'
      ? (shellManual.standard ?? 'SV-A')
      : shellMode === 'native'
        ? 'SV-A'
        : null;

  const baseFeaturedRender = featuredShellId
    ? (project: Project) => renderShell(featuredShellId, project)
    : T8_S1_renderers.featured;
  const baseStandardRender = standardShellId
    ? (project: Project, opts?: { mediaAspect?: string; mediaHeight?: number }) =>
        renderShell(standardShellId, project, opts)
    : T8_S1_renderers.standard;

  // Scaled-mode Featured wrapper — same mechanism as NarrowPass2CandidatePage.
  // `minHeight` (not `height`) for fill; for contain, `maxWidth` only (no
  // `maxHeight`) so the wrapper grows with content — a tall card overflowing
  // 85vh used to bleed into the standards pair below.
  const featuredRender = isScaled && scaleBox
    ? (project: typeof primaryProject) => (
        <div
          style={{
            ...(scaleBox.fit === 'contain'
              ? {
                  maxWidth: scaleBox.width,
                  display: 'inline-block',
                }
              : {
                  width: scaleBox.width,
                  minHeight: scaleBox.height,
                  display: 'grid',
                }),
            position: 'relative',
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          {baseFeaturedRender(project)}
        </div>
      )
    : baseFeaturedRender;

  return (
    <>
      {chromeVisible && (
      <div
        style={{
          padding: '12px 48px',
          borderBottom: '1px solid var(--dir-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontFamily: IS,
          fontSize: 11,
          color: 'var(--dir-text-secondary)',
          gap: 12,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 12,
            minWidth: 0,
            flex: 1,
          }}
        >
          <span
            style={{
              fontWeight: 500,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--dir-text-primary)',
              flexShrink: 0,
            }}
          >
            N3 · {family.label} × {version.label}
          </span>
          <span style={{ color: 'var(--dir-text-primary)', flexShrink: 0 }}>
            {family.workingName} × {version.workingName}
          </span>
          <span
            style={{
              color: 'var(--dir-detail)',
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            tile surface · margin {marginTokenLabel(resolved.margin)} · cta{' '}
            {resolved.cta} · media {resolved.media} · tags {resolved.tags}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 16, flexShrink: 0, alignItems: 'baseline' }}>
          <span style={{ color: 'var(--dir-detail)', letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: 10 }}>
            F
          </span>
          <NavLink
            to={`/narrow-3/${prevFamily}/${versionId}${suffix}`}
            style={{ color: 'var(--dir-text-secondary)' }}
          >
            ← {prevFamilyMeta.label}
          </NavLink>
          <NavLink
            to={`/narrow-3/${nextFamily}/${versionId}${suffix}`}
            style={{ color: 'var(--dir-text-secondary)' }}
          >
            {nextFamilyMeta.label} →
          </NavLink>
          <span style={{ color: 'var(--dir-border)' }}>·</span>
          <span style={{ color: 'var(--dir-detail)', letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: 10 }}>
            V
          </span>
          <NavLink
            to={`/narrow-3/${familyId}/${prevVersion}${suffix}`}
            style={{ color: 'var(--dir-text-secondary)' }}
          >
            ← {prevVersionMeta.label}
          </NavLink>
          <NavLink
            to={`/narrow-3/${familyId}/${nextVersion}${suffix}`}
            style={{ color: 'var(--dir-text-secondary)' }}
          >
            {nextVersionMeta.label} →
          </NavLink>
          <span style={{ color: 'var(--dir-border)' }}>·</span>
          <NavLink to="/narrow-3" style={{ color: 'var(--dir-text-secondary)' }}>
            index
          </NavLink>
          <NavLink to="/tiles" style={{ color: 'var(--dir-text-secondary)' }}>
            tiles family →
          </NavLink>
        </div>
      </div>
      )}
      <GlobalNav />
      <LayoutComponent
        renderFeatured={featuredRender}
        renderStandard={baseStandardRender}
      />
    </>
  );
}
