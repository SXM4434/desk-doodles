import React, { useEffect } from 'react';
import { useParams, useSearchParams, NavLink } from 'react-router';
import { IS } from './cards/tokens';
import { GlobalNav } from './GlobalNav';
import { useResetIdentityToggles } from '../state/useResetIdentityToggles';
import { candidates } from './layouts/candidates';
import { surfaceCandidates } from './surfaces/candidates';
import { NARROW2_LAYOUT_SET } from './narrow2/narrowedLayouts';
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
import { useCardScale, resolveCardScaleBox } from '../state/CardScaleContext';
import { useLabChrome } from '../state/LabChromeContext';
import { usePreset } from '../state/PresetContext';
import { useShellPicker } from '../state/ShellPickerContext';
import { renderShell } from './shells/shellRenderers';
import { NATIVE_SHELL_FOR_LAYOUT } from './family/nativeShellForLayout';
import { primaryProject, type Project } from '../data/projects';

// Narrow Pass 2 — 2-family candidate page.
//
// URL: /narrow-2/:layoutId/:family where family ∈ 'cards' | 'tiles'.
// Cards → T1-S1 baseline surface. Tiles → T8-S1 baseline surface.
// Pair-native resolvers carry the 4 prior axes (margin / cta / tags / media);
// 8 new axis toggles are enabled in LabShell and surface here without dedup.

type FamilyId = 'cards' | 'tiles';

const FAMILY_TO_SURFACE: Record<FamilyId, string> = {
  cards: 't1-s1',
  tiles: 't8-s1',
};

const FAMILY_LABEL: Record<FamilyId, string> = {
  cards: 'Cards',
  tiles: 'Tiles',
};

const FAMILY_IDS: FamilyId[] = ['cards', 'tiles'];

export function NarrowPass2CandidatePage() {
  useResetIdentityToggles();
  const { layoutId = '', surfaceId: familyParam = '' } = useParams();
  const [searchParams] = useSearchParams();

  const familyId = (FAMILY_IDS as string[]).includes(familyParam)
    ? (familyParam as FamilyId)
    : null;
  const surfaceId = familyId ? FAMILY_TO_SURFACE[familyId] : '';

  const layout = candidates.find((c) => c.id === layoutId);
  const surface = surfaceCandidates.find((c) => c.id === surfaceId);
  const LayoutComponent = getLayoutComponent(layoutId);
  const surfaceRenderers = getSurfaceRenderers(surfaceId);

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

  // Esc exits scaled preview back to standard. Scoped to narrow-2 via this
  // page's mount. Chrome toggle is independent of cardScale, so Esc does
  // not touch it.
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
    if (!familyId || !layout || !surface) return;
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
  }, [layoutId, familyId, preset, ctaParam, tagsParam, mediaParam, marginParam]);

  if (!familyId) {
    return (
      <>
        <GlobalNav />
        <div style={{ padding: 48, fontFamily: IS, fontSize: 13 }}>
          <p style={{ marginBottom: 12 }}>
            Family <strong>{familyParam || '(empty)'}</strong> is not one of the
            two families. Valid: <strong>cards</strong> · <strong>tiles</strong>.
          </p>
          <p>
            <NavLink to="/narrow-2">Return to the family space index</NavLink>.
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
            Unknown layout "{layoutId}".{' '}
            <NavLink to="/narrow-2">Return to the family space index</NavLink>.
          </p>
        </div>
      </>
    );
  }

  const resolved = resolvePairNative(layout, surface);

  const narrow2Layouts = candidates.filter((c) => NARROW2_LAYOUT_SET.has(c.id));
  const lIdx = narrow2Layouts.findIndex((c) => c.id === layoutId);
  const prevLayout =
    narrow2Layouts[(lIdx - 1 + narrow2Layouts.length) % narrow2Layouts.length];
  const nextLayout = narrow2Layouts[(lIdx + 1) % narrow2Layouts.length];
  const fIdx = FAMILY_IDS.indexOf(familyId);
  const prevFamily = FAMILY_IDS[(fIdx - 1 + FAMILY_IDS.length) % FAMILY_IDS.length];
  const nextFamily = FAMILY_IDS[(fIdx + 1) % FAMILY_IDS.length];

  const suffix =
    searchParams.toString().length > 0 ? `?${searchParams.toString()}` : '';

  // Shell picker resolution. 'baseline' keeps the surface preset render;
  // 'native' swaps in the raw project-card shells from NATIVE_SHELL_FOR_LAYOUT;
  // 'manual' uses user picks, falling back to native then baseline.
  const nativeMapping = NATIVE_SHELL_FOR_LAYOUT[layoutId];
  const featuredShellId =
    shellMode === 'manual'
      ? (shellManual.featured ?? nativeMapping?.featured ?? surface.featuredShell)
      : shellMode === 'native'
        ? (nativeMapping?.featured ?? surface.featuredShell)
        : null;
  const standardShellId =
    shellMode === 'manual'
      ? (shellManual.standard ?? nativeMapping?.standard ?? 'SV-A')
      : shellMode === 'native'
        ? (nativeMapping?.standard ?? 'SV-A')
        : null;

  const baseFeaturedRender = featuredShellId
    ? (project: Project) => renderShell(featuredShellId, project)
    : surfaceRenderers.featured;
  const baseStandardRender = standardShellId
    ? (project: Project, opts?: { mediaAspect?: string; mediaHeight?: number }) =>
        renderShell(standardShellId, project, opts)
    : surfaceRenderers.standard;

  // Scaled-mode Featured — keeps authored vertical position in the layout;
  // break-out (`left: 50%; translateX(-50%)`) horizontally centers the
  // wrapper on its parent's center line. Fill: `minHeight` (not `height`)
  // so the wrapper grows with content. Contain: `maxWidth` only (no
  // `maxHeight`) — a tall card overflowing 85vh used to bleed into the
  // next sibling (masonry tiles, standards pair).
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
            N2 · {layout.label} × {FAMILY_LABEL[familyId]}
          </span>
          <span style={{ color: 'var(--dir-text-primary)', flexShrink: 0 }}>
            {layout.workingName} × {FAMILY_LABEL[familyId]} family
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
            baseline {surface.label} · margin {marginTokenLabel(resolved.margin)} · cta{' '}
            {resolved.cta} · media {resolved.media} · tags {resolved.tags}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 16, flexShrink: 0, alignItems: 'baseline' }}>
          <span style={{ color: 'var(--dir-detail)', letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: 10 }}>
            L
          </span>
          <NavLink
            to={`/narrow-2/${prevLayout.id}/${familyId}${suffix}`}
            style={{ color: 'var(--dir-text-secondary)' }}
          >
            ← {prevLayout.label}
          </NavLink>
          <NavLink
            to={`/narrow-2/${nextLayout.id}/${familyId}${suffix}`}
            style={{ color: 'var(--dir-text-secondary)' }}
          >
            {nextLayout.label} →
          </NavLink>
          <span style={{ color: 'var(--dir-border)' }}>·</span>
          <span style={{ color: 'var(--dir-detail)', letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: 10 }}>
            F
          </span>
          <NavLink
            to={`/narrow-2/${layout.id}/${prevFamily}${suffix}`}
            style={{ color: 'var(--dir-text-secondary)' }}
          >
            ← {FAMILY_LABEL[prevFamily]}
          </NavLink>
          <NavLink
            to={`/narrow-2/${layout.id}/${nextFamily}${suffix}`}
            style={{ color: 'var(--dir-text-secondary)' }}
          >
            {FAMILY_LABEL[nextFamily]} →
          </NavLink>
          <span style={{ color: 'var(--dir-border)' }}>·</span>
          <NavLink to="/narrow-2" style={{ color: 'var(--dir-text-secondary)' }}>
            index
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
