import React from 'react';
import { useMargin, CENTERED_MAX_WIDTH } from '../../state/MarginContext';

// Shared OUTER PAGE-GUTTER container for the homepage v2 lab.
//
// These primitives own the page frame. They branch on MarginContext.mode:
//
//   - 'centered' (baseline M9): max-width 1120 + margin 0 auto + 48 inner
//     padding — the OG centered-1120 behavior, viewport-responsive, matches
//     the OG exactly on every monitor.
//
//   - 'gutter' (all other states): width 100% + fixed-px outer gutter, no
//     max-width clamp. Content width resolves to (viewport - 2 × gutter)
//     so featured + standard regions re-register from the page edges.
//
// The historical 1120 / 1280 names are retained for import compatibility;
// both behave identically under this axis. Local text-measure caps
// (reading columns, etc.) remain the responsibility of individual
// candidate/surface components.
//
// Vertical padding (24px top, 96px bottom) is the candidate vertical baseline
// and is NOT part of the horizontal gutter axis. 24px top gives a quiet
// breathing beat between GlobalNav and the first card without re-introducing
// the 64px dead zone the prior baseline had. 96px bottom kept as trailing
// space.

function pageFrameStyle(
  mode: 'gutter' | 'centered',
  value: number,
): React.CSSProperties {
  if (mode === 'centered') {
    return {
      maxWidth: CENTERED_MAX_WIDTH,
      margin: '0 auto',
      padding: `24px ${value}px 96px`,
      boxSizing: 'border-box',
    };
  }
  return {
    width: '100%',
    padding: `24px ${value}px 96px`,
    boxSizing: 'border-box',
  };
}

export function Page1120({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const { value, mode } = useMargin();
  return <div style={{ ...pageFrameStyle(mode, value), ...style }}>{children}</div>;
}

export function Page1280({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const { value, mode } = useMargin();
  return <div style={{ ...pageFrameStyle(mode, value), ...style }}>{children}</div>;
}
