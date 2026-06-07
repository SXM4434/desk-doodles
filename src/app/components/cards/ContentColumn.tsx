import React from 'react';
import { useCardFrame } from '../../state/CardFrameContext';

// Outer content-column wrapper. Owns flex:1 (fills remaining space in a
// horizontal CardFrame), flex-direction: column, gap (cross-section rhythm),
// padding (shell-authored), and minHeight (horizontal shells only).
// minWidth:0 is defensive — prevents overflow at narrow page margins.
//
// paddingPolicy controls what happens to padding when cardFrame is explicitly
// set to 'off' (via toolbar or preset cascade):
//   - 'framed'    : keep full padding (shells that stay inset even unframed)
//   - 'bleed-x'   : drop horizontal padding on EXTERNAL x-edges only. The
//                   edge adjacent to media (see `mediaEdge`) is internal —
//                   its padding is preserved so the gap between media and
//                   content never collapses under cardFrame='off' + any
//                   divider state.
//   - 'bleed-all' : drop padding on ALL external edges. Only the edge
//                   adjacent to media (if any) retains its padding.
//
// Context 'native' or 'on' both count as frame-on for padding purposes; only
// an explicit 'off' triggers the policy.

type PaddingPolicy = 'framed' | 'bleed-x' | 'bleed-all';
type MediaEdge = 'left' | 'top' | 'right' | 'bottom';

export function ContentColumn({
  gapC,
  padding = 48,
  paddingPolicy = 'framed',
  mediaEdge,
  minHeight,
  style,
  children,
}: {
  gapC: number;
  padding?: number;
  paddingPolicy?: PaddingPolicy;
  mediaEdge?: MediaEdge;
  minHeight?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const { state: cardFrameState } = useCardFrame();
  const frameOff = cardFrameState === 'off';
  let resolvedPadding: string | number = padding;
  if (frameOff) {
    if (paddingPolicy === 'bleed-x') {
      const leftPad = mediaEdge === 'left' ? padding : 0;
      const rightPad = mediaEdge === 'right' ? padding : 0;
      resolvedPadding = `${padding}px ${rightPad}px ${padding}px ${leftPad}px`;
    } else if (paddingPolicy === 'bleed-all') {
      const topPad = mediaEdge === 'top' ? padding : 0;
      const rightPad = mediaEdge === 'right' ? padding : 0;
      const bottomPad = mediaEdge === 'bottom' ? padding : 0;
      const leftPad = mediaEdge === 'left' ? padding : 0;
      resolvedPadding = `${topPad}px ${rightPad}px ${bottomPad}px ${leftPad}px`;
    }
  }
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: gapC,
        padding: resolvedPadding,
        minHeight,
        minWidth: 0,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
