import React, { useState } from 'react';
import { IS } from '../cards/tokens';

/**
 * BeforeAfterSlider — editorial before/after image comparison slider.
 *
 * Built 2026-05-24 for §09 Outcomes T3 primary outcome visual anchor.
 *
 * IMPLEMENTATION:
 * - CSS clip-path inset technique (standard pattern per NYT / Wirecutter / Stripe Press
 *   editorial before-after sliders). Top layer (AFTER) is clipped from the left by the
 *   slider position percentage; underneath, the BEFORE layer shows through.
 * - Invisible <input type="range"> overlay for accessibility + drag + keyboard control
 *   (arrow keys move the slider per range input default behavior).
 * - Custom visible divider line + circular handle (centered on the divider, drag-chevron
 *   inside for affordance signal).
 * - Default position 50% — both sides visible equally, establishes "this is comparable"
 *   read at first glance.
 *
 * SYSTEM ADHERENCE (W1 + locked typography):
 * - Container: 1px var(--dir-border) + locked borderRadius + var(--dir-recessed) base
 *   (matches §04 Venn / §05 Funnel / §06 closer artifact wrapper family per F1 Panel
 *   04/06 visual-card pattern, adapted for full-width body-image artifact).
 * - BEFORE layer: --dir-recessed bg + DENSE 13 descriptor at --dir-text-secondary.
 * - AFTER layer: --dir-raised bg (lighter than recessed — signals the "elevated" state)
 *   + DENSE 13 descriptor at --dir-text-secondary.
 * - Divider line: 2px --dir-text-primary (matches §02 hand-drawn mark ink tier for
 *   visual signal weight across any underlying color).
 * - Handle: 32px circle, --dir-bg fill + 1.5px --dir-text-primary border + 2 inner
 *   chevrons in --dir-text-primary. Centered on divider.
 * - BEFORE / AFTER labels: CAPS 10 (IS 10/500/0.12em UC) at --dir-text-primary +
 *   --dir-bg pill chip with --dir-chip-border (matches state-pill register per
 *   operating manual line 484). Positioned top corners.
 *
 * MEDIA §3 COMPLIANCE:
 * - User-controlled drag/keyboard interaction only (no autoplay, no hover-driven
 *   movement, no sound).
 * - Motion is earned via explicit user input per Media §3 hard rule.
 *
 * INTERACTION CUSTOM (§09 sanction needed):
 * - Per Cycle 7 Q4 system principle: interaction axes are sanctioned PER-MODULE via
 *   Cycle 7-style customs. §09 had no sanctioned interaction custom prior to this
 *   component. This slider establishes the FIRST §09 interaction custom: user-controlled
 *   before/after reveal at T3 primary outcome anchor slot. Lock note to be added to
 *   CSML §09 + cross-system-rules customs section in a separate doc-update pass.
 *
 * PLACEHOLDER STATE:
 * - Default props show color-block placeholders with descriptor prose naming what the
 *   eventual artwork will be. Color differentiation (--dir-recessed left vs --dir-raised
 *   right) communicates "two distinct states" until real screenshots land.
 * - To use with real images: pass `beforeImage` + `afterImage` URL props (TODO: add when
 *   real assets exist; for now content is descriptor-text-only via beforeDescriptor /
 *   afterDescriptor props).
 *
 * REFERENCES (researched 2026-05-24 per `feedback_research_before_visual_effects`):
 * - NYT design articles + Wirecutter product comparisons: static-images + drag-only motion
 * - CSS-Tricks clip-path almanac + Emil Kowalski "Magic of Clip Path"
 * - Croct blog: best React before/after slider libraries 2026 review
 * - GoatSlider: before/after slider design patterns
 */
type BeforeAfterSliderProps = {
  beforeLabel?: string;
  afterLabel?: string;
  beforeDescriptor?: string;
  afterDescriptor?: string;
  /** CSS aspect-ratio string (e.g. '16 / 10'). Use natural source aspect once real images land. */
  aspectRatio?: string;
  /** Locked borderRadius value from useGateAIonBorderRadius() context, passed in from shell. */
  borderRadius?: number;
};

const CAPS_INLINE: React.CSSProperties = {
  fontFamily: IS,
  fontSize: 10,
  fontWeight: 500,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
};

const DESCRIPTOR: React.CSSProperties = {
  fontFamily: IS,
  fontSize: 13,
  fontWeight: 400,
  lineHeight: 1.55,
};

export function BeforeAfterSlider({
  beforeLabel = 'Before',
  afterLabel = 'After',
  beforeDescriptor = "Designer's tools split — Figma in one window, Slack thread in another. Context switches lose state with every handoff.",
  afterDescriptor = "Workspace + chat unified. Ruby lives where ideas start; Canvas opens without leaving context.",
  aspectRatio = '16 / 10',
  borderRadius = 8,
}: BeforeAfterSliderProps = {}) {
  const [position, setPosition] = useState(50);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio,
        border: '1px solid var(--dir-border)',
        borderRadius,
        overflow: 'hidden',
        backgroundColor: 'var(--dir-recessed)',
      }}
    >
      {/* BEFORE base layer — fills full width; AFTER layer above clips to reveal */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'var(--dir-recessed)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 40px',
          textAlign: 'center',
          pointerEvents: 'none',
        }}
      >
        <span style={{ ...DESCRIPTOR, color: 'var(--dir-text-secondary)', maxWidth: 420 }}>
          {beforeDescriptor}
        </span>
      </div>

      {/* AFTER layer — clipped from left by slider position; underneath BEFORE shows through */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'var(--dir-raised)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 40px',
          textAlign: 'center',
          pointerEvents: 'none',
          clipPath: `inset(0 0 0 ${position}%)`,
        }}
      >
        <span style={{ ...DESCRIPTOR, color: 'var(--dir-text-secondary)', maxWidth: 420 }}>
          {afterDescriptor}
        </span>
      </div>

      {/* Vertical divider line + circular handle (centered on divider).
          Color: --dir-detail (annotation accents / margin rules role per W1 §H + cross-system-rules). NOT --dir-text-primary (that's title-ink tier, too harsh for UI accent). Matches §06 2-Frame Guardrail Proof callout-list ink discipline.
          Handle: NO box-shadow (W1 is flat editorial; no shadow chrome elsewhere in shell). 1px detail-ink border (softer than the prior 1.5px primary-ink). Chevrons at detail-ink + 1px stroke. */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: `${position}%`,
          width: 1,
          backgroundColor: 'var(--dir-detail)',
          transform: 'translateX(-0.5px)',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 32,
            height: 32,
            borderRadius: '50%',
            backgroundColor: 'var(--dir-bg)',
            border: '1px solid var(--dir-detail)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--dir-detail)',
          }}
        >
          {/* Drag chevrons — inward-pointing pair signaling horizontal drag, at detail-ink for soft UI-accent register */}
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path d="M5 4L2 7L5 10" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9 4L12 7L9 10" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Range input — invisible overlay; captures drag + touch + keyboard (arrow keys) */}
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={position}
        onChange={(e) => setPosition(Number(e.target.value))}
        aria-label={`Compare ${beforeLabel} vs ${afterLabel} — drag to reveal`}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          opacity: 0,
          cursor: 'ew-resize',
          margin: 0,
          padding: 0,
          appearance: 'none',
          WebkitAppearance: 'none',
          background: 'transparent',
        }}
      />

      {/* BEFORE label (top-left) — state-pill register per operating manual line 484 */}
      <span
        style={{
          position: 'absolute',
          top: 12,
          left: 16,
          ...CAPS_INLINE,
          color: 'var(--dir-text-primary)',
          backgroundColor: 'var(--dir-bg)',
          padding: '4px 10px',
          borderRadius: 9999,
          border: '1px solid var(--dir-chip-border)',
          pointerEvents: 'none',
        }}
      >
        {beforeLabel}
      </span>

      {/* AFTER label (top-right) */}
      <span
        style={{
          position: 'absolute',
          top: 12,
          right: 16,
          ...CAPS_INLINE,
          color: 'var(--dir-text-primary)',
          backgroundColor: 'var(--dir-bg)',
          padding: '4px 10px',
          borderRadius: 9999,
          border: '1px solid var(--dir-chip-border)',
          pointerEvents: 'none',
        }}
      >
        {afterLabel}
      </span>
    </div>
  );
}
