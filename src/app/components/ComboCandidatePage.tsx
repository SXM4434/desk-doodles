import React, { useEffect } from 'react';
import { useParams, useSearchParams, NavLink } from 'react-router';
import { IS } from './cards/tokens';
import { GlobalNav } from './GlobalNav';
import { candidates } from './layouts/candidates';
import { surfaceCandidates } from './surfaces/candidates';
import { getLayoutComponent, getSurfaceRenderers } from './combo/composition';
import { resolvePairNative } from './combo/pairNative';
import { useCta, type CtaMode } from '../state/CtaContext';
import { useMediaTruth, type MediaTruth } from '../state/MediaTruthContext';
import { useTagStyle, type TagStyle } from '../state/TagStyleContext';
import {
  useMargin,
  marginTokenLabel,
  type MarginState,
} from '../state/MarginContext';

// Combo candidate page: renders one layout × surface pair.
//
// URL: /combo/:layoutId/:surfaceId?cta=native&tags=native&media=native&margin=native
//
// Path params carry pair identity. Query params carry toggle overrides; each
// axis defaults to 'native' (pair-native resolved via combo/pairNative.ts).
// Any explicit axis value (e.g. cta=pill-filled) bypasses the resolver for
// that axis alone.
export function ComboCandidatePage() {
  const { layoutId = '', surfaceId = '' } = useParams();
  const [searchParams] = useSearchParams();

  const layout = candidates.find((c) => c.id === layoutId);
  const surface = surfaceCandidates.find((c) => c.id === surfaceId);
  const LayoutComponent = getLayoutComponent(layoutId);
  const surfaceRenderers = getSurfaceRenderers(surfaceId);

  const { setMode: setCta } = useCta();
  const { setMode: setMedia } = useMediaTruth();
  const { setMode: setTagStyle } = useTagStyle();
  const { setState: setMargin, setNativeTarget } = useMargin();

  const ctaParam = searchParams.get('cta') ?? 'native';
  const tagsParam = searchParams.get('tags') ?? 'native';
  const mediaParam = searchParams.get('media') ?? 'native';
  const marginParam = searchParams.get('margin') ?? 'native';

  useEffect(() => {
    if (!layout || !surface) return;
    const resolved = resolvePairNative(layout, surface);
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
  }, [layoutId, surfaceId, ctaParam, tagsParam, mediaParam, marginParam]);

  if (!layout || !surface || !LayoutComponent || !surfaceRenderers) {
    return (
      <>
        <GlobalNav />
        <div style={{ padding: 48, fontFamily: IS }}>
          <p style={{ fontSize: 13 }}>
            Unknown combo pair "{layoutId} × {surfaceId}".{' '}
            <NavLink to="/combo">Return to combo index</NavLink>.
          </p>
        </div>
      </>
    );
  }

  const resolved = resolvePairNative(layout, surface);

  const lIdx = candidates.findIndex((c) => c.id === layoutId);
  const sIdx = surfaceCandidates.findIndex((c) => c.id === surfaceId);
  const prevLayout = candidates[(lIdx - 1 + candidates.length) % candidates.length];
  const nextLayout = candidates[(lIdx + 1) % candidates.length];
  const prevSurface = surfaceCandidates[(sIdx - 1 + surfaceCandidates.length) % surfaceCandidates.length];
  const nextSurface = surfaceCandidates[(sIdx + 1) % surfaceCandidates.length];

  const suffix =
    searchParams.toString().length > 0 ? `?${searchParams.toString()}` : '';

  return (
    <>
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
            {layout.label} × {surface.label}
          </span>
          <span
            style={{
              color: 'var(--dir-text-primary)',
              flexShrink: 0,
            }}
          >
            {layout.workingName} × {surface.workingName}
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
            native · margin {marginTokenLabel(resolved.margin)} · cta{' '}
            {resolved.cta} · media {resolved.media} · tags {resolved.tags}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 16, flexShrink: 0, alignItems: 'baseline' }}>
          <span style={{ color: 'var(--dir-detail)', letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: 10 }}>
            L
          </span>
          <NavLink
            to={`/combo/${prevLayout.id}/${surface.id}${suffix}`}
            style={{ color: 'var(--dir-text-secondary)' }}
          >
            ← {prevLayout.label}
          </NavLink>
          <NavLink
            to={`/combo/${nextLayout.id}/${surface.id}${suffix}`}
            style={{ color: 'var(--dir-text-secondary)' }}
          >
            {nextLayout.label} →
          </NavLink>
          <span style={{ color: 'var(--dir-border)' }}>·</span>
          <span style={{ color: 'var(--dir-detail)', letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: 10 }}>
            S
          </span>
          <NavLink
            to={`/combo/${layout.id}/${prevSurface.id}${suffix}`}
            style={{ color: 'var(--dir-text-secondary)' }}
          >
            ← {prevSurface.label}
          </NavLink>
          <NavLink
            to={`/combo/${layout.id}/${nextSurface.id}${suffix}`}
            style={{ color: 'var(--dir-text-secondary)' }}
          >
            {nextSurface.label} →
          </NavLink>
          <span style={{ color: 'var(--dir-border)' }}>·</span>
          <NavLink to="/combo" style={{ color: 'var(--dir-text-secondary)' }}>
            index
          </NavLink>
        </div>
      </div>
      <GlobalNav />
      <LayoutComponent
        renderFeatured={surfaceRenderers.featured}
        renderStandard={surfaceRenderers.standard}
      />
    </>
  );
}
