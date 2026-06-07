import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { NavLink, useParams, useSearchParams } from 'react-router';
import { IS } from '../cards/tokens';
import { GlobalNav } from '../GlobalNav';
import { resolvePairNative } from '../combo/pairNative';
import { findSurfaceCandidate } from '../surfaces/candidates';
import { candidates } from '../layouts/candidates';
import { useCta } from '../../state/CtaContext';
import { useMediaTruth, type MediaTruth } from '../../state/MediaTruthContext';
import { useTagStyle, type TagStyle } from '../../state/TagStyleContext';
import { useMargin } from '../../state/MarginContext';
import { usePreset } from '../../state/PresetContext';
import { useCardFrame } from '../../state/CardFrameContext';
import { useDivider } from '../../state/DividerContext';
import { useTitleRegister } from '../../state/TitleRegisterContext';
import { useImageTreatment } from '../../state/ImageTreatmentContext';
import { useCaptionRegister } from '../../state/CaptionRegisterContext';
import { useShippedProof } from '../../state/ShippedProofContext';
import { useProofPlacement } from '../../state/ProofPlacementContext';
import { useDensity } from '../../state/DensityContext';
import { useStandardProofMode } from '../../state/StandardProofModeContext';
import { useNarrow4StandardTagStyle } from '../../state/Narrow4StandardTagStyleContext';
import { useNarrow4FeaturedAspectVariance } from '../../state/Narrow4FeaturedAspectVarianceContext';
import { useNarrow4StandardAspectVariance } from '../../state/Narrow4StandardAspectVarianceContext';
import { useNarrow4EyebrowPlacement } from '../../state/Narrow4EyebrowPlacementContext';
import { useCardFit } from '../../state/CardFitContext';
import { useLabChrome } from '../../state/LabChromeContext';
import type { Project } from '../../data/projects';
import { FV_A } from '../shells/FV_A';
import { SV_A } from '../shells/SV_A';
import { Narrow4Eyebrow } from '../narrow4/Narrow4Eyebrow';
import { withNarrow4Overrides } from '../narrow4/narrow4ProjectOverrides';
import {
  getHeroComponent,
  isFFamilyId,
  isLayoutFamilyId,
  type FFamilyId,
  type LayoutFamilyId,
} from './heroFamilies';
import { FamilyA_V1Grid } from '../narrow3/FamilyA_V1Grid';
import { FamilyA_V2Masonry } from '../narrow3/FamilyA_V2Masonry';
import { FamilyA_V3AsymRows } from '../narrow3/FamilyA_V3AsymRows';
import { FamilyB_V1Grid } from '../narrow3/FamilyB_V1Grid';
import { FamilyB_V2Masonry } from '../narrow3/FamilyB_V2Masonry';
import { FamilyB_V3AsymRows } from '../narrow3/FamilyB_V3AsymRows';
import type { ComboLayoutComponent } from '../combo/composition';

// Hero #8 candidate page. Mirrors NarrowPass4CandidatePage's hard-set
// register + render-prop pipeline so cards render identically to narrow-4
// (T8-S4 tile preset, compact density, CTA hidden, FV-A foot='2-col',
// Narrow4Eyebrow, narrow-4 proof opt-in). The ONLY difference: the F-family
// hero component is injected via renderHero, replacing the layout's hard-coded
// hero zone (Family A's HeroBandPlaceholder · Family B's IdentityAside).

const LAYOUT_BY_KEY: Record<string, ComboLayoutComponent> = {
  'a/v1': FamilyA_V1Grid as ComboLayoutComponent,
  'a/v2': FamilyA_V2Masonry as ComboLayoutComponent,
  'a/v3': FamilyA_V3AsymRows as ComboLayoutComponent,
  'b/v1': FamilyB_V1Grid as ComboLayoutComponent,
  'b/v2': FamilyB_V2Masonry as ComboLayoutComponent,
  'b/v3': FamilyB_V3AsymRows as ComboLayoutComponent,
};

export function Hero8CandidatePage() {
  const { fFamilyId: fParam = '', layoutFamilyId: lParam = '', versionId: vParam = 'v1' } = useParams();
  const [searchParams] = useSearchParams();

  const fFamilyId: FFamilyId | null = isFFamilyId(fParam) ? fParam : null;
  const layoutFamilyId: LayoutFamilyId | null = isLayoutFamilyId(lParam) ? lParam : null;
  const versionId = ['v1', 'v2', 'v3'].includes(vParam) ? vParam : 'v1';

  const syntheticLayout = candidates.find((c) => c.id === 't1-l1')!;
  const surface = findSurfaceCandidate('t8', 's4')!;

  const { setMode: setCta } = useCta();
  const { setMode: setMedia } = useMediaTruth();
  const { setMode: setTagStyle } = useTagStyle();
  const { setState: setMargin, setNativeTarget } = useMargin();
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
  // Hero #8 scaffolding port from NarrowPass4CandidatePage: featured-card
  // viewport-fit. Compact mode shrinks the featured card's media area so the
  // card alone fills viewport when scrolled to it. ResizeObserver measures
  // content-below-media; mediaHeight = viewport − stickyChrome − content − breathing.
  const { state: cardFit } = useCardFit();
  const { chromeVisible } = useLabChrome();
  const featuredCardRef = useRef<HTMLDivElement>(null);
  const [measuredContentBelowMedia, setMeasuredContentBelowMedia] = useState<number>(280);
  const [compactMediaHeight, setCompactMediaHeight] = useState<number | undefined>(undefined);

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

  // Hard-set register at mount — T8-S4 tile preset + compact + cta hidden.
  useLayoutEffect(() => {
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

  // Narrow-4 locks margin to m2; tags + media resolve to pair-native unless overridden.
  const tagsParam = searchParams.get('tags') ?? 'native';
  const mediaParam = searchParams.get('media') ?? 'native';
  useEffect(() => {
    if (!fFamilyId || !layoutFamilyId) return;
    const resolved = resolvePairNative(syntheticLayout, surface);
    setNativeTarget('m2');
    setMargin('m2');
    setTagStyle(tagsParam === 'native' ? resolved.tags : (tagsParam as TagStyle));
    setMedia(mediaParam === 'native' ? resolved.media : (mediaParam as MediaTruth));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fFamilyId, layoutFamilyId, tagsParam, mediaParam]);

  if (!fFamilyId || !layoutFamilyId) {
    return (
      <>
        <GlobalNav />
        <div style={{ padding: 48, fontFamily: IS, fontSize: 13 }}>
          <p>
            Unknown cell <code>{fParam}/{lParam}</code>.{' '}
            <NavLink to="/hero-8">Back to Hero #8 index</NavLink>.
          </p>
        </div>
      </>
    );
  }

  const LayoutComponent = LAYOUT_BY_KEY[`${layoutFamilyId}/${versionId}`];
  if (!LayoutComponent) {
    return (
      <>
        <GlobalNav />
        <div style={{ padding: 48, fontFamily: IS, fontSize: 13 }}>
          <p>
            Unknown layout combination <code>{layoutFamilyId}/{versionId}</code>.{' '}
            <NavLink to="/hero-8">Back</NavLink>.
          </p>
        </div>
      </>
    );
  }

  const HeroComponent = getHeroComponent(fFamilyId, layoutFamilyId);

  // narrow-4 featured render — FV_A with foot='2-col' + Narrow4Eyebrow + narrow-4 overrides.
  const renderFeatured = (project: Project) => {
    const { narrow4 } = withNarrow4Overrides(project);
    return (
      <div ref={cardFit === 'compact' ? featuredCardRef : undefined}>
        <FV_A
          project={project}
          foot="2-col"
          eyebrow={<Narrow4Eyebrow segments={narrow4.eyebrowSegments} register="featured" />}
          proofSuppressed={narrow4.proofSuppressed}
          eyebrowInRightCol={eyebrowPlacement === 'option-b'}
          aspectVarianceOverride={featuredAspect}
          mediaHeight={cardFit === 'compact' ? compactMediaHeight : undefined}
        />
      </div>
    );
  };

  // narrow-4 standard render — SV_A with Narrow4Eyebrow + narrow-4 overrides + proof opt-in.
  const renderStandard = (
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
        eyebrow={<Narrow4Eyebrow segments={narrow4.eyebrowSegments} register="standard" />}
        proofOptIn
        proofSuppressed={effectiveProofSuppressed}
        ctaHidden
        tagStyle={stdTagStyle === 'native' ? undefined : stdTagStyle}
        eyebrowPlacement={eyebrowPlacement}
        aspectVarianceOverride={standardAspect}
      />
    );
  };

  return (
    <LayoutComponent
      renderFeatured={renderFeatured}
      renderStandard={renderStandard}
      renderHero={() => <HeroComponent />}
    />
  );
}
