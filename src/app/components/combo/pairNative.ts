// Pair-native resolvers for the Combo Lab.
//
// Every axis has a deterministic rule that takes (layoutCandidate,
// surfaceCandidate) and returns a concrete axis value. No per-pair lookup
// table, no hand tuning — the rule alone is what we stand behind.
//
// Rules:
//   margin : gutter-dominant, wider-of-gutters. If either authored an m-token,
//            that token wins over 'centered'. If both authored m-tokens, the
//            larger MARGIN_VALUES pixel value wins. If both are 'centered',
//            centered.
//   cta    : most-suppressed-wins. Combining 'visible|quiet|none' intents
//            can never produce a louder CTA than either authored.
//   media  : real-asset-wins. If either authored real-asset, the pair needs
//            real media.
//   tags   : 'auto' — surfaces author tag style per TagList atom (via
//            nativeMode prop), sometimes differing between featured and
//            standard atoms within one surface. 'auto' tells every TagList
//            to render its authored native. No layout contribution — layouts
//            don't author tags.

import { MARGIN_VALUES, type MarginToken } from '../../state/MarginContext';
import type { CtaMode } from '../../state/CtaContext';
import type { MediaTruth } from '../../state/MediaTruthContext';
import type { TagStyle } from '../../state/TagStyleContext';
import type { Candidate } from '../layouts/candidates';
import type { SurfaceCandidate } from '../surfaces/candidates';

// ── Margin ─────────────────────────────────────────────────────────────────

export function resolvePairMargin(
  layout: Candidate,
  surface: SurfaceCandidate,
): MarginToken {
  const L = layout.nativeMargin;
  const S = surface.nativeMargin;

  if (L === 'centered' && S === 'centered') return 'centered';
  if (L === 'centered') return S;
  if (S === 'centered') return L;

  // Both are authored m-tokens — pick the wider (larger pixel value).
  return MARGIN_VALUES[L] >= MARGIN_VALUES[S] ? L : S;
}

// ── CTA ────────────────────────────────────────────────────────────────────
//
// Candidate `defaultCta` values are 'visible' | 'quiet' | 'none'.
// Existing mapLegacyCta (LabShell) maps those to CtaMode:
//   visible → 'auto'   (shell-native per PillCTA nativeMode prop)
//   quiet   → 'text'   (muted text link)
//   none    → 'hidden' (all PillCTAs suppressed)

type LegacyCta = 'visible' | 'quiet' | 'none';

export function resolvePairCta(
  layout: Candidate,
  surface: SurfaceCandidate,
): CtaMode {
  const most = mostSuppressedCta(layout.defaultCta, surface.defaultCta);
  return legacyCtaToMode(most);
}

function mostSuppressedCta(a: LegacyCta, b: LegacyCta): LegacyCta {
  if (a === 'none' || b === 'none') return 'none';
  if (a === 'quiet' || b === 'quiet') return 'quiet';
  return 'visible';
}

function legacyCtaToMode(l: LegacyCta): CtaMode {
  return l === 'visible' ? 'auto' : l === 'quiet' ? 'text' : 'hidden';
}

// ── Media ──────────────────────────────────────────────────────────────────

export function resolvePairMedia(
  layout: Candidate,
  surface: SurfaceCandidate,
): MediaTruth {
  return layout.defaultMedia === 'real-asset' ||
    surface.defaultMedia === 'real-asset'
    ? 'real-asset'
    : 'structural-placeholder';
}

// ── Tags ───────────────────────────────────────────────────────────────────
//
// Per-atom-authored. 'auto' tells every TagList to render its nativeMode
// prop, which is what surfaces author directly in their JSX. Different
// atoms in one surface can author different tag modes (T4-S2, T5-S1, T5-S2).

export function resolvePairTags(
  _layout: Candidate,
  _surface: SurfaceCandidate,
): TagStyle {
  return 'auto';
}

// ── Composite ──────────────────────────────────────────────────────────────

export type PairNativeResolved = {
  margin: MarginToken;
  cta: CtaMode;
  media: MediaTruth;
  tags: TagStyle;
};

export function resolvePairNative(
  layout: Candidate,
  surface: SurfaceCandidate,
): PairNativeResolved {
  return {
    margin: resolvePairMargin(layout, surface),
    cta: resolvePairCta(layout, surface),
    media: resolvePairMedia(layout, surface),
    tags: resolvePairTags(layout, surface),
  };
}
