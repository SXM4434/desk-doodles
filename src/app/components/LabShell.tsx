import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router';
import { IS } from './cards/tokens';
import { useCta, type CtaMode } from '../state/CtaContext';
import { useMediaTruth, type MediaTruth } from '../state/MediaTruthContext';
import { useLane, type Lane } from '../state/LaneContext';
import { useTagStyle, type TagStyle } from '../state/TagStyleContext';
import {
  useMargin,
  MARGIN_RAMP,
  MARGIN_VALUES,
  CENTERED_MAX_WIDTH,
  marginTokenLabel,
  type MarginState,
  type MarginToken,
} from '../state/MarginContext';
import { candidates, findCandidate, type Tier } from './layouts/candidates';
import {
  surfaceCandidates,
  findSurfaceCandidate,
  type SurfaceTier,
} from './surfaces/candidates';
import { Dropdown, type DropdownSection } from './Dropdown';
import {
  NARROWED_LAYOUT_IDS,
  NARROWED_LAYOUT_SET,
} from './narrow1/narrowedLayouts';
import {
  NARROWED_SURFACE_IDS,
  NARROWED_SURFACE_SET,
} from './narrow1/narrowedSurfaces';
import {
  NARROW2_LAYOUT_IDS,
  NARROW2_LAYOUT_SET,
} from './narrow2/narrowedLayouts';
import {
  FAMILY_IDS as N3_FAMILY_IDS,
  VERSION_IDS as N3_VERSION_IDS,
  FAMILIES as N3_FAMILIES,
  VERSIONS as N3_VERSIONS,
  isFamilyId as isN3FamilyId,
  isVersionId as isN3VersionId,
  type FamilyId as N3FamilyId,
  type VersionId as N3VersionId,
} from './narrow3/narrowedFamilies';
import { useCardFrame, type CardFrameState } from '../state/CardFrameContext';
import { useDivider, type DividerState } from '../state/DividerContext';
import { useTitleRegister, type TitleRegisterState } from '../state/TitleRegisterContext';
import { useImageTreatment, type ImageTreatmentState } from '../state/ImageTreatmentContext';
import { useCaptionRegister, type CaptionRegisterState } from '../state/CaptionRegisterContext';
import { useShippedProof, type ShippedProofState } from '../state/ShippedProofContext';
import { useProofPlacement, type ProofPlacementState } from '../state/ProofPlacementContext';
import { useAspectVariance, type AspectVarianceState } from '../state/AspectVarianceContext';
import { useDensity, type DensityState } from '../state/DensityContext';
import { useCardScale, type CardScaleMode } from '../state/CardScaleContext';
import { useShellPicker, type ShellPickerMode, type ShellId } from '../state/ShellPickerContext';
import { FEATURED_SHELL_IDS, STANDARD_SHELL_IDS } from './shells/shellRenderers';
import { usePreset, type PresetId } from '../state/PresetContext';
import { useLabChrome } from '../state/LabChromeContext';
import { useNarrow4FeaturedAspectVariance } from '../state/Narrow4FeaturedAspectVarianceContext';
import { useNarrow4StandardAspectVariance } from '../state/Narrow4StandardAspectVarianceContext';
import { useNarrow4EyebrowPlacement, type EyebrowPlacement } from '../state/Narrow4EyebrowPlacementContext';
import { useNarrow4FeaturedProofMode, type Narrow4FeaturedProofMode } from '../state/Narrow4FeaturedProofModeContext';
import { useDirectionMode, type DirectionMode } from '../state/DirectionModeContext';
import { useMediaFrame, type MediaFrameMode } from '../state/MediaFrameContext';
import { useCardFit, type CardFit } from '../state/CardFitContext';
import { useGateAIonEyebrowStyle, type GateAIonEyebrowStyle } from '../state/GateAIonEyebrowStyleContext';
import { usePullQuoteRegisterTest, type PullQuoteRegisterTest } from '../state/PullQuoteRegisterTestContext';
import { useInlineEmphasisTest, type InlineEmphasisTest } from '../state/InlineEmphasisTestContext';
import { useGateAIonTldrStyle, type GateAIonTldrStyle } from '../state/GateAIonTldrStyleContext';
import { useGateAIonDividerStyle, type GateAIonDividerStyle } from '../state/GateAIonDividerStyleContext';
import { useGateAIonHeroHeight, type GateAIonHeroHeight } from '../state/GateAIonHeroHeightContext';
import { useGateAIonHeroPosition, type GateAIonHeroPosition } from '../state/GateAIonHeroPositionContext';
import { useGateAIonBorderRadius, type GateAIonBorderRadius } from '../state/GateAIonBorderRadiusContext';
import { useGateAIonHeroAspect, type GateAIonHeroAspect } from '../state/GateAIonHeroAspectContext';
import { useGateAIonSectionNumberStyle, type GateAIonSectionNumberStyle } from '../state/GateAIonSectionNumberStyleContext';
import { useGateAIonProgressTrack, type GateAIonProgressTrack } from '../state/GateAIonProgressTrackContext';
import { useGateAIonWithinSectionDivider, type GateAIonWithinSectionDivider } from '../state/GateAIonWithinSectionDividerContext';
import { useGateAIonInternalGap, type GateAIonInternalGapToken } from '../state/GateAIonInternalGapContext';
import { useGateAIonTextColumnWidth, type GateAIonTextColumnWidthToken } from '../state/GateAIonTextColumnWidthContext';
import { useGateAIonContentAlignment, type GateAIonContentAlignmentToken } from '../state/GateAIonContentAlignmentContext';
import { useGateAIonImageWidth, type GateAIonImageWidth } from '../state/GateAIonImageWidthContext';
import { useGateAIonDualContainerEnabled, type GateAIonDualContainerEnabledToken } from '../state/GateAIonDualContainerEnabledContext';
import { useGateAIonDualContainerRatio, type GateAIonDualContainerRatioToken } from '../state/GateAIonDualContainerRatioContext';
import { useGateAIonHeroBleed, type GateAIonHeroBleedToken } from '../state/GateAIonHeroBleedContext';
import { useGateAIonBodyImageWidth, type GateAIonBodyImageWidthToken } from '../state/GateAIonBodyImageWidthContext';
import { useGateAIonFinalImageWidth, type GateAIonFinalImageWidthToken } from '../state/GateAIonFinalImageWidthContext';
import { useGateAIonHookMode, type GateAIonHookMode } from '../state/GateAIonHookModeContext';
import { useGateAIonSection01Position, type GateAIonSection01Position } from '../state/GateAIonSection01PositionContext';
import { useGateAIonPreTocHeroWidth, type GateAIonPreTocHeroWidth } from '../state/GateAIonPreTocHeroWidthContext';
import { useGateAIonEyebrowSpacing, type GateAIonEyebrowSpacing } from '../state/GateAIonEyebrowSpacingContext';
import { useGateAIonSectionNumberSpacing, type GateAIonSectionNumberSpacing } from '../state/GateAIonSectionNumberSpacingContext';
import { useGateAIonEyebrowChunkGap, type GateAIonEyebrowChunkGap } from '../state/GateAIonEyebrowChunkGapContext';
import { useGateAIonHeroDensityMode, type GateAIonHeroDensityMode } from '../state/GateAIonHeroDensityModeContext';
import { useGateAIonS05GuardrailsLayout, type GateAIonS05GuardrailsLayout } from '../state/GateAIonS05GuardrailsLayoutContext';
import { useGateAIonS02ArtifactTreatment, type GateAIonS02ArtifactTreatment } from '../state/GateAIonS02ArtifactTreatmentContext';
import { useGateAIonTldrPosition, type GateAIonTldrPosition } from '../state/GateAIonTldrPositionContext';
import { useGateAIonS01ContributionGrid, type GateAIonS01ContributionGrid } from '../state/GateAIonS01ContributionGridContext';
import { useGateAIonS03Direction, type GateAIonS03Direction } from '../state/GateAIonS03DirectionContext';
import { useGateAIonS03PersonaArtifact, recommendedPersonaArtifactForDirection, type GateAIonS03PersonaArtifact } from '../state/GateAIonS03PersonaArtifactContext';
import { useGateAIonS03PersonaContentDensity, type GateAIonS03PersonaContentDensity } from '../state/GateAIonS03PersonaContentDensityContext';
import { useGateAIonS03SubSectionGap, type GateAIonS03SubSectionGap } from '../state/GateAIonS03SubSectionGapContext';
import { useGateAIonS03NativePersonaLayout, type GateAIonS03NativePersonaLayout } from '../state/GateAIonS03NativePersonaLayoutContext';
import { useGateAIonS03ExtE1ThemesStyle, type GateAIonS03ExtE1ThemesStyle } from '../state/GateAIonS03ExtE1ThemesStyleContext';
import { useGateAIonS03ExtE1LeanDirection, type GateAIonS03ExtE1LeanDirection } from '../state/GateAIonS03ExtE1LeanDirectionContext';
import { PERSONA_ARTIFACT_SECTIONS } from './GateAIonS03PersonaArtifacts';
import { useGateAIonS07RowId, type GateAIonS07RowId } from '../state/GateAIonS07RowIdContext';
import { useGateAIonOutcomesMode, type GateAIonOutcomesMode } from '../state/GateAIonOutcomesModeContext';
import { useGateAIonArtifactPlayground, ARTIFACT_SECTIONS, type ArtifactId } from '../state/GateAIonArtifactPlaygroundContext';
import { useGateAIonS01TldrRegister, type GateAIonS01TldrRegister } from '../state/GateAIonS01TldrRegisterContext';
import { useGateAIonS01MetaStrip, type GateAIonS01MetaStrip } from '../state/GateAIonS01MetaStripContext';
import { useGateAIonMetaStripPosition, type GateAIonMetaStripPosition } from '../state/GateAIonMetaStripPositionContext';
import { SURFACE_ATTRS } from './family/surfaceAttributes';
import { PresetApplier } from './family/PresetApplier';
import type { Family } from './family/types';

// Narrow-2 now renders the 2-family space: 37 layouts × 2 families
// (Cards → t1-s1 baseline · Tiles → t8-s1 baseline).
const FAMILY_IDS = ['cards', 'tiles'] as const;
type FamilyId = (typeof FAMILY_IDS)[number];
const FAMILY_LABEL: Record<FamilyId, string> = {
  cards: 'Cards',
  tiles: 'Tiles',
};

const TIER_OPT_LABEL: Record<Tier, string> = {
  t1: 'T1 · System Aligned',
  t2: 'T2 · Controlled Stretch',
  t3: 'T3 · Middle Zone',
  t4: 'T4 · Max Divergence',
  t5a: 'T5a · Span-Variance Asymmetry',
  t5b: 'T5b · Aspect-Variance Asymmetry',
  t5c: 'T5c · Dual-Axis / Proportion Asymmetry',
};

const SURFACE_TIER_LABEL: Record<SurfaceTier, string> = {
  t1: 'T1 · Locked Baseline',
  t2: 'T2 · Decomposition',
  t3: 'T3 · Identity Reframe',
  t4: 'T4 · Formal Mode Shift',
  t5: 'T5 · Editorial Paired-Column',
  t6: 'T6 · Case Brief / Release',
  t7: 'T7 · Abstract / Experimental',
  t8: 'T8 · Unbounded / Label-Below',
};

type Mode = 'layout' | 'surface' | 'combo' | 'narrow-1' | 'narrow-2' | 'narrow-3' | 'narrow-4' | 'family' | 'gate-a' | 'gate-a-hub' | 'gate-a-ion' | 'artifact-playground';

type LayoutPresetId =
  | 'native'
  | 'bill-guo' | 'emmi-wu' | 'rachel-chen' | 'sebs' | 'substack' | 'linear'
  | 'swiss-grid' | 'magazine-editorial' | 'art-catalog' | 'criterion' | 'broadsheet'
  | 'tufte' | 'longform-web' | 'nature-journal' | 'nasa-report'
  | 'oma-monograph' | 'pathology-slide';

type LayoutPresetConfig = {
  margin: MarginToken;
  gap: GateAIonInternalGapToken;
  textWidth: GateAIonTextColumnWidthToken;
  alignment: GateAIonContentAlignmentToken;
  dual: GateAIonDualContainerEnabledToken;
  ratio: GateAIonDualContainerRatioToken;
  hero: GateAIonHeroBleedToken;
  body: GateAIonBodyImageWidthToken;
  final: GateAIonFinalImageWidthToken;
  imageWidth: GateAIonImageWidth;
  // Optional cascade fields — presets that author them drive the toggle on selection;
  // presets that omit them leave the toggle at its current value (Sebs == native intent).
  eyebrowStyle?: GateAIonEyebrowStyle;
  tldrStyle?: GateAIonTldrStyle;
  sectionNumberStyle?: GateAIonSectionNumberStyle;
  dividerStyle?: GateAIonDividerStyle;
  withinSectionDivider?: GateAIonWithinSectionDivider;
  heroHeight?: GateAIonHeroHeight;
  heroPosition?: GateAIonHeroPosition;
  heroAspect?: GateAIonHeroAspect;
  borderRadius?: GateAIonBorderRadius;
  hookMode?: GateAIonHookMode;
  section01Position?: GateAIonSection01Position;
  preTocHeroWidth?: GateAIonPreTocHeroWidth;
  eyebrowSpacing?: GateAIonEyebrowSpacing;
  sectionNumberSpacing?: GateAIonSectionNumberSpacing;
  tldrPosition?: GateAIonTldrPosition;
  s01ContributionGrid?: GateAIonS01ContributionGrid;
  s01MetaStrip?: GateAIonS01MetaStrip;
  metaStripPosition?: GateAIonMetaStripPosition;
};

//                             margin          gap          textWidth    alignment    dual       ratio           hero              body              final             imageWidth
const LAYOUT_PRESETS: Record<LayoutPresetId, LayoutPresetConfig> = {
  'native':           { margin: 'centered', gap: 'native',    textWidth: 'native',  alignment: 'native', dual: 'native', ratio: 'native',       hero: 'native',        body: 'native',          final: 'native',          imageWidth: 'full' },
  // Portfolio / Web
  'bill-guo':         { margin: 'm2',       gap: 'native',    textWidth: 'xs',      alignment: 'left',   dual: 'on',     ratio: 'narrow-fixed', hero: 'content-area',  body: 'content-area',    final: 'content-area',    imageWidth: 'full' },
  'emmi-wu':          { margin: 'm2',       gap: 'sm',        textWidth: 'wide',    alignment: 'center', dual: 'off',    ratio: 'native',       hero: 'bleed-right',   body: 'text-column',     final: 'text-column',     imageWidth: 'full' },
  'rachel-chen':      { margin: 'm2',       gap: 'sm',        textWidth: '2xl',     alignment: 'center', dual: 'off',    ratio: 'native',       hero: 'text-column',   body: 'text-column',     final: 'text-column',     imageWidth: 'full' },
  'sebs':             { margin: 'm2',       gap: 'sm',        textWidth: '3xl',     alignment: 'center', dual: 'off',    ratio: 'native',       hero: 'text-column',   body: 'text-column',     final: 'text-column',     imageWidth: 'full',
                        eyebrowStyle: 'dot', tldrStyle: 'left-border', sectionNumberStyle: 'hidden', dividerStyle: 'border', withinSectionDivider: 'none',
                        heroHeight: 'natural', heroPosition: 'top', heroAspect: 'native', borderRadius: 2, hookMode: 'default',
                        section01Position: 'post-hero', preTocHeroWidth: 'contained', eyebrowSpacing: 'snug', sectionNumberSpacing: 'tight',
                        tldrPosition: 'after-hero', s01ContributionGrid: 'native', s01MetaStrip: 'native', metaStripPosition: 'native' },
  'substack':         { margin: 'centered', gap: 'lg',        textWidth: '2xl',     alignment: 'center', dual: 'off',    ratio: 'native',       hero: 'content-area',  body: 'content-area',    final: 'content-area',    imageWidth: 'full' },
  'linear':           { margin: 'centered', gap: 'xs',        textWidth: 'md',      alignment: 'left',   dual: 'off',    ratio: 'native',       hero: 'content-area',  body: 'content-area',    final: 'content-area',    imageWidth: 'full' },
  // Editorial / Print
  'swiss-grid':       { margin: 'centered', gap: 'native',    textWidth: 'sm',      alignment: 'left',   dual: 'off',    ratio: 'native',       hero: 'content-area',  body: 'content-area',    final: 'content-area',    imageWidth: 'full' },
  'magazine-editorial':{ margin: 'm3',      gap: 'xxl',       textWidth: 'md',      alignment: 'center', dual: 'off',    ratio: 'native',       hero: 'full-viewport', body: 'partial-bleed',   final: 'near-bleed',      imageWidth: 'full' },
  'art-catalog':      { margin: 'centered', gap: 'xl',        textWidth: 'lg',      alignment: 'center', dual: 'off',    ratio: 'native',       hero: 'bleed-right',   body: 'bleed-right',     final: 'near-bleed',      imageWidth: 'full' },
  'criterion':        { margin: 'centered', gap: 'xl',        textWidth: 'lg',      alignment: 'center', dual: 'off',    ratio: 'native',       hero: 'content-area',  body: 'content-area',    final: 'near-bleed',      imageWidth: 'full' },
  'broadsheet':       { margin: 'm3',       gap: 'sm',        textWidth: 'xl',      alignment: 'left',   dual: 'off',    ratio: 'native',       hero: 'bleed-right',   body: 'partial-bleed',   final: 'near-bleed',      imageWidth: 'full' },
  // Long-form / Academic
  'tufte':            { margin: 'centered', gap: 'native',    textWidth: 'xs',      alignment: 'center', dual: 'off',    ratio: 'native',       hero: 'text-column',   body: 'inner-container', final: 'content-area',    imageWidth: 'full' },
  'longform-web':     { margin: 'centered', gap: 'generous',  textWidth: 'md',      alignment: 'center', dual: 'off',    ratio: 'native',       hero: 'native',        body: 'native',          final: 'native',          imageWidth: 'full' },
  'nature-journal':   { margin: 'centered', gap: 'xs',        textWidth: 'journal', alignment: 'left',   dual: 'off',    ratio: 'native',       hero: 'text-column',   body: 'art-book',        final: 'inner-container', imageWidth: 'full' },
  'nasa-report':      { margin: 'centered', gap: 'xs',        textWidth: 'xs',      alignment: 'left',   dual: 'off',    ratio: 'native',       hero: 'text-column',   body: 'inner-container', final: 'inner-container', imageWidth: 'full' },
  // Architectural / Maximal
  'oma-monograph':    { margin: 'm2',       gap: 'xxl',       textWidth: '3xl',     alignment: 'left',   dual: 'off',    ratio: 'native',       hero: 'full-viewport', body: 'bleed-right',     final: 'panoramic',       imageWidth: 'full' },
  'pathology-slide':  { margin: 'm2',       gap: 'sm',        textWidth: 'journal', alignment: 'left',   dual: 'off',    ratio: 'native',       hero: 'bleed-right',   body: 'bleed-right',     final: 'full-viewport',   imageWidth: 'full' },
};

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s;
}

export function LabShell() {
  const { mode: cta, setMode: setCta } = useCta();
  const { mode: media, setMode: setMedia } = useMediaTruth();
  const { lane, setLane } = useLane();
  const { mode: tagStyle, setMode: setTagStyle } = useTagStyle();
  const {
    state: margin,
    resolved: marginResolved,
    setState: setMargin,
    setNativeTarget,
  } = useMargin();
  const { state: cardFrame, setState: setCardFrame } = useCardFrame();
  const { state: divider, setState: setDivider } = useDivider();
  const { state: titleRegister, setState: setTitleRegister } = useTitleRegister();
  const { state: imageTreatment, setState: setImageTreatment } = useImageTreatment();
  const { state: captionRegister, setState: setCaptionRegister } = useCaptionRegister();
  const { state: shippedProof, setState: setShippedProof } = useShippedProof();
  const { state: proofPlacement, setState: setProofPlacement } = useProofPlacement();
  const { state: aspectVariance, setState: setAspectVariance } = useAspectVariance();
  const { state: density, setState: setDensity } = useDensity();
  const {
    state: narrow4FeaturedAspect,
    setState: setNarrow4FeaturedAspect,
  } = useNarrow4FeaturedAspectVariance();
  const {
    state: narrow4StandardAspect,
    setState: setNarrow4StandardAspect,
  } = useNarrow4StandardAspectVariance();
  const {
    state: eyebrowPlacement,
    setState: setEyebrowPlacement,
  } = useNarrow4EyebrowPlacement();
  const {
    state: featuredProofMode,
    setState: setFeaturedProofMode,
  } = useNarrow4FeaturedProofMode();
  // W1-D Dark Companion toggle (B2 build 2026-05-25). Defaults to 'light' (W1).
  // Flipping to 'dark' swaps the root data-direction attribute to "w1-d" and
  // all `var(--dir-*)` consumers resolve to the W1-D companion tokens.
  const { state: directionMode, setState: setDirectionMode } = useDirectionMode();
  // Media frame toggle (B3 build 2026-05-25). Defaults to 'none' (no frame
  // change). Flipping to 'hairline' adds a 1px --dir-border to media wrappers
  // (initially just Ion §02 native treatment; propagate to other media slots
  // after optical pass survives).
  const { state: mediaFrame, setState: setMediaFrame } = useMediaFrame();
  // Card fit toggle (Hero #8 scaffolding 2026-05-26). Defaults to 'current'.
  // Compact constrains the Narrow 4 featured card to fit within one viewport
  // height. Lab artifact only; doesn't touch the locked Project Card spec.
  const { state: cardFit, setState: setCardFit } = useCardFit();
  const { state: gateAIonEyebrowStyle, setState: setGateAIonEyebrowStyle } = useGateAIonEyebrowStyle();
  const { state: pullQuoteRegister, setState: setPullQuoteRegister } = usePullQuoteRegisterTest();
  const { state: inlineEmphasis, setState: setInlineEmphasis } = useInlineEmphasisTest();
  const { state: gateAIonTldrStyle, setState: setGateAIonTldrStyle } = useGateAIonTldrStyle();
  const { state: gateAIonDividerStyle, setState: setGateAIonDividerStyle } = useGateAIonDividerStyle();
  const { state: gateAIonHeroHeight, setState: setGateAIonHeroHeight } = useGateAIonHeroHeight();
  const { state: gateAIonHeroPosition, setState: setGateAIonHeroPosition } = useGateAIonHeroPosition();
  const { state: gateAIonBorderRadius, setState: setGateAIonBorderRadius } = useGateAIonBorderRadius();
  const { state: gateAIonHeroAspect, setState: setGateAIonHeroAspect } = useGateAIonHeroAspect();
  const { state: gateAIonSectionNumberStyle, setState: setGateAIonSectionNumberStyle } = useGateAIonSectionNumberStyle();
  const { state: gateAIonProgressTrack, setState: setGateAIonProgressTrack } = useGateAIonProgressTrack();
  const { state: gateAIonWithinSectionDivider, setState: setGateAIonWithinSectionDivider } = useGateAIonWithinSectionDivider();
  const { state: gateAIonInternalGap, setState: setGateAIonInternalGap } = useGateAIonInternalGap();
  const { state: gateAIonTextColumnWidth, setState: setGateAIonTextColumnWidth } = useGateAIonTextColumnWidth();
  const { state: gateAIonContentAlignment, setState: setGateAIonContentAlignment } = useGateAIonContentAlignment();
  const { state: gateAIonImageWidth, setState: setGateAIonImageWidth } = useGateAIonImageWidth();
  const { state: gateAIonDualEnabled, setState: setGateAIonDualEnabled } = useGateAIonDualContainerEnabled();
  const { state: gateAIonDualRatio, setState: setGateAIonDualRatio } = useGateAIonDualContainerRatio();
  const { heroBleed: gateAIonHeroBleed, setHeroBleed: setGateAIonHeroBleed } = useGateAIonHeroBleed();
  const { bodyImageWidth: gateAIonBodyImageWidth, setBodyImageWidth: setGateAIonBodyImageWidth } = useGateAIonBodyImageWidth();
  const { finalImageWidth: gateAIonFinalImageWidth, setFinalImageWidth: setGateAIonFinalImageWidth } = useGateAIonFinalImageWidth();
  const { state: gateAIonHookMode, setState: setGateAIonHookMode } = useGateAIonHookMode();
  const { state: gateAIonSection01Position, setState: setGateAIonSection01Position } = useGateAIonSection01Position();
  const { state: gateAIonPreTocHeroWidth, setState: setGateAIonPreTocHeroWidth } = useGateAIonPreTocHeroWidth();
  const { state: gateAIonEyebrowSpacing, setState: setGateAIonEyebrowSpacing } = useGateAIonEyebrowSpacing();
  const { state: gateAIonSectionNumberSpacing, setState: setGateAIonSectionNumberSpacing } = useGateAIonSectionNumberSpacing();
  const { state: gateAIonEyebrowChunkGap, setState: setGateAIonEyebrowChunkGap } = useGateAIonEyebrowChunkGap();
  const { state: gateAIonHeroDensityMode, setState: setGateAIonHeroDensityMode } = useGateAIonHeroDensityMode();
  const { state: gateAIonS05GuardrailsLayout, setState: setGateAIonS05GuardrailsLayout } = useGateAIonS05GuardrailsLayout();
  const { state: gateAIonS02ArtifactTreatment, setState: setGateAIonS02ArtifactTreatment } = useGateAIonS02ArtifactTreatment();
  const { state: gateAIonTldrPosition, setState: setGateAIonTldrPosition } = useGateAIonTldrPosition();
  const { state: gateAIonS01ContributionGrid, setState: setGateAIonS01ContributionGrid } = useGateAIonS01ContributionGrid();
  const { state: gateAIonS01TldrRegister, setState: setGateAIonS01TldrRegister } = useGateAIonS01TldrRegister();
  const { state: gateAIonS01MetaStrip, setState: setGateAIonS01MetaStrip } = useGateAIonS01MetaStrip();
  const { state: gateAIonMetaStripPosition, setState: setGateAIonMetaStripPosition } = useGateAIonMetaStripPosition();
  const { state: gateAIonS03Direction, setState: setGateAIonS03Direction } = useGateAIonS03Direction();
  const { state: gateAIonS03PersonaArtifact, setState: setGateAIonS03PersonaArtifact } = useGateAIonS03PersonaArtifact();
  const { state: gateAIonS03PersonaContentDensity, setState: setGateAIonS03PersonaContentDensity } = useGateAIonS03PersonaContentDensity();
  const { state: gateAIonS03SubSectionGap, setState: setGateAIonS03SubSectionGap } = useGateAIonS03SubSectionGap();
  const { state: gateAIonS03NativePersonaLayout, setState: setGateAIonS03NativePersonaLayout } = useGateAIonS03NativePersonaLayout();
  const { state: gateAIonS03ExtE1ThemesStyle, setState: setGateAIonS03ExtE1ThemesStyle } = useGateAIonS03ExtE1ThemesStyle();
  const { state: gateAIonS03ExtE1LeanDirection, setState: setGateAIonS03ExtE1LeanDirection } = useGateAIonS03ExtE1LeanDirection();
  const { state: gateAIonS07RowId, setState: setGateAIonS07RowId } = useGateAIonS07RowId();
  const { state: gateAIonOutcomesMode, setState: setGateAIonOutcomesMode } = useGateAIonOutcomesMode();
  const { artifact: artifactPlaygroundArtifact, setArtifact: setArtifactPlaygroundArtifact, a1, setA1, b1, setB1, c1, setC1, c2, setC2, d1, setD1, d2, setD2, a2, setA2, a4, setA4, b2, setB2, b3, setB3, b4, setB4, c3, setC3, e1, setE1, c4, setC4, c5, setC5, e2, setE2 } = useGateAIonArtifactPlayground();
  const [layoutPreset, setLayoutPreset] = useState<LayoutPresetId>('sebs');
  const { mode: cardScale, setMode: setCardScale } = useCardScale();
  const {
    mode: shellPicker,
    setMode: setShellPicker,
    manual: shellManual,
    setManual: setShellManual,
  } = useShellPicker();
  const { preset, setPreset } = usePreset();
  const { chromeVisible, toggleChrome } = useLabChrome();
  const navigate = useNavigate();
  const location = useLocation();

  // Fire layout-preset cascade once on mount so the default preset (sebs)
  // actually drives all 28 toggle values, instead of only displaying its label.
  useEffect(() => {
    const p = LAYOUT_PRESETS[layoutPreset];
    setMargin(p.margin);
    setGateAIonInternalGap(p.gap);
    setGateAIonTextColumnWidth(p.textWidth);
    setGateAIonContentAlignment(p.alignment);
    setGateAIonDualEnabled(p.dual);
    setGateAIonDualRatio(p.ratio);
    setGateAIonHeroBleed(p.hero);
    setGateAIonBodyImageWidth(p.body);
    setGateAIonFinalImageWidth(p.final);
    setGateAIonImageWidth(p.imageWidth);
    if (p.eyebrowStyle !== undefined) setGateAIonEyebrowStyle(p.eyebrowStyle);
    if (p.tldrStyle !== undefined) setGateAIonTldrStyle(p.tldrStyle);
    if (p.sectionNumberStyle !== undefined) setGateAIonSectionNumberStyle(p.sectionNumberStyle);
    if (p.dividerStyle !== undefined) setGateAIonDividerStyle(p.dividerStyle);
    if (p.withinSectionDivider !== undefined) setGateAIonWithinSectionDivider(p.withinSectionDivider);
    if (p.heroHeight !== undefined) setGateAIonHeroHeight(p.heroHeight);
    if (p.heroPosition !== undefined) setGateAIonHeroPosition(p.heroPosition);
    if (p.heroAspect !== undefined) setGateAIonHeroAspect(p.heroAspect);
    if (p.borderRadius !== undefined) setGateAIonBorderRadius(p.borderRadius);
    if (p.hookMode !== undefined) setGateAIonHookMode(p.hookMode);
    if (p.section01Position !== undefined) setGateAIonSection01Position(p.section01Position);
    if (p.preTocHeroWidth !== undefined) setGateAIonPreTocHeroWidth(p.preTocHeroWidth);
    if (p.eyebrowSpacing !== undefined) setGateAIonEyebrowSpacing(p.eyebrowSpacing);
    if (p.sectionNumberSpacing !== undefined) setGateAIonSectionNumberSpacing(p.sectionNumberSpacing);
    if (p.tldrPosition !== undefined) setGateAIonTldrPosition(p.tldrPosition);
    if (p.s01ContributionGrid !== undefined) setGateAIonS01ContributionGrid(p.s01ContributionGrid);
    if (p.s01MetaStrip !== undefined) setGateAIonS01MetaStrip(p.s01MetaStrip);
    if (p.metaStripPosition !== undefined) setGateAIonMetaStripPosition(p.metaStripPosition);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const segs = location.pathname.split('/').filter(Boolean);
  const mode: Mode =
    segs[0] === 'gate-a' && segs[1] === 'homepage'
      ? 'gate-a'
      : segs[0] === 'gate-a' && segs[1] === 'ion'
        ? 'gate-a-ion'
        : segs[0] === 'gate-a'
          ? 'gate-a-hub'
          : segs[0] === 'artifacts'
            ? 'artifact-playground'
            : segs[0] === 'surface'
        ? 'surface'
        : segs[0] === 'combo'
          ? 'combo'
          : segs[0] === 'narrow-1'
            ? 'narrow-1'
            : segs[0] === 'narrow-2'
              ? 'narrow-2'
              : segs[0] === 'narrow-3'
                ? 'narrow-3'
                : segs[0] === 'narrow-4'
                  ? 'narrow-4'
                  : segs[0] === 'cards' || segs[0] === 'tiles'
                    ? 'family'
                    : 'layout';
  const familyPage: FamilyId | null =
    segs[0] === 'cards' ? 'cards' : segs[0] === 'tiles' ? 'tiles' : null;

  const onLayoutCandidate = mode === 'layout' && segs[0] === 'layout' && segs.length === 3;
  const onSurfaceCandidate =
    mode === 'surface' && segs[0] === 'surface' && segs.length >= 3;
  const onComboCandidate =
    mode === 'combo' && segs[0] === 'combo' && segs.length === 3;
  const onNarrow1Candidate =
    mode === 'narrow-1' && segs[0] === 'narrow-1' && segs.length === 3;
  const onNarrow2Candidate =
    mode === 'narrow-2' && segs[0] === 'narrow-2' && segs.length === 3;
  const onNarrow3Candidate =
    mode === 'narrow-3' && segs[0] === 'narrow-3' && segs.length === 3;
  const onNarrow4Candidate =
    mode === 'narrow-4' && segs[0] === 'narrow-4' && segs.length === 3;
  const surfaceVariant = onSurfaceCandidate ? segs[3] : undefined;

  const activeLayoutId = onLayoutCandidate ? `${segs[1]}-${segs[2]}` : '';
  const activeSurfaceId = onSurfaceCandidate ? `${segs[1]}-${segs[2]}` : '';
  const activeSurfaceKey = onSurfaceCandidate
    ? `${activeSurfaceId}${surfaceVariant ? `/${surfaceVariant}` : ''}`
    : '';
  const activeComboLayoutId = onComboCandidate ? segs[1] : '';
  const activeComboSurfaceId = onComboCandidate ? segs[2] : '';
  const activeNarrow1LayoutId = onNarrow1Candidate ? segs[1] : '';
  const activeNarrow1SurfaceId = onNarrow1Candidate ? segs[2] : '';
  const activeNarrow2LayoutId = onNarrow2Candidate ? segs[1] : '';
  const activeNarrow2FamilyId: FamilyId | '' = onNarrow2Candidate
    ? ((FAMILY_IDS as readonly string[]).includes(segs[2])
        ? (segs[2] as FamilyId)
        : '')
    : '';
  const activeNarrow3FamilyId: N3FamilyId | '' =
    onNarrow3Candidate && isN3FamilyId(segs[1]) ? segs[1] : '';
  const activeNarrow3VersionId: N3VersionId | '' =
    onNarrow3Candidate && isN3VersionId(segs[2]) ? segs[2] : '';
  const activeNarrow4FamilyId: N3FamilyId | '' =
    onNarrow4Candidate && isN3FamilyId(segs[1]) ? segs[1] : '';
  const activeNarrow4VersionId: N3VersionId | '' =
    onNarrow4Candidate && isN3VersionId(segs[2]) ? segs[2] : '';

  // Apply per-candidate defaults when landing on a candidate route.
  // Legacy candidate.defaultCta uses 'visible' | 'quiet' | 'none' — map to the
  // new context union. 'visible' resolves to 'auto' so each surface still
  // renders its register-native CTA by default.
  const mapLegacyCta = (d: 'visible' | 'quiet' | 'none'): CtaMode =>
    d === 'visible' ? 'auto' : d === 'quiet' ? 'text' : 'hidden';

  useEffect(() => {
    if (onLayoutCandidate) {
      const c = findCandidate(segs[1], segs[2]);
      if (!c) return;
      setCta(mapLegacyCta(c.defaultCta));
      setMedia(c.defaultMedia);
      setNativeTarget(c.nativeMargin);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLayoutId]);

  useEffect(() => {
    if (onSurfaceCandidate) {
      const c = findSurfaceCandidate(segs[1], segs[2]);
      if (!c) return;
      // /quiet variant forces text-link override; otherwise candidate default.
      setCta(surfaceVariant === 'quiet' ? 'text' : mapLegacyCta(c.defaultCta));
      setMedia(c.defaultMedia);
      setNativeTarget(c.nativeMargin);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSurfaceKey]);

  // Lane filter (T1–T5) applies to Layout mode only; Surface mode uses t1–t4.
  const visibleLayoutCandidates =
    lane === 'all' ? candidates : candidates.filter((c) => c.tier === lane);

  const layoutTierOrder: Tier[] = ['t1', 't2', 't3', 't4', 't5a', 't5b', 't5c'];
  const layoutCandidateSections: DropdownSection[] = [
    {
      heading: 'Index',
      options: [{ value: '', label: '— Layout index —', detail: 'All 37 candidates' }],
    },
    ...layoutTierOrder
      .map((t): DropdownSection | null => {
        const list = visibleLayoutCandidates.filter((c) => c.tier === t);
        if (!list.length) return null;
        return {
          heading: TIER_OPT_LABEL[t],
          subheading: `${list.length} candidate${list.length === 1 ? '' : 's'}`,
          options: list.map((c) => ({
            value: c.id,
            meta: c.label,
            label: c.workingName,
            detail: truncate(c.thesis, 90),
          })),
        };
      })
      .filter((s): s is DropdownSection => s !== null),
  ];

  const surfaceTierOrder: SurfaceTier[] = ['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8'];
  const surfaceCandidateSections: DropdownSection[] = [
    {
      heading: 'Index',
      options: [{ value: '', label: '— Surface index —', detail: 'All 37 candidates' }],
    },
    ...surfaceTierOrder.map((t): DropdownSection => {
      const list = surfaceCandidates.filter((c) => c.tier === t);
      const options: DropdownSection['options'] = [];
      for (const c of list) {
        options.push({
          value: c.id,
          meta: c.label,
          label: c.workingName,
          detail: truncate(c.thesis, 90),
        });
        if (c.quietArtifact) {
          options.push({
            value: `${c.id}/quiet`,
            meta: `${c.label} ·q`,
            label: `${c.workingName} — quiet artifact`,
            detail: 'CTA forced quiet on the same shell',
          });
        }
        if (c.svbAlternate !== 'none') {
          options.push({
            value: `${c.id}/sv-b`,
            meta: `${c.label} ·SV-B`,
            label: `${c.workingName} — whole-grid SV-B`,
            detail:
              c.svbAlternate === 'conditional'
                ? 'Conditional SV-B alternate'
                : 'Clean SV-B alternate',
          });
        }
      }
      return {
        heading: SURFACE_TIER_LABEL[t],
        subheading: `${list.length} candidate${list.length === 1 ? '' : 's'}`,
        options,
      };
    }),
  ];

  // Combo-mode dropdowns — always show all 37 candidates on each axis
  // regardless of Lane, and never include surface /quiet or /sv-b variants.
  const comboLayoutSections: DropdownSection[] = [
    {
      heading: 'Index',
      options: [{ value: '', label: '— Combo index —', detail: 'All 1,369 pairs' }],
    },
    ...layoutTierOrder
      .map((t): DropdownSection | null => {
        const list = candidates.filter((c) => c.tier === t);
        if (!list.length) return null;
        return {
          heading: TIER_OPT_LABEL[t],
          subheading: `${list.length} candidate${list.length === 1 ? '' : 's'}`,
          options: list.map((c) => ({
            value: c.id,
            meta: c.label,
            label: c.workingName,
            detail: truncate(c.thesis, 90),
          })),
        };
      })
      .filter((s): s is DropdownSection => s !== null),
  ];

  const comboSurfaceSections: DropdownSection[] = [
    {
      heading: 'Index',
      options: [{ value: '', label: '— Combo index —', detail: 'All 1,369 pairs' }],
    },
    ...surfaceTierOrder.map((t): DropdownSection => ({
      heading: SURFACE_TIER_LABEL[t],
      subheading: `${surfaceCandidates.filter((c) => c.tier === t).length} candidates`,
      options: surfaceCandidates
        .filter((c) => c.tier === t)
        .map((c) => ({
          value: c.id,
          meta: c.label,
          label: c.workingName,
          detail: truncate(c.thesis, 90),
        })),
    })),
  ];

  // Narrow Pass 1 dropdowns — both axes filtered to the narrowed working sets
  // (15 layouts × 13 surfaces). Surfaces cut 14 → 13 by conceptual-merge audit
  // (t8-s2 collapsed into t8-s1).
  const narrow1PairCount =
    NARROWED_LAYOUT_IDS.length * NARROWED_SURFACE_IDS.length;
  const narrow1LayoutCandidates = candidates.filter((c) =>
    NARROWED_LAYOUT_SET.has(c.id),
  );
  const narrow1SurfaceCandidates = surfaceCandidates.filter((c) =>
    NARROWED_SURFACE_SET.has(c.id),
  );
  const narrow1LayoutSections: DropdownSection[] = [
    {
      heading: 'Index',
      options: [
        {
          value: '',
          label: '— Narrow Pass 1 index —',
          detail: `${NARROWED_LAYOUT_IDS.length} × ${NARROWED_SURFACE_IDS.length} = ${narrow1PairCount} pairs`,
        },
      ],
    },
    ...layoutTierOrder
      .map((t): DropdownSection | null => {
        const list = narrow1LayoutCandidates.filter((c) => c.tier === t);
        if (!list.length) return null;
        return {
          heading: TIER_OPT_LABEL[t],
          subheading: `${list.length} narrowed candidate${list.length === 1 ? '' : 's'}`,
          options: list.map((c) => ({
            value: c.id,
            meta: c.label,
            label: c.workingName,
            detail: truncate(c.thesis, 90),
          })),
        };
      })
      .filter((s): s is DropdownSection => s !== null),
  ];

  const narrow1SurfaceSections: DropdownSection[] = [
    {
      heading: 'Index',
      options: [
        {
          value: '',
          label: '— Narrow Pass 1 index —',
          detail: `${NARROWED_LAYOUT_IDS.length} × ${NARROWED_SURFACE_IDS.length} pairs`,
        },
      ],
    },
    ...surfaceTierOrder
      .map((t): DropdownSection | null => {
        const list = narrow1SurfaceCandidates.filter((c) => c.tier === t);
        if (!list.length) return null;
        return {
          heading: SURFACE_TIER_LABEL[t],
          subheading: `${list.length} narrowed candidate${list.length === 1 ? '' : 's'}`,
          options: list.map((c) => ({
            value: c.id,
            meta: c.label,
            label: c.workingName,
            detail: truncate(c.thesis, 90),
          })),
        };
      })
      .filter((s): s is DropdownSection => s !== null),
  ];

  // Narrow Pass 2 dropdowns — 2-family space. Layout axis = 5 narrowed
  // Pass-2 layouts; surface axis collapsed into 2 families (Cards → T1-S1
  // baseline · Tiles → T8-S1 baseline). 5 × 2 = 10 pairs.
  const narrow2LayoutCandidates = candidates.filter((c) =>
    NARROW2_LAYOUT_SET.has(c.id),
  );
  const narrow2PairCount =
    NARROW2_LAYOUT_IDS.length * FAMILY_IDS.length;
  const narrow2LayoutSections: DropdownSection[] = [
    {
      heading: 'Index',
      options: [
        {
          value: '',
          label: '— Narrow Pass 2 index —',
          detail: `${NARROW2_LAYOUT_IDS.length} × ${FAMILY_IDS.length} = ${narrow2PairCount} pairs`,
        },
      ],
    },
    ...layoutTierOrder
      .map((t): DropdownSection | null => {
        const list = narrow2LayoutCandidates.filter((c) => c.tier === t);
        if (!list.length) return null;
        return {
          heading: TIER_OPT_LABEL[t],
          subheading: `${list.length} narrowed candidate${list.length === 1 ? '' : 's'}`,
          options: list.map((c) => ({
            value: c.id,
            meta: c.label,
            label: c.workingName,
            detail: truncate(c.thesis, 90),
          })),
        };
      })
      .filter((s): s is DropdownSection => s !== null),
  ];

  const narrow2FamilySections: DropdownSection[] = [
    {
      heading: 'Index',
      options: [
        {
          value: '',
          label: '— Narrow Pass 2 index —',
          detail: `${NARROW2_LAYOUT_IDS.length} × ${FAMILY_IDS.length} = ${narrow2PairCount} pairs`,
        },
      ],
    },
    {
      heading: 'Surface families',
      subheading: '2-family space · all 8 axes enabled',
      options: [
        {
          value: 'cards',
          meta: 'Cards',
          label: 'Cards family',
          detail: 'Baseline T1-S1 · Explicit Container · 10 shells collapsed',
        },
        {
          value: 'tiles',
          meta: 'Tiles',
          label: 'Tiles family',
          detail: 'Baseline T8-S1 · Plain Tile · 3 shells collapsed',
        },
      ],
    },
  ];

  // Narrow Pass 3 dropdowns — 2 families × 3 versions = 6 renders on the
  // tile surface (T8-S1 PlainTile). Family axis: a (Anchored Work Field) ·
  // b (Identity + Work Field). Version axis: v1 Grid · v2 Masonry ·
  // v3 Asymmetric Rows.
  const narrow3PairCount = N3_FAMILY_IDS.length * N3_VERSION_IDS.length;
  const narrow3FamilySections: DropdownSection[] = [
    {
      heading: 'Index',
      options: [
        {
          value: '',
          label: '— Narrow Pass 3 index —',
          detail: `${N3_FAMILY_IDS.length} × ${N3_VERSION_IDS.length} = ${narrow3PairCount} renders`,
        },
      ],
    },
    {
      heading: 'Family',
      subheading: 'featured-to-standard relationship',
      options: N3_FAMILIES.map((f) => ({
        value: f.id,
        meta: f.label,
        label: f.workingName,
        detail: truncate(f.thesis, 90),
      })),
    },
  ];

  const narrow3VersionSections: DropdownSection[] = [
    {
      heading: 'Index',
      options: [
        {
          value: '',
          label: '— Narrow Pass 3 index —',
          detail: `${N3_FAMILY_IDS.length} × ${N3_VERSION_IDS.length} = ${narrow3PairCount} renders`,
        },
      ],
    },
    {
      heading: 'Version',
      subheading: 'standards-field composition',
      options: N3_VERSIONS.map((v) => ({
        value: v.id,
        meta: v.label,
        label: v.workingName,
        detail: truncate(v.thesis, 90),
      })),
    },
  ];

  // Narrow Pass 4 dropdowns — shares the Narrow 3 family × version matrix
  // read-only (2 families × 3 versions = 6 renders). Register hard-set:
  // T8-S4 preset, compact density, Option C eyebrow, CTA hidden.
  const narrow4PairCount = N3_FAMILY_IDS.length * N3_VERSION_IDS.length;
  const narrow4FamilySections: DropdownSection[] = [
    {
      heading: 'Index',
      options: [
        {
          value: '',
          label: '— Narrow Pass 4 index —',
          detail: `${N3_FAMILY_IDS.length} × ${N3_VERSION_IDS.length} = ${narrow4PairCount} renders`,
        },
      ],
    },
    {
      heading: 'Family',
      subheading: 'shared with Narrow 3 matrix',
      options: N3_FAMILIES.map((f) => ({
        value: f.id,
        meta: f.label,
        label: f.workingName,
        detail: truncate(f.thesis, 90),
      })),
    },
  ];

  const narrow4VersionSections: DropdownSection[] = [
    {
      heading: 'Index',
      options: [
        {
          value: '',
          label: '— Narrow Pass 4 index —',
          detail: `${N3_FAMILY_IDS.length} × ${N3_VERSION_IDS.length} = ${narrow4PairCount} renders`,
        },
      ],
    },
    {
      heading: 'Version',
      subheading: 'standards-field composition',
      options: N3_VERSIONS.map((v) => ({
        value: v.id,
        meta: v.label,
        label: v.workingName,
        detail: truncate(v.thesis, 90),
      })),
    },
  ];

  // Narrow Pass 2 axis toggles — all 8 axes + ShellPicker surface here.
  // Dedup suppression lives on the /cards + /tiles articulation pages; in
  // the family space every toggle stays open.
  const cardFrameSections: DropdownSection[] = [
    {
      heading: 'Card frame',
      options: [
        { value: 'native', label: 'Native', detail: 'Per-surface default.' },
        { value: 'on', label: 'On', detail: 'Framed enclosure.' },
        { value: 'off', label: 'Off', detail: 'Unframed — media-as-object.' },
      ],
    },
  ];

  const dividerSections: DropdownSection[] = [
    {
      heading: 'Divider',
      options: [
        { value: 'native', label: 'Native', detail: 'Per-surface default.' },
        { value: 'none', label: 'None', detail: 'No visible rule.' },
        { value: 'section', label: 'Section', detail: 'Horizontal rule between groups.' },
        { value: 'inline', label: 'Inline', detail: 'Rule inside the stack.' },
      ],
    },
  ];

  const titleRegisterSections: DropdownSection[] = [
    {
      heading: 'Title register',
      options: [
        { value: 'native', label: 'Native', detail: 'Per-surface default.' },
        { value: 'default', label: 'Default', detail: 'IS weighting.' },
        { value: 'ise-italic', label: 'ISe italic', detail: 'Serif italic shift.' },
        { value: 'small-caps', label: 'Small caps', detail: 'Uppercase tracking.' },
      ],
    },
  ];

  const imageTreatmentSections: DropdownSection[] = [
    {
      heading: 'Image treatment',
      options: [
        { value: 'native', label: 'Native', detail: 'Per-surface default.' },
        { value: 'plain', label: 'Plain', detail: 'Bare asset.' },
        { value: 'framed', label: 'Framed', detail: 'Single border.' },
        { value: 'double-frame', label: 'Double frame', detail: 'Inner + outer border.' },
        { value: 'mat', label: 'Mat', detail: 'Padded bg ground.' },
      ],
    },
  ];

  const captionRegisterSections: DropdownSection[] = [
    {
      heading: 'Caption register',
      options: [
        { value: 'native', label: 'Native', detail: 'Per-surface default.' },
        { value: 'default', label: 'Default', detail: 'IS 300 detail.' },
        { value: 'small-caps', label: 'Small caps', detail: 'Uppercase tracking.' },
      ],
    },
  ];

  const shippedProofSections: DropdownSection[] = [
    {
      heading: 'Shipped proof',
      options: [
        { value: 'native', label: 'Native', detail: 'Per-surface default.' },
        { value: 'on', label: 'On', detail: 'Show shipped-state signal.' },
        { value: 'off', label: 'Off', detail: 'Suppress proof atoms.' },
      ],
    },
  ];

  const proofPlacementSections: DropdownSection[] = [
    {
      heading: 'Proof placement',
      options: [
        { value: 'native', label: 'Native', detail: 'Per-surface default.' },
        { value: 'stack-grid', label: 'Stack grid', detail: 'Adjacent to card block.' },
        { value: 'inline', label: 'Inline', detail: 'Within caption flow.' },
        { value: 'bottom-strip', label: 'Bottom strip', detail: 'Footer band.' },
      ],
    },
  ];

  const aspectVarianceSections: DropdownSection[] = [
    {
      heading: 'Aspect variance',
      options: [
        { value: 'native', label: 'Native', detail: 'Per-surface default.' },
        { value: 'fill-cell', label: 'Fill cell', detail: 'Image fills cell via flex (narrow-3 register).' },
        { value: 'uniform', label: 'Uniform', detail: 'Asset intrinsic aspect.' },
        { value: 'authored', label: 'Authored', detail: 'Per-slot aspects.' },
      ],
    },
    {
      heading: 'Fixed ratio · editorial / film',
      subheading: 'Force every slot to one ratio',
      options: [
        { value: 'cinematic', label: 'Cinematic 21:9', detail: 'Film-wide.' },
        { value: 'anamorphic', label: 'Anamorphic 2.39:1', detail: 'Very wide film.' },
        { value: 'widescreen', label: 'Widescreen 16:9', detail: 'TV / video standard.' },
        { value: 'golden', label: 'Golden 1.618:1', detail: 'Classical proportion.' },
        { value: 'academy', label: 'Academy 4:3', detail: 'Vintage / broadcast.' },
        { value: 'square', label: 'Square 1:1', detail: 'Editorial grid / social feed.' },
        { value: 'portrait', label: 'Portrait 9:16', detail: 'Mobile-native / vertical feed.' },
        { value: 'vertical-half', label: 'Vertical-half 1:2', detail: 'Tall sliver / editorial column.' },
      ],
    },
  ];

  const cardScaleSections: DropdownSection[] = [
    {
      heading: 'Card scale',
      subheading: 'Featured card bounding box — narrow-2 only · Esc returns to standard',
      options: [
        { value: 'standard', label: 'Standard', detail: 'Layout-authored cell — renders the full layout.' },
        { value: 'contain', label: 'Contain · 85vw × 85vh', detail: 'Whole card (image + content) visible · natural size.' },
        { value: 'fit', label: 'Fit · 85vw × 75vh', detail: 'Card stretches to fill bounding box.' },
        { value: 'hero', label: 'Hero · 88vw × 80vh', detail: 'Bill Guo register.' },
        { value: 'ultra', label: 'Ultra · 95vw × 85vh', detail: 'Pushing.' },
        { value: 'fullscreen', label: 'Fullscreen · 100vw × 90vh', detail: 'Maxed bounding box.' },
        { value: 'overflow', label: 'Overflow · 110vw × 95vh', detail: 'Edge-case stress · horizontal scroll.' },
      ],
    },
  ];

  const densitySections: DropdownSection[] = [
    {
      heading: 'Density',
      subheading: 'Surface proportion / footprint register',
      options: [
        { value: 'native', label: 'Native', detail: 'Per-surface default.' },
        { value: 'default', label: 'Default', detail: 'Shell baseline proportions.' },
        { value: 'compact', label: 'Compact', detail: 'Reduced footprint / tighter padding.' },
        { value: 'content-forward', label: 'Content-forward', detail: 'Narrower media, wider content.' },
      ],
    },
  ];

  const shellPickerSections: DropdownSection[] = [
    {
      heading: 'Shell picker',
      subheading: 'family baseline vs layout-native vs manual',
      options: [
        { value: 'baseline', label: 'Baseline', detail: 'Family default shell.' },
        { value: 'native', label: 'Layout-native', detail: 'Shell per layout tier.' },
        { value: 'manual', label: 'Manual', detail: 'Featured / standard overrides.' },
      ],
    },
  ];

  const FEATURED_SHELL_DETAIL: Record<ShellId, string> = {
    'FH-A': 'Tag-led horizontal.',
    'FH-B': 'Proof-led horizontal.',
    'FV-A': 'Classification-led vertical (≥ 2/3 width).',
    'SV-A': '',
    'SV-B': '',
    'SH-A-Row': '',
  };
  const STANDARD_SHELL_DETAIL: Record<ShellId, string> = {
    'SV-A': 'Tag-led vertical browse.',
    'SV-B': 'Proof-led vertical (whole-grid-only).',
    'SH-A-Row': 'Reduced-height list row (list-only).',
    'FH-A': '',
    'FH-B': '',
    'FV-A': '',
  };

  const featuredShellSections: DropdownSection[] = [
    {
      heading: 'Featured shell override',
      subheading: 'auto = layout-native',
      options: [
        { value: 'auto', label: 'Auto', detail: 'Use layout-native featured shell.' },
        ...FEATURED_SHELL_IDS.map((id) => ({
          value: id,
          label: id,
          detail: FEATURED_SHELL_DETAIL[id],
        })),
      ],
    },
  ];
  const standardShellSections: DropdownSection[] = [
    {
      heading: 'Standard shell override',
      subheading: 'auto = layout-native',
      options: [
        { value: 'auto', label: 'Auto', detail: 'Use layout-native standard shell.' },
        ...STANDARD_SHELL_IDS.map((id) => ({
          value: id,
          label: id,
          detail: STANDARD_SHELL_DETAIL[id],
        })),
      ],
    },
  ];

  // Current family for the Preset dropdown. In family mode the family is
  // the route segment; in narrow-2 it's the family axis selection; everywhere
  // else there is no scoped family.
  const currentFamily: Family | null =
    mode === 'family'
      ? (familyPage as Family | null)
      : mode === 'narrow-2' && activeNarrow2FamilyId
        ? (activeNarrow2FamilyId as Family)
        : mode === 'narrow-3' || mode === 'narrow-4'
          ? 'tiles'
          : null;

  const familyPresets = currentFamily
    ? SURFACE_ATTRS.filter((s) => s.family === currentFamily)
    : [];

  const presetSections: DropdownSection[] = [
    {
      heading: 'Preset · toggle combination',
      subheading: currentFamily
        ? `${familyPresets.length} named preset${familyPresets.length === 1 ? '' : 's'} · ${currentFamily === 'cards' ? 'Cards' : 'Tiles'} family`
        : 'Select a family to enable presets',
      options: [
        {
          value: 'custom',
          label: 'Custom',
          detail: 'Reset all 9 identity axes to native — toggles drive the render.',
        },
        ...familyPresets.map((p) => ({
          value: p.id,
          meta: p.label,
          label: p.workingName,
          detail: truncate(p.identitySummary, 90),
        })),
      ],
    },
  ];

  const laneSections: DropdownSection[] = [
    {
      heading: 'Lane filter',
      subheading: 'scope the Candidate menu (layout mode only)',
      options: [
        { value: 'all', label: 'All', detail: '37 candidates across T1–T5c' },
        { value: 't1', label: TIER_OPT_LABEL.t1, detail: '4 candidates' },
        { value: 't2', label: TIER_OPT_LABEL.t2, detail: '4 candidates' },
        { value: 't3', label: TIER_OPT_LABEL.t3, detail: '4 candidates' },
        { value: 't4', label: TIER_OPT_LABEL.t4, detail: '4 candidates' },
        { value: 't5a', label: TIER_OPT_LABEL.t5a, detail: '9 candidates' },
        { value: 't5b', label: TIER_OPT_LABEL.t5b, detail: '6 candidates' },
        { value: 't5c', label: TIER_OPT_LABEL.t5c, detail: '6 candidates' },
      ],
    },
  ];

  const ctaSections: DropdownSection[] = [
    {
      heading: 'CTA rendering',
      subheading: 'Applies to every PillCTA across every surface',
      options: [
        { value: 'auto', label: 'auto · native', detail: 'Each surface renders its register-native CTA.' },
        { value: 'pill-filled', label: 'pill · filled', detail: 'Filled graphite pill button.' },
        { value: 'pill-outline', label: 'pill · outline', detail: 'Outline border pill button.' },
        { value: 'text', label: 'text link', detail: 'Muted text with trailing arrow.' },
        { value: 'underline', label: 'underline', detail: 'Text with underline, no arrow.' },
        { value: 'rect', label: 'rect · filled', detail: 'Sharp-edge filled rectangle (brutalist).' },
        { value: 'caps', label: 'caps · arrow', detail: 'Uppercase caps with trailing arrow.' },
        { value: 'hidden', label: 'hidden', detail: 'Suppress all CTA atoms — card is pure read.' },
      ],
    },
  ];

  const tagStyleSections: DropdownSection[] = [
    {
      heading: 'Tag rendering',
      subheading: 'Applies to every TagList across every surface',
      options: [
        { value: 'auto', label: 'auto · native', detail: 'Each surface renders its register-native default.' },
        { value: 'pill-outline', label: 'pill · outline', detail: 'Rounded border chip.' },
        { value: 'pill-filled', label: 'pill · filled', detail: 'Muted-bg chip, softer weight.' },
        { value: 'slash', label: 'slash', detail: 'Inline caps separated by " / ".' },
        { value: 'dot', label: 'dot', detail: 'Inline caps separated by " · ".' },
        { value: 'bracket', label: 'bracket', detail: '[Tag] [Tag] inline.' },
        { value: 'underline', label: 'underline', detail: 'Inline words with underline.' },
        { value: 'typeTag', label: 'typeTag only', detail: 'Single medium chip — project.typeTag only, sparse register.' },
        { value: 'hidden', label: 'hidden', detail: 'Suppress all TagList atoms — card is pure read.' },
      ],
    },
  ];

  const marginSections: DropdownSection[] = [
    {
      heading: 'Native · resolves per candidate',
      options: [
        {
          value: 'native',
          label: 'Native',
          detail: onLayoutCandidate || onSurfaceCandidate
            ? `Resolves to ${marginTokenLabel(marginResolved)}`
            : 'Baseline until a candidate is selected',
        },
      ],
    },
    {
      heading: 'Baseline · centered',
      options: [
        {
          value: 'centered',
          label: `Centered (${CENTERED_MAX_WIDTH} + ${MARGIN_VALUES.centered})`,
          detail: 'OG baseline · max-width 1120 + auto margins + 48 inset · viewport-responsive',
        },
      ],
    },
    {
      heading: 'Gutter ramp · narrow → wide',
      subheading: 'Viewport-to-content gutter · shared across Layout + Surface modes',
      options: MARGIN_RAMP.map((m) => ({
        value: m,
        label: `${m.toUpperCase()} · ${MARGIN_VALUES[m]}px`,
        detail:
          MARGIN_VALUES[m] < 48
            ? 'Narrower · closer to full-bleed'
            : MARGIN_VALUES[m] < 200
              ? 'Narrow-to-mid gutter'
              : MARGIN_VALUES[m] < 400
                ? 'Wider · more framed'
                : 'Widest · single-column reading territory',
      })),
    },
  ];

  const mediaSections: DropdownSection[] = [
    {
      heading: 'Axis D · Media truth',
      options: [
        {
          value: 'structural-placeholder',
          label: 'structural-placeholder',
          detail: 'Labeled in-situ boxes — composition probe.',
        },
        {
          value: 'real-asset',
          label: 'real-asset',
          detail: 'Locked assets where present; labeled asset-missing otherwise.',
        },
      ],
    },
  ];

  const modeLabel =
    mode === 'gate-a-hub'
      ? 'Gate A · Hub · Part 1 + Part 2'
      : mode === 'gate-a-ion'
        ? 'Gate A · Part 2 · Ion track'
        : mode === 'artifact-playground'
          ? 'Gate A · Part 2 · Ion · Artifact playground'
          : mode === 'gate-a'
            ? 'Gate A · Part 1 · Homepage track LOCKED'
          : mode === 'layout'
        ? 'Homepage v2 · Step 5a · Layout mode'
        : mode === 'surface'
          ? 'Homepage v2 · Step 5b · Surface mode'
          : mode === 'combo'
            ? 'Homepage v2 · Combo mode'
            : mode === 'narrow-1'
              ? 'Homepage v2 · Narrow Pass 1'
              : mode === 'narrow-3'
                ? 'Homepage v2 · Narrow Pass 3 · family × version'
                : mode === 'narrow-4'
                  ? 'Homepage v2 · Narrow Pass 4 · card register'
                  : mode === 'family'
                    ? `Homepage v2 · ${familyPage === 'cards' ? 'Cards family' : 'Tiles family'}`
                    : 'Homepage v2 · Narrow Pass 2 · 2-family space';

  const heldLabel =
    mode === 'gate-a-hub'
      ? 'Part 1 LOCKED · Part 2 ACTIVE · 2.5 R1 next'
      : mode === 'gate-a-ion'
        ? 'Steps 2.1–2.4 complete · I1–I6 locked · 2.5 R1 next'
        : mode === 'artifact-playground'
          ? '16 catalogued · 16 built · C3 native pending register reframe'
          : mode === 'gate-a'
            ? 'Provisional output · winner + backup · final lock deferred'
          : mode === 'layout'
        ? 'Surface held at T1-S1 · Container Baseline'
        : mode === 'surface'
          ? 'Layout held at T1-L1 · Classical Anchor Grid'
          : mode === 'combo'
            ? 'Pair-native · axes resolved per pair'
            : mode === 'narrow-1'
              ? `Pair-native · ${NARROWED_LAYOUT_IDS.length} layouts × ${NARROWED_SURFACE_IDS.length} surfaces`
              : mode === 'narrow-3'
                ? `Tile surface · ${N3_FAMILY_IDS.length} families × ${N3_VERSION_IDS.length} versions`
                : mode === 'narrow-4'
                  ? 'T8-S4 locked · compact · cta hidden · register hard-set'
                  : mode === 'family'
                    ? 'Family articulation · dedup enforced'
                    : `Pair-native · ${NARROW2_LAYOUT_IDS.length} layouts × ${FAMILY_IDS.length} families`;

  // Identity-axis row appears on combo + narrow-2 (2-family space) + family
  // mode (/cards · /tiles). Combo mode renders every layout × surface pair's
  // cards through shells that consume all 9 identity contexts, so every
  // toggle must be active for every card — no dedup suppression on combo.
  // Layout / surface / narrow-1 stay pair-native-only to keep the toolbar
  // quiet at those scopes. Shell + Preset pickers stay family-only (combo's
  // shell is fixed by the surface renderer; presets are a family concept).
  const showIdentityRow =
    mode === 'combo' || mode === 'narrow-2' || mode === 'narrow-3' || mode === 'family';
  const showFamilyStructuralPickers =
    mode === 'narrow-2' || mode === 'narrow-3' || mode === 'family';
  const showToolbarToggles = mode !== 'gate-a-hub' && mode !== 'gate-a';

  const gateATrackValue: string =
    mode === 'gate-a-hub' ? 'gate-a-hub' :
    mode === 'gate-a-ion' ? 'gate-a-ion' :
    mode === 'artifact-playground' ? 'gate-a-ion' :
    'gate-a';

  const gateATrackSections: DropdownSection[] = [
    {
      heading: 'Gate A track',
      options: [
        { value: 'gate-a-hub', label: 'Hub', detail: 'Part 1 LOCKED · Part 2 ACTIVE' },
        { value: 'gate-a', label: 'Part 1 · Homepage', detail: 'Research substrate + locked homepage workflow' },
        { value: 'gate-a-ion', label: 'Part 2 · Ion', detail: 'Steps 2.1–2.4 complete · I1–I6 locked · 2.5 R1 next' },
      ],
    },
  ];

  const researchModeValue: string =
    mode === 'layout' ? 'layout' :
    mode === 'surface' ? 'surface' :
    mode === 'combo' ? 'combo' :
    mode === 'narrow-1' ? 'narrow-1' :
    mode === 'narrow-2' ? 'narrow-2' :
    mode === 'narrow-3' ? 'narrow-3' :
    mode === 'narrow-4' ? 'narrow-4' :
    '';

  // Collapsible toolbar — modeLabel + heldLabel stay visible; the toggle
  // rows collapse behind an accessible disclosure so the viewport under test
  // isn't dominated by chrome. Default collapsed; persisted in localStorage.
  const [togglesOpen, setTogglesOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const saved = window.localStorage.getItem('labshell.togglesOpen');
    return saved === 'true';
  });
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('labshell.togglesOpen', String(togglesOpen));
    }
  }, [togglesOpen]);

  // Publish the toolbar's real rendered height to CSS var --lab-shell-h so
  // GlobalNav can stick flush below it regardless of collapsed/expanded state
  // or wrap behavior at narrow viewports. When chrome is hidden the var is
  // set to 0px so GlobalNav sticks at top:0 with zero phantom gap.
  const shellRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;
    if (!chromeVisible) {
      document.documentElement.style.setProperty('--lab-shell-h', '0px');
      return;
    }
    const el = shellRef.current;
    if (!el) return;
    const publish = () => {
      document.documentElement.style.setProperty(
        '--lab-shell-h',
        `${el.getBoundingClientRect().height}px`,
      );
    };
    publish();
    const ro = new ResizeObserver(publish);
    ro.observe(el);
    return () => ro.disconnect();
  }, [togglesOpen, showIdentityRow, showFamilyStructuralPickers, mode, chromeVisible]);

  // Toolbar wrapper — sticky at the top. Hide via chromeVisible from the
  // LabChromeContext; the persistent floating pill toggles that state at
  // any cardScale (including standard) so the user can reclaim viewport
  // whenever they want.
  const toolbarWrapStyle: React.CSSProperties = {
    backgroundColor: 'var(--dir-recessed)',
    borderBottom: '1px solid var(--dir-border)',
    padding: togglesOpen ? '10px 48px' : '8px 48px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    fontFamily: IS,
    fontSize: 11,
    color: 'var(--dir-text-secondary)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--dir-bg)' }}>
      {chromeVisible && (
      <div
        ref={shellRef}
        style={toolbarWrapStyle}
      >
        {/* ── Header strip · always visible ─────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            minHeight: 20,
          }}
        >
          <Dropdown
            label="Gate A"
            value={gateATrackValue}
            sections={gateATrackSections}
            onChange={(v) =>
              navigate(
                v === 'gate-a-hub'
                  ? '/gate-a'
                  : v === 'gate-a-ion'
                    ? '/gate-a/ion'
                    : '/gate-a/homepage',
              )
            }
            width={150}
            popoverWidth={300}
          />
          {/* W1-D Dark Companion toggle · B2 build 2026-05-25.
              Lab-wide theme switch. Flips root data-direction between "w1" (light)
              and "w1-d" (dark). Opt-in only — no prefers-color-scheme wiring yet. */}
          <Dropdown
            label="Theme"
            value={directionMode}
            sections={[
              {
                heading: 'Direction mode · W1-D companion',
                options: [
                  {
                    value: 'light',
                    label: 'Light · W1',
                    detail: 'W1 Near-White Hold (locked canonical system). Default first paint.',
                  },
                  {
                    value: 'dark',
                    label: 'Dark · W1-D',
                    detail: 'W1-D Dark Companion (prototype). Warm dark ground · warm off-white ink · ink-as-accent inversion preserved · exception zone cross-derives to W1 light values.',
                  },
                ],
              },
            ]}
            onChange={(v) => setDirectionMode(v as DirectionMode)}
            width={130}
            popoverWidth={320}
          />
          {/* Card fit toggle · Hero #8 scaffolding 2026-05-26.
              Featured card in Narrow 4 extends past the viewport at current
              defaults. Compact constrains it to fit within one viewport.
              Lab-only; does NOT touch the locked Project Card spec. */}
          <Dropdown
            label="Card fit"
            value={cardFit}
            sections={[
              {
                heading: 'Featured card vertical fit',
                options: [
                  {
                    value: 'current',
                    label: 'Current',
                    detail: 'Featured card renders at its native height. Current Narrow 4 behavior preserved.',
                  },
                  {
                    value: 'compact',
                    label: 'Compact · fits viewport',
                    detail: 'Featured card\'s media area shrinks dynamically based on window.innerHeight — fits the whole card (image + text + proof) within one viewport at any screen size. Updates on resize. Text + proof unchanged. Lab artifact only.',
                  },
                ],
              },
            ]}
            onChange={(v) => setCardFit(v as CardFit)}
            width={170}
            popoverWidth={320}
          />
          {/* Media frame toggle · B3 build 2026-05-25.
              Light-content screenshots float against W1-D dark ground without
              a visible boundary — adds 1px --dir-border to media wrappers.
              Default 'none' preserves current behavior. Applied to Ion §02
              native treatment first; propagate after optical pass survives. */}
          <Dropdown
            label="Media frame"
            value={mediaFrame}
            sections={[
              {
                heading: 'Media frame · screenshot containment',
                options: [
                  {
                    value: 'none',
                    label: 'None (current)',
                    detail: 'No frame change. Current behavior — --dir-recessed background only (~1.05:1 against bg in W1-D; light screenshots float).',
                  },
                  {
                    value: 'hairline',
                    label: 'Hairline 1px',
                    detail: '1px --dir-border on the media wrapper. Quiet containment in dark; near-invisible in light (screenshot\'s own dark edge already does the work).',
                  },
                  {
                    value: 'mat',
                    label: 'Mat · padded',
                    detail: 'Outer padded wrapper (12px --dir-recessed mat + 1px --dir-border). Visible frame via layout, not contrast — works symmetrically in both themes. Compresses the image\'s render area by the mat thickness.',
                  },
                ],
              },
            ]}
            onChange={(v) => setMediaFrame(v as MediaFrameMode)}
            width={150}
            popoverWidth={320}
          />
          {gateATrackValue === 'gate-a' && (
            <Dropdown
              label="Mode"
              value={researchModeValue}
              placeholder="— Research mode —"
              sections={[
                {
                  heading: 'Research mode',
                  options: [
                    { value: 'layout', label: 'Layout', detail: '37 candidates · surface held at T1-S1' },
                    { value: 'surface', label: 'Surface', detail: '37 candidates · layout held at T1-L1' },
                    { value: 'combo', label: 'Combo', detail: '1,369 pairs · axes pair-native resolved' },
                    {
                      value: 'narrow-1',
                      label: 'Narrow 1',
                      detail: `${narrow1PairCount} pairs · first pass (${NARROWED_LAYOUT_IDS.length} × ${NARROWED_SURFACE_IDS.length})`,
                    },
                    {
                      value: 'narrow-2',
                      label: 'Narrow 2',
                      detail: `${narrow2PairCount} pairs · 2-family space (${NARROW2_LAYOUT_IDS.length} × ${FAMILY_IDS.length})`,
                    },
                    {
                      value: 'narrow-3',
                      label: 'Narrow 3',
                      detail: `${narrow3PairCount} renders · family × version (tile surface only)`,
                    },
                    {
                      value: 'narrow-4',
                      label: 'Narrow 4',
                      detail: `${narrow4PairCount} renders · card register · T8-S4 locked`,
                    },
                  ],
                },
              ]}
              onChange={(v) =>
                navigate(
                  v === 'surface'
                    ? '/surface'
                    : v === 'combo'
                      ? '/combo'
                      : v === 'narrow-1'
                        ? '/narrow-1'
                        : v === 'narrow-2'
                          ? '/narrow-2'
                          : v === 'narrow-3'
                            ? '/narrow-3'
                            : v === 'narrow-4'
                              ? '/narrow-4'
                              : '/',
                )
              }
              width={140}
              popoverWidth={340}
            />
          )}
          <span style={modeLabelStyle}>{modeLabel}</span>
          <span style={{ ...heldLabelStyle, marginLeft: 0 }}>{heldLabel}</span>
          {showToolbarToggles && <button
            type="button"
            onClick={() => setTogglesOpen((o) => !o)}
            aria-expanded={togglesOpen}
            aria-controls="lab-toolbar-panel"
            style={{
              marginLeft: 'auto',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              fontFamily: IS,
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--dir-text-primary)',
              backgroundColor: togglesOpen ? 'var(--dir-muted)' : 'transparent',
              border: '1px solid var(--dir-border)',
              borderRadius: 999,
              cursor: 'pointer',
            }}
          >
            <span>{togglesOpen ? 'Hide toggles' : 'Show toggles'}</span>
            <span aria-hidden style={{ fontSize: 9, lineHeight: 1 }}>
              {togglesOpen ? '▴' : '▾'}
            </span>
          </button>}
        </div>

        {/* ── Collapsible toolbar panel ─────────────────────────────────── */}
        {showToolbarToggles && togglesOpen && (
          <div
            id="lab-toolbar-panel"
            style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
          >
        {/* ── Row 1 · LAYOUT + PAIR-NATIVE ──────────────────────────────── */}
        <div style={toolbarRow}>
          {mode !== 'artifact-playground' && (
          <ToolbarGroup label="Layout">
            {mode === 'layout' && (
              <Dropdown
                label="Lane"
                value={lane}
                sections={laneSections}
                onChange={(v) => setLane(v as Lane)}
                width={160}
                popoverWidth={360}
                renderTrigger={(active) => active?.label ?? 'All'}
              />
            )}

            {mode === 'layout' && (
              <Dropdown
                label="Candidate"
                value={activeLayoutId}
                placeholder="— Layout index —"
                sections={layoutCandidateSections}
                onChange={(v) => {
                  if (!v) {
                    navigate('/');
                    return;
                  }
                  const c = candidates.find((x) => x.id === v);
                  if (c) navigate(`/layout/${c.tier}/${c.slot}`);
                }}
                width={300}
                popoverWidth={560}
                renderTrigger={(active) =>
                  active ? [active.meta, active.label].filter(Boolean).join(' · ') : '— Layout index —'
                }
              />
            )}

            {mode === 'surface' && (
              <Dropdown
                label="Candidate"
                value={activeSurfaceKey}
                placeholder="— Surface index —"
                sections={surfaceCandidateSections}
                onChange={(v) => {
                  if (!v) {
                    navigate('/surface');
                    return;
                  }
                  const [cid, variant] = v.split('/');
                  const c = surfaceCandidates.find((x) => x.id === cid);
                  if (!c) return;
                  navigate(
                    variant ? `/surface/${c.tier}/${c.slot}/${variant}` : `/surface/${c.tier}/${c.slot}`,
                  );
                }}
                width={320}
                popoverWidth={600}
                renderTrigger={(active) =>
                  active ? [active.meta, active.label].filter(Boolean).join(' · ') : '— Surface index —'
                }
              />
            )}

            {mode === 'combo' && (
              <>
                <Dropdown
                  label="Layout"
                  value={activeComboLayoutId}
                  placeholder="— Combo index —"
                  sections={comboLayoutSections}
                  onChange={(v) => {
                    if (!v) {
                      navigate('/combo');
                      return;
                    }
                    const sid = activeComboSurfaceId || 't1-s1';
                    navigate(`/combo/${v}/${sid}`);
                  }}
                  width={240}
                  popoverWidth={560}
                  renderTrigger={(active) =>
                    active ? [active.meta, active.label].filter(Boolean).join(' · ') : '— Combo index —'
                  }
                />
                <Dropdown
                  label="Surface"
                  value={activeComboSurfaceId}
                  placeholder="— Combo index —"
                  sections={comboSurfaceSections}
                  onChange={(v) => {
                    if (!v) {
                      navigate('/combo');
                      return;
                    }
                    const lid = activeComboLayoutId || 't1-l1';
                    navigate(`/combo/${lid}/${v}`);
                  }}
                  width={240}
                  popoverWidth={560}
                  renderTrigger={(active) =>
                    active ? [active.meta, active.label].filter(Boolean).join(' · ') : '— Combo index —'
                  }
                />
              </>
            )}

            {mode === 'narrow-1' && (
              <>
                <Dropdown
                  label="Layout"
                  value={activeNarrow1LayoutId}
                  placeholder="— Narrow 1 index —"
                  sections={narrow1LayoutSections}
                  onChange={(v) => {
                    if (!v) {
                      navigate('/narrow-1');
                      return;
                    }
                    const sid = activeNarrow1SurfaceId || NARROWED_SURFACE_IDS[0];
                    navigate(`/narrow-1/${v}/${sid}`);
                  }}
                  width={240}
                  popoverWidth={560}
                  renderTrigger={(active) =>
                    active ? [active.meta, active.label].filter(Boolean).join(' · ') : '— Narrow 1 index —'
                  }
                />
                <Dropdown
                  label="Surface"
                  value={activeNarrow1SurfaceId}
                  placeholder="— Narrow 1 index —"
                  sections={narrow1SurfaceSections}
                  onChange={(v) => {
                    if (!v) {
                      navigate('/narrow-1');
                      return;
                    }
                    const lid = activeNarrow1LayoutId || NARROWED_LAYOUT_IDS[0];
                    navigate(`/narrow-1/${lid}/${v}`);
                  }}
                  width={240}
                  popoverWidth={560}
                  renderTrigger={(active) =>
                    active ? [active.meta, active.label].filter(Boolean).join(' · ') : '— Narrow 1 index —'
                  }
                />
              </>
            )}

            {mode === 'narrow-2' && (
              <>
                <Dropdown
                  label="Layout"
                  value={activeNarrow2LayoutId}
                  placeholder="— Narrow 2 index —"
                  sections={narrow2LayoutSections}
                  onChange={(v) => {
                    if (!v) {
                      navigate('/narrow-2');
                      return;
                    }
                    const fid = activeNarrow2FamilyId || FAMILY_IDS[0];
                    navigate(`/narrow-2/${v}/${fid}`);
                  }}
                  width={240}
                  popoverWidth={560}
                  renderTrigger={(active) =>
                    active ? [active.meta, active.label].filter(Boolean).join(' · ') : '— Narrow 2 index —'
                  }
                />
                <Dropdown
                  label="Family"
                  value={activeNarrow2FamilyId}
                  placeholder="— Narrow 2 index —"
                  sections={narrow2FamilySections}
                  onChange={(v) => {
                    if (!v) {
                      navigate('/narrow-2');
                      return;
                    }
                    const lid = activeNarrow2LayoutId || NARROW2_LAYOUT_IDS[0];
                    navigate(`/narrow-2/${lid}/${v}`);
                  }}
                  width={180}
                  popoverWidth={420}
                  renderTrigger={(active) =>
                    active ? [active.meta, active.label].filter(Boolean).join(' · ') : '— Narrow 2 index —'
                  }
                />
              </>
            )}

            {mode === 'narrow-3' && (
              <>
                <Dropdown
                  label="Family"
                  value={activeNarrow3FamilyId}
                  placeholder="— Narrow 3 index —"
                  sections={narrow3FamilySections}
                  onChange={(v) => {
                    if (!v) {
                      navigate('/narrow-3');
                      return;
                    }
                    const vid = activeNarrow3VersionId || N3_VERSION_IDS[0];
                    navigate(`/narrow-3/${v}/${vid}`);
                  }}
                  width={220}
                  popoverWidth={420}
                  renderTrigger={(active) =>
                    active ? [active.meta, active.label].filter(Boolean).join(' · ') : '— Narrow 3 index —'
                  }
                />
                <Dropdown
                  label="Version"
                  value={activeNarrow3VersionId}
                  placeholder="— Narrow 3 index —"
                  sections={narrow3VersionSections}
                  onChange={(v) => {
                    if (!v) {
                      navigate('/narrow-3');
                      return;
                    }
                    const fid = activeNarrow3FamilyId || N3_FAMILY_IDS[0];
                    navigate(`/narrow-3/${fid}/${v}`);
                  }}
                  width={220}
                  popoverWidth={420}
                  renderTrigger={(active) =>
                    active ? [active.meta, active.label].filter(Boolean).join(' · ') : '— Narrow 3 index —'
                  }
                />
                <button
                  type="button"
                  onClick={() => navigate('/tiles')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 10px',
                    fontFamily: IS,
                    fontSize: 10,
                    fontWeight: 500,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'var(--dir-text-primary)',
                    backgroundColor: 'transparent',
                    border: '1px solid var(--dir-border)',
                    borderRadius: 999,
                    cursor: 'pointer',
                  }}
                  title="Jump to tiles family articulation page"
                >
                  Tiles family →
                </button>
              </>
            )}

            {mode === 'narrow-4' && (
              <>
                <Dropdown
                  label="Family"
                  value={activeNarrow4FamilyId}
                  placeholder="— Narrow 4 index —"
                  sections={narrow4FamilySections}
                  onChange={(v) => {
                    if (!v) {
                      navigate('/narrow-4');
                      return;
                    }
                    const vid = activeNarrow4VersionId || N3_VERSION_IDS[0];
                    navigate(`/narrow-4/${v}/${vid}`);
                  }}
                  width={220}
                  popoverWidth={420}
                  renderTrigger={(active) =>
                    active ? [active.meta, active.label].filter(Boolean).join(' · ') : '— Narrow 4 index —'
                  }
                />
                <Dropdown
                  label="Version"
                  value={activeNarrow4VersionId}
                  placeholder="— Narrow 4 index —"
                  sections={narrow4VersionSections}
                  onChange={(v) => {
                    if (!v) {
                      navigate('/narrow-4');
                      return;
                    }
                    const fid = activeNarrow4FamilyId || N3_FAMILY_IDS[0];
                    navigate(`/narrow-4/${fid}/${v}`);
                  }}
                  width={220}
                  popoverWidth={420}
                  renderTrigger={(active) =>
                    active ? [active.meta, active.label].filter(Boolean).join(' · ') : '— Narrow 4 index —'
                  }
                />
                <button
                  type="button"
                  onClick={() => navigate('/narrow-4/family')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 10px',
                    fontFamily: IS,
                    fontSize: 10,
                    fontWeight: 500,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'var(--dir-text-primary)',
                    backgroundColor: 'transparent',
                    border: '1px solid var(--dir-border)',
                    borderRadius: 999,
                    cursor: 'pointer',
                  }}
                  title="Jump to Narrow 4 family page · 8 shells under the narrow-4 register"
                >
                  Family →
                </button>
              </>
            )}

            {showFamilyStructuralPickers && (
              <>
                <Dropdown
                  label="Shell"
                  value={shellPicker}
                  sections={shellPickerSections}
                  onChange={(v) => setShellPicker(v as ShellPickerMode)}
                  width={160}
                  popoverWidth={340}
                />
                {shellPicker === 'manual' && (
                  <>
                    <Dropdown
                      label="Featured"
                      value={shellManual.featured ?? 'auto'}
                      sections={featuredShellSections}
                      onChange={(v) =>
                        setShellManual({
                          ...shellManual,
                          featured: v === 'auto' ? undefined : (v as ShellId),
                        })
                      }
                      width={140}
                      popoverWidth={340}
                    />
                    <Dropdown
                      label="Standard"
                      value={shellManual.standard ?? 'auto'}
                      sections={standardShellSections}
                      onChange={(v) =>
                        setShellManual({
                          ...shellManual,
                          standard: v === 'auto' ? undefined : (v as ShellId),
                        })
                      }
                      width={140}
                      popoverWidth={340}
                    />
                  </>
                )}
                <Dropdown
                  label="Preset"
                  value={preset}
                  sections={presetSections}
                  onChange={(v) => setPreset((v || 'custom') as PresetId)}
                  width={220}
                  popoverWidth={420}
                  renderTrigger={(active) =>
                    active ? [active.meta, active.label].filter(Boolean).join(' · ') : 'Custom'
                  }
                />
              </>
            )}
          </ToolbarGroup>
          )}

          {mode !== 'artifact-playground' && <GroupDivider />}

          {mode !== 'artifact-playground' && (
          <ToolbarGroup label="Pair-native">
            {mode !== 'narrow-4' && (
              <Dropdown
                label="Margin"
                value={margin}
                sections={marginSections}
                onChange={(v) => setMargin(v as MarginState)}
                width={200}
                popoverWidth={380}
                popoverAlign="left"
                renderTrigger={() =>
                  margin === 'native'
                    ? `Native · ${marginTokenLabel(marginResolved)}`
                    : marginTokenLabel(margin as MarginToken)
                }
              />
            )}
            {mode !== 'narrow-4' && mode !== 'gate-a-ion' && (
              <Dropdown
                label="CTA"
                value={cta}
                sections={ctaSections}
                onChange={(v) => setCta(v as CtaMode)}
                width={170}
                popoverWidth={420}
              />
            )}
            {mode !== 'narrow-4' && mode !== 'gate-a-ion' && (
              <Dropdown
                label="Tags"
                value={tagStyle}
                sections={tagStyleSections}
                onChange={(v) => setTagStyle(v as TagStyle)}
                width={170}
                popoverWidth={420}
              />
            )}
            {mode !== 'gate-a-ion' && (
              <Dropdown
                label="Media"
                value={media}
                sections={mediaSections}
                onChange={(v) => setMedia(v as MediaTruth)}
                width={200}
                popoverWidth={400}
              />
            )}
          </ToolbarGroup>
          )}

          {mode === 'narrow-4' && <GroupDivider />}

          {mode === 'narrow-4' && (
            <ToolbarGroup label="Narrow 4 · register">
              <Dropdown
                label="Featured aspect"
                value={narrow4FeaturedAspect}
                sections={aspectVarianceSections}
                onChange={(v) =>
                  setNarrow4FeaturedAspect(v as AspectVarianceState)
                }
                width={180}
                popoverWidth={320}
              />
              <Dropdown
                label="Standard aspect"
                value={narrow4StandardAspect}
                sections={aspectVarianceSections}
                onChange={(v) =>
                  setNarrow4StandardAspect(v as AspectVarianceState)
                }
                width={180}
                popoverWidth={320}
              />
              <Dropdown
                label="Eyebrow"
                value={eyebrowPlacement}
                sections={[
                  {
                    heading: 'Eyebrow placement',
                    options: [
                      {
                        value: 'option-a',
                        label: 'Option A · top-left',
                        detail: 'Eyebrow + title tight cluster above body · right col = proof only',
                      },
                      {
                        value: 'option-b',
                        label: 'Option B · right col',
                        detail: 'Eyebrow in right column · left col = title + body only',
                      },
                    ],
                  },
                ]}
                onChange={(v) => setEyebrowPlacement(v as EyebrowPlacement)}
                width={200}
                popoverWidth={360}
              />
              <Dropdown
                label="Ftr proof"
                value={featuredProofMode}
                sections={[
                  {
                    heading: 'Featured proof mode',
                    options: [
                      {
                        value: 'native',
                        label: 'Native · stacked 15',
                        detail: 'Locked compressed proof — IS 15/500 stacked, value+label+sub',
                      },
                      {
                        value: 'inline-10',
                        label: 'Inline · IS 10',
                        detail: 'Each stat as inline single line — "2 SHIPPED SURFACES (SLACK + CANVAS)" · stats stacked vertically · IS 10/500/UC',
                      },
                      {
                        value: 'stacked-13',
                        label: 'Stacked · IS 13',
                        detail: 'Path A surgical — IS 13/500 tabular, value+label+sub stacked. Requires Type lock revision adding 13 to compressed proof exception.',
                      },
                    ],
                  },
                ]}
                onChange={(v) => setFeaturedProofMode(v as Narrow4FeaturedProofMode)}
                width={180}
                popoverWidth={360}
              />
            </ToolbarGroup>
          )}

          {mode === 'gate-a-ion' && <GroupDivider />}

          {mode === 'gate-a-ion' && (
            <ToolbarGroup label="Gate A · Ion">
              <Dropdown
                label="Pull quote"
                value={pullQuoteRegister}
                sections={[
                  {
                    heading: 'Pull quote register · Cycle 4 A/B test',
                    options: [
                      { value: 'is-15-italic', label: 'IS 15 italic', detail: 'Sans italic body — modern restraint, no surgical revision. Side line + indent + italic carry the quote signal.' },
                      { value: 'ise-15-italic', label: 'ISe 15 italic', detail: 'Serif italic at body size — surgical revisions · adds ISe 15 + opens italic for Pull quote scoped. Tier-clear (no heading competition).' },
                      { value: 'ise-22-upright', label: 'ISe 22 upright', detail: 'Serif at sub-section size — currently applied. Tier-conflicts with sub-section register.' },
                      { value: 'ise-18-upright', label: 'ISe 18 upright', detail: 'Surgical revision · adds ISe 18 to ladder. Mid-tier serif, no italic.' },
                      { value: 'ise-18-italic', label: 'ISe 18 italic', detail: 'Cycle 4 close lock default · Surgical revisions add ISe 18 + open italic for Pull quote register. Editorial gold standard (NYT / Atlantic / Stripe Press).' },
                      { value: 'ise-22-italic', label: 'ISe 22 italic', detail: 'Post-Tiempos-comparison candidate 2026-05-13 · Instrument Serif is a display face below its intended size envelope at 18; 22 pushes it closer to design intent. Italic differentiates from ISe 22 upright sub-section register, so original Cycle 4 tier-conflict concern doesn’t actually fire.' },
                    ],
                  },
                ]}
                onChange={(v) => setPullQuoteRegister(v as PullQuoteRegisterTest)}
                width={140}
                popoverWidth={400}
              />
              <Dropdown
                label="Inline emph"
                value={inlineEmphasis}
                sections={[
                  {
                    heading: 'Inline emphasis · Cycle 4 A/B test',
                    options: [
                      { value: 'italic', label: 'Italic IS', detail: 'Editorial — italic body. Pairs with serif heading hierarchy. 1 cue (style). 1 surgical revision.' },
                      { value: 'bold', label: 'Bold IS 600', detail: 'Functional — borrows Sub-heading utility weight inline. 1 cue (weight). Best for scan-reading. 1 surgical revision.' },
                      { value: 'italic-bold', label: 'Italic + Bold', detail: 'Max emphasis — italic + IS 600. 2 cues from body (style + weight). Editorial gold standard for highest-emphasis phrases (NYT longform). 2 surgical revisions.' },
                      { value: 'native', label: 'Native (current)', detail: 'Whatever inline emphasis is rendering as right now (IS 15/600 bold).' },
                    ],
                  },
                ]}
                onChange={(v) => setInlineEmphasis(v as InlineEmphasisTest)}
                width={120}
                popoverWidth={360}
              />
              <Dropdown
                label="Eyebrow"
                value={gateAIonEyebrowStyle}
                sections={[
                  {
                    heading: 'Eyebrow style',
                    options: [
                      { value: 'pills-outlined', label: 'Native · Pills outlined', detail: 'Locked default — chip chrome, outlined border' },
                      { value: 'slash', label: 'Slash', detail: 'Inline text, slash delimiter' },
                      { value: 'dot', label: 'Dot', detail: 'Inline text, dot delimiter' },
                      { value: 'plain', label: 'Plain', detail: 'Inline text, no delimiter' },
                      { value: 'hidden', label: 'Hidden', detail: 'Eyebrow suppressed' },
                    ],
                  },
                ]}
                onChange={(v) => setGateAIonEyebrowStyle(v as GateAIonEyebrowStyle)}
                width={100}
                popoverWidth={320}
              />
              <Dropdown
                label="TL;DR"
                value={gateAIonTldrStyle}
                sections={[
                  {
                    heading: 'TL;DR treatment',
                    options: [
                      { value: 'left-border', label: 'Native · Left border', detail: 'Locked default — 2px left rule + raised bg' },
                      { value: 'label-split', label: 'Label split', detail: 'TL;DR label left / pipe / content right' },
                      { value: 'plain', label: 'Plain', detail: 'No chrome, IS 15 text-primary' },
                      { value: 'soft-box', label: 'Soft box', detail: 'Full border + light bg tint' },
                      { value: 'thick-rule', label: 'Thick rule', detail: 'Top 2px + bottom 1px rule, no bg' },
                      { value: 'minimal', label: 'Minimal', detail: 'IS 10 UC label above, content below' },
                    ],
                  },
                ]}
                onChange={(v) => setGateAIonTldrStyle(v as GateAIonTldrStyle)}
                width={90}
                popoverWidth={340}
              />
              <Dropdown
                label="§ Style"
                value={gateAIonSectionNumberStyle}
                sections={[
                  {
                    heading: 'Section number style',
                    options: [
                      { value: 'hidden', label: 'Native · Hidden', detail: 'Locked default — Bill Guo / Rachel Chen rec (no section ordinals)' },
                      { value: 'native', label: 'Above heading', detail: 'IS 10 500 UC, --dir-detail above h2' },
                      { value: 'inline-dash', label: 'Inline dash', detail: '"01 — Heading" — number + dash on same line as h2' },
                      { value: 'inline-dot', label: 'Inline dot', detail: '"01 · Heading" — number + interpunct on same line' },
                      { value: 'pill', label: 'Pill badge', detail: 'Numbered chip before heading (--dir-chip register)' },
                      { value: 'large', label: 'Large display', detail: 'IS 28 300 above heading — editorial anchor' },
                      { value: 'marginal', label: 'Marginal numeral', detail: 'Ordinal in left margin opposite heading (D1)' },
                      { value: 'rail-internal', label: 'Rail-internal ordinal', detail: '"01 Overview" in TOC, "Overview" in heading (D3)' },
                    ],
                  },
                ]}
                onChange={(v) => setGateAIonSectionNumberStyle(v as GateAIonSectionNumberStyle)}
                width={100}
                popoverWidth={380}
              />
              <Dropdown
                label="Progress"
                value={gateAIonProgressTrack}
                sections={[
                  {
                    heading: 'Reading-progress track',
                    options: [
                      { value: 'hidden', label: 'Native · Hidden', detail: 'Locked default — Bill Guo / Rachel Chen rec (no progress bar)' },
                      { value: 'bar', label: 'Bar', detail: 'Nav-lab default — 1px track + filled progress (80ms linear)' },
                      { value: 'dot', label: 'Dot', detail: 'Nav-lab dot variant — 2px track + sliding 8x8 dot (100ms linear)' },
                      { value: 'top-bar', label: 'Top bar', detail: 'Medium register — fixed 2px bar at viewport top' },
                      { value: 'thick-rail', label: 'Thick rail', detail: '3px heavier presence above TOC' },
                      { value: 'section-dots', label: 'Section dots', detail: 'N dots per section, filled as scrolled past' },
                      { value: 'numbered', label: 'Numbered', detail: '"01 / 10" scrollspy text register' },
                      { value: 'hakim-path', label: 'Hakim path', detail: 'Hakim El Hattab — SVG path drawing through stacked anchors' },
                    ],
                  },
                ]}
                onChange={(v) => setGateAIonProgressTrack(v as GateAIonProgressTrack)}
                width={100}
                popoverWidth={380}
              />
              <Dropdown
                label="÷ Inter"
                value={gateAIonDividerStyle}
                sections={[
                  {
                    heading: 'Inter-section divider',
                    options: [
                      { value: 'border', label: 'Native · Border', detail: 'Locked default — 1px solid var(--dir-border)' },
                      { value: 'dotted', label: 'Dotted', detail: '1px dotted var(--dir-border)' },
                      { value: 'dashed', label: 'Dashed', detail: '1px dashed var(--dir-border)' },
                      { value: 'thick', label: 'Thick', detail: '2px solid var(--dir-border)' },
                      { value: 'none', label: 'None', detail: 'No divider between sections' },
                    ],
                  },
                ]}
                onChange={(v) => setGateAIonDividerStyle(v as GateAIonDividerStyle)}
                width={90}
                popoverWidth={300}
              />
              <Dropdown
                label="÷ Intra"
                value={gateAIonWithinSectionDivider}
                sections={[
                  {
                    heading: 'Within-section divider',
                    options: [
                      { value: 'none', label: 'Native · None', detail: 'Locked default — spacing only, no rule' },
                      { value: 'thin-rule', label: 'Thin rule', detail: '1px solid var(--dir-border) between content blocks' },
                      { value: 'muted-rule', label: 'Muted rule', detail: '1px solid var(--dir-muted) — more recessed' },
                      { value: 'dotted', label: 'Dotted', detail: '1px dotted var(--dir-border)' },
                      { value: 'thick-rule', label: 'Thick rule', detail: '2px solid var(--dir-border) — structural emphasis' },
                    ],
                  },
                ]}
                onChange={(v) => setGateAIonWithinSectionDivider(v as GateAIonWithinSectionDivider)}
                width={90}
                popoverWidth={360}
              />
              <Dropdown
                label="Height"
                value={String(gateAIonHeroHeight)}
                sections={[
                  {
                    heading: 'Hero image height',
                    options: [
                      { value: '340', label: 'Native · 340px', detail: 'Locked default — standard hero' },
                      { value: '280', label: '280px', detail: 'Compact hero' },
                      { value: '420', label: '420px', detail: 'Tall hero' },
                      { value: '520', label: '520px', detail: 'Full hero' },
                      { value: 'natural', label: 'Natural · no crop', detail: 'Image at intrinsic aspect ratio — never cropped (overrides aspect toggle)' },
                    ],
                  },
                ]}
                onChange={(v) => setGateAIonHeroHeight(v === 'natural' ? 'natural' : (Number(v) as GateAIonHeroHeight))}
                width={80}
                popoverWidth={280}
              />
              <Dropdown
                label="Pos."
                value={gateAIonHeroPosition}
                sections={[
                  {
                    heading: 'Hero image objectPosition',
                    options: [
                      { value: 'top', label: 'Native · Top', detail: 'Locked default — objectPosition: top' },
                      { value: 'center', label: 'Center', detail: 'objectPosition: center' },
                      { value: 'bottom', label: 'Bottom', detail: 'objectPosition: bottom' },
                    ],
                  },
                ]}
                onChange={(v) => setGateAIonHeroPosition(v as GateAIonHeroPosition)}
                width={80}
                popoverWidth={280}
              />
              <Dropdown
                label="Aspect"
                value={gateAIonHeroAspect}
                sections={[
                  {
                    heading: 'Hero mode',
                    options: [
                      { value: 'native', label: 'Native · Fixed height', detail: 'Locked default — pixel height from Height toggle' },
                      { value: 'fill-cell', label: 'Fill cell', detail: 'Intrinsic ratio — width 100%, height auto' },
                    ],
                  },
                  {
                    heading: 'Fixed aspect ratio',
                    options: [
                      { value: 'widescreen', label: 'Widescreen 16:9', detail: 'TV / video standard' },
                      { value: 'cinematic', label: 'Cinematic 21:9', detail: 'Film-wide' },
                      { value: 'anamorphic', label: 'Anamorphic 2.39:1', detail: 'Very wide film' },
                      { value: 'golden', label: 'Golden 1.618:1', detail: 'Classical proportion' },
                      { value: 'academy', label: 'Academy 4:3', detail: 'Vintage / broadcast' },
                      { value: 'square', label: 'Square 1:1', detail: 'Editorial grid' },
                      { value: 'portrait', label: 'Portrait 9:16', detail: 'Vertical' },
                    ],
                  },
                ]}
                onChange={(v) => setGateAIonHeroAspect(v as GateAIonHeroAspect)}
                width={100}
                popoverWidth={320}
              />
              <Dropdown
                label="Radius"
                value={String(gateAIonBorderRadius)}
                sections={[
                  {
                    heading: 'Corner radius — images + boxes',
                    options: [
                      { value: '2', label: 'Native · 2 Near-sharp', detail: 'Locked default — minimal rounding' },
                      { value: '0', label: '0 · Sharp', detail: 'No rounding — fully angular' },
                      { value: '4', label: '4 · Subtle', detail: 'Slight softening' },
                      { value: '8', label: '8 · Moderate', detail: 'Visible round corners' },
                      { value: '12', label: '12 · Rounded', detail: 'Card-like rounding' },
                      { value: '16', label: '16 · Very rounded', detail: 'Prominent corners' },
                      { value: '24', label: '24 · Large', detail: 'Strong rounding' },
                      { value: '32', label: '32 · Very large', detail: 'Near-pill on medium elements' },
                      { value: '9999', label: '9999 · Pill', detail: 'Maximum rounding' },
                    ],
                  },
                ]}
                onChange={(v) => setGateAIonBorderRadius(Number(v) as GateAIonBorderRadius)}
                width={90}
                popoverWidth={320}
              />
            </ToolbarGroup>
          )}

          {mode === 'artifact-playground' && (
            <ToolbarGroup label="Artifact playground">
              <Dropdown
                label="Artifact"
                value={artifactPlaygroundArtifact}
                sections={ARTIFACT_SECTIONS}
                onChange={(v) => setArtifactPlaygroundArtifact(v as ArtifactId)}
                width={220}
                popoverWidth={440}
              />
              {artifactPlaygroundArtifact === 'A1' && (
                <>
                  <Dropdown
                    label="Variant"
                    value={a1.variant}
                    sections={[
                      {
                        heading: 'Register',
                        options: [
                          { value: 'grid', label: 'Native · Grid', detail: '2D matrix' },
                          { value: 'linear', label: 'Editorial linear', detail: 'Persona headers + horizontal cluster rows' },
                          { value: 'compact', label: 'Compact', detail: 'Smaller register for narrow contexts' },
                          { value: 'heatmap', label: 'Heatmap-tinted', detail: 'Cluster bg tinted by note density' },
                        ],
                      },
                    ]}
                    onChange={(v) => setA1({ variant: v as typeof a1.variant })}
                    width={150}
                    popoverWidth={340}
                  />
                  <Dropdown
                    label="Personas"
                    value={String(a1.personaCount)}
                    sections={[
                      {
                        heading: 'Persona count',
                        options: [
                          { value: '1', label: '1', detail: 'Design-heavy only' },
                          { value: '2', label: 'Native · 2', detail: 'Both personas' },
                          { value: '3', label: '3', detail: 'N/A — source has 2 personas (clamps)' },
                        ],
                      },
                    ]}
                    onChange={(v) => setA1({ personaCount: Number(v) as 1 | 2 | 3 })}
                    width={90}
                    popoverWidth={280}
                  />
                  <Dropdown
                    label="Clusters"
                    value={String(a1.clusterCount)}
                    sections={[
                      {
                        heading: 'Clusters per persona',
                        options: [
                          { value: '2', label: '2', detail: 'First two clusters only' },
                          { value: '3', label: 'Native · 3', detail: 'All three' },
                          { value: '4', label: '4', detail: 'N/A — source has 3 clusters (clamps)' },
                        ],
                      },
                    ]}
                    onChange={(v) => setA1({ clusterCount: Number(v) as 2 | 3 | 4 })}
                    width={80}
                    popoverWidth={280}
                  />
                  <Dropdown
                    label="Notes / cluster"
                    value={String(a1.notesPerCluster)}
                    sections={[
                      {
                        heading: 'Notes per cluster',
                        options: [
                          { value: '2', label: '2', detail: 'First two notes' },
                          { value: '3', label: '3', detail: 'First three notes' },
                          { value: '4', label: '4', detail: 'First four notes' },
                          { value: '5', label: 'Native · 5', detail: 'All available (cluster sizes vary 2-6)' },
                        ],
                      },
                    ]}
                    onChange={(v) => setA1({ notesPerCluster: Number(v) as 2 | 3 | 4 | 5 })}
                    width={110}
                    popoverWidth={280}
                  />
                  <Dropdown
                    label="Attribution"
                    value={a1.attribution}
                    sections={[
                      {
                        heading: 'Author attribution',
                        options: [
                          { value: 'show', label: 'Native · Show', detail: 'Real research participant names' },
                          { value: 'hide', label: 'Hide', detail: 'Quote text only' },
                        ],
                      },
                    ]}
                    onChange={(v) => setA1({ attribution: v as 'show' | 'hide' })}
                    width={120}
                    popoverWidth={320}
                  />
                  <Dropdown
                    label="Density"
                    value={a1.density}
                    sections={[
                      {
                        heading: 'Density mode (locked spec — spacing-layout-rhythm.md §C)',
                        options: [
                          { value: 'dense', label: 'Dense', detail: 'Component 12 · Block 16 · Section 32' },
                          { value: 'standard', label: 'Native · Standard', detail: 'Component 16 · Block 24 · Section 48' },
                          { value: 'airy', label: 'Airy', detail: 'Component 16 · Block 32 · Section 64' },
                        ],
                      },
                    ]}
                    onChange={(v) => setA1({ density: v as typeof a1.density })}
                    width={140}
                    popoverWidth={420}
                  />
                  <Dropdown
                    label="Background"
                    value={a1.background}
                    sections={[
                      {
                        heading: 'Cluster background treatment',
                        options: [
                          { value: 'none', label: 'Native · None', detail: 'No fill, no border' },
                          { value: 'raised', label: 'Raised', detail: 'var(--dir-raised) cluster bg' },
                          { value: 'dashed', label: 'Dashed border', detail: '1px dashed var(--dir-border)' },
                        ],
                      },
                    ]}
                    onChange={(v) => setA1({ background: v as typeof a1.background })}
                    width={130}
                    popoverWidth={320}
                  />
                  <Dropdown
                    label="Note length"
                    value={a1.noteLength}
                    sections={[
                      {
                        heading: 'Post-it text length',
                        options: [
                          { value: 'short', label: 'Short', detail: 'Truncate at 60 chars' },
                          { value: 'medium', label: 'Medium', detail: 'Truncate at 120 chars' },
                          { value: 'long', label: 'Native · Long', detail: 'Full source text (no truncation)' },
                        ],
                      },
                    ]}
                    onChange={(v) => setA1({ noteLength: v as typeof a1.noteLength })}
                    width={120}
                    popoverWidth={320}
                  />
                  <Dropdown
                    label="Connectors"
                    value={a1.connectors}
                    sections={[
                      {
                        heading: 'Cluster connectors',
                        options: [
                          { value: 'off', label: 'Native · Off', detail: 'No connector glyphs between clusters' },
                          { value: 'lines', label: 'Lines', detail: 'Thin vertical rules between clusters' },
                          { value: 'arrows', label: 'Arrows', detail: 'Directional chevrons between clusters' },
                        ],
                      },
                    ]}
                    onChange={(v) => setA1({ connectors: v as typeof a1.connectors })}
                    width={120}
                    popoverWidth={320}
                  />
                </>
              )}
              {artifactPlaygroundArtifact === 'B1' && (
                <>
                  <Dropdown
                    label="Variant"
                    value={b1.variant}
                    sections={[
                      {
                        heading: 'Register',
                        options: [
                          { value: 'classic', label: 'Native · 3-circle classic', detail: 'Equilateral overlap' },
                          { value: 'overlap-focused', label: '2-circle overlap', detail: 'Two circles, vesica emphasis' },
                          { value: 'four-circle', label: '4-circle complex', detail: '2x2 — synthesized 4-tool landscape (illustrative)' },
                          { value: 'inverse', label: 'Inverse Venn', detail: 'Focal item sits OUTSIDE central overlap' },
                        ],
                      },
                    ]}
                    onChange={(v) => setB1({ variant: v as typeof b1.variant })}
                    width={180}
                    popoverWidth={400}
                  />
                  <Dropdown
                    label="Ion source"
                    value={b1.ionSource}
                    sections={[
                      {
                        heading: 'Real Ion Venn dataset',
                        options: [
                          { value: 'leyi', label: 'Native · Product-pivot', detail: 'Design tools / Vibe code / UI Dev tools — "Product pivot" arrow' },
                          { value: 'cocreate', label: '★ CoCreate Ion-positioning', detail: 'Figma / Code Editors / ChatGPT-Claude — "Ion is here"' },
                        ],
                      },
                    ]}
                    onChange={(v) => setB1({ ionSource: v as typeof b1.ionSource })}
                    width={170}
                    popoverWidth={420}
                  />
                  <Dropdown
                    label="Label position"
                    value={b1.labelPosition}
                    sections={[
                      {
                        heading: 'Circle label placement',
                        options: [
                          { value: 'inside', label: 'Inside circle', detail: 'Label sits in unique region of each circle' },
                          { value: 'outside', label: 'Native · Outside', detail: 'Label sits outside circle edge' },
                          { value: 'leader-line', label: 'Leader-line', detail: 'Outside label + thin connector to circle' },
                        ],
                      },
                    ]}
                    onChange={(v) => setB1({ labelPosition: v as typeof b1.labelPosition })}
                    width={140}
                    popoverWidth={360}
                  />
                  <Dropdown
                    label="Annotation"
                    value={b1.annotationPointer}
                    sections={[
                      {
                        heading: 'Annotation pointer',
                        options: [
                          { value: 'off', label: 'Off', detail: 'No annotation rendered' },
                          { value: 'arrow', label: 'Native · Arrow', detail: 'Text + line with arrowhead pointing at marker' },
                          { value: 'callout', label: 'Direct callout', detail: 'Text only, no leader line' },
                        ],
                      },
                    ]}
                    onChange={(v) => setB1({ annotationPointer: v as typeof b1.annotationPointer })}
                    width={130}
                    popoverWidth={380}
                  />
                  <Dropdown
                    label="Center"
                    value={b1.centerMarker}
                    sections={[
                      {
                        heading: 'Center marker',
                        options: [
                          { value: 'none', label: 'None', detail: 'No central marker' },
                          { value: 'icon', label: 'Native · Icon', detail: '✦ glyph + small caps label (Ion register)' },
                          { value: 'box', label: 'Labeled box', detail: 'Rectangle + text, raised bg + border' },
                        ],
                      },
                    ]}
                    onChange={(v) => setB1({ centerMarker: v as typeof b1.centerMarker })}
                    width={110}
                    popoverWidth={340}
                  />
                  <Dropdown
                    label="Tinted overlap"
                    value={b1.tintedOverlap}
                    sections={[
                      {
                        heading: 'Overlap region tint',
                        options: [
                          { value: 'off', label: 'Native · Off', detail: 'Stroke-only circles, transparent fill' },
                          { value: 'on', label: 'On', detail: '--dir-raised fill + mix-blend-mode multiply (W1 step tokens darken naturally)' },
                        ],
                      },
                    ]}
                    onChange={(v) => setB1({ tintedOverlap: v as typeof b1.tintedOverlap })}
                    width={140}
                    popoverWidth={420}
                  />
                  <Dropdown
                    label="Stroke"
                    value={b1.circleStroke}
                    sections={[
                      {
                        heading: 'Circle stroke style',
                        options: [
                          { value: 'solid', label: 'Native · Solid', detail: '1px solid var(--dir-text-primary)' },
                          { value: 'dashed', label: 'Dashed', detail: '1px dashed (8 4 pattern, locked tokens)' },
                          { value: 'hand-drawn', label: 'Hand-drawn-feel', detail: 'feTurbulence + feDisplacementMap perturbation (Holmes register)' },
                        ],
                      },
                    ]}
                    onChange={(v) => setB1({ circleStroke: v as typeof b1.circleStroke })}
                    width={150}
                    popoverWidth={420}
                  />
                  <Dropdown
                    label="Label style"
                    value={b1.labelStyle}
                    sections={[
                      {
                        heading: 'Label case register',
                        options: [
                          { value: 'caps', label: 'Caps', detail: 'IS 10/500/0.12em uppercase (Meta/Label/UI)' },
                          { value: 'sentence', label: 'Native · Sentence', detail: 'IS 13/300 (Dense Body)' },
                        ],
                      },
                    ]}
                    onChange={(v) => setB1({ labelStyle: v as typeof b1.labelStyle })}
                    width={130}
                    popoverWidth={380}
                  />
                </>
              )}
              {artifactPlaygroundArtifact === 'C1' && (
                <>
                  <Dropdown
                    label="Variant"
                    value={c1.variant}
                    sections={[
                      {
                        heading: 'Register',
                        options: [
                          { value: 'horizontal', label: 'Native · Horizontal flow', detail: '5 steps left-to-right — Ion CoCreate register' },
                          { value: 'vertical', label: 'Vertical funnel', detail: 'Classic narrowing shape — width tracks retention' },
                          { value: 'stage-cards', label: 'Stage-cards', detail: 'Richer descriptive cards — IS 28 numerals + Dense Body label' },
                          { value: 'annotated', label: 'Annotated', detail: 'Both Ion slides simultaneously — current state + strategic move' },
                        ],
                      },
                    ]}
                    onChange={(v) => setC1({ variant: v as typeof c1.variant })}
                    width={170}
                    popoverWidth={400}
                  />
                  <Dropdown
                    label="Stage count"
                    value={String(c1.stageCount)}
                    sections={[
                      {
                        heading: 'Stages shown',
                        options: [
                          { value: '3', label: '3', detail: 'First 3 stages' },
                          { value: '4', label: '4', detail: 'First 4 stages' },
                          { value: '5', label: 'Native · 5', detail: 'All 5 (Ion register)' },
                        ],
                      },
                    ]}
                    onChange={(v) => setC1({ stageCount: Number(v) as 3 | 4 | 5 })}
                    width={110}
                    popoverWidth={280}
                  />
                  <Dropdown
                    label="Annotation"
                    value={c1.annotationPointer}
                    sections={[
                      {
                        heading: 'Annotation pointer',
                        options: [
                          { value: 'off', label: 'Off', detail: 'No annotation rendered' },
                          { value: 'arrow', label: 'Arrow', detail: 'Text + down-arrow to target stage' },
                          { value: 'sticker', label: 'Native · Sticker callout', detail: 'Bordered text box + arrow (Ion register)' },
                        ],
                      },
                    ]}
                    onChange={(v) => setC1({ annotationPointer: v as typeof c1.annotationPointer })}
                    width={150}
                    popoverWidth={400}
                  />
                  <Dropdown
                    label="Annot. step"
                    value={c1.annotationStep}
                    sections={[
                      {
                        heading: 'Annotation target stage',
                        options: [
                          { value: '01', label: 'Native · 01', detail: 'PRD/Founder message — "What if Ion starts here?"' },
                          { value: '02', label: '02', detail: 'Research' },
                          { value: '03', label: '03', detail: 'Ideation — alternate Ion slide ("Ion starts here")' },
                          { value: '04', label: '04', detail: 'Iterations' },
                          { value: '05', label: '05', detail: 'Handoff' },
                        ],
                      },
                    ]}
                    onChange={(v) => setC1({ annotationStep: v as typeof c1.annotationStep })}
                    width={120}
                    popoverWidth={420}
                  />
                  <Dropdown
                    label="Annot. text"
                    value={c1.annotationVariant}
                    sections={[
                      {
                        heading: 'Annotation slide variant',
                        options: [
                          { value: 'what-if', label: 'Native · What if Ion starts here?', detail: 'Strategic-move slide (Ion register)' },
                          { value: 'ion-here', label: 'Ion starts here', detail: 'Current-state slide (alternate)' },
                        ],
                      },
                    ]}
                    onChange={(v) => setC1({ annotationVariant: v as typeof c1.annotationVariant })}
                    width={150}
                    popoverWidth={420}
                  />
                  <Dropdown
                    label="Card style"
                    value={c1.stageCardStyle}
                    sections={[
                      {
                        heading: 'Stage card register',
                        options: [
                          { value: 'minimal', label: 'Minimal', detail: 'No border, no fill — text only' },
                          { value: 'framed', label: 'Native · Framed', detail: '1px border + raised bg (Ion register)' },
                          { value: 'illustrated', label: 'Illustrated', detail: 'Reserved — pending native approval' },
                        ],
                      },
                    ]}
                    onChange={(v) => setC1({ stageCardStyle: v as typeof c1.stageCardStyle })}
                    width={130}
                    popoverWidth={380}
                  />
                  <Dropdown
                    label="Conversion %"
                    value={c1.conversionPct}
                    sections={[
                      {
                        heading: 'Drop-off percentages',
                        options: [
                          { value: 'hidden', label: 'Native · Hidden', detail: 'Ion narrative funnel — no analytics %' },
                          { value: 'shown', label: 'Shown', detail: 'Mixpanel-style conversion % per stage (reserved)' },
                        ],
                      },
                    ]}
                    onChange={(v) => setC1({ conversionPct: v as typeof c1.conversionPct })}
                    width={130}
                    popoverWidth={380}
                  />
                </>
              )}
              {artifactPlaygroundArtifact === 'C2' && (
                <>
                  <Dropdown
                    label="Variant"
                    value={c2.variant}
                    sections={[
                      {
                        heading: 'Register',
                        options: [
                          { value: 'annotated', label: 'Native · Annotated horizontal', detail: '4 phases as columns with friction overlay + primary emphasis (Ion Demo Day register)' },
                          { value: 'horizontal-columns', label: 'Horizontal columns', detail: 'Same shape, uniform marker weight (no primary emphasis)' },
                          { value: 'vertical-timeline', label: 'Vertical timeline', detail: 'Phases as rows on a vertical rail, items horizontal' },
                          { value: 'heatmap', label: 'Heatmap', detail: 'Phase bg tinted by friction count — W1 step tokens' },
                          { value: 'emotion-curve', label: 'Emotion-curve overlay', detail: 'NN/g register — SVG line dipping at high-friction phases' },
                        ],
                      },
                    ]}
                    onChange={(v) => setC2({ variant: v as typeof c2.variant })}
                    width={170}
                    popoverWidth={420}
                  />
                  <Dropdown
                    label="Phases"
                    value={String(c2.phaseCount)}
                    sections={[
                      {
                        heading: 'Phase count',
                        options: [
                          { value: '3', label: '3', detail: 'First 3 phases' },
                          { value: '4', label: 'Native · 4', detail: 'All 4 (Ion register)' },
                          { value: '5', label: '5', detail: 'N/A — Ion data has 4 (clamps)' },
                        ],
                      },
                    ]}
                    onChange={(v) => setC2({ phaseCount: Number(v) as 3 | 4 | 5 })}
                    width={90}
                    popoverWidth={280}
                  />
                  <Dropdown
                    label="Friction"
                    value={c2.frictionOverlay}
                    sections={[
                      {
                        heading: 'Friction overlay',
                        options: [
                          { value: 'on', label: 'Native · On', detail: 'Friction labels overlay (Demo Day Slide 2 register)' },
                          { value: 'off', label: 'Off', detail: 'Bare workflow items (Demo Day Slide 1 register)' },
                        ],
                      },
                    ]}
                    onChange={(v) => setC2({ frictionOverlay: v as typeof c2.frictionOverlay })}
                    width={110}
                    popoverWidth={400}
                  />
                  <Dropdown
                    label="Marker"
                    value={c2.frictionMarkerStyle}
                    sections={[
                      {
                        heading: 'Friction marker style',
                        options: [
                          { value: 'colored-rule', label: 'Native · Colored-rule', detail: '2px primary / 1px detail left border (W1 register, no red highlight)' },
                          { value: 'dashed-rule', label: 'Dashed rule', detail: '1px dashed --dir-detail left border' },
                          { value: 'numbered', label: 'Numbered', detail: 'Prepend "01" "02" caps eyebrow' },
                          { value: 'iconified', label: 'Iconified', detail: 'Prepend ▸ glyph in --dir-detail' },
                        ],
                      },
                    ]}
                    onChange={(v) => setC2({ frictionMarkerStyle: v as typeof c2.frictionMarkerStyle })}
                    width={150}
                    popoverWidth={420}
                  />
                  <Dropdown
                    label="Phase label"
                    value={c2.phaseLabelStyle}
                    sections={[
                      {
                        heading: 'Phase header register',
                        options: [
                          { value: 'caps', label: 'Native · Caps', detail: 'IS 10/500/0.12em uppercase (Meta/Label/UI)' },
                          { value: 'sentence', label: 'Sentence', detail: 'IS 13/600 sub-heading register' },
                        ],
                      },
                    ]}
                    onChange={(v) => setC2({ phaseLabelStyle: v as typeof c2.phaseLabelStyle })}
                    width={130}
                    popoverWidth={380}
                  />
                  <Dropdown
                    label="Emotion curve"
                    value={c2.emotionCurve}
                    sections={[
                      {
                        heading: 'NN/g emotion-curve overlay',
                        options: [
                          { value: 'hidden', label: 'Native · Hidden', detail: 'Ion register — no emotion track' },
                          { value: 'shown', label: 'Shown', detail: 'Reserved — pending build' },
                        ],
                      },
                    ]}
                    onChange={(v) => setC2({ emotionCurve: v as typeof c2.emotionCurve })}
                    width={140}
                    popoverWidth={400}
                  />
                  <Dropdown
                    label="Persona"
                    value={c2.personaOverlay}
                    sections={[
                      {
                        heading: 'Persona overlay',
                        options: [
                          { value: 'single', label: 'Native · Single', detail: 'One journey through phases (Ion register)' },
                          { value: 'multi', label: 'Multi-persona', detail: 'Reserved — pending build' },
                        ],
                      },
                    ]}
                    onChange={(v) => setC2({ personaOverlay: v as typeof c2.personaOverlay })}
                    width={130}
                    popoverWidth={400}
                  />
                </>
              )}
              {artifactPlaygroundArtifact === 'C4' && (
                <>
                  <Dropdown
                    label="Variant"
                    value={c4.variant}
                    sections={[
                      {
                        heading: 'Register',
                        options: [
                          { value: 'classic-4-tier', label: 'Native · Classic 4-tier', detail: 'Customer / Frontstage / Backstage / Support — Shostack canonical' },
                          { value: 'compact-3-tier', label: 'Compact 3-tier', detail: 'Reserved · pending native approval' },
                          { value: 'vertical', label: 'Vertical orientation', detail: 'Reserved · pending native approval' },
                          { value: 'emotion-augmented', label: 'Emotion-augmented (NN/g)', detail: 'Reserved · pending native approval' },
                          { value: 'physical-evidence', label: 'Physical-evidence row', detail: 'Reserved · pending native approval' },
                        ],
                      },
                    ]}
                    onChange={(v) => setC4({ variant: v as typeof c4.variant })}
                    width={170}
                    popoverWidth={420}
                  />
                  <Dropdown
                    label="Fail points"
                    value={c4.failPoints}
                    sections={[
                      {
                        heading: 'Shostack fail-point markers',
                        options: [
                          { value: 'on', label: 'Native · On', detail: '⚠ markers on cells where clarify-before-execute can trigger' },
                          { value: 'off', label: 'Off', detail: 'Hide fail-point markers' },
                        ],
                      },
                    ]}
                    onChange={(v) => setC4({ failPoints: v as typeof c4.failPoints })}
                    width={140}
                    popoverWidth={420}
                  />
                  <Dropdown
                    label="Separator labels"
                    value={c4.separatorLabels}
                    sections={[
                      {
                        heading: 'Tier separator labels (Shostack)',
                        options: [
                          { value: 'on', label: 'Native · On', detail: 'Line of interaction / visibility / internal interaction' },
                          { value: 'off', label: 'Off', detail: 'Separators rendered as hairlines only' },
                        ],
                      },
                    ]}
                    onChange={(v) => setC4({ separatorLabels: v as typeof c4.separatorLabels })}
                    width={170}
                    popoverWidth={440}
                  />
                </>
              )}
              {artifactPlaygroundArtifact === 'C5' && (
                <>
                  <Dropdown
                    label="Variant"
                    value={c5.variant}
                    sections={[
                      {
                        heading: 'Register',
                        options: [
                          { value: 'six-panel-grid', label: 'Native · 6-panel grid', detail: 'NN/g + UX-portfolio canon · 3 cols × 2 rows' },
                          { value: 'three-panel-cinematic', label: '3-panel cinematic', detail: 'Pivotal panels · 1 row × 3 cols · larger frames' },
                          { value: 'annotated-frames', label: 'Annotated frames', detail: 'Director\'s-note marginalia per panel · 2 × 3 grid' },
                          { value: 'single-row-strip', label: 'Single-row strip', detail: 'All 6 panels compressed · 1 row × 6 cols' },
                          { value: 'newspaper-multirow', label: 'Newspaper multi-row', detail: 'Editorial-magazine grid · feature + secondary mix' },
                        ],
                      },
                    ]}
                    onChange={(v) => setC5({ variant: v as typeof c5.variant })}
                    width={170}
                    popoverWidth={420}
                  />
                  <Dropdown
                    label="Panels"
                    value={String(c5.panelCount)}
                    sections={[
                      {
                        heading: 'Panel count',
                        options: [
                          { value: '3', label: '3 panels', detail: 'Setup → conflict → resolution' },
                          { value: '4', label: '4 panels', detail: 'Quarter-arc' },
                          { value: '6', label: 'Native · 6 panels', detail: 'NN/g UX-portfolio convention' },
                          { value: '8', label: '8 panels', detail: 'Extended scenario · 2 synthesized panels' },
                        ],
                      },
                    ]}
                    onChange={(v) => setC5({ panelCount: parseInt(v, 10) as typeof c5.panelCount })}
                    width={130}
                    popoverWidth={400}
                  />
                  <Dropdown
                    label="Annotation"
                    value={c5.annotationDensity}
                    sections={[
                      {
                        heading: 'Annotation density',
                        options: [
                          { value: 'minimal', label: 'Minimal', detail: 'Step + title only · no caption' },
                          { value: 'standard', label: 'Native · Standard', detail: 'Step + title + caption per panel' },
                          { value: 'generous', label: 'Generous', detail: 'Reserved · denser annotation pending' },
                        ],
                      },
                    ]}
                    onChange={(v) => setC5({ annotationDensity: v as typeof c5.annotationDensity })}
                    width={140}
                    popoverWidth={420}
                  />
                  <Dropdown
                    label="Frame"
                    value={c5.frameStyle}
                    sections={[
                      {
                        heading: 'Frame style',
                        options: [
                          { value: 'bordered', label: 'Native · Bordered', detail: '1px primary-ink frame' },
                          { value: 'borderless', label: 'Borderless', detail: 'Frame contents float without rule' },
                          { value: 'full-bleed', label: 'Full-bleed', detail: 'Raised W1 fill, no border' },
                        ],
                      },
                    ]}
                    onChange={(v) => setC5({ frameStyle: v as typeof c5.frameStyle })}
                    width={130}
                    popoverWidth={400}
                  />
                  <Dropdown
                    label="Caption"
                    value={c5.captionPosition}
                    sections={[
                      {
                        heading: 'Caption position',
                        options: [
                          { value: 'under', label: 'Native · Under-frame', detail: 'Caption row beneath the frame' },
                          { value: 'side', label: 'Side', detail: 'Caption rendered to the right of the frame' },
                          { value: 'inset', label: 'Inset', detail: 'Caption inside the frame, hairline-separated' },
                        ],
                      },
                    ]}
                    onChange={(v) => setC5({ captionPosition: v as typeof c5.captionPosition })}
                    width={140}
                    popoverWidth={420}
                  />
                </>
              )}
              {artifactPlaygroundArtifact === 'C3' && (
                <>
                  <Dropdown
                    label="Variant"
                    value={c3.variant}
                    sections={[
                      {
                        heading: 'Register candidates · pick a winner',
                        options: [
                          { value: 'candidate-a', label: 'A · Hand-feel UML (rough.js)', detail: 'Recommended · sibling-coherent with B1 + D1 · asymmetric box widths · decision eyebrow' },
                          { value: 'candidate-b', label: 'B · Annotated-editorial UML', detail: 'Clean strokes + Ion-grounded annotation under each step · type does the lifting' },
                          { value: 'candidate-c', label: 'C · Numbered-stepper (Holmes)', detail: 'Step numbers + forking-rect decision (no diamond) + curved-endpoint loopback' },
                          { value: 'candidate-d', label: 'D · Diptych register', detail: 'Clean forward path + heavy hand-feel loopback only · contrast carries the register' },
                        ],
                      },
                    ]}
                    onChange={(v) => setC3({ variant: v as typeof c3.variant })}
                    width={220}
                    popoverWidth={520}
                  />
                  <Dropdown
                    label="Decision labels"
                    value={c3.decisionLabels}
                    sections={[
                      {
                        heading: 'Yes / No path labels',
                        options: [
                          { value: 'on', label: 'Native · On', detail: 'Branch labels on Yes / No paths' },
                          { value: 'off', label: 'Off', detail: 'Branches unlabeled' },
                        ],
                      },
                    ]}
                    onChange={(v) => setC3({ decisionLabels: v as typeof c3.decisionLabels })}
                    width={150}
                    popoverWidth={360}
                  />
                  {/* Hand-feel section — visible only for hand-feel candidates (A and D).
                      Per user decisions: Q3 seed hidden, Q5 soft warning at Excalidraw zone. */}
                  {(c3.variant === 'candidate-a' || c3.variant === 'candidate-d') && (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                        paddingLeft: 16,
                        marginLeft: 8,
                        borderLeft: '1px solid var(--dir-border)',
                        minWidth: 240,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: IS,
                          fontSize: 10,
                          fontWeight: 500,
                          letterSpacing: '0.12em',
                          textTransform: 'uppercase',
                          color: 'var(--dir-detail)',
                        }}
                      >
                        Hand-feel · wobble
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input
                          type="range"
                          min={0}
                          max={2}
                          step={0.05}
                          value={c3.handFeel.wobble}
                          onChange={(e) =>
                            setC3({ handFeel: { ...c3.handFeel, wobble: Number(e.target.value) } })
                          }
                          style={{
                            flex: 1,
                            minWidth: 140,
                            accentColor: 'var(--dir-text-primary)',
                            cursor: 'pointer',
                          }}
                          aria-label="Wobble — hand-feel multiplier (0 = clean, 1 = native, 2 = doubly wobbly)"
                        />
                        <span
                          style={{
                            fontFamily: IS,
                            fontSize: 11,
                            fontWeight: 500,
                            color: 'var(--dir-text-primary)',
                            fontVariantNumeric: 'tabular-nums',
                            minWidth: 32,
                            textAlign: 'right',
                          }}
                        >
                          {c3.handFeel.wobble.toFixed(2)}
                        </span>
                      </div>
                      {c3.handFeel.wobble > 1.4 && (
                        <span
                          style={{
                            fontFamily: IS,
                            fontSize: 10,
                            fontWeight: 500,
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                            color: 'var(--dir-detail)',
                          }}
                        >
                          ⚠ Excalidraw zone — too cartoony
                        </span>
                      )}
                    </div>
                  )}
                  {/* Hand-feel · Stroke count (1 / 2 / 3 / 4 / 5 layered passes) */}
                  {(c3.variant === 'candidate-a' || c3.variant === 'candidate-d') && (
                    <Dropdown
                      label="Stroke count"
                      value={String(c3.handFeel.strokeCount)}
                      sections={[
                        {
                          heading: 'Multi-stroke layers',
                          options: [
                            { value: '1', label: '1 · single', detail: 'Single stroke per shape — cleanest' },
                            { value: '2', label: 'Native · 2', detail: 'Drawn-twice layered residue (current calibration)' },
                            { value: '3', label: '3 · triple', detail: 'Heavier "drawn many times" feel' },
                            { value: '4', label: '4 · quad', detail: 'Pencil-shading stack' },
                            { value: '5', label: '5 · heavy', detail: 'Maximum stack — sketchbook scribble' },
                          ],
                        },
                      ]}
                      onChange={(v) =>
                        setC3({
                          handFeel: {
                            ...c3.handFeel,
                            strokeCount: Number(v) as 1 | 2 | 3 | 4 | 5,
                          },
                        })
                      }
                      width={140}
                      popoverWidth={380}
                    />
                  )}
                  {/* Hand-feel · Stroke width slider (0.5–2.0 multiplier) */}
                  {(c3.variant === 'candidate-a' || c3.variant === 'candidate-d') && (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                        minWidth: 200,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: IS,
                          fontSize: 10,
                          fontWeight: 500,
                          letterSpacing: '0.12em',
                          textTransform: 'uppercase',
                          color: 'var(--dir-detail)',
                        }}
                      >
                        Stroke width
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input
                          type="range"
                          min={0.5}
                          max={2}
                          step={0.05}
                          value={c3.handFeel.strokeWidth}
                          onChange={(e) =>
                            setC3({
                              handFeel: {
                                ...c3.handFeel,
                                strokeWidth: Number(e.target.value),
                              },
                            })
                          }
                          style={{
                            flex: 1,
                            minWidth: 120,
                            accentColor: 'var(--dir-text-primary)',
                            cursor: 'pointer',
                          }}
                          aria-label="Stroke width — multiplier on each path's strokeWidth (0.5 = thinner, 1.0 = native, 2.0 = thicker)"
                        />
                        <span
                          style={{
                            fontFamily: IS,
                            fontSize: 11,
                            fontWeight: 500,
                            color: 'var(--dir-text-primary)',
                            fontVariantNumeric: 'tabular-nums',
                            minWidth: 32,
                            textAlign: 'right',
                          }}
                        >
                          {c3.handFeel.strokeWidth.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                  {/* Hand-feel · Endpoint behavior */}
                  {(c3.variant === 'candidate-a' || c3.variant === 'candidate-d') && (
                    <Dropdown
                      label="Endpoint"
                      value={c3.handFeel.endpointBehavior}
                      sections={[
                        {
                          heading: 'Stroke endpoint behavior',
                          options: [
                            { value: 'clean', label: 'Native · Clean', detail: 'Endpoints sit exactly on each corner' },
                            { value: 'protrude', label: 'Protrude', detail: 'Corners overshoot ~4px — pencil-sketch overshoot look' },
                            { value: 'long-overshoot', label: 'Long overshoot', detail: 'Heavy ~9px corner overshoot — sketchbook scribble look' },
                            { value: 'kink', label: 'Kink', detail: 'Corner offset at moderate amount — adds angular kink at junctions' },
                          ],
                        },
                      ]}
                      onChange={(v) =>
                        setC3({
                          handFeel: {
                            ...c3.handFeel,
                            endpointBehavior: v as 'clean' | 'protrude' | 'long-overshoot' | 'kink',
                          },
                        })
                      }
                      width={140}
                      popoverWidth={400}
                    />
                  )}
                  {/* Hand-feel · Sketching style */}
                  {(c3.variant === 'candidate-a' || c3.variant === 'candidate-d') && (
                    <Dropdown
                      label="Sketching"
                      value={c3.handFeel.sketchingStyle}
                      sections={[
                        {
                          heading: 'Layered stroke pacing',
                          options: [
                            { value: 'single-pass', label: 'Native · Single-pass', detail: 'Layers stack on the same path geometry' },
                            { value: 'loose-overlap', label: 'Loose overlap', detail: 'Layer endpoints offset along segment — drawn-separately feel' },
                            { value: 'parallel-pass', label: 'Parallel pass', detail: 'Layers offset perpendicular — ghost-stroke feel' },
                            { value: 'cross-hatch', label: 'Cross-hatch', detail: 'Each layer rotated ±6°/12° around shape center — crisscross outline' },
                          ],
                        },
                      ]}
                      onChange={(v) =>
                        setC3({
                          handFeel: {
                            ...c3.handFeel,
                            sketchingStyle: v as 'single-pass' | 'loose-overlap' | 'parallel-pass' | 'cross-hatch',
                          },
                        })
                      }
                      width={150}
                      popoverWidth={400}
                    />
                  )}
                  {/* Hand-feel · Texture (feTurbulence + feDisplacementMap edge grain) */}
                  {(c3.variant === 'candidate-a' || c3.variant === 'candidate-d') && (
                    <Dropdown
                      label="Texture"
                      value={c3.handFeel.texture}
                      sections={[
                        {
                          heading: 'Stroke-edge grain (additive over jittered geometry)',
                          options: [
                            { value: 'none', label: 'Native · None', detail: 'Clean ink edge — no grain filter applied' },
                            { value: 'light', label: 'Light grain', detail: 'Subtle pencil-edge grain (low-freq fractal · scale 1.2)' },
                            { value: 'heavy', label: 'Heavy grain', detail: 'Pronounced pencil-edge grain (3 octaves · scale 2.5)' },
                            { value: 'chalky', label: 'Chalky', detail: 'Chalk/charcoal grit (4 octaves · scale 3.5)' },
                            { value: 'paper-tooth', label: 'Paper tooth', detail: 'High-freq small-detail break — rough cold-press paper register' },
                            { value: 'ribbed', label: 'Ribbed / laid', detail: 'Horizontal-bias noise — laid paper, strokes break along grain' },
                            { value: 'stipple', label: 'Stipple', detail: 'Very-high-freq fractal — dot-like edge, halftone-adjacent' },
                            { value: 'wet-ink', label: 'Wet ink', detail: 'Slight blur + displace — fountain-pen on absorbent paper' },
                            { value: 'smudge', label: 'Smudge', detail: 'Asymmetric vertical displace — charcoal rubbed sideways' },
                            { value: 'canvas', label: 'Canvas weave', detail: 'Uniform medium-freq in both axes — woven crosshatch break' },
                          ],
                        },
                      ]}
                      onChange={(v) =>
                        setC3({
                          handFeel: {
                            ...c3.handFeel,
                            texture: v as 'none' | 'light' | 'heavy' | 'chalky' | 'paper-tooth' | 'ribbed' | 'stipple' | 'wet-ink' | 'smudge' | 'canvas',
                          },
                        })
                      }
                      width={140}
                      popoverWidth={460}
                    />
                  )}
                  {/* Hand-feel · Pen tip (perfect-freehand presets, applies to lines + loopback) */}
                  {(c3.variant === 'candidate-a' || c3.variant === 'candidate-d') && (
                    <Dropdown
                      label="Pen tip"
                      value={c3.handFeel.penTip}
                      sections={[
                        {
                          heading: 'Stroke character (perfect-freehand)',
                          options: [
                            { value: 'plain', label: 'Native · Plain', detail: 'Default rough.js stroke render — no pen-tip variation' },
                            { value: 'ballpoint', label: 'Ballpoint', detail: 'Clean uniform stroke, slight endpoint thinning' },
                            { value: 'fineliner', label: 'Fineliner', detail: 'Thin uniform stroke, hard caps' },
                            { value: 'pencil-hb', label: 'Pencil · HB', detail: 'Mild width variation + light grain' },
                            { value: 'pencil-2b', label: 'Pencil · 2B', detail: 'Stronger width variation + heavier grain' },
                            { value: 'felt-tip', label: 'Felt-tip', detail: 'Thicker uniform stroke, soft caps' },
                            { value: 'chisel', label: 'Chisel', detail: 'Strong width variation — calligraphy-leaning' },
                            { value: 'charcoal', label: 'Charcoal', detail: 'Heavy variable width + edge-jittered grain' },
                          ],
                        },
                      ]}
                      onChange={(v) =>
                        setC3({
                          handFeel: {
                            ...c3.handFeel,
                            penTip: v as typeof c3.handFeel.penTip,
                          },
                        })
                      }
                      width={140}
                      popoverWidth={420}
                    />
                  )}
                </>
              )}
              {artifactPlaygroundArtifact === 'D1' && (
                <>
                  <Dropdown
                    label="Variant"
                    value={d1.variant}
                    sections={[
                      {
                        heading: 'Register',
                        options: [
                          { value: 'hand-drawn', label: 'Native · Hand-drawn wavy line', detail: 'Multi-stroke jittered line, decay left→right (Ion CoCreate register, Holmes lineage)' },
                          { value: 'mechanical-stepped', label: 'Mechanical stepped', detail: 'Geometric zig-zag chaos-to-order — sharp angular steps' },
                          { value: 'smooth-bezier', label: 'Smooth Bezier', detail: 'Continuous mathematical sine curve, decaying envelope' },
                          { value: 'two-line-contrast', label: 'Two-line contrast', detail: 'Without Ion (chaotic) vs With Ion (straight) — side-by-side' },
                        ],
                      },
                    ]}
                    onChange={(v) => setD1({ variant: v as typeof d1.variant })}
                    width={170}
                    popoverWidth={420}
                  />
                  <Dropdown
                    label="Stage labels"
                    value={d1.stageLabels}
                    sections={[
                      {
                        heading: '4 stage labels under the spectrum',
                        options: [
                          { value: 'on', label: 'Native · On', detail: 'Show all 4 phases (Understand → Concept → Detail → Implementation)' },
                          { value: 'off', label: 'Off', detail: 'Hide stage labels — line only' },
                        ],
                      },
                    ]}
                    onChange={(v) => setD1({ stageLabels: v as typeof d1.stageLabels })}
                    width={130}
                    popoverWidth={400}
                  />
                  <Dropdown
                    label="Line texture"
                    value={d1.lineTexture}
                    sections={[
                      {
                        heading: 'Stroke texture',
                        options: [
                          { value: 'sketchy', label: 'Native · Sketchy', detail: 'Multi-stroke jittered, hand-drawn (rough.js technique)' },
                          { value: 'smooth', label: 'Smooth', detail: 'Single clean curve, no jitter' },
                          { value: 'dashed', label: 'Dashed', detail: '8 4 dashed pattern, no jitter' },
                        ],
                      },
                    ]}
                    onChange={(v) => setD1({ lineTexture: v as typeof d1.lineTexture })}
                    width={140}
                    popoverWidth={420}
                  />
                  <Dropdown
                    label="Endpoint"
                    value={d1.endpointEmphasis}
                    sections={[
                      {
                        heading: 'Endpoint emphasis',
                        options: [
                          { value: 'none', label: 'None', detail: 'Bare line — no anchor labels or dots' },
                          { value: 'dots', label: 'Dots', detail: '4px filled dots at line endpoints' },
                          { value: 'labels', label: 'Native · Labels', detail: 'Anchor caps labels (HIGH AMBIGUITY · LOW CERTAINTY etc.)' },
                        ],
                      },
                    ]}
                    onChange={(v) => setD1({ endpointEmphasis: v as typeof d1.endpointEmphasis })}
                    width={120}
                    popoverWidth={400}
                  />
                  <Dropdown
                    label="Line weight"
                    value={d1.lineWeight}
                    sections={[
                      {
                        heading: 'Stroke width',
                        options: [
                          { value: 'thin', label: 'Thin', detail: '1px stroke' },
                          { value: 'medium', label: 'Native · Medium', detail: '1.5px stroke (Ion register)' },
                          { value: 'heavy', label: 'Heavy', detail: '2px stroke' },
                        ],
                      },
                    ]}
                    onChange={(v) => setD1({ lineWeight: v as typeof d1.lineWeight })}
                    width={130}
                    popoverWidth={360}
                  />
                  <Dropdown
                    label="Color"
                    value={d1.colorTreatment}
                    sections={[
                      {
                        heading: 'Color treatment',
                        options: [
                          { value: 'ink-only', label: 'Native · Ink only', detail: 'Everything --dir-text-primary' },
                          { value: 'muted-and-emphasized', label: 'Muted line + emphasis', detail: 'Line --dir-detail; endpoints/markers --dir-text-primary' },
                          { value: 'single-accent', label: 'Single accent', detail: 'Same as muted — endpoints emphasized' },
                        ],
                      },
                    ]}
                    onChange={(v) => setD1({ colorTreatment: v as typeof d1.colorTreatment })}
                    width={140}
                    popoverWidth={440}
                  />
                  <Dropdown
                    label="Stage marker"
                    value={d1.stageMarkerStyle}
                    sections={[
                      {
                        heading: 'Stage marker on the line',
                        options: [
                          { value: 'dots', label: 'Native · Dots', detail: '3px circle markers per stage on the line' },
                          { value: 'labeled-boxes', label: 'Labeled boxes', detail: '16px filled rect with stage number inside' },
                          { value: 'inline', label: 'Inline (no marker)', detail: 'No on-line marker — labels only' },
                        ],
                      },
                    ]}
                    onChange={(v) => setD1({ stageMarkerStyle: v as typeof d1.stageMarkerStyle })}
                    width={140}
                    popoverWidth={420}
                  />
                </>
              )}
              {artifactPlaygroundArtifact === 'D2' && (
                <>
                  <Dropdown
                    label="Variant"
                    value={d2.variant}
                    sections={[
                      {
                        heading: 'Register',
                        options: [
                          { value: 'single-icon-arrow', label: 'Native · Single icon + arrow', detail: 'Sparkle (Ion) + curved arrow → established-workflow line (Demo Day register)' },
                          { value: 'multi-icon', label: 'Multi-icon constellation', detail: '3 workflow tools form network; Ion sits separately with dashed peripheral link' },
                          { value: 'annotated-icons', label: 'Annotated icons', detail: 'Holmes register — per-element labels and arc annotation' },
                          { value: 'before-after', label: 'Before / after pair', detail: 'Stacked panels: separate (dashed) → integrated (solid)' },
                          { value: 'disconnect-as-gap', label: 'Disconnect-as-gap', detail: 'Two opposing arrow segments meet at a labeled gap — disconnect IS the gap' },
                        ],
                      },
                    ]}
                    onChange={(v) => setD2({ variant: v as typeof d2.variant })}
                    width={170}
                    popoverWidth={420}
                  />
                  <Dropdown
                    label="Icon style"
                    value={d2.iconStyle}
                    sections={[
                      {
                        heading: 'Icon glyph register',
                        options: [
                          { value: 'outline', label: 'Outline', detail: 'Sparkle at IS 28/300 (lighter weight)' },
                          { value: 'filled', label: 'Native · Filled', detail: 'Sparkle at IS 28/600 (Ion register)' },
                          { value: 'hand-drawn', label: 'Hand-drawn', detail: 'Reserved — pending build' },
                        ],
                      },
                    ]}
                    onChange={(v) => setD2({ iconStyle: v as typeof d2.iconStyle })}
                    width={130}
                    popoverWidth={400}
                  />
                  <Dropdown
                    label="Arrow"
                    value={d2.arrowStyle}
                    sections={[
                      {
                        heading: 'Arrow stroke style',
                        options: [
                          { value: 'straight', label: 'Straight', detail: 'Direct line from Ion to workflow' },
                          { value: 'curved', label: 'Native · Curved', detail: 'Quadratic-bezier curve (Ion deck register)' },
                          { value: 'dashed', label: 'Dashed', detail: 'Straight + 8 4 dashed pattern' },
                          { value: 'wavy', label: 'Wavy', detail: 'Sinuous curve via alternating mid-control points' },
                        ],
                      },
                    ]}
                    onChange={(v) => setD2({ arrowStyle: v as typeof d2.arrowStyle })}
                    width={130}
                    popoverWidth={400}
                  />
                  <Dropdown
                    label="Annotation"
                    value={d2.annotationDensity}
                    sections={[
                      {
                        heading: 'Annotation density',
                        options: [
                          { value: 'minimal', label: 'Minimal', detail: 'Eyebrow + diagram only — no caption' },
                          { value: 'standard', label: 'Native · Standard', detail: 'Eyebrow + diagram + caption' },
                          { value: 'verbose', label: 'Verbose', detail: 'Adds Demo Day paired-challenge context' },
                        ],
                      },
                    ]}
                    onChange={(v) => setD2({ annotationDensity: v as typeof d2.annotationDensity })}
                    width={130}
                    popoverWidth={420}
                  />
                  <Dropdown
                    label="Icons"
                    value={String(d2.iconCount)}
                    sections={[
                      {
                        heading: 'Icon count',
                        options: [
                          { value: '1', label: 'Native · 1', detail: 'Single Ion sparkle (Ion deck register)' },
                          { value: '2', label: '2', detail: 'Reserved — multi-icon variant' },
                          { value: '3', label: '3', detail: 'Reserved — multi-icon variant' },
                          { value: '4', label: '4', detail: 'Reserved — multi-icon variant' },
                        ],
                      },
                    ]}
                    onChange={(v) => setD2({ iconCount: Number(v) as 1 | 2 | 3 | 4 })}
                    width={90}
                    popoverWidth={380}
                  />
                  <Dropdown
                    label="Caption"
                    value={d2.captionPlacement}
                    sections={[
                      {
                        heading: 'Caption placement',
                        options: [
                          { value: 'under', label: 'Native · Under', detail: 'Caption below the diagram (Ion register)' },
                          { value: 'side', label: 'Side', detail: 'Reserved — pending build' },
                          { value: 'inline', label: 'Inline', detail: 'Reserved — pending build' },
                        ],
                      },
                    ]}
                    onChange={(v) => setD2({ captionPlacement: v as typeof d2.captionPlacement })}
                    width={130}
                    popoverWidth={400}
                  />
                  <Dropdown
                    label="Endpoints"
                    value={d2.arrowEndpoints}
                    sections={[
                      {
                        heading: 'Arrowhead style',
                        options: [
                          { value: 'solid', label: 'Native · Solid', detail: 'Filled triangle arrowhead (Ion register)' },
                          { value: 'open', label: 'Open', detail: 'Stroke-only V arrowhead' },
                          { value: 'hand-drawn', label: 'Hand-drawn', detail: 'Reserved — pending build' },
                        ],
                      },
                    ]}
                    onChange={(v) => setD2({ arrowEndpoints: v as typeof d2.arrowEndpoints })}
                    width={130}
                    popoverWidth={380}
                  />
                </>
              )}
              {artifactPlaygroundArtifact === 'A2' && (
                <>
                  <Dropdown
                    label="Variant"
                    value={a2.variant}
                    sections={[
                      {
                        heading: 'Register',
                        options: [
                          { value: 'classic-4-quadrant', label: 'Native · Classic 4-quadrant', detail: 'Says / Thinks / Does / Feels in 2x2 grid (Dave Gray canonical)' },
                          { value: 'cross-shape', label: 'Cross-shape', detail: 'NN/g cross — quadrants in cardinal positions, persona at center' },
                          { value: 'linear-stacked', label: 'Linear stacked', detail: 'Four labeled sections vertically stacked, label rail on left' },
                          { value: 'extended-6-quadrant', label: '6-quadrant (+ Pains/Gains)', detail: 'Says/Thinks/Does/Feels + Pains/Gains in 3×2 grid' },
                        ],
                      },
                    ]}
                    onChange={(v) => setA2({ variant: v as typeof a2.variant })}
                    width={170}
                    popoverWidth={420}
                  />
                  <Dropdown
                    label="Persona"
                    value={a2.personaTarget}
                    sections={[
                      {
                        heading: 'Persona target',
                        options: [
                          { value: 'workflow-focused', label: 'Native · Workflow-focused', detail: 'Speed & efficiency persona — richer quote source' },
                          { value: 'creative-control', label: 'Creative Control Seeker', detail: 'Craft & control persona' },
                          { value: 'both', label: 'Both side-by-side', detail: 'Renders both empathy maps in parallel' },
                        ],
                      },
                    ]}
                    onChange={(v) => setA2({ personaTarget: v as typeof a2.personaTarget })}
                    width={170}
                    popoverWidth={420}
                  />
                  <Dropdown
                    label="Quadrants"
                    value={String(a2.quadrantSet)}
                    sections={[
                      {
                        heading: 'Quadrant set',
                        options: [
                          { value: '4', label: 'Native · 4', detail: 'Says / Thinks / Does / Feels' },
                          { value: '6', label: '6 (+ Pains / Gains)', detail: 'Reserved — extended-6-quadrant variant' },
                        ],
                      },
                    ]}
                    onChange={(v) => setA2({ quadrantSet: Number(v) as 4 | 6 })}
                    width={130}
                    popoverWidth={380}
                  />
                  <Dropdown
                    label="Items / Q"
                    value={String(a2.itemsPerQuadrant)}
                    sections={[
                      {
                        heading: 'Items per quadrant',
                        options: [
                          { value: '3', label: '3', detail: 'First 3 items' },
                          { value: '5', label: 'Native · 5', detail: 'All 5 (Dave Gray rule of thumb: ≤7)' },
                          { value: '7', label: '7', detail: 'N/A — data has 5 (clamps)' },
                        ],
                      },
                    ]}
                    onChange={(v) => setA2({ itemsPerQuadrant: Number(v) as 3 | 5 | 7 })}
                    width={110}
                    popoverWidth={320}
                  />
                  <Dropdown
                    label="Center"
                    value={a2.centerFigure}
                    sections={[
                      {
                        heading: 'Center figure',
                        options: [
                          { value: 'none', label: 'None', detail: 'No center figure' },
                          { value: 'silhouette', label: 'Native · Silhouette', detail: 'Abstract head + shoulders silhouette in framed circle' },
                          { value: 'glyph', label: 'Glyph', detail: 'Sparkle ✦ glyph in framed circle' },
                        ],
                      },
                    ]}
                    onChange={(v) => setA2({ centerFigure: v as typeof a2.centerFigure })}
                    width={130}
                    popoverWidth={400}
                  />
                  <Dropdown
                    label="Attribution"
                    value={a2.sourceAttribution}
                    sections={[
                      {
                        heading: 'Source attribution',
                        options: [
                          { value: 'show', label: 'Native · Show', detail: 'Show research participant names where available' },
                          { value: 'hide', label: 'Hide', detail: 'Quote text only' },
                        ],
                      },
                    ]}
                    onChange={(v) => setA2({ sourceAttribution: v as typeof a2.sourceAttribution })}
                    width={130}
                    popoverWidth={380}
                  />
                  <Dropdown
                    label="Q labels"
                    value={a2.quadrantLabelsPosition}
                    sections={[
                      {
                        heading: 'Quadrant label position',
                        options: [
                          { value: 'edge', label: 'Native · Edge', detail: 'Labels on outer edge of each quadrant' },
                          { value: 'inside', label: 'Inside corners', detail: 'Reserved — pending build' },
                        ],
                      },
                    ]}
                    onChange={(v) => setA2({ quadrantLabelsPosition: v as typeof a2.quadrantLabelsPosition })}
                    width={120}
                    popoverWidth={400}
                  />
                </>
              )}
              {artifactPlaygroundArtifact === 'A4' && (
                <>
                  <Dropdown
                    label="Variant"
                    value={a4.variant}
                    sections={[
                      {
                        heading: 'Register',
                        options: [
                          { value: 'indi-young-towers', label: 'Native · Indi Young towers', detail: 'Behaviors as vertical towers above an alignment line; capabilities below' },
                          { value: 'concept-lattice', label: 'Concept lattice', detail: 'Hierarchical tree — root → towers → atomic tasks with branch connectors' },
                          { value: 'behavior-feature-grid', label: 'Behavior–feature grid', detail: 'Tabular matrix — behaviors as rows, capabilities as vertical-rotated columns, dot markers' },
                        ],
                      },
                    ]}
                    onChange={(v) => setA4({ variant: v as typeof a4.variant })}
                    width={170}
                    popoverWidth={420}
                  />
                  <Dropdown
                    label="Towers"
                    value={String(a4.towerCount)}
                    sections={[
                      {
                        heading: 'Tower count',
                        options: [
                          { value: '3', label: '3', detail: 'First 3 themes' },
                          { value: '4', label: '4', detail: 'First 4 themes' },
                          { value: '5', label: 'Native · 5', detail: 'All 5 (Speed · Control · Trust · Familiarity · AI agency)' },
                        ],
                      },
                    ]}
                    onChange={(v) => setA4({ towerCount: Number(v) as 3 | 4 | 5 })}
                    width={90}
                    popoverWidth={420}
                  />
                  <Dropdown
                    label="Alignment line"
                    value={a4.alignmentMarkers}
                    sections={[
                      {
                        heading: 'Alignment markers',
                        options: [
                          { value: 'on', label: 'Native · On', detail: "Indi Young's signature horizontal divider with caption" },
                          { value: 'off', label: 'Off', detail: 'Towers + capabilities without divider line' },
                        ],
                      },
                    ]}
                    onChange={(v) => setA4({ alignmentMarkers: v as typeof a4.alignmentMarkers })}
                    width={140}
                    popoverWidth={400}
                  />
                  <Dropdown
                    label="Tasks / tower"
                    value={String(a4.taskDensity)}
                    sections={[
                      {
                        heading: 'Atomic-task density',
                        options: [
                          { value: '3', label: '3', detail: 'First 3 tasks per tower' },
                          { value: '5', label: 'Native · 5', detail: 'All 5 tasks per tower (full density)' },
                          { value: '7', label: '7', detail: 'N/A — data has 5 (clamps)' },
                        ],
                      },
                    ]}
                    onChange={(v) => setA4({ taskDensity: Number(v) as 3 | 5 | 7 })}
                    width={130}
                    popoverWidth={360}
                  />
                  <Dropdown
                    label="Color banding"
                    value={a4.colorBanding}
                    sections={[
                      {
                        heading: 'Tower color banding',
                        options: [
                          { value: 'off', label: 'Native · Off', detail: 'No banding — towers in --dir-text-primary ink' },
                          { value: 'by-class', label: 'By behavior class', detail: 'Reserved — pending build' },
                        ],
                      },
                    ]}
                    onChange={(v) => setA4({ colorBanding: v as typeof a4.colorBanding })}
                    width={150}
                    popoverWidth={400}
                  />
                  <Dropdown
                    label="Attribution"
                    value={a4.sourceAttribution}
                    sections={[
                      {
                        heading: 'Source attribution',
                        options: [
                          { value: 'show', label: 'Native · Show', detail: 'Show research participant names where applicable' },
                          { value: 'hide', label: 'Hide', detail: 'Task text only' },
                        ],
                      },
                    ]}
                    onChange={(v) => setA4({ sourceAttribution: v as typeof a4.sourceAttribution })}
                    width={130}
                    popoverWidth={380}
                  />
                </>
              )}
              {artifactPlaygroundArtifact === 'B2' && (
                <>
                  <Dropdown
                    label="Variant"
                    value={b2.variant}
                    sections={[
                      {
                        heading: 'Register',
                        options: [
                          { value: 'classic-2x2', label: 'Native · Classic 2x2', detail: 'Speed × Craft control with 5 plotted items, focal Ion as filled square' },
                          { value: 'labeled-quadrant', label: 'Labeled-quadrant', detail: 'BCG-style archetype labels per quadrant — Studio craft / Premium product / Generic / Vibe code' },
                          { value: 'heat-density', label: 'Heat-density', detail: 'Quadrant tinting by item-count quartile (W1 step tokens) + big numerals' },
                          { value: 'trajectory', label: 'Trajectory', detail: 'Dashed arrows show strategic movement — Ion vector to upper-right craft+speed corner' },
                        ],
                      },
                    ]}
                    onChange={(v) => setB2({ variant: v as typeof b2.variant })}
                    width={170}
                    popoverWidth={420}
                  />
                  <Dropdown
                    label="Items"
                    value={String(b2.itemCount)}
                    sections={[
                      {
                        heading: 'Plotted item count',
                        options: [
                          { value: '3', label: '3', detail: 'First 3 items' },
                          { value: '5', label: 'Native · 5', detail: '2 personas + 2 competitors + Ion focal' },
                          { value: '7', label: '7', detail: 'N/A — data has 5 (clamps)' },
                        ],
                      },
                    ]}
                    onChange={(v) => setB2({ itemCount: Number(v) as 3 | 5 | 7 })}
                    width={90}
                    popoverWidth={400}
                  />
                  <Dropdown
                    label="Q labels"
                    value={b2.quadrantLabels}
                    sections={[
                      {
                        heading: 'Quadrant archetype labels',
                        options: [
                          { value: 'off', label: 'Native · Off', detail: 'Let positions speak — no archetype labels' },
                          { value: 'on', label: 'On', detail: 'Slow·craft / Fast·craft / Slow·vibe / Fast·vibe' },
                        ],
                      },
                    ]}
                    onChange={(v) => setB2({ quadrantLabels: v as typeof b2.quadrantLabels })}
                    width={120}
                    popoverWidth={420}
                  />
                  <Dropdown
                    label="Item size"
                    value={b2.itemSize}
                    sections={[
                      {
                        heading: 'Item marker size',
                        options: [
                          { value: 'uniform', label: 'Native · Uniform', detail: '4px radius for all items' },
                          { value: 'weighted', label: 'Weighted', detail: 'Radius scales with item.weight (Ion focal larger)' },
                        ],
                      },
                    ]}
                    onChange={(v) => setB2({ itemSize: v as typeof b2.itemSize })}
                    width={120}
                    popoverWidth={400}
                  />
                  <Dropdown
                    label="Trajectory"
                    value={b2.trajectoryArrows}
                    sections={[
                      {
                        heading: 'Trajectory arrows',
                        options: [
                          { value: 'off', label: 'Native · Off', detail: 'Static positions only' },
                          { value: 'show', label: 'Show', detail: 'Reserved — pending build' },
                        ],
                      },
                    ]}
                    onChange={(v) => setB2({ trajectoryArrows: v as typeof b2.trajectoryArrows })}
                    width={120}
                    popoverWidth={380}
                  />
                  <Dropdown
                    label="Grid"
                    value={b2.gridLines}
                    sections={[
                      {
                        heading: 'Quadrant grid lines',
                        options: [
                          { value: 'off', label: 'Off', detail: 'No midline cross' },
                          { value: 'faint', label: 'Native · Faint', detail: '--dir-border dashed midline cross' },
                          { value: 'mid', label: 'Mid', detail: '--dir-detail dashed midline cross' },
                        ],
                      },
                    ]}
                    onChange={(v) => setB2({ gridLines: v as typeof b2.gridLines })}
                    width={110}
                    popoverWidth={380}
                  />
                </>
              )}
              {artifactPlaygroundArtifact === 'B3' && (
                <>
                  <Dropdown
                    label="Variant"
                    value={b3.variant}
                    sections={[
                      {
                        heading: 'Register',
                        options: [
                          { value: 'cluster-constellation', label: 'Native · Cluster constellation', detail: '3 categorized clusters + Ion focal card (a16z register)' },
                          { value: 'quadrant-style', label: 'Quadrant-style', detail: '2x2 with established/emerging × designer-first/engineer-first archetypes' },
                          { value: 'bullseye', label: 'Bullseye', detail: 'Ion at center, 3 concentric rings (Direct/Related/Distant) by competitive distance' },
                          { value: 'logo-grid', label: 'Logo-grid', detail: 'CB Insights row-per-category — focal Ion banner + cluster rows with raised cards' },
                          { value: 'positioned-on-axes', label: 'Positioned on axes', detail: 'All 9 competitors + Ion focal plotted on Speed × Craft control axes' },
                        ],
                      },
                    ]}
                    onChange={(v) => setB3({ variant: v as typeof b3.variant })}
                    width={170}
                    popoverWidth={420}
                  />
                  <Dropdown
                    label="Items"
                    value={String(b3.competitorCount)}
                    sections={[
                      {
                        heading: 'Competitor count',
                        options: [
                          { value: '5', label: '5', detail: '~2 per cluster' },
                          { value: '7', label: '7', detail: '~3 per cluster' },
                          { value: '9', label: 'Native · 9', detail: '3 per cluster (full data)' },
                        ],
                      },
                    ]}
                    onChange={(v) => setB3({ competitorCount: Number(v) as 5 | 7 | 9 })}
                    width={90}
                    popoverWidth={360}
                  />
                  <Dropdown
                    label="Annotation"
                    value={b3.annotationStyle}
                    sections={[
                      {
                        heading: 'Item annotation style',
                        options: [
                          { value: 'dot', label: 'Dot', detail: 'Inline 6px dot + label' },
                          { value: 'labeled-card', label: 'Native · Labeled card', detail: '8/12 padded raised card with border' },
                          { value: 'icon', label: 'Icon', detail: '▸ chevron + label' },
                        ],
                      },
                    ]}
                    onChange={(v) => setB3({ annotationStyle: v as typeof b3.annotationStyle })}
                    width={150}
                    popoverWidth={400}
                  />
                  <Dropdown
                    label="Focal"
                    value={b3.focalHighlight}
                    sections={[
                      {
                        heading: 'Focal-product highlight',
                        options: [
                          { value: 'on', label: 'Native · On', detail: 'Ion shown as filled card with reverse-color text' },
                          { value: 'off', label: 'Off', detail: 'No focal highlight' },
                        ],
                      },
                    ]}
                    onChange={(v) => setB3({ focalHighlight: v as typeof b3.focalHighlight })}
                    width={110}
                    popoverWidth={400}
                  />
                  <Dropdown
                    label="Clusters"
                    value={b3.clusterGrouping}
                    sections={[
                      {
                        heading: 'Cluster grouping',
                        options: [
                          { value: 'on', label: 'Native · On', detail: 'Group by Design tools / Vibe code / AI assistant' },
                          { value: 'off', label: 'Off', detail: 'Flat 3-column grid, no category headers' },
                        ],
                      },
                    ]}
                    onChange={(v) => setB3({ clusterGrouping: v as typeof b3.clusterGrouping })}
                    width={120}
                    popoverWidth={400}
                  />
                  <Dropdown
                    label="Legend"
                    value={b3.legendDensity}
                    sections={[
                      {
                        heading: 'Legend density',
                        options: [
                          { value: 'minimal', label: 'Native · Minimal', detail: 'No legend rows; rely on cluster headers' },
                          { value: 'full', label: 'Full', detail: 'Add bottom-rule footer with category·count entries' },
                        ],
                      },
                    ]}
                    onChange={(v) => setB3({ legendDensity: v as typeof b3.legendDensity })}
                    width={130}
                    popoverWidth={400}
                  />
                </>
              )}
              {artifactPlaygroundArtifact === 'B4' && (
                <>
                  <Dropdown
                    label="Variant"
                    value={b4.variant}
                    sections={[
                      {
                        heading: 'Register',
                        options: [
                          { value: 'hierarchical-top-down', label: 'Native · Hierarchical top-down', detail: 'Novak canonical — root → tier-2 → leaves with labeled connections + cross-links' },
                          { value: 'node-link-classic', label: 'Node-link classic', detail: 'Force-directed organic layout (pending)' },
                          { value: 'mind-map-radial', label: 'Mind-map radial', detail: 'Central node with branches radiating (pending)' },
                        ],
                      },
                    ]}
                    onChange={(v) => setB4({ variant: v as typeof b4.variant })}
                    width={170}
                    popoverWidth={420}
                  />
                  <Dropdown
                    label="Nodes"
                    value={String(b4.nodeCount)}
                    sections={[
                      {
                        heading: 'Visible node count',
                        options: [
                          { value: '7', label: '7', detail: 'Root + 3 tier-2 + 3 leaves' },
                          { value: '10', label: '10', detail: 'Root + 3 tier-2 + 6 leaves' },
                          { value: '13', label: 'Native · 13', detail: 'Full graph (root + 3 tier-2 + 9 leaves)' },
                        ],
                      },
                    ]}
                    onChange={(v) => setB4({ nodeCount: Number(v) as 7 | 10 | 13 })}
                    width={90}
                    popoverWidth={400}
                  />
                  <Dropdown
                    label="Labels"
                    value={b4.connectionLabels}
                    sections={[
                      {
                        heading: 'Connection labels',
                        options: [
                          { value: 'on', label: 'Native · On', detail: 'Novak canon — labeled relationships ("via", "supports", "shortens"…)' },
                          { value: 'off', label: 'Off', detail: 'Plain arrows without verb labels (mind-map register)' },
                        ],
                      },
                    ]}
                    onChange={(v) => setB4({ connectionLabels: v as typeof b4.connectionLabels })}
                    width={110}
                    popoverWidth={420}
                  />
                  <Dropdown
                    label="Focal"
                    value={b4.highlightFocal}
                    sections={[
                      {
                        heading: 'Highlight focal node',
                        options: [
                          { value: 'on', label: 'Native · On', detail: 'Root node fills with --dir-raised to read as focal' },
                          { value: 'off', label: 'Off', detail: 'All nodes uniform fill' },
                        ],
                      },
                    ]}
                    onChange={(v) => setB4({ highlightFocal: v as typeof b4.highlightFocal })}
                    width={100}
                    popoverWidth={400}
                  />
                  <Dropdown
                    label="Node shape"
                    value={b4.nodeShape}
                    sections={[
                      {
                        heading: 'Node shape',
                        options: [
                          { value: 'oval', label: 'Native · Oval', detail: 'Novak canonical — rounded rect with full-height radius' },
                          { value: 'box', label: 'Box', detail: 'Sharp-corner rectangle' },
                          { value: 'circle', label: 'Circle', detail: 'Full circle (mind-map register)' },
                        ],
                      },
                    ]}
                    onChange={(v) => setB4({ nodeShape: v as typeof b4.nodeShape })}
                    width={130}
                    popoverWidth={400}
                  />
                  <Dropdown
                    label="Cross-links"
                    value={b4.showCrossLinks}
                    sections={[
                      {
                        heading: 'Cross-branch links (Novak signature)',
                        options: [
                          { value: 'on', label: 'Native · On', detail: 'Dashed cross-links between branches (e.g. AI predictability → iteration cycle)' },
                          { value: 'off', label: 'Off', detail: 'Strict hierarchical tree only — no cross-links' },
                        ],
                      },
                    ]}
                    onChange={(v) => setB4({ showCrossLinks: v as typeof b4.showCrossLinks })}
                    width={130}
                    popoverWidth={420}
                  />
                </>
              )}
              {artifactPlaygroundArtifact === 'E1' && (
                <>
                  <Dropdown
                    label="Variant"
                    value={e1.variant}
                    sections={[
                      {
                        heading: 'Register',
                        options: [
                          { value: 'spectrum-position', label: 'Native · Spectrum-position', detail: 'Personas plotted on horizontal trait axes + dumbbell connector bar between persona positions on each axis' },
                          { value: 'trait-cluster', label: 'Trait-cluster (overlap spider)', detail: 'Single chart, both personas plotted as overlapping polygons on 3 bidirectional axes. Each persona is plotted on whichever side of center they lean; distance from center encodes alignment strength. Two polygons in opposing quadrants = visual proof of opposing user types.' },
                        ],
                      },
                    ]}
                    onChange={(v) => setE1({ variant: v as typeof e1.variant })}
                    width={170}
                    popoverWidth={420}
                  />
                  <Dropdown
                    label="Spectrums"
                    value={String(e1.spectrumCount)}
                    sections={[
                      {
                        heading: 'Trait dimensions shown',
                        options: [
                          { value: '1', label: '1 · primary only', detail: 'Speeding automation ↔ Empowering creativity (source §1)' },
                          { value: '2', label: '2', detail: 'Primary + Process control (derived)' },
                          { value: '3', label: 'Native · 3', detail: 'Primary + Process control + Trust in AI output' },
                        ],
                      },
                    ]}
                    onChange={(v) => setE1({ spectrumCount: Number(v) as 1 | 2 | 3 })}
                    width={140}
                    popoverWidth={400}
                  />
                  <Dropdown
                    label="Personas"
                    value={String(e1.personaCount)}
                    sections={[
                      {
                        heading: 'Persona count',
                        options: [
                          { value: '1', label: '1 · solo', detail: 'Workflow-Focused only' },
                          { value: '2', label: 'Native · 2', detail: 'Workflow-Focused + Creative Control Seekers (Ion canon)' },
                        ],
                      },
                    ]}
                    onChange={(v) => setE1({ personaCount: Number(v) as 1 | 2 })}
                    width={130}
                    popoverWidth={360}
                  />
                  <Dropdown
                    label="Annotations"
                    value={e1.annotations}
                    sections={[
                      {
                        heading: 'Per-persona annotation',
                        options: [
                          { value: 'on', label: 'Native · On', detail: 'Quote-grounded annotations under each spectrum' },
                          { value: 'off', label: 'Off', detail: 'Spectrum + markers only — no annotations' },
                        ],
                      },
                    ]}
                    onChange={(v) => setE1({ annotations: v as typeof e1.annotations })}
                    width={140}
                    popoverWidth={380}
                  />
                  <Dropdown
                    label="Derived flag"
                    value={e1.derivedMarkers}
                    sections={[
                      {
                        heading: 'Source vs derived markers',
                        options: [
                          { value: 'on', label: 'Native · On', detail: 'Visibly flag spectrums derived from themes (vs direct source quote)' },
                          { value: 'off', label: 'Off', detail: 'Hide source/derived flags — uniform presentation' },
                        ],
                      },
                    ]}
                    onChange={(v) => setE1({ derivedMarkers: v as typeof e1.derivedMarkers })}
                    width={140}
                    popoverWidth={420}
                  />
                  <Dropdown
                    label="Endpoint labels"
                    value={e1.endpointLabels}
                    sections={[
                      {
                        heading: 'Axis endpoint label register',
                        options: [
                          { value: 'caps-micro', label: 'Native · Caps micro', detail: 'IS 10/500/0.12em uppercase (Meta/Label/UI)' },
                          { value: 'sentence', label: 'Sentence', detail: 'Reserved · pending native approval' },
                        ],
                      },
                    ]}
                    onChange={(v) => setE1({ endpointLabels: v as typeof e1.endpointLabels })}
                    width={150}
                    popoverWidth={400}
                  />
                  <Dropdown
                    label="Marker"
                    value={e1.markerStyle}
                    sections={[
                      {
                        heading: 'Persona marker shape',
                        options: [
                          { value: 'pill', label: 'Native · Pill', detail: 'Persona name in pill (filled vs outlined for differentiation)' },
                          { value: 'dot', label: 'Dot', detail: 'Reserved · pending native approval' },
                          { value: 'tick', label: 'Tick', detail: 'Reserved · pending native approval' },
                        ],
                      },
                    ]}
                    onChange={(v) => setE1({ markerStyle: v as typeof e1.markerStyle })}
                    width={130}
                    popoverWidth={400}
                  />
                </>
              )}
              {artifactPlaygroundArtifact === 'E2' && (
                <>
                  <Dropdown
                    label="Variant"
                    value={e2.variant}
                    sections={[
                      {
                        heading: 'Register',
                        options: [
                          { value: 'side-by-side-parallel', label: 'Native · Side-by-side parallel', detail: 'Two persona tracks stacked on the same Ion 5-step timeline (UXPressia / Smaply canon)' },
                          { value: 'stacked', label: 'Stacked', detail: 'Both personas share each cell — WF on top, CCS below at every touchpoint' },
                          { value: 'opposed', label: 'Opposed', detail: 'WF track above the timeline, CCS below — mirror flip across a center axis' },
                          { value: 'single-track-multi-marker', label: 'Single-track multi-marker', detail: 'One timeline; filled vs outlined pills distinguish personas per cell' },
                          { value: 'emotion-augmented', label: 'Emotion-augmented', detail: 'Adds emotion eyebrow per cell (FRUSTRATED / NEUTRAL / SATISFIED)' },
                        ],
                      },
                    ]}
                    onChange={(v) => setE2({ variant: v as typeof e2.variant })}
                    width={210}
                    popoverWidth={460}
                  />
                  <Dropdown
                    label="Personas"
                    value={String(e2.personaCount)}
                    sections={[
                      {
                        heading: 'Persona count',
                        options: [
                          { value: '1', label: '1 · solo', detail: 'Workflow-Focused only' },
                          { value: '2', label: 'Native · 2', detail: 'Workflow-Focused + Creative Control Seekers (Ion canon)' },
                        ],
                      },
                    ]}
                    onChange={(v) => setE2({ personaCount: Number(v) as 1 | 2 })}
                    width={130}
                    popoverWidth={380}
                  />
                  <Dropdown
                    label="Path overlap"
                    value={e2.pathOverlapVisibility}
                    sections={[
                      {
                        heading: 'Annotation visibility across personas',
                        options: [
                          { value: 'full', label: 'Native · Full', detail: 'Show every persona annotation at every step' },
                          { value: 'shared-only', label: 'Shared only', detail: 'Hide annotations on steps where personas diverge (dropoff present)' },
                          { value: 'divergent-only', label: 'Divergent only', detail: 'Show only the steps where personas diverge' },
                        ],
                      },
                    ]}
                    onChange={(v) => setE2({ pathOverlapVisibility: v as typeof e2.pathOverlapVisibility })}
                    width={150}
                    popoverWidth={440}
                  />
                  <Dropdown
                    label="Dropoff markers"
                    value={e2.dropoffMarkers}
                    sections={[
                      {
                        heading: 'Friction markers (source-supported only)',
                        options: [
                          { value: 'on', label: 'Native · On', detail: '⚠ markers at steps where quote evidence supports the persona pain' },
                          { value: 'off', label: 'Off', detail: 'Hide friction markers — annotation rows only' },
                        ],
                      },
                    ]}
                    onChange={(v) => setE2({ dropoffMarkers: v as typeof e2.dropoffMarkers })}
                    width={160}
                    popoverWidth={440}
                  />
                  <Dropdown
                    label="Annotation density"
                    value={e2.annotationDensity}
                    sections={[
                      {
                        heading: 'Per-cell annotation density',
                        options: [
                          { value: 'minimal', label: 'Minimal', detail: 'Marker pill + step label only — no annotations' },
                          { value: 'standard', label: 'Native · Standard', detail: 'Marker + eyebrow + body annotation per step' },
                          { value: 'verbose', label: 'Verbose', detail: 'Adds dropoff body text + source citation under each ⚠ marker' },
                        ],
                      },
                    ]}
                    onChange={(v) => setE2({ annotationDensity: v as typeof e2.annotationDensity })}
                    width={170}
                    popoverWidth={440}
                  />
                  <Dropdown
                    label="Shared phases"
                    value={e2.sharedPhases}
                    sections={[
                      {
                        heading: 'Phase header label',
                        options: [
                          { value: 'explicit', label: 'Native · Explicit', detail: 'Top-left "Persona track" eyebrow labels the row axis' },
                          { value: 'implicit', label: 'Implicit', detail: 'Hide the row-axis eyebrow — header reads as a pure timeline' },
                        ],
                      },
                    ]}
                    onChange={(v) => setE2({ sharedPhases: v as typeof e2.sharedPhases })}
                    width={150}
                    popoverWidth={420}
                  />
                  <Dropdown
                    label="Row labels"
                    value={e2.rowLabels}
                    sections={[
                      {
                        heading: 'Per-track left-column label',
                        options: [
                          { value: 'persona-name', label: 'Native · Persona name', detail: 'Caps eyebrow with persona name only' },
                          { value: 'persona-name-plus-thesis', label: 'Persona name + thesis', detail: 'Adds the short thesis line under the name' },
                          { value: 'caps-only', label: 'Caps only', detail: 'Same as native — name in caps eyebrow register' },
                        ],
                      },
                    ]}
                    onChange={(v) => setE2({ rowLabels: v as typeof e2.rowLabels })}
                    width={150}
                    popoverWidth={440}
                  />
                </>
              )}
              {artifactPlaygroundArtifact !== 'none' && artifactPlaygroundArtifact !== 'A1' && artifactPlaygroundArtifact !== 'B1' && artifactPlaygroundArtifact !== 'C1' && artifactPlaygroundArtifact !== 'C2' && artifactPlaygroundArtifact !== 'C3' && artifactPlaygroundArtifact !== 'C4' && artifactPlaygroundArtifact !== 'C5' && artifactPlaygroundArtifact !== 'D1' && artifactPlaygroundArtifact !== 'D2' && artifactPlaygroundArtifact !== 'A2' && artifactPlaygroundArtifact !== 'A4' && artifactPlaygroundArtifact !== 'B2' && artifactPlaygroundArtifact !== 'B3' && artifactPlaygroundArtifact !== 'B4' && artifactPlaygroundArtifact !== 'E1' && artifactPlaygroundArtifact !== 'E2' && (
                <span
                  style={{
                    fontFamily: IS,
                    fontSize: 11,
                    fontWeight: 300,
                    color: 'var(--dir-text-secondary)',
                  }}
                >
                  Variant + Customize TBD — 16 of 16 wired (A1 · A2 · A4 · B1 · B2 · B3 · B4 · C1 · C2 · C3 · C4 · C5 · D1 · D2 · E1 · E2).
                </span>
              )}
              {artifactPlaygroundArtifact === 'none' && (
                <span
                  style={{
                    fontFamily: IS,
                    fontSize: 11,
                    fontWeight: 400,
                    color: 'var(--dir-text-secondary)',
                  }}
                >
                  Select an artifact to see its toggles.
                </span>
              )}
            </ToolbarGroup>
          )}

          {mode === 'gate-a-ion' && <GroupDivider />}

          {mode === 'gate-a-ion' && (
            <ToolbarGroup label="Layout">
              <Dropdown
                label="Preset"
                value={layoutPreset}
                sections={[
                  {
                    heading: 'Reset',
                    options: [
                      { value: 'native', label: 'Native', detail: 'Reset all contexts to defaults' },
                    ],
                  },
                  {
                    heading: 'Portfolio / Web',
                    options: [
                      { value: 'bill-guo', label: 'Bill Guo', detail: '24px gutter · dual on · narrow-fixed 520 · left · content-area images' },
                      { value: 'emmi-wu', label: 'Emmi Wu', detail: '24px gutter · 24px gap · 920px centered · text = images · bleed-right hero' },
                      { value: 'rachel-chen', label: 'Rachel Chen', detail: '24px gutter · 24px gap · 760px centered · text = images · contained hero' },
                      { value: 'sebs', label: 'Sebs', detail: '24px gutter · 24px gap · 840px centered · text = images · contained hero' },
                      { value: 'substack', label: 'Substack', detail: 'Centered · LG gap · 2XL text 760 · center · content-area imgs (newsletter reading)' },
                      { value: 'linear', label: 'Linear', detail: 'Centered · XS gap 16 · MD text 640 · left · content-area imgs (product/SaaS)' },
                    ],
                  },
                  {
                    heading: 'Editorial / Print',
                    options: [
                      { value: 'swiss-grid', label: 'Swiss Grid', detail: 'Centered · SM text 560 · left · constrained imgs (Müller-Brockmann discipline)' },
                      { value: 'magazine-editorial', label: 'Magazine', detail: '32px gutter · XXL gap · MD text · center · full-viewport hero (Vogue / Cahiers)' },
                      { value: 'art-catalog', label: 'Art Catalog', detail: 'Centered · XL gap · LG text · center · bleed-right imgs (Phaidon / MoMA)' },
                      { value: 'criterion', label: 'Criterion', detail: 'Centered · XL gap · LG text · center · near-bleed final (Criterion Collection essays)' },
                      { value: 'broadsheet', label: 'Broadsheet', detail: '32px gutter · tight gap · XL text 720 · left · bleed-right hero (NYT / Guardian)' },
                    ],
                  },
                  {
                    heading: 'Long-form / Academic',
                    options: [
                      { value: 'tufte', label: 'Tufte', detail: 'Centered · XS text 480 · center · text-column hero · constrained imgs (single-column book)' },
                      { value: 'longform-web', label: 'Longform Web', detail: 'Centered · generous gap 192 · MD text · center · native imgs (Atlantic / Atavist)' },
                      { value: 'nature-journal', label: 'Nature Journal', detail: 'Centered · tight gap · journal text 340 · left · column-width imgs (Nature / IEEE)' },
                      { value: 'nasa-report', label: 'NASA Report', detail: 'Centered · tight gap · XS text 480 · left · constrained imgs (technical authority)' },
                    ],
                  },
                  {
                    heading: 'Architectural / Maximal',
                    options: [
                      { value: 'oma-monograph', label: 'OMA Monograph', detail: '24px gutter · XXL gap · 3XL text 840 · full-viewport hero · panoramic final (Rem Koolhaas)' },
                      { value: 'pathology-slide', label: 'Pathology Slide', detail: '24px gutter · tight gap · journal text · bleed-right imgs · full-viewport final (medical)' },
                    ],
                  },
                ]}
                onChange={(v) => {
                  const id = v as LayoutPresetId;
                  const p = LAYOUT_PRESETS[id];
                  setLayoutPreset(id);
                  setMargin(p.margin);
                  setGateAIonInternalGap(p.gap);
                  setGateAIonTextColumnWidth(p.textWidth);
                  setGateAIonContentAlignment(p.alignment);
                  setGateAIonDualEnabled(p.dual);
                  setGateAIonDualRatio(p.ratio);
                  setGateAIonHeroBleed(p.hero);
                  setGateAIonBodyImageWidth(p.body);
                  setGateAIonFinalImageWidth(p.final);
                  setGateAIonImageWidth(p.imageWidth);
                  if (p.eyebrowStyle !== undefined) setGateAIonEyebrowStyle(p.eyebrowStyle);
                  if (p.tldrStyle !== undefined) setGateAIonTldrStyle(p.tldrStyle);
                  if (p.sectionNumberStyle !== undefined) setGateAIonSectionNumberStyle(p.sectionNumberStyle);
                  if (p.dividerStyle !== undefined) setGateAIonDividerStyle(p.dividerStyle);
                  if (p.withinSectionDivider !== undefined) setGateAIonWithinSectionDivider(p.withinSectionDivider);
                  if (p.heroHeight !== undefined) setGateAIonHeroHeight(p.heroHeight);
                  if (p.heroPosition !== undefined) setGateAIonHeroPosition(p.heroPosition);
                  if (p.heroAspect !== undefined) setGateAIonHeroAspect(p.heroAspect);
                  if (p.borderRadius !== undefined) setGateAIonBorderRadius(p.borderRadius);
                  if (p.hookMode !== undefined) setGateAIonHookMode(p.hookMode);
                  if (p.section01Position !== undefined) setGateAIonSection01Position(p.section01Position);
                  if (p.preTocHeroWidth !== undefined) setGateAIonPreTocHeroWidth(p.preTocHeroWidth);
                  if (p.eyebrowSpacing !== undefined) setGateAIonEyebrowSpacing(p.eyebrowSpacing);
                  if (p.sectionNumberSpacing !== undefined) setGateAIonSectionNumberSpacing(p.sectionNumberSpacing);
                  if (p.tldrPosition !== undefined) setGateAIonTldrPosition(p.tldrPosition);
                  if (p.s01ContributionGrid !== undefined) setGateAIonS01ContributionGrid(p.s01ContributionGrid);
                  if (p.s01MetaStrip !== undefined) setGateAIonS01MetaStrip(p.s01MetaStrip);
                  if (p.metaStripPosition !== undefined) setGateAIonMetaStripPosition(p.metaStripPosition);
                }}
                width={90}
                popoverWidth={440}
              />
              <Dropdown
                label="Gap"
                value={gateAIonInternalGap}
                sections={[
                  {
                    heading: 'TOC-to-content gap',
                    options: [
                      { value: 'native', label: 'Native · 48', detail: 'Current default — Tufte sidenote gap' },
                      { value: 'none', label: 'None · 0', detail: 'Flush — no gap between rail and content' },
                      { value: 'xs', label: 'XS · 16', detail: 'IEEE minimum functional gutter' },
                      { value: 'sm', label: 'SM · 24', detail: 'Bringhurst 1× leading minimum' },
                      { value: 'md', label: 'MD · 32', detail: 'Bringhurst 2× leading / standard column gutter' },
                      { value: 'md-lg', label: 'MD-LG · 64', detail: '8pt grid mid-step — major section gap per Figma/Material' },
                      { value: 'lg', label: 'LG · 48', detail: 'Tufte CSS sidenote gap; comfortable editorial' },
                      { value: 'xl', label: 'XL · 80', detail: 'Van de Graaf inner margin (1/9 page width)' },
                      { value: 'xxl', label: 'XXL · 128', detail: 'Magazine pictorial rail; Cahiers du Cinéma' },
                      { value: 'generous', label: 'Generous · 192', detail: 'Long-form web (The Atlantic / Atavist)' },
                    ],
                  },
                ]}
                onChange={(v) => setGateAIonInternalGap(v as GateAIonInternalGapToken)}
                width={80}
                popoverWidth={360}
              />
              <Dropdown
                label="Text Width"
                value={gateAIonTextColumnWidth}
                sections={[
                  {
                    heading: 'Reading column max-width (CPL at IS 15/300)',
                    options: [
                      { value: 'native', label: 'Native', detail: 'No constraint — fills available width' },
                      { value: 'journal', label: 'Journal · 340', detail: '~50 CPL · Nature/IEEE single-column (89mm); dense scientific' },
                      { value: 'xs', label: 'XS · 480', detail: '~70 CPL · classical Bringhurst optimal at IS 15' },
                      { value: 'sm', label: 'SM · 560', detail: '~80 CPL · Bringhurst max / Butterick mid at IS 15' },
                      { value: 'md', label: 'MD · 640', detail: '~95 CPL · within Butterick (45-90), above Bringhurst (45-75) at IS 15' },
                      { value: 'lg', label: 'LG · 680', detail: '~100 CPL · locked Reading width · lower edge of premium-portfolio empirical band' },
                      { value: 'xl', label: 'XL · 720', detail: '~105 CPL · Rachel-leaning lower bound · mainstream premium register' },
                      { value: '2xl', label: '2XL · 760', detail: '~110 CPL · Rachel Chen territory · middle of premium-portfolio band' },
                      { value: '3xl', label: '3XL · 840', detail: '~125 CPL · wide editorial / Atlantic-longform register · upper-middle of band' },
                      { value: 'wide', label: 'Wide · 920', detail: '~140 CPL · Emmi-leaning maximalist · upper band edge at IS 15' },
                      { value: 'full', label: 'Full', detail: 'No constraint — explicit full-width intent' },
                    ],
                  },
                ]}
                onChange={(v) => setGateAIonTextColumnWidth(v as GateAIonTextColumnWidthToken)}
                width={90}
                popoverWidth={380}
              />
              <Dropdown
                label="Alignment"
                value={gateAIonContentAlignment}
                sections={[
                  {
                    heading: 'Content column alignment',
                    options: [
                      { value: 'native', label: 'Native', detail: 'No explicit alignment — flex default (left)' },
                      { value: 'left', label: 'Left', detail: 'marginRight: auto — content at left with auto right' },
                      { value: 'center', label: 'Center', detail: 'margin: 0 auto — centered within available width' },
                      { value: 'right', label: 'Right', detail: 'marginLeft: auto — content at right edge' },
                      { value: 'flush-left', label: 'Flush left', detail: 'Bill Guo / Swiss grid — explicit left anchor' },
                      { value: 'spread', label: 'Spread', detail: 'Overrides maxWidth — fills 100% of available width' },
                    ],
                  },
                ]}
                onChange={(v) => setGateAIonContentAlignment(v as GateAIonContentAlignmentToken)}
                width={80}
                popoverWidth={360}
              />
              <Dropdown
                label="Img width"
                value={gateAIonImageWidth}
                sections={[
                  {
                    heading: 'Image width',
                    options: [
                      { value: 'full', label: 'Full', detail: 'All images span the full content area width' },
                      { value: 'sections-only', label: 'Sections', detail: 'Section images match text width — hero stays full' },
                      { value: 'match-text', label: 'Match text', detail: 'All images (hero + sections) match text column width' },
                    ],
                  },
                ]}
                onChange={(v) => setGateAIonImageWidth(v as GateAIonImageWidth)}
                width={80}
                popoverWidth={320}
              />
              <Dropdown
                label="Dual col"
                value={gateAIonDualEnabled}
                sections={[
                  {
                    heading: 'Dual container',
                    options: [
                      { value: 'native', label: 'Native', detail: 'No dual container — single content area' },
                      { value: 'off', label: 'Off', detail: 'Explicit single container' },
                      { value: 'on', label: 'On', detail: 'Dual container — text narrow, images escape to full width' },
                    ],
                  },
                ]}
                onChange={(v) => setGateAIonDualEnabled(v as GateAIonDualContainerEnabledToken)}
                width={70}
                popoverWidth={320}
              />
              <Dropdown
                label="Dual ratio"
                value={gateAIonDualRatio}
                sections={[
                  {
                    heading: 'Inner text column width',
                    options: [
                      { value: 'native', label: 'Native', detail: 'Native · falls back to narrow-fixed (520px)' },
                      { value: 'narrow-fixed', label: '520px', detail: 'Narrow fixed 520px — Bill Guo estimate' },
                      { value: 'narrow-text', label: '480px', detail: 'Narrow text 480px — ~70 CPL at IS 15 (classical Bringhurst optimal zone)' },
                    ],
                  },
                  {
                    heading: 'Proportional (desktop = standard reading widths)',
                    options: [
                      { value: 'half', label: '50%', detail: '50% of outer zone — equal image/text authority' },
                      { value: 'golden', label: '61.8%', detail: 'Golden section — ~677px at 1096px outer' },
                      { value: 'van-de-graaf', label: '62.5%', detail: 'Van de Graaf canon — medieval manuscript' },
                      { value: 'two-thirds', label: '66.6%', detail: 'Two-thirds — classical text:margin proportion' },
                      { value: 'iso', label: '70.7%', detail: '√2 ISO proportion — ~775px at 1096px outer' },
                    ],
                  },
                ]}
                onChange={(v) => setGateAIonDualRatio(v as GateAIonDualContainerRatioToken)}
                width={70}
                popoverWidth={360}
              />
              <Dropdown
                label="Hero bleed"
                value={gateAIonHeroBleed}
                sections={[
                  { heading: '', options: [{ value: 'native', label: 'Native', detail: 'Constrained to text column or inner container' }] },
                  {
                    heading: 'Constrained',
                    options: [
                      { value: 'inset', label: 'Inset', detail: '~80% of text column, centered — academic restraint' },
                      { value: 'text-column', label: 'Text col', detail: 'Capped at text column maxWidth — Swiss grid discipline' },
                      { value: 'inner-container', label: 'Inner', detail: 'Expands to inner container (dual-container outer)' },
                      { value: 'content-area', label: 'Content area', detail: 'Full content area — respects page margin both sides' },
                    ],
                  },
                  {
                    heading: 'Bleed',
                    options: [
                      { value: 'half-split', label: 'Half split', detail: '50–55% horizontal, image and text side-by-side' },
                      { value: 'bleed-right', label: 'Bleed right', detail: 'Extends to right viewport edge — Emmi Wu pattern' },
                      { value: 'full-viewport', label: 'Full vp', detail: '100vw — Agha / Brodovitch full-bleed origin' },
                      { value: 'monograph', label: 'Monograph', detail: '100vw + inset — Taschen, OMA, museum catalogs' },
                    ],
                  },
                ]}
                onChange={(v) => setGateAIonHeroBleed(v as GateAIonHeroBleedToken)}
                width={90}
                popoverWidth={340}
              />
              <Dropdown
                label="Body imgs"
                value={gateAIonBodyImageWidth}
                sections={[
                  { heading: '', options: [{ value: 'native', label: 'Native', detail: 'Inherits container — same as text (IMG WIDTH fallback)' }] },
                  {
                    heading: 'Constrained',
                    options: [
                      { value: 'inset', label: 'Inset', detail: '70% of text column — academic float / Nature column-and-a-half' },
                      { value: 'text-column', label: 'Text col', detail: 'Capped at text column maxWidth — university press standard' },
                      { value: 'art-book', label: 'Art book', detail: '115% of text column — Phaidon/Taschen process images' },
                      { value: 'inner-container', label: 'Inner', detail: 'Outer container width — escapes text column in dual mode' },
                      { value: 'science-double', label: 'Science dbl', detail: '~693px — Nature double-column figure (183mm)' },
                    ],
                  },
                  {
                    heading: 'Bleed',
                    options: [
                      { value: 'content-area', label: 'Content area', detail: 'Full content area — Nat Geo, Time, Fortune body visuals' },
                      { value: 'partial-bleed', label: 'Partial bleed', detail: 'Extends ~half page margin past content area — editorial extension' },
                      { value: 'bleed-right', label: 'Bleed right', detail: 'Right viewport edge — Atavist, Pitchfork longform' },
                    ],
                  },
                ]}
                onChange={(v) => setGateAIonBodyImageWidth(v as GateAIonBodyImageWidthToken)}
                width={90}
                popoverWidth={340}
              />
              <Dropdown
                label="Final imgs"
                value={gateAIonFinalImageWidth}
                sections={[
                  { heading: '', options: [{ value: 'native', label: 'Native', detail: 'Inherits container (IMG WIDTH fallback)' }] },
                  {
                    heading: 'Constrained',
                    options: [
                      { value: 'text-column', label: 'Text col', detail: 'Capped at text column — academic restraint as authority' },
                      { value: 'inner-container', label: 'Inner', detail: 'Bill Guo pattern — outer container (dual-register effect)' },
                      { value: 'content-area', label: 'Content area', detail: 'Full content area — most contemporary portfolios' },
                      { value: 'partial-bleed', label: 'Partial bleed', detail: 'Extends ~half page margin past content area — editorial extension' },
                      { value: 'near-bleed', label: 'Near bleed', detail: '4px inset — Phaidon Focus series thin-frame plate' },
                    ],
                  },
                  {
                    heading: 'Bleed',
                    options: [
                      { value: 'bleed-right', label: 'Bleed right', detail: 'Extends to right viewport edge' },
                      { value: 'full-viewport', label: 'Full vp', detail: '100vw — MoMA/Tate catalog full-bleed plate' },
                      { value: 'panoramic', label: 'Panoramic', detail: '130vw wide crop — Nat Geo / OMA cinematic wide' },
                    ],
                  },
                ]}
                onChange={(v) => setGateAIonFinalImageWidth(v as GateAIonFinalImageWidthToken)}
                width={80}
                popoverWidth={340}
              />
            </ToolbarGroup>
          )}

          {mode === 'gate-a-ion' && <GroupDivider />}

          {mode === 'gate-a-ion' && (
            <>
            <ToolbarGroup label="Pre-toc">
              <Dropdown
                label="Hook"
                value={gateAIonHookMode}
                sections={[
                  {
                    heading: '',
                    options: [
                      { value: 'default', label: 'Default', detail: 'Hook + hero inside the LocalRail flex row — standard case-page layout' },
                      { value: 'pre-toc', label: 'Pre-toc', detail: 'Hook + hero lift above LocalRail — Bill Guo style, TOC starts after hero' },
                    ],
                  },
                ]}
                onChange={(v) => setGateAIonHookMode(v as GateAIonHookMode)}
                width={90}
                popoverWidth={320}
              />
              <Dropdown
                label="§01 pos"
                value={gateAIonSection01Position}
                sections={[
                  {
                    heading: '',
                    options: [
                      { value: 'post-hero', label: 'Post-hero', detail: '§01 renders in normal section position below hero (default)' },
                      { value: 'pre-hero', label: 'Pre-hero', detail: '§01 renders above hero — only active in pre-toc mode' },
                    ],
                  },
                ]}
                onChange={(v) => setGateAIonSection01Position(v as GateAIonSection01Position)}
                width={100}
                popoverWidth={320}
              />
              <Dropdown
                label="Hero width"
                value={gateAIonPreTocHeroWidth}
                sections={[
                  {
                    heading: '',
                    options: [
                      { value: 'full-viewport', label: 'Full vp', detail: 'Hero spans 100% of page — no gutter padding — only active in pre-toc mode' },
                      { value: 'contained', label: 'Contained', detail: 'Hero stays within 24px gutter padding — only active in pre-toc mode' },
                    ],
                  },
                ]}
                onChange={(v) => setGateAIonPreTocHeroWidth(v as GateAIonPreTocHeroWidth)}
                width={100}
                popoverWidth={320}
              />
              <Dropdown
                label="TL;DR pos"
                value={gateAIonTldrPosition}
                sections={[
                  {
                    heading: '',
                    options: [
                      { value: 'after-hero', label: 'After hero', detail: 'TL;DR renders after the hero image, before §01 (default — inside main grid)' },
                      { value: 'after-subtitle', label: 'After subtitle', detail: 'TL;DR renders in the hook zone, after the subtitle, before the hero' },
                    ],
                  },
                ]}
                onChange={(v) => setGateAIonTldrPosition(v as GateAIonTldrPosition)}
                width={110}
                popoverWidth={340}
              />
              <Dropdown
                label="Eyebrow gap"
                value={gateAIonEyebrowSpacing}
                sections={[
                  {
                    heading: '',
                    options: [
                      { value: 'cards', label: 'Cards · 4', detail: '4px — matches Part 1 Narrow 4 project card eyebrow spacing' },
                      { value: 'tight', label: 'Tight · 8', detail: '8px — tight ladder step' },
                      { value: 'snug', label: 'Snug · 12', detail: '12px — locked Sebs preset eyebrow→H1 gap' },
                      { value: 'compact', label: 'Compact · 16', detail: '16px — compact ladder step' },
                      { value: 'default', label: 'Default · 24', detail: '24px — original locked default' },
                      { value: 'loose', label: 'Loose · 32', detail: '32px — loose ladder step' },
                    ],
                  },
                ]}
                onChange={(v) => setGateAIonEyebrowSpacing(v as GateAIonEyebrowSpacing)}
                width={110}
                popoverWidth={340}
              />
              <Dropdown
                label="§# gap"
                value={gateAIonSectionNumberSpacing}
                sections={[
                  {
                    heading: 'Type 1 — §# section identifier → headline',
                    options: [
                      { value: 'tight', label: 'Tight · 4', detail: '4px — tightest ladder step between section number and heading (locked default)' },
                      { value: 'compact', label: 'Compact · 8', detail: '8px — compact ladder step' },
                      { value: 'default', label: 'Default · 12', detail: '12px — standard ladder step' },
                      { value: 'loose', label: 'Loose · 16', detail: '16px — looser ladder step' },
                    ],
                  },
                ]}
                onChange={(v) => setGateAIonSectionNumberSpacing(v as GateAIonSectionNumberSpacing)}
                width={90}
                popoverWidth={320}
              />
              <Dropdown
                label="Mini-title gap"
                value={gateAIonEyebrowChunkGap}
                sections={[
                  {
                    heading: 'Types 2+3 — eyebrow as mini-title → its content (atomic value or chunk)',
                    options: [
                      { value: 'tight', label: 'Tight · 8', detail: '8px — eyebrow tight to value/chunk; tightest mini-title step' },
                      { value: 'compact', label: 'Compact · 12', detail: '12px — locked default (provisional 2026-05-09)' },
                      { value: 'default', label: 'Default · 16', detail: '16px — looser mini-title spacing' },
                      { value: 'loose', label: 'Loose · 20', detail: '20px — most generous mini-title spacing' },
                    ],
                  },
                ]}
                onChange={(v) => setGateAIonEyebrowChunkGap(v as GateAIonEyebrowChunkGap)}
                width={120}
                popoverWidth={420}
              />
              <Dropdown
                label="Hero density"
                value={gateAIonHeroDensityMode}
                sections={[
                  {
                    heading: 'Cycle 6 A/B — entry / hero zone density (body §01–§10 locked at Standard)',
                    options: [
                      { value: 'standard', label: 'Standard · 64/48/24', detail: 'Hero=64 / Section=48 / Block=24 — LOCKED 2026-05-09. Matches body density throughout; no hero→body structural seam. Default after visual A/B vs Airy showed Airy did not produce a meaningful read-difference for this hero.' },
                      { value: 'airy', label: 'Airy · 80/64/32', detail: 'Hero=80 / Section=64 / Block=32 — original hypothesis (locked spec sanctions Airy for "page entry / hero-transition / opening beats"). Toggle kept for revisit if hero content/layout changes meaningfully.' },
                    ],
                  },
                ]}
                onChange={(v) => setGateAIonHeroDensityMode(v as GateAIonHeroDensityMode)}
                width={120}
                popoverWidth={440}
              />
            </ToolbarGroup>
            <ToolbarGroup label="§01">
              <Dropdown
                label="Contrib grid"
                value={gateAIonS01ContributionGrid}
                sections={[
                  {
                    heading: 'Research §4 candidates',
                    options: [
                      { value: 'role-line', label: '4a · Inline rows', detail: 'Each group as CAPS label + interpunct-joined items on one line — minimal scannable register' },
                      { value: 'role-team', label: '4b · Stacked sidehead', detail: 'CAPS label above + items as comma-prose below — quieter than 3-col, more scannable than wall-label' },
                      { value: 'film-credit', label: '4c · Film credit ★', detail: 'Film-style credit register — right-aligned CAPS labels / items as comma-prose left column' },
                      { value: 'wall-label', label: '4d · Wall label', detail: 'Museum wall-label register — sentence-case label inline at start of each line, items as semicolon-prose' },
                      { value: 'sidehead-chips', label: '4e · Sidehead + chips', detail: 'CAPS sidehead LEFT, items rendered as chips RIGHT per group' },
                      { value: 'native', label: '4f · Native 3-col', detail: 'Defense fallback — 3-column grid with CAPS heading + bullet list per column' },
                    ],
                  },
                  {
                    heading: 'Research §5 candidates',
                    options: [
                      { value: 'contrib-def-list', label: 'Def-list (alternate)', detail: 'Semantic <dl><dt><dd> register — sentence-case label + indented items. Reverted from default 2026-05-02: failed visual review (system-orphan bold sentence-case label, indented rows read as Notion-property-list). Step A symmetry: 3-col native is the answer; cliche was at chrome layer not pattern layer.' },
                      { value: 'contrib-credit-prose', label: 'CRediT prose (deprecated)', detail: 'CRediT-taxonomy verbs in prose — DEPRECATED 2026-05-01 (collapses 3 categorical lists into single-author attribution per research §7)' },
                      { value: 'contrib-credits-card', label: '★ Credits card', detail: 'Journal-style author/affiliation block — name lines + small affiliation lines (Nature/PLOS register)' },
                      { value: 'contrib-museum-positional', label: '★ Museum positional', detail: 'Positional credit lines, no labels (Tate-register attribution) — name / role / institution stacked' },
                      { value: 'contrib-byline', label: 'Editorial byline', detail: '"By X. With Y. Reviewed by Z." editorial byline register' },
                      { value: 'contrib-credit-statement', label: 'Credit statement', detail: 'Single ≤30-word author statement, no labels — paragraph-as-attribution' },
                      { value: 'contrib-finding-aid', label: 'Finding aid', detail: 'Archival sidehead pairs — "Scope:" / "Provenance:" / "Relation:" register (LoC EAD)' },
                      { value: 'contrib-program-billing', label: 'Program billing', detail: 'Playbill billing order — name first, role after, ranked by contribution weight' },
                      { value: 'contrib-degree-modifier', label: 'Degree modifier', detail: 'Lead / Equal / Supporting axis — CRediT-style degree modifiers per role' },
                    ],
                  },
                  {
                    heading: 'Defense alternates',
                    options: [
                      { value: 'two-col', label: 'Two-col', detail: '2-column — What I Owned + Enabled stacked left, How I Led Alignment right' },
                      { value: 'stacked', label: 'Stacked rows', detail: 'Single column — each group as a labeled row with border separator, items as interpunct list' },
                      { value: 'inline', label: 'Inline', detail: 'Flat — CAPS category label followed by items as interpunct-separated inline text' },
                      { value: 'hidden', label: 'Hidden', detail: 'Contribution grid suppressed entirely' },
                    ],
                  },
                ]}
                onChange={(v) => setGateAIonS01ContributionGrid(v as GateAIonS01ContributionGrid)}
                width={120}
                popoverWidth={380}
              />
              <Dropdown
                label="TLDR"
                value={gateAIonS01TldrRegister}
                sections={[
                  {
                    heading: 'Research recommendations',
                    options: [
                      { value: 'tldr-standfirst', label: '★ Standfirst', detail: 'Editorial standfirst — single ISe paragraph (~25-40 words) sized between H1 and body, no chrome (Stuff & Nonsense / River register)' },
                      { value: 'tldr-dek', label: '★ Dek', detail: 'Magazine dek — short bridge paragraph between hed and lede, ISe italic, centered (Hoefler & Co. register)' },
                      { value: 'tldr-tombstone', label: '★ Tombstone', detail: 'Museum tombstone — title / artist / date stack with no chrome, sentence-case (Art Institute of Chicago register)' },
                    ],
                  },
                  {
                    heading: 'Alternates',
                    options: [
                      { value: 'native', label: 'Native · left-border', detail: 'Locked default — left-border block with TL;DR label + IS body' },
                      { value: 'tldr-eyebrow-stack', label: 'Eyebrow stack', detail: 'IS 10 CAPS eyebrow + ISe body paragraph stacked below, no border' },
                      { value: 'tldr-dropcap-lede', label: 'Dropcap lede', detail: 'Editorial lede with ISe drop-cap (3 lines), CSS-Tricks register' },
                      { value: 'tldr-epigraph', label: 'Epigraph', detail: 'Italic epigraph register — ISe italic, indented, attribution line below' },
                      { value: 'tldr-pullquote-scale', label: 'Pullquote scale', detail: 'TL;DR rendered at pullquote scale (ISe 22-28px), no chrome' },
                      { value: 'tldr-abstract-column', label: 'Abstract column', detail: 'Academic abstract — labeled "Abstract" sidehead, narrow column, justified (Nature register)' },
                    ],
                  },
                ]}
                onChange={(v) => setGateAIonS01TldrRegister(v as GateAIonS01TldrRegister)}
                width={110}
                popoverWidth={380}
              />
              <Dropdown
                label="Meta strip"
                value={gateAIonS01MetaStrip}
                sections={[
                  {
                    heading: '',
                    options: [
                      { value: 'native', label: 'Native · row', detail: 'Native — flex-wrap row of LABEL + value pairs (locked default)' },
                      { value: 'columns', label: 'Columns', detail: 'Each field as an independent column — label above, value below (Rachel Chen pattern)' },
                      { value: '2-col', label: '2 col', detail: '2-column grid — items in 2 columns × 4 rows (pre-title sidebar)' },
                      { value: 'grid', label: 'Grid', detail: '4-column definition grid — label col, value col, label col, value col; 2 pairs per row' },
                      { value: 'hidden', label: 'Hidden', detail: 'Metadata strip suppressed entirely' },
                    ],
                  },
                ]}
                onChange={(v) => setGateAIonS01MetaStrip(v as GateAIonS01MetaStrip)}
                width={100}
                popoverWidth={340}
              />
              <Dropdown
                label="Meta pos"
                value={gateAIonMetaStripPosition}
                sections={[
                  {
                    heading: '',
                    options: [
                      { value: 'native', label: 'Native · in §01', detail: 'Native — metadata strip inside §01 Overview, below contribution grid (locked default)' },
                      { value: 'post-hero', label: 'Post-hero', detail: 'Rachel Chen — dedicated strip between hero and §01, full text-column width' },
                      { value: 'pre-title', label: 'Pre-title', detail: 'Bill Guo — right column in hook zone alongside H1, two-column layout' },
                    ],
                  },
                ]}
                onChange={(v) => setGateAIonMetaStripPosition(v as GateAIonMetaStripPosition)}
                width={110}
                popoverWidth={380}
              />
            </ToolbarGroup>
            <ToolbarGroup label="§02">
              <Dropdown
                label="Artifact treatment"
                value={gateAIonS02ArtifactTreatment}
                sections={[
                  {
                    heading: '§02 annotated old-Ion screenshot treatment (visual A/B 2026-05-24)',
                    options: [
                      { value: 'native', label: 'Native · hand-drawn marks on raw screenshot', detail: 'Current treatment. Hand-drawn rough-oval annotation marks (rough.js / handFeel) on raw screenshot. --dir-recessed inner bg, no outer wrapper, no eyebrow. Per Shestopalov "annotated old-UI" precedent + Ion hand-feel family (matches §04 Venn + §03 hand-feel artifacts). Caption below with numbered quote pairs.' },
                      { value: 'raised-wrapper', label: 'Raised wrapper + eyebrow (hybrid)', detail: 'Keep hand-drawn marks unchanged, ADD outer --dir-raised surface + 1px --dir-border + CAPS 10 eyebrow above ("OLD ION · IN SESSION"). Matches §04 Venn / §05 Funnel / §06 closer artifact wrapper treatment. Conflates research-observation pattern with synthesis-artifact pattern per `feedback_case_study_artifact_treatment` — explore to evaluate.' },
                      { value: 'leader-lines', label: 'Rachel Chen pattern · raised + labeled callouts', detail: 'Raised outer surface + CAPS eyebrow + clean RECTANGULAR numbered markers (no hand-feel) on image. Labeled callouts BELOW image with bold labels + descriptive text (simulates Rachel Chen leader-line callout look). Drops the hand-feel annotation family for §02 in favor of cleaner technical annotation register. Different job from research-observation pattern.' },
                    ],
                  },
                ]}
                onChange={(v) => setGateAIonS02ArtifactTreatment(v as GateAIonS02ArtifactTreatment)}
                width={180}
                popoverWidth={460}
              />
            </ToolbarGroup>
            <ToolbarGroup label="§03">
              <Dropdown
                label="Direction"
                value={gateAIonS03Direction}
                sections={[
                  {
                    heading: 'Native',
                    options: [
                      { value: 'native-fixed', label: 'Native · fixed', detail: 'Density-disciplined clean baseline — neutral default, real scale variance, addresses the 5 paragraph-blur issues' },
                      { value: 'native-original', label: 'Native · original', detail: 'Original paragraph-blur baseline — kept for A/B comparison ("what bad looked like")' },
                    ],
                  },
                  {
                    heading: 'Direction 1 · Data Journalism',
                    options: [
                      { value: '1A-pew-multiples', label: '1A · Pew multiples', detail: 'Pew Research small-multiples logic — sparkline per insight, common scale, finding-led row titles' },
                      { value: '1B-pudding-qual', label: '1B · Pudding qual-lead', detail: 'Pudding register — qual narrative dominant, stats demoted to inline sentence-embedded numbers' },
                      { value: '1C-reuters-longform', label: '1C · Reuters long-form', detail: 'Reuters DNR — big stat numerals, tinted insight blocks, methods compressed to top metadata' },
                    ],
                  },
                  {
                    heading: 'Direction 2 · Editorial Print',
                    options: [
                      { value: '2A-magazine-pull-stat', label: '2A · Magazine pull-stat', detail: 'Magazine feature spread — one hero stat at editorial-headline scale (~80-120px CD/ISe)' },
                      { value: '2B-tufte-sparkline', label: '2B · Tufte sparkline', detail: 'Tufte data-text integration — numbers inline with prose, no separate stats row' },
                    ],
                  },
                  {
                    heading: 'Direction 3 · Out-of-the-box',
                    options: [
                      { value: '3A-annual-letter', label: '3A · Annual letter', detail: 'Berkshire/Apple letter — pure prose, stats inline, low chrome, maximum compression' },
                      { value: '3B-scientific-abstract', label: '3B · Scientific abstract', detail: 'Nature/IEEE structured abstract — Methods/Findings/Insight→Req/Pattern micro-blocks' },
                      { value: '3C-museum-wall', label: '3C · Museum wall text', detail: 'MoMA/Tate exhibition — title + 2-3 sentences + tombstone metadata, curator register' },
                    ],
                  },
                  {
                    heading: 'Direction 4 · Design Portfolio',
                    options: [
                      { value: '4A-billguo-framed', label: '4A · Bill Guo framed', detail: 'Bill Guo — bordered insight cards, disciplined frame chrome' },
                      { value: '4B-senior-narrated', label: '4B · Senior narrated', detail: 'Senior-portfolio milestone register — numbered insights as vertical track with body+req' },
                      { value: '4C-studio-brief', label: '4C · Studio brief', detail: 'Pentagram/MetaLab brief — 3-up grid of mini-blocks with rule lines, deck-like' },
                    ],
                  },
                ]}
                onChange={(v) => setGateAIonS03Direction(v as GateAIonS03Direction)}
                width={140}
                popoverWidth={420}
              />
              {/* §03 Persona Artifact toggle — REPLACES the inline persona callout when active.
                  Default `none` = callout. ★ recommended marker annotates the option that pairs
                  best with the currently active direction (per gate-a-ion-s03-phase-a-research.md
                  Track 2 lines 491-505, revised 2026-05-16). */}
              {(() => {
                const recId = recommendedPersonaArtifactForDirection(gateAIonS03Direction);
                const sections = PERSONA_ARTIFACT_SECTIONS.map((s) => ({
                  ...s,
                  options: s.options.map((o) => ({
                    ...o,
                    ...(recId && o.value === recId ? { meta: `★ for ${gateAIonS03Direction.replace(/-/g, ' ')}` } : {}),
                  })),
                }));
                return (
                  <Dropdown
                    label="Persona artifact"
                    value={gateAIonS03PersonaArtifact}
                    sections={sections}
                    onChange={(v) => setGateAIonS03PersonaArtifact(v as GateAIonS03PersonaArtifact)}
                    width={150}
                    popoverWidth={460}
                  />
                );
              })()}
              {/* §03 Persona Density — controls the NATIVE persona callout (when no artifact is
                  active). Artifacts NOT affected — they visually communicate the same persona message
                  on their own register. Four states (progressive merge, decreasing treatment count). */}
              <Dropdown
                label="Persona density"
                value={gateAIonS03PersonaContentDensity}
                sections={[
                  {
                    heading: '',
                    options: [
                      { value: 'original', label: 'Original', detail: 'Direction-native register per shipped per-direction spec. Each direction renders persona callout per its identity (Pew panels / Pudding prose / Reuters source-blocks / etc).' },
                      { value: 'A-4treat', label: 'A · 4 treatments', detail: '4 distinct typographic registers, cohesive per line: CAPS eyebrow (value) → ISe name → BODY quote → CAPTION affinity-clusters attribution.' },
                      { value: 'B-3treat', label: 'B · 3 treatments', detail: '3 registers. Line 1 merges name+value at single ISe 22 (no inline size jump). Line 2 = BODY quote. Line 3 = CAPTION affinity-clusters.' },
                      { value: 'C-2treat', label: 'C · 2 treatments', detail: 'Maximally merged. Line 1 = ISe name+value compound. Line 2 = DENSE quote+affinity-clusters compound. Two registers total, single register per line.' },
                    ],
                  },
                ]}
                onChange={(v) => setGateAIonS03PersonaContentDensity(v as GateAIonS03PersonaContentDensity)}
                width={130}
                popoverWidth={420}
              />
              {/* Native persona layout — stacked or side-by-side (1fr 1fr). Affects merged densities
                  A/B/C. At C density, side-by-side wraps prose into multi-line per half-column,
                  partially defeating the "max-merged 2-line" intent. Exploratory toggle. */}
              <Dropdown
                label="Persona layout"
                value={gateAIonS03NativePersonaLayout}
                sections={[
                  {
                    heading: 'Native persona callout layout (merged densities)',
                    options: [
                      { value: 'stacked', label: 'Stacked', detail: 'Cohorts stacked vertically at full text-column width. Preserves C density "max-merged 2-line" intent.' },
                      { value: 'side-by-side', label: 'Side-by-side', detail: '1fr 1fr grid — both cohorts at half-column. Easier parallel comparison; at C density the prose wraps to multi-line.' },
                    ],
                  },
                ]}
                onChange={(v) => setGateAIonS03NativePersonaLayout(v as GateAIonS03NativePersonaLayout)}
                width={130}
                popoverWidth={360}
              />
              {/* EXT.E1 cluster sub-toggle: how themes get incorporated. Only meaningfully
                  affects cluster artifacts (V1/V3); other EXT.E1.X variants ignore. */}
              <Dropdown
                label="EXT.E1 themes"
                value={gateAIonS03ExtE1ThemesStyle}
                sections={[
                  {
                    heading: 'How themes incorporate into the EXT.E1 cluster artifact',
                    options: [
                      { value: 'i', label: '(i) Replace trait labels', detail: 'Themes REPLACE the trait labels at the persona\'s 3 lean endpoints. WF\'s south endpoint reads "QUICK DESIGN REQUESTS" instead of "SPEEDING AUTOMATION."' },
                      { value: 'ii', label: '(ii) Pill chips at lean', detail: 'Themes render as pill chips at lean positions IN ADDITION to the trait labels. Both visible.' },
                      { value: 'iii', label: '(iii) Inline on lines', detail: 'Theme keyword drawn INLINE on each connector line from pill to lean endpoint, like a labeled axis.' },
                    ],
                  },
                ]}
                onChange={(v) => setGateAIonS03ExtE1ThemesStyle(v as GateAIonS03ExtE1ThemesStyle)}
                width={150}
                popoverWidth={360}
              />
              {/* EXT.E1 cluster sub-toggle: how lean direction gets visually encoded. */}
              <Dropdown
                label="EXT.E1 lean"
                value={gateAIonS03ExtE1LeanDirection}
                sections={[
                  {
                    heading: 'How the persona lean direction gets visually encoded',
                    options: [
                      { value: 'alpha', label: '(α) Lines only to lean', detail: 'Connector lines ONLY go to the 3 lean endpoints. Non-lean endpoints just exist as labels at perimeter without lines.' },
                      { value: 'beta', label: '(β) Pill shifts off-center', detail: 'Persona pill SHIFTS off-center toward the average lean direction. The pill\'s position IS the lean encoding.' },
                      { value: 'gamma', label: '(γ) Arrowheads on lines', detail: 'Lines have arrows/triangles at the lean endpoint — explicit directional markers showing "this persona is pulled toward here."' },
                      { value: 'delta', label: '(δ) Bigger lean markers', detail: 'Lean endpoints get a much larger marker (filled dot) vs tiny non-lean. Visual weight = lean.' },
                    ],
                  },
                ]}
                onChange={(v) => setGateAIonS03ExtE1LeanDirection(v as GateAIonS03ExtE1LeanDirection)}
                width={150}
                popoverWidth={360}
              />
              {/* §03 sub-section gap — controls vertical breathing room between native-fixed §03
                  sub-sections (insights, persona callout, pattern close). 4 spacings anchored to
                  the §10 Reflection sub-section gap as reference. */}
              <Dropdown
                label="Sub-section gap"
                value={gateAIonS03SubSectionGap}
                sections={[
                  {
                    heading: 'Locked spacing ladder · applies to all sub-section gaps (any CAPS 13/15 OR ISe 22 sub-section title): §03 insights, §05 guardrails, §06 Ruby steps, §07 decisions, §09 outcomes, §10 Reflection. Section→section transition stays locked at 128.',
                    options: [
                      { value: 'native', label: 'Native · 32px', detail: 'Current shipped gap. 16px row padding (Component), 32px effective.' },
                      { value: 'reflection', label: 'Reflection · 48px', detail: 'Matches §10 Reflection sub-section rhythm. 24px row padding (Block), 48px effective (Section).' },
                      { value: 'wide', label: 'Wide · 64px', detail: 'Hero-tier spacing. 32px row padding, 64px effective. Half of section→section transition (128).' },
                    ],
                  },
                ]}
                onChange={(v) => setGateAIonS03SubSectionGap(v as GateAIonS03SubSectionGap)}
                width={150}
                popoverWidth={420}
              />
            </ToolbarGroup>
            <ToolbarGroup label="§05">
              <Dropdown
                label="Guardrails layout"
                value={gateAIonS05GuardrailsLayout}
                sections={[
                  {
                    heading: 'Cycle 7 Q1 Phase B B1 final — Ruby Guardrails layout',
                    options: [
                      { value: 'grid-2x2', label: '2×2 grid · editorial', detail: 'LOCKED 2026-05-12 (default). 4 items in 1fr 1fr grid, ISe 22 title + Body 15 description, sub-section register held. 4-rule symmetry maps to 2×2 naturally; descriptions fit half-column; substantive feel preserved.' },
                      { value: 'stacked', label: 'Stacked · editorial', detail: 'Off-state retained for future revisit if rule descriptions grow. 4 items vertical, same ISe 22 + Body 15 register, Block 24 between items. Matches §07 decision row pattern but lost visual A/B vs 2×2 grid.' },
                    ],
                  },
                ]}
                onChange={(v) => setGateAIonS05GuardrailsLayout(v as GateAIonS05GuardrailsLayout)}
                width={140}
                popoverWidth={420}
              />
            </ToolbarGroup>
            <ToolbarGroup label="§07">
              <Dropdown
                label="Row id"
                value={gateAIonS07RowId}
                sections={[
                  {
                    heading: 'Decision row ordinal anchor',
                    options: [
                      { value: 'off', label: 'Off (native)', detail: 'No row id. Title + accordion structure carry sequence. Consistent with §08/§10 row patterns. CSML §07 doesn\'t mandate numbering.' },
                      { value: 'numeric', label: '01 / 02 / 03', detail: 'Zero-padded ordinals at Eyebrow register (IS 10/500/0.12em UC text-secondary). Reinforces the "Three decisions" framing. Lab-canonical.' },
                    ],
                  },
                ]}
                onChange={(v) => setGateAIonS07RowId(v as GateAIonS07RowId)}
                width={120}
                popoverWidth={360}
              />
            </ToolbarGroup>
            <ToolbarGroup label="§09">
              <Dropdown
                label="Outcomes mode"
                value={gateAIonOutcomesMode}
                sections={[
                  {
                    heading: 'Outcomes / Scoreboards mode (CSML §09)',
                    options: [
                      { value: 'mode-a', label: 'Mode A (native) · Outcome Spine', detail: 'Six-tier reading spine — outcome headline · framing · primary outcome (raised bg) · validation signals (inline pairs) · lower supporting (2-col siblings) · what still needs measurement (recessed footer). Default reusable system mode per CSML.' },
                      { value: 'mode-b', label: 'Mode B · Narrative Ledger', detail: 'Authored narrative top + state-grouped rows (Shipped / Prototyped & Enabled / In Development) + measurement footer. CSML notes Mode B as the likely Ion implementation pick (line 165).' },
                    ],
                  },
                ]}
                onChange={(v) => setGateAIonOutcomesMode(v as GateAIonOutcomesMode)}
                width={180}
                popoverWidth={400}
              />
            </ToolbarGroup>
            </>
          )}
        </div>

        {/* ── Row 2 · identity axes (narrow-2 + family only) ───────────── */}
        {showIdentityRow && (
          <div style={toolbarRow}>
            <ToolbarGroup label="Frame">
              <Dropdown
                label="Card frame"
                value={cardFrame}
                sections={cardFrameSections}
                onChange={(v) => setCardFrame(v as CardFrameState)}
                width={150}
                popoverWidth={320}
              />
              <Dropdown
                label="Divider"
                value={divider}
                sections={dividerSections}
                onChange={(v) => setDivider(v as DividerState)}
                width={150}
                popoverWidth={320}
              />
              <Dropdown
                label="Aspect variance"
                value={aspectVariance}
                sections={aspectVarianceSections}
                onChange={(v) => setAspectVariance(v as AspectVarianceState)}
                width={170}
                popoverWidth={320}
              />
              <Dropdown
                label="Density"
                value={density}
                sections={densitySections}
                onChange={(v) => setDensity(v as DensityState)}
                width={170}
                popoverWidth={340}
              />
              {(mode === 'narrow-2' || mode === 'narrow-3') && (
                <Dropdown
                  label="Card scale"
                  value={cardScale}
                  sections={cardScaleSections}
                  onChange={(v) => setCardScale(v as CardScaleMode)}
                  width={200}
                  popoverWidth={380}
                />
              )}
            </ToolbarGroup>

            <GroupDivider />

            <ToolbarGroup label="Type">
              <Dropdown
                label="Title register"
                value={titleRegister}
                sections={titleRegisterSections}
                onChange={(v) => setTitleRegister(v as TitleRegisterState)}
                width={170}
                popoverWidth={320}
              />
              <Dropdown
                label="Caption register"
                value={captionRegister}
                sections={captionRegisterSections}
                onChange={(v) => setCaptionRegister(v as CaptionRegisterState)}
                width={170}
                popoverWidth={320}
              />
            </ToolbarGroup>

            <GroupDivider />

            <ToolbarGroup label="Media">
              <Dropdown
                label="Image treatment"
                value={imageTreatment}
                sections={imageTreatmentSections}
                onChange={(v) => setImageTreatment(v as ImageTreatmentState)}
                width={180}
                popoverWidth={340}
              />
            </ToolbarGroup>

            <GroupDivider />

            <ToolbarGroup label="Proof">
              <Dropdown
                label="Shipped proof"
                value={shippedProof}
                sections={shippedProofSections}
                onChange={(v) => setShippedProof(v as ShippedProofState)}
                width={160}
                popoverWidth={320}
              />
              <Dropdown
                label="Proof placement"
                value={proofPlacement}
                sections={proofPlacementSections}
                onChange={(v) => setProofPlacement(v as ProofPlacementState)}
                width={180}
                popoverWidth={340}
              />
            </ToolbarGroup>
          </div>
        )}
          </div>
        )}
      </div>
      )}
      <button
        type="button"
        onClick={toggleChrome}
        aria-pressed={!chromeVisible}
        aria-label={chromeVisible ? 'Hide lab chrome' : 'Show lab chrome'}
        title={chromeVisible ? 'Hide lab chrome' : 'Show lab chrome'}
        style={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 300,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 12px',
          fontFamily: IS,
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--dir-text-primary)',
          backgroundColor: 'var(--dir-recessed)',
          border: '1px solid var(--dir-border)',
          borderRadius: 999,
          cursor: 'pointer',
          boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
        }}
      >
        <span>{chromeVisible ? 'Hide chrome' : 'Show chrome'}</span>
        <span aria-hidden style={{ fontSize: 9, lineHeight: 1 }}>
          {chromeVisible ? '▴' : '▾'}
        </span>
      </button>
      {(mode === 'narrow-2' || mode === 'narrow-3') && currentFamily && (
        <PresetApplier family={currentFamily} />
      )}
      <Outlet />
    </div>
  );
}

// ─── Toolbar layout helpers ────────────────────────────────────────────────

const toolbarRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  flexWrap: 'wrap',
  rowGap: 8,
};

const modeLabelStyle: React.CSSProperties = {
  fontFamily: IS,
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--dir-text-primary)',
  marginRight: 8,
};

const heldLabelStyle: React.CSSProperties = {
  marginLeft: 'auto',
  fontFamily: IS,
  fontSize: 11,
  fontWeight: 300,
  color: 'var(--dir-detail)',
};

function ToolbarGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flexWrap: 'wrap',
      }}
    >
      <span
        style={{
          fontFamily: IS,
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--dir-text-secondary)',
        }}
      >
        {label}
      </span>
      {children}
    </div>
  );
}

function GroupDivider() {
  return (
    <span
      aria-hidden
      style={{
        display: 'inline-block',
        width: 1,
        height: 18,
        backgroundColor: 'var(--dir-border)',
        flexShrink: 0,
      }}
    />
  );
}
