import React from 'react';

// Grouping wrapper inside ContentColumn. Atoms inside the section share a
// single `gapWithin` rhythm. Cross-section spacing is owned by ContentColumn's
// flex gap; Section carries no bottom margin of its own.
//
// Part of the Homepage Surfaces v2 compositional rewrite: replaces per-atom
// `marginBottom` values that previously collapsed under flex `space-between`
// pressure (see homepage-surfaces-v2-compositional-rules-plan.md).
export function Section({
  gapWithin,
  style,
  children,
}: {
  gapWithin: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: gapWithin,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
