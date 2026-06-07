import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useParams, useSearchParams, NavLink } from 'react-router';
import { IS } from './cards/tokens';
import { GlobalNav } from './GlobalNav';
import { resolvePairNative } from './combo/pairNative';
import { findSurfaceCandidate } from './surfaces/candidates';
import { candidates } from './layouts/candidates';
import { useCta } from '../state/CtaContext';
import { useMediaTruth, type MediaTruth } from '../state/MediaTruthContext';
import { useTagStyle, type TagStyle } from '../state/TagStyleContext';
import { useMargin, marginTokenLabel } from '../state/MarginContext';
import { useCardScale, resolveCardScaleBox } from '../state/CardScaleContext';
import { useCardFit } from '../state/CardFitContext';
import { useLabChrome } from '../state/LabChromeContext';
import { usePreset } from '../state/PresetContext';
import { useCardFrame } from '../state/CardFrameContext';
import { useDivider } from '../state/DividerContext';
import { useTitleRegister } from '../state/TitleRegisterContext';
import { useImageTreatment } from '../state/ImageTreatmentContext';
import { useCaptionRegister } from '../state/CaptionRegisterContext';
import { useShippedProof } from '../state/ShippedProofContext';
import { useProofPlacement } from '../state/ProofPlacementContext';
import { useDensity } from '../state/DensityContext';
import { useStandardProofMode } from '../state/StandardProofModeContext';
import { useNarrow4StandardTagStyle } from '../state/Narrow4StandardTagStyleContext';
import { useNarrow4FeaturedAspectVariance } from '../state/Narrow4FeaturedAspectVarianceContext';
import { useNarrow4StandardAspectVariance } from '../state/Narrow4StandardAspectVarianceContext';
import { useNarrow4EyebrowPlacement } from '../state/Narrow4EyebrowPlacementContext';
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
import { FV_A } from './shells/FV_A';
import { SV_A } from './shells/SV_A';
import { Narrow4Eyebrow } from './narrow4/Narrow4Eyebrow';
import { withNarrow4Overrides } from './narrow4/narrow4ProjectOverrides';

// Narrow Pass 4 candidate page. Reuses the Narrow 3 family × version matrix
// read-only (getNarrow3Component) and routes the FH-A + SV-A slots through
// FV-A foot='2-col' + SV-A with narrow-4 props (eyebrow + proof opt-in +
// ctaHidden). All register axes are hard-set at mount so the toolbar mirrors
// the authored register; cta is forced to hidden because the Narrow 4 card
// drops the CTA atom entirely.
export function NarrowPass4CandidatePage() {
  const { familyId: familyParam = '', versionId: versionParam = '' } =
    useParams();
  const [searchParams] = useSearchParams();

  const familyId = isFamilyId(familyParam) ? familyParam : null;
  const versionId = isVersionId(versionParam) ? versionParam : null;

  const LayoutComponent =
    familyId && versionId ? getNarrow3Component(familyId, versionId) : undefined;

  const syntheticLayout = candidates.find((c) => c.id === 't1-l1')!;
  const surface = findSurfaceCandidate('t8', 's4')!;

  const { setMode: setCta } = useCta();
  const { setMode: setMedia } = useMediaTruth();
  const { setMode: setTagStyle } = useTagStyle();
  const { setState: setMargin, setNativeTarget } = useMargin();
  const { mode: cardScale, setMode: setCardScale } = useCardScale();
  const scaleBox = resolveCardScaleBox(cardScale);
  const isScaled = scaleBox !== null;
  const { chromeVisible } = useLabChrome();
  // Hero #8 scaffolding — featured-card viewport-fit toggle.
  // Hero band and featured card are SEPARATE containers. Compact mode sizes
  // the CARD ALONE to fill viewport (when scrolled to it). Hero band renders
  // at natural size above; the user scrolls past it to see the full card.
  //
  // Math:  mediaHeight = viewport − stickyChrome − measuredContentBelow − breathing
  //
  // measuredContentBelow comes from ResizeObserver on the card — no static
  // estimate for card content. stickyChrome is the only fixed offset because
  // global nav + LabShell strip are position:sticky and ALWAYS at the viewport
  // top regardless of scroll. Hero band is NOT subtracted — it's external.
  const { state: cardFit } = useCardFit();
  const featuredCardRef = useRef<HTMLDivElement>(null);
  const [measuredContentBelowMedia, setMeasuredContentBelowMedia] = useState<number>(280);
  const [compactMediaHeight, setCompactMediaHeight] = useState<number | undefined>(undefined);

  // Compute mediaHeight from viewport + measured content-below.
  useEffect(() => {
    if (cardFit !== 'compact') {
      setCompactMediaHeight(undefined);
      return;
    }
    const compute = () => {
      const stickyChrome = chromeVisible ? 120 : 70;
      const breathing = 16;
      const available = window.innerHeight - stickyChrome - measuredContentBelowMedia - breathing;
      setCompactMediaHeight(Math.max(220, available));
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, [cardFit, chromeVisible, measuredContentBelowMedia]);

  // Measure card height after render; infer content-below = cardHeight − mediaHeight.
  useLayoutEffect(() => {
    if (cardFit !== 'compact' || !compactMediaHeight) return;
    const el = featuredCardRef.current;
    if (!el) return;
    const measure = () => {
      const cardHeight = el.getBoundingClientRect().height;
      const inferred = cardHeight - compactMediaHeight;
      setMeasuredContentBelowMedia((prev) =>
        Math.abs(inferred - prev) > 4 ? inferred : prev,
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [cardFit, compactMediaHeight]);
  const { setPreset } = usePreset();
  const { setState: setCardFrame } = useCardFrame();
  const { setState: setDivider } = useDivider();
  const { setState: setTitleRegister } = useTitleRegister();
  const { setState: setImageTreatment } = useImageTreatment();
  const { setState: setCaptionRegister } = useCaptionRegister();
  const { setState: setShippedProof } = useShippedProof();
  const { setState: setProofPlacement } = useProofPlacement();
  const { setState: setDensity } = useDensity();
  const { state: standardProofMode } = useStandardProofMode();
  const { state: stdTagStyle } = useNarrow4StandardTagStyle();
  const { state: featuredAspect } = useNarrow4FeaturedAspectVariance();
  const { state: standardAspect } = useNarrow4StandardAspectVariance();
  const { state: eyebrowPlacement } = useNarrow4EyebrowPlacement();

  useLayoutEffect(() => {
    // Authorized hard-sets: T8-S4 preset, compact density, shipped-proof on,
    // CTA hidden, cardFrame off (T8-S4's fixed value — narrow-4 renders as
    // tiles, not cards), divider none (T8-S4 baseline). Proof placement stays
    // 'native' so featured uses its own stack-grid and standard uses its own
    // inline. Aspect variance + card scale stay free. Remaining identity
    // axes resolve to each card's nativeMode.
    setPreset('t8-s4');
    setDensity('compact');
    setShippedProof('on');
    setProofPlacement('native');
    setCardFrame('off');
    setDivider('none');
    setTitleRegister('native');
    setCaptionRegister('native');
    setImageTreatment('native');
    setCta('hidden');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isScaled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCardScale('standard');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isScaled, setCardScale]);

  const tagsParam = searchParams.get('tags') ?? 'native';
  const mediaParam = searchParams.get('media') ?? 'native';

  useEffect(() => {
    if (!familyId || !versionId) return;
    const resolved = resolvePairNative(syntheticLayout, surface);
    // Narrow-4 locks margin to m2 (24) for tighter wide-bleed read across
    // families A/B. URL ?margin= is ignored — the toolbar dropdown is also
    // suppressed in narrow-4 mode.
    setNativeTarget('m2');
    setMargin('m2');
    setTagStyle(tagsParam === 'native' ? resolved.tags : (tagsParam as TagStyle));
    setMedia(
      mediaParam === 'native' ? resolved.media : (mediaParam as MediaTruth),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [familyId, versionId, tagsParam, mediaParam]);

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
            <NavLink to="/narrow-4">Return to the Narrow Pass 4 index</NavLink>.
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
            <NavLink to="/narrow-4">Return to the Narrow Pass 4 index</NavLink>.
          </p>
        </div>
      </>
    );
  }

  const family = FAMILIES.find((f) => f.id === familyId)!;
  const version = VERSIONS.find((v) => v.id === versionId)!;
  const resolved = resolvePairNative(syntheticLayout, surface);

  const fIdx = FAMILY_IDS.indexOf(familyId);
  const prevFamily =
    FAMILY_IDS[(fIdx - 1 + FAMILY_IDS.length) % FAMILY_IDS.length];
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

  const baseFeaturedRender = (project: Project) => {
    const { narrow4 } = withNarrow4Overrides(project);
    // Hero #8 scaffolding 2026-05-26 — compact mode shrinks the media area
    // only, preserving the card's text + proof rows. mediaHeight is computed
    // upstream (compactMediaHeight) from viewport - chrome - measured content
    // below media - breathing. The card wrapper ref enables that measurement.
    return (
      <div ref={cardFit === 'compact' ? featuredCardRef : undefined}>
        <FV_A
          project={project}
          foot="2-col"
          eyebrow={
            <Narrow4Eyebrow
              segments={narrow4.eyebrowSegments}
              register="featured"
            />
          }
          proofSuppressed={narrow4.proofSuppressed}
          eyebrowInRightCol={eyebrowPlacement === 'option-b'}
          aspectVarianceOverride={featuredAspect}
          mediaHeight={cardFit === 'compact' ? compactMediaHeight : undefined}
        />
      </div>
    );
  };

  const baseStandardRender = (
    project: Project,
    opts?: { mediaAspect?: string; mediaHeight?: number },
  ) => {
    const { narrow4 } = withNarrow4Overrides(project);
    const effectiveProofSuppressed =
      standardProofMode === 'off'
        ? true
        : standardProofMode === 'on'
          ? false
          : narrow4.proofSuppressed;
    return (
      <SV_A
        project={project}
        mediaAspect={opts?.mediaAspect}
        mediaHeight={opts?.mediaHeight}
        eyebrow={
          <Narrow4Eyebrow
            segments={narrow4.eyebrowSegments}
            register="standard"
          />
        }
        proofOptIn
        proofSuppressed={effectiveProofSuppressed}
        ctaHidden
        tagStyle={stdTagStyle === 'native' ? undefined : stdTagStyle}
        eyebrowPlacement={eyebrowPlacement}
        aspectVarianceOverride={standardAspect}
      />
    );
  };

  const featuredRender =
    isScaled && scaleBox
      ? (project: typeof primaryProject) => (
          <div
            style={{
              ...(scaleBox.fit === 'contain'
                ? { maxWidth: scaleBox.width, display: 'inline-block' }
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
              N4 · {family.label} × {version.label}
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
              T8-S4 locked · compact · cta hidden · margin M2 · 24px
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              gap: 16,
              flexShrink: 0,
              alignItems: 'baseline',
            }}
          >
            <span
              style={{
                color: 'var(--dir-detail)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                fontSize: 10,
              }}
            >
              F
            </span>
            <NavLink
              to={`/narrow-4/${prevFamily}/${versionId}${suffix}`}
              style={{ color: 'var(--dir-text-secondary)' }}
            >
              ← {prevFamilyMeta.label}
            </NavLink>
            <NavLink
              to={`/narrow-4/${nextFamily}/${versionId}${suffix}`}
              style={{ color: 'var(--dir-text-secondary)' }}
            >
              {nextFamilyMeta.label} →
            </NavLink>
            <span style={{ color: 'var(--dir-border)' }}>·</span>
            <span
              style={{
                color: 'var(--dir-detail)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                fontSize: 10,
              }}
            >
              V
            </span>
            <NavLink
              to={`/narrow-4/${familyId}/${prevVersion}${suffix}`}
              style={{ color: 'var(--dir-text-secondary)' }}
            >
              ← {prevVersionMeta.label}
            </NavLink>
            <NavLink
              to={`/narrow-4/${familyId}/${nextVersion}${suffix}`}
              style={{ color: 'var(--dir-text-secondary)' }}
            >
              {nextVersionMeta.label} →
            </NavLink>
            <span style={{ color: 'var(--dir-border)' }}>·</span>
            <NavLink to="/narrow-4" style={{ color: 'var(--dir-text-secondary)' }}>
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
