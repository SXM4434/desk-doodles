import React from 'react';
import { IS } from './tokens';
import { useCta, type CtaStyleMode } from '../../state/CtaContext';

type Variant = 'primary' | 'outline' | 'text';

// nativeMode is the register-native CTA style declared by the surface.
// The legacy `variant` prop is mapped to the equivalent nativeMode for
// call sites that haven't migrated. When the global CTA context is 'auto'
// the surface renders nativeMode; any explicit context value overrides
// every PillCTA in the app — including 'hidden' natives.
export function PillCTA({
  children,
  variant = 'primary',
  nativeMode,
}: {
  children: React.ReactNode;
  variant?: Variant;
  nativeMode?: CtaStyleMode;
}) {
  const { mode } = useCta();
  const native: CtaStyleMode =
    nativeMode ??
    (variant === 'primary' ? 'pill-filled' : variant === 'outline' ? 'pill-outline' : 'text');
  const effective: CtaStyleMode = mode === 'auto' ? native : mode;
  if (effective === 'hidden') return null;

  if (effective === 'text') {
    return (
      <span
        style={{
          fontFamily: IS,
          fontSize: 12,
          fontWeight: 500,
          color: 'var(--dir-text-secondary)',
          letterSpacing: 0,
        }}
      >
        {children}
      </span>
    );
  }

  if (effective === 'underline') {
    return (
      <span
        style={{
          fontFamily: IS,
          fontSize: 12,
          fontWeight: 500,
          color: 'var(--dir-text-primary)',
          textDecoration: 'underline',
          textUnderlineOffset: 4,
          textDecorationThickness: 1,
          textDecorationColor: 'var(--dir-border)',
          letterSpacing: 0,
        }}
      >
        {children}
      </span>
    );
  }

  if (effective === 'caps') {
    return (
      <span
        style={{
          fontFamily: IS,
          fontSize: 11,
          fontWeight: 500,
          color: 'var(--dir-text-primary)',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}
      >
        {children}
      </span>
    );
  }

  if (effective === 'rect') {
    return (
      <button
        type="button"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '10px 18px',
          fontFamily: IS,
          fontSize: 12,
          fontWeight: 500,
          color: 'var(--dir-cta-text)',
          backgroundColor: 'var(--dir-cta-bg)',
          border: '1px solid var(--dir-cta-bg)',
          borderRadius: 0,
          cursor: 'pointer',
        }}
      >
        {children}
      </button>
    );
  }

  if (effective === 'pill-outline') {
    return (
      <button
        type="button"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '10px 20px',
          fontFamily: IS,
          fontSize: 12,
          fontWeight: 500,
          color: 'var(--dir-text-secondary)',
          backgroundColor: 'transparent',
          border: '1px solid var(--dir-border)',
          borderRadius: 9999,
          cursor: 'pointer',
        }}
      >
        {children}
      </button>
    );
  }

  // pill-filled
  return (
    <button
      type="button"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '10px 20px',
        fontFamily: IS,
        fontSize: 12,
        fontWeight: 500,
        color: 'var(--dir-cta-text)',
        backgroundColor: 'var(--dir-cta-bg)',
        border: '1px solid var(--dir-cta-border)',
        borderRadius: 9999,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}
