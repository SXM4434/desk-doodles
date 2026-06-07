import React, { useEffect, useRef, useState } from 'react';
import { IS, ISe, CD } from './cards/tokens';
import { GlobalNav } from './GlobalNav';
import { useMargin } from '../state/MarginContext';
import { useGateAIonEyebrowStyle } from '../state/GateAIonEyebrowStyleContext';
import { useGateAIonTldrStyle } from '../state/GateAIonTldrStyleContext';
import { useGateAIonSectionNumberStyle } from '../state/GateAIonSectionNumberStyleContext';
import { useGateAIonProgressTrack } from '../state/GateAIonProgressTrackContext';
import { useGateAIonWithinSectionDivider } from '../state/GateAIonWithinSectionDividerContext';
import { useGateAIonDividerStyle } from '../state/GateAIonDividerStyleContext';
import { useGateAIonHeroHeight } from '../state/GateAIonHeroHeightContext';
import { useGateAIonHeroPosition } from '../state/GateAIonHeroPositionContext';
import { useGateAIonBorderRadius } from '../state/GateAIonBorderRadiusContext';
import { useGateAIonHeroAspect } from '../state/GateAIonHeroAspectContext';
import { useGateAIonInternalGap, INTERNAL_GAP_VALUES } from '../state/GateAIonInternalGapContext';
import { useGateAIonTextColumnWidth, TEXT_COLUMN_WIDTH_VALUES } from '../state/GateAIonTextColumnWidthContext';
import { useGateAIonContentAlignment } from '../state/GateAIonContentAlignmentContext';
import { useGateAIonImageWidth } from '../state/GateAIonImageWidthContext';
import { useGateAIonDualContainerEnabled } from '../state/GateAIonDualContainerEnabledContext';
import { useGateAIonDualContainerRatio } from '../state/GateAIonDualContainerRatioContext';
import { useGateAIonHeroBleed } from '../state/GateAIonHeroBleedContext';
import { useGateAIonBodyImageWidth } from '../state/GateAIonBodyImageWidthContext';
import { useGateAIonFinalImageWidth } from '../state/GateAIonFinalImageWidthContext';
import { IonHeroImage } from './ion/IonHeroImage';
import { IonBodyImage } from './ion/IonBodyImage';
import { IonFinalImage } from './ion/IonFinalImage';
import { IonProgressTrack } from './ion/IonProgressTrack';
import { useGateAIonHookMode } from '../state/GateAIonHookModeContext';
import { usePullQuoteRegisterTest } from '../state/PullQuoteRegisterTestContext';
import { useInlineEmphasisTest } from '../state/InlineEmphasisTestContext';
import { useGateAIonSection01Position } from '../state/GateAIonSection01PositionContext';
import { useGateAIonPreTocHeroWidth } from '../state/GateAIonPreTocHeroWidthContext';
import { useGateAIonEyebrowSpacing, EYEBROW_SPACING_VALUES } from '../state/GateAIonEyebrowSpacingContext';
import { useGateAIonSectionNumberSpacing, SECTION_NUMBER_SPACING_VALUES } from '../state/GateAIonSectionNumberSpacingContext';
import { useGateAIonEyebrowChunkGap, EYEBROW_CHUNK_GAP_VALUES } from '../state/GateAIonEyebrowChunkGapContext';
import { useGateAIonHeroDensityMode, HERO_DENSITY_MODE_VALUES } from '../state/GateAIonHeroDensityModeContext';
import { useGateAIonS05GuardrailsLayout } from '../state/GateAIonS05GuardrailsLayoutContext';
import { useGateAIonTldrPosition } from '../state/GateAIonTldrPositionContext';
import { useGateAIonS01ContributionGrid } from '../state/GateAIonS01ContributionGridContext';
import { useGateAIonS01TldrRegister } from '../state/GateAIonS01TldrRegisterContext';
import { useGateAIonS01MetaStrip } from '../state/GateAIonS01MetaStripContext';
import { useGateAIonMetaStripPosition } from '../state/GateAIonMetaStripPositionContext';
import { useGateAIonS03Direction } from '../state/GateAIonS03DirectionContext';
import { useGateAIonS03PersonaArtifact } from '../state/GateAIonS03PersonaArtifactContext';
import { useGateAIonS03PersonaContentDensity } from '../state/GateAIonS03PersonaContentDensityContext';
import { useGateAIonS03SubSectionGap, SUB_SECTION_ROW_PADDING, SUB_SECTION_GAP } from '../state/GateAIonS03SubSectionGapContext';
import { PersonaArtifactRenderer, NativePersonaCalloutBlock } from './GateAIonS03PersonaArtifacts';
import { roughLinePath, roughOvalPath } from '../lib/handFeel';
import { B1VennPositioning } from './artifacts/B1VennPositioning';
import { C1Funnel } from './artifacts/C1Funnel';
import { BeforeAfterSlider } from './artifacts/BeforeAfterSlider';
import { useGateAIonS07RowId } from '../state/GateAIonS07RowIdContext';
import { useGateAIonS02ArtifactTreatment } from '../state/GateAIonS02ArtifactTreatmentContext';
import { useMediaFrame } from '../state/MediaFrameContext';
import { useGateAIonOutcomesMode } from '../state/GateAIonOutcomesModeContext';

// ── TOC groups — locked navigation system vocabulary ─────────────────────────
// Groups: Context / Process / Solution / Results (flagship, 4 groups, 10 sections)
// Labels abbreviated per locked rule (1-2 words, distinctive noun)
const GROUPS = [
  {
    label: 'Context',
    children: [
      { label: 'Overview', id: 's01' },
      { label: 'Problem', id: 's02' },
    ],
  },
  {
    label: 'Process',
    children: [
      { label: 'Discovery', id: 's03' },
      { label: 'Deeper Issue', id: 's04' },
      { label: 'Reframe', id: 's05' },
    ],
  },
  {
    label: 'Solution',
    children: [
      { label: "Ruby's Journey", id: 's06' },
      { label: 'Decisions', id: 's07' },
      { label: 'Trade-offs', id: 's08' },
    ],
  },
  {
    label: 'Results',
    children: [
      { label: 'Outcomes', id: 's09' },
      { label: 'Reflection', id: 's10' },
    ],
  },
];

const ALL_IDS = GROUPS.flatMap(g => g.children.map(c => c.id));

// ── Sticky offsets ───────────────────────────────────────────────────────────
// LabShell publishes --lab-shell-h. GlobalNav sticks flush below it (~52px tall:
// 16px pad × 2 + 13px IS 500 LH 1.4 + 1px border ≈ 51px → 52px).
const GLOBAL_NAV_H = 52;
const RAIL_TOP = `calc(var(--lab-shell-h, 40px) + ${GLOBAL_NAV_H}px)`;
const RAIL_WIDTH = 200;

// ── ChildItem — locked: simple hover, 2px left border on current ─────────────
// State model per Navigation §7 (locked):
//   default → opacity 0.55 · hover → 0.80 · current → 1.0 + 2px left border.
// Opacity over text-primary (not color-token swap) per Step 5 visual proof — closes flag #62
// (audit conformance gap 2026-05-13). Transition `opacity 150ms ease` mirrors locked "color
// 150ms ease" timing — the locked transition timing was the timing reference, the property
// is opacity since the locked state model is opacity-driven.
function ChildItem({
  child,
  isCurrent,
  marginTop,
  ordinal,
}: {
  child: { label: string; id: string };
  isCurrent: boolean;
  marginTop: number;
  ordinal?: string;
}) {
  const [hovered, setHovered] = useState(false);
  const opacity = isCurrent ? 1 : hovered ? 0.8 : 0.55;
  return (
    <a
      href={`#${child.id}`}
      style={{
        display: 'block',
        marginTop,
        paddingLeft: 12,
        fontFamily: IS,
        fontSize: 11,
        fontWeight: 500,
        lineHeight: 1.4,
        color: 'var(--dir-text-primary)',
        opacity,
        textDecoration: 'none',
        borderLeft: isCurrent
          ? '2px solid var(--dir-accent)'
          : '2px solid transparent',
        transition: 'opacity 150ms ease, border-color 150ms ease',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {ordinal && (
        <span style={{ color: 'var(--dir-detail)', marginRight: 8 }}>{ordinal}</span>
      )}
      {child.label}
    </a>
  );
}

// ── LocalRail — ported from Navigation System Lab LocalRail.tsx ──────────────
// Flagship mode: progress track + back to top utility (copy link removed)
// Utility placement: bottom cluster (locked winner from Step 5)
function LocalRail({ contentRef, topPadding = 48 }: { contentRef: React.RefObject<HTMLElement | null>; topPadding?: number }) {
  const { state: progressTrackState } = useGateAIonProgressTrack();
  const { state: sectionNumberStyle } = useGateAIonSectionNumberStyle();
  const [currentSection, setCurrentSection] = useState<string | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Scrollspy via IntersectionObserver
  useEffect(() => {
    const visible = new Set<string>();
    const observers: IntersectionObserver[] = [];
    ALL_IDS.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) visible.add(id);
          else visible.delete(id);
          const first = ALL_IDS.find(i => visible.has(i));
          if (first) setCurrentSection(first);
        },
        { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach(o => o.disconnect());
  }, []);

  // Back to top threshold
  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 300);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleBackToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <aside
      style={{
        width: RAIL_WIDTH,
        flexShrink: 0,
        position: 'sticky',
        top: RAIL_TOP,
        height: `calc(100vh - ${RAIL_TOP})`,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Upper: scrollable TOC + progress track. paddingTop wired to align CONTEXT label with the first eyebrow on the page — hero eyebrow in default mode (heroDensity.section) or §01 secWrap paddingTop in pre-toc mode (48). */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          scrollbarWidth: 'none',
          paddingTop: topPadding,
          paddingBottom: 8,
        }}
      >
        {/* Progress track — flagship, above TOC, 24px margin below */}
        {progressTrackState !== 'hidden' && progressTrackState !== 'top-bar' && (
          <div style={{ marginBottom: 24 }}>
            <IonProgressTrack
              contentRef={contentRef}
              variant={progressTrackState}
              sectionIds={ALL_IDS}
              currentSectionId={currentSection}
            />
          </div>
        )}

        {/* Grouped TOC */}
        <nav>
          {(() => {
            let runningOrdinal = 0;
            return GROUPS.map((group, gi) => {
              const groupActive = group.children.some(c => c.id === currentSection);
              return (
                <div key={group.label} style={{ marginTop: gi > 0 ? 16 : 0 }}>
                  {/* Group header — non-clickable, aria-hidden */}
                  <div
                    aria-hidden="true"
                    style={{
                      fontFamily: IS,
                      fontSize: 10,
                      fontWeight: 500,
                      lineHeight: 1.4,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: groupActive ? 'var(--dir-text-secondary)' : 'var(--dir-detail)',
                      cursor: 'default',
                      userSelect: 'none',
                      marginBottom: 4,
                      transition: 'color 200ms ease',
                    }}
                  >
                    {group.label}
                  </div>
                  {/* Child links — indented 12px, simple hover, 2px left border on current */}
                  {group.children.map((child, ci) => {
                    runningOrdinal += 1;
                    const ordinal = sectionNumberStyle === 'rail-internal'
                      ? String(runningOrdinal).padStart(2, '0')
                      : undefined;
                    return (
                      <ChildItem
                        key={child.id}
                        child={child}
                        isCurrent={currentSection === child.id}
                        marginTop={ci > 0 ? 8 : 0}
                        ordinal={ordinal}
                      />
                    );
                  })}
                </div>
              );
            });
          })()}
        </nav>
      </div>

      {/* Lower: back to top pinned to bottom, separated by border */}
      <div
        style={{
          flexShrink: 0,
          overflow: 'hidden',
          maxHeight: showBackToTop ? '52px' : '0',
          opacity: showBackToTop ? 1 : 0,
          transition: 'max-height 200ms ease, opacity 200ms ease',
        }}
      >
        <div
          style={{
            borderTop: '1px solid var(--dir-border)',
            paddingTop: 12,
            paddingBottom: 16,
          }}
        >
          {/* Back to top — utility nav per Nav §7. State model: default 0.55 · hover 0.80 opacity over text-primary. Refactor 2026-05-13 (flag #62 close). */}
          <button
            type="button"
            onClick={handleBackToTop}
            style={{
              display: 'block',
              fontFamily: IS,
              fontSize: 11,
              fontWeight: 500,
              lineHeight: 1.4,
              color: 'var(--dir-text-primary)',
              opacity: 0.55,
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'opacity 150ms ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '0.55')}
          >
            Back to top
          </button>
        </div>
      </div>
    </aside>
  );
}

// ── GateAIonR1Shell ──────────────────────────────────────────────────────────
// Layout: GlobalNav (sticky below LabShell) → 1120px centered flex row
// Left: LocalRail 200px · Right: main content column up to 680px reading width
// scrollMarginTop on sections clears LabShell + GlobalNav + buffer
const SCROLL_MARGIN = `calc(var(--lab-shell-h, 40px) + ${GLOBAL_NAV_H}px + 24px)`;

// ── Local toggle types (section-specific, not global context) ────────────────
type ContribGrid = '3-col' | '2-col' | '1-col';
type MetaFormat = 'flex-wrap' | 'grid-2' | 'stack';
type BlockquoteStyle = 'left-border' | 'centered' | 'plain' | 'bg-raised';
type StatsFormat = 'inline-flex' | 'grid-2' | 'stack';
type UserTypesFormat = 'left-border-rows' | 'cards' | 'plain';
type InsightRows = 'border-top' | 'bg-alt' | 'plain';
type DiagnosisStyle = 'ise-17' | 'is-15-500' | 'is-15-italic';
type GuardrailsFormat = 'left-border-list' | 'numbered' | 'cards';
type BeforeAfterFormat = '2-box' | 'arrow-row' | 'stacked';
type StatusChipStyle = 'uppercase-text' | 'pill-outlined' | 'dot';
type ReflectionTier = 'tier-1' | 'tier-2';

export function GateAIonR1Shell() {
  const contentRef = useRef<HTMLElement>(null);

  // ── Global context reads (LabShell chrome controls these) ────────────────
  const { value: marginPx, mode: marginMode } = useMargin();
  const { state: eyebrowStyle } = useGateAIonEyebrowStyle();
  const { state: tldrStyle } = useGateAIonTldrStyle();
  const { state: sectionNumberStyle } = useGateAIonSectionNumberStyle();
  const { state: withinSectionDivider } = useGateAIonWithinSectionDivider();
  const { state: dividerStyle } = useGateAIonDividerStyle();
  const { state: heroHeight } = useGateAIonHeroHeight();
  const { state: heroPosition } = useGateAIonHeroPosition();
  const { state: borderRadius } = useGateAIonBorderRadius();
  const { state: heroAspect } = useGateAIonHeroAspect();
  const { state: internalGapState } = useGateAIonInternalGap();
  const { state: textColumnWidthState } = useGateAIonTextColumnWidth();
  const { state: contentAlignmentState } = useGateAIonContentAlignment();
  const { state: imageWidthState } = useGateAIonImageWidth();
  const { state: dualEnabled } = useGateAIonDualContainerEnabled();
  const { state: dualRatio } = useGateAIonDualContainerRatio();
  const { state: hookModeState } = useGateAIonHookMode();
  const { state: section01Position } = useGateAIonSection01Position();
  const { state: preTocHeroWidth } = useGateAIonPreTocHeroWidth();
  const { state: eyebrowSpacing } = useGateAIonEyebrowSpacing();
  const { state: sectionNumberSpacing } = useGateAIonSectionNumberSpacing();
  const { state: eyebrowChunkGap } = useGateAIonEyebrowChunkGap();
  const { state: heroDensityMode } = useGateAIonHeroDensityMode();
  const heroDensity = HERO_DENSITY_MODE_VALUES[heroDensityMode];
  const { state: s05GuardrailsLayout } = useGateAIonS05GuardrailsLayout();
  const { state: tldrPosition } = useGateAIonTldrPosition();
  const { state: tldrRegisterState } = useGateAIonS01TldrRegister();
  const { state: contributionGrid } = useGateAIonS01ContributionGrid();
  const { state: metaStrip } = useGateAIonS01MetaStrip();
  const { state: metaStripPosition } = useGateAIonMetaStripPosition();
  const { state: progressTrackState } = useGateAIonProgressTrack();
  const { state: s03Direction } = useGateAIonS03Direction();
  const { state: s03PersonaArtifact } = useGateAIonS03PersonaArtifact();
  const { state: s03PersonaContentDensity } = useGateAIonS03PersonaContentDensity();
  const { state: s03SubSectionGapState } = useGateAIonS03SubSectionGap();
  const s03RowPadding = SUB_SECTION_ROW_PADDING[s03SubSectionGapState];
  const s03SubSectionGap = SUB_SECTION_GAP[s03SubSectionGapState];
  const { state: s07RowId } = useGateAIonS07RowId();
  const { state: s02ArtifactTreatment } = useGateAIonS02ArtifactTreatment();
  // Media frame toggle (B3 build 2026-05-25). Default 'none' preserves the
  // existing §02 native render. 'hairline' adds 1px --dir-border to the
  // image-wrapper div. Lab-wide context; applied selectively per surface.
  const { state: mediaFrame } = useMediaFrame();
  const { state: outcomesMode } = useGateAIonOutcomesMode();

  // ── Hero geometry derived from heroAspect ────────────────────────────────
  const ASPECT_RATIO_MAP: Record<string, string> = {
    widescreen: '16/9',
    cinematic: '21/9',
    anamorphic: '2.39/1',
    golden: '1.618/1',
    academy: '4/3',
    square: '1/1',
    portrait: '9/16',
  };
  // 'natural' hero-height takes priority over any aspect-ratio crop: image
  // renders at its intrinsic aspect, never cropped. Same semantic as the older
  // heroAspect === 'fill-cell' (flagged as tech-debt to consolidate).
  const isNaturalHeight = heroHeight === 'natural';
  const heroWrapperStyle: React.CSSProperties =
    isNaturalHeight
      ? { width: '100%', height: 'auto', overflow: 'hidden', borderRadius, marginBottom: 32 }
      : heroAspect === 'native'
        ? { width: '100%', height: heroHeight, overflow: 'hidden', borderRadius, marginBottom: 32 }
        : heroAspect === 'fill-cell'
          ? { width: '100%', height: 'auto', overflow: 'hidden', borderRadius, marginBottom: 32 }
          : { width: '100%', aspectRatio: ASPECT_RATIO_MAP[heroAspect], overflow: 'hidden', borderRadius, marginBottom: 32 };
  const heroImgStyle: React.CSSProperties =
    isNaturalHeight || heroAspect === 'fill-cell'
      ? { width: '100%', height: 'auto', display: 'block' }
      : { width: '100%', height: '100%', objectFit: 'cover', objectPosition: heroPosition, display: 'block' };

  // ── Local toggles (section-specific, not exposed in LabShell) ───────────
  const [contribGrid, setContribGrid] = useState<ContribGrid>('3-col');
  const [metaFormat, setMetaFormat] = useState<MetaFormat>('flex-wrap');
  const [blockquoteStyle, setBlockquoteStyle] = useState<BlockquoteStyle>('left-border');
  const [statsFormat, setStatsFormat] = useState<StatsFormat>('inline-flex');
  const [userTypesFormat, setUserTypesFormat] = useState<UserTypesFormat>('left-border-rows');
  const [insightRows, setInsightRows] = useState<InsightRows>('border-top');
  const [diagnosisStyle, setDiagnosisStyle] = useState<DiagnosisStyle>('ise-17');
  const [guardrailsFormat, setGuardrailsFormat] = useState<GuardrailsFormat>('left-border-list');
  const [beforeAfterFormat, setBeforeAfterFormat] = useState<BeforeAfterFormat>('2-box');
  const [statusChipStyle, setStatusChipStyle] = useState<StatusChipStyle>('uppercase-text');
  const [decisionsOpen, setDecisionsOpen] = useState<number | null>(1);
  const [rowFormat] = useState<'2-col'>('2-col');
  const [reflectionTier, setReflectionTier] = useState<ReflectionTier>('tier-1');

  // ── Derived styles from toggles ───────────────────────────────────────────
  const sectionDivider = (last: boolean): string => {
    if (last || dividerStyle === 'none') return 'none';
    if (dividerStyle === 'dotted') return '1px dotted var(--dir-border)';
    if (dividerStyle === 'thick') return '2px solid var(--dir-border)';
    if (dividerStyle === 'dashed') return '1px dashed var(--dir-border)';
    return '1px solid var(--dir-border)';
  };

  // ── Layout computed values ─────────────────────────────────────────────────
  const gapPx = INTERNAL_GAP_VALUES[internalGapState];

  // Raw text column width (TEXT WIDTH toggle only)
  const textColMaxWidth: number | undefined = (() => {
    if (textColumnWidthState === 'full') return undefined;
    if (textColumnWidthState === 'native') return marginMode === 'centered' ? 680 : undefined;
    return TEXT_COLUMN_WIDTH_VALUES[textColumnWidthState];
  })();

  // Dual container inner width (only meaningful when dual is on)
  const dualIsOn = dualEnabled === 'on';
  const dualInnerWidth: number | string | undefined = dualIsOn ? (() => {
    const r = dualRatio === 'native' ? 'narrow-fixed' : dualRatio;
    switch (r) {
      case 'narrow-fixed':  return 520;
      case 'narrow-text':   return 480;
      case 'two-thirds':    return '66.6%';
      case 'golden':        return '61.8%';
      case 'van-de-graaf':  return '62.5%';
      case 'iso':           return '70.7%';
      case 'half':          return '50%';
    }
  })() : undefined;

  // Priority ladder: spread > dual ratio > text width > centered default > none
  // effectiveMaxWidth is the single resolved value used by both gridCols and twStyle
  const isSpread = contentAlignmentState === 'spread';
  const effectiveMaxWidth: number | string | undefined = (() => {
    if (isSpread) return undefined;
    if (dualIsOn) return dualInnerWidth;
    return textColMaxWidth;
  })();

  const contentAlignStyle: React.CSSProperties = (() => {
    switch (contentAlignmentState) {
      case 'left':       return { marginRight: 'auto' };
      case 'center':     return { margin: '0 auto' };
      case 'right':      return { marginLeft: 'auto' };
      case 'flush-left': return { marginLeft: 0, marginRight: 'auto' };
      default:           return {};
    }
  })();

  // gridCols uses effectiveMaxWidth — keeps gridColT (hero, TL;DR) consistent with twStyle (sections)
  const gridCols = (() => {
    if (effectiveMaxWidth === undefined) return '1fr';
    const col = typeof effectiveMaxWidth === 'number'
      ? `min(${effectiveMaxWidth}px, 100%)`
      : `min(${effectiveMaxWidth}, 100%)`;
    switch (contentAlignmentState) {
      case 'center':     return `1fr ${col} 1fr`;
      case 'left':       return `0px ${col} 1fr`;
      case 'right':      return `1fr ${col} 0px`;
      case 'flush-left': return `0px ${col} 1fr`;
      default:           return `1fr ${col} 1fr`;
    }
  })();
  const gridColT = effectiveMaxWidth !== undefined ? '2' : '1';
  const gridColF = effectiveMaxWidth !== undefined ? '1 / -1' : '1';

  // Centered content alignment overrides the rail-to-content gap — content auto-centers
  // in the post-rail area (rail right edge → viewport right edge), so the gap value becomes
  // structurally irrelevant in centered modes. xxl/generous gap tokens stay callable for
  // non-centered alignments only.
  const effectiveGapPx = contentAlignmentState === 'center' ? 0 : gapPx;

  // Pre-built outer div style — CSS custom properties require explicit cast
  const outerContainerStyle = {
    ...(marginMode === 'centered'
      ? { maxWidth: '1120px', margin: '0 auto', padding: '0 48px' }
      : { paddingLeft: marginPx, paddingRight: marginPx }),
    boxSizing: 'border-box' as const,
    display: 'flex' as const,
    alignItems: 'flex-start' as const,
    gap: effectiveGapPx,
    '--ion-page-margin': `${marginPx}px`,
    '--ion-internal-gap': `${effectiveGapPx}px`,
    '--ion-auto-margin': marginMode === 'centered' ? 'max(0px, calc(50cqi - 560px))' : '0px',
    '--ion-content-left-offset': `calc(${marginPx}px + 200px + ${effectiveGapPx}px + var(--ion-auto-margin, 0px))`,
  } as unknown as React.CSSProperties;

  // ── Live CPL debug overlay (typography measurement pass) ──
  // Reads the actual rendered IS 15/400 body (post Cycle 2 surgical revision 2026-05-07 / flag #36 — IS 300 phantom resolved), computes via canvas measureText, updates on width change.
  // Remove once text-column-width register is locked.
  const [cplInfo, setCplInfo] = useState<{ width: number; cpl: number; avg: number } | null>(null);
  useEffect(() => {
    const id = window.setTimeout(() => {
      const ctx = document.createElement('canvas').getContext('2d');
      if (!ctx) return;
      const sample = "The product was in MVP form, but users kept saying the same thing they had said in conversation: it was difficult to achieve what I had in mind. Users could complete the flow but they didn't trust the output enough to iterate so adoption couldn't compound.";
      // Find a real body paragraph (15px IS 300) so we measure with the actual computed font
      const candidates = Array.from(document.querySelectorAll<HTMLElement>('section p'));
      const bodyP = candidates.find(p => {
        const cs = getComputedStyle(p);
        return parseFloat(cs.fontSize) === 15 && cs.fontWeight === '300';
      });
      if (bodyP) {
        const cs = getComputedStyle(bodyP);
        ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
        const measured = ctx.measureText(sample).width;
        const avg = measured / sample.length;
        const w = bodyP.offsetWidth;
        setCplInfo({ width: w, cpl: w / avg, avg });
      } else {
        // Fallback: measure with Instrument Sans 15/300 against effectiveMaxWidth
        ctx.font = '300 15px "Instrument Sans", sans-serif';
        const measured = ctx.measureText(sample).width;
        const avg = measured / sample.length;
        const w = typeof effectiveMaxWidth === 'number' ? effectiveMaxWidth : 0;
        if (w > 0) setCplInfo({ width: w, cpl: w / avg, avg });
      }
    }, 100);
    return () => window.clearTimeout(id);
  }, [effectiveMaxWidth, marginMode, contentAlignmentState]);

  // ── Shared style helpers (used in both default and pre-toc render paths) ──
  const N: React.CSSProperties = { fontFamily: IS, fontSize: 10, fontWeight: 500, lineHeight: 1.4, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-text-secondary)', margin: 0, marginBottom: SECTION_NUMBER_SPACING_VALUES[sectionNumberSpacing] };
  const H2: React.CSSProperties = { fontFamily: ISe, fontSize: 22, fontWeight: 400, lineHeight: 1.25, letterSpacing: '-0.02em', color: 'var(--dir-text-primary)', margin: 0, marginBottom: 24 };
  // Section heading — Cycle 1 surgical revision 2026-05-07: ISe 32 (Editorial Intro Heading reactivated). Used for case-study section headers per locked cascade.
  const SH: React.CSSProperties = { fontFamily: ISe, fontSize: 32, fontWeight: 400, lineHeight: 1.18, letterSpacing: '-0.025em', color: 'var(--dir-text-primary)', margin: 0, marginBottom: 24 };
  // Cycle 4 — Pull quote register A/B test toggle. Resolves to 6 candidate styles for §02 blockquote + §04 deeper-issue line.
  const { state: pullQuoteRegisterState } = usePullQuoteRegisterTest();
  const PULL_QUOTE_STYLE: React.CSSProperties = (() => {
    if (pullQuoteRegisterState === 'is-15-italic') return { fontFamily: IS, fontSize: 15, fontWeight: 400, fontStyle: 'italic', lineHeight: 1.5, letterSpacing: 0, color: 'var(--dir-text-primary)', margin: 0 };
    if (pullQuoteRegisterState === 'ise-15-italic') return { fontFamily: ISe, fontSize: 15, fontWeight: 400, fontStyle: 'italic', lineHeight: 1.5, letterSpacing: 0, color: 'var(--dir-text-primary)', margin: 0 };
    if (pullQuoteRegisterState === 'ise-18-upright') return { fontFamily: ISe, fontSize: 18, fontWeight: 400, lineHeight: 1.4, letterSpacing: '-0.01em', color: 'var(--dir-text-primary)', margin: 0 };
    if (pullQuoteRegisterState === 'ise-18-italic') return { fontFamily: ISe, fontSize: 18, fontWeight: 400, fontStyle: 'italic', lineHeight: 1.4, letterSpacing: '-0.01em', color: 'var(--dir-text-primary)', margin: 0 };
    if (pullQuoteRegisterState === 'ise-22-italic') return { fontFamily: ISe, fontSize: 22, fontWeight: 400, fontStyle: 'italic', lineHeight: 1.25, letterSpacing: '-0.02em', color: 'var(--dir-text-primary)', margin: 0 };
    // ise-22-upright (default fallback)
    return { fontFamily: ISe, fontSize: 22, fontWeight: 400, lineHeight: 1.25, letterSpacing: '-0.02em', color: 'var(--dir-text-primary)', margin: 0 };
  })();
  // Cycle 4 — Inline emphasis A/B test (italic / bold / native). Applied to inline emphasis spots within body paragraphs.
  const { state: inlineEmphasisState } = useInlineEmphasisTest();
  const INLINE_EMPHASIS_STYLE: React.CSSProperties = (() => {
    if (inlineEmphasisState === 'italic') return { fontStyle: 'italic', color: 'var(--dir-text-primary)' };
    if (inlineEmphasisState === 'bold') return { fontWeight: 600, color: 'var(--dir-text-primary)' };
    if (inlineEmphasisState === 'italic-bold') return { fontStyle: 'italic', fontWeight: 600, color: 'var(--dir-text-primary)' };
    // native — current state (matches what was inline before toggle)
    return { fontWeight: 600, color: 'var(--dir-text-primary)' };
  })();
  // Cycle 2 — Body bucket: IS 400 / 15 / 1.75 / 0 tracking (Typography "Body" role).
  // Color: --dir-text-body per Cycle 9 W1 reopen close 2026-05-13 (was text-primary pre-reopen).
  // Title↔body adjacency contrast resolved by sanctioned body-tier ink exception on W1 axis;
  // title register stays at --dir-text-primary (#121110), body shifts to --dir-text-body (#383632).
  const BODY: React.CSSProperties = { fontFamily: IS, fontSize: 15, fontWeight: 400, lineHeight: 1.5, color: 'var(--dir-text-body)', margin: 0 };
  const DENSE: React.CSSProperties = { fontFamily: IS, fontSize: 13, fontWeight: 400, lineHeight: 1.6, color: 'var(--dir-text-body)', margin: 0 };
  const CAPS: React.CSSProperties = { fontFamily: IS, fontSize: 10, fontWeight: 500, lineHeight: 1.4, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-text-secondary)', margin: 0 };
  // Cycle 11 close 2026-05-16 — IS CAPS sub-section TITLE tier LOCKED. CAPS_15 + CAPS_13 are TITLES (replace dropped IS 18 Sub-heading title work). All CAPS tiers at IS 500 + IS sans (locked family weight, matches CAPS 10 family discipline). Differentiation between label tier (CAPS 10) vs title tiers (CAPS 13/15) is carried by SIZE (10 vs 13 vs 15) + COLOR (text-secondary on CAPS 10, text-primary on CAPS 13/15), NOT weight or family. Three-tier CAPS family: eyebrow (10/500/secondary) · compressed title (13/500/primary) · common title (15/500/primary). Weight + family toggles (CapsTitleWeightContext, CapsTitleFamilyContext) dropped 2026-05-16 after visual A/B in lab confirmed IS 500 + IS sans as the right defaults — ISe at small CAPS sizes is barely perceptible; IS 600 too heavy; IS 400 below family-precedent weight. Title vs Label rule: marker INTRODUCING titled items below = label (CAPS 10); marker DIRECTLY titling body block = title (CAPS 15 or CAPS 13 compressed).
  const CAPS_15: React.CSSProperties = { fontFamily: IS, fontSize: 15, fontWeight: 500, lineHeight: 1.4, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-text-primary)', margin: 0 };
  const CAPS_13: React.CSSProperties = { fontFamily: IS, fontSize: 13, fontWeight: 500, lineHeight: 1.4, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-text-primary)', margin: 0 };
  // Cycle 9 lock 2026-05-12 (flag #48 resolved) — META_VALUE register: Dense Body 13 + text-secondary color. Sanctioned ONLY for the metadata-value role paired with IS 10/UC label inside a structurally-bounded panel (strip / sub-grid / dedicated metadata block). Earning conditions and anti-drift locked in `typography-system.md` §F Exception Policy + §H Anti-Drift. Do not use text-secondary on Dense Body 13 for narrative body, callouts, or any softer-body register need outside the metadata-value role.
  const META_VALUE: React.CSSProperties = { ...DENSE, color: 'var(--dir-text-secondary)' };
  const withinSectionBorder = (): string => {
    if (withinSectionDivider === 'none') return 'none';
    if (withinSectionDivider === 'muted-rule') return '1px solid var(--dir-muted)';
    if (withinSectionDivider === 'dotted') return '1px dotted var(--dir-border)';
    if (withinSectionDivider === 'thick-rule') return '2px solid var(--dir-border)';
    return '1px solid var(--dir-border)';
  };
  const SHPair = (num: string, title: string) => {
    // Cycle 1 refactor (per audit §0.5): SHPair now renders the section identifier as an EYEBROW, not as H2.
    // The actual section Title (the bold heading content) lives inside each module's body, not here.
    // sectionNumberStyle toggles control how the section NUMBER is layered onto the eyebrow base.
    // ISe 22/400 H2 register removed — it was the misframe.
    const EYEBROW_BASE: React.CSSProperties = {
      fontFamily: IS, fontSize: 10, fontWeight: 500, lineHeight: 1.4,
      letterSpacing: '0.12em', textTransform: 'uppercase',
      color: 'var(--dir-text-secondary)', margin: 0, marginBottom: 12,
    };
    // §# GAP toggle (sectionNumberSpacing) — Type 1: §# section identifier → section title. Locked tight=4 default. The §# eyebrow is a structural identifier paired with a separate headline below; this gap is its own relationship, distinct from Type 2+3 mini-title gaps (controlled by GateAIonEyebrowChunkGapContext, locked compact=12 default).
    const EYEBROW_TO_TITLE_GAP = SECTION_NUMBER_SPACING_VALUES[sectionNumberSpacing];
    const eyebrowWithGap: React.CSSProperties = { ...EYEBROW_BASE, marginBottom: EYEBROW_TO_TITLE_GAP };
    if (sectionNumberStyle === 'hidden') return <p style={eyebrowWithGap}>{title}</p>;
    if (sectionNumberStyle === 'rail-internal') return <p style={eyebrowWithGap}>{title}</p>;
    if (sectionNumberStyle === 'marginal') return (
      <div style={{ position: 'relative', marginBottom: EYEBROW_TO_TITLE_GAP }}>
        <p style={{ ...EYEBROW_BASE, position: 'absolute', left: -48, top: 0, marginBottom: 0, color: 'var(--dir-detail)' }}>{num}</p>
        <p style={{ ...EYEBROW_BASE, marginBottom: 0 }}>{title}</p>
      </div>
    );
    if (sectionNumberStyle === 'inline-dash') return <p style={eyebrowWithGap}><span style={{ color: 'var(--dir-detail)', marginRight: 4 }}>{num} —</span>{title}</p>;
    if (sectionNumberStyle === 'inline-dot') return <p style={eyebrowWithGap}><span style={{ color: 'var(--dir-detail)', marginRight: 4 }}>{num} ·</span>{title}</p>;
    if (sectionNumberStyle === 'pill') return (
      <div style={{ marginBottom: EYEBROW_TO_TITLE_GAP, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-text-secondary)', backgroundColor: 'var(--dir-chip-bg)', border: '1px solid var(--dir-chip-border)', borderRadius: 9999, padding: '2px 8px' }}>{num}</span>
        <p style={{ ...EYEBROW_BASE, marginBottom: 0 }}>{title}</p>
      </div>
    );
    if (sectionNumberStyle === 'large') return <>
      <p style={{ fontFamily: IS, fontSize: 28, fontWeight: 400, lineHeight: 1, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', color: 'var(--dir-detail)', margin: 0, marginBottom: 8 }}>{num}</p>
      <p style={eyebrowWithGap}>{title}</p>
    </>;
    // "Above heading" variant collapsed into inline-dash (per user 2026-05-06): both elements are eyebrow scale now, no stacked-eyebrow distinction makes sense. Default fall-through renders as inline-dash.
    return <p style={eyebrowWithGap}><span style={{ color: 'var(--dir-detail)', marginRight: 4 }}>{num} —</span>{title}</p>;
  };
  const secWrap = (_id: string, last: boolean): React.CSSProperties => ({
    // Section paddings (Cycle 6 Q5 follow-up 2026-05-11 — 128 total gap, 64/64 split).
    // Total section→section gap = 128 (Reserved token, space-11). First active use of 128 in the system — was "Reserved: not in use" per locked spacing-layout-rhythm.md §A. Earlier attempts at 48 (Section) felt cramped; 64 (Hero) too tight; 96 (Break escalation) violated Break "rare" rule. 128 is the only on-ladder value that gives enough breathing room for section→section transitions without misusing the Break tier.
    // sectionDividerEl renders INSIDE the section (before </section>), so paddingBottom adds space BELOW the divider, not above. To center the divider in the 128px gap:
    //   - Non-last sections: paddingBottom 0 + divider marginTop 64 (above border) + next section paddingTop 64 (below border) = 64+64=128 total, divider centered ✓
    //   - Last section (no divider): paddingBottom 64 so content has bottom breathing room (matching paddingTop for symmetry).
    paddingTop: 64, paddingBottom: last ? 64 : 0,
    scrollMarginTop: SCROLL_MARGIN,
    gridColumn: gridColF,
  });
  const twStyle: React.CSSProperties = effectiveMaxWidth !== undefined
    ? { maxWidth: effectiveMaxWidth, ...contentAlignStyle }
    : {};
  const sectionDividerEl = (last: boolean): React.ReactNode => {
    if (last || dividerStyle === 'none') return null;
    // Span the full grid (gridColF) + match body width + center via LONGHAND margin props.
    // Why not twStyle's `margin: '0 auto'`: the shorthand resets marginTop to 0 and fights the
    // explicit marginTop: 32, which collapsed vertical spacing when alignment='center'.
    return <div style={{
      gridColumn: gridColF,
      ...(effectiveMaxWidth !== undefined ? { maxWidth: effectiveMaxWidth } : {}),
      // marginTop: 64 — Cycle 6 Q5 follow-up 2026-05-11 (128 total gap). Divider lives INSIDE the section before </section>. 64 marginTop puts the border line 64px below the section's last content. Section's paddingBottom is 0 for non-last sections so nothing extra sits between border and </section>. Next section's paddingTop (64) provides the below-border space. Result: 64 above border + 64 below border = centered divider in 128px section→section gap (space-11 Reserved token, first active use).
      marginTop: 64,
      marginBottom: 0,
      ...(contentAlignmentState === 'center' ? { marginLeft: 'auto', marginRight: 'auto' } : {}),
      ...(contentAlignmentState === 'left' ? { marginLeft: 0, marginRight: 'auto' } : {}),
      ...(contentAlignmentState === 'right' ? { marginLeft: 'auto', marginRight: 0 } : {}),
      ...(contentAlignmentState === 'flush-left' ? { marginLeft: 0, marginRight: 'auto' } : {}),
      borderTop: sectionDivider(false),
    }} />;
  };
  const imgStyle: React.CSSProperties =
    (imageWidthState === 'match-text' || imageWidthState === 'sections-only') ? twStyle : {};

  // TL;DR inner content — shared across both render positions (after-subtitle / after-hero)
  const TLDR_COPY = "We moved Ion to Slack-first entry and built Ruby's guardrails + hybrid controls so teams could explore fast without losing control.";
  const tldrContent: React.ReactNode = (() => {
    // ── §01 TLDR Register branches (short-circuit before tldrStyle visual chrome) ──
    // ★ Rec markers per gate-a-ion-tldr-contrib-research.md
    if (tldrRegisterState === 'tldr-standfirst') return (
      // ★ Rec — ISe paragraph sized between H1 and body (newspaper standfirst register)
      <p style={{ fontFamily: ISe, fontSize: 22, fontWeight: 400, lineHeight: 1.25, letterSpacing: '-0.02em', color: 'var(--dir-text-primary)', margin: 0, maxWidth: 640 }}>{TLDR_COPY}</p>
    );
    if (tldrRegisterState === 'tldr-dek') return (
      // ★ Rec — ISe italic centered bridge between hero and body (magazine dek)
      // OG long-form TL;DR with ink-pop highlights on frame ("a real design partner") + payoff ("without losing control")
      <p style={{ fontFamily: ISe, fontSize: 18, fontWeight: 400, lineHeight: 1.4, letterSpacing: '-0.01em', color: 'var(--dir-text-secondary)', margin: 0, textAlign: 'center', maxWidth: 720, marginLeft: 'auto', marginRight: 'auto' }}>
        By making Ruby <span style={{ color: 'var(--dir-text-primary)', fontWeight: 600 }}>a real design partner</span> — Slack-first entry, clarify-before-execute guardrails, and hybrid canvas + workspace controls — so teams explore fast <span style={{ color: 'var(--dir-text-primary)', fontWeight: 600 }}>without losing control</span>.
      </p>
    );
    if (tldrRegisterState === 'tldr-tombstone') return (
      // ★ Rec — title/artist/date stack (museum tombstone register)
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingTop: 16, paddingBottom: 16, borderTop: '1px solid var(--dir-border)', borderBottom: '1px solid var(--dir-border)' }}>
        <p style={{ fontFamily: ISe, fontSize: 18, fontWeight: 400, lineHeight: 1.4, color: 'var(--dir-text-primary)', margin: 0 }}>Slack-first Entry · Ruby's Guardrails · Hybrid Controls</p>
        {/* Flag #60 close 2026-05-24: IS 12 (off CAPS ladder) → CAPS_10 register (IS 10/500/UC/0.12em) — proper byline/metadata register per locked Type spec. Non-active variant (Sebs preset uses tldr-dek); cleanup prevents register-violation propagation. */}
        <p style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-text-secondary)', margin: 0 }}>Sebastian Munoz-Mcdonald · Ion Design · 2024</p>
        <p style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-detail)', margin: 0 }}>Product design · 12 weeks · YC W24</p>
      </div>
    );
    if (tldrRegisterState === 'tldr-eyebrow-stack') return (
      <div>
        <p style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-text-secondary)', margin: 0, marginBottom: EYEBROW_CHUNK_GAP_VALUES[eyebrowChunkGap] }}>The Move</p>
        <p style={{ fontFamily: ISe, fontSize: 18, fontWeight: 400, lineHeight: 1.5, color: 'var(--dir-text-primary)', margin: 0 }}>{TLDR_COPY}</p>
      </div>
    );
    if (tldrRegisterState === 'tldr-dropcap-lede') return (
      <p style={{ fontFamily: ISe, fontSize: 18, fontWeight: 400, lineHeight: 1.4, letterSpacing: '-0.01em', color: 'var(--dir-text-primary)', margin: 0 }}>
        <span style={{ fontFamily: ISe, fontSize: 52, fontWeight: 400, lineHeight: 1.08, letterSpacing: '-0.03em', float: 'left', marginRight: 8, marginTop: 4, color: 'var(--dir-text-primary)' }}>W</span>
        e moved Ion to Slack-first entry and built Ruby's guardrails + hybrid controls so teams could explore fast without losing control.
      </p>
    );
    if (tldrRegisterState === 'tldr-epigraph') return (
      <div style={{ paddingLeft: 32, paddingRight: 32, paddingTop: 12, paddingBottom: 12 }}>
        <p style={{ fontFamily: ISe, fontSize: 18, fontWeight: 400, lineHeight: 1.4, letterSpacing: '-0.01em', color: 'var(--dir-text-secondary)', margin: 0, marginBottom: 8 }}>"{TLDR_COPY}"</p>
        {/* Flag #60 close 2026-05-24: IS 11 (off CAPS ladder) → CAPS_10 register (IS 10/500/UC/0.12em). Non-active variant cleanup. */}
        <p style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-detail)', margin: 0 }}>— Project thesis, Ion 2024</p>
      </div>
    );
    if (tldrRegisterState === 'tldr-pullquote-scale') return (
      <p style={{ fontFamily: ISe, fontSize: 22, fontWeight: 400, lineHeight: 1.25, letterSpacing: '-0.02em', color: 'var(--dir-text-primary)', margin: 0 }}>{TLDR_COPY}</p>
    );
    if (tldrRegisterState === 'tldr-abstract-column') return (
      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 24, alignItems: 'baseline' }}>
        <p style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-text-secondary)', margin: 0 }}>Abstract</p>
        <p style={{ fontFamily: IS, fontSize: 13, fontWeight: 400, lineHeight: 1.6, color: 'var(--dir-text-secondary)', margin: 0, maxWidth: 520 }}>{TLDR_COPY}</p>
      </div>
    );
    if (tldrStyle === 'left-border') return (
      <div style={{ borderLeft: '2px solid var(--dir-detail)', paddingLeft: 24, paddingTop: 16, paddingBottom: 16, backgroundColor: 'var(--dir-raised)', paddingRight: 24, borderRadius: `0 ${borderRadius}px ${borderRadius}px 0` }}>
        <p style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-text-secondary)', margin: 0, marginBottom: EYEBROW_CHUNK_GAP_VALUES[eyebrowChunkGap] }}>TL;DR</p>
        <p style={{ fontFamily: IS, fontSize: 15, fontWeight: 400, lineHeight: 1.5, color: 'var(--dir-text-secondary)', margin: 0 }}>We moved Ion to Slack-first entry and built Ruby's guardrails + hybrid controls so teams could explore fast without losing control.</p>
      </div>
    );
    if (tldrStyle === 'label-split') return (
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', paddingTop: 16, paddingBottom: 16 }}>
        <p style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-text-secondary)', margin: 0, flexShrink: 0, paddingTop: 4 }}>TL;DR</p>
        <div style={{ width: 1, backgroundColor: 'var(--dir-border)', flexShrink: 0, alignSelf: 'stretch' }} />
        <p style={{ fontFamily: IS, fontSize: 15, fontWeight: 400, lineHeight: 1.5, color: 'var(--dir-text-secondary)', margin: 0 }}>We moved Ion to Slack-first entry and built Ruby's guardrails + hybrid controls so teams could explore fast without losing control.</p>
      </div>
    );
    if (tldrStyle === 'plain') return (
      <p style={{ fontFamily: IS, fontSize: 15, fontWeight: 400, lineHeight: 1.5, color: 'var(--dir-text-secondary)', margin: 0 }}>We moved Ion to Slack-first entry and built Ruby's guardrails + hybrid controls so teams could explore fast without losing control.</p>
    );
    if (tldrStyle === 'soft-box') return (
      <div style={{ border: '1px solid var(--dir-border)', borderRadius, padding: '16px 20px', backgroundColor: 'var(--dir-raised)' }}>
        <p style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-text-secondary)', margin: 0, marginBottom: EYEBROW_CHUNK_GAP_VALUES[eyebrowChunkGap] }}>TL;DR</p>
        <p style={{ fontFamily: IS, fontSize: 15, fontWeight: 400, lineHeight: 1.5, color: 'var(--dir-text-secondary)', margin: 0 }}>We moved Ion to Slack-first entry and built Ruby's guardrails + hybrid controls so teams could explore fast without losing control.</p>
      </div>
    );
    if (tldrStyle === 'thick-rule') return (
      <div style={{ borderTop: '2px solid var(--dir-border)', borderBottom: '1px solid var(--dir-border)', paddingTop: 16, paddingBottom: 16 }}>
        <p style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-text-secondary)', margin: 0, marginBottom: EYEBROW_CHUNK_GAP_VALUES[eyebrowChunkGap] }}>TL;DR</p>
        <p style={{ fontFamily: IS, fontSize: 15, fontWeight: 400, lineHeight: 1.5, color: 'var(--dir-text-secondary)', margin: 0 }}>We moved Ion to Slack-first entry and built Ruby's guardrails + hybrid controls so teams could explore fast without losing control.</p>
      </div>
    );
    return (
      <div>
        <p style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-text-secondary)', margin: 0, marginBottom: EYEBROW_CHUNK_GAP_VALUES[eyebrowChunkGap] }}>TL;DR</p>
        <p style={{ fontFamily: IS, fontSize: 15, fontWeight: 400, lineHeight: 1.5, color: 'var(--dir-text-secondary)', margin: 0 }}>We moved Ion to Slack-first entry and built Ruby's guardrails + hybrid controls so teams could explore fast without losing control.</p>
      </div>
    );
  })();

  // ── §01 shared data ──────────────────────────────────────────────────────
  // Deliverables merged into Owned (+1) and Enabled (+2) per locked CSML rule:
  // "Deliverables are not a standalone fourth section — folded into Owned / Enabled."
  // Source of merged copy: locked lab `Case Study Module Lab/src/app/components/shared.tsx` `deliverables` export.
  const CONTRIB_COLS = [
    { label: 'What I Owned', items: ['Slack entry prototyping', 'Canvas interaction patterns', 'Property panel architecture (in dev)', 'Cross-variant editing contract (in dev)', '5 final prototypes (1 fully built, 2 with micro-interactions)'] },
    { label: 'What I Enabled', items: ['22+ components shipped', '84 icons', 'Shared design templates', 'Core animation system', 'Consistent UI output', 'Component library and templates used across the team', 'Research synthesis that shaped product direction'] },
    { label: 'How I Led Alignment', items: ['Weekly show-and-tell sessions', 'System walkthroughs with engineering', 'When misaligned: prototype competing approaches'] },
  ] as const;

  const META_ITEMS = [
    { label: 'Role', value: 'Product Designer' },
    { label: 'Ownership', value: 'Design System, Research, Prototyping' },
    { label: 'Timeline', value: '12 weeks' },
    { label: 'Core Squad', value: '1 Founder, 2 Engineers' },
    { label: 'Design Org', value: '6 Designers' },
    { label: 'Design Pod', value: '3 Designers (day-to-day)' },
    { label: 'Company', value: 'Ion Design (YC W24)' },
    { label: 'Stage', value: 'Early-stage (MVP)' },
  ] as const;

  // Pre-title strip uses 4 items only (Bill Guo pattern — Role / Timeline / Squad / Company)
  const PRE_TITLE_META = [
    { label: 'Role', value: 'Product Designer' },
    { label: 'Timeline', value: '12 weeks' },
    { label: 'Squad', value: '1 Founder, 2 Engineers' },
    { label: 'Company', value: 'Ion Design (YC W24)' },
  ] as const;

  // ── §01 contribution grid — format controlled by GateAIonS01ContributionGridContext ──
  // OG visual notes spec: inline ink-pop emphasis on the numbers (22+ / 84), not separate stat cards.
  // Helper wraps the digit prefix only — leaves all other items as plain text.
  const renderContribItem = (item: string): React.ReactNode => {
    if (item.startsWith('22+ components')) return (<><span style={{ color: 'var(--dir-text-primary)', fontWeight: 500 }}>22+</span> components shipped</>);
    if (item.startsWith('84 icons')) return (<><span style={{ color: 'var(--dir-text-primary)', fontWeight: 500 }}>84</span> icons</>);
    return item;
  };
  const contributionGridJSX: React.ReactNode = (() => {
    if (contributionGrid === 'hidden') return null;
    // topBorder = symmetric 24/24 = 48 Section (Standard mode) — centered sub-section divider per Cycle 6 Q2 + Cycle 6 Q5 section-divider pattern. Bumped marginTop 32→24 per Cycle 8 §01 audit 2026-05-12 (matches metaStripJSX topBorder at :1005). 32 was Section in Dense mode (off Standard lock).
    const topBorder = { marginTop: 24, paddingTop: 24, borderTop: withinSectionBorder() };
    if (contributionGrid === 'native') return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24, ...topBorder }}>
        {CONTRIB_COLS.map(col => (
          <div key={col.label}>
            <p style={{ ...CAPS, marginBottom: EYEBROW_CHUNK_GAP_VALUES[eyebrowChunkGap] }}>{col.label}</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {col.items.map(item => <li key={item} style={{ ...DENSE, marginBottom: 4 }}>{renderContribItem(item)}</li>)}
            </ul>
          </div>
        ))}
      </div>
    );
    if (contributionGrid === 'two-col') return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, ...topBorder }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {([CONTRIB_COLS[0], CONTRIB_COLS[1]] as typeof CONTRIB_COLS[number][]).map(col => (
            <div key={col.label}>
              <p style={{ ...CAPS, marginBottom: EYEBROW_CHUNK_GAP_VALUES[eyebrowChunkGap] }}>{col.label}</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {col.items.map(item => <li key={item} style={{ ...DENSE, marginBottom: 4 }}>{item}</li>)}
              </ul>
            </div>
          ))}
        </div>
        <div>
          <p style={{ ...CAPS, marginBottom: EYEBROW_CHUNK_GAP_VALUES[eyebrowChunkGap] }}>{CONTRIB_COLS[2].label}</p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {CONTRIB_COLS[2].items.map(item => <li key={item} style={{ ...DENSE, marginBottom: 4 }}>{item}</li>)}
          </ul>
        </div>
      </div>
    );
    if (contributionGrid === 'stacked') return (
      <div style={{ ...topBorder }}>
        {CONTRIB_COLS.map((col, i) => (
          <div key={col.label} style={{ display: 'flex', gap: 24, paddingBottom: 16, marginBottom: i < 2 ? 16 : 0, borderBottom: i < 2 ? '1px solid var(--dir-border)' : 'none', alignItems: 'baseline' }}>
            <p style={{ ...CAPS, minWidth: 160, flexShrink: 0, margin: 0 }}>{col.label}</p>
            <p style={{ ...DENSE, color: 'var(--dir-text-secondary)', margin: 0 }}>{col.items.join(' · ')}</p>
          </div>
        ))}
      </div>
    );
    if (contributionGrid === 'role-line') return (
      <div style={{ ...topBorder, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {CONTRIB_COLS.map(col => (
          <div key={col.label} style={{ display: 'flex', gap: 16, alignItems: 'baseline' }}>
            <p style={{ ...CAPS, whiteSpace: 'nowrap' }}>{col.label}</p>
            <p style={{ ...DENSE, color: 'var(--dir-text-secondary)' }}>{col.items.join(' · ')}</p>
          </div>
        ))}
      </div>
    );
    if (contributionGrid === 'role-team') return (
      <div style={{ ...topBorder, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {CONTRIB_COLS.map(col => (
          <div key={col.label}>
            <p style={{ ...CAPS, marginBottom: EYEBROW_CHUNK_GAP_VALUES[eyebrowChunkGap] }}>{col.label}</p>
            <p style={{ ...DENSE, color: 'var(--dir-text-secondary)' }}>{col.items.join(', ')}.</p>
          </div>
        ))}
      </div>
    );
    if (contributionGrid === 'film-credit') return (
      <div style={{ ...topBorder, display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: 32, rowGap: 12, maxWidth: 720 }}>
        {CONTRIB_COLS.map(col => (
          <React.Fragment key={col.label}>
            <p style={{ ...CAPS, textAlign: 'right', whiteSpace: 'nowrap' }}>{col.label}</p>
            <p style={{ ...DENSE, color: 'var(--dir-text-secondary)' }}>{col.items.join(', ')}.</p>
          </React.Fragment>
        ))}
      </div>
    );
    if (contributionGrid === 'wall-label') return (
      <div style={{ ...topBorder, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {CONTRIB_COLS.map(col => (
          <p key={col.label} style={{ ...DENSE }}>
            <span style={{ fontWeight: 500, color: 'var(--dir-text-primary)' }}>{col.label}.</span>{' '}
            <span style={{ color: 'var(--dir-text-secondary)' }}>{col.items.join('; ')}.</span>
          </p>
        ))}
      </div>
    );
    if (contributionGrid === 'sidehead-chips') return (
      <div style={{ ...topBorder, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {CONTRIB_COLS.map(col => (
          <div key={col.label} style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 24, alignItems: 'baseline' }}>
            <p style={{ ...CAPS }}>{col.label}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {/* Flag #60 close 2026-05-24: chip rail IS 11/500 (off ladder) → DENSE 13/400 register — names in chips read more naturally at DENSE than CAPS UC (which would make person-names all-caps awkwardly). Chip chrome (padding + border + radius) carries the chip-ness; text register stays in-spec. */}
              {col.items.map(item => (
                <span key={item} style={{ ...DENSE, padding: '4px 10px', border: '1px solid var(--dir-border)', borderRadius: 999 }}>{item}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
    // ★ Rec — CRediT taxonomy verbs (NISO Z39.104-2022) woven in prose
    if (contributionGrid === 'contrib-credit-prose') return (
      <div style={{ ...topBorder, maxWidth: 720 }}>
        <p style={{ ...BODY, margin: 0 }}>
          <span style={{ color: 'var(--dir-text-primary)' }}>Conceptualization, methodology, and visualization</span>
          <span> by Sebastian Munoz-Mcdonald. </span>
          <span style={{ color: 'var(--dir-text-primary)' }}>Investigation and validation</span>
          <span> with the Ion team. </span>
          <span style={{ color: 'var(--dir-text-primary)' }}>Project administration</span>
          <span> across weekly system walkthroughs and engineering alignment.</span>
        </p>
      </div>
    );
    // Editorial byline — placeholder bracketed labels (no invented names per anti-drift rule)
    if (contributionGrid === 'contrib-byline') return (
      <div style={{ ...topBorder, maxWidth: 680 }}>
        <p style={{ ...BODY, margin: 0 }}>
          <span style={{ color: 'var(--dir-text-primary)', fontWeight: 500 }}>By </span>
          <span>[Lead designer]. </span>
          <span style={{ color: 'var(--dir-text-primary)', fontWeight: 500 }}>With </span>
          <span>[Engineering team]. </span>
          <span style={{ color: 'var(--dir-text-primary)', fontWeight: 500 }}>Reviewed by </span>
          <span>[Founder].</span>
        </p>
      </div>
    );
    // ★ Rec — journal-style author/affiliation block
    if (contributionGrid === 'contrib-credits-card') return (
      <div style={{ ...topBorder, display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 560 }}>
        {[
          { name: '[Lead designer]', role: 'Design system, prototyping, alignment' },
          { name: '[Engineering team]', role: 'Implementation, integration, runtime' },
          { name: '[Founder]', role: 'Direction, review, product strategy' },
        ].map(row => (
          <div key={row.name}>
            <p style={{ ...DENSE, color: 'var(--dir-text-primary)', fontWeight: 500, margin: 0 }}>{row.name}</p>
            <p style={{ fontFamily: IS, fontSize: 11, fontWeight: 400, lineHeight: 1.35, color: 'var(--dir-detail)', margin: 0, marginTop: 4 }}>{row.role}</p>
          </div>
        ))}
      </div>
    );
    // ★ Rec — Tate-register positional credit lines, no labels
    if (contributionGrid === 'contrib-museum-positional') return (
      <div style={{ ...topBorder, display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 720 }}>
        {[
          { role: 'Lead designer', name: 'Sebastian Munoz-Mcdonald' },
          { role: 'Engineering', name: 'Ion team' },
          { role: 'Direction', name: 'Founder, Ion Design' },
        ].map(row => (
          <p key={row.role} style={{ ...DENSE, margin: 0 }}>
            <span style={{ color: 'var(--dir-text-primary)' }}>{row.role}</span>
            <span style={{ color: 'var(--dir-detail)' }}> · {row.name}</span>
          </p>
        ))}
      </div>
    );
    // Author statement — paragraph register, no labels, real CRediT verbs
    if (contributionGrid === 'contrib-credit-statement') return (
      <div style={{ ...topBorder, maxWidth: 680 }}>
        <p style={{ ...BODY, margin: 0 }}>
          Sebastian Munoz-Mcdonald led conceptualization, methodology, and visualization; investigation and validation were conducted with the Ion team under shared project administration.
        </p>
      </div>
    );
    // Archival finding-aid — Scope / Provenance / Relation sidehead pairs
    if (contributionGrid === 'contrib-finding-aid') return (
      <div style={{ ...topBorder, display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 720 }}>
        {[
          { label: 'Scope', value: 'Slack-first entry, canvas interaction patterns, property panel architecture, design system foundation' },
          { label: 'Provenance', value: 'Ion Design (YC W24) — 12-week embedded engagement, 2024' },
          { label: 'Relation', value: 'Built on existing Figma plugin runtime; informed downstream cross-variant editing contract' },
        ].map(row => (
          <div key={row.label} style={{ display: 'flex', gap: 16, alignItems: 'baseline' }}>
            <p style={{ ...CAPS, minWidth: 120, flexShrink: 0, margin: 0 }}>{row.label}</p>
            <p style={{ ...DENSE, margin: 0, color: 'var(--dir-text-secondary)' }}>{row.value}</p>
          </div>
        ))}
      </div>
    );
    // Playbill billing order — name first, role after, ranked by contribution weight
    if (contributionGrid === 'contrib-program-billing') return (
      <div style={{ ...topBorder, display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 560, alignItems: 'center', textAlign: 'center' }}>
        <div>
          <p style={{ ...CAPS, marginBottom: EYEBROW_CHUNK_GAP_VALUES[eyebrowChunkGap] }}>Lead</p>
          <p style={{ fontFamily: ISe, fontSize: 18, fontWeight: 400, lineHeight: 1.3, color: 'var(--dir-text-primary)', margin: 0 }}>Sebastian Munoz-Mcdonald</p>
        </div>
        <div>
          <p style={{ ...CAPS, marginBottom: EYEBROW_CHUNK_GAP_VALUES[eyebrowChunkGap] }}>With</p>
          <p style={{ ...DENSE, color: 'var(--dir-text-primary)', margin: 0 }}>Ion engineering team</p>
        </div>
        <div>
          <p style={{ ...CAPS, marginBottom: EYEBROW_CHUNK_GAP_VALUES[eyebrowChunkGap] }}>Direction</p>
          <p style={{ ...DENSE, color: 'var(--dir-text-secondary)', margin: 0 }}>Founder, Ion Design</p>
        </div>
      </div>
    );
    // CRediT degree modifiers — Lead / Equal / Supporting axis with NISO verbs per role
    if (contributionGrid === 'contrib-degree-modifier') return (
      <div style={{ ...topBorder, display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 720 }}>
        {[
          { degree: 'Lead', verbs: 'Conceptualization · Methodology · Visualization' },
          { degree: 'Equal', verbs: 'Investigation · Validation · Project administration' },
          { degree: 'Supporting', verbs: 'Software · Resources' },
        ].map(row => (
          <div key={row.degree} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 24, alignItems: 'baseline' }}>
            <p style={{ ...CAPS, color: 'var(--dir-text-primary)', margin: 0 }}>{row.degree}</p>
            <p style={{ ...DENSE, margin: 0 }}>{row.verbs}</p>
          </div>
        ))}
      </div>
    );
    if (contributionGrid === 'prose-team-field') return (
      <div style={{ ...topBorder, maxWidth: 680 }}>
        <p style={{ ...DENSE, margin: 0, color: 'var(--dir-detail)' }}>
          [Prose contribution paragraph — pending authorship from real Ion project history. Failed scannability review 2026-05-01; replacement pattern under research.]
        </p>
      </div>
    );
    if (contributionGrid === 'inline-credit-line') return (
      <div style={{ ...topBorder }}>
        <p style={{ ...DENSE, margin: 0, color: 'var(--dir-detail)' }}>
          [Credit line — pending real names + roles from user. Prior render contained invented engineer/designer credits; removed 2026-05-01.]
        </p>
      </div>
    );
    // ★ DEFAULT — semantic <dl><dt><dd> register · dictionary/glossary precedent · escapes shadcn/v0 chrome AND meta strip (sentence-case label vs CAPS, vertical stack vs grid, 3-5 items per label vs 1 value)
    if (contributionGrid === 'contrib-def-list') return (
      <dl style={{ ...topBorder, margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 680 }}>
        {CONTRIB_COLS.map(col => (
          <div key={col.label}>
            <dt style={{ fontFamily: IS, fontSize: 13, fontWeight: 500, lineHeight: 1.4, color: 'var(--dir-text-primary)', margin: 0, marginBottom: 12 }}>{col.label}</dt>
            {col.items.map(item => (
              <dd key={item} style={{ fontFamily: IS, fontSize: 13, fontWeight: 400, lineHeight: 1.6, color: 'var(--dir-text-primary)', margin: 0, marginLeft: 16 }}>{item}</dd>
            ))}
          </div>
        ))}
      </dl>
    );
    // inline
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, ...topBorder }}>
        {CONTRIB_COLS.map(col => (
          <p key={col.label} style={{ ...DENSE, margin: 0 }}>
            <span style={{ ...CAPS, marginRight: 8 }}>{col.label}</span>
            <span style={{ color: 'var(--dir-text-secondary)' }}>{col.items.join(' · ')}</span>
          </p>
        ))}
      </div>
    );
  })();

  // ── §01 metadata strip — format controlled by GateAIonS01MetaStripContext ──
  // Cycle 9 lock 2026-05-12 — labels use CAPS (Eyebrow register), values use META_VALUE (Dense Body 13 + text-secondary; sanctioned exception for metadata-value role per typography-system.md §F).
  const metaStripJSX: React.ReactNode = (() => {
    if (metaStrip === 'hidden') return null;
    const topBorder = { marginTop: 24, paddingTop: 24, borderTop: withinSectionBorder() };
    if (metaStrip === 'native') return (
      <div style={{ ...topBorder }}>
        <p style={{ ...CAPS, marginBottom: EYEBROW_CHUNK_GAP_VALUES[eyebrowChunkGap] }}>Project Details</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', columnGap: 32, rowGap: 24 }}>
          {META_ITEMS.map(m => (
            <div key={m.label}>
              <p style={{ ...CAPS, marginBottom: EYEBROW_CHUNK_GAP_VALUES[eyebrowChunkGap] }}>{m.label}</p>
              <p style={META_VALUE}>{m.value}</p>
            </div>
          ))}
        </div>
      </div>
    );
    // columns — each field as independent column group (label above, value below) — Rachel Chen pattern (no section header)
    if (metaStrip === 'columns') return (
      <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap', ...topBorder }}>
        {META_ITEMS.map(m => (
          <div key={m.label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={CAPS}>{m.label}</span>
            <span style={META_VALUE}>{m.value}</span>
          </div>
        ))}
      </div>
    );
    // grid — 4-col definition grid (label · value · label · value per row)
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto 1fr', gap: '8px 16px', ...topBorder, alignItems: 'baseline' }}>
        {META_ITEMS.map(m => (
          <React.Fragment key={m.label}>
            <span style={{ ...CAPS, whiteSpace: 'nowrap' }}>{m.label}</span>
            <span style={META_VALUE}>{m.value}</span>
          </React.Fragment>
        ))}
      </div>
    );
  })();

  // ── §01 metadata strip (bare — no topBorder, for positional variants) ────────
  // Cycle 9 lock 2026-05-12 — same META_VALUE / CAPS lock as metaStripJSX; this variant drops the topBorder for positional layouts.
  const metaStripBareJSX: React.ReactNode = (() => {
    if (metaStrip === 'hidden') return null;
    if (metaStrip === 'native') return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', columnGap: 32, rowGap: 24 }}>
        {META_ITEMS.map(m => (
          <div key={m.label}>
            <p style={{ ...CAPS, marginBottom: EYEBROW_CHUNK_GAP_VALUES[eyebrowChunkGap] }}>{m.label}</p>
            <p style={META_VALUE}>{m.value}</p>
          </div>
        ))}
      </div>
    );
    if (metaStrip === 'columns') return (
      <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
        {META_ITEMS.map(m => (
          <div key={m.label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={CAPS}>{m.label}</span>
            <span style={META_VALUE}>{m.value}</span>
          </div>
        ))}
      </div>
    );
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto 1fr', gap: '8px 16px', alignItems: 'baseline' }}>
        {META_ITEMS.map(m => (
          <React.Fragment key={m.label}>
            <span style={{ ...CAPS, whiteSpace: 'nowrap' }}>{m.label}</span>
            <span style={META_VALUE}>{m.value}</span>
          </React.Fragment>
        ))}
      </div>
    );
  })();

  // ── Pre-title right column — sidebar-adapted variants of the metaStrip toggle ──
  // Cycle 9 lock 2026-05-12 — same META_VALUE / CAPS lock as metaStripJSX; sidebar-positioned layout variants.
  const preTitleMetaJSX: React.ReactNode = (() => {
    if (metaStrip === 'hidden') return null;
    const items = META_ITEMS;
    const item = (m: { label: string; value: string }) => (
      <div key={m.label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={CAPS}>{m.label}</span>
        <span style={META_VALUE}>{m.value}</span>
      </div>
    );
    if (metaStrip === 'columns') return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {items.map(item)}
      </div>
    );
    if (metaStrip === '2-col') return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, auto)', columnGap: 32, rowGap: 16, alignItems: 'start' }}>
        {items.map(item)}
      </div>
    );
    if (metaStrip === 'grid') return (
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 24px', alignItems: 'baseline' }}>
        {items.map(m => (
          <React.Fragment key={m.label}>
            <span style={{ ...CAPS, whiteSpace: 'nowrap' }}>{m.label}</span>
            <span style={META_VALUE}>{m.value}</span>
          </React.Fragment>
        ))}
      </div>
    );
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, auto)', columnGap: 32, rowGap: 16, alignItems: 'start' }}>
        {items.map(item)}
      </div>
    );
  })();

  // ── §03 Discovery — shared content + 12-direction variant render ────────────
  // Each direction is a real-precedent-informed render variation. Toggle via GateAIonS03DirectionContext.
  // All variants W1-locked (no orange — ink-pop only), no ISe italic, type-system compliant.
  const S03_DATA = {
    lead: "The issue wasn't missing features. It was timing + control.",
    methods: 'Survey (n=22), user interviews, competitive analysis, journey + pain-point synthesis',
    artifacts: '2 personas, journey map, insight → requirement map',
    stats: [
      // Math audit 2026-05-20: previous pct values had two rounded the wrong direction (15/22 = 68.18% NOT 67%; 7/22 = 31.82% NOT 33%). Corrected. NATIVE direction render switched to use `num` (ratios) over `pct` (percentages) — n=22 is small enough that concrete ratios beat rounded approximations, sample is visible inside every number, no math drift possible, matches editorial-portfolio convention (research papers, NN/g, Stripe Press). Other direction variants still consume `pct` for their respective treatments (Tufte inline, Pew shared-scale, Reuters headline, etc.) — those keep pct as-is now with corrected math.
      { num: '21/22', pct: '~95%', label: 'use AI daily', filled: 21, total: 22 },
      { num: '15/22', pct: '~68%', label: 'AI for ideation only', filled: 15, total: 22 },
      { num: '15/22', pct: '~68%', label: 'manual was faster', filled: 15, total: 22 },
      { num: '7/22', pct: '~32%', label: "output didn't match vision", filled: 7, total: 22 },
    ] as const,
    personas: [
      { name: 'Workflow-Focused', value: 'Values speed & efficiency', quote: '"I have my tools. I won\'t adopt another mid-funnel."', themeTags: 'Quick design requests · Communication · Unblock handoff' },
      { name: 'Creative Control Seekers', value: 'Values creativity, control & craft', quote: '"I want AI to help, but I need to stay in control."', themeTags: 'Styles alignment · Design review · Insights finding' },
    ] as const,
    insights: [
      // Flag #64 close 2026-05-24: req lines sharpened from PRD-spec voice to felt-experience voice. Parenthetical jargon tags (trust guardrails / lower cognitive load / early touchpoint) dropped — they're internal labels named in §04/§05/§07 prose already. Ruby unnamed here (§03 is pre-Reframe; Ruby enters at §05).
      { num: '01', insight: 'Trust breaks when output ≠ vision', evidence: "Users dropped off because AI output didn't match what they had in mind. 7 of 22 stopped using AI tools because output didn't align.", req: "A pause before the changes that can't be undone." },
      { num: '02', insight: 'Prompts create a learning curve', evidence: 'Prompt-based interaction felt inefficient. Users think visually but had to explain ideas in words. 15 of 22 said completing the task manually was faster.', req: 'Visual controls for the moments words feel slow.' },
      { num: '03', insight: 'AI is wanted early — for ideation, not execution', evidence: 'Users want AI when ideas are forming, not when they know what to build. 15 of 22 use AI for ideation and brainstorming, not production work.', req: 'Show up when ideas are forming, not after.' },
    ] as const,
    pattern: "Users wanted AI before they had a plan, not after. And they wanted to stay in control when it mattered. This wasn't about building more features. It was about showing up at the right moment.",
  };

  const discoveryBodyJSX: React.ReactNode = (() => {
    const D = S03_DATA;
    // Shared style atoms reused across variants
    const LEAD_PRIMARY: React.CSSProperties = { fontFamily: IS, fontSize: 15, fontWeight: 500, lineHeight: 1.5, letterSpacing: '-0.01em', color: 'var(--dir-text-primary)', margin: 0 };
    // META_LABEL extends central CAPS with flex-layout helpers (flexShrink: 0) for §03 horizontal label+value patterns.
    const META_LABEL: React.CSSProperties = { ...CAPS, flexShrink: 0 };
    // META_VALUE is the central Cycle 9 lock — defined at component top alongside BODY / DENSE / CAPS. Referenced here for clarity within the §03 closure.
    const INK_POP: React.CSSProperties = { color: 'var(--dir-text-primary)', fontWeight: 500 };

    // ─────────────── NATIVE · ORIGINAL ─────────────── (paragraph-blur baseline; preserved as A/B comparison)
    // The 5 issues from s03-direction-plan §51 are intentionally INTACT here:
    // (1) no scale variance (everything in 11–13 range), (2) personas as 3-word footnote, (3) no real artifact placeholder visual weight,
    // (4) weak text-only register, (5) stand-out text instead of real artifact. This is "what bad looked like."
    if (s03Direction === 'native-original') return (
      <>
        <p style={{ ...LEAD_PRIMARY, marginBottom: 24 }}>{D.lead}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 24px', marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 8 }}><span style={META_LABEL}>Methods</span><span style={META_VALUE}>{D.methods}</span></div>
          <div style={{ display: 'flex', gap: 8 }}><span style={META_LABEL}>Artifacts</span><span style={META_VALUE}>{D.artifacts}</span></div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 24px', marginBottom: 24 }}>
          {D.stats.map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontFamily: IS, fontSize: 22, fontWeight: 500, lineHeight: 1, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', color: 'var(--dir-text-primary)' }}>{s.num}</span>
              <span style={{ fontFamily: IS, fontSize: 11, fontWeight: 400, color: 'var(--dir-detail)' }}>{s.label}</span>
            </div>
          ))}
        </div>
        {/* Persona callout — REPLACED by Persona Artifact toggle when active (s03PersonaArtifact !== 'none'). */}
        {s03PersonaArtifact === 'none' && s03PersonaContentDensity === 'original' ? (
          <>
            {/* Original persona block — small inline 2-line footnote (one of the 5 issues; intentionally NOT upgraded). */}
            <p style={{ ...CAPS, marginBottom: EYEBROW_CHUNK_GAP_VALUES[eyebrowChunkGap] }}>Two user types emerged</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
              {D.personas.map(u => (
                <div key={u.name} style={{ display: 'flex', gap: 8 }}>
                  <div style={{ width: 2, borderRadius: 1, backgroundColor: 'var(--dir-border)', flexShrink: 0 }} />
                  <div>
                    <p style={{ fontFamily: IS, fontSize: 11, fontWeight: 500, color: 'var(--dir-text-secondary)', margin: 0 }}>{u.name}</p>
                    <p style={{ fontFamily: IS, fontSize: 11, fontWeight: 400, lineHeight: 1.35, color: 'var(--dir-detail)', margin: 0 }}>{u.quote}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <PersonaArtifactRenderer artifact={s03PersonaArtifact} density={s03PersonaContentDensity} personas={D.personas} />
        )}
        <p style={{ ...CAPS, marginBottom: EYEBROW_CHUNK_GAP_VALUES[eyebrowChunkGap] }}>Three key insights</p>
        <p style={{ fontFamily: IS, fontSize: 11, fontWeight: 400, lineHeight: 1.35, color: 'var(--dir-detail)', margin: 0, marginBottom: 12 }}>Different users, same underlying tensions.</p>
        {D.insights.map((row, ri) => (
          <div key={ri} style={{ paddingTop: 12, paddingBottom: 12, borderTop: withinSectionBorder() }}>
            <p style={{ fontFamily: IS, fontSize: 13, fontWeight: 500, lineHeight: 1.5, color: 'var(--dir-text-primary)', margin: 0, marginBottom: 4 }}>{row.insight}</p>
            <p style={{ ...DENSE, fontSize: 11, color: 'var(--dir-detail)', marginBottom: 4 }}>{row.evidence}</p>
            <p style={{ fontFamily: IS, fontSize: 11, fontWeight: 400, lineHeight: 1.35, color: 'var(--dir-text-secondary)', margin: 0 }}>
              <span style={{ color: 'var(--dir-detail)', fontWeight: 500 }}>→</span>{' '}{row.req}
            </p>
          </div>
        ))}
        <p style={{ fontFamily: IS, fontSize: 13, fontWeight: 400, lineHeight: 1.6, color: 'var(--dir-detail)', margin: 0, marginTop: 16, paddingTop: 16, borderTop: withinSectionBorder() }}>The pattern: {D.pattern}</p>
      </>
    );

    // ─────────────── NATIVE · FIXED ─────────────── (density-disciplined clean baseline; default toggle state)
    // SYSTEM ADHERENCE: every type role maps to the locked typography system + matches §02 Problem's two-tier opening pattern.
    // Sub-heading role = IS 18 / 600. Body = IS 15 / 400 (BODY const). Dense body = IS 13 / 400 (DENSE const). Eyebrow = IS 10 / 500 caps (CAPS const).
    // Proof numerals = IS 28 / 400 (controlled exception). NO weight 500 at body sizes, NO sizes 14/16/17/19/20/21/24/27 not in the locked ladder.
    if (s03Direction === 'native-fixed') return (
      <>
        {/* Cycle 1 surgical revision 2026-05-07: Title escalated to ISe 32 (Editorial Intro Heading). Was ISe 22. Sub-sections (insight titles, persona names) move down to ISe 22 to preserve the cascade. */}
        <p style={SH}>{D.lead}</p>
        {/* Methods / Artifacts metadata blocks — STACKED label-above-value pattern. Matches §01 facts band `MetaItem` structure (`shared.tsx:16–39`): label `<dt>` above value `<dd>`, small gap. System consistency: ONE metadata pattern across the case study, layout differs only by item count (4-col grid for §01's 8 items, 1-col stack for §03's 2 items). Typography Meta role label + Dense Body value. Sub-micro (4) gap label→value (per §01 mb-1). Component (16) gap between metadata blocks. Block (24) margin-below to next layer. */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
          <div>
            <p style={{ ...META_LABEL, marginBottom: 4 }}>Methods</p>
            <p style={META_VALUE}>{D.methods}</p>
          </div>
          <div>
            <p style={{ ...META_LABEL, marginBottom: 4 }}>Artifacts</p>
            <p style={META_VALUE}>{D.artifacts}</p>
          </div>
        </div>
        {/* Stats — IS 28 / 300 proof numerals (controlled exception per locked typography) + IS 11 / 300 caption labels */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px 32px', marginBottom: 24 }}>
          {D.stats.map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontFamily: IS, fontSize: 28, fontWeight: 400, lineHeight: 1, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', color: 'var(--dir-text-primary)' }}>{s.num}</span>
              <span style={{ fontFamily: IS, fontSize: 11, fontWeight: 400, lineHeight: 1.35, color: 'var(--dir-text-secondary)' }}>{s.label}</span>
            </div>
          ))}
        </div>
        {/* Persona callout — REPLACED by Persona Artifact toggle when active (s03PersonaArtifact !== 'none'). */}
        {s03PersonaArtifact === 'none' && s03PersonaContentDensity === 'original' ? (
          <div style={{ marginBottom: s03SubSectionGap }}>
            <p style={{ ...CAPS, marginBottom: EYEBROW_CHUNK_GAP_VALUES[eyebrowChunkGap] }}>Two user types emerged · n=22</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              {D.personas.map(u => (
                <div key={u.name} style={{ paddingTop: 12, borderTop: '1px solid var(--dir-border)' }}>
                  <p style={{ ...CAPS, marginBottom: EYEBROW_CHUNK_GAP_VALUES[eyebrowChunkGap] }}>{u.value}</p>
                  <p style={{ ...H2, marginBottom: 12 }}>{u.name}</p>
                  <p style={{ ...DENSE }}>{u.quote}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: s03SubSectionGap }}>
            <PersonaArtifactRenderer artifact={s03PersonaArtifact} density={s03PersonaContentDensity} personas={D.personas} />
          </div>
        )}
        <p style={{ ...CAPS, marginBottom: EYEBROW_CHUNK_GAP_VALUES[eyebrowChunkGap] }}>Three key insights</p>
        <p style={{ ...BODY, marginBottom: 16 }}>Different users, same underlying tensions.</p>
        {D.insights.map((row, ri) => (
          <div key={ri} style={{ paddingTop: s03RowPadding, paddingBottom: s03RowPadding, borderTop: withinSectionBorder() }}>
            {/* Insight title — CAPS_15 sub-section divider (Cycle 11 lock). */}
            <p style={{ ...CAPS_15, marginBottom: 12 }}>{row.insight}</p>
            {/* Evidence body — BODY register (issue explanation). 8px Sub-component gap below. */}
            <p style={{ ...BODY, marginBottom: 8 }}>{row.evidence}</p>
            {/* Requirement line — Subordinate aside register (IS 15 italic / text-body-soft) per
                Cycle 4 lock, same pattern as the §03 closing pattern line. Signals "derived
                conclusion / insight" role — different register from evidence above. Replaces
                the weak `→` arrow chrome; the register shift IS the role differentiation. */}
            <p style={{ fontFamily: IS, fontSize: 15, fontWeight: 400, fontStyle: 'italic', lineHeight: 1.5, color: 'var(--dir-text-body-soft)', margin: 0 }}>{row.req}</p>
          </div>
        ))}
        {/* Cycle 4 — Subordinate aside bucket: IS 15/400 italic / text-secondary. §03 pattern close as section-closing aside. */}
        {/* Spacing: paddingTop only (no marginTop) — matches inter-insight rhythm. Last insight's
            paddingBottom (s03RowPadding) + this paddingTop (s03RowPadding) = same 2×s03RowPadding
            gap as between insights. Prior `marginTop + paddingTop` was tripling the gap. */}
        <p style={{ fontFamily: IS, fontSize: 15, fontWeight: 400, fontStyle: 'italic', lineHeight: 1.5, color: 'var(--dir-text-body-soft)', margin: 0, paddingTop: s03RowPadding, borderTop: withinSectionBorder() }}>The pattern: {D.pattern}</p>
      </>
    );

    // ─────────────── 1A · PEW MULTIPLES ───────────────
    // Pew small-multiples register. Each insight row carries a sparkline + panel-label per Pew typology shape.
    // Identity expresses through composition (sparkline-per-row + parallel structure + panel-label discipline),
    // NOT through register — type cascade matches native-fixed (SH lead · ISe 22 row title · IS 15 body) per
    // operating manual "direction shift via composition, not register" principle (cross-system-rules.md §5).
    // Cleanup 2026-05-13 (path a): cascaded native-fixed register/spacing/ink wholesale.
    // Pew family identity = per-row sparkline embedded in 120px column + panel-label discipline.
    // Cycle 9 W1 reopen ink ladder applied (body=text-body, supporting=body-soft, eyebrow/caption=secondary).
    if (s03Direction === '1A-pew-multiples') return (
      <>
        <p style={SH}>{D.lead}</p>
        {/* Methods / Artifacts metadata — STACKED label-above-value, cascaded from native-fixed (single metadata pattern across the case study per `:1235` system-consistency rule). */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
          <div>
            <p style={{ ...META_LABEL, marginBottom: 4 }}>Methods</p>
            <p style={META_VALUE}>{D.methods}</p>
          </div>
          <div>
            <p style={{ ...META_LABEL, marginBottom: 4 }}>Artifacts</p>
            <p style={META_VALUE}>{D.artifacts}</p>
          </div>
        </div>
        {/* Section-level stats row — NATIVE direction · numerals as RATIOS not percentages (Math audit 2026-05-20: n=22 small enough that concrete ratios beat rounded approximations; sample visible inside every number; no math drift possible; editorial-portfolio convention per NN/g + Stripe Press + research-paper register). Numerals at proof-numeral exception (IS 28/400/-0.03em); labels at Caption register (IS 11/400/text-secondary per W1 lock). */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px 32px', marginBottom: 24 }}>
          {D.stats.map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontFamily: IS, fontSize: 28, fontWeight: 400, lineHeight: 1, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', color: 'var(--dir-text-primary)' }}>{s.num}</span>
              <span style={{ fontFamily: IS, fontSize: 11, fontWeight: 400, lineHeight: 1.35, color: 'var(--dir-text-secondary)' }}>{s.label}</span>
            </div>
          ))}
        </div>
        {/* Persona callout — REPLACED by Persona Artifact toggle when active (s03PersonaArtifact !== 'none'). Otherwise: Phase A Track 1 Option 1.1 Pew faceted persona panels (name → value subline → theme tags → quote). */}
        {s03PersonaArtifact === 'none' && s03PersonaContentDensity === 'original' ? (
          <div style={{ marginBottom: 48 }}>
            <p style={{ ...CAPS, marginBottom: EYEBROW_CHUNK_GAP_VALUES[eyebrowChunkGap] }}>Two user types emerged · n=22</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              {D.personas.map(u => (
                <div key={u.name} style={{ paddingTop: 12, borderTop: '1px solid var(--dir-border)' }}>
                  <p style={{ ...H2, marginBottom: 4 }}>{u.name}</p>
                  <p style={{ ...DENSE, color: 'var(--dir-text-body-soft)', marginBottom: 4 }}>{u.value}</p>
                  <p style={{ fontFamily: IS, fontSize: 11, fontWeight: 400, lineHeight: 1.35, color: 'var(--dir-text-secondary)', margin: 0, marginBottom: 12 }}>{u.themeTags}</p>
                  <p style={{ ...DENSE }}>{u.quote}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: 48 }}>
            <PersonaArtifactRenderer artifact={s03PersonaArtifact} density={s03PersonaContentDensity} personas={D.personas} />
          </div>
        )}
        {/* Insights sub-section scaffolding — eyebrow + intro line cascaded from native-fixed. */}
        <p style={{ ...CAPS, marginBottom: EYEBROW_CHUNK_GAP_VALUES[eyebrowChunkGap] }}>Three key insights</p>
        <p style={{ ...BODY, marginBottom: 16 }}>Different users, same underlying tensions.</p>
        {/* Sparkline-led insight rows — Pew family identity. 120px sparkline + 1fr content. Title H2 (ISe 22 Sub-section), body BODY (IS 15) per native-fixed cascade — register stays canonical; Pew identity comes from the per-row sparkline + panel-label, not from register shrinking. */}
        {D.insights.map((row, ri) => {
          const stat = D.stats[ri === 0 ? 3 : ri === 1 ? 2 : 1]; // map insight to most relevant stat
          return (
            <div key={ri} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 24, paddingTop: 16, paddingBottom: 16, borderTop: withinSectionBorder() }}>
              <div>
                <div style={{ display: 'flex', gap: 1, marginBottom: 8 }}>
                  {Array.from({ length: stat.total }).map((_, i) => (
                    <div key={i} style={{ width: 4, height: 14, backgroundColor: i < stat.filled ? 'var(--dir-text-primary)' : 'var(--dir-border)' }} />
                  ))}
                </div>
                <p style={{ ...CAPS, fontVariantNumeric: 'tabular-nums' }}>{stat.num}<span style={{ marginLeft: 6 }}>{stat.label}</span></p>
              </div>
              <div>
                <p style={{ ...CAPS_15, marginBottom: 12 }}>{row.insight}</p>
                <p style={{ ...BODY, marginBottom: 8 }}>{row.evidence}</p>
                <p style={{ ...BODY }}>
                  <span style={{ color: 'var(--dir-detail)' }}>→</span>{' '}{row.req}
                </p>
              </div>
            </div>
          );
        })}
        {/* Pattern close — Subordinate aside register (Cycle 4 + Cycle 9 W1 reopen): IS 15/400 italic / text-body-soft. */}
        <p style={{ fontFamily: IS, fontSize: 15, fontWeight: 400, fontStyle: 'italic', lineHeight: 1.5, color: 'var(--dir-text-body-soft)', margin: 0, marginTop: 16, paddingTop: 16, borderTop: withinSectionBorder() }}>The pattern: {D.pattern}</p>
      </>
    );

    // ─────────────── 1B · PUDDING QUAL-LEAD ───────────────
    // Pudding qual-narrative shape. Methods + stats embedded inline in body prose; insights as numbered prose
    // paragraphs; persona callout as inline cohort-tagged prose ("the prose IS the frame" per Phase A Track 1
    // Option 1.2 — Storybench breakdown of Pudding's structural conventions). Family identity = qual narrative
    // dominant, NOT separate metadata block / stats row / 1fr 1fr persona card.
    // Cleanup 2026-05-13 (path a): cascaded native-fixed register/spacing/ink wholesale; preserved Pudding
    // composition deviations (inline data + numbered prose insights + inline persona callout) which are research-
    // backed per Phase A. Cycle 9 W1 reopen ink ladder applied.
    // 2026-05-14: methods sentence now names journey map + insight → requirement map per D.artifacts.
    if (s03Direction === '1B-pudding-qual') return (
      <>
        <p style={SH}>{D.lead}</p>
        {/* Methods + stats inline in prose — Pudding family identity (Phase A Track 1 Option 1.2 — cohort comparison inside body flow, not in sidebar widget). BODY register; key figures + cohort sizes lifted via INK_POP. Methods sentence now names the two D.artifacts data points (journey map + insight → requirement map) per flag #64 sweep — closes the content gap previously flagged in this block's comment header. */}
        <p style={{ ...BODY, marginBottom: 24 }}>
          We surveyed <span style={INK_POP}>22 designers</span>, ran user interviews, analyzed the competitive landscape, and synthesized findings into a journey map and an insight → requirement map. <span style={INK_POP}>21 of 22</span> use AI tools daily — but only for ideation. <span style={INK_POP}>15 of 22</span> said completing the task manually was faster. <span style={INK_POP}>7 of 22</span> stopped using AI tools because output didn't match what they had in mind.
        </p>
        {/* Persona callout — REPLACED by Persona Artifact toggle when active. Otherwise: Phase A Track 1 Option 1.2 Pudding inline-prose + below-strip. */}
        {s03PersonaArtifact === 'none' && s03PersonaContentDensity === 'original' ? (
          <div style={{ marginBottom: 48 }}>
            <p style={{ ...CAPS, marginBottom: EYEBROW_CHUNK_GAP_VALUES[eyebrowChunkGap] }}>Two user types emerged · n=22</p>
            <p style={{ ...BODY, marginBottom: 24 }}>
              Two shapes of designer surfaced from the synthesis: <span style={INK_POP}>{D.personas[0].name}</span> designers prized speed and efficiency, while <span style={INK_POP}>{D.personas[1].name}</span> wanted creativity and control.
            </p>
            {D.personas.map((u, i) => (
              <div key={u.name} style={{ marginBottom: i < D.personas.length - 1 ? 12 : 0 }}>
                <p style={{ ...DENSE, marginBottom: 4 }}>{u.quote}</p>
                <p style={{ fontFamily: IS, fontSize: 11, fontWeight: 400, lineHeight: 1.35, color: 'var(--dir-text-secondary)', margin: 0 }}>— {u.name}</p>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ marginBottom: 48 }}>
            <PersonaArtifactRenderer artifact={s03PersonaArtifact} density={s03PersonaContentDensity} personas={D.personas} />
          </div>
        )}
        {/* Insights sub-section opener — Cycle 11 close 2026-05-16: demoted from H2 (ISe 22) to cross-direction-consistent CAPS_15 eyebrow + BODY intro per scarcity discipline. Prior asymmetric H2 use was over-applied. */}
        <p style={{ ...CAPS, marginBottom: EYEBROW_CHUNK_GAP_VALUES[eyebrowChunkGap] }}>Three key insights</p>
        <p style={{ ...BODY, marginBottom: 16 }}>Different users, same underlying tensions.</p>
        {/* Pudding insight rows: numbered prose paragraphs (Pudding family identity per Phase A — "the writer states one cohort's pattern, then the other's, in the same paragraph"). BODY register; numbers + key phrases via INK_POP; "The fix:" inline prefix continues the prose. Body→body paragraph rhythm Block 24 between rows per flag #49 lock. */}
        {D.insights.map((row, ri) => (
          <div key={ri} style={{ marginBottom: ri < D.insights.length - 1 ? 24 : 0 }}>
            <p style={{ ...BODY }}>
              <span style={{ ...INK_POP, marginRight: 8 }}>{row.num}</span>
              <span style={INK_POP}>{row.insight}.</span>{' '}{row.evidence}{' '}
              <span style={{ color: 'var(--dir-text-primary)' }}>The fix: {row.req.toLowerCase()}</span>
            </p>
          </div>
        ))}
        {/* Pattern close — Subordinate aside register (Cycle 4 + Cycle 9 W1 reopen): IS 15/400 italic / text-body-soft. */}
        <p style={{ fontFamily: IS, fontSize: 15, fontWeight: 400, fontStyle: 'italic', lineHeight: 1.5, color: 'var(--dir-text-body-soft)', margin: 0, marginTop: 16, paddingTop: 16, borderTop: withinSectionBorder() }}>The pattern: {D.pattern}</p>
      </>
    );

    // ─────────────── 1C · REUTERS LONG-FORM ───────────────
    // Reuters research-method-block identity (Phase A Track 1 Option 1.3 — "named-source callout").
    // Identity expresses via composition: 4-col stats grid framed by top+bottom rules · persona callout as
    // top-rule-separated research-source rows · sober color-free chrome. NO raised-bg insight cards
    // (anti-Reuters AND violates Container-earned primary lock — sanctioned only for §09 T3 + §08 takeaway
    // per cross-system-rules.md §9; arbitrary §03 use is forbidden by Cycle 9 anti-drift).
    // Cleanup 2026-05-13 (path a): cascaded native-fixed register/spacing/ink wholesale; Reuters identity
    // expressed via composition-axis variations (stats grid chrome + research-source persona block), NOT
    // register-shrinking. Cycle 9 W1 reopen ink ladder applied (body=text-body, supporting=body-soft).
    if (s03Direction === '1C-reuters-longform') return (
      <>
        <p style={SH}>{D.lead}</p>
        {/* Methods / Artifacts metadata — STACKED label-above-value (single metadata pattern across the case study per native-fixed `:1235` system-consistency rule). */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
          <div>
            <p style={{ ...META_LABEL, marginBottom: 4 }}>Methods</p>
            <p style={META_VALUE}>{D.methods}</p>
          </div>
          <div>
            <p style={{ ...META_LABEL, marginBottom: 4 }}>Artifacts</p>
            <p style={META_VALUE}>{D.artifacts}</p>
          </div>
        </div>
        {/* Stats row — Reuters research-method-block: 4-column grid framed by top+bottom rules (sober news-publishing chrome). Numerals at locked proof-numeral exception (IS 28/400/-0.03em — fixed from off-ladder 36 drift); labels at Caption register (IS 11/400/text-secondary). Reuters numeric-led identity expresses via parallel-column structure + structural rules, NOT display-scale numerals. */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24, paddingTop: 16, paddingBottom: 16, borderTop: '1px solid var(--dir-border)', borderBottom: '1px solid var(--dir-border)' }}>
          {D.stats.map(s => (
            <div key={s.label}>
              <p style={{ fontFamily: IS, fontSize: 28, fontWeight: 400, lineHeight: 1, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', color: 'var(--dir-text-primary)', margin: 0, marginBottom: 8 }}>{s.num}</p>
              <p style={{ fontFamily: IS, fontSize: 11, fontWeight: 400, lineHeight: 1.35, color: 'var(--dir-text-secondary)', margin: 0 }}>{s.label}</p>
            </div>
          ))}
        </div>
        {/* Persona callout — REPLACED by Persona Artifact toggle when active. Otherwise: Phase A Track 1 Option 1.3 Reuters stacked source-blocks. */}
        {s03PersonaArtifact === 'none' && s03PersonaContentDensity === 'original' ? (
          <div style={{ marginBottom: 48 }}>
            <p style={{ ...CAPS, marginBottom: EYEBROW_CHUNK_GAP_VALUES[eyebrowChunkGap] }}>Two user types emerged · n=22</p>
            {D.personas.map((u, i) => (
              <div key={u.name} style={{ paddingTop: 12, borderTop: '1px solid var(--dir-border)', marginBottom: i < D.personas.length - 1 ? 24 : 0 }}>
                <p style={{ ...CAPS, marginBottom: EYEBROW_CHUNK_GAP_VALUES[eyebrowChunkGap] }}>{u.name}</p>
                <p style={{ ...BODY, marginBottom: 12 }}>{u.value}.</p>
                <p style={{ ...BODY, marginBottom: 12 }}>{u.quote}</p>
                <p style={{ fontFamily: IS, fontSize: 11, fontWeight: 400, lineHeight: 1.35, color: 'var(--dir-text-secondary)', margin: 0 }}>Interviews · affinity synthesis</p>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ marginBottom: 48 }}>
            <PersonaArtifactRenderer artifact={s03PersonaArtifact} density={s03PersonaContentDensity} personas={D.personas} />
          </div>
        )}
        {/* Insights sub-section opener — CAPS eyebrow + BODY intro line, cascaded from native-fixed. Insight rows below use H2 (ISe 22) per row — visually dominant per CSML §03:235 "insight rows = main body"; eyebrow + intro serve as quieter supporting markers. Same shape as 1A (H2-dominant insight rows). */}
        <p style={{ ...CAPS, marginBottom: EYEBROW_CHUNK_GAP_VALUES[eyebrowChunkGap] }}>Three key insights</p>
        <p style={{ ...BODY, marginBottom: 16 }}>Different users, same underlying tensions.</p>
        {/* Insight rows — native-fixed cascade. Reuters identity expresses through composition above (4-col stats grid + research-source persona callout), NOT through register-shrinking insight rows. H2 sub-section title per row + BODY evidence + BODY requirement w/ → arrow. */}
        {D.insights.map((row, ri) => (
          <div key={ri} style={{ paddingTop: 16, paddingBottom: 16, borderTop: withinSectionBorder() }}>
            <p style={{ ...CAPS_15, marginBottom: 12 }}>{row.insight}</p>
            <p style={{ ...BODY, marginBottom: 8 }}>{row.evidence}</p>
            <p style={{ ...BODY }}>
              <span style={{ color: 'var(--dir-detail)' }}>→</span>{' '}{row.req}
            </p>
          </div>
        ))}
        {/* Pattern close — Subordinate aside register (Cycle 4 + Cycle 9 W1 reopen): IS 15/400 italic / text-body-soft. */}
        <p style={{ fontFamily: IS, fontSize: 15, fontWeight: 400, fontStyle: 'italic', lineHeight: 1.5, color: 'var(--dir-text-body-soft)', margin: 0, marginTop: 16, paddingTop: 16, borderTop: withinSectionBorder() }}>The pattern: {D.pattern}</p>
      </>
    );

    // ─────────────── 2A · MAGAZINE PULL-STAT ───────────────
    // Magazine feature-opening register (Phase A Track 1 Option 2.1 — Two-block named-subject spread).
    // Family identity = ONE dominant hero pull-stat (CD 52 locked Display tier) + two magazine-subject
    // persona blocks at sub-section serif tier (ISe 22). Cascade preserves §03 section heading at ISe 32
    // > pull-stat CD 52 (Display, distinct family) > persona value statements ISe 22 (Sub-section serif)
    // > body IS 15.
    // Cleanup 2026-05-14 (Family 2 path a per `feedback_enumerate_before_shipping` discipline): cascaded
    // native-fixed register/spacing/ink wholesale; preserved 2A family identity (hero pull-stat) via locked
    // Display register; added persona callout per Phase A Option 2.1 in locked registers (off-locked
    // CD 96 dropped to CD 52; off-locked CD 10 byline + ISe 52 value statement substituted with IS 11
    // Caption + ISe 22 Section Heading register per content-honest mapping to locked type lock).
    // Cycle 9 W1 reopen ink ladder applied (body=text-body, supporting=body-soft, eyebrow/caption=secondary).
    if (s03Direction === '2A-magazine-pull-stat') return (
      <>
        {/* Lead — Section heading per native-fixed cascade. */}
        <p style={SH}>{D.lead}</p>
        {/* Methods / Artifacts metadata — STACKED label-above-value (single metadata pattern across the case study per native-fixed `:1235` system-consistency rule). */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
          <div>
            <p style={{ ...META_LABEL, marginBottom: 4 }}>Methods</p>
            <p style={META_VALUE}>{D.methods}</p>
          </div>
          <div>
            <p style={{ ...META_LABEL, marginBottom: 4 }}>Artifacts</p>
            <p style={META_VALUE}>{D.artifacts}</p>
          </div>
        </div>
        {/* Hero pull-stat — 2A family identity (magazine feature-opening dominant moment). CD 52 locked Display tier (lifted from off-ladder CD 96 per recheck 2026-05-14); top + bottom hairline rules frame as a structural moment. Stat 0 (`D.stats[0]` = 95% / 21 of 22 use AI daily) is the n=22 anchor stat. Composition: oversized numeral (CD 52) + supporting line at BODY register. */}
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 32, alignItems: 'baseline', marginBottom: 24, paddingTop: 16, paddingBottom: 16, borderTop: '1px solid var(--dir-border)', borderBottom: '1px solid var(--dir-border)' }}>
          <p style={{ fontFamily: CD, fontSize: 52, fontWeight: 500, lineHeight: 0.95, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', color: 'var(--dir-text-primary)', margin: 0 }}>{D.stats[0].pct}</p>
          <p style={{ ...BODY }}>of designers we surveyed (n=22) use AI daily — but only for ideation.</p>
        </div>
        {/* Persona callout — REPLACED by Persona Artifact toggle when active. Otherwise: Phase A Track 1 Option 2.1 magazine pull-quote per persona. */}
        {s03PersonaArtifact === 'none' && s03PersonaContentDensity === 'original' ? (
          <div style={{ marginBottom: 48 }}>
            <p style={{ ...CAPS, marginBottom: EYEBROW_CHUNK_GAP_VALUES[eyebrowChunkGap] }}>Two user types emerged · n=22</p>
            {D.personas.map((u, i) => (
              <div key={u.name} style={{ paddingTop: 12, borderTop: '1px solid var(--dir-border)', marginBottom: i < D.personas.length - 1 ? 24 : 0 }}>
                <p style={{ ...CAPS, marginBottom: 8 }}>{u.name}</p>
                <blockquote style={{ margin: 0, marginBottom: 12, paddingLeft: 16, borderLeft: '2px solid var(--dir-border)' }}>
                  <p style={PULL_QUOTE_STYLE}>{u.quote}</p>
                </blockquote>
                <p style={{ ...DENSE, color: 'var(--dir-text-body-soft)', marginBottom: 4 }}>{u.value}.</p>
                <p style={{ fontFamily: IS, fontSize: 11, fontWeight: 400, lineHeight: 1.35, color: 'var(--dir-text-secondary)', margin: 0 }}>Interviews · affinity synthesis</p>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ marginBottom: 48 }}>
            <PersonaArtifactRenderer artifact={s03PersonaArtifact} density={s03PersonaContentDensity} personas={D.personas} />
          </div>
        )}
        {/* Insights sub-section opener — eyebrow + intro line per native cascade. */}
        <p style={{ ...CAPS, marginBottom: EYEBROW_CHUNK_GAP_VALUES[eyebrowChunkGap] }}>Three key insights</p>
        <p style={{ ...BODY, marginBottom: 16 }}>Different users, same underlying tensions.</p>
        {/* Insight rows — native-fixed cascade. H2 (ISe 22) sub-section title + BODY evidence + BODY req w/ → arrow. */}
        {D.insights.map((row, ri) => (
          <div key={ri} style={{ paddingTop: 16, paddingBottom: 16, borderTop: withinSectionBorder() }}>
            <p style={{ ...CAPS_15, marginBottom: 12 }}>{row.insight}</p>
            <p style={{ ...BODY, marginBottom: 8 }}>{row.evidence}</p>
            <p style={{ ...BODY }}>
              <span style={{ color: 'var(--dir-detail)' }}>→</span>{' '}{row.req}
            </p>
          </div>
        ))}
        {/* Pattern close — Subordinate aside register (Cycle 4 + Cycle 9 W1 reopen): IS 15/400 italic / text-body-soft. */}
        <p style={{ fontFamily: IS, fontSize: 15, fontWeight: 400, fontStyle: 'italic', lineHeight: 1.5, color: 'var(--dir-text-body-soft)', margin: 0, marginTop: 16, paddingTop: 16, borderTop: withinSectionBorder() }}>The pattern: {D.pattern}</p>
      </>
    );

    // ─────────────── 2B · TUFTE SPARKLINE ───────────────
    // Tufte data-integration register (Phase A Track 1 Option 2.2 — Tufte marginalia).
    // Family identity: numbers integrated INLINE with prose (sparkline embedded in body sentences),
    // persona quotes as OUTER-COLUMN MARGINALIA (Tufte CSS sidenote shape), no separate stats row,
    // no separate metadata block, no chrome — Tufte's "data + prose + quiet evidence" discipline.
    // Cleanup 2026-05-15 (Family 2 path b per `feedback_enumerate_before_shipping` + `feedback_direction_callout_structural_identity`):
    //   - Off-ladder IS 14 fixed → BODY 15 / DENSE 13 per type lock
    //   - LEAD_PRIMARY → SH (ISe 32) per native cascade
    //   - Body color text-secondary → text-body per Cycle 9 W1 reopen
    //   - Methods caption text-detail → text-secondary per Cycle 9 W1 reopen
    //   - Metadata block REMOVED (Tufte no-chrome; methods/artifacts integrate inline in synthesis paragraph — same approach as 1B Pudding prose-led direction; deviates from `:1235` single-metadata-pattern rule only for prose-led directions where chrome conflicts with family identity)
    //   - Persona callout ADDED as 2-col marginalia (1fr body + 200px outer sidenote column) per Phase A 2.2 literal
    //   - Insight rows cascaded to BODY register (was off-ladder IS 14 secondary)
    //   - Pattern close → Subordinate aside (was off-ladder IS 14 text-primary, no border)
    if (s03Direction === '2B-tufte-sparkline') return (
      <>
        <p style={SH}>{D.lead}</p>
        {/* Synthesis paragraph — Tufte family identity: data integrated INLINE with prose (sparklines + numbers embedded in body sentences), methods/artifacts woven into the same paragraph (no separate metadata block per Tufte no-chrome discipline). BODY register; key figures lifted via INK_POP. Sparkline bars at 3×10 with 1px gap match `--dir-text-primary` filled / `--dir-border` unfilled. */}
        <p style={{ ...BODY, marginBottom: 8 }}>
          Of <span style={INK_POP}>22 designers</span> surveyed — user interviews, competitive analysis, journey + pain-point synthesis — <span style={INK_POP}>21</span>
          <span style={{ display: 'inline-flex', gap: 1, margin: '0 6px', verticalAlign: 'middle' }}>{Array.from({ length: 22 }).map((_, i) => (<span key={i} style={{ width: 3, height: 10, backgroundColor: i < 21 ? 'var(--dir-text-primary)' : 'var(--dir-border)' }} />))}</span>
          use AI daily; <span style={INK_POP}>15</span>
          <span style={{ display: 'inline-flex', gap: 1, margin: '0 6px', verticalAlign: 'middle' }}>{Array.from({ length: 22 }).map((_, i) => (<span key={i} style={{ width: 3, height: 10, backgroundColor: i < 15 ? 'var(--dir-text-primary)' : 'var(--dir-border)' }} />))}</span>
          said manual was faster; <span style={INK_POP}>7</span>
          <span style={{ display: 'inline-flex', gap: 1, margin: '0 6px', verticalAlign: 'middle' }}>{Array.from({ length: 22 }).map((_, i) => (<span key={i} style={{ width: 3, height: 10, backgroundColor: i < 7 ? 'var(--dir-text-primary)' : 'var(--dir-border)' }} />))}</span>
          stopped because output didn't match vision.
        </p>
        <p style={{ fontFamily: IS, fontSize: 11, fontWeight: 400, lineHeight: 1.35, color: 'var(--dir-text-secondary)', margin: 0, marginBottom: 32 }}>From the synthesis we built a journey map and an insight → requirement map.</p>
        {/* Persona callout — REPLACED by Persona Artifact toggle when active. Otherwise: Phase A Track 1 Option 2.2 Tufte marginalia. */}
        {s03PersonaArtifact === 'none' && s03PersonaContentDensity === 'original' ? (
          <div style={{ marginBottom: 48 }}>
            <p style={{ ...CAPS, marginBottom: EYEBROW_CHUNK_GAP_VALUES[eyebrowChunkGap] }}>Two user types emerged · n=22</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: 32, alignItems: 'start' }}>
              <p style={{ ...BODY }}>
                The 22 designers showed two distinct shapes. <span style={INK_POP}>{D.personas[0].name}</span> designers prized speed and efficiency — they had established tool stacks and wouldn't adopt another mid-funnel tool. <span style={INK_POP}>{D.personas[1].name}</span> wanted creativity and control — AI as collaborator without losing the steering wheel.
              </p>
              <div>
                {D.personas.map((u, i) => (
                  <div key={u.name} style={{ marginBottom: i < D.personas.length - 1 ? 24 : 0 }}>
                    <p style={{ ...CAPS, marginBottom: 4 }}>{u.name}</p>
                    <p style={{ fontFamily: IS, fontSize: 11, fontWeight: 400, lineHeight: 1.35, color: 'var(--dir-text-body)', margin: 0, marginBottom: 4 }}>{u.quote}</p>
                    <p style={{ fontFamily: IS, fontSize: 11, fontWeight: 400, lineHeight: 1.35, color: 'var(--dir-text-secondary)', margin: 0 }}>— Interviews</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: 48 }}>
            <PersonaArtifactRenderer artifact={s03PersonaArtifact} density={s03PersonaContentDensity} personas={D.personas} />
          </div>
        )}
        {/* Insights sub-section opener — eyebrow + intro line per native cascade. */}
        <p style={{ ...CAPS, marginBottom: EYEBROW_CHUNK_GAP_VALUES[eyebrowChunkGap] }}>Three key insights</p>
        <p style={{ ...BODY, marginBottom: 16 }}>Different users, same underlying tensions.</p>
        {/* Insight rows — native-fixed cascade. H2 (ISe 22) sub-section title + BODY evidence + BODY req w/ → arrow. */}
        {D.insights.map((row, ri) => (
          <div key={ri} style={{ paddingTop: 16, paddingBottom: 16, borderTop: withinSectionBorder() }}>
            <p style={{ ...CAPS_15, marginBottom: 12 }}>{row.insight}</p>
            <p style={{ ...BODY, marginBottom: 8 }}>{row.evidence}</p>
            <p style={{ ...BODY }}>
              <span style={{ color: 'var(--dir-detail)' }}>→</span>{' '}{row.req}
            </p>
          </div>
        ))}
        {/* Pattern close — Subordinate aside register (Cycle 4 + Cycle 9 W1 reopen): IS 15/400 italic / text-body-soft. */}
        <p style={{ fontFamily: IS, fontSize: 15, fontWeight: 400, fontStyle: 'italic', lineHeight: 1.5, color: 'var(--dir-text-body-soft)', margin: 0, marginTop: 16, paddingTop: 16, borderTop: withinSectionBorder() }}>The pattern: {D.pattern}</p>
      </>
    );

    // 2C-holmes-spectrum CUT 2026-05-15 per direction plan §54 + flag #70: spectrum concept forbidden — two distinct user shapes are not opposites on a continuum. Family 2 reduced to 2A + 2B.

    // ─────────────── 3A · ANNUAL LETTER ───────────────
    // Annual letter register (Phase A Track 1 Option 3.3 — Berkshire / Stripe Press / Collison letter convention).
    // Family identity: pure body-column IS 15 prose; persona names INK_POPped; quotes embedded inline with
    // quotation marks (NOT pulled out as separate blocks); NO frame, NO eyebrows interrupting prose, NO sub-section
    // markers — the letter's running voice IS the structure. Per `feedback_direction_callout_structural_identity`:
    // 3A's no-chrome continuous-prose flow IS its direction-identity expression, so the cross-direction persona
    // panel eyebrow + insights eyebrow + Subordinate-aside pattern-close are intentionally DROPPED in 3A only.
    // Cleanup 2026-05-15 (Family 3 path a per `feedback_enumerate_before_shipping` + locks audit pre-edit):
    //   - Off-ladder IS 14 fixed → BODY 15 across all paragraphs
    //   - lh 1.8 fixed → 1.75 per locked Body
    //   - text-primary → text-body per Cycle 9 W1 reopen Body ink
    //   - SH lead added (cascade consistency; D.lead no longer embedded inline)
    //   - "competing tools" → "competitive analysis" per D.methods literal (anti-paraphrase per `feedback_research_first_no_fake_provenance`)
    //   - One short paragraph per persona per Phase A 3.3 (was both cohorts in ONE paragraph)
    //   - Pattern close at BODY register (no Subordinate aside chrome; letter voice closes in-register)
    //   - Body→Body paragraph rhythm 24 Block per locked spacing
    if (s03Direction === '3A-annual-letter') return (
      <>
        <p style={SH}>{D.lead}</p>
        <p style={{ ...BODY, marginBottom: 24 }}>
          We surveyed <span style={INK_POP}>22 designers</span>, ran user interviews, analyzed the competitive landscape, and built a journey map and an insight → requirement map from the synthesis. The picture that emerged was clearer than expected: <span style={INK_POP}>21 of 22</span> use AI daily — but only for ideation; <span style={INK_POP}>15 of 22</span> said completing the task manually was faster; <span style={INK_POP}>7 of 22</span> stopped using AI tools entirely when output didn't match what they had in mind.
        </p>
        {/* Persona prose — REPLACED by Persona Artifact toggle when active. Otherwise: Phase A 3.3 annual-letter prose paragraphs naming both cohorts inline. */}
        {s03PersonaArtifact === 'none' && s03PersonaContentDensity === 'original' ? (
          <>
            <p style={{ ...BODY, marginBottom: 24 }}>
              Two shapes of designer kept showing up in the work. <span style={INK_POP}>{D.personas[0].name}</span> designers valued speed and efficiency above all — established tool stacks, low tolerance for another mid-funnel addition. {D.personas[0].quote} They wanted help, but not at the cost of their workflow.
            </p>
            <p style={{ ...BODY, marginBottom: 24 }}>
              <span style={INK_POP}>{D.personas[1].name}</span> wanted something different. Creativity, control, and craft mattered more than speed. {D.personas[1].quote} They wanted AI as collaborator, not as autopilot.
            </p>
          </>
        ) : (
          <div style={{ marginBottom: 24 }}>
            <PersonaArtifactRenderer artifact={s03PersonaArtifact} density={s03PersonaContentDensity} personas={D.personas} />
          </div>
        )}
        <p style={{ ...BODY, marginBottom: 24 }}>
          Three insights mattered. First, <span style={INK_POP}>trust broke when output didn't match vision</span>: 7 of 22 stopped using AI tools because the result didn't align with what they had in mind. We needed intent checks before high-impact actions — trust guardrails. Second, <span style={INK_POP}>prompts created a learning curve</span>: people think visually but had to explain ideas in words, and 15 of 22 said the manual version was faster. We needed familiar visual controls for precision edits. Third, <span style={INK_POP}>the timing was wrong</span>: 15 of 22 used AI for ideation and brainstorming, not for production work. We needed a lightweight entry point that fit how ideas actually start.
        </p>
        <p style={{ ...BODY }}>{D.pattern}</p>
      </>
    );

    // ─────────────── 3B · SCIENTIFIC ABSTRACT ───────────────
    // Structured-abstract register (Phase A Track 1 Option 3.2 — JAMA / NEJM / CHI structured abstract).
    // Family identity: hairline rule above the abstract block + IS 10/UC detail labels (CAPS register) at start
    // of each labeled paragraph + BODY 15 body + em-dash separator between persona name and value statement +
    // section labels follow JAMA canonical convention (Methods · Findings · Participants · Insight 01 / 02 / 03 ·
    // Conclusion). Reads as a journal abstract block — credibility-grade evidence in tight labeled paragraphs.
    // Cleanup 2026-05-15 (Family 3 path b per `feedback_enumerate_before_shipping` + pre-edit locks audit):
    //   - LEAD_PRIMARY → SH (cascade)
    //   - Off-ladder lh 1.7 + off-token marginBottom 14 fixed → BODY locked lh 1.75 + 12 Cat 2 Tight between paragraphs (abstract-block grouping)
    //   - Off-spec `color: text-secondary` on body → text-body per Cycle 9 W1 reopen
    //   - Inline INK_POP "Methods." label → CAPS span (IS 10/UC) per Phase A 3.2 literal "IS uppercase 10 detail label"
    //   - "Segmentation" → "PARTICIPANTS" (canonical JAMA section header per Phase A 3.2)
    //   - Findings hand-coded stats → `D.stats` literal join (source-honest, no invented %s)
    //   - Personas em-dash separator per Phase A 3.2 ("[Persona name] — [value statement]")
    //   - Hairline rule top added (wrapper div with borderTop) per Phase A 3.2 explicit
    //   - Pattern close → CONCLUSION labeled paragraph per JAMA convention
    if (s03Direction === '3B-scientific-abstract') return (
      <>
        <p style={SH}>{D.lead}</p>
        <div style={{ paddingTop: 16, borderTop: '1px solid var(--dir-border)' }}>
          <p style={{ ...BODY, marginBottom: 12 }}>
            <span style={CAPS}>METHODS.</span> {D.methods}. Outputs: {D.artifacts}.
          </p>
          <p style={{ ...BODY, marginBottom: 12 }}>
            <span style={CAPS}>FINDINGS.</span> {D.stats.map(s => `${s.num} (${s.pct}) ${s.label}`).join('; ')}.
          </p>
            {/* Participants block — REPLACED by Persona Artifact toggle when active. Otherwise: Phase A 3.2 JAMA Participants. line. */}
          {s03PersonaArtifact === 'none' && s03PersonaContentDensity === 'original' ? (
            <p style={{ ...BODY, marginBottom: 12 }}>
              <span style={CAPS}>PARTICIPANTS.</span> 22 designers in two segments: <span style={INK_POP}>{D.personas[0].name}</span> — {D.personas[0].value.toLowerCase()}; <span style={INK_POP}>{D.personas[1].name}</span> — {D.personas[1].value.toLowerCase()}.
            </p>
          ) : (
            <div style={{ marginBottom: 12 }}>
              <PersonaArtifactRenderer artifact={s03PersonaArtifact} density={s03PersonaContentDensity} personas={D.personas} />
            </div>
          )}
          {D.insights.map((row, ri) => (
            <p key={ri} style={{ ...BODY, marginBottom: 12 }}>
              <span style={CAPS}>INSIGHT {row.num}.</span> {row.insight}. {row.evidence} <span style={INK_POP}>Therefore:</span> {row.req.toLowerCase()}
            </p>
          ))}
          <p style={{ ...BODY }}>
            <span style={CAPS}>CONCLUSION.</span> {D.pattern}
          </p>
        </div>
      </>
    );

    // ─────────────── 3C · MUSEUM WALL TEXT ───────────────
    // Museum gallery label register (Phase A Track 1 Option 3.1 — V&A / Cooper Hewitt tombstone + interpretive panel).
    // Family identity: each persona AND insight is rendered as a museum gallery label — hairline rule above +
    // CAPS tombstone metadata + IS 18 named subject + BODY 15 interpretive paragraph. Section-level curator
    // tombstone at bottom (Discovery / Requirements · n=22 · 2024). Per `feedback_direction_callout_structural_identity`:
    // 3C's identity is the gallery-label treatment throughout, so the cross-direction CAPS eyebrows ("Two user
    // types emerged" / "Three key insights") are intentionally DROPPED — museum exhibitions don't have section
    // dividers between adjacent objects on the same wall.
    // Cleanup 2026-05-15 (Family 3 path c per `feedback_enumerate_before_shipping` + pre-edit locks audit):
    //   - Off-ladder ISe 28 / IS 14 / ISe 17 / IS 12 fixed → locked scale (ISe 32 SH lead · BODY 15 · ISe 22 H2 insight title · IS 18 Row title persona name · IS 10/UC CAPS tombstone)
    //   - Off-spec ISe 18 upright pattern close fixed → BODY 15 reflective paragraph (no aside chrome; 3C museum no-chrome approach matches 3A annual letter pattern close discipline — direction-specific override of native Subordinate-aside cascade per `feedback_direction_callout_structural_identity`)
    //   - Off-spec lh 1.7 / 1.65 / 1.35 fixed → locked Body lh 1.75 · DENSE lh 1.6 N/A (no DENSE used) · H2 lh 1.25
    //   - Color text-secondary on body → text-body per Cycle 9 W1 reopen
    //   - Per-persona tombstones ADDED per Phase A 3.1 (was missing — only had section-level tombstone at bottom)
    //   - Per-insight tombstones added — parallel template to persona tombstones for full gallery-label consistency
    //   - "Required:" req prefix kept (museum interpretive convention: explicit interpretive lead-ins)
    if (s03Direction === '3C-museum-wall') return (
      <>
        <p style={SH}>{D.lead}</p>
        <p style={{ ...BODY, marginBottom: 32 }}>
          Research with <span style={INK_POP}>22 designers</span> surfaced a workflow that breaks twice — once at output mismatch, again at prompt friction. AI was wanted early, not late; for ideation, not execution. Two user types disagreed on most goals but shared the same underlying tension.
        </p>
        {/* Persona tombstones — REPLACED by Persona Artifact toggle when active. Otherwise: Phase A 3.1 museum gallery tombstones. */}
        {s03PersonaArtifact === 'none' && s03PersonaContentDensity === 'original' ? (
          <>
            {D.personas.map((u) => (
              <div key={u.name} style={{ paddingTop: 12, borderTop: '1px solid var(--dir-border)', marginBottom: 24 }}>
                <p style={{ ...CAPS, marginBottom: 4 }}>Persona profile · Discovery · 2024</p>
                <p style={{ ...H2, marginBottom: 12 }}>{u.name}</p>
                <p style={{ ...BODY }}>{u.value}. {u.quote}</p>
              </div>
            ))}
          </>
        ) : (
          <div style={{ marginBottom: 24 }}>
            <PersonaArtifactRenderer artifact={s03PersonaArtifact} density={s03PersonaContentDensity} personas={D.personas} />
          </div>
        )}
        {/* Insight tombstone blocks — gallery-label template parallel to persona blocks. CAPS tombstone metadata + ISe 22 insight title (Section heading register, sub-section tier per cascade) + BODY interpretive paragraph (evidence) + BODY requirement line. Matches Phase A 3.1 tombstone discipline applied uniformly to discovery objects. */}
        {D.insights.map((row, ri) => (
          <div key={ri} style={{ paddingTop: 12, borderTop: '1px solid var(--dir-border)', marginBottom: 24 }}>
            <p style={{ ...CAPS, marginBottom: 4 }}>Insight {row.num} · Discovery → Requirement · 2024</p>
            <p style={{ ...CAPS_15, marginBottom: 12 }}>{row.insight}</p>
            <p style={{ ...BODY, marginBottom: 8 }}>{row.evidence}</p>
            <p style={{ ...BODY }}>Required: {row.req}</p>
          </div>
        ))}
        {/* Pattern close — BODY 15 reflective paragraph (museum no-chrome approach; cascade Subordinate-aside intentionally dropped for 3C direction identity per `feedback_direction_callout_structural_identity`). */}
        <p style={{ ...BODY, marginBottom: 32 }}>{D.pattern}</p>
        {/* Section-level curator tombstone — bottom-of-wall convention. CAPS register; project context only (no fake citation/DOI/acquisition line per Phase A 3.1 anti-drift `:166`). */}
        <div style={{ paddingTop: 12, borderTop: '1px solid var(--dir-border)' }}>
          <p style={{ ...CAPS }}>Discovery / Requirements · Sample n=22 · 2024</p>
        </div>
      </>
    );

    // ─────────────── 4A · BILL GUO FRAMED ───────────────
    // Premium-portfolio hairline-card register (Phase A Track 1 Option 4.1 — Bill Guo / Leyi shape).
    // Family identity: bordered cards throughout the section. Persona pair in 1fr 1fr hairline-card grid +
    // insight trio in 1fr 1fr 1fr hairline-card grid. 1px var(--dir-border) hairline only — NO fill,
    // NO shadow, NO rounded corners (Phase A 4.1 anti-drift `:225` explicit ban). Card internal:
    // IS 10/UC label + ISe 22 named subject (NOT ISe 32 — tier-conflicts with §03 heading; same cascade
    // discipline as 2A) + IS 13 body content + IS 11 Caption byline. Premium senior-portfolio register.
    // Cleanup 2026-05-15 (Family 4 path a per `feedback_enumerate_before_shipping` + pre-edit locks audit):
    //   - LEAD_PRIMARY → SH (cascade)
    //   - Stacked Methods/Artifacts metadata (cascade-consistent with 1A/1C/2A/3B; matches `:1235` single-metadata-pattern rule)
    //   - Off-ladder IS 24/500 stats numerals fixed → IS 28/400 locked proof-numeral exception (matches 1A/1C/2A stats rows)
    //   - Off-spec letterSpacing -0.02em on stats → -0.03em locked proof
    //   - text-detail on stats labels → text-secondary per Cycle 9 W1 reopen
    //   - paddingBottom 20 off-token → 16 Component-tier
    //   - PERSONA PAIR ADDED per Phase A 4.1 (was missing — Phase A 4.1 IS the persona-card spec, not the insight-card spec)
    //   - Insight cards: borderRadius 2 REMOVED (Phase A 4.1 anti-drift); off-ladder/off-weight body fields fixed → CAPS num + IS 18 Row title insight + DENSE 13 evidence + DENSE 13 req
    //   - Off-spec letterSpacing 0.06em on insight num → 0.12em locked CAPS
    //   - text-detail on insight num → text-secondary per Cycle 9
    //   - Pattern close → Subordinate aside cascade (IS 15 italic body-soft + top border)
    if (s03Direction === '4A-billguo-framed') return (
      <>
        <p style={SH}>{D.lead}</p>
        {/* Methods / Artifacts metadata — STACKED label-above-value (single metadata pattern across the case study per native-fixed `:1235` system-consistency rule). */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
          <div>
            <p style={{ ...META_LABEL, marginBottom: 4 }}>Methods</p>
            <p style={META_VALUE}>{D.methods}</p>
          </div>
          <div>
            <p style={{ ...META_LABEL, marginBottom: 4 }}>Artifacts</p>
            <p style={META_VALUE}>{D.artifacts}</p>
          </div>
        </div>
        {/* Stats row — IS 28/400 locked proof-numeral exception + IS 11/400/text-secondary Caption labels. Matches 1A / 1C / 2A cascade. */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px 32px', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--dir-border)' }}>
          {D.stats.map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontFamily: IS, fontSize: 28, fontWeight: 400, lineHeight: 1, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', color: 'var(--dir-text-primary)' }}>{s.num}</span>
              <span style={{ fontFamily: IS, fontSize: 11, fontWeight: 400, lineHeight: 1.35, color: 'var(--dir-text-secondary)' }}>{s.label}</span>
            </div>
          ))}
        </div>
        {/* Persona pair — REPLACED by Persona Artifact toggle when active. Otherwise: Phase A Track 1 Option 4.1 Bill Guo hairline cards. */}
        {s03PersonaArtifact === 'none' && s03PersonaContentDensity === 'original' ? (
          <div style={{ marginBottom: 48 }}>
            <p style={{ ...CAPS, marginBottom: EYEBROW_CHUNK_GAP_VALUES[eyebrowChunkGap] }}>Two user types emerged · n=22</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              {D.personas.map(u => (
                <div key={u.name} style={{ border: '1px solid var(--dir-border)', padding: 16 }}>
                  <p style={{ ...CAPS, marginBottom: 4 }}>Persona</p>
                  <p style={{ fontFamily: ISe, fontSize: 22, fontWeight: 400, lineHeight: 1.25, letterSpacing: '-0.02em', color: 'var(--dir-text-primary)', margin: 0, marginBottom: 12 }}>{u.name}</p>
                  <p style={{ ...BODY, marginBottom: 12 }}>{u.value}.</p>
                  <p style={{ ...DENSE, marginBottom: 4 }}>{u.quote}</p>
                  <p style={{ fontFamily: IS, fontSize: 11, fontWeight: 400, lineHeight: 1.35, color: 'var(--dir-text-secondary)', margin: 0 }}>Interviews · affinity synthesis</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: 48 }}>
            <PersonaArtifactRenderer artifact={s03PersonaArtifact} density={s03PersonaContentDensity} personas={D.personas} />
          </div>
        )}
        {/* Insights trio — bordered cards in 1fr 1fr 1fr grid. Cascade-distinct from persona pair: insight cards use IS 18 Row title for insight (Row title register, tighter than ISe 22 used for persona name). Per `feedback_direction_callout_structural_identity` 4A's premium-portfolio identity = hairline-card discipline ACROSS both persona pair and insight trio — bordered-card chrome IS the family identity. Card internal: CAPS num + IS 18 insight title + DENSE 13 evidence + DENSE 13 req. */}
        <p style={{ ...CAPS, marginBottom: EYEBROW_CHUNK_GAP_VALUES[eyebrowChunkGap] }}>Three key insights</p>
        <p style={{ ...BODY, marginBottom: 16 }}>Different users, same underlying tensions.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 16 }}>
          {D.insights.map((row, ri) => (
            <div key={ri} style={{ border: '1px solid var(--dir-border)', padding: 16 }}>
              <p style={{ ...CAPS, fontVariantNumeric: 'tabular-nums', marginBottom: 8 }}>{row.num}</p>
              {/* Cycle 11 final 2026-05-16: 4A 3-col compressed card insight title at CAPS_13 (compressed-context sub-section title, toggleable via CAPS weight toggle). Was at DENSE 13 — drift (insight title is sub-section content, should be at CAPS title register not body register). Now CAPS_13 + DENSE 13 evidence/req — strict CAPS-body pairing in compressed 3-col cell. */}
              <p style={{ ...CAPS_13, marginBottom: 12 }}>{row.insight}</p>
              <p style={{ ...DENSE, marginBottom: 8 }}>{row.evidence}</p>
              <p style={{ ...DENSE }}>
                <span style={{ color: 'var(--dir-detail)' }}>→</span>{' '}{row.req}
              </p>
            </div>
          ))}
        </div>
        {/* Pattern close — Subordinate aside register (Cycle 4 + Cycle 9 W1 reopen): IS 15/400 italic / text-body-soft. */}
        <p style={{ fontFamily: IS, fontSize: 15, fontWeight: 400, fontStyle: 'italic', lineHeight: 1.5, color: 'var(--dir-text-body-soft)', margin: 0, marginTop: 16, paddingTop: 16, borderTop: withinSectionBorder() }}>The pattern: {D.pattern}</p>
      </>
    );

    // ─────────────── 4B · SENIOR NARRATED ───────────────
    // Senior-narrated portfolio register (Phase A Track 1 Option 4.2 — Tobias van Schneider / Frank Chimero shape).
    // Family identity: persona block as single body-column narrated paragraph delimited by top+bottom hairline
    // rules (NO side rules, NO fill, NO card chrome — distinct from 4A bordered-card discipline) + insights as
    // vertical numbered track with absolute-positioned proof numerals on left edge.
    // Cleanup 2026-05-15 (Family 4 path b per `feedback_enumerate_before_shipping` + pre-edit locks audit):
    //   - LEAD_PRIMARY → SH (cascade)
    //   - Off-spec body intro lh 1.65 + color text-secondary → BODY 15 lh 1.75 text-body per Cycle 9
    //   - Methods sentence rewritten to weave D.methods + D.artifacts + stats inline at BODY register
    //   - PERSONA BLOCK ADDED per Phase A 4.2 (was missing — single narrated paragraph with top+bottom rules, both cohorts INK_POPped, quotes inline)
    //   - Off-ladder CD 24 row numerals → IS 28 locked proof-numeral exception (cross-direction consistent with 1A/1C/4A stats)
    //   - Off-ladder IS 14/500 insight title → IS 18 Row title (matches 4A insight title for cross-direction consistency in Family 4)
    //   - Off-spec IS 12/400 evidence + IS 12/500 req → BODY 15 / BODY 15 (cascade-consistent with native-fixed, 1A, 1C, 2A, 2B, 3C insight rows; 4B has no horizontal compression to justify DENSE — insight blocks have nearly-full body column width inside the paddingLeft 48 track gutter)
    //   - text-secondary on evidence → text-body per Cycle 9 W1 reopen
    //   - Pattern close → Subordinate aside (IS 15 italic / text-body-soft + top border)
    if (s03Direction === '4B-senior-narrated') return (
      <>
        <p style={SH}>{D.lead}</p>
        {/* Methods + stats inline at BODY — senior-narrated voice; no separate stats row, no separate metadata block (4B is prose-led like 1B Pudding / 3A annual letter). */}
        <p style={{ ...BODY, marginBottom: 32 }}>
          We surveyed <span style={INK_POP}>22 designers</span>, ran user interviews, analyzed the competitive landscape, and synthesized findings into a journey map and an insight → requirement map. <span style={INK_POP}>21 of 22</span> use AI daily; <span style={INK_POP}>15 of 22</span> said manual was faster; <span style={INK_POP}>7 of 22</span> stopped because output didn't match vision.
        </p>
        {/* Persona block — REPLACED by Persona Artifact toggle when active. Otherwise: Phase A 4.2 senior-narrated rule-bounded paragraphs. */}
        {s03PersonaArtifact === 'none' && s03PersonaContentDensity === 'original' ? (
          <div style={{ paddingTop: 16, paddingBottom: 16, marginBottom: 32, borderTop: '1px solid var(--dir-border)', borderBottom: '1px solid var(--dir-border)' }}>
            <p style={{ ...BODY, marginBottom: 24 }}>
              Two distinct user types emerged from the work. <span style={INK_POP}>{D.personas[0].name}</span> designers value speed and efficiency, with established tool stacks they won't disrupt for another mid-funnel addition: {D.personas[0].quote}
            </p>
            <p style={{ ...BODY }}>
              <span style={INK_POP}>{D.personas[1].name}</span> want creativity, control, and craft — AI as collaborator, not as autopilot: {D.personas[1].quote} Different priorities, same underlying tension.
            </p>
          </div>
        ) : (
          <div style={{ marginBottom: 32 }}>
            <PersonaArtifactRenderer artifact={s03PersonaArtifact} density={s03PersonaContentDensity} personas={D.personas} />
          </div>
        )}
        {/* Insights — vertical numbered track. Absolute-positioned proof numerals (IS 28 locked exception) at left edge of each block, vertical hairline track between them. Insight body in main column at locked cascade register: IS 18 Row title insight + BODY 15 evidence + BODY 15 req w/ → arrow. 4B's signature insight layout — distinct from 4A's bordered cards via vertical-track shape, NOT register compression (4B has no horizontal compression to justify DENSE; insight blocks have nearly-full body column width inside the paddingLeft 48 track gutter). Cross-direction cascade-consistent with native-fixed, 1A, 1C, 2A, 2B, 3C insight rows at BODY 15. */}
        <div style={{ position: 'relative', paddingLeft: 48 }}>
          <div style={{ position: 'absolute', left: 18, top: 8, bottom: 8, width: 1, backgroundColor: 'var(--dir-border)' }} />
          {D.insights.map((row, ri) => (
            <div key={ri} style={{ position: 'relative', marginBottom: ri < D.insights.length - 1 ? 24 : 0 }}>
              <p style={{ position: 'absolute', left: -48, top: -2, fontFamily: IS, fontSize: 28, fontWeight: 400, lineHeight: 1, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', color: 'var(--dir-text-primary)', margin: 0, width: 36, textAlign: 'center', backgroundColor: 'var(--dir-bg)', paddingTop: 2 }}>{row.num}</p>
              {/* Cycle 11 cascade 2026-05-15: Insight title migrated from dropped IS 18 Row title to ISe 22 content-title register (H2) per Cycle 11 earning rule — insight statement is content. Full-width track context (paddingLeft 48 + body column) fits ISe 22 without wrapping. */}
              <p style={{ ...CAPS_15, marginBottom: 12 }}>{row.insight}</p>
              <p style={{ ...BODY, marginBottom: 8 }}>{row.evidence}</p>
              <p style={{ ...BODY }}>
                <span style={{ color: 'var(--dir-detail)' }}>→</span>{' '}{row.req}
              </p>
            </div>
          ))}
        </div>
        {/* Pattern close — Subordinate aside register (Cycle 4 + Cycle 9 W1 reopen): IS 15/400 italic / text-body-soft. */}
        <p style={{ fontFamily: IS, fontSize: 15, fontWeight: 400, fontStyle: 'italic', lineHeight: 1.5, color: 'var(--dir-text-body-soft)', margin: 0, marginTop: 16, paddingTop: 16, borderTop: withinSectionBorder() }}>The pattern: {D.pattern}</p>
      </>
    );

    // ─────────────── 4C · STUDIO BRIEF ───────────────
    // Pentagram / MetaLab studio-brief register (Phase A Track 1 Option 4.3 — Numbered case-study row pair).
    // Family identity = numbered rows in vertical track for personas (numbered-list chrome, no card) +
    // 3-up bordered card grid for insights (deck-like studio brief signature). Per Cycle 11 close 2026-05-16:
    // numbered persona track uses IS 28 proof numerals (CD 22/28 from Phase A spec → locked IS 28 proof
    // exception); persona names earn ISe 22 (named subjects); insight cards in 3-col compressed grid use
    // CAPS_13 + DENSE 13 pairing per Cycle 11 CAPS-body pairing rule (same pattern as 4A insight cards).
    // Cleanup 2026-05-16 (4C path a — rebuild per Cycle 11 + Phase A 4.3):
    //   - LEAD_PRIMARY → SH (cascade)
    //   - Stacked Methods/Artifacts metadata added (cascade; replaces bottom methods strip)
    //   - Stats labels text-detail → text-secondary (Cycle 9 W1)
    //   - PERSONA CALLOUT ADDED per Phase A Track 1 Option 4.3 (was missing — numbered row pair register)
    //   - Insight card title: off-ladder IS 14/500 → CAPS_13 (compressed-context sub-section title per Cycle 11; same pattern as 4A)
    //   - Insight card num: off-spec IS 11/0.06em/text-detail → CAPS 10 (locked eyebrow register)
    //   - Insight card evidence: IS 11/400 → DENSE 13 (locked Dense Body)
    //   - Insight card req: IS 12/500 → DENSE 13 (CTA exception misuse fixed)
    //   - Pattern close: IS 13 with INK_POP → Subordinate aside (cascade)
    //   - Bottom methods strip DROPPED (redundant — stacked metadata at top per cascade)
    if (s03Direction === '4C-studio-brief') return (
      <>
        <p style={SH}>{D.lead}</p>
        {/* Methods / Artifacts metadata — STACKED label-above-value (single metadata pattern across the case study per `:1235` system-consistency rule). */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
          <div>
            <p style={{ ...META_LABEL, marginBottom: 4 }}>Methods</p>
            <p style={META_VALUE}>{D.methods}</p>
          </div>
          <div>
            <p style={{ ...META_LABEL, marginBottom: 4 }}>Artifacts</p>
            <p style={META_VALUE}>{D.artifacts}</p>
          </div>
        </div>
        {/* Stats row — IS 28/400 locked proof-numeral exception + IS 11/400/text-secondary Caption labels. */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--dir-border)' }}>
          {D.stats.map(s => (
            <div key={s.label}>
              <p style={{ fontFamily: IS, fontSize: 28, fontWeight: 400, lineHeight: 1, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', color: 'var(--dir-text-primary)', margin: 0, marginBottom: 6 }}>{s.num}</p>
              <p style={{ fontFamily: IS, fontSize: 11, fontWeight: 400, lineHeight: 1.35, color: 'var(--dir-text-secondary)', margin: 0 }}>{s.label}</p>
            </div>
          ))}
        </div>
        {/* Persona callout — REPLACED by Persona Artifact toggle when active. Otherwise: Phase A 4.3 numbered case-study row pair. */}
        {s03PersonaArtifact === 'none' && s03PersonaContentDensity === 'original' ? (
          <div style={{ marginBottom: 48 }}>
            <p style={{ ...CAPS, marginBottom: EYEBROW_CHUNK_GAP_VALUES[eyebrowChunkGap] }}>Two user types emerged · n=22</p>
            {D.personas.map((u, i) => (
              <div key={u.name} style={{ display: 'grid', gridTemplateColumns: '40px 1fr', gap: 16, paddingTop: 16, paddingBottom: 16, borderTop: withinSectionBorder(), borderBottom: i === D.personas.length - 1 ? withinSectionBorder() : 'none' }}>
                <p style={{ fontFamily: IS, fontSize: 28, fontWeight: 400, lineHeight: 1, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', color: 'var(--dir-text-primary)', margin: 0 }}>{String(i + 1).padStart(2, '0')}</p>
                <div>
                  <p style={{ ...H2, marginBottom: 4 }}>{u.name}</p>
                  <p style={{ ...DENSE, color: 'var(--dir-text-body-soft)', marginBottom: 8 }}>{u.value}</p>
                  <p style={{ ...DENSE, marginBottom: 4 }}>{u.quote}</p>
                  <p style={{ fontFamily: IS, fontSize: 11, fontWeight: 400, lineHeight: 1.35, color: 'var(--dir-text-secondary)', margin: 0 }}>— Interviews · affinity synthesis</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ marginBottom: 48 }}>
            <PersonaArtifactRenderer artifact={s03PersonaArtifact} density={s03PersonaContentDensity} personas={D.personas} />
          </div>
        )}
        {/* Insights sub-section opener — eyebrow + intro line per native cascade. */}
        <p style={{ ...CAPS, marginBottom: EYEBROW_CHUNK_GAP_VALUES[eyebrowChunkGap] }}>Three key insights</p>
        <p style={{ ...BODY, marginBottom: 16 }}>Different users, same underlying tensions.</p>
        {/* Insights 3-up bordered card grid — 4C signature (studio-brief deck-like layout). Per Cycle 11 CAPS-body pairing: CAPS 10 num + CAPS_13 insight title + DENSE 13 evidence + DENSE 13 req (same compressed-cell pattern as 4A insight cards). 1px hairline borders via `gap: 1 + backgroundColor: dir-border` grid trick. */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, backgroundColor: 'var(--dir-border)', marginBottom: 16 }}>
          {D.insights.map((row, ri) => (
            <div key={ri} style={{ backgroundColor: 'var(--dir-bg)', padding: 16 }}>
              <p style={{ ...CAPS, marginBottom: 8 }}>Insight {row.num}</p>
              <p style={{ ...CAPS_13, marginBottom: 12 }}>{row.insight}</p>
              <p style={{ ...DENSE, marginBottom: 8 }}>{row.evidence}</p>
              <p style={{ ...DENSE }}>
                <span style={{ color: 'var(--dir-detail)' }}>→</span>{' '}{row.req}
              </p>
            </div>
          ))}
        </div>
        {/* Pattern close — Subordinate aside register (Cycle 4 + Cycle 9 W1 reopen): IS 15/400 italic / text-body-soft. */}
        <p style={{ fontFamily: IS, fontSize: 15, fontWeight: 400, fontStyle: 'italic', lineHeight: 1.5, color: 'var(--dir-text-body-soft)', margin: 0, marginTop: 16, paddingTop: 16, borderTop: withinSectionBorder() }}>The pattern: {D.pattern}</p>
      </>
    );

    return null;
  })();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--dir-bg)', overflowX: 'clip' }}>
      {/* Live CPL debug overlay — typography measurement pass · remove once width register locks */}
      {cplInfo && (
        <div style={{
          position: 'fixed', bottom: 16, right: 16, zIndex: 100, pointerEvents: 'none',
          backgroundColor: 'var(--dir-raised)', border: '1px solid var(--dir-border)',
          padding: '12px 16px', borderRadius: 4, minWidth: 180,
          fontFamily: IS, color: 'var(--dir-text-primary)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
        }}>
          <div style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, lineHeight: 1.4, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-detail)', marginBottom: 8 }}>CPL · live</div>
          <div style={{ fontFamily: IS, fontSize: 13, fontWeight: 500, lineHeight: 1.4, color: 'var(--dir-text-primary)', fontVariantNumeric: 'tabular-nums' }}>{Math.round(cplInfo.width)}px → {cplInfo.cpl.toFixed(1)} CPL</div>
          <div style={{ fontFamily: IS, fontSize: 11, fontWeight: 400, lineHeight: 1.35, color: 'var(--dir-text-secondary)', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>{cplInfo.avg.toFixed(2)} px/char · IS 15/400</div>
        </div>
      )}
      <GlobalNav />

      {/* Top-bar progress variant — fixed at viewport top, outside LocalRail */}
      {progressTrackState === 'top-bar' && (
        <IonProgressTrack
          contentRef={contentRef}
          variant="top-bar"
        />
      )}

      {/* ── Pre-toc mode: hook + hero lift above the LocalRail flex row ── */}
      {hookModeState === 'pre-toc' && (
        <>
          {/* Pre-hero text zone — Cycle 6 hero density A/B: paddingTop tied to heroDensity.section. LocalRail (200px) offset added to paddingLeft so hero zone aligns horizontally with §01 column below (otherwise hero is centered in viewport while §01 is offset right by TOC width — visible misalignment per 2026-05-09 fix). */}
          <div style={{ paddingLeft: marginPx + 200 + effectiveGapPx, paddingRight: marginPx, boxSizing: 'border-box' }}>
            <div style={{ paddingTop: heroDensity.section, ...(metaStripPosition !== 'pre-title' && effectiveMaxWidth !== undefined ? { maxWidth: effectiveMaxWidth, ...contentAlignStyle } : {}) }}>
              {metaStripPosition === 'pre-title' ? (
                /* Bill Guo: 2-col flex — LEFT: eyebrow + H1 + subtitle | RIGHT: meta columns */
                <div style={{ display: 'flex', gap: 80, alignItems: 'flex-start', paddingBottom: 32, borderBottom: '1px solid var(--dir-border)' }}>
                  <div style={{ flex: 1, minWidth: 0, ...(effectiveMaxWidth !== undefined ? { maxWidth: effectiveMaxWidth } : {}) }}>
                    {eyebrowStyle !== 'hidden' && (
                      <div style={{ display: 'flex', gap: eyebrowStyle === 'slash' || eyebrowStyle === 'dot' || eyebrowStyle === 'plain' ? 0 : 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
                        {['Ion', 'YC W24', 'AI DESIGN TOOL', '0→1'].map((label, i) => {
                          if (eyebrowStyle === 'slash') return (<span key={label} style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-text-secondary)' }}>{label}{i < 3 ? <span style={{ margin: '0 8px', color: 'var(--dir-detail)' }}>/</span> : null}</span>);
                          if (eyebrowStyle === 'dot') return (<span key={label} style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-text-secondary)' }}>{label}{i < 3 ? <span style={{ margin: '0 8px', color: 'var(--dir-detail)' }}>·</span> : null}</span>);
                          if (eyebrowStyle === 'plain') return (<span key={label} style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-text-secondary)' }}>{label}{i < 3 ? <span style={{ marginRight: 12 }} /> : null}</span>);
                          return (<span key={label} style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-text-secondary)', backgroundColor: 'var(--dir-chip-bg)', border: '1px solid var(--dir-chip-border)', borderRadius: 9999, padding: '3px 8px' }}>{label}</span>);
                        })}
                      </div>
                    )}
                    <h1 style={{ fontFamily: CD, fontSize: 52, fontWeight: 500, lineHeight: 1.08, letterSpacing: '-0.03em', textWrap: 'balance' as React.CSSProperties['textWrap'], color: 'var(--dir-text-primary)', margin: 0 }}>
                      What if AI could start designing with you — instead of for you?
                    </h1>
                  </div>
                  {metaStrip !== 'hidden' && (
                    <div style={{ flexShrink: 0, marginLeft: 'auto' }}>
                      {preTitleMetaJSX}
                    </div>
                  )}
                </div>
              ) : (
                /* Normal: eyebrow → H1 → subtitle */
                <>
                  {eyebrowStyle !== 'hidden' && (
                    <div style={{ display: 'flex', gap: eyebrowStyle === 'slash' || eyebrowStyle === 'dot' || eyebrowStyle === 'plain' ? 0 : 8, flexWrap: 'wrap', marginBottom: EYEBROW_SPACING_VALUES[eyebrowSpacing], alignItems: 'center' }}>
                      {['Ion', 'YC W24', 'AI DESIGN TOOL', '0→1'].map((label, i) => {
                        if (eyebrowStyle === 'slash') return (<span key={label} style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-text-secondary)' }}>{label}{i < 3 ? <span style={{ margin: '0 8px', color: 'var(--dir-detail)' }}>/</span> : null}</span>);
                        if (eyebrowStyle === 'dot') return (<span key={label} style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-text-secondary)' }}>{label}{i < 3 ? <span style={{ margin: '0 8px', color: 'var(--dir-detail)' }}>·</span> : null}</span>);
                        if (eyebrowStyle === 'plain') return (<span key={label} style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-text-secondary)' }}>{label}{i < 3 ? <span style={{ marginRight: 12 }} /> : null}</span>);
                        return (<span key={label} style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-text-secondary)', backgroundColor: 'var(--dir-chip-bg)', border: '1px solid var(--dir-chip-border)', borderRadius: 9999, padding: '3px 8px' }}>{label}</span>);
                      })}
                    </div>
                  )}
                  {/* H1→next gap: hero density Block (Airy=32 / Standard=24) */}
                  <h1 style={{ fontFamily: CD, fontSize: 52, fontWeight: 500, lineHeight: 1.08, letterSpacing: '-0.03em', textWrap: 'balance' as React.CSSProperties['textWrap'], color: 'var(--dir-text-primary)', margin: 0, marginBottom: heroDensity.block }}>
                    What if AI could start designing with you — instead of for you?
                  </h1>
                  {tldrPosition === 'after-subtitle' && (
                    /* TLDR top gap: hero density Block (Airy=32 / Standard=24) */
                    <div style={{ marginTop: heroDensity.block }}>{tldrContent}</div>
                  )}
                  {section01Position === 'pre-hero' && (
                    /* §01 pre-hero block — section divider gap inside hero zone uses heroDensity.section (Airy=64 / Standard=48) */
                    <div style={{ marginTop: 8, paddingTop: heroDensity.section, borderTop: '1px solid var(--dir-border)' }}>
                      {SHPair('01', 'Overview')}
                      <p style={BODY}>Ion turns conversations into production-ready interfaces, without sacrificing craft. An AI design tool built during YC W24 — designed to make AI-assisted design feel like collaboration, not one-shot generation.</p>
                      <p style={{ ...BODY, marginTop: 16 }}>Part of a 6-designer org, I worked day-to-day with 1 founder + 2 engineers in weekly sprints. I had autonomy over Ion's AI product layer — research synthesis, prototyping, and the interaction architecture — and helped keep the team aligned through workshops and system walkthroughs.</p>
                      {contributionGridJSX}
                      {metaStripPosition === 'native' && metaStripJSX}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          {/* Hero block: full-viewport or contained. 'contained' = page-margin + LocalRail offset + text-column maxWidth so the hero image matches the H1 text column AND aligns horizontally with §01 column below (per 2026-05-09 fix). */}
          <div style={preTocHeroWidth === 'full-viewport'
            ? {}
            : { paddingLeft: marginPx + 200 + effectiveGapPx, paddingRight: marginPx, boxSizing: 'border-box' }}
          >
            <div style={{
              ...heroWrapperStyle,
              backgroundColor: 'var(--dir-recessed)',
              position: 'relative',
              ...(preTocHeroWidth === 'full-viewport'
                ? { borderRadius: 0 }
                : (effectiveMaxWidth !== undefined ? { maxWidth: effectiveMaxWidth, ...contentAlignStyle } : {})),
            }}>
              <img src="/proxy-assets/ion/workspace-selected-edit.png" alt="Ion workspace" style={heroImgStyle} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '4px 8px', backgroundColor: 'color-mix(in srgb, var(--dir-text-primary) 72%, transparent)', display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'color-mix(in srgb, var(--dir-bg) 50%, transparent)' }}>rough-proof-asset</span>
                <span style={{ fontFamily: IS, fontSize: 11, fontWeight: 400, color: 'color-mix(in srgb, var(--dir-bg) 40%, transparent)' }}>{`workspace-selected-edit.png · hero · ${preTocHeroWidth} · height ${heroHeight}`}</span>
              </div>
            </div>
          </div>
          {/* Post-hero meta — Rachel Chen pattern — BEFORE LocalRail so TOC starts below meta. Padding tied to heroDensity.section (Airy=64 / Standard=48). LocalRail offset on paddingLeft so meta strip aligns with §01 column below. */}
          {metaStripPosition === 'post-hero' && metaStrip !== 'hidden' && (
            <div style={{ paddingLeft: marginPx + 200 + effectiveGapPx, paddingRight: marginPx, paddingTop: heroDensity.section, paddingBottom: heroDensity.section, borderBottom: '1px solid var(--dir-border)', boxSizing: 'border-box' }}>
              {metaStripBareJSX}
            </div>
          )}
          {/* After-hero TLDR — pre-toc only — rendered ABOVE LocalRail so main's first child is §01 (this lets LocalRail's CONTEXT label align with §01's eyebrow row naturally — both have secWrap paddingTop = 48 from same flex top). LocalRail offset on paddingLeft so TLDR aligns with §01 column. paddingBottom = heroDensity.section for proper section gap. Per 2026-05-09 algorithmic alignment fix. */}
          {tldrPosition === 'after-hero' && (
            <div style={{ paddingLeft: marginPx + 200 + effectiveGapPx, paddingRight: marginPx, paddingBottom: heroDensity.section, borderBottom: '1px solid var(--dir-border)', boxSizing: 'border-box' }}>
              <div style={effectiveMaxWidth !== undefined ? { maxWidth: effectiveMaxWidth, ...contentAlignStyle } : {}}>
                {tldrContent}
              </div>
            </div>
          )}
        </>
      )}

      <div style={outerContainerStyle}>
        {/* LocalRail topPadding aligns CONTEXT label with the first eyebrow on the page:
            - default mode: hero eyebrow sits at hook+thesis paddingTop = heroDensity.section
            - pre-toc mode: §01 is the first content under LocalRail, secWrap paddingTop = 48 */}
        <LocalRail contentRef={contentRef} topPadding={hookModeState === 'pre-toc' ? 48 : heroDensity.section} />

        <main
          ref={contentRef}
          style={{ flex: 1, minWidth: 0, paddingBottom: 96, display: 'grid', gridTemplateColumns: gridCols }}
        >
          {/* Default mode: hook + hero inside the main content grid */}
          {hookModeState === 'default' && (
            <>
              <div style={{ gridColumn: metaStripPosition === 'pre-title' ? gridColF : gridColT }}>
              {/* Hook + Thesis top — Cycle 6 hero density A/B: paddingTop tied to heroDensity.section (Airy=64 / Standard=48) */}
              <div style={{ paddingTop: heroDensity.section }}>
              {/* Bill Guo pre-title: 2-col flex — LEFT: eyebrow + H1 + subtitle | RIGHT: meta columns */}
              {metaStripPosition === 'pre-title' ? (
                <div style={{ display: 'flex', gap: 80, alignItems: 'flex-start', paddingBottom: 32, borderBottom: '1px solid var(--dir-border)' }}>
                  {/* LEFT: eyebrow + H1 + subtitle */}
                  <div style={{ flex: 1, minWidth: 0, ...(effectiveMaxWidth !== undefined ? { maxWidth: effectiveMaxWidth } : {}) }}>
                    {eyebrowStyle !== 'hidden' && (
                      <div style={{ display: 'flex', gap: eyebrowStyle === 'slash' || eyebrowStyle === 'dot' || eyebrowStyle === 'plain' ? 0 : 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
                        {['Ion', 'YC W24', 'AI DESIGN TOOL', '0→1'].map((label, i) => {
                          if (eyebrowStyle === 'slash') return (<span key={label} style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-text-secondary)' }}>{label}{i < 3 ? <span style={{ margin: '0 8px', color: 'var(--dir-detail)' }}>/</span> : null}</span>);
                          if (eyebrowStyle === 'dot') return (<span key={label} style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-text-secondary)' }}>{label}{i < 3 ? <span style={{ margin: '0 8px', color: 'var(--dir-detail)' }}>·</span> : null}</span>);
                          if (eyebrowStyle === 'plain') return (<span key={label} style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-text-secondary)' }}>{label}{i < 3 ? <span style={{ marginRight: 12 }} /> : null}</span>);
                          return (<span key={label} style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-text-secondary)', backgroundColor: 'var(--dir-chip-bg)', border: '1px solid var(--dir-chip-border)', borderRadius: 9999, padding: '3px 8px' }}>{label}</span>);
                        })}
                      </div>
                    )}
                    <h1 style={{ fontFamily: CD, fontSize: 52, fontWeight: 500, lineHeight: 1.08, letterSpacing: '-0.03em', textWrap: 'balance' as React.CSSProperties['textWrap'], color: 'var(--dir-text-primary)', margin: 0 }}>
                      What if AI could start designing with you — instead of for you?
                    </h1>
                  </div>
                  {/* RIGHT: meta columns */}
                  {metaStrip !== 'hidden' && (
                    <div style={{ flexShrink: 0, marginLeft: 'auto' }}>
                      {preTitleMetaJSX}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Eyebrow — toggle: pills outlined | filled | slash | dot | plain | hidden */}
                  {eyebrowStyle !== 'hidden' && (
                    <div style={{ display: 'flex', gap: eyebrowStyle === 'slash' || eyebrowStyle === 'dot' || eyebrowStyle === 'plain' ? 0 : 8, flexWrap: 'wrap', marginBottom: EYEBROW_SPACING_VALUES[eyebrowSpacing], alignItems: 'center' }}>
                      {['Ion', 'YC W24', 'AI DESIGN TOOL', '0→1'].map((label, i) => {
                        if (eyebrowStyle === 'slash') return (<span key={label} style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-text-secondary)' }}>{label}{i < 3 ? <span style={{ margin: '0 8px', color: 'var(--dir-detail)' }}>/</span> : null}</span>);
                        if (eyebrowStyle === 'dot') return (<span key={label} style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-text-secondary)' }}>{label}{i < 3 ? <span style={{ margin: '0 8px', color: 'var(--dir-detail)' }}>·</span> : null}</span>);
                        if (eyebrowStyle === 'plain') return (<span key={label} style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-text-secondary)' }}>{label}{i < 3 ? <span style={{ marginRight: 12 }} /> : null}</span>);
                        return (<span key={label} style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-text-secondary)', backgroundColor: 'var(--dir-chip-bg)', border: '1px solid var(--dir-chip-border)', borderRadius: 9999, padding: '3px 8px' }}>{label}</span>);
                      })}
                    </div>
                  )}
                  {/* H1 — CD 500 52px locked — OG question hook. H1→next gap: hero density Block (Airy=32 / Standard=24) */}
                  <h1 style={{ fontFamily: CD, fontSize: 52, fontWeight: 500, lineHeight: 1.08, letterSpacing: '-0.03em', textWrap: 'balance' as React.CSSProperties['textWrap'], color: 'var(--dir-text-primary)', margin: 0, marginBottom: heroDensity.block }}>
                    What if AI could start designing with you — instead of for you?
                  </h1>
                </>
              )}
              </div>
              </div>

              {/* TL;DR in hook zone — only when after-subtitle. paddingBottom tied to heroDensity.block (Airy=32 / Standard=24) */}
              {tldrPosition === 'after-subtitle' && (
                <div style={{ gridColumn: gridColT, paddingBottom: heroDensity.block }}>{tldrContent}</div>
              )}

              {/* Hero image — bleed controlled by GateAIonHeroBleedContext */}
              <IonHeroImage
                gridColT={gridColT}
                gridColF={gridColF}
                fallbackGridCol={imageWidthState === 'match-text' ? gridColT : gridColF}
                baseStyle={{ ...heroWrapperStyle, backgroundColor: 'var(--dir-recessed)', position: 'relative' }}
              >
                <img
                  src="/proxy-assets/ion/workspace-selected-edit.png"
                  alt="Ion workspace"
                  style={heroImgStyle}
                />
                {/* Asset label strip — matches Media Lab ProxyImage pattern */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '4px 8px',
                    backgroundColor: 'color-mix(in srgb, var(--dir-text-primary) 72%, transparent)',
                    display: 'flex',
                    gap: 12,
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'color-mix(in srgb, var(--dir-bg) 50%, transparent)' }}>rough-proof-asset</span>
                  <span style={{ fontFamily: IS, fontSize: 11, fontWeight: 400, color: 'color-mix(in srgb, var(--dir-bg) 40%, transparent)' }}>{`workspace-selected-edit.png · hero · height ${heroHeight} · ${heroPosition}`}</span>
                </div>
              </IonHeroImage>
            </>
          )}

          {/* TL;DR after-hero position — DEFAULT hookMode only (pre-toc handles it above LocalRail flex per 2026-05-09 alignment fix). Visual treatment controlled by GateAIonTldrStyleContext. paddingBottom tied to heroDensity.section. */}
          {hookModeState === 'default' && tldrPosition === 'after-hero' && (
            <div style={{ paddingBottom: heroDensity.section, borderBottom: '1px solid var(--dir-border)', gridColumn: gridColT }}>
              {tldrContent}
            </div>
          )}

          {/* Post-hero meta strip — Rachel Chen pattern — default hook mode only (pre-toc handles it above LocalRail). paddingBottom tied to heroDensity.section (Airy=64 / Standard=48) — meta strip is structurally part of hero entry zone */}
          {hookModeState === 'default' && metaStripPosition === 'post-hero' && metaStrip !== 'hidden' && (
            <div style={{ gridColumn: gridColT, paddingBottom: heroDensity.section, borderBottom: '1px solid var(--dir-border)' }}>
              {metaStripBareJSX}
            </div>
          )}

          {/* ── Shared style helpers ── */}
          <>
              <>

                {/* §01 — Overview: hidden when pre-toc + pre-hero (rendered above hero instead) */}
                {(hookModeState === 'default' || section01Position === 'post-hero') && (
                <section id="s01" style={secWrap('s01', false)}>
                <div style={twStyle}>
                  {SHPair('01', 'Overview')}
                  {/* Cycle 1 surgical revision 2026-05-07 (per cascade flag #37): Title bucket escalated to Section heading ISe 32/400/lh 1.18/-0.025em/text-primary. marginBottom 24 = Cat 1 section opening per Cycle 6 title→body lock. */}
                  <p style={{ fontFamily: ISe, fontSize: 32, fontWeight: 400, lineHeight: 1.18, letterSpacing: '-0.025em', color: 'var(--dir-text-primary)', margin: 0, marginBottom: 24 }}>
                    Ion turns conversations into production-ready interfaces, without sacrificing craft.
                  </p>
                  <p style={BODY}>
                    An AI design tool built during YC W24 — designed to make AI-assisted design feel like collaboration, not one-shot generation.
                  </p>
                  {/* Body→body paragraph rhythm: 24 (Block in Standard) per locked spacing-layout-rhythm.md `space-5 | 24 | Block: paragraph gap`. Bumped 16→24 per Cycle 8 §01 audit 2026-05-12 — 16 was Component-tier (off-token for body→body). */}
                  <p style={{ ...BODY, marginTop: 24 }}>
                    Part of a 6-designer org, I worked day-to-day with 1 founder + 2 engineers in weekly sprints. I had autonomy over Ion's AI product layer — research synthesis, prototyping, and the interaction architecture — and helped keep the team aligned through workshops and system walkthroughs.
                  </p>
                  {contributionGridJSX}
                  {metaStripPosition === 'native' && metaStripJSX}
                </div>
                {sectionDividerEl(false)}
                </section>
                )}

                {/* §02 — Problem · structure mirrors §06 Ruby's Journey step pattern: text-bearing twStyle divs around an IonBodyImage. Same width treatment as §06 step images. */}
                <section id="s02" style={secWrap('s02', false)}>
                <div style={twStyle}>
                  {SHPair('02', 'Problem')}
                  {/* Cycle 1 surgical revision 2026-05-07 (per cascade flag #37): Section heading at ISe 32/400/lh 1.18/-0.025em/text-primary (Editorial Intro Heading reactivated). marginBottom 24 = Cat 1 section opening per Cycle 6 title→body lock. Matches §03 / §04 / §05 / §06 / §09 / §10 section opening pattern. */}
                  <p style={{ fontFamily: ISe, fontSize: 32, fontWeight: 400, lineHeight: 1.18, letterSpacing: '-0.025em', color: 'var(--dir-text-primary)', margin: 0, marginBottom: 24 }}>
                    Turn every product thinker into a builder.
                  </p>
                  <p style={BODY}>
                    The product was in MVP form, but users kept saying the same thing:
                  </p>
                  {/* Cycle 4 — Pull quote bucket: register driven by `pullQuoteRegister` toggle (A/B test) — IS 15 italic / ISe 22 upright / ISe 18 upright / ISe 18 italic. 2px var(--dir-border) left rule + 16px indent (locked CSML pattern). */}
                  <blockquote style={{ margin: '24px 0', paddingLeft: 16, borderLeft: '2px solid var(--dir-border)' }}>
                    <p style={PULL_QUOTE_STYLE}>
                      "It was difficult to <span style={{ fontWeight: 600 }}>achieve what I had in mind</span>."
                    </p>
                  </blockquote>
                </div>
                {/* §02 artifact — 3 treatments via GateAIonS02ArtifactTreatmentContext (toggle 2026-05-24):
                    'native'         — current treatment: IonBodyImage with --dir-recessed bg + hand-drawn rough-oval marks on raw screenshot. No outer wrapper. Caption below image with numbered quote pairs. Per Shestopalov "annotated old-UI" precedent + Ion hand-feel family.
                    'raised-wrapper' — hybrid: wrap IonBodyImage in --dir-raised outer surface + CAPS 10 eyebrow above. Keep hand-drawn marks unchanged. Keep caption below outside wrapper.
                    'leader-lines'   — Rachel Chen pattern: raised wrapper + CAPS eyebrow + clean rectangular numbered markers (no hand-feel) + labeled callouts BELOW image INSIDE wrapper (bold labels + descriptive text). Simulates Rachel's leader-line callout look without SVG leader-line layout. Caption-below outside dropped (callouts inside replace it). */}
                {s02ArtifactTreatment === 'native' ? (
                  <>
                    <IonBodyImage fallbackStyle={{}} twStyle={twStyle}>
                      {/* MediaFrame outer wrapper (B3 build 2026-05-25).
                          ALWAYS rendered — carries the marginTop offset. When
                          mediaFrame === 'mat', this becomes the visible padded
                          mat (--dir-recessed bg + 1px border + 12px padding).
                          When 'none' or 'hairline', it's transparent and
                          contributes only the marginTop. */}
                      <div style={{
                        width: '100%',
                        marginTop: 32,
                        padding: mediaFrame === 'mat' ? 12 : 0,
                        backgroundColor: mediaFrame === 'mat' ? 'var(--dir-recessed)' : undefined,
                        border: mediaFrame === 'mat' ? '1px solid var(--dir-border)' : undefined,
                        borderRadius: mediaFrame === 'mat' ? borderRadius : undefined,
                      }}>
                      <div style={{
                        width: '100%',
                        backgroundColor: 'var(--dir-recessed)',
                        overflow: 'hidden',
                        // Inner radius slightly smaller than outer when mat'd,
                        // so the mat reads cleanly around the rounded image.
                        borderRadius: mediaFrame === 'mat' ? Math.max(0, borderRadius - 4) : borderRadius,
                        position: 'relative',
                        // 'hairline' state: 1px border on the inner wrapper
                        // directly. Effective in dark; near-invisible in light.
                        border: mediaFrame === 'hairline' ? '1px solid var(--dir-border)' : undefined,
                        ...(isNaturalHeight ? {} : { height: heroHeight }),
                      }}>
                        <img
                          src="/proxy-assets/ion/s02-chat-iteration.png"
                          alt="Old Ion chat interface — user prompts for a progress bar, AI generates one, user hits Undo, then re-prompts asking for a circular variant instead of tweaking the existing output. Two hand-drawn chips mark the trust-break (Undo button, ①) and the iteration-as-restart (second prompt, ②)."
                          style={isNaturalHeight
                            ? { width: '100%', height: 'auto', display: 'block' }
                            : { width: '100%', height: '100%', objectFit: 'cover', objectPosition: heroPosition, display: 'block' }}
                        />
                        <svg
                          viewBox="0 0 1512 1031"
                          preserveAspectRatio={isNaturalHeight ? 'xMidYMid meet' : 'xMidYMid slice'}
                          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
                        >
                          {/* §02 media-overlay ink — HARDCODED #FDFCF9 by design.
                              These marks sit on the screenshot's intrinsic dark chat
                              panel (fixed image content, doesn't change between themes).
                              Using var(--dir-bg) here would flip with the page direction
                              and make the marks invisible in W1-D dark (bg→#16140F dark
                              on already-dark chat panel). Locked to #FDFCF9 across themes.
                              Same rule applied to the raised-wrapper + leader-lines
                              variants below. Earned exception to the token discipline
                              for media-overlay annotations on intrinsically-fixed-dark
                              content. (Fix 2026-05-26 — W1-D walkthrough.) */}
                          <g>
                            <path d={roughOvalPath(1290, 685, 60, 56, 2.4, 11)} stroke="#FDFCF9" strokeWidth={1.5} fill="none" strokeLinecap="round" />
                            <path d={roughOvalPath(1290, 685, 60, 56, 2.4, 23)} stroke="#FDFCF9" strokeWidth={1.5} fill="none" strokeLinecap="round" />
                            <path d={roughOvalPath(1290, 685, 60, 56, 2.4, 37)} stroke="#FDFCF9" strokeWidth={1.5} fill="none" strokeLinecap="round" />
                            <text x={1320} y={725} textAnchor="middle" style={{ fontFamily: ISe, fontSize: 32, fontWeight: 400, fill: '#FDFCF9' }}>1</text>
                          </g>
                          <g>
                            <path d={roughOvalPath(1170, 790, 60, 56, 2.4, 41)} stroke="#FDFCF9" strokeWidth={1.5} fill="none" strokeLinecap="round" />
                            <path d={roughOvalPath(1170, 790, 60, 56, 2.4, 53)} stroke="#FDFCF9" strokeWidth={1.5} fill="none" strokeLinecap="round" />
                            <path d={roughOvalPath(1170, 790, 60, 56, 2.4, 67)} stroke="#FDFCF9" strokeWidth={1.5} fill="none" strokeLinecap="round" />
                            <text x={1200} y={830} textAnchor="middle" style={{ fontFamily: ISe, fontSize: 32, fontWeight: 400, fill: '#FDFCF9' }}>2</text>
                          </g>
                        </svg>
                      </div>
                      </div>
                    </IonBodyImage>
                    <div style={twStyle}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
                        <p style={{ fontFamily: IS, fontSize: 15, fontWeight: 400, fontStyle: 'italic', lineHeight: 1.5, color: 'var(--dir-text-body-soft)', margin: 0 }}>
                          <span style={{ fontStyle: 'normal', marginRight: 8 }}>1 —</span>
                          "I don't trust it to do design."
                        </p>
                        <p style={{ fontFamily: IS, fontSize: 15, fontWeight: 400, fontStyle: 'italic', lineHeight: 1.5, color: 'var(--dir-text-body-soft)', margin: 0 }}>
                          <span style={{ fontStyle: 'normal', marginRight: 8 }}>2 —</span>
                          "Re-prompting takes up time and might lead to different directions."
                        </p>
                        <p style={{ ...CAPS, marginTop: 4 }}>Research synthesis · 22 designer interviews</p>
                      </div>
                    </div>
                  </>
                ) : s02ArtifactTreatment === 'raised-wrapper' ? (
                  <>
                    <IonBodyImage fallbackStyle={{}} twStyle={twStyle}>
                      <div style={{
                        width: '100%',
                        marginTop: 32,
                        padding: 24,
                        backgroundColor: 'var(--dir-raised)',
                        border: '1px solid var(--dir-border)',
                        borderRadius,
                      }}>
                        <p style={{ ...CAPS, marginBottom: 12 }}>Old Ion · In session</p>
                        <div style={{
                          width: '100%',
                          backgroundColor: 'var(--dir-recessed)',
                          overflow: 'hidden',
                          borderRadius,
                          position: 'relative',
                          ...(isNaturalHeight ? {} : { height: heroHeight }),
                        }}>
                          <img
                            src="/proxy-assets/ion/s02-chat-iteration.png"
                            alt="Old Ion chat interface annotated with hand-drawn marks for trust-break (①) and iteration-as-restart (②)."
                            style={isNaturalHeight
                              ? { width: '100%', height: 'auto', display: 'block' }
                              : { width: '100%', height: '100%', objectFit: 'cover', objectPosition: heroPosition, display: 'block' }}
                          />
                          <svg
                            viewBox="0 0 1512 1031"
                            preserveAspectRatio={isNaturalHeight ? 'xMidYMid meet' : 'xMidYMid slice'}
                            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
                          >
                            <g>
                              <path d={roughOvalPath(1290, 685, 60, 56, 2.4, 11)} stroke="#FDFCF9" strokeWidth={1.5} fill="none" strokeLinecap="round" />
                              <path d={roughOvalPath(1290, 685, 60, 56, 2.4, 23)} stroke="#FDFCF9" strokeWidth={1.5} fill="none" strokeLinecap="round" />
                              <path d={roughOvalPath(1290, 685, 60, 56, 2.4, 37)} stroke="#FDFCF9" strokeWidth={1.5} fill="none" strokeLinecap="round" />
                              <text x={1320} y={725} textAnchor="middle" style={{ fontFamily: ISe, fontSize: 32, fontWeight: 400, fill: '#FDFCF9' }}>1</text>
                            </g>
                            <g>
                              <path d={roughOvalPath(1170, 790, 60, 56, 2.4, 41)} stroke="#FDFCF9" strokeWidth={1.5} fill="none" strokeLinecap="round" />
                              <path d={roughOvalPath(1170, 790, 60, 56, 2.4, 53)} stroke="#FDFCF9" strokeWidth={1.5} fill="none" strokeLinecap="round" />
                              <path d={roughOvalPath(1170, 790, 60, 56, 2.4, 67)} stroke="#FDFCF9" strokeWidth={1.5} fill="none" strokeLinecap="round" />
                              <text x={1200} y={830} textAnchor="middle" style={{ fontFamily: ISe, fontSize: 32, fontWeight: 400, fill: '#FDFCF9' }}>2</text>
                            </g>
                          </svg>
                        </div>
                      </div>
                    </IonBodyImage>
                    <div style={twStyle}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
                        <p style={{ fontFamily: IS, fontSize: 15, fontWeight: 400, fontStyle: 'italic', lineHeight: 1.5, color: 'var(--dir-text-body-soft)', margin: 0 }}>
                          <span style={{ fontStyle: 'normal', marginRight: 8 }}>1 —</span>
                          "I don't trust it to do design."
                        </p>
                        <p style={{ fontFamily: IS, fontSize: 15, fontWeight: 400, fontStyle: 'italic', lineHeight: 1.5, color: 'var(--dir-text-body-soft)', margin: 0 }}>
                          <span style={{ fontStyle: 'normal', marginRight: 8 }}>2 —</span>
                          "Re-prompting takes up time and might lead to different directions."
                        </p>
                        <p style={{ ...CAPS, marginTop: 4 }}>Research synthesis · 22 designer interviews</p>
                      </div>
                    </div>
                  </>
                ) : (
                  /* leader-lines (Rachel Chen pattern) — raised wrapper + eyebrow + clean rectangular markers on image + callout chips on RIGHT SIDE (vertically anchored via abs-positioned label-chips at percent top to roughly align with marker y-positions on image). Caption below outside the side-callout grid. */
                  <IonBodyImage fallbackStyle={{}} twStyle={twStyle}>
                    <div style={{
                      width: '100%',
                      marginTop: 32,
                      padding: 24,
                      backgroundColor: 'var(--dir-raised)',
                      border: '1px solid var(--dir-border)',
                      borderRadius,
                    }}>
                      <p style={{ ...CAPS, marginBottom: 16 }}>Old Ion · Annotated</p>
                      <div style={{ display: 'flex', alignItems: 'stretch', gap: 32 }}>
                        {/* IMAGE COL — flex 1, holds image + numbered marker overlay */}
                        <div style={{
                          flex: '1 1 auto',
                          minWidth: 0,
                          position: 'relative',
                          backgroundColor: 'var(--dir-recessed)',
                          borderRadius,
                          overflow: 'hidden',
                          ...(isNaturalHeight ? {} : { height: heroHeight }),
                        }}>
                          <img
                            src="/proxy-assets/ion/s02-chat-iteration.png"
                            alt="Old Ion chat interface with numbered markers at trust-break and iteration-as-restart moments — labeled callouts in right margin."
                            style={isNaturalHeight
                              ? { width: '100%', height: 'auto', display: 'block' }
                              : { width: '100%', height: '100%', objectFit: 'cover', objectPosition: heroPosition, display: 'block' }}
                          />
                          <svg
                            viewBox="0 0 1512 1031"
                            preserveAspectRatio={isNaturalHeight ? 'xMidYMid meet' : 'xMidYMid slice'}
                            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
                          >
                            <g>
                              <rect x={1268} y={663} width={44} height={44} rx={6} ry={6} fill="#FDFCF9" stroke="var(--dir-text-primary)" strokeWidth={1.5} />
                              <text x={1290} y={696} textAnchor="middle" style={{ fontFamily: IS, fontSize: 20, fontWeight: 600, fill: 'var(--dir-text-primary)' }}>1</text>
                            </g>
                            <g>
                              <rect x={1148} y={768} width={44} height={44} rx={6} ry={6} fill="#FDFCF9" stroke="var(--dir-text-primary)" strokeWidth={1.5} />
                              <text x={1170} y={801} textAnchor="middle" style={{ fontFamily: IS, fontSize: 20, fontWeight: 600, fill: 'var(--dir-text-primary)' }}>2</text>
                            </g>
                          </svg>
                        </div>
                        {/* LABEL COL — fixed 220px on right. Callouts vertically anchored via abs top: % to roughly match marker y-positions on the image (marker 1 at ~66% y → label 1 top: 52% / offset up for chip top edge; marker 2 at ~77% y → label 2 top: 72%). Chip styling: numbered chip on left, sits on left-border accent (--dir-detail thin line) serving as ledger-line stub. */}
                        <div style={{ flex: '0 0 220px', position: 'relative' }}>
                          <div style={{ position: 'absolute', left: 0, top: '52%', width: '100%' }}>
                            <div style={{ paddingLeft: 16, borderLeft: '1px solid var(--dir-detail)', position: 'relative' }}>
                              <span style={{ position: 'absolute', left: -12, top: -4, width: 24, height: 24, borderRadius: 4, border: '1px solid var(--dir-text-primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: IS, fontSize: 12, fontWeight: 600, color: 'var(--dir-text-primary)', backgroundColor: 'var(--dir-bg)' }}>1</span>
                              <p style={{ ...CAPS, color: 'var(--dir-text-primary)', margin: 0, marginBottom: 4 }}>Trust break</p>
                              <p style={{ ...DENSE, margin: 0 }}>
                                <span style={{ fontStyle: 'italic', color: 'var(--dir-text-body-soft)' }}>"I don't trust it to do design."</span> Only Undo, not refine.
                              </p>
                            </div>
                          </div>
                          <div style={{ position: 'absolute', left: 0, top: '72%', width: '100%' }}>
                            <div style={{ paddingLeft: 16, borderLeft: '1px solid var(--dir-detail)', position: 'relative' }}>
                              <span style={{ position: 'absolute', left: -12, top: -4, width: 24, height: 24, borderRadius: 4, border: '1px solid var(--dir-text-primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: IS, fontSize: 12, fontWeight: 600, color: 'var(--dir-text-primary)', backgroundColor: 'var(--dir-bg)' }}>2</span>
                              <p style={{ ...CAPS, color: 'var(--dir-text-primary)', margin: 0, marginBottom: 4 }}>Iteration as restart</p>
                              <p style={{ ...DENSE, margin: 0 }}>
                                <span style={{ fontStyle: 'italic', color: 'var(--dir-text-body-soft)' }}>"Re-prompting takes time."</span> No way to tweak — only re-prompt.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Research synthesis byline below side-callout grid — separator border lets the grid breathe + ties chevron to provenance line */}
                      <p style={{ ...CAPS, marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--dir-border)' }}>Research synthesis · 22 designer interviews</p>
                    </div>
                  </IonBodyImage>
                )}
                <div style={twStyle}>
                  {/* Cycle 4 — paragraph rewritten as flowing prose. Soft prefix "Why this mattered:" reframed as transitional opener "This mattered because" — direct connector from pull quote → consequence. Inline emphasis on key phrase driven by `inlineEmphasis` toggle. */}
                  <p style={{ ...BODY, marginTop: 24 }}>
                    This mattered because users could complete the flow, but they <span style={INLINE_EMPHASIS_STYLE}>didn't trust the output enough to iterate</span>, so adoption couldn't compound. We assumed this was a feature problem — build more, polish more, add more controls. Research showed it wasn't.
                  </p>
                </div>
                {sectionDividerEl(false)}
                </section>

                {/* §03 — Discovery — direction switched by GateAIonS03DirectionContext */}
                {/* Each direction renders its own persona callout inline (register varies by direction). */}
                {/* Static research-artifact placeholder is dropped inline per direction (Phase B placement work). */}
                <section id="s03" style={secWrap('s03', false)}>
                <div style={twStyle}>
                  {SHPair('03', 'Discovery')}
                  {discoveryBodyJSX}
                </div>
                {sectionDividerEl(false)}
                </section>

                {/* §04 — Deeper Issue. Artifact = B1 Venn (positioning) per artifact-section-placement-thinking 2026-05-20 ratification — replaces the OG "funnel positioning" candidate, which migrates to §05 Reframe instead (cleaner §04/§05 split: Venn = stack-positioning diagnosis at §04 · Funnel = journey-positioning reframe at §05). Prose rewritten to land on stack-frame (drop "mid-funnel" + "showing up earlier" — those are §05 funnel-reframe territory). */}
                <section id="s04" style={secWrap('s04', false)}>
                <div style={twStyle}>
                  {SHPair('04', 'Deeper Issue')}
                  {/* Cycle 1 surgical revision 2026-05-07 (per cascade flag #37): Section heading at ISe 32/400/lh 1.18/-0.025em/text-primary. Title content lifted from locked CSML lab DiagnosisBetComparison.tsx. marginBottom 24 = Cat 1 section opening per Cycle 6 title→body lock. */}
                  <p style={{ fontFamily: ISe, fontSize: 32, fontWeight: 400, lineHeight: 1.18, letterSpacing: '-0.025em', color: 'var(--dir-text-primary)', margin: 0, marginBottom: 24 }}>
                    It wasn't a feature problem. It was a positioning problem.
                  </p>
                  <p style={BODY}>
                    Designers already have tools they trust — Figma for design, code editors for build, ChatGPT and Claude for ideation. Ion was asking them to adopt yet another tool in an already crowded stack.
                  </p>
                  {/* Body→body paragraph rhythm: 24 (Block in Standard) per locked spec. Bumped 16→24 per Cycle 8 §04 audit 2026-05-12. */}
                  <p style={{ ...BODY, marginTop: 24 }}>
                    If users want AI woven into the work they already do (insight 3) and won't adopt yet another tool (persona 1), the fix isn't better features. It's finding a different position in the stack.
                  </p>
                  {/* Cycle 4 — Pull quote bucket: §04 deeper-issue emphasis line, register driven by `pullQuoteRegister` toggle. Pull-quote text rewritten 2026-05-20 from "where Ion showed up in the user's journey" (journey-frame, belongs to §05) to stack-frame to match the Venn artifact's diagnostic lens. */}
                  <blockquote style={{ margin: '24px 0', paddingLeft: 16, borderLeft: '2px solid var(--dir-border)' }}>
                    <p style={PULL_QUOTE_STYLE}>
                      The problem wasn't Ion's features. It was where Ion fit in the user's stack.
                    </p>
                  </blockquote>
                  {/* §04 artifact — B1 Venn (positioning) · COCREATE dataset (Figma / Code Editors / ChatGPT-Claude · "Ion is here" at center) · classic 3-circle variant · hand-drawn stroke (matches C3UserFlow / B1 Venn hand-feel family). Raised-surface treatment per F1 Panel 04/06 visual-card pattern (color-system-w1.md + feedback_raised_surface_visual_vs_text_anchor): `--dir-raised` bg + `--dir-border` 1px + locked `borderRadius` + 24px padding (chart-art tier). Component decoupled from artifact playground state via `stateOverride` prop so §04 stays locked to COCREATE/classic regardless of playground toggle settings. */}
                  <div style={{
                    marginTop: 32,
                    marginBottom: 24,
                    padding: 24,
                    backgroundColor: 'var(--dir-raised)',
                    border: '1px solid var(--dir-border)',
                    borderRadius,
                  }}>
                    <B1VennPositioning stateOverride={{
                      variant: 'classic',
                      ionSource: 'cocreate',
                      labelPosition: 'outside',
                      // annotationPointer 'arrow' restored 2026-05-20 — the external arrow + "Ion is here" label is part of the canonical CoCreate Venn (per source deck) and the user wants it preserved. The asymmetric visual mass it creates (circles left, annotation right) is intentional, not a centering bug.
                      annotationPointer: 'arrow',
                      centerMarker: 'icon',
                      tintedOverlap: 'off',
                      circleStroke: 'hand-drawn',
                      labelStyle: 'sentence',
                    }} />
                  </div>
                  {/* Cycle 5 finding 2026-05-09: §04 Stakes converted from CAPS eyebrow + Dense 13 / text-detail labeled block to Subordinate aside register matching §03 pattern close. Stakes text rewritten 2026-05-20 to land stack-frame (drop "mid-funnel adoption" + "win the first interaction" — those are journey-frame, belong to §05 funnel-reframe). */}
                  <p style={{ fontFamily: IS, fontSize: 15, fontWeight: 400, fontStyle: 'italic', lineHeight: 1.5, color: 'var(--dir-text-body-soft)', margin: 0, marginTop: 16, paddingTop: 16, borderTop: withinSectionBorder() }}>The stakes: Asking users to displace entrenched workflows meant losing before we started. Ion needed to fit alongside the existing stack — not show up as another tool to evaluate.</p>
                </div>
                {sectionDividerEl(false)}
                </section>

                {/* §05 — Reframe
                    Plan α close 2026-05-21: module-by-module pass. C1 Funnel artifact (2-moment compression — mid-funnel current → start-funnel reframe) inserted between bet and Guardrails; Guardrails dek rewritten to tie causally to the funnel-position move (replaces phrase-echo); Interaction Contract block restores OG tie-back ("To make Slack-first work…") + drops dashed-border before/after placeholders → Before/After compressed to DENSE 13 prose pairs (funnel carries visual weight; contract carries operational mechanism prose); §06 bridge line restored from OG.
                    Source-first per `feedback_solution_section_source_first` — restored OG explicit ties that earlier Cycle 7 rebuild dropped. */}
                <section id="s05" style={secWrap('s05', false)}>
                <div style={twStyle}>
                  {SHPair('05', 'Reframe')}
                  {/* Cycle 1 surgical revision 2026-05-07 (per cascade flag #37): Section heading at ISe 32/400/lh 1.18/-0.025em/text-primary. marginBottom 24 = Cat 1 section opening per Cycle 6 title→body lock. Matches §02 / §03 / §04 / §06 / §09 / §10 section opening pattern. */}
                  <p style={{ fontFamily: ISe, fontSize: 32, fontWeight: 400, lineHeight: 1.18, letterSpacing: '-0.025em', color: 'var(--dir-text-primary)', margin: 0, marginBottom: 24 }}>
                    Same goal. Different starting point.
                  </p>
                  <p style={{ ...BODY, marginBottom: 24 }}>
                    Reposition Ion to the start of the journey (via Slack) and make AI feel like a thought partner with precise control.
                  </p>
                  {/* §05 funnel artifact — C1 Funnel, 2-moment compression (Plan α 2026-05-21).
                      Moment 1 (muted detail tone): current state — "Ion starts here" at step 03 (mid-funnel).
                      Moment 2 (primary tone): the reframe — "What if Ion starts here?" at step 01 (Slack-first start).
                      Each moment renders NativeHorizontal with its own annotation; eyebrow suppressed (null) because the §05 section heading already carries the title role.
                      Raised-surface wrapper per F1 Panel 04/06 visual-card pattern (matches §04 Venn): --dir-raised bg + --dir-border 1px + locked borderRadius + 24px padding. */}
                  <div style={{
                    marginBottom: 24,
                    padding: 24,
                    backgroundColor: 'var(--dir-raised)',
                    border: '1px solid var(--dir-border)',
                    borderRadius,
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                      <C1Funnel
                        stateOverride={{
                          variant: 'horizontal',
                          stageCount: 5,
                          annotationPointer: 'sticker',
                          annotationStep: '03',
                          annotationVariant: 'ion-here',
                          stageCardStyle: 'framed',
                          conversionPct: 'hidden',
                        }}
                        stickerTone="detail"
                        eyebrow={null}
                      />
                      <C1Funnel
                        stateOverride={{
                          variant: 'horizontal',
                          stageCount: 5,
                          annotationPointer: 'sticker',
                          annotationStep: '01',
                          annotationVariant: 'what-if',
                          stageCardStyle: 'framed',
                          conversionPct: 'hidden',
                        }}
                        stickerTone="primary"
                        eyebrow={null}
                      />
                    </div>
                    {/* Caption — Subordinate aside register (IS 15 italic / body-soft) per Cycle 4 + Cycle 9 W1 update. Matches §02 figcaption pattern. Ties the two moments to the bet's "start of the journey via Slack" framing in one sentence. */}
                    <p style={{ fontFamily: IS, fontSize: 15, fontWeight: 400, fontStyle: 'italic', lineHeight: 1.5, color: 'var(--dir-text-body-soft)', margin: 0, marginTop: 16, paddingTop: 16, borderTop: withinSectionBorder() }}>
                      Ion moves from mid-funnel — where designers already have tools — to first touch in Slack.
                    </p>
                  </div>
                  <p style={{ ...CAPS, marginBottom: EYEBROW_CHUNK_GAP_VALUES[eyebrowChunkGap] }}>Ruby Guardrails</p>
                  {/* Dek with Option 1 close 2026-05-21 — folds contract framing + purpose tag into one sentence so:
                      (a) the contract concept is named at the moment the rules are introduced (no dangling "the contract" referent later),
                      (b) the OG tagline "speed without losing control" lands in the same breath as the contract intro (no redundant bookend close),
                      (c) the bridge below ("how that contract shows up across each touchpoint") has a clear referent.
                      Replaces the earlier phrase-echo dek ("Thought partner with precise control only works if…") which restated bet vocabulary without explaining WHY the rules belong here. */}
                  <p style={{ ...BODY, marginBottom: 12 }}>
                    Sitting at first touch means Ruby earns or loses trust on the first message. So we wrote a four-rule contract — speed without losing control.
                  </p>
                  {/* Cycle 7 Phase B B1 — Ruby Guardrails items 2026-05-11.
                      Per cascade earning (flag #43) + Cycle 6 title→body Cat 3 (row tight pair): operating-principles items are labeled rows.
                      Item title: CAPS_15 (Cycle 11 close 2026-05-16 — demoted from ISe 22 per scarcity rule).
                      Item description: Body 15 / 400 / text-primary (Cycle 2 lock).
                      Title→description gap: 12 (Cat 2 Tight = topic+answer cluster).
                      Layout A/B via GateAIonS05GuardrailsLayoutContext (stacked default · grid-2x2 variant). */}
                  <div style={
                    s05GuardrailsLayout === 'grid-2x2'
                      ? { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: s03SubSectionGap, marginBottom: s03SubSectionGap }
                      : { display: 'flex', flexDirection: 'column', gap: s03SubSectionGap, marginBottom: s03SubSectionGap }
                  }>
                    {([
                      { title: 'Clarify before acting', desc: 'Asks a follow-up when intent is ambiguous' },
                      { title: 'Show reasoning', desc: 'Explains what changed and why' },
                      { title: 'Preserve user work', desc: 'Previews changes; undo/restore always available' },
                      { title: 'Admit uncertainty', desc: 'Offers 2–3 options when confidence is low' },
                    ] as const).map(g => (
                      <div key={g.title}>
                        <p style={{ ...CAPS_15, marginBottom: 12 }}>{g.title}</p>
                        <p style={{ ...BODY }}>{g.desc}</p>
                      </div>
                    ))}
                  </div>
                  {/* Interaction Contract block DROPPED 2026-05-21 (Option 1 close).
                      Build evidence: rules and loop are two views of the same thing — any Contract Before/After (literal OG version or abstracted) restated the Guardrails (e.g. "clarify-before-execute" = Guardrail #1). The Contract concept now lives in the Guardrails dek above ("we wrote a four-rule contract") and in the bridge below ("how that contract shows up across each touchpoint"). The rules ARE the contract; no standalone Contract block needed.
                      CSML §05 Ion implementation lock updated to reflect: single operational proof block (Ruby Guardrails) + strategic-move artifact (C1 Funnel) + bridge. See `docs/locked/case-study-modules/05-bet-and-reframe.md` §05 close history. */}
                  {/* Bridge to §06 — OG line, Subordinate aside register (IS 15 italic / body-soft) matches §02 figcaption + §04 Stakes pattern. Quiet forward-pointing handoff; "that contract" resolves to the four-rule contract named in the Guardrails dek above. */}
                  <p style={{ fontFamily: IS, fontSize: 15, fontWeight: 400, fontStyle: 'italic', lineHeight: 1.5, color: 'var(--dir-text-body-soft)', margin: 0 }}>
                    Next: here's how that contract shows up across each touchpoint.
                  </p>
                </div>
                {sectionDividerEl(false)}
                </section>

                {/* §06 — Ruby's Journey
                    Chunk 1 close 2026-05-23 (§06 module-by-module pass · per outline doc gate-a-ion-s06-outline-and-build-plan.md). Opener prose rewritten to OG verbatim (D10 = B) so it bookends with §05 close + §06 closer tie-back caption — all three explicitly name "the Reframe contract" and "three roles" across the §04→§05→§06 spine. The earlier headline "One AI, every touchpoint." + framing "Ruby isn't a one-off feature…" landed the multi-touchpoint claim but didn't name the contract, leaving §05's "that contract" bridge as a dangling referent. New opener resolves the bookend.
                    Framing→first-step gap: 32 → 48 (Section token per Cycle 6 Standard density lock — framing line is conceptually intro layer, separate from step content; deserves Section gap not Block). */}
                <section id="s06" style={secWrap('s06', false)}>
                <div style={twStyle}>
                  {SHPair('06', "Ruby's Journey")}
                  {/* Cycle 1 surgical revision 2026-05-07: Section heading at ISe 32/400/lh 1.18/-0.025em/text-primary. marginBottom 24 = Cat 1 section opening per Cycle 6 title→body lock. */}
                  <p style={{ fontFamily: ISe, fontSize: 32, fontWeight: 400, lineHeight: 1.18, letterSpacing: '-0.025em', color: 'var(--dir-text-primary)', margin: 0, marginBottom: 24 }}>
                    One contract, three roles.
                  </p>
                  <p style={{ ...BODY, marginBottom: 24 }}>
                    The Reframe contract holds everywhere — but Ruby's role shifts with the surface. Conversational in Slack, collaborative on Canvas, on-call in Workspace. You decide how much AI you want at each step.
                  </p>
                  {/* Author voice — Subordinate aside (IS 15 italic / body-soft) per opendoor-case-study-review audit Fix 2 (2026-05-24). After D14 dropped per-step "My move" from §06 (authorship duplicated §07 per operating manual alignment), §06 lost ALL author presence — reader saw "the system did X" across 3 steps + closer without ever seeing Sebastian's role IN the walkthrough. This single sentence at the opener restores author voice without duplicating §07's per-decision authorship: names the umbrella work (interaction architecture + prototyping) at section entry, then §06's content carries the system-voice walkthrough, then §07's decision dossier carries the per-decision authorship. marginBottom 48 (Section gap to first step) — author line caps the intro family, then steps begin. */}
                  <p style={{ fontFamily: IS, fontSize: 15, fontWeight: 400, fontStyle: 'italic', lineHeight: 1.5, color: 'var(--dir-text-body-soft)', margin: 0, marginBottom: 48 }}>
                    I led the interaction architecture for Ruby's behaviors — designing the touchpoints and prototyping the flows.
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: s03SubSectionGap }}>
                    {/* Step 1 — Slack Entry · Shipped · State 1 / Stack mode
                        Chunk 2 SURGICAL REBUILD 2026-05-23 (§06 module-by-module pass · per revised outline doc + line-by-line audit + alignment check vs locked systems).

                        Audit-driven fixes vs prior Chunk 2 attempt:
                        - Combined eyebrow row "Step 01 · Shipped" (ONE row, locked lab pattern) — was two separate rows.
                        - "Step 01" now CAPS 10 / --dir-text-secondary — was --dir-detail (W1 §H anti-drift: detail is annotation-accent role, NOT text).
                        - DROPPED "Entry Point" redundant content eyebrow — headline IS the content title per locked lab + OG.
                        - DROPPED Ruby role chip per D7 revision — opener carries role framing (bookend with closer); prior IS 13 italic body-soft was off-spec per Type §H (Subordinate aside sanctioned only at IS 15).
                        - DROPPED Supports line per D6 revision — was META_VALUE anti-drift violation (Dense 13 + text-secondary outside metadata-pair) + doesn't answer any of CSML §06's 4 step questions.
                        - DROPPED My move per D14 (new) — duplicates §07 D1 authorship per operating manual alignment check (3 of 4 §06 my moves duplicate §07 my moves; CSML §06 line 187 "may use" not required).
                        - DROPPED Body A's "Faster first success, less setup overhead." Result-fold sentence — read as fragment per user audit; body now ends cleanly at "get options back."

                        Locked-system adherence:
                        - Eyebrow: CAPS const (IS 10/500/0.12em UC/--dir-text-secondary) per Cycle 3 + Cycle 11 close.
                        - Headline: ISe 22 — EARNS per Cycle 3 close (story-shaped sub-section title rule, flag #37: "§06 step titles use ISe 22") + Cycle 6 Cat 2 12px sub-section opening lock.
                        - Body A: BODY const (IS 15/400/LH 1.5/--dir-text-body) per Cycle 2 + Cycle 9 W1 reopen + Cycle 11 LH tightening. 3-sentence (Body A target).
                        - Pull quote: ISe 18 italic / 400 / LH 1.4 / -0.01em / --dir-text-primary · 2px solid --dir-border left rule · 16px indent · NO box · Block 24/24 margins per Type §D + CSML §06 Proof 1 spec.
                        - Stack mode: artifact at bottom per CSML §06 line 211 reading order (step framing → body → proof → artifact). */}
                    <div>
                      <div style={twStyle}>
                        {/* Combined eyebrow row — "Step 01" plain CAPS positional marker + middle-dot + "Shipped" state-pill per Cycle 6 operating manual lock (cross-system-rules.md line 484 — state-pill named as sanctioned Types 2+3 eyebrow type alongside sub-section eyebrow and metadata-block eyebrow). PROPER pill via hardcoded borderRadius 9999 (not the statusChipStyle toggle ternary which rendered as half-rectangle when toggle wasn't 'pill-outlined'). Border + bg per W1 uniform chip tokens (no per-status color per W1 anti-drift). */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: EYEBROW_CHUNK_GAP_VALUES[eyebrowChunkGap] }}>
                          <span style={{ ...CAPS }}>Step 01</span>
                          <span aria-hidden style={{ ...CAPS, opacity: 0.5 }}>·</span>
                          <span style={{ ...CAPS, padding: '2px 8px', border: '1px solid var(--dir-chip-border)', borderRadius: 9999 }}>Shipped</span>
                        </div>
                        <p style={{ fontFamily: ISe, fontSize: 22, fontWeight: 400, lineHeight: 1.25, letterSpacing: '-0.02em', color: 'var(--dir-text-primary)', margin: 0, marginBottom: 12 }}>Start in Slack</p>
                        <p style={{ ...BODY, margin: 0 }}>
                          Ideas start in conversation — Ruby lives where your team already works. Trigger @ruby in any channel, drop in a sketch or screenshot, and get options back.
                        </p>
                        <blockquote style={{ margin: '24px 0', paddingLeft: 16, borderLeft: '2px solid var(--dir-border)' }}>
                          <p style={{ fontFamily: ISe, fontSize: 18, fontWeight: 400, fontStyle: 'italic', lineHeight: 1.4, letterSpacing: '-0.01em', color: 'var(--dir-text-primary)', margin: 0 }}>
                            "If it's not in Slack, my team won't use it."
                          </p>
                          <p style={{ ...CAPS, marginTop: 8, marginBottom: 0 }}>
                            In sessions
                          </p>
                        </blockquote>
                      </div>
                      {/* Artifact — Stack mode bottom. Pre-existing workspace-selected-edit.png retained; Slack-specific asset upgrade deferred to artifact production wave per outline doc Section 7. */}
                      <IonBodyImage fallbackStyle={{}} twStyle={twStyle}>
                        <div style={{ width: '100%', height: 110, overflow: 'hidden', borderRadius, backgroundColor: 'var(--dir-recessed)', position: 'relative' }}>
                          <img src="/proxy-assets/ion/workspace-selected-edit.png" alt="Slack entry point" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }} />
                          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '3px 8px', backgroundColor: 'color-mix(in srgb, var(--dir-text-primary) 72%, transparent)', display: 'flex', gap: 8 }}>
                            <span style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'color-mix(in srgb, var(--dir-bg) 50%, transparent)' }}>rough-proof-asset</span>
                            <span style={{ fontFamily: IS, fontSize: 11, fontWeight: 400, color: 'color-mix(in srgb, var(--dir-bg) 40%, transparent)' }}>workspace-selected-edit.png · step 1 · Slack entry</span>
                          </div>
                        </div>
                      </IonBodyImage>
                    </div>

                    {/* Step 2 — Canvas · Shipped · State 1 / Stack mode
                        Chunk 3 close 2026-05-23 (§06 module-by-module pass · revised outline doc):
                        - Combined eyebrow: "Step 02 · Shipped" — same state-pill pattern as Step 1 per operating manual line 484.
                        - Headline ISe 22: "Explore directions side-by-side" (unchanged content, matches OG)
                        - Body A rewritten to OG primary body (live cursor mention restored per audit + Feature inventory)
                        - Pull quote (Proof 1): "I need to compare directions side-by-side." / In sessions
                        - ARTIFACT = comparison table "Why Infinite Canvas" per D9 = A revised — table replaces image placeholder; table IS the main artifact (clean editorial grid, NO boxed cells, row separators only per CSML §06 dead branch list). Content verbatim from DECK-L (4 rows × 3 cols).
                        - DROPPED: EXPLORATION eyebrow · Ruby chip · My move · Result line · placeholder Canvas screenshot (table replaces it). */}
                    <div>
                      <div style={twStyle}>
                        {/* Combined eyebrow row — same pattern as Step 1 (operating manual state-pill sanction) */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: EYEBROW_CHUNK_GAP_VALUES[eyebrowChunkGap] }}>
                          <span style={{ ...CAPS }}>Step 02</span>
                          <span aria-hidden style={{ ...CAPS, opacity: 0.5 }}>·</span>
                          <span style={{ ...CAPS, padding: '2px 8px', border: '1px solid var(--dir-chip-border)', borderRadius: 9999 }}>Shipped</span>
                        </div>
                        <p style={{ fontFamily: ISe, fontSize: 22, fontWeight: 400, lineHeight: 1.25, letterSpacing: '-0.02em', color: 'var(--dir-text-primary)', margin: 0, marginBottom: 12 }}>Explore directions side-by-side</p>
                        <p style={{ ...BODY, margin: 0 }}>
                          Canvas is the infinite surface where exploration happens. Branch, compare, and iterate without losing context — and select any element with the live cursor to ask Ruby for an inline edit.
                        </p>
                        <blockquote style={{ margin: '24px 0', paddingLeft: 16, borderLeft: '2px solid var(--dir-border)' }}>
                          <p style={{ fontFamily: ISe, fontSize: 18, fontWeight: 400, fontStyle: 'italic', lineHeight: 1.4, letterSpacing: '-0.01em', color: 'var(--dir-text-primary)', margin: 0 }}>
                            "I need to compare directions side-by-side."
                          </p>
                          <p style={{ ...CAPS, marginTop: 8, marginBottom: 0 }}>
                            In sessions
                          </p>
                        </blockquote>
                      </div>
                      {/* Artifact — Canvas UI screenshot placeholder. Comparison-card concept DROPPED 2026-05-23 (revised from D9): didn't actually answer CSML §06's "what shows it visually" step requirement — comparison is competitive-positioning argument (which is §04 Diagnosis territory via the Venn), NOT visual proof of THIS step. Step 2's right artifact is a Canvas UI showing branches in parallel + live cursor element selection. Asset upgrade pending; image-style placeholder via IonBodyImage for now (matches Steps 1 + 3 pattern). */}
                      <IonBodyImage fallbackStyle={{}} twStyle={twStyle}>
                        <div style={{ width: '100%', height: 110, border: '1px dashed var(--dir-border)', borderRadius, backgroundColor: 'var(--dir-recessed)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                          <span style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-detail)' }}>asset-upgrade-pending</span>
                          <span style={{ fontFamily: IS, fontSize: 11, fontWeight: 400, color: 'var(--dir-detail)', opacity: 0.7 }}>step 2 · Canvas UI · branches in parallel + live cursor</span>
                        </div>
                      </IonBodyImage>
                    </div>

                    {/* Step 3 — Workspace · In Dev · State 1 / Stack mode
                        Chunk 4 close 2026-05-23 (§06 module-by-module pass · revised outline doc):
                        - Content REWRITE from "Curation" framing to OG "Workspace" framing per Section 3 of outline doc. Was "Combine the best parts, without losing provenance" → now "Precise edits with familiar control" per OG Step 3 verbatim. Body rewritten to OG Workspace content (property panels + layers + Ruby steps back + summon for high-impact edits).
                        - Combined eyebrow: "Step 03 · In Dev" — same state-pill pattern as Steps 1-2.
                        - Pull quote (Proof 1): "I need to nudge spacing, change a token, fix one specific thing — without scrolling through a chat." / In sessions
                        - Image at bottom (Stack mode). ASSET MISMATCH NOTED: current canvas-version-branching.png is branching content, not Workspace/property-panel content; asset upgrade required during artifact production wave per outline Section 7. Asset retained for now (structure first, assets later).
                        - DROPPED: CURATION eyebrow · Ruby chip · My move · Result line. */}
                    <div>
                      <div style={twStyle}>
                        {/* Combined eyebrow row — same pattern as Steps 1-2 */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: EYEBROW_CHUNK_GAP_VALUES[eyebrowChunkGap] }}>
                          <span style={{ ...CAPS }}>Step 03</span>
                          <span aria-hidden style={{ ...CAPS, opacity: 0.5 }}>·</span>
                          <span style={{ ...CAPS, padding: '2px 8px', border: '1px solid var(--dir-chip-border)', borderRadius: 9999 }}>In Dev</span>
                        </div>
                        <p style={{ fontFamily: ISe, fontSize: 22, fontWeight: 400, lineHeight: 1.25, letterSpacing: '-0.02em', color: 'var(--dir-text-primary)', margin: 0, marginBottom: 12 }}>Precise edits with familiar control</p>
                        <p style={{ ...BODY, margin: 0 }}>
                          When a direction is locked in, you switch from Canvas to Workspace — a focused view with property panels and layers, like Figma users already know. Ruby steps back; you drive. Summon it for high-impact edits and the contract still applies.
                        </p>
                        <blockquote style={{ margin: '24px 0', paddingLeft: 16, borderLeft: '2px solid var(--dir-border)' }}>
                          <p style={{ fontFamily: ISe, fontSize: 18, fontWeight: 400, fontStyle: 'italic', lineHeight: 1.4, letterSpacing: '-0.01em', color: 'var(--dir-text-primary)', margin: 0 }}>
                            "I need to nudge spacing, change a token, fix one specific thing — without scrolling through a chat."
                          </p>
                          <p style={{ ...CAPS, marginTop: 8, marginBottom: 0 }}>
                            In sessions
                          </p>
                        </blockquote>
                      </div>
                      {/* Artifact — Stack mode bottom. ASSET MISMATCH: canvas-version-branching.png is branching/curation content, NOT Workspace/property-panel. Asset upgrade required per outline doc Section 7. Retained for now (structure first; DECK-D has fully-spec'd property panel content available as source for upgrade). */}
                      <IonBodyImage fallbackStyle={{}} twStyle={twStyle}>
                        <div style={{ width: '100%', height: 110, overflow: 'hidden', borderRadius, backgroundColor: 'var(--dir-recessed)', position: 'relative' }}>
                          <img src="/proxy-assets/ion/canvas-version-branching.png" alt="Workspace property panel (asset upgrade pending)" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }} />
                          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '3px 8px', backgroundColor: 'color-mix(in srgb, var(--dir-text-primary) 72%, transparent)', display: 'flex', gap: 8 }}>
                            <span style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'color-mix(in srgb, var(--dir-bg) 50%, transparent)' }}>asset-upgrade-pending</span>
                            <span style={{ fontFamily: IS, fontSize: 11, fontWeight: 400, color: 'color-mix(in srgb, var(--dir-bg) 40%, transparent)' }}>step 3 · Workspace + property panel screenshot needed</span>
                          </div>
                        </div>
                      </IonBodyImage>
                    </div>

                    {/* CLOSER · Throughline — NON-NUMBERED synthesis beat (NOT Step 4)
                        Chunk 5 close 2026-05-23 (§06 module-by-module pass · revised outline doc).

                        OG explicit (outline-source:307): "2-Frame Guardrail Proof: required internal artifact — lives inside the closer, NOT as Step 4." Current shell had Step 4 = Refinement doing closer-work as a numbered step (structural mismatch with OG). Replaced with non-numbered closer per OG.

                        Closer structure (Custom state per D2 — not in 3-state ladder):
                        - Visual break (Hero 64 marginTop) signals "new beat, not Step 4"
                        - No step number, no status chip, no eyebrow row (closer is non-numbered)
                        - Headline ISe 22 (NOT ISe 32 — closer is sub-section to §06, not section heading)
                        - Body A per OG verbatim
                        - Evidence block (In sessions line) as Subordinate aside register — absorbs body-soft italic that My move dropped per D14
                        - 2-Frame Guardrail Proof artifact in raised-surface wrapper (F1 Panel 04/06 — matches §04 Venn + §05 Funnel pattern) · placeholder per D4 = B · voice modality per D13 = A
                        - Tie-back caption (Subordinate aside) names "Reframe" by name — closes the §04→§05→§06 loop explicitly
                        - DROPPED per D14: My move line ("I prototyped the clarification states…" — duplicated §07 D3 authorship). */}
                    <div style={{ marginTop: 64 }}>
                      <div style={twStyle}>
                        <p style={{ fontFamily: ISe, fontSize: 22, fontWeight: 400, lineHeight: 1.25, letterSpacing: '-0.02em', color: 'var(--dir-text-primary)', margin: 0, marginBottom: 12 }}>
                          One contract, three roles. Ruby clarifies before executing — but only as much as you want it to.
                        </p>
                        <p style={{ ...BODY, margin: 0 }}>
                          The Reframe contract isn't a feature in any single surface — it's the behavior that holds across all of them. Ruby's role changes (conversational, collaborative, on-call), but the rule is constant: when intent is ambiguous on a high-impact edit, Ruby pauses to clarify instead of guessing.
                        </p>
                        {/* Evidence block (Proof 2 in OG terms) — Subordinate aside register absorbs the body-soft italic that My move would have used (no double-spending per D14 drop). NOT pull quote — closer body is dense + structural; pull quote would compete with 2-Frame artifact below. */}
                        <p style={{ fontFamily: IS, fontSize: 15, fontWeight: 400, fontStyle: 'italic', lineHeight: 1.5, color: 'var(--dir-text-body-soft)', margin: 0, marginTop: 16, marginBottom: 24 }}>
                          In sessions: users hesitated when AI made precise changes without confirming intent.
                        </p>
                        {/* 2-Frame Guardrail Proof — STACKED inside twStyle (text-column width, matches §04 Venn + §05 Funnel wrapper placement). Layout decision 2026-05-24: side-by-side at text-column ~840px cramped each frame to ~412px which is too tight for the eventual Canvas + dialog + apply Detail. STACKED gives each frame full text-column width AND matches §05 Funnel's 2-moment-compression pattern (top: mid-funnel current → bottom: start-funnel reframe) — same conceptual structure (2 beats showing a change), same layout = spine cohesion. Per OG outline-source:307 the proof IS the Before-vs-After comparison; stacked preserves that structural point as sequential narrative. NO callout lists per CSML §06 dead branch line 202. Voice modality per D13 in descriptors. Tie-back caption below stacked frames. */}
                        <div style={{
                          padding: 24,
                          backgroundColor: 'var(--dir-raised)',
                          border: '1px solid var(--dir-border)',
                          borderRadius,
                        }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {/* Frame A — Before */}
                            <div style={{ width: '100%', minHeight: 130, border: '1px dashed var(--dir-border)', borderRadius, padding: '20px 24px', backgroundColor: 'var(--dir-recessed)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, textAlign: 'center' }}>
                              <span style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-detail)' }}>required-future-asset</span>
                              <span style={{ fontFamily: IS, fontSize: 13, fontWeight: 400, lineHeight: 1.55, color: 'var(--dir-text-secondary)', maxWidth: 520 }}>
                                Before · voice "Make this smaller" → Ruby applies immediately → wrong change → undo
                              </span>
                            </div>
                            {/* Frame B — After */}
                            <div style={{ width: '100%', minHeight: 130, border: '1px dashed var(--dir-border)', borderRadius, padding: '20px 24px', backgroundColor: 'var(--dir-recessed)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, textAlign: 'center' }}>
                              <span style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-detail)' }}>required-future-asset</span>
                              <span style={{ fontFamily: IS, fontSize: 13, fontWeight: 400, lineHeight: 1.55, color: 'var(--dir-text-secondary)', maxWidth: 520 }}>
                                After · same voice command → Ruby clarifies "Do you mean hero title or section header?" → user confirms → Ruby proposes exact delta → apply
                              </span>
                            </div>
                          </div>
                          {/* Tie-back caption — Subordinate aside register matching §02 figcaption + §04 Stakes + §05 funnel caption + closer Evidence block above. paddingTop + borderTop create within-section divider before the tie-back. Names "Reframe" by name — explicit §04→§05→§06 loop closer per OG note (outline-source:328). */}
                          <p style={{ fontFamily: IS, fontSize: 15, fontWeight: 400, fontStyle: 'italic', lineHeight: 1.5, color: 'var(--dir-text-body-soft)', margin: 0, marginTop: 16, paddingTop: 16, borderTop: withinSectionBorder() }}>
                            The Reframe contract, holding across every surface — even though Ruby's role changes at each one.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                {sectionDividerEl(false)}
                </section>

                {/* §07 — Decisions
                    Interim CSML conformance pass 2026-05-08. Replaced flat Why/Move/Changed/Catch render with locked-spec accordion dossier per `docs/locked/case-study-modules/07-decision-snapshots.md` and locked lab `Case Study Module Lab/.../DecisionSnapshotsFinal.tsx`. Adheres to Cycle 1–4 register locks (Type ladder + Body bucket + Eyebrow bucket + Subordinate aside). Content lifted from locked lab — canonical per `feedback_match_locked_labs`.

                    Cycle 7 Q4 ✅ LOCKED 2026-05-12 — §07 accordion as sanctioned interaction axis. Three locks:
                    (1) Accordion is the canonical interaction pattern for the Decisions module (CSML §07 line 154: "The accordion is the final interaction pattern"). §07 is the only narrative-content interaction in the case study; all other modules are static rendering.
                    (2) First-open-by-default production rule (CSML §07 line 156). Implemented at `:394` via `useState<number | null>(1)` — decision id=1 opens on load, others collapsed. Not a toggle, not user-state-persisted; fresh on every load.
                    (3) Collapsed-must-carry-value rule (CSML §07 lines 165-166): "The section should not require interaction for basic understanding. The collapsed rows already need to carry real value." Collapsed state renders title + chosen + summary; expanded adds Why + Move/Changed + optional catch.

                    System principle (broader, locked per Cycle 7 Q4): interaction axes are sanctioned PER-MODULE via Cycle 7-style customs, not assumed or extended. Future stateful interactions (e.g., §06 step animations, media zoom, etc.) each need their own custom lock — they don't inherit §07's accordion sanction. */}
                <section id="s07" style={secWrap('s07', false)}>
                <div style={twStyle}>
                  {SHPair('07', 'Decisions')}
                  {/* Cycle 1 — Title bucket: ISe 32/400 (Section heading register, surgical revision).
                      Heading sharpened 2026-05-24 per opendoor-case-study-review audit Fix 1: prior "Three decisions that shaped Ion." was DESCRIPTIVE (just labeled the section's count) — didn't carry an argument like neighboring §04 ("It wasn't a feature problem...") / §05 ("Same goal. Different starting point.") / §08 ("We cut scope to protect the core bet.") / §09 ("The Slack-first bet shipped..."). New heading ties to §05's "thought partner with precise control" bet — §07 = how those 3 decisions made the partner-behavior real. Identity-bearing claim ("partner, not a tool") carries the section's actual stakes. */}
                  <p style={{ fontFamily: ISe, fontSize: 32, fontWeight: 400, lineHeight: 1.18, letterSpacing: '-0.025em', color: 'var(--dir-text-primary)', margin: 0, marginBottom: 24 }}>
                    Three decisions made Ion behave like a partner, not a tool.
                  </p>
                  {/* Accordion dossier — collapsed (id + title + chosen + summary) / expanded (Why → My move + What it changed → optional catch). First open by default per CSML §07 production rule. */}
                  <div>
                    {([
                      {
                        id: 1,
                        title: 'Slack as the entry point',
                        chosen: 'Slack-first entry over a standalone tool',
                        // Flag #64 close 2026-05-24: sharpened to "Users wanted X, not Y" family pattern (matches Decision 3 calibration). Drops two-clause research cadence + jargon "where their team already works."
                        summary: 'Users wanted to stay in the conversation, not switch into a tool.',
                        why: 'Every team we talked to had the same pattern: ideas surfaced in Slack threads, then got lost before anyone could act on them. Building a standalone tool meant asking people to change that habit. We didn’t want to compete with the conversation — we wanted to extend it.',
                        myMove: 'I prototyped Slack entry flows and tested first-success behavior in sessions.',
                        changed: 'Faster first success, less setup overhead. Teams could go from idea to canvas without switching contexts.',
                        catch: 'We took on a Slack dependency, so we planned a web fallback for non-Slack users.',
                      },
                      {
                        id: 2,
                        title: 'Property + layers panels',
                        chosen: 'Property and layers panels as the primary precision surface, instead of a prompt-only workflow',
                        // Flag #64 close 2026-05-24: authored "we gave them" move matching §07's "My move" frame. Pulls OG verbatim "think visually" (Leyi + FIGJAM + INTERVIEWS independent surfaces). Breaks "Users wanted X, not Y" family pattern intentionally — Decision 2 is where the authored move enters.
                        summary: 'Users think visually — so we gave them visual controls.',
                        why: 'Users think visually. When we tested prompt-only refinement, most participants said completing the task manually was faster than describing the change they wanted. The team needed a lower learning curve, not new interaction patterns to master.',
                        myMove: 'I mapped the panel architecture — property controls for element-level edits, layers panel for structure — and validated micro-tweak friction against the research.',
                        changed: 'We landed on a hybrid model: prompts for exploration, property and layers panels for precision, clarify-before-execute on high-impact edits.',
                        catch: 'More engineering effort up front, less pure AI flexibility — but the tradeoff gave users control where it mattered.',
                      },
                      {
                        id: 3,
                        title: 'Clarify before executing',
                        chosen: 'Clarification before execution on high-impact edits',
                        // Flag #64 close 2026-05-24: flag-pre-approved calibration line. 7w · user-intent voice · drops UX-research-finding cadence.
                        summary: 'Users wanted Ruby to ask, not assume.',
                        why: 'In sessions, users would pause or undo immediately when Ruby made high-impact changes without checking first. The output was often close, but “close” on a structural edit eroded trust faster than a wrong answer on a low-stakes one. Output drift was the real problem.',
                        myMove: 'I authored guardrail behaviors and prototyped clarify moments to reduce undo loops.',
                        changed: 'Fewer undo loops on high-impact changes. Ruby asks before acting, so output stays closer to intent.',
                        catch: 'Slightly slower interaction — but clarification is optional for confident users.',
                      },
                    ] as const).map((d, i, arr) => {
                      const isOpen = decisionsOpen === d.id;
                      const isLast = i === arr.length - 1;
                      return (
                        <div
                          key={d.id}
                          style={{
                            borderTop: withinSectionBorder(),
                            borderBottom: isLast ? withinSectionBorder() : 'none',
                          }}
                        >
                          {/* Collapsed row — clickable toggle */}
                          <button
                            type="button"
                            onClick={() => setDecisionsOpen(isOpen ? null : d.id)}
                            aria-expanded={isOpen}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              background: 'transparent',
                              border: 'none',
                              padding: `${s03RowPadding}px 0`,
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 16,
                              cursor: 'pointer',
                              fontFamily: 'inherit',
                              color: 'inherit',
                            }}
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 4, flexWrap: 'wrap' }}>
                                {/* Eyebrow register (Cycle 3) — row ordinal anchor / meta-data layer label. Toggle: off (native) | numeric. */}
                                {s07RowId === 'numeric' && (
                                  <span style={{ ...CAPS, flexShrink: 0 }}>{String(d.id).padStart(2, '0')}</span>
                                )}
                                {/* Cycle 11 close 2026-05-16 — Decision title demoted from ISe 22 to CAPS_15 (default sub-section title) per ISe 22 scarcity discipline. Decisions are 3 per case study, repeating series — not noteworthy hard-hitting earned moments. ISe 22 reserved for personas, §06 Ruby's Journey sub-section titles, §10 takeaway titles. */}
                                <span style={{ ...CAPS_15 }}>
                                  {d.title}
                                </span>
                              </div>
                              {/* Chosen direction — Body 15 main-flow text-body (Cycle 2 default). 12 marginBottom = Cat 2 Tight (topic+answer cluster) per Cycle 6 lock — separates chosen from summary as topic→answer pair. */}
                              <p style={{ ...BODY, marginBottom: 12 }}>{d.chosen}</p>
                              {!isOpen && (
                                /* W1 reopen close 2026-05-13 — Summary (collapsed only) at --dir-text-body-soft (sanctioned body-soft register, Cycle 9 W1 reopen). Color carries register differentiation; the 12px Cat 2 Tight gap above gives the summary breathing room as the supporting line. */
                                <p style={{ ...BODY, color: 'var(--dir-text-body-soft)' }}>{d.summary}</p>
                              )}
                            </div>
                            {/* Chevron */}
                            <span
                              aria-hidden="true"
                              style={{ flexShrink: 0, color: 'var(--dir-detail)', display: 'inline-flex', alignItems: 'center', paddingTop: 6 }}
                            >
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 14 14"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 200ms ease' }}
                              >
                                <path d="M3 5L7 9L11 5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </span>
                          </button>
                          {/* Expanded depth — locked order: Why → My move + What it changed → optional catch. */}
                          {isOpen && (
                            <div style={{ paddingBottom: 24 }}>
                              <div style={{ marginBottom: 24 }}>
                                <p style={{ ...CAPS, marginBottom: EYEBROW_CHUNK_GAP_VALUES[eyebrowChunkGap] }}>Why</p>
                                {/* Cycle 2 — Why body: Body 15 main-flow paragraph (the row's dominant body register; sets the cascade for decision title at ISe 22). */}
                                <p style={{ ...BODY }}>{d.why}</p>
                              </div>
                              {/* Earns Dense 13: 1fr 1fr Move/Changed sub-grid (Cycle 2 structural descriptor — "compressed-container only — cards / sub-grids / 1fr 1fr layouts"). The only compressed context inside the expanded depth; Why above is full-width main-flow (Body 15) and catch below is Subordinate aside (IS 15 italic). */}
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: d.catch ? 24 : 0 }}>
                                <div>
                                  <p style={{ ...CAPS, marginBottom: EYEBROW_CHUNK_GAP_VALUES[eyebrowChunkGap] }}>My move</p>
                                  <p style={{ ...DENSE }}>{d.myMove}</p>
                                </div>
                                <div>
                                  <p style={{ ...CAPS, marginBottom: EYEBROW_CHUNK_GAP_VALUES[eyebrowChunkGap] }}>What it changed</p>
                                  <p style={{ ...DENSE }}>{d.changed}</p>
                                </div>
                              </div>
                              {d.catch && (
                                /* Cycle 4 — Subordinate aside register: IS 15/400 italic / text-secondary / lh 1.5. CSML §07 lines 141–150: catch unlabeled, secondary note, quieter than three main expanded elements. Sized to match Why body (Body 15 main-flow); quietness carried by italic + text-secondary, not by smaller size. */
                                <p style={{ fontFamily: IS, fontSize: 15, fontWeight: 400, fontStyle: 'italic', lineHeight: 1.5, color: 'var(--dir-text-body-soft)', margin: 0 }}>{d.catch}</p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                {sectionDividerEl(false)}
                </section>

                {/* §08 — Trade-offs
                    Module-by-module rebuild 2026-05-24 per layered base read (lab TradeoffsFinal.tsx Ion implementation block · CSML §08 Tier 1 spec · operating manual scarcity discipline). Resolves flag #52 (§08 row pattern off-CSML-spec — architectural rebuild).

                    Architectural changes vs prior shell:
                    - DROPPED 3-element row pattern (context DENSE/dir-detail + cut IS 11/UC + consequence DENSE in 1fr 1fr grid) per CSML §08 lines 95-118 which explicitly forbid sub-line patterns ("trade-off row = one strong title + one compact body paragraph"). The 3-element pattern was deprecated pre-lock spec.
                    - DROPPED IS 11/UC/text-primary inline "cut label" register (off-locked-system — IS 11/UC isn't sanctioned for title role; Cycle 11 CAPS family is 10/13/15).
                    - DROPPED DENSE/--dir-detail context line (META_VALUE anti-drift violation per Type §H + W1 §H — dir-detail is annotation-accent role NOT text).
                    - DROPPED 1fr 1fr structural grid (row content doesn't earn split structure per CSML spec).
                    - ADDED outer raised-surface wrapper per CSML §08 Tier 1 spec (line 49 + line 244 "Tier 1 may use one outer surface — flagship complexity"). Matches lab TradeoffsFinal.tsx Ion implementation block lines 322-343. Token treatment: --dir-raised + 1px --dir-border + locked borderRadius + 24px padding (same family as §04 Venn + §05 Funnel + §06 Closer artifact wrappers per F1 Panel 04/06, here applied to content per CSML §08 Tier 1 sanction).
                    - CAPS_13 row titles per Cycle 11 scarcity discipline (§08 = 3-row repeating series, same scarcity logic as §07 demotion from ISe 22 → CAPS_15; CAPS_13 earns inside outer-surface compressed context per Cycle 11 "compressed-context sub-divider" sanction). Row title content = lab narrative-pressure framing (more editorial than action labels).
                    - Inset summary strip inside outer surface — --dir-recessed bg (lighter inset within --dir-raised outer) + locked borderRadius + 16px padding. Body 15 / text-primary. Container-earned primary composition still earned via the inset card-shape (Cycle 9 widened lock applies). The outer surface = section beat; inset summary = compression layer per CSML §08 line 198-201.
                    - ISe 32 section heading STAYS OUTSIDE outer surface — shell-consistent placement across §01-§10 (section heading always at top of section in plain text-column). */}
                <section id="s08" style={secWrap('s08', false)}>
                <div style={twStyle}>
                  {SHPair('08', 'Trade-offs')}
                  <p style={{ fontFamily: ISe, fontSize: 32, fontWeight: 400, lineHeight: 1.18, letterSpacing: '-0.025em', color: 'var(--dir-text-primary)', margin: 0, marginBottom: 24 }}>
                    We cut scope to protect the core bet.
                  </p>
                  {/* Outer surface — Tier 1 contained beat */}
                  <div style={{
                    padding: 24,
                    backgroundColor: 'var(--dir-raised)',
                    border: '1px solid var(--dir-border)',
                    borderRadius,
                  }}>
                    {([
                      { title: 'Complexity was starting to multiply', body: 'Variations, branching, and multiple editing modes already had to feel intuitive together. AI Version History would have introduced even more edge cases, so we cut it.' },
                      { title: 'The product needed to feel coherent across surfaces', body: 'Slack, workspace, and Canvas had to feel like one product. Prompt New Page made sense in Slack, where ideas start, but not in Canvas. So we moved it.' },
                      { title: 'Time pressure forced sharper prioritization', body: 'The PRD kept moving while engineering bandwidth stayed tight. Site Checker was promising, but it was starting to creep. We cut it to protect the core bet.' },
                    ] as const).map((row, i) => (
                      <div key={i} style={{
                        marginTop: i === 0 ? 0 : 16,
                        paddingTop: i === 0 ? 0 : 16,
                        borderTop: i === 0 ? 'none' : '1px solid var(--dir-border)',
                      }}>
                        {/* CAPS_13 title (Cycle 11 compressed-context sub-divider, earned by outer-surface containment) + 4 Cat 3 Micro tight pair to body. Title at default CAPS color (--dir-text-secondary) per CAPS family discipline. */}
                        <p style={{ ...CAPS_13, margin: 0, marginBottom: 4 }}>{row.title}</p>
                        <p style={{ ...BODY, margin: 0 }}>{row.body}</p>
                      </div>
                    ))}
                    {/* Closing summary — Body 15 / text-primary with borderTop separator, NO nested container. Per CSML §08 line 222-223 explicit dead branch ("Nested-card default — Outer card plus inner cards creates unnecessary containment"); prior inset --dir-recessed card violated this. The "stronger summary strip" mandate (CSML §08 line 129 + line 198-201) is delivered by: (1) Body 15 / text-primary register (conclusive feel — matches the row body register but anchors via position + separator, not via nested chrome); (2) borderTop hairline + paddingTop = "stronger separation" at Tier 1; (3) Container-earned primary composition still applies — the OUTER surface IS the container delivering the elevation; no second container needed. Cross-pattern note: §03 pattern close / §04 stakes / §06 closer Evidence use Subordinate aside (italic + body-soft) for REFLECTIVE synthesis; §08 summary is CONCLUSIVE declaration of cuts — different role, different register. */}
                    <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--dir-border)' }}>
                      <p style={{ ...BODY }}>
                        We cut AI Version History, repurposed Prompt New Page, and cut Site Checker to ship the Slack-first pivot on time.
                      </p>
                    </div>
                  </div>
                </div>
                {sectionDividerEl(false)}
                </section>

                {/* §09 — Outcomes (Mode A native + Mode B variant via GateAIonOutcomesModeContext toggle)
                    Interim CSML conformance pass 2026-05-08. Both modes per `docs/locked/case-study-modules/09-outcomes-and-scoreboards.md`. Mode A = Outcome Spine (default reusable); Mode B = Narrative Ledger / state-grouped (CSML line 165: likely Ion implementation pick). Toggle in LabShell §09 chrome — default mode-a per `feedback_native_first_then_variants`. Cascade flag #37 sanctions Mode A block labels at IS 10/UC. Mode B item rows use sub-section register (ISe 22 + Body 15) per flag #43 — compressed register not earned by stacked structure (cascade requires sub-grid / 1fr 1fr / card). */}
                <section id="s09" style={secWrap('s09', false)}>
                {outcomesMode === 'mode-a' ? (
                <>
                  <div style={twStyle}>
                    {SHPair('09', 'Outcomes')}
                    {/* TIER 1 — Outcome headline (Cycle 1 surgical: ISe 32). marginBottom 16 → 24 (Cycle 6 title→body Category 1 lock 2026-05-10) — earlier "head + framing tight pair" sub-category collapsed because 8px difference vs default 24 was perceptually marginal and read as drift, not editorial pairing. Framing line below is now treated as first body paragraph of §09 (consistent with §02/§04/§05/§06/§10 section opening pattern). */}
                    <p style={{ fontFamily: ISe, fontSize: 32, fontWeight: 400, lineHeight: 1.18, letterSpacing: '-0.025em', color: 'var(--dir-text-primary)', margin: 0, marginBottom: 24 }}>
                      Slack-first entry shipped and validated as the primary creative starting point.
                    </p>
                    {/* Framing / first-body paragraph (Cycle 2 Body). CSML §09 line 38–39: explains the mix of shipped/validated/enabled/in-progress. */}
                    <p style={{ ...BODY, marginBottom: 24 }}>
                      Core entry and exploration shipped. Trust guardrails prototyped. Design system adopted team-wide. Key features still in development.
                    </p>
                    {/* TIER 3 — Primary outcome (CSML §09 line 64–67: most real, most externally true; "feel clearly primary"). Raised-bg container provides the structural "primary" earning per cascade card-shape condition. Type-axis stays at Body 15 (matches framing line voice — same voice stating what's true, container does the lifting). Not "extra container styling noise" per CSML line 198 — this IS the certainty-ladder anchor. */}
                    <div style={{ marginBottom: 24, padding: '16px', backgroundColor: 'var(--dir-raised)', borderRadius }}>
                      <p style={{ ...CAPS_15, marginBottom: EYEBROW_CHUNK_GAP_VALUES[eyebrowChunkGap] }}>Primary Outcome (Shipped)</p>
                      {/* Cycle 7 Q2 ✅ LOCKED 2026-05-12 (flag #28 resolved) · Cycle 9 lock widening 2026-05-12. Primary outcome statement = Body 15 / text-primary in raised-bg container. Path A chosen: container alone earns "primary" via cascade card-shape condition; type-axis stays at Body 15 to (a) avoid competing with T1 headline at ISe 32 above, (b) preserve same-voice continuity with T2 framing line, (c) avoid pulling Pull quote register (Cycle 4 scoped) into §09. The "feel clearly primary" CSML mandate (§09 line 65-67) is delivered by the structural anchor + CAPS eyebrow label + position, not by a new type-axis register. **Cycle 9 widening:** this pattern is now the general **container-earned primary composition** lock (see `case-study-modules/11-cross-module-rules.md` Container-earned primary composition section), also sanctioning §08 closing takeaway use under the same composition principle. */}
                      <p style={{ ...BODY }}>
                        Slack entry → Early Canvas exploration with branching and compare. Users start in the tool they already live in; ideas reach a canvas without switching contexts.
                      </p>
                    </div>
                  </div>
                  {/* Primary outcome visual anchor — BeforeAfterSlider (§09 first sanctioned interaction custom 2026-05-24).
                      Replaces prior required-future-asset placeholder. Slider compares OLD designer workflow (tools split: design + chat in separate windows, context lost on every handoff) vs NEW Ion workflow (Workspace + chat unified). Color-block placeholders for now (--dir-recessed BEFORE / --dir-raised AFTER); when real workspace+chat screenshots land, swap descriptor props for image-URL props (component extension TBD).
                      Outside twStyle via IonFinalImage so the slider escapes text-column to body-image width.
                      Per Cycle 7 Q4 system principle (interactions sanctioned per-module): this slider IS §09's first sanctioned interaction custom — needs CSML §09 + cross-system-rules customs section lock note (deferred to §09 close pass per task 20).
                      Per Media §3: user-controlled drag only, no autoplay / hover-driven movement / sound. */}
                  <IonFinalImage fallbackStyle={{}} twStyle={twStyle}>
                    <div style={{ marginBottom: 24 }}>
                      <BeforeAfterSlider borderRadius={borderRadius} />
                    </div>
                  </IonFinalImage>
                  <div style={twStyle}>
                    {/* TIER 4 — Validation signals (CSML §09 line 70–90: short signal → implication pairs, "directly beneath the primary block" per line 195, "one support layer, scan quickly, NOT a mini ledger" per line 84–88). Inline pair pattern (signal + arrow + implication on one line, no row borders, no sub-grid) — does NOT earn Dense 13 per Cycle 2 (no compressed container present). Body 15 main-flow at scan-tier spacing. */}
                    <p style={{ ...CAPS_15, marginBottom: EYEBROW_CHUNK_GAP_VALUES[eyebrowChunkGap] }}>Validation Signals</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {([
                        { signal: '"If it’s not in Slack, my team won’t use it."', outcome: 'Justified Slack-first entry as the right starting point.' },
                        { signal: 'Side-by-side comparison feedback in sessions', outcome: 'Supported the branching and canvas exploration decision.' },
                        { signal: 'Clarify-before-execute testing results', outcome: 'Supported trust guardrail adoption across the team.' },
                      ] as const).map((v, vi) => (
                        <p key={vi} style={{ ...BODY }}>
                          {v.signal}
                          <span style={{ color: 'var(--dir-detail)', margin: '0 8px' }}>&rarr;</span>
                          {v.outcome}
                        </p>
                      ))}
                    </div>
                    {/* TIER 5 — Lower supporting row (CSML §09 line 92–101). Section gap dynamic per sub-section gap toggle (Native 32 / Reflection 48 / Wide 64). */}
                    <div style={{ marginTop: s03SubSectionGap, paddingTop: s03RowPadding, borderTop: withinSectionBorder() }}>
                      {/* Earns Dense 13: 1fr 1fr sibling sub-grid (Cycle 2 structural descriptor — "compressed-container only — cards / sub-grids / 1fr 1fr layouts"). CSML's "clearly secondary" tier framing reinforces compressed register as the right read here. */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                        <div>
                          {/* CAPS_13 pairs with DENSE 13 body per Cycle 11 CAPS-body pairing rule (compressed 1fr 1fr cell). */}
                          <p style={{ ...CAPS_13, marginBottom: EYEBROW_CHUNK_GAP_VALUES[eyebrowChunkGap] }}>Team-Wide Leverage</p>
                          <p style={{ ...DENSE }}>Design system adopted across 6 designers — 22+ components, 84 icons, shared templates. Less drift, faster reuse.</p>
                        </div>
                        <div>
                          <p style={{ ...CAPS_13, marginBottom: EYEBROW_CHUNK_GAP_VALUES[eyebrowChunkGap] }}>Defined &amp; In Development</p>
                          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {[
                              'Trust guardrails (prototyped, not yet shipped)',
                              'Cross-variant editing (multi-select + source connections)',
                              'Workspace refinement (panels + optional voice)',
                            ].map((item) => (
                              <li key={item} style={{ ...DENSE }}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                    {/* TIER 6 — What still needs measurement.
                        Cycle 7 Q3 ✅ LOCKED 2026-05-12 (Path B). Two locks here:

                        (1) §09 future-layer-last POSITION RULE — per CSML §09 lines 103-110 + 203-213, the measurement block is always LAST in §09 (both Mode A + Mode B). The locked hierarchy is: Intro family → Primary proof → Support layer → Secondary layer → Future layer. Order reads strongest-present-truth → weakest-or-future-truth. Position rule is structural — moving measurement higher would lie about certainty (implying "still needs measurement" is peer to "shipped").

                        (2) §09 future-layer FOOTER COMPOSITION — sanctioned canonical treatment combining: (a) last position in module, (b) `var(--dir-recessed)` background (quieter than raised-bg / plain-bg, signals lower certainty via color tier), (c) `var(--dir-border)`-radius padded card-shape (earns compressed register per cascade card-shape condition / flag #43), (d) 1fr 1fr metadata sub-grid (earns Dense 13 per cascade horizontal-pressure condition), (e) CAPS eyebrow + mini-title gap = the structural label "What Still Needs Measurement." This combo IS the locked "future-layer footer" composition; not a single register but a sanctioned composition pattern per CSML §09 line 197 mandate.

                        Plus Cycle 6 Q5: marginTop 48 (Section in Standard) per Q1 density mode lock. */}
                    <div style={{ marginTop: 48, paddingTop: 16, paddingBottom: 16, paddingLeft: 16, paddingRight: 16, backgroundColor: 'var(--dir-recessed)', borderRadius }}>
                      {/* CAPS_13 pairs with DENSE 13 body per Cycle 11 CAPS-body pairing rule (compressed 1fr 1fr metadata sub-grid in recessed-bg footer). */}
                      <p style={{ ...CAPS_13, marginBottom: EYEBROW_CHUNK_GAP_VALUES[eyebrowChunkGap] }}>What Still Needs Measurement</p>
                      {/* Earns Dense 13: 1fr 1fr metadata sub-grid (Cycle 2 structural descriptor) + footer-layer metadata semantic (short measurement items, scan-tier reading). */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        {[
                          'Time from Slack message to first iteration',
                          'Canvas open rate from Slack vs direct',
                          'Ruby clarification acceptance rate',
                          'User satisfaction with output quality',
                        ].map((m) => (
                          <p key={m} style={{ ...DENSE, margin: 0 }}>{m}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
                ) : (
                <>
                  {/* MODE B — Narrative Ledger / State-Grouped (CSML §09 line 112–139). Authored narrative top + 3 state groups + measurement footer. Lab pattern: B2APolished. Item rows use ISe 22 + Body 15 (sub-section register) per flag #43 resolution (path a) — stacked structure doesn't earn compressed register under cascade conditions. */}
                  <div style={twStyle}>
                    {SHPair('09', 'Outcomes')}
                    {/* Narrative top — outcome headline (more authored than Mode A's structural headline per CSML line 117–121). marginBottom 16 → 24 (Cycle 6 title→body Category 1 lock 2026-05-10) — head+framing tight-pair sub-category collapsed; framing line below is treated as first body paragraph. */}
                    <p style={{ fontFamily: ISe, fontSize: 32, fontWeight: 400, lineHeight: 1.18, letterSpacing: '-0.025em', color: 'var(--dir-text-primary)', margin: 0, marginBottom: 24 }}>
                      The Slack-first bet shipped. The rest is honest about where it stands.
                    </p>
                    {/* Framing / first-body paragraph (Cycle 2 Body) — establishes state-grouped framing per CSML line 153. */}
                    <p style={{ ...BODY, marginBottom: 24 }}>
                      Core entry shipped. Trust guardrails prototyped. Design system adopted team-wide. What follows is grouped by state.
                    </p>
                  </div>
                  {/* Narrative anchor visual — BeforeAfterSlider (same artifact as Mode A T3; Mode B pairs it with the narrative top rather than the primary outcome block). §09 first sanctioned interaction custom 2026-05-24. */}
                  <IonFinalImage fallbackStyle={{}} twStyle={twStyle}>
                    <div style={{ marginBottom: 24 }}>
                      <BeforeAfterSlider borderRadius={borderRadius} />
                    </div>
                  </IonFinalImage>
                  <div style={twStyle}>
                    {/* State groups: Shipped → Prototyped & Enabled → In Development. Position carries the certainty ladder per CSML line 136. Color (raised bg on Shipped only) supports without doing the main work per line 137. */}
                    {([
                      {
                        label: 'Shipped',
                        bg: 'var(--dir-raised)',
                        rows: [
                          { claim: 'Slack-first entry', detail: 'Adopted as the primary starting point. Users stay in context.' },
                          { claim: 'Canvas branching + compare', detail: 'Side-by-side exploration shipped. Confirmed as essential for decision-making.' },
                        ],
                      },
                      {
                        label: 'Prototyped & Enabled',
                        bg: null,
                        rows: [
                          { claim: 'Trust guardrails', detail: 'Clarify-before-execute defined and prototyped. Reduced undo loops in testing.' },
                          { claim: 'Design system at scale', detail: '22+ components, 84 icons, shared templates across 6 designers.' },
                        ],
                      },
                      {
                        label: 'In Development',
                        bg: null,
                        rows: [
                          { claim: 'Cross-variant editing', detail: 'Multi-select, source connections, chat summary. Scoped and active.' },
                          { claim: 'Workspace refinement', detail: 'Contextual panels and optional voice. In progress.' },
                        ],
                      },
                    ] as const).map((group, gi) => {
                      const isAnchor = group.bg !== null;
                      return (
                        <div
                          key={group.label}
                          style={
                            isAnchor
                              ? { marginBottom: 24, padding: 16, backgroundColor: group.bg as string, borderRadius }
                              : { marginBottom: 24, paddingTop: 16, borderTop: withinSectionBorder() }
                          }
                        >
                          {/* State-group eyebrow gap — Type 3 (mini-title → structured chunk). Routes through Mini-title gap toggle (locked compact = 12 per 2026-05-09 system split). Type 1 §# section identifier gap stays separate (locked tight = 4). */}
                          <p style={{ ...CAPS, marginBottom: EYEBROW_CHUNK_GAP_VALUES[eyebrowChunkGap] }}>{group.label}</p>
                          {group.rows.map((r, ri) => (
                            <div
                              key={r.claim}
                              style={{
                                paddingTop: ri > 0 ? 12 : 0,
                                paddingBottom: ri < group.rows.length - 1 ? 12 : 0,
                                borderTop: ri > 0 ? withinSectionBorder() : 'none',
                              }}
                            >
                              {/* Cycle 11 close 2026-05-16: Mode B item title demoted from ISe 22 to CAPS_15 (default sub-section title) per scarcity discipline — outcome items are repeating-series content, not noteworthy hard-hitting earned moments. Flag #43 ISe 22 sanction superseded by Cycle 11 ISe 22 earning rule (content-vs-marker + scarcity). */}
                              <p style={{ ...CAPS_15, marginBottom: 4 }}>
                                {r.claim}
                              </p>
                              {/* Mode B item description — Body 15 per flag #43 resolution (path a); matches §07 decision row body register. */}
                              <p style={{ ...BODY, margin: 0 }}>{r.detail}</p>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                    {/* Measurement footer — Mode B variant of §09 future-layer-last position rule (Cycle 7 Q3 LOCKED 2026-05-12 — same as Mode A T6 above). Same canonical composition: last position + recessed-bg + Dense 13 + 1fr 1fr + CAPS eyebrow. CSML §09 line 110 — "this rule is locked" applies to both modes. */}
                    <div style={{ marginTop: 8, paddingTop: 16, paddingBottom: 16, paddingLeft: 16, paddingRight: 16, backgroundColor: 'var(--dir-recessed)', borderRadius }}>
                      {/* CAPS_13 pairs with DENSE 13 body per Cycle 11 CAPS-body pairing rule (Mode B measurement footer — compressed 1fr 1fr sub-grid). */}
                      <p style={{ ...CAPS_13, marginBottom: EYEBROW_CHUNK_GAP_VALUES[eyebrowChunkGap] }}>What Still Needs Measurement</p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        {[
                          'Time from Slack message to first iteration',
                          'Canvas open rate from Slack vs direct',
                          'Ruby clarification acceptance rate',
                          'User satisfaction with output quality',
                        ].map((m) => (
                          <p key={m} style={{ ...DENSE, margin: 0 }}>{m}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
                )}
                  {sectionDividerEl(false)}
                </section>

                {/* §10 — Reflection
                    Module-by-module rebuild 2026-05-24 — resolves flag #55 + adds CSML §10 line 191 sanctioned optional flagship closer.

                    Fix 1 (flag #55 placeholder resolution): Section heading replaced from literal "Placeholder" with OG verbatim "What changed how I build." Per CSML §10 top block lines 32-44: opening should establish closing-synthesis mode, calm + authored + structured, lighter than modules before but still tied to real project decisions. OG headline nails it — declarative, signals reflection without re-explaining the case study.

                    Fix 2 (sanctioned optional closer): Added subordinate "What I'd do differently" closer per CSML §10 line 184-194 Ion implementation rule + line 103-114 ("small secondary closer beneath the 3-part core ... clearly subordinate ... not a fourth equal block"). Content verbatim from OG outline-source:428. Register: Subordinate aside (IS 15 italic / 400 / LH 1.5 / --dir-text-body-soft) with inline "What I'd do differently:" leading label — matches cross-section closing-synthesis register family (§03 pattern close, §04 stakes, §06 closer Evidence + tie-back caption). marginTop 24 (Block) + paddingTop 16 + borderTop withinSectionBorder() creates "subordinate-secondary" position per CSML §10 line 205 "optional secondary closer must sit visibly below and after the main reflection structure."

                    D1 decision: block labels stay at CAPS_15 — Core Tension / Tradeoff Made / Takeaway are STRUCTURAL FRAMEWORK categories (recur across every CSML flagship reflection), not unique content claims. Per Type §D content-vs-marker rule, framework labels = CAPS family. Hybrid (only Takeaway at ISe 22) would break peer-equal hierarchy in CSML §10 flagship structure where all 3 blocks are equal peers (line 184-194).

                    Block content unchanged — already strong + OG-aligned (Tradeoff body literally captures OG "Killing My Darling" beat: "We cut AI Version History — the feature I championed hardest"). */}
                <section id="s10" style={secWrap('s10', true)}>
                <div style={twStyle}>
                  {SHPair('10', 'Reflection')}
                  <p style={{ fontFamily: ISe, fontSize: 32, fontWeight: 400, lineHeight: 1.18, letterSpacing: '-0.025em', color: 'var(--dir-text-primary)', margin: 0, marginBottom: 24 }}>
                    What changed how I build.
                  </p>
                  <div style={{ borderTop: withinSectionBorder() }}>
                    {([
                      {
                        label: 'Core Tension',
                        text: 'Build more features to compete with established tools, or reposition around how teams actually start work. The instinct was capability. The research said positioning.',
                      },
                      {
                        label: 'Tradeoff Made',
                        text: 'We cut AI Version History — the feature I championed hardest — and bet on Slack-first entry instead. The product got simpler. The team got faster. The positioning became sharper.',
                      },
                      {
                        label: 'Takeaway',
                        text: 'The best product decisions sometimes feel like losses in the moment. Killing the thing you believe in, because the evidence says something else matters more, is the hardest and most useful skill to practice.',
                      },
                    ] as const).map((block, bi) => (
                      <div key={block.label} style={{ paddingTop: s03RowPadding, paddingBottom: s03RowPadding, borderBottom: bi < 2 ? withinSectionBorder() : 'none' }}>
                        {/* §10 block eyebrow — CAPS_15 per D1 (framework category labels, not content claims). Cycle 8 §10 audit 2026-05-12 converted inline IS 10/UC → CAPS const for system consistency; Cycle 11 close upgraded to CAPS_15 (the larger CAPS family member from sub-section divider family). display: block required for span vertical margins. */}
                        <span style={{ ...CAPS_15, display: 'block', marginBottom: EYEBROW_CHUNK_GAP_VALUES[eyebrowChunkGap] }}>{block.label}</span>
                        {/* Cycle 2 — Body bucket: reflection block body = Body 15/400 main-flow (NOT Dense Body — locked Dense is for cards/sub-grids/1fr 1fr per cascade earning). */}
                        <p style={{ ...BODY }}>{block.text}</p>
                      </div>
                    ))}
                  </div>
                  {/* Optional flagship closer — "What I'd do differently" per CSML §10 line 184-194 Ion implementation rule + line 103-114 sanctioned subordinate-secondary pattern. Subordinate aside register (IS 15 italic / --dir-text-body-soft) matches cross-section closing-synthesis register family. Inline label "What I'd do differently:" leads the prose per §03 pattern-close + §04 stakes pattern ("The pattern: ..." / "The stakes: ..."). paddingTop + borderTop create the "visibly below and after the main reflection" separation per CSML §10 line 205. */}
                  <p style={{ fontFamily: IS, fontSize: 15, fontWeight: 400, fontStyle: 'italic', lineHeight: 1.5, color: 'var(--dir-text-body-soft)', margin: 0, marginTop: 24, paddingTop: 16, borderTop: withinSectionBorder() }}>
                    What I'd do differently: Start prototyping earlier during research. We spent time on documentation that could have been validated faster with rough prototypes. The fidelity wasn't the issue. The feedback loops were too long.
                  </p>
                </div>
                </section>

              </>
          </>

          {/* Previous / Next */}
          <div
            style={{
              paddingTop: 64,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid var(--dir-border)',
              gridColumn: gridColT,
            }}
          >
            {['← Previous project', 'Next project →'].map(label => (
              <a
                key={label}
                href="#"
                style={{
                  fontFamily: IS,
                  fontSize: 11,
                  fontWeight: 500,
                  color: 'var(--dir-text-secondary)',
                  textDecoration: 'none',
                  transition: 'color 150ms ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--dir-text-primary)')}
                onMouseLeave={e =>
                  (e.currentTarget.style.color = 'var(--dir-text-secondary)')
                }
              >
                {label}
              </a>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
