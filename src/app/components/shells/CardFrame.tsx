import React from 'react';
import { useCardFrame } from '../../state/CardFrameContext';

// T1-S1 Explicit Container Baseline:
// visible border at full W1 border-token strength + surface-raised differential.
// Card frame toggle (cardFrame axis) — when 'off', the chrome falls away and
// the shell reads as an unbounded register (Tiles family default, or the
// T6-S5 "Case Brief Unbounded" card surface).
export function CardFrame({
  children,
  style,
  nativeMode = 'on',
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  /**
   * The shell's authored baseline for the card-frame chrome. Resolved when
   * the CardFrame context is in 'native' mode. Explicit context values
   * ('on' | 'off') override the native baseline.
   */
  nativeMode?: 'on' | 'off';
}) {
  const { state } = useCardFrame();
  const effective = state === 'native' ? nativeMode : state;

  if (effective === 'off') {
    return (
      <div
        style={{
          display: 'flex',
          ...style,
        }}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: 'var(--dir-raised)',
        border: '1px solid var(--dir-border)',
        overflow: 'hidden',
        display: 'flex',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
