import React from 'react';
import { IS } from '../cards/tokens';
import type { EyebrowSegment } from './narrow4ProjectOverrides';

type Register = 'featured' | 'standard';

type Props = {
  segments: EyebrowSegment[];
  register?: Register;
  style?: React.CSSProperties;
};

export function Narrow4Eyebrow({
  segments,
  register = 'featured',
  style,
}: Props) {
  if (!segments.length) return null;
  const size = 10;
  return (
    <p
      style={{
        fontFamily: IS,
        fontSize: size,
        fontWeight: 500,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        lineHeight: 1.4,
        margin: 0,
        ...style,
      }}
    >
      {segments.map((seg, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span style={{ color: 'var(--dir-detail)' }}> · </span>}
          <span
            style={{
              color:
                seg.tier === 'primary'
                  ? 'var(--dir-text-primary)'
                  : 'var(--dir-text-secondary)',
            }}
          >
            {seg.text}
          </span>
        </React.Fragment>
      ))}
    </p>
  );
}
