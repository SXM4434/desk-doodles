import React, { useEffect } from 'react';
import { useParams, useSearchParams, NavLink } from 'react-router';
import { IS } from './cards/tokens';
import { GlobalNav } from './GlobalNav';
import { useResetIdentityToggles } from '../state/useResetIdentityToggles';
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
import {
  NARROWED_LAYOUT_IDS,
  NARROWED_LAYOUT_SET,
} from './narrow1/narrowedLayouts';
import {
  NARROWED_SURFACE_IDS,
  NARROWED_SURFACE_SET,
} from './narrow1/narrowedSurfaces';

// Narrow Pass 1 candidate page: renders one layout × surface pair, scoped
// to the 15-layout × 13-surface narrowed set.
//
// URL: /narrow-1/:layoutId/:surfaceId?cta=native&tags=native&media=native&margin=native
//
// Mirrors ComboCandidatePage's contract exactly — same resolver, same axis
// override query params, same render of
//   <LayoutComponent renderFeatured={...} renderStandard={...} />
// — but guards against ids outside the Narrow Pass 1 sets on either axis.
export function NarrowPass1CandidatePage() {
  useResetIdentityToggles();
  const { layoutId = '', surfaceId = '' } = useParams();
  const [searchParams] = useSearchParams();

  const layoutInSet = NARROWED_LAYOUT_SET.has(layoutId);
  const surfaceInSet = NARROWED_SURFACE_SET.has(surfaceId);
  const inSet = layoutInSet && surfaceInSet;
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
    if (!inSet || !layout || !surface) return;
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

  if (!inSet) {
    return (
      <>
        <GlobalNav />
        <div style={{ padding: 48, fontFamily: IS, fontSize: 13 }}>
          {!layoutInSet && (
            <p style={{ marginBottom: 12 }}>
              Layout <strong>{layoutId || '(empty)'}</strong> is not in the
              Narrow Pass 1 working set.
            </p>
          )}
          {!surfaceInSet && (
            <p style={{ marginBottom: 12 }}>
              Surface <strong>{surfaceId || '(empty)'}</strong> is not in the
              Narrow Pass 1 working set.
            </p>
          )}
          {!layoutInSet && (
            <p style={{ color: 'var(--dir-text-secondary)', marginBottom: 12 }}>
              Narrow Pass 1 layouts ({NARROWED_LAYOUT_IDS.length}):{' '}
              {NARROWED_LAYOUT_IDS.join(' · ')}.
            </p>
          )}
          {!surfaceInSet && (
            <p style={{ color: 'var(--dir-text-secondary)', marginBottom: 12 }}>
              Narrow Pass 1 surfaces ({NARROWED_SURFACE_IDS.length}):{' '}
              {NARROWED_SURFACE_IDS.join(' · ')}.
            </p>
          )}
          <p>
            <NavLink to="/narrow-1">Return to Narrow Pass 1 index</NavLink>
            {' · '}
            <NavLink to={`/combo/${layoutId}/${surfaceId}`}>
              Open this pair in the full Combo lab instead
            </NavLink>
            .
          </p>
        </div>
      </>
    );
  }

  if (!layout || !surface || !LayoutComponent || !surfaceRenderers) {
    return (
      <>
        <GlobalNav />
        <div style={{ padding: 48, fontFamily: IS }}>
          <p style={{ fontSize: 13 }}>
            Unknown pair "{layoutId} × {surfaceId}".{' '}
            <NavLink to="/narrow-1">Return to Narrow Pass 1 index</NavLink>.
          </p>
        </div>
      </>
    );
  }

  const resolved = resolvePairNative(layout, surface);

  const narrowedLayouts = candidates.filter((c) => NARROWED_LAYOUT_SET.has(c.id));
  const narrowedSurfaces = surfaceCandidates.filter((c) =>
    NARROWED_SURFACE_SET.has(c.id),
  );
  const lIdx = narrowedLayouts.findIndex((c) => c.id === layoutId);
  const sIdx = narrowedSurfaces.findIndex((c) => c.id === surfaceId);
  const prevLayout =
    narrowedLayouts[(lIdx - 1 + narrowedLayouts.length) % narrowedLayouts.length];
  const nextLayout = narrowedLayouts[(lIdx + 1) % narrowedLayouts.length];
  const prevSurface =
    narrowedSurfaces[(sIdx - 1 + narrowedSurfaces.length) % narrowedSurfaces.length];
  const nextSurface = narrowedSurfaces[(sIdx + 1) % narrowedSurfaces.length];

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
            N1 · {layout.label} × {surface.label}
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
            to={`/narrow-1/${prevLayout.id}/${surface.id}${suffix}`}
            style={{ color: 'var(--dir-text-secondary)' }}
          >
            ← {prevLayout.label}
          </NavLink>
          <NavLink
            to={`/narrow-1/${nextLayout.id}/${surface.id}${suffix}`}
            style={{ color: 'var(--dir-text-secondary)' }}
          >
            {nextLayout.label} →
          </NavLink>
          <span style={{ color: 'var(--dir-border)' }}>·</span>
          <span style={{ color: 'var(--dir-detail)', letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: 10 }}>
            S
          </span>
          <NavLink
            to={`/narrow-1/${layout.id}/${prevSurface.id}${suffix}`}
            style={{ color: 'var(--dir-text-secondary)' }}
          >
            ← {prevSurface.label}
          </NavLink>
          <NavLink
            to={`/narrow-1/${layout.id}/${nextSurface.id}${suffix}`}
            style={{ color: 'var(--dir-text-secondary)' }}
          >
            {nextSurface.label} →
          </NavLink>
          <span style={{ color: 'var(--dir-border)' }}>·</span>
          <NavLink to="/narrow-1" style={{ color: 'var(--dir-text-secondary)' }}>
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
