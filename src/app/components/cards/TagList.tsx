import React from 'react';
import { IS } from './tokens';
import { useTagStyle, type TagStyleMode } from '../../state/TagStyleContext';

type Align = 'left' | 'right';

export function TagList({
  tags,
  typeTag,
  max,
  align = 'left',
  size = 'normal',
  nativeMode = 'pill-outline',
}: {
  tags: string[];
  typeTag?: string;
  max?: number;
  align?: Align;
  size?: 'compact' | 'normal';
  nativeMode?: TagStyleMode;
}) {
  const { mode: ctxMode } = useTagStyle();
  const mode: TagStyleMode = ctxMode === 'auto' ? nativeMode : ctxMode;
  if (mode === 'hidden') return null;

  const pad = '2px 8px';
  const fs = size === 'compact' ? 10 : 11;

  if (mode === 'typeTag') {
    if (!typeTag) return null;
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: pad,
            fontFamily: IS,
            fontSize: fs,
            fontWeight: 500,
            color: 'var(--dir-text-secondary)',
            backgroundColor: 'var(--dir-chip-bg)',
            border: '1px solid var(--dir-chip-border)',
            borderRadius: 9999,
          }}
        >
          {typeTag}
        </span>
      </div>
    );
  }

  const list = typeof max === 'number' ? tags.slice(0, max) : tags;
  if (!list.length) return null;

  if (mode === 'pill-outline' || mode === 'pill-filled') {
    const filled = mode === 'pill-filled';
    return (
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
        }}
      >
        {list.map((t) => (
          <span
            key={t}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: pad,
              fontFamily: IS,
              fontSize: fs,
              fontWeight: 500,
              color: 'var(--dir-text-secondary)',
              backgroundColor: filled ? 'var(--dir-recessed)' : 'var(--dir-chip-bg)',
              border: filled ? '1px solid transparent' : '1px solid var(--dir-chip-border)',
              borderRadius: 9999,
            }}
          >
            {t}
          </span>
        ))}
      </div>
    );
  }

  if (mode === 'slash' || mode === 'dot') {
    const sep = mode === 'slash' ? ' / ' : ' · ';
    return (
      <p
        style={{
          fontFamily: IS,
          fontSize: fs,
          fontWeight: 500,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--dir-text-secondary)',
          margin: 0,
          textAlign: align,
        }}
      >
        {list.join(sep)}
      </p>
    );
  }

  if (mode === 'bracket') {
    return (
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
        }}
      >
        {list.map((t) => (
          <span
            key={t}
            style={{
              fontFamily: IS,
              fontSize: fs,
              fontWeight: 500,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--dir-text-secondary)',
            }}
          >
            [{t}]
          </span>
        ))}
      </div>
    );
  }

  // underline
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        columnGap: 12,
        rowGap: 4,
        justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
      }}
    >
      {list.map((t) => (
        <span
          key={t}
          style={{
            fontFamily: IS,
            fontSize: fs,
            fontWeight: 500,
            color: 'var(--dir-text-secondary)',
            textDecoration: 'underline',
            textUnderlineOffset: 3,
            textDecorationThickness: 1,
            textDecorationColor: 'var(--dir-border)',
          }}
        >
          {t}
        </span>
      ))}
    </div>
  );
}
