import type { CSSProperties } from 'react';
import { IS, ISe } from './tokens';
import { useTitleRegister } from '../../state/TitleRegisterContext';
import { useCaptionRegister } from '../../state/CaptionRegisterContext';
import { useDivider } from '../../state/DividerContext';
import { useImageTreatment } from '../../state/ImageTreatmentContext';
import { useDensity } from '../../state/DensityContext';
import {
  useAspectVariance,
  ASPECT_VARIANCE_RATIO,
  type AspectVarianceState,
} from '../../state/AspectVarianceContext';
import { useShippedProof } from '../../state/ShippedProofContext';
import { useCardFrame } from '../../state/CardFrameContext';
import { useProofPlacement, type ProofPlacementMode } from '../../state/ProofPlacementContext';

// Shared identity-axis style hooks. Each hook reads its context and, when the
// state is 'native', falls back to the shell's authored baseline (mirrors the
// CardFrame nativeMode pattern). Callers merge the returned style into their
// existing inline styles. Hooks return style deltas, not full declarations —
// shell-authored marginBottom / fontSize stay intact unless the register
// explicitly needs to reshape them.

type TitleNative = 'default' | 'ise-italic' | 'small-caps';
export function useTitleStyle(nativeMode: TitleNative = 'default'): CSSProperties {
  const { state } = useTitleRegister();
  const effective = state === 'native' ? nativeMode : state;
  if (effective === 'ise-italic') {
    return {
      fontFamily: ISe,
      fontStyle: 'italic',
      fontWeight: 400,
      letterSpacing: '-0.02em',
    };
  }
  if (effective === 'small-caps') {
    return {
      fontFamily: IS,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      fontWeight: 500,
    };
  }
  return {};
}

type CaptionNative = 'default' | 'small-caps';
export function useCaptionStyle(nativeMode: CaptionNative = 'default'): CSSProperties {
  const { state } = useCaptionRegister();
  const effective = state === 'native' ? nativeMode : state;
  if (effective === 'small-caps') {
    return {
      fontFamily: IS,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      fontSize: 11,
      fontWeight: 500,
    };
  }
  return {};
}

type DividerNative = 'none' | 'section' | 'inline';
// Returns a CSS border value — apply with borderRight / borderBottom / borderTop
// at the call site. 'none' returns 'none' so the caller substitutes it
// directly into the same property they were setting before.
export function useDividerBorder(nativeMode: DividerNative = 'section'): string {
  const { state } = useDivider();
  const effective = state === 'native' ? nativeMode : state;
  if (effective === 'none') return 'none';
  if (effective === 'inline') return '1px dashed var(--dir-border)';
  return '1px solid var(--dir-border)';
}

type DensityNative = 'default' | 'compact' | 'content-forward';
// Featured-register content padding. 'compact' tightens the content column's
// inner padding; 'content-forward' keeps padding but is paired with a narrower
// media split (see useDensityFeaturedSplit) so the content column wins area.
export function useDensityFeaturedPadding(nativeMode: DensityNative = 'default'): number {
  const { state } = useDensity();
  const effective = state === 'native' ? nativeMode : state;
  if (effective === 'compact') return 32;
  return 48;
}

// Standard-register content padding. 'compact' drops Standard cards to 12px,
// matching the locked Dense Component value (`spacing-layout-rhythm.md:78`).
export function useDensityStandardPadding(nativeMode: DensityNative = 'default'): number {
  const { state } = useDensity();
  const effective = state === 'native' ? nativeMode : state;
  if (effective === 'compact') return 12;
  return 24;
}

// Featured horizontal split — the media column's width. 'content-forward'
// narrows the media column to 40%, letting type carry more of the scan.
export function useDensityFeaturedSplit(nativeMode: DensityNative = 'default'): string {
  const { state } = useDensity();
  const effective = state === 'native' ? nativeMode : state;
  if (effective === 'content-forward') return '40%';
  return '52%';
}

// Featured-register title type. 'compact' compresses 32→22, 1.15→1.25,
// -0.025em→-0.015em — the narrow-4 register lock. Returned as a style delta
// the shell spreads after its baseline declaration so the compressed values
// override cleanly.
export function useDensityFeaturedTitle(nativeMode: DensityNative = 'default'): CSSProperties {
  const { state } = useDensity();
  const effective = state === 'native' ? nativeMode : state;
  if (effective === 'compact') {
    return { fontSize: 22, lineHeight: 1.25, letterSpacing: '-0.015em' };
  }
  return {};
}

// Featured-register body type. 'compact' compresses 15→13, 1.7→1.55. Spread
// after the shell's baseline body style.
export function useDensityFeaturedBody(nativeMode: DensityNative = 'default'): CSSProperties {
  const { state } = useDensity();
  const effective = state === 'native' ? nativeMode : state;
  if (effective === 'compact') {
    return { fontSize: 13, lineHeight: 1.55 };
  }
  return {};
}

// Framing field choice — picks which of project.framingFull / framingCompressed
// / framingEditorial the shell renders. 'compact' density swaps to compressed
// framing; the narrow-4 register lock applies this on featured shells.
type FramingChoice = 'full' | 'compressed' | 'editorial';
export function useDensityFramingChoice(nativeMode: FramingChoice = 'full'): FramingChoice {
  const { state } = useDensity();
  if (state === 'native') return nativeMode;
  if (state === 'compact') return 'compressed';
  return nativeMode;
}

type AspectVarianceNative = 'uniform' | 'authored';
// Returns a CSS aspectRatio override string (or undefined when uniform — fall
// through to the media atom's intrinsic aspect). 'authored' produces the
// per-slot rhythm declared on the call site; 'uniform' lets the asset pool's
// intrinsic aspect drive every card. 'fill-cell' returns 'auto' — the shell
// reads this as a sentinel to flex-fill the media within a constrained cell
// (matches FH-A's narrow-3 image read). Fixed-ratio modes (cinematic /
// widescreen / golden / square / portrait / academy / anamorphic /
// vertical-half) force every media slot to a single ratio regardless of what
// the surface authored.
//
// Optional `state` arg overrides the global AspectVariance state. Used by the
// narrow-4 register-scoped hooks so featured / standard cards can resolve from
// their own contexts without losing the same authored-aspect math.
export function useAuthoredAspect(
  authoredAspect: string,
  nativeMode: AspectVarianceNative = 'uniform',
  stateOverride?: AspectVarianceState,
): string | undefined {
  const { state: globalState } = useAspectVariance();
  const state = stateOverride ?? globalState;
  const effective = state === 'native' ? nativeMode : state;
  if (effective === 'authored') return authoredAspect;
  if (effective === 'uniform') return undefined;
  if (effective === 'fill-cell') return 'auto';
  return ASPECT_VARIANCE_RATIO[effective];
}

// Proof visibility — returns a boolean. Shells use ProofBlock (which reads
// ShippedProof + ProofPlacement directly). Inline surfaces that already render
// their own proof DOM use this hook to gate that render on the toggle, without
// replacing the whole proof layout. Native baseline per-surface.
type ProofVisibleNative = 'on' | 'off';
export function useProofVisible(nativeMode: ProofVisibleNative = 'on'): boolean {
  const { state } = useShippedProof();
  const effective = state === 'native' ? nativeMode : state;
  return effective === 'on';
}

// Card-frame visibility — returns a boolean. Shells use CardFrame (which reads
// CardFrameContext directly via its own nativeMode prop). Inline surfaces that
// draw their own outer chrome call this hook to gate that chrome on the axis.
// Surfaces whose concept is inherently unbounded (T6-S5, T8-*) pass 'off'; the
// framed registers (T1-S2, T3-S1, T4-S1, T4-S2) pass 'on'.
type CardFrameVisibleNative = 'on' | 'off';
export function useCardFrameVisible(nativeMode: CardFrameVisibleNative = 'on'): boolean {
  const { state } = useCardFrame();
  const effective = state === 'native' ? nativeMode : state;
  return effective === 'on';
}

// Cross-section rhythm derived from density + divider axes. Shells consume gapC
// (between Section groups in the ContentColumn), gapW (between atoms inside a
// Section), and minHeightFactor (which lets horizontal shells compress their
// minHeight under compact density). When divider='none' the gapC bumps up by
// one ladder step so whitespace substitutes for the missing rule — dividers
// are punctuation; their absence is compensated by breathing room, not by
// collapse. Featured and Standard registers use different baseline magnitudes:
// Featured packs 32/24/12 (default/compact/within); Standard packs 16/12/10.
type RhythmRegister = 'featured' | 'standard';
export function useRhythm(register: RhythmRegister = 'featured'): {
  gapC: number;
  gapW: number;
  minHeightFactor: 'full' | 'reduced';
} {
  const { state: densityState } = useDensity();
  const { state: dividerState } = useDivider();
  const density = densityState === 'native' ? 'default' : densityState;
  const divider = dividerState === 'native' ? 'section' : dividerState;
  const baseGapC =
    register === 'standard'
      ? density === 'compact'
        ? 12
        : 16
      : density === 'compact'
        ? 16
        : 24;
  const dividerBoost = divider === 'none' ? (register === 'standard' ? 4 : 16) : 0;
  const gapC = baseGapC + dividerBoost;
  const gapW =
    register === 'standard'
      ? density === 'compact'
        ? 8
        : 8
      : density === 'compact'
        ? 8
        : 8;
  const minHeightFactor: 'full' | 'reduced' =
    density === 'compact' ? 'reduced' : 'full';
  return { gapC, gapW, minHeightFactor };
}

// Resolves the ProofPlacement 'native' sentinel to the shell's authored native.
// Mirrors the CardFrame nativeMode pattern used across this module.
export function useProofPlacementMode(
  nativeMode: ProofPlacementMode = 'stack-grid',
): ProofPlacementMode {
  const { state } = useProofPlacement();
  return state === 'native' ? nativeMode : state;
}

type ImageTreatmentNative = 'plain' | 'framed' | 'double-frame' | 'mat';
// Returns a style delta applied to the container div that wraps the Media
// atom. 'plain' is the shell's authored baseline — no border, no padding,
// no ground. The other three treatments are additive decorations, not
// full-card frames — CardFrame already owns the card's outer chrome.
export function useImageTreatmentStyle(
  nativeMode: ImageTreatmentNative = 'plain',
): CSSProperties {
  const { state } = useImageTreatment();
  const effective = state === 'native' ? nativeMode : state;
  if (effective === 'framed') {
    return { border: '1px solid var(--dir-border)' };
  }
  if (effective === 'double-frame') {
    return {
      border: '1px solid var(--dir-border)',
      outline: '1px solid var(--dir-border)',
      outlineOffset: 3,
    };
  }
  if (effective === 'mat') {
    return { backgroundColor: 'var(--dir-muted)', padding: 12 };
  }
  return {};
}
