import { Outlet, useNavigate, useParams } from 'react-router';
import { Dropdown } from '../Dropdown';
import { IS } from '../cards/tokens';
import {
  F_FAMILIES,
  LAYOUT_FAMILIES,
  isFFamilyId,
  isLayoutFamilyId,
  type FFamilyId,
  type LayoutFamilyId,
} from './heroFamilies';
import { useDirectionMode, type DirectionMode } from '../../state/DirectionModeContext';
import { useCardFit, type CardFit } from '../../state/CardFitContext';
import { useMediaFrame, type MediaFrameMode } from '../../state/MediaFrameContext';
import { useLabChrome } from '../../state/LabChromeContext';
import { useMediaTruth, type MediaTruth } from '../../state/MediaTruthContext';
import { useNarrow4FeaturedAspectVariance } from '../../state/Narrow4FeaturedAspectVarianceContext';
import { useNarrow4StandardAspectVariance } from '../../state/Narrow4StandardAspectVarianceContext';
import { useNarrow4EyebrowPlacement, type EyebrowPlacement } from '../../state/Narrow4EyebrowPlacementContext';
import { useNarrow4FeaturedProofMode, type Narrow4FeaturedProofMode } from '../../state/Narrow4FeaturedProofModeContext';
import type { AspectVarianceState } from '../../state/AspectVarianceContext';
import { useF3BPath, type F3BPath } from '../../state/F3BPathContext';
import { useF3TiltRange, type F3TiltRange } from '../../state/F3TiltRangeContext';
import { useF3EntranceStagger, type F3EntranceStagger } from '../../state/F3EntranceStaggerContext';
import { useF3BConcept, type F3BConcept, F3B_CONCEPTS } from '../../state/F3BConceptContext';
import { useF3AConcept, type F3AConcept, F3A_CONCEPTS } from '../../state/F3AConceptContext';
import { useF3HoverTreatment, type F3HoverTreatment } from '../../state/F3HoverTreatmentContext';
import { useF3Visibility } from '../../state/F3VisibilityContext';
import { useF3TitleCopy, type F3TitleCopy, F3_TITLE_COPIES } from '../../state/F3TitleCopyContext';
import { useF3BStickyOffset, type F3BStickyOffset, F3B_STICKY_OFFSETS } from '../../state/F3BStickyOffsetContext';
import { useF3StackOrdering, type F3StackOrdering, F3_STACK_ORDERINGS } from '../../state/F3StackOrderingContext';
import { useF3BColumnWidth, type F3BColumnWidth, F3B_COLUMN_WIDTHS } from '../../state/F3BColumnWidthContext';
import { useF3SubjectForms, type F3PegboardFormChoice, type F3TrophyWallFormChoice, type F3DeskFormChoice } from '../../state/F3SubjectFormsContext';
import { F3_PEGBOARD_SUBJECTS, F3_TROPHY_WALL_SUBJECTS, F3_A_DESK_SUBJECTS } from './cells/f3CoreIdentitySet';
import { useF3PegboardHang, type F3PegboardHang, F3_PEGBOARD_HANGS } from '../../state/F3PegboardHangContext';
import { useF3SvgStyle, type F3SvgStyle, F3_SVG_STYLES } from '../../state/F3SvgStyleContext';
import {
  useF3RoughModifiers,
  MULTI_STROKE_STEPS, FILL_STYLE_STEPS, PALETTE_MODE_STEPS, TEXTURE_STEPS, DOT_PATTERN_STEPS,
  ENDPOINT_BEHAVIOR_STEPS, SKETCHING_STYLE_STEPS, PEN_TIP_STEPS,
  type MultiStrokeStep, type FillStyleStep, type PaletteModeStep, type TextureStep, type DotPatternStep,
  type EndpointBehaviorStep, type SketchingStyleStep, type PenTipStep,
} from '../../state/F3RoughModifiersContext';
import { Slider } from './Slider';
import { STYLE_PRESETS, applyStylePreset } from './cells/SvgStyleTransform';
import { useF3TextTreatment, type F3TextTreatment, F3_TEXT_TREATMENTS } from '../../state/F3TextTreatmentContext';
import { useF3TitleRegister, type F3TitleRegister, F3_TITLE_REGISTERS } from '../../state/F3TitleRegisterContext';
import { F3B_PINS } from './cells/f3bPinSlate';
import { F3A_OBJECT_SLATE } from './cells/f3aObjectSlate';

// Hero #8 lab shell — replaces LabShell as the parent route.
// Ports the narrow-4 chrome subset the user wants: Theme, Card fit,
// Media frame, F-family, Layout, Version, Pair-native media, narrow-4
// register row (Featured aspect, Standard aspect, Eyebrow, FTR proof) +
// Hide toggles. Drops GATE A track + Research MODE dropdowns (those are
// not relevant in a separate hero lab).

const VERSION_OPTIONS = [
  { value: 'v1', label: 'V1 · Grid', detail: 'Equal-width 2-up pairs.' },
  { value: 'v2', label: 'V2 · Masonry', detail: 'CSS columns:2 with authored per-tile aspects.' },
  { value: 'v3', label: 'V3 · Asym rows', detail: 'Two paired rows with asymmetric widths.' },
];

const ASPECT_VARIANCE_OPTIONS: { value: AspectVarianceState; label: string; detail?: string }[] = [
  { value: 'native', label: 'Native', detail: 'Honor surface\'s authored default.' },
  { value: 'fill-cell', label: 'Fill cell', detail: 'Media flex-fills the card cell.' },
  { value: 'uniform', label: 'Uniform', detail: 'Asset\'s intrinsic aspect drives box height.' },
  { value: 'authored', label: 'Authored', detail: 'Per-slot authored aspect.' },
  { value: 'cinematic', label: 'Cinematic · 21:9' },
  { value: 'widescreen', label: 'Widescreen · 16:9' },
  { value: 'golden', label: 'Golden · 1.618:1' },
  { value: 'square', label: 'Square · 1:1' },
];

const EYEBROW_OPTIONS: { value: EyebrowPlacement; label: string; detail?: string }[] = [
  { value: 'option-a', label: 'Option A · top-left', detail: 'Eyebrow + title tight cluster · right col = proof only' },
  { value: 'option-b', label: 'Option B · right col', detail: 'Eyebrow in right column · left col = title + body' },
];

const FTR_PROOF_OPTIONS: { value: Narrow4FeaturedProofMode; label: string; detail?: string }[] = [
  { value: 'native', label: 'Native', detail: 'Honor surface authored proof.' },
  { value: 'inline-10', label: 'Inline · IS 10', detail: 'Compact inline proof, IS 10.' },
  { value: 'stacked-13', label: 'Stacked · IS 13', detail: 'Stack the proof rows at IS 13.' },
];

const MEDIA_OPTIONS: { value: MediaTruth; label: string; detail?: string }[] = [
  { value: 'real-asset', label: 'real-asset', detail: 'Project screenshots.' },
  { value: 'structural-placeholder', label: 'structural-placeholder', detail: 'Neutral solid for structural reads.' },
];

// ─── PER-STYLE MODIFIER SETS ──────────────────────────────────────────────
// Defines which modifiers each style exposes. Chrome renders dynamically.
// User direction 2026-06-01: per-style modifier sets + sliders for continuous,
// dropdowns for discrete. Each style declares its own modifier inventory.

// Recalibrated 2026-06-01 — playground-port pass.
// Old wider ranges (roughness 0-12, fillDensity 0-3) caused extreme visual
// jumps for tiny slider deltas. Tightened to the useful working zone of each
// modifier so sliders feel smooth across their full travel.
// Recalibrated 2026-06-02 per user direction: trim each slider to its USEFUL
// working zone — the range where output reads as the intended register without
// hitting "broken" or "useless" extremes. Range references:
// • roughness max 1.6 — playground default 1.0; Excalidraw chaos zone begins >1.4
// • bowing max 2.5 — rough.js default 1.0; spec §3.1.2 "bowing > 2 on short edges = over-stylized"
// • strokeWidth max 3.0 — user verified 3.05 too thick; 6 renders as solid blob (broken)
// • curveTightness max 1.5 — spec §3.1.4 ">0.5 eliminates bowing's visible effect" (useful past that = niche)
// • hachureGap max 12 — past 12 = 0-1 lines fit in typical 60-100px hero shape; slider wasted
// • fillDensity max 1.2 — Phase 1A clamp (fillWeight ≤ gap × 0.7) makes >1.2 typically clamped
// • blurAmount max 1.5 — spec §3.4.3 "> 1.5 washes out small shapes"
// • grainIntensity max 2.5 — spec §3.4.5 "> 2.5 visibly fragments strokes"
// • smudgeAmount max 2 — spec §3.4.6 "> 2 visibly drags shape on small shapes"
// • offsetDistance max 6 — risograph hero scale; >6 breaks registration on small pins
// • registrationError max 1.5 — >1.5 reads as random noise, not registration jitter
const SLIDER_SPECS = {
  // I-11: master proportion-preserving multiplier on HAND_FEEL_BASE.
  // > 1.4 enters Excalidraw signature zone (slider styling shows warn).
  wobble:            { min: 0,    max: 2.0, step: 0.05 },
  roughness:         { min: 0,    max: 1.6, step: 0.02 },
  bowing:            { min: 0,    max: 2.5, step: 0.05 },
  strokeWidth:       { min: 0.3,  max: 3.0, step: 0.05 },
  curveTightness:    { min: 0,    max: 1.5, step: 0.02 },
  hachureGap:        { min: 1,    max: 12,  step: 0.25 },
  hachureAngle:      { min: -90,  max: 90,  step: 1    },
  fillDensity:       { min: 0,    max: 1.2, step: 0.02 },
  inkIntensity:      { min: 0,    max: 1,   step: 0.01 },
  fillOpacity:       { min: 0,    max: 1,   step: 0.01 },
  blurAmount:        { min: 0,    max: 1.5, step: 0.05 },
  bleed:             { min: 0,    max: 1,   step: 0.02 },
  dotSize:           { min: 0.3,  max: 6,   step: 0.1  },
  dotSpacing:        { min: 1,    max: 20,  step: 0.25 },
  dotScatter:        { min: 0,    max: 1,   step: 0.02 },
  grainIntensity:    { min: 0,    max: 2.5, step: 0.05 },
  smudgeAmount:      { min: 0,    max: 2,   step: 0.05 },
  pressureVariance:  { min: 0,    max: 1,   step: 0.02 },
  offsetDistance:    { min: 0,    max: 6,   step: 0.25 },
  offsetAngle:       { min: -180, max: 180, step: 1    },
  colorShift:        { min: 0,    max: 1,   step: 0.02 },
  registrationError: { min: 0,    max: 1.5, step: 0.05 },
  textureIntensity:  { min: 0,    max: 2.5, step: 0.05 },
} as const;

const UNIVERSAL_MODIFIERS = ['inkIntensity', 'fillOpacity', 'paletteMode', 'texture', 'textureIntensity'] as const;

const MODIFIER_SETS_BY_STYLE: Record<F3SvgStyle, readonly string[]> = {
  'clean':           ['inkIntensity', 'fillOpacity', 'paletteMode', 'texture', 'textureIntensity'],
  'outline-only':    ['strokeWidth', 'inkIntensity', 'paletteMode', 'texture', 'textureIntensity'],
  'wireframe':       ['strokeWidth', 'inkIntensity', 'paletteMode', 'texture', 'textureIntensity'],
  'wet-ink':         ['blurAmount', 'bleed', 'inkIntensity', 'fillOpacity', 'paletteMode', 'textureIntensity'],
  'charcoal':        ['grainIntensity', 'smudgeAmount', 'pressureVariance', 'inkIntensity', 'fillOpacity', 'paletteMode', 'textureIntensity'],
  'newsprint':       ['inkIntensity', 'fillOpacity', 'paletteMode', 'texture', 'textureIntensity'],
  'risograph':       ['offsetDistance', 'offsetAngle', 'colorShift', 'risoSecondaryColor', 'registrationError', 'inkIntensity', 'fillOpacity', 'paletteMode', 'texture', 'textureIntensity'],
  // Wobble is the Multi-Stroke cluster master (I-11/I-13). Listed first so chrome
  // groups it at the top of the rough-family modifier row.
  'rough-handdrawn': ['wobble', 'roughness', 'bowing', 'strokeWidth', 'curveTightness', 'multiStroke', 'endpointBehavior', 'sketchingStyle', 'penTip', 'fillStyle', 'hachureGap', 'hachureAngle', 'fillDensity', 'inkIntensity', 'fillOpacity', 'paletteMode', 'texture', 'textureIntensity'],
  'sketchy':         ['wobble', 'roughness', 'bowing', 'strokeWidth', 'curveTightness', 'multiStroke', 'endpointBehavior', 'sketchingStyle', 'penTip', 'inkIntensity', 'fillOpacity', 'paletteMode', 'texture', 'textureIntensity'],
  'bold-ink':        ['wobble', 'strokeWidth', 'bowing', 'curveTightness', 'fillStyle', 'fillDensity', 'endpointBehavior', 'penTip', 'inkIntensity', 'fillOpacity', 'paletteMode', 'texture', 'textureIntensity'],
  'stipple':         ['wobble', 'roughness', 'bowing', 'strokeWidth', 'curveTightness', 'multiStroke', 'endpointBehavior', 'sketchingStyle', 'penTip', 'fillStyle', 'hachureGap', 'fillDensity', 'inkIntensity', 'fillOpacity', 'paletteMode', 'texture', 'textureIntensity'],
};

export function Hero8Shell() {
  const navigate = useNavigate();
  const { fFamilyId: fParam = '', layoutFamilyId: lParam = '', versionId: vParam = 'v1' } = useParams();

  const activeF: FFamilyId = isFFamilyId(fParam) ? fParam : 'f3';
  const activeL: LayoutFamilyId = isLayoutFamilyId(lParam) ? lParam : 'a';
  const activeV = ['v1', 'v2', 'v3'].includes(vParam) ? vParam : 'v1';
  const onCellRoute = !!fParam && !!lParam;

  const navTo = (f: FFamilyId, l: LayoutFamilyId, v: string) => {
    navigate(`/hero-8/${f}/${l}/${v}`);
  };

  const { state: directionMode, setState: setDirectionMode } = useDirectionMode();
  const { state: cardFit, setState: setCardFit } = useCardFit();
  const { state: mediaFrame, setState: setMediaFrame } = useMediaFrame();
  const { chromeVisible, setChromeVisible } = useLabChrome();
  const { mode: media, setMode: setMedia } = useMediaTruth();
  const { state: featuredAspect, setState: setFeaturedAspect } = useNarrow4FeaturedAspectVariance();
  const { state: standardAspect, setState: setStandardAspect } = useNarrow4StandardAspectVariance();
  const { state: eyebrow, setState: setEyebrow } = useNarrow4EyebrowPlacement();
  const { state: ftrProof, setState: setFtrProof } = useNarrow4FeaturedProofMode();
  const { state: f3bPath, setState: setF3BPath } = useF3BPath();
  const { state: f3bTilt, setState: setF3BTilt } = useF3TiltRange();
  const { state: f3bStagger, setState: setF3BStagger } = useF3EntranceStagger();
  const { state: f3bConcept, setState: setF3BConcept } = useF3BConcept();
  const { state: f3aConcept, setState: setF3AConcept } = useF3AConcept();
  const { state: f3Hover, setState: setF3Hover } = useF3HoverTreatment();
  const { hiddenA, hiddenB, toggleA: toggleVisibilityA, toggleB: toggleVisibilityB } = useF3Visibility();
  const { state: f3Title, setState: setF3Title } = useF3TitleCopy();
  const { state: f3bSticky, setState: setF3BSticky } = useF3BStickyOffset();
  const { stateA: f3aStack, stateB: f3bStack, setStateA: setF3AStack, setStateB: setF3BStack } = useF3StackOrdering();
  const { state: f3bColumnWidth, setState: setF3BColumnWidth } = useF3BColumnWidth();
  const { pegboard: pegboardForms, setPegboardForm, trophyWall: trophyWallForms, setTrophyWallForm, f3aDesk: f3aDeskForms, setF3ADeskForm } = useF3SubjectForms();
  const { state: pegboardHang, setState: setPegboardHang } = useF3PegboardHang();
  const { state: svgStyle, setState: setSvgStyle } = useF3SvgStyle();
  const { state: mods, set: setMod, replace: replaceMods, reset: resetMods } = useF3RoughModifiers();
  // Suppress unused-var warnings on mods key access via destructure
  void resetMods;
  const { stateA: f3aText, stateB: f3bText, setStateA: setF3AText, setStateB: setF3BText } = useF3TextTreatment();
  const { stateA: f3aType, stateB: f3bType, setStateA: setF3AType, setStateB: setF3BType } = useF3TitleRegister();

  // F3-A route detection (cell-specific concept dropdown)
  const onF3ARoute = onCellRoute && activeF === 'f3' && activeL === 'a';
  // F3-B route detection (cell-specific concept + path dropdowns)
  const onF3BRoute = onCellRoute && activeF === 'f3' && activeL === 'b';
  // F3 family route (either A or B) — for tilt + entrance toggles that
  // apply across the whole desk family per user direction 2026-05-29
  const onF3FamilyRoute = onF3ARoute || onF3BRoute;

  const labelStyle = {
    fontFamily: IS,
    fontSize: 10,
    fontWeight: 500,
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    color: 'var(--dir-text-secondary)',
  };

  if (!chromeVisible) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--dir-bg)' }}>
        <button
          onClick={() => setChromeVisible(true)}
          style={{
            position: 'fixed',
            top: 12,
            right: 12,
            zIndex: 200,
            padding: '6px 12px',
            border: '1px solid var(--dir-border)',
            backgroundColor: 'var(--dir-raised)',
            color: 'var(--dir-text-primary)',
            fontFamily: IS,
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            borderRadius: 4,
          }}
        >
          Show toggles
        </button>
        <Outlet />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--dir-bg)' }}>
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backgroundColor: 'var(--dir-recessed)',
          borderBottom: '1px solid var(--dir-border)',
          padding: '10px clamp(16px, 3vw, 48px)',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          fontFamily: IS,
          fontSize: 11,
          color: 'var(--dir-text-secondary)',
        }}
      >
        {/* Row 1 — global lab axis */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14 }}>
          <span style={labelStyle}>HERO #8 LAB</span>
          <Dropdown
            label="Theme"
            value={directionMode}
            sections={[
              {
                heading: 'Direction mode',
                options: [
                  { value: 'light', label: 'Light · W1', detail: 'Locked canonical system.' },
                  { value: 'dark', label: 'Dark · W1-D', detail: 'Dark companion prototype.' },
                ],
              },
            ]}
            onChange={(v) => setDirectionMode(v as DirectionMode)}
            width={130}
            popoverWidth={300}
          />
          <Dropdown
            label="Card fit"
            value={cardFit}
            sections={[
              {
                heading: 'Featured card vertical fit',
                options: [
                  { value: 'current', label: 'Current', detail: 'Native height.' },
                  { value: 'compact', label: 'Compact · fits viewport', detail: 'Shrinks media area to fit viewport.' },
                ],
              },
            ]}
            onChange={(v) => setCardFit(v as CardFit)}
            width={170}
            popoverWidth={300}
          />
          <Dropdown
            label="Media frame"
            value={mediaFrame}
            sections={[
              {
                heading: 'Media frame',
                options: [
                  { value: 'none', label: 'None (current)' },
                  { value: 'hairline', label: 'Hairline 1px' },
                  { value: 'mat', label: 'Mat · padded' },
                ],
              },
            ]}
            onChange={(v) => setMediaFrame(v as MediaFrameMode)}
            width={150}
            popoverWidth={280}
          />
          <span style={{ ...labelStyle, marginLeft: 'auto' }}>
            {onCellRoute
              ? `${activeF.toUpperCase()}-${activeL.toUpperCase()} · ${activeV.toUpperCase()} · T8-S4 LOCKED · COMPACT`
              : 'Pick a cell ↓'}
          </span>
          <button
            onClick={() => setChromeVisible(false)}
            style={{
              padding: '4px 10px',
              border: '1px solid var(--dir-border)',
              backgroundColor: 'var(--dir-bg)',
              color: 'var(--dir-text-primary)',
              fontFamily: IS,
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              borderRadius: 3,
            }}
          >
            Hide toggles
          </button>
        </div>

        {/* Row 2 — cell axis */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14 }}>
          <span style={labelStyle}>CELL</span>
          <Dropdown
            label="F-family"
            value={onCellRoute ? activeF : ''}
            placeholder="— pick F-family —"
            sections={[
              {
                heading: 'F-families',
                options: F_FAMILIES.map((f) => ({
                  value: f.id,
                  label: `${f.label} · ${f.workingName}`,
                  detail: f.thesis,
                })),
              },
            ]}
            onChange={(v) => navTo(v as FFamilyId, activeL, activeV)}
            width={180}
            popoverWidth={340}
          />
          <Dropdown
            label="Layout"
            value={onCellRoute ? activeL : ''}
            placeholder="— pick layout —"
            sections={[
              {
                heading: 'Layout families',
                options: LAYOUT_FAMILIES.map((l) => ({
                  value: l.id,
                  label: l.label,
                  detail: l.workingName,
                })),
              },
            ]}
            onChange={(v) => navTo(activeF, v as LayoutFamilyId, activeV)}
            width={140}
            popoverWidth={300}
          />
          <Dropdown
            label="Version"
            value={activeV}
            sections={[{ heading: 'Version', options: VERSION_OPTIONS }]}
            onChange={(v) => navTo(activeF, activeL, v)}
            width={140}
            popoverWidth={260}
          />
          <span style={labelStyle}>PAIR-NATIVE</span>
          <Dropdown
            label="Media"
            value={media}
            sections={[{ heading: 'Media truth', options: MEDIA_OPTIONS }]}
            onChange={(v) => setMedia(v as MediaTruth)}
            width={170}
            popoverWidth={260}
          />
        </div>

        {/* Row 3 — narrow-4 register */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14 }}>
          <span style={labelStyle}>NARROW 4 · REGISTER</span>
          <Dropdown
            label="Featured aspect"
            value={featuredAspect}
            sections={[{ heading: 'Featured aspect', options: ASPECT_VARIANCE_OPTIONS }]}
            onChange={(v) => setFeaturedAspect(v as AspectVarianceState)}
            width={170}
            popoverWidth={300}
          />
          <Dropdown
            label="Standard aspect"
            value={standardAspect}
            sections={[{ heading: 'Standard aspect', options: ASPECT_VARIANCE_OPTIONS }]}
            onChange={(v) => setStandardAspect(v as AspectVarianceState)}
            width={170}
            popoverWidth={300}
          />
          <Dropdown
            label="Eyebrow"
            value={eyebrow}
            sections={[{ heading: 'Eyebrow placement', options: EYEBROW_OPTIONS }]}
            onChange={(v) => setEyebrow(v as EyebrowPlacement)}
            width={200}
            popoverWidth={360}
          />
          <Dropdown
            label="Ftr proof"
            value={ftrProof}
            sections={[{ heading: 'Featured proof mode', options: FTR_PROOF_OPTIONS }]}
            onChange={(v) => setFtrProof(v as Narrow4FeaturedProofMode)}
            width={170}
            popoverWidth={300}
          />
        </div>

        {/* Row 4 — F3 family cell-specific toggles */}
        {onF3FamilyRoute && (
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14 }}>
            <span style={labelStyle}>
              {onF3ARoute ? 'F3-A · HERO BAND' : 'F3-B · HERO ZONE'}
            </span>

            {/* Concept dropdown — cell-specific (F3-A vs F3-B have different
                candidate sets per their respective research docs) */}
            {onF3ARoute && (
              <Dropdown
                label="Concept"
                value={f3aConcept}
                sections={[
                  {
                    heading: 'F3-A candidate concepts',
                    options: F3A_CONCEPTS.map((c) => ({
                      value: c.id,
                      label: c.built ? c.label : `${c.label} · pending`,
                      detail: c.detail,
                    })),
                  },
                ]}
                onChange={(v) => setF3AConcept(v as F3AConcept)}
                width={200}
                popoverWidth={360}
              />
            )}
            {onF3BRoute && (
              <Dropdown
                label="Concept"
                value={f3bConcept}
                sections={[
                  {
                    heading: 'F3-B candidate concepts',
                    options: F3B_CONCEPTS.map((c) => ({
                      value: c.id,
                      label: c.built ? c.label : `${c.label} · pending`,
                      detail: c.detail,
                    })),
                  },
                ]}
                onChange={(v) => setF3BConcept(v as F3BConcept)}
                width={200}
                popoverWidth={360}
              />
            )}

            {/* SVG style — only visible on F3-B Path 2 (SVG). Phase 1 step 1
                per F3-toggle-architecture.md. Clean / outline-only / rough-handdrawn
                applied to PinShape (Trophy Wall + Floating Canvas) + PegToolShape
                (Pegboard). On Path 1 (3D) this toggle no-ops since 3D doesn't go
                through the SVG style transform. */}
            {onF3BRoute && f3bPath === 'path-2-svg' && (
              <Dropdown
                label="Style"
                value={svgStyle}
                sections={[
                  {
                    heading: 'SVG render style',
                    options: F3_SVG_STYLES.map((s) => ({
                      value: s.id,
                      label: s.label,
                      detail: s.detail,
                    })),
                  },
                ]}
                onChange={(v) => {
                  // Auto-snap modifier state to the new style's STYLE_PRESETS
                  // entry (handoff 2026-06-02 Phase 1B). Style switch carries
                  // its preset along — user no longer has to click Reset to
                  // re-baseline. MODIFIER_SETS_BY_STYLE also gates chrome
                  // visibility per style, but the underlying state now matches.
                  const next = v as F3SvgStyle;
                  replaceMods(applyStylePreset(mods, next));
                  setSvgStyle(next);
                }}
                width={170}
                popoverWidth={380}
              />
            )}

            {/* Hang mechanism — Pegboard only. How each item attaches to the wall. */}
            {onF3BRoute && f3bConcept === 'pegboard' && (
              <Dropdown
                label="Hang"
                value={pegboardHang}
                sections={[
                  {
                    heading: 'Pegboard hanging mechanism',
                    options: F3_PEGBOARD_HANGS.map((h) => ({
                      value: h.id,
                      label: h.label,
                      detail: h.detail,
                    })),
                  },
                ]}
                onChange={(v) => setPegboardHang(v as F3PegboardHang)}
                width={150}
                popoverWidth={320}
              />
            )}

            {/* Path — F3-B only (F3-A has only 3D path currently) */}
            {onF3BRoute && (
              <Dropdown
                label="Path"
                value={f3bPath}
                sections={[
                  {
                    heading: 'Rendering path',
                    options: [
                      { value: 'path-2-svg', label: 'Path 2 · SVG', detail: 'Line-illustration scattered placeholder pins · default.' },
                      { value: 'path-1-3d', label: 'Path 1 · 3D', detail: 'R3F isometric/flat 3D pin objects on a wall plane.' },
                    ],
                  },
                ]}
                onChange={(v) => setF3BPath(v as F3BPath)}
                width={150}
                popoverWidth={320}
              />
            )}

            {/* Tilt + Entrance apply to whole F3 family (A and B) */}
            <Dropdown
              label="Tilt range"
              value={f3bTilt}
              sections={[
                {
                  heading: 'Object tilt magnitude',
                  options: [
                    { value: 'tight', label: 'Tight · ±3°', detail: 'Restrained read; nearly upright.' },
                    { value: 'medium', label: 'Medium · ±8°', detail: 'Default — composed-messy register.' },
                    { value: 'wide', label: 'Wide · ±15°', detail: 'Collage-chaos read; aggressive tilt.' },
                  ],
                },
              ]}
              onChange={(v) => setF3BTilt(v as F3TiltRange)}
              width={150}
              popoverWidth={300}
            />
            <Dropdown
              label="Entrance"
              value={f3bStagger}
              sections={[
                {
                  heading: 'Cascade-reveal stagger',
                  options: [
                    { value: 'off', label: 'Off', detail: 'All objects arrive at once on mount.' },
                    { value: 'subtle', label: 'Subtle · 60ms', detail: 'Quiet stagger; barely perceptible.' },
                    { value: 'medium', label: 'Medium · 110ms', detail: 'Default — visible cascade rhythm.' },
                    { value: 'pronounced', label: 'Pronounced · 200ms', detail: 'Slow ceremonial reveal; theatrical.' },
                  ],
                },
              ]}
              onChange={(v) => setF3BStagger(v as F3EntranceStagger)}
              width={170}
              popoverWidth={320}
            />
            <Dropdown
              label="Hover"
              value={f3Hover}
              sections={[
                {
                  heading: 'Hover treatment',
                  options: [
                    { value: 'scale', label: 'Scale only', detail: 'Object grows on hover; no rotation or glow.' },
                    { value: 'loosen', label: 'Loosen', detail: 'Tilt jitter — pin-loosens-from-board feel.' },
                    { value: 'glow', label: 'Glow', detail: 'Subtle highlight/shadow lift on hover.' },
                    { value: 'all', label: 'All · default', detail: 'Scale + loosen + glow combined.' },
                  ],
                },
              ]}
              onChange={(v) => setF3Hover(v as F3HoverTreatment)}
              width={140}
              popoverWidth={300}
            />
            <Dropdown
              label="Title"
              value={f3Title}
              sections={[
                {
                  heading: 'Identity title copy',
                  options: F3_TITLE_COPIES.map((t) => ({
                    value: t.id,
                    label: t.label,
                    detail: t.text,
                  })),
                },
              ]}
              onChange={(v) => setF3Title(v as F3TitleCopy)}
              width={170}
              popoverWidth={420}
            />
            {onF3BRoute && (
              <Dropdown
                label="Column width"
                value={f3bColumnWidth}
                sections={[
                  {
                    heading: 'F3-B left column width override',
                    options: F3B_COLUMN_WIDTHS.map((w) => ({
                      value: w.id,
                      label: w.label,
                      detail: w.detail,
                    })),
                  },
                ]}
                onChange={(v) => setF3BColumnWidth(v as F3BColumnWidth)}
                width={180}
                popoverWidth={420}
              />
            )}
            {onF3BRoute && (
              <Dropdown
                label="Sticky top"
                value={String(f3bSticky)}
                sections={[
                  {
                    heading: 'F3-B column sticky offset',
                    options: F3B_STICKY_OFFSETS.map((px) => ({
                      value: String(px),
                      label: px === 32 ? `${px}px · default` : `${px}px`,
                      detail: px === 0 ? 'Flush against the chrome strip.' : `${px}px breathing below the chrome.`,
                    })),
                  },
                ]}
                onChange={(v) => setF3BSticky(parseInt(v, 10) as F3BStickyOffset)}
                width={170}
                popoverWidth={320}
              />
            )}
            {/* Stack ordering — cell-aware. Same A/B/C/D ids; per-cell interpretation. */}
            <Dropdown
              label="Stack"
              value={onF3ARoute ? f3aStack : f3bStack}
              sections={[
                {
                  heading: onF3ARoute ? 'F3-A stack ordering (horizontal band)' : 'F3-B stack ordering (vertical column)',
                  options: F3_STACK_ORDERINGS.map((s) => ({
                    value: s.id,
                    label: s.label,
                    detail: onF3ARoute ? s.detailA : s.detailB,
                  })),
                },
              ]}
              onChange={(v) => {
                if (onF3ARoute) setF3AStack(v as F3StackOrdering);
                else setF3BStack(v as F3StackOrdering);
              }}
              width={200}
              popoverWidth={420}
            />

            {/* Text treatment — cell-aware (A and B independent per research). */}
            <Dropdown
              label="Text"
              value={onF3ARoute ? f3aText : f3bText}
              sections={[
                {
                  heading: onF3ARoute ? 'F3-A hero text treatment' : 'F3-B hero text treatment',
                  options: F3_TEXT_TREATMENTS.map((t) => ({
                    value: t.id,
                    label: t.label,
                    detail: t.detail,
                  })),
                },
              ]}
              onChange={(v) => {
                if (onF3ARoute) setF3AText(v as F3TextTreatment);
                else setF3BText(v as F3TextTreatment);
              }}
              width={200}
              popoverWidth={380}
            />

            {/* Title register — locked face × size pair per typography-system.md. */}
            <Dropdown
              label="Register"
              value={onF3ARoute ? f3aType : f3bType}
              sections={[
                {
                  heading: onF3ARoute ? 'F3-A title register' : 'F3-B title register',
                  options: F3_TITLE_REGISTERS.map((t) => ({
                    value: t.id,
                    label: t.label,
                    detail: t.detail,
                  })),
                },
              ]}
              onChange={(v) => {
                if (onF3ARoute) setF3AType(v as F3TitleRegister);
                else setF3BType(v as F3TitleRegister);
              }}
              width={200}
              popoverWidth={380}
            />
          </div>
        )}

        {/* Row 5 — per-object visibility chip row (legacy).
            All CIS-converted concepts (F3-B Pegboard / Trophy Wall / Floating
            Canvas + F3-A desk) use Row 6 per-subject form dropdowns with 'off'
            instead. Row 5 is now hidden across the entire F3 family. Kept in
            case a future non-CIS concept needs it. */}
        {false && onF3FamilyRoute && !(onF3BRoute && (f3bConcept === 'pegboard' || f3bConcept === 'trophy-wall' || f3bConcept === 'floating-canvas')) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
            <span style={{ ...labelStyle, marginRight: 8 }}>Visible</span>
            {(onF3ARoute ? F3A_OBJECT_SLATE : F3B_PINS.map((p) => ({ id: p.id, label: p.label }))).map((obj) => {
              const hidden = onF3ARoute ? hiddenA.has(obj.id) : hiddenB.has(obj.id);
              const onToggle = () =>
                onF3ARoute ? toggleVisibilityA(obj.id) : toggleVisibilityB(obj.id);
              return (
                <button
                  key={obj.id}
                  onClick={onToggle}
                  title={hidden ? 'Click to show' : 'Click to hide'}
                  style={{
                    padding: '3px 9px',
                    border: '1px solid var(--dir-border)',
                    backgroundColor: hidden ? 'transparent' : 'var(--dir-text-primary)',
                    color: hidden ? 'var(--dir-detail)' : 'var(--dir-bg)',
                    fontFamily: IS,
                    fontSize: 10,
                    fontWeight: 500,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    borderRadius: 12,
                    opacity: hidden ? 0.6 : 1,
                    transition: 'opacity 120ms ease, background-color 120ms ease, color 120ms ease',
                  }}
                >
                  {obj.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Row 6 — per-subject form dropdowns (CIS-driven).
            Per user direction 2026-05-31: every CIS subject has its own dropdown
            with 'off' + N form variants. Replaces the visibility chip row on
            concepts that have CIS form catalogs (currently Pegboard + Trophy
            Wall). Floating Canvas still uses Row 5 chip toggle until its CIS
            conversion lands. 14 subjects wrap across multiple lines. */}
        {onF3ARoute && (
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
            <span style={{ ...labelStyle, marginRight: 8 }}>Subjects · F3-A desk forms</span>
            {F3_A_DESK_SUBJECTS.map((subj) => (
              <Dropdown
                key={subj.id}
                label={subj.displayName}
                value={f3aDeskForms[subj.id]}
                sections={[
                  {
                    heading: `${subj.displayName} · desk form (3D)`,
                    options: [
                      { value: 'off', label: 'Off', detail: 'Remove from the desk.' },
                      ...subj.forms.map((f) => ({
                        value: f.shape,
                        label: f.label,
                        detail: f.caption,
                      })),
                    ],
                  },
                ]}
                onChange={(v) => setF3ADeskForm(subj.id, v as F3DeskFormChoice)}
                width={150}
                popoverWidth={300}
              />
            ))}
          </div>
        )}

        {onF3BRoute && f3bConcept === 'pegboard' && (
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
            <span style={{ ...labelStyle, marginRight: 8 }}>Subjects · Pegboard forms</span>
            {F3_PEGBOARD_SUBJECTS.map((subj) => (
              <Dropdown
                key={subj.id}
                label={subj.displayName}
                value={pegboardForms[subj.id]}
                sections={[
                  {
                    heading: `${subj.displayName} · form`,
                    options: [
                      { value: 'off', label: 'Off', detail: 'Hide this subject from the wall.' },
                      ...subj.forms.map((f) => ({
                        value: f.shape,
                        label: f.label,
                        detail: f.caption,
                      })),
                    ],
                  },
                ]}
                onChange={(v) => setPegboardForm(subj.id, v as F3PegboardFormChoice)}
                width={150}
                popoverWidth={300}
              />
            ))}
          </div>
        )}

        {onF3BRoute && (f3bConcept === 'trophy-wall' || f3bConcept === 'floating-canvas') && (
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
            <span style={{ ...labelStyle, marginRight: 8 }}>
              Subjects · {f3bConcept === 'floating-canvas' ? 'Floating Canvas (shared with Trophy Wall)' : 'Trophy Wall forms'}
            </span>
            {F3_TROPHY_WALL_SUBJECTS.map((subj) => (
              <Dropdown
                key={subj.id}
                label={subj.displayName}
                value={trophyWallForms[subj.id]}
                sections={[
                  {
                    heading: `${subj.displayName} · memorabilia form`,
                    options: [
                      { value: 'off', label: 'Off', detail: 'Hide this subject from the wall.' },
                      ...subj.forms.map((f) => ({
                        value: f.shape,
                        label: f.label,
                        detail: f.caption,
                      })),
                    ],
                  },
                ]}
                onChange={(v) => setTrophyWallForm(subj.id, v as F3TrophyWallFormChoice)}
                width={150}
                popoverWidth={320}
              />
            ))}
          </div>
        )}

        {/* Row 7 — Per-style modifier panel.
            Each style declares its modifier set (numeric → sliders, discrete → dropdowns).
            Chrome renders only the modifiers the active style uses. */}
        {onF3BRoute && f3bPath === 'path-2-svg' && (() => {
          const declared = MODIFIER_SETS_BY_STYLE[svgStyle] ?? UNIVERSAL_MODIFIERS;
          const has = (k: keyof typeof SLIDER_SPECS | string) => declared.includes(k);
          return (
            <>
              {/* CLUSTER 1 — Multi-Stroke (per 09-LOCKED-MODEL.md I-13 + doc 19 §E).
                  Wobble is the cluster master (path/motion). Roughness slot is currently
                  inert; reserved for Surface Texture rework. */}
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 12 }}>
                <span style={{ ...labelStyle, marginRight: 8 }}>Multi-Stroke · {svgStyle}</span>
                {has('wobble')           && <Slider label={mods.wobble > 1.4 ? "Wobble · ⚠ Excalidraw zone" : "Wobble"} value={mods.wobble}           min={SLIDER_SPECS.wobble.min}           max={SLIDER_SPECS.wobble.max}           step={SLIDER_SPECS.wobble.step}           onChange={(v) => setMod('wobble', v)} />}
                {has('roughness')        && <Slider label="Roughness"   value={mods.roughness}        min={SLIDER_SPECS.roughness.min}        max={SLIDER_SPECS.roughness.max}        step={SLIDER_SPECS.roughness.step}        onChange={(v) => setMod('roughness', v)} />}
                {has('bowing')           && <Slider label="Bowing"      value={mods.bowing}           min={SLIDER_SPECS.bowing.min}           max={SLIDER_SPECS.bowing.max}           step={SLIDER_SPECS.bowing.step}           onChange={(v) => setMod('bowing', v)} />}
                {has('strokeWidth')      && <Slider label="Stroke width" value={mods.strokeWidth}     min={SLIDER_SPECS.strokeWidth.min}      max={SLIDER_SPECS.strokeWidth.max}      step={SLIDER_SPECS.strokeWidth.step}      onChange={(v) => setMod('strokeWidth', v)} />}
                {has('curveTightness')   && <Slider label="Curve"       value={mods.curveTightness}   min={SLIDER_SPECS.curveTightness.min}   max={SLIDER_SPECS.curveTightness.max}   step={SLIDER_SPECS.curveTightness.step}   onChange={(v) => setMod('curveTightness', v)} />}
                {has('multiStroke')      && <Dropdown label="Multi-stroke" value={mods.multiStroke} sections={[{ heading: 'Multi-stroke', options: MULTI_STROKE_STEPS.map((s) => ({ value: s, label: s })) }]} onChange={(v) => setMod('multiStroke', v as MultiStrokeStep)} width={140} popoverWidth={220} />}
                {has('endpointBehavior') && <Dropdown label="Endpoint" value={mods.endpointBehavior} sections={[{ heading: 'Endpoint behavior (playground)', options: ENDPOINT_BEHAVIOR_STEPS.map((s) => ({ value: s, label: s, detail: s === 'clean' ? 'Sharp corners at vertices' : s === 'protrude' ? 'Slight overshoot at corners' : s === 'long-overshoot' ? 'Heavy overshoot — sketchbook look' : 'Kinked corners (random angle)' })) }]} onChange={(v) => setMod('endpointBehavior', v as EndpointBehaviorStep)} width={140} popoverWidth={320} />}
                {has('sketchingStyle') && mods.multiStroke !== 'off' && mods.multiStroke !== 'single' && <Dropdown label="Sketching style" value={mods.sketchingStyle} sections={[{ heading: 'Layered-stroke pacing (playground)', options: SKETCHING_STYLE_STEPS.map((s) => ({ value: s, label: s, detail: s === 'single-pass' ? 'Layers stack on same path' : s === 'loose-overlap' ? 'Layers offset along segment' : s === 'parallel-pass' ? 'Concentric outward layers' : 'Crisscross rotation per layer' })) }]} onChange={(v) => setMod('sketchingStyle', v as SketchingStyleStep)} width={160} popoverWidth={340} />}
                {has('penTip')           && <Dropdown label="Pen tip" value={mods.penTip} sections={[{ heading: 'Pen-tip preset (perfect-freehand)', options: PEN_TIP_STEPS.map((s) => ({ value: s, label: s, detail:
                  s === 'plain' ? 'Plain stroke — uniform width, no variable taper' :
                  s === 'ballpoint' ? 'Clean uniform stroke, slight endpoint thinning' :
                  s === 'fineliner' ? 'Thin uniform stroke, hard caps' :
                  s === 'pencil-hb' ? 'Mild width variation, light grain' :
                  s === 'pencil-2b' ? 'Stronger width variation, heavier grain' :
                  s === 'felt-tip' ? 'Thicker uniform stroke, soft caps' :
                  s === 'chisel' ? 'Strong width variation along stroke (calligraphic)' :
                  'Heavy variable width, edge-jittered grain'
                })) }]} onChange={(v) => setMod('penTip', v as PenTipStep)} width={140} popoverWidth={360} />}
              </div>
              {/* CLUSTER 3 — Shading (per I-13). Smart Hachure axes; fillStyle =
                  mark grammar master, hachureGap/Angle/Density are sub-toggles
                  conditional on fillStyle requiring hachure. */}
              {(has('fillStyle') || has('hachureGap') || has('hachureAngle') || has('fillDensity')) && (
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 12 }}>
                  <span style={{ ...labelStyle, marginRight: 8 }}>Shading cluster</span>
                  {has('fillStyle')    && <Dropdown label="Fill style" value={mods.fillStyle} sections={[{ heading: 'Fill style', options: FILL_STYLE_STEPS.map((s) => ({ value: s, label: s })) }]} onChange={(v) => setMod('fillStyle', v as FillStyleStep)} width={140} popoverWidth={240} />}
                  {has('hachureGap')   && (mods.fillStyle === 'hachure' || mods.fillStyle === 'cross-hatch' || mods.fillStyle === 'zigzag-line' || mods.fillStyle === 'zigzag' || mods.fillStyle === 'dashed') && <Slider label="Hachure gap" value={mods.hachureGap}   min={SLIDER_SPECS.hachureGap.min}   max={SLIDER_SPECS.hachureGap.max}   step={SLIDER_SPECS.hachureGap.step}   unit="px" onChange={(v) => setMod('hachureGap', v)} />}
                  {/* Hachure angle applies to fill styles that orient parallel lines.
                      Per F3-shading-calibration-spec §6.6: hachure / cross-hatch / dashed /
                      zigzag-line all use angle. dots / zigzag / solid / none ignore it. */}
                  {has('hachureAngle') && (mods.fillStyle === 'hachure' || mods.fillStyle === 'cross-hatch' || mods.fillStyle === 'dashed' || mods.fillStyle === 'zigzag-line') && <Slider label="Hachure angle" value={mods.hachureAngle} min={SLIDER_SPECS.hachureAngle.min} max={SLIDER_SPECS.hachureAngle.max} step={SLIDER_SPECS.hachureAngle.step} unit="°"  onChange={(v) => setMod('hachureAngle', v)} />}
                  {has('fillDensity')  && mods.fillStyle !== 'none' && <Slider label="Fill density" value={mods.fillDensity}  min={SLIDER_SPECS.fillDensity.min}  max={SLIDER_SPECS.fillDensity.max}  step={SLIDER_SPECS.fillDensity.step} onChange={(v) => setMod('fillDensity', v)} />}
                </div>
              )}
              {/* CLUSTER 4 — Surface Texture (per I-13). Texture filter axis;
                  controls substrate/grain/bleed effects layered ON TOP of
                  mark geometry. Also houses risograph-register-specific axes. */}
              {(has('blurAmount') || has('bleed') || has('dotSize') || has('dotSpacing') || has('dotScatter') || has('dotPattern') || has('grainIntensity') || has('smudgeAmount') || has('pressureVariance') || has('offsetDistance') || has('offsetAngle') || has('colorShift') || has('registrationError')) && (
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 12 }}>
                  <span style={{ ...labelStyle, marginRight: 8 }}>Surface Texture cluster</span>
                  {has('blurAmount')        && <Slider label="Blur amount"   value={mods.blurAmount}        min={SLIDER_SPECS.blurAmount.min}        max={SLIDER_SPECS.blurAmount.max}        step={SLIDER_SPECS.blurAmount.step}        onChange={(v) => setMod('blurAmount', v)} />}
                  {has('bleed')             && <Slider label="Bleed"         value={mods.bleed}             min={SLIDER_SPECS.bleed.min}             max={SLIDER_SPECS.bleed.max}             step={SLIDER_SPECS.bleed.step}             onChange={(v) => setMod('bleed', v)} />}
                  {has('dotSize')           && <Slider label="Dot size"      value={mods.dotSize}           min={SLIDER_SPECS.dotSize.min}           max={SLIDER_SPECS.dotSize.max}           step={SLIDER_SPECS.dotSize.step}           onChange={(v) => setMod('dotSize', v)} />}
                  {has('dotSpacing')        && <Slider label="Dot spacing"   value={mods.dotSpacing}        min={SLIDER_SPECS.dotSpacing.min}        max={SLIDER_SPECS.dotSpacing.max}        step={SLIDER_SPECS.dotSpacing.step}        unit="px" onChange={(v) => setMod('dotSpacing', v)} />}
                  {has('dotScatter')        && <Slider label="Dot scatter"   value={mods.dotScatter}        min={SLIDER_SPECS.dotScatter.min}        max={SLIDER_SPECS.dotScatter.max}        step={SLIDER_SPECS.dotScatter.step}        onChange={(v) => setMod('dotScatter', v)} />}
                  {has('dotPattern')        && <Dropdown label="Dot pattern" value={mods.dotPattern} sections={[{ heading: 'Dot pattern', options: DOT_PATTERN_STEPS.map((s) => ({ value: s, label: s })) }]} onChange={(v) => setMod('dotPattern', v as DotPatternStep)} width={140} popoverWidth={220} />}
                  {has('grainIntensity')    && <Slider label="Grain"         value={mods.grainIntensity}    min={SLIDER_SPECS.grainIntensity.min}    max={SLIDER_SPECS.grainIntensity.max}    step={SLIDER_SPECS.grainIntensity.step}    onChange={(v) => setMod('grainIntensity', v)} />}
                  {has('smudgeAmount')      && <Slider label="Smudge"        value={mods.smudgeAmount}      min={SLIDER_SPECS.smudgeAmount.min}      max={SLIDER_SPECS.smudgeAmount.max}      step={SLIDER_SPECS.smudgeAmount.step}      onChange={(v) => setMod('smudgeAmount', v)} />}
                  {has('pressureVariance')  && <Slider label="Pressure var"  value={mods.pressureVariance}  min={SLIDER_SPECS.pressureVariance.min}  max={SLIDER_SPECS.pressureVariance.max}  step={SLIDER_SPECS.pressureVariance.step}  onChange={(v) => setMod('pressureVariance', v)} />}
                  {has('offsetDistance')    && <Slider label="Offset dist"   value={mods.offsetDistance}    min={SLIDER_SPECS.offsetDistance.min}    max={SLIDER_SPECS.offsetDistance.max}    step={SLIDER_SPECS.offsetDistance.step}    unit="px" onChange={(v) => setMod('offsetDistance', v)} />}
                  {has('offsetAngle')       && <Slider label="Offset angle"  value={mods.offsetAngle}       min={SLIDER_SPECS.offsetAngle.min}       max={SLIDER_SPECS.offsetAngle.max}       step={SLIDER_SPECS.offsetAngle.step}       unit="°"  onChange={(v) => setMod('offsetAngle', v)} />}
                  {has('colorShift')        && <Slider label="Color shift"   value={mods.colorShift}        min={SLIDER_SPECS.colorShift.min}        max={SLIDER_SPECS.colorShift.max}        step={SLIDER_SPECS.colorShift.step}        onChange={(v) => setMod('colorShift', v)} />}
                  {/* §7.B-3: Riso secondary color — user picks which palette token
                      drives the offset layer. 'source' falls back to accent at render. */}
                  {has('risoSecondaryColor') && <Dropdown label="Riso 2nd color" value={mods.risoSecondaryColor} sections={[{ heading: 'Risograph secondary-layer color', options: PALETTE_MODE_STEPS.map((s) => ({ value: s, label: s, detail: s === 'source' ? 'Falls back to accent (riso needs a contrasting secondary)' : `Secondary layer renders in var(--dir-${s === 'neutral' ? 'text-body' : s})` })) }]} onChange={(v) => setMod('risoSecondaryColor', v as PaletteModeStep)} width={160} popoverWidth={340} />}
                  {has('registrationError') && <Slider label="Reg. error"    value={mods.registrationError} min={SLIDER_SPECS.registrationError.min} max={SLIDER_SPECS.registrationError.max} step={SLIDER_SPECS.registrationError.step} onChange={(v) => setMod('registrationError', v)} />}
                </div>
              )}
              {/* CLUSTER 5 — Color/Palette (per I-13). Ink intensity master,
                  per-axis palette overrides. Mostly orthogonal to Clusters 1-4. */}
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 12 }}>
                <span style={{ ...labelStyle, marginRight: 8 }}>Color/Palette cluster</span>
                {has('inkIntensity') && <Slider label="Ink intensity" value={mods.inkIntensity} min={SLIDER_SPECS.inkIntensity.min} max={SLIDER_SPECS.inkIntensity.max} step={SLIDER_SPECS.inkIntensity.step} onChange={(v) => setMod('inkIntensity', v)} />}
                {has('fillOpacity')  && <Slider label="Fill opacity"  value={mods.fillOpacity}  min={SLIDER_SPECS.fillOpacity.min}  max={SLIDER_SPECS.fillOpacity.max}  step={SLIDER_SPECS.fillOpacity.step} onChange={(v) => setMod('fillOpacity', v)} />}
                {has('paletteMode')  && (
                  <>
                    <Dropdown label="Stroke palette" value={mods.strokePalette} sections={[{ heading: 'Stroke (outline) color', options: PALETTE_MODE_STEPS.map((s) => ({ value: s, label: s, detail: s === 'source' ? 'Use the SVG source colors (default)' : `Override ALL strokes to var(--dir-${s === 'neutral' ? 'text-body' : s})` })) }]} onChange={(v) => setMod('strokePalette', v as PaletteModeStep)} width={160} popoverWidth={320} />
                    <Dropdown label="Fill palette" value={mods.fillPalette} sections={[{ heading: 'Fill color', options: PALETTE_MODE_STEPS.map((s) => ({ value: s, label: s, detail: s === 'source' ? 'Use the SVG source fills (default)' : `Override ALL fills to var(--dir-${s === 'neutral' ? 'text-body-soft' : s})` })) }]} onChange={(v) => setMod('fillPalette', v as PaletteModeStep)} width={160} popoverWidth={320} />
                  </>
                )}
                {/* Texture dropdown — hidden for wet-ink + charcoal (§7.B-10): those
                    styles have their own dynamic filter chains that override any
                    texture-recipe selection, so exposing the dropdown is dishonest. */}
                {has('texture') && svgStyle !== 'wet-ink' && svgStyle !== 'charcoal' && <Dropdown label="Texture" value={mods.texture}     sections={[{ heading: 'Texture', options: TEXTURE_STEPS.map((s) => ({ value: s, label: s })) }]} onChange={(v) => setMod('texture', v as TextureStep)} width={150} popoverWidth={260} />}
                {/* Texture intensity — visible whenever texture is active OR when style
                    has its own filter chain consuming it (wet-ink, charcoal per §7.B-11). */}
                {has('textureIntensity') && (mods.texture !== 'none' || svgStyle === 'wet-ink' || svgStyle === 'charcoal') && <Slider label="Texture intensity" value={mods.textureIntensity} min={SLIDER_SPECS.textureIntensity.min} max={SLIDER_SPECS.textureIntensity.max} step={SLIDER_SPECS.textureIntensity.step} onChange={(v) => setMod('textureIntensity', v)} />}
                <button
                  onClick={() => {
                    const next = applyStylePreset(mods, svgStyle);
                    Object.keys(next).forEach((k) => {
                      const key = k as keyof typeof next;
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      setMod(key, (next as any)[key]);
                    });
                  }}
                  title={`Reset modifiers to the ${svgStyle} style preset`}
                  style={{
                    padding: '4px 10px',
                    border: '1px solid var(--dir-border)',
                    backgroundColor: 'transparent',
                    color: 'var(--dir-text-secondary)',
                    fontFamily: IS,
                    fontSize: 10,
                    fontWeight: 500,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    borderRadius: 12,
                  }}
                >
                  Reset to preset
                </button>
              </div>
            </>
          );
        })()}
      </div>

      <Outlet />
    </div>
  );
}
